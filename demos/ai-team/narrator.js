// Turns what the four AI employees are really doing into a running commentary, one line per step.
// Every line comes from real output arriving (a field read off a job sheet, an email routed, a van planned).
// site demo: the one helper this needs from the office dashboard's shared/app.js, copied in
const money = (n) => (n < 0 ? "−" : "") + "£" + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const AGENTS = [
  { v: "invoices", name: "Ivy", role: "Invoice clerk", initial: "I" },
  { v: "inbox", name: "Theo", role: "Inbox manager", initial: "T" },
  { v: "jobs", name: "Rowan", role: "Scheduler", initial: "R" },
  { v: "money", name: "Penny", role: "Credit controller", initial: "P" },
];
const ENG = { marcus: "Marcus", dave: "Dave", dan: "Dan", callum: "Callum" };
const short = (t, n) => (t && t.length > n ? t.slice(0, n - 1).trim() + "…" : t || "");
const dayWord = (S, iso) => iso === S.inbox.days[0] ? "today" : new Date(iso + "T12:00").toLocaleDateString("en-GB", { weekday: "long" });
const slotWords = (s) => ({ "08–10": "8–10am", "10–12": "10–12", "13–15": "1–3pm", "15–17": "3–5pm" }[s] || s);
const engFirst = (S, id) => (S.inbox.engineers.find((e) => e.id === id)?.name || "").split(" ")[0];
const custName = (S, sh) => sh.invoice?.quote?.customer || sh.read?.header?.customer || "";

