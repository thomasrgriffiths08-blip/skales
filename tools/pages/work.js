const L = require('../lib.js');
const { site, builds, esc, pad, LANES, SITE_LANES, TOOL_LANES, laneOf, words, Words } = L;

const SITES = builds.filter(x => x.kind === 'site'), TOOLS = builds.filter(x => x.kind === 'tool');
const inLane = k => builds.filter(x => x.lane === k);
const still = (b, x) => `${b}assets/stills/${pad(x.n)}.webp`;
const kindWord = x => x.kind === 'site' ? 'Website' : 'Tool';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/* ---------- shared fragments ---------- */
function rig(b, { rail = true, solo = false, x = null, short = false } = {}){
  return `<div class="rig${solo ? ' rig-solo' : ''}"${x ? ` style="--chan:${x.c}"` : ''}>
    ${rail ? `<div class="rail">
      <div class="rail-hd"><span class="lamp" id="rigLamp"></span> Channels <span class="sp"></span><kbd>&uarr;</kbd><kbd>&darr;</kbd></div>
      <div class="rail-list" id="rail" role="tablist" aria-label="Choose a build"></div>
    </div>` : ''}
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
        <a class="pop" id="rigPop" href="${b}demos/${x ? x.slug : 'fenwick-booking'}/" target="_blank" rel="noopener">Open full size</a>
      </div>
      <div class="viewport${short ? ' vp-short' : ''}" id="viewport"><div class="boot">Powering up</div></div>
      ${rail ? '<div class="rig-cap" id="rigCap"></div>' : ''}
    </div>
  </div>`;
}
/* phones get the still and a full-screen button instead of a scaled-down iframe */
function poster(b, x){
  return `<div class="poster phone-only" style="--chan:${x.c}">
    <img src="${still(b, x)}" width="800" height="500" alt="${esc(x.name)} — ${esc(x.short)}" decoding="async">
    <div class="poster-foot">
      <span class="spec"><i class="lamp is-live"></i>${x.mobile ? 'Built for phones too' : 'Best on a bigger screen'}</span>
      <a class="btn btn-live btn-sm" href="${b}demos/${x.slug}/" target="_blank" rel="noopener">${x.mobile ? 'Open it full screen' : 'Open it anyway'}</a>
    </div>
  </div>`;
}
function laneBlock(b, k, { head = true, link = true } = {}){
  const l = LANES[k], list = inLane(k);
  return `<section class="lane" id="${k}" data-lane="${k}" data-kind="${l.kind}">
    ${head ? `<div class="lane-head">
      <div class="lane-copy"><span class="spec"><i class="lamp is-live"></i>${l.kindWord} &middot; ${esc(l.name)}</span><h3>${esc(l.line)}</h3><p>${esc(l.who)}</p></div>
      <span class="plate"><span>${plural(list.length, 'build')}</span>${link ? `<span><a href="${b}${l.path}#${k}">More on this ${l.kind === 'site' ? 'lane' : 'set'}</a></span>` : ''}</span>
    </div>` : ''}
    ${list.length ? `<div class="rack" data-rack="${k}"></div>` : '<p class="f-note">Nothing in this lane yet.</p>'}
  </section>`;
}
function filters(b, scope){
  const chips = [];
  if (scope === 'all') chips.push(['all', `All ${builds.length}`], ['site', `Websites ${SITES.length}`], ['tool', `Tools ${TOOLS.length}`]);
  const lanes = scope === 'site' ? SITE_LANES : scope === 'tool' ? TOOL_LANES : [...SITE_LANES, ...TOOL_LANES];
  if (scope !== 'all') chips.push(['all', `All ${lanes.reduce((n, k) => n + inLane(k).length, 0)}`]);
  lanes.forEach(k => chips.push([k, `${LANES[k].name} ${inLane(k).length}`]));
  return `<div class="filters chips-row" role="group" aria-label="Filter builds">${chips.map(([f, t], i) => `<button type="button" data-f="${f}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div>`;
}
const FILTER_JS = `<script>(function(){var d=document;
d.querySelectorAll('[data-rack]').forEach(function(el){renderRack(el,BUILDS.filter(function(x){return x.lane===el.getAttribute('data-rack');}));});
var btns=d.querySelectorAll('.filters button');btns.forEach(function(btn){btn.addEventListener('click',function(){var f=btn.getAttribute('data-f');
btns.forEach(function(o){o.setAttribute('aria-pressed',String(o===btn));});
d.querySelectorAll('.lane').forEach(function(l){l.hidden=!(f==='all'||l.getAttribute('data-lane')===f||l.getAttribute('data-kind')===f);});
d.querySelectorAll('[data-kindpanel]').forEach(function(p){p.hidden=!(f==='all'||p.getAttribute('data-kindpanel')===f||(LANES[f]&&LANES[f].kind===p.getAttribute('data-kindpanel')));});});});
var m=/(?:^|#)(loud|motion|quiet|direct|broad|specific)$/.exec(location.hash);if(m){var t=d.querySelector('.filters button[data-f="'+m[1]+'"]');if(t)t.click();}
})();</script>`;

