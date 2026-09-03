/* the three running systems — invented data, real mechanics. Content, so they run regardless of reduced motion. */
(function(){
  var d = document, on = function(el){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add('on'); }); }); };
  /* 1 · the missed-call catcher */
  var callList = d.getElementById('callList'), tbChat = d.getElementById('tbChat'), missBtn = d.getElementById('missBtn');
  if (callList && tbChat && missBtn){
    var CALLERS = [['Dave M','07·· ··· 412','fence panel down'],['Sarah P','07·· ··· 887','gate won’t shut'],['Liam B','07·· ··· 203','quote for 20m run']], callIdx = 0, busy = false;
    var addCall = function(name, num){ var r = d.createElement('div'); r.className = 'call-row missed'; r.innerHTML = '<span class="who"><b>' + name + '</b><span>' + num + '</span></span><span class="st">missed</span>'; callList.prepend(r); while (callList.children.length > 3) callList.lastChild.remove(); return r; };
    var bubble = function(cls, text, meta){ var b = d.createElement('div'); b.className = 'bubble ' + cls; b.textContent = text; if (meta){ var m = d.createElement('span'); m.className = 'meta'; m.textContent = meta; b.appendChild(m); } tbChat.appendChild(b); while (tbChat.children.length > 5) tbChat.firstChild.remove(); on(b); };
    var runMiss = function(){
      if (busy) return; busy = true; missBtn.disabled = true;
      var c = CALLERS[callIdx % CALLERS.length]; callIdx++; var row = addCall(c[0], c[1]);
      setTimeout(function(){ bubble('out', 'Sorry we missed you — on a job. What needs doing, and your postcode?', 'auto-sent · 41s after the call'); }, 900);
      setTimeout(function(){ row.className = 'call-row caught'; row.querySelector('.st').textContent = 'caught'; }, 1400);
      setTimeout(function(){ bubble('in', c[2].charAt(0).toUpperCase() + c[2].slice(1) + ' — can you take a look?'); }, 2600);
      setTimeout(function(){ bubble('out', 'Can do. I’ll text you two slots in the morning.'); }, 3900);
      setTimeout(function(){ var s = d.createElement('div'); s.className = 'stopwatch'; s.innerHTML = 'missed call → reply: <b>41 seconds</b>'; tbChat.appendChild(s); on(s); busy = false; missBtn.disabled = false; }, 4700);
    };
    missBtn.addEventListener('click', runMiss);
    [['Sarah P','07·· ··· 887'],['Liam B','07·· ··· 203']].forEach(function(c){ var r = addCall(c[0], c[1]); r.className = 'call-row caught'; r.querySelector('.st').textContent = 'caught'; });
    setTimeout(runMiss, 800); setInterval(function(){ if (!busy) runMiss(); }, 14000);
  }
  /* 2 · the pipeline that chases */
  if (d.getElementById('col0')){
    var JOBS = [['Sarah M','gutter repair','£240'],['Apex Lettings','fence line, 3 units','£1,850'],['Dan K','decking quote','£920'],['Priya S','gate + posts','£410']];
    var PINGS = ['new enquiry from the website — added to New','day-3 chase sent to Dan K — no reply yet','Sarah M accepted the quote — moved to Booked','invoice paid — £240 in the bank','reminder: Apex Lettings quote opens tomorrow'];
    var counts = [0,0,0,0], bump = function(){ counts.forEach(function(c, i){ d.getElementById('c' + i + 'n').textContent = c; }); };
    var addJob = function(col, j, hot){ var el = d.createElement('div'); el.className = 'job' + (hot ? ' hot' : ''); el.innerHTML = '<b>' + j[0] + '</b><span>' + j[1] + ' · </span><span class="amt">' + j[2] + '</span>'; d.getElementById('col' + col).appendChild(el); counts[col]++; bump(); on(el); return el; };
    var moveJob = function(el, to, from){ el.classList.remove('on'); setTimeout(function(){ d.getElementById('col' + to).appendChild(el); counts[from]--; counts[to]++; bump(); on(el); }, 380); };
    var ping = function(t){ d.getElementById('ping').innerHTML = '<i></i><span>' + t + '</span>'; };
    var runPipeline = function(){
      [0,1,2,3].forEach(function(i){ d.getElementById('col' + i).querySelectorAll('.job').forEach(function(j){ j.remove(); }); counts[i] = 0; }); bump();
      addJob(3, ['Mrs H','repointing — done Tues','£380']); addJob(1, JOBS[2]); addJob(2, JOBS[1]);
      setTimeout(function(){ var s = addJob(0, JOBS[0], true); ping(PINGS[0]);
        setTimeout(function(){ moveJob(s, 1, 0); ping('quote sent to Sarah M — £240'); }, 2600);
        setTimeout(function(){ moveJob(s, 2, 1); ping(PINGS[2]); }, 5400);
        setTimeout(function(){ moveJob(s, 3, 2); ping(PINGS[3]); }, 8200); }, 900);
      setTimeout(function(){ ping(PINGS[1]); }, 4000); setTimeout(function(){ addJob(0, JOBS[3]); }, 6200); setTimeout(function(){ ping(PINGS[4]); }, 10200);
    };
    runPipeline(); setInterval(runPipeline, 13500);
  }
  /* 3 · the review engine */
  var rvFeed = d.getElementById('rvFeed');
  if (rvFeed){
    var RSTEPS = [['✓','Job marked done','Tuesday, 11:02am'],['✉','Request sent to the customer','same day — while they’re still pleased'],['★','“Brilliant from start to finish”','5 stars · posted with one tap'],['↩','Reply posted in your name','“Thanks Sarah — enjoy the new gate.”']];
    var rvNum = d.getElementById('rvNum'), rvStars = d.getElementById('rvStars');
    var runReviews = function(){
      rvFeed.innerHTML = ''; rvNum.textContent = '4.6'; rvStars.innerHTML = '<b>★★★★</b>★';
      RSTEPS.forEach(function(s, i){ setTimeout(function(){ var el = d.createElement('div'); el.className = 'rv-step'; el.innerHTML = '<span class="ic">' + s[0] + '</span><span><b>' + s[1] + '</b><span>' + s[2] + '</span></span>'; rvFeed.appendChild(el); on(el); if (i === 2){ rvNum.textContent = '4.7'; rvStars.innerHTML = '<b>★★★★★</b>'; } }, 700 + i * 1900); });
    };
    runReviews(); setInterval(runReviews, 12500);
  }
})();
