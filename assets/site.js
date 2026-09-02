/* ============================================================
   Shell behaviour. One place for the contact config.
   ============================================================ */
window.CONFIG = {
  /* Tom's WhatsApp number, international format, digits only — e.g. '447700900123'.
     While empty, every WhatsApp control hides itself and the form falls back to email. */
  whatsapp: '',
  email: 'thomasrgriffiths08@gmail.com',
  instagram: 'https://www.instagram.com/tomxsystems/'
};

(function(){
  var d = document;
  try{ if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) d.documentElement.classList.add('m-on'); }catch(e){}
  d.addEventListener('DOMContentLoaded', function(){
    var wa = CONFIG.whatsapp && String(CONFIG.whatsapp).replace(/\D/g,'');
    d.querySelectorAll('[data-wa]').forEach(function(el){
      if (!wa){ el.hidden = true; return; }
      el.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(el.getAttribute('data-wa') || 'Hi Tom — saw your site.');
      el.hidden = false;
    });
    d.querySelectorAll('[data-email]').forEach(function(el){ el.href = 'mailto:' + CONFIG.email; });
    d.querySelectorAll('[data-ig]').forEach(function(el){ el.href = CONFIG.instagram; });
    d.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });

    /* the readout: UK time, ticking. Content, not decoration — runs regardless of reduced motion. */
    var clock = d.getElementById('clock');
    if (clock){
      var fmt;
      try{ fmt = new Intl.DateTimeFormat('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false, timeZone:'Europe/London' }); }
      catch(e){ fmt = null; }
      var tick = function(){
        var t = new Date();
        clock.textContent = fmt ? fmt.format(t) : t.toTimeString().slice(0,8);
      };
      tick(); setInterval(tick, 1000);
    }
  });
})();