/* the header of each lane IS a demo of the lane */
function specimen(k){
  if (k === 'loud') return `<div class="spm spm-loud" aria-hidden="true">${'LOUD'.split('').map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</div>`;
  if (k === 'motion') return `<div class="spm spm-motion" aria-hidden="true"><span class="rl">Reel 01 · 24 fps</span><b>Motion</b><span class="tc">00:00:00:00</span></div>`;
  if (k === 'quiet') return `<div class="spm spm-quiet" aria-hidden="true"><i></i><span>Quiet.</span><i></i></div>`;
  if (k === 'direct') return `<div class="spm spm-direct" aria-hidden="true"><span class="num">0113 496 0000</span><span class="call">Call now</span></div>`;
  return '';
}
const crumbs = (b, items) => `<nav class="crumbs spec" aria-label="Breadcrumb">${items.map((it, i) => i === items.length - 1 ? `<span aria-current="page">${esc(it[0])}</span>` : `<a href="${b}${it[1]}">${esc(it[0])}</a><span>/</span>`).join('')}</nav>`;
const cta = (b, h, p, extra = '') => `<section class="flood cta-band">
  <div class="wrap grid">
    <div><h2>${h}</h2><p class="lead" style="margin-top:.8rem">${p}</p></div>
    <div class="cta-col"><a class="btn btn-live" href="${b}book/">Book a call</a>${extra}</div>
  </div>
</section>`;
const itemList = (name, list) => ({ '@type': 'ItemList', name, numberOfItems: list.length, itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/work/${x.slug}/`), name: x.name })) });

/* ---------- /work/ : everything, in lanes ---------- */
const gallery = {
  url: '/work/', og: 'work', priority: 0.9, changefreq: 'weekly',
  meta: { key: 'work', title: `${Words(builds.length)} builds. All of them running.`, kicker: `The rack · ${builds.length} channels`, sub: `${SITES.length} websites in four lanes, ${TOOLS.length} tools broad and specific — every one live, open to use.` },
  render(b){
    const title = `Work — ${builds.length} live websites & business tools | ${site.name}`;
    const description = `${Words(builds.length)} example websites and tools for service businesses, running live: ${SITES.length} full websites in four lanes and ${TOOLS.length} tools, from booking and quotes to a window cleaner's round.`.slice(0, 158);
    const nodes = [
      L.webPage({ path: '/work/', title, description, type: 'CollectionPage' }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }]),
      itemList('Working builds by ' + site.name, builds),
    ];
    const body = `
${L.header(b, 'work')}
<main id="main">
<section class="hero-w wrap">
  <span class="plate"><span>The rack</span><span>${builds.length} channels</span><span class="on"><i class="lamp is-live"></i>All powered</span></span>
  <h1>${Words(builds.length)} builds.<br>All of them <span class="off">running.</span></h1>
  <div class="row">
    <p class="lead">Example websites and business tools for service businesses, running live inside this page. <strong>${plural(SITES.length, 'website')}</strong> in four lanes &mdash; loud, motion, quiet, direct &mdash; and <strong>${plural(TOOLS.length, 'tool')}</strong>, the broad ones any business can use and the ones built around a single trade. Pick a channel and use it like a customer would.</p>
    <span class="plate specs"><span>${builds.length} builds</span><span>0 dependencies</span><span>0 stock photos</span><span>Every business invented</span></span>
  </div>
</section>

<section class="wrap rig-wrap desk" aria-label="Live build viewer">${rig(b)}</section>
<section class="wrap phone-only rig-note"><p class="hint spec"><span class="lamp is-live"></span> On a phone each build opens full screen from its cell. Every one also has its own page.</p></section>

<section class="wrap filter-bar">${filters(b, 'all')}</section>

<section class="panel" id="websites" data-kindpanel="site">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">Websites</span><span class="name">${plural(SITES.length, 'full site')}, four lanes</span></div>
    <div class="body">
      <h2>Four kinds of website.</h2>
      <p class="lead">Every business needs a different one. The lane is the decision: how loud, how much moves, how fast it gets to the phone number. <a class="lnk" href="${b}work/websites/">Which lane is yours?</a></p>
      ${SITE_LANES.map(k => laneBlock(b, k)).join('')}
    </div>
  </div>
</section>

<section class="panel" id="tools" data-kindpanel="tool">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">Tools</span><span class="name">${plural(TOOLS.length, 'working tool')}, broad and specific</span></div>
    <div class="body">
      <h2>The tools that run a service business.</h2>
      <p class="lead">Broad ones that fit any business that takes enquiries and books jobs, and specific ones built around one trade&rsquo;s actual day. <a class="lnk" href="${b}work/tools/">See them by trade.</a></p>
      ${TOOL_LANES.map(k => laneBlock(b, k)).join('')}
      <p class="f-note" style="margin-top:1.4rem">Every business, person, review and phone number in these builds is invented. No real client, address or account detail appears anywhere in them. The tools keep their own state in your browser and each has a reset inside.</p>
    </div>
  </div>
</section>
</main>
${cta(b, 'These are demos. Yours would have your name on it.', 'Same approach, your business: a site that captures the enquiry, a system that answers it in seconds, and a place where every job lives. Hand-built, no page-builder, owned by you.')}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/work/', title, description, og: 'work', css: ['rack.css'], nodes }), body, L.scripts(b, ['builds.js', 'rack.js']) + FILTER_JS + `<script>initRig(${builds.some(x => x.n === 14) ? 14 : builds[0].n});</script>`);
  }
};

/* ---------- /work/websites/ : the four lanes, explained ---------- */
const websites = {
  url: '/work/websites/', og: 'websites', priority: 0.9, changefreq: 'weekly',
  meta: { key: 'websites', title: 'Four kinds of website.', kicker: `Websites · ${SITES.length} live examples`, sub: 'Loud, motion, quiet, direct. Pick the lane that matches how your customers decide.' },
  render(b){
    const title = `Website design for service businesses: ${SITES.length} live examples | ${site.name}`.length <= 60 ? `Website design for service businesses: ${SITES.length} live examples | ${site.name}` : `Website examples for service businesses | ${site.name}`;
    const description = `${Words(SITES.length)} full websites for invented businesses, running live, in four lanes: loud and animated, motion-led, quiet and plain, or direct and built to get the phone ringing.`.slice(0, 158);
    const nodes = [
      L.webPage({ path: '/work/websites/', title, description, type: 'CollectionPage' }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }, { name: 'Websites', path: '/work/websites/' }]),
      itemList('Website examples by ' + site.name, SITES),
      { '@type': 'FAQPage', mainEntity: SITE_LANES.map(k => ({ '@type': 'Question', name: LANES[k].question, acceptedAnswer: { '@type': 'Answer', text: LANES[k].answer } })) },
    ];
    const body = `
