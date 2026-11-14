// Ask the team (video 10): one question to the whole team, answered live by the right person from Kingpost's own records.
// The hero is the team's voice: an orb that speaks while the answer types out. The side numbers come from ctx.model and live state.
import { $, $$, esc, money, num, av, foot, dayDate, hhmm, BY_ID } from "../ui.js";

const STALE_MS = 3 * 60 * 1000;
const runState = (r) => (r.running && Date.now() - r.at > STALE_MS ? { ...r, running: false, error: r.error || "That answer didn't finish. Ask again." } : r);
const dayLabel = (off) => (off === 0 ? "Today" : off === -1 ? "Yesterday" : dayDate(off).toLocaleDateString("en-GB", { weekday: "long" }));
const KP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M2.5 18.5L12 5l9.5 13.5z"/><path d="M12 5v13.5M12 12.2l-4.4 6.3M12 12.2l4.4 6.3"/></svg>`;

// the orb: built once and kept, so its rings and voice wave never restart when the page redraws
let orbEl = null;
function orb() {
  if (orbEl) return orbEl;
  const P = (r, a) => `${(200 + r * Math.cos(a)).toFixed(1)}`;
  const Q = (r, a) => `${(200 + r * Math.sin(a)).toFixed(1)}`;
  const ticks = Array.from({ length: 120 }, (_, i) => { const a = (i / 120) * Math.PI * 2, r1 = 197, r2 = i % 10 === 0 ? 184 : 191; return `<line x1="${P(r1, a)}" y1="${Q(r1, a)}" x2="${P(r2, a)}" y2="${Q(r2, a)}"/>`; }).join("");
  const bars = Array.from({ length: 72 }, (_, i) => { const d = (0.38 + ((i * 37) % 23) / 38).toFixed(2), dl = (((i * 53) % 29) / 29).toFixed(2); return `<g transform="rotate(${(i * 5).toFixed(1)} 200 200)"><rect x="198.6" y="52" width="2.8" height="38" rx="1.4" style="animation-duration:${d}s;animation-delay:-${dl}s"/></g>`; }).join("");
  orbEl = document.createElement("div");
  orbEl.className = "ak-orb";
  orbEl.innerHTML = `<svg viewBox="0 0 400 400" aria-hidden="true">
    <defs>
      <radialGradient id="akCore"><stop offset="0" stop-color="#a6e6ff" stop-opacity=".5"/><stop offset=".5" stop-color="#46c8ff" stop-opacity=".18"/><stop offset="1" stop-color="#46c8ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="akHot"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".4" stop-color="#bff0ff" stop-opacity=".5"/><stop offset="1" stop-color="#46c8ff" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="o-tk">${ticks}</g>
    <circle cx="200" cy="200" r="174" class="o-rg"/>
    <circle cx="200" cy="200" r="174" class="o-arc"/>
    <circle cx="200" cy="200" r="160" class="o-ds"/>
    <g class="o-bars">${bars}</g>
    <circle cx="200" cy="200" r="110" class="o-core" fill="url(#akCore)"/>
    <circle cx="200" cy="200" r="86" class="o-in"/>
    <circle cx="200" cy="200" r="86" class="o-in2"/>
    <circle cx="200" cy="200" r="58" class="o-hot" fill="url(#akHot)"/>
  </svg><div class="ak-glyph"></div>`;
  return orbEl;
}

