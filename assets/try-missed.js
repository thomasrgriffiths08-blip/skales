/* /try/missed-call/ — be your own customer. The visitor names their business, calls it on a pretend
   phone, lets it ring out, gets the text-back, books and (where the trade takes one) pays a deposit,
   then sees the same minute from the business's side in the Skales CRM. Every time printed is the
   visitor's real clock, so "missed at 21:47, booked 70 seconds later" is what actually happened on
   their screen. The shared parts live in try-kit.js. */
(function(){
  var K = window.TryKit && TryKit({
    demo: 'missed-call', empty: 'Nothing yet. Make the call.', waiting: 'Waiting for a call',
    start: function(K, A){
      A.sms = "Hi, it's " + A.biz + ". Sorry we missed your call, we're " + A.J.text + " right now. Book a time that suits you here and it's confirmed straight away: " + A.site;
      K.bind('[data-sms]', A.sms);
      K.show('contact'); K.step(0);
      K.narrate('You’re the customer. You need a ' + A.J.jobs[0][0].toLowerCase() + '. Call ' + A.biz + '.', 'Tap the green call button.');
    },
    acts: {
      call: function(){
        var A = K.A; A.t.call = new Date(); K.show('call', true); K.step(1);
        var st = K.layer('call').querySelector('[data-callst]'); st.textContent = 'calling…';
        K.narrate('It’s ringing. ' + A.biz + ' is ' + A.J.text + ', so nobody picks up.', 'Let it ring out, or hang up.');
        K.later(function(){ st.textContent = 'No answer'; }, 6800);
        K.later(function(){ missed(false); }, 7700);
      },
      hangup: function(){ missed(true); },
      open: function(){ K.show('msgs'); K.narrate('A text from ' + K.A.biz + ', with a link to book.', 'Tap the link.'); },
      link: function(){
        var A = K.A; A.t.link = new Date();
        K.feed('link', 'gry', '<b>Booking link opened</b>', A.t.link);
        K.show('web'); K.step(3); K.$('wb').scrollTop = 0;
        K.narrate('Their booking page, on their real diary. Taken slots are already gone.', 'Pick what you need, a day and a time.');
      }
    },
    booked: function(K, A){
      A.t.booked = new Date();
      K.done(A.t.booked);
      K.narrate('Booked, and you never spoke to anyone.', 'Now see it from your side.');
      K.track('demo_completed', { kind: A.kind, seconds: Math.round((A.t.booked - A.t.missed) / 1000) });
      K.later(function(){ K.owner('And this is your side: a booked job' + (A.dep ? ', deposit paid' : '') + ', nothing to chase.'); }, 3200);
    },
    finish: function(K, A){
      return ['Missed at ' + K.hm(A.t.missed) + '. Booked ' + K.span(A.t.missed, A.t.booked) + ' later.',
        'That’s every missed call at ' + A.biz + ', day or night, without you touching your phone. The text, the booking page, the deposit and the CRM are what I build, set up in your name.'];
    }
  });
  if (!K) return;

  function missed(hungUp){
    var A = K.A; if (A.t.missed) return;
    K.clear(); A.t.missed = new Date();
    K.show('lock', true); K.$('ntf').hidden = true;
    K.lead(A.custNo, 'Called at ' + K.hm(A.t.missed));
    K.stage('missed', 'Missed call'); K.tag('red', 'phone', 'Missed call');
    K.feed('phone', 'red', '<b>Missed call</b> from ' + A.custNo, A.t.missed, 'Missed call logged');
    K.step(2);
    K.narrate((hungUp ? 'You hung up.' : 'No answer.') + ' Most people ring the next business at this point.', 'Wait a moment.');
    K.later(textBack, 2600);
  }
  function textBack(){
    var A = K.A; A.t.text = new Date();
    K.stage('texted', 'Texted back'); K.tag('blu', 'zap', 'Texted back');
    K.feed('zap', 'blu', '<b>Text sent automatically</b>, ' + K.secs(A.t.missed, A.t.text) + ' after the call', A.t.text, 'Text-back sent');
    K.bind('[data-smstime]', K.hm(A.t.text));
    K.$('ntf').hidden = false;
    K.narrate('Before you’ve rung anyone else, this arrives.', 'Tap the message.');
  }
})();
