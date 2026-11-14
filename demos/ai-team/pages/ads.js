// Ads (video 5): Archie turns ad money into leads. He tests ads, keeps the winners and cuts the rest, inside limits Kieran set.
// Every headline figure comes from ctx.model (weeks[].ad_spend / ad_leads / ad_cpl and model.ads); the campaign and ad
// figures in data/floor/ads.json add up to exactly the same last-7-days totals (checked in the maths pass).
import { esc, money, num, chip, head, seg, table, barChart, lineChart, hbars, meter, note, foot, dayDate, dayName, short, hhmm, ago, working, dot, $, $$ } from "../ui.js";

const SITE = "kingpost.example";
// one holographic family for the campaigns, brightest first
const SHADE = ["#a6e6ff", "#46c8ff", "#2b9ad6", "#1f6a96"];
const VERDICT = { winner: ["Kept", "green"], testing: ["Testing", "holo"], cut: ["Cut", "red"] };
const CSTATUS = { scaling: ["Scaling up", "green"], running: ["Running", "holo"], testing: ["Testing", "holo"], paused: ["Paused", ""] };
const TABS = [["camps", "Campaigns"], ["wall", "The ads"], ["tests", "Tests"], ["weeks", "12 weeks"], ["changes", "Changes"], ["limits", "Kieran's limits"]];
const sum = (a, f) => a.reduce((x, y) => x + (typeof f === "function" ? f(y) : Number(y[f]) || 0), 0);
const r2 = (n) => Math.round(n * 100) / 100;
const pct = (n, dp = 0) => `${(n * 100).toFixed(dp)}%`;
const day = (off) => (off === 0 ? "Today" : off === -1 ? "Yesterday" : dayName(dayDate(off)));
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
let uidN = 0;

// a glowing trend line that fills its box (the shared spark keeps a fixed width)
function trend(vals, { h = 36, good = "" } = {}) {
  const lo = Math.min(...vals), hi = Math.max(...vals), sp = hi - lo || 1, n = vals.length, id = `adt${++uidN}`;
  const x = (i) => (i / (n - 1)) * 100, y = (v) => 90 - ((v - lo) / sp) * 78;
  const pts = vals.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  return `<div class="trend ${good}" style="height:${h}px"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46c8ff" stop-opacity=".26"/><stop offset="1" stop-color="#46c8ff" stop-opacity="0"/></linearGradient></defs><polygon points="0,100 ${pts} 100,100" fill="url(#${id})"/><polyline points="${pts}" vector-effect="non-scaling-stroke"/></svg><i style="left:100%;top:${y(vals[n - 1]).toFixed(1)}%"></i></div>`;
}

function build(ctx) {
  const F = ctx.F, D = ctx.data || {}, Mo = ctx.model, W = Mo.weeks, last = W[W.length - 1], prev = W[W.length - 2], A = Mo.ads;
  const camps = F.ads.campaigns.map((c, i) => ({ ...c, ...(D.campaigns?.[c.id] || {}), shade: SHADE[i % SHADE.length] }));
  const byCamp = Object.fromEntries(camps.map((c) => [c.id, c]));
  const cr = F.ads.creatives, L = D.limits || {};
  const liveCaps = sum(camps.filter((c) => c.status !== "paused"), (c) => c.daily_cap_gbp || 0);
  const shown = sum(cr, "impressions"), clicks = sum(cr, "clicks");
  const needs = (Mo.needs || []).filter((n) => n.agent === "ads");
  return { F, D, L, Mo, W, last, prev, A, camps, byCamp, cr, liveCaps, shown, clicks, needs, spend: last.ad_spend, leads: last.ad_leads, cpl: last.ad_cpl };
}

// ------------------------------------------------------------------ the hero: money in, leads out, cost per lead, the month's budget
function funnel(M) {
  // particles flow in at the wide mouth; most drop out at the clicks line, a few reach the lead node
  const n = 22, parts = [];
  for (let k = 0; k < n; k++) {
    const y0 = 16 + (k * 108) / (n - 1), mid = 70 + (y0 - 70) * 0.42, end = 70 + (y0 - 70) * 0.12;
    const through = k % 4 === 1, dur = (3.2 + (k % 5) * 0.35).toFixed(2), begin = (-(k * 0.61) % 4).toFixed(2);
    const path = `M0,${y0.toFixed(1)} C150,${y0.toFixed(1)} 210,${mid.toFixed(1)} 300,${mid.toFixed(1)} S380,${end.toFixed(1)} 400,70`;
    parts.push(`<circle r="${through ? 2.4 : 1.6}" class="${through ? "pl" : "pd"}"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" values="${through ? "0;1;1;1;0" : "0;.9;.9;0;0"}" keyTimes="${through ? "0;.08;.6;.94;1" : "0;.08;.46;.56;1"}"/></circle>`);
  }
  return `<svg class="fun" viewBox="0 0 400 140" role="img" aria-label="${num(M.shown)} times shown, ${num(M.clicks)} clicks, ${M.leads} leads">
    <defs><linearGradient id="adfg" x1="0" x2="1"><stop offset="0" stop-color="#46c8ff" stop-opacity=".04"/><stop offset=".55" stop-color="#46c8ff" stop-opacity=".12"/><stop offset="1" stop-color="#46c8ff" stop-opacity=".34"/></linearGradient></defs>
    <path class="fs" d="M0,8 C150,8 210,40 300,44 S380,58 400,60 L400,80 C380,82 340,96 300,96 S150,132 0,132 Z" fill="url(#adfg)"/>
    <g class="fx"><line x1="2" y1="8" x2="2" y2="132"/><line x1="200" y1="32" x2="200" y2="108"/><line x1="398" y1="60" x2="398" y2="80"/></g>
    <g class="fp">${parts.join("")}</g>
    <circle class="node" cx="398" cy="70" r="5"/>
  </svg>`;
}
function gauge(M) {
  const A = M.A, size = 220, c = size / 2, r = 82, C = 2 * Math.PI * r;
  const spentK = Math.min(1, A.spent_month / A.month_budget);
  const mo = M.Mo.month, gone = (mo.day - 0.5) / mo.days_in_month;
  const ticks = Array.from({ length: 60 }, (_, i) => { const a = (i / 60) * Math.PI * 2, r1 = c - 4, r2 = c - (i % 5 === 0 ? 12 : 8); return `<line x1="${(c + r1 * Math.cos(a)).toFixed(1)}" y1="${(c + r1 * Math.sin(a)).toFixed(1)}" x2="${(c + r2 * Math.cos(a)).toFixed(1)}" y2="${(c + r2 * Math.sin(a)).toFixed(1)}"/>`; }).join("");
  const ga = gone * Math.PI * 2 - Math.PI / 2, gx = (rr) => (c + rr * Math.cos(ga)).toFixed(1), gy = (rr) => (c + rr * Math.sin(ga)).toFixed(1);
  return `<div class="gz"><svg viewBox="0 0 ${size} ${size}">
      <g class="ring-ticks">${ticks}</g>
      <circle cx="${c}" cy="${c}" r="${r}" class="gt"/>
      <circle cx="${c}" cy="${c}" r="${r}" class="gs" style="stroke-dasharray:${(C * spentK).toFixed(1)} ${C.toFixed(1)};stroke-dashoffset:${(C * spentK).toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>
      <line x1="${gx(r - 13)}" y1="${gy(r - 13)}" x2="${gx(r + 13)}" y2="${gy(r + 13)}" class="gm"/>
      <circle cx="${c}" cy="${c}" r="${r - 24}" class="ring-spin gd"/>
    </svg>
    <div class="gc"><span class="ring-l">Left this month</span><b data-count="${Math.round(A.left_month)}">${money(A.left_month, 0)}</b><span class="ring-s">of ${money(A.month_budget, 0)}</span></div></div>`;
}
function heroHTML(M) {
  const W = M.W, A = M.A, mo = M.Mo.month, spentK = A.spent_month / A.month_budget, gone = (mo.day - 0.5) / mo.days_in_month;
  const dLeads = M.leads - M.prev.ad_leads, cplDown = M.cpl <= M.prev.ad_cpl;
  return `<section class="card hud hero" id="ads-hero">
    <div class="ch"><h3>Last 7 days</h3><span class="r">${dot("busy")} Google and Meta ads, run by Archie</span></div>
    <div class="stages">
      <div class="stg"><span class="lab">Money in</span><b class="v num" data-count="${M.spend}">${money(M.spend)}</b><span class="s">spent on ads</span>${trend(W.map((w) => w.ad_spend))}</div>
      <i class="arr" aria-hidden="true"></i>
      <div class="stg"><span class="lab">Leads out</span><b class="v num" data-count="${M.leads}">${M.leads}</b><span class="s ${dLeads >= 0 ? "up" : "down"}">${dLeads >= 0 ? "+" : ""}${dLeads} on the 7 days before</span>${trend(W.map((w) => w.ad_leads))}</div>
      <i class="arr" aria-hidden="true"></i>
      <div class="stg win"><span class="lab">Cost per lead</span><b class="v num" data-count="${M.cpl}">${money(M.cpl)}</b><span class="s ${cplDown ? "up" : "down"}">${cplDown ? "down" : "up"} from ${money(M.prev.ad_cpl)}</span>${trend(W.map((w) => w.ad_cpl), { good: "dn" })}</div>
    </div>
    <div class="hrow">
      <div class="fwrap">
        ${funnel(M)}
        <div class="f3"><span><b class="num">${num(M.shown)}</b>times shown</span><span><b class="num">${num(M.clicks)}</b>clicks<em>${pct(M.clicks / M.shown, 1)} of views</em></span><span><b class="num">${M.leads}</b>leads<em>${pct(M.leads / M.clicks, 1)} of clicks</em></span></div>
        ${working(`${money(M.spend)} spent ÷ ${M.leads} leads = ${money(M.cpl)} a lead`)}
      </div>
      <div class="gwrap">
        ${gauge(M)}
        <div class="gk"><div><b class="num">${money(A.spent_month)}</b><span>spent in ${esc(mo.label)} so far</span></div><div><b class="num">${A.days_left} days</b><span>to go · ${pct(spentK)} spent with ${pct(gone)} of the month gone${spentK <= gone + 0.02 ? ", on budget" : ""}</span></div></div>
        ${working(`${A.working.spent_month}; ${money(A.month_budget, 0)} − ${money(A.spent_month)} = ${money(A.left_month)} left`)}
      </div>
    </div>
  </section>`;
}