// what the team knows right now: the model's figures and today's live state, each with the question it leads to
function knows(ctx) {
  const M = ctx.model, E = M.employees, last = M.weeks.at(-1);
  // money owed is the whole firm's (the model); Penny's live list is just today's chase round
  const open = (ctx.office.chase?.items || []).filter((i) => i.status !== "paid"), F = M.firm;
  const round = open.reduce((a, i) => a + (i.amount || 0), 0);
  return [
    { a: "manager", l: "Waiting on a person", v: String(M.needs.length), s: `${M.needs_total.priya} for Priya · ${M.needs_total.kieran} for Kieran · ${M.needs_total.tom} for Tom`, tone: "amber", q: "What's waiting for Priya to approve?", tip: M.needs.map((n) => `${n.who}: ${n.what}`).join(" · ") },
    { a: "money", l: "Money owed", v: money(F.owed_gbp, 0), s: `${money(F.owed_over_30_gbp, 0)} over 30 days · paid in ${E.money.days_to_pay} days on average`, q: "Penny, who owes us money and what are you doing about it?", tip: `Today's chase round: ${open.length} invoice${open.length === 1 ? "" : "s"}, ${money(round, 0)}` },
    { a: "", l: "Time given back", v: `${M.last7.hours} h`, s: `${money(M.last7.money_saved, 0)} of office time, last 7 days`, q: "What did you all do in the last 7 days?", tip: M.last7.working.money_saved },
    { a: "ads", l: "Leads from marketing", v: String(M.last7.leads_marketing), s: `last 7 days · ads cost ${money(last.ad_cpl, 2)} a lead`, q: "Where are our leads coming from?", tip: M.last7.working.leads_marketing },
    { a: "inbox", l: "Jobs booked from the inbox", v: E.inbox.kpis[1].value, s: `${E.inbox.kpis[0].value} emails sorted, last 7 days`, q: "Theo, anything urgent in the inbox today?", tip: E.inbox.kpis[1].working },
    { a: "invoices", l: "Invoices drafted", v: E.invoices.kpis[0].value, s: `${E.invoices.kpis[1].value} approved with no changes`, q: "Ivy, how are today's invoices looking?", tip: E.invoices.kpis[1].working },
  ];
}

function message(run, i, n) {
  const r = runState(run);
  const reps = (r.running ? r.partial?.replies || [] : r.replies || []).filter((x) => x && BY_ID[x.agent]);
  let out = `<div class="ak-q"><p>${esc(r.q)}</p><span>You · ${hhmm(r.at)}</span></div>`;
  if (r.running && !reps.length) out += `<div class="ak-a"><span class="avl wait" aria-hidden="true"></span><div><p class="shimmer">Checking Kingpost's records…</p></div></div>`;
  reps.forEach((x, k) => {
    const a = BY_ID[x.agent], typing = r.running && k === reps.length - 1, looked = (x.looked_at || []).filter(Boolean);
    out += `<div class="ak-a"><span class="avl" style="--c:${a.color}" aria-hidden="true">${a.name[0]}</span><div>
      <div class="ak-nm"><b>${esc(a.name)}</b><span>${esc(a.role)}</span>${!r.running ? `<button class="ak-desk" data-desk="${x.agent}">Their desk</button>` : ""}</div>
      <p class="${typing ? "caret" : ""}">${esc(x.text || "")}</p>
      ${looked.length ? `<div class="ak-looked"><span>Checked</span>${looked.map((l) => `<em>${esc(l)}</em>`).join("")}</div>` : ""}
    </div></div>`;
  });
  if (r.error) out += `<div class="note red">${esc(r.error)}</div>`;
  if (!r.running && reps.length) out += `<div class="ak-foot"><span>Answered in <b class="num">${num((r.ms || 0) / 1000, 1)} s</b> from today's records</span>${i === n - 1 && r.follow_ups?.length ? `<div class="ak-fu">${r.follow_ups.map((f) => `<button class="ak-chip" data-q="${esc(f)}">${esc(f)}</button>`).join("")}</div>` : ""}</div>`;
  return out;
}

