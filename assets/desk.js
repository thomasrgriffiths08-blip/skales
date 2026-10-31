/* ============================================================
   The desk (/work/system/): the system on a laptop and the customer's phone beside it, both live.
   The two frames talk over a BroadcastChannel named by a fresh id; this page listens in to move
   the six steps on, run the missed-call-to-booked clock, and on a phone show whichever side has
   just changed. "Play it for me" lets both sides tap themselves through it.
   ============================================================ */
(function(){
  var d = document, root = d.querySelector('[data-desk]');
  if (!root) return;
  var id = Math.random().toString(36).slice(2, 10);
  var frames = [].slice.call(root.querySelectorAll('iframe[data-src]'));
  var stage = root.querySelector('.desk-stage'), seg = [].slice.call(root.querySelectorAll('.desk-seg [data-side]'));
  var steps = [].slice.call(root.querySelectorAll('.desk-steps li')), clock = root.querySelector('[data-clock]');
  var playB = root.querySelector('[data-play]'), resetB = root.querySelector('[data-reset]');
  var ch = 'BroadcastChannel' in window ? new BroadcastChannel('sk-desk-' + id) : null;
  var narrow = window.matchMedia('(max-width:900px)');
  var step = 1, t0 = 0, tick = 0, done = false, auto = false, pendingAuto = false, ready = { biz: false, phone: false }, loaded = false, touched = false, idle = 0, flip = 0;
  if (!ch){ root.classList.add('no-sync'); return; }

  /* ---------- the frames: loaded as the desk nears the screen, each drawn at its own size and scaled to fit ---------- */
  function load(){
    if (loaded) return; loaded = true;
    frames.forEach(function(f){ f.removeAttribute('loading'); f.src = f.getAttribute('data-src').replace('{id}', id); });
  }
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es, o){ if (es.some(function(e){ return e.isIntersecting; })){ load(); o.disconnect(); } }, { rootMargin: '400px 0px' }).observe(root);
  } else load();
  function fit(){
    [].forEach.call(root.querySelectorAll('.desk-stage .scrn'), function(s){
      var f = s.querySelector('iframe'), w = parseFloat(getComputedStyle(s).getPropertyValue('--w')) || s.clientWidth;
      s.style.setProperty('--k', (s.clientWidth / w).toFixed(4));
      if (f) f.tabIndex = narrow.matches && s.closest('[data-hidden]') ? -1 : 0;
    });
  }
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage); else window.addEventListener('resize', fit);
  fit();

  /* ---------- one side at a time on a phone ---------- */
  function show(side, auto_){
    stage.setAttribute('data-side', side);
    seg.forEach(function(b){ var on = b.getAttribute('data-side') === side; b.setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) b.removeAttribute('data-new'); });
    root.querySelector('.desk-laptop').toggleAttribute('data-hidden', side !== 'biz');
    root.querySelector('.desk-phone').toggleAttribute('data-hidden', side !== 'phone');
    if (!auto_) clearTimeout(flip);
    fit();
  }
  /* a side changed: on a phone, go there after a beat; the other button gets a dot if the viewer is already busy */
  function follow(side, wait){
    if (!narrow.matches || stage.getAttribute('data-side') === side) return;
    clearTimeout(flip);
    flip = setTimeout(function(){ show(side, true); }, wait || 900);
    seg.forEach(function(b){ if (b.getAttribute('data-side') === side) b.setAttribute('data-new', ''); });
  }
  seg.forEach(function(b){ b.addEventListener('click', function(){ show(b.getAttribute('data-side')); }); });
  show('phone', true);

  /* ---------- the six steps and the clock ---------- */
  function at(n){
    if (n < step) return; step = n;
    steps.forEach(function(li){ var s = +li.getAttribute('data-s');
      li.toggleAttribute('data-done', s < n || (done && s === n));
      if (s === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    root.setAttribute('data-step', n); root.style.setProperty('--p', (done ? 1 : n / 6).toFixed(3));
  }
  var mmss = function(ms){ var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; };
  function startClock(){ if (t0) return; t0 = Date.now(); root.setAttribute('data-clock-on', ''); tick = setInterval(function(){ clock.textContent = mmss(Date.now() - t0); }, 250); }
  function stopClock(){ clearInterval(tick); if (t0) clock.textContent = mmss(Date.now() - t0); root.removeAttribute('data-clock-on'); }

  function playing(on){
    auto = on; root.toggleAttribute('data-auto', on);
    playB.textContent = on ? 'Stop playing' : (done ? 'Play it again' : 'Play it for me');
  }
  function send(t, o){ var m = o || {}; m.t = t; m.from = 'page'; ch.postMessage(m); }
  function reset(then){
    clearTimeout(flip); clearTimeout(idle); stopClock();
    step = 0; t0 = 0; done = false; ready.biz = ready.phone = false; clock.textContent = '0:00';
    root.removeAttribute('data-done'); at(1); show('phone', true);
    pendingAuto = !!then; playing(false);
    send('reset');
  }
  function go(){ pendingAuto = false; playing(true); send('auto', { on: true }); }
  function upNow(){ if (pendingAuto && ready.biz && ready.phone) setTimeout(go, 700); }

  playB.addEventListener('click', function(){
    touched = true; clearTimeout(idle);
    if (auto){ playing(false); send('auto', { on: false }); return; }
    if (step > 1 || t0) reset(true); else if (ready.biz && ready.phone) go(); else pendingAuto = true;
  });
  resetB.addEventListener('click', function(){ touched = true; reset(false); });

  at(1);
  ch.onmessage = function(e){
    var m = e.data || {};
    if (m.from === 'page') return;
    if (m.from === 'biz' && m.t === 'trade'){ ready.biz = true; upNow(); armIdle(); return; }
    if (m.from === 'phone' && m.t === 'hello'){ ready.phone = true; upNow(); armIdle(); return; }
    if (m.from === 'phone' && m.t === 'call'){ if (!auto) touched = true; at(2); follow('biz', 1500); return; }
    if (m.from === 'biz' && m.t === 'ring'){ at(2); return; }
    if (m.from === 'biz' && m.t === 'missed'){ startClock(); return; }
    if (m.from === 'biz' && m.t === 'sms' && m.auto){ at(3); follow('phone', 1200); return; }
    if (m.from === 'phone' && m.t === 'reply'){ at(4); follow('biz', 700); return; }
    if (m.from === 'biz' && m.t === 'sms' && m.link){ at(5); follow('phone', 900); return; }
    if (m.from === 'biz' && m.t === 'booked'){
      done = true; stopClock(); at(6); root.setAttribute('data-done', '');
      follow('biz', 2200); playing(false); return;
    }
  };

  /* ---------- left alone on screen at the first step, it plays itself once ---------- */
  var seen = false;
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ seen = es.some(function(e){ return e.intersectionRatio >= 0.45; }); d.body.classList.toggle('desk-in', seen); armIdle(); }, { threshold: [0, 0.45] }).observe(stage);
  }
  function armIdle(){
    clearTimeout(idle);
    if (!seen || touched || auto || step > 1 || !(ready.biz && ready.phone)) return;
    idle = setTimeout(function(){ if (seen && !touched && !auto && step === 1){ touched = true; go(); } }, 4500);
  }
  ['pointerdown', 'keydown'].forEach(function(ev){
    root.addEventListener(ev, function(){ if (!auto){ touched = true; clearTimeout(idle); } }, { passive: true });
  });
  narrow.addEventListener && narrow.addEventListener('change', fit);
})();
