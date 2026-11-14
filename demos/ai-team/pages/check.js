// Tom's weekly check (video 12): every Monday Tom checks all ten AI employees in about half an hour.
// Hero: a radar of the ten scores (the Monday before dashed behind), the team score, the time it took, the
// corrections and rules added, and "Prepare this Monday's sheet" (live). Those figures are the table's rows added
// up, and the table shows the sums in its last row. What's still waiting for Kieran comes from ctx.model.needs.
// Under the hero, for the video's script: "What I check every week" (1 · the log, 2 · every new rule, 3 · costs
// against what they save) and "What they never get" (money, decisions, signatures: model.needs, the same list as
// Home's "Needs you"). Every figure there comes from ctx.model; this page's data only picks which lines to show.
import { esc, num, money, av, who, chip, head, note, empty, foot, lineChart, working, spark, dayDate, short, dayName, hhmm, $, $$, BY_ID, AGENTS } from "../ui.js";

const RES = { ok: ["OK", "green"], fixed: ["Corrected", "amber"], flag: ["Flagged up", "holo"] };
// the Monday just gone (or today, if it's Monday): week i back is that minus 7*i
const monday = (i) => { const m = (new Date().getDay() + 6) % 7; return dayDate(-m - 7 * i); };
const aid = (x) => { const s = String(x || "").trim(); if (BY_ID[s]) return s; const a = AGENTS.find((g) => g.name.toLowerCase() === s.toLowerCase() || s.toLowerCase().startsWith(g.id) || s.toLowerCase().startsWith(g.name.toLowerCase())); return a?.id || null; };
const whoX = (x) => { const id = aid(x); return id ? who(id) : `<b>${esc(x || "")}</b>`; };
const sum = (c, k) => c.agents.reduce((a, x) => a + x[k], 0);
const avg = (c) => sum(c, "score") / c.agents.length;
const r1 = (v) => Math.round(v * 10) / 10;
const tick = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.5 6.2 2.3 2.3 4.7-5"/></svg>`;

let drawnWeek = null; // the radar grows in when the page opens or the week changes

// figures in the check data that live in the model (or on the Ads page) are tokens, filled in for the week that check covers:
// check ci = model week (11 - ci), so the latest check is the last 7 days. {budget} weekly ad budget, {spend} that week's ad spend,
// {invoices} Ivy's invoices, {chasers} Penny's chasers, {replies} Theo's replies drafted, {cap} the boiler campaign's daily cap.
function filler(ctx, ci) {
  const M = ctx.model, E = M.employees, i = Math.max(0, M.weeks.length - 1 - ci), w = M.weeks[i];
  const cap = ctx.pages?.ads?.campaigns?.["g-boiler"]?.daily_cap_gbp;
  const T = { budget: money(M.ads.weekly_budget, 0), spend: money(w.ad_spend, 2), invoices: num(E.invoices.units[i]), chasers: num(E.money.units[i]), replies: num(E.inbox.replies_drafted), cap: cap != null ? money(cap, 0) : "the new cap" };
  return (x) => String(x ?? "").replace(/\{(\w+)\}/g, (m, k) => (k in T ? T[k] : m));
}

