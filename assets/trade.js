/* The trade page's laptop: the photo of the system paints first; on a wide screen, once the page has
   loaded and gone quiet, the system itself is mounted over it at its real size and scaled to fit, so the
   visitor can use it in place. Phones keep the photo (a tap opens the live system full screen), and so
   does Save-Data, so the page stays fast. Nothing here waits on an animation or a transition event. */
(function(){
  var lap = document.querySelector('.tp-lap[data-live]'); if (!lap) return;
  var scr = lap.querySelector('.tp-scr'), W = 1280;
  function fit(){ lap.style.setProperty('--s', (scr.clientWidth / W).toFixed(4)); }
  fit(); addEventListener('resize', fit);
  var wide = matchMedia('(min-width: 1000px)'), c = navigator.connection;
  if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return;
  var done = false;
  function mount(){
    if (done || !wide.matches) return; done = true;
    var f = document.createElement('iframe');
    f.src = lap.getAttribute('data-live'); f.title = lap.getAttribute('data-title') + ' (live)';
    f.setAttribute('loading', 'eager');
    f.addEventListener('load', function(){ fit(); setTimeout(function(){ lap.classList.add('is-live'); }, 300); });
    scr.appendChild(f);
  }
  function soon(){ ('requestIdleCallback' in window) ? requestIdleCallback(mount, { timeout: 1500 }) : setTimeout(mount, 900); }
  if (document.readyState === 'complete') soon(); else addEventListener('load', soon);
  if (wide.addEventListener) wide.addEventListener('change', function(e){ if (e.matches) soon(); });
})();
