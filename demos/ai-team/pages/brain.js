// Team brain (video 2): everything the team knows, as a 3D hologram. Every point of light is a note: a customer, a job,
// an invoice, an email, a certificate, a rule. Notes cluster round the employee who uses them; pulses show the team
// reaching into its memory. Today's live notes come from the server (also written to state/vault/ as Obsidian notes);
// the long memory around them is sample history (brainnotes.js). The hologram survives redraws.
import { esc, num, av, chip, head, hbars, md, foot, working, seg, $, $$, BY_ID } from "../ui.js";
import { createBrain3D, TYPES } from "../brain3d.js";
import { longMemory } from "../brainnotes.js";

const FILTERS = [["customer", "Customers"], ["job", "Jobs"], ["invoice", "Invoices"], ["email", "Emails"], ["doc", "Documents"], ["cert", "Certificates"], ["property", "Properties"], ["rule", "Rules"], ["lesson", "Lessons"], ["search", "Searches"], ["page", "Pages"], ["campaign", "Ads"], ["engineer", "Engineers"], ["supplier", "Suppliers"]];
let el = null, brain = null, live = null, mem = null, ready = false, refetchT = 0;
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
function addedToday() { if (!brain) return 0; const t = today0(); return brain.nodes.filter((n) => (n.type !== "agent") && ((n.at && n.at >= t && n.at > 1e12) || n.day === 0)).length; }

async function load(ctx, keepSel = true) {
  const g = await ctx.graph();
  live = g; mem = longMemory(g, { rules: ctx.pages.training?.library || [], model: ctx.model }); // rebuilt each load so it always draws about 500
  // long memory links to customers etc. that only exist in the live graph: keep both sets
  brain.setData({ nodes: [...g.nodes, ...mem.nodes], links: [...g.links, ...mem.links] });
  ready = true;
  if (keepSel && ctx.local.sel) brain.select(ctx.local.sel);
}
async function openNote(ctx, id) {
  const n = brain.node(id); if (!n) return;
  ctx.local.sel = id; brain.select(id); brain.burst(n.agent || id.replace("agent:", ""));
  if (n.md) ctx.local.note = { label: n.label, type: n.type, markdown: n.md, links: neighbours(id), file: null };
  else { ctx.local.note = { label: n.label, type: n.type, markdown: "Opening…", links: [] }; try { const r = await ctx.api("/api/floor/note", { id }); ctx.local.note = { ...r, links: neighbours(id) }; } catch { ctx.local.note = { label: n.label, type: n.type, markdown: `# ${n.label}`, links: neighbours(id) }; } }
  ctx.redraw();
}
function neighbours(id) { return brain.links.filter((l) => l.source === id || l.target === id).map((l) => brain.node(l.source === id ? l.target : l.source)).filter(Boolean).sort((a, b) => (a.type === "agent" ? -1 : 0) - (b.type === "agent" ? -1 : 0)).slice(0, 14).map((n) => ({ id: n.id, label: n.label, type: n.type })); }

