/* ============================================================
   The rack and the rig.
   Cells show a real still and wake into the locked live build.
   Exactly one cell is ever awake; a rig owns exactly one iframe.
   All paths are relative via SITE.base so any page depth works.
   ============================================================ */
(function(){
  var d = document, S = window.SITE || {}, b = S.base || '', B = window.BUILDS || [], LN = window.LANES || {};
  var ORDER = ['loud', 'motion', 'quiet', 'direct', 'broad', 'specific'];
  /* the rail lists channels lane by lane (websites first), each lane in channel order */
  var R = B.slice().sort(function(a, c){ var la = ORDER.indexOf(a.lane), lc = ORDER.indexOf(c.lane); return la !== lc ? la - lc : a.n - c.n; });
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var demo = function(x){ return b + 'demos/' + x.slug + '/'; };
  var page = function(x){ return b + 'work/' + x.slug + '/'; };
  var still = function(x){ return b + 'assets/stills/' + pad(x.n) + '.webp'; };
  var byN = function(n){ for (var i = 0; i < B.length; i++) if (B[i].n === n) return B[i]; return null; };
  var bySlug = function(s){ for (var i = 0; i < B.length; i++) if (B[i].slug === s) return B[i]; return null; };
  /* the page borrows the running build's colours: accent, its ink, and the shade of it that reads as text */
  function tint(x){ if (!x) return; var r = d.documentElement.style;
    r.setProperty('--c', x.c); if (x.cInk) r.setProperty('--c-ink', x.cInk); if (x.cText) r.setProperty('--c-text', x.cText); r.setProperty('--chan', x.c);
    d.documentElement.setAttribute('data-ch', x.n); }
  window.TINT = tint;
  var mk = function(x){
    var f = d.createElement('iframe'); f.src = demo(x); f.setAttribute('title', x.name + ' — live build'); f.setAttribute('loading', 'lazy'); return f;
  };

  /* ---------- cells ---------- */
  function cellHTML(x){
    return '<article class="cell" data-n="' + x.n + '" style="--m:' + (x.cText || x.c) + '">'
      + '<div class="frame"><img class="still" src="' + still(x) + '" width="800" height="500" alt="' + x.name + ' — ' + x.short.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">'
      + '<a class="cover" href="' + page(x) + '">Open ' + x.name + '</a>'
      + '<button class="wake" type="button" data-wake><span class="lamp"></span><span class="wk">Wake it</span></button></div>'
      + '<div class="meta"><span class="plate"><span>CH ' + pad(x.n) + '</span><span><i class="sw" style="background:' + x.c + '"></i>' + (x.trade || x.biz) + '</span><span>' + (x.kind === 'site' ? 'Website' : 'Tool') + (LN[x.lane] ? ' · ' + LN[x.lane].name : '') + '</span></span>'
      + '<h3><a href="' + page(x) + '">' + x.name + '</a></h3><p>' + x.short + '</p>'
      + '<div class="foot"><a href="' + page(x) + '">Its page <span class="arr">&rarr;</span></a><a class="go" href="' + demo(x) + '" target="_blank" rel="noopener">' + (x.mobile ? 'Open it' : 'Run it') + ' <span class="arr">&rarr;</span></a></div></div></article>';
  }
  function fit(frame){ var f = frame.querySelector('iframe'); if (!f) return; var s = frame.clientWidth / 1280; f.style.transform = 'scale(' + s + ')'; f.style.height = (frame.clientHeight / s) + 'px'; }
  var awake = null, hoverTimer = null;
  function label(cell, live){ var wk = cell.querySelector('.wk'), l = cell.querySelector('.wake .lamp'); if (wk) wk.textContent = live ? 'Live' : 'Wake it'; if (l) l.classList.toggle('is-live', !!live); }
  function sleep(){ if (!awake) return; var f = awake.querySelector('iframe'); if (f) f.remove(); awake.classList.remove('is-awake'); label(awake, false); awake = null; }
  function wake(cell){
    if (awake === cell) return; sleep();
    var x = byN(+cell.getAttribute('data-n')); if (!x) return;
    var frame = cell.querySelector('.frame'), f = mk(x);
    f.setAttribute('scrolling', 'no'); f.setAttribute('tabindex', '-1'); f.setAttribute('aria-hidden', 'true');
    frame.appendChild(f); fit(frame); cell.classList.add('is-awake'); label(cell, true); awake = cell;
    tint(x);
  }
  function bind(scope){
    scope.querySelectorAll('.cell').forEach(function(cell){
      cell.addEventListener('mouseenter', function(){ clearTimeout(hoverTimer); hoverTimer = setTimeout(function(){ wake(cell); }, 180); });
      cell.addEventListener('mouseleave', function(){ clearTimeout(hoverTimer); });
      var btn = cell.querySelector('[data-wake]');
      if (btn) btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if (awake === cell) sleep(); else wake(cell); });
    });
  }
  window.addEventListener('resize', function(){ if (awake) fit(awake.querySelector('.frame')); }, { passive: true });
  window.renderRack = function(sel, list){
    var el = typeof sel === 'string' ? d.querySelector(sel) : sel; if (!el) return;
    if (awake && el.contains(awake)) awake = null;
    el.innerHTML = (list || B).map(cellHTML).join(''); bind(el);
  };
  /* the homepage strip declares its channel order in data-strip */
  var strip = d.getElementById('stripRack');
  if (strip && strip.getAttribute('data-strip')){
    window.renderRack('#stripRack', strip.getAttribute('data-strip').split(',').map(function(n){ return byN(+n); }).filter(Boolean));
  }

  /* ---------- the rig ---------- */
  window.initRig = function(startN, opts){
    opts = opts || {};
    var stage = d.getElementById('viewport'); if (!stage) return;
    var rail = d.getElementById('rail'), urlEl = d.getElementById('rigUrl'), popEl = d.getElementById('rigPop'),
        capEl = d.getElementById('rigCap'), lamp = d.getElementById('rigLamp');
    var current = null, frame = null;
    if (rail && !opts.solo){
      var html = '', last = null;
      R.forEach(function(x, i){
        var g = (LN[x.lane] ? LN[x.lane].kindWord + ' · ' + LN[x.lane].name : x.group);
        if (!opts.compact && g !== last){ html += '<div class="rail-grp">' + g + '</div>'; last = g; }
        html += '<button class="ch" type="button" role="tab" aria-selected="false" data-n="' + x.n + '" style="--i:' + i + '"' + (opts.compact ? ' title="' + x.name + '"' : '') + '>'
             + (opts.compact ? '<img src="' + still(x) + '" width="800" height="500" alt="" loading="lazy" decoding="async">' : '')
             + '<span class="n">' + pad(x.n) + '</span><span class="sw" style="background:' + x.c + '"></span><span class="nm">' + x.name + '</span></button>';
      });
      rail.innerHTML = html;
    }
    function select(n){
      var x = byN(n); if (!x || (current && current.n === n)) return; current = x;
      if (rail) rail.querySelectorAll('.ch').forEach(function(c){ c.setAttribute('aria-selected', String(+c.getAttribute('data-n') === n)); });
      if (!frame){ stage.innerHTML = ''; frame = mk(x); frame.removeAttribute('loading'); stage.appendChild(frame); } else frame.src = demo(x);
      tint(x);
      var hp = d.getElementById('heroPoster');
      if (hp){ var im = hp.querySelector('img'), a = hp.querySelector('a'), sp = hp.querySelector('.spec span');
        if (im){ im.src = still(x); im.alt = x.name + ' — ' + x.short; } if (a){ a.href = demo(x); a.textContent = x.mobile ? 'Open it full screen' : 'Open it anyway'; }
        if (sp) sp.textContent = x.mobile ? 'Built for phones too' : 'Best on a bigger screen'; }
      /* centre the selected still in the strip — horizontally only. scrollIntoView would also scroll the page. */
      if (rail && opts.compact){ var sel = rail.querySelector('.ch[data-n="' + n + '"]'); if (sel){ var target = sel.offsetLeft - (rail.clientWidth - sel.offsetWidth) / 2; if (rail.scrollTo) rail.scrollTo({ left: target, behavior: 'smooth' }); else rail.scrollLeft = target; } }
      if (lamp) lamp.classList.add('is-live');
      if (urlEl) urlEl.innerHTML = (S.origin || '').replace(/^https?:\/\//, '') + '/demos/<b>' + x.slug + '</b>/';
      if (popEl) popEl.href = demo(x);
      if (capEl && opts.compact){
        capEl.innerHTML = '<div><h3><a class="lnk" href="' + page(x) + '">' + x.name + '</a></h3><p>' + x.short + '</p></div>'
          + '<div class="rig-cap-side"><a class="lnk" href="' + demo(x) + '" target="_blank" rel="noopener">Open full size</a></div>';
      } else if (capEl){
        capEl.innerHTML = '<div><h3><a class="lnk" href="' + page(x) + '">' + x.name + '</a></h3><p>' + x.long + '</p><p class="proves">' + x.proves + '</p>'
          + '<div class="tags">' + x.tags.map(function(t){ return '<span>' + t + '</span>'; }).join('') + '</div></div>'
          + '<div class="rig-cap-side"><span class="plate"><span>CH ' + pad(x.n) + '</span><span><i class="sw" style="background:' + x.c + '"></i>' + x.biz + '</span></span>'
          + '<a class="lnk" style="display:inline-block;margin-top:10px" href="' + page(x) + '">Its own page</a></div>';
      }
    }
    if (rail) rail.addEventListener('click', function(e){ var c = e.target.closest('.ch'); if (c) select(+c.getAttribute('data-n')); });
    d.querySelectorAll('[data-size]').forEach(function(btn){
      btn.addEventListener('click', function(){ var v = btn.getAttribute('data-size'); stage.className = 'viewport' + (v ? ' sz-' + v : '');
        d.querySelectorAll('[data-size]').forEach(function(o){ o.setAttribute('aria-pressed', String(o === btn)); }); });
    });
    var reload = d.getElementById('rigReload'); if (reload) reload.addEventListener('click', function(){ if (frame && current) frame.src = demo(current); });
    if (rail) rail.addEventListener('keydown', function(e){
      var v = !opts.compact, nk = v ? 'ArrowDown' : 'ArrowRight', pk = v ? 'ArrowUp' : 'ArrowLeft';
      if (e.key !== nk && e.key !== pk) return; e.preventDefault();
      var i = R.findIndex(function(x){ return current && x.n === current.n; });
      var nx = R[(i + (e.key === nk ? 1 : R.length - 1)) % R.length]; select(nx.n);
      var c = rail.querySelector('.ch[data-n="' + nx.n + '"]'); if (c){ c.focus(); c.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    });
    var m = /(?:^|#|&)ch=(\d+)/.exec(location.hash || '');
    select(m && !opts.solo ? +m[1] : (startN || 2));
  };

  /* ---------- solo viewports (What I do): mount when they scroll into view ---------- */
  var solos = d.querySelectorAll('[data-solo]');
  if (solos.length){
    var mount = function(vp){ var x = bySlug(vp.getAttribute('data-solo')); if (!x || vp.querySelector('iframe')) return; vp.innerHTML = ''; var f = mk(x); f.removeAttribute('loading'); vp.appendChild(f); };
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ mount(e.target); io.unobserve(e.target); } }); }, { rootMargin: '200px 0px' });
      solos.forEach(function(v){ io.observe(v); });
    } else solos.forEach(mount);
  }
})();
