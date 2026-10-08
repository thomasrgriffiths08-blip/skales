/* /try/ — the live demos. Each one runs in the browser, takes about a minute, is labelled as a demo
   with a pretend phone, and ends in the same two places: the 60-second check on /start or the call.
   One page per demo so each can rank and be shared. The demo logic lives in assets/try-*.js. */
const L = require('../lib.js');
const { site, esc } = L;
const { KINDS } = require('./case.js');

/* what a customer of each kind of business would book. `quote` = a bigger job they would want priced
   first (demo 3). `dep` = deposit taken to hold the slot
   (0 = a quote visit or a table, booked without paying). `sat` = works Saturdays. All fictional. */
const JOBS = {
  heating: { quote: ['New combi boiler', '£2,850'], dep: 30, sat: false, jobs: [['Boiler service', '1 hour'], ['Boiler not working', 'Repair visit'], ['Leak or radiator problem', 'Repair visit']], text: 'out on a job' },
  electrical: { quote: ['Consumer unit upgrade', '£650'], dep: 30, sat: false, jobs: [['Fault finding', 'Up to 2 hours'], ['Extra sockets or lights', 'Half day'], ['Electrical safety certificate', '2 to 3 hours']], text: 'out on a job' },
  roofing: { quote: ['Re-roof, terraced house', '£6,400'], dep: 0, sat: true, jobs: [['Roof leak inspection', 'Free visit'], ['Gutters and fascias', 'Free quote visit'], ['New roof quote', 'Free quote visit']], text: 'up on a roof' },
  building: { quote: ['Kitchen extension', '£38,000'], dep: 0, sat: true, jobs: [['Extension quote', 'Free quote visit'], ['Joinery repair', 'Free quote visit'], ['Small works', 'Free quote visit']], text: 'on site' },
  kitchens: { quote: ['Kitchen supply and fit', '£9,200'], dep: 0, sat: true, jobs: [['Kitchen design visit', 'Free, about an hour'], ['Bathroom quote', 'Free quote visit'], ['Small repair', 'Free quote visit']], text: 'on a fit' },
  garden: { quote: ['New fence, 12 panels', '£1,450'], dep: 0, sat: true, jobs: [['Fence repair', 'Free quote visit'], ['Garden design quote', 'Free quote visit'], ['Hedge and tree work', 'Free quote visit']], text: 'out on a job' },
  cleaning: { quote: ['Weekly clean, 3 hours', '£60 a visit'], dep: 30, sat: true, jobs: [['Regular home clean', '2 hours'], ['End of tenancy clean', 'Full day'], ['Oven clean', '2 hours']], text: 'out cleaning' },
  salon: { quote: ['Wedding hair and a trial', '£280'], dep: 20, sat: true, jobs: [['Cut and finish', '45 minutes'], ['Colour', '2 hours'], ['Nails', '1 hour']], text: 'with a client' },
  garage: { quote: ['Clutch replacement', '£540'], dep: 0, sat: true, jobs: [['MOT', '1 hour'], ['Full service', 'Half day'], ['Warning light check', '1 hour']], text: 'under a car' },
  clinic: { quote: ['Block of six sessions', '£270'], dep: 30, sat: true, jobs: [['First assessment', '45 minutes'], ['Follow-up session', '30 minutes'], ['Sports massage', '1 hour']], text: 'with a patient' },
  professional: { quote: ['Year-end accounts', '£950'], dep: 0, sat: false, jobs: [['Free intro call', '20 minutes'], ['Tax return meeting', '1 hour'], ['Bookkeeping review', '1 hour']], text: 'with a client' },
  hospitality: { quote: ['Private hire, 20 guests', '£1,200'], dep: 0, sat: true, jobs: [['Table for 2', 'Tonight or later'], ['Table for 4', 'Tonight or later'], ['Private hire enquiry', 'We call you back']], text: 'mid-service' },
  other: { quote: ['Standard job', '£400'], dep: 0, sat: false, jobs: [['Free consultation', '30 minutes'], ['Standard visit', '1 hour'], ['Quote visit', 'Free']], text: 'out on a job' },
};
const kinds = KINDS.map(k => ({ key: k.key, label: k.label }));

