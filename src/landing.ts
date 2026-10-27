import './landing.css';
import './landing-sections.css';
import './landing-palette.css';
import { arrow, brand, element, icons } from './ui';
import { finalSections } from './landing-sections';

const barriers = [
  { id: 'food', label: 'Food', eyebrow: '01 / Finding food', title: 'A nearby pantry.<br> A hidden doorway.', description: 'Support may be close by. But finding where to go, when it’s open, and who it serves can take more effort than it should.', note: 'Scattered information', icon: icons.food },
  { id: 'care', label: 'Care', eyebrow: '02 / Reaching care', title: 'Care on the map.<br> Still out of reach.', description: 'A clinic’s location only tells part of the story. Travel, timing, and eligibility can make a short distance feel much longer.', note: 'More than a distance', icon: icons.healthcare },
  { id: 'travel', label: 'Getting there', eyebrow: '03 / Getting there', title: 'One missing ride.<br> A chain of needs.', description: 'Food and care depend on getting there. When transportation is limited, everyday needs can overlap.', note: 'Connected needs', icon: icons.transportation },
];

const streetLines = Array.from({ length: 12 }, (_, i) => {
  const x = 80 + i * 52;
  const y = 50 + i * 48;
  return `<path d="M${x} 0v680M0 ${y}h720"/>`;
}).join('');

