const fs = require('fs'), path = require('path');
const L = require('../lib.js');
const CREDITS = require('../../data/photo-credits.js');
const { site, builds, esc, pad, LANES, SITE_LANES, TOOL_LANES, laneOf, kindWord, Words } = L;

const SITES = builds.filter(x => x.kind === 'site'), TOOLS = builds.filter(x => x.kind === 'tool');
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
/* the demos page opens on four builds shown big: two tools on a laptop-shaped screen, two websites on a phone */
const PICKS = ['ringsback', 'kerb-and-camber', 'southpaw', 'slate'].map(s => builds.find(x => x.slug === s)).filter(Boolean);
const pick = (b, x) => {
  const wide = x.kind === 'tool', steps = (x.show || []).map(s => s.say).filter(Boolean).slice(0, 3);
  return `<a class="pick${wide ? ' is-wide' : ''}" href="${b}work/${x.slug}/" data-view="${x.slug}" style="--pc:${x.c}">
    <span class="pick-stage"><span class="shell"><img src="${L.clipSrc(b, x, 'webp')}" width="${wide ? 1280 : 600}" height="${wide ? 800 : 1077}" alt="${esc(x.name)} ${wide ? 'on a laptop' : 'on a phone'}: ${esc(x.short)}" loading="lazy" decoding="async"><video muted playsinline preload="none" data-src="${L.clipSrc(b, x, 'mp4')}" aria-hidden="true"></video></span></span>
    <span class="pick-cap">
      <span class="pick-for">${esc(kindWord(x))} for a made-up ${esc((x.trade || x.biz).replace(/^Any /, 'any ').toLowerCase())}</span>
      <b>${esc(x.name)}</b>
      <span class="pick-short">${esc(x.short)}</span>
      ${steps.length ? `<ol class="try">${steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
      <span class="pick-go">Try it <span aria-hidden="true">&rarr;</span></span>
    </span>
  </a>`;
};
/* a lane: its name and who it is for beside (websites) or above (tools) its builds */
const laneRow = (b, k) => {
  const l = LANES[k], list = inLane(k).sort((a, z) => a.n - z.n);
  return `<div class="lrow${l.kind === 'tool' ? ' lrow-top' : ''}" id="${k}" data-lanehead="${k}">
      <div class="lhead"><h3>${esc(l.name)}</h3><p>${esc(l.line)}</p><small>${esc(l.who)}</small></div>
      ${L.wall(b, list, l.kind === 'site' ? 'wall-3' : '')}
    </div>`;
};
const tradeOptions = () => {
  const have = new Set(builds.map(L.tradeKey));
  return L.TRADES.filter(([k]) => have.has(k)).map(([k, name]) => `<option value="${k}">${esc(name)}</option>`).join('');
};

/* ---------- /work/ : everything ---------- */
const gallery = {
  url: '/work/', og: 'work', priority: 0.9, changefreq: 'weekly',
  meta: { key: 'work', title: `${Words(builds.length)} builds. All of them running.`, kicker: `Work · ${builds.length} live examples`, sub: `${SITES.length} websites and ${TOOLS.length} tools, every one open to use.` },
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
<section class="hero-w wrap work-hero">
  <h1>${Words(builds.length)} builds.<br>All of them running.</h1>
  <p class="lead">${SITES.length} full websites and ${TOOLS.length} business tools for service businesses, each made for an invented business so no client is on show. Tap any of them to use it full screen. Not sure what to press? It shows you.</p>
  <div class="cta-row" style="margin-top:28px;align-items:center"><button type="button" class="btn btn-dark" data-view="${FIRST.slug}">Flick through all ${builds.length}</button><span class="hint-inline">Full screen, one at a time. Arrow keys work.</span></div>
</section>
<section class="picks wrap" aria-labelledby="h-picks">
  <div class="picks-head"><h2 id="h-picks">Start with these four</h2><p>Two tools and two websites that show the range. Each card plays what the build does; tap it to try it yourself.</p></div>
  <div class="picks-rows">
    <div class="picks-row">${pick(b, PICKS[0])}${pick(b, PICKS[1])}</div>
    <div class="picks-row flip">${pick(b, PICKS[2])}${pick(b, PICKS[3])}</div>
  </div>
</section>
<div class="wrap wbar-wrap" id="all">
  <div class="wbar" role="group" aria-label="Filter builds">
    <div class="wkinds"><button type="button" data-f="all" aria-pressed="true">All <span class="n">${builds.length}</span></button><button type="button" data-f="site" aria-pressed="false">Websites <span class="n">${SITES.length}</span></button><button type="button" data-f="tool" aria-pressed="false">Tools <span class="n">${TOOLS.length}</span></button></div>
    <label class="wtrade"><span>Your trade</span><select id="tradeSel"><option value="">Any trade</option>${tradeOptions()}</select></label>
  </div>
  <p class="trade-note" id="tradeNote" aria-live="polite" hidden></p>
</div>
<div id="wall">
<section class="kindsec" id="websites" data-kindsec="site" aria-labelledby="h-websites">
  <div class="wrap">
    <div class="khead"><h2 id="h-websites">Websites</h2><p>${Words(SITES.length)} full websites in four lanes. A boxing club and an accountant should not get the same site, so the lane comes first: how loud it is, how much moves, how fast it gets to the phone number. <a class="lnk" href="${b}work/websites/">How the lanes work</a></p></div>
    <div class="lrows">${SITE_LANES.map(k => laneRow(b, k)).join('\n    ')}</div>
  </div>
</section>
<section class="kindsec" id="tools" data-kindsec="tool" aria-labelledby="h-tools">
  <div class="wrap">
    <div class="khead"><h2 id="h-tools">Tools</h2><p>Software that sits between the customer and the diary. Broad tools fit any business that takes enquiries; specific ones are built around one trade&rsquo;s day. <a class="lnk" href="${b}work/tools/">More on the tools</a></p></div>
    ${TOOL_LANES.map(k => laneRow(b, k)).join('\n    ')}
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
${L.ctaBand(b, 'Not sure which lane you are?', 'Book a short call. You will hear which kind of site your customers actually respond to, and whether you need one at all.', `<a class="btn btn-ghost" href="${b}work/tools/">See the tools instead</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/work/websites/', title, description, og: 'websites', css: ['device.css'], nodes }), body, L.scripts(b, ['builds.js', 'device.js']));
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
  <h1>The tools that run a service business.</h1>
  <p class="lead">Software that sits between the customer and the diary. <strong>Broad</strong> tools fit any business that takes enquiries and books jobs. <strong>Specific</strong> tools are built around one trade&rsquo;s actual day. Every one runs live with invented data and has a reset inside.</p>
  <div class="lanes" style="margin-top:36px">
    ${TOOL_LANES.map(k => `<a href="#${k}"><b>${esc(LANES[k].name)}</b><span>${esc(LANES[k].line)}</span><small>${plural(inLane(k).length, 'example')} &middot; ${esc(LANES[k].who)}</small></a>`).join('')}
  </div>
</section>
${TOOL_LANES.map(k => laneSection(b, k, { question: true })).join('')}
<section class="panel" id="by-trade">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">By trade</span><span class="name">Find the tool built for your day</span></div>
    <div class="body">
      <h2>Which tools are built for my trade?</h2>
      <dl class="nameplate">
        ${trades.map(t => `<div><dt>${esc(t)}</dt><dd>${TOOLS.filter(x => x.trade === t).map(x => `<a class="lnk" href="${b}work/${x.slug}/">${esc(x.name)}</a>`).join(' &middot; ')}</dd></div>`).join('')}
      </dl>
    </div>
  </div>
</section>
</main>
${L.ctaBand(b, 'Which of these would earn its keep for you?', 'A short call to find out what is leaking in your business and which of these would stop it. No pitch, no proposal deck.', `<a class="btn btn-ghost" href="${b}work/websites/">See the websites instead</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/work/tools/', title, description, og: 'tools', css: ['device.css'], nodes }), body, L.scripts(b, ['builds.js', 'device.js']));
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

const caseCopy = (b, x, lane) => `<div class="meta"><span>${esc(kindWord(x))} &middot; <a href="${b}${lane.path}#${x.lane}">${esc(lane.name)}</a></span><span>${esc(x.biz)}, invented</span></div>
          <div class="cta-row"><a class="btn btn-dark" href="${b}demos/${x.slug}/#s=1" target="_blank" rel="noopener">Use it full screen</a><a class="btn btn-ghost" href="${b}book/">Book a call</a></div>
          <p class="hint">This is the build itself, not a recording. Use it like a customer would, or press Show me in full screen and watch it work. State is kept in your browser; there is a reset inside.</p>`;
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
        L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }, { name: lane.kindWord, path: '/' + lane.path }, { name: x.name, path: `/work/${x.slug}/` }]),
        { '@type': x.kind === 'site' ? 'CreativeWork' : 'SoftwareApplication', name: x.name, url: L.abs(`/work/${x.slug}/`),
          description: x.long, creator: { '@id': L.ORG_ID }, author: { '@id': L.PERSON_ID },
          image: L.abs(`/assets/phones/${pad(x.n)}.webp`), genre: x.kind === 'site' ? `Website design · ${lane.name}` : `Business software · ${lane.name}`,
          keywords: [x.trade, lane.name, ...(x.tags || [])].join(', '), isAccessibleForFree: true, inLanguage: 'en-GB',
          ...(x.kind === 'site' ? {} : { applicationCategory: 'BusinessApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Demonstration build, free to use on this site' } }),
          about: `A demonstration ${kw} ${L.builtFor(x)}.` },
      ];
      const body = `
${L.header(b, x.kind === 'site' ? 'websites' : 'tools')}
<main id="main">
<article class="case">
  <section class="case-hero${x.kind === 'tool' ? ' is-tool' : ''}">
    <div class="wrap">
      ${crumbs(b, [['Home', ''], ['Work', 'work/'], [lane.kindWord, lane.path], [x.name, `work/${x.slug}/`]])}
      <h1>${esc(x.name)}</h1>
      <p class="lead short">${esc(x.short)}</p>
      ${x.kind === 'tool' ? `<div class="case-rig">
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
          <h2>What does ${esc(x.name)} do?</h2>
          <p class="lead">${esc(x.name)} is a working ${kw} ${esc(L.builtFor(x))}. ${esc(x.story)}</p>
          <p class="lead">It sits in the <a class="lnk" href="${b}${lane.path}#${x.lane}">${esc(lane.name)}</a> lane: ${esc(lane.line.toLowerCase())}</p>
        </div>
        <div>
          <h3>What is in it</h3>
          <ul class="feat" style="margin-top:12px">${(x.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <div class="tags" style="margin-top:16px">${(x.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
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
          <div><dt>Dependencies</dt><dd>No frameworks. Fonts are served from this site with system fallbacks, and the drawings, charts and interactions are written into the page.</dd></div>
          <div><dt>Imagery</dt><dd>${photos.length ? `Real photographs by ${photos.map(p => p.url ? `<a class="lnk" href="${p.url}" rel="noopener">${esc(p.by)}</a>` : esc(p.by)).join(' and ')} on Pexels, free for commercial use. Everything else is drawn in code, SVG or canvas.` : 'No stock. Every visual is drawn in code, SVG or canvas.'}</dd></div>
          <div><dt>The business</dt><dd>${esc(x.biz)} &mdash; invented. Every person, number and review inside is fictional so nothing here exposes a real client.</dd></div>
          <div><dt>Runs on</dt><dd>Any modern browser, on a phone as much as a desktop. State stays in your browser; there is a reset control inside.</dd></div>
          <div><dt>Yours would</dt><dd>Carry your name, your numbers and your diary, and be owned by you from day one.</dd></div>
        </dl>
      </div>
    </div>
  </section>

  <nav class="panel" aria-label="More builds">
    <div class="wrap inner">
      <div class="lab"><span class="sheet">More &middot; ${esc(lane.name)}</span><span class="name">${peers.length > 1 ? `The next ${esc(lane.name.toLowerCase())} ${lane.kind === 'site' ? 'websites' : 'tools'}` : 'Every build has its own page'}</span></div>
      <div class="body">
        <div class="pair">${L.tile(b, prev, { dir: 'Previous' })}${L.tile(b, next, { dir: 'Next' })}</div>
        <p class="f-note" style="margin-top:20px">${related.length ? `Same trade: ${related.map(y => `<a class="lnk" href="${b}work/${y.slug}/">${esc(y.name)}</a>`).join(', ')}. ` : ''}<a class="lnk" href="${b}${lane.path}#${x.lane}">Every ${esc(lane.name.toLowerCase())} ${lane.kind === 'site' ? 'website' : 'tool'}</a> &middot; <a class="lnk" href="${b}work/">all ${builds.length} builds</a>. Or <a class="lnk" href="${b}">build one for your own business</a> in a couple of seconds.</p>
      </div>
    </div>
  </nav>
</article>
</main>
${L.ctaBand(b, 'Want one like this, with your name on it?', `A short call to find out what is leaking in your business and whether a build like ${esc(x.name)} is the right fix.`, `<a class="btn btn-ghost" href="${b}${lane.path}">More ${esc(lane.kindWord.toLowerCase())}</a>`)}
${L.footer(b)}`;
      return L.page(L.head({ b, path: `/work/${x.slug}/`, title, description, og: `work-${x.slug}`, css: ['device.css'], nodes, palette: x }), body, L.scripts(b, ['builds.js', 'device.js']));
    }
  };
});

module.exports = { pages: [gallery, websites, tools, ...cases] };