const DEMOS = [
  { slug: 'missed-call', name: 'Missed call, booked', live: true,
    line: 'Call your own business, let it ring out, and watch the text turn into a booking with a deposit.',
    proves: 'Missed calls stop being lost jobs.' },
  { slug: 'booking', name: 'Book and pay a deposit', live: true,
    line: 'Book a job on your own website at 10pm, pay the deposit, then find it in your diary the next morning.',
    proves: 'Customers book without you.' },
  { slug: 'crm-board', name: 'The CRM board', live: true,
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
  back: '<path d="M15 5l-7 7 7 7"/>', bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
})[n]}</svg>`;

/* what the business's own small website says, per kind (trades from data/trades.js, the rest here).
   All fictional; the visitor's business name goes on top. */
const trades = require('../../data/trades.js');
const SITES = Object.fromEntries([
  ...trades.map(t => [t.key, { word: t.word, c: t.c, creds: t.creds, services: t.services.slice(0, 3).map(x => x[0]) }]),
  ['clinic', { word: 'physio clinic', c: '#2C5D73', creds: ['HCPC registered', 'Evening appointments', 'Book online any hour'], services: ['Back and neck pain', 'Sports injuries', 'Massage'] }],
  ['professional', { word: 'accountant', c: '#28344A', creds: ['Fixed monthly fees', 'Replies the same day', 'Making Tax Digital ready'], services: ['Self assessment', 'Bookkeeping', 'Limited company accounts'] }],
  ['hospitality', { word: 'restaurant', c: '#6E2F2A', creds: ['Open late Friday and Saturday', 'Private room for 20', 'Book online any hour'], services: ['Dinner', 'Sunday lunch', 'Private hire'] }],
]);

const SB = `<div class="ph-sb" id="sb" aria-hidden="true"><span data-clock></span><span class="ph-sbi"><svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx=".7" fill="currentColor"/><rect x="5" y="5" width="3" height="6" rx=".7" fill="currentColor"/><rect x="10" y="2.5" width="3" height="8.5" rx=".7" fill="currentColor"/><rect x="15" y="0" width="3" height="11" rx=".7" fill="currentColor"/></svg><svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".5"/></svg></span></div>`;
const MSG_ICON = `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 4C7 4 3 7.3 3 11.4c0 2.3 1.3 4.4 3.3 5.8L5.6 20l3.5-1.8c.9.2 1.9.4 2.9.4 5 0 9-3.3 9-7.4S17 4 12 4z" fill="#fff"/></svg>`;
const SK_ICON = `<svg width="20" height="20" viewBox="0 0 64 64"><path d="M22 16v32M43 17L25 33l18 15" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const urlBar = attr => `<div class="wb-url" aria-hidden="true">${ic('lock', 12)}<span ${attr}></span></div>`;

/* the pretend phone's screens. Each demo picks the ones its story needs. */
const LY = {
  contact: () => `
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
    </section>`,
  call: () => `
    <section class="ly ly-call" data-ly="call" hidden>
      <p class="cl-st" data-callst>calling…</p>
      <h3 class="cl-nm" data-biz></h3>
      <div class="cl-grid" aria-hidden="true">
        <div><i>${ic('speaker', 26)}</i>speaker</div><div><i>${ic('video', 26)}</i>FaceTime</div><div><i>${ic('mic', 26)}</i>mute</div>
        <div><i>${ic('plus', 26)}</i>add</div><div><i>${ic('keypad', 26)}</i>keypad</div><div><i>${ic('user', 26)}</i>contacts</div>
      </div>
      <button type="button" class="cl-end" data-act="hangup" aria-label="Hang up"><svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 14.5c4.8-4.6 13.2-4.6 18 0l-2.3 2.6-3.4-1.6v-2.3a10 10 0 0 0-6.6 0v2.3l-3.4 1.6z" fill="#fff"/></svg></button>
    </section>`,
  /* a lock screen with one notification: who it is from, the app, what it says, what a tap does */
  lock: ({ ly = 'lock', id = 'ntf', act = 'open', app = 'msg', from = '<b data-biz></b>', text = '<span class="ntf-tx" data-sms></span>' } = {}) => `
    <section class="ly ly-lock" data-ly="${ly}" hidden>
      <p class="lk-date" data-date></p>
      <p class="lk-time" data-clock></p>
      <button type="button" class="ntf" id="${id}" data-act="${act}" hidden>
        <span class="ntf-ap${app === 'skales' ? ' is-sk' : ''}" aria-hidden="true">${app === 'skales' ? SK_ICON : MSG_ICON}</span>
        <span class="ntf-hd">${from}<small>now</small></span>
        ${text}
      </button>
      <div class="lk-tools" aria-hidden="true"><span></span><span></span></div>
    </section>`,
  msgs: () => `
    <section class="ly ly-msgs" data-ly="msgs" hidden>
      <div class="ms-top"><span class="ms-back">${ic('back', 18)}</span><div class="ms-av" data-initial></div><small data-biz></small></div>
      <div class="ms-body">
        <p class="ms-stamp">Today <span data-smstime></span></p>
        <p class="bub in" data-sms></p>
        <button type="button" class="ms-lnk" data-act="link"><span class="ms-img"><b data-initial></b></span><span class="ms-tx"><b>Book online · <span data-biz></span></b><small data-site></small></span></button>
      </div>
      <div class="ms-in" aria-hidden="true">iMessage</div>
    </section>`,
  /* the customer's Messages thread with the business; the demo adds the bubbles */
  thread: () => `
    <section class="ly ly-msgs" data-ly="thread" hidden>
      <div class="ms-top"><span class="ms-back">${ic('back', 18)}</span><div class="ms-av" data-initial></div><small data-biz></small></div>
      <div class="ms-body ms-scroll" id="thread"></div>
      <div class="ms-in" aria-hidden="true">iMessage</div>
    </section>`,
  /* the business's own small website, as a customer meets it at night */
  site: () => `
    <section class="ly ly-web ly-site" data-ly="site" hidden>
      <div class="wb-pg">
        <div class="wb-brand"><i data-initial></i><b data-biz></b><span class="st-menu" aria-hidden="true"></span></div>
        <div class="st-hero"><p class="st-word" data-word></p><h3 data-biz></h3><ul class="st-creds" id="creds"></ul></div>
        <button type="button" class="wb-cta st-book" data-act="book">Book online</button>
        <p class="wb-fine st-open">Booking open now. Takes about a minute.</p>
        <p class="wb-lab">What we do</p>
        <ul class="st-svcs" id="svcs"></ul>
        <p class="st-call">Or call <b data-bizno></b></p>
      </div>
      ${urlBar('data-domain')}
    </section>`,
  web: ({ details = false } = {}) => `
    <section class="ly ly-web" data-ly="web" hidden>
      <div class="wb-pg" id="wb">
        <div class="wb-brand"><i data-initial></i><b data-biz></b></div>
        <div id="wbPick">
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
        ${details ? `<div id="wbDet" hidden>
          <button type="button" class="wb-back" data-act="detback">${ic('back', 14)}Change time</button>
          <h3>Your details</h3>
          <p class="wb-sub"><b data-jobname></b> · <span data-when></span></p>
          <div class="wb-f"><label>Name</label><span class="wb-in" id="fName"></span></div>
          <div class="wb-f"><label>Mobile</label><span class="wb-in" id="fMob"></span></div>
          <div class="wb-f"><label>Anything we should know?</label><div class="wb-notes" id="notes"></div></div>
          <button type="button" class="wb-cta" data-act="confirm" disabled>Fill in your details</button>
          <p class="wb-fine">We only use your number for this booking.</p>
        </div>` : ''}
      </div>
      ${details ? `<button type="button" class="af" id="af" data-act="fill" hidden><span>${ic('user', 15)}<b>Sam Carter</b> · 07700 900 418</span><small>AutoFill</small></button>` : ''}
      ${urlBar('data-site')}
      <div class="pay" id="pay" hidden>
        <div class="pay-hd"><b>Pay deposit</b><button type="button" data-act="cancelpay" aria-label="Cancel">✕</button></div>
        <div class="pay-card"><i></i><span><b>Visa •••• 4242</b><small>Demo card</small></span></div>
        <div class="pay-rows"><div><span data-jobname></span><span data-when></span></div><div><span>Deposit, taken off the bill</span><span data-dep></span></div><div><span>Pay now</span><span data-dep></span></div></div>
        <button type="button" class="pay-go" data-act="pay"></button>
        <p class="pay-fine">Demo only. No money moves and no card is needed.</p>
      </div>
    </section>`,
  done: () => `
    <section class="ly ly-done" data-ly="done" hidden>
      <div class="dn-tk">${ic('check', 40)}</div>
      <h3>You're booked</h3>
      <p data-donetx></p>
      <div class="dn-box"><div><span>What</span><b data-jobname></b></div><div><span>When</span><b data-when></b></div><div data-deprow><span>Deposit</span><b data-dep-paid></b></div></div>
      <button type="button" class="ntf ntf-in" id="ntf2" hidden tabindex="-1">
        <span class="ntf-ap" aria-hidden="true">${MSG_ICON}</span>
        <span class="ntf-hd"><b data-biz></b><small>now</small></span>
        <span class="ntf-tx" data-confirm></span>
      </button>
    </section>`,
  /* the owner's phone: the Skales app, today's jobs */
  app: () => `
    <section class="ly ly-app" data-ly="app" hidden>
      <div class="ap-top"><span class="ap-ws"><i data-initial></i><b data-biz></b></span><span class="ap-bell">${ic('bell', 18)}</span></div>
      <h3 data-appday></h3>
      <p class="ap-sum" data-appsum></p>
      <ol class="ap-list" id="appList"></ol>
      <nav class="ap-tabs" aria-hidden="true"><span class="on">${ic('diary', 20)}Diary</span><span>${ic('leads', 20)}Leads</span><span>${ic('msg', 20)}Inbox</span></nav>
    </section>`,
};

const phone = layers => `
<div class="ph-fit" id="fit"><div class="ph" id="ph" aria-label="A pretend phone" role="group">
  <div class="ph-scr">
    <div class="ph-island" aria-hidden="true"></div>
    ${SB}
    ${layers.join('')}
    <div class="ph-home" aria-hidden="true"></div>
  </div>
