/* The call recordings player. A recorded example call plays like a recording in a phone system's call log: the
   waveform is the real loudness of the call, the transcript follows it word by word, each thing the assistant does
   shows in the transcript at the moment it happens, and the diary entry and the text message fill in beside it.
   The whole transcript is there before anyone presses play, so it reads without sound too. If the audio cannot
   play, the same call runs on a clock as text. Motion uses the Web Animations API, which Reduce Motion settings in
   site.css do not switch off. */
(function(){
  'use strict';
  var roots = document.querySelectorAll('[data-vp]');
  if (!roots.length) return;
  var ICON = {
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', done: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    look: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    note: '<path d="M5 19l1-4L16.5 4.5l3 3L9 18z"/>',
    rule: '<path d="M12 3.5l7 2.5v5.5c0 4-2.8 7.2-7 9-4.2-1.8-7-5-7-9V6z"/>',
    stop: '<circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/>'
  };
  var icon = function(k){ return '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (ICON[k] || ICON.ok) + '</svg>'; };
  var esc = function(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var tomorrow = new Date(Date.now() + 864e5);
  var day = function(o){ return tomorrow.toLocaleDateString('en-GB', o).replace(/,/g, ''); };
  var TOM = day({ weekday: 'short', day: 'numeric', month: 'short' }), TOML = day({ weekday: 'long', day: 'numeric', month: 'long' });
  var fill = function(s){ return String(s).replace(/\{tomLong\}/g, TOML).replace(/\{tom\}/g, TOM); };
  var mss = function(s){ s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  var B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  var RATES = [1, 1.25, 1.5];
  var pop = function(n, y){ if (n.animate) n.animate([{ opacity: 0, transform: 'translateY(' + (y || 6) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' }); };
  var players = [];

  Array.prototype.forEach.call(roots, function(root){
    var q = function(n){ return root.querySelector('[data-vp-' + n + ']'); };
    var el = { av: q('av'), caller: q('caller'), from: q('from'), biz: q('biz'), place: q('place'), clock: q('clock'), out: q('out'), panel: q('panel'),
      go: q('go'), scrub: q('scrub'), canvas: q('canvas'), now: q('now'), len: q('len'), key: q('key'), rate: q('rate'), mute: q('mute'),
      state: q('state'), roll: q('roll'), scene: q('scene'), lines: q('lines'), diary: q('diary'), diaryK: q('diary-k'), sms: q('sms'), res: q('res') };
    var tabs = root.querySelectorAll('[role="tab"]');
    var base = root.getAttribute('data-base');
    var D = null, loading = null, ci = 0, C = null;
    var L = [], E = [], T = {}, bars = [];
    var playing = false, silent = false, muted = false, ri = 0, done = false, raf = 0, slow = 0, userAt = -1e9;
    var cur = -2, lit = -1, evN = -1, shown = {}, label = '';
    var clk = { base: 0, at: 0, run: false };
    var audio = new Audio(); audio.preload = 'none';
    var me = { pause: function(){ if (playing) toggle(); } };
    players.push(me);

    var load = function(){
      if (!loading) loading = fetch(root.getAttribute('data-src')).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){ D = d; return d; });
      return loading;
    };
    var now = function(){ return clk.run ? clk.base + (performance.now() - clk.at) / 1000 * RATES[ri] : clk.base; };
    var freeze = function(){ clk.base = now(); clk.run = false; };
    var run = function(from){ if (from != null) clk.base = from; clk.at = performance.now(); clk.run = true; };

    /* ---------- the waveform: the whole call, played part solid ---------- */
    var ctx = el.canvas.getContext('2d'), W = 0, H = 0, STEP = 3, BW = 2;
    var whoAt = function(t){
      for (var i = 0; i < C.lines.length; i++){ var l = C.lines[i]; if (t >= l.t - .04 && t <= l.t + l.d + .04) return l.who === 'agent' ? 1 : 2; }
      return 0;
    };
    var measure = function(){
      if (!C) return;
      var n = Math.max(20, Math.floor(W / STEP)), per = C.len / n, hz = D.hz;
      bars = [];
      for (var i = 0; i < n; i++){
        var a = 0, s = Math.floor(i * per * hz), e = Math.max(s + 1, Math.floor((i + 1) * per * hz));
        for (var j = s; j < e; j++){ var v = B36.indexOf(C.env.charAt(j)); if (v > a) a = v; }
        bars.push([a / 35, whoAt((i + .5) * per), (i + 1) * per]);
      }
    };
    var COL = { on: ['rgba(244,244,245,.32)', '#FFE600', 'rgba(244,244,245,.92)'], off: ['rgba(244,244,245,.12)', 'rgba(255,230,0,.30)', 'rgba(244,244,245,.28)'] };
    var draw = function(t){
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bars.length; i++){
        var b = bars[i], h = Math.max(2, Math.round(b[0] * H * .92)), x = i * STEP;
        ctx.fillStyle = (b[2] - C.len / bars.length / 2 <= t ? COL.on : COL.off)[b[1]];
        ctx.fillRect(x, Math.round((H - h) / 2), BW, h);
      }
      if (t > 0){ ctx.fillStyle = 'rgba(244,244,245,.9)'; ctx.fillRect(Math.min(W - 1, Math.round(t / C.len * bars.length * STEP)), 0, 1, H); }
    };
    var size = function(){
      var r = el.canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      el.canvas.width = W * d; el.canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      measure(); draw(now());
    };

    /* ---------- the transcript, built once per call ---------- */
    var build = function(){
      var h = [], at = [];
      L = []; E = []; T = {};
      C.lines.forEach(function(l, i){
        var name = l.who === 'agent' ? 'AI assistant' : C.caller;
        h.push('<li class="vp-l ' + (l.who === 'agent' ? 'is-a' : 'is-c') + '" data-l="' + i + '"><p class="vp-l-h"><b>' + esc(name) + '</b><span>' + mss(l.t) + '</span></p><p class="vp-l-t">' +
          l.text.split(' ').map(function(w){ return '<span>' + esc(w) + '</span>'; }).join(' ') + '</p></li>');
        l.acts.map(function(a){ return { a: a, t: l.t + a[0] * l.d + (a[0] ? 0 : .25) }; }).sort(function(x, y){ return x.t - y.t; }).forEach(function(x){
          h.push('<li class="vp-e k-' + x.a[2] + '" data-e="' + E.length + '"><i>' + icon(x.a[2]) + '</i><span>' + esc(fill(x.a[1])) + '</span><time>' + mss(x.t) + '</time></li>');
          E.push({ t: x.t }); if (x.a[3] && T[x.a[3]] == null) T[x.a[3]] = x.t;
        });
      });
      el.lines.innerHTML = h.join('');
      Array.prototype.forEach.call(el.lines.querySelectorAll('[data-l]'), function(n, i){ L.push({ el: n, sp: n.querySelector('.vp-l-t').children, l: C.lines[i] }); });
      Array.prototype.forEach.call(el.lines.querySelectorAll('[data-e]'), function(n, i){ E[i].el = n; });
      var last = C.lines[C.lines.length - 1];
      T.res = Math.min(C.len - .05, last.t + last.d + .15);
      el.roll.scrollTop = 0;
      cur = -2; lit = -1; evN = -1; shown = {}; label = '';
      ['diary', 'sms', 'res'].forEach(function(k){ card(k, false); });
    };
    var card = function(k, on, fresh){
      if (shown[k] === on) return; shown[k] = on;
      var box = el[k], f = box.querySelector('.vp-fill'), r = C.result;
      box.classList.toggle('is-on', on);
      if (!on) f.innerHTML = '<p class="vp-wait">' + (k === 'diary' ? 'Nothing booked yet' : k === 'sms' ? 'Nothing sent yet' : 'Shows when the call ends') + '</p>';
      else if (k === 'diary') f.innerHTML = '<div class="vp-ev" style="--b:' + C.c + '"><b>' + esc(fill(r.card.t)) + '</b><span>' + esc(r.card.s) + '</span><small>' + esc(fill(r.card.m)) + '</small></div>';
      else if (k === 'sms') f.innerHTML = '<p class="vp-bub">' + esc(fill(r.sms)) + '</p><p class="vp-sent">To ' + esc(C.from) + ' · sent during the call</p>';
      else {
        var nx = D.calls[(ci + 1) % D.calls.length];
        f.innerHTML = '<p class="vp-res-h">' + esc(fill(r.h)) + '</p><dl class="vp-stats">' + r.stats.map(function(s){ return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>' +
          '<button type="button" class="vp-next" data-vp-next>Next call: ' + esc(nx.caller) + ', ' + esc(nx.biz) + ' <span aria-hidden="true">→</span></button>';
      }
      if (k === 'diary') el.diaryK.textContent = on ? r.card.k : 'Diary';
      if (on && fresh) pop(f);
    };

    /* ---------- one moment of the call: what is lit, what is filled in ---------- */
    var follow = function(n){
      if (!n || performance.now() - userAt < 3500) return;
      var top = n.offsetTop - el.roll.clientHeight * .28;
      if (el.roll.scrollTo) el.roll.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); else el.roll.scrollTop = top;
    };
    var setLabel = function(s){ if (s !== label){ label = s; el.state.textContent = s; } };
    var update = function(t, fresh){
      el.now.textContent = mss(t);
      el.scrub.setAttribute('aria-valuenow', Math.round(t)); el.scrub.setAttribute('aria-valuetext', mss(t) + ' of ' + mss(C.len));
      var k = -1, i;
      for (i = 0; i < L.length; i++) if (L[i].l.t <= t + .02) k = i;
      if (k !== cur){
        for (i = 0; i < L.length; i++) L[i].el.classList.toggle('is-past', i < k), L[i].el.classList.toggle('is-now', i === k);
        cur = k; lit = -1; if (k >= 0 && (playing || fresh)) follow(L[k].el);
      }
      if (k >= 0){
        var x = L[k], n = 0;
        if (t >= x.l.t + x.l.d) n = x.sp.length; else for (i = 0; i < x.l.w.length; i++) if (x.l.w[i] <= t - x.l.t) n = i + 1;
        if (n !== lit){ for (i = 0; i < x.sp.length; i++) x.sp[i].className = i < n ? 'on' : ''; lit = n; }
      }
      var m = 0; for (i = 0; i < E.length; i++) if (E[i].t <= t) m = i + 1;
      if (m !== evN){
        for (i = 0; i < E.length; i++) E[i].el.classList.toggle('is-on', i < m);
        if (fresh && m === evN + 1 && m > 0) pop(E[m - 1].el.firstChild, 0);
        evN = m;
      }
      card('diary', T.diary != null && t >= T.diary, fresh);
      card('sms', T.sms != null && t >= T.sms, fresh);
      card('res', done || t >= T.res, fresh);
      setLabel(done ? 'Call ended · ' + mss(C.len) : !playing && t <= 0 ? (silent ? 'No sound here, so the call plays as text' : 'Press play to listen') :
        t < C.ring[1] ? 'Ringing' : playing ? (silent ? 'Playing as text, no sound' : 'Playing') : 'Paused');
    };

    /* ---------- playing ---------- */
    var setGo = function(){
      el.go.classList.toggle('is-on', playing);
      el.go.setAttribute('aria-label', playing ? 'Pause the call' : done ? 'Play the call again' : 'Play the call');
    };
    var frame = function(){
      if (!playing) return;
      var t = now();
      if (!silent && clk.run && !audio.paused && Math.abs(audio.currentTime - t) > .15){ run(audio.currentTime); t = clk.base; }
      if (t >= C.len){ finish(); return; }
      update(t, true); draw(t);
      raf = requestAnimationFrame(frame);
    };
    var goSilent = function(){
      if (silent) return; silent = true; clearTimeout(slow);
      var t = audio.paused ? clk.base : audio.currentTime || clk.base; audio.pause();
      if (playing) run(t);
    };
    var finish = function(){
      playing = false; done = true; cancelAnimationFrame(raf); clearTimeout(slow); audio.pause(); clk.base = C.len; clk.run = false;
      setGo(); update(C.len, true); draw(C.len);
    };
    var toggle = function(){
      if (!C) return;
      if (playing){
        playing = false; cancelAnimationFrame(raf); clearTimeout(slow);
        if (silent) freeze(); else { audio.pause(); clk.base = audio.currentTime || now(); clk.run = false; }
        setGo(); update(now()); return;
      }
      players.forEach(function(p){ if (p !== me) p.pause(); });
      if (done || now() >= C.len - .05){ done = false; clk.base = 0; card('res', false); }
      playing = true; setGo();
      if (silent){ run(); }
      else {
        audio.muted = muted; audio.playbackRate = RATES[ri];
        if (Math.abs(audio.currentTime - clk.base) > .05) try { audio.currentTime = clk.base; } catch (e) {}
        clearTimeout(slow); slow = setTimeout(goSilent, 9000);
        var pr = audio.play(); if (pr && pr.catch) pr.catch(function(e){ if (e && e.name === 'AbortError') return; goSilent(); });
      }
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    };
    audio.addEventListener('playing', function(){ clearTimeout(slow); if (playing && !silent) run(audio.currentTime); });
    audio.addEventListener('waiting', function(){ if (!silent) freeze(); });
    audio.addEventListener('ended', function(){ if (!silent && playing) finish(); });
    audio.addEventListener('error', function(){ if (playing) goSilent(); });

    var seek = function(t){
      if (!C) return;
      t = Math.max(0, Math.min(C.len - .05, t));
      if (done){ done = false; card('res', false); }
      clk.base = t; if (playing) run(t);
      if (!silent && audio.src) try { audio.currentTime = t; } catch (e) {}
      userAt = -1e9; cur = -2; update(t, playing); draw(t);
      if (!playing && L.length){ var k = -1; for (var i = 0; i < L.length; i++) if (L[i].l.t <= t + .02) k = i; follow(L[Math.max(0, k)].el); }
    };

    /* ---------- picking a call ---------- */
    var select = function(i){
      if (playing){ playing = false; cancelAnimationFrame(raf); clearTimeout(slow); audio.pause(); }
      ci = i; C = D.calls[i]; done = false; clk.base = 0; clk.run = false;
      Array.prototype.forEach.call(tabs, function(t, k){ t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
      el.panel.setAttribute('aria-labelledby', tabs[i].id);
      el.av.textContent = C.initial; el.av.style.background = C.c; el.av.style.color = C.ink;
      el.caller.textContent = C.caller; el.from.textContent = C.from; el.biz.textContent = C.biz; el.place.textContent = C.place; el.clock.textContent = C.clock;
      el.out.textContent = C.outcome; el.key.textContent = C.caller; el.len.textContent = mss(C.len); el.scene.textContent = C.scene;
      el.scrub.setAttribute('aria-valuemax', Math.round(C.len));
      audio.src = base + C.src; audio.preload = 'none';
      build(); measure(); setGo(); update(0); draw(0);
    };

    /* ---------- controls ---------- */
    el.go.addEventListener('click', function(){ if (D) toggle(); else load().then(function(){ select(ci); toggle(); }); });
    var warm = function(){ if (audio.preload !== 'auto') audio.preload = 'auto'; };
    el.go.addEventListener('pointerenter', warm); el.go.addEventListener('focus', warm); el.go.addEventListener('touchstart', warm, { passive: true });
    el.mute.addEventListener('click', function(){
      muted = !muted; audio.muted = muted; el.mute.setAttribute('aria-pressed', muted ? 'true' : 'false'); el.mute.setAttribute('aria-label', muted ? 'Turn the sound on' : 'Turn the sound off');
    });
    el.rate.addEventListener('click', function(){
      var t = now(); ri = (ri + 1) % RATES.length; audio.playbackRate = RATES[ri]; if (clk.run) run(t);
      el.rate.textContent = RATES[ri] + '×'; el.rate.setAttribute('aria-label', 'Playback speed, now ' + (ri ? RATES[ri] + ' times' : 'normal'));
    });
    var drag = false;
    var at = function(e){ var r = el.scrub.getBoundingClientRect(); return (e.clientX - r.left) / Math.max(1, bars.length * STEP) * C.len; };
    el.scrub.addEventListener('pointerdown', function(e){ if (!C) return; drag = true; if (el.scrub.setPointerCapture) el.scrub.setPointerCapture(e.pointerId); seek(at(e)); });
    el.scrub.addEventListener('pointermove', function(e){ if (drag) seek(at(e)); });
    el.scrub.addEventListener('pointerup', function(){ drag = false; });
    el.scrub.addEventListener('pointercancel', function(){ drag = false; });
    el.scrub.addEventListener('keydown', function(e){
      if (!C) return;
      var d = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 15, PageDown: -15 }[e.key];
      if (d) { e.preventDefault(); seek(now() + d); }
      else if (e.key === 'Home'){ e.preventDefault(); seek(0); }
      else if (e.key === 'End'){ e.preventDefault(); seek(C.len); }
      else if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); toggle(); }
    });
    el.lines.addEventListener('click', function(e){
      var n = e.target.closest('[data-l],[data-e]'); if (!n || !C) return;
      seek(n.hasAttribute('data-l') ? C.lines[+n.getAttribute('data-l')].t - .05 : E[+n.getAttribute('data-e')].t - 1.2);
      if (!playing) toggle();
    });
    ['wheel', 'touchstart', 'keydown'].forEach(function(t){ el.roll.addEventListener(t, function(){ userAt = performance.now(); }, { passive: true }); });
    el.res.addEventListener('click', function(e){
      if (!e.target.closest('[data-vp-next]')) return;
      select((ci + 1) % D.calls.length); tabs[ci].focus({ preventScroll: true }); toggle();
    });
    Array.prototype.forEach.call(tabs, function(t, i){
      t.addEventListener('click', function(){ load().then(function(){ if (i !== ci || !C) select(i); }); });
      t.addEventListener('keydown', function(e){
        var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!d) return;
        var n = (i + d + tabs.length) % tabs.length; e.preventDefault(); tabs[n].focus(); load().then(function(){ select(n); });
      });
    });
    window.addEventListener('resize', size);
    if (window.ResizeObserver) new ResizeObserver(size).observe(el.canvas);

    /* fetch the calls once the player is near the screen, so the transcript is there before anyone presses play */
    var ready = function(){ load().then(function(){ if (!C) { select(ci); size(); } }).catch(function(){ setLabel('The calls did not load. Check your connection and refresh.'); }); };
    if (window.IntersectionObserver){
      var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); ready(); } }, { rootMargin: '800px' });
      io.observe(root);
    } else ready();
  });
})();
