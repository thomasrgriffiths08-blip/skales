/* Bespoke Interiors · site behaviour */
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

/* ---------- nav ---------- */
(function(){const nav=$('.nav');if(!nav)return;let last=0;
  const onS=()=>{const y=scrollY;nav.classList.toggle('solid',y>40);
    if(!document.body.classList.contains('mo'))nav.classList.toggle('hide',y>last&&y>500&&!nav.matches(':hover'));last=y};
  addEventListener('scroll',onS,{passive:true});onS();
  $$('.dd>button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();b.parentElement.classList.toggle('open')}));
  document.addEventListener('click',()=>$$('.dd.open').forEach(d=>d.classList.remove('open')));
  const bg=$('.burger');if(bg)bg.onclick=()=>{const o=!document.body.classList.contains('mo');document.body.classList.toggle('mo',o);bg.setAttribute('aria-expanded',o)};
  $$('.mm a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('mo')));
  addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('mo');closeQ();closeL()}});
})();

/* ---------- reveal ---------- */
(function(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
  $$('.rv').forEach(el=>io.observe(el));
  addEventListener('load',()=>document.body.classList.add('loaded'));setTimeout(()=>document.body.classList.add('loaded'),900);
  // count-ups
  const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,to=+el.dataset.count,s=el.dataset.suf||'',t0=performance.now();
    (function f(){const p=Math.min(1,(performance.now()-t0)/1600),v=Math.round(to*(1-Math.pow(1-p,4)));el.textContent=v.toLocaleString('en-IE')+s;if(p<1)requestAnimationFrame(f)})();cio.unobserve(el)}),{threshold:.6});
  $$('[data-count]').forEach(el=>cio.observe(el));
})();

/* ---------- home hero slides ---------- */
(function(){const fs=$$('.hero-slides figure'),bs=$$('.hero-dots button'),cap=$('.hero-cap');if(fs.length<2)return;let i=0,t;
  function go(n){fs[i].classList.remove('on');bs[i]&&bs[i].classList.remove('on');i=(n+fs.length)%fs.length;fs[i].classList.add('on');if(bs[i]){void bs[i].offsetWidth;bs[i].classList.add('on')}if(cap)cap.textContent=fs[i].dataset.cap||'';clearTimeout(t);t=setTimeout(()=>go(i+1),6500)}
  bs.forEach((b,k)=>b.onclick=()=>go(k));t=setTimeout(()=>go(1),6500);if(cap)cap.textContent=fs[0].dataset.cap||'';
})();

/* ---------- quote modal + forms (Netlify Forms) ---------- */
function openQ(service,summary){const m=$('#qm');if(!m)return;const sel=$('#qm select[name=service]');if(service&&sel){[...sel.options].forEach(o=>{if(o.value===service)sel.value=service})}
  const s=$('#qm .qm-sum');if(s){s.classList.toggle('on',!!summary);s.innerHTML=summary?'<b>Your design:</b> '+summary:''}
  const h=$('#qm input[name=design]');if(h)h.value=summary?summary.replace(/<[^>]+>/g,''):'';
  m.classList.add('on');document.body.style.overflow='hidden';const mb=$('.mbar');if(mb)mb.classList.add('hide');setTimeout(()=>{const f=$('#qm input[name=name]');if(f&&innerWidth>720)f.focus()},350)}
function closeQ(){const m=$('#qm');if(!m||!m.classList.contains('on'))return;m.classList.remove('on');document.body.style.overflow='';const mb=$('.mbar');if(mb)mb.classList.remove('hide')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-quote]');if(b){e.preventDefault();openQ(b.dataset.quote||'',b.dataset.summary||'')}});
(function(){const m=$('#qm');if(!m)return;$('.qm-x',m).onclick=closeQ;m.addEventListener('click',e=>{if(e.target===m)closeQ()})})();
$$('form[data-netlify]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();
  const btn=$('button[type=submit]',f);if(btn){btn.disabled=true;btn.style.opacity=.6}
  const done=()=>{f.classList.add('sent');if(btn){btn.disabled=false;btn.style.opacity=1}if(window.gtag)gtag('event','generate_lead')};
  fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(f)).toString()}).then(done).catch(done)}));

