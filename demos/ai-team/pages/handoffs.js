// How work moves (video 3): one job passing desk to desk, live, then every hand-off in the office and what's waiting on a person.
// Counts come from ctx.model where it has them (see the flows in handoffs.json); "Waiting on a person" is model.needs, the one list.
import { $, $$, esc, num, money, av, seg, note, foot, dayDate, BY_ID } from "../ui.js";

const STAGES = [
  { key: "seo", agent: "seo", job: "Finds the search, writes the brief", made: "Seren's brief" },
  { key: "content", agent: "content", job: "Writes the page", made: "Clara's page" },
  { key: "ads", agent: "ads", job: "Writes three ads to test it", made: "Archie's three test ads" },
  { key: "review", agent: "manager", job: "Checks it all before anyone sees it", made: "Maeve's check" },
  { key: "priya", job: "Approves it and puts it live" },
];
const POS = { seo: 0, "to-content": 0.5, content: 1, "to-ads": 1.5, ads: 2, "to-manager": 2.5, review: 3, done: 4 };
const PAGE_OF = { seo: "search", ads: "ads", content: "content", paperwork: "paperwork", manager: "tasks", coach: "training" };
const PEOPLE = new Set(["priya", "kieran", "tom"]);
const X = (pos) => 10 + (pos / 4) * 80; // % across the track: five stations at 10, 30, 50, 70, 90
const dur = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000)); if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60); if (m < 60) return m < 10 && s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} h${m % 60 ? ` ${m % 60} min` : ""}`;
  const d = Math.floor(h / 24); return `${d} day${d > 1 ? "s" : ""}${h % 24 ? ` ${h % 24} h` : ""}`;
};
const nameOf = (D, id) => BY_ID[id]?.name || D.people?.[id]?.name || id;
const pav = (D, id) => (BY_ID[id] ? av(id) : `<span class="av-s ho-pav ${PEOPLE.has(id) ? "p" : ""}" aria-hidden="true">${id === "everyone" ? "10" : esc(nameOf(D, id)[0])}</span>`);
const TICK = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>`;
const CROSS = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>`;

// ------------------------------------------------------------------ the job: the live relay, or the last finished one (sample)
function liveJob(R, log) {
  const T = R.times || {};
  const t = { seo: { s: R.startedAt, e: T["to-content"] }, content: { s: T.content, e: T["to-ads"] }, ads: { s: T.ads, e: T["to-manager"] }, review: { s: T.review, e: T.done } };
  const err = !R.running && R.stage !== "done" ? ((log || []).filter((l) => l.at >= R.startedAt && l.kind === "ask").at(-1)?.text || "The job stopped part-way. Start it again.") : "";
  const gaps = [[T["to-content"], T.content], [T["to-ads"], T.ads], [T["to-manager"], T.review]].map(([a, b]) => (a && b ? b - a : null));
  return { live: true, running: !!R.running, pos: POS[R.stage] ?? 0, err, opp: R.opp, brief: R.brief, page: R.page, ads: R.ads?.variants ? R.ads : null, review: R.review, startedAt: R.startedAt, doneAt: T.done || null, t, gaps };
}
function sampleJob(J, F) {
  const opp = F.seo.opportunities.find((o) => o.id === J.opp_id) || F.seo.opportunities[0];
  const g = (J.gap_secs || 3) * 1000, t = {}; let x = 0;
  for (const k of ["seo", "content", "ads", "review"]) { t[k] = { s: x, e: x + (J.secs?.[k] || 0) * 1000 }; x = t[k].e + g; }
  return { live: false, running: false, pos: 4, err: "", opp, brief: { brief: J.brief, must_include: J.must_include }, page: { title: J.page.title, intro: J.page.intro, sectionsN: J.page.sections, words: J.page.words, sections: [] },
    ads: { variants: J.ads, test_plan: J.test_plan }, review: J.review, startedAt: 0, doneAt: t.review.e, t, gaps: [g, g, g], priyaMin: J.priya_min, day_offset: J.day_offset };
}
function stState(J, i) {
  const p = J.pos;
  if (i === 4) return p < 4 ? "wait" : J.review?.verdict && J.review.verdict !== "approved" ? "back" : J.live ? "waiting" : "done";
  if (p > i) return "done";
  if (p === i) return J.running ? "doing" : J.err ? "bad" : "done";
  if (p === i - 0.5) return "incoming";
  return "wait";
}
// what each desk made, as it's made
function outBody(J, key, state) {
  const quiet = (s) => `<p class="ho-q">${s}</p>`;
  if (key === "seo") {
    if (J.brief?.brief) return `<p class="ho-tx c5">${esc(J.brief.brief)}</p>${J.brief.must_include?.length ? `<div class="ho-mi">${J.brief.must_include.slice(0, 3).map((m) => `<span>${esc(m)}</span>`).join("")}</div>` : ""}`;
    return state === "doing" ? `<p class="ho-tx shimmer">Reading who shows up for “${esc(J.opp.query)}” and writing Clara's brief</p>` : quiet("Starts the moment you pick a search.");
  }
  if (key === "content") {
    const p = J.page;
    if (p?.title || p?.intro) {
      const secs = (p.sections || []).filter((s) => s?.heading);
      const words = p.words || [p.intro, ...(p.sections || []).map((s) => s?.body)].join(" ").split(/\s+/).filter(Boolean).length;
      return `<b class="ho-ti">${esc(p.title || "")}</b><p class="ho-tx c4 ${state === "doing" ? "caret" : ""}">${esc(p.intro || "")}</p>
        <div class="ho-meta"><span class="num">${p.sectionsN ?? secs.length}</span> sections · <span class="num">${num(words)}</span> words${state === "doing" ? " so far" : ""}</div>`;
    }
    return state === "doing" ? `<p class="ho-tx shimmer">Reading Seren's brief</p>` : state === "incoming" ? `<p class="ho-tx shimmer">Seren's handing her the brief</p>` : quiet("Waits for Seren's brief.");
  }
  if (key === "ads") {
    if (J.ads?.variants?.length) return `<div class="ho-ads">${J.ads.variants.slice(0, 3).map((v) => `<div><span>${esc(v.angle)}</span><b>${esc(v.headline)}</b></div>`).join("")}</div>${J.ads.test_plan ? `<div class="ho-meta c2">${esc(J.ads.test_plan)}</div>` : ""}`;
    return state === "doing" ? `<p class="ho-tx shimmer">Writing three ads, each testing a different angle</p>` : state === "incoming" ? `<p class="ho-tx shimmer">Clara's passing him the page</p>` : quiet("Waits for Clara's page.");
  }
  const v = J.review;
  if (v?.checks) return `<div class="ho-ck">${v.checks.slice(0, 4).map((c) => `<div class="${c.ok ? "ok" : "no"}" data-tip="${esc(c.note)}">${c.ok ? TICK : CROSS}<span>${esc(c.check)}</span></div>`).join("")}</div><p class="ho-tx c2">${esc(v.summary)}</p>`;
  return state === "doing" ? `<p class="ho-tx shimmer">Checking every claim against the proof and the house rules</p>` : state === "incoming" ? `<p class="ho-tx shimmer">Archie's sending the page and ads over</p>` : quiet("Waits for Archie's ads.");
}

