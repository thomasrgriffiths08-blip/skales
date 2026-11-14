/* Steps: the one story runner behind every rebuilt demo. No dependencies; assets/shell.js puts the kit around it.

   var story = Steps.run(stageEl, [
     { at: 500, label: 'A text comes in', caption: '...', do: function(el, c){ c.show('[data-k=ask]'); } },
     { after: 1500, do: function(el, c){ c.show('[data-k=typing]'); } },          // no label: a sub-step, no dot
     { after: 1700, label: 'The customer books', waitFor: 'tap', target: '[data-k=act]', hint: 'Tap',
       do: function(el, c){ c.show('[data-k=paid]'); } }
   ], { mode: 'watch', view: blockToWatch, animRoot: pageRoot, onStep: fn, onWait: fn, onEnd: fn, onState: fn });

   at = ms of story time from the start, after = ms after the step before. Story time only runs while the story
   plays: it stops for pause(), a hidden tab, the stage scrolled out of sight and a tap the story is waiting for.
   Watch mode starts by itself 1.5s after the stage is fully in view and taps for the visitor; Try mode stops at
   each { waitFor: 'tap' } until the visitor taps the target (a static 2px outline and a 'Tap' label show where;
   hint: the label's words, hintAt: 'right' | 'above' | 'below', auto: ms Watch mode waits before it taps).
   Everyone gets the story, Reduce Motion included. With Reduce Motion each beat is a discrete swap in one frame
   at the same pace; otherwise c.show() fades and slides for 240ms. The transitions live under .st-anim, which is
   only on the page when motion is allowed. Nothing waits for animationend or transitionend: site.css cuts every
   animation and transition to .001s under Reduce Motion, so the clock is setTimeout + requestAnimationFrame.

   Controller: play() pause() restart(mode?) reset() skipToEnd() setMode('watch'|'try') destroy(),
   and .state ('idle' | 'playing' | 'waiting' | 'paused' | 'ended'), .mode, .index, .beat, .beats, .ctx.
   Each do(el, c) gets c: $ $$ show hide cls text add flip, plus .mode .motion .instant (true inside skipToEnd). */
