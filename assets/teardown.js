(function(){
  var d = document, S = window.SITE || {}, wa = S.whatsapp && String(S.whatsapp).replace(/\D/g, '');
  if (wa){ var alt = d.getElementById('waAlt'); alt.hidden = false; d.getElementById('waDirect').href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hi Tom — saw your page, fancy the free teardown.'); }
  var f = d.getElementById('f'), err = d.getElementById('fErr');
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var name = d.getElementById('name').value.trim(), phone = d.getElementById('phone').value.trim(), biz = d.getElementById('biz').value.trim();
    if (this.company.value) return;
    if (!name || !phone){
      err.textContent = !name ? 'Add your name so Tom knows who to reply to.' : 'Add a WhatsApp or mobile number so Tom can reply.';
      err.hidden = false;
      (!name ? d.getElementById('name') : d.getElementById('phone')).focus();
      return;
    }
    err.hidden = true;
    var msg = 'Free teardown request\nName: ' + name + '\nNumber: ' + phone + '\n' + (biz ? 'Business / problem: ' + biz : '');
    // nothing is sent from the page: it opens WhatsApp or email with the message written, and the person presses send
    var href = wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg)
                  : 'mailto:' + S.email + '?subject=' + encodeURIComponent('Free teardown — ' + name) + '&body=' + encodeURIComponent(msg);
    var app = wa ? 'WhatsApp' : 'your email';
    d.getElementById('doneTitle').textContent = 'Nearly there, ' + name.split(' ')[0] + '.';
    d.getElementById('doneBody').innerHTML = 'Opening ' + app + ' with your message written. Press send and it comes straight to Tom. '
      + 'If nothing opened, <a class="lnk" id="doneLink" href="' + href + '">tap here to send it</a>.';
    f.closest('.card').classList.add('is-done');
    if (window.skTrack) skTrack('teardown_sent');
    setTimeout(function(){ location.href = href; }, 900);
  });
})();
