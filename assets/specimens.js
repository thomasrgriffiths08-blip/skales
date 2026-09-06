/* the Motion specimen carries a real timecode at 24 fps and its word drifts with the scroll */
(function(){
  var d = document, tc = d.querySelector('.spm-motion .tc'), word = d.querySelector('.spm-motion b'); if (!tc) return;
  var t0 = Date.now(), raf = null, hidden = false;
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  function tick(){
    if (!hidden){ var ms = Date.now() - t0, s = Math.floor(ms / 1000), f = Math.floor((ms % 1000) / 1000 * 24);
      tc.textContent = pad(Math.floor(s / 3600) % 24) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + ':' + pad(f); }
    setTimeout(tick, 1000 / 24);
  }
  tick();
  d.addEventListener('visibilitychange', function(){ hidden = d.hidden; });
  if (word){
    var onS = function(){ raf = null; var r = word.getBoundingClientRect(); var p = (window.innerHeight / 2 - (r.top + r.height / 2)) / window.innerHeight; word.style.setProperty('--tx', (p * 60).toFixed(1) + 'px'); };
    window.addEventListener('scroll', function(){ if (!raf) raf = requestAnimationFrame(onS); }, { passive: true }); onS();
  }
})();
