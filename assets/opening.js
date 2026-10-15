/* ============================================================
   The opening: one film, played by scroll.
   The film is a short video with a keyframe every few frames (assets/film/town-d for wide screens, town-m for
   tall ones; an AV1 copy of each for browsers without H.264), fetched whole so every seek is local. Scroll sets the time and the film eases towards it, so it
   glides rather than jumps; the wheel is never taken over. Until the film has arrived, its first frame (the
   poster) is on screen and the lines still type over it.
   The lines type in, each owning an equal share of the film. The film ends on the one house still lit; then the page
   fades to white and the headline comes up.
   Reduce Motion, Data Saver or no video: nothing here runs and the still version stays.
   ============================================================ */
(function(){
  var d = document, root = d.getElementById('top');
  if (!root || !root.classList.contains('op')) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAVE = navigator.connection && navigator.connection.saveData;
  var video = root.querySelector('.op-film');
  if (RM || SAVE || !video || !video.canPlayType) return;
  /* H.264 everywhere it plays (decoded in hardware almost everywhere); AV1 for the few browsers without it */
  var tail = video.canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4' : video.canPlayType('video/mp4; codecs="av01.0.08M.08"') ? '-av1.mp4' : '';
  if (!tail) return;

  var base = root.getAttribute('data-film') || '', FPS = +root.getAttribute('data-fps') || 24;
  if (!base) return;
  var FILM = .9;                                /* share of the scroll the film itself takes; the fade and the headline take the rest */
  var stick = root.querySelector('.op-stick'), head = d.querySelector('.site-head');
  var lines = [].slice.call(root.querySelectorAll('.op-line'));
  var white = root.querySelector('.op-white'), end = root.querySelector('.op-end');
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; };
  var span = function(p, a, b){ return clamp((p - a) / (b - a), 0, 1); };

  root.classList.add('is-film');

  /* ---------- the film ---------- */
  var set = '', N = 0, ready = false, seeking = 0, shown = -1, url = '';
  video.muted = true;
  function pickSet(){ return innerWidth / innerHeight < .85 ? 'm' : 'd'; }
  function load(){
    set = pickSet(); ready = false; seeking = 0; shown = -1;
    root.classList.remove('is-ready');
    var s = set, src = base + s + tail;
    /* the whole file first, so scrubbing never waits on the network; straight from the URL if fetch is refused */
    (window.fetch ? fetch(src).then(function(r){ if (!r.ok) throw 0; return r.blob(); }).then(function(b){ return URL.createObjectURL(b); }) : Promise.reject())
      .catch(function(){ return src; })
      .then(function(u){
        if (s !== set) return;
        if (url && url.indexOf('blob:') === 0) URL.revokeObjectURL(url);
        url = u; video.src = u; video.load();
      });
  }
  /* a page that refuses blob: video gets the file straight from its URL instead */
  video.addEventListener('error', function(){
    if (url.indexOf('blob:') !== 0) return;
    URL.revokeObjectURL(url); url = base + set + tail; video.src = url; video.load();
  });
  video.addEventListener('loadeddata', function(){
    N = Math.max(1, Math.round(video.duration * FPS));
    /* iOS paints seeked frames only once the video has played; muted inline play is allowed, and it stops at once */
    var pr = video.play();
    if (pr && pr.then) pr.then(function(){ video.pause(); seekTo(true); }, function(){ seekTo(true); });
    else { video.pause(); seekTo(true); }
  });
  video.addEventListener('seeked', function(){
    seeking = 0;
    if (!ready){ ready = true; root.classList.add('is-ready'); }
    kick();
  });
  /* the frame the eased position lands on; a seek goes to the middle of it so no browser rounds to the one before */
  function seekTo(force){
    /* one seek at a time; a seek that never reports back is given up on after half a second */
    if (!N || seeking && !force && performance.now() - seeking < 500) return;
    var f = clamp(Math.round(cur), 0, N - 1);
    if (f === shown && !force) return;
    shown = f; seeking = performance.now();
    video.currentTime = Math.min((f + .5) / FPS, video.duration - .001);
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
  var p = 0, pe = 0, cur = 0, raf = 0, last = 0;
  function progress(){
    var r = root.getBoundingClientRect(), hh = head ? head.offsetHeight : 64;
    return clamp((hh - r.top) / Math.max(1, root.offsetHeight - stick.offsetHeight), 0, 1);
  }
  function frame(now){
    raf = 0;
    var dt = Math.min(64, now - (last || now)); last = now;
    intro = clamp((now - t0 - 500) / 1700, 0, 1);
    p = progress();
    /* the eased share of the film; it drives the words at once and the video as fast as it can seek */
    var target = Math.min(1, p / FILM);
    pe += (target - pe) * (1 - Math.pow(1 - .16, dt / 16.7));
    if (Math.abs(target - pe) < .0005) pe = target;
    cur = pe * Math.max(0, N - 1);
    if (ready) seekTo(false);
    words(pe);
    white.style.opacity = span(p, .9, .95).toFixed(3);
    var e = span(p, .95, .99);
    end.style.opacity = e.toFixed(3);
    root.classList.toggle('is-end', e > 0);
    root.classList.toggle('is-moving', p > .01);
    if (head) head.classList.toggle('on-dark', p < .95 && root.getBoundingClientRect().bottom > (head.offsetHeight || 64));
    if (pe !== target || intro < 1) kick();
  }
  function kick(){ if (!raf) raf = requestAnimationFrame(frame); }

  window.addEventListener('scroll', kick, { passive: true });
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
