// Training (video 9): Kit's desk. Every correction becomes a one-line rule, so the same mistake doesn't happen twice.
// Hero: mistakes falling week by week, the rules in force (live), and "Correct someone" (reaches all ten).
// Figures: corrections, rules added and rules in force come from ctx.model (employees.coach); work per week is the
// sum of every employee's units in the model. The rules list is the library + this week's rules + live ones, so its
// length is exactly the "rules in force" counter.
import { esc, num, av, who, chip, head, hbars, note, empty, foot, working, dayDate, short, dayName, $, $$, BY_ID, AGENTS , stillMotion } from "../ui.js";
import { liveInline } from "../live-note.js"; // site demo

const CAT = {
  edit: "Someone changed a draft", monday: "Tom's Monday check", mistake: "A mistake was caught", priya: "Priya told them",
  taught: "A colleague passed it on", kit: "Kit spotted it", correction: "Priya answered a question", review: "Their own look back",
};
const BY_NAME = Object.fromEntries(AGENTS.map((a) => [a.name, a.id]));
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const r1 = (v) => Math.round(v * 10) / 10;
const lastFriday = () => { const d = (new Date().getDay() - 5 + 7) % 7; return d === 0 ? -7 : -d; };

let drawn = false, shown = null; // first draw animates; the counter ticks from what it last showed

function whenText(t) {
  const days = Math.round((today0() - new Date(t).setHours(0, 0, 0, 0)) / 864e5);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? dayName(new Date(t)) : short(new Date(t));
}
function catOf(cameFrom = "") {
  const s = cameFrom.toLowerCase();
  if (s.includes("tom")) return "monday";
  if (s.includes("changed")) return "edit";
  if (s.includes("passed it on")) return "taught";
  if (s.includes("mistake")) return "mistake";
  return "priya";
}
// every rule in force: live lessons, this week's rules (coach.json) and the library (this page's data)
function allRules(ctx, hideFrom) {
  const D = ctx.data, F = ctx.F, out = [];
  for (const l of ctx.lessons.slice().reverse()) {
    if (hideFrom && l.at >= hideFrom) continue; // still being written: it lands when Kit's done
    const cat = CAT[l.source] ? l.source : "priya";
    const detail = l.source === "edit" ? "Priya changed a draft" : l.source === "taught" ? `${BY_ID[l.from]?.name || l.from || "A colleague"} passed it on` : CAT[cat];
    out.push({ key: `L:${l.id}`, id: l.id, agent: l.agent, text: l.text, cat, detail, at: l.at, used: l.used || 0, story: l.why || "Learned live in the office.", live: true });
  }
  (F.coach?.rules_this_week || []).forEach((r, i) => out.push({ key: `W:${i}`, agent: r.agent, text: r.rule, cat: catOf(r.came_from), detail: r.came_from, at: dayDate(r.day_offset).getTime(), used: D.this_week_used?.[i] ?? 0, story: `Came from: ${r.came_from}.`, fresh: true }));
  (D.library || []).forEach((r, i) => out.push({ key: `B:${i}`, agent: r.agent, text: r.text, cat: r.source, detail: r.detail, at: dayDate(r.day_offset).getTime(), used: r.used, story: r.story }));
  return out;
}

// smooth line through points (0..100 space)
function smooth(p) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    d += ` C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`;
  }
  return d;
}
// the hero: one big glowing falling line
function fallChart(weeks, kitAt, anim) {
  const n = weeks.length, hi = Math.max(...weeks.map((w) => w.v)) * 1.6;
  const X = (i) => 2 + (i / (n - 1)) * 94, Y = (v) => 4 + (1 - v / hi) * 92;
  const pts = weeks.map((w, i) => [r1(X(i)), r1(Y(w.v))]), d = smooth(pts), first = weeks[0], last = weeks[n - 1];
  const grid = [0.25, 0.5, 0.75].map((k) => `<i class="gl" style="top:${4 + k * 92}%"><span>${Math.round(hi * (1 - k))}</span></i>`).join("");
  return `<div class="tr-plot ${anim ? "anim" : ""}">${grid}
    <div class="tr-kit" style="left:${X(kitAt)}%;top:${Y(weeks[kitAt].v)}%"><span>Kit starts</span></div>
    <i class="tr-lead a" style="left:${X(0)}%;height:${Y(first.v)}%"></i><i class="tr-lead z" style="left:${X(n - 1)}%;height:${Y(last.v)}%"></i>
    <div class="tr-draw"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="trArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--holo)" stop-opacity=".24"/><stop offset="1" style="stop-color:var(--holo)" stop-opacity="0"/></linearGradient>
        <linearGradient id="trLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--red)"/><stop offset=".38" style="stop-color:var(--holo)"/><stop offset="1" style="stop-color:var(--holo-2)"/></linearGradient>
      </defs>
      <path d="${d} L${pts[n - 1][0]},100 L${pts[0][0]},100 Z" fill="url(#trArea)"/>
      <path d="${d}" fill="none" stroke="url(#trLine)" stroke-width="14" stroke-opacity=".16" vector-effect="non-scaling-stroke" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="url(#trLine)" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linecap="round" class="tr-ln"/>
    </svg></div>
    ${weeks.map((w, i) => `<div class="tr-pt ${i === 0 ? "a" : i === n - 1 ? "z" : ""}" style="left:${X(i)}%;top:${Y(w.v)}%;--d:${i * 90}ms" data-tip="${esc(w.tip)}"><i></i></div>`).join("")}
    <div class="tr-pin a" style="left:${X(0)}%"><b class="num">${first.v}</b><span>a week, before Kit</span></div>
    <div class="tr-pin z" style="left:${X(n - 1)}%"><b class="num">${last.v}</b><span>last 7 days</span></div>
  </div>
  <div class="tr-xl"><span>${esc(weeks[0].l)}</span><span>${esc(weeks[Math.round((n - 1) / 2)].l)}</span><span>last 7 days</span></div>`;
}

