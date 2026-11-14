// Content: Clara's desk (video 6). The hero is Clara's next two weeks as a glowing strip, with the live writer under it:
// pick what it is and what it's about, and Clara writes it in front of you (a live Claude call that types in like a HUD),
// checks it against the house rules, and it lands on the strip as "With Priya". Nothing is ever posted or sent from here.
// Headline figures come from ctx.model so they agree with Home and Numbers; detail sits behind tabs.
import { $, $$, esc, num, chip, head, table, seg, barChart, hbars, note, foot, dayDate, short, dayName, ago, md, av, BY_ID, AGENTS } from "../ui.js";
import { liveInline } from "../live-note.js"; // site demo

const STAGES = ["Idea", "Drafting", "With Maeve", "With Priya", "Published"];
const ST_CLS = { Idea: "idea", Drafting: "drafting", "With Maeve": "maeve", "With Priya": "priya", Published: "published" };
const TONE = { "With Priya": "amber", "With Maeve": "holo", Published: "green" };
const DESK = { drafting: "Drafting", "with maeve": "With Maeve", approved: "With Priya", published: "Published", idea: "Idea" };
const TYPE = { "service page": "page", "google business post": "gbp", "email to landlords": "email", "blog post": "blog", blog: "blog", "short video script": "video" };
const NEXT = {
  Idea: "Next: Clara drafts it when there's a slot.",
  Drafting: "Next: Clara finishes it, then Maeve checks it.",
  "With Maeve": "Next: Maeve checks every claim against the proof list, then it goes to Priya.",
  "With Priya": "Waiting for Priya. Nothing goes out until she approves it and posts it herself.",
  Published: "Posted by Priya after she approved it.",
};
// how long each kind of piece should be, for the live length meter
const TAG = { page: "Page", gbp: "Google", email: "Email", blog: "Blog", video: "Video" };
const LEN = { page: [350, 500], gbp: [60, 110], email: [100, 180], blog: [300, 450], video: [60, 140] };
const RULES = ["No ranking or results promises", "No “guaranteed”, “best”, “#1” or “cheapest”", "Every claim is on the proof list", "Prices only from the proof list", "Plain British English", "No exclamation marks", "Word scan by the app"];
const ICON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 2.5l3 3L6 13H3v-3z"/><path d="M9 4l3 3"/></svg>`;
const sum = (a) => a.reduce((x, y) => x + y, 0);
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const wordsIn = (...t) => t.join(" ").split(/\s+/).filter(Boolean).length;
const ph = (ms, off = 0) => `-${Math.round((performance.now() + off) % ms)}ms`;
const dayLabel = (off) => (off === 0 ? "Today" : off === 1 ? "Tomorrow" : dayName(dayDate(off)));
let seen = false;

// which day (0 = today) a live draft is for; older drafts stored week/dow from Monday
function runDay(w) {
  if (w.for_day) return Math.round((new Date(`${w.for_day}T12:00:00`) - dayDate(0)) / 864e5);
  return -((new Date().getDay() + 6) % 7) + (w.week || 0) * 7 + (w.dow || 0);
}
function chan(D, id) { return D.channels.find((c) => c.id === id) || { id, name: id, short: id }; }

// a wide glowing trend line that fills its box
function trend(vals, { h = 40 } = {}) {
  const w = 240, lo = Math.min(...vals), hi = Math.max(...vals), sp = hi - lo || 1;
  const p = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 4 - ((v - lo) / sp) * (h - 10)]);
  const line = p.map((q) => q.join(",")).join(" "), last = p[p.length - 1];
  return `<svg class="tr" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="0,${h} ${line} ${w},${h}"/><polyline points="${line}" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="3"/></svg>`;
}

// ------------------------------------------------------------------ everything Clara has on, in one list
function relayItem(R) {
  if (!R?.page?.title) return null;
  const early = ["seo", "to-content", "content"].includes(R.stage);
  const status = R.running ? (early ? "Drafting" : "With Maeve") : R.stage === "done" && R.review?.verdict === "approved" ? "With Priya" : "Drafting";
  const p = R.page;
  return { id: "relay", src: "relay", channel: "page", title: p.title, status, words: wordsIn(p.intro || "", ...(p.sections || []).map((s) => `${s?.heading || ""} ${s?.body || ""}`)), note: `From the desk-to-desk job for “${R.opp.query}”`, relay: R };
}
function gather(D, F, writes) {
  const live = writes.filter((w) => !w.error).map((w) => ({ id: w.id, src: "live", channel: w.channel, title: (w.result || w.partial)?.title || w.topic, day: runDay(w), status: w.running ? "Drafting" : "With Priya", words: w.words || wordsIn((w.partial || {}).title || "", (w.partial || {}).body || ""), run: w, note: `Written live: “${w.topic}”` }));
  const plan = (D.plan || []).map((c) => ({ ...c, src: "plan" }));
  const pub = (D.published || []).map((p, i) => ({ ...p, id: `pub${i}`, src: "pub", status: "Published", note: p.from_brief ? "Written from Seren's brief" : "" }));
  const desk = (F.content?.drafts || []).map((d) => ({ id: d.id, src: "desk", channel: TYPE[String(d.type).toLowerCase()] || "page", title: d.title, status: DESK[String(d.status).toLowerCase()] || "Drafting", words: d.words, note: d.for_query ? `For the search “${d.for_query}”` : "", day_offset: d.day_offset }));
  const ideas = (D.backlog || []).map((b) => ({ ...b, src: "idea", status: "Idea", words: 0 }));
  const seen2 = new Set(), all = [];
  for (const it of [...live, relayItem(F.relay), ...plan, ...pub, ...desk, ...ideas]) { if (!it || seen2.has(norm(it.title))) continue; seen2.add(norm(it.title)); all.push(it); }
  const onPlan = all.filter((x) => typeof x.day === "number" && x.day >= 0 && x.day <= 13);
  return { all, onPlan };
}
function nextFree(onPlan) {
  for (let d = 0; d < 14; d++) if (!onPlan.some((x) => x.day === d)) return d;
  return 0;
}
const holder = (s) => s === "With Maeve" ? `${av("manager")}Maeve has it` : s === "With Priya" ? `<span class="av-s pr" aria-hidden="true">P</span>Priya has it` : s === "Published" ? "Posted by Priya" : `${av("content")}Clara has it`;

// ------------------------------------------------------------------ hero: the two-week strip, with the writer under it
function itemDetail(it, D) {
  const C = chan(D, it.channel);
  let body = "";
  if (it.src === "live") body = `<div class="dd">${draftDoc(it.run)}</div>`;
  else if (it.src === "relay") { const p = it.relay.page; body = `<div class="dd"><div class="doc"><h1>${esc(p.title || "")}</h1><p>${esc(p.intro || "")}</p>${(p.sections || []).map((s) => `<h2>${esc(s?.heading || "")}</h2><p>${esc(s?.body || "")}</p>`).join("")}${p.call_to_action ? `<p class="cta">${esc(p.call_to_action)}</p>` : ""}</div></div>`; }
  else if (it.excerpt) body = `<div class="dd"><div class="doc"><p>${esc(it.excerpt)}</p></div></div>`;
  const when = typeof it.day === "number" ? dayName(dayDate(it.day), true) : it.day_offset !== undefined ? `${it.status === "Published" ? "Went out" : "Started"} ${dayName(dayDate(it.day_offset))}` : "No date yet";
  return `<div class="det">
      <div class="deth"><div><span class="chl">${esc(C.name)}</span><b>${esc(it.title)}</b>${it.note ? `<div class="s">${esc(it.note)}</div>` : ""}</div><div class="row">${chip(it.status, TONE[it.status] || "")}<button class="btn sm" data-close>Close</button></div></div>
      <div class="kv"><div><b class="hd">${holder(it.status)}</b><span>who has it</span></div><div><b>${esc(when)}</b><span>${it.status === "Published" ? "went out" : "on the plan"}</span></div><div><b class="num">${it.words ? num(it.words) : "–"}</b><span>words</span></div></div>
      ${body}<p class="nx">${esc(NEXT[it.status] || "")}</p></div>`;
}
function strip(D, items, L, slot) {
  const pill = (it) => `<button class="it st-${ST_CLS[it.status]} ${it.src === "live" ? "new" : ""} ${L.open === it.id && L.from === "plan" ? "sel" : ""}" data-open="${it.id}" data-from="plan" data-tip="${esc(`${it.status}: ${it.title}`)}">
      <span class="cl"><span>${esc(TAG[it.channel] || chan(D, it.channel).short)}</span><i></i></span><b class="${it.run?.running ? "shimmer" : ""}">${esc(it.title)}</b></button>`;
  const day = (d) => {
    const its = items.filter((x) => x.day === d), dt = dayDate(d);
    return `<div class="day ${d === 0 ? "today" : ""} ${its.length ? "" : "free"}" style="--k:${d}">
        <div class="dh"><span>${d === 0 ? "Today" : esc(dt.toLocaleDateString("en-GB", { weekday: "short" }))}</span><b>${dt.getDate()}</b></div>
        <div class="tick"><i style="--ph:${ph(2000)}"></i></div>
        ${its.map(pill).join("")}
        ${!its.length || slot === d ? `<button class="slot ${slot === d ? "sel" : ""}" data-slot="${d}">${slot === d ? "Clara writes for this day" : "+ Ask Clara"}</button>` : ""}
      </div>`;
  };
  const open = L.from === "plan" && items.find((x) => x.id === L.open);
  const later = items.filter((x) => x.day >= 7).length;
  return `<div class="strip"><div class="wk">${Array.from({ length: 7 }, (_, d) => day(d)).join("")}</div><div class="wk">${Array.from({ length: 7 }, (_, d) => day(d + 7)).join("")}</div>${later ? `<div class="more2">+ ${later} more the week after, on the pipeline below</div>` : ""}</div>${open ? itemDetail(open, D) : ""}`;
}
function consoleForm(D, ctx, L, slot) {
  const busy = (ctx.acts.writes || []).some((r) => r.running), ch = L.ch || "gbp";
  const opts = Array.from({ length: 14 }, (_, d) => `<option value="${d}" ${d === slot ? "selected" : ""}>${esc(dayLabel(d))}</option>`).join("");
  return `<div class="cons">
      <div class="cs-h"><h3>Ask Clara to write something</h3>${seg(D.channels.map((c) => [c.id, `<span class="ln">${esc(c.name)}</span><span class="sn">${esc(c.short)}</span>`]), ch, "ch")}</div>
      <form class="ask wf" id="wr-f">${ICON}<input id="wr-in" placeholder="What's it about? A job, a season, a question customers ask" value="${esc(L.topic || "")}" autocomplete="off" ${busy ? "disabled" : ""}><label class="for">for <select id="wr-day" ${busy ? "disabled" : ""}>${opts}</select></label><button ${busy ? "disabled" : ""}>${busy ? "Writing…" : "Write it"}</button></form>
      <div class="row ex"><span class="s">Try</span>${(D.topics?.[ch] || []).map((t) => `<button class="chip" data-topic="${esc(t)}" ${busy ? "disabled" : ""}>${esc(t)}</button>`).join("")}</div>
    </div>`;
}
function figures(M) {
  const E = M.employees.content, W = M.weeks, K = E.kpis, n = E.units.at(-1), ok = Math.round((n * E.approved_first_time_pct) / 100);
  const leads = W.map((w) => w.leads.content);
  return `<div class="figs">
      <div class="card fig" data-tip="${esc(K[2].working)}"><h3>${esc(K[0].label)}</h3><div class="fr"><div class="big" data-count="${n}">${num(n)}</div>${trend(E.units)}</div><div class="working-line">${esc(K[2].working)}</div></div>
      <div class="card fig" data-tip="${esc(K[1].working)}"><h3>${esc(K[1].label)}</h3><div class="fr"><div class="big" data-count="${E.approved_first_time_pct}">${E.approved_first_time_pct}<small>%</small></div>
        <div class="pips">${Array.from({ length: n }, (_, i) => `<i class="${i < ok ? "on" : ""}"></i>`).join("")}</div></div><div class="working-line">${esc(K[1].working)}</div></div>
      <div class="card fig" data-tip="From her posts, emails and videos. Pages she writes from Seren's briefs count on Search, so nothing is counted twice."><h3>Enquiries from her pieces</h3><div class="fr"><div class="big" data-count="${leads.at(-1)}">${num(leads.at(-1))}</div>${trend(leads)}</div><div class="working-line">Calls and forms from her posts, emails and videos, last 7 days</div></div>
    </div>`;
}

