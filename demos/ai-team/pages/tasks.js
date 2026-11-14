// Task board: Maeve's desk (video 8). Mission control for the AI team: what's to do, in hand, being checked and done,
// a goal box that turns into tasks live, and the moment she stops an agent going off task.
// "Waiting on a person" is the one shared list (model.needs, plus the same live drafts Home adds), so the counts match.
import { esc, money, num, av, chip, head, seg, ring, barChart, hbars, working, empty, foot, dayDate, short, $, $$, BY_ID, AGENTS } from "../ui.js";

const COLS = [["queued", "To do"], ["doing", "Doing"], ["review", "To check"], ["done", "Done"]];
const TONE = { queued: "rgba(120, 200, 255, .32)", doing: "#46c8ff", review: "#a6e6ff", done: "#3fe0a0" };
const PRI = { urgent: 0, high: 1, normal: 2 };
const PEOPLE = ["Priya", "Kieran", "Tom"];
const plural = (n, w, s = "s") => `${n} ${w}${n === 1 ? "" : s}`;
const day = (off) => dayDate(off).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const waitTxt = (mins) => (mins < 60 ? `${Math.max(1, Math.round(mins))} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.floor(mins / 1440)} d${Math.round((mins % 1440) / 60) ? ` ${Math.round((mins % 1440) / 60)} h` : ""}`);
const STAGES = [["drift", "Goes off brief"], ["checking", "Maeve checks"], ["paused", "Stopped"], ["redoing", "Redone"], ["rechecking", "Checked again"], ["done", "Back on task"]];
const ICON = {
  goal: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="7"/><circle cx="9" cy="9" r="3.6"/><circle cx="9" cy="9" r=".8" fill="currentColor"/></svg>`,
  shield: `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M13 2.5 4 6v6.5c0 5.4 3.8 9.6 9 11 5.2-1.4 9-5.6 9-11V6z"/></svg>`,
  stop: `<path d="M10 10l6 6M16 10l-6 6" stroke-linecap="round"/>`,
  ok: `<path d="M9 13.2l2.8 2.8 5.4-5.6" stroke-linecap="round"/>`,
  eye: `<circle cx="13" cy="13" r="2.6"/><path d="M7.5 13c1.4-2.3 3.3-3.4 5.5-3.4s4.1 1.1 5.5 3.4c-1.4 2.3-3.3 3.4-5.5 3.4S8.9 15.3 7.5 13z"/>`,
  play: `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3.5 2.2v9.6L11.5 7z"/></svg>`,
};

// ------------------------------------------------------------------ the numbers
function allTasks(ctx) {
  return [...(ctx.F.manager?.tasks || []), ...(ctx.data.extra_tasks || []), ...(ctx.F.tasks || []).map((t) => ({ ...t, live: true }))];
}
// exactly the list Home shows under "Needs you" (the shared model.needs, plus live drafts waiting for a yes)
function needsList(ctx) {
  const live = [];
  for (const r of ctx.F.acts?.ads?.runs || []) if (!r.running && r.result) live.push({ who: "Kieran", agent: "ads", what: "Say yes to Archie's new test ads", detail: r.service || r.input || "Three ads and a test plan", mins: Math.max(1, Math.round((Date.now() - r.at) / 60000)), page: "ads", fresh: true });
  for (const w of ctx.F.acts?.content?.writes || []) if (!w.running && w.result) live.push({ who: "Priya", agent: "content", what: "Approve Clara's new draft", detail: w.result.title || w.topic || "", mins: Math.max(1, Math.round((Date.now() - w.at) / 60000)), page: "content", fresh: true });
  return [...live, ...ctx.model.needs];
}
function dueOf(t) {
  const off = t.due_day_offset ?? 0;
  if (t.status === "done") return { text: off === 0 ? "Done today" : off === -1 ? "Done yesterday" : `Done ${day(off).split(" ")[0]}`, late: false };
  if (off < 0) return { text: `${plural(-off, "day")} late`, late: true };
  return { text: off === 0 ? "Due today" : off === 1 ? "Due tomorrow" : `Due ${day(off)}`, late: false };
}
const priChip = (p) => (p === "urgent" ? chip("Urgent", "red") : p === "high" ? chip("High", "holo") : "");

function taskCard(t, all, notes, open) {
  const a = BY_ID[t.agent] || { name: t.agent }, d = dueOf(t), n = notes[t.id] || {};
  const why = t.why || n.why, check = t.check || n.check;
  const dep = t.depends_on && all.find((x) => x.id === t.depends_on);
  const waits = dep && dep.status !== "done" ? `Waits on ${BY_ID[dep.agent]?.name || "another task"}` : "";
  return `<div class="tk ${t.live ? "new" : ""} ${open ? "open" : ""}" data-tk="${esc(t.id)}" role="button" tabindex="0" aria-expanded="${open}">
    <div class="tk-h">${av(t.agent)}<span>${esc(a.name)}</span>${priChip(t.priority)}</div>
    <div class="tk-t">${esc(t.title)}</div>
    <div class="tk-m"><span class="${d.late ? "late" : ""}">${esc(d.text)}</span>${waits ? `<span>${esc(waits)}</span>` : ""}${t.needs_approval && t.status !== "done" ? `<span class="ap">Needs ${esc(t.needs_approval)}</span>` : ""}${t.live ? `<span class="nw">New today</span>` : ""}</div>
    ${open ? `<div class="tk-x">${why ? `<div><b>Why</b>${esc(why)}</div>` : ""}${check ? `<div><b>Maeve checks</b>${esc(check)}</div>` : ""}${dep ? `<div><b>After</b>${esc(BY_ID[dep.agent]?.name)}: ${esc(dep.title)} (${esc(COLS.find((c) => c[0] === dep.status)?.[1] || dep.status)})</div>` : ""}${t.goal ? `<div><b>For the goal</b>${esc(t.goal)}</div>` : ""}${!why && !check && !dep && !t.goal ? `<div class="muted">A routine task. Maeve checks it against ${esc(a.name)}'s brief before it counts as done.</div>` : ""}</div>` : ""}
  </div>`;
}

// ------------------------------------------------------------------ Maeve's plan for a goal (live)
function planInner(run) {
  const P = run.result || run.partial || {}, list = (Array.isArray(P.tasks) ? P.tasks : []).filter((t) => t && typeof t === "object");
  const status = run.running ? `<span class="pl-live"><i class="ldot busy"></i><span class="shimmer">Maeve's planning…</span></span>` : run.error ? chip("Didn't work", "red") : chip(`${plural(run.added?.length || 0, "task")} added to the board`, "green");
  if (run.error) return `<div class="pl-h"><div><span class="lbl">Goal</span><h2>${esc(run.goal)}</h2></div><div>${status}</div></div><div class="note red" style="margin-top:12px">${esc(run.error)}</div>`;
  const rows = list.map((t, i) => {
    const a = BY_ID[t.agent], typing = run.running && i === list.length - 1;
    const due = Number.isFinite(t.due_in_days) ? (t.due_in_days === 0 ? "Today" : t.due_in_days === 1 ? "Tomorrow" : day(t.due_in_days)) : "…";
    return `<div class="pl-row ${typing ? "typing" : ""}" style="animation-delay:${run.running ? 0 : i * 70}ms"><span class="n num">${String(i + 1).padStart(2, "0")}</span>
      <div class="pl-who">${a ? `${av(t.agent)}<div><b>${esc(a.name)}</b><span>${esc(a.role)}</span></div>` : `<span class="shimmer">…</span>`}</div>
      <div class="pl-t"><div class="tt">${esc(t.title || "")}${typing && !t.why ? `<span class="caret"></span>` : ""}</div>${t.why ? `<div class="s">${esc(t.why)}</div>` : ""}</div>
      <div class="pl-c"><span class="lbl">Maeve checks</span><div class="s2">${esc(t.check || "…")}</div></div>
      <div class="pl-d"><span class="lbl">Due</span><div class="num">${esc(due)}</div>${t.needs_approval ? `<div class="ap">Needs ${esc(t.needs_approval)}</div>` : ""}${t.priority && t.priority !== "normal" ? `<div style="margin-top:6px">${priChip(t.priority)}</div>` : ""}</div></div>`;
  }).join("");
  return `<div class="pl-h"><div><span class="lbl">Goal</span><h2>${esc(P.goal || run.goal)}</h2></div><div>${status}</div></div>
    ${P.approach ? `<p class="appr">${esc(P.approach)}</p>` : ""}
    <div class="pl-list">${rows || `<div class="pl-row"><span class="n num">01</span><div class="pl-t"><span class="shimmer">Working out who does what…</span></div></div>`}</div>
    ${P.measure ? `<div class="msr"><span class="lbl">The number Maeve will watch</span>${esc(P.measure)}</div>` : ""}
    ${!run.running && run.added?.length ? `<div class="row" style="margin-top:12px"><button class="btn sm" data-toboard>See them on the board</button></div>` : ""}`;
}

