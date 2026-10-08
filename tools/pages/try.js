/* /try/ — the live demos. Each one runs in the browser, takes about a minute, is labelled as a demo
   with a pretend phone, and ends in the same two places: the 60-second check on /start or the call.
   One page per demo so each can rank and be shared. The demo logic lives in assets/try-*.js. */
const L = require('../lib.js');
const { site, esc } = L;
const { KINDS } = require('./case.js');

/* what a customer of each kind of business would book. `dep` = deposit taken to hold the slot
   (0 = a quote visit or a table, booked without paying). `sat` = works Saturdays. All fictional. */
const JOBS = {
  heating:      { dep: 30, sat: false, jobs: [['Boiler service', '1 hour'], ['Boiler not working', 'Repair visit'], ['Leak or radiator problem', 'Repair visit']], text: 'out on a job' },
  electrical:   { dep: 30, sat: false, jobs: [['Fault finding', 'Up to 2 hours'], ['Extra sockets or lights', 'Half day'], ['Electrical safety certificate', '2 to 3 hours']], text: 'out on a job' },
  roofing:      { dep: 0, sat: true, jobs: [['Roof leak inspection', 'Free visit'], ['Gutters and fascias', 'Free quote visit'], ['New roof quote', 'Free quote visit']], text: 'up on a roof' },
  building:     { dep: 0, sat: true, jobs: [['Extension quote', 'Free quote visit'], ['Joinery repair', 'Free quote visit'], ['Small works', 'Free quote visit']], text: 'on site' },
  kitchens:     { dep: 0, sat: true, jobs: [['Kitchen design visit', 'Free, about an hour'], ['Bathroom quote', 'Free quote visit'], ['Small repair', 'Free quote visit']], text: 'on a fit' },
  garden:       { dep: 0, sat: true, jobs: [['Fence repair', 'Free quote visit'], ['Garden design quote', 'Free quote visit'], ['Hedge and tree work', 'Free quote visit']], text: 'out on a job' },
  cleaning:     { dep: 30, sat: true, jobs: [['Regular home clean', '2 hours'], ['End of tenancy clean', 'Full day'], ['Oven clean', '2 hours']], text: 'out cleaning' },
  salon:        { dep: 20, sat: true, jobs: [['Cut and finish', '45 minutes'], ['Colour', '2 hours'], ['Nails', '1 hour']], text: 'with a client' },
  garage:       { dep: 0, sat: true, jobs: [['MOT', '1 hour'], ['Full service', 'Half day'], ['Warning light check', '1 hour']], text: 'under a car' },
  clinic:       { dep: 30, sat: true, jobs: [['First assessment', '45 minutes'], ['Follow-up session', '30 minutes'], ['Sports massage', '1 hour']], text: 'with a patient' },
  professional: { dep: 0, sat: false, jobs: [['Free intro call', '20 minutes'], ['Tax return meeting', '1 hour'], ['Bookkeeping review', '1 hour']], text: 'with a client' },
  hospitality:  { dep: 0, sat: true, jobs: [['Table for 2', 'Tonight or later'], ['Table for 4', 'Tonight or later'], ['Private hire enquiry', 'We call you back']], text: 'mid-service' },
  other:        { dep: 0, sat: false, jobs: [['Free consultation', '30 minutes'], ['Standard visit', '1 hour'], ['Quote visit', 'Free']], text: 'out on a job' },
};
const kinds = KINDS.map(k => ({ key: k.key, label: k.label }));

const DEMOS = [
  { slug: 'missed-call', name: 'Missed call, booked', live: true,
    line: 'Call your own business, let it ring out, and watch the text turn into a booking with a deposit.',
    proves: 'Missed calls stop being lost jobs.' },
  { slug: 'booking', name: 'Book and pay a deposit', live: false,
    line: 'Book a slot on a sample booking page at 10pm, then see it land in the diary.',
    proves: 'Customers book without you.' },
  { slug: 'crm-board', name: 'The CRM board', live: false,
    line: 'Drag a lead from enquiry to done and watch the follow-up texts and review request send themselves.',
    proves: 'Nothing slips through when you are busy.' },
];

