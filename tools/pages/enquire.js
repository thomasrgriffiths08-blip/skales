/* /enquire/ — the full enquiry form, for people who already want to work with Skales. One question a
   screen, like /start/, but it asks what a proper first call needs: the business, how far along it is,
   roughly what it turns over, what needs doing, how soon, the budget (from £1.5k), and how to reach them.
   Send delivers the enquiry to Tom; booking a call afterwards is offered but optional (Tom, 16 Nov 2026).
   With site.formKey set, Send emails the whole form through Web3Forms; without it, the last screen asks
   them to send it on WhatsApp. Either way, a booked call carries every answer in the Calendly note.
   The logic lives in assets/enquire.js; the look is assets/start.css plus assets/enquire.css. */
const L = require('../lib.js');
const { site, esc } = L;
const { QS: START } = require('./start.js');

const I = p => `<svg class="sf-i" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  video: I('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>'),
  chat: I('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z"/>'),
};
/* the services list is the same one the Instagram form uses, without "Something else": the notes box covers it */
const needQ = START.find(x => x.key === 'need');

const QS = [
  { key: 'stage', h: 'Where is the business right now?', sub: 'Single choice', opts: [
    { v: 'idea', t: 'Not started yet, it’s an idea' }, { v: 'new', t: 'New, open less than a year' },
    { v: 'growing', t: 'Trading for one to three years' }, { v: 'established', t: 'Established, over three years' }] },
  { key: 'revenue', h: 'Roughly what does it turn over a year?', sub: 'A rough figure is fine. It helps me suggest the right size of project.', opts: [
    { v: 'none', t: 'Not trading yet' }, { v: 'u50', t: 'Under £50k' }, { v: '50-100', t: '£50k to £100k' }, { v: '100-250', t: '£100k to £250k' },
    { v: '250-1m', t: '£250k to £1m' }, { v: '1m', t: 'Over £1m' }, { v: 'private', t: 'I’d rather not say' }] },
  { key: 'need', h: 'What do you need done?', sub: 'Select all that apply', multi: true, opts: needQ.opts.filter(o => o.v !== 'other') },
  { key: 'when', h: 'When do you want to get started?', sub: 'Single choice', opts: [
    { v: 'asap', t: 'As soon as possible' }, { v: 'month', t: 'Within a month' }, { v: 'quarter', t: 'In the next one to three months' }, { v: 'exploring', t: 'Just exploring for now' }] },
];
/* pounds. The floor is Tom's: nothing under £1.5k (16 Nov 2026). Not a quoted price. */
const BUDGET = { min: 1500, max: 15000, step: 500, start: 5000 };

/* same icons as the Instagram form, so the two forms look like one family */
const startSrc = require('fs').readFileSync(require('path').join(__dirname, 'start.js'), 'utf8');
const icon = name => { const m = startSrc.match(new RegExp(`\\b${name}: I\\('([^']+)'\\)`)); return m ? I(m[1]) : ''; };

