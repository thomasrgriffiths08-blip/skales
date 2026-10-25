const fs = require('fs'), path = require('path');
const L = require('../lib.js');
const CREDITS = require('../../data/photo-credits.js');
const { site, builds, esc, pad, LANES, SITE_LANES, TOOL_LANES, laneOf, kindWord, Words } = L;

const SITES = builds.filter(x => x.kind === 'site');
const FIRST = [...SITE_LANES, ...TOOL_LANES].map(k => builds.filter(x => x.lane === k).sort((a, z) => a.n - z.n)[0]).find(Boolean);
const inLane = k => builds.filter(x => x.lane === k);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const crumbs = (b, items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map((it, i) => i === items.length - 1 ? `<span aria-current="page">${esc(it[0])}</span>` : `<a href="${b}${it[1]}">${esc(it[0])}</a><span>/</span>`).join('')}</nav>`;
const itemList = (name, list) => ({ '@type': 'ItemList', name, numberOfItems: list.length, itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/work/${x.slug}/`), name: x.name })) });
const laneSection = (b, k, { question = false } = {}) => {
  const l = LANES[k], list = inLane(k);
  return `<section class="sec lane" id="${k}" data-lanehead="${k}" aria-labelledby="h-${k}">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-${k}">${question ? esc(l.question) : `${esc(l.kindWord)} &middot; ${esc(l.name)}`}</h2>
      <p class="lead">${question ? esc(l.answer) : `<strong>${esc(l.line)}</strong> ${esc(l.who)}`}</p>
    </div>
    ${list.length ? L.wall(b, list, list.length === 3 ? 'wall-3' : '') : '<p class="f-note">Nothing here yet.</p>'}
  </div>
</section>`;
};
/* the system: the live app on a laptop-shaped screen, its parts beside it, and the six businesses it is set up for */
const PARTS = builds.filter(x => x.lane === 'system');
const BIZ = [['heating', 'Larchfield Heating', 'Plumbing and heating'], ['electrical', 'Kestrel Electrical', 'Electrician'], ['garage', 'Kerb & Camber', 'Garage and MOT'], ['salon', 'Linden Rooms', 'Hair salon'], ['cleaning', 'Brightwell Cleaning', 'Cleaning'], ['clinic', 'Fern Physio', 'Physio clinic']];
const sysBlock = b => {
  const main = PARTS.find(x => x.slug === 'system'), rest = PARTS.filter(x => x !== main);
  if (!main) return '';
  return `<div class="sys-rig">
      <a class="sys-main" href="${b}work/${main.slug}/" data-view="${main.slug}">
        <span class="shell"><picture><source media="(max-width: 640px)" srcset="${L.phoneSrc(b, main)}" width="585" height="1266"><img src="${L.clipSrc(b, main, 'webp')}" width="1280" height="800" alt="${esc(main.name)}: ${esc(main.short)}" loading="lazy" decoding="async"></picture><video muted playsinline preload="none" data-src="${L.clipSrc(b, main, 'mp4')}" aria-hidden="true"></video></span>
        <span class="sys-cap"><b>Open the system</b><span>${esc(main.short)}</span></span>
      </a>
      <div class="sys-biz"><p>Open it as one of six made-up businesses:</p><div>${BIZ.map(([k, n, t]) => `<a href="${b}demos/system/?t=${k}#s=1" target="_blank" rel="noopener"><b>${esc(n)}</b><span>${esc(t)}</span></a>`).join('')}</div></div>
    </div>
    <h3 class="sys-h">The six parts</h3>
    ${L.wall(b, rest, 'wall-3')}`;
};
/* the desk: the system on a laptop and the customer's phone beside it, live and talking to each other
   (tools/system/desk.js, tools/system/phone.js, assets/desk.js). On a phone, one screen at a time. */