element<HTMLDivElement>('#app').innerHTML = `
  <div class="landing-experience" id="top">
    <a class="skip-link" href="#about">Skip to the story</a>
    <div class="orbit-backdrop" aria-hidden="true">
      <div class="orbit-image">
        <img src="/assets/access-earth-network.webp" width="1651" height="953" alt="" fetchpriority="high" draggable="false" />
        <div class="orbit-label orbit-label--food"><span>${icons.food}</span><div>Food access<small>Los Angeles, CA</small></div></div>
        <div class="orbit-label orbit-label--care"><span>${icons.healthcare}</span><div>Community care<small>Denver, CO</small></div></div>
        <div class="orbit-label orbit-label--travel"><span>${icons.transportation}</span><div>Transportation<small>New York, NY</small></div></div>
        <div class="orbit-label orbit-label--community"><span>${icons.pantry}</span><div>Community support<small>Miami, FL</small></div></div>
      </div>
      <div class="orbit-shade"></div>
      <div class="dive-reticle"><span></span><span></span><span></span><span></span><small>A closer look</small></div>
    </div>
    <header class="landing-header">${brand.replace('href="/"', 'href="#top"')}<nav aria-label="Main navigation"><a class="section-nav-link" href="#what">What we do</a><a class="section-nav-link" href="#how">Our approach</a><a class="story-link" href="#about">Why Access ${arrow}</a></nav></header>
    <main id="main">
      <section class="hero-section" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow hero-eyebrow"><span></span> A clearer view of community</p>
          <h1 id="hero-title">Help, <span>mapped beautifully.</span></h1>
          <p class="hero-description">Connecting community needs with<br class="desktop-break"> the support around them.</p>
          <a class="discover-link" href="#about">Discover Access ${arrow}</a>
        </div>
        <div class="hero-bottom"><span>Every connection starts with a closer look.</span><a href="#about" class="scroll-cue"><span class="scroll-cue-line"></span>Scroll to explore</a><span class="hero-coordinate">A world of possibilities</span></div>
      </section>
      <section class="problem-section" id="about" aria-labelledby="problem-title">
        <div class="problem-stage">
          <div class="problem-topline"><span class="eyebrow">02 / The distance between need & support</span><span class="perspective-label"><span></span> From a world to a neighborhood</span></div>
          <div class="problem-layout">
            <div class="problem-copy">
              <h2 id="problem-title">Support can be<br><em>hard to find.</em></h2>
              <p class="problem-intro">Behind every point on a map is a person.<br>And a journey that isn’t always simple.</p>
              <nav class="story-chapters" aria-label="Explore the three barriers">${barriers.map((item, i) => `<a href="#barrier-${item.id}" data-chapter="${i}"><span>0${i + 1}</span>${item.label}</a>`).join('')}</nav>
              <div class="barrier-stories">${barriers.map((item, i) => `<article class="barrier-story" id="barrier-${item.id}" data-story="${i}" aria-labelledby="title-${item.id}"><p class="barrier-eyebrow">${item.eyebrow}</p><h3 id="title-${item.id}">${item.title}</h3><p>${item.description}</p></article>`).join('')}</div>
            </div>
            <div class="neighborhood-visual" role="img" aria-label="Illustration of a person surrounded by food, care, and transportation, with gaps along the routes between them.">
              <div class="neighborhood-grid">
                <svg viewBox="0 0 720 650" fill="none" aria-hidden="true">
                  <defs>
                    <radialGradient id="neighborhood-glow"><stop stop-color="#ff994b" stop-opacity=".08"/><stop offset="1" stop-color="#ff994b" stop-opacity="0"/></radialGradient>
                    <radialGradient id="person-glow"><stop stop-color="#ff994b" stop-opacity=".2"/><stop offset="1" stop-color="#ff994b" stop-opacity="0"/></radialGradient>
                    <clipPath id="neighborhood-clip"><circle cx="360" cy="326" r="273"/></clipPath>
                  </defs>
                  <circle cx="360" cy="326" r="300" fill="url(#neighborhood-glow)"/>
                  <g class="neighborhood-orbits"><circle cx="360" cy="326" r="274"/><circle cx="360" cy="326" r="230"/><path d="M360 30v24m0 544v24M60 326h24m552 0h24"/></g>
                  <g clip-path="url(#neighborhood-clip)">
                    <g class="street-grid" transform="rotate(-24 360 326)">${streetLines}<path class="street-main" d="M260 0v680M0 338h720"/><path class="street-water" d="M0 520q200-130 300-28T740 452"/></g>
                    <g class="neighborhood-buildings" transform="rotate(-24 360 326)"><path d="M293 201h28v32h-28zM397 152h28v32h-28zM190 298h27v28h-27zM450 395h27v28h-27zM343 490h27v28h-27zM502 245h27v28h-27zM137 396h27v28h-27zM553 444h27v28h-27z"/></g>
                  </g>
                  <g class="story-route" data-route="0"><path class="route-ghost" d="M343 407Q214 381 190 220"/><path class="route-line" d="M343 407Q249 387 216 307M199 255Q192 240 190 220"/><circle class="route-gap" cx="205" cy="281" r="13"/><path class="route-break" d="m201 277 8 8m0-8-8 8"/></g>
                  <g class="story-route story-route--blue" data-route="1"><path class="route-ghost" d="M369 409Q467 361 518 206"/><path class="route-line" d="M369 409Q438 373 469 317M494 265Q507 235 518 206"/><circle class="route-gap" cx="483" cy="291" r="13"/><path class="route-break" d="m479 287 8 8m0-8-8 8"/></g>
                  <g class="story-route" data-route="2"><path class="route-ghost" d="M375 438Q439 491 531 476M531 476Q661 271 535 212M531 476Q246 547 190 220"/><path class="route-line" d="M375 438Q406 466 436 474M488 480Q507 480 531 476M531 476Q661 271 535 212M531 476Q246 547 190 220"/><circle class="route-gap" cx="462" cy="479" r="13"/><path class="route-break" d="m458 475 8 8m0-8-8 8"/></g>
                  <circle cx="356" cy="424" r="78" fill="url(#person-glow)"/>
                  <circle class="person-ring" cx="356" cy="424" r="33"/>
                  <circle class="person-head" cx="356" cy="417" r="7"/>
                  <path class="person-body" d="M342 438v-4a14 14 0 0 1 28 0v4" stroke-width="2" stroke-linecap="round"/>
                  <g class="person-caption"><path d="M356 467v18"/><text x="356" y="510" text-anchor="middle">A person. A place. A need.</text></g>
                </svg>
                ${barriers.map((item, i) => `<div class="neighborhood-node neighborhood-node--${item.id}" data-node="${i}"><span class="neighborhood-node-icon">${item.icon}</span><span class="neighborhood-node-label">${item.label}<small>${item.note}</small></span></div>`).join('')}
                <span class="map-caption">A neighborhood, imagined</span>
              </div>
              <p class="connection-thought">Everyday needs are connected.<br><span>The information often isn’t.</span></p>
            </div>
          </div>
          <div class="problem-bottom"><span class="chapter-counter" aria-hidden="true">01 <i>/</i> 03</span><div class="story-progress" aria-hidden="true"><span></span></div><a href="#what">See the whole picture <span class="down-arrow">↓</span></a></div>
        </div>
      </section>
      ${finalSections}
    </main>
    <footer class="landing-footer"><span>Access <small>Seeing communities more clearly.</small></span><a href="#top">Back to the world <span>↑</span></a></footer>
  </div>
`;