// ------------------------------------------------------------------ live: Clara writes something
function draftDoc(run) {
  const r = run.result || run.partial || {}, live = run.running;
  if (!r.title && live) return `<div class="doc"><p class="shimmer">Clara is writing…</p><span class="sk"></span><span class="sk"></span><span class="sk"></span></div>`;
  return `<div class="doc ${live ? "caret" : ""}"><h1>${esc(r.title || "")}</h1>${md(r.body || "")}${r.call_to_action ? `<p class="cta">${esc(r.call_to_action)}</p>` : ""}</div>`;
}
function ruleRows(run) {
  const r = run.result, sc = run.scan;
  if (run.running || !r) return RULES.map((t, i) => `<div class="ckr q" style="--i:${i}"><i></i><div><b>${esc(t)}</b><span class="mono">${run.running ? "queued" : ""}</span></div></div>`).join("");
  const rows = (r.checks || []).map((c) => ({ ok: c.ok, b: c.rule, t: c.note }));
  if (sc) { const bad = [...sc.banned, ...(sc.exclaim ? ["exclamation marks"] : []), ...(sc.ranks ? ["ranking talk"] : [])]; rows.push({ ok: !bad.length, b: "Word scan by the app", t: bad.length ? `Found: ${bad.join(", ")}. Priya to look at it.` : "Clean: none of the words Clara never uses." }); }
  return rows.map((c, i) => `<div class="ckr ${c.ok ? "ok" : "bad"}" style="--i:${i}" data-tip="${esc(c.t)}"><i></i><div><b>${esc(c.b)}</b><span>${esc(c.t)}</span></div></div>`).join("");
}
function writer(D, ctx, L) {
  const runs = ctx.acts.writes || [], cur = runs.find((r) => r.id === L.run) || runs[0];
  if (!cur) return "";
  const C = chan(D, cur.channel), r = cur.result || cur.partial || {}, d = runDay(cur);
  const words = cur.words || wordsIn(r.title || "", r.body || "", r.call_to_action || ""), [lo, hi] = LEN[cur.channel] || [60, 200];
  const flags = cur.result ? (cur.result.checks || []).filter((c) => !c.ok).length + (cur.scan ? cur.scan.banned.length + (cur.scan.exclaim ? 1 : 0) + (cur.scan.ranks ? 1 : 0) : 0) : 0;
  const status = cur.error ? chip("Didn't finish", "red") : cur.running ? chip("Writing now", "holo") : chip("With Priya", "amber");
  return `<section class="card hud wout ${cur.running ? "live" : ""}" id="wr-card">
      <div class="ch"><h3>${cur.running ? `<span class="ldot busy"></span> Clara is writing` : "Clara's draft"}</h3><div class="r">${status}</div></div>
      <div class="meta">
        <span><em>Channel</em><b>${esc(C.name)}</b></span>
        <span><em>For</em><b>${esc(dayLabel(d))}</b></span>
        <span><em>Words</em><b class="num">${num(words)}</b></span>
        <span class="len"><em>Length</em><span class="lm"><i style="width:${Math.min(100, (words / hi) * 100)}%" class="${words >= lo && words <= hi ? "ok" : words > hi ? "over" : ""}"></i><u style="left:${(lo / hi) * 100}%"></u></span><small>${lo} to ${hi}</small></span>
        <span><em>House rules</em><b>${cur.running ? "after the draft" : cur.error ? "–" : flags ? `${flags} to look at` : "all passed"}</b></span>
      </div>
      ${cur.error ? note(`Clara couldn't finish this one: ${esc(cur.error)}`, "red") : `<div class="wg">
        <div class="draft" style="--ph:${ph(2600)}">${draftDoc(cur)}</div>
        <div class="side">
          <h4>Checked against the house rules</h4><div class="cks">${ruleRows(cur)}</div>
          ${(cur.result?.proof_used || []).length ? `<h4>Proof it uses</h4><ul class="pu">${cur.result.proof_used.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
          <p class="s">Nothing is posted or sent. It's on the plan for ${esc(d === 0 ? "today" : d === 1 ? "tomorrow" : dayName(dayDate(d)))}, waiting for Priya to read it, approve it and post it herself.</p>
        </div></div>`}
      ${runs.length > 1 ? `<div class="pastc"><span class="s">Clara's drafts today</span>${runs.map((x) => `<button class="pc ${x.id === cur.id ? "sel" : ""}" data-run="${x.id}"><i class="ldot ${x.running ? "busy" : x.error ? "bad" : "need"}"></i>${esc((x.result || x.partial)?.title || x.topic)}</button>`).join("")}</div>` : ""}
    </section>`;
}

// ------------------------------------------------------------------ tabs: pipeline, the relay page, how it did, how she writes
function pipeline(D, all, L, M) {
  const col = (s) => all.filter((x) => x.status === s);
  // Published shows the newest four; its count is every piece out in the last 4 weeks (the data's handful plus the rest)
  const count = (s, xs) => (s === "Published" ? Math.max(xs.length, pubTotal(D, M)) : xs.length);
  const cardOf = (it) => {
    const C = chan(D, it.channel), when = typeof it.day === "number" ? dayLabel(it.day) : it.src === "pub" ? short(dayDate(it.day_offset)) : "";
    return `<button class="pc2 st-${ST_CLS[it.status]} ${it.src === "live" ? "new" : ""} ${L.open === it.id && L.from === "board" ? "sel" : ""}" data-open="${it.id}" data-from="board"><span class="chl">${esc(C.short)}</span><b class="${it.run?.running || (it.src === "relay" && it.relay.running && it.status === "Drafting") ? "shimmer" : ""}">${esc(it.title)}</b>
      <span class="m">${[it.words ? `${num(it.words)} words` : "", when, it.src === "relay" ? "from Seren's brief" : ""].filter(Boolean).map(esc).join(" · ")}</span><span class="hd">${holder(it.status)}</span></button>`;
  };
  const cols = STAGES.map((s) => { const xs = col(s), shown = s === "Published" ? xs.slice(0, 4) : xs, n = count(s, xs); return `<div class="plc st-${ST_CLS[s]}"><div class="plh"><b>${s === "Published" ? "Published, 4 weeks" : s}</b><span class="num">${n}</span></div>${shown.map(cardOf).join("")}${n > shown.length ? `<div class="more">and ${n - shown.length} more</div>` : ""}${!xs.length ? `<div class="more">Nothing here</div>` : ""}</div>`; }).join("");
  const open = L.from === "board" && all.find((x) => x.id === L.open);
  return `<div class="pl">${cols}</div>${open ? itemDetail(open, D) : ""}`;
}
function relayTab(F) {
  const R = F.relay;
  if (!R?.page) {
    const o = F.seo.opportunities.find((x) => x.status === "found") || F.seo.opportunities[0];
    return `<div class="rl0"><p>${R?.running ? "Seren's writing Clara's brief now. The page will appear here as Clara writes it." : "No page from Seren yet today. Pages start at Seren's desk: she finds a search nobody local answers well and briefs Clara, who writes it here."}</p>
      <div class="row"><button class="btn primary" data-relay="${o.id}" ${R?.running ? "disabled" : ""}>Start one: “${esc(o.query)}”</button><button class="btn" data-go="search">Pick a search on Seren's desk</button></div></div>`;
  }
  const p = R.page, writing = R.running && R.stage === "content", at = { seo: 0, "to-content": 1, content: 1, "to-ads": 2, ads: 2, "to-manager": 3, review: 3, done: 4 }[R.stage] ?? 0, ok = R.review?.verdict === "approved";
  const steps = [["seo", "Seren's brief"], ["content", "Clara writes the page"], ["ads", "Archie's three test ads"], ["manager", "Maeve's check"], [null, "Priya approves"]];
  const prog = `<div class="prog">${steps.map(([a, t], i) => {
    const done = i < at, on = (i === at && R.running) || (i === 4 && R.stage === "done" && ok), bad = !R.running && R.stage !== "done" && i === at;
    return `<div class="pg1 ${bad ? "bad" : i === 4 && on ? "wait" : on ? "on" : done ? "done" : ""}">${a ? av(a) : `<span class="av-s pr" aria-hidden="true">P</span>`}<span>${esc(t)}</span><span class="st">${bad ? "stopped" : i === 4 && on ? "waiting" : on ? "now" : done ? "done" : ""}</span></div>`;
  }).join("")}</div>`;
  const review = R.review ? `<h4>Maeve's check ${chip(ok ? "Approved" : "Changes asked", ok ? "green" : "red")}</h4><div class="cks">${R.review.checks.map((c) => `<div class="ckr ${c.ok ? "ok" : "bad"}"><i></i><div><b>${esc(c.check)}</b><span>${esc(c.note)}</span></div></div>`).join("")}</div>` : "";
  const ads = R.ads?.variants ? `<h4>Archie's three test ads</h4>${R.ads.variants.map((v) => `<div class="adv"><span class="chl">${esc(v.angle)}</span><b>${esc(v.headline)}</b><span>${esc(v.description)}</span></div>`).join("")}` : "";
  return `<p class="tabl">For “${esc(R.opp.query)}”${R.running ? ` ${chip("live", "holo")}` : ""}</p><div class="rlg">
      <div class="doc ${writing ? "caret" : ""}"><h1>${esc(p.title || "")}</h1><p>${esc(p.intro || "")}</p>${(p.sections || []).map((s) => `<h2>${esc(s?.heading || "")}</h2><p>${esc(s?.body || "")}</p>`).join("")}${p.call_to_action ? `<p class="cta">${esc(p.call_to_action)}</p>` : ""}</div>
      <div class="side">${prog}${review}${ads}${R.brief ? `<h4>Seren's brief</h4><p class="s">${esc(R.brief.brief)}</p>` : ""}</div>
    </div>`;
}
// how many pieces went out in the last 4 weeks: three earlier 7-day windows from the data, the last 7 days from the model
function pubWeeks(D, M) { return [...(D.published_weeks || []), M.employees.content.published]; }
function pubTotal(D, M) { return D.published_weeks ? sum(pubWeeks(D, M)) : (D.published || []).length; }
function howItDid(D, M) {
  const P = D.published, W = M.weeks, leads = W.map((w) => w.leads.content), posts = P.filter((p) => !p.from_brief), more = D.published_more || [];
  const rows = P.map((p) => [
    `<b>${esc(p.title)}</b><div class="s">${esc(chan(D, p.channel).name)}</div>`, esc(short(dayDate(p.day_offset))),
    `<span ${p.views_note ? `data-tip="${esc(p.views_note)}"` : ""}>${num(p.views)}</span>`, p.from_brief ? `<span class="s">on Search</span>` : `<b>${num(p.enquiries)}</b>`,
  ]);
  const moreN = sum(more.map((m) => m.count)), moreE = sum(more.map((m) => m.enquiries));
  if (moreN) rows.push([`<b>And ${moreN} more</b><div class="s">${more.map((m) => `${m.count} ${esc(chan(D, m.channel).short.toLowerCase())}${m.count === 1 ? "" : "s"}`).join(", ")}</div>`, "", num(sum(more.map((m) => m.views))), `<b>${num(moreE)}</b>`]);
  const by = D.channels.map((c) => ({ c, v: sum(posts.filter((p) => p.channel === c.id).map((p) => p.enquiries)) + sum(more.filter((m) => m.channel === c.id).map((m) => m.enquiries)) })).filter((x) => x.v);
  const l4 = sum(leads.slice(-4)), parts = [...posts.map((p) => p.enquiries), ...(moreN ? [moreE] : [])], wk = pubWeeks(D, M);
  const opens = P.find((p) => p.views_note);
  return `<div class="pub">
      <div>${table([{ label: `Went out in the last 4 weeks · ${pubTotal(D, M)}` }, { label: "On" }, { label: "Views", r: true }, { label: "Enquiries, 4 weeks", r: true }], rows)}
        <div class="working-line">${parts.join(" + ")} = ${sum(parts)} enquiries from her posts in the last 4 weeks, the same as ${leads.slice(-4).join(" + ")} week by week. Pages she wrote from Seren's briefs count on the Search page.</div>
        ${D.published_weeks ? `<div class="working-line">${P.length} shown + ${moreN} more = ${pubTotal(D, M)} pieces out in the last 4 weeks: ${wk.join(" + ")}, 7 days at a time</div>` : ""}
        ${opens ? `<p class="fine">For the landlord email, views are opens: ${esc(opens.views_note)}.</p>` : ""}</div>
      <div><div class="kv"><div><b>${leads.at(-1)}</b><span>last 7 days</span></div><div><b>${l4}</b><span>last 4 weeks</span></div><div><b>${sum(leads.slice(-8, -4))}</b><span>the 4 weeks before</span></div></div>
        <div class="chh"><h4>Enquiries from Clara's pieces, each week</h4>${chip("Sample data")}</div>${barChart(leads.map((v, i) => ({ l: short(dayDate(W[i].day_offset)), v })), { h: 140, every: 3 })}
        <div class="chh"><h4>By channel, last 4 weeks</h4></div>${hbars(by.map((x) => ({ label: esc(x.c.name), v: x.v, tip: `${x.c.name}: ${x.v} enquiries` })))}</div>
    </div>`;
}
function voice(D, ctx) {
  const V = D.voice;
  return `<div class="vc">
      <div><h4>How she sounds</h4>${V.principles.map((p) => `<div class="vp"><b>${esc(p.b)}</b><span>${esc(p.t)}</span></div>`).join("")}</div>
      <div><h4>Words she never uses</h4><div class="nv">${V.never.map((w) => `<span class="nw">${esc(w)}</span>`).join("")}</div><h4>Proof rules</h4><ul>${V.proof_rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
      <div><h4>Before and after</h4>${V.before_after.map((x) => `<div class="ba"><div class="bf"><span>Not this</span><p>${esc(x.before)}</p></div><div class="af"><span>Clara writes</span><p>${esc(x.after)}</p></div></div>`).join("")}</div>
    </div>
    <div class="vc2"><div class="lg"><h4>Proof Clara's allowed to use <span class="s">if it's not here, it's not in the draft</span></h4><ul class="pb">${D.proof_bank.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      <div class="lg"><h4>${av("content")}Clara's log today</h4>${ctx.feed("content", 8)}</div></div>`;
}

// ------------------------------------------------------------------ change a line, and it becomes a rule
// One of Clara's drafts waiting for Priya (plan item c1, the one Home lists). Checked against her rules (the house rules
// on this page + her rules in the team rulebook, the same ones the Training page lists under Clara). Priya changes one
// line in place; saving sends a plain sentence to /api/office/teach (a live call) and the rule Kit writes appears here.
// Approve only marks it approved on screen: nothing is posted or sent.
const HOUSE_N = RULES.length - 1; // the six house rules; the last row of RULES is the app's own word scan
const TICK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>`;
function claraRules(ctx) {
  const book = (ctx.pages.training?.library || []).filter((r) => r.agent === "content").length + (ctx.F.coach?.rules_this_week || []).filter((r) => r.agent === "content").length;
  const live = (ctx.lessons || []).filter((l) => l.agent === "content");
  return { book, live, total: HOUSE_N + book + live.length };
}
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
function editCard(D, ctx, L) {
  const E = D.edit_line, it = E && (D.plan || []).find((x) => x.id === E.piece);
  if (!it) return "";
  const S = (L.ed ||= {}), T = S.teach, R = claraRules(ctx);
  const base = S.base ?? R.total, bookN = S.bookN ?? R.book + R.live.length;
  const newRules = T?.lessons || [], forClara = newRules.filter((l) => l.agent === "content" && !(S.had || []).includes(l.id)).length;
  const pips = (n, extra) => `<div class="edp">${Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join("")}${Array.from({ length: extra }, () => `<i class="nw"></i>`).join("")}</div>`;
  const line = (t, i) => {
    if (i !== E.edit) return `<p>${esc(t)}</p>`;
    if (S.editing) return `<div class="edw"><textarea id="ed-in" rows="2" spellcheck="false" aria-label="Change this line">${esc(S.draft ?? E.suggested)}</textarea>
        <div class="edb"><button class="btn primary sm" id="ed-save">Save change</button><button class="btn sm" id="ed-cancel">Cancel</button><span class="s">Type your own, or keep this one. Enter saves.</span></div></div>`;
    if (S.saved) return `<p class="edx gone"><s>${esc(S.saved.old)}</s></p><p class="edx neu">${esc(S.saved.neu)}<span class="edt">Priya's change</span></p>`;
    return `<p class="edl" id="ed-line" role="button" tabindex="0" title="Click to change this line">${esc(t)}<span class="edt">${ICON}Change this line</span></p>`;
  };
  const who = andList([...new Set(newRules.map((l) => l.agent))].map((a) => BY_ID[a]?.name || a));
  const reads = newRules.length && new Set(newRules.map((l) => l.agent)).size >= AGENTS.length ? "Every employee reads this now."
    : newRules.every((l) => l.agent === "content") ? "Clara reads this now, before every draft."
    : `${who} read this now.`;
  const ruleBox = !S.saved
    ? `<p class="s">Click the underlined line and change it. Kit turns your edit into a rule.</p>`
    : T?.running ? `<div class="edk"><span class="ldot busy"></span><div><span class="shimmer">Kit's writing it as a rule…</span><small>“${esc(T.text)}”</small></div></div>`
    : T?.live ? liveInline("Priya's change is made. On a call, Kit turns it into a rule that Clara reads before every draft.") // site demo
    : T?.error ? note(`Couldn't make that a rule: ${esc(T.error)}`, "red")
    : `<div class="edr">${newRules.slice().sort((a, b) => (b.agent === "content") - (a.agent === "content")).map((l, i) => `<div class="edrr ${i ? "also" : ""}" title="${esc(l.text)}">${av(l.agent)}<p><b>${esc(BY_ID[l.agent]?.name || l.agent)}</b> ${esc(l.text)}</p></div>`).join("") || `<p class="s">${esc(T?.reply || "Kit didn't add a rule for that one.")}</p>`}</div>
       <p class="edev">${newRules.length ? `<span class="ldot good"></span><b>${esc(reads)}</b> ` : ""}<button class="edgo" data-go="training">See it on Training →</button></p>`;
  const approved = S.approved, learnt = T && !T.running && !T.error && !T.live && newRules.length;
  return `<section class="card ed ${approved ? "ok" : ""}" id="ed-card">
      <div class="ch"><div><h3>The step that keeps it sounding like you</h3><h2 class="edh">Change a line, and it becomes a rule</h2></div>
        <div class="r">${chip(approved ? "Approved" : "With Priya", approved ? "green" : "amber")}${S.saved || S.approved || S.editing ? `<button class="btn sm" id="ed-reset" title="Put the card back to the start for another take">Start again</button>` : ""}</div></div>
      <div class="edg">
        <div class="edd"><div class="doc">
          <span class="chl">Clara's draft · for ${esc(dayLabel(it.day).toLowerCase())}</span>
          <h1>${esc(it.title)}</h1>
          ${E.lines.map(line).join("")}
          <p class="edmore">${esc(E.more || "")}</p>
        </div></div>
        <div class="eds">
          <div class="edc ok"><div class="edch"><span class="edn">1</span><h4>Checked against your rules</h4></div>
            <div class="edbig"><span class="edtick">${TICK}</span><b class="num" data-count="${base}">${base}</b><span>rules,<br>all passed</span>${pips(base, forClara)}</div>
            <div class="working-line" title="The house rules on this page, plus Clara's rules on the Training page">${forClara ? `Next draft: ${base + forClara}, with your edit` : `${HOUSE_N} house rules + ${bookN} Clara learned`}</div></div>
          <div class="edc ${approved ? "ok" : "need"}"><div class="edch"><span class="edn">2</span><h4>Waits for your yes</h4></div>
            ${approved ? `<div class="edyes"><span class="edtick">${TICK}</span><div><b>Approved by Priya</b><span>Nothing posted or sent. She puts it live herself.</span></div></div>`
              : `<div class="edyes"><button class="btn amber" id="ed-ok">Approve</button><span class="s">Priya's yes. Nothing is posted or sent from here.</span></div>`}</div>
          <div class="edc ${learnt ? "learnt" : T?.running ? "busy" : ""}"><div class="edch"><span class="edn">3</span><h4>Your edit becomes a rule</h4>${av("coach")}</div>${ruleBox}</div>
        </div>
      </div>
    </section>`;
}

// ------------------------------------------------------------------ the page
export default {
  css: `
  .pg-content h4 { margin: 0 0 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pg-content h4 .av-s { margin: 0; width: 20px; height: 20px; font-size: 9px; }
  .pg-content h4 .s { text-transform: none; letter-spacing: 0; font-weight: 400; }
  .pg-content .s { font-size: 12.5px; color: var(--ink-3); }
  .pg-content .fine { margin: 8px 0 0; font-size: 12px; color: var(--ink-3); }
  .pg-content .now { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, .03); font-size: 13px; color: var(--ink-2); max-width: 380px; min-width: 0; }
  .pg-content .now span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pg-content .card .ch .r .av-s { margin-right: 4px; }
  .pg-content .chl { font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-content .av-s.pr { background: var(--amber-tint); color: var(--amber-ink); box-shadow: 0 0 0 1px rgba(255, 181, 71, .45); }
  .pg-content .sk { display: block; height: 10px; margin: 12px 0; border-radius: 4px; background: rgba(70, 200, 255, .12); animation: pulse 1.4s ease-in-out infinite; }
  .pg-content .sk:last-child { width: 60%; }
  .pg-content .doc .cta { font-weight: 600; margin-top: 12px; color: var(--holo-2); }
  .pg-content .doc.caret::after { display: none; }
  .pg-content .doc.caret > :last-child::after { content: ""; display: inline-block; width: 2px; height: 1em; margin-left: 3px; vertical-align: -2px; background: var(--holo); box-shadow: 0 0 8px var(--holo); animation: blink 1s steps(2) infinite; }
  .pg-content .doc h1 { color: #fff; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; margin: 0 0 12px; }
  .pg-content .doc h2 { color: var(--holo-2); }

  /* hero */
  .pg-content .hero { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 16px; align-items: stretch; }
  .pg-content .figs { display: grid; grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .pg-content .fig { display: flex; flex-direction: column; justify-content: space-between; gap: 8px; padding: 18px 20px; }
  .pg-content .fig h3 { margin: 0; }
  .pg-content .fr { display: flex; align-items: flex-end; gap: 16px; min-width: 0; }
  .pg-content .fig .big { font-size: 44px; }
  .pg-content .fig .big small { font-size: 20px; margin-left: 2px; color: var(--holo-2); }
  .pg-content .fig .tr { display: block; flex: 1; min-width: 40px; height: 40px; margin-bottom: 8px; overflow: visible; }
  .pg-content .tr polygon { fill: rgba(70, 200, 255, .1); }
  .pg-content .tr polyline { fill: none; stroke: var(--holo); stroke-width: 1.8; stroke-linejoin: round; filter: drop-shadow(0 0 4px rgba(70, 200, 255, .8)); }
  .pg-content .tr circle { fill: var(--holo-2); filter: drop-shadow(0 0 6px var(--holo)); }
  .pg-content .pips { display: flex; flex: 1; gap: 5px; margin-bottom: 12px; min-width: 40px; }
  .pg-content .pips i { flex: 1; height: 10px; border-radius: 3px; background: rgba(255, 255, 255, .06); box-shadow: inset 0 0 0 1px var(--line); }
  .pg-content .pips i.on { background: linear-gradient(180deg, rgba(166, 230, 255, .9), var(--holo)); box-shadow: 0 0 10px -2px var(--holo); }
  .pg-content .fig .working-line { margin-top: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .pg-content .plan { padding: 20px 22px; overflow: hidden; background: radial-gradient(110% 80% at 30% 30%, rgba(30, 110, 170, .15), transparent 70%), var(--glass-fill), var(--noise) var(--glass-tint); }
  .pg-content .plan > .ch { flex-wrap: wrap; }
  .pg-content .msub { margin: 0; font-size: 12.5px; color: var(--ink-3); }
  .pg-content .leg { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12px; color: var(--ink-2); }
  .pg-content .leg span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  .pg-content .leg b { font: 500 12px var(--mono); color: var(--ink); }
  .pg-content .leg i, .pg-content .it .cl i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); box-shadow: 0 0 8px var(--c); flex: none; }
  .pg-content .st-idea { --c: rgba(168, 191, 212, .45); }
  .pg-content .st-drafting { --c: rgba(70, 200, 255, .55); }
  .pg-content .st-maeve { --c: var(--holo); }
  .pg-content .st-priya { --c: var(--amber); }
  .pg-content .st-published { --c: var(--green); }
  .pg-content .strip { display: grid; gap: 14px; margin-top: 14px; }
  .pg-content .more2 { display: none; padding: 4px 0 0 58px; font-size: 12px; color: var(--ink-3); }
  .pg-content .wk { position: relative; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
  .pg-content .wk::before { content: ""; position: absolute; left: 4px; right: 4px; top: 34px; height: 1px; background: linear-gradient(90deg, rgba(70, 200, 255, .55), rgba(70, 200, 255, .15)); box-shadow: 0 0 10px var(--holo-glow); }
  .pg-content .wk + .wk::before { background: linear-gradient(90deg, rgba(70, 200, 255, .2), rgba(70, 200, 255, .08)); box-shadow: none; }
  .pg-content .day { position: relative; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .pg-content.intro .day { animation: pgc-up .5s cubic-bezier(.2, .8, .2, 1) both; animation-delay: calc(var(--k) * 35ms); }
  @keyframes pgc-up { from { opacity: 0; transform: translateY(10px); } }
  .pg-content .dh { display: flex; align-items: baseline; gap: 6px; height: 22px; padding-left: 2px; font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); white-space: nowrap; }
  .pg-content .dh b { font: 400 16px var(--mono); letter-spacing: 0; color: var(--ink-2); }
  .pg-content .day.today .dh { color: var(--holo); text-shadow: none; }
  .pg-content .day.today .dh b { color: #fff; }
  .pg-content .tick { position: relative; height: 12px; }
  .pg-content .tick i { position: absolute; left: 2px; top: 2px; width: 8px; height: 8px; border-radius: 50%; background: var(--panel-3); box-shadow: 0 0 0 1px rgba(70, 200, 255, .5); }
  .pg-content .day.today .tick i { left: 0; top: 0; width: 12px; height: 12px; background: var(--holo); box-shadow: 0 0 0 3px rgba(70, 200, 255, .2), 0 0 14px var(--holo); }
  .pg-content .day.today .tick i::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid var(--holo); animation: pgc-ping 2s ease-out var(--ph) infinite; }
  @keyframes pgc-ping { from { opacity: .9; transform: scale(.6); } to { opacity: 0; transform: scale(2); } }
  .pg-content .it { position: relative; display: grid; gap: 4px; padding: 8px 10px 8px 12px; text-align: left; border-radius: 10px; border: 1px solid var(--line); background: rgba(255, 255, 255, .025); cursor: pointer; font-size: 12px; line-height: 1.3; color: var(--ink-2); overflow: hidden; transition: border-color .15s, transform .15s; min-width: 0; }
  .pg-content .it::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--c); box-shadow: 0 0 10px var(--c); }
  .pg-content .it:hover { border-color: var(--line-2); transform: translateY(-1px); }
  .pg-content .it .cl { display: flex; justify-content: space-between; align-items: center; gap: 6px; font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); white-space: nowrap; overflow: hidden; }
  .pg-content .it .cl span { overflow: hidden; text-overflow: ellipsis; }
  .pg-content .it b { font-weight: 500; color: var(--ink); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: break-word; }
  .pg-content .it.st-idea { border-style: dashed; background: transparent; }
  .pg-content .it.st-idea b { color: var(--ink-2); font-weight: 400; }
  .pg-content .it.st-maeve { border-color: rgba(70, 200, 255, .32); background: var(--holo-tint); }
  .pg-content .it.st-priya { border-color: rgba(255, 181, 71, .45); background: var(--amber-tint); box-shadow: 0 0 22px -10px var(--amber); }
  .pg-content .it.new { border-color: rgba(70, 200, 255, .7); box-shadow: 0 0 24px -8px var(--holo-glow); }
  .pg-content .it.sel { outline: 2px solid var(--ink); outline-offset: 1px; }
  .pg-content .slot { margin-top: auto; height: 28px; border: 1px dashed var(--line-2); border-radius: 8px; background: none; color: var(--ink-3); font-size: 11.5px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: border-color .15s, color .15s; }
  .pg-content .slot:hover { color: #fff; border-color: rgba(70, 200, 255, .6); background: var(--holo-tint); }
  .pg-content .slot.sel { border-style: solid; border-color: var(--holo); background: var(--holo-tint); color: var(--holo-2); box-shadow: 0 0 18px -8px var(--holo-glow); }
  .pg-content .day.free .slot { flex: 1; min-height: 64px; height: auto; white-space: normal; }

  .pg-content .cons { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line); }
  .pg-content .cs-h { display: flex; align-items: center; justify-content: space-between; gap: 8px 16px; flex-wrap: wrap; }
  .pg-content .cs-h h3 { margin: 0; color: var(--holo-2); }
  .pg-content .cs-h .sn { display: none; }
  .pg-content .wf { height: 58px; margin-top: 12px; padding-left: 18px; border-radius: 16px; border-color: rgba(70, 200, 255, .4); box-shadow: 0 0 40px -16px var(--holo-glow); }
  .pg-content .wf input { font-size: 15.5px; }
  .pg-content .wf input:disabled { opacity: .6; }
  .pg-content .wf .for { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-3); white-space: nowrap; margin-right: 4px; }
  .pg-content .wf select { height: 34px; padding: 0 8px; border: 1px solid var(--line-2); border-radius: 8px; background: var(--panel-2); font: 500 13px var(--sans); color: var(--ink); }
  .pg-content .wf button { height: 42px; padding: 0 22px; font-size: 14px; border-radius: 12px; box-shadow: 0 0 24px -6px var(--holo); }
  .pg-content .wf button:disabled { opacity: .55; cursor: default; }
  .pg-content .ex { margin-top: 12px; }
  .pg-content .ex .s { margin-right: 4px; }
  .pg-content .ex .chip { cursor: pointer; }
  .pg-content .ex .chip:hover:not(:disabled) { border-color: rgba(70, 200, 255, .5); color: #fff; }

  /* the draft, typing in */
  .pg-content .wout { margin-top: 16px; border-color: rgba(70, 200, 255, .3); }
  .pg-content .wout.live { border-color: rgba(70, 200, 255, .6); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05), 0 0 60px -20px var(--holo-glow); }
  .pg-content .wout .ch h3 { display: flex; align-items: center; gap: 10px; }
  .pg-content .wout.live .ch h3 { color: var(--holo-2); }
  .pg-content .meta { display: flex; flex-wrap: wrap; gap: 10px 28px; padding: 12px 16px; margin-top: 4px; border: 1px solid var(--line); border-radius: 12px; background: rgba(0, 0, 0, .18); }
  .pg-content .meta > span { display: grid; gap: 2px; min-width: 0; }
  .pg-content .meta em { font: 500 12.5px var(--mono); font-style: normal; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-content .meta b { font: 500 13.5px var(--sans); color: #fff; white-space: nowrap; }
  .pg-content .meta b.num { font: 400 16px var(--mono); color: var(--holo-2); }
  .pg-content .meta .len { min-width: 140px; }
  .pg-content .lm { position: relative; display: block; height: 6px; margin-top: 6px; border-radius: 6px; background: rgba(255, 255, 255, .07); }
  .pg-content .lm i { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg, rgba(70, 200, 255, .4), var(--holo)); box-shadow: 0 0 8px var(--holo); transition: width .3s; }
  .pg-content .lm i.ok { background: linear-gradient(90deg, rgba(63, 224, 160, .4), var(--green)); box-shadow: 0 0 8px var(--green); }
  .pg-content .lm i.over { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
  .pg-content .lm u { position: absolute; top: -3px; bottom: -3px; width: 1px; background: var(--ink-3); }
  .pg-content .meta small { font: 400 10.5px var(--mono); color: var(--ink-3); margin-top: 2px; }
  .pg-content .wg { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 24px; margin-top: 16px; align-items: start; }
  .pg-content .draft { position: relative; border: 1px solid var(--line); border-radius: 14px; padding: 20px 24px; max-height: 520px; overflow-y: auto; background: rgba(255, 255, 255, .02); }
  .pg-content .wout.live .draft { border-color: rgba(70, 200, 255, .35); }
  .pg-content .wout.live .draft::after { content: ""; position: absolute; left: 0; right: 0; top: -30%; height: 30%; pointer-events: none; background: linear-gradient(180deg, transparent, rgba(70, 200, 255, .07), transparent); animation: pgc-scan 2.6s linear var(--ph) infinite; }
  @keyframes pgc-scan { to { top: 130%; } }
  .pg-content .side p { margin: 0 0 16px; }
  .pg-content .cks { display: grid; gap: 10px; margin-bottom: 18px; }
  .pg-content .ckr { display: grid; grid-template-columns: 10px minmax(0, 1fr); gap: 12px; font-size: 13px; align-items: start; }
  .pg-content .ckr i { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; background: var(--ink-3); }
  .pg-content .ckr.ok i { background: var(--green); box-shadow: 0 0 8px var(--green); }
  .pg-content .ckr.bad i { background: var(--red); box-shadow: 0 0 8px var(--red); }
  .pg-content .ckr.q { opacity: .55; }
  .pg-content .ckr.q i { background: rgba(70, 200, 255, .4); animation: pulse 1.4s ease-in-out infinite; animation-delay: calc(var(--i) * 120ms); }
  .pg-content .ckr.ok, .pg-content .ckr.bad { animation: pgc-in .35s ease-out both; animation-delay: calc(var(--i) * 90ms); }
  @keyframes pgc-in { from { opacity: 0; transform: translateX(-6px); } }
  .pg-content .ckr b { display: block; font-weight: 500; color: var(--ink); }
  .pg-content .ckr.bad b { color: #ffb0b3; }
  .pg-content .ckr span { display: block; font-size: 12.5px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-content .ckr.bad span { white-space: normal; }
  .pg-content .pu { margin: 0 0 16px; padding-left: 18px; font-size: 12.5px; color: var(--ink-2); }
  .pg-content .pu li { margin: 4px 0; }
  .pg-content .pastc { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 16px; }
  .pg-content .pastc .s { margin-right: 4px; }
  .pg-content .pastc .pc { display: inline-flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); color: var(--ink-2); font-size: 12px; cursor: pointer; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-content .pastc .pc.sel { border-color: rgba(70, 200, 255, .55); color: #fff; background: var(--holo-tint); }
  .pg-content .pastc .ldot { width: 6px; height: 6px; }

  /* detail of one piece */
  .pg-content .det { margin-top: 16px; padding: 20px; border: 1px solid var(--line-2); border-radius: 14px; background: rgba(0, 0, 0, .2); }
  .pg-content .deth { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .pg-content .deth b { display: block; margin-top: 4px; font-size: 17px; font-weight: 600; color: #fff; }
  .pg-content .deth .row { flex-wrap: nowrap; }
  .pg-content .det .kv { margin: 16px 0; }
  .pg-content .det .kv b { font: 500 14px/1.35 var(--sans); letter-spacing: 0; }
  .pg-content .det .kv b.num { font-family: var(--mono); }
  .pg-content .kv .hd, .pg-content .pc2 .hd { display: flex; align-items: center; font-size: 12px; color: var(--ink-2); }
  .pg-content .det .kv b.hd { font: 500 13px var(--sans); color: var(--ink); min-height: 20px; }
  .pg-content .hd .av-s { width: 18px; height: 18px; font-size: 9px; margin-right: 8px; }
  .pg-content .det .dd .doc { padding: 16px 20px; max-height: 360px; overflow-y: auto; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .02); }
  .pg-content .det .nx { margin: 12px 0 0; font-size: 13px; color: var(--ink-2); }

  /* tabs */
  .pg-content .tabsc { margin-top: 16px; }
  .pg-content .tabsc > .ch { margin-bottom: 16px; flex-wrap: wrap; }
  .pg-content .tabl { margin: 0 0 12px; font-size: 13px; color: var(--ink-3); display: flex; align-items: center; gap: 8px; }
  .pg-content .pl { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
  .pg-content .plc { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 8px; background: rgba(255, 255, 255, .02); border: 1px solid var(--line); border-radius: 14px; border-top: 2px solid var(--c); }
  .pg-content .plh { display: flex; justify-content: space-between; align-items: center; padding: 4px; font-size: 12.5px; }
  .pg-content .plh b { font-weight: 600; color: var(--ink); }
  .pg-content .plh span { font-size: 13px; color: var(--c); }
  .pg-content .pc2 { display: grid; gap: 4px; padding: 12px; text-align: left; background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px; cursor: pointer; font-size: 13px; line-height: 1.35; color: var(--ink-2); min-width: 0; }
  .pg-content .pc2:hover { border-color: var(--line-2); }
  .pg-content .pc2.sel { border-color: var(--holo); }
  .pg-content .pc2.new { border-color: rgba(70, 200, 255, .6); box-shadow: 0 0 20px -8px var(--holo-glow); }
  .pg-content .pc2.st-priya { border-color: rgba(255, 181, 71, .4); }
  .pg-content .pc2 b { font-weight: 500; color: var(--ink); }
  .pg-content .pc2 .m { font-size: 12px; color: var(--ink-3); }
  .pg-content .pc2 .hd { margin-top: 4px; }
  .pg-content .more { padding: 4px; font-size: 12px; color: var(--ink-3); }
  .pg-content .rl0 p { margin: 4px 0 16px; color: var(--ink-2); max-width: 760px; }
  .pg-content .rlg { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 24px; align-items: start; }
  .pg-content .rlg > .doc { padding: 20px 24px; max-height: 560px; overflow-y: auto; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .02); }
  .pg-content .prog { display: grid; gap: 8px; margin-bottom: 20px; }
  .pg-content .pg1 { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 8px; border: 1px solid var(--line); border-radius: 10px; font-size: 13px; color: var(--ink-2); }
  .pg-content .pg1 .av-s { margin: 0; }
  .pg-content .pg1 .st { font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-content .pg1.on { border-color: rgba(70, 200, 255, .55); background: var(--holo-tint); }
  .pg-content .pg1.on .st { color: var(--holo); }
  .pg-content .pg1.wait { border-color: rgba(255, 181, 71, .5); background: var(--amber-tint); }
  .pg-content .pg1.wait .st { color: var(--amber-ink); }
  .pg-content .pg1.done .st { color: var(--green); }
  .pg-content .pg1.bad { border-color: rgba(255, 97, 104, .5); background: var(--red-tint); }
  .pg-content .adv { display: grid; gap: 2px; padding: 8px 12px; margin-bottom: 8px; border: 1px solid var(--line); border-radius: 10px; font-size: 12.5px; }
  .pg-content .adv b { font-weight: 600; font-size: 13.5px; color: var(--ink); }
  .pg-content .adv span:last-child { color: var(--ink-2); }
  .pg-content .side > .s { margin: 0; }
  .pg-content .pub { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 24px; align-items: start; }
  .pg-content .pub td .s { margin-top: 2px; font-size: 12px; }
  .pg-content .pub td:nth-child(2), .pg-content .pub td:nth-child(4) { white-space: nowrap; }
  .pg-content .pub .working-line { margin-top: 12px; }
  .pg-content .chh { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 20px; }
  .pg-content .chh h4 { margin: 0; }
  .pg-content .pub .hbars { margin-top: 12px; }
  .pg-content .vc { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; }
  .pg-content .vp { margin-bottom: 16px; }
  .pg-content .vp b { display: block; font-size: 15px; font-weight: 600; color: #fff; }
  .pg-content .vp span { font-size: 13px; color: var(--ink-2); }
  .pg-content .nv { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
  .pg-content .nw { padding: 2px 8px; border-radius: 6px; background: var(--red-tint); color: #ffb0b3; font-size: 12.5px; text-decoration: line-through; text-decoration-color: rgba(255, 97, 104, .7); }
  .pg-content .vc ul { margin: 0; padding-left: 20px; font-size: 13px; color: var(--ink-2); }
  .pg-content .vc li { margin: 4px 0; }
  .pg-content .ba { display: grid; gap: 8px; margin-bottom: 16px; }
  .pg-content .ba > div { padding: 12px; border: 1px solid var(--line); border-radius: 10px; font-size: 13px; }
  .pg-content .ba span { font: 500 12.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-content .ba p { margin: 4px 0 0; color: var(--ink-2); }
  .pg-content .ba .bf p { color: var(--ink-3); text-decoration: line-through; text-decoration-color: rgba(255, 97, 104, .5); }
  .pg-content .ba .af { background: var(--green-tint); border-color: rgba(63, 224, 160, .35); }
  .pg-content .ba .af span { color: #8ff0c6; }
  .pg-content .ba .af p { color: var(--ink); }
  .pg-content .vc2 { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; margin-top: 24px; }
  .pg-content .lg { padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .02); min-width: 0; }
  .pg-content .pb { margin: 0; padding-left: 18px; font-size: 13px; color: var(--ink-2); columns: 2; column-gap: 24px; }
  .pg-content .pb li { margin: 0 0 6px; break-inside: avoid; }

  /* change a line, and it becomes a rule */
  .pg-content .ed { margin-top: 16px; padding: 18px 20px; border-color: rgba(255, 181, 71, .3); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04), 0 0 60px -30px var(--amber-glow); }
  .pg-content .ed.ok { border-color: rgba(63, 224, 160, .32); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04), 0 0 60px -30px rgba(63, 224, 160, .5); }
  .pg-content .ed > .ch { align-items: flex-start; margin-bottom: 14px; }
  .pg-content .ed > .ch .r { flex: none; }
  .pg-content .ed > .ch h3 { color: var(--amber-ink); opacity: .85; }
  .pg-content .ed.ok > .ch h3 { color: #8ff0c6; }
  .pg-content .edh { margin: 4px 0 0; font-size: 24px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.2; color: #fff; }
  .pg-content .edg { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 14px; align-items: start; }
  .pg-content .edd .doc { padding: 16px 18px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .02); font-size: 14px; line-height: 1.6; }
  .pg-content .edd .doc h1 { font-size: 18px; margin: 6px 0 8px; }
  .pg-content .edd .doc p { margin: 0 0 8px; }
  .pg-content .edmore { font-size: 12px; color: var(--ink-3); margin: 0 !important; }
  .pg-content .edt { display: inline-flex; align-items: center; gap: 4px; margin-left: 6px; padding: 0 6px; height: 19px; vertical-align: 1px; border-radius: 6px; font: 600 12.5px var(--sans); letter-spacing: 0; text-transform: none; white-space: nowrap; text-decoration: none; color: var(--amber-ink); background: var(--amber-tint); border: 1px solid rgba(255, 181, 71, .35); }
  .pg-content .edt svg { width: 11px; height: 11px; }
  .pg-content .edl { margin: 0 -8px 8px !important; padding: 4px 8px; border-radius: 8px; cursor: text; color: var(--ink); text-decoration: underline dashed rgba(255, 181, 71, .75); text-decoration-thickness: 1px; text-underline-offset: 5px; transition: background .15s, box-shadow .15s; }
  .pg-content .edl:hover, .pg-content .edl:focus-visible { outline: none; background: var(--amber-tint); box-shadow: inset 0 0 0 1px rgba(255, 181, 71, .45); }
  .pg-content .edw { margin: 0 -8px 8px; padding: 6px; border-radius: 10px; background: var(--amber-tint); box-shadow: inset 0 0 0 1px rgba(255, 181, 71, .5), 0 0 30px -10px var(--amber-glow); }
  .pg-content .edw textarea { display: block; width: 100%; box-sizing: border-box; resize: none; overflow: hidden; padding: 4px 8px; border: 0; border-radius: 6px; background: rgba(0, 0, 0, .28); font: 500 14px/1.6 var(--sans); color: #fff; caret-color: var(--amber); }
  .pg-content .edw textarea:focus { outline: 1px solid rgba(255, 181, 71, .6); }
  .pg-content .edb { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 8px; margin-top: 6px; }
  .pg-content .edb .s { font-size: 11.5px; }
  .pg-content .edx.gone { margin: 0 0 4px !important; color: var(--ink-3); animation: pgc-fade .5s ease-out both; }
  .pg-content .edx.gone s { text-decoration-color: rgba(255, 97, 104, .9); text-decoration-thickness: 2px; }
  .pg-content .edx.neu { margin: 0 -8px 8px !important; padding: 4px 8px 4px 11px; border-radius: 8px; color: #fff; font-weight: 500; background: var(--green-tint); box-shadow: inset 3px 0 0 var(--green); animation: pgc-in .45s .15s ease-out both; }
  .pg-content .edx.neu .edt { color: #8ff0c6; background: rgba(63, 224, 160, .12); border-color: rgba(63, 224, 160, .4); }
  @keyframes pgc-fade { from { color: var(--ink); } }
  .pg-content .eds { display: grid; gap: 8px; }
  .pg-content .edc { padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, .02); min-width: 0; }
  .pg-content .edc.need { border-color: rgba(255, 181, 71, .35); background: var(--amber-tint); }
  .pg-content .edc.ok { border-color: rgba(63, 224, 160, .3); }
  .pg-content .edc.busy { border-color: rgba(70, 200, 255, .55); background: var(--holo-tint); box-shadow: 0 0 30px -12px var(--holo-glow); }
  .pg-content .edc.learnt { border-color: rgba(70, 200, 255, .45); box-shadow: 0 0 30px -14px var(--holo-glow); }
  .pg-content .edch { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .pg-content .edch h4 { margin: 0; flex: 1; color: var(--ink-2); }
  .pg-content .edch .av-s { margin: 0; width: 20px; height: 20px; font-size: 9px; }
  .pg-content .edn { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; font: 500 10px var(--mono); color: var(--ink-2); box-shadow: inset 0 0 0 1px var(--line-2); flex: none; }
  .pg-content .edc.ok .edn { color: var(--green); box-shadow: inset 0 0 0 1px rgba(63, 224, 160, .5); }
  .pg-content .edc.need .edn { color: var(--amber-ink); box-shadow: inset 0 0 0 1px rgba(255, 181, 71, .55); }
  .pg-content .edc.busy .edn, .pg-content .edc.learnt .edn { color: var(--holo-2); box-shadow: inset 0 0 0 1px rgba(70, 200, 255, .55); }
  .pg-content .edtick { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; flex: none; color: #04261a; background: var(--green); box-shadow: 0 0 16px -2px var(--green); }
  .pg-content .edtick svg { width: 15px; height: 15px; }
  .pg-content .edbig { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pg-content .edbig b { font: 300 38px/1 var(--mono); color: #fff; text-shadow: none; }
  .pg-content .edbig > span:not(.edtick) { font-size: 12px; line-height: 1.3; color: var(--ink-2); }
  .pg-content .edp { flex: 1; display: grid; grid-template-columns: repeat(6, minmax(0, 14px)); justify-content: end; gap: 4px; min-width: 0; }
  .pg-content .edp i { height: 6px; border-radius: 3px; background: var(--green); box-shadow: 0 0 8px -1px var(--green); opacity: .85; }
  .pg-content .edp i.nw { background: var(--holo); box-shadow: 0 0 10px var(--holo); opacity: 1; animation: pgc-in .5s ease-out both; }
  .pg-content .edc .working-line { margin-top: 6px; }
  .pg-content .edyes { display: flex; align-items: center; gap: 12px; }
  .pg-content .edyes .btn { flex: none; height: 38px; padding: 0 22px; font-size: 14px; }
  .pg-content .edyes .s { font-size: 12.5px; color: var(--ink-2); }
  .pg-content .edyes b { display: block; font-weight: 600; color: #fff; }
  .pg-content .edyes > div span { display: block; font-size: 12.5px; color: var(--ink-2); }
  .pg-content .edc > .s { margin: 0; font-size: 13px; color: var(--ink-2); }
  .pg-content .edk { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; }
  .pg-content .edk .ldot { margin-top: 6px; }
  .pg-content .edk small { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 4px; font-size: 12px; color: var(--ink-3); }
  .pg-content .edr { display: grid; gap: 6px; }
  .pg-content .edrr { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 10px; align-items: start; padding: 8px 10px; border-radius: 10px; background: var(--holo-tint); box-shadow: inset 0 0 0 1px rgba(70, 200, 255, .35), 0 0 24px -12px var(--holo-glow); animation: pgc-in .45s ease-out both; }
  .pg-content .edrr .av-s { margin: 0; }
  .pg-content .edrr p { margin: 0; font-size: 13px; line-height: 1.45; color: var(--ink); display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
  .pg-content .edrr.also { padding: 6px 10px; background: rgba(255, 255, 255, .02); box-shadow: inset 0 0 0 1px var(--line); }
  .pg-content .edrr.also .av-s { width: 18px; height: 18px; font-size: 9px; }
  .pg-content .edrr.also p { font-size: 12px; color: var(--ink-2); -webkit-line-clamp: 2; }
  .pg-content .edrr b { color: var(--holo-2); font-weight: 600; }
  .pg-content .edev { margin: 8px 0 0; font-size: 13px; line-height: 1.5; color: var(--ink-2); }
  .pg-content .edev b { font-weight: 600; color: #fff; }
  .pg-content .edev .ldot.good { margin-right: 8px; vertical-align: 1px; box-shadow: 0 0 10px var(--green); }
  .pg-content .edgo { padding: 0; border: 0; background: none; font: 500 13px var(--sans); color: var(--holo-2); cursor: pointer; white-space: nowrap; }
  .pg-content .edgo:hover { color: #fff; text-shadow: none; }

  @container (max-width: 1060px) {
    .pg-content .vc { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pg-content .vc > div:nth-child(3) { grid-column: 1 / -1; }
    .pg-content .pb { columns: 1; }
  }
  @container (max-width: 960px) {
    .pg-content .hero { grid-template-columns: minmax(0, 1fr); }
    .pg-content .figs { grid-template-rows: none; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .pg-content .fig .big { font-size: 34px; }
    .pg-content .wg, .pg-content .rlg, .pg-content .pub, .pg-content .vc2 { grid-template-columns: minmax(0, 1fr); }
  }
  @container (max-width: 760px) {
    .pg-content .edg { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .pg-content .edh { font-size: 21px; }
    .pg-content .edyes .s { font-size: 12px; }
  }
  @container (max-width: 600px) {
    .pg-content .edg { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  }
  @container (max-width: 760px) {
    .pg-content .plan { padding: 16px; }
    .pg-content .wk { gap: 6px; }
    .pg-content .it { padding: 6px 6px 6px 9px; font-size: 11px; letter-spacing: -0.01em; }
    .pg-content .it .cl { font-size: 8.5px; letter-spacing: .06em; }
    .pg-content .dh b { font-size: 14px; }
    .pg-content .wf .for { display: none; }
    .pg-content .cs-h .ln { display: none; }
    .pg-content .cs-h .sn { display: inline; }
    .pg-content .fig { padding: 14px 16px; }
    .pg-content .fig .working-line { display: none; }
    .pg-content .vc { grid-template-columns: minmax(0, 1fr); }
    .pg-content .deth { flex-direction: column; }
  }
  @container (max-width: 560px) {
    .pg-content .strip { gap: 0; }
    .pg-content .wk { grid-template-columns: minmax(0, 1fr); gap: 0; }
    .pg-content .wk::before { left: 23px; right: auto; top: 0; bottom: 0; width: 1px; height: auto; background: linear-gradient(180deg, rgba(70, 200, 255, .5), rgba(70, 200, 255, .15)); }
    .pg-content .wk + .wk::before { background: rgba(70, 200, 255, .15); }
    .pg-content .day { display: grid; grid-template-columns: 48px minmax(0, 1fr); grid-auto-rows: min-content; gap: 0 10px; padding: 5px 0; align-items: start; }
    .pg-content .day > * { grid-column: 2; }
    .pg-content .day > .it { margin-bottom: 6px; }
    .pg-content .wk + .wk { display: none; }
    .pg-content .more2 { display: block; }
    .pg-content .day > .dh { grid-column: 1; grid-row: 1 / span 4; flex-direction: column; align-items: center; gap: 0; height: auto; padding: 2px 0 0; background: var(--bg-2); border-radius: 8px; position: relative; z-index: 1; }
    .pg-content .day > .tick { display: none; }
    .pg-content .day.free { display: none; }
    .pg-content .day .slot { display: none; }
    .pg-content .it b { -webkit-line-clamp: 2; }
    .pg-content .figs { gap: 8px; }
    .pg-content .fig { padding: 12px; }
    .pg-content .fig h3 { font-size: 9.5px; letter-spacing: .1em; min-height: 26px; }
    .pg-content .fig .big { font-size: 28px; }
    .pg-content .fig .tr, .pg-content .pips { display: none; }
    .pg-content .wf { height: 54px; padding-left: 14px; }
    .pg-content .wf input { font-size: 14px; }
    .pg-content .wf button { padding: 0 14px; }
    .pg-content .now { display: none; }
    .pg-content .pub table.t th:nth-child(2), .pg-content .pub table.t td:nth-child(2) { display: none; }
    .pg-content .meta { gap: 10px 18px; }
    .pg-content .ed { padding: 14px; }
    .pg-content .ed > .ch { position: relative; display: block; margin-bottom: 10px; }
    .pg-content .ed > .ch .r { position: absolute; top: -6px; right: 0; }
    .pg-content .ed > .ch .r .chip { display: none; }
    .pg-content .ed > .ch h3 { font-size: 9.5px; letter-spacing: .1em; }
    .pg-content .edh { font-size: 19px; }
    .pg-content .edd .doc { padding: 12px 14px; font-size: 13px; line-height: 1.55; }
    .pg-content .edd .doc h1 { font-size: 16px; }
    .pg-content .edw textarea { font-size: 13px; }
    .pg-content .edc { padding: 10px 12px; }
    .pg-content .edch { margin-bottom: 6px; }
    .pg-content .edbig b { font-size: 30px; }
  }`,

  render(host, ctx) {
    const F = ctx.F, D = ctx.data, L = ctx.local, M = ctx.model;
    if (!D.plan || !M) { host.innerHTML = `<div class="inner pg-content">${head({ title: "Content", agent: "content" })}${note("Clara's sample data didn't load (data/floor/pages/content.json).", "red")}</div>`; return; }
    const intro = !seen; seen = true;
    const writes = ctx.acts.writes || [], writing = writes.find((w) => w.running);
    const { all, onPlan } = gather(D, F, writes);
    const slot = L.slot ?? nextFree(onPlan);
    const st = writing ? { busy: true, text: `Writing “${writing.topic}”` } : ctx.status("content");
    const R = F.relay, relayLive = R?.page && R.running;
    const count = (s) => onPlan.filter((x) => x.status === s).length;
    const tab = L.tab || "board";

    host.innerHTML = `<div class="inner pg-content ${intro ? "intro" : ""}">
      ${head({ title: "Content", agent: "content",
        lede: "Clara writes Kingpost's pages, Google posts, landlord emails and video scripts: short, plain, local, and only what Kingpost can prove. Nothing goes out until Priya approves it.",
        actions: `<span class="now"><i class="ldot ${st.busy ? "busy" : ""}"></i><span class="${st.busy ? "shimmer" : ""}">${esc(st.text)}</span></span>${D.edit_line ? `<button class="btn" data-ed-go><i class="ldot ${L.ed?.approved ? "good" : "need"}"></i>Change a line</button>` : ""}<button class="btn" data-desk>Clara's desk</button>` })}
      <section class="hero">
        <section class="card hud plan">
          <div class="ch"><div><h3>Clara's next two weeks</h3><p class="msub">Today to ${esc(dayName(dayDate(13)))} · ${onPlan.length} pieces on the plan</p></div>
            <div class="r leg">${STAGES.slice(0, 4).map((s) => `<span class="st-${ST_CLS[s]}"><i></i>${s}<b>${count(s)}</b></span>`).join("")}</div></div>
          ${strip(D, onPlan, L, slot)}
          ${consoleForm(D, ctx, L, slot)}
        </section>
        ${figures(M)}
      </section>
      ${writer(D, ctx, L)}
      ${editCard(D, ctx, L)}
      ${relayLive ? `<section class="card tabsc"><div class="ch"><h3>Latest page from the desk-to-desk job</h3><span class="r">${chip("live", "holo")}</span></div>${relayTab(F)}</section>` : ""}
      <section class="card tabsc" id="ct-tabs">
        <div class="ch">${seg([["board", `Pipeline · ${all.length - all.filter((x) => x.status === "Published").length + Math.max(all.filter((x) => x.status === "Published").length, pubTotal(D, M))}`], ...(relayLive ? [] : [["relay", "From Seren's brief"]]), ["did", "How it did"], ["voice", "How Clara writes"]], relayLive && tab === "relay" ? "board" : tab, "tab")}<span class="r">${tab === "did" ? "enquiries agree with Home and Numbers" : tab === "voice" ? "the same rules Maeve checks against" : "click any piece to read it"}</span></div>
        ${tab === "did" ? howItDid(D, M) : tab === "voice" ? voice(D, ctx) : tab === "relay" && !relayLive ? relayTab(F) : pipeline(D, all, L, M)}
      </section>
      ${foot()}</div>`;

    // wiring
    const redraw = () => ctx.redraw();
    $("[data-desk]", host)?.addEventListener("click", () => ctx.openAgent("content"));
    const input = $("#wr-in", host), day = $("#wr-day", host);
    if (input) input.oninput = () => (L.topic = input.value);
    if (day) day.onchange = () => { L.slot = Number(day.value); redraw(); };
    const reveal = () => { const r = $("#wr-card", host)?.getBoundingClientRect(), H = host.clientHeight; if (r && (r.top < 0 || r.top > H * 0.45)) host.scrollTo({ top: host.scrollTop + r.top - 24, behavior: "smooth" }); };
    const write = async (topic) => {
      topic = String(topic || "").trim();
      if (!topic) { input?.focus(); return; }
      const d = Number(day?.value ?? slot);
      L.topic = ""; input?.blur();
      const r = await ctx.act("write", { channel: L.ch || "gbp", topic, day: d }).catch((e) => { if (e.live) L.topic = topic; ctx.flash(e.message); return null; });
      if (r) { L.run = r.id; L.slot = null; }
      await redraw();
      reveal();
    };
    $("#wr-f", host)?.addEventListener("submit", (e) => { e.preventDefault(); write(input.value); });
    $$("[data-topic]", host).forEach((b) => (b.onclick = () => write(b.dataset.topic)));
    $$("[data-ch]", host).forEach((b) => (b.onclick = () => { L.ch = b.dataset.ch; redraw(); }));
    $$("[data-run]", host).forEach((b) => (b.onclick = () => { L.run = b.dataset.run; redraw(); }));
    $$("[data-tab]", host).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; L.open = null; redraw(); }));
    $$("[data-open]", host).forEach((b) => (b.onclick = () => { const same = L.open === b.dataset.open && L.from === b.dataset.from; L.open = same ? null : b.dataset.open; L.from = b.dataset.from; redraw(); }));
    $$("[data-close]", host).forEach((b) => (b.onclick = () => { L.open = null; redraw(); }));
    $$("[data-slot]", host).forEach((b) => (b.onclick = async () => {
      L.slot = Number(b.dataset.slot);
      await redraw();
      setTimeout(() => $("#wr-in", host)?.focus({ preventScroll: true }), 60);
    }));
    $$("[data-relay]", host).forEach((b) => (b.onclick = () => { b.disabled = true; ctx.startRelay(b.dataset.relay); }));
    $$("[data-go]", host).forEach((b) => (b.onclick = () => ctx.go(b.dataset.go)));

    // change a line, and it becomes a rule
    const E = D.edit_line, S = L.ed || {}, card = $("#ed-card", host);
    // land the card 16px from the top, or just under the floating menu bar where one covers the page (the 9:16 frame)
    const toCard = () => {
      const c = $("#ed-card", host); if (!c) return;
      const hr = host.getBoundingClientRect(), covered = !host.contains(document.elementFromPoint(hr.left + hr.width / 2, hr.top + 24));
      const off = covered ? parseFloat(getComputedStyle(host).paddingTop) || 16 : 16;
      host.scrollTo({ top: host.scrollTop + c.getBoundingClientRect().top - hr.top - off, behavior: "smooth" });
    };
    $("[data-ed-go]", host)?.addEventListener("click", toCard);
    if (card && E) {
      const here = () => /#content\b/.test(location.hash);
      const edit = async () => { L.ed = { ...S, editing: true, draft: S.draft ?? E.suggested }; await redraw(); const t = $("#ed-in", host); if (t) { t.focus({ preventScroll: true }); t.select(); } };
      const line = $("#ed-line", host);
      if (line) { line.onclick = edit; line.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); edit(); } }; }
      const ta = $("#ed-in", host);
      const save = async () => {
        const old = E.lines[E.edit], neu = (ta?.value || "").replace(/\s+/g, " ").trim();
        if (!neu || neu === old) { ta?.focus(); return; }
        const R = claraRules(ctx), text = E.teach.replace("{old}", old.replace(/[.!]$/, "")).replace("{new}", neu.replace(/[.!]$/, ""));
        const tok = Math.random().toString(36).slice(2);
        L.ed = { approved: S.approved, saved: { old, neu, at: Date.now() }, base: R.total, bookN: R.book + R.live.length, had: R.live.map((l) => l.id), teach: { running: true, text }, tok };
        ta?.blur();
        await redraw();
        try { const r = await ctx.api("/api/office/teach", { text }); if (L.ed?.tok !== tok) return; L.ed.teach = { text, reply: r.reply, lessons: (r.lessons || []).filter(Boolean), done: Date.now() }; }
        catch (err) { if (L.ed?.tok !== tok) return; L.ed.teach = err.live ? { text, live: true } : { text, error: err.message }; }
        if (here()) redraw();
      };
      if (ta) {
        const fit = () => { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`; };
        fit();
        ta.oninput = () => { S.draft = ta.value; fit(); };
        // stopPropagation: the app's own Escape key flies back to the office once the box has gone
        ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); save(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); L.ed = { ...S, editing: false, draft: undefined }; redraw(); } };
      }
      $("#ed-save", host)?.addEventListener("click", save);
      $("#ed-cancel", host)?.addEventListener("click", () => { L.ed = { ...S, editing: false, draft: undefined }; redraw(); });
      $("#ed-ok", host)?.addEventListener("click", () => { L.ed = { ...S, approved: Date.now() }; redraw(); });
      $("#ed-reset", host)?.addEventListener("click", () => { L.ed = {}; redraw(); });
    }
  },

  onEvent(ev) {
    if (ev.demo !== "floor") return false;
    if (ev.type === "act") return ev.page === "content";
    if (ev.type === "log") return ev.line?.agent === "content";
    return ev.type === "relay" || ev.type === "relayPartial";
  },
  leave() { seen = false; },
};