${L.header(b, 'websites')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, [['Home', ''], ['Work', 'work/'], ['Websites', 'work/websites/']])}
  <span class="plate"><span>Websites</span><span>${plural(SITES.length, 'example')}</span><span class="on"><i class="lamp is-live"></i>All live</span></span>
  <h1>Four kinds <br class="br-lg">of <span class="off">website.</span></h1>
  <div class="row">
    <p class="lead">A boxing club and an accountant should not get the same site. The lane is the first decision: <strong>how loud, how much moves, how fast it gets to the phone number.</strong> Every example below is a full website for an invented business, running live. Open one and use it.</p>
    <span class="plate specs"><span>4 lanes</span><span>0 templates</span><span>0 stock photos</span><span>Every business invented</span></span>
  </div>
</section>

<section class="panel">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">Which lane</span><span class="name">Match the lane to how your customers decide</span></div>
    <div class="body">
      <h2>Which kind of website does your business need?</h2>
      <dl class="nameplate">
        ${SITE_LANES.map(k => `<div><dt><a class="lnk" href="#${k}">${esc(LANES[k].name)}</a></dt><dd><b>${esc(LANES[k].line)}</b> ${esc(LANES[k].who)}</dd></div>`).join('')}
      </dl>
    </div>
  </div>
</section>

