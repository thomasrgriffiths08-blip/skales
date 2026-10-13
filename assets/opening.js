/* ============================================================
   The opening: one film, played by scroll.
   The film is cut into still frames (assets/opening/d for wide screens, m for tall ones) and drawn to a canvas.
   Scroll picks the frame and the film eases towards it, so it glides rather than jumps; the wheel is never taken over.
   The lines type in, each owning an equal share of the film. The film ends inside the shop window; then the page
   fades to white and the headline comes up.
   Reduce Motion, Data Saver or no canvas: nothing here runs and the still version stays.
   ============================================================ */
(function(){
  var d = document, root = d.getElementById('top');
  if (!root || !root.classList.contains('op')) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAVE = navigator.connection && navigator.connection.saveData;
  var canvas = root.querySelector('.op-canvas'), ctx = canvas && canvas.getContext && canvas.getContext('2d');
  if (RM || SAVE || !ctx) return;

  var N = +root.getAttribute('data-frames') || 0, base = root.getAttribute('data-base') || '';
  if (!N) return;
  var FILM = .9;                                /* share of the scroll the film itself takes; the fade and the headline take the rest */
  var stick = root.querySelector('.op-stick'), head = d.querySelector('.site-head');
  var lines = [].slice.call(root.querySelectorAll('.op-line'));
  var white = root.querySelector('.op-white'), end = root.querySelector('.op-end');
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; };
  var span = function(p, a, b){ return clamp((p - a) / (b - a), 0, 1); };
  var ease = function(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  root.classList.add('is-film');

  /* ---------- frames ---------- */
  var set = '', imgs = [], loaded = 0, queue = [], busy = 0;
  function pickSet(){ return innerWidth / innerHeight < .85 ? 'm' : 'd'; }
  function order(){
    var seen = {}, out = [0, N - 1];
    seen[0] = seen[N - 1] = 1;
    [24, 12, 6, 3, 1].forEach(function(s){ for (var i = 0; i < N; i += s) if (!seen[i]){ seen[i] = 1; out.push(i); } });
    return out;
  }
  function name(i){ var s = String(i + 1); while (s.length < 4) s = '0' + s; return base + set + '/' + s + '.webp'; }
  function pump(){
    while (busy < 6 && queue.length){
      var i = queue.shift(), im = new Image();
      busy++;
      im.decoding = 'async';
      im.onload = (function(i, im, s){ return function(){
        busy--;
        if (s !== set) return;
        imgs[i] = im; loaded++;
        if (i === 0 && !root.classList.contains('is-ready')){ root.classList.add('is-ready'); kick(); }
        pump();
      }; })(i, im, set);
      im.onerror = function(){ busy--; pump(); };
      im.src = name(i);
    }
  }
  function start(){
    set = pickSet(); imgs = new Array(N); loaded = 0; queue = order();
    pump();
  }
  function nearest(t){
    t = Math.round(t);
    for (var k = 0; k < N; k++){
      if (imgs[t - k]) return imgs[t - k];
      if (imgs[t + k]) return imgs[t + k];
    }
    return null;
  }

  /* ---------- the canvas ---------- */
  var W = 0, H = 0, dpr = 1;
  function size(){
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = stick.clientWidth; H = stick.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  /* where the frame sits on screen: cover-fit, centred */
  function cover(im){
    var s = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
    return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h };
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

  /* ---------- scroll ---------- */
  var p = 0, cur = 0, raf = 0, last = 0;
  function progress(){
    var r = root.getBoundingClientRect(), hh = head ? head.offsetHeight : 64;
    return clamp((hh - r.top) / Math.max(1, root.offsetHeight - stick.offsetHeight), 0, 1);
  }
  function frame(now){
    raf = 0;
    var dt = Math.min(64, now - (last || now)); last = now;
    intro = clamp((now - t0 - 500) / 1700, 0, 1);
    p = progress();
    var target = Math.min(1, p / FILM) * (N - 1);
    cur += (target - cur) * (1 - Math.pow(1 - .16, dt / 16.7));
    if (Math.abs(target - cur) < .02) cur = target;
    draw();
    if (cur !== target || intro < 1) kick();
  }
  function draw(){
    var pf = Math.min(1, (cur / (N - 1)));
    words(pf);
    var im = nearest(cur);
    if (im){
      var c = cover(im);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(im, c.x, c.y, c.w, c.h);
    }
    white.style.opacity = span(p, .9, .95).toFixed(3);
    var e = span(p, .95, .99);
    end.style.opacity = e.toFixed(3);
    root.classList.toggle('is-end', e > 0);
    root.classList.toggle('is-moving', p > .01);
    if (head) head.classList.toggle('on-dark', p < .95 && root.getBoundingClientRect().bottom > (head.offsetHeight || 64));
  }
  function kick(){ if (!raf) raf = requestAnimationFrame(frame); }

  window.addEventListener('scroll', kick, { passive: true });
  var rz = 0;
  window.addEventListener('resize', function(){
    clearTimeout(rz);
    rz = setTimeout(function(){ size(); if (pickSet() !== set) start(); kick(); }, 120);
  });
  /* keyboard users who tab into the headline's buttons before the film ends are taken to the end */
  end.addEventListener('focusin', function(){
    if (p < .99) window.scrollTo({ top: root.offsetTop + root.offsetHeight - stick.offsetHeight - (head ? head.offsetHeight : 64), behavior: 'instant' });
  });

  size(); start(); kick();
})();