// ------------------------------------------------------------------ live: Archie writes three test ads
function adMock(slug, headline, body, cls = "") {
  return `<div class="mock ${cls}"><span class="sp">Sponsored</span><span class="url">${SITE}${esc(slug || "")}</span><b>${esc(headline)}</b>${body ? `<p>${esc(body)}</p>` : ""}</div>`;
}
function runHTML(ctx) {
  const runs = ctx.acts.runs || [], r = runs.find((x) => x.id === ctx.local.run) || runs[0];
  if (!r) return `<div class="lads ghost">${[["Ad 1", "One angle, e.g. the price"], ["Ad 2", "A different angle, e.g. speed"], ["Ad 3", "A third, e.g. proof"]].map(([k, t]) => `<div class="lad"><div class="row">${chip(k)}<span class="s">${t}</span></div><div class="mock"><span class="sp">Sponsored</span><span class="url">${SITE}/…</span><b>Archie writes this</b><p>Headline and description, counted against Google's limits, checked against Kingpost's rules.</p></div></div>`).join("")}</div>`;
  const R = r.result || r.partial || {}, ads = (R.ads || []).filter(Boolean), p = R.plan || {};
  const writing = r.stage === "writing", ck = r.check || r.checkPartial, checks = (ck?.checks || []).filter((c) => c && c.item);
  const L = ctx.data.limits || {}, cap = L.max_daily_cap_gbp || 40;
  const adFlag = (i) => r.check && (checks.some((c) => c.item === `Ad ${i + 1}` && c.ok === false) || (r.auto || []).some((x) => x.startsWith(`Ad ${i + 1}:`)));
  const mock = (i) => {
    const a = ads[i];
    if (!a) return `<div class="lad wait"><div class="row">${chip(`Ad ${i + 1}`)}</div><div class="mock"><span class="sp">Sponsored</span><span class="url">${SITE}${esc(r.slug)}</span><b class="${writing ? "shimmer" : "muted"}">${writing ? "Writing…" : "Not written"}</b></div></div>`;
    const h = a.headline || "", d = a.description || "", caret = writing && i === ads.length - 1;
    return `<div class="lad ${adFlag(i) ? "flag" : ""}"><div class="row">${chip(`Ad ${i + 1}`)}<span class="s">${esc(a.angle || "")}</span></div>
      <div class="mock"><span class="sp">Sponsored</span><span class="url">${SITE}${esc(r.slug)}</span><b class="${caret && !d ? "caret" : ""}">${esc(h)}</b><p class="${caret && d ? "caret" : ""}">${esc(d)}</p></div>
      <div class="cc"><span class="${h.length > 30 ? "over" : ""}">Headline <b class="num">${h.length}</b>/30</span><span class="${d.length > 90 ? "over" : ""}">Description <b class="num">${d.length}</b>/90</span></div>
      ${a.why ? `<div class="s">${esc(a.why)}</div>` : ""}
      ${r.check ? `<div>${adFlag(i) ? chip("Flagged for Kieran", "amber") : chip("Passed his checks", "green")}</div>` : ""}</div>`;
  };
  const flags = [...(r.auto || []), ...((ck?.flags || []).filter((x) => typeof x === "string" && x.trim()))];
  const step = (k, label, sub, state) => `<div class="stp ${state}"><b>${k}. ${label}</b><div class="s">${sub}</div></div>`;
  const st = r.stage;
  const plan = p.daily_cap_gbp !== undefined ? `<div class="kv k3"><div><b>${money(p.daily_cap_gbp, 0)}</b><span>a day (limit ${money(cap, 0)})</span></div><div><b>${esc(p.days ?? "…")}</b><span>days</span></div><div><b>${p.total_gbp !== undefined ? money(p.total_gbp, 0) : "…"}</b><span>test budget</span></div></div>
      <div>${meter(Math.min(1, (p.daily_cap_gbp || 0) / cap), `${pct((p.daily_cap_gbp || 0) / cap)} of his daily limit`)}</div>
      ${p.where ? `<div class="s"><b>Where:</b> ${esc(p.where)}</div>` : ""}${p.winner_rule ? `<div class="s"><b>Picking the winner:</b> ${esc(p.winner_rule)}</div>` : ""}${R.summary ? `<p class="sum">${esc(R.summary)}</p>` : ""}`
    : `<div class="s shimmer">Working out the budget…</div>`;
  return `<div class="lrun">
    <div class="lhd"><div><b>${esc(r.label)}</b><span class="s"> · ${esc(r.search)}${r.focus ? ` · pushing: ${esc(r.focus)}` : ""} · ${ago(r.at)}</span></div>
      ${r.error ? chip("Hit a problem", "red") : st === "done" ? chip("Waiting for Kieran", "amber") : `<span class="shimmer">${st === "checking" ? "Archie's checking his own work…" : "Archie's writing…"}</span>`}</div>
    ${r.error ? note(`Archie hit a problem: ${esc(r.error)}`, "red") : ""}
    <div class="lsteps">
      ${step(1, "Writing three ads", r.campaign ? `For the live campaign: ${esc(r.campaign)}` : "For a new campaign", writing ? "on" : "done")}
      ${step(2, "Checking them against the rules", "Proof list, banned words, his limits", st === "checking" ? "on" : st === "done" ? "done" : "")}
      ${step(3, "Waiting for Kieran", "Nothing goes live until he says yes", st === "done" ? "on amber" : "")}
    </div>
    <div class="lads">${[0, 1, 2].map(mock).join("")}</div>
    <div class="lgrid">
      <div class="box"><h4>Test plan</h4>${plan}</div>
      <div class="box"><h4>Archie's own check${ck?.verdict ? ` <span class="s">· ${esc(ck.verdict)}</span>` : ""}</h4>
        ${checks.length ? `<div class="list">${checks.map((c) => `<div class="li"><div><b>${esc(c.item)}</b> ${esc(c.rule || "")}<div class="s">${esc(c.note || "")}</div></div>${typeof c.ok === "boolean" ? chip(c.ok ? "OK" : "Flag", c.ok ? "green" : "amber") : ""}</div>`).join("")}</div>`
          : `<div class="s ${st === "checking" ? "shimmer" : ""}">${st === "checking" ? "Going through each ad and the plan…" : writing ? "Starts when the ads are written." : ""}</div>`}
        ${flags.length ? note(`<b>Flagged for Kieran</b><ul>${flags.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`, "amber") : r.check ? note("Nothing risky found.") : ""}
        ${ck?.note_to_kieran ? `<div class="tok"><b>To Kieran:</b> ${esc(ck.note_to_kieran)}</div>` : ""}</div>
    </div>
    ${runs.length > 1 ? `<div class="runs"><span class="s">Earlier</span>${runs.map((x) => `<button class="btn sm ${x.id === r.id ? "primary" : ""}" data-run="${x.id}">${esc(x.label)} · ${hhmm(x.at)}</button>`).join("")}</div>` : ""}
  </div>`;
}
function liveHTML(ctx, M) {
  const svcs = M.D.services || [], sel = svcs.find((s) => s.id === ctx.local.svc) || svcs[0] || {};
  const opp = M.F.seo.opportunities.find((o) => o.id === sel.opp);
  const busy = (ctx.acts.runs || []).some((r) => r.running);
  const kind = (s) => (!M.byCamp[s.campaign_id] ? ["New campaign", "amber"] : M.byCamp[s.campaign_id].status === "paused" ? ["Campaign paused", ""] : ["Live campaign", "holo"]);
  return `<section class="card live" id="ads-live">
    <div class="ch"><h3>Ask Archie for new ads</h3><span class="r">Nothing goes live. Kieran says yes to every new ad.</span></div>
    ${M.needs.map((n) => `<div class="wait-k">${dot("need")}<div><b>${esc(n.what)}</b><span class="s">${esc(n.detail)}</span></div>${chip(`Waiting for ${n.who}`, "amber")}</div>`).join("")}
    <div class="svc">${svcs.map((s) => { const [t, tone] = kind(s); return `<button class="sv ${s.id === sel.id ? "on" : ""}" data-svc="${s.id}"><b>${esc(s.label)}</b><span class="k ${tone}">${t}</span></button>`; }).join("")}</div>
    <div class="sv-d">${opp ? `<div class="s"><b>Landing page</b> <span class="mono">${SITE}${esc(opp.page_to_build.slug)}</span> · about ${num(opp.monthly_searches)} searches a month for “${esc(opp.query)}” (monthly estimate)</div>
      <div class="pf">${opp.page_to_build.proof_we_have.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>` : ""}
      ${(sel.notes || []).map((x) => `<div class="s">${esc(x)}</div>`).join("")}</div>
    <div class="lf"><input id="ads-focus" maxlength="140" placeholder="Anything to push? e.g. the cold snap on its way (optional)" value="${esc(ctx.local.focus || "")}"><button class="btn primary cta" data-write ${busy ? "disabled" : ""}>Write three test ads</button></div>
    <div id="ads-live-run">${runHTML(ctx)}</div></section>`;
}
function wireRun(root, ctx) {
  if (!root) return;
  $$("[data-run]", root).forEach((b) => (b.onclick = () => { ctx.local.run = b.dataset.run; patchLive(ctx); }));
}
function patchLive(ctx) {
  const root = document.querySelector(".pg-ads #ads-live-run"); if (!root) return;
  root.innerHTML = runHTML(ctx); wireRun(root, ctx);
  const b = document.querySelector(".pg-ads [data-write]"); if (b) b.disabled = (ctx.acts.runs || []).some((r) => r.running);
}

// ------------------------------------------------------------------ tab: campaigns
function campsHTML(M, ctx) {
  const sel = M.byCamp[ctx.local.camp] || M.camps[0];
  const rows = M.camps.map((c) => [
    `<div class="cn"><span class="sw" style="background:${c.shade};color:${c.shade}"></span><div><b>${esc(c.name)}</b><div class="s">${esc(c.channel)}</div></div></div>`,
    chip(...(CSTATUS[c.status] || [c.status, ""])), money(c.daily_cap_gbp || 0, 0), money(c.spend_week), String(c.leads), money(c.cpl),
  ]);
  rows.push([`<b>All ${M.camps.length}</b>`, "", `<span data-tip="Daily caps on the live campaigns: ${M.camps.filter((c) => c.status !== "paused").map((c) => money(c.daily_cap_gbp, 0)).join(" + ")}">${money(M.liveCaps, 0)} live</span>`, `<b>${money(M.spend)}</b>`, `<b>${M.leads}</b>`, `<b>${money(M.cpl)}</b>`]);
  const tbl = table([{ label: "Campaign" }, { label: "Status" }, { label: "Daily cap", r: true }, { label: "Spent, 7 days", r: true }, { label: "Leads", r: true }, { label: "Per lead", r: true }], rows,
    { cls: "camps", rowAttr: (i) => (i < M.camps.length ? `data-camp="${M.camps[i].id}" class="${M.camps[i].id === sel.id ? "sel" : ""}"` : `class="tot"`) });
  return `${tbl}${working(`${M.camps.map((c) => money(c.spend_week)).join(" + ")} = ${money(M.spend)} · ${M.camps.map((c) => c.leads).join(" + ")} = ${M.leads} leads`)}${campDetail(sel, M)}`;
}
function campDetail(c, M) {
  const days = c.daily_spend || [], n = days.length;
  const dd = days.map((v, i) => ({ l: dayDate(i - n).toLocaleDateString("en-GB", { weekday: "short" }), v }));
  const order = ["winner", "testing", "cut"], mine = M.cr.filter((x) => x.campaign_id === c.id).sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict));
  const weeksOn = Math.round(-(c.started_day_offset || 0) / 7);
  return `<div class="cd">
    <div class="cd-h"><span class="sw lg" style="background:${c.shade};color:${c.shade}"></span><div><b>${esc(c.name)}</b><div class="s">${esc(c.objective)}</div></div>${chip(...(CSTATUS[c.status] || [c.status, ""]))}</div>
    <div class="cg3">
      <div>
        <div class="kv k3"><div><b>${money(c.daily_cap_gbp || 0, 0)}</b><span>daily cap</span></div><div><b>${weeksOn} wk</b><span>running</span></div><div><b>${money(c.cpl)}</b><span>per lead</span></div></div>
        <h4>Spend each day, last 7 days</h4>
        ${barChart(dd, { h: 96, every: 1, fmt: (v) => money(v, 0) })}
        <div class="s mt8">${esc(c.area || "")}. ${esc(c.hours || "")}.</div>
      </div>
      <div>
        <h4>${esc(c.who_label || "Searches")}, last 7 days</h4>
        <table class="t mini"><tr><th>${c.who_label === "Shown to" ? "Who" : "Search"}</th><th class="r">Clicks</th><th class="r">Leads</th></tr>
          ${(c.who || []).map((w) => `<tr><td>${esc(w.q)}</td><td class="r num">${w.clicks}</td><td class="r num">${w.leads}</td></tr>`).join("")}</table>
        <h4>${c.who_label === "Shown to" ? "Kept out" : "Blocked searches"}</h4>
        <div class="chips">${(c.blocked || []).map((b) => `<span class="chip no">${esc(b)}</span>`).join("")}</div>
      </div>
      <div>
        <h4>Ads in this campaign</h4>
        <div class="list">${mine.map((x) => `<div class="li click" data-cr="${x.id}"><div><b>${esc(x.headline)}</b><div class="s num">${money(x.cpl)} a lead · ${x.ctr}% clicked</div></div>${chip(...VERDICT[x.verdict])}</div>`).join("")}</div>
        <div class="note mt8"><b>Archie's watching:</b> ${esc(c.watching || "")}</div>
      </div>
    </div></div>`;
}

