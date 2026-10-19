/* Bespoke Interiors · interactive tools (floor visualiser, wall planners) */

/* ================= herringbone floor visualiser ================= */
function FloorViz(root){
  const cv=$('canvas',root),cx=cv.getContext('2d');
  const SP={oak:{n:'Natural oak',b:[196,156,108],v:22},smoked:{n:'Smoked oak',b:[122,92,64],v:18},walnut:{n:'American walnut',b:[104,72,50],v:16},white:{n:'White-oiled oak',b:[222,204,178],v:14}};
  const st={pat:'herringbone',sp:'oak',size:'90'};let seed=7;
  const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  function plank(x,y,w,h,ang,c){cx.save();cx.translate(x,y);cx.rotate(ang);
    const t=(rnd()-.5)*c.v,g=cx.createLinearGradient(0,0,w,0);const base=`rgb(${c.b[0]+t},${c.b[1]+t*.85},${c.b[2]+t*.7})`;
    g.addColorStop(0,base);g.addColorStop(.5,`rgb(${c.b[0]+t+6},${c.b[1]+t*.85+5},${c.b[2]+t*.7+4})`);g.addColorStop(1,base);
    cx.fillStyle=g;cx.fillRect(0,0,w,h);
    cx.globalAlpha=.16;cx.strokeStyle=`rgb(${c.b[0]*.55},${c.b[1]*.5},${c.b[2]*.45})`;
    for(let i=0;i<5;i++){cx.lineWidth=.6+rnd()*1.4;cx.beginPath();const yy=rnd()*h;cx.moveTo(0,yy);for(let xx=0;xx<=w;xx+=w/8)cx.lineTo(xx,yy+Math.sin(xx*.02+i)*h*.08);cx.stroke()}
    if(rnd()>.9){cx.globalAlpha=.12;cx.beginPath();cx.ellipse(w*rnd(),h/2,h*.32,h*.14,0,0,7);cx.stroke()}
    cx.globalAlpha=.55;cx.strokeStyle='rgba(40,26,14,.55)';cx.lineWidth=1.4;cx.strokeRect(0,0,w,h);cx.restore();cx.globalAlpha=1}
  function draw(){seed=7;const W=cv.width=1800,H=cv.height=1800;const c=SP[st.sp];const w=+st.size*0.36,L=w*5.5;
    cx.fillStyle='#3a2a1c';cx.fillRect(0,0,W,H);
    if(st.pat==='herringbone'){cx.save();cx.translate(W/2,H/2);cx.rotate(Math.PI/4);
      for(let s=-14;s<14;s++)for(let n=-40;n<40;n++){const ox=n*w+s*L,oy=n*w-s*L;if(Math.abs(ox)>W*1.1&&Math.abs(oy)>W*1.1)continue;plank(ox,oy,L,w,0,c);plank(ox+w,oy+w,L,w,Math.PI/2,c)}
      cx.restore()}
    else if(st.pat==='chevron'){const cw=L*.62,sl=.72;for(let col=-1;col<W/cw+1;col++){const x0=col*cw,ev=col%2===0;for(let y=-cw;y<H+cw;y+=w){
        const P=ev?[[x0,y],[x0+cw,y-cw*sl],[x0+cw,y-cw*sl+w],[x0,y+w]]:[[x0,y-cw*sl],[x0+cw,y],[x0+cw,y+w],[x0,y-cw*sl+w]];
        const t=(rnd()-.5)*c.v;cx.save();cx.beginPath();P.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();
        cx.fillStyle=`rgb(${c.b[0]+t},${c.b[1]+t*.85},${c.b[2]+t*.7})`;cx.fill();cx.clip();
        cx.globalAlpha=.15;cx.strokeStyle=`rgb(${c.b[0]*.55},${c.b[1]*.5},${c.b[2]*.45})`;const dy=ev?-sl:sl;
        for(let k=0;k<5;k++){const yy=y+rnd()*w;cx.lineWidth=.6+rnd()*1.3;cx.beginPath();cx.moveTo(x0,ev?yy:yy-cw*sl);cx.lineTo(x0+cw,ev?yy-cw*sl:yy);cx.stroke()}
        cx.restore();cx.save();cx.beginPath();P.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();cx.strokeStyle='rgba(40,26,14,.5)';cx.lineWidth=1.3;cx.stroke();cx.restore()}}}
    else{const pl=L*1.6;for(let y=0,r=0;y<H;y+=w*1.3,r++){let x=-rnd()*pl;while(x<W){const len=pl*(.6+rnd()*.8);plank(x,y,len,w*1.3,0,c);x+=len}}}
    // light falloff
    const g=cx.createRadialGradient(W*.3,H*.2,50,W*.5,H*.5,W*.8);g.addColorStop(0,'rgba(255,248,235,.16)');g.addColorStop(1,'rgba(0,0,0,.18)');cx.fillStyle=g;cx.fillRect(0,0,W,H);
    $$('[data-g] button',root).forEach(b=>b.classList.toggle('on',st[b.parentElement.dataset.g]===b.dataset.v));
    $('[data-h=pat]',root).textContent=$(`[data-g=pat] [data-v="${st.pat}"]`,root).textContent.trim();$('[data-h=sp]',root).textContent=c.n;$('[data-h=size]',root).textContent=st.size+' mm';
    const sel=$('.sel',root);sel.innerHTML=`<span>${$(`[data-g=pat] [data-v="${st.pat}"]`,root).textContent.trim()}</span><span><i style="background:rgb(${c.b})"></i>${c.n}</span>`;
    const sum=`Your floor: <b>${c.n.toLowerCase()}</b> in <b>${st.pat==='straight'?'straight plank':st.pat}</b>, <b>${st.size}mm</b> boards.`;$('.summary',root).innerHTML=sum;const lk=$('.lock',root);lk.dataset.summary=sum.replace('Your floor: ','')}
  root.addEventListener('click',e=>{const b=e.target.closest('[data-g] button');if(!b)return;st[b.parentElement.dataset.g]=b.dataset.v;cv.classList.add('swap');setTimeout(()=>{draw();cv.classList.remove('swap')},180)});
  draw();
}