<section class="wrap filter-bar">${filters(b, 'site')}</section>

${SITE_LANES.map(k => `<section class="panel lane" id="${k}" data-lane="${k}" data-kind="site">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">${esc(LANES[k].name)}</span><span class="name">${esc(LANES[k].line)}</span></div>
    <div class="body">
      ${specimen(k)}
      <h2>${esc(LANES[k].question)}</h2>
      <p class="lead">${esc(LANES[k].answer)}</p>
      ${inLane(k).length ? `<div class="rack" data-rack="${k}"></div>` : '<p class="f-note">Nothing in this lane yet.</p>'}
    </div>
  </div>
</section>`).join('')}
</main>
${cta(b, 'Not sure which lane you are?', 'Book a short call. You will hear which kind of site your customers actually respond to, and whether you need one at all.', `<a class="btn btn-ghost" href="${b}work/tools/">See the tools instead</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/work/websites/', title, description, og: 'websites', css: ['rack.css'], nodes }), body, L.scripts(b, ['builds.js', 'rack.js', 'specimens.js']) + FILTER_JS);
  }
};

/* ---------- /work/tools/ : broad and specific, and by trade ---------- */
const tools = {
  url: '/work/tools/', og: 'tools', priority: 0.9, changefreq: 'weekly',
  meta: { key: 'tools', title: 'The tools that run a service business.', kicker: `Tools · ${TOOLS.length} live examples`, sub: 'Booking, quotes, the pipeline, follow-up — and the ones built for one trade’s day.' },
  render(b){
    const trades = [...new Set(TOOLS.map(x => x.trade))].sort((a, z) => a.localeCompare(z));
    const title = `Business tools for trades: ${TOOLS.length} live examples | ${site.name}`;
    const description = `${Words(TOOLS.length)} working tools for service businesses, running live: booking, quotes, missed-call text-back, reviews, the pipeline, plus tools built for heating engineers, garages, salons, restaurants, roofers and rounds.`.slice(0, 158);
    const nodes = [
      L.webPage({ path: '/work/tools/', title, description, type: 'CollectionPage' }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }, { name: 'Tools', path: '/work/tools/' }]),
      itemList('Business tools by ' + site.name, TOOLS),
      { '@type': 'FAQPage', mainEntity: TOOL_LANES.map(k => ({ '@type': 'Question', name: LANES[k].question, acceptedAnswer: { '@type': 'Answer', text: LANES[k].answer } })) },
    ];
    const body = `
${L.header(b, 'tools')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, [['Home', ''], ['Work', 'work/'], ['Tools', 'work/tools/']])}
  <span class="plate"><span>Tools</span><span>${plural(TOOLS.length, 'example')}</span><span class="on"><i class="lamp is-live"></i>All live</span></span>
  <h1>The tools that run <br class="br-lg">a <span class="off">service business.</span></h1>
  <div class="row">
    <p class="lead">Software that sits between the customer and the diary. <strong>Broad</strong> tools fit any business that takes enquiries and books jobs. <strong>Specific</strong> tools are built around one trade&rsquo;s actual day. Every one here is running live with invented data, and each has a reset inside.</p>
    <span class="plate specs"><span>${inLane('broad').length} broad</span><span>${inLane('specific').length} specific</span><span>${trades.length} trades</span><span>Every business invented</span></span>
  </div>
</section>

<section class="wrap filter-bar">${filters(b, 'tool')}</section>

${TOOL_LANES.map(k => `<section class="panel lane" id="${k}" data-lane="${k}" data-kind="tool">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">${esc(LANES[k].name)}</span><span class="name">${esc(LANES[k].line)}</span></div>
    <div class="body">
      <h2>${esc(LANES[k].question)}</h2>
      <p class="lead">${esc(LANES[k].answer)}</p>
      ${inLane(k).length ? `<div class="rack" data-rack="${k}"></div>` : '<p class="f-note">Nothing here yet.</p>'}
    </div>
  </div>
</section>`).join('')}

<section class="panel" id="by-trade">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">By trade</span><span class="name">Find the tool built for your day</span></div>
    <div class="body">
      <h2>Which tools are built for my trade?</h2>
      <dl class="nameplate trades">
        ${trades.map(t => `<div><dt>${esc(t)}</dt><dd>${TOOLS.filter(x => x.trade === t).map(x => `<a class="lnk" href="${b}work/${x.slug}/">${esc(x.name)}</a>`).join(' &middot; ')}</dd></div>`).join('')}
      </dl>
    </div>
  </div>
</section>
</main>
${cta(b, 'Which of these would earn its keep for you?', 'A short call to find out what is leaking in your business and which of these would stop it. No pitch, no proposal deck.', `<a class="btn btn-ghost" href="${b}work/websites/">See the websites instead</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/work/tools/', title, description, og: 'tools', css: ['rack.css'], nodes }), body, L.scripts(b, ['builds.js', 'rack.js']) + FILTER_JS);
  }
};

/* ---------- one page per build ---------- */
const cases = builds.map(x => {
  const lane = laneOf(x), peers = inLane(x.lane), i = peers.findIndex(y => y.slug === x.slug);
  const prev = peers[(i + peers.length - 1) % peers.length], next = peers[(i + 1) % peers.length];
  const related = builds.filter(y => y.slug !== x.slug && y.trade === x.trade && !/^any /i.test(x.trade)).slice(0, 3);
  return {
    url: `/work/${x.slug}/`, og: `work-${x.slug}`, priority: 0.8, changefreq: 'monthly',
    meta: { key: `work-${x.slug}`, title: x.name, kicker: `CH ${pad(x.n)} · ${x.biz} · ${kindWord(x)} · ${lane.name}`, sub: x.short, colour: x.c, sheet: x.sheet },
    render(b){
      const kw = kindWord(x).toLowerCase();
      /* titles must land under 60 chars whatever a build's own copy looks like: name — trade,
         then name alone, adding the brand only while it still fits */
      const title = (() => {
        for (const t of [`${x.name} — ${x.trade}`, `${x.name} — ${x.biz}`, x.name]){
          if (t.length <= 44) return `${t} | ${site.name}`;
          if (t.length <= 60) return t;
        }
        return x.name.slice(0, 57) + '…';
      })();
      const description = `${x.short} ${x.long}`.slice(0, 158);
      const nodes = [
        L.webPage({ path: `/work/${x.slug}/`, title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs(`/assets/stills/${pad(x.n)}.webp`) } } }),
        L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }, { name: lane.kindWord, path: '/' + lane.path }, { name: x.name, path: `/work/${x.slug}/` }]),
        { '@type': x.kind === 'site' ? 'CreativeWork' : 'SoftwareApplication', name: x.name, url: L.abs(`/work/${x.slug}/`),
          description: x.long, creator: { '@id': L.ORG_ID }, author: { '@id': L.PERSON_ID },
          image: L.abs(`/assets/stills/${pad(x.n)}.webp`), genre: x.kind === 'site' ? `Website design · ${lane.name}` : `Business software · ${lane.name}`,
          keywords: [x.trade, lane.name, ...(x.tags || [])].join(', '), isAccessibleForFree: true, inLanguage: 'en-GB',
          ...(x.kind === 'site' ? {} : { applicationCategory: 'BusinessApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Demonstration build, free to use on this site' } }),
          about: `A demonstration ${kw} ${L.builtFor(x)}.` },
      ];
      const body = `
${L.header(b, x.kind === 'site' ? 'websites' : 'tools')}
<main id="main">
<article class="case">
  <section class="wrap case-head">
    ${crumbs(b, [['Home', ''], ['Work', 'work/'], [lane.kindWord, lane.path], [x.name, `work/${x.slug}/`]])}
    <span class="plate"><span>CH ${pad(x.n)}</span><span><i class="sw" style="background:${x.c}"></i>${esc(x.biz)}</span><span><a href="${b}${lane.path}#${x.lane}">${kindWord(x)} &middot; ${esc(lane.name)}</a></span><span class="on"><i class="lamp is-live"></i>Live</span></span>
    <h1>${esc(x.name)}</h1>
    <p class="lead">${esc(x.short)} ${esc(x.long)}</p>
  </section>

  <section class="wrap rig-wrap desk" aria-label="The build, running">
    ${rig(b, { rail: false, solo: true, x })}
    <p class="hint spec" style="margin-top:.8rem"><span class="lamp is-live"></span> This is the build itself, not a recording. Use it like a customer would. State is kept in your browser; there is a reset inside.</p>
  </section>
  <section class="wrap rig-wrap" aria-label="The build, on a phone">${poster(b, x)}</section>

  <section class="panel">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">What it proves</span><span class="name">${esc(x.proves)}</span></div>
      <div class="body case-grid">
        <div>
          <h2>What does ${esc(x.name)} do?</h2>
          <p class="lead">${esc(x.name)} is a working ${kw} ${esc(L.builtFor(x))}. ${esc(x.story)}</p>
          <p class="lead" style="margin-top:1rem">It sits in the <a class="lnk" href="${b}${lane.path}#${x.lane}">${esc(lane.name)}</a> lane: ${esc(lane.line.toLowerCase())}</p>
        </div>
        <div>
          <h2 class="h3">What is in it</h2>
          <ul class="feat">${(x.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <div class="tags" style="margin-top:14px">${(x.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
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
          <div><dt>Runs on</dt><dd>${x.mobile ? 'Any modern browser, and it is built for phones as much as desktops.' : 'Any modern browser. It is designed for a desktop or tablet; on a phone, open it full screen.'} State stays in your browser; there is a reset control inside.</dd></div>
          <div><dt>Yours would</dt><dd>Carry your name, your numbers and your diary, and be owned by you from day one.</dd></div>
        </dl>
      </div>
    </div>
  </section>

  <nav class="panel casenav" aria-label="More builds">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">More &middot; ${esc(lane.name)}</span><span class="name">${peers.length > 1 ? `The next ${esc(lane.name.toLowerCase())} builds` : 'Every build has its own page'}</span></div>
      <div class="body">
        <div class="casenav-grid">
          <a class="cnav" href="${b}work/${prev.slug}/"><span class="spec">Previous &middot; CH ${pad(prev.n)}</span><img src="${still(b, prev)}" width="800" height="500" loading="lazy" decoding="async" alt="${esc(prev.name)} — ${esc(prev.short)}"><b>${esc(prev.name)}</b><span>${esc(prev.short)}</span></a>
          <a class="cnav" href="${b}work/${next.slug}/"><span class="spec">Next &middot; CH ${pad(next.n)}</span><img src="${still(b, next)}" width="800" height="500" loading="lazy" decoding="async" alt="${esc(next.name)} — ${esc(next.short)}"><b>${esc(next.name)}</b><span>${esc(next.short)}</span></a>
        </div>
        <p class="f-note" style="margin-top:1rem">${related.length ? `Same trade: ${related.map(y => `<a class="lnk" href="${b}work/${y.slug}/">${esc(y.name)}</a>`).join(', ')}. ` : ''}<a class="lnk" href="${b}${lane.path}#${x.lane}">Every ${esc(lane.name.toLowerCase())} ${lane.kind === 'site' ? 'website' : 'tool'}</a> &middot; <a class="lnk" href="${b}work/">the whole rack</a></p>
      </div>
    </div>
  </nav>
</article>
</main>
${cta(b, 'Want one like this, with your name on it?', `A short call to find out what is leaking in your business and whether a build like ${esc(x.name)} is the right fix.`, `<a class="btn btn-ghost" href="${b}${lane.path}">More ${esc(lane.kindWord.toLowerCase())}</a>`)}
${L.footer(b)}`;
      return L.page(L.head({ b, path: `/work/${x.slug}/`, title, description, og: `work-${x.slug}`, css: ['rack.css'], nodes, palette: x }), body,
        L.scripts(b, ['builds.js', 'rack.js']) + `<script>initRig(${x.n},{solo:true});</script>`);
    }
  };
});

module.exports = { pages: [gallery, websites, tools, ...cases] };
