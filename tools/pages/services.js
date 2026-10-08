/* The pages that answer what people search: /services/, /automations/, /compare/ and /faq/, each with a
   page per item. Everything comes from data/services.js, data/automations.js, data/compare.js and
   data/faq.js, so adding one is a data change. Every page leads with the two sentences that answer its
   question (the passage AI assistants quote), then proof that runs, then its questions, then the call. */
const L = require('../lib.js');
const { site, builds, esc } = L;
const SV = require('../../data/services.js');
const AU = require('../../data/automations.js');
const CP = require('../../data/compare.js');
const GQ = require('../../data/faq.js');
const DEMOS = require('./try.js').DEMOS;

const B = n => builds.find(x => x.n === n);
const svc = s => SV.find(x => x.slug === s);
const auto = s => AU.find(x => x.slug === s);
const demo = s => DEMOS.find(x => x.slug === s);
const utm = (b, medium, slug) => `${b}start/?utm_source=site&utm_medium=${medium}&utm_campaign=${slug}`;
const crumbs = (b, items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map((it, i) => i === items.length - 1 ? `<span aria-current="page">${esc(it[0])}</span>` : `<a href="${b}${it[1]}">${esc(it[0])}</a><span>/</span>`).join('')}</nav>`;
const crumbNodes = items => L.breadcrumb(items.map(([name, p]) => ({ name, path: '/' + p })));
const faqNode = (qs, id) => ({ '@type': 'FAQPage', '@id': L.abs(id) + '#faq', mainEntity: qs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const svcId = s => L.abs(`/services/${s}/`) + '#service';
const autoId = s => L.abs(`/automations/${s}/`) + '#service';

/* the four steps every build follows (moved here from /what-i-do/) */
const PROCESS = [
  ['The teardown', 'Ten minutes on your website, your Google listing and what happens when someone tries to reach you. Three things back: what is leaking, what to fix first, what it is worth in jobs. Free, by message.'],
  ['A flat quote', 'Every job is quoted flat and agreed before anything starts, with a date. No surprises, and no meeting that should have been a message.'],
  ['Built in public', 'A website takes days; a full system usually one to two weeks. You can watch it being made.'],
  ['Handover', 'Domain, code and accounts set up in your name. Walk away tomorrow and it all keeps working.'],
];
const howNode = (id, name) => ({ '@type': 'HowTo', '@id': L.abs(id) + '#process', name, description: 'From a free teardown to a system you own.',
  step: PROCESS.map(([n, t], i) => ({ '@type': 'HowToStep', position: i + 1, name: n, text: t })) });

/* the films, and the VideoObject each page that plays one carries */
const FILMS = {
  website: { name: 'Seven days from invisible to booked', dur: 'PT33S', label: 'A week-long website build for a heating engineer, then enquiries arriving in the Skales CRM',
    desc: 'A film of a website build for a fictional heating engineer: built in seven days, found on Google, and the enquiries arriving in the Skales CRM. Fictional business, illustrative numbers.' },
  'missed-call': { name: 'A missed call, booked in two minutes', dur: 'PT31S', label: 'A missed call to a heating engineer becomes a lead, a text, a booking with a deposit and a job in the diary',
    desc: 'A film of a missed call to a fictional heating engineer: the call becomes a lead in the Skales CRM, the customer is texted a booking link, books with a deposit, and the job lands in the diary. Fictional business, illustrative numbers.' },
};
const filmNode = (key, pagePath) => { const f = FILMS[key]; return { '@type': 'VideoObject', '@id': L.abs(pagePath) + '#film', name: f.name, description: f.desc,
  thumbnailUrl: L.abs(`/assets/film/${key}.jpg`), contentUrl: L.abs(`/assets/film/${key}.mp4`), uploadDate: '2026-10-08', duration: f.dur, publisher: { '@id': L.ORG_ID } }; };
const film = (b, key) => `<figure class="film">
      <video data-film muted playsinline loop preload="none" disablepictureinpicture
        data-wide="${b}assets/film/${key}.mp4" data-phone="${b}assets/film/${key}-phone.mp4"
        data-wide-poster="${b}assets/film/${key}.jpg" data-phone-poster="${b}assets/film/${key}-phone.jpg" poster="${b}assets/film/${key}.jpg"
        aria-label="${esc(FILMS[key].label)}"></video>
      <figcaption><span>Fictional business · illustrative numbers</span><button type="button" class="film-tg" data-film-toggle aria-pressed="false">Play the film</button></figcaption>
    </figure>`;

/* ---------- shared blocks ---------- */
const panel = (sheet, name, inner, attrs = '') => `<section class="panel"${attrs}>
  <div class="wrap inner">
    <div class="lab"><span class="sheet">${sheet}</span><span class="name">${name}</span></div>
    <div class="body">${inner}</div>
  </div>
