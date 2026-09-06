/* Shell behaviour on every page. Config comes from window.SITE (written by the build). */
(function(){
  var d = document, S = window.SITE || {};
  try{ if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) d.documentElement.classList.add('m-on'); }catch(e){}
  d.addEventListener('DOMContentLoaded', function(){
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
