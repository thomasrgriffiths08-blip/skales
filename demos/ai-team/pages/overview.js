// Overview (the Numbers section's first tab): what the AI team gave back to Kingpost.
// Every figure comes from ctx.model, so it agrees with Home, Ads and Costs. Each headline shows its working.
import { esc, money, num, av, head, seg, barChart, lineChart, working, dot, foot, dayDate, short, $$, AGENTS } from "../ui.js";

// desk pages for the six newer employees; the four office employees open on the 3D floor
const DESK = { seo: "search", content: "content", ads: "ads", paperwork: "paperwork", manager: "tasks", coach: "training" };
const SRC_FALLBACK = [
  { key: "ads", label: "Archie's ads", agent: "ads", marketing: true }, { key: "seo", label: "Seren's pages", agent: "seo", marketing: true },
  { key: "content", label: "Clara's posts", agent: "content", marketing: true }, { key: "repeat", label: "Repeat customers" }, { key: "referral", label: "Referrals" },
];
// sources get one colour family: cyan for the AI team's marketing, grey for everything else
const TONE = { ads: "#46c8ff", seo: "#8fdcff", content: "#c9f0ff", repeat: "rgba(168, 191, 212, .42)", referral: "rgba(168, 191, 212, .22)" };
const sgn = (n, unit = "") => `${n >= 0 ? "+" : "−"}${unit}${num(Math.abs(n), 1)}`;
const r1 = (n) => Math.round(n * 10) / 10;
let uidN = 0, lastSig = "";

// a glowing area trend that fills its box
function trend(vals, { h = 44 } = {}) {
  const lo = Math.min(...vals), hi = Math.max(...vals), sp = hi - lo || 1, n = vals.length, id = `ovt${++uidN}`;
  const x = (i) => (i / (n - 1)) * 100, y = (v) => 90 - ((v - lo) / sp) * 78;
  const pts = vals.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  return `<div class="trend" style="height:${h}px"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46c8ff" stop-opacity=".3"/><stop offset="1" stop-color="#46c8ff" stop-opacity="0"/></linearGradient></defs><polygon points="0,100 ${pts} 100,100" fill="url(#${id})"/><polyline points="${pts}" vector-effect="non-scaling-stroke"/></svg><i style="left:100%;top:${y(vals[n - 1]).toFixed(1)}%"></i></div>`;
}
const wkLabel = (w) => short(dayDate(w.day_offset));
const wkTip = (w, W) => `${short(dayDate(w.day_offset))} to ${short(dayDate(w.day_offset + 6))}${w.i === W.length - 1 ? " (last 7 days)" : ""}`;

