/* ============================================================
   The viewer. Every build full screen, one at a time, the rest a tap away.
   Opened from any phone tile, any "Use it" / "Open full size" link, or a #view=<slug> link
   (assets/site.js loads this file on first use). Back closes it; arrows step through.
   Each build gets a fresh iframe, so stepping through never piles up history behind Back.
   ============================================================ */
(function(){
  var d = document, w = window, S = w.SITE || {}, b = S.base || '', LN = w.LANES || {};
  var ORDER = ['loud', 'motion', 'quiet', 'direct', 'broad', 'specific'];
  var LIST = (w.BUILDS || []).slice().sort(function(a, c){ var la = ORDER.indexOf(a.lane), lc = ORDER.indexOf(c.lane); return la !== lc ? la - lc : a.n - c.n; });
  if (!LIST.length) return;
  var small = w.matchMedia('(max-width: 820px)');
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var esc = function(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var still = function(x){ return b + 'assets/phones/' + pad(x.n) + '.webp'; };
  var demo = function(x){ return b + 'demos/' + x.slug + '/#s=1'; };
  var page = function(x){ return b + 'work/' + x.slug + '/'; };
  var kind = function(x){ return x.kind === 'site' ? 'Website' : 'Tool'; };
  var lane = function(x){ return LN[x.lane] ? LN[x.lane].name : ''; };
  var idx = function(slug){ for (var i = 0; i < LIST.length; i++) if (LIST[i].slug === slug) return i; return -1; };
  var store = { get: function(k){ try { return localStorage.getItem(k); } catch (e){ return null; } }, set: function(k, v){ try { localStorage.setItem(k, v); } catch (e){} } };
  var I = {
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    l: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    r: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
    desk: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
    pop: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>'
  };

  var root, frame, screen, cover, coverImg, coverName, nameEl, metaEl, aboutEl, addrEl, popEl, prevB, nextB, strip, sheet, whichName, whichCount, hint, modes, capEl, showBs;
  var showing = null, autoT = 0, autoDone = {};
  var cur = -1, live = null, opener = null, pushed = false, isOpen = false, mode = store.get('skv-mode') || 'desk', tStamp = 0;

  function groups(){
    var out = [];
    ORDER.forEach(function(k){ var g = LIST.filter(function(x){ return x.lane === k; }); if (g.length) out.push({ k: k, name: (LN[k] ? LN[k].kindWord + ' · ' + LN[k].name : k), list: g }); });
    return out;
  }
  function make(){
    root = d.createElement('div');
    root.className = 'vw'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'vwName');
    root.innerHTML =
      '<header class="vw-top">'
      + '<button type="button" class="vw-close" data-act="close" aria-label="Close">' + I.x + '</button>'
      + '<div class="vw-id"><b id="vwName"></b><span class="vw-meta"></span></div>'
      + '<div class="vw-tools"><button type="button" class="vw-link vw-show" data-act="show">' + I.play + '<span>Show me</span></button><div class="vw-modes" role="group" aria-label="Show it on">'
      + '<button type="button" data-m="desk" aria-pressed="false">' + I.desk + 'Desktop</button><button type="button" data-m="phone" aria-pressed="false">' + I.phone + 'Phone</button></div>'
      + '<a class="vw-link vw-about" href="#">About this build</a><a class="vw-book" href="' + b + 'book/">Book a call</a></div>'
      + '</header>'
      + '<div class="vw-stage">'
      + '<button type="button" class="vw-arrow vw-prev" data-act="prev" aria-label="Previous build">' + I.l + '<span class="vw-peek"></span></button>'
      + '<div class="vw-frame"><div class="vw-chrome"><span class="vw-addr">' + I.lock + '<span></span></span><a class="vw-pop" target="_blank" rel="noopener" aria-label="Open in a new tab">' + I.pop + '</a></div>'
      + '<div class="vw-screen"><div class="vw-cover"><img alt=""><b></b></div></div></div>'
      + '<button type="button" class="vw-arrow vw-next" data-act="next" aria-label="Next build">' + I.r + '<span class="vw-peek"></span></button>'
      + '<div class="vw-cap" role="status" aria-live="polite"></div>'
      + '</div>'
      + '<nav class="vw-strip" aria-label="Every build">' + groups().map(function(g){
          return '<div class="vw-grp"><span>' + esc(g.name) + '</span><div>' + g.list.map(function(x){
            return '<button type="button" class="vw-th" data-slug="' + x.slug + '" aria-label="' + esc(x.name) + ', ' + esc(x.trade || x.biz) + '" title="' + esc(x.name) + '"><img src="' + still(x) + '" alt="" loading="lazy" decoding="async"></button>';
          }).join('') + '</div></div>';
        }).join('') + '</nav>'
      + '<div class="vw-dock"><div class="vw-hint" role="status"></div>'
      + '<button type="button" data-act="close" aria-label="Close">' + I.x + '</button>'
      + '<button type="button" data-act="prev" aria-label="Previous build">' + I.l + '</button>'
      + '<button type="button" class="vw-which" data-act="list" aria-label="See every build"><b></b><span></span></button>'
      + '<button type="button" data-act="next" aria-label="Next build">' + I.r + '</button>'
      + '<button type="button" class="vw-show" data-act="show" aria-label="Show me what it does">' + I.play + '</button></div>'
      + '<div class="vw-sheet" role="dialog" aria-label="Every build"><div class="vw-sh-head"><b>All ' + LIST.length + ' builds</b><button type="button" data-act="unlist" aria-label="Back to the build">' + I.x + '</button></div>'
      + '<div class="vw-sh-body"><div class="vw-sh-now"><a class="vw-about" href="#">About this build</a><a class="go" href="' + b + 'book/">Book a call</a></div>'
      + groups().map(function(g){
          return '<section class="vw-sh-grp"><h3>' + esc(g.name) + '</h3><div class="vw-sh-grid">' + g.list.map(function(x){
            return '<button type="button" data-slug="' + x.slug + '"><span class="ph"><img src="' + still(x) + '" alt="" loading="lazy" decoding="async"></span><span><b>' + esc(x.name) + '</b><small>' + esc(x.trade || x.biz) + '</small></span></button>';
          }).join('') + '</div></section>';
        }).join('') + '</div></div>';
    d.body.appendChild(root);
    frame = root.querySelector('.vw-frame'); screen = root.querySelector('.vw-screen'); cover = root.querySelector('.vw-cover');
    coverImg = cover.querySelector('img'); coverName = cover.querySelector('b');
    nameEl = root.querySelector('#vwName'); metaEl = root.querySelector('.vw-meta'); addrEl = root.querySelector('.vw-addr span'); popEl = root.querySelector('.vw-pop');
    prevB = root.querySelector('.vw-prev'); nextB = root.querySelector('.vw-next'); strip = root.querySelector('.vw-strip'); sheet = root.querySelector('.vw-sheet');
    whichName = root.querySelector('.vw-which b'); whichCount = root.querySelector('.vw-which span'); hint = root.querySelector('.vw-hint'); modes = root.querySelectorAll('.vw-modes button');
    capEl = root.querySelector('.vw-cap'); showBs = root.querySelectorAll('.vw-show');
    if (!w.SkShow){ var sc = d.createElement('script'); sc.src = b + 'assets/show.js'; d.body.appendChild(sc); }

    root.addEventListener('click', function(e){
      var t = e.target.closest('[data-act],[data-slug],[data-m],.vw-about'); if (!t) return;
      if (t.classList.contains('vw-about')){
        if (isHere(LIST[cur])){ e.preventDefault(); close(); }
        return;
      }
      if (t.hasAttribute('data-m')){ setMode(t.getAttribute('data-m')); return; }
      if (t.hasAttribute('data-slug')){ var i = idx(t.getAttribute('data-slug')); if (sheet.classList.contains('is-in')) list(false); if (i > -1) show(i); return; }
      var a = t.getAttribute('data-act');
      if (a === 'close') close(); else if (a === 'prev') step(-1); else if (a === 'next') step(1);
      else if (a === 'list') list(true); else if (a === 'unlist') list(false);
      else if (a === 'show'){ if (showing) stopShow(); else play(); }
    });
    root.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){ e.preventDefault(); if (sheet.classList.contains('is-in')) list(false); else close(); return; }
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight'){ e.preventDefault(); step(1); }
      else if (e.key === 'Tab') trap(e);
    });
    w.addEventListener('resize', function(){ if (isOpen) fit(); });
    if (small.addEventListener) small.addEventListener('change', function(){ if (isOpen) fit(); });
  }
  function isHere(x){ return x && location.pathname.replace(/\/index\.html$/, '/').slice(-('work/' + x.slug + '/').length) === 'work/' + x.slug + '/'; }
  function trap(e){
    var f = [].filter.call(root.querySelectorAll('button,a[href],iframe'), function(el){ return el.offsetParent !== null && !el.closest('[hidden]') && !(el.closest('.vw-sheet') && !sheet.classList.contains('is-in')); });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && d.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  /* sizing: a desktop build is drawn at no less than 1100px wide and scaled to the window; a phone is 390x844, scaled to fit */
  function fit(){
    var x = LIST[cur]; if (!x) return;
    root.setAttribute('data-mode', mode);
    modes.forEach(function(m){ m.setAttribute('aria-pressed', String(m.getAttribute('data-m') === mode)); });
    strip.classList.toggle('is-hid', w.innerHeight < 640);
    var f = live, sw, sh, vw, vh, s;
    if (small.matches){
      frame.style.width = frame.style.height = '';
      sw = screen.clientWidth; sh = screen.clientHeight; s = 1; vw = sw; vh = sh;
    } else {
      var stage = root.querySelector('.vw-stage'), aw = stage.clientWidth - 144, ah = stage.clientHeight - 32;
      if (mode === 'phone'){
        s = Math.min(1, (ah - 22) / 844); vw = 390; vh = 844;
        frame.style.width = Math.round(390 * s + 22) + 'px'; frame.style.height = Math.round(844 * s + 22) + 'px';
      } else {
        var fw = Math.min(aw, 1600), fh = ah;
        frame.style.width = fw + 'px'; frame.style.height = fh + 'px';
        vw = Math.max(fw, 1100); s = fw / vw; vh = (fh - 38) / s;
      }
    }
    if (f){ f.style.width = Math.round(vw) + 'px'; f.style.height = Math.round(vh) + 'px'; f.style.transform = s === 1 ? '' : 'scale(' + s + ')'; }
  }
  /* Show me: the build plays its best moment (data/shows.js, run by assets/show.js) with a tap marker and a caption.
     It also plays once by itself if nobody touches a build for a few seconds; any real tap hands it straight back. */
  var capT = 0;
  function cap(html, hold){
    clearTimeout(capT);
    if (!html){ capEl.classList.remove('is-in'); return; }
    capEl.innerHTML = html; capEl.classList.add('is-in');
    if (hold) capT = setTimeout(function(){ capEl.classList.remove('is-in'); }, hold);
  }
  function showState(on){
    root.classList.toggle('is-showing', on);
    showBs.forEach(function(bt){
      bt.innerHTML = (on ? I.stop : I.play) + (bt.closest('.vw-dock') ? '' : '<span>' + (on ? 'Stop' : 'Show me') + '</span>');
      bt.setAttribute('aria-label', on ? 'Stop the demo' : 'Show me what it does');
    });
  }
  function play(){
    var x = LIST[cur], f = live;
    clearTimeout(autoT); hint.classList.remove('is-in');
    if (!x || !x.show || !x.show.length || !f || !f.contentWindow || !w.SkShow) return;
    stopShow();
    var steps = x.show, n = steps.length, last = '';
    showState(true);
    showing = w.SkShow.run(f.contentWindow, steps, {
      onStep: function(i, st){ if (st.say) last = st.say; cap('<i>' + (i + 1) + ' of ' + n + '</i>' + esc(last)); },
      onEnd: function(done){ showing = null; showState(false); cap(done ? '<i>Your turn</i>Use it like a customer would.' : '', 3200); }
    });
  }
  function stopShow(){ clearTimeout(autoT); if (showing){ var s0 = showing; showing = null; s0.stop(); } showState(false); cap(''); }
  function watch(f, x, stamp){
    var touched = false, mark = function(e){ if (e.isTrusted){ touched = true; clearTimeout(autoT); } };
    try { ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function(t){ f.contentWindow.document.addEventListener(t, mark, true); }); } catch (e){ return; }
    if (!x.show || autoDone[x.slug]) return;
    autoT = setTimeout(function(){
      if (touched || stamp !== tStamp || !isOpen || sheet.classList.contains('is-in') || showing) return;
      autoDone[x.slug] = 1; play();
    }, 3500);
  }

  function setMode(m){
    if (m === mode) return; mode = m; store.set('skv-mode', m);
    var x = LIST[cur]; if (!x) return;
    fit(); load(x, true);
  }

  function load(x, reload){
    stopShow();
    var stamp = ++tStamp, old = live;
    cover.classList.remove('is-gone'); coverImg.src = still(x); coverName.textContent = x.name;
    var f = d.createElement('iframe');
    f.title = x.name + ', running live'; f.setAttribute('allow', 'clipboard-write');
    live = f; fit();
    f.addEventListener('load', function(){
      if (stamp !== tStamp) return;
      f.classList.add('is-on');
      setTimeout(function(){ if (stamp === tStamp) cover.classList.add('is-gone'); if (old && old.parentNode) old.parentNode.removeChild(old); }, 220);
      prefetch(LIST[(cur + 1) % LIST.length]);
      watch(f, x, stamp);
    });
    f.src = demo(x);
    screen.insertBefore(f, cover);
    if (old && !reload){ old.classList.remove('is-on'); }
    if (old && reload){ old.parentNode && old.parentNode.removeChild(old); }
  }
  var fetched = {};
  function prefetch(x){
    if (!x || fetched[x.slug]) return; fetched[x.slug] = 1;
    var l = d.createElement('link'); l.rel = 'prefetch'; l.href = b + 'demos/' + x.slug + '/'; d.head.appendChild(l);
    var i = new Image(); i.src = still(x);
  }

  function show(i, quiet){
    i = (i + LIST.length) % LIST.length;
    if (i === cur && live) return;
    cur = i; var x = LIST[i], p = LIST[(i + LIST.length - 1) % LIST.length], n = LIST[(i + 1) % LIST.length];
    root.style.setProperty('--vc', x.c);
    nameEl.textContent = x.name;
    metaEl.innerHTML = esc(kind(x) + ' · ' + lane(x) + ' · ' + (x.trade || x.biz) + ', invented') + ' &nbsp;<i>' + pad(i + 1) + ' / ' + LIST.length + '</i>';
    whichName.textContent = x.name;
    whichCount.innerHTML = esc((i + 1) + ' of ' + LIST.length + ' · all builds') + I.up;
    root.querySelectorAll('.vw-about').forEach(function(a){ a.href = page(x); });
    addrEl.textContent = (S.origin || '').replace(/^https?:\/\//, '') + '/demos/' + x.slug + '/';
    popEl.href = demo(x);
    prevB.querySelector('.vw-peek').textContent = p.name; nextB.querySelector('.vw-peek').textContent = n.name;
    root.querySelectorAll('[data-slug]').forEach(function(t){ t.setAttribute('aria-current', String(t.getAttribute('data-slug') === x.slug)); });
    var th = strip.querySelector('[data-slug="' + x.slug + '"]');
    if (th && strip.scrollTo){ var r = th.getBoundingClientRect(), sr = strip.getBoundingClientRect(); strip.scrollTo({ left: strip.scrollLeft + r.left - sr.left - (sr.width - r.width) / 2, behavior: quiet ? 'auto' : 'smooth' }); }
    load(x);
    if (isOpen && history.replaceState) history.replaceState(history.state, '', '#view=' + x.slug);
    if (w.skTrack) skTrack('build_view', { build: x.slug });
  }
  function step(dir){ show(cur + dir); }
  function list(on){
    sheet.classList.toggle('is-in', on);
    if (on){ var c = sheet.querySelector('[aria-current="true"]'); if (c) c.scrollIntoView({ block: 'center' }); sheet.querySelector('.vw-sh-head button').focus(); }
    else root.querySelector('.vw-which').focus();
  }
  function tip(){
    if (!small.matches || store.get('skv-tip')) return; store.set('skv-tip', '1');
    hint.textContent = 'Use it like a customer would, or tap the play button to see what it does. The arrows go to the next build.';
    setTimeout(function(){ hint.classList.add('is-in'); }, 600);
    setTimeout(function(){ hint.classList.remove('is-in'); }, 3300);
  }

  function open(slug, from){
    var i = idx(slug); if (i < 0) return false;
    if (!root) make();
    opener = from || d.activeElement;
    if (!isOpen){
      isOpen = true; root.hidden = false; d.documentElement.classList.add('vw-open');
      if (!/#view=/.test(location.hash) && history.pushState){ history.pushState({ vw: 1 }, '', '#view=' + slug); pushed = true; }
      requestAnimationFrame(function(){ root.classList.add('is-in'); });
      cur = -1;
    }
    show(i, true); fit();
    root.querySelector('.vw-close').focus({ preventScroll: true });
    if (small.matches) root.querySelector('.vw-which').focus({ preventScroll: true });
    tip();
    return true;
  }
  function close(fromPop){
    if (!isOpen) return; isOpen = false; stopShow();
    root.classList.remove('is-in'); list(false);
    setTimeout(function(){ if (isOpen) return; root.hidden = true; if (live && live.parentNode) live.parentNode.removeChild(live); live = null; cur = -1; }, 220);
    d.documentElement.classList.remove('vw-open');
    if (!fromPop){
      if (pushed){ pushed = false; history.back(); }
      else if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    }
    pushed = false;
    if (opener && opener.focus) try { opener.focus({ preventScroll: true }); } catch (e){}
  }
  w.addEventListener('popstate', function(){
    var m = /#view=([a-z0-9-]+)/.exec(location.hash);
    if (m && idx(m[1]) > -1){ if (!isOpen) open(m[1]); else show(idx(m[1])); }
    else if (isOpen){ pushed = false; close(true); }
  });
  w.SKV = { open: open, close: close, list: LIST };
})();