function ruleRow(r, { open = false, born = false } = {}) {
  return `<div class="tr-rule ${open ? "open" : ""} ${born ? "born" : ""}" data-rule="${esc(r.key)}" role="button" tabindex="0">
    ${av(r.agent)}
    <div class="tr-rt"><div class="tr-tx"><b>${esc(BY_ID[r.agent]?.name || r.agent)}</b> ${esc(r.text)}</div>
      <div class="tr-meta">${chip(r.detail || CAT[r.cat] || "")}<span>${esc(whenText(r.at))}</span>${r.live ? chip("Added live", "holo") : r.fresh ? chip("This week") : ""}</div>
      <div class="tr-story"><p>${esc(r.story || "")}</p><div class="s">${esc(CAT[r.cat] || "")} · in force since ${esc(short(new Date(r.at)))} · followed ${num(r.used)} time${r.used === 1 ? "" : "s"}</div></div></div>
    <div class="tr-used"><b class="num">${num(r.used)}</b><span>${r.used === 1 ? "use" : "uses"}</span></div></div>`;
}

function report(r, running) {
  if (!r) return "";
  const nm = (n) => { const id = BY_NAME[n] || (BY_ID[n] ? n : null); return id ? `${av(id)}<b>${esc(BY_ID[id].name)}</b>` : `<b>${esc(n || "")}</b>`; };
  return `<div class="tr-rep ${running ? "typing" : ""}">
    <h2>${esc(r.headline || "")}</h2>
    ${(r.improved || []).length ? `<h4>What got better</h4><div class="tr-rl">${r.improved.map((x) => `<div class="g">${nm(x?.agent)}<span>${esc(x?.what || "")}</span></div>`).join("")}</div>` : ""}
    ${(r.new_rules || []).length ? `<h4>New rules${r.rules_added > r.new_rules.length ? ` · ${r.new_rules.length} of the ${r.rules_added} added that week` : ""}</h4><div class="tr-rl">${r.new_rules.map((x) => `<div>${nm(x?.agent)}<span>${esc(x?.rule || "")}${x?.because ? `<em> ${esc(x.because)}</em>` : ""}</span></div>`).join("")}</div>` : ""}
    ${(r.watching || []).length ? `<h4>Still working on</h4><ul>${r.watching.map((x) => `<li>${esc(x || "")}</li>`).join("")}</ul>` : ""}
    ${r.for_tom ? note(`<b>For Tom's Monday check.</b> ${esc(r.for_tom)}`, "amber") : ""}
  </div>`;
}

// the sentence flies from the box into the rules list
function fly(text, from, host, done) {
  const to = $("#tr-pending", host)?.getBoundingClientRect();
  if (!to || !from) return done(); // plays even with Reduce motion on: this is the moment Tom films
  const el = document.createElement("div");
  el.textContent = `“${text}”`;
  Object.assign(el.style, { position: "fixed", zIndex: 60, left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, display: "flex", alignItems: "center", padding: "0 16px", borderRadius: "12px", background: "var(--panel-2)", border: "1px solid var(--holo)", color: "var(--ink)", font: "500 15px/1.3 var(--sans)", boxShadow: "0 0 40px -6px var(--holo-glow), inset 0 0 18px -8px var(--holo)", pointerEvents: "none", transformOrigin: "0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", boxSizing: "border-box" });
  document.body.appendChild(el);
  const dx = to.left - from.left, dy = to.top - from.top, sx = Math.min(1, to.width / from.width), sy = Math.min(1.4, to.height / from.height);
  const a = el.animate([
    { transform: "translate(0,0) scale(1,1)", opacity: 1 },
    { transform: `translate(${dx * 0.4}px, ${dy * 0.5 - 36}px) scale(${(1 + sx) / 2}, ${(1 + sy) / 2})`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.15 },
  ], { duration: 900, easing: "cubic-bezier(.5,0,.2,1)" });
  a.onfinish = () => { el.remove(); done(); };
}
// the counter ticks up to its new value
function tick(el, from, to) {
  if (!el) return;
  if (from === to) { el.textContent = num(to); return; }
  if (stillMotion()) { el.textContent = num(to); return; } // site demo: Reduce Motion draws the final figure
  el.classList.add("bump");
  const t0 = performance.now(), dur = from === 0 ? 1000 : 700;
  let done = false; const land = () => { if (done) return; done = true; el.textContent = num(to); setTimeout(() => el.classList.remove("bump"), 500); };
  const step = (t) => { if (done) return; const k = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3); el.textContent = num(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); else land(); };
  el.textContent = num(from); requestAnimationFrame(step); setTimeout(land, dur + 150); // a timer lands it if frames stall
}

export default {
  css: `
  .pg-training .tr-hero { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); grid-template-areas: "fall force" "teach teach"; gap: 16px; }
  .pg-training .tr-fall { grid-area: fall; display: flex; flex-direction: column; }
  .pg-training .tr-force { grid-area: force; display: flex; flex-direction: column; }
  .pg-training .tr-teach { grid-area: teach; }
  @container (max-width: 820px) { .pg-training .tr-hero { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); grid-template-areas: "teach teach" "fall force"; } .pg-training .tr-news > .tr-nr:nth-child(n+3) { display: none; } .pg-training .tr-plot { min-height: 180px; } }
  @container (max-width: 600px) { .pg-training .tr-hero { grid-template-columns: minmax(0, 1fr); grid-template-areas: "fall" "teach" "force"; } .pg-training .tr-news > .tr-nr:nth-child(n+3) { display: grid; } }

  .pg-training .tr-drop { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px; background: var(--green-tint); border: 1px solid rgba(63, 224, 160, .35); color: var(--green); font: 500 12px var(--mono); white-space: nowrap; }
  .pg-training .tr-drop svg { width: 10px; height: 10px; }
  .pg-training .tr-plot { position: relative; flex: 1; min-height: 210px; margin: 16px 4px 0 28px; }
  .pg-training .tr-plot .gl { position: absolute; left: 0; right: 0; height: 1px; background: rgba(120, 200, 255, .07); }
  .pg-training .tr-plot .gl span { position: absolute; right: 100%; transform: translateY(-50%); padding-right: 8px; font: 10.5px var(--mono); color: var(--ink-3); }
  .pg-training .tr-draw { position: absolute; inset: 0; }
  .pg-training .tr-draw svg { width: 100%; height: 100%; overflow: visible; display: block; }
  .pg-training .tr-ln { filter: drop-shadow(0 0 6px rgba(70, 200, 255, .75)); }
  .pg-training .tr-kit { position: absolute; bottom: 0; border-left: 1px dashed rgba(166, 230, 255, .4); }
  .pg-training .tr-kit span { position: absolute; bottom: 6px; left: 8px; font: 600 12.5px var(--sans); letter-spacing: 0; text-transform: none; color: var(--holo-2); white-space: nowrap; }
  .pg-training .tr-lead { position: absolute; top: 0; width: 0; border-left: 1px dashed; }
  .pg-training .tr-lead.a { border-color: rgba(255, 97, 104, .45); }
  .pg-training .tr-lead.z { border-color: rgba(166, 230, 255, .55); }
  .pg-training .tr-pt { position: absolute; width: 18px; height: 18px; transform: translate(-50%, -50%); display: grid; place-items: center; }
  .pg-training .tr-pt i { width: 5px; height: 5px; border-radius: 50%; background: var(--holo-2); opacity: .55; }
  .pg-training .tr-pt:hover i { opacity: 1; background: var(--ink); box-shadow: 0 0 10px var(--holo); }
  .pg-training .tr-pt.a i { width: 9px; height: 9px; opacity: 1; background: var(--red); box-shadow: 0 0 0 3px rgba(255, 97, 104, .2), 0 0 14px var(--red); }
  .pg-training .tr-pt.z i { width: 12px; height: 12px; opacity: 1; background: var(--holo-2); box-shadow: 0 0 0 4px rgba(70, 200, 255, .22), 0 0 20px var(--holo); }
  .pg-training .tr-pt.z::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid var(--holo); animation: trPing 2.4s ease-out infinite; }
  @keyframes trPing { from { transform: scale(.4); opacity: .9; } to { transform: scale(1.6); opacity: 0; } }
  .pg-training .tr-pin { position: absolute; top: -4px; pointer-events: none; display: grid; line-height: 1; }
  .pg-training .tr-pin b { font: 300 44px/1 var(--mono); letter-spacing: -0.04em; }
  .pg-training .tr-pin span { margin-top: 6px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; white-space: nowrap; }
  .pg-training .tr-pin.a { padding-left: 12px; }
  .pg-training .tr-pin.a b { color: var(--ink-2); text-decoration: line-through; text-decoration-color: rgba(255, 97, 104, .7); text-decoration-thickness: 2px; }
  .pg-training .tr-pin.a span { color: var(--red); }
  .pg-training .tr-pin.z { transform: translateX(-100%); padding-right: 12px; text-align: right; justify-items: end; }
  .pg-training .tr-pin.z b { font-size: 64px; color: var(--ink); text-shadow: none; }
  .pg-training .tr-pin.z span { color: var(--holo-2); }
  .pg-training .tr-xl { display: flex; justify-content: space-between; margin: 10px 4px 0 28px; font: 10.5px var(--mono); color: var(--ink-3); }
  .pg-training .tr-plot.anim .tr-draw { animation: trReveal 1.8s cubic-bezier(.35, .1, .2, 1) both; }
  .pg-training .tr-plot.anim .tr-pt { animation: trFade .4s ease both; animation-delay: calc(var(--d) + 200ms); }
  .pg-training .tr-plot.anim .tr-pin, .pg-training .tr-plot.anim .tr-lead.z { animation: trUp .6s cubic-bezier(.2, .8, .2, 1) both; animation-delay: 1.5s; }
  .pg-training .tr-plot.anim .tr-pin.a, .pg-training .tr-plot.anim .tr-lead.a { animation-delay: .3s; }
  @keyframes trReveal { from { clip-path: inset(-20% 100% -20% 0); } to { clip-path: inset(-20% -2% -20% 0); } }
  @keyframes trFade { from { opacity: 0; } }
  @keyframes trUp { from { opacity: 0; translate: 0 8px; } }

  .pg-training .tr-force .tr-n { display: flex; align-items: baseline; gap: 12px; margin-top: 4px; }
  .pg-training .tr-force .tr-n b { font: 300 76px/1 var(--mono); letter-spacing: -0.05em; color: var(--ink); text-shadow: none; transition: text-shadow .3s, color .3s; }
  .pg-training .tr-force .tr-n b.bump { color: var(--holo-2); text-shadow: none; }
  .pg-training .tr-force .tr-n span { font-size: 13px; color: var(--ink-2); line-height: 1.4; max-width: 210px; }
  .pg-training .tr-need { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px 12px; border-radius: 10px; background: var(--amber-tint); border: 1px solid rgba(255, 181, 71, .28); color: var(--amber-ink); font-size: 12.5px; cursor: pointer; }
  .pg-training .tr-need:hover { border-color: var(--amber); }
  .pg-training .tr-need b { font-weight: 600; }
  .pg-training .tr-need em { margin-left: auto; font-style: normal; opacity: .8; }
  .pg-training .tr-newh { margin: 16px 0 6px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); display: flex; justify-content: space-between; }
  .pg-training .tr-newh button { border: 0; background: none; color: var(--holo-2); font: inherit; letter-spacing: .1em; cursor: pointer; padding: 0; }
  .pg-training .tr-news { display: grid; gap: 6px; }
  .pg-training .tr-nr { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 10px; align-items: start; padding: 8px 10px; border-radius: 10px; border: 1px solid rgba(120, 200, 255, .07); background: rgba(255, 255, 255, .02); font-size: 12.5px; line-height: 1.4; color: var(--ink-2); min-height: 48px; }
  .pg-training .tr-nr .av-s { margin: 0; }
  .pg-training .tr-nr p { margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pg-training .tr-nr p b { color: var(--ink); font-weight: 600; margin-right: 4px; }
  .pg-training .tr-nr.live { border-color: rgba(70, 200, 255, .3); background: var(--holo-tint); }
  .pg-training .tr-nr.born { animation: trBorn 1.6s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes trBorn { 0% { opacity: 0; transform: translateY(-8px); box-shadow: 0 0 0 1px var(--holo), 0 0 40px var(--holo-glow); background: rgba(70, 200, 255, .3); } 40% { opacity: 1; transform: none; box-shadow: 0 0 0 1px var(--holo), 0 0 34px var(--holo-glow); } }
  .pg-training .tr-nr.pending { opacity: 0; border-color: var(--holo); background: var(--holo-tint); box-shadow: 0 0 24px -10px var(--holo-glow); }
  .pg-training .tr-nr.pending.in { opacity: 1; transition: opacity .25s; }
  .pg-training .tr-nr.pending .kp-dot { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--holo-tint); box-shadow: inset 0 0 0 1px var(--holo); }
  .pg-training .tr-nr.pending .kp-dot i { width: 8px; height: 8px; border-radius: 50%; background: var(--holo); box-shadow: 0 0 10px var(--holo); animation: pulse 1.2s ease-in-out infinite; }
  .pg-training .tr-nr.pending small { display: block; color: var(--ink-3); font-size: 11.5px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .pg-training .tr-teach { padding: 16px 20px; }
  .pg-training .tr-tg { display: grid; grid-template-columns: minmax(0, 220px) minmax(0, 1fr) auto; grid-template-areas: "tl in ten" ". said said" ". ex ex"; gap: 8px 20px; align-items: center; }
  .pg-training .tr-tl { grid-area: tl; } .pg-training .tr-in { grid-area: in; } .pg-training .tr-ten { grid-area: ten; } .pg-training .tr-said { grid-area: said; } .pg-training .tr-ex { grid-area: ex; }
  .pg-training .tr-tl b { display: block; font-size: 15px; font-weight: 600; color: var(--ink); }
  .pg-training .tr-tl span { font-size: 12.5px; color: var(--ink-3); line-height: 1.4; display: block; }
  .pg-training .tr-in { display: flex; gap: 8px; height: 48px; padding: 4px 4px 4px 16px; align-items: center; border-radius: 14px; border: 1px solid var(--line-2); background: rgba(0, 0, 0, .22); box-shadow: inset 0 0 24px -16px var(--holo); transition: border-color .15s, box-shadow .15s; min-width: 0; }
  .pg-training .tr-in:focus-within { border-color: var(--holo); box-shadow: 0 0 0 3px var(--holo-tint), 0 0 30px -12px var(--holo-glow); }
  .pg-training .tr-in svg { width: 16px; height: 16px; color: var(--holo); flex: none; }
  .pg-training .tr-in input { flex: 1; min-width: 0; height: 100%; border: 0; background: none; box-shadow: none; outline: 0; font-size: 14.5px; padding: 0; }
  .pg-training .tr-in .btn { height: 40px; border-radius: 10px; }
  .pg-training .tr-ten { display: flex; align-items: center; }
  .pg-training .tr-ten .av-s { width: 22px; height: 22px; font-size: 9px; margin: 0 0 0 -5px; box-shadow: 0 0 0 2px var(--panel); transition: box-shadow .3s, transform .3s; }
  .pg-training .tr-ten .av-s:first-child { margin-left: 0; }
  .pg-training .tr-ten.scan .av-s { animation: trScan 1.6s ease-in-out infinite; }
  @keyframes trScan { 50% { box-shadow: 0 0 0 2px var(--holo), 0 0 12px var(--holo); transform: translateY(-2px); } }
  .pg-training .tr-ten .av-s.hit { box-shadow: 0 0 0 2px var(--holo), 0 0 14px var(--holo); transform: translateY(-3px); z-index: 1; }
  .pg-training .tr-tenl { font-size: 11px; color: var(--ink-3); white-space: nowrap; margin-right: 10px; letter-spacing: .04em; }
  .pg-training .tr-ex { display: flex; flex-wrap: nowrap; gap: 6px; align-items: center; min-width: 0; overflow: hidden; }
  .pg-training .tr-ex > span { font-size: 12.5px; color: var(--ink-3); letter-spacing: 0; text-transform: none; margin-right: 4px; }
  .pg-training .tr-ex button { flex: 0 1 auto; min-width: 0; height: 26px; padding: 0 10px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); border-radius: 999px; font-size: 12px; color: var(--ink-2); cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pg-training .tr-ex button:hover { border-color: rgba(70, 200, 255, .5); color: var(--ink); background: var(--holo-tint); }
  .pg-training .tr-said { font-size: 13px; color: var(--ink-2); display: flex; gap: 8px; align-items: center; }
  .pg-training .tr-said b { color: var(--holo-2); font-weight: 500; }
  @container (max-width: 980px) { .pg-training .tr-tg { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "tl ten" "in in" "said said" "ex ex"; gap: 10px 16px; } .pg-training .tr-tl span { display: inline; margin-left: 8px; } .pg-training .tr-tl b { display: inline; } .pg-training .tr-tenl { display: none; } }
  @container (max-width: 820px) { .pg-training .tr-tl span { display: none; } }
  @container (max-width: 600px) { .pg-training .tr-tg { grid-template-columns: minmax(0, 1fr); grid-template-areas: "tl" "in" "said" "ex"; } .pg-training .tr-ten { display: none; } .pg-training .tr-in { height: auto; flex-wrap: wrap; padding: 8px; } .pg-training .tr-in input { height: 36px; flex-basis: calc(100% - 30px); } .pg-training .tr-in .btn { width: 100%; } .pg-training .tr-ex button:nth-child(n+4) { display: none; } }

  .pg-training .tr-tabs { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 32px 0 16px; }
  .pg-training .tr-tabs h2 { margin: 0; font-size: 18px; font-weight: 500; letter-spacing: -0.01em; color: var(--ink); }
  .pg-training .tr-tabs .seg em { font-style: normal; font-family: var(--mono); color: var(--holo-2); margin-left: 4px; }
  .pg-training .tr-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
  .pg-training .tr-q { height: 32px; width: 220px; max-width: 100%; padding: 0 12px; }
  .pg-training .tr-count { font-size: 12.5px; color: var(--ink-3); margin-left: auto; }
  .pg-training .tr-who { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
  .pg-training .tr-who button { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px 0 4px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255, 255, 255, .02); font-size: 12px; color: var(--ink-2); cursor: pointer; white-space: nowrap; }
  .pg-training .tr-who button.all { padding: 0 10px; }
  .pg-training .tr-who button .av-s { width: 20px; height: 20px; margin: 0; font-size: 9px; }
  .pg-training .tr-who button em { font-style: normal; font-family: var(--mono); color: var(--ink-3); }
  .pg-training .tr-who button[aria-pressed="true"] { background: var(--holo-tint); border-color: rgba(70, 200, 255, .5); color: var(--ink); }
  .pg-training .tr-who button[aria-pressed="true"] em { color: var(--holo-2); }
  .pg-training .tr-list { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: rgba(255, 255, 255, .015); }
  .pg-training .tr-rule { display: grid; grid-template-columns: 24px minmax(0, 1fr) 52px; gap: 12px; padding: 12px 16px; border-top: 1px solid rgba(120, 200, 255, .07); cursor: pointer; align-items: start; }
  .pg-training .tr-rule:first-child { border-top: 0; }
  .pg-training .tr-rule:hover, .pg-training .tr-rule.open { background: var(--holo-tint); }
  .pg-training .tr-rule > .av-s { margin: 0; }
  .pg-training .tr-tx { color: var(--ink-2); }
  .pg-training .tr-tx b { font-weight: 600; color: var(--ink); margin-right: 2px; }
  .pg-training .tr-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 6px; font-size: 12px; color: var(--ink-3); }
  .pg-training .tr-meta .chip { height: 22px; font-size: 11.5px; }
  .pg-training .tr-story { display: none; margin-top: 10px; padding: 10px 14px; border-left: 2px solid var(--holo); background: rgba(70, 200, 255, .05); border-radius: 0 10px 10px 0; }
  .pg-training .tr-rule.open .tr-story { display: block; }
  .pg-training .tr-story p { margin: 0 0 4px; font-size: 13px; color: var(--ink); }
  .pg-training .tr-story .s { font-size: 12px; color: var(--ink-3); }
  .pg-training .tr-used { text-align: right; }
  .pg-training .tr-used b { display: block; font: 400 16px var(--mono); color: var(--ink); }
  .pg-training .tr-used span { font-size: 11px; color: var(--ink-3); }
  .pg-training .tr-more { display: flex; justify-content: center; margin-top: 12px; }

  .pg-training .tr-how { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .pg-training .tr-how > div { position: relative; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); }
  .pg-training .tr-how em { font: 400 11px var(--mono); color: var(--holo); font-style: normal; }
  .pg-training .tr-how b { display: block; margin: 4px 0 2px; font-weight: 600; color: var(--ink); }
  .pg-training .tr-how span { font-size: 12.5px; color: var(--ink-3); line-height: 1.4; display: block; }
  @container (max-width: 760px) { .pg-training .tr-how { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .pg-training .tr-src .hb { grid-template-columns: minmax(80px, 190px) minmax(0, 1fr) auto; }
  .pg-training .tr-src .hb > span .av-s { width: 20px; height: 20px; font-size: 9px; }

  .pg-training .tr-fr { display: grid; grid-template-columns: minmax(0, 300px) minmax(0, 1fr); gap: 16px; align-items: start; }
  @container (max-width: 820px) { .pg-training .tr-fr { grid-template-columns: minmax(0, 1fr); } }
  .pg-training .tr-side { display: grid; gap: 16px; }
  .pg-training .tr-weeks { display: grid; gap: 6px; }
  .pg-training .tr-weeks button { display: grid; gap: 4px; text-align: left; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .02); cursor: pointer; color: var(--ink); }
  .pg-training .tr-weeks button:hover { border-color: rgba(70, 200, 255, .4); }
  .pg-training .tr-weeks button[aria-pressed="true"] { border-color: rgba(70, 200, 255, .55); background: var(--holo-tint); box-shadow: 0 0 24px -12px var(--holo-glow); }
  .pg-training .tr-weeks b { font-size: 13px; font-weight: 600; display: flex; gap: 8px; align-items: center; justify-content: space-between; }
  .pg-training .tr-weeks span { font-size: 12px; color: var(--ink-3); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .pg-training .tr-vs > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 8px 0; border-top: 1px solid rgba(120, 200, 255, .07); }
  .pg-training .tr-vs > div:first-child { border-top: 0; }
  .pg-training .tr-vs .who { font-size: 13px; color: var(--ink); }
  .pg-training .tr-vs .s { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
  .pg-training .tr-vs .v { text-align: right; white-space: nowrap; font: 400 13px var(--mono); color: var(--ink-3); }
  .pg-training .tr-vs .v b { font-weight: 400; font-size: 15px; }
  .pg-training .tr-vs .v .g { color: var(--green); }
  .pg-training .tr-vs .v .bad { color: var(--red); }
  .pg-training .tr-rep h2 { margin: 4px 0 8px; font-size: 22px; line-height: 1.3; font-weight: 500; letter-spacing: -0.015em; color: var(--ink); }
  .pg-training .tr-rep h4 { margin: 20px 0 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-training .tr-rl { display: grid; gap: 6px; }
  .pg-training .tr-rl > div { display: grid; grid-template-columns: 24px 64px minmax(0, 1fr); gap: 8px; align-items: start; padding: 8px 10px; border-radius: 10px; background: rgba(255, 255, 255, .02); border: 1px solid rgba(120, 200, 255, .07); font-size: 13.5px; color: var(--ink-2); }
  .pg-training .tr-rl > div.g { border-color: rgba(63, 224, 160, .2); }
  .pg-training .tr-rl .av-s { margin: 0; }
  .pg-training .tr-rl b { font-weight: 600; color: var(--ink); }
  .pg-training .tr-rl em { font-style: normal; color: var(--ink-3); font-size: 12.5px; }
  .pg-training .tr-rep ul { margin: 0; padding-left: 20px; font-size: 13.5px; color: var(--ink-2); }
  .pg-training .tr-rep .note { margin-top: 20px; }
  .pg-training .tr-rep.typing > *:last-child::after { content: ""; display: inline-block; width: 2px; height: 1em; background: var(--holo); box-shadow: 0 0 8px var(--holo); vertical-align: -2px; margin-left: 4px; animation: blink 1s steps(2) infinite; }
  `,

  render(host, ctx) {
    const L = ctx.local, D = ctx.data, F = ctx.F, K = F.friday, M = ctx.model, E = M.employees, C = E.coach, W = M.weeks;
    L.tab ??= "library"; L.fri ??= 0; L.sort ??= "new"; L.q ??= ""; L.who ??= ""; L.all ??= false;
    const T = L.teach;
    const rules = allRules(ctx, T?.running ? T.at : null);
    const count = C.rules_in_force + rules.filter((r) => r.live).length;
    const liveN = count - C.rules_in_force;
    const liveToday = rules.filter((r) => r.live && r.at >= today0()).length;
    const first = !drawn; drawn = true;

    // mistakes going down: corrections each week (the last 7 days from the model), against the team's work that week
    const kitAt = D.kit_started_week ?? 2;
    const corr = (D.corrections_weeks || []).slice(-W.length);
    corr[corr.length - 1] = C.corrections;
    const work = W.map((_, i) => Object.values(E).reduce((a, e) => a + (e.units[i] || 0), 0));
    const weeks = W.map((w, i) => ({ v: corr[i], work: work[i], l: short(dayDate(w.day_offset)), tip: `Week from ${short(dayDate(w.day_offset))}: ${corr[i]} corrections from ${num(work[i])} pieces of work` }));
    const before = weeks[kitAt - 1] || weeks[0], now = weeks.at(-1);
    const fall = Math.round((1 - now.v / before.v) * 100);
    const per = (w) => r1((w.v / w.work) * 100);
    const workUp = Math.round((now.work / before.work - 1) * 100);
    const tomNeed = M.needs.find((n) => n.who === "Tom" && n.agent === "coach");

    // the newest rules (where a new correction lands)
    const fresh = L.fresh && !L.fresh.shown ? new Set(L.fresh.ids) : null;
    if (L.fresh) L.fresh.shown = true;
    const newest = rules.slice().sort((a, b) => b.at - a.at).slice(0, T?.running ? 2 : 3);
    const nr = (r) => `<div class="tr-nr ${r.live ? "live" : ""} ${fresh?.has(r.id) ? "born" : ""}">${av(r.agent)}<p><b>${esc(BY_ID[r.agent]?.name)}</b>${esc(r.text)}</p></div>`;
    const pending = T?.running ? `<div class="tr-nr pending ${L.flying ? "" : "in"}" id="tr-pending"><span class="kp-dot"><i></i></span><p><span class="shimmer">Kit's writing it as a rule…</span><small>“${esc(T.text)}”</small></p></div>` : "";
    const hits = new Set((T && !T.running && T.done && Date.now() - T.done < 60000 ? T.lessons || [] : []).map((l) => l.agent));

    // where rules come from, and who has them
    const cats = {}, perAgent = {};
    for (const r of rules) { cats[r.cat] = (cats[r.cat] || 0) + 1; perAgent[r.agent] = (perAgent[r.agent] || 0) + 1; }

    // Friday reports: this week (live) and the last four (sample)
    const lf = lastFriday(), arch = (D.fridays || []).map((r, i) => ({ r, d: dayDate(lf - i * 7) }));
    if (L.fri > arch.length) L.fri = 0;
    const vs = (F.coach?.metrics || []).map((m) => {
      const good = m.better_when === "lower" ? m.this_week <= m.last_week : m.this_week >= m.last_week;
      return `<div><div>${who(m.agent)}<div class="s">${esc(m.measure)}</div></div><div class="v">${esc(m.last_week)} → <b class="${good ? "g" : "bad"}">${esc(m.this_week)}</b></div></div>`;
    }).join("");
    const weekBtns = [`<button data-fri="0" aria-pressed="${L.fri === 0}"><b>This week ${K?.running ? chip("Writing", "holo") : K?.report ? chip("Ready", "green") : chip("Not written yet")}</b><span>${esc(K?.report?.headline || "Kit writes it on Friday afternoon. Click to write it now.")}</span></button>`,
      ...arch.map((a, i) => `<button data-fri="${i + 1}" aria-pressed="${L.fri === i + 1}"><b>${esc(dayName(a.d, true))}</b><span>${esc(a.r.headline)}</span></button>`)].join("");
    const shownRep = L.fri === 0
      ? K?.report ? `<div class="ch"><h3>This week's report${K.at ? ` · ${esc(dayName(new Date(K.at)))}` : ""}</h3><div class="r"><button class="btn sm" data-fri-run ${K.running ? "disabled" : ""}>Write it again</button></div></div>${report(K.report, K.running)}`
        : K?.running ? `<div class="ch"><h3>This week's report</h3>${chip("Kit's writing", "holo")}</div><p class="shimmer" style="font-size:16px;margin:12px 0 0">Kit's reading the week's numbers and the rules that changed them…</p>`
        : `<div class="ch"><h3>This week's report</h3></div>${empty("Not written yet. Kit reads the week's numbers and the rules that changed them, then writes it on one screen.")}<div class="row" style="margin-top:12px"><button class="btn primary" data-fri-run>Write this week's report</button><span class="muted" style="font-size:12.5px">Live · about 20 seconds</span></div>`
      : `<div class="ch"><h3>${esc(dayName(arch[L.fri - 1].d, true))}</h3>${chip("Sample week")}</div>${report(arch[L.fri - 1].r, false)}`;

    const tabs = [["library", `Rules library<em>${num(count)}</em>`], ["sources", "Where rules come from"], ["friday", "Friday reports"]];
    const whoBtns = `<button class="all" data-who="" aria-pressed="${!L.who}">Everyone <em>${rules.length}</em></button>${AGENTS.filter((a) => perAgent[a.id]).map((a) => `<button data-who="${a.id}" aria-pressed="${L.who === a.id}">${av(a.id)}${esc(a.name)} <em>${perAgent[a.id]}</em></button>`).join("")}`;
    const pane = L.tab === "sources"
      ? `<section class="card"><div class="ch"><h3>How a correction becomes a rule</h3></div><div class="tr-how">
          <div><em>01</em><b>Someone corrects it</b><span>Priya changes a draft, Tom fixes something on Monday, or a mistake gets caught.</span></div>
          <div><em>02</em><b>Kit writes one line</b><span>A rule anyone could act on today, filed with the person it's for.</span></div>
          <div><em>03</em><b>It's in their instructions</b><span>Next time they do that job, the rule is right in front of them.</span></div>
          <div><em>04</em><b>They say when they use it</b><span>Every draft lists the rules it followed, so you can see it working.</span></div></div></section>
        <div class="grid g2 tr-src">
          <section class="card"><div class="ch"><h3>Where the ${num(count)} rules came from</h3></div>${hbars(Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: esc(CAT[k] || k), v, tip: `${CAT[k] || k}: ${v} rules` })))}</section>
          <section class="card"><div class="ch"><h3>Rules each person follows</h3></div>${hbars(AGENTS.filter((a) => perAgent[a.id]).sort((a, b) => perAgent[b.id] - perAgent[a.id]).map((a) => ({ label: `${av(a.id)}${esc(a.name)}`, v: perAgent[a.id], tip: `${a.name}: ${perAgent[a.id]} rules` })))}</section>
        </div>`
      : L.tab === "friday"
      ? `<div class="tr-fr"><div class="tr-side">
          <section class="card"><div class="ch"><h3>Friday reports</h3></div><div class="tr-weeks">${weekBtns}</div></section>
          <section class="card"><div class="ch"><h3>Kit's numbers</h3><span class="r">7 days before → last 7</span></div><div class="tr-vs">${vs}</div></section>
        </div><section class="card hud">${shownRep}</section></div>`
      : `<section class="card"><div class="tr-bar"><input class="tr-q" id="tr-q" type="search" placeholder="Search the rules" value="${esc(L.q)}" autocomplete="off">
            ${`<div class="seg" role="tablist"><button role="tab" aria-selected="${L.sort === "new"}" data-sort="new">Newest</button><button role="tab" aria-selected="${L.sort === "used"}" data-sort="used">Most used</button></div>`}
            <span class="tr-count" id="tr-count"></span></div>
          <div class="tr-who" id="tr-who">${whoBtns}</div>
          <div class="tr-list" id="tr-list"></div><div class="tr-more" id="tr-more"></div></section>`;

    host.innerHTML = `<div class="inner pg-training">
      ${head({ title: "Training", agent: "coach", lede: "Every time someone corrects the team, Kit turns it into a one-line rule for the person it's for, so the same mistake doesn't happen twice." })}
      <section class="tr-hero">
        <div class="card hud tr-fall">
          <div class="ch"><h3>Mistakes going down</h3><div class="r"><span class="tr-drop"><svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M5 9 1 3h8z"/></svg>${fall}% fewer</span></div></div>
          ${fallChart(weeks, kitAt, first)}
          ${working(`Corrections a week. Before Kit: ${before.v} from ${num(before.work)} pieces of work (${per(before)} per 100). Last 7 days: ${now.v} from ${num(now.work)} (${per(now)} per 100), and Kit made ${C.kpis[0].value} new rules from them.`)}
        </div>
        <div class="card tr-force">
          <div class="ch"><h3>Rules in force</h3><span class="r"><span class="ldot ${ctx.status("coach").busy || T?.running ? "busy" : ""}"></span>live</span></div>
          <div class="tr-n"><b class="num" id="tr-n">${num(shown ?? count)}</b><span>rules the team follows, every one from a real correction</span></div>
          ${working(liveN ? `${C.rules_in_force} from earlier corrections + ${liveN} added live${liveToday === liveN ? " today" : ""} = ${num(count)}` : `${C.rules_in_force} rules, ${C.kpis[0].value} of them added in the last 7 days`)}
          ${tomNeed ? `<div class="tr-need" data-go="check"><span class="ldot need"></span><span><b>${esc(tomNeed.what)}</b> at Tom's Monday check</span><em>→</em></div>` : ""}
          <div class="tr-newh"><span>Newest rules</span><button data-tab-go="library">See all ${num(count)}</button></div>
          <div class="tr-news" id="tr-news">${pending}${newest.map(nr).join("")}</div>
        </div>
        <form class="card tr-teach" id="tr-teach" autocomplete="off">
          <div class="tr-tg">
            <div class="tr-tl"><b>Correct someone</b><span>Say it the way you'd say it in the office. Kit works out who it's for.</span></div>
            <div class="tr-in"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3h11v7.5H7L4 13v-2.5H2.5z"/></svg><input id="tr-teach-in" placeholder="e.g. Penny, never chase Mrs Hale by text. She wants a call." value="${esc(L.draft || "")}"><button class="btn primary" ${T?.running ? "disabled" : ""}>${T?.running ? "Kit's on it…" : "Make it a rule"}</button></div>
            <div class="tr-ten ${T?.running ? "scan" : ""}" title="It reaches whichever of the ten it's for"><span class="tr-tenl">Reaches all ten</span>${AGENTS.map((a) => av(a.id, hits.has(a.id) ? "hit" : "")).join("")}</div>
            ${T?.live ? `<div class="tr-said">${liveInline("Kit turns a correction into a rule live, on a call. Nothing was sent.")}</div>` : T && !T.running ? (T.error ? `<div class="tr-said">${note(`Couldn't make that a rule: ${esc(T.error)}`, "red")}</div>` : `<div class="tr-said"><span class="ldot good"></span><span><b>Kit:</b> ${esc(T.reply || "Done.")}</span></div>`) : ""}
            <div class="tr-ex"><span>Try</span>${(D.examples || []).map((x, i) => `<button type="button" data-ex="${i}" title="${esc(x)}">${esc(x)}</button>`).join("")}</div>
          </div>
        </form>
      </section>
      <div class="tr-tabs" id="tr-tabs"><h2>${L.tab === "friday" ? "What got better, every Friday" : L.tab === "sources" ? "Where the rules come from" : "Every rule the team follows"}</h2>${`<div class="seg" role="tablist">${tabs.map(([v, l]) => `<button role="tab" aria-selected="${v === L.tab}" data-tab="${v}">${l}</button>`).join("")}</div>`}</div>
      ${pane}
      ${foot()}</div>`;

    // the counter: tick from what it last showed
    tick($("#tr-n", host), shown ?? 0, count); shown = count;

    // rules library: filter, search and sort in place (no full redraw while typing)
    if (L.tab === "library") {
      const drawList = () => {
        const q = L.q.trim().toLowerCase();
        let rs = rules.filter((r) => (!L.who || r.agent === L.who) && (!q || `${r.text} ${r.detail} ${r.story} ${BY_ID[r.agent]?.name}`.toLowerCase().includes(q)));
        rs = L.sort === "used" ? rs.slice().sort((a, b) => b.used - a.used) : rs.slice().sort((a, b) => b.at - a.at);
        const cut = L.all || q || L.who ? rs : rs.slice(0, 8);
        $("#tr-list", host).innerHTML = cut.length ? cut.map((r) => ruleRow(r, { open: L.open === r.key })).join("") : `<div style="padding:16px">${empty("No rules match that.")}</div>`;
        $("#tr-more", host).innerHTML = cut.length < rs.length ? `<button class="btn sm" id="tr-all">Show all ${rs.length} rules</button>` : L.all && !q && !L.who && rs.length > 8 ? `<button class="btn sm" id="tr-all">Show fewer</button>` : "";
        $("#tr-count", host).textContent = `${cut.length} of ${rules.length} rules`;
        $$("#tr-who button", host).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.who === L.who)));
        $$("[data-rule]", host).forEach((el) => (el.onclick = () => { const open = !el.classList.contains("open"); $$(".tr-rule.open", host).forEach((x) => x.classList.remove("open")); el.classList.toggle("open", open); L.open = open ? el.dataset.rule : null; }));
        const all = $("#tr-all", host); if (all) all.onclick = () => { L.all = !L.all; drawList(); };
      };
      drawList();
      $("#tr-q", host).oninput = (e) => { L.q = e.target.value; drawList(); };
      $$("#tr-who button", host).forEach((b) => (b.onclick = () => { L.who = b.dataset.who; drawList(); }));
      $$("[data-sort]", host).forEach((b) => (b.onclick = () => { L.sort = b.dataset.sort; $$("[data-sort]", host).forEach((x) => x.setAttribute("aria-selected", String(x === b))); drawList(); }));
    }
    $$("[data-tab]", host).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; ctx.redraw(); }));
    $$("[data-tab-go]", host).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tabGo; L.all = true; L.who = ""; L.q = ""; ctx.redraw(); $("#tr-tabs", host)?.scrollIntoView({ behavior: "smooth", block: "start" }); }));

    // correct someone: the sentence flies into the rules list, Kit writes it, the counter ticks up
    const inp = $("#tr-teach-in", host);
    inp.oninput = () => (L.draft = inp.value);
    $$("[data-ex]", host).forEach((b) => (b.onclick = () => { inp.value = (D.examples || [])[Number(b.dataset.ex)] || ""; L.draft = inp.value; inp.focus(); }));
    $("#tr-teach", host).onsubmit = async (e) => {
      e.preventDefault();
      const text = inp.value.trim(); if (!text || L.teach?.running) return;
      if (window.AI_TEAM_STATIC) { inp.blur(); L.draft = text; L.teach = { text, live: true }; ctx.api("/api/office/teach", { text }).catch(() => {}); ctx.redraw(); return; } // site demo
      inp.blur(); L.draft = ""; L.teach = { running: true, text, at: Date.now() }; L.flying = true;
      const call = ctx.api("/api/office/teach", { text });
      await ctx.redraw();
      // keep the landing spot on screen (in the 9:16 frame the list sits below the box)
      const pend = $("#tr-pending", host), hr = host.getBoundingClientRect();
      if (pend) { const r = pend.getBoundingClientRect(); if (r.bottom > hr.bottom - 16) host.scrollTop += r.bottom - hr.bottom + 32; }
      fly(text, $(".tr-in", host)?.getBoundingClientRect(), host, () => { L.flying = false; $("#tr-pending", host)?.classList.add("in"); });
      try { const r = await call; L.teach = { text, reply: r.reply, lessons: (r.lessons || []).filter(Boolean), done: Date.now() }; L.fresh = { ids: L.teach.lessons.map((l) => l.id), shown: false }; }
      catch (err) { L.teach = { text, error: err.message }; }
      while (L.flying) await new Promise((r) => setTimeout(r, 100)); // let it land first
      L.who = ""; L.q = ""; L.sort = "new";
      ctx.redraw();
      setTimeout(() => { if (/#training/.test(location.hash)) ctx.redraw(); }, 61000); // the avatars cool down after a minute
    };

    // Friday reports
    $$("[data-fri]", host).forEach((b) => (b.onclick = () => { L.fri = Number(b.dataset.fri); ctx.redraw(); }));
    $$("[data-fri-run]", host).forEach((b) => (b.onclick = async () => { L.fri = 0; L.tab = "friday"; b.disabled = true; try { await ctx.api("/api/floor/friday", {}); } catch (err) { ctx.flash(err.message); } ctx.redraw(); }));
  },

  onEvent(ev) {
    return ev.type === "lessons" || ev.type === "friday" || ev.type === "reset" || (ev.type === "log" && ev.line?.agent === "coach");
  },
  leave() { drawn = false; shown = null; },
};
