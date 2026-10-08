/* The shared machinery for the /try/ demos: the set-up form, the pretend phone, the narration, the
   booking page, the deposit sheet and the Skales CRM on the business's side. Each demo file
   (try-missed.js, try-booking.js) calls TryKit with its own story and gets these back. Times are
   the visitor's real clock unless a demo sets a scene time (K.clockAt). Nothing leaves the browser. */
window.TryKit = function(cfg){
  var d = document, JOBS = window.TRYJOBS || {};
  var $ = function(id){ return d.getElementById(id); };
  var setup = $('setup'), run = $('run'), end = $('end'), form = $('setupForm');
  if (!setup || !run || !form) return null;
  var ph = $('ph'), scr = ph.querySelector('.ph-scr'), sb = $('sb'), fit = $('fit');
  var say = $('say'), hint = $('hint'), toast = $('toast');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var K = { $: $, reduce: reduce, A: null };
  K.esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var store = K.store = { get: function(k){ try { return JSON.parse(sessionStorage.getItem(k)); } catch (e){ return null; } }, set: function(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e){} } };
  K.track = function(name, props){
    props = Object.assign({ demo: cfg.demo }, props || {});
    try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, props)); } catch (e){}
    try { if (window.fbq) fbq('trackCustom', name, props); } catch (e){}
    try { if (window.gtag) gtag('event', name, props); } catch (e){}
    try { if (window.plausible) plausible(name, { props: props }); } catch (e){}
  };
  K.bind = function(sel, v){ [].forEach.call(d.querySelectorAll(sel), function(e){ e.textContent = v; }); };

  /* ---------- time ---------- */
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  K.hm = function(t){ return pad(t.getHours()) + ':' + pad(t.getMinutes()); };
  K.hms = function(t){ return K.hm(t) + ':' + pad(t.getSeconds()); };
  K.DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  K.MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  K.secs = function(a, b){ var s = Math.max(1, Math.round((b - a) / 1000)); return s + (s === 1 ? ' second' : ' seconds'); };
  K.span = function(a, b){ var n = Math.max(1, Math.round((b - a) / 1000)); return n < 60 ? n + (n === 1 ? ' second' : ' seconds') : Math.floor(n / 60) + (n < 120 ? ' minute ' : ' minutes ') + (n % 60) + ' seconds'; };
  var scene = null;   /* a demo can pin the phone's clock to a scene time (e.g. 22:14 tonight) */
  K.clockAt = function(t){ scene = t; tick(); };
  K.now = function(){ return scene ? new Date(scene) : new Date(); };
  function tick(){
    var n = scene || new Date();
    [].forEach.call(d.querySelectorAll('[data-clock]'), function(e){ e.textContent = K.hm(n); });
    [].forEach.call(d.querySelectorAll('[data-date]'), function(e){ e.textContent = K.DAYS[n.getDay()] + ' ' + n.getDate() + ' ' + K.MON[n.getMonth()]; });
  }
  tick(); setInterval(tick, 5000);

  var timers = [];
  K.later = function(fn, ms){ timers.push(setTimeout(fn, reduce ? Math.min(ms, 600) : ms)); };
  K.clear = function(){ timers.forEach(clearTimeout); timers = []; };

  /* ---------- set-up: their business name and trade ---------- */
  var kind = (store.get('st-a') || {}).kind || store.get('try-kind') || 'heating';
  if (!JOBS[kind]) kind = 'other';
  var chips = [].slice.call(form.querySelectorAll('.tm-k'));
  function pick(k){ kind = k; chips.forEach(function(c){ c.setAttribute('aria-pressed', String(c.getAttribute('data-kind') === k)); }); }
  pick(kind);
  chips.forEach(function(c){ c.addEventListener('click', function(){ pick(c.getAttribute('data-kind')); }); });
  var nameIn = $('bizName');
  if (store.get('try-biz')) nameIn.value = store.get('try-biz');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var biz = nameIn.value.replace(/\s+/g, ' ').trim().slice(0, 32) || 'Larchfield Heating';
    store.set('try-biz', nameIn.value.trim()); store.set('try-kind', kind);
    start(biz);
  });

  function start(biz){
    K.clear(); scene = null;
    var J = JOBS[kind] || JOBS.other;
    var slug = biz.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'yourbusiness';
    var h = 0; for (var i = 0; i < biz.length; i++) h = (h * 31 + biz.charCodeAt(i)) >>> 0;
    var A = K.A = { biz: biz, kind: kind, J: J, dep: J.dep, domain: slug + '.co.uk', site: slug + '.co.uk/book', bizNo: '07700 900 ' + (100 + h % 900), custNo: '07700 900 418', t: {}, job: null, day: null, slot: null };
    K.bind('[data-biz]', biz); K.bind('[data-initial]', biz.charAt(0).toUpperCase()); K.bind('[data-bizno]', A.bizNo);
    K.bind('[data-site]', A.site); K.bind('[data-domain]', A.domain); K.bind('[data-custno]', 'New customer');
    resetCrm(); if ($('wb')){ buildBooking(); K.diary(A.days[0], null); }
    setup.hidden = true; end.hidden = true; run.hidden = false; run.classList.remove('is-owner');
    d.body.classList.add('tm-on');
    try { if (location.hash !== '#demo') history.pushState({ tm: 1 }, '', '#demo'); } catch (e){}
    cfg.start(K, A);
    tick(); K.fit(); scrollTo(0, run.getBoundingClientRect().top + pageYOffset - 64);
    K.track('demo_started', { kind: kind });
  }
  addEventListener('popstate', function(){ if (location.hash !== '#demo'){ K.clear(); run.hidden = true; end.hidden = true; setup.hidden = false; d.body.classList.remove('tm-on'); } });
  $('again').addEventListener('click', function(){ end.hidden = true; setup.hidden = false; try { history.replaceState(null, '', location.pathname); } catch (e){} scrollTo(0, 0); nameIn.focus({ preventScroll: true }); });

  /* ---------- the phone ---------- */
  var layers = {}; [].forEach.call(ph.querySelectorAll('[data-ly]'), function(l){ layers[l.getAttribute('data-ly')] = l; });
  K.layer = function(n){ return layers[n]; };
  K.show = function(name, dark){
    var kb = ph.contains(d.activeElement);
    Object.keys(layers).forEach(function(k){ layers[k].hidden = k !== name; });
    sb.classList.toggle('is-light', !!dark); scr.classList.toggle('is-dark', !!dark);
    if (kb){ var f = layers[name].querySelector('button:not([disabled]):not([hidden])'); if (f) f.focus({ preventScroll: true }); }
  };
  K.fit = function(){
    var wide = innerWidth >= 1000, vh = (window.visualViewport ? visualViewport.height : innerHeight);
    var avH = wide ? vh - 64 - 56 : vh - 64 - d.querySelector('.tm-narr').offsetHeight - 36;
    var avW = Math.min(run.clientWidth - 32, 373);
    var s = Math.max(.62, Math.min(1, avW / 373, avH / 781)); if (s > .985) s = 1;
    fit.style.setProperty('--s', s.toFixed(3)); ph.style.setProperty('--s', s.toFixed(3));
  };
  addEventListener('resize', function(){ if (!run.hidden) K.fit(); });
  ph.addEventListener('click', function(e){
    var b = e.target.closest('[data-act]'); if (!b || !K.A) return;
    var act = b.getAttribute('data-act'), fn = (cfg.acts || {})[act] || builtIn[act];
    if (fn) fn(b);
  });

  var stepEls = [].slice.call(d.querySelectorAll('.tm-steps li'));
  K.step = function(n){ stepEls.forEach(function(li, i){ li.classList.toggle('on', i <= n); li.classList.toggle('now', i === n); }); K.track('demo_step', { step: n }); };
  K.narrate = function(s, h){ say.textContent = s; hint.textContent = h || ''; };

  /* ---------- the business's side: the Skales CRM ---------- */
  var IC = {
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    msg: '<path d="M4 5h16v11H8l-4 4z"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    diary: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
  };
  K.ic = function(n){ return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; };
  var COL = { red: ['#FDECEC', '#B42318'], blu: ['#ECEBFE', '#3B18E0'], grn: ['#E7F6EE', '#13744A'], gry: ['#F2F0EC', '#5d5a54'], amb: ['#FEF3E2', '#9A5B07'] };
  /* toast: false = log only; a string = the words of the phone-width toast */
  K.feed = function(icon, col, html, t, toastText){
    var f = $('feed'), e = f.querySelector('.crm-empty'); if (e) e.remove();
    var c = COL[col], li = d.createElement('li');
    li.innerHTML = '<span class="fi-i" style="background:' + c[0] + ';color:' + c[1] + '">' + K.ic(icon) + '</span><p>' + html + '</p><time>' + (cfg.stamp || K.hms)(t) + '</time>';
    f.insertBefore(li, f.firstChild);
    if (typeof toastText === 'string') K.ping(toastText);
  };
  K.tag = function(cls, icon, text){ var s = d.createElement('span'); s.className = 'tg ' + cls; s.innerHTML = (icon ? K.ic(icon) : '') + K.esc(text); $('tags').appendChild(s); };
  K.stage = function(cls, text){ var s = $('stage'); s.className = 'crm-stage' + (cls ? ' s-' + cls : ''); s.textContent = text; };
  K.lead = function(who, sub){ if (who) K.bind('[data-custno]', who); if (sub != null) $('leadsub').textContent = sub; $('lead').classList.add('is-new'); };
  var tt;
  K.ping = function(text){
    if (innerWidth >= 1000) return;
    clearTimeout(tt); toast.hidden = false; toast.classList.remove('is-out');
    toast.innerHTML = '<span><b>Your CRM</b> · ' + K.esc(text) + '</span>';
    tt = setTimeout(function(){ toast.classList.add('is-out'); tt = setTimeout(function(){ toast.hidden = true; }, 320); }, 2800);
  };
  function resetCrm(){
    $('feed').innerHTML = '<li class="crm-empty">' + K.esc(cfg.empty || 'Nothing yet.') + '</li>';
    if (!$('lead')) return;
    $('tags').innerHTML = ''; K.stage('', 'Quiet'); $('leadsub').textContent = cfg.waiting || 'Waiting'; $('lead').classList.remove('is-new');
  }
  K.diary = function(day, mine, job){
    var A = K.A;
    K.bind('[data-diaryday]', 'Diary · ' + K.DAYS[day.getDay()] + ' ' + day.getDate() + ' ' + K.MON[day.getMonth()].slice(0, 3));
    $('diary').innerHTML = '<div class="dy">' + A.slots.map(function(s, i){
      var cls = i === mine ? 'mine' : (taken(day, i) ? 'busy' : ''), txt = i === mine ? K.esc(job) + ' · new' : (cls ? A.J.jobs[(i + day.getDate()) % A.J.jobs.length][0] : 'Free');
      return '<time>' + s + '</time><div class="' + cls + '">' + txt + '</div>';
    }).join('') + '</div>';
  };

  /* ---------- the booking page ---------- */
  function taken(day, i){ return (day.getDate() * 7 + day.getMonth() * 3 + i * 5) % 9 < 4; }
  K.taken = taken;
  function buildBooking(){
    var A = K.A, J = A.J, eve = A.kind === 'hospitality';
    A.days = []; var t = new Date(); t.setHours(12, 0, 0, 0); if (!eve || cfg.fromTomorrow) t.setDate(t.getDate() + 1);
    while (A.days.length < 3){ var w = t.getDay(); if (w !== 0 && (J.sat || w !== 6)) A.days.push(new Date(t)); t.setDate(t.getDate() + 1); }
    A.slots = eve ? ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'] : ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00'];
    $('jobs').innerHTML = J.jobs.map(function(j, i){ return '<button type="button" class="wb-job" data-job="' + i + '" aria-pressed="false"><span>' + K.esc(j[0]) + '<small>' + K.esc(j[1]) + '</small></span></button>'; }).join('');
    $('days').innerHTML = A.days.map(function(x, i){ return '<button type="button" class="wb-day" data-day="' + i + '" aria-pressed="' + (i === 0) + '">' + K.DAYS[x.getDay()].slice(0, 3) + '<b>' + x.getDate() + '</b></button>'; }).join('');
    A.day = 0; A.job = null; A.slot = null;
    slots();
    K.bind('[data-websub]', J.dep ? 'Pick a time. A £' + J.dep + ' deposit holds it and comes off the bill.' : 'Pick a time and it’s confirmed straight away.');
    K.bind('[data-webfine]', J.dep ? 'Free to change up to 24 hours before.' : 'No payment needed to book.');
    K.bind('[data-dep]', '£' + J.dep + '.00');
    cta();
  }
  function slots(){
    var A = K.A, day = A.days[A.day], free = 0;
    $('slots').innerHTML = A.slots.map(function(s, i){
      var off = taken(day, i) && !(i === A.slots.length - 1 && free < 2); if (!off) free++;
      return '<button type="button" class="wb-slot" data-slot="' + i + '"' + (off ? ' disabled aria-label="' + s + ', taken"' : '') + ' aria-pressed="false">' + s + '</button>';
    }).join('');
  }
  function cta(){
    var A = K.A, b = ph.querySelector('[data-act=continue]'), ok = A.job != null && A.slot != null;
    b.disabled = !ok;
    b.textContent = !ok ? (A.job == null ? 'Pick what you need' : 'Pick a time') : (cfg.ctaText ? cfg.ctaText(A) : (A.dep ? 'Continue · £' + A.dep + ' deposit holds it' : 'Book it'));
  }
  if ($('wb')) $('wb').addEventListener('click', function(e){
    var A = K.A, j = e.target.closest('[data-job]'), dy = e.target.closest('[data-day]'), sl = e.target.closest('[data-slot]');
    if (j){ A.job = +j.getAttribute('data-job'); [].forEach.call($('jobs').children, function(c){ c.setAttribute('aria-pressed', String(c === j)); }); }
    if (dy){ A.day = +dy.getAttribute('data-day'); A.slot = null; [].forEach.call($('days').children, function(c){ c.setAttribute('aria-pressed', String(c === dy)); }); slots(); K.diary(A.days[A.day], null); }
    if (sl && !sl.disabled){ A.slot = +sl.getAttribute('data-slot'); [].forEach.call($('slots').children, function(c){ c.setAttribute('aria-pressed', String(c === sl)); }); }
    if (j || dy || sl){
      cta();
      if (A.job != null && A.slot == null && j) reveal($('slots'));
      if (A.job != null && A.slot != null) reveal(ph.querySelector('[data-act=continue]'));
    }
  });
  /* scroll inside the pretend phone only (scrollIntoView would move the whole page too) */
  function reveal(el){
    var wb = $('wb'), s = parseFloat(ph.style.getPropertyValue('--s')) || 1;
    var over = (el.getBoundingClientRect().bottom - wb.getBoundingClientRect().bottom) / s + 16;
    if (over > 0) wb.scrollBy({ top: over, behavior: reduce ? 'auto' : 'smooth' });
  }
  K.when = function(){ var A = K.A, x = A.days[A.day]; return K.DAYS[x.getDay()].slice(0, 3) + ' ' + x.getDate() + ' ' + K.MON[x.getMonth()].slice(0, 3) + ', ' + A.slots[A.slot]; };
  K.jobName = function(){ return K.A.J.jobs[K.A.job][0]; };

  /* the deposit sheet: opens over the booking page; cfg.booked runs once it is paid (or straight away
     for a trade that books without one) */
  var payText = '';
  K.toPay = function(){
    var A = K.A;
    if (A.job == null || A.slot == null) return;
    K.bind('[data-jobname]', K.jobName()); K.bind('[data-when]', K.when());
    if (!A.dep) return cfg.booked(K, A);
    layers.web.classList.add('has-pay'); $('pay').hidden = false;
    var go = ph.querySelector('[data-act=pay]'); go.textContent = 'Pay £' + A.dep + '.00'; go.classList.remove('is-busy');
    payText = say.textContent;
    K.narrate('A £' + A.dep + ' deposit holds the slot and comes off the bill.', 'Tap Pay. It’s a demo, so no money moves.');
  };
  function payClose(back){ $('pay').hidden = true; layers.web.classList.remove('has-pay'); if (back) K.narrate(payText, 'Pick what you need, a day and a time.'); }
  var builtIn = {
    'continue': function(){ K.toPay(); },
    cancelpay: function(){ payClose(true); },
    pay: function(){
      var go = ph.querySelector('[data-act=pay]'); if (go.classList.contains('is-busy')) return;
      go.classList.add('is-busy'); go.textContent = 'Paying…';
      K.later(function(){ payClose(false); cfg.booked(K, K.A); }, 900);
    }
  };

  /* the confirmation screen, and the booking landing in the CRM */
  K.done = function(t){
    var A = K.A, job = K.jobName();
    K.show('done');
    K.bind('[data-donetx]', 'You’ll get a reminder the day before. Nobody had to pick up the phone.');
    var row = ph.querySelector('[data-deprow]'); row.hidden = !A.dep; K.bind('[data-dep-paid]', '£' + A.dep + ' paid');
    K.bind('[data-confirm]', 'Confirmed: ' + job + ', ' + K.when() + '.' + (A.dep ? ' £' + A.dep + ' deposit received.' : '') + ' We’ll remind you the day before. Reply R to rearrange.');
    var n2 = $('ntf2'); n2.hidden = true; K.later(function(){ n2.hidden = false; }, 1200);
    K.stage('booked', 'Booked');
    $('leadsub').textContent = job + ' · ' + K.when();
    K.tag('grn', 'diary', 'Booked');
    if (A.dep) K.tag('grn', 'card', '£' + A.dep + ' deposit');
    K.feed('diary', 'grn', '<b>Booked</b>: ' + K.esc(job) + ', ' + K.when(), t, A.dep ? 'Booked, £' + A.dep + ' deposit paid' : 'Booked into the diary');
    if (A.dep) K.feed('card', 'grn', '<b>£' + A.dep + ' deposit paid</b>, held against the job', t);
    K.feed('bell', 'gry', '<b>Confirmation sent</b>, reminder set for the day before', t);
    K.diary(A.days[A.day], A.slot, job);
  };

  /* ---------- the business's side, then the end ---------- */
  K.owner = function(line, keepPhone){
    K.step(stepEls.length - 1); if (!keepPhone) run.classList.add('is-owner');
    K.narrate(line, '');
    hint.innerHTML = '<button type="button" class="btn btn-dark btn-sm" id="fin">See what it means</button>';
    $('fin').addEventListener('click', function(){ K.clear(); var r = cfg.finish(K, K.A); K.finish(r[0], r[1]); });
    if (innerWidth < 1000 && !keepPhone) scrollTo(0, run.getBoundingClientRect().top + pageYOffset - 64);
  };
  K.finish = function(h, p){
    $('endH').textContent = h; $('endP').textContent = p;
    run.hidden = true; end.hidden = false; d.body.classList.remove('tm-on');
    scrollTo(0, 0); $('endH').focus({ preventScroll: true });
  };
  [].forEach.call(d.querySelectorAll('[data-cta]'), function(a){ a.addEventListener('click', function(){ K.track('demo_cta', { cta: a.getAttribute('data-cta') }); }); });
  return K;
};
