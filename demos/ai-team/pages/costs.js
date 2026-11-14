// Costs (video 11): what the AI team costs, what it gives back, and when the setup paid for itself.
// Every figure comes from ctx.model (model.costs, model.month, model.weeks, model.employees), so it agrees with Home.
import { esc, money, num, av, head, seg, table, working, dot, foot, dayDate, $, $$, BY_ID, AGENTS } from "../ui.js";

const TABS = (fee) => [["emp", "Each employee"], ["hire", "Against hiring"], ["covers", `What ${money(fee, 0)} covers`], ["usage", "AI usage, at cost"]];
const sum = (a, k) => a.reduce((x, y) => x + (typeof k === "function" ? k(y) : Number(y[k]) || 0), 0);
const r2 = (n) => Math.round(n * 100) / 100;
const monthName = (off) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + off); return d.toLocaleDateString("en-GB", { month: "short" }); };
// round each part to pennies so the parts add up to the rounded total exactly (largest remainder)
function apportion(vals, total) {
  const pence = vals.map((v) => v * 100), fl = pence.map(Math.floor), want = Math.round(total * 100);
  let left = want - sum(fl, (x) => x);
  const order = pence.map((p, i) => [p - Math.floor(p), i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) { if (left <= 0) break; fl[i] += 1; left -= 1; }
  return fl.map((p) => p / 100);
}

// the week-by-week numbers every card here uses
function build(ctx) {
  const Mo = ctx.model, C = Mo.costs, mo = Mo.month, W = Mo.weeks, last = W[W.length - 1], E = Mo.employees, D = ctx.data || {};
  // a week's running cost = the fee spread over 52 weeks + a typical 7 days of AI usage (model.month.ai_week), as model.costs does
  const feeWeek = (C.monthly_fee * 12) / 52, aiWeek = mo.ai_week;
  const usageBy = Object.fromEntries(mo.usage.map((u) => [u.agent, u]));
  const raw = AGENTS.map((a) => feeWeek / AGENTS.length + (usageBy[a.id]?.week_cost || 0));
  const costs = apportion(raw, C.weekly_running);
  const emp = AGENTS.map((a, i) => { const h = E[a.id].hours[W.length - 1], aiw = usageBy[a.id]?.week_cost || 0; return { a, cost: costs[i], aiw, fee: r2(costs[i] - aiw), h, val: r2(h * Mo.rate), u: usageBy[a.id] || { cost: 0, calls: 0 }, k: E[a.id].kpis[0] }; })
    .map((e) => ({ ...e, per: e.cost ? e.val / e.cost : 0 }));
  return { Mo, C, mo, W, last, E, D, feeWeek, aiWeek, emp, perMonth: r2((C.weekly_running * 52) / 12) };
}

// ------------------------------------------------------------------ hero: payback, the three prices, each week now
function payback(M) {
  const cum = M.C.cumulative, n = cum.length, line = M.C.setup, pw = M.C.payback_week;
  // five or six gridlines whatever the size of the firm
  const top = Math.max(...cum) * 1.12, step = [5000, 10000, 20000, 25000, 50000, 100000].find((s) => top / s <= 5) || 200000;
  const max = Math.ceil(top / step) * step;
  const x = (i) => (i / (n - 1)) * 100, y = (v) => 100 - (v / max) * 100;
  const pts = cum.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const ticks = []; for (let t = 0; t <= max; t += step) ticks.push(t);
  const ci = pw - 1, endV = cum[n - 1];
  const xl = [1, 5, 10, 15, 20, 26].filter((w) => w <= n);
  return `<div class="pay">
    <div class="pay-c">
      ${ticks.map((t) => `<i class="gl" style="bottom:${(t / max) * 100}%"><span>${t ? `£${t / 1000}k` : "£0"}</span></i>`).join("")}
      <i class="thr" style="bottom:${(line / max) * 100}%"><span>Setup ${money(line, 0)}</span></i>
      <div class="pay-s"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="cpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46c8ff" stop-opacity=".34"/><stop offset="1" stop-color="#46c8ff" stop-opacity="0"/></linearGradient></defs><polygon points="0,100 ${pts} 100,100" fill="url(#cpg)"/><polyline points="${pts}" vector-effect="non-scaling-stroke"/></svg></div>
      <i class="drop" style="left:${x(ci)}%;height:${100 - y(cum[ci])}%"></i>
      ${cum.map((v, i) => `<div class="pt ${i === ci ? "hit" : ""} ${i === n - 1 ? "end" : ""}" style="left:${x(i)}%;top:${y(v)}%" data-tip="Week ${i + 1}: ${money(M.C.saved_since_setup[i], 0)} saved that week, ${money(v, 0)} in all"><i></i></div>`).join("")}
      <div class="tag-hit" style="left:${x(ci)}%;top:${y(cum[ci])}%">Paid back · week ${pw}</div>
      <div class="tag-end" style="top:${y(endV)}%">${money(endV, 0)}<small>saved so far</small></div>
    </div>
    <div class="pay-x">${xl.map((w) => `<span style="left:${x(w - 1)}%" class="${w === pw ? "on" : ""}">${w === n ? "now" : `wk ${w}`}</span>`).join("")}</div>
  </div>`;
}
function heroHTML(M) {
  const C = M.C, mo = M.mo, last = M.last, saved = M.Mo.last7.money_saved, ahead = r2(saved - C.weekly_running);
  return `<section class="card hud hero">
    <div class="ch"><h3>Paying back the setup</h3><span class="r">${dot("busy")} ${C.weeks_since_setup} weeks since setup</span></div>
    <div class="hgrid">
      <div class="pbk">
        <div class="pbh"><b class="v num" data-count="${C.payback_week}">Week ${C.payback_week}</b><span>Office time saved, added up week by week, passed the ${money(C.setup, 0)} setup ${C.weeks_since_setup - C.payback_week} weeks ago, before the monthly fee.</span></div>
        ${payback(M)}
        ${working(`${C.working.payback}, counting office time at ${money(M.Mo.rate, 0)} an hour`)}
      </div>
      <div class="prices">
        <div class="pr"><span class="lab">Setup, once</span><b class="num" data-count="${C.setup}">${money(C.setup, 0)}</b><span class="d">Ten AI employees, built around how Kingpost already works</span></div>
        <div class="pr"><span class="lab">Each month</span><b class="num" data-count="${C.monthly_fee}">${money(C.monthly_fee, 0)}</b><span class="d">Tom's Monday check, new rules, fixes and new jobs</span></div>
        <div class="pr ai"><span class="lab">AI usage</span><b>at cost</b><span class="d"><em class="num">${money(mo.ai_total)}</em> so far in ${esc(mo.label)}, about <em class="num">${money(M.aiWeek)}</em> a week, on Kingpost's own account. No markup.</span></div>
      </div>
    </div>
    <div class="now">
      <span class="lab">Each week now</span>
      <span><b class="num">${money(saved, 0)}</b> office time saved</span><span class="op">−</span>
      <span><b class="num">${money(C.weekly_running, 0)}</b> to run the team</span><span class="op">=</span>
      <span class="up"><b class="num">${money(ahead, 0)}</b> ahead</span><span class="s">A month, that's about ${money(M.Mo.firm.saved_month, 0)} of office time for ${money(M.perMonth, 0)} to run the team, before any work from the ${last.leads_marketing} leads Seren, Clara and Archie brought in</span>
    </div>
    ${working(`Running: ${C.working.weekly_running}. Saved: ${M.Mo.last7.working.money_saved}; ${M.Mo.firm.working.saved_month}. Running a month: ${money(C.weekly_running)} × 52 ÷ 12 = ${money(M.perMonth)}.`)}
    ${C.payback_after_fees_week ? `<div class="note" style="margin-top:12px"><b style="color:#fff">Counting everything:</b> ${esc(C.working.payback_after_fees)} (about ${Math.round(C.payback_after_fees_week / 4.33)} months from setup), from office time alone. New work from the leads comes on top.</div>` : ""}
  </section>`;
}

// ------------------------------------------------------------------ running cost each month
function monthsHTML(M) {
  const C = M.C, mo = M.mo;
  const months = (M.D.months || []).map((m) => { const u = m.month_offset === 0 ? mo.ai_total : m.usage_gbp; return { ...m, u, total: r2(C.monthly_fee + u), l: monthName(m.month_offset) }; });
  const maxU = Math.max(...months.map((m) => m.u), 1);
  return `<section class="card months"><div class="ch"><h3>Running cost each month</h3><span class="r">the fee + what the AI used, at cost</span></div>
    <div class="mh"><b class="v num">${money(mo.total)}</b><span>${esc(mo.label)} so far: ${money(C.monthly_fee, 0)} + ${money(mo.ai_total)} AI usage in the first ${num(mo.day - 0.5, 1)} days</span></div>
    <div class="mrows">${months.map((m, i) => `<div class="mr ${m.month_offset === 0 ? "cur" : ""}"><span class="ml">${esc(m.l)}${m.month_offset === 0 ? " <em>so far</em>" : ""}</span><span class="mteam">${m.team} on the team${m.note && m.month_offset !== 0 ? ` · ${esc(m.note)}` : ""}</span>
      <span class="mb"><b style="width:${(m.u / maxU) * 100}%"></b></span><span class="mu num">${money(m.u)}</span><span class="mtot num">${money(m.total)}</span></div>`).join("")}</div>
    ${working(`Every month: ${money(C.monthly_fee, 0)} fee + that month's AI usage. ${mo.label}: ${mo.working.ai_total}`)}
  </section>`;
}

// ------------------------------------------------------------------ tabs
function empHTML(M, ctx) {
  const sortBy = ctx.local.sort || "per";
  const rows = M.emp.slice().sort((x, y) => (sortBy === "hours" ? y.h - x.h : sortBy === "cost" ? y.cost - x.cost : y.per - x.per));
  const maxPer = Math.max(...rows.map((e) => e.per)), tCost = r2(sum(rows, "cost")), tH = Math.round(sum(rows, "h") * 10) / 10, tVal = r2(sum(rows, "val"));
  const body = [...rows.map((e) => [
    `<span class="who2" data-tip="${esc(`${e.a.name}: ${money(e.fee)} share of the fee + ${money(e.aiw)} AI usage in a typical 7 days = ${money(e.cost)}`)}">${av(e.a.id)}<span><b>${esc(e.a.name)}</b><span class="s">${esc(e.a.role)}</span></span></span>`,
    money(e.cost), `${num(e.h, 1)} h`, money(e.val),
    `<span class="vpp ${e.per >= 1 ? "pos" : ""}"><i><b style="width:${(e.per / maxPer) * 100}%"></b></i><em>${money(e.per)}</em></span>`,
    `<span class="s">${esc(e.k.value)} ${esc(e.k.label)}</span>`,
  ]), [`<b>All ten</b>`, `<b>${money(tCost)}</b>`, `<b>${num(tH, 1)} h</b>`, `<b>${money(tVal)}</b>`, `<b>${money(tVal / tCost)}</b>`, ""]];
  return `<div class="tt"><div class="s">Each employee's cost for a week (an equal share of the fee plus their own AI usage over a typical 7 days) against the office time they gave back in the last 7 days, at ${money(M.Mo.rate, 0)} an hour.</div>${seg([["per", "Back per £1"], ["hours", "Hours"], ["cost", "Cost"]], sortBy, "sort")}</div>
    ${table([{ label: "Employee" }, { label: "Cost a week", r: true }, { label: "Hours back", r: true }, { label: "Worth", r: true }, { label: "Back per £1", r: true }, { label: "What they did, 7 days" }], body, { cls: "emp", rowAttr: (i) => (i === rows.length ? `class="tot"` : "") })}
    ${working(`${money(M.feeWeek)} fee a week ÷ 10 = about ${money(M.feeWeek / AGENTS.length)} each + their AI usage (${money(M.aiWeek)} for all ten) = ${money(tCost)} a week. ${num(tH, 1)} h × ${money(M.Mo.rate, 0)} = ${money(tVal)} back`)}
    <div class="note mt">Maeve and Kit hardly give back hours themselves: they check the others' work and turn corrections into rules, which is what keeps everyone else's numbers up.</div>`;
}
// one office person a year, from the salary: at the default salary this is the £44,850 in model.firm (£23 an hour × 37.5 h × 52; 18 people = £67,275 a month)
function people(P, salary) {
  const ni = Math.max(0, salary - P.ni_threshold_gbp) * P.ni_rate, pension = Math.max(0, salary - P.pension_floor_gbp) * P.pension_rate;
  return { ni, pension, year: r2(salary + ni + pension + P.other_gbp) };
}
// "hire": what the AI team's hours would cost as new staff; "office": the AI team against Kingpost's whole office
function cmpHTML(M, P, salary, mode) {
  const Fm = M.Mo.firm, hrs = M.Mo.last7.hours, office = mode === "office", team = M.perMonth, r = people(P, salary);
  const n = office ? Fm.office_staff : Fm.people_worth, them = r2((r.year * n) / 12), max = Math.max(them, team), diff = them - team;
  const share = Math.round((team / them) * 100);
  const bar = (label, v, me) => `<div class="${me ? "me" : ""}"><span>${label}</span><i><b style="width:${(v / max) * 100}%"></b></i><em>${money(v, 0)}</em></div>`;
  const teamW = `AI team: ${money(M.C.weekly_running)} a week × 52 ÷ 12 = ${money(team, 0)} a month`;
  return `<div class="cmp2">
    <div>
      <div class="vsb">
        ${bar(office ? `Your office, ${Fm.office_staff} people, a month` : `${num(n, 1)} more office staff, a month`, them, false)}
        ${bar("The AI team, a month", team, true)}
      </div>
      ${working(office
        ? `${Fm.office_staff} people × ${money(r.year, 0)} a year ÷ 12 = ${money(them, 0)} a month. ${teamW}, ${share}% of that`
        : `${num(hrs, 1)} h ÷ 37.5 h = ${num(n, 1)} people × ${money(r.year, 0)} a year ÷ 12 = ${money(them, 0)} a month. ${teamW}`)}
      <div class="note ${diff > 0 ? "good" : "amber"} diff">${office
        ? `For about ${share}% of what the office costs, the AI team gives back ${Fm.share_of_office_pct}% of its week: ${num(hrs, 1)} of ${Fm.office_hours} hours. Nobody is replaced: the ${Fm.office_staff} get that time back for the work only people can do.`
        : diff > 0
          ? `On these figures the AI team costs about <b class="num">${money(diff, 0)}</b> a month less than taking on ${num(n, 1)} more people for the same hours.`
          : `At this salary, people cost about <b class="num">${money(-diff, 0)}</b> a month less. The case then rests on the leads, not the hours.`}</div>
    </div>
    <table class="t yr">
      <tr><td>Salary</td><td class="r num">${money(salary, 0)}</td></tr>
      <tr><td>Employer's National Insurance <span class="muted">${Math.round(P.ni_rate * 100)}% above ${money(P.ni_threshold_gbp, 0)}</span></td><td class="r num">${money(r.ni, 0)}</td></tr>
      <tr><td>Workplace pension <span class="muted">${Math.round(P.pension_rate * 100)}%</span></td><td class="r num">${money(r.pension, 0)}</td></tr>
      <tr><td>${esc(P.other_label)}</td><td class="r num">${money(P.other_gbp, 0)}</td></tr>
      <tr class="tot"><td>One office person, a year</td><td class="r num">${money(r.year, 0)}</td></tr>
    </table></div>`;
}
const hireMode = (L) => (L.mk === "office" ? "office" : "hire");
function hireHTML(M, ctx) {
  const P = M.D.people || {}, L = ctx.local, salary = Number(L.salary || P.salary_gbp), mode = hireMode(L), Fm = M.Mo.firm;
  const fill = (s) => String(s).replace("{people_worth}", num(Fm.people_worth, 1)).replace("{office_staff}", Fm.office_staff);
  return `<div class="tt"><div class="s">Kingpost's office: ${Fm.office_staff} people, ${Fm.office_hours} hours a week, ${money(Fm.office_pay_month, 0)} a month in pay. In the last 7 days the AI team gave back ${num(M.Mo.last7.hours, 1)} of those hours: ${Fm.share_of_office_pct}% of the office's week, ${num(Fm.people_worth, 1)} full-time people's worth. <span class="rough">Rough comparison, sample figures</span></div>${seg([["hire", "Hiring for those hours"], ["office", "Against the whole office"]], mode, "mk")}</div>
    <div class="sl"><div class="row"><span>${esc(P.role || "Office staff")} salary</span><b class="num" id="cost-sal">${money(salary, 0)}</b></div>
      <input type="range" min="${P.salary_min_gbp}" max="${P.salary_max_gbp}" step="500" value="${salary}" data-sal aria-label="Average office salary">
      <div class="row"><span class="s">Drag to match what you'd pay</span><span class="s">${money(P.salary_min_gbp, 0)} to ${money(P.salary_max_gbp, 0)}</span></div></div>
    <div id="cost-cmp">${cmpHTML(M, P, salary, mode)}</div>
    ${working(`${Fm.working.office_pay_month}. ${Fm.working.office_hours}. ${Fm.working.share_of_office}. ${Fm.working.people_worth}.`)}
    <ul class="cav">${(P.caveats || []).map((x) => `<li>${esc(fill(x))}</li>`).join("")}</ul>`;
}
function coversHTML(M, ctx) {
  const checks = (ctx.F.check?.checks || []).slice().sort((a, b) => a.day_offset - b.day_offset);
  const maxMin = Math.max(1, ...checks.map((k) => k.minutes_spent));
  return `<div class="cov">${(M.D.covers || []).map((x) => `<div><b>${esc(x.title)}</b><p>${esc(x.detail)}</p><em>${esc(x.when)}</em></div>`).join("")}</div>
    <div class="cv2">
      <div class="note">Not included: ${esc(M.D.not_covered || "")}</div>
      <div class="mon"><h4>Tom's Monday checks, getting quicker as the rules build up</h4>
        ${checks.map((k) => `<div class="mc"><span>${dayDate(k.day_offset).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span><i><b style="width:${(k.minutes_spent / maxMin) * 100}%"></b></i><em class="num">${k.minutes_spent} min</em></div>`).join("")}
        <a class="btn sm" href="#check">Open the weekly check</a></div>
    </div>`;
}
function usageHTML(M, ctx) {
  const us = ctx.local.us || "cost", mo = M.mo, O = ctx.F.overview?.costs || {}, tok = Object.fromEntries((ctx.F.overview?.usage_this_month || []).map((u) => [u.agent, u]));
  // tokens follow from the model's cost: cost in dollars ÷ the blended price per token for that employee's mix of input and output
  const tokens = (u) => { const t = tok[u.agent], p = t && O.prices_usd_per_million?.[t.model]; if (!p || !O.usd_to_gbp) return 0; const s = t.output_share || 0; return ((u.cost / O.usd_to_gbp) * 1e6) / ((1 - s) * p[0] + s * p[1]); };
  const list = mo.usage.slice().sort((a, b) => (us === "calls" ? b.calls - a.calls : b.cost - a.cost));
  const M2 = (n) => r2(n / 1e6), calls = sum(list, "calls"), tTok = r2(sum(list, (u) => M2(tokens(u))));
  const rows = list.map((u) => { const t = tok[u.agent] || {}, tk = M2(tokens(u)); return [
    `<span class="who2">${av(u.agent)}<b>${esc(BY_ID[u.agent]?.name || u.name)}</b></span>`, `<span class="s">${esc(t.model || "")}</span>`, num(u.calls),
    tk ? `${tk.toFixed(2)}M` : "", money(u.cost), `${((u.cost / u.calls) * 100).toFixed(1)}p`]; });
  rows.push([`<b>All ten</b>`, "", `<b>${num(calls)}</b>`, `<b>${tTok.toFixed(2)}M</b>`, `<b>${money(mo.ai_total)}</b>`, `<b>${((mo.ai_total / calls) * 100).toFixed(1)}p</b>`]);
  return `<div class="ac">
      <div class="pts">${(M.D.at_cost || []).map((x) => `<div><b>${esc(x.title)}</b><p>${esc(x.detail)}</p></div>`).join("")}
        <div class="kv k3"><div><b>${num(calls)}</b><span>calls in ${esc(mo.label)} so far</span></div><div><b>${((mo.ai_total / calls) * 100).toFixed(1)}p</b><span>a call, on average</span></div><div><b>£0</b><span>markup</span></div></div></div>
      <div><div class="tt">${seg([["cost", "By cost"], ["calls", "By calls"]], us, "us")}<span class="s">${esc(mo.label)}, ${num(mo.day - 0.5, 1)} days so far</span></div>
        ${table([{ label: "Employee" }, { label: "Model" }, { label: "Calls", r: true }, { label: "Tokens", r: true }, { label: "Cost", r: true }, { label: "Per call", r: true }], rows, { cls: "use", rowAttr: (i) => (i === list.length ? `class="tot"` : "") })}
        ${working(mo.working.ai_total)}
        <div class="s mt">${esc(O.pricing_basis || "")} ${esc(O.usage_note || "")}</div></div>
    </div>`;
}
function detailHTML(M, ctx) {
  const tab = ctx.local.tab || "emp";
  const body = { emp: empHTML, hire: hireHTML, covers: coversHTML, usage: usageHTML }[tab](M, ctx);
  return `<section class="card det" id="costs-detail"><div class="ch">${seg(TABS(M.C.monthly_fee), tab, "tab")}</div><div class="tb">${body}</div></section>`;
}

export default {
  css: `
.pg-costs .s { font-size: 12.5px; color: var(--ink-3); }
.pg-costs .mt { margin-top: 12px; }
.pg-costs .lab { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
.pg-costs .up { color: var(--green); }
.pg-costs .working-line { overflow-wrap: anywhere; }
.pg-costs .card .ch { flex-wrap: wrap; }
.pg-costs h4 { margin: 0 0 10px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }

/* hero */
.pg-costs .hero { padding: 20px 24px; }
.pg-costs .hero > .ch .r { color: var(--holo-2); }
.pg-costs .hgrid { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); gap: 24px; margin-top: 8px; }
.pg-costs .pbh { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
.pg-costs .pbh .v { font: 300 52px/1.05 var(--mono); letter-spacing: -0.04em; color: #fff; text-shadow: none; white-space: nowrap; }
.pg-costs .pbh span { flex: 1 1 220px; font-size: 13px; color: var(--ink-2); max-width: 380px; }
.pg-costs .pay { margin: 20px 0 0 44px; }
.pg-costs .pay-c { position: relative; height: 200px; }
.pg-costs .pay-c .gl { position: absolute; top: auto; left: 0; right: 0; height: 1px; background: rgba(255, 255, 255, .06); }
.pg-costs .pay-c .gl span { position: absolute; right: 100%; transform: translateY(-50%); padding-right: 8px; font: 11px var(--mono); color: var(--ink-3); white-space: nowrap; }
.pg-costs .pay-c .thr { position: absolute; left: 0; right: 0; height: 0; border-top: 1px dashed rgba(234, 246, 255, .55); z-index: 1; }
.pg-costs .pay-c .thr span { position: absolute; left: 8px; bottom: 6px; font: 500 11px var(--mono); color: var(--ink); white-space: nowrap; background: rgba(8, 15, 24, .8); padding: 1px 6px; border-radius: 4px; }
.pg-costs .pay-s { position: absolute; inset: 0; animation: cpr 1.6s cubic-bezier(.3, .7, .2, 1) both; }
@keyframes cpr { from { clip-path: inset(-10% 100% -10% 0); } to { clip-path: inset(-10% 0 -10% 0); } }
.pg-costs .pay-s svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.pg-costs .pay-s polyline { fill: none; stroke: var(--holo); stroke-width: 2.2; stroke-linejoin: round; filter: drop-shadow(0 0 5px rgba(70, 200, 255, .9)); }
.pg-costs .pay-c .drop { position: absolute; bottom: 0; width: 0; border-left: 1px dashed rgba(63, 224, 160, .6); }
.pg-costs .pay-c .pt { position: absolute; width: 14px; height: 14px; transform: translate(-50%, -50%); display: grid; place-items: center; z-index: 2; }
.pg-costs .pay-c .pt i { width: 4px; height: 4px; border-radius: 50%; background: var(--holo-2); opacity: .7; }
.pg-costs .pay-c .pt:hover i { width: 8px; height: 8px; opacity: 1; background: #fff; }
.pg-costs .pay-c .pt.hit i { width: 12px; height: 12px; opacity: 1; background: var(--green); box-shadow: 0 0 0 3px rgba(63, 224, 160, .25), 0 0 16px var(--green); animation: pulse 1.8s ease-in-out infinite; }
.pg-costs .pay-c .pt.end i { width: 10px; height: 10px; opacity: 1; background: #fff; box-shadow: 0 0 12px var(--holo); }
.pg-costs .tag-hit { position: absolute; transform: translate(-50%, calc(-100% - 14px)); white-space: nowrap; font-size: 11.5px; font-weight: 600; color: #8ff0c6; background: rgba(8, 30, 24, .9); border: 1px solid rgba(63, 224, 160, .45); padding: 3px 9px; border-radius: 999px; pointer-events: none; z-index: 3; }
.pg-costs .tag-end { position: absolute; right: 0; transform: translate(-16px, -88%); text-align: right; font: 400 15px/1.2 var(--mono); color: #fff; pointer-events: none; z-index: 3; }
.pg-costs .tag-end small { display: block; font: 400 11px var(--sans); color: var(--ink-3); }
.pg-costs .pay-x { position: relative; height: 18px; margin-top: 8px; }
.pg-costs .pay-x span { position: absolute; transform: translateX(-50%); font: 11px var(--mono); color: var(--ink-3); white-space: nowrap; }
.pg-costs .pay-x span:first-child { transform: none; }
.pg-costs .pay-x span:last-child { transform: translateX(-100%); }
.pg-costs .pay-x span.on { color: #8ff0c6; }
.pg-costs .prices { display: grid; gap: 10px; align-content: start; }
.pg-costs .pr { display: grid; gap: 2px; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); }
.pg-costs .pr b { font: 300 32px/1.15 var(--mono); letter-spacing: -0.03em; color: #fff; text-shadow: none; margin-top: 2px; }
.pg-costs .pr.ai b { font-family: var(--sans); font-weight: 500; font-size: 26px; letter-spacing: -0.02em; color: var(--holo-2); }
.pg-costs .pr .d { font-size: 12.5px; color: var(--ink-3); }
.pg-costs .pr .d em { font-style: normal; color: var(--ink); }
.pg-costs .now { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 13px; color: var(--ink-3); }
.pg-costs .now .lab { color: var(--ink-3); margin-right: 8px; }
.pg-costs .now b { font: 400 22px var(--mono); color: #fff; margin-right: 4px; }
.pg-costs .now .up b { color: var(--green); text-shadow: none; }
.pg-costs .now .op { font: 400 18px var(--mono); color: var(--ink-3); }
.pg-costs .now .s { flex-basis: 100%; }

/* months */
.pg-costs .months { margin-top: 16px; }
.pg-costs .mh { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
.pg-costs .mh .v { font: 300 34px/1.1 var(--mono); letter-spacing: -0.03em; color: #fff; text-shadow: none; }
.pg-costs .mh span { font-size: 12.5px; color: var(--ink-3); }
.pg-costs .mrows { display: grid; gap: 2px; margin-top: 14px; }
.pg-costs .mr { display: grid; grid-template-columns: 76px minmax(0, 1.3fr) minmax(0, 1fr) 72px 96px; gap: 12px; align-items: center; padding: 8px 10px; border-radius: 10px; font-size: 12.5px; }
.pg-costs .mr:hover { background: rgba(255, 255, 255, .025); }
.pg-costs .mr.cur { background: var(--holo-tint); box-shadow: inset 0 0 0 1px rgba(70, 200, 255, .25); }
.pg-costs .ml { color: var(--ink); font-weight: 600; }
.pg-costs .ml em { font-style: normal; font-weight: 400; color: var(--holo-2); font-size: 11.5px; }
.pg-costs .mteam { color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-costs .mb { height: 6px; border-radius: 6px; background: rgba(255, 255, 255, .05); overflow: hidden; }
.pg-costs .mb b { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg, rgba(70, 200, 255, .35), var(--holo)); box-shadow: 0 0 10px rgba(70, 200, 255, .5); }
.pg-costs .mu { text-align: right; color: var(--holo-2); }
.pg-costs .mtot { text-align: right; color: var(--ink); }

/* tabs */
.pg-costs .det { margin-top: 16px; }
.pg-costs .det > .ch { margin-bottom: 16px; }
.pg-costs .tt { display: flex; justify-content: space-between; align-items: center; gap: 12px 16px; flex-wrap: wrap; margin-bottom: 4px; }
.pg-costs .tt > .s { flex: 1 1 320px; max-width: 720px; }
.pg-costs tr.tot td { background: rgba(255, 255, 255, .03); color: var(--ink); }
.pg-costs .who2 { display: inline-flex; align-items: center; white-space: nowrap; }
.pg-costs .who2 b { display: block; font-weight: 600; line-height: 1.25; color: var(--ink); }
.pg-costs .who2 .s { display: block; font-size: 11.5px; line-height: 1.25; }
.pg-costs .vpp { display: inline-flex; align-items: center; gap: 8px; }
.pg-costs .vpp i { width: 64px; height: 6px; border-radius: 6px; background: rgba(255, 255, 255, .06); overflow: hidden; display: block; }
.pg-costs .vpp i b { display: block; height: 100%; border-radius: 6px; background: rgba(166, 230, 255, .4); }
.pg-costs .vpp.pos i b { background: var(--holo); box-shadow: 0 0 8px var(--holo); }
.pg-costs .vpp em { font-style: normal; min-width: 44px; text-align: right; }
.pg-costs .emp td:last-child { max-width: 220px; }
.pg-costs .note.good { background: var(--green-tint); border-color: rgba(63, 224, 160, .3); color: #8ff0c6; }
.pg-costs .sl { display: grid; gap: 8px; margin: 12px 0 16px; padding: 14px 16px; border: 1px solid var(--line-2); border-radius: 14px; background: rgba(255, 255, 255, .02); }
.pg-costs .sl .row { justify-content: space-between; font-size: 13px; color: var(--ink-2); }
.pg-costs .sl .row b { font-size: 20px; font-weight: 400; color: #fff; }
.pg-costs .sl input[type=range] { width: 100%; accent-color: var(--holo); margin: 0; border: 0; background: none; box-shadow: none; }
.pg-costs .cmp2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 24px; align-items: start; }
.pg-costs .vsb { display: grid; gap: 12px; }
.pg-costs .vsb > div { display: grid; grid-template-columns: minmax(0, 210px) minmax(0, 1fr) 72px; gap: 12px; align-items: center; font-size: 13px; color: var(--ink-2); }
.pg-costs .vsb i { display: block; height: 12px; border-radius: 12px; background: rgba(255, 255, 255, .05); overflow: hidden; }
.pg-costs .vsb i b { display: block; height: 100%; border-radius: 12px; background: rgba(168, 191, 212, .45); transition: width .25s; }
.pg-costs .vsb .me { color: #fff; font-weight: 600; }
.pg-costs .vsb .me i b { background: linear-gradient(90deg, rgba(70, 200, 255, .45), var(--holo)); box-shadow: 0 0 12px rgba(70, 200, 255, .6); }
.pg-costs .vsb em { font-style: normal; text-align: right; font-family: var(--mono); color: var(--ink); }
.pg-costs .diff { margin-top: 12px; }
.pg-costs .rough { display: inline-flex; height: 22px; align-items: center; padding: 0 8px; margin-left: 4px; border-radius: 6px; font-size: 11.5px; font-weight: 500; background: rgba(255, 255, 255, .04); color: var(--ink-2); border: 1px solid var(--line-2); }
.pg-costs ul.cav { margin: 12px 0 0; padding-left: 20px; font-size: 12.5px; color: var(--ink-3); display: grid; gap: 4px; }
.pg-costs .cov { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.pg-costs .cov > div { border: 1px solid var(--line); border-radius: 14px; padding: 14px; display: grid; align-content: start; gap: 4px; background: rgba(255, 255, 255, .02); }
.pg-costs .cov b { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.pg-costs .cov p { margin: 0; font-size: 12.5px; color: var(--ink-2); line-height: 1.45; }
.pg-costs .cov em { font-style: normal; font-size: 11.5px; color: var(--holo-2); font-family: var(--mono); margin-top: 4px; }
.pg-costs .cv2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; margin-top: 16px; align-items: start; }
.pg-costs .mon { display: grid; gap: 8px; justify-items: start; }
.pg-costs .mc { display: grid; grid-template-columns: 96px minmax(0, 1fr) 56px; gap: 12px; align-items: center; width: 100%; font-size: 12.5px; color: var(--ink-2); }
.pg-costs .mc i { height: 6px; border-radius: 6px; background: rgba(255, 255, 255, .05); overflow: hidden; }
.pg-costs .mc i b { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg, rgba(70, 200, 255, .35), var(--holo)); }
.pg-costs .mc em { font-style: normal; text-align: right; color: var(--ink); }
.pg-costs .ac { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.7fr); gap: 32px; align-items: start; }
.pg-costs .pts { display: grid; gap: 16px; }
.pg-costs .pts b { display: block; font-weight: 600; font-size: 13.5px; color: var(--ink); }
.pg-costs .pts p { margin: 4px 0 0; font-size: 13px; color: var(--ink-2); line-height: 1.45; }
.pg-costs .pts .kv b { font-weight: 400; font-size: 20px; }

@container (max-width: 1080px) {
  .pg-costs .ac { grid-template-columns: minmax(0, 1fr); gap: 20px; }
  .pg-costs .cmp2 { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .pg-costs .emp th:nth-child(6), .pg-costs .emp td:nth-child(6) { display: none; }
}
@container (max-width: 860px) {
  .pg-costs .hgrid { grid-template-columns: minmax(0, 1fr); gap: 20px; }
  .pg-costs .prices { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pg-costs .pr { padding: 12px 14px; }
  .pg-costs .pr b { font-size: 26px; }
  .pg-costs .pr.ai b { font-size: 22px; }
  .pg-costs .pbh .v { font-size: 44px; }
  .pg-costs .pay-c { height: 170px; }
  .pg-costs .cov { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pg-costs .cv2 { grid-template-columns: minmax(0, 1fr); }
  .pg-costs .mr { grid-template-columns: 64px minmax(0, 1fr) minmax(0, 0.8fr) 64px 84px; gap: 10px; }
}
@container (max-width: 600px) {
  .pg-costs .hero { padding: 16px; }
  .pg-costs .prices { grid-template-columns: minmax(0, 1fr); }
  .pg-costs .pr { grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; }
  .pg-costs .pr .d { grid-column: 1 / -1; }
  .pg-costs .pr b { grid-row: 1 / 2; grid-column: 2; font-size: 24px; }
  .pg-costs .pbh .v { font-size: 38px; }
  .pg-costs .pay { margin-left: 36px; }
  .pg-costs .pay-c { height: 150px; }
  .pg-costs .now b { font-size: 18px; }
  .pg-costs .mr { grid-template-columns: 56px minmax(0, 1fr) 64px 80px; }
  .pg-costs .mr .mteam { display: none; }
  .pg-costs .cov { grid-template-columns: minmax(0, 1fr); }
  .pg-costs .vsb > div { grid-template-columns: minmax(0, 1fr) 72px; }
  .pg-costs .vsb i { grid-column: 1 / -1; grid-row: 2; }
  .pg-costs .emp th:nth-child(4), .pg-costs .emp td:nth-child(4) { display: none; }
  .pg-costs .emp .vpp i, .pg-costs .emp .who2 .s { display: none; }
  .pg-costs .emp td, .pg-costs .emp th { padding-left: 8px; padding-right: 8px; }
  .pg-costs .use th:nth-child(2), .pg-costs .use td:nth-child(2), .pg-costs .use th:nth-child(4), .pg-costs .use td:nth-child(4) { display: none; }
}`,

  render(host, ctx) {
    const M = build(ctx), L = ctx.local;
    host.innerHTML = `<div class="inner pg-costs">
      ${head({ title: "Costs", lede: "What the team costs, what it gives back, and when the setup paid for itself." })}
      ${heroHTML(M)}
      ${monthsHTML(M)}
      ${detailHTML(M, ctx)}
      ${foot()}</div>`;

    const redrawWith = (k, v) => { L[k] = v; ctx.redraw(); };
    $$("[data-tab]", host).forEach((b) => (b.onclick = () => redrawWith("tab", b.dataset.tab)));
    $$("[data-sort]", host).forEach((b) => (b.onclick = () => redrawWith("sort", b.dataset.sort)));
    $$("[data-mk]", host).forEach((b) => (b.onclick = () => redrawWith("mk", b.dataset.mk)));
    $$("[data-us]", host).forEach((b) => (b.onclick = () => redrawWith("us", b.dataset.us)));
    const sl = $("[data-sal]", host);
    if (sl) sl.oninput = () => {
      L.salary = Number(sl.value);
      $("#cost-sal", host).textContent = money(L.salary, 0);
      $("#cost-cmp", host).innerHTML = cmpHTML(M, M.D.people || {}, L.salary, hireMode(L));
    };
  },

  // nothing on this page changes with live events
  onEvent() { return false; },
};