const ic = (n, s = 16) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${({
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  msg: '<path d="M4 5h16v11H8l-4 4z"/>', zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  diary: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', leads: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
  video: '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="m15 11 6-3v8l-6-3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  keypad: '<circle cx="6" cy="5" r="1.3"/><circle cx="12" cy="5" r="1.3"/><circle cx="18" cy="5" r="1.3"/><circle cx="6" cy="11" r="1.3"/><circle cx="12" cy="11" r="1.3"/><circle cx="18" cy="11" r="1.3"/><circle cx="6" cy="17" r="1.3"/><circle cx="12" cy="17" r="1.3"/><circle cx="18" cy="17" r="1.3"/>',
  speaker: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
})[n]}</svg>`;

/* the pretend phone: a plain screen in a thin black ring, the same device as the films */
const phone = `
<div class="ph-fit" id="fit"><div class="ph" id="ph" aria-label="A pretend phone" role="group">
  <div class="ph-scr">
    <div class="ph-island" aria-hidden="true"></div>
    <div class="ph-sb" id="sb" aria-hidden="true"><span data-clock></span><span class="ph-sbi"><svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx=".7" fill="currentColor"/><rect x="5" y="5" width="3" height="6" rx=".7" fill="currentColor"/><rect x="10" y="2.5" width="3" height="8.5" rx=".7" fill="currentColor"/><rect x="15" y="0" width="3" height="11" rx=".7" fill="currentColor"/></svg><svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".5"/></svg></span></div>

    <section class="ly ly-contact" data-ly="contact">
      <div class="ct-top"><span class="ct-back">${ic('back', 18)}Contacts</span><span>Edit</span></div>
      <div class="ct-av" data-initial></div>
      <h3 class="ct-nm" data-biz></h3>
      <div class="ct-acts">
        <span>${ic('msg', 20)}<small>message</small></span>
        <button type="button" class="ct-call" data-act="call" aria-label="Call">${ic('phone', 20)}<small>call</small></button>
        <span>${ic('video', 20)}<small>video</small></span>
        <span>${ic('mail', 20)}<small>mail</small></span>
      </div>
      <div class="ct-card"><small>mobile</small><b data-bizno></b></div>
      <div class="ct-card"><small>website</small><b class="ct-url" data-site></b></div>
      <p class="ct-coach" aria-hidden="true">Tap <b>call</b></p>
    </section>

    <section class="ly ly-call" data-ly="call" hidden>
      <p class="cl-st" data-callst>calling…</p>
      <h3 class="cl-nm" data-biz></h3>
      <div class="cl-grid" aria-hidden="true">
        <div><i>${ic('speaker', 26)}</i>speaker</div><div><i>${ic('video', 26)}</i>FaceTime</div><div><i>${ic('mic', 26)}</i>mute</div>
        <div><i>${ic('plus', 26)}</i>add</div><div><i>${ic('keypad', 26)}</i>keypad</div><div><i>${ic('user', 26)}</i>contacts</div>
      </div>
      <button type="button" class="cl-end" data-act="hangup" aria-label="Hang up"><svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 14.5c4.8-4.6 13.2-4.6 18 0l-2.3 2.6-3.4-1.6v-2.3a10 10 0 0 0-6.6 0v2.3l-3.4 1.6z" fill="#fff"/></svg></button>
    </section>

    <section class="ly ly-lock" data-ly="lock" hidden>
      <p class="lk-date" data-date></p>
      <p class="lk-time" data-clock></p>
      <button type="button" class="ntf" id="ntf" data-act="open" hidden>
        <span class="ntf-ap" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 4C7 4 3 7.3 3 11.4c0 2.3 1.3 4.4 3.3 5.8L5.6 20l3.5-1.8c.9.2 1.9.4 2.9.4 5 0 9-3.3 9-7.4S17 4 12 4z" fill="#fff"/></svg></span>
        <span class="ntf-hd"><b data-biz></b><small>now</small></span>
        <span class="ntf-tx" data-sms></span>
      </button>
      <div class="lk-tools" aria-hidden="true"><span></span><span></span></div>
    </section>

    <section class="ly ly-msgs" data-ly="msgs" hidden>
      <div class="ms-top"><span class="ms-back">${ic('back', 18)}</span><div class="ms-av" data-initial></div><small data-biz></small></div>
      <div class="ms-body">
        <p class="ms-stamp">Today <span data-smstime></span></p>
        <p class="bub in" data-sms></p>
        <button type="button" class="ms-lnk" data-act="link"><span class="ms-img"><b data-initial></b></span><span class="ms-tx"><b>Book online · <span data-biz></span></b><small data-site></small></span></button>
      </div>
      <div class="ms-in" aria-hidden="true">iMessage</div>
    </section>

    <section class="ly ly-web" data-ly="web" hidden>
      <div class="wb-pg" id="wb">
        <div class="wb-brand"><i data-initial></i><b data-biz></b></div>
        <h3>Book online</h3>
        <p class="wb-sub" data-websub></p>
        <p class="wb-lab">What do you need?</p>
        <div class="wb-jobs" id="jobs"></div>
        <p class="wb-lab">When suits you?</p>
        <div class="wb-days" id="days"></div>
        <div class="wb-slots" id="slots"></div>
        <button type="button" class="wb-cta" data-act="continue" disabled></button>
        <p class="wb-fine" data-webfine></p>
      </div>
      <div class="wb-url" aria-hidden="true">${ic('lock', 12)}<span data-site></span></div>
      <div class="pay" id="pay" hidden>
        <div class="pay-hd"><b>Pay deposit</b><button type="button" data-act="cancelpay" aria-label="Cancel">✕</button></div>
        <div class="pay-card"><i></i><span><b>Visa •••• 4242</b><small>Demo card</small></span></div>
        <div class="pay-rows"><div><span data-jobname></span><span data-when></span></div><div><span>Deposit, taken off the bill</span><span data-dep></span></div><div><span>Pay now</span><span data-dep></span></div></div>
        <button type="button" class="pay-go" data-act="pay"></button>
        <p class="pay-fine">Demo only. No money moves and no card is needed.</p>
      </div>
    </section>

    <section class="ly ly-done" data-ly="done" hidden>
      <div class="dn-tk">${ic('check', 40)}</div>
      <h3>You're booked</h3>
      <p data-donetx></p>
      <div class="dn-box"><div><span>What</span><b data-jobname></b></div><div><span>When</span><b data-when></b></div><div data-deprow><span>Deposit</span><b data-dep-paid></b></div></div>
      <button type="button" class="ntf ntf-in" id="ntf2" hidden tabindex="-1">
        <span class="ntf-ap" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 4C7 4 3 7.3 3 11.4c0 2.3 1.3 4.4 3.3 5.8L5.6 20l3.5-1.8c.9.2 1.9.4 2.9.4 5 0 9-3.3 9-7.4S17 4 12 4z" fill="#fff"/></svg></span>
        <span class="ntf-hd"><b data-biz></b><small>now</small></span>
        <span class="ntf-tx" data-confirm></span>
      </button>
    </section>
    <div class="ph-home" aria-hidden="true"></div>
  </div>
