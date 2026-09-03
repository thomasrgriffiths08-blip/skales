const L = require('../lib.js');
const { site, builds, esc, pad } = L;

const gallery = {
  url: '/work/', og: 'work', priority: 0.9, changefreq: 'weekly',
  meta: { key: 'work', title: 'Sixteen builds. All of them running.', kicker: 'The rack · 16 channels', sub: 'Quote engines, a CRM, a dispatch board, booking, four full websites — running live, open to use.' },
  render(b){
    const title = `Work — 16 live websites & business tools | ${site.name}`;
    const description = 'Sixteen example websites and tools for service businesses, running live: a job CRM, a dispatch board, online booking, a quote engine, four full websites.';
    const nodes = [
      L.webPage({ path: '/work/', title, description, type: 'CollectionPage' }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }]),
      { '@type': 'ItemList', name: 'Working builds by ' + site.name, numberOfItems: builds.length,
        itemListElement: builds.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/work/${x.slug}/`), name: x.name })) },
    ];
    const body = `
${L.header(b, 'work')}
<main id="main">
<section class="hero-w wrap">
  <span class="plate"><span>The rack</span><span>${builds.length} channels</span><span class="on"><i class="lamp is-live"></i>All powered</span></span>
  <h1>Sixteen builds.<br>All of them <span class="off">running.</span></h1>
  <div class="row">
    <p class="lead">Example websites and business tools for service businesses, running live inside this page: quote engines, a job and lead CRM, a dispatch board, booking and deposits, calculators and four full websites. Pick a channel and use it the way a customer would. Nothing here is a mockup and nothing is a video.</p>
    <span class="plate specs"><span>${builds.length} builds</span><span>0 dependencies</span><span>0 stock photos</span><span>Every business invented</span></span>
  </div>
</section>

<section class="wrap rig-wrap" aria-label="Live build viewer">
  <div class="rig">
    <div class="rail">
      <div class="rail-hd"><span class="lamp" id="rigLamp"></span> Channels <span class="sp"></span><kbd>&uarr;</kbd><kbd>&darr;</kbd></div>
      <div class="rail-list" id="rail" role="tablist" aria-label="Choose a build"></div>
    </div>
    <div class="stage">
      <div class="chrome">
        <span class="pips" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="url" id="rigUrl"></span>
        <span class="sizes" role="group" aria-label="Preview width">
          <button type="button" data-size="phone" aria-pressed="false">Phone</button>
          <button type="button" data-size="tab" aria-pressed="false">Tablet</button>
          <button type="button" data-size="" aria-pressed="true">Full</button>
        </span>
        <button type="button" class="pop" id="rigReload" title="Reload this build">Reload</button>
        <a class="pop" id="rigPop" href="${b}demos/fenwick-booking/" target="_blank" rel="noopener">Open full size</a>
      </div>
      <div class="viewport" id="viewport"><div class="boot">Powering up</div></div>
      <div class="rig-cap" id="rigCap"></div>
    </div>
  </div>
</section>

<section class="panel" id="all">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">All sixteen</span><span class="name">Every build has its own page</span></div>
    <div class="body">
      <div class="rack-head">
        <h2>All sixteen.</h2>
        <div class="filters" role="group" aria-label="Filter builds">
          <button type="button" data-f="all" aria-pressed="true">All ${builds.length}</button>
          <button type="button" data-f="tool" aria-pressed="false">Tools ${builds.filter(x => x.kind === 'tool').length}</button>
          <button type="button" data-f="site" aria-pressed="false">Websites ${builds.filter(x => x.kind === 'site').length}</button>
        </div>
      </div>
      <p class="hint spec"><span class="lamp is-live"></span> Hover a cell and it wakes &mdash; that is the real build running, not the still. Open one for its own page.</p>
      <div class="rack" id="rack"></div>
      <p class="f-note" style="margin-top:1.4rem">Every business, person, review and phone number in these builds is invented. No real client, address or account detail appears anywhere in them. The tools keep their own state in your browser and each has a reset control.</p>
    </div>
  </div>
</section>
</main>
<section class="day on-day cta-band">
  <div class="wrap grid">
    <div>
      <h2>These are demos. Yours would have your name on it.</h2>
      <p class="lead" style="margin-top:.8rem">Same approach, your business: a site that captures the enquiry, a system that answers it in seconds, and a place where every job lives. Hand-built, no page-builder, owned by you.</p>
    </div>
    <div class="cta-col"><a class="btn btn-live" href="${b}book/">Book a call</a></div>
  </div>
</section>
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/work/', title, description, og: 'work', css: ['rack.css'], nodes }), body, L.scripts(b, ['builds.js', 'rack.js']) + `
<script>(function(){var f='all';function d(){renderRack('#rack',BUILDS.filter(function(x){return f==='all'||x.kind===f;}));}
document.querySelectorAll('.filters button').forEach(function(btn){btn.addEventListener('click',function(){f=btn.getAttribute('data-f');document.querySelectorAll('.filters button').forEach(function(o){o.setAttribute('aria-pressed',String(o===btn));});d();});});
d();initRig(2);})();</script>`);
  }
};

/* ---------- one page per build ---------- */
const cases = builds.map((x, i) => ({
  url: `/work/${x.slug}/`, og: `work-${x.slug}`, priority: 0.8, changefreq: 'monthly',
  meta: { key: `work-${x.slug}`, title: x.name, kicker: `CH ${pad(x.n)} · ${x.biz} · ${x.kind === 'site' ? 'Website' : 'Business tool'}`, sub: x.short, colour: x.c },
  render(b){
    const prev = builds[(i + builds.length - 1) % builds.length], next = builds[(i + 1) % builds.length];
    const kindWord = x.kind === 'site' ? 'website' : 'business tool';
    const t0 = `${x.name} — ${x.biz}`; const title = t0.length <= 44 ? `${t0} | ${site.name}` : t0;
    const description = `${x.short} ${x.long}`.slice(0, 158);
    const nodes = [
      L.webPage({ path: `/work/${x.slug}/`, title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs(`/assets/stills/${pad(x.n)}.webp`) } } }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }, { name: x.name, path: `/work/${x.slug}/` }]),
      { '@type': x.kind === 'site' ? 'CreativeWork' : 'SoftwareApplication', name: x.name, url: L.abs(`/work/${x.slug}/`),
        description: x.long, creator: { '@id': L.ORG_ID }, author: { '@id': L.PERSON_ID },
        image: L.abs(`/assets/stills/${pad(x.n)}.webp`), genre: x.kind === 'site' ? 'Website design' : 'Business software',
        keywords: x.tags.join(', '), isAccessibleForFree: true, inLanguage: 'en-GB',
        ...(x.kind === 'site' ? {} : { applicationCategory: 'BusinessApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Demonstration build, free to use on this site' } }),
        about: `A demonstration ${kindWord} built for an invented ${x.biz.toLowerCase()}.` },
    ];
    const body = `
${L.header(b, 'work')}
<main id="main">
<article class="case">
  <section class="wrap case-head">
    <nav class="crumbs spec" aria-label="Breadcrumb"><a href="${b}">Home</a><span>/</span><a href="${b}work/">Work</a><span>/</span><span aria-current="page">CH ${pad(x.n)}</span></nav>
    <span class="plate"><span>CH ${pad(x.n)}</span><span><i class="sw" style="background:${x.c}"></i>${esc(x.biz)}</span><span>${x.kind === 'site' ? 'Website' : 'Business tool'}</span><span class="on"><i class="lamp is-live"></i>Live</span></span>
    <h1>${esc(x.name)}</h1>
    <p class="lead">${esc(x.short)} ${esc(x.long)}</p>
  </section>

  <section class="wrap rig-wrap" aria-label="The build, running">
    <div class="rig rig-solo" style="--chan:${x.c}">
      <div class="stage">
        <div class="chrome">
          <span class="pips" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="url" id="rigUrl"></span>
          <span class="sizes" role="group" aria-label="Preview width">
            <button type="button" data-size="phone" aria-pressed="false">Phone</button>
            <button type="button" data-size="tab" aria-pressed="false">Tablet</button>
            <button type="button" data-size="" aria-pressed="true">Full</button>
          </span>
          <button type="button" class="pop" id="rigReload" title="Reload this build">Reload</button>
          <a class="pop" id="rigPop" href="${b}demos/${x.slug}/" target="_blank" rel="noopener">Open full size</a>
        </div>
        <div class="viewport" id="viewport"><div class="boot">Powering up</div></div>
      </div>
    </div>
    <p class="hint spec" style="margin-top:.8rem"><span class="lamp is-live"></span> This is the build itself, not a recording. Use it like a customer would. State is kept in your browser; there is a reset inside.</p>
  </section>

  <section class="panel">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">What it proves</span><span class="name">${esc(x.proves)}</span></div>
      <div class="body case-grid">
        <div>
          <h2>What does ${esc(x.name)} do?</h2>
          <p class="lead">${esc(x.name)} is a working ${kindWord} built for an invented ${x.biz.toLowerCase()}. ${esc(x.story)}</p>
        </div>
        <div>
          <h2 class="h3">What is in it</h2>
          <ul class="feat">${x.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <div class="tags" style="margin-top:14px">${x.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">How it was built</span><span class="name">By hand, with nothing bought in</span></div>
      <div class="body">
        <dl class="nameplate">
          <div><dt>Written</dt><dd>By hand, as a single self-contained page. No page-builder, no theme, no framework.</dd></div>
          <div><dt>Dependencies</dt><dd>None at runtime. Fonts load from Google Fonts with system fallbacks; everything else &mdash; every drawing, chart and interaction &mdash; is in the file.</dd></div>
          <div><dt>Imagery</dt><dd>No stock. Every visual is drawn in code, SVG or canvas.</dd></div>
          <div><dt>The business</dt><dd>${esc(x.biz)} &mdash; invented. Every person, number and review inside is fictional so nothing here exposes a real client.</dd></div>
          <div><dt>Runs on</dt><dd>Any modern browser, phone included. State stays in your browser; there is a reset control inside.</dd></div>
          <div><dt>Yours would</dt><dd>Carry your name, your numbers and your diary, and be owned by you from day one.</dd></div>
        </dl>
      </div>
    </div>
  </section>

  <nav class="panel casenav" aria-label="More builds">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">More</span><span class="name">The next channels</span></div>
      <div class="body casenav-grid">
        <a class="cnav" href="${b}work/${prev.slug}/"><span class="spec">Previous &middot; CH ${pad(prev.n)}</span><img src="${b}assets/stills/${pad(prev.n)}.webp" width="800" height="500" loading="lazy" decoding="async" alt="${esc(prev.name)} — ${esc(prev.short)}"><b>${esc(prev.name)}</b><span>${esc(prev.short)}</span></a>
        <a class="cnav" href="${b}work/${next.slug}/"><span class="spec">Next &middot; CH ${pad(next.n)}</span><img src="${b}assets/stills/${pad(next.n)}.webp" width="800" height="500" loading="lazy" decoding="async" alt="${esc(next.name)} — ${esc(next.short)}"><b>${esc(next.name)}</b><span>${esc(next.short)}</span></a>
      </div>
    </div>
  </nav>
</article>
</main>
<section class="day on-day cta-band">
  <div class="wrap grid">
    <div>
      <h2>Want one like this, with your name on it?</h2>
      <p class="lead" style="margin-top:.8rem">A short call to find out what is leaking in your business and whether a build like ${esc(x.name)} is the right fix.</p>
    </div>
    <div class="cta-col"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-ghost" href="${b}work/">Back to the rack</a></div>
  </div>
</section>
${L.footer(b)}`;
    return L.page(L.head({ b, path: `/work/${x.slug}/`, title, description, og: `work-${x.slug}`, css: ['rack.css'], nodes }), body,
      L.scripts(b, ['builds.js', 'rack.js']) + `<script>initRig(${x.n},{solo:true});</script>`);
  }
}));

module.exports = { pages: [gallery, ...cases] };
