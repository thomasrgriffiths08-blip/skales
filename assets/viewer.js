/* ============================================================
   The viewer. Every build full screen, one at a time, the rest a tap away.
   Opened from any phone tile, any "Use it" / "Open full size" link, or a #view=<slug> link
   (assets/site.js loads this file on first use). Back closes it; arrows step through.
   Beside the build (in a sheet on a phone): what you can do in it, with Show me, and every build by name with
   what it does, filtered to websites or tools; the arrows then step through that filter only.
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

  var root, frame, screen, cover, coverImg, coverName, nameEl, metaEl, aboutEl, addrEl, popEl, prevB, nextB, side, sheet, whichName, whichCount, hint, modes, capEl, showBs, nowName, nowShort, tryList, idxEl, tabs;
  var flt = 'all';
  var clip = function(x){ return b + 'assets/clips/' + pad(x.n) + '.webp'; };
  var thumb = function(x){ return x.kind === 'tool' ? clip(x) : still(x); };
  var KW = { site: 'Websites', tool: 'Tools' };
  var showing = null, autoT = 0, autoDone = {};
  var cur = -1, live = null, opener = null, pushed = false, isOpen = false, mode = store.get('skv-mode') || 'desk', tStamp = 0;

  function groups(){
    var out = [];
    ORDER.forEach(function(k){ var g = LIST.filter(function(x){ return x.lane === k; }); if (g.length) out.push({ k: k, kind: g[0].kind, name: (LN[k] ? LN[k].name + ' ' + LN[k].kindWord.toLowerCase() : k), list: g }); });
    return out;
  }
  function make(){
    root = d.createElement('div');
    root.className = 'vw'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'vwName');
    root.innerHTML =
      '<header class="vw-top">'
      + '<button type="button" class="vw-close" data-act="close" aria-label="Close">' + I.x + '</button>'
      + '<div class="vw-id"><b id="vwName"></b><span class="vw-meta"></span></div>'
      + '<div class="vw-tools"><div class="vw-modes" role="group" aria-label="Show it on">'
      + '<button type="button" data-m="desk" aria-pressed="false">' + I.desk + 'Desktop</button><button type="button" data-m="phone" aria-pressed="false">' + I.phone + 'Phone</button></div>'
      + '<a class="vw-book" href="' + b + 'book/">Book a call</a></div>'
      + '</header>'
      + '<div class="vw-stage">'
      + '<button type="button" class="vw-arrow vw-prev" data-act="prev" aria-label="Previous build">' + I.l + '<span class="vw-peek"></span></button>'
      + '<div class="vw-frame"><div class="vw-chrome"><span class="vw-addr">' + I.lock + '<span></span></span><a class="vw-pop" target="_blank" rel="noopener" aria-label="Open in a new tab">' + I.pop + '</a></div>'
      + '<div class="vw-screen"><div class="vw-cover"><img alt=""><b></b></div></div></div>'
      + '<button type="button" class="vw-arrow vw-next" data-act="next" aria-label="Next build">' + I.r + '<span class="vw-peek"></span></button>'
      + '<div class="vw-cap" role="status" aria-live="polite"></div>'
      + '</div>'
      + '<aside class="vw-side" aria-label="What you can do, and every build"><div class="vw-sh-head"><b>All ' + LIST.length + ' builds</b><button type="button" data-act="unlist" aria-label="Back to the build">' + I.x + '</button></div>'
      + '<div class="vw-side-body">'
      + '<section class="vw-now" aria-label="What you can do here"><b class="vw-now-name"></b><span class="vw-lab">What you can do here</span><p class="vw-now-short"></p><ol class="vw-try"></ol>'
      + '<button type="button" class="vw-show vw-show-big" data-act="show">' + I.play + '<span>Show me what it does</span></button>'
      + '<div class="vw-now-links"><a class="vw-about" href="#">About this build</a><a class="go" href="' + b + 'book/">Book a call</a></div></section>'
      + '<div class="vw-tabs" role="group" aria-label="Show">' + [['all', 'All', LIST.length], ['site', 'Websites', LIST.filter(function(x){ return x.kind === 'site'; }).length], ['tool', 'Tools', LIST.filter(function(x){ return x.kind === 'tool'; }).length]].map(function(t){
          return '<button type="button" data-f="' + t[0] + '" aria-pressed="' + (t[0] === 'all') + '">' + t[1] + ' <span>' + t[2] + '</span></button>';
        }).join('') + '</div>'
      + '<nav class="vw-idx" aria-label="Every build">' + groups().map(function(g){
          return '<section class="vw-grp" data-kind="' + g.kind + '"><h3>' + esc(g.name) + '</h3>' + g.list.map(function(x){
            return '<button type="button" class="vw-it' + (x.kind === 'tool' ? ' is-wide' : '') + '" data-slug="' + x.slug + '" data-kind="' + x.kind + '"><span class="th"><img src="' + thumb(x) + '" alt="" loading="lazy" decoding="async"></span><span class="tx"><b>' + esc(x.name) + '</b><small>' + esc(x.short) + '</small></span></button>';
          }).join('') + '</section>';
        }).join('') + '</nav></div></aside>'
      + '<div class="vw-dock"><div class="vw-hint" role="status"></div>'
      + '<button type="button" data-act="close" aria-label="Close">' + I.x + '</button>'
      + '<button type="button" data-act="prev" aria-label="Previous build">' + I.l + '</button>'
      + '<button type="button" class="vw-which" data-act="list" aria-label="What it does, and every build"><b></b><span></span></button>'
      + '<button type="button" data-act="next" aria-label="Next build">' + I.r + '</button>'
      + '<button type="button" class="vw-show" data-act="show" aria-label="Show me what it does">' + I.play + '</button></div>';
    d.body.appendChild(root);
    frame = root.querySelector('.vw-frame'); screen = root.querySelector('.vw-screen'); cover = root.querySelector('.vw-cover');
    coverImg = cover.querySelector('img'); coverName = cover.querySelector('b');
    nameEl = root.querySelector('#vwName'); metaEl = root.querySelector('.vw-meta'); addrEl = root.querySelector('.vw-addr span'); popEl = root.querySelector('.vw-pop');
    prevB = root.querySelector('.vw-prev'); nextB = root.querySelector('.vw-next'); side = sheet = root.querySelector('.vw-side');
    nowName = root.querySelector('.vw-now-name'); nowShort = root.querySelector('.vw-now-short'); tryList = root.querySelector('.vw-try'); idxEl = root.querySelector('.vw-idx'); tabs = root.querySelectorAll('.vw-tabs button');
    whichName = root.querySelector('.vw-which b'); whichCount = root.querySelector('.vw-which span'); hint = root.querySelector('.vw-hint'); modes = root.querySelectorAll('.vw-modes button');
    capEl = root.querySelector('.vw-cap'); showBs = root.querySelectorAll('.vw-show');
    if (!w.SkShow){ var sc = d.createElement('script'); sc.src = b + 'assets/show.js'; d.body.appendChild(sc); }

    root.addEventListener('click', function(e){
      var t = e.target.closest('[data-act],[data-slug],[data-m],[data-f],.vw-about'); if (!t) return;
      if (t.hasAttribute('data-f')){ filter(t.getAttribute('data-f')); return; }
      if (t.classList.contains('vw-about')){
        if (isHere(LIST[cur])){ e.preventDefault(); close(); }
        return;
      }
      if (t.hasAttribute('data-m')){ setMode(t.getAttribute('data-m')); return; }
      if (t.hasAttribute('data-slug')){ var i = idx(t.getAttribute('data-slug')); if (sheet.classList.contains('is-in')) list(false); if (i > -1) show(i); return; }
      var a = t.getAttribute('data-act');
      if (a === 'close') close(); else if (a === 'prev') step(-1); else if (a === 'next') step(1);
      else if (a === 'list') list(true); else if (a === 'unlist') list(false);
      else if (a === 'show'){ if (sheet.classList.contains('is-in')) list(false, true); if (showing) stopShow(); else play(); }
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
    var f = [].filter.call(root.querySelectorAll('button,a[href],iframe'), function(el){ return el.offsetParent !== null && !el.closest('[hidden]') && !(small.matches && el.closest('.vw-side') && !sheet.classList.contains('is-in')); });
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
    var f = live, sw, sh, vw, vh, s;
    if (small.matches){
      frame.style.width = frame.style.height = '';
      sw = screen.clientWidth; sh = screen.clientHeight; s = 1; vw = sw; vh = sh;
    } else {
      var stage = root.querySelector('.vw-stage'), arw = parseFloat(w.getComputedStyle(stage).getPropertyValue('--arw')) || 72, aw = stage.clientWidth - 2 * arw, ah = stage.clientHeight - 32;
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
      bt.innerHTML = (on ? I.stop : I.play) + (bt.closest('.vw-dock') ? '' : '<span>' + (on ? 'Stop' : 'Show me what it does') + '</span>');
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
      onStep: function(i, st){ if (st.say) last = st.say; cap('<i>' + (i + 1) + ' of ' + n + '</i>' + esc(last)); mark(i); },
      onEnd: function(done){ showing = null; showState(false); mark(done ? 99 : -1); cap(done ? '<i>Your turn</i>Use it like a customer would.' : '', 3200); }
    });
  }
  /* the steps beside the build light up as Show me plays them, and stay ticked once it has finished */
  function mark(i){
    tryList.querySelectorAll('li').forEach(function(li){ var k = +li.getAttribute('data-i');
      li.classList.toggle('is-now', i < 99 && k === i); li.classList.toggle('is-done', i === 99 || (i > -1 && k < i)); });
  }
  function stopShow(){ clearTimeout(autoT); if (showing){ var s0 = showing; showing = null; s0.stop(); } showState(false); cap(''); }
  function watch(f, x, stamp){
    var touched = false, touch = function(e){ if (e.isTrusted){ touched = true; clearTimeout(autoT); } };
    try { ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function(t){ f.contentWindow.document.addEventListener(t, touch, true); }); } catch (e){ return; }
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
    [].forEach.call(screen.querySelectorAll('iframe'), function(el){ if (el !== old) el.parentNode.removeChild(el); });
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
    cur = i; var x = LIST[i];
    if (flt !== 'all' && x.kind !== flt) filter('all', true);
    label();
    root.style.setProperty('--vc', x.c);
    nameEl.textContent = x.name;
    nowName.textContent = x.name; nowShort.textContent = x.short;
    tryList.innerHTML = (x.show || []).map(function(st, k){ return st.say ? '<li data-i="' + k + '">' + esc(st.say) + '</li>' : ''; }).join('')
      || '<li data-i="0">Use it like a customer would.</li>';
    root.querySelectorAll('.vw-about').forEach(function(a){ a.href = page(x); });
    addrEl.textContent = (S.origin || '').replace(/^https?:\/\//, '') + '/demos/' + x.slug + '/';
    popEl.href = demo(x);
    root.querySelectorAll('[data-slug]').forEach(function(t){ t.setAttribute('aria-current', String(t.getAttribute('data-slug') === x.slug)); });
    keepInView(quiet);
    load(x);
    if (isOpen && history.replaceState) history.replaceState(history.state, '', '#view=' + x.slug);
    if (w.skTrack) skTrack('build_view', { build: x.slug });
  }
  /* where the current build sits in the filter, and what the arrows lead to */
  function label(){
    var x = LIST[cur], pl = pool(), at = pl.indexOf(cur) + 1, word = flt === 'all' ? 'builds' : KW[flt].toLowerCase();
    var p = LIST[pl[(at - 2 + pl.length) % pl.length]], n = LIST[pl[at % pl.length]];
    metaEl.innerHTML = esc(kind(x) + ' · ' + lane(x) + ' · ' + (x.trade || x.biz) + ', invented') + ' &nbsp;<i>' + at + ' of ' + pl.length + (flt === 'all' ? '' : ' ' + word) + '</i>';
    whichName.textContent = x.name;
    whichCount.innerHTML = esc(at + ' of ' + pl.length + ' ' + word + ' · what it does') + I.up;
    prevB.querySelector('.vw-peek').textContent = p.name; nextB.querySelector('.vw-peek').textContent = n.name;
  }
  /* the builds the arrows step through: all of them, or only the websites or only the tools */
  function pool(){ var out = []; LIST.forEach(function(x, i){ if (flt === 'all' || x.kind === flt) out.push(i); }); return out; }
  function step(dir){ var pl = pool(), at = pl.indexOf(cur); show(at < 0 ? pl[0] : pl[(at + dir + pl.length) % pl.length]); }
  function filter(f, quiet){
    flt = f;
    tabs.forEach(function(t){ t.setAttribute('aria-pressed', String(t.getAttribute('data-f') === f)); });
    idxEl.querySelectorAll('.vw-grp').forEach(function(g){ g.hidden = f !== 'all' && g.getAttribute('data-kind') !== f; });
    if (quiet) return;
    var x = LIST[cur]; if (!x) return;
    if (f !== 'all' && x.kind !== f) show(pool()[0]); else label();
    if (!small.matches) idxEl.scrollTop = 0;
  }
  function keepInView(quiet){
    var c = idxEl.querySelector('[aria-current="true"]'); if (!c) return;
    var box = small.matches ? sheet.querySelector('.vw-side-body') : idxEl, r = c.getBoundingClientRect(), br = box.getBoundingClientRect();
    if (r.top < br.top + 8 || r.bottom > br.bottom - 8) box.scrollTo({ top: box.scrollTop + r.top - br.top - (br.height - r.height) / 2, behavior: quiet ? 'auto' : 'smooth' });
  }
  function list(on, keep){
    if (!small.matches) return;
    sheet.classList.toggle('is-in', on);
    if (on){ sheet.querySelector('.vw-side-body').scrollTop = 0; sheet.querySelector('.vw-sh-head button').focus(); }
    else if (!keep) root.querySelector('.vw-which').focus();
  }
  function tip(){
    if (!small.matches || store.get('skv-tip')) return; store.set('skv-tip', '1');
    hint.textContent = 'Use it like a customer would, or tap play to see what it does. Tap the name for every build and what each one does.';
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
