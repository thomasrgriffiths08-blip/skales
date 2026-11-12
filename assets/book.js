/* Booking: the calendar is the page. No questions first; Calendly asks for a name and an email itself.
   A draft from the builder, and where the visitor came from, ride along in the note for the call.
   If Calendly cannot load (a privacy extension, a dead connection) the page offers WhatsApp and email instead. */
(function(){
  var d = document, S = window.SITE || {}, box = d.getElementById('book'); if (!box) return;
  var enc = encodeURIComponent, cal = d.getElementById('calendly'), fb = d.getElementById('fallback');
  var q = new URLSearchParams(location.search), note = [];
  /* a draft from the builder: its reference, trade, name and town */
  (function(){
    var map = {}; try { map = JSON.parse(box.getAttribute('data-trades') || '{}'); } catch(e){}
    var o = { ref: q.get('d') || '', t: q.get('t') || '', n: q.get('n') || '', w: q.get('w') || '' };
    if (!o.t){ try { var s = JSON.parse(localStorage.getItem('sk_draft') || 'null'); if (s && s.t && Date.now() - (s.at || 0) < 30 * 864e5) o = { ref: s.ref, t: s.t, n: s.n, w: s.w }; } catch(e){} }
    if (!map[o.t] || !o.n || !o.w || !/^SK-[A-Z0-9]{4}$/.test(o.ref)) return;
    note.push('Draft site: ' + o.ref + ' (' + o.n.slice(0, 34) + ', ' + map[o.t][0] + ', ' + o.w.slice(0, 22) + ')');
  })();
  var src = q.get('utm_source'); try { src = src || sessionStorage.getItem('sk_src') || ''; } catch(e){}
  if (src) note.push('Came from: ' + String(src).slice(0, 40));
  var done = false;
  function fallback(){ if (done) return; done = true; cal.innerHTML = ''; cal.hidden = true; fb.hidden = false;
    var wa = S.whatsapp && String(S.whatsapp).replace(/\D/g, ''), waBtn = d.getElementById('fbWa');
    if (wa && waBtn) waBtn.href = 'https://wa.me/' + wa + '?text=' + enc('Hi Tom, I would like to book a call.' + (note.length ? '\n' + note.join('\n') : '')); }
  if (!S.calendly) return fallback();
  var join = S.calendly.indexOf('?') > -1 ? '&' : '?';
  if (/cal\.com\//.test(S.calendly)){
    cal.innerHTML = '<iframe title="Book a call" src="' + S.calendly + join + 'embed=true&theme=dark' + (note.length ? '&notes=' + enc(note.join('\n')) : '') + '"></iframe>'; done = true;
  } else {
    var url = S.calendly + join + 'hide_gdpr_banner=1&hide_event_type_details=1&background_color=121317&text_color=f4f4f5&primary_color=ffe600' + (note.length ? '&a1=' + enc(note.join('\n')) : '');
    var tag = d.createElement('script'); tag.src = 'https://assets.calendly.com/assets/external/widget.js'; tag.async = true;
    tag.onload = function(){ if (!window.Calendly) return fallback(); cal.innerHTML = ''; window.Calendly.initInlineWidget({ url: url, parentElement: cal }); done = true; };
    tag.onerror = fallback;
    d.head.appendChild(tag);
    setTimeout(function(){ if (!cal.querySelector('iframe')) fallback(); }, 7000);
  }
  /* the booking itself happens inside the calendar's frame; it tells the page when a time is taken */
  addEventListener('message', function(e){
    if (!window.skTrack) return;
    if (/calendly\.com$/.test(e.origin) && e.data && e.data.event === 'calendly.event_scheduled') skTrack('call_booked', { from: 'book', tool: 'calendly' });
    if (/cal\.com$/.test(e.origin) && e.data && /booking(Successful|_successful)/i.test(JSON.stringify(e.data))) skTrack('call_booked', { from: 'book', tool: 'cal.com' });
  });
})();
