// Home: the command centre. What the team did, what needs you, the money, and the team brain, on one screen.
// Every figure comes from the one model (ctx.model), with its working on hover or underneath.
import { esc, money, num, av, chip, ring, spark, working, foot, hhmm, $, $$, BY_ID, AGENTS } from "../ui.js";
import { createBrain3D } from "../brain3d.js";
import { longMemory } from "../brainnotes.js";

const PAGE_OF = { seo: "search", ads: "ads", content: "content", paperwork: "paperwork", manager: "tasks", coach: "training" };
// the ring is one holographic family: brightest for whoever gave back the most time
function shades(M) {
  const order = AGENTS.map((a) => a.id).sort((x, y) => M.employees[y].hours.at(-1) - M.employees[x].hours.at(-1)), out = {};
  order.forEach((id, i) => { const k = i / (order.length - 1); out[id] = `hsl(${196 + k * 14}, ${100 - k * 30}%, ${82 - k * 44}%)`; });
  return out;
}
let BRIGHT = {};
let brainEl = null, brain = null, brainStats = { notes: 0, links: 0 };

function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }
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
  .pg-home .hh h1 { font-size: 40px; }
  .pg-home .hh .lede { margin-bottom: 0; }
  .pg-home .hh-ask { flex: 1 1 340px; max-width: 480px; }
  .pg-home .hero { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
  @container (max-width: 1080px) { .pg-home .hero { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .pg-home .hero-brain { grid-column: 1 / -1; } }
  @container (max-width: 560px) { .pg-home .hero { grid-template-columns: minmax(0, 1fr); } }
  @container (max-width: 760px) { .pg-home .hero-ring .ring { width: min(220px, 100%) !important; } .pg-home .leg { grid-template-columns: minmax(0, 1fr); } .pg-home .hh h1 { font-size: 32px; } }
  .pg-home .hero-ring { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 12px; }
  .pg-home .hero-ring .ring { width: min(280px, 100%) !important; height: auto !important; aspect-ratio: 1; }
  .pg-home .leg { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 16px; width: 100%; font-size: 12.5px; }
  .pg-home .leg span { display: flex; align-items: center; gap: 8px; color: var(--ink-2); white-space: nowrap; overflow: hidden; }
  .pg-home .leg i { width: 8px; height: 8px; border-radius: 2px; flex: none; box-shadow: 0 0 8px currentColor; }
  .pg-home .leg em { margin-left: auto; font-style: normal; font-family: var(--mono); color: var(--ink); }
  .pg-home .needs .item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 4px 12px; align-items: start; padding: 12px; border-radius: 12px; cursor: pointer; border: 1px solid transparent; }
  .pg-home .needs .item:hover { background: var(--amber-tint); border-color: rgba(255, 181, 71, .3); }
  .pg-home .needs .item b { font-weight: 600; color: #fff; }
  .pg-home .needs .item .d { grid-column: 2 / 4; font-size: 12.5px; color: var(--ink-3); }
  .pg-home .needs .item .t { font: 400 11.5px var(--mono); color: var(--amber-ink); white-space: nowrap; }
  .pg-home .needs .item .av-s { margin: 0; }
  .pg-home .needs .new b::after { content: "new"; margin-left: 8px; font: 600 12.5px var(--sans); letter-spacing: 0; text-transform: none; color: var(--holo); }
  .pg-home .hero-brain { display: flex; flex-direction: column; min-height: 340px; padding: 0; overflow: hidden; }
  .pg-home .hero-brain .ch { padding: 20px 20px 0; }
  .pg-home #home-brain-slot { flex: 1; min-height: 280px; position: relative; }
  .pg-home #home-brain-slot > .b3 { position: absolute; inset: 0; }
  .pg-home .bstats { display: flex; gap: 16px; padding: 0 20px 16px; font-size: 12px; color: var(--ink-3); }
  .pg-home .bstats b { font: 400 18px var(--mono); color: #fff; display: block; }
  .pg-home .kpis .tile { display: grid; grid-template-rows: auto auto 1fr auto; }
  .pg-home .kpis .spark { margin-top: 12px; width: 100%; height: 32px; }
  .pg-home .people { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 12px; }


  .pg-home .pp { position: relative; padding: 16px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); cursor: pointer; display: grid; gap: 8px; transition: border-color .15s, box-shadow .2s; min-width: 0; }
  .pg-home .pp:hover { border-color: rgba(70, 200, 255, .45); box-shadow: 0 0 28px -12px var(--holo-glow); }
  .pg-home .pp .top { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .pg-home .pp .ava { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 600; flex: none; box-shadow: 0 0 0 2px rgba(255, 255, 255, .12); }
  .pg-home .pp.busy .ava { box-shadow: 0 0 0 2px var(--holo), 0 0 18px var(--holo); animation: pulse 1.8s ease-in-out infinite; }
  .pg-home .pp .nm { min-width: 0; }
  .pg-home .pp .nm b { display: block; color: #fff; font-weight: 600; }
  .pg-home .pp .nm span { font-size: 12px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
  .pg-home .pp .st { font-size: 12.5px; color: var(--ink-2); min-height: 36px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pg-home .pp.busy .st { color: var(--holo-2); }
  .pg-home .pp .k { font: 400 20px var(--mono); color: #fff; }
  .pg-home .pp .k small { font: 400 11.5px var(--sans); color: var(--ink-3); margin-left: 6px; }
  .pg-home .feed2 { display: grid; gap: 0; }
  .pg-home .feed2 .fl { display: grid; grid-template-columns: 56px 28px minmax(0, 1fr); gap: 8px; align-items: center; padding: 10px 0; border-top: 1px solid rgba(255, 255, 255, .05); font-size: 13px; color: var(--ink-2); }
  .pg-home .feed2 .fl:first-child { border-top: 0; }
  .pg-home .feed2 time { font-size: 11.5px; color: var(--holo-2); }
  .pg-home .feed2 .fl .av-s { margin: 0; }
  .pg-home .lower { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 16px; margin-top: 16px; }
  @container (max-width: 980px) { .pg-home .lower { grid-template-columns: minmax(0, 1fr); } }
  `,
  render(host, ctx) {
    const M = ctx.model, W = M.weeks, last = W[W.length - 1], E = M.employees;
    BRIGHT = shades(M);
    const busy = AGENTS.filter((a) => ctx.status(a.id).busy).length;
    const segs = AGENTS.map((a) => ({ v: E[a.id].hours[E[a.id].hours.length - 1], color: BRIGHT[a.id], label: `${a.name}: ${E[a.id].hours[E[a.id].hours.length - 1]} h` }));
    // what needs a person: the shared list, plus anything the team made live today
    const liveNeeds = [];
    for (const r of ctx.F.acts?.ads?.runs || []) if (!r.running && r.result) liveNeeds.push({ who: "Kieran", agent: "ads", what: "Say yes to Archie's new test ads", detail: r.service || r.input || "Three ads and a test plan", mins: Math.max(1, Math.round((Date.now() - r.at) / 60000)), page: "ads", fresh: true });
    for (const w of ctx.F.acts?.content?.writes || []) if (!w.running && w.result) liveNeeds.push({ who: "Priya", agent: "content", what: "Approve Clara's new draft", detail: w.result.title || w.topic || "", mins: Math.max(1, Math.round((Date.now() - w.at) / 60000)), page: "content", fresh: true });
    const needs = [...liveNeeds, ...M.needs];
    const lines = feedLines(ctx);
    host.innerHTML = `<div class="inner pg-home">
      <header class="hh">
        <div><div class="owner"><span class="ldot ${busy ? "busy" : ""}"></span>Kingpost AI team · ${AGENTS.length} on shift${busy ? ` · ${busy} working now` : ""}</div>
          <h1>${greeting()}, Kieran.</h1><p class="lede">Here's what your AI team did, and the few things that need you.</p></div>
        <form class="ask hh-ask" id="home-ask" autocomplete="off"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2.5 3h11v7.5H7L4 13v-2.5H2.5z"/></svg><input id="home-ask-in" placeholder="Ask your team anything… “Who owes us money?”"><button>Ask</button></form>
      </header>
      <section class="hero">
        <div class="card hud hero-ring">
          <div class="ch" style="width:100%"><h3>Time given back</h3><span class="r">last 7 days</span></div>
          ${ring(segs, { size: 280, value: String(M.last7.hours), unit: "h", label: "given back", sub: `${money(M.last7.money_saved, 0)} of office time` })}
          <div class="leg">${AGENTS.map((a) => `<span data-tip="${esc(E[a.id].kpis[2].working)}"><i style="background:${BRIGHT[a.id]};color:${BRIGHT[a.id]}"></i>${a.name}<em>${E[a.id].hours[E[a.id].hours.length - 1]} h</em></span>`).join("")}</div>
          ${working(M.last7.working.money_saved)}
        </div>
        <div class="card needs">
          <div class="ch"><h3>Needs you</h3><span class="r">${chip(`${needs.length} things`, "amber")}</span></div>
          ${needs.slice(0, 6).map((n, i) => `<div class="item ${n.fresh ? "new" : ""}" data-need="${i}">${av(n.agent)}<b>${esc(n.what)}</b><span class="t">${esc(n.who)} · ${ago(n.mins)}</span><span class="d">${esc(n.detail)}</span></div>`).join("")}
          ${needs.length > 6 ? `<div class="working-line" style="padding:0 12px">+ ${needs.length - 6} more on the task board</div>` : ""}
        </div>
        <div class="card hero-brain click" data-go="brain">
          <div class="ch"><h3>Team brain</h3><span class="r">${chip("live", "holo")}</span></div>
          <div id="home-brain-slot"></div>
          <div class="bstats"><div><b class="bs-n">${num(brainStats.notes)}</b>notes</div><div><b class="bs-l">${num(brainStats.links)}</b>links</div><div><b>${num(M.employees.coach.rules_in_force)}</b>rules</div></div>
        </div>
      </section>
      <section class="grid g4 kpis">
        <div class="card tile hud click" data-go="overview"><h3>Office time saved</h3><div class="big" data-count="${M.last7.money_saved}">${money(M.last7.money_saved, 0)}</div><div class="sub">last 7 days</div>${spark(W.map((w) => w.money_saved))}${working(M.last7.working.money_saved)}</div>
        <div class="card tile click" data-go="overview"><h3>Revenue</h3><div class="big" data-count="${last.revenue}">${money(last.revenue, 0)}</div><div class="sub up">+${M.last7.change.revenue_pct}% on the 7 days before</div>${spark(W.map((w) => w.revenue))}</div>
        <div class="card tile click" data-go="ads"><h3>Leads from marketing</h3><div class="big" data-count="${M.last7.leads_marketing}">${M.last7.leads_marketing}</div><div class="sub up">+${M.last7.change.leads_marketing} on the 7 days before</div>${spark(W.map((w) => w.leads_marketing))}${working(M.last7.working.leads_marketing)}</div>
        ${window.AI_TEAM_SHOW_PRICES ? `<div class="card tile click" data-go="costs"><h3>Running the team</h3><div class="big" data-count="${M.costs.weekly_running}">${money(M.costs.weekly_running, 0)}</div><div class="sub">a week, AI included</div>${spark(W.map((w) => w.hours))}${working(M.costs.working.weekly_running)}</div>`
          : `<div class="card tile click" data-go="overview"><h3>Jobs booked</h3><div class="big" data-count="${M.last7.jobs_booked}">${num(M.last7.jobs_booked)}</div><div class="sub">last 7 days</div>${spark(W.map((w) => w.jobs_booked))}</div>`}<!-- site demo: no prices until Tom approves them (config.js) -->
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
    // keep the brain hologram alive across redraws
    const slot = $("#home-brain-slot", host);
    if (!brainEl) {
      brainEl = document.createElement("div");
      brain = createBrain3D(brainEl, { lite: ctx.S3?.tier === "lite", labels: false, autoRotate: 0.16, interactive: false, distance: 64, threads: 0.7 });
      ctx.graph().then((g) => { const mem = longMemory(g, { rules: ctx.pages.training?.library || [] }); brain.setData({ nodes: [...g.nodes, ...mem.nodes], links: [...g.links, ...mem.links] }); brainStats = { notes: brain.nodes.length, links: brain.links.length }; $$(".bs-n").forEach((e) => (e.textContent = num(brainStats.notes))); $$(".bs-l").forEach((e) => (e.textContent = num(brainStats.links))); });
    }
    slot.appendChild(brainEl);
    $$("[data-need]", host).forEach((el) => (el.onclick = () => { const n = needs[+el.dataset.need]; n.page === "team" && !PAGE_OF[n.agent] ? ctx.openAgent(n.agent) : ctx.go(n.page || "tasks"); }));
    $$("[data-person]", host).forEach((el) => (el.onclick = () => { const id = el.dataset.person; PAGE_OF[id] ? ctx.go(PAGE_OF[id]) : ctx.openAgent(id); }));
    $("#home-ask", host).onsubmit = (e) => { e.preventDefault(); const q = $("#home-ask-in", host).value.trim(); if (!q) return; ctx.local.q = q; ctx.S.ps.ask = { ...(ctx.S.ps.ask || {}), pending: q }; ctx.go("ask"); };
  },
  onEvent(ev) { return ev.demo === "floor" || ev.type === "brain" || ev.type === "sheet" || ev.demo === "d2"; },
};