/* ================= wall planner (alcoves / home office) ================= */
function Planner(root,mode){
  const svg=$('svg',root),NS='http://www.w3.org/2000/svg';
  const COL={sage:['Sage green','#8a9a82'],white:['Chalk white','#ece8e1'],navy:['Midnight navy','#2b3650'],stone:['Warm stone','#c9bead'],black:['Soft black','#33322f']};
  const st=mode==='alcove'?{w:950,h:2500,base:850,n:3,led:1,doors:'shaker',col:'sage'}:{w:3000,h:2500,n:2,towers:1,drawers:1,led:1,doors:'shaker',col:'navy'};
  const fmt=v=>Math.round(v).toLocaleString('en-IE');
  function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e}
  function dim(x1,y1,x2,y2,txt,vert,off=0){const g=el('g',{class:'pd'});el('line',{x1,y1,x2,y2},g);const tk=7;
    [[x1,y1],[x2,y2]].forEach(([x,y])=>el('line',{x1:x-tk,y1:y+tk,x2:x+tk,y2:y-tk},g));
    const cx=(x1+x2)/2,cy=(y1+y2)/2,tw=txt.length*8.6+22;const lg=el('g',{transform:`translate(${cx+(vert?off:0)} ${cy+(vert?0:off)})${vert?' rotate(-90)':''}`},g);el('rect',{x:-tw/2,y:-13,width:tw,height:26,rx:13},lg);const t=el('text',{y:4.5,'text-anchor':'middle'},lg);t.textContent=txt}
  function doors(x,y,w,h,n,c,g){const dw=w/n;for(let i=0;i<n;i++){const dx=x+i*dw;el('rect',{x:dx+3,y:y+3,width:dw-6,height:h-6,rx:2,fill:c,class:'door'},g);if(st.doors==='shaker')el('rect',{x:dx+3+dw*.13,y:y+3+Math.min(dw,h)*.13,width:dw-6-dw*.26,height:h-6-Math.min(dw,h)*.26,rx:1.5,fill:'none',class:'inset'},g);
      el('circle',{cx:i%2?dx+dw*.16:dx+dw-dw*.16,cy:y+h*(h>420?.45:.5),r:3.6,class:'knob'},g)}}
  function draw(){svg.innerHTML='';const c=COL[st.col][1];
    const defs=el('defs',{});const lg=el('linearGradient',{id:'led',x1:0,y1:0,x2:0,y2:1},defs);el('stop',{offset:0,'stop-color':'#ffd9a0','stop-opacity':.85},lg);el('stop',{offset:1,'stop-color':'#ffd9a0','stop-opacity':0},lg);
    const W=1600,H=1000,m=110;
    if(mode==='alcove'){const ch=1500,tot=st.w*2+ch,s=Math.min((W-2*m)/tot,(H-2*m)/st.h),ox=(W-tot*s)/2,fy=H-m+20,cy=fy-st.h*s;
      el('rect',{x:ox-40,y:cy,width:tot*s+80,height:st.h*s,class:'wallbg'});
      el('rect',{x:ox+st.w*s,y:cy,width:ch*s,height:st.h*s,class:'breast'});
      const fpw=ch*.55*s,fph=st.h*.32*s,fx=ox+st.w*s+(ch*s-fpw)/2;el('rect',{x:fx-26,y:fy-fph-38,width:fpw+52,height:22,class:'mantel'});el('rect',{x:fx,y:fy-fph,width:fpw,height:fph,class:'fire'});
      [0,st.w+ch].forEach((a,i)=>{const x=ox+a*s,w=st.w*s,g=el('g',{});const bh=st.base*s;
        el('rect',{x,y:fy-bh,width:w,height:bh,fill:c,class:'carc'},g);doors(x,fy-bh+6,w,bh-12,st.w>700?2:1,c,g);el('rect',{x:x-4,y:fy-bh-16,width:w+8,height:16,class:'top'},g);
        const top=cy+30,bottom=fy-bh-16,gap=(bottom-top)/(st.n+1);for(let k=1;k<=st.n;k++){const yy=top+gap*k-8;if(st.led)el('rect',{x:x+4,y:yy+14,width:w-8,height:gap*.55,fill:'url(#led)'},g);el('rect',{x,y:yy,width:w,height:14,class:'shelf'},g)}});
      el('line',{x1:ox-60,y1:fy,x2:ox+tot*s+60,y2:fy,class:'floor'});el('line',{x1:ox-60,y1:cy,x2:ox+tot*s+60,y2:cy,class:'floor'});
      dim(ox,cy-46,ox+st.w*s,cy-46,fmt(st.w)+' mm');dim(ox-56,fy,ox-56,cy,fmt(st.h)+' mm',1);dim(ox+tot*s+46,fy,ox+tot*s+46,fy-st.base*s,fmt(st.base)+' mm',1);
      const sp=(st.h-st.base-40-30/s)/(st.n+1);dim(ox+tot*s-st.w*s/2,cy+30,ox+tot*s-st.w*s/2,cy+30+(fy-st.base*s-16-cy-30)/(st.n+1),'≈ '+fmt(sp)+' mm',1)}
    else{const tot=st.w,s=Math.min((W-2*m)/tot,(H-2*m)/st.h),ox=(W-tot*s)/2,fy=H-m+20,cy=fy-st.h*s;
      el('rect',{x:ox-40,y:cy,width:tot*s+80,height:st.h*s,class:'wallbg'});
      const tw=st.towers?Math.min(600,st.w*.2):0,dh=750*s,dx=ox+tw*s,dw=(st.w-2*tw)*s;
      if(st.towers)[ox,ox+(st.w-tw)*s].forEach(x=>{const g=el('g',{});el('rect',{x,y:cy+4,width:tw*s,height:st.h*s-4,fill:c,class:'carc'},g);doors(x,cy+st.h*s*.45,tw*s,st.h*s*.55-4,1,c,g);doors(x,cy+8,tw*s,st.h*s*.45-12,1,c,g)});
      el('rect',{x:dx-4,y:fy-dh,width:dw+8,height:16,class:'top'});
      if(st.drawers){const pw=Math.min(520*s,dw*.3);[dx,dx+dw-pw].forEach(x=>{const g=el('g',{});el('rect',{x,y:fy-dh+16,width:pw,height:dh-16,fill:c,class:'carc'},g);for(let k=0;k<3;k++)el('rect',{x:x+4,y:fy-dh+20+k*(dh-20)/3,width:pw-8,height:(dh-20)/3-6,rx:2,fill:c,class:'door'},g)})}
      const top=cy+40,bottom=fy-dh-420*s,gap=(bottom-top)/Math.max(1,st.n);for(let k=0;k<st.n;k++){const yy=top+gap*(k+1)-8;if(st.led)el('rect',{x:dx+6,y:yy+14,width:dw-12,height:gap*.5,fill:'url(#led)'});el('rect',{x:dx,y:yy,width:dw,height:14,class:'shelf'})}
      el('line',{x1:ox-60,y1:fy,x2:ox+tot*s+60,y2:fy,class:'floor'});el('line',{x1:ox-60,y1:cy,x2:ox+tot*s+60,y2:cy,class:'floor'});
      dim(ox,cy-46,ox+tot*s,cy-46,fmt(st.w)+' mm');dim(ox-56,fy,ox-56,cy,fmt(st.h)+' mm',1);dim(ox+tot*s+46,fy,ox+tot*s+46,fy-dh,'750 mm desk',1)}
    // ui
    $$('[data-g] button',root).forEach(b=>b.classList.toggle('on',String(st[b.parentElement.dataset.g])===b.dataset.v));
    $$('input[type=range]',root).forEach(r=>{r.value=st[r.name];const o=$(`[data-o="${r.name}"]`,root);if(o)o.textContent=fmt(st[r.name])+(r.dataset.u||'')});
    $$('[data-h]',root).forEach(h=>{const k=h.dataset.h;h.textContent=k==='col'?COL[st.col][0]:k==='doors'?(st.doors==='shaker'?'Shaker':'Flat'):''});
    const sel=$('.sel',root);sel.innerHTML=`<span><i style="background:${c}"></i>${COL[st.col][0]}</span><span>${mode==='alcove'?'2 alcoves · '+fmt(st.w)+' mm':fmt(st.w)+' mm wall'}</span>`;
    const sum=mode==='alcove'?`Your alcoves: <b>${fmt(st.w)}mm</b> wide, <b>${fmt(st.h)}mm</b> ceiling, <b>${st.n} shelves</b> over <b>${fmt(st.base)}mm</b> cupboards, ${st.doors} doors in <b>${COL[st.col][0].toLowerCase()}</b>${st.led?', with <b>LED lighting</b>':''}.`
      :`Your office wall: <b>${fmt(st.w)}mm</b> wide, <b>${st.n} shelves</b> over a full-length desk${st.towers?', <b>tall cupboards</b> either side':''}${st.drawers?', <b>drawer pedestals</b>':''}, ${st.doors} doors in <b>${COL[st.col][0].toLowerCase()}</b>${st.led?', with <b>LED lighting</b>':''}.`;
    $('.summary',root).innerHTML=sum;$('.lock',root).dataset.summary=sum.replace(/^Your [a-z ]+: /,'')}
  root.addEventListener('input',e=>{const r=e.target.closest('input[type=range]');if(!r)return;st[r.name]=+r.value;draw()});
  root.addEventListener('click',e=>{const b=e.target.closest('[data-g] button');if(!b)return;const k=b.parentElement.dataset.g,v=b.dataset.v;st[k]=isNaN(+v)?v:+v;draw()});
  draw();
}
