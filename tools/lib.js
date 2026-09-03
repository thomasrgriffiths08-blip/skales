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
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230A0C10'/%3E%3Cpath d='M20 20 L44 44 M44 20 L20 44' stroke='%23FF5A1F' stroke-width='7' stroke-linecap='round'/%3E%3C/svg%3E";
const UPDATED = new Date();
const monthYear = d => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;   // local, never toISOString

const waHref = (t) => 'https://wa.me/' + String(site.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(t);
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
function head({ b, path, title, description, og, type = 'website', css = [], nodes = [], noindex = false, article }){
  const canon = abs(path);
  return `<!doctype html>
<html lang="${site.locale}" data-power="off">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canon}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta name="theme-color" content="#0A0C10">
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
  { key: 'work',   label: 'Work',      path: 'work/',       count: builds.length },
  { key: 'whatido',label: 'What I do', path: 'what-i-do/' },
  { key: 'why',    label: 'Why',       path: 'why/' },
  { key: 'notes',  label: 'Notes',     path: 'notes/' },
];
function header(b, active){
  const links = NAV.map(n => `<a href="${b}${n.path}"${active === n.key ? ' aria-current="page"' : ''}>${n.label}${n.count ? `<sup class="cnt">${n.count}</sup>` : ''}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="bar">
    ${wordmark().replace('{{b}}', b || './')}
    <span class="readout"><span class="lamp" id="powerLamp"></span><b id="clock">--:--:--</b> UK &middot; <span id="powerWord">standby</span></span>
    <nav class="nav" aria-label="Primary">${links}<a class="btn btn-live btn-sm" href="${b}book/">Book a call</a></nav>
    <button class="mtoggle" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Menu"><span></span><span></span></button>
  </div>
  <nav class="mnav" id="mnav" aria-label="Primary (mobile)" hidden>
    ${NAV.map(n => `<a href="${b}${n.path}"${active === n.key ? ' aria-current="page"' : ''}>${n.label}${n.count ? `<sup class="cnt">${n.count}</sup>` : ''}</a>`).join('')}
    <a href="${b}book/" class="mcta">Book a call</a>
    <a href="${b}teardown.html">Free teardown</a>
  </nav>
</header>`;
}
function footer(b){
  const cols = [
    ['Pages', [['Home', ''], ['Work', 'work/'], ['What I do', 'what-i-do/'], ['Why', 'why/'], ['Notes', 'notes/'], ['Book a call', 'book/'], ['Free teardown', 'teardown.html']]],
    ['Tools', builds.filter(x => x.kind === 'tool').map(x => [x.name, `work/${x.slug}/`])],
    ['Websites', builds.filter(x => x.kind === 'site').map(x => [x.name, `work/${x.slug}/`])],
    ['Contact', [[site.email, 'mailto:' + site.email], [site.instagramHandle + ' on Instagram', site.instagram]]],
  ];
  return `<footer class="site-foot">
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
  return [`<script>window.SITE=${JSON.stringify({ base: b, name: site.name, origin: site.origin, whatsapp: site.whatsapp, email: site.email, instagram: site.instagram, calendly: site.calendly })};</script>`,
    `<script src="${b}assets/site.js"></script>`, ...extra.map(s => `<script src="${b}assets/${s}"></script>`)].join('\n');
}
const page = (h, body, s) => `${h}\n<body>\n<div class="grain" aria-hidden="true"></div>\n${body}\n${s}\n</body>\n</html>\n`;

module.exports = { waHref, site, builds, esc, pad, abs, head, header, footer, scripts, page, breadcrumb, webPage, ORG_ID, PERSON_ID, SITE_ID, UPDATED, monthYear, iso };