module.exports = { pages: [{
  url: '/enquire/', og: 'enquire', noindex: true, sitemap: false,
  meta: { key: 'enquire', title: 'Start a project.', kicker: 'Skales Studio · enquiry form', sub: 'Tell me about your business and what you need. Booking a call is optional.' },
  render(b){
    const title = `Start a project | ${site.name}`;
    const description = `Tell me about your business, what you need and your budget. Tom replies to every enquiry, and you can book a free call if you want one.`;
    const nodes = [L.webPage({ path: '/enquire/', title, description })];
    const q = x => `<section class="sf-s" data-s="${x.key}" hidden>
      <h2 tabindex="-1">${esc(x.h)}</h2><p class="sf-sub">${esc(x.sub)}</p>
      <div class="sf-opts" role="group" aria-label="${esc(x.h)}">${x.opts.map(o => `<button type="button" class="sf-o" data-k="${x.key}" data-v="${esc(o.v)}"${x.multi ? ' data-multi' : ''} aria-pressed="false">${o.i ? icon(o.i) : ''}<span>${esc(o.t)}</span></button>`).join('')}</div>
      ${x.key === 'need' ? `<label class="sf-f eq-notes"><span>Anything else I should know? <em>Optional</em></span><textarea id="fNotes" rows="3" maxlength="1200" placeholder="What isn’t working now, or what a good result would look like"></textarea></label>` : ''}
    </section>`;
    const body = `
<a class="skip" href="#main">Skip to content</a>
<header class="sf-top">
  <div class="sf-row"><a class="wordmark" href="${b}" aria-label="${esc(site.name)}, home">${esc(site.wordmark.a)}<i>${esc(site.wordmark.x)}</i>${esc(site.wordmark.b)}</a><span class="sf-count" id="count" aria-live="polite">1 / 7</span></div>
  <div class="sf-prog" aria-hidden="true"><i id="prog"></i></div>
</header>
<main id="main" class="sf">
  <form id="eq" novalidate>
    <section class="sf-s" data-s="biz">
      <h1 tabindex="-1">Tell me about your business.</h1><p class="sf-sub">Seven quick steps. At the end you can book a free call with Tom if you want one.</p>
      <label class="sf-f"><span>Business name</span><input type="text" id="fBiz" autocomplete="organization" maxlength="120" placeholder="e.g. Hartley Plumbing" required></label>
      <label class="sf-f"><span>What does it do?</span><input type="text" id="fWhat" maxlength="160" placeholder="e.g. plumbing and heating, a hair salon" required></label>
      <label class="sf-f"><span>Where is it based? <em>Optional</em></span><input type="text" id="fTown" autocomplete="address-level2" maxlength="80" placeholder="Town or area"></label>
      <label class="sf-f"><span>Current website <em>Optional</em></span><input type="text" id="fSite" inputmode="url" autocomplete="url" maxlength="200" placeholder="yourbusiness.co.uk, or leave blank"></label>
    </section>
    ${QS.map(q).join('')}
    <section class="sf-s" data-s="budget" hidden>
      <h2 tabindex="-1">What budget are you working with?</h2><p class="sf-sub">For the whole project. Drag to your budget.</p>
      <output class="sf-money" id="money" for="budget">&pound;5k</output>
      <input class="sf-range" type="range" id="budget" min="${BUDGET.min}" max="${BUDGET.max}" step="${BUDGET.step}" value="${BUDGET.start}" aria-label="Your budget in pounds">
      <div class="sf-ends"><span>&pound;1.5k</span><span>&pound;15k+</span></div>
    </section>
    <section class="sf-s" data-s="contact" hidden>
      <h2 tabindex="-1">Where can I reach you?</h2><p class="sf-sub">Last step. I reply to every enquiry myself.</p>
      <label class="sf-f"><span>Your name</span><input type="text" id="fName" autocomplete="name" maxlength="80" placeholder="Your name" required></label>
      <label class="sf-f"><span>Email</span><input type="email" id="fMail" autocomplete="email" inputmode="email" maxlength="120" placeholder="you@yourbusiness.co.uk" required></label>
      <label class="sf-f"><span>Mobile or WhatsApp</span><input type="tel" id="fTel" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="07700 900123" required></label>
      <input type="checkbox" id="fBot" name="botcheck" class="eq-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="sf-err" id="err" hidden role="alert"></p>
    </section>
    <section class="sf-s sf-book" data-s="done" hidden>
      <h2 tabindex="-1" id="doneH">Thanks. Your enquiry is with Tom.</h2>
      <p class="sf-sub" id="doneSub">I reply to every enquiry myself, by email or WhatsApp.</p>
      <div class="eq-wa" id="waRow" hidden>
        <button type="button" class="btn btn-live" id="waBtn">${IC.chat}<span>Send it on WhatsApp</span></button>
        <a class="lnk" id="mailLnk" href="mailto:${esc(site.email)}">Or email it instead</a>
      </div>
      <div class="eq-call" id="callBox">
        <h3>Want to talk it through? <em>Optional</em></h3>
        <p>A free 45-minute call with Tom. Your answers come with the booking, and times show in your own time zone.</p>
        <button type="button" class="btn btn-ghost" id="callBtn">${IC.video}<span>Pick a time</span></button>
        <div id="cal" class="sf-cal" hidden><p class="sf-wait">Loading the calendar&hellip;</p></div>
        <div id="calNone" class="sf-none" hidden><p>The calendar did not load here. Message Tom on WhatsApp and you will get times back.</p></div>
        <p class="sf-done" id="done" hidden role="status"></p>
      </div>
    </section>
  </form>
  <noscript><p class="sf-sub">This form needs JavaScript. You can <a class="lnk" href="${b}book/">book a call here</a> instead, or email <a class="lnk" href="mailto:${esc(site.email)}">${esc(site.email)}</a>.</p></noscript>
</main>
<div class="sf-bar" id="bar"><button type="button" class="btn btn-ghost" id="back" hidden>Back</button><button type="button" class="btn btn-live" id="next" disabled>Continue</button></div>
<script>window.EQQS=${JSON.stringify(QS.map(x => ({ key: x.key, multi: !!x.multi, opts: x.opts.map(o => ({ v: o.v, t: o.t })) })))};window.EQBUDGET=${JSON.stringify(BUDGET)};window.EQKEY=${JSON.stringify(site.formKey || '')};</script>`;
    return L.page(L.head({ b, path: '/enquire/', title, description, og: 'enquire', nodes, noindex: true, css: ['start.css', 'enquire.css'], dark: false, preconnect: site.calendly ? ['https://assets.calendly.com', 'https://calendly.com'] : [] }), body, L.scripts(b, ['enquire.js']));
  }
}]};
