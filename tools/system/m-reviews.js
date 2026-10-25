/* Reviews: a text after every finished job asking for a Google review, the reviews as they land, and a
   reply drafted with their first name and the job. Everyone gets asked: Google's rules ban picking who. */
(function(){
  var f = SYS.fmt, esc = SYS.esc;
  var sel = null, selRev = null, editing = null, draft = '', pv = 'text', fresh = {};
  /* what each sample review in data.js was for, in order, so a reply can name the job */
  var JOB = {
    heating: ['boiler repair', 'boiler service', 'boiler install', 'boiler service'],
    electrical: ['repair', 'consumer unit upgrade', 'charger install', 'work'],
    garage: ['MOT', 'service', 'brake job', 'work'],
    salon: ['cut', 'colour', 'appointment', 'cut'],
    cleaning: ['end of tenancy clean', 'regular clean', 'oven clean', 'clean'],
    clinic: ['assessment', 'treatment', 'sessions', 'treatment']
  };
  /* the job, in a customer's words, for each service */
  var SVCJOB = { breakdown: 'repair', service: 'boiler service', cp12: 'gas safety check', survey: 'boiler survey', flush: 'power flush', radiator: 'radiator repair',
    fault: 'repair', eicr: 'EICR', cu: 'consumer unit upgrade', ev: 'charger install', sockets: 'new sockets', pat: 'PAT testing',
    mot: 'MOT', interim: 'service', full: 'service', diag: 'diagnostics', brakes: 'brake job', tyres: 'tyre fitting',
    cut: 'cut', colour: 'colour', balayage: 'balayage', blowdry: 'blow dry', gents: 'cut', bridal: 'bridal trial',
    regular: 'regular clean', deep: 'deep clean', eot: 'end of tenancy clean', oven: 'oven clean', carpet: 'carpet clean', office: 'office clean',
    initial: 'assessment', follow: 'session', massage: 'massage', running: 'running assessment', postop: 'rehab session', video: 'video consultation' };
  /* the review that lands after the demo sends its asks */
  var NEWREV = {
    heating: 'Turned up when he said, tidy work and a fair price. Explained what he’d done before he left. Will book again next year.',
    electrical: 'Arrived on time, found the problem quickly and left everything tidy. Clear price before starting.',
    garage: 'Dropped the car off, got a text when it was ready and the price was what they said. No upselling.',
    salon: 'Lovely relaxed appointment and exactly the look I wanted. Already booked my next one.',
    cleaning: 'Spotless and on time. Easy to book and the team were lovely.',
    clinic: 'Clear explanation of what was wrong and a simple plan to fix it. Feeling better already.'
  };
  var VISIT = { heating: 'having us out', electrical: 'having us out', cleaning: 'having us', garage: 'bringing the car in', salon: 'coming in', clinic: 'coming in' };
  var STAR = '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>';

  function star(on){ return '<svg viewBox="0 0 24 24" class="' + (on ? '' : 'off') + '" fill="currentColor" aria-hidden="true">' + STAR + '</svg>'; }
  function stars(n){ var s = ''; for (var i = 1; i <= 5; i++) s += star(i <= n); return '<span class="rv-stars" role="img" aria-label="' + n + ' out of 5 stars">' + s + '</span>'; }
  function isPhone(){ return matchMedia('(max-width:760px)').matches; }
  function day(d){ var x = f.day(d); return x === 'Today' || x === 'Yesterday' ? x.toLowerCase() : x; }
  function stamp(d){ return f.day(d) === 'Today' ? f.time(d) : day(d); }
  function mark(id){ fresh[id] = 1; SYS.later(1600, function(){ delete fresh[id]; }); }

  function asks(){ return SYS.S.asks.slice().sort(function(a, b){ var ad = a.st === 'due', bd = b.st === 'due'; if (ad !== bd) return ad ? -1 : 1; return ad ? a.sendAt - b.sendAt : b.done - a.done; }); }
  function due(){ return asks().filter(function(a){ return a.st === 'due'; }); }
  function revs(){ return SYS.S.reviews.slice().sort(function(a, b){ return (a.reply ? 1 : 0) - (b.reply ? 1 : 0) || b.at - a.at; }); }
  function ask(id){ return SYS.S.asks.filter(function(a){ return a.id === id; })[0]; }
  function rev(id){ return SYS.S.reviews.filter(function(r){ return r.id === id; })[0]; }
  function job(r){ if (!r.job){ var i = SYS.S.reviews.indexOf(r), a = JOB[SYS.T.key] || []; r.job = a[i] || 'work'; } return r.job; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function suggest(r){
    var p = SYS.person(r.pid), n = SYS.first(p.name), o = SYS.T.owner;
    return r.s >= 5 ? 'Thanks ' + n + ', really glad the ' + job(r) + ' went well. Thanks for taking a minute to leave a review. ' + o
      : 'Thanks for the honest review, ' + n + '. Glad the ' + job(r) + ' went well, and we’ve taken your point on board. ' + o;
  }
  function askText(a){ var t = SYS.T, p = SYS.person(a.pid); return 'Hi ' + SYS.first(p.name) + ', thanks for ' + (VISIT[t.key] || 'choosing us') + ' today. If you’ve got a minute, a quick Google review really helps a small business like ours: ' + t.domain + '/review\nThanks, ' + t.owner; }

  /* the numbers along the top: the live count matches Today (last month's total plus the last 30 days) */
  function nums(){
    var S = SYS.S, n = SYS.now(), rv = S.rating, last = rv.count.length - 1;
    var live = rv.count[last] + S.reviews.filter(function(r){ return r.at > SYS.sod(n) - 30 * SYS.DAY; }).length;
    var month = live - rv.count[last - 1];
    var m = S.results.months[S.results.months.length - 1];
    var booked = m.rows.reduce(function(a, r){ return a + r.booked; }, 0);
    var asked = Math.round(booked * 0.8) + S.asks.filter(function(a){ return a.sentNow; }).length;
    return { rating: rv.hist[last], from: rv.hist[0], live: live, month: month, asked: asked, rate: Math.round(month / asked * 100), mon: m.label, first: S.results.months[0].label };
  }

  function topHTML(){
    var x = nums(), rv = SYS.S.rating, ms = SYS.S.results.months;
    var counts = rv.count.slice(); counts[counts.length - 1] = x.live;
    var max = Math.max.apply(null, counts), L = counts.length;
    var bars = counts.map(function(c, i){ var h = Math.max(3, Math.round(c / max * 40)), w = 34; return '<rect x="' + (i * 100 + 50 - w / 2) + '" y="' + (42 - h) + '" width="' + w + '" height="' + h + '"' + (i === L - 1 ? ' class="on"' : '') + '/>'; }).join('');
    var cells = function(arr, cls){ return arr.map(function(v, i){ return '<span class="' + cls + (i === L - 1 ? ' now' : '') + '">' + v + '</span>'; }).join(''); };
    var chart = '<div class="rv-ch" role="img" aria-label="Reviews and rating over the last six months">'
      + '<span class="lab">Reviews</span>' + cells(counts, 'n')
      + '<svg viewBox="0 0 ' + (L * 100) + ' 42" preserveAspectRatio="none" aria-hidden="true">' + bars + '</svg>'
      + '<span class="lab"></span>' + cells(ms.slice(-L).map(function(m){ return m.label; }), 'm')
      + '<span class="lab">Rating</span>' + cells(rv.hist.map(function(h){ return h.toFixed(1); }), 'r') + '</div>';
    return '<div class="card rv-top" id="rvTop">'
      + '<div class="stat"><span class="k">Google rating</span><span class="v rv-v">' + x.rating.toFixed(1) + stars(5) + '</span><span class="d">Up from ' + x.from.toFixed(1) + ' in ' + esc(x.first) + '</span></div>'
      + '<div class="stat"><span class="k">Reviews on Google</span><span class="v">' + x.live + '</span><span class="d">' + x.month + ' new this month</span></div>'
      + '<div class="stat"><span class="k">Asks sent in ' + esc(x.mon) + '</span><span class="v">' + x.asked + '</span><span class="d">One after every finished job</span></div>'
      + '<div class="stat"><span class="k">Reply rate</span><span class="v">' + x.rate + '%</span><span class="d">' + x.month + ' of ' + x.asked + ' asked left a review</span></div>'
      + '<div class="stat rv-trend" id="rvTrend"><span class="k">Last 6 months</span>' + chart + '</div></div>';
  }

  function askSt(a){
    if (a.st === 'due') return '<span class="tag" data-s="due">' + (a.sendAt > SYS.now() ? 'Goes at ' + f.time(a.sendAt) : 'Due now') + '</span>';
    if (a.st === 'sent') return '<span class="tag">Sent ' + esc(stamp(a.sentAt)) + '</span>';
    if (a.st === 'opened') return '<span class="tag">Opened the link</span>';
    return '<span class="tag good">Left 5 stars</span>';
  }
  function askRow(a){
    var p = SYS.person(a.pid), s = SYS.svc(a.svc);
    return '<button class="row click rv-ask' + (sel === a.id ? ' sel' : '') + (fresh[a.id] ? ' new-in' : '') + '" type="button" data-act="ask" data-id="' + a.id + '" id="rv-' + a.id + '">'
      + SYS.av(p.name) + '<span class="main-t"><span class="t1"><span class="n">' + esc(p.name) + '</span></span><span class="t2">' + esc(s.name) + ' · finished ' + esc(day(a.done)) + ' ' + f.time(a.done) + '</span></span>'
      + '<span class="end">' + askSt(a) + '</span></button>';
  }
  function asksCard(){
    var list = asks(), d = list.filter(function(a){ return a.st === 'due'; }).length;
    return '<div class="card rv-a"><div class="card-h"><h2>Review asks</h2><span class="meta">' + (d ? d + ' due to go out' : 'All sent') + '</span></div>'
      + '<div class="rows" id="rvAsks">' + list.map(askRow).join('') + '</div>'
      + '<p class="rv-rule">Every customer gets asked, not only the happy ones. Google’s rules ban filtering who you ask, so the system never does.</p></div>';
  }

  function revItem(r){
    var p = SYS.person(r.pid), body;
    if (editing === r.id){
      body = '<div class="rv-edit"><label class="lbl-s" for="rvText">Suggested reply. Change anything you like.</label><textarea class="inp" id="rvText" rows="3">' + esc(draft) + '</textarea>'
        + '<div class="rv-eb"><button class="btn pri sm" type="button" data-act="post" data-id="' + r.id + '" id="rvPost">' + SYS.icon('send') + 'Post reply</button><button class="btn ghost sm" type="button" data-act="cancel">Cancel</button></div></div>';
    } else if (r.reply){
      body = '<div class="rv-reply"><span class="lbl-s">Your reply' + (r.repliedAt ? ' · posted ' + f.time(r.repliedAt) : '') + '</span><p>' + esc(r.reply) + '</p></div>';
    } else {
      body = '<div class="rv-eb"><button class="btn sm" type="button" data-act="reply" data-id="' + r.id + '">' + SYS.icon('text') + 'Reply</button><span class="note">Not replied to yet</span></div>';
    }
    return '<div class="rv-rev' + (selRev === r.id ? ' sel' : '') + (fresh[r.id] ? ' new-in' : '') + '" id="rv-' + r.id + '">'
      + '<div class="rv-rh">' + SYS.av(p.name) + '<span class="main-t"><span class="t1">' + esc(p.name) + '</span><span class="t2">' + esc(cap(job(r))) + ' · ' + esc(f.ago(r.at)) + ' ago</span></span>' + stars(r.s) + '</div>'
      + '<p class="rv-txt">' + esc(r.text) + '</p>' + body + '</div>';
  }
  function revCard(){
    var list = revs(), un = list.filter(function(r){ return !r.reply; }).length;
    return '<div class="card rv-r"><div class="card-h"><h2>Google reviews</h2><span class="meta">' + (un ? un + ' to reply to' : 'All replied to') + '</span></div>'
      + '<div id="rvList">' + list.map(revItem).join('') + '</div></div>';
  }

  /* what the customer sees: the text, then Google's own review box. No filter page in between. */
  function phoneHTML(a){
    var t = SYS.T, body, o;
    if (pv === 'text'){
      body = '<div class="sys">' + esc(f.when(a.sentAt || a.sendAt)) + '</div><div class="msg">' + esc(askText(a)) + '</div>';
      o = { title: t.biz, sub: 'Text message', av: t.biz.replace(/ & /g, ' '), body: body, cap: 'Sent two hours after the job, while it’s still fresh.' };
    } else {
      var big = ''; for (var i = 0; i < 5; i++) big += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true">' + STAR + '</svg>';
      body = '<div class="rv-gp"><b>' + esc(t.biz) + '</b><small>Posting publicly on Google</small><div class="rv-gs">' + big + '</div><div class="rv-gbox">Share details of your own experience</div><span class="rv-gpost">Post</span></div>';
      o = { title: 'Google', web: 'search.google.com', site: false, body: body, cap: 'The link opens Google’s own review box. Whatever they pick goes straight to Google.' };
    }
    return SYS.phone(o);
  }
  function segHTML(){ return '<div class="seg" role="group" aria-label="Show" id="rvPv"><button type="button" data-act="pv" data-v="text" aria-pressed="' + (pv === 'text') + '">The text</button><button type="button" data-act="pv" data-v="page" aria-pressed="' + (pv === 'page') + '">Review page</button></div>'; }
  function histHTML(a, head){
    var p = SYS.person(a.pid), s = SYS.svc(a.svc);
    var ev = [{ at: a.done, text: 'Job finished', sub: s.name }].concat(a.ev.map(function(e){ return { at: e.at, text: e.text.replace('Review request sent', 'Review ask sent'), k: /stars/.test(e.text) ? 'good' : (/sent/.test(e.text) ? 'ac' : '') }; }));
    if (a.st === 'due') ev.push({ at: a.sendAt, text: 'Ask goes out', sub: 'Two hours after the job', k: 'warn' });
    return '<p class="lbl-s rv-hh">' + esc(head || p.name) + '</p><ul class="tl">' + ev.map(function(e){
      return '<li><span class="tm">' + f.time(e.at) + '</span><div class="ev" data-k="' + (e.k || '') + '"><b>' + esc(e.text) + '</b><small>' + esc((e.sub ? e.sub + ' · ' : '') + cap(day(e.at))) + '</small></div></li>';
    }).join('') + '</ul>';
  }
  function phoneCard(a){
    return '<div class="card rv-p" id="rvPhone"><div class="card-h"><h2>What they see</h2>' + segHTML() + '</div><div class="rv-pw"><div class="card-b rv-pv">' + phoneHTML(a) + '</div>'
      + '<div class="card-b rv-hist hide-m">' + histHTML(a) + '</div></div></div>';
  }
  function drawerInner(a){ return '<div class="rv-dr"><div class="rv-dseg">' + segHTML().replace(' id="rvPv"', '') + '</div>' + phoneHTML(a) + '<div class="rv-dh">' + histHTML(a, 'History') + '</div></div>'; }
  function openAsk(){ var a = ask(sel); if (!a) return; SYS.drawer({ title: SYS.person(a.pid).name, body: drawerInner(a) }); }

  function paint(v){
    var ta = document.getElementById('rvText'), foc = ta && document.activeElement === ta;
    if (ta) draft = ta.value;
    if (!ask(sel)){ var d0 = due()[0] || asks()[0]; sel = d0 && d0.id; }
    var a = ask(sel);
    v.innerHTML = '<div class="rv">' + topHTML() + '<div class="rv-main">' + asksCard() + revCard() + (a ? phoneCard(a) : '') + '</div></div>';
    var dr = SYS.drawerEl(), db = dr && dr.querySelector('.rv-dr'); if (db && a) db.outerHTML = drawerInner(a);
    var nt = document.getElementById('rvText'); if (nt && foc){ nt.focus(); nt.setSelectionRange(nt.value.length, nt.value.length); }
  }

  function sendDue(){
    var list = due(); if (!list.length) return;
    var n = SYS.now();
    list.forEach(function(a){ a.st = 'sent'; a.sentAt = n; a.sentNow = true; a.ev.push({ at: n, text: 'Review ask sent' }); mark(a.id); });
    sel = list[0].id;
    SYS.toast(list.length === 1 ? '1 review ask sent' : list.length + ' review asks sent');
    SYS.changed();
    var a = list[0];
    SYS.later(2600, function(){ a.st = 'opened'; a.ev.push({ at: SYS.now(), text: 'Opened the link' }); mark(a.id); SYS.changed(); });
    SYS.later(6400, function(){
      var p = SYS.person(a.pid), at = SYS.now();
      var r = { id: SYS.uid('r'), pid: a.pid, s: 5, text: NEWREV[SYS.T.key] || 'Easy to book, on time and a fair price. Would use again.', at: at, reply: '', job: SVCJOB[a.svc] || 'work' };
      a.st = 'reviewed'; a.ev.push({ at: at, text: 'Left 5 stars on Google' });
      SYS.S.reviews.push(r); mark(a.id); mark(r.id); selRev = r.id;
      SYS.toast('New 5-star review from ' + p.name);
      SYS.changed();
    });
  }

  SYS.module('reviews', {
    label: 'Reviews', short: 'Reviews', icon: 'reviews', title: 'Reviews', blurb: 'Google reviews, asked for after every job',
    sub: function(){ return 'A text after every finished job asks for a Google review. Replies drafted for you.'; },
    count: function(){ return SYS.S.reviews.filter(function(r){ return !r.reply; }).length; },
    hot: function(){ return SYS.S.reviews.some(function(r){ return !r.reply; }); },
    actions: function(){ var d = due().length; return '<button class="btn pri rv-act" type="button" data-act="send" id="rvSend"' + (d ? '' : ' disabled') + '>' + SYS.icon('send') + 'Send due asks' + (d ? ' · ' + d : '') + '</button>'; },
    render: function(v, opt){
      editing = null; draft = '';
      var ref = opt && opt.ref, isAsk = ref && ask(ref), isRev = ref && rev(ref);
      if (isAsk) sel = ref; if (isRev) selRev = ref;
      paint(v);
      if (ref && (isAsk || isRev)){
        var el = document.getElementById('rv-' + ref); SYS.reveal(el);
        if (isAsk && isPhone()) openAsk();
      }
    },
    update: function(v){ paint(v); },
    act: function(a, el){
      var id = el.getAttribute('data-id');
      if (a === 'send') return sendDue();
      if (a === 'ask'){ sel = id; if (isPhone()) openAsk(); else SYS.refresh(); return; }
      if (a === 'pv'){ pv = el.getAttribute('data-v'); SYS.refresh(); return; }
      if (a === 'reply'){
        var r = rev(id); if (!r) return;
        editing = id; selRev = id; draft = suggest(r); SYS.refresh();
        var t = document.getElementById('rvText'); if (t){ t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
        return;
      }
      if (a === 'cancel'){ editing = null; draft = ''; SYS.refresh(); return; }
      if (a === 'post'){
        var pr = rev(id), ta = document.getElementById('rvText'), txt = (ta ? ta.value : draft).trim(); if (!pr || !txt) return;
        pr.reply = txt; pr.repliedAt = SYS.now(); editing = null; draft = ''; mark(pr.id);
        SYS.toast('Reply posted on Google'); SYS.changed();
      }
    },
    leave: function(){ editing = null; draft = ''; }
  });
  SYS.on(function(o){ if (o.trade){ sel = null; selRev = null; editing = null; draft = ''; pv = 'text'; fresh = {}; } });

  SYS.css('reviews', [
    '.rv-top{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) minmax(0,1.75fr)}',
    '.rv-top>.stat{border-left:1px solid var(--line2);min-width:0}',
    '.rv-top>.stat:first-child{border-left:0}',
    '.rv-v{display:flex;align-items:center;gap:8px}',
    '.rv .rv-stars{display:inline-flex;gap:1px;color:var(--ink);flex:none}',
    '.rv .rv-stars svg{width:12px;height:12px}',
    '.rv .rv-stars svg.off{color:var(--line)}',
    '.rv-v .rv-stars svg{width:13px;height:13px}',
    '.rv-ch{display:grid;grid-template-columns:50px repeat(6,minmax(0,1fr));align-items:end;margin-top:6px;font-size:11.5px;line-height:1.3;font-variant-numeric:tabular-nums}',
    '.rv-ch span{text-align:center;color:var(--ink3)}',
    '.rv-ch .lab{text-align:left;color:var(--ink3)}',
    '.rv-ch .n{color:var(--ink2);padding-bottom:2px}',
    '.rv-ch .now{color:var(--ink);font-weight:600}',
    '.rv-ch svg{grid-column:2/-1;display:block;width:100%;height:42px;border-bottom:1px solid var(--line)}',
    '.rv-ch rect{fill:#D6D6DA}',
    '.rv-ch rect.on{fill:var(--ac)}',
    '.rv-ch .m{padding-top:4px}',
    '.rv-main{display:grid;grid-template-columns:minmax(0,1fr) 340px;grid-template-areas:"asks pv" "revs pv";gap:14px;align-items:start;margin-top:14px}',
    '.rv-a{grid-area:asks}.rv-r{grid-area:revs}.rv-p{grid-area:pv}',
    '@media (max-width:1140px){.rv-main{grid-template-columns:minmax(0,1fr);grid-template-areas:"asks" "pv" "revs"}}',
    '@media (min-width:761px) and (max-width:1140px){.rv-pw{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.rv-pw .rv-pv{border-radius:0 0 0 var(--r)}.rv-pw .rv-hist{border-top:0;border-left:1px solid var(--line2);padding-top:14px}}',
    '.rv-ask{width:100%;text-align:left}',
    '.rv .tag[data-s=due]{color:var(--ac-text);border-color:var(--ac-line)}',
    '.rv-rule{padding:10px 14px;border-top:1px solid var(--line2);font-size:12.5px;color:var(--ink2);background:var(--sunk);border-radius:0 0 var(--r) var(--r)}',
    '.rv-rev{padding:12px 14px;border-top:1px solid var(--line2)}',
    '.rv-rev:first-child{border-top:0}',
    '.rv-rev.sel{background:var(--ac-soft);box-shadow:inset 2px 0 0 var(--ac)}',
    '.rv-rev.new-in{animation:rowin .5s ease-out}',
    '.rv-rh{display:flex;align-items:center;gap:10px}',
    '.rv-rh .main-t{flex:1;min-width:0}',
    '.rv-rh .t1{display:block;font-weight:550}',
    '.rv-rh .t2{display:block;font-size:12.5px;color:var(--ink3)}',
    '.rv-txt{margin:8px 0 0 40px;font-size:13.5px;line-height:1.5}',
    '.rv-reply{margin:10px 0 0 40px;padding:2px 0 2px 12px;border-left:2px solid var(--line)}',
    '.rv-reply p{margin-top:2px;font-size:13px;color:var(--ink2)}',
    '.rv-edit{margin:10px 0 0 40px;display:flex;flex-direction:column;gap:6px}',
    '.rv-eb{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0 0 40px}',
    '.rv-edit .rv-eb{margin:2px 0 0}',
    '.rv-pv{background:var(--sunk)}',
    '.rv-hist{border-top:1px solid var(--line2);padding-top:10px;padding-bottom:6px}',
    '.rv-hh{margin-bottom:2px}',
    '.rv-gp{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 4px 4px;text-align:center}',
    '.rv-gp b{font-size:14px;font-weight:600}',
    '.rv-gp small{font-size:11.5px;color:var(--ink3)}',
    '.rv-gs{display:flex;gap:6px;margin:14px 0;color:var(--ink3)}',
    '.rv-gs svg{width:30px;height:30px}',
    '.rv-gbox{align-self:stretch;height:84px;padding:9px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px;color:var(--ink3);text-align:left}',
    '.rv-gpost{align-self:flex-end;margin-top:12px;height:30px;line-height:30px;padding:0 16px;border-radius:6px;background:var(--hover);color:var(--ink3);font-size:12.5px;font-weight:550}',
    '.rv-dseg{display:flex;justify-content:center;margin-bottom:14px}',
    '.rv-dh{margin-top:16px}',
    '@media (max-width:1060px){.rv-top{grid-template-columns:repeat(4,minmax(0,1fr))}.rv-top>.rv-trend{grid-column:1/-1;border-left:0;border-top:1px solid var(--line2)}}',
    '@media (max-width:760px){',
    '  .rv-top{grid-template-columns:repeat(2,minmax(0,1fr))}',
    '  .rv-top>.stat:nth-child(3){border-left:0}',
    '  .rv-top>.stat:nth-child(n+3){border-top:1px solid var(--line2)}',
    '  .rv-txt,.rv-reply,.rv-edit,.rv-eb{margin-left:0}',
    '  .rv-ask .t2{white-space:normal}',
    '  .rv-ask.sel{background:none;box-shadow:none}',
    '  .rv .btn.sm,.rv-dr .btn.sm,.btn.rv-act{height:40px}',
    '  .rv .seg button,.rv-dr .seg button{height:40px}',
    '  .rv-ch{grid-template-columns:46px repeat(6,minmax(0,1fr))}',
    '}'
  ].join('\n'));
})();