const DESK_STEPS = [
  ['Ring the business', 'You’re the customer. Tap call on the phone.'],
  ['Nobody can answer', 'They’re on a job. Watch the system catch the call.'],
  ['A text comes straight back', 'Seconds after the call. Reply to it as the customer.'],
  ['Send the booking link', 'Back at the business, one tap in the inbox.'],
  ['Pick a time and pay', 'The customer books a real free slot and pays the deposit.'],
  ['It’s in the diary', 'Booked and paid, without anyone picking up the phone.']
];
const deskHTML = (b, trade) => `<div class="desk" data-desk data-trade="${trade || 'heating'}">
        <div class="desk-seg" role="group" aria-label="Show"><button type="button" data-side="phone" aria-pressed="true">Customer’s phone</button><button type="button" data-side="biz" aria-pressed="false">Your system</button></div>
        <div class="desk-stage" data-side="phone">
          <div class="desk-laptop"><div class="lid"><div class="scrn"><iframe title="The system, live" loading="lazy" data-src="${b}demos/inbox/?t=${trade || 'heating'}&amp;desk={id}#s=1"></iframe></div></div><div class="base" aria-hidden="true"></div></div>
          <div class="desk-phone"><div class="bezel"><span class="island" aria-hidden="true"></span><div class="scrn"><iframe title="The customer’s phone, live" loading="lazy" data-src="${b}demos/system/phone.html?t=${trade || 'heating'}&amp;desk={id}#s=1"></iframe></div></div></div>
        </div>
        <div class="desk-guide">
          <ol class="desk-steps">${DESK_STEPS.map(([h, t], i) => `<li data-s="${i + 1}"${i ? '' : ' aria-current="step"'}><b>${esc(h)}</b><span>${esc(t)}</span></li>`).join('')}</ol>
          <div class="desk-end"><div class="desk-clock"><small>Missed call to booked</small><b data-clock>0:00</b></div><div class="desk-btns"><button type="button" class="btn btn-dark" data-play>Play it for me</button><button type="button" class="btn btn-ghost" data-reset>Start again</button></div></div>
        </div>
      </div>`;
/* a lane: its name and who it is for beside (websites) or above (tools) its builds */
const laneRow = (b, k) => {
  const l = LANES[k], list = inLane(k).sort((a, z) => a.n - z.n);
  return `<div class="lrow${l.kind === 'tool' ? ' lrow-top' : ''}" id="${k}" data-lanehead="${k}">
      <div class="lhead"><h3>${esc(l.name)}</h3><p>${esc(l.line)}</p><small>${esc(l.who)}</small></div>
      ${L.wall(b, list, l.kind === 'site' ? 'wall-3' : '')}
    </div>`;
};

/* ---------- /work/ : everything ---------- */
const gallery = {
  url: '/work/', og: 'work', priority: 0.9, changefreq: 'weekly',
  meta: { key: 'work', title: `${Words(SITES.length)} websites. One system behind them.`, kicker: `Work · every one running live`, sub: `${SITES.length} full websites and the system that answers, books and follows up.` },
  render(b){
    const title = `Work: ${SITES.length} live websites and the system behind them | ${site.name}`.length <= 60 ? `Work: ${SITES.length} live websites and the system behind them | ${site.name}` : `Work: ${SITES.length} websites and one system | ${site.name}`;
    const description = `${Words(SITES.length)} full websites for made-up service businesses, running live, and the system behind them: missed-call text-back, booking with deposits, quotes, reviews and reminders.`.slice(0, 158);
    const nodes = [
      L.webPage({ path: '/work/', title, description, type: 'CollectionPage' }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }]),
      itemList('Working builds by ' + site.name, builds),
    ];
    const body = `
${L.header(b, 'work')}
<main id="main">
<section class="hero-w wrap work-hero">
  <h1>${Words(SITES.length)} websites.<br>One system behind them.</h1>
  <p class="lead">${Words(SITES.length)} full websites, each built differently for a different kind of business, and the one system that answers the phone, books the job and follows up. Every business is made up, so no client is on show. Tap any of them to use it.</p>
  <div class="cta-row" style="margin-top:28px;align-items:center"><button type="button" class="btn btn-dark" data-view="${FIRST.slug}">Flick through them all</button><span class="hint-inline">Full screen, one at a time. Arrow keys work.</span></div>
  <nav class="work-jump" aria-label="On this page"><a href="#websites"><b>The websites</b><span>${SITES.length} sites, four kinds</span></a><a href="#system"><b>The system</b><span>One app, six parts</span></a></nav>
</section>
<div id="wall">
<section class="kindsec" id="websites" data-kindsec="site" aria-labelledby="h-websites">
  <div class="wrap">
    <div class="khead"><h2 id="h-websites">The websites</h2><p>A boxing club and an accountant should not get the same site. Each of these is a complete website for one kind of business, with its own look, its own pages and its own way of getting the phone to ring. They are grouped by how loud they are. <a class="lnk" href="${b}work/websites/">How to pick yours</a>.</p></div>
    <div class="lrows">${SITE_LANES.map(k => laneRow(b, k)).join('\n    ')}</div>
  </div>
</section>
<section class="kindsec" id="system" data-kindsec="tool" aria-labelledby="h-system">
  <div class="wrap">
    <div class="khead"><h2 id="h-system">The system</h2><p>Behind every website: one app for the whole business. A missed call gets a text back in seconds, the customer books and pays a deposit, quotes chase themselves, reviews and repeat work ask for themselves, and you can see which ad booked which job. It is the real thing, not a video, so press around.</p></div>
    ${sysBlock(b)}
  </div>
</section>
</div>
</main>
${L.forgeInvite(b, 'Pick your trade on the home page, put your business name in, and a working website for your business builds itself in a couple of seconds. Nothing to fill in but a name and a town.')}
${L.ctaBand(b, 'These are demos. Yours would have your name on it.', 'Same approach, your business: a site that captures the enquiry, a system that answers it in seconds, and a place where every job lives. Hand-built, owned by you.')}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/work/', title, description, og: 'work', css: ['device.css'], nodes }), body, L.scripts(b, ['builds.js', 'device.js']));
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
  <h1>Four kinds of website.</h1>
  <p class="lead">A boxing club and an accountant should not get the same site. The first decision is the lane: <strong>how loud, how much moves, how fast it gets to the phone number.</strong> Every example is a full website for an invented business, running live.</p>
  <div class="lanes" style="margin-top:36px">
    ${SITE_LANES.map(k => `<a href="#${k}"><b>${esc(LANES[k].name)}</b><span>${esc(LANES[k].line)}</span><small>${plural(inLane(k).length, 'example')} &middot; ${esc(LANES[k].who)}</small></a>`).join('')}
  </div>
</section>
${SITE_LANES.map(k => laneSection(b, k, { question: true })).join('')}
</main>
${L.ctaBand(b, 'Not sure which lane you are?', 'Book a short call. You will hear which kind of site your customers actually respond to, and whether you need one at all.', `<a class="btn btn-ghost" href="${b}work/system/">See the system behind them</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/work/websites/', title, description, og: 'websites', css: ['device.css'], nodes }), body, L.scripts(b, ['builds.js', 'device.js']));
  }
};

