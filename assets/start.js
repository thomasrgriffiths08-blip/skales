/* /start/ — the bio landing page. One question a screen, then book a call on the page or send a request.
   Every screen is a history entry, so the phone's back button steps back a question; answers live in
   sessionStorage, so a refresh keeps them. The answers go into the booking as Calendly's first question
   (a1) or into the request, with the channel they came from. The calendar script starts loading on the
   first tap, so it is ready by the time they reach it. */
(function(){
  var d = document, S = window.SITE || {}, QS = window.STARTQS || [], B = window.STARTBUDGET || { min: 500, max: 10000, start: 1500 };
  var $ = function(id){ return d.getElementById(id); };
  var form = $('sf'); if (!form) return;
  var secs = {}; [].forEach.call(form.querySelectorAll('.sf-s'), function(s){ secs[s.getAttribute('data-s')] = s; });
  var back = $('back'), next = $('next'), bar = $('bar'), count = $('count'), prog = $('prog'), range = $('budget'), money = $('money'), other = $('other'), otherBox = $('otherBox'), elseBtn = $('elseBtn'), bands = $('bands');
  var enc = encodeURIComponent;
  var store = { get: function(k){ try { return JSON.parse(sessionStorage.getItem(k)); } catch (e){ return null; } }, set: function(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e){} } };
  function track(name, props){ if (window.skTrack) skTrack(name, props); }   // assets/site.js

  /* where they came from (bio, story, an ad): kept for the booking so Tom sees the channel */
  var utm = store.get('st-utm') || {};
  location.search.replace(/[?&](utm_[a-z]+|ref)=([^&#]*)/g, function(_, k, v){ utm[k] = decodeURIComponent(v.replace(/\+/g, ' ')); });
  store.set('st-utm', utm);
  var channel = utm.utm_source ? [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ') : (utm.ref || 'direct');

  var a = store.get('st-c') || {}, cur = 'need', started = false;
  var FLOW = ['need', 'goal', 'when', 'budget', 'how'], TOTAL = FLOW.length + 1;
  var q = function(key){ for (var i = 0; i < QS.length; i++) if (QS[i].key === key) return QS[i]; return null; };
  var label = function(key, v){ var x = q(key); if (x) for (var j = 0; j < x.opts.length; j++) if (x.opts[j].v === v) return x.opts[j].t; return ''; };
  var list = function(key){ return [].concat(a[key] || []); };
  var save = function(){ store.set('st-c', a); };
  var pounds = function(n){ n = +n; var t = n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n); return '£' + t + (n >= B.max ? '+' : ''); };

  /* ---------- screens ---------- */
  function ready(){
    if (cur === 'need') return list('need').length > 0 && (list('need').indexOf('other') < 0 || list('need').length > 1 || (a.other || '').trim().length > 1);
    if (cur === 'goal') return list('goal').length > 0;
    return true;
  }
  function paint(){
    var x = q(cur);
    if (x){ var picked = list(cur); [].forEach.call(secs[cur].querySelectorAll('.sf-o'), function(o){ o.setAttribute('aria-pressed', String(picked.indexOf(o.getAttribute('data-v')) > -1)); }); }
    if (cur === 'need' && otherBox){ otherBox.hidden = list('need').indexOf('other') < 0; if (other && other.value !== (a.other || '')) other.value = a.other || ''; }
    if (cur === 'budget'){
      range.value = a.budget || B.start; range.style.setProperty('--p', ((range.value - B.min) / (B.max - B.min) * 100) + '%');
      money.textContent = a.band || pounds(range.value); secs.budget.classList.toggle('is-band', !!a.band);
      var open = !!(a.band || a.elseOpen); bands.hidden = !open; elseBtn.setAttribute('aria-expanded', String(open));
      [].forEach.call(bands.querySelectorAll('[data-band]'), function(x){ x.setAttribute('aria-pressed', String(x.getAttribute('data-band') === a.band)); });
    }
    var showNext = cur === 'need' || cur === 'goal' || cur === 'budget' || cur === 'reach';
    next.hidden = !showNext; next.disabled = !ready(); next.textContent = cur === 'reach' ? 'Send request' : 'Continue';
    back.hidden = cur === 'need' || cur === 'sent'; bar.hidden = cur === 'sent' || cur === 'book' || (back.hidden && next.hidden);
    bar.classList.toggle('solo', next.hidden);
    var at = FLOW.indexOf(cur), n = at > -1 ? at + 1 : TOTAL;
    count.textContent = n + ' / ' + TOTAL; prog.style.width = (n / TOTAL * 100) + '%';
  }
  function show(name, push){
    if (!secs[name]) name = 'need';
    cur = name;
    for (var k in secs) secs[k].hidden = k !== name;
    paint();
    if (push) history.pushState({ s: name }, '', name === 'need' ? location.pathname + location.search : '#' + name);
    scrollTo(0, 0);
    var h = secs[name].querySelector('h1,h2'); if (h && push) h.focus({ preventScroll: true });
    if (name === 'book') openBook();
  }
  addEventListener('popstate', function(e){ show((e.state && e.state.s) || (location.hash || '').slice(1) || 'need'); });
  function goBack(){ if (history.state && history.state.s) history.back(); else show(FLOW[Math.max(0, FLOW.indexOf(cur) - 1)] || 'how', true); }
  back.addEventListener('click', goBack);
  next.addEventListener('click', function(){
    if (next.disabled) return;
    if (cur === 'reach') return send();
    if (cur === 'budget' && !a.band){ a.budget = +range.value; save(); }
    show(FLOW[FLOW.indexOf(cur) + 1], true);
  });

  form.addEventListener('click', function(e){
    if (e.target.closest('[data-back]')) return goBack();
    var p = e.target.closest('[data-path]');
    if (p){ a.path = p.getAttribute('data-path'); save(); track(a.path === 'book' ? 'call_clicked' : 'request_clicked', { channel: channel }); return show(a.path, true); }
    var o = e.target.closest('.sf-o[data-k]'); if (!o) return;
    var k = o.getAttribute('data-k'), v = o.getAttribute('data-v');
    if (!started){ started = true; track('check_started', { channel: channel }); warm(); }
    if (o.hasAttribute('data-multi')){
      var l = list(k), at = l.indexOf(v);
      if (at > -1) l.splice(at, 1); else l.push(v);
      a[k] = l; save(); paint();
      if (v === 'other' && at < 0 && other) other.focus();
      return;
    }
    a[k] = v; save(); paint();
    setTimeout(function(){ show(FLOW[FLOW.indexOf(cur) + 1], true); }, 160);
  });
  if (other) other.addEventListener('input', function(){ a.other = other.value.slice(0, 120); save(); next.disabled = !ready(); });
  range.addEventListener('input', function(){ a.budget = +range.value; a.band = ''; save(); paint(); });
  elseBtn.addEventListener('click', function(){ a.elseOpen = !(a.elseOpen || a.band); if (!a.elseOpen) a.band = ''; save(); paint(); });
  bands.addEventListener('click', function(e){ var x = e.target.closest('[data-band]'); if (!x) return; var v = x.getAttribute('data-band'); a.band = a.band === v ? '' : v; a.elseOpen = true; save(); paint(); });
  form.addEventListener('submit', function(e){ e.preventDefault(); if (cur === 'reach') send(); });

  /* ---------- the answers, for the booking and for Tom ---------- */
  function summary(){
    var need = list('need').filter(function(v){ return v !== 'other'; }).map(function(v){ return label('need', v); });
    if (list('need').indexOf('other') > -1) need.push((a.other || '').trim() || 'Something else');
    var goal = list('goal').map(function(v){ return label('goal', v); });
    return [need.length ? 'Needs: ' + need.join(', ') : '', goal.length ? 'Goal: ' + goal.join(', ') : '', a.when ? 'Start: ' + label('when', a.when) : '',
      a.band ? 'Budget: ' + a.band : a.budget ? 'Budget: about ' + pounds(a.budget) : '', 'Came from: ' + channel].filter(Boolean).join('\n');
  }

  /* ---------- the call: Calendly or Cal.com inline, else a request ---------- */
  var calLoaded = false, calBooted = '';
  function warm(){
    if (!S.calendly || /cal\.com\//.test(S.calendly) || window.Calendly || calLoaded) return;
    calLoaded = true;
    var s = d.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true;
    s.onerror = function(){ calLoaded = 'failed'; }; d.head.appendChild(s);
  }
  function openBook(){
    var cal = $('cal'), none = $('calNone'), note = summary();
    if (calBooted === note && cal.querySelector('iframe')) return;
    calBooted = note;
    function fallback(){ cal.innerHTML = ''; cal.hidden = true; none.hidden = false; }
    if (!S.calendly) return fallback();
    none.hidden = true; cal.hidden = false;
    var join = S.calendly.indexOf('?') > -1 ? '&' : '?';
    if (/cal\.com\//.test(S.calendly)){ cal.innerHTML = '<iframe title="Book a call" src="' + S.calendly + join + 'embed=true&theme=dark&notes=' + enc(note) + '"></iframe>'; return; }
    var url = S.calendly + join + 'hide_gdpr_banner=1&hide_event_type_details=1&background_color=0a0b0d&text_color=f4f4f5&primary_color=ffe600&a1=' + enc(note);
    var boot = function(){ if (!window.Calendly) return fallback(); cal.innerHTML = ''; window.Calendly.initInlineWidget({ url: url, parentElement: cal }); };
    if (window.Calendly) boot();
    else { warm(); var waited = 0, iv = setInterval(function(){ waited += 150; if (window.Calendly){ clearInterval(iv); boot(); } else if (calLoaded === 'failed' || waited > 8000){ clearInterval(iv); fallback(); } }, 150); }
  }
  addEventListener('message', function(e){
    var booked = (/calendly\.com$/.test(e.origin) && e.data && e.data.event === 'calendly.event_scheduled') || (/cal\.com$/.test(e.origin) && e.data && /booking(Successful|_successful)/i.test(JSON.stringify(e.data)));
    if (!booked) return;
    track('call_booked', { channel: channel, tool: /cal\.com$/.test(e.origin) ? 'cal.com' : 'calendly' });
    var done = $('done'); done.textContent = 'Booked. The confirmation is on its way to your email. Speak soon.'; done.hidden = false;
  });

  /* ---------- the request: their details and answers, written out and handed to their email app ---------- */
  function send(){
    var name = $('fName').value.trim(), tel = $('fTel').value.trim(), mail = $('fMail').value.trim(), err = $('err');
    var bad = name.length < 2 ? 'Add your name.' : tel.replace(/\D/g, '').length < 9 ? 'Add a WhatsApp number I can reach you on.' : !/^\S+@\S+\.\S+$/.test(mail) ? 'Add an email address.' : '';
    if (bad){ err.textContent = bad; err.hidden = false; return; }
    err.hidden = true;
    var msg = 'Hi Tom, here is my request.\n\nName: ' + name + '\nWhatsApp: ' + tel + '\nEmail: ' + mail + '\n\n' + summary();
    var href = 'mailto:' + S.email + '?subject=' + enc('Request from ' + name) + '&body=' + enc(msg);
    $('sentMail').href = href;
    track('request_sent', { channel: channel });
    show('sent', true);
    location.href = href;
  }

  /* ---------- first paint ---------- */
  track('start_view', { channel: channel });
  var first = (location.hash || '').slice(1);
  if (first && secs[first] && first !== 'sent' && list('need').length){ history.replaceState({ s: first }, '', '#' + first); show(first); }
  else { if (location.hash) history.replaceState(null, '', location.pathname + location.search); show('need'); }
})();