export default {
  css: `
  .pg-brain .stage3 { position: relative; height: clamp(440px, 64cqh, 720px); padding: 0; overflow: hidden; background: radial-gradient(600px 380px at 50% 45%, rgba(40, 130, 210, .16), transparent 70%), linear-gradient(180deg, rgba(10, 20, 32, .95), rgba(4, 9, 15, .98)); }
  .pg-brain .stage3 > .b3 { position: absolute; inset: 0; }
  .pg-brain .hudtop { position: absolute; z-index: 2; top: 16px; left: 16px; right: 16px; display: flex; gap: 12px; align-items: flex-start; justify-content: space-between; pointer-events: none; flex-wrap: wrap; }
  .pg-brain .hudtop > * { pointer-events: auto; }
  .pg-brain .stats { display: flex; gap: 24px; padding: 12px 16px; background: rgba(4, 9, 15, .72); border: 1px solid var(--line); border-radius: 14px; }
  .pg-brain .stats div { display: grid; }
  .pg-brain .stats b { font: 300 26px/1.1 var(--mono); color: #fff; text-shadow: none; }
  .pg-brain .stats span { font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-brain .tools { display: flex; gap: 8px; align-items: center; }
  .pg-brain .tools input { height: 40px; width: 240px; padding: 0 12px; background: rgba(4, 9, 15, .8); }
  .pg-brain .filters { position: absolute; z-index: 2; left: 16px; right: 16px; bottom: 16px; display: flex; gap: 6px; flex-wrap: wrap; pointer-events: none; }
  .pg-brain .filters button { pointer-events: auto; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--line); background: rgba(4, 9, 15, .78); color: var(--ink-2); font-size: 12px; cursor: pointer; }
  .pg-brain .filters button i { width: 7px; height: 7px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
  .pg-brain .filters button[aria-pressed="true"] { border-color: rgba(70, 200, 255, .6); color: #fff; background: rgba(70, 200, 255, .14); }
  .pg-brain .reader { position: absolute; z-index: 3; top: 16px; right: 16px; bottom: 60px; width: min(360px, 46%); display: flex; flex-direction: column; background: rgba(4, 9, 15, .92); border: 1px solid var(--line-2); border-radius: 16px; box-shadow: 0 0 40px -16px var(--holo-glow); overflow: hidden; animation: slidein .35s cubic-bezier(.2, .8, .2, 1); }
  @keyframes slidein { from { transform: translateX(24px); opacity: 0; } }
  .pg-brain .reader header { display: flex; gap: 8px; align-items: center; padding: 12px 12px 12px 16px; border-bottom: 1px solid var(--line); }
  .pg-brain .reader header .t { font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-brain .reader header button { margin-left: auto; }
  .pg-brain .reader .body { flex: 1; overflow-y: auto; padding: 16px; }
  .pg-brain .reader .lk { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .pg-brain .reader .lk button { cursor: pointer; }
  .pg-brain .hovertip { position: absolute; z-index: 4; pointer-events: none; padding: 6px 10px; border-radius: 8px; background: #0b1622; border: 1px solid var(--line-2); font-size: 12px; color: #fff; white-space: nowrap; transform: translate(12px, -110%); }
  .pg-brain .lower { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 16px; }
  @container (max-width: 900px) { .pg-brain .lower { grid-template-columns: minmax(0, 1fr); } .pg-brain .tools input { width: 170px; } }
  @container (max-width: 640px) { .pg-brain .reader { left: 16px; width: auto; top: auto; height: 60%; } .pg-brain .stats { gap: 16px; } .pg-brain .stats b { font-size: 20px; } }
  .pg-brain .learned .it { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 12px; padding: 12px 0; border-top: 1px solid rgba(255, 255, 255, .05); cursor: pointer; }
  .pg-brain .learned .it:first-child { border-top: 0; }
  .pg-brain .learned .it b { color: #fff; font-weight: 500; }
  .pg-brain .learned .it .sub2 { grid-column: 2; font-size: 12px; color: var(--ink-3); }
  .pg-brain .learned .it .av-s { margin: 0; grid-row: span 2; }
  .pg-brain .obs code, .pg-brain .two code { font: 12px var(--mono); color: var(--holo-2); }
  .pg-brain .stats .bn { display: grid; align-content: center; padding-right: 20px; border-right: 1px solid var(--line); }
  .pg-brain .stats .bn em { font-style: normal; font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-brain .stats .bn strong { font: 500 15px/1.3 var(--sans); color: #fff; }
  .pg-brain .two .tb { display: grid; grid-template-columns: minmax(0, 1fr) 190px minmax(0, 1.35fr); gap: 16px; align-items: stretch; margin-top: 4px; }
  .pg-brain .two .bx { padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .015); display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .pg-brain .two .k { font-style: normal; font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-brain .two .nm { font: 500 22px/1.1 var(--sans); color: #fff; letter-spacing: -.01em; margin-top: -4px; }
  .pg-brain .two p { margin: 0; color: var(--ink-2); font-size: 13.5px; line-height: 1.45; }
  .pg-brain .two .mini { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; margin: 4px 0 2px; }
  .pg-brain .two .mini div { display: grid; }
  .pg-brain .two .mini b { font: 300 26px/1.1 var(--mono); color: #fff; text-shadow: none; }
  .pg-brain .two .mini span { font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-brain .two .bx > .btn { align-self: flex-start; margin-top: auto; }
  .pg-brain .two .mr { display: grid; gap: 8px; padding-top: 12px; border-top: 1px solid var(--line); }
  .pg-brain .two .mr .mrh { font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-brain .two .mr div { display: grid; }
  .pg-brain .two .mr b { color: #fff; font-weight: 500; font-size: 13.5px; }
  .pg-brain .two .mr small { font-size: 12px; color: var(--ink-3); }
  .pg-brain .two .seg { flex-wrap: nowrap; max-width: 100%; }
  .pg-brain .two .lnk { display: flex; flex-direction: column; justify-content: center; gap: 14px; padding: 8px 0; text-align: center; }
  .pg-brain .two .pipe { position: relative; height: 2px; margin: 4px 6px; background: linear-gradient(90deg, rgba(70, 200, 255, .15), var(--holo), rgba(70, 200, 255, .15)); box-shadow: 0 0 12px var(--holo-glow); }
  .pg-brain .two .pipe i { position: absolute; top: -4px; left: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--holo); box-shadow: 0 0 14px var(--holo); animation: bflow 2.6s cubic-bezier(.5, 0, .5, 1) infinite; }
  .pg-brain .two .pipe i + i { animation-direction: reverse; animation-delay: -1.3s; }
  @keyframes bflow { from { left: 0; } to { left: calc(100% - 10px); } }
  .pg-brain .two .steps3 { display: grid; gap: 8px; text-align: left; }
  .pg-brain .two .steps3 div { display: flex; gap: 10px; align-items: center; font-size: 13px; color: var(--ink); }
  .pg-brain .two .steps3 i { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font: 500 11px var(--mono); font-style: normal; color: var(--holo-2); border: 1px solid rgba(70, 200, 255, .45); box-shadow: 0 0 10px -2px var(--holo-glow); }
  .pg-brain .two .wb { display: grid; }
  .pg-brain .two .wb b { font: 300 24px/1.1 var(--mono); color: #fff; text-shadow: none; }
  .pg-brain .two .wb span { font-size: 11px; color: var(--ink-3); }
  .pg-brain .two .nbl { display: grid; gap: 2px; }
  .pg-brain .two .nl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: start; text-align: left; padding: 9px 8px; border: 0; border-radius: 10px; background: none; color: inherit; cursor: pointer; font: inherit; }
  .pg-brain .two .nl:hover, .pg-brain .two .nl[aria-expanded="true"] { background: var(--holo-tint); }
  .pg-brain .two .nl .av-s { margin: 1px 0 0; }
  .pg-brain .two .nl b { display: block; color: #fff; font-weight: 500; font-size: 13.5px; line-height: 1.35; }
  .pg-brain .two .nl small { display: block; margin-top: 2px; font-size: 12px; color: var(--ink-3); }
  .pg-brain .two .nl .why { display: block; margin-top: 6px; font-size: 12.5px; line-height: 1.45; color: var(--ink-2); }
  .pg-brain .two .seg { align-self: flex-start; }
  @container (max-width: 980px) { .pg-brain .two .tb { grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); } .pg-brain .two .lnk { grid-column: 1 / -1; grid-row: 2; flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px 24px; } .pg-brain .two .lnk .pipe { flex: 1 1 120px; } .pg-brain .two .steps3 { grid-auto-flow: column; } }
  @container (max-width: 640px) { .pg-brain .two .tb { grid-template-columns: minmax(0, 1fr); } .pg-brain .two .lnk { grid-row: auto; } .pg-brain .two .steps3 { grid-auto-flow: row; } .pg-brain .stats .bn { padding-right: 12px; } }
  `,
  render(host, ctx) {
    const L = ctx.local;
    if (!el) { el = document.createElement("div"); brain = createBrain3D(el, { lite: ctx.S3?.tier === "lite", labels: true, autoRotate: 0.07, distance: 46 }); }
    const nodes = brain.nodes, links = brain.links;
    // the hologram draws the most used notes; the figures are the whole brain's (brainnotes.js totals)
    const counts = {}; for (const n of nodes) if (n.type !== "agent") counts[n.type] = (counts[n.type] || 0) + 1;
    const drawnN = Object.values(counts).reduce((a, b) => a + b, 0);
    const tot = mem?.totals || counts, totalN = mem?.total || drawnN, totalL = mem?.totalLinks || links.length, F = ctx.model.firm;
    const kinds = Object.entries(tot).map(([t, v]) => ({ t, v, label: FILTERS.find((f) => f[0] === t)?.[1] || (t === "person" ? "People" : TYPES[t]?.label || t) })).sort((a, b) => b.v - a.v), top = kinds.slice(0, 8), rest = kinds.slice(8);
    const restN = rest.reduce((a, k) => a + k.v, 0), topN = top.reduce((a, k) => a + k.v, 0);
    const learned = [...ctx.lessons.slice().reverse().map((l) => ({ agent: l.agent, text: l.text, src: "Learned today" })), ...(ctx.pages.training?.library || []).slice().sort((a, b) => b.day_offset - a.day_offset).slice(0, 6).map((r) => ({ agent: r.agent, text: r.text, src: r.detail || "A correction" }))].slice(0, 7);
    const sel = L.types || [];
    // Brain 2, the notebook: lines picked from the same rules the Training page shows, so the two pages agree
    const lib = ctx.pages.training?.library || [], NB = ctx.data?.notebook || {};
    const pick = (keys) => (keys || []).map((k) => lib.find((r) => r.text.startsWith(k))).filter(Boolean).map((r) => ({ agent: r.agent, text: r.text, detail: r.detail, why: r.story, used: r.used }));
    const custLimits = (ctx.data?.most_read || []).filter((m) => /£/.test(m.why)).map((m) => ({ agent: m.agents[0], text: `${m.label}: ${m.why}.`, detail: "Customer note", why: `Read ${m.times} times in the last 7 days by ${m.agents.map((a) => BY_ID[a]?.name).filter(Boolean).join(", ")}.` }));
    const every = [
      ...ctx.lessons.slice().reverse().map((l) => ({ agent: l.agent, text: l.text, detail: "Learned today", why: l.why || "Learned live in the office today." })),
      ...(ctx.F.coach?.rules_this_week || []).map((r) => ({ agent: r.agent, text: r.rule, detail: r.came_from, why: `Came from: ${r.came_from}.` })),
      ...lib.slice().sort((a, b) => b.day_offset - a.day_offset).map((r) => ({ agent: r.agent, text: r.text, detail: r.detail, why: r.story, used: r.used })),
    ];
    const nbTab = L.nb || "price";
    const nbList = (nbTab === "price" ? [...pick(NB.price), ...custLimits] : nbTab === "never" ? pick(NB.never) : every).slice(0, 5);
    host.innerHTML = `<div class="inner pg-brain">
      ${head({ title: "Team brain", lede: "Everything the team knows, in one place. Every point of light is a note: a customer, a job, an invoice, a rule. When one of them learns something, the rest can use it straight away.", actions: `<button class="btn" id="b-grow">Grow it again</button><button class="btn primary" data-go="training">Teach it something</button>` })}
      <section class="card hud stage3">
        <div id="b-slot"></div>
        <div class="hudtop">
          <div class="stats"><div class="bn"><em>Brain 1 · The map</em><strong>Graphify</strong></div><div><b>${num(totalN)}</b><span>notes</span></div><div><b>${num(totalL)}</b><span>links</span></div><div><b>${num(addedToday())}</b><span>added today</span></div></div>
          <div class="tools"><input id="b-q" placeholder="Search the brain… “Clifton”" value="${esc(L.q || "")}" autocomplete="off"></div>
        </div>
        <div class="filters">${FILTERS.filter(([t]) => counts[t]).map(([t, label]) => `<button data-type="${t}" aria-pressed="${sel.includes(t)}" data-tip="${esc(`${num(tot[t] || counts[t])} in the brain, the ${num(counts[t])} most used on the map`)}"><i style="background:${TYPES[t].c};color:${TYPES[t].c}"></i>${label} <span class="num">${num(tot[t] || counts[t])}</span></button>`).join("")}</div>
        ${L.note ? `<aside class="reader"><header>${L.note.type === "agent" ? "" : `<span class="t">${esc(TYPES[L.note.type]?.label || L.note.type)}</span>`}<button class="btn sm" id="b-close">Close</button></header>
          <div class="body"><div class="doc">${md(L.note.markdown)}</div>${L.note.links?.length ? `<div class="sec"><h3>Linked notes</h3><div class="lk">${L.note.links.map((x) => `<button class="chip ${x.type === "agent" ? "holo" : ""}" data-open="${esc(x.id)}">${esc(x.label.length > 34 ? x.label.slice(0, 32) + "…" : x.label)}</button>`).join("")}</div></div>` : ""}
          ${L.note.file ? working(`Saved as ${L.note.file}`) : ""}</div></aside>` : ""}
        <div class="hovertip" id="b-tip" hidden></div>
      </section>
      ${working(`Showing the ${num(drawnN)} most used of ${num(totalN)} notes, so it runs smoothly on a laptop. Drag to turn it, scroll to zoom, click any point to read it.`)}
      <section class="card two" style="margin-top:16px">
        <div class="ch"><h3>Two brains, linked</h3><span class="r">Most AI forgets your business when you close the chat</span></div>
        <div class="tb">
          <div class="bx">
            <em class="k">Brain 1 · The map</em><b class="nm">Graphify</b>
            <p>Every customer, job and supplier is a dot. The lines show how they connect.</p>
            <div class="mini"><div><b>${num(tot.customer || 0)}</b><span>customers</span></div><div><b>${num(tot.job || 0)}</b><span>jobs</span></div><div><b>${num(tot.engineer || 0)}</b><span>engineers</span></div><div><b>${num(tot.supplier || 0)}</b><span>suppliers</span></div></div>
            ${working(`${F.contract_clients} contract clients, ${F.engineers} engineers, ${F.vans} vans, ${F.depots} depots`)}
            <div class="mr"><span class="mrh">Most read, last 7 days</span>${(ctx.data?.most_read || []).slice(0, 3).map((m) => `<div><b>${esc(m.label)}</b><small>${m.agents.map((a) => BY_ID[a]?.name).filter(Boolean).join(", ")} · ${num(m.times)} times</small></div>`).join("")}</div>
            <button class="btn sm" id="b-showmap">Show them on the map</button>
          </div>
          <div class="lnk">
            <em class="k" style="color:#fff">Linked</em>
            <div class="pipe"><i></i><i></i></div>
            <div class="steps3"><div><i>1</i>Reads both before it acts</div><div><i>2</i>Does the work</div><div><i>3</i>Writes back what it learned</div></div>
            <div class="wb"><b>${num(addedToday())}</b><span>notes written back today</span></div>
          </div>
          <div class="bx">
            <em class="k">Brain 2 · The notebook</em><b class="nm">Obsidian</b>
            <p>How you price, what you never say, every rule you've set.</p>
            ${seg([["price", "How you price"], ["never", "Never say"], ["rules", `All rules · ${every.length}`]], nbTab, "nb")}
            <div class="nbl">${nbList.map((r, i) => `<button class="nl" data-nbi="${i}" aria-expanded="${L.nbOpen === `${nbTab}:${i}`}">${av(r.agent)}<span><b>${esc(r.text)}</b><small>${esc(BY_ID[r.agent]?.name || "")} · ${esc(r.detail || "")}${r.used ? ` · used ${num(r.used)} times` : ""}</small>${L.nbOpen === `${nbTab}:${i}` && r.why ? `<span class="why">${esc(r.why)}</span>` : ""}</span></button>`).join("")}</div>
            ${nbTab === "rules" && every.length > 5 ? `<button class="btn sm" data-go="training">All ${every.length} rules in Training</button>` : ""}
          </div>
        </div>
        ${working("Today's notes are also saved as linked Markdown files in state/vault/. Open that folder as a vault in Obsidian and you get the same notebook on your own machine.")}
      </section>
      <section class="lower" style="margin-top:16px">
        <div class="card learned"><div class="ch"><h3>What it learned lately</h3><span class="r">click one to find it</span></div>
          ${learned.map((r, i) => `<div class="it" data-learn="${i}">${av(r.agent)}<b>${esc(r.text)}</b><span class="sub2">${esc(BY_ID[r.agent]?.name || "")} · ${esc(r.src)}</span></div>`).join("") || `<div class="empty">Nothing yet.</div>`}
        </div>
        <div class="grid" style="gap:16px">
          <div class="card"><div class="ch"><h3>What's in it</h3><span class="r">${num(totalN)} notes</span></div>
            ${hbars(top.map((k) => ({ label: k.label, v: k.v })), { fmt: (v) => num(v) })}
            ${working(rest.length ? `The ${top.length} biggest kinds, ${num(topN)} notes, + ${rest.length} more kinds, ${num(restN)} = ${num(totalN)}` : `${top.map((k) => num(k.v)).join(" + ")} = ${num(totalN)}`)}</div>
        </div>
      </section>
      ${foot()}
    </div>`;
    $("#b-slot", host).replaceWith(el);
    if (!ready) load(ctx).then(() => ctx.redraw());
    brain.onPick((n) => { if (n) openNote(ctx, n.id); });
    const tip = $("#b-tip", host);
    brain.onHover((n, e) => { if (!n) { tip.hidden = true; return; } const r = el.getBoundingClientRect(); tip.hidden = false; tip.textContent = `${n.label}  ·  ${TYPES[n.type]?.label || n.type}`; tip.style.left = e.clientX - r.left + "px"; tip.style.top = e.clientY - r.top + "px"; });
    $("#b-grow", host).onclick = () => { L.note = null; L.sel = null; brain.select(null); ctx.redraw(); brain.replay(14000); };
    $("#b-close", host)?.addEventListener("click", () => { L.note = null; L.sel = null; brain.select(null); ctx.redraw(); });
    $$("[data-open]", host).forEach((b) => (b.onclick = () => openNote(ctx, b.dataset.open)));
    $$("[data-type]", host).forEach((b) => (b.onclick = () => { const t = b.dataset.type, cur = new Set(L.types || []); cur.has(t) ? cur.delete(t) : cur.add(t); L.types = [...cur]; brain.filter(new Set(L.types)); ctx.redraw(); }));
    const q = $("#b-q", host); q.oninput = () => { L.q = q.value; brain.search(L.q); };
    q.onkeydown = (e) => { if (e.key === "Enter") { const m = brain.nodes.find((n) => n.type !== "agent" && n.label.toLowerCase().includes(q.value.trim().toLowerCase())); if (m) openNote(ctx, m.id); } };
    $$("[data-learn]", host).forEach((b) => (b.onclick = () => { const r = learned[+b.dataset.learn]; const n = brain.nodes.find((x) => (x.type === "rule" || x.type === "lesson") && r.text.startsWith(x.label.replace(/…$/, ""))) || brain.node(`agent:${r.agent}`); if (n) openNote(ctx, n.id); }));
    $$("[data-nb]", host).forEach((b) => (b.onclick = () => { L.nb = b.dataset.nb; L.nbOpen = null; ctx.redraw(); }));
    $$("[data-nbi]", host).forEach((b) => (b.onclick = () => { const k = `${nbTab}:${b.dataset.nbi}`; L.nbOpen = L.nbOpen === k ? null : k; ctx.redraw(); }));
    $("#b-showmap", host).onclick = () => { L.note = null; L.sel = null; brain.select(null); L.types = ["customer", "job", "engineer", "supplier"]; ctx.redraw(); requestAnimationFrame(() => document.querySelector(".pg-brain .stage3")?.scrollIntoView({ behavior: "smooth", block: "center" })); };
    if (L.types?.length) brain.filter(new Set(L.types));
    if (L.q) brain.search(L.q);
  },
  onEvent(ev, ctx) {
    if (!brain) return false;
    const agent = ev.line?.agent || (ev.type === "relay" && { seo: "seo", content: "content", ads: "ads", review: "manager" }[ev.relay?.stage]) || (ev.type === "doc" && "paperwork") || (ev.type === "drift" && "manager") || (ev.type === "act" && { search: "seo", content: "content", ads: "ads", paperwork: "paperwork", tasks: "manager", check: "coach", ask: "manager" }[ev.page]);
    if (agent) brain.burst(agent);
    if (["relay", "doc", "drift", "act", "lessons", "brain", "reset"].includes(ev.type)) { clearTimeout(refetchT); refetchT = setTimeout(() => load(ctx).then(() => ctx.redraw()), 1500); }
    return false;
  },
};
