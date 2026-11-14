// Kingpost office floor: the whole AI team in one 3D office. Sample company; every AI step is live.
// Site demo copy (skales demos/ai-team): no server. Reads come from ./data via static-api.js, nothing calls Claude,
// and a live step opens the "runs live on a call" sheet (live-note.js). Changes from Tom's app are marked "site demo".
import { createScene } from "./scene.js";
import { AGENTS, BY_ID } from "./agents.js";
import { drawScreen } from "./screens.js";
import { createBrainWall } from "./brainwall.js";
import { createNarrator } from "./narrator.js";
import { PLACES, PEOPLE, SECTIONS, SECTION_OF, LIT, ITEM, ICONS, PAGE_IDS } from "./nav.js";
import * as UI from "./ui.js";
import { api as staticApi } from "./static-api.js"; // site demo
import { liveOnly, LIVE } from "./live-note.js"; // site demo

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n, dp = 2) => "£" + Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const hhmm = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayDate = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return d; };
// site demo: no server. Reads come from the snapshots; anything live opens the sheet and throws a quiet error
const api = (path, body) => staticApi(path, body);
const PRICES = () => !!window.AI_TEAM_SHOW_PRICES;
const Q = new URLSearchParams(location.search);
if (Q.get("frame") === "916") document.body.classList.add("portrait");
const N = createNarrator();
const S = { ps: {}, inv: null, inbox: null, plan: null, chase: null, brain: null, invPartials: {}, partial: null, fl: null, lessons: [], view: "floor", sel: null, note: null, chat: [], selOpp: null, followRelay: false, toast: null };

// ------------------------------------------------------------------ boot
const S3 = await createScene($("#gl"));
const wall = createBrainWall(S3.brain.canvas, S3.brain.tex);
async function loadAll() {
  const [inv, inbox, plan, chase, brain, fl, les, graph] = await Promise.all([api("/api/office/inv/state"), api("/api/d2/state"), api("/api/d3/state"), api("/api/office/chase/state"), api("/api/office/brain"), api("/api/floor/state"), api("/api/office/lessons"), api("/api/floor/graph")]);
  Object.assign(S, { inv, inbox, plan, chase, brain, fl, lessons: les.lessons });
  N.scan(S); wall.setGraph(graph); dirtyAll(); render();
}

// ------------------------------------------------------------------ live events
let graphTimer = null;
const refreshGraph = () => { clearTimeout(graphTimer); graphTimer = setTimeout(() => api("/api/floor/graph").then((g) => wall.setGraph(g)).catch(() => {}), 1200); };
const es = { onmessage: null }; // site demo: no live events, nothing on this page changes by itself
es.onmessage = (m) => {
  const ev = JSON.parse(m.data);
  if (!S.fl || !S.inv) return; // still loading: loadAll() fetches the full state anyway
  if (ev.demo === "office") {
    if (ev.type === "sheet") { const i = S.inv.sheets.findIndex((s) => s.id === ev.sheet.id); if (i < 0) S.inv.sheets.unshift(ev.sheet); else S.inv.sheets[i] = ev.sheet; dirty("invoices"); }
    else if (ev.type === "progress") S.invPartials[ev.id] = ev.partial;
    else if (ev.type === "messages") S.inv.messages = ev.messages;
    else if (ev.type === "chase") { const i = S.chase.items.findIndex((x) => x.id === ev.item.id); S.chase.items[i] = ev.item; dirty("money"); }
    else if (ev.type === "chaseStart") { S.chase.running = true; S.chase.ranAt = ev.ranAt; }
    else if (ev.type === "chaseDone") { S.chase.running = false; S.chase.ms = ev.ms; }
    else if (ev.type === "brain") { S.brain = ev.brain; dirtyAll(); refreshGraph(); }
    else if (ev.type === "lessons") { S.lessons = ev.lessons; dirty("coach"); refreshGraph(); }
    else if (ev.type === "reset" || ev.type === "chaseReset") return loadAll();
  } else if (ev.demo === "d2") {
    if (ev.type === "email") { const i = S.inbox.emails.findIndex((x) => x.id === ev.email.id); if (i >= 0) S.inbox.emails[i] = ev.email; }
    else if (ev.type === "emails") S.inbox.emails = ev.emails;
    else if (ev.type === "diary") S.inbox.bookings = ev.bookings;
    else if (ev.type === "drafts") S.inbox.drafts = ev.drafts;
    else if (ev.type === "run") { S.inbox.running = ev.running; if (ev.ranAt) S.inbox.ranAt = ev.ranAt; if (ev.ms) S.inbox.ms = ev.ms; }
    else if (ev.type === "reset") return loadAll();
    dirty("inbox");
  } else if (ev.demo === "d3") {
    if (ev.type === "state") { S.plan = ev.state; S.partial = null; }
    else if (ev.type === "busy") S.plan.busy = ev.busy;
    else if (ev.type === "partial") S.partial = ev.routes;
    else if (ev.type === "texts") S.plan.texts = ev.texts;
    dirty("jobs");
  } else if (ev.demo === "floor") {
    const F = S.fl;
    if (ev.type === "log") { F.log.push(ev.line); dirty(ev.line.agent); }
    else if (ev.type === "relay") { const prev = F.relay?.stage; F.relay = ev.relay; if (prev !== ev.relay.stage) relayMoved(ev.relay); ["seo", "content", "ads", "manager"].forEach(dirty); refreshGraph(); }
    else if (ev.type === "relayPartial") { if (F.relay) F.relay.page = ev.page; dirty("content"); }
    else if (ev.type === "doc") { F.docs[ev.doc.id] = ev.doc; dirty("paperwork"); refreshGraph(); }
    else if (ev.type === "docPartial") { if (F.docs[ev.id]) F.docs[ev.id].partial = ev.partial; dirty("paperwork"); }
    else if (ev.type === "drift") { const prev = F.drift?.stage; F.drift = ev.drift; if (prev !== ev.drift.stage) driftMoved(ev.drift); dirty("ads"); dirty("manager"); refreshGraph(); }
    else if (ev.type === "friday") { F.friday = ev.friday; dirty("coach"); }
    else if (ev.type === "act") { (F.acts ||= {})[ev.page] = ev.store; if (ev.graph) refreshGraph(); }
    else if (ev.type === "tasks") { F.tasks = ev.tasks; dirty("manager"); }
    else if (ev.type === "reset") return loadAll();
  }
  N.scan(S); render(); pageEvent(ev);
};

// ------------------------------------------------------------------ what each employee is doing
const fl = (id) => S.fl.log.filter((l) => l.agent === id);
// live work started from a page (a search check, a draft, test ads, a photo, a plan, the Monday sheet)
const PAGE_WORK = { seo: ["search", "Checking a search Tom typed in"], content: ["content", "Writing a draft for Priya"], ads: ["ads", "Writing three test ads"], paperwork: ["paperwork", "Reading a photo someone dropped in"], manager: ["tasks", "Turning a goal into tasks"], coach: ["check", "Preparing Tom's Monday sheet"] };
function pageBusy(id) {
  const w = PAGE_WORK[id]; if (!w) return null;
  const st = S.fl.acts?.[w[0]]; if (!st) return null;
  const running = Object.values(st).some((v) => (Array.isArray(v) ? v.some((x) => x?.running || x?.status === "reading") : v?.running));
  return running ? { busy: true, text: w[1] } : null;
}
function status(id) {
  if (!S.fl || !S.inv) return { text: "" };
  const F = S.fl, R = F.relay, X = F.drift;
  const pb = pageBusy(id); if (pb) return pb;
  if (["invoices", "inbox", "jobs", "money"].includes(id)) return deskStatus(id);
  if (id === "seo") { if (R?.running && R.stage === "seo") return { busy: true, text: "Writing Clara's brief" }; return { text: `${F.seo.opportunities.length} searches nobody serves well` }; }
  if (id === "content") { if (R?.running && R.stage === "content") return { busy: true, text: `Writing “${R.opp.page_to_build.title}”` }; return { text: `${F.content.drafts.filter((d) => d.status !== "published").length} drafts on the go` }; }
  if (id === "ads") {
    if (X?.running && ["drift", "checking"].includes(X.stage)) return { busy: true, text: "Changing the boiler campaign" };
    if (X?.running && X.stage === "paused") return { alert: true, text: "Paused by Maeve: off task" };
    if (X?.running && ["redoing", "rechecking"].includes(X.stage)) return { busy: true, text: "Redoing it inside the brief" };
    if (R?.running && R.stage === "ads") return { busy: true, text: "Writing three ads to test the page" };
    const c = F.ads.campaigns, w = F.model?.weeks?.at(-1); return { text: `${c.length} campaigns · ${money(w ? w.ad_spend : c.reduce((a, x) => a + x.spend_week, 0), 2)} in the last 7 days` };
  }
  if (id === "paperwork") { const r = Object.values(F.docs).find((d) => d.status === "reading"); if (r) return { busy: true, text: "Reading a photo of paperwork" }; const n = [...Object.values(F.docs), ...(F.acts?.paperwork?.uploads || [])].filter((d) => d.dash).length; return { text: n ? `${n} document${n > 1 ? "s" : ""} turned into dashboards` : "Waiting for a photo" }; }
  if (id === "manager") {
    if (X?.running && ["checking", "rechecking"].includes(X.stage)) return { busy: true, text: "Checking Archie's change" };
    if (X?.running && X.stage === "paused") return { busy: true, text: "Stopped Archie going off task" };
    if (R?.running && R.stage === "review") return { busy: true, text: "Checking the page and ads" };
    const t = [...F.manager.tasks, ...(F.pages?.tasks?.extra_tasks || []), ...F.tasks]; return { text: `${t.filter((x) => x.status === "doing").length} tasks in progress · ${t.filter((x) => x.status === "review").length} to check` };
  }
  if (id === "coach") { if (F.friday?.running) return { busy: true, text: "Writing the Friday report" }; return { text: `${(F.model?.employees?.coach?.units?.at(-1) ?? F.coach.rules_this_week.length) + S.lessons.length} new rules in the last 7 days` }; }
  return { text: "" };
}

