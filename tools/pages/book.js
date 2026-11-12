const L = require('../lib.js');
const { site, esc } = L;
/* a draft from the home-page builder arrives as ?d=SK-XXXX&t=<trade>&n=<name>&w=<town>.
   Each trade maps to its label (for Tom's note) and the closest kind chip on step one. */
const KIND = { heating: 'Plumbing & heating', electrical: 'Electrical', roofing: 'Roofing', building: 'Building & joinery', kitchens: 'Kitchens & bathrooms', garden: 'Landscaping & fencing', cleaning: 'Cleaning', salon: 'Salon & beauty' };
const DRAFT_TRADES = Object.fromEntries(require('../../data/trades.js').filter(t => t.builder !== false).map(t => [t.key, [t.label, KIND[t.key] || 'Another service business']]));
module.exports = { pages: [{
  url: '/book/', og: 'book', priority: 0.9, changefreq: 'monthly',
  meta: { key: 'book', title: 'Book a call', kicker: 'Free · 45 minutes · with Tom', sub: 'Pick a time. No forms, no pitch, no proposal deck.' },
  render(b){
    const title = `Book a free 45-minute call | ${site.name}`;
    const description = `Pick a time for a free 45-minute call with Tom, who builds every website and system. The calendar is on the page: no forms first. For UK service businesses.`;
    const nodes = [
      L.webPage({ path: '/book/', title, description, type: 'ContactPage', extra: { potentialAction: { '@type': 'ReserveAction', name: 'Book a call', target: L.abs('/book/') } } }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Book a call', path: '/book/' }]),
    ];
    const body = `
${L.header(b, 'book')}
<main id="main">
<section class="wrap bk">
  <div class="bk-copy">
    <h1>Pick a time.</h1>
    <p class="lead">A free 45-minute call with me, Tom. I build every website and system myself, so you talk to the person who does the work.</p>
    <ul class="bk-list">
      <li>What is losing you jobs now, and what to fix first.</li>
      <li>A flat price, agreed before anything starts.</li>
      <li>If it is not a fit, you will hear that on the call.</li>
    </ul>
    <p class="bk-alt">${site.whatsapp ? `<a class="lnk" data-wa="Hi Tom, found you through your site." href="${L.waHref('Hi Tom, found you through your site.')}">Message on WhatsApp</a> &middot; ` : ''}<a class="lnk" href="${b}teardown.html">Get a free teardown by message</a> &middot; <a class="lnk" href="mailto:${esc(site.email)}">Email</a></p>
  </div>
  <div class="bk-cal" id="book" data-trades="${esc(JSON.stringify(DRAFT_TRADES))}">
    <div id="calendly" class="calendly" aria-live="polite"><p class="bk-wait">Loading the calendar&hellip;</p></div>
    <div id="fallback" class="fallback" hidden>
      <p class="lead">The calendar did not load here. Send a message and you will get a reply with times to choose from.</p>
      <div class="cta-row">${site.whatsapp ? `<a class="btn btn-live" id="fbWa" href="${L.waHref('Hi Tom, I would like to book a call.')}">Send on WhatsApp</a>` : ''}<a class="btn btn-ghost" id="fbMail" href="mailto:${esc(site.email)}?subject=${encodeURIComponent('Call request')}">Send by email</a></div>
    </div>
  </div>
</section>
</main>
${L.footer(b, { mbar: false })}`;
    return L.page(L.head({ b, path: '/book/', title, description, og: 'book', nodes, preconnect: /calendly\.com/.test(site.calendly || '') ? ['https://assets.calendly.com', 'https://calendly.com'] : [] }), body, L.scripts(b, ['book.js']));
  }
}]};