</section>`;
const faqPanel = (qs, h2) => `<section class="panel faq" id="faq">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">Straight answers</span><span class="name">The questions people ask</span></div>
    <div class="body">
      <h2>${esc(h2)}</h2>
      ${qs.map(([q, a]) => `<details><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('')}
      <p class="faq-more">More in <a class="lnk" href="{{b}}faq/">every question, answered</a>.</p>
    </div>
  </div>
</section>`;
const tryCards = (b, slugs, h = 'Try it on your phone') => !slugs.length ? '' : `<section class="sec" id="try" aria-labelledby="h-try">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-try">${esc(h)}</h2><p class="lead">Live demos with a made-up business. You play the customer, then see what the business sees. About a minute each.</p></div>
    <div class="try-list${slugs.length === 2 ? ' is-2' : ''}">${slugs.map(demo).filter(Boolean).map(x => `<a class="try-card" href="${b}try/${x.slug}/"><span class="try-n">Demo</span><h3>${esc(x.name)}</h3><p>${esc(x.line)}</p><span class="try-go">Try it <span aria-hidden="true">→</span></span></a>`).join('')}</div>
  </div>
</section>`;
const buildWall = (b, ns, h, p) => !ns.length ? '' : `<section class="sec sec-alu" id="builds" aria-labelledby="h-builds">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-builds">${esc(h)}</h2><p class="lead">${p}</p></div>
    ${L.wall(b, ns.map(B).filter(Boolean), ns.length === 3 ? 'wall-3' : '')}
  </div>
</section>`;
const autoCards = (b, slugs, h) => !slugs.length ? '' : `<section class="sec" id="automations" aria-labelledby="h-auto">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-auto">${esc(h)}</h2></div>
    <div class="hub-list${slugs.length === 2 || slugs.length === 4 ? ' is-2' : ''}">${slugs.map(auto).filter(Boolean).map(a => `<a class="hub-card" href="${b}automations/${a.slug}/"><h3>${esc(a.name)}</h3><p>${esc(a.card)}</p><span class="try-go">How it works <span aria-hidden="true">→</span></span></a>`).join('')}</div>
  </div>
</section>`;
const ctaRow = (b, demos, medium, slug) => `<div class="cta-row hero-cta"><a class="btn btn-live" href="${b}book/">Book a call</a>${demos.length ? `<a class="btn btn-ghost" href="${b}try/${demos[0]}/">Try the demo</a>` : `<a class="btn btn-ghost" href="${utm(b, medium, slug)}">See what you’re missing</a>`}</div>`;
const band = (b, medium, slug) => L.ctaBand(b, 'Want this working for your business?', 'Book a call and I’ll look at your business with you, or take the 60-second check first and see what you’re missing.', `<a class="btn btn-ghost" href="${utm(b, medium, slug)}">Take the 60-second check</a>`);
const fill = (html, b) => html.replace(/\{\{b\}\}/g, b);

/* ---------- the ad previews on the two ads pages (a made-up business, labelled) ---------- */
const metaAd = b => `<figure class="adp">
  <div class="adp-meta" role="img" aria-label="A Facebook feed ad for Larchfield Heating, a fictional heating engineer, offering a free boiler service slot tomorrow">
    <div class="am-hd"><span class="am-av" aria-hidden="true">L</span><div><b>Larchfield Heating</b><span>Sponsored · <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 8h13M8 1.5c2 2 2 11 0 13M8 1.5c-2 2-2 11 0 13" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></span></div><span class="am-dots" aria-hidden="true">···</span></div>
    <p class="am-tx">Boiler due a service? We’ve got free slots in Ealing this week. Pick one tonight and it’s yours, no phone tag. Gas Safe engineers, and the certificate emailed the same day.</p>
    <div class="am-img"><img src="${b}assets/plates/heating.webp" width="900" height="506" alt="" loading="lazy" decoding="async"><span class="am-chip"><i></i>Next free slot · Tomorrow, 10:30</span></div>
    <div class="am-link"><div><span>larchfield.co.uk</span><b>Boiler service in Ealing, book online</b></div><span class="am-btn">Book now</span></div>
    <div class="am-act" aria-hidden="true"><span>Like</span><span>Comment</span><span>Share</span></div>
  </div>
  <figcaption>Fictional business. An example of the kind of ad I run.</figcaption>
</figure>`;
const googleAd = () => `<figure class="adp">
  <div class="adp-g" role="img" aria-label="A Google search ad for Larchfield Heating, a fictional heating engineer, above the results for boiler service Ealing">
    <div class="ag-q"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>boiler service ealing</div>
    <div class="ag-ad">
      <span class="ag-sp">Sponsored</span>
      <div class="ag-who"><span class="ag-fav" aria-hidden="true">L</span><div><b>Larchfield Heating</b><span>https://www.larchfield.co.uk › book</span></div></div>
      <p class="ag-h">Boiler Service in Ealing | Book Online Tonight</p>
      <p class="ag-d">Gas Safe engineers covering Ealing and west London. See the real free slots and book in two minutes. Certificate emailed the same day.</p>
      <div class="ag-sl"><span>Boiler service</span><span>Breakdowns</span><span>Landlord certificates</span></div>
    </div>
  </div>
  <figcaption>Fictional business. An example of the kind of ad I run.</figcaption>
</figure>`;
const adSection = (s) => {
  const steps = s.adPreview === 'meta'
    ? [['They tap the ad', 'On Facebook or Instagram, between a friend’s photos and the news.'], ['The page keeps the promise', 'It opens on a page about exactly what the ad said, with the free slots right there.'], ['They book, or leave a number', 'Booking takes a minute. If they only enquire, they get a text back straight away.'], ['You see what it cost', 'The booking is reported back to Meta and lands in your CRM, tagged with the ad.']]
    : [['They search', 'Someone nearby types the job and the area into Google.'], ['They see your ad', 'Above the results, saying exactly what they searched for.'], ['They book or call', 'The page they land on has the free slots and one tap to call.'], ['You see what it cost', 'The call or booking is recorded against the search that brought it, and lands in your CRM.']];
  return `<section class="sec sec-alu" id="ad" aria-labelledby="h-ad">
  <div class="wrap ad-grid">
    ${s.adPreview === 'meta' ? metaAd('{{b}}') : googleAd()}
    <div>
      <h2 id="h-ad">From the ad to a booked job.</h2>
      <ol class="steps steps-tight">${steps.map(([h, t]) => `<li><b>${esc(h)}</b>${esc(t)}</li>`).join('')}</ol>
    </div>
  </div>
</section>`;
};

/* the live widgets from the old /what-i-do/ page, kept on the pages they prove (assets/systems.js) */
const turnoverRig = b => { const t = B(13); return `<section class="sec sec-alu" id="see" aria-labelledby="h-see">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-see">The same firm, before and after.</h2><p class="lead">A made-up roofing firm’s 2011 website on one side and its rebuild on the other. Drag the tape line across.</p></div>
    <div class="rig rig-solo" style="--chan:${t.c}">
      <div class="stage">
        <div class="chrome"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><span class="url"><b>${esc(t.name)}</b> &middot; before and after a rebuild</span><a class="pop" href="${b}work/${t.slug}/">Its page</a></div>
        <div class="viewport vp-short" data-solo="${t.slug}"><div class="boot">Loading</div></div>
      </div>
    </div>
  </div>
</section>`; };
const followWidgets = () => `<section class="sec sec-alu" id="see" aria-labelledby="h-see">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-see">Two of them, running.</h2><p class="lead">A made-up fencing firm. Simulate a missed call and watch it get caught; watch the reviews come in after each job.</p></div>
    <div class="svc-demo two">
      <div class="dcard">
        <div class="dbar"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><b>calls &mdash; Westfield Fencing</b></div>
        <div class="tb">
          <div class="tb-left"><p class="lbl">Incoming calls</p><div id="callList"></div><button class="btn btn-live btn-sm tb-btn" id="missBtn" type="button">Simulate a missed call</button></div>
          <div class="tb-right" id="tbChat"></div>
        </div>
      </div>
      <div class="dcard">
        <div class="dbar"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><b>reviews &mdash; Westfield Fencing</b></div>
        <div class="rv">
          <div class="rv-feed" id="rvFeed"></div>
          <div class="rv-score"><div class="stars" id="rvStars"><b>&#9733;&#9733;&#9733;&#9733;</b>&#9733;</div><div class="num" id="rvNum">4.6</div><div class="lbl">Google rating<br>this quarter</div></div>
        </div>
      </div>
    </div>
  </div>
</section>`;

/* ---------- /services/<slug>/ ---------- */
const servicePage = s => ({
  url: `/services/${s.slug}/`, og: `services-${s.slug}`, priority: 0.9, changefreq: 'monthly',
  meta: { key: `services-${s.slug}`, title: s.name, kicker: 'Services', sub: s.card },
  render(b){
    const path = `/services/${s.slug}/`, title = `${s.title} | ${site.name}`;
    const cr = [['Home', ''], ['Services', 'services/'], [s.name, `services/${s.slug}/`]];
    const autos = s.showAllAutomations ? AU.map(a => a.slug) : s.automations;
    const nodes = [
      L.webPage({ path, title, description: s.description, extra: { mainEntity: { '@id': svcId(s.slug) } } }),
      crumbNodes(cr),
      { '@type': 'Service', '@id': svcId(s.slug), name: s.name, serviceType: s.serviceType, description: s.answer, url: L.abs(path),
        provider: { '@id': L.ORG_ID }, areaServed: { '@type': 'Country', name: site.areaServed },
        audience: { '@type': 'BusinessAudience', name: 'UK trades and service businesses' },
        ...(autos.length ? { hasOfferCatalog: { '@type': 'OfferCatalog', name: `${s.name}: what is included`, itemListElement: autos.map(a => ({ '@type': 'Offer', itemOffered: { '@id': autoId(a) } })) } } : {}) },
      faqNode(s.faq, path),
      howNode(path, `How a ${s.name.toLowerCase()} build with ${site.name} works`),
      ...(s.film ? [filmNode(s.film.wide, path)] : []),
    ];
    const qa = s.sections.map(x => `<div class="qa"><h2>${esc(x.h2)}</h2>${x.p.map(p => `<p>${esc(p)}</p>`).join('')}</div>`).join('');
    const others = SV.filter(x => x !== s);
    const body = `
${L.header(b, 'services')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, cr)}
  <h1>${esc(s.h1)}</h1>
  <p class="lead answer">${esc(s.answer)}</p>
  ${ctaRow(b, s.demos, 'services', s.slug)}
</section>
${s.film ? `<section class="sec sec-alu" id="film" aria-labelledby="h-film">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-film">${esc(s.film.h2)}</h2><p class="lead">${esc(s.film.p)}</p></div>
    ${film(b, s.film.wide)}
  </div>
</section>` : ''}
${s.adPreview ? adSection(s) : ''}
${s.slug === 'follow-up-automation' ? followWidgets() : ''}
${panel('What you get', esc(s.name), `<h2>What is included?</h2><ul class="feat cols">${s.gets.map(g => `<li>${esc(g)}</li>`).join('')}</ul>`)}
${panel('The detail', 'Straight answers', qa, ' id="detail"')}
${s.slug === 'websites' ? turnoverRig(b) : ''}
${tryCards(b, s.demos)}
${autoCards(b, autos, s.slug === 'follow-up-automation' ? 'The six automations' : 'The automations that go with it')}
${buildWall(b, s.builds, 'Running on this site', 'Working builds for made-up businesses. Open any of them on your phone and use it.')}
${panel('The process', 'Teardown, quote, build, handover', `<h2>How does a build work?</h2><ol class="steps">${PROCESS.map(([n, t]) => `<li><b>${esc(n)}.</b> ${esc(t)}</li>`).join('')}</ol>`, ' id="process"')}
${fill(faqPanel(s.faq, `${s.name}: questions people ask`), b)}
<section class="sec rel" aria-labelledby="h-rel">
  <div class="wrap"><h2 id="h-rel" class="rel-h">The other services</h2><div class="rel-list">${others.map(x => `<a href="${b}services/${x.slug}/"><b>${esc(x.name)}</b><span>${esc(x.card)}</span></a>`).join('')}</div></div>
</section>
</main>
${band(b, 'services', s.slug)}
${L.footer(b)}`;
    const live = s.slug === 'websites' || s.slug === 'follow-up-automation';
    const css = ['pages.css', ...(s.builds.length || live ? ['device.css'] : []), ...(live ? ['systems.css'] : [])];
    const js = [...(s.film ? ['films.js'] : []), ...(live ? ['builds.js', 'device.js', 'systems.js'] : [])];
    return L.page(L.head({ b, path, title, description: s.description, og: `services-${s.slug}`, css, nodes }), fill(body, b), L.scripts(b, js));
  },
});

/* ---------- /services/ ---------- */
const servicesIndex = {
  url: '/services/', og: 'services', priority: 0.9, changefreq: 'monthly',
  meta: { key: 'services', title: 'Websites, booking, follow-up and ads', kicker: 'Services', sub: 'Five services, one system: a search, a tap or a missed call, turned into a booked job.' },
  render(b){
    const path = '/services/', title = `Websites, booking, follow-up and ads | ${site.name}`;
    const description = `Websites, online booking and CRM, follow-up automation, and Meta and Google ads for UK trades and service businesses, built as one system you own.`;
    const nodes = [
      L.webPage({ path, title, description, type: 'CollectionPage' }),
      crumbNodes([['Home', ''], ['Services', 'services/']]),
      { '@type': 'ItemList', '@id': L.abs(path) + '#list', name: `${site.name} services`, itemListElement: SV.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/services/${s.slug}/`), name: s.name })) },
      howNode(path, `How a build with ${site.name} works`),
      faqNode(GQ.slice(0, 6), path),
    ];
    const body = `
${L.header(b, 'services')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, [['Home', ''], ['Services', 'services/']])}
  <h1>Websites, booking, follow-up and ads for service businesses.</h1>
  <p class="lead answer">${esc(site.name)} builds five things for UK trades and service businesses: a website that turns a visit into a job, online booking with a CRM, follow-up texts that send themselves, and Meta and Google ads that point at all three. They work as one system, and everything is set up in your name.</p>
  <div class="cta-row hero-cta"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-ghost" href="${b}try/">Try the live demos</a></div>
</section>
<section class="sec" aria-label="The five services">
  <div class="wrap"><div class="hub-list hub-5">${SV.map(s => `<a class="hub-card"${s.legacy ? ` id="${s.legacy}"` : ''} href="${b}services/${s.slug}/"><span class="try-n">${s.n}</span><h2>${esc(s.name)}</h2><p>${esc(s.card)}</p><span class="try-go">More <span aria-hidden="true">→</span></span></a>`).join('')}</div></div>
</section>
${panel('How it fits', 'One system', `<h2>Why one system rather than five suppliers?</h2><p class="lead">Because the gaps between them are where the jobs go missing. An ad that lands on a page that cannot book, a booking that never gets a reminder, a missed call nobody returns. Here the ad points at the website, the website books into the CRM, and the CRM sends the texts, so nothing falls between two suppliers.</p><p>You can start with one piece and add the rest. Most owners start with the website or the missed-call text-back, because that is where the most work is leaking.</p>`)}
${panel('The process', 'Teardown, quote, build, handover', `<h2>How does a build work?</h2><ol class="steps">${PROCESS.map(([n, t]) => `<li><b>${esc(n)}.</b> ${esc(t)}</li>`).join('')}</ol>`, ' id="process"')}
${autoCards(b, AU.map(a => a.slug), 'The automations')}
${fill(faqPanel(GQ.slice(0, 6), `Questions people ask ${site.name}`), b)}
</main>
${band(b, 'services', 'index')}
${L.footer(b)}`;
    return L.page(L.head({ b, path, title, description, og: 'services', css: ['pages.css'], nodes }), body, L.scripts(b));
  },
};

/* ---------- /automations/<slug>/ ---------- */
const autoPage = a => ({
  url: `/automations/${a.slug}/`, og: `automations-${a.slug}`, priority: 0.8, changefreq: 'monthly',
  meta: { key: `automations-${a.slug}`, title: a.name, kicker: 'Automations', sub: a.card },
  render(b){
    const path = `/automations/${a.slug}/`, title = `${a.title} | ${site.name}`;
    const cr = [['Home', ''], ['Automations', 'automations/'], [a.name, `automations/${a.slug}/`]];
    const nodes = [
      L.webPage({ path, title, description: a.description, extra: { mainEntity: { '@id': autoId(a.slug) } } }),
      crumbNodes(cr),
      { '@type': 'Service', '@id': autoId(a.slug), name: a.name, serviceType: a.name, description: a.answer, url: L.abs(path),
        provider: { '@id': L.ORG_ID }, areaServed: { '@type': 'Country', name: site.areaServed },
        audience: { '@type': 'BusinessAudience', name: 'UK trades and service businesses' },
        isRelatedTo: a.services.map(s => ({ '@id': svcId(s) })) },
      { '@type': 'HowTo', '@id': L.abs(path) + '#howto', name: `How ${a.name.toLowerCase()} works`, description: a.answer,
        step: a.steps.map(([n, t], i) => ({ '@type': 'HowToStep', position: i + 1, name: n, text: t })) },
      faqNode(a.faq, path),
    ];
    const others = AU.filter(x => x !== a);
    const body = `
${L.header(b, 'services')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, cr)}
  <h1>${esc(a.h1)}</h1>
  <p class="lead answer">${esc(a.answer)}</p>
  ${ctaRow(b, a.demos, 'automations', a.slug)}
</section>
${panel('Why it matters', esc(a.name), `<h2>Why does it matter?</h2><p class="lead">${esc(a.why)}</p>`)}
${panel('How it works', 'Step by step', `<h2>How does ${esc(a.name.toLowerCase())} work?</h2><ol class="steps">${a.steps.map(([n, t]) => `<li><b>${esc(n)}.</b> ${esc(t)}</li>`).join('')}</ol>`, ' id="how"')}
${panel('The message', 'What the customer gets', `<h2>What does the text say?</h2><div class="msg"><p class="msg-b">${esc(a.message)}</p><span class="msg-n">An example for Larchfield Heating, a made-up business. Yours is written with you, in your words.</span></div>`)}
${panel('What it needs', 'From you', `<h2>What does it need from me?</h2><ul class="feat">${a.needs.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`)}
${tryCards(b, a.demos, 'See it run')}
${buildWall(b, a.builds, 'Builds that run it', 'Working builds for made-up businesses, each with this automation inside. Open one on your phone and use it.')}
${fill(faqPanel(a.faq, `${a.name}: questions people ask`), b)}
<section class="sec rel" aria-labelledby="h-rel">
  <div class="wrap"><h2 id="h-rel" class="rel-h">Part of ${a.services.map(s => `<a class="lnk" href="${b}services/${s}/">${esc(svc(s).name.charAt(0).toLowerCase() + svc(s).name.slice(1))}</a>`).join(' and ')}</h2><div class="rel-list">${others.map(x => `<a href="${b}automations/${x.slug}/"><b>${esc(x.name)}</b><span>${esc(x.card)}</span></a>`).join('')}</div></div>
</section>
</main>
${band(b, 'automations', a.slug)}
${L.footer(b)}`;
    return L.page(L.head({ b, path, title, description: a.description, og: `automations-${a.slug}`, css: ['pages.css', 'device.css'], nodes }), body, L.scripts(b));
  },
});

const autoIndex = {
  url: '/automations/', og: 'automations', priority: 0.8, changefreq: 'monthly',
  meta: { key: 'automations', title: 'Six texts that send themselves', kicker: 'Automations', sub: 'Missed-call text-back, review requests, reminders, quote chasing, deposits and on-my-way texts.' },
  render(b){
    const path = '/automations/', title = `Automations for service businesses | ${site.name}`;
    const description = `Six automations for UK trades and service businesses: missed-call text-back, review requests, service reminders, quote chasing, deposits and on-my-way texts.`;
    const nodes = [
      L.webPage({ path, title, description, type: 'CollectionPage' }),
      crumbNodes([['Home', ''], ['Automations', 'automations/']]),
      { '@type': 'ItemList', '@id': L.abs(path) + '#list', name: 'Automations', itemListElement: AU.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/automations/${a.slug}/`), name: a.name })) },
    ];
    const body = `
${L.header(b, 'services')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, [['Home', ''], ['Automations', 'automations/']])}
  <h1>Six texts that send themselves.</h1>
  <p class="lead answer">These are the automations I set up for UK service businesses: each one sends a text at the moment it matters, written in your words, so missed calls, quiet quotes, no-shows and forgotten reviews stop costing you work. They run on their own once they are set up.</p>
  <div class="cta-row hero-cta"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-ghost" href="${b}try/missed-call/">Try the missed-call demo</a></div>
</section>
<section class="sec" aria-label="The six automations">
  <div class="wrap"><div class="hub-list">${AU.map(a => `<a class="hub-card" href="${b}automations/${a.slug}/"><h2>${esc(a.name)}</h2><p>${esc(a.card)}</p><span class="try-go">How it works <span aria-hidden="true">→</span></span></a>`).join('')}</div></div>
</section>
${panel('Where they live', 'Follow-up automation', `<h2>Do I need all six?</h2><p class="lead">No. Most businesses start with missed-call text-back and review requests, because they work on their own. Quote chasing, reminders, deposits and on-my-way texts need somewhere to keep the jobs, which is the <a class="lnk" href="${b}services/booking-and-crm/">booking and CRM</a> service.</p><p>All six together are the <a class="lnk" href="${b}services/follow-up-automation/">follow-up automation</a> service.</p>`)}
</main>
${band(b, 'automations', 'index')}
${L.footer(b)}`;
    return L.page(L.head({ b, path, title, description, og: 'automations', css: ['pages.css'], nodes }), body, L.scripts(b));
  },
};

