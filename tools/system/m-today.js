/* Today: what the system did since the morning, what is next, and what still needs a person. */
(function(){
  var f = SYS.fmt, esc = SYS.esc;
  function todays(){
    var S = SYS.S, n = SYS.now(), d0 = SYS.sod(n);
    var missed = S.convos.filter(function(c){ return c.missed && c.at >= d0 && c.at <= n; });
    var made = S.bookings.filter(function(b){ return b.madeAt >= d0 && b.madeAt <= n; });
    var acc = S.quotes.filter(function(q){ return q.ev.some(function(e){ return e.k === 'ok' && e.at >= d0 && e.at <= n; }); });
    var chased = S.quotes.reduce(function(a, q){ return a + q.ev.filter(function(e){ return e.k === 'chase' && e.at >= d0 && e.at <= n; }).length; }, 0);
    return { missed: missed, made: made, acc: acc, chased: chased };
  }
  SYS.module('today', {
    label: 'Today', short: 'Today', icon: 'today', title: 'Today', blurb: 'What happened while you were working',
    sub: function(){ var n = SYS.now(); return esc(f.days[n.getDay()] + ' ' + n.getDate() + ' ' + f.mon[n.getMonth()]) + ' · what the system did while you were working'; },
    actions: function(){ return '<button class="btn" type="button" data-act="sim" id="todaySim">' + SYS.icon('missed') + 'Try a missed call</button>'; },
    act: function(a){ if (a === 'sim'){ SYS.go('inbox', { sim: true }); } },
    render: function(v){
      var S = SYS.S, n = SYS.now(), t = SYS.T, x = todays(), P = SYS.person;
      var texted = x.missed.filter(function(c){ return c.msgs.some(function(m){ return m.k === 'auto'; }); });
      var fastest = texted.length ? Math.max.apply(null, texted.map(function(c){ var m = c.msgs.filter(function(m){ return m.k === 'auto'; })[0]; return Math.round((m.at - c.at) / 1000); })) : 0;
      var madeVal = x.made.reduce(function(a, b){ return a + (b.price || 0); }, 0), depVal = x.made.reduce(function(a, b){ return a + (b.dep || 0); }, 0);
      var accVal = x.acc.reduce(function(a, q){ return a + SYS.quoteTotal(q).total; }, 0);
      var rv = S.rating, rCount = rv.count[rv.count.length - 1] + S.reviews.filter(function(r){ return r.at > SYS.sod(n) - 30 * SYS.DAY; }).length;
      var stats = '<div class="grid g4">'
        + stat('Missed calls caught', x.missed.length, x.missed.length ? 'All texted back within ' + Math.max(fastest, 8) + ' seconds' : 'None missed yet today', 'inbox', 'stCalls', week('calls', 1, 5, x.missed.length), 'The last seven days')
        + stat('Booked today', x.made.length, f.money(madeVal) + ' of work' + (depVal ? ', ' + f.money(depVal) + ' in deposits' : ''), 'booking', 'stBooked', week('booked', 3, 9, x.made.length), 'The last seven days')
        + stat('Quotes accepted', x.acc.length ? f.money(accVal) : '0', x.chased ? x.chased + ' chased for you this morning' : 'Chasing runs at 9am', 'quotes', 'stQuotes', week('quotes', 0, 3, x.acc.length), 'The last seven days')
        + stat('Google rating', rv.hist[rv.hist.length - 1].toFixed(1), 'From ' + rCount + ' reviews, up from ' + rv.hist[0].toFixed(1), 'reviews', 'stRating', rv.hist.map(function(h){ return h - 3.6; }), 'The last six months')
        + '</div>';
      var ev = SYS.events().slice(0, 14);
      var feed = '<div class="card"><div class="card-h"><h2>What happened today</h2><span class="meta">' + ev.length + ' things, none of them by hand</span></div>'
        + (ev.length ? '<div class="card-b" style="padding-top:6px;padding-bottom:6px"><ul class="tl" id="todayFeed">' + ev.map(function(e){
          return '<li><span class="tm">' + f.time(e.at) + '</span><button class="ev" data-k="' + (e.k || '') + '" type="button" data-go="' + e.mod + '" data-ref="' + (e.ref || '') + '" style="text-align:left"><b>' + esc(e.text) + '</b>' + (e.sub ? '<small>' + esc(e.sub) + '</small>' : '') + '</button></li>';
        }).join('') + '</ul></div>' : '<div class="empty">Quiet so far. Things land here as they happen.</div>') + '</div>';
      var next = S.bookings.filter(function(b){ return +b.start + b.mins * SYS.MIN > +n; }).sort(function(a, b){ return a.start - b.start; }).slice(0, 4);
      var nextH = '<div class="card"><div class="card-h"><h2>Next up</h2><button class="btn ghost sm" type="button" data-go="booking">Diary' + SYS.icon('right') + '</button></div><div class="rows">' + next.map(function(b){
        var p = P(b.pid), s = SYS.svc(b.svc), live = b.start <= n;
        return '<button class="row click" type="button" data-go="booking" data-ref="' + b.id + '" style="width:100%;text-align:left"><span class="mono" style="width:44px;color:' + (live ? 'var(--ac-text)' : 'var(--ink2)') + '">' + f.time(b.start) + '</span><span class="main-t"><span class="t1"><span class="n">' + esc(s.name) + '</span></span><span class="t2">' + esc(p.name) + ' · ' + esc(t.plates ? p.car : p.addr) + '</span></span><span class="end">' + (live ? '<span class="tag ac">Now</span>' : esc(f.day(b.start) === 'Today' ? b.who : f.day(b.start))) + '</span></button>';
      }).join('') + '</div></div>';
      var waiting = S.convos.filter(function(c){ return c.st === 'new'; }), drafts = S.quotes.filter(function(q){ return q.st === 'draft'; }), unrep = S.reviews.filter(function(r){ return !r.reply; });
      var need = '<div class="card"><div class="card-h"><h2>Needs you</h2><span class="meta">' + (waiting.length + drafts.length + unrep.length) + '</span></div><div class="rows">'
        + needRow('inbox', waiting.length + ' ' + (waiting.length === 1 ? 'message' : 'messages') + ' to answer', waiting.length ? 'Longest waiting ' + f.ago(waiting.map(function(c){ return c.msgs.filter(function(m){ return m.k === 'them'; }).slice(-1)[0].at; }).sort(function(a, b){ return a - b; })[0]) : 'All answered', waiting.length)
        + needRow('quotes', drafts.length + (drafts.length === 1 ? ' quote' : ' quotes') + ' ready to send', drafts.length ? esc(drafts[0].title) : 'Nothing waiting', drafts.length, drafts.length ? drafts[0].id : '')
        + needRow('reviews', unrep.length + ' review to thank', unrep.length ? esc(P(unrep[0].pid).name) + ', ' + unrep[0].s + ' stars' : 'All replied to', unrep.length)
        + '</div></div>';
      var m = S.results.months[S.results.months.length - 1], tot = m.rows.reduce(function(a, r){ return { e: a.e + r.enq, b: a.b + r.booked, v: a.v + r.value }; }, { e: 0, b: 0, v: 0 });
      var month = '<div class="card"><div class="card-h"><h2>' + esc(m.label) + ' so far</h2><button class="btn ghost sm" type="button" data-go="results">Where it came from' + SYS.icon('right') + '</button></div><div class="grid g3" style="gap:0">'
        + '<div class="stat"><span class="k">Enquiries</span><span class="v">' + tot.e + '</span></div><div class="stat" style="border-left:1px solid var(--line2)"><span class="k">Booked</span><span class="v">' + tot.b + '</span></div><div class="stat" style="border-left:1px solid var(--line2)"><span class="k">Work booked</span><span class="v">' + f.money(tot.v) + '</span></div></div></div>';
      v.innerHTML = stats + '<div class="split side-first" style="margin-top:14px"><div class="grid">' + feed + '</div><div class="grid">' + nextH + need + month + '</div></div>';
    },
    tick: function(v){ /* the feed re-reads the clock when something new lands; nothing to do each second */ }
  });
  /* a small trend in the corner of each figure: earlier days drawn from the business's own seed, today last and in its colour */
  function week(k, lo, hi, today){
    var h = 2166136261, key = SYS.T.key + k, out = [];
    for (var i = 0; i < key.length; i++){ h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    for (var j = 0; j < 6; j++){ h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; out.push(lo + (h % (hi - lo + 1))); }
    out.push(today); return out;
  }
  function spark(list, title){
    var mx = Math.max.apply(null, list.concat([1]));
    return '<span class="spark" title="' + esc(title) + '" aria-hidden="true">' + list.map(function(x){ return '<i style="height:' + Math.max(12, Math.round(x / mx * 100)) + '%"></i>'; }).join('') + '</span>';
  }
  function stat(k, val, d, go, id, trend, title){ return '<button class="card stat" type="button" data-go="' + go + '" id="' + id + '" style="text-align:left">' + (trend ? spark(trend, title) : '') + '<span class="k">' + esc(k) + '</span><span class="v">' + val + '</span><span class="d">' + esc(d) + '</span></button>'; }
  function needRow(go, t1, t2, n, ref){ return '<button class="row click" type="button" data-go="' + go + '"' + (ref ? ' data-ref="' + ref + '"' : '') + ' style="width:100%;text-align:left"><span class="dot ' + (n ? 'ac' : 'good') + '"></span><span class="main-t"><span class="t1"><span class="n">' + t1 + '</span></span><span class="t2">' + t2 + '</span></span>' + SYS.icon('right', 'ch') + '</button>'; }
})();
