/* THE SWITCH — see hero.css. Runs regardless of reduced motion: it is the page's content. */
(function(){
  var d = document, root = d.documentElement, btn = d.getElementById('power');
  if (!btn) return;
  var booted = false;
  function word(id, t){ var el = d.getElementById(id); if (el) el.textContent = t; }
  function setPower(on){
    root.setAttribute('data-power', on ? 'on' : 'off');
    btn.setAttribute('aria-pressed', String(on));
    word('powerWord', on ? 'switched on' : 'standby');
    word('monWord', on ? 'Live' : 'Standby');
    if (on && !booted){ booted = true; if (window.initRig) window.initRig(14, { compact: true }); }
  }
  btn.addEventListener('click', function(){ setPower(root.getAttribute('data-power') !== 'on'); });
  var go = function(){ setTimeout(function(){ setPower(true); }, 700); };
  if (d.readyState === 'complete') go(); else window.addEventListener('load', go);

  /* the worklight follows the pointer over the hero */
  var hero = d.querySelector('.hero'), light = hero && hero.querySelector('.worklight');
  if (light && window.matchMedia && window.matchMedia('(pointer:fine)').matches){
    var x = 0, y = 0, tx = 0, ty = 0, raf = null, rect = null;
    var step = function(){
      raf = null; x += (tx - x) * .16; y += (ty - y) * .16;
      light.style.transform = 'translate(' + (x - 400) + 'px,' + (y - 400) + 'px)';
      if (Math.abs(tx - x) > .4 || Math.abs(ty - y) > .4) raf = requestAnimationFrame(step);
    };
    hero.addEventListener('pointermove', function(e){
      rect = rect || hero.getBoundingClientRect();
      tx = e.clientX - rect.left; ty = e.clientY - rect.top + window.scrollY - (window.scrollY); 
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    window.addEventListener('resize', function(){ rect = null; }, { passive: true });
    window.addEventListener('scroll', function(){ rect = null; }, { passive: true });
  }
})();
