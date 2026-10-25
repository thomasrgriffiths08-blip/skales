/* Inbox: every call, text, form and message in one list. A missed call gets a text back in seconds;
   the reply lands here; one tap sends the booking link and the booking drops into the diary. */
(function(){
  var f = SYS.fmt, esc = SYS.esc;
  var sel = null, filter = 'need', phoneView = false, sim = null, typing = {};
  var REPLIES = [
    function(t, s){ return 'Hi, yes please. ' + s.name + ' if you have anything this week?'; },
    function(t, s){ return 'Thanks for getting back. Need a ' + s.name.toLowerCase() + ', what’s the earliest you can do?'; }
  ];
  function needs(c){ return c.st === 'new'; }
  function lastThem(c){ var m = c.msgs.filter(function(m){ return m.k === 'them'; }); return m.length ? m[m.length - 1] : null; }
  function lastMsg(c){ for (var i = c.msgs.length - 1; i >= 0; i--) if (c.msgs[i].k !== 'sys' || /^Booked/.test(c.msgs[i].text)) return c.msgs[i]; return c.msgs[0] || { k: 'sys', text: '', at: c.at }; }
  function sorted(){
    var list = SYS.S.convos.slice().sort(function(a, b){ return lastMsg(b).at - lastMsg(a).at; });
    return filter === 'need' ? list.filter(function(c){ return needs(c) || c === sim; }) : list;
  }
  function status(c){
    if (c.ring) return '<span class="tag">Ringing</span>';
    if (c.countdown != null) return '<span class="tag ac" data-cd>Texting in ' + c.countdown + 's</span>';
    if (c.st === 'booked') return '<span class="tag good">Booked</span>';
    if (c.st === 'quoted') return '<span class="tag">Quote sent</span>';
    if (c.st === 'closed') return '<span class="tag">Done</span>';
    var lt = lastThem(c); return lt ? '<span class="tag warn" data-wait="' + (+lt.at) + '">Waiting ' + f.ago(lt.at) + '</span>' : '';
  }
  function row(c){
    var p = SYS.person(c.pid), m = lastMsg(c), txt = c.ring ? 'Calling…' : (m.k === 'auto' ? 'Auto text: ' : m.k === 'us' ? 'You: ' : '') + m.text;
    return '<button class="row click' + (sel === c.id ? ' sel' : '') + (c.fresh ? ' new-in' : '') + '" type="button" data-act="open" data-id="' + c.id + '" style="width:100%;text-align:left">'
      + SYS.av(p.name) + '<span class="main-t"><span class="t1">' + SYS.chIcon(c.ch, c.missed) + '<span class="n">' + esc(p.name) + '</span></span><span class="t2">' + esc(txt) + '</span></span>'
      + '<span class="end"><span style="display:block;margin-bottom:4px">' + (c.ring ? 'now' : f.ago(m.at)) + '</span>' + status(c) + '</span></button>';
  }
  function listHTML(){
    var all = SYS.S.convos, need = all.filter(needs).length, list = sorted();
    return '<div class="card-h"><div class="seg" role="group" aria-label="Show"><button type="button" data-act="filter" data-f="need" aria-pressed="' + (filter === 'need') + '">Needs reply · ' + need + '</button><button type="button" data-act="filter" data-f="all" aria-pressed="' + (filter === 'all') + '">All · ' + all.length + '</button></div></div>'
      + '<div class="rows" id="inList">' + (list.length ? list.map(row).join('') : '<div class="empty">Nothing waiting. Every message has an answer.</div>') + '</div>';
  }
  function msgHTML(m, c){
    if (m.k === 'sys') return '<div class="sys">' + (/^Booked/.test(m.text) ? SYS.icon('check') : SYS.icon('missed')) + esc(m.text) + ' · ' + f.time(m.at) + '</div>';
    var cls = m.k === 'them' ? '' : (m.k === 'auto' ? 'auto' : 'us');
    var meta = m.k === 'auto' ? 'Sent automatically ' + Math.round((m.at - c.at) / 1000) + 's after the call · ' + f.time(m.at) : (m.k === 'us' ? (m.who || SYS.T.owner) + ' · ' + f.time(m.at) : f.time(m.at));
    return '<div class="msg ' + cls + '">' + esc(m.text) + '</div><div class="msg-meta' + (m.k === 'them' ? '' : ' r') + '">' + esc(meta) + '</div>';
  }
  function threadHTML(c){
    if (!c) return '<div class="empty" style="padding:80px 20px">Pick a conversation.</div>';
    var p = SYS.person(c.pid), s = SYS.svc(c.svc), t = SYS.T;
    var head = '<div class="card-h"><div style="display:flex;gap:10px;align-items:center;min-width:0">' + SYS.av(p.name) + '<div style="min-width:0"><h2>' + esc(p.name) + '</h2><span class="meta">' + esc(p.phone) + ' · ' + esc(t.plates ? p.car : p.addr) + '</span></div></div>'
      + '<div style="display:flex;gap:6px;align-items:center"><span class="tag hide-m">' + esc(c.src) + '</span>' + (c.missed ? '<button class="btn sm" type="button" data-act="phone" id="inPhone" aria-pressed="' + phoneView + '">' + SYS.icon('eye') + (phoneView ? 'Back to thread' : 'What they see') + '</button>' : '') + '</div></div>';
    var body;
    if (phoneView){
      var sms = c.msgs.filter(function(m){ return m.k !== 'sys'; }).map(function(m){ return '<div class="msg ' + (m.k === 'them' ? 'us' : '') + '">' + esc(m.text) + '</div>'; }).join('');
      body = '<div class="card-b" style="background:var(--sunk)">' + SYS.phone({ title: t.biz, sub: 'Text message', av: t.biz, body: sms, cap: 'Their phone. The first text arrived before they had put the phone down.' }) + '</div>';
    } else {
      body = '<div class="thread" id="inThread">' + c.msgs.map(function(m){ return msgHTML(m, c); }).join('') + (typing[c.id] ? '<div class="typing" aria-label="Typing"><i></i><i></i><i></i></div>' : '') + '</div>';
    }
    var can = c.st !== 'booked' && !c.ring && c.countdown == null;
    var foot = '<div style="border-top:1px solid var(--line2);padding:12px 14px;background:var(--sunk)">'
      + (s ? '<p class="note" style="margin-bottom:8px">Looks like: <b class="ink2">' + esc(s.name) + '</b> · ' + esc(f.price(s)) + (s.dep ? ' · ' + f.money(s.dep) + ' deposit online' : '') + '</p>' : '')
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'
      + '<button class="btn sm' + (can ? ' pri' : '') + '" type="button" data-act="link" id="inLink"' + (can ? '' : ' disabled') + '>' + SYS.icon('send') + 'Send booking link</button>'
      + '<button class="btn sm" type="button" data-act="book" id="inBook"' + (can ? '' : ' disabled') + '>' + SYS.icon('booking') + 'Book them in</button>'
      + '<button class="btn sm" type="button" data-act="quote" id="inQuote">' + SYS.icon('quotes') + 'Write a quote</button>'
      + '</div><div style="display:flex;gap:8px"><input class="inp" id="inText" placeholder="Reply to ' + esc(SYS.first(p.name)) + '…" autocomplete="off"><button class="btn ink" type="button" data-act="send" aria-label="Send">' + SYS.icon('send') + '</button></div></div>';
    return head + body + foot;
  }
  function layout(v){
    var c = SYS.S.convos.filter(function(x){ return x.id === sel; })[0];
    v.innerHTML = '<div class="inbox card"><div class="in-list">' + listHTML() + '</div><div class="in-thread hide-m">' + threadHTML(c) + '</div></div>';
    scrollThread(v);
  }
  function scrollThread(root){ var th = (root || document).querySelector('#inThread'); if (th) th.scrollTop = th.scrollHeight; }
  function isPhone(){ return matchMedia('(max-width:760px)').matches; }
  function openPhoneThread(){
    var c = cur(); if (!c) return;
    SYS.drawer({ title: SYS.person(c.pid).name, body: '<div class="in-thread" style="margin:-16px;height:calc(100% + 32px)">' + threadHTML(c) + '</div>' });
    scrollThread(SYS.drawerEl());
  }
  function cur(){ return SYS.S.convos.filter(function(x){ return x.id === sel; })[0]; }
  function repaint(){
    var v = document.getElementById('view');
    if (SYS.cur !== 'inbox'){ SYS.changed({ quiet: true }); return; }
    var keep = document.getElementById('inText'), val = keep ? keep.value : '', had = keep && document.activeElement === keep;
    var l = v.querySelector('.in-list'); if (l) l.innerHTML = listHTML();
    var th = v.querySelector('.in-thread'); if (th) th.innerHTML = threadHTML(cur());
    var d = SYS.drawerEl(); if (d){ var dt = d.querySelector('.in-thread'); if (dt) dt.innerHTML = threadHTML(cur()); }
    var ni = document.getElementById('inText'); if (ni){ ni.value = val; if (had) ni.focus(); }
    scrollThread(v); if (d) scrollThread(d);
    SYS.changed({ quiet: true });
  }
  function say(c, k, text, extra){ var m = { k: k, text: text, at: SYS.now() }; if (extra) for (var x in extra) m[x] = extra[x]; c.msgs.push(m); return m; }

  /* the whole thing, on a button: rings out, counts down, texts, the customer replies.
     On the desk (SYS.desk) the customer is a real phone beside the laptop: it rings longer, and the replies and
     the booking come from that phone instead of being made up here. */
  function simulate(){
    if (sim && (sim.ring || sim.countdown != null)) return;
    var S = SYS.S, t = SYS.T, used = S.convos.map(function(c){ return c.pid; }), desk = SYS.desk;
    var p = S.people.filter(function(x){ return used.indexOf(x.id) < 0; })[0] || S.people[0];
    var svcs = t.services.filter(function(s){ return s.price; }), s = desk ? t.svc[desk.svc()] : svcs[S.convos.length % svcs.length];
    var c = { id: SYS.uid('c'), pid: p.id, ch: 'call', svc: s.id, missed: true, at: SYS.now(), st: 'new', msgs: [], src: 'Phone', ring: true, fresh: true, desk: !!desk };
    S.convos.push(c); sim = c; sel = c.id; filter = 'need'; phoneView = false;
    repaint(); if (desk) desk.emit('ring', { name: p.name });
    SYS.later(desk ? 3600 : 1500, function(){
      c.ring = false; c.countdown = 4; say(c, 'sys', 'Missed call'); c.at = c.msgs[0].at; repaint();
      if (desk) desk.emit('missed', { at: +c.at });
      SYS.later(4000, function(){
        c.countdown = null; var m = say(c, 'auto', SYS.autoText(t)); c.fresh = false; repaint();
        SYS.toast('Text sent 4 seconds after the missed call');
        if (desk){ desk.emit('sms', { text: m.text, auto: true }); return; }
        SYS.later(2500, function(){ typing[c.id] = true; repaint(); });
        SYS.later(6000, function(){ typing[c.id] = false; say(c, 'them', REPLIES[S.convos.length % 2](t, s)); repaint(); });
      });
    });
  }
  function sendLink(c){
    var t = SYS.T, s = SYS.svc(c.svc), p = SYS.person(c.pid);
    var m = say(c, 'us', 'Hi ' + SYS.first(p.name) + ', thanks. Pick any free time here and it’s confirmed straight away: ' + t.domain + '/book', { who: t.owner });
    c.st = 'replied'; repaint();
    if (c.desk && SYS.desk){ SYS.desk.emit('sms', { text: m.text, link: t.domain + '/book', svc: c.svc }); return; }
    SYS.later(2200, function(){ typing[c.id] = true; repaint(); });
    SYS.later(5200, function(){
      var slot = SYS.freeSlots(c.svc, 1)[0]; typing[c.id] = false;
      if (!slot){ repaint(); return; }
      var b = SYS.addBooking({ pid: c.pid, svc: c.svc, start: slot.start, who: slot.who, src: c.src });
      say(c, 'them', 'Booked for ' + f.when(slot.start).replace('Tomorrow', 'tomorrow') + (b.dep ? '. Paid the deposit.' : '.') + ' Thanks!');
      say(c, 'sys', 'Booked: ' + s.name + ', ' + f.when(slot.start)); c.bid = b.id; c.st = 'booked';
      repaint(); SYS.toast('Booked: ' + s.name + ', ' + f.when(slot.start) + (b.dep ? ' · ' + f.money(b.dep) + ' deposit paid' : ''));
    });
  }
  /* for the desk: the phone beside the laptop replies, and books from the link */
  SYS.inbox = {
    simulate: simulate,
    convo: function(){ return sim; },
    reply: function(text){
      var c = sim; if (!c) return; say(c, 'them', text); c.st = 'new'; sel = c.id; repaint();
      if (SYS.cur === 'inbox' && isPhone() && !SYS.drawerEl()) openPhoneThread();
    },
    link: function(){ var c = sim; if (c && c.st !== 'booked') sendLink(c); },
    booked: function(b, text){
      var c = sim; if (!c) return; var s = SYS.svc(b.svc);
      say(c, 'sys', 'Booked: ' + s.name + ', ' + f.when(b.start)); c.bid = b.id; c.st = 'booked';
      if (text) say(c, 'auto', text);
      repaint();
    }
  };
  function bookDrawer(c){
    var s = SYS.svc(c.svc), slots = SYS.freeSlots(c.svc, 8), p = SYS.person(c.pid);
    SYS.drawer({ title: 'Book ' + p.name + ' in', body: '<div class="field" style="margin-bottom:14px"><label for="bkSvc">Service</label><select class="inp" id="bkSvc">' + SYS.T.services.map(function(x){ return '<option value="' + x.id + '"' + (x.id === c.svc ? ' selected' : '') + '>' + esc(x.name) + ' · ' + esc(f.price(x)) + '</option>'; }).join('') + '</select></div><p class="lbl-s" style="margin-bottom:8px">Next free times</p><div class="rows card">' + slots.map(function(sl, i){ return '<button class="row click" type="button" data-act="pick" data-i="' + i + '" style="width:100%;text-align:left"><span class="main-t"><span class="t1">' + esc(f.when(sl.start)) + '</span><span class="t2">' + esc(sl.who) + ' · ' + f.mins(s.mins) + '</span></span>' + SYS.icon('right') + '</button>'; }).join('') + '</div><p class="note" style="margin-top:10px">They get a confirmation text with the time, the price and a link to move it.</p>' });
    bookDrawer.slots = slots; bookDrawer.c = c;
  }

  SYS.module('inbox', {
    label: 'Inbox', short: 'Inbox', icon: 'inbox', title: 'Inbox', blurb: 'Calls, texts and messages in one place',
    sub: function(){ return 'Every call, text, form and message in one place. Missed calls get a text back in seconds.'; },
    count: function(){ return SYS.S.convos.filter(needs).length; },
    hot: function(){ return SYS.S.convos.filter(needs).length > 0; },
    actions: function(){ return '<button class="btn pri" type="button" data-act="sim" id="simCall">' + SYS.icon('missed') + 'Simulate a missed call</button>'; },
    render: function(v, opt){
      if (opt && opt.ref){ var r = SYS.S.convos.filter(function(c){ return c.id === opt.ref; })[0]; if (r){ sel = r.id; filter = needs(r) ? 'need' : 'all'; } }
      if (!sel || !cur()){ var first = sorted()[0] || SYS.S.convos[0]; sel = first && first.id; }
      phoneView = false; layout(v);
      if (opt && opt.sim) setTimeout(simulate, 400);
      if (opt && opt.ref && isPhone()) openPhoneThread();
    },
    update: function(){ repaint(); },
    tick: function(v){
      v.querySelectorAll('[data-wait]').forEach(function(el){ el.textContent = 'Waiting ' + f.ago(+el.getAttribute('data-wait')); });
      if (sim && sim.countdown != null && sim.countdown > 1){ sim.countdown--; document.querySelectorAll('[data-cd]').forEach(function(el){ el.textContent = 'Texting in ' + sim.countdown + 's'; }); }
    },
    act: function(a, el){
      var c = cur();
      if (a === 'sim') return simulate();
      if (a === 'filter'){ filter = el.getAttribute('data-f'); repaint(); return; }
      if (a === 'open'){ sel = el.getAttribute('data-id'); phoneView = false; var oc = cur(); if (oc) oc.fresh = false; if (isPhone()) openPhoneThread(); else repaint(); return; }
      if (a === 'phone'){ phoneView = !phoneView; repaint(); return; }
      if (!c) return;
      if (a === 'link') return sendLink(c);
      if (a === 'book') return bookDrawer(c);
      if (a === 'quote'){ SYS.go('quotes', { newFor: c.pid, svc: c.svc, convo: c.id }); return; }
      if (a === 'send'){ var i = document.getElementById('inText'); if (!i || !i.value.trim()) return; say(c, 'us', i.value.trim(), { who: SYS.T.owner }); if (c.st === 'new') c.st = 'replied'; i.value = ''; repaint(); return; }
      if (a === 'pick'){
        var bc = bookDrawer.c, sv = document.getElementById('bkSvc').value, sl = bookDrawer.slots[+el.getAttribute('data-i')];
        if (sv !== bc.svc){ bc.svc = sv; sl = SYS.freeSlots(sv, 1)[0]; }
        var b = SYS.addBooking({ pid: bc.pid, svc: sv, start: sl.start, who: sl.who, src: bc.src, dep: 0 });
        say(bc, 'us', 'You’re booked in for ' + f.when(sl.start) + '. You’ll get a reminder the day before.', { who: SYS.T.owner });
        say(bc, 'sys', 'Booked: ' + SYS.svc(sv).name + ', ' + f.when(sl.start)); bc.bid = b.id; bc.st = 'booked';
        SYS.closeDrawer(); repaint(); SYS.toast('In the diary: ' + f.when(sl.start) + ' with ' + sl.who);
      }
    }
  });
  SYS.on(function(o){ if (o.trade){ sel = null; sim = null; typing = {}; } });
})();
