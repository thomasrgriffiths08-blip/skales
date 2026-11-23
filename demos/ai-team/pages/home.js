// Home: the command centre. What the team did, what needs you, the money, and the team brain, on one screen.
// Every figure comes from the one model (ctx.model), with its working on hover or underneath.
import { esc, money, num, av, chip, hbars, working, foot, hhmm, $, $$, BY_ID, AGENTS } from "../ui.js";
import { longMemory } from "../brainnotes.js";
import { OFFER } from "../recorded.js";

const PAGE_OF = { seo: "search", ads: "ads", content: "content", paperwork: "paperwork", manager: "tasks", coach: "training" };
// site demo (unslop): no greeting, no ring, no hologram on Home. The date, what needs a person, and plain figures.
let brainStats = null;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function today() { const d = new Date(); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function ago(mins) { return mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`; }

// a day block's count can be a path into the model (see team.json): "firm.vans", or "employees.jobs.texts_sent/5" for a fifth of it
const countOf = (M, n) => { if (typeof n !== "string") return n; const [p, d] = n.split("/"), v = p.split(".").reduce((o, k) => o?.[k], M); return d ? Math.round(v / Number(d)) : v; };
function feedLines(ctx) {
  const today = new Date().toDateString();
  const live = [...(ctx.F.log || []), ...(ctx.office.brain?.log || [])].filter((l) => new Date(l.at).toDateString() === today && BY_ID[l.agent]).map((l) => ({ at: l.at, agent: l.agent, text: l.text }));
  const day = ctx.pages.team?.day || {}, now = new Date(), past = [];
  for (const [agent, blocks] of Object.entries(day)) for (const b of blocks) { const [h, m] = b.to.split(":").map(Number); const t = new Date(now); t.setHours(h, m, 0, 0); if (t < now) past.push({ at: +t, agent, text: b.what + (b.n ? ` (${num(countOf(ctx.model, b.n))} ${b.unit})` : "") }); }
  return [...live, ...past].sort((a, b) => b.at - a.at).slice(0, 7);
}

export default {
  css: `
  .pg-home .hh { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; }
  .pg-home .hh h1 { font-size: 36px; }
  .pg-home .hh .lede { margin-bottom: 0; }
  .pg-home .hh-r { flex: 1 1 340px; max-width: 480px; display: grid; gap: 10px; }
  .pg-home .hh-qs { display: flex; flex-wrap: wrap; gap: 6px; }
  .pg-home .hh-qs span { width: 100%; font-size: 12px; color: var(--ink-3); }
  .pg-home .hh-qs button { height: 30px; padding: 0 10px; border: 1px solid var(--line-2); border-radius: 6px; background: none; color: var(--ink-2); font: 400 13px var(--sans); cursor: pointer; }
  .pg-home .hh-qs button:hover { color: var(--ink); border-color: rgba(255, 255, 255, .28); }
  .pg-home .needs .ch .r { color: var(--amber-ink); font-size: 13px; }
  .pg-home .hero { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  @container (max-width: 860px) { .pg-home .hero { grid-template-columns: minmax(0, 1fr); } .pg-home .hh h1 { font-size: 30px; } }
  .pg-home .needs { padding: 20px 8px 8px; }
  .pg-home .needs .ch { padding: 0 12px; }
  .pg-home .needs .item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 4px 12px; align-items: start; padding: 12px; border-radius: 8px; cursor: pointer; border-top: 1px solid var(--line); transition: background .15s var(--ease); }
  .pg-home .needs .item:first-of-type { border-top: 0; }
  .pg-home .needs .item:hover { background: var(--panel-2); }
  .pg-home .needs .item b { font-weight: 500; color: var(--ink); }
  .pg-home .needs .item .d { grid-column: 2 / 4; font-size: 13px; color: var(--ink-3); }
  .pg-home .needs .item .t { font-size: 12px; color: var(--amber-ink); white-space: nowrap; padding-top: 2px; }
  .pg-home .needs .item .av-s { margin: 0; }
  .pg-home .needs .new b::after { content: "new"; margin-left: 8px; font: 500 12px var(--sans); color: var(--holo-2); }
  .pg-home .needs .more { padding: 8px 12px 4px; font-size: 13px; color: var(--ink-3); }
  .pg-home .given .gb { display: grid; gap: 4px; margin: 4px 0 20px; }
  .pg-home .given .gb b { font: 500 56px/1 var(--sans); font-variant-numeric: tabular-nums; letter-spacing: -.03em; color: var(--ink); }
  .pg-home .given .gb b small { font-size: 24px; font-weight: 400; color: var(--ink-3); margin-left: 4px; letter-spacing: 0; }
  .pg-home .given .gb span { font-size: 14px; color: var(--ink-2); }
  .pg-home .given .hbars { gap: 8px; }
  .pg-home .given .hb { grid-template-columns: minmax(96px, 128px) minmax(0, 1fr) 56px; }
  .pg-home .given .hb .av-s { width: 20px; height: 20px; font-size: 10px; margin-right: 8px; }
  .pg-home .given .hb em { color: var(--ink-2); }
  .pg-home .given .hb:first-child i b { background: var(--holo); }
  .pg-home .given .hb:not(:first-child) i b { background: rgba(111, 168, 220, .5); }
  .pg-home .kpis .tile { display: grid; grid-template-rows: auto auto 1fr; }
  .pg-home .people { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 8px; }
  .pg-home .pp { position: relative; padding: 16px; border-radius: 12px; border: 1px solid var(--line); background: var(--bg-2); cursor: pointer; display: grid; gap: 8px; transition: border-color .15s var(--ease); min-width: 0; }
  .pg-home .pp:hover { border-color: var(--line-2); }
  .pg-home .pp .top { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .pg-home .pp .ava { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 500; flex: none; }
  .pg-home .pp.busy .ava { box-shadow: 0 0 0 2px var(--panel), 0 0 0 3px var(--holo); }
  .pg-home .pp .nm { min-width: 0; }
  .pg-home .pp .nm b { display: block; color: var(--ink); font-weight: 500; }
  .pg-home .pp .nm span { font-size: 12px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
  .pg-home .pp .st { font-size: 13px; color: var(--ink-2); min-height: 40px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pg-home .pp.busy .st { color: var(--holo-2); }
  .pg-home .pp .k { font: 500 18px var(--sans); font-variant-numeric: tabular-nums; color: var(--ink); }
  .pg-home .pp .k small { font: 400 12px var(--sans); color: var(--ink-3); margin-left: 6px; }
  .pg-home .feed2 { display: grid; gap: 0; }
  .pg-home .feed2 .fl { display: grid; grid-template-columns: 48px 24px minmax(0, 1fr); gap: 8px; align-items: center; padding: 10px 0; border-top: 1px solid var(--line); font-size: 13px; color: var(--ink-2); }
  .pg-home .feed2 .fl:first-child { border-top: 0; }
  .pg-home .feed2 time { font-size: 12px; }
  .pg-home .feed2 .fl .av-s { margin: 0; }
  .pg-home .lower { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 16px; margin-top: 16px; }
  @container (max-width: 980px) { .pg-home .lower { grid-template-columns: minmax(0, 1fr); } }
  `,
  render(host, ctx) {
    const M = ctx.model, W = M.weeks, last = W[W.length - 1], E = M.employees;
    const busy = AGENTS.filter((a) => ctx.status(a.id).busy).length;
    const hrs = (id) => E[id].hours[E[id].hours.length - 1];
    const ranked = AGENTS.slice().sort((x, y) => hrs(y.id) - hrs(x.id));
    // what needs a person: the shared list, plus anything the team made live today
    const liveNeeds = [];
    for (const r of ctx.F.acts?.ads?.runs || []) if (!r.running && r.result) liveNeeds.push({ who: "Kieran", agent: "ads", what: "Say yes to Archie's new test ads", detail: r.service || r.input || "Three ads and a test plan", mins: Math.max(1, Math.round((Date.now() - r.at) / 60000)), page: "ads", fresh: true });
    for (const w of ctx.F.acts?.content?.writes || []) if (!w.running && w.result) liveNeeds.push({ who: "Priya", agent: "content", what: "Approve Clara's new draft", detail: w.result.title || w.topic || "", mins: Math.max(1, Math.round((Date.now() - w.at) / 60000)), page: "content", fresh: true });
    const needs = [...liveNeeds, ...M.needs];
    const lines = feedLines(ctx);
    host.innerHTML = `<div class="inner pg-home">
      <header class="hh">
        <div><div class="owner"><span class="ldot ${busy ? "busy" : ""}"></span>Kingpost AI team · ${AGENTS.length} on shift${busy ? ` · ${busy} working now` : ""}</div>
          <h1>${today()}</h1><p class="lede">What your AI team did this week, and the ${needs.length} things waiting on you.</p></div>
        <div class="hh-r"><form class="ask hh-ask" id="home-ask" autocomplete="off"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2.5 3h11v7.5H7L4 13v-2.5H2.5z"/></svg><input id="home-ask-in" aria-label="Ask your team" placeholder="Ask your team a question"><button>Ask</button></form>
          <div class="hh-qs" role="group" aria-label="Questions to try"><span>Or tap one:</span>${OFFER.slice(0, 3).map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div></div>
      </header>
      <section class="hero">
        <div class="card needs">
          <div class="ch"><h3>Needs you</h3><span class="r">${needs.length} things</span></div>
          ${needs.slice(0, 6).map((n, i) => `<div class="item ${n.fresh ? "new" : ""}" data-need="${i}">${av(n.agent)}<b>${esc(n.what)}</b><span class="t">${esc(n.who)} · ${ago(n.mins)}</span><span class="d">${esc(n.detail)}</span></div>`).join("")}
          ${needs.length > 6 ? `<div class="more">${needs.length - 6} more on the task board</div>` : ""}
        </div>
        <div class="card given">
          <div class="ch"><h3>Time given back</h3><span class="r">last 7 days</span></div>
          <div class="gb"><b class="num" data-count="${M.last7.hours}">${M.last7.hours}<small>h</small></b><span>${money(M.last7.money_saved, 0)} of office time</span></div>
          ${hbars(ranked.map((a) => ({ label: `${av(a.id)}${esc(a.name)}`, v: hrs(a.id), tip: E[a.id].kpis[2].working })), { fmt: (v) => `${v} h` })}
          ${working(M.last7.working.money_saved)}
        </div>
      </section>
      <section class="grid g4 kpis">
        <div class="card tile click" data-go="brain"><h3>Team brain</h3><div class="big bs-n">${brainStats ? num(brainStats.notes) : "…"}</div><div class="sub"><span class="bs-l">${brainStats ? num(brainStats.links) : "…"}</span> links · ${num(M.employees.coach.rules_in_force)} rules in force</div></div>
        <div class="card tile click" data-go="overview"><h3>Revenue</h3><div class="big" data-count="${last.revenue}">${money(last.revenue, 0)}</div><div class="sub up">+${M.last7.change.revenue_pct}% on the 7 days before</div></div>
        <div class="card tile click" data-go="ads"><h3>Leads from marketing</h3><div class="big" data-count="${M.last7.leads_marketing}">${M.last7.leads_marketing}</div><div class="sub up">+${M.last7.change.leads_marketing} on the 7 days before</div>${working(M.last7.working.leads_marketing)}</div>
        ${window.AI_TEAM_SHOW_PRICES ? `<div class="card tile click" data-go="costs"><h3>Running the team</h3><div class="big" data-count="${M.costs.weekly_running}">${money(M.costs.weekly_running, 0)}</div><div class="sub">a week, AI included</div>${working(M.costs.working.weekly_running)}</div>`
          : `<div class="card tile click" data-go="overview"><h3>Jobs booked</h3><div class="big" data-count="${M.last7.jobs_booked}">${num(M.last7.jobs_booked)}</div><div class="sub">last 7 days</div></div>`}<!-- site demo: no prices until Tom approves them (config.js) -->
      </section>
      <section class="lower">
        <div class="card"><div class="ch"><h3>Your team right now</h3><span class="r">click anyone</span></div>
          <div class="people">${AGENTS.map((a) => { const st = ctx.status(a.id), k = E[a.id].kpis[0]; return `<div class="pp ${st.busy ? "busy" : ""}" data-person="${a.id}"><div class="top"><span class="ava" style="background:${a.color}">${a.name[0]}</span><div class="nm"><b>${a.name}</b><span>${a.role}</span></div></div><div class="st">${esc(st.text || "")}</div><div class="k">${esc(k.value)}<small>${esc(k.label)}</small></div></div>`; }).join("")}</div>
        </div>
        <div class="card"><div class="ch"><h3>Live feed</h3><span class="r"><span class="ldot busy"></span> today</span></div>
          <div class="feed2">${lines.map((l) => `<div class="fl"><time>${hhmm(l.at)}</time>${av(l.agent)}<span>${esc(l.text)}</span></div>`).join("") || `<div class="empty">Quiet so far today.</div>`}</div>
        </div>
      </section>
      ${foot()}
    </div>`;
    // the brain's size, counted once (the hologram itself lives on the Brain page)
    if (!brainStats) ctx.graph().then((g) => { const mem = longMemory(g, { rules: ctx.pages.training?.library || [] }); const ids = new Set([...g.nodes, ...mem.nodes].map((n) => n.id)); brainStats = { notes: g.nodes.length + mem.nodes.length, links: [...g.links, ...mem.links].filter((l) => ids.has(l.source) && ids.has(l.target)).length }; $$(".bs-n").forEach((e) => (e.textContent = num(brainStats.notes))); $$(".bs-l").forEach((e) => (e.textContent = num(brainStats.links))); });
    $$("[data-need]", host).forEach((el) => (el.onclick = () => { const n = needs[+el.dataset.need]; n.page === "team" && !PAGE_OF[n.agent] ? ctx.openAgent(n.agent) : ctx.go(n.page || "tasks"); }));
    $$("[data-person]", host).forEach((el) => (el.onclick = () => { const id = el.dataset.person; PAGE_OF[id] ? ctx.go(PAGE_OF[id]) : ctx.openAgent(id); }));
    const askQ = (q) => { ctx.local.q = q; ctx.S.ps.ask = { ...(ctx.S.ps.ask || {}), pending: q }; ctx.go("ask"); };
    $("#home-ask", host).onsubmit = (e) => { e.preventDefault(); const q = $("#home-ask-in", host).value.trim(); if (q) askQ(q); };
    $$(".hh-qs button", host).forEach((b) => { b.onclick = () => askQ(b.dataset.q); });
  },
  onEvent(ev) { return ev.demo === "floor" || ev.type === "brain" || ev.type === "sheet" || ev.demo === "d2"; },
};
