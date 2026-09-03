(function(){
  var d = document, S = window.SITE || {}, wa = S.whatsapp && String(S.whatsapp).replace(/\D/g, '');
  if (wa){ var alt = d.getElementById('waAlt'); alt.hidden = false; d.getElementById('waDirect').href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hi Tom — saw your page, fancy the free teardown.'); }
  d.getElementById('f').addEventListener('submit', function(e){
    e.preventDefault();
    var name = d.getElementById('name').value.trim(), phone = d.getElementById('phone').value.trim(), biz = d.getElementById('biz').value.trim();
    if (this.company.value) return;
    if (!name || !phone){ (!name ? d.getElementById('name') : d.getElementById('phone')).focus(); return; }
    var msg = 'Free teardown request\nName: ' + name + '\nNumber: ' + phone + '\n' + (biz ? 'Business / problem: ' + biz : '');
    this.style.display = 'none';
    var t = new Date(), hh = String(t.getHours()).padStart(2, '0'), mm = String(t.getMinutes()).padStart(2, '0');
    d.getElementById('doneTitle').textContent = 'Got it, ' + name.split(' ')[0] + '.';
    d.getElementById('doneBody').innerHTML = 'Sent at <strong style="color:var(--dyeline)">' + hh + ':' + mm + '</strong>. You’ll hear back personally, fast.';
    d.getElementById('done').classList.add('show');
    setTimeout(function(){
      location.href = wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg)
                         : 'mailto:' + S.email + '?subject=' + encodeURIComponent('Free teardown — ' + name) + '&body=' + encodeURIComponent(msg);
    }, 900);
  });
})();
