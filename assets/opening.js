/* ============================================================
   The opening: one film, played by scroll.
   The film is a short MP4 with a keyframe every few frames (assets/film/town-d for wide screens, town-m for tall
   ones; an AV1 copy of each for browsers without H.264), fetched whole so nothing waits on the network.
   Scroll sets the frame and the film eases towards it, so it glides rather than jumps; the wheel is never taken over.

   How frames reach the screen, best first:
   1. The browser's own video decoder (WebCodecs): the page reads the MP4 itself, decodes a keyframe run at a time
      and draws exact frames to a canvas. No video player is involved, so autoplay rules, Low Power Mode and in-app
      browsers cannot stop it.
   2. Where that is missing, a muted <video> whose time is set by scroll (started once so iPhones paint its frames).
   3. Neither: the first frame (the poster) stays, and the lines still type over it.

   The lines type in, each owning an equal share of the film. The film ends on the one house still lit; then the page
   fades to white and the headline comes up.
   Reduce Motion or Data Saver: nothing here runs and the still version stays.
   ============================================================ */
(function(){
  var d = document, root = d.getElementById('top');
  if (!root || !root.classList.contains('op')) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SAVE = navigator.connection && navigator.connection.saveData;
  var video = root.querySelector('.op-film');
  var base = root.getAttribute('data-film') || '', FPS = +root.getAttribute('data-fps') || 24;
  if (RM || SAVE || !video || !base || !window.fetch || !window.Promise) return;

  var FILM = .9;                                /* share of the scroll the film itself takes; the fade and the headline take the rest */
  var HOLD = 40;                                /* decoded frames held at once (about 190MB of bitmaps); the rest are decoded again when needed */
  var CODEC = { '.mp4': 'avc1.640032', '-av1.mp4': 'av01.0.08M.08' };
  var stick = root.querySelector('.op-stick'), head = d.querySelector('.site-head');
  var lines = [].slice.call(root.querySelectorAll('.op-line'));
  var white = root.querySelector('.op-white'), end = root.querySelector('.op-end');
  var clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; };
  var span = function(p, a, b){ return clamp((p - a) / (b - a), 0, 1); };

  root.classList.add('is-film');

  /* ---------- reading the MP4: where each frame's bytes are, when it plays, which frames are keyframes ---------- */
  function readMp4(buf){
    var dv = new DataView(buf), u8 = new Uint8Array(buf);
    var str = function(p){ return String.fromCharCode(u8[p], u8[p + 1], u8[p + 2], u8[p + 3]); };
    function each(s, e, cb){
      for (var p = s; p + 8 <= e;){
        var size = dv.getUint32(p), h = 8;
        if (size === 1){ size = dv.getUint32(p + 8) * 4294967296 + dv.getUint32(p + 12); h = 16; }
        else if (size === 0) size = e - p;
        if (size < h) break;
        if (cb(str(p + 4), p + h, p + size) === false) break;
        p += size;
      }
    }
    function find(s, e, path){
      var hit = null;
      each(s, e, function(t, a, b){ if (t !== path[0]) return; hit = path.length > 1 ? find(a, b, path.slice(1)) : [a, b]; if (hit) return false; });
      return hit;
    }
    var moov = find(0, buf.byteLength, ['moov']), trak = null;
    if (!moov) throw new Error('no moov');
    each(moov[0], moov[1], function(t, a, b){
      if (t !== 'trak') return;
      var h = find(a, b, ['mdia', 'hdlr']);
      if (h && str(h[0] + 8) === 'vide'){ trak = [a, b]; return false; }
    });
    if (!trak) throw new Error('no video track');
    var mdhd = find(trak[0], trak[1], ['mdia', 'mdhd']), scale = dv.getUint32(mdhd[0] + (u8[mdhd[0]] === 1 ? 20 : 12));
    var stbl = find(trak[0], trak[1], ['mdia', 'minf', 'stbl']), box = function(n){ return find(stbl[0], stbl[1], [n]); };
    var stsd = box('stsd'), en = stsd[0] + 8, enEnd = en + dv.getUint32(en), kind = str(en + 4);
    var out = { width: dv.getUint16(en + 32), height: dv.getUint16(en + 34) };
    each(en + 8 + 78, enEnd, function(t, a, b){
      if (t === 'avcC'){
        out.description = u8.slice(a, b);
        out.codec = kind + '.' + [u8[a + 1], u8[a + 2], u8[a + 3]].map(function(x){ return (x < 16 ? '0' : '') + x.toString(16); }).join('');
      } else if (t === 'av1C'){
        out.description = u8.slice(a, b);
        var lvl = u8[a + 1] & 31, hi = (u8[a + 2] >> 6) & 1;
        out.codec = 'av01.' + (u8[a + 1] >> 5) + '.' + (lvl < 10 ? '0' : '') + lvl + (u8[a + 2] >> 7 ? 'H' : 'M') + '.' + (hi ? ((u8[a + 2] >> 5) & 1 ? '12' : '10') : '08');
      }
    });
    if (!out.codec) throw new Error('codec ' + kind);
    var stsz = box('stsz'), fixed = dv.getUint32(stsz[0] + 4), n = dv.getUint32(stsz[0] + 8), S = [], i, j, k, ne, cnt;
    for (i = 0; i < n; i++) S.push({ size: fixed || dv.getUint32(stsz[0] + 12 + i * 4), key: false });
    var co = box('stco'), wide = !co; if (wide) co = box('co64');
    var nc = dv.getUint32(co[0] + 4), chunks = [];
    for (i = 0; i < nc; i++) chunks.push(wide ? dv.getUint32(co[0] + 8 + i * 8) * 4294967296 + dv.getUint32(co[0] + 12 + i * 8) : dv.getUint32(co[0] + 8 + i * 4));
    var stsc = box('stsc'), si = 0;
    for (k = 0, ne = dv.getUint32(stsc[0] + 4); k < ne; k++){
      var first = dv.getUint32(stsc[0] + 8 + k * 12) - 1, per = dv.getUint32(stsc[0] + 12 + k * 12);
      var last = k + 1 < ne ? dv.getUint32(stsc[0] + 20 + k * 12) - 1 : nc;
      for (var c = first; c < last; c++){ var off = chunks[c]; for (j = 0; j < per && si < n; j++){ S[si].off = off; off += S[si].size; si++; } }
    }
    var stts = box('stts'), t = 0; si = 0;
    for (k = 0, ne = dv.getUint32(stts[0] + 4); k < ne; k++){
      cnt = dv.getUint32(stts[0] + 8 + k * 8); var dl = dv.getUint32(stts[0] + 12 + k * 8);
      for (j = 0; j < cnt && si < n; j++){ S[si].pts = t; S[si].dur = dl; t += dl; si++; }
    }
    var ctts = box('ctts'); si = 0;
    if (ctts){
      var v1 = u8[ctts[0]] === 1;
      for (k = 0, ne = dv.getUint32(ctts[0] + 4); k < ne; k++){
        cnt = dv.getUint32(ctts[0] + 8 + k * 8); var o = v1 ? dv.getInt32(ctts[0] + 12 + k * 8) : dv.getUint32(ctts[0] + 12 + k * 8);
        for (j = 0; j < cnt && si < n; j++) S[si++].pts += o;
      }
    }
    var stss = box('stss'), gops = [];
    if (stss) for (k = 0, ne = dv.getUint32(stss[0] + 4); k < ne; k++) gops.push(dv.getUint32(stss[0] + 8 + k * 4) - 1);
    else for (k = 0; k < n; k++) gops.push(k);
    gops.forEach(function(i){ S[i].key = true; });
    var g = -1;
    S.forEach(function(s){ if (s.key) g++; s.gop = Math.max(0, g); s.us = Math.round(s.pts * 1e6 / scale); s.dur = Math.round(s.dur * 1e6 / scale); });
    out.samples = S; out.gops = gops;
    out.frames = S.slice().sort(function(a, b){ return a.pts - b.pts; });
    out.byUs = {};
    out.frames.forEach(function(s, f){ s.frame = f; out.byUs[s.us] = s; });
    return out;
  }

  /* ---------- choosing a way to play it ---------- */
  var set = '', gen = 0, N = 0, ready = false, cur = 0, dir = 1, film = video;
  function pickSet(){ return innerWidth / innerHeight < .85 ? 'm' : 'd'; }
  function decoderTail(){
    var VD = window.VideoDecoder, tries = ['.mp4', '-av1.mp4'];
    if (!VD || !VD.isConfigSupported || !window.EncodedVideoChunk || !window.createImageBitmap) return Promise.resolve('');
    function next(i){
      if (i >= tries.length) return '';
      return VD.isConfigSupported({ codec: CODEC[tries[i]], codedWidth: 1440, codedHeight: 810 })
        .then(function(r){ return r && r.supported ? tries[i] : next(i + 1); }, function(){ return next(i + 1); });
    }
    return next(0);
  }
  function videoTail(){
    if (!video.canPlayType) return '';
    return video.canPlayType('video/mp4; codecs="avc1.640032"') || video.canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4'
      : video.canPlayType('video/mp4; codecs="av01.0.08M.08"') ? '-av1.mp4' : '';
  }
  function load(){
    var my = ++gen;
    stop();
    set = pickSet();
    decoderTail().then(function(t){
      if (my !== gen) return;
      var useWc = !!t; t = t || videoTail();
      if (!t) return;
      var src = base + set + t;
      fetch(src).then(function(r){ if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function(buf){
        if (my !== gen) return;
        if (useWc) startWc(buf, t, my); else startVideo(URL.createObjectURL(new Blob([buf], { type: 'video/mp4' })), src);
      }, function(){
        if (my === gen && !useWc) startVideo(src, src);
      });
    });
  }
  function stop(){
    ready = false; N = 0;
    root.classList.remove('is-ready');
    stopWc(); stopVideo();
  }
  function show(){ if (!ready){ ready = true; root.classList.add('is-ready'); } kick(); }

  /* ---------- 1. WebCodecs: decode a keyframe run, keep its frames as bitmaps, draw the one scroll asks for ---------- */
  var wc = null;
  function startWc(buf, t, my){
    var m, cv = d.createElement('canvas'), ctx, st;
    try { m = readMp4(buf); } catch(e){ return wcFallback(buf, t, my); }
    cv.className = 'op-film'; cv.setAttribute('aria-hidden', 'true');
    cv.width = m.width; cv.height = m.height;
    ctx = cv.getContext('2d');
    if (!ctx) return wcFallback(buf, t, my);
    st = { m: m, u8: new Uint8Array(buf), cv: cv, ctx: ctx, cache: {}, queue: [], job: null, drawn: -1, dead: false,
           keep: Math.max(3, Math.round(HOLD * m.gops.length / m.samples.length)) };
    try {
      st.dec = new VideoDecoder({
        output: function(fr){ wcFrame(st, fr); },
        error: function(){ if (!st.dead && wc === st){ stopWc(); wcFallback(buf, t, my); } }
      });
      st.dec.configure({ codec: m.codec, description: m.description, codedWidth: m.width, codedHeight: m.height, optimizeForLatency: true });
    } catch(e){ return wcFallback(buf, t, my); }
    wc = st; N = m.frames.length;
    film.parentNode.replaceChild(cv, film); film = cv;
    want(m.frames[clamp(Math.round(cur), 0, N - 1)].gop, true);
  }
  function wcFrame(st, fr){
    var job = st.job, s = st.m.byUs[fr.timestamp];
    if (st.dead || !job || !s){ fr.close(); return; }
    job.waits.push(keep(fr).then(function(b){ job.frames[s.frame] = b; }, function(){ job.bad = true; }).then(function(){ fr.close(); }));
  }
  /* a decoded frame is copied out so the decoder can reuse its memory: as a bitmap, or on a canvas where a
     browser cannot make bitmaps from video frames */
  function keep(fr){
    var copy = function(){ var c = d.createElement('canvas'); c.width = fr.displayWidth; c.height = fr.displayHeight; c.getContext('2d').drawImage(fr, 0, 0); return c; };
    try { return createImageBitmap(fr).catch(copy); } catch(e){ return Promise.resolve().then(copy); }
  }
  /* urgent: the run the screen needs now goes first and drops stale read-ahead; otherwise it joins the read-ahead */
  function want(g, urgent){
    var st = wc;
    if (!st || g < 0 || g >= st.m.gops.length || st.cache[g] || (st.job && st.job.g === g)) return;
    if (urgent){ if (st.queue[0] !== g) st.queue = [g]; }
    else if (st.queue.indexOf(g) < 0) st.queue.push(g);
    pump();
  }
  /* the runs worth holding: the one on screen, the next few in the direction of travel, and one behind for a change
     of mind. Read-ahead and eviction both use this list, so nothing is decoded only to be thrown away */
  function wanted(st){
    var here = st.m.frames[clamp(Math.round(cur), 0, N - 1)].gop, w = [here];
    for (var k = 1; k <= st.keep - 2; k++) w.push(here + k * dir);
    w.push(here - dir);
    return w;
  }
  function ahead(st){ wanted(st).slice(1).forEach(function(g){ want(g, false); }); }
  function pump(){
    var st = wc;
    if (!st || st.job || !st.queue.length) return;
    var g = st.queue.shift(), S = st.m.samples, a = st.m.gops[g], b = g + 1 < st.m.gops.length ? st.m.gops[g + 1] : S.length;
    if (st.cache[g]) return pump();
    var job = st.job = { g: g, frames: {}, waits: [] };
    try {
      for (var i = a; i < b; i++) st.dec.decode(new EncodedVideoChunk({ type: i === a ? 'key' : 'delta', timestamp: S[i].us, duration: S[i].dur, data: st.u8.subarray(S[i].off, S[i].off + S[i].size) }));
    } catch(e){ return wcBroken(st); }
    st.dec.flush().then(function(){ return Promise.all(job.waits); }).then(function(){
      if (st.dead){ drop(job.frames); return; }
      if (job.bad) return wcBroken(st);
      st.cache[g] = job.frames; st.job = null;
      evict(st);
      show();
      if (!st.queue.length) ahead(st); else pump();
    }, function(){ if (!st.dead) wcBroken(st); });
  }
  function drop(frames){ for (var f in frames){ var b = frames[f]; if (b && b.close) b.close(); else if (b) b.width = 0; } }
  function evict(st){
    var w = wanted(st), here = w[0], keys = Object.keys(st.cache).map(Number);
    var cost = function(g){ return (w.indexOf(g) < 0 ? 1000 : 0) + Math.abs(g - here); };
    keys.sort(function(a, b){ return cost(b) - cost(a); });
    while (keys.length > st.keep){ var g = keys.shift(); drop(st.cache[g]); delete st.cache[g]; }
  }
  /* the exact frame when its run is decoded; while it is still on its way, the nearest frame that is */
  function wcDraw(){
    var st = wc, f = clamp(Math.round(cur), 0, N - 1), g = st.m.frames[f].gop, run = st.cache[g], im = run && run[f], best = f;
    if (!run) want(g, true);
    if (!im){
      for (var r in st.cache) for (var k in st.cache[r]) if (!im || Math.abs(k - f) < Math.abs(best - f)){ im = st.cache[r][k]; best = +k; }
    }
    if (im && st.drawn !== best){ st.ctx.drawImage(im, 0, 0); st.drawn = best; }
    if (run) ahead(st);
  }
  function stopWc(){
    var st = wc; if (!st) return;
    st.dead = true; wc = null;
    try { st.dec.close(); } catch(e){}
    for (var g in st.cache) drop(st.cache[g]);
    if (film !== video && film.parentNode){ film.parentNode.replaceChild(video, film); film = video; }
  }
  function wcBroken(st){ if (wc !== st) return; var buf = st.u8.buffer; stopWc(); wcFallback(buf, '', gen); }
  /* the decoder refused: hand the same file to a video element if this browser can play it */
  function wcFallback(buf, t, my){
    if (my !== gen) return;
    var vt = videoTail(), src = base + set + vt;
    if (!vt) return;
    if (vt === t || t === '') startVideo(URL.createObjectURL(new Blob([buf], { type: 'video/mp4' })), src);
    else startVideo(src, src);
  }

  /* ---------- 2. A <video> scrubbed by its time ---------- */
  var vurl = '', vsrc = '', seeking = 0, shown = -1, primed = false;
  function startVideo(u, src){
    vurl = u; vsrc = src; seeking = 0; shown = -1; primed = false;
    video.muted = true; video.playsInline = true; video.preload = 'auto';
    video.src = u; video.load();
    prime();
  }
  /* iPhones load and paint a video only once it has played: muted inline play is allowed, and it is stopped at once.
     In Low Power Mode that needs a tap, so the first touch anywhere tries again. */
  function prime(){
    if (primed || !vurl) return;
    var pr; try { pr = video.play(); } catch(e){}
    if (pr && pr.then) pr.then(function(){ primed = true; video.pause(); }, function(){});
  }
  ['touchend', 'click', 'keydown'].forEach(function(ev){ d.addEventListener(ev, prime, { passive: true }); });
  video.addEventListener('playing', function(){ if (vurl){ primed = true; video.pause(); } });
  video.addEventListener('error', function(){
    if (vurl.indexOf('blob:') !== 0) return;
    URL.revokeObjectURL(vurl); startVideo(vsrc, vsrc);
  });
  video.addEventListener('loadeddata', function(){
    if (!vurl) return;
    N = Math.max(1, Math.round(video.duration * FPS));
    seekTo(true);
  });
  video.addEventListener('seeked', function(){ if (!vurl) return; seeking = 0; show(); });
  /* one seek at a time, to the middle of the frame so no browser rounds to the one before; a seek that never
     reports back is given up on after half a second */
  function seekTo(force){
    if (!N || seeking && !force && performance.now() - seeking < 500) return;
    var f = clamp(Math.round(cur), 0, N - 1);
    if (f === shown && !force) return;
    shown = f; seeking = performance.now();
    try { video.currentTime = Math.min((f + .5) / FPS, video.duration - .001); } catch(e){ seeking = 0; }
  }
  function stopVideo(){
    if (!vurl) return;
    if (vurl.indexOf('blob:') === 0) URL.revokeObjectURL(vurl);
    vurl = ''; video.removeAttribute('src'); try { video.load(); } catch(e){}
  }

  /* ---------- the lines ---------- */
  lines.forEach(function(el){
    var text = el.textContent, html = '';
    el._n = text.length; el._shown = -1;
    text.split(/(\s+)/).forEach(function(w){
      if (/^\s+$/.test(w)) { html += w.replace(/./g, '<span> </span>'); return; }
      html += '<b style="white-space:nowrap;font-weight:inherit">' + w.replace(/./g, function(ch){ return '<span>' + ch.replace('&', '&amp;').replace('<', '&lt;') + '</span>'; }) + '</b>';
    });
    el.innerHTML = html; el._chars = el.querySelectorAll('span');
  });
  function type(el, n){
    if (n === el._shown) return;
    var c = el._chars;
    for (var i = 0; i < c.length; i++){ c[i].className = i < n ? (i === n - 1 ? 'on tip' : 'on') : ''; }
    el._shown = n;
  }
  /* each line owns an equal share of the film: types over the first half, holds, erases, then a breath of nothing */
  var intro = 0, t0 = performance.now();
  function words(pf){
    lines.forEach(function(el, i){
      var l = pf * lines.length - i, n;
      if (i === 0 && l < .5) l = Math.max(l, intro * .5);
      if (l <= 0 || l >= .8) n = 0;
      else if (l < .5) n = Math.ceil(el._n * l / .5);
      else if (l < .6) n = el._n;
      else n = Math.floor(el._n * (1 - (l - .6) / .2));
      type(el, n);
    });
  }

  /* ---------- scroll ---------- */
  var p = 0, pe = 0, raf = 0, last = 0;
  function progress(){
    var r = root.getBoundingClientRect(), hh = head ? head.offsetHeight : 64;
    return clamp((hh - r.top) / Math.max(1, root.offsetHeight - stick.offsetHeight), 0, 1);
  }
  function frame(now){
    raf = 0;
    var dt = Math.min(64, now - (last || now)); last = now;
    intro = clamp((now - t0 - 500) / 1700, 0, 1);
    p = progress();
    /* the eased share of the film; it drives the words at once and the film as fast as frames can be had */
    var target = Math.min(1, p / FILM);
    if (target !== pe) dir = target > pe ? 1 : -1;
    pe += (target - pe) * (1 - Math.pow(1 - .16, dt / 16.7));
    if (Math.abs(target - pe) < .0005) pe = target;
    cur = pe * Math.max(0, N - 1);
    if (wc) wcDraw(); else if (ready) seekTo(false);
    words(pe);
    white.style.opacity = span(p, .9, .95).toFixed(3);
    var e = span(p, .95, .99);
    end.style.opacity = e.toFixed(3);
    root.classList.toggle('is-end', e > 0);
    root.classList.toggle('is-moving', p > .01);
    if (head) head.classList.toggle('on-dark', p < .95 && root.getBoundingClientRect().bottom > (head.offsetHeight || 64));
    if (pe !== target || intro < 1) kick();
  }
  function kick(){ if (!raf) raf = requestAnimationFrame(frame); }

  window.addEventListener('scroll', kick, { passive: true });
  var rz = 0;
  window.addEventListener('resize', function(){
    clearTimeout(rz);
    rz = setTimeout(function(){ if (pickSet() !== set) load(); kick(); }, 150);
  });
  /* keyboard users who tab into the headline's buttons before the film ends are taken to the end */
  end.addEventListener('focusin', function(){
    if (p < .99) window.scrollTo({ top: root.offsetTop + root.offsetHeight - stick.offsetHeight - (head ? head.offsetHeight : 64), behavior: 'instant' });
  });

  load(); kick();
})();
