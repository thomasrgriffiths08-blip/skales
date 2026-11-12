/* /start/ — where the Instagram bio link and the ads land. One question a screen, like a good intake
   form: what they need, their goal, how soon, a budget, then a choice: book a call on the page or send
   a request. The answers ride into the booking (Calendly's first question) or the request, so the
   conversation starts on their business. noindex: a landing page, not a search page.
   The logic lives in assets/start.js. */
const L = require('../lib.js');
const { site, esc } = L;

const I = p => `<svg class="sf-i" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18"/>'),
  redo: I('<path d="M20 11a8 8 0 0 0-14.3-4L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4L20 15"/><path d="M20 20v-5h-5"/>'),
  cal: I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  phone: I('<path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z"/>'),
  star: I('<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8Z"/>'),
  ads: I('<path d="M4 10v4h3l6 4V6l-6 4Z"/><path d="M17 9a4 4 0 0 1 0 6"/>'),
  up: I('<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  badge: I('<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  bolt: I('<path d="M13 3 5 13h6l-1 8 8-10h-6Z"/>'),
  spark: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>'),
  crm: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>'),
  compass: I('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>'),
  video: I('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>'),
  chat: I('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z"/>'),
};

const QS = [
  { key: 'need', h: 'What do you need help with?', sub: 'Select all that apply', multi: true, other: 'What else do you need?', opts: [
    { v: 'ai', t: 'AI employees for my business', i: 'spark' }, { v: 'crm', t: 'A CRM built for my business', i: 'crm' },
    { v: 'website', t: 'Build a new website', i: 'globe' }, { v: 'redo', t: 'Redo my website', i: 'redo' },
    { v: 'booking', t: 'Online booking and a diary', i: 'cal' }, { v: 'followup', t: 'Automated follow-up and reviews', i: 'star' },
    { v: 'ads', t: 'Ads on Google or Instagram', i: 'ads' }, { v: 'other', t: 'Something else' }] },
  { key: 'goal', h: "What's your main goal?", sub: 'Select all that apply', multi: true, opts: [
    { v: 'customers', t: 'Get more customers', i: 'up' }, { v: 'automate', t: 'Automate the work with AI', i: 'spark' },
    { v: 'organise', t: 'Get every customer and job in one place', i: 'crm' }, { v: 'found', t: 'Get found on Google and AI', i: 'search' },
    { v: 'pro', t: 'Look professional online', i: 'badge' }, { v: 'admin', t: 'Spend less time on admin', i: 'clock' }, { v: 'unsure', t: 'Something else / not sure' }] },
  { key: 'when', h: 'When are you looking to get started?', sub: 'Single choice', opts: [
    { v: 'asap', t: 'ASAP', i: 'bolt' }, { v: 'week', t: 'Within the next week' }, { v: 'month', t: 'Within the next month' }, { v: 'exploring', t: 'Just exploring for now', i: 'compass' }] },
];
/* the budget slider: pounds. Tom's to set; nothing here is a quoted price. */
const BUDGET = { min: 3500, max: 15000, step: 500, start: 5000, bands: ['£750 - 1.5k', '£1.5k - 3.5k'] };
const STEPS = QS.length + 3;   // + budget, how to continue, then the calendar or the contact details

module.exports = { QS, pages: [{
  url: '/start/', og: 'start', noindex: true, sitemap: false,
  meta: { key: 'start', title: 'Tell me what you need.', kicker: 'Skales Studio · a few taps, then book a call', sub: 'Answer a few quick questions, then book a call with Tom or send a request.' },
  render(b){
    const title = `Start here | ${site.name}`;
    const description = `A few quick questions about what you need, then book a free call with Tom on the same page or send a request.`;
    const nodes = [L.webPage({ path: '/start/', title, description })];
    const q = (x, i) => `<section class="sf-s" data-s="${x.key}"${i ? ' hidden' : ''}>
      <${i ? 'h2' : 'h1'} tabindex="-1">${esc(x.h)}</${i ? 'h2' : 'h1'}><p class="sf-sub">${esc(x.sub)}</p>
      <div class="sf-opts" role="group" aria-label="${esc(x.h)}">${x.opts.map(o => `<button type="button" class="sf-o" data-k="${x.key}" data-v="${esc(o.v)}"${x.multi ? ' data-multi' : ''} aria-pressed="false">${o.i ? IC[o.i] : ''}<span>${esc(o.t)}</span></button>`).join('')}</div>
      ${x.other ? `<label class="sf-other" id="otherBox" hidden><span>${esc(x.other)}</span><input type="text" id="other" maxlength="120" autocomplete="off" placeholder="Type it here"></label>` : ''}
    </section>`;
    const body = `
