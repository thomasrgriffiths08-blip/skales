/* /your-case/ — the automatic case study. An owner answers questions about how work comes in and
   where it goes; assets/case.js writes them a case file in the browser: what is leaking (in pounds,
   from their own numbers, the working shown), what Skales would build first, and the builds that
   prove each piece. Nothing is sent anywhere until they choose to send it. Not in the nav: it is
   for owners who will act on it, and is handed to them directly. */
const L = require('../lib.js');
const { site, esc } = L;
const trades = require('../../data/trades.js');

/* what kind of business: the forge's trades (each knows its own demo) plus the non-trade sectors the
   builds already cover. `bookable`: customers would happily pick a slot themselves. */
const KINDS = [
  ...trades.filter(t => t.key !== 'other').map(t => ({ key: t.key, label: t.label, demo: t.demo, bookable: ['heating', 'cleaning', 'salon', 'garage'].includes(t.key), recurs: ['heating', 'cleaning', 'salon', 'garage', 'garden'].includes(t.key) })),
  { key: 'clinic', label: 'Clinic or physio', demo: 22, bookable: true, recurs: true },
  { key: 'professional', label: 'Accountant or professional firm', demo: 21, bookable: false, recurs: true },
  { key: 'hospitality', label: 'Restaurant, bar or café', demo: 34, bookable: true, recurs: true },
  { key: 'other', label: 'Another service business', demo: 25, bookable: false, recurs: false },
];

