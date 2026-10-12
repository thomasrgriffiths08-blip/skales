/* /start/ — the bio landing page. Intro film, six tap-only questions, the case file, the call.
   Every screen is a history entry, so the phone's back button steps back a question; answers live in
   sessionStorage, so a refresh keeps them; the finished file lives in the URL hash, so the link
   reopens it. Every pound printed comes from the owner's own taps with the working shown: the only
   assumption is "one in three missed callers would have become a job", printed beside the figure.
   No prices. Events go to whatever analytics the page has (dataLayer, Meta, GA, Plausible). */
(function(){
  var d = document, S = window.SITE || {}, QS = window.STARTQS || [], KINDS = window.STARTKINDS || [], BUILDS = window.BUILDS || [];
  var $ = function(id){ return d.getElementById(id); };
  var intro = $('intro'), check = $('check'), file = $('file'), book = $('book'), form = $('qs');
  if (!intro || !form) return;
  var qs = [].slice.call(form.querySelectorAll('.sq')), prog = [].slice.call(check.querySelectorAll('.st-prog span'));
  var enc = encodeURIComponent, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var store = { get: function(k){ try { return JSON.parse(sessionStorage.getItem(k)); } catch (e){ return null; } }, set: function(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e){} } };

  /* ---------- tracking: one call, every tool the page happens to load ---------- */
  function track(name, props){ if (window.skTrack) skTrack(name, props); }   // assets/site.js
  d.addEventListener('click', function(e){ var t = e.target.closest('[data-track]'); if (t) track(t.getAttribute('data-track'), { from: 'start' }); });

  /* where they came from (bio, story, an ad): kept for the hand-off so Tom sees the channel */
  var utm = store.get('st-utm') || {};
  location.search.replace(/[?&](utm_[a-z]+|ref)=([^&#]*)/g, function(_, k, v){ utm[k] = decodeURIComponent(v.replace(/\+/g, ' ')); });
  store.set('st-utm', utm);
  var channel = utm.utm_source ? [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ') : (utm.ref || 'direct');

  /* ---------- the film: plays muted inline; Reduce Motion gets the poster and a play button ---------- */
  var v = $('loop'), play = $('play');
  if (v){
    if (reduce){ play.hidden = false; play.onclick = function(){ v.play(); play.hidden = true; }; }
    else { var go = function(){ var p = v.play(); if (p && p.catch) p.catch(function(){ play.hidden = false; play.onclick = function(){ v.play(); play.hidden = true; }; }); }; if (d.readyState === 'complete') go(); else addEventListener('load', go); }
  }

  /* ---------- screens ---------- */
  var a = store.get('st-a') || {}, cur = 0;
  function screen(name, i, push){
    intro.hidden = name !== 'intro'; check.hidden = name !== 'q'; file.hidden = name !== 'file'; book.hidden = name !== 'book';
    d.body.classList.toggle('st-dark', name === 'intro' || name === 'q');
    if (name === 'q'){
      cur = i; qs.forEach(function(f, k){ f.hidden = k !== i; });
      prog.forEach(function(p, k){ p.classList.toggle('on', k <= i); });
      var picked = a[QS[i].key];
      [].forEach.call(qs[i].querySelectorAll('.sq-o'), function(o){ o.setAttribute('aria-pressed', String(o.getAttribute('data-v') === picked)); });
    }
    if (v){ if (name === 'intro' && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function(){}); } else v.pause(); }
    if (push) history.pushState({ s: name, i: i }, '', name === 'q' ? '#q' + (i + 1) : name === 'book' ? '#book' : name === 'file' ? '#f=' + pack(a) : location.pathname + location.search);
    scrollTo(0, 0);
    var h = (name === 'q' ? qs[i] : name === 'file' ? file : name === 'book' ? book : intro).querySelector('h1,h2');
    if (h && push){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  addEventListener('popstate', function(e){
    var s = e.state;
    if (!s){ var m = location.hash.match(/^#q(\d)$/); if (m && QS[m[1] - 1]) return screen('q', m[1] - 1); return screen('intro'); }
    if (s.s === 'file') return render(false);
    screen(s.s, s.i || 0);
  });

  d.querySelector('[data-go]').addEventListener('click', function(){ track('check_started', { channel: channel }); screen('q', 0, true); });
  d.querySelectorAll('[data-book]').forEach(function(btn){ btn.addEventListener('click', function(){ openBook(); }); });
  check.querySelector('[data-back]').addEventListener('click', function(){ history.back(); });
  book.querySelector('[data-close]').addEventListener('click', function(){ history.back(); });

  form.addEventListener('click', function(e){
    var o = e.target.closest('.sq-o'); if (!o) return;
    a[o.getAttribute('data-k')] = o.getAttribute('data-v'); store.set('st-a', a);
    [].forEach.call(o.parentNode.children, function(x){ x.setAttribute('aria-pressed', String(x === o)); });
    setTimeout(function(){
      if (cur < QS.length - 1) screen('q', cur + 1, true);
      else { track('check_completed', { kind: a.kind, missed: a.missed, site: a.site, when: a.when, channel: channel }); render(true); }
    }, reduce ? 0 : 160);
  });

  /* ---------- the maths ---------- */
  var opt = function(key, val){ for (var i = 0; i < QS.length; i++) if (QS[i].key === key) for (var j = 0; j < QS[i].opts.length; j++) if (QS[i].opts[j].v === val) return QS[i].opts[j]; return null; };
  var kindOf = function(k){ for (var i = 0; i < KINDS.length; i++) if (KINDS[i].key === k) return KINDS[i]; return KINDS[KINDS.length - 1]; };
  var B = function(n){ for (var i = 0; i < BUILDS.length; i++) if (BUILDS[i].n === n) return BUILDS[i]; return null; };
  var round = function(v){ return v >= 10000 ? Math.round(v / 500) * 500 : v >= 1000 ? Math.round(v / 100) * 100 : Math.round(v / 10) * 10; };
  var money = function(v){ return '£' + round(v).toLocaleString('en-GB'); };
  var WEEKS = 4.33;

  function analyse(){
    var k = kindOf(a.kind), mo = opt('missed', a.missed), jo = opt('job', a.job), so = opt('site', a.site);
    var missed = mo ? mo.rep : 0, job = jo ? jo.rep : 0, month = missed * WEEKS / 3 * job;
    var builds = [];
    var siteBuild = { key: 'site', name: 'A website built to book', what: a.site === 'none' ? 'Every recommendation you get checks Google before they ring. A fast site with a one-tap call and online booking gives them something to find, and a reason to pick you.' : 'Hand-built, fast on a phone, a one-tap call and a booking page, and every page written to answer what your customers type into Google. Yours from day one.', demo: k.demo };
    var textBack = { key: 'missed', name: 'Missed-call text-back', what: 'Every call you can’t take gets a text from your number within a minute, with a link to book. The job lands in your diary while you’re still under the boiler.', demo: 25 };
    if (missed >= 6) builds.push(textBack);
    if (a.site !== 'good') builds.push(siteBuild);
    if (missed > 0 && missed < 6) builds.push(textBack);
    if (k.bookable) builds.push({ key: 'booking', name: 'Online booking with a deposit', what: 'Customers pick a real slot at 10pm and pay a deposit that holds it. No phone tag, fewer no-shows.', demo: { salon: 33, hospitality: 34 }[a.kind] || 14 });
    if (a.source === 'social') builds.push({ key: 'meta', name: 'Meta ads that land on your booking page', what: 'Your customers already scroll Facebook and Instagram. Ads that send them straight to a page built to book, with every lead followed up for you.', demo: null });
    if (a.source === 'google' && a.site === 'good') builds.push({ key: 'google', name: 'Google ads and local pages', what: 'Show up for the searches people make when they need you today, on pages written for your trade and your area.', demo: null });
    if (a.source === 'word' || a.source === 'directory') builds.push({ key: 'reviews', name: 'Review requests that run themselves', what: a.source === 'directory' ? 'Every finished job asks for a Google review the same day, so the work comes to you directly instead of through a directory that sells your lead to three others.' : 'Every finished job asks for a Google review the same day, so the people your customers recommend you to find proof when they check.', demo: 26 });
    if (!builds.length) builds.push({ key: 'reviews', name: 'Review requests and rebooks', what: 'You’re ahead of most. The next gains are reviews asked for automatically and customers reminded before they think to search.', demo: 26 });
    var verdict = a.when === 'looking' ? 'later' : 'fit';
    return { k: k, missed: missed, job: job, month: month, mo: mo, jo: jo, so: so, builds: builds.slice(0, 3), verdict: verdict };
  }

  /* ---------- the case file ---------- */
  function proof(n){
    var x = B(n); if (!x) return '';
    return '<a class="sf-proof" href="' + S.base + 'work/' + x.slug + '/"><span class="ph"><img src="' + S.base + 'assets/phones/' + (x.n < 10 ? '0' : '') + x.n + '.webp" width="585" height="1266" alt="' + esc(x.name) + ' on a phone" loading="lazy" decoding="async"></span><span class="cap"><b>' + esc(x.name) + '</b><span>Try it: a working demo for a fictional business</span></span></a>';
  }
  function summary(r){
    return 'Case file from skales.studio/start\n' + r.k.label + ' · work mostly from ' + (opt('source', a.source) || {}).t + '\nMissed calls: ' + (r.mo || {}).t + ' a week · typical job ' + (r.jo || {}).t + '\nWebsite: ' + (r.so || {}).t + ' · wants it sorted: ' + (opt('when', a.when) || {}).t
      + (r.month ? '\nAt stake (cautious): about ' + money(r.month) + ' a month' : '') + '\nCame from: ' + channel + '\n\nThe file: ' + location.href.split('#')[0] + '#f=' + pack(a);
  }
  function render(push){
    var r = analyse(), today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var head = r.month > 0
      ? '<h2 tabindex="-1">Missed calls could be costing you about <em data-to="' + round(r.month) + '">' + money(r.month) + '</em> a month.</h2>'
        + '<p class="sf-work"><span>The working</span>' + r.missed + ' missed calls a week (you said ' + esc(r.mo.t.toLowerCase()) + ') × 4.3 weeks × 1 in 3 becoming a job × ' + money(r.job) + ' a job (you said ' + esc(r.jo.t.replace(/^U/, 'u').replace(/^O/, 'o')) + ') = <b>' + money(r.month) + ' a month</b>. The one in three is a cautious assumption, not a promise.</p>'
      : a.site !== 'good'
        ? '<h2 tabindex="-1">Your phone is fine. ' + (a.site === 'none' ? 'Not having a website' : 'Your website') + ' is the leak.</h2><p class="sf-lead">You rarely miss calls, which most owners can’t say. The work you never hear about is the bigger cost: people who check you on Google ' + (a.site === 'none' ? 'and find nothing' : 'and find a site that doesn’t make it easy to book') + ', then ring someone else.</p>'
        : '<h2 tabindex="-1">You’re ahead of most owners.</h2><p class="sf-lead">You rarely miss calls and you’re proud of your website. The next gains are the ones that compound: reviews asked for automatically, customers reminded before they search, and ads that land on pages built to book.</p>';
    var fit = r.verdict === 'fit';
    var html = '<div class="sf-in">'
      + '<p class="sf-id"><span>Your case file</span><span>' + esc(r.k.label) + '</span><span>' + today + '</span></p>'
      + head
      + '<section class="sf-sec"><h3>What I’d build first</h3><ol class="sf-builds">' + r.builds.map(function(x){ return '<li><b>' + esc(x.name) + '</b><p>' + esc(x.what) + '</p></li>'; }).join('') + '</ol></section>'
      + (r.k.demo ? '<section class="sf-sec sf-demo"><h3>See it working for a ' + esc(r.k.label.toLowerCase()) + ' business</h3>' + proof(r.k.demo) + (r.builds[0] && r.builds[0].key === 'missed' && r.k.demo !== 25 ? proof(25) : '') + '</section>' : '')
      + '<section class="sf-sec sf-end"><h3>' + (fit ? 'Worth a 20-minute call.' : 'Keep this file.') + '</h3>'
      + '<p class="sf-lead">' + (fit ? 'Twenty minutes on this file with me, Tom: what to build first, what it is worth, and a flat quote with a date on it. Your answers come with you, so we skip the small talk.' : 'You said you’re just looking, which is the right time to read this and the wrong time for a call. Save it; the link opens this same file whenever you’re ready.') + '</p>'
      + '<div class="sf-acts">'
      + (fit ? '<button class="btn btn-live" type="button" data-bk>Book the call</button><button class="btn btn-ghost" type="button" data-save>Send me my case file</button>' : '<button class="btn btn-live" type="button" data-save>Send me my case file</button><button class="btn btn-ghost" type="button" data-bk>Book a call anyway</button>')
      + '</div>'
      + '<div class="sf-send" id="send" hidden></div>'
      + '<p class="sf-more">Want the full version, worked out from your own numbers? <a class="lnk" href="' + S.base + 'your-case/">The four-minute case study</a>. <button class="sf-redo" type="button" data-redo>Change an answer</button></p>'
      + '</section></div>';
    file.innerHTML = html;
    screen('file', 0, push);
    if (!push) history.replaceState({ s: 'file' }, '', '#f=' + pack(a));
    var em = file.querySelector('em[data-to]');
    if (em && !reduce){ var to = +em.getAttribute('data-to'), t0 = null; var tick = function(t){ if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3); em.textContent = '£' + Math.round(to * e).toLocaleString('en-GB'); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
    file.onclick = function(e){
      if (e.target.closest('[data-bk]')) openBook(r);
      if (e.target.closest('[data-save]')) save(r);
      if (e.target.closest('[data-redo]')) screen('q', 0, true);
    };
  }

  /* "Send me my case file": a text with the link when the lead endpoint is live; until then the
     phone's own share sheet (send it to yourself, save it), or copy the link. Never a fake form. */
  function save(r){
    var link = location.href.split('#')[0] + '#f=' + pack(a), box = $('send');
    if (S.leadEndpoint){
      box.hidden = false;
      box.innerHTML = '<label for="sfPhone">Your mobile</label><div class="sf-row"><input id="sfPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07…"><button class="btn btn-live" type="button" id="sfGo">Text it to me</button></div><p class="sf-fine">You get this file now and one follow-up in two days. Nothing else, and never passed on.</p><p class="sf-ok" id="sfOk" hidden></p>';
      $('sfGo').onclick = function(){
        var ph = ($('sfPhone').value || '').replace(/[^\d+]/g, ''); if (ph.length < 10){ $('sfPhone').setAttribute('aria-invalid', 'true'); return; }
        $('sfGo').disabled = true;
        fetch(S.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: ph, answers: a, link: link, channel: channel, utm: utm, at: new Date().toISOString() }) })
          .then(function(res){ if (!res.ok) throw 0; $('sfOk').textContent = 'Sent. Check your messages.'; $('sfOk').hidden = false; track('casefile_sent', { channel: channel }); })
          .catch(function(){ $('sfOk').textContent = 'That didn’t send. Copy the link instead: ' + link; $('sfOk').hidden = false; $('sfGo').disabled = false; });
      };
      $('sfPhone').focus();
      return;
    }
    track('casefile_saved', { channel: channel });
    if (navigator.share){ navigator.share({ title: 'My case file', text: 'My case file from Skales Studio', url: link }).catch(function(){}); return; }
    var done = function(){ box.hidden = false; box.innerHTML = '<p class="sf-ok">Link copied. It opens this same file.</p>'; };
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, function(){ prompt('Copy this link', link); }); else prompt('Copy this link', link);
  }

  /* ---------- the call: Calendly or Cal.com inline when the link is set, else a message ---------- */
  function openBook(r){
    track('call_clicked', { channel: channel, from: r ? 'file' : 'intro' });
    screen('book', 0, true);
    var cal = $('cal'), none = $('calNone'), note = r ? summary(r) : 'Booked straight from skales.studio/start · came from: ' + channel;
    if (S.calendly){
      none.hidden = true;
      if (/cal\.com\//.test(S.calendly)){
        cal.innerHTML = '<iframe title="Book a call" src="' + S.calendly + (S.calendly.indexOf('?') > -1 ? '&' : '?') + 'embed=true&theme=light&notes=' + enc(note) + '" loading="lazy"></iframe>';
      } else {
        var url = S.calendly + (S.calendly.indexOf('?') > -1 ? '&' : '?') + 'hide_gdpr_banner=1&a1=' + enc(note);
        var boot = function(){ cal.innerHTML = ''; window.Calendly.initInlineWidget({ url: url, parentElement: cal }); };
        if (window.Calendly) boot(); else { var s = d.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true; s.onload = boot; d.head.appendChild(s); }
      }
    } else {
      cal.innerHTML = ''; none.hidden = false;
      var wa = S.whatsapp && String(S.whatsapp).replace(/\D/g, ''), bw = $('bkWa');
      if (bw && wa) bw.href = 'https://wa.me/' + wa + '?text=' + enc('Hi Tom, I’d like a call.\n\n' + note);
      $('bkMail').href = 'mailto:' + S.email + '?subject=' + enc('Call request from skales.studio') + '&body=' + enc('Hi Tom, I’d like a call.\n\n' + note);
    }
  }
  addEventListener('message', function(e){
    if (/calendly\.com$/.test(e.origin) && e.data && e.data.event === 'calendly.event_scheduled') track('call_booked', { channel: channel, tool: 'calendly' });
    if (/cal\.com$/.test(e.origin) && e.data && /booking(Successful|_successful)/i.test(JSON.stringify(e.data))) track('call_booked', { channel: channel, tool: 'cal.com' });
  });

  /* ---------- the link ---------- */
  function pack(o){ return btoa(unescape(enc(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unpack(s){ try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e){ return null; } }
  var valid = function(o){ return o && QS.every(function(q){ return opt(q.key, o[q.key]); }); };

  /* ---------- first paint ---------- */
  track('start_view', { channel: channel });
  var m = location.hash.match(/^#f=([\w-]+)/), saved = m && unpack(m[1]), qm = location.hash.match(/^#q(\d)$/);
  if (valid(saved)){ a = saved; store.set('st-a', a); render(false); }
  else if (location.hash === '#book') openBook();
  else if (qm && QS[qm[1] - 1]){ history.replaceState(null, '', location.pathname + location.search); screen('intro'); history.pushState({ s: 'q', i: qm[1] - 1 }, '', location.hash || '#q' + qm[1]); screen('q', qm[1] - 1); }
  else screen('intro');
})();