// The original four desks: their live work runs on a slice of the firm (today's job sheets, this inbox round,
// the last jobs to place on the reactive vans, today's chase list). Every firm-wide figure comes from the model.
const need = (agent) => S.fl.model.needs.find((n) => n.agent === agent);
const countIn = (t) => Number(((/(\d[\d,]*)/.exec(t || "") || [])[1] || "0").replace(/,/g, ""));
const n0 = (n) => Number(n).toLocaleString("en-GB");
const perDay = (id) => S.fl.model.employees[id].units.at(-1) / 5; // the last 7 days hold 5 working days
const batch = () => { const b = need("invoices"); return { n: countIn(b.what), gbp: b.value_gbp }; };
const placedTomorrow = () => { const T = S.plan.tomorrow; return T.planned_jobs + (S.plan.plan ? T.placed_live : 0); };
function deskStatus(id) {
  const n = N.now(S, id);
  if (n.busy || (S.brain?.autopilot && !n.ask)) return n;
  const M = S.fl.model;
  if (id === "invoices") { const live = S.inv.sheets.filter((s) => s.status === "ready" && !s.approved).length; return { text: `${batch().n + live} invoices waiting for Priya`, ask: true }; }
  if (id === "inbox") {
    const earlier = countIn(need("inbox").what);
    if (n.ask) return { text: `${earlier + countIn(n.text)} things waiting for Priya`, ask: true };
    return /^Inbox clear/.test(n.text) ? { text: `Inbox clear. ${earlier} replies waiting for Priya` } : n;
  }
  if (id === "jobs") {
    const T = S.plan.tomorrow;
    if (n.ask && /rule/.test(n.text)) return n;
    if (!S.plan.plan) return { text: `${T.left_jobs} of tomorrow's ${T.jobs} jobs left to place. Plans at 3pm` };
    if (!S.plan.texts?.at && !S.plan.overrun) return { text: `${placedTomorrow()} of ${T.jobs} jobs placed for tomorrow. Ready for Priya`, ask: true };
    return n;
  }
  if (id === "money") return n.ask ? n : { text: `${money(M.firm.owed_gbp, 0)} owed · ${money(M.firm.owed_over_30_gbp, 0)} over 30 days` };
  return n;
}

// ------------------------------------------------------------------ name tags over the desks
const tags = {};
for (const a of AGENTS) {
  const el = document.createElement("div"); el.className = "tag";
  el.innerHTML = `<span class="av" style="background:${a.color}">${a.name[0]}</span><b>${a.name}</b><span></span>`;
  el.onclick = () => openAgent(a.id);
  $("#tags").appendChild(el); tags[a.id] = el;
}
function tagMode(el, mode) { if (el._mode === mode) return; el.classList.remove("small", "dim"); if (mode) el.classList.add(...mode.split(" ")); el._mode = mode; }
function measureTag(el) { tagMode(el, ""); el._wFull = el.offsetWidth; el._h = el.offsetHeight; el.classList.add("small"); el._wSmall = el.offsetWidth; el.classList.remove("small"); }
new ResizeObserver(() => Object.values(tags).forEach((t) => (t._wFull = 0))).observe($("#stage"));
S3.onPick((id) => openAgent(id));
S3.onWall((w, uv) => { if (w === "numbers") return go("overview"); const n = wall.pick(uv); if (n) openNote(n.id); });
S3.onFrame(() => {
  const now = performance.now();
  wall.tick(now);
  // nearest desks first; a tag that would cover a nearer one shrinks to the name, then fades
  const show = S.view === "floor", placed = [];
  const list = AGENTS.map((a) => ({ p: S3.project(a.id), el: tags[a.id] })).sort((x, y) => x.p.d - y.p.d);
  for (const { p, el } of list) {
    el.style.display = p.on && show ? "" : "none";
    el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
    el.style.left = "0"; el.style.top = "0";
    if (!p.on || !show) continue;
    if (!el._wFull) measureTag(el);
    const box = (w) => ({ l: p.x - w / 2 - 4, r: p.x + w / 2 + 4, t: p.y - el._h, b: p.y });
    const hit = (b) => placed.some((q) => b.l < q.r && b.r > q.l && b.t < q.b && b.b > q.t);
    let b = box(el._wFull), mode = "";
    if (hit(b)) { b = box(el._wSmall); mode = hit(b) ? "small dim" : "small"; }
    placed.push(b);
    tagMode(el, mode);
  }
  flushScreens();
});

// ------------------------------------------------------------------ the monitors
const dirtySet = new Set(); let lastFlush = 0;
const dirty = (id) => dirtySet.add(id);
const dirtyAll = () => AGENTS.forEach((a) => dirtySet.add(a.id));
const SWATCH = { "g-boiler": "#c9b49a", "g-boiler-ba-sn": "#d1bfa6", "g-plumb": "#a7b9c4", "g-elec": "#c4bc96", "g-leak": "#9fb0b8", "m-landlord": "#b5a7b8", "m-ext": "#a9b79b" };
function screenView(id) {
  const st = status(id), F = S.fl, base = { status: st.text, busy: !!st.busy, alert: !!st.alert };
  if (id === "invoices") return { ...base, title: `Job sheets → invoices · about ${n0(perDay("invoices"))} a day`, rows: [{ a: "Contract batch for Priya", b: `${batch().n} invoices · ${money(batch().gbp, 0)}`, tag: "To approve", tone: "amber" }, ...S.inv.sheets.slice(0, 4).map((s) => ({ a: s.read?.header?.customer || "Reading…", b: s.invoice ? money(s.invoice.total) : "", tag: s.approved ? "Approved" : s.status === "reading" ? "Reading" : "To approve", tone: s.approved ? "green" : "amber" }))] };
  if (id === "inbox") return { ...base, title: `Office inbox · about ${n0(perDay("inbox"))} a day`, rows: S.inbox.emails.slice().sort((a, b) => b.receivedAt - a.receivedAt).slice(0, 5).map((e) => ({ a: e.from_name, b: e.subject, tag: e.status === "done" ? ({ diary: "Booked", kieran: "Kieran", accounts: "Accounts", answered: "Answered", priya: "Priya", junk: "Junk", check_me: "Check" }[e.result?.route] || "Done") : e.status === "unread" ? "New" : "Reading", tone: e.result?.route === "check_me" ? "amber" : e.status === "done" ? "" : "amber" })) };
  if (id === "jobs") {
    const T = S.plan.tomorrow;
    if (!S.plan.plan) return { ...base, title: `Tomorrow · ${n0(T.jobs)} jobs on ${T.vans} vans`, rows: [{ a: `${T.planned_jobs} jobs on ${T.planned_vans} vans`, b: "Already planned", tag: "Planned", tone: "green" }, { a: `${T.left_jobs} jobs left to place`, b: `On the ${T.left_vans} reactive vans. Rowan plans at 3pm`, tag: "3pm", tone: "amber" }] };
    return { ...base, kind: "bars", title: `Tomorrow · ${placedTomorrow()} of ${T.jobs} jobs placed on ${T.vans} vans`, bars: [...T.areas.map((a) => ({ label: a.name, value: a.jobs, note: `${a.jobs} jobs · ${a.vans} vans` })), { label: "Reactive repairs (Rowan, live)", value: T.placed_live, note: `${T.placed_live} jobs · ${T.left_vans} vans`, hot: true }] };
  }
  if (id === "money") return { ...base, title: `${money(F.model.firm.owed_gbp, 0)} owed · today's chase list`, rows: S.chase.items.map((i) => ({ a: i.customer, b: `${money(i.amount)} · ${i.days_overdue} days`, tag: { waiting: "Not chased", draft: "Draft ready", for_person: "Needs Priya", sent: "Sent", paid: "Paid", working: "Reading", skipped: "Skipped" }[i.status] || i.status, tone: i.status === "paid" ? "green" : i.status === "for_person" ? "amber" : "" })) };
  if (id === "seo") return { ...base, kind: "bars", title: "Searches nobody serves well", bars: F.seo.opportunities.map((o) => ({ label: o.query, value: o.monthly_searches, note: `${o.monthly_searches}/mo`, hot: F.relay?.opp?.id === o.id && F.relay.running })) };
  if (id === "content") { const p = F.relay?.page; if (p) return { ...base, kind: "doc", title: "Drafting a page", doc: { title: p.title || "", paras: [{ t: p.intro || "" }, ...(p.sections || []).flatMap((s) => [{ h: s?.heading || "" }, { t: s?.body || "" }])] } }; return { ...base, title: "Drafts", rows: F.content.drafts.map((d) => ({ a: d.title, b: `${d.type} · ${d.words} words`, tag: d.status })) }; }
  if (id === "ads") return { ...base, kind: "grid", title: "Creatives, last 7 days", tiles: F.ads.creatives.map((c) => ({ label: c.headline, verdict: c.verdict, swatch: SWATCH[c.campaign_id] })) };
  if (id === "paperwork") { const d = Object.values(F.docs).find((x) => x.dash || x.partial); const dash = d?.dash || d?.partial; if (dash) return { ...base, kind: "dash", title: dash.title || "Reading…", kpis: dash.columns ? measures(dash).slice(0, 3).map((m) => ({ label: m.label, value: m.value })) : [], rows: (dash.rows || []).filter(Array.isArray) }; return { ...base, title: "Paperwork", rows: S.fl.photos.map((p) => ({ a: p.id === "plant-hire" ? "Plant & tool hire log (photo)" : "Van 7 stock check (photo)", b: "Waiting to be read", tag: "Photo" })) }; }
  if (id === "manager") { const t = [...F.manager.tasks, ...F.tasks.map((x) => ({ ...x, hot: true }))]; return { ...base, kind: "kanban", title: "Task board", columns: ["doing", "review", "done"].map((s) => ({ name: s === "doing" ? "Doing" : s === "review" ? "To check" : "Done", cards: t.filter((x) => x.status === s).slice(-5).reverse().map((x) => ({ t: x.title, color: BY_ID[x.agent]?.color, hot: x.hot })) })) }; }
  if (id === "coach") return { ...base, kind: "metrics", title: "Last 7 days vs the 7 before", metrics: F.coach.metrics.map((m) => ({ agent: BY_ID[m.agent]?.name || m.agent, measure: m.measure, from: m.last_week, to: m.this_week, good: m.better_when === "lower" ? m.this_week <= m.last_week : m.this_week >= m.last_week })) };
  return base;
}
function flushScreens() {
  if (!S.fl || !S.inv) return;
  if (!dirtySet.size || performance.now() - lastFlush < 250) return;
  lastFlush = performance.now();
  for (const id of dirtySet) {
    const d = S3.desks[id]; if (!d) continue;
    const v = screenView(id);
    drawScreen(d.screens[0].canvas, BY_ID[id], v); d.screens[0].tex.needsUpdate = true;
    if (d.screens[1]) { drawScreen(d.screens[1].canvas, BY_ID[id], { ...v, kind: "list", title: "Checks today", rows: fl("manager").slice(-6).reverse().map((l) => ({ a: l.text, b: hhmm(l.at), tone: l.kind === "urgent" ? "red" : "" })), empty: "Nothing checked yet today" }); d.screens[1].tex.needsUpdate = true; }
    S3.setBusy(id, !!v.busy, !!v.alert);
  }
  dirtySet.clear();
}
setInterval(() => { dirtyAll(); render(); }, 4000);

