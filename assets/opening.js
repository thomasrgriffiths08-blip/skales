/* ============================================================
   The opening: one film, drawn frame by frame as you scroll.
   The film is 243 still frames (assets/film/town-d/ for wide screens, town-m/ for tall ones). Scroll picks the frame and
   the picture eases towards it, so it glides rather than jumps; the wheel is never taken over.

   Frames load coarse to fine: every 32nd first, then the gaps halve, so a rough version can be scrolled at once and it
   sharpens to every frame as the rest arrive. Until a frame is in, the nearest one that is stands in for it, and the
   frame the reader is on jumps the queue.

   The lines type in, each owning an equal share of the film. The film ends on the one house still lit; then the page
   fades to white and the headline comes up.
   Where the page cannot be scrolled at all (shown inside a fixed frame, say), the film plays through on its own once.
   Reduce Motion: the film still follows the reader's own scroll (it never moves unless they do), but it tracks the scroll
   directly with no glide, nothing types or plays by itself, and the first line is simply there.
   Data Saver: nothing here runs and the still version stays, since the frames are a large download.
   ============================================================ */
(function(){
  var d = document, root = d.getElementById('top');
  if (!root || !root.classList.contains('op')) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAVE = navigator.connection && navigator.connection.saveData;
  var cv = root.querySelector('.op-film'), ctx = cv && cv.getContext && cv.getContext('2d');
  var base = root.getAttribute('data-film') || '', N = +root.getAttribute('data-frames') || 0;
  if (SAVE || !ctx || !base || !N) return;

  var FILM = .9;                                /* share of the scroll the film itself takes; the fade and the headline take the rest */
  var PAR = 6;                                  /* frames downloading at once */
  var stick = root.querySelector('.op-stick'), head = d.querySelector('.site-head');
  var lines = [].slice.call(root.querySelectorAll('.op-line'));
  var white = root.querySelector('.op-white'), end = root.querySelector('.op-end');
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; };
  var span = function(p, a, b){ return clamp((p - a) / (b - a), 0, 1); };

  root.classList.add('is-film');
  /* what happened, for anyone checking a device: frames in, frames drawn, failed downloads, scroll or time */
  var stat = root.opStat = { set: '', loaded: 0, drawn: 0, failed: 0, mode: 'scroll', moved: false };

  /* ---------- the frames ---------- */
  var set = '', gen = 0, frames = [], state = [], queue = [], busy = 0, shown = -1, ready = false, cur = 0;
  function pickSet(){ return innerWidth / innerHeight < .85 ? 'm' : 'd'; }
  function src(i){ return base + set + '/' + ('00' + (i + 1)).slice(-3) + '.webp'; }
  /* every 32nd frame and the last, then the frames halfway between, and so on down to every frame */
  function order(){
    var o = [], seen = {};
    [32, 16, 8, 4, 2, 1].forEach(function(step){
      for (var i = 0; i < N; i += step) if (!seen[i]){ seen[i] = 1; o.push(i); }
      if (!seen[N - 1]){ seen[N - 1] = 1; o.push(N - 1); }
    });
    return o;
  }
  function load(){
    var my = ++gen;
    set = stat.set = pickSet(); frames = []; state = []; queue = order(); busy = 0; shown = -1; ready = false;
    stat.loaded = stat.drawn = stat.failed = 0;
    root.classList.remove('is-ready');
    pump(my);
  }
  function pump(my){
    while (my === gen && busy < PAR && queue.length){
      var i = queue.shift();
      if (!state[i]) get(i, my);
    }
  }
  function get(i, my){
    var im = new Image();
    state[i] = 1; busy++;
    im.decoding = 'async';
    im.onload = function(){
      var done = function(){
        busy--;
        if (my !== gen) return;
        frames[i] = im; state[i] = 2; stat.loaded++;
        if (!ready) first(im);
        kick(); pump(my);
      };
      if (im.decode) im.decode().then(done, done); else done();
    };
    im.onerror = function(){
      busy--;
      if (my !== gen) return;
      state[i] = 0; stat.failed++;
      if (stat.failed < 60) queue.push(i);      /* tried again after the rest */
      pump(my);
    };
    im.src = src(i);
  }
  /* the first frame in sets the canvas to the film's own size and fades the canvas in over the poster */
  function first(im){
    ready = true;
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    root.classList.add('is-ready');
    if (!scrollable()) byTime('fixed');
  }
  /* the frame the reader is on goes to the front of the queue, with its neighbours */
  var asked = -1;
  function want(f){
    if (f === asked) return;
    asked = f;
    for (var k = 2; k >= -2; k--){ var j = f + k; if (j >= 0 && j < N && !state[j]) queue.unshift(j); }
    pump(gen);
  }
  function nearest(f){
    for (var k = 1; k < N; k++){ if (frames[f - k]) return f - k; if (frames[f + k]) return f + k; }
    return -1;
  }
  function draw(){
    var f = clamp(Math.round(cur), 0, N - 1), g = f;
    if (!frames[f]){ want(f); g = nearest(f); }
    if (g >= 0 && g !== shown){ ctx.drawImage(frames[g], 0, 0, cv.width, cv.height); shown = stat.frame = g; stat.drawn++; }
  }

  /* ---------- the lines ---------- */
  lines.forEach(function(el){
    var text = el.textContent, html = '';
    el._n = text.length; el._shown = -1;
    text.split(/(\s+)/).forEach(function(w){
      if (/^\s+$/.test(w)) { html += w.replace(/./g, '<span> </span>'); return; }
      html += '<b style="white-space:nowrap;font-weight:inherit">' + w.replace(/./g, function(ch){ return '<span>' + ch.replace('&', '&amp;').replace('<', '&lt;') + '</span>'; }) + '</b>';
    });
    el.innerHTML = html; el._chars = el.querySelectorAll('span');
  });
  function type(el, n){
    if (n === el._shown) return;
    var c = el._chars;
    for (var i = 0; i < c.length; i++){ c[i].className = i < n ? (i === n - 1 ? 'on tip' : 'on') : ''; }
    el._shown = n;
  }
  /* each line owns an equal share of the film: types over the first half, holds, erases, then a breath of nothing */
  var intro = 0, t0 = performance.now();
  function words(pf){
    lines.forEach(function(el, i){
      var l = pf * lines.length - i, n;
      if (i === 0 && l < .5) l = Math.max(l, intro * .5);
      if (l <= 0 || l >= .8) n = 0;
      else if (l < .5) n = Math.ceil(el._n * l / .5);
      else if (l < .6) n = el._n;
      else n = Math.floor(el._n * (1 - (l - .6) / .2));
      type(el, n);
    });
  }

  /* ---------- scroll, or time where the page cannot scroll ---------- */
  var p = 0, pe = 0, raf = 0, last = 0, vis = true, lastTop = null, timeAt = 0, swipeY = null, tries = 0, triedAt = 0;
  var RUN = 12000;                              /* played by time: the film at its own speed (10.8s), then the fade and the headline */
  function progress(){
    var r = root.getBoundingClientRect(), hh = head ? head.offsetHeight : 64;
    return clamp((hh - r.top) / Math.max(1, root.offsetHeight - stick.offsetHeight), 0, 1);
  }
  function scrollable(){ var se = d.scrollingElement || d.documentElement; return se.scrollHeight - se.clientHeight > 8; }
  function byTime(why){ if (timeAt || RM) return; timeAt = performance.now(); stat.mode = 'time:' + why; kick(); }
  function frame(now){
    raf = 0;
    var dt = Math.min(64, now - (last || now)); last = now;
    var top = root.getBoundingClientRect().top, moved = lastTop !== null && Math.abs(top - lastTop) > .5;
    lastTop = top;
    if (moved) stat.moved = true;
    intro = RM ? 1 : clamp((now - t0 - 500) / 1700, 0, 1);
    /* a reader swiping or wheeling forward while nothing moves means the page itself cannot scroll here */
    if (!timeAt && ready && !stat.moved && tries >= 3 && now - triedAt > 400) byTime('stuck');
    p = progress();
    if (timeAt) p = Math.max(p, clamp((now - timeAt) / RUN, 0, 1));
    /* the eased share of the film; it drives the words at once and the film as fast as frames can be had */
    var target = Math.min(1, p / FILM);
    pe += (target - pe) * (1 - Math.pow(1 - .16, dt / 16.7));
    if (RM || Math.abs(target - pe) < .0005) pe = target;
    cur = pe * Math.max(0, N - 1);
    if (ready) draw();
    words(pe);
    white.style.opacity = span(p, .9, .95).toFixed(3);
    var e = span(p, .95, .99);
    end.style.opacity = e.toFixed(3);
    root.classList.toggle('is-end', e > 0);
    root.classList.toggle('is-moving', p > .01);
    if (head) head.classList.toggle('on-dark', p < .95 && root.getBoundingClientRect().bottom > (head.offsetHeight || 64));
    /* while the opening is on screen it keeps watching where it sits, so it follows however the page is scrolled */
    if (pe !== target || intro < 1 || vis || timeAt && p < 1) kick();
  }
  function kick(){ if (!raf) raf = requestAnimationFrame(frame); }

  ['scroll', 'resize'].forEach(function(ev){
    window.addEventListener(ev, kick, { passive: true });
    if (window.visualViewport) visualViewport.addEventListener(ev, kick, { passive: true });
  });
  d.addEventListener('scroll', kick, { passive: true, capture: true });
  function tried(){ if (!tries++) triedAt = performance.now(); kick(); }
  window.addEventListener('wheel', function(e){ if (e.deltaY > 0) tried(); }, { passive: true });
  window.addEventListener('touchstart', function(e){ swipeY = e.touches[0] ? e.touches[0].clientY : null; }, { passive: true });
  window.addEventListener('touchmove', function(e){
    var y = e.touches[0] && e.touches[0].clientY;
    if (swipeY !== null && y < swipeY - 24){ swipeY = y; tried(); }
  }, { passive: true });
  if (window.IntersectionObserver) new IntersectionObserver(function(es){ vis = es[es.length - 1].isIntersecting; kick(); }).observe(root);
  var rz = 0;
  window.addEventListener('resize', function(){
    clearTimeout(rz);
    rz = setTimeout(function(){ if (pickSet() !== set) load(); kick(); }, 150);
  });
  /* keyboard users who tab into the headline's buttons before the film ends are taken to the end */
  end.addEventListener('focusin', function(){
    if (p < .99) window.scrollTo({ top: root.offsetTop + root.offsetHeight - stick.offsetHeight - (head ? head.offsetHeight : 64), behavior: 'instant' });
  });

  load(); kick();
})();
