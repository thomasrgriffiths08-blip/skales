document.addEventListener("DOMContentLoaded",()=>{
const URLS={p303:'img/mw1.webp',drawerV:'media/drawer.mp4',p03d:'img/mwb4.webp',slats:'img/mwslats.webp',led:'img/mwled.webp',p5f0:'img/mwb2.webp'};
/* ---------- BUILD: every piece of the real job glides into place (GPU transforms only) ---------- */
(function(){const sec=$('#build'),st=$('#stage'),scene=$('#scene'),lis=$$('#steps li'),bar=$('#bbar i'),pct=$('#bpct'),tag=$('#stTag'),co=$('#bco'),coT=$('#bcoT'),so=$('#setout');
  const c01=v=>v<0?0:v>1?1:v,eo=t=>1-Math.pow(1-t,3),eo5=t=>1-Math.pow(1-t,5),ez=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const W=(a,b)=>v=>c01((v-a)/(b-a));
  const el=k=>$('#L_'+k);
  // [layer, window, style] — styles: rise, drop, up (soft sweep upward), side (-1/1), sweep (soft sweep right), pop
  const A=[];
  for(let j=0;j<7;j++)A.push(['d'+j,W(.085+j*.026,.2+j*.026),'rise']);
  A.push(['top',W(.28,.38),'drop']);
  A.push(['tL',W(.37,.5),'up'],['tR',W(.405,.535),'up'],['tC',W(.44,.57),'up']);
  [['sL1',-1],['sR1',1],['sL2',-1],['sR2',1],['sL3',-1],['sR3',1]].forEach((s,j)=>A.push([s[0],W(.55+j*.022,.63+j*.022),'side',s[1]]));
  A.push(['pan',W(.69,.8),'sweep'],['cap',W(.77,.83),'drop'],['tv',W(.82,.895),'pop'],['bar',W(.86,.91),'rise']);
  A.forEach(a=>a.push(el(a[0])));
  const lit=el('lit');
  const B=[0,.085,.28,.37,.55,.69,.82,.905];
  const bb=$('#bbar');B.forEach(t=>{const e=document.createElement('em');e.style.left=(t*100)+'%';bb.appendChild(e)});
  const CO=[[66,50,'Laser set-out, before anything is cut'],[57,84,'Seven handleless, soft-close drawers'],[78,71.5,'One run of solid oak'],[60,22,'Scribed tight to the ceiling'],[22,45,'Floating solid oak shelves'],[66,35,'Fluted solid oak, grain matched'],[57,46,'TV floated, cables hidden'],[9,57,'Warm LED under every shelf']];
  function style(a,v){const e=a[1](v),n=a[a.length-1],k=a[2];if(e<=0){if(n._v!==0){n.style.opacity=0;n._v=0}return}if(e>=1&&n._v===1)return;n._v=e>=1?1:.5;
    const f=eo(e),bl=(1-eo5(e))*7,o=c01(e*1.6);let tr='',m='';
    if(k==='rise')tr=`translate3d(0,${(1-f)*38}px,0) scale(${1+(1-f)*.025})`;
    else if(k==='drop')tr=`translate3d(0,${-(1-f)*70}px,0)`;
    else if(k==='up'){const p=ez(e)*118;m=`linear-gradient(to top,#000 ${p-18}%,transparent ${p}%)`;tr=`translate3d(0,${-(1-f)*26}px,0)`}
    else if(k==='side')tr=`translate3d(${a[3]*(1-f)*-60}px,0,0)`;
    else if(k==='sweep'){const p=ez(e)*122;m=`linear-gradient(90deg,#000 ${p-22}%,transparent ${p}%)`}
    else if(k==='pop')tr=`scale(${.93+.07*f})`;
    n.style.opacity=k==='up'||k==='sweep'?c01(e*3):o;n.style.transform=tr;n.style.filter=bl>.05&&k!=='up'&&k!=='sweep'?`blur(${bl.toFixed(2)}px) drop-shadow(0 ${(1-f)*26}px ${(1-f)*22}px rgba(0,0,0,${(1-f)*.22}))`:'none';
    if(m||n._m){n.style.webkitMaskImage=n.style.maskImage=e>=1?'none':m;n._m=!!m&&e<1}}
  // laser set-out + survey on the bare wall
  const lb=(x,y,txt,rot)=>`<g class="lb" transform="translate(${x} ${y})${rot?' rotate(-90)':''}"><rect/><text text-anchor="middle" y="7.5">${txt}</text></g>`;
  const tk=(x,y)=>`M${x-7} ${y+7}L${x+7} ${y-7}`;
  const LZ=[[10,870,1490,870],[445,176,445,1062],[1100,190,1100,1062],[20,352,1480,352]];
  so.innerHTML=`<g id="soL">${LZ.map((l,i)=>`<path class="lz${i>1?' x':''}" pathLength="1" style="stroke-dasharray:1 1;stroke-dashoffset:1" d="M${l[0]} ${l[1]}L${l[2]} ${l[3]}"/>`).join('')}</g>
   <g id="soD" style="opacity:0"><path class="ex" d="M18 176V108M1490 193V108M1490 176H1580M1538 1062H1580"/><path class="dm" pathLength="1" style="stroke-dasharray:1 1" d="M18 126H1490"/><path class="dm" pathLength="1" style="stroke-dasharray:1 1" d="M1560 176V1062"/>
   <path class="dm" d="${tk(18,126)}${tk(1490,126)}${tk(1560,176)}${tk(1560,1062)}"/>${lb(754,126,'≈ 4 020')}${lb(1560,620,'≈ 2 400',1)}</g>`;
  const soL=$$('#soL path'),soD=$('#soD'),dms=$$('#soD path[pathLength]');
  function fitSo(){const k=1600/Math.max(1,st.clientWidth);so.style.setProperty('--fs',(11.5*k).toFixed(1)+'px');$$('#setout .lb').forEach(g=>{const tx=g.querySelector('text'),b=tx.getBBox(),r=g.querySelector('rect'),p=b.height*.5;r.setAttribute('x',b.x-p*1.3);r.setAttribute('y',b.y-p*.5);r.setAttribute('width',b.width+p*2.6);r.setAttribute('height',b.height+p);r.setAttribute('rx',(b.height+p)/2)})}
  addEventListener('resize',()=>{try{fitSo()}catch(e){}});setTimeout(()=>{try{fitSo()}catch(e){}},300);
  function overlay(v){const a=c01(v/.075);soL.forEach((p,i)=>p.style.strokeDashoffset=1-ez(c01(a*1.45-i*.15)));const b=ez(c01((v-.015)/.06));dms.forEach(p=>p.style.strokeDashoffset=1-b);soD.style.opacity=c01(b*2);so.style.opacity=1-ez(c01((v-.15)/.14))}
  function prog(){const r=sec.getBoundingClientRect();return c01(-r.top/(r.height-innerHeight))}
  let target=0,cur=-1,lastI=-1,shownCo=-1;
  addEventListener('scroll',()=>{target=c01(prog()/.95)},{passive:true});target=c01(prog()/.95);
  function render(v){A.forEach(a=>style(a,v));
    lit.style.opacity=ez(c01((v-.905)/.075));
    const cam=ez(v),sc=1.085-.085*cam,tx=(1-cam)*-1.2,ty=(1-cam)*-1.5;scene.style.transform=`scale(${sc.toFixed(4)}) translate3d(${tx.toFixed(3)}%,${ty.toFixed(3)}%,0)`;
    overlay(v);
    let i=0;for(let k=1;k<8;k++)if(v>=B[k])i=k;const nx=i<7?B[i+1]:1,t=c01((v-B[i])/(nx-B[i]));
    if(i!==lastI){lastI=i;lis.forEach((l,k)=>{l.classList.toggle('on',k===i);l.classList.toggle('past',k<i)})}
    bar.style.transform=`scaleX(${v.toFixed(4)})`;pct.textContent=Math.round(v*100)+'%';
    const end=v>=.985;st.classList.toggle('end',end);tag.textContent=end?'Finished · real photo':'Building · '+String(i+1).padStart(2,'0')+' of 08';
    const c=CO[i],show=!end&&t>.3&&t<.97;co.style.left=(52+(c[0]-52)*sc+tx*sc).toFixed(2)+'%';co.style.top=(62+(c[1]-62)*sc+ty*sc).toFixed(2)+'%';if(shownCo!==i){shownCo=i;coT.textContent=c[2];co.classList.remove('l');const sw=st.clientWidth;co.classList.toggle('m',sw<600);st.classList.toggle('sm',sw<600);if(sw>=600&&c[0]/100*sw+co.offsetWidth>sw-14)co.classList.add('l')}co.classList.toggle('on',show)}
  (function loop(){requestAnimationFrame(loop);if(cur<0)cur=target;const d=target-cur;if(Math.abs(d)<.00025){if(cur===target)return;cur=target}else cur+=d*.085;render(cur)})();
  render(target);
})();

/* ---------- EXPLORE viewer ---------- */
const HS=[
 {id:'drawers',x:49,y:81,l:'Base units',t:'Handleless, soft-close drawers',d:'Seven deep drawers on full-extension runners. No handles, just push to open. A damper catches each one and closes it silently.',s:[['Fronts','Spray painted, handleless'],['Runners','Full extension, soft close'],['Inside','Oak-effect drawer boxes']],m:'drawerV',z:2.4},
 {id:'top',x:80,y:72.5,l:'Worktop',t:'One run of solid oak',d:'A single continuous oak top runs the full width of the wall, tying the towers and base together.',s:[['Material','Solid oak'],['Finish','Hard-wax oil, wipeable'],['Run','Wall to wall']],m:'p03d',z:2.4},
 {id:'panel',x:37.5,y:66,l:'Centre panel',t:'Fluted solid oak',d:'Vertical oak flutes behind the TV give the wall its depth. The bracket and cabling are planned in behind, so nothing shows.',s:[['Material','Solid oak flutes'],['Behind','TV bracket and cabling'],['Look','Grain matched across the panel']],m:'slats',z:2.6},
 {id:'tv',x:49,y:46,l:'Media',t:'No cables, anywhere',d:'Sockets, HDMI and power were planned into the drawing so the TV floats on the panel with nothing hanging down.',s:[['Cabling','Hidden behind the panel'],['Bracket','Fixed through to the wall'],['Soundbar','Sits on the oak top']],m:'p303',z:2.2},
 {id:'shelves',x:14,y:44,l:'Shelving',t:'Oak shelves, lit from below',d:'Floating solid oak shelves with warm LED set into the underside of each one. Switch the lights below to see the difference.',s:[['Shelves','Solid oak, floating'],['Light','Warm white LED'],['Wiring','Hidden in the build']],m:'led',z:2.6},
 {id:'scribe',x:90,y:17,l:'Fit',t:'Scribed to the ceiling',d:'Walls and ceilings are never perfectly straight. Every tower is scribed on site so it meets the ceiling with no gap.',s:[['Towers','Sprayed MDF'],['Fit','Scribed on site'],['Finish','Caulked and painted']],m:'p5f0',z:2.6}];
(function(){const vw=$('#viewer'),w=$('#world'),hw=$('#hsWrap'),panel=$('#panel'),zl=$('#zl'),hint=$('#hint'),miniR=$('#miniR');
  let s=1,tx=0,ty=0,S=1,TX=0,TY=0,raf=0,cur=-1;
  hw.innerHTML=HS.map((h,i)=>`<button class="hs" data-i="${i}" style="left:${h.x}%;top:${h.y}%"><span>${h.t}</span></button>`).join('');
  $('#hsl').innerHTML=HS.map((h,i)=>`<button data-i="${i}">${h.t}</button>`).join('');
  function W(){return vw.clientWidth}function H(){return vw.clientHeight}
  function bound(){const mw=W()*(S-1),mh=H()*(S-1);TX=clamp(TX,-mw,0);TY=clamp(TY,-mh,0)}
  function anim(){cancelAnimationFrame(raf);(function f(){s+=(S-s)*.14;tx+=(TX-tx)*.14;ty+=(TY-ty)*.14;w.style.transform=`translate(${tx}px,${ty}px) scale(${s})`;zl.textContent=s.toFixed(1)+'×';vw.classList.toggle('z',s>1.05);
      miniR.style.left=(-tx/(W()*s)*100)+'%';miniR.style.top=(-ty/(H()*s)*100)+'%';miniR.style.width=(100/s)+'%';miniR.style.height=(100/s)+'%';
      $$('.hs').forEach(h=>h.style.transform=`scale(${1/s})`);
      if(Math.abs(S-s)>.001||Math.abs(TX-tx)>.3||Math.abs(TY-ty)>.3)raf=requestAnimationFrame(f)})()}
  function zoomAt(ns,cx,cy){ns=clamp(ns,1,5);const wx=(cx-TX)/S,wy=(cy-TY)/S;S=ns;TX=cx-wx*S;TY=cy-wy*S;bound();anim()}
  function focus(px,py,z){S=z;const W0=W(),H0=H();const panelW=W0>700&&panel.classList.contains('on')?Math.min(380,W0-32)+16:0;const cx=(W0-panelW)/2,cy=W0>700?H0/2:H0*.22;TX=cx-px/100*W0*S;TY=cy-py/100*H0*S;bound();anim()}
  vw.addEventListener('touchstart',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});
  vw.addEventListener('wheel',e=>{e.preventDefault();hint.style.opacity=0;const r=vw.getBoundingClientRect();zoomAt(S*Math.exp(-e.deltaY*.0018),e.clientX-r.left,e.clientY-r.top)},{passive:false});
  const pts=new Map();let lastD=0,moved=false;
  vw.addEventListener('pointerdown',e=>{if(e.target.closest('.tools,.panel,.hs,.baH'))return;vw.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;vw.classList.add('drag');if(pts.size===2){const [a,b]=[...pts.values()];lastD=Math.hypot(a.x-b.x,a.y-b.y)}});
  vw.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const p=pts.get(e.pointerId);const dx=e.clientX-p.x,dy=e.clientY-p.y;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){if(Math.abs(dx)+Math.abs(dy)>1)moved=true;TX+=dx;TY+=dy;bound();tx=TX;ty=TY;w.style.transform=`translate(${tx}px,${ty}px) scale(${s})`;miniR.style.left=(-tx/(W()*s)*100)+'%';miniR.style.top=(-ty/(H()*s)*100)+'%';hint.style.opacity=0}
    else if(pts.size===2){const [a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const r=vw.getBoundingClientRect();if(lastD)zoomAt(S*d/lastD,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);lastD=d;moved=true}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)lastD=0;if(!pts.size)vw.classList.remove('drag')};
  vw.addEventListener('pointerup',up);vw.addEventListener('pointercancel',up);
  vw.addEventListener('dblclick',e=>{if(e.target.closest('.tools,.panel'))return;const r=vw.getBoundingClientRect();zoomAt(S>1.5?1:2.4,e.clientX-r.left,e.clientY-r.top)});
  $('#zIn').onclick=()=>zoomAt(S*1.5,W()/2,H()/2);$('#zOut').onclick=()=>zoomAt(S/1.5,W()/2,H()/2);
  $('#zRe').onclick=()=>{close();S=1;TX=TY=0;anim()};
  function media(k){if(!k)return'';if(k==='drawerV')return`<video src="${URLS.drawerV}" muted autoplay loop playsinline></video>`;return`<img src="${URLS[k]}" alt="">`}
  function open(i){cur=i;const h=HS[i];$('#pl').textContent=String(i+1).padStart(2,'0')+' / '+String(HS.length).padStart(2,'0')+' · '+h.l;$('#pt').textContent=h.t;$('#pd').textContent=h.d;$('#ps').innerHTML=h.s.map(x=>`<li><span>${x[0]}</span>${x[1]}</li>`).join('');$('#pm').innerHTML=media(h.m);
    panel.classList.add('on');$$('.hs').forEach((b,k)=>b.classList.toggle('on',k===i));$$('#hsl button').forEach((b,k)=>b.classList.toggle('on',k===i));hint.style.opacity=0;
    setBA(false);setMeas(false);if(h.id==='shelves')setLight(true);focus(h.x,h.y,h.z)}
  function close(){panel.classList.remove('on');$$('.hs,#hsl button').forEach(b=>b.classList.remove('on'));cur=-1}
  hw.addEventListener('click',e=>{const b=e.target.closest('.hs');if(b&&!moved)open(+b.dataset.i)});
  $('#hsl').addEventListener('click',e=>{const b=e.target.closest('button');if(b){open(+b.dataset.i);vw.scrollIntoView({behavior:'smooth',block:'center'})}});
  $('#px').onclick=()=>{close();S=1;TX=TY=0;anim()};$('#pn').onclick=()=>open((cur+1)%HS.length);$('#pp').onclick=()=>open((cur-1+HS.length)%HS.length);
  // lights
  let lightsOn=true;function setLight(on){lightsOn=on;vw.classList.toggle('dark',!on);$('#tLight').classList.toggle('on',on)}
  $('#tLight').onclick=()=>setLight(!lightsOn);
  // measure: traced elevation drawing + dimension chains (approximate, scaled from the photo)
  const yT=x=>907-.011*x,yB=x=>1042-.0194*x;
  const LN=[ // [points, class]
    [[[2,176],[1490,193]],''],[[[22,194],[437,198],[437,846],[22,846],[22,194]],''],[[[452,199],[1092,201],[1092,350],[452,350],[452,199]],''],[[[1105,201],[1476,203],[1476,834],[1105,834],[1105,201]],''],
    [[[1490,193],[1490,834]],''],[[[95,228],[95,846]],'f'],[[[22,194],[95,228],[435,228]],'f'],[[[1418,232],[1418,834]],'f'],[[[1476,203],[1418,232],[1107,232]],'f'],[[[452,199],[475,235],[1065,235],[1092,201]],'f'],
    ...[[30,344,437,385],[32,518,437,541],[35,688,438,712],[1105,352,1475,387],[1105,518,1476,540],[1107,680,1477,700],[450,350,1092,370],[453,370,1080,855]].map(r=>[[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]],[r[0],r[1]]],'']),
    [[[0,846],[437,846]],'f'],[[[1108,832],[1422,830],[1552,868]],'f'],[[[0,880],[1552,868],[1552,886],[0,900]],''],
    ...[0,190,417,660,897,1130,1340].map((x,j,A)=>{const x1=[190,417,660,897,1130,1340,1550][j],a=x+(j?3:0),b=x1-3;return[[[a,yT(a)],[b,yT(b)],[b,yB(b)],[a,yB(a)],[a,yT(a)]],'']}),
    [[[0,1080],[1537,1062],[1537,1021]],'']];
  const fl=[];for(let x=466;x<1076;x+=13.7)fl.push(`M${x.toFixed(1)} 372V853`);
  const tick=(x,y)=>`M${x-8} ${y+8}L${x+8} ${y-8}`;
  const hz=(x0,x1,y)=>`M${x0} ${y}H${x1}`,vt=(y0,y1,x)=>`M${x} ${y0}V${y1}`;
  // [path, ticks, label x, label y, text, vertical]
  const DM=[
    [hz(18,1490,92),[[18,92],[1490,92]],754,92,'≈ 4 020'],
    [hz(18,1490,140),[[18,140],[446,140],[1100,140],[1490,140]],232,140,'1 100'],[null,[],773,140,'1 820'],[null,[],1295,140,'1 100'],
    [vt(176,1062,1572),[[1572,176],[1572,1062]],1572,560,'≈ 2 400',1],
    [vt(193,868,1528),[[1528,193],[1528,868],[1528,1062]],1528,520,'1 880',1],[vt(868,1062,1528),[],1528,965,'520',1],
    [vt(228,846,300),[[300,228],[300,344],[300,518],[300,688],[300,846]],300,286,'320',1],[null,[],300,431,'465',1],[null,[],300,603,'465',1],[null,[],300,767,'430',1],
    [hz(453,1080,318),[[453,318],[1080,318]],766,318,'1 720'],
    [hz(196,412,968),[[196,968],[412,968]],304,968,'575']];
  const EX=`M18 172V80M1490 189V80M1490 176H1590M1537 1062H1590M1476 193H1540M1552 868H1540M453 346V306M1080 346V306`;
  function drawMeas(){let s='',d=0;
    s+=LN.map(l=>`<path class="ln ${l[1]}" pathLength="1" style="transition-delay:${(d+=.025).toFixed(3)}s" d="M${l[0].map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')}"/>`).join('');
    s+=`<path class="ln f d" style="transition-delay:.5s" d="${fl.join('')}"/><rect class="ln d" x="505" y="420" width="538" height="307" style="stroke-dasharray:6 6;transition-delay:.6s"/>`;
    s+=`<path class="ex" pathLength="1" style="transition-delay:.7s" d="${EX}"/>`;
    const MN=[1,2,3,5,6,7,8,9,10,12];DM.forEach((m,i)=>{const dl=(.8+i*.06).toFixed(2),mn=MN.includes(i)?' mn':'';if(m[0])s+=`<path class="dm${mn}" pathLength="1" style="transition-delay:${dl}s" d="${m[0]}"/>`;if(m[1].length)s+=`<path class="dm${mn}" style="stroke-dasharray:none" d="${m[1].map(p=>tick(p[0],p[1])).join('')}"/>`;
      s+=`<g class="lb${mn}" style="transition-delay:${(+dl+.4).toFixed(2)}s" transform="translate(${m[2]} ${m[3]})${m[5]?' rotate(-90)':''}"><rect/><text text-anchor="middle" y="5.5">${m[4]}</text></g>`});
    $('#meas').innerHTML=s;fitLabels()}
  function fitLabels(){vw.classList.toggle('sm',vw.clientWidth<600);$('#meas').style.setProperty('--fs',((vw.clientWidth<600?10:11.5)*1600/Math.max(1,vw.clientWidth)).toFixed(1)+'px');$$('#meas .lb').forEach(g=>{const t=g.querySelector('text'),b=t.getBBox(),r=g.querySelector('rect');const px=b.height*.55;r.setAttribute('x',b.x-px);r.setAttribute('y',b.y-px*.45);r.setAttribute('width',b.width+px*2);r.setAttribute('height',b.height+px*.9);r.setAttribute('rx',(b.height+px*.9)/2)})}
  drawMeas();addEventListener('resize',()=>{clearTimeout(fitLabels.t);fitLabels.t=setTimeout(fitLabels,200)});
  function setMeas(on){vw.classList.toggle('ms',on);if(on){hint.style.opacity=0;requestAnimationFrame(fitLabels)}$('#tMeas').classList.toggle('on',on)}
  $('#tMeas').onclick=()=>{const on=!vw.classList.contains('ms');if(on){close();setBA(false);S=1;TX=TY=0;anim()}setMeas(on)};
  // before/after
  const baH=$('#baH');let ba=50;function setBA(on){vw.classList.toggle('ba',on);$('#tBA').classList.toggle('on',on);if(on){close();setMeas(false);S=1;TX=TY=0;anim();ba=50;applyBA()}}
  function applyBA(){w.style.setProperty('--ba',(100-ba)+'%');baH.style.left=ba+'%'}
  $('#tBA').onclick=()=>setBA(!vw.classList.contains('ba'));
  let bd=false;baH.addEventListener('pointerdown',e=>{bd=true;baH.setPointerCapture(e.pointerId)});baH.addEventListener('pointermove',e=>{if(!bd)return;const r=vw.getBoundingClientRect();ba=clamp((e.clientX-r.left)/r.width*100,2,98);applyBA()});baH.addEventListener('pointerup',()=>bd=false);
  addEventListener('resize',()=>{bound();anim()});
})();


});