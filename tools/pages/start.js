/* /start/ — where the Instagram bio link and the ads land. One screen at a time, built for a
   thumb: the six-second film, then six tap-only questions, then the owner's own case file with the
   call booked on the same page. "Just book a call" skips everything. Nothing is typed until the
   owner chooses to leave a number. noindex: it is a landing page, not a search page; the search
   pages are the services, automations and trades. The logic lives in assets/start.js. */
const L = require('../lib.js');
const { site, esc } = L;
const { KINDS } = require('./case.js');

/* the questions. Each option carries the value the case file works from, so the working it prints
   is the owner's own answer, not a guess. `rep` = the figure used for a band (printed beside it). */
const QS = [
  { key: 'kind', h: 'What do you do?', grid: true, opts: KINDS.map(k => ({ v: k.key, t: k.label })) },
  { key: 'source', h: 'Where does most of your work come from?', opts: [
    { v: 'word', t: 'Word of mouth' }, { v: 'google', t: 'Google' }, { v: 'social', t: 'Facebook or Instagram' },
    { v: 'directory', t: 'Checkatrade, Bark or similar' }, { v: 'mix', t: 'A mix of everything' }] },
  { key: 'missed', h: 'How many calls do you miss in a normal week?', sub: 'On a job, driving, after hours.', opts: [
    { v: '0', t: 'Hardly any', rep: 0 }, { v: '2', t: '1 to 3', rep: 2 }, { v: '6', t: '4 to 10', rep: 6 }, { v: '12', t: 'More than 10', rep: 12 }] },
  { key: 'job', h: 'What is a typical job worth to you?', opts: [
    { v: '100', t: 'Under £150', rep: 100 }, { v: '300', t: '£150 to £500', rep: 300 }, { v: '1000', t: '£500 to £2,000', rep: 1000 }, { v: '2500', t: 'Over £2,000', rep: 2500 }] },
  { key: 'site', h: 'And your website today?', opts: [
    { v: 'none', t: 'There isn’t one' }, { v: 'diy', t: 'A page-builder site (Wix, Squarespace)' }, { v: 'old', t: 'Built by someone, a while ago' }, { v: 'good', t: 'One I’m proud of' }] },
  { key: 'when', h: 'When would you want this sorted?', opts: [
    { v: 'now', t: 'As soon as possible' }, { v: 'quarter', t: 'In the next three months' }, { v: 'looking', t: 'Just looking for now' }] },
];