</div></div>`;

/* the owner's side: the same Skales CRM as the films, updating as the demo runs */
const crm = `
<div class="crm" id="crm" aria-label="What the business sees">
  <div class="crm-tb"><span class="crm-tl" aria-hidden="true"><i></i><i></i><i></i></span><span class="crm-tt">Skales · <b data-biz></b></span></div>
  <div class="crm-lead" id="lead">
    <div class="crm-who"><span class="crm-av">${ic('user', 16)}</span><span><b data-custno>New customer</b><small id="leadsub">Waiting</small></span><span class="crm-stage" id="stage">Quiet</span></div>
    <div class="crm-tags" id="tags"></div>
  </div>
  <div class="crm-feed">
    <h4>Activity <span class="crm-live"><i></i>Live</span></h4>
    <ol id="feed"><li class="crm-empty">Nothing yet.</li></ol>
  </div>
  <div class="crm-diary">
    <h4>${ic('diary', 14)}<span data-diaryday>Diary</span></h4>
    <div id="diary"></div>
  </div>
</div>`;

/* the CRM board for demo 3: four columns, one lead to move through them, the activity under it.
   The other cards are fictional and only set the scene. */
const crmBoard = `
<div class="crm crm-bd" id="crm" aria-label="The business's CRM board">
  <div class="crm-tb"><span class="crm-tl" aria-hidden="true"><i></i><i></i><i></i></span><span class="crm-tt">Skales · <b data-biz></b></span></div>
  <div class="bd-hd"><b>Leads</b><span>Drag a card, or use its button</span></div>
  <div class="bd" id="board">
    ${[['e', 'Enquiry', '#3B18E0'], ['q', 'Quoted', '#D98A0B'], ['b', 'Booked', '#2F6FDB'], ['d', 'Done', '#22A06B']].map(([k, nm, c]) => `
    <div class="bd-col" data-col="${k}"><h4><i style="background:${c}"></i>${nm}<span data-count="${k}"></span></h4><div class="bd-cards" id="col-${k}"></div></div>`).join('')}
  </div>
  <div class="crm-feed">
    <h4>Sent automatically <span class="crm-live"><i></i>Live</span></h4>
    <ol id="feed"><li class="crm-empty">Nothing yet.</li></ol>
  </div>
