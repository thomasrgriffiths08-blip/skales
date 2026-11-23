/* /ai/ : the AI work in one place. The first screen is the voice agent itself: three recorded example calls a visitor
   can play, each with one question they answer as the caller (tools/voice/). Then how an agent is set up, what it
   will not do, the two other AI demos (the receptionist by text and the AI team), and the calls as plain text.
   Every business is made up and the page says so; the calls are recordings, not a live agent, and the page says that too. */
const L = require('../lib.js');
const V = require('../voice/embed.js');
const { site, esc } = L;

const SETUP = [
  ['Your diary.', 'It offers only the times that are really free, and the booking goes straight in.'],
  ['Your prices.', 'It quotes from your price list. If a job is not on it, it says so and does not guess.'],
  ['Your rules.', 'The safety question you always ask, your deposit, your cancellation terms. It follows them on every call.'],
  ['You, when it matters.', 'Anything urgent or unusual goes to your phone with the details. Every call leaves you a summary.'],
];
const NEVER = [
  ['Pretend to be a person', 'It says it is an AI in its first sentence, on every call. Listen for it in the three calls above.'],
  ['Make up a price', 'In the garage call it is asked what a brake repair will cost. It will not guess, and offers a call back from the mechanic.'],
  ['Carry on when it should stop', 'In the heating call, answer yes to the gas question. The booking stops, the caller gets the emergency number and the owner’s phone rings.'],
];
const FAQ = [
  ['Are the calls on this page real?', 'No. They are recorded examples: scripts written for made-up businesses and spoken by two AI voices, so you can hear how a call goes and what the assistant does during it. An agent for your business is set up on your own diary, price list and rules.'],
  ['Will my callers know it is an AI?', 'Yes. It says so in its first sentence. Nobody is tricked into thinking they are talking to a person.'],
  ['What happens when it cannot answer something?', 'It says so, takes the details, tells the caller who will ring them back, and sends you the note. It does not guess at prices or advice.'],
  ['Does it replace the person who answers my phone?', 'It covers the calls nobody can take: when you are on a job, with a customer, or closed for the night. Anything it should not handle is passed to a person with the details.'],
  ['What does an AI phone agent cost?', 'A flat price for the build, agreed on a call before anything starts. Book a call and you will get a straight answer for your business.'],
];

const shot = (b, name, alt) => `<picture><source media="(max-width: 640px)" srcset="${b}assets/work/${name}-phone.webp" width="600" height="1076"><img src="${b}assets/work/${name}-1440.webp" srcset="${b}assets/work/${name}-800.webp 800w, ${b}assets/work/${name}-1440.webp 1440w" sizes="(min-width: 1000px) 580px, 92vw" width="1440" height="852" alt="${esc(alt)}" loading="lazy" decoding="async"></picture>`;
const MORE = [
  { href: 'demos/ai-receptionist/', bar: 'The AI receptionist · Larchfield Heating', img: 'ai-receptionist', alt: 'The AI receptionist demo: a late-night text conversation that ends with a boiler repair booked in the diary',
    h: 'The AI receptionist, by text', p: 'The same night at Larchfield Heating, but the customer messages instead of ringing. Watch it reply, check the diary and book the job, then tap through it yourself.', go: 'Open the AI receptionist' },
  { href: 'demos/ai-team/', bar: 'The AI team · Kingpost', img: 'ai-team', alt: 'The AI team demo: ten AI employees for a made-up building firm, with the hours each one saves',
    h: 'The AI team', p: 'Ten AI employees running the office of a made-up Bristol building firm, from invoices to the vans. Walk the floor, open each one and see the hours it gives back.', go: 'Open the AI team' },
];