// ------------------------------------------------------------------ the job that passes desk to desk
function relayMoved(R) {
  const opp = R.opp;
  const hop = { "to-content": ["seo", "content", opp.query, "Brief from Seren"], "to-ads": ["content", "ads", R.page?.title || opp.page_to_build.title, "Page from Clara"], "to-manager": ["ads", "manager", "Page + 3 ads to check", "From Archie"] }[R.stage];
  if (hop) { const follow = S.followRelay && S.view === "floor"; S3.sendPacket(hop[0], hop[1], hop[2], hop[3], { ms: 2700, follow }); flash(`${BY_ID[hop[0]].name} passed it to ${BY_ID[hop[1]].name}`); }
  if (R.stage === "done" && R.review) flash(R.review.verdict === "approved" ? "Maeve approved it. Waiting for Priya to publish" : "Maeve sent it back with changes");
}
function driftMoved(X) {
  if (X.stage === "checking" || X.stage === "rechecking") S3.sendPacket("ads", "manager", X.stage === "checking" ? "Boiler campaign change" : "Redone, inside the brief", "From Archie", { ms: 2200, follow: false });
  if (X.stage === "paused") { flash("Maeve stopped Archie: off task"); S3.sendPacket("manager", "ads", "Paused: redo it inside the brief", "From Maeve", { ms: 2200, follow: false }); }
}
function flash(t) { if (t === LIVE) return; const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (el.hidden = true), 3600); }

// ------------------------------------------------------------------ views
function go(v) { location.hash = "#" + v; }
addEventListener("hashchange", route);
function route() {
  if (location.hash === "#costs" && !PRICES()) return location.replace("#overview"); // site demo: no prices yet
  const v = location.hash.slice(1) || "home";
  const was = S.view;
  S.view = PAGE_IDS.includes(v) ? v : "floor";
  if (was === "floor" && S.view !== "floor" && (S.sel || S.note)) closePanel(); // a desk panel belongs to the office
  render();
  if (S.view !== was || !pageShown) drawPage({ fresh: true });
}

// ------------------------------------------------------------------ the side menu
const KP = `<span class="kp" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M2.5 18.5L12 5l9.5 13.5z"/><path d="M12 5v13.5M12 12.2l-4.4 6.3M12 12.2l4.4 6.3"/></svg></span>`;
// the status (autopilot, who's working, the clock) sits top right over the office, and at the foot of the menu elsewhere
function placeStatus() {
  const st = $(".status"), r = $("#rail");
  if (S.view === "floor") { if (st.parentElement !== $("#stage")) $("#stage").appendChild(st); }
  else if (st.parentElement !== r) r.appendChild(st);
}
function renderRail() {
  const r = $("#rail");
  document.body.dataset.view = S.view;
  r.classList.toggle("mini", S.view === "floor");
  // rebuild the menu only when the page changes: rebuilding it under the pointer swallows clicks.
  // The live dots update in place.
  if (r.dataset.sig === S.view) { for (const el of r.querySelectorAll("[data-live]")) el.classList.toggle("on", !!status(el.dataset.live).busy); return placeStatus(); }
  r.dataset.sig = S.view;
  const st = $(".status"); if (st && r.contains(st)) $("#stage").appendChild(st); // keep the status bar: rebuilding the menu must not delete it
  const lit = LIT[S.view];
  const person = PEOPLE.find((p) => p.page === S.view);
  r.innerHTML = `<a class="rbrand" href="#home" aria-label="Kingpost home">${KP}<span class="lbl"><b>Kingpost</b><span>AI team · ${window.AI_TEAM_STATIC ? "sample" : "live"}</span></span></a>
    <nav class="rnav">
      <div class="rg">${PLACES.map((it) => `<a href="#${it.id}" data-label="${UI.esc(it.label)}"${it.id === lit ? ' aria-current="page"' : ""}><span class="ic">${ICONS[it.icon]}</span><span class="lbl">${UI.esc(it.label)}</span></a>`).join("")}</div>
      <div class="rg people"><h4>Your AI team</h4>${PEOPLE.map((p) => { const a = BY_ID[p.agent], st = status(p.agent); return `<a href="#${p.page || "floor"}" ${p.page ? "" : `data-desk="${p.agent}"`} data-label="${UI.esc(a.name)}"${person?.agent === p.agent ? ' aria-current="page"' : ""}>${UI.av(p.agent)}<span class="lbl">${UI.esc(a.name)}<em>${UI.esc(a.role)}</em></span><i class="live ${st.busy ? "on" : ""}" data-live="${p.agent}"></i></a>`; }).join("")}</div>
    </nav>`;
  $$("[data-desk]", r).forEach((el) => (el.onclick = (e) => { e.preventDefault(); openAgent(el.dataset.desk); }));
  placeStatus();
  // in the 9:16 frame the menu is a strip: keep the current page in view
  const cur = $("[aria-current]", r);
  if (cur && r.scrollWidth > r.clientWidth + 4) r.scrollLeft = cur.offsetLeft - (r.clientWidth - cur.offsetWidth) / 2;
}

