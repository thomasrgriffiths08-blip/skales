/* ============================================================
   The cold open. Scroll drives film.currentTime; the film never plays.
   Sizing is in PIXELS, never viewport heights — in vh the exchange rate
   changes per screen and the walk reads as stepping on a big display.
   ============================================================ */
(function(){
  var d = document, sec = d.getElementById('cold'); if (!sec) return;
  var film = d.getElementById('coldFilm'), load = d.getElementById('coldLoad'),
      bar = load && load.querySelector('i'), head = d.querySelector('.site-head'),
      caps = [].slice.call(d.querySelectorAll('.cold-cap p')), title = d.getElementById('coldTitle'),
      voidEl = d.getElementById('coldVoid'), notes = voidEl ? [].slice.call(voidEl.children) : [],
      stage = d.querySelector('.cold-stage');
  var SETTLE = 0.82;                                   /* where the swarm clears and the screen comes up */
  var PX_PER_FRAME = 5, DWELL = 1.0, FPS = 24;
  var lut = null, current = 0, target = 0, laidOutFor = 0, walkPx = 1, arrived = false, raf = null;

  fetch(film.getAttribute('data-lut')).then(function(r){ return r.json(); })
    .then(function(j){ if (Array.isArray(j) && j.length > 2) lut = j; }).catch(function(){});

  /* the motion map: models ease in and out, so equal scroll must not mean equal time */
  function filmFraction(u){
    if (!lut) return u;
    var x = u * (lut.length - 1), i = Math.min(lut.length - 2, Math.floor(x)), f = x - i;
    return lut[i] + (lut[i + 1] - lut[i]) * f;
  }
  /* the film is object-fit: cover, so a percentage of the STAGE drifts off the subject at every
     aspect. --fw is the width of the picture's cover rectangle: everything laid on the phone is
     sized from it, so the overlay tracks the glass on any screen. */
  function frameWidth(){
    if (!stage) return window.innerWidth;
    var w = stage.clientWidth || window.innerWidth || 1200;
    var h = stage.clientHeight || window.innerHeight || 800;
    return Math.max(w, h * 16 / 9);
  }
  function seed(){
    notes.forEach(function(n, i){
      var a = (i / notes.length) * Math.PI * 2 + 0.7;
      n._x = Math.cos(a) * (0.26 + (i % 3) * 0.07);     /* fractions of the frame width */
      n._y = Math.sin(a * 1.7) * 0.20 + (i % 2 ? 0.04 : -0.05);
      n._z = -2600 + i * 250;
      n._r = (i % 2 ? 1 : -1) * (5 + (i % 4) * 3);
    });
  }
  function layout(){
    if (!film.duration) return;
    walkPx = Math.round(film.duration * FPS) * PX_PER_FRAME;
    sec.style.height = (walkPx + window.innerHeight * (1 + DWELL)) + 'px';
    sec.style.setProperty('--fw', frameWidth() + 'px');
    laidOutFor = window.innerHeight;
  }
  function progress(){
    if (!film.duration) return 0;                       /* before metadata walkPx is 1: one pixel would jump to the end */
    var start = sec.getBoundingClientRect().top + window.scrollY;   /* document offset, so the negative
       top margin that slides the film under the masthead cannot skew the start */
    return Math.max(0, Math.min(1, (window.scrollY - start) / walkPx));
  }
  function tick(){
    raf = null;
    if (window.innerHeight !== laidOutFor) layout();    /* some containers never fire resize */
    target = progress();
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.0006) current = target;
    if (film.duration){
      var t = filmFraction(current) * Math.max(0, film.duration - 0.06);
      if (Math.abs(film.currentTime - t) > 0.01) film.currentTime = t;
    }
    /* the title card dissolves over the first sliver of scroll; fall back to raw scroll
       if the film never loads, or the card sits over the page for ever */
    var o = film.duration ? (0.045 - current) / 0.030 : (120 - window.scrollY) / 90;
    o = Math.max(0, Math.min(1, o));
    if (title) title.style.opacity = o;
    caps.forEach(function(p){
      var a = +p.getAttribute('data-from'), b = +p.getAttribute('data-to');
      p.classList.toggle('on', current >= a && current <= b);
    });
    /* the swarm: cards rush the camera through the void the film was shot in */
    if (notes.length){
      var fw = frameWidth(), u = Math.min(1, current / SETTLE), rush = u * u * 2700;
      for (var i = 0; i < notes.length; i++){
        var n = notes[i], z = n._z + rush;
        if (z > 700 || z < -2700){ if (n.style.opacity !== '0') n.style.opacity = '0'; continue; }
        var fade = z < -1500 ? (z + 2700) / 1200 : z > 300 ? (700 - z) / 400 : 1;
        n.style.opacity = Math.max(0, Math.min(1, fade)) * (1 - Math.max(0, (current - SETTLE + 0.06) / 0.06));
        n.style.transform = 'translate3d(' + (n._x * fw - 50) + '%,' + (n._y * fw) + 'px,' + z + 'px) rotateY(' + n._r + 'deg)';
      }
    }
    sec.classList.toggle('settled', current >= SETTLE);
    if ((current >= 1) !== arrived){ arrived = current >= 1; sec.classList.toggle('arrived', arrived); }
    if (head){
      var r = sec.getBoundingClientRect(), hh = head.offsetHeight || 64;
      head.classList.toggle('on-dark', r.top <= hh && r.bottom > hh);
    }
    if (Math.abs(target - current) > 0.0002) raf = requestAnimationFrame(tick);
  }
  function kick(){ if (!raf) raf = requestAnimationFrame(tick); }

  var done = false;
  function ready(){
    if (done) return; done = true;
    clearInterval(poll); sec.classList.add('ready');
    setTimeout(function(){ if (load) load.hidden = true; }, 600);
    layout(); kick();
  }
  var poll = setInterval(function(){
    try{
      if (film.buffered && film.buffered.length && film.duration && bar)
        bar.style.width = Math.min(100, film.buffered.end(film.buffered.length - 1) / film.duration * 100) + '%';
    }catch(e){}
    if (film.readyState >= 4) ready();
  }, 200);
  film.addEventListener('loadedmetadata', function(){ layout(); kick(); });
  film.addEventListener('canplaythrough', ready);
  film.addEventListener('error', ready);
  setTimeout(ready, 12000);                              /* a broken film must never trap the visitor */

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', function(){ layout(); kick(); }, { passive: true });
  /* iOS paints a seeked frame only after one user-initiated play */
  d.addEventListener('pointerdown', function once(){
    d.removeEventListener('pointerdown', once);
    film.play().then(function(){ film.pause(); }).catch(function(){});
  }, { once: true });
  seed(); layout(); kick();
})();
