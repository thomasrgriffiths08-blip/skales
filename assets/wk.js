/* /work/: the trade filter over the twelve websites. Buttons are the source of truth; hidden cards stay in
   the page for search. A tap on a card opens it in the viewer (site.js), full screen with its phone view. */
(function(){
  var bar = document.querySelector('.wk-filter'); if (!bar) return;
  var cards = [].slice.call(document.querySelectorAll('.wk-card'));
  bar.addEventListener('click', function(e){
    var btn = e.target.closest('button[data-f]'); if (!btn) return;
    var f = btn.getAttribute('data-f');
    [].forEach.call(bar.querySelectorAll('button'), function(b){ b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    cards.forEach(function(c){ c.hidden = f !== 'all' && c.getAttribute('data-f') !== f; });
  });
})();
