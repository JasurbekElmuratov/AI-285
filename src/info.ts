import './styles.css';
import './support.css';
import './detail.css';
import './info.css';
import { arrow, element, header, icons } from './ui';

const isAbout = window.location.pathname.replace(/\/$/, '') === '/about';
document.title = isAbout ? 'About Access — Help, mapped beautifully.' : 'Page not found — Access';

element<HTMLDivElement>('#app').innerHTML = isAbout ? `
  <div class="page-shell">
    ${header('about')}
    <main class="about-main" id="main">
      <section class="about-hero"><span class="page-eyebrow">ABOUT ACCESS</span><h1>Everyday support.<br /><span>A clearer starting point.</span></h1><p>Our Ground helps people explore food assistance and community healthcare in Pennsylvania.</p><a class="get-started" href="/support">Find support ${arrow}</a></section>
      <div class="about-visual"><img src="/assets/access-earth-network.webp" width="2786" height="1608" alt="" /><div><span>Food. Care. Connection.</span><p>Help, mapped beautifully.</p></div></div>
      <section class="about-steps" aria-labelledby="howTitle"><div class="about-section-heading"><span class="page-eyebrow">HOW TO EXPLORE</span><h2 id="howTitle">One small step at a time.</h2></div><div class="about-step-grid"><article><span class="step-number">01</span><h3>Choose an area.</h3><p>Start with a Pennsylvania city or ZIP code.</p></article><article><span class="step-number">02</span><h3>Find a starting point.</h3><p>Explore food and healthcare information with category and distance filters.</p></article><article><span class="step-number">03</span><h3>Look a little closer.</h3><p>Open a resource to read its listed services, hours and eligibility.</p></article></div></section>
      <section class="about-purpose"><div><span class="page-eyebrow">WHY WE’RE BUILDING ACCESS</span><h2>Support should be easier to see.</h2><p>We’re exploring how community needs and available resources could come together in one simple place. Maps offer a starting point; clear information helps people understand their options.</p></div><div class="about-support-types"><span>${icons.food}Food access</span><span>${icons.healthcare}Community care</span><span>${icons.transportation}Everyday travel</span></div></section>
      <section class="about-prototype"><span class="example-badge"><span aria-hidden="true"></span>Student prototype</span><h2>What you’re seeing today.</h2><p>Listings labeled Fictional demo do not represent real providers. Sourced listings should be confirmed with the provider before visiting. Community-needs overlays remain illustrative. You can browse resources without an account.</p><div><a class="search-button" href="/support">Explore resources ${arrow}</a><a class="about-demo-link" href="/demo">Try the community demo ${arrow}</a></div></section>
    </main>
  </div>
` : `<div class="page-shell">${header()}<main class="detail-main not-found" id="main"><span class="page-eyebrow">PAGE NOT FOUND</span><h1>Let’s get you back on the map.</h1><p>This page isn’t available. Explore Access to find a new starting point.</p><a class="get-started" href="/">Back to Access ${arrow}</a></main></div>`;
