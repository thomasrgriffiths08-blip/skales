/* ============================================================
   THE WORKINGS — the site draws its own construction over itself.
   Flip the switch in the header and every page shows the drawing it
   was built from: the twelve columns of the shell, the 8px baseline,
   a dimension line on every heading with its true height, and a spec
   label on each element that carries the page (face · weight · size /
   leading). Values are measured live, not typed in. On the home page
   it draws once over the hero on load, then lifts — content, so it
   runs with Reduce Motion on (shorter). transform/opacity/stroke only.
   ============================================================ */
(function(){
  var d = document, root = d.documentElement, KEY = 'skales.workings', NS = 'http://www.w3.org/2000/svg';
  var layer = null, timer = null, echoing = false;
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el = function(n, a){ var e = d.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; };
  var mono = function(){ return (getComputedStyle(root).getPropertyValue('--mono') || 'ui-monospace').trim(); };
  var textW = function(s){ return s.length * 6.3 + 12; };

  function spec(node){
    var cs = getComputedStyle(node), tag = node.tagName.toLowerCase();
    var fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    var fs = Math.round(parseFloat(cs.fontSize)), lh = parseFloat(cs.lineHeight);
    var lead = isNaN(lh) ? '' : '/' + Math.round(lh);
    var r = node.getBoundingClientRect();
    if (/^(h[1-6]|p|a|button|li|dd|dt|span|b)$/.test(tag) && node.textContent.trim().length)
      return tag.toUpperCase() + ' · ' + fam + ' ' + cs.fontWeight + ' · ' + fs + lead;
    var cls = typeof node.className === 'string' && node.className ? '.' + node.className.split(' ')[0] : '';
    return tag.toUpperCase() + cls + ' · ' + Math.round(r.width) + ' × ' + Math.round(r.height);
  }
  function label(x, y, txt, cls){
    var w = textW(txt), g = el('g', { class: 'wk-lab' + (cls ? ' ' + cls : '') });
    g.appendChild(el('rect', { x: x, y: y, width: w, height: 16, rx: 1 }));
    var t = el('text', { x: x + 6, y: y + 11.5 }); t.textContent = txt; g.appendChild(t);
    return g;
  }
  function line(x1, y1, x2, y2, cls){
    var L = el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'wk-draw' + (cls ? ' ' + cls : '') });
    var len = Math.hypot(x2 - x1, y2 - y1); L.style.setProperty('--len', len); return L;
  }
  /* a dimension line: hairline, witness ticks, the value in the middle */
  function hdim(x0, x1, y, txt){
    var g = el('g', { class: 'wk-dim' });
    g.appendChild(line(x0, y, x1, y)); g.appendChild(line(x0, y - 5, x0, y + 5)); g.appendChild(line(x1, y - 5, x1, y + 5));
    g.appendChild(label((x0 + x1) / 2 - textW(txt) / 2, y - 8, txt, 'wk-val')); return g;
  }
  function vdim(x, y0, y1, txt){
    var g = el('g', { class: 'wk-dim' });
    g.appendChild(line(x, y0, x, y1)); g.appendChild(line(x - 5, y0, x + 5, y0)); g.appendChild(line(x - 5, y1, x + 5, y1));
    g.appendChild(label(x + 8, (y0 + y1) / 2 - 8, txt, 'wk-val')); return g;
  }

  function clear(){ if (layer && layer.parentNode) layer.parentNode.removeChild(layer); layer = null; }

  function build(scope){
    clear();
    var sx = window.scrollX, sy = window.scrollY;
    var W = Math.max(d.documentElement.scrollWidth, d.body.scrollWidth), H = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
    layer = el('svg', { class: 'wk-layer', 'aria-hidden': 'true', width: W, height: H, viewBox: '0 0 ' + W + ' ' + H });
    var defs = el('defs', {}), pat = el('pattern', { id: 'wk-base', width: 8, height: 8, patternUnits: 'userSpaceOnUse' });
    pat.appendChild(el('line', { x1: 0, y1: 7.5, x2: 8, y2: 7.5, class: 'wk-baseline' })); defs.appendChild(pat); layer.appendChild(defs);
    var sr = scope ? scope.getBoundingClientRect() : null;
    var top = scope ? sr.top + sy : 0, bottom = scope ? sr.bottom + sy : H;
    layer.appendChild(el('rect', { x: 0, y: top, width: W, height: bottom - top, fill: 'url(#wk-base)' }));

    /* the shell: twelve columns inside .wrap, with its width dimensioned */
    var wrap = d.querySelector('.hero-copy') || d.querySelector('main .wrap') || d.querySelector('.wrap');
    var shell = d.querySelector('main .wrap') || d.querySelector('.site-head .bar');
    if (shell){
      var r = shell.getBoundingClientRect(), cs = getComputedStyle(shell);
      var x0 = r.left + sx + parseFloat(cs.paddingLeft), x1 = r.right + sx - parseFloat(cs.paddingRight), cw = (x1 - x0) / 12;
      var g = el('g', { class: 'wk-grid' });
      for (var i = 0; i <= 12; i++) g.appendChild(el('line', { x1: x0 + i * cw, y1: top, x2: x0 + i * cw, y2: bottom }));
      layer.appendChild(g);
      /* below the sticky header, so the shell dimension is never hidden under it */
      var head = d.querySelector('.site-head'), hh = head ? head.getBoundingClientRect().height : 0;
      layer.appendChild(hdim(x0, x1, Math.max(top + 12, sy + hh + 22), Math.round(x1 - x0) + ' · 12 col · ' + Math.round(cw) + ' each'));
    }
    /* the elements that carry the page */
    var sel = scope ? scope.querySelectorAll('h1, .lead, .plate, .btn, .stage, .proof, .hstrip')
                    : d.querySelectorAll('main h1, main h2, main .lead, main .btn, .stage, .poster, .cell, .panel .lab, .nameplate, .feat, .book, .filters');
    var n = 0, used = [];
    Array.prototype.forEach.call(sel, function(node){
      if (n >= 90) return; var r = node.getBoundingClientRect(); if (r.width < 24 || r.height < 10) return;
      var x = r.left + sx, y = r.top + sy, w = r.width, h = r.height; n++;
      layer.appendChild(el('rect', { x: x - .5, y: y - .5, width: w + 1, height: h + 1, class: 'wk-box' }));
      var isType = /^(H1|H2|P)$/.test(node.tagName);
      if (isType) layer.appendChild(vdim(x + w + 10, y, y + h, Math.round(h) + ''));
      var ly = y - 18; if (ly < top + 2) ly = y + h + 2;
      /* nudge labels that would sit on an earlier label */
      for (var k = 0; k < used.length; k++){ var u = used[k]; if (Math.abs(u[1] - ly) < 16 && Math.abs(u[0] - x) < u[2]) ly = u[1] + 17; }
      var txt = spec(node); used.push([x, ly, textW(txt)]);
      layer.appendChild(label(x, ly, txt));
    });
    d.body.appendChild(layer);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ layer.classList.add('wk-in'); }); });
  }

  var on = false;
  function set(state, persist){
    on = !!state; root.setAttribute('data-workings', on ? 'on' : 'off');
    Array.prototype.forEach.call(d.querySelectorAll('[data-workings-toggle]'), function(b){ b.setAttribute('aria-pressed', String(on)); });
    if (on){ echoing = false; build(null); } else clear();
    if (persist){ try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e){} }
  }
  d.addEventListener('click', function(e){
    var b = e.target.closest('[data-workings-toggle]'); if (!b) return; e.preventDefault(); set(!on, true);
  });
  var rt = null;
  window.addEventListener('resize', function(){ if (!on) return; clearTimeout(rt); rt = setTimeout(function(){ build(null); }, 160); }, { passive: true });
  /* the racks re-render on filter clicks; redraw over the new layout */
  d.addEventListener('click', function(e){ if (on && e.target.closest('.filters button, .sizes button, [data-wake]')) setTimeout(function(){ build(null); }, 120); });

  /* the home page draws its hero once, then lifts */
  function echo(scope){
    if (on || !scope) return; echoing = true;
    build(scope);
    var hold = rm ? 1100 : 1900;
    timer = setTimeout(function(){ if (!echoing) return; layer && layer.classList.remove('wk-in'); setTimeout(function(){ if (echoing) clear(); echoing = false; }, 400); }, hold);
  }
  var stored = null; try { stored = localStorage.getItem(KEY); } catch (e){}
  root.setAttribute('data-workings', 'off');
  window.addEventListener('load', function(){
    if (stored === '1'){ setTimeout(function(){ set(true, false); }, 250); }
  });
  window.WORKINGS = { on: function(){ return on; }, refresh: function(){ if (on) build(null); }, echo: echo, set: set };

  /* the home strip travels sideways as you pass it: scroll-linked, so it reads with Reduce Motion on */
  var strip = d.getElementById('stripRack');
  if (strip){
    var raf = null;
    var onScroll = function(){ raf = null; var r = strip.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh - r.top) / (vh + r.height); if (p < 0 || p > 1) return;
      strip.scrollLeft = p * Math.max(0, strip.scrollWidth - strip.clientWidth) * .85; };
    window.addEventListener('scroll', function(){ if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
    onScroll();
  }
})();
