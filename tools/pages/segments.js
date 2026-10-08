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

const segPage = s => ({
  url: `/for/${s.slug}/`, og: `for-${s.slug}`, priority: 0.8, changefreq: 'monthly',
  meta: { key: `for-${s.slug}`, title: s.label, kicker: 'For your trade', sub: s.h1 },
  render(b){
    const path = `/for/${s.slug}/`, title = `${s.title} | ${site.name}`;
    const cr = [['Home', ''], ['By trade', 'for/'], [s.label, `for/${s.slug}/`]];
    const tryHref = d => `${b}try/${d}/?kind=${s.kind}`;
    const nodes = [
      L.webPage({ path, title, description: s.description, extra: { mainEntity: { '@id': L.abs(path) + '#service' } } }),
      P.crumbNodes(cr),
      { '@type': 'Service', '@id': L.abs(path) + '#service', name: `Websites, booking and follow-up for ${lc(s.label)}`, serviceType: 'Web design, online booking and follow-up automation',
        description: s.answer, url: L.abs(path), provider: { '@id': L.ORG_ID }, areaServed: { '@type': 'Country', name: site.areaServed },
        audience: { '@type': 'BusinessAudience', name: `UK ${lc(s.label)}` },
        isRelatedTo: [...SV.slice(0, 3).map(x => ({ '@id': P.svcId(x.slug) })), ...s.autos.map(([a]) => ({ '@id': P.autoId(a) }))] },
      { '@type': 'ItemList', '@id': L.abs(path) + '#demos', name: `Live demos for ${lc(s.label)}`, itemListElement: s.demos.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/try/${d}/`), name: P.demo(d).name })) },
      P.faqNode(s.faq, path),
    ];
    const peers = SG.filter(x => x.group === s.group && x !== s);
    const body = `
${L.header(b, 'services')}
<main id="main">
<section class="hero-w wrap">
  ${P.crumbs(b, cr)}
  <h1>${esc(s.h1)}</h1>
  <p class="lead answer">${esc(s.answer)}</p>
  <div class="cta-row hero-cta"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-ghost" href="${tryHref(s.demos[0])}">Try it as ${article(s.word)} ${esc(s.word)}</a></div>
</section>
${P.panel('What it needs', esc(s.label), `<h2>What should a website for ${esc(lc(s.label))} do?</h2><ul class="feat cols">${s.needs.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`)}
${P.panel('Your customers', 'How the work comes in', `<h2>How do customers choose ${article(s.word)} ${esc(s.word)}?</h2><p class="lead">${esc(s.journey)}</p>`)}
<section class="sec" id="automations" aria-labelledby="h-auto">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-auto">The three automations that matter most</h2></div>
    <div class="hub-list">${s.autos.map(([a, why]) => { const x = P.auto(a); return `<a class="hub-card" href="${b}automations/${x.slug}/"><h3>${esc(x.name)}</h3><p>${esc(why)}</p><span class="try-go">How it works <span aria-hidden="true">→</span></span></a>`; }).join('')}</div>
  </div>
</section>
<section class="sec" id="try" aria-labelledby="h-try">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-try">Try it as ${article(s.word)} ${esc(s.word)}</h2><p class="lead">The live demos, set up for ${esc(lc(s.label))} with a made-up business. You play the customer, then see what you would see.</p></div>
    <div class="try-list${s.demos.length === 2 ? ' is-2' : ''}">${s.demos.map(P.demo).map(x => `<a class="try-card" href="${tryHref(x.slug)}"><span class="try-n">Demo</span><h3>${esc(x.name)}</h3><p>${esc(x.line)}</p><span class="try-go">Try it <span aria-hidden="true">→</span></span></a>`).join('')}</div>
  </div>
</section>
${P.buildWall(b, s.builds, 'Builds that fit', 'Working builds for made-up businesses. Open any of them on your phone and use it.')}
${P.fill(P.faqPanel(s.faq, `${s.label}: questions people ask`), b)}
<section class="sec rel" aria-labelledby="h-svc">
  <div class="wrap"><h2 id="h-svc" class="rel-h">What I build for ${esc(lc(s.label))}</h2><div class="rel-list">${SV.map(x => `<a href="${b}services/${x.slug}/"><b>${esc(x.name)}</b><span>${esc(x.card)}</span></a>`).join('')}</div>
  ${peers.length ? `<h2 class="rel-h rel-h2">Other ${esc(lc(s.group))} businesses</h2><div class="rel-list">${peers.map(x => `<a href="${b}for/${x.slug}/"><b>${esc(x.label)}</b><span>${esc(x.h1)}</span></a>`).join('')}</div>` : ''}</div>
</section>
</main>
${P.band(b, 'trades', s.slug)}
${L.footer(b)}`;
    return L.page(L.head({ b, path, title, description: s.description, og: `for-${s.slug}`, css: ['pages.css', 'device.css'], nodes }), body, L.scripts(b));
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
<main id="main">
<section class="hero-w wrap">
  ${P.crumbs(b, [['Home', ''], ['By trade', 'for/']])}
  <h1>Websites and booking for your trade.</h1>
  <p class="lead answer">Every kind of business gets its work in a different way: a locksmith lives on the emergency call, a salon on the rebooking, an architect on the enquiry that turns into a project. Find yours to see what its website needs, the automations that matter most to it, and the demos set up for it.</p>
</section>
${GROUPS.map(g => `<section class="sec seg-g" aria-labelledby="g-${g.replace(/\W+/g, '-').toLowerCase()}">
  <div class="wrap">
    <h2 class="rel-h" id="g-${g.replace(/\W+/g, '-').toLowerCase()}">${esc(g)}</h2>
    <div class="rel-list">${SG.filter(s => s.group === g).map(s => `<a href="${b}for/${s.slug}/"><b>${esc(s.label)}</b><span>${esc(s.h1)}</span></a>`).join('')}</div>
  </div>
</section>`).join('\n')}
</main>
${P.band(b, 'trades', 'index')}
${L.footer(b)}`;
    return L.page(L.head({ b, path, title, description, og: 'for', css: ['pages.css'], nodes }), body, L.scripts(b));
  },
};

module.exports = { SG, pages: [segIndex, ...SG.map(segPage)] };
