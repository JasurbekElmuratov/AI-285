import { arrow } from './ui';

const mapRoads = `<path d="M68 0v420M147 0v420M227 0v420M306 0v420M386 0v420M466 0v420M545 0v420M0 58h620M0 137h620M0 216h620M0 295h620M0 374h620"/><path class="paper-main-road" d="M0 246h620M347 0v420"/>`;
const mapBuildings = '<path d="M91 82h32v30H91zM172 164h30v29h-30zM249 82h30v30h-30zM405 164h37v29h-37zM487 322h35v29h-35zM91 322h32v29H91zM405 322h37v29h-37zM487 82h35v30h-35z"/>';
const paperBase = `<g class="paper-roads">${mapRoads}</g><g class="paper-buildings">${mapBuildings}</g><path class="paper-river" d="M-20 350Q138 243 223 331T650 300"/>`;
const layers = [
  { name: 'Community', label: 'The places we live', content: `${paperBase}<g class="paper-place-dots"><circle cx="108" cy="96" r="7"/><circle cx="265" cy="95" r="7"/><circle cx="420" cy="178" r="7"/><circle cx="421" cy="336" r="7"/><circle cx="108" cy="335" r="7"/></g>` },
  { name: 'Resources', label: 'The support around us', content: `${paperBase}<g class="paper-resource-dots"><circle cx="147" cy="295" r="18"/><circle cx="386" cy="137" r="18"/><circle cx="466" cy="295" r="18"/></g><g class="paper-resource-symbols"><path d="M147 285v20m-5-20v8h10v-8M379 137h14m-7-7v14M459 289h14v12h-14zM460 294h12"/></g>` },
  { name: 'Connections', label: 'The gaps between them', content: `<g class="paper-roads">${mapRoads}</g><g class="paper-connections"><path d="M147 295Q173 154 386 137M386 137Q476 187 466 295M147 295Q308 375 466 295"/><circle cx="239" cy="181" r="10"/><circle cx="447" cy="197" r="10"/><circle cx="311" cy="331" r="10"/></g>` },
];

const processSteps = [
  { title: 'Gather context', description: 'Start with public information about community conditions and the support available nearby.', icon: '<rect x="9" y="5" width="22" height="30" rx="3"/><path d="M15 13h10M15 20h10M15 27h6"/>' },
  { title: 'Look for patterns', description: 'Use analysis and AI to explore how needs, resources, and distance relate.', icon: '<path d="m10 12 20 5-12 13-8-18m8 18-8-18M30 17l-12 13"/><circle cx="10" cy="12" r="4"/><circle cx="30" cy="17" r="4"/><circle cx="18" cy="30" r="4"/>' },
  { title: 'Bring in people', description: 'Review what the data suggests with people who know the community.', icon: '<circle cx="17" cy="12" r="6"/><path d="M5 33v-4a12 12 0 0 1 24 0v4m-3-15 4 4 7-8"/>' },
  { title: 'Make it clear', description: 'Turn the findings into a map that makes needs, resources, and gaps easier to see.', icon: '<path d="m4 11 10-4 12 4 10-4v23l-10 4-12-4-10 4V11m10-4v23m12-19v23"/><circle cx="25" cy="20" r="3"/>' },
];

export const finalSections = `
  <section class="perspective-section" id="what" aria-labelledby="perspective-title">
    <div class="perspective-stage">
      <div class="section-topline"><span class="eyebrow">03 / What Access brings into view</span><span class="section-aside">Community. In context.</span></div>
      <div class="perspective-layout">
        <div class="perspective-copy">
          <h2 id="perspective-title">The whole picture.<br><em>Closer to home.</em></h2>
          <p class="perspective-intro">Access brings community needs and nearby support into one view. So it’s easier to understand what’s there, what’s missing, and how it all connects.</p>
          <ol class="perspective-benefits">
            <li><span class="benefit-number">01</span><div><h3>Understand the needs.</h3><p>See food, care, and transportation in the context of everyday life.</p></div></li>
            <li><span class="benefit-number">02</span><div><h3>See the support.</h3><p>Bring scattered information about community resources into view.</p></div></li>
            <li><span class="benefit-number">03</span><div><h3>Notice the gaps.</h3><p>Look beyond a pin to the connections that make support accessible.</p></div></li>
          </ol>
        </div>
        <div class="layer-illustration" role="img" aria-label="Three illustrated map layers—community, resources, and connections—move together into a shared view.">
          <div class="layer-stack">
            ${layers.map((layer, i) => `<div class="map-layer map-layer--${i}" data-map-layer="${i}"><div class="paper-label"><span>0${i + 1} / ${layer.name}</span><span>Access</span></div><svg viewBox="0 0 620 420" fill="none" aria-hidden="true">${layer.content}</svg><span class="paper-corner"></span></div>`).join('')}
            <div class="stack-guide stack-guide--top"></div><div class="stack-guide stack-guide--bottom"></div>
          </div>
          <div class="layer-key" aria-hidden="true">${layers.map((layer, i) => `<span><i class="layer-key-dot layer-key-dot--${i}"></i>${layer.name}</span>`).join('')}</div>
          <p class="layer-caption">Separate signals. A shared perspective.</p>
        </div>
      </div>
      <div class="perspective-bottom"><p>A map is a beginning.<br><span>Understanding is what gives it purpose.</span></p><a href="#how">How it comes together ${arrow}</a></div>
    </div>
  </section>
  <section class="method-section" id="how" aria-labelledby="method-title">
    <div class="method-inner">
      <div class="section-topline"><span class="eyebrow">04 / Our approach</span><span class="section-aside">Thoughtful technology. Human perspective.</span></div>
      <div class="method-heading"><h2 id="method-title">From scattered signals<br>to <em>shared understanding.</em></h2><p>Data gives us a starting point.<br>People give it meaning.</p></div>
      <ol class="method-steps" aria-label="The Access approach">
        ${processSteps.map((step, i) => `<li class="method-step" data-method-step="${i}"><div class="method-step-top"><span class="method-step-icon"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true">${step.icon}</svg></span><span class="method-step-number">0${i + 1}</span></div><div class="method-step-line" aria-hidden="true"><span></span></div><h3>${step.title}</h3><p>${step.description}</p></li>`).join('')}
      </ol>
      <div class="method-principle"><span class="principle-dot"></span>AI helps reveal patterns. Human judgment keeps them grounded.</div>
      <div class="landing-closing">
        <div class="closing-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="eyebrow">The future we’re working toward</p>
        <h3>A clearer picture.<br><em>A stronger community.</em></h3>
        <p>Understanding a community is the first step<br class="desktop-break"> toward supporting it.</p>
        <a href="#top">See the world differently ${arrow}</a>
      </div>
    </div>
  </section>
`;
