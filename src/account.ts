import './styles.css';
import './support.css';
import './info.css';
import { element, header, escapeHtml as esc } from './ui';
import { apiRequest, BackendError, authClient, finishGoogleRedirect, isSignInConfigured, signInWithGoogle } from './backend-client';
import type { CurrentAccount, Collection, EditableService } from '../shared/contracts';

document.title = 'Account — Our Ground';
element<HTMLDivElement>('#app').innerHTML = `<div class="page-shell">${header('account')}<main class="about-main" id="main"><section class="about-hero"><span class="page-eyebrow">OUR GROUND ACCOUNT</span><h1>Welcome to Our Ground.</h1><p>You can browse resources without an account. Organization staff can access records assigned to their team.</p><p id="accountStatus" role="status" aria-live="polite">Loading account…</p><div class="account-actions"><button class="get-started" id="googleSignIn" type="button" hidden>Continue with Google</button><button class="get-started" id="signOut" type="button" hidden>Sign out</button><button class="search-button" id="refreshAccount" type="button" hidden>Try again</button></div><ul id="memberships"></ul></section><section id="staffRecords" class="account-records" hidden><h2>Your service records</h2><div id="serviceList"></div><div class="results-pagination" id="staffPagination"></div></section></main></div>`;
const status = element<HTMLElement>('#accountStatus');
const login = element<HTMLButtonElement>('#googleSignIn');
const logout = element<HTMLButtonElement>('#signOut');
const retry = element<HTMLButtonElement>('#refreshAccount');
let page = 1;
async function loadServices() {
  const records = await apiRequest<Collection<Pick<EditableService,'id'|'title'|'status'|'version'>>>('services?page=' + page,{},true);
  element('#staffRecords').hidden = false;
  element('#serviceList').innerHTML = records.items.length ? records.items.map((r) => `<a class="result-card" href="/staff/services/${encodeURIComponent(r.id)}"><h3>${esc(r.title)}</h3><span>${esc(r.status)} · version ${r.version}</span></a>`).join('') : '<p>No service records have been assigned to this account.</p>';
  element('#staffPagination').innerHTML = records.total ? `<button type="button" id="staffPrevious"${page <= 1 ? ' disabled' : ''}>Previous</button><span>Page ${page}</span><button type="button" id="staffNext"${records.has_next ? '' : ' disabled'}>Next</button>` : '';
  document.querySelector('#staffPrevious')?.addEventListener('click',() => { page--; void loadServices().catch(showError); });
  document.querySelector('#staffNext')?.addEventListener('click',() => { page++; void loadServices().catch(showError); });
}
async function refresh() {
  element('#memberships').replaceChildren(); element('#staffRecords').hidden = true; retry.hidden = true;
  if (!isSignInConfigured()) { status.textContent = 'Sign-in is not available yet. You can still browse resources.'; return; }
  login.disabled = false;
  const {data,error} = await authClient().auth.getSession();
  if (error) throw new Error('Your session could not be read. Please sign in again.');
  login.hidden = Boolean(data.session); logout.hidden = !data.session;
  if (!data.session) { status.textContent = 'Sign in with your Google account.'; return; }
  status.textContent = 'Loading your organization access…';
  const account = await apiRequest<CurrentAccount>('me',{},true);
  status.textContent = account.organizations.length || account.role === 'admin' ? 'You are signed in. Open an assigned service record to edit it.' : 'You are signed in. A project administrator must assign organization access before you can edit records.';
  for (const org of account.organizations) { const item = document.createElement('li'); item.textContent = org.name + ' — editor'; element('#memberships').append(item); }
  await loadServices();
}
function showError(error: unknown) {
  status.textContent = error instanceof Error ? error.message : 'The request could not be completed.';
  retry.hidden = false;
  if (error instanceof BackendError && error.status === 401) login.hidden = false;
}
login.addEventListener('click',() => { login.disabled = true; status.textContent = 'Opening Google sign-in…'; void signInWithGoogle().catch((error) => { showError(error); login.disabled = false; }); });
logout.addEventListener('click',() => { logout.disabled = true; void authClient().auth.signOut({scope:'local'}).then(({error}) => { if (error) throw error; return refresh(); }).catch(showError).finally(() => { logout.disabled = false; }); });
retry.addEventListener('click',() => void refresh().catch(showError));
async function initialize() {
  try { await finishGoogleRedirect(); }
  catch (error) { login.hidden = !isSignInConfigured(); showError(error); return; }
  await refresh();
}
void initialize().catch(showError);
