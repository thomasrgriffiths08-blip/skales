/* ============================================================
   The cold open. Scroll drives film.currentTime; the film never plays.
   Sizing is in PIXELS, never viewport heights — in vh the exchange rate
   changes per screen and the walk reads as stepping on a big display.

   The beats, in order: the handset turns and settles (the film) · the evening
   arrives on the glass one notification at a time · the six tuck into a stack
   and become one from Skales · that one opens and shows the evening sorted.
   ============================================================ */
(function(){
  var d = document, sec = d.getElementById('cold'); if (!sec) return;
  var film = d.getElementById('coldFilm'), load = d.getElementById('coldLoad'),
      bar = load && load.querySelector('i'), head = d.querySelector('.site-head'),
      caps = [].slice.call(d.querySelectorAll('.cold-cap p')), title = d.getElementById('coldTitle'),
      voidEl = d.getElementById('coldVoid'), notes = voidEl ? [].slice.call(voidEl.children) : [],
      stackEl = d.getElementById('coldStack'),
      cards = stackEl ? [].slice.call(stackEl.children) : [],
      ios = d.getElementById('coldIos'), one = d.getElementById('coldOne'), oc = one && one.querySelector('.oc'), op = one && one.querySelector('.op'),
      dim = d.getElementById('coldDim'), lock = d.getElementById('coldLock'),
      stage = d.querySelector('.cold-stage');

  var FPS = 24, PX_PER_FRAME = 3.2;
  var FILM_END = 0.28;      /* the turn is over inside the first 28% of the walk; raise to slow it */
  var DWELL = 0.35;         /* screens of held picture after the story lands, before the page moves on */
  /* the evening */
  var LAND_FROM = 0.29, LAND_TO = 0.60;    /* six notifications, one at a time */
  var SWARM_END = 0.62, SETTLE = 0.66;     /* the cards in the void funnel into the handset */
  var FOLD_FROM = 0.63, FOLD_TO = 0.78;    /* six tuck into a stack, the stack becomes one */
  var OPEN_FROM = 0.79, OPEN_TO = 0.94;    /* the one opens, and the evening is sorted */

  var lut = null, current = 0, target = 0, laidOutFor = 0, walkPx = 1, arrived = false, raf = null;
  var u = 300, slot = 60, cardH = 52, ocH = 52, panelH = 90, sized = false;

  fetch(film.getAttribute('data-lut')).then(function(r){ return r.json(); })
    .then(function(j){ if (Array.isArray(j) && j.length > 2) lut = j; }).catch(function(){});

  function cl(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t){ t = cl(t); return t * t * (3 - 2 * t); }
  /* a notification does not glide to a stop on a phone: it overshoots by a few pixels and settles */
  function back(t){ t = cl(t); var v = t - 1; return 1 + 2.5 * v * v * v + 1.5 * v * v; }
  /* the motion map: models ease in and out, so equal scroll must not mean equal time */
  function filmFraction(x){
    if (!lut) return x;
    var i = x * (lut.length - 1), k = Math.min(lut.length - 2, Math.floor(i)), f = i - k;
    return lut[k] + (lut[k + 1] - lut[k]) * f;
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
  /* hand-placed, not scattered: the lower left belongs to the type, so nothing flies through it */
  var SPOTS = [[0.26,-0.16],[-0.25,-0.20],[0.30,0.06],[-0.29,-0.06],[0.22,0.17],
               [-0.20,-0.24],[0.31,-0.10],[-0.31,0.01],[0.17,-0.03]];
  function seed(){
    notes.forEach(function(n, i){
      var sp = SPOTS[i % SPOTS.length];
      n._x = sp[0]; n._y = sp[1];
      n._z = -2600 + i * 250;
      n._r = (i % 2 ? 1 : -1) * (5 + (i % 4) * 3);
    });
  }
  function layout(){
    if (!film.duration) return;
    /* the film is only the first FILM_END of the walk, so the walk is that much longer than the film */
    walkPx = Math.round(Math.round(film.duration * FPS) * PX_PER_FRAME / FILM_END);
    sec.style.height = (walkPx + window.innerHeight * (1 + DWELL)) + 'px';
    sec.setAttribute('data-walk', walkPx);   /* so a harness can scroll to an exact beat */
    var fw0 = frameWidth();
    sec.style.setProperty('--fw', fw0 + 'px');
    /* the picture is cropped hard on a narrow screen, so the cards are spread against the
       SCREEN, not the picture — otherwise every one of them flies off a phone. */
    sec.style.setProperty('--nw', Math.min(fw0, (window.innerWidth || 1200) * 1.55) + 'px');
    u = fw0 * 0.1797;                                   /* the glass width: iOS's own 393pt */
    cardH = (cards[0] && cards[0].offsetHeight) || u * 0.19;
    slot = cardH + u * 0.022;
    /* measured, never arithmetic: let the card find its own height, read it, put it back. Working
       the panel out from em ratios got it 25% short and the last line never appeared. */
    if (one && oc){
      one.style.height = 'auto';
      var full = one.offsetHeight;
      ocH = oc.offsetHeight || cardH;
      panelH = Math.max(0, full - ocH);
      one.style.height = ocH + 'px';
      sized = false;                                    /* whatever the box does next, measure it again */
    }
    laidOutFor = window.innerHeight;
  }
  function progress(){
    if (!film.duration) return 0;                       /* before metadata walkPx is 1: one pixel would jump to the end */
    var start = sec.getBoundingClientRect().top + window.scrollY;   /* document offset, so the negative
       top margin that slides the film under the masthead cannot skew the start */
    return Math.max(0, Math.min(1, (window.scrollY - start) / walkPx));
  }

  /* ---------- the evening arriving on the glass ---------- */
  function glass(){
    if (!cards.length) return;
    var n = cards.length, step = (LAND_TO - LAND_FROM) / n,
        fold = ease((current - FOLD_FROM) / (FOLD_TO - FOLD_FROM)),
        gone = ease((current - 0.712) / 0.050),           /* the last card leaves... */
        oneIn = ease((current - 0.728) / 0.048),          /* ...and the Skales one takes its place, close
           enough behind it to read as the same card changing, far enough not to double-expose */
        land = [], ent = [];
    for (var k = 0; k < n; k++){
      var x = (current - (LAND_FROM + k * step)) / (step * 0.8);
      land[k] = ease(x);                                 /* fade and shove: monotonic, so the stack never wobbles */
      ent[k] = back(x);                                  /* the card's own arrival, which does */
    }
    for (var i = 0; i < n; i++){
      var push = 0;                                     /* every newer card that has arrived shoves this one up a slot */
      for (var j = i + 1; j < n; j++) push += land[j];
      /* the fold ripples from the oldest down, and each card fades as it travels, so no two of
         them are ever legible in the same place — six cards pouring into the one at the bottom */
      var fi = ease((fold - i * 0.045) / 0.6),
          yl = (1 - ent[i]) * slot * 1.06 - push * slot,
          y = yl * (1 - fi * fi),                       /* it barely moves until it is already faint */
          s = (0.965 + 0.035 * land[i]) * (1 - 0.045 * fi * (i < n - 1 ? 1 : 0)),
          o = land[i] * (i < n - 1 ? 1 - cl(fi * 1.9) : 1 - cl(gone * 2));
      var c = cards[i];
      c.style.opacity = o.toFixed(3);
      c.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
      c.style.zIndex = i + 1;
    }
    if (!one) return;
    var open = ease((current - OPEN_FROM) / (OPEN_TO - OPEN_FROM));
    /* the panel's real height, read once, at the first frame it is needed — measuring it up front
       raced the stage settling and came out short every time, so the last line never showed */
    if (open > 0 && !sized){
      sized = true; ocH = oc.offsetHeight || cardH;
      panelH = Math.max(0, one.scrollHeight - ocH);
    }
    one.style.opacity = oneIn.toFixed(3);
    one.style.height = (ocH + panelH * open).toFixed(1) + 'px';
    if (op) op.style.opacity = ease((open - 0.22) / 0.5);
    if (dim) dim.style.opacity = (0.12 * open).toFixed(3);
    if (lock) lock.style.opacity = (1 - 0.5 * open).toFixed(3);
  }

  function tick(){
    raf = null;
    if (window.innerHeight !== laidOutFor) layout();    /* some containers never fire resize */
    target = progress();
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.0006) current = target;
    if (film.duration){
      var t = filmFraction(Math.min(1, current / FILM_END)) * Math.max(0, film.duration - 0.06);
      if (Math.abs(film.currentTime - t) > 0.01) film.currentTime = t;
    }
    /* the title card dissolves over the first sliver of scroll; fall back to raw scroll
       if the film never loads, or the card sits over the page for ever */
    var o = film.duration ? (0.075 - current) / 0.055 : (160 - window.scrollY) / 110;
    if (title) title.style.opacity = cl(o);
    /* the handset is DARK for the first two thirds of the film and lights up at t=5.4s, which the
       motion map puts at p=0.19. So the screen may not exist before then — a cream rectangle over
       an unlit phone is the one thing that would give the whole shot away. It wakes as the film's
       own glass wakes, by which point the handset is square to within two pixels. */
    if (ios) ios.style.opacity = ease((current - 0.248) / 0.034).toFixed(3);
    caps.forEach(function(p){
      var a = +p.getAttribute('data-from'), b = +p.getAttribute('data-to');
      p.classList.toggle('on', current >= a && current <= b);
    });
    /* the swarm: the same cards rush the camera through the void, then funnel into the handset */
    if (notes.length){
      var fw = Math.min(frameWidth(), (window.innerWidth || 1200) * 1.55),
          uu = Math.min(1, current / SWARM_END), rush = uu * uu * 2700,
          funnel = ease((uu - 0.6) / 0.4), pull = funnel * 0.94;
      for (var i = 0; i < notes.length; i++){
        var n = notes[i], zr = n._z + rush;
        /* culled on the RAW z, so a card that has flown past the camera cannot be dragged back
           into shot by the funnel — the decision has to move only one way with the scroll */
        if (zr > 380 || zr < -2700){ if (n.style.opacity !== '0') n.style.opacity = '0'; continue; }
        var fade = zr < -1500 ? (zr + 2700) / 1200 : zr > 180 ? (380 - zr) / 200 : 1;
        var z = zr + (-300 - zr) * funnel;              /* drawn back toward the glass, not past your ear */
        n.style.opacity = (cl(fade) * (1 - funnel)).toFixed(3);   /* all the way to nothing: 14% of a card left over reads as dirt */
        n.style.transform = 'translate3d(' + (n._x * fw * (1 - pull) - 50) + '%,'
          + (n._y * fw * (1 - pull)).toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + n._r * (1 - pull) + 'deg)';
      }
    }
    glass();
    sec.classList.toggle('settled', current >= SETTLE);
    var atEnd = current >= 0.99;
    if (atEnd !== arrived){ arrived = atEnd; sec.classList.toggle('arrived', arrived); }
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
  /* the stage settles late in some containers, and everything on the glass is sized off its
     width — so watch the box itself rather than trusting a resize event that never comes */
  if (window.ResizeObserver && stage){
    var seenW = 0;
    new ResizeObserver(function(){
      var w = stage.clientWidth + stage.clientHeight;
      if (w !== seenW){ seenW = w; layout(); kick(); }
    }).observe(stage);
  }
  window.addEventListener('load', function(){ layout(); kick(); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function(){ layout(); kick(); });
  setTimeout(function(){ layout(); kick(); }, 800);
  seed(); layout(); kick();
})();
