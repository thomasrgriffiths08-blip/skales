/* Shared shell: head, header, footer, schema graph, the phone tile. Every page is built through
   here, so metadata, canonicals and structured data are consistent by construction.
   Links are RELATIVE via `b` (the path back to root) so the site works at the github.io
   subpath today and at a root domain later without touching a template. */
const site = require('../data/site.js');
const builds = require('../data/builds.js');

const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pad = n => String(n).padStart(2, '0');
const abs = p => site.origin.replace(/\/$/, '') + '/' + String(p).replace(/^\//, '');
const FONTS = 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&family=Geist+Mono:wght@400&display=swap';
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23141416'/%3E%3Cpath d='M22 16v32M43 17L25 33l18 15' fill='none' stroke='%23FFFFFF' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const UPDATED = new Date();
const monthYear = d => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;   // local, never toISOString

const waHref = (t) => 'https://wa.me/' + String(site.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(t);
/* ---------- colour: the site has one accent and borrows it from the running build ----------
   cInk   = black or white, whichever reads on the accent (button text)
   cText  = the accent darkened until it passes 4.5:1 on white (accent used as small type)
   sheet  = the accent at 14% into white (only the share cards use it now) */
const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const toHex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const lum = rgb => { const c = rgb.map(v => v / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + .05) / (lo + .05); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const TX = [20, 20, 22], WHITE = [255, 255, 255];
function world(c){
  const C = hex(c), sheet = mix(WHITE, C, .14);
  const cInk = contrast(C, WHITE) >= contrast(C, TX) ? '#FFFFFF' : '#141416';
  let t = C, i = 0; while (contrast(t, WHITE) < 4.5 && i < 24){ t = mix(t, TX, .1); i++; }
  return { sheet: toHex(sheet), cInk, cText: toHex(t), tx: toHex(TX) };
}
builds.forEach(x => Object.assign(x, world(x.c)));
const DEFAULT_CH = 17;
const defaultBuild = () => builds.find(x => x.n === DEFAULT_CH) || builds[0];
const paletteStyle = x => `--c:${x.c};--c-ink:${x.cInk};--c-text:${x.cText}`;

/* ---------- lanes: the four kinds of website and the two kinds of tool ---------- */
const LANES = {
  loud:     { kind: 'site', kindWord: 'Websites', name: 'Loud',     path: 'work/websites/', line: 'Big, kinetic, confident. The type is the image and one moment does the talking.', who: 'Gyms, bars, studios, events: anyone who needs to be noticed before they are compared.', question: 'When does a business need a loud website?', answer: 'When being remembered matters more than being reassured. A boxing club or a tattoo studio is chosen on feel, so the site moves, the type hits and there is one thing the visitor will describe to a friend. Everything still works: the number, the booking and the address are one tap away.' },
  motion:   { kind: 'site', kindWord: 'Websites', name: 'Motion',   path: 'work/websites/', line: 'The page is the film: scroll-driven sequences, letterboxes, timecodes, drawn frames.', who: 'Film, video, drone and photography businesses: anyone selling moving pictures.', question: 'What does a website for a film or video business look like?', answer: 'Like a film. The visitor scrubs through the work by scrolling, the page carries a timecode, and nothing in it is a stock video: the frames are drawn in code, so the page weighs nothing and plays on a phone. The story reads even if you never scroll.' },
  quiet:    { kind: 'site', kindWord: 'Websites', name: 'Quiet',    path: 'work/websites/', line: 'Plain, calm, expensive. Almost nothing moves; the typography does the work.', who: 'Accountants, clinics, architects, solicitors: businesses whose customers are buying reassurance.', question: 'Why would a business choose a plain website?', answer: 'Because its customers are buying trust, not excitement. A quiet page uses real typography, generous space and one accent, and moves exactly once. It is harder to make than a loud one, because nothing is hiding behind an animation.' },
  direct:   { kind: 'site', kindWord: 'Websites', name: 'Direct',   path: 'work/websites/', line: 'Conversion first. One-tap call, a three-field form, the service area, no fluff.', who: 'Trades and local services that live off the phone.', question: 'What does a tradesperson’s website actually need?', answer: 'The number, a form with three fields, proof you cover their street and a reason to ring you rather than the next result. These pages load in a blink, put a call bar under the thumb on a phone and answer the question the customer typed into Google. The only animation is the one that proves a point.' },
  broad:    { kind: 'tool', kindWord: 'Tools',    name: 'Broad',    path: 'work/tools/',    line: 'Works for any service business: booking, quotes, the pipeline, follow-up, reviews.', who: 'Any business that takes enquiries and puts jobs in a diary.', question: 'Which tools work for any service business?', answer: 'The ones that sit between the customer and the diary: taking the booking, chasing the quote, texting back a missed call, asking for the review, keeping every enquiry in one list. They do not care what the trade is.' },
  specific: { kind: 'tool', kindWord: 'Tools',    name: 'Specific', path: 'work/tools/',    line: 'Built around one trade’s actual day: its diary, its paperwork, its reminders.', who: 'One trade at a time: heating, garages, salons, restaurants, roofing, rounds.', question: 'What does a tool built for one trade look like?', answer: 'It knows the trade’s calendar and its paperwork. A heating engineer’s tool knows a boiler is due every twelve months; a salon’s knows a client rebooks at the till; a window cleaner’s knows the round runs in door order and shifts when it rains.' },
};
const SITE_LANES = ['loud', 'motion', 'quiet', 'direct'], TOOL_LANES = ['broad', 'specific'];
const builtFor = (x) => {
  const t = (x.trade || x.biz || '').trim();
  return /^any\b/i.test(t) ? `built to work for ${t.toLowerCase()}` : `built for an invented ${t.toLowerCase()}`;
};
const laneOf = x => LANES[x.lane] || LANES[x.kind === 'site' ? 'quiet' : 'broad'];
const kindWord = x => x.kind === 'site' ? 'Website' : 'Tool';
const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const words = n => n < 20 ? WORDS[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '');
const Words = n => { const w = words(n); return w[0].toUpperCase() + w.slice(1); };
const wordmark = (b) => `<a class="wordmark" href="${b || './'}" aria-label="${esc(site.name)} — home">${esc(site.wordmark.a)}<i>${esc(site.wordmark.x)}</i>${esc(site.wordmark.b)}</a>`;

/* ---------- the phone tile: a build as it looks in a hand ---------- */
const phoneSrc = (b, x) => `${b}assets/phones/${pad(x.n)}.webp`;
const tile = (b, x, { dir = '', eager = false } = {}) => `<a class="tile" href="${b}work/${x.slug}/" data-n="${x.n}" data-kind="${x.kind}" data-lane="${x.lane}">
  <span class="shell"><img src="${phoneSrc(b, x)}" width="585" height="1266" alt="${esc(x.name)} on a phone — ${esc(x.short)}"${eager ? '' : ' loading="lazy"'} decoding="async"></span>
  <span class="cap">${dir ? `<span class="dir">${esc(dir)}</span>` : ''}<b>${esc(x.name)}</b><span>${esc(kindWord(x))} &middot; ${esc(laneOf(x).name)} &middot; ${esc(x.trade || x.biz)}</span></span></a>`;
const wall = (b, list, cls = '') => `<div class="wall${cls ? ' ' + cls : ''}">${list.map(x => tile(b, x)).join('')}</div>`;
/* the device: one live build in a phone. data-start boots it; thumbs are optional */
const device = (b, x, { thumbs = false } = {}) => `<div class="hero-device">
  <div class="device" id="device" data-start="${x.n}"><div class="screen"><div class="loading">Loading ${esc(x.name)}</div></div></div>
  <div class="device-cap">
    <div class="who"><b id="devName">${esc(x.name)}</b><span id="devWho">${esc(kindWord(x))} &middot; ${esc(x.trade || x.biz)}</span></div>
    <div class="ways"><a id="devOpen" href="${b}demos/${x.slug}/#s=1" target="_blank" rel="noopener">Open full size</a>${thumbs ? `<a id="devPage" href="${b}work/${x.slug}/">Its page</a>` : ''}</div>
  </div>
</div>${thumbs ? `<div class="thumbs" id="thumbs" role="tablist" aria-label="Choose a build"></div>` : ''}`;
const forgeInvite = (b, line) => `<section class="invite">
  <div class="wrap">
    <div><h2>Now see your own name on one.</h2><p>${line}</p></div>
    <a class="btn btn-live" href="${b}">Build mine</a>
  </div>
</section>`;
const ctaBand = (b, h, p, extra = '') => `<section class="cta-band">
  <div class="wrap grid">
    <div><h2>${h}</h2><p class="lead" style="margin-top:12px">${p}</p></div>
    <div class="cta-col"><a class="btn btn-live" href="${b}book/">Book a call</a>${extra}</div>
  </div>
</section>`;

/* ---------- schema ---------- */
const ORG_ID = abs('/#organization'), SITE_ID = abs('/#website'), PERSON_ID = abs('/#founder');
function baseGraph(){
  return [
    { '@type': 'Organization', '@id': ORG_ID, name: site.name, legalName: site.legalName, url: abs('/'),
      description: site.tagline + ' — ' + site.facts[0],
      founder: { '@id': PERSON_ID }, foundingDate: site.founded,
      areaServed: { '@type': 'Country', name: site.areaServed },
      knowsAbout: ['Web design for service businesses','Online booking systems','Missed-call text-back automation','Customer follow-up automation','Trades websites','Review request automation'],
      sameAs: [site.instagram],
      contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: site.email, availableLanguage: 'en-GB', areaServed: 'GB' },
      logo: { '@type': 'ImageObject', url: abs('/og/home.png') } },
    { '@type': 'Person', '@id': PERSON_ID, name: site.founder.name, alternateName: site.founder.alternateName,
      jobTitle: site.founder.jobTitle, worksFor: { '@id': ORG_ID }, url: abs('/why/'), sameAs: [site.instagram], nationality: 'GB' },
    { '@type': 'WebSite', '@id': SITE_ID, url: abs('/'), name: site.name, description: site.tagline,
      publisher: { '@id': ORG_ID }, inLanguage: site.locale },
  ];
}
function breadcrumb(items){ // [{name, path}]
  return { '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })) };
}
function webPage({ path, title, description, type = 'WebPage', extra = {} }){
  return Object.assign({ '@type': type, '@id': abs(path) + '#webpage', url: abs(path), name: title, description,
    isPartOf: { '@id': SITE_ID }, about: { '@id': ORG_ID }, inLanguage: site.locale,
    dateModified: iso(UPDATED) }, extra);
}
const jsonld = nodes => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [...baseGraph(), ...nodes] }).replace(/</g,'\\u003c')}</script>`;

/* ---------- head ---------- */
function head({ b, path, title, description, og, type = 'website', css = [], nodes = [], noindex = false, article, palette }){
  const canon = abs(path);
  return `<!doctype html>
