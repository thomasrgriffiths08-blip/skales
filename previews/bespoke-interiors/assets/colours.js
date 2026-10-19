/* Bespoke Interiors · painted colour library + door style tints (added round 4) */
(function(){
  const G = [
    ['Classic and sophisticated', [['White','#fafaf5','k-white','a Wellington door'],['Highland Grey','#eff0ed','k-highland-grey','a Campbell door, with Light Blue'],['Light Grey','#dadada','k-light-grey','a Monroe door, with Indigo'],['Dust Grey','#b4b2b3','k-dust-grey','a Hyde door, with Light Grey'],['Graphite','#4a4a49'],['Carbon Black','#1c1c1c','b-black','a Belair bedroom door']]],
    ['Calm and serene', [['Sea Breeze','#c9ccc3','k-sea-breeze','a Rainey door'],['Sage','#cad0ae','k-sage','a Parker door, with Graphite'],['Reed Green','#7a8278','k-reed-green','a Belair door'],['Liberty Green','#98a89e','k-liberty-green','a Rainey door, with White'],['Heritage Green','#3d5144','b-heritage-green','a Gladstone bedroom door'],['Conifer','#243629','k-conifer','a Monroe door, with Taupe'],['Moss Green','#626757','k-moss-green','a Campbell door']]],
    ['Soft and nurturing', [['Primed','#f7f6f0'],['Porcelano','#f3f1e6'],['Ivory','#fcf9e5'],['Linen','#faf4e3','k-linen','a Brooklyn door'],['Stone Grey','#afa092','b-stone-grey','a Hyde bedroom door'],['Honeycomb','#cbaa66','k-honeycomb','a Parker door'],['Mussel','#e4e1cd'],['Dakar','#d2c9b2']]],
    ['Bold and dreamy', [['Light Blue','#c2ccc3','k-highland-grey','a Campbell door, with Highland Grey'],['Denim','#929ea9','k-denim','an Arena door, with White and Graphite'],['Eiffel Blue','#2e4f71','k-eiffel-blue','an Edison door, with Graphite'],['Marine Blue','#1d3054'],['Nautical','#004150','k-nautical','a Brooklyn door'],['Indigo','#172039','k-indigo','an Edison door, with White']]],
    ['Sweet and romantic', [['Pebble','#cac6be','k-pebble','a Hartford door'],['Taupe','#dcd6ca','k-taupe','a Parker door'],['Cashmere','#d3c9c4','b-cashmere','a Belair bedroom door'],['French Chalk','#dfc2ae','b-french-chalk','a Gladstone bedroom door'],['Heritage Pink','#bea19d','k-heritage-pink','a Brooklyn door'],['French Lavender','#999195'],['Foraged Fruit','#574451'],['Heritage Red','#733830','k-heritage-red','a Brooklyn door']]]
  ];
  const DOOR = c => `<div class="cl-dr" style="--c:${c}"><i></i><b></b></div>`;
  window.BI_COLOURS = G;

  function library(root){
    const stage = root.querySelector('.cl-stage'), gs = root.querySelector('.cl-gs'), now = root.querySelector('.cl-now'), cap = root.querySelector('.cl-cap');
    const all = []; G.forEach(([mood, cs]) => cs.forEach(c => all.push({mood, n:c[0], hex:c[1], ph:c[2], d:c[3]})));
    gs.innerHTML = G.map(([mood, cs]) => `<div class="cl-g"><span class="cl-lbl">${mood}</span><div class="cl-sw">${cs.map(c => `<button type="button" data-n="${c[0]}" class="${c[2]?'hasph':''}" style="background:${c[1]}" aria-label="${c[0]}" title="${c[0]}"></button>`).join('')}</div></div>`).join('') + '<span class="cl-key"><i></i>Tap any colour to see it</span>';
    const plain = document.createElement('div'); plain.className = 'cl-plain'; plain.innerHTML = DOOR('#ddd') + '<em></em>'; stage.insertBefore(plain, stage.firstChild);
    const cache = {}; let cur = null, sel = null, touched = false;
    const img = k => { if (!cache[k]) { const m = new Image(); m.className = 'clp'; m.alt = ''; m.decoding = 'async'; m.src = 'img/os/' + k + (innerWidth < 700 ? '-s' : '') + '.webp'; stage.insertBefore(m, plain); cache[k] = m } return cache[k] };
    function pick(n, user){
      const c = all.find(x => x.n === n); if (!c) return; sel = c; if (user) touched = true;
      gs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.n === n));
      now.innerHTML = DOOR(c.hex) + `<div><span class="cl-lbl">${c.mood}</span><b>${c.n}</b><small>${c.ph ? 'Shown on ' + c.d : 'Matt painted finish. Mark brings the real sample to your visit.'}</small></div>`;
      cap.innerHTML = `<i style="background:${c.hex}"></i><span><b>${c.n}</b>${c.ph ? ' on ' + c.d : ' painted shaker door'}</span>`;
      const show = el => { if (cur && cur !== el) cur.classList.remove('on'); el.classList.add('on'); cur = el };
      if (c.ph) { const m = img(c.ph); m.complete ? show(m) : (m.onload = () => { if (sel === c) show(m) }) }
      else { plain.querySelector('.cl-dr').style.setProperty('--c', c.hex); plain.style.background = `linear-gradient(180deg,#eee9e1 0 74%,#d9cdbb 74%)`; plain.querySelector('em').textContent = c.n + ' · matt painted finish'; show(plain) }
      root.querySelectorAll('[data-cl-sample]').forEach(b => b.textContent = 'Bring me a ' + c.n + ' sample');
    }
    gs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pick(b.dataset.n, true) });
    root.querySelectorAll('[data-cl-sample]').forEach(b => b.addEventListener('click', e => {
      e.preventDefault(); const s = 'Colour sample: ' + sel.n;
      if (window.wzPick) { window.LVSUM = s; const w = document.getElementById('wdes'); if (w) { w.innerHTML = '<b>Your design:</b> ' + s; w.classList.add('on') } document.getElementById('quote').scrollIntoView({behavior:'smooth'}); setTimeout(() => wzPick('Kitchen'), 650) }
      else if (window.openQ) openQ(root.dataset.service || 'Kitchens', 'Colour sample: <b>' + sel.n + '</b>');
    }));
    pick(root.dataset.start || 'Moss Green');
    // warm a few photos, then flick through some favourites once when it comes into view
    setTimeout(() => ['k-heritage-red','k-nautical','k-honeycomb'].forEach(img), 1500);
    const tour = ['Heritage Red','Nautical','Honeycomb','Heritage Pink', root.dataset.start || 'Moss Green'];
    new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect(); let k = 0; const iv = setInterval(() => { if (touched || k >= tour.length) { clearInterval(iv); return } pick(tour[k++]) }, 1800) }, {threshold:.4}).observe(root);
    root.addEventListener('pointerdown', () => touched = true, {passive:true});
  }

  function styles(root){
    const sw = root.querySelector('.ds-sw');
    const P = [['White','#fafaf5'],['Light Grey','#dadada'],['Pebble','#cac6be'],['Cashmere','#d3c9c4'],['Sage','#cad0ae'],['Moss Green','#626757'],['Honeycomb','#cbaa66'],['Heritage Pink','#bea19d'],['Heritage Red','#733830'],['Nautical','#004150'],['Indigo','#172039'],['Graphite','#4a4a49']];
    sw.insertAdjacentHTML('beforeend', P.map((p, i) => `<button type="button" style="background:${p[1]}" data-c="${p[1]}" aria-label="${p[0]}" title="${p[0]}"${i ? '' : ' class="on"'}></button>`).join('') + '<em class="ds-now" style="font-style:normal;font-size:13.5px;margin-left:6px">White</em>');
    let tch = false; sw.addEventListener('pointerdown', () => tch = true);
    const set = (b, auto) => { if (auto && tch) return; sw.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); root.style.setProperty('--paint', b.dataset.c); sw.querySelector('.ds-now').textContent = b.title };
    sw.addEventListener('click', e => { const b = e.target.closest('button'); if (b) set(b) });
    // gentle hint: paint the doors once when they arrive
    new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect(); const bs = [...sw.querySelectorAll('button')]; [6, 9, 5].forEach((k, j) => setTimeout(() => set(bs[k], true), 900 + j * 1300)) }, {threshold:.35}).observe(root);
  }

  const go = () => { document.querySelectorAll('.cl').forEach(library); document.querySelectorAll('.ds').forEach(styles) };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go) : go();
})();
