// What happens on this public demo when you press something that would call Claude: nothing runs, and a small glass
// sheet says so plainly, with a way to see it run for real on a call with Tom.
import { BY_ID } from "./agents.js";

export const LIVE = "​live-only"; // the error message a live step throws here; flash() ignores it (the sheet has said it)
export const BOOK = "../../book/?utm_source=site&utm_medium=demo&utm_content=ai-team";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// what each live step would have done, in plain words
const KINDS = {
  ask: { agent: null, title: "Asking the team runs live", what: "The right person answers from Kingpost's records in a few seconds, and shows you what they checked." },
  check: { agent: "seo", title: "Seren checks a search live", what: "She reads any search the way a local customer means it, says what local pages miss, and briefs the page Kingpost should build." },
  relay: { agent: "seo", title: "The hand-off runs live", what: "Seren briefs Clara, Clara writes the page, Archie writes three ads to test it, and Maeve checks the lot before it goes to Priya." },
  ads: { agent: "ads", title: "Archie writes test ads live", what: "Three ads, a small test plan and his own check against your rules, all waiting for Kieran's yes." },
  drift: { agent: "manager", title: "Maeve's catch runs live", what: "Archie changes a live campaign outside his brief. Maeve checks it, stops it and has him redo it inside the brief." },
  content: { agent: "content", title: "Clara writes live", what: "A page, a Google post, an email or a video script in Kingpost's voice, using only what Kingpost can prove. Nothing goes out until Priya approves it." },
  teach: { agent: "coach", title: "Kit makes rules live", what: "Type a correction, or change a line, and Kit writes it as a rule for whoever it's for. Tom checks every new rule on Monday." },
  friday: { agent: "coach", title: "Kit writes the Friday report live", what: "What got better this week with the numbers, which corrections became rules, and what he's still watching. Past reports are on the Training page." },
  plan: { agent: "manager", title: "Maeve plans a goal live", what: "Give her a goal and she splits it into tasks on the board, each with the right person and a deadline." },
  read: { agent: "paperwork", title: "Dot reads photos live", what: "She reads every row, handwriting included, sets the sheet up as a dashboard and flags what doesn't add up. About 30 seconds." },
  upload: { agent: "paperwork", title: "Dot reads your own photo live", what: "Nothing has been uploaded. On a call, bring a photo of any sheet, form or receipt and watch her turn it into a dashboard." },
  askdot: { agent: "paperwork", title: "Dot answers any question live", what: "She answers from the paperwork she's filed, with the paper behind every figure. The ready-made questions show answers worked out from the sample paperwork." },
  edit: { agent: "paperwork", title: "Changes save live", what: "On the real system you can change any cell and the totals and chart update as you type." },
  prepare: { agent: "coach", title: "Kit prepares Monday's sheet live", what: "Everything the team did, every correction and every new rule, ready for Tom's half-hour check." },
  autopilot: { agent: null, title: "Autopilot runs live", what: "Ivy, Theo, Rowan and Penny work through the day on their own schedules: job sheets, the inbox, tomorrow's vans and the chase list." },
  run: { agent: null, title: "This round runs live", what: "On the real system each desk runs its round on a schedule, or when you press Run now." },
  other: { agent: null, title: "This step runs live", what: "It's real AI work, so on this public page it doesn't run." },
};
export function kindOf(path = "") {
  const p = String(path);
  if (/\/floor\/chat$|\/act\/ask\//.test(p)) return "ask";
  if (/\/act\/search\/check$/.test(p)) return "check";
  if (/\/floor\/relay$/.test(p)) return "relay";
  if (/\/act\/ads\/write$/.test(p)) return "ads";
  if (/\/floor\/drift$/.test(p)) return "drift";
  if (/\/act\/content\/write$/.test(p)) return "content";
  if (/\/office\/teach$/.test(p)) return "teach";
  if (/\/floor\/friday$/.test(p)) return "friday";
  if (/\/act\/tasks\/plan$/.test(p)) return "plan";
  if (/\/docs\/[\w-]+\/read$|\/act\/paperwork\/reread$/.test(p)) return "read";
  if (/\/act\/paperwork\/upload$/.test(p)) return "upload";
  if (/\/act\/paperwork\/ask$/.test(p)) return "askdot";
  if (/\/docs\/[\w-]+\/edit$|\/act\/paperwork\/edit$/.test(p)) return "edit";
  if (/\/act\/check\/prepare$/.test(p)) return "prepare";
  if (/\/brain\/autopilot$/.test(p)) return "autopilot";
  if (/\/brain\/run\//.test(p)) return "run";
  return KINDS[p] ? p : "other";
}

const LOGO = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M2.5 18.5L12 5l9.5 13.5z"/><path d="M12 5v13.5M12 12.2l-4.4 6.3M12 12.2l4.4 6.3"/></svg>`;
let open = null;
function close() { if (!open) return; const { el, back } = open; open = null; el.remove(); back?.focus?.({ preventScroll: true }); }

// pathOrKind: an /api path the app tried to call, or one of the KINDS above
// a cell edit says it once; after that the sheet keeps quiet and the edit just stays on screen
const ONCE = new Set(["edit"]), seen = new Set();
export function liveOnly(pathOrKind) {
  const kind = KINDS[pathOrKind] ? pathOrKind : kindOf(pathOrKind), K = KINDS[kind];
  if (ONCE.has(kind) && seen.has(kind)) return;
  seen.add(kind);
  if (open) close();
  const a = K.agent && BY_ID[K.agent];
  const el = document.createElement("div");
  el.className = "ln-wrap";
  el.innerHTML = `<div class="ln-sheet" role="dialog" aria-modal="true" aria-labelledby="ln-h">
      <div class="ln-k">${a ? `<span class="av-s" style="background:${a.color}" aria-hidden="true">${a.name[0]}</span><span>${esc(a.name)} · ${esc(a.role)}</span>` : `<span class="kp ln-kp">${LOGO}</span><span>The Kingpost AI team</span>`}</div>
      <h2 id="ln-h">${esc(K.title)}</h2>
      <p>${esc(K.what)}</p>
      <p class="ln-s">This public demo doesn't run the AI, and nothing is sent. Tom runs it live on a call, with your own work in it.</p>
      <div class="ln-b"><a class="btn primary" href="${BOOK}">Book a 45-min call</a><button class="btn" type="button" data-ln-close>Keep looking</button></div>
    </div>`;
  (document.getElementById("stage") || document.body).appendChild(el);
  open = { el, back: document.activeElement };
  el.addEventListener("click", (e) => { if (e.target === el || e.target.closest("[data-ln-close]")) close(); });
  el.querySelector(".btn.primary").focus({ preventScroll: true });
}
// Escape closes the sheet, and only the sheet (the app's own Escape flies back to the office)
// Tab stays inside the sheet while it's open
addEventListener("keydown", (e) => {
  if (!open) return;
  if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
  if (e.key === "Tab") {
    const f = [...open.el.querySelectorAll("a[href], button")], i = f.indexOf(document.activeElement);
    e.preventDefault(); e.stopImmediatePropagation();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
  }
}, true);

// the same thing, inline, for a card that has a place to say it
export const liveInline = (text) => `<div class="note ln-inline"><span>${esc(text)}</span> <a href="${BOOK}">Book a 45-min call</a></div>`;
