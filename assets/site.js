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
