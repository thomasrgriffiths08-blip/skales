/* ============================================================
   The device: one live build in a phone, thumbnails to change it, the page's accent follows.
   The wall: every build as a phone still, filtered in place.
   Paths are relative via SITE.base so any page depth works.
   ============================================================ */
(function(){
  var d = document, S = window.SITE || {}, b = S.base || '', B = window.BUILDS || [], LN = window.LANES || {};
  var ORDER = ['loud', 'motion', 'quiet', 'direct', 'system'];
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var demo = function(x){ return b + 'demos/' + x.slug + '/#s=1'; };
  var page = function(x){ return b + 'work/' + x.slug + '/'; };
  var phone = function(x){ return b + 'assets/phones/' + pad(x.n) + '.webp'; };
  var byN = function(n){ for (var i = 0; i < B.length; i++) if (B[i].n === n) return B[i]; return null; };
  var bySlug = function(s){ for (var i = 0; i < B.length; i++) if (B[i].slug === s) return B[i]; return null; };
  var esc = function(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var laneName = function(x){ return LN[x.lane] ? LN[x.lane].name : ''; };
  var kindWord = function(x){ return x.kind === 'site' ? 'Website' : 'Tool'; };

  /* the page borrows the running build's accent, its ink, and the shade of it that reads as text */
  function tint(x){ if (!x) return; var r = d.documentElement.style;
    r.setProperty('--c', x.c); if (x.cInk) r.setProperty('--c-ink', x.cInk); if (x.cText) r.setProperty('--c-text', x.cText);
    d.documentElement.setAttribute('data-ch', x.n); }
  window.TINT = tint;

  /* ---------- a tile: a website is a phone, a tool is a screen; the still turns into a short clip as it scrolls in ---------- */
  var clip = function(x, ext){ return b + 'assets/clips/' + pad(x.n) + '.' + ext; };
  function tileHTML(x, opts){
    opts = opts || {};
    var wide = x.kind === 'tool';
    return '<a class="tile' + (wide ? ' is-wide' : '') + '" href="' + page(x) + '" data-n="' + x.n + '" data-kind="' + x.kind + '" data-lane="' + x.lane + '" data-trade="' + esc(x.tk || '') + '">'
      + '<span class="shell"><img src="' + clip(x, 'webp') + '" width="' + (wide ? 1280 : 600) + '" height="' + (wide ? 800 : 1077) + '" alt="' + esc(x.name) + (wide ? ' on a laptop: ' : ' on a phone: ') + esc(x.short) + '" loading="lazy" decoding="async">'
      + '<video muted playsinline preload="none" data-src="' + clip(x, 'mp4') + '" aria-hidden="true"></video></span>'
      + '<span class="cap">' + (opts.dir ? '<span class="dir">' + opts.dir + '</span>' : '') + '<b>' + esc(x.name) + '</b><span>' + esc(x.short) + '</span><span class="for">' + esc(kindWord(x) + ' · ' + (x.trade || x.biz)) + '</span></span></a>';
  }
  window.tileHTML = tileHTML;
  window.renderWall = function(sel, list){
    var el = typeof sel === 'string' ? d.querySelector(sel) : sel; if (!el) return;
    el.innerHTML = (list || B).map(function(x){ return tileHTML(x); }).join('');
    if (window.skClips) skClips(el);
  };
  d.querySelectorAll('[data-wall]').forEach(function(el){
    var spec = el.getAttribute('data-wall'), list;
    if (spec === 'all') list = B.slice();
    else if (spec === 'site' || spec === 'tool') list = B.filter(function(x){ return x.kind === spec; });
    else if (/^\d/.test(spec)) list = spec.split(',').map(function(n){ return byN(+n); }).filter(Boolean);
    else list = B.filter(function(x){ return x.lane === spec; });
    window.renderWall(el, list);
  });

  /* ---------- the device ---------- */
  window.initDevice = function(startN, opts){
    opts = opts || {};
    var dev = d.getElementById('device'); if (!dev) return;
    var screen = dev.querySelector('.screen'), thumbs = d.getElementById('thumbs'), name = d.getElementById('devName'), who = d.getElementById('devWho'),
        open = d.getElementById('devOpen'), its = d.getElementById('devPage'), addr = d.getElementById('devAddr');
    var frame = null, current = null, list = opts.list || B.slice().sort(function(a, c){ var la = ORDER.indexOf(a.lane), lc = ORDER.indexOf(c.lane); return la !== lc ? la - lc : a.n - c.n; });
    if (thumbs){
      thumbs.innerHTML = list.map(function(x){
        return '<button type="button" role="tab" aria-selected="false" data-n="' + x.n + '" title="' + esc(x.name) + '"><span class="shell"><img src="' + phone(x) + '" width="585" height="1266" alt="" loading="lazy" decoding="async"></span><span>' + esc(x.name) + '</span></button>';
      }).join('');
      thumbs.addEventListener('click', function(e){ var t = e.target.closest('button[data-n]'); if (t) select(+t.getAttribute('data-n'), true); });
      thumbs.addEventListener('keydown', function(e){
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault();
        var i = list.findIndex(function(x){ return current && x.n === current.n; });
        var nx = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length]; select(nx.n, true);
        var t = thumbs.querySelector('button[data-n="' + nx.n + '"]'); if (t) t.focus();
      });
    }
    function select(n, user){
      var x = byN(n); if (!x || (current && current.n === n)) return; current = x;
      dev.classList.remove('is-live');
      /* on a phone a build inside the page fights the page for the scroll, so it is a still that opens the viewer */
      if (window.matchMedia && matchMedia('(max-width: 760px)').matches){
        screen.innerHTML = '<img class="dev-still" src="' + phone(x) + '" width="585" height="1266" alt="' + esc(x.name) + ' on a phone">'
          + '<button type="button" class="dev-play" data-view="' + x.slug + '"><span>Use it full screen</span></button>';
        dev.classList.add('is-live');
      } else if (!frame){
        frame = d.createElement('iframe'); frame.src = demo(x); frame.setAttribute('title', x.name + ' — live build');
        frame.addEventListener('load', function(){ dev.classList.add('is-live'); screen.classList.remove('fade'); });
        screen.appendChild(frame);
      } else { screen.classList.add('fade'); setTimeout(function(){ frame.src = demo(x); }, 120); }
      tint(x);
      if (thumbs){
        thumbs.querySelectorAll('button').forEach(function(t){ t.setAttribute('aria-selected', String(+t.getAttribute('data-n') === n)); });
        var sel = thumbs.querySelector('button[data-n="' + n + '"]');
        if (sel && user){ var target = sel.offsetLeft - (thumbs.clientWidth - sel.offsetWidth) / 2; if (thumbs.scrollTo) thumbs.scrollTo({ left: target, behavior: 'smooth' }); else thumbs.scrollLeft = target; }
      }
      if (name) name.textContent = x.name;
      if (who) who.textContent = kindWord(x) + ' · ' + (x.trade || x.biz);
      if (open) open.href = demo(x);
      if (its) its.href = page(x);
      if (addr) addr.textContent = (S.origin || '').replace(/^https?:\/\//, '') + '/demos/' + x.slug + '/';
    }
    var m = /(?:^|#|&)ch=(\d+)/.exec(location.hash || '');
    select(m ? +m[1] : (startN || list[0].n), false);
  };
  var dev = d.getElementById('device');
  if (dev && dev.getAttribute('data-start')) window.initDevice(+dev.getAttribute('data-start'));

  /* ---------- solo browser frames (what I do): mount when they scroll into view ---------- */
  var solos = d.querySelectorAll('[data-solo]');
  if (solos.length){
    var mount = function(vp){
      /* data-src: a demo that is not one of the builds (the before-and-after on the websites service page) */
      var src = vp.getAttribute('data-src'), x = src ? null : bySlug(vp.getAttribute('data-solo'));
      if ((!x && !src) || vp.querySelector('iframe')) return;
      /* a build page's laptop frame: on a phone it stays a still that opens the build full screen (no scroll trap) */
      if (x && vp.hasAttribute('data-solo-still') && window.matchMedia && matchMedia('(max-width: 760px)').matches){
        vp.innerHTML = '<img class="dev-still" src="' + phone(x) + '" width="585" height="1266" alt="' + esc(x.name) + ' on a phone">'
          + '<button type="button" class="dev-play" data-view="' + x.slug + '"><span>Use it full screen</span></button>';
        return;
      }
      vp.innerHTML = ''; var f = d.createElement('iframe'); f.src = src ? b + src : demo(x); f.setAttribute('title', (x ? x.name : vp.getAttribute('data-title')) + ' — live build'); vp.appendChild(f);
    };
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ mount(e.target); io.unobserve(e.target); } }); }, { rootMargin: '200px 0px' });
      solos.forEach(function(v){ io.observe(v); });
    } else solos.forEach(mount);
  }
})();
