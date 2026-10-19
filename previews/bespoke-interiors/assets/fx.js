/* Bespoke Interiors · motion layer shared by every page.
   Pages set window.FX = {split:'css selector', clip:'css selector', cur:[[selector,label],...]} before loading this. */
(function(){
  const C = window.FX || {}, D = document;
  const fine = matchMedia('(pointer:fine)').matches, reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const ready = fn => D.readyState === 'loading' ? D.addEventListener('DOMContentLoaded', fn) : fn();
  ready(function(){
    /* scroll progress */
    const bar = D.createElement('div'); bar.className = 'fx-prog'; D.body.appendChild(bar);
    let tk = false;
    const prog = () => { const h = D.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; tk = false };
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(prog) } }, { passive: true }); prog();

    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fx-in'); io.unobserve(e.target) } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });

    /* split headings into words that rise in */
    if (C.split && !reduce) D.querySelectorAll(C.split).forEach(el => {
      if (el.classList.contains('fx-split')) return;
      let n = 0;
      (function walk(node){
        [...node.childNodes].forEach(c => {
          if (c.nodeType === 3) {
            const f = D.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(p => {
              if (!p) return;
              if (/^\s+$/.test(p)) { f.appendChild(D.createTextNode(p)); return }
              const w = D.createElement('span'), i = D.createElement('span');
              w.className = 'fx-w'; i.textContent = p; i.style.transitionDelay = (n++ * .06).toFixed(2) + 's';
              w.appendChild(i); f.appendChild(w);
            });
            c.replaceWith(f);
          } else if (c.nodeType === 1 && !c.matches('br,svg,img,.fx-w')) walk(c);
        });
      })(el);
      el.classList.add('fx-split'); io.observe(el);
    });

    /* photos open up */
    if (C.clip && !reduce) D.querySelectorAll(C.clip).forEach(el => { el.classList.add('fx-clip'); io.observe(el) });

    /* marquees that speed up with the scroll */
    const mqs = [...D.querySelectorAll('.fx-mq')];
    if (mqs.length) {
      const vio = new IntersectionObserver(es => es.forEach(e => e.target._on = e.isIntersecting));
      mqs.forEach(m => { const t = m.querySelector('.fx-mq-t'); t.innerHTML += t.innerHTML; m._x = 0; m._d = +(m.dataset.dir || -1); m._s = +(m.dataset.speed || .45); vio.observe(m) });
      let v = 0, ly = scrollY;
      (function loop(){
        const dy = scrollY - ly; ly = scrollY; v += (Math.abs(dy) - v) * .08;
        if (!reduce) mqs.forEach(m => {
          if (!m._on) return;
          const t = m.firstElementChild, w = t.scrollWidth / 2; if (!w) return;
          m._x += m._d * (m._s + Math.min(7, v * .22));
          if (m._x <= -w) m._x += w; if (m._x > 0) m._x -= w;
          t.style.transform = 'translate3d(' + m._x.toFixed(2) + 'px,0,0)';
        });
        requestAnimationFrame(loop);
      })();
    }

    if (!fine || reduce) return;

    /* cursor */
    (C.cur || []).forEach(([s, l]) => D.querySelectorAll(s).forEach(e => { if (!e.dataset.cur) e.dataset.cur = l }));
    const cu = D.createElement('div'); cu.className = 'fx-cur'; cu.innerHTML = '<b></b>'; D.body.appendChild(cu);
    const lab = cu.firstChild;
    let x = -100, y = -100, tx = x, ty = y;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cu.classList.add('on') }, { passive: true });
    D.addEventListener('pointerleave', () => cu.classList.remove('on'));
    D.addEventListener('pointerover', e => {
      const m = e.target.closest('[data-cur]'), a = e.target.closest('a,button,input,select,textarea,label,[role=button]');
      const big = m && !(a && !a.contains(m) && m.contains(a));
      cu.classList.toggle('big', !!big); cu.classList.toggle('lk', !big && !!a);
      if (big) lab.textContent = m.dataset.cur;
    });
    (function f(){ x += (tx - x) * .22; y += (ty - y) * .22; cu.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; requestAnimationFrame(f) })();

    /* magnetic buttons */
    D.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.translate = ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px' });
      b.addEventListener('pointerleave', () => { b.style.translate = '' });
      b.style.transition = (getComputedStyle(b).transition || '') + ',translate .45s cubic-bezier(.2,.8,.2,1)';
    });
  });
})();
