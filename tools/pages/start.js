/* /start/ — where the Instagram bio link and the ads land. Three taps, then the call booked on the
   same page: what they do, what they want help with, how soon. The answers ride into the booking
   (Calendly's first question), so the call starts on their business, not on small talk. "Just book
   a call" skips the taps. Nothing is typed until the booking itself. noindex: a landing page, not a
   search page. The logic lives in assets/start.js. */
const L = require('../lib.js');
const { site, esc } = L;
const { KINDS } = require('./case.js');

/* `sys` = the business the system demo opens on for that trade (demos/kit/data.js keys) */
const SYS = { heating: 'heating', kitchens: 'heating', building: 'heating', roofing: 'heating', handyman: 'heating', garden: 'cleaning', electrical: 'electrical', garage: 'garage', salon: 'salon', cleaning: 'cleaning', clinic: 'clinic', professional: 'clinic', hospitality: 'salon', other: 'heating' };

const QS = [
  { key: 'kind', h: 'What do you do?', grid: true, opts: KINDS.map(k => ({ v: k.key, t: k.label, sys: SYS[k.key] || 'heating' })) },
  { key: 'need', h: 'What do you want help with?', sub: 'Pick as many as you like.', multi: true, opts: [
    { v: 'website', t: 'A website that brings in work' }, { v: 'missed', t: 'Catching calls I miss' }, { v: 'booking', t: 'Online booking and deposits' },
    { v: 'reviews', t: 'More Google reviews' }, { v: 'ads', t: 'Ads on Google or Instagram' }, { v: 'unsure', t: 'Not sure yet' }] },
  { key: 'when', h: 'When do you want it sorted?', opts: [
    { v: 'now', t: 'As soon as possible' }, { v: 'months', t: 'In the next few months' }, { v: 'looking', t: 'Just looking for now' }] },
];

module.exports = { QS, pages: [{
  url: '/start/', og: 'start', noindex: true, sitemap: false,
  meta: { key: 'start', title: 'Book a free 30-minute call.', kicker: 'Skales Studio · three taps, then pick a time', sub: 'Tell me what you do, then book a call with Tom on the same page.' },
  render(b){
    const title = `Book a free call | ${site.name}`;
    const description = `Three taps so Tom knows your business, then pick a time for a free 30-minute call about your website, missed calls, booking, reviews or ads.`;
    const nodes = [L.webPage({ path: '/start/', title, description })];
    const wa = String(site.whatsapp || '').replace(/\D/g, '');
    const tick = '<svg class="sq-tick" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const q = (x, i) => `<fieldset class="sq" data-q="${i}"${i ? ' hidden' : ''}>
      <legend><span class="sq-n">${i + 1} of ${QS.length}</span><h2 tabindex="-1">${esc(x.h)}</h2>${x.sub ? `<p class="sq-sub">${esc(x.sub)}</p>` : ''}</legend>
      <div class="sq-opts${x.grid ? ' sq-grid' : ''}">${x.opts.map(o => `<button type="button" class="sq-o" data-k="${x.key}" data-v="${esc(o.v)}"${x.multi ? ' data-multi' : ''} aria-pressed="false">${x.multi ? tick : ''}<span>${esc(o.t)}</span></button>`).join('')}</div>
      ${x.multi ? '<div class="sq-next"><button class="btn btn-live" type="button" data-next disabled>Next</button></div>' : ''}
    </fieldset>`;
    const body = `
<a class="skip" href="#main">Skip to content</a>
<header class="st-bar">
  <a class="wordmark" href="${b}" aria-label="${esc(site.name)} — home">${esc(site.wordmark.a)}<i>${esc(site.wordmark.x)}</i>${esc(site.wordmark.b)}</a>
  <div class="st-bar-r">
    ${wa ? `<a class="st-wa" data-track="whatsapp_click" href="${L.waHref('Hi Tom — found you through your bio link.')}" aria-label="Message Tom on WhatsApp"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg><span>WhatsApp</span></a>` : ''}
    <a class="st-work" href="${b}work/">See the work</a>
  </div>
</header>
<main id="main" class="st">
  <section class="st-check" id="check" aria-live="polite">
    <div class="st-head" id="intro">
      <p class="st-kick"><span class="lamp"></span>Free · 30 minutes · with Tom, who builds it</p>
      <h1>Book a call in three taps.</h1>
      <p class="st-sub">Tell me what you do, then pick a time that suits you. No forms.</p>
    </div>
    <div class="st-top" id="top" hidden><button class="st-back" type="button" data-back aria-label="Back">Back</button><div class="st-prog" aria-hidden="true">${QS.map(() => '<span></span>').join('')}</div></div>
    <form id="qs" novalidate>${QS.map(q).join('')}</form>
    <p class="st-skip" id="skip"><button class="st-link" type="button" data-book>Skip the questions and just book</button></p>
  </section>

  <section class="st-book" id="book" hidden>
    <div class="st-top"><button class="st-back" type="button" data-close aria-label="Back">Back</button><div class="st-prog done" aria-hidden="true">${QS.map(() => '<span class="on"></span>').join('')}</div></div>
    <h2 tabindex="-1">Pick a time for your call.</h2>
    <div class="st-ans" id="ans" hidden></div>
    <ul class="st-plan">
      <li>What is costing you work right now</li>
      <li>What I would build first, and what it is worth</li>
      <li>A fixed price and a start date. No pitch deck.</li>
    </ul>
    <div id="cal" class="st-cal"><p class="st-cal-wait">Loading the calendar…</p></div>
    <div id="calNone" class="st-cal-none" hidden>
      <p>Send me a message and you will get times back the same day.</p>
      <div class="st-acts">${wa ? `<a class="btn btn-live" id="bkWa" data-track="whatsapp_click" href="${L.waHref('Hi Tom — I would like a call.')}">Message me on WhatsApp</a>` : ''}<a class="btn ${wa ? 'btn-ghost' : 'btn-live'}" id="bkMail" href="mailto:${site.email}">Email me</a></div>
      <p class="st-fine">Or use <a class="lnk" href="${b}book/">the booking form</a>.</p>
    </div>
    <p class="st-done" id="done" hidden role="status"></p>
    <div class="st-look">
      <p>While you wait, have a look at what you would get:</p>
      <a href="${b}work/" id="lookSites">The websites<span aria-hidden="true">→</span></a>
      <a href="${b}work/system/" id="lookSys">The system, set up for your trade<span aria-hidden="true">→</span></a>
    </div>
  </section>
  <noscript><section class="st-nos"><p>This page needs JavaScript for the questions. You can <a class="lnk" href="${b}book/">book a call here</a> instead.</p></section></noscript>
</main>
<footer class="st-foot">
  <p>&copy; <span data-year></span> ${esc(site.legalName)} · ${esc(site.areaServed)} · <a href="${b}">The full site</a> · <a href="${site.instagram}" target="_blank" rel="noopener">${esc(site.instagramHandle)}</a></p>
  <p>Your answers stay in your browser until you book. Every business in the demos is fictional.</p>
  <nav class="f-legal" aria-label="Legal">${L.legal(b)}</nav>
</footer>
<script>window.STARTQS=${JSON.stringify(QS)};</script>`;
    return L.page(L.head({ b, path: '/start/', title, description, og: 'start', nodes, noindex: true, css: ['start.css'], preconnect: site.calendly ? ['https://assets.calendly.com', 'https://calendly.com'] : [] }), body, L.scripts(b, ['start.js']));
  }
}]};