// ------------------------------------------------------------------ tab: the ads (creative wall)
const ICON = {
  carousel: `<svg viewBox="0 0 24 24"><rect x="6" y="5" width="12" height="14" rx="2"/><path d="M3 7v10M21 7v10"/></svg>`,
  image: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>`,
  "short video": `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>`,
};
function visual(x) {
  return `<div class="vis"><span class="fmt">${ICON[x.format] || ICON.image}${esc(x.format)}</span><p>${esc(x.visual.subject)}</p></div>`;
}
function crTile(x, M, on) {
  const c = M.byCamp[x.campaign_id] || {};
  const top = x.format === "search ad" ? adMock(c.landing, x.headline, x.body) : visual(x);
  return `<button class="ct ${x.verdict} ${on ? "on" : ""}" data-cr="${x.id}">${top}<div class="cb">${x.format !== "search ad" ? `<b>${esc(x.headline)}</b>` : ""}
    <div class="cm num">${x.ctr}% clicked · ${plural(x.leads, "lead")} · ${money(x.cpl)} each</div><div class="row">${chip(...VERDICT[x.verdict])}<span class="s">${esc(c.name || "")}</span></div></div></button>`;
}
function crDetail(x, M) {
  const c = M.byCamp[x.campaign_id] || {};
  const why = x.verdict === "winner" ? "Why Archie kept it" : x.verdict === "cut" ? "Why Archie cut it" : "Why it's still running";
  return `<aside class="cdet">
    <div class="row">${chip(...VERDICT[x.verdict])}<span class="s">${esc(c.name || "")} · ${esc(x.format)}</span></div>
    ${x.format === "search ad" ? adMock(c.landing, x.headline, x.body) : `<div><b class="hl">${esc(x.headline)}</b><p class="s">${esc(x.body)}</p></div>${visual(x)}`}
    <div class="why"><h4>${why}</h4><p>${esc(x.reason)}</p></div>
    <div class="st6"><div><b>${num(x.impressions)}</b><span>times shown</span></div><div><b>${num(x.clicks)}</b><span>clicks</span></div><div><b>${x.ctr}%</b><span>clicked</span></div>
      <div><b>${money(x.spend)}</b><span>spent</span></div><div><b>${x.leads}</b><span>${x.leads === 1 ? "lead" : "leads"}</span></div><div><b>${money(x.cpl)}</b><span>per lead</span></div></div>
    <h4>Cost per lead against the rest</h4>
    ${hbars([{ label: "This ad", v: x.cpl }, { label: "Its campaign", v: c.cpl || 0 }, { label: "All ads, 7 days", v: M.cpl }], { fmt: (v) => money(v) })}
  </aside>`;
}
function wallHTML(M, ctx) {
  const f = ctx.local.crf || "all", order = ["winner", "testing", "cut"];
  const list = M.cr.filter((x) => f === "all" || x.verdict === f).sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict));
  const sel = M.cr.find((x) => x.id === ctx.local.cr) || list[0] || M.cr[0];
  const n = (v) => M.cr.filter((x) => x.verdict === v).length;
  // a handful first; the rest behind "show all" (the selected ad is always shown)
  const cut = !ctx.local.wallAll && list.length > 9 && list.indexOf(sel) < 9 ? 9 : list.length, shown = list.slice(0, cut);
  return `<div class="wtop"><div class="s">Every ad Archie ran in the last 7 days. Click one for why it was kept or cut.</div>${seg([["all", `All ${M.cr.length}`], ["winner", `Kept ${n("winner")}`], ["testing", `Testing ${n("testing")}`], ["cut", `Cut ${n("cut")}`]], f, "crf")}</div>
    <div class="wall"><div class="cts">${shown.map((x) => crTile(x, M, x.id === sel.id)).join("")}${cut < list.length ? `<button class="btn more-ads" data-wall-all>Showing ${cut} of ${list.length}. Show the other ${list.length - cut}</button>` : ""}</div>${crDetail(sel, M)}</div>`;
}

// ------------------------------------------------------------------ tab: tests
function testsHTML(M) {
  const T = M.D.tests || [];
  const rows = T.map((t) => {
    const side = (s) => { if (typeof s !== "string") return { label: s.label, v: s.value }; const x = M.cr.find((c) => c.id === s) || {}; return { label: x.headline || s, v: t.measure === "ctr" ? x.ctr : x.cpl, cr: s }; };
    const a = side(t.a), b = side(t.b), lower = t.measure === "cpl";
    const aWins = lower ? a.v <= b.v : a.v >= b.v, w = aWins ? a : b, l = aWins ? b : a;
    const by = lower ? `${pct(1 - w.v / l.v)} cheaper per lead` : t.measure === "ctr" ? `${(w.v / l.v).toFixed(1)} times as many clicked` : `${pct(w.v / l.v - 1)} more people got in touch`;
    const fmt = lower ? (v) => `${money(v)} a lead` : t.measure === "ctr" ? (v) => `${v}% clicked` : (v) => `${v}% got in touch`;
    const max = Math.max(a.v, b.v) || 1, done = t.status === "decided";
    const bar = (s, k, win) => `<div class="abr ${win ? "w" : ""}"><span class="ab-l">${k}</span><div><div class="ab-n" ${s.cr ? `data-cr="${s.cr}" title="Show this ad"` : ""}>${esc(s.label)}</div><i><b style="width:${(s.v / max) * 100}%"></b></i></div><em class="num">${esc(fmt(s.v))}</em></div>`;
    return `<div class="ab"><div><b>${esc(t.question)}</b><div class="s">${esc(M.byCamp[t.campaign_id]?.name || "")}</div></div>
      <div>${bar(a, "A", aWins)}${bar(b, "B", !aWins)}</div>
      <div class="ab-v">${done ? chip(`${aWins ? "A" : "B"} won`, "green") : chip(`Running · day ${t.day} of ${t.of_days}`, "holo")}<div class="s">${done ? `By ${by}` : `${aWins ? "A" : "B"} ahead so far: ${by}`}</div></div></div>`;
  });
  const d = T.filter((t) => t.status === "decided").length;
  return `<div class="s">Archie runs ads in pairs. One thing changes; the numbers decide. He doesn't call a winner until there are enough leads to trust it. ${d} decided, ${T.length - d} running.</div><div class="abs">${rows.join("")}</div>`;
}