function heroHTML(M) {
  const W = M.weeks, last = W[W.length - 1], prev = W[W.length - 2], L7 = M.last7, L28 = M.last28, P28 = M.prev28;
    const fig = (label, valueHTML, count, ch, chTone, vals, work) => `<div class="hf"><span class="lab">${label}</span><b class="v num" data-count="${count}">${valueHTML}</b><span class="dx ${chTone}">${ch} <span>on the 7 days before</span></span>${trend(vals)}${working(work)}</div>`;
  return `<section class="card hud hero">
    <div class="ch"><h3>Last 7 days</h3><span class="r">${dot("busy")} against the 7 days before</span></div>
    <div class="hg">
      ${fig("Hours given back", `${num(L7.hours, 1)}<small>h</small>`, L7.hours, `${sgn(L7.change.hours)} h`, L7.change.hours >= 0 ? "up" : "down", W.map((w) => w.hours), `${M.firm.working.people_worth}: ${M.firm.share_of_office_pct}% of the office's ${M.firm.office_hours} h`)}
      ${fig("Office time saved", money(L7.money_saved, 0), L7.money_saved, `${sgn(last.money_saved - prev.money_saved, "£")}`, last.money_saved >= prev.money_saved ? "up" : "down", W.map((w) => w.money_saved), L7.working.money_saved)}
      ${fig("Leads from marketing", String(L7.leads_marketing), L7.leads_marketing, `${sgn(L7.change.leads_marketing)}`, L7.change.leads_marketing >= 0 ? "up" : "down", W.map((w) => w.leads_marketing), `${last.leads.ads} ads + ${last.leads.seo} pages + ${last.leads.content} posts = ${L7.leads_marketing}`)}
      ${fig("Revenue", money(L7.revenue, 0), L7.revenue, `${sgn(L7.change.revenue_pct)}%`, L7.change.revenue_pct >= 0 ? "up" : "down", W.map((w) => w.revenue), `${money(prev.revenue, 0)} the 7 days before`)}
    </div>
    <div class="h28"><span class="lab">Last 28 days</span>
      <span><b class="num">${num(L28.hours, 1)} h</b> given back <em class="up">+${L28.change.hours_pct}%</em></span>
      <span><b class="num">${money(L28.money_saved, 0)}</b> saved</span>
      <span><b class="num">${L28.leads_marketing}</b> leads <em class="up">+${L28.change.leads_pct}%</em></span>
      <span><b class="num">${money(L28.revenue, 0)}</b> revenue <em class="up">+${L28.change.revenue_pct}%</em></span>
    </div>
    ${working(`On the 28 days before: ${num(P28.hours, 1)} h, ${money(P28.money_saved, 0)}, ${P28.leads_marketing} leads, ${money(P28.revenue, 0)}`)}
  </section>`;
}

function glanceHTML(M, ctx) {
  const E = M.employees, W = M.weeks.length;
  const tiles = AGENTS.map((a) => {
    const e = E[a.id], k = e.kpis[0], st = ctx.status(a.id) || {};
    return `<button class="gl-t ${st.busy ? "busy" : ""}" data-ag="${a.id}" data-tip="${esc(`${a.name}: ${k.working}`)}">
      <span class="gl-h">${av(a.id)}<b>${esc(a.name)}</b>${st.busy ? dot("busy") : ""}</span>
      <span class="gl-v num">${esc(k.value)}</span><span class="gl-l">${esc(k.label)}</span>
      <span class="gl-s num">${num(e.hours[W - 1], 1)} h back</span></button>`;
  }).join("");
  return `<section class="card glance"><div class="ch"><h3>Last 7 days at a glance</h3><span class="r">one figure from each of the ten · click anyone</span></div>
    <div class="gl-g">${tiles}</div>${working(M.last7.working.hours)}</section>`;
}

function sourcesHTML(M, ctx) {
  const span = ctx.local.src || "7", W = M.weeks, n = span === "28" ? 4 : 1, wk = W.slice(-n);
  const S = (ctx.data.sources || SRC_FALLBACK);
  const val = (k) => wk.reduce((a, w) => a + w.leads[k], 0);
  const rows = S.map((s) => ({ ...s, v: val(s.key) }));
  const total = rows.reduce((a, r) => a + r.v, 0), mk = rows.filter((r) => r.marketing).reduce((a, r) => a + r.v, 0);
  const all = wk.reduce((a, w) => a + w.leads_all, 0), mkModel = wk.reduce((a, w) => a + w.leads_marketing, 0);
  const max = Math.max(...rows.map((r) => r.v), 1);
  // 12 weeks, stacked: the AI team's sources at the bottom, growing; repeat work and referrals steady on top
  const colMax = Math.max(...W.map((w) => w.leads_all));
  const cols = W.map((w) => `<div class="sc" data-tip="${esc(`${wkTip(w, W)}: ${S.map((s) => `${w.leads[s.key]} ${s.label.toLowerCase()}`).join(" + ")} = ${w.leads_all}`)}">${S.map((s) => `<i style="height:${(w.leads[s.key] / colMax) * 100}%;background:${TONE[s.key]}"></i>`).join("")}</div>`).join("");
  return `<section class="card src"><div class="ch"><h3>Where the leads came from</h3><span class="r">${seg([["7", "Last 7 days"], ["28", "Last 28 days"]], span, "src")}</span></div>
    <div class="st"><b class="v num">${total}</b><span>leads in all · <em>${mk} from the AI team's marketing (${Math.round((mk / total) * 100)}%)</em></span></div>
    <div class="stack">${rows.map((r) => `<i style="flex:${r.v};background:${TONE[r.key]}" data-tip="${esc(`${r.label}: ${r.v}`)}"></i>`).join("")}</div>
    <div class="srows">${rows.map((r) => `<div class="sr ${r.marketing ? "mk" : ""}"><span class="sn"><i style="background:${TONE[r.key]};color:${TONE[r.key]}"></i>${r.agent ? av(r.agent) : ""}${esc(r.label)}</span><span class="sb"><b style="width:${(r.v / max) * 100}%;background:${TONE[r.key]}"></b></span><em class="num">${r.v}</em></div>`).join("")}</div>
    ${working(`${rows.filter((r) => r.marketing).map((r) => r.v).join(" + ")} = ${mk} from marketing, + ${rows.filter((r) => !r.marketing).map((r) => r.v).join(" + ")} repeat and referrals = ${total}`)}
    ${total !== all || mk !== mkModel ? `<div class="note red">These don't add up: check lib/model.mjs.</div>` : ""}
    <div class="sweeks"><div class="scs">${cols}</div><div class="sxl"><span>${wkLabel(W[0])}</span><span>last 7 days</span></div></div>
  </section>`;
}

const METRICS = {
  hours: { label: "Hours given back", fmt: (v) => `${num(v, 1)} h`, chart: "bar", k: "hours" },
  revenue: { label: "Revenue", fmt: (v) => money(v, 0), chart: "line", k: "revenue" },
  jobs: { label: "Jobs booked", fmt: (v) => `${v}`, chart: "bar", k: "jobs_booked" },
  leads: { label: "Leads from marketing", fmt: (v) => `${v}`, chart: "bar", k: "leads_marketing" },
};
function weeklyHTML(M, ctx) {
  const id = ctx.local.metric || "hours", m = METRICS[id], W = M.weeks, k = m.k;
  const data = W.map((w) => ({ l: wkLabel(w), v: w[k], w }));
  const s = (a, b) => W.slice(a, b).reduce((x, w) => x + w[k], 0);
  const n = W.length, l7 = W[n - 1][k], p7 = W[n - 2][k], l28 = s(n - 4, n), p28 = s(n - 8, n - 4);
  const fmtT = (v) => (id === "hours" ? `${num(r1(v), 1)} h` : m.fmt(v));
  const pc = (a, b) => (b ? `${a >= b ? "+" : "−"}${Math.abs(Math.round(((a - b) / b) * 1000) / 10)}%` : "");
  const vs = data.map((d) => d.v), lo = Math.floor((Math.min(...vs) * 0.92) / 5000) * 5000, hi = Math.ceil((Math.max(...vs) * 1.03) / 5000) * 5000;
  const chart = m.chart === "line" ? lineChart(data, { h: 220, fmt: m.fmt, label: (d) => wkTip(d.w, W), every: 2, min: lo, max: hi }) : barChart(data, { h: 220, fmt: m.fmt, label: (d) => wkTip(d.w, W), every: 2 });
  return `<section class="card wkly"><div class="ch">${seg(Object.entries(METRICS).map(([v, x]) => [v, x.label]), id, "metric")}<span class="r">12 weeks · each bar is 7 days</span></div>
    ${chart}
    ${working(`${fmtT(W[0][k])} in the 7 days to ${short(dayDate(W[0].day_offset + 6))} → ${fmtT(l7)} in the last 7 days (${pc(l7, W[0][k])})`)}
    <div class="kv k4w"><div><b>${fmtT(l7)}</b><span>last 7 days</span></div><div><b>${fmtT(p7)}</b><span>the 7 days before</span></div><div><b>${fmtT(l28)}</b><span>last 28 days <em class="${l28 >= p28 ? "up" : "down"}">${pc(l28, p28)}</em></span></div><div><b>${fmtT(p28)}</b><span>the 28 days before</span></div></div>
  </section>`;
}

function costLinkHTML(M) {
  if (!window.AI_TEAM_SHOW_PRICES) return ""; // site demo: no prices until Tom approves them (config.js)
  const run = M.costs.weekly_running, saved = M.last7.money_saved;
  return `<section class="card cl click" data-go="costs">
    <div><h3>What it costs</h3><div class="cl-r"><span><b class="num">${money(run, 0)}</b> a week to run the team</span><span class="op">against</span><span><b class="num">${money(saved, 0)}</b> of office time saved</span><span class="op">=</span><span class="up"><b class="num">${money(saved - run, 0)}</b> ahead, before any leads</span></div>
    ${working(M.costs.working.weekly_running)}</div><span class="go">See costs <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3l5 5-5 5"/></svg></span></section>`;
}

