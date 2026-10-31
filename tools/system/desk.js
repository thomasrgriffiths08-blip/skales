/* The desk: the system on a laptop with the customer's phone beside it (demos/system/phone.html), talking over a
   BroadcastChannel named by ?desk=<id>. The phone rings the business, the inbox catches the missed call and texts
   back, the customer replies and books from the link on their phone, and the booking lands in the diary here.
   Off unless the page was opened with ?desk=. The page around both (assets/desk.js) listens in to run the guide. */
(function(){
  var m = /[?&]desk=([a-z0-9-]+)/.exec(location.search);
  if (!m || !('BroadcastChannel' in window)) return;
  var ch = new BroadcastChannel('sk-desk-' + m[1]), f = SYS.fmt, auto = false, svc = null;
  function emit(t, o){ var msg = o || {}; msg.t = t; msg.from = 'biz'; ch.postMessage(msg); }
  /* the job the customer rings about: the trade's first phoned-in enquiry */
  function firstCall(){ var a = SYS.T.asks.filter(function(x){ return x.ch === 'call'; })[0] || SYS.T.asks[0]; return a.svc; }
  SYS.desk = { emit: emit, svc: function(){ return svc || firstCall(); } };

  /* a visible tap on the laptop when the guide is playing itself */
  function tapThen(sel, fn){
    var el = document.querySelector(sel);
    if (!el){ fn(); return; }
    var r = el.getBoundingClientRect(), dot = document.createElement('i');
    dot.className = 'desk-tap'; dot.style.left = (r.left + r.width / 2) + 'px'; dot.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(dot);
    setTimeout(function(){ fn(); }, 380);
    setTimeout(function(){ dot.remove(); }, 900);
  }
  function cue(on){ var b = document.getElementById('inLink'); if (b) b.classList.toggle('desk-cue', !!on); }

  ch.onmessage = function(e){
    var d = e.data || {}; if (d.from === 'biz') return;
    if (d.t === 'reset'){ location.reload(); return; }
    if (d.t === 'auto'){ auto = !!d.on; return; }
    if (d.t === 'hello'){ if (SYS.T) emit('trade', { key: SYS.T.key }); return; }
    if (d.t === 'call'){
      svc = d.svc || null;
      if (SYS.cur !== 'inbox') SYS.go('inbox');
      SYS.inbox.simulate(); return;
    }
    if (d.t === 'reply'){
      if (SYS.cur !== 'inbox') SYS.go('inbox');
      SYS.inbox.reply(d.text);
      setTimeout(function(){ cue(true); }, 60);
      if (auto) setTimeout(function(){ tapThen('#inLink', function(){ cue(false); SYS.inbox.link(); }); }, 2400);
      return;
    }
    if (d.t === 'slots?'){
      var list = SYS.freeSlots(d.svc, 9).map(function(x){ return { start: +x.start, who: x.who }; });
      emit('slots', { svc: d.svc, list: list }); return;
    }
    if (d.t === 'book'){
      var s = SYS.T.svc[d.svc], c = SYS.inbox.convo(), pid = c ? c.pid : SYS.S.people[0].id;
      var b = SYS.addBooking({ pid: pid, svc: d.svc, start: new Date(d.start), who: d.who, src: 'Booked online' });
      var rest = s.price ? s.price - (b.dep || 0) : 0;
      var text = 'You’re booked: ' + s.name + ', ' + f.when(b.start) + ' with ' + b.who + '.' + (b.dep ? ' ' + f.money(b.dep) + ' deposit paid' + (rest > 0 ? ', ' + (s.from ? 'from ' : '') + f.money(rest) + ' on the day.' : '.') : '') + ' Reply to this text to move it.';
      SYS.inbox.booked(b, text);
      SYS.toast('Booked online: ' + s.name + ', ' + f.when(b.start) + (b.dep ? ' · ' + f.money(b.dep) + ' deposit paid' : ''));
      emit('sms', { text: text, confirm: true });
      emit('booked', { start: +b.start, who: b.who, dep: b.dep, svc: d.svc });
      setTimeout(function(){ SYS.go('booking', { ref: b.id }); }, 1800);
    }
  };
  SYS.on(function(o){ if (o.trade) emit('trade', { key: SYS.T.key }); });
  /* say so once loaded, so the phone matches the trade and the page knows both sides are up */
  (function up(){ if (SYS.T) emit('trade', { key: SYS.T.key }); else setTimeout(up, 60); })();
  /* the guide outside needs the laptop's "Send booking link" press too, when a person makes it */
  document.addEventListener('click', function(e){ if (e.target.closest('#inLink')) cue(false); }, true);
  SYS.css('desk', [
    '.desk-tap{position:fixed;z-index:99;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(24,24,27,.22);border:2px solid rgba(24,24,27,.55);pointer-events:none;animation:deskTap .9s ease-out forwards}',
    '@keyframes deskTap{0%{transform:scale(.6);opacity:0}25%{transform:scale(1);opacity:1}100%{transform:scale(1.5);opacity:0}}',
    '.desk-cue{position:relative;box-shadow:0 0 0 0 var(--ac);animation:deskCue 1.4s ease-out infinite}',
    '@keyframes deskCue{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ac) 55%,transparent)}100%{box-shadow:0 0 0 9px color-mix(in srgb,var(--ac) 0%,transparent)}}'
  ].join('\n'));
})();