// ------------------------------------------------------------------ tab: 12 weeks
function weeksHTML(M) {
  const W = M.W, lab = (w) => short(dayDate(w.day_offset)), tip = (w) => `${short(dayDate(w.day_offset))} to ${short(dayDate(w.day_offset + 6))}${w.i === W.length - 1 ? " (last 7 days)" : ""}`;
  const s = (k) => W.map((w) => ({ l: lab(w), v: w[k], w }));
  const first = W[0];
  return `<div class="s">Each bar is 7 days; the last one is the last 7 days. Hover for the figure.</div>
    <div class="g3w">
      <div><h4>Spent each week</h4>${barChart(s("ad_spend"), { h: 150, fmt: (v) => money(v, 0), label: (d) => tip(d.w) })}${working(`${money(first.ad_spend, 0)} → ${money(M.spend)}`)}</div>
      <div><h4>Leads each week</h4>${barChart(s("ad_leads"), { h: 150, fmt: (v) => String(v), label: (d) => tip(d.w) })}${working(`${first.ad_leads} → ${M.leads} leads`)}</div>
      <div><h4>Cost per lead, lower is better</h4>${lineChart(s("ad_cpl"), { h: 150, fmt: (v) => money(v, 0), label: (d) => tip(d.w) })}${working(`${money(first.ad_cpl)} → ${money(M.cpl)}`)}</div>
    </div>
    ${working(`Last 28 days: ${money(M.Mo.last28.ad_spend)} ÷ ${M.Mo.last28.ad_leads} leads = ${money(M.Mo.last28.ad_cpl)} a lead`)}`;
}

