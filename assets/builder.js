/* ============================================================
   The builder — the top of the home page builds the visitor a draft website while they watch.
   Three answers (trade, business name, town) render a real, working site into a browser window
   and a phone, section by section, while the build log says what is being done to it.
   Every draft gets a reference (SK-XXXX). The reference and the three answers travel in the link
   to /book/, so the call starts with the draft already open. Nothing is sent anywhere from here.
   ============================================================ */
(function(){
  var d = document, S = window.SITE || {}, base = S.base || '', T = window.TRADES || [];
  var stage = d.getElementById('bStage'); if (!stage || !T.length) return;
  var rm = false; try { rm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var esc = function(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var byKey = function(k){ for (var i = 0; i < T.length; i++) if (T[i].key === k) return T[i]; return null; };
  var abs = function(p){ var a = d.createElement('a'); a.href = base + (p || ''); return a.href; };
  var slug = function(s){ return String(s).toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
  var tint = function(t){ var r = d.documentElement.style; r.setProperty('--c', t.c); r.setProperty('--c-ink', t.cInk || '#FFFFFF'); r.setProperty('--c-text', t.cText || t.c); };
  var store = { get: function(){ try { return JSON.parse(localStorage.getItem('sk_draft') || 'null'); } catch(e){ return null; } },
                set: function(v){ try { localStorage.setItem('sk_draft', JSON.stringify(v)); } catch(e){} } };
  var track = function(n, p){ if (window.skTrack) try { skTrack(n, p); } catch(e){} };
  var an = function(w){ return (/^[aeiou]/i.test(w) || /^MOT\b/.test(w) ? 'an ' : 'a ') + w; };

  /* ---------- what a draft is made of ---------- */
  /* a plausible, unallocated UK number: Ofcom reserves 07700 900000–900999 for drama */
  function telFor(town){ var n = 0; for (var i = 0; i < town.length; i++) n = (n * 31 + town.charCodeAt(i)) % 1000; return '07700 900' + String(n).padStart(3, '0'); }
  function domainFor(biz){ var s = slug(biz.replace(/\b(ltd|limited|llp|plc)\b\.?/ig, '')).replace(/-/g, ''); return (s || 'yourbusiness').slice(0, 26) + '.co.uk'; }
  /* the same business, trade and town always get the same reference, so a rebuild is not a second lead */
  var AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function refFor(t, biz, town){
    var s = (t.key + '|' + biz + '|' + town).toLowerCase().replace(/\s+/g, ' ').trim(), h = 2166136261;
    for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var out = AB.charAt(h % 24); h = Math.floor(h / 24);   // first character is always a letter
    for (var k = 0; k < 3; k++){ out += AB.charAt(h % 32); h = Math.floor(h / 32); }
    return 'SK-' + out;
  }
  function draftQuery(o){ return 'd=' + encodeURIComponent(o.ref) + '&t=' + encodeURIComponent(o.t.key) + '&n=' + encodeURIComponent(o.biz) + '&w=' + encodeURIComponent(o.town); }
  function draftUrl(o){ return abs('') + '?' + draftQuery(o) + '#build'; }
  function bookUrl(o){ return base + 'book/?' + draftQuery(o); }
  function make(t, biz, town, ref, example){
    return { t: t, biz: biz, town: town, tel: telFor(town), domain: domainFor(biz), ref: ref || refFor(t, biz, town), example: !!example };
  }
  /* the next three working days from today, the first slot of the first day already gone */
  function days(){
    var out = [], dt = new Date(), names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    while (out.length < 3){ dt.setDate(dt.getDate() + 1); if (dt.getDay() === 0) continue;
      out.push(out.length === 0 && (dt - new Date()) < 2 * 864e5 ? 'Tomorrow' : names[dt.getDay()] + ' ' + dt.getDate()); }
    return out;
  }

  /* ---------- the generated site ----------
     One responsive page: a lockup, a photographic hero with the booking card in it, guarantees,
     services with example prices, how booking works (and the missed-call text-back), a page per
     service for the town, the questions customers ask, and a call bar that stays on the phone. */
  function buildDoc(o, staged){
    var t = o.t, biz = esc(o.biz), town = esc(o.town), tel = esc(o.tel), ref = esc(o.ref);
    var fill = function(s){ return esc(String(s).replace(/\{town\}/g, o.town).replace(/\{biz\}/g, o.biz)); };
    var mark = esc((o.biz.trim().match(/[A-Za-z0-9]/) || ['S'])[0].toUpperCase());
    var img = function(n){ return abs('assets/photos/' + t.photo + n + '.webp'); };
    var dd = days(), dep = t.dep, font = t.font, serif = /Fraunces/.test(font);
    var lock = '<span class="lock"><span class="mk">' + mark + '</span><span class="lk"><b>' + biz + '</b><small>' + esc(t.label) + ' &middot; ' + town + '</small></span></span>';
    var ic = { ok: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
               ph: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5 6.7 7.3a1.4 1.4 0 0 0-.1 1.9c3 3.6 5.7 6.3 9.3 9.3a1.4 1.4 0 0 0 1.9-.1l1.8-1.8c.4-.4.4-1 0-1.4l-2.2-1.9a1 1 0 0 0-1.3 0l-.9.8a17.4 17.4 0 0 1-3.8-3.8l.8-.9a1 1 0 0 0 0-1.3l-1.9-2.2a1 1 0 0 0-1.4 0Z" fill="currentColor"/></svg>',
               msg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5c-4.4 0-8 2.9-8 6.5 0 2.1 1.2 3.9 3.1 5.1-.2 1.1-.8 2.2-1.6 3 1.6-.2 3.1-.8 4.4-1.6.7.1 1.4.2 2.1.2 4.4 0 8-2.9 8-6.6S16.4 4.5 12 4.5Z" fill="currentColor"/></svg>',
               ar: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4.5 12.5 10 7 15.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' };
    var taken = [[0], [2], []];
    var firstFree = t.times[1];
    var dayTabs = dd.map(function(x, i){ return '<button type="button" class="bk-day' + (i === 0 ? ' on' : '') + '" data-day="' + i + '">' + esc(x) + '</button>'; }).join('');
    var css = [
      ':root{--c:' + t.c + ';--ink:#14151A;--dim:#5B5E66;--line:#E7E5E0;--soft:#F6F4EF;--r:16px;--disp:"' + font + '",' + (serif ? 'Georgia,serif' : '"Inter",system-ui,sans-serif') + '}',
      '*{box-sizing:border-box;margin:0}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}',
      'body{font:16px/1.55 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:#fff;-webkit-font-smoothing:antialiased}',
      'img{display:block;max-width:100%}a{color:inherit;text-decoration:none}button{font:inherit;color:inherit;cursor:pointer}',
      'h1,h2,h3{font-family:var(--disp);font-weight:' + (serif ? 500 : 700) + ';letter-spacing:' + (serif ? '-.015em' : '-.03em') + ';line-height:1.06;text-wrap:balance}',
      '.w{width:min(1160px,100% - 48px);margin-inline:auto}',
      'html.staged [data-b]{opacity:0;transform:translateY(10px)}',
      'html.staged [data-b].in{opacity:1;transform:none;transition:opacity .5s cubic-bezier(.2,.7,.2,1),transform .5s cubic-bezier(.2,.7,.2,1)}',
      'html.staged .hero[data-b] .ph{transform:scale(1.035)}html.staged .hero[data-b].in .ph{transform:none;transition:transform 1.6s cubic-bezier(.2,.7,.2,1)}',
      /* header */
      '.hd{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}',
      '.hd .w{display:flex;align-items:center;justify-content:space-between;gap:20px;height:72px}',
      '.lock{display:inline-flex;align-items:center;gap:11px;min-width:0}',
      '.mk{flex:none;width:38px;height:38px;border-radius:10px;background:var(--c);color:#fff;display:grid;place-items:center;font:700 19px/1 var(--disp)}',
      '.lk{display:grid;min-width:0}.lk b{font:' + (serif ? 600 : 700) + ' 17px/1.15 var(--disp);letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.lk small{font-size:12.5px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.nav{display:flex;gap:28px;font-size:15px;font-weight:500;color:#33353B}.nav a:hover{color:var(--c)}',
      '.hd-r{display:flex;align-items:center;gap:18px}.tel{display:inline-flex;align-items:center;gap:7px;font-weight:600;font-size:15px;white-space:nowrap}.tel svg{width:17px;height:17px;color:var(--c)}',
      '.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 22px;border-radius:12px;font-weight:600;font-size:15.5px;border:0;white-space:nowrap}',
      '.btn svg{width:18px;height:18px;flex:none}.btn.p{background:var(--c);color:#fff}.btn.p:hover{filter:brightness(1.08)}',
      '.btn.g{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.45)}',
      '.btn.l{background:#fff;color:var(--ink);border:1px solid var(--line)}',
      /* hero */
      '.hero{position:relative;overflow:hidden;color:#fff;background:#1a1b1f}',
      '.hero .ph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:' + t.pos + '}',
      '.hero::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,10,13,.88) 0%,rgba(9,10,13,.74) 48%,rgba(9,10,13,.3) 100%)}',
      '.hero .w{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 384px;gap:56px;align-items:center;padding:84px 0 92px}',
      '.eye{display:inline-flex;align-items:center;gap:9px;font-size:13px;font-weight:600;letter-spacing:.02em;color:rgba(255,255,255,.9);background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);padding:7px 13px 7px 11px;border-radius:999px;margin-bottom:22px}',
      '.eye i{width:8px;height:8px;border-radius:50%;background:#3DDC84;box-shadow:0 0 0 4px rgba(61,220,132,.18)}',
      '.hero h1{font-size:60px;max-width:13ch;margin-bottom:20px}',
      '.hero .sub{font-size:18px;line-height:1.55;color:rgba(255,255,255,.84);max-width:52ch;margin-bottom:30px}',
      '.hero .acts{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:34px}.hero .btn{height:54px;padding:0 26px;font-size:16px}',
      '.creds{display:flex;flex-wrap:wrap;gap:10px 24px;list-style:none;padding:0;font-size:14.5px;color:rgba(255,255,255,.88)}',
      '.creds li{display:flex;align-items:center;gap:8px}.creds svg{width:18px;height:18px;color:#3DDC84;flex:none}',
      /* booking card */
      '.bk{background:#fff;color:var(--ink);border-radius:20px;padding:24px;box-shadow:0 30px 70px -28px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.04)}',
      '.bk-h{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;font-weight:600;color:var(--dim);margin-bottom:10px}',
      '.bk-h span{display:inline-flex;align-items:center;gap:7px}.bk-h i{width:7px;height:7px;border-radius:50%;background:#22A45D}',
      '.bk-t{font-size:24px;margin-bottom:6px;text-transform:none}',
      '.bk-next{font-size:14.5px;color:var(--dim);margin-bottom:16px}.bk-next b{color:var(--ink)}',
      '.bk-days{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px;background:var(--soft);border-radius:12px;margin-bottom:12px}',
      '.bk-day{height:38px;border:0;border-radius:9px;background:transparent;font-size:13.5px;font-weight:600;color:var(--dim)}.bk-day.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.1)}',
      '.bk-times{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px}',
      '.bk-tm{height:46px;border-radius:11px;border:1px solid var(--line);background:#fff;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums}',
      '.bk-tm.on{border-color:var(--c);box-shadow:inset 0 0 0 1px var(--c);color:var(--c)}.bk-tm[disabled]{color:#B3B3B0;text-decoration:line-through;background:var(--soft);cursor:default;border-color:transparent}',
      '.bk-dep{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.45;color:var(--dim);background:var(--soft);border-radius:11px;padding:11px 12px;margin-bottom:14px}',
      '.bk-dep b{color:var(--ink)}.bk-dep svg{width:18px;height:18px;flex:none;color:var(--c);margin-top:1px}',
      '.bk-go{width:100%;height:54px;font-size:16px}.bk-fine{font-size:12.5px;color:var(--dim);text-align:center;margin-top:10px}',
      '.bk-ok{display:none;text-align:center;padding:18px 6px 6px}.bk-ok .tick{width:52px;height:52px;border-radius:50%;background:var(--c);color:#fff;display:grid;place-items:center;margin:0 auto 14px}.bk-ok .tick svg{width:28px;height:28px}',
      '.bk-ok h3{font-size:21px;margin-bottom:6px}.bk-ok p{font-size:14.5px;color:var(--dim)}.bk-ok small{display:block;margin-top:12px;font-size:12px;color:#8A8C92}',
      '.bk.done .bk-form{display:none}.bk.done .bk-ok{display:block}',
      /* guarantees strip */
      '.trust{border-bottom:1px solid var(--line)}.trust .w{display:grid;grid-template-columns:repeat(4,1fr);gap:0}',
      '.trust div{padding:24px 22px;border-left:1px solid var(--line);display:flex;gap:12px;align-items:center;font-size:15px;font-weight:600}.trust div:first-child{border-left:0;padding-left:0}',
      '.trust svg{width:22px;height:22px;color:var(--c);flex:none}',
      /* sections */
      'section.s{padding:96px 0}.s.soft{background:var(--soft)}',
      '.sh{display:flex;align-items:flex-end;justify-content:space-between;gap:32px;margin-bottom:44px}',
      '.sh h2{font-size:44px;max-width:16ch}.sh p{font-size:16.5px;color:var(--dim);max-width:44ch}',
      '.kick{display:block;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--c);margin-bottom:14px}',
      '.svc{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}',
      '.card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:28px;display:grid;grid-template-rows:auto 1fr auto;gap:10px;transition:border-color .2s,box-shadow .2s}',
      '.card:hover{border-color:#D8D5CE;box-shadow:0 14px 34px -22px rgba(0,0,0,.28)}',
      '.card .n{font-size:13px;font-weight:700;color:var(--c);font-variant-numeric:tabular-nums}',
      '.card h3{font-size:23px}.card p{color:var(--dim);font-size:15.5px}',
      '.card .pr{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding-top:16px;border-top:1px solid var(--line)}',
      '.card .pr b{font:' + (serif ? 600 : 700) + ' 21px/1 var(--disp);letter-spacing:-.02em}.card .pr a{font-size:14.5px;font-weight:600;color:var(--c);display:inline-flex;align-items:center;gap:4px}.card .pr svg{width:16px;height:16px}',
      '.note{margin-top:18px;font-size:13px;color:#8A8C92}',
      /* how booking works */
      '.how{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}',
      '.how .pic{position:relative;border-radius:22px;overflow:hidden;aspect-ratio:4/4.4}.how .pic img{width:100%;height:100%;object-fit:cover;object-position:' + t.pos2 + '}',
      '.how h2{font-size:44px;margin-bottom:30px}',
      '.steps{list-style:none;padding:0;display:grid;gap:22px;counter-reset:s}',
      '.steps li{display:grid;grid-template-columns:44px 1fr;gap:16px;align-items:start}',
      '.steps li::before{counter-increment:s;content:counter(s);width:44px;height:44px;border-radius:12px;background:var(--soft);color:var(--c);display:grid;place-items:center;font:700 18px/1 var(--disp)}',
      '.steps b{display:block;font-size:18px;margin-bottom:3px}.steps span{color:var(--dim);font-size:15.5px}',
      '.miss{margin-top:32px;display:flex;gap:14px;align-items:flex-start;padding:18px 20px;border-radius:16px;background:var(--ink);color:#fff}',
      '.miss .mi{flex:none;width:40px;height:40px;border-radius:11px;background:var(--c);display:grid;place-items:center}.miss .mi svg{width:20px;height:20px}',
      '.miss b{display:block;font-size:16px;margin-bottom:2px}.miss span{font-size:14.5px;color:rgba(255,255,255,.72)}',
      /* areas */
      '.area{display:grid;grid-template-columns:1fr 1.1fr;gap:64px;align-items:start}',
      '.area h2{font-size:40px;margin-bottom:16px}.area p{color:var(--dim);font-size:16.5px;max-width:42ch}',
      '.pages{display:grid;gap:10px}',
      '.pages a{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;background:#fff;border:1px solid var(--line);border-radius:14px;font-weight:600;font-size:16px}',
      '.pages a:hover{border-color:var(--c)}.pages a small{display:block;font:500 12.5px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#8A8C92;margin-top:3px}.pages svg{width:18px;height:18px;color:var(--c);flex:none}',
      /* faq */
      '.faq{display:grid;grid-template-columns:1fr 1.4fr;gap:64px}.faq h2{font-size:40px}',
      '.qs details{border-bottom:1px solid var(--line)}.qs details:first-child{border-top:1px solid var(--line)}',
      '.qs summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 0;font-weight:600;font-size:17.5px;cursor:pointer}',
      '.qs summary::-webkit-details-marker{display:none}.qs summary::after{content:"+";font-size:24px;font-weight:400;color:var(--c);line-height:1}',
      '.qs details[open] summary::after{content:"\\2212"}.qs p{padding:0 0 22px;color:var(--dim);font-size:16px;max-width:60ch}',
      /* call to action + footer */
      '.cta{background:var(--c);color:#fff;padding:72px 0}.cta .w{display:flex;align-items:center;justify-content:space-between;gap:32px;flex-wrap:wrap}',
      '.cta h2{font-size:42px;max-width:18ch}.cta p{margin-top:10px;color:rgba(255,255,255,.82);font-size:17px}.cta .acts{display:flex;gap:12px;flex-wrap:wrap}',
      '.cta .btn.w2{background:#fff;color:var(--ink)}',
      'footer{background:#111215;color:rgba(255,255,255,.66);padding:64px 0 40px;font-size:14.5px}',
      'footer .cols{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px;padding-bottom:40px;border-bottom:1px solid rgba(255,255,255,.12)}',
      'footer .lk b{color:#fff}footer .lk small{color:rgba(255,255,255,.5)}footer h4{color:#fff;font-size:14px;margin-bottom:12px}footer p{line-height:1.8}',
      'footer .bot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:22px;font-size:12.5px;color:rgba(255,255,255,.42)}',
      '.callbar{display:none}',
      /* phone */
      '@media (max-width:860px){',
      '.w{width:calc(100% - 36px)}.nav,.hd-r .tel{display:none}.hd .w{height:62px}.hd-r .btn{height:40px;padding:0 14px;font-size:14px;border-radius:10px}.mk{width:34px;height:34px;font-size:17px}',
      '.hero .w{grid-template-columns:1fr;gap:0;padding:44px 0 0}',
      '.hero::before{background:linear-gradient(180deg,rgba(9,10,13,.62) 0%,rgba(9,10,13,.8) 50%,rgba(9,10,13,.92) 100%)}',
      '.eye{font-size:12px;margin-bottom:16px}.hero h1{font-size:36px;margin-bottom:14px}.hero .sub{font-size:16px;margin-bottom:22px}',
      '.hero .acts{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:22px}.hero .btn{height:52px}',
      '.creds{display:grid;gap:9px;font-size:14px;margin-bottom:28px}',
      '.bk{border-radius:20px 20px 0 0;margin:0 -18px;padding:24px 18px 26px;box-shadow:none}',
      '.trust .w{grid-template-columns:1fr 1fr}.trust div{padding:18px 12px;font-size:14px;border-left:0;border-top:1px solid var(--line)}.trust div:nth-child(-n+2){border-top:0}.trust div:nth-child(odd){padding-left:0}',
      'section.s{padding:64px 0}.sh{display:block;margin-bottom:28px}.sh h2,.how h2{font-size:31px}.sh p{margin-top:12px;font-size:15.5px}',
      '.svc{grid-template-columns:1fr;gap:12px}.card{padding:22px}.card h3{font-size:21px}',
      '.how,.area,.faq{grid-template-columns:1fr;gap:32px}.how .pic{aspect-ratio:4/3}.area h2,.faq h2{font-size:30px}',
      '.cta{padding:56px 0}.cta h2{font-size:30px}.cta .acts{display:grid;width:100%}',
      'footer{padding:48px 0 110px}footer .cols{grid-template-columns:1fr;gap:28px}',
      '.callbar{display:grid;grid-template-columns:1fr 1.25fr;gap:8px;position:fixed;left:0;right:0;bottom:0;z-index:30;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);border-top:1px solid var(--line)}',
      '.callbar .btn{height:50px;font-size:15px}',
      '}'
    ].join('');
    var times = t.times.map(function(x, i){ return '<button type="button" class="bk-tm' + (i === 1 ? ' on' : '') + '" data-tm="' + esc(x) + '"' + (i === 0 ? ' disabled' : '') + '>' + esc(x) + '</button>'; }).join('');
    var depLine = dep ? '<b>£' + dep + ' deposit</b> holds the slot, and comes off the bill.' : '<b>Free visit.</b> No deposit, and no obligation to go ahead.';
    var svc = t.services.map(function(s, i){
      return '<article class="card"><span class="n">0' + (i + 1) + '</span><div><h3>' + esc(s[0]) + '</h3><p style="margin-top:8px">' + esc(s[1]) + '</p></div>'
        + '<div class="pr"><b>' + esc(t.prices[i]) + '</b><a href="#book">Book' + ic.ar + '</a></div></article>';
    }).join('');
    var pages = t.kw.map(function(k){
      return '<a href="#top"><span>' + esc(k) + ' in ' + town + '<small>' + esc(o.domain) + '/' + esc(slug(k + ' ' + o.town)) + '</small></span>' + ic.ar + '</a>';
    }).join('');
    var faq = t.faq.map(function(q, i){ return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('');
    var steps = '<li><div><b>Pick a time that suits you</b><span>Real slots from the diary, any hour of the day.</span></div></li>'
      + (dep ? '<li><div><b>Pay a £' + dep + ' deposit</b><span>It holds the slot and comes off the bill.</span></div></li>'
             : '<li><div><b>Tell us what you need</b><span>A line or two, and a photo if you have one.</span></div></li>')
      + '<li><div><b>Get a text to confirm</b><span>And a reminder the day before, so nobody forgets.</span></div></li>';
    var by = o.example ? 'Example draft' : 'Draft ' + ref;
    var fontQ = font.replace(/ /g, '+') + (serif ? ':opsz,wght@9..144,500;9..144,600' : ':wght@600;700');
    var schema = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: o.biz, telephone: o.tel, url: 'https://' + o.domain + '/', areaServed: o.town,
      hasOfferCatalog: { '@type': 'OfferCatalog', name: t.label, itemListElement: t.services.map(function(s){ return { '@type': 'Offer', itemOffered: { '@type': 'Service', name: s[0] } }; }) } };

    return '<!doctype html><html lang="en-GB"' + (staged ? ' class="staged"' : '') + '><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<title>' + esc(t.label) + ' in ' + town + ' | ' + biz + '</title>'
      + '<meta name="description" content="' + fill(t.sub).slice(0, 155) + '">'
      + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
      + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=' + fontQ + '&display=swap" rel="stylesheet">'
      + '<script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '<\/script>'
      + '<style>' + css + '</style></head><body id="top">'
      + '<header class="hd" data-b><div class="w">' + lock
      +   '<nav class="nav" aria-label="Sections"><a href="#services">Services</a><a href="#services">Prices</a><a href="#areas">Areas</a><a href="#faq">FAQs</a></nav>'
      +   '<div class="hd-r"><a class="tel" href="#book">' + ic.ph + tel + '</a><a class="btn p" href="#book">Book online</a></div></div></header>'
      + '<section class="hero" data-b><img class="ph" src="' + img('') + '" srcset="' + img('-sm') + ' 820w, ' + img('') + ' 1536w" sizes="100vw" alt="" decoding="async">'
      +   '<div class="w"><div>'
      +     '<span class="eye"><i></i>' + esc(t.label) + ' in ' + town + ' &middot; booking open</span>'
      +     '<h1>' + fill(t.head) + '</h1><p class="sub">' + fill(t.sub) + '</p>'
      +     '<div class="acts"><a class="btn p" href="#book">Book online</a><a class="btn g" href="#book">' + ic.ph + 'Call ' + tel + '</a></div>'
      +     '<ul class="creds">' + t.creds.map(function(x){ return '<li>' + ic.ok + esc(x) + '</li>'; }).join('') + '</ul></div>'
      +   '<aside class="bk" id="book" data-b><div class="bk-form">'
      +     '<div class="bk-h"><span><i></i>Book online</span><span>' + (dep ? '£' + dep + ' deposit' : 'Free') + '</span></div>'
      +     '<h2 class="bk-t">Book ' + esc(an(t.job)) + '</h2>'
      +     '<p class="bk-next">Next free: <b id="bkNext">' + esc(dd[0]) + ', ' + esc(firstFree) + '</b></p>'
      +     '<div class="bk-days" role="tablist" aria-label="Day">' + dayTabs + '</div>'
      +     '<div class="bk-times" id="bkTimes">' + times + '</div>'
      +     '<div class="bk-dep">' + ic.ok + '<span>' + depLine + '</span></div>'
      +     '<button type="button" class="btn p bk-go" id="bkGo">Book ' + esc(dd[0].toLowerCase() === 'tomorrow' ? 'tomorrow' : dd[0]) + ', ' + esc(firstFree) + '</button>'
      +     '<p class="bk-fine">You get a text to confirm, and a reminder the day before.</p></div>'
      +     '<div class="bk-ok" role="status"><div class="tick">' + ic.ok + '</div><h3 id="bkOkT">Booked</h3><p>A text is on its way to confirm, with a reminder the day before.</p><small>This is a draft website, so nothing was really booked.</small></div>'
      +   '</aside></div></section>'
      + '<div class="trust" data-b><div class="w">' + t.creds.concat(['Texts back if you miss us']).map(function(x){ return '<div>' + ic.ok + esc(x) + '</div>'; }).join('') + '</div></div>'
      + '<section class="s soft" id="services" data-b><div class="w"><div class="sh"><div><span class="kick">Services &amp; prices</span><h2>What we do, and what it costs.</h2></div>'
      +   '<p>Prices up front, so you know where you stand before anyone comes out.</p></div>'
      +   '<div class="svc">' + svc + '</div><p class="note">Example prices for this draft. Yours go here.</p></div></section>'
      + '<section class="s" data-b><div class="w how"><div class="pic"><img src="' + img('-2') + '" alt="" loading="lazy" decoding="async"></div><div>'
      +   '<span class="kick">Booking</span><h2>Booked in under a minute.</h2><ol class="steps">' + steps + '</ol>'
      +   '<div class="miss"><span class="mi">' + ic.msg + '</span><div><b>Missed us? You get a text straight back.</b><span>If we are on a job when you ring, a text comes back within a minute with a link to book.</span></div></div>'
      + '</div></div></section>'
      + '<section class="s soft" id="areas" data-b><div class="w area"><div><span class="kick">Areas</span><h2>Covering ' + town + ' and the villages around it.</h2>'
      +   '<p>Not sure if we cover you? Ring and ask. If we do not, we will tell you who does.</p></div><div class="pages">' + pages + '</div></div></section>'
      + '<section class="s" id="faq" data-b><div class="w faq"><div><span class="kick">Questions</span><h2>Before you ring.</h2></div><div class="qs">' + faq + '</div></div></section>'
      + '<section class="cta" data-b><div class="w"><div><h2>Ready when you are.</h2><p>Book online in under a minute, or ring ' + tel + '.</p></div>'
      +   '<div class="acts"><a class="btn w2" href="#book">Book online</a><a class="btn g" href="#book">' + ic.ph + 'Call ' + tel + '</a></div></div></section>'
      + '<footer data-b><div class="w"><div class="cols"><div>' + lock + '<p style="margin-top:16px;max-width:34ch">' + fill(t.sub).split('. ')[0] + '.</p></div>'
      +   '<div><h4>Contact</h4><p>' + tel + '<br>Mon to Fri 8am to 6pm<br>Saturday 9am to 1pm</p></div>'
      +   '<div><h4>Pages</h4><p><a href="#services">Services &amp; prices</a><br><a href="#book">Book online</a><br><a href="#areas">Areas we cover</a><br><a href="#faq">Questions</a></p></div></div>'
      +   '<div class="bot"><span>&copy; ' + new Date().getFullYear() + ' ' + biz + '</span><span>' + by + ' &middot; built by Skales Studio &middot; fictional business, example photos</span></div></div></footer>'
      + '<nav class="callbar" data-b><a class="btn l" href="#book">' + ic.ph + 'Call</a><a class="btn p" href="#book">Book online</a></nav>'
      + '<script>(function(){var d=document,B=d.querySelectorAll("[data-b]"),days=' + JSON.stringify(dd) + ',taken=' + JSON.stringify(taken) + ',times=' + JSON.stringify(t.times) + ',day=0,tm=' + JSON.stringify(firstFree) + ';'
      + 'function go(y){window.scrollTo({top:Math.max(0,y),behavior:"smooth"})}'
      + 'function at(el,mid){var r=el.getBoundingClientRect(),y=r.top+scrollY;return mid?y-(innerHeight-Math.min(r.height,innerHeight))/2:y-(innerWidth>860?72:62)}'
      + 'window.skReveal=function(n,follow){for(var i=0;i<B.length;i++)if(i<n)B[i].classList.add("in");if(!follow||n<4)return;'
      +   'if(n>=B.length){go(d.documentElement.scrollHeight);return}go(at(B[n-1],true))};'
      + 'window.skAll=function(){d.documentElement.classList.remove("staged")};'
      + 'window.skTop=function(){window.scrollTo({top:0,behavior:"smooth"})};'
      + 'd.addEventListener("click",function(e){var a=e.target.closest("a[href^=\\"#\\"]");if(a){e.preventDefault();var id=a.getAttribute("href").slice(1),el=id==="top"?null:d.getElementById(id);go(el?at(el,id==="book"&&innerWidth>860):0);return}'
      +   'var b=e.target.closest(".bk-day");if(b){day=+b.getAttribute("data-day");d.querySelectorAll(".bk-day").forEach(function(x){x.classList.toggle("on",x===b)});'
      +     'var h="";times.forEach(function(x,i){var off=taken[day].indexOf(i)>-1;h+="<button type=button class=\\"bk-tm"+(!off&&h.indexOf(" on")<0?" on":"")+"\\" data-tm=\\""+x+"\\""+(off?" disabled":"")+">"+x+"</button>"});'
      +     'd.getElementById("bkTimes").innerHTML=h;var on=d.querySelector(".bk-tm.on");tm=on?on.getAttribute("data-tm"):"";upd();return}'
      +   'var t=e.target.closest(".bk-tm");if(t&&!t.disabled){d.querySelectorAll(".bk-tm").forEach(function(x){x.classList.toggle("on",x===t)});tm=t.getAttribute("data-tm");upd();return}'
      +   'if(e.target.closest("#bkGo")){d.getElementById("bkOkT").textContent="Booked for "+lab()+", "+tm;d.querySelector(".bk").classList.add("done")}});'
      + 'function lab(){return days[day]==="Tomorrow"?"tomorrow":days[day]}function upd(){d.getElementById("bkGo").textContent="Book "+lab()+", "+tm}'
      + '})();<\/script>'
      + '</body></html>';
  }

  /* ---------- the stage: a browser window with a phone over its corner ---------- */
  var view = d.getElementById('bView'), pscreen = d.getElementById('bPScreen'), urlEl = d.getElementById('bUrl'), cap = d.getElementById('bCap');
  var logEl = d.getElementById('bLog'), logList = d.getElementById('bLogList'), logT = d.getElementById('bLogT'), logHead = d.getElementById('bLogHead'), skipBtn = d.getElementById('bSkip');
  var frames = [];
  function newFrame(host, w, title){
    host.innerHTML = '';
    var f = d.createElement('iframe'); f.setAttribute('title', title); f.setAttribute('tabindex', '-1'); f.setAttribute('loading', 'eager');
    f.dataset.w = w; host.appendChild(f); return f;
  }
  function fit(){
    frames.forEach(function(f){
      var host = f.parentNode, W = host.clientWidth, H = host.clientHeight, w = +f.dataset.w;
      var s = (w === 390 && W >= 330 && window.innerWidth < 900) ? 1 : W / w;
      f.style.width = (s === 1 ? W : w) + 'px'; f.style.height = Math.ceil(H / s) + 'px'; f.style.transform = s === 1 ? 'none' : 'scale(' + s + ')';
    });
  }
  var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
  if (ro){ ro.observe(view); ro.observe(pscreen); } else addEventListener('resize', fit);

  var run = 0, cur = null, lastDoc = '', t0 = 0, tick = null;
  function wide(){ return getComputedStyle(d.getElementById('bWin')).display !== 'none'; }

  /* the build log: what is actually being put on the page, in the order it goes on */
  function stepsFor(o){
    var t = o.t;
    return [
      ['Registering ' + o.domain, '', 1],
      ['Writing the homepage', t.label + ', ' + o.town, 2],
      ['Linking booking to the diary', t.dep ? '£' + t.dep + ' deposit' : 'free visits', 3],
      ['Adding your guarantees', t.creds.length + ' promises', 4],
      ['Pricing every service', t.services.length + ' services', 5],
      ['Turning on missed-call text-back', 'on', 6],
      ['A page for every service in ' + o.town, t.kw.length + ' pages', 7],
      ['Answering what customers ask', t.faq.length + ' answers', 8],
      ['Making it Google-ready', 'schema · titles · speed', 99],
    ];
  }
  function logLine(txt, det){
    var li = d.createElement('li'); li.innerHTML = '<i class="sp" aria-hidden="true"></i><span>' + esc(txt) + '</span><em>' + esc(det) + '</em>';
    logList.appendChild(li); return li;
  }
  function reveal(n, follow){ frames.forEach(function(f){ try { f.contentWindow.skReveal(n, follow); } catch(e){} }); }
  function allIn(){ frames.forEach(function(f){ try { f.contentWindow.skAll(); } catch(e){} }); }
  function loaded(f){ return new Promise(function(res){ var done = false, fin = function(){ if (!done){ done = true; res(); } }; f.addEventListener('load', fin, { once: true }); setTimeout(fin, 1500); }); }
  var wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

  function build(o, mode){   /* mode: 'watch' (the log runs), 'instant' (no animation) */
    var my = ++run, staged = mode === 'watch' && !rm;
    cur = o; lastDoc = buildDoc(o, false);
    tint(o.t);
    if (urlEl) urlEl.textContent = o.domain;
    if (cap) cap.hidden = !o.example;
    var doc = buildDoc(o, staged);
    frames = (wide() ? [newFrame(view, 1280, o.biz + ', a draft website, desktop')] : []).concat(newFrame(pscreen, 390, o.biz + ', a draft website, on a phone'));
    guards(false);
    frames.forEach(function(f){ f.srcdoc = doc; }); fit();
    stage.classList.remove('is-done'); stage.classList.add('is-building');
    logList.innerHTML = ''; logEl.hidden = false; logEl.classList.toggle('min', !staged);
    logHead.innerHTML = staged ? esc(o.example ? 'Building an example' : 'Building ' + o.biz) : o.example ? 'Example draft &middot; fictional' : 'Draft <b>' + esc(o.ref) + '</b>';
    logT.textContent = ''; clearInterval(tick); t0 = Date.now();
    var steps = stepsFor(o);
    var finish = function(secs){
      if (my !== run) return;
      clearInterval(tick); allIn();
      stage.classList.remove('is-building'); stage.classList.add('is-done');
      logEl.classList.add('min');
      logHead.innerHTML = o.example ? 'Example draft &middot; fictional' : secs ? 'Built in ' + secs + 's &middot; <b>' + esc(o.ref) + '</b>' : 'Draft <b>' + esc(o.ref) + '</b>';
      logT.textContent = '';
      frames.forEach(function(f){ try { f.contentWindow.skTop(); } catch(e){} });
      done(o, secs);
    };
    if (!staged){
      Promise.all(frames.map(loaded)).then(function(){ reveal(99, false); finish(''); });
      return;
    }
    Promise.all(frames.map(loaded)).then(function(){
      if (my !== run) return;
      t0 = Date.now(); tick = setInterval(function(){ logT.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's'; }, 100);
      var chain = Promise.resolve();
      steps.forEach(function(s, i){
        chain = chain.then(function(){
          if (my !== run) throw 0;
          var li = logLine(s[0], s[1]);
          return wait(i === 0 ? 520 : 560).then(function(){ if (my !== run) throw 0; reveal(s[2], true); return wait(300); })
            .then(function(){ if (my !== run) throw 0; li.classList.add('ok'); });
        });
      });
      chain.then(function(){
        if (my !== run) return;
        var last = logLine(o.example ? 'Example only. Now build yours' : 'Saved as draft ' + o.ref, ''); last.classList.add('ok', 'fin');
        return wait(650).then(function(){ finish(((Date.now() - t0) / 1000).toFixed(1)); });
      }).catch(function(){});
    });
  }
  if (skipBtn) skipBtn.addEventListener('click', function(){ if (!cur) return; var o = cur; build(o, 'instant'); });
  var wasWide = wide();
  addEventListener('resize', function(){ var w = wide(); if (w !== wasWide){ wasWide = w; if (cur) build(cur, 'instant'); } });

  /* the frames ignore the pointer until asked, so scrolling the page never gets caught inside one */
  function guards(on){ d.querySelectorAll('[data-guard]').forEach(function(g){ var h = d.getElementById(g.getAttribute('data-guard')); if (h) h.classList.toggle('live', !!on); }); }
  d.querySelectorAll('[data-guard]').forEach(function(g){
    g.addEventListener('click', function(){ var h = d.getElementById(g.getAttribute('data-guard')); if (h) h.classList.add('live'); track('draft_used', { trade: cur ? cur.t.key : '' }); });
  });

  /* ---------- the form ---------- */
  var form = d.getElementById('bForm'), chips = d.getElementById('bTrades'), fBiz = d.getElementById('bBiz'), fTown = d.getElementById('bTown'), need = d.getElementById('bNeed');
  var doneEl = d.getElementById('bDone'), h1 = d.getElementById('h-build'), lead = d.getElementById('bLead');
  var H0 = h1 ? h1.innerHTML : '', L0 = lead ? lead.innerHTML : '';
  var picked = null;
  function say(m){ if (!need) return; need.textContent = m || ''; need.hidden = !m; }
  function pick(t){ picked = t; chips.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === t.key)); }); }
  if (chips){
    chips.innerHTML = T.map(function(x){ return '<button type="button" data-k="' + x.key + '" aria-pressed="false">' + esc(x.label) + '</button>'; }).join('');
    chips.addEventListener('click', function(e){ var b = e.target.closest('button[data-k]'); if (!b) return; pick(byKey(b.getAttribute('data-k'))); say(''); tint(picked); });
  }
  if (form) form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!picked){ say('Pick what you do first.'); chips.querySelector('button').focus(); return; }
    var biz = (fBiz.value || '').trim().replace(/\s+/g, ' ').slice(0, 34);
    if (!biz){ say('Give it a name and it will build.'); fBiz.focus(); return; }
    var town = (fTown.value || '').trim().replace(/\s+/g, ' ').slice(0, 22);
    if (!town){ say('Add your town, so the pages are written for it.'); fTown.focus(); return; }
    say('');
    var o = make(picked, biz, town);
    store.set({ ref: o.ref, t: o.t.key, n: o.biz, w: o.town, at: Date.now() });
    track('draft_built', { trade: o.t.key });
    build(o, 'watch');
    if (window.innerWidth < 900 && stage.scrollIntoView) stage.scrollIntoView({ block: 'start', behavior: rm ? 'auto' : 'smooth' });
  });

  /* ---------- after a build: the reference, and the reason to book ---------- */
  var dRef = d.getElementById('dRef'), dMeta = d.getElementById('dMeta'), dBook = d.getElementById('dBook'), dOpen = d.getElementById('dOpen'), dCopy = d.getElementById('dCopy'), dEdit = d.getElementById('dEdit');
  function done(o, secs){
    if (cap){ cap.hidden = !o.example; cap.textContent = 'Example draft · fictional business'; }
    if (o.example) return;
    if (h1) h1.innerHTML = esc(o.biz) + (secs ? ', built in ' + esc(secs) + ' seconds.' : ', built.');
    if (lead) lead.innerHTML = 'Draft <b>' + esc(o.ref) + '</b> is saved. Book a call and I will have it open, along with what people in ' + esc(o.town)
      + ' type into Google when they need ' + esc(an(o.t.word)) + ', and who is getting those jobs now.';
    if (dRef) dRef.textContent = o.ref;
    if (dMeta) dMeta.textContent = o.biz + ' · ' + o.t.label + ' · ' + o.town;
    if (dBook){ dBook.href = bookUrl(o); dBook.textContent = 'Book a call about ' + o.ref; }
    if (form) form.hidden = true;
    if (doneEl) doneEl.hidden = false;
    personalise(o);
  }
  if (dBook) dBook.addEventListener('click', function(){ if (cur) track('draft_book_click', { trade: cur.t.key }); });
  if (dEdit) dEdit.addEventListener('click', function(){
    if (form) form.hidden = false; if (doneEl) doneEl.hidden = true;
    if (h1) h1.innerHTML = H0; if (lead) lead.innerHTML = L0;
    if (cur){ pick(cur.t); fBiz.value = cur.biz; fTown.value = cur.town; }
    fBiz.focus();
  });
  if (dOpen) dOpen.addEventListener('click', function(){
    if (!lastDoc) return;
    var u = URL.createObjectURL(new Blob([lastDoc], { type: 'text/html' }));
    window.open(u, '_blank', 'noopener'); setTimeout(function(){ URL.revokeObjectURL(u); }, 60000);
  });
  if (dCopy) dCopy.addEventListener('click', function(){
    if (!cur) return; var u = draftUrl(cur), lab = dCopy.textContent;
    var ok = function(){ dCopy.textContent = 'Link copied'; setTimeout(function(){ dCopy.textContent = lab; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, function(){ prompt('Copy this link', u); });
    else prompt('Copy this link', u);
  });

  /* the explainer under the hero speaks about this draft once there is one */
  function personalise(o){
    d.querySelectorAll('[data-dx="draft"]').forEach(function(el){ el.textContent = 'Draft ' + o.ref; });
    d.querySelectorAll('.mbar .go').forEach(function(a){ a.href = bookUrl(o); });
    d.querySelectorAll('[data-dx="town"]').forEach(function(el){ el.textContent = o.town; });
    var pg = d.getElementById('dxPages');
    if (pg) pg.innerHTML = '<li class="dom">' + esc(o.domain) + '</li>' + o.t.kw.slice(0, 3).map(function(k){ return '<li>/<b>' + esc(slug(k + ' ' + o.town)) + '</b></li>'; }).join('');
    d.querySelectorAll('[data-dx="biz"]').forEach(function(el){ el.textContent = o.biz; });
    d.querySelectorAll('[data-dx="dom"]').forEach(function(el){ el.textContent = o.domain; });
    var kw = o.t.kw || [];
    if (kw.length){
      d.querySelectorAll('[data-dx="kw"]').forEach(function(el){ el.textContent = kw[0].toLowerCase(); });
      d.querySelectorAll('[data-dx="svc"]').forEach(function(el){ el.textContent = kw[1] || kw[0]; });
      if (o.t.key !== 'heating') d.querySelectorAll('[data-dx="price"]').forEach(function(el){ el.textContent = 'Price shown up front'; });
    }
    var b = d.getElementById('dxBook'); if (b){ b.href = bookUrl(o); b.textContent = 'Book a call about ' + o.ref; }
    var rl = d.getElementById('dxRefline'); if (rl) rl.textContent = 'Thirty minutes, free. Your draft comes with you.';
  }

  /* ---------- first paint ----------
     A link with a draft in it (the one Tom opens on the call, or the visitor's own) rebuilds that
     exact site at once. A returning visitor gets their saved draft back. Everyone else sees an
     example build itself, once, when the stage comes into view. */
  var q = new URLSearchParams(location.search), qt = byKey(q.get('t') || ''), qn = (q.get('n') || '').slice(0, 34), qw = (q.get('w') || '').slice(0, 22), qd = q.get('d') || '';
  var saved = store.get(), st = saved && byKey(saved.t);
  if (qt && qn && qw){
    var o = make(qt, qn, qw, /^SK-[A-Z0-9]{4}$/.test(qd) ? qd : ''); pick(qt); fBiz.value = qn; fTown.value = qw; build(o, 'instant');
  } else if (st && saved.n && saved.w){
    var o2 = make(st, saved.n, saved.w, saved.ref); pick(st); fBiz.value = saved.n; fTown.value = saved.w; build(o2, 'instant');
  } else {
    var ex = make(byKey('heating') || T[0], 'Hartley Heating', 'Leeds', '', true);
    if (rm || !window.IntersectionObserver) build(ex, 'instant');
    else {
      build(ex, 'instant');   /* something real in the window straight away, then it builds itself once in view */
      var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); if (cur && cur.example) setTimeout(function(){ if (cur && cur.example) build(ex, 'watch'); }, 500); } }, { threshold: .35 });
      io.observe(stage);
    }
  }
})();
