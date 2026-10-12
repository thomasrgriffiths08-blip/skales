/* ============================================================
   The reel: real builds running live in the first screen.
   Each slide is the build itself in an iframe, scrolled slowly so its own motion plays,
   then wiped to the next. Click the frame to take over and use the build; Esc hands it back.
   Only the playing build and its neighbours are kept loaded. Reduce Motion: no autoplay, no glide.
   ============================================================ */
(function(){
  var d = document, root = d.getElementById('reel');
  if (!root) return;
  var frame = root.querySelector('.reel-frame'), stage = root.querySelector('.reel-stage');
  var slides = [].slice.call(root.querySelectorAll('.reel-slide'));
  var dots = [].slice.call(root.querySelectorAll('.reel-index button[data-i]'));
  var tag = root.querySelector('.reel-tag'), count = root.querySelector('.reel-count');
  var back = root.querySelector('.reel-back'), cursor = root.querySelector('.reel-cursor');
  var head = d.querySelector('.site-head');
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var DUR = 8200, n = slides.length, cur = -1, timer = 0, playing = !RM, inView = true, live = false;
  var pad = function(i){ return (i < 9 ? '0' : '') + (i + 1); };
  var track = function(e, p){ if (window.skTrack) try { window.skTrack(e, p); } catch (x) {} };
  root.style.setProperty('--dur', DUR / 1000 + 's');

  /* render each build at a real viewport width: the frame's own width on a desktop, a phone's on a phone */
  function geo(){
    var W = frame.clientWidth, H = frame.clientHeight;
    var vw = W >= 1100 ? W : W >= 700 ? 1280 : 390, s = W / vw;
    return { vw: vw, vh: H / s, s: s };
  }
  function fit(sl){
    var f = sl._f; if (!f) return;
    var g = geo();
    var c = sl._crop || 0;
    f.style.width = g.vw + 'px'; f.style.height = Math.ceil(g.vh + c) + 'px';
    /* offset with top, not a transform: a translated iframe drops its own fixed headers in Chrome */
    f.style.top = c ? -Math.round(c * g.s) + 'px' : '0';
    f.style.transform = g.s === 1 ? 'none' : 'scale(' + g.s + ')';
  }
  /* each build carries a thin "demo · Reset demo" strip for when it is opened on its own.
     The reel crops it off the top rather than removing it, so the build's own sticky offsets still line up. */
  function quiet(sl){
    try {
      var doc = sl._f.contentDocument, els = doc.querySelectorAll('button,a'), body = doc.body;
      var own = sl.getAttribute('data-crop') && doc.querySelector(sl.getAttribute('data-crop'));
      if (own){ own.style.display = 'none'; return; }
      for (var i = 0; i < els.length; i++){
        if (!/^\s*reset demo/i.test(els[i].textContent)) continue;
        var el = els[i];
        while (el.parentElement && el.parentElement !== body) el = el.parentElement;
        var r = el.getBoundingClientRect();
        if (r.top <= 1 && r.height > 0 && r.height <= 80 && /demo/i.test(el.textContent) && el.textContent.length < 160) sl._crop = Math.round(r.bottom);
        else els[i].style.visibility = 'hidden';
        break;
      }
    } catch (e) {}
  }
  function load(i){
    var sl = slides[i];
    if (!sl || sl._f) return;
    var f = d.createElement('iframe');
    f.title = sl.getAttribute('data-name') + ', a live build';
    f.setAttribute('tabindex', '-1');
    f.setAttribute('loading', 'eager');
    f.addEventListener('load', function(){
      quiet(sl); fit(sl);
      sl.classList.add('is-loaded');
      try { f.contentWindow.scrollTo(0, 0); } catch (e) {}
      if (slides[cur] === sl) glide(sl);
    });
    sl._f = f; fit(sl);
    f.src = sl.getAttribute('data-src');
    sl.appendChild(f);
  }
  function drop(i){
    var sl = slides[i];
    if (!sl || !sl._f) return;
    cancelAnimationFrame(sl._raf);
    sl.removeChild(sl._f); sl._f = null; sl._crop = 0; sl.classList.remove('is-loaded');
  }
  /* keep three alive: this one, the next, the last */
  function keep(){
    for (var i = 0; i < n; i++){
      var near = i === cur || i === (cur + 1) % n || i === (cur - 1 + n) % n;
      if (near) load(i); else drop(i);
    }
  }

  /* scroll the build slowly from the top, so its own reveals and drawings play */
  var ease = function(p){ return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  function glide(sl){
    cancelAnimationFrame(sl._raf);
    if (RM || !sl._f || !sl.classList.contains('is-loaded')) return;
    var w, se;
    try { w = sl._f.contentWindow; se = w.document.scrollingElement || w.document.documentElement; } catch (e) { return; }
    var max = Math.max(0, se.scrollHeight - se.clientHeight);
    var to = Math.min(max, se.clientHeight * (+sl.getAttribute('data-depth') || 1.4));
    w.scrollTo({ top: 0, behavior: 'instant' });
    if (to < 40) return;
    var t0 = performance.now() + 2000, len = DUR - 3000;
    (function step(now){
      if (slides[cur] !== sl || !playing || live) return;
      var p = Math.min(1, Math.max(0, (now - t0) / len));
      try { w.scrollTo({ top: Math.round(to * ease(p)), behavior: 'instant' }); } catch (e) { return; }
      if (p < 1) sl._raf = requestAnimationFrame(step);
    })(performance.now());
  }

  function label(sl){
    var name = sl.getAttribute('data-name'), biz = sl.getAttribute('data-biz');
    tag.innerHTML = '<i></i><span class="reel-swap"><b></b> <span></span></span>';
    tag.querySelector('b').textContent = name;
    tag.querySelector('span span').textContent = '· ' + biz;
    count.innerHTML = '<span class="reel-swap">' + pad(cur) + '</span>&nbsp;/&nbsp;' + pad(n - 1);
  }

  function show(i, why){
    i = (i + n) % n;
    if (i === cur) return;
    var prev = slides[cur];
    cur = i;
    var sl = slides[i];
    slides.forEach(function(s){ s.classList.remove('is-on', 'is-off'); s.style.zIndex = ''; });
    if (prev && !RM){ prev.classList.add('is-off'); prev.style.zIndex = 1; cancelAnimationFrame(prev._raf); }
    sl.style.zIndex = 2;
    void sl.offsetWidth;
    sl.classList.add('is-on');
    dots.forEach(function(b, k){
      b.setAttribute('aria-current', k === i ? 'true' : 'false');
      if (k === i){ b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
    });
    keep(); label(sl); glide(sl);
    if (why) track('reel_pick', { build: sl.getAttribute('data-slug') });
    schedule();
  }
  function schedule(){
    clearTimeout(timer);
    root.classList.toggle('is-paused', !playing || !inView);
    if (playing && inView && !live) timer = setTimeout(function(){ show(cur + 1); }, DUR);
  }

  /* take over: the build becomes yours to use, the reel waits */
  function goLive(){
    if (live) return;
    live = true; root.classList.add('is-live'); clearTimeout(timer);
    var sl = slides[cur]; cancelAnimationFrame(sl._raf);
    try { sl._f.focus(); } catch (e) {}
    track('reel_try', { build: sl.getAttribute('data-slug') });
  }
  function leave(){
    if (!live) return;
    live = false; root.classList.remove('is-live');
    frame.focus({ preventScroll: true });
    if (!RM) playing = true;
    schedule();
  }
  frame.addEventListener('click', function(e){ if (!live && !e.target.closest('.reel-back')) goLive(); });
  frame.addEventListener('keydown', function(e){ if (!live && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); goLive(); } });
  back.addEventListener('click', function(e){ e.stopPropagation(); leave(); });
  d.addEventListener('keydown', function(e){ if (e.key === 'Escape') leave(); });
  dots.forEach(function(b){
    b.addEventListener('click', function(){
      if (live){ live = false; root.classList.remove('is-live'); }
      show(+b.getAttribute('data-i'), 'pick');
    });
  });

  /* the follower: eased towards the pointer */
  if (FINE && !RM){
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, over = false;
    var tick = function(){
      x += (tx - x) * .2; y += (ty - y) * .2;
      cursor.style.setProperty('--cx', x.toFixed(1) + 'px'); cursor.style.setProperty('--cy', y.toFixed(1) + 'px');
      raf = (over || Math.abs(tx - x) + Math.abs(ty - y) > .5) ? requestAnimationFrame(tick) : 0;
    };
    frame.addEventListener('pointermove', function(e){
      var r = frame.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!over){ over = true; x = tx; y = ty; frame.classList.add('is-hover'); }
      if (!raf) raf = requestAnimationFrame(tick);
    });
    frame.addEventListener('pointerleave', function(){ over = false; frame.classList.remove('is-hover'); });
  }

  /* scroll: the frame opens out to the full width; the header goes dark while it is over the reel */
  var top0 = 0, ticking = false;
  function measure(){ top0 = stage.getBoundingClientRect().top + window.scrollY - (head ? head.offsetHeight : 64); }
  function onScroll(){
    ticking = false;
    var y = window.scrollY;
    var p = RM ? 1 : Math.min(1, Math.max(0, y / Math.max(1, top0)));
    root.style.setProperty('--p', p.toFixed(4));
    if (head) head.classList.toggle('on-dark', root.getBoundingClientRect().bottom > (head.offsetHeight || 64));
  }
  window.addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  var rz = 0;
  window.addEventListener('resize', function(){
    clearTimeout(rz);
    rz = setTimeout(function(){ measure(); onScroll(); slides.forEach(fit); }, 120);
  });

  /* pause when the reel is off screen or the tab is hidden */
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      inView = es[0].isIntersecting;
      if (inView && slides[cur]) glide(slides[cur]);
      schedule();
    }, { threshold: .15 }).observe(frame);
  }
  d.addEventListener('visibilitychange', function(){ inView = !d.hidden; schedule(); });

  measure(); onScroll();
  show(0);
})();