</div></div>`;

/* the owner's side: the same Skales CRM as the films, updating as the demo runs */
const crm = `
<div class="crm" id="crm" aria-label="What the business sees">
  <div class="crm-tb"><span class="crm-tl" aria-hidden="true"><i></i><i></i><i></i></span><span class="crm-tt">Skales · <b data-biz></b></span></div>
  <div class="crm-lead" id="lead">
    <div class="crm-who"><span class="crm-av">${ic('phone', 16)}</span><span><b data-custno>New caller</b><small id="leadsub">Waiting for a call</small></span><span class="crm-stage" id="stage">Quiet</span></div>
    <div class="crm-tags" id="tags"></div>
  </div>
  <div class="crm-feed">
    <h4>Activity <span class="crm-live"><i></i>Live</span></h4>
    <ol id="feed"><li class="crm-empty">Nothing yet. Make the call.</li></ol>
  </div>
  <div class="crm-diary">
    <h4>${ic('diary', 14)}<span data-diaryday>Diary</span></h4>
    <div id="diary"></div>
  </div>
</div>`;

const steps = ['Call', 'Ring out', 'The text', 'Book', 'Your side'];

module.exports = { JOBS, DEMOS, pages: [
  {
    url: '/try/', og: 'try', priority: 0.8, changefreq: 'monthly',
    meta: { key: 'try', title: 'Try it: the systems, running.', kicker: 'Live demos · about a minute each', sub: 'Be your own customer. Call, book, pay a deposit, and see what the business sees.' },
    render(b){
      const title = `Try it: live demos of missed-call text-back and booking | ${site.name}`;
      const description = `Live demos you can use on your phone: call a business and let it ring out, get the text-back, book and pay a deposit, and see the lead land in the CRM.`;
      const live = DEMOS.filter(x => x.live);
      const nodes = [
        L.webPage({ path: '/try/', title, description, type: 'CollectionPage' }),
        L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Try it', path: '/try/' }]),
        { '@type': 'ItemList', name: 'Live demos', itemListElement: live.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/try/${x.slug}/`), name: x.name })) },
      ];
      const card = x => x.live
        ? `<a class="try-card" href="${b}try/${x.slug}/"><span class="try-n">Demo</span><h2>${esc(x.name)}</h2><p>${esc(x.line)}</p><span class="try-go">Try it <span aria-hidden="true">→</span></span></a>`
        : `<div class="try-card is-soon" aria-disabled="true"><span class="try-n">Next</span><h2>${esc(x.name)}</h2><p>${esc(x.line)}</p><span class="try-go">Being built</span></div>`;
      const body = `
${L.header(b, 'try')}
<main id="main">
<section class="try-hero wrap">
  <p class="spec"><span class="lamp"></span>Live demos · about a minute each</p>
  <h1>Don't take my word for it. Try it.</h1>
  <p class="lead">Each demo runs right here on your phone. You play the customer, then see what the business sees. Every business in them is pretend, and nothing is sent.</p>
</section>
<section class="wrap try-list">${DEMOS.map(card).join('')}</section>
${L.ctaBand(b, 'Want this running for your business?', 'Sixty seconds of taps shows what missed calls are likely costing you and what I would build first.', `<a class="btn btn-ghost" href="${b}start/?utm_source=site&amp;utm_medium=try">See what I'm missing</a>`)}
</main>
${L.footer(b)}`;
      return L.page(L.head({ b, path: '/try/', title, description, og: 'try', nodes, css: ['try.css'] }), body, L.scripts(b));
    },
  },
  {
    url: '/try/missed-call/', og: 'try-missed-call', priority: 0.8, changefreq: 'monthly',
    meta: { key: 'try-missed-call', title: 'Missed call, booked. Try it.', kicker: 'Live demo · about a minute', sub: 'Call your own business, let it ring out, and watch the text-back turn into a booking with a deposit.' },
    render(b){
      const title = `Missed call text-back demo: try it on your phone | ${site.name}`;
      const description = `A live demo of missed-call text-back for UK service businesses: call, let it ring out, get the text, book and pay a deposit, and see the lead land in the CRM.`;
      const nodes = [
        L.webPage({ path: '/try/missed-call/', title, description }),
        L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Try it', path: '/try/' }, { name: 'Missed call, booked', path: '/try/missed-call/' }]),
        { '@type': 'HowTo', name: 'How missed-call text-back works', description: 'What a caller gets when a business with missed-call text-back cannot answer.',
          step: [
            { '@type': 'HowToStep', name: 'The call rings out', text: 'The business is on a job and cannot answer. The call is logged as a missed call straight away.' },
            { '@type': 'HowToStep', name: 'The text goes out', text: 'Within seconds the caller gets a text from the business with a link to book online.' },
            { '@type': 'HowToStep', name: 'The caller books', text: 'The caller picks the job and a free slot from the real diary, and pays a small deposit where the business takes one.' },
            { '@type': 'HowToStep', name: 'The lead is in the CRM', text: 'The business sees the lead move from missed call to booked, with the deposit and the slot in the diary, without touching the phone.' },
          ] },
      ];
      const chip = k => `<button type="button" class="tm-k" data-kind="${k.key}" aria-pressed="false">${esc(k.label)}</button>`;
      const body = `
