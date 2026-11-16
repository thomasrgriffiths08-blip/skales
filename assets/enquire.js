/* /enquire/ — the full enquiry form. One question a screen (same engine and look as /start/), then
   the calendar. Every screen is a history entry, so the phone's back button steps back a question;
   answers live in sessionStorage, so a refresh keeps them. On Send:
   - if SITE.formKey is set, the whole form is emailed to Tom through Web3Forms straight away;
   - the calendar opens with their name and email filled in and every answer in Calendly's first
     question (a1), so the call starts on their business;
   - "Send my answers on WhatsApp" hands the same summary to WhatsApp for anyone not ready to book. */
(function(){
  var d = document, S = window.SITE || {}, KEY = S.formKey || window.EQKEY || '', QS = window.EQQS || [], B = window.EQBUDGET || { min: 1500, max: 15000, start: 5000 };
  var $ = function(id){ return d.getElementById(id); };
  var form = $('eq'); if (!form) return;
  var secs = {}; [].forEach.call(form.querySelectorAll('.sf-s'), function(s){ secs[s.getAttribute('data-s')] = s; });
  var back = $('back'), next = $('next'), bar = $('bar'), count = $('count'), prog = $('prog'), range = $('budget'), money = $('money');
  var enc = encodeURIComponent;
  var store = { get: function(k){ try { return JSON.parse(sessionStorage.getItem(k)); } catch (e){ return null; } }, set: function(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e){} } };
  function track(name, props){ if (window.skTrack) skTrack(name, props); }   // assets/site.js

  /* where they came from: a utm tag, the source site.js kept for this visit, or the referrer */
  var utm = store.get('eq-utm') || {};
  location.search.replace(/[?&](utm_[a-z]+|ref)=([^&#]*)/g, function(_, k, v){ utm[k] = decodeURIComponent(v.replace(/\+/g, ' ')); });
  store.set('eq-utm', utm);
  var kept = ''; try { kept = sessionStorage.getItem('sk_src') || ''; } catch (e){}
  var channel = utm.utm_source ? [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ') : (utm.ref || kept.replace(/^"|"$/g, '') || 'direct');

  var a = store.get('eq-c') || {}, cur = 'biz', started = false, sent = store.get('eq-sent') || '';
  var FLOW = ['biz', 'stage', 'revenue', 'need', 'when', 'budget', 'contact', 'book'], TOTAL = FLOW.length;
  var FIELDS = { fBiz: 'biz', fWhat: 'what', fTown: 'town', fSite: 'site', fNotes: 'notes', fName: 'name', fMail: 'mail', fTel: 'tel' };
  var q = function(key){ for (var i = 0; i < QS.length; i++) if (QS[i].key === key) return QS[i]; return null; };
  var label = function(key, v){ var x = q(key); if (x) for (var j = 0; j < x.opts.length; j++) if (x.opts[j].v === v) return x.opts[j].t; return ''; };
  var list = function(key){ return [].concat(a[key] || []); };
  var val = function(k){ return String(a[k] || '').trim(); };
  var save = function(){ store.set('eq-c', a); };
  var pounds = function(n){ n = +n; var t = n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n); return '£' + t + (n >= B.max ? '+' : ''); };
  var okMail = function(m){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m); };
  var okTel = function(t){ return t.replace(/\D/g, '').length >= 9; };

  /* ---------- screens ---------- */
  function ready(){
    if (cur === 'biz') return val('biz').length > 1 && val('what').length > 1;
    if (cur === 'need') return list('need').length > 0;
    if (cur === 'contact') return true;   // checked on Send, so a missing field gets a message rather than a dead button
    return true;
  }
  function paint(){
    var x = q(cur);
    if (x){ var picked = list(cur); [].forEach.call(secs[cur].querySelectorAll('.sf-o'), function(o){ o.setAttribute('aria-pressed', String(picked.indexOf(o.getAttribute('data-v')) > -1)); }); }
    [].forEach.call(secs[cur].querySelectorAll('input[id],textarea[id]'), function(f){ var k = FIELDS[f.id]; if (k && f.value !== (a[k] || '')) f.value = a[k] || ''; });
    if (cur === 'budget'){ range.value = a.budget || B.start; range.style.setProperty('--p', ((range.value - B.min) / (B.max - B.min) * 100) + '%'); money.textContent = pounds(range.value); }
    var single = x && !x.multi;
    next.hidden = single || cur === 'book';
    next.disabled = !ready(); next.textContent = cur === 'contact' ? 'Send and pick a time' : 'Continue';
    back.hidden = cur === 'biz' || cur === 'book'; bar.hidden = cur === 'book' || (back.hidden && next.hidden);
    bar.classList.toggle('solo', next.hidden);
    var n = FLOW.indexOf(cur) + 1;
    count.textContent = n + ' / ' + TOTAL; prog.style.width = (n / TOTAL * 100) + '%';
  }
  function show(name, push){
    if (!secs[name]) name = 'biz';
    cur = name;
    for (var k in secs) secs[k].hidden = k !== name;
    paint();
    if (push) history.pushState({ s: name }, '', name === 'biz' ? location.pathname + location.search : '#' + name);
    scrollTo(0, 0);
    var h = secs[name].querySelector('h1,h2'); if (h && push) h.focus({ preventScroll: true });
    if (name === 'book') openBook();
  }
  addEventListener('popstate', function(e){ show((e.state && e.state.s) || (location.hash || '').slice(1) || 'biz'); });
  function goBack(){ if (history.state && history.state.s) history.back(); else show(FLOW[Math.max(0, FLOW.indexOf(cur) - 1)], true); }
  back.addEventListener('click', goBack);
  function forward(){
    if (next.disabled) return;
    if (cur === 'contact') return send();
    if (cur === 'budget'){ a.budget = +range.value; save(); }
    show(FLOW[FLOW.indexOf(cur) + 1], true);
  }
  next.addEventListener('click', forward);

  form.addEventListener('input', function(e){
    var k = FIELDS[e.target.id]; if (!k) return;
    a[k] = e.target.value; save();
    if (!started){ started = true; track('enquiry_started', { channel: channel }); warm(); }
    next.disabled = !ready();
    if (cur === 'contact') $('err').hidden = true;
  });
  form.addEventListener('click', function(e){
    var o = e.target.closest('.sf-o[data-k]'); if (!o) return;
    var k = o.getAttribute('data-k'), v = o.getAttribute('data-v');
    if (o.hasAttribute('data-multi')){
      var l = list(k), at = l.indexOf(v);
      if (at > -1) l.splice(at, 1); else l.push(v);
      a[k] = l; save(); paint(); return;
    }
    a[k] = v; save(); paint();
    setTimeout(function(){ show(FLOW[FLOW.indexOf(cur) + 1], true); }, 160);
  });
  range.addEventListener('input', function(){ a.budget = +range.value; save(); paint(); });
  /* Enter moves on from a text field, the way people expect a form to work */
  form.addEventListener('submit', function(e){ e.preventDefault(); forward(); });
  form.addEventListener('keydown', function(e){ if (e.key === 'Enter' && e.target.tagName === 'INPUT'){ e.preventDefault(); forward(); } });

  /* ---------- the answers, written out once for the inbox, the booking and WhatsApp ---------- */
  function lines(){
    var need = list('need').map(function(v){ return label('need', v); });
    return [
      'Business: ' + val('biz') + (val('town') ? ', ' + val('town') : ''),
      'What it does: ' + val('what'),
      val('site') ? 'Website: ' + val('site') : 'Website: none yet',
      a.stage ? 'Stage: ' + label('stage', a.stage) : '',
      a.revenue ? 'Turnover: ' + label('revenue', a.revenue) : '',
      need.length ? 'Needs: ' + need.join(', ') : '',
      a.when ? 'Start: ' + label('when', a.when) : '',
      'Budget: about ' + pounds(a.budget || B.start),
      val('notes') ? 'Notes: ' + val('notes') : '',
      'Came from: ' + channel
    ].filter(Boolean);
  }
  function contactLines(){ return ['Name: ' + val('name'), 'Email: ' + val('mail'), 'Mobile: ' + val('tel')]; }

  /* ---------- Send: check, email Tom (if the inbox is on), then the calendar ---------- */
  function send(){
    var err = $('err');
    var bad = val('name').length < 2 ? 'Add your name.' : !okMail(val('mail')) ? 'Add an email address I can reply to.' : !okTel(val('tel')) ? 'Add a mobile or WhatsApp number.' : '';
    if (bad){ err.textContent = bad; err.hidden = false; return; }
    err.hidden = true;
    var sig = JSON.stringify(a);
    if (KEY && sent !== sig && !$('fBot').checked){
      var msg = contactLines().concat([''], lines()).join('\n');
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, keepalive: true,
        body: JSON.stringify({ access_key: KEY, subject: 'New enquiry: ' + val('biz') + ' (' + pounds(a.budget || B.start) + ')', from_name: 'Skales enquiry form', name: val('name'), email: val('mail'), replyto: val('mail'), phone: val('tel'), message: msg, botcheck: '' }) })
        .then(function(r){ return r.json(); }).then(function(j){ if (j && j.success){ sent = sig; store.set('eq-sent', sig); track('enquiry_emailed', { channel: channel }); } }).catch(function(){});
    }
    track('enquiry_sent', { channel: channel, budget: a.budget || B.start, stage: a.stage || '', revenue: a.revenue || '' });
    var first = val('name').split(/\s+/)[0];
    $('bookH').textContent = 'Thanks, ' + first + '. Pick a time for your call.';
    show('book', true);
  }

  /* ---------- the call: Calendly inline with their details and answers filled in ---------- */
  var calLoaded = false, calBooted = '';
  function warm(){
    if (!S.calendly || /cal\.com\//.test(S.calendly) || window.Calendly || calLoaded) return;
    calLoaded = true;
    var s = d.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true;
    s.onerror = function(){ calLoaded = 'failed'; }; d.head.appendChild(s);
  }
  function openBook(){
    var cal = $('cal'), none = $('calNone'), note = lines().join('\n');
    if (calBooted === note && cal.querySelector('iframe')) return;
    calBooted = note;
    function fallback(){ cal.innerHTML = ''; cal.hidden = true; none.hidden = false; }
    if (!S.calendly) return fallback();
    none.hidden = true; cal.hidden = false;
    var join = S.calendly.indexOf('?') > -1 ? '&' : '?';
    if (/cal\.com\//.test(S.calendly)){ cal.innerHTML = '<iframe title="Book a call" src="' + S.calendly + join + 'embed=true&theme=dark&name=' + enc(val('name')) + '&email=' + enc(val('mail')) + '&notes=' + enc(note) + '"></iframe>'; return; }
    var url = S.calendly + join + 'hide_gdpr_banner=1&hide_event_type_details=1&background_color=0a0b0d&text_color=f4f4f5&primary_color=ffe600&name=' + enc(val('name')) + '&email=' + enc(val('mail')) + '&a1=' + enc(note);
    var boot = function(){ if (!window.Calendly) return fallback(); cal.innerHTML = ''; window.Calendly.initInlineWidget({ url: url, parentElement: cal }); };
    if (window.Calendly) boot();
    else { warm(); var waited = 0, iv = setInterval(function(){ waited += 150; if (window.Calendly){ clearInterval(iv); boot(); } else if (calLoaded === 'failed' || waited > 8000){ clearInterval(iv); fallback(); } }, 150); }
  }
  addEventListener('message', function(e){
    var booked = (/calendly\.com$/.test(e.origin) && e.data && e.data.event === 'calendly.event_scheduled') || (/cal\.com$/.test(e.origin) && e.data && /booking(Successful|_successful)/i.test(JSON.stringify(e.data)));
    if (!booked) return;
    track('call_booked', { channel: channel, from: 'enquire' });
    var done = $('done'); done.textContent = 'Booked. The confirmation is on its way to your email. Speak soon.'; done.hidden = false;
    $('alt').hidden = true;
  });

  /* ---------- not ready to book: the same answers on WhatsApp (or email if there is no number) ---------- */
  $('waBtn').addEventListener('click', function(){
    var msg = 'Hi Tom, here is my enquiry.\n\n' + contactLines().concat([''], lines()).join('\n');
    var wa = String(S.whatsapp || '').replace(/\D/g, '');
    track('enquiry_whatsapp', { channel: channel });
    location.href = wa ? 'https://wa.me/' + wa + '?text=' + enc(msg) : 'mailto:' + S.email + '?subject=' + enc('Enquiry from ' + val('biz')) + '&body=' + enc(msg);
  });

  /* ---------- first paint ---------- */
  track('enquiry_view', { channel: channel });
  var start = (location.hash || '').slice(1);
  if (start && secs[start] && start !== 'book' && val('biz')){ history.replaceState({ s: start }, '', '#' + start); show(start); }
  else { if (location.hash) history.replaceState(null, '', location.pathname + location.search); show('biz'); }
})();
