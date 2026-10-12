/* /try/booking/ — the customer books at night, the owner finds it in the morning. The visitor names
   their business, lands on its small website at 22:14, picks a job and a free slot, lets the phone
   fill in the details, pays the deposit (where the trade takes one), then jumps to 07:30 the next
   morning on the owner's phone. The scene times are set; the seconds between them are real. */
(function(){
  var SITES = window.TRYSITES || {};
  var real0, scene0;
  function sceneNow(){ return new Date(scene0.getTime() + (Date.now() - real0)); }
  var K = window.TryKit && TryKit({
    demo: 'booking', empty: 'Nothing yet. It’s late.', waiting: 'Overnight', fromTomorrow: true,
    ctaText: function(){ return 'Continue'; },
    start: function(K, A){
      real0 = Date.now(); scene0 = new Date(); scene0.setHours(22, 14, 0, 0);
      K.clockAt(sceneNow());
      var W = SITES[A.kind] || SITES.other;
      K.$('ph').style.setProperty('--bz', W.c);
      K.bind('[data-word]', W.word.charAt(0).toUpperCase() + W.word.slice(1));
      K.$('creds').innerHTML = W.creds.map(function(c){ return '<li>' + K.esc(c) + '</li>'; }).join('');
      K.$('svcs').innerHTML = W.services.map(function(c){ return '<li>' + K.esc(c) + '</li>'; }).join('');
      K.$('wbPick').hidden = false; K.$('wbDet').hidden = true; K.$('af').hidden = true;
      K.$('fName').textContent = ''; K.$('fMob').textContent = '';
      var away = { salon: 1, garage: 1, clinic: 1, professional: 1, hospitality: 1 }[A.kind];
      K.$('notes').innerHTML = (away ? ['First visit', 'Need parking', 'Nothing else'] : ['Call before you come', 'Parking outside', 'Nothing else']).map(function(n){ return '<button type="button" class="wb-note" aria-pressed="false">' + n + '</button>'; }).join('');
      var c = K.$('wbDet').querySelector('[data-act=confirm]'); c.disabled = true; c.textContent = 'Fill in your details';
      K.show('site'); K.step(0);
      K.narrate('It’s 22:14. Your customer has just got in and found your website.', 'Tap Book online.');
    },
    acts: {
      book: function(){
        var A = K.A; A.t.open = sceneNow(); K.clockAt(A.t.open);
        K.feed('globe', 'gry', '<b>Booking page opened</b> from your website', A.t.open);
        K.show('web'); K.step(1); K.$('wb').scrollTop = 0;
        K.narrate('Your diary, live. Slots that are taken are already gone.', 'Pick what they need, a day and a time.');
      },
      'continue': function(){
        var A = K.A; if (A.job == null || A.slot == null) return;
        K.clockAt(sceneNow());
        K.bind('[data-jobname]', K.jobName()); K.bind('[data-when]', K.when());
        K.$('wbPick').hidden = true; K.$('wbDet').hidden = false; K.$('wb').scrollTop = 0; K.step(2);
        K.later(function(){ K.$('af').hidden = false; }, 350);
        K.narrate('Just a name and a number. Their phone fills them in.', 'Tap AutoFill.');
      },
      detback: function(){ K.$('wbDet').hidden = true; K.$('wbPick').hidden = false; K.$('af').hidden = true; K.step(1); K.narrate('Your diary, live. Slots that are taken are already gone.', 'Pick what they need, a day and a time.'); },
      fill: function(){
        var A = K.A;
        K.$('fName').textContent = 'Sam Carter'; K.$('fMob').textContent = A.custNo; K.$('af').hidden = true;
        var c = K.$('wbDet').querySelector('[data-act=confirm]'); c.disabled = false; c.textContent = A.dep ? 'Continue to the deposit' : 'Confirm the booking';
        K.narrate('That’s all you need from them.', 'Add a note if you like, then continue.');
      },
      confirm: function(){ K.clockAt(sceneNow()); K.step(3); K.toPay(); },
      oapp: function(){ openApp(); }
    },
    booked: function(K, A){
      A.t.booked = sceneNow(); K.clockAt(A.t.booked);
      K.lead('Sam Carter', null);
      K.done(A.t.booked);
      var note = K.$('notes').querySelector('[aria-pressed=true]');
      if (note && note.textContent !== 'Nothing else') K.tag('amb', 'msg', note.textContent);
      K.narrate('Booked at ' + K.hm(A.t.booked) + ', while you were on the sofa.', 'Now see what’s waiting in the morning.');
      K.track('demo_completed', { kind: A.kind, seconds: Math.round((Date.now() - real0) / 1000) });
      K.later(morning, 3600);
    },
    finish: function(K, A){
      return ['Booked at ' + K.hm(A.t.booked) + '. In your diary by morning.',
        'That’s online booking on your own website: it fills the diary while you’re off the clock, and the deposit means people turn up. I build it and set it up in your name, on your real diary.'];
    }
  });
  if (!K) return;

  K.$('notes').addEventListener('click', function(e){
    var b = e.target.closest('.wb-note'); if (!b) return;
    [].forEach.call(K.$('notes').children, function(c){ c.setAttribute('aria-pressed', String(c === b && c.getAttribute('aria-pressed') !== 'true')); });
  });

  function morning(){
    var A = K.A, m = new Date(); m.setDate(m.getDate() + 1); m.setHours(7, 30, 0, 0);
    K.clockAt(m); K.step(4);
    K.show('olock', true); K.$('ontf').hidden = true;
    K.bind('[data-otext]', 'New booking overnight: ' + K.jobName() + ', ' + K.when() + '.' + (A.dep ? ' £' + A.dep + ' deposit paid.' : '') + ' Sam Carter, booked online at ' + K.hm(A.t.booked) + '.');
    K.narrate('Next morning, 07:30. This is on your phone.', 'Wait a moment.');
    K.later(function(){ K.$('ontf').hidden = false; K.narrate('Next morning, 07:30. This is on your phone.', 'Tap the notification.'); }, 1100);
  }
  /* the owner's app: the booked day, with the new job in it */
  function openApp(){
    var A = K.A, day = A.days[A.day], m = new Date(); m.setDate(m.getDate() + 1);
    var today = day.toDateString() === m.toDateString();
    K.bind('[data-appday]', (today ? 'Today, ' : '') + K.DAYS[day.getDay()] + ' ' + day.getDate() + ' ' + K.MON[day.getMonth()].slice(0, 3));
    var n = 0; A.slots.forEach(function(s, i){ if (i === A.slot || K.taken(day, i)) n++; });
    K.bind('[data-appsum]', n + (n === 1 ? ' job' : ' jobs') + ' · 1 new overnight');
    K.$('appList').innerHTML = A.slots.map(function(s, i){
      if (i === A.slot) return '<li class="ap-new"><time>' + s + '</time><div><span class="ap-flag">New · booked ' + K.hm(A.t.booked) + ' last night</span><b>' + K.esc(K.jobName()) + '</b><small>Sam Carter · ' + A.custNo + '</small>' + (A.dep ? '<span class="ap-paid">£' + A.dep + ' deposit paid</span>' : '') + '<span class="ap-rem">Reminder sent to Sam</span></div></li>';
      if (K.taken(day, i)) return '<li><time>' + s + '</time><div><b>' + K.esc(A.J.jobs[(i + day.getDate()) % A.J.jobs.length][0]) + '</b><small>Booked</small></div></li>';
      return '<li class="ap-free"><time>' + s + '</time><div><small>Free</small></div></li>';
    }).join('');
    K.show('app');
    K.narrate('Your day, already sorted: the new job, their details and the deposit.', '');
    K.later(function(){ K.owner('Booked overnight' + (A.dep ? ', deposit paid' : '') + ', reminder sent. You didn’t lift a finger.', true); }, 1600);
  }
})();
