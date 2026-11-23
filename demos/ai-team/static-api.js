// The static stand-in for Tom's local server. Every read the app makes is answered from a JSON snapshot taken
// right after a reset (./data/), and nothing that would call Claude runs: it opens the "this runs live" sheet instead.
// The one exception is Ask the team, where the suggested questions play a recorded example answer (recorded.js).
// The snapshots bake in the day they were taken, so the dates in them are moved on to today when they load.
import { liveOnly, LIVE } from "./live-note.js";
import { build, norm } from "./recorded.js";

const DATA = new URL("./data/", import.meta.url);
const GETS = {
  "/api/floor/state": "floor-state", "/api/floor/graph": "floor-graph", "/api/office/inv/state": "office-inv",
  "/api/d2/state": "inbox", "/api/d3/state": "plan", "/api/office/chase/state": "chase",
  "/api/office/brain": "office-brain", "/api/office/lessons": "lessons",
};
const cache = {};
const json = (name) => (cache[name] ||= fetch(new URL(name + ".json", DATA)).then((r) => { if (!r.ok) throw new Error(`Missing ${name}.json`); return r.json(); }));

// ---------------------------------------------------------------- dates: move the snapshot's day on to today
const DAY = 86400000;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const atNoon = (s) => new Date(s + "T12:00:00");
const workingDays = (from, n) => { const out = [], d = new Date(from); d.setHours(12, 0, 0, 0); while (out.length < n) { if (d.getDay() % 6) out.push(new Date(d)); d.setDate(d.getDate() + 1); } return out; };
const nextWorkingDay = (from) => { const d = new Date(from); d.setHours(12, 0, 0, 0); do d.setDate(d.getDate() + 1); while (!(d.getDay() % 6)); return d; };
function shift(meta) {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const days = Math.round((today - atNoon(meta.taken)) / DAY);
  return { days, ms: days * DAY, isoShift: (s) => (s ? iso(new Date(atNoon(s).getTime() + days * DAY)) : s), today: iso(today) };
}
function redate(name, d, meta) {
  const S = shift(meta);
  if (!S.days) return d;
  if (name === "inbox") {
    // the diary is the next five working days from today; the seeded bookings keep their place in it
    const fresh = workingDays(new Date(), d.days.length).map(iso), map = Object.fromEntries(d.days.map((x, i) => [x, fresh[i]]));
    d.createdOn = S.today; d.days = fresh;
    for (const b of d.bookings || []) b.date = map[b.date] || S.isoShift(b.date);
    for (const e of d.emails || []) if (e.receivedAt) e.receivedAt += S.ms;
    for (const p of d.pos || []) if (p.raisedOn) p.raisedOn = S.isoShift(p.raisedOn);
    if (d.agreement?.startedOn) d.agreement.startedOn = S.isoShift(d.agreement.startedOn);
  }
  if (name === "plan") { d.createdOn = S.today; d.day = iso(nextWorkingDay(new Date())); }
  if (name === "office-brain") {
    d.now = Date.now();
    for (const r of d.routines || []) if (r.nextAt) { r.nextAt += S.ms; while (r.nextAt < Date.now()) r.nextAt += DAY; }
  }
  if (name === "office-inv" && d.agreement?.startedOn) d.agreement.startedOn = S.isoShift(d.agreement.startedOn);
  return d;
}

// ---------------------------------------------------------------- prices stay out unless Tom says so (config.js)
async function withPrices(F) {
  if (!window.AI_TEAM_SHOW_PRICES) return F;
  try {
    const P = await json("prices");
    Object.assign(F.model, { costs: P.model.costs }); Object.assign(F.model.month, P.model.month); Object.assign(F.pages, P.pages);
  } catch { window.AI_TEAM_SHOW_PRICES = false; } // no prices file shipped: carry on without them
  return F;
}

export async function api(path, body) {
  if (body === undefined && GETS[path]) {
    const name = GETS[path], [d, meta] = await Promise.all([json(name), json("meta")]);
    const copy = redate(name, structuredClone(d), meta);
    return name === "floor-state" ? withPrices(copy) : copy;
  }
  // reading a note on the brain wall is a read, so it's answered too
  if (path === "/api/floor/note") { const notes = await json("notes"); if (notes[body?.id]) return structuredClone(notes[body.id]); throw new Error("That note isn't in this demo"); }
  // Ask the team: the suggested questions play a recorded example answer; a typed one with no recording gets the sheet
  if (path === "/api/floor/act/ask/ask") { const a = await recorded(body?.q); if (a) return play(a, String(body.q).trim()); }
  if (path === "/api/floor/act/ask/clear") { runId++; thread = []; emitThread(); return { ok: true }; }
  if (path === "/api/floor/chat") { const a = await recorded(body?.q); if (a) { await wait(1200); return { recorded: true, replies: a.replies.map(({ agent, text }) => ({ agent, text })) }; } }
  liveOnly(path, body);
  const err = new Error(LIVE); err.live = true; throw err;
}

// ---------------------------------------------------------------- recorded example answers (recorded.js)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let answers = null;
const recorded = async (q) => {
  answers ||= Promise.all(["/api/floor/state", "/api/d2/state", "/api/d3/state", "/api/office/chase/state", "/api/office/inv/state"].map((p) => api(p))).then(([F, I, P, C, O]) => build({ F, I, P, C, O }));
  return (await answers).get(norm(q)) || null;
};
// the app listens here the way it listens to the local server's live events
const subs = new Set();
export const listen = (fn) => { subs.add(fn); return () => subs.delete(fn); };
let thread = [], runId = 0;
const emitThread = () => { const ev = { demo: "floor", type: "act", page: "ask", store: { thread: structuredClone(thread) } }; for (const fn of subs) fn(ev); };
// plays one answer into the Ask page's thread: a beat of checking, then each reply typed out a few words at a time.
// It runs on timers, not CSS, so it plays the same with Reduce Motion switched on.
function play(a, q) {
  const id = ++runId, run = { q, at: Date.now(), running: true, recorded: true, partial: { replies: [] }, replies: [], follow_ups: [] };
  thread = [...thread.slice(-5), run]; emitThread();
  (async () => {
    await wait(1100);
    for (const rep of a.replies) {
      if (id !== runId) return;
      const cur = { agent: rep.agent, text: "", looked_at: [] }; run.partial.replies.push(cur);
      for (let n = 0; n < rep.text.length;) {
        const sp = rep.text.indexOf(" ", n + 16); n = sp < 0 ? rep.text.length : sp;
        cur.text = rep.text.slice(0, n); emitThread(); await wait(120);
        if (id !== runId) return;
      }
      cur.looked_at = rep.looked_at || []; emitThread(); await wait(400);
    }
    if (id !== runId) return;
    Object.assign(run, { running: false, replies: a.replies.map((r) => ({ ...r })), follow_ups: a.follow_ups || [], ms: Date.now() - run.at }); delete run.partial;
    emitThread();
  })();
  return { ok: true };
}
