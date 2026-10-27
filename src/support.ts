import './styles.css';
import './support.css';
import { apiRequest } from './api-client';
import { directoryCategories, directoryCategory, categoryName, searchUrl } from './directory';
import { arrow, element, escapeHtml as esc, header, icons, pinIcon, searchIcon } from './ui';
import type { Place, ResourceCard, SearchCategory, SearchResults } from '../shared/contracts';

document.title = 'Find support — Our Ground';
const params = new URLSearchParams(window.location.search);
const radius = Number(params.get('radius_miles') ?? 25);
const state = {
  category: directoryCategory(params.get('category')) as SearchCategory,
  location: params.get('location')?.trim() ?? '', keyword: params.get('q')?.trim() ?? '',
  radius: [5,10,25,50].includes(radius) ? radius : 25,
  page: Math.max(1, Math.min(100000, Math.floor(Number(params.get('page')) || 1))),
  view: Boolean(import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN) && (params.get('view') === 'map' || (!params.has('view') && !window.matchMedia('(max-width: 900px)').matches)) ? 'map' : 'list'
};
const areas = [{ city:'Harrisburg',zip:'17101' }, { city:'Philadelphia',zip:'19102' }];
element<HTMLDivElement>('#app').innerHTML = `
  <div class="page-shell">${header('support')}
    <main class="support-main" id="main">
      <div class="page-intro"><div><span class="page-eyebrow">FIND SUPPORT</span><h1>Help, <span>closer to home.</span></h1><p>Explore food assistance and healthcare in Pennsylvania.</p></div><span class="example-badge"><span aria-hidden="true"></span>Pennsylvania prototype</span></div>
      <div class="search-panel"><form id="locationForm" class="location-form"><label class="location-field"><span class="visually-hidden">City or ZIP code</span>${pinIcon}<input id="locationInput" name="location" type="search" autocomplete="off" list="suggestedCities" placeholder="Pennsylvania city or ZIP code" value="${esc(state.location)}" maxlength="80" /></label><button class="search-button" type="submit">${searchIcon}<span>Search</span></button></form><div class="category-filters" role="group" aria-label="Filter resources by type of support">${directoryCategories.map((c) => `<button type="button" data-category="${c.id}" aria-pressed="${state.category === c.id}">${c.id === 'all' ? '' : `<span class="category-dot category-dot--${c.id}" aria-hidden="true"></span>`}${c.label}</button>`).join('')}</div></div>
      <datalist id="suggestedCities">${areas.map((area) => `<option value="${area.city}">${area.zip}</option>`).join('')}</datalist>
      <div class="city-shortcuts"><span>Try a Pennsylvania area:</span>${areas.map((area) => `<button type="button" data-area="${area.city}">${area.city}</button>`).join('')}<label class="distance-field">Within <select id="radiusInput" aria-label="Search distance">${[5,10,25,50].map((r) => `<option value="${r}"${state.radius === r ? ' selected' : ''}>${r} miles</option>`).join('')}</select></label><button class="clear-location" id="clearLocation" type="button" hidden>Clear location ×</button></div>
      <div class="results-toolbar"><p id="resultsCount" role="status" aria-live="polite"></p><div class="view-switch" role="group" aria-label="Results view"><button type="button" data-view="map">Map & list</button><button type="button" data-view="list">List</button></div></div>
      <div class="support-content" id="supportContent" data-view="${state.view}" data-map-unavailable="true">
        <section class="results-panel" aria-label="Resource results"><label class="keyword-field">${searchIcon}<span class="visually-hidden">Search resource names</span><input id="keywordInput" type="search" placeholder="Search these resources" value="${esc(state.keyword)}" maxlength="100" /></label><div class="resource-results" id="resourceResults"></div><div class="results-pagination" id="pagination"></div></section>
        <section class="support-map api-support-map" aria-label="Pennsylvania resource map"><div id="liveMap" class="live-map"></div><div class="map-empty" id="mapFallback"><p>Map unavailable.</p><span>Use the list to explore matching resources.</span></div><div class="map-caption"><span class="map-caption-dot" aria-hidden="true"></span>Matching resources · current page</div></section>
      </div>
      <p class="support-note">Distances are straight-line estimates. Fictional demo records are labeled and have no usable contact or directions. For sourced listings, confirm details with the provider before visiting.</p>
    </main>
  </div>`;
