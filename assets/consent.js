/* Consent for the ad and analytics tags. Nothing from Meta or Google loads until the visitor taps Accept,
   and Reject is exactly as easy. The build only adds this file when a tag ID is set in data/site.js.
   The choice is kept in this browser; "Cookie settings" in the footer and on /cookies/ reopens it. */
(function(){
  var d = document, S = window.SITE || {}, T = S.track || {}, b = S.base || '/';
  if (!T.pixel && !T.ga && !T.ads) return;
  var KEY = 'sk-consent', loaded = false, box = null;
  var get = function(){ try { var v = JSON.parse(localStorage.getItem(KEY)); return v && v.v; } catch (e){ return null; } };
  var put = function(v){ try { localStorage.setItem(KEY, JSON.stringify({ v: v, at: new Date().toISOString() })); } catch (e){} };

  function load(){
    if (loaded) return; loaded = true;
    if (T.pixel){
      /* Meta's standard loader */
      var n = window.fbq = function(){ n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!window._fbq) window._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      var f = d.createElement('script'); f.async = true; f.src = 'https://connect.facebook.net/en_US/fbevents.js'; d.head.appendChild(f);
      fbq('init', T.pixel); fbq('track', 'PageView');
    }
    if (T.ga || T.ads){
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ dataLayer.push(arguments); };
      gtag('consent', 'default', { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
      gtag('js', new Date());
      if (T.ga) gtag('config', T.ga);
      if (T.ads) gtag('config', T.ads);
      var g = d.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(T.ga || T.ads); d.head.appendChild(g);
    }
  }
  /* taking consent back: drop the first-party cookies the tags set, then reload so their scripts are gone */
  function clear(){
    var host = location.hostname;
    d.cookie.split(';').forEach(function(c){
      var k = c.split('=')[0].trim();
      if (/^(_fbp|_fbc|_ga|_ga_.+|_gid|_gcl_.+)$/.test(k)) ['', '; domain=' + host, '; domain=.' + host].forEach(function(dm){ d.cookie = k + '=; Max-Age=0; path=/' + dm; });
    });
  }

  function close(){ if (box){ box.hidden = true; } }
  function choose(v){
    var was = get(); put(v); close();
    if (v === 'yes') load();
    else if (was === 'yes'){ clear(); location.reload(); }
  }
  function open(){
    if (!box){
      box = d.createElement('section');
      box.className = 'cnst'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Cookie choice');
      box.innerHTML = '<p class="cnst-h">Can I see which ads brought you here?</p>'
        + '<p class="cnst-p">That needs cookies from ' + [T.pixel && 'Meta', (T.ga || T.ads) && 'Google'].filter(Boolean).join(' and ') + '. They only load if you say yes. <a class="lnk" href="' + b + 'cookies/">What they do</a></p>'
        + '<div class="cnst-b"><button type="button" class="btn btn-ghost btn-sm" data-cn="no">Reject</button><button type="button" class="btn btn-ghost btn-sm" data-cn="yes">Accept</button></div>';
      box.addEventListener('click', function(e){ var t = e.target.closest('[data-cn]'); if (t) choose(t.getAttribute('data-cn')); });
      d.body.appendChild(box);
    }
    box.hidden = false;
    var first = box.querySelector('[data-cn]'); if (first && d.activeElement && d.activeElement.hasAttribute('data-consent-open')) first.focus();
  }

  d.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('[data-consent-open]')){ e.preventDefault(); open(); } });
  var go = function(){
    [].forEach.call(d.querySelectorAll('[data-consent-open]'), function(el){ el.hidden = false; });
    var v = get();
    if (v === 'yes') load(); else if (v !== 'no') open();
  };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', go); else go();
})();
