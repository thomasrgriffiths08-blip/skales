/* The customer's phone on the desk (demos/system/phone.html?desk=<id>&t=<trade>). It plays the customer: rings
   the business, gets the missed-call text back, replies, opens the booking link, picks a time and pays the deposit.
   Everything the business does comes from the system on the laptop beside it (tools/system/desk.js) over the
   BroadcastChannel; nothing on this phone is a recording. */
(function(){
  var D = window.SYS_DATA, doc = document;
  var qs = function(k){ var m = new RegExp('[?&]' + k + '=([a-z0-9-]+)').exec(location.search); return m && m[1]; };
  var deskId = qs('desk') || 'solo', T = D.trades.filter(function(t){ return t.key === qs('t'); })[0] || D.trades[0];
  var ch = 'BroadcastChannel' in window ? new BroadcastChannel('sk-desk-' + deskId) : { postMessage: function(){}, onmessage: null };
  function emit(t, o){ var m = o || {}; m.t = t; m.from = 'phone'; ch.postMessage(m); }

  /* the same clock as the system: a working day, from the real time */
  var REAL0 = Date.now(), START = (function(){
    var d = new Date(REAL0), h = d.getHours() + d.getMinutes() / 60, wd = d.getDay() > 0 && d.getDay() < 6;
    if (wd && h >= 9 && h < 16.5) return REAL0;
    var t = new Date(d); if (!wd || h >= 16.5) t.setDate(t.getDate() + 1);
    while (t.getDay() === 0 || t.getDay() === 6) t.setDate(t.getDate() + 1);
    t.setHours(10, 40, 0, 0); return +t;
  })();
  function now(){ return new Date(START + (Date.now() - REAL0)); }
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], DW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function hm(d){ d = new Date(d); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function sod(d){ var x = new Date(d); x.setHours(0, 0, 0, 0); return +x; }
  function dayName(d){ var diff = Math.round((sod(d) - sod(now())) / 864e5); return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : DOW[new Date(d).getDay()]; }
  function dayShort(d){ d = new Date(d); return DW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function money(n){ return '£' + (Math.round(n) === n ? n : n.toFixed(2)); }
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var I = {
    call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    msg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    end: '<path d="M3 15.5c5-4.5 13-4.5 18 0l-2.5 2.5-3.5-1.5v-2.5a10 10 0 0 0-6 0v2.5L5.5 18z"/>',
    mute: '<path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V6a3 3 0 0 0-5.9-.7"/><path d="M19 11a7 7 0 0 1-1.1 3.8M5 11a7 7 0 0 0 10.6 6M12 18v3M4 4l16 16"/>',
    keypad: '<circle cx="6" cy="5" r="1.3"/><circle cx="12" cy="5" r="1.3"/><circle cx="18" cy="5" r="1.3"/><circle cx="6" cy="11" r="1.3"/><circle cx="12" cy="11" r="1.3"/><circle cx="18" cy="11" r="1.3"/><circle cx="6" cy="17" r="1.3"/><circle cx="12" cy="17" r="1.3"/><circle cx="18" cy="17" r="1.3"/>',
    speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19"/>',
    scan: '<path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><path d="M9 10v1M15 10v1M12 10v3h-1M9.5 15.5a4 4 0 0 0 5 0"/>'
  };
  function ic(k, cls){ return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; }

  /* ---------- state ---------- */
  var ask = T.asks.filter(function(a){ return a.ch === 'call'; })[0] || T.asks[0];
  var svc = T.services.filter(function(s){ return s.id === ask.svc; })[0] || T.services[0];
  var st = { screen: 'card', me: 'Sam Taylor', myTel: '07700 900 482', msgs: [], typing: false, chips: false, slots: null, pick: null, day: null, paid: false, calling: false, missed: false };
  var ph, scr = {}, banner, auto = false, autoStep = 0;

  /* ---------- screens ---------- */
  function statusBar(dark){
    return '<div class="sb' + (dark ? ' dark' : '') + '"><span class="sb-t" data-clock>' + hm(now()) + '</span><span class="sb-r">'
      + '<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg>'
      + '<b>5G</b><span class="bat"><i></i></span></span></div>';
  }
  function cardHTML(){
    return statusBar() + '<div class="ct">'
      + '<div class="ct-top"><span class="ct-av">' + esc(T.mark) + '</span><h1>' + esc(T.biz) + '</h1><p>' + esc(T.label) + ' · ' + esc(T.town) + '</p></div>'
      + '<div class="ct-acts">'
      + '<button type="button" class="ct-a" data-a="nope">' + ic('msg') + '<span>message</span></button>'
      + '<button type="button" class="ct-a ct-call" data-a="call" id="phCall">' + ic('call') + '<span>call</span></button>'
      + '<button type="button" class="ct-a" data-a="nope">' + ic('video') + '<span>video</span></button>'
      + '<button type="button" class="ct-a" data-a="nope">' + ic('mail') + '<span>mail</span></button></div>'
      + '<div class="ct-g"><button type="button" class="ct-row" data-a="call"><small>work</small><span class="lnk">' + esc(T.tel) + '</span></button>'
      + '<div class="ct-row"><small>website</small><span class="lnk">' + esc(T.domain) + '</span></div></div>'
      + '<div class="ct-g ct-g2"><div class="ct-row"><small>on Google</small><span class="rate"><b>4.8</b>' + ic('star', 'st') + ic('star', 'st') + ic('star', 'st') + ic('star', 'st') + ic('star', 'st') + '<em>62 reviews</em></span><span class="ct-open">Open · closes 17:30</span></div></div>'
      + '<div class="ct-note"><b>You</b><span>' + esc(ask.text) + '</span></div>'
      + '</div>';
  }
  function callHTML(){
    var s = st.missed ? 'No answer' : 'calling work…';
    return statusBar(true) + '<div class="cl"><div class="cl-top"><span class="cl-av">' + esc(T.mark) + '</span><h1>' + esc(T.biz) + '</h1><p id="clSt" class="' + (st.missed ? 'ended' : 'ring') + '">' + s + '</p></div>'
      + '<div class="cl-pad">' + [['mute', 'mute'], ['keypad', 'keypad'], ['speaker', 'speaker'], ['video', 'FaceTime'], ['call', 'add'], ['msg', 'contacts']].map(function(x){ return '<span class="cl-b"><i>' + ic(x[0]) + '</i><small>' + x[1] + '</small></span>'; }).join('') + '</div>'
      + '<div class="cl-end"><span>' + ic('end') + '</span></div></div>';
  }
  function bubble(m, last){
    if (m.k === 'stamp') return '<div class="th-stamp"><b>Text Message</b> · ' + esc(m.text) + '</div>';
    /* the preview image is the booking page's own card: the business, and the next three days with free times */
    var d2 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(+now() + 2 * 864e5).getDay()];
    var link = m.link ? '<span class="lp"><span class="lp-pic"><span class="lp-top"><span class="lp-mark">' + esc(T.mark) + '</span><b>' + esc(T.biz) + '</b></span><span class="lp-h">Book a time online</span><span class="lp-days"><i>Today</i><i>Tomorrow</i><i>' + d2 + '</i></span></span><span class="lp-t"><b>Book ' + esc(T.biz) + ' online</b><small>' + esc(m.link.split('/')[0]) + '</small></span></span>' : '';
    var txt = esc(m.text).replace(/([a-z]+\.co\.uk\/[a-z]+)/, '<u>$1</u>');
    return '<div class="bb ' + (m.me ? 'me' : 'them') + (m.link ? ' has-lp' : '') + (m.fresh ? ' in' : '') + '"' + (m.link ? ' data-a="link" role="button" tabindex="0" id="phLink"' : '') + '>' + (link || '') + '<span class="bb-t">' + txt + '</span></div>'
      + (m.me && last ? '<div class="th-del">Delivered</div>' : '');
  }
  function threadHTML(){
    var lastMe = -1; st.msgs.forEach(function(m, i){ if (m.me) lastMe = i; });
    var chips = st.chips ? '<div class="chips"><button type="button" class="chip" data-a="reply" data-i="0" id="phChip0">' + esc(ask.text) + '</button><button type="button" class="chip" data-a="reply" data-i="1">Yes please, what’s your earliest?</button></div>' : '';
    return statusBar() + '<div class="th-h"><span class="th-back">' + ic('back') + '</span><span class="th-who"><span class="th-av">' + esc(T.mark) + '</span><b>' + esc(T.biz) + '</b></span><span class="th-sp"></span></div>'
      + '<div class="th-b" id="thB">' + st.msgs.map(function(m, i){ return bubble(m, i === lastMe); }).join('') + (st.typing ? '<div class="bb them typing"><i></i><i></i><i></i></div>' : '') + '</div>'
      + chips + '<div class="th-in"><span class="th-plus">+</span><span class="th-field">Text Message</span><span class="th-mic">' + ic('mic') + '</span></div>';
  }
  function webHTML(){
    var page;
    if (st.paid){
      var p = st.pick;
      page = '<div class="wb-done"><span class="wb-tick">' + ic('check') + '</span><h2>You’re booked</h2><p>' + esc(svc.name) + '</p>'
        + '<dl><div><dt>When</dt><dd>' + esc(dayName(p.start)) + ', ' + hm(p.start) + '</dd></div><div><dt>With</dt><dd>' + esc(p.who) + ', ' + esc(T.biz) + '</dd></div>'
        + (svc.dep ? '<div><dt>Deposit</dt><dd>' + money(svc.dep) + ' paid</dd></div><div><dt>On the day</dt><dd>' + (svc.from ? 'from ' : '') + money(svc.price - svc.dep) + '</dd></div>' : '')
        + '</dl><p class="wb-small">A confirmation text is on its way. Reply to it to move the time.</p></div>';
    } else {
      var days = groupDays(st.slots || []), dKey = st.day || (days[0] && days[0].key);
      var dayTabs = days.map(function(d){ return '<button type="button" class="wb-day" data-a="day" data-k="' + d.key + '" aria-pressed="' + (d.key === dKey) + '"><b>' + esc(d.label) + '</b><small>' + esc(d.sub) + '</small></button>'; }).join('');
      var cur = days.filter(function(d){ return d.key === dKey; })[0];
      var times = cur ? cur.list.map(function(s, i){ var on = st.pick && +st.pick.start === s.start && st.pick.who === s.who; return '<button type="button" class="wb-tm" data-a="pick" data-s="' + s.start + '" data-w="' + esc(s.who) + '" aria-pressed="' + !!on + '"' + (i === 0 ? ' id="phSlot0"' : '') + '>' + hm(s.start) + '</button>'; }).join('') : '<p class="wb-small">Finding free times…</p>';
      page = '<div class="wb-svc"><b>' + esc(svc.name) + '</b><span>' + (svc.price ? (svc.from ? 'from ' : '') + money(svc.price) : 'Free') + ' · ' + mins(svc.mins) + (svc.dep ? ' · ' + money(svc.dep) + ' deposit holds it' : '') + '</span></div>'
        + '<h3>Pick a time</h3><div class="wb-days">' + dayTabs + '</div><div class="wb-tms">' + times + '</div>'
        + '<h3>Your details</h3><div class="wb-me"><div><small>Name</small><b>' + esc(st.me) + '</b></div><div><small>Mobile</small><b>' + esc(st.myTel) + '</b></div><p>Filled in from your text.</p></div>'
        + '<div class="wb-pay"><button type="button" class="wb-go" data-a="pay" id="phPay"' + (st.pick ? '' : ' disabled') + '>' + (st.pick ? (svc.dep ? 'Pay ' + money(svc.dep) + ' deposit to book' : 'Book ' + hm(st.pick.start) + ' ' + dayName(st.pick.start).toLowerCase()) : 'Pick a time') + '</button></div>';
    }
    return statusBar() + '<div class="wb-bar"><span class="wb-url">' + ic('lock') + esc(T.domain) + '</span></div>'
      + '<div class="wb"><div class="wb-hd"><span class="wb-mark">' + esc(T.mark) + '</span><b>' + esc(T.biz) + '</b><span class="wb-tel">' + esc(T.tel) + '</span></div><div class="wb-c">' + page + '</div></div>';
  }
  function mins(m){ return m < 60 ? m + ' min' : (m % 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : (m / 60) + (m === 60 ? ' hour' : ' hours')); }
  function groupDays(list){
    var out = [], by = {};
    list.forEach(function(s){ var k = String(sod(s.start)); if (!by[k]){ by[k] = { key: k, label: dayName(s.start), sub: dayShort(s.start).replace(/^\w+ /, ''), list: [] }; out.push(by[k]); } if (by[k].list.length < 6) by[k].list.push(s); });
    return out.slice(0, 3);
  }
  function sheetHTML(){
    return '<div class="sh-scrim"></div><div class="sh"><span class="sh-grab"></span><div class="sh-h"><span class="sh-mark">' + esc(T.mark) + '</span><div><b>' + esc(T.biz) + '</b><small>' + esc(T.domain) + '</small></div></div>'
      + '<div class="sh-amt"><small>Deposit</small><b>' + money(svc.dep) + '</b></div>'
      + '<div class="sh-card">' + ic('card') + '<span>Visa <b>•••• 4821</b></span></div>'
      + '<button type="button" class="sh-go" data-a="confirm" id="phConfirm">' + ic('scan') + '<span>Pay ' + money(svc.dep) + '</span></button>'
      + '<p class="sh-note">Taken now, off the price on the day.</p></div>';
  }

  /* ---------- paint ---------- */
  function paint(){
    var s = st.screen;
    ph.setAttribute('data-screen', s);
    scr.el.innerHTML = s === 'card' ? cardHTML() : s === 'call' ? callHTML() : s === 'thread' ? threadHTML() : webHTML();
    var b = doc.getElementById('thB'); if (b) b.scrollTop = b.scrollHeight;
    st.msgs.forEach(function(m){ m.fresh = false; });
    if (st.screen === 'card' && !st.calling && !st.msgs.length){ var c = doc.getElementById('phCall'); if (c) c.classList.add('cue'); }
  }
  function go(s){ st.screen = s; paint(); emit('screen', { s: s }); }
  function notify(title, text, onTap){
    if (banner) banner.remove();
    banner = doc.createElement('button'); banner.type = 'button'; banner.className = 'nt'; banner.id = 'phNote';
    banner.innerHTML = '<span class="nt-ic">' + ic('msg') + '</span><span class="nt-b"><span class="nt-h"><b>' + esc(title) + '</b><small>now</small></span><span class="nt-t">' + esc(text) + '</span></span>';
    ph.appendChild(banner);
    requestAnimationFrame(function(){ banner.classList.add('on'); });
    var me = banner;
    me.addEventListener('click', function(){ me.classList.remove('on'); setTimeout(function(){ me.remove(); }, 300); if (onTap) onTap(); });
    setTimeout(function(){ if (me.parentNode && st.screen !== 'thread'){ /* stays until tapped, like a real banner on a held phone */ } }, 6000);
  }
  function hideNote(){ if (banner){ banner.classList.remove('on'); var b = banner; setTimeout(function(){ b.remove(); }, 300); banner = null; } }

  /* ---------- the customer's moves ---------- */
  function call(){
    if (st.calling || st.msgs.length) return;
    st.calling = true; st.missed = false; go('call'); emit('call', { svc: svc.id });
  }
  function reply(i){
    var text = i === 0 ? ask.text : 'Yes please, what’s your earliest?';
    st.chips = false; st.msgs.push({ me: true, text: text, fresh: true }); paint();
    emit('reply', { text: text });
  }
  function openLink(){ st.slots = null; st.pick = null; st.day = null; go('web'); emit('slots?', { svc: svc.id }); }
  function pay(){
    if (!st.pick) return;
    if (!svc.dep){ confirmPay(); return; }
    var w = doc.createElement('div'); w.className = 'sh-w'; w.id = 'phSheet'; w.innerHTML = sheetHTML(); ph.appendChild(w);
    requestAnimationFrame(function(){ w.classList.add('on'); });
  }
  function confirmPay(){
    var w = doc.getElementById('phSheet');
    if (w){ var b = w.querySelector('.sh-go'); b.classList.add('busy'); b.innerHTML = '<span class="spin"></span><span>Paying</span>'; }
    setTimeout(function(){
      if (w){ var b2 = w.querySelector('.sh-go'); b2.classList.remove('busy'); b2.classList.add('ok'); b2.innerHTML = ic('check') + '<span>Done</span>'; }
      setTimeout(function(){
        if (w){ w.classList.remove('on'); setTimeout(function(){ w.remove(); }, 320); }
        st.paid = true; paint();
        emit('book', { svc: svc.id, start: st.pick.start, who: st.pick.who });
      }, 650);
    }, 1100);
  }

  ph = doc.createElement('div'); ph.className = 'ph'; doc.body.appendChild(ph);
  scr.el = doc.createElement('div'); scr.el.className = 'scr'; ph.appendChild(scr.el);
  ph.style.setProperty('--ac', T.c);
  paint();

  ph.addEventListener('click', function(e){
    var a = e.target.closest('[data-a]'); if (!a) return;
    var k = a.getAttribute('data-a');
    if (k === 'call') return call();
    if (k === 'reply') return reply(+a.getAttribute('data-i'));
    if (k === 'link') return openLink();
    if (k === 'day'){ st.day = a.getAttribute('data-k'); paint(); return; }
    if (k === 'pick'){ st.pick = { start: +a.getAttribute('data-s'), who: a.getAttribute('data-w') }; paint(); return; }
    if (k === 'pay') return pay();
    if (k === 'confirm') return confirmPay();
  });
  setInterval(function(){ doc.querySelectorAll('[data-clock]').forEach(function(el){ el.textContent = hm(now()); }); }, 5000);

  /* ---------- what the business does, from the laptop ---------- */
  ch.onmessage = function(e){
    var d = e.data || {}; if (d.from === 'phone') return;
    if (d.t === 'reset'){ location.reload(); return; }
    if (d.t === 'trade'){ if (d.key !== T.key){ var u = new URL(location.href); u.searchParams.set('t', d.key); location.replace(u.toString()); } return; }
    if (d.t === 'auto'){ auto = !!d.on; if (auto) runAuto(); return; }
    if (d.t === 'ring'){ if (d.name) st.me = d.name; if (!st.calling){ st.calling = true; go('call'); } return; }
    if (d.t === 'missed'){
      st.missed = true; if (st.screen === 'call') paint();
      setTimeout(function(){ st.calling = false; go('card'); }, 1400); return;
    }
    if (d.t === 'sms'){
      var m = { me: false, text: d.text, link: d.link || null, fresh: true };
      if (!st.msgs.length) st.msgs.push({ k: 'stamp', text: 'Today ' + hm(now()) });
      st.msgs.push(m); st.typing = false;
      if (d.auto) st.chips = true;
      if (d.link){ svc = T.services.filter(function(s){ return s.id === d.svc; })[0] || svc; }
      if (st.screen === 'thread') paint();
      else notify(T.biz, d.text, function(){ go('thread'); });
      if (st.screen === 'thread' && d.link) { /* the link sits in the thread, ready to tap */ }
      if (auto) autoNext();
      return;
    }
    if (d.t === 'slots' && d.svc === svc.id){ st.slots = d.list; if (st.screen === 'web') paint(); if (auto) autoNext(); return; }
  };
  emit('hello');

  /* ---------- playing itself, with a visible finger ---------- */
  function tap(sel, then){
    var el = doc.querySelector(sel); if (!el){ if (then) then(); return; }
    var r = el.getBoundingClientRect(), dot = doc.createElement('i');
    dot.className = 'tap'; dot.style.left = (r.left + r.width / 2) + 'px'; dot.style.top = (r.top + r.height / 2) + 'px';
    doc.body.appendChild(dot);
    setTimeout(function(){ el.click(); if (then) then(); }, 360);
    setTimeout(function(){ dot.remove(); }, 900);
  }
  function runAuto(){ if (st.screen === 'card' && !st.calling && !st.msgs.length) setTimeout(function(){ if (auto) tap('#phCall'); }, 900); }
  function autoNext(){
    var last = st.msgs[st.msgs.length - 1];
    if (st.screen !== 'thread' && st.screen !== 'web' && doc.getElementById('phNote')){
      setTimeout(function(){ if (!auto) return; tap('#phNote', function(){
        setTimeout(function(){ if (!auto) return; if (st.chips) tap('#phChip0'); else if (last && last.link) tap('#phLink'); }, 1500);
      }); }, 1800);
      return;
    }
    if (st.screen === 'thread' && last && last.link) setTimeout(function(){ if (auto) tap('#phLink'); }, 1600);
    if (st.screen === 'web' && st.slots && !st.pick) setTimeout(function(){ if (!auto) return; tap('#phSlot0', function(){ setTimeout(function(){ if (!auto) return; tap('#phPay', function(){ setTimeout(function(){ if (auto) tap('#phConfirm'); }, 1100); }); }, 1000); }); }, 1300);
  }
})();
