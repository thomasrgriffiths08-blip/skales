/* Show me: plays a build's best moment inside its own page, with a tap marker like a screen recording,
   so nobody has to guess what to press. The steps live in data/shows.js and ride along in assets/builds.js.
   SkShow.run(win, steps, { onStep(i, step), onEnd(finished), speed }) -> { stop() }
   Any real tap, key or wheel in the page stops it at once and hands the build back. */
(function(g){
  var CSS = '#sk-tap{position:fixed;z-index:2147483646;left:50%;top:60%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;'
    + 'background:rgba(24,24,27,.22);border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.4),0 6px 18px rgba(0,0,0,.22);pointer-events:none;opacity:0;'
    + 'transition:left .5s cubic-bezier(.2,.7,.2,1),top .5s cubic-bezier(.2,.7,.2,1),opacity .25s,transform .14s}'
    + '#sk-tap.on{opacity:1}#sk-tap.press{transform:scale(.72)}'
    + '#sk-tap i{position:absolute;inset:-2px;border-radius:50%;border:2px solid rgba(255,255,255,.9);opacity:0}'
    + '#sk-tap.ring i{animation:sk-ring .5s ease-out}@keyframes sk-ring{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(1.9)}}';

  function visible(el){
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    var cs = el.ownerDocument.defaultView.getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0;
  }
  function find(doc, s){
    if (!s) return null;
    var list, i;
    if (s.indexOf('text=') === 0){
      var t = s.slice(5).toLowerCase();
      list = doc.querySelectorAll('button,a,[role=tab],[role=button],[role=option],label,summary,li,tr,td');
      for (i = 0; i < list.length; i++) if (visible(list[i]) && (list[i].innerText || '').toLowerCase().indexOf(t) > -1) return list[i];
      return null;
    }
    try { list = doc.querySelectorAll(s); } catch (e){ return null; }
    for (i = 0; i < list.length; i++) if (visible(list[i])) return list[i];
    return null;
  }

  function run(win, steps, opt){
    opt = opt || {};
    var doc = win.document, alive = true, timers = [], speed = opt.speed || 1, dot, raf = 0;
    var later = function(fn, ms){ var t = win.setTimeout(function(){ if (alive) fn(); }, ms / speed); timers.push(t); };
    if (!doc.getElementById('sk-tap-css')){ var st = doc.createElement('style'); st.id = 'sk-tap-css'; st.textContent = CSS; doc.head.appendChild(st); }
    dot = doc.getElementById('sk-tap');
    if (!dot){ dot = doc.createElement('div'); dot.id = 'sk-tap'; dot.setAttribute('aria-hidden', 'true'); dot.appendChild(doc.createElement('i')); doc.body.appendChild(dot); }

    function stopOn(e){ if (e.isTrusted) stop(false); }
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function(t){ doc.addEventListener(t, stopOn, true); });
    function stop(finished){
      if (!alive) return; alive = false;
      timers.forEach(function(t){ win.clearTimeout(t); }); if (raf) win.cancelAnimationFrame(raf);
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function(t){ doc.removeEventListener(t, stopOn, true); });
      dot.classList.remove('on');
      if (opt.onEnd) opt.onEnd(!!finished);
    }

    function moveTo(el){
      var r = el.getBoundingClientRect();
      dot.style.left = Math.round(r.left + Math.min(r.width / 2, 60)) + 'px';
      dot.style.top = Math.round(r.top + r.height / 2) + 'px';
      dot.classList.add('on');
    }
    function inView(el){ var r = el.getBoundingClientRect(), h = win.innerHeight; return r.top >= h * 0.12 && r.bottom <= h * 0.88; }
    function glide(by, dur, done){
      var se = doc.scrollingElement || doc.documentElement, from = se.scrollTop, t0 = 0;
      var to = Math.max(0, Math.min(se.scrollHeight - win.innerHeight, from + by));
      function f(t){
        if (!alive) return; if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / (dur / speed)), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        win.scrollTo(0, from + (to - from) * e);
        if (k < 1) raf = win.requestAnimationFrame(f); else done();
      }
      raf = win.requestAnimationFrame(f);
    }
    function bring(el, done){
      if (inView(el)) return done();
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      later(done, 650);
    }
    function fire(el, type){
      var Ev = type.indexOf('pointer') === 0 && win.PointerEvent ? win.PointerEvent : win.MouseEvent;
      el.dispatchEvent(new Ev(type, { bubbles: true, cancelable: true, view: win, pointerType: 'mouse', isPrimary: true, button: 0 }));
    }
    function tap(el){
      dot.classList.add('press'); dot.classList.remove('ring'); void dot.offsetWidth; dot.classList.add('ring');
      later(function(){ dot.classList.remove('press'); }, 160);
      if (el.tagName === 'INPUT' && (el.type === 'radio' || el.type === 'checkbox')){ el.click(); return; }
      if (el.focus) try { el.focus({ preventScroll: true }); } catch (e){}
      fire(el, 'click');
    }
    function setVal(el, v){
      var proto = el.tagName === 'SELECT' ? win.HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
      var d = Object.getOwnPropertyDescriptor(proto, 'value'); d.set.call(el, v);
      el.dispatchEvent(new win.Event('input', { bubbles: true }));
    }
    function typeIn(el, text, done){
      if (el.focus) try { el.focus({ preventScroll: true }); } catch (e){}
      setVal(el, ''); var i = 0;
      (function next(){
        if (i >= text.length){ el.dispatchEvent(new win.Event('change', { bubbles: true })); return done(); }
        setVal(el, text.slice(0, ++i)); later(next, 70);
      })();
    }
    function slide(el, to, done){
      if (el.tagName === 'SELECT'){ setVal(el, String(to)); el.dispatchEvent(new win.Event('change', { bubbles: true })); return done(); }
      var from = parseFloat(el.value) || 0, n = 14, i = 0, step = el.step && el.step !== 'any' ? parseFloat(el.step) : 0;
      (function next(){
        i++; var v = from + (to - from) * i / n; if (step) v = Math.round(v / step) * step;
        setVal(el, String(+v.toFixed(4)));
        if (i < n) later(next, 50); else { el.dispatchEvent(new win.Event('change', { bubbles: true })); done(); }
      })();
    }

    function go(i){
      if (!alive) return;
      if (i >= steps.length){ later(function(){ stop(true); }, 900); return; }
      var s = steps[i], after = s.pause != null ? s.pause : 1100, next = function(){ later(function(){ go(i + 1); }, after); };
      if (opt.onStep) opt.onStep(i, s);
      if (s.wait){ later(function(){ go(i + 1); }, s.wait); return; }
      if (s.scrollBy){ dot.classList.remove('on'); glide(s.scrollBy, s.dur || 2400, next); return; }
      var el = find(doc, s.tap || s.type || s.set || s.scroll);
      if (!el){ if (opt.onMiss) opt.onMiss(i, s); go(i + 1); return; }
      bring(el, function(){
        moveTo(el);
        if (s.scroll){ next(); return; }
        later(function(){
          moveTo(el);
          if (s.tap){ tap(el); next(); }
          else if (s.type != null){ tap(el); typeIn(el, s.text || '', next); }
          else if (s.set != null){ slide(el, s.to, next); }
          else next();
        }, 520);
      });
    }
    later(function(){ go(0); }, 200);
    return { stop: function(){ stop(false); } };
  }
  g.SkShow = { run: run, find: find };
})(window);