(function(w, d){
  'use strict';
  if (w.Steps) return;

  var EASE = 'cubic-bezier(.2,.7,.2,1)';
  var CSS = '.st-off{display:none!important}' +
    '.st-anim .st-fx{transition:opacity .24s ' + EASE + ',transform .24s ' + EASE + '!important}' +
    '.st-anim .st-from{opacity:0!important;transform:translate(var(--st-dx,0px),var(--st-dy,10px))!important;transition:none!important}' +
    '.st-hint{outline:2px solid #0A0B0D!important;outline-offset:3px!important;position:relative}' +
    '.st-tap{position:absolute;z-index:3;padding:5px 8px;background:#0A0B0D;color:#fff;' +
      'font-family:inherit;font-size:12px;font-weight:700;line-height:1;letter-spacing:.02em;white-space:nowrap;pointer-events:none}' +
    '.st-tap.is-right{left:calc(100% + 12px);top:50%;transform:translateY(-50%)}' +
    '.st-tap.is-above{right:-5px;bottom:calc(100% + 9px)}' +
    '.st-tap.is-below{right:-5px;top:calc(100% + 9px)}' +
    '.st-press{transform:translate(2px,2px)!important;box-shadow:none!important}';

  var mq = null; try { mq = w.matchMedia('(prefers-reduced-motion: reduce)'); } catch (e){}
  function motionOK(){ return !(mq && mq.matches); }
  var raf = w.requestAnimationFrame ? function(f){ return w.requestAnimationFrame(f); } : function(f){ return setTimeout(f, 16); };
  var caf = w.cancelAnimationFrame ? function(id){ w.cancelAnimationFrame(id); } : clearTimeout;
  var now = function(){ return w.performance && performance.now ? performance.now() : Date.now(); };

  function css(){
    if (d.getElementById('st-css')) return;
    var s = d.createElement('style'), h = d.head || d.documentElement;
    s.id = 'st-css'; s.textContent = CSS;
    h.insertBefore(s, h.firstChild);   /* first, so a page's own stylesheet can restyle the hint */
  }

  /* reveal one element: in one frame without motion, a short fade and slide with it */
  var FROM = { below: [0, 10], above: [0, -14], left: [-14, 0], right: [14, 0] };
  function reveal(e, opt, instant){
    opt = opt || {};
    e.classList.remove('st-off');
    if (e.hidden) e.hidden = false;
    if (instant || !motionOK() || opt.from === 'none') return e;
    var v = FROM[opt.from] || FROM.below;
    e.style.setProperty('--st-dx', (opt.dx != null ? opt.dx : v[0]) + 'px');
    e.style.setProperty('--st-dy', (opt.dy != null ? opt.dy : v[1]) + 'px');
    e.classList.add('st-fx', 'st-from');
    void e.offsetWidth;   /* commit the start state, then let it go */
    e.classList.remove('st-from');
    return e;
  }

  function run(stage, steps, o){
    o = o || {};
    steps = steps || [];
    css();
    var root = o.animRoot || stage, view = o.view || stage;
    var html0 = stage.innerHTML;   /* restart() puts the stage back exactly as it was */

    /* authored times: at is absolute story time, after is relative to the step before */
    var T = [], t = 0;
    steps.forEach(function(s){ t = typeof s.at === 'number' ? Math.max(t, s.at) : t + (s.after || 0); T.push(t); });
    var beats = steps.filter(function(s){ return s.label; }).length;

    var S = { mode: o.mode === 'try' ? 'try' : 'watch', state: 'idle', i: 0, beat: 0 };
    var holds = {}, phase = 'count', left = T[0] || 0, since = null, timer = null, frame = null;
    var autoT = null, waitEl = null, madeFocusable = false, started = false, dead = false, motion = motionOK(), io = null;

    function held(){ for (var k in holds) if (holds[k]) return true; return false; }
    function info(instant){ return { index: S.i, beat: S.beat, beats: beats, steps: steps.length, mode: S.mode, instant: !!instant, motion: motion }; }
    function setState(s){ if (S.state === s) return; S.state = s; if (o.onState) o.onState(s, api); }
    function syncState(){
      if (S.state === 'idle' || S.state === 'ended') return;
      setState(holds.user ? 'paused' : (phase === 'wait' && left === Infinity ? 'waiting' : 'playing'));
    }

    /* the clock: one countdown (left) that only runs while nothing holds the story */
    function stopClock(){
      if (since != null){ left = Math.max(0, left - (now() - since)); since = null; }
      clearTimeout(timer); timer = null;
      if (frame != null){ caf(frame); frame = null; }
    }
    function arm(){
      stopClock();
      if (dead || S.state === 'idle' || S.state === 'ended' || held() || left === Infinity) return;
      since = now();
      timer = setTimeout(expire, left);
    }
    function expire(){
      timer = null; since = null; left = 0;
      frame = raf(function(){ frame = null; if (!held()) advance(); });   /* a held story re-arms at 0 when released */
    }
    function hold(k){ if (holds[k]) return; holds[k] = true; stopClock(); syncState(); }
    function release(k){ if (!holds[k]) return; holds[k] = false; syncState(); arm(); }

    function advance(){
      if (phase === 'tail') return finish(false);
      var s = steps[S.i];
      if (!s) return finish(false);
      if (phase === 'wait') return press(s, true);          /* watch mode: the story taps for the visitor */
      if (s.waitFor) return wait(s);
      apply(s, false); next();
    }
    function next(){
      if (S.i < steps.length){ phase = 'count'; left = T[S.i] - T[S.i - 1]; }
      else { phase = 'tail'; left = o.tail != null ? o.tail : 1600; }
      syncState(); arm();
    }
    function apply(s, instant){
      ctx.instant = !!instant; ctx.step = s; ctx.index = S.i;
      if (typeof s.do === 'function'){ try { s.do(stage, ctx); } catch (e){ if (w.console) console.error(e); } }
      ctx.instant = false;
      S.i++; if (s.label) S.beat++;
      if (o.onStep) o.onStep(S.i - 1, s, info(instant));
    }
    function finish(instant){
      stopClock(); unhint(); phase = 'done';
      setState('ended');
      if (o.onEnd) o.onEnd(info(instant));
    }

    /* a beat that waits for a tap */
    function wait(s){
      phase = 'wait';
      waitEl = s.target ? stage.querySelector(s.target) : null;
      if (waitEl){
        waitEl.classList.add('st-hint');
        var tag = d.createElement('span');
        tag.className = 'st-tap is-' + hintSide(waitEl, s); tag.setAttribute('aria-hidden', 'true'); tag.textContent = s.hint || 'Tap';
        waitEl.appendChild(tag);
        madeFocusable = !/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(waitEl.tagName) && !waitEl.hasAttribute('tabindex');
        if (madeFocusable){ waitEl.setAttribute('tabindex', '0'); waitEl.setAttribute('role', 'button'); }
      }
      left = waitLeft(s);
      if (o.onWait) o.onWait(S.i, s, info());
      if (S.mode === 'try' && waitEl && o.focus !== false){ try { waitEl.focus({ preventScroll: true }); } catch (e){} }
      syncState(); arm();
    }
    /* the label sits beside the target when there is room, else above it (or where the step says: hintAt) */
    function hintSide(el, s){
      if (/^(right|above|below)$/.test(s.hintAt)) return s.hintAt;
      var r = el.getBoundingClientRect(), box = (el.parentElement || stage).getBoundingClientRect();
      return box.right - r.right >= 64 ? 'right' : 'above';
    }
    function waitLeft(s){ return S.mode === 'try' && waitEl ? Infinity : (s.auto != null ? s.auto : 1500); }
    function unhint(){
      if (!waitEl) return;
      waitEl.classList.remove('st-hint');
      var tag = waitEl.querySelector('.st-tap'); if (tag) tag.parentNode.removeChild(tag);
      if (madeFocusable){ waitEl.removeAttribute('tabindex'); waitEl.removeAttribute('role'); }
      waitEl = null; madeFocusable = false;
    }
    function press(s, auto){
      var el = waitEl || (s.target ? stage.querySelector(s.target) : null);
      unhint();
      if (el && auto){ el.classList.add('st-press'); setTimeout(function(){ el.classList.remove('st-press'); }, 320); }
      apply(s, false); next();
    }
    function onTap(e){
      if (dead || S.state === 'idle' || S.state === 'ended') return;
      var s = steps[S.i];
      if (!s || !s.waitFor || !s.target || (phase !== 'wait' && phase !== 'count')) return;
      var tg = e.target && e.target.closest ? e.target.closest(s.target) : null;
      if (!tg || !stage.contains(tg)) return;
      if (e.type === 'keydown'){
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (/^(BUTTON|A)$/.test(tg.tagName)) return;   /* those send their own click */
        e.preventDefault();
      } else if (tg.tagName === 'A') e.preventDefault();
      holds.user = false; stopClock();
      press(s, false);
    }

    function start(){
      if (dead) return;
      clearTimeout(autoT); autoT = null; started = true;
      S.i = 0; S.beat = 0; phase = 'count'; left = T[0] || 0; holds.user = false;
      setState('playing');
      if (o.onStart) o.onStart(info());
      syncState(); arm();
    }
    function reset(){
      stopClock(); unhint(); clearTimeout(autoT); autoT = null;
      stage.innerHTML = html0;
      S.i = 0; S.beat = 0; phase = 'count'; left = T[0] || 0; holds.user = false;
      setState('idle');
      if (o.onReset) o.onReset(info());
    }

    /* the helpers each step gets */
    function list(x){
      if (!x) return [];
      if (typeof x === 'string') return [].slice.call(stage.querySelectorAll(x));
      if (x.nodeType) return [x];
      return [].slice.call(x);
    }
    var ctx = {
      mode: S.mode, motion: motion, instant: false, step: null, index: 0,
      $: function(s){ return typeof s === 'string' ? stage.querySelector(s) : s; },
      $$: list,
      show: function(x, opt){ var es = list(x); es.forEach(function(e){ reveal(e, opt, ctx.instant); }); return es[0] || null; },
      hide: function(x){ list(x).forEach(function(e){ e.classList.add('st-off'); }); },
      cls: function(x, c, on){ list(x).forEach(function(e){ e.classList.toggle(c, on !== false); }); },
      text: function(x, v){ list(x).forEach(function(e){ e.textContent = v; }); },
      add: function(parent, html, opt){
        var p = ctx.$(parent); if (!p) return null;
        var box = d.createElement('div'); box.innerHTML = String(html).trim();
        var e = box.firstElementChild; if (!e) return null;
        if (opt && opt.first) p.insertBefore(e, p.firstChild); else p.appendChild(e);
        return ctx.show(e, opt);
      },
      /* move things in the DOM and let them travel from where they were (snapped without motion) */
      flip: function(x, change){
        var es = list(x), a = es.map(function(e){ return e.getBoundingClientRect(); });
        change();
        if (!motion || ctx.instant) return;
        es.forEach(function(e, k){
          var b = e.getBoundingClientRect(), dx = a[k].left - b.left, dy = a[k].top - b.top;
          if (!dx && !dy) return;
          e.classList.remove('st-fx'); e.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          void e.offsetWidth;
          e.classList.add('st-fx'); e.style.transform = '';
        });
      }
    };

    var api = {
      play: function(){
        if (S.state === 'idle') return start();
        if (S.state === 'ended') return api.restart();
        release('user');
      },
      pause: function(){ if (S.state !== 'idle' && S.state !== 'ended') hold('user'); },
      restart: function(mode){ if (mode) api.setMode(mode); reset(); start(); },
      reset: reset,
      /* "Skip to the result": every remaining step, at once, with nothing travelling */
      skipToEnd: function(){
        if (dead || S.state === 'ended') return;
        started = true;
        stopClock(); clearTimeout(autoT); autoT = null; unhint();
        var had = root.classList.contains('st-anim');
        root.classList.remove('st-anim');
        while (S.i < steps.length) apply(steps[S.i], true);
        void root.offsetWidth;
        if (had) root.classList.add('st-anim');
        finish(true);
      },
      setMode: function(m){
        m = m === 'try' ? 'try' : 'watch';
        if (S.mode === m) return;
        S.mode = ctx.mode = m;
        if (phase === 'wait' && S.state !== 'ended' && S.state !== 'idle'){ stopClock(); left = waitLeft(steps[S.i]); syncState(); arm(); }
      },
      destroy: function(){
        dead = true; stopClock(); unhint(); clearTimeout(autoT);
        if (io) io.disconnect();
        stage.removeEventListener('click', onTap); stage.removeEventListener('keydown', onTap);
        d.removeEventListener('visibilitychange', onVis);
        if (mq){ if (mq.removeEventListener) mq.removeEventListener('change', syncMotion); else if (mq.removeListener) mq.removeListener(syncMotion); }
      },
      ctx: ctx, steps: steps, beats: beats,
      get state(){ return S.state; },
      get mode(){ return S.mode; },
      get index(){ return S.i; },
      get beat(){ return S.beat; }
    };
    ctx.story = api;
    if (o.helpers){ var extra = o.helpers(ctx, stage, api) || {}; for (var k in extra) ctx[k] = extra[k]; }

    stage.addEventListener('click', onTap);
    stage.addEventListener('keydown', onTap);

    /* a hidden tab stops the clock */
    function onVis(){ if (d.hidden) hold('hidden'); else release('hidden'); }
    d.addEventListener('visibilitychange', onVis);
    onVis();

    /* motion on or off follows the setting live */
    function syncMotion(){ motion = ctx.motion = motionOK(); root.classList.toggle('st-anim', motion); }
    syncMotion();
    if (mq){ if (mq.addEventListener) mq.addEventListener('change', syncMotion); else if (mq.addListener) mq.addListener(syncMotion); }

    /* start by itself 1.5s after the whole stage is in view (or, taller than the window, fills it);
       scrolled mostly away, the story holds until it comes back */
    var delay = o.delay != null ? o.delay : 1500, need = o.threshold || 0.95;
    function autostart(full){
      if (o.autostart === false || started || S.state !== 'idle') return;
      if (full){ if (!autoT) autoT = setTimeout(function(){ autoT = null; if (!started && S.state === 'idle') start(); }, delay); }
      else if (autoT){ clearTimeout(autoT); autoT = null; }
    }
    if ('IntersectionObserver' in w){
      var th = []; for (var n = 0; n <= 20; n++) th.push(n / 20);
      io = new IntersectionObserver(function(es){
        es.forEach(function(en){
          var vh = en.rootBounds ? en.rootBounds.height : w.innerHeight;
          var fit = Math.min(en.boundingClientRect.height, vh), seen = en.isIntersecting ? en.intersectionRect.height : 0;
          if (seen < fit * 0.3) hold('away'); else release('away');
          autostart(seen >= fit * need - 1);
        });
      }, { threshold: th });
      io.observe(view);
    } else autostart(true);

    if (o.onReset) o.onReset(info());
    return api;
  }

  w.Steps = { run: run, motion: motionOK, reveal: function(e, opt){ return reveal(e, opt, false); }, version: 1 };
})(window, document);