export default {
  css: `
.pg-overview .lab { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
.pg-overview .working-line { overflow-wrap: anywhere; }
.pg-overview .up { color: var(--green); }
.pg-overview .down { color: var(--red); }
.pg-overview .trend { position: relative; width: 100%; }
.pg-overview .trend svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.pg-overview .trend polyline { fill: none; stroke: var(--holo); stroke-width: 1.6; stroke-linejoin: round; filter: drop-shadow(0 0 3px rgba(70, 200, 255, .9)); }
.pg-overview .trend > i { position: absolute; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px var(--holo); }

.pg-overview .hero { padding: 20px 24px; }
.pg-overview .hero .ch .r { color: var(--holo-2); }
.pg-overview .hg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 8px; }
.pg-overview .hf { display: grid; grid-template-rows: auto auto auto 1fr auto; min-width: 0; padding: 4px 20px 0; border-left: 1px solid var(--line); }
.pg-overview .hf:first-child { padding-left: 0; border-left: 0; }
.pg-overview .hf:last-child { padding-right: 0; }
.pg-overview .hf .v { font: 300 44px/1.1 var(--mono); letter-spacing: -0.04em; color: #fff; text-shadow: none; margin-top: 8px; white-space: nowrap; }
.pg-overview .hf .v small { font-size: 20px; margin-left: 4px; color: var(--holo-2); letter-spacing: 0; }
.pg-overview .hf .dx { font: 400 12px var(--mono); margin-top: 2px; }
.pg-overview .hf .dx span { font-family: var(--sans); color: var(--ink-3); }
.pg-overview .hf .trend { margin-top: 12px; align-self: end; }
.pg-overview .hf .working-line { margin-top: 10px; min-height: 35px; }
.pg-overview .h28 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 24px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 13px; color: var(--ink-3); }
.pg-overview .h28 .lab { color: var(--ink-3); }
.pg-overview .h28 b { font-weight: 400; color: var(--ink); font-size: 15px; }
.pg-overview .h28 em { font-style: normal; font: 400 12px var(--mono); margin-left: 4px; }

.pg-overview .gl-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-top: 8px; }
.pg-overview .gl-t { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; align-content: start; text-align: left; font: inherit; color: inherit; padding: 14px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); cursor: pointer; min-width: 0; transition: border-color .15s, box-shadow .2s; }
.pg-overview .gl-t:hover { border-color: rgba(70, 200, 255, .45); box-shadow: 0 0 28px -12px var(--holo-glow); }
.pg-overview .gl-t.busy { border-color: rgba(70, 200, 255, .35); }
.pg-overview .gl-h { display: flex; align-items: center; gap: 0; min-width: 0; font-size: 13px; }
.pg-overview .gl-h b { font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pg-overview .gl-h .ldot { margin-left: auto; }
.pg-overview .gl-v { font: 300 26px/1.15 var(--mono); letter-spacing: -0.03em; color: #fff; text-shadow: none; margin-top: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-overview .gl-l { font-size: 12px; color: var(--ink-2); line-height: 1.35; min-height: 32px; }
.pg-overview .gl-s { font-size: 11px; color: var(--holo-2); opacity: .75; margin-top: 4px; }

.pg-overview .two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 16px; margin-top: 16px; }
.pg-overview .src .st { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
.pg-overview .src .st .v { font: 300 40px/1.1 var(--mono); letter-spacing: -0.03em; color: #fff; text-shadow: none; }
.pg-overview .src .st span { font-size: 12.5px; color: var(--ink-3); }
.pg-overview .src .st em { font-style: normal; color: var(--holo-2); }
.pg-overview .stack { display: flex; gap: 3px; height: 12px; margin-top: 14px; border-radius: 8px; overflow: hidden; }
.pg-overview .stack i { display: block; min-width: 4px; }
.pg-overview .stack i:nth-child(-n+3) { box-shadow: 0 0 12px rgba(70, 200, 255, .5); }
.pg-overview .srows { display: grid; gap: 8px; margin-top: 16px; }
.pg-overview .sr { display: grid; grid-template-columns: minmax(0, 170px) minmax(0, 1fr) 32px; gap: 12px; align-items: center; font-size: 12.5px; }
.pg-overview .sn { display: flex; align-items: center; gap: 0; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-overview .sn > i { width: 8px; height: 8px; border-radius: 2px; margin-right: 8px; flex: none; }
.pg-overview .sr.mk .sn > i { box-shadow: 0 0 8px currentColor; }
.pg-overview .sn .av-s { width: 20px; height: 20px; font-size: 9px; }
.pg-overview .sr.mk .sn { color: var(--ink); }
.pg-overview .sb { height: 6px; border-radius: 6px; background: rgba(255, 255, 255, .05); overflow: hidden; }
.pg-overview .sb b { display: block; height: 100%; border-radius: 6px; }
.pg-overview .sr em { font-style: normal; text-align: right; color: var(--ink); }
.pg-overview .sweeks { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); }
.pg-overview .scs { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 6px; height: 84px; align-items: end; }
.pg-overview .sc { display: flex; flex-direction: column-reverse; height: 100%; gap: 1px; cursor: default; }
.pg-overview .sc i { display: block; border-radius: 2px; transform-origin: bottom; animation: grow .7s cubic-bezier(.2, .8, .2, 1) both; }
.pg-overview .sc:last-child i:nth-child(-n+3) { box-shadow: 0 0 10px rgba(70, 200, 255, .6); }
.pg-overview .sxl { display: flex; justify-content: space-between; margin-top: 6px; font: 11px var(--mono); color: var(--ink-3); }

.pg-overview .wkly .ch { margin-bottom: 4px; flex-wrap: wrap; }
.pg-overview .k4w { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 16px; }
.pg-overview .k4w b { font-size: 18px; }
.pg-overview .k4w em { font-style: normal; font-family: var(--mono); margin-left: 4px; }

.pg-overview .cl { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 16px; }
.pg-overview .cl h3 { margin-bottom: 8px; }
.pg-overview .cl-r { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; font-size: 13px; color: var(--ink-3); }
.pg-overview .cl-r b { font: 400 20px var(--mono); color: #fff; margin-right: 4px; }
.pg-overview .cl-r .up b { color: var(--green); text-shadow: none; }
.pg-overview .cl-r .op { color: var(--ink-3); font-family: var(--mono); }
.pg-overview .cl .go { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--holo-2); white-space: nowrap; }

@container (max-width: 1080px) {
  .pg-overview .two { grid-template-columns: minmax(0, 1fr); }
}
@container (max-width: 860px) {
  .pg-overview .hg { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 20px; }
  .pg-overview .hf:nth-child(3) { padding-left: 0; border-left: 0; }
  .pg-overview .hf:nth-child(2) { padding-right: 0; }
  .pg-overview .hf .v { font-size: 40px; }
  .pg-overview .hf .working-line { min-height: 0; }
  .pg-overview .gl-g { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
  .pg-overview .gl-t { padding: 12px; }
  .pg-overview .gl-v { font-size: 22px; }
  .pg-overview .gl-h .av-s { width: 20px; height: 20px; font-size: 9px; margin-right: 6px; }
}
@container (max-width: 600px) {
  .pg-overview .hero { padding: 16px; }
  .pg-overview .hf { padding: 0 0 0 14px; }
  .pg-overview .hf .v { font-size: 30px; }
  .pg-overview .hf .v small { font-size: 15px; }
  .pg-overview .gl-g { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pg-overview .glance .ch .r { display: none; }
  .pg-overview .sr { grid-template-columns: minmax(0, 150px) minmax(0, 1fr) 28px; }
  .pg-overview .k4w { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pg-overview .k4w > div:nth-child(3) { border-left: 0; }
  .pg-overview .k4w > div:nth-child(n+3) { border-top: 1px solid var(--line); }
  .pg-overview .cl { flex-direction: column; align-items: flex-start; }
}`,

  render(host, ctx) {
    const M = ctx.model, L = ctx.local;
    lastSig = AGENTS.map((a) => (ctx.status(a.id)?.busy ? 1 : 0)).join("");
    host.innerHTML = `<div class="inner pg-overview">
      ${head({ title: "Overview", lede: "What the AI team gave back to Kingpost. Every figure is the last 7 days unless it says otherwise." })}
      ${heroHTML(M)}
      ${glanceHTML(M, ctx)}
      <div class="two">${sourcesHTML(M, ctx)}${weeklyHTML(M, ctx)}</div>
      ${costLinkHTML(M)}
      ${foot()}</div>`;
    $$("[data-src]", host).forEach((b) => (b.onclick = () => { L.src = b.dataset.src; ctx.redraw(); }));
    $$("[data-metric]", host).forEach((b) => (b.onclick = () => { L.metric = b.dataset.metric; ctx.redraw(); }));
    $$("[data-ag]", host).forEach((b) => (b.onclick = () => { const id = b.dataset.ag; if (DESK[id]) ctx.go(DESK[id]); else ctx.openAgent(id); }));
  },

  // the figures come from the model and don't move with live events; only redraw when someone starts or stops working
  onEvent(ev, ctx) {
    const sig = AGENTS.map((a) => (ctx.status(a.id)?.busy ? 1 : 0)).join("");
    if (sig === lastSig) return false;
    lastSig = sig; return true;
  },
};