${L.header(b, 'try')}
<main id="main" class="tm">
<section class="tm-setup wrap" id="setup">
  <p class="spec"><a class="lnk" href="${b}try/">Try it</a> · Demo 1 of 3</p>
  <h1>Missed call, booked.</h1>
  <p class="lead">Be your own customer. Call your business, let it ring out, and see what happens next. About a minute.</p>
  <form class="tm-form" id="setupForm" novalidate>
    <label class="tm-l" for="bizName">Your business name <span class="opt">optional</span></label>
    <input id="bizName" name="biz" maxlength="32" autocomplete="organization" placeholder="Larchfield Heating" enterkeyhint="go">
    <p class="tm-l" id="kindL">What do you do?</p>
    <div class="tm-kinds" role="group" aria-labelledby="kindL">${kinds.map(chip).join('')}</div>
    <button class="btn btn-live tm-go" type="submit">Start the demo</button>
    <p class="tm-fine">A pretend phone on this page. Nothing is sent, nobody is called, and your answers stay in your browser.</p>
  </form>
</section>

<section class="tm-run" id="run" hidden>
  <div class="tm-narr">
    <ol class="tm-steps" aria-label="Steps">${steps.map((s, i) => `<li data-step="${i}"><span>${esc(s)}</span></li>`).join('')}</ol>
    <p class="tm-say" id="say" aria-live="polite"></p>
    <p class="tm-hint" id="hint"></p>
    <p class="tm-lab">Demo · pretend business · nothing is sent</p>
  </div>
  <div class="tm-stage">
    ${phone}
    <div class="tm-toast" id="toast" role="status" hidden></div>
  </div>
  <div class="tm-side">${crm}</div>
