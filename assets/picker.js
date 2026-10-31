/* ============================================================
   The picker: pick one of the twelve websites and the stage becomes it.
   The chosen site's laptop shot fades in over the last one, its phone clip plays in front, and the caption and links
   follow. Nothing changes until the new pictures are loaded and decoded, so a swap is never half done.
   It moves on by itself: the amber line under the chosen name is the timer. The timer is kept here in JavaScript, not in
   a CSS animation, because devices set to reduce motion cut CSS animations to nothing, and the picker then raced through
   all twelve sites. Pointing at the stage or the list, scrolling the picker out of view or leaving the tab pauses it;
   picking a site, or swiping the row of names on a phone, stops it for good.
   The caption is held at the height of the longest one, so the stage never shifts when the site changes.
   Data Saver: the phone stays a still.
   ============================================================ */
(function(){
  var d = document, root = d.querySelector('[data-pk]');
  if (!root) return;
  var SAVE = navigator.connection && navigator.connection.saveData;
  var DUR = 6000;
  var tabs = [].slice.call(root.querySelectorAll('.pk-list button'));
  var shots = [].slice.call(root.querySelectorAll('.pk-shots img'));
  var list = root.querySelector('.pk-list'), stage = root.querySelector('.pk-stage'), cap = root.querySelector('.pk-cap');
  var cname = cap.querySelector('[data-pk-name]'), cline = cap.querySelector('[data-pk-line]'), chromeName = stage.querySelector('[data-pk-name]');
  var phone = root.querySelector('.pk-phone'), still = phone.querySelector('img'), vid = phone.querySelector('video');
  var head = d.querySelector('.site-head');
  var base = (window.SITE && SITE.base) || '';
  var cur = 0, auto = true, inView = false, hover = false, loading = false, busy = 0, elapsed = 0, last = 0, raf = 0;

  function clip(t, ext){ return base + 'assets/clips/' + t.getAttribute('data-n') + '.' + ext; }
  function loadShot(i){
    var im = shots[i];
    if (im && im.getAttribute('data-srcset')){ im.srcset = im.getAttribute('data-srcset'); im.removeAttribute('data-srcset'); }
    return im;
  }
  /* resolves once the picture can be drawn at once: loaded and decoded, or given up on after a few seconds */
  function ready(im){
    var loaded = im.complete && im.naturalWidth ? Promise.resolve() : new Promise(function(res){
      im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); setTimeout(res, 4000);
    });
    return loaded.then(function(){ return im.decode ? im.decode().catch(function(){}) : null; });
  }
  function stillFor(t){ var im = new Image(); im.decoding = 'async'; im.src = clip(t, 'webp'); return im; }

  /* ---------- the timer ---------- */
  function line(k){ return tabs[k].querySelector('.pk-run'); }
  function running(){ return auto && inView && !hover && !loading && !d.hidden; }
  function tick(now){
    raf = 0;
    if (!running()){ last = 0; return; }
    if (last) elapsed += Math.min(now - last, 100);
    last = now;
    line(cur).style.transform = 'scaleX(' + Math.min(elapsed / DUR, 1) + ')';
    if (elapsed >= DUR){ show((cur + 1) % tabs.length, false); return; }
    raf = requestAnimationFrame(tick);
  }
  function wake(){ if (!raf && running()){ last = 0; raf = requestAnimationFrame(tick); } }
  function stopAuto(){
    if (!auto) return;
    auto = false;
    tabs.forEach(function(b){ b.querySelector('.pk-run').style.transform = ''; });
    root.classList.add('is-picked');
  }

  /* ---------- a swap ---------- */
  /* the old clip fades off the phone, showing the new site's still underneath, before the new clip is loaded:
     swapping the source at once would cut it to nothing */
  var vt = 0;
  function play(t){
    clearTimeout(vt); vid.onplaying = null;
    vid.classList.remove('is-on');
    if (SAVE){ vid.removeAttribute('src'); return; }
    var go = function(){
      vid.onplaying = function(){ vid.classList.add('is-on'); };
      vid.src = clip(t, 'mp4');
      if (inView){ var p = vid.play(); if (p && p.catch) p.catch(function(){}); }
    };
    if (vid.getAttribute('src')) vt = setTimeout(go, 380); else go();
  }
  function show(i, byHand){
    if (byHand) stopAuto();
    if (i === cur) return;
    var t = tabs[i], im = loadShot(i), st = stillFor(t), my = ++busy, prev = cur;
    tabs.forEach(function(b, k){ var on = k === i; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    line(prev).style.transform = auto ? 'scaleX(0)' : '';
    stage.setAttribute('aria-labelledby', t.id);
    cur = i; elapsed = 0; loading = true;
    Promise.all([ready(im), ready(st)]).then(function(){
      if (my !== busy) return;
      /* the old shot stays underneath at full strength while the new one fades in over it */
      shots.forEach(function(s, k){
        s.classList.toggle('is-prev', s.classList.contains('is-on') && k !== i);
        s.classList.toggle('is-on', k === i);
        s.alt = k === i ? t.getAttribute('data-name') + ' on a laptop: ' + t.getAttribute('data-line') : '';
      });
      setTimeout(function(){ if (my === busy) shots.forEach(function(s, k){ if (k !== i) s.classList.remove('is-prev'); }); }, 700);
      var href = base + 'work/' + t.getAttribute('data-slug') + '/';
      root.querySelectorAll('[data-go]').forEach(function(a){ a.href = href; });
      chromeName.textContent = t.getAttribute('data-name');
      /* the caption dips out and back with the new words, in step with the picture */
      cap.classList.add('is-swap');
      setTimeout(function(){
        if (my !== busy) return;
        cname.textContent = t.getAttribute('data-name'); cline.textContent = t.getAttribute('data-line');
        cap.classList.remove('is-swap');
      }, 250);
      still.src = st.src;
      play(t);
      loading = false; wake();
      loadShot((i + 1) % tabs.length);
    });
    /* on a phone the row of names keeps the chosen one in sight, without moving the page */
    if (list.scrollWidth > list.clientWidth + 4){
      var l = t.parentNode.offsetLeft - (list.clientWidth - t.offsetWidth) / 2;
      list.scrollTo({ left: Math.max(0, l), behavior: 'smooth' });
    }
  }

  /* ---------- the caption keeps one height ---------- */
  function holdCap(){
    var n = cname.textContent, l = cline.textContent, h = 0;
    cap.style.minHeight = '';
    tabs.forEach(function(t){
      cname.textContent = t.getAttribute('data-name'); cline.textContent = t.getAttribute('data-line');
      h = Math.max(h, cap.offsetHeight);
    });
    cname.textContent = n; cline.textContent = l;
    cap.style.minHeight = h + 'px';
  }
  holdCap();
  var rs = 0, lastW = innerWidth;
  addEventListener('resize', function(){ if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rs); rs = setTimeout(holdCap, 150); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(holdCap);

  /* ---------- the reader takes over ---------- */
  tabs.forEach(function(b, i){ b.addEventListener('click', function(){ show(i, true); }); });
  list.addEventListener('keydown', function(e){
    var k = e.key, n = k === 'ArrowDown' || k === 'ArrowRight' ? 1 : k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 0;
    if (!n) return;
    e.preventDefault();
    var i = (cur + n + tabs.length) % tabs.length;
    show(i, true); tabs[i].focus();
  });
  /* swiping the row of names means the reader is choosing: the picker stops moving under their thumb */
  list.addEventListener('touchstart', stopAuto, { passive: true });
  [stage, list].forEach(function(el){
    el.addEventListener('mouseenter', function(){ hover = true; });
    el.addEventListener('mouseleave', function(){ hover = false; wake(); });
  });
  d.addEventListener('visibilitychange', wake);

  /* ---------- in view or not ---------- */
  if (window.IntersectionObserver){
    new IntersectionObserver(function(es){
      inView = es[es.length - 1].isIntersecting;
      if (inView){ if (!vid.getAttribute('src')) play(tabs[cur]); else { var p = vid.play(); if (p && p.catch) p.catch(function(){}); } wake(); }
      else vid.pause();
    }, { threshold: .25 }).observe(root);
  } else { inView = true; play(tabs[cur]); wake(); }

  /* the header stays dark while it is over the dark top of the page: the picker, and the builder under it when that is dark too.
     The phone's own top bar (theme-color) and the space a phone shows when the page is pulled past its top follow it */
  if (head){
    var next = root.nextElementSibling, dark = next && next.id === 'build' ? next : root;
    var tc = d.querySelector('meta[name="theme-color"]'), was = null;
    var hq = 0, darkHead = function(){
      hq = 0;
      var on = dark.getBoundingClientRect().bottom > head.offsetHeight;
      if (on === was) return;
      was = on;
      head.classList.toggle('on-dark', on);
      if (tc) tc.setAttribute('content', on ? '#0B0C0E' : '#FFFFFF');
      d.documentElement.style.backgroundColor = on ? '#0B0C0E' : '';
    };
    addEventListener('scroll', function(){ if (!hq) hq = requestAnimationFrame(darkHead); }, { passive: true });
    darkHead();
  }

  /* the other shots once the page has settled, in the order they will be shown */
  var idle = window.requestIdleCallback || function(f){ return setTimeout(f, 1200); };
  addEventListener('load', function(){ idle(function(){ shots.forEach(function(s, i){ loadShot(i); }); }); });
})();
