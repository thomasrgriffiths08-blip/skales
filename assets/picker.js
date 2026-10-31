/* ============================================================
   The picker: pick one of the twelve websites and the stage becomes it.
   The chosen site's laptop shot crossfades in, its phone clip plays in front, and the caption and links follow.
   It moves on by itself: the amber line under the chosen name is the timer, and the next site comes in when the line
   ends (animationend), so pausing the line pauses the picker. Hovering the picker or scrolling it out of view pauses it;
   picking a site stops it for good.
   The first shot is in the HTML; the others load once the page is idle, and each is decoded before it is shown.
   Data Saver: the phone stays a still.
   ============================================================ */
(function(){
  var d = document, root = d.querySelector('[data-pk]');
  if (!root) return;
  var SAVE = navigator.connection && navigator.connection.saveData;
  var tabs = [].slice.call(root.querySelectorAll('.pk-list button'));
  var shots = [].slice.call(root.querySelectorAll('.pk-shots img'));
  var list = root.querySelector('.pk-list'), stage = root.querySelector('.pk-stage'), cap = root.querySelector('.pk-cap');
  var phone = root.querySelector('.pk-phone'), still = phone.querySelector('img'), vid = phone.querySelector('video');
  var base = (window.SITE && SITE.base) || '';
  var cur = 0, auto = true, inView = false, hover = false, busy = 0;

  function loadShot(i){
    var im = shots[i];
    if (im && im.getAttribute('data-srcset')){ im.srcset = im.getAttribute('data-srcset'); im.removeAttribute('data-srcset'); }
    return im;
  }
  function ready(im){
    if (im.complete && im.naturalWidth) return Promise.resolve();
    return new Promise(function(res){ im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); setTimeout(res, 2500); });
  }
  function clip(t, ext){ return base + 'assets/clips/' + t.getAttribute('data-n') + '.' + ext; }

  function play(t){
    vid.classList.remove('is-on');
    if (SAVE){ vid.removeAttribute('src'); return; }
    vid.src = clip(t, 'mp4');
    vid.onplaying = function(){ vid.classList.add('is-on'); };
    if (inView){ var p = vid.play(); if (p && p.catch) p.catch(function(){}); }
  }

  function show(i, byHand){
    if (byHand && auto){ auto = false; root.classList.remove('is-auto'); }
    if (i === cur) return;
    var t = tabs[i], im = loadShot(i), my = ++busy;
    tabs.forEach(function(b, k){ var on = k === i; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    stage.setAttribute('aria-labelledby', t.id);
    cur = i;
    /* the line under the new name starts at once; the picture follows as soon as it is decoded */
    phone.classList.add('is-swap'); cap.classList.add('is-swap');
    ready(im).then(function(){
      if (my !== busy) return;
      (im.decode ? im.decode().catch(function(){}) : Promise.resolve()).then(function(){
        if (my !== busy) return;
        shots.forEach(function(s, k){ s.classList.toggle('is-on', k === i); s.alt = k === i ? t.getAttribute('data-name') + ' on a laptop: ' + t.getAttribute('data-line') : ''; });
        var href = base + 'work/' + t.getAttribute('data-slug') + '/';
        root.querySelectorAll('[data-go]').forEach(function(a){ a.href = href; });
        root.querySelectorAll('[data-pk-name]').forEach(function(el){ el.textContent = t.getAttribute('data-name'); });
        root.querySelector('[data-pk-line]').textContent = t.getAttribute('data-line');
        still.src = clip(t, 'webp');
        play(t);
        phone.classList.remove('is-swap'); cap.classList.remove('is-swap');
        loadShot((i + 1) % tabs.length);
      });
    });
    /* on a phone the row of names keeps the chosen one in sight, without moving the page */
    if (list.scrollWidth > list.clientWidth + 4){
      var l = t.parentNode.offsetLeft - (list.clientWidth - t.offsetWidth) / 2;
      list.scrollTo({ left: Math.max(0, l), behavior: 'smooth' });
    }
  }

  /* the timer line ends: the next site */
  root.addEventListener('animationend', function(e){
    if (e.animationName !== 'pk-run' || !auto) return;
    show((cur + 1) % tabs.length, false);
  });
  tabs.forEach(function(b, i){ b.addEventListener('click', function(){ show(i, true); }); });
  list.addEventListener('keydown', function(e){
    var k = e.key, n = k === 'ArrowDown' || k === 'ArrowRight' ? 1 : k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 0;
    if (!n) return;
    e.preventDefault();
    var i = (cur + n + tabs.length) % tabs.length;
    show(i, true); tabs[i].focus();
  });

  function pausing(){ root.classList.toggle('is-paused', !inView || hover || d.hidden); }
  root.addEventListener('mouseenter', function(){ hover = true; pausing(); });
  root.addEventListener('mouseleave', function(){ hover = false; pausing(); });
  d.addEventListener('visibilitychange', pausing);
  if (window.IntersectionObserver){
    new IntersectionObserver(function(es){
      inView = es[es.length - 1].isIntersecting; pausing();
      if (inView){ if (!vid.getAttribute('src')) play(tabs[cur]); else { var p = vid.play(); if (p && p.catch) p.catch(function(){}); } }
      else vid.pause();
    }, { threshold: .25 }).observe(root);
  } else { inView = true; play(tabs[cur]); }

  root.classList.add('is-auto');
  pausing();
  /* the other shots once the page has settled, in the order they will be shown */
  var idle = window.requestIdleCallback || function(f){ return setTimeout(f, 1200); };
  window.addEventListener('load', function(){ idle(function(){ shots.forEach(function(s, i){ loadShot(i); }); }); });
})();
