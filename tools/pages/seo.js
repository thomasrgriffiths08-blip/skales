/* /seo/ : how a Skales site gets found. What SEO, GEO, schema and metadata are, why they work, and exactly what
   goes into every page, shown on one made-up business (Kestrel Electrical, the electrician on /work/) as the four
   layers of a single page: what a person sees, what a search engine reads, what the schema says, what an AI quotes.
   Honest about what nobody can promise. Every Kestrel detail is fictional and matches its demo. */
const L = require('../lib.js');
const { site, esc, builds, pad } = L;

const K = builds.find(x => x.slug === 'kestrel-electrical');
const KD = 'kestrelelectrical.example.co.uk';

const FAQ = [
  ['What is SEO?', 'Search engine optimisation: building and writing a website so search engines can read it, understand what the business does and where, and show it to people searching for that. For a local business it mostly means clear pages for each service and area, accurate details, a fast site on a phone, and a well kept Google Business Profile.'],
  ['What is GEO?', 'Generative engine optimisation: making a website easy for AI assistants such as ChatGPT, Gemini, Perplexity and Google’s AI Overviews to read and quote. They build answers from pages they can fetch, and they lift short, self-contained facts, so prices, areas, hours and what is included are written as plain sentences.'],
  ['What is schema markup?', 'Schema, or structured data, is a block of code in the page (JSON-LD) that states facts in a shared vocabulary from schema.org: this is an electrician, here is the address, these are the hours, this service starts at this price. Search engines and AI tools read it without having to guess from the design.'],
  ['What is metadata?', 'The information about a page that sits in its code rather than on screen: the title tag and meta description that make up a search result, the canonical address, and the Open Graph tags that decide the picture and title when the link is shared.'],
  ['Does schema guarantee stars or rich results in Google?', 'No. Schema helps search engines understand a page and can make it eligible for richer results, but Google decides what to show. Anyone promising stars from schema alone is overselling.'],
  ['How long does SEO take?', 'New pages usually take weeks to months to settle in the results, and local rankings also depend on your Google Business Profile and reviews. Ads can bring enquiries in the meantime.'],
  ['Do I still need a Google Business Profile?', 'Yes. For searches like “electrician near me”, the map results come from Google Business Profiles. The website backs the profile up with the same name, address, number and hours, written into its schema.'],
  ['What is llms.txt?', 'A plain text file at the root of a site that summarises the business and lists its key pages for AI tools. It is a proposed standard: some tools read it and some do not yet, and it costs nothing to have. This site has one.'],
];

const TOK = ["&lt;title&gt;", "&lt;meta description&gt;", "&lt;h1&gt; &lt;h2&gt;", "application/ld+json", "rel=&quot;canonical&quot;", "og:image", "alt=&quot;…&quot;", "/sitemap.xml", "/robots.txt", "/llms.txt", "IndexNow ping", "LCP · CLS · INP"];
const CHECK = [
  ['Title tag', 'The blue line in a search result. Written for the search people type, “Electrician in Nottingham”, not “Home”.'],
  ['Meta description', 'The two lines under the title. It does not lift rankings on its own, but it is the advert that earns the click.'],
  ['Headings', 'One H1 per page and H2s shaped like the questions people ask, so the page reads as an answer.'],
  ['Schema (JSON-LD)', 'The business type, address, hours, services and prices, stated in schema.org’s shared vocabulary.'],
  ['Canonical address', 'One true address for each page, so copies and tracking links do not split the credit.'],
  ['Share cards', 'Open Graph tags and a designed image, so a link sent on WhatsApp or Facebook shows the right picture and title.'],
  ['Alt text', 'Every photo described in words, for screen readers and for image search.'],
  ['Sitemap', 'A list of every page with the date it changed, so new pages are found without waiting.'],
  ['Robots rules', 'What search and AI crawlers may read. Left open for the pages you want found.'],
  ['llms.txt', 'A plain summary of the business and its pages for AI tools to read first.'],
  ['IndexNow', 'When a page is published or changed, Bing and the engines that use IndexNow are told straight away.'],
  ['Speed on a phone', 'Hand-written pages, sized images and no page builder. Google measures how fast and steady a page loads.'],
];