</div>`;

const chip = k => `<button type="button" class="tm-k" data-kind="${k.key}" aria-pressed="false">${esc(k.label)}</button>`;
/* one demo page: set-up, the running demo (narration, phone, CRM), the end */
function demoPage(b, x, { n, lead, steps, layers, side = crm, runClass = '' }){
  const camp = `utm_source=site&amp;utm_medium=try&amp;utm_campaign=${x.slug}`;
  return `
${L.header(b, 'try')}
<main id="main" class="tm">
<section class="tm-setup wrap" id="setup">
  <p class="spec"><a class="lnk" href="${b}try/">Try it</a> · Demo ${n} of ${DEMOS.length}</p>
  <h1>${esc(x.name)}.</h1>
  <p class="lead">${esc(lead)}</p>
  <form class="tm-form" id="setupForm" novalidate>
    <label class="tm-l" for="bizName">Your business name <span class="opt">optional</span></label>
    <input id="bizName" name="biz" maxlength="32" autocomplete="organization" placeholder="Larchfield Heating" enterkeyhint="go">
    <p class="tm-l" id="kindL">What do you do?</p>
    <div class="tm-kinds" role="group" aria-labelledby="kindL">${kinds.map(chip).join('')}</div>
    <button class="btn btn-live tm-go" type="submit">Start the demo</button>
    <p class="tm-fine">A pretend phone on this page. Nothing is sent, nobody is called, and your answers stay in your browser.</p>
  </form>