module.exports = { FAQ, pages: [{
  url: '/ai/', og: 'ai', priority: 0.9, changefreq: 'monthly',
  meta: { key: 'ai', title: 'Your phone, answered by AI', kicker: 'AI voice agents · AI receptionist · AI team', sub: 'Hear an AI agent take a call, book the job and hand over when it should.' },
  render(b){
    const title = `AI phone agents and receptionists for UK trades | ${site.name}`;
    const description = 'Hear an AI voice agent answer the phone for a UK service business. It books from the diary, quotes from the price list and hands over when it should.';
    const nodes = [
      L.webPage({ path: '/ai/', title, description }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'AI', path: '/ai/' }]),
      { '@type': 'Service', name: 'AI phone agents and AI receptionists for service businesses', serviceType: 'AI voice agent', provider: { '@id': L.ORG_ID }, areaServed: { '@type': 'Country', name: 'United Kingdom' },
        description: 'An AI assistant that answers the phone or replies by text for a service business, set up on its diary, price list and rules: it books jobs, sends confirmations and hands over to a person when it should.' },
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ];
    const body = `
${L.header(b, 'ai')}
<script>document.querySelector('.site-head').classList.add('on-dark')</script>
<main id="main" class="home ai">
<section class="hx ai-hero" aria-labelledby="h-top">
  <div class="wrap">
    <div class="hx-top">
      <h1 id="h-top">Your phone, answered by AI</h1>
      <div class="hx-side">
        <p class="hx-sub"><strong>It picks up on the first ring, at any hour.</strong> It books from your real diary and price list, follows your rules, and hands over to you when it should.</p>
        <p class="ai-cue">Ring one of the three businesses below and listen. Each call takes under a minute.</p>
      </div>
    </div>
    ${V.stage(b)}
  </div>
</section>
<section class="hs" aria-labelledby="h-setup">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">How it is set up</p>
      <h2 id="h-setup">Built on your business, not a script</h2>
      <p class="lead">Before it takes a call it is given your diary, your price list and the rules you work by. That is how it can book the job, and how it knows when to stop.</p>
    </div>
    <ul class="four">${SETUP.map(([h, t]) => `<li><b>${esc(h)}</b><span>${esc(t)}</span></li>`).join('')}</ul>
  </div>
</section>
<section class="hs" aria-labelledby="h-never">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">Where it stops</p>
      <h2 id="h-never">Three things it will never do</h2>
    </div>
    <ol class="ai-never">${NEVER.map(([h, t], i) => `<li><span class="n">${L.pad(i + 1)}</span><b>${esc(h)}</b><span>${esc(t)}</span></li>`).join('')}</ol>
  </div>
</section>
<section class="hs" id="more" aria-labelledby="h-more">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">More AI, running live</p>
      <h2 id="h-more">Two more to open and use</h2>
      <p class="lead">Both run in your browser, on a phone or a laptop, with nothing to install or sign up for.</p>
    </div>
    <div class="ai-more">${MORE.map(x => `<article class="ai-card">
      <a class="sys-shot" href="${b}${x.href}">
        <span class="chrome" aria-hidden="true"><i></i><i></i><i></i><span>${esc(x.bar)}</span></span>
        ${shot(b, x.img, x.alt)}
      </a>
      <h3>${esc(x.h)}</h3>
      <p>${esc(x.p)}</p>
      <div class="ai-foot"><a class="btn btn-glass" href="${b}${x.href}">${esc(x.go)}</a><span>Fictional business · illustrative numbers</span></div>
    </article>`).join('')}</div>
  </div>
</section>
<section class="hs" aria-labelledby="h-faq">
  <div class="wrap ai-split">
    <div class="hs-head">
      <p class="kick">Straight answers</p>
      <h2 id="h-faq">What people ask first</h2>
    </div>
    <div>${FAQ.map(([q, a]) => `<details class="vc-tx"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>
<section class="hs" aria-labelledby="h-text">
  <div class="wrap ai-split">
    <div class="hs-head">
      <p class="kick">No sound where you are?</p>
      <h2 id="h-text">The three calls, written out</h2>
      <p class="lead">Every word of each call, with both ways it can end.</p>
    </div>
    <div>${V.transcripts()}</div>
  </div>
</section>
<section class="hs ai-book" aria-labelledby="h-book">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">Book</p>
      <h2 id="h-book">Want one answering your phone?</h2>
      <p class="lead">A free 45 minute call on the calls you are missing now and what an AI agent would take off your hands. The person on the call is the person who builds it.</p>
    </div>
    <div class="hs-ctas"><a class="btn btn-live btn-lg" href="${b}book/">Book a call</a><a class="tlink" href="${b}try/missed-call/">Try the missed call demo <span aria-hidden="true">→</span></a></div>
  </div>
</section>
</main>
${L.footer(b, { mbar: false, dark: true })}`;
    return L.page(L.head({ b, path: '/ai/', title, description, og: 'ai', css: ['home.css', V.css, 'ai.css'], nodes, palette: L.BRAND, theme: '#0A0B0D', dark: false }), body,
      L.scripts(b, [V.js]));
  }
}]};