module.exports = { KINDS, pages: [{
  url: '/your-case/', og: 'your-case', priority: 0.6, changefreq: 'monthly',
  meta: { key: 'your-case', title: 'Your business, written up as a case study.', kicker: 'For owners · about four minutes', sub: 'What is leaking, in pounds from your own numbers. What to build first. The proof.' },
  render(b){
    const title = `Your case study — what Skales would build for you | ${site.name}`;
    const description = `For owners of UK service businesses. Answer questions about how work comes in; get a case file: what is leaking, what to build first, and the proof.`;
    const nodes = [
      L.webPage({ path: '/your-case/', title, description }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Your case study', path: '/your-case/' }]),
    ];
    const chips = (name, opts, multi) => opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${esc(v)}"><span>${esc(t)}</span></label>`; }).join('');
    const q = (label, inner, hint = '') => `<div class="cq"><p class="cq-l">${label}${hint ? ` <span class="opt">${hint}</span>` : ''}</p>${inner}</div>`;
    const num = (id, label, ph, pre = '', hint = '') => `<div class="field"><label for="${id}">${label}${hint ? ` <span class="opt">${hint}</span>` : ''}</label><div class="num${pre ? ' has-pre' : ''}">${pre ? `<span class="pre">${pre}</span>` : ''}<input id="${id}" name="${id}" type="number" inputmode="decimal" min="0" step="any" required placeholder="${ph}"></div></div>`;
    const nav = (back, next = 'Next') => `<p class="err" hidden>Answer each one to carry on.</p><div class="bnav">${back ? '<button class="btn btn-ghost" type="button" data-back>Back</button>' : ''}<button class="btn btn-live" type="button" data-next>${next}</button></div>`;
    const body = `
${L.header(b, '')}
<main id="main">
<section class="hero-w wrap case-head" id="caseHead">
  <p class="spec"><span class="lamp"></span>For owners who intend to act on it</p>
  <h1>Your business, written up as a case study.</h1>
  <p class="lead">Five short sets of questions about how work comes in and where it goes. At the end you get a case file written for your business: <strong>what is leaking, in pounds from your own numbers, what to build first, and the working builds that prove each piece</strong>. About four minutes.</p>
</section>

<section class="wrap book-wrap case-wrap" id="caseWrap">
  <form class="book" id="case" novalidate>
    <ol class="book-steps" id="steps" aria-label="Progress"><li aria-current="step">The business</li><li>You</li><li>The numbers</li><li>How it runs</li><li>Where it goes</li></ol>

    <fieldset class="bstep" data-step="1">
      <legend><h2>The business.</h2></legend>
      ${q('What kind of business is it?', `<div class="chips">${chips('kind', KINDS.map(k => [k.key, k.label]))}</div>`)}
      <div class="fields" style="margin-top:24px">
        <div class="field"><label for="biz">Business name</label><input id="biz" name="biz" autocomplete="organization" required placeholder="e.g. Hollins Heating"></div>
        <div class="field"><label for="town">Town or area</label><input id="town" name="town" autocomplete="address-level2" required placeholder="e.g. Wakefield"></div>
      </div>
      ${nav(false)}
    </fieldset>

    <fieldset class="bstep" data-step="2" hidden>
      <legend><h2>You, and the size of it.</h2></legend>
      ${q('Your role', `<div class="chips">${chips('role', [['owner', 'Owner or founder'], ['director', 'Director or partner'], ['manager', 'Manager'], ['other', 'Something else']])}</div>`)}
      ${q('Turnover last year', `<div class="chips">${chips('turnover', [['u100', 'Under £100k'], ['100', '£100k – £250k'], ['250', '£250k – £1m'], ['1m', '£1m – £5m'], ['5m', '£5m or more']])}</div>`, '(a band is fine, it stays in your browser)')}
      ${q('The team', `<div class="chips">${chips('team', [['1', 'Just me'], ['2', '2 to 5'], ['6', '6 to 15'], ['16', '16 or more']])}</div>`)}
      ${nav(true)}
    </fieldset>

    <fieldset class="bstep" data-step="3" hidden>
      <legend><h2>The numbers.</h2></legend>
      <p class="hint" style="margin:-8px 0 20px">Your best honest guess for a normal week. The case file is only as good as these.</p>
      <div class="fields">
        ${num('job', 'Average job or order value', '350', '£')}
        ${num('enq', 'New enquiries a week', '12', '', '(calls, forms, messages)')}
        ${num('won', 'How many of those become jobs', '5')}
        ${num('missed', 'Calls you miss a week', '6', '', '(on a tool, driving, after hours)')}
        ${num('admin', 'Hours a week on admin', '8', '', '(quotes, chasing, diary, invoices)')}
      </div>
      ${nav(true)}
    </fieldset>

    <fieldset class="bstep" data-step="4" hidden>
      <legend><h2>How it runs today.</h2></legend>
      ${q('The website', `<div class="chips">${chips('site', [['none', 'There isn’t one'], ['diy', 'A page-builder site'], ['agency', 'Built by someone, a while ago'], ['good', 'One I am proud of']])}</div>`)}
      ${q('Quotes that go quiet', `<div class="chips">${chips('chase', [['always', 'Always chased, within days'], ['sometimes', 'Sometimes, when I remember'], ['rarely', 'Rarely or never']])}</div>`)}
      ${q('Can a customer book themselves?', `<div class="chips">${chips('booking', [['yes', 'Yes, online'], ['no', 'No, it is all by phone'], ['na', 'Not how we work']])}</div>`)}
      ${q('Google reviews', `<div class="chips">${chips('reviews', [['few', 'Fewer than 20'], ['some', '20 to 100'], ['many', 'More than 100']])}</div>`)}
      ${q('Does the work come round again?', `<div class="chips">${chips('repeat', [['yes', 'Yes: services, renewals, rebooks'], ['some', 'Sometimes'], ['no', 'Mostly one-off jobs']])}</div>`)}
      ${nav(true)}
    </fieldset>

    <fieldset class="bstep" data-step="5" hidden>
      <legend><h2>Where it is going.</h2></legend>
      ${q('The one thing that would make the next twelve months', `<div class="chips">${chips('goal', [['more', 'More enquiries'], ['convert', 'Win more of the ones I get'], ['time', 'My evenings back'], ['premium', 'Better jobs at better margins'], ['grow', 'Grow the team']])}</div>`)}
      ${q('When would you start, if it made sense?', `<div class="chips">${chips('when', [['now', 'Now'], ['quarter', 'In the next three months'], ['looking', 'Just looking for now']])}</div>`)}
      <div class="field" style="margin-top:24px"><label for="note">Anything the numbers miss <span class="opt">(optional)</span></label><textarea id="note" name="note" placeholder="e.g. Two vans, want a third by spring. The phone runs my life."></textarea></div>
      ${nav(true, 'Write my case file')}
    </fieldset>
  </form>
  <aside class="book-side">
    <div class="nameplate one">
      <div><dt>What you get</dt><dd>A case file for your business: the situation, the leaks costed from your own numbers with the working shown, a build order, and the running demos that prove it.</dd></div>
      <div><dt>Who it is for</dt><dd>Owners and partners who will act on what it says. If that is not you yet, it will tell you so, politely.</dd></div>
      <div><dt>Your answers</dt><dd>Stay in your browser. Nothing is sent until you choose to send the file.</dd></div>
    </div>
  </aside>
</section>

<section class="wrap cf-wrap" id="file" hidden aria-live="polite"></section>
</main>
${L.footer(b)}
<script>window.CASEKINDS=${JSON.stringify(KINDS)};window.CASESERVICES=${JSON.stringify(site.services.map(s => ({ slug: s.slug, name: s.name, short: s.short })))};</script>`;
    return L.page(L.head({ b, path: '/your-case/', title, description, og: 'your-case', nodes, css: ['case.css'] }), body, L.scripts(b, ['builds.js', 'case.js']));
  }
}]};