</section>

<section class="tm-run${runClass ? ' ' + runClass : ''}" id="run" hidden>
  <div class="tm-narr">
    <ol class="tm-steps" aria-label="Steps">${steps.map((s, i) => `<li data-step="${i}"><span>${esc(s)}</span></li>`).join('')}</ol>
    <p class="tm-say" id="say" aria-live="polite"></p>
    <p class="tm-hint" id="hint"></p>
    <p class="tm-lab">Demo · pretend business · nothing is sent</p>
  </div>
  <div class="tm-stage">
    ${phone(layers)}
    <div class="tm-toast" id="toast" role="status" hidden></div>
  </div>
  <div class="tm-side">${side}</div>
</section>

<section class="tm-end wrap" id="end" hidden aria-live="polite">
  <p class="spec">What just happened</p>
  <h2 tabindex="-1" id="endH"></h2>
  <p class="lead" id="endP"></p>
  <div class="tm-acts">
    <a class="btn btn-live" data-cta="check" href="${b}start/?${camp}">See what I'm missing <small>60 seconds</small></a>
    <a class="btn btn-ghost" data-cta="call" href="${b}start/?${camp}#book">Book a call</a>
  </div>
  <p class="tm-again"><button type="button" class="lnk tm-redo" id="again">Run it again</button> · <a class="lnk" href="${b}try/">The other demos</a></p>
