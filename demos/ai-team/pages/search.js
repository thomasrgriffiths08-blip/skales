// Search: Seren's desk (video 4). The hero is Bristol drawn as a holographic coverage map: every service in every area,
// lit where a live Kingpost page answers the search, dim where one's drafted, amber where nobody local answers it well.
// Then "Check any search" (a live Claude call that streams in like a scanner), and the detail behind tabs.
// Every headline figure comes from ctx.model so it agrees with Home and Numbers.
import { $, $$, esc, num, chip, head, seg, barChart, lineChart, hbars, note, foot, dayDate, short, ago, av } from "../ui.js";

const STAGE_I = { seo: 0, "to-content": 1, content: 1, "to-ads": 2, ads: 2, "to-manager": 3, review: 3, done: 4 };
const STEPS = [
  { a: "seo", t: "Seren briefs Clara" },
  { a: "content", t: "Clara writes the page" },
  { a: "ads", t: "Archie writes three test ads" },
  { a: "manager", t: "Maeve checks it all" },
  { a: null, t: "Priya approves it" },
];
const BUSY = ["Seren is briefing Clara", "Clara is writing it", "Archie is writing ads", "Maeve is checking it"];
const OPP_TONE = { found: "amber", "brief written": "", "page drafted": "holo", "live, tracking": "green" };
const VERDICT_TONE = { "worth a page": "green", "fold into an existing page": "amber", skip: "" };
const CELL = { L: "page live", D: "page drafted", G: "gap" };
// the scanner readout: the fields Seren's check streams back, in the order she writes them
const ORDER = ["intent", "searcher", "need", "results_miss", "page_title", "page_slug", "outline", "proof", "verdict", "verdict_why", "fold_into", "service", "area"];
const LINES = [["intent", "Intent"], ["searcher", "Who's searching"], ["need", "What they need"], ["results_miss", "What local pages miss"], ["page_title", "The page to build"], ["outline", "Sections"], ["proof", "Proof it needs"], ["verdict", "Seren's verdict"]];
const ICON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>`;
const TICK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>`;
const sum = (a) => a.reduce((x, y) => x + y, 0);
const pos = (v) => (Math.round(v * 10) / 10).toFixed(1);
const cap = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
const list = (a, tag = "ul", cls = "") => (a.length ? `<${tag} class="${cls}">${a.map((x) => `<li>${esc(x)}</li>`).join("")}</${tag}>` : "");
// keep looping animations in step across redraws (the page redraws while Seren streams)
const ph = (ms, off = 0) => `-${Math.round((performance.now() + off) % ms)}ms`;
let seen = false;

// a wide glowing trend line that fills its box
function trend(vals, { h = 44, tone = "holo" } = {}) {
  const w = 240, lo = Math.min(...vals), hi = Math.max(...vals), sp = hi - lo || 1;
  const p = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 4 - ((v - lo) / sp) * (h - 10)]);
  const line = p.map((q) => q.join(",")).join(" "), last = p[p.length - 1];
  return `<svg class="tr ${tone}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="0,${h} ${line} ${w},${h}"/><polyline points="${line}" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="3"/></svg>`;
}

// ------------------------------------------------------------------ coverage: services x areas in Bristol, Bath and Swindon
// a gap Kingpost can prove: enough of its own jobs there this year to show real photos and real prices
const prove = (D) => D.prove_jobs || 3;
function cells(D) {
  return D.services.flatMap((s, si) => [...s.cells].map((c, ai) => ({ s, si, ai, c, est: s.est[ai], jobs: s.jobs[ai], prove: c === "G" && s.jobs[ai] >= prove(D) })));
}
function mapped(D, r) {
  if (!r) return null;
  const si = D.services.findIndex((s) => s.name.toLowerCase() === String(r.service || "").toLowerCase());
  const ai = D.areas.findIndex((a) => a.toLowerCase() === String(r.area || "").toLowerCase());
  return si >= 0 && ai >= 0 ? `${si}:${ai}` : null;
}
function coverage(D, L, M, scanning, hit) {
  const A = D.areas, X = cells(D), f = L.covF || "all", n = (fn) => X.filter(fn).length;
  if (!L.cell) { const best = X.filter((x) => x.prove).sort((a, b) => b.jobs - a.jobs)[0]; L.cell = best ? `${best.si}:${best.ai}` : "0:0"; }
  const dim = (x) => (f === "L" && x.c !== "L") || (f === "D" && x.c !== "D") || (f === "G" && x.c !== "G") || (f === "P" && !x.prove);
  const leg = [["L", "Page live", n((c) => c.c === "L")], ["D", "Drafted", n((c) => c.c === "D")], ["G", "Gap", n((c) => c.c === "G")], ["P", "Gap Kingpost can prove", n((c) => c.prove)]];
  const grid = `<div class="cov ${scanning ? "scanning" : ""}" style="--n:${A.length}">
      <div class="corner"></div>${A.map((a, ai) => `<div class="ah" data-c="${ai}"><span>${esc(a)}</span></div>`).join("")}<div class="ah lv"><span>Live</span></div>
      ${D.services.map((s, si) => `<div class="sv" data-r="${si}"><span class="ln">${esc(s.name)}</span><span class="sn">${esc(s.short || s.name)}</span></div>${[...s.cells].map((c, ai) => {
        const x = X[si * A.length + ai], id = `${si}:${ai}`;
        return `<button class="cv ${c} ${x.prove ? "p" : ""} ${dim(x) ? "dim" : ""} ${L.cell === id ? "sel" : ""} ${hit === id ? "hit" : ""}" data-cell="${id}" data-r="${si}" data-c="${ai}" style="--d:${(si + ai) * 26}ms;--p:${ph(3200, ((si * 7 + ai * 13) % 10) * 320)}" aria-label="${esc(`${s.name} in ${A[ai]}: ${CELL[c]}`)}" data-tip="${esc(`${s.name} in ${A[ai]}: ${CELL[c]}. About ${x.est} searches a month (estimate), ${x.jobs} Kingpost jobs there this year`)}"></button>`;
      }).join("")}<div class="rt num">${[...s.cells].filter((c) => c === "L").length}<small>/${A.length}</small></div>`).join("")}
      <i class="sweep" style="--ph:${ph(scanning ? 1600 : 7000)}"></i>
    </div>`;
  // the readout under the map: the square that's selected
  const x = X.find((c) => `${c.si}:${c.ai}` === L.cell);
  let ro = "";
  if (x) {
    const area = A[x.ai], svc = x.s.name.toLowerCase(), q = `${x.s.search} ${area.toLowerCase()}`;
    const advice = x.c === "L" ? `Live. ${esc(x.s.page)} answers this for ${esc(area)}. Seren keeps an eye on where it lands.`
      : x.c === "D" ? `Drafted and waiting for Priya. Once she approves it, this square lights up.`
      : x.jobs >= prove(D) ? `A hole Kingpost can fill: ${x.jobs} ${esc(svc)} jobs in ${esc(area)} this year means real photos and real prices to show.`
      : x.jobs > 0 ? `Only ${x.jobs} job${x.jobs > 1 ? "s" : ""} here this year. Seren would fold ${esc(area)} into the main ${esc(svc)} page for now.`
      : `No Kingpost jobs here yet, so nothing to prove it with. Seren leaves this one for now.`;
    const tag = x.c === "L" ? "L" : x.c === "D" ? "D" : x.prove ? "P" : "G";
    ro = `<div class="ro">
        <div class="ro-h"><span class="tg ${tag}">${x.c === "G" && x.prove ? "Gap Kingpost can prove" : cap(CELL[x.c])}</span><b>${esc(x.s.name)} <em>·</em> ${esc(area)}</b></div>
        <div class="ro-s"><span data-tip="Monthly estimate. New searches get checked in a keyword tool before they count."><b class="num">${x.est}</b>searches a month</span><span><b class="num">${x.jobs}</b>jobs there this year</span></div>
        <p>${advice}</p>
        <button class="btn sm" data-try="${esc(q)}">${ICON}Check “${esc(q)}”</button>
      </div>`;
  }
  const W = D.services.length * A.length, Wa = D.watching || {}, all = M.employees.seo.units.at(-1);
  const tip = Wa.areas ? `${D.services.length} services × ${Wa.areas} areas + ${Wa.longer_questions} longer questions = ${num(all)} searches. The map shows ${A.length} of the ${Wa.areas} areas.` : "";
  return `<section class="card hud mapc">
      <div class="ch"><h3>Search coverage: Bristol, Bath and Swindon</h3><div class="r leg">${leg.map(([k, l, v]) => `<button data-cf="${k}" aria-pressed="${f === k}"><i class="${k}"></i>${l}<b>${v}</b></button>`).join("")}</div></div>
      <p class="msub" ${tip ? `data-tip="${esc(tip)}"` : ""}>${D.services.length} services × ${A.length} areas: ${W} of the ${num(all)} searches Seren checked in the last 7 days. Lit = a live Kingpost page answers it.</p>
      <div class="covw">${grid}</div>
      ${ro}
    </section>`;
}

// ------------------------------------------------------------------ her three headline figures (from the model)
function figures(M) {
  const E = M.employees.seo, W = M.weeks, K = E.kpis;
  const fig = (k, value, unit, series, cls = "") => `<div class="card fig ${cls}" data-tip="${esc(k.working)}"><h3>${esc(k.label)}</h3>
      <div class="fr"><div class="big" data-count="${value}">${esc(num(value, 1))}${unit ? `<small>${unit}</small>` : ""}</div>${trend(series)}</div>
      <div class="working-line">${esc(k.working)}</div></div>`;
  return `<div class="figs">
      ${fig(K[0], E.units.at(-1), "", E.units)}
      ${fig(K[1], W.at(-1).leads.seo, "", W.map((w) => w.leads.seo), "go")}
      ${fig(K[2], E.hours.at(-1), "h", E.hours)}
    </div>`;
}

