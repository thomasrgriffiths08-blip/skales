/* /seo/: the four layers of one page as tabs (arrow keys move between them), and a button that prints this
   page's own schema, read straight out of its ld+json script. */
(function(){
  var rig = document.querySelector('[data-sx]');
  if (rig){
    var tabs = [].slice.call(rig.querySelectorAll('[role="tab"]'));
    var pick = function(t, focus){
      tabs.forEach(function(x){
        var on = x === t, p = document.getElementById(x.getAttribute('aria-controls'));
        x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        if (p) p.hidden = !on;
      });
      if (focus) t.focus();
      if (t.scrollIntoView && window.innerWidth < 760) t.scrollIntoView({ block: 'nearest', inline: 'center' });
    };
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ pick(t); });
      t.addEventListener('keydown', function(e){
        var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!n) return; e.preventDefault(); pick(tabs[(i + n + tabs.length) % tabs.length], true);
      });
    });
  }
  var btn = document.querySelector('[data-sx-own]'), pre = document.getElementById('sx-own');
  if (btn && pre){
    btn.addEventListener('click', function(){
      if (!pre.textContent.trim()){
        var out = [].map.call(document.querySelectorAll('script[type="application/ld+json"]'), function(s){
          try { return JSON.stringify(JSON.parse(s.textContent), null, 2); } catch (e){ return s.textContent.trim(); }
        }).join('\n\n');
        pre.querySelector('code').textContent = out || 'No schema found on this page.';
      }
      var open = pre.hidden; pre.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Hide this page’s schema' : 'Show this page’s schema';
    });
  }
})();
