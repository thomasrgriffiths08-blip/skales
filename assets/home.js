/* Home: the first screen's trade switcher, and the calendar that loads as you reach it.
   The switcher steps through the trades on its own until someone touches it, only while it is on screen.
   Nothing here waits on a CSS animation or transition event; state is set directly. */
(function(){
  var d = document, S = window.SITE || {};

  var stage = d.querySelector('[data-hx]');
  if (stage){
    var chips = Array.prototype.slice.call(stage.querySelectorAll('.chip[data-i]'));
    var imgs = Array.prototype.slice.call(stage.querySelectorAll('img[data-i]'));
    var name = stage.querySelector('[data-hx-name]');
    var gos = Array.prototype.slice.call(stage.querySelectorAll('[data-hx-go]'));
    var cur = 0, timer = 0, held = false, seen = true;
    var warm = function(i){ imgs.forEach(function(im){ if (im.getAttribute('data-i') === String(i)) im.loading = 'eager'; }); };
    var pick = function(i, focus){
      cur = i;
      chips.forEach(function(c, k){ var on = k === i; c.setAttribute('aria-selected', on ? 'true' : 'false'); c.tabIndex = on ? 0 : -1; if (on && focus) c.focus(); });
      imgs.forEach(function(im){ var on = im.getAttribute('data-i') === String(i); if (on) im.loading = 'eager'; im.classList.toggle('is-on', on); });
      var c = chips[i];
      if (name) name.textContent = c.getAttribute('data-name');
      gos.forEach(function(a){ a.href = (S.base || '') + 'work/' + c.getAttribute('data-slug') + '/'; });
      warm((i + 1) % chips.length);
    };
    var stop = function(){ held = true; clearInterval(timer); timer = 0; };
    var run = function(){
      clearInterval(timer); timer = 0;
      if (held || !seen || d.hidden) return;
      timer = setInterval(function(){ pick((cur + 1) % chips.length); }, 4200);
    };
    chips.forEach(function(c, i){
      c.addEventListener('click', function(){ stop(); pick(i); });
      c.addEventListener('keydown', function(e){
        var k = e.key, n = chips.length, to = k === 'ArrowRight' ? (i + 1) % n : k === 'ArrowLeft' ? (i - 1 + n) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
        if (to < 0) return;
        e.preventDefault(); stop(); pick(to, true);
      });
    });
    chips.forEach(function(c, k){ c.tabIndex = k === 0 ? 0 : -1; });
    stage.addEventListener('pointerdown', stop);
    stage.addEventListener('focusin', stop);
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ seen = es[es.length - 1].isIntersecting; run(); }, { threshold: .35 }).observe(stage);
    }
    d.addEventListener('visibilitychange', run);
    warm(1);
    run();
  }

  /* the calendar: an inline Calendly on laptops once it is near; phones keep the button to the booking page */
  var cal = d.querySelector('.cal[data-cal]');
  if (cal && 'IntersectionObserver' in window && window.matchMedia('(min-width: 761px)').matches){
    var io = new IntersectionObserver(function(es){
      if (!es.some(function(e){ return e.isIntersecting; })) return;
      io.disconnect();
      var src = cal.getAttribute('data-cal');
      src += (src.indexOf('?') > -1 ? '&' : '?') + 'embed_type=Inline&embed_domain=' + encodeURIComponent(location.hostname);
      var f = d.createElement('iframe');
      f.title = 'Book a free call with Tom';
      f.src = src;
      f.addEventListener('load', function(){ cal.classList.add('is-live'); });
      cal.appendChild(f);
      /* a blocked or dead embed never leaves an empty box: the button stays until the frame has loaded */
    }, { rootMargin: '700px 0px' });
    io.observe(cal);
    window.addEventListener('message', function(e){
      if (/calendly\.com$/.test(e.origin) && e.data && e.data.event === 'calendly.event_scheduled' && window.skTrack) skTrack('call_booked', { from: 'home', tool: 'calendly' });
    });
  }
})();