const WHY = [
  ['Search engines rank what they understand.', 'A page that says plainly what the business does, where and for whom, in its title, headings and schema, is easier to match to a search than a clever slogan. Each service and each area gets its own page, so each one can answer its own search.'],
  ['Local searches run on trust.', 'For “near me” searches Google leans on your Business Profile, your reviews and seeing the same name, address and number everywhere. The site repeats those exact details in its schema, so the two agree.'],
  ['AI answers quote sentences, not slogans.', 'Assistants build answers from pages they can read and lift short facts that stand on their own. “Kestrel fits 7 kW chargers across Nottingham from £850” can be quoted. “Powering your tomorrow” cannot.'],
  ['A fast page turns a visit into a call.', 'A lot of these searches happen on a phone, often in a hurry. A page that loads quickly with the number in reach gets the call that a slow one loses.'],
];

const TABS = [
  ['see', 'What a person sees'],
  ['read', 'What Google reads'],
  ['schema', 'What the schema says'],
  ['quote', 'What an AI quotes'],
];

const code = s => esc(s).replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="k">$1</span>$2');

const HEADCODE = `<title>Electrician in Nottingham | Kestrel Electrical</title>
<meta name="description" content="Faults, fuse boards, EV chargers and rewires across Nottingham. Fixed prices, emergency line answered 24 hours.">
<link rel="canonical" href="https://${KD}/">
<meta property="og:title" content="Kestrel Electrical, Nottingham">
<meta property="og:image" content="https://${KD}/share.png">

<h1>Electricians who pick up.</h1>
<h2>Every job is a circuit. Switch one on.</h2>
<h2>Do we cover you?</h2>`;

const SCHEMA = `{
  "@context": "https://schema.org",
  "@type": "Electrician",
  "name": "Kestrel Electrical",
  "url": "https://${KD}/",
  "telephone": "+44 115 496 0117",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Unit 9, Daleside Yard, Colwick",
    "addressLocality": "Nottingham",
    "postalCode": "NG4 2JX",
    "addressCountry": "GB"
  },
  "areaServed": ["Nottingham", "West Bridgford", "Beeston", "Arnold"],
  "openingHours": ["Mo-Fr 07:30-18:00", "Sa 08:00-13:00"],
  "makesOffer": {
    "@type": "Offer",
    "itemOffered": { "@type": "Service", "name": "EV charger installation" },
    "price": "850",
    "priceCurrency": "GBP"
  }
}`;

const layers = b => `<div class="sx-rig" data-sx>
      <div class="sx-tabs" role="tablist" aria-label="Four layers of one page">${TABS.map(([k, t], i) => `<button type="button" role="tab" id="sx-t-${k}" aria-controls="sx-p-${k}" aria-selected="${i ? 'false' : 'true'}"${i ? ' tabindex="-1"' : ''}><span>0${i + 1}</span>${esc(t)}</button>`).join('')}</div>
      <div class="sx-stage">
        <div class="sx-pane" role="tabpanel" id="sx-p-see" aria-labelledby="sx-t-see">
          <div class="sx-shot"><span class="sx-bar" aria-hidden="true"><i></i><i></i><i></i><span>${KD}</span></span><img src="${b}assets/screens/${pad(K.n)}-1200.webp" width="1200" height="750" alt="Kestrel Electrical's home page: the headline Electricians who pick up, the phone number and a photo of an electrician at a fuse board" loading="lazy" decoding="async"></div>
          <p class="sx-note">The page a customer sees: the headline, the number and the work. Good for people, but a search engine cannot see the photo or feel the design. It needs the layers underneath.</p>
        </div>
        <div class="sx-pane" role="tabpanel" id="sx-p-read" aria-labelledby="sx-t-read" hidden>
          <div class="sx-serp" aria-label="How the page could appear as a search result">
            <span class="sx-site"><i aria-hidden="true">K</i><span><b>Kestrel Electrical</b><small>https://${KD}</small></span></span>
            <span class="sx-title">Electrician in Nottingham | Kestrel Electrical</span>
            <span class="sx-desc">Faults, fuse boards, EV chargers and rewires across Nottingham. Fixed prices, emergency line answered 24 hours.</span>
          </div>
          <pre class="sx-code" tabindex="0"><code>${esc(HEADCODE)}</code></pre>
          <p class="sx-note">The title tag and meta description become the search result. The headings tell Google what each part of the page is about. None of it shows on screen.</p>
        </div>
        <div class="sx-pane" role="tabpanel" id="sx-p-schema" aria-labelledby="sx-t-schema" hidden>
          <pre class="sx-code" tabindex="0"><code>${code(SCHEMA)}</code></pre>
          <p class="sx-note">Structured data in the page’s code. It tells search engines and AI tools, in a shared vocabulary, that this is an electrician, where it is, when it is open, where it works and what a charger costs. Nothing has to be guessed from the design.</p>
        </div>
        <div class="sx-pane" role="tabpanel" id="sx-p-quote" aria-labelledby="sx-t-quote" hidden>
          <div class="sx-ai">
            <p class="sx-q">Who can fit an EV charger in West Bridgford, and what does it cost?</p>
            <div class="sx-a"><p>Kestrel Electrical, based in Colwick, fits 7 kW home chargers across Nottingham, including West Bridgford, from £850. They are an OZEV approved installer, and the price includes up to 10 m of cable and the charger’s own RCBO.</p><span class="sx-src">Source · ${KD}</span></div>
          </div>
          <div class="sx-pass"><small>The sentence on the page it came from</small><p>A 7 kW charger on the house or garage wall, on its own circuit. <mark>Charger fitted with up to 10 m of cable. Its own RCBO, with the earthing sorted. From £850. OZEV approved installer.</mark></p></div>
          <p class="sx-note">AI assistants answer from pages they can read and lift facts that stand on their own. Prices, areas and what is included, written as plain sentences, are what gets quoted.</p>
        </div>
      </div>
      <p class="sx-foot">Kestrel Electrical is a made-up business from <a class="lnk" href="${b}work/kestrel-electrical/">the work</a>. The example result and answer are illustrations, not screenshots of a real search.</p>
    </div>`;

