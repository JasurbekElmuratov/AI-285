import './styles.css';
import './support.css';
import './detail.css';
import { element, header } from './ui';
import { apiRequest, BackendError } from './api-client';
import type { EditableService } from '../shared/contracts';

const id = window.location.pathname.replace(/\/$/,'').split('/').pop() ?? '';
document.title = 'Edit service — Our Ground';
element<HTMLDivElement>('#app').innerHTML = `<div class="page-shell">${header('account')}<main class="detail-main" id="main"><a class="back-link" href="/account">Back to your account</a><h1>Edit service</h1><p id="editStatus" role="status" aria-live="polite">Loading your service record…</p><form id="serviceForm" class="record-form staff-form" hidden><label>Title<input name="title" required minlength="2" maxlength="160" /></label><label>Summary<textarea name="summary" rows="3" maxlength="500"></textarea></label><label>Eligibility<textarea name="eligibility_text" rows="3" maxlength="500"></textarea></label><label>Cost summary<input name="cost_summary" maxlength="500" /></label><label>Publication status<select name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="hidden">Hidden</option></select></label><p>Publishing makes the record visible. It does not verify information or confirm availability.</p><button type="submit" class="search-button" id="saveService">Save changes</button><button type="button" class="search-button" id="reloadService" hidden>Reload latest record (discards unsaved changes)</button><a id="viewResource" class="about-demo-link">View public record</a></form><a id="staffSignIn" class="get-started" href="/account" hidden>Sign in</a></main></div>`;
const form = element<HTMLFormElement>('#serviceForm');
const message = element<HTMLElement>('#editStatus');
const save = element<HTMLButtonElement>('#saveService');
const reload = element<HTMLButtonElement>('#reloadService');
let version = 0;
function field(name: string) { return form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement; }
async function load() {
  message.textContent = 'Loading your service record…'; save.disabled = true;
  try {
    const r = await apiRequest<EditableService>('services/' + encodeURIComponent(id),{},true);
    version = r.version;
    for (const key of ['title','summary','eligibility_text','cost_summary','status'] as const) field(key).value = r[key] ?? '';
    form.hidden = false; reload.hidden = true; save.disabled = false;
    const view = element<HTMLAnchorElement>('#viewResource'); view.href = '/resources/' + encodeURIComponent(id); view.hidden = r.status !== 'published';
    message.textContent = 'Loaded version ' + version + '. Only your assigned organization records can be edited.';
  } catch (error) {
    form.hidden = true;
    message.textContent = error instanceof Error ? error.message : 'This service could not be loaded.';
    element('#staffSignIn').hidden = !(error instanceof BackendError && error.status === 401);
  }
}
form.addEventListener('submit',(event) => {
  event.preventDefault(); save.disabled = true; message.textContent = 'Saving changes…';
  const body = {expected_version:version,title:field('title').value,summary:field('summary').value,eligibility_text:field('eligibility_text').value.trim() || null,cost_summary:field('cost_summary').value.trim() || null,status:field('status').value};
  void apiRequest<{id:string;status:string;version:number}>('services/' + encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(body)},true).then((r) => {
    version = r.version; message.textContent = 'Changes saved. Current version: ' + version + '.'; save.disabled = false;
    element('#viewResource').hidden = r.status !== 'published';
  }).catch((error) => {
    if (error instanceof BackendError && error.status === 409) { message.textContent = 'Another staff member changed this record. Your unsaved text is still here. Reload the latest record before editing again.'; reload.hidden = false; }
    else { message.textContent = error instanceof Error ? error.message : 'Changes could not be saved.'; save.disabled = false; }
  });
});
reload.addEventListener('click',() => void load());
void load();
