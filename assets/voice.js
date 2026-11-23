/* The voice agent player. A recorded example call plays line by line: the waveform is drawn from the real loudness
   of the recording, the words light up as they are said, each thing the assistant checks or books appears at the
   moment it happens, and the visitor answers one question as the caller. If sound cannot play, the same call runs
   on a clock with captions only. One <audio> element is reused for every part, so phones keep it unlocked. */
(function(){
  'use strict';
  var roots = document.querySelectorAll('[data-vc]');
  if (!roots.length) return;
  var ICON = {
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', done: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    look: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    note: '<path d="M5 19l1-4L16.5 4.5l3 3L9 18z"/>',
    rule: '<path d="M12 3.5l7 2.5v5.5c0 4-2.8 7.2-7 9-4.2-1.8-7-5-7-9V6z"/>',
    stop: '<circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/>'
  };
  var icon = function(k){ return '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (ICON[k] || ICON.ok) + '</svg>'; };
  var esc = function(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var tomorrow = new Date(Date.now() + 864e5);
  var day = function(o){ return tomorrow.toLocaleDateString('en-GB', o).replace(/,/g, ''); };
  var TOM = day({ weekday: 'short', day: 'numeric', month: 'short' }), TOML = day({ weekday: 'long', day: 'numeric', month: 'long' });
  var fill = function(s){ return String(s).replace(/\{tomLong\}/g, TOML).replace(/\{tom\}/g, TOM); };
  var mmss = function(s){ s = Math.max(0, Math.floor(s)); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); };
  var B36 = '0123456789abcdefghijklmnopqrstuvwxyz';

  Array.prototype.forEach.call(roots, function(root){
    var q = function(n){ return root.querySelector('[data-vc-' + n + ']'); };
    var el = { phone: root.querySelector('.vc-phone'), clock: q('clock'), state: q('state'), timer: q('timer'), av: q('av'), biz: q('biz'), place: q('place'),
      wave: q('wave'), who: q('who'), line: q('line'), act: q('act'), ask: q('ask'), q: q('q'), opts: q('opts'), count: q('count'),
      end: q('end'), endH: q('end-h'), next: q('next'), other: q('other'), go: q('go'), goT: q('go-t'), live: q('live'), pause: q('pause'), mute: q('mute'), again: q('again'), hint: q('hint'),
      roll: q('roll'), feed: q('feed'), empty: q('empty'), res: q('res') };
    var tabs = root.querySelectorAll('[role="tab"]');
    var base = root.getAttribute('data-base');
    var D = null, loading = null, ci = 0, C = null, part = null, pi = -1;
    var phase = 'idle', silent = false, muted = false, paused = false;
    var audio = new Audio(); audio.preload = 'auto';
    var clk = { base: 0, at: 0, run: false }, ev = [], fired = 0, cur = null, grp = -1, said = -1, talked = 0;
    var hist = [], histN = 0, raf = 0, slow = 0, auto = 0, blobs = {}, tick = null, pre = null;
    var HZ = 20, BW = 3, STEP = 6;

    var load = function(){
      if (!loading) loading = fetch(root.getAttribute('data-src')).then(function(r){ return r.json(); }).then(function(d){ D = d; C = D.calls[ci]; return d; });
      return loading;
    };
    var now = function(){ return clk.run ? clk.base + (performance.now() - clk.at) / 1000 : clk.base; };
    var freeze = function(){ clk.base = now(); clk.run = false; };
    var run = function(from){ if (from != null) clk.base = from; clk.at = performance.now(); clk.run = true; };

    /* ---------- the waveform: a rolling history of what has been said, newest at the right ---------- */
    var ctx = el.wave.getContext('2d'), W = 0, H = 0;
    var size = function(){
      var r = el.wave.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      el.wave.width = W * d; el.wave.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); draw();
    };
    var whoAt = function(t){
      for (var i = 0; i < part.lines.length; i++){ var l = part.lines[i]; if (t >= l.t - .05 && t <= l.t + l.d + .05) return l.who === 'agent' ? 1 : 2; }
      return 0;
    };
    var sample = function(t){
      /* fill the history up to time t of the current part */
      var upto = Math.floor(t * HZ), per = D.hz / HZ;
      while (histN < upto){
        var a = 0, s = histN * per;
        for (var j = 0; j < per; j++) a = Math.max(a, B36.indexOf(part.env.charAt(s + j)));
        hist.push([Math.max(0, a) / 35, whoAt((histN + .5) / HZ)]);
        histN++;
      }
      if (hist.length > 400) hist.splice(0, hist.length - 400);
    };
    var bar = function(x, h, col){
      ctx.fillStyle = col; var y = (H - h) / 2;
      if (ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x, y, BW, h, 1.5); ctx.fill(); } else ctx.fillRect(x, y, BW, h);
    };
    var COL = ['rgba(255,255,255,.30)', '#FFE600', 'rgba(255,255,255,.66)'];
    var draw = function(){
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      var frac = part && phase === 'live' ? (now() * HZ) % 1 : 0, x = W - BW - frac * STEP, i = hist.length - 1;
      for (; x > -STEP; x -= STEP, i--){
        if (i >= 0){ var v = hist[i]; bar(x, Math.max(3, v[0] * H * .94), COL[v[1]]); }
        else bar(x, 3, 'rgba(255,255,255,.16)');
      }
    };

    /* ---------- the words on the call screen ---------- */
    var groups = function(l){
      if (l.g) return l.g;
      var ws = l.text.split(' '), g = [], c = [];
      ws.forEach(function(w, i){ c.push(i); if (/[.?!]$/.test(w) || i === ws.length - 1){ g.push(c); c = []; } });
      /* a very short sentence rides with the next one, so the caption does not flicker */
      for (var i = 0; i < g.length - 1; i++) if (g[i].length < 4){ g[i + 1] = g[i].concat(g[i + 1]); g.splice(i, 1); i--; }
      l.ws = ws; l.g = g; return g;
    };
    var caption = function(l, t){
      var g = groups(l), n = 0;
      for (var i = 0; i < l.w.length; i++) if (l.w[i] <= t - l.t) n = i + 1;
      var gi = 0; for (i = 0; i < g.length; i++) if (g[i][0] < Math.max(1, n)) gi = i;
      if (cur !== l){
        cur = l; grp = -1; said = -1;
        el.who.className = 'vc-who ' + (l.who === 'agent' ? 'is-agent' : 'is-caller');
        el.who.lastElementChild.textContent = l.who === 'agent' ? 'AI assistant' : C.caller + ', the caller';
      }
      if (grp !== gi){ grp = gi; said = -1; el.line.innerHTML = g[gi].map(function(k){ return '<span>' + esc(l.ws[k]) + '</span>'; }).join(' '); }
      var on = Math.max(0, Math.min(g[gi].length, n - g[gi][0]));
      if (on !== said){ said = on; var sp = el.line.children; for (i = 0; i < sp.length; i++) sp[i].className = i < on ? 'on' : ''; }
    };
    var note = function(who, text, cls){ cur = null; el.who.className = 'vc-who ' + (cls || ''); el.who.lastElementChild.textContent = who; el.line.textContent = text; };

    /* ---------- the feed beside it ---------- */
    var follow = function(){ if (el.roll.scrollHeight > el.roll.clientHeight + 4) el.roll.scrollTop = el.roll.scrollHeight; };
    var say = function(l, at, quiet){
      var li = document.createElement('li'); li.className = 'vc-m ' + (l.who === 'agent' ? 'is-agent' : 'is-caller') + (quiet ? '' : ' in');
      li.innerHTML = '<span>' + (l.who === 'agent' ? 'AI assistant' : esc(C.caller)) + ' · ' + mmss(at) + '</span><p>' + esc(l.text) + '</p>';
      el.feed.appendChild(li);
    };
    var did = function(a, quiet){
      var li = document.createElement('li'); li.className = 'vc-a k-' + a[2] + (quiet ? '' : ' in');
      li.innerHTML = '<i>' + icon(a[2]) + '</i><span>' + esc(fill(a[1])) + '</span>';
      el.feed.appendChild(li);
      if (!quiet){ el.act.className = 'vc-act'; el.act.innerHTML = '<i>' + icon(a[2]) + '</i><span>' + esc(fill(a[1])) + '</span>'; void el.act.offsetWidth; el.act.className = 'vc-act in'; }
    };
    var cues = function(p){
      var out = [];
      p.lines.forEach(function(l){
        out.push({ t: l.t, line: l });
        l.acts.forEach(function(a){ out.push({ t: l.t + a[0] * l.d + (a[0] ? 0 : .25), act: a }); });
      });
      return out.sort(function(a, b){ return a.t - b.t; });
    };
    var result = function(r){
      el.res.innerHTML = '<h4>' + esc(r.h) + '</h4><dl class="vc-stats">' + r.stats.map(function(s){ return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>' +
        '<div class="vc-two"><div class="vc-card" style="--b:' + C.c + '"><span>' + esc(r.card.k) + '</span><b>' + esc(fill(r.card.t)) + '</b><p>' + esc(r.card.s) + '</p><small>' + esc(fill(r.card.m)) + '</small></div>' +
        '<div class="vc-sms"><span>Text message · sent during the call</span><p>' + esc(fill(r.sms)) + '</p></div></div>';
      el.res.hidden = false;
    };

    /* ---------- states ---------- */
    var set = function(p, label){ phase = p; el.phone.setAttribute('data-phase', p); if (label) el.state.textContent = label; };
    var stop = function(){ cancelAnimationFrame(raf); clearTimeout(slow); clearTimeout(auto); audio.pause(); freeze(); };
    var idle = function(i){
      stop(); ci = i; if (D) C = D.calls[i];
      Array.prototype.forEach.call(tabs, function(t, k){ t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
      part = null; pi = -1; hist = []; histN = 0; paused = false; talked = 0; clk.base = 0;
      el.feed.innerHTML = ''; el.res.hidden = true; el.res.innerHTML = ''; el.empty.hidden = false; el.roll.scrollTop = 0;
      el.ask.hidden = true; el.end.hidden = true; el.act.className = 'vc-act'; el.act.innerHTML = ''; el.live.hidden = true; el.go.hidden = false; el.hint.hidden = false;
      el.hint.textContent = silent ? 'No sound here, so the call plays as captions.' : 'Sound on. You answer one question as the caller.';
      el.pause.setAttribute('aria-pressed', 'false'); el.timer.textContent = '00:00';
      set('idle', 'Not started');
      if (C){
        el.clock.textContent = C.clock; el.av.textContent = C.initial; el.av.style.background = C.c; el.av.style.color = C.ink; el.biz.textContent = C.biz; el.place.textContent = C.place;
        el.goT.textContent = 'Ring ' + C.biz; note('Before the call', C.scene);
      }
      draw();
    };
    var goSilent = function(){
      if (silent) return; silent = true; clearTimeout(slow); audio.pause();
      el.hint.hidden = false; el.hint.textContent = 'No sound here, so the call plays as captions.';
      if (phase === 'live' && !paused) run();
    };
    var play = function(p){
      part = p; ev = cues(p); fired = 0; histN = 0; cur = null; clk.base = 0; clk.run = false; paused = false;
      el.pause.setAttribute('aria-pressed', 'false'); el.pause.disabled = false;
      set('live', p.ring ? 'Ringing' : 'On the call');
      if (p.ring) note('Ringing', 'Calling ' + C.biz + '.');
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      if (silent){ run(0); return; }
      audio.muted = muted; audio.src = blobs[p.src] || base + p.src;
      clearTimeout(slow); slow = setTimeout(goSilent, 8000);
      var pr = audio.play(); if (pr && pr.catch) pr.catch(function(e){ if (e && e.name === 'AbortError') return; goSilent(); });
    };
    audio.addEventListener('playing', function(){ clearTimeout(slow); if (phase === 'live' && !paused) run(audio.currentTime); });
    audio.addEventListener('waiting', function(){ if (!silent) freeze(); });
    audio.addEventListener('pause', function(){ if (!silent) freeze(); });
    audio.addEventListener('ended', function(){ if (!silent && phase === 'live'){ clk.base = part.len; clk.run = false; } });
    audio.addEventListener('error', function(){ if (phase === 'live') goSilent(); });

    var frame = function(){
      if (phase !== 'live') return;
      var t = now();
      if (!silent && clk.run && !audio.paused && Math.abs(audio.currentTime - t) > .14){ run(audio.currentTime); t = clk.base; }
      while (fired < ev.length && ev[fired].t <= t){
        var e = ev[fired++];
        if (e.line){ if (el.empty.hidden === false) el.empty.hidden = true; say(e.line, talked + Math.max(0, e.line.t - (part.ring ? part.lines[0].t : 0))); }
        else did(e.act);
        follow();
      }
      var first = part.lines[0].t;
      if (part.ring && t < first - .2) el.state.textContent = 'Ringing';
      else {
        el.state.textContent = 'On the call';
        var l = null; for (var i = 0; i < part.lines.length; i++) if (part.lines[i].t <= t) l = part.lines[i];
        if (l) caption(l, t);
      }
      el.timer.textContent = mmss(talked + Math.max(0, t - (part.ring ? first : 0)));
      sample(Math.min(t, part.len)); draw();
      if (t >= part.len - .02) return finish();
      raf = requestAnimationFrame(frame);
    };
    var warm = function(){
      C.paths.forEach(function(p){
        if (blobs[p.src] || !window.URL || !URL.createObjectURL) return;
        fetch(base + p.src).then(function(r){ return r.ok ? r.blob() : null; }).then(function(b){ if (b) blobs[p.src] = URL.createObjectURL(b); }).catch(function(){});
      });
    };
    var finish = function(){
      audio.pause(); freeze(); draw();
      if (pi < 0){
        talked = part.len - part.lines[0].t;
        set('ask', 'Your turn');
        el.q.textContent = C.ask;
        el.opts.innerHTML = C.paths.map(function(p, i){ return '<button type="button" class="btn btn-glass" data-i="' + i + '">' + esc(p.label) + '</button>'; }).join('');
        el.act.className = 'vc-act'; el.ask.hidden = false; el.pause.disabled = true;
        if (tick) tick.cancel(); tick = el.count.animate ? el.count.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 12000, fill: 'forwards' }) : null;
        clearTimeout(auto); auto = setTimeout(function(){ pick(0); }, 12000);
      } else {
        var r = C.paths[pi].result, nx = D.calls[(ci + 1) % D.calls.length];
        set('done', 'Call ended');
        note('Call ended', r.h + '.', 'is-end');
        el.act.className = 'vc-act'; el.pause.disabled = true;
        result(r); follow();
        el.next.textContent = 'Next call: ' + nx.biz; el.other.textContent = 'Try the other answer';
        el.end.hidden = false;
      }
    };
    var pick = function(i){
      clearTimeout(auto); el.ask.hidden = true; pi = i; play(C.paths[i]);
    };
    var start = function(){
      el.go.hidden = true; el.live.hidden = false; el.hint.hidden = !silent; set('live', 'Connecting');
      load().then(function(){ el.empty.hidden = true; warm(); play(C.open); }).catch(function(){ el.go.hidden = false; el.live.hidden = true; el.hint.hidden = false; el.hint.textContent = 'The call did not load. Check your connection and try again.'; set('idle', 'Not started'); });
    };

    /* ---------- controls ---------- */
    el.go.addEventListener('click', start);
    el.opts.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) pick(+b.getAttribute('data-i')); });
    el.pause.addEventListener('click', function(){
      if (phase !== 'live') return;
      paused = !paused; el.pause.setAttribute('aria-pressed', paused ? 'true' : 'false'); el.pause.setAttribute('aria-label', paused ? 'Carry on with the call' : 'Pause the call');
      if (paused){ if (silent) freeze(); else audio.pause(); el.state.textContent = 'Paused'; cancelAnimationFrame(raf); }
      else { if (silent) run(); else { var pr = audio.play(); if (pr && pr.catch) pr.catch(goSilent); } raf = requestAnimationFrame(frame); }
    });
    el.mute.addEventListener('click', function(){
      muted = !muted; audio.muted = muted; el.mute.setAttribute('aria-pressed', muted ? 'true' : 'false'); el.mute.setAttribute('aria-label', muted ? 'Turn the sound on' : 'Turn the sound off');
    });
    el.again.addEventListener('click', function(){ idle(ci); start(); });
    el.next.addEventListener('click', function(){ idle((ci + 1) % D.calls.length); start(); });
    el.other.addEventListener('click', function(){
      var o = pi ? 0 : 1; el.end.hidden = true; el.res.hidden = true; el.feed.innerHTML = '';
      cues(C.open).forEach(function(e){ if (e.line) say(e.line, Math.max(0, e.line.t - C.open.lines[0].t), true); else did(e.act, true); });
      pick(o); follow();
    });
    Array.prototype.forEach.call(tabs, function(t, i){
      t.addEventListener('click', function(){ if (i !== ci || phase !== 'idle') load().then(function(){ idle(i); }); });
      t.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        var n = (i + d + tabs.length) % tabs.length; e.preventDefault(); tabs[n].focus(); load().then(function(){ idle(n); });
      });
    });
    window.addEventListener('resize', size);
    if (window.ResizeObserver) new ResizeObserver(size).observe(el.wave);
    size();
    /* fetch the words once the player is near the screen, so the first press starts at once */
    if (window.IntersectionObserver){
      var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); load().then(function(){ pre = new Audio(); pre.preload = 'auto'; pre.src = base + D.calls[0].open.src; }).catch(function(){}); } }, { rootMargin: '600px' });
      io.observe(root);
    } else load().catch(function(){});
  });
})();
