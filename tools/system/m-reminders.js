/* Reminders: work that comes round again (a yearly boiler service, an MOT, a six-weekly cut). A text goes out
   before it's due with a link to book, and most of it books itself. */
(function(){
  var f = SYS.fmt, esc = SYS.esc, DAY = SYS.DAY;
  var lead = null, open = null, slots = [], fresh = {};
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var GROUPS = [['waiting', 'Due soon'], ['sent', 'Sent'], ['booked', 'Booked']];

  function isPhone(){ return matchMedia('(max-width:760px)').matches; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function lc(s){ return s.length > 1 && /[a-z]/.test(s.charAt(1)) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function short(n){ return n.replace(/\s*\(.*?\)/g, '').split(',')[0]; }
  function dm(d){ d = new Date(d); return d.getDate() + ' ' + f.mon[d.getMonth()]; }
  function rel(d){ var n = Math.round((SYS.sod(d) - SYS.sod(SYS.now())) / DAY); if (n === 0) return 'today'; if (n === 1) return 'tomorrow'; if (n === -1) return 'yesterday'; if (n < 0) return -n + ' days ago'; return n < 14 ? 'in ' + n + ' days' : 'in ' + Math.round(n / 7) + ' weeks'; }
  function mark(id){ fresh[id] = 1; SYS.later(1600, function(){ delete fresh[id]; }); }
  function rec(id){ return SYS.S.due.filter(function(r){ return r.id === id; })[0]; }
  function cycle(e){ var n = parseInt(e, 10), u = e.slice(-1); return u === 'w' ? n * 7 : u === 'm' ? n * 30 : n * 365; }

  /* lead time: weeks for yearly work, days for work that comes round every few weeks */
  function opts(){ var S = SYS.S, wk = S.due.filter(function(r){ return /w$/.test(SYS.svc(r.svc).every); }).length; return wk > S.due.length / 2 ? [[3, '3 days'], [7, '1 week'], [14, '2 weeks']] : [[14, '2 weeks'], [21, '3 weeks'], [28, '4 weeks']]; }
  function curLead(){ if (lead == null) lead = opts()[0][0] === 3 ? 7 : 14; return lead; }
  function leadTxt(){ var l = curLead(), o = opts().filter(function(x){ return x[0] === l; })[0]; return o ? o[1] : l + ' days'; }
  function eff(r){ return Math.min(curLead(), Math.floor(cycle(SYS.svc(r.svc).every) / 2)); }
  function goesAt(r){ return SYS.at(new Date(+r.due - eff(r) * DAY), 9, 0); }
  function sentAt(r){ var e = r.ev.filter(function(x){ return /sent/.test(x.text); }); return e.length ? e[e.length - 1].at : r.textAt; }

  function remText(r){
    var t = SYS.T, p = SYS.person(r.pid), s = SYS.svc(r.svc), nm = lc(short(s.name)), n = SYS.first(p.name), d = new Date(r.due);
    if (/w$/.test(s.every)) return 'Hi ' + n + ', it’s nearly ' + parseInt(s.every, 10) + ' weeks since your last ' + nm + '. Want to book the next one? Pick a time here and it’s confirmed straight away: ' + t.domain + '/book\nThanks, ' + t.owner;
    var car = t.plates && p.car ? ' for ' + p.car.split('· ')[1] : '';
    return 'Hi ' + n + ', your ' + nm + car + ' is due on ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + '. Pick a time that suits here and it’s booked straight away: ' + t.domain + '/book\nThanks, ' + t.owner;
  }

  /* repeat work this year: the repeat customers in Results, months before May filled in at the same trend, plus anything booked here */
  function yearRepeat(){
    var S = SYS.S, n = SYS.now(), y = n.getFullYear(), v = 0, jobs = 0, first = null, fi = 0;
    S.results.months.forEach(function(m){
      if (m.year !== y) return; var r = m.rows.filter(function(x){ return x.m === 'Repeat customer'; })[0]; if (!r) return;
      v += r.value; jobs += r.booked; if (!first){ first = r; fi = f.mon.indexOf(m.label); }
    });
    for (var k = 1; first && k <= fi; k++){ var w = Math.pow(0.93, k); v += Math.round(first.value * w); jobs += Math.round(first.booked * w); }
    S.bookings.forEach(function(b){ if (b.src === 'From reminder'){ v += b.price || 0; jobs++; } });
    return { v: v, jobs: jobs };
  }
  function topHTML(){
    var S = SYS.S, n = SYS.sod(SYS.now()), by = function(st){ return S.due.filter(function(r){ return r.st === st; }).length; };
    var soon = S.due.filter(function(r){ return r.due >= n && r.due < +n + 28 * DAY; }).length, w = by('waiting'), s = by('sent'), b = by('booked'), y = yearRepeat();
    return '<div class="card rm-top" id="rmTop">'
      + '<div class="stat"><span class="k">Due in the next 4 weeks</span><span class="v">' + soon + '</span><span class="d">' + (w ? w + ' not texted yet' : 'All texted') + '</span></div>'
      + '<div class="stat"><span class="k">Texted, not booked yet</span><span class="v">' + s + '</span><span class="d">One nudge a week later</span></div>'
      + '<div class="stat"><span class="k">Booked from a reminder</span><span class="v">' + b + '</span><span class="d">' + Math.round(b / Math.max(1, s + b) * 100) + '% of reminders sent</span></div>'
      + '<div class="stat" id="rmYear"><span class="k">Repeat work booked this year</span><span class="v">' + f.money(y.v) + '</span><span class="d">' + y.jobs + ' jobs since January</span></div></div>';
  }

  function status(r){
    if (r.st === 'waiting'){ var g = goesAt(r); return '<span class="tag" data-s="wait">' + (g <= SYS.now() ? 'Goes today' : 'Text goes ' + dm(g)) + '</span>'; }
    if (r.st === 'sent'){ var sa = sentAt(r); return '<span class="tag">Sent ' + (f.day(sa) === 'Today' ? 'today' : dm(sa)) + '</span>'; }
    return '<span class="tag good">Booked' + (r.bookedFor ? ' ' + dm(r.bookedFor) : '') + '</span>';
  }
  function row(r){
    var p = SYS.person(r.pid), s = SYS.svc(r.svc), t = SYS.T;
    return '<button class="row click rm-row' + (open === r.id ? ' sel' : '') + (fresh[r.id] ? ' new-in' : '') + '" type="button" data-act="open" data-id="' + r.id + '" id="rm-' + r.id + '">'
      + '<span class="rm-who">' + SYS.av(p.name) + '<span class="main-t"><span class="t1"><span class="n">' + esc(p.name) + '</span></span>'
      + '<span class="t2 hide-m">' + esc(t.plates && p.car ? p.car : p.addr) + '</span><span class="t2 only-m">' + esc(short(s.name)) + ' · due ' + esc(dm(r.due)) + '</span></span></span>'
      + '<span class="main-t hide-m"><span class="t1"><span class="n">' + esc(s.name) + '</span></span><span class="t2">' + esc(cap(SYS.everyText(s.every))) + ' · last ' + esc(new Date(r.last).getFullYear() === SYS.now().getFullYear() ? dm(r.last) : f.date(r.last)) + '</span></span>'
      + '<span class="main-t hide-m"><span class="t1">' + esc(dm(r.due)) + '</span><span class="t2">' + esc(rel(r.due)) + '</span></span>'
      + '<span class="rm-st">' + status(r) + '</span></button>';
  }
  function listCard(){
    var S = SYS.S, notes = { waiting: 'Texts go ' + leadTxt() + ' before', sent: 'Waiting for them to book', booked: 'From the link, or booked by you' };
    var body = GROUPS.map(function(g){
      var list = S.due.filter(function(r){ return r.st === g[0]; }).sort(function(a, b){ return a.due - b.due; });
      return '<div class="rm-gh"><b>' + g[1] + '</b><span class="rm-ct">' + list.length + '</span><span class="note">' + notes[g[0]] + '</span></div>'
        + (list.length ? list.map(row).join('') : '<div class="empty rm-empty">' + (g[0] === 'waiting' ? 'Nothing waiting. Every reminder has gone out.' : 'None yet.') + '</div>');
    }).join('');
    return '<div class="card"><div class="card-h"><h2>Coming round again</h2><span class="meta">' + S.due.length + ' customers</span></div>'
      + '<div class="rm-cols hide-m"><span>Customer</span><span>Work</span><span>Due</span><span>Status</span></div>'
      + '<div class="rows" id="rmList">' + body + '</div></div>';
  }
  function phoneFor(r){
    var t = SYS.T, when = r.st === 'waiting' ? 'Goes ' + f.when(goesAt(r)) : f.when(sentAt(r));
    var body = '<div class="sys">' + esc(when) + '</div><div class="msg">' + esc(remText(r)) + '</div>';
    if (r.st === 'booked') body += '<div class="sys">' + SYS.icon('check') + 'Booked from the link' + (r.bookedFor ? ' · ' + esc(f.when(r.bookedFor)) : '') + '</div>';
    return SYS.phone({ title: t.biz, sub: 'Text message', av: t.biz.replace(/ & /g, ' '), body: body, cap: 'The link opens the diary with this job picked, so it takes them a few taps.' });
  }
  function leadSeg(){ return '<div class="seg" role="group" aria-label="Send reminders" id="rmLead">' + opts().map(function(o){ return '<button type="button" data-act="lead" data-d="' + o[0] + '" aria-pressed="' + (o[0] === curLead()) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function previewCard(){
    var S = SYS.S, r = S.due.filter(function(x){ return x.st === 'waiting'; }).sort(function(a, b){ return a.due - b.due; })[0] || S.due.filter(function(x){ return x.st === 'sent'; })[0] || S.due[0];
    return '<div class="card" id="rmPreview"><div class="card-h"><h2>How it goes out</h2></div>'
      + '<div class="rm-pw"><div class="card-b rm-set"><div class="rm-lead"><span>Send</span>' + leadSeg() + '<span>before</span></div>'
      + '<p class="note">If they don’t book, one nudge goes a week later. Then it stops, so nobody gets pestered.</p></div>'
      + '<div class="card-b rm-pv">' + (r ? phoneFor(r) : '') + '</div></div></div>';
  }

  function hist(r){
    var s = SYS.svc(r.svc), ev = [{ at: r.last, text: 'Last ' + lc(short(s.name)), sub: f.date(r.last) + ' · ' + SYS.T.team[0] }];
    r.ev.forEach(function(e){ ev.push({ at: e.at, text: e.text, k: /Booked/.test(e.text) ? 'good' : 'ac', sub: e.sub }); });
    if (r.st === 'waiting') ev.push({ at: goesAt(r), text: 'Text goes', sub: leadTxt() + ' before it’s due', k: 'warn' });
    if (r.st === 'sent'){ var nd = new Date(+sentAt(r) + 7 * DAY); if (nd > SYS.now()) ev.push({ at: nd, text: 'Nudge goes if they haven’t booked', k: 'warn' }); }
    ev.push({ at: r.due, text: 'Due', sub: f.date(r.due) });
    ev.sort(function(a, b){ return a.at - b.at; });
    var y = SYS.now().getFullYear();
    return '<ul class="tl rm-tl">' + ev.map(function(e){ return '<li><span class="tm">' + (new Date(e.at).getFullYear() === y ? dm(e.at) : new Date(e.at).getFullYear()) + '</span><div class="ev" data-k="' + (e.k || '') + '"><b>' + esc(e.text) + '</b>' + (e.sub ? '<small>' + esc(e.sub) + '</small>' : '') + '</div></li>'; }).join('') + '</ul>';
  }
  function drawerHTML(r){
    var s = SYS.svc(r.svc), p = SYS.person(r.pid), from = Math.max(+SYS.now() + 2 * SYS.HOUR, +SYS.at(new Date(+r.due - 7 * DAY), 8, 0)), book;
    if (r.st === 'booked') book = '<p class="note">' + (r.bookedFor ? 'In the diary for ' + esc(f.when(r.bookedFor)) + '.' : 'Booked from the link.') + ' They get a reminder the day before.</p>';
    else {
      slots = SYS.freeSlots(r.svc, 4, from);
      book = '<div class="rows card" id="rmBook">' + slots.map(function(sl, i){ return '<button class="row click rm-slot" type="button" data-act="pick" data-i="' + i + '"><span class="main-t"><span class="t1">' + esc(f.when(sl.start)) + '</span><span class="t2">' + esc(sl.who) + ' · ' + f.mins(s.mins) + ' · ' + esc(f.price(s)) + '</span></span>' + SYS.icon('right') + '</button>'; }).join('') + '</div>'
        + '<p class="note rm-n">' + (r.due > SYS.now() ? 'Free times near the due date.' : 'The next free times.') + ' They get a text with the time and a link to move it.</p>';
    }
    return '<div class="rm-dr" data-id="' + r.id + '"><dl class="kv">'
      + '<dt>Work</dt><dd>' + esc(s.name) + '</dd><dt>Comes round</dt><dd>' + esc(cap(SYS.everyText(s.every))) + '</dd>'
      + '<dt>Last done</dt><dd>' + esc(f.date(r.last)) + '</dd><dt>Due</dt><dd>' + esc(f.date(r.due)) + ', ' + esc(rel(r.due)) + '</dd>'
      + '<dt>' + (SYS.T.plates ? 'Car' : 'Address') + '</dt><dd>' + esc(SYS.T.plates && p.car ? p.car : p.addr) + '</dd><dt>Status</dt><dd>' + status(r) + '</dd></dl>'
      + '<p class="lbl-s rm-h">The text</p>' + phoneFor(r)
      + '<p class="lbl-s rm-h">History</p>' + hist(r)
      + '<p class="lbl-s rm-h">Book them in</p>' + book + '</div>';
  }
  function drawerFoot(r){ return r.st === 'waiting' ? '<button class="btn rm-act" type="button" data-close>Close</button><button class="btn pri rm-act" type="button" data-act="sendOne" id="rmSendOne">' + SYS.icon('send') + 'Send it now</button>' : ''; }
  function openDrawer(id){
    var r = rec(id); if (!r) return; open = id;
    SYS.drawer({ title: SYS.person(r.pid).name, body: drawerHTML(r), foot: drawerFoot(r) });
    var v = document.getElementById('view'); if (v) v.querySelectorAll('.rm-row').forEach(function(x){ x.classList.toggle('sel', x.getAttribute('data-id') === id); });
  }

  function paint(v){
    v.innerHTML = '<div class="rm">' + topHTML() + '<div class="split rm-split"><div class="grid">' + listCard() + '</div><div class="grid">' + previewCard() + '</div></div></div>';
    var dr = SYS.drawerEl(), db = dr && dr.querySelector('.rm-dr');
    if (db){ var r = rec(db.getAttribute('data-id')); if (r){ db.outerHTML = drawerHTML(r); var ft = dr.querySelector('.drawer-f'); if (ft && r.st !== 'waiting') ft.remove(); } }
    else open = null;
  }

  function sendOne(r, n){ r.st = 'sent'; r.textAt = n; r.ev.push({ at: n, text: 'Reminder sent' }); mark(r.id); }
  function book(r, sl, text){
    var b = SYS.addBooking({ pid: r.pid, svc: r.svc, start: sl.start, who: sl.who, src: 'From reminder' });
    r.st = 'booked'; r.bid = b.id; r.bookedFor = sl.start; r.ev.push({ at: SYS.now(), text: text, sub: f.when(sl.start) + ' with ' + sl.who }); mark(r.id);
    return b;
  }
  function sendAll(){
    var S = SYS.S, n = SYS.now(), w = S.due.filter(function(r){ return r.st === 'waiting'; }).sort(function(a, b){ return a.due - b.due; });
    if (!w.length) return;
    w.forEach(function(r){ sendOne(r, n); });
    SYS.toast(w.length === 1 ? '1 reminder sent' : w.length + ' reminders sent');
    SYS.changed();
    /* one or two reply and book: the new ones first, then the oldest still waiting on a reply */
    var older = S.due.filter(function(r){ return r.st === 'sent' && w.indexOf(r) < 0; }).sort(function(a, b){ return a.due - b.due; });
    var go = w.slice(0, 2).concat(older).slice(0, 2), done = 0;
    go.forEach(function(r, i){
      SYS.later(3200 + i * 2600, function(){
        if (r.st !== 'sent') return;
        var sl = SYS.freeSlots(r.svc, 1, Math.max(+SYS.now() + 2 * SYS.HOUR, +SYS.at(new Date(+r.due - 7 * DAY), 8, 0)))[0]; if (!sl) return;
        book(r, sl, 'Booked from the link'); done++;
        SYS.toast(i === go.length - 1 && done > 1 ? done + ' booked from reminders' : SYS.person(r.pid).name + ' booked: ' + SYS.svc(r.svc).name + ', ' + f.when(sl.start));
        SYS.changed();
      });
    });
  }

  SYS.module('reminders', {
    label: 'Reminders', short: 'Reminders', icon: 'reminders', title: 'Reminders', blurb: 'Repeat work that books itself',
    sub: function(){ return 'Repeat work that books itself. A text goes out before it’s due, with a link to book.'; },
    count: function(){ return SYS.S.due.filter(function(r){ return r.st === 'waiting'; }).length; },
    hot: function(){ return false; },
    actions: function(){ var w = SYS.S.due.filter(function(r){ return r.st === 'waiting'; }).length; return '<button class="btn pri rm-act" type="button" data-act="send" id="rmSend"' + (w ? '' : ' disabled') + '>' + SYS.icon('send') + 'Send due reminders' + (w ? ' · ' + w : '') + '</button>'; },
    render: function(v, opt){
      paint(v);
      var ref = opt && opt.ref; if (ref && rec(ref)){ var el = document.getElementById('rm-' + ref); if (el) el.scrollIntoView({ block: 'center' }); openDrawer(ref); }
    },
    update: function(v){ paint(v); },
    act: function(a, el){
      if (a === 'send') return sendAll();
      if (a === 'open') return openDrawer(el.getAttribute('data-id'));
      if (a === 'lead'){ lead = +el.getAttribute('data-d'); SYS.refresh(); return; }
      var r = rec(open); if (!r) return;
      if (a === 'sendOne'){ sendOne(r, SYS.now()); SYS.toast('Reminder sent to ' + SYS.person(r.pid).name); SYS.changed(); return; }
      if (a === 'pick'){
        var sl = slots[+el.getAttribute('data-i')]; if (!sl) return;
        book(r, sl, 'Booked by ' + SYS.T.owner); SYS.closeDrawer(); open = null;
        SYS.toast('In the diary: ' + f.when(sl.start) + ' with ' + sl.who); SYS.changed();
      }
    },
    leave: function(){ open = null; }
  });
  SYS.on(function(o){ if (o.trade){ lead = null; open = null; slots = []; fresh = {}; } });

  SYS.css('reminders', [
    '.rm-top{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}',
    '.rm-top>.stat{border-left:1px solid var(--line2);min-width:0}',
    '.rm-top>.stat:first-child{border-left:0}',
    '.rm-split{margin-top:14px}',
    '@media (max-width:1180px){.split.rm-split{grid-template-columns:minmax(0,1fr) 340px}}',
    '@media (max-width:1140px){.split.rm-split{grid-template-columns:minmax(0,1fr)}}',
    '@media (min-width:761px) and (max-width:1140px){.rm-pw{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.rm-pw .rm-pv{border-top:0;border-left:1px solid var(--line2);border-radius:0 0 var(--r) 0}}',
    '.rm-cols,.rm-row{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1.25fr) 84px 128px;gap:12px;align-items:center}',
    '.rm-cols{padding:7px 14px;border-bottom:1px solid var(--line2);background:var(--sunk);font-size:11.5px;font-weight:550;color:var(--ink3)}',
    '.rm-cols span:last-child,.rm-st{text-align:right}',
    '.rm-row{width:100%;text-align:left}',
    '.rm-who{display:flex;align-items:center;gap:10px;min-width:0}',
    '.rm-row>.main-t .t1{font-weight:450}',
    '.rm-gh{display:flex;align-items:baseline;gap:8px;padding:14px 14px 6px;border-top:1px solid var(--line2)}',
    '.rm-gh:first-child{border-top:0;padding-top:10px}',
    '.rm-gh b{font-size:12.5px;font-weight:600}',
    '.rm-gh .rm-ct{font-size:12px;color:var(--ink3);font-variant-numeric:tabular-nums}',
    '.rm-gh .note{margin-left:auto}',
    '.rm-gh+.row{border-top:0}',
    '.rm-empty{padding:10px 14px 16px;text-align:left}',
    '.rm .tag[data-s=wait]{color:var(--ac-text);border-color:var(--ac-line)}',
    '.rm-dr .tag[data-s=wait]{color:var(--ac-text);border-color:var(--ac-line)}',
    '.rm-set{display:flex;flex-direction:column;gap:10px}',
    '.rm-lead{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--ink2)}',
    '.rm-pv{background:var(--sunk);border-top:1px solid var(--line2);border-radius:0 0 var(--r) var(--r)}',
    '.rm-dr .kv{padding-bottom:14px;border-bottom:1px solid var(--line2)}',
    '.rm-dr .kv dd .tag{vertical-align:middle}',
    '.rm-h{margin:18px 0 8px}',
    '.rm-tl .tm{white-space:nowrap}',
    '.rm-slot{width:100%;text-align:left}',
    '.rm-n{margin-top:8px}',
    '@media (max-width:1180px){.rm-cols,.rm-row{grid-template-columns:minmax(0,1.1fr) minmax(0,1.2fr) 70px 118px}}',
    '@media (max-width:1060px){.rm-top{grid-template-columns:repeat(2,minmax(0,1fr))}.rm-top>.stat:nth-child(3){border-left:0}.rm-top>.stat:nth-child(n+3){border-top:1px solid var(--line2)}}',
    '@media (max-width:760px){',
    '  .rm-row{grid-template-columns:minmax(0,1fr) auto}',
    '  .rm-row .t2{white-space:normal}',
    '  .rm-row.sel{background:none;box-shadow:none}',
    '  .rm-gh{flex-wrap:wrap;row-gap:0}',
    '  .rm .seg button,.btn.rm-act,.rm-dr .btn.sm{height:40px}',
    '  .rm-lead .seg{flex:1}',
    '  .rm-lead .seg button{flex:1}',
    '}'
  ].join('\n'));
})();
