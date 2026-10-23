/* Shell behaviour on every page. Config comes from window.SITE (written by the build). */
(function(){
  var d = document, S = window.SITE || {};
  try{ if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) d.documentElement.classList.add('m-on'); }catch(e){}
  /* tracking: one call for every page. The dataLayer always; Meta and Google only once the visitor has
     accepted and assets/consent.js has loaded them. The events that matter to ads go as standard events. */
  var STD = { casefile_sent: 'Lead', teardown_sent: 'Lead', call_booked: 'Schedule', whatsapp_click: 'Contact', email_click: 'Contact' };
  var CONV = { casefile_sent: 'lead', teardown_sent: 'lead', call_booked: 'booked' };
  window.skTrack = function(name, props){
    props = props || {}; var T = S.track || {};
    try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, props)); } catch (e){}
    try { if (window.fbq){ if (STD[name]) fbq('track', STD[name], props); else fbq('trackCustom', name, props); } } catch (e){}
    try { if (window.gtag){ gtag('event', name, props); var l = T.ads && T.labels && T.labels[CONV[name]]; if (l) gtag('event', 'conversion', { send_to: T.ads + '/' + l }); } } catch (e){}
    try { if (window.plausible) plausible(name, { props: props }); } catch (e){}
  };
  d.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.hasAttribute('data-track')) return;
    var h = a.getAttribute('href');
    if (/^mailto:/.test(h)) skTrack('email_click', { page: location.pathname });
    else if (/wa\.me\//.test(h)) skTrack('whatsapp_click', { page: location.pathname });
  });
  /* the viewer: a tap on any build opens it full screen, the rest a tap away (assets/viewer.js, fetched on
     first use and warmed once the page is idle, so it never competes with the page's own first paint) */
  var vq = [], vState = 0;
  function viewer(cb){
    if (window.SKV) return cb && cb();
    if (cb) vq.push(cb);
    if (vState) return; vState = 1;
    var base = S.base || '', left = 2, done = function(){ if (--left) return; vState = 2; var q = vq; vq = []; q.forEach(function(f){ f(); }); };
    var css = d.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'assets/viewer.css'; css.onload = done; css.onerror = done; d.head.appendChild(css);
    var fail = function(){ left = 1; done(); };
    var add = function(src, next){ var s = d.createElement('script'); s.src = base + 'assets/' + src; s.onload = next; s.onerror = fail; d.body.appendChild(s); };
    var go = function(){ add('viewer.js', done); };
    if (window.BUILDS) go(); else add('builds.js', go);
  }
  var slugOf = function(a){ var m = /(?:^|\/)(?:demos|work)\/([a-z0-9-]+)\/(?:index\.html)?(?:#s=1)?$/.exec(a.getAttribute('href') || ''); return m && !/^(websites|tools)$/.test(m[1]) ? m[1] : null; };
  d.addEventListener('click', function(e){
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a.tile, a[href*="demos/"], [data-view]'); if (!a) return;
    var slug = a.getAttribute('data-view') || slugOf(a); if (!slug) return;
    e.preventDefault();
    viewer(function(){ if (!window.SKV || !SKV.open(slug, a)) location.href = a.href || (S.base || '') + 'demos/' + slug + '/#s=1'; });
  });
  window.skViewer = viewer;
  /* moving cards: a card's clip plays once as it comes into view (a row starts one after another), pauses when it
     leaves, and plays again on hover. Until then the card is its still. Not tied to reduced motion: it plays once and
     stops, and it is the only way to see what a build does without opening it. Skipped on Data Saver. */
  var cio = null;
  function skClips(scope){
    try { if (navigator.connection && navigator.connection.saveData) return; } catch (e){}
    if (!('IntersectionObserver' in window)) return;
    var hover = window.matchMedia && matchMedia('(hover: hover)').matches;
    var start = function(v){
      if (!v.getAttribute('src')){ v.src = v.getAttribute('data-src'); v.preload = 'auto'; }
      try { v.currentTime = 0; } catch (e){}
      var p = v.play(); if (p && p.catch) p.catch(function(){});
    };
    if (!cio) cio = new IntersectionObserver(function(es){
      var lag = 0;
      es.forEach(function(e){
        var v = e.target;
        if (e.isIntersecting){ if (!v.dataset.done && v.paused){ clearTimeout(v._t); v._t = setTimeout(function(){ start(v); }, lag); lag += 280; } }
        else { clearTimeout(v._t); if (!v.paused) v.pause(); }
      });
    }, { threshold: .6 });
    (scope || d).querySelectorAll('video[data-src]:not([data-on])').forEach(function(v){
      v.setAttribute('data-on', ''); v.muted = true;
      v.addEventListener('playing', function(){ v.classList.add('is-on'); });
      v.addEventListener('ended', function(){ v.dataset.done = '1'; });
      var a = v.closest('a'); if (a && hover) a.addEventListener('mouseenter', function(){ if (v.paused) start(v); });
      cio.observe(v);
    });
  }
  window.skClips = skClips;
  window.addEventListener('load', function(){
    if (!d.querySelector('a.tile, a[href*="demos/"], [data-view]')) return;
    var warm = function(){ viewer(); };
    ('requestIdleCallback' in window) ? requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 2500);
  });
  d.addEventListener('DOMContentLoaded', function(){
    skClips();
    var vm = /#view=([a-z0-9-]+)/.exec(location.hash);
    if (vm) viewer(function(){ if (window.SKV) SKV.open(vm[1]); });
    var wa = S.whatsapp && String(S.whatsapp).replace(/\D/g, '');
    d.querySelectorAll('[data-wa]').forEach(function(el){
      if (!wa){ el.hidden = true; return; }
      el.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(el.getAttribute('data-wa') || 'Hi Tom — saw your site.'); el.hidden = false;
    });
    d.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });
    /* mobile menu */
    var t = d.querySelector('.mtoggle'), m = d.getElementById('mnav');
    if (t && m) t.addEventListener('click', function(){ var open = t.getAttribute('aria-expanded') === 'true'; t.setAttribute('aria-expanded', String(!open)); m.hidden = open; });
    /* the readout: UK time, ticking. Content, not decoration. */
    var clock = d.getElementById('clock');
    if (clock){
      var fmt = null; try{ fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Europe/London' }); }catch(e){}
      var tick = function(){ var t = new Date(); clock.textContent = fmt ? fmt.format(t) : t.toTimeString().slice(0, 8); };
      tick(); setInterval(tick, 1000);
    }
    /* pages without the switch are simply on */
  });
})();
