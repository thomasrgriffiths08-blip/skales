// The team (video 1): the ten AI employees around one core, live. Then everyone's card, their day, and who answers to who.
// Every figure comes from ctx.model (lib/model.mjs). The day's blocks, the schedules and the org chart are sample data in team.json.
import { $, $$, esc, money, seg, spark, working, foot, hhmm, BY_ID, AGENTS } from "../ui.js";

const PAGE_OF = { seo: "search", ads: "ads", content: "content", paperwork: "paperwork", manager: "tasks", coach: "training" };
const OFFICE4 = ["invoices", "inbox", "jobs", "money"];
const LEFT = ["invoices", "inbox", "jobs", "money", "paperwork"], RIGHT = ["seo", "content", "ads", "manager", "coach"];
const toMin = (s) => { const [h, m] = String(s).split(":").map(Number); return h * 60 + (m || 0); };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
const minOf = (t) => { const d = new Date(t); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
const isToday = (t) => new Date(t).toDateString() === new Date().toDateString();
const clock = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
const since = (mins) => (mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`);
const open = (ctx, id) => (PAGE_OF[id] ? ctx.go(PAGE_OF[id]) : ctx.openAgent(id));

// the next time a sample routine runs: { at: ["09:00"], days: [1..5] } (0 = Sunday)
function nextAt(s) {
  if (s.event) return null;
  const now = Date.now();
  for (let i = 0; i < 8; i++) for (const at of [].concat(s.at || []).sort()) {
    const d = new Date(); d.setDate(d.getDate() + i); const m = toMin(at); d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    if ((!s.days || s.days.includes(d.getDay())) && d.getTime() > now) return d.getTime();
  }
  return null;
}
function whenText(t) {
  const d = new Date(t), now = new Date(), tmr = new Date(); tmr.setDate(now.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return `Today ${hhmm(t)}`;
  if (d.toDateString() === tmr.toDateString()) return `Tomorrow ${hhmm(t)}`;
  return `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${hhmm(t)}`;
}
// their next timed routine (or the first "as it happens" one)
function nextUp(id, ctx) {
  const rs = OFFICE4.includes(id)
    ? (ctx.office.brain?.routines || []).filter((r) => r.agent === id).map((r) => ({ title: r.title, label: r.label, next: r.event ? null : r.nextAt }))
    : (ctx.data.schedules?.[id] || []).map((s) => ({ title: s.title, label: s.label, next: nextAt(s) }));
  const timed = rs.filter((r) => r.next).sort((a, b) => a.next - b.next)[0];
  return timed ? { when: whenText(timed.next), title: timed.title } : rs[0] ? { when: rs[0].label, title: rs[0].title } : null;
}
// today's live work: the six newer desks' log plus the original four's autopilot log
function liveLines(ctx) {
  const a = (ctx.F.log || []).filter((l) => isToday(l.at) && BY_ID[l.agent]);
  const b = (ctx.office.brain?.log || []).filter((l) => isToday(l.at) && BY_ID[l.agent]);
  return [...a, ...b].sort((x, y) => x.at - y.at);
}
// a block's count can be a path into the model ("firm.vans", or "employees.jobs.texts_sent/5" for a fifth of it)
const countOf = (M, n) => { if (typeof n !== "string") return n; const [p, d] = n.split("/"), v = p.split(".").reduce((o, k) => o?.[k], M); return d ? Math.round(v / Number(d)) : v; };
function blocks(ctx, id, nm) {
  return (ctx.data.day?.[id] || []).map((b) => { const f = toMin(b.from), t = toMin(b.to); return { ...b, n: countOf(ctx.model, b.n), f, t, st: t <= nm ? "done" : f <= nm ? "doing" : "plan" }; });
}

// the core: an arc reactor with the hours the team gave back in the middle
function coreSvg() {
  const ticks = Array.from({ length: 60 }, (_, i) => { const a = (i / 60) * Math.PI * 2, r1 = 97, r2 = i % 5 === 0 ? 90 : 93; return `<line x1="${100 + r1 * Math.cos(a)}" y1="${100 + r1 * Math.sin(a)}" x2="${100 + r2 * Math.cos(a)}" y2="${100 + r2 * Math.sin(a)}"/>`; }).join("");
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs><radialGradient id="tmcore"><stop offset="0" stop-color="#46c8ff" stop-opacity=".34"/><stop offset=".6" stop-color="#46c8ff" stop-opacity=".08"/><stop offset="1" stop-color="#46c8ff" stop-opacity="0"/></radialGradient></defs>
    <g class="tk">${ticks}</g>
    <circle cx="100" cy="100" r="82" class="bd"/>
    <circle cx="100" cy="100" r="82" class="arc"/>
    <circle cx="100" cy="100" r="70" class="ds"/>
    <circle cx="100" cy="100" r="66" fill="url(#tmcore)" class="glow"/>
  </svg>`;
}

// the wires from the core to each person, drawn once the layout is known
function wire(host) {
  const hero = $(".tm-hero", host), svg = hero && $(".tm-wires", hero);
  if (!svg || getComputedStyle(svg).display === "none") return;
  const hb = hero.getBoundingClientRect(), cb = $(".tm-core svg", hero).getBoundingClientRect();
  if (!hb.width || !cb.width) return;
  const cx = cb.left + cb.width / 2 - hb.left, cy = cb.top + cb.height / 2 - hb.top, cr = (cb.width / 2) * 0.84;
  svg.setAttribute("viewBox", `0 0 ${Math.round(hb.width)} ${Math.round(hb.height)}`);
  let out = "";
  $$(".tm-pod", hero).forEach((p, i) => {
    const b = p.getBoundingClientRect(), l = p.classList.contains("l");
    const px = (l ? b.right : b.left) - hb.left, py = b.top + b.height / 2 - hb.top;
    const ang = Math.atan2(py - cy, px - cx), sx = cx + Math.cos(ang) * cr, sy = cy + Math.sin(ang) * cr, mx = (sx + px) / 2;
    const cls = p.classList.contains("busy") ? "busy" : p.classList.contains("need") ? "need" : "";
    const d = `M${sx.toFixed(1)},${sy.toFixed(1)} C${mx.toFixed(1)},${sy.toFixed(1)} ${mx.toFixed(1)},${py.toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)}`;
    const dur = cls === "busy" ? 1.6 : 4.2 + (i % 3) * 0.8;
    out += `<path id="tmw${i}" d="${d}" class="w ${cls}"/><path d="${d}" class="w2 ${cls}"/>
      <circle r="${cls === "busy" ? 3.2 : 2.2}" class="pk ${cls}"><animateMotion dur="${dur}s" begin="${(-i * 0.61).toFixed(2)}s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#tmw${i}"/></animateMotion></circle>`;
  });
  svg.innerHTML = out;
}

let ro = null, timer = null;

export default {
  css: `
.pg-team .tm-hh { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.pg-team .tm-hh .lede { margin: 6px 0 0; }

/* hero: the ten around the core */
.pg-team .tm-hero { --core: 224px; position: relative; display: grid; grid-template-columns: minmax(0, 1fr) var(--core) minmax(0, 1fr); align-items: center; padding: 16px 16px; overflow: hidden;
  background: radial-gradient(closest-side at 50% 50%, rgba(70, 200, 255, .12), transparent 70%), var(--glass-fill), var(--noise) var(--glass-tint); }
@container (min-width: 900px) { .pg-team .tm-hero { --core: 340px; padding: 40px 24px 24px; } }
.pg-team .tm-wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: visible; }
.pg-team .tm-wires .w { fill: none; stroke: rgba(120, 200, 255, .16); stroke-width: 1; }
.pg-team .tm-wires .w2 { fill: none; stroke: rgba(120, 210, 255, .5); stroke-width: 1.2; stroke-dasharray: 2 9; animation: tmFlow 1.4s linear infinite; opacity: .55; }
.pg-team .tm-wires .w.busy { stroke: rgba(70, 200, 255, .55); stroke-width: 1.6; filter: drop-shadow(0 0 4px rgba(70, 200, 255, .8)); }
.pg-team .tm-wires .w2.busy { stroke: #bff0ff; opacity: 1; animation-duration: .6s; }
.pg-team .tm-wires .pk { fill: #bff0ff; filter: drop-shadow(0 0 4px #46c8ff); }
@keyframes tmFlow { to { stroke-dashoffset: 22; } }
.pg-team .tm-grp { display: none; position: absolute; top: 14px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); opacity: .7; z-index: 1; }
.pg-team .tm-grp.l { left: 24px; } .pg-team .tm-grp.r { right: 24px; }
@container (min-width: 900px) { .pg-team .tm-grp { display: block; } }
.pg-team .tm-col { position: relative; z-index: 1; display: grid; gap: 6px; min-width: 0; }
@container (min-width: 900px) { .pg-team .tm-col { gap: 12px; } }
.pg-team .tm-col.l .tm-pod { justify-self: end; }
.pg-team .tm-col.r .tm-pod { justify-self: start; }
.pg-team .tm-pod { width: calc(100% - 22px); }
.pg-team .tm-col.l .r1, .pg-team .tm-col.l .r3 { margin-right: 12px; } .pg-team .tm-col.l .r2 { margin-right: 22px; }
.pg-team .tm-col.r .r1, .pg-team .tm-col.r .r3 { margin-left: 12px; } .pg-team .tm-col.r .r2 { margin-left: 22px; }
.pg-team .tm-col.l .r0, .pg-team .tm-col.l .r4 { margin-right: 0; }
.pg-team .tm-pod { position: relative; display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 1px 10px; align-items: center; padding: 8px 12px; min-width: 0; border-radius: 14px; border: 1px solid var(--line); background: linear-gradient(180deg, rgba(255, 255, 255, .1), rgba(255, 255, 255, .04)), rgba(14, 21, 30, .62); text-align: left; cursor: pointer; color: var(--ink); font: inherit; box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04); transition: border-color .15s, box-shadow .2s, transform .15s; }
.pg-team .tm-pod:hover { border-color: rgba(70, 200, 255, .6); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05), 0 0 30px -10px var(--holo-glow); transform: translateY(-1px); }
.pg-team .tm-pod.busy { border-color: rgba(70, 200, 255, .55); box-shadow: 0 0 30px -12px var(--holo-glow); }
.pg-team .tm-pod.alert { border-color: rgba(255, 97, 104, .55); }
.pg-team .tm-orb { position: relative; grid-row: 1 / 3; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; font-weight: 600; font-size: 14px; box-shadow: 0 0 0 1.5px rgba(120, 200, 255, .3), 0 0 16px -4px var(--holo-glow); }
.pg-team .tm-pod.busy .tm-orb { box-shadow: 0 0 0 2px var(--holo), 0 0 18px var(--holo); }
.pg-team .tm-pod.busy .tm-orb::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid var(--holo); opacity: .6; animation: tmRing 1.6s ease-out infinite; }
@keyframes tmRing { from { transform: scale(.85); opacity: .8; } to { transform: scale(1.35); opacity: 0; } }
.pg-team .tm-orb .nb { position: absolute; top: -5px; right: -6px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; background: var(--amber); color: #2a1700; font: 700 10px/17px var(--sans); text-align: center; box-shadow: 0 0 10px var(--amber-glow), 0 0 0 2px var(--bg); }
.pg-team .tm-nm { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
.pg-team .tm-nm b { font-weight: 600; color: #fff; font-size: 14px; }
.pg-team .tm-nm em { font: 400 18px/1.15 var(--mono); font-style: normal; letter-spacing: -.02em; color: #fff; text-shadow: none; white-space: nowrap; }
.pg-team .tm-kl { font-size: 10.5px; color: var(--ink-3); text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-team .tm-st { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 11.5px; color: var(--ink-2); min-width: 0; }
.pg-team .tm-st span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-team .tm-st .ldot { width: 6px; height: 6px; }
.pg-team .tm-pod.busy .tm-st { color: var(--holo-2); }
.pg-team .tm-pod.alert .tm-st { color: #ffb0b3; }
@container (min-width: 900px) {
  .pg-team .tm-pod { padding: 12px 14px; grid-template-columns: 42px minmax(0, 1fr); gap: 2px 12px; }
  .pg-team .tm-orb { width: 42px; height: 42px; font-size: 16px; }
  .pg-team .tm-nm b { font-size: 15px; }
  .pg-team .tm-nm em { font-size: 22px; }
  .pg-team .tm-kl { font-size: 11.5px; }
  .pg-team .tm-st { font-size: 12.5px; margin-top: 6px; }
  .pg-team .tm-pod { width: calc(100% - 44px); }
  .pg-team .tm-col.l .r1, .pg-team .tm-col.l .r3 { margin-right: 26px; } .pg-team .tm-col.l .r2 { margin-right: 44px; }
  .pg-team .tm-col.r .r1, .pg-team .tm-col.r .r3 { margin-left: 26px; } .pg-team .tm-col.r .r2 { margin-left: 44px; }
}
.pg-team .tm-core { position: relative; z-index: 1; justify-self: center; width: calc(var(--core) - 16px); aspect-ratio: 1; cursor: pointer; }
.pg-team .tm-core svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.pg-team .tm-core .tk line { stroke: rgba(120, 200, 255, .38); stroke-width: .8; }
.pg-team .tm-core .tk { transform-origin: 100px 100px; animation: spin 90s linear infinite; }
.pg-team .tm-core .bd { fill: rgba(3, 9, 16, .85); stroke: rgba(120, 200, 255, .14); stroke-width: 7; }
.pg-team .tm-core .arc { fill: none; stroke: var(--holo); stroke-width: 2.2; stroke-dasharray: 64 40 18 40 92 260; stroke-linecap: round; transform-origin: 100px 100px; animation: spin 14s linear infinite; filter: drop-shadow(0 0 4px var(--holo)); }
.pg-team .tm-core .ds { fill: none; stroke: rgba(120, 200, 255, .3); stroke-dasharray: 1.5 4.5; transform-origin: 100px 100px; animation: spin 26s linear infinite reverse; }
.pg-team .tm-core .glow { transform-origin: 100px 100px; animation: pulse 3.4s ease-in-out infinite; }
.pg-team .tm-core:hover .bd { stroke: rgba(120, 200, 255, .3); }
.pg-team .tm-cc { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; text-align: center; pointer-events: none; }
.pg-team .tm-cc .l { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
.pg-team .tm-cc b { margin-top: 6px; font: 300 46px/1 var(--mono); letter-spacing: -.04em; color: #fff; text-shadow: none; }
.pg-team .tm-cc b small { font-size: 20px; margin-left: 2px; color: var(--holo-2); }
.pg-team .tm-cc .s { margin-top: 6px; font-size: 11.5px; color: var(--ink-2); }
.pg-team .tm-cc .m { margin-top: 2px; font: 400 11.5px var(--mono); color: var(--holo-2); }
@container (min-width: 900px) { .pg-team .tm-cc b { font-size: 68px; } .pg-team .tm-cc b small { font-size: 26px; } .pg-team .tm-cc .l { font-size: 11px; } .pg-team .tm-cc .s { font-size: 13px; } .pg-team .tm-cc .m { font-size: 12.5px; } }
.pg-team .tm-hero + .working-line { margin: 8px 4px 0; }
@container (max-width: 600px) {
  .pg-team .tm-hero { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 16px 12px; }
  .pg-team .tm-wires { display: none; }
  .pg-team .tm-col { display: contents; }
  .pg-team .tm-core { grid-column: 1 / -1; order: -1; width: 220px; margin-bottom: 8px; }
  .pg-team .tm-col .tm-pod { width: 100%; margin: 0 !important; justify-self: stretch; }
}

/* the tabs */
.pg-team .tm-tabs { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px 16px; flex-wrap: wrap; margin: 32px 0 16px; }
.pg-team .tm-tabs h2 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: -.01em; color: #fff; }
.pg-team .tm-tabs p { margin: 4px 0 0; font-size: 13px; color: var(--ink-3); }

/* everyone: compact cards that only ever stack */
.pg-team .tm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 12px; }
.pg-team .tm-card { display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 16px; border: 1px solid var(--line); background: var(--glass-fill), var(--noise) var(--glass-tint); cursor: pointer; min-width: 0; transition: border-color .15s, box-shadow .2s; }
.pg-team .tm-card:hover { border-color: rgba(70, 200, 255, .5); box-shadow: 0 0 30px -12px var(--holo-glow); }
.pg-team .tm-card.busy { border-color: rgba(70, 200, 255, .45); }
.pg-team .tm-ct { display: flex; align-items: center; gap: 12px; min-width: 0; }
.pg-team .tm-ct .tm-orb { grid-row: auto; flex: none; }
.pg-team .tm-ct div { min-width: 0; flex: 1; }
.pg-team .tm-ct div b { display: block; font-weight: 600; color: #fff; }
.pg-team .tm-ct div span { display: block; font-size: 12px; color: var(--ink-3); }
.pg-team .tm-ct .spark { flex: none; }
.pg-team .tm-does { margin: 0; font-size: 13px; line-height: 1.45; color: var(--ink-2); }
.pg-team .tm-k3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .015); }
.pg-team .tm-k3 > div { padding: 8px 10px; border-left: 1px solid var(--line); min-width: 0; }
.pg-team .tm-k3 > div:first-child { border-left: 0; }
.pg-team .tm-k3 b { display: block; font: 400 17px/1.25 var(--mono); letter-spacing: -.02em; color: #fff; white-space: nowrap; }
.pg-team .tm-k3 span { display: block; font-size: 11px; line-height: 1.3; color: var(--ink-3); }
.pg-team .tm-line { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--ink-2); min-width: 0; }
.pg-team .tm-line span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-team .tm-card.busy .tm-line.now { color: var(--holo-2); }
.pg-team .tm-line.need { color: var(--amber-ink); align-items: flex-start; }
.pg-team .tm-line.need .ldot { margin-top: 6px; }
.pg-team .tm-line.need span { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; }
.pg-team .tm-line.next { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); color: var(--ink-3); }
.pg-team .tm-line.next em { font-style: normal; font-family: var(--mono); color: var(--holo-2); white-space: nowrap; }

/* their day */
.pg-team .tl-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--ink-3); margin-bottom: 8px; }
.pg-team .tl-legend span { display: inline-flex; align-items: center; gap: 8px; }
.pg-team .tl-legend i { width: 16px; height: 10px; border-radius: 3px; }
.pg-team .tl { position: relative; margin-top: 16px; }
.pg-team .tl-axis, .pg-team .tl-lane { display: grid; grid-template-columns: 128px minmax(0, 1fr); }
.pg-team .tl-hours { position: relative; height: 24px; }
.pg-team .tl-hours span { position: absolute; top: 0; transform: translateX(-50%); font: 11px var(--mono); color: var(--ink-3); }
.pg-team .tl-hours span:first-child { transform: none; }
.pg-team .tl-lane { height: 38px; border-top: 1px solid rgba(120, 200, 255, .07); cursor: pointer; transition: background .15s; }
.pg-team .tl-lane:hover { background: rgba(70, 200, 255, .05); }
.pg-team .tl-who { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; padding-left: 4px; }
.pg-team .tl-who i { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; flex: none; background: var(--c); color: #fff; font: 600 10px var(--sans); font-style: normal; box-shadow: 0 0 0 1px rgba(120, 200, 255, .3); }
.pg-team .tl-who em { font-style: normal; font-weight: 400; color: var(--ink-3); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; }
.pg-team .tl-track { position: relative; height: 100%; }
.pg-team .tl-gl { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(120, 200, 255, .06); }
.pg-team .tl-b, .pg-team .tl-legend i { border: 1px solid transparent; }
.pg-team .tl-b { position: absolute; top: 7px; height: 22px; border-radius: 5px; overflow: hidden; min-width: 3px; }
.pg-team .tl-b.done, .pg-team .tl-legend i.done { background: linear-gradient(180deg, rgba(70, 200, 255, .42), rgba(70, 200, 255, .14)); border-color: rgba(70, 200, 255, .42); color: var(--ink); }
.pg-team .tl-b.doing, .pg-team .tl-legend i.doing { background: linear-gradient(180deg, #a6e6ff, rgba(70, 200, 255, .55)); border-color: var(--holo); color: #021422; box-shadow: 0 0 16px var(--holo-glow); }
.pg-team .tl-b.plan, .pg-team .tl-legend i.plan { background: rgba(70, 200, 255, .03); border: 1px dashed rgba(120, 200, 255, .3); color: var(--ink-3); }
.pg-team .tl-b:hover { border-color: var(--holo-2); }
.pg-team .tl-b span { display: block; padding: 0 6px; font-size: 11px; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-team .tl-dot, .pg-team .tl-legend i.dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px var(--holo); }
.pg-team .tl-dot { position: absolute; bottom: 2px; margin-left: -3px; }
.pg-team .tl-over { position: absolute; top: 0; bottom: 0; left: 128px; right: 0; pointer-events: none; }
.pg-team .tl-now { position: absolute; top: -4px; bottom: 0; width: 2px; margin-left: -1px; background: var(--holo); box-shadow: 0 0 12px var(--holo); }
.pg-team .tl-now b { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: var(--holo); color: #021422; font: 600 10.5px/18px var(--mono); letter-spacing: .06em; padding: 0 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 0 14px var(--holo-glow); }
.pg-team .tl-note { margin-top: 12px; font-size: 12.5px; color: var(--ink-3); }

/* who answers to who */
.pg-team .og { display: grid; justify-items: center; padding: 8px 0 4px; }
.pg-team .og-r { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 236px) minmax(0, 1fr); align-items: center; width: 100%; }
.pg-team .og-side { display: flex; align-items: center; min-width: 0; }
.pg-team .og-side.l { justify-content: flex-end; }
.pg-team .og-side .og-n { flex: 0 1 210px; }
.pg-team .og-ln { flex: 1 0 20px; max-width: 64px; border-top: 1px dashed rgba(120, 200, 255, .35); }
.pg-team .og-ln.p { border-top-color: rgba(255, 181, 71, .45); }
.pg-team .og-v { width: 1px; height: 24px; background: linear-gradient(180deg, rgba(70, 200, 255, .6), rgba(70, 200, 255, .2)); box-shadow: 0 0 6px var(--holo-glow); }
.pg-team .og-n { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--glass-fill), var(--noise) var(--glass-tint); text-align: left; min-width: 0; color: var(--ink); font: inherit; }
.pg-team .og-n.p { border-color: rgba(255, 181, 71, .28); }
.pg-team .og-n.ai { cursor: pointer; }
.pg-team .og-n.ai:hover, .pg-team .og-d:hover { border-color: rgba(70, 200, 255, .55); box-shadow: 0 0 26px -12px var(--holo-glow); }
.pg-team .og-n b { display: block; font-size: 14px; font-weight: 600; color: #fff; }
.pg-team .og-n .rl { font-size: 12px; color: var(--ink-3); }
.pg-team .og-n p { margin: 4px 0 0; font-size: 12px; line-height: 1.4; color: var(--ink-2); }
.pg-team .og-av { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; flex: none; color: #fff; font: 600 13px var(--sans); background: var(--c); box-shadow: 0 0 0 1.5px rgba(120, 200, 255, .35), 0 0 14px -4px var(--holo-glow); }
.pg-team .og-av.p { background: transparent; color: var(--amber-ink); box-shadow: inset 0 0 0 1.5px var(--amber), 0 0 14px -4px var(--amber-glow); }
.pg-team .og-desks { position: relative; display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; width: 100%; margin-top: 24px; }
.pg-team .og-desks::before { content: ""; position: absolute; top: -24px; left: calc(100% / 16); right: calc(100% / 16); border-top: 1px solid rgba(70, 200, 255, .4); }
.pg-team .og-d { position: relative; display: grid; justify-items: center; text-align: center; gap: 4px; padding: 12px 4px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); cursor: pointer; min-width: 0; color: var(--ink); font: inherit; }
.pg-team .og-d::before { content: ""; position: absolute; top: -25px; left: 50%; height: 24px; border-left: 1px solid rgba(70, 200, 255, .4); }
.pg-team .og-d b { font-size: 13px; font-weight: 600; color: #fff; }
.pg-team .og-d .rl { font-size: 11px; color: var(--ink-3); line-height: 1.3; }
.pg-team .og-key { display: flex; gap: 16px; justify-content: center; margin-top: 16px; font-size: 12px; color: var(--ink-3); }
.pg-team .og-key span { display: inline-flex; align-items: center; gap: 8px; }
.pg-team .og-key i { width: 12px; height: 12px; border-radius: 50%; background: var(--holo); box-shadow: 0 0 8px var(--holo); }
.pg-team .og-key i.p { background: transparent; box-shadow: inset 0 0 0 1.5px var(--amber); }
.pg-team .so { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line); }
.pg-team .so h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #fff; flex-wrap: wrap; }
.pg-team .so h4 .og-av { width: 24px; height: 24px; font-size: 11px; }
.pg-team .so h4 .chip { cursor: pointer; }
.pg-team .so ul { margin: 0; padding-left: 18px; font-size: 13px; color: var(--ink-2); display: grid; gap: 4px; }
@container (max-width: 999px) { .pg-team .tl-b span, .pg-team .tl-hours span.odd, .pg-team .tl-who em { display: none; } .pg-team .tl-axis, .pg-team .tl-lane { grid-template-columns: 96px minmax(0, 1fr); } .pg-team .tl-over { left: 96px; } }
@container (max-width: 760px) {
  .pg-team .og-desks { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 12px; }
  .pg-team .og-desks::before, .pg-team .og-d::before { display: none; }
  .pg-team .so { grid-template-columns: minmax(0, 1fr); }
}
@container (max-width: 600px) {
  .pg-team .og-r { display: flex; flex-direction: column; gap: 8px; }
  .pg-team .og-r > span:empty { display: none; }
  .pg-team .og-side { order: 2; width: 100%; }
  .pg-team .og-side .og-n, .pg-team .og-r > .og-n { flex: 1 1 auto; width: 100%; }
  .pg-team .og-ln { display: none; }
  .pg-team .tl-axis, .pg-team .tl-lane { grid-template-columns: 66px minmax(0, 1fr); }
  .pg-team .tl-over { left: 66px; }
  .pg-team .tl-who em, .pg-team .tl-b span, .pg-team .tl-hours span.odd { display: none; }
}`,

  render(host, ctx) {
    const M = ctx.model, E = M.employees, D = ctx.data, L = ctx.local;
    const tab = L.tab || "everyone";
    const st = Object.fromEntries(AGENTS.map((a) => [a.id, ctx.status(a.id) || { text: "" }]));
    const busyN = AGENTS.filter((a) => st[a.id].busy).length;
    const needs = Object.fromEntries(AGENTS.map((a) => [a.id, M.needs.filter((n) => n.agent === a.id)]));
    const state = (id) => (st[id].alert ? "alert" : st[id].busy ? "busy" : "");
    const dotOf = (id) => (st[id].alert ? "bad" : st[id].busy ? "busy" : needs[id].length ? "need" : "");
    const orb = (id, extra = "") => `<span class="tm-orb" style="--c:${BY_ID[id].color}" aria-hidden="true">${BY_ID[id].name[0]}${extra}</span>`;

    // ---------- the hero: ten around the core
    const pod = (id, i, side) => {
      const a = BY_ID[id], k = E[id].kpis[0], nd = needs[id];
      const tip = `${a.name}, ${a.role.toLowerCase()}: ${k.value} ${k.label}. ${k.working}.${nd.length ? ` Waiting on ${nd.map((n) => `${n.who}: ${n.what}`).join("; ")}.` : ""}`;
      return `<button class="tm-pod ${side} r${i} ${state(id)} ${nd.length ? "need" : ""}" data-open="${id}" data-tip="${esc(tip)}">
        ${orb(id, nd.length ? `<i class="nb">${nd.length}</i>` : "")}
        <span class="tm-nm"><b>${esc(a.name)}</b><em>${esc(k.value)}</em></span>
        <span class="tm-kl">${esc(k.label)}</span>
        <span class="tm-st"><i class="ldot ${dotOf(id)}"></i><span>${esc(st[id].text || a.does)}</span></span>
      </button>`;
    };
    const hero = `<section class="card hud tm-hero">
        <svg class="tm-wires" aria-hidden="true"></svg>
        <span class="tm-grp l">The office</span><span class="tm-grp r">Marketing and management</span>
        <div class="tm-col l">${LEFT.map((id, i) => pod(id, i, "l")).join("")}</div>
        <div class="tm-core" data-go="overview" data-tip="${esc(M.last7.working.hours)}">${coreSvg()}
          <div class="tm-cc"><span class="l"><i class="ldot ${busyN ? "busy" : "good"}"></i>${AGENTS.length} on shift</span>
            <b data-count="${M.last7.hours}">${M.last7.hours}<small>h</small></b>
            <span class="s">given back, last 7 days</span>
            <span class="m">${busyN ? `${busyN} working right now` : `${money(M.last7.money_saved, 0)} of office time`}</span></div>
        </div>
        <div class="tm-col r">${RIGHT.map((id, i) => pod(id, i, "r")).join("")}</div>
      </section>${working(M.last7.working.money_saved)}`;

    // ---------- everyone
    const cardOf = (a) => {
      const id = a.id, e = E[id], nd = needs[id], nx = nextUp(id, ctx);
      return `<article class="tm-card ${state(id)}" data-open="${id}">
        <div class="tm-ct">${orb(id, nd.length ? `<i class="nb">${nd.length}</i>` : "")}<div><b>${esc(a.name)}</b><span>${esc(a.role)}</span></div><span data-tip="${esc(`${e.units_label}, each of the last 12 weeks`)}">${spark(e.units, { w: 72, h: 26 })}</span></div>
        <p class="tm-does">${esc(a.does)}</p>
        <div class="tm-k3">${e.kpis.map((k) => `<div data-tip="${esc(k.working)}"><b>${esc(k.value)}</b><span>${esc(k.label)}</span></div>`).join("")}</div>
        <div class="tm-line now"><i class="ldot ${st[id].alert ? "bad" : st[id].busy ? "busy" : ""}"></i><span>${esc(st[id].text || "At their desk")}</span></div>
        ${nd.map((n) => `<div class="tm-line need"><i class="ldot need"></i><span>Waiting on ${esc(n.who)} · ${esc(n.what)} · ${since(n.mins)}</span></div>`).join("")}
        ${nx ? `<div class="tm-line next"><em>${esc(nx.when)}</em><span>${esc(nx.title)}</span></div>` : ""}
      </article>`;
    };
    const everyone = `<div class="tm-cards">${AGENTS.map(cardOf).join("")}</div>`;

    // ---------- their day: one lane each, 07:00 to 18:00 (or later if it's evening)
    const nm = nowMin(), startM = 7 * 60, endM = Math.max(18 * 60, Math.min(22 * 60, Math.ceil((nm + 30) / 60) * 60)), span = endM - startM;
    const X = (m) => ((Math.max(startM, Math.min(endM, m)) - startM) / span) * 100;
    const hoursAt = []; for (let m = startM; m <= endM; m += 60) hoursAt.push(m);
    const live = liveLines(ctx), nowOn = nm >= startM && nm <= endM;
    const lane = (a) => {
      const bl = blocks(ctx, a.id, nm).filter((b) => b.f < endM);
      const dots = live.filter((l) => l.agent === a.id && minOf(l.at) >= startM && minOf(l.at) <= endM);
      return `<div class="tl-lane" data-open="${a.id}">
        <div class="tl-who"><i style="--c:${a.color}">${a.name[0]}</i>${esc(a.name)}<em>${esc(a.role)}</em></div>
        <div class="tl-track">${hoursAt.map((m) => `<i class="tl-gl" style="left:${X(m)}%"></i>`).join("")}
          ${bl.map((b) => { const tip = `${b.from}–${b.to} · ${b.what}${b.n ? ` (${b.n.toLocaleString("en-GB")} ${b.unit})` : ""}${b.st === "plan" ? " (still to come)" : b.st === "doing" ? " (doing now)" : ""}`; return `<div class="tl-b ${b.st}" style="left:${X(b.f)}%;width:${X(b.t) - X(b.f)}%" data-tip="${esc(tip)}">${b.t - b.f >= 55 ? `<span>${esc(b.what)}</span>` : ""}</div>`; }).join("")}
          ${dots.map((l) => `<i class="tl-dot" style="left:${X(minOf(l.at))}%" data-tip="${esc(`${hhmm(l.at)} · ${l.text.length > 90 ? l.text.slice(0, 88) + "…" : l.text}`)}"></i>`).join("")}
        </div></div>`;
    };
    const day = `<section class="card">
        <div class="tl-legend"><span><i class="done"></i>Done</span><span><i class="doing"></i>Doing now</span><span><i class="plan"></i>Still to come</span><span><i class="dot"></i>Live today</span></div>
        <div class="tl">
          <div class="tl-axis"><div></div><div class="tl-hours">${hoursAt.map((m, i) => (nowOn && Math.abs(m - nm) < (span / 14) * 1.7 ? "" : `<span class="${i % 2 ? "odd" : ""}" style="left:${X(m)}%">${clock(m)}</span>`)).join("")}</div></div>
          <div style="position:relative">${AGENTS.map(lane).join("")}<div class="tl-over">${nowOn ? `<div class="tl-now" style="left:${X(nm)}%"><b>NOW ${clock(nm)}</b></div>` : ""}</div></div>
        </div>
        ${!nowOn ? `<div class="tl-note">${nm < startM ? "The office opens at 07:00. Everything above is today's plan." : "The office day is done. Everything above is what got finished today."}</div>` : ""}
      </section>`;

    // ---------- who answers to who
    const O = D.org || {};
    const pnode = (k) => { const p = O[k] || {}; return `<div class="og-n p"><span class="og-av p" aria-hidden="true">${esc((p.name || "?")[0])}</span><div><b>${esc(p.name)}</b><span class="rl">${esc(p.role)}</span><p>${esc(p.does)}</p></div></div>`; };
    const anode = (id, does) => `<button class="og-n ai" data-open="${id}"><span class="og-av" style="--c:${BY_ID[id].color}" aria-hidden="true">${BY_ID[id].name[0]}</span><div><b>${esc(BY_ID[id].name)}</b><span class="rl">${esc(BY_ID[id].role)}</span><p>${esc(does)}</p></div></button>`;
    const waitN = { kieran: M.needs_total.kieran, priya: M.needs_total.priya, tom: M.needs_total.tom };
    const org = `<section class="card"><div class="og">
        <div class="og-r"><span></span>${pnode("kieran")}<span></span></div>
        <i class="og-v"></i>
        <div class="og-r"><div class="og-side l">${pnode("tom")}<span class="og-ln p"></span></div>${pnode("priya")}<span></span></div>
        <i class="og-v"></i>
        <div class="og-r"><span></span>${anode("manager", O.maeve_does || "")}<div class="og-side r"><span class="og-ln"></span>${anode("coach", O.kit_does || "")}</div></div>
        <i class="og-v"></i>
        <div class="og-desks">${(O.desks || []).map((id) => `<button class="og-d" data-open="${id}"><span class="og-av" style="--c:${BY_ID[id].color}" aria-hidden="true">${BY_ID[id].name[0]}</span><b>${esc(BY_ID[id].name)}</b><span class="rl">${esc(BY_ID[id].role)}</span></button>`).join("")}</div>
        <div class="og-key"><span><i></i>AI employee</span><span><i class="p"></i>Person</span></div>
      </div>
      <div class="so">${(D.sign_off || []).map((s) => `<div><h4><span class="og-av p" aria-hidden="true">${esc((O[s.who]?.name || "?")[0])}</span>${esc(O[s.who]?.name || s.who)} signs off${waitN[s.who] ? `<span class="chip amber" data-go="handoffs" data-tip="${esc(M.needs.filter((n) => n.who.toLowerCase() === s.who).map((n) => n.what).join(" · "))}">${waitN[s.who]} waiting now</span>` : ""}</h4><ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>
    </section>`;

    const TABS = {
      everyone: ["Everyone", "What each of them does, their numbers for the last 7 days, and what they're on next.", everyone],
      day: ["Their day", `${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}. Solid blocks are done, dashed ones are still to come.`, day],
      org: ["Who answers to who", "The AI team works for Priya and Kieran. Nothing reaches a customer, and nothing is paid, until a person says so.", org],
    };
    const [, sub, body] = TABS[tab] || TABS.everyone;

    host.innerHTML = `<div class="inner pg-team">
      <header class="tm-hh"><div><h1>The team</h1><p class="lede">Ten AI employees running Kingpost's office and marketing. Click anyone to see their work.</p></div></header>
      ${hero}
      <div class="tm-tabs"><div><h2>${esc(TABS[tab]?.[0] || "Everyone")}</h2><p>${esc(sub)}</p></div>${seg(Object.entries(TABS).map(([k, v]) => [k, v[0]]), tab, "tab")}</div>
      ${body}
      ${foot()}
    </div>`;

    // ---------- wiring
    $$("[data-open]", host).forEach((el) => (el.onclick = () => open(ctx, el.dataset.open)));
    $$("[data-tab]", host).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; ctx.redraw(); }));
    wire(host);
    if (ro) ro.disconnect();
    const hero$ = $(".tm-hero", host);
    if (hero$ && window.ResizeObserver) { ro = new ResizeObserver(() => wire(host)); ro.observe(hero$); }
    document.fonts?.ready.then(() => wire(host));
    // keep the "now" line and the done / still-to-come blocks moving
    clearInterval(timer); timer = setInterval(() => ctx.redraw(), 60000);
  },
  onEvent(ev) { return !["relayPartial", "docPartial", "progress", "partial"].includes(ev.type) && !(ev.type === "act" && ev.page !== "team"); },
  leave() { clearInterval(timer); timer = null; if (ro) ro.disconnect(); ro = null; },
};
