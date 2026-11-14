/* DemoShell: the slim kit every rebuilt demo stands in (assets/shell.css), around a Steps story (assets/step.js).
   It wires the page's own markup; it writes nothing a visitor needs before it runs, so the bar, the title and
   the Book links work without it. The markup it looks for (demos/kit/index.html is the reference):

   <body class="dm" data-slug="kit" data-kind="heating" data-base="../../" style="--biz:#2563EB">
     header.dm-bar      .dm-mark  .dm-fict  a.dm-book[data-book]
     main.dm-main       h1.dm-title (<b>…</b> <i>…</i>)
                        .dm-modes  button[data-dm=watch]  button[data-dm=try]
                        .dm-prog   ol.dm-dots  button[data-dm=pause]  a[data-dm=skip]
                        section.dm-stage > .dm-view > .dm-scene (the story's stage: .dm-phone, .dm-owner)
                                                    + .dm-endwrap[hidden] > .dm-end (… button[data-dm=again])
                                     + p.dm-cap > span.dm-cap-t

   var story = DemoShell.mount(document.body, {
     steps: [...],                 // Steps.run steps; each may carry caption, and ask (string or {try, watch}) for a tap
     idle: 'Caption before it starts', opening: 'Caption as it starts', tail: 1800
   });
   Each step's c also gets c.drawer(up) (the owner's drawer on a phone) and c.log(time, text) (the owner's log). */
(function(w, d){
  'use strict';
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* money figures in a caption go yellow */
  function money(s){ return esc(s).replace(/£\d[\d,]*(?:\.\d+)?k?/g, '<b>$&</b>'); }

  function mount(root, cfg){
    cfg = cfg || {};
    if (!w.Steps) return null;
    var $ = function(s){ return root.querySelector(s); }, $$ = function(s){ return [].slice.call(root.querySelectorAll(s)); };
    var stage = $('.dm-stage'), scene = $('.dm-scene'), cap = $('.dm-cap-t') || $('.dm-cap'), dots = $('.dm-dots');
    var endw = $('.dm-endwrap'), end = $('.dm-end');
    var bWatch = $('[data-dm=watch]'), bTry = $('[data-dm=try]'), bPause = $('[data-dm=pause]'), bSkip = $('[data-dm=skip]');
    if (!stage || !scene) return null;
    var steps = cfg.steps || [];

    /* every Book link carries where it came from */
    var slug = root.getAttribute('data-slug') || 'demo', kind = root.getAttribute('data-kind') || '', base = root.getAttribute('data-base');
    if (base == null) base = '/';
    var href = base + 'book/?utm_source=site&utm_medium=demo&utm_content=' + encodeURIComponent(slug) + (kind ? '&kind=' + encodeURIComponent(kind) : '');
    $$('[data-book]').forEach(function(a){ a.setAttribute('href', href); });
    function track(name, p){ if (w.skTrack) try { w.skTrack(name, Object.assign({ demo: slug }, p || {})); } catch (e){} }

    /* the progress dots: one per step with a label */
    var labels = steps.filter(function(s){ return s.label; }).map(function(s){ return s.label; });
    if (dots){
      dots.innerHTML = labels.map(function(l, k){ return '<li><span class="dm-sr">' + esc((k + 1) + '. ' + l) + '</span></li>'; }).join('');
    }
    function paint(n){
      if (!dots) return;
      [].forEach.call(dots.children, function(li, k){
        li.classList.toggle('is-done', k < n);
        if (k === n - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      dots.setAttribute('aria-label', 'Progress: ' + n + ' of ' + labels.length);
    }
    function say(t){ if (t != null && cap) cap.innerHTML = money(t); }
    function modeUI(m){
      if (bWatch) bWatch.setAttribute('aria-pressed', String(m === 'watch'));
      if (bTry) bTry.setAttribute('aria-pressed', String(m === 'try'));
      root.setAttribute('data-mode', m);
    }
    function hideEnd(){ if (endw) endw.hidden = true; }
    function showEnd(instant){
      if (!endw) return;
      if (instant) endw.hidden = false;
      else { endw.hidden = false; w.Steps.reveal(end || endw, { from: 'below' }); }
    }

    var story = w.Steps.run(scene, steps, {
      mode: cfg.mode, view: stage, animRoot: root, tail: cfg.tail, delay: cfg.delay, autostart: cfg.autostart,
      helpers: function(c){
        return {
          /* the owner's side: a panel on a laptop, a drawer that rises on a phone */
          drawer: function(up){ c.cls('.dm-owner', 'is-up', up !== false); },
          log: function(time, text){
            var ul = c.$('.dm-log'); if (!ul) return null;
            c.$$('.dm-log .dm-empty').forEach(function(e){ e.parentNode.removeChild(e); });
            var li = c.add(ul, '<li><time>' + esc(time) + '</time><span>' + esc(text) + '</span></li>', { first: true, from: 'above' });
            c.text('.dm-new', ul.children.length + ' new');
            c.cls('.dm-new', 'is-on', true);
            return li;
          }
        };
      },
      onReset: function(){ paint(0); say(cfg.idle); hideEnd(); },
      onStart: function(info){ paint(0); say(cfg.opening != null ? cfg.opening : cfg.idle); hideEnd(); track('demo_start', { mode: info.mode }); },
      onStep: function(i, s, info){ paint(info.beat); if (s.caption != null) say(s.caption); },
      onWait: function(i, s, info){
        var a = s.ask; if (a && typeof a === 'object') a = a[info.mode];
        if (a != null) say(a);
      },
      onEnd: function(info){ paint(labels.length); if (cfg.result) say(cfg.result); showEnd(info.instant); track('demo_end', { skipped: info.instant }); },
      onState: stateUI
    });
    function stateUI(st){
      root.setAttribute('data-state', st);
      if (bPause) bPause.textContent = st === 'playing' || st === 'waiting' ? 'Pause' : 'Play';
    }
    modeUI(story.mode);
    stateUI(story.state);

    /* pressing Watch it or Try it starts the story over in that mode, in view */
    function intoView(){
      var r = stage.getBoundingClientRect(), vh = w.innerHeight || d.documentElement.clientHeight;
      if (r.top >= 0 && r.bottom <= vh) return;
      try { stage.scrollIntoView({ block: r.height > vh ? 'start' : 'nearest', behavior: w.Steps.motion() ? 'smooth' : 'auto' }); } catch (e){ stage.scrollIntoView(); }
    }
    function go(m){ hideEnd(); story.setMode(m); modeUI(m); story.restart(); intoView(); track('demo_' + m); }
    if (bWatch) bWatch.addEventListener('click', function(){ go('watch'); });
    if (bTry) bTry.addEventListener('click', function(){ go('try'); });
    $$('[data-dm=again]').forEach(function(b){ b.addEventListener('click', function(){ go('watch'); }); });
    if (bPause) bPause.addEventListener('click', function(){
      if (story.state === 'playing' || story.state === 'waiting') story.pause(); else story.play();
    });
    if (bSkip) bSkip.addEventListener('click', function(e){
      e.preventDefault();
      story.skipToEnd();
      intoView();
      if (end){ try { end.focus({ preventScroll: true }); } catch (x){} }
      track('demo_skip');
    });
    return story;
  }

  w.DemoShell = { mount: mount, money: money };
})(window, document);
