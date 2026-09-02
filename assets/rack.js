/* ============================================================
   The rack and the rig.
   A cell shows a real still of the build. Touch it and the live
   build mounts in its place. Exactly one cell is ever awake, and
   the rig owns exactly one iframe.
   ============================================================ */
(function(){
  var d = document;
  var BASE = window.BUILD_BASE, B = window.BUILDS;
  var pad = function(n){ return (n<10?'0':'') + n; };
  var still = function(b){ return 'assets/stills/' + pad(b.n) + '.webp'; };
  var byN = function(n){ for (var i=0;i<B.length;i++) if (B[i].n===n) return B[i]; return null; };

  /* ---------- a cell ---------- */
  function cellHTML(b){
    return ''
      + '<article class="cell" data-n="'+b.n+'">'
      +   '<div class="frame">' + window.poster(b)
      +     '<img class="still" src="'+still(b)+'" alt="" loading="lazy" decoding="async" onerror="this.remove()">'
      +     '<button class="wake" type="button" data-wake><span class="lamp"></span><span class="wk">Wake it</span></button>'
      +   '</div>'
      +   '<div class="meta">'
      +     '<span class="plate"><span>CH '+pad(b.n)+'</span>'
      +       '<span><i class="sw" style="background:'+b.c+'"></i>'+b.biz+'</span>'
      +       '<span>'+(b.kind==='site'?'Website':'Tool')+'</span></span>'
      +     '<h3>'+b.name+'</h3>'
      +     '<p>'+b.short+'</p>'
      +     '<div class="foot"><span>Hover to wake</span>'
      +       '<a href="'+BASE+b.f+'" target="_blank" rel="noopener">Open full size</a></div>'
      +   '</div>'
      + '</article>';
  }

  function fitFrame(frame){
    var f = frame.querySelector('iframe'); if (!f) return;
    var s = frame.clientWidth / 1280;
    f.style.transform = 'scale(' + s + ')';
    f.style.height = (frame.clientHeight / s) + 'px';
  }

  var awake = null, hoverTimer = null;
  function setLabel(cell, live){
    var wk = cell.querySelector('.wk'), lamp = cell.querySelector('.wake .lamp');
    if (wk) wk.textContent = live ? 'Live' : 'Wake it';
    if (lamp) lamp.classList.toggle('is-live', !!live);
  }
  function sleep(){
    if (!awake) return;
    var f = awake.querySelector('iframe'); if (f) f.remove();
    awake.classList.remove('is-awake'); setLabel(awake, false);
    awake = null;
  }
  function wake(cell){
    if (awake === cell) return;
    sleep();
    var b = byN(+cell.getAttribute('data-n')); if (!b) return;
    var frame = cell.querySelector('.frame');
    var f = d.createElement('iframe');
    f.src = BASE + b.f;
    f.setAttribute('title', b.name + ' — live preview');
    f.setAttribute('scrolling','no'); f.setAttribute('tabindex','-1'); f.setAttribute('aria-hidden','true');
    frame.appendChild(f);
    fitFrame(frame);
    cell.classList.add('is-awake'); setLabel(cell, true);
    awake = cell;
  }

  function bindRack(scope){
    scope.querySelectorAll('.cell').forEach(function(cell){
      cell.addEventListener('mouseenter', function(){
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function(){ wake(cell); }, 180);
      });
      cell.addEventListener('mouseleave', function(){ clearTimeout(hoverTimer); });
      var btn = cell.querySelector('[data-wake]');
      if (btn) btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        if (awake === cell) sleep(); else wake(cell);
      });
    });
  }
  window.addEventListener('resize', function(){ if (awake) fitFrame(awake.querySelector('.frame')); }, { passive:true });

  window.renderRack = function(sel, list){
    var el = d.querySelector(sel); if (!el) return;
    if (awake && el.contains(awake)) awake = null;
    el.innerHTML = (list || B).map(cellHTML).join('');
    bindRack(el);
  };

  /* ---------- the rig ---------- */
  window.initRig = function(startN, opts){
    opts = opts || {};
    var rail = d.getElementById('rail'), stage = d.getElementById('viewport');
    if (!rail || !stage) return;
    var urlEl = d.getElementById('rigUrl'), popEl = d.getElementById('rigPop'),
        capEl = d.getElementById('rigCap'), lamp = d.getElementById('rigLamp');
    var current = null, frame = null;

    var html = '', lastGrp = null;
    B.forEach(function(b){
      if (!opts.compact && b.group !== lastGrp){ html += '<div class="rail-grp">'+b.group+'</div>'; lastGrp = b.group; }
      html += '<button class="ch" type="button" role="tab" aria-selected="false" data-n="'+b.n+'"'
           +  (opts.compact ? ' title="'+b.name+'"' : '') + '>'
           +  '<span class="n">'+pad(b.n)+'</span>'
           +  '<span class="sw" style="background:'+b.c+'"></span>'
           +  '<span class="nm">'+b.name+'</span></button>';
    });
    rail.innerHTML = html;

    function select(n, focusStage){
      var b = byN(n); if (!b || (current && current.n === n)) return;
      current = b;
      rail.querySelectorAll('.ch').forEach(function(x){
        x.setAttribute('aria-selected', String(+x.getAttribute('data-n') === n));
      });
      if (!frame){
        stage.innerHTML = '';
        frame = d.createElement('iframe');
        frame.setAttribute('title','Live build preview');
        stage.appendChild(frame);
      }
      frame.src = BASE + b.f;
      d.documentElement.style.setProperty('--chan', b.c);
      if (lamp) lamp.classList.add('is-live');
      if (urlEl) urlEl.innerHTML = 'thomasrgriffiths08-blip.github.io/showcase/<b>'+b.f+'</b>';
      if (popEl) popEl.href = BASE + b.f;
      if (capEl && opts.compact){
        capEl.innerHTML = '<div><h3>'+b.name+'</h3><p>'+b.short+'</p></div>'
          + '<div class="rig-cap-side"><a class="lnk" href="'+BASE+b.f+'" target="_blank" rel="noopener">Open full size</a></div>';
      } else if (capEl){
        capEl.innerHTML = ''
          + '<div><h3>'+b.name+'</h3>'
          +   '<p>'+b.long+'</p>'
          +   '<p class="proves">'+b.proves+'</p>'
          +   '<div class="tags">'+b.tags.map(function(t){return '<span>'+t+'</span>';}).join('')+'</div></div>'
          + '<div class="rig-cap-side"><span class="plate"><span>CH '+pad(b.n)+'</span>'
          +   '<span><i class="sw" style="background:'+b.c+'"></i>'+b.biz+'</span></span></div>';
      }
      if (focusStage && frame.focus) frame.focus();
    }

    rail.addEventListener('click', function(e){
      var btn = e.target.closest('.ch'); if (!btn) return;
      select(+btn.getAttribute('data-n'), true);
    });
    d.querySelectorAll('[data-size]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var v = btn.getAttribute('data-size');
        stage.className = 'viewport' + (v ? ' sz-' + v : '');
        d.querySelectorAll('[data-size]').forEach(function(o){ o.setAttribute('aria-pressed', String(o === btn)); });
      });
    });
    var reload = d.getElementById('rigReload');
    if (reload) reload.addEventListener('click', function(){ if (frame && current) frame.src = BASE + current.f; });

    rail.addEventListener('keydown', function(e){
      var vertical = !opts.compact;
      var nextKey = vertical ? 'ArrowDown' : 'ArrowRight', prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
      if (e.key !== nextKey && e.key !== prevKey) return;
      e.preventDefault();
      var i = B.findIndex(function(x){ return current && x.n === current.n; });
      var next = B[(i + (e.key === nextKey ? 1 : B.length - 1)) % B.length];
      select(next.n, false);
      var btn = rail.querySelector('.ch[data-n="'+next.n+'"]');
      if (btn){ btn.focus(); btn.scrollIntoView({block:'nearest', inline:'nearest'}); }
    });

    var m = /(?:^|#|&)ch=(\d+)/.exec(location.hash || '');
    select(m ? +m[1] : (startN || 2));
  };
})();
