import './styles.css';
import './support.css';
import './detail.css';
import { apiRequest, BackendError } from './api-client';
import { categoryName, contactActions, safeReturnPath, safeWebUrl, searchUrl } from './directory';
import { arrow, element, escapeHtml as esc, header, icons, pinIcon } from './ui';
import type { ResourceCard, ResourceDetail } from '../shared/contracts';

const id = window.location.pathname.replace(/\/$/, '').split('/').pop() ?? '';
const returnPath = safeReturnPath(new URLSearchParams(window.location.search).get('return'));
const app = element<HTMLDivElement>('#app');
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const reasons = [['wrong_hours','Hours are incorrect'],['closed','Service may be closed'],['wrong_contact','Contact information is incorrect'],['wrong_eligibility','Eligibility information is incorrect'],['wrong_location','Location is incorrect'],['other','Something else']];
function shell(content: string) { app.innerHTML = `<div class="page-shell">${header()}<main class="detail-main" id="main"><a class="back-link" href="${esc(returnPath)}"><span aria-hidden="true">${arrow}</span>Back to search results</a>${content}</main></div>`; }
function render(resource: ResourceDetail) {
  const demo = resource.data_kind === 'fictional_demo';
  const category = resource.category_slugs.includes('healthcare') ? 'healthcare' : 'food';
  const actions = contactActions(resource);
  const source = demo ? null : safeWebUrl(resource.source.url);
  const sourceDate = resource.source.recorded_at && Number.isFinite(Date.parse(resource.source.recorded_at)) ? new Date(resource.source.recorded_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'America/New_York'}) : null;
  document.title = resource.title + ' — Our Ground';
  const schedule = resource.hours.length ? resource.hours.map((h) => `${weekdays[h.weekday]} ${h.opens_at.slice(0,5)}–${h.closes_at.slice(0,5)}${h.notes ? ' · ' + h.notes : ''}`) : ['Hours not provided.'];
  shell(`<div class="detail-hero"><span class="detail-resource-icon result-icon--${category}">${icons[category]}</span><div><div class="detail-labels"><span class="detail-category"><span class="category-dot category-dot--${category}" aria-hidden="true"></span>${categoryName(category)}</span><span class="example-badge"><span aria-hidden="true"></span>${demo ? 'Fictional demo' : 'Sourced information'}</span></div><h1>${esc(resource.title)}</h1><div class="detail-location">${pinIcon}${esc(resource.location.city)}, PA</div></div></div>
    <p class="detail-description">${esc(resource.summary)}</p>
    <div class="detail-layout"><div class="detail-content">
      <section class="detail-section"><span class="page-eyebrow">SUPPORT OFFERED</span><h2>Service information.</h2><p>${esc(resource.description || 'Further service information has not been provided.')}</p><p>Organization: ${esc(resource.organization.name)}</p></section>
      <details class="detail-accordion" open><summary>Eligibility<span aria-hidden="true">+</span></summary><p>${esc(resource.eligibility_text || 'Eligibility has not been provided. Confirm requirements with the provider.')}</p></details>
      <details class="detail-accordion" open><summary>Before you visit<span aria-hidden="true">+</span></summary><p>${demo ? 'This is a fictional record. No real service is offered at this map point.' : 'Confirm the address, hours, appointment requirements, eligibility and current availability with the provider before visiting.'}</p></details>
      <section class="detail-example-note"><span class="example-note-icon" aria-hidden="true">i</span><div><h2>${demo ? 'You’re exploring a fictional demo.' : 'Confirm information with the provider.'}</h2><p>${demo ? 'This listing, schedule and eligibility are fictional. Contact and directions actions are disabled.' : 'Our Ground has not independently verified this information. Publication does not confirm that a service is operating or accepting clients.'}${source ? ` <a href="${esc(source)}" target="_blank" rel="noopener noreferrer">View information source</a>.` : ''}${sourceDate && !demo ? ` Recorded ${esc(sourceDate)}.` : ''}</p></div></section>
      <details class="detail-accordion report-section"><summary>Report incorrect information<span aria-hidden="true">+</span></summary><form id="correctionForm" class="record-form"><label>What needs correcting?<select name="reason_code" required>${reasons.map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select></label><label>Details (optional)<textarea name="description" maxlength="1000" rows="3"></textarea></label><p>Please describe the listing issue. Don’t include personal health, financial or other sensitive details.</p><button class="search-button" type="submit" id="submitReport">Send report</button><p id="reportStatus" role="status" aria-live="polite"></p></form></details>
    </div><aside class="detail-sidebar" aria-label="Resource at a glance"><div class="at-a-glance"><h2>At a glance</h2><dl><div><dt>${demo ? 'Demo map point' : 'Address'}</dt><dd>${esc(resource.location.address_label)}<span>${esc(resource.location.city)}, PA</span></dd></div><div><dt>${demo ? 'Fictional schedule' : 'Listed hours'} · Eastern time</dt><dd>${schedule.map(esc).join('<br />')}</dd></div><div><dt>Cost</dt><dd>${esc(resource.cost_summary || 'Not provided. Confirm with the provider.')}</dd></div><div><dt>Contact information</dt><dd>${actions.phone ? `<a href="${esc(actions.phone)}">${esc(resource.contact.phone!)}</a>` : 'Phone unavailable.'}${actions.website ? `<span><a href="${esc(actions.website)}" target="_blank" rel="noopener noreferrer">Provider website</a></span>` : ''}</dd></div></dl>${actions.directions ? `<a class="search-button" href="${esc(actions.directions)}" target="_blank" rel="noopener noreferrer">Get directions ${arrow}</a>` : ''}<a class="about-demo-link" href="${esc(searchUrl('all',resource.location.city,25))}">Explore ${esc(resource.location.city)} ${arrow}</a></div><div class="detail-area-map"><div class="detail-live-map" id="detailMap" hidden></div><p>${pinIcon}<span>${esc(resource.location.city)}, PA<small>${demo ? 'Fictional demo point · do not visit' : 'See the address above; confirm before visiting'}</small></span></p></div></aside></div>`);
  element<HTMLFormElement>('#correctionForm').addEventListener('submit',(event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const button = element<HTMLButtonElement>('#submitReport');
    const status = element<HTMLElement>('#reportStatus');
    button.disabled = true; status.textContent = 'Sending report…';
    void apiRequest<{ id:string }>('correction-reports',{method:'POST',body:JSON.stringify({service_id:resource.id,reason_code:data.get('reason_code'),description:String(data.get('description') ?? '').trim() || null})})
      .then(() => { status.textContent = 'Thank you. Your report was received.'; })
      .catch((error) => { status.textContent = error instanceof Error ? error.message : 'The report could not be sent. Please try again.'; button.disabled = false; });
  });
  if (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN) {
    const container = element('#detailMap'); container.hidden = false;
    void import('./resource-map').then(({mountResourceMap}) => {
      const map = mountResourceMap(container,() => { container.hidden = true; });
      const card: ResourceCard = { ...resource,distance_miles:0 };
      map?.update([card],null,() => returnPath);
      window.addEventListener('pagehide',() => map?.remove(),{once:true});
    }).catch(() => { container.hidden = true; });
  }
}
async function load() {
  shell('<div class="empty-state" role="status" aria-live="polite"><h1>Loading resource…</h1><p>Getting service details.</p></div>');
  try { render(await apiRequest<ResourceDetail>('resources/' + encodeURIComponent(id))); }
  catch (error) {
    const notFound = error instanceof BackendError && error.status === 404;
    document.title = notFound ? 'Resource not found — Our Ground' : 'Resource unavailable — Our Ground';
    shell(`<div class="empty-state" role="status"><h1>${notFound ? 'Resource not found.' : 'We couldn’t load this resource.'}</h1><p>${esc(error instanceof Error ? error.message : 'Please try again.')}</p>${notFound ? '' : '<button type="button" class="search-button" id="retryDetail">Try again</button>'}<a class="about-demo-link" href="${esc(returnPath)}">Back to search results</a></div>`);
    document.querySelector('#retryDetail')?.addEventListener('click',() => void load());
  }
}
void load();
