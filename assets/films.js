/* The films on the site's pages (not the cold open, which has its own player). Each
   <video data-film data-wide=".." data-phone=".."> shows its poster first, picks the 4:5 cut on a
   phone and the 16:9 cut on a wider screen, loads only when it is about to scroll into view, plays
   muted while on screen and pauses off it. With Reduce Motion on it waits for the play button. */
(function(){
  var vids = [].slice.call(document.querySelectorAll('video[data-film]'));
  if (!vids.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, phone = matchMedia('(max-width: 699px)').matches;
  vids.forEach(function(v){
    var fig = v.closest('figure'), btn = fig && fig.querySelector('[data-film-toggle]');
    var poster = phone ? v.getAttribute('data-phone-poster') : v.getAttribute('data-wide-poster');
    if (poster) v.poster = poster;
    if (phone && fig) fig.classList.add('is-phone');
    var loaded = false, wanted = !reduce;
    function load(){ if (loaded) return; loaded = true; v.src = phone ? v.getAttribute('data-phone') : v.getAttribute('data-wide'); }
    function state(){ if (btn){ var on = !v.paused; btn.setAttribute('aria-pressed', String(on)); btn.textContent = on ? 'Pause' : 'Play the film'; } }
    v.addEventListener('play', state); v.addEventListener('pause', state);
    if (btn) btn.addEventListener('click', function(){ load(); if (v.paused){ wanted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); } else { wanted = false; v.pause(); } });
    if (!('IntersectionObserver' in window)){ load(); return; }
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (e.isIntersecting){ load(); if (wanted){ var p = v.play(); if (p && p.catch) p.catch(function(){ wanted = false; state(); }); } }
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: '200px 0px', threshold: .25 }).observe(v);
    state();
  });
})();