const experience = element<HTMLElement>('.landing-experience');
const hero = element<HTMLElement>('.hero-section');
const problem = element<HTMLElement>('.problem-section');
const stage = element<HTMLElement>('.problem-stage');
const image = element<HTMLElement>('.orbit-image');
const shade = element<HTMLElement>('.orbit-shade');
const reticle = element<HTMLElement>('.dive-reticle');
const heroCopy = element<HTMLElement>('.hero-copy');
const visual = element<HTMLElement>('.neighborhood-visual');
const chapterLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-chapter]')];
const stories = [...document.querySelectorAll<HTMLElement>('[data-story]')];
const nodes = [...document.querySelectorAll<HTMLElement>('[data-node]')];
const routes = [...document.querySelectorAll<SVGGElement>('[data-route]')];
const progressBar = element<HTMLElement>('.story-progress span');
const counter = element<HTMLElement>('.chapter-counter');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const perspective = element<HTMLElement>('.perspective-section');
const perspectiveStage = element<HTMLElement>('.perspective-stage');
const method = element<HTMLElement>('.method-section');
const mapLayers = [...document.querySelectorAll<HTMLElement>('[data-map-layer]')];
const methodSteps = [...document.querySelectorAll<HTMLElement>('[data-method-step]')];
let scrollFrame = 0;
let heroHeight = 1;
let problemTop = 1;
let storyDistance = 1;
let isPinnedStory = false;
let previousChapter = -1;
let perspectiveTop = 1;
let perspectiveHeight = 1;
let methodTop = 1;
let methodHeight = 1;
let hasFullScenes = false;