/* ---------- /compare/<slug>/ ---------- */
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const comparePage = c => ({
  url: `/compare/${c.slug}/`, og: `compare-${c.slug}`, priority: 0.7, changefreq: 'monthly',
  meta: { key: `compare-${c.slug}`, title: `${site.name} vs ${c.them}`, kicker: 'Compare', sub: c.card },
  render(b){
    const path = `/compare/${c.slug}/`, title = `${c.title} | ${site.name}`;
    const cr = [['Home', ''], ['Compare', 'compare/'], [c.short, `compare/${c.slug}/`]];
    const nodes = [L.webPage({ path, title, description: c.description }), crumbNodes(cr), faqNode(c.faq, path)];
    const body = `
${L.header(b, 'services')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, cr)}
  <h1>${esc(c.h1)}</h1>
  <p class="lead answer">${esc(c.answer)}</p>
</section>
<section class="sec sec-alu" aria-labelledby="h-cmp">
  <div class="wrap">
    <h2 id="h-cmp" class="cmp-h">Side by side</h2>
    <div class="cmp-wrap"><table class="cmp">
      <thead><tr><th scope="col"><span class="vh">What</span></th><th scope="col">${esc(cap(c.them))}</th><th scope="col">${esc(site.name)}</th></tr></thead>
      <tbody>${c.rows.map(([k, t, u]) => `<tr><th scope="row">${esc(k)}</th><td data-label="${esc(cap(c.them))}">${esc(t)}</td><td data-label="${esc(site.name)}">${esc(u)}</td></tr>`).join('')}</tbody>
    </table></div>
  </div>
</section>
<section class="sec" aria-label="Which to choose">
  <div class="wrap why3 cmp-when">
    <div><h2>When ${esc(c.them)} is the better choice</h2><ul class="feat">${c.them_when.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div><h2>When ${esc(site.name)} is</h2><ul class="feat">${c.us_when.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  </div>
</section>
${fill(faqPanel(c.faq, 'Questions people ask'), b)}
<section class="sec rel" aria-labelledby="h-rel">
  <div class="wrap"><h2 id="h-rel" class="rel-h">Other comparisons</h2><div class="rel-list">${CP.filter(x => x !== c).map(x => `<a href="${b}compare/${x.slug}/"><b>${esc(site.name)} vs ${esc(x.them)}</b><span>${esc(x.card)}</span></a>`).join('')}</div></div>
</section>
</main>
${band(b, 'compare', c.slug)}
${L.footer(b)}`;
    return L.page(L.head({ b, path, title, description: c.description, og: `compare-${c.slug}`, css: ['pages.css'], nodes }), body, L.scripts(b));
  },
});
const compareIndex = {
  url: '/compare/', og: 'compare', priority: 0.6, changefreq: 'monthly',
  meta: { key: 'compare', title: 'Honest comparisons', kicker: 'Compare', sub: 'Page builders, pay-monthly trade sites, missed-call apps and directories, side by side.' },
  render(b){
    const path = '/compare/', title = `Compare: page builders, apps and directories | ${site.name}`;
    const description = `Honest comparisons for UK service businesses: Skales against page builders, pay-monthly trade websites, missed-call apps and directories like Checkatrade.`;
    const nodes = [L.webPage({ path, title, description, type: 'CollectionPage' }), crumbNodes([['Home', ''], ['Compare', 'compare/']]),
      { '@type': 'ItemList', '@id': L.abs(path) + '#list', name: 'Comparisons', itemListElement: CP.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/compare/${c.slug}/`), name: c.title })) }];
    const body = `
${L.header(b, 'services')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, [['Home', ''], ['Compare', 'compare/']])}
  <h1>Honest comparisons.</h1>
  <p class="lead answer">${esc(site.name)} is not the right choice for every business, and these pages say when it is not. Each one puts a hand-built site with booking and follow-up next to the option you are probably weighing it against.</p>
</section>
<section class="sec" aria-label="The comparisons">
  <div class="wrap"><div class="hub-list">${CP.map(c => `<a class="hub-card" href="${b}compare/${c.slug}/"><h2>${esc(site.name)} vs ${esc(c.them)}</h2><p>${esc(c.card)}</p><span class="try-go">Compare <span aria-hidden="true">→</span></span></a>`).join('')}</div></div>
</section>
</main>
${band(b, 'compare', 'index')}
${L.footer(b)}`;
    return L.page(L.head({ b, path, title, description, og: 'compare', css: ['pages.css'], nodes }), body, L.scripts(b));
  },
};

/* ---------- /faq/ ---------- */
const faqHub = {
  url: '/faq/', og: 'faq', priority: 0.8, changefreq: 'monthly',
  meta: { key: 'faq', title: 'Every question, answered', kicker: 'FAQ', sub: 'Short, straight answers about websites, booking, follow-up, ads and how a build works.' },
  render(b){
    const path = '/faq/', title = `Questions about websites, booking and ads | ${site.name}`;
    const description = `Straight answers for UK service businesses: cost, timings, ownership, Google rankings, online booking, deposits, missed-call text-back, reviews and ads.`;
    const groups = [
      { h: 'The basics', id: 'basics', qs: GQ },
      ...SV.map(s => ({ h: s.name, id: s.slug, link: `services/${s.slug}/`, qs: s.faq })),
      ...AU.map(a => ({ h: a.name, id: a.slug, link: `automations/${a.slug}/`, qs: a.faq })),
      ...CP.map(c => ({ h: `${site.name} vs ${c.them}`, id: 'vs-' + c.slug, link: `compare/${c.slug}/`, qs: c.faq })),
    ];
    const seen = new Set(), all = [];
    groups.forEach(g => g.qs.forEach(q => { if (!seen.has(q[0])){ seen.add(q[0]); all.push(q); } }));
    const nodes = [L.webPage({ path, title, description, type: 'FAQPage', extra: { mainEntity: all.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } }),
      crumbNodes([['Home', ''], ['FAQ', 'faq/']])];
    const body = `
${L.header(b, 'services')}
<main id="main">
<section class="hero-w wrap">
  ${crumbs(b, [['Home', ''], ['FAQ', 'faq/']])}
  <h1>Every question, answered.</h1>
  <p class="lead answer">Short, straight answers about what ${esc(site.name)} builds, what it costs, how long it takes and who owns it, then the questions for each service, automation and comparison. If yours is not here, ask it on a call.</p>
  <nav class="faq-toc" aria-label="Jump to">${groups.map(g => `<a href="#${g.id}">${esc(g.h)}</a>`).join('')}</nav>
</section>
${groups.map(g => `<section class="panel faq" id="${g.id}">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">${esc(g.h)}</span>${g.link ? `<a class="name lnk" href="${b}${g.link}">The full page</a>` : `<span class="name">Start here</span>`}</div>
    <div class="body">
      <h2>${esc(g.h)}</h2>
      ${g.qs.map(([q, a]) => `<details><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('')}
    </div>
  </div>
</section>`).join('\n')}
</main>
${L.ctaBand(b, 'Still got a question?', 'Ask it on a call about your business. No pitch, no proposal deck.', `<a class="btn btn-ghost" href="${b}try/">Try the live demos</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path, title, description, og: 'faq', css: ['pages.css'], nodes }), body, L.scripts(b));
  },
};

module.exports = { SV, AU, CP, GQ, pages: [servicesIndex, ...SV.map(servicePage), autoIndex, ...AU.map(autoPage), compareIndex, ...CP.map(comparePage), faqHub] };