</section>

<section class="tm-end wrap" id="end" hidden aria-live="polite">
  <p class="spec">What just happened</p>
  <h2 tabindex="-1" id="endH"></h2>
  <p class="lead" id="endP"></p>
  <div class="tm-acts">
    <a class="btn btn-live" data-cta="check" href="${b}start/?utm_source=site&amp;utm_medium=try&amp;utm_campaign=missed-call">See what I'm missing <small>60 seconds</small></a>
    <a class="btn btn-ghost" data-cta="call" href="${b}start/?utm_source=site&amp;utm_medium=try&amp;utm_campaign=missed-call#book">Book a call</a>
  </div>
  <p class="tm-again"><button type="button" class="lnk tm-redo" id="again">Run it again</button> · <a class="lnk" href="${b}try/">The other demos</a></p>
</section>
<noscript><section class="wrap tm-nos"><p>This demo needs JavaScript. You can <a class="lnk" href="${b}what-i-do/">read how it works</a> or <a class="lnk" href="${b}book/">book a call</a>.</p></section></noscript>
</main>
${L.footer(b)}
<script>window.TRYKINDS=${JSON.stringify(kinds)};window.TRYJOBS=${JSON.stringify(JOBS)};</script>`;
      return L.page(L.head({ b, path: '/try/missed-call/', title, description, og: 'try-missed-call', nodes, css: ['try.css'] }), body, L.scripts(b, ['try-missed.js']));
    },
  },
]};
