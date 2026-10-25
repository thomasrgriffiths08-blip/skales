/* Diary: every booking, a lane per person. Online bookings arrive with the deposit paid, reminder texts go
   the day before on their own, one tap sends the on-my-way text, and marking a job done queues the review ask. */
(function(){
  var f = SYS.fmt, esc = SYS.esc, MIN = SYS.MIN, HOUR = SYS.HOUR;
  var PPM = 64 / 60;                       // pixels per minute in the day view
  var day = null, mode = 'day', sel = null, dmode = 'detail', dr = null, tr = null, tries = 0, moveSlots = [];

  function isPhone(){ return matchMedia('(max-width:760px)').matches; }
  function addDays(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function monday(d){ var x = SYS.sod(d); return addDays(x, -((x.getDay() + 6) % 7)); }
  function same(a, b){ return +SYS.sod(a) === +SYS.sod(b); }
  function endOf(b){ return new Date(+b.start + b.mins * MIN); }
  function mobile(){ return /heating|electrical|cleaning/.test(SYS.T.key); }
  function gap(){ return mobile() ? 30 : 0; }
  function closed(d){ return SYS.T.key === 'clinic' && d.getDay() === 6; }
  function slots(svc, n){ return SYS.freeSlots(svc, n + 6).filter(function(sl){ return !closed(sl.start); }).slice(0, n); }
  function hrs(d){ var k = SYS.T.key; return [k === 'salon' ? 9 : 8, d.getDay() === 6 ? 13 : (k === 'salon' ? 18 : 17)]; }
  function onDay(d){ return SYS.S.bookings.filter(function(b){ return same(b.start, d); }).sort(function(a, b){ return a.start - b.start; }); }
  function inWeek(w0){ var w1 = addDays(w0, 7); return SYS.S.bookings.filter(function(b){ return b.start >= w0 && b.start < w1; }); }
  function find(id){ return SYS.S.bookings.filter(function(b){ return b.id === id; })[0]; }
  function online(b){ return b.src === 'Booked online' || b.dep > 0; }
  function convoFor(b){ return SYS.S.convos.filter(function(c){ return c.bid === b.id; })[0]; }
  function isDone(b){ return !!b.done || endOf(b) <= SYS.now(); }
  function isLive(b){ var n = SYS.now(); return !b.done && b.start <= n && endOf(b) > n; }
  function noun(n){ var w = SYS.T.noun; return n + ' ' + (n === 1 ? w : w + 's'); }
  function pc(p){ var a = p.addr.split(', '); return a[a.length - 1]; }
  function plate(p){ return p.car ? p.car.split(' · ')[1] : ''; }
  function money(n){ return f.money(Math.round(n * 100) / 100); }
  function price(b){ var s = SYS.svc(b.svc); return b.price === 0 ? 'Free' : (s.from ? 'from ' : '') + money(b.price); }
  function askFor(b){ return SYS.S.asks.filter(function(a){ return a.bid === b.id || (!a.bid && a.pid === b.pid && a.svc === b.svc); })[0]; }
  function srcLabel(b){
    var c = convoFor(b);
    if (c && c.missed) return 'From a missed call';
    if (b.src === 'Booked online') return 'Booked online';
    return { Phone: 'By phone', Text: 'By text', Website: 'Website form', 'Google profile': 'Google profile', Facebook: 'Facebook', Instagram: 'Instagram', 'Repeat customer': 'Repeat customer' }[b.src] || b.src;
  }
  function rangeLabel(w0){
    var a = w0, z = addDays(w0, 5);
    return a.getMonth() === z.getMonth() ? a.getDate() + ' to ' + z.getDate() + ' ' + f.mon[z.getMonth()] : a.getDate() + ' ' + f.mon[a.getMonth()] + ' to ' + z.getDate() + ' ' + f.mon[z.getMonth()];
  }

  /* the one text a person sends by hand from a booking, which differs by trade */
  function omw(){
    var t = SYS.T, k = t.key;
    if (mobile()) return { btn: 'Send on-my-way text', ev: 'On-my-way text sent', pend: 'One tap when you set off', auto: true,
      when: function(b){ return new Date(+b.start - 25 * MIN); },
      msg: function(b, p){ return '“Hi ' + SYS.first(p.name) + ', it’s ' + b.who + ' from ' + t.biz + '. On my way, with you in about 20 minutes.”'; } };
    if (k === 'garage') return { btn: 'Send car-ready text', ev: 'Car-ready text sent', pend: 'One tap when the car’s ready', auto: true,
      when: function(b){ return endOf(b); },
      msg: function(b, p){ return '“Hi ' + SYS.first(p.name) + ', your ' + (p.car || 'car').split(' · ')[0] + ' is ready to collect. We’re open until 5:30.”'; } };
    return { btn: 'Send running-late text', ev: 'Running-late text sent', auto: false,
      msg: function(b, p){ return '“Hi ' + SYS.first(p.name) + ', it’s ' + b.who + ' at ' + t.biz + '. Running about 10 minutes behind, sorry. No need to rush.”'; } };
  }

  /* free one-hour slots left in a week, with the same travel rule the booking page uses */
  function freeCount(w0){
    var n = SYS.now(), g = gap(), c = 0;
    for (var i = 0; i < 6; i++){
      var d = addDays(w0, i), h = hrs(d);
      if (SYS.sod(d) < SYS.sod(n) || closed(d)) continue;
      SYS.T.team.forEach(function(who){
        var bs = SYS.S.bookings.filter(function(b){ return b.who === who && same(b.start, d); });
        for (var m = h[0] * 60; m + 60 <= h[1] * 60;){
          var st = SYS.at(d, Math.floor(m / 60), m % 60), en = +st + 60 * MIN;
          if (st < n){ m += 30; continue; }
          var clash = bs.some(function(b){ return +st < +b.start + (b.mins + g) * MIN && en > +b.start - g * MIN; });
          if (clash) m += 30; else { c++; m += 60 + g; }
        }
      });
    }
    return c;
  }

  /* ---------- top: the week in four numbers ---------- */
  function statsHTML(){
    var w0 = monday(day), bs = inWeek(w0), val = 0, dep = 0, on = 0, n = SYS.now();
    bs.forEach(function(b){ val += b.price || 0; dep += b.dep || 0; if (online(b)) on++; });
    var thisWk = same(w0, monday(n)), past = addDays(w0, 6) <= SYS.sod(n), free = freeCount(w0);
    var lbl = thisWk ? 'this week' : 'that week';
    return '<div class="card bk-stats" id="bkStats">'
      + st('Booked ' + lbl, f.money(Math.round(val)), noun(bs.length))
      + st('Deposits taken', f.money(Math.round(dep)), 'paid when they booked')
      + st('Booked online', on, bs.length ? Math.round(on / bs.length * 100) + '% of all bookings' : 'none yet')
      + st('Slots still free', past ? 0 : free, past ? 'week gone' : 'one-hour gaps left')
      + '</div>';
  }
  function st(k, v, d){ return '<div class="bk-st"><span class="k">' + esc(k) + '</span><span class="v">' + v + '<small>' + esc(d) + '</small></span></div>'; }

  /* ---------- the bar: week, day strip, view ---------- */
  function barHTML(){
    var w0 = monday(day), n = SYS.now();
    var strip = '<div class="bk-strip" role="group" aria-label="Day">' + [0, 1, 2, 3, 4, 5].map(function(i){
      var d = addDays(w0, i), c = onDay(d).length, on = (mode === 'day' || isPhone()) && same(d, day);
      return '<button type="button" class="bk-day" id="bkDay-' + i + '" data-act="day" data-i="' + i + '" aria-pressed="' + on + '"' + (same(d, n) ? ' data-today' : '') + ' aria-label="' + esc(f.days[d.getDay()] + ' ' + d.getDate() + ' ' + f.mon[d.getMonth()] + ', ' + noun(c)) + '"><b><span class="bk-dn">' + f.dow[d.getDay()] + '</span><span class="bk-dd">' + d.getDate() + '</span></b><small>' + c + ' booked</small></button>';
    }).join('') + '</div>';
    var isToday = same(day, n) && (mode === 'day' || isPhone());
    return '<div class="bk-bar">'
      + '<div class="bk-wk"><button type="button" class="bk-ic l" data-act="wk" data-d="-1" id="bkPrev" aria-label="Previous week">' + SYS.icon('right') + '</button><b>' + esc(rangeLabel(w0)) + '</b><button type="button" class="bk-ic" data-act="wk" data-d="1" id="bkNext" aria-label="Next week">' + SYS.icon('right') + '</button></div>'
      + strip + '<span class="bk-sp"></span>'
      + '<button type="button" class="btn sm" data-act="today" id="bkToday"' + (isToday ? ' disabled' : '') + '>Today</button>'
      + '<div class="seg hide-m" role="group" aria-label="View"><button type="button" data-act="mode" data-m="day" id="bkViewDay" aria-pressed="' + (mode === 'day') + '">Day</button><button type="button" data-act="mode" data-m="week" id="bkViewWeek" aria-pressed="' + (mode === 'week') + '">Week</button></div>'
      + '</div>';
  }

  /* ---------- day view: a lane per person ---------- */
  function range(d){
    var h = hrs(d);
    onDay(d).forEach(function(b){ h[0] = Math.min(h[0], b.start.getHours()); h[1] = Math.max(h[1], Math.ceil((endOf(b) - SYS.sod(d)) / HOUR)); });
    return h;
  }
  function nowBooking(){
    var n = SYS.now(); if (!same(day, n)) return null;
    var list = onDay(day).filter(function(b){ return endOf(b) > n && !b.done; });
    return list.filter(isLive)[0] || list[0] || null;
  }
  /* bookings that overlap in one lane sit side by side */
  function columns(bs){
    var out = {}, cluster = [], cEnd = 0;
    function flush(){ var cols = []; cluster.forEach(function(b){ var c = 0; while (cols[c] && cols[c] > +b.start) c++; cols[c] = +endOf(b); out[b.id] = { c: c }; }); cluster.forEach(function(b){ out[b.id].n = cols.length; }); cluster = []; }
    bs.forEach(function(b){ if (cluster.length && +b.start >= cEnd) flush(); cluster.push(b); cEnd = Math.max(cEnd, +endOf(b)); });
    if (cluster.length) flush();
    return out;
  }
  function blockHTML(b, h0, nb, col){
    var p = SYS.person(b.pid), s = SYS.svc(b.svc), t = SYS.T;
    var top = (b.start - SYS.at(day, h0)) / MIN * PPM + 1, ht = Math.max(b.mins * PPM - 3, 18);
    var pos = col && col.n > 1 ? ';left:calc(4px + (100% - 9px) * ' + col.c + ' / ' + col.n + ');width:calc((100% - 9px) / ' + col.n + ' - 3px);right:auto' : '';
    var dep = b.dep ? '<span class="dp">' + money(b.dep) + ' paid</span>' : '';
    var mark = b.fresh ? '<span class="nw">New</span>' : dep;
    var wh = t.plates ? '<span class="pl">' + esc(plate(p)) + '</span>' : esc(pc(p));
    var tm = f.time(b.start) + ' · ' + f.mins(b.mins), inner;
    if (b.mins >= 90) inner = '<span class="r1"><span>' + tm + '</span>' + mark + '</span><span class="sv">' + esc(s.name) + '</span><span class="cu">' + esc(p.name) + '</span><span class="cu">' + (t.plates ? esc((p.car || '').split(' · ')[0]) + ' · <span class="pl">' + esc(plate(p)) + '</span>' : esc(p.addr)) + '</span>';
    else if (b.mins >= 60) inner = '<span class="r1"><span>' + tm + '</span>' + mark + '</span><span class="sv">' + esc(s.name) + '</span><span class="cu">' + esc(p.name) + ' · ' + wh + '</span>';
    else if (b.mins >= 40) inner = '<span class="r1 sv"><span>' + esc(s.name) + '</span>' + mark + '</span><span class="cu">' + esc(p.name) + ' · ' + wh + '</span>';
    else inner = '<span class="sv">' + esc(s.name) + ' <span class="cu">' + esc(p.name) + '</span></span>';
    var label = f.time(b.start) + ', ' + s.name + ', ' + p.name + (b.dep ? ', ' + money(b.dep) + ' deposit paid' : '') + ', ' + srcLabel(b);
    return '<button type="button" class="bk-b" id="bk-' + b.id + '" data-act="open" data-id="' + b.id + '" data-src="' + (online(b) ? 'online' : 'other') + '"'
      + (isDone(b) && !isLive(b) ? ' data-past' : '') + (sel === b.id || b.fresh ? ' aria-current="true"' : '') + (nb === b ? ' data-now' : '')
      + ' style="top:' + top.toFixed(1) + 'px;height:' + ht.toFixed(1) + 'px' + pos + '" aria-label="' + esc(label) + '">' + inner + '</button>';
  }
  function dayHTML(){
    var t = SYS.T, n = SYS.now(), h = range(day), H = (h[1] - h[0]) * 60 * PPM, g = gap(), list = onDay(day), nb = nowBooking(), cols = t.team.length;
    var head = '<div class="bk-lhs" style="--n:' + cols + '"><div></div>' + t.team.map(function(who){
      var bs = list.filter(function(b){ return b.who === who; }), v = bs.reduce(function(a, b){ return a + (b.price || 0); }, 0);
      return '<div class="bk-lh">' + SYS.av(who, 'sm') + '<b>' + esc(who) + '</b><span class="m">' + noun(bs.length) + ' · ' + f.money(Math.round(v)) + '</span></div>';
    }).join('') + '</div>';
    var lines = '', gut = '';
    for (var hh = h[0]; hh <= h[1]; hh++){
      var y = ((hh - h[0]) * 60 * PPM).toFixed(1);
      if (hh < h[1]) lines += '<i class="bk-hl" style="top:' + y + 'px"></i>';
      gut += '<span style="top:' + y + 'px">' + String(hh).padStart(2, '0') + ':00</span>';
    }
    var lanes = t.team.map(function(who){
      var bs = list.filter(function(b){ return b.who === who; }), out = '', cols = columns(bs);
      if (g) bs.forEach(function(b, i){
        var nx = bs[i + 1]; if (!nx) return;
        var free = (nx.start - endOf(b)) / MIN; if (free < g - 1) return;
        var top = (+nx.start - g * MIN - SYS.at(day, h[0])) / MIN * PPM + 1;
        out += '<span class="bk-tr" style="top:' + top.toFixed(1) + 'px;height:' + (g * PPM - 3).toFixed(1) + 'px" aria-hidden="true">Travel</span>';
      });
      return '<div class="bk-lane">' + lines + out + bs.map(function(b){ return blockHTML(b, h[0], nb, cols[b.id]); }).join('') + (bs.length ? '' : '<span class="bk-free">' + (closed(day) ? 'Closed' : 'Free all day') + '</span>') + '</div>';
    }).join('');
    var now = '';
    if (same(day, n)){
      var ny = (n - SYS.at(day, h[0])) / MIN * PPM;
      if (ny >= 0 && ny <= H) now = '<div class="bk-now" data-h0="' + h[0] + '" style="top:' + ny.toFixed(1) + 'px"><span>' + f.time(n) + '</span></div>';
    }
    var leg = '<div class="bk-leg"><span><i data-src="online"></i>Booked online</span><span><i></i>Phone, text or in person</span>' + (g ? '<span><i data-k="tr"></i>Travel, ' + g + ' min kept free</span>' : '') + '<span class="bk-sp"></span><span>Tap a booking for details</span></div>';
    return head + '<div class="bk-scroll"><div class="bk-body" id="bkLanes" style="--n:' + cols + ';height:' + H.toFixed(1) + 'px"><div class="bk-gut">' + gut + '</div>' + lanes + now + '</div></div>' + leg;
  }

  /* ---------- week view: six columns ---------- */
  function weekHTML(){
    var w0 = monday(day), n = SYS.now(), t = SYS.T;
    return '<div class="bk-week" id="bkWeek">' + [0, 1, 2, 3, 4, 5].map(function(i){
      var d = addDays(w0, i), bs = onDay(d), v = bs.reduce(function(a, b){ return a + (b.price || 0); }, 0);
      return '<div class="bk-wc"><button type="button" class="bk-wh" data-act="day" data-i="' + i + '"' + (same(d, n) ? ' data-today' : '') + '><b>' + esc(f.dow[d.getDay()] + ' ' + d.getDate()) + '</b><small>' + noun(bs.length) + (bs.length ? ' · ' + f.money(Math.round(v)) : '') + '</small></button>'
        + (bs.length ? bs.map(function(b){
          var p = SYS.person(b.pid), s = SYS.svc(b.svc);
          return '<button type="button" class="bk-wi" id="bkw-' + b.id + '" data-act="open" data-id="' + b.id + '" data-src="' + (online(b) ? 'online' : 'other') + '"' + (isDone(b) && !isLive(b) ? ' data-past' : '') + (sel === b.id || b.fresh ? ' aria-current="true"' : '') + '>'
            + '<span class="r1"><span>' + f.time(b.start) + '</span><span>' + esc(t.team.length > 1 ? b.who : '') + '</span></span><span class="sv">' + esc(s.name) + '</span><span class="cu">' + esc(p.name) + '</span></button>';
        }).join('') : '<p class="bk-we">' + (closed(d) ? 'Closed' : 'Nothing booked') + '</p>') + '</div>';
    }).join('') + '</div>';
  }

  /* ---------- phone: an agenda for the day ---------- */
  function agendaHTML(){
    var t = SYS.T, n = SYS.now(), list = onDay(day), v = list.reduce(function(a, b){ return a + (b.price || 0); }, 0), shown = false, nb = nowBooking();
    var rows = list.map(function(b){
      var p = SYS.person(b.pid), s = SYS.svc(b.svc), mark = '';
      if (!shown && same(day, n) && b.start > n){ shown = true; mark = '<div class="bk-nowr">Now ' + f.time(n) + '</div>'; }
      return mark + '<button type="button" class="row click bk-ar" id="bk-' + b.id + '" data-act="open" data-id="' + b.id + '"' + (isDone(b) && !isLive(b) ? ' data-past' : '') + (sel === b.id || b.fresh ? ' aria-current="true"' : '') + (nb === b ? ' data-now' : '') + '>'
        + '<span class="bk-at" data-src="' + (online(b) ? 'online' : 'other') + '"><b>' + f.time(b.start) + '</b><small>' + f.mins(b.mins) + '</small></span>'
        + '<span class="main-t"><span class="t1"><span class="n">' + esc(s.name) + '</span></span><span class="t2">' + esc(p.name) + ' · ' + esc(t.plates ? plate(p) : pc(p)) + '</span></span>'
        + '<span class="end">' + (t.team.length > 1 ? '<b>' + esc(b.who) + '</b>' : '') + (b.fresh ? '<span class="nw">New</span>' : (b.dep ? '<span class="dp">' + money(b.dep) + ' paid</span>' : (isLive(b) ? '<span class="nw">Now</span>' : ''))) + '</span></button>';
    }).join('');
    return '<div class="bk-ah"><b>' + esc(f.days[day.getDay()] + ' ' + day.getDate() + ' ' + f.mon[day.getMonth()]) + '</b><span>' + noun(list.length) + (list.length ? ' · ' + f.money(Math.round(v)) : '') + '</span></div>'
      + '<div class="rows bk-ag" id="bkAgenda">' + (rows || '<div class="empty">' + (closed(day) ? 'Closed on Saturdays.' : 'Nothing booked. Free all day.') + '</div>') + '</div>';
  }

  function paint(v){
    v = v || document.getElementById('view');
    if (!v || !day) return;
    v.innerHTML = statsHTML() + '<div class="card bk-cal" id="bkCal">' + barHTML() + (isPhone() ? agendaHTML() : (mode === 'week' ? weekHTML() : dayHTML())) + '</div>';
  }
  function repaint(){ if (SYS.cur !== 'booking') return; paint(); refreshDrawer(); }

  /* ---------- the booking drawer ---------- */
  function timeline(b){
    var out = [], n = SYS.now(), p = SYS.person(b.pid), t = SYS.T, c = convoFor(b), o = omw();
    var how = c && c.missed ? 'Booked from the missed-call text' : b.src === 'Booked online' ? 'Booked online' : online(b) ? 'Booked from the booking link' : ({ Phone: 'Booked by phone', Text: 'Booked by text', 'Repeat customer': 'Booked by a regular' }[b.src] || 'Booked in by ' + t.owner);
    out.push({ at: b.madeAt, text: how, sub: (b.dep ? money(b.dep) + ' deposit paid. ' : '') + 'Confirmation text sent', k: 'good' });
    if (b.orig){
      var r0 = SYS.at(addDays(SYS.sod(b.orig), -1), 18, 0);
      if (r0 > b.madeAt && r0 <= b.movedAt) out.push({ at: r0, text: 'Reminder text sent', sub: '“See you tomorrow at ' + f.time(b.orig) + '. Reply here if you need to move it.”', k: 'ac' });
    }
    var rem = SYS.at(addDays(SYS.sod(b.start), -1), 18, 0);
    if (rem > b.madeAt && (!b.movedAt || rem > b.movedAt)){
      if (rem <= n) out.push({ at: rem, text: 'Reminder text sent', sub: '“See you tomorrow at ' + f.time(b.start) + '. Reply here if you need to move it.”', k: 'ac' });
      else out.push({ at: rem, text: 'Reminder text', sub: 'Goes on its own at 18:00 the day before', due: true });
    }
    b.ev.forEach(function(e){ out.push(e); });
    if (o.auto && !b.ev.some(function(e){ return e.k === 'omw'; })){
      if (o.when(b) <= n && !b.fresh) out.push({ at: o.when(b), text: o.ev, sub: o.msg(b, p), k: 'ac' });
      else if (!isDone(b)) out.push({ text: o.ev.replace(' sent', ''), sub: o.pend, due: true });
    }
    if (isDone(b)){
      out.push({ at: b.doneAt || endOf(b), text: b.done ? 'Marked done' : 'Finished', sub: b.done ? 'By ' + b.who : '', k: 'good' });
      var a = askFor(b);
      if (a){
        if (a.st === 'due') out.push({ at: a.sendAt, text: 'Review request', sub: 'Goes on its own, two hours after the job', due: true });
        else a.ev.forEach(function(e){ out.push({ at: e.at, text: e.text, k: /stars/.test(e.text) ? 'good' : 'ac' }); });
      }
    }
    return out.sort(function(x, y){ return (x.at ? +x.at : 9e15) - (y.at ? +y.at : 9e15); });
  }
  function li(e){
    var n = SYS.now(), d = e.at && !same(e.at, n) ? f.day(e.at) : '', small = [d, e.sub].filter(Boolean).join(' · ');
    return '<li' + (e.due ? ' class="bk-due"' : '') + '><span class="tm">' + (e.at ? f.time(e.at) : '') + '</span><div class="ev" data-k="' + (e.due ? '' : (e.k === 'omw' ? 'ac' : e.k === 'move' ? '' : (e.k || ''))) + '"><b>' + esc(e.text) + '</b>' + (small ? '<small>' + esc(small) + '</small>' : '') + '</div></li>';
  }
  function bodyB(b){
    var p = SYS.person(b.pid), s = SYS.svc(b.svc), t = SYS.T;
    var state = isLive(b) ? '<span class="tag ac">On now</span>' : isDone(b) ? '<span class="tag good">Done</span>' : '<span class="tag">' + esc(f.day(b.start)) + '</span>';
    return '<div class="bk-who">' + SYS.av(p.name) + '<div class="main-t"><b>' + esc(p.name) + '</b><small>' + esc(p.phone) + '</small></div>' + state + '</div>'
      + '<dl class="kv bk-kv" id="bkKv">'
      + '<dt>Service</dt><dd>' + esc(s.name) + '</dd>'
      + '<dt>When</dt><dd>' + esc(f.when(b.start)) + ' · ' + f.mins(b.mins) + '</dd>'
      + '<dt>With</dt><dd>' + esc(b.who) + '</dd>'
      + '<dt>' + (t.plates ? 'Car' : 'Address') + '</dt><dd>' + esc(t.plates ? p.car : p.addr) + '</dd>'
      + '<dt>Price</dt><dd>' + esc(price(b)) + '</dd>'
      + '<dt>Deposit</dt><dd>' + (b.dep ? '<span class="bk-good">' + money(b.dep) + ' paid online</span>' : 'None taken') + '</dd>'
      + '<dt>Source</dt><dd>' + esc(srcLabel(b)) + '</dd>'
      + '</dl>'
      + '<p class="lbl-s bk-sh">Texts and updates</p><ul class="tl" id="bkTl">' + timeline(b).map(li).join('') + '</ul>';
  }
  function footB(b){
    var o = omw(), n = SYS.now();
    if (isDone(b)){
      var a = askFor(b), note = !a ? 'Done.' : a.st === 'due' ? 'Review request goes at ' + f.time(a.sendAt) + ', on its own.' : a.st === 'reviewed' ? 'They left a review.' : 'Review request sent.';
      return '<div class="bk-acts"><span class="note bk-fn">' + esc(note) + '</span><button type="button" class="btn" data-close>Close</button></div>';
    }
    var sent = b.ev.some(function(e){ return e.k === 'omw'; }) || (o.auto && o.when(b) <= n && !b.fresh);
    return '<div class="bk-acts">'
      + '<button type="button" class="btn" data-act="omw" id="bkOmw"' + (sent ? ' disabled' : '') + '>' + SYS.icon(sent ? 'check' : 'send') + esc(sent ? o.ev : o.btn) + '</button>'
      + '<button type="button" class="btn" data-act="move" id="bkMove">' + SYS.icon('clock') + 'Move</button>'
      + (same(b.start, n) ? '<button type="button" class="btn pri" data-act="mark" id="bkMark">' + SYS.icon('check') + 'Mark done</button>' : '')
      + '</div>';
  }
  function moveHTML(b){
    var p = SYS.person(b.pid), s = SYS.svc(b.svc);
    moveSlots = slots(b.svc, 6);
    return '<p class="note bk-mn">Pick a new time for ' + esc(SYS.first(p.name)) + '’s ' + esc(s.name.toLowerCase()) + '. Now: ' + esc(f.when(b.start)) + ' with ' + esc(b.who) + '.</p>'
      + '<div class="rows card" id="bkSlots">' + (moveSlots.length ? moveSlots.map(function(sl, i){
        return '<button type="button" class="row click" id="bkM-' + i + '" data-act="mv" data-i="' + i + '"><span class="main-t"><span class="t1"><span class="n">' + esc(f.when(sl.start)) + '</span></span><span class="t2">' + esc(sl.who) + ' · ' + f.mins(b.mins) + '</span></span>' + SYS.icon('right', 'ch') + '</button>';
      }).join('') : '<div class="empty">No free times in the next three weeks.</div>') + '</div>'
      + '<p class="note bk-mn2">They get a text with the new time straight away, and the reminder moves with it.</p>';
  }
  function openB(id){
    var b = find(id); if (!b) return;
    sel = id; b.fresh = false; dmode = 'detail'; dr = 'b';
    paint();
    SYS.drawer({ title: SYS.svc(b.svc).name, body: bodyB(b), foot: footB(b), on: tint });
  }

  /* ---------- the customer's booking page ---------- */
  function tryBody(){
    var t = SYS.T, b = '', s = tr.svc ? SYS.svc(tr.svc) : null, p = tr.p;
    if (tr.step === 'svc'){
      b = '<p class="bk-pt">What do you need?</p>' + t.services.map(function(x){
        return '<button type="button" class="bk-po" id="bkS-' + x.id + '" data-act="tSvc" data-id="' + x.id + '"><span class="main-t"><b>' + esc(x.name) + '</b><small>' + f.mins(x.mins) + (x.dep ? ' · ' + money(x.dep) + ' deposit' : ' · nothing to pay now') + '</small></span><span class="pr">' + esc(f.price(x)) + '</span></button>';
      }).join('');
    } else if (tr.step === 'time'){
      var groups = [], last = null;
      tr.slots.forEach(function(sl, i){ var k = f.day(sl.start); if (k !== last){ groups.push({ k: k, d: sl.start, items: [] }); last = k; } groups[groups.length - 1].items.push({ sl: sl, i: i }); });
      b = '<button type="button" class="bk-pback" data-act="tBack" id="bkBack">' + SYS.icon('right') + esc(s.name) + ', ' + esc(f.price(s)) + '</button><p class="bk-pt">Pick a time</p>'
        + (groups.length ? groups.map(function(g){
          return '<p class="bk-pl">' + esc(g.k === 'Today' || g.k === 'Tomorrow' ? g.k + ', ' + f.short(g.d) : f.days[g.d.getDay()] + ' ' + g.d.getDate() + ' ' + f.mon[g.d.getMonth()]) + '</p><div class="bk-chips">' + g.items.map(function(x){
            return '<button type="button" class="bk-chip" id="bkT-' + x.i + '" data-act="tTime" data-i="' + x.i + '"><b>' + f.time(x.sl.start) + '</b>' + (t.team.length > 1 ? '<small>' + esc(x.sl.who) + '</small>' : '') + '</button>';
          }).join('') + '</div>';
        }).join('') : '<p class="bk-pn">Fully booked for three weeks. Leave your number and we’ll text you.</p>');
    } else if (tr.step === 'pay'){
      b = '<button type="button" class="bk-pback" data-act="tBack" id="bkBack">' + SYS.icon('right') + 'Change time</button><p class="bk-pt">Check and ' + (s.dep ? 'pay' : 'confirm') + '</p>'
        + '<dl class="bk-sum"><div><dt>' + esc(s.name) + '</dt><dd>' + esc(f.price(s)) + '</dd></div><div><dt>' + esc(f.when(tr.slot.start)) + '</dt><dd>' + f.mins(s.mins) + '</dd></div>' + (t.team.length > 1 ? '<div><dt>With</dt><dd>' + esc(tr.slot.who) + '</dd></div>' : '') + '</dl>'
        + '<p class="bk-pl">Your details</p><p class="bk-det">' + esc(p.name) + '<br>' + esc(p.phone) + '<br>' + esc(t.plates ? p.car : p.addr) + '</p>'
        + '<p class="bk-pn">' + (s.dep ? 'The ' + money(s.dep) + ' deposit comes off the bill. Free to move up to 24 hours before.' : 'Nothing to pay now. Free to move up to 24 hours before.') + '</p>'
        + '<button type="button" class="btn ink wide bk-pay" data-act="tPay" id="bkPay">' + (s.dep ? 'Pay ' + money(s.dep) + ' deposit' : 'Confirm booking') + '</button>';
    } else {
      b = '<div class="bk-ok">' + SYS.icon('check') + '</div><p class="bk-pt">You’re booked in</p>'
        + '<p class="bk-det">' + esc(s.name) + '<br>' + esc(f.when(tr.slot.start)) + (t.team.length > 1 ? ' with ' + esc(tr.slot.who) : '') + '</p>'
        + '<p class="bk-pn">' + (s.dep ? money(s.dep) + ' deposit paid. ' : '') + 'A confirmation text is on its way to ' + esc(p.phone) + ', and you’ll get a reminder the day before.</p>';
    }
    return '<p class="note bk-tn">What a customer sees at <b class="ink2">' + esc(t.domain) + '/book</b>. The link sits on your Google profile, your website and the missed-call text.</p>'
      + SYS.phone({ title: t.biz, web: t.domain + '/book', id: 'bkPhone', body: b });
  }
  function tryFoot(){
    if (tr.step === 'done') return '<div class="bk-acts"><span class="note bk-fn">It’s in the diary now.</span><button type="button" class="btn pri" data-act="tDone" id="bkDone">See it in the diary</button></div>';
    return '<div class="bk-acts"><span class="note bk-fn">Nothing is charged. This is a demo.</span><button type="button" class="btn" data-close>Close</button></div>';
  }
  function startTry(){
    var S = SYS.S, used = {};
    S.convos.forEach(function(c){ used[c.pid] = 1; });
    var pool = S.people.filter(function(p){ return !used[p.id]; });
    tr = { step: 'svc', pool: pool.length ? pool : S.people, p: pool[(11 + tries++) % pool.length] || S.people[0] };
    dr = 'try';
    SYS.drawer({ title: 'Your booking page', body: tryBody(), foot: tryFoot(), on: tint });
  }

  function refreshDrawer(){
    if (SYS.cur !== 'booking') return;
    var d = SYS.drawerEl(); if (!d || !dr) return;
    var body = d.querySelector('.drawer-b'), foot = d.querySelector('.drawer-f');
    if (dr === 'b'){
      var b = find(sel); if (!b) return;
      var h2 = d.querySelector('.drawer-h h2'); if (h2) h2.textContent = SYS.svc(b.svc).name;
      body.innerHTML = dmode === 'move' ? moveHTML(b) : bodyB(b);
      if (foot) foot.innerHTML = dmode === 'move' ? '<div class="bk-acts"><button type="button" class="btn" data-act="back" id="bkMvBack">Back</button></div>' : footB(b);
    } else if (dr === 'try' && tr){
      body.innerHTML = tryBody(); if (foot) foot.innerHTML = tryFoot();
      body.scrollTop = 0;
    }
  }
  function scrollToBooking(id){
    var el = document.getElementById('bk-' + id) || document.getElementById('bkw-' + id);
    SYS.reveal(el);
  }

  SYS.module('booking', {
    label: 'Diary', short: 'Diary', icon: 'booking', title: 'Diary', blurb: 'Bookings, online and by phone',
    sub: function(){ return 'Customers book and pay a deposit online, day or night. Reminder texts go the day before, on their own.'; },
    count: function(){ var n = SYS.now(); var c = SYS.S.bookings.filter(function(b){ return same(b.start, n) && endOf(b) > n; }).length; return c || ''; },
    hot: function(){ return false; },
    actions: function(){ return '<button class="btn pri" type="button" data-act="try" id="bkTry">' + SYS.icon('web') + 'Book online as a customer</button>'; },
    render: function(v, opt){
      day = SYS.sod(SYS.now()); mode = 'day'; dmode = 'detail'; dr = null; tr = null; sel = null;
      var b = opt && opt.ref ? find(opt.ref) : null;
      if (b){ day = SYS.sod(b.start); sel = b.id; }
      paint(v);
      if (b){ scrollToBooking(b.id); openB(b.id); }
    },
    update: function(v){ paint(v); refreshDrawer(); },
    tick: function(v){
      var el = v.querySelector('.bk-now'); if (!el || !day) return;
      var n = SYS.now(), y = (n - SYS.at(day, +el.getAttribute('data-h0'))) / MIN * PPM;
      el.style.top = y.toFixed(1) + 'px'; if (el.firstChild) el.firstChild.textContent = f.time(n);
    },
    act: function(a, el){
      var n = SYS.now(), b = find(sel);
      if (a === 'try') return startTry();
      if (a === 'day'){ day = addDays(monday(day), +el.getAttribute('data-i')); mode = 'day'; paint(); return; }
      if (a === 'wk'){ day = addDays(day, 7 * +el.getAttribute('data-d')); if (day.getDay() === 0) day = addDays(day, -1); paint(); return; }
      if (a === 'today'){ day = SYS.sod(n); mode = 'day'; paint(); return; }
      if (a === 'mode'){ mode = el.getAttribute('data-m'); paint(); return; }
      if (a === 'open') return openB(el.getAttribute('data-id'));
      /* the customer's booking page */
      if (a === 'tSvc'){ tr.svc = el.getAttribute('data-id'); tr.slots = slots(tr.svc, 9); tr.step = 'time'; refreshDrawer(); return; }
      if (a === 'tTime'){
        tr.slot = tr.slots[+el.getAttribute('data-i')]; if (!tr.slot) return;
        var busy = {}; onDay(tr.slot.start).forEach(function(x){ busy[x.pid] = 1; });
        var free = tr.pool.filter(function(p){ return !busy[p.id]; });
        tr.p = free[(tries * 3) % (free.length || 1)] || tr.p;
        tr.step = 'pay'; refreshDrawer(); return;
      }
      if (a === 'tBack'){ tr.step = tr.step === 'pay' ? 'time' : 'svc'; refreshDrawer(); return; }
      if (a === 'tPay'){
        if (tr.step !== 'pay') return;
        var s = SYS.svc(tr.svc), nb = SYS.addBooking({ pid: tr.p.id, svc: tr.svc, start: tr.slot.start, who: tr.slot.who, src: 'Booked online' });
        tr.b = nb; tr.step = 'done'; day = SYS.sod(nb.start); mode = 'day'; sel = nb.id;
        SYS.changed();
        SYS.toast('New booking: ' + s.name + ', ' + f.when(nb.start) + (nb.dep ? ' · ' + money(nb.dep) + ' deposit paid' : ''));
        return;
      }
      if (a === 'tDone'){ var id = tr && tr.b && tr.b.id; SYS.closeDrawer(); dr = null; tr = null; if (id) scrollToBooking(id); return; }
      /* one booking */
      if (!b) return;
      if (a === 'omw'){
        var o = omw(), p = SYS.person(b.pid);
        b.ev.push({ at: n, k: 'omw', text: o.ev, sub: o.msg(b, p) });
        repaint(); SYS.toast(o.ev + ' to ' + SYS.first(p.name)); return;
      }
      if (a === 'move'){ dmode = 'move'; refreshDrawer(); return; }
      if (a === 'back'){ dmode = 'detail'; refreshDrawer(); return; }
      if (a === 'mv'){
        var sl = moveSlots[+el.getAttribute('data-i')]; if (!sl) return;
        var old = b.start, pp = SYS.person(b.pid);
        if (!b.orig) b.orig = old; b.movedAt = n;
        b.start = sl.start; b.who = sl.who;
        b.ev.push({ at: n, k: 'move', text: 'Moved from ' + f.when(old), sub: SYS.first(pp.name) + ' got a text with the new time' });
        day = SYS.sod(sl.start); dmode = 'detail';
        SYS.changed();
        SYS.toast('Moved to ' + f.when(sl.start) + ' with ' + sl.who + '. ' + SYS.first(pp.name) + ' has been texted.');
        return;
      }
      if (a === 'mark'){
        if (isDone(b)) return;
        var pm = SYS.person(b.pid), sendAt = new Date(+n + 2 * HOUR);
        b.done = true; b.doneAt = n;
        SYS.S.asks.push({ id: SYS.uid('a'), pid: b.pid, svc: b.svc, bid: b.id, done: n, st: 'due', ev: [], sendAt: sendAt });
        SYS.changed();
        SYS.toast('Done. Review request goes to ' + SYS.first(pm.name) + ' at ' + f.time(sendAt) + ', on its own.');
      }
    },
    leave: function(){ dr = null; tr = null; dmode = 'detail'; }
  });
  SYS.on(function(o){ if (o.trade){ day = null; sel = null; mode = 'day'; dr = null; tr = null; tries = 0; } });
  try { matchMedia('(max-width:760px)').addEventListener('change', function(){ if (SYS.cur === 'booking') paint(); }); } catch (e){}

  /* drawers live outside .app, so they get this business's colour here; see the core note in the report */
  function tint(d){ d.style.setProperty('--ac', SYS.T.c); d.classList.add('bk-dr'); }
  SYS.css('booking', [
    '#view[data-mod=booking],.bk-dr{--ac-soft:color-mix(in srgb,var(--ac) 8%,#fff);--ac-line:color-mix(in srgb,var(--ac) 28%,#fff);--ac-text:color-mix(in srgb,var(--ac) 88%,#000)}',
    '.bk-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}',
    '.bk-st{padding:11px 14px;border-left:1px solid var(--line2);min-width:0}',
    '.bk-st:first-child{border-left:0}',
    '.bk-st .k{display:block;font-size:12px;color:var(--ink3);font-weight:500}',
    '.bk-st .v{display:flex;align-items:baseline;gap:8px;margin-top:2px;font-size:19px;font-weight:620;letter-spacing:-.015em;font-variant-numeric:tabular-nums;line-height:1.3;white-space:nowrap;min-width:0}',
    '.bk-st .v small{font-size:12px;font-weight:450;color:var(--ink2);letter-spacing:0;overflow:hidden;text-overflow:ellipsis}',
    '.bk-cal{margin-top:14px;overflow:hidden}',
    '.bk-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;padding:9px 12px;border-bottom:1px solid var(--line2)}',
    '.bk-wk{display:flex;align-items:center;gap:2px}',
    '.bk-wk b{font-size:13px;font-weight:600;padding:0 4px;white-space:nowrap;min-width:96px;text-align:center;font-variant-numeric:tabular-nums}',
    '.bk-ic{display:grid;place-items:center;width:30px;height:30px;border-radius:var(--r);color:var(--ink2)}',
    '.bk-ic:hover{background:var(--hover);color:var(--ink)}',
    '.bk-ic.l svg,.bk-pback svg{transform:scaleX(-1)}',
    '.bk-strip{display:flex;gap:2px;padding:2px;border-radius:var(--r);background:var(--hover);border:1px solid var(--line2)}',
    '.bk-day{display:flex;flex-direction:column;align-items:flex-start;min-width:74px;padding:4px 10px;border-radius:4px;text-align:left;line-height:1.3}',
    '.bk-day b{display:flex;gap:4px;font-size:12.5px;font-weight:600;color:var(--ink2)}',
    '.bk-day small{font-size:11.5px;color:var(--ink3);font-variant-numeric:tabular-nums}',
    '.bk-day:hover b{color:var(--ink)}',
    '.bk-day[aria-pressed=true]{background:var(--panel);box-shadow:0 0 0 1px var(--line)}',
    '.bk-day[aria-pressed=true] b{color:var(--ink)}',
    '.bk-day[data-today] b,.bk-day[data-today][aria-pressed=true] b{color:var(--ac-text)}',
    '.bk-sp{flex:1}',
    /* day view */
    '.bk-lhs{display:grid;grid-template-columns:52px repeat(var(--n),minmax(0,1fr));border-bottom:1px solid var(--line2)}',
    '.bk-lh{display:flex;align-items:center;gap:8px;min-width:0;padding:8px 10px;border-left:1px solid var(--line2)}',
    '.bk-lh b{font-size:13px;font-weight:600}',
    '.bk-lh .m{font-size:12px;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bk-scroll{padding:10px 0 12px}',
    '.bk-body{position:relative;display:grid;grid-template-columns:52px repeat(var(--n),minmax(0,1fr))}',
    '.bk-gut{position:relative}',
    '.bk-gut span{position:absolute;right:9px;transform:translateY(-50%);font-size:11px;color:var(--ink3);font-variant-numeric:tabular-nums;line-height:1}',
    '.bk-lane{position:relative;border-left:1px solid var(--line2)}',
    '.bk-hl{position:absolute;left:0;right:0;height:1px;background:var(--line2)}',
    '.bk-free{position:absolute;top:10px;left:12px;font-size:12px;color:var(--ink3)}',
    '.bk-b{position:absolute;left:4px;right:5px;z-index:1;display:flex;flex-direction:column;padding:3px 7px 3px 8px;border:1px solid var(--line);border-left:2px solid var(--ink2);border-radius:4px;background:var(--panel);text-align:left;overflow:hidden;font-size:12px;line-height:15px;color:var(--ink)}',
    '.bk-b:hover{border-color:var(--ink4);border-left-color:var(--ink)}',
    '.bk-b[data-src=online]{background:var(--ac-soft);border-color:var(--ac-line);border-left-color:var(--ac)}',
    '.bk-b[data-src=online]:hover{border-color:var(--ac)}',
    '.bk-b[data-past]{opacity:.55}',
    '.bk-b[aria-current=true]{outline:2px solid var(--ac);outline-offset:1px;z-index:2;opacity:1}',
    '.bk-b .r1{display:flex;justify-content:space-between;gap:6px;font-size:11px;color:var(--ink3);font-variant-numeric:tabular-nums;white-space:nowrap;min-width:0}',
    '.bk-b .r1>span:first-child{overflow:hidden;text-overflow:ellipsis}',
    '.bk-b .r1.sv{font-size:12px;color:var(--ink)}',
    '.bk-b .sv{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bk-b .cu{color:var(--ink2);font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bk-b .pl{font-family:var(--mono);font-size:11px;letter-spacing:0;color:var(--ink)}',
    '.bk-b .dp,.bk-ag .dp{flex:none;color:var(--good);font-weight:550;font-size:11px}',
    '.bk-b .nw,.bk-ag .nw{flex:none;color:var(--ac-text);font-weight:600;font-size:11px}',
    '.bk-tr{position:absolute;left:4px;right:5px;display:flex;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:4px;font-size:10.5px;color:var(--ink4)}',
    '.bk-now{position:absolute;left:0;right:0;height:0;z-index:3;pointer-events:none}',
    '.bk-now::after{content:"";position:absolute;left:50px;right:0;top:-1px;border-top:2px solid var(--ac)}',
    '.bk-now span{position:absolute;left:0;width:46px;top:-8px;padding-right:4px;text-align:right;font-size:11px;font-weight:600;line-height:15px;color:var(--ac-text);background:var(--panel)}',
    '.bk-leg{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;padding:9px 14px;border-top:1px solid var(--line2);font-size:12px;color:var(--ink3)}',
    '.bk-leg span{display:inline-flex;align-items:center;gap:6px}',
    '.bk-leg i{width:12px;height:10px;border-radius:2px;border:1px solid var(--line);border-left:2px solid var(--ink2);background:var(--panel)}',
    '.bk-leg i[data-src=online]{background:var(--ac-soft);border-color:var(--ac-line);border-left-color:var(--ac)}',
    '.bk-leg i[data-k=tr]{border:1px dashed var(--ink4);background:none}',
    /* week view */
    '.bk-week{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}',
    '.bk-wc{min-width:0;border-left:1px solid var(--line2)}',
    '.bk-wc:first-child{border-left:0}',
    '.bk-wh{display:block;width:100%;padding:9px 10px;border-bottom:1px solid var(--line);text-align:left;background:var(--sunk)}',
    '.bk-wh:hover{background:var(--hover)}',
    '.bk-wh b{display:block;font-size:13px;font-weight:600}',
    '.bk-wh[data-today] b{color:var(--ac-text)}',
    '.bk-wh small{display:block;font-size:12px;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bk-wi{display:block;width:100%;padding:6px 9px 7px 8px;border-bottom:1px solid var(--line2);border-left:2px solid var(--ink4);text-align:left;font-size:12px;line-height:15px}',
    '.bk-wi:hover{background:var(--sunk)}',
    '.bk-wi[data-src=online]{border-left-color:var(--ac)}',
    '.bk-wi[data-past]{opacity:.55}',
    '.bk-wi[aria-current=true]{background:var(--ac-soft);opacity:1}',
    '.bk-wi .r1{display:flex;justify-content:space-between;gap:6px;color:var(--ink3);font-variant-numeric:tabular-nums}',
    '.bk-wi .sv{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bk-wi .cu{display:block;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bk-we{padding:14px 10px;font-size:12px;color:var(--ink3)}',
    /* agenda */
    '.bk-ah{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line2)}',
    '.bk-ah b{font-size:14px;font-weight:600}',
    '.bk-ah span{font-size:12.5px;color:var(--ink3)}',
    '.bk-ar{width:100%;text-align:left}',
    '.bk-at{flex:none;width:58px;padding-left:9px;border-left:2px solid var(--ink4);font-variant-numeric:tabular-nums}',
    '.bk-at b{display:block;font-family:var(--mono);font-size:13.5px;font-weight:500;letter-spacing:-.01em}',
    '.bk-at small{display:block;font-size:12px;color:var(--ink3)}',
    '.bk-at[data-src=online]{border-left-color:var(--ac)}',
    '.bk-ar[data-past]{opacity:.6}',
    '.bk-ar[aria-current=true]{background:var(--ac-soft)}',
    '.bk-ag .end{display:flex;flex-direction:column;align-items:flex-end;gap:2px}',
    '.bk-ag .end b{color:var(--ink2);font-weight:550;font-size:13px}',
    '.bk-nowr{display:flex;align-items:center;gap:8px;padding:5px 14px;font-size:12px;font-weight:600;color:var(--ac-text);border-top:1px solid var(--line2)}',
    '.bk-nowr::after{content:"";flex:1;border-top:2px solid var(--ac)}',
    /* drawer */
    '.bk-who{display:flex;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--line2)}',
    '.bk-who .main-t{flex:1;min-width:0}',
    '.bk-who b{display:block;font-weight:600}',
    '.bk-who small{display:block;font-size:12.5px;color:var(--ink2);font-variant-numeric:tabular-nums}',
    '.bk-kv{margin:14px 0 0}',
    '.bk-good{color:var(--good)}',
    '.bk-sh{margin:20px 0 4px}',
    '.tl .bk-due .ev b{font-weight:500;color:var(--ink2)}',
    '.tl .bk-due .tm{color:var(--ink4)}',
    '.bk-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-end;width:100%}',
    '.bk-fn{flex:1;min-width:140px}',
    '.bk-mn{margin-bottom:10px}',
    '.bk-mn2{margin-top:10px}',
    '#bkSlots .row{width:100%;text-align:left}',
    /* the booking page on their phone */
    '.bk-tn{margin-bottom:14px}',
    '.bk-pt{font-size:15px;font-weight:620;letter-spacing:-.01em;margin:2px 0}',
    '.bk-pl{font-size:11.5px;font-weight:550;color:var(--ink3);margin-top:4px}',
    '.bk-po{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:6px 10px;border:1px solid var(--line);border-radius:var(--r);text-align:left;background:var(--panel)}',
    '.bk-po:hover{background:var(--sunk);border-color:var(--ink4)}',
    '.bk-po .main-t{flex:1;min-width:0}',
    '.bk-po b{display:block;font-size:13px;font-weight:600;line-height:1.3}',
    '.bk-po small{display:block;font-size:11.5px;color:var(--ink3)}',
    '.bk-po .pr{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.bk-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}',
    '.bk-chip{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:44px;border:1px solid var(--line);border-radius:var(--r);background:var(--panel);font-variant-numeric:tabular-nums;line-height:1.25}',
    '.bk-chip:hover{border-color:var(--ink3)}',
    '.bk-chip b{font-size:13px;font-weight:600}',
    '.bk-chip small{font-size:11px;color:var(--ink3)}',
    '.bk-pback{display:inline-flex;align-items:center;gap:4px;align-self:flex-start;min-height:40px;margin:-8px 0 -4px;font-size:12.5px;color:var(--ink2)}',
    '.bk-pback svg{width:14px;height:14px}',
    '.bk-sum{margin:0;border:1px solid var(--line);border-radius:var(--r);padding:8px 11px;font-size:12.5px}',
    '.bk-sum div{display:flex;justify-content:space-between;gap:10px;padding:2px 0}',
    '.bk-sum dt{color:var(--ink)}',
    '.bk-sum dd{margin:0;color:var(--ink2);font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.bk-det{font-size:12.5px;line-height:1.5;color:var(--ink)}',
    '.bk-pn{font-size:12px;color:var(--ink3);line-height:1.45}',
    '.btn.bk-pay{height:44px;margin-top:4px}',
    '.bk-ok{display:grid;place-items:center;width:38px;height:38px;margin:12px 0 4px;border-radius:50%;background:var(--ink);color:#fff}',
    '.bk-ok svg{width:20px;height:20px}',
    '@media (max-width:1180px){.bk-day{min-width:62px;padding:4px 8px}.bk-wk b{min-width:84px}}',
    '@media (max-width:760px){',
    '  .bk-stats{grid-template-columns:repeat(2,minmax(0,1fr))}',
    '  .bk-st{padding:10px 12px}',
    '  .bk-st:nth-child(3){border-left:0}',
    '  .bk-st:nth-child(n+3){border-top:1px solid var(--line2)}',
    '  .bk-st .v{flex-direction:column;align-items:flex-start;gap:0;font-size:18px}',
    '  .bk-st .v small{max-width:100%}',
    '  .bk-bar{padding:8px 10px 10px}',
    '  .bk-ic{width:40px;height:40px}',
    '  .bk-bar .btn{height:40px}',
    '  .bk-strip{order:5;width:100%;display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}',
    '  .bk-day{min-width:0;align-items:center;justify-content:center;min-height:48px;padding:4px 0}',
    '  .bk-day b{flex-direction:column;align-items:center;gap:0;line-height:1.2}',
    '  .bk-day .bk-dn{font-size:11.5px;font-weight:500}',
    '  .bk-day .bk-dd{font-size:15px}',
    '  .bk-day small{display:none}',
    '  .bk-acts .btn{height:42px;flex:1 1 auto}',
    '  .bk-fn{flex-basis:100%}',
    '  #bkTry{height:42px}',
    '}'
  ].join('\n'));
})();
