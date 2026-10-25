/* /start/ — the bio landing page. Three taps, then the call booked on the same page.
   Every screen is a history entry, so the phone's back button steps back a question; answers live in
   sessionStorage, so a refresh keeps them. The answers go into the booking as Calendly's first
   question (a1), with the channel they came from. The calendar script starts loading on the first
   tap, so it is ready by the time they reach it. Events go to whatever analytics the page has. */
(function(){
  var d = document, S = window.SITE || {}, QS = window.STARTQS || [];
  var $ = function(id){ return d.getElementById(id); };
  var check = $('check'), book = $('book'), form = $('qs'), head = $('intro'), top = $('top'), skip = $('skip');
  if (!check || !form) return;
  var qs = [].slice.call(form.querySelectorAll('.sq')), prog = [].slice.call(top.querySelectorAll('.st-prog span'));
  var enc = encodeURIComponent;
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var store = { get: function(k){ try { return JSON.parse(sessionStorage.getItem(k)); } catch (e){ return null; } }, set: function(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e){} } };
  function track(name, props){ if (window.skTrack) skTrack(name, props); }   // assets/site.js
  d.addEventListener('click', function(e){ var t = e.target.closest('[data-track]'); if (t) track(t.getAttribute('data-track'), { from: 'start' }); });

  /* where they came from (bio, story, an ad): kept for the booking so Tom sees the channel */
  var utm = store.get('st-utm') || {};
  location.search.replace(/[?&](utm_[a-z]+|ref)=([^&#]*)/g, function(_, k, v){ utm[k] = decodeURIComponent(v.replace(/\+/g, ' ')); });
  store.set('st-utm', utm);
  var channel = utm.utm_source ? [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ') : (utm.ref || 'direct');

  var a = store.get('st-b') || {}, cur = 0, started = false;
  var q = function(key){ for (var i = 0; i < QS.length; i++) if (QS[i].key === key) return QS[i]; return null; };
  var opt = function(key, v){ var x = q(key); if (x) for (var j = 0; j < x.opts.length; j++) if (x.opts[j].v === v) return x.opts[j]; return null; };
  var list = function(key){ return [].concat(a[key] || []); };

  /* ---------- screens ---------- */
  function screen(name, i, push){
    check.hidden = name !== 'q'; book.hidden = name !== 'book';
    if (name === 'q'){
      cur = i; qs.forEach(function(f, k){ f.hidden = k !== i; });
      head.hidden = i > 0; top.hidden = i === 0; skip.hidden = i > 0;
      prog.forEach(function(p, k){ p.classList.toggle('on', k <= i); });
      var x = QS[i], picked = list(x.key);
      [].forEach.call(qs[i].querySelectorAll('.sq-o'), function(o){ o.setAttribute('aria-pressed', String(picked.indexOf(o.getAttribute('data-v')) > -1)); });
      var nx = qs[i].querySelector('[data-next]'); if (nx) nx.disabled = !picked.length;
    }
    if (push) history.pushState({ s: name, i: i }, '', name === 'q' ? (i ? '#q' + (i + 1) : location.pathname + location.search) : '#book');
    scrollTo(0, 0);
    var h = name === 'q' ? (i ? qs[i] : check).querySelector('h1,h2') : book.querySelector('h2');
    if (h && push){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  addEventListener('popstate', function(e){
    var s = e.state;
    if (!s){ var m = location.hash.match(/^#q(\d)$/); return screen('q', m && QS[m[1] - 1] ? m[1] - 1 : 0); }
    if (s.s === 'book') return openBook(false);
    screen('q', s.i || 0);
  });
  top.querySelector('[data-back]').addEventListener('click', function(){ history.back(); });
  book.querySelector('[data-close]').addEventListener('click', function(){ if (history.state && history.state.s === 'book') history.back(); else screen('q', 0, true); });
  d.querySelectorAll('[data-book]').forEach(function(btn){ btn.addEventListener('click', function(){ a = {}; store.set('st-b', a); openBook(true); }); });

  form.addEventListener('click', function(e){
    var nx = e.target.closest('[data-next]');
    if (nx){ if (!nx.disabled) screen('q', cur + 1, true); return; }
    var o = e.target.closest('.sq-o'); if (!o) return;
    var k = o.getAttribute('data-k'), v = o.getAttribute('data-v');
    if (!started){ started = true; track('check_started', { channel: channel }); warm(); }
    if (o.hasAttribute('data-multi')){
      var l = list(k), at = l.indexOf(v);
      if (v === 'unsure') l = at > -1 ? [] : ['unsure'];
      else { l = l.filter(function(x){ return x !== 'unsure'; }); if (at > -1) l.splice(l.indexOf(v), 1); else l.push(v); }
      a[k] = l; store.set('st-b', a); screen('q', cur);
      return;
    }
    a[k] = v; store.set('st-b', a);
    [].forEach.call(o.parentNode.children, function(x){ x.setAttribute('aria-pressed', String(x === o)); });
    setTimeout(function(){
      if (cur < QS.length - 1) screen('q', cur + 1, true);
      else { track('check_completed', { kind: a.kind, need: list('need').join(','), when: a.when, channel: channel }); openBook(true); }
    }, 140);
  });

  /* ---------- the answers, for the booking and for Tom ---------- */
  function summary(){
    var k = opt('kind', a.kind), n = list('need').map(function(v){ return (opt('need', v) || {}).t; }).filter(Boolean), w = opt('when', a.when);
    if (!k && !n.length && !w) return 'Booked straight from skales.studio/start · came from: ' + channel;
    return [k ? k.t : '', n.length ? 'Wants: ' + n.join(', ') : '', w ? 'When: ' + w.t : '', 'Came from: ' + channel].filter(Boolean).join(' · ');
  }
  function answers(){
    var k = opt('kind', a.kind), n = list('need'), w = opt('when', a.when), box = $('ans');
    if (!k){ box.hidden = true; return; }
    var chips = [k.t].concat(n.map(function(v){ return (opt('need', v) || {}).t; })).concat(w ? [w.t] : []);
    box.innerHTML = chips.map(function(t){ return '<span>' + esc(t) + '</span>'; }).join('') + '<button type="button" class="st-edit" data-edit>Change</button>';
    box.hidden = false;
    box.querySelector('[data-edit]').onclick = function(){ screen('q', 0, true); };
  }

  /* ---------- the call: Calendly or Cal.com inline, else a message ---------- */
  var calLoaded = false, calBooted = '';
  function warm(){
    if (!S.calendly || /cal\.com\//.test(S.calendly) || window.Calendly || calLoaded) return;
    calLoaded = true;
    var s = d.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true;
    s.onerror = function(){ calLoaded = 'failed'; }; d.head.appendChild(s);
  }
  function openBook(push){
    track('call_clicked', { channel: channel, from: a.kind ? 'questions' : 'skip' });
    screen('book', 0, push);
    answers();
    var k = opt('kind', a.kind), sys = $('lookSys');
    if (sys){ sys.href = (S.base || '/') + 'work/system/' + (k && k.sys ? '?t=' + k.sys : ''); sys.firstChild.textContent = k ? 'The system, set up for ' + k.t.toLowerCase() : 'The system that runs the business'; }
    var cal = $('cal'), none = $('calNone'), note = summary();
    if (calBooted === note && cal.querySelector('iframe')) return;
    calBooted = note;
    if (!S.calendly) return fallback();
    none.hidden = true; cal.hidden = false;
    if (/cal\.com\//.test(S.calendly)){
      cal.innerHTML = '<iframe title="Book a call" src="' + S.calendly + (S.calendly.indexOf('?') > -1 ? '&' : '?') + 'embed=true&theme=light&notes=' + enc(note) + '"></iframe>';
      return;
    }
    var url = S.calendly + (S.calendly.indexOf('?') > -1 ? '&' : '?') + 'hide_gdpr_banner=1&hide_event_type_details=1&a1=' + enc(note);
    var boot = function(){ if (!window.Calendly) return fallback(); cal.innerHTML = ''; window.Calendly.initInlineWidget({ url: url, parentElement: cal }); };
    if (window.Calendly) boot();
    else {
      warm();
      var waited = 0, iv = setInterval(function(){ waited += 150; if (window.Calendly){ clearInterval(iv); boot(); } else if (calLoaded === 'failed' || waited > 8000){ clearInterval(iv); fallback(); } }, 150);
    }
    function fallback(){
      cal.innerHTML = ''; cal.hidden = true; none.hidden = false;
      var wa = S.whatsapp && String(S.whatsapp).replace(/\D/g, ''), bw = $('bkWa');
      if (bw && wa) bw.href = 'https://wa.me/' + wa + '?text=' + enc('Hi Tom, I’d like a call.\n\n' + note);
      $('bkMail').href = 'mailto:' + S.email + '?subject=' + enc('Call request from skales.studio') + '&body=' + enc('Hi Tom, I’d like a call.\n\n' + note);
    }
  }
  addEventListener('message', function(e){
    var booked = (/calendly\.com$/.test(e.origin) && e.data && e.data.event === 'calendly.event_scheduled') || (/cal\.com$/.test(e.origin) && e.data && /booking(Successful|_successful)/i.test(JSON.stringify(e.data)));
    if (!booked) return;
    track('call_booked', { channel: channel, kind: a.kind || '', tool: /cal\.com$/.test(e.origin) ? 'cal.com' : 'calendly' });
    var done = $('done'); done.textContent = 'Booked. The confirmation is on its way to your email. Speak soon.'; done.hidden = false;
  });

  /* ---------- first paint ---------- */
  track('start_view', { channel: channel });
  var qm = location.hash.match(/^#q(\d)$/);
  if (location.hash === '#book'){ history.replaceState({ s: 'book' }, '', '#book'); openBook(false); }
  else if (qm && QS[qm[1] - 1] && a.kind){ history.replaceState(null, '', location.pathname + location.search); history.pushState({ s: 'q', i: qm[1] - 1 }, '', '#q' + qm[1]); screen('q', qm[1] - 1); }
  else { if (location.hash) history.replaceState(null, '', location.pathname + location.search); screen('q', 0); }
})();
