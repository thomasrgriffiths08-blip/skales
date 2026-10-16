/* The hero's phone: on a wide screen, once the page has loaded and gone quiet, the still is
   replaced by the build itself, running in the phone. Never on a phone, never with Save-Data,
   and only while the hero is on screen, so it never competes with the page for the network. */
(function(){
  var fig = document.querySelector('.hph[data-hp]'); if (!fig) return;
  var wide = matchMedia('(min-width: 1100px)'), c = navigator.connection;
  if (!wide.matches || (c && (c.saveData || /2g/.test(c.effectiveType || '')))) return;
  var b = (window.SITE || {}).base || '', slug = fig.getAttribute('data-hp'), shell = fig.querySelector('.hph-shell'), done = false;
  function mount(){
    if (done || !wide.matches) return; done = true;
    var f = document.createElement('iframe');
    f.src = b + 'demos/' + slug + '/#s=1'; f.title = (fig.querySelector('.hph-who b') || {}).textContent + ': the live build';
    f.loading = 'eager'; f.setAttribute('tabindex', '0');
    f.addEventListener('load', function(){ setTimeout(function(){ fig.classList.add('is-live'); }, 250); });
    shell.appendChild(f);
  }
  function soon(){ ('requestIdleCallback' in window) ? requestIdleCallback(mount, { timeout: 1500 }) : setTimeout(mount, 900); }
  function ready(){
    if (!('IntersectionObserver' in window)) return soon();
    var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); soon(); } }, { threshold: .2 });
    io.observe(shell);
  }
  if (document.readyState === 'complete') ready(); else addEventListener('load', ready);
})();
