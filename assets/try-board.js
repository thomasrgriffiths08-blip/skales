/* /try/crm-board/ — be the business for a minute. One customer, Priya, moves from Enquiry to Quoted,
   Booked and Done; each move (a drag on a computer, a button anywhere) sends what the real system
   sends: the instant reply, the quote, the chaser two days later, the confirmation, the reminder,
   the invoice and the review request. Her phone shows every text as it lands. Scene times are set
   (an enquiry at 21:03 tonight, then the days skip forward); everything else happens as you tap. */
(function(){
  var COLS = ['e', 'q', 'b', 'd'], NAMES = { e: 'Enquiry', q: 'Quoted', b: 'Booked', d: 'Done' };
  var K = window.TryKit && TryKit({
    demo: 'crm-board', empty: 'Nothing yet.',
    stamp: function(t){ return K.DAYS[t.getDay()].slice(0, 3) + ' ' + K.hm(t); },
    start: function(K, A){
      var J = A.J, d0 = new Date(); d0.setHours(21, 3, 0, 0);
      A.d0 = d0; A.at = 'e'; A.sent = 0; A.q = J.quote;
      K.$('run').classList.add('is-owner');
      K.$('thread').innerHTML = '';
      board();
      K.show('thread');
      K.clockAt(d0);
      K.step(0);
      send(d0, 'Thanks Priya, got your message about the ' + A.q[0].toLowerCase() + '. I’m on a job right now, so I’ll price it up and send it over tomorrow. ' + A.biz,
        '<b>Instant reply</b> sent to Priya', 'Instant reply sent');
      K.narrate('21:03. A new enquiry from Priya. She’s had a reply before you’ve even seen it.', 'Price it up, then move Priya to Quoted.');
    },
    acts: {},
    finish: function(K, A){
      return [A.sent + ' texts to Priya. You typed none of them.',
        'That’s the CRM I build: every enquiry answered, every quote chased, every job confirmed, reminded, invoiced and asked for a review, while you’re on the tools. Set up in your name, on your numbers.'];
    }
  });
  if (!K) return;
  var d = document, $ = K.$;

  /* ---------- the board ---------- */
  var OTHERS = { e: [['Mark Ellison', 1]], q: [['James O’Neill', 2], ['Amira Haddad', 0]], b: [['Hannah Lee', 0], ['Olu Adeyemi', 1]], d: [['Jo Evans', 0], ['Ravi Kumar', 2]] };
  function board(){
    var A = K.A;
    COLS.forEach(function(c){
      $('col-' + c).innerHTML = OTHERS[c].map(function(o){ return '<div class="bd-card"><div class="n">' + K.esc(o[0]) + '</div><div class="j">' + K.esc(A.J.jobs[o[1]][0]) + '</div>' + (c === 'd' ? '<div class="m"><span class="tg grn">Paid</span></div>' : '') + '</div>'; }).join('');
    });
    var p = d.createElement('div'); p.className = 'bd-card is-p'; p.id = 'pcard';
    p.innerHTML = '<div class="n">Priya Shah<span>' + K.esc(A.q[1]) + '</span></div><div class="j">' + K.esc(A.q[0]) + '</div><div class="m" id="tags"></div><button type="button" class="bd-move" data-move></button>';
    $('col-e').insertBefore(p, $('col-e').firstChild);
    K.tag('blu', 'globe', 'Website enquiry');
    counts(); label();
  }
  function counts(){ COLS.forEach(function(c){ d.querySelector('[data-count="' + c + '"]').textContent = $('col-' + c).children.length; }); }
  function label(){
    var b = $('pcard').querySelector('[data-move]'), i = COLS.indexOf(K.A.at);
    b.hidden = i === 3 || K.A.wait; b.textContent = i < 3 ? 'Move to ' + NAMES[COLS[i + 1]] + ' →' : '';
  }
  function showCol(c){ var col = $('col-' + c).parentNode, bd = $('board'); if (bd.scrollWidth > bd.clientWidth) bd.scrollTo({ left: col.offsetLeft - 12, behavior: K.reduce ? 'auto' : 'smooth' }); }

  /* ---------- Priya's phone ---------- */
  var tt;
  function send(t, text, log, short){
    var A = K.A; A.sent++;
    K.clockAt(t);
    bubble('in', text, t);
    K.feed('msg', 'blu', log, t);
    if (innerWidth < 1000){
      var x = $('toast'); clearTimeout(tt); x.hidden = false; x.classList.remove('is-out'); x.classList.add('is-msg');
      x.innerHTML = '<span><b>Sent to Priya</b> · ' + K.esc(short) + '</span>';
      tt = setTimeout(function(){ x.classList.add('is-out'); tt = setTimeout(function(){ x.hidden = true; }, 320); }, 2600);
    }
  }
  var lastDay = '';
  function bubble(dir, text, t){
    var th = $('thread'), day = t.toDateString();
    if (day !== lastDay){ lastDay = day; var s = d.createElement('p'); s.className = 'ms-stamp'; s.textContent = K.DAYS[t.getDay()] + ' ' + K.hm(t); th.appendChild(s); }
    var b = d.createElement('p'); b.className = 'bub ' + dir; b.textContent = text; th.appendChild(b);
    th.scrollTo({ top: th.scrollHeight, behavior: K.reduce ? 'auto' : 'smooth' });
  }
  function days(n, h, m){ var t = new Date(K.A.d0); t.setDate(t.getDate() + n); t.setHours(h, m || 0, 0, 0); return t; }
  function skip(text, fn){
    K.A.wait = true;
    $('hint').innerHTML = '<button type="button" class="btn btn-ghost btn-sm" id="skip">' + K.esc(text) + '</button>';
    $('skip').addEventListener('click', function(){ $('hint').textContent = ''; fn(); });
  }

  /* ---------- the moves ---------- */
  function move(to){
    var A = K.A, i = COLS.indexOf(A.at);
    if (A.wait || COLS.indexOf(to) !== i + 1) return false;
    A.at = to;
    var p = $('pcard'); $('col-' + to).insertBefore(p, $('col-' + to).firstChild);
    p.classList.remove('is-land'); void p.offsetWidth; p.classList.add('is-land');
    counts(); showCol(to); K.step(i + 1);
    STAGE[to]();
    label();
    return true;
  }
  var STAGE = {
    q: function(){
      var A = K.A, t = days(1, 8, 40);
      K.tag('amb', 'card', 'Quote ' + A.q[1]);
      send(t, 'Hi Priya, here’s your quote for the ' + A.q[0].toLowerCase() + ': ' + A.q[1] + '. See the details and accept it here: ' + A.domain + '/q/4821', '<b>Quote sent</b> to Priya', 'Your quote');
      K.narrate('Quote sent. Now Priya goes quiet. This is where most quotes die.', '');
      skip('Skip two days', chase);
    },
    b: function(){
      var A = K.A, t = days(3, 10, 6), job = days(5, 8, 0);
      while (job.getDay() === 0 || job.getDay() === 6) job.setDate(job.getDate() + 1);
      A.job = job;
      K.tag('grn', 'diary', K.DAYS[job.getDay()].slice(0, 3) + ' ' + job.getDate() + ' ' + K.MON[job.getMonth()].slice(0, 3));
      send(t, 'Booked: ' + A.q[0].toLowerCase() + ', ' + K.DAYS[job.getDay()] + ' ' + job.getDate() + ' ' + K.MON[job.getMonth()] + ' at 8:00. We’ll remind you the day before. ' + A.biz, '<b>Confirmation sent</b>, reminder set for the day before', 'Booking confirmed');
      K.narrate('Booked. The confirmation went on its own, and the reminder is set.', '');
      skip('Skip to the night before', remind);
    },
    d: function(){
      var A = K.A, t = new Date(A.job); t.setHours(16, 30, 0, 0);
      K.tag('grn', 'check', 'Invoiced');
      send(t, 'Thanks Priya, all done. Your invoice for ' + A.q[1] + ' is here, pay by card or bank transfer: ' + A.domain + '/i/4821', '<b>Invoice sent</b> to Priya', 'Invoice');
      K.narrate('Job done. The invoice went out as you packed up.', 'Wait a moment.');
      A.wait = true; label();
      K.later(function(){
        var r = new Date(A.job); r.setHours(18, 30, 0, 0);
        K.tag('amb', 'msg', 'Review asked');
        send(r, 'Hope it’s all working well, Priya! If you’re happy with the job, a quick Google review would really help a small business like ours: ' + A.domain + '/review', '<b>Review request</b> sent, two hours after the job', 'Review request');
        K.track('demo_completed', { kind: A.kind, texts: A.sent });
        K.later(theirSide, 1800);
      }, 2200);
    }
  };
  function chase(){
    var A = K.A, t = days(3, 10, 0);
    K.tag('amb', 'link', 'Viewed twice');
    send(t, 'Hi Priya, just checking the quote came through OK. Happy to answer any questions, or you can book a date here: ' + A.domain + '/q/4821', '<b>Quote chaser</b> sent, two days after the quote', 'Quote chaser');
    K.narrate('Two days later, the chaser goes out on its own.', 'Wait a moment.');
    K.later(function(){
      var r = days(3, 10, 4);
      bubble('out', 'Sorry, been manic! Yes please, can you do next week?', r);
      K.feed('msg', 'grn', '<b>Priya replied</b>: “Yes please, can you do next week?”', r);
      A.wait = false; label();
      K.narrate('The chaser did the chasing. Priya says yes.', 'Move Priya to Booked.');
    }, 1800);
  }
  function remind(){
    var A = K.A, t = new Date(A.job); t.setDate(t.getDate() - 1); t.setHours(18, 0, 0, 0);
    send(t, 'Reminder: we’re with you tomorrow at 8:00 for your ' + A.q[0].toLowerCase() + '. Reply R if you need to rearrange.', '<b>Reminder sent</b>, the night before', 'Reminder');
    A.wait = false; label();
    K.narrate('The night before, the reminder goes out. Nobody forgets.', 'When the job’s done, move Priya to Done.');
  }
  function theirSide(){
    K.$('run').classList.remove('is-owner');
    K.owner('Done. Here’s what Priya got, and you typed none of it.', true);
  }

  /* buttons on the card, and dragging it on a computer */
  $('board').addEventListener('click', function(e){
    var b = e.target.closest('[data-move]'); if (!b || !K.A) return;
    move(COLS[COLS.indexOf(K.A.at) + 1]);
  });
  var drag = null;
  $('board').addEventListener('pointerdown', function(e){
    var p = e.target.closest('#pcard');
    if (!p || e.pointerType === 'touch' || e.target.closest('button') || K.A.wait) return;
    drag = { p: p, x: e.clientX, y: e.clientY }; p.setPointerCapture(e.pointerId); p.classList.add('is-drag');
  });
  $('board').addEventListener('pointermove', function(e){
    if (!drag) return;
    drag.p.style.transform = 'translate(' + (e.clientX - drag.x) + 'px,' + (e.clientY - drag.y) + 'px) rotate(1.5deg)';
    var over = col(e); [].forEach.call(d.querySelectorAll('.bd-col'), function(c){ c.classList.toggle('is-over', c === over); });
  });
  $('board').addEventListener('pointerup', function(e){
    if (!drag) return;
    var p = drag.p, over = col(e); drag = null;
    p.classList.remove('is-drag'); p.style.transform = '';
    [].forEach.call(d.querySelectorAll('.bd-col'), function(c){ c.classList.remove('is-over'); });
    if (over && !move(over.getAttribute('data-col')) && over.getAttribute('data-col') !== K.A.at) K.narrate('Move her one step at a time: ' + NAMES[COLS[COLS.indexOf(K.A.at) + 1]] + ' is next.', $('hint').textContent);
  });
  function col(e){ var p = $('pcard'); p.style.pointerEvents = 'none'; var el = d.elementFromPoint(e.clientX, e.clientY); p.style.pointerEvents = ''; return el && el.closest('.bd-col'); }
})();
