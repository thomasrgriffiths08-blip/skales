/* The qualifying booking flow. Four questions, your details, then a slot.
   Calendly (which syncs Tom's Google Calendar) is embedded with the answers pre-filled.
   With no Calendly link configured, the answers hand off by WhatsApp or email instead. */
(function(){
  var d = document, S = window.SITE || {}, form = d.getElementById('book'); if (!form) return;
  var steps = Array.prototype.slice.call(form.querySelectorAll('.bstep')), bar = d.getElementById('steps'), cur = 0;
  var checked = function(name){ return Array.prototype.map.call(form.querySelectorAll('[name="' + name + '"]:checked'), function(i){ return i.value; }); };
  var val = function(id){ return (d.getElementById(id).value || '').trim(); };
  function show(i, move){
    cur = i; steps.forEach(function(s, k){ s.hidden = k !== i; });
    Array.prototype.forEach.call(bar.children, function(li, k){ li.classList.toggle('done', k < i); if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    if (!move) return;   /* first paint: leave the page where the visitor landed */
    var h = steps[i].querySelector('h2'); if (h){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    var top = form.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }
  function valid(i){
    var s = steps[i], err = s.querySelector('.err'), ok = true;
    if (i === 0) ok = checked('kind').length === 1;
    if (i === 1) ok = checked('problem').length > 0;
    if (i === 2) ok = checked('source').length > 0;
    if (i === 3) ok = checked('size').length === 1;
    if (i === 4){
      ok = true;
      ['bname', 'bbiz', 'bphone', 'bemail'].forEach(function(id){ var el = d.getElementById(id), v = el.value.trim(), bad = !v || (id === 'bemail' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)); el.setAttribute('aria-invalid', String(bad)); if (bad) ok = false; });
      if (form.company.value) ok = false;
    }
    if (err) err.hidden = ok;
    return ok;
  }
  function answers(){
    return { kind: checked('kind')[0] || '', problem: checked('problem').join(', '), source: checked('source').join(', '), size: checked('size')[0] || '',
             name: val('bname'), business: val('bbiz'), phone: val('bphone'), email: val('bemail'), town: val('btown') };
  }
  function finish(){
    var a = answers();
    d.getElementById('summary').innerHTML = [['Business', a.business + (a.town ? ' · ' + a.town : '')], ['Kind', a.kind], ['Problem', a.problem], ['Jobs come from', a.source], ['Team', a.size], ['You', a.name + ' · ' + a.phone + ' · ' + a.email]]
      .map(function(p){ return '<div><dt>' + p[0] + '</dt><dd>' + esc(p[1]) + '</dd></div>'; }).join('');
    d.getElementById('notfit').hidden = a.kind !== 'Not a service business';
    var text = 'Call request from the site\n' + ['Name: ' + a.name, 'Business: ' + a.business, 'Town: ' + a.town, 'Kind: ' + a.kind, 'Problem: ' + a.problem, 'Jobs come from: ' + a.source, 'Team: ' + a.size, 'Phone: ' + a.phone, 'Email: ' + a.email].join('\n');
    var cal = d.getElementById('calendly'), fb = d.getElementById('fallback');
    if (S.calendly){
      fb.hidden = true;
      var url = S.calendly + (S.calendly.indexOf('?') > -1 ? '&' : '?') + 'hide_gdpr_banner=1&name=' + enc(a.name) + '&email=' + enc(a.email)
              + '&a1=' + enc(a.business + (a.town ? ' · ' + a.town : '')) + '&a2=' + enc(a.kind + ' · ' + a.size) + '&a3=' + enc(a.problem) + '&a4=' + enc(a.source + ' · ' + a.phone);
      var boot = function(){ cal.innerHTML = ''; window.Calendly.initInlineWidget({ url: url, parentElement: cal }); };
      if (window.Calendly) boot(); else { var s = d.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true; s.onload = boot; d.head.appendChild(s); }
    } else {
      cal.innerHTML = ''; fb.hidden = false;
      var wa = S.whatsapp && String(S.whatsapp).replace(/\D/g, ''), waBtn = d.getElementById('fbWa'), mail = d.getElementById('fbMail');
      if (wa){ waBtn.hidden = false; waBtn.href = 'https://wa.me/' + wa + '?text=' + enc(text); }
      mail.href = 'mailto:' + S.email + '?subject=' + enc('Call request — ' + a.business) + '&body=' + enc(text);
    }
  }
  var enc = encodeURIComponent, esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  form.addEventListener('click', function(e){
    var n = e.target.closest('[data-next]'), p = e.target.closest('[data-back]');
    if (n){ if (!valid(cur)) return; if (cur === 4) finish(); show(cur + 1, true); }
    if (p) show(cur - 1, true);
  });
  form.addEventListener('keydown', function(e){ if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio'){ e.preventDefault(); var n = steps[cur].querySelector('[data-next]'); if (n) n.click(); } });
  form.addEventListener('submit', function(e){ e.preventDefault(); });
  show(0);
})();