module.exports = { QS, pages: [{
  url: '/start/', og: 'start', noindex: true, sitemap: false,
  meta: { key: 'start', title: 'See what missed calls are costing you.', kicker: 'Skales Studio · 60 seconds, all taps', sub: 'Six questions. Your own case file. The call booked on the same page.' },
  render(b){
    const title = `See what missed calls are costing you | ${site.name}`;
    const description = `Six taps, sixty seconds: what missed calls and an old website are likely costing your business, what to build first, and a call booked on the same page.`;
    const nodes = [L.webPage({ path: '/start/', title, description })];
    const wa = String(site.whatsapp || '').replace(/\D/g, '');
    const q = (x, i) => `<fieldset class="sq" data-q="${i}" hidden>
      <legend><span class="sq-n">${i + 1} of ${QS.length}</span><h2 tabindex="-1">${esc(x.h)}</h2>${x.sub ? `<p class="sq-sub">${esc(x.sub)}</p>` : ''}</legend>
      <div class="sq-opts${x.grid ? ' sq-grid' : ''}">${x.opts.map(o => `<button type="button" class="sq-o" data-k="${x.key}" data-v="${esc(o.v)}">${esc(o.t)}</button>`).join('')}</div>
    </fieldset>`;
    const body = `
<a class="skip" href="#main">Skip to content</a>
<header class="st-bar">
  <a class="wordmark" href="${b}" aria-label="${esc(site.name)} — home">${esc(site.wordmark.a)}<i>${esc(site.wordmark.x)}</i>${esc(site.wordmark.b)}</a>
  ${wa ? `<a class="st-wa" data-track="whatsapp_click" href="${L.waHref('Hi Tom — found you through your bio link.')}" aria-label="Message Tom on WhatsApp"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg><span>WhatsApp</span></a>` : ''}
</header>
<main id="main" class="st">
  <section class="st-intro" id="intro">
    <figure class="st-film">
      <video id="loop" muted playsinline loop preload="metadata" poster="${b}assets/film/start-loop.jpg" aria-label="A missed call on a tradesperson's phone turning into a text-back and a booked job with a deposit"><source src="${b}assets/film/start-loop.mp4" type="video/mp4"></video>
      <figcaption>Fictional business · illustrative numbers</figcaption>
      <button class="st-play" id="play" type="button" hidden>Play the film</button>
    </figure>
    <div class="st-copy">
      <p class="st-kick"><span class="lamp"></span>For UK service businesses</p>
      <h1>Your website and phone, booking work while you’re on the tools.</h1>
      <p class="st-sub">Six taps. See what missed calls are likely costing you, and what I’d build first.</p>
      <div class="st-acts">
        <button class="btn btn-live st-go" type="button" data-go>See what I’m missing <small>60 seconds</small></button>
        <button class="st-link" type="button" data-book>Just book a call</button>
      </div>
      ${site.introVideo ? `<figure class="st-me"><video controls playsinline preload="none" poster="${b}${esc(site.introVideo.replace(/\.mp4$/, '.jpg'))}"><source src="${b}${esc(site.introVideo)}" type="video/mp4"></video><figcaption>Tom, who builds every one.</figcaption></figure>` : ''}
      <p class="st-who">${esc(site.founder.name)} · ${esc(site.legalName)} · built in public on Instagram <a href="${site.instagram}" target="_blank" rel="noopener">${esc(site.instagramHandle)}</a></p>
    </div>
  </section>

  <section class="st-check" id="check" hidden aria-live="polite">
    <div class="st-top"><button class="st-back" type="button" data-back aria-label="Back">Back</button><div class="st-prog" aria-hidden="true">${QS.map(() => '<span></span>').join('')}</div></div>
    <form id="qs" novalidate>${QS.map(q).join('')}</form>
  </section>

  <section class="st-file" id="file" hidden aria-live="polite"></section>

  <section class="st-book" id="book" hidden>
    <div class="st-bk">
      <button class="st-back st-back-l" type="button" data-close>Back</button>
      <h2 tabindex="-1">Book a 20-minute call.</h2>
      <p class="st-bk-sub">With me, Tom, the person who builds it. No pitch and no proposal deck: what is leaking, what to build first, and a flat quote with a date on it.</p>
      <div id="cal" class="st-cal"></div>
      <div id="calNone" class="st-cal-none" hidden>
        <p>Send me a message and you will get times back the same day.</p>
        <div class="st-acts">${wa ? `<a class="btn btn-live" id="bkWa" data-track="whatsapp_click" href="${L.waHref('Hi Tom — I would like a call.')}">Message me on WhatsApp</a>` : ''}<a class="btn ${wa ? 'btn-ghost' : 'btn-live'}" id="bkMail" href="mailto:${site.email}">Email me</a></div>
        <p class="st-fine">Or use <a class="lnk" href="${b}book/">the booking form</a>.</p>
      </div>
    </div>
  </section>
  <noscript><section class="st-nos"><p>This page needs JavaScript for the questions. You can <a class="lnk" href="${b}book/">book a call here</a> instead.</p></section></noscript>
</main>
<footer class="st-foot">
  <p>&copy; <span data-year></span> ${esc(site.legalName)} · ${esc(site.areaServed)} · <a href="${b}">The full site</a> · <a href="${b}work/">The work</a></p>
  <p>Every business, name and number in the films and demos is fictional. Your answers stay in your browser unless you choose to send them.</p>
  <nav class="f-legal" aria-label="Legal">${L.legal(b)}</nav>
</footer>
<script>window.STARTQS=${JSON.stringify(QS)};window.STARTKINDS=${JSON.stringify(KINDS)};</script>`;
    return L.page(L.head({ b, path: '/start/', title, description, og: 'start', nodes, noindex: true, css: ['start.css'] }), body, L.scripts(b, ['builds.js', 'start.js']));
  }
}]};