// ------------------------------------------------------------------ every hand-off, last 28 days: counts from the model where it has them
function flowsOf(D, M) {
  const E = M.employees, W = M.weeks;
  const u28 = (id) => E[id].units.slice(-4).reduce((a, b) => a + b, 0);
  const per28 = (id, last7) => Math.round((last7 * u28(id)) / (E[id].units.at(-1) || 1));
  const base = {
    invoices_drafted: u28("invoices"),
    jobs_from_inbox: W.slice(-4).reduce((a, w) => a + w.jobs_from_inbox, 0),
    replies_drafted: per28("inbox", E.inbox.replies_drafted),
    chasers_sent: u28("money"),
    pieces_drafted: u28("content"),
    drafts_sent_back: Math.round(u28("content") * (1 - E.content.approved_first_time_pct / 100)),
    rules_added: u28("coach"),
    ads_work: u28("ads"),
  };
  // Maeve's in-tray adds up to her pieces of work checked: Clara's drafts, Archie's ad work, Penny's chasers, and the replies Theo sends her
  base.replies_via_maeve = Math.max(0, u28("manager") - base.pieces_drafted - base.ads_work - base.chasers_sent);
  base.replies_direct = Math.max(0, base.replies_drafted - base.replies_via_maeve);
  const fl = (D.flows || []).map((f) => ({ ...f, n: f.model ? base[f.model] ?? 0 : f.n }));
  // everything Maeve checks goes on: back to Clara, to Tom, or to Priya
  const into = fl.filter((f) => f.to === "manager").reduce((a, f) => a + f.n, 0);
  const out = fl.filter((f) => f.from === "manager" && f.model !== "maeve_to_priya").reduce((a, f) => a + f.n, 0);
  for (const f of fl) if (f.model === "maeve_to_priya") f.n = Math.max(0, into - out);
  return fl.filter((f) => f.n > 0);
}
function sankeyLayout(D, flows, H) {
  const tot = (side, id) => flows.filter((f) => f[side] === id).reduce((a, f) => a + f.n, 0);
  const Ln = (D.left_order || []).map((id) => ({ id, v: tot("from", id) })).filter((n) => n.v);
  const Rn = (D.right_order || []).map((id) => ({ id, v: tot("to", id) })).filter((n) => n.v);
  const gap = 8, minH = 22;
  const fit = (ns) => { const room = H - gap * (ns.length - 1); let k = room / ns.reduce((a, n) => a + n.v, 0); for (let i = 0; i < 8; i++) { const cl = ns.filter((n) => n.v * k < minH), fv = ns.filter((n) => n.v * k >= minH).reduce((a, n) => a + n.v, 0); if (!fv) break; k = (room - cl.length * minH) / fv; } return k; };
  const k = Math.min(fit(Ln), fit(Rn));
  const place = (ns) => { let y = 0; for (const n of ns) { n.h = Math.max(minH, n.v * k); n.y = y; y += n.h + gap; } const off = Math.max(0, (H - (y - gap)) / 2); ns.forEach((n) => (n.y += off)); };
  place(Ln); place(Rn);
  const li = Object.fromEntries(Ln.map((n, i) => [n.id, i])), ri = Object.fromEntries(Rn.map((n, i) => [n.id, i]));
  const bands = flows.map((f) => ({ ...f, t: Math.max(1.5, f.n * k) }));
  for (const n of Ln) { const bs = bands.filter((b) => b.from === n.id).sort((a, b) => ri[a.to] - ri[b.to]); let y = n.y + (n.h - bs.reduce((a, b) => a + b.t, 0)) / 2; bs.forEach((b) => { b.y0 = y; y += b.t; }); }
  for (const n of Rn) { const bs = bands.filter((b) => b.to === n.id).sort((a, b) => li[a.from] - li[b.from]); let y = n.y + (n.h - bs.reduce((a, b) => a + b.t, 0)) / 2; bs.forEach((b) => { b.y1 = y; y += b.t; }); }
  return { Ln, Rn, bands };
}
const isOn = (sel, b) => (sel?.includes(">") ? sel === `${b.from}>${b.to}` : b.from === sel || b.to === sel);
// the bands, drawn at the real pixel width so the moving dashes don't stretch
function drawBands(host, D, lay, sel, pick) {
  const svg = $(".sk-svg", host); if (!svg) return;
  const w = Math.max(40, Math.round(svg.getBoundingClientRect().width)), H = +svg.dataset.h, r = (v) => Math.round(v * 10) / 10;
  svg.setAttribute("viewBox", `0 0 ${w} ${H}`);
  const c = w / 2;
  const band = (b) => `M0 ${r(b.y0)} C${c} ${r(b.y0)} ${c} ${r(b.y1)} ${w} ${r(b.y1)} L${w} ${r(b.y1 + b.t)} C${c} ${r(b.y1 + b.t)} ${c} ${r(b.y0 + b.t)} 0 ${r(b.y0 + b.t)} Z`;
  const mid = (b) => `M0 ${r(b.y0 + b.t / 2)} C${c} ${r(b.y0 + b.t / 2)} ${c} ${r(b.y1 + b.t / 2)} ${w} ${r(b.y1 + b.t / 2)}`;
  svg.innerHTML = `<defs>
      <linearGradient id="hoBC" x1="0" x2="1"><stop offset="0" stop-color="#46c8ff" stop-opacity=".42"/><stop offset="1" stop-color="#46c8ff" stop-opacity=".16"/></linearGradient>
      <linearGradient id="hoBA" x1="0" x2="1"><stop offset="0" stop-color="#46c8ff" stop-opacity=".34"/><stop offset="1" stop-color="#ffb547" stop-opacity=".34"/></linearGradient></defs>
    ${lay.bands.map((b) => { const p = PEOPLE.has(b.to), cls = `${p ? "p" : ""} ${sel ? (isOn(sel, b) ? "on" : "dim") : ""}`;
      return `<path d="${band(b)}" class="bd ${cls}" fill="url(#${p ? "hoBA" : "hoBC"})" data-fs="${b.from}>${b.to}" data-tip="${esc(`${nameOf(D, b.from)} → ${nameOf(D, b.to)}: ${b.n} ${b.what}, last 28 days`)}"/>
        <path d="${mid(b)}" class="fx ${cls}" style="animation-duration:${(1.8 - Math.min(1, b.t / 40)).toFixed(2)}s"/>`; }).join("")}`;
  $$("[data-fs]", svg).forEach((el) => (el.onclick = () => pick(el.dataset.fs)));
}