// ------------------------------------------------------------------ pages: one module per page in ./pages/<id>.js
// A page module: export default { render(host, ctx), onEvent?(ev, ctx) -> bool, leave?(), css?: string }
const mods = {};
function pageMod(id) {
  return (mods[id] ||= import(`./pages/${id}.js`).then((m) => {
    const mod = m.default;
    if (mod.css && !document.querySelector(`style[data-page="${id}"]`)) { const st = document.createElement("style"); st.dataset.page = id; st.textContent = mod.css; document.head.appendChild(st); }
    return mod;
  }).catch((err) => { console.error(err); mods[id] = null; return { render(host) { host.innerHTML = `<div class="inner">${UI.head({ title: ITEM[id]?.label || id })}${UI.note(`This page didn't load: ${UI.esc(err.message)}`, "red")}</div>`; } }; }));
}
function ctxFor(id) {
  const F = S.fl;
  return {
    id, S, F, model: F.model, data: F.pages?.[id] || {}, pages: F.pages || {}, acts: F.acts?.[id] || {}, local: (S.ps[id] ||= {}),
    lessons: S.lessons, office: { inv: S.inv, inbox: S.inbox, plan: S.plan, chase: S.chase, brain: S.brain },
    api, act: (name, body = {}) => api(`/api/floor/act/${id}/${name}`, body),
    redraw: () => drawPage({ force: true }), go, flash, ask, startRelay, openAgent, openNote, status, feed,
    graph: () => api("/api/floor/graph"), createBrainWall, wall, S3, ui: UI, live: liveOnly,
  };
}
let pageShown = null, drawTimer = null, lastDraw = 0, pendingDraw = false;
async function drawPage({ fresh = false, force = false } = {}) {
  const host = $("#page"), id = S.view;
  if (id === "floor") { if (pageShown) { (await pageMod(pageShown)).leave?.(); pageShown = null; } return; }
  if (pageShown && pageShown !== id) (await pageMod(pageShown)).leave?.();
  const mod = await pageMod(id);
  if (S.view !== id) return;
  const a = document.activeElement;
  if (!force && !fresh && (pressing || (host.contains(a) && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)))) { pendingDraw = true; return; }
  const top = fresh && pageShown !== id ? 0 : host.scrollTop;
  pageShown = id; lastDraw = performance.now();
  $("#cover")?.classList.add("gone"); // a page covers the office, so don't wait for the 3D to draw
  try { mod.render(host, ctxFor(id)); }
  catch (err) { console.error(err); host.innerHTML = `<div class="inner">${UI.note(`Couldn't draw this page: ${UI.esc(err.message)}`, "red")}</div>`; }
  host.scrollTop = top;
  const sec = SECTIONS[SECTION_OF[id]], inner = $(".inner", host);
  if (sec && inner && !$(":scope > .sectabs", inner)) inner.insertAdjacentHTML("afterbegin", `<nav class="sectabs">${sec.map(([pid, label]) => `<a href="#${pid}"${pid === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`);
  $$("[data-go]", host).forEach((el) => { if (!el.onclick) el.onclick = () => go(el.dataset.go); });
  UI.wireTips(host);
  if (fresh) UI.countUp(host);
}
function pageEvent(ev) {
  if (S.view === "floor" || !pageShown) return;
  const mod = mods[S.view]; if (!mod) return;
  mod.then((m) => {
    const want = m.onEvent ? m.onEvent(ev, ctxFor(S.view)) : !(ev.type === "act" && ev.page !== S.view);
    if (!want || drawTimer) return;
    drawTimer = setTimeout(() => { drawTimer = null; drawPage(); }, Math.max(60, 300 - (performance.now() - lastDraw)));
  });
}
$("#page").addEventListener("focusout", () => { if (pendingDraw) { pendingDraw = false; setTimeout(() => drawPage(), 60); } });
let pressing = false;
addEventListener("pointerdown", () => (pressing = true), true);
addEventListener("pointerup", () => { pressing = false; if (pendingDraw) { pendingDraw = false; setTimeout(() => drawPage(), 120); } }, true);
addEventListener("pointercancel", () => (pressing = false), true);
function render() {
  if (!S.fl || !S.inv) return;
  const busy = AGENTS.filter((a) => status(a.id).busy).length;
  $("#working").innerHTML = `<button class="btn sm" id="ap">${S.brain.autopilot ? "Autopilot on" : "Autopilot off"}</button>${busy ? `<i></i>${busy} working` : ""}`;
  $("#ap").onclick = async () => { try { S.brain = await api("/api/office/brain/autopilot", { on: !S.brain.autopilot }); } catch {} render(); };
  for (const a of AGENTS) { const st = status(a.id), el = tags[a.id]; el.className = `tag ${st.alert ? "alert" : st.busy ? "busy" : ""}`; el.lastChild.textContent = st.text; el._wFull = 0; const m = el._mode; el._mode = null; tagMode(el, m || ""); }
  const page = $("#page");
  $("#chat").hidden = S.view !== "floor";
  S3.setPaused(S.view !== "floor" && document.body.classList.contains("ready"));
  if (S.view !== "floor" && !S.snapped) { S.snapped = true; S3.snapshot(officeBackdrop); }
  if (S.view === "floor") S.snapped = false;
  renderRail();
  if (S.view === "floor") { page.hidden = true; }
  else { page.hidden = false; $("#panel").hidden = true; S3.setPanel(0); }
  if (S.view === "floor" && (S.sel || S.note)) renderPanel();
}

// the pages are glass over a still of the office: one small, pre-blurred frame, so nothing re-blurs while you scroll
function officeBackdrop(cv) {
  if (!cv.width || !cv.height) return;
  const w = 240, h = Math.max(1, Math.round((w * cv.height) / cv.width)), c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d"); g.filter = "blur(3px) saturate(1.2)"; g.drawImage(cv, -10, -10, w + 20, h + 20);
  $("#page").style.setProperty("--office", `url(${c.toDataURL("image/jpeg", 0.85)})`);
}

// ------------------------------------------------------------------ the work panel
function openAgent(id) { S.sel = id; S.note = null; if (S.view !== "floor") go("floor"); else renderPanel(); S3.glide(id, 1500); }
function closePanel() { S.sel = null; S.note = null; wall.select(null); $("#panel").hidden = true; S3.setPanel(0); }
async function openNote(id) { const n = await api("/api/floor/note", { id }).catch(() => null); if (!n) return; S.note = n; S.sel = null; // site demo: a note outside the snapshot just doesn't open
 wall.select(id); renderPanel(); }
const WIDE = new Set(["paperwork", "manager", "ads"]);
function renderPanel() {
  const p = $("#panel");
  if (p.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const keep = $(".pb", p)?.scrollTop || 0;
  p.hidden = false;
  if (S.note) {
    p.className = "panel";
    p.innerHTML = `<div class="ph"><div class="av" style="background:#0e1114">${noteIcon}</div><div><h2>${esc(S.note.label)}</h2><p>Note · ${esc(S.note.type)}</p></div><button class="x" data-close aria-label="Close">✕</button></div>
      <div class="pb"><div class="doc">${md(S.note.markdown)}</div><div class="sec"><h3>Linked notes</h3><div class="row">${S.note.links.map((l) => `<button class="chip" data-note="${esc(l.id)}">${esc(l.label.length > 40 ? l.label.slice(0, 38) + "…" : l.label)}</button>`).join("")}</div></div>
      <div class="foot">Saved in the team's notes as <span class="mono">${esc(S.note.file)}</span>. The folder opens as a vault in Obsidian.</div></div>`;
    S3.setPanel(p.offsetWidth + 16); return;
  }
  const a = BY_ID[S.sel], st = status(a.id);
  p.className = `panel ${WIDE.has(a.id) ? "wide" : ""}`;
  p.innerHTML = `<div class="ph"><div class="av" style="background:${a.color}">${a.name[0]}</div><div><h2>${a.name}</h2><p>${a.role} · ${a.does}</p></div><button class="x" data-close aria-label="Close">✕</button></div>
    <div class="pnow ${st.alert ? "alert" : st.busy ? "busy" : ""}"><i></i><span class="${st.busy ? "shimmer" : ""}">${esc(st.text)}</span></div>
    <div class="pb">${BODY[a.id](a.id)}</div>`;
  $(".pb", p).scrollTop = keep;
  S3.setPanel(p.offsetWidth + 16);
  wirePanel(p);
}
const noteIcon = `<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.5"><circle cx="4" cy="4" r="1.8"/><circle cx="12" cy="5" r="1.8"/><circle cx="7" cy="12" r="1.8"/><path d="M5.6 4.4l4.6.5M5 5.5l1.6 4.8M10.8 6.4l-2.6 4.2"/></svg>`;
function sliceLine(t) {
  const T = S.plan.tomorrow;
  return t
    .replace(/^Tomorrow planned: (\d+) jobs on (\d+) vans(.*)$/, (_, j, v, rest) => `${+j === T.left_jobs ? `Placed the last ${j} jobs` : `Placed ${j} of the last ${T.left_jobs} jobs`} on ${v} reactive vans${rest}. That's ${T.planned_jobs + +j} of tomorrow's ${n0(T.jobs)} jobs planned`)
    .replace(/^Looking at (\d+) jobs and (\d+) engineers:/, "Placing the last $1 jobs on the $2 reactive vans:")
    .replace(/^Texted (\d+) engineers their day and (\d+) customers/, "Texted the reactive vans: $1 engineers their day and $2 customers");
}
function feed(id, n = 10) {
  const lines = ["invoices", "inbox", "jobs", "money"].includes(id) ? N.feeds[id].slice(-n).reverse().map((l) => ({ at: l.at, text: id === "jobs" ? sliceLine(l.text) : l.text, kind: l.kind })) : fl(id).slice(-n).reverse();
  return lines.length ? `<div class="feed">${lines.map((l) => `<div class="fl k-${l.kind}"><time>${hhmm(l.at)}</time><span>${esc(l.text)}</span></div>`).join("")}</div>` : `<div class="note">Nothing yet today.</div>`;
}
const sec = (title, body, right = "") => `<div class="sec"><h3>${title}${right ? `<span class="r">${right}</span>` : ""}</h3>${body}</div>`;

// the four office desks' panels: the last 7 days (from the model), the firm-wide picture, then the live slice
const deskFoot = (id) => {
  const rs = S.brain.routines.filter((r) => r.agent === id);
  return `${sec("Schedule", `<div class="list">${rs.map((r) => `<div class="li"><div><b>${esc(r.title)}</b><div class="s">${esc(r.label)}${r.nextAt ? ` · next ${hhmm(r.nextAt)}` : ""}</div></div>${r.event ? `<span class="chip">Straight away</span>` : `<button class="btn sm" data-run="${r.id}">Run now</button>`}</div>`).join("")}</div>`)}
      ${sec(`What ${BY_ID[id].name}'s doing`, feed(id))}`; // site demo: the full desk is Tom's other app, not part of this one
};
const lastWeek = (id, lines) => { const e = S.fl.model.employees[id]; return sec("Last 7 days", `<div class="kv">${e.kpis.map((k) => `<div title="${esc(k.working)}"><b>${esc(k.value)}</b><span>${esc(k.label)}</span></div>`).join("")}</div>${lines.map((l) => `<div class="working-line">${esc(l)}</div>`).join("")}`); };
const row = (title, sub, right, cls = "") => `<div class="li ${cls}"><div><b>${title}</b>${sub ? `<div class="s">${sub}</div>` : ""}</div><span class="num">${right}</span></div>`;
const total = (label, right) => `<div class="li"><div><b>${label}</b></div><b class="num">${right}</b></div>`;
const ENGINEER_NAME = (id) => S.inbox?.engineers?.find((e) => e.id === id)?.name || S.plan?.engineers?.find((e) => e.id === id)?.name || "From the vans";
const STATUS_WORD = { waiting: "Not chased", draft: "Draft ready", for_person: "Needs a person", sent: "Sent", paid: "Paid", working: "Reading", skipped: "Skipped", error: "Problem" };

const BODY = {
  invoices(id) {
    const e = S.fl.model.employees.invoices, k = e.kpis, u = e.units.at(-1), b = batch(), W = S.inv.waiting?.clients || [];
    const sheets = S.inv.sheets, live = sheets.filter((s) => s.status === "ready" && !s.approved), liveGbp = Math.round(live.reduce((a, s) => a + (s.invoice?.total || 0), 0) * 100) / 100;
    const dp = liveGbp % 1 ? 2 : 0;
    return `${lastWeek(id, [`${k[1].working} · ${money(e.value_gbp, 0)} invoiced`, `${n0(u)} ÷ 5 working days = ${n0(u / 5)} a day · ${k[2].working}`])}
      ${sec("Waiting for Priya", `<div class="list">${W.map((c) => row(esc(c.customer), `${c.invoices} contract works orders, drafted as a batch`, money(c.total, 0))).join("")}${live.length ? row("Today's job sheets", `${live.length} drafted from the vans`, money(liveGbp)) : ""}${total(`${b.n + live.length} invoices`, money(b.gbp + liveGbp, dp))}</div>`, `${b.n + live.length} invoices`)}
      ${sec("Job sheets read live today", sheets.length ? `<div class="list">${sheets.slice(0, 6).map((s) => `<div class="li"><div><b>${esc(s.read?.header?.customer || "Reading the photo…")}</b><div class="s">${esc(ENGINEER_NAME(s.engineerId))}${s.invoice ? ` · ${money(s.invoice.total)}` : ""}</div></div><span class="chip ${s.approved ? "green" : s.status === "ready" ? "amber" : ""}">${s.approved ? "Approved" : s.status === "reading" ? "Reading" : "To approve"}</span></div>`).join("")}</div>` : `<div class="note">None in yet. Ivy reads each one the moment an engineer sends the photo.</div>`, sheets.length > 6 ? `showing 6 of ${sheets.length}` : `${sheets.length} so far`)}
      ${deskFoot(id)}`;
  },
  inbox(id) {
    const e = S.fl.model.employees.inbox, k = e.kpis, u = e.units.at(-1), I = S.inbox, earlier = need("inbox"), nE = countIn(earlier.what);
    const drafts = I.drafts.filter((d) => d.status === "draft").length, check = I.emails.filter((x) => x.result?.route === "check_me").length, all = nE + drafts + check;
    return `${lastWeek(id, [`${n0(u)} ÷ 5 working days = ${n0(u / 5)} emails a day · ${k[1].value} jobs booked straight into the diary`, k[2].working])}
      ${sec("Waiting for Priya", `<div class="list">${row(`${nE} replies from earlier rounds`, esc(earlier.detail), nE)}${drafts ? row(`${drafts} replies from today's live rounds`, "Drafted live", drafts) : ""}${check ? row(`${check} in Check me`, "Theo wasn't sure, so he's asking rather than guessing", check) : ""}${total("In all", all)}</div>`, `${all} things`)}
      ${sec("Inbox rounds run live today", `<div class="kv"><div><b>${I.emails.length}</b><span>emails read</span></div><div><b>${I.emails.filter((x) => x.status === "done").length}</b><span>sorted</span></div><div><b>${I.bookings.filter((x) => x.kind !== "existing").length}</b><span>jobs booked in</span></div></div>`, ((r) => `${r} round${r === 1 ? "" : "s"}`)((I.rounds || []).length || (I.ranAt ? 1 : 0)))}
      ${deskFoot(id)}`;
  },
  jobs(id) {
    const e = S.fl.model.employees.jobs, k = e.kpis, u = e.units.at(-1), T = S.plan.tomorrow, p = S.plan.plan;
    const day = new Date(S.plan.day + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const who = p ? `Rowan, live${T.unplaced_live ? ` · ${T.unplaced_live} for Priya` : ""}` : "Rowan, at 3pm";
    const table = `<table class="t"><tr><th>Area</th><th>Planned by</th><th class="r">Vans</th><th class="r">Jobs</th></tr>${T.areas.map((a) => `<tr><td><b>${esc(a.name)}</b></td><td class="muted">${esc(a.planner)}</td><td class="r num">${a.vans}</td><td class="r num">${a.jobs}</td></tr>`).join("")}<tr><td><b>${esc(T.reactive.name)}</b></td><td class="muted">${who}</td><td class="r num">${T.left_vans}</td><td class="r num">${T.left_jobs}</td></tr><tr><td><b>Tomorrow</b></td><td></td><td class="r num"><b>${T.vans}</b></td><td class="r num"><b>${n0(T.jobs)}</b></td></tr></table>`;
    const routes = p ? p.routes.filter((r) => r.slots.length) : [];
    return `${lastWeek(id, [`${n0(u)} ÷ 5 working days = ${n0(u / 5)} jobs a day across ${e.vans} vans · ${k[1].working}`, k[2].working])}
      ${sec(`Tomorrow, ${day}`, `${table}<div class="working-line">${T.planned_jobs} already planned + ${T.left_jobs} left to place = ${n0(T.jobs)} jobs · ${T.planned_vans} + ${T.left_vans} reactive = ${T.vans} vans</div>`, `${placedTomorrow()} of ${n0(T.jobs)} placed`)}
      ${sec("The reactive vans", p ? `<div class="list">${routes.map((r) => `<div class="li"><div><b>${esc(S.plan.engineers.find((x) => x.id === r.engineerId)?.name || r.engineerId)}</b><div class="s">${r.slots.map((x) => esc(S.plan.jobs.find((j) => j.id === x.jobId)?.district || "")).join(" → ")}</div></div><span class="num">${r.slots.length} job${r.slots.length > 1 ? "s" : ""}</span></div>`).join("")}${total(`${routes.length} vans`, `${T.placed_live} jobs`)}</div>` : `<div class="note">The last ${T.left_jobs} jobs, booked today, go on the ${T.left_vans} reactive vans: who's qualified, which postcodes sit together, which van has the parts. Rowan drafts it at 3pm and Priya checks it.</div>`, p ? `${routes.length} of ${T.left_vans} vans` : "")}
      ${deskFoot(id)}`;
  },
  money(id) {
    const e = S.fl.model.employees.money, k = e.kpis, M = S.fl.model.firm, L = S.chase.ledger, items = S.chase.items;
    const listGbp = Math.round(items.reduce((a, i) => a + i.amount, 0) * 100) / 100;
    return `${lastWeek(id, [k[0].working, `${k[1].value} days to get paid: ${k[1].working.charAt(0).toLowerCase() + k[1].working.slice(1)} · ${k[2].working}`])}
      ${sec("Money owed to Kingpost", `<div class="kv"><div><b>${money(L.owed_gbp, 0)}</b><span>owed</span></div><div><b>${money(L.over_30_gbp, 0)}</b><span>over 30 days</span></div><div><b>${L.accounts}</b><span>accounts over 30 days</span></div></div><div class="working-line">${money(L.owed_gbp, 0)} owed ÷ (${money(M.revenue_year, 0)} a year ÷ 365) = ${Math.round(L.owed_gbp / (M.revenue_year / 365))} days of sales</div>`)}
      ${sec("Biggest balances over 30 days", `<div class="list">${L.top.map((a) => row(esc(a.customer), `${a.invoices} invoices · oldest ${a.oldest_days} days${a.note ? ` · ${esc(a.note)}` : ""}`, money(a.balance, 0))).join("")}${row(`The other ${L.others.accounts} accounts`, "Mostly homeowners and smaller agents", money(L.others.balance, 0))}${total("Over 30 days", money(L.over_30_gbp, 0))}</div>`, `showing ${L.top.length} of ${L.accounts}`)}
      ${sec("Today's chase list", `<div class="list">${items.map((i) => `<div class="li"><div><b>${esc(i.customer)}</b><div class="s">${esc(i.id)} · ${i.days_overdue} days overdue · ${esc(i.job)}</div></div><div style="text-align:right"><span class="num">${money(i.amount)}</span><div style="margin-top:4px"><span class="chip ${i.status === "paid" || i.status === "sent" ? "green" : i.status === "for_person" || i.status === "draft" ? "amber" : ""}">${STATUS_WORD[i.status] || esc(i.status)}</span></div></div></div>`).join("")}${total(`${items.length} invoices`, money(listGbp))}</div>`, "live")}
      ${deskFoot(id)}`;
  },
  seo() {
    const F = S.fl, R = F.relay, sel = F.seo.opportunities.find((o) => o.id === S.selOpp);
    return `<div class="note">${esc(F.seo.note)}</div>
      ${sec("Searches nobody serves well", `<div class="list">${F.seo.opportunities.map((o) => `<div class="li click ${o.id === S.selOpp ? "sel" : ""}" data-opp="${o.id}"><div><b>${esc(o.query)}</b><div class="s"><span class="mono">${o.monthly_searches}</span> searches a month · ${esc(o.intent)}</div><div class="s">${esc(o.competitor.name)} ranks ${esc(o.competitor.ranks)}: ${esc(o.competitor.weakness)}</div></div><span class="chip ${o.status === "found" ? "amber" : ""}">${esc(o.status)}</span></div>
        ${o.id === S.selOpp ? `<div class="li" style="display:block;background:var(--paper-2)"><div><b>The gap:</b> ${esc(o.gap)}</div><div style="margin-top:8px"><b>Page to build:</b> ${esc(o.page_to_build.title)} <span class="mono muted">${esc(o.page_to_build.slug)}</span></div><ul style="margin:8px 0;padding-left:20px">${o.page_to_build.outline.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><div class="s"><b>Proof Kingpost can show:</b> ${o.page_to_build.proof_we_have.map(esc).join(" · ")}</div><div class="row" style="margin-top:12px"><button class="btn primary" data-relay="${o.id}" ${R?.running ? "disabled" : ""}>Hand this to Clara</button><span class="s">Seren → Clara → Archie → Maeve</span></div></div>` : ""}`).join("")}</div>`, "click one for the page it'll build")}
      ${R?.brief ? sec("Brief Seren wrote for Clara", `<div class="note">${esc(R.brief.brief)}<div style="margin-top:8px"><b>Include:</b> ${R.brief.must_include.map(esc).join("; ")}</div><div><b>Never:</b> ${R.brief.must_not.map(esc).join("; ")}</div></div>`) : ""}
      ${sec("Seren's log", feed("seo", 6))}`;
  },
  content() {
    const F = S.fl, R = F.relay, p = R?.page;
    const writing = R?.running && R.stage === "content";
    return `${p ? sec(writing ? "Writing now" : "Latest page", `<div class="doc ${writing ? "caret" : ""}"><h1>${esc(p.title || "")}</h1><p>${esc(p.intro || "")}</p>${(p.sections || []).map((s) => `<h2>${esc(s?.heading || "")}</h2><p>${esc(s?.body || "")}</p>`).join("")}${p.call_to_action ? `<p><b>${esc(p.call_to_action)}</b></p>` : ""}</div>`, `for “${esc(R.opp.query)}”`)
        : `<div class="note">No page on the go. Pages start at Seren's desk: she finds a search nobody serves well and briefs Clara.</div><div class="row" style="margin-top:12px"><button class="btn primary" data-relay="${F.seo.opportunities.find((o) => o.status === "found")?.id || F.seo.opportunities[0].id}">Start one: Seren → Clara → Archie → Maeve</button></div>`}
      ${sec("Drafts", `<div class="list">${F.content.drafts.map((d) => `<div class="li"><div><b>${esc(d.title)}</b><div class="s">${esc(d.type)} · <span class="mono">${d.words}</span> words</div></div><span class="chip ${d.status === "published" ? "green" : d.status === "with Maeve" ? "amber" : ""}">${esc(d.status)}</span></div>`).join("")}</div>`)}
      ${sec("Clara's log", feed("content", 6))}`;
  },
  ads() {
    const F = S.fl, R = F.relay, c = F.ads.campaigns, cr = F.ads.creatives;
    const card = (x) => `<div class="cr ${x.verdict}"><div class="cr-v" style="background:${SWATCH[x.campaign_id] || "#ddd"}"><span>${esc(x.format)}</span><p>${esc(x.visual.subject)}</p></div><div class="cr-b"><b>${esc(x.headline)}</b><div class="s">${esc(x.body)}</div><div class="cr-m mono">CTR ${x.ctr}% · ${x.leads} leads · ${x.cpl ? money(x.cpl) : "—"}/lead</div><div class="row"><span class="chip ${x.verdict === "winner" ? "green" : x.verdict === "cut" ? "red" : ""}">${x.verdict === "winner" ? "Kept" : x.verdict === "cut" ? "Cut" : "Testing"}</span></div><div class="s" style="margin-top:4px">${esc(x.reason)}</div></div></div>`;
    return `<table class="t"><tr><th>Campaign</th><th>Channel</th><th class="r">Spent, last 7 days</th><th class="r">Leads</th><th class="r">Per lead</th><th></th></tr>${c.map((x) => `<tr><td><b>${esc(x.name)}</b><div class="s muted">${esc(x.note || "")}</div></td><td>${esc(x.channel)}</td><td class="r num">${money(x.spend_week)}</td><td class="r num">${x.leads}</td><td class="r num">${money(x.cpl)}</td><td><span class="chip ${x.status === "scaling" ? "green" : x.status === "paused" ? "red" : ""}">${esc(x.status)}</span></td></tr>`).join("")}</table>
      ${R?.ads ? sec("New: ads to test Clara's page", `<div class="list">${R.ads.variants.map((v) => `<div class="li"><div><b>${esc(v.headline)}</b><div class="s">${esc(v.description)}</div></div><span class="chip">${esc(v.angle)}</span></div>`).join("")}</div><div class="s" style="margin-top:8px">${esc(R.ads.test_plan)}</div>`) : ""}
      ${sec("Creatives", `<div class="crs">${[...cr.filter((x) => x.verdict === "winner"), ...cr.filter((x) => x.verdict === "testing"), ...cr.filter((x) => x.verdict === "cut")].map(card).join("")}</div>`, `${cr.filter((x) => x.verdict === "winner").length} kept · ${cr.filter((x) => x.verdict === "testing").length} testing · ${cr.filter((x) => x.verdict === "cut").length} cut`)}
      ${sec("Archie's log", feed("ads", 6))}`;
  },
  paperwork() {
    const F = S.fl;
    const ph = F.photos.map((p) => { const d = F.docs[p.id]; return `<div class="ph-card"><img src="${p.url}" alt=""><div><b>${p.id === "plant-hire" ? "Plant & tool hire log" : "Van 7 stock check"}</b><div class="s">${d?.status === "ready" ? `Read in ${Math.round((d.ms || 0) / 1000)}s · ${d.dash.rows.length} rows` : d?.status === "reading" ? "Reading…" : "Photo, not read yet"}</div></div><button class="btn sm ${d?.status === "ready" ? "" : "primary"}" data-doc="${p.id}" ${d?.status === "reading" ? "disabled" : ""}>${d?.status === "ready" ? "Show" : "Read it"}</button></div>`; }).join("");
    const cur = F.docs[S.selDoc] || Object.values(F.docs).find((d) => d.status === "reading") || Object.values(F.docs).find((d) => d.dash);
    return `${sec("Photos in", `<div class="ph-list">${ph}</div>`)}${cur ? docView(cur) : `<div class="note" style="margin-top:16px">Snap a photo of any sheet, form or spreadsheet and send it to Dot. She reads every row and sets it up as a dashboard you can keep updating.</div>`}`;
  },
  manager() {
    const F = S.fl, X = F.drift, R = F.relay;
    const t = [...F.manager.tasks, ...F.tasks];
    const cols = [["queued", "To do"], ["doing", "Doing"], ["review", "To check"], ["done", "Done"]];
    const board = `<div class="kb">${cols.map(([s, l]) => `<div class="kb-c"><h4>${l} <span class="mono muted">${t.filter((x) => x.status === s).length}</span></h4>${t.filter((x) => x.status === s).slice(-6).reverse().map((x) => `<div class="kb-t ${x.at ? "new" : ""}"><span class="av-s" style="background:${BY_ID[x.agent]?.color}">${BY_ID[x.agent]?.name[0]}</span><span>${esc(x.title)}</span>${x.priority === "urgent" ? `<span class="chip red">urgent</span>` : ""}</div>`).join("")}</div>`).join("")}</div>`;
    const drift = !X ? `<div class="note">Maeve checks every agent's work against its brief. If one goes off task, she stops it before it costs money or misleads anyone, and sends it back.</div><div class="row" style="margin-top:12px"><button class="btn primary" data-drift>Watch Maeve catch an off-task agent</button><span class="s">Archie changes a live campaign outside his brief</span></div>`
      : `<div class="steps">
        <div class="stp ${X.stage === "drift" ? "on" : "done"}"><b>Archie changed the boiler campaign</b><div class="s">“${esc(X.work.headline)}. ${esc(X.work.description)}” · keywords: ${X.work.keywords.map(esc).join(", ")} · daily cap £${X.work.daily_cap_gbp}</div><div class="s">His brief: ${esc(X.brief)}</div></div>
        ${X.check ? `<div class="stp ${X.check.on_task ? "done" : "bad"}"><b>Maeve: ${X.check.on_task ? "on task" : "off task, stopped"}</b>${X.check.problems.length ? `<ul>${X.check.problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}${X.check.instruction ? `<div class="s"><b>Told Archie:</b> ${esc(X.check.instruction)}</div>` : ""}</div>` : X.stage === "checking" ? `<div class="stp on"><b class="shimmer">Maeve's checking it against the brief…</b></div>` : ""}
        ${X.redo ? `<div class="stp done"><b>Archie redid it</b><div class="s">“${esc(X.redo.headline)}. ${esc(X.redo.description)}” · keywords: ${X.redo.keywords.map(esc).join(", ")} · cap £${X.redo.daily_cap_gbp}</div><div class="s">${esc(X.redo.note_to_maeve)}</div></div>` : X.stage === "redoing" ? `<div class="stp on"><b class="shimmer">Archie's redoing it inside the brief…</b></div>` : ""}
        ${X.recheck ? `<div class="stp ${X.recheck.on_task ? "done" : "bad"}"><b>Maeve: ${X.recheck.on_task ? "back on task" : "still not right"}</b><div class="s">${esc(X.recheck.summary)}</div></div>` : X.stage === "rechecking" ? `<div class="stp on"><b class="shimmer">Maeve's checking the redo…</b></div>` : ""}
      </div>`;
    return `${sec("Task board", board, `${t.length} tasks across the team`)}
      ${sec("Keeping everyone on task", drift)}
      ${R?.review ? sec("Last check before something went public", `<div class="list">${R.review.checks.map((c) => `<div class="li"><div><b>${esc(c.check)}</b><div class="s">${esc(c.note)}</div></div><span class="chip ${c.ok ? "green" : "red"}">${c.ok ? "OK" : "Fix"}</span></div>`).join("")}</div>`) : ""}
      ${sec("Maeve's log", feed("manager", 8))}`;
  },
  coach() {
    const F = S.fl, K = F.friday, r = K?.report;
    const src = (l) => l.source === "edit" ? "Priya changed a draft" : l.source === "taught" ? `${BY_ID[l.from]?.name || l.from} passed it on` : l.source === "correction" ? "Priya answered a question" : "Priya told them";
    const rules = [...S.lessons.slice().reverse().map((l) => ({ agent: l.agent, rule: l.text, came: src(l), live: true })), ...F.coach.rules_this_week.map((x) => ({ agent: x.agent, rule: x.rule, came: x.came_from }))];
    return `${sec("Corrections that became rules", `<form class="ask inline" id="correct"><input id="correct-in" placeholder="Correct someone, e.g. “Penny, never chase Mrs Hale by text”"><button>Make it a rule</button></form>${S.correctNote ? `<div class="s" style="margin:8px 0">${S.correctNote}</div>` : ""}<div class="list" style="margin-top:8px">${rules.slice(0, 10).map((x) => `<div class="li"><div><span class="av-s" style="background:${BY_ID[x.agent]?.color}">${BY_ID[x.agent]?.name[0]}</span><b>${esc(BY_ID[x.agent]?.name)}</b> ${esc(x.rule)}<div class="s">${esc(x.came)}</div></div>${x.live ? `<span class="chip amber">today</span>` : ""}</div>`).join("")}</div>`)}
      ${sec("Friday report", r ? `<div class="doc report ${K.running ? "caret" : ""}"><h1>${esc(r.headline || "")}</h1>${(r.improved || []).length ? `<h2>What got better</h2><ul>${r.improved.map((x) => `<li><b>${esc(x?.agent || "")}</b> ${esc(x?.what || "")}</li>`).join("")}</ul>` : ""}${(r.new_rules || []).length ? `<h2>New rules</h2><ul>${r.new_rules.map((x) => `<li><b>${esc(x?.agent || "")}:</b> ${esc(x?.rule || "")} <span class="muted">${esc(x?.because || "")}</span></li>`).join("")}</ul>` : ""}${(r.watching || []).length ? `<h2>Still watching</h2><ul>${r.watching.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${r.for_tom ? `<h2>For Monday's check</h2><p>${esc(r.for_tom)}</p>` : ""}</div><div class="row" style="margin-top:8px"><button class="btn sm" data-friday ${K.running ? "disabled" : ""}>Write it again</button></div>` : `<div class="row"><button class="btn primary" data-friday>Write the Friday report</button><span class="s">What improved, with the numbers</span></div>`)}
      ${sec("Last 7 days vs the 7 before", `<table class="t">${F.coach.metrics.map((m) => { const good = m.better_when === "lower" ? m.this_week <= m.last_week : m.this_week >= m.last_week; return `<tr><td><span class="av-s" style="background:${BY_ID[m.agent]?.color}">${BY_ID[m.agent]?.name[0]}</span>${esc(m.measure)}</td><td class="r num muted">${m.last_week}</td><td class="r num" style="color:${good ? "var(--green)" : "var(--red)"}">${m.this_week}</td></tr>`; }).join("")}</table>`)}`;
  },
};

// Dot's dashboard: tiles and chart recompute from the table, so edits update everything
function num(v) { const n = parseFloat(String(v).replace(/[£,\s]/g, "")); return isNaN(n) ? null : n; }
function measures(dash) {
  return (dash.measures || []).filter((m) => m && m.column).map((m) => {
    const ci = (dash.columns || []).indexOf(m.column), rows = (dash.rows || []).filter(Array.isArray);
    let v = 0;
    if (ci < 0) v = "—";
    else if (m.agg === "sum") v = rows.reduce((a, r) => a + (num(r[ci]) || 0), 0);
    else if (m.agg === "count_blank") v = rows.filter((r) => !String(r[ci] ?? "").trim() || /^(no|-|—|out)$/i.test(String(r[ci]).trim())).length;
    else if (m.agg === "count_filled") v = rows.filter((r) => String(r[ci] ?? "").trim()).length;
    else v = rows.length;
    return { label: m.label, value: typeof v === "number" ? (m.money ? money(v, 0) : v.toLocaleString("en-GB")) : v };
  });
}
function docView(d) {
  const dash = d.dash || d.partial || {};
  const cols = dash.columns || [], rows = (dash.rows || []).filter(Array.isArray), reading = d.status === "reading";
  const ms = cols.length && dash.measures ? measures(dash) : [];
  let chart = "";
  if (dash.chart && cols.length) {
    const li = cols.indexOf(dash.chart.label_column), vi = cols.indexOf(dash.chart.value_column);
    if (li >= 0 && vi >= 0) {
      const agg = {}; for (const r of rows) { const k = r[li] || "—"; agg[k] = (agg[k] || 0) + (num(r[vi]) || 0); }
      const e = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8), max = Math.max(1, ...e.map((x) => x[1]));
      chart = sec(esc(dash.chart.title), `<div class="hbars">${e.map(([k, v]) => `<div class="hb" title="${esc(k)}: ${v.toLocaleString("en-GB")}"><span>${esc(k)}</span><i><b style="width:${(v / max) * 100}%"></b></i><em class="num">${v.toLocaleString("en-GB")}</em></div>`).join("")}</div>`);
    }
  }
  return `<div class="docgrid"><div class="sec"><h3>${reading ? `<span class="shimmer">Reading the photo…</span>` : esc(dash.title || "")}</h3><img class="docimg" src="paperwork/${d.id}.jpg" alt="The photo Dot read"></div>
    <div>${ms.length ? `<div class="kv k${Math.min(4, ms.length)}">${ms.map((m) => `<div><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join("")}</div>` : ""}
      ${(dash.to_check || []).length ? `<div class="note amber" style="margin-top:12px"><b>To check</b><ul style="margin:4px 0 0;padding-left:20px">${dash.to_check.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${chart}</div></div>
    ${sec(reading ? "Rows coming in" : "The sheet, tidied up", `<div class="tablewrap"><table class="t edit"><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${rows.map((r, ri) => `<tr>${cols.map((_, ci) => `<td ${reading ? "" : `contenteditable="true" data-cell="${ri}:${ci}"`} class="${(dash.numeric_columns || []).includes(cols[ci]) ? "r num" : ""}">${esc(r[ci] ?? "")}</td>`).join("")}</tr>`).join("")}</table></div>${reading ? "" : `<div class="row" style="margin-top:8px"><button class="btn sm" data-addrow="${d.id}">Add a row</button><span class="s">Click any cell to change it. The tiles and chart update as you go.${d.edits ? ` ${d.edits} edit${d.edits > 1 ? "s" : ""} saved.` : ""}</span></div>`}`)}`;
}

function wirePanel(p) {
  $("[data-close]", p)?.addEventListener("click", closePanel);
  $$("[data-note]", p).forEach((b) => (b.onclick = () => openNote(b.dataset.note)));
  $$("[data-opp]", p).forEach((b) => (b.onclick = () => { S.selOpp = S.selOpp === b.dataset.opp ? null : b.dataset.opp; renderPanel(); }));
  $$("[data-relay]", p).forEach((b) => (b.onclick = () => startRelay(b.dataset.relay)));
  $$("[data-run]", p).forEach((b) => (b.onclick = async () => { await api(`/api/office/brain/run/${b.dataset.run}`, {}).catch((e) => flash(e.message)); }));
  $$("[data-doc]", p).forEach((b) => (b.onclick = async () => { S.selDoc = b.dataset.doc; if (!S.fl.docs[b.dataset.doc]?.dash) await api(`/api/floor/docs/${b.dataset.doc}/read`, {}).catch((e) => flash(e.message)); renderPanel(); }));
  $$("[data-addrow]", p).forEach((b) => (b.onclick = () => api(`/api/floor/docs/${b.dataset.addrow}/edit`, { addRow: true }).catch(() => {})));
  $$("[data-cell]", p).forEach((c) => c.addEventListener("blur", () => { const [r, ci] = c.dataset.cell.split(":").map(Number); const id = (S.fl.docs[S.selDoc] || Object.values(S.fl.docs).find((d) => d.dash)).id; api(`/api/floor/docs/${id}/edit`, { r, c: ci, value: c.textContent.trim() }).catch(() => {}); }));
  $$("[data-cell]", p).forEach((c) => c.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); c.blur(); } }));
  $("[data-drift]", p)?.addEventListener("click", () => api("/api/floor/drift", {}).catch(() => {}));
  $$("[data-friday]", p).forEach((b) => (b.onclick = () => api("/api/floor/friday", {}).catch(() => {})));
  const cf = $("#correct", p);
  if (cf) cf.onsubmit = async (e) => { e.preventDefault(); const t = $("#correct-in", p).value.trim(); if (!t) return; $("#correct-in", p).blur(); api("/api/office/teach", { text: t }).catch(() => {}); }; // site demo: Kit's rule-writing runs live
}
async function startRelay(oppId, follow = false) {
  S.followRelay = follow;
  const ok = await api("/api/floor/relay", { oppId }).then(() => true, (e) => { flash(e.message); return false; });
  if (!ok) { if (S.view !== "floor") drawPage({ force: true }); else if (S.sel) renderPanel(); } // site demo: put the pressed button back
  return ok;
}

// tiny markdown for the notes: headings, bullets, bold, [[links]]
function md(src) {
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[\[(.+?)\]\]/g, (_, x) => `<a class="wl">${x}</a>`);
  let out = "", inList = false;
  for (const line of src.split("\n")) {
    if (/^- /.test(line)) { if (!inList) { out += "<ul>"; inList = true; } out += `<li>${inline(line.slice(2))}</li>`; continue; }
    if (inList) { out += "</ul>"; inList = false; }
    if (/^# /.test(line)) out += `<h1>${inline(line.slice(2))}</h1>`;
    else if (/^## /.test(line)) out += `<h2>${inline(line.slice(3))}</h2>`;
    else if (line.trim()) out += `<p>${inline(line)}</p>`;
  }
  return out + (inList ? "</ul>" : "");
}

// ------------------------------------------------------------------ chat
$("#ask").onsubmit = async (e) => { e.preventDefault(); const q = $("#ask-in").value.trim(); if (q) ask(q); };
async function ask(q) {
  $("#ask-in").value = ""; $("#ask-in").blur();
  if (window.AI_TEAM_STATIC) { $("#ask-in").value = q; return api("/api/floor/chat", { q }).catch(() => {}); } // site demo: the team answers live on a call
  S.chat.push({ who: "me", text: q }, { who: "thinking" }); drawChat();
  try {
    const r = await api("/api/floor/chat", { q, history: S.chat.filter((m) => m.text).map((m) => ({ who: m.who === "me" ? "Priya" : BY_ID[m.who]?.name, text: m.text })) });
    S.chat = S.chat.filter((m) => m.who !== "thinking");
    for (const [i, rep] of r.replies.entries()) {
      await new Promise((res) => setTimeout(res, i ? 650 : 0));
      S.chat.push({ who: rep.agent, text: rep.text }); drawChat();
      tags[rep.agent]?.classList.add("busy"); S3.setBusy(rep.agent, true); setTimeout(() => dirty(rep.agent), 2500);
    }
    if (r.replies.length === 1 && !S.sel) S3.glide(r.replies[0].agent, 1600);
  } catch (err) { S.chat = S.chat.filter((m) => m.who !== "thinking"); S.chat.push({ who: "manager", text: `Sorry, that didn't work: ${err.message}` }); }
  drawChat();
}
function drawChat() {
  const t = $("#thread"); t.hidden = !S.chat.length;
  t.innerHTML = `<button class="x" data-clearchat>Clear</button>` + S.chat.map((m) => m.who === "me" ? `<div class="msg me"><p>${esc(m.text)}</p></div>`
    : m.who === "thinking" ? `<div class="msg"><span class="av" style="background:#c9c7c1">…</span><div><p class="shimmer">The team's looking it up…</p></div></div>`
    : `<div class="msg"><span class="av" style="background:${BY_ID[m.who].color}">${BY_ID[m.who].name[0]}</span><div><b>${BY_ID[m.who].name}</b> <span class="muted" style="font-size:12px">${BY_ID[m.who].role}</span><p>${esc(m.text)}</p></div></div>`).join("");
  t.scrollTop = t.scrollHeight;
  $("[data-clearchat]", t).onclick = () => { S.chat = []; drawChat(); };
}

// ------------------------------------------------------------------ overview, costs, Tom's weekly check

// ------------------------------------------------------------------ the walls: Kit's whiteboard and the numbers screen
function drawWhiteboard() {
  const { canvas: c, tex } = S3.whiteboard, g = c.getContext("2d");
  g.fillStyle = "#fbfbf8"; g.fillRect(0, 0, c.width, c.height);
  // Kit's new rules in the last 7 days: the count is the model's, and the board lists that many
  const n = Math.min(S.fl.model.employees.coach.units.at(-1), S.fl.coach.rules_this_week.length, 6), title = `${n} new rules, last 7 days`;
  g.fillStyle = "#1d3b6b"; g.font = "600 52px Geist, system-ui"; g.fillText(title, 48, 86);
  const tw = g.measureText(title).width;
  g.font = "34px Geist, system-ui"; g.fillStyle = "#24262b";
  S.fl.coach.rules_this_week.slice(0, n).forEach((r, i) => { const t = `${BY_ID[r.agent]?.name}: ${r.rule}`; g.fillText(t.length > 46 ? t.slice(0, 45) + "…" : t, 48, 160 + i * 74); });
  g.strokeStyle = "#c4432c"; g.lineWidth = 5; g.beginPath(); g.ellipse(48 + tw / 2, 70, tw / 2 + 22, 48, -0.03, 0, 7); g.stroke();
  tex.needsUpdate = true;
}
function drawNumbers() {
  // the same figures as every page: the model's 12 rolling 7-day windows, the last 4 of them added up
  const { canvas: c, tex } = S3.numbers, g = c.getContext("2d"), W = c.width, H = c.height, M = S.fl.model, w = M.weeks;
  g.fillStyle = "#101316"; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,0.55)"; g.font = "28px Geist, system-ui"; g.fillText("Hours given back, 7 days at a time", 60, 80);
  g.fillStyle = "#fff"; g.font = "500 110px Geist Mono, monospace"; g.fillText(`${n0(M.last28.hours)} h`, 60, 210);
  g.fillStyle = "rgba(255,255,255,0.55)"; g.font = "28px Geist, system-ui"; g.fillText(`in the last 4 weeks · ${money(M.last28.money_saved, 0)} of office time`, 60, 260);
  const max = Math.max(...w.map((x) => x.hours)), bw = (W - 120) / w.length;
  w.forEach((x, i) => { const h = (x.hours / max) * 300; g.fillStyle = i === w.length - 1 ? "#e8a84b" : "rgba(255,255,255,0.75)"; g.beginPath(); g.roundRect(60 + i * bw + 6, H - 60 - h, bw - 12, h, [6, 6, 0, 0]); g.fill(); });
  tex.needsUpdate = true;
}

// ------------------------------------------------------------------ shots: one per video (press S for the list)
const SHOTS = [
  ["1", "Fly over the whole team", async () => { closePanel(); go("floor"); await S3.flyOver(16000); }],
  ["2", "The brain wall growing", async () => { closePanel(); go("floor"); await S3.glide("brain", 2200); wall.startReplay(15000); }],
  ["3", "A job passing between desks", async () => { closePanel(); go("floor"); await S3.glide({ pos: S3.VIEWS.floor.pos.clone().set(4.5, 4.6, 6.2), target: S3.VIEWS.floor.target.clone().set(-3.4, 1.2, -1.6) }, 1800); const o = S.fl.seo.opportunities.find((x) => x.status === "found") || S.fl.seo.opportunities[0]; startRelay(o.id, true); }],
  ["4", "The SEO desk", () => { openAgent("seo"); S.selOpp = S.fl.seo.opportunities[0].id; renderPanel(); }],
  ["5", "The ads desk", () => openAgent("ads")],
  ["6", "The content desk", () => openAgent("content")],
  ["7", "Paperwork: photo to dashboard", async () => { openAgent("paperwork"); S.selDoc = "plant-hire"; if (!S.fl.docs["plant-hire"]?.dash) await api("/api/floor/docs/plant-hire/read", {}).catch((e) => flash(e.message)); renderPanel(); }],
  ["8", "The manager catching an off-task agent", async () => { openAgent("manager"); await new Promise((r) => setTimeout(r, 1600)); if (!S.fl.drift?.running) api("/api/floor/drift", {}); }],
  ["9", "The coach's Friday report", async () => { openAgent("coach"); await new Promise((r) => setTimeout(r, 1400)); if (!S.fl.friday?.running) api("/api/floor/friday", {}); }],
  ["0", "Chat: “What did you all do today?”", async () => { closePanel(); go("floor"); await S3.glide("floor", 1400); ask("What did you all do today?"); }],
  ["-", "Costs", () => { closePanel(); go("costs"); }],
  ["=", "Tom's weekly check", () => { closePanel(); go("check"); }],
];
// each video also has a page: Shift + the same key opens it (by key position, so it works on any keyboard layout)
const VIDEO_PAGE = ["team", "brain", "handoffs", "search", "ads", "content", "paperwork", "tasks", "training", "ask", "costs", "check"];
const KEY_CODES = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal"];
$("#shots").innerHTML = `<b>Videos: the key plays the shot, Shift + key opens its page</b>${SHOTS.map(([k, l], i) => `<button data-shot="${i}"><kbd>${k}</kbd><span>${i + 1}. ${l}<em data-vpage="${i}">${ITEM[VIDEO_PAGE[i]].label} page</em></span></button>`).join("")}<b style="font-weight:400;color:var(--ink-3);font-size:12px">H hides the menu and chat · F switches 16:9 / 9:16 · Esc back to the floor</b>`;
$$("[data-shot]").forEach((b) => (b.onclick = (e) => { if (e.target.dataset.vpage) { closePanel(); return go(VIDEO_PAGE[e.target.dataset.vpage]); } SHOTS[b.dataset.shot][2](); }));
addEventListener("keydown", (e) => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
  if (window.AI_TEAM_STATIC) { if (e.key === "Escape") { closePanel(); go("floor"); S3.glide("floor", 1600); } return; } // site demo: Tom's filming keys are off
  if (e.shiftKey && !e.metaKey && !e.ctrlKey) { const i = KEY_CODES.indexOf(e.code); if (i >= 0) { closePanel(); return go(VIDEO_PAGE[i]); } }
  const s = SHOTS.find(([k]) => k === e.key); if (s) return s[2]();
  if (e.key === "s" || e.key === "S") $("#shots").hidden = !$("#shots").hidden;
  if (e.key === "h" || e.key === "H") document.body.classList.toggle("clean");
  if (e.key === "f" || e.key === "F") { const u = new URL(location.href); u.searchParams.get("frame") === "916" ? u.searchParams.delete("frame") : u.searchParams.set("frame", "916"); location.href = u; }
  if (e.key === "Escape") { closePanel(); go("floor"); S3.glide("floor", 1600); }
});
setInterval(() => ($("#clock").textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })), 1000);
$("#clock").textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
await loadAll();
drawWhiteboard(); drawNumbers();
route();
S3.glide("floor", 10);
if (Q.get("shot") && !window.AI_TEAM_STATIC) setTimeout(() => SHOTS.find(([k]) => k === Q.get("shot"))?.[2](), 600);
window.FLOOR = { S, S3, wall, drawPage };
