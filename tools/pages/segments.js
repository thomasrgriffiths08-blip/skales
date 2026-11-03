/* /for/ and /for/<trade>/: one page per kind of business, from data/segments.js. Each answers "what does
   a website for this trade need?" in its first two sentences, then shows the automations that matter
   most to that trade, the demos preset to it (?kind= on /try/), the builds that fit, and its own
   questions. Pages are only added for trades with something real to say; never one per town. */
const L = require('../lib.js');
const { site, esc } = L;
const SG = require('../../data/segments.js');
const { SV, parts: P } = require('./services.js');

const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
const GROUPS = [...new Set(SG.map(s => s.group))];
const article = w => /^[aeiou]/i.test(w) ? 'an' : 'a';

/* The trade page is one screen of proof and a short read. First screen: the trade's headline, the system
   running live for a made-up business of that kind, and Book a call. Then what the website needs (the answer
   search engines quote), three real websites, the three automations, the questions folded away, and a way to
   book. Same night ground and type as the home, so every page reads as one site. */
const SYS_BIZ = { heating: ['Larchfield Heating', 'plumbing and heating firm'], electrical: ['Kestrel Electrical', 'electrician'], garage: ['Kerb & Camber', 'garage'],
  salon: ['Linden Rooms', 'salon'], cleaning: ['Brightwell Cleaning', 'cleaning company'], clinic: ['Fern Physio', 'physio clinic'] };
const GROUP_SYS = { Trades: 'heating', 'Home and rounds': 'cleaning', Automotive: 'garage', Personal: 'salon', Hospitality: 'salon', Professional: 'clinic', Creative: 'heating' };
const sysTrade = s => SYS_BIZ[s.kind] ? s.kind : s.kind === 'garden' ? 'cleaning' : (GROUP_SYS[s.group] || 'heating');
const sysPart = s => L.builds.find(x => x.n === (s.builds.find(n => n >= 13) || 15));
const SITE_FALLBACK = { Trades: [11, 12, 6], 'Home and rounds': [11, 12, 10], Automotive: [12, 11, 6], Personal: [10, 7, 8], Hospitality: [4, 3, 1], Professional: [9, 1, 2], Creative: [5, 6, 4] };
const sitesFor = s => [...new Set([...s.builds.filter(n => n <= 12), ...(SITE_FALLBACK[s.group] || [11, 10, 9])])].slice(0, 3).map(n => L.builds.find(x => x.n === n)).filter(Boolean);
const nameOf = x => { const n = x.name.split(/\s+[—–-]\s+/)[0]; return n === n.toUpperCase() ? n.charAt(0) + n.slice(1).toLowerCase().replace(/\s(\w)/g, (m, c) => ' ' + c.toUpperCase()) : n; };
const still = (b, part, t, w) => `${b}assets/tp/${part.slug}-${t}${w ? '-' + w : ''}.webp`;
/* every (part, business) pair a trade page shows, so tools/tp-stills.cjs can photograph each one */
const stills = () => [...new Set(SG.map(s => `${sysPart(s).slug}|${sysTrade(s)}`))].map(k => k.split('|'));