<a class="skip" href="#main">Skip to content</a>
<header class="sf-top">
  <div class="sf-row"><a class="wordmark" href="${b}" aria-label="${esc(site.name)}, home">${esc(site.wordmark.a)}<i>${esc(site.wordmark.x)}</i>${esc(site.wordmark.b)}</a><span class="sf-count" id="count" aria-live="polite">1 / ${STEPS}</span></div>
  <div class="sf-prog" aria-hidden="true"><i id="prog"></i></div>
</header>
<main id="main" class="sf">
  <form id="sf" novalidate>
    ${QS.map(q).join('')}
    <section class="sf-s" data-s="budget" hidden>
      <h2 tabindex="-1">What budget are you working with?</h2><p class="sf-sub">Drag to your budget</p>
      <output class="sf-money" id="money" for="budget">&pound;5k</output>
      <input class="sf-range" type="range" id="budget" min="${BUDGET.min}" max="${BUDGET.max}" step="${BUDGET.step}" value="${BUDGET.start}" aria-label="Your budget in pounds">
      <div class="sf-ends"><span>&pound;3.5k</span><span>&pound;15k+</span></div>
      <button type="button" class="sf-o sf-else" id="elseBtn" aria-expanded="false" aria-controls="bands"><span>Something else</span><svg class="sf-chev" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="sf-bands" id="bands" hidden>${BUDGET.bands.map(t => `<button type="button" class="sf-o sf-band" data-band="${esc(t)}" aria-pressed="false"><span>${esc(t)}</span></button>`).join('')}</div>
    </section>
    <section class="sf-s" data-s="how" hidden>
      <h2 tabindex="-1">How would you like to continue?</h2>
      <div class="sf-cards">
        <button type="button" class="sf-card is-main" data-path="book">${IC.video}<b>Book a call</b><span>Free, 45 minutes, with Tom</span></button>
        <button type="button" class="sf-card" data-path="reach">${IC.chat}<b>Send a request</b><span>I reply personally</span></button>
      </div>
    </section>
    <section class="sf-s sf-book" data-s="book" hidden>
      <button type="button" class="sf-backlink" data-back>&larr; Back</button>
      <h2 tabindex="-1">Pick a day</h2><p class="sf-sub">A free 45-minute call with Tom. Times are shown in your own time zone.</p>
      <div id="cal" class="sf-cal"><p class="sf-wait">Loading the calendar&hellip;</p></div>
      <div id="calNone" class="sf-none" hidden><p>The calendar did not load here. Send a request instead and you will get times back.</p><button type="button" class="btn btn-live" data-path="reach">Send a request</button></div>
      <p class="sf-done" id="done" hidden role="status"></p>
    </section>
    <section class="sf-s" data-s="reach" hidden>
      <h2 tabindex="-1">Where can I reach you?</h2><p class="sf-sub">That's everything. I will get back to you personally about your project.</p>
      <label class="sf-f"><span>Name</span><input type="text" id="fName" autocomplete="name" placeholder="Your name" required></label>
      <label class="sf-f"><span>WhatsApp number</span><input type="tel" id="fTel" autocomplete="tel" inputmode="tel" placeholder="07700 900123" required></label>
      <label class="sf-f"><span>Email</span><input type="email" id="fMail" autocomplete="email" inputmode="email" placeholder="you@yourbusiness.co.uk" required></label>
      <p class="sf-err" id="err" hidden role="alert"></p>
    </section>
    <section class="sf-s" data-s="sent" hidden>
      <h2 tabindex="-1">One last tap.</h2>
      <p class="sf-sub" id="sentMsg">Your email app has opened with your request written out. Press send and it is with me.</p>
      <p class="sf-sub">Nothing opened? Email <a class="lnk" id="sentMail" href="mailto:${esc(site.email)}">${esc(site.email)}</a> or message <a class="lnk" href="${site.instagram}" target="_blank" rel="noopener">${esc(site.instagramHandle)}</a>.</p>
      <p class="sf-after"><a class="btn btn-ghost" href="${b}work/">See the work while you wait</a></p>
    </section>
  </form>
  <noscript><p class="sf-sub">This page needs JavaScript for the questions. You can <a class="lnk" href="${b}book/">book a call here</a> instead.</p></noscript>
</main>
<div class="sf-bar" id="bar"><button type="button" class="btn btn-ghost" id="back" hidden>Back</button><button type="button" class="btn btn-live" id="next" disabled>Continue</button></div>
<script>window.STARTQS=${JSON.stringify(QS.map(x => ({ key: x.key, multi: !!x.multi, opts: x.opts.map(o => ({ v: o.v, t: o.t })) })))};window.STARTBUDGET=${JSON.stringify(BUDGET)};</script>`;
    return L.page(L.head({ b, path: '/start/', title, description, og: 'start', nodes, noindex: true, css: ['start.css'], dark: false, preconnect: site.calendly ? ['https://assets.calendly.com', 'https://calendly.com'] : [] }), body, L.scripts(b, ['start.js']));
  }
}]};