// ------------------------------------------------------------------ Maeve catching an off-task agent (live)
function alertState(X) {
  if (!X) return { tone: "idle", k: "Off-task watch", h: "Archie runs the boiler ads inside a brief.", p: "Same-day boiler repair, BS postcodes only, £40 a day. Press play and he goes off it. Maeve has to catch it before it costs money or misleads anyone.", icon: ICON.eye };
  const W = X.work || {};
  if (X.stage === "drift") return { tone: "warn", k: "Live · Archie changed a campaign", h: "Archie's just gone off his brief.", p: W.why ? `His idea: “${W.why}”.` : "He's changed a live campaign.", icon: ICON.eye };
  if (X.stage === "checking") return { tone: "scan", k: "Live · Maeve is checking", h: "Maeve's checking it against his brief…", p: "Spend, wording, searches and postcodes, line by line.", icon: ICON.eye };
  if (X.stage === "paused") return { tone: "red", k: "Stopped · off task", h: "Stopped. Archie went off task.", p: X.check?.problems?.[0] || X.check?.summary || "", icon: ICON.stop };
  if (X.stage === "redoing") return { tone: "red", k: "Stopped · being redone", h: "Archie's redoing it inside the brief.", p: X.check?.instruction ? `Maeve told him: ${X.check.instruction}` : "", icon: ICON.stop };
  if (X.stage === "rechecking") return { tone: "scan", k: "Live · checking the redo", h: "Maeve's checking the redo…", p: X.redo ? `“${X.redo.headline}”, cap £${num(X.redo.daily_cap_gbp)} a day.` : "", icon: ICON.eye };
  if (X.check?.on_task) return { tone: "green", k: "Checked · on task", h: "On task. Nothing to stop.", p: X.check.summary || "", icon: ICON.ok };
  if (X.recheck && !X.recheck.on_task) return { tone: "red", k: "Still not right", h: "Still not right. Paused until Priya looks.", p: X.recheck.summary || "", icon: ICON.stop };
  if (X.recheck?.on_task) return { tone: "green", k: "Back on task", h: "Back on task. Caught before it cost a penny.", p: X.recheck.summary || "", icon: ICON.ok };
  return { tone: "idle", k: "Off-task watch", h: "That run didn't finish.", p: "Run it again.", icon: ICON.eye };
}
function alertCard(X, ctx, catches7) {
  const S = alertState(X), W = X?.work || {}, R = X?.redo, C = X?.check, idx = X ? STAGES.findIndex((s) => s[0] === X.stage) : -1;
  const skipped = C?.on_task, stopped = C && !C.on_task;
  const node = (k, i) => {
    if (!X || (skipped && ["paused", "redoing", "rechecking"].includes(k))) return "";
    const doneAll = X.stage === "done" && !X.running;
    if (doneAll || i < idx) return k === "paused" ? "done bad" : k === "done" && S.tone === "green" ? "done good" : "done";
    return i === idx ? (k === "paused" || k === "redoing" ? "on bad" : "on") : "";
  };
  const track = `<div class="al-track">${STAGES.map(([k, l], i) => `<div class="${node(k, i)}"><i></i><b>${l}</b></div>`).join("")}</div>`;
  const btn = `<button class="btn ${X ? "" : "primary"} al-go" data-drift ${X?.running ? "disabled" : ""}>${X?.running ? `<span class="shimmer">Running live…</span>` : `${ICON.play}${X ? "Run it again" : "Watch Maeve catch an off-task agent"}`}</button>`;
  let body;
  if (!X) {
    body = `<div class="al-intro">
      <div class="al-brief2"><span class="lbl">Archie's brief</span><div class="row">${["Boiler repair, same day", "BS postcodes only", "£40 a day cap", "Claims on the proof list only", "New campaigns need Kieran"].map((x) => `<span class="bchip">${esc(x)}</span>`).join("")}</div></div>
      <div class="al-stat"><b class="num">${catches7}</b><span>caught off task in the last 7 days, all stopped before they cost anything</span></div></div>`;
  } else {
    const cap = (v, cls) => `<b class="num ${cls}">£${num(v)}</b><small>a day</small>`;
    body = `<div class="al-body">
      <div class="al-cmp">
        <div class="cap"><span class="lbl">Daily spend cap</span><div class="caps">${cap(W.daily_cap_gbp, stopped ? "was" : "warn")}<span class="arr">→</span>${R ? cap(R.daily_cap_gbp, "now") : `<b class="num pend">${stopped ? "…" : "?"}</b>`}</div><div class="s">His brief says £40</div></div>
        <table class="t cmp"><tbody>
          <tr><td>Headline</td><td class="${stopped ? "was" : ""}">${esc(W.headline)}</td><td class="now">${R ? esc(R.headline) : X.stage === "redoing" ? `<span class="shimmer">redoing…</span>` : "–"}</td></tr>
          <tr><td>Ad text</td><td class="${stopped ? "was" : ""}">${esc(W.description)}</td><td class="now">${R ? esc(R.description) : "–"}</td></tr>
          <tr><td>Searches</td><td class="${stopped ? "was" : ""}">${(W.keywords || []).map(esc).join(", ")}</td><td class="now">${R ? (R.keywords || []).map(esc).join(", ") : "–"}</td></tr>
        </tbody></table>
      </div>
      <div class="al-v">
        ${C ? `<div class="vd ${C.on_task ? "ok" : "bad"}"><span class="lbl">Maeve's check</span><b>${C.on_task ? "On task" : "Off task. Stopped it."}</b>${C.problems?.length ? `<ul>${C.problems.slice(0, 4).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}${C.instruction ? `<div class="told"><b>Told Archie:</b> ${esc(C.instruction)}</div>` : ""}</div>`
          : `<div class="vd scan"><span class="lbl">Maeve's check</span><b class="shimmer">${X.stage === "drift" ? "Spotting the change…" : "Checking against his brief…"}</b></div>`}
        ${X.recheck ? `<div class="vd ${X.recheck.on_task ? "ok" : "bad"}"><span class="lbl">Checked again</span><b>${X.recheck.on_task ? "Back on task" : "Still not right"}</b><div class="s">${esc(X.recheck.summary)}</div>${R?.note_to_maeve ? `<div class="told"><b>Archie:</b> ${esc(R.note_to_maeve)}</div>` : ""}</div>` : X.stage === "rechecking" ? `<div class="vd scan"><span class="lbl">Checked again</span><b class="shimmer">Checking the redo…</b></div>` : ""}
      </div></div>`;
  }
  return `<section class="card al al-${S.tone}" data-alert>
    <div class="al-top"><div class="al-ic"><svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M13 2.5 4 6v6.5c0 5.4 3.8 9.6 9 11 5.2-1.4 9-5.6 9-11V6z"/>${S.icon}</svg></div>
      <div class="al-tx"><div class="al-k">${av("ads")}${esc(S.k)}</div><h2>${esc(S.h)}</h2>${S.p ? `<p>${esc(S.p)}</p>` : ""}</div>${btn}</div>
    ${X ? track : ""}${body}
    ${X ? `<div class="al-f">His brief: ${esc(X.brief)}</div>` : `<div class="al-f">Archie's bad change is set up so you can watch. Everything Maeve and Archie do about it is live.</div>`}
  </section>`;
}

let HOST = null, PLANSIG = "", RING = false; // RING: the ring has drawn in once this visit (redraws keep it still)
const runsOf = (ctx) => (ctx.acts.runs || []).map((r) => (r.running && Date.now() - r.at > 180000 ? { ...r, running: false, error: r.error || "That plan didn't finish. Try it again." } : r));
const runOf = (ctx) => { const runs = runsOf(ctx); return runs.find((r) => r.id === ctx.local.run) || runs[0]; };

export default {
  css: `
  .pg-tasks .s { font-size: 12.5px; color: var(--ink-3); }
  .pg-tasks .lbl { display: block; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); margin-bottom: 4px; }
  .pg-tasks .live { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-2); }
  .pg-tasks .ap { color: var(--amber-ink); font-weight: 500; }

  /* ---- hero: mission control */
  .pg-tasks .mc { display: grid; grid-template-columns: 236px minmax(0, 1fr) minmax(0, 300px); grid-template-areas: "ring main wait" "foot foot wait"; gap: 20px 28px; padding: 24px; }
  .pg-tasks .mc-ring { grid-area: ring; display: grid; justify-items: center; align-content: center; gap: 10px; }
  .pg-tasks .mc-ring .ring { width: min(236px, 100%) !important; height: auto !important; aspect-ratio: 1; }
  .pg-tasks .mc-ring .ring-c b { font-size: 46px; }
  .pg-tasks .mc-ring.settled .ring-arcs path { animation: none; stroke-dashoffset: 0; }
  .pg-tasks .mc-main { grid-area: main; min-width: 0; display: flex; flex-direction: column; gap: 18px; }
  .pg-tasks .mc-k { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-tasks .cnts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .pg-tasks .cnt { position: relative; text-align: left; padding: 12px 14px 14px; border-radius: 14px; border: 1px solid var(--line); background: linear-gradient(180deg, rgba(70, 200, 255, .06), rgba(70, 200, 255, .01)); cursor: pointer; font: inherit; color: inherit; min-width: 0; overflow: hidden; transition: border-color .15s, box-shadow .2s; }
  .pg-tasks .cnt:hover { border-color: rgba(70, 200, 255, .5); box-shadow: 0 0 26px -10px var(--holo-glow); }
  .pg-tasks .cnt span { display: block; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); white-space: nowrap; }
  .pg-tasks .cnt b { display: block; margin-top: 4px; font: 300 44px/1 var(--mono); letter-spacing: -.04em; color: #fff; text-shadow: none; }
  .pg-tasks .cnt i { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(255, 255, 255, .05); }
  .pg-tasks .cnt i::after { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: var(--w); background: var(--c); box-shadow: 0 0 10px var(--c); }
  .pg-tasks .cnt.doing b { color: var(--holo-2); }
  .pg-tasks .cnt.done b { color: #b9f7dc; }
  .pg-tasks .goal label { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 10px; }
  .pg-tasks .goal label svg { color: var(--holo); filter: drop-shadow(0 0 6px var(--holo)); }
  .pg-tasks .goal label em { font-style: normal; font-weight: 400; font-size: 13px; color: var(--ink-3); }
  .pg-tasks .gin { display: flex; gap: 8px; padding: 6px; border-radius: 16px; border: 1px solid rgba(70, 200, 255, .45); background: rgba(0, 0, 0, .22); box-shadow: 0 0 0 4px var(--holo-tint), 0 0 40px -16px var(--holo-glow); }
  .pg-tasks .gin input { flex: 1; min-width: 0; height: 44px; padding: 0 12px; border: 0; background: none; font-size: 15px; box-shadow: none; }
  .pg-tasks .gin .btn { height: 44px; padding: 0 22px; font-size: 14.5px; border-radius: 12px; }
  .pg-tasks .ex { margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
  .pg-tasks .ex button { cursor: pointer; font: inherit; font-size: 12px; }
  .pg-tasks .ex button:hover { border-color: rgba(70, 200, 255, .5); color: #fff; }
  .pg-tasks .mc-wait { grid-area: wait; display: flex; flex-direction: column; border-radius: 16px; border: 1px solid rgba(255, 181, 71, .32); background: linear-gradient(180deg, rgba(255, 181, 71, .1), rgba(255, 181, 71, .02)); padding: 18px; min-width: 0; cursor: pointer; transition: box-shadow .2s; }
  .pg-tasks .mc-wait:hover { box-shadow: 0 0 34px -12px var(--amber-glow); }
  .pg-tasks .w-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .pg-tasks .w-h span { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--amber-ink); display: flex; align-items: center; gap: 8px; }
  .pg-tasks .w-h b { font: 300 52px/0.9 var(--mono); letter-spacing: -.04em; color: var(--amber-ink); text-shadow: none; }
  .pg-tasks .w-p { display: grid; gap: 8px; margin-top: 12px; }
  .pg-tasks .w-p > div { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 12px; background: var(--well); border: 1px solid rgba(255, 181, 71, .14); }
  .pg-tasks .pav { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-weight: 600; font-size: 12px; color: var(--amber-ink); border: 1px solid rgba(255, 181, 71, .5); background: var(--amber-tint); }
  .pg-tasks .w-p b { display: block; font-weight: 600; color: #fff; font-size: 13.5px; }
  .pg-tasks .w-p small { display: block; font-size: 11.5px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-tasks .w-p em { font: 400 22px/1 var(--mono); font-style: normal; color: var(--amber-ink); }
  .pg-tasks .w-f { margin-top: auto; padding-top: 12px; font-size: 12px; color: var(--ink-3); }
  .pg-tasks .mc-foot { grid-area: foot; display: flex; flex-wrap: wrap; gap: 8px 28px; padding-top: 16px; border-top: 1px solid var(--line); }
  .pg-tasks .mc-foot div { display: flex; align-items: baseline; gap: 8px; font-size: 12.5px; color: var(--ink-3); cursor: default; }
  .pg-tasks .mc-foot b { font: 400 18px var(--mono); color: #fff; }
  .pg-tasks .mc-foot em { font-style: normal; font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--holo-2); }

  /* ---- Maeve's plan */
  .pg-tasks .plan { margin-top: 16px; }
  .pg-tasks .pl-h { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .pg-tasks .pl-h h2 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: -.015em; color: #fff; }
  .pg-tasks .pl-live { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; }
  .pg-tasks .appr { margin: 8px 0 0; color: var(--ink-2); font-size: 14px; max-width: 820px; }
  .pg-tasks .pl-list { margin-top: 16px; display: grid; gap: 8px; }
  .pg-tasks .pl-row { display: grid; grid-template-columns: 34px 150px minmax(0, 1.5fr) minmax(0, 1fr) 112px; gap: 12px 18px; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); align-items: start; animation: pgtk-in .5s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes pgtk-in { from { opacity: 0; transform: translateY(8px); border-color: var(--holo); box-shadow: 0 0 30px -8px var(--holo-glow); } }
  .pg-tasks .pl-row.typing { border-color: rgba(70, 200, 255, .5); box-shadow: 0 0 26px -10px var(--holo-glow); background: var(--holo-tint); }
  .pg-tasks .pl-row .n { font-size: 12px; color: var(--holo); text-shadow: none; padding-top: 4px; }
  .pg-tasks .pl-who { display: flex; align-items: center; gap: 0; min-width: 0; }
  .pg-tasks .pl-who div { min-width: 0; }
  .pg-tasks .pl-who b { display: block; font-weight: 600; font-size: 13px; color: #fff; }
  .pg-tasks .pl-who div span { display: block; font-size: 11.5px; color: var(--ink-3); white-space: nowrap; }
  .pg-tasks .tt { font-size: 14px; font-weight: 500; line-height: 1.4; color: #fff; }
  .pg-tasks .pl-t .s { margin-top: 4px; }
  .pg-tasks .s2 { font-size: 12.5px; color: var(--ink-2); line-height: 1.45; }
  .pg-tasks .pl-d .num { font-size: 13px; color: #fff; }
  .pg-tasks .pl-d .ap { font-size: 12px; margin-top: 6px; }
  .pg-tasks .msr { margin-top: 12px; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--line); background: var(--holo-tint); font-size: 13.5px; color: var(--ink); }
  .pg-tasks .earlier { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .pg-tasks .earlier button { cursor: pointer; font: inherit; font-size: 12px; }

  /* ---- the off-task alert */
  .pg-tasks .al { --ac: var(--holo); --at: var(--holo-tint); margin-top: 16px; padding: 24px; overflow: hidden; transition: border-color .4s, box-shadow .4s; }
  .pg-tasks .al-warn { --ac: var(--red); --at: var(--red-tint); border-color: rgba(255, 97, 104, .4); }
  .pg-tasks .al-red { --ac: var(--red); --at: var(--red-tint); border-color: rgba(255, 97, 104, .7); box-shadow: 0 0 0 1px rgba(255, 97, 104, .35), 0 0 60px -14px rgba(255, 97, 104, .55), inset 0 0 80px -30px rgba(255, 97, 104, .35); background: linear-gradient(180deg, rgba(60, 12, 18, .92), rgba(20, 8, 12, .94)); animation: pgtk-red 1.6s ease-in-out infinite; }
  @keyframes pgtk-red { 50% { box-shadow: 0 0 0 1px rgba(255, 97, 104, .2), 0 0 30px -14px rgba(255, 97, 104, .4), inset 0 0 60px -30px rgba(255, 97, 104, .2); } }
  .pg-tasks .al-green { --ac: var(--green); --at: var(--green-tint); border-color: rgba(63, 224, 160, .6); box-shadow: 0 0 0 1px rgba(63, 224, 160, .25), 0 0 60px -16px rgba(63, 224, 160, .5); background: linear-gradient(180deg, rgba(63, 224, 160, .16), rgba(63, 224, 160, .06)); }
  .pg-tasks .al-scan { border-color: rgba(70, 200, 255, .5); }
  .pg-tasks .al-scan::after { content: ""; position: absolute; left: 0; right: 0; top: -30%; height: 30%; background: linear-gradient(180deg, transparent, rgba(70, 200, 255, .12), transparent); animation: pgtk-scan 1.8s linear infinite; pointer-events: none; }
  @keyframes pgtk-scan { to { top: 130%; } }
  .pg-tasks .al-top { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; gap: 20px; align-items: center; }
  .pg-tasks .al-ic { width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; color: var(--ac); background: var(--at); border: 1px solid var(--ac); box-shadow: 0 0 30px -6px var(--ac); }
  .pg-tasks .al-ic svg { width: 34px; height: 34px; }
  .pg-tasks .al-red .al-ic { animation: pgtk-blink 1s steps(2) infinite; }
  @keyframes pgtk-blink { 50% { box-shadow: 0 0 0 transparent; opacity: .75; } }
  .pg-tasks .al-k { display: flex; align-items: center; gap: 0; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ac); }
  .pg-tasks .al-idle .al-k { color: var(--holo-2); }
  .pg-tasks .al-k .av-s { width: 20px; height: 20px; font-size: 9px; }
  .pg-tasks .al-tx h2 { margin: 6px 0 0; font-size: 26px; font-weight: 500; letter-spacing: -.02em; color: #fff; line-height: 1.2; }
  .pg-tasks .al-red .al-tx h2 { color: #ffd0d2; text-shadow: none; }
  .pg-tasks .al-green .al-tx h2 { color: #c9fbe5; text-shadow: none; }
  .pg-tasks .al-tx p { margin: 6px 0 0; color: var(--ink-2); font-size: 14px; max-width: 720px; }
  .pg-tasks .al-go { height: 46px; padding: 0 20px; font-size: 14px; border-radius: 12px; }
  .pg-tasks .al-track { position: relative; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; margin: 22px 0 0; }
  .pg-tasks .al-track div { min-width: 0; font-size: 11.5px; color: var(--ink-3); }
  .pg-tasks .al-track i { display: block; height: 4px; border-radius: 4px; background: rgba(255, 255, 255, .08); margin-bottom: 8px; }
  .pg-tasks .al-track b { display: block; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-tasks .al-track .done i { background: var(--holo); box-shadow: 0 0 8px var(--holo); }
  .pg-tasks .al-track .done b { color: var(--ink-2); }
  .pg-tasks .al-track .on i { background: var(--holo); animation: pulse 1s ease-in-out infinite; box-shadow: 0 0 12px var(--holo); }
  .pg-tasks .al-track .on b { color: #fff; }
  .pg-tasks .al-track .bad i { background: var(--red); box-shadow: 0 0 12px var(--red); }
  .pg-tasks .al-track .bad b { color: #ffb0b3; }
  .pg-tasks .al-track .good i { background: var(--green); box-shadow: 0 0 12px var(--green); }
  .pg-tasks .al-track .good b { color: #8ff0c6; }
  .pg-tasks .al-body { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 16px; margin-top: 20px; }
  .pg-tasks .al-cmp { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 16px; align-items: start; padding: 16px; border-radius: 14px; border: 1px solid var(--line); background: var(--well); min-width: 0; }
  .pg-tasks .caps { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .pg-tasks .caps b { font: 300 38px/1 var(--mono); letter-spacing: -.04em; }
  .pg-tasks .caps small { font-size: 12px; color: var(--ink-3); margin-left: -4px; }
  .pg-tasks .caps .warn { color: #ffb0b3; text-shadow: none; }
  .pg-tasks .caps .was { color: #ff8f94; text-decoration: line-through; text-decoration-thickness: 2px; opacity: .85; }
  .pg-tasks .caps .now { color: #b9f7dc; text-shadow: none; }
  .pg-tasks .caps .pend { color: var(--ink-3); }
  .pg-tasks .caps .arr { color: var(--ink-3); font-size: 20px; }
  .pg-tasks .cap .s { margin-top: 6px; }
  .pg-tasks .cmp td { padding: 6px 8px; font-size: 12.5px; border-bottom-color: var(--line); vertical-align: top; }
  .pg-tasks .cmp td:first-child { color: var(--ink-3); white-space: nowrap; width: 1%; font-size: 12.5px; letter-spacing: 0; text-transform: none; }
  .pg-tasks .cmp td.was { color: #ff9a9e; text-decoration: line-through; text-decoration-color: rgba(255, 97, 104, .6); }
  .pg-tasks .cmp td.now { color: #b9f7dc; }
  .pg-tasks .cmp tr:hover td { background: none; }
  .pg-tasks .al-v { display: grid; gap: 10px; align-content: start; min-width: 0; }
  .pg-tasks .vd { padding: 14px 16px; border-radius: 14px; border: 1px solid var(--line); background: var(--well); font-size: 13px; color: var(--ink-2); }
  .pg-tasks .vd > b { display: block; font-size: 15px; font-weight: 600; color: #fff; }
  .pg-tasks .vd.bad { border-color: rgba(255, 97, 104, .5); background: rgba(255, 97, 104, .1); }
  .pg-tasks .vd.bad > b { color: #ffb0b3; }
  .pg-tasks .vd.ok { border-color: rgba(63, 224, 160, .5); background: rgba(63, 224, 160, .08); }
  .pg-tasks .vd.ok > b { color: #8ff0c6; }
  .pg-tasks .vd ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 3px; }
  .pg-tasks .vd .told { margin-top: 8px; font-size: 12.5px; }
  .pg-tasks .vd .told b { color: var(--ink); font-weight: 600; }
  .pg-tasks .vd .s { margin-top: 4px; }
  .pg-tasks .al-intro { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; margin-top: 20px; align-items: stretch; }
  .pg-tasks .al-brief2 { padding: 16px; border-radius: 14px; border: 1px solid var(--line); background: var(--well); }
  .pg-tasks .bchip { display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(70, 200, 255, .32); background: var(--holo-tint); color: var(--holo-2); font-size: 12.5px; white-space: nowrap; }
  .pg-tasks .al-stat { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px; align-items: center; padding: 16px; border-radius: 14px; border: 1px solid rgba(63, 224, 160, .3); background: var(--green-tint); }
  .pg-tasks .al-stat b { font: 300 44px/1 var(--mono); color: #b9f7dc; text-shadow: none; }
  .pg-tasks .al-stat span { font-size: 13px; color: var(--ink-2); }
  .pg-tasks .al-f { margin-top: 16px; font-size: 12px; color: var(--ink-3); }

  /* ---- the board */
  .pg-tasks .bd { margin-top: 16px; }
  .pg-tasks .bd .ch { flex-wrap: wrap; }
  .pg-tasks .seg .av-s { width: 18px; height: 18px; font-size: 9px; margin-right: 6px; }
  .pg-tasks .board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-items: start; margin-top: 14px; }
  .pg-tasks .col { border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .015); padding: 10px; min-width: 0; }
  .pg-tasks .col h4 { position: relative; margin: 0 0 10px; padding: 4px 4px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-2); border-bottom: 1px solid var(--line); }
  .pg-tasks .col h4::after { content: ""; position: absolute; left: 0; bottom: -1px; width: 36px; height: 2px; background: var(--c); box-shadow: 0 0 10px var(--c); }
  .pg-tasks .col h4 em { font: 400 18px var(--mono); font-style: normal; letter-spacing: 0; color: #fff; }
  .pg-tasks .tk { border-radius: 12px; border: 1px solid var(--line); background: var(--panel-2); padding: 10px 12px; margin-top: 8px; cursor: pointer; transition: border-color .15s, box-shadow .2s; }
  .pg-tasks .col h4 + .tk { margin-top: 0; }
  .pg-tasks .tk:hover { border-color: rgba(70, 200, 255, .45); }
  .pg-tasks .tk.new { border-color: rgba(70, 200, 255, .55); box-shadow: 0 0 22px -8px var(--holo-glow); }
  .pg-tasks .tk.open { border-color: var(--holo); }
  .pg-tasks .tk-h { display: flex; align-items: center; font-size: 12px; color: var(--ink-3); min-height: 20px; }
  .pg-tasks .tk-h .av-s { width: 20px; height: 20px; font-size: 9px; }
  .pg-tasks .tk-h .chip { margin-left: auto; height: 20px; font-size: 11px; padding: 0 7px; }
  .pg-tasks .tk-t { margin-top: 6px; font-size: 13px; line-height: 1.4; font-weight: 500; color: var(--ink); }
  .pg-tasks .col.done .tk-t { color: var(--ink-3); font-weight: 400; }
  .pg-tasks .tk-m { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 11.5px; color: var(--ink-3); }
  .pg-tasks .tk-m .late { color: var(--red); font-weight: 500; }
  .pg-tasks .tk-m .nw { color: var(--holo-2); font-weight: 500; }
  .pg-tasks .tk-x { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); display: grid; gap: 8px; font-size: 12.5px; color: var(--ink-2); line-height: 1.45; }
  .pg-tasks .tk-x b { display: block; font-size: 12.5px; font-weight: 600; text-transform: none; letter-spacing: 0; color: var(--holo-2); margin-bottom: 2px; }
  .pg-tasks .nothing { font-size: 12px; color: var(--ink-3); padding: 8px 4px; }

  /* ---- detail tabs */
  .pg-tasks .more { margin-top: 16px; }
  .pg-tasks .more > .ch { flex-wrap: wrap; margin-bottom: 16px; }
  .pg-tasks .wps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .pg-tasks .wp { border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .015); overflow: hidden; display: flex; flex-direction: column; }
  .pg-tasks .wp-h { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 0 12px; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--line); }
  .pg-tasks .wp-h .pav { width: 36px; height: 36px; font-size: 13px; }
  .pg-tasks .wp-h b { font-weight: 600; font-size: 15px; color: #fff; }
  .pg-tasks .wp-h .cnt2 { font: 300 30px/1 var(--mono); color: var(--amber-ink); text-shadow: none; text-align: right; }
  .pg-tasks .wp-h .cnt2 small { display: block; font: 11px var(--sans); color: var(--ink-3); margin-top: 4px; text-shadow: none; }
  .pg-tasks .wi { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; padding: 12px 16px; border-top: 1px solid var(--line); cursor: pointer; }
  .pg-tasks .wi:first-child { border-top: 0; }
  .pg-tasks .wi:hover { background: var(--amber-tint); }
  .pg-tasks .wi .wt { font-size: 13px; line-height: 1.4; color: var(--ink); }
  .pg-tasks .wi .wt .av-s { width: 18px; height: 18px; font-size: 9px; margin-right: 6px; }
  .pg-tasks .wi .w { text-align: right; }
  .pg-tasks .wi .w .num { font-size: 12.5px; color: var(--amber-ink); }
  .pg-tasks .wi .w .num.long { color: var(--red); }
  .pg-tasks .wi .w small { display: block; font-size: 11.5px; color: var(--ink-3); }
  .pg-tasks .wi.fresh { background: var(--holo-tint); }
  .pg-tasks .wp-f { margin-top: auto; padding: 12px 16px; border-top: 1px solid var(--line); font-size: 12px; color: var(--ink-3); background: rgba(255, 255, 255, .02); }
  .pg-tasks .ci { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 16px; padding: 14px 16px; border-top: 1px solid var(--line); }
  .pg-tasks .ci:first-child { border-top: 0; }
  .pg-tasks .ci .top { display: flex; align-items: center; font-size: 12px; color: var(--ink-3); }
  .pg-tasks .ci .top .av-s { width: 18px; height: 18px; font-size: 9px; margin-right: 6px; }
  .pg-tasks .ci .did { margin-top: 6px; font-size: 13.5px; font-weight: 500; line-height: 1.4; color: #fff; }
  .pg-tasks .ci .rule { margin-top: 8px; font-size: 12.5px; color: var(--ink-2); padding-left: 12px; border-left: 2px solid var(--holo); }
  .pg-tasks .ci .r { text-align: right; font-size: 12px; color: var(--ink-3); }
  .pg-tasks .ci .r .num { display: block; font: 300 20px var(--mono); color: #fff; }
  .pg-tasks .ci.lv { background: var(--red-tint); }
  .pg-tasks .br { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 16px; align-items: start; }
  .pg-tasks .br-l .li { grid-template-columns: minmax(0, 1fr) auto; align-items: center; padding: 9px 12px; }
  .pg-tasks .br-l .li .s { display: block; margin-left: 32px; margin-top: -2px; }
  .pg-tasks .br-l .li b { font-weight: 600; color: var(--ink); }
  .pg-tasks .br-r { padding: 20px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255, 255, 255, .015); }
  .pg-tasks .br-r .bh { display: flex; align-items: center; gap: 12px; }
  .pg-tasks .br-r .bh .av-s { width: 40px; height: 40px; font-size: 15px; margin: 0; }
  .pg-tasks .br-r .bh h2 { margin: 0; font-size: 20px; font-weight: 500; color: #fff; letter-spacing: -.01em; }
  .pg-tasks .br-r .bh h2 .rl { font-size: 14px; font-weight: 400; color: var(--ink-3); margin-left: 4px; }
  .pg-tasks .br-r .bh p { margin: 2px 0 0; color: var(--ink-2); font-size: 14px; }
  .pg-tasks .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
  .pg-tasks .bl { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 13px; color: var(--ink-2); }
  .pg-tasks .bl li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 8px; line-height: 1.4; }
  .pg-tasks .bl li::before { content: ""; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; border: 1.5px solid var(--holo); }
  .pg-tasks .bl.yes li::before { border-color: var(--green); background: var(--green-tint); }
  .pg-tasks .bl.no li::before { border-radius: 2px; border-color: var(--red); background: var(--red-tint); }
  .pg-tasks .lim { margin-top: 18px; }
  .pg-tasks .lim td { padding: 8px 12px; font-size: 13px; }
  .pg-tasks .lim td:first-child { color: var(--ink-3); width: 40%; }
  .pg-tasks .ch2 { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 24px; }
  .pg-tasks .ch2 h4 { margin: 0 0 4px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }

  @container (max-width: 1100px) {
    .pg-tasks .mc { grid-template-columns: 210px minmax(0, 1fr); grid-template-areas: "ring main" "wait wait" "foot foot"; }
    .pg-tasks .mc-wait { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 20px; align-items: center; }
    .pg-tasks .w-h { flex-direction: column; gap: 6px; }
    .pg-tasks .w-p { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 0; }
    .pg-tasks .w-f { grid-column: 1 / -1; padding-top: 4px; }
    .pg-tasks .pl-row { grid-template-columns: 30px 130px minmax(0, 1fr) 100px; }
    .pg-tasks .pl-c { grid-column: 3; }
    .pg-tasks .pl-d { grid-column: 4; grid-row: 1 / span 2; }
    .pg-tasks .al-body { grid-template-columns: minmax(0, 1fr); }
  }
  @container (max-width: 760px) {
    .pg-tasks .mc { padding: 18px; gap: 16px 20px; grid-template-columns: 170px minmax(0, 1fr); }
    .pg-tasks .mc-ring .ring-c b { font-size: 34px; }
    .pg-tasks .mc-ring .ring-s { display: none; }
    .pg-tasks .cnts { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .pg-tasks .cnt { padding: 8px 12px 10px; }
    .pg-tasks .cnt b { font-size: 32px; }
    .pg-tasks .mc-main { gap: 14px; }
    .pg-tasks .ex { display: none; }
    .pg-tasks .w-p small { display: none; }
    .pg-tasks .w-h b { font-size: 40px; }
    .pg-tasks .mc-wait { padding: 14px; }
    .pg-tasks .mc-foot { padding-top: 12px; gap: 6px 20px; }
    .pg-tasks .al { padding: 18px; }
    .pg-tasks .al-top { grid-template-columns: 52px minmax(0, 1fr); }
    .pg-tasks .al-ic { width: 52px; height: 52px; }
    .pg-tasks .al-go { grid-column: 1 / -1; justify-self: start; }
    .pg-tasks .al-tx h2 { font-size: 21px; }
    .pg-tasks .al-cmp { grid-template-columns: minmax(0, 1fr); }
    .pg-tasks .al-intro { grid-template-columns: minmax(0, 1fr); }
    .pg-tasks .al-track b { font-size: 10.5px; white-space: normal; }
    .pg-tasks .board { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .pg-tasks .wps, .pg-tasks .br, .pg-tasks .two, .pg-tasks .ch2 { grid-template-columns: minmax(0, 1fr); }
    .pg-tasks .br-l { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pg-tasks .br-l .li { border-top: 1px solid var(--line); }
    .pg-tasks .br-l .li .s { display: none; }
    .pg-tasks .pl-row { grid-template-columns: 26px minmax(0, 1fr); }
    .pg-tasks .pl-row > :nth-child(n+3) { grid-column: 2; grid-row: auto; }
  }
  @container (max-width: 560px) {
    .pg-tasks .mc { grid-template-columns: minmax(0, 1fr); grid-template-areas: "ring" "main" "wait" "foot"; }
    .pg-tasks .mc-ring .ring { width: 190px !important; }
    .pg-tasks .mc-wait { grid-template-columns: minmax(0, 1fr); }
    .pg-tasks .w-h { flex-direction: row; align-items: center; }
    .pg-tasks .w-p { grid-template-columns: minmax(0, 1fr); }
    .pg-tasks .gin .btn { padding: 0 14px; }
  }`,

  render(host, ctx) {
    HOST = host;
    const D = ctx.data, F = ctx.F, L = ctx.local, X = F.drift, M = ctx.model, E = M.employees.manager, last = E.units.length - 1;
    const notes = D.notes || {}, all = allTasks(ctx);
    const by = Object.fromEntries(COLS.map(([s]) => [s, all.filter((t) => t.status === s)]));
    const total = all.length, doneN = by.done.length, pct = total ? Math.round((doneN / total) * 100) : 0;
    const open = all.filter((t) => t.status !== "done"), late = open.filter((t) => (t.due_day_offset ?? 0) < 0);
    const needs = needsList(ctx);
    const st = ctx.status("manager");
    const runs = runsOf(ctx), run = runOf(ctx);
    PLANSIG = run ? `${run.id}|${run.running}` : "";
    const liveCatch = X?.check && !X.check.on_task ? 1 : 0;
    const catches = (D.catches || []).slice().sort((a, b) => b.day_offset - a.day_offset);
    const catches7 = E.off_task_caught; // the model's figure; the sample catches for days -7 to -1 are exactly this many

    // ---- hero: mission control
    const segs = COLS.map(([s, l]) => ({ v: by[s].length, color: TONE[s], label: `${l}: ${by[s].length}` }));
    const maxC = Math.max(1, ...COLS.map(([s]) => by[s].length));
    const perPerson = PEOPLE.map((p) => { const items = needs.filter((n) => n.who === p).sort((a, b) => b.mins - a.mins); return { p, items }; });
    const hero = `<section class="card hud mc" data-hero>
      <div class="mc-ring ${RING ? "settled" : ""}">${ring(segs, { size: 236, value: String(pct), unit: "%", label: "Done", sub: `${doneN} of ${total} tasks` })}</div>
      <div class="mc-main">
        <div class="mc-k"><span class="ldot busy"></span>${st.busy ? esc(st.text) : "The board right now"}${late.length ? ` · <span style="color:var(--red)">${late.length} late</span>` : ""}</div>
        <div class="cnts">${COLS.map(([s, l]) => `<button class="cnt ${s}" data-col="${s}" style="--c:${TONE[s]};--w:${(by[s].length / maxC) * 100}%"><span>${l}</span><b class="num" data-count="${by[s].length}">${by[s].length}</b><i></i></button>`).join("")}</div>
        <form class="goal" data-goal autocomplete="off"><label for="pgtk-goal">${ICON.goal}Give Maeve a goal<em>she turns it into tasks for the right people</em></label>
          <div class="gin"><input id="pgtk-goal" data-goal-in value="${esc(L.goal || "")}" placeholder="e.g. ${esc(D.examples?.[0] || "More boiler service bookings before January")}"><button class="btn primary" ${run?.running ? "disabled" : ""}>${run?.running ? "Planning…" : "Plan it"}</button></div>
          <div class="ex">${(D.examples || []).map((e) => `<button type="button" class="chip" data-ex="${esc(e)}">${esc(e)}</button>`).join("")}</div></form>
      </div>
      <div class="mc-wait" data-go-wait role="button" tabindex="0">
        <div class="w-h"><span><i class="ldot need"></i>Waiting on a person</span><b class="num" data-count="${needs.length}">${needs.length}</b></div>
        <div class="w-p">${perPerson.map(({ p, items }) => `<div><span class="pav">${p[0]}</span><div style="min-width:0"><b>${p}</b><small>${items[0] ? `${esc(items[0].what)} · ${waitTxt(items[0].mins)}` : "Nothing waiting"}</small></div><em class="num">${items.length}</em></div>`).join("")}</div>
        <div class="w-f">Nothing is sent, published or paid until they say yes.</div>
      </div>
      <div class="mc-foot">
        <div data-tip="${esc(E.kpis[0].working)}"><b>${num(E.units[last])}</b>pieces of work checked</div>
        <div data-tip="${esc(E.kpis[1].working)}"><b>${num(E.sent_back)}</b>sent back to redo</div>
        <div data-tip="Stopped before they cost money or misled anyone"><b>${num(E.off_task_caught)}</b>caught off task${liveCatch ? ` <span class="ap">+1 today</span>` : ""}</div>
        <div><em>last 7 days</em></div>
      </div>
    </section>`;

    // ---- Maeve's plan (after a goal)
    const plan = run ? `<section class="card plan" data-plan>${planInner(run)}${runs.length > 1 ? `<div class="earlier"><span class="s">Earlier goals:</span>${runs.filter((r) => r !== run).slice(0, 5).map((r) => `<button type="button" class="chip" data-run="${esc(r.id)}">${esc(r.result?.goal || r.goal)}</button>`).join("")}</div>` : ""}</section>` : "";

    // ---- the board
    const who = L.who || "all";
    const people = AGENTS.filter((a) => all.some((t) => t.agent === a.id));
    const shown = all.filter((t) => who === "all" || t.agent === who);
    const sortT = (a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || PRI[a.priority || "normal"] - PRI[b.priority || "normal"] || (a.due_day_offset ?? 0) - (b.due_day_offset ?? 0);
    const board = `<section class="card bd" data-board><div class="ch"><h3>The board</h3><span class="r">${plural(shown.length, "task")} · click a card for why and what Maeve checks</span></div>
      ${seg([["all", "Everyone"], ...people.map((a) => [a.id, `${av(a.id)}${esc(a.name)}`])], who, "who")}
      <div class="board">${COLS.map(([s, l]) => {
        let col = shown.filter((t) => t.status === s);
        col = s === "done" ? col.sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || (b.due_day_offset ?? 0) - (a.due_day_offset ?? 0)) : col.sort(sortT);
        const cap = L.allTasks ? 99 : 4, more = col.length - cap;
        return `<div class="col ${s}" style="--c:${TONE[s]}"><h4>${l}<em>${col.length}</em></h4>${col.slice(0, cap).map((t) => taskCard(t, all, notes, L.open === t.id)).join("") || `<div class="nothing">Nothing here</div>`}${more > 0 ? `<div class="nothing">+ ${more} more</div>` : ""}</div>`;
      }).join("")}</div>
      ${COLS.some(([s]) => shown.filter((x) => x.status === s).length > 4) ?`<div class="row" style="margin-top:12px"><button class="btn sm" data-alltasks>${L.allTasks ? "Show fewer" : `Show all ${shown.length} tasks`}</button></div>` : ""}</section>`;

    // ---- detail, behind tabs
    const tab = L.tab || "waiting";
    let body = "";
    if (tab === "waiting") {
      const P = D.people || {};
      body = `<div class="wps">${perPerson.map(({ p, items }) => `<div class="wp"><div class="wp-h"><span class="pav">${p[0]}</span><div><b>${p}</b><div class="s">${esc(P[p]?.role || "")}</div></div><div class="cnt2">${items.length}<small>waiting</small></div></div>
        <div>${items.map((n) => `<div class="wi ${n.fresh ? "fresh" : ""}" data-need-page="${esc(n.page || "")}" data-need-agent="${esc(n.agent)}"><div class="wt">${av(n.agent)}${esc(n.what)}${n.detail ? `<div class="s" style="margin-left:24px">${esc(n.detail)}</div>` : ""}</div>
          <div class="w"><span class="num ${n.mins >= 1440 ? "long" : ""}">${waitTxt(n.mins)}</span>${n.value_gbp ? `<small class="num">${money(n.value_gbp, 0)}</small>` : ""}</div></div>`).join("") || `<div class="wi"><div class="s">Nothing waiting</div></div>`}</div>
        <div class="wp-f">Says yes to: ${esc(P[p]?.approves || "")}</div></div>`).join("")}</div>
        ${working(`${perPerson.map(({ p, items }) => `${p} ${items.length}`).join(" + ")} = ${needs.length}, the same list as Home`)}`;
    } else if (tab === "briefs") {
      const bsel = L.brief || "ads", B = (D.briefs || {})[bsel] || {}, ba = BY_ID[bsel];
      const mine = open.filter((t) => t.agent === bsel), myCatches = catches.filter((c) => c.agent === bsel);
      body = `<div class="br"><div class="list br-l">${AGENTS.map((a) => `<div class="li click ${a.id === bsel ? "sel" : ""}" data-brief="${a.id}" role="button" tabindex="0"><div>${av(a.id)}<b>${esc(a.name)}</b><span class="s">${esc(a.role)}</span></div><span class="num muted">${open.filter((t) => t.agent === a.id).length}</span></div>`).join("")}</div>
        <div class="br-r"><div class="bh">${av(bsel)}<div><h2>${esc(ba.name)} <span class="rl">${esc(ba.role)}</span></h2><p>${esc(B.job || ba.does)}</p></div></div>
          <div class="two"><div><span class="lbl">Can do</span><ul class="bl yes">${(B.may || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div><span class="lbl">Can't do</span><ul class="bl no">${(B.may_not || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
          <div class="lim"><span class="lbl">Limits, and who says yes</span><div class="tablewrap"><table class="t">${(B.limits || []).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table></div></div>
          <div class="two"><div><span class="lbl">${bsel === "manager" ? "Who checks Maeve" : "What Maeve checks"}</span><ul class="bl">${(B.checks || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
            <div><span class="lbl">On the board now</span>${mine.length ? `<ul class="bl">${mine.slice(0, 5).map((t) => `<li>${esc(t.title)}</li>`).join("")}</ul>` : `<div class="s">Nothing open</div>`}
            ${myCatches.length || (bsel === "ads" && liveCatch) ? `<span class="lbl" style="margin-top:16px">Caught off task</span><ul class="bl">${bsel === "ads" && liveCatch ? `<li>Today: “${esc(X.work.headline)}” and a £${num(X.work.daily_cap_gbp)} cap</li>` : ""}${myCatches.map((c) => `<li>${esc(c.did)}</li>`).join("")}</ul>` : ""}</div></div>
        </div></div>`;
    } else if (tab === "catches") {
      const liveItem = liveCatch ? `<div class="ci lv"><div><div class="top">${av("ads")}Archie · today</div><div class="did">Changed the boiler campaign: “${esc(X.work.headline)}”, cap up to £${num(X.work.daily_cap_gbp)} a day</div><div class="s">${esc(X.check.problems?.[0] || X.check.summary || "")}</div>${X.redo ? `<div class="rule">Redone inside the brief: “${esc(X.redo.headline)}”, cap £${num(X.redo.daily_cap_gbp)}</div>` : ""}</div><div class="r">${chip(X.stage === "done" ? "Fixed" : "Live", X.stage === "done" ? "green" : "red")}</div></div>` : "";
      body = `<div class="list">${liveItem}${catches.map((c) => `<div class="ci"><div><div class="top">${av(c.agent)}${esc(BY_ID[c.agent]?.name)} · ${esc(c.day_offset === -1 ? "yesterday" : day(c.day_offset))}</div>
          <div class="did">${esc(c.did)}</div><div class="s">Off task because: ${esc(c.why_off)} ${esc(c.maeve)}</div><div class="rule">New rule: ${esc(c.rule)}</div></div>
          <div class="r"><span class="num">${c.at_stake_gbp ? money(c.at_stake_gbp, 0) : "–"}</span>${esc(c.at_stake_gbp ? "at stake" : c.at_stake)}<br>caught in ${c.minutes} min</div></div>`).join("")}</div>
        ${working(`${catches7} in the last 7 days, the figure at the top of the page${liveCatch ? ", plus Archie today" : ""}; ${catches.length} in the last 4 weeks`)}`;
    } else if (tab === "days") {
      const byDay = (D.done_by_day || []).map((d) => ({ l: short(dayDate(d.day_offset)), v: d.done + (d.day_offset === 0 ? (F.tasks || []).filter((t) => t.status === "done").length : 0) }));
      const openBy = AGENTS.map((a) => ({ a, v: open.filter((t) => t.agent === a.id).length })).filter((x) => x.v).sort((x, y) => y.v - x.v);
      body = `<div class="ch2"><div><h4>Tasks finished each day</h4>${barChart(byDay, { h: 170, fmt: (v) => `${v} tasks`, every: 2 })}</div>
        <div><h4>Open tasks by employee</h4><div style="margin-top:16px">${hbars(openBy.map((x) => ({ label: `${av(x.a.id)}${esc(x.a.name)}`, v: x.v, tip: `${x.a.name}: ${plural(x.v, "open task")}` })))}</div>${working(`${openBy.map((x) => x.v).join(" + ")} = ${open.length} open`)}</div></div>`;
    } else {
      body = ctx.feed("manager", 10);
    }
    const more = `<section class="card more" data-more><div class="ch">${seg([["waiting", `Waiting on a person · ${needs.length}`], ["briefs", "Each employee's brief"], ["catches", `Past catches · ${catches.length + liveCatch}`], ["days", "Last 14 days"], ["log", "Maeve's log"]], tab, "tab")}</div>${body}</section>`;

    host.innerHTML = `<div class="inner pg-tasks">
      ${head({ title: "Task board", agent: "manager", lede: "Maeve hands out the work, checks it before it goes anywhere, and stops anyone who goes off task." })}
      ${hero}${plan}
      ${alertCard(X, ctx, catches7)}
      ${board}
      ${more}
      ${foot()}</div>`;
    RING = true;

    // ---- wiring
    const root = $(".pg-tasks", host);
    const input = $("[data-goal-in]", root);
    input.oninput = () => { L.goal = input.value; };
    $("[data-goal]", root).onsubmit = async (e) => {
      e.preventDefault(); const g = input.value.trim(); if (!g) { input.focus(); return; }
      input.blur(); L.goal = "";
      try { const r = await ctx.act("plan", { goal: g }); L.run = r.id; L.toPlan = true; } catch (err) { L.goal = g; ctx.flash(err.message); }
      ctx.redraw();
    };
    $$("[data-ex]", root).forEach((b) => (b.onclick = () => { L.goal = b.dataset.ex; input.value = L.goal; input.focus(); input.setSelectionRange(L.goal.length, L.goal.length); }));
    $$("[data-run]", root).forEach((b) => (b.onclick = () => { L.run = b.dataset.run; ctx.redraw(); }));
    $$("[data-who]", root).forEach((b) => (b.onclick = () => { L.who = b.dataset.who; ctx.redraw(); }));
    $$("[data-tab]", root).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; ctx.redraw(); }));
    $$("[data-tk]", root).forEach((el) => {
      el.onclick = () => { L.open = L.open === el.dataset.tk ? null : el.dataset.tk; ctx.redraw(); };
      el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } };
    });
    const at = $("[data-alltasks]", root); if (at) at.onclick = () => { L.allTasks = !L.allTasks; ctx.redraw(); };
    $$("[data-brief]", root).forEach((el) => {
      el.onclick = () => { L.brief = el.dataset.brief; ctx.redraw(); };
      el.onkeydown = (e) => { if (e.key === "Enter") el.click(); };
    });
    $$("[data-need-agent]", root).forEach((el) => (el.onclick = () => { const pg = el.dataset.needPage; pg && pg !== "team" && pg !== "tasks" ? ctx.go(pg) : ctx.openAgent(el.dataset.needAgent); }));
    const scrollTo = (el) => { if (!el) return; const p = host.getBoundingClientRect(), r = el.getBoundingClientRect(); host.scrollTo({ top: host.scrollTop + r.top - p.top - 16, behavior: "smooth" }); };
    $$("[data-col]", root).forEach((b) => (b.onclick = () => scrollTo($("[data-board]", root))));
    const tb = $("[data-toboard]", root); if (tb) tb.onclick = () => scrollTo($("[data-board]", root));
    const wt = $("[data-go-wait]", root);
    wt.onclick = () => { if (L.tab !== "waiting") { L.tab = "waiting"; ctx.redraw(); } setTimeout(() => scrollTo($("[data-more]", $(".pg-tasks", host))), 40); };
    wt.onkeydown = (e) => { if (e.key === "Enter") wt.click(); };
    const dr = $("[data-drift]", root);
    if (dr) dr.onclick = async () => { dr.disabled = true; try { await ctx.api("/api/floor/drift", {}); } catch (err) { ctx.flash(err.message); } ctx.redraw(); };
    if (L.toPlan) { L.toPlan = false; setTimeout(() => scrollTo($("[data-plan]", root)), 40); }
  },

  // while Maeve is planning, patch the plan card in place (a full redraw every few hundred ms would flicker)
  onEvent(ev, ctx) {
    if (ev.demo !== "floor") return false;
    if (["drift", "reset"].includes(ev.type)) return true;
    const mine = ev.type === "tasks" || (ev.type === "act" && ["tasks", "ads", "content"].includes(ev.page)) || (ev.type === "log" && ev.line?.agent === "manager");
    if (!mine) return false;
    const run = runOf(ctx), el = HOST && $("[data-plan]", HOST);
    if (run?.running && el && `${run.id}|${run.running}` === PLANSIG && (ev.type === "act" ? ev.page === "tasks" : true)) {
      const inner = planInner(run), earlier = $(".earlier", el);
      el.innerHTML = inner + (earlier ? earlier.outerHTML : "");
      $$("[data-run]", el).forEach((b) => (b.onclick = () => { ctx.local.run = b.dataset.run; ctx.redraw(); }));
      return false;
    }
    return true;
  },
  leave() { HOST = null; PLANSIG = ""; RING = false; },
};
