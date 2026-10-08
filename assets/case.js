/* The automatic case study. Five steps of answers in, a case file out, written entirely in the
   browser. Every pound in it comes from the owner's own numbers with the working shown; the only
   assumptions are the recovery fractions, which are deliberately cautious and printed beside each
   figure. No invented metrics, no prices. The answers live in the URL hash, so the link in the
   "send" message reopens the same file. */
(function(){
  var d = document, S = window.SITE || {}, form = d.getElementById('case'); if (!form) return;
  var KINDS = window.CASEKINDS || [], SVC = window.CASESERVICES || [], BUILDS = window.BUILDS || [];
  var steps = [].slice.call(form.querySelectorAll('.bstep')), bar = d.getElementById('steps'), cur = 0;
  var WEEKS = 48;
  var enc = encodeURIComponent;
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the form ---------- */
  var radio = function(n){ var el = form.querySelector('[name="' + n + '"]:checked'); return el ? el.value : ''; };
  var text = function(id){ return (d.getElementById(id).value || '').trim(); };
  var number = function(id){ var v = parseFloat(d.getElementById(id).value); return isFinite(v) && v >= 0 ? v : NaN; };
  var NEED = [
    function(){ return radio('kind') && text('biz') && text('town'); },
    function(){ return radio('role') && radio('turnover') && radio('team'); },
    function(){ var ok = true; ['job', 'enq', 'won', 'missed', 'admin'].forEach(function(id){ var el = d.getElementById(id), v = number(id), bad = isNaN(v) || ((id === 'job' || id === 'enq') && v <= 0); el.setAttribute('aria-invalid', String(bad)); if (bad) ok = false; }); return ok; },
    function(){ return radio('site') && radio('chase') && radio('booking') && radio('reviews') && radio('repeat'); },
    function(){ return radio('goal') && radio('when'); },
  ];
  function show(i, move){
    cur = i; steps.forEach(function(s, k){ s.hidden = k !== i; });
    [].forEach.call(bar.children, function(li, k){ li.classList.toggle('done', k < i); if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    if (!move) return;
    var h = steps[i].querySelector('h2'); if (h){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 80, behavior: reduce ? 'auto' : 'smooth' });
  }
  function answers(){
    return { kind: radio('kind'), biz: text('biz'), town: text('town'), role: radio('role'), turnover: radio('turnover'), team: radio('team'),
      job: number('job'), enq: number('enq'), won: number('won'), missed: number('missed'), admin: number('admin'),
      site: radio('site'), chase: radio('chase'), booking: radio('booking'), reviews: radio('reviews'), repeat: radio('repeat'),
      goal: radio('goal'), when: radio('when'), note: text('note') };
  }
  function fill(a){
    Object.keys(a).forEach(function(k){
      var r = form.querySelector('[name="' + k + '"][value="' + String(a[k]).replace(/"/g, '') + '"]');
      if (r){ r.checked = true; return; }
      var el = d.getElementById(k); if (el && a[k] != null) el.value = a[k];
    });
  }
  form.addEventListener('click', function(e){
    var n = e.target.closest('[data-next]'), p = e.target.closest('[data-back]');
    if (n){
      var ok = !!NEED[cur](), err = steps[cur].querySelector('.err'); if (err) err.hidden = ok;
      if (!ok) return;
      if (cur === steps.length - 1) return write(answers(), true);
      show(cur + 1, true);
    }
    if (p) show(cur - 1, true);
  });
  form.addEventListener('keydown', function(e){ if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio'){ e.preventDefault(); var n = steps[cur].querySelector('[data-next]'); if (n) n.click(); } });
  form.addEventListener('submit', function(e){ e.preventDefault(); });

  /* ---------- the maths ---------- */
  var round = function(v){ return v >= 10000 ? Math.round(v / 500) * 500 : v >= 1000 ? Math.round(v / 100) * 100 : Math.round(v / 10) * 10; };
  var money = function(v){ return '£' + round(v).toLocaleString('en-GB'); };
  var plain = function(v){ return (Math.round(v * 10) / 10).toLocaleString('en-GB'); };
  var B = function(n){ for (var i = 0; i < BUILDS.length; i++) if (BUILDS[i].n === n) return BUILDS[i]; return null; };
  var svc = function(slug){ for (var i = 0; i < SVC.length; i++) if (SVC[i].slug === slug) return SVC[i]; return { name: '' }; };
  var kindOf = function(k){ for (var i = 0; i < KINDS.length; i++) if (KINDS[i].key === k) return KINDS[i]; return KINDS[KINDS.length - 1]; };
  var TURN = { u100: 'under £100k', '100': '£100k to £250k', '250': '£250k to £1m', '1m': '£1m to £5m', '5m': 'over £5m' };
  var TEAM = { '1': 'run by one person', '2': 'with a team of two to five', '6': 'with a team of six to fifteen', '16': 'with a team of sixteen or more' };
  var GOAL = { more: 'more enquiries', convert: 'winning more of the enquiries that already arrive', time: 'getting the evenings back', premium: 'better jobs at better margins', grow: 'growing the team' };

  function analyse(a){
    var k = kindOf(a.kind), won = Math.min(a.won, a.enq), conv = a.enq > 0 ? won / a.enq : 0, pct = Math.round(conv * 100);
    var team = +a.team || 1, leaks = [];
    var sectorTool = k.demo, sectorSite = { professional: 21, clinic: 22, garage: 24, electrical: 23 }[a.kind] || 13;

    if (a.missed > 0 && conv > 0){
      var mv = a.missed * conv * a.job * WEEKS;
      leaks.push({ key: 'missed', title: 'Calls that ring out', gross: mv, back: mv / 3, frac: 'one in three',
        working: plain(a.missed) + ' missed calls a week × ' + pct + '% (your own win rate) × ' + money(a.job) + ' × ' + WEEKS + ' weeks',
        why: 'Most people who reach voicemail do not leave a message; they ring the next name on Google. These are not lost jobs on paper, they are enquiries that never happened.',
        fix: { svc: 'follow-up-automation', name: 'Missed-call text-back', what: 'Every call you cannot take gets a text back inside a minute, from your number, asking what the job is. The reply lands in one list, so you ring back a warm lead instead of a stranger.' },
        proof: [25, 12] });
    }
    var lost = Math.max(0, a.enq - won);
    if (lost > 0 && a.chase !== 'always'){
      var qv = lost * a.job * WEEKS, f = a.chase === 'rarely' ? 10 : 20;
      leaks.push({ key: 'quotes', title: 'Quotes that go quiet', gross: qv, back: qv / f, frac: 'one in ' + f,
        working: plain(lost) + ' enquiries a week not won × ' + money(a.job) + ' × ' + WEEKS + ' weeks of work asked about and not won',
        why: a.chase === 'rarely' ? 'Quotes are sent and then left. A customer who meant to say yes and got busy is the cheapest job you will ever win, and nobody is asking them.' : 'Quotes get chased when there is time, which is the week there is least of it. The ones that slip are usually the ones that just needed a nudge.',
        fix: { svc: 'booking-and-pipeline', name: 'Quotes that chase themselves', what: 'Every enquiry sits in one pipeline with what happened to it. A quote that goes quiet gets a polite follow-up on day two and day seven without anyone remembering to send it.' },
        proof: a.kind === 'kitchens' ? [1, 2] : a.kind === 'roofing' ? [35, 2] : [2, 27] });
    }
    if (a.repeat !== 'no' && won > 0){
      var cust = won * WEEKS, rf = a.repeat === 'yes' ? 5 : 10, rv = cust * a.job / rf;
      var rem = { heating: 31, garage: 32, salon: 33, hospitality: 34 }[a.kind] || 26;
      leaks.push({ key: 'repeat', title: 'Customers who should come back on their own', gross: null, back: rv, frac: 'one in ' + rf,
        working: plain(won) + ' jobs a week × ' + WEEKS + ' weeks = ' + Math.round(cust).toLocaleString('en-GB') + ' customers a year; one in ' + rf + ' coming back × ' + money(a.job),
        why: 'The work comes round again, but the reminder lives in your head. The customer does not forget you on purpose; somebody else just got to them first.',
        fix: { svc: 'follow-up-automation', name: 'Service reminders and rebooks', what: 'Every customer is logged with when they are next due. The reminder goes out before they think to search, and the reply books straight into the diary.' },
        proof: [rem, 29] });
    }
    if (a.admin > 0){
      var hrs = a.admin * WEEKS;
      leaks.push({ key: 'admin', title: 'The admin', gross: null, back: null, hours: hrs, hoursBack: hrs / 2,
        working: plain(a.admin) + ' hours a week × ' + WEEKS + ' weeks = ' + Math.round(hrs).toLocaleString('en-GB') + ' hours a year',
        why: team >= 6 ? 'With a team this size the admin is mostly coordination: who is where, what is booked, what has been invoiced. It grows with every hire.' : 'Quotes, diary, invoices and chasing, mostly done in the evening, mostly by the person who should be doing the work or winning more of it.',
        fix: team >= 6
          ? { svc: 'booking-and-pipeline', name: 'One board for the whole team', what: 'Jobs, engineers and the week on one screen. Drag a job and the week re-plans; the office stops ringing round to find out who is where.' }
          : { svc: 'booking-and-pipeline', name: 'Paperwork that writes itself', what: 'The job sheet is filled in on site, the customer report and the invoice come out of it, and nothing is typed twice.' },
        proof: team >= 6 ? [3, 30] : [15, 4] });
    }
    if (a.site !== 'good'){
      leaks.push({ key: 'site', title: { none: 'No website at all', diy: 'A page-builder website', agency: 'A website from a few years ago' }[a.site], gross: null, back: null,
        working: '',
        why: { none: 'Every recommendation you get is checked on Google before they ring. Right now there is nothing there to check, so a share of them never ring.', diy: 'A page-builder site looks like a thousand others and loads like one. It holds the details, but it is not built to turn a visit into a name and a number.', agency: 'It was built for how people searched then. On a phone today, the number, the area you cover and a reason to choose you should be one thumb away.' }[a.site],
        fix: { svc: 'capture-website', name: 'A website built to capture the enquiry', what: 'Hand-built, fast on a phone, a three-field form and a one-tap call, and every page written to answer what your customer typed into Google. Owned by you from day one.' },
        proof: [sectorSite, 13 === sectorSite ? 23 : 13] });
    }
    if (a.booking === 'no' && k.bookable){
      leaks.push({ key: 'booking', title: 'Every booking is a phone call', gross: null, back: null, working: '',
        why: 'Customers who would happily pick a slot at eleven at night have to wait until you can answer. Some wait; some book whoever lets them.',
        fix: { svc: 'booking-and-pipeline', name: 'Online booking with a deposit', what: 'Slots generated from your real diary, a deposit that holds the slot, and the confirmation sent for you. No phone tag.' },
        proof: [{ salon: 33, hospitality: 34 }[a.kind] || 14, 29] });
    }
    if (a.reviews === 'few'){
      leaks.push({ key: 'reviews', title: 'Too few reviews to win the comparison', gross: null, back: null, working: '',
        why: 'Customers compare the top three on Google and read the reviews before they ring. With under twenty, you lose to firms who are not better than you, only better reviewed.',
        fix: { svc: 'follow-up-automation', name: 'Review requests at the right moment', what: 'A finished job gets a request the same day, while the customer is still pleased, with a link straight to the box. Replies are drafted for you to send.' },
        proof: [26, 11] });
    }

    /* order: money first, then what the owner said matters most */
    var boost = { more: ['site', 'reviews', 'missed'], convert: ['quotes', 'missed', 'booking'], time: ['admin', 'booking', 'quotes'], premium: ['site', 'reviews', 'quotes'], grow: ['admin', 'missed', 'quotes'] }[a.goal] || [];
    var score = function(l){ return (l.back || 0) + (l.hoursBack ? l.hoursBack * 25 : 0) + (boost.indexOf(l.key) > -1 ? (3 - boost.indexOf(l.key)) * 4000 : 0); };
    leaks.sort(function(x, y){ return score(y) - score(x); });

    var back = leaks.reduce(function(s, l){ return s + (l.back || 0); }, 0);
    var hoursBack = leaks.reduce(function(s, l){ return s + (l.hoursBack || 0); }, 0);
    var decider = a.role === 'owner' || a.role === 'director', ready = a.when !== 'looking';
    return { k: k, conv: conv, pct: pct, won: won, team: team, leaks: leaks, back: back, hoursBack: hoursBack, sectorTool: sectorTool,
      verdict: !decider ? 'owner' : !ready ? 'later' : (back < 3000 && hoursBack < 100 ? 'small' : 'fit') };
  }

  /* ---------- the file ---------- */
  var ref = function(a){ var h = 0, s = (a.biz + '|' + a.town).toLowerCase(); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return 'SK-' + (h % 9000 + 1000); };
  var dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  function proofCard(n){
    var x = B(n); if (!x) return '';
    return '<a class="cf-proof" href="' + S.base + 'work/' + x.slug + '/" style="--pc:' + x.c + '"><span class="ph"><img src="' + S.base + 'assets/phones/' + (x.n < 10 ? '0' : '') + x.n + '.webp" width="585" height="1266" alt="' + esc(x.name) + ' on a phone" loading="lazy" decoding="async"></span><span class="cap"><b>' + esc(x.name) + '</b><span>' + esc(x.short) + '</span></span></a>';
  }
  function situation(a, r){
    var k = r.k, out = [];
    out.push('<strong>' + esc(a.biz) + '</strong> is a ' + esc(k.label.toLowerCase()) + ' business in ' + esc(a.town) + ', ' + TEAM[a.team] + ', turning over ' + TURN[a.turnover] + '.');
    out.push('Around ' + plain(a.enq) + ' enquiries arrive in a normal week and ' + plain(r.won) + ' become work: a ' + r.pct + '% win rate, at about ' + money(a.job) + ' a job.');
    var bits = [];
    if (a.missed > 0) bits.push(plain(a.missed) + ' calls a week go unanswered');
    if (a.chase !== 'always') bits.push('quotes are chased ' + (a.chase === 'rarely' ? 'rarely, if at all' : 'when there is time'));
    if (a.admin > 0) bits.push(plain(a.admin) + ' hours a week go on admin');
    if (bits.length){ var line = bits.length > 1 ? bits.slice(0, -1).join('; ') + '; and ' + bits[bits.length - 1] : bits[0]; out.push(line.charAt(0).toUpperCase() + line.slice(1) + '.'); }
    out.push('The aim for the next twelve months is ' + GOAL[a.goal] + '.');
    return out.join(' ');
  }
  function write(a, push){
    var r = analyse(a), f = d.getElementById('file'), costed = r.leaks.filter(function(l){ return l.back || l.hours; }), plainL = r.leaks.filter(function(l){ return !l.back && !l.hours; });
    var phases = [r.leaks.slice(0, 1), r.leaks.slice(1, 3), r.leaks.slice(3)].filter(function(p){ return p.length; });
    var PH = ['First', 'Next', 'After that'];
    var link = location.href.split('#')[0] + '#f=' + pack(a);
    if (!r.leaks.length && r.verdict === 'fit') r.verdict = 'small';
    var verdict = {
      fit: ['This is a fit.', 'You run it, there is real money on the table and you would start soon. The next step is a call: twenty minutes on this file, what to build first, and a flat quote with a date on it. Bring the file.'],
      small: ['A fit, with a small brief.', 'The leaks on these numbers are modest, which usually means the business is already run well. A call will tell you in twenty minutes whether one piece is worth building, or whether a free teardown covers it.'],
      later: ['Keep this file.', 'You said you are looking for now, which is the right time to read it and the wrong time for a call. Save it; when you are ready, the link opens the same file and the call starts from it.'],
      owner: ['Put this in front of the owner.', 'Everything in here is only worth doing if the person who signs it off has read it. Send them the link: it opens this exact file, with your answers, on their phone.'],
    }[r.verdict];
    var html = ''
      + '<header class="cf-top cf-in">'
      +   '<div class="cf-id"><span>Case file</span><b>' + ref(a) + '</b><span>' + dateStr + '</span></div>'
      +   '<h2 class="cf-h">' + esc(a.biz) + '<span>' + esc(a.town) + ' &middot; ' + esc(r.k.label) + '</span></h2>'
      +   '<dl class="cf-facts"><div><dt>Win rate</dt><dd>' + r.pct + '%</dd></div><div><dt>Average job</dt><dd>' + money(a.job) + '</dd></div><div><dt>Enquiries a week</dt><dd>' + plain(a.enq) + '</dd></div><div><dt>Turnover</dt><dd>' + TURN[a.turnover].replace(/^./, function(c){ return c.toUpperCase(); }) + '</dd></div></dl>'
      + '</header>'
      + '<section class="cf-sec cf-in"><p class="cf-n">01 &middot; The situation</p><p class="cf-lead">' + situation(a, r) + '</p>' + (a.note ? '<blockquote class="cf-note">&ldquo;' + esc(a.note) + '&rdquo;</blockquote>' : '') + '</section>'
      + '<section class="cf-sec cf-in"><p class="cf-n">02 &middot; What is leaking</p>'
      +   (r.back > 0 ? '<div class="cf-big"><span class="cf-figure" data-to="' + round(r.back) + '">' + money(r.back) + '</span><span class="cf-cap">a year, on cautious assumptions, from your own numbers' + (r.hoursBack ? ', plus about <b>' + Math.round(r.hoursBack).toLocaleString('en-GB') + ' hours</b> of admin handed to systems' : '') + '.</span></div>' : (r.hoursBack ? '<div class="cf-big"><span class="cf-figure">' + Math.round(r.hoursBack).toLocaleString('en-GB') + ' hours</span><span class="cf-cap">a year of admin that systems could take, from your own numbers.</span></div>' : ''))
      +   (r.leaks.length ? '' : '<p class="cf-lead">On these answers, nothing is leaking that a build would fix. That is rare, and a good sign: the business is already run tightly.</p>')
      +   '<ol class="cf-leaks">' + costed.map(function(l){
            return '<li><div class="cf-lh"><b>' + esc(l.title) + '</b>' + (l.back ? '<span class="cf-v">' + money(l.back) + '<small>/yr back if ' + l.frac + ' is recovered</small></span>' : '<span class="cf-v">' + Math.round(l.hoursBack).toLocaleString('en-GB') + ' hrs<small>/yr back if half of it goes</small></span>') + '</div>'
              + '<p>' + esc(l.why) + '</p><p class="cf-work"><span>Working</span>' + esc(l.working) + (l.gross ? ' &rarr; <b>' + money(l.gross) + '</b> a year' : '') + '</p></li>';
          }).join('') + plainL.map(function(l){ return '<li><div class="cf-lh"><b>' + esc(l.title) + '</b><span class="cf-v cf-q">Not costed</span></div><p>' + esc(l.why) + '</p></li>'; }).join('') + '</ol>'
      +   '<p class="hint">Every figure uses your own numbers and ' + WEEKS + ' working weeks. The recovery fractions are deliberately cautious assumptions, printed beside each one, not promises.</p>'
      + '</section>'
      + (phases.length ? '<section class="cf-sec cf-in"><p class="cf-n">03 &middot; What ' + esc(S.name || 'Skales') + ' would build</p>'
      +   phases.map(function(p, i){ return '<div class="cf-phase"><p class="cf-pn">' + PH[i] + '</p><div class="cf-pb">' + p.map(function(l){
            return '<article class="cf-build"><div class="cf-bt"><h3>' + esc(l.fix.name) + '</h3><p class="cf-for">Fixes: ' + esc(l.title.toLowerCase()) + ' &middot; part of <a class="lnk" href="' + S.base + 'services/' + ({ 'capture-website': 'websites', 'booking-and-pipeline': 'booking-and-crm' }[l.fix.svc] || l.fix.svc) + '/">' + esc(svc(l.fix.svc).name) + '</a></p><p>' + esc(l.fix.what) + '</p></div>'
              + '<div class="cf-proofs">' + l.proof.map(proofCard).join('') + '</div></article>';
          }).join('') + '</div></div>'; }).join('')
      +   '<p class="hint">The builds above are running on this site for invented businesses, so you can try each piece before anything is built for you. Yours is built for your business, in your name, and you own it from day one.</p>'
      + '</section>' : '')
      + '<section class="cf-sec cf-in cf-end cf-' + r.verdict + '"><p class="cf-n">04 &middot; The verdict</p><h3 class="cf-vh">' + verdict[0] + '</h3><p class="cf-lead">' + verdict[1] + '</p>'
      +   '<div class="cta-row cf-cta">'
      +     (r.verdict === 'owner' ? '<button class="btn btn-live" type="button" data-copy>Copy the link for the owner</button>' : r.verdict === 'later' ? '<button class="btn btn-live" type="button" data-copy>Copy the link to this file</button>' : '<a class="btn btn-live" href="' + S.base + 'book/">Book the call</a>')
      +     '<a class="btn btn-ghost" data-send href="#">Send me this file</a>'
      +     '<button class="btn btn-ghost" type="button" data-print>Save as PDF</button>'
      +   '</div>'
      +   (r.verdict === 'later' || r.verdict === 'small' ? '<p class="f-note">Or start smaller: <a class="lnk" href="' + S.base + 'teardown.html">a free teardown by message</a>.</p>' : '')
      +   '<p class="f-note"><button class="cf-redo" type="button" data-redo>Change an answer</button></p>'
      + '</section>';
    f.innerHTML = html; f.hidden = false;
    d.getElementById('caseWrap').hidden = true; d.getElementById('caseHead').hidden = true;
    if (push) history.replaceState(null, '', '#f=' + pack(a));
    var msg = 'Case file ' + ref(a) + ' — ' + a.biz + ', ' + a.town + '\n' + r.k.label + ' · ' + TURN[a.turnover] + ' · team ' + ({ '1': '1', '2': '2–5', '6': '6–15', '16': '16+' }[a.team]) + ' · ' + ({ owner: 'owner', director: 'director/partner', manager: 'manager', other: 'other' }[a.role])
      + '\n' + plain(a.enq) + ' enquiries/wk, ' + plain(r.won) + ' won, ' + money(a.job) + ' a job, ' + plain(a.missed) + ' missed calls/wk, ' + plain(a.admin) + ' hrs admin/wk'
      + '\nAt stake (cautious): ' + money(r.back) + '/yr' + (r.hoursBack ? ' + ' + Math.round(r.hoursBack) + ' hrs' : '') + '\nStart: ' + ({ now: 'now', quarter: 'within three months', looking: 'just looking' }[a.when])
      + (a.note ? '\nNote: ' + a.note : '') + '\n\nThe file: ' + link;
    var wa = S.whatsapp && String(S.whatsapp).replace(/\D/g, ''), send = f.querySelector('[data-send]');
    send.href = wa ? 'https://wa.me/' + wa + '?text=' + enc(msg) : 'mailto:' + S.email + '?subject=' + enc('Case file ' + ref(a) + ' — ' + a.biz) + '&body=' + enc(msg);
    f.onclick = function(e){
      if (e.target.closest('[data-print]')) window.print();
      var c = e.target.closest('[data-copy]');
      if (c){ var done = function(){ c.textContent = 'Link copied'; }; if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, function(){ prompt('Copy this link', link); }); else prompt('Copy this link', link); }
      if (e.target.closest('[data-redo]')){ f.hidden = true; d.getElementById('caseWrap').hidden = false; d.getElementById('caseHead').hidden = false; fill(a); show(0, true); }
    };
    reveal(f);
    window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 80, behavior: 'auto' });
    var h = f.querySelector('.cf-h'); if (h){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function reveal(f){
    var parts = f.querySelectorAll('.cf-in');
    if (reduce){ [].forEach.call(parts, function(p){ p.classList.add('on'); }); return; }
    [].forEach.call(parts, function(p, i){ setTimeout(function(){ p.classList.add('on'); }, 120 + i * 180); });
    var fig = f.querySelector('.cf-figure[data-to]'); if (!fig) return;
    var to = +fig.getAttribute('data-to'), t0 = null;
    var tick = function(t){ if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 800), e = 1 - Math.pow(1 - p, 3); fig.textContent = '£' + Math.round(to * e).toLocaleString('en-GB'); if (p < 1) requestAnimationFrame(tick); };
    setTimeout(function(){ requestAnimationFrame(tick); }, 120 + 2 * 180);
  }

  /* ---------- the link ---------- */
  function pack(a){ return btoa(unescape(enc(JSON.stringify(a)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unpack(s){ try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e){ return null; } }
  var m = location.hash.match(/^#f=([\w-]+)/), saved = m && unpack(m[1]);
  var okSaved = saved && saved.biz && +saved.enq > 0 && +saved.job > 0 && TURN[saved.turnover] && TEAM[saved.team] && GOAL[saved.goal] && KINDS.some(function(k){ return k.key === saved.kind; });
  if (okSaved){ ['job', 'enq', 'won', 'missed', 'admin'].forEach(function(k){ saved[k] = Math.max(0, +saved[k] || 0); }); fill(saved); write(saved, false); } else show(0);
})();
