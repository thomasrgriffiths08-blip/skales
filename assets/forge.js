/* ============================================================
   The forge — the site builds the visitor a website while they watch.
   Three answers (trade, business name, town) render a real, working single-page
   site into the phone on the page, block by block, in a few seconds.
   Nothing is faked: the markup below is the same shape as the DIRECT-lane builds.
   ============================================================ */
(function(){
  var d = document, S = window.SITE || {}, base = S.base || '', T = window.TRADES || [];
  if (!T.length) return;
  var stage = d.getElementById('forgeScreen'); if (!stage) return;
  var rm = false; try { rm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var esc = function(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var byKey = function(k){ for (var i = 0; i < T.length; i++) if (T[i].key === k) return T[i]; return T[0]; };
  var tint = function(t){ var r = d.documentElement.style;
    r.setProperty('--c', t.c); r.setProperty('--c-ink', t.cInk || '#FFFFFF'); r.setProperty('--c-text', t.cText || t.c); };
  var absBase = function(){ var a = d.createElement('a'); a.href = base || './'; return a.href; };

  /* ---------- the generated site ----------
     Same shape as the DIRECT-lane builds: a logo lockup, a photographic hero, a dark
     credentials band, a numbered service list, a quote over a second crop of the plate,
     the area, a form, and a call bar that never leaves the bottom of the screen. */
  function buildDoc(o){
    var t = o.trade, biz = esc(o.biz), town = esc(o.town), tel = esc(o.tel);
    var fill = function(str){ return esc(String(str).replace(/\{town\}/g, o.town).replace(/\{biz\}/g, o.biz)); };
    var mark = esc(o.biz.trim().charAt(0).toUpperCase() || 'S');
    var plate = base + 'assets/plates/' + t.plate + '.webp';
    var lock = '<span class="lock"><span class="mk">' + mark + '</span><b>' + biz + '</b></span>';
    var svc = t.services.map(function(s, i){
      return '<li><span class="n">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span><div><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p></div></li>';
    }).join('');
    var creds = t.creds.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    var css = [
      ':root{--c:' + t.c + ';--ct:' + (t.cText || t.c) + ';--ink:#141416;--dim:#5F6167;--line:#EAEAE8;--pg:#fff}',
      '*{box-sizing:border-box;margin:0}',
      'body{font:15.5px/1.55 "Schibsted Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--pg);padding-bottom:74px;-webkit-font-smoothing:antialiased}',
      'img{max-width:100%;display:block}a{color:inherit;text-decoration:none}',
      'h1,h2,h3{letter-spacing:-.03em;line-height:1.06;font-weight:600}',
      'html.staged [data-b]{opacity:0;transform:translateY(12px)}',
      'html.staged [data-b].in{opacity:1;transform:none;transition:opacity .5s cubic-bezier(.2,.7,.2,1),transform .5s cubic-bezier(.2,.7,.2,1)}',
      '.lock{display:inline-flex;align-items:center;gap:9px;min-width:0}',
      '.lock .mk{flex:none;width:30px;height:30px;border-radius:9px;background:var(--c);color:#fff;display:grid;place-items:center;font-weight:700;font-size:16px;letter-spacing:-.02em}',
      '.lock b{font-size:16.5px;font-weight:700;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:rgba(255,255,255,.96);border-bottom:1px solid var(--line)}',
      '.bar .tel{font-size:13.5px;font-weight:600;color:var(--ct);white-space:nowrap}',
      '.hero{position:relative;min-height:400px;display:flex;align-items:flex-end;padding:26px 16px 24px;color:#fff;overflow:hidden}',
      '.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}',
      '.hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(8,9,11,.24) 0%,rgba(8,9,11,.52) 46%,rgba(8,9,11,.9) 100%)}',
      '.kick{display:block;font-size:11.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.82);margin-bottom:12px}',
      '.hero h1{font-size:clamp(28px,9vw,38px);margin-bottom:12px;text-wrap:balance}',
      '.hero p{font-size:15px;line-height:1.45;color:rgba(255,255,255,.86);margin-bottom:18px}',
      '.btns{display:grid;gap:9px}',
      '.btn{display:flex;align-items:center;justify-content:center;height:52px;border-radius:14px;font-weight:600;font-size:16px}',
      '.btn.p{background:var(--c);color:#fff}',
      '.hero .btn.p{background:#fff;color:var(--ink)}',
      '.btn.s{background:rgba(255,255,255,.10);color:#fff;border:1px solid rgba(255,255,255,.42)}',
      '.creds{list-style:none;padding:16px;background:var(--ink);color:rgba(255,255,255,.82);display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px}',
      '.creds li{display:flex;align-items:center;gap:7px}',
      '.creds li::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--c);flex:none}',
      'section{padding:32px 16px;border-bottom:1px solid var(--line)}',
      'h2{font-size:clamp(22px,6.4vw,27px);margin-bottom:20px}',
      '.svcs ol{list-style:none;padding:0;margin:0}',
      '.svcs li{display:flex;gap:14px;padding:17px 0;border-top:1px solid var(--line)}',
      '.svcs li:first-child{border-top:0;padding-top:0}',
      '.svcs .n{flex:none;font-size:12px;font-weight:700;color:var(--ct);letter-spacing:.06em;padding-top:3px;font-variant-numeric:tabular-nums}',
      '.svcs h3{font-size:16.5px;margin-bottom:5px}',
      '.svcs p{font-size:14.5px;color:var(--dim);line-height:1.5}',
      '.quote{position:relative;margin:0;padding:44px 20px;color:#fff;overflow:hidden;border-bottom:1px solid var(--line)}',
      '.quote img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 78%;z-index:-2}',
      '.quote::after{content:"";position:absolute;inset:0;z-index:-1;background:rgba(10,11,13,.74)}',
      '.stars{color:#fff;letter-spacing:3px;font-size:14px;margin-bottom:14px}',
      '.quote blockquote{font-size:19px;line-height:1.4;letter-spacing:-.02em;font-weight:500}',
      '.quote figcaption{margin-top:14px;font-size:13.5px;color:rgba(255,255,255,.66)}',
      '.area{background:#F6F6F5}',
      '.area p{font-size:15px;color:var(--dim)}',
      '.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}',
      '.chips span{font-size:13px;font-weight:500;padding:8px 13px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--ink)}',
      '.f{display:grid;gap:10px;margin-top:6px}',
      '.f input,.f textarea{width:100%;font:inherit;font-size:16px;padding:14px 14px;border:1px solid var(--line);border-radius:14px;background:#fff;color:var(--ink)}',
      '.f textarea{min-height:92px;resize:vertical}',
      '.f input:focus,.f textarea:focus{outline:2px solid var(--ink);border-color:transparent}',
      '.f button{height:54px;border:0;border-radius:14px;background:var(--c);color:#fff;font:inherit;font-weight:600;font-size:16px;cursor:pointer}',
      '.sm{font-size:14px;color:var(--dim);margin-bottom:18px}',
      '.sent{padding:18px;border-radius:14px;background:#F6F6F5;font-size:15px;color:var(--dim);line-height:1.5;display:none}',
      'form.done .f{display:none}form.done .sent{display:block}',
      'footer{background:var(--ink);color:rgba(255,255,255,.62);padding:30px 16px 34px;font-size:14px;line-height:1.65;border:0}',
      'footer .lock b{color:#fff}footer .lock{margin-bottom:14px}',
      'footer .by{margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.14);font-size:12.5px;color:rgba(255,255,255,.42)}',
      '.call{position:fixed;left:0;right:0;bottom:0;z-index:6;display:grid;grid-template-columns:1.25fr 1fr;gap:8px;padding:10px 12px;background:rgba(255,255,255,.97);border-top:1px solid var(--line)}',
      '.call .btn{height:52px;font-size:15.5px}.call .btn.s{background:#fff;color:var(--ink);border:1px solid var(--line)}'
    ].join('');
    return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<base href="' + absBase() + '">'
      + '<title>' + biz + ' &mdash; ' + esc(t.label) + ' in ' + town + '</title>'
      + '<meta name="description" content="' + fill(t.sub).slice(0, 150) + '">'
      + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
      + '<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">'
      + '<style>' + css + '</style><script>document.documentElement.className="staged"<\/script></head><body>'
      + '<header class="bar" data-b>' + lock + '<a class="tel" href="#f">' + tel + '</a></header>'
      + '<div class="hero" data-b><img src="' + plate + '" alt="" decoding="async"><div>'
      +   '<span class="kick">' + esc(t.label) + ' &middot; ' + town + '</span>'
      +   '<h1>' + fill(t.head) + '</h1><p>' + fill(t.sub) + '</p>'
      +   '<div class="btns"><a class="btn p" href="#f">' + esc(t.cta) + '</a><a class="btn s" href="#f">Call ' + tel + '</a></div></div></div>'
      + '<ul class="creds" data-b>' + creds + '</ul>'
      + '<section class="svcs" data-b><h2>What we do</h2><ol>' + svc + '</ol></section>'
      + '<figure class="quote" data-b><img src="' + plate + '" alt="" decoding="async">'
      +   '<div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>'
      +   '<blockquote>&ldquo;' + esc(t.review[0]) + '&rdquo;</blockquote>'
      +   '<figcaption>' + esc(t.review[1]) + ' &middot; ' + town + '</figcaption></figure>'
      + '<section class="area" data-b><h2>Where we work</h2><p>Covering ' + town + ' and roughly twelve miles around it. Not sure if that is you? Ring and ask &mdash; if we do not cover you, we will tell you who does.</p>'
      +   '<div class="chips"><span>' + town + '</span><span>&plus; 12 miles</span></div></section>'
      + '<section data-b id="f"><h2>Tell us what is up</h2><p class="sm">Three things and we will come back to you. However late it is.</p>'
      +   '<form onsubmit="event.preventDefault();this.className=\'done\'">'
      +   '<div class="f"><input placeholder="Your name" aria-label="Your name"><input placeholder="Mobile number" inputmode="tel" aria-label="Mobile number"><textarea placeholder="What needs doing?" aria-label="What needs doing"></textarea><button type="submit">' + esc(t.cta) + '</button></div>'
      +   '<div class="sent">Thanks &mdash; that would land on the phone of whoever is on call, and they would text you straight back. This is a demonstration, so nothing was actually sent.</div></form></section>'
      + '<footer data-b>' + lock + '<p>' + esc(t.label) + ' in ' + town + '<br>' + tel + '<br>Open 8am&ndash;6pm, and the phone still gets answered after that.</p>'
      +   '<p class="by">A demonstration page. Built by Skales.</p></footer>'
      + '<nav class="call" data-b><a class="btn p" href="#f">Call ' + tel + '</a><a class="btn s" href="#f">' + esc(t.cta) + '</a></nav>'
      + '<script>(function(){var b=document.querySelectorAll("[data-b]"),rm=false;try{rm=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}'
      + 'var step=rm?90:230,n=b.length;for(var i=0;i<n;i++)(function(el,i){setTimeout(function(){el.classList.add("in");'
      + 'if(i===n-1&&parent!==window)try{parent.postMessage("forge:done","*")}catch(e){}},110+i*step)})(b[i],i);'
      + 'setTimeout(function(){for(var i=0;i<n;i++)b[i].classList.add("in")},5000)})();<\/script>'
      + '</body></html>';
  }

  /* ---------- the empty site: the shape of a page with nobody's name on it ----------
     The phone must never show another business's brand on arrival — a visitor would think
     they had landed on the wrong site. So it starts as a blank page waiting to be filled,
     picks up the photograph and the colour when a trade is chosen, and only carries a real
     name once the visitor has given one. */
  function blankDoc(t){
    var c = t ? t.c : '#C9C9C6';
    var bar = function(w, h, o){ return '<i class="b" style="width:' + w + ';height:' + (h || 11) + 'px' + (o ? ';opacity:' + o : '') + '"></i>'; };
    var svc = '';
    for (var i = 0; i < 4; i++) svc += '<div class="row" data-b>' + bar([46, 38, 52, 42][i] + '%', 13) + bar('92%', 9, .5) + bar([70, 84, 62, 78][i] + '%', 9, .5) + '</div>';
    return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<title>Your site appears here</title><style>'
      + ':root{--c:' + c + ';--l:#E7E7E5;--s:#DCDCD9}'
      + '*{box-sizing:border-box;margin:0}body{background:#fff;padding-bottom:70px;font:16px system-ui,sans-serif}'
      + 'i.b{display:block;background:var(--s);border-radius:5px;margin-bottom:7px}'
      + 'html.staged [data-b]{opacity:0;transform:translateY(12px)}'
      + 'html.staged [data-b].in{opacity:1;transform:none;transition:opacity .5s cubic-bezier(.2,.7,.2,1),transform .5s cubic-bezier(.2,.7,.2,1)}'
      + '.bar{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--l)}'
      + '.hero{position:relative;min-height:300px;display:flex;flex-direction:column;justify-content:flex-end;padding:22px 16px;overflow:hidden;background:#EDEDEA}'
      + '.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}'
      + '.hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(10,11,13,.28),rgba(10,11,13,.82))}'
      + '.hero i.b{background:rgba(255,255,255,.62)}'
      + '.btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}'
      + '.btns span{height:46px;border-radius:11px;background:var(--c);opacity:.92}'
      + '.btns span+span{background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.5)}'
      + '.creds{display:flex;gap:14px;padding:15px 16px;border-bottom:1px solid var(--l)}'
      + '.creds i.b{margin:0}'
      + 'section{padding:24px 16px;border-bottom:1px solid var(--l)}'
      + '.row{padding:14px 0;border-top:1px solid var(--l)}.row:first-of-type{border-top:0;padding-top:0}'
      + '.call{position:fixed;left:0;right:0;bottom:0;display:grid;grid-template-columns:1.2fr 1fr;gap:8px;padding:9px 12px;background:#fff;border-top:1px solid var(--l)}'
      + '.call span{height:48px;border-radius:11px;background:var(--c);opacity:.92}.call span+span{background:#fff;border:1px solid var(--l)}'
      + '</style><script>document.documentElement.className="staged"<\/script></head><body>'
      + '<header class="bar" data-b>' + bar('44%', 14) + bar('26%', 11, .6) + '</header>'
      + '<div class="hero" data-b>' + (t ? '<img src="' + base + 'assets/plates/' + t.plate + '.webp" alt="" decoding="async">' : '')
      +   bar('40%', 10, .8) + bar('86%', 26) + bar('58%', 26) + bar('94%', 9, .7) + bar('72%', 9, .7)
      +   '<div class="btns"><span></span><span></span></div></div>'
      + '<div class="creds" data-b>' + bar('30%', 9, .55) + bar('34%', 9, .55) + bar('26%', 9, .55) + '</div>'
      + '<section data-b>' + bar('42%', 17) + '<div style="height:10px"></div>' + svc + '</section>'
      + '<section data-b style="background:#F5F5F4">' + bar('38%', 17) + '<div style="height:10px"></div>' + bar('94%', 9, .6) + bar('66%', 9, .6) + '</section>'
      + '<section data-b>' + bar('50%', 17) + '<div style="height:10px"></div>' + bar('90%', 9, .6) + bar('80%', 9, .6) + bar('34%', 9, .4) + '</section>'
      + '<nav class="call" data-b><span></span><span></span></nav>'
      + '<script>(function(){var b=document.querySelectorAll("[data-b]"),rm=false;try{rm=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}'
      + 'var step=rm?70:170,n=b.length;for(var i=0;i<n;i++)(function(el,i){setTimeout(function(){el.classList.add("in")},90+i*step)})(b[i],i);'
      + 'setTimeout(function(){for(var i=0;i<n;i++)b[i].classList.add("in")},4000)})();<\/script>'
      + '</body></html>';
  }

  /* ---------- the control panel ---------- */
  var chips = d.getElementById('forgeTrades'), fBiz = d.getElementById('forgeBiz'), fTown = d.getElementById('forgeTown'),
      go = d.getElementById('forgeGo'), cap = d.getElementById('forgeCap'), timer = d.getElementById('forgeTimer'),
      after = d.getElementById('forgeAfter'), openBtn = d.getElementById('forgeOpen'), demoLink = d.getElementById('forgeDemo'),
      need = d.getElementById('forgeNeed'), hint = d.getElementById('tapHint'), guard = d.getElementById('forgeGuard');
  var picked = null, t0 = 0, tick = null, lastDoc = '', blobUrl = null, built = false;

  function say(msg){ if (!need) return; need.textContent = msg || ''; need.hidden = !msg; }
  function frame(){
    var f = stage.querySelector('iframe');
    if (!f){ f = d.createElement('iframe'); stage.appendChild(f); }
    return f;
  }
  function capState(a, b2){ if (cap) cap.innerHTML = '<b>' + esc(a) + '</b>' + (b2 ? '<span>' + esc(b2) + '</span>' : ''); }

  /* the phone before it is anybody's: the shape of a page, waiting */
  function showBlank(t){
    built = false;
    var f = frame();
    f.setAttribute('title', t ? 'An empty ' + t.label.toLowerCase() + ' page, waiting for your name' : 'An empty page, waiting for your trade');
    f.srcdoc = blankDoc(t);
    if (after) after.hidden = true;
    if (timer){ clearInterval(tick); timer.hidden = true; }
    capState('Your site appears here', t ? t.label + ' — now put a name in' : 'Pick what you do, and it starts filling in');
    if (t) tint(t);
  }

  if (chips){
    chips.innerHTML = T.map(function(x){ return '<button type="button" role="tab" data-k="' + x.key + '" aria-selected="false">' + esc(x.label) + '</button>'; }).join('');
    chips.addEventListener('click', function(e){
      var b = e.target.closest('button[data-k]'); if (!b) return;
      picked = byKey(b.getAttribute('data-k'));
      chips.querySelectorAll('button').forEach(function(o){ o.setAttribute('aria-selected', String(o === b)); });
      say('');
      if (!built || !(fBiz && fBiz.value.trim())) showBlank(picked); else go.click();
    });
  }

  function telFor(town){
    /* a plausible, unallocated UK number: Ofcom reserves 07700 900000–900999 for drama */
    var n = 0; for (var i = 0; i < town.length; i++) n = (n * 31 + town.charCodeAt(i)) % 1000;
    return '07700 900' + String(n).padStart(3, '0');
  }
  function build(o){
    var doc = buildDoc(o); lastDoc = doc; built = true;
    var f = frame(); f.setAttribute('title', o.biz + ' — a website built on this page'); f.srcdoc = doc;
    capState(o.biz, o.trade.label + ' · ' + o.town);
    if (after) after.hidden = true;
    if (timer){ t0 = Date.now(); clearInterval(tick); timer.hidden = false;
      tick = setInterval(function(){ timer.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's'; }, 100); }
    tint(o.trade);
    if (demoLink){ var bd = (window.BUILDS || []).filter(function(x){ return x.n === o.trade.demo; })[0];
      if (bd){ demoLink.href = base + 'work/' + bd.slug + '/'; demoLink.textContent = 'See the real system a ' + o.trade.word + ' runs on it'; demoLink.hidden = false; } else demoLink.hidden = true; }
    if (blobUrl){ URL.revokeObjectURL(blobUrl); blobUrl = null; }
  }
  window.addEventListener('message', function(e){
    if (e.data !== 'forge:done' || !built) return;
    clearInterval(tick);
    if (timer) timer.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's';
    if (after) after.hidden = false;
  });

  if (go) go.addEventListener('click', function(){
    if (!picked){ say('Pick what you do first.'); if (chips) chips.querySelector('button').focus(); return; }
    var biz = (fBiz && fBiz.value || '').trim().slice(0, 34);
    if (!biz){ say('Give it a name and it will build.'); if (fBiz) fBiz.focus(); return; }
    say('');
    var town = (fTown && fTown.value || '').trim().slice(0, 22) || 'your area';
    build({ trade: picked, biz: biz, town: town, tel: telFor(town) });
    var ph = d.getElementById('forgePhone');
    if (ph && ph.scrollIntoView && window.innerWidth < 900) ph.scrollIntoView({ block: 'center', behavior: rm ? 'auto' : 'smooth' });
  });
  [fBiz, fTown].forEach(function(el){ if (el) el.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); go.click(); } }); });

  if (guard) guard.addEventListener('click', function(){ guard.hidden = true; if (hint) hint.hidden = true; });

  if (openBtn) openBtn.addEventListener('click', function(){
    if (!lastDoc) return;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(new Blob([lastDoc], { type: 'text/html' }));
    window.open(blobUrl, '_blank', 'noopener');
  });

  /* first paint: nobody's site. Just the shape of one, drawing itself in. */
  showBlank(null);
})();
