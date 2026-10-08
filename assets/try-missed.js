/* /try/missed-call/ — be your own customer. The visitor names their business, calls it on a pretend
   phone, lets it ring out, gets the text-back, books and (where the trade takes one) pays a deposit,
   then sees the same minute from the business's side in the Skales CRM. Every time printed is the
   visitor's real clock, so "missed at 21:47, booked 70 seconds later" is what actually happened on
   their screen. Nothing leaves the browser. */
(function(){
  var d = document, S = window.SITE || {}, KINDS = window.TRYKINDS || [], JOBS = window.TRYJOBS || {};
  var $ = function(id){ return d.getElementById(id); };
  var setup = $('setup'), run = $('run'), end = $('end'), form = $('setupForm');
  if (!setup || !run || !form) return;
  var ph = $('ph'), scr = ph.querySelector('.ph-scr'), sb = $('sb'), fit = $('fit');
  var say = $('say'), hint = $('hint'), toast = $('toast');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var store = { get: function(k){ try { return JSON.parse(sessionStorage.getItem(k)); } catch (e){ return null; } }, set: function(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e){} } };
  function track(name, props){
    props = Object.assign({ demo: 'missed-call' }, props || {});
    try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, props)); } catch (e){}
    try { if (window.fbq) fbq('trackCustom', name, props); } catch (e){}
    try { if (window.gtag) gtag('event', name, props); } catch (e){}
    try { if (window.plausible) plausible(name, { props: props }); } catch (e){}
  }

  /* ---------- time: the visitor's own clock ---------- */
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var hm = function(t){ return pad(t.getHours()) + ':' + pad(t.getMinutes()); };
  var hms = function(t){ return hm(t) + ':' + pad(t.getSeconds()); };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function tick(){
    var n = new Date();
    [].forEach.call(d.querySelectorAll('[data-clock]'), function(e){ e.textContent = hm(n); });
    [].forEach.call(d.querySelectorAll('[data-date]'), function(e){ e.textContent = DAYS[n.getDay()] + ' ' + n.getDate() + ' ' + MON[n.getMonth()]; });
  }
  tick(); setInterval(tick, 5000);

  /* ---------- set-up ---------- */
  var kind = (store.get('st-a') || {}).kind || store.get('try-kind') || 'heating';
  if (!JOBS[kind]) kind = 'other';
  var chips = [].slice.call(form.querySelectorAll('.tm-k'));
  function pick(k){ kind = k; chips.forEach(function(c){ c.setAttribute('aria-pressed', String(c.getAttribute('data-kind') === k)); }); }
  pick(kind);
  chips.forEach(function(c){ c.addEventListener('click', function(){ pick(c.getAttribute('data-kind')); }); });
  var nameIn = $('bizName');
  if (store.get('try-biz')) nameIn.value = store.get('try-biz');

  var A, timers = [];
  function later(fn, ms){ timers.push(setTimeout(fn, reduce ? Math.min(ms, 600) : ms)); }
  function clear(){ timers.forEach(clearTimeout); timers = []; }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var biz = nameIn.value.replace(/\s+/g, ' ').trim().slice(0, 32) || 'Larchfield Heating';
    store.set('try-biz', nameIn.value.trim()); store.set('try-kind', kind);
    start(biz);
  });

  function start(biz){
    clear();
    var J = JOBS[kind] || JOBS.other;
    var slug = biz.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'yourbusiness';
    var h = 0; for (var i = 0; i < biz.length; i++) h = (h * 31 + biz.charCodeAt(i)) >>> 0;
    A = { biz: biz, J: J, dep: J.dep, site: slug + '.co.uk/book', bizNo: '07700 900 ' + (100 + h % 900), custNo: '07700 900 418', t: {}, job: null, day: null, slot: null };
    bind('[data-biz]', biz); bind('[data-initial]', biz.charAt(0).toUpperCase()); bind('[data-bizno]', A.bizNo);
    bind('[data-site]', A.site); bind('[data-custno]', 'New caller');
    A.sms = "Hi, it's " + biz + ". Sorry we missed your call, we're " + J.text + " right now. Book a time that suits you here and it's confirmed straight away: " + A.site;
    bind('[data-sms]', A.sms);
    $('feed').innerHTML = '<li class="crm-empty">Nothing yet. Make the call.</li>';
    $('tags').innerHTML = ''; stage('', 'Quiet'); $('leadsub').textContent = 'Waiting for a call'; $('lead').classList.remove('is-new');
    buildBooking(); diary(A.days[0], null);
    setup.hidden = true; end.hidden = true; run.hidden = false; run.classList.remove('is-owner');
    d.body.classList.add('tm-on');
    if (location.hash !== '#demo') history.pushState({ tm: 1 }, '', '#demo');
    show('contact'); step(0);
    narrate('You’re the customer. You need a ' + J.jobs[0][0].toLowerCase() + '. Call ' + biz + '.', 'Tap the green call button.');
    fitPhone(); scrollTo(0, run.getBoundingClientRect().top + pageYOffset - 64);
    track('demo_started', { kind: kind });
  }
  addEventListener('popstate', function(){ if (location.hash !== '#demo'){ clear(); run.hidden = true; end.hidden = true; setup.hidden = false; d.body.classList.remove('tm-on'); } });
  $('again').addEventListener('click', function(){ end.hidden = true; setup.hidden = false; history.replaceState(null, '', location.pathname); scrollTo(0, 0); nameIn.focus({ preventScroll: true }); });

  function bind(sel, v){ [].forEach.call(d.querySelectorAll(sel), function(e){ e.textContent = v; }); }

  /* ---------- the phone ---------- */
  var layers = {}; [].forEach.call(ph.querySelectorAll('[data-ly]'), function(l){ layers[l.getAttribute('data-ly')] = l; });
  var DARK = { call: 1, lock: 1 };
  function show(name){
    var kb = ph.contains(d.activeElement);
    Object.keys(layers).forEach(function(k){ layers[k].hidden = k !== name; });
    sb.classList.toggle('is-light', !!DARK[name]); scr.classList.toggle('is-dark', !!DARK[name]);
    if (kb){ var f = layers[name].querySelector('button:not([disabled]):not([hidden])'); if (f) f.focus({ preventScroll: true }); }
  }
  function fitPhone(){
    var wide = innerWidth >= 1000, vh = (window.visualViewport ? visualViewport.height : innerHeight);
    var avH = wide ? vh - 64 - 56 : vh - 64 - d.querySelector('.tm-narr').offsetHeight - 36;
    var avW = Math.min(run.clientWidth - 32, 373);
    var s = Math.max(.62, Math.min(1, avW / 373, avH / 781)); if (s > .985) s = 1;
    fit.style.setProperty('--s', s.toFixed(3)); ph.style.setProperty('--s', s.toFixed(3));
  }
  addEventListener('resize', function(){ if (!run.hidden) fitPhone(); });

  var stepEls = [].slice.call(d.querySelectorAll('.tm-steps li'));
  function step(n){ stepEls.forEach(function(li, i){ li.classList.toggle('on', i <= n); li.classList.toggle('now', i === n); }); track('demo_step', { step: n }); }
  function narrate(s, h){ say.textContent = s; hint.textContent = h || ''; }

  /* ---------- the business's side ---------- */
  var IC = {
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    msg: '<path d="M4 5h16v11H8l-4 4z"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    diary: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
  };
  var ic = function(n){ return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; };
  var COL = { red: ['#FDECEC', '#B42318'], blu: ['#ECEBFE', '#3B18E0'], grn: ['#E7F6EE', '#13744A'], gry: ['#F2F0EC', '#5d5a54'], amb: ['#FEF3E2', '#9A5B07'] };
  function feed(icon, col, html, t, quiet){ /* quiet: false = no toast; a string = the toast's words */
    var f = $('feed'), e = f.querySelector('.crm-empty'); if (e) e.remove();
    var c = COL[col], li = d.createElement('li');
    li.innerHTML = '<span class="fi-i" style="background:' + c[0] + ';color:' + c[1] + '">' + ic(icon) + '</span><p>' + html + '</p><time>' + hms(t) + '</time>';
    f.insertBefore(li, f.firstChild);
    if (typeof quiet === 'string') ping(quiet);
  }
  function tag(cls, icon, text){ var s = d.createElement('span'); s.className = 'tg ' + cls; s.innerHTML = (icon ? ic(icon) : '') + esc(text); $('tags').appendChild(s); }
  function stage(cls, text){ var s = $('stage'); s.className = 'crm-stage' + (cls ? ' s-' + cls : ''); s.textContent = text; }
  var tt;
  function ping(text){
    if (innerWidth >= 1000) return;
    clearTimeout(tt); toast.hidden = false; toast.classList.remove('is-out');
    toast.innerHTML = '<span><b>Your CRM</b> · ' + esc(text) + '</span>';
    tt = setTimeout(function(){ toast.classList.add('is-out'); tt = setTimeout(function(){ toast.hidden = true; }, 320); }, 2800);
  }
  function secs(a, b){ var s = Math.max(1, Math.round((b - a) / 1000)); return s + (s === 1 ? ' second' : ' seconds'); }

  /* ---------- 1 · the call ---------- */
  ph.addEventListener('click', function(e){
    var b = e.target.closest('[data-act]'); if (!b || !A) return;
    var act = b.getAttribute('data-act');
    if (act === 'call') call();
    else if (act === 'hangup') missed(true);
    else if (act === 'open') openMsg();
    else if (act === 'link') openLink();
    else if (act === 'continue') goPay();
    else if (act === 'cancelpay') payClose();
    else if (act === 'pay') pay();
  });
  function call(){
    A.t.call = new Date(); show('call'); step(1);
    var st = ph.querySelector('[data-callst]'); st.textContent = 'calling…';
    narrate('It’s ringing. ' + A.biz + ' is ' + A.J.text + ', so nobody picks up.', 'Let it ring out, or hang up.');
    later(function(){ st.textContent = 'No answer'; }, 6800);
    later(function(){ missed(false); }, 7700);
  }
  function missed(hungUp){
    if (A.t.missed) return;
    clear(); A.t.missed = new Date();
    show('lock');
    var n = $('ntf'); n.hidden = true;
    bind('[data-custno]', A.custNo); $('leadsub').textContent = 'Called at ' + hm(A.t.missed);
    $('lead').classList.add('is-new'); stage('missed', 'Missed call'); tag('red', 'phone', 'Missed call');
    feed('phone', 'red', '<b>Missed call</b> from ' + A.custNo, A.t.missed, 'Missed call logged');
    step(2);
    narrate(hungUp ? 'You hung up. Most people ring the next business at this point.' : 'No answer. Most people ring the next business at this point.', 'Wait a moment.');
    later(textBack, 2600);
  }
  /* ---------- 2 · the text ---------- */
  function textBack(){
    A.t.text = new Date();
    stage('texted', 'Texted back'); tag('blu', 'zap', 'Texted back');
    feed('zap', 'blu', '<b>Text sent automatically</b>, ' + secs(A.t.missed, A.t.text) + ' after the call', A.t.text, 'Text-back sent');
    bind('[data-smstime]', hm(A.t.text));
    var n = $('ntf'); n.hidden = false;
    narrate('Before you’ve rung anyone else, this arrives.', 'Tap the message.');
  }
  function openMsg(){ show('msgs'); narrate('A text from ' + A.biz + ', with a link to book.', 'Tap the link.'); }
  function openLink(){
    A.t.link = new Date();
    feed('link', 'gry', '<b>Booking link opened</b>', A.t.link);
    show('web'); step(3); $('wb').scrollTop = 0;
    narrate('Their booking page, on their real diary. Taken slots are already gone.', 'Pick what you need, a day and a time.');
  }

  /* ---------- 3 · the booking page ---------- */
  function buildBooking(){
    var J = A.J, sat = J.sat, eve = kind === 'hospitality';
    A.days = []; var t = new Date(); t.setHours(12, 0, 0, 0); if (!eve) t.setDate(t.getDate() + 1);
    while (A.days.length < 3){ var w = t.getDay(); if (w !== 0 && (sat || w !== 6)) A.days.push(new Date(t)); t.setDate(t.getDate() + 1); }
    A.slots = eve ? ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'] : ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00'];
    $('jobs').innerHTML = J.jobs.map(function(j, i){ return '<button type="button" class="wb-job" data-job="' + i + '" aria-pressed="false"><span>' + esc(j[0]) + '<small>' + esc(j[1]) + '</small></span></button>'; }).join('');
    $('days').innerHTML = A.days.map(function(x, i){ return '<button type="button" class="wb-day" data-day="' + i + '" aria-pressed="' + (i === 0) + '">' + DAYS[x.getDay()].slice(0, 3) + '<b>' + x.getDate() + '</b></button>'; }).join('');
    A.day = 0; A.job = null; A.slot = null;
    slots();
    bind('[data-websub]', J.dep ? 'Pick a time. A £' + J.dep + ' deposit holds it and comes off the bill.' : 'Pick a time and it’s confirmed straight away.');
    bind('[data-webfine]', J.dep ? 'Free to change up to 24 hours before.' : 'No payment needed to book.');
    bind('[data-dep]', '£' + J.dep + '.00');
    cta();
  }
  function taken(day, i){ var x = (day.getDate() * 7 + day.getMonth() * 3 + i * 5) % 9; return x < 4; }
  function slots(){
    var day = A.days[A.day], free = 0;
    $('slots').innerHTML = A.slots.map(function(s, i){
      var off = taken(day, i) && !(i === A.slots.length - 1 && free < 2); if (!off) free++;
      return '<button type="button" class="wb-slot" data-slot="' + i + '"' + (off ? ' disabled aria-label="' + s + ', taken"' : '') + ' aria-pressed="false">' + s + '</button>';
    }).join('');
  }
  function cta(){
    var b = ph.querySelector('[data-act=continue]'), ok = A.job != null && A.slot != null;
    b.disabled = !ok;
    b.textContent = !ok ? (A.job == null ? 'Pick what you need' : 'Pick a time') : (A.dep ? 'Continue · £' + A.dep + ' deposit holds it' : 'Book it');
  }
  $('wb').addEventListener('click', function(e){
    var j = e.target.closest('[data-job]'), dy = e.target.closest('[data-day]'), sl = e.target.closest('[data-slot]');
    if (j){ A.job = +j.getAttribute('data-job'); [].forEach.call($('jobs').children, function(c){ c.setAttribute('aria-pressed', String(c === j)); }); }
    if (dy){ A.day = +dy.getAttribute('data-day'); A.slot = null; [].forEach.call($('days').children, function(c){ c.setAttribute('aria-pressed', String(c === dy)); }); slots(); diary(A.days[A.day], null); }
    if (sl && !sl.disabled){ A.slot = +sl.getAttribute('data-slot'); [].forEach.call($('slots').children, function(c){ c.setAttribute('aria-pressed', String(c === sl)); }); }
    if (j || dy || sl){ cta(); if (A.job != null && A.slot == null && j){ $('slots').scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); } if (A.job != null && A.slot != null){ var c = ph.querySelector('[data-act=continue]'); c.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); } }
  });
  function when(){ var x = A.days[A.day]; return DAYS[x.getDay()].slice(0, 3) + ' ' + x.getDate() + ' ' + MON[x.getMonth()].slice(0, 3) + ', ' + A.slots[A.slot]; }
  function goPay(){
    if (A.job == null || A.slot == null) return;
    bind('[data-jobname]', A.J.jobs[A.job][0]); bind('[data-when]', when());
    if (!A.dep) return booked();
    layers.web.classList.add('has-pay'); $('pay').hidden = false;
    var go = ph.querySelector('[data-act=pay]'); go.textContent = 'Pay £' + A.dep + '.00'; go.classList.remove('is-busy');
    narrate('A £' + A.dep + ' deposit holds the slot and comes off the bill.', 'Tap Pay. It’s a demo, so no money moves.');
  }
  function payClose(){ $('pay').hidden = true; layers.web.classList.remove('has-pay'); narrate('Their booking page, on their real diary. Taken slots are already gone.', 'Pick what you need, a day and a time.'); }
  function pay(){
    var go = ph.querySelector('[data-act=pay]'); if (go.classList.contains('is-busy')) return;
    go.classList.add('is-busy'); go.textContent = 'Paying…';
    later(function(){ payClose(); booked(); }, 900);
  }

  /* ---------- 4 · booked ---------- */
  function booked(){
    A.t.booked = new Date();
    var job = A.J.jobs[A.job][0];
    show('done');
    bind('[data-donetx]', 'You’ll get a reminder the day before. Nobody had to pick up the phone.');
    var row = ph.querySelector('[data-deprow]'); row.hidden = !A.dep; bind('[data-dep-paid]', '£' + A.dep + ' paid');
    bind('[data-confirm]', 'Confirmed: ' + job + ', ' + when() + '.' + (A.dep ? ' £' + A.dep + ' deposit received.' : '') + ' We’ll remind you the day before. Reply R to rearrange.');
    var n2 = $('ntf2'); n2.hidden = true; later(function(){ n2.hidden = false; }, 1200);
    stage('booked', 'Booked');
    $('leadsub').textContent = job + ' · ' + when();
    tag('grn', 'diary', 'Booked');
    if (A.dep) tag('grn', 'card', '£' + A.dep + ' deposit');
    feed('diary', 'grn', '<b>Booked</b>: ' + esc(job) + ', ' + when(), A.t.booked, A.dep ? 'Booked, £' + A.dep + ' deposit paid' : 'Booked into the diary');
    if (A.dep) feed('card', 'grn', '<b>£' + A.dep + ' deposit paid</b>, held against the job', A.t.booked);
    feed('check', 'gry', '<b>Confirmation and reminder</b> set to send', A.t.booked);
    diary(A.days[A.day], A.slot, job);
    narrate('Booked, and you never spoke to anyone.', 'Now see it from your side.');
    track('demo_completed', { kind: kind, seconds: Math.round((A.t.booked - A.t.missed) / 1000) });
    later(owner, 3200);
  }
  function diary(day, mine, job){
    bind('[data-diaryday]', 'Diary · ' + DAYS[day.getDay()] + ' ' + day.getDate() + ' ' + MON[day.getMonth()].slice(0, 3));
    $('diary').innerHTML = '<div class="dy">' + A.slots.map(function(s, i){
      var cls = i === mine ? 'mine' : (taken(day, i) ? 'busy' : ''), txt = i === mine ? esc(job) + ' · new' : (cls ? 'Booked' : 'Free');
      return '<time>' + s + '</time><div class="' + cls + '">' + txt + '</div>';
    }).join('') + '</div>';
  }
  function owner(){
    step(4); run.classList.add('is-owner');
    narrate('And this is your side: a booked job' + (A.dep ? ', deposit paid' : '') + ', nothing to chase.', '');
    var h = $('hint'); h.innerHTML = '<button type="button" class="btn btn-dark btn-sm" id="fin">See what it means</button>';
    $('fin').addEventListener('click', finish);
    if (innerWidth < 1000) scrollTo(0, run.getBoundingClientRect().top + pageYOffset - 64);
  }
  function finish(){
    clear();
    var took = secs(A.t.missed, A.t.booked).replace(/^(\d+) seconds?$/, function(_, n){ n = +n; return n < 60 ? n + ' seconds' : Math.floor(n / 60) + (n < 120 ? ' minute ' : ' minutes ') + (n % 60) + ' seconds'; });
    $('endH').textContent = 'Missed at ' + hm(A.t.missed) + '. Booked ' + took + ' later.';
    $('endP').textContent = 'That’s every missed call at ' + A.biz + ', day or night, without you touching your phone. The text, the booking page, the deposit and the CRM are what I build, set up in your name.';
    run.hidden = true; end.hidden = false; d.body.classList.remove('tm-on');
    scrollTo(0, 0); $('endH').focus({ preventScroll: true });
  }
  [].forEach.call(d.querySelectorAll('[data-cta]'), function(a){ a.addEventListener('click', function(){ track('demo_cta', { cta: a.getAttribute('data-cta') }); }); });
})();