/* the real photographs a build uses (from assets/photos), each with its credit */
const photosIn = slug => {
  let h = ''; try { h = fs.readFileSync(path.join(__dirname, '..', '..', 'demos', slug, 'index.html'), 'utf8'); } catch (e){}
  const out = [];
  for (const m of h.matchAll(/assets\/photos\/([a-z]+)(-2|-sm)?\.(?:webp|jpg)/g)){
    const c = CREDITS[m[1]], p = c && (m[2] === '-2' ? c.second : c.hero);
    if (p && p.by && !out.includes(p)) out.push(p);
  }
  return out;
};
const domain = site.origin.replace(/^https?:\/\//, '');

const caseCopy = (b, x, lane) => `<div class="meta">${x.lane === 'system' ? `<span>${x.slug === 'system' ? 'One app, six parts' : `Part of <a href="${b}work/system/">the system</a>`}</span><span>Shown for six made-up businesses</span>` : `<span>${esc(kindWord(x))} &middot; <a href="${b}${lane.path}#${x.lane}">${esc(lane.name)}</a></span><span>${esc(x.biz)}, invented</span>`}</div>
          <div class="cta-row"><a class="btn btn-dark" href="${b}demos/${x.slug}/#s=1" target="_blank" rel="noopener">Use it full screen</a><a class="btn btn-ghost" href="${b}book/">Book a call</a></div>
          <p class="hint">This is the build itself, not a recording. Use it like a customer would, or press Show me in full screen and watch it work.</p>`;
/* the system's parts, the current one marked, and the six businesses it opens as */
const partsNav = (b, x) => `<ol class="sys-parts">${PARTS.map(y => `<li><a href="${b}work/${y.slug}/"${y.slug === x.slug ? ' aria-current="page"' : ''}><b>${y.slug === 'system' ? 'Today' : esc(y.name)}</b><span>${esc(y.proves)}</span></a></li>`).join('')}</ol>
        <div class="sys-biz sys-biz-row"><p>Open ${x.slug === 'system' ? 'it' : 'this part'} as one of the six businesses:</p><div>${BIZ.map(([k, n, t]) => `<a href="${b}demos/${x.slug}/?t=${k}#s=1" target="_blank" rel="noopener"><b>${esc(n)}</b><span>${esc(t)}</span></a>`).join('')}</div></div>`;
/* ---------- one page per build ---------- */
const cases = builds.map(x => {
  const lane = laneOf(x), peers = inLane(x.lane), i = peers.findIndex(y => y.slug === x.slug);
  const prev = peers[(i + peers.length - 1) % peers.length], next = peers[(i + 1) % peers.length];
  const photos = photosIn(x.slug);
  const related = builds.filter(y => y.slug !== x.slug && y.trade === x.trade && !/^any /i.test(x.trade)).slice(0, 3);
  return {
    url: `/work/${x.slug}/`, og: `work-${x.slug}`, priority: 0.8, changefreq: 'monthly',
    meta: { key: `work-${x.slug}`, title: x.name, kicker: `${x.biz} · ${kindWord(x)} · ${lane.name}`, sub: x.short, colour: x.c, sheet: x.sheet, phone: `assets/phones/${pad(x.n)}.webp` },
    render(b){
      const kw = kindWord(x).toLowerCase();
      const title = (() => {
        for (const t of [`${x.name} — ${x.trade}`, `${x.name} — ${x.biz}`, x.name]){
          if (t.length <= 44) return `${t} | ${site.name}`;
          if (t.length <= 60) return t;
        }
        return x.name.slice(0, 57) + '…';
      })();
      const description = `${x.short} ${x.long}`.slice(0, 158);
      const nodes = [
        L.webPage({ path: `/work/${x.slug}/`, title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs(`/assets/phones/${pad(x.n)}.webp`) } } }),
        L.breadcrumb(x.slug === 'system' ? [{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }, { name: 'The system', path: '/work/system/' }] : [{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }, { name: lane.kindWord, path: '/' + lane.path }, { name: x.name, path: `/work/${x.slug}/` }]),
        { '@type': x.kind === 'site' ? 'CreativeWork' : 'SoftwareApplication', name: x.name, url: L.abs(`/work/${x.slug}/`),
          description: x.long, creator: { '@id': L.ORG_ID }, author: { '@id': L.PERSON_ID },
          image: L.abs(`/assets/phones/${pad(x.n)}.webp`), genre: x.kind === 'site' ? `Website design · ${lane.name}` : `Business software · ${lane.name}`,
          keywords: [x.trade, lane.name, ...(x.tags || [])].join(', '), isAccessibleForFree: true, inLanguage: 'en-GB',
          ...(x.kind === 'site' ? {} : { applicationCategory: 'BusinessApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Demonstration build, free to use on this site' } }),
          about: `A demonstration ${kw} ${L.builtFor(x)}.` },
      ];
      const body = `
${L.header(b, x.kind === 'site' ? 'websites' : 'system')}
<main id="main">
<article class="case">
  <section class="case-hero${x.kind === 'tool' ? ' is-tool' : ''}">
    <div class="wrap">
      ${crumbs(b, x.slug === 'system' ? [['Home', ''], ['Work', 'work/'], ['The system', 'work/system/']] : [['Home', ''], ['Work', 'work/'], [lane.kindWord, lane.path], [x.name, `work/${x.slug}/`]])}
      <h1>${esc(x.name)}</h1>
      <p class="lead short">${esc(x.short)}</p>
      ${x.slug === 'system' ? `${deskHTML(b)}
      <div class="case-words">
        <p class="lead">${esc(x.long)}</p>
        <div class="copy">${caseCopy(b, x, lane)}</div>
      </div>` : x.kind === 'tool' ? `<div class="case-rig">
        <div class="rig"><div class="chrome"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><span class="url">${esc(domain)}/demos/<b>${esc(x.slug)}</b>/</span><button type="button" class="pop" data-view="${x.slug}">Full screen</button></div>
          <div class="viewport" data-solo="${x.slug}" data-solo-still><div class="boot"><img src="${L.clipSrc(b, x, 'webp')}" width="1280" height="800" alt="${esc(x.name)} on a laptop" fetchpriority="high" decoding="async"></div></div></div>
      </div>
      <div class="case-words">
        <p class="lead">${esc(x.long)}</p>
        <div class="copy">${caseCopy(b, x, lane)}</div>
      </div>` : `<div class="grid">
        <div class="copy">
          <p class="lead">${esc(x.long)}</p>
          ${caseCopy(b, x, lane)}
        </div>
        <div class="side">${L.device(b, x)}</div>
      </div>`}
    </div>
  </section>

  <section class="panel">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">What it proves</span><span class="name">${esc(x.proves)}</span></div>
      <div class="body case-grid">
        <div>
          ${x.lane === 'system' ? `<h2>${x.slug === 'system' ? 'What is the system for?' : 'What is this part for?'}</h2>
          <p class="lead">${esc(x.story)}</p>` : `<h2>What does ${esc(x.name)} do?</h2>
          <p class="lead">${esc(x.name)} is a working ${kw} ${esc(L.builtFor(x))}. ${esc(x.story)}</p>`}
          ${x.lane === 'system' ? '' : `<p class="lead">It sits in the <a class="lnk" href="${b}${lane.path}#${x.lane}">${esc(lane.name)}</a> lane: ${esc(lane.line.toLowerCase())}</p>`}
        </div>
        <div>
          <h3>What is in it</h3>
          <ul class="feat" style="margin-top:12px">${(x.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <div class="tags" style="margin-top:16px">${(x.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
        </div>
      </div>
    </div>
  </section>

  ${x.lane === 'system' && x.slug !== 'system' ? '' : `<section class="panel">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">How it was built</span><span class="name">By hand, with nothing bought in</span></div>
      <div class="body">
        <dl class="nameplate">
          <div><dt>Written</dt><dd>By hand, as a single self-contained page. No page-builder, no theme, no framework.</dd></div>
          <div><dt>Dependencies</dt><dd>No frameworks. Fonts are served from this site with system fallbacks, and the drawings, charts and interactions are written into the page.</dd></div>
          <div><dt>Imagery</dt><dd>${photos.length ? `Real photographs by ${photos.map(p => p.url ? `<a class="lnk" href="${p.url}" rel="noopener">${esc(p.by)}</a>` : esc(p.by)).join(' and ')} on Pexels, free for commercial use. Everything else is drawn in code, SVG or canvas.` : 'No stock. Every visual is drawn in code, SVG or canvas.'}</dd></div>
          <div><dt>The business</dt><dd>${x.lane === 'system' ? 'Six made-up service businesses.' : `${esc(x.biz)} is invented.`} Every person, number and review inside is fictional so nothing here exposes a real client.</dd></div>
          <div><dt>Runs on</dt><dd>Any modern browser, on a phone as much as a desktop.</dd></div>
          <div><dt>Yours would</dt><dd>Carry your name, your numbers and your diary, and be owned by you from day one.</dd></div>
        </dl>
      </div>
    </div>
  </section>`}

  ${x.lane === 'system' ? `<nav class="panel" aria-label="The parts of the system">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">The system</span><span class="name">One app, six parts</span></div>
      <div class="body">
        <h2>${x.slug === 'system' ? 'What is in the system?' : 'What else is in the system?'}</h2>
        <p class="lead">Every part shares the same customers, diary and messages, so a missed call becomes a booking, the booking becomes a review ask, and the review shows up in the monthly results without anyone typing it twice.</p>
        ${partsNav(b, x)}
      </div>
    </div>
  </nav>` : `<nav class="panel" aria-label="More builds">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">More &middot; ${esc(lane.name)}</span><span class="name">${peers.length > 1 ? `The next ${esc(lane.name.toLowerCase())} ${lane.kind === 'site' ? 'websites' : 'tools'}` : 'Every build has its own page'}</span></div>
      <div class="body">
        <div class="pair">${L.tile(b, prev, { dir: 'Previous' })}${L.tile(b, next, { dir: 'Next' })}</div>
        <p class="f-note" style="margin-top:20px">${related.length ? `Same trade: ${related.map(y => `<a class="lnk" href="${b}work/${y.slug}/">${esc(y.name)}</a>`).join(', ')}. ` : ''}<a class="lnk" href="${b}${lane.path}#${x.lane}">Every ${esc(lane.name.toLowerCase())} ${lane.kind === 'site' ? 'website' : 'tool'}</a> &middot; <a class="lnk" href="${b}work/">all ${builds.length} builds</a>. Or <a class="lnk" href="${b}">build one for your own business</a> in a couple of seconds.</p>
      </div>
    </div>
  </nav>`}
</article>
</main>
${x.lane === 'system' ? L.ctaBand(b, 'Want this running for your business?', 'A free 30-minute call: which part would earn its keep first, what it would cost, and when it could be live.', `<a class="btn btn-ghost" href="${b}work/#websites">See the websites</a>`) : L.ctaBand(b, 'Want one like this, with your name on it?', `A short call to find out what is leaking in your business and whether a build like ${esc(x.name)} is the right fix.`, `<a class="btn btn-ghost" href="${b}${lane.path}">More ${esc(lane.kindWord.toLowerCase())}</a>`)}
${L.footer(b)}`;
      return L.page(L.head({ b, path: `/work/${x.slug}/`, title, description, og: `work-${x.slug}`, css: ['device.css'], nodes, palette: x }), body, L.scripts(b, x.slug === 'system' ? ['builds.js', 'device.js', 'desk.js'] : ['builds.js', 'device.js']));
    }
  };
});

module.exports = { pages: [gallery, websites, ...cases] };