</section>
<noscript><section class="wrap tm-nos"><p>This demo needs JavaScript. You can <a class="lnk" href="${b}what-i-do/">read how it works</a> or <a class="lnk" href="${b}book/">book a call</a>.</p></section></noscript>
</main>
${L.footer(b)}
<script>window.TRYKINDS=${JSON.stringify(kinds)};window.TRYJOBS=${JSON.stringify(JOBS)};window.TRYSITES=${JSON.stringify(SITES)};</script>`;
}

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
      const x = DEMOS[0];
      const title = `Missed call text-back demo: try it on your phone | ${site.name}`;
      const description = `A live demo of missed-call text-back for UK service businesses: call, let it ring out, get the text, book and pay a deposit, and see the lead land in the CRM.`;
      const nodes = [
        L.webPage({ path: '/try/missed-call/', title, description }),
        L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Try it', path: '/try/' }, { name: x.name, path: '/try/missed-call/' }]),
        { '@type': 'HowTo', name: 'How missed-call text-back works', description: 'What a caller gets when a business with missed-call text-back cannot answer.',
          step: [
            { '@type': 'HowToStep', name: 'The call rings out', text: 'The business is on a job and cannot answer. The call is logged as a missed call straight away.' },
            { '@type': 'HowToStep', name: 'The text goes out', text: 'Within seconds the caller gets a text from the business with a link to book online.' },
            { '@type': 'HowToStep', name: 'The caller books', text: 'The caller picks the job and a free slot from the real diary, and pays a small deposit where the business takes one.' },
            { '@type': 'HowToStep', name: 'The lead is in the CRM', text: 'The business sees the lead move from missed call to booked, with the deposit and the slot in the diary, without touching the phone.' },
          ] },
      ];
      const body = demoPage(b, x, { n: 1, lead: 'Be your own customer. Call your business, let it ring out, and see what happens next. About a minute.',
        steps: ['Call', 'Ring out', 'The text', 'Book', 'Your side'],
        layers: [LY.contact(), LY.call(), LY.lock(), LY.msgs(), LY.web(), LY.done()] });
      return L.page(L.head({ b, path: '/try/missed-call/', title, description, og: 'try-missed-call', nodes, css: ['try.css'] }), body, L.scripts(b, ['try-kit.js', 'try-missed.js']));
    },
  },
  {
    url: '/try/booking/', og: 'try-booking', priority: 0.8, changefreq: 'monthly',
    meta: { key: 'try-booking', title: 'Book and pay a deposit. Try it.', kicker: 'Live demo · about a minute', sub: 'Book a job on your own website at 10pm, then see it waiting in your diary the next morning.' },
    render(b){
      const x = DEMOS[1];
      const title = `Online booking with deposits demo: try it on your phone | ${site.name}`;
      const description = `A live demo of online booking for UK service businesses: a customer books and pays a deposit on your website at night, and the job is in your diary by morning.`;
      const nodes = [
        L.webPage({ path: '/try/booking/', title, description }),
        L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Try it', path: '/try/' }, { name: x.name, path: '/try/booking/' }]),
        { '@type': 'HowTo', name: 'How online booking with a deposit works', description: 'What a customer does to book a business with online booking, and what the business sees.',
          step: [
            { '@type': 'HowToStep', name: 'The customer finds the website', text: 'Any time of day or night, the customer lands on the business website and taps Book online.' },
            { '@type': 'HowToStep', name: 'They pick the job and a time', text: 'They choose what they need and a free slot from the real diary. Slots that are taken are already gone.' },
            { '@type': 'HowToStep', name: 'They pay a deposit', text: 'Where the business takes one, a small deposit holds the slot and comes off the bill, so no-shows stop costing a morning.' },
            { '@type': 'HowToStep', name: 'It is in the diary', text: 'The job lands in the business diary with the customer details and the deposit, and the customer gets a confirmation and a reminder.' },
          ] },
      ];
      const body = demoPage(b, x, { n: 2, lead: 'It’s 22:14 and your customer has just got in. Book a job on your own website, then see what’s waiting for you in the morning. About a minute.',
        steps: ['Your website', 'Pick a time', 'Their details', 'Pay', 'Next morning'],
        layers: [LY.site(), LY.web({ details: true }), LY.done(), LY.lock({ ly: 'olock', id: 'ontf', act: 'oapp', app: 'skales', from: '<b>Skales</b>', text: '<span class="ntf-tx" data-otext></span>' }), LY.app()] });
      return L.page(L.head({ b, path: '/try/booking/', title, description, og: 'try-booking', nodes, css: ['try.css'] }), body, L.scripts(b, ['try-kit.js', 'try-booking.js']));
    },
  },
  {
    url: '/try/crm-board/', og: 'try-crm-board', priority: 0.8, changefreq: 'monthly',
    meta: { key: 'try-crm-board', title: 'The CRM board. Try it.', kicker: 'Live demo · about a minute', sub: 'Move a lead from enquiry to done and watch the replies, chasers, reminders and review request send themselves.' },
    render(b){
      const x = DEMOS[2];
      const title = `CRM for trades demo: follow-ups that send themselves | ${site.name}`;
      const description = `A live demo of a CRM for UK service businesses: move a lead from enquiry to quoted, booked and done, and watch the reply, quote chaser, reminder and review request send themselves.`;
      const nodes = [
        L.webPage({ path: '/try/crm-board/', title, description }),
        L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Try it', path: '/try/' }, { name: x.name, path: '/try/crm-board/' }]),
        { '@type': 'HowTo', name: 'How a CRM with automatic follow-up works', description: 'What sends itself as a lead moves through a service business pipeline.',
          step: [
            { '@type': 'HowToStep', name: 'Enquiry', text: 'A new enquiry gets an instant reply, so the customer knows someone has it.' },
            { '@type': 'HowToStep', name: 'Quoted', text: 'The quote goes out as a text with a link, and if the customer goes quiet a polite chaser follows two days later.' },
            { '@type': 'HowToStep', name: 'Booked', text: 'A confirmation goes out straight away and a reminder the day before the job.' },
            { '@type': 'HowToStep', name: 'Done', text: 'The invoice is sent, and a couple of hours later a review request with a link.' },
          ] },
      ];
      const body = demoPage(b, x, { n: 3, lead: 'Be the business for a minute. Move one customer from enquiry to done, and watch what sends itself while you get on with the job.',
        steps: ['Enquiry', 'Quoted', 'Booked', 'Done', 'Their side'],
        layers: [LY.thread()], side: crmBoard, runClass: 'is-board' });
      return L.page(L.head({ b, path: '/try/crm-board/', title, description, og: 'try-crm-board', nodes, css: ['try.css'] }), body, L.scripts(b, ['try-kit.js', 'try-board.js']));
    },
  },
]};
