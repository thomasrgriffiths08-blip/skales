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

  /* ---------- the generated site ---------- */
  function buildDoc(o){
    var t = o.trade, biz = esc(o.biz), town = esc(o.town), tel = esc(o.tel), c = t.c;
    var fill = function(str){ return esc(String(str).replace(/\{town\}/g, o.town).replace(/\{biz\}/g, o.biz)); };
    var head = fill(t.head), sub = fill(t.sub);
    var svc = t.services.map(function(s, i){
      return '<article data-b class="svc"><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p></article>';
    }).join('');
    var creds = t.creds.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<base href="' + absBase() + '">'
      + '<title>' + biz + ' — ' + esc(t.label) + ' in ' + town + '</title>'
      + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
      + '<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">'
      + '<style>'
      + ':root{--c:' + c + ';--ink:#15161A;--dim:#61646B;--line:#E7E7E5;--pg:#fff}'
      + '*{box-sizing:border-box;margin:0}'
      + 'body{font:16px/1.5 "Schibsted Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--pg);padding-bottom:72px;-webkit-font-smoothing:antialiased}'
      + 'img{max-width:100%;display:block}'
      + 'a{color:inherit;text-decoration:none}'
      + 'h1,h2,h3{letter-spacing:-.025em;line-height:1.1;font-weight:600}'
      + 'html.staged [data-b]{opacity:0;transform:translateY(12px)}'
      + 'html.staged [data-b].in{opacity:1;transform:none;transition:opacity .5s cubic-bezier(.2,.7,.2,1),transform .5s cubic-bezier(.2,.7,.2,1)}'
      + '.bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:rgba(255,255,255,.95);border-bottom:1px solid var(--line)}'
      + '.bar b{font-size:17px;letter-spacing:-.03em;font-weight:700}'
      + '.bar a{font-size:13px;font-weight:600;color:var(--c);white-space:nowrap}'
      + '.hero{position:relative;min-height:330px;display:flex;flex-direction:column;justify-content:flex-end;padding:24px 16px 22px;color:#fff;overflow:hidden}'
      + '.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}'
      + '.hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(10,11,13,.30) 0%,rgba(10,11,13,.55) 48%,rgba(10,11,13,.88) 100%)}'
      + '.kick{font-size:12px;font-weight:600;letter-spacing:.10em;text-transform:uppercase;opacity:.85;margin-bottom:10px}'
      + '.hero h1{font-size:30px;margin-bottom:10px;text-wrap:balance}'
      + '.hero p{font-size:14.5px;line-height:1.45;opacity:.9;margin-bottom:16px}'
      + '.btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
      + '.btn{display:flex;align-items:center;justify-content:center;height:46px;border-radius:11px;font-weight:600;font-size:15px}'
      + '.btn.p{background:var(--c);color:#fff}'
      + '.btn.s{background:rgba(255,255,255,.13);color:#fff;border:1px solid rgba(255,255,255,.45);backdrop-filter:none}'
      + '.creds{display:flex;gap:14px;flex-wrap:wrap;list-style:none;padding:14px 16px;border-bottom:1px solid var(--line);font-size:12.5px;color:var(--dim)}'
      + '.creds li{display:flex;align-items:center;gap:6px}'
      + '.creds li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--c);flex:none}'
      + 'section{padding:26px 16px;border-bottom:1px solid var(--line)}'
      + 'h2{font-size:22px;margin-bottom:14px}'
      + '.svc{padding:14px 0;border-top:1px solid var(--line)}'
      + '.svc:first-of-type{border-top:0;padding-top:0}'
      + '.svc h3{font-size:16px;margin-bottom:4px}'
      + '.svc p{font-size:14px;color:var(--dim);line-height:1.45}'
      + '.area{background:#F5F5F4}'
      + '.area p{font-size:14.5px;color:var(--dim);margin-top:8px}'
      + '.rev{font-size:17px;line-height:1.45;letter-spacing:-.01em}'
      + '.rev+.who{margin-top:10px;font-size:13px;color:var(--dim)}'
      + '.stars{color:var(--c);letter-spacing:2px;margin-bottom:12px;font-size:14px}'
      + '.f{display:grid;gap:10px;margin-top:14px}'
      + '.f input,.f textarea{width:100%;font:inherit;font-size:15px;padding:13px 12px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--ink)}'
      + '.f textarea{min-height:84px;resize:vertical}'
      + '.f button{height:50px;border:0;border-radius:11px;background:var(--ink);color:#fff;font:inherit;font-weight:600;font-size:15px;cursor:pointer}'
      + '.sent{padding:14px;border-radius:11px;background:#F5F5F4;font-size:14.5px;color:var(--dim);display:none}'
      + 'form.done .f{display:none}form.done .sent{display:block}'
      + 'footer{padding:24px 16px 30px;color:var(--dim);font-size:13px;line-height:1.6}'
      + 'footer b{color:var(--ink);font-size:15px;display:block;margin-bottom:6px}'
      + '.call{position:fixed;left:0;right:0;bottom:0;z-index:6;display:grid;grid-template-columns:1.2fr 1fr;gap:8px;padding:9px 12px;background:rgba(255,255,255,.96);border-top:1px solid var(--line)}'
      + '.call .btn{height:48px}.call .btn.s{background:#fff;color:var(--ink);border:1px solid var(--line)}'
      + '</style><script>document.documentElement.className="staged"<\/script></head><body>'
      + '<header class="bar" data-b><b>' + biz + '</b><a href="#f">' + tel + '</a></header>'
      + '<div class="hero" data-b><img src="' + base + 'assets/plates/' + t.plate + '.webp" alt="" decoding="async">'
      +   '<span class="kick">' + esc(t.label) + ' &middot; ' + town + '</span>'
      +   '<h1>' + head + '</h1><p>' + sub + '</p>'
      +   '<div class="btns"><a class="btn p" href="#f">' + esc(t.cta) + '</a><a class="btn s" href="#f">Call ' + tel + '</a></div></div>'
      + '<ul class="creds" data-b>' + creds + '</ul>'
      + '<section data-b><h2>What we do</h2>' + svc + '</section>'
      + '<section class="area" data-b><h2>Where we work</h2><p>Covering <b>' + town + '</b> and roughly twelve miles around it. If you are not sure, ring and ask &mdash; if we do not cover you we will tell you who does.</p></section>'
      + '<section data-b><div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p class="rev">&ldquo;' + esc(t.review[0]) + '&rdquo;</p><p class="who">' + esc(t.review[1]) + ' &middot; ' + town + '</p></section>'
      + '<section data-b id="f"><h2>Tell us what is up</h2><form onsubmit="event.preventDefault();this.className=\'done\'">'
      +   '<div class="f"><input placeholder="Your name" aria-label="Your name"><input placeholder="Mobile number" inputmode="tel" aria-label="Mobile number"><textarea placeholder="What needs doing?" aria-label="What needs doing"></textarea><button type="submit">' + esc(t.cta) + '</button></div>'
      +   '<div class="sent">Thanks &mdash; that would land on the phone of whoever is on call, and they would text you straight back. This is a demonstration, so nothing was actually sent.</div></form></section>'
      + '<footer data-b><b>' + biz + '</b>' + esc(t.label) + ' in ' + town + '<br>' + tel + '<br>Open 8am&ndash;6pm, and the phone still gets answered after that.</footer>'
      + '<nav class="call" data-b><a class="btn p" href="#f">Call ' + tel + '</a><a class="btn s" href="#f">' + esc(t.cta) + '</a></nav>'
      + '<script>(function(){var b=document.querySelectorAll("[data-b]"),rm=false;try{rm=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}'
      + 'var step=rm?90:230,n=b.length;for(var i=0;i<n;i++)(function(el,i){setTimeout(function(){el.classList.add("in");'
      + 'if(i===n-1&&parent!==window)try{parent.postMessage("forge:done","*")}catch(e){}},110+i*step)})(b[i],i);'
      + 'setTimeout(function(){for(var i=0;i<n;i++)b[i].classList.add("in")},5000)})();<\/script>'
      + '</body></html>';
  }

  /* ---------- the control panel ---------- */
  var chips = d.getElementById('forgeTrades'), fBiz = d.getElementById('forgeBiz'), fTown = d.getElementById('forgeTown'),
      go = d.getElementById('forgeGo'), cap = d.getElementById('forgeCap'), timer = d.getElementById('forgeTimer'),
      after = d.getElementById('forgeAfter'), openBtn = d.getElementById('forgeOpen'), demoLink = d.getElementById('forgeDemo');
  var picked = T[0], t0 = 0, tick = null, lastDoc = '', blobUrl = null;

  if (chips){
    chips.innerHTML = T.map(function(x, i){ return '<button type="button" role="tab" data-k="' + x.key + '" aria-selected="' + (i === 0) + '">' + esc(x.label) + '</button>'; }).join('');
    chips.addEventListener('click', function(e){
      var b = e.target.closest('button[data-k]'); if (!b) return;
      picked = byKey(b.getAttribute('data-k'));
      chips.querySelectorAll('button').forEach(function(o){ o.setAttribute('aria-selected', String(o === b)); });
      tint(picked);
    });
  }

  function telFor(town){
    /* a plausible, unallocated UK number: Ofcom reserves 07700 900000–900999 and 01632 960000–960999 for drama */
    var n = 0; for (var i = 0; i < town.length; i++) n = (n * 31 + town.charCodeAt(i)) % 1000;
    return '07700 900' + String(n).padStart(3, '0');
  }
  function build(o, announce){
    var doc = buildDoc(o); lastDoc = doc;
    var f = stage.querySelector('iframe');
    if (!f){ f = d.createElement('iframe'); f.setAttribute('title', o.biz + ' — a website built on this page'); stage.appendChild(f); }
    f.srcdoc = doc;
    stage.parentNode.classList.add('is-live');
    if (cap) cap.innerHTML = '<b>' + esc(o.biz) + '</b><span>' + esc(o.trade.label) + ' &middot; ' + esc(o.town) + '</span>';
    if (after) after.hidden = true;
    if (timer){ t0 = Date.now(); clearInterval(tick); timer.hidden = false;
      tick = setInterval(function(){ timer.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's'; }, 100); }
    tint(o.trade);
    if (demoLink){ var b = (window.BUILDS || []).filter(function(x){ return x.n === o.trade.demo; })[0];
      if (b){ demoLink.href = base + 'work/' + b.slug + '/'; demoLink.textContent = 'See the real system a ' + o.trade.word + ' runs on it'; demoLink.hidden = false; } else demoLink.hidden = true; }
    if (blobUrl){ URL.revokeObjectURL(blobUrl); blobUrl = null; }
    window.__forgeAnnounce = announce;
  }
  window.addEventListener('message', function(e){
    if (e.data !== 'forge:done') return;
    clearInterval(tick);
    if (timer) timer.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's';
    if (after) after.hidden = false;
  });

  if (go) go.addEventListener('click', function(){
    var biz = (fBiz && fBiz.value || '').trim().slice(0, 34) || (picked.label.split(' ')[0] + ' & Sons');
    var town = (fTown && fTown.value || '').trim().slice(0, 22) || 'Wakefield';
    build({ trade: picked, biz: biz, town: town, tel: telFor(town) }, true);
    var ph = d.getElementById('forgePhone'); if (ph && ph.scrollIntoView && window.innerWidth < 900) ph.scrollIntoView({ block: 'center', behavior: rm ? 'auto' : 'smooth' });
  });
  [fBiz, fTown].forEach(function(el){ if (el) el.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); go.click(); } }); });

  var guard = d.getElementById('forgeGuard');
  var hint = d.getElementById('tapHint');
  if (guard) guard.addEventListener('click', function(){ guard.hidden = true; if (hint) hint.hidden = true; });

  if (openBtn) openBtn.addEventListener('click', function(e){
    e.preventDefault(); if (!lastDoc) return;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(new Blob([lastDoc], { type: 'text/html' }));
    window.open(blobUrl, '_blank', 'noopener');
  });

  /* first paint: build one for an invented firm so the mechanic explains itself */
  var seed = byKey('heating');
  build({ trade: seed, biz: 'Ashfield Heating', town: 'Wakefield', tel: telFor('Wakefield') }, false);
})();