const locationInput = element<HTMLInputElement>('#locationInput');
const keywordInput = element<HTMLInputElement>('#keywordInput');
const results = element<HTMLElement>('#resourceResults');
const count = element<HTMLElement>('#resultsCount');
const content = element<HTMLElement>('#supportContent');
const pagination = element<HTMLElement>('#pagination');
let current: AbortController | null = null;
let lastItems: ResourceCard[] = [];
let center: Place | null = null;
let map: ReturnType<typeof import('./resource-map').mountResourceMap> = null;
let mapStarted = false;
const currentUrl = () => searchUrl(state.category,state.location,state.radius,state.keyword,state.page,state.view);
const resourceHref = (id: string) => '/resources/' + encodeURIComponent(id) + '?return=' + encodeURIComponent(currentUrl());
function updateMap() { map?.update(lastItems, center, resourceHref); }
function layout() {
  content.dataset.view = state.view;
  element<HTMLButtonElement>('#clearLocation').hidden = !state.location;
  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.category === state.category)));
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  map?.resize();
  if (state.view === 'map' && !mapStarted && import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN) {
    mapStarted = true;
    void import('./resource-map').then(({ mountResourceMap }) => {
      map = mountResourceMap(element('#liveMap'), () => {
        content.dataset.mapUnavailable = 'true'; element('#mapFallback').hidden = false;
      });
      if (map) { content.dataset.mapUnavailable = 'false'; element('#mapFallback').hidden = true; updateMap(); }
    }).catch(() => { content.dataset.mapUnavailable = 'true'; element('#mapFallback').hidden = false; });
  }
}
function message(title: string, text: string, retry = false) {
  results.innerHTML = `<div class="empty-state"><span class="empty-icon">${searchIcon}</span><h2>${esc(title)}</h2><p>${esc(text)}</p>${retry ? '<button class="search-button" id="retrySearch" type="button">Try again</button>' : ''}</div>`;
  document.querySelector('#retrySearch')?.addEventListener('click', () => void search());
}
function render(data: SearchResults) {
  lastItems = data.items;
  count.textContent = `${data.total} ${data.total === 1 ? 'resource' : 'resources'} within ${state.radius} miles of ${center?.label ?? state.location}`;
  if (!data.items.length) message('No matching resources.', 'Try another category, a larger distance, or a different Pennsylvania city or ZIP code.');
  else results.innerHTML = data.items.map((r) => {
    const category = r.category_slugs.includes('healthcare') ? 'healthcare' : 'food';
    return `<a class="result-card" href="${esc(resourceHref(r.id))}"><div class="result-heading"><span class="result-icon result-icon--${category}">${icons[category]}</span><div><h2>${esc(r.title)}</h2><span class="result-location">${esc(r.location.city)}, PA · ${r.distance_miles} mi</span></div></div><p>${esc(r.summary)}</p><div class="result-footer"><span class="result-category"><span class="category-dot category-dot--${category}" aria-hidden="true"></span>${esc(categoryName(category))}</span><span class="result-arrow" aria-hidden="true">${arrow}</span></div>${r.data_kind === 'fictional_demo' ? '<span class="record-kind">Fictional demo</span>' : '<span class="record-kind">Sourced information · confirm before visiting</span>'}</a>`;
  }).join('');
  pagination.innerHTML = data.total ? `<button type="button" id="previousPage"${data.page <= 1 ? ' disabled' : ''}>Previous</button><span>Page ${data.page}</span><button type="button" id="nextPage"${data.has_next ? '' : ' disabled'}>Next</button>` : '';
  document.querySelector('#previousPage')?.addEventListener('click', () => { state.page--; void search(); });
  document.querySelector('#nextPage')?.addEventListener('click', () => { state.page++; void search(); });
  updateMap();
}
async function search(updateUrl = true) {
  current?.abort(); const controller = new AbortController(); current = controller;
  layout(); if (updateUrl) window.history.replaceState(null, '', currentUrl());
  lastItems = []; center = null; pagination.replaceChildren(); updateMap();
  if (!state.location) {
    results.removeAttribute('aria-busy');
    count.textContent = 'Choose a Pennsylvania location to begin.';
    message('Where are you looking for help?', 'Enter a Pennsylvania city or ZIP code, or choose one of the suggested areas.');
    return;
  }
  results.setAttribute('aria-busy','true'); count.textContent = 'Searching nearby resources…';
  message('Finding resources…', 'Searching your selected location and filters.');
  try {
    const resolved = await apiRequest<{ place: Place }>('places/resolve?q=' + encodeURIComponent(state.location), { signal: controller.signal });
    if (controller.signal.aborted) return;
    center = resolved.place;
    const query = new URLSearchParams({ lat:String(center.latitude),lng:String(center.longitude),radius_miles:String(state.radius),page:String(state.page),page_size:'20' });
    if (state.category !== 'all') query.set('category',state.category);
    if (state.keyword.trim()) query.set('q',state.keyword.trim());
    const data = await apiRequest<SearchResults>('resources?' + query, { signal:controller.signal });
    if (!controller.signal.aborted) render(data);
  } catch (error) {
    if (controller.signal.aborted) return;
    count.textContent = 'Search could not be completed.';
    message('We couldn’t load these resources.',error instanceof Error ? error.message : 'Please try again.',true);
  } finally { if (current === controller) results.removeAttribute('aria-busy'); }
}
function newSearch() { state.location = locationInput.value.trim(); state.keyword = keywordInput.value.trim(); state.page = 1; void search(); }
element<HTMLFormElement>('#locationForm').addEventListener('submit',(e) => { e.preventDefault(); newSearch(); });
element<HTMLSelectElement>('#radiusInput').addEventListener('change',(e) => { state.radius = Number((e.target as HTMLSelectElement).value); newSearch(); });
document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach((b) => b.addEventListener('click',() => { state.category = directoryCategory(b.dataset.category ?? null); newSearch(); }));
document.querySelectorAll<HTMLButtonElement>('[data-area]').forEach((b) => b.addEventListener('click',() => { locationInput.value = b.dataset.area!; newSearch(); }));
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) => b.addEventListener('click',() => { state.view = b.dataset.view === 'map' ? 'map' : 'list'; layout(); window.history.replaceState(null,'',currentUrl()); }));
element('#clearLocation').addEventListener('click',() => { locationInput.value = ''; newSearch(); locationInput.focus(); });
let debounce: ReturnType<typeof setTimeout>;
keywordInput.addEventListener('input',() => { clearTimeout(debounce); debounce = setTimeout(newSearch,250); });
window.addEventListener('pagehide',() => { current?.abort(); map?.remove(); });
void search(false);
