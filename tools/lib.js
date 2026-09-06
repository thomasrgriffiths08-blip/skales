/* Shared shell: head, header, footer, schema graph. Every page is built through here,
   so metadata, canonicals and structured data are consistent by construction.
   Links are RELATIVE via `b` (the path back to root) so the site works at the github.io
   subpath today and at a root domain later without touching a template. */
const site = require('../data/site.js');
const builds = require('../data/builds.js');

const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pad = n => String(n).padStart(2, '0');
const abs = p => site.origin.replace(/\/$/, '') + '/' + String(p).replace(/^\//, '');
const FONTS = 'https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap';
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23F4F2ED'/%3E%3Cpath d='M20 20 L44 44 M44 20 L20 44' stroke='%23B33A1B' stroke-width='7' stroke-linecap='round'/%3E%3C/svg%3E";
const UPDATED = new Date();
const monthYear = d => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;   // local, never toISOString

const waHref = (t) => 'https://wa.me/' + String(site.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(t);
/* ---------- colour: the site has no palette of its own. Each build lends it one. ----------
   sheet  = the build's accent at 14% into white (the page ground)
   cInk   = black or white, whichever reads on the accent (button text, floods)
   cText  = the accent darkened until it passes 4.5:1 on its own sheet (accent used as small type) */
const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const toHex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const lum = rgb => { const c = rgb.map(v => v / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + .05) / (lo + .05); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const TX = [16, 17, 20], WHITE = [255, 255, 255];
function world(c){
  const C = hex(c), sheet = mix(WHITE, C, .14);
  const cInk = contrast(C, WHITE) >= contrast(C, TX) ? '#FFFFFF' : '#101114';
  let t = C, i = 0; while (contrast(t, sheet) < 4.5 && i < 24){ t = mix(t, TX, .1); i++; }
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
/* "a working tool built for an invented window cleaner" — but a broad tool serves no single
   trade, so it says so instead of reading "an invented any service business". */
const builtFor = (x) => {
  const t = (x.trade || x.biz || '').trim();
  // "an invented" is always right — invented starts with a vowel — but a broad tool serves no
  // single trade, so it says that instead of reading "an invented any service business".
  return /^any\b/i.test(t) ? `built to work for ${t.toLowerCase()}` : `built for an invented ${t.toLowerCase()}`;
};
const laneOf = x => LANES[x.lane] || LANES[x.kind === 'site' ? 'quiet' : 'broad'];
const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const words = n => n < 20 ? WORDS[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '');
const Words = n => { const w = words(n); return w[0].toUpperCase() + w.slice(1); };
const wordmark = () => `<a class="wordmark" href="{{b}}">${esc(site.wordmark.a)}<i>${esc(site.wordmark.x)}</i>${esc(site.wordmark.b)}</a>`;

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
<html lang="${site.locale}" data-workings="off" style="${paletteStyle(palette || defaultBuild())}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canon}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta name="theme-color" content="${(palette || defaultBuild()).sheet}">
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
<link rel="stylesheet" href="${b}assets/workings.css">
${css.map(c => `<link rel="stylesheet" href="${b}assets/${c}">`).join('\n')}
${jsonld(nodes)}
</head>`;
}

/* ---------- header / footer ---------- */
const NAV = [
  { key: 'websites', label: 'Websites', path: 'work/websites/', count: builds.filter(x => x.kind === 'site').length },
  { key: 'tools',    label: 'Tools',    path: 'work/tools/',    count: builds.filter(x => x.kind === 'tool').length },
  { key: 'whatido',  label: 'What I do', path: 'what-i-do/' },
  { key: 'why',      label: 'Why',       path: 'why/' },
  { key: 'notes',    label: 'Notes',     path: 'notes/' },
];
function header(b, active){
  const links = NAV.map(n => `<a href="${b}${n.path}"${active === n.key ? ' aria-current="page"' : ''}>${n.label}${n.count ? `<sup class="cnt">${n.count}</sup>` : ''}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="bar">
    ${wordmark().replace('{{b}}', b || './')}
    <span class="readout"><span class="lamp is-live" id="powerLamp"></span><b id="clock">--:--:--</b> UK &middot; sheet <span id="powerWord">${esc(String(builds.length))}</span> builds</span>
    <nav class="nav" aria-label="Primary">${links}<button class="wk-switch" type="button" data-workings-toggle aria-pressed="false" title="Show the workings: the drawing this page was built from"><span class="wk-house" aria-hidden="true"><span class="wk-knob"></span></span><span class="wk-word">Workings</span></button><a class="btn btn-live btn-sm" href="${b}book/">Book a call <span class="arr">&rarr;</span></a></nav>
    <button class="mtoggle" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Menu"><span></span><span></span></button>
  </div>
  <nav class="mnav" id="mnav" aria-label="Primary (mobile)" hidden>
    ${NAV.map(n => `<a href="${b}${n.path}"${active === n.key ? ' aria-current="page"' : ''}>${n.label}${n.count ? `<sup class="cnt">${n.count}</sup>` : ''}</a>`).join('')}
    <a href="${b}book/" class="mcta">Book a call</a>
    <a href="${b}teardown.html">Free teardown</a>
    <div class="wk-row"><span>Show the workings</span><button class="wk-switch" type="button" data-workings-toggle aria-pressed="false"><span class="wk-house" aria-hidden="true"><span class="wk-knob"></span></span><span class="wk-word">Off · On</span></button></div>
  </nav>
</header>`;
}
function footer(b){
  const cols = [
    ['Pages', [['Home', ''], ['All the work', 'work/'], ['Websites', 'work/websites/'], ['Tools', 'work/tools/'], ['What I do', 'what-i-do/'], ['Why', 'why/'], ['Notes', 'notes/'], ['Book a call', 'book/'], ['Free teardown', 'teardown.html']]],
    ['Websites', SITE_LANES.map(k => [`${LANES[k].name} · ${builds.filter(x => x.lane === k).length}`, `work/websites/#${k}`]).concat(builds.filter(x => x.kind === 'site').slice(0, 6).map(x => [x.name, `work/${x.slug}/`]))],
    ['Tools', TOOL_LANES.map(k => [`${LANES[k].name} · ${builds.filter(x => x.lane === k).length}`, `work/tools/#${k}`]).concat(builds.filter(x => x.kind === 'tool').slice(0, 8).map(x => [x.name, `work/${x.slug}/`]))],
    ['Contact', [[site.email, 'mailto:' + site.email], [site.instagramHandle + ' on Instagram', site.instagram]]],
  ];
  return `<nav class="mbar" aria-label="Quick actions"><a href="${b}work/">The rack <sup class="cnt">${builds.length}</sup></a><a class="go" href="${b}book/">Book a call <span class="arr">&rarr;</span></a></nav>
<footer class="site-foot">
  <div class="wrap">
    <div class="f-mark" aria-hidden="true">${esc(site.wordmark.a)}<i>${esc(site.wordmark.x)}</i>${esc(site.wordmark.b)}</div>
    <div class="f-cols">
      ${cols.map(([h, links]) => `<div><h2 class="spec">${h}</h2>${links.map(([t, p]) => `<a href="${/^(https?:|mailto:)/.test(p) ? p : b + p}"${/^https?:/.test(p) ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a>`).join('')}${h === 'Contact' && site.whatsapp ? `<a data-wa="Hi Tom — found you through your site." href="${waHref('Hi Tom — found you through your site.')}">WhatsApp</a>` : ''}</div>`).join('')}
    </div>
    <div class="f-row">
      <span>${esc(site.tagline)} &middot; ${esc(site.areaServed)} &middot; &copy; <span data-year></span> ${esc(site.name)}</span>
      <span class="spec">Updated ${monthYear(UPDATED)}</span>
    </div>
    <p class="f-note">Every business, person, review and phone number in the demonstration builds on this site is invented. No client is named or shown anywhere.</p>
  </div>
</footer>`;
}
function scripts(b, extra = []){
  return [`<script>window.SITE=${JSON.stringify({ base: b, name: site.name, origin: site.origin, whatsapp: site.whatsapp, email: site.email, instagram: site.instagram, calendly: site.calendly, defaultCh: DEFAULT_CH })};</script>`,
    `<script src="${b}assets/site.js"></script>`, `<script src="${b}assets/workings.js"></script>`, ...extra.map(s => `<script src="${b}assets/${s}"></script>`)].join('\n');
}
const page = (h, body, s) => `${h}\n<body>\n<div class="grain" aria-hidden="true"></div>\n${body}\n${s}\n</body>\n</html>\n`;

site.facts = site.facts.map(f => f.replace('{{N}}', Words(builds.length)).replace('{{n}}', String(builds.length)));
module.exports = { LANES, builtFor, world, DEFAULT_CH, defaultBuild, paletteStyle, contrast, hex, SITE_LANES, TOOL_LANES, laneOf, words, Words, waHref, site, builds, esc, pad, abs, head, header, footer, scripts, page, breadcrumb, webPage, ORG_ID, PERSON_ID, SITE_ID, UPDATED, monthYear, iso };
