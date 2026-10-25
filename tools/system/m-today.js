/* Today: the business's day, live. One board of time holds the team's jobs and everything the system handled
   (calls caught, texts sent, bookings, quotes, reviews), beside the work won so far. The first time it opens for a
   business it replays the morning in a few seconds; after that new enquiries and bookings keep arriving while it
   is on screen, and they land in the inbox and the diary too. */
(function(){
  var f = SYS.fmt, esc = SYS.esc, H = SYS.HOUR, MIN = SYS.MIN;
  var played = {}, view = null, B = null, raf = 0, timers = [], liveN = 0, noteT = 0;
  var LIVE = ['enq', 'missed', 'book', 'review', 'book', 'enq', 'missed', 'book'];
  var MAX_FEED = 14;

  /* ---------- the day's numbers ---------- */
  function dayEvents(){ return SYS.events().slice().reverse(); }
  function sums(evs, upto){
    var o = { won: 0, calls: 0, booked: 0, qv: 0 };
    evs.forEach(function(e){
      if (+e.at > upto) return;
      o.won += e.val || 0;
      if (e.ic === 'missed') o.calls++;
      if (e.ic === 'booking') o.booked++;
      if (e.won) o.qv += e.val;
    });
    return o;
  }
  /* the board runs from early enough for anything that came in (06:00 at the earliest) to 18:00 */
  function range(evs){
    var n = SYS.now(), d0 = +SYS.sod(n), h1 = SYS.T.key === 'salon' ? 9 : 8;
    var first = evs.length ? new Date(Math.max(+evs[0].at, d0)).getHours() : h1;
    var h0 = Math.max(6, Math.min(h1, first));
    return { a: d0 + h0 * H, b: d0 + 18 * H, h0: h0, d0: d0 };
  }
  function pct(t){ return Math.max(0, Math.min(100, (t - B.r.a) / (B.r.b - B.r.a) * 100)); }
  function inT(ms){ var m = Math.max(1, Math.round(ms / MIN)); return 'in ' + (m < 60 ? m + ' min' : Math.floor(m / 60) + 'h ' + (m % 60 ? m % 60 + 'm' : '')).trim(); }

  /* ---------- markup ---------- */
  function fig(go, id, v, k){ return '<button class="td-fig" type="button" data-go="' + go + '"><b id="' + id + '">' + v + '</b><span>' + esc(k) + '</span></button>'; }
  function dot(e, p, row, cls){
    var side = p > 76 ? ' r' : (p < 18 ? ' l' : '');
    return '<button class="tdb-dot' + side + (cls ? ' ' + cls : '') + '" type="button" data-go="' + e.mod + '" data-ref="' + (e.ref || '') + '" data-k="' + (e.k || '') + '" data-t="' + (+e.at) + '" style="left:' + p.toFixed(2) + '%;--r:' + row + '" aria-label="' + esc(f.time(e.at) + ' ' + e.text) + '" data-l="' + esc(f.time(e.at) + '  ' + e.text) + '">' + SYS.icon(e.ic || 'bolt') + '</button>';
  }
  function job(b, n, cls){
    var p = SYS.person(b.pid), s = SYS.svc(b.svc), st = +b.start, en = st + b.mins * MIN;
    var state = en <= n ? ' done' : (st <= n ? ' now' : '');
    return '<button class="tdb-job' + state + (cls ? ' ' + cls : '') + '" type="button" data-go="booking" data-ref="' + b.id + '" data-s="' + st + '" data-e="' + en + '" data-m="' + (+b.madeAt) + '" style="left:' + pct(st).toFixed(2) + '%;width:' + (pct(en) - pct(st)).toFixed(2) + '%" aria-label="' + esc(f.time(b.start) + ' ' + s.name + ', ' + p.name) + '"><b>' + esc(s.name) + '</b><small>' + esc(f.time(b.start) + ' · ' + p.name) + '</small></button>';
  }
  /* dots that would sit on top of each other drop to the second row */
  function rowFor(p){
    var R = B.rows, row = -1, lo = 0;
    for (var i = 0; i < R.length; i++){ if (p - R[i] >= B.gap){ row = i; break; } if (R[i] < R[lo]) lo = i; }
    if (row < 0) row = lo;
    R[row] = p; return row;
  }
  function hero(pending){
    var t = SYS.T, S = SYS.S, n = +SYS.now(), r = B.r, evs = B.evs, x = sums(evs, pending ? -1 : n), rv = S.rating;
    var axis = '', lines = '';
    for (var h = r.h0; h <= 18; h++){
      var p = pct(r.d0 + h * H);
      lines += '<i style="left:' + p.toFixed(2) + '%"></i>';
      if ((h - r.h0) % 2 === 0 && h < 18) axis += '<span' + (p === 0 ? ' class="a0"' : '') + ' style="left:' + p.toFixed(2) + '%">' + String(h).padStart(2, '0') + ':00</span>';
    }
    B.rows = B.rows.map(function(){ return -99; });
    var dots = evs.map(function(e){ var p = pct(+e.at); return dot(e, p, rowFor(p), pending ? 'pend' : ''); }).join('');
    var lanes = t.team.map(function(who){
      var list = S.bookings.filter(function(b){ return b.who === who && +SYS.sod(b.start) === r.d0; });
      return '<div class="tdb-track lane" data-who="' + esc(who) + '">' + list.map(function(b){ return job(b, pending ? r.a : n, pending && +b.madeAt >= r.d0 ? 'pend' : ''); }).join('') + '</div>';
    }).join('');
    var at = pending ? r.a : n;
    return '<section class="td" id="td">'
      + '<div class="td-sum">'
      + '<div class="td-eb"><span class="td-live">Live</span><span class="mono" id="tdClock">' + f.time(at) + '</span></div>'
      + '<div class="td-big num" id="tdWon" data-v="' + x.won + '">' + f.money(Math.round(x.won)) + '</div>'
      + '<p class="td-cap">of work won today while you were busy</p>'
      + '<div class="td-figs">'
      + fig('inbox', 'tdCalls', x.calls, x.calls === 1 ? 'missed call caught' : 'missed calls caught')
      + fig('booking', 'tdBooked', x.booked, x.booked === 1 ? 'job booked' : 'jobs booked')
      + fig('quotes', 'tdQuotes', f.money(Math.round(x.qv)), 'in quotes won').replace('id="tdQuotes"', 'id="tdQuotes" data-v="' + x.qv + '"')
      + fig('reviews', 'tdRating', rv.hist[rv.hist.length - 1].toFixed(1), 'on Google, up from ' + rv.hist[0].toFixed(1))
      + '</div>'
      + '<div class="td-acts"><button class="td-play" type="button" data-act="replay" id="tdPlay"' + (pending ? ' hidden' : '') + '>' + SYS.icon('play') + '<span>Replay this morning</span></button>'
      + '<button class="td-play" type="button" data-act="skip" id="tdSkip"' + (pending ? '' : ' hidden') + '>' + SYS.icon('right') + '<span>Skip</span></button></div>'
      + '</div>'
      + '<div class="td-day"><div class="td-dh"><b>Your day</b><span>The diary, and every call, text and booking the system handled</span></div>'
      + '<div class="tdb" style="--rows:' + t.team.length + '">'
      + '<div class="tdb-names" aria-hidden="true"><span></span><span>System</span>' + t.team.map(function(w){ return '<span>' + esc(w) + '</span>'; }).join('') + '</div>'
      + '<div class="tdb-plot" id="tdPlot"><div class="tdb-axis" aria-hidden="true">' + axis + '</div><div class="tdb-lines" aria-hidden="true">' + lines + '</div>'
      + '<div class="tdb-past" id="tdPast" style="width:' + pct(at).toFixed(2) + '%"></div>'
      + '<div class="tdb-track tdb-ev" id="tdEv">' + dots + '</div>' + lanes
      + '<div class="tdb-now" id="tdNow" style="left:' + pct(at).toFixed(2) + '%"><span>' + f.time(at) + '</span></div></div></div></div>'
      + '<div class="td-note" id="tdNote" aria-live="polite"></div>'
      + '</section>';
  }
  function li(e, cls){
    return '<li' + (cls ? ' class="' + cls + '"' : '') + ' data-t="' + (+e.at) + '"><span class="tm">' + f.time(e.at) + '</span><button class="ev" data-k="' + (e.k || '') + '" type="button" data-go="' + e.mod + '" data-ref="' + (e.ref || '') + '" style="text-align:left"><span class="ic">' + SYS.icon(e.ic || 'bolt') + '</span><b>' + esc(e.text) + '</b>' + (e.sub ? '<small>' + esc(e.sub) + '</small>' : '') + '</button></li>';
  }
  function countText(k){ return k + (k === 1 ? ' thing' : ' things') + ', none of them by hand'; }
  function feed(pending){
    var list = B.evs.slice(-MAX_FEED).reverse();
    return '<div class="card"><div class="card-h"><h2>What happened today</h2><span class="meta" id="tdCount">' + countText(pending ? 0 : B.evs.length) + '</span></div>'
      + (list.length ? '<div class="card-b" style="padding-top:6px;padding-bottom:6px"><ul class="tl td-feed" id="todayFeed">' + list.map(function(e){ return li(e, pending ? 'pend' : ''); }).join('') + '</ul></div>' : '<div class="empty">Quiet so far. Things land here as they happen.</div>') + '</div>';
  }
  function side(){
    var S = SYS.S, n = SYS.now(), t = SYS.T, P = SYS.person, d0 = +SYS.sod(n);
    var next = S.bookings.filter(function(b){ return +b.start + b.mins * MIN > +n; }).sort(function(a, b){ return a.start - b.start; }).slice(0, 4), firstFuture = true;
    var nextH = '<div class="card"><div class="card-h"><h2>Next up</h2><button class="btn ghost sm" type="button" data-go="booking">Diary' + SYS.icon('right') + '</button></div><div class="rows">' + next.map(function(b){
      var p = P(b.pid), s = SYS.svc(b.svc), live = b.start <= n, end;
      if (live) end = '<span class="tag ac">Now</span>';
      else if (firstFuture && +SYS.sod(b.start) === d0){ firstFuture = false; end = '<span class="tag" data-in="' + (+b.start) + '">' + inT(b.start - n) + '</span>'; }
      else end = esc(f.day(b.start) === 'Today' ? b.who : f.day(b.start));
      return '<button class="row click" type="button" data-go="booking" data-ref="' + b.id + '" style="width:100%;text-align:left"><span class="mono" style="width:44px;color:' + (live ? 'var(--ac-text)' : 'var(--ink2)') + '">' + f.time(b.start) + '</span><span class="main-t"><span class="t1"><span class="n">' + esc(s.name) + '</span></span><span class="t2">' + esc(p.name) + ' · ' + esc(t.plates ? p.car : p.addr) + '</span></span><span class="end">' + end + '</span></button>';
    }).join('') + '</div></div>';
    var waiting = S.convos.filter(function(c){ return c.st === 'new' && c.msgs.some(function(m){ return m.k === 'them'; }); }), drafts = S.quotes.filter(function(q){ return q.st === 'draft'; }), unrep = S.reviews.filter(function(r){ return !r.reply; });
    var need = '<div class="card"><div class="card-h"><h2>Needs you</h2><span class="meta">' + (waiting.length + drafts.length + unrep.length) + '</span></div><div class="rows" id="tdNeed">'
      + needRow('inbox', waiting.length + ' ' + (waiting.length === 1 ? 'message' : 'messages') + ' to answer', waiting.length ? 'Longest waiting ' + f.ago(waiting.map(function(c){ return c.msgs.filter(function(m){ return m.k === 'them'; }).slice(-1)[0].at; }).sort(function(a, b){ return a - b; })[0]) : 'All answered', waiting.length)
      + needRow('quotes', drafts.length + (drafts.length === 1 ? ' quote' : ' quotes') + ' ready to send', drafts.length ? esc(drafts[0].title) : 'Nothing waiting', drafts.length, drafts.length ? drafts[0].id : '')
      + needRow('reviews', unrep.length + (unrep.length === 1 ? ' review' : ' reviews') + ' to thank', unrep.length ? esc(P(unrep[0].pid).name) + ', ' + unrep[0].s + ' stars' : 'All replied to', unrep.length)
      + '</div></div>';
    var m = S.results.months[S.results.months.length - 1], tot = m.rows.reduce(function(a, r){ return { e: a.e + r.enq, b: a.b + r.booked, v: a.v + r.value }; }, { e: 0, b: 0, v: 0 });
    var month = '<div class="card"><div class="card-h"><h2>' + esc(m.label) + ' so far</h2><button class="btn ghost sm" type="button" data-go="results">Where it came from' + SYS.icon('right') + '</button></div><div class="grid g3 keep" style="gap:0">'
      + '<div class="stat"><span class="k">Enquiries</span><span class="v">' + tot.e + '</span></div><div class="stat" style="border-left:1px solid var(--line2)"><span class="k">Booked</span><span class="v">' + tot.b + '</span></div><div class="stat" style="border-left:1px solid var(--line2)"><span class="k">Work booked</span><span class="v">' + f.money(tot.v) + '</span></div></div></div>';
    return nextH + need + month;
  }
  function needRow(go, t1, t2, n, ref){ return '<button class="row click" type="button" data-go="' + go + '"' + (ref ? ' data-ref="' + ref + '"' : '') + ' style="width:100%;text-align:left"><span class="dot ' + (n ? 'ac' : 'good') + '"></span><span class="main-t"><span class="t1"><span class="n">' + t1 + '</span></span><span class="t2">' + t2 + '</span></span>' + SYS.icon('right', 'ch') + '</button>'; }

  function build(v, pending){
    view = v;
    var evs = dayEvents();
    /* three rows of dots on a laptop, four smaller ones on a phone, kept a dot's width apart */
    var phone = innerWidth <= 760, w = v.clientWidth || innerWidth, plot = phone ? w - 36 : (innerWidth <= 1180 ? w - 120 : w - 420);
    B = { evs: evs, r: range(evs), rows: phone ? [-99, -99, -99, -99] : [-99, -99, -99], gap: Math.max(2, (phone ? 14 : 23) / Math.max(240, plot) * 100) };
    v.innerHTML = hero(pending) + '<div class="split side-first" style="margin-top:14px"><div class="grid">' + feed(pending) + '</div><div class="grid" id="tdSide">' + side() + '</div></div>';
  }

  /* ---------- moving parts ---------- */
  function $(id){ return view && view.querySelector('#' + id); }
  function tween(el, to, fmt, ms){
    if (!el) return;
    var from = +el.getAttribute('data-v') || 0; el.setAttribute('data-v', to);
    if (el._raf) cancelAnimationFrame(el._raf);
    var t0 = 0;
    (function step(ts){ if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = p < 1 ? fmt(Math.round(from + (to - from) * e)) : fmt(to); if (p < 1) el._raf = requestAnimationFrame(step); })(performance.now());
  }
  function bump(el, txt){ if (!el || el.textContent === String(txt)) return; el.textContent = txt; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function setFigs(x, ms){
    var whole = function(v){ return f.money(Math.round(v)); };
    tween($('tdWon'), x.won, whole, ms || 700);
    tween($('tdQuotes'), x.qv, whole, ms || 700);
    bump($('tdCalls'), x.calls); bump($('tdBooked'), x.booked);
    var c = $('tdCalls'), b = $('tdBooked');
    if (c) c.nextElementSibling.textContent = x.calls === 1 ? 'missed call caught' : 'missed calls caught';
    if (b) b.nextElementSibling.textContent = x.booked === 1 ? 'job booked' : 'jobs booked';
  }
  function setNow(T){
    var p = pct(T).toFixed(2) + '%', nw = $('tdNow'), past = $('tdPast'), clk = $('tdClock');
    if (nw){ nw.style.left = p; nw.firstChild.textContent = f.time(T); }
    if (past) past.style.width = p;
    if (clk) clk.textContent = f.time(T);
  }
  function jobsAt(T){
    [].forEach.call(view.querySelectorAll('.tdb-job'), function(j){
      var s = +j.getAttribute('data-s'), e = +j.getAttribute('data-e');
      j.classList.toggle('done', e <= T); j.classList.toggle('now', s <= T && T < e);
    });
  }
  function playBtn(on){ var a = $('tdPlay'), b = $('tdSkip'); if (a) a.hidden = on; if (b) b.hidden = !on; }
  function later(ms, fn){ var id = setTimeout(function(){ timers = timers.filter(function(x){ return x !== id; }); fn(); }, ms); timers.push(id); return id; }
  function stop(){ if (raf){ cancelAnimationFrame(raf); raf = 0; } timers.forEach(clearTimeout); timers = []; clearTimeout(noteT); }

  /* the morning in a few seconds: the clock runs from the start of the board to now, and everything the system did
     lands on the board, in the feed and in the figures as the line passes it */
  function replay(){
    stop();
    played[SYS.T.key] = true;
    build(view, true);
    var r = B.r, n = +SYS.now(), evs = B.evs, dur = Math.min(9000, 4200 + evs.length * 220), t0 = 0, seen = 0;
    var pend = [].slice.call(view.querySelectorAll('.pend'));
    playBtn(true);
    function finish(){
      raf = 0;
      pend.forEach(function(el){ el.classList.remove('pend'); });
      setNow(n); jobsAt(n); setFigs(sums(evs, n), 500);
      var c = $('tdCount'); if (c) c.textContent = countText(evs.length);
      playBtn(false);
      later(5500, liveStep);
    }
    B.finish = finish;
    function frame(ts){
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var T = r.a + (n - r.a) * e, hit = 0;
      pend = pend.filter(function(el){
        var at = +(el.getAttribute('data-t') || el.getAttribute('data-m'));
        if (at > T) return true;
        el.classList.remove('pend'); el.classList.add(el.classList.contains('tdb-job') ? 'pop' : 'in');
        if (el.tagName === 'LI' || el.classList.contains('tdb-dot')) hit++;
        return false;
      });
      setNow(T); jobsAt(T);
      if (hit){
        var x = sums(evs, T); setFigs(x, 450);
        seen = evs.filter(function(ev){ return +ev.at <= T; }).length;
        var c = $('tdCount'); if (c) c.textContent = countText(seen);
      }
      if (p < 1) raf = requestAnimationFrame(frame); else finish();
    }
    raf = requestAnimationFrame(frame);
  }

  /* ---------- while it is on screen, the business keeps getting work ---------- */
  function clip(s, n){ return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function freshPerson(){
    var S = SYS.S, used = {}, d0 = SYS.sod(SYS.now());
    S.convos.forEach(function(c){ used[c.pid] = 1; });
    S.bookings.forEach(function(b){ if (b.madeAt >= d0) used[b.pid] = 1; });
    var free = S.people.filter(function(p){ return !used[p.id]; });
    return free.length ? free[(liveN * 5) % free.length] : S.people[liveN % S.people.length];
  }
  function liveStep(){
    if (SYS.cur !== 'today' || !view || liveN >= LIVE.length * 2) return;
    var k = LIVE[liveN % LIVE.length];
    make(k); liveN++;
    later(17000 + Math.round(Math.random() * 9000), liveStep);
  }
  function make(k){
    var S = SYS.S, t = SYS.T, n = SYS.now(), CH = SYS.CH, p = freshPerson();
    if (k === 'enq' || k === 'missed'){
      var pool = (t.live || []).concat(t.asks).filter(function(a){ return k === 'missed' ? a.ch === 'call' : a.ch !== 'call'; });
      var a = pool[Math.floor(liveN / 3) % pool.length], ch = CH[a.ch] || CH.text;
      var c = { id: SYS.uid('c'), pid: p.id, ch: a.ch, svc: a.svc, missed: k === 'missed', at: n, st: 'new', msgs: [], fresh: true, src: { call: 'Phone', text: 'Text', web: 'Website', google: 'Google profile', fb: 'Facebook', ig: 'Instagram' }[a.ch] };
      S.convos.push(c);
      if (k === 'enq'){
        c.msgs.push({ k: 'them', text: a.text, at: n });
        arrive({ at: n, mod: 'inbox', ref: c.id, k: '', ic: ch[1], text: 'New enquiry from ' + p.name, sub: ch[0] + ' · “' + clip(a.text, 58) + '”' });
        return;
      }
      c.msgs.push({ k: 'sys', text: 'Missed call', at: n });
      arrive({ at: n, mod: 'inbox', ref: c.id, k: 'warn', ic: 'missed', text: 'Missed call from ' + p.name, sub: 'Nobody free to answer' });
      later(6000, function(){
        var m = { k: 'auto', text: SYS.autoText(t), at: SYS.now() }; c.msgs.push(m);
        arrive({ at: m.at, mod: 'inbox', ref: c.id, k: 'ac', ic: 'text', text: 'Text sent ' + Math.round((m.at - c.at) / 1000) + ' seconds later', sub: 'To ' + p.name + ', automatically' });
      });
      later(24000, function(){ c.msgs.push({ k: 'them', text: a.text, at: SYS.now() }); SYS.changed({ quiet: true }); refreshSide(); });
      return;
    }
    if (k === 'book'){
      var opts = t.services.filter(function(s){ return s.dep > 0; }), s = opts[(liveN * 3) % opts.length];
      var sl = SYS.freeSlots(s.id, 3)[liveN % 3] || SYS.freeSlots(s.id, 1)[0]; if (!sl) return;
      var b = SYS.addBooking({ pid: p.id, svc: s.id, start: sl.start, who: sl.who, src: 'Booked online' });
      arrive({ at: b.madeAt, mod: 'booking', ref: b.id, k: 'good', ic: 'booking', val: b.price, text: 'Booked online: ' + s.name, sub: p.name + ' · ' + f.when(b.start) + (b.dep ? ' · ' + f.money(b.dep) + ' deposit paid' : '') }, b);
      return;
    }
    if (k === 'review'){
      var ask = S.asks.filter(function(x){ return x.st === 'opened' || x.st === 'sent'; })[0]; if (!ask) return make('book');
      ask.st = 'reviewed'; ask.ev.push({ at: n, text: 'Left 5 stars on Google' });
      arrive({ at: n, mod: 'reviews', ref: ask.id, k: 'good', ic: 'reviews', text: 'Left 5 stars on Google', sub: SYS.person(ask.pid).name + ', from the text after their ' + SYS.svc(ask.svc).name.toLowerCase() });
    }
  }
  function arrive(e, b){
    SYS.changed({ quiet: true });
    if (SYS.cur !== 'today' || !view || !B) return;
    B.evs.push(e);
    var p = pct(+e.at), ev = $('tdEv');
    if (ev) ev.insertAdjacentHTML('beforeend', dot(e, p, rowFor(p), 'in'));
    var ul = $('todayFeed');
    if (ul){ ul.insertAdjacentHTML('afterbegin', li(e, 'in')); while (ul.children.length > MAX_FEED) ul.removeChild(ul.lastElementChild); }
    var c = $('tdCount'); if (c) c.textContent = countText(B.evs.length);
    setFigs(sums(B.evs, Infinity), 900);
    if (b && +SYS.sod(b.start) === B.r.d0){
      var lane = view.querySelector('.tdb-track.lane[data-who="' + b.who + '"]');
      if (lane) lane.insertAdjacentHTML('beforeend', job(b, +SYS.now(), 'pop'));
    }
    note(e);
    refreshSide();
  }
  function note(e){
    var el = $('tdNote'); if (!el) return;
    el.innerHTML = '<span class="ic" data-k="' + (e.k || '') + '">' + SYS.icon(e.ic || 'bolt') + '</span><span class="tx"><b>' + esc(e.text) + '</b>' + (e.sub ? '<small>' + esc(e.sub) + '</small>' : '') + '</span><em>now</em>';
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(noteT); noteT = setTimeout(function(){ el.classList.remove('on'); }, 5200);
  }
  function refreshSide(){ var s = $('tdSide'); if (s && SYS.cur === 'today') s.innerHTML = side(); }

  SYS.module('today', {
    label: 'Today', short: 'Today', icon: 'today', title: 'Today', blurb: 'What happened while you were working',
    sub: function(){ var n = SYS.now(); return esc(f.days[n.getDay()] + ' ' + n.getDate() + ' ' + f.mon[n.getMonth()]) + ' · what the system did while you were working'; },
    actions: function(){ return '<button class="btn" type="button" data-act="sim" id="todaySim">' + SYS.icon('missed') + 'Try a missed call</button>'; },
    act: function(a){
      if (a === 'sim'){ SYS.go('inbox', { sim: true }); return; }
      if (a === 'replay'){ replay(); return; }
      if (a === 'skip' && raf && B && B.finish){ stop(); B.finish(); }
    },
    render: function(v){
      stop(); view = v;
      if (!played[SYS.T.key]){ replay(); return; }
      build(v, false);
      later(4000, liveStep);
    },
    leave: function(){ stop(); },
    tick: function(){
      if (raf || !view || !B) return;
      var n = +SYS.now(); setNow(n); jobsAt(n);
      [].forEach.call(view.querySelectorAll('[data-in]'), function(el){ el.textContent = inT(+el.getAttribute('data-in') - n); });
    }
  });
  SYS.on(function(o){ if (o.trade){ stop(); liveN = 0; } });
})();