function clamp(value: number): number { return Math.min(1, Math.max(0, value)); }
function smooth(start: number, end: number, value: number): number {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function renderScroll(): void {
  scrollFrame = 0;
  const scroll = window.scrollY;
  experience.classList.toggle('on-paper', scroll >= problemTop - 12);
  experience.classList.toggle('in-final-scenes', scroll >= perspectiveTop);
  if (motionPreference.matches) return;
  const dive = smooth(0, 1, scroll / heroHeight);
  const progress = clamp((scroll - problemTop) / storyDistance);
  const chapters = progress * 3;
  const active = Math.min(2, Math.floor(chapters));
  const scale = 1 + dive * .9 + progress * .12;

  image.style.transform = `translate(-50%, -50%) scale(${scale})`;
  image.style.filter = `blur(${dive * 3}px)`;
  image.style.opacity = String(1 - dive * .82);
  shade.style.opacity = String(.12 + dive * .88);
  experience.style.setProperty('--label-opacity', String(1 - smooth(.05, .65, scroll / heroHeight)));
  heroCopy.style.opacity = String(1 - smooth(.05, .65, scroll / heroHeight));
  heroCopy.style.transform = `translateY(${dive * -75}px)`;
  reticle.style.opacity = String(smooth(.12, .42, scroll / heroHeight) * (1 - smooth(.6, 1, scroll / heroHeight)));
  reticle.style.transform = `translate(-50%, -50%) scale(${1 - dive * .22}) rotate(${dive * 12}deg)`;
  visual.style.opacity = String(smooth(.52, .97, scroll / heroHeight));
  visual.style.transform = `scale(${.82 + dive * .18})`;
  experience.classList.toggle('has-left-orbit', scroll > heroHeight * .35);

  const layerProgress = hasFullScenes
    ? clamp((scroll - perspectiveTop) / Math.max(1, perspectiveHeight - perspectiveStage.offsetHeight))
    : clamp((scroll - perspectiveTop + window.innerHeight * .4) / Math.max(1, perspectiveHeight - window.innerHeight * .2));
  const merge = smooth(0, 1, layerProgress);
  mapLayers.forEach((layer, i) => {
    layer.style.setProperty('--layer-y', `${(1 - i) * (90 - merge * 58)}px`);
    layer.style.setProperty('--layer-angle', `${52 - merge * 7}deg`);
  });
  const methodProgress = clamp((scroll - methodTop + window.innerHeight * .45) / Math.max(1, methodHeight - window.innerHeight * .6));
  methodSteps.forEach((step, i) => {
    const reveal = clamp(methodProgress * 4 - i);
    step.style.setProperty('--step-progress', String(reveal));
    step.classList.toggle('is-reached', reveal > .05);
  });

  if (!isPinnedStory) return;

  stories.forEach((story, i) => {
    const enter = i === 0 ? 1 : smooth(i - .08, i + .15, chapters);
    const leave = i === 2 ? 0 : smooth(i + .85, i + 1.08, chapters);
    const opacity = enter * (1 - leave);
    story.style.opacity = String(opacity);
    story.style.transform = `translateY(${(1 - enter) * 35 - leave * 35}px)`;
    // Keep every chapter readable by assistive technology while the visual copy crossfades.
    story.style.pointerEvents = opacity > .5 ? 'auto' : 'none';
  });
  chapterLinks.forEach((link, i) => {
    if (i === active) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  nodes.forEach((node, i) => node.classList.toggle('is-active', i === active));
  routes.forEach((route, i) => {
    route.classList.toggle('is-active', i === active);
    route.style.setProperty('--route-reveal', String(clamp((chapters - i) * 1.5)));
  });
  progressBar.style.transform = `scaleX(${progress})`;
  if (active !== previousChapter) {
    counter.innerHTML = `0${active + 1} <i>/</i> 03`;
    previousChapter = active;
  }
}

function requestRender(): void {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(renderScroll);
}

function measure(): void {
  isPinnedStory = !motionPreference.matches && window.innerHeight >= 680;
  hasFullScenes = isPinnedStory && window.innerWidth > 760;
  experience.classList.toggle('has-scroll-story', isPinnedStory);
  experience.classList.toggle('has-full-scenes', hasFullScenes);
  if (!isPinnedStory) {
    [...stories, ...routes, progressBar].forEach((item) => item.removeAttribute('style'));
    chapterLinks.forEach((link) => link.removeAttribute('aria-current'));
    nodes.forEach((node) => node.classList.remove('is-active'));
    routes.forEach((route) => route.classList.remove('is-active'));
    previousChapter = -1;
  }
  heroHeight = hero.offsetHeight;
  problemTop = problem.getBoundingClientRect().top + window.scrollY;
  storyDistance = Math.max(1, problem.offsetHeight - stage.offsetHeight);
  perspectiveTop = perspective.getBoundingClientRect().top + window.scrollY;
  perspectiveHeight = perspective.offsetHeight;
  methodTop = method.getBoundingClientRect().top + window.scrollY;
  methodHeight = method.offsetHeight;
  requestRender();
}

function setMotionMode(): void {
  experience.classList.toggle('is-reduced-motion', motionPreference.matches);
  if (motionPreference.matches) {
    [image, shade, reticle, heroCopy, visual, ...stories, ...routes, progressBar, ...mapLayers, ...methodSteps].forEach((item) => item.removeAttribute('style'));
    methodSteps.forEach((step) => step.classList.remove('is-reached'));
    experience.style.removeProperty('--label-opacity');
    experience.classList.remove('has-left-orbit');
    chapterLinks.forEach((link) => link.removeAttribute('aria-current'));
    nodes.forEach((node) => node.classList.remove('is-active'));
    routes.forEach((route) => route.classList.remove('is-active'));
  }
  measure();
}

chapterLinks.forEach((link, i) => link.addEventListener('click', (event) => {
  if (!isPinnedStory) return;
  event.preventDefault();
  window.scrollTo({ top: problemTop + storyDistance * ((i + .35) / 3), behavior: 'smooth' });
}));

window.addEventListener('scroll', requestRender, { passive: true });
window.addEventListener('resize', measure, { passive: true });
window.addEventListener('pageshow', measure);
motionPreference.addEventListener('change', setMotionMode);
setMotionMode();

// Dynamic route loading finishes after the browser's first attempt to resolve a hash.
// Restore section links once layout is ready, including the pinned story chapters.
void document.fonts.ready.then(() => {
  measure();
  const target = window.location.hash;
  if (target === '#top') window.scrollTo({ top: 0, behavior: 'instant' });
  if (target === '#about') window.scrollTo({ top: problemTop, behavior: 'instant' });
  if (target === '#what') window.scrollTo({ top: perspectiveTop, behavior: 'instant' });
  if (target === '#how') window.scrollTo({ top: methodTop, behavior: 'instant' });
  const chapter = barriers.findIndex((item) => target === `#barrier-${item.id}`);
  if (chapter >= 0) {
    const top = isPinnedStory
      ? problemTop + storyDistance * ((chapter + .35) / 3)
      : stories[chapter].getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: 'instant' });
  }
});