// ------------------------------------------------------------------ live: check any search, drawn as a scanner
function fieldState(r, k, running) {
  const has = (key) => r[key] !== undefined && r[key] !== null && !(Array.isArray(r[key]) && !r[key].length) && r[key] !== "";
  if (!has(k)) return "";
  if (!running) return "done";
  const later = ORDER.slice(ORDER.indexOf(k) + 1).some(has);
  return later ? "done" : "on";
}
function fieldText(r, k) {
  const v = r[k];
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? x?.item : x)).filter(Boolean).join(" · ");
  return k === "verdict" ? cap(v) : String(v || "");
}
function scanner(run) {
  const r = run.partial || {}, states = LINES.map(([k]) => fieldState(r, k, true));
  const done = states.filter((s) => s === "done").length, pct = Math.round((done / LINES.length) * 100), reading = states.includes("on") ? -1 : states.findIndex((x) => !x);
  const blips = states.map((s, i) => (s ? `<circle class="blip ${s}" cx="${80 + Math.cos(i * 0.9 + 0.4) * (22 + ((i * 17) % 46))}" cy="${80 + Math.sin(i * 0.9 + 0.4) * (22 + ((i * 17) % 46))}" r="${s === "on" ? 4 : 3}"/>` : "")).join("");
  return `<div class="scv" style="--ph:${ph(2400)}">
      <div class="radar"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="76"/><circle cx="80" cy="80" r="54"/><circle cx="80" cy="80" r="32"/><path d="M4 80h152M80 4v152"/>${blips}</svg>
        <i class="sw" style="--ph:${ph(2200)}"></i><div class="pct"><b class="num">${pct}</b><span>%</span></div></div>
      <div class="sll">
        <div class="sl done"><span class="k">Search</span><span class="v">“${esc(run.input)}”</span><i class="ok">${TICK}</i></div>
        ${LINES.map(([k, l], i) => { const s = states[i]; return `<div class="sl ${s}"><span class="k">${esc(l)}</span><span class="v ${s === "on" ? "caret" : ""}">${s ? esc(fieldText(r, k)) : i === reading ? `<span class="shimmer">reading…</span>` : "waiting"}</span><i class="ok">${s === "done" ? TICK : ""}</i></div>`; }).join("")}
      </div>
    </div>`;
}
function result(run, D) {
  if (run.error) return note(`Seren couldn't finish this one: ${esc(run.error)}`, "red");
  const r = run.result || {};
  const miss = (r.results_miss || []).filter(Boolean), outline = (r.outline || []).filter(Boolean), proof = (r.proof || []).filter((p) => p?.item);
  const m = mapped(D, r), vt = VERDICT_TONE[String(r.verdict || "").toLowerCase()] ?? "";
  const onMap = m ? (() => { const [si, ai] = m.split(":").map(Number), c = D.services[si].cells[ai]; return `<button class="maplink" data-cell="${m}" data-jump="1"><span class="tg ${c}">${esc(cap(CELL[c]))}</span>${esc(D.services[si].name)} in ${esc(D.areas[ai])} on the map</button>`; })() : "";
  return `<div class="res">
      <div class="rc"><h4>Who's searching ${r.intent ? chip(r.intent, "holo") : ""}</h4><p>${esc(r.searcher)}</p>
        ${r.need ? `<h4>What they need</h4><p>${esc(r.need)}</p>` : ""}
        ${miss.length ? `<h4>What local pages usually miss</h4>${list(miss, "ul", "miss")}` : ""}</div>
      <div class="rc"><h4>The page Kingpost should build</h4><p class="pt">${esc(r.page_title)}</p><p class="mono slug">${esc(r.page_slug)}</p>${list(outline, "ol", "ol")}</div>
      <div class="rc"><h4>Proof it needs</h4>${proof.length ? `<ul class="pv">${proof.map((p) => `<li><span>${esc(p.item)}</span>${p.have ? chip(p.have, /have/i.test(p.have) ? "green" : "") : ""}</li>`).join("")}</ul>` : ""}
        ${r.verdict ? `<div class="vd ${vt}"><span>Seren's verdict</span><b>${esc(cap(r.verdict))}</b>${r.verdict_why ? `<p>${esc(r.verdict_why)}</p>` : ""}${r.fold_into ? `<p class="mono">${esc(r.fold_into)}</p>` : ""}</div>` : ""}
        ${onMap}</div>
    </div>`;
}
function checker(D, ctx, L) {
  const runs = ctx.acts.checks || [], cur = runs.find((r) => r.id === L.ck) || runs[0], busy = runs.some((r) => r.running);
  const form = `<form class="ask ckf" id="ck-f">${ICON}<input id="ck-in" placeholder="Type any search, the way a customer would" value="${esc(L.q || "")}" autocomplete="off" ${busy ? "disabled" : ""}><button ${busy ? "disabled" : ""}>${busy ? "Scanning…" : "Check it"}</button></form>
    <div class="row ex"><span class="s">Try</span>${(D.examples || []).map((e) => `<button class="chip" data-try="${esc(e)}" ${busy ? "disabled" : ""}>${esc(e)}</button>`).join("")}</div>`;
  let body;
  if (!cur) {
    body = `<div class="idle"><div class="radar sm"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="76"/><circle cx="80" cy="80" r="50"/><circle cx="80" cy="80" r="24"/><path d="M4 80h152M80 4v152"/></svg><i class="sw" style="--ph:${ph(5000)}"></i></div>
      <p>Type any search a customer might make. Seren reads it the way someone local would mean it, says what local pages usually miss, and briefs the page Kingpost should build, with the proof it would need. About 20 seconds.</p></div>`;
  } else {
    const head2 = cur.running ? `<span class="live"><i class="ldot busy"></i>Seren is reading “${esc(cur.input)}”</span>` : `<b>“${esc(cur.input)}”</b><span class="s">checked ${ago(cur.at)}</span>`;
    body = `<div class="ckh">${head2}</div>${cur.running ? scanner(cur) : result(cur, D)}
      <div class="ckf2"><span class="s">Search volume needs checking in a keyword tool. Seren doesn't guess numbers, and never promises a ranking.</span>
        ${runs.length > 1 ? `<div class="pastc"><span class="s">Past checks</span>${runs.map((r) => `<button class="pc ${r.id === cur.id ? "sel" : ""}" data-ck="${r.id}"><i class="ldot ${r.running ? "busy" : r.error ? "bad" : r.result?.verdict === "worth a page" ? "good" : ""}"></i>${esc(r.input)}</button>`).join("")}</div>` : ""}</div>`;
  }
  return `<section class="card scn ${busy ? "busy" : ""}" id="ck-card"><div class="ch"><h3>Check any search</h3><div class="r">${av("seo")}Seren reads it live</div></div>${form}${body}</section>`;
}

// ------------------------------------------------------------------ competitor check: three columns that build up one at a time
// Filmed for video 4: column 1 shows on its own, then "Show column 2" and "Show column 3" reveal the rest (or "Show all").
// The step lives here, not in the HTML, so a live redraw mid-reveal carries on from where the animation had got to.
const ANS = { thin: ["Thin", 1], old: ["Out of date", 2], directory: ["A directory", 1], well: ["Answered well", 4] };
const GW = [64, 46, 72, 54, 68, 42, 58];
const gx = { step: 1, cols: [], at: 0 };
const winnable = (r) => r.intent === "buyer" && r.answer !== "well";
function gxState() {
  const el = performance.now() - gx.at, anim = el < 2800 ? gx.cols : [];
  return { cls: `st${gx.step}${gx.step >= 2 ? " on2" : ""}${gx.step >= 3 ? " on3" : ""}${anim.map((c) => ` an${c}`).join("")}`, el: Math.round(el), o3: anim.length === 2 ? 700 : 0 };
}
function gxStep(card, to) {
  const from = gx.step; if (!card || to === from) return;
  gx.step = to; gx.cols = [2, 3].filter((c) => c > from && c <= to); gx.at = performance.now();
  const k = gxState();
  card.className = "card gx"; void card.offsetWidth; // restart the reveal animations
  card.className = `card gx ${k.cls}`; card.style.setProperty("--el", "0ms"); card.style.setProperty("--o3", `${k.o3}ms`);
}
function rankCheck(D) {
  const R = D.rank_check?.rows || []; if (!R.length) return "";
  const k = gxState(), n = R.length, w = R.filter(winnable).length;
  const rows = R.map((r, i) => {
    const g = `grid-row:${i + 2};--i:${i}`, a = ANS[r.answer] || ANS.thin, t = winnable(r) ? "win" : "no";
    return `<div class="gxc c1 ${t}" style="${g}"><div class="gxq">${esc(r.q)}</div><div class="gxw"><span>${esc(r.who)}</span><b>#${esc(r.rank)}</b></div>
        <div class="gxn" data-tip="Monthly estimate. Anything new gets checked in a keyword tool before it counts."><b>${num(r.est)}</b><span>a month</span></div></div>
      <div class="gxc c2 ${t}" style="${g};--gw:${GW[i % GW.length]}%"><div class="gxv">${chip(r.intent === "buyer" ? "Buyer" : "Browser", r.intent === "buyer" ? "holo" : "")}<span>${esc(r.intent_why)}</span></div></div>
      <div class="gxc c3 ${t}" style="${g};--gw:${GW[(i + 3) % GW.length]}%"><div class="gxv"><div class="gxa"><b>${esc(a[0])}</b><span class="gxp" data-tip="How well the page that ranks answers it: ${a[1]} out of 4">${[1, 2, 3, 4].map((p) => `<i class="${p <= a[1] ? "f" : ""}"></i>`).join("")}</span></div>
        <span class="gxd ${t}">${t === "win" ? "<i></i>Winnable" : "Leave it"}</span><div class="gxy">${esc(r.answer_why)}</div></div></div>`;
  }).join("");
  return `<section class="card gx ${k.cls}" id="sr-gx" style="--el:${k.el}ms;--o3:${k.o3}ms">
      <div class="ch gx-h"><h3>Competitor check</h3><div class="r gx-ctl">
        <button class="btn sm primary" data-gx-next><span class="l1">Show column 2</span><span class="l2">Show column 3</span><span class="l3">Start again</span></button>
        <button class="btn sm" data-gx-all>Show all</button></div></div>
      <h2 class="gx-t">What competitors rank for, and how well they answer it</h2>
      <p class="gx-s">Seren checks every local search a competitor ranks for, and reads each one three ways.</p>
      <div class="gx-g">
        <i class="gxb gxb2" style="grid-row:1 / span ${n + 1}"></i><i class="gxb gxb3" style="grid-row:1 / span ${n + 1}"></i>
        <button class="gxh c1" data-gx="1"><em>1</em><span>What they rank for<small>Searches a month, estimated</small></span></button>
        <button class="gxh c2" data-gx="2"><em>2</em><span>Buyer or browser</span></button>
        <button class="gxh c3" data-gx="3"><em>3</em><span>How well it's answered<small>The one agencies ignore</small></span></button>
        ${rows}
      </div>
      <div class="gxf"><div class="f1">Search numbers are monthly estimates. Every firm here is a sample.</div>
        <div class="f3"><b>${w}</b><span><em>of ${n} are winnable:</em> real buyers, badly answered. Seren goes after those and leaves the rest. She never promises number one.</span></div></div>
    </section>`;
}

// ------------------------------------------------------------------ tab 1: searches nobody serves well
function relaySteps(R) {
  const at = STAGE_I[R.stage] ?? 0, failed = !R.running && R.stage !== "done", ok = R.review?.verdict === "approved";
  const say = (i) => {
    if (i === 0 && R.brief) return esc(R.brief.brief);
    if (i === 1 && R.page?.title) return `“${esc(R.page.title)}”${R.page.sections?.length ? ` · ${R.page.sections.length} sections` : ""}`;
    if (i === 2 && R.ads?.variants) return R.ads.variants.map((v) => `“${esc(v.headline)}”`).join(" · ");
    if (i === 3 && R.review) return esc(R.review.summary);
    if (i === 4 && R.stage === "done") return ok ? "On Maeve's board as waiting for Priya. Nothing goes live until she says so." : "Back with Clara for changes first.";
    return "";
  };
  return `<div class="rl">${STEPS.map((s, i) => {
    const done = i < at, waiting = i === 4 && R.stage === "done" && ok, on = (i === at && R.running) || waiting, bad = failed && i === at;
    const st = bad ? "stopped" : waiting ? "waiting" : on ? "working now" : done ? "done" : "";
    return `<div class="rs ${bad ? "bad" : waiting ? "wait" : on ? "on" : done ? "done" : ""}"><div class="sh">${s.a ? av(s.a) : `<span class="av-s pr" aria-hidden="true">P</span>`}<b class="${on && !waiting ? "shimmer" : ""}">${esc(s.t)}</b></div>
      <div class="sl2">${st ? `<span class="st">${st}</span>` : ""}${i === 3 && R.review ? chip(ok ? "Approved" : "Changes asked", ok ? "green" : "red") : ""}</div>${say(i) ? `<div class="s">${say(i)}</div>` : ""}</div>`;
  }).join("")}</div>`;
}
function oppChip(o, st, R) {
  if (R?.opp?.id === o.id) {
    if (R.running) return chip(BUSY[Math.min(3, STAGE_I[R.stage] ?? 0)], "holo");
    if (R.stage === "done") return R.review?.verdict === "approved" ? chip("Waiting for Priya", "amber") : chip("Changes asked", "red");
    return chip("Stopped", "red");
  }
  return chip(st, OPP_TONE[st] || "");
}
function oppDetail(o, R) {
  const p = o.page_to_build, mine = R?.opp?.id === o.id, busy = R?.running;
  return `<div class="det-in">
      <div><h4>The gap</h4><p>${esc(o.gap)}</p>
        <h4>Who answers it now</h4><p><b>${esc(o.competitor.name)}</b> <span class="muted">ranks ${esc(o.competitor.ranks)}</span></p><p class="muted">“${esc(o.competitor.page)}”</p><p>${esc(o.competitor.weakness)}</p></div>
      <div><h4>The page to build</h4><p><b>${esc(p.title)}</b></p><p class="mono slug">${esc(p.slug)}</p>${list(p.outline, "ol", "ol")}</div>
      <div><h4>Proof Kingpost can show</h4>${list(p.proof_we_have, "ul", "pf")}
        <div class="row hand"><button class="btn primary" data-relay="${o.id}" ${busy ? "disabled" : ""}>${mine && !busy ? "Hand it to Clara again" : "Hand this to Clara"}</button></div>
        <div class="s">${busy && !mine ? `Clara's on “${esc(R.opp.query)}” right now. One job at a time.` : "Seren, then Clara, Archie and Maeve. Priya approves. Nothing goes live on its own."}</div></div>
    </div>
    ${mine ? `<div class="det-rl"><h4>The desk-to-desk job ${R.running ? chip("live", "holo") : ""}</h4>${relaySteps(R)}${R.page?.title ? `<div class="row" style="margin-top:12px"><button class="btn sm" data-go="content">Read Clara's page on the Content desk</button></div>` : ""}</div>` : ""}`;
}
function opportunities(F, D, L) {
  const R = F.relay, O = F.seo.opportunities, st = (o) => D.opp_status?.[o.id] || o.status;
  const sel = L.sel === "none" ? null : O.find((o) => o.id === L.sel) || O.find((o) => o.id === R?.opp?.id) || O.find((o) => st(o) === "found") || O[0];
  const rows = O.map((o) => `<tr class="click ${sel?.id === o.id ? "sel" : ""}" data-opp="${o.id}">
      <td class="q"><b>${esc(o.query)}</b><div class="s mono">${esc(o.page_to_build.slug)}</div></td>
      <td class="r num c-n">${num(o.monthly_searches)}</td>
      <td class="c-int">${chip(o.intent)}</td>
      <td class="c-comp"><b>${esc(o.competitor.name)}</b> <span class="muted">ranks ${esc(o.competitor.ranks)}</span><div class="s">${esc(o.competitor.weakness)}</div></td>
      <td class="c-st">${oppChip(o, st(o), R)}</td></tr>${sel?.id === o.id ? `<tr class="det"><td colspan="5">${oppDetail(o, R)}</td></tr>` : ""}`).join("");
  return `<p class="tabl">Searches people in Bristol, Bath and Swindon make where the local pages that come up don't answer the question. Click one to see the page Seren would build.</p>
    <div class="tablewrap"><table class="t opp"><thead><tr><th>What people search</th><th class="r c-n">A month (estimate)</th><th class="c-int">Intent</th><th class="c-comp">Who answers it now, and what's missing</th><th class="c-st">Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ------------------------------------------------------------------ tab 2: her pages and the enquiries they bring (model)
function pages(D, M, L) {
  const P = D.briefed, W = M.weeks, n = W.length, sel = P.find((p) => p.id === L.pg);
  const last4 = (p) => sum(p.enquiries.slice(-4)), lastW = (p) => p.enquiries.at(-1);
  const seo = W.map((w) => w.leads.seo), wl = (i) => short(dayDate(W[i].day_offset));
  const rows = `<div class="list pgl"><div class="li click ${!sel ? "sel" : ""}" data-pg="all"><div><b>All ${P.length} pages</b><div class="s">every enquiry they brought in, week by week</div></div><div class="pr"><span><b class="num">${sum(seo.slice(-4))}</b>last 4 weeks</span></div></div>
    ${P.map((p) => `<div class="li click ${sel?.id === p.id ? "sel" : ""}" data-pg="${p.id}"><div><b>${esc(p.title)}</b><div class="s"><span class="mono">${esc(p.slug)}</span> · live ${p.live_weeks} weeks</div></div>
      <div class="pr"><span><b class="num">${last4(p)}</b>last 4 weeks</span><span><b class="num">${pos(p.position.at(-1))}</b>position</span></div></div>`).join("")}</div>`;
  let right;
  if (!sel) {
    const parts = P.filter((p) => lastW(p)).map((p) => `${lastW(p)}`).join(" + ");
    right = `<div class="kv"><div><b>${seo.at(-1)}</b><span>enquiries, last 7 days</span></div><div><b>${sum(seo.slice(-4))}</b><span>last 4 weeks</span></div><div><b>${sum(seo.slice(-8, -4))}</b><span>the 4 weeks before</span></div></div>
      <div class="working-line">Last 7 days, page by page: ${parts} = ${seo.at(-1)}, the same figure as Home and Numbers</div>
      <div class="chh"><h4>Enquiries from Seren's pages, each week</h4>${chip("Sample data")}</div>${barChart(seo.map((v, i) => ({ l: wl(i), v })), { h: 150, every: 3 })}
      <div class="chh"><h4>By page, last 4 weeks</h4></div>${hbars(P.map((p) => ({ label: esc(p.title), v: last4(p), tip: `${p.title}: ${last4(p)} enquiries` })).sort((a, b) => b.v - a.v))}`;
  } else {
    const k = sel.live_weeks, e = sel.enquiries.slice(-k), pp = sel.position.slice(-k), off = n - k;
    right = `<div class="pgh"><b>${esc(sel.title)}</b><div class="s"><span class="mono">${esc(sel.slug)}</span> · main search “${esc(sel.query)}”</div></div>
      <div class="kv"><div><b>${last4(sel)}</b><span>enquiries, last 4 weeks</span></div><div><b>${pos(pp.at(-1))}</b><span>average position, from ${pos(pp[0])}</span></div><div><b>${k}</b><span>weeks live</span></div></div>
      <div class="chh"><h4>Enquiries each week</h4>${chip("Sample data")}</div>${barChart(e.map((v, i) => ({ l: wl(off + i), v })), { h: 110, every: 2 })}
      <div class="chh"><h4>Average position in Google</h4><span class="s">lower is better</span></div>${lineChart(pp.map((v, i) => ({ l: wl(off + i), v })), { h: 120, invert: true, min: 1, every: 2, fmt: (v) => (Number.isInteger(v) ? String(v) : pos(v)) })}
      <p class="fine">Seren tracks where her pages land. She never promises a position.</p>`;
  }
  return `<div class="bp"><div>${rows}</div><div class="bpr">${right}</div></div>`;
}

// ------------------------------------------------------------------ tab 3: how she works
function how(D, ctx) {
  return `<div class="how2"><div class="rules">${(D.rules || []).map((r, i) => `<div class="rule"><em class="num">0${i + 1}</em><div><b>${esc(r.b)}</b><span>${esc(r.t)}</span></div></div>`).join("")}</div>
    <div class="lg"><h4>${av("seo")}Seren's log today</h4>${ctx.feed("seo", 8)}</div></div>`;
}

// ------------------------------------------------------------------ the page
export default {
  css: `
  .pg-search h4 { margin: 0 0 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); display: flex; align-items: center; gap: 8px; }
  .pg-search h4 .av-s { margin: 0; width: 20px; height: 20px; font-size: 9px; }
  .pg-search .s { font-size: 12.5px; color: var(--ink-3); }
  .pg-search .fine { margin: 12px 0 0; font-size: 12px; color: var(--ink-3); }
  .pg-search .slug { color: var(--holo-2); opacity: .75; font-size: 12px; margin: 0 0 8px; overflow-wrap: anywhere; }
  .pg-search .now { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, .03); font-size: 13px; color: var(--ink-2); max-width: 380px; min-width: 0; }
  .pg-search .now span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pg-search .av-s.pr { background: var(--amber-tint); color: var(--amber-ink); box-shadow: 0 0 0 1px rgba(255, 181, 71, .45); }
  .pg-search .card .ch .r .av-s { margin-right: 4px; }

  /* hero: the map and her three figures */
  .pg-search .hero { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 16px; align-items: stretch; }
  .pg-search .figs { display: grid; grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .pg-search .fig { display: flex; flex-direction: column; justify-content: space-between; gap: 8px; padding: 18px 20px; cursor: default; }
  .pg-search .fig h3 { margin: 0; }
  .pg-search .fr { display: flex; align-items: flex-end; gap: 16px; min-width: 0; }
  .pg-search .fig .big { font-size: 44px; }
  .pg-search .fig .big small { font-size: 20px; margin-left: 4px; color: var(--holo-2); }
  .pg-search .fig.go .big { color: #fff; }
  .pg-search .fig .tr { display: block; flex: 1; min-width: 40px; height: 40px; margin-bottom: 8px; overflow: visible; }
  .pg-search .tr polygon { fill: rgba(70, 200, 255, .1); }
  .pg-search .tr polyline { fill: none; stroke: var(--holo); stroke-width: 1.8; stroke-linejoin: round; filter: drop-shadow(0 0 4px rgba(70, 200, 255, .8)); }
  .pg-search .tr circle { fill: var(--holo-2); filter: drop-shadow(0 0 6px var(--holo)); }
  .pg-search .fig .working-line { margin-top: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .pg-search .mapc { padding: 20px 24px; overflow: hidden; background: radial-gradient(120% 90% at 40% 55%, rgba(30, 110, 170, .16), transparent 70%), var(--glass-fill), var(--noise) var(--glass-tint); }
  .pg-search .mapc .ch { flex-wrap: wrap; }
  .pg-search .msub { margin: 0; font-size: 12.5px; color: var(--ink-3); max-width: 640px; }
  .pg-search .leg { flex-wrap: wrap; gap: 6px !important; }
  .pg-search .leg button { display: inline-flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); color: var(--ink-2); font-size: 12px; cursor: pointer; white-space: nowrap; transition: border-color .15s, background .15s; }
  .pg-search .leg button:hover { border-color: var(--line-2); }
  .pg-search .leg button[aria-pressed="true"] { border-color: rgba(70, 200, 255, .55); background: var(--holo-tint); color: #fff; }
  .pg-search .leg b { font: 500 12px var(--mono); color: var(--ink); }
  .pg-search i.L, .pg-search i.D, .pg-search i.G, .pg-search i.P { width: 10px; height: 10px; border-radius: 3px; flex: none; }
  .pg-search i.L { background: var(--holo); box-shadow: 0 0 8px var(--holo); }
  .pg-search i.D { background: rgba(70, 200, 255, .2); box-shadow: inset 0 0 0 1px rgba(70, 200, 255, .65); }
  .pg-search i.G { background: rgba(255, 181, 71, .08); box-shadow: inset 0 0 0 1px rgba(255, 181, 71, .5); }
  .pg-search i.P { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
  .pg-search .covw { position: relative; margin-top: 4px; }
  .pg-search .cov { position: relative; display: grid; grid-template-columns: 156px repeat(var(--n), minmax(0, 1fr)) 40px; gap: 4px 6px; align-items: center; }
  .pg-search .cov .ah { position: relative; height: 52px; align-self: end; }
  .pg-search .cov .ah span { position: absolute; left: 50%; bottom: 6px; transform-origin: 0 100%; transform: rotate(-38deg); white-space: nowrap; font-size: 11.5px; color: var(--ink-3); transition: color .15s, text-shadow .15s; }
  .pg-search .cov .ah.lv span { font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; transform: none; left: auto; right: 0; }
  .pg-search .cov .sv { font-size: 13px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; transition: color .15s, text-shadow .15s; }
  .pg-search .cov .sv .sn { display: none; }
  .pg-search .cov .hl, .pg-search .cov .hl span { color: var(--holo-2) !important; text-shadow: none; }
  .pg-search .cov .rt { font-size: 13px; color: var(--ink); text-align: right; }
  .pg-search .cov .rt small { font-size: 11px; color: var(--ink-3); }
  .pg-search .cv { position: relative; display: block; width: 100%; height: 26px; padding: 0; border: 0; border-radius: 7px; cursor: pointer; background: transparent; transition: transform .15s, opacity .25s; }
  .pg-search .cv.L { background: linear-gradient(180deg, rgba(70, 200, 255, .9), rgba(70, 200, 255, .55)); box-shadow: inset 0 0 0 1px rgba(166, 230, 255, .8), 0 0 16px -3px var(--holo); }
  .pg-search .cv.D { background: rgba(70, 200, 255, .13); box-shadow: inset 0 0 0 1px rgba(70, 200, 255, .5); }
  .pg-search .cv.G { background: transparent; border: 1px dashed rgba(255, 181, 71, .26); animation: pgs-gap 3.2s ease-in-out var(--p) infinite; }
  .pg-search .cv.G.p { border: 1px solid rgba(255, 181, 71, .75); background: rgba(255, 181, 71, .14); box-shadow: 0 0 14px -4px var(--amber); animation-name: pgs-gapp; }
  .pg-search .cv.p::after { content: ""; position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 8px var(--amber); }
  .pg-search .cv:hover { transform: scale(1.12); z-index: 2; }
  .pg-search .cv.sel { outline: 2px solid var(--ink); outline-offset: 2px; z-index: 2; }
  .pg-search .cv.dim { opacity: .1; animation: none; }
  .pg-search .cv.hit::before { content: ""; position: absolute; inset: -6px; border-radius: 10px; border: 2px solid var(--holo); animation: pgs-ping 1.4s ease-out infinite; pointer-events: none; }
  @keyframes pgs-gap { 50% { background: rgba(255, 181, 71, .06); border-color: rgba(255, 181, 71, .55); } }
  @keyframes pgs-gapp { 50% { background: rgba(255, 181, 71, .3); border-color: var(--amber); box-shadow: 0 0 22px -2px var(--amber); } }
  @keyframes pgs-ping { from { opacity: 1; transform: scale(.9); } to { opacity: 0; transform: scale(1.5); } }
  @keyframes pgs-in { from { opacity: 0; transform: scale(.3); } }
  .pg-search.intro .cv { animation: pgs-in .55s cubic-bezier(.2, .8, .2, 1) var(--d) both; }
  .pg-search.intro .cv.G { animation: pgs-in .55s cubic-bezier(.2, .8, .2, 1) var(--d) both, pgs-gap 3.2s ease-in-out var(--p) infinite; }
  .pg-search.intro .cv.G.p { animation: pgs-in .55s cubic-bezier(.2, .8, .2, 1) var(--d) both, pgs-gapp 3.2s ease-in-out var(--p) infinite; }
  .pg-search .cov .sweep { position: absolute; top: 52px; bottom: 0; left: 0; width: 72px; pointer-events: none; background: linear-gradient(90deg, transparent, rgba(120, 220, 255, .16) 70%, rgba(166, 230, 255, .35) 92%, transparent); animation: pgs-sweep 7s linear var(--ph) infinite; mix-blend-mode: screen; }
  .pg-search .cov.scanning .sweep { animation-duration: 1.6s; background: linear-gradient(90deg, transparent, rgba(120, 220, 255, .25) 70%, rgba(200, 240, 255, .6) 94%, transparent); }
  @keyframes pgs-sweep { from { left: 10%; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } to { left: calc(100% - 72px); opacity: 0; } }
  .pg-search .ro { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 24px; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
  .pg-search .ro-h { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .pg-search .ro-h b { font-size: 16px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-search .ro-h em { font-style: normal; color: var(--holo); margin: 0 4px; }
  .pg-search .ro-s { display: flex; gap: 20px; font-size: 12px; color: var(--ink-3); justify-content: flex-end; flex-wrap: wrap; white-space: nowrap; }
  .pg-search .ro-s b { font: 400 18px var(--mono); color: #fff; margin-right: 6px; text-shadow: none; }
  .pg-search .ro p { grid-column: 1; margin: 0; font-size: 13.5px; color: var(--ink-2); }
  .pg-search .ro .btn { justify-self: end; }
  .pg-search .ro .btn svg, .pg-search .ck-f svg { width: 14px; height: 14px; }
  .pg-search .tg { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 6px; font: 600 12.5px var(--mono); letter-spacing: 0; text-transform: none; white-space: nowrap; flex: none; }
  .pg-search .tg.L { background: var(--holo); color: #021422; box-shadow: 0 0 12px -2px var(--holo); }
  .pg-search .tg.D { background: var(--holo-tint); color: var(--holo-2); box-shadow: inset 0 0 0 1px rgba(70, 200, 255, .5); }
  .pg-search .tg.G { background: var(--amber-tint); color: var(--amber-ink); box-shadow: inset 0 0 0 1px rgba(255, 181, 71, .35); }
  .pg-search .tg.P { background: var(--amber); color: #2a1700; box-shadow: 0 0 12px -2px var(--amber); }

  /* the scanner */
  .pg-search .scn { margin-top: 16px; border-color: rgba(70, 200, 255, .32); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05), 0 0 60px -30px var(--holo-glow); }
  .pg-search .scn.busy { border-color: rgba(70, 200, 255, .6); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05), 0 0 60px -18px var(--holo-glow); }
  .pg-search .ckf { height: 60px; margin-top: 12px; padding-left: 20px; border-radius: 16px; }
  .pg-search .ckf input { font-size: 16px; }
  .pg-search .ckf input:disabled { background: none; opacity: .6; }
  .pg-search .ckf button { height: 44px; padding: 0 22px; font-size: 14px; border-radius: 12px; box-shadow: 0 0 24px -6px var(--holo); }
  .pg-search .ckf button:disabled { opacity: .55; cursor: default; }
  .pg-search .ex { margin-top: 12px; }
  .pg-search .ex .s { margin-right: 4px; }
  .pg-search .ex .chip { cursor: pointer; }
  .pg-search .ex .chip:hover:not(:disabled) { border-color: rgba(70, 200, 255, .5); color: #fff; }
  .pg-search .idle { display: flex; align-items: center; gap: 20px; margin-top: 20px; padding: 16px 20px; border: 1px dashed var(--line-2); border-radius: 14px; }
  .pg-search .idle p { margin: 0; color: var(--ink-2); font-size: 13.5px; max-width: 720px; }
  .pg-search .radar { position: relative; width: 168px; height: 168px; flex: none; border-radius: 50%; overflow: hidden; background: radial-gradient(circle, rgba(70, 200, 255, .1), rgba(70, 200, 255, .02) 70%); box-shadow: 0 0 0 1px rgba(70, 200, 255, .25), 0 0 40px -12px var(--holo-glow); }
  .pg-search .radar.sm { width: 72px; height: 72px; }
  .pg-search .radar svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .pg-search .radar circle { fill: none; stroke: rgba(120, 200, 255, .22); stroke-width: 1; }
  .pg-search .radar path { stroke: rgba(120, 200, 255, .14); stroke-width: 1; }
  .pg-search .radar .blip { fill: var(--holo-2); stroke: none; filter: drop-shadow(0 0 4px var(--holo)); }
  .pg-search .radar .blip.on { fill: #fff; animation: pulse 1s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .pg-search .radar .sw { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg, transparent 280deg, rgba(70, 200, 255, .55) 358deg, rgba(200, 240, 255, .9) 360deg); animation: spin 2.2s linear var(--ph) infinite; }
  .pg-search .radar.sm .sw { animation-duration: 5s; opacity: .7; }
  .pg-search .radar .pct { position: absolute; inset: 0; display: grid; place-content: center; grid-auto-flow: column; align-items: baseline; text-shadow: none; }
  .pg-search .radar .pct b { font: 300 34px var(--mono); color: #fff; }
  .pg-search .radar .pct span { font: 400 14px var(--mono); color: var(--holo-2); }
  .pg-search .ckh { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--line); font-size: 16px; }
  .pg-search .ckh b { font-weight: 600; color: #fff; }
  .pg-search .ckh .live { display: inline-flex; align-items: center; gap: 10px; color: var(--holo-2); font-size: 15px; }
  .pg-search .scv { position: relative; display: grid; grid-template-columns: 168px minmax(0, 1fr); gap: 28px; align-items: start; margin-top: 16px; padding: 20px; border: 1px solid rgba(70, 200, 255, .22); border-radius: 14px; background: rgba(70, 200, 255, .03); overflow: hidden; }
  .pg-search .scv::after { content: ""; position: absolute; left: 0; right: 0; top: -30%; height: 30%; pointer-events: none; background: linear-gradient(180deg, transparent, rgba(70, 200, 255, .09), transparent); animation: pgs-scan 2.4s linear var(--ph) infinite; }
  @keyframes pgs-scan { to { top: 130%; } }
  .pg-search .sll { display: grid; min-width: 0; }
  .pg-search .sl { display: grid; grid-template-columns: 168px minmax(0, 1fr) 16px; gap: 12px; align-items: baseline; padding: 7px 0; border-bottom: 1px dashed rgba(120, 200, 255, .1); font-size: 13.5px; }
  .pg-search .sl:last-child { border-bottom: 0; }
  .pg-search .sl .k { font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); white-space: nowrap; }
  .pg-search .sl .v { color: var(--ink-3); min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pg-search .sl.on .k { color: var(--holo); text-shadow: none; }
  .pg-search .sl.on .v { color: #fff; }
  .pg-search .sl.done .k { color: var(--holo-2); }
  .pg-search .sl.done .v { color: var(--ink-2); }
  .pg-search .sl .ok { width: 14px; height: 14px; color: var(--green); align-self: center; }
  .pg-search .sl .ok svg { width: 14px; height: 14px; display: block; filter: drop-shadow(0 0 4px var(--green)); }
  .pg-search .res { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 16px; font-size: 13.5px; }
  .pg-search .rc { padding: 18px 20px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .02); min-width: 0; }
  .pg-search .rc p { margin: 0 0 14px; color: var(--ink-2); }
  .pg-search .rc .pt { font-size: 16px; font-weight: 600; color: #fff; line-height: 1.35; margin-bottom: 4px; }
  .pg-search ul.miss { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; color: var(--ink-2); }
  .pg-search ul.miss li { position: relative; padding-left: 16px; }
  .pg-search ul.miss li::before { content: ""; position: absolute; left: 0; top: 8px; width: 8px; height: 2px; background: var(--amber); box-shadow: 0 0 6px var(--amber); }
  .pg-search ol.ol { margin: 4px 0 0; padding: 0; list-style: none; counter-reset: o; display: grid; gap: 6px; color: var(--ink-2); }
  .pg-search ol.ol li { counter-increment: o; display: grid; grid-template-columns: 24px minmax(0, 1fr); }
  .pg-search ol.ol li::before { content: counter(o, decimal-leading-zero); font: 400 11.5px var(--mono); color: var(--holo); padding-top: 2px; }
  .pg-search ul.pv { list-style: none; padding: 0; margin: 0 0 4px; display: grid; gap: 8px; }
  .pg-search .pv li { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; color: var(--ink-2); }
  .pg-search .vd { margin-top: 16px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255, 255, 255, .03); }
  .pg-search .vd.green { background: var(--green-tint); border-color: rgba(63, 224, 160, .4); box-shadow: 0 0 28px -14px var(--green); }
  .pg-search .vd.amber { background: var(--amber-tint); border-color: rgba(255, 181, 71, .4); box-shadow: 0 0 28px -14px var(--amber); }
  .pg-search .vd span { font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-search .vd b { display: block; font-size: 19px; font-weight: 600; color: #fff; margin: 4px 0; }
  .pg-search .vd.green b { color: #8ff0c6; }
  .pg-search .vd.amber b { color: var(--amber-ink); }
  .pg-search .vd p { margin: 0; font-size: 13px; color: var(--ink-2); }
  .pg-search .vd p.mono { margin-top: 4px; color: var(--holo-2); }
  .pg-search .maplink { margin-top: 12px; display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, .02); cursor: pointer; font-size: 12.5px; color: var(--ink-2); }
  .pg-search .maplink:hover { border-color: rgba(70, 200, 255, .5); background: var(--holo-tint); }
  .pg-search .ckf2 { display: flex; justify-content: space-between; align-items: center; gap: 12px 24px; flex-wrap: wrap; margin-top: 16px; }
  .pg-search .pastc { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .pg-search .pastc .s { margin-right: 4px; }
  .pg-search .pastc .pc { display: inline-flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); color: var(--ink-2); font-size: 12px; cursor: pointer; max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-search .pastc .pc.sel { border-color: rgba(70, 200, 255, .55); color: #fff; background: var(--holo-tint); }
  .pg-search .pastc .ldot { width: 6px; height: 6px; }

  /* the tabs card */
  .pg-search .tabsc { margin-top: 16px; }
  .pg-search .tabsc > .ch { margin-bottom: 16px; flex-wrap: wrap; }
  .pg-search .tabl { margin: 0 0 12px; font-size: 13px; color: var(--ink-3); }
  .pg-search table.opp td { vertical-align: top; }
  .pg-search table.opp tr.click { cursor: pointer; }
  .pg-search table.opp tr.click:hover td, .pg-search table.opp tr.sel td { background: var(--holo-tint); }
  .pg-search table.opp tr.sel td { border-bottom-color: transparent; }
  .pg-search table.opp td.q b { font-weight: 600; color: #fff; }
  .pg-search table.opp .s { margin-top: 4px; }
  .pg-search table.opp td.q .s { color: var(--holo-2); opacity: .7; }
  .pg-search table.opp td.r { font-size: 14px; color: var(--ink); }
  .pg-search table.opp .c-comp { width: 36%; }
  .pg-search tr.det > td { padding: 0; background: rgba(70, 200, 255, .04); cursor: default; }
  .pg-search tr.det:hover td { background: rgba(70, 200, 255, .04); }
  .pg-search .det-in { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; padding: 12px 20px 20px; font-size: 13.5px; }
  .pg-search .det-in p { margin: 0 0 8px; }
  .pg-search .det-in p + h4 { margin-top: 16px; }
  .pg-search .det-in ul.pf { margin: 4px 0 0; padding-left: 18px; color: var(--ink-2); }
  .pg-search .det-in ul.pf li { margin: 4px 0; }
  .pg-search .det-in .hand { margin-top: 16px; }
  .pg-search .det-in .s { margin-top: 8px; }
  .pg-search .det-rl { padding: 16px 20px 20px; border-top: 1px solid var(--line); }
  .pg-search .rl { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
  .pg-search .rs { display: flex; flex-direction: column; gap: 4px; padding: 12px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); min-width: 0; }
  .pg-search .rs.on { border-color: rgba(70, 200, 255, .55); background: var(--holo-tint); box-shadow: 0 0 24px -12px var(--holo-glow); }
  .pg-search .rs.wait { border-color: rgba(255, 181, 71, .5); background: var(--amber-tint); }
  .pg-search .rs.bad { border-color: rgba(255, 97, 104, .5); background: var(--red-tint); }
  .pg-search .rs .sh { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink); }
  .pg-search .rs .sh .av-s { margin: 0; flex: none; }
  .pg-search .rs .sl2 { display: flex; align-items: center; gap: 8px; min-height: 22px; }
  .pg-search .rs .st { font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-search .rs.on .st { color: var(--holo); }
  .pg-search .rs.wait .st { color: var(--amber-ink); }
  .pg-search .rs.done .st { color: var(--green); }
  .pg-search .rs .s { margin: 0; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

  .pg-search .bp { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 24px; align-items: start; }
  .pg-search .bp .li { align-items: center; }
  .pg-search .bp .li b { font-weight: 600; color: var(--ink); }
  .pg-search .bp .pr { display: grid; justify-items: end; gap: 2px; font-size: 11.5px; color: var(--ink-3); white-space: nowrap; }
  .pg-search .bp .pr b { font: 400 15px var(--mono); color: #fff; margin-right: 6px; }
  .pg-search .bpr .kv { margin-bottom: 4px; }
  .pg-search .pgh { margin-bottom: 12px; }
  .pg-search .pgh b { font-size: 16px; font-weight: 600; color: #fff; display: block; }
  .pg-search .pgh .s { margin-top: 4px; }
  .pg-search .chh { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 20px; }
  .pg-search .chh h4 { margin: 0; }
  .pg-search .bpr .hbars { margin-top: 12px; }
  .pg-search .bpr .hb { grid-template-columns: minmax(120px, 240px) minmax(0, 1fr) auto; }

  .pg-search .how2 { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 24px; align-items: start; }
  .pg-search .rules { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .pg-search .rule { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 8px; padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .02); }
  .pg-search .rule em { font-style: normal; font-size: 13px; color: var(--holo); text-shadow: none; }
  .pg-search .rule b { display: block; font-weight: 600; font-size: 14px; color: #fff; margin-bottom: 4px; }
  .pg-search .rule span { font-size: 13px; color: var(--ink-2); }
  .pg-search .lg { padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .02); }

  /* competitor check: three numbered columns; column 3 is the hero, lit as a holographic band */
  .pg-search .gx { margin-top: 16px; padding: 20px 24px 18px; overflow: hidden; }
  .pg-search .gx-h { flex-wrap: wrap; margin-bottom: 4px !important; }
  .pg-search .gx-ctl { gap: 8px !important; }
  .pg-search .gx-ctl [data-gx-next] span { display: none; }
  .pg-search .gx.st1 [data-gx-next] .l1, .pg-search .gx.st2 [data-gx-next] .l2, .pg-search .gx.st3 [data-gx-next] .l3 { display: inline; }
  .pg-search .gx.st3 [data-gx-next] { background: rgba(255, 255, 255, .03); border-color: var(--line-2); color: var(--ink); font-weight: 500; box-shadow: none; }
  .pg-search .gx.st3 [data-gx-all] { display: none; }
  .pg-search .gx-t { margin: 0; font-size: 22px; font-weight: 600; line-height: 1.25; letter-spacing: -.01em; color: #fff; }
  .pg-search .gx-s { margin: 4px 0 14px; font-size: 13px; color: var(--ink-3); }
  .pg-search .gx-g { position: relative; display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) minmax(0, 1.4fr); column-gap: 10px; }
  .pg-search .gx .c1 { grid-column: 1; } .pg-search .gx .c2 { grid-column: 2; } .pg-search .gx .c3 { grid-column: 3; }
  .pg-search .gxb { position: relative; z-index: 0; border-radius: 14px; pointer-events: none; overflow: hidden; }
  .pg-search .gxb2 { grid-column: 2; }
  .pg-search .gxb3 { grid-column: 3; border: 1px dashed rgba(70, 200, 255, .28); transition: border-color .4s, box-shadow .4s; }
  .pg-search .gxb3::before { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(70, 200, 255, .16), rgba(70, 200, 255, .05) 55%, rgba(70, 200, 255, .09)); opacity: 0; }
  .pg-search .gx.on3 .gxb3 { border-style: solid; border-color: rgba(70, 200, 255, .6); box-shadow: 0 0 48px -14px var(--holo-glow), inset 0 1px 0 rgba(200, 240, 255, .2); }
  .pg-search .gx.on3 .gxb3::before { opacity: 1; }
  .pg-search .gxb::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 72px; opacity: 0; background: linear-gradient(180deg, transparent, rgba(150, 225, 255, .22) 75%, rgba(220, 245, 255, .75) 97%, transparent); }

  .pg-search .gxh { grid-row: 1; position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; min-width: 0; padding: 12px 12px 12px; border: 0; background: none; font: inherit; text-align: left; color: var(--ink-2); cursor: pointer; }
  .pg-search .gxh em { flex: none; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font: 400 15px var(--mono); font-style: normal; color: var(--ink-3); border: 1px solid var(--line-2); transition: color .3s, border-color .3s, background .3s, box-shadow .3s; }
  .pg-search .gxh span { min-width: 0; font-size: 13.5px; font-weight: 600; line-height: 1.25; color: var(--ink-3); transition: color .3s; }
  .pg-search .gxh small { display: block; margin-top: 3px; font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--holo); text-shadow: none; }
  .pg-search .gxh.c1 small { font: 400 11px var(--sans); letter-spacing: 0; text-transform: none; color: var(--ink-3); text-shadow: none; }
  .pg-search .gxh:hover span { color: var(--ink); }
  .pg-search .gxh.c1 em, .pg-search .gx.on2 .gxh.c2 em { color: #fff; border-color: rgba(70, 200, 255, .7); background: var(--holo-tint); box-shadow: 0 0 14px -3px var(--holo); }
  .pg-search .gxh.c1 span, .pg-search .gx.on2 .gxh.c2 span, .pg-search .gx.on3 .gxh.c3 span { color: #fff; }
  .pg-search .gx.on3 .gxh.c3 em { color: #021422; border-color: var(--holo); background: var(--holo); box-shadow: 0 0 22px -2px var(--holo); }

  .pg-search .gxc { position: relative; z-index: 1; min-width: 0; padding: 10px 12px; border-top: 1px solid var(--line); }
  .pg-search .gxc.c3 { border-top-color: rgba(70, 200, 255, .16); }
  .pg-search .gxc.c1 { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 12px; align-content: center; align-items: center; transition: opacity .4s; }
  .pg-search .gxq { font-size: 14px; font-weight: 600; line-height: 1.3; color: #fff; }
  .pg-search .gxw { grid-column: 1 / -1; display: flex; gap: 6px; align-items: baseline; min-width: 0; font-size: 12px; color: var(--ink-3); }
  .pg-search .gxw span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pg-search .gxw b { flex: none; font: 500 11.5px var(--mono); color: var(--ink-2); }
  .pg-search .gxn { grid-column: 2; grid-row: 1; align-self: start; display: flex; align-items: baseline; justify-content: flex-end; gap: 6px; white-space: nowrap; }
  .pg-search .gxn b { font: 300 19px/1.1 var(--mono); color: #fff; text-shadow: none; }
  .pg-search .gxn span { font-size: 11px; color: var(--ink-3); }
  .pg-search .gxc.c1.win::before { content: ""; position: absolute; left: -4px; top: 12px; bottom: 12px; width: 2px; border-radius: 2px; background: var(--holo); box-shadow: 0 0 8px var(--holo); opacity: 0; }
  .pg-search .gx.on3 .gxc.c1.win::before { opacity: 1; }
  .pg-search .gxc.c2 { display: flex; align-items: center; transition: opacity .4s; }
  .pg-search .gxc.c2 .gxv { font-size: 12.5px; line-height: 1.5; color: var(--ink-2); }
  .pg-search .gxc.c2 .chip { display: flex; width: max-content; height: 22px; margin: 0 0 4px; font-weight: 600; }
  .pg-search .gxc.c3 { display: flex; align-items: center; }
  .pg-search .gxc.c3 .gxv { flex: 1; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "a d" "y y"; gap: 3px 10px; align-items: center; }
  .pg-search .gxa { grid-area: a; display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pg-search .gxc.c3 .gxy { grid-area: y; }
  .pg-search .gxd { grid-area: d; }
  .pg-search .gxa b { font-size: 15px; font-weight: 600; color: #fff; white-space: nowrap; }
  .pg-search .gxp { display: inline-flex; gap: 3px; }
  .pg-search .gxp i { width: 10px; height: 4px; border-radius: 2px; background: rgba(120, 200, 255, .16); }
  .pg-search .gxp i.f { background: var(--ink-2); }
  .pg-search .gxy { margin-top: 2px; font-size: 12.5px; line-height: 1.4; color: var(--ink-2); }
  .pg-search .gxd { display: inline-flex; align-items: center; gap: 7px; height: 26px; padding: 0 11px; border-radius: 999px; font: 600 12.5px var(--mono); letter-spacing: 0; text-transform: none; white-space: nowrap; }
  .pg-search .gxd.win { color: #dff6ff; background: rgba(70, 200, 255, .18); border: 1px solid rgba(70, 200, 255, .75); box-shadow: 0 0 18px -4px var(--holo); }
  .pg-search .gxd.win i { width: 6px; height: 6px; border-radius: 50%; background: var(--holo-2); box-shadow: 0 0 8px var(--holo); }
  .pg-search .gxd.no { color: var(--ink-3); border: 1px dashed var(--line-2); }
  .pg-search .gx.on3 .gxc.no.c1, .pg-search .gx.on3 .gxc.no.c2 { opacity: .42; }

  /* hidden columns: the values wait invisibly (so nothing jumps) behind a faint shimmering bar */
  .pg-search .gxc.c2 .gxv, .pg-search .gxc.c3 .gxv, .pg-search .gxd { opacity: 0; visibility: hidden; }
  .pg-search .gx.on2 .gxc.c2 .gxv, .pg-search .gx.on3 .gxc.c3 .gxv, .pg-search .gx.on3 .gxd { opacity: 1; visibility: visible; }
  .pg-search .gxc.c2::after, .pg-search .gxc.c3::after { content: ""; position: absolute; left: 12px; top: 50%; width: calc(var(--gw, 60%) - 12px); height: 8px; margin-top: -4px; border-radius: 4px; background: linear-gradient(90deg, rgba(120, 200, 255, .05), rgba(120, 200, 255, .16), rgba(120, 200, 255, .05)); background-size: 200% 100%; animation: sh 2.6s linear infinite; }
  .pg-search .gx.on2 .gxc.c2::after, .pg-search .gx.on3 .gxc.c3::after { display: none; }

  /* the reveal: a scan line runs down the column, then each row wipes in; column 3 lights up and the verdicts pop */
  @keyframes gx-in { from { opacity: 0; transform: translateY(6px); clip-path: inset(0 100% 0 0); } 50% { opacity: 1; } to { opacity: 1; transform: none; clip-path: inset(0 0 0 0); } }
  @keyframes gx-pop { from { opacity: 0; transform: scale(.4); } 70% { opacity: 1; transform: scale(1.08); } to { opacity: 1; transform: none; } }
  @keyframes gx-ping { from { box-shadow: 0 0 0 0 rgba(70, 200, 255, .8), 0 0 18px -4px var(--holo); } to { box-shadow: 0 0 0 12px rgba(70, 200, 255, 0), 0 0 18px -4px var(--holo); } }
  @keyframes gx-scan { 0% { top: -72px; opacity: 1; } 85% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
  @keyframes gx-band { from { border-color: rgba(70, 200, 255, .28); box-shadow: none; } }
  @keyframes gx-fade { from { opacity: 0; } }
  @keyframes gx-dim { from { opacity: 1; } }
  @keyframes gx-num { 40% { transform: scale(1.25); } }
  .pg-search .gx.an2 .gxb2::after { animation: gx-scan 1s cubic-bezier(.45, 0, .55, 1) calc(0ms - var(--el, 0ms)) both; }
  .pg-search .gx.an2 .gxh.c2 em { animation: gx-num .5s ease calc(0ms - var(--el, 0ms)) both; }
  .pg-search .gx.an2 .gxc.c2 .gxv { animation: gx-in .6s cubic-bezier(.2, .8, .2, 1) calc(var(--i) * 85ms + 120ms - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxb3 { animation: gx-band .8s ease-out calc(var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxb3::before { animation: gx-fade .8s ease-out calc(var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxb3::after { animation: gx-scan 1.1s cubic-bezier(.45, 0, .55, 1) calc(var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxh.c3 em { animation: gx-num .5s ease calc(var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxc.c3 .gxv { animation: gx-in .6s cubic-bezier(.2, .8, .2, 1) calc(var(--i) * 95ms + 160ms + var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxd { animation: gx-pop .5s cubic-bezier(.2, .8, .2, 1) calc(var(--i) * 95ms + 560ms + var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxd.win { animation: gx-pop .5s cubic-bezier(.2, .8, .2, 1) calc(var(--i) * 95ms + 560ms + var(--o3, 0ms) - var(--el, 0ms)) both, gx-ping 1.1s ease-out calc(var(--i) * 95ms + 900ms + var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxc.no.c1, .pg-search .gx.an3 .gxc.no.c2 { animation: gx-dim .6s ease calc(1500ms + var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxc.c1.win::before { animation: gx-fade .5s ease calc(var(--i) * 95ms + 700ms + var(--o3, 0ms) - var(--el, 0ms)) both; }
  .pg-search .gx.an3 .gxf .f3 { animation: gx-fade .6s ease calc(1500ms + var(--o3, 0ms) - var(--el, 0ms)) both; }

  .pg-search .gxf { display: grid; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
  .pg-search .gxf > div { grid-area: 1 / 1; align-self: center; font-size: 12.5px; color: var(--ink-3); }
  .pg-search .gxf .f3 { display: flex; align-items: center; gap: 12px; opacity: 0; visibility: hidden; }
  .pg-search .gx.on3 .gxf .f1 { opacity: 0; visibility: hidden; }
  .pg-search .gx.on3 .gxf .f3 { opacity: 1; visibility: visible; }
  .pg-search .gxf .f3 b { font: 300 30px/1 var(--mono); color: #fff; text-shadow: none; }
  .pg-search .gxf .f3 em { font-style: normal; font-weight: 600; color: var(--holo-2); }

  @container (max-width: 760px) {
    .pg-search .gx { padding: 18px 18px 16px; }
    .pg-search .gx-t { font-size: 19px; }
    .pg-search .gx-s { margin-bottom: 10px; }
    .pg-search .gx-g { grid-template-columns: minmax(0, 1.5fr) minmax(0, .95fr) minmax(0, 1.35fr); column-gap: 8px; }
    .pg-search .gxh { padding: 8px 10px 10px; gap: 8px; }
    .pg-search .gxh em { width: 26px; height: 26px; font-size: 13px; }
    .pg-search .gxh span { font-size: 12.5px; }
    .pg-search .gxc { padding: 8px 10px; }
    .pg-search .gxq { font-size: 13px; }
    .pg-search .gxn b { font-size: 16px; }
    .pg-search .gxn span { display: none; }
    .pg-search .gxc.c2 .gxv, .pg-search .gxy { font-size: 12px; }
    .pg-search .gxc.c2 .chip { display: inline-flex; margin: 0 8px 0 0; vertical-align: 1px; }
    .pg-search .gxa b { font-size: 14px; }
    .pg-search .gxp { display: none; }
    .pg-search .gxd { height: 24px; padding: 0 9px; font-size: 10px; letter-spacing: .08em; }
    .pg-search .gxf { margin-top: 10px; padding-top: 10px; }
    .pg-search .gxf .f3 b { font-size: 24px; }
  }
  @container (max-width: 560px) {
    .pg-search .gx { padding: 16px 14px 14px; }
    .pg-search .gx-t { font-size: 17px; }
    .pg-search .gx-s { display: none; }
    .pg-search .gx-t { margin-bottom: 10px; }
    .pg-search .gx-g { grid-template-columns: minmax(0, 1.15fr) minmax(0, .8fr) minmax(0, 1.3fr); column-gap: 6px; }
    .pg-search .gxh { align-items: flex-start; gap: 6px; padding: 8px 8px 10px; }
    .pg-search .gxh em { width: 22px; height: 22px; font-size: 12px; }
    .pg-search .gxh span { font-size: 12px; }
    .pg-search .gxh small { font-size: 9px; letter-spacing: .08em; }
    .pg-search .gxc { padding: 8px; }
    .pg-search .gxc.c1 { display: block; }
    .pg-search .gxq { font-size: 12.5px; }
    .pg-search .gxw { display: block; margin-top: 2px; font-size: 11px; line-height: 1.4; }
    .pg-search .gxw span { white-space: normal; }
    .pg-search .gxw b { margin-left: 4px; font-size: 10.5px; }
    .pg-search .gxn { margin-top: 4px; justify-content: flex-start; gap: 5px; }
    .pg-search .gxn b { font-size: 14px; }
    .pg-search .gxn span { display: inline; font-size: 10.5px; }
    .pg-search .gxc.c2 .gxv { font-size: 11px; line-height: 1.4; }
    .pg-search .gxc.c2 .chip { display: flex; width: max-content; margin: 0 0 4px; }
    .pg-search .gxc.c3 .gxv { grid-template-columns: minmax(0, 1fr); grid-template-areas: "a" "y" "d"; gap: 3px; }
    .pg-search .gxa b { font-size: 13px; white-space: normal; }
    .pg-search .gxy { font-size: 11px; }
    .pg-search .gxd { justify-self: start; height: 22px; padding: 0 8px; font-size: 9.5px; gap: 5px; }
    .pg-search .gxf .f3 { gap: 10px; }
    .pg-search .gxf .f3 b { font-size: 24px; }
    .pg-search .gxf > div { font-size: 11.5px; }
  }

  @container (max-width: 1060px) {
    .pg-search .res { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pg-search .res .rc:nth-child(3) { grid-column: 1 / -1; }
    .pg-search .rl { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .pg-search .det-in { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pg-search .det-in > div:nth-child(3) { grid-column: 1 / -1; }
  }
  @container (max-width: 960px) {
    .pg-search .hero { grid-template-columns: minmax(0, 1fr); }
    .pg-search .figs { grid-template-rows: none; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .pg-search .fig .big { font-size: 34px; }
    .pg-search .bp, .pg-search .how2 { grid-template-columns: minmax(0, 1fr); }
    .pg-search table.opp .c-int { display: none; }
  }
  @container (max-width: 760px) {
    .pg-search .mapc { padding: 16px; }
    .pg-search .cov { grid-template-columns: 104px repeat(var(--n), minmax(0, 1fr)) 30px; gap: 4px; }
    .pg-search .cov .sv { font-size: 12px; }
    .pg-search .cov .sv .ln { display: none; }
    .pg-search .cov .sv .sn { display: inline; }
    .pg-search .cov .ah span { transform: rotate(-52deg); font-size: 11px; }
    .pg-search .cov .ah { height: 64px; }
    .pg-search .cov .sweep { top: 64px; }
    .pg-search .cv { height: 26px; border-radius: 6px; }
    .pg-search .ro { grid-template-columns: minmax(0, 1fr); }
    .pg-search .ro-s { justify-content: flex-start; }
    .pg-search .ro .btn { justify-self: start; }
    .pg-search .fig { padding: 14px 16px; }
    .pg-search .fig .working-line { display: none; }
    .pg-search .scv { grid-template-columns: 120px minmax(0, 1fr); gap: 20px; padding: 16px; }
    .pg-search .scv .radar { width: 120px; height: 120px; }
    .pg-search .scv .radar .pct b { font-size: 26px; }
    .pg-search .sl { grid-template-columns: minmax(0, 1fr) 16px; gap: 2px 12px; }
    .pg-search .sl .k { grid-column: 1 / -1; }
    .pg-search .rl { grid-template-columns: minmax(0, 1fr); }
    .pg-search table.opp .c-comp { display: none; }
    .pg-search .rules { grid-template-columns: minmax(0, 1fr); }
  }
  @container (max-width: 560px) {
    .pg-search .cov { grid-template-columns: 84px repeat(var(--n), minmax(0, 1fr)) 22px; gap: 3px; }
    .pg-search .ro-h { flex-wrap: wrap; gap: 8px; }
    .pg-search .ro-h b { white-space: normal; }
    .pg-search .cov .sv { font-size: 11px; padding-right: 2px; }
    .pg-search .cov .ah span { transform: rotate(-64deg); font-size: 10.5px; }
    .pg-search .cov .ah { height: 66px; }
    .pg-search .cov .sweep { top: 66px; }
    .pg-search .cov .rt small { display: none; }
    .pg-search .cv { height: 22px; border-radius: 5px; }
    .pg-search .mapc .ch { gap: 8px; }
    .pg-search .msub { font-size: 12px; }
    .pg-search .figs { gap: 8px; }
    .pg-search .fig { padding: 12px; }
    .pg-search .fig h3 { font-size: 9.5px; letter-spacing: .1em; min-height: 26px; }
    .pg-search .fig .big { font-size: 28px; }
    .pg-search .fig .tr { display: none; }
    .pg-search .res { grid-template-columns: minmax(0, 1fr); }
    .pg-search .det-in { grid-template-columns: minmax(0, 1fr); }
    .pg-search .scv { grid-template-columns: minmax(0, 1fr); justify-items: center; }
    .pg-search .scv .sll { width: 100%; }
    .pg-search .idle { flex-direction: column; align-items: flex-start; }
    .pg-search .ckf { height: 54px; padding-left: 14px; }
    .pg-search .ckf input { font-size: 14px; }
    .pg-search .ckf button { padding: 0 14px; }
    .pg-search .now { display: none; }
    .pg-search table.opp .c-n { display: none; }
  }`,

  render(host, ctx) {
    const F = ctx.F, D = ctx.data, L = ctx.local, M = ctx.model;
    if (!D.services || !M) { host.innerHTML = `<div class="inner pg-search">${head({ title: "Search", agent: "seo" })}${note("Seren's sample data didn't load (data/floor/pages/search.json).", "red")}</div>`; return; }
    const intro = !seen; seen = true;
    const runs = ctx.acts.checks || [], checking = runs.find((r) => r.running), cur = runs.find((r) => r.id === L.ck) || runs[0];
    const st = checking ? { busy: true, text: `Checking “${checking.input}”` } : ctx.status("seo");
    // when a check finishes and names a service and area, light that square on the map
    let hit = null;
    if (cur && !cur.running && cur.result) { const m = mapped(D, cur.result); if (m) { if (L.hitFor !== cur.id) { L.hitFor = cur.id; L.cell = m; } if (L.cell === m) hit = m; } }
    const tab = L.tab || "opps", O = F.seo.opportunities;

    host.innerHTML = `<div class="inner pg-search ${intro ? "intro" : ""}">
      ${head({ title: "Search", agent: "seo",
        lede: "Seren finds the searches people in Bristol, Bath and Swindon make that no local firm answers well, then briefs a page Kingpost can back up with real proof. She never promises rankings.",
        actions: `<span class="now"><i class="ldot ${st.busy ? "busy" : ""}"></i><span class="${st.busy ? "shimmer" : ""}">${esc(st.text)}</span></span><button class="btn" data-desk>Seren's desk</button>` })}
      <section class="hero">
        ${coverage(D, L, M, !!checking, hit)}
        ${figures(M)}
      </section>
      ${rankCheck(D)}
      ${checker(D, ctx, L)}
      <section class="card tabsc" id="sr-tabs">
        <div class="ch">${seg([["opps", `Searches nobody serves well · ${O.length}`], ["pages", `Her pages and enquiries · ${D.briefed.length}`], ["how", "How she works"]], tab, "tab")}<span class="r">${tab === "opps" ? "click a search for the page she'd build" : tab === "pages" ? "enquiries agree with Home and Numbers" : `${av("seo")}live`}</span></div>
        ${tab === "opps" ? opportunities(F, D, L) : tab === "pages" ? pages(D, M, L) : how(D, ctx)}
      </section>
      ${foot()}</div>`;

    // wiring
    const redraw = () => ctx.redraw();
    $("[data-desk]", host)?.addEventListener("click", () => ctx.openAgent("seo"));
    const input = $("#ck-in", host);
    if (input) input.oninput = () => (L.q = input.value);
    const reveal = () => { const r = $("#ck-card", host)?.getBoundingClientRect(), H = host.clientHeight; if (r && (r.top < 0 || r.top > H * 0.42)) host.scrollTo({ top: host.scrollTop + r.top - 24, behavior: "smooth" }); };
    const check = async (text) => {
      text = String(text || "").trim(); if (!text) { input?.focus(); return; }
      L.q = ""; input?.blur();
      const r = await ctx.act("check", { text }).catch((e) => { ctx.flash(e.message); return null; });
      if (r) L.ck = r.id;
      await redraw();
      reveal();
    };
    $("#ck-f", host)?.addEventListener("submit", (e) => { e.preventDefault(); check(input.value); });
    $$("[data-try]", host).forEach((b) => (b.onclick = () => check(b.dataset.try)));
    $$("[data-ck]", host).forEach((b) => (b.onclick = () => { L.ck = b.dataset.ck; redraw(); }));
    $$("[data-tab]", host).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; redraw(); }));
    $$("tr[data-opp]", host).forEach((tr) => (tr.onclick = () => { const id = tr.dataset.opp, open = $("tr.sel", host)?.dataset.opp; L.sel = open === id ? "none" : id; redraw(); }));
    $$("[data-relay]", host).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); L.sel = b.dataset.relay; b.disabled = true; ctx.startRelay(b.dataset.relay); }));
    $$("[data-go]", host).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); ctx.go(b.dataset.go); }));
    $$("[data-cell]", host).forEach((b) => (b.onclick = async () => {
      L.cell = b.dataset.cell;
      if (b.dataset.jump) { L.covF = "all"; await redraw(); $(".mapc", host)?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      redraw();
    }));
    $$("[data-cf]", host).forEach((b) => (b.onclick = () => { L.covF = L.covF === b.dataset.cf ? "all" : b.dataset.cf; redraw(); }));
    $$("[data-pg]", host).forEach((b) => (b.onclick = () => { L.pg = b.dataset.pg === "all" ? null : b.dataset.pg; redraw(); }));
    // competitor check: reveal the columns without redrawing the page
    const gxc = $("#sr-gx", host);
    if (gxc) {
      $$("[data-gx]", gxc).forEach((b) => (b.onclick = () => gxStep(gxc, +b.dataset.gx)));
      $("[data-gx-next]", gxc).onclick = () => gxStep(gxc, gx.step >= 3 ? 1 : gx.step + 1);
      $("[data-gx-all]", gxc).onclick = () => gxStep(gxc, 3);
    }
    // crosshair: light the row and column of the square under the pointer
    const grid = $(".cov", host);
    if (grid) grid.addEventListener("mouseover", (e) => {
      const c = e.target.closest(".cv"); $$(".hl", grid).forEach((x) => x.classList.remove("hl"));
      if (!c) return;
      $(`.sv[data-r="${c.dataset.r}"]`, grid)?.classList.add("hl"); $(`.ah[data-c="${c.dataset.c}"]`, grid)?.classList.add("hl");
    });
    grid?.addEventListener("mouseleave", () => $$(".hl", grid).forEach((x) => x.classList.remove("hl")));
  },

  onEvent(ev) {
    if (ev.demo !== "floor") return false;
    if (ev.type === "act") return ev.page === "search";
    if (ev.type === "log") return ev.line?.agent === "seo";
    return ev.type === "relay";
  },
  leave() { seen = false; gx.step = 1; gx.cols = []; gx.at = 0; },
};