module.exports = { FAQ, pages: [{
  url: '/seo/', og: 'seo', priority: 0.8, changefreq: 'monthly',
  meta: { key: 'seo', title: 'Found on Google. Quoted by AI.', kicker: 'SEO · GEO · schema · metadata', sub: 'What goes into every page so search engines and AI assistants can read it, and why it works.' },
  render(b){
    const title = `SEO, GEO and schema for service businesses | ${site.name}`;
    const description = 'How a Skales website gets found on Google and quoted by AI: metadata, schema, llms.txt, speed and local signals, what each one does and why it works.';
    const nodes = [
      L.webPage({ path: '/seo/', title, description }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services/' }, { name: 'SEO and GEO', path: '/seo/' }]),
      { '@type': 'Service', name: 'SEO, GEO and structured data for service business websites', serviceType: 'Search engine optimisation', provider: { '@id': L.ORG_ID }, areaServed: { '@type': 'Country', name: 'United Kingdom' },
        description: 'Every page built so search engines and AI assistants can read it: title tags, meta descriptions, headings, schema.org JSON-LD, canonical addresses, share cards, sitemaps, robots rules, llms.txt, IndexNow and fast pages on a phone.' },
      { '@type': 'HowTo', name: 'How a Skales website is set up to be found', step: CHECK.map(([n, t], i) => ({ '@type': 'HowToStep', position: i + 1, name: n, text: t })) },
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ];
    const body = `
${L.header(b, 'services')}
<main id="main" class="sx">
<section class="hero-w wrap sx-hero">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${b}">Home</a><span>/</span><a href="${b}services/">Services</a><span>/</span><span aria-current="page">SEO and GEO</span></nav>
  <div class="sx-hero-in">
    <div class="sx-hero-copy">
      <h1>Found on Google.<br><span class="off">Quoted by AI.</span></h1>
      <p class="lead">Every website ${esc(site.name)} builds is written so search engines and AI assistants can read it, trust it and send people to it. This page is what that means, why it works and exactly what goes into each page.</p>
      <div class="sx-ctas"><a class="btn btn-live btn-lg" href="${b}book/">Book a call</a><a class="btn btn-glass btn-lg" href="#layers">See it on a real page</a></div>
    </div>
    <div class="sx-vis" aria-hidden="true">
      <div class="sx-serp sx-v1"><span class="sx-site"><i>K</i><span><b>Kestrel Electrical</b><small>https://${KD}</small></span></span><span class="sx-title">Electrician in Nottingham | Kestrel Electrical</span><span class="sx-desc">Faults, fuse boards, EV chargers and rewires across Nottingham. Fixed prices, emergency line answered 24 hours.</span></div>
      <pre class="sx-code sx-v2"><code><span class="k">&quot;@type&quot;</span>: &quot;Electrician&quot;,
<span class="k">&quot;areaServed&quot;</span>: [&quot;Nottingham&quot;, &quot;Beeston&quot;],
<span class="k">&quot;openingHours&quot;</span>: &quot;Mo-Fr 07:30-18:00&quot;</code></pre>
      <div class="sx-a sx-v3"><p>Kestrel Electrical fits 7 kW home chargers across Nottingham from £850.</p><span class="sx-src">Source · ${KD}</span></div>
    </div>
  </div>
  <ul class="sx-three">
    <li><b>SEO</b><span>Showing up when someone searches Google for what you do and where.</span></li>
    <li><b>Local</b><span>The map results, run on your Business Profile, your reviews and consistent details.</span></li>
    <li><b>GEO</b><span>Being the business an AI assistant names when someone asks it instead.</span></li>
  </ul>
</section>

<section class="sx-sec" id="layers" aria-labelledby="h-layers">
  <div class="wrap">
    <div class="sx-head">
      <h2 id="h-layers">One page, four layers</h2>
      <p class="lead">A customer sees a design. Google and AI tools read what is underneath it. Here is a made-up electrician’s home page, layer by layer.</p>
    </div>
    ${layers(b)}
  </div>
</section>

<section class="sx-sec" aria-labelledby="h-why">
  <div class="wrap">
    <div class="sx-head"><h2 id="h-why">Why it works</h2></div>
    <ol class="sx-why">${WHY.map(([h, t]) => `<li><b>${esc(h)}</b><p>${esc(t)}</p></li>`).join('')}</ol>
  </div>
</section>

<section class="sx-sec" aria-labelledby="h-every">
  <div class="wrap">
    <div class="sx-head">
      <h2 id="h-every">What goes into every page</h2>
      <p class="lead">Twelve things, set up by hand and checked on every build. Most of them nobody sees, which is why most sites skip them.</p>
    </div>
    <ul class="sx-check">${CHECK.map(([n, t], i) => `<li><code>${TOK[i]}</code><b>${esc(n)}</b><span>${esc(t)}</span></li>`).join('')}</ul>
  </div>
</section>

<section class="sx-sec" aria-labelledby="h-split">
  <div class="wrap">
    <div class="sx-head"><h2 id="h-split">Who does what</h2></div>
    <div class="sx-split">
      <div><h3>${esc(site.name)} does</h3><ul>
        <li>A page for each service and each area you work in</li>
        <li>Titles, descriptions, headings and share cards for every page</li>
        <li>Schema for the business, its services, prices and questions</li>
        <li>Sitemap, robots rules, llms.txt and IndexNow on every publish</li>
        <li>Fast pages, sized photos and alt text</li>
        <li>A check of every page on every build, before anything goes live</li>
      </ul></div>
      <div><h3>You do</h3><ul>
        <li>Claim your Google Business Profile and keep the hours right</li>
        <li>Ask happy customers for reviews (the system asks after every finished job)</li>
        <li>Give access to Google Search Console and Bing Webmaster Tools, so we can see what people actually search</li>
        <li>Tell us when prices, areas or hours change</li>
      </ul></div>
    </div>
    <p class="sx-proof">This site runs the same way: every page is checked when it is built, every publish pings IndexNow, it has its own <a class="lnk" href="${b}llms.txt">llms.txt</a> and <a class="lnk" href="${b}sitemap.xml">sitemap</a>, and a weekly job drafts new pages for the trades people search for.</p>
  </div>
</section>

<section class="sx-sec sx-honest" aria-labelledby="h-honest">
  <div class="wrap">
    <h2 id="h-honest">The honest bit</h2>
    <div class="sx-honest-in">
      <p class="lead">Nobody can promise first place on Google. Anyone who guarantees a ranking is guessing, or buying links, which can get a site penalised. New pages usually take weeks to months to settle.</p>
      <p class="lead">What can be promised: every page built so search engines and AI tools can read it, nothing bought or faked, and a straight answer on what is working.</p>
    </div>
  </div>
</section>

<section class="sx-sec" aria-labelledby="h-own">
  <div class="wrap">
    <div class="sx-head">
      <h2 id="h-own">Do not take our word for it</h2>
      <p class="lead">This page carries its own schema, the same way a client site would. Here it is, read straight out of the page you are on.</p>
    </div>
    <button type="button" class="btn btn-glass" data-sx-own aria-expanded="false" aria-controls="sx-own">Show this page’s schema</button>
    <pre class="sx-code sx-own" id="sx-own" tabindex="0" hidden><code></code></pre>
  </div>
</section>

<section class="sx-sec" aria-labelledby="h-faq">
  <div class="wrap">
    <div class="sx-head"><h2 id="h-faq">Questions, answered</h2></div>
    <div class="sx-faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>
</main>
${L.ctaBand(b, 'Want to be the one they find?', 'A free 45-minute call: where you show up now, what people search for in your area, and what to build first.', `<a class="btn btn-ghost" href="${b}work/">See the work</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/seo/', title, description, og: 'seo', css: ['seo.css'], nodes }), body, L.scripts(b, ['seo.js']));
  }
}] };