const segPage = s => ({
  url: `/for/${s.slug}/`, og: `for-${s.slug}`, priority: 0.8, changefreq: 'monthly',
  meta: { key: `for-${s.slug}`, title: s.label, kicker: 'For your trade', sub: s.h1 },
  render(b){
    const path = `/for/${s.slug}/`, title = `${s.title} | ${site.name}`;
    const cr = [['Home', ''], ['By trade', 'for/'], [s.label, `for/${s.slug}/`]];
    const tryHref = d => `${b}try/${d}/?kind=${s.kind}`;
    const t = sysTrade(s), [biz, bizKind] = SYS_BIZ[t], part = sysPart(s), sites = sitesFor(s);
    const live = `${b}demos/${part.slug}/?t=${t}#s=1`;
    const howQ = [`How do customers choose ${article(s.word)} ${s.word}?`, s.journey];
    const faq = [howQ, ...s.faq];
    const nodes = [
      L.webPage({ path, title, description: s.description, extra: { mainEntity: { '@id': L.abs(path) + '#service' }, primaryImageOfPage: { '@type': 'ImageObject', url: L.abs(`/assets/tp/${part.slug}-${t}.webp`) } } }),
      P.crumbNodes(cr),
      { '@type': 'Service', '@id': L.abs(path) + '#service', name: `Websites, booking and follow-up for ${lc(s.label)}`, serviceType: 'Web design, online booking and follow-up automation',
        description: s.answer, url: L.abs(path), provider: { '@id': L.ORG_ID }, areaServed: { '@type': 'Country', name: site.areaServed },
        audience: { '@type': 'BusinessAudience', name: `UK ${lc(s.label)}` },
        isRelatedTo: [...SV.slice(0, 3).map(x => ({ '@id': P.svcId(x.slug) })), ...s.autos.map(([a]) => ({ '@id': P.autoId(a) }))] },
      { '@type': 'ItemList', '@id': L.abs(path) + '#demos', name: `Live demos for ${lc(s.label)}`, itemListElement: s.demos.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/try/${d}/`), name: P.demo(d).name })) },
      P.faqNode(faq, path),
    ];
    const peers = SG.filter(x => x.group === s.group && x !== s);
    const body = `
${L.header(b, 'services')}
<script>document.querySelector('.site-head').classList.add('on-dark')</script>
<main id="main" class="home tp">
<section class="hx tp-hero" aria-labelledby="h-top">
  <div class="hx-glow" aria-hidden="true"></div>
  <div class="wrap tp-in">
    <div class="tp-copy">
      ${P.crumbs(b, cr)}
      <h1 id="h-top">${esc(s.h1)}</h1>
      <p class="hx-sub">The website, booking and follow-up ${article(s.word)} ${esc(s.word)} needs, built by one person. The system here is live, so try it.</p>
      <div class="hx-ctas"><a class="btn btn-live btn-lg" href="${b}book/">Book a call</a><a class="btn btn-glass btn-lg" href="${tryHref(s.demos[0])}">Try it as ${article(s.word)} ${esc(s.word)}</a></div>
    </div>
    <figure class="tp-stage">
      <div class="tp-lap" data-live="${live}" data-title="${esc(part.name)}, set up for ${esc(biz)}">
        <span class="chrome" aria-hidden="true"><i></i><i></i><i></i><span>${esc(biz)} · ${esc(part.name)}</span></span>
        <div class="tp-scr"><a class="tp-open" href="${live}" target="_blank" rel="noopener" aria-label="Open ${esc(part.name)} full screen, live"><img src="${still(b, part, t, 800)}" srcset="${still(b, part, t, 800)} 800w, ${still(b, part, t)} 1600w" sizes="(min-width: 1100px) 680px, 92vw" width="1600" height="1000" alt="${esc(part.name)} in the Skales system, set up for ${esc(biz)}, a made-up ${esc(bizKind)}: ${esc(part.short)}" fetchpriority="high" decoding="async"></a></div>
      </div>
      <figcaption class="tp-cap"><span class="tp-dot"><i></i>Live</span><span><b>${esc(part.name)}</b>, set up for ${esc(biz)}, a made-up ${esc(bizKind)}.</span><a class="tlink" href="${live}" target="_blank" rel="noopener">Full screen <span aria-hidden="true">→</span></a></figcaption>
    </figure>
  </div>
</section>
<section class="hs" id="needs" aria-labelledby="h-needs">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">What it needs</p>
      <h2 id="h-needs">What should a website for ${esc(lc(s.label))} do?</h2>
      ${L.fold(s.answer, 'lead answer')}
    </div>
    <ol class="tp-needs">${s.needs.map((n, i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><span>${esc(n)}</span></li>`).join('')}</ol>
  </div>
</section>
<section class="hs hs-work" id="websites" aria-labelledby="h-sites">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">Websites</p>
      <h2 id="h-sites">Built from scratch, like these.</h2>
      <p class="lead">Each one is made for its trade and works like the real thing. The businesses are made up, so no client is on show.</p>
    </div>
    <div class="six tp-sites">${sites.map(x => `<a class="w" href="${b}work/${x.slug}/">
      <span class="w-shot"><img src="${b}assets/screens/${L.pad(x.n)}-1200.webp" srcset="${b}assets/screens/${L.pad(x.n)}-1200.webp 1200w, ${b}assets/screens/${L.pad(x.n)}-2160.webp 2160w" sizes="(min-width: 1100px) 380px, (min-width: 641px) 46vw, 84vw" width="1200" height="750" alt="${esc(nameOf(x))} on a laptop: ${esc(x.short)}" loading="lazy" decoding="async"></span>
      <span class="w-cap"><b>${esc(nameOf(x))}</b><span>${esc(x.trade || x.biz)}</span></span>
    </a>`).join('')}</div>
  </div>
</section>
<section class="hs" id="automations" aria-labelledby="h-auto">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">Then it runs itself</p>
      <h2 id="h-auto">The three automations that matter most.</h2>
    </div>
    <div class="tp-autos">${s.autos.map(([a, why]) => { const x = P.auto(a); return `<a class="tp-auto" href="${b}automations/${x.slug}/"><h3>${esc(x.name)}</h3><p>${esc(why)}</p><span class="tlink">How it works <span aria-hidden="true">→</span></span></a>`; }).join('')}</div>
    <p class="tp-try"><span>Try it as ${article(s.word)} ${esc(s.word)}:</span>${s.demos.map(d => `<a class="tlink" href="${tryHref(d)}">${esc(P.demo(d).name)} <span aria-hidden="true">→</span></a>`).join('')}</p>
  </div>
</section>
<section class="hs tp-faq" id="faq" aria-labelledby="h-faq">
  <div class="wrap tp-faq-in">
    <div class="hs-head">
      <p class="kick">Questions</p>
      <h2 id="h-faq">${esc(s.label)}: questions people ask</h2>
      <p class="lead">More in <a class="lnk" href="${b}faq/">every question, answered</a>.</p>
    </div>
    <div class="tp-qs">${faq.map(([q, a]) => `<details><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>
<section class="hs tp-rel" aria-labelledby="h-rel">
  <div class="wrap">
    <h2 id="h-rel" class="tp-rel-h">What I build for ${esc(lc(s.label))}</h2>
    <div class="tp-chips">${SV.map(x => `<a href="${b}services/${x.slug}/">${esc(x.name)}</a>`).join('')}</div>
    ${peers.length ? `<h2 class="tp-rel-h">${s.group === 'Trades' ? 'Other trades' : `Other ${esc(lc(s.group))} businesses`}</h2><div class="tp-chips">${peers.map(x => `<a href="${b}for/${x.slug}/">${esc(x.label)}</a>`).join('')}<a href="${b}for/">Every trade</a></div>` : ''}
  </div>
</section>
<section class="hs hs-book tp-book" id="book" aria-labelledby="h-book">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">Book</p>
      <h2 id="h-book">Want this working for your business?</h2>
      <p class="lead">A free 30-minute call with me, Tom: what is costing you work, what I would build first, and a fixed price.</p>
    </div>
    <div class="hx-ctas"><a class="btn btn-live btn-lg" href="${b}book/">Book a call</a><a class="btn btn-glass btn-lg" href="${b}start/?utm_source=site&amp;utm_medium=trades&amp;utm_campaign=${s.slug}">Book in three taps</a></div>
  </div>
</section>
</main>
${L.footer(b, { mbar: false, dark: true })}`;
    return L.page(L.head({ b, path, title, description: s.description, og: `for-${s.slug}`, css: ['home.css', 'trade.css'], nodes, palette: L.BRAND, theme: '#0A0B0D', dark: false }), body, L.scripts(b, ['trade.js']));
  },
});

const segIndex = {
  url: '/for/', og: 'for', priority: 0.8, changefreq: 'monthly',
  meta: { key: 'for', title: 'Websites and booking for your trade', kicker: 'By trade', sub: `${SG.length} kinds of business, each with what its website needs and the demos set up for it.` },
  render(b){
    const path = '/for/', title = `Websites and booking by trade | ${site.name}`;
    const description = `Websites, online booking and follow-up for UK trades and service businesses, trade by trade: plumbers, electricians, salons, garages, clinics and more.`;
    const nodes = [L.webPage({ path, title, description, type: 'CollectionPage' }), P.crumbNodes([['Home', ''], ['By trade', 'for/']]),
      { '@type': 'ItemList', '@id': L.abs(path) + '#list', name: 'Trades', itemListElement: SG.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/for/${s.slug}/`), name: s.label })) }];
    const body = `
${L.header(b, 'services')}
<script>document.querySelector('.site-head').classList.add('on-dark')</script>
<main id="main" class="home tp">
<section class="hx tp-hero tp-idx" aria-labelledby="h-top">
  <div class="hx-glow" aria-hidden="true"></div>
  <div class="wrap tp-copy">
    ${P.crumbs(b, [['Home', ''], ['By trade', 'for/']])}
    <h1 id="h-top">Websites and booking for your trade.</h1>
    <p class="hx-sub">Every kind of business gets its work in a different way: a locksmith lives on the emergency call, a salon on the rebooking, an architect on the enquiry that turns into a project. Find yours to see what its website needs and the system running for a business like it.</p>
  </div>
</section>
<section class="hs tp-rel" aria-label="Trades">
  <div class="wrap">
${GROUPS.map(g => `    <h2 class="tp-rel-h" id="g-${g.replace(/\W+/g, '-').toLowerCase()}">${esc(g)}</h2>
    <div class="tp-chips is-wrap">${SG.filter(s => s.group === g).map(s => `<a href="${b}for/${s.slug}/">${esc(s.label)}</a>`).join('')}</div>`).join('\n')}
  </div>
</section>
<section class="hs hs-book tp-book" id="book" aria-labelledby="h-book">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">Book</p>
      <h2 id="h-book">Not on the list? Book a call anyway.</h2>
      <p class="lead">A free 30-minute call with me, Tom: what is costing you work, what I would build first, and a fixed price.</p>
    </div>
    <div class="hx-ctas"><a class="btn btn-live btn-lg" href="${b}book/">Book a call</a><a class="btn btn-glass btn-lg" href="${b}start/?utm_source=site&amp;utm_medium=trades&amp;utm_campaign=index">Book in three taps</a></div>
  </div>
</section>
</main>
${L.footer(b, { mbar: false, dark: true })}`;
    return L.page(L.head({ b, path, title, description, og: 'for', css: ['home.css', 'trade.css'], nodes, palette: L.BRAND, theme: '#0A0B0D', dark: false }), body, L.scripts(b));
  },
};

module.exports = { SG, stills, pages: [segIndex, ...SG.map(segPage)] };
