/* Results: where the work came from, month by month, and what the ads cost per job. The same layout is the
   monthly report every client gets. The figures here are invented for a sample business. */
(function(){
  var f = SYS.fmt, esc = SYS.esc;
  var mi = null;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var NAME = { 'Google profile': 'Google Maps', 'Google Ads': 'Google Ads', 'Meta ads': 'Meta Ads', 'Website': 'Website', 'Instagram': 'Instagram', 'Recommended': 'Recommended', 'Repeat customer': 'Repeat customers' };

  function months(){ return SYS.S.results.months; }
  function idx(){ var L = months().length; if (mi == null || mi >= L) mi = L - 1; return mi; }
  function nm(m){ return NAME[m] || m; }
  function full(m){ var i = f.mon.indexOf(m.label); return i >= 0 ? MONTHS[i] : m.label; }
  function isNow(i){ return i === months().length - 1; }
  function title(i){ return full(months()[i]) + (isNow(i) ? ' so far' : ''); }
  function tot(m){ return m.rows.reduce(function(a, r){ a.e += r.enq; a.b += r.booked; a.v += r.value; a.s += r.spend; if (r.spend){ a.pv += r.value; a.pb += r.booked; } return a; }, { e: 0, b: 0, v: 0, s: 0, pv: 0, pb: 0 }); }
  function pct(a, b){ return b ? Math.round(a / b * 100) : 0; }
  function k(v){ return v >= 1000 ? '£' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : f.money(v); }
  function per(s, b){ return b ? f.money(Math.round(s / b)) : f.money(0); }
  function best(m){ return m.rows.slice().sort(function(a, b){ return b.value - a.value; })[0]; }
  function answered(e){ return Math.round(e * 0.985); }

  function demoNote(){ return '<p class="note rs-demo" id="rsNote"><b>Demo figures for a fictional business.</b><span>Every client gets this report on the 1st of the month, with their own numbers.</span></p>'; }
  function segHTML(){
    var i0 = idx();
    return '<div class="seg rs-seg" role="group" aria-label="Month" id="rsMonth">' + months().map(function(m, i){ return '<button type="button" data-act="month" data-i="' + i + '" aria-pressed="' + (i === i0) + '">' + esc(m.label) + '</button>'; }).join('') + '</div>';
  }

  function chainHTML(){
    var i = idx(), t = tot(months()[i]), a = answered(t.e), w = function(n){ return Math.max(1.5, n / t.e * 100).toFixed(1) + '%'; };
    var step = function(key, k1, k2, val, sub, width){ return '<div class="rs-step" data-s="' + key + '"><span class="rs-k">' + k1 + '<small>' + k2 + '</small></span><span class="rs-track"><i style="width:' + width + '"></i></span><span class="rs-v">' + val + '<small>' + sub + '</small></span></div>'; };
    return '<div class="card" id="rsChain"><div class="card-h"><h2>From enquiry to work</h2><span class="meta">' + esc(title(i)) + '</span></div><div class="card-b rs-chain">'
      + step('e', 'Enquiries', 'Calls, texts, forms', t.e, 'all sources', '100%')
      + step('a', 'Answered', 'Most within a minute', a, pct(a, t.e) + '% of enquiries', w(a))
      + step('b', 'Booked', 'In the diary', t.b, pct(t.b, t.e) + '% of enquiries', w(t.b))
      + step('v', 'Work booked', 'Value of those jobs', f.money(t.v), 'about ' + f.money(Math.round(t.v / Math.max(1, t.b))) + ' a job', w(t.b))
      + '</div><p class="note rs-foot rs-cf">' + (isNow(i) ? 'So far in ' : 'In ') + esc(full(months()[i])) + ', ads cost ' + f.money(t.s) + ', so ' + per(t.s, t.b) + ' for each job booked.</p></div>';
  }

  function trendHTML(){
    var ms = months(), i0 = idx(), T = ms.map(tot), max = Math.max.apply(null, T.map(function(t){ return t.v; })), h = function(v){ return Math.max(1.5, v / max * 100).toFixed(1) + '%'; }, t = T[i0];
    return '<div class="card" id="rsTrend"><div class="card-h"><h2>Work booked against ad spend</h2><span class="rs-keys"><span><i class="w"></i>Work</span><span><i class="s"></i>Ads</span></span></div>'
      + '<div class="card-b"><div class="rs-cols">' + ms.map(function(m, i){
        return '<button class="rs-col" type="button" data-act="month" data-i="' + i + '" aria-pressed="' + (i === i0) + '" aria-label="' + esc(full(m)) + ': ' + f.money(T[i].v) + ' of work, ' + f.money(T[i].s) + ' on ads">'
          + '<span class="rs-cv">' + k(T[i].v) + '</span><span class="rs-bars"><i class="w" style="height:' + h(T[i].v) + '"></i><i class="s" style="height:' + h(T[i].s) + '"></i></span>'
          + '<span class="rs-cm">' + esc(m.label) + '</span><span class="rs-cs">' + f.money(T[i].s) + '</span></button>';
      }).join('') + '</div><p class="note rs-foot">' + esc(title(i0)) + ': the ads brought in ' + f.money(t.pv) + ' of work for ' + f.money(t.s) + ' spent.</p></div></div>';
  }

  function tableHTML(){
    var i = idx(), m = months()[i], t = tot(m), rows = m.rows.slice().sort(function(a, b){ return b.value - a.value; });
    var td = function(v, mute){ return '<td class="r' + (mute ? ' rs-mute' : '') + '">' + v + '</td>'; };
    return '<div class="card" id="rsTable"><div class="card-h"><h2>Where the work came from</h2><span class="meta">' + esc(title(i)) + '</span></div><div class="tscroll"><table class="tbl rs-tbl"><thead><tr>'
      + '<th>Source</th><th class="r">Enquiries</th><th class="r">Booked</th><th class="r">Booked %</th><th class="r">Work booked</th><th class="r">Ad spend</th><th class="r">Cost per job</th></tr></thead><tbody>'
      + rows.map(function(r){
        return '<tr><td><span class="rs-src">' + esc(nm(r.m)) + '</span>' + (r.spend ? '<span class="rs-paid">Paid</span>' : '') + '</td>' + td(r.enq) + td(r.booked) + td(pct(r.booked, r.enq) + '%') + td(f.money(r.value)) + td(f.money(r.spend), !r.spend) + td(r.spend ? per(r.spend, r.booked) : f.money(0), !r.spend) + '</tr>';
      }).join('')
      + '</tbody><tfoot><tr><td>Total</td>' + td(t.e) + td(t.b) + td(pct(t.b, t.e) + '%') + td(f.money(t.v)) + td(f.money(t.s)) + td(per(t.s, t.b)) + '</tr></tfoot></table></div>'
      + '<p class="note rs-tnote">Cost per job is ad spend divided by jobs booked. Free sources cost nothing per job; the total spreads the ad spend across every job.</p></div>';
  }

  /* the plain-English report, built from the month's numbers */
  function report(i){
    var ms = months(), m = ms[i], t = tot(m), b = best(m), name = title(i), out = [];
    out.push({ h: '', p: [name + ': ' + t.e + ' enquiries, ' + t.b + ' booked, ' + f.money(t.v) + ' of work. Ads cost ' + f.money(t.s) + ', so ' + per(t.s, t.b) + ' a job. Best source: ' + nm(b.m) + '.'] });
    if (i > 0){
      var p = tot(ms[i - 1]), d = function(n, one, many){ return Math.abs(n) + ' ' + (n >= 0 ? 'more ' : 'fewer ') + (Math.abs(n) === 1 ? one : many); };
      out.push({ h: 'Against ' + full(ms[i - 1]), p: [d(t.e - p.e, 'enquiry', 'enquiries') + ', ' + d(t.b - p.b, 'job', 'jobs') + ' booked and ' + f.money(Math.abs(t.v - p.v)) + (t.v >= p.v ? ' more' : ' less') + ' work' + (isNow(i) ? ', with the month not over yet.' : '.')] });
    }
    var paid = m.rows.filter(function(r){ return r.spend; }).sort(function(a, b){ return a.spend / Math.max(1, a.booked) - b.spend / Math.max(1, b.booked); });
    out.push({ h: 'The ads', p: paid.map(function(r){ return nm(r.m) + ': ' + r.enq + ' enquiries, ' + r.booked + ' booked, ' + f.money(r.value) + ' of work for ' + f.money(r.spend) + '. That’s ' + per(r.spend, r.booked) + ' a job, and every £1 brought back ' + f.money(r.value / r.spend, { dp: 2 }) + '.'; }) });
    var free = m.rows.filter(function(r){ return !r.spend; }).sort(function(a, b){ return b.booked - a.booked; }), fb = free.reduce(function(a, r){ return a + r.booked; }, 0);
    out.push({ h: 'Free sources', p: [fb + ' of the ' + t.b + ' jobs cost nothing in ads: ' + free.map(function(r){ return nm(r.m) + ' ' + r.booked; }).join(', ') + '.'] });
    var next = [];
    if (paid.length > 1){
      var lo = paid[0], hi = paid[paid.length - 1], cl = lo.spend / Math.max(1, lo.booked), ch = hi.spend / Math.max(1, hi.booked);
      next.push(ch > cl * 1.3 ? nm(hi.m) + ' cost ' + f.money(Math.round(ch)) + ' a job against ' + f.money(Math.round(cl)) + ' on ' + nm(lo.m) + '. Worth moving some of that budget across and checking again next month.' : 'Both ads are paying for themselves at a similar cost per job. Keep the budget where it is.');
    }
    var tip = { 'Google profile': 'Google Maps brought the most work, and reviews are what move it. Keep asking every customer.',
      'Repeat customer': 'Repeat customers brought the most work. The reminder texts are what bring them back.',
      'Instagram': 'Instagram brought the most work. Keep posting photos of your work there.',
      'Recommended': 'Recommendations brought the most work. Every happy customer is worth a review ask.',
      'Website': 'The website brought the most work. Keep the booking page at the top of it.' };
    next.push(tip[b.m] || nm(b.m) + ' brought the most work for what it cost.');
    out.push({ h: 'Next month', p: next });
    return out;
  }
  function reportText(i){ return report(i).map(function(s){ return (s.h ? s.h + '\n' : '') + s.p.join('\n'); }).join('\n\n') + '\n\nDemo figures for a fictional business.'; }
  function openReport(){
    var i = idx(), t = SYS.T;
    var body = '<div class="rs-dr"><p class="note rs-demo"><b>Demo figures for a fictional business.</b></p><div class="rs-rep"><p class="rs-rh">' + esc(t.biz) + ' · ' + esc(title(i)) + '</p>'
      + report(i).map(function(s){ return (s.h ? '<h3>' + esc(s.h) + '</h3>' : '') + s.p.map(function(p, j){ return '<p' + (!s.h && !j ? ' class="rs-lead"' : '') + '>' + esc(p) + '</p>'; }).join(''); }).join('') + '</div>'
      + '<p class="note">Sent by text and email on the 1st. Written from the same numbers as this page.</p></div>';
    SYS.drawer({ title: full(months()[i]) + ' report', body: body, foot: '<button class="btn rs-act" type="button" data-close>Close</button><button class="btn ink rs-act" type="button" data-act="copy" id="rsCopy">Copy text</button>' });
  }

  function paint(v){
    v.innerHTML = '<div class="rs">' + demoNote() + '<div class="rs-bar">' + segHTML() + '<span class="note">' + (isNow(idx()) ? 'To ' + SYS.now().getDate() + ' ' + esc(months()[idx()].label) : esc(full(months()[idx()]) + ' ' + months()[idx()].year)) + '</span></div>'
      + '<div class="grid rs-g">' + chainHTML() + trendHTML() + '</div>' + tableHTML() + '</div>';
  }

  SYS.module('results', {
    label: 'Results', short: 'Results', icon: 'results', title: 'Results', blurb: 'Where the work came from',
    sub: function(){ return 'Where the work came from, and what the ads cost for each job.'; },
    count: function(){ return ''; },
    actions: function(){ return '<button class="btn pri rs-act" type="button" data-act="report" id="rsReport">' + SYS.icon('quotes') + 'Monthly report</button>'; },
    render: function(v){ paint(v); },
    update: function(v){ paint(v); },
    act: function(a, el){
      if (a === 'month'){ mi = +el.getAttribute('data-i'); SYS.refresh(); return; }
      if (a === 'report') return openReport();
      if (a === 'copy'){
        var txt = reportText(idx()), ok = function(){ SYS.toast('Report copied'); };
        try { navigator.clipboard.writeText(txt).then(ok, ok); } catch (e){ ok(); }
      }
    }
  });
  SYS.on(function(o){ if (o.trade) mi = null; });

  SYS.css('results', [
    '.rs-demo{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline;padding:9px 12px;margin-bottom:14px;border:1px solid var(--line);border-radius:var(--r);background:var(--panel);font-size:12.5px;color:var(--ink2)}',
    '.rs-demo b{color:var(--ink);font-weight:600}',
    '.rs-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}',
    '.rs-g{grid-template-columns:minmax(0,1fr) minmax(0,1fr);margin-bottom:14px}',
    '.rs-g>.card{display:flex;flex-direction:column}',
    '.rs-g>.card>.card-b{flex:1}',
    '.rs-cf{padding:10px 14px;border-top:1px solid var(--line2);margin:0}',
    '.rs-chain{padding-top:4px;padding-bottom:4px}',
    '.rs-step{display:grid;grid-template-columns:128px minmax(0,1fr) 112px;align-items:center;gap:14px;padding:10px 0}',
    '.rs-step+.rs-step{border-top:1px solid var(--line2)}',
    '.rs-k{font-size:13px;font-weight:550;line-height:1.3}',
    '.rs-k small,.rs-v small{display:block;font-size:12px;color:var(--ink3);font-weight:400}',
    '.rs-track i{display:block;height:20px;border-radius:3px;background:#D6D6DA}',
    '.rs-step[data-s=b] .rs-track i{background:var(--ink2)}',
    '.rs-step[data-s=v] .rs-track i{background:var(--ac)}',
    '.rs-v{text-align:right;font-size:17px;font-weight:620;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1.2}',
    '.rs-keys{display:flex;gap:12px;font-size:12px;color:var(--ink3)}',
    '.rs-keys span{display:inline-flex;align-items:center;gap:5px}',
    '.rs-keys i,.rs-bars i{display:block;border-radius:2px 2px 0 0}',
    '.rs-keys i{width:9px;height:9px;border-radius:2px}',
    '.rs-keys .w,.rs-col[aria-pressed=true] .rs-bars .w{background:var(--ac)}',
    '.rs-bars .w{background:color-mix(in srgb,var(--ac) 42%,#fff)}',
    '.rs-keys .s,.rs-bars .s{background:#A1A1AA}',
    '.rs-cols{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}',
    '.rs-col{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0 6px;border-radius:var(--r);font-variant-numeric:tabular-nums;min-width:0}',
    '.rs-col:hover{background:var(--sunk)}',
    '.rs-col[aria-pressed=true]{background:var(--hover)}',
    '.rs-cv{font-size:11.5px;font-weight:600;color:var(--ink2);white-space:nowrap}',
    '.rs-bars{display:flex;align-items:flex-end;justify-content:center;gap:3px;height:132px;width:100%;border-bottom:1px solid var(--line)}',
    '.rs-bars i{width:min(18px,32%)}',
    '.rs-cm{font-size:12px;color:var(--ink2);margin-top:2px}',
    '.rs-col[aria-pressed=true] .rs-cm{color:var(--ink);font-weight:600}',
    '.rs-cs{font-size:11.5px;color:var(--ink3);white-space:nowrap}',
    '.rs-foot{margin-top:8px}',
    '.rs-tbl td:first-child{white-space:nowrap}',
    '.rs-tbl th:first-child,.rs-tbl td:first-child{position:sticky;left:0;z-index:1;background:var(--panel);box-shadow:inset -1px 0 0 var(--line2)}',
    '.rs-tbl th:first-child{z-index:2;background:var(--sunk)}',
    '.rs-tbl td{font-variant-numeric:tabular-nums}',
    '.rs-src{font-weight:550}',
    '.rs-paid{margin-left:8px;font-size:11.5px;color:var(--ink3)}',
    '.rs-mute{color:var(--ink4)}',
    '.rs-tbl tfoot td{border-top:1px solid var(--line);border-bottom:0;font-weight:620;background:var(--sunk)}',
    '.rs-tbl tfoot td:first-child{background:var(--sunk)}',
    '.rs-tnote{padding:9px 14px;border-top:1px solid var(--line2)}',
    '.rs-dr .rs-demo{margin-bottom:12px}',
    '.rs-rep{border:1px solid var(--line);border-radius:var(--r);padding:14px 16px;margin-bottom:12px}',
    '.rs-rh{font-size:12px;color:var(--ink3);margin-bottom:8px}',
    '.rs-rep h3{font-size:12px;font-weight:600;color:var(--ink3);margin:14px 0 4px}',
    '.rs-rep p{font-size:13.5px;line-height:1.5}',
    '.rs-rep p+p{margin-top:6px}',
    '.rs-rep .rs-lead{font-size:15px;font-weight:550;line-height:1.45;letter-spacing:-.005em}',
    '@media (max-width:1060px){.rs-g{grid-template-columns:minmax(0,1fr)}}',
    '@media (max-width:760px){',
    '  .rs-seg{display:flex;width:100%}',
    '  .rs-seg button{flex:1;height:40px;padding:0 4px}',
    '  .btn.rs-act{height:40px}',
    '  .rs-step{grid-template-columns:96px minmax(0,1fr) 92px;gap:10px}',
    '  .rs-v{font-size:16px}',
    '  .rs-bars{height:110px}',
    '  .rs-tbl{min-width:640px}',
    '}'
  ].join('\n'));
})();