<html lang="${site.locale}" style="${paletteStyle(palette || defaultBuild())}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canon}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta name="theme-color" content="#FFFFFF">
<meta name="author" content="${esc(site.founder.name)}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="en_GB">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${canon}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${abs('/og/' + og + '.png')}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
${article ? `<meta property="article:published_time" content="${article.published}"><meta property="article:author" content="${esc(site.founder.name)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs('/og/' + og + '.png')}">
<link rel="icon" href="${FAVICON}">
<link rel="apple-touch-icon" href="${b}og/icon.png">
<link rel="manifest" href="${b}manifest.webmanifest">
<link rel="sitemap" type="application/xml" href="${b}sitemap.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="${b}assets/site.css">
${css.map(c => `<link rel="stylesheet" href="${b}assets/${c}">`).join('\n')}
${jsonld(nodes)}
</head>`;
}

/* ---------- header / footer ---------- */
const NAV = [
  { key: 'work',    label: 'Work',         path: 'work/' },
  { key: 'whatido', label: 'What I build', path: 'what-i-do/' },
  { key: 'why',     label: 'About',        path: 'why/' },
  { key: 'notes',   label: 'Notes',        path: 'notes/' },
];
const isWork = k => ['work', 'websites', 'tools'].includes(k);
function header(b, active){
  const cur = n => (active === n.key || (n.key === 'work' && isWork(active))) ? ' aria-current="page"' : '';
  const links = NAV.map(n => `<a href="${b}${n.path}"${cur(n)}>${n.label}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="bar">
    ${wordmark(b)}
    <nav class="nav" aria-label="Primary">${links}<a class="btn btn-live btn-sm" href="${b}book/">Book a call</a></nav>
    <button class="mtoggle" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Menu"><span></span><span></span></button>
  </div>
  <nav class="mnav" id="mnav" aria-label="Primary (mobile)" hidden>
    ${NAV.map(n => `<a href="${b}${n.path}"${cur(n)}>${n.label}</a>`).join('')}
    <a href="${b}teardown.html">Free teardown</a>
    <a href="${b}book/" class="mcta">Book a call</a>
  </nav>
</header>`;
}
function footer(b){
  const link = ([t, p]) => `<a href="${/^(https?:|mailto:)/.test(p) ? p : b + p}"${/^https?:/.test(p) ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a>`;
  const work = [['All the work', 'work/'], ['Websites', 'work/websites/'], ['Tools', 'work/tools/'], ...SITE_LANES.map(k => [`${LANES[k].name} websites`, `work/websites/#${k}`]), ...TOOL_LANES.map(k => [`${LANES[k].name} tools`, `work/tools/#${k}`])];
  const studio = [['What I build', 'what-i-do/'], ['About', 'why/'], ['Notes', 'notes/'], ['Book a call', 'book/'], ['Free teardown', 'teardown.html']];
  const contact = [[site.email, 'mailto:' + site.email], [site.instagramHandle + ' on Instagram', site.instagram]];
  return `<nav class="mbar" aria-label="Quick actions"><a href="${b}work/">The work</a><a class="go" href="${b}book/">Book a call</a></nav>
<footer class="site-foot">
  <div class="wrap">
    <div class="f-top">
      <div class="f-brand">${wordmark(b)}<p>${esc(site.tagline)}. One person, ${esc(site.areaServed)}. ${esc(Words(builds.length))} working builds on this site, every one for an invented business.</p></div>
      <div><h2>Work</h2>${work.map(link).join('')}</div>
      <div><h2>Studio</h2>${studio.map(link).join('')}</div>
      <div><h2>Contact</h2>${contact.map(link).join('')}${site.whatsapp ? `<a data-wa="Hi Tom — found you through your site." href="${waHref('Hi Tom — found you through your site.')}">WhatsApp</a>` : ''}</div>
    </div>
    <div class="f-row">
      <span>&copy; <span data-year></span> ${esc(site.name)} &middot; ${esc(site.areaServed)}</span>
      <span>Updated ${monthYear(UPDATED)}</span>
    </div>
    <p class="f-note">Every business, person, review and phone number in the demonstration builds on this site is invented. No client is named or shown anywhere.</p>
  </div>
</footer>`;
}
function scripts(b, extra = []){
  return [`<script>window.SITE=${JSON.stringify({ base: b, name: site.name, origin: site.origin, whatsapp: site.whatsapp, email: site.email, instagram: site.instagram, calendly: site.calendly, defaultCh: DEFAULT_CH })};</script>`,
    `<script src="${b}assets/site.js"></script>`, ...extra.map(s => `<script src="${b}assets/${s}"></script>`)].join('\n');
}
const page = (h, body, s) => `${h}\n<body>\n${body}\n${s}\n</body>\n</html>\n`;

site.facts = site.facts.map(f => f.replace('{{N}}', Words(builds.length)).replace('{{n}}', String(builds.length)));
module.exports = { LANES, builtFor, world, DEFAULT_CH, defaultBuild, paletteStyle, contrast, hex, SITE_LANES, TOOL_LANES, laneOf, kindWord, words, Words, waHref, site, builds, esc, pad, abs, head, header, footer, scripts, page, breadcrumb, webPage, ORG_ID, PERSON_ID, SITE_ID, UPDATED, monthYear, iso, tile, wall, device, ctaBand, forgeInvite, phoneSrc };