export default {
  css: `
.pg-ask .ak-hh { margin-bottom: 16px; }
.pg-ask .ak-hh .owner { margin-bottom: 8px; }
.pg-ask .ak-main { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
@container (min-width: 1000px) { .pg-ask .ak-main { grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); } }

/* the hero: orb, question, answer */
.pg-ask .ak-hero { --orb: 190px; padding: 24px; overflow: hidden; background: radial-gradient(520px 300px at 50% 26%, rgba(70, 200, 255, .13), transparent 70%), var(--glass-fill), var(--noise) var(--glass-tint); }
@container (min-width: 1000px) { .pg-ask .ak-hero { --orb: 250px; padding: 28px; } }
.pg-ask .ak-stage { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.pg-ask .ak-orbw { display: grid; justify-items: center; gap: 10px; flex: none; }
.pg-ask .ak-orb { position: relative; width: var(--orb); aspect-ratio: 1; }
.pg-ask .ak-orb > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.pg-ask .ak-orb .o-tk line { stroke: rgba(120, 200, 255, .5); stroke-width: 1; }
.pg-ask .ak-orb .o-tk { transform-origin: 200px 200px; animation: spin 80s linear infinite; }
.pg-ask .ak-orb .o-rg { fill: none; stroke: rgba(120, 200, 255, .1); stroke-width: 10; }
.pg-ask .ak-orb .o-arc { fill: none; stroke: var(--holo); stroke-width: 2.6; stroke-dasharray: 150 60 30 60 220 573; stroke-linecap: round; transform-origin: 200px 200px; animation: spin 16s linear infinite; filter: drop-shadow(0 0 6px var(--holo)); }
.pg-ask .ak-orb .o-ds { fill: none; stroke: rgba(120, 200, 255, .32); stroke-dasharray: 2 7; transform-origin: 200px 200px; animation: spin 30s linear infinite reverse; }
.pg-ask .ak-orb .o-bars rect { fill: var(--holo); opacity: .5; transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(.24); transition: opacity .4s; }
.pg-ask .ak-orb.think .o-bars rect { opacity: .55; animation: akThink 1.4s ease-in-out infinite alternate; }
.pg-ask .ak-orb.speak .o-bars rect { fill: #bff0ff; opacity: .95; animation: akWave .6s ease-in-out infinite alternate; }
@keyframes akWave { from { transform: scaleY(.1); } to { transform: scaleY(1); } }
@keyframes akThink { from { transform: scaleY(.1); } to { transform: scaleY(.38); } }
.pg-ask .ak-orb .o-core { transform-origin: 200px 200px; animation: akBreath 4s ease-in-out infinite; }
.pg-ask .ak-orb .o-hot { transform-origin: 200px 200px; animation: akBreath 2.8s ease-in-out infinite; }
@keyframes akBreath { 50% { transform: scale(.9); opacity: .7; } }
.pg-ask .ak-orb .o-in { fill: rgba(3, 9, 16, .35); stroke: rgba(166, 230, 255, .45); stroke-width: 1; }
.pg-ask .ak-orb .o-in2 { fill: none; stroke: var(--holo); stroke-width: 1.5; stroke-dasharray: 40 500; transform-origin: 200px 200px; animation: spin 6s linear infinite reverse; opacity: .8; }
.pg-ask .ak-orb.think .o-arc, .pg-ask .ak-orb.speak .o-arc { animation-duration: 3s; }
.pg-ask .ak-orb.speak .o-core { animation-duration: 1s; }
.pg-ask .ak-orb.speak .o-in2, .pg-ask .ak-orb.think .o-in2 { animation-duration: 1.4s; }
.pg-ask .ak-glyph { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.pg-ask .ak-glyph svg { width: 22%; color: #fff; filter: drop-shadow(0 0 10px var(--holo)); }
.pg-ask .ak-glyph .ag { width: 30%; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; font: 600 calc(var(--orb) * .11) var(--sans); box-shadow: 0 0 0 2px var(--holo), 0 0 34px var(--holo); }
.pg-ask .ak-say { display: inline-flex; align-items: center; gap: 8px; min-height: 20px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); text-align: center; }
.pg-ask .ak-intro { text-align: center; max-width: 520px; }
.pg-ask .ak-intro h2 { margin: 0; font-size: 22px; font-weight: 500; letter-spacing: -.015em; color: #fff; }
.pg-ask .ak-intro p { margin: 8px 0 0; font-size: 14px; color: var(--ink-2); }
.pg-ask .ak-hero.has .ak-stage { flex-direction: row; align-items: flex-start; gap: 20px; }
.pg-ask .ak-hero.has { --orb: 164px; }
@container (min-width: 1000px) { .pg-ask .ak-hero.has { --orb: 190px; } }
.pg-ask .ak-thread { flex: 1; min-width: 0; align-self: stretch; height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding-right: 4px; -webkit-mask-image: linear-gradient(transparent, #000 28px); mask-image: linear-gradient(transparent, #000 28px); padding-top: 12px; }
@container (min-width: 1000px) { .pg-ask .ak-thread { height: 400px; } }
.pg-ask .ak-q { display: grid; justify-items: end; gap: 4px; }
.pg-ask .ak-q p { margin: 0; max-width: 86%; padding: 9px 14px; border-radius: 16px 16px 4px 16px; background: var(--holo-tint); border: 1px solid rgba(70, 200, 255, .38); color: #fff; font-size: 14px; line-height: 1.45; }
.pg-ask .ak-q span { font-size: 11px; color: var(--ink-3); }
.pg-ask .ak-a { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 12px; align-items: start; }
.pg-ask .avl { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; font: 600 12px var(--sans); box-shadow: 0 0 0 1.5px rgba(120, 200, 255, .35), 0 0 14px -4px var(--holo-glow); }
.pg-ask .avl.wait { background: transparent; box-shadow: inset 0 0 0 1.5px var(--holo); animation: pulse 1.4s ease-in-out infinite; }
.pg-ask .ak-nm { display: flex; align-items: baseline; gap: 8px; }
.pg-ask .ak-nm b { font-weight: 600; font-size: 14px; color: #fff; }
.pg-ask .ak-nm span { font-size: 12px; color: var(--ink-3); }
.pg-ask .ak-desk { margin-left: auto; border: 0; background: none; padding: 0; font: 500 12px var(--sans); color: var(--holo-2); cursor: pointer; opacity: .8; }
.pg-ask .ak-desk:hover { opacity: 1; text-decoration: underline; }
.pg-ask .ak-a p { margin: 4px 0 0; font-size: 14.5px; line-height: 1.55; color: var(--ink); }
.pg-ask .ak-looked { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 8px; }
.pg-ask .ak-looked span { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); margin-right: 4px; }
.pg-ask .ak-looked em { font-style: normal; font-size: 11.5px; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(70, 200, 255, .3); color: var(--holo-2); background: rgba(70, 200, 255, .05); }
.pg-ask .ak-foot { margin-left: 42px; display: grid; gap: 8px; font-size: 12px; color: var(--ink-3); }
.pg-ask .ak-fu { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-ask .ak-thread .note.red { margin-left: 42px; }
.pg-ask .ak-form { display: flex; gap: 8px; align-items: center; height: 60px; margin-top: 20px; padding: 0 8px 0 18px; border-radius: 18px; border: 1px solid rgba(70, 200, 255, .45); background: rgba(0, 0, 0, .22); box-shadow: 0 0 0 4px rgba(70, 200, 255, .06), 0 0 40px -16px var(--holo-glow); }
.pg-ask .ak-form:focus-within { border-color: var(--holo); box-shadow: 0 0 0 4px rgba(70, 200, 255, .14), 0 0 40px -10px var(--holo-glow); }
.pg-ask .ak-form svg { width: 18px; height: 18px; color: var(--holo); flex: none; }
.pg-ask .ak-form input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: none; box-shadow: none; font-size: 16px; color: #fff; }
.pg-ask .ak-form .btn { height: 44px; padding: 0 22px; border-radius: 12px; font-size: 14.5px; }
.pg-ask .ak-sugs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 20px; margin-top: 18px; }
@container (min-width: 1000px) { .pg-ask .ak-sugs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.pg-ask .ak-sugs h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
.pg-ask .ak-sugs h4::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--holo); box-shadow: 0 0 8px var(--holo); }
.pg-ask .ak-sugs > div > div { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-ask .ak-chip { display: inline-flex; align-items: center; min-height: 30px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--line-2); background: rgba(255, 255, 255, .02); cursor: pointer; font: 400 12.5px/1.3 var(--sans); color: var(--ink-2); text-align: left; transition: border-color .15s, color .15s, background .15s; }
.pg-ask .ak-chip:hover { border-color: var(--holo); color: #fff; background: var(--holo-tint); }
.pg-ask .ak-chip:disabled { opacity: .45; cursor: default; }

/* the side: what the team knows, what's been asked */
.pg-ask .ak-side { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; min-width: 0; }
@container (min-width: 640px) and (max-width: 999px) { .pg-ask .ak-side { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; } }
.pg-ask .kn { display: grid; margin-top: 4px; }
.pg-ask .kn-r { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; gap: 2px 12px; align-items: center; padding: 10px 6px; border: 0; border-top: 1px solid rgba(120, 200, 255, .07); background: none; text-align: left; cursor: pointer; font: inherit; color: var(--ink); border-radius: 8px; transition: background .15s; }
.pg-ask .kn-r:first-child { border-top: 0; }
.pg-ask .kn-r:hover { background: var(--holo-tint); }
.pg-ask .kn-r .av-s { margin: 0; }
.pg-ask .ak-all { background: var(--holo-tint); color: var(--holo-2); box-shadow: inset 0 0 0 1px rgba(70, 200, 255, .5); font-size: 9px; }
.pg-ask .kn-r b { display: block; font-size: 13px; font-weight: 500; color: var(--ink); }
.pg-ask .kn-r small { display: block; font-size: 11.5px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-ask .kn-r em { font: 300 22px/1 var(--mono); font-style: normal; letter-spacing: -.02em; color: #fff; text-shadow: none; white-space: nowrap; }
.pg-ask .kn-r.amber em { color: var(--amber-ink); text-shadow: none; }
.pg-ask .past { display: grid; gap: 2px; margin-top: 4px; }
.pg-ask .past button { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 2px 10px; padding: 9px 6px; border: 0; border-radius: 8px; background: none; text-align: left; cursor: pointer; font: inherit; color: var(--ink); transition: background .15s; }
.pg-ask .past button:hover { background: var(--holo-tint); }
.pg-ask .past .av-s { margin: 0; width: 22px; height: 22px; font-size: 9.5px; grid-row: 1 / 3; }
.pg-ask .past b { font-size: 13px; font-weight: 500; color: var(--ink); }
.pg-ask .past span { font-size: 11.5px; color: var(--ink-3); }

@container (max-width: 640px) {
  .pg-ask .ak-hero { padding: 18px 14px; }
  .pg-ask .ak-hero.has .ak-stage { flex-direction: column; align-items: center; }
  .pg-ask .ak-hero.has { --orb: 150px; }
  .pg-ask .ak-thread { align-self: stretch; height: 380px; }
  .pg-ask .ak-sugs { grid-template-columns: minmax(0, 1fr); }
  .pg-ask .ak-form { height: 54px; padding-left: 14px; }
  .pg-ask .ak-form .btn { padding: 0 16px; }
  .pg-ask .ak-foot, .pg-ask .ak-thread .note.red { margin-left: 0; }
}`,

  render(host, ctx) {
    const D = ctx.data, L = ctx.local;
    const thread = (ctx.acts.thread || []).map(runState);
    const cur = thread.find((r) => r.running);
    const lastDone = thread.filter((r) => !r.running && r.replies?.length).at(-1);
    const speaking = cur?.partial?.replies?.filter((x) => x && BY_ID[x.agent]).at(-1);
    const mode = cur ? (speaking?.text ? "speak" : "think") : "";
    const say = cur ? (speaking ? `<span class="ldot busy"></span>${esc(BY_ID[speaking.agent].name)} is answering` : `<span class="ldot busy"></span>Checking the records`)
      : lastDone ? `Answered in ${num((lastDone.ms || 0) / 1000, 1)} s` : `<span class="ldot good"></span>Ten on shift · ready`;
    const has = thread.length > 0;

    const groups = `<div class="ak-sugs">${(D.suggested || []).map((g) => `<div><h4>${esc(g.group)}</h4><div>${g.qs.map((q) => `<button class="ak-chip" data-q="${esc(q)}" ${cur ? "disabled" : ""}>${esc(q)}</button>`).join("")}</div></div>`).join("")}</div>`;
    const K = knows(ctx);
    const past = (D.asked_week || []).slice(0, 6);

    host.innerHTML = `<div class="inner pg-ask">
      <header class="ak-hh"><div class="owner"><span class="ldot busy"></span>The whole team · answers from Kingpost's own records</div><h1>Ask the team</h1></header>
      <div class="ak-main">
        <section class="card hud ak-hero ${has ? "has" : ""}">
          <div class="ak-stage">
            <div class="ak-orbw"><div id="ak-orb-slot"></div><div class="ak-say">${say}</div></div>
            ${has ? `<div class="ak-thread">${thread.map((r, i) => message(r, i, thread.length)).join("")}</div>`
              : `<div class="ak-intro"><h2>Ask anything about the business.</h2><p>Money owed, tomorrow's vans, the ads, what's waiting for Priya. The right person answers from Kingpost's records and shows you what they checked.</p></div>`}
          </div>
          <form class="ak-form" autocomplete="off"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3h11v7.5H7L4 13v-2.5H2.5z"/></svg>
            <input name="q" aria-label="Ask the team" placeholder="${cur ? "The team's answering…" : "Ask the team… “Who owes us money?”"}" value="${esc(L.draft || "")}" maxlength="400">
            ${has && !cur ? `<button type="button" class="btn sm" data-clear>Clear</button>` : ""}<button class="btn primary" ${cur ? "disabled" : ""}>${cur ? "Answering" : "Ask"}</button></form>
          ${groups}
        </section>
        <aside class="ak-side">
          <section class="card"><div class="ch"><h3>What the team knows right now</h3><div class="r">tap to ask</div></div>
            <div class="kn">${K.map((k) => `<button class="kn-r ${k.tone || ""}" data-q="${esc(k.q)}" data-tip="${esc(k.tip || "")}">${k.a ? av(k.a) : `<span class="av-s ak-all" aria-hidden="true">10</span>`}<div><b>${esc(k.l)}</b><small>${esc(k.s)}</small></div><em>${esc(k.v)}</em></button>`).join("")}</div></section>
          <section class="card"><div class="ch"><h3>Asked recently</h3><div class="r">tap to ask again</div></div>
            <div class="past">${past.map((p) => `<button data-q="${esc(p.q)}">${av(p.agent)}<b>${esc(p.q)}</b><span>${esc(BY_ID[p.agent]?.name || "")} · ${esc(dayLabel(p.day_offset))} · ${p.secs} s</span></button>`).join("")}</div></section>
        </aside>
      </div>
      ${foot()}
    </div>`;

    // the orb lives on between redraws
    const o = orb();
    $("#ak-orb-slot", host).replaceWith(o);
    o.classList.toggle("speak", mode === "speak"); o.classList.toggle("think", mode === "think");
    const g = $(".ak-glyph", o);
    const glyph = speaking ? `ag:${speaking.agent}` : "kp";
    if (g.dataset.k !== glyph) { g.dataset.k = glyph; g.innerHTML = speaking ? `<span class="ag" style="--c:${BY_ID[speaking.agent].color}">${BY_ID[speaking.agent].name[0]}</span>` : KP; }

    // wiring
    const send = async (q) => {
      q = String(q || "").trim(); if (!q) return;
      if ((ctx.acts.thread || []).map(runState).some((r) => r.running)) { ctx.flash("The team's still answering the last question"); return; }
      L.draft = ""; L.stick = true;
      try { await ctx.act("ask", { q }); } catch (err) { if (err.live) { L.draft = q; const i = $(".ak-form input", host); if (i) i.value = q; } ctx.flash(err.message); } // site demo: keep the question
    };
    const form = $(".ak-form", host), input = $("input", form);
    input.oninput = () => (L.draft = input.value);
    form.onsubmit = (e) => { e.preventDefault(); const q = input.value; input.value = ""; input.blur(); send(q); };
    $$("[data-q]", host).forEach((b) => (b.onclick = () => send(b.dataset.q)));
    $$("[data-desk]", host).forEach((b) => (b.onclick = () => ctx.openAgent(b.dataset.desk)));
    $$("[data-clear]", host).forEach((b) => (b.onclick = async () => { L.stick = true; try { await ctx.act("clear"); } catch (err) { ctx.flash(err.message); } }));
    // keep the newest answer in view while it types
    const th = $(".ak-thread", host);
    if (th) {
      if (L.stick !== false) th.scrollTop = th.scrollHeight; else th.scrollTop = L.thTop || 0;
      th.onscroll = () => { L.stick = th.scrollTop + th.clientHeight >= th.scrollHeight - 32; L.thTop = th.scrollTop; };
    }
    // a question sent from Home's ask bar: ask it once
    if (L.pending) { const q = L.pending; delete L.pending; setTimeout(() => send(q), 30); }
  },
  onEvent(ev) {
    if (ev.type === "act") return ev.page === "ask";
    if (ev.demo === "office") return ["chase", "chaseDone", "reset", "chaseReset"].includes(ev.type); // money owed, live
    return ev.demo === "floor" && ev.type === "reset";
  },
};