let ticker = null, lastPos = null, ro = null, lastRelay = null;

export default {
  css: `
.pg-handoffs .ho-hh { margin-bottom: 16px; }
.pg-handoffs .ho-hh .lede { margin: 6px 0 0; }
.pg-handoffs .ho-pav { background: transparent; color: var(--ink-2); box-shadow: inset 0 0 0 1.5px var(--line-2); font-size: 9.5px; }
.pg-handoffs .ho-pav.p { color: var(--amber-ink); box-shadow: inset 0 0 0 1.5px var(--amber); }

/* hero: the live job tracker */
.pg-handoffs .ho-hero { --orb: 48px; padding: 20px 20px 20px; overflow: hidden; background: radial-gradient(600px 220px at 50% 58%, rgba(70, 200, 255, .1), transparent 70%), var(--glass-fill), var(--noise) var(--glass-tint); }
@container (min-width: 900px) { .pg-handoffs .ho-hero { --orb: 60px; padding: 24px 28px; } }
.pg-handoffs .ho-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.pg-handoffs .ho-hl { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
.pg-handoffs .ho-top h2 { margin: 8px 0 0; font-size: 19px; font-weight: 500; letter-spacing: -.01em; color: #fff; line-height: 1.3; max-width: 520px; }
.pg-handoffs .ho-tr { display: grid; justify-items: end; gap: 12px; flex: none; }
@container (min-width: 900px) { .pg-handoffs .ho-tr { grid-auto-flow: column; align-items: end; gap: 24px; } .pg-handoffs .ho-tr .ho-go { order: -1; margin-bottom: 4px; } }
.pg-handoffs .ho-go { height: 46px; padding: 0 22px; font-size: 15px; border-radius: 12px; gap: 10px; animation: hoGo 2.8s ease-in-out infinite; }
.pg-handoffs .ho-go:disabled { animation: none; }
@keyframes hoGo { 50% { box-shadow: 0 0 0 1px rgba(70, 200, 255, .5), 0 0 34px -4px var(--holo); } }
.pg-handoffs .ho-clock { text-align: right; flex: none; }
.pg-handoffs .ho-clock span { display: block; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
.pg-handoffs .ho-clock b { display: block; margin-top: 4px; font: 300 34px/1.05 var(--mono); letter-spacing: -.03em; color: #fff; text-shadow: none; white-space: nowrap; }
.pg-handoffs .ho-clock em { display: block; margin-top: 4px; font-style: normal; font-size: 12px; color: var(--ink-3); }
.pg-handoffs .ho-clock.run b { color: var(--holo-2); }
@container (min-width: 900px) { .pg-handoffs .ho-clock b { font-size: 44px; } .pg-handoffs .ho-top h2 { font-size: 22px; } }
.pg-handoffs .ho-job { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, .6fr) minmax(0, 1.5fr); gap: 4px 16px; margin-top: 16px; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); font-size: 12.5px; }
.pg-handoffs .ho-job span { display: block; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
.pg-handoffs .ho-job b { display: block; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-handoffs .ho-job em { display: block; font-style: normal; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.pg-handoffs .ho-track { position: relative; margin: 26px 0 4px; }
.pg-handoffs .ho-rail { position: absolute; left: 10%; right: 10%; top: calc(var(--orb) / 2 - 1px); height: 2px; background: repeating-linear-gradient(90deg, rgba(120, 200, 255, .28) 0 6px, transparent 6px 12px); }
.pg-handoffs .ho-fill { position: absolute; left: 10%; top: calc(var(--orb) / 2 - 2px); height: 4px; border-radius: 4px; background: linear-gradient(90deg, rgba(70, 200, 255, .35), var(--holo) 60%, #bff0ff); box-shadow: 0 0 14px var(--holo), 0 0 3px #fff; transition: width 2.6s cubic-bezier(.45, 0, .2, 1); }
.pg-handoffs .ho-fill::after { content: ""; position: absolute; inset: 0; border-radius: 4px; background: linear-gradient(90deg, transparent 0 40%, rgba(255, 255, 255, .85) 50%, transparent 60% 100%); background-size: 240px 100%; animation: hoSheen 2.2s linear infinite; }
@keyframes hoSheen { from { background-position: -240px 0; } to { background-position: 900px 0; } }
.pg-handoffs .ho-pk { position: absolute; top: calc(var(--orb) / 2); width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: #e8fbff; box-shadow: 0 0 0 3px rgba(70, 200, 255, .35), 0 0 22px 4px var(--holo); z-index: 1; transition: left 2.6s cubic-bezier(.45, 0, .2, 1); }
.pg-handoffs .ho-pk::before { content: ""; position: absolute; right: 7px; top: 3px; width: 60px; height: 8px; border-radius: 8px; background: linear-gradient(90deg, transparent, rgba(166, 230, 255, .75)); }
.pg-handoffs .ho-pk.rest::before { display: none; }
.pg-handoffs .ho-pk.amber { background: #fff3dd; box-shadow: 0 0 0 3px rgba(255, 181, 71, .4), 0 0 22px 4px var(--amber); }
.pg-handoffs .ho-gap { position: absolute; top: calc(var(--orb) / 2 - 22px); transform: translateX(-50%); font: 400 10.5px var(--mono); color: var(--holo-2); opacity: .75; white-space: nowrap; }
.pg-handoffs .ho-sts { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
.pg-handoffs .ho-st { display: grid; justify-items: center; text-align: center; gap: 2px; padding: 0 4px; min-width: 0; }
.pg-handoffs .ho-orb { position: relative; z-index: 2; width: var(--orb); height: var(--orb); border-radius: 50%; display: grid; place-items: center; margin-bottom: 8px; background: var(--c); color: #fff; font: 600 calc(var(--orb) * .36) var(--sans); box-shadow: 0 0 0 1.5px rgba(120, 200, 255, .3), 0 0 0 6px var(--bg); transition: box-shadow .3s; }
.pg-handoffs .ho-orb.p { background: var(--bg); color: var(--amber-ink); box-shadow: inset 0 0 0 2px rgba(255, 181, 71, .55), 0 0 0 6px var(--bg); }
.pg-handoffs .ho-st.done .ho-orb { box-shadow: 0 0 0 2px var(--holo), 0 0 0 6px var(--bg), 0 0 22px 2px var(--holo-glow); }
.pg-handoffs .ho-st.done .ho-orb::after { content: ""; position: absolute; right: -3px; bottom: -3px; width: 16px; height: 16px; border-radius: 50%; background: var(--green) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='m4.5 8.5 2.5 2.5 4.5-5.5' fill='none' stroke='%23032' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 12px no-repeat; box-shadow: 0 0 0 2px var(--bg); }
.pg-handoffs .ho-st.doing .ho-orb { box-shadow: 0 0 0 2px var(--holo), 0 0 0 6px var(--bg), 0 0 30px 6px var(--holo); }
.pg-handoffs .ho-st.doing .ho-orb::before, .pg-handoffs .ho-st.waiting .ho-orb::before { content: ""; position: absolute; inset: -10px; border-radius: 50%; border: 1.5px dashed var(--holo); animation: spin 4s linear infinite; }
.pg-handoffs .ho-st.waiting .ho-orb { box-shadow: inset 0 0 0 2px var(--amber), 0 0 0 6px var(--bg), 0 0 26px 2px var(--amber-glow); }
.pg-handoffs .ho-st.waiting .ho-orb::before { border-color: var(--amber); animation-duration: 9s; }
.pg-handoffs .ho-st.incoming .ho-orb { outline: 1.5px dashed var(--holo); outline-offset: 4px; }
.pg-handoffs .ho-st.bad .ho-orb, .pg-handoffs .ho-st.back .ho-orb { box-shadow: 0 0 0 2px var(--red), 0 0 0 6px var(--bg), 0 0 22px var(--red); }
.pg-handoffs .ho-st.wait .ho-orb { opacity: .55; }
.pg-handoffs .ho-st b { font-size: 14px; font-weight: 600; color: #fff; }
.pg-handoffs .ho-st .jb { font-size: 11.5px; line-height: 1.35; color: var(--ink-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 31px; }
.pg-handoffs .ho-st .tm { margin-top: 4px; font: 400 12px var(--mono); color: var(--ink-2); line-height: 1.35; }
.pg-handoffs .ho-st.doing .tm { color: var(--holo-2); }
.pg-handoffs .ho-st.waiting .tm { color: var(--amber-ink); }
.pg-handoffs .ho-st.bad .tm, .pg-handoffs .ho-st.back .tm { color: #ffb0b3; }
.pg-handoffs .ho-ctl { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px 20px; align-items: end; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
.pg-handoffs .ho-ctl > div > span { display: block; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); margin-bottom: 8px; }
.pg-handoffs .ho-opps { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-handoffs .ho-opp { display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line-2); background: rgba(255, 255, 255, .02); cursor: pointer; font: 500 12.5px var(--sans); color: var(--ink-2); white-space: nowrap; transition: border-color .15s, background .15s; }
.pg-handoffs .ho-opp:hover { border-color: rgba(70, 200, 255, .6); color: #fff; }
.pg-handoffs .ho-opp.on { border-color: var(--holo); color: #fff; background: var(--holo-tint); box-shadow: 0 0 18px -6px var(--holo-glow); }
.pg-handoffs .ho-opp .num { font-size: 11px; color: var(--ink-3); }
.pg-handoffs .ho-btns { display: flex; gap: 8px; }
.pg-handoffs .ho-btns .btn.primary { height: 44px; padding: 0 22px; font-size: 14.5px; border-radius: 12px; }
.pg-handoffs .ho-btns .btn:not(.primary) { height: 44px; }
.pg-handoffs .ho-err { margin-top: 12px; }

/* what each desk made */
.pg-handoffs .ho-outs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
.pg-handoffs .ho-out { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--line); background: var(--glass-fill), var(--noise) var(--glass-tint); min-width: 0; }
.pg-handoffs .ho-out.doing { border-color: rgba(70, 200, 255, .55); box-shadow: 0 0 30px -12px var(--holo-glow); }
.pg-handoffs .ho-out.wait { opacity: .6; }
.pg-handoffs .ho-out h4 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
.pg-handoffs .ho-out h4 .av-s { margin: 0; width: 20px; height: 20px; font-size: 9px; }
.pg-handoffs .ho-tx { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--ink-2); }
.pg-handoffs .ho-q { margin: 0; font-size: 12.5px; color: var(--ink-3); }
.pg-handoffs .ho-ti { font-size: 13.5px; font-weight: 600; line-height: 1.35; color: #fff; }
.pg-handoffs .c5 { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
.pg-handoffs .c4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.pg-handoffs .c2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pg-handoffs .ho-meta { font-size: 11.5px; color: var(--ink-3); line-height: 1.4; }
.pg-handoffs .ho-mi { display: flex; flex-wrap: wrap; gap: 4px; }
.pg-handoffs .ho-mi span { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--ink-2); }
.pg-handoffs .ho-ads { display: grid; gap: 6px; }
.pg-handoffs .ho-ads div { padding: 6px 10px; border-radius: 10px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); min-width: 0; }
.pg-handoffs .ho-ads span { display: block; font-size: 10.5px; color: var(--ink-3); }
.pg-handoffs .ho-ads b { display: block; font-size: 13px; font-weight: 600; color: var(--holo-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-handoffs .ho-ck { display: grid; gap: 4px; }
.pg-handoffs .ho-ck div { display: flex; gap: 8px; align-items: flex-start; font-size: 12.5px; line-height: 1.35; color: var(--ink-2); }
.pg-handoffs .ho-ck svg { flex: none; margin-top: 1px; }
.pg-handoffs .ho-ck .ok svg { color: var(--green); }
.pg-handoffs .ho-ck .no { color: #ffb0b3; }

/* every hand-off */
.pg-handoffs .ho-sec { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px 16px; flex-wrap: wrap; margin: 32px 0 16px; }
.pg-handoffs .ho-sec h2 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: -.01em; color: #fff; }
.pg-handoffs .ho-sec p { margin: 4px 0 0; font-size: 13px; color: var(--ink-3); max-width: 640px; }
.pg-handoffs .ho-big { display: flex; gap: 24px; }
.pg-handoffs .ho-big div { text-align: right; }
.pg-handoffs .ho-big b { display: block; font: 300 30px/1.05 var(--mono); letter-spacing: -.03em; color: #fff; text-shadow: none; }
.pg-handoffs .ho-big b.g { color: var(--green); text-shadow: none; }
.pg-handoffs .ho-big b.a { color: var(--amber-ink); text-shadow: none; }
.pg-handoffs .ho-big span { font-size: 11.5px; color: var(--ink-3); }
.pg-handoffs .fm { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; }
@container (min-width: 960px) { .pg-handoffs .fm { grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); gap: 28px; } }
.pg-handoffs .sk { display: grid; grid-template-columns: 128px minmax(0, 1fr) 128px; }
.pg-handoffs .sk-col { position: relative; }
.pg-handoffs .sk-n { position: absolute; left: 0; right: 0; display: flex; align-items: center; gap: 4px; border: 0; background: none; cursor: pointer; font: 500 12.5px var(--sans); color: var(--ink); text-align: left; transition: opacity .2s; padding: 0; }
.pg-handoffs .sk-col.l .sk-n { padding-right: 14px; }
.pg-handoffs .sk-col.r .sk-n { padding-left: 14px; }
.pg-handoffs .sk-bar { position: absolute; top: 0; bottom: 0; width: 5px; border-radius: 3px; background: var(--holo); box-shadow: 0 0 10px var(--holo); }
.pg-handoffs .sk-n.p .sk-bar { background: var(--amber); box-shadow: 0 0 10px var(--amber); }
.pg-handoffs .sk-col.l .sk-bar { right: 0; }
.pg-handoffs .sk-col.r .sk-bar { left: 0; }
.pg-handoffs .sk-nm { display: flex; align-items: center; min-width: 0; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.pg-handoffs .sk-nm .av-s { width: 20px; height: 20px; font-size: 9px; margin-right: 6px; }
.pg-handoffs .sk-n em { font: 400 11.5px var(--mono); font-style: normal; color: var(--ink-3); }
.pg-handoffs .sk-n.dim { opacity: .28; }
.pg-handoffs .sk-svg { display: block; width: 100%; overflow: visible; }
.pg-handoffs .sk-svg .bd { cursor: pointer; transition: opacity .2s; filter: drop-shadow(0 0 6px rgba(70, 200, 255, .25)); }
.pg-handoffs .sk-svg .bd:hover { opacity: .65; }
.pg-handoffs .sk-svg .bd.dim { opacity: .14; }
.pg-handoffs .sk-svg .bd.on { filter: drop-shadow(0 0 10px rgba(70, 200, 255, .7)); }
.pg-handoffs .sk-svg .fx { fill: none; stroke: #bff0ff; stroke-width: 1.2; stroke-dasharray: 2 10; stroke-linecap: round; opacity: .75; pointer-events: none; animation: hoFlow 1.2s linear infinite; }
.pg-handoffs .sk-svg .fx.p { stroke: var(--amber-ink); }
.pg-handoffs .sk-svg .fx.dim { opacity: .1; }
@keyframes hoFlow { to { stroke-dashoffset: -24; } }
.pg-handoffs .sk-x { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
.pg-handoffs .fl { display: grid; align-content: start; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: rgba(255, 255, 255, .015); }
.pg-handoffs .fl-r { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0 12px; padding: 9px 12px; border: 0; border-top: 1px solid var(--line); background: none; text-align: left; cursor: pointer; font: inherit; color: var(--ink); }
.pg-handoffs .fl-r:first-child { border-top: 0; }
.pg-handoffs .fl-r:hover, .pg-handoffs .fl-r.on { background: var(--holo-tint); }
.pg-handoffs .fl-r.on { box-shadow: inset 2px 0 0 var(--holo); }
.pg-handoffs .fl-w { display: flex; align-items: center; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; }
.pg-handoffs .fl-w .av-s { width: 20px; height: 20px; font-size: 9px; margin-right: 6px; }
.pg-handoffs .fl-w i { font-style: normal; color: var(--holo-2); margin: 0 8px; }
.pg-handoffs .fl-r em { font: 400 14px var(--mono); font-style: normal; color: #fff; align-self: center; grid-row: 1 / span 2; grid-column: 2; }
.pg-handoffs .fl-r small { font-size: 12px; color: var(--ink-3); padding-left: 26px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pg-handoffs .fm-sel { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 12.5px; color: var(--ink-2); }

/* waiting on a person: model.needs */
.pg-handoffs .nd { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
@container (max-width: 760px) { .pg-handoffs .nd { grid-template-columns: minmax(0, 1fr); } }
.pg-handoffs .nd-i { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; gap: 4px 12px; align-items: start; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255, 181, 71, .2); background: linear-gradient(180deg, rgba(255, 181, 71, .06), rgba(255, 181, 71, .02)); text-align: left; cursor: pointer; font: inherit; color: var(--ink); transition: border-color .15s, box-shadow .2s; min-width: 0; }
.pg-handoffs .nd-i:hover { border-color: rgba(255, 181, 71, .5); box-shadow: 0 0 26px -12px var(--amber-glow); }
.pg-handoffs .nd-i .av-s { margin: 0; }
.pg-handoffs .nd-i b { display: block; font-weight: 600; color: #fff; font-size: 13.5px; }
.pg-handoffs .nd-i p { margin: 2px 0 0; font-size: 12.5px; line-height: 1.4; color: var(--ink-2); }
.pg-handoffs .nd-i small { display: block; margin-top: 4px; font-size: 11.5px; color: var(--ink-3); }
.pg-handoffs .nd-r { display: grid; justify-items: end; gap: 2px; text-align: right; }
.pg-handoffs .nd-r span { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--amber-ink); white-space: nowrap; }
.pg-handoffs .nd-r time { font: 400 13px var(--mono); color: var(--amber-ink); white-space: nowrap; }
.pg-handoffs .nd-r time.old { color: #ffb0b3; }
.pg-handoffs .nd-r em { font: 400 12px var(--mono); font-style: normal; color: var(--ink-2); }
.pg-handoffs .nd-foot { margin-top: 12px; font-size: 12.5px; color: var(--ink-3); }

@container (max-width: 900px) { .pg-handoffs .ho-outs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (max-width: 640px) {
  .pg-handoffs .ho-ctl { grid-template-columns: minmax(0, 1fr); }
  .pg-handoffs .ho-btns .btn { flex: 1; }
  .pg-handoffs .ho-job { grid-template-columns: minmax(0, 1fr) auto; }
  .pg-handoffs .ho-job > div:last-child { grid-column: 1 / -1; }
  .pg-handoffs .ho-st .jb { display: none; }
  .pg-handoffs .ho-st b { font-size: 12.5px; }
  .pg-handoffs .ho-st .tm { font-size: 10.5px; white-space: normal; }
  .pg-handoffs .ho-gap { display: none; }
}
@container (max-width: 560px) {
  .pg-handoffs .ho-hero { --orb: 40px; padding: 16px 14px; }
  .pg-handoffs .ho-top { flex-direction: column; }
  .pg-handoffs .ho-clock { text-align: left; }
  .pg-handoffs .ho-tr { grid-template-columns: auto auto; justify-content: space-between; justify-items: start; align-items: end; width: 100%; }
  .pg-handoffs .ho-outs { grid-template-columns: minmax(0, 1fr); }
  .pg-handoffs .sk { grid-template-columns: 84px minmax(0, 1fr) 84px; }
  .pg-handoffs .sk-nm .av-s { display: none; }
  .pg-handoffs .ho-big b { font-size: 24px; }
}`,

  render(host, ctx) {
    const D = ctx.data, L = ctx.local, F = ctx.F, M = ctx.model;
    if (!D.flows) { host.innerHTML = `<div class="inner pg-handoffs"><h1>How work moves</h1>${note("This page's sample data didn't load.", "red")}</div>`; return; }
    const R = F.relay;
    if (R?.id !== lastRelay) { lastRelay = R?.id; lastPos = null; }
    const J = R ? liveJob(R, F.log) : sampleJob(D.last_job, F);
    const opps = F.seo.opportunities;
    const oppSel = L.opp && opps.some((o) => o.id === L.opp) ? L.opp : (opps.find((o) => o.status === "found") || opps[0]).id;

    // ---------- the hero: the tracker
    const sts = STAGES.map((s, i) => stState(J, i));
    const station = (s, i) => {
      const state = sts[i], tt = J.t[s.key], nm = s.agent ? BY_ID[s.agent].name : "Priya";
      let time;
      if (s.key === "priya") time = state === "waiting" ? `<span data-since="${J.doneAt}" data-pre="Waiting">Waiting · ${dur(Date.now() - J.doneAt)}</span>` : state === "back" ? "Sent back to Clara" : state === "done" ? `Live ${dur((J.priyaMin || 0) * 60000)} later` : "Last to see it";
      else if (state === "doing") time = `<i class="ldot busy"></i> <span data-since="${tt?.s || Date.now()}" data-pre="">${dur(Date.now() - (tt?.s || Date.now()))}</span>`;
      else if (state === "done") time = tt?.e ? `Took ${dur(tt.e - tt.s)}` : "Done";
      else if (state === "bad") time = "Stopped";
      else if (state === "incoming") time = "Coming over…";
      else time = "Next";
      const orb = s.agent ? `<span class="ho-orb" style="--c:${BY_ID[s.agent].color}" aria-hidden="true">${nm[0]}</span>` : `<span class="ho-orb p" aria-hidden="true">P</span>`;
      return `<div class="ho-st ${state}" ${s.agent ? `data-desk="${s.agent}"` : ""}>${orb}<b>${esc(nm)}</b><span class="jb">${esc(s.job)}</span><span class="tm">${time}</span></div>`;
    };
    const pos = J.pos, total = J.doneAt && J.startedAt !== undefined ? J.doneAt - J.startedAt : 0;
    const clock = J.running ? `<div class="ho-clock run"><span>Running</span><b class="num" data-since="${J.startedAt}" data-pre="">${dur(Date.now() - J.startedAt)}</b><em>desk to desk, live</em></div>`
      : J.err ? `<div class="ho-clock"><span>Stopped</span><b class="num">${dur((R?.doneAt || Date.now()) - J.startedAt)}</b><em>start it again below</em></div>`
      : `<div class="ho-clock"><span>Desk to desk in</span><b class="num">${dur(total)}</b><em>${J.live ? "the job you just ran" : `last job, ${esc(dayDate(J.day_offset).toLocaleDateString("en-GB", { weekday: "long" }))}`}</em></div>`;
    const o = J.opp;
    const pkCls = pos === 4 && sts[4] === "waiting" ? "amber rest" : Number.isInteger(pos) ? "rest" : "";
    const gapLbl = J.gaps.map((g, i) => (g != null && pos >= i + 1 ? `<span class="ho-gap" style="left:${X(i + 0.5)}%" data-tip="Picked up ${dur(g)} after it was passed on">${dur(g)}</span>` : "")).join("");
    const hero = `<section class="card hud ho-hero">
        <div class="ho-top"><div><div class="ho-hl"><i class="ldot ${J.running ? "busy" : sts[4] === "waiting" ? "need" : "good"}"></i>Live job tracker</div>
          <h2>One of Seren's searches becomes a checked page and three test ads. Nobody chases it.</h2></div>
          <div class="ho-tr">${clock}<button class="btn primary ho-go" data-start ${J.running ? "disabled" : ""}>${J.running ? "A job is running" : `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.8v10.4L13 8z" fill="currentColor"/></svg>Start a job`}</button></div></div>
        <div class="ho-job"><div><span>Search</span><b>“${esc(o.query)}”</b></div><div><span>A month</span><b class="num">${num(o.monthly_searches)}</b><em>estimate</em></div><div><span>Who shows up now</span><b>${esc(o.competitor.name)} ${esc(o.competitor.ranks)}</b><em>${esc(o.competitor.weakness)}</em></div></div>
        <div class="ho-track"><div class="ho-rail"></div><i class="ho-fill" style="width:${(pos / 4) * 80}%"></i><i class="ho-pk ${pkCls}" style="left:${X(pos)}%"></i>${gapLbl}
          <div class="ho-sts">${STAGES.map(station).join("")}</div></div>
        ${J.err ? `<div class="ho-err">${note(esc(J.err), "red")}</div>` : ""}
        <div class="ho-ctl"><div><span>Pick one of Seren's searches</span><div class="ho-opps">${opps.map((x) => `<button class="ho-opp ${x.id === oppSel ? "on" : ""}" data-opp="${x.id}">${esc(x.query)} <span class="num">${num(x.monthly_searches)}/mo</span></button>`).join("")}</div></div>
          <div class="ho-btns"><button class="btn" data-watch>Watch it in the office</button></div></div>
      </section>`;
    const outs = `<div class="ho-outs">${STAGES.slice(0, 4).map((s, i) => `<section class="ho-out ${sts[i]}" data-out="${s.key}-w"><h4>${av(s.agent)}${esc(s.made)}</h4><div data-out="${s.key}">${outBody(J, s.key, sts[i])}</div></section>`).join("")}</div>`;

    // ---------- every hand-off, last 28 days
    const flows = flowsOf(D, M);
    const handN = flows.reduce((a, f) => a + f.n, 0);
    const H = 420, lay = sankeyLayout(D, flows, H), fs = L.fs || null, isFlow = fs?.includes(">");
    const nodeOn = (id, side) => !fs ? "" : (isFlow ? fs.split(">")[side === "l" ? 0 : 1] === id : id === fs || lay.bands.some((b) => isOn(fs, b) && (side === "l" ? b.from : b.to) === id)) ? "on" : "dim";
    const node = (n, side) => `<button class="sk-n ${PEOPLE.has(n.id) ? "p" : ""} ${nodeOn(n.id, side)}" style="top:${n.y.toFixed(1)}px;height:${n.h.toFixed(1)}px" data-fs="${n.id}" data-tip="${esc(`${nameOf(D, n.id)} ${side === "l" ? "handed on" : "picked up"} ${n.v}, last 28 days`)}"><span class="sk-nm">${pav(D, n.id)}${esc(nameOf(D, n.id))}</span><em>${num(n.v)}</em><i class="sk-bar"></i></button>`;
    const sorted = flows.slice().sort((a, b) => b.n - a.n), listed = fs ? sorted.filter((f) => isOn(fs, f)) : L.allFlows ? sorted : sorted.slice(0, 7);
    const fsLabel = fs ? (isFlow ? `${nameOf(D, fs.split(">")[0])} → ${nameOf(D, fs.split(">")[1])}` : nameOf(D, fs)) : "";
    const flowCard = `<div class="ho-sec"><div><h2>Every hand-off in the office</h2><p>Each band is work one desk finished and the next picked up, last 28 days. The thicker the band, the more of it. Amber ones went to a person.</p></div>
        <div class="ho-big"><div><b data-count="${handN}">${num(handN)}</b><span>hand-offs</span></div><div><b class="g">0</b><span>lost between desks</span></div></div></div>
      <section class="card"><div class="fm">
        <div><div class="sk" style="height:${H}px"><div class="sk-col l">${lay.Ln.map((n) => node(n, "l")).join("")}</div><svg class="sk-svg" data-h="${H}" style="height:${H}px" role="img" aria-label="Hand-offs between desks, last 28 days"></svg><div class="sk-col r">${lay.Rn.map((n) => node(n, "r")).join("")}</div></div>
          <div class="sk-x"><span>Hands it on</span><span>Picks it up</span></div></div>
        <div><div class="fl">${listed.map((f) => `<button class="fl-r ${fs && isOn(fs, f) ? "on" : ""}" data-fs="${f.from}>${f.to}"><span class="fl-w">${pav(D, f.from)}${esc(nameOf(D, f.from))}<i>→</i>${pav(D, f.to)}${esc(nameOf(D, f.to))}</span><em>${num(f.n)}</em><small>${esc(f.what)}</small></button>`).join("")}</div>
          ${fs ? `<div class="fm-sel">Showing ${esc(fsLabel)} <button class="btn sm" data-fsclear>Show all</button></div>` : sorted.length > 7 ? `<div class="fm-sel"><button class="btn sm" data-allflows>${L.allFlows ? "Show the top seven" : `Show all ${sorted.length}`}</button></div>` : ""}</div>
      </div></section>`;

    // ---------- waiting on a person: the one list
    const needs = M.needs, who3 = ["Priya", "Kieran", "Tom"], wf = L.wf && who3.includes(L.wf) ? L.wf : "all";
    const shown = needs.filter((n) => wf === "all" || n.who === wf).sort((a, b) => b.mins - a.mins);
    const ago = (m) => (m < 60 ? `${m} min` : `${Math.round(m / 60)} h`);
    const waitCard = `<div class="ho-sec"><div><h2>Waiting on a person</h2><p>The AI team never sends, pays or publishes on its own. These are the things it's finished and handed to Priya, Kieran or Tom.</p></div>
        <div class="ho-big"><div><b class="a" data-count="${needs.length}">${needs.length}</b><span>things waiting</span></div><div data-tip="${esc(needs.filter((n) => n.value_gbp).map((n) => `${money(n.value_gbp, 0)} ${n.what.toLowerCase()}`).join(" + ") + ` = ${money(M.needs_total.value_gbp, 0)}`)}"><b class="a">${money(M.needs_total.value_gbp, 0)}</b><span>riding on them</span></div></div></div>
      <section class="card"><div class="ch"><h3>${wf === "all" ? "Everyone" : `For ${esc(wf)}`}</h3><div class="r">${seg([["all", `All ${needs.length}`], ...who3.map((p) => [p, `${p} ${needs.filter((n) => n.who === p).length}`])], wf, "wf")}</div></div>
        <div class="nd">${shown.map((n) => `<button class="nd-i" data-need="${n.id}">${av(n.agent)}<div><b>${esc(n.what)}</b><p>${esc(n.detail)}</p><small>${esc(n.why)}</small></div>
          <div class="nd-r"><span>${esc(n.who)}</span><time class="${n.mins >= 1440 ? "old" : ""}">${ago(n.mins)}</time>${n.value_gbp ? `<em>${money(n.value_gbp, 0)}</em>` : ""}</div></button>`).join("")}</div>
        <div class="nd-foot">Anything waiting a day or more shows in red. Maeve nudges Priya at her 5:30pm round-up; anything for Tom waits for Monday's check.</div></section>`;

    host.innerHTML = `<div class="inner pg-handoffs">
      <header class="ho-hh"><h1>How work moves</h1><p class="lede">Work passes from desk to desk on its own. Start a job and watch it go.</p></header>
      ${hero}${outs}
      ${flowCard}
      ${waitCard}
      ${foot()}
    </div>`;

    // ---------- wiring
    $$("[data-opp]", host).forEach((b) => (b.onclick = () => { L.opp = b.dataset.opp; ctx.redraw(); }));
    $$("[data-start]", host).forEach((b) => (b.onclick = async () => { b.disabled = true; b.textContent = "Starting…"; try { if (await ctx.startRelay(oppSel)) ctx.flash("Seren's on it. Watch it pass desk to desk."); } catch (err) { ctx.flash(err.message); } }));
    $$("[data-watch]", host).forEach((b) => (b.onclick = () => { if (ctx.S) ctx.S.followRelay = true; ctx.go("floor"); }));
    $$(".ho-st[data-desk]", host).forEach((el) => (el.onclick = () => ctx.openAgent(el.dataset.desk)));
    const pickFs = (v) => { L.fs = L.fs === v ? null : v; ctx.redraw(); };
    $$("[data-fs]", host).forEach((el) => (el.onclick = () => pickFs(el.dataset.fs)));
    $$("[data-fsclear]", host).forEach((b) => (b.onclick = () => { L.fs = null; ctx.redraw(); }));
    $$("[data-allflows]", host).forEach((b) => (b.onclick = () => { L.allFlows = !L.allFlows; ctx.redraw(); }));
    $$("[data-wf]", host).forEach((b) => (b.onclick = () => { L.wf = b.dataset.wf; ctx.redraw(); }));
    $$("[data-need]", host).forEach((el) => (el.onclick = () => { const n = needs.find((x) => x.id === el.dataset.need); if (!n) return; n.page === "team" && !PAGE_OF[n.agent] ? ctx.openAgent(n.agent) : ctx.go(n.page || "tasks"); }));
    // the bands, at the real width; again whenever the card changes size
    drawBands(host, D, lay, fs, pickFs);
    if (ro) ro.disconnect();
    const svg = $(".sk-svg", host);
    if (svg && window.ResizeObserver) { ro = new ResizeObserver(() => drawBands(host, D, lay, fs, pickFs)); ro.observe(svg); }
    // slide the packet from where it was to where it is now
    const pk = $(".ho-pk", host), fill = $(".ho-fill", host);
    if (pk && fill && lastPos != null && lastPos !== pos) {
      pk.style.transition = fill.style.transition = "none";
      pk.style.left = `${X(lastPos)}%`; fill.style.width = `${(lastPos / 4) * 80}%`;
      void pk.offsetWidth;
      pk.style.transition = fill.style.transition = "";
      pk.style.left = `${X(pos)}%`; fill.style.width = `${(pos / 4) * 80}%`;
    }
    lastPos = pos;
    // tick the running clocks once a second without redrawing the page
    clearInterval(ticker);
    ticker = setInterval(() => { for (const el of $$("[data-since]", host)) el.textContent = `${el.dataset.pre ? el.dataset.pre + " · " : ""}${dur(Date.now() - Number(el.dataset.since))}`; }, 1000);
  },
  onEvent(ev, ctx) {
    // Clara's page streams in: update her card in place rather than redrawing everything
    if (ev.type === "relayPartial") {
      const el = document.querySelector('.pg-handoffs [data-out="content"]');
      if (el && ctx.F.relay) el.innerHTML = outBody(liveJob(ctx.F.relay, ctx.F.log), "content", "doing");
      return false;
    }
    return ev.demo === "floor" && ["relay", "reset"].includes(ev.type);
  },
  leave() { clearInterval(ticker); ticker = null; if (ro) ro.disconnect(); ro = null; },
};
