/* the night line — the missed-call sequence, played out. Content, so it runs regardless of reduced motion. */
(function(){
  var d = document, log = d.getElementById('log'), thread = d.getElementById('thread'), out = d.getElementById('lineOut'),
      btn = d.getElementById('ring'), lamp = d.getElementById('lineLamp');
  if (!log) return;
  var BEATS = [
    { d:0,    t:'21:47:04', k:'Incoming', c:'missed', m:'<s>07700 900461</s> &mdash; six rings, no answer. Dan&rsquo;s at his daughter&rsquo;s birthday tea.' },
    { d:1000, t:'21:47:15', k:'System',   c:'sys', m:'Missed-call text-back sent &mdash; <b>11 seconds</b> after the miss.', bub:{ s:'out', x:'Sorry we missed you — Redgate Heating here. What&rsquo;s up? Reply to this and we&rsquo;ll get you sorted.' } },
    { d:1500, t:'21:49:32', k:'Customer', c:'', m:'Replied. The lead is now a conversation, not a voicemail.', bub:{ s:'in', x:'No hot water and it&rsquo;s banging when it fires up' } },
    { d:1300, t:'21:49:34', k:'System',   c:'sys', m:'Job created &middot; triage sent &middot; slot offered from the live diary.', bub:{ s:'out', x:'Sounds like the diverter valve. Earliest we can be there is 8am tomorrow — want it holding?' } },
    { d:1500, t:'21:52:10', k:'Customer', c:'', m:'Took the slot herself. No phone call, no back and forth.', bub:{ s:'in', x:'Yes please, 8am works' } },
    { d:1100, t:'21:52:11', k:'System',   c:'sys', m:'<b>&pound;45 deposit taken</b> &middot; slot locked &middot; added to Dan&rsquo;s route for the morning.' },
    { d:1300, t:'07:58:02', k:'Engineer', c:'sys', m:'On the way &mdash; automatic &ldquo;we&rsquo;re 10 minutes out&rdquo; text sent.' }
  ];
  var timers = [], running = false, played = false;
  function play(){
    if (running) return; running = true; played = true;
    timers.forEach(clearTimeout); timers = [];
    log.innerHTML = ''; thread.innerHTML = ''; out.innerHTML = '';
    btn.textContent = 'Ringing'; btn.disabled = true; lamp.classList.remove('is-live');
    var at = 0;
    BEATS.forEach(function(b, i){
      at += b.d;
      timers.push(setTimeout(function(){
        var li = d.createElement('li'); if (b.c) li.className = b.c;
        li.innerHTML = '<span class="t">'+b.t+'</span><span class="k">'+b.k+'</span><span class="m">'+b.m+'</span>';
        log.appendChild(li);
        if (b.bub){ var el = d.createElement('div'); el.className = 'bub '+b.bub.s; el.innerHTML = b.bub.x; thread.appendChild(el); }
        if (i === 1) lamp.classList.add('is-live');
        if (i === BEATS.length - 1){
          out.innerHTML = '<b>One missed call. A job in the diary.</b><span>Time you spent on it: none. You were at a birthday tea, then asleep.</span>';
          btn.textContent = 'Run it again'; btn.disabled = false; running = false;
        }
      }, at));
    });
  }
  btn.addEventListener('click', play);
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(en){ if (en[0].isIntersecting && !played){ play(); io.disconnect(); } }, { threshold: .3 });
    io.observe(d.getElementById('night'));
  }
})();