export function createNarrator() {
  const seen = new Set();
  const feeds = { invoices: [], inbox: [], jobs: [], money: [] };
  let silent = true;
  const add = (agent, key, text, kind = "step", at) => {
    if (seen.has(key)) return;
    seen.add(key);
    const prev = feeds[agent][feeds[agent].length - 1];
    const when = silent ? (at === undefined ? (prev ? prev.at : Date.now()) : at) : Date.now();
    feeds[agent].push({ key, text, kind, at: when, born: silent ? 0 : Date.now() });
    if (feeds[agent].length > 60) feeds[agent].shift();
  };

  function scan(S) {
    // ---- Ivy: invoices
    const sheets = S.inv.sheets.slice().sort((a, b) => a.receivedAt - b.receivedAt);
    for (const sh of sheets) {
      const who = ENG[sh.engineerId] || "an engineer";
      add("invoices", sh.id + ":in", `Picked up ${who}'s job sheet. Reading the handwriting`, "step", sh.receivedAt);
      const p = sh.read || S.invPartials[sh.id] || {};
      if (p.work_done !== undefined && p.header?.customer) add("invoices", sh.id + ":cust", `It's for ${p.header.customer}, ${p.header.address}`, "step");
      if (p.time !== undefined && p.parts) add("invoices", sh.id + ":parts", p.parts.filter((x) => !x.crossed_out).length ? `Parts used: ${short(p.parts.filter((x) => !x.crossed_out).map((x) => `${x.qty} × ${x.description}`).join(", "), 90)}` : "No parts written down", p.parts.length ? "step" : "ask");
      if (p.signatures !== undefined && p.time) add("invoices", sh.id + ":hours", p.time.total_hours ? `${p.time.total_hours} on site (${p.time.arrived || "?"} to ${p.time.left || "?"})` : "The hours box is blank", p.time.total_hours ? "step" : "ask");
      if (p.quote_match !== undefined && p.signatures) add("invoices", sh.id + ":sig", p.signatures.customer_signed ? "Customer signed it" : "No customer signature", p.signatures.customer_signed ? "step" : "ask");
      if (p.unsure !== undefined && p.quote_match) add("invoices", sh.id + ":quote", p.quote_match.quote_id ? `Found the quote it belongs to: ${p.quote_match.quote_id}` : "Couldn't find a matching quote", "step");
      if (sh.read) {
        for (const u of sh.read.unsure) add("invoices", `${sh.id}:q:${u.field}`, `Not sure about this one: “${u.question}” Asking Priya rather than guessing`, "ask");
        if (sh.invoice) add("invoices", sh.id + ":drafted", `Invoice drafted for ${custName(S, sh)}: ${money(sh.invoice.total)}. In ${Math.round(sh.ms / 1000)} seconds`, "done", (sh.startedAt || sh.receivedAt) + (sh.ms || 0));
      }
      for (const m of S.inv.messages.filter((m) => m.sheetId === sh.id && m.from === "office")) {
        add("invoices", m.id + ":draft", `Wrote a text to ${ENG[m.engineerId] || "the engineer"}: “${short(m.body, 80)}”`, "step", m.at);
        if (m.status === "sent") add("invoices", m.id + ":sent", `Text sent to ${ENG[m.engineerId] || "the engineer"}`, "done", m.sentAt);
      }
      if (sh.approved) add("invoices", sh.id + ":ok", `Priya approved invoice ${sh.approved.number}. Off to ${custName(S, sh)}`, "done", sh.approved.at);
    }
    // (what Ivy learns is narrated by the brain log below)

    // ---- Theo: inbox
    const ib = S.inbox;
    const rounds = ib.rounds?.length ? ib.rounds : ib.ranAt ? [{ at: ib.ranAt, ids: ib.emails.map((e) => e.id), ms: ib.ms }] : [];
    for (const r of rounds) add("inbox", "run:" + r.at, `Opened the inbox: ${r.ids.length} new email${r.ids.length === 1 ? "" : "s"}. Reading ${r.ids.length === 1 ? "it" : "them all at once"}`, "step", r.at);
    for (const e of ib.emails.slice().sort((a, b) => a.receivedAt - b.receivedAt)) {
      if (["working", "booking", "done"].includes(e.status)) add("inbox", e.id + ":read", `Reading ${e.from_name}: “${short(e.subject, 60)}”`, "step");
      if (e.status === "booking" || (e.status === "done" && e.result?.route === "diary")) add("inbox", e.id + ":job", `${e.from_name} wants a job doing. Looking for a free ${(e.result?.job?.trades || [])[0] || "engineer"}`, "step");
      if (e.status !== "done" || !e.result) continue;
      const r = e.result;
      let line, kind = "done";
      if (r.route === "diary") {
        const bs = (e.bookings || []).map((id) => ib.bookings.find((b) => b.id === id)).filter(Boolean);
        if ((e.bookings || []).length && !bs.length) continue; // the booking hasn't reached the page yet
        line = bs.length ? `Booked ${bs.map((b) => `${engFirst(S, b.eng)} ${dayWord(S, b.date)} ${slotWords(b.slot)}`).join(" and ")} for ${e.from_name}. Reply drafted` : `Couldn't find a slot for ${e.from_name}. Asking Priya`;
      } else if (r.route === "kieran") line = r.category === "complaint" ? `Complaint from ${e.from_name}. Passed to Kieran with a holding reply` : `${e.from_name} wants a quote. Passed to Kieran`;
      else if (e.poCheck?.status === "flagged") { line = `Checked ${e.from_name}'s invoice against ${e.poCheck.po}: ${money(e.poCheck.over)} more than agreed. Flagged`; kind = "ask"; }
      else if (e.poCheck?.status === "matches") line = `Checked ${e.from_name}'s invoice against ${e.poCheck.po}: every line matches`;
      else if (r.route === "answered") line = `Answered ${e.from_name}: ${short(r.summary, 90)}`;
      else if (r.route === "junk") line = `Binned ${e.from_name}: ${short(r.summary, 70)}`;
      else if (r.route === "check_me") { line = `Not sure about ${e.from_name}: ${short(r.check_me_reasons[0] || r.summary, 90)}. Asking Priya`; kind = "ask"; }
      else line = `${e.from_name}: passed to ${r.route === "priya" ? "Priya" : "accounts"}`;
      add("inbox", e.id + ":done", line, kind);
    }
    for (const r of rounds) if (r.ms) add("inbox", "done:" + r.at, `Round done: ${r.ids.length} email${r.ids.length === 1 ? "" : "s"} sorted in ${Math.round(r.ms / 1000)} seconds`, "done", r.at + r.ms);
    for (const d of ib.drafts.filter((d) => d.status === "sent")) add("inbox", d.id + ":sent", `Reply sent to ${ib.emails.find((x) => x.id === d.emailId)?.from_name || d.to}`, "done", d.sentAt);
    for (const [id, dec] of Object.entries(ib.decisions || {})) if (dec) add("inbox", `${id}:dec:${dec.decision}`, `${dec.by} ${dec.decision === "pass" ? "passed" : "held"} ${ib.emails.find((x) => x.id === id)?.from_name || ""}'s invoice. Nothing paid by the AI`, "done", dec.at);

    // ---- Rowan: tomorrow's jobs
    const pl = S.plan;
    // (rules Rowan's been told are narrated by the brain log below)
    if (pl.busy) {
      const b = pl.busy;
      if (/Draft|Plan/.test(b.what)) add("jobs", "busy:" + b.since, `Looking at ${pl.jobs.length} jobs and ${pl.engineers.length} engineers: who's qualified, which postcodes sit together, which van has the parts`, "step", b.since);
      if (/text/i.test(b.what)) add("jobs", "busy:" + b.since, "Writing everyone's texts for tomorrow", "step", b.since);
      if (/Reshuffl/.test(b.what)) add("jobs", "busy:" + b.since, "11:00. A job's running over. Reworking the afternoon", "step", b.since);
      if (S.partial && /Draft|Plan/.test(b.what)) S.partial.slice(0, -1).forEach((rt) => { if (rt.slots.length) add("jobs", `p:${b.since}:${rt.engineerId}`, `${(pl.engineers.find((e) => e.id === rt.engineerId)?.name || "").split(" ")[0]}: ${rt.slots.map((s) => pl.jobs.find((j) => j.id === s.jobId)?.district).join(" → ")}`, "step"); });
    }
    if (pl.plan) {
      add("jobs", "plan:" + pl.plan.at, `Tomorrow planned: ${pl.plan.routes.reduce((a, r) => a + r.slots.length, 0)} jobs on ${pl.plan.routes.filter((r) => r.slots.length).length} vans, in ${Math.round(pl.plan.ms / 1000)} seconds`, "done", pl.plan.at);
      for (const c of pl.plan.rulesCheck) add("jobs", `kept:${pl.plan.at}:${c.ruleId}`, c.kept ? `Kept the rule: ${c.plain}` : `Couldn't keep the rule: ${c.plain}`, c.kept ? "done" : "ask", pl.plan.at);
      if (pl.plan.unassigned.length) add("jobs", "un:" + pl.plan.at, `${pl.plan.unassigned.length} job(s) need Priya: ${short(pl.plan.unassigned[0].reason, 80)}`, "ask", pl.plan.at);
    }
    if (pl.texts?.at) add("jobs", "texts:" + pl.texts.at, `Texted ${Object.keys(pl.texts.engineers).length} engineers their day and ${Object.keys(pl.texts.customers).length} customers a 2-hour window`, "done", pl.texts.at);
    if (pl.overrun) {
      const o = pl.overrun;
      add("jobs", "ov:" + o.at, `${(pl.engineers.find((e) => e.id === o.event.engineerId)?.name || "").split(" ")[0]}'s job ran over: “${short(o.event.reason, 80)}” Afternoon reshuffled`, "done", o.at);
      for (const a of o.affected) {
        const j = pl.jobs.find((x) => x.id === a.jobId);
        add("jobs", `ov:${o.at}:${a.jobId}`, a.kind === "next_day" ? `Moved ${j?.customer} to the next working day and texted them first` : `Texted ${j?.customer} a new time before they had to ring`, "done", o.at);
      }
    }

    // ---- Penny: money owed
    const c = S.chase;
    if (c.ranAt) add("money", "run:" + c.ranAt, `Going through ${c.items.length} unpaid invoices: ${money(c.items.reduce((a, i) => a + i.amount, 0))} in total`, "step", c.ranAt);
    for (const i of c.items) {
      if (i.status !== "waiting") add("money", i.id + ":look", `Reading the history on ${i.customer}: ${money(i.amount)}, ${i.days_overdue} days overdue`, "step");
      if (i.decision) add("money", i.id + ":dec", `${i.customer}: ${i.decision.headline}${i.status === "for_person" ? `. ${short(i.decision.for_person, 70)}` : ". Draft ready"}`, i.status === "for_person" ? "ask" : "done");
      if (i.status === "sent") add("money", i.id + ":sent", `Chaser sent to ${i.customer}`, "done", i.sentAt);
    }

    // ---- the brain: schedules, urgent jobs, lessons and notes between them
    for (const l of S.brain?.log || []) add(l.agent, l.id, l.text, l.kind, l.at);
    silent = false;
  }

  function next(S, v) {
    const r = (S.brain?.routines || []).filter((x) => x.agent === v && !x.event && x.nextAt).sort((a, b) => a.nextAt - b.nextAt)[0];
    if (!r) return null;
    const d = new Date(r.nextAt), today = d.toDateString() === new Date().toDateString();
    return `${r.title.split(":")[0]} at ${today ? "" : d.toLocaleDateString("en-GB", { weekday: "short" }) + " "}${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  function now(S, v) {
    const n = nowRaw(S, v);
    if (n.busy || n.ask || !S.brain?.autopilot) return n;
    const nx = next(S, v);
    return nx ? { text: `On autopilot. Next: ${nx}` } : n;
  }
  function nowRaw(S, v) {
    if (v === "invoices") {
      const r = S.inv.sheets.find((s) => s.status === "reading");
      if (r) return { busy: true, text: `Reading ${ENG[r.engineerId] || "an engineer"}'s job sheet` };
      const n = S.inv.sheets.filter((s) => s.status === "ready" && !s.approved).length;
      return n ? { text: `Waiting for Priya to approve ${n} invoice${n > 1 ? "s" : ""}`, ask: true } : { text: "Waiting for the next job sheet from the vans" };
    }
    if (v === "inbox") {
      if (S.inbox.running) return { busy: true, text: `Sorting the inbox: ${S.inbox.emails.filter((e) => e.status === "done").length} of ${S.inbox.emails.length} done` };
      const n = S.inbox.drafts.filter((d) => d.status === "draft").length + S.inbox.emails.filter((e) => e.result?.route === "check_me").length;
      if (n) return { text: `${n} thing${n > 1 ? "s" : ""} waiting for Priya`, ask: true };
      return S.inbox.emails.some((e) => e.status === "unread") ? { text: `${S.inbox.emails.filter((e) => e.status === "unread").length} new emails to deal with` } : { text: "Inbox clear. Watching for new mail" };
    }
    if (v === "jobs") {
      if (S.plan.busy) return { busy: true, text: S.plan.busy.what };
      if (S.plan.plan && S.plan.plan.routes.some((r) => r.warnings.some((w) => w.rule))) return { text: "Tomorrow's plan breaks a rule. Needs re-planning", ask: true };
      if (S.plan.overrun) return { text: "Afternoon reshuffled. Watching the vans" };
      if (S.plan.texts?.at) return { text: "Tomorrow's sorted. Watching for overruns" };
      if (S.plan.plan) return { text: "Plan ready for Priya to check", ask: true };
      return { text: `${S.plan.jobs.length} jobs booked for tomorrow. Plans at 3pm` };
    }
    if (S.chase.running) return { busy: true, text: "Working through the unpaid invoices" };
    const n = S.chase.items.filter((i) => i.status === "draft" || i.status === "for_person").length;
    const open = S.chase.items.filter((i) => i.status !== "paid");
    return n ? { text: `${n} chaser${n > 1 ? "s" : ""} waiting for Priya`, ask: true } : { text: `${money(open.reduce((a, i) => a + i.amount, 0))} owed across ${open.length} invoices` };
  }

  return { scan, feeds, now };
}