/* ---------- gallery + lightbox ---------- */
let LB=[],LI=0;
function openL(list,i){LB=list;LI=i;const l=$('#lbx');if(!l)return;$('img',l).src=LB[LI];l.classList.add('on')}
function closeL(){const l=$('#lbx');if(l)l.classList.remove('on')}
(function(){const l=$('#lbx');if(!l)return;$('.x',l).onclick=closeL;$('.p',l).onclick=()=>{LI=(LI-1+LB.length)%LB.length;$('img',l).src=LB[LI]};$('.n',l).onclick=()=>{LI=(LI+1)%LB.length;$('img',l).src=LB[LI]};l.addEventListener('click',e=>{if(e.target===l)closeL()})
  $$('.gal').forEach(g=>g.addEventListener('click',e=>{const f=e.target.closest('figure');if(!f)return;const vis=$$('figure:not(.out)',g);openL(vis.map(x=>x.dataset.full||$('img',x).src),vis.indexOf(f))}));
  $$('.filters').forEach(fl=>fl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',fl).forEach(x=>x.classList.toggle('on',x===b));const k=b.dataset.f,g=$(fl.dataset.for);$$('figure',g).forEach(f=>f.classList.toggle('out',k!=='all'&&f.dataset.f!==k))}));
})();

/* ---------- reviews ---------- */
$$('.revnav').forEach(n=>{const r=$(n.dataset.for);if(!r)return;const st=()=>r.firstElementChild.getBoundingClientRect().width+14;$('.p',n).onclick=()=>r.scrollBy({left:-st(),behavior:'smooth'});$('.n',n).onclick=()=>r.scrollBy({left:st(),behavior:'smooth'})});

/* ---------- mobile bar hides at footer ---------- */
(function(){const mb=$('.mbar'),ft=$('footer');if(!mb||!ft)return;new IntersectionObserver(es=>mb.classList.toggle('hide',es[0].isIntersecting),{threshold:.05}).observe(ft)})();

/* ---------- configurator engine ---------- */
/* data: {imgs:{key:url}, key:(state)=>key, groups:[{id,label,type:'sw'|'tiles'|'seg'|'months'|'checks',opts:[{v,label,c?,img?,sub?,add?,desc?}]}], base, price:true|false, service, name} */
function Configurator(root,D){const st={};D.groups.forEach(g=>{st[g.id]=g.type==='checks'?g.opts.filter(o=>o.on).map(o=>o.v):g.opts[g.def||0].v});
  const stage=$('.cfg-stage',root),panel=$('.cfg-body',root),selEl=$('.sel',stage),cache={};
  function img(k){if(!cache[k]){const im=new Image();im.decoding='async';im.alt='';im.src=D.imgs[k];stage.insertBefore(im,stage.firstChild);cache[k]=im}return cache[k]}
  Object.keys(D.imgs).forEach(k=>{if(k!==D.key(st))setTimeout(()=>img(k),1200)});
  let cur=null;
  function opt(g,v){return g.opts.find(o=>o.v===v)}
  function render(){const k=D.key(st),im=img(k);if(cur!==im){const show=()=>{if(cur)cur.classList.remove('on');im.classList.add('on');cur=im};im.complete?show():im.onload=show}
    // header values
    D.groups.forEach(g=>{const h=$(`[data-h="${g.id}"]`,root);if(!h)return;h.textContent=g.type==='checks'?(st[g.id].length?st[g.id].length+' added':'none'):opt(g,st[g.id]).label;
      $$(`[data-g="${g.id}"] button`,root).forEach(b=>b.classList.toggle('on',b.dataset.v===st[g.id]));const d=$(`[data-desc="${g.id}"]`,root);if(d)d.textContent=opt(g,st[g.id]).desc||''});
    // chips on stage
    selEl.innerHTML=D.groups.filter(g=>g.chip).map(g=>{const o=opt(g,st[g.id]);return `<span>${o.c?`<i style="background:${o.c}"></i>`:''}${o.label}</span>`}).join('');
    // price
    if(D.price){let p=D.price.base;D.groups.forEach(g=>{if(g.type==='checks')g.opts.forEach(o=>{if(st[g.id].includes(o.v))p+=o.add||0});else p+=(opt(g,st[g.id]).add||0)});animP(p)}
    const sum=D.summary(st,opt);const se=$('.summary',root);if(se)se.innerHTML=sum;
    const lk=$('.lock',root);if(lk){lk.dataset.summary=sum.replace(/^Your [a-z ]+: /i,'');lk.dataset.quote=D.service}}
  let shown=0,raf;function animP(to){const el=$('.price b',root);if(!el)return;cancelAnimationFrame(raf);const from=shown,t0=performance.now();(function f(){const p=Math.min(1,(performance.now()-t0)/700),v=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));shown=v;const s=v.toLocaleString('en-IE');const [a,...b]=s.split(',');el.innerHTML=`<small style="font-size:.5em;font-weight:300">from </small>€<strong>${a}</strong>${b.length?','+b.join(','):''}`;if(p<1)raf=requestAnimationFrame(f)})()}
  root.addEventListener('click',e=>{const b=e.target.closest('[data-g] button');if(!b)return;const g=b.closest('[data-g]').dataset.g;st[g]=b.dataset.v;render()});
  root.addEventListener('change',e=>{const c=e.target.closest('[data-g] input');if(!c)return;const g=c.closest('[data-g]').dataset.g;st[g]=$$(`[data-g="${g}"] input:checked`,root).map(x=>x.value);render()});
  render();
  // auto demo when idle in view
  let idle=0,touched=false;root.addEventListener('pointerdown',()=>touched=true,{once:true});
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting&&!touched&&!root._demo){root._demo=1;let n=0;const g=D.groups[0];const iv=setInterval(()=>{if(touched||n>=g.opts.length){clearInterval(iv);if(!touched){st[g.id]=g.opts[g.def||0].v;render()}return}st[g.id]=g.opts[(n+1)%g.opts.length].v;n++;render()},1700)}},{threshold:.5});io.observe(root);
}
