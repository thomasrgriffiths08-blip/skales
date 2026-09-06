/* The hero: the live build boots on load and lends the page its colours; the marquee of every build
   drifts and speeds up when you scroll harder; the workings draw over the hero once, then lift. */
(function(){
  var d = document, S = window.SITE || {}, B = window.BUILDS || [], hero = d.querySelector('.hero');
  if (!hero) return;
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var word = function(id, t){ var el = d.getElementById(id); if (el) el.textContent = t; };
  function boot(){
    if (window.initRig) window.initRig(S.defaultCh || B[0].n, { compact: true });
    word('monWord', 'Live');
    setTimeout(function(){ if (window.WORKINGS) window.WORKINGS.echo(hero); }, 600);
  }
  if (d.readyState === 'complete') boot(); else window.addEventListener('load', boot);

  /* ---------- the marquee ---------- */
  var track = d.getElementById('marq');
  if (track && B.length){
    var base = S.base || '', pad = function(n){ return (n < 10 ? '0' : '') + n; };
    var item = function(x){ return '<a href="' + base + 'work/' + x.slug + '/" style="--m:' + (x.cText || x.c) + '"><span class="n">' + pad(x.n) + '</span>' + x.name + '</a>'; };
    var html = B.map(item).join(''); track.innerHTML = html + html;
    var x = 0, vel = 0, lastY = window.scrollY, half = 0, raf = null, visible = true, paused = false;
    var measure = function(){ half = track.scrollWidth / 2; };
    measure(); window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('scroll', function(){ var y = window.scrollY; vel += (y - lastY); lastY = y; }, { passive: true });
    track.addEventListener('mouseenter', function(){ paused = true; }); track.addEventListener('mouseleave', function(){ paused = false; });
    if ('IntersectionObserver' in window){ new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(step); }, { rootMargin: '100px' }).observe(track); }
    var speed = rm ? .28 : .7;
    function step(){
      raf = null; if (!visible) return;
      vel *= .9; var v = paused ? 0 : speed + Math.min(Math.abs(vel) * .05, 4);
      x -= v; if (half && -x >= half) x += half; if (x > 0) x -= half;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      raf = requestAnimationFrame(step);
    }
    d.addEventListener('visibilitychange', function(){ if (!d.hidden && !raf) raf = requestAnimationFrame(step); });
    raf = requestAnimationFrame(step);
  }
})();