// the radar: ten spokes, score 65 at the centre and 100 on the rim (the rings are labelled)
function radar(c, prev, sel, team, anim) {
  const S = 400, C = 200, R = 136, LO = 65;
  const ids = AGENTS.map((a) => a.id).filter((id) => c.agents.some((x) => x.agent === id)), n = ids.length;
  const ang = (i) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const rad = (s) => R * Math.max(0, Math.min(1, (s - LO) / (100 - LO)));
  const pt = (i, s) => [C + rad(s) * Math.cos(ang(i)), C + rad(s) * Math.sin(ang(i))];
  const sc = (cc, id) => cc?.agents.find((x) => x.agent === id)?.score;
  const poly = (cc) => ids.map((id, i) => pt(i, sc(cc, id) ?? LO).map((v) => v.toFixed(1)).join(",")).join(" ");
  const rings = [75, 80, 85, 90, 95, 100].map((v) => `<circle cx="${C}" cy="${C}" r="${rad(v)}" class="${v === 100 ? "rim" : v % 10 ? "half" : ""}"/>`).join("");
  const la = -Math.PI / 2 + Math.PI / n, ringLab = [80, 90, 100].map((v) => `<text x="${C + (rad(v) + 2) * Math.cos(la)}" y="${C + (rad(v) + 2) * Math.sin(la)}">${v}</text>`).join("");
  const spokes = ids.map((id, i) => { const [x, y] = pt(i, 100); return `<line x1="${C}" y1="${C}" x2="${x}" y2="${y}" class="${id === sel ? "sel" : ""}"/>`; }).join("");
  const ticks = Array.from({ length: 120 }, (_, i) => { const a = (i / 120) * Math.PI * 2, r1_ = R + 12, r2 = R + (i % 12 === 0 ? 20 : 15); return `<line x1="${C + r1_ * Math.cos(a)}" y1="${C + r1_ * Math.sin(a)}" x2="${C + r2 * Math.cos(a)}" y2="${C + r2 * Math.sin(a)}"/>`; }).join("");
  const dots = ids.map((id, i) => { const [x, y] = pt(i, sc(c, id)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${id === sel ? 6 : 3.6}" class="v ${id === sel ? "sel" : ""}"/>`; }).join("");
  const labs = ids.map((id, i) => {
    const s = sc(c, id), p = sc(prev, id), d = p == null ? null : s - p, lr = R + 44;
    const x = ((C + lr * Math.cos(ang(i))) / S) * 100, y = ((C + lr * Math.sin(ang(i))) / S) * 100;
    return `<button class="ck-lab ${id === sel ? "sel" : ""}" data-ag="${id}" style="left:${x}%;top:${y}%" data-tip="${esc(`${BY_ID[id].name}: ${s}${d == null ? "" : `, ${d >= 0 ? "+" : ""}${d} on the Monday before`}`)}"><span>${esc(BY_ID[id].name)}</span><em>${s}</em></button>`;
  }).join("");
  return `<div class="ck-radar ${anim ? "anim" : ""}">
    <div class="ck-sweep" style="left:${((C - R) / S) * 100}%;top:${((C - R) / S) * 100}%;width:${((2 * R) / S) * 100}%"></div>
    <svg viewBox="0 0 ${S} ${S}" aria-hidden="true">
      <defs><radialGradient id="ckFill" cx="50%" cy="50%" r="50%"><stop offset="0" style="stop-color:var(--holo)" stop-opacity=".04"/><stop offset="1" style="stop-color:var(--holo)" stop-opacity=".34"/></radialGradient></defs>
      <g class="ring-ticks">${ticks}</g>
      <g class="ck-grid">${rings}${spokes}</g>
      <g class="ck-rl">${ringLab}</g>
      ${prev ? `<polygon points="${poly(prev)}" class="ck-prev"/>` : ""}
      <g class="ck-poly"><polygon points="${poly(c)}" class="ck-cur"/>${dots}</g>
      <circle cx="${C}" cy="${C}" r="${R * 0.24}" class="ck-core"/>
    </svg>
    <div class="ck-mid"><b class="num" data-count="${Math.round(team)}">${Math.round(team)}</b><span>team</span></div>
    ${labs}
  </div>`;
}

function sheetView(run) {
  const s = run.result || run.partial || {}, live = run.running;
  if (run.error && !run.result) return note(esc(run.error), "red");
  if (!s.headline && live) return `<p class="shimmer ck-wait">Kit's reading the week: invoices, the inbox, the vans, money owed, the marketing, the task board…</p>`;
  const rows = (arr, cls = "") => (arr || []).filter((x) => x && (x.what || x.rule)).map((x, i) => `<div class="ck-sr ${cls}"><em class="num">${String(i + 1).padStart(2, "0")}</em><div><div class="ck-sw">${whoX(x.agent)}</div><div class="ck-st">${esc(x.what || x.rule || "")}</div>${x.why || x.because ? `<div class="s">${esc(x.why || x.because)}</div>` : ""}</div></div>`).join("");
  return `<div class="ck-sheet ${live ? "typing" : ""}">
    <h2>${esc(s.headline || "")}</h2>${s.minutes ? `<div class="row">${chip(s.minutes, "holo")}</div>` : ""}
    <div class="ck-sgrid">
      ${(s.look_first || []).length ? `<div><h4>Look at these first</h4><div class="ck-sl">${rows(s.look_first)}</div></div>` : ""}
      <div>
        ${(s.risky || []).length ? `<h4>Anything risky</h4><div class="ck-sl">${rows(s.risky, "risk")}</div>` : ""}
        ${(s.suggested_rules || []).length ? `<h4>Suggested new rules</h4><div class="ck-sl">${rows(s.suggested_rules, "rule")}</div>` : ""}
        ${(s.for_kieran || []).filter(Boolean).length ? `<h4>For Kieran</h4><div class="ck-sl">${s.for_kieran.filter(Boolean).map((x, i) => `<div class="ck-sr kier"><em class="num">${String(i + 1).padStart(2, "0")}</em><div class="ck-st">${esc(x)}</div></div>`).join("")}</div>` : ""}
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- what Tom checks every week, and what they never get
const PAGE_OF = { seo: "search", ads: "ads", content: "content", paperwork: "paperwork", manager: "tasks", coach: "training" };
const lessonFrom = (l) => l.source === "edit" ? "Priya changed a draft" : l.source === "taught" ? `${BY_ID[l.from]?.name || l.from || "A colleague"} passed it on` : l.source === "correction" ? "Priya answered a question" : "Priya told them";
const waited = (m) => (m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`);
let drawnWk = false; // the cost bars grow in once, when the page opens

// exactly the list Home shows under "Needs you" (model.needs, plus live drafts waiting for a yes), so the counts match
function needsList(ctx) {
  const live = [];
  for (const r of ctx.F.acts?.ads?.runs || []) if (!r.running && r.result) live.push({ who: "Kieran", agent: "ads", what: "Say yes to Archie's new test ads", detail: r.service || r.input || "Three ads and a test plan", mins: Math.max(1, Math.round((Date.now() - r.at) / 60000)), page: "ads", fresh: true });
  for (const w of ctx.F.acts?.content?.writes || []) if (!w.running && w.result) live.push({ who: "Priya", agent: "content", what: "Approve Clara's new draft", detail: w.result.title || w.topic || "", mins: Math.max(1, Math.round((Date.now() - w.at) / 60000)), page: "content", fresh: true });
  return [...live, ...ctx.model.needs];
}

// every new rule in the last 7 days: the same list as Kit's desk (rules added live first, then coach.json's week)
function newRules(ctx) {
  const live = (ctx.lessons || []).slice().reverse().map((l) => ({ agent: l.agent, text: l.text, from: lessonFrom(l), live: true }));
  const week = (ctx.F.coach?.rules_this_week || []).slice().sort((a, b) => b.day_offset - a.day_offset).map((r) => ({ agent: r.agent, text: r.rule, from: r.came_from }));
  return { all: [...live, ...week], live: live.length, week: week.length };
}

// site demo: without prices, the same 12 weeks of office time saved, with no running-cost line
function savedWeeks(M, anim) {
  const W = M.weeks, hi = Math.max(...W.map((w) => w.money_saved)) * 1.12, bw = 100 / W.length, y = (v) => 100 - (v / hi) * 100;
  const bars = W.map((w, i) => `<rect x="${(i * bw + bw * 0.2).toFixed(2)}" y="${y(w.money_saved).toFixed(2)}" width="${(bw * 0.6).toFixed(2)}" height="${(100 - y(w.money_saved)).toFixed(2)}" class="up" style="animation-delay:${(i * 0.04).toFixed(2)}s"><title>${esc(`7 days from ${short(dayDate(w.day_offset))}: ${money(w.money_saved, 0)} of office time saved`)}</title></rect>`).join("");
  return `<div class="ck-cw">
    <div class="ck-cl"><span>Each of the last ${W.length} weeks</span><span>office time saved</span></div>
    <div class="ck-cc ${anim ? "anim" : ""}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${bars}</svg></div>
    <div class="ck-cx"><span>${esc(short(dayDate(W[0].day_offset)))}</span><span>last 7 days</span></div>
  </div>`;
}
function savedPart(M, anim) {
  const W = M.weeks, saved = M.last7.money_saved, hours = M.last7.hours;
  const topS = Math.max(...W.map((w) => w.money_saved), saved, 1), topH = Math.max(...W.map((w) => w.hours), hours, 1);
  return `<div class="ck-pt ck-p3">
        <div class="ck-pa"><div class="ck-ph"><em>3</em><i>·</i><b>What they save</b></div><p>The office time the team gives back, against its best week so far.</p></div>
        <div class="ck-pb">
          <div class="ck-cb ${anim ? "anim" : ""}">
            <div><span>Office time saved</span><em class="num" data-count="${saved}">${money(saved, 0)}</em><i><b style="width:${((saved / topS) * 100).toFixed(1)}%"></b></i></div>
            <div><span>Hours given back</span><em class="num" data-count="${hours}">${hours} h</em><i><b style="width:${((hours / topH) * 100).toFixed(1)}%"></b></i></div>
          </div>
          ${savedWeeks(M, anim)}
          ${working(`${M.last7.working.money_saved}. ${M.last7.working.hours}.`)}
        </div>
      </div>`;
}

// office time saved in each of the model's 12 weeks, against what the team costs to run now (a dashed line)
function costWeeks(M, anim) {
  const W = M.weeks, run = M.costs.weekly_running, hi = Math.max(run, ...W.map((w) => w.money_saved)) * 1.12, bw = 100 / W.length;
  const y = (v) => 100 - (v / hi) * 100, above = W.filter((w) => w.money_saved >= run).length;
  const bars = W.map((w, i) => `<rect x="${(i * bw + bw * 0.2).toFixed(2)}" y="${y(w.money_saved).toFixed(2)}" width="${(bw * 0.6).toFixed(2)}" height="${(100 - y(w.money_saved)).toFixed(2)}" class="${w.money_saved >= run ? "up" : ""}" style="animation-delay:${(i * 0.04).toFixed(2)}s"><title>${esc(`7 days from ${short(dayDate(w.day_offset))}: ${money(w.money_saved, 0)} of office time saved`)}</title></rect>`).join("");
  return `<div class="ck-cw">
    <div class="ck-cl"><span>Each of the last ${W.length} weeks</span><span>${above} of ${W.length} above the line</span></div>
    <div class="ck-cc ${anim ? "anim" : ""}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${bars}<line x1="0" x2="100" y1="${y(run).toFixed(2)}" y2="${y(run).toFixed(2)}" class="run"/></svg></div>
    <div class="ck-cx"><span>${esc(short(dayDate(W[0].day_offset)))}</span><span class="rl"><i></i>${money(run, 0)} to run, now</span><span>last 7 days</span></div>
  </div>`;
}

function weekCard(ctx, c0, anim) {
  const M = ctx.model, E = M.employees, K = E.coach, D = ctx.data, L = ctx.local, n = M.weeks.length - 1;
  // 1 · the log: everything they did (each employee's last 7 days) and everything a person changed (Kit's corrections)
  const done = AGENTS.reduce((a, g) => a + E[g.id].units[n], 0);
  const doneW = `${AGENTS.map((g) => `${g.name} ${num(E[g.id].units[n])}`).join(" + ")} = ${num(done)} things done`;
  const atCheck = sum(c0, "corrections"), office = K.corrections - atCheck;
  const changedW = office >= 0 ? `${atCheck} corrected at Tom's Monday check + ${office} in the office during the week = ${K.corrections} changed` : `${K.corrections} corrections, last 7 days`;
  const det = D.detail?.[String(c0.day_offset)] || {};
  const lines = (D.week?.log_lines || []).map(([ag, i]) => ({ ag, it: det[ag]?.items?.[i] })).filter((x) => x.it);
  const f0 = filler(ctx, 0);
  const logLine = ({ ag, it }) => { const chg = it.result === "fixed"; return `<div class="ck-l ${chg ? "chg" : ""}">${av(ag)}<p><em>${chg ? "Tom changed" : "Done"}</em><b>${esc(f0(it.what))}</b> ${esc(f0(it.note))}</p></div>`; };
  // 2 · every new rule, each one checked; anything still waiting for Tom is the model's one list
  // (all of them are drawn; CSS shows 6, or 2 at laptop width so all three parts fit one screen, until "Show all")
  const R = newRules(ctx);
  const tomNeed = M.needs.find((x) => x.who === "Tom" && x.agent === "coach");
  const pend = tomNeed ? Number(tomNeed.what.match(/\d+/)?.[0] || 0) : 0;
  const ruleRow = (r) => `<div class="ck-nr ${r.live ? "live" : ""}" data-tip="${esc(`Came from: ${r.from}. Checked by Tom.`)}">${av(r.agent)}<p><b>${esc(BY_ID[r.agent]?.name || r.agent)}</b>${esc(r.text)}</p><span class="ok" aria-label="Checked by Tom">${tick}<i>Tom</i></span></div>`;
  const rulesW = R.live ? `${R.week} from ${K.corrections} corrections, last 7 days + ${R.live} added live = ${R.all.length}` : `${R.week} rules from ${K.corrections} corrections, last 7 days`;
  // 3 · costs against what they save, last 7 days
  const P = !!window.AI_TEAM_SHOW_PRICES; // site demo: no prices until Tom approves them (config.js)
  const saved = M.last7.money_saved, run = P ? M.costs.weekly_running : 0, ahead = saved - run, hi = Math.max(saved, run, 1);
  return `<section class="card ck-wk" id="ck-wk">
    <div class="ck-bh"><div><span class="lab">Tom's Monday check</span><h2>What I check every week</h2></div><span class="r">last 7 days · checked ${esc(dayName(monday(0)))}</span></div>
    <div class="ck-w3">
      <div class="ck-pt">
        <div class="ck-pa"><div class="ck-ph"><em>1</em><i>·</i><b>The log</b></div><p>Everything they did, and everything a person changed.</p></div>
        <div class="ck-pb">
          <div class="ck-fg"><div data-tip="${esc(doneW)}"><b class="num" data-count="${done}">${num(done)}</b><span>things they did</span></div><div data-tip="${esc(changedW)}"><b class="num" data-count="${K.corrections}">${num(K.corrections)}</b><span>changed by a person</span></div></div>
          <div class="ck-lg">${lines.map(logLine).join("")}</div>
          <div class="working-line ck-wide">${esc(doneW)}</div>${working(changedW)}
        </div>
      </div>
      <div class="ck-pt">
        <div class="ck-pa"><div class="ck-ph"><em>2</em><i>·</i><b>Every new rule</b></div><p>A bad rule spreads to everyone.</p></div>
        <div class="ck-pb">
          <div class="ck-fg"><div data-tip="${esc(rulesW)}"><b class="num" data-count="${R.all.length}">${R.all.length}</b><span>new rules, each checked by Tom</span></div>${pend ? `<div class="am click" data-go="${esc(tomNeed.page || "training")}" data-tip="${esc(`${tomNeed.detail}. ${tomNeed.why}.`)}"><b class="num">${pend}</b><span>waiting for his sign-off</span></div>` : ""}</div>
          <div class="ck-nrs ${L.allRules ? "all" : ""}">${R.all.map(ruleRow).join("")}</div>
          ${R.all.length > 2 ? `<button class="ck-more ${R.all.length <= 6 ? "few" : ""}" data-allrules>${L.allRules ? "Show fewer" : `Show all ${R.all.length}`}</button>` : ""}
          ${working(rulesW)}
        </div>
      </div>
      ${!P ? savedPart(M, anim) : `<div class="ck-pt ck-p3">
        <div class="ck-pa"><div class="ck-ph"><em>3</em><i>·</i><b>Costs against what they save</b></div><p>What the team costs to run, against the office time it gives back.</p></div>
        <div class="ck-pb">
          <div class="ck-cb ${anim ? "anim" : ""}">
            <div><span>Office time saved</span><em class="num" data-count="${saved}">${money(saved, 0)}</em><i><b style="width:${((saved / hi) * 100).toFixed(1)}%"></b></i></div>
            <div class="cost"><span>To run the team</span><em class="num" data-count="${Math.round(run)}">${money(run, 0)}</em><i><b style="width:${((run / hi) * 100).toFixed(1)}%"></b></i></div>
          </div>
          <div class="ck-ah click ${ahead < 0 ? "neg" : ""}" data-go="costs" data-tip="${esc(M.costs.working.net_per_week)}"><b class="num" data-count="${Math.abs(Math.round(ahead))}">${money(Math.abs(ahead), 0)}</b><span>a week ${ahead < 0 ? "behind" : "ahead"}, before any work from the ${M.last7.leads_marketing} leads</span></div>
          ${costWeeks(M, anim)}
          ${working(`${M.last7.working.money_saved}. ${M.costs.working.weekly_running}.`)}
        </div>
      </div>`}
    </div>
  </section>`;
}

function neverCard(ctx, needs) {
  const B = ctx.data.week?.never || [], groups = B.map((b) => ({ ...b, items: [] }));
  needs.forEach((n, i) => {
    const g = groups.find((b) => (n.id ? (b.needs || []).includes(n.id) : (b.live || []).includes(n.agent))) || groups.find((b) => b.id === "decide") || groups[0];
    g?.items.push({ n, i });
  });
  const item = ({ n, i }) => `<div class="ck-ni" data-need="${i}" tabindex="0"><span class="ldot need"></span><div><b>${esc(n.what)}</b><span class="d">${esc(n.detail)}</span><span class="t">${esc(n.who)} · ${waited(n.mins)}</span></div></div>`;
  return `<section class="card ck-nv">
    <div class="ck-bh"><div><span class="lab">Never theirs</span><h2>What they never get</h2></div><span class="r">${chip(`${needs.length} waiting on a person`, "amber")}</span></div>
    <div class="ck-n3">${groups.map((g) => `<div class="ck-nb">
      <div class="ck-nh"><h4>${esc(g.title)}</h4>${g.items.length ? chip(`${g.items.length} waiting`, "amber") : chip("nothing waiting")}</div>
      <p class="sub">${esc(g.sub)}</p>
      <div class="ck-nl">${g.items.map(item).join("")}</div></div>`).join("")}</div>
    <div class="ck-yes"><span class="ldot need"></span><span>A person says <b>yes</b>, every time.</span></div>
    ${working(`The same ${needs.length} as "Needs you" on Home: ${groups.map((g) => `${g.items.length} ${g.title.toLowerCase()}`).join(" + ")} = ${needs.length}`)}
  </section>`;
}

export default {
  css: `
  .pg-check .ck-hero { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr); gap: 16px; align-items: stretch; }
  .pg-check .ck-side { display: grid; gap: 16px; grid-template-rows: auto 1fr; min-width: 0; }
  @container (max-width: 900px) { .pg-check .ck-hero { grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); } }
  @container (max-width: 600px) { .pg-check .ck-hero { grid-template-columns: minmax(0, 1fr); } }
  .pg-check .ck-rc { display: flex; flex-direction: column; }
  .pg-check .ck-rc .ch { flex-wrap: wrap; }
  .pg-check .ck-rc .seg button { padding: 0 10px; }

  .pg-check .ck-radar { position: relative; width: min(100%, 430px); aspect-ratio: 1; margin: 4px auto 0; }
  .pg-check .ck-radar svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .pg-check .ck-grid circle { fill: none; stroke: rgba(120, 200, 255, .11); }
  .pg-check .ck-grid circle.rim { stroke: rgba(120, 200, 255, .32); }
  .pg-check .ck-grid circle.half { stroke: rgba(120, 200, 255, .05); stroke-dasharray: 2 4; }
  .pg-check .ck-grid line { stroke: rgba(120, 200, 255, .12); }
  .pg-check .ck-grid line.sel { stroke: rgba(166, 230, 255, .55); stroke-dasharray: 3 4; }
  .pg-check .ck-rl text { font: 9px var(--mono); fill: var(--ink-3); dominant-baseline: middle; }
  .pg-check .ck-prev { fill: none; stroke: rgba(168, 191, 212, .5); stroke-width: 1.2; stroke-dasharray: 4 4; }
  .pg-check .ck-cur { fill: url(#ckFill); stroke: var(--holo); stroke-width: 2; stroke-linejoin: round; filter: drop-shadow(0 0 8px rgba(70, 200, 255, .7)); }
  .pg-check .ck-poly circle.v { fill: var(--holo-2); filter: drop-shadow(0 0 5px var(--holo)); }
  .pg-check .ck-poly circle.v.sel { fill: var(--ink); stroke: var(--holo); stroke-width: 3; }
  .pg-check .ck-core { fill: var(--bg); stroke: rgba(70, 200, 255, .35); stroke-width: 1; }
  .pg-check .ck-radar.anim .ck-poly { transform-box: view-box; transform-origin: 200px 200px; animation: ckGrow 1.2s cubic-bezier(.2, .8, .2, 1) both; }
  .pg-check .ck-radar.anim .ck-prev { animation: ckFade 1s ease .5s both; }
  @keyframes ckGrow { from { transform: scale(.15) rotate(-30deg); opacity: 0; } }
  @keyframes ckFade { from { opacity: 0; } }
  .pg-check .ck-sweep { position: absolute; aspect-ratio: 1; border-radius: 50%; pointer-events: none; background: conic-gradient(from 0deg, transparent 0deg 290deg, rgba(70, 200, 255, .16) 352deg, rgba(166, 230, 255, .42) 360deg); animation: spin 6s linear infinite; }
  .pg-check .ck-mid { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: grid; justify-items: center; pointer-events: none; }
  .pg-check .ck-mid b { font: 300 26px/1 var(--mono); letter-spacing: -0.04em; color: var(--ink); text-shadow: none; }
  .pg-check .ck-mid span { margin-top: 4px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-check .ck-lab { position: absolute; transform: translate(-50%, -50%); display: grid; justify-items: center; gap: 1px; padding: 4px 6px; border: 1px solid transparent; border-radius: 10px; background: none; cursor: pointer; color: var(--ink-3); line-height: 1.1; }
  .pg-check .ck-lab span { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; white-space: nowrap; }
  .pg-check .ck-lab em { font: 400 16px var(--mono); font-style: normal; color: var(--ink); }
  .pg-check .ck-lab:hover { border-color: var(--line-2); }
  .pg-check .ck-lab.sel { border-color: rgba(70, 200, 255, .5); background: var(--holo-tint); color: var(--holo-2); }
  .pg-check .ck-lab.sel em { color: var(--ink); text-shadow: none; }
  .pg-check .ck-leg { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 20px; margin-top: 12px; font-size: 12px; color: var(--ink-3); }
  .pg-check .ck-leg span { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
  .pg-check .ck-leg i { width: 18px; height: 0; border-top: 2px solid var(--holo); box-shadow: 0 0 6px var(--holo); }
  .pg-check .ck-leg i.p { border-top: 1.5px dashed rgba(168, 191, 212, .6); box-shadow: none; }

  .pg-check .ck-score { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
  .pg-check .ck-score b { font: 300 64px/1 var(--mono); letter-spacing: -0.05em; color: var(--ink); text-shadow: none; }
  .pg-check .ck-score b small { font-size: 22px; color: var(--holo-2); letter-spacing: 0; margin-left: 4px; }
  .pg-check .ck-score .spark { width: 120px; height: 40px; margin-bottom: 6px; }
  .pg-check .ck-up { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 999px; font: 500 12px var(--mono); white-space: nowrap; }
  .pg-check .ck-up.g { background: var(--green-tint); border: 1px solid rgba(63, 224, 160, .35); color: var(--green); }
  .pg-check .ck-up.b { background: var(--red-tint); border: 1px solid rgba(255, 97, 104, .35); color: var(--red); }
  .pg-check .ck-mini { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 16px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .015); }
  .pg-check .ck-mini > div { padding: 12px 14px; border-left: 1px solid var(--line); min-width: 0; }
  .pg-check .ck-mini > div:first-child { border-left: 0; }
  .pg-check .ck-mini > div.click { cursor: pointer; border-radius: 0 12px 12px 0; transition: background .15s; }
  .pg-check .ck-mini > div.click:hover { background: var(--holo-tint); }
  .pg-check .ck-mini span { display: block; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); white-space: nowrap; }
  .pg-check .ck-mini b { display: block; margin-top: 6px; font: 300 30px/1.05 var(--mono); letter-spacing: -0.03em; color: var(--ink); text-shadow: none; }
  .pg-check .ck-mini b small { font-size: 14px; color: var(--ink-3); margin-left: 3px; letter-spacing: 0; }
  .pg-check .ck-mini em { display: block; margin-top: 4px; font-style: normal; font-size: 12px; line-height: 1.35; color: var(--ink-3); }
  .pg-check .ck-mini em.g { color: var(--green); }
  @container (max-width: 900px) { .pg-check .ck-mini { grid-template-columns: minmax(0, 1fr); } .pg-check .ck-mini > div { border-left: 0; border-top: 1px solid var(--line); display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 0 12px; padding: 10px 14px; } .pg-check .ck-mini > div:first-child { border-top: 0; } .pg-check .ck-mini b { grid-row: span 2; font-size: 26px; margin: 0; } .pg-check .ck-mini em { margin: 2px 0 0; } .pg-check .ck-score b { font-size: 52px; } .pg-check .ck-score .spark { width: 84px; } }
  @container (max-width: 600px) { .pg-check .ck-mini { grid-template-columns: repeat(3, minmax(0, 1fr)); } .pg-check .ck-mini > div { display: block; border-top: 0; border-left: 1px solid var(--line); padding: 10px 12px; } .pg-check .ck-mini > div:first-child { border-left: 0; } .pg-check .ck-mini span { font-size: 9.5px; letter-spacing: .08em; } .pg-check .ck-mini b { font-size: 24px; margin-top: 4px; } .pg-check .ck-mini em { font-size: 11px; } }

  .pg-check .ck-cta { display: flex; flex-direction: column; gap: 12px; }
  .pg-check .ck-cta p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--ink-2); }
  .pg-check .ck-cta .btn.primary { height: 48px; font-size: 15px; border-radius: 12px; width: 100%; }
  .pg-check .ck-cta .meta { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--ink-3); flex-wrap: wrap; }
  .pg-check .ck-cta .meta b { color: var(--ink); font-weight: 500; }
  .pg-check .ck-cta .meta .btn { margin-left: auto; }
  .pg-check .ck-cta .scan { border-radius: 10px; padding: 10px 12px; border: 1px solid rgba(70, 200, 255, .35); background: var(--holo-tint); font-size: 13px; }

  .pg-check .ck-tabs { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 32px 0 16px; scroll-margin-top: 16px; }
  .pg-check .ck-tabs h2 { margin: 0; font-size: 18px; font-weight: 500; letter-spacing: -0.01em; color: var(--ink); }
  .pg-check .ck-tabs .seg em { font-style: normal; font-family: var(--mono); margin-left: 6px; color: var(--amber-ink); }
  .pg-check .ck-tabs .seg i.ldot { margin-left: 6px; width: 6px; height: 6px; vertical-align: 1px; }

  .pg-check .ck-people { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  @container (max-width: 980px) { .pg-check .ck-people { grid-template-columns: minmax(0, 1fr); } }
  .pg-check .ck-t td, .pg-check .ck-t th { padding: 10px 12px; white-space: nowrap; }
  .pg-check .ck-t tbody tr { cursor: pointer; }
  .pg-check .ck-t tbody tr.sel td { background: var(--holo-tint); }
  .pg-check .ck-t tbody tr.sel td:first-child { box-shadow: inset 2px 0 0 var(--holo); }
  .pg-check .ck-t td .who b { color: var(--ink); font-weight: 600; }
  .pg-check .ck-t tfoot td { border-top: 1px solid var(--line-2); background: rgba(70, 200, 255, .05); color: var(--ink); font-weight: 600; }
  .pg-check .ck-t tfoot td.r { font-family: var(--mono); font-weight: 400; color: var(--holo-2); }
  .pg-check .ck-bar { display: inline-flex; align-items: center; gap: 8px; }
  .pg-check .ck-bar i { width: 72px; height: 6px; border-radius: 6px; background: rgba(255, 255, 255, .07); overflow: hidden; }
  .pg-check .ck-bar i b { display: block; height: 100%; background: linear-gradient(90deg, rgba(70, 200, 255, .45), var(--holo)); box-shadow: 0 0 8px var(--holo); }
  .pg-check .ck-bar em { font: 400 13px var(--mono); font-style: normal; color: var(--ink); min-width: 32px; }
  .pg-check .ck-d { font: 400 12.5px var(--mono); }
  .pg-check .ck-d.g { color: var(--green); }
  .pg-check .ck-d.b { color: var(--red); }
  .pg-check .ck-sums { margin-top: 10px; }
  @container (max-width: 560px) { .pg-check .ck-t .hide-s { display: none; } }

  .pg-check .ck-dh { display: flex; align-items: center; gap: 12px; }
  .pg-check .ck-dh .av-s { width: 44px; height: 44px; font-size: 17px; margin: 0; box-shadow: 0 0 0 2px rgba(70, 200, 255, .35), 0 0 18px -4px var(--holo-glow); }
  .pg-check .ck-dh h2 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); }
  .pg-check .ck-dh p { margin: 0; font-size: 12.5px; color: var(--ink-3); }
  .pg-check .ck-dh .ck-sc { margin-left: auto; text-align: right; }
  .pg-check .ck-dh .ck-sc b { display: block; font: 300 36px/1 var(--mono); letter-spacing: -0.03em; color: var(--ink); text-shadow: none; }
  .pg-check .ck-dh .ck-sc span { font-size: 11.5px; color: var(--ink-3); }
  .pg-check .ck-h4 { margin: 20px 0 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-check .ck-looked { font-size: 12.5px; color: var(--ink-3); margin: 4px 0 0; }
  .pg-check .ck-items .li { grid-template-columns: minmax(0, 1fr) auto; padding: 10px 14px; }
  .pg-check .ck-items .li b { color: var(--ink); font-weight: 500; font-size: 13px; }
  .pg-check .ck-verdict { margin-top: 16px; padding: 12px 16px; border-left: 2px solid var(--holo); background: rgba(70, 200, 255, .05); border-radius: 0 12px 12px 0; font-size: 15px; line-height: 1.5; color: var(--ink); }
  .pg-check .ck-verdict span { display: block; margin-top: 4px; font-size: 12px; color: var(--ink-3); }
  .pg-check .ck-drill .chart { margin-top: 8px; }

  .pg-check .ck-rtw { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; align-items: start; }
  @container (max-width: 900px) { .pg-check .ck-rtw { grid-template-columns: minmax(0, 1fr); } }
  .pg-check .ck-prog { display: flex; gap: 12px; align-items: center; margin: 4px 0 12px; font-size: 12.5px; color: var(--ink-2); }
  .pg-check .ck-prog .ck-pbar { flex: 1; height: 6px; border-radius: 6px; background: rgba(255, 255, 255, .07); overflow: hidden; }
  .pg-check .ck-prog .ck-pbar b { display: block; height: 100%; background: linear-gradient(90deg, rgba(70, 200, 255, .45), var(--holo)); box-shadow: 0 0 10px var(--holo); transition: width .4s; }
  .pg-check .ck-rt { display: grid; }
  .pg-check .ck-rt > button { display: grid; grid-template-columns: 22px 44px minmax(0, 1fr) auto; gap: 10px; align-items: start; text-align: left; padding: 10px 8px; border: 0; border-top: 1px solid rgba(120, 200, 255, .07); background: none; cursor: pointer; color: var(--ink); border-radius: 8px; }
  .pg-check .ck-rt > button:first-child { border-top: 0; }
  .pg-check .ck-rt > button:hover { background: var(--holo-tint); }
  .pg-check .ck-box { width: 20px; height: 20px; border: 1.5px solid var(--line-2); border-radius: 6px; display: grid; place-items: center; color: var(--bg); }
  .pg-check .ck-box svg { width: 12px; height: 12px; opacity: 0; }
  .pg-check .ck-rt > button.done .ck-box { background: var(--holo); border-color: var(--holo); box-shadow: 0 0 12px -2px var(--holo); }
  .pg-check .ck-rt > button.done .ck-box svg { opacity: 1; }
  .pg-check .ck-rt > button.done b { color: var(--ink-3); text-decoration: line-through; text-decoration-color: rgba(120, 200, 255, .35); }
  .pg-check .ck-rt time { font-size: 12px; color: var(--holo-2); padding-top: 2px; }
  .pg-check .ck-rt b { font-weight: 600; font-size: 13.5px; display: block; }
  .pg-check .ck-rt span { font-size: 12.5px; color: var(--ink-3); }
  .pg-check .ck-rt .chip { margin-top: 6px; height: 22px; font-size: 11.5px; }
  .pg-check .ck-rt em { font: normal 12px var(--mono); color: var(--ink-3); padding-top: 2px; }
  .pg-check .ck-sum { margin: 4px 0 0; font-size: 17px; line-height: 1.5; color: var(--ink); letter-spacing: -0.005em; }
  .pg-check .ck-chg { display: grid; gap: 6px; margin-top: 8px; }
  .pg-check .ck-chg div { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 8px; font-size: 13.5px; color: var(--ink-2); padding: 8px 10px; border-radius: 10px; background: rgba(255, 255, 255, .02); border: 1px solid rgba(120, 200, 255, .07); }
  .pg-check .ck-chg div i { font: normal 11px var(--mono); color: var(--holo); padding-top: 2px; }

  .pg-check .ck-fl { display: grid; gap: 8px; }
  .pg-check .ck-f { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 16px; align-items: start; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); }
  .pg-check .ck-f.open { border-color: rgba(255, 181, 71, .4); background: var(--amber-tint); box-shadow: 0 0 30px -16px var(--amber-glow); cursor: pointer; }
  .pg-check .ck-f b { display: block; margin-top: 6px; color: var(--ink); font-weight: 600; font-size: 14px; }
  .pg-check .ck-f .s { font-size: 12.5px; color: var(--ink-3); margin-top: 2px; }
  .pg-check .ck-f.open .s { color: var(--amber-ink); opacity: .85; }
  .pg-check .ck-f .dec { margin-top: 8px; font-size: 13px; color: var(--green); }

  .pg-check .ck-wait { font-size: 16px; margin: 8px 0 0; }
  .pg-check .ck-sheet h2 { margin: 4px 0 10px; font-size: 22px; line-height: 1.3; font-weight: 500; letter-spacing: -0.015em; color: var(--ink); }
  .pg-check .ck-sheet h4 { margin: 20px 0 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-check .ck-sgrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 20px; align-items: start; }
  @container (max-width: 820px) { .pg-check .ck-sgrid { grid-template-columns: minmax(0, 1fr); } }
  .pg-check .ck-sl { display: grid; gap: 6px; }
  .pg-check .ck-sr { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(120, 200, 255, .08); background: rgba(255, 255, 255, .02); font-size: 13.5px; color: var(--ink-2); }
  .pg-check .ck-sr > em { font-style: normal; font-size: 11px; color: var(--holo); padding-top: 2px; }
  .pg-check .ck-sr.risk { border-color: rgba(255, 97, 104, .35); background: var(--red-tint); }
  .pg-check .ck-sr.risk > em { color: var(--red); }
  .pg-check .ck-sr.rule, .pg-check .ck-sr.kier { border-color: rgba(255, 181, 71, .3); background: var(--amber-tint); }
  .pg-check .ck-sr.rule > em, .pg-check .ck-sr.kier > em { color: var(--amber); }
  .pg-check .ck-st { color: var(--ink); }
  .pg-check .ck-sr .s { font-size: 12.5px; color: var(--ink-3); margin-top: 2px; }
  .pg-check .ck-sw { margin-bottom: 4px; font-size: 12px; font-weight: 600; color: var(--ink-2); }
  .pg-check .ck-sw .av-s { width: 18px; height: 18px; font-size: 9px; margin-right: 6px; }
  .pg-check .ck-sheet.typing .ck-sgrid > div:last-child > :last-child::after, .pg-check .ck-sheet.typing > h2:last-child::after { content: ""; display: inline-block; width: 2px; height: 1em; background: var(--holo); box-shadow: 0 0 8px var(--holo); vertical-align: -2px; margin-left: 4px; animation: blink 1s steps(2) infinite; }
  .pg-check .ck-runs { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--line); font-size: 12px; color: var(--ink-3); }

  /* what Tom checks every week, and what they never get */
  .pg-check .ck-wk, .pg-check .ck-nv { margin-top: 16px; }
  .pg-check .ck-bh { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .pg-check .ck-bh .lab { display: block; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-check .ck-bh h2 { margin: 4px 0 0; font-size: 24px; line-height: 1.15; font-weight: 500; letter-spacing: -0.02em; color: var(--ink); }
  .pg-check .ck-bh .r { font-size: 12px; color: var(--ink-3); }
  .pg-check .ck-w3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .015); }
  .pg-check .ck-pt { display: flex; flex-direction: column; gap: 14px; padding: 18px; border-left: 1px solid var(--line); min-width: 0; }
  .pg-check .ck-pt:first-child { border-left: 0; }
  .pg-check .ck-pa p { margin: 6px 0 0; font-size: 13px; line-height: 1.45; color: var(--ink-2); }
  .pg-check .ck-ph { display: flex; align-items: baseline; gap: 8px; }
  .pg-check .ck-ph em { font: 300 30px/1 var(--mono); font-style: normal; color: var(--holo); text-shadow: none; }
  .pg-check .ck-ph i { font-style: normal; font-size: 18px; color: var(--ink-3); }
  .pg-check .ck-ph b { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); }
  .pg-check .ck-pb { display: flex; flex-direction: column; min-width: 0; }
  .pg-check .ck-pb .working-line { margin-top: 10px; }
  .pg-check .ck-pb .working-line + .working-line { margin-top: 4px; }
  .pg-check .ck-fg { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-bottom: 12px; }
  .pg-check .ck-fg > div { min-width: 0; }
  .pg-check .ck-fg b { display: block; font: 300 34px/1 var(--mono); letter-spacing: -0.03em; color: var(--ink); text-shadow: none; }
  .pg-check .ck-fg span { display: block; max-width: 150px; margin-top: 5px; font-size: 12px; line-height: 1.35; color: var(--ink-3); }
  .pg-check .ck-fg .am b { color: var(--amber-ink); text-shadow: none; }
  .pg-check .ck-fg .am span { color: var(--amber-ink); opacity: .85; }
  .pg-check .ck-fg .am.click { cursor: pointer; }
  .pg-check .ck-lg, .pg-check .ck-nrs { display: grid; gap: 6px; }
  .pg-check .ck-l, .pg-check .ck-nr { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; gap: 10px; align-items: start; padding: 8px 10px; border-radius: 10px; border: 1px solid rgba(120, 200, 255, .07); background: rgba(255, 255, 255, .02); font-size: 12.5px; line-height: 1.4; color: var(--ink-3); }
  .pg-check .ck-l { grid-template-columns: 24px minmax(0, 1fr); }
  .pg-check .ck-l .av-s, .pg-check .ck-nr .av-s { margin: 0; }
  .pg-check .ck-l p, .pg-check .ck-nr p { margin: 0; padding-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pg-check .ck-l p b { font-weight: 500; color: var(--ink); }
  .pg-check .ck-l p em { margin-right: 7px; font: 600 12.5px var(--sans); font-style: normal; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-check .ck-l.chg p em { color: var(--ink); }
  .pg-check .ck-nr { color: var(--ink-2); }
  .pg-check .ck-nr p b { font-weight: 600; color: var(--ink); margin-right: 6px; }
  .pg-check .ck-nr.live p b::after { content: "new"; margin-left: 6px; font: 600 12.5px var(--sans); letter-spacing: 0; text-transform: none; color: var(--holo); }
  .pg-check .ck-nr .ok { display: inline-flex; align-items: center; gap: 4px; padding-top: 3px; font-size: 11.5px; font-weight: 500; white-space: nowrap; color: var(--green); }
  .pg-check .ck-nr .ok svg { width: 13px; height: 13px; filter: drop-shadow(0 0 4px rgba(63, 224, 160, .5)); }
  .pg-check .ck-nr .ok i { font-style: normal; }
  .pg-check .ck-nrs:not(.all) > :nth-child(n+7) { display: none; }
  .pg-check .ck-more { align-self: flex-start; margin-top: 8px; padding: 2px 0; border: 0; background: none; cursor: pointer; font-size: 12.5px; font-weight: 500; color: var(--holo-2); }
  .pg-check .ck-more:hover { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
  .pg-check .ck-more.few { display: none; }
  .pg-check .ck-cb { display: grid; gap: 14px; }
  .pg-check .ck-cb > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 6px 12px; }
  .pg-check .ck-cb span { font-size: 12.5px; color: var(--ink-2); }
  .pg-check .ck-cb em { font: 300 24px/1 var(--mono); font-style: normal; letter-spacing: -0.02em; color: var(--ink); }
  .pg-check .ck-cb i { grid-column: 1 / -1; height: 8px; border-radius: 8px; background: rgba(255, 255, 255, .06); overflow: hidden; }
  .pg-check .ck-cb i b { display: block; height: 100%; border-radius: 8px; background: linear-gradient(90deg, rgba(70, 200, 255, .45), var(--holo)); box-shadow: 0 0 10px var(--holo); }
  .pg-check .ck-cb .cost i b { background: rgba(168, 191, 212, .5); box-shadow: none; }
  .pg-check .ck-cb .cost em { color: var(--ink-2); }
  .pg-check .ck-cb.anim i b { animation: ckBar 1.1s cubic-bezier(.2, .8, .2, 1) .15s both; }
  @keyframes ckBar { from { width: 0; } }
  .pg-check .ck-ah { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); cursor: pointer; }
  .pg-check .ck-ah b { font: 300 36px/1 var(--mono); letter-spacing: -0.03em; color: var(--green); text-shadow: none; }
  .pg-check .ck-ah span { font-size: 12.5px; line-height: 1.4; color: var(--ink-3); }
  .pg-check .ck-ah.neg b { color: var(--red); text-shadow: none; }
  .pg-check .ck-cw { margin-top: 18px; }
  .pg-check .ck-cl, .pg-check .ck-cx { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; color: var(--ink-3); }
  .pg-check .ck-cl span:first-child { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; }
  .pg-check .ck-cc { position: relative; height: 96px; margin: 10px 0 6px; border-bottom: 1px solid var(--line); }
  .pg-check .ck-cc svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .pg-check .ck-cc rect { fill: rgba(168, 191, 212, .28); }
  .pg-check .ck-cc rect.up { fill: var(--holo); opacity: .85; filter: drop-shadow(0 0 4px rgba(70, 200, 255, .55)); }
  .pg-check .ck-cc rect:last-of-type { opacity: 1; fill: var(--holo-2); }
  .pg-check .ck-cc line.run { stroke: rgba(234, 246, 255, .7); stroke-width: 1.2; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; }
  .pg-check .ck-cx .rl { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); color: var(--ink-2); white-space: nowrap; }
  .pg-check .ck-cx .rl i { width: 16px; border-top: 1.5px dashed rgba(234, 246, 255, .7); }
  .pg-check .ck-cc.anim rect { transform-box: fill-box; transform-origin: 50% 100%; animation: ckRise .8s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes ckRise { from { transform: scaleY(0); } }

  .pg-check .ck-n3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .pg-check .ck-nb { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 16px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); }
  .pg-check .ck-nh { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .pg-check .ck-nh h4 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.015em; color: var(--ink); }
  .pg-check .ck-nb .sub { margin: -4px 0 2px; font-size: 12.5px; line-height: 1.4; color: var(--ink-2); }
  .pg-check .ck-nl { display: grid; gap: 6px; }
  .pg-check .ck-ni { display: grid; grid-template-columns: 8px minmax(0, 1fr); gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255, 181, 71, .3); background: var(--amber-tint); cursor: pointer; transition: border-color .15s, box-shadow .2s; }
  .pg-check .ck-ni:hover, .pg-check .ck-ni:focus-visible { border-color: rgba(255, 181, 71, .6); box-shadow: 0 0 26px -12px var(--amber-glow); outline: none; }
  .pg-check .ck-ni .ldot { margin-top: 5px; }
  .pg-check .ck-ni b { display: block; font-size: 13.5px; line-height: 1.35; font-weight: 600; color: var(--ink); }
  .pg-check .ck-ni .d { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 2px; font-size: 12px; line-height: 1.4; color: var(--ink-3); }
  .pg-check .ck-ni .t { display: block; margin-top: 4px; font: 400 11px var(--mono); white-space: nowrap; color: var(--amber-ink); }
  .pg-check .ck-yes { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 14px; padding: 14px 16px; border-radius: 14px; border: 1px solid rgba(255, 181, 71, .3); background: linear-gradient(90deg, rgba(255, 181, 71, .02), var(--amber-tint), rgba(255, 181, 71, .02)); font-size: 22px; font-weight: 500; letter-spacing: -0.015em; text-align: center; color: var(--ink); }
  .pg-check .ck-yes b { font-weight: 600; color: var(--amber); text-shadow: none; }

  /* laptop width: 1 and 2 side by side, 3 as a strip underneath, so all three fit on one screen */
  @container (max-width: 980px) {
    .pg-check .ck-w3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pg-check .ck-pt { padding: 16px; gap: 12px; }
    .pg-check .ck-pa p { font-size: 12.5px; margin-top: 4px; }
    .pg-check .ck-ph em { font-size: 26px; }
    .pg-check .ck-ph b { font-size: 16px; }
    .pg-check .ck-fg { gap: 6px 20px; margin-bottom: 10px; }
    .pg-check .ck-fg b { font-size: 30px; }
    .pg-check .ck-fg span { max-width: 132px; }
    .pg-check .ck-lg > :nth-child(n+3) { display: none; }
    .pg-check .ck-nrs:not(.all) > :nth-child(n+3) { display: none; }
    .pg-check .ck-more.few { display: inline-flex; }
    .pg-check .ck-bh { margin-bottom: 12px; }
    .pg-check .ck-bh h2 { font-size: 22px; }
    .pg-check .ck-l, .pg-check .ck-nr { padding: 7px 10px; }
    .pg-check .ck-nr .ok i, .pg-check .ck-wide { display: none; }
    .pg-check .ck-p3 { grid-column: 1 / -1; display: grid; grid-template-columns: 172px minmax(0, 1fr); gap: 0 24px; align-items: center; border-left: 0; border-top: 1px solid var(--line); }
    .pg-check .ck-p3 .ck-pa p, .pg-check .ck-p3 .ck-cw { display: none; }
    .pg-check .ck-p3 .ck-pb { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0 24px; align-items: center; }
    .pg-check .ck-p3 .ck-cb { gap: 10px; }
    .pg-check .ck-p3 .ck-cb em { font-size: 20px; }
    .pg-check .ck-p3 .ck-ah { flex-direction: column; align-items: flex-start; max-width: 170px; margin: 0; padding: 0 0 0 20px; border-top: 0; border-left: 1px solid var(--line); }
    .pg-check .ck-p3 .ck-ah b { font-size: 32px; }
    .pg-check .ck-p3 .working-line { grid-column: 1 / -1; }
  }
  @container (max-width: 760px) { .pg-check .ck-n3 { gap: 8px; } .pg-check .ck-nb { padding: 12px; gap: 8px; } .pg-check .ck-ni { padding: 8px 10px; gap: 8px; } .pg-check .ck-nh h4 { font-size: 18px; } }
  /* 9:16 and phones: everything in one column */
  @container (max-width: 600px) {
    .pg-check .ck-w3 { grid-template-columns: minmax(0, 1fr); }
    .pg-check .ck-pt { border-left: 0; border-top: 1px solid var(--line); }
    .pg-check .ck-pt:first-child { border-top: 0; }
    .pg-check .ck-lg > :nth-child(n+3), .pg-check .ck-nrs:not(.all) > :nth-child(n+3) { display: grid; }
    .pg-check .ck-p3 .ck-pa p, .pg-check .ck-p3 .ck-cw { display: block; }
    .pg-check .ck-nrs:not(.all) > :nth-child(n+7), .pg-check .ck-more.few { display: none; }
    .pg-check .ck-nr .ok i { display: inline; }
    .pg-check .ck-p3 { display: flex; grid-column: auto; align-items: stretch; }
    .pg-check .ck-p3 .ck-pb { display: flex; align-items: stretch; }
    .pg-check .ck-p3 .ck-ah { flex-direction: row; align-items: baseline; max-width: none; margin-top: 14px; padding: 12px 0 0; border-left: 0; border-top: 1px solid var(--line); }
    .pg-check .ck-n3 { grid-template-columns: minmax(0, 1fr); }
    .pg-check .ck-bh h2 { font-size: 21px; }
    .pg-check .ck-yes { font-size: 19px; }
  }
  `,

  render(host, ctx) {
    const L = ctx.local, D = ctx.data, A = ctx.acts, M = ctx.model;
    const checks = ctx.F.check.checks.slice().sort((a, b) => b.day_offset - a.day_offset);
    L.ci = Math.min(L.ci ?? 0, checks.length - 1); L.done ??= {}; L.tab ??= "people";
    const c = checks[L.ci], prev = checks[L.ci + 1], key = String(c.day_offset), d = monday(L.ci), pd = monday(L.ci + 1);
    const det = D.detail?.[key] || {}, fx = filler(ctx, L.ci), f0 = filler(ctx, 0);
    if (!L.sel || !c.agents.some((x) => x.agent === L.sel)) L.sel = c.agents.slice().sort((a, b) => a.score - b.score)[0].agent;
    const sel = c.agents.find((x) => x.agent === L.sel), sd = det[L.sel] || {};
    const prevOf = (id) => prev?.agents.find((x) => x.agent === id);
    const anim = drawnWeek !== L.ci; drawnWeek = L.ci;

    // the headline figures: the table's rows, added up
    const team = avg(c), pteam = prev ? avg(prev) : null, dTeam = pteam == null ? null : r1(team - pteam);
    const corr = sum(c, "corrections"), pcorr = prev ? sum(prev, "corrections") : null;
    const rules = sum(c, "rules_added");
    const fixRules = c.agents.filter((x) => x.corrections > 0).reduce((a, x) => a + x.rules_added, 0), keepRules = rules - fixRules;
    const series = checks.slice().reverse().map(avg);

    // what's still waiting for Kieran: the model's one list (latest week); earlier weeks are all decided
    const kNeeds = M.needs.filter((n) => n.who === "Kieran");
    const openK = L.ci === 0 ? kNeeds.map((n) => ({ agent: n.agent, flag: n.what, ask: `${n.detail}. ${n.why}.`, status: "open", page: n.page })) : [];
    const flags = [...openK, ...(D.flags?.[key] || []).filter((f) => f.status !== "open" || L.ci !== 0)];
    const tomNeed = M.needs.find((n) => n.who === "Tom");
    // what Tom checks every week (always the last 7 days) and what's waiting on a person (Home's "Needs you" list)
    const allNeeds = needsList(ctx), wkAnim = !drawnWk; drawnWk = true;

    // this Monday's sheet (live)
    const sheets = A.sheets || [], si = Math.min(L.si ?? 0, Math.max(0, sheets.length - 1)), run = sheets[si];
    const busy = sheets.some((s) => s.running);
    const cta = `<div class="card ck-cta">
        <div class="ch"><h3>This Monday's check sheet</h3><span class="r"><span class="ldot ${busy ? "busy" : ""}"></span>${busy ? "Kit's on it" : "Kit drafts it"}</span></div>
        <p>Before Tom starts, Kit reads the whole week: every invoice, reply, van plan, chaser, page, ad and task. What needs a human eye goes at the top.</p>
        ${busy ? `<div class="scan"><span class="shimmer">Kit's reading the week and writing the sheet…</span></div>` : `<button class="btn primary" data-prep>Prepare this Monday's sheet</button>`}
        <div class="meta">${run && !run.running && run.result ? `<span class="ldot good"></span><span>Sheet ready · <b>${esc(hhmm(run.at))}</b></span><button class="btn sm" data-open-sheet>Open it</button>` : run?.error && !busy ? `<span class="ldot bad"></span><span>${esc(run.error)}</span>` : `<span>Live, from the team's real work · about 20 seconds</span>`}</div>
      </div>`;

    const tabs = [["people", "Every employee"], ["routine", "Tom's routine"], ["kieran", `For Kieran${openK.length ? `<em>${openK.length}</em>` : ""}`], ["sheet", `Kit's sheet${busy ? `<i class="ldot busy"></i>` : run?.result ? `<i class="ldot good"></i>` : ""}`]];
    const tabTitle = { people: `Every employee, ${dayName(d, true)}`, routine: "Tom's Monday routine", kieran: "Only what the owner has to decide", sheet: "This Monday's check sheet" }[L.tab];

    let pane = "";
    if (L.tab === "people") {
      const rowsH = c.agents.map((x) => {
        const p = prevOf(x.agent), dv = p ? x.score - p.score : null;
        return `<tr data-ag="${x.agent}" class="${x.agent === L.sel ? "sel" : ""}" tabindex="0">
          <td><span class="who">${av(x.agent)}<b>${esc(BY_ID[x.agent]?.name)}</b></span></td>
          <td><span class="ck-bar"><i><b style="width:${Math.max(0.03, (x.score - 65) / 35) * 100}%"></b></i><em>${x.score}</em></span></td>
          <td class="r hide-s">${dv == null ? `<span class="muted">–</span>` : `<span class="ck-d ${dv > 0 ? "g" : dv < 0 ? "b" : ""}">${dv > 0 ? "+" : ""}${dv}</span>`}</td>
          <td class="r num">${num(x.corrections)}</td><td class="r num">${num(x.rules_added)}</td></tr>`;
      }).join("");
      const tbl = `<div class="tablewrap"><table class="t ck-t"><thead><tr><th>Employee</th><th>Score</th><th class="r hide-s">vs before</th><th class="r">Corrections</th><th class="r">Rules added</th></tr></thead>
        <tbody>${rowsH}</tbody>
        <tfoot><tr><td>Whole team</td><td><span class="ck-bar"><i><b style="width:${((team - 65) / 35) * 100}%"></b></i><em>${r1(team).toFixed(1)}</em></span></td><td class="r hide-s">${dTeam == null ? "–" : `${dTeam >= 0 ? "+" : ""}${dTeam}`}</td><td class="r">${corr}</td><td class="r">${rules}</td></tr></tfoot></table></div>`;
      const hist = checks.slice().reverse().map((ch, i, arr) => ({ d: monday(arr.length - 1 - i), x: ch.agents.find((y) => y.agent === L.sel) })).filter((h) => h.x);
      const ag = BY_ID[L.sel];
      pane = `<div class="ck-people">
        <section class="card"><div class="ch"><h3>Scores, corrections and rules</h3><span class="r">click anyone</span></div>${tbl}
          ${working(`Team score = the ten scores ÷ 10 = ${num(sum(c, "score"))} ÷ 10 = ${r1(team)}. Corrections and rules added are the columns added up.`)}</section>
        <section class="card ck-drill">
          <div class="ck-dh">${av(L.sel)}<div><h2>${esc(ag.name)}</h2><p>${esc(ag.role)} · ${esc(ag.does)}</p></div><div class="ck-sc"><b>${sel.score}</b><span>${esc(short(d))}</span></div></div>
          <div class="ck-h4">Score, four Mondays</div>
          ${lineChart(hist.map((h) => ({ l: short(h.d), v: h.x.score })), { h: 110, min: 60, max: 100, every: 1, fmt: (v) => String(v) })}
          <div class="ck-h4">What Tom checked</div>
          ${(sd.items || []).length ? `<div class="list ck-items">${sd.items.map((it) => `<div class="li"><div><b>${esc(fx(it.what))}</b><div class="s">${esc(fx(it.note))}</div></div>${chip(RES[it.result]?.[0] || it.result, RES[it.result]?.[1] || "")}</div>`).join("")}</div>` : empty("No detail for this check.")}
          <div class="ck-looked">Tom looks at: ${esc(f0((D.looked_at?.[L.sel] || []).join(" · ")))}</div>
          <div class="ck-h4">Rule added</div>
          ${sd.rule ? note(`<b>${esc(ag.name)}:</b> ${esc(fx(sd.rule))}`, "amber") : `<div class="note">No new rule needed at this check.</div>`}
          <div class="ck-verdict">${esc(fx(sd.verdict || sel.note))}<span>Tom's verdict · ${sel.corrections} correction${sel.corrections === 1 ? "" : "s"} · ${sel.rules_added} rule${sel.rules_added === 1 ? "" : "s"} added</span></div>
          <div class="row" style="margin-top:16px"><button class="btn sm" data-desk="${L.sel}">Go to ${esc(ag.name)}'s desk</button>${L.sel === "coach" ? `<button class="btn sm" data-go="training">Open Training</button>` : ""}</div>
        </section></div>`;
    } else if (L.tab === "routine") {
      const R = D.routine || [], doneN = R.filter((_, i) => L.done[i]).length, doneMin = R.reduce((a, r, i) => a + (L.done[i] ? r.min : 0), 0), totMin = R.reduce((a, r) => a + r.min, 0);
      let at = 0;
      pane = `<div class="ck-rtw">
        <section class="card"><div class="ch"><h3>Tom's Monday routine</h3><span class="r">${doneN ? `<button class="btn sm" data-reset>Start again</button>` : `about ${totMin} minutes`}</span></div>
          <div class="ck-prog"><span class="ck-pbar"><b style="width:${totMin ? (doneMin / totMin) * 100 : 0}%"></b></span><span><b class="num">${doneN}</b> of ${R.length} done · <span class="num">${doneMin}</span> of <span class="num">${totMin}</span> min</span></div>
          <div class="ck-rt">${R.map((r, i) => { const t = at; at += r.min; const extra = /rules/i.test(r.title) && tomNeed ? chip(`${tomNeed.what.replace(/^Sign off /, "")} to sign off`, "amber") : ""; return `<button data-step="${i}" class="${L.done[i] ? "done" : ""}" aria-pressed="${!!L.done[i]}"><span class="ck-box">${tick}</span><time class="num">0:${String(t).padStart(2, "0")}</time><div><b>${esc(f0(r.title))}</b><span>${esc(f0(r.what))}</span>${extra ? `<div>${extra}</div>` : ""}</div><em>${r.min} min</em></button>`; }).join("")}</div></section>
        <section class="card"><div class="ch"><h3>How it went, ${esc(dayName(d, true))}</h3><span class="r">${c.minutes_spent} min</span></div>
          <p class="ck-sum">${esc(fx(c.summary))}</p>
          <div class="ck-h4">What Tom changed</div>
          <div class="ck-chg">${c.changes_made.map((x, i) => `<div><i>${String(i + 1).padStart(2, "0")}</i><span>${esc(fx(x))}</span></div>`).join("")}</div></section></div>`;
    } else if (L.tab === "kieran") {
      pane = `<section class="card"><div class="ch"><h3>${L.ci === 0 ? "Waiting for Kieran, and what he's decided" : `What Kieran decided after ${esc(dayName(d, true))}`}</h3><span class="r">${L.ci === 0 ? chip(`${openK.length} waiting`, openK.length ? "amber" : "green") : chip("All decided", "green")}</span></div>
        ${flags.length ? `<div class="ck-fl">${flags.map((f, i) => `<div class="ck-f ${f.status === "open" ? "open" : ""}" ${f.status === "open" ? `data-flag="${i}"` : ""}><div>${who(f.agent)}<b>${esc(fx(f.flag))}</b><div class="s">${esc(fx(f.ask))}</div>${f.status === "decided" && f.decision ? `<div class="dec">Kieran: ${esc(fx(f.decision))}</div>` : ""}</div>${f.status === "open" ? chip("Waiting for Kieran", "amber") : chip("Decided", "green")}</div>`).join("")}</div>` : empty("Nothing for Kieran at this check.")}
        ${working(L.ci === 0 ? `The ${openK.length} waiting are the same ones on Home under "Needs you".` : "")}</section>`;
    } else {
      pane = `<section class="card hud">${run
        ? `<div class="ch"><h3>${run.running ? "Kit's writing it now" : `Drafted by Kit · ${esc(dayName(new Date(run.at)))} ${esc(hhmm(run.at))}`}</h3><span class="r"><button class="btn sm" data-prep ${busy ? "disabled" : ""}>Prepare it again</button></span></div>${sheetView(run)}${sheets.length > 1 ? `<div class="ck-runs"><span>Earlier sheets:</span>${sheets.map((s, i) => `<button class="btn sm ${i === si ? "primary" : ""}" data-si="${i}">${esc(dayName(new Date(s.at)))} ${esc(hhmm(s.at))}</button>`).join("")}</div>` : ""}`
        : `${empty("No sheet yet for this Monday. Kit reads the whole week, puts what needs a human eye at the top, flags anything risky and suggests the rules to add.")}<div class="row" style="margin-top:12px;justify-content:center"><button class="btn primary" data-prep>Prepare this Monday's sheet</button><span class="muted" style="font-size:12.5px">Live · about 20 seconds</span></div>`}</section>`;
    }

    host.innerHTML = `<div class="inner pg-check">
      ${head({ title: "Tom's weekly check", agents: ["coach", "manager"], lede: "Every Monday Tom checks all ten AI employees: what they did, what he corrected, any rule to add, anything for Kieran. About half an hour, part of the monthly management." })}
      <section class="ck-hero">
        <div class="card hud ck-rc">
          <div class="ch"><h3>Ten scores, ${esc(short(d))}</h3><div class="r"><div class="seg" role="tablist">${checks.map((_, i) => `<button role="tab" aria-selected="${i === L.ci}" data-ci="${i}">${esc(short(monday(i)))}</button>`).join("")}</div></div></div>
          ${radar(c, prev, L.sel, team, anim)}
          <div class="ck-leg"><span><i></i>${esc(dayName(d, true))}</span>${prev ? `<span><i class="p"></i>${esc(dayName(pd, true))}</span>` : ""}<span>Click a name to see what Tom checked</span></div>
        </div>
        <div class="ck-side">
          <div class="card ck-stats">
            <div class="ch"><h3>Team score</h3><span class="r">${dTeam == null ? "" : `<span class="ck-up ${dTeam >= 0 ? "g" : "b"}">${dTeam >= 0 ? "+" : ""}${dTeam} on ${esc(short(pd))}</span>`}</span></div>
            <div class="ck-score"><b class="num">${Math.round(team)}<small>/100</small></b>${spark(series)}</div>
            ${working(`Average of the ten scores: ${num(sum(c, "score"))} ÷ 10 = ${r1(team)}`)}
            <div class="ck-mini">
              <div><span>Time it took</span><b class="num">${c.minutes_spent}<small>min</small></b><em class="${prev && c.minutes_spent < prev.minutes_spent ? "g" : ""}">${prev ? `down from ${prev.minutes_spent}` : `${esc(c.reviewer)}`}</em></div>
              <div><span>Corrections</span><b class="num">${corr}</b><em class="${pcorr != null && corr < pcorr ? "g" : ""}">${pcorr != null ? `${corr <= pcorr ? "down" : "up"} from ${pcorr}` : ""}</em></div>
              <div class="click" data-go="training" data-tip="Every rule is in Kit's rules library"><span>Rules added</span><b class="num">${rules}</b><em>${fixRules} fix a mistake · ${keepRules} keep a good habit</em></div>
            </div>
          </div>
          ${cta}
        </div>
      </section>
      ${weekCard(ctx, checks[0], wkAnim)}
      ${neverCard(ctx, allNeeds)}
      <div class="ck-tabs" id="ck-tabs"><h2>${esc(tabTitle)}</h2><div class="seg" role="tablist">${tabs.map(([v, l]) => `<button role="tab" aria-selected="${v === L.tab}" data-tab="${v}">${l}</button>`).join("")}</div></div>
      ${pane}
      ${foot()}</div>`;

    const toTabs = () => $("#ck-tabs", host)?.scrollIntoView({ behavior: "smooth", block: "start" });
    $$("[data-ci]", host).forEach((b) => (b.onclick = () => { L.ci = Number(b.dataset.ci); ctx.redraw(); }));
    $$("[data-tab]", host).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; ctx.redraw(); }));
    $$(".ck-lab[data-ag]", host).forEach((b) => (b.onclick = async () => { L.sel = b.dataset.ag; L.tab = "people"; await ctx.redraw(); toTabs(); }));
    $$("tr[data-ag]", host).forEach((tr) => { tr.onclick = () => { L.sel = tr.dataset.ag; ctx.redraw(); }; tr.onkeydown = (e) => { if (e.key === "Enter") tr.onclick(); }; });
    $$("[data-step]", host).forEach((b) => (b.onclick = () => { const i = b.dataset.step; L.done[i] = !L.done[i]; ctx.redraw(); }));
    $$("[data-reset]", host).forEach((b) => (b.onclick = () => { L.done = {}; ctx.redraw(); }));
    $$("[data-si]", host).forEach((b) => (b.onclick = () => { L.si = Number(b.dataset.si); ctx.redraw(); }));
    $$("[data-desk]", host).forEach((b) => (b.onclick = () => ctx.openAgent(b.dataset.desk)));
    $$("[data-flag]", host).forEach((el) => (el.onclick = () => ctx.go(flags[+el.dataset.flag].page || "tasks")));
    $$("[data-allrules]", host).forEach((b) => (b.onclick = () => { L.allRules = !L.allRules; ctx.redraw(); }));
    $$("[data-need]", host).forEach((el) => {
      el.onclick = () => { const n = allNeeds[+el.dataset.need]; if (!n) return; n.page === "team" && !PAGE_OF[n.agent] ? ctx.openAgent(n.agent) : ctx.go(n.page || "tasks"); };
      el.onkeydown = (e) => { if (e.key === "Enter") el.onclick(); };
    });
    $$("[data-open-sheet]", host).forEach((b) => (b.onclick = async () => { L.tab = "sheet"; L.si = 0; await ctx.redraw(); toTabs(); }));
    $$("[data-prep]", host).forEach((b) => (b.onclick = async () => {
      b.disabled = true; L.si = 0; L.tab = "sheet";
      try { await ctx.act("prepare", {}); } catch (err) { ctx.flash(err.message); }
      await ctx.redraw(); toTabs();
    }));
  },

  onEvent(ev) {
    // also new rules (Kit's desk) and live drafts waiting for a yes (the never-theirs list)
    return (ev.type === "act" && ["check", "ads", "content"].includes(ev.page)) || ev.type === "lessons" || ev.type === "reset";
  },
  leave() { drawnWeek = null; drawnWk = false; },
};
