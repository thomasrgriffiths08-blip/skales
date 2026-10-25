/* The system's shell: sample data seeded against the real clock, the sidebar and phone tabs, the
   business switcher, and the small helpers every part uses. Each part registers itself with SYS.module().
   Everything is in memory: reload and it starts fresh. */
(function(){
  var D = window.SYS_DATA, doc = document;
  var SYS = window.SYS = { mods: {}, order: [], cur: null, timers: [], subs: [] };

  /* ---------- helpers ---------- */
  var esc = SYS.esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function hash(s){ var h = 2166136261; for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var MIN = 60000, HOUR = 3600000, DAY = 86400000;
  SYS.MIN = MIN; SYS.HOUR = HOUR; SYS.DAY = DAY;
  /* The demo always runs on a working day. In working hours (Monday to Friday, 9:00 to 16:30) it uses the real
     time; outside them (evenings, nights, weekends) it opens at 10:40 on the next working morning, so the diary,
     the feed and "next up" are never empty. Time moves on from there as normal. */
  var REAL0 = Date.now(), START = (function(){
    var d = new Date(REAL0), h = d.getHours() + d.getMinutes() / 60, wd = d.getDay() > 0 && d.getDay() < 6;
    if (wd && h >= 9 && h < 16.5) return REAL0;
    var t = new Date(d); if (!wd || h >= 16.5) t.setDate(t.getDate() + 1);
    while (t.getDay() === 0 || t.getDay() === 6) t.setDate(t.getDate() + 1);
    t.setHours(10, 40, 0, 0); return +t;
  })();
  var now = SYS.now = function(){ return new Date(START + (Date.now() - REAL0)); };
  function at(d, h, m){ var x = new Date(d); x.setHours(h, m || 0, 0, 0); return x; }
  function sod(d){ return at(d, 0, 0); }
  SYS.sod = sod; SYS.at = at;
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var f = SYS.fmt = {
    money: function(n, o){ n = +n || 0; var dp = (o && o.dp != null) ? o.dp : (Math.round(n) === n ? 0 : 2); return (n < 0 ? '−' : '') + '£' + Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp }); },
    price: function(s){ return s.price === 0 ? 'Free' : (s.from ? 'from ' : '') + f.money(s.price); },
    time: function(d){ d = new Date(d); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
    day: function(d){ d = new Date(d); var diff = Math.round((sod(d) - sod(now())) / DAY); if (diff === 0) return 'Today'; if (diff === -1) return 'Yesterday'; if (diff === 1) return 'Tomorrow'; return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; },
    date: function(d){ d = new Date(d); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); },
    short: function(d){ d = new Date(d); return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; },
    when: function(d){ return f.day(d) + ', ' + f.time(d); },
    ago: function(d){ var s = Math.max(0, (now() - new Date(d)) / 1000); if (s < 60) return Math.round(s) + 's'; if (s < 3600) return Math.round(s / 60) + ' min'; if (s < 86400) return Math.round(s / 3600) + ' h'; return Math.round(s / 86400) + ' d'; },
    mins: function(m){ return m < 60 ? m + ' min' : (m % 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : (m / 60) + (m === 60 ? ' hour' : ' hours')); },
    dow: DOW, days: DAYS, mon: MON
  };
  SYS.initials = function(n){ return n.split(' ').filter(function(w){ return /\w/.test(w); }).map(function(w){ return w[0]; }).join('').slice(0, 2).toUpperCase(); };
  SYS.av = function(n, cls){ return '<span class="av ' + (cls || '') + '" aria-hidden="true">' + esc(SYS.initials(n)) + '</span>'; };
  SYS.first = function(n){ return n.split(' ')[0]; };

  var I = SYS.icons = {
    today: '<path d="M3 13h4l2 5 4-12 2 7h6"/>',
    inbox: '<path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/><path d="M3 13h5l1.5 3h5L16 13h5"/>',
    booking: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    quotes: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    reviews: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    reminders: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15"/><path d="M4 20v-5h5"/>',
    results: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    missed: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/><path d="M16 3l5 5M21 3l-5 5"/>',
    text: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    google: '<path d="M20 12.2c0-.6 0-1.2-.2-1.7H12v3.3h4.5a4 4 0 0 1-1.7 2.6v2.1h2.8A8.4 8.4 0 0 0 20 12.2z"/><path d="M12 20.5c2.3 0 4.2-.8 5.6-2l-2.8-2.1c-.8.5-1.7.8-2.8.8a4.9 4.9 0 0 1-4.6-3.4H4.5v2.2A8.5 8.5 0 0 0 12 20.5z"/><path d="M7.4 13.8a5 5 0 0 1 0-3.6V8H4.5a8.5 8.5 0 0 0 0 7.8z"/><path d="M12 6.9c1.3 0 2.4.4 3.3 1.3l2.5-2.5A8.4 8.4 0 0 0 4.5 8l2.9 2.2A4.9 4.9 0 0 1 12 6.9z"/>',
    fb: '<path d="M14 21v-7.5h2.6l.4-3H14V8.6c0-.9.3-1.5 1.5-1.5H17V4.4a20 20 0 0 0-2.3-.1c-2.3 0-3.8 1.4-3.8 4v2.2H8.3v3h2.6V21"/>',
    ig: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    chev: '<path d="M8 10l4 4 4-4"/>',
    right: '<path d="M10 7l5 5-5 5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    pound: '<path d="M17 19H7c2-1.5 2.5-3.5 2.5-6V9a3.5 3.5 0 0 1 6.5-1.8M7 13h7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s-6.5-5.4-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.6-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>'
  };
  SYS.icon = function(k, cls){ return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[k] || '') + '</svg>'; };
  var CH = SYS.CH = { call: ['Phone call', 'call'], missed: ['Missed call', 'missed'], text: ['Text', 'text'], web: ['Website form', 'web'], google: ['Google profile', 'google'], fb: ['Facebook', 'fb'], ig: ['Instagram', 'ig'] };
  SYS.chIcon = function(ch, missed){ var c = CH[missed ? 'missed' : ch] || CH.text; return '<span class="ch" title="' + c[0] + '">' + SYS.icon(c[1]) + '</span>'; };

  /* ---------- seeding ---------- */
  function seed(t){
    var R = rng(hash(t.key + '/v3')), n = now(), today = sod(n);
    var pick = function(a){ return a[Math.floor(R() * a.length)]; };
    var svc = {}; t.services.forEach(function(s){ svc[s.id] = s; });
    t.svc = svc;
    // people
    var used = {}, people = [];
    var PLATES = 'ABDEFGHJKLMNOPRSTVWXY';
    while (people.length < 44){
      var nm = pick(D.first) + ' ' + pick(D.last); if (used[nm]) continue; used[nm] = 1;
      var p = { id: 'p' + people.length, name: nm, phone: '07700 900' + String(100 + Math.floor(R() * 899)), addr: (2 + Math.floor(R() * 140)) + ' ' + pick(t.streets) + ', ' + pick(t.pc) };
      if (t.plates) p.car = pick(['Ford Fiesta', 'VW Golf', 'Vauxhall Corsa', 'Ford Focus', 'Toyota Yaris', 'Nissan Qashqai', 'Kia Sportage', 'BMW 1 Series', 'Skoda Octavia', 'Honda Jazz']) + ' · ' + 'R' + pick(['A', 'V', 'K', 'E']) + (15 + Math.floor(R() * 9)) + ' ' + pick(PLATES) + pick(PLATES) + pick(PLATES);
      people.push(p);
    }
    var pi = 0, nextP = function(){ return people[pi++ % people.length]; };
    var S = { t: t, people: people, convos: [], bookings: [], quotes: [], reviews: [], asks: [], due: [], ids: 1 };
    S.byId = function(id){ for (var i = 0; i < people.length; i++) if (people[i].id === id) return people[i]; return null; };

    // bookings: this week, Monday to Saturday, one column per team member
    var mon = new Date(today); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    var travel = /heating|electrical|cleaning/.test(t.key) ? 30 : (t.key === 'garage' ? 15 : 0);
    var weights = t.services.map(function(s){ return s.price === 0 ? 1 : (s.mins > 200 ? 1 : 3); });
    var wsum = weights.reduce(function(a, b){ return a + b; }, 0);
    var wpick = function(){ var r = R() * wsum; for (var i = 0; i < weights.length; i++){ r -= weights[i]; if (r <= 0) return t.services[i]; } return t.services[0]; };
    for (var d = 0; d < 6; d++){
      var day = new Date(mon); day.setDate(mon.getDate() + d);
      var endH = d === 5 ? 13 : (t.key === 'salon' ? 18 : 17);
      if (d === 5 && t.key === 'clinic') continue;
      t.team.forEach(function(who, wi){
        var cur = at(day, t.key === 'salon' ? 9 : 8, wi * 15 % 30);
        while (true){
          if (R() < 0.16) cur = new Date(+cur + (30 + Math.floor(R() * 3) * 30) * MIN);
          var s = wpick(); var end = new Date(+cur + s.mins * MIN);
          if (end > at(day, endH, 0)) break;
          var p = nextP(), online = s.dep > 0 && R() < 0.62;
          var b = { id: 'b' + (S.ids++), pid: p.id, svc: s.id, start: new Date(cur), mins: s.mins, who: who, price: s.price, dep: online ? s.dep : 0, src: online ? 'Booked online' : pick(['Phone', 'Phone', 'Text', 'Repeat customer']), madeAt: new Date(+cur - (2 + Math.floor(R() * 12)) * DAY - Math.floor(R() * 600) * MIN), ev: [] };
          S.bookings.push(b);
          cur = new Date(+end + travel * MIN);
        }
      });
    }
    // a few made overnight and this morning, so Today shows work booked while the phone was off
    var future = S.bookings.filter(function(b){ return b.start > n && b.dep; });
    [[-10 * 60 - 47, 0], [-4 * 60 - 12, 1], [-63, 2]].forEach(function(o, i){ var b = future[i * 3 + 2]; if (b){ b.madeAt = new Date(+n + o[0] * MIN); b.src = 'Booked online'; } });

    // inbox
    var plan = [
      { ago: 168, missed: 1, auto: 9, reply: 6, us: 22, st: 'booked' },
      { ago: 18, st: 'new' },
      { ago: 95, us: 12, back: 30, st: 'booked' },
      { ago: 41, st: 'new' },
      { ago: 240, us: 35, st: 'quoted' },
      { ago: 28, missed: 1, auto: 8, reply: 3, st: 'new' },
      { ago: 1100, us: 40, st: 'booked' }
    ];
    t.asks.forEach(function(a, i){
      var pl = plan[i] || { ago: 300 + i * 90, st: 'closed' }, p = nextP(), t0 = new Date(+n - pl.ago * MIN), s = svc[a.svc];
      var c = { id: 'c' + (S.ids++), pid: p.id, ch: a.ch, svc: a.svc, missed: !!pl.missed, at: t0, st: pl.st, msgs: [], src: { call: 'Phone', text: 'Text', web: 'Website', google: 'Google profile', fb: 'Facebook', ig: 'Instagram' }[a.ch] };
      if (pl.missed){
        c.msgs.push({ k: 'sys', text: 'Missed call', at: t0 });
        c.msgs.push({ k: 'auto', text: SYS.autoText(t), at: new Date(+t0 + pl.auto * 1000) });
        c.msgs.push({ k: 'them', text: a.text, at: new Date(+t0 + pl.reply * MIN) });
      } else c.msgs.push({ k: 'them', text: a.text, at: t0 });
      if (pl.us){
        var reply = pl.st === 'quoted' ? 'Thanks ' + SYS.first(p.name) + '. I’ll put a written price together and send it over today.' : 'Thanks ' + SYS.first(p.name) + '. You can pick a time that suits here and it’s confirmed straight away: ' + t.domain + '/book';
        c.msgs.push({ k: 'us', text: reply, at: new Date(+t0 + pl.us * MIN), who: t.owner });
        if (pl.back) c.msgs.push({ k: 'them', text: 'Done, booked for ' + (s.dep ? 'Thursday. Paid the deposit.' : 'Thursday.') + ' Thanks!', at: new Date(+t0 + pl.back * MIN) });
      }
      if (pl.st === 'booked'){
        var slot = S.bookings.filter(function(b){ return b.start > n; })[3 + i];
        if (slot){ slot.pid = p.id; slot.svc = a.svc; slot.mins = s.mins; slot.price = s.price; slot.dep = s.dep; slot.src = c.src; slot.madeAt = c.msgs[c.msgs.length - 1].at; c.bid = slot.id; c.msgs.push({ k: 'sys', text: 'Booked: ' + s.name + ', ' + f.when(slot.start), at: slot.madeAt }); }
      }
      S.convos.push(c);
    });

    // quotes
    var qplan = [
      { st: 'accepted', sent: -3 * DAY - 5 * HOUR, opens: 2, chase: -50 * MIN - 0, ok: -38 * MIN },
      { st: 'opened', sent: -18 * HOUR, opens: 3 },
      { st: 'sent', sent: -40 * MIN, opens: 0, convo: 4 },
      { st: 'paid', sent: -9 * DAY, opens: 2, ok: -7 * DAY, paid: -2 * DAY, tpl: 0 },
      { st: 'draft', tpl: 1 }
    ];
    qplan.forEach(function(qp, i){
      var tpl = t.quotes[qp.tpl != null ? qp.tpl : i] || t.quotes[0];
      var p = qp.convo != null && S.convos[qp.convo] ? S.byId(S.convos[qp.convo].pid) : nextP();
      var q = { id: 'q' + (S.ids++), no: 'Q-' + (1040 + i * 7), pid: p.id, title: tpl.title, svc: tpl.svc, items: tpl.items.map(function(x){ return { name: x[0], qty: x[1], rate: x[2] }; }), st: qp.st, ev: [], vat: t.key !== 'clinic' };
      if (qp.sent != null){
        var s0 = new Date(+n + qp.sent); q.sentAt = s0;
        q.ev.push({ at: s0, text: 'Sent by text and email', k: 'send' });
        for (var o = 0; o < qp.opens; o++) q.ev.push({ at: new Date(+s0 + (40 + o * 300) * MIN * (o ? 1 : .05)), text: o ? 'Opened again' : 'Opened by ' + SYS.first(p.name), k: 'open' });
        if (qp.chase != null) q.ev.push({ at: new Date(+n + qp.chase - 20 * MIN), text: 'Chased automatically: “Just checking you got the quote”', k: 'chase' });
        if (qp.ok != null) q.ev.push({ at: new Date(+n + qp.ok), text: 'Accepted, deposit paid', k: 'ok' });
        if (qp.paid != null) q.ev.push({ at: new Date(+n + qp.paid), text: 'Final invoice paid', k: 'paid' });
        if (qp.st === 'opened') q.nextChase = at(new Date(+n + DAY), 9, 0);
        if (qp.st === 'sent') q.nextChase = at(new Date(+n + 2 * DAY), 9, 0);
      }
      if (qp.convo != null && S.convos[qp.convo]) S.convos[qp.convo].qid = q.id;
      S.quotes.push(q);
    });

    // reviews and asks
    var rAgo = [2, 5, 9, 16];
    t.reviews.forEach(function(r, i){
      var p = nextP();
      S.reviews.push({ id: 'r' + (S.ids++), pid: p.id, s: r.s, text: r.t, at: new Date(+n - rAgo[i] * DAY - (3 + i) * HOUR), reply: i === 0 ? '' : 'Thanks ' + SYS.first(p.name) + ', really glad it went well. ' + t.owner });
    });
    S.rating = { hist: [4.1, 4.2, 4.4, 4.5, 4.7, 4.8], count: [31, 35, 41, 46, 52, 58] };
    var done = S.bookings.filter(function(b){ return +b.start + b.mins * MIN < +n; }).slice(-6);
    var askSt = ['reviewed', 'opened', 'sent', 'sent', 'due', 'due'];
    done.forEach(function(b, i){
      var end = new Date(+b.start + b.mins * MIN);
      var a = { id: 'a' + (S.ids++), pid: b.pid, svc: b.svc, done: end, st: askSt[i] || 'due', ev: [] };
      if (a.st !== 'due'){ a.sentAt = new Date(+end + 2 * HOUR); a.ev.push({ at: a.sentAt, text: 'Review request sent' }); }
      else a.sendAt = new Date(Math.max(+end + 2 * HOUR, +n + 20 * MIN));
      if (a.st === 'opened' || a.st === 'reviewed') a.ev.push({ at: new Date(+a.sentAt + 25 * MIN), text: 'Opened the link' });
      if (a.st === 'reviewed') a.ev.push({ at: new Date(+a.sentAt + 31 * MIN), text: 'Left 5 stars on Google' });
      S.asks.push(a);
    });

    // reminders: work that comes round again
    var rec = t.services.filter(function(s){ return s.every; });
    var offs = [-11, -6, -3, -1, 0, 2, 4, 6, 9, 12, 15, 19, 24, 29];
    offs.forEach(function(o, i){
      var s = rec[i % rec.length], p = people[(i * 5 + 7) % people.length];
      var lead = /w$/.test(s.every) ? 7 : 14, due = at(new Date(+today + o * DAY), 9, 0), textAt = new Date(+due - lead * DAY);
      var r = { id: 'd' + (S.ids++), pid: p.id, svc: s.id, due: due, textAt: textAt, lead: lead, last: SYS.prev(due, s.every), st: textAt < n ? (R() < 0.45 ? 'booked' : 'sent') : 'waiting', ev: [] };
      if (r.st !== 'waiting') r.ev.push({ at: textAt, text: 'Reminder sent' });
      if (r.st === 'booked') r.ev.push({ at: new Date(+textAt + (1 + Math.floor(R() * 40)) * HOUR), text: 'Booked from the link' });
      S.due.push(r);
    });
    // a couple go out this morning so Today has them
    S.due.filter(function(r){ return r.st === 'waiting'; }).slice(0, 2).forEach(function(r, i){ r.textAt = at(today, 9, i * 2); if (r.textAt < n){ r.st = 'sent'; r.ev = [{ at: r.textAt, text: 'Reminder sent' }]; } });

    // results: this month and the five before it, by where the work came from
    var base = { heating: 118, electrical: 104, garage: 146, salon: 210, cleaning: 96, clinic: 132 }[t.key] || 110;
    var conv = { 'Google profile': .58, 'Google Ads': .44, 'Website': .52, 'Meta ads': .31, 'Instagram': .48, 'Recommended': .71, 'Repeat customer': .86 };
    var avg = t.services.filter(function(s){ return s.price; }).reduce(function(a, s){ return a + s.price; }, 0) / t.services.filter(function(s){ return s.price; }).length;
    S.results = { months: [], spend: t.spend, avg: avg };
    for (var m = 5; m >= 0; m--){
      var k = 1 - m * 0.075 + (R() - .5) * .04, rows = [];
      t.book.forEach(function(x){
        var e = Math.round(base * k * x.w / 100), b = Math.round(e * (conv[x.m] || .5) * (1 - m * .03)), v = Math.round(b * avg * (0.85 + R() * .35));
        rows.push({ m: x.m, enq: e, booked: b, value: v, spend: t.spend[x.m] ? Math.round(t.spend[x.m] * (1 - m * .04)) : 0 });
      });
      var md = new Date(today.getFullYear(), today.getMonth() - m, 1);
      S.results.months.push({ label: MON[md.getMonth()], year: md.getFullYear(), rows: rows });
    }
    return S;
  }
  SYS.prev = function(d, every){ var x = new Date(d), n = parseInt(every, 10), u = every.slice(-1); if (u === 'm') x.setMonth(x.getMonth() - n); else if (u === 'y') x.setFullYear(x.getFullYear() - n); else if (u === 'w') x.setDate(x.getDate() - n * 7); return x; };
  SYS.everyText = function(e){ var n = parseInt(e, 10), u = e.slice(-1); return u === 'm' ? (n === 12 ? 'every year' : 'every ' + n + ' months') : u === 'y' ? 'every ' + n + ' years' : 'every ' + n + ' weeks'; };
  SYS.autoText = function(t){ return 'Hi, it’s ' + t.owner + ' at ' + t.biz + '. Sorry I missed your call, I’m on a ' + t.noun + '. What can I help with? Or book a time here: ' + t.domain + '/book'; };
  SYS.svc = function(id){ return SYS.T.svc[id]; };
  SYS.person = function(id){ return SYS.S.byId(id); };
  SYS.uid = function(p){ return p + (SYS.S.ids++); };
  /* the next free slots for a service across the team, from two hours ahead, in working hours */
  SYS.freeSlots = function(svcId, count, fromDate){
    var S = SYS.S, t = SYS.T, s = t.svc[svcId], out = [], n = SYS.now();
    var from = fromDate ? new Date(fromDate) : new Date(+n + 2 * HOUR);
    var startH = t.key === 'salon' ? 9 : 8, endH = t.key === 'salon' ? 18 : 17, gap = /heating|electrical|cleaning/.test(t.key) ? 30 : 0;
    for (var d = 0; d < 21 && out.length < (count || 6); d++){
      var day = sod(new Date(+from + d * DAY)); if (day.getDay() === 0 || (t.key === 'clinic' && day.getDay() === 6)) continue;
      var lastH = day.getDay() === 6 ? 13 : endH;
      for (var mm = startH * 60; mm + s.mins <= lastH * 60 && out.length < (count || 6); mm += 30){
        var st = at(day, Math.floor(mm / 60), mm % 60), en = new Date(+st + s.mins * MIN);
        if (st < from) continue;
        for (var w = 0; w < t.team.length; w++){
          var who = t.team[w];
          var clash = S.bookings.some(function(b){ if (b.who !== who) return false; var bs = +b.start - gap * MIN, be = +b.start + (b.mins + gap) * MIN; return +st < be && +en > bs; });
          if (!clash){ out.push({ start: st, who: who }); mm += 60; break; }
        }
      }
    }
    return out;
  };
  SYS.addBooking = function(o){
    var s = SYS.T.svc[o.svc], b = { id: 'b' + (SYS.S.ids++), pid: o.pid, svc: o.svc, start: o.start, mins: s.mins, who: o.who || SYS.T.team[0], price: s.price, dep: o.dep != null ? o.dep : s.dep, src: o.src || 'Booked online', madeAt: SYS.now(), ev: [], fresh: true };
    SYS.S.bookings.push(b); return b;
  };
  SYS.quoteTotal = function(q){ var net = q.items.reduce(function(a, x){ return a + x.qty * x.rate; }, 0); var vat = q.vat ? net * .2 : 0; return { net: net, vat: vat, total: net + vat }; };

  /* events from every part, for Today */
  SYS.events = function(from){
    var S = SYS.S, out = [], P = SYS.person;
    from = from || sod(now());
    S.convos.forEach(function(c){ var p = P(c.pid); c.msgs.forEach(function(m){
      if (m.at < from || m.at > now()) return;
      if (m.k === 'sys' && m.text === 'Missed call') out.push({ at: m.at, mod: 'inbox', ref: c.id, k: 'warn', text: 'Missed call from ' + p.name, sub: SYS.CH[c.ch] ? '' : '' });
      else if (m.k === 'auto') out.push({ at: m.at, mod: 'inbox', ref: c.id, k: 'ac', text: 'Text sent ' + Math.round((m.at - c.at) / 1000) + ' seconds later', sub: 'Automatic, while the phone was in a pocket' });
      else if (m.k === 'sys' && /^Booked/.test(m.text)) out.push({ at: m.at, mod: 'booking', ref: c.bid, k: 'good', text: p.name + ' booked', sub: m.text.replace('Booked: ', '') });
      else if (m.k === 'them' && m === c.msgs[0]) out.push({ at: m.at, mod: 'inbox', ref: c.id, text: 'New enquiry from ' + p.name, sub: (SYS.CH[c.ch] || [''])[0] });
    }); });
    S.bookings.forEach(function(b){ if (b.madeAt >= from && b.madeAt <= now() && b.src === 'Booked online') out.push({ at: b.madeAt, mod: 'booking', ref: b.id, k: 'good', text: 'Booked online: ' + SYS.svc(b.svc).name, sub: P(b.pid).name + ' · ' + f.when(b.start) + (b.dep ? ' · ' + f.money(b.dep) + ' deposit paid' : '') }); });
    S.quotes.forEach(function(q){ q.ev.forEach(function(e){ if (e.at >= from && e.at <= now()) out.push({ at: e.at, mod: 'quotes', ref: q.id, k: e.k === 'ok' || e.k === 'paid' ? 'good' : (e.k === 'chase' ? 'ac' : ''), text: q.no + ' ' + e.text.charAt(0).toLowerCase() + e.text.slice(1), sub: P(q.pid).name + ' · ' + f.money(SYS.quoteTotal(q).total) }); }); });
    S.asks.forEach(function(a){ a.ev.forEach(function(e){ if (e.at >= from && e.at <= now()) out.push({ at: e.at, mod: 'reviews', ref: a.id, k: /stars/.test(e.text) ? 'good' : '', text: e.text, sub: P(a.pid).name }); }); });
    S.reviews.forEach(function(r){ if (r.at >= from && r.at <= now()) out.push({ at: r.at, mod: 'reviews', ref: r.id, k: 'good', text: r.s + '-star review from ' + P(r.pid).name, sub: 'Google' }); });
    S.due.forEach(function(r){ r.ev.forEach(function(e){ if (e.at >= from && e.at <= now()) out.push({ at: e.at, mod: 'reminders', ref: r.id, k: /Booked/.test(e.text) ? 'good' : 'ac', text: e.text + ': ' + SYS.svc(r.svc).name, sub: P(r.pid).name }); }); });
    out.sort(function(a, b){ return b.at - a.at; });
    return out;
  };

  /* ---------- pub/sub and timers ---------- */
  /* a part's own styles, added once */
  SYS.css = function(id, text){ if (doc.getElementById('css-' + id)) return; var st = doc.createElement('style'); st.id = 'css-' + id; st.textContent = text; doc.head.appendChild(st); };
  SYS.on = function(fn){ SYS.subs.push(fn); };
  SYS.changed = function(opts){ renderNav(); SYS.subs.forEach(function(fn){ try { fn(opts || {}); } catch (e){ console.error(e); } }); if (!(opts && opts.quiet)) SYS.refresh(); };
  SYS.later = function(ms, fn){ var id = setTimeout(function(){ SYS.timers = SYS.timers.filter(function(x){ return x !== id; }); fn(); }, ms); SYS.timers.push(id); return id; };
  function clearTimers(){ SYS.timers.forEach(clearTimeout); SYS.timers = []; }

  /* ---------- toast, drawer, menu ---------- */
  var toastEl, toastT;
  /* bring something into view within the app only: scrollIntoView would also scroll any page the app is framed in */
  SYS.reveal = function(el){
    if (!el) return;
    var r = el.getBoundingClientRect();
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement){
      var o = getComputedStyle(p).overflowY;
      if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight){ p.scrollTop += r.top - p.getBoundingClientRect().top - (p.clientHeight - r.height) / 2; return; }
    }
    window.scrollBy(0, r.top - (innerHeight - r.height) / 2);
  };
  SYS.toast = function(msg){ if (!toastEl){ toastEl = doc.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); doc.body.appendChild(toastEl); } toastEl.innerHTML = '<span class="dot"></span>' + esc(msg); toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('on'); }, 2600); };
  var dr, scrim;
  SYS.drawer = function(o){
    SYS.closeDrawer(true);
    scrim = doc.createElement('div'); scrim.className = 'scrim'; scrim.addEventListener('click', function(){ SYS.closeDrawer(); });
    dr = doc.createElement('aside'); dr.className = 'drawer'; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-label', o.title || '');
    dr.innerHTML = '<div class="drawer-h"><h2>' + esc(o.title || '') + '</h2><button class="x" type="button" data-close aria-label="Close">' + SYS.icon('x') + '</button></div><div class="drawer-b">' + (o.body || '') + '</div>' + (o.foot ? '<div class="drawer-f">' + o.foot + '</div>' : '');
    doc.body.appendChild(scrim); doc.body.appendChild(dr);
    dr.addEventListener('click', function(e){ if (e.target.closest('[data-close]')) SYS.closeDrawer(); });
    if (o.on) o.on(dr);
    requestAnimationFrame(function(){ scrim.classList.add('on'); dr.classList.add('on'); });
    return dr;
  };
  SYS.closeDrawer = function(now_){ if (!dr) return; var a = dr, b = scrim; dr = scrim = null; if (now_){ a.remove(); b.remove(); return; } a.classList.remove('on'); b.classList.remove('on'); setTimeout(function(){ a.remove(); b.remove(); }, 260); };
  SYS.drawerEl = function(){ return dr; };
  doc.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ SYS.closeDrawer(); closeMenu(); } });

  /* the customer's phone, for the parts where what they see matters */
  SYS.phone = function(o){
    var n = now();
    return '<div class="phone" aria-label="What the customer sees"><div class="phone-sb"><span>' + f.time(n) + '</span><span>5G</span></div>'
      + '<div class="phone-h">' + (o.av ? SYS.av(o.av, 'sm') : '') + '<div><b>' + esc(o.title) + '</b>' + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</div></div>'
      + '<div class="phone-b" ' + (o.id ? 'id="' + o.id + '"' : '') + '>' + (o.body || '') + '</div></div>' + (o.cap ? '<p class="phone-cap">' + esc(o.cap) + '</p>' : '');
  };

  /* ---------- shell ---------- */
  var app, side, nav, tabs, top, view, mtop;
  SYS.module = function(id, def){ def.id = id; SYS.mods[id] = def; SYS.order.push(id); };
  var TAB_MAIN = ['today', 'inbox', 'booking', 'quotes'];

  function bizBtn(cls){
    var t = SYS.T;
    return '<button class="biz ' + (cls || '') + '" type="button" data-biz aria-haspopup="menu" aria-label="Switch business: ' + esc(t.biz) + '"><span class="biz-mark">' + esc(t.mark) + '</span><span class="biz-txt"><span class="biz-name">' + esc(t.biz) + '</span><span class="biz-trade">' + esc(t.label) + ' · ' + esc(t.town) + '</span></span>' + SYS.icon('chev', 'biz-chev') + '</button>';
  }
  function renderNav(){
    if (!nav) return;
    nav.innerHTML = SYS.order.map(function(id){
      var m = SYS.mods[id], c = m.count ? m.count() : '';
      return '<button class="nav-i" type="button" data-go="' + id + '"' + (SYS.cur === id ? ' aria-current="page"' : '') + '>' + SYS.icon(m.icon || id) + '<span class="lbl">' + esc(m.label) + '</span>' + (c !== '' && c != null ? '<span class="ct' + (m.hot && m.hot() ? ' hot' : '') + '">' + c + '</span>' : '') + '</button>';
    }).join('');
    var inMore = TAB_MAIN.indexOf(SYS.cur) < 0;
    tabs.innerHTML = TAB_MAIN.map(function(id){
      var m = SYS.mods[id]; if (!m) return ''; var c = m.hot && m.hot() ? m.count() : '';
      return '<button class="tab" type="button" data-go="' + id + '"' + (SYS.cur === id ? ' aria-current="page"' : '') + '>' + SYS.icon(m.icon || id) + '<span>' + esc(m.short || m.label) + '</span>' + (c ? '<span class="tc">' + c + '</span>' : '') + '</button>';
    }).join('') + '<button class="tab" type="button" data-more' + (inMore ? ' aria-current="page"' : '') + '>' + SYS.icon(inMore ? (SYS.mods[SYS.cur].icon || SYS.cur) : 'more') + '<span>' + (inMore ? esc(SYS.mods[SYS.cur].short || SYS.mods[SYS.cur].label) : 'More') + '</span></button>';
    side.querySelector('.biz-slot').innerHTML = bizBtn();
    mtop.innerHTML = bizBtn() + '<span class="demo-note"><span class="live">Live</span></span>';
  }
  SYS.go = function(id, opt){
    if (!SYS.mods[id]) id = SYS.order[0];
    var m = SYS.mods[id];
    if (SYS.cur && SYS.mods[SYS.cur].leave) SYS.mods[SYS.cur].leave();
    SYS.cur = id; SYS.opt = opt || {};
    SYS.closeDrawer(true); closeMenu();
    renderNav();
    renderTop();
    view.scrollTop = 0; window.scrollTo(0, 0);
    view.innerHTML = '';
    view.setAttribute('data-mod', id);
    m.render(view, SYS.opt);
    try { doc.title = m.label + ' · ' + SYS.T.biz; } catch (e){}
  };
  function renderTop(){
    var m = SYS.mods[SYS.cur];
    top.innerHTML = '<div><h1>' + esc(m.title || m.label) + '</h1>' + (m.sub ? '<p class="sub">' + m.sub() + '</p>' : '') + '</div><div class="acts">' + (m.actions ? m.actions() : '') + '</div>';
  }
  SYS.refresh = function(){ if (!SYS.cur) return; var y = window.scrollY; renderTop(); var m = SYS.mods[SYS.cur]; if (m.update) m.update(view, SYS.opt); else { view.innerHTML = ''; m.render(view, SYS.opt); } window.scrollTo(0, y); };

  var menuEl;
  function closeMenu(){ if (menuEl){ menuEl.remove(); menuEl = null; } }
  function openBizMenu(btn){
    closeMenu();
    var r = btn.getBoundingClientRect();
    menuEl = doc.createElement('div'); menuEl.className = 'menu'; menuEl.setAttribute('role', 'menu');
    menuEl.innerHTML = '<div class="mh">Show the system for</div>' + D.trades.map(function(t){
      return '<button type="button" role="menuitemradio" aria-checked="' + (t.key === SYS.T.key) + '" data-trade="' + t.key + '" style="--ac:' + t.c + '"><span class="biz-mark">' + esc(t.mark) + '</span><span><b>' + esc(t.biz) + '</b><small>' + esc(t.label) + ' · ' + esc(t.town) + '</small></span></button>';
    }).join('');
    doc.body.appendChild(menuEl);
    var w = Math.max(r.width, 260), left = Math.min(r.left, innerWidth - w - 8);
    menuEl.style.left = Math.max(8, left) + 'px'; menuEl.style.top = (r.bottom + 6) + 'px'; menuEl.style.width = w + 'px';
    menuEl.addEventListener('click', function(e){ var b = e.target.closest('[data-trade]'); if (b){ SYS.setTrade(b.getAttribute('data-trade')); closeMenu(); } });
  }
  function openMore(){
    var extra = SYS.order.filter(function(id){ return TAB_MAIN.indexOf(id) < 0; });
    SYS.drawer({ title: 'More', body: '<div class="rows card">' + extra.map(function(id){ var m = SYS.mods[id], c = m.count ? m.count() : ''; return '<button class="row click" type="button" data-go="' + id + '" style="width:100%;text-align:left"><span class="ch" style="color:var(--ac)">' + SYS.icon(m.icon || id) + '</span><span class="main-t"><span class="t1">' + esc(m.label) + '</span><span class="t2">' + esc(m.blurb || '') + '</span></span><span class="end">' + (c !== '' && c != null ? c : '') + '</span></button>'; }).join('') + '</div>' });
  }

  SYS.setTrade = function(key){
    var t = D.trades.filter(function(x){ return x.key === key; })[0] || D.trades[0];
    clearTimers();
    SYS.T = t; SYS.S = seed(t);
    document.documentElement.style.setProperty('--ac', t.c);
    try { localStorage.setItem('sk-sys-trade', t.key); } catch (e){}
    SYS.subs.forEach(function(fn){ try { fn({ trade: true }); } catch (e){} });
    SYS.go(SYS.cur || SYS.start);
  };

  SYS.boot = function(){
    app = doc.createElement('div'); app.className = 'app';
    app.innerHTML = '<aside class="side" aria-label="Sections"><div class="biz-slot"></div><nav class="nav"></nav><div class="side-foot"><span class="live">Live</span> · sample data<br>Built for this business by <b>Skales</b></div></aside>'
      + '<div class="main"><div class="mtop"></div><header class="top"></header><main class="view" id="view"></main></div><nav class="tabs" aria-label="Sections"></nav>';
    doc.body.appendChild(app);
    side = app.querySelector('.side'); nav = app.querySelector('.nav'); tabs = app.querySelector('.tabs'); top = app.querySelector('.top'); view = app.querySelector('.view'); mtop = app.querySelector('.mtop');
    // one listener for the whole page: sections, the switcher, More, and each part's own [data-act] buttons (drawers included)
    doc.addEventListener('click', function(e){
      if (menuEl && !e.target.closest('.menu') && !e.target.closest('[data-biz]')) closeMenu();
      var a = e.target.closest('[data-act]');
      if (a && SYS.cur && SYS.mods[SYS.cur].act){ SYS.mods[SYS.cur].act(a.getAttribute('data-act'), a, e); return; }
      var g = e.target.closest('[data-go]'); if (g){ SYS.go(g.getAttribute('data-go'), { ref: g.getAttribute('data-ref') || '' }); return; }
      var b = e.target.closest('[data-biz]'); if (b){ openBizMenu(b); return; }
      if (e.target.closest('[data-more]')) openMore();
    });
    var q = /[?&]t=([a-z]+)/.exec(location.search), saved = null;
    try { saved = localStorage.getItem('sk-sys-trade'); } catch (e){}
    SYS.start = doc.body.getAttribute('data-start') || 'today';
    SYS.cur = SYS.start;
    SYS.setTrade((q && q[1]) || saved || 'heating');
    setInterval(function(){ if (SYS.mods[SYS.cur] && SYS.mods[SYS.cur].tick) SYS.mods[SYS.cur].tick(view); }, 1000);
  };
  // run after every part has registered
  doc.addEventListener('DOMContentLoaded', function(){ SYS.boot(); });
})();