// ------------------------------------------------------------------ tab: changes (and Maeve's live check)
function driftHTML(X) {
  const w = X.work || {};
  return `<div class="drift"><div class="dh"><b>${hhmm(X.startedAt)} · Archie went off task, and Maeve stopped him</b>${X.running ? `<span class="shimmer">live</span>` : ""}</div>
    <div class="steps">
      <div class="stp ${X.stage === "drift" ? "on" : "done"}"><b>Archie changed the boiler campaign</b><div class="s">“${esc(w.headline)}. ${esc(w.description)}” · keywords: ${(w.keywords || []).map(esc).join(", ")} · daily cap £${esc(w.daily_cap_gbp)}</div><div class="s">His reason: ${esc(w.why || "")}</div></div>
      ${X.check ? `<div class="stp ${X.check.on_task ? "done" : "bad"}"><b>Maeve: ${X.check.on_task ? "on task" : "off task, paused it"}</b>${(X.check.problems || []).length ? `<ul>${X.check.problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}${X.check.instruction ? `<div class="s"><b>Told Archie:</b> ${esc(X.check.instruction)}</div>` : ""}</div>` : X.stage === "checking" ? `<div class="stp on"><b class="shimmer">Maeve's checking it against his brief…</b></div>` : ""}
      ${X.redo ? `<div class="stp done"><b>Archie redid it inside the limits</b><div class="s">“${esc(X.redo.headline)}. ${esc(X.redo.description)}” · cap £${esc(X.redo.daily_cap_gbp)}</div><div class="s">${esc(X.redo.note_to_maeve)}</div></div>` : X.stage === "redoing" ? `<div class="stp on"><b class="shimmer">Archie's redoing it inside his limits…</b></div>` : ""}
      ${X.recheck ? `<div class="stp ${X.recheck.on_task ? "done" : "bad"}"><b>Maeve: ${X.recheck.on_task ? "back on task" : "still not right"}</b><div class="s">${esc(X.recheck.summary)}</div></div>` : X.stage === "rechecking" ? `<div class="stp on"><b class="shimmer">Maeve's checking the redo…</b></div>` : ""}
    </div></div>`;
}
function changesHTML(M, ctx) {
  const X = ctx.F.drift, C = M.D.changes || [];
  const top = X ? driftHTML(X) : `<div class="dcta"><div><b>What happens if Archie goes off task?</b><div class="s">Maeve checks every change he makes against his limits. Watch her catch one live.</div></div><button class="btn" data-drift>Watch Maeve check him</button></div>`;
  return `${top}<div class="chg-l">${C.map((x) => `<div class="chg"><time>${esc(day(x.day_offset))}</time><div><b>${esc(x.what)}</b><div class="s">${esc(x.why)}</div>
      <div class="row">${chip(x.kind)}<span class="s">${esc(M.byCamp[x.campaign_id]?.name || "")}</span><span class="who-c ${x.who === "On his own" ? "" : "k"}">${esc(x.who)}</span></div></div></div>`).join("")}</div>`;
}

// ------------------------------------------------------------------ tab: Kieran's limits
function limitsHTML(M, ctx) {
  const L = M.L, A = M.A, maxCap = Math.max(0, ...M.camps.map((c) => c.daily_cap_gbp || 0)), top = M.camps.find((c) => c.daily_cap_gbp === maxCap);
  const waiting = (ctx.acts.runs || []).filter((r) => r.status === "waiting for Kieran").length + M.needs.length;
  const lim = (label, used, of, v, sub) => `<div class="lim"><div><b>${label}</b><div class="s">${sub}</div></div><div class="lv">${meter(v)}<span class="num">${used} <span class="muted">of ${of}</span></span></div></div>`;
  return `<div class="lg2"><div>
    <div class="s">Archie works inside these. Anything outside them goes to ${esc(L.set_by || "Kieran")} first, and Maeve checks he sticks to them.</div>
    ${lim("Daily cap, any one campaign", money(maxCap, 0), money(L.max_daily_cap_gbp, 0), maxCap / L.max_daily_cap_gbp, top ? `Highest now: ${esc(top.name)}` : "")}
    ${lim("All live campaigns, per day", money(M.liveCaps, 0), money(L.max_total_daily_gbp, 0), M.liveCaps / L.max_total_daily_gbp, M.camps.some((c) => c.status === "paused") ? `${M.camps.filter((c) => c.status === "paused").map((c) => c.name).join(", ")} paused, so not counted` : "Every campaign is live")}
    ${lim(`Ad budget for ${esc(M.Mo.month.label)}`, money(A.spent_month, 0), money(A.month_budget, 0), A.spent_month / A.month_budget, `${A.days_left} days to go`)}
    <div class="lim"><div><b>Where</b><div class="s">${esc(L.area)}</div></div><div class="lv">${chip("Holding", "green")}</div></div>
    <div class="lim col"><div><b>Prices and claims</b><div class="s">Only what's on Kingpost's list</div></div>
      <div class="chips">${(L.claims_ok || []).map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>
      <div class="chips">${(L.claims_never || []).map((x) => `<span class="chip red no">${esc(x)}</span>`).join("")}</div></div>
  </div><div class="two">
    <div><h4>Archie can, on his own</h4><ul class="dots">${(L.can_alone || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div><h4>Needs Kieran first${waiting ? ` <span class="chip amber">${waiting} waiting</span>` : ""}</h4><ul class="dots k">${(L.needs_kieran || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
  </div></div>`;
}

function detailHTML(M, ctx) {
  const tab = ctx.local.tab || "camps";
  const right = { camps: "click a campaign for the detail", wall: `${M.cr.length} ads, last 7 days`, tests: "A against B", weeks: "spend, leads, cost per lead", changes: `${(M.D.changes || []).length} of his ${num(M.Mo.employees.ads.units.at(-1))} changes and checks, last 7 days`, limits: `set by ${esc(M.L.set_by || "Kieran")}` }[tab];
  const body = { camps: campsHTML, wall: wallHTML, tests: testsHTML, weeks: weeksHTML, changes: changesHTML, limits: limitsHTML }[tab](M, ctx);
  return `<section class="card det" id="ads-detail"><div class="ch">${seg(TABS, tab, "tab")}<span class="r">${right}</span></div><div class="tb">${body}</div></section>`;
}

export default {
  css: `
.pg-ads .s { font-size: 12.5px; color: var(--ink-3); }
.pg-ads .mt8 { margin-top: 8px; }
.pg-ads h4 { margin: 16px 0 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
.pg-ads .card .ch { flex-wrap: wrap; }
.pg-ads .chips, .pg-ads .pf { display: flex; flex-wrap: wrap; gap: 4px; }
.pg-ads .more-ads { grid-column: 1 / -1; justify-self: start; }
.pg-ads .chip.no { text-decoration: line-through; text-decoration-color: rgba(255, 255, 255, .3); }
.pg-ads .working-line { overflow-wrap: anywhere; }

/* hero */
.pg-ads .hero { padding: 20px 24px 22px; }
.pg-ads .hero .ch .r { color: var(--holo-2); }
.pg-ads .stages { display: grid; grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr) 28px minmax(0, 1fr); align-items: stretch; margin-top: 8px; }
.pg-ads .stg { display: grid; grid-template-rows: auto auto auto 1fr; min-width: 0; padding: 4px 0; }
.pg-ads .stg .lab { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
.pg-ads .stg .v { font: 300 42px/1.1 var(--mono); letter-spacing: -0.04em; color: #fff; text-shadow: none; margin-top: 6px; white-space: nowrap; }
.pg-ads .stg.win .v { text-shadow: none; }
.pg-ads .stg .s { margin-top: 2px; }
.pg-ads .stg .s.up { color: var(--green); }
.pg-ads .stg .s.down { color: var(--red); }
.pg-ads .stg .trend { margin-top: 10px; align-self: end; }
.pg-ads .arr { position: relative; align-self: start; margin-top: 50px; height: 2px; margin-left: 4px; margin-right: 8px; background: linear-gradient(90deg, transparent, var(--holo)); opacity: .7; }
.pg-ads .arr::after { content: ""; position: absolute; right: -1px; top: -4px; border: 5px solid transparent; border-left: 7px solid var(--holo); border-right: 0; filter: drop-shadow(0 0 4px var(--holo)); }
.pg-ads .trend { position: relative; width: 100%; }
.pg-ads .trend svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.pg-ads .trend polyline { fill: none; stroke: var(--holo); stroke-width: 1.6; stroke-linejoin: round; filter: drop-shadow(0 0 3px rgba(70, 200, 255, .9)); }
.pg-ads .trend > i { position: absolute; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px var(--holo); }
.pg-ads .hrow { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 24px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--line); align-items: center; }
.pg-ads .fun { display: block; width: 100%; height: auto; overflow: visible; }
.pg-ads .fun .fs { stroke: rgba(70, 200, 255, .55); stroke-width: 1; filter: drop-shadow(0 0 6px rgba(70, 200, 255, .35)); }
.pg-ads .fun .fx line { stroke: rgba(166, 230, 255, .35); stroke-width: 1; stroke-dasharray: 2 3; }
.pg-ads .fun .pd { fill: var(--holo-2); opacity: 0; }
.pg-ads .fun .pl { fill: #fff; opacity: 0; filter: drop-shadow(0 0 3px var(--holo)); }
.pg-ads .fun .node { fill: #fff; filter: drop-shadow(0 0 6px var(--holo)) drop-shadow(0 0 12px var(--holo)); animation: pulse 1.6s ease-in-out infinite; transform-origin: 398px 70px; }
.pg-ads .f3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 10px; font-size: 12px; color: var(--ink-3); }
.pg-ads .f3 span:nth-child(2) { text-align: center; }
.pg-ads .f3 span:nth-child(3) { text-align: right; }
.pg-ads .f3 b { display: block; font: 400 18px/1.3 var(--mono); color: var(--ink); }
.pg-ads .f3 em { display: block; font: 400 11px/1.4 var(--mono); font-style: normal; color: var(--holo-2); opacity: .75; }
.pg-ads .gwrap { display: grid; justify-items: center; gap: 12px; min-width: 0; }
.pg-ads .gz { position: relative; width: min(220px, 100%); aspect-ratio: 1; }
.pg-ads .gz svg { width: 100%; height: 100%; overflow: visible; }
.pg-ads .gz .gt { fill: none; stroke: rgba(120, 200, 255, .1); stroke-width: 16; }
.pg-ads .gz .gs { fill: none; stroke: var(--holo); stroke-width: 12; filter: drop-shadow(0 0 6px var(--holo)); animation: adg 1.3s cubic-bezier(.2, .8, .2, 1) .15s forwards; }
@keyframes adg { to { stroke-dashoffset: 0; } }
.pg-ads .gz .gm { stroke: #fff; stroke-width: 2; filter: drop-shadow(0 0 4px #fff); }
.pg-ads .gz .gd { fill: none; stroke: rgba(120, 200, 255, .18); stroke-dasharray: 2 6; }
.pg-ads .gc { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; text-align: center; }
.pg-ads .gc b { font: 300 40px/1 var(--mono); letter-spacing: -0.04em; color: #fff; text-shadow: none; }
.pg-ads .gk { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
.pg-ads .gk > div { border-left: 1px solid var(--line); padding-left: 12px; min-width: 0; }
.pg-ads .gk b { display: block; font: 400 17px/1.3 var(--mono); color: var(--ink); }
.pg-ads .gk span { font-size: 11.5px; color: var(--ink-3); line-height: 1.35; display: block; }
.pg-ads .gwrap .working-line { justify-self: stretch; margin-top: 0; }

/* live */
.pg-ads .live { border-color: rgba(70, 200, 255, .3); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04), 0 0 40px -24px var(--holo-glow); }
.pg-ads .wait-k { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px 14px; margin-top: 8px; border-radius: 12px; background: var(--amber-tint); border: 1px solid rgba(255, 181, 71, .3); }
.pg-ads .wait-k b { display: block; font-weight: 600; color: var(--amber-ink); font-size: 13.5px; }
.pg-ads .svc { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.pg-ads .sv { display: grid; gap: 4px; text-align: left; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .02); cursor: pointer; font: inherit; color: var(--ink-2); min-width: 0; transition: border-color .15s, background .15s; }
.pg-ads .sv b { font-size: 13px; font-weight: 600; line-height: 1.3; color: var(--ink); }
.pg-ads .sv .k { font-size: 11.5px; color: var(--ink-3); }
.pg-ads .sv .k.amber { color: var(--amber-ink); }
.pg-ads .sv .k.holo { color: var(--holo-2); }
.pg-ads .sv:hover { border-color: var(--line-2); background: var(--holo-tint); }
.pg-ads .sv.on { border-color: var(--holo); background: var(--holo-tint); box-shadow: inset 0 0 0 1px rgba(70, 200, 255, .4), 0 0 20px -8px var(--holo-glow); }
.pg-ads .sv-d { display: grid; gap: 8px; margin-top: 12px; }
.pg-ads .sv-d .mono { color: var(--holo-2); }
.pg-ads .lf { display: flex; gap: 8px; margin-top: 14px; }
.pg-ads .lf input { flex: 1; min-width: 0; height: 44px; padding: 0 14px; font-size: 13.5px; }
.pg-ads .btn.cta { height: 44px; padding: 0 22px; font-size: 14px; border-radius: 12px; }
.pg-ads .lrun { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--line); }
.pg-ads .lhd { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
.pg-ads .lhd b { font-weight: 600; font-size: 15px; color: #fff; }
.pg-ads .lsteps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.pg-ads .stp.on.amber { border-color: rgba(255, 181, 71, .5); background: var(--amber-tint); }
.pg-ads .stp.on.amber b { color: var(--amber-ink); }
.pg-ads .lads { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
.pg-ads .lads.ghost { margin-top: 16px; }
.pg-ads .lads.ghost .lad { border-style: dashed; border-color: var(--line-2); }
.pg-ads .lads.ghost .mock b { color: var(--ink-3); }
.pg-ads .lads.ghost .mock p { color: var(--ink-3); opacity: .8; }
.pg-ads .lad { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; align-content: start; padding: 12px; border: 1px solid var(--line); border-radius: 14px; min-width: 0; background: rgba(255, 255, 255, .015); }
.pg-ads .lad.flag { border-color: rgba(255, 181, 71, .45); }
.pg-ads .lad .mock { border: 1px solid var(--line); border-radius: 10px; min-height: 112px; }
.pg-ads .cc { display: flex; gap: 12px; font-size: 11.5px; color: var(--ink-3); }
.pg-ads .cc .over, .pg-ads .cc .over b { color: var(--red); }
.pg-ads .lgrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 12px; margin-top: 12px; }
.pg-ads .box { padding: 14px; border: 1px solid var(--line); border-radius: 14px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; align-content: start; min-width: 0; background: rgba(255, 255, 255, .015); }
.pg-ads .box h4 { margin: 0; }
.pg-ads .box .note ul { margin: 4px 0 0; padding-left: 20px; }
.pg-ads .sum { margin: 4px 0 0; font-size: 13.5px; color: var(--ink); }
.pg-ads .tok { font-size: 13px; padding: 8px 12px; border-left: 2px solid var(--amber); background: var(--amber-tint); color: var(--amber-ink); border-radius: 0 8px 8px 0; }
.pg-ads .runs { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }

/* search ad mock, dark */
.pg-ads .mock { display: grid; gap: 4px; align-content: start; padding: 12px 14px; background: linear-gradient(180deg, rgba(20, 38, 58, .7), rgba(10, 20, 31, .7)); min-height: 124px; }
.pg-ads .mock .sp { font-size: 11px; font-weight: 600; color: var(--ink); }
.pg-ads .mock .url { font: 11px var(--mono); color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pg-ads .mock b { font-size: 14px; line-height: 1.3; font-weight: 500; color: var(--holo-2); }
.pg-ads .mock p { margin: 0; font-size: 12.5px; line-height: 1.4; color: var(--ink-2); }

/* detail tabs */
.pg-ads .det > .ch { align-items: center; margin-bottom: 16px; }
.pg-ads .det > .ch .r { font-size: 12px; color: var(--ink-3); }
.pg-ads table.t.mini td, .pg-ads table.t.mini th { padding: 8px; }
.pg-ads .camps tr[data-camp] { cursor: pointer; }
.pg-ads .camps tr.sel td { background: var(--holo-tint); }
.pg-ads .camps tr.sel td:first-child { box-shadow: inset 2px 0 0 var(--holo); }
.pg-ads .camps tr.tot td { background: rgba(255, 255, 255, .025); color: var(--ink); }
.pg-ads .cn { display: flex; gap: 12px; align-items: center; }
.pg-ads .cn b { font-weight: 600; color: var(--ink); }
.pg-ads .sw { width: 4px; height: 30px; border-radius: 4px; flex: none; box-shadow: 0 0 10px currentColor; }
.pg-ads .sw.lg { height: 40px; }
.pg-ads .cd { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--line); }
.pg-ads .cd-h { display: flex; gap: 12px; align-items: center; }
.pg-ads .cd-h > div { flex: 1; min-width: 0; }
.pg-ads .cd-h b { font-size: 15px; font-weight: 600; color: #fff; }
.pg-ads .cg3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; margin-top: 16px; }
.pg-ads .cg3 > div { min-width: 0; }
.pg-ads .cg3 .chart { margin-top: 12px; }
.pg-ads .wtop { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.pg-ads .wall { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; margin-top: 16px; align-items: start; }
.pg-ads .cts { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.pg-ads .ct { display: flex; flex-direction: column; text-align: left; font: inherit; color: inherit; padding: 0; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: rgba(255, 255, 255, .02); cursor: pointer; min-width: 0; transition: border-color .15s, box-shadow .2s; }
.pg-ads .ct:hover { border-color: var(--line-2); }
.pg-ads .ct:focus-visible { outline: 2px solid var(--holo); outline-offset: 2px; }
.pg-ads .ct.on { border-color: var(--holo); box-shadow: inset 0 0 0 1px var(--holo), 0 0 24px -8px var(--holo-glow); }
.pg-ads .ct > .mock, .pg-ads .ct > .vis { border-bottom: 1px solid var(--line); }
.pg-ads .ct.winner > .mock, .pg-ads .ct.winner > .vis { box-shadow: inset 0 -2px 0 var(--green); }
.pg-ads .ct.cut > .mock, .pg-ads .ct.cut > .vis { opacity: .45; }
.pg-ads .ct.cut .mock b, .pg-ads .ct.cut .cb > b { text-decoration: line-through; text-decoration-color: var(--ink-3); }
.pg-ads .vis { position: relative; min-height: 124px; padding: 40px 12px 12px; display: flex; align-items: flex-end; background-color: var(--panel-3); background-image: radial-gradient(120% 90% at 80% 0%, rgba(70, 200, 255, .16), transparent 60%), var(--grid); background-size: 100% 100%, 16px 16px, 16px 16px; }
.pg-ads .vis .fmt { position: absolute; top: 10px; left: 10px; display: inline-flex; align-items: center; gap: 6px; font: 500 11px var(--mono); color: var(--holo-2); background: rgba(3, 7, 12, .7); border: 1px solid var(--line-2); padding: 3px 8px; border-radius: 6px; }
.pg-ads .vis .fmt svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linejoin: round; }
.pg-ads .vis p { margin: 0; font-size: 12px; line-height: 1.4; color: var(--ink-2); font-style: italic; }
.pg-ads .cb { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; padding: 12px; }
.pg-ads .cb > b { font-size: 13px; line-height: 1.3; font-weight: 600; color: var(--ink); }
.pg-ads .cm { font-size: 11.5px; color: var(--ink-2); }
.pg-ads .cb .row { flex-wrap: nowrap; }
.pg-ads .cb .row .s { font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; }
.pg-ads .cdet { position: sticky; top: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding: 16px; border: 1px solid var(--line-2); border-radius: 14px; background: rgba(255, 255, 255, .02); }
.pg-ads .cdet .mock, .pg-ads .cdet .vis { border: 1px solid var(--line); border-radius: 10px; min-height: 0; }
.pg-ads .cdet .hl { font-size: 15px; font-weight: 600; line-height: 1.3; color: #fff; }
.pg-ads .cdet h4 { margin: 0 0 4px; }
.pg-ads .why p { margin: 0; font-size: 13.5px; line-height: 1.45; color: var(--ink); }
.pg-ads .st6 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: 10px; }
.pg-ads .st6 > div { padding: 8px 12px; border-left: 1px solid var(--line); min-width: 0; }
.pg-ads .st6 > div:nth-child(3n+1) { border-left: 0; }
.pg-ads .st6 > div:nth-child(n+4) { border-top: 1px solid var(--line); }
.pg-ads .st6 b { display: block; font: 400 15px/1.3 var(--mono); color: #fff; }
.pg-ads .st6 span { font-size: 11.5px; color: var(--ink-3); }
.pg-ads .cdet .hb { grid-template-columns: 104px minmax(0, 1fr) auto; }
.pg-ads .abs { margin-top: 8px; }
.pg-ads .ab { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.5fr) 200px; gap: 24px; align-items: center; padding: 16px 0; border-top: 1px solid var(--line); }
.pg-ads .ab:first-child { border-top: 0; }
.pg-ads .ab > div:first-child b { font-weight: 600; color: var(--ink); }
.pg-ads .abr { display: grid; grid-template-columns: 20px minmax(0, 1fr) 136px; gap: 8px; align-items: end; }
.pg-ads .abr + .abr { margin-top: 8px; }
.pg-ads .ab-l { display: grid; place-items: center; width: 20px; height: 20px; border: 1px solid var(--line-2); border-radius: 6px; font: 600 11px var(--mono); color: var(--ink-3); }
.pg-ads .abr.w .ab-l { border-color: var(--holo); color: var(--holo-2); box-shadow: 0 0 10px -2px var(--holo-glow); }
.pg-ads .ab-n { font-size: 12.5px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.pg-ads .ab-n[data-cr] { cursor: pointer; text-decoration: underline; text-decoration-color: var(--line-2); text-underline-offset: 2px; }
.pg-ads .ab-n[data-cr]:hover { color: var(--ink); }
.pg-ads .abr i { display: block; height: 8px; background: rgba(255, 255, 255, .06); border-radius: 8px; overflow: hidden; }
.pg-ads .abr i b { display: block; height: 100%; border-radius: 8px; background: rgba(166, 230, 255, .28); }
.pg-ads .abr.w i b { background: linear-gradient(90deg, rgba(70, 200, 255, .4), var(--holo)); box-shadow: 0 0 10px rgba(70, 200, 255, .6); }
.pg-ads .abr em { font-style: normal; font-size: 12px; text-align: right; color: var(--ink-3); white-space: nowrap; }
.pg-ads .abr.w em { color: var(--ink); }
.pg-ads .ab-v { display: grid; gap: 4px; justify-items: start; }
.pg-ads .g3w { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.pg-ads .g3w > div { min-width: 0; }
.pg-ads .drift { border: 1px solid var(--line-2); border-radius: 14px; padding: 14px; background: rgba(255, 255, 255, .02); }
.pg-ads .dh { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 13px; color: var(--ink); }
.pg-ads .dcta { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px; border: 1px dashed var(--line-2); border-radius: 14px; }
.pg-ads .dcta b { color: var(--ink); }
.pg-ads .chg { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); }
.pg-ads .chg-l { margin-top: 8px; }
.pg-ads .chg-l .chg:first-child { border-top: 0; }
.pg-ads .chg time { font-size: 11.5px; color: var(--holo-2); padding-top: 2px; }
.pg-ads .chg b { font-weight: 600; font-size: 13.5px; color: var(--ink); }
.pg-ads .chg .row { margin-top: 8px; }
.pg-ads .who-c { margin-left: auto; font-size: 11.5px; color: var(--ink-3); }
.pg-ads .who-c.k { color: var(--amber-ink); font-weight: 500; }
.pg-ads .lg2 { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 32px; }
.pg-ads .lim { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 16px; align-items: center; padding: 12px 0; border-top: 1px solid var(--line); }
.pg-ads .lim:first-of-type { margin-top: 8px; }
.pg-ads .lim b { font-weight: 600; font-size: 13.5px; color: var(--ink); }
.pg-ads .lim.col { grid-template-columns: 1fr; }
.pg-ads .lv { display: flex; align-items: center; gap: 12px; justify-content: flex-end; font-size: 13px; }
.pg-ads .lv .meter i { width: 96px; }
.pg-ads .two { display: grid; gap: 8px; align-content: start; }
.pg-ads .two h4:first-child { margin-top: 0; }
.pg-ads ul.dots { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; font-size: 13px; color: var(--ink-2); }
.pg-ads ul.dots li { display: grid; grid-template-columns: 6px minmax(0, 1fr); gap: 8px; align-items: start; }
.pg-ads ul.dots li::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); margin-top: 7px; }
.pg-ads ul.dots.k li::before { background: var(--amber); box-shadow: 0 0 6px var(--amber); }

/* narrower windows (Tom's laptop is about 680px of page) */
@container (max-width: 1080px) {
  .pg-ads .svc { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pg-ads .wall { grid-template-columns: minmax(0, 1fr); }
  .pg-ads .cdet { position: static; }
  .pg-ads .cg3 { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .pg-ads .cg3 > div:last-child { grid-column: 1 / -1; }
  .pg-ads .ab { grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); }
  .pg-ads .ab-v { grid-column: 1 / -1; grid-auto-flow: column; justify-content: start; align-items: center; gap: 12px; }
  .pg-ads .lg2 { grid-template-columns: minmax(0, 1fr); gap: 16px; }
}
@container (max-width: 760px) {
  .pg-ads .stg .v { font-size: 34px; }
  .pg-ads .arr { margin-top: 44px; }
  .pg-ads .hrow { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 20px; }
  .pg-ads .gk { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .pg-ads .g3w { grid-template-columns: minmax(0, 1fr); gap: 20px; }
  .pg-ads .lads, .pg-ads .lgrid { grid-template-columns: minmax(0, 1fr); }
  .pg-ads .lads.ghost { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pg-ads .lads.ghost .mock p { display: none; }
  .pg-ads .lads.ghost .mock { min-height: 84px; }
  .pg-ads .lads.ghost .lad .row .s { display: none; }
  .pg-ads .camps th:nth-child(3), .pg-ads .camps td:nth-child(3) { display: none; }
}
@container (max-width: 600px) {
  .pg-ads .hero { padding: 16px; }
  .pg-ads .stages { grid-template-columns: minmax(0, 1fr) 14px minmax(0, 1fr) 14px minmax(0, 1fr); }
  .pg-ads .arr { margin: 30px 2px 0; opacity: .5; }
  .pg-ads .gc .ring-l { letter-spacing: .1em; font-size: 9.5px; margin-bottom: 4px; }
  .pg-ads .stg .v { font-size: 22px; letter-spacing: -0.03em; }
  .pg-ads .stg .lab { font-size: 9.5px; letter-spacing: .12em; }
  .pg-ads .stg .s { font-size: 11px; }
  .pg-ads .hrow { grid-template-columns: minmax(0, 1fr); }
  .pg-ads .gwrap { grid-template-columns: 180px minmax(0, 1fr); align-items: center; justify-items: stretch; }
  .pg-ads .gwrap .working-line { grid-column: 1 / -1; }
  .pg-ads .gc b { font-size: 30px; }
  .pg-ads .svc { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pg-ads .lf { flex-direction: column; align-items: stretch; }
  .pg-ads .lsteps { grid-template-columns: minmax(0, 1fr); }
  .pg-ads .lads.ghost { grid-template-columns: minmax(0, 1fr); }
  .pg-ads .lads.ghost .lad:nth-child(n+2) { display: none; }
  .pg-ads .cts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pg-ads .cg3, .pg-ads .ab { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .pg-ads .camps th:nth-child(2), .pg-ads .camps td:nth-child(2) { display: none; }
  .pg-ads .lim { grid-template-columns: minmax(0, 1fr); }
  .pg-ads .lv { justify-content: flex-start; }
  .pg-ads .chg { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .pg-ads .lhd { flex-direction: column; align-items: flex-start; }
  .pg-ads .dcta { flex-direction: column; align-items: flex-start; }
}`,

  render(host, ctx) {
    const M = build(ctx), st = ctx.status("ads") || {};
    host.innerHTML = `<div class="inner pg-ads">
      ${head({ title: "Ads", agent: "ads", lede: "Archie turns ad money into leads, inside limits Kieran set.",
        actions: `${st.busy || st.alert ? `<span class="chip ${st.alert ? "red" : "holo"}">${st.busy ? dot("busy") : ""}${esc(st.text || "")}</span>` : ""}<button class="btn primary" data-jump>Write three test ads</button>` })}
      ${heroHTML(M)}
      ${liveHTML(ctx, M)}
      ${detailHTML(M, ctx)}
      ${foot()}</div>`;

    const L = ctx.local;
    $("[data-jump]", host)?.addEventListener("click", () => { $("#ads-live", host)?.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => $("#ads-focus", host)?.focus({ preventScroll: true }), 500); });
    $$("[data-tab]", host).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; ctx.redraw(); }));
    $$("[data-camp]", host).forEach((r) => (r.onclick = () => { L.camp = r.dataset.camp; ctx.redraw(); }));
    $$("[data-crf]", host).forEach((b) => (b.onclick = () => { L.crf = b.dataset.crf; L.cr = null; ctx.redraw(); }));
    $$("[data-cr]", host).forEach((b) => (b.onclick = () => {
      const fromWall = !!b.closest(".wall"), x = M.cr.find((c) => c.id === b.dataset.cr);
      L.cr = b.dataset.cr; if (x && L.crf && L.crf !== "all" && L.crf !== x.verdict) L.crf = "all";
      L.tab = "wall"; ctx.redraw();
      if (!fromWall) setTimeout(() => $("#ads-detail", host)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }));
    $$("[data-svc]", host).forEach((b) => (b.onclick = () => { L.svc = b.dataset.svc; ctx.redraw(); }));
    $("[data-wall-all]", host)?.addEventListener("click", () => { L.wallAll = true; ctx.redraw(); });
    const fi = $("#ads-focus", host); if (fi) fi.oninput = () => (L.focus = fi.value);
    $("[data-write]", host)?.addEventListener("click", async (e) => {
      const btn = e.currentTarget, svc = L.svc || M.D.services?.[0]?.id; btn.disabled = true; L.run = null;
      try { const r = await ctx.act("write", { service: svc, focus: L.focus || "" }); L.run = r.id; patchLive(ctx); }
      catch (err) { ctx.flash(err.message); btn.disabled = false; }
    });
    $("[data-drift]", host)?.addEventListener("click", (e) => { e.currentTarget.disabled = true; L.tab = "changes"; ctx.api("/api/floor/drift", {}).catch((err) => { ctx.flash(err.message); ctx.redraw(); }); });
    wireRun($("#ads-live-run", host), ctx);
  },

  // stream Archie's run into its own card; redraw the page only when Maeve's check or a hand-off moves
  onEvent(ev, ctx) {
    if (ev.demo !== "floor") return false;
    if (ev.type === "act") { if (ev.page === "ads") patchLive(ctx); return false; }
    return ev.type === "drift" || ev.type === "relay";
  },
};
