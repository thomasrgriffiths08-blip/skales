/* Quotes: written prices that chase themselves. Sent by text and email, chased at 9am on day 2 and day 5
   until they answer, and accepted with the deposit paid from the customer's phone. */
(function(){
  var f = SYS.fmt, esc = SYS.esc;
  var sel = null, mode = 'view', bd = null, phoneView = false, inDrawer = false;
  var TEL = { Leeds: '0113 496 0418', Nottingham: '0115 496 0732', Reading: '0118 496 0251', York: '01632 960 377', Bristol: '0117 496 0864', Sheffield: '0114 496 0190' };
  var ST = { draft: 'Draft', sent: 'Sent', opened: 'Opened', accepted: 'Accepted', paid: 'Paid' };
  var EVK = { send: '', open: '', chase: 'ac', ok: 'good', paid: 'good' };

  function isPhone(){ return matchMedia('(max-width:760px)').matches; }
  function addDays(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function r2(n){ return Math.round(n * 100) / 100; }
  function money(n){ return f.money(r2(n)); }
  function find(id){ return SYS.S.quotes.filter(function(q){ return q.id === id; })[0]; }
  function cur(){ return find(sel); }
  function tot(q){ var t = SYS.quoteTotal(q); return { net: r2(t.net), vat: r2(t.vat), total: r2(t.total) }; }
  function dep(q){ if (q.dep) return q.dep; var t = tot(q).total; return t <= 0 ? 0 : Math.min(t, Math.max(20, Math.round(t * 0.2 / 5) * 5)); }
  function rel(d){ var s = f.day(d); return /^(Today|Yesterday|Tomorrow)$/.test(s) ? s.toLowerCase() : s; }
  function where(p){ return SYS.T.plates ? p.car : p.addr; }
  function open(q){ return q.st === 'sent' || q.st === 'opened'; }
  function won(q){ return q.st === 'accepted' || q.st === 'paid'; }
  function lastAt(q){ return q.ev.length ? Math.max.apply(null, q.ev.map(function(e){ return +e.at; })) : (q.made ? +q.made : 0); }
  function sorted(){ return SYS.S.quotes.slice().sort(function(a, b){ if ((a.st === 'draft') !== (b.st === 'draft')) return a.st === 'draft' ? -1 : 1; return lastAt(b) - lastAt(a); }); }
  function defSel(){ var l = sorted(), nd = l.filter(function(q){ return q.st !== 'draft'; })[0]; return (nd || l[0] || {}).id || null; }
  function validUntil(q){ return addDays(q.sentAt || SYS.now(), 30); }
  function tag(q){ return '<span class="tag' + (won(q) ? ' good' : '') + '" data-st="' + q.st + '">' + (ST[q.st] || 'Draft') + '</span>'; }
  function evAt(q, k){ return q.ev.filter(function(e){ return e.k === k; })[0]; }
  function chaseLine(q){
    if (q.st === 'draft') return 'Not sent yet';
    if (open(q)) return q.nextChase ? 'Next chase ' + f.when(q.nextChase) : 'Chasing finished';
    var ok = evAt(q, 'ok'), pd = evAt(q, 'paid');
    if (q.st === 'paid') return 'Paid in full' + (pd ? ' ' + rel(pd.at) : '');
    return 'Accepted' + (ok ? ' ' + rel(ok.at) + ' at ' + f.time(ok.at) : '') + ', chasing stopped';
  }

  /* ---------- the list ---------- */
  function row(q){
    var p = SYS.person(q.pid), on = sel === q.id && mode === 'view' && !isPhone();
    return '<button type="button" class="row click qt-r' + (on ? ' sel' : '') + '" id="q-' + q.id + '" data-act="sel" data-id="' + q.id + '">'
      + '<span class="main-t"><span class="t1"><span class="n">' + esc(p.name) + '</span><span class="no">' + esc(q.no) + '</span></span><span class="t2">' + esc(q.title) + '</span><span class="t3">' + esc(chaseLine(q)) + '</span></span>'
      + '<span class="end"><span class="amt">' + money(tot(q).total) + '</span>' + tag(q) + '</span></button>';
  }
  function listHTML(){
    var l = sorted(), w = 0, g = 0;
    SYS.S.quotes.forEach(function(q){ if (open(q)) w += tot(q).total; if (won(q)) g += tot(q).total; });
    return '<div class="card qt-list"><div class="card-h"><h2>' + l.length + ' quotes</h2><span class="meta">' + f.money(Math.round(w)) + ' waiting · ' + f.money(Math.round(g)) + ' won</span></div><div class="rows" id="qList">' + (l.length ? l.map(row).join('') : '<div class="empty">No quotes yet.</div>') + '</div></div>';
  }
  var HOW = '<div class="qt-how"><b>How chasing works</b>If they haven’t answered, a short text goes at 9am on day 2 and again on day 5. It stops the moment they accept. Nobody has to remember to chase.</div>';

  /* ---------- the document ---------- */
  function docHTML(q){
    var t = SYS.T, p = SYS.person(q.pid), tt = tot(q), d = dep(q), sent = q.sentAt || SYS.now();
    var items = q.items.map(function(x){
      var amt = x.qty * x.rate;
      return '<tr><td>' + esc(x.name) + (x.qty !== 1 && x.rate ? '<small class="only-m">' + esc(String(x.qty)) + ' × ' + money(x.rate) + '</small>' : '') + '</td><td class="r hide-m">' + esc(String(x.qty)) + '</td><td class="r hide-m">' + (x.rate ? money(x.rate) : '') + '</td><td class="r">' + (x.rate ? money(amt) : 'Included') + '</td></tr>';
    }).join('');
    return '<div class="qt-doc" id="qPaper">'
      + '<div class="qt-hd"><div class="qt-biz"><span class="biz-mark">' + esc(t.mark) + '</span><div><b>' + esc(t.biz) + '</b><small>' + esc(t.town) + ' · ' + esc(t.domain) + ' · ' + esc(TEL[t.town] || '') + '</small></div></div>'
      + '<div class="qt-k"><b>Quote</b><span>' + esc(q.no) + '</span></div></div>'
      + '<div class="qt-meta"><div><span class="lbl-s">For</span><b>' + esc(p.name) + '</b><span>' + esc(where(p)) + '</span></div>'
      + '<div><span class="lbl-s">' + (q.sentAt ? 'Sent' : 'Date') + '</span><span>' + esc(f.date(sent)) + '</span></div>'
      + '<div><span class="lbl-s">Valid until</span><span>' + esc(f.date(validUntil(q))) + '</span></div></div>'
      + '<h3 class="qt-title">' + esc(q.title) + '</h3>'
      + '<table class="qt-items"><thead><tr><th>Item</th><th class="r hide-m">Qty</th><th class="r hide-m">Rate</th><th class="r">Amount</th></tr></thead><tbody>' + items + '</tbody></table>'
      + '<dl class="qt-tot"><dt>Subtotal</dt><dd>' + money(tt.net) + '</dd><dt>VAT' + (q.vat ? ' at 20%' : '') + '</dt><dd>' + (q.vat ? money(tt.vat) : 'Not charged') + '</dd><dt class="t">Total</dt><dd class="t">' + money(tt.total) + '</dd></dl>'
      + '<p class="qt-terms">To go ahead: ' + money(d) + ' deposit when you accept, the rest when the work is done. Valid for 30 days. The price covers everything listed.</p>'
      + '</div>';
  }
  function phoneHTML(q){
    var t = SYS.T, p = SYS.person(q.pid), tt = tot(q), d = dep(q), body;
    if (won(q)){
      body = '<div class="qt-ok">' + SYS.icon('check') + '</div><p class="qt-pt">Quote accepted</p><p class="qt-pp">' + esc(q.title) + ', ' + money(tt.total) + '</p>'
        + '<p class="qt-pn">' + (q.st === 'paid' ? 'Paid in full. Thank you.' : money(d) + ' deposit paid. ' + esc(t.owner) + ' will be in touch to fix a date.') + '</p>';
    } else {
      body = '<p class="qt-pp">Hi ' + esc(SYS.first(p.name)) + ', here’s your quote from ' + esc(t.owner) + ' at ' + esc(t.biz) + '.</p><p class="qt-pt">' + esc(q.title) + '</p>'
        + '<div class="qt-pl">' + q.items.map(function(x){ return '<div><span>' + esc(x.name) + (x.qty !== 1 ? ' × ' + esc(String(x.qty)) : '') + '</span><span>' + (x.rate ? money(x.qty * x.rate) : 'Included') + '</span></div>'; }).join('')
        + (q.vat ? '<div class="v"><span>VAT</span><span>' + money(tt.vat) + '</span></div>' : '') + '<div class="t"><span>Total</span><span>' + money(tt.total) + '</span></div></div>'
        + '<p class="qt-pn">Valid until ' + esc(f.date(validUntil(q))) + '. The rest is due when the work is done.</p>'
        + '<button type="button" class="btn ink wide qt-acc" data-act="accept" id="qAccept"' + (q.st === 'draft' ? ' disabled' : '') + '>Accept and pay ' + money(d) + ' deposit</button>'
        + '<p class="qt-pn qt-c">Questions? Just reply to the text.</p>';
    }
    return SYS.phone({ title: t.biz, sub: 'Quote ' + q.no, av: t.biz, id: 'qPhoneB', body: body, cap: q.st === 'draft' ? 'A preview. They can’t see it until you send it.' : 'Their phone. The link came by text and email.' });
  }
  function li(at, text, sub, k, due){
    var n = SYS.now(), d = at && !(+SYS.sod(at) === +SYS.sod(n)) ? f.day(at) : '', small = [d, sub].filter(Boolean).join(' · ');
    return '<li' + (due ? ' class="qt-due"' : '') + '><span class="tm">' + (at ? f.time(at) : '') + '</span><div class="ev" data-k="' + (k || '') + '"><b>' + esc(text) + '</b>' + (small ? '<small>' + esc(small) + '</small>' : '') + '</div></li>';
  }
  function tlHTML(q){
    var n = SYS.now(), items = q.ev.slice().sort(function(a, b){ return a.at - b.at; }).map(function(e){
      var sub = e.k === 'send' ? 'With a link to view, accept and pay' : (e.k === 'chase' ? 'Sent on its own' : '');
      return li(e.at, e.text, sub, EVK[e.k] || '');
    });
    if (open(q) && q.sentAt){
      var c1 = q.nextChase, c2 = SYS.at(addDays(SYS.sod(q.sentAt), 5), 9, 0);
      if (c1 && c1 > n) items.push(li(c1, 'Chase due', 'Text: “Just checking you got the quote. Any questions, reply here.”', '', true));
      if (c2 > n && (!c1 || +c2 > +c1)) items.push(li(c2, 'Last chase', 'Then it stops', '', true));
    }
    if (q.st === 'draft') items.push(li(null, 'Not sent yet', 'Send it and the chasing starts on its own', '', true));
    if (q.st === 'accepted') items.push(li(null, 'Final invoice', 'Goes when the work is done', '', true));
    return '<ul class="tl" id="qTl">' + items.join('') + '</ul>';
  }
  function docActs(q){
    return (q.st === 'draft' ? '<button type="button" class="btn sm pri" data-act="edit" id="qEdit">' + SYS.icon('send') + 'Edit and send</button>' : '')
      + '<button type="button" class="btn sm" data-act="phone" id="qPhone" aria-pressed="' + phoneView + '">' + SYS.icon('eye') + (phoneView ? 'Back to quote' : 'What they see') + '</button>';
  }
  function docCard(q){
    return '<div class="card" id="qDoc"><div class="card-h"><div class="qt-dh"><h2>' + esc(q.no) + '</h2>' + tag(q) + '</div><div class="qt-da">' + docActs(q) + '</div></div>'
      + (phoneView ? '<div class="card-b qt-pv">' + phoneHTML(q) + '</div>' : docHTML(q)) + '</div>';
  }
  function tlCard(q){
    return '<div class="card" id="qTlCard"><div class="card-h"><h2>Timeline</h2><span class="meta">' + esc(chaseLine(q)) + '</span></div><div class="card-b qt-tlb">' + tlHTML(q) + '</div>' + HOW + '</div>';
  }

  /* ---------- the builder ---------- */
  function clone(x){ return { name: x.name, qty: x.qty, rate: x.rate }; }
  function useTpl(i){ var tp = SYS.T.quotes[i]; if (!tp) return; bd.tpl = i; bd.title = tp.title; bd.svc = tp.svc; bd.items = tp.items.map(function(x){ return { name: x[0], qty: x[1], rate: x[2] }; }); }
  function startBuild(o){
    var t = SYS.T, S = SYS.S;
    bd = { qid: null, pid: o.pid || null, title: '', svc: o.svc || null, items: [], vat: t.key !== 'clinic', convo: o.convo || null, tpl: -1 };
    if (o.q){ bd.qid = o.q.id; bd.pid = o.q.pid; bd.title = o.q.title; bd.svc = o.q.svc; bd.items = o.q.items.map(clone); bd.vat = o.q.vat; t.quotes.forEach(function(x, i){ if (x.title === o.q.title) bd.tpl = i; }); }
    else {
      var ti = -1;
      if (o.svc) t.quotes.forEach(function(x, i){ if (ti < 0 && x.svc === o.svc) ti = i; }); else ti = 0;
      if (ti >= 0) useTpl(ti);
      else { var s = SYS.svc(o.svc); bd.title = s.name; bd.items = [{ name: s.name, qty: 1, rate: s.price }]; }
      if (!bd.pid){ var used = S.quotes.map(function(q){ return q.pid; }).concat(S.convos.map(function(c){ return c.pid; })); bd.pid = (S.people.filter(function(p){ return used.indexOf(p.id) < 0; })[2] || S.people[0]).id; }
    }
    mode = 'build'; phoneView = false;
  }
  function nextNo(){ return 'Q-' + (SYS.S.quotes.reduce(function(a, q){ return Math.max(a, parseInt(q.no.slice(2), 10) || 0); }, 1000) + 1); }
  function valid(){ return bd && bd.pid && bd.items.some(function(x){ return x.name.trim() && x.qty > 0; }) && tot(bd).total > 0; }
  function builderHTML(){
    var t = SYS.T, S = SYS.S, tt = tot(bd), c = bd.convo ? S.convos.filter(function(x){ return x.id === bd.convo; })[0] : null, ex = bd.qid ? find(bd.qid) : null;
    var ppl = S.people.slice().sort(function(a, b){ return a.name < b.name ? -1 : 1; });
    var ctx = '';
    if (c){ var m = c.msgs.filter(function(x){ return x.k === 'them'; })[0]; ctx = '<p class="qt-ctx">From the Inbox: <b>' + esc(SYS.person(c.pid).name) + '</b> asked' + (m ? ' “' + esc(m.text) + '”' : ' for a price') + '</p>'; }
    var lines = bd.items.map(function(x, i){
      return '<div class="qt-ln"><label class="qt-f nm"><span class="only-m">Item</span><input class="inp" data-i="' + i + '" data-f="name" value="' + esc(x.name) + '" aria-label="Item ' + (i + 1) + '" placeholder="What’s included"></label>'
        + '<label class="qt-f"><span class="only-m">Qty</span><input class="inp" type="number" inputmode="decimal" step="any" min="0" data-i="' + i + '" data-f="qty" value="' + esc(String(x.qty)) + '" aria-label="Quantity"></label>'
        + '<label class="qt-f"><span class="only-m">Rate, £</span><input class="inp" type="number" inputmode="decimal" step="any" min="0" data-i="' + i + '" data-f="rate" value="' + esc(String(x.rate)) + '" aria-label="Rate in pounds"></label>'
        + '<span class="qt-f"><span class="only-m">Amount</span><span class="amt" data-amt="' + i + '">' + (x.rate ? money(x.qty * x.rate) : 'Included') + '</span></span>'
        + '<button type="button" class="x qt-rm" data-act="rmLine" data-i="' + i + '" aria-label="Remove line">' + SYS.icon('x') + '</button></div>';
    }).join('');
    return '<div class="card" id="qBuilder"><div class="card-h"><h2>' + (ex ? 'Draft ' + esc(ex.no) : 'New quote') + '</h2><span class="meta mono">' + esc(ex ? ex.no : nextNo()) + '</span></div><div class="card-b">'
      + ctx
      + '<div class="grid g2"><div class="field"><label for="qCust">Customer</label><select class="inp" id="qCust">' + ppl.map(function(p){ return '<option value="' + p.id + '"' + (p.id === bd.pid ? ' selected' : '') + '>' + esc(p.name) + ' · ' + esc(t.plates ? p.car.split(' · ')[1] : p.addr.split(', ').pop()) + '</option>'; }).join('') + '</select></div>'
      + '<div class="field"><label for="qTitle">What it’s for</label><input class="inp" id="qTitle" value="' + esc(bd.title) + '" placeholder="Short title the customer sees"></div></div>'
      + '<div class="qt-start"><span class="lbl-s">Start from</span>' + t.quotes.map(function(x, i){ return '<button type="button" class="btn sm" data-act="tpl" data-i="' + i + '" id="qTpl-' + i + '" aria-pressed="' + (bd.tpl === i) + '">' + esc(x.title) + '</button>'; }).join('') + '</div>'
      + '<div class="qt-lines"><div class="qt-lh"><span>Item</span><span class="r">Qty</span><span class="r">Rate, £</span><span class="r">Amount</span><span></span></div>' + (lines || '<div class="empty">No lines yet. Add one or start from a template.</div>') + '</div>'
      + '<div class="qt-add"><button type="button" class="btn sm" data-act="addLine" id="qAddLine">' + SYS.icon('plus') + 'Add a line</button><select class="inp" id="qAddSvc" aria-label="Add from your price list"><option value="">Add from your price list</option>' + t.services.map(function(s){ return '<option value="' + s.id + '">' + esc(s.name) + ' · ' + esc(f.price(s)) + '</option>'; }).join('') + '</select></div>'
      + '<div class="qt-sum"><div class="qt-vat"><span class="lbl-s">VAT</span><div class="seg" role="group" aria-label="VAT" id="qVat"><button type="button" data-act="vat" data-v="1" id="qVatOn" aria-pressed="' + bd.vat + '">Add 20%</button><button type="button" data-act="vat" data-v="0" id="qVatOff" aria-pressed="' + !bd.vat + '">No VAT</button></div></div>'
      + '<dl class="qt-tot"><dt>Subtotal</dt><dd id="qSub">' + money(tt.net) + '</dd><dt>VAT</dt><dd id="qVatV">' + (bd.vat ? money(tt.vat) : 'None') + '</dd><dt class="t">Total</dt><dd class="t" id="qTot">' + money(tt.total) + '</dd><dt>Deposit to accept</dt><dd id="qDep">' + money(dep({ items: bd.items, vat: bd.vat })) + '</dd></dl></div>'
      + '</div><div class="qt-bf"><p class="note">Goes by text and email with a link to accept and pay. Valid 30 days. Chased at 9am on day 2 and day 5 if they don’t answer.</p>'
      + '<button type="button" class="btn ghost" data-act="cancel" id="qCancel">Cancel</button><button type="button" class="btn" data-act="draft" id="qDraft">Save draft</button><button type="button" class="btn pri" data-act="send" id="qSend"' + (valid() ? '' : ' disabled') + '>' + SYS.icon('send') + 'Send quote</button></div></div>';
  }
  function totals(){
    if (!bd) return;
    var tt = tot(bd), set = function(id, v){ var e = document.getElementById(id); if (e) e.textContent = v; };
    set('qSub', money(tt.net)); set('qVatV', bd.vat ? money(tt.vat) : 'None'); set('qTot', money(tt.total)); set('qDep', money(dep({ items: bd.items, vat: bd.vat })));
    bd.items.forEach(function(x, i){ var e = document.querySelector('[data-amt="' + i + '"]'); if (e) e.textContent = x.rate ? money(x.qty * x.rate) : 'Included'; });
    var sb = document.getElementById('qSend'); if (sb) sb.disabled = !valid();
  }
  function wireBuilder(){
    var el = document.getElementById('qBuilder'); if (!el) return;
    el.addEventListener('input', function(e){
      var x = e.target, k = x.getAttribute('data-f');
      if (k){ var it = bd.items[+x.getAttribute('data-i')]; if (!it) return; it[k] = k === 'name' ? x.value : (parseFloat(x.value) || 0); totals(); return; }
      if (x.id === 'qTitle') bd.title = x.value;
    });
    el.addEventListener('change', function(e){
      var x = e.target;
      if (x.id === 'qCust') bd.pid = x.value;
      if (x.id === 'qAddSvc' && x.value){ var s = SYS.svc(x.value); bd.items.push({ name: s.name, qty: 1, rate: s.price }); if (!bd.title.trim()) bd.title = s.name; repaint(); }
    });
  }

  /* ---------- painting ---------- */
  function paint(v){
    v = v || document.getElementById('view'); if (!v) return;
    var ph = isPhone();
    var keep = document.activeElement, kid = keep && keep.closest && keep.closest('#qBuilder') ? (keep.id || (keep.getAttribute('data-f') ? keep.getAttribute('data-f') + ':' + keep.getAttribute('data-i') : '')) : '', ks = null;
    try { ks = kid ? keep.selectionStart : null; } catch (e){ ks = null; }
    if (mode === 'build' && bd){
      v.innerHTML = ph ? builderHTML() : '<div class="qt-wrap">' + listHTML() + builderHTML() + '</div>';
      wireBuilder();
      if (kid){
        var nk = kid.indexOf(':') > 0 ? v.querySelector('[data-f="' + kid.split(':')[0] + '"][data-i="' + kid.split(':')[1] + '"]') : document.getElementById(kid);
        if (nk){ nk.focus(); try { if (ks != null) nk.setSelectionRange(ks, ks); } catch (e){} }
      }
      return;
    }
    if (ph){ v.innerHTML = listHTML() + '<div class="card qt-hcard">' + HOW + '</div>'; return; }
    var q = cur();
    v.innerHTML = '<div class="qt-wrap">' + listHTML() + '<div class="grid qt-main">' + (q ? docCard(q) + tlCard(q) : '<div class="card"><div class="empty">No quotes yet. Write the first one.</div></div>') + '</div></div>';
  }
  function drawerBody(q){ return '<div class="card qt-dcard">' + (phoneView ? '<div class="card-b qt-pv">' + phoneHTML(q) + '</div>' : docHTML(q)) + '</div><div class="card qt-dcard" style="margin-top:14px"><div class="card-h"><h2>Timeline</h2>' + tag(q) + '</div><div class="card-b qt-tlb">' + tlHTML(q) + '</div>' + HOW + '</div>'; }
  function drawerFoot(q){ return '<div class="qt-dfa">' + docActs(q) + '</div>'; }
  function openDrawer(){
    var q = cur(); if (!q) return; inDrawer = true;
    SYS.drawer({ title: q.no + ' · ' + SYS.person(q.pid).name, body: drawerBody(q), foot: drawerFoot(q), on: tint });
  }
  function refreshDrawer(){
    if (SYS.cur !== 'quotes' || !inDrawer) return;
    var d = SYS.drawerEl(), q = cur(); if (!d || !q) return;
    var b = d.querySelector('.drawer-b'), ft = d.querySelector('.drawer-f'), h = d.querySelector('.drawer-h h2');
    if (h) h.textContent = q.no + ' · ' + SYS.person(q.pid).name;
    if (b) b.innerHTML = drawerBody(q);
    if (ft) ft.innerHTML = drawerFoot(q);
  }
  function repaint(){ if (SYS.cur !== 'quotes') return; paint(); refreshDrawer(); }

  /* ---------- what happens ---------- */
  function save(st){
    if (!bd) return null;
    var S = SYS.S, t = SYS.T, n = SYS.now(), items = bd.items.filter(function(x){ return x.name.trim(); }).map(clone);
    if (!items.length) return null;
    var q = bd.qid ? find(bd.qid) : null;
    if (!q){ q = { id: SYS.uid('q'), no: nextNo(), pid: bd.pid, ev: [], made: n }; S.quotes.push(q); }
    q.pid = bd.pid; q.title = bd.title.trim() || items[0].name; q.svc = bd.svc; q.items = items; q.vat = bd.vat; q.st = st;
    if (st === 'sent'){
      q.sentAt = n; q.ev.push({ at: n, text: 'Sent by text and email', k: 'send' }); q.nextChase = SYS.at(addDays(SYS.sod(n), 2), 9, 0);
      var c = bd.convo ? S.convos.filter(function(x){ return x.id === bd.convo; })[0] : null;
      if (c){
        c.st = 'quoted'; c.qid = q.id;
        c.msgs.push({ k: 'us', text: 'Here’s your quote: ' + q.title + ', ' + money(tot(q).total) + (q.vat ? ' including VAT' : '') + '. You can accept it and pay the deposit here: ' + t.domain + '/q/' + q.no.slice(2), at: n, who: t.owner });
      }
    }
    return q;
  }
  function send(){
    if (!valid()) return;
    var q = save('sent'); if (!q) return;
    var qid = q.id, fn = SYS.first(SYS.person(q.pid).name);
    bd = null; mode = 'view'; sel = q.id; phoneView = false;
    SYS.changed();
    SYS.toast(q.no + ' sent to ' + fn + ' by text and email');
    if (isPhone()) openDrawer();
    SYS.later(4500, function(){
      var x = find(qid); if (!x || x.st !== 'sent') return;
      x.st = 'opened'; x.ev.push({ at: SYS.now(), text: 'Opened by ' + fn, k: 'open' });
      SYS.toast(fn + ' opened ' + x.no);
      SYS.changed(); refreshDrawer();
    });
  }
  function accept(q){
    if (!q || !open(q)) return;
    var n = SYS.now(), d = dep(q), fn = SYS.first(SYS.person(q.pid).name);
    q.ev.push({ at: n, text: 'Accepted by ' + fn, k: 'ok' });
    q.ev.push({ at: n, text: 'Deposit paid, ' + money(d), k: 'ok' });
    q.st = 'accepted'; q.dep = d; q.nextChase = null;
    SYS.changed(); refreshDrawer();
    SYS.toast(q.no + ' accepted. ' + money(d) + ' deposit paid, chasing stopped.');
  }

  SYS.module('quotes', {
    label: 'Quotes', short: 'Quotes', icon: 'quotes', title: 'Quotes', blurb: 'Quotes that chase themselves',
    sub: function(){ return 'Written quotes that chase themselves. Customers accept and pay the deposit from their phone.'; },
    count: function(){ var n = SYS.S.quotes.filter(function(q){ return q.st === 'draft'; }).length; return n || ''; },
    hot: function(){ return SYS.S.quotes.some(function(q){ return q.st === 'draft'; }); },
    actions: function(){ return '<button class="btn pri" type="button" data-act="new" id="qNew">' + SYS.icon('plus') + 'New quote</button>'; },
    render: function(v, opt){
      phoneView = false; inDrawer = false;
      if (opt && opt.newFor && SYS.person(opt.newFor)) startBuild({ pid: opt.newFor, svc: opt.svc && SYS.svc(opt.svc) ? opt.svc : null, convo: opt.convo || null });
      else { mode = 'view'; bd = null; if (opt && opt.ref && find(opt.ref)) sel = opt.ref; }
      if (!sel || !cur()) sel = defSel();
      paint(v);
      if (mode === 'view' && opt && opt.ref && isPhone()) openDrawer();
    },
    update: function(v){ paint(v); refreshDrawer(); },
    act: function(a, el){
      if (a === 'sel'){ sel = el.getAttribute('data-id'); mode = 'view'; bd = null; phoneView = false; if (isPhone()) openDrawer(); else paint(); return; }
      if (a === 'new'){ SYS.closeDrawer(true); inDrawer = false; startBuild({}); paint(); window.scrollTo(0, 0); return; }
      if (a === 'edit'){ var dq = cur(); if (!dq || dq.st !== 'draft') return; SYS.closeDrawer(true); inDrawer = false; startBuild({ q: dq }); paint(); window.scrollTo(0, 0); return; }
      if (a === 'phone'){ phoneView = !phoneView; if (inDrawer && SYS.drawerEl()) refreshDrawer(); else paint(); return; }
      if (a === 'accept') return accept(cur());
      if (!bd) return;
      if (a === 'tpl'){ useTpl(+el.getAttribute('data-i')); paint(); return; }
      if (a === 'addLine'){ bd.items.push({ name: '', qty: 1, rate: 0 }); paint(); var ins = document.querySelectorAll('#qBuilder [data-f="name"]'); if (ins.length) ins[ins.length - 1].focus(); return; }
      if (a === 'rmLine'){ bd.items.splice(+el.getAttribute('data-i'), 1); paint(); return; }
      if (a === 'vat'){ bd.vat = el.getAttribute('data-v') === '1'; paint(); return; }
      if (a === 'cancel'){ bd = null; mode = 'view'; paint(); return; }
      if (a === 'draft'){ var q = save('draft'); if (!q) return; bd = null; mode = 'view'; sel = q.id; SYS.changed(); SYS.toast(q.no + ' saved as a draft'); return; }
      if (a === 'send') return send();
    },
    leave: function(){ phoneView = false; inDrawer = false; }
  });
  SYS.on(function(o){ if (o.trade){ sel = null; mode = 'view'; bd = null; phoneView = false; inDrawer = false; } });
  try { matchMedia('(max-width:760px)').addEventListener('change', function(){ if (SYS.cur === 'quotes') paint(); }); } catch (e){}

  function tint(d){ d.style.setProperty('--ac', SYS.T.c); d.classList.add('qt-dr'); }
  SYS.css('quotes', [
    '#view[data-mod=quotes],.qt-dr{--ac-soft:color-mix(in srgb,var(--ac) 8%,#fff);--ac-line:color-mix(in srgb,var(--ac) 28%,#fff);--ac-text:color-mix(in srgb,var(--ac) 88%,#000)}',
    '.qt-wrap{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:14px;align-items:start}',
    '.qt-main{min-width:0}',
    '.qt-r{width:100%;text-align:left;align-items:flex-start}',
    '.qt-r .t1 .no{font-family:var(--mono);font-size:11.5px;font-weight:400;color:var(--ink3);letter-spacing:0;flex:none}',
    '.qt-r .t3{display:block;margin-top:3px;font-size:12px;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.qt-r .end{display:flex;flex-direction:column;align-items:flex-end;gap:6px}',
    '.qt-r .amt{font-size:13.5px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}',
    '.tag[data-st=opened]{color:var(--ac-text);border-color:var(--ac-line)}',
    '.qt-dh{display:flex;align-items:center;gap:8px;min-width:0}',
    '.qt-dh h2{font-family:var(--mono);font-size:13px;font-weight:500}',
    '.qt-da,.qt-dfa{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}',
    '.qt-dfa{width:100%}',
    '.qt-doc{padding:22px 24px 20px}',
    '.qt-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}',
    '.qt-biz{display:flex;gap:10px;align-items:center;min-width:0}',
    '.qt-biz b{display:block;font-size:14px;font-weight:620;line-height:1.25}',
    '.qt-biz small{display:block;font-size:12px;color:var(--ink3)}',
    '.qt-k{flex:none;text-align:right}',
    '.qt-k b{display:block;font-size:16px;font-weight:620;letter-spacing:-.01em;line-height:1.25}',
    '.qt-k span{font-family:var(--mono);font-size:12px;color:var(--ink3)}',
    '.qt-meta{display:grid;grid-template-columns:minmax(0,1.6fr) repeat(2,minmax(0,1fr));gap:12px;margin-top:20px;padding:12px 0;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);font-size:13px}',
    '.qt-meta span,.qt-meta b{display:block}',
    '.qt-meta b{font-weight:600}',
    '.qt-meta span:not(.lbl-s){color:var(--ink2)}',
    '.qt-meta .lbl-s{margin-bottom:2px}',
    '.qt-title{margin:18px 0 6px;font-size:15px;font-weight:620;letter-spacing:-.01em}',
    '.qt-items{width:100%;border-collapse:collapse;font-size:13px}',
    '.qt-items th{font-size:11.5px;font-weight:550;color:var(--ink3);text-align:left;padding:7px 0;border-bottom:1px solid var(--line)}',
    '.qt-items td{padding:9px 0;border-bottom:1px solid var(--line2);vertical-align:top}',
    '.qt-items .r{text-align:right;padding-left:14px;white-space:nowrap;font-variant-numeric:tabular-nums}',
    '.qt-items small{display:block;color:var(--ink3);font-size:12px}',
    '.qt-tot{display:grid;grid-template-columns:1fr auto;gap:5px 0;width:min(100%,280px);margin:12px 0 0 auto;font-size:13px}',
    '.qt-tot dt{color:var(--ink2)}',
    '.qt-tot dd{margin:0;padding-left:24px;text-align:right;font-variant-numeric:tabular-nums}',
    '.qt-tot .t{padding-top:7px;border-top:1px solid var(--line);font-weight:620;font-size:15px;color:var(--ink)}',
    '.qt-terms{margin-top:16px;font-size:12px;color:var(--ink3);line-height:1.5}',
    '.qt-pv{background:var(--sunk);padding:20px}',
    '.qt-tlb{padding-top:6px;padding-bottom:8px}',
    '.tl .qt-due .ev b{font-weight:500;color:var(--ink2)}',
    '.tl .qt-due .tm{color:var(--ink4)}',
    '.qt-how{padding:11px 14px;border-top:1px solid var(--line2);background:var(--sunk);font-size:12.5px;line-height:1.5;color:var(--ink2);border-radius:0 0 var(--r) var(--r)}',
    '.qt-how b{display:block;color:var(--ink);font-weight:600;margin-bottom:1px}',
    '.qt-hcard{margin-top:14px}',
    '.qt-hcard .qt-how{border-top:0;border-radius:var(--r)}',
    /* their phone */
    '.qt-pp{font-size:12.5px;color:var(--ink2)}',
    '.qt-pt{font-size:15px;font-weight:620;letter-spacing:-.01em}',
    '.qt-pl{border:1px solid var(--line);border-radius:var(--r);padding:6px 10px;font-size:12px}',
    '.qt-pl div{display:flex;justify-content:space-between;gap:10px;padding:3px 0}',
    '.qt-pl div span:last-child{white-space:nowrap;font-variant-numeric:tabular-nums}',
    '.qt-pl .v{color:var(--ink3)}',
    '.qt-pl .t{border-top:1px solid var(--line2);margin-top:3px;padding-top:6px;font-weight:620;font-size:13px}',
    '.qt-pn{font-size:12px;color:var(--ink3);line-height:1.45}',
    '.qt-c{text-align:center}',
    '.btn.qt-acc{height:44px;margin-top:2px}',
    '.qt-ok{display:grid;place-items:center;width:38px;height:38px;margin:12px 0 4px;border-radius:50%;background:var(--ink);color:#fff}',
    '.qt-ok svg{width:20px;height:20px}',
    /* builder */
    '.qt-ctx{margin-bottom:14px;padding:9px 11px;border:1px solid var(--line2);border-radius:var(--r);background:var(--sunk);font-size:12.5px;color:var(--ink2)}',
    '.qt-ctx b{color:var(--ink);font-weight:600}',
    '.qt-start{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:16px 0 12px}',
    '.qt-start .lbl-s{margin-right:4px}',
    '.qt-start .btn[aria-pressed=true]{border-color:var(--ink3);background:var(--hover)}',
    '.qt-lines{border:1px solid var(--line);border-radius:var(--r);overflow:hidden}',
    '.qt-lh,.qt-ln{display:grid;grid-template-columns:minmax(0,1fr) 64px 92px 84px 30px;gap:8px;align-items:center;padding:6px 8px}',
    '.qt-lh{background:var(--sunk);border-bottom:1px solid var(--line);font-size:11.5px;font-weight:550;color:var(--ink3)}',
    '.qt-lh .r{text-align:right}',
    '.qt-ln+.qt-ln{border-top:1px solid var(--line2)}',
    '.qt-ln .inp{height:32px;padding:0 8px}',
    '.qt-ln input[type=number]{text-align:right;-moz-appearance:textfield}',
    '.qt-ln input[type=number]::-webkit-outer-spin-button,.qt-ln input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}',
    '.qt-f{display:block;min-width:0}',
    '.qt-f>span.only-m{display:block;font-size:11.5px;font-weight:550;color:var(--ink3);margin-bottom:3px}',
    '.qt-ln .amt{display:block;text-align:right;font-variant-numeric:tabular-nums;font-size:13px}',
    '.qt-ln .x{width:30px;height:30px}',
    '.qt-add{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}',
    '.qt-add select{width:auto;max-width:100%;height:28px;font-size:12.5px;padding:0 8px;color:var(--ink2)}',
    '.qt-sum{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-top:18px;flex-wrap:wrap}',
    '.qt-sum .qt-tot{margin:0}',
    '.qt-vat{display:flex;flex-direction:column;gap:6px}',
    '.qt-bf{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 14px;border-top:1px solid var(--line2);background:var(--sunk);border-radius:0 0 var(--r) var(--r)}',
    '.qt-bf .note{flex:1;min-width:220px}',
    '@media (max-width:1180px){.qt-wrap{grid-template-columns:minmax(0,300px) minmax(0,1fr)}.qt-meta{grid-template-columns:1fr 1fr}.qt-meta>div:first-child{grid-column:1/-1}}',
    '@media (max-width:760px){',
    '  .qt-wrap{grid-template-columns:minmax(0,1fr)}',
    '  .qt-doc{padding:16px 14px}',
    '  .qt-hd{flex-direction:column;gap:10px}',
    '  .qt-k{text-align:left;display:flex;align-items:baseline;gap:8px}',
    '  .qt-meta{grid-template-columns:1fr 1fr;margin-top:14px}',
    '  .qt-meta>div:first-child{grid-column:1/-1}',
    '  .qt-pv{padding:14px 8px}',
    '  .qt-lh{display:none}',
    '  .qt-ln{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 40px;align-items:end;padding:10px}',
    '  .qt-ln .nm{grid-column:1/-1}',
    '  .qt-ln .inp{height:42px}',
    '  .qt-ln .amt{height:42px;line-height:42px}',
    '  .qt-ln .x{width:40px;height:42px}',
    '  .qt-add .btn,.qt-add select,.qt-start .btn,.qt-bf .btn,.qt-da .btn,.qt-dfa .btn{height:42px}',
    '  .qt-add select{flex:1;font-size:16px}',
    '  .qt-vat .seg button{height:40px}',
    '  .qt-sum .qt-tot{width:100%}',
    '  .qt-bf .note{min-width:0;flex-basis:100%}',
    '  .qt-bf .btn{flex:1 1 auto}',
    '  .qt-dfa .btn{flex:1 1 auto}',
    '  #qNew{height:42px}',
    '}'
  ].join('\n'));
})();
