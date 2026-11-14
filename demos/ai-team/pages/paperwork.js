// Paperwork: Dot's desk (video 7). A photo of any sheet becomes a dashboard you can keep editing.
// The hero is the scanner: the photo with a laser running over it while Dot reads, each row boxed on the photo as it
// streams into the table beside it, then the dashboard. Headline figures come from the one model (ctx.model).
import { esc, money, num, av, chip, head, seg, barChart, hbars, spark, working, empty, foot, dayDate, short, ago, $, $$, wireTips, countUp } from "../ui.js";

const toNum = (v) => { const x = parseFloat(String(v ?? "").replace(/[£,\s]/g, "")); return isNaN(x) ? null : x; };
const fmtMoney = (v) => money(v, Number.isInteger(Math.round(v * 100) / 100) ? 0 : 2);
const when = (off) => (off === 0 ? "Today" : off === -1 ? "Yesterday" : dayDate(off).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
const STATUS = { back: ["Got it back", "green"], fixed: ["Put right in time", "green"], waiting: ["Waiting for Priya", "amber"] };
const pad2 = (n) => String(n).padStart(2, "0");
const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`; };
const ICON = {
  plus: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>`,
  scan: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 5V3.5A1.5 1.5 0 0 1 3.5 2H5M11 2h1.5A1.5 1.5 0 0 1 14 3.5V5M14 11v1.5a1.5 1.5 0 0 1-1.5 1.5H11M5 14H3.5A1.5 1.5 0 0 1 2 12.5V11M2 8h12"/></svg>`,
  photo: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2 4.5h3l1.2-1.5h3.6L11 4.5h3V13H2z"/><circle cx="8" cy="8.5" r="2.4"/></svg>`,
  ask: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2.5 3h11v7.5H7L4 13v-2.5H2.5z"/></svg>`,
  arrow: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`,
  back: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8H3M7 4L3 8l4 4"/></svg>`,
};

// ------------------------------------------------------------------ the dashboard maths (same rules as the floor panel)
const cleanCols = (dash) => (Array.isArray(dash.columns) ? dash.columns.filter((c) => typeof c === "string") : []);
const cleanRows = (dash) => (Array.isArray(dash.rows) ? dash.rows.filter(Array.isArray) : []);
function measures(dash) {
  const cols = cleanCols(dash), rows = cleanRows(dash);
  return (Array.isArray(dash.measures) ? dash.measures : []).filter((m) => m && m.label && m.column && m.agg).slice(0, 4).map((m) => {
    const ci = cols.indexOf(m.column); let v;
    if (ci < 0) v = null;
    else if (m.agg === "sum") v = rows.reduce((a, r) => a + (toNum(r[ci]) || 0), 0);
    else if (m.agg === "count_blank") v = rows.filter((r) => !String(r[ci] ?? "").trim() || /^(no|-|—|out)$/i.test(String(r[ci]).trim())).length;
    else if (m.agg === "count_filled") v = rows.filter((r) => String(r[ci] ?? "").trim()).length;
    else v = rows.length;
    return { label: m.label, n: v, value: v == null ? "—" : m.money ? fmtMoney(v) : num(v, 2) };
  });
}
function chartOf(dash) {
  const c = dash.chart, cols = cleanCols(dash), rows = cleanRows(dash);
  if (!c || !c.label_column || !c.value_column) return null;
  const li = cols.indexOf(c.label_column), vi = cols.indexOf(c.value_column);
  if (li < 0 || vi < 0 || !rows.length) return null;
  let agg = new Map();
  for (const r of rows) { const k = String(r[li] ?? "").trim() || "—"; agg.set(k, (agg.get(k) || 0) + (toNum(r[vi]) || 0)); }
  let isMoney = (dash.measures || []).some((m) => m && m.column === c.value_column && m.money), counting = false;
  if ([...agg.values()].every((v) => !v)) { agg = new Map(); for (const r of rows) { const k = String(r[li] ?? "").trim() || "—"; agg.set(k, (agg.get(k) || 0) + 1); } isMoney = false; counting = true; }
  const fmt = (v) => (isMoney ? fmtMoney(v) : num(v, 2));
  const items = [...agg].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: esc(k), v, tip: `${k}: ${fmt(v)}${counting ? " rows" : ""}` }));
  return { title: c.title || "", html: hbars(items, { fmt }) };
}
// rows that a "to check" line is about: a unique text value from that row appears in the line
function flagged(dash) {
  const out = new Map(), cols = cleanCols(dash), rows = cleanRows(dash), numeric = new Set(dash.numeric_columns || []);
  for (const t of Array.isArray(dash.to_check) ? dash.to_check : []) {
    if (typeof t !== "string") continue;
    const low = t.toLowerCase();
    cols.forEach((c, ci) => {
      if (numeric.has(c)) return;
      const seen = new Map();
      rows.forEach((r) => { const v = String(r[ci] ?? "").trim().toLowerCase(); if (v) seen.set(v, (seen.get(v) || 0) + 1); });
      rows.forEach((r, ri) => { const v = String(r[ci] ?? "").trim().toLowerCase(); if (v.length >= 6 && seen.get(v) === 1 && low.includes(v) && !out.has(ri)) out.set(ri, t); });
    });
  }
  return out;
}
const sumCols = (dash) => { const cols = cleanCols(dash); return new Map((dash.measures || []).filter((m) => m && m.agg === "sum" && cols.includes(m.column)).map((m) => [cols.indexOf(m.column), !!m.money])); };
function sumText(rows, ci, isMoney) { const v = rows.reduce((a, r) => a + (toNum(r[ci]) || 0), 0); return isMoney ? fmtMoney(v) : num(v, 2); }
const byHand = (rows) => Math.max(4, Math.round(rows * 1.1 + 3));
const checks = (dash) => (Array.isArray(dash.to_check) ? dash.to_check.filter((x) => typeof x === "string") : []);

// ------------------------------------------------------------------ every photo Dot has: the two samples plus anything dropped in
function photoList(ctx) {
  const F = ctx.F, P = ctx.data.photos || {};
  const samples = (F.photos || []).map((p) => {
    const d = F.docs?.[p.id];
    return { key: "p:" + p.id, id: p.id, kind: "photo", src: p.url, ar: P[p.id]?.ar || 0.75, title: P[p.id]?.title || p.id, sub: P[p.id]?.kind || "Photo of paperwork", from: P[p.id]?.from || "Office", status: d?.status || "new", dash: d?.dash || null, partial: d?.partial || null, ms: d?.ms, edits: d?.edits || 0, startedAt: d?.startedAt || 0, error: d?.error || "" };
  });
  const ups = (ctx.acts.uploads || []).map((u) => {
    const stale = u.status === "reading" && Date.now() - (u.startedAt || u.at) > 180000;
    return { key: "u:" + u.id, id: u.id, kind: "upload", src: u.url, ar: ctx.local.ar?.[u.url] || 0.75, title: u.name, sub: "Your photo", from: "You", status: stale ? "error" : u.status, dash: u.dash || null, partial: u.partial || null, ms: u.ms, edits: u.edits || 0, startedAt: u.startedAt || u.at, error: stale ? "It didn't finish. Read it again." : u.error || "" };
  });
  return [...samples, ...ups];
}
function current(list, L) {
  return list.find((x) => x.key === L.sel) || list.find((x) => x.status === "reading") || list.filter((x) => x.dash).sort((a, b) => b.startedAt - a.startedAt)[0] || list[0];
}

// ------------------------------------------------------------------ the scanner: where each row sits on a sample photo
const geoOf = (it, D) => (it.kind === "photo" ? D.scan?.[it.id] || null : null);
function lineOf(g, k) {
  const lines = []; for (let i = 0; i < g.n; i++) if (!(g.skip || []).includes(i)) lines.push(i);
  return k < lines.length ? lines[k] : lines[lines.length - 1] + (k - lines.length + 1);
}
const lineY = (g, line) => g.y0 + line * g.pitch;
function boxStyle(g, k) {
  const line = lineOf(g, k), cy = lineY(g, line), dx = (g.dx || 0) * line;
  return `left:${((g.x0 + dx) * 100).toFixed(2)}%;width:${((g.x1 - g.x0) * 100).toFixed(2)}%;top:${((cy - g.h / 2) * 100).toFixed(2)}%;height:${(g.h * 100).toFixed(2)}%;transform:rotate(${g.rot}deg)`;
}
// where the laser sits: just under the last row Dot has read
const laserAt = (g, rowsIn) => Math.min(97, (lineY(g, lineOf(g, Math.max(0, rowsIn - 1))) + g.h / 2 + 0.004) * 100);
const rowText = (r) => (Array.isArray(r) ? r.filter((c) => String(c ?? "").trim()).slice(0, 3).join(" · ") : "");

function scanner(it, D, L) {
  const dash = it.dash || it.partial || {}, rows = cleanRows(dash), g = geoOf(it, D);
  const mode = it.status === "ready" ? "ready" : it.status === "reading" ? "reading" : it.status === "error" ? "error" : "new";
  const tracking = mode === "reading" && g && rows.length > 0;
  const ly = tracking ? laserAt(g, rows.length) : 50;
  const fl = mode === "ready" ? flagged(dash) : new Map();
  const firstReady = mode === "ready" && !L.drawn?.[it.key];
  const boxes = g && (mode === "reading" || mode === "ready") ? rows.map((_, k) => `<i class="sc-bx ${fl.has(k) ? "flag" : ""} ${firstReady ? "in" : ""}" style="${boxStyle(g, k)};animation-delay:${firstReady ? k * 45 : 0}ms" data-bx="${k}"></i>`).join("") : "";
  const st = mode === "reading" ? `<span class="sc-chip live"><i class="ldot busy"></i>Reading <b data-elapsed>${mmss(Date.now() - it.startedAt)}</b></span>`
    : mode === "ready" ? `<span class="sc-chip ok">${ICON.scan}Read in ${Math.round((it.ms || 0) / 1000)}s</span>`
    : mode === "error" ? `<span class="sc-chip bad">Couldn't read it</span>` : `<span class="sc-chip">${ICON.photo}Ready to read</span>`;
  return `<div class="scope s-${mode} ${tracking ? "track" : mode === "reading" || mode === "new" ? "sweep" : ""} ${g ? "geo" : ""}" data-scope style="--ar:${it.ar};--pgpw-ly:${ly}%;--rot:${g ? g.rot : 0}deg">
      <img src="${esc(it.src)}" alt="The photo Dot ${mode === "ready" ? "read" : "is reading"}: ${esc(it.title)}" data-img>
      <i class="sc-tint"></i><i class="sc-wash"></i><i class="sc-grid"></i><i class="sc-lines"></i>
      <div class="sc-boxes" data-boxes>${boxes}</div>
      <div class="sc-laser"><i></i></div>
      <div class="sc-rd" data-rd ${tracking ? "" : "hidden"}>${tracking ? `ROW ${pad2(rows.length)} · ${esc(rowText(rows[rows.length - 1]))}` : ""}</div>
      <span class="sc-c tl"></span><span class="sc-c tr"></span><span class="sc-c bl"></span><span class="sc-c br"></span>
      <div class="sc-hud">${st}<span class="sc-chip num" data-rows ${mode === "reading" || mode === "ready" ? "" : "hidden"}>${pad2(rows.length)} rows</span></div>
      ${mode === "new" || mode === "error" ? `<button class="btn primary sc-go" data-read="${esc(it.key)}">${ICON.scan}${mode === "error" ? "Read it again" : "Read it"}</button>` : ""}
      ${mode === "ready" ? `<button class="btn sm sc-again" data-reread="${esc(it.key)}">${ICON.scan}Read it again</button>` : ""}
    </div>`;
}

// ------------------------------------------------------------------ the panel beside the photo
const stepAt = (dash) => (!Array.isArray(dash.rows) ? 1 : dash.to_check ? 3 : dash.measures || dash.chart || dash.numeric_columns ? 2 : 1);
function stepsHTML(it) {
  const dash = it.dash || it.partial || {}, rows = cleanRows(dash), ready = it.status === "ready", at = stepAt(dash);
  const nCheck = checks(dash).length, nMeas = measures(dash).length;
  return [
    ["Photo", "in"],
    ["Rows", rows.length ? `${rows.length} so far` : "starting"],
    ["Tiles", nMeas ? `${nMeas} set up` : at > 2 || ready ? "set up" : "next"],
    ["Checks", at >= 3 || ready ? `${nCheck} flagged` : "next"],
    ["Ready", ready ? "done" : "next"],
  ].map(([b, em], i) => `<div class="${ready || i < at ? "done" : i === at ? "on" : ""}"><i></i><b>${b}</b><em>${esc(em)}</em></div>`).join("");
}
function theadHTML(dash, ready) {
  const cols = cleanCols(dash), numeric = new Set(dash.numeric_columns || []);
  return cols.length ? `<tr><th class="rn">#</th>${cols.map((c) => `<th class="${numeric.has(c) ? "r" : ""}">${esc(c)}</th>`).join("")}</tr>` : "";
}
function rowHTML(dash, r, ri, { ready = false, flag = "", fresh = false } = {}) {
  const cols = cleanCols(dash), numeric = new Set(dash.numeric_columns || []);
  return `<tr data-ri="${ri}" class="${flag ? "flag" : ""} ${fresh ? "in" : ""}" ${flag ? `data-tip="${esc(flag)}"` : ""}><td class="rn num">${pad2(ri + 1)}</td>${cols.map((c, ci) => `<td ${ready ? `contenteditable="true" spellcheck="false" data-cell="${ri}:${ci}"` : ""} class="${numeric.has(c) ? "r num" : ""}">${esc(r[ci] ?? "")}</td>`).join("")}</tr>`;
}
function sheetHTML(it) {
  const dash = it.dash || it.partial || {}, ready = it.status === "ready", cols = cleanCols(dash), rows = cleanRows(dash);
  const fl = ready ? flagged(dash) : new Map(), sums = sumCols(dash);
  if (!cols.length) return `<div class="tbl" data-tbl><div class="tbl-wait"><span class="shimmer">Rows will appear here as Dot reads them</span></div></div>`;
  return `<div class="tbl" data-tbl><table class="t sheet"><thead data-thead>${theadHTML(dash, ready)}</thead><tbody data-tbody>${rows.map((r, ri) => rowHTML(dash, r, ri, { ready, flag: fl.get(ri) || "" })).join("")}</tbody>
    ${ready && sums.size ? `<tfoot><tr><td class="rn"></td>${cols.map((_, ci) => (sums.has(ci) ? `<td class="r num" data-sum="${ci}">${sumText(rows, ci, sums.get(ci))}</td>` : ci === 0 ? `<td>Total</td>` : "<td></td>")).join("")}</tr></tfoot>` : ""}</table></div>`;
}
function panel(it, L) {
  const dash = it.dash || it.partial || {}, rows = cleanRows(dash);
  if (it.status === "new" || it.status === "error") {
    return `<div class="pn pn-new" data-panel>
      <div class="pn-k">${it.status === "error" ? `<i class="ldot bad"></i>Didn't finish` : `<i class="ldot"></i>Ready to read`}</div>
      <h2>${esc(it.title)}</h2><p class="sum">${esc(it.sub)} · from ${esc(it.from)}</p>
      ${it.status === "error" ? `<div class="note red" style="margin-top:12px">${esc(it.error || "Something went wrong.")}</div>` : ""}
      <ol class="does">
        <li><i>01</i><div><b>Reads every row</b><span>Printed, typed or handwritten</span></div></li>
        <li><i>02</i><div><b>Builds a dashboard</b><span>Totals, a chart, a tidy table</span></div></li>
        <li><i>03</i><div><b>Flags mistakes</b><span>Wrong totals, things still out</span></div></li>
      </ol>
      <div class="ghost" aria-hidden="true"><div class="g-t">${"<i></i>".repeat(4)}</div><div class="g-r">${Array.from({ length: 9 }, (_, i) => `<i style="width:${92 - (i * 37) % 30}%"></i>`).join("")}</div><span>The dashboard builds here as Dot reads</span></div>
      <div class="cta"><button class="btn primary lg" data-read="${esc(it.key)}">${ICON.scan}${it.status === "error" ? "Read it again" : "Read it"}</button><button class="btn lg" data-choose>${ICON.photo}Drop in your own photo</button></div>
      <div class="hint">Takes about 30 seconds. Nothing is sent or paid.</div>
    </div>`;
  }
  if (it.status === "reading") {
    return `<div class="pn pn-reading" data-panel>
      <div class="pn-k"><i class="ldot busy"></i>Reading the photo</div>
      <h2 data-title>${dash.title ? esc(dash.title) : `<span class="shimmer">Working out what this is…</span>`}</h2>
      <p class="sum" data-summary>${dash.summary ? esc(dash.summary) : `${esc(it.sub)} · from ${esc(it.from)}`}</p>
      <div class="prog" data-steps>${stepsHTML(it)}</div>
      <div class="ctr"><div><span>Rows read</span><b class="num" data-n-rows>${rows.length}</b></div><div><span>Columns</span><b class="num" data-n-cols>${cleanCols(dash).length || "–"}</b></div><div><span>By hand</span><b class="num" data-n-hand>${rows.length ? `${byHand(rows.length)}<small>min</small>` : "–"}</b></div></div>
      ${sheetHTML(it)}
    </div>`;
  }
  // ready: the dashboard
  const ms = measures(dash), ch = chartOf(dash), list = checks(dash), view = L.view || "sheet";
  const tabs = seg([["sheet", "The sheet"], ["chart", "Chart"], ["check", `To check${list.length ? ` · ${list.length}` : ""}`]], view, "pv");
  const body = view === "chart" ? `<div class="tbl pad" data-tbl>${ch ? `<h4>${esc(ch.title)}</h4><div data-chart>${ch.html}</div>` : empty("No chart for this one")}</div>`
    : view === "check" ? `<div class="tbl pad" data-tbl>${list.length ? `<ol class="chk">${list.map((x, i) => `<li><i>${i + 1}</i><span>${esc(x)}</span></li>`).join("")}</ol>` : empty("Everything adds up")}</div>`
    : sheetHTML(it);
  return `<div class="pn pn-ready" data-panel>
    <div class="pn-k ok"><i class="ldot good"></i>Dashboard ready<span class="kt">${Math.round((it.ms || 0) / 1000)} s · ${byHand(rows.length)} min by hand${it.edits ? ` · ${it.edits} edit${it.edits > 1 ? "s" : ""} saved` : ""}</span></div>
    <h2>${esc(dash.title || it.title)}</h2>${dash.summary ? `<p class="sum">${esc(dash.summary)}</p>` : ""}
    ${ms.length ? `<div class="mt n${ms.length}">${ms.map((m, i) => `<div><b class="num" data-m="${i}" ${typeof m.n === "number" && !L.counted?.[it.key] ? `data-count="${m.n}"` : ""}>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join("")}</div>` : ""}
    ${list.length && view !== "check" ? `<button class="alert1" data-pv="check"><i class="ldot need"></i><b>${list.length} thing${list.length > 1 ? "s" : ""} to check</b><span>${esc(list[0])}</span></button>` : ""}
    <div class="pn-tabs">${tabs}<span class="hint">${view === "sheet" ? "Click any cell to change it" : ""}</span></div>
    ${body}
    <div class="pn-act"><button class="btn sm" data-addrow ${view !== "sheet" ? "hidden" : ""}>${ICON.plus}Add a row</button><button class="btn sm" data-csv>Save as a spreadsheet</button></div>
  </div>`;
}

// the photo strip: samples, anything dropped in, and the drop tile
function picks(list, cur, L) {
  return `<div class="picks">${list.map((it) => `<button class="pk ${it.key === cur?.key ? "sel" : ""}" data-pick="${esc(it.key)}" aria-label="Show ${esc(it.title)}">
      <img src="${esc(it.src)}" alt="" loading="lazy"><span><b>${esc(it.title)}</b><em>${it.status === "ready" ? `${cleanRows(it.dash).length} rows` : it.status === "reading" ? "Reading…" : it.status === "error" ? "Problem" : "Not read yet"}</em></span>
      <i class="ldot ${it.status === "reading" ? "busy" : it.status === "ready" ? "good" : it.status === "error" ? "bad" : ""}"></i></button>`).join("")}
    ${L.uploading ? `<div class="pk drop"><span class="shimmer">Sending to Dot…</span></div>` : ""}
    <label class="pk drop" data-drop><input type="file" accept="image/*" hidden data-file>${ICON.plus}<span><b>Your photo</b><em>drop or click</em></span></label></div>`;
}

// ------------------------------------------------------------------ dropping in your own photo
async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Couldn't open that photo. Try a JPG or PNG.")); i.src = url; });
    const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); // paper-white behind transparent PNGs, never shown
    return c.toDataURL("image/jpeg", 0.86);
  } finally { URL.revokeObjectURL(url); }
}
async function send(file, ctx) {
  if (!file) return;
  if (window.AI_TEAM_STATIC) { ctx.live("upload"); return; } // site demo: the photo is never opened, read or sent
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|heic)$/i.test(file.name)) { ctx.flash("Dot reads photos. Try a JPG or PNG."); return; }
  ctx.local.uploading = file.name; ctx.redraw();
  try {
    const r = await ctx.act("upload", { name: file.name, dataUrl: await shrink(file) });
    ctx.local.sel = "u:" + r.id; ctx.local.view = "sheet"; ctx.local.toHero = true;
  } catch (err) { ctx.flash(err.message); }
  ctx.local.uploading = null; ctx.redraw();
}

// ------------------------------------------------------------------ live: patch the hero in place while Dot reads
// (a full redraw every few hundred ms would restart the laser and redraw every box)
let HOST = null, SIG = "", TICK = null;
function patch(it, ctx) {
  const root = HOST && $(".pg-paperwork", HOST); if (!root) return false;
  const sc = $("[data-scope]", root), pn = $("[data-panel]", root); if (!sc || !pn) return false;
  const dash = it.dash || it.partial || {}, rows = cleanRows(dash), cols = cleanCols(dash), g = geoOf(it, ctx.data);
  // scanner: boxes for new rows, laser onto the next row, the readout
  const bx = $("[data-boxes]", sc), have = bx ? bx.children.length : 0;
  if (g && bx && rows.length > have) bx.insertAdjacentHTML("beforeend", rows.slice(have).map((_, j) => `<i class="sc-bx in" style="${boxStyle(g, have + j)}" data-bx="${have + j}"></i>`).join(""));
  if (rows.length) {
    if (g) { sc.classList.remove("sweep"); sc.classList.add("track"); sc.style.setProperty("--pgpw-ly", laserAt(g, rows.length) + "%"); }
    const rd = $("[data-rd]", sc);
    if (rd && g) { rd.hidden = false; rd.textContent = `ROW ${pad2(rows.length)} · ${rowText(rows[rows.length - 1])}`; }
    if (!g && rows.length > (sc._n || 0)) { // a photo we don't know the layout of: flash each row as it's captured where the laser is
      const y = Math.min(80, parseFloat(getComputedStyle(sc).getPropertyValue("--pgpw-ly")) || 50);
      const f = document.createElement("div"); f.className = "sc-fl"; f.style.top = y + "%"; f.textContent = `+ ROW ${pad2(rows.length)} · ${rowText(rows[rows.length - 1])}`;
      sc.appendChild(f); setTimeout(() => f.remove(), 1500);
    }
    sc._n = rows.length;
  }
  const rc = $("[data-rows]", sc); if (rc) { rc.hidden = false; rc.textContent = `${pad2(rows.length)} rows`; }
  // panel: title, steps, counters, the table
  const t = $("[data-title]", pn); if (t && dash.title && t.textContent !== dash.title) t.textContent = dash.title;
  const s = $("[data-summary]", pn); if (s && dash.summary && s.textContent !== dash.summary) s.textContent = dash.summary;
  const st = $("[data-steps]", pn); if (st) st.innerHTML = stepsHTML(it);
  const nr = $("[data-n-rows]", pn); if (nr) nr.textContent = rows.length;
  const nc = $("[data-n-cols]", pn); if (nc) nc.textContent = cols.length || "–";
  const nh = $("[data-n-hand]", pn); if (nh && rows.length) nh.innerHTML = `${byHand(rows.length)}<small>min</small>`;
  let tbl = $("[data-tbl]", pn);
  if (cols.length && (!$("[data-tbody]", tbl) || $("[data-thead] th", tbl) && $$("[data-thead] th", tbl).length !== cols.length + 1)) { tbl.outerHTML = sheetHTML(it); tbl = $("[data-tbl]", pn); }
  const tb = $("[data-tbody]", tbl);
  if (tb) {
    const n = tb.children.length;
    if (n && rows[n - 1]) tb.children[n - 1].outerHTML = rowHTML(dash, rows[n - 1], n - 1); // the last row may have grown
    if (rows.length > n) { tb.insertAdjacentHTML("beforeend", rows.slice(n).map((r, j) => rowHTML(dash, r, n + j, { fresh: true })).join("")); tbl.scrollTop = tbl.scrollHeight; }
  }
  return true;
}

// ------------------------------------------------------------------ Ask Dot: any question about the paperwork, answered with the paper behind it
// Live, Dot (a Claude call over her filed documents, lib/floor-actions/paperwork.mjs) says which documents the answer rests
// on and the page adds up their amounts itself, so the total always matches the paper. For a ready-made question the live
// answer has to rest on the same documents as the answer worked out from the data, or that one shows instead; and if the
// live answer doesn't come back at all, the worked-out answer shows rather than an error.
const ASK_MIN = 1400, ASK_MAX = 25000;
const TAG = { invoice: "INV", delivery: "DN", receipt: "RCPT", parking: "P&D", hire: "HIRE", credit: "CR" };
const PAPER = { invoice: "Invoice", delivery: "Delivery note", receipt: "Receipt", hire: "Hire agreement", credit: "Credit note" };
const isoD = (iso) => new Date(iso + "T12:00:00");
const dShort = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const dDay = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const noon = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
const gbp2 = (v) => (v < 0 ? "−" : "") + money(Math.abs(v), 2);
const n2 = (v) => Math.abs(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STOP = new Set("what which when where have has had the and for our ours from with that this there their them they much many does did done spend spent spending cost costs any anything about been were your you just show tell give".split(" "));
let ASKT = null, KEYS = null, LCTX = null;

// every filed document: the filed paperwork plus each row of the hire log photo (same as the action's filedDocs)
function askModel(ctx) {
  const D = ctx.data, A = D.ask || {}, list = (A.filed || []).map((d) => ({ ...d })), H = A.hire_log;
  for (const r of H?.rows || []) list.push({ id: r.id, kind: "Hire log row", photo: H.photo, row: r.row, supplier: r.supplier, item: r.item, site: r.site, what: `${r.item}, ${r.site}`, date: r.out, days: r.days, rate: r.rate, amount: r.total, back: r.back || "", note: r.note || "", from: H.from, ref: H.title, no: "" });
  const byId = new Map(list.map((d) => [d.id, d]));
  const photos = Object.fromEntries((ctx.F.photos || []).map((p) => [p.id, { url: p.url, ar: D.photos?.[p.id]?.ar || 0.75 }]));
  const M = { list, byId, photos, jobs: A.jobs || {}, questions: A.questions || [], scan: D.scan || {}, hireTitle: H?.title || "Hire log" };
  // the cabinet: every piece of paper once (the hire log photo once for all its rows)
  const seen = new Set(); M.papers = [];
  for (const d of list) {
    if (d.photo) { if (seen.has(d.photo)) { M.papers.find((t) => t.photo === d.photo).ids.push(d.id); continue; } seen.add(d.photo); M.papers.push({ key: d.id, d, photo: d.photo, ids: [d.id] }); }
    else for (const t of papersOf(d, M, false)) M.papers.push({ ...t, ids: [d.id, d.backs].filter(Boolean) });
  }
  return M;
}
// the pieces of paper behind one document: itself (or each of its receipts) plus anything that backs it up
function papersOf(doc, M, withBacking = true) {
  const out = [], add = (d) => { if (d.photo) out.push({ key: d.id, d, photo: d.photo }); else if (d.pages) d.pages.forEach((_, i) => out.push({ key: `${d.id}#${i}`, d, page: i })); else out.push({ key: d.id, d }); };
  add(doc); if (withBacking) M.list.filter((x) => x.backs === doc.id).forEach(add);
  return out;
}
function paperAt(key, M) { const [id, pg] = String(key).split("#"), d = M.byId.get(id); return !d ? null : pg != null ? { key, d, page: +pg } : d.photo ? { key, d, photo: d.photo } : { key, d }; }
const fold = (ids, M) => [...new Set((ids || []).filter((x) => typeof x === "string" && M.byId.has(x)).map((x) => M.byId.get(x).backs || x))];
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const docTime = (d) => (d.date ? isoD(d.date) : dayDate(d.pages ? d.pages[0].day_offset : d.day_offset)).getTime();

function thumb(t, M, cls = "", tag = "button") {
  const d = t.d, label = t.page != null ? `${d.supplier}: receipt ${t.page + 1} of ${d.pages.length}` : t.photo ? `${d.ref} (photo)` : `${d.supplier}: ${d.ref}`;
  const attrs = tag === "button" ? `data-doc="${esc(t.key)}" aria-label="Open ${esc(label)}" data-tip="${esc(label)}"` : `aria-hidden="true"`;
  if (t.photo) return `<${tag} class="dt ph ${cls}" ${attrs} ${t.ids ? `data-ids="${esc(t.ids.join(" "))}"` : ""}><img src="${esc(M.photos[t.photo]?.url || "")}" alt="" loading="lazy"></${tag}>`;
  const k = t.page != null ? "parking" : d.paper || "invoice";
  return `<${tag} class="dt k-${k} ${d.readable === false ? "smudged" : ""} ${cls}" ${attrs} ${t.ids ? `data-ids="${esc(t.ids.join(" "))}"` : ""}><i></i><em>${TAG[k] || "DOC"}</em></${tag}>`;
}

// one line of an answer: what, who from, when, how much, and the paper behind it
function lineFor(d, M) {
  const backing = M.list.filter((x) => x.backs === d.id);
  let date, meta = d.ref, note = "", tone = "";
  if (d.date) {
    const out = isoD(d.date), due = new Date(out); due.setDate(due.getDate() + d.days);
    date = `Out ${dShort(out)}`; meta = `${d.days} day${d.days > 1 ? "s" : ""} at ${money(d.rate, 2)}`;
    if (d.back) note = `Back ${dShort(isoD(d.back))}`;
    else { const over = Math.round((noon() - due) / 864e5); note = over > 0 ? `Due back ${dShort(due)} · ${over} day${over > 1 ? "s" : ""} over` : `Due back ${dShort(due)}, still out`; tone = over > 0 ? "red" : ""; }
  } else if (d.pages) {
    const a = dayDate(d.pages[0].day_offset), b = dayDate(d.pages.at(-1).day_offset);
    date = a.getMonth() === b.getMonth() ? `${a.getDate()}–${dShort(b)}` : `${dShort(a)}–${dShort(b)}`; meta = `${d.pages.length} receipts`;
  } else date = when(d.day_offset);
  if (backing.length) meta += ` + ${backing.map((b) => `${b.kind.toLowerCase()}${b.signed ? ` signed by ${b.signed}` : ""}`).join(", ")}`;
  return { d, ps: papersOf(d, M), date, meta, note, tone, amount: typeof d.amount === "number" ? d.amount : null };
}

// a question nobody prepared, answered from the data when the live answer doesn't come back
function guess(q, M) {
  const s = q.toLowerCase(), pick = (id) => M.questions.find((x) => x.id === id);
  if (/clifton|caledonia|calloway|bathroom/.test(s)) return pick("clifton");
  if (/hire|hired|still out|generator|mixer/.test(s)) return pick("hire");
  if (/avonmere/.test(s)) return pick("avonmere");
  if (/\bread\b|smudg|blur|couldn|can't|cannot/.test(s)) return pick("unread");
  const words = s.split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));
  const hits = words.length ? M.list.filter((d) => !d.backs && words.some((w) => `${d.supplier} ${d.what} ${d.ref} ${d.kind} ${M.jobs[d.job]?.name || ""}`.toLowerCase().includes(w))) : [];
  if (hits.length) {
    const sums = hits.every((d) => typeof d.amount === "number" || d.readable === false);
    return { title: "What I've got on file", used: hits.map((d) => d.id), unread: hits.filter((d) => d.readable === false).map((d) => d.id), add_up: sums, big_label: sums ? "on these documents" : "documents that match", answer: "Here's the paperwork I've filed that matches your question." };
  }
  return { title: "Not in the paperwork", used: [], unread: [], add_up: false, big_label: "", answer: "I can't find that in the paperwork I've filed, so I'll ask Priya rather than guess." };
}

// where the question has got to; settles looking -> live | data
function askNow(ctx, M) {
  const A = ctx.local.ask; if (!A) return null;
  const run = A.id ? (ctx.acts.asks || []).find((r) => r.id === A.id) : null;
  const prep = M.questions.find((x) => x.id === A.qid), age = Date.now() - A.t0;
  if (A.mode === "looking" && age >= ASK_MIN) {
    if (run?.state === "done" && run.result) {
      const live = fold(run.result.used, M).filter((x) => !run.result.unread.includes(x));
      A.mode = !prep || sameSet(live, fold(prep.used, M)) ? "live" : "data"; A.ms = run.ms;
    } else if (A.failed || run?.state === "error" || age > ASK_MAX) A.mode = "data";
  }
  if (A.mode === "looking") return { A, run, looking: true };
  const r = A.mode === "live" ? run?.result : null;
  const src = r ? { title: r.title, answer: r.answer, used: r.used, unread: [...new Set([...r.unread, ...(prep?.unread || [])])], add_up: r.add_up, big_label: r.big_label } : prep || guess(A.q, M);
  const unread = fold(src.unread, M).filter((id) => M.byId.get(id).readable === false);
  return { A, run, ans: { ...src, used: fold(src.used, M).filter((x) => !unread.includes(x)), unread, live: !!r, ms: A.ms } };
}

function urCard(M) {
  const u = M.list.find((d) => d.readable === false && d.asked), job = u && M.jobs[u.job];
  return !u ? "" : `<div class="ur" role="button" tabindex="0" data-doc="${esc(u.id)}" data-tip="Open the receipt">
      <span class="ur-k"><i class="ldot need"></i>Couldn't read it, so she asked</span>
      <span class="ur-b">${thumb({ key: u.id, d: u }, M, "", "span")}<span><b>${esc(u.supplier)} receipt</b><em>${job ? `${esc(job.name)} · ` : ""}${esc(when(u.day_offset))} · total smudged</em></span></span>
      <q>${esc(u.asked.text)}</q>
      <span class="ur-f"><span>Sent to ${esc(u.asked.who)} ${u.asked.mins_ago} min ago</span>${chip(`Waiting for ${u.asked.who}`, "amber")}</span>
    </div>`;
}
function askLeft(M, L) {
  const A = L.ask;
  return `<div class="ak-l">
    <div class="ak-k">${av("paperwork")}Ask Dot</div>
    <h2>Ask it anything about your paperwork</h2>
    <p class="ak-lede">Dot answers from the receipts, delivery notes and invoices she's read, with the paper behind every figure.</p>
    <form class="ask inline ak-f" data-askf autocomplete="off">${ICON.ask}<input data-askin placeholder="Ask anything…" value="${esc(L.askText || "")}" aria-label="Ask Dot a question"><button>Ask</button></form>
    <div class="ak-qs">${M.questions.map((q, i) => `<button class="ak-q ${i === 0 ? "first" : ""} ${A && A.qid === q.id ? "sel" : ""}" data-askq="${esc(q.id)}"><span>${esc(q.q)}</span>${ICON.arrow}</button>`).join("")}</div>
  </div>`;
}

function idleHTML(M) {
  return `<div class="an idle" data-ans>
    <div class="an-k"><i class="ldot"></i>Dot's filed paperwork<span>tap one to open it</span></div>
    <div class="cab">${M.papers.map((t) => thumb(t, M)).join("")}</div>
    <p class="an-hint">${ICON.arrow}<span>Pick a question. Dot looks through what she's filed and shows you the paper behind the answer.</span></p>
    ${urCard(M)}
  </div>`;
}
function lookingHTML(res, M) {
  const { A, run } = res, p = run?.partial || {}, hits = new Set(fold(Array.isArray(p.used) ? p.used : [], M));
  return `<div class="an look" data-ans data-look>
    <div class="an-k"><i class="ldot busy"></i>Looking through the paperwork<span class="num" data-aclock>${mmss(Date.now() - A.t0)}</span></div>
    <h4>${esc(A.q)}</h4>
    <div class="cab" data-cab>${M.papers.map((t) => thumb(t, M, t.ids.some((id) => hits.has(id)) ? "hit" : "")).join("")}<i class="cab-l"></i></div>
    <p class="an-say">${av("paperwork")}<span data-astream>${p.answer ? esc(p.answer) : `<span class="shimmer">Finding the paper behind it…</span>`}<i class="caret"></i></span></p>
  </div>`;
}
function answerHTML(res, M) {
  const { A, ans } = res, fresh = !A.drawn;
  const lines = ans.used.map((id) => lineFor(M.byId.get(id), M));
  lines.sort(ans.add_up ? (a, b) => (b.amount ?? 0) - (a.amount ?? 0) : (a, b) => docTime(a.d) - docTime(b.d));
  const unread = ans.unread.map((id) => M.byId.get(id));
  const papers = lines.reduce((n, l) => n + l.ps.length, 0) + unread.length;
  const sums = lines.length && lines.every((l) => l.amount != null), total = Math.round(lines.reduce((a, l) => a + (l.amount || 0), 0) * 100) / 100;
  const jobs = new Set(lines.map((l) => l.d.job)), job = lines.length && jobs.size === 1 ? M.jobs[[...jobs][0]] : null;
  const showBig = ans.add_up ? sums : lines.length || unread.length;
  const big = ans.add_up ? gbp2(total) : String(lines.length || unread.length);
  const work = sums && lines.length > 1 ? `${lines.map((l, i) => `${i ? (l.amount < 0 ? "− " : "+ ") : ""}${n2(l.amount)}`).join(" ")} = ${gbp2(total)}${ans.add_up ? "" : " booked"}` : "";
  const unreadHTML = (d) => `<div class="al ur2 ${fresh ? "in" : ""}" style="--i:${lines.length}">
      <div class="th">${thumb({ key: d.id, d }, M)}</div>
      <div class="al-m"><span class="ur2-h"><b>${ans.add_up && showBig ? "Not in the total yet" : "Couldn't read it"}</b>${chip(`Waiting for ${d.asked.who}`, "amber")}</span><span>${esc(d.supplier.split(" ")[0])} ${esc(d.ref.replace(/\s*[\d-]+$/, "").toLowerCase())}, ${esc(when(d.day_offset).toLowerCase())}. The total's smudged: is it ${d.could_be.map((v) => `£${esc(v)}`).join(" or ")}?${lines.length ? ` Dot asked ${esc(d.asked.who)} instead of guessing.` : ""}</span>
        ${lines.length ? "" : `<q>${esc(d.asked.text)}</q><em class="ur2-f">Sent to ${esc(d.asked.who)} ${d.asked.mins_ago} min ago</em>`}</div></div>`;
  return `<div class="an done" data-ans>
    <div class="an-k"><i class="ldot good"></i>${ans.live ? `Answered live${ans.ms ? ` in ${(ans.ms / 1000).toFixed(1)} s` : ""}` : "From the filed paperwork"}<span>${papers ? `${papers} document${papers === 1 ? "" : "s"}` : ""}</span></div>
    <h4>${esc(ans.title)}</h4>${job ? `<p class="an-sub">${esc(job.customer)} · ${esc(job.address.split(",")[0])} · job ${esc(job.ref)}</p>` : ""}
    ${showBig ? `<div class="an-big"><b class="num" ${fresh ? `data-count="${ans.add_up ? total : big}"` : ""}>${esc(big)}</b><span>${esc(ans.big_label)}</span></div>` : ""}
    <p class="an-say">${av("paperwork")}<span>${esc(ans.answer)}</span></p>
    ${lines.length ? `<div class="al-list">${lines.map((l, i) => `<div class="al ${fresh ? "in" : ""}" style="--i:${i}">
      <div class="th n${Math.min(l.ps.length, 5)}">${l.ps.map((t) => thumb(t, M)).join("")}</div>
      <div class="al-m" data-tip="${esc(`${l.d.what} · ${l.meta}`)}"><b>${esc(l.d.supplier)}</b><span>${esc(l.d.what)}</span>${l.note ? `<i class="nt ${l.tone}">${esc(l.note)}</i>` : ""}</div>
      <div class="al-v"><b class="num ${l.amount < 0 ? "crd" : ""}">${l.amount == null ? "–" : esc(gbp2(l.amount))}</b><em>${esc(l.date)}</em></div></div>`).join("")}</div>` : ""}
    ${work ? working(work) : ""}
    ${unread.map(unreadHTML).join("")}
  </div>`;
}

// the document itself, opened
function paperHTML(t, M) {
  const d = t.d, job = M.jobs[d.job], corners = `<span class="sc-c tl"></span><span class="sc-c tr"></span><span class="sc-c bl"></span><span class="sc-c br"></span>`;
  if (t.page != null) {
    const p = d.pages[t.page];
    return `<div class="paper k-parking">${corners}<div class="p-h c"><b>Pay &amp; display</b><small>Clifton Village</small></div>
      <div class="p-r"><span>Date</span><b>${esc(dDay(dayDate(p.day_offset)))}</b></div><div class="p-r"><span>In</span><b>${esc(p.in)}</b></div><div class="p-r"><span>Out</span><b>${esc(p.out)}</b></div><div class="p-r"><span>Tariff</span><b>All day</b></div>
      <div class="p-tot box"><span>Paid</span><b>${esc(money(p.amount, 2))}</b></div><div class="p-f">Receipt ${t.page + 1} of ${d.pages.length} · display in the windscreen</div></div>`;
  }
  const k = d.paper || "invoice", priced = k !== "delivery", smudged = d.readable === false;
  const rows = (d.lines || []).map((l) => `<tr><td>${esc(l[0])}</td><td class="r">${esc(l[1])}</td>${priced ? `<td class="r">${l[2] === "?" ? `<span class="smg">00.00</span>` : esc(l[2])}</td>` : ""}</tr>`).join("");
  const total = smudged ? `<div class="p-tot box warn"><span>Total</span><b>£${esc(d.total_as_read).replace("?", `<span class="smg">2</span>`)}</b><em>can't read</em></div>`
    : priced ? `<div class="p-tot box"><span>${k === "credit" ? "Credit" : "Total"}</span><b>${esc(gbp2(d.amount))}</b></div>` : "";
  return `<div class="paper k-${k}">${corners}
    <div class="p-h"><b>${esc(d.supplier)}</b><span>${esc(PAPER[k] || d.kind)}<small>${esc(d.no || "")}</small></span></div>
    <div class="p-m"><span>To Kingpost Group Ltd</span><span>${esc(dDay(dayDate(d.day_offset)))}</span></div>
    ${job ? `<div class="p-m"><span>Site: ${esc(job.address)}</span></div>` : ""}
    ${d.returned_day_offset != null ? `<div class="p-m"><span>Back in: ${esc(dDay(dayDate(d.returned_day_offset)))}</span></div>` : ""}
    <table><thead><tr><th>Item</th><th class="r">Qty</th>${priced ? `<th class="r">£</th>` : ""}</tr></thead><tbody>${rows}</tbody></table>
    ${total}
    ${d.signed ? `<div class="p-s"><span>Received by</span><i>${esc(d.signed)}</i></div>` : ""}
    ${smudged ? `<i class="p-smudge"></i>` : ""}
  </div>`;
}
function photoHTML(t, M) {
  const d = t.d, P = M.photos[t.photo] || {}, g = M.scan[t.photo], row = d.row != null && g;
  const over = row && !d.back && Math.round((noon() - isoD(d.date)) / 864e5) > d.days;
  const cy = row ? (lineY(g, lineOf(g, d.row)) * 100).toFixed(1) : 50, cx = row ? (((g.x0 + g.x1) / 2) * 100).toFixed(1) : 50;
  return `<div class="scope s-ready dv-ph ${row ? "zoom" : ""}" style="--ar:${P.ar || 0.75};--zx:${cx}%;--zy:${cy}%">
    <div class="dv-z"><img src="${esc(P.url || "")}" alt="${esc(d.ref)}, the photo Dot read"><i class="sc-tint"></i>${row ? `<div class="sc-boxes"><i class="sc-bx ${over ? "flag" : ""}" style="${boxStyle(g, d.row)}"></i></div>` : ""}</div>
    <span class="sc-c tl"></span><span class="sc-c tr"></span><span class="sc-c bl"></span><span class="sc-c br"></span></div>`;
}
function infoHTML(t, M) {
  const d = t.d, job = M.jobs[d.job], p = t.page != null ? d.pages[t.page] : null, kv = [];
  if (d.date) {
    const out = isoD(d.date), due = new Date(out); due.setDate(due.getDate() + d.days);
    kv.push(["Out", dDay(out)], [d.back ? "Back" : "Due back", dDay(d.back ? isoD(d.back) : due)], ["Booked", money(d.amount, 2)]);
  } else {
    kv.push(["Date", dDay(dayDate(p ? p.day_offset : d.day_offset))], ["Sent in by", d.from]);
    if (job && p) kv.push(["Job", job.name]);
    if (p || typeof d.amount === "number" || d.readable === false) kv.push(["Amount", smudgedOr(d, p)]);
  }
  const lines = (d.lines || []).filter((l) => l[2] && l[2] !== "?");
  const read = p ? `${d.pages.map((x) => n2(x.amount)).join(" + ")} = ${gbp2(d.amount)} for all ${d.pages.length} receipts`
    : d.date ? `Row ${d.row + 1} on the log: ${d.days} day${d.days > 1 ? "s" : ""} × ${money(d.rate, 2)} = ${money(d.amount, 2)}${d.note ? `. ${d.note}` : ""}`
    : d.photo ? d.what
    : d.backs ? `Matched line by line to ${M.byId.get(d.backs)?.ref || "the invoice"}`
    : lines.length > 1 ? `${lines.map((l) => l[2].replace(/^-/, "− ")).join(" + ").replace(/\+ − /g, "− ")} = ${gbp2(d.amount)}` : "";
  const late = d.date && !d.back ? Math.round((noon() - isoD(d.date)) / 864e5) - d.days : 0;
  return `<div class="pn-k">${esc(p ? "Parking receipt" : d.kind)}</div><h4>${esc(d.supplier)}</h4><p class="dv-ref">${esc(p ? `Receipt ${t.page + 1} of ${d.pages.length}` : d.date ? `${d.item} · ${d.site}` : d.ref)}</p>
    <dl class="dv-kv">${kv.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    ${late > 0 ? `<div class="note red" style="margin-top:10px">Still out, ${late} day${late > 1 ? "s" : ""} after it was due back. It's ${money(d.rate, 0)} a day on the log.</div>` : ""}
    ${d.readable === false ? `<div class="ask-q"><span class="ur-k"><i class="ldot need"></i>Couldn't read it, so Dot asked</span><q>${esc(d.asked.text)}</q><span class="ur-f"><span>Sent to ${esc(d.asked.who)} ${d.asked.mins_ago} min ago</span>${chip(`Waiting for ${d.asked.who}`, "amber")}</span></div>`
      : d.note && !d.date ? `<div class="note amber" style="margin-top:12px">${esc(d.note)}</div>${read ? working(read) : ""}` : read ? working(read) : ""}`;
}
const smudgedOr = (d, p) => (d.readable === false ? "Can't read it" : p ? money(p.amount, 2) : typeof d.amount === "number" ? (d.amount ? gbp2(d.amount) : "No prices on it") : "–");
function viewerHTML(L, M) {
  const t = paperAt(L.dv.key, M); if (!t) return "";
  const list = L.dv.list || [L.dv.key], i = list.indexOf(L.dv.key), n = list.length;
  return `<div class="dv" data-ans data-dv>
    <div class="dv-bar"><button class="btn sm" data-dvback>${ICON.back}${L.ask && L.ask.mode !== "looking" ? "Back to the answer" : "Back"}</button>${n > 1 ? `<span class="num">${i + 1} of ${n}</span><button class="btn sm" data-dvstep="-1" aria-label="Previous document">‹</button><button class="btn sm" data-dvstep="1" aria-label="Next document">›</button>` : ""}</div>
    <div class="dv-b"><div class="dv-doc">${t.photo ? photoHTML(t, M) : paperHTML(t, M)}</div><div class="dv-i">${infoHTML(t, M)}</div></div>
  </div>`;
}

function askRight(ctx, M) {
  const L = ctx.local;
  if (L.dv && paperAt(L.dv.key, M)) return viewerHTML(L, M);
  const res = askNow(ctx, M);
  return !res ? idleHTML(M) : res.looking ? lookingHTML(res, M) : answerHTML(res, M);
}
function askCard(ctx, M) { return `<section class="card ak ${ctx.local.dv ? "viewing" : ""}" id="pgpw-ask" data-askcard>${askLeft(M, ctx.local)}<div class="ak-r" data-askr>${askRight(ctx, M)}</div></section>`; }

// redraw just the card (or just its right side) without touching the hero
function askDraw(ctx, { left = true, scroll = false } = {}) {
  LCTX = ctx;
  const card = HOST && $("[data-askcard]", HOST); if (!card) return ctx.redraw();
  const M = askModel(ctx), L = ctx.local;
  if (left) card.outerHTML = askCard(ctx, M); else $("[data-askr]", card).innerHTML = askRight(ctx, M);
  askWire(ctx, M);
  if (scroll) askScroll();
}
function askScroll(sel = "[data-askr]") {
  const el = HOST && $(sel, HOST); if (!el) return;
  const p = HOST.getBoundingClientRect(), r = el.getBoundingClientRect(), top = HOST.clientHeight > HOST.clientWidth * 1.2 ? 84 : 10;
  if (r.top >= p.top + top - 4 && r.top <= p.top + p.height * 0.4) return;
  HOST.scrollTo({ top: HOST.scrollTop + r.top - p.top - top, behavior: "smooth" });
}
function askWire(ctx, M) {
  const card = $("[data-askcard]", HOST); if (!card) return;
  const L = ctx.local, res = L.ask && !L.dv ? askNow(ctx, M) : null;
  card.classList.toggle("viewing", !!(L.dv && $("[data-dv]", card)));
  // the answer: count the total up the first time it shows
  const ans = $(".an.done", card);
  if (ans && L.ask && !L.ask.drawn) { L.ask.drawn = true; L.ask.shownAt = Date.now(); countUp(ans); }
  $$("[data-askq]", card).forEach((b) => (b.onclick = () => { const q = M.questions.find((x) => x.id === b.dataset.askq); if (q) askStart(ctx, q.q, q.id); }));
  const f = $("[data-askf]", card), inp = $("[data-askin]", card);
  inp.oninput = () => (L.askText = inp.value);
  f.onsubmit = (e) => { e.preventDefault(); inp.blur(); askStart(ctx, inp.value, ""); };
  const open = (key, scope) => {
    const keys = scope ? $$("[data-doc]", scope).map((x) => x.dataset.doc) : [key];
    L.dv = { key, list: [...new Set(keys)] }; askDraw(ctx, { left: false }); askScroll();
  };
  $$("[data-doc]", card).forEach((el) => {
    const scope = el.closest(".ur") ? null : el.closest("[data-ans]");
    el.onclick = (e) => { e.stopPropagation(); open(el.dataset.doc, scope); };
    if (el.getAttribute("role") === "button") el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el.dataset.doc, null); } };
  });
  const back = $("[data-dvback]", card); if (back) back.onclick = () => { L.dv = null; askDraw(ctx, { left: false }); };
  $$("[data-dvstep]", card).forEach((b) => (b.onclick = () => askStep(ctx, +b.dataset.dvstep)));
  wireTips(HOST);
  // keep an eye on a question that's still being looked into
  clearInterval(ASKT); ASKT = null;
  if (res?.looking) ASKT = setInterval(() => askTick(), 250);
}
function askStep(ctx, k) {
  const L = ctx.local; if (!L.dv) return;
  const list = L.dv.list || [L.dv.key], i = list.indexOf(L.dv.key);
  L.dv.key = list[(i + k + list.length) % list.length]; askDraw(ctx, { left: false });
}
// while Dot looks: the clock, the documents she's found, her answer as she writes it; then the answer
function askTick() {
  const ctx = LCTX, card = ctx && HOST && $("[data-askcard]", HOST);
  if (!card || !ctx.local.ask) { clearInterval(ASKT); ASKT = null; return; }
  const M = askModel(ctx), res = askNow(ctx, M), look = $("[data-look]", card);
  if (!res?.looking || !look) { clearInterval(ASKT); ASKT = null; if (!ctx.local.dv) askDraw(ctx, { left: false }); return; }
  const p = res.run?.partial || {}, hits = new Set(fold(Array.isArray(p.used) ? p.used : [], M));
  const clock = $("[data-aclock]", look); if (clock) clock.textContent = mmss(Date.now() - res.A.t0);
  $$("[data-ids]", look).forEach((el) => el.classList.toggle("hit", el.dataset.ids.split(" ").some((id) => hits.has(id))));
  const st = $("[data-astream]", look); if (st && p.answer && st.dataset.t !== p.answer) { st.dataset.t = p.answer; st.innerHTML = `${esc(p.answer)}<i class="caret"></i>`; }
}
async function askStart(ctx, q, qid) {
  q = String(q || "").replace(/\s+/g, " ").trim(); if (!q) { ctx.flash("Type a question for Dot first"); return; }
  const L = ctx.local;
  if (window.AI_TEAM_STATIC) { // site demo
    if (!qid) { L.askText = q; ctx.live("askdot"); return; }
    L.dv = null; L.askText = ""; L.ask = { q, qid, t0: Date.now(), id: null, mode: "data", failed: true, drawn: false };
    askDraw(ctx, { scroll: true }); return;
  }
  L.dv = null; if (qid) L.askText = "";
  const A = (L.ask = { q, qid, t0: Date.now(), id: null, mode: "looking", failed: false, drawn: false });
  askDraw(ctx, { scroll: true });
  try { const r = await ctx.act("ask", { q, qid }); if (L.ask === A) A.id = r.id; }
  catch { if (L.ask === A) A.failed = true; }
  if (L.ask === A) askTick();
}

export default {
  css: `
  @property --pgpw-ly { syntax: "<percentage>"; inherits: true; initial-value: 50%; }
  .pg-paperwork .s { font-size: 12.5px; color: var(--ink-3); }
  .pg-paperwork .live { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-2); }
  .pg-paperwork .btn svg { flex: none; }
  .pg-paperwork .btn.lg { height: 46px; padding: 0 20px; font-size: 14.5px; border-radius: 12px; }

  /* ---- hero: the scanner and the dashboard beside it */
  .pg-paperwork .hero { --hh: clamp(440px, calc(100cqh - 196px), 620px); height: var(--hh); display: grid; grid-template-columns: minmax(0, 1.22fr) minmax(0, 1fr); gap: 24px; padding: 20px; }
  .pg-paperwork .hero.port { grid-template-columns: minmax(0, .78fr) minmax(0, 1fr); }
  .pg-paperwork .scn { display: flex; flex-direction: column; gap: 12px; min-height: 0; min-width: 0; }
  .pg-paperwork .sc-wrap { flex: 1; min-height: 0; display: grid; place-items: center; }
  .pg-paperwork .scope { position: relative; width: min(100%, calc((var(--hh) - 120px) * var(--ar))); aspect-ratio: var(--ar); border-radius: 12px; overflow: hidden; background: var(--bg); isolation: isolate; box-shadow: 0 0 0 1px var(--line-2), 0 28px 60px -28px #000, 0 0 60px -24px var(--holo-glow); }
  .pg-paperwork .scope img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; transition: filter .8s; }
  .pg-paperwork .s-new img, .pg-paperwork .s-error img { filter: brightness(.64) saturate(.7); }
  .pg-paperwork .s-reading img { filter: brightness(.8) saturate(.75) contrast(1.06); }
  .pg-paperwork .s-ready img { filter: brightness(.86) saturate(.85); }
  .pg-paperwork .scope > i { position: absolute; pointer-events: none; }
  .pg-paperwork .sc-tint { inset: 0; background: linear-gradient(180deg, rgba(70, 200, 255, .12), rgba(3, 7, 12, .2)); }
  .pg-paperwork .sc-lines { inset: 0; background: repeating-linear-gradient(0deg, rgba(0, 0, 0, .22) 0 1px, transparent 1px 3px); opacity: .4; }
  .pg-paperwork .sc-grid { inset: 0; background-image: linear-gradient(rgba(120, 220, 255, .22) 1px, transparent 1px), linear-gradient(90deg, rgba(120, 220, 255, .22) 1px, transparent 1px); background-size: 26px 26px; opacity: 0; transition: opacity .6s;
    -webkit-mask-image: linear-gradient(180deg, transparent calc(var(--pgpw-ly) - 22%), #000 var(--pgpw-ly), transparent calc(var(--pgpw-ly) + 3%)); mask-image: linear-gradient(180deg, transparent calc(var(--pgpw-ly) - 22%), #000 var(--pgpw-ly), transparent calc(var(--pgpw-ly) + 3%)); }
  .pg-paperwork .s-reading .sc-grid { opacity: 1; }
  .pg-paperwork .sc-wash { left: 0; right: 0; top: 0; height: var(--pgpw-ly); background: linear-gradient(180deg, rgba(70, 200, 255, .04), rgba(70, 200, 255, .12)); opacity: 0; transition: opacity .6s; }
  .pg-paperwork .track .sc-wash { opacity: 1; }
  .pg-paperwork .scope.sweep { animation: pgpw-sweep 3.4s ease-in-out infinite alternate; }
  .pg-paperwork .s-new.sweep { animation-duration: 6s; }
  .pg-paperwork .scope.track { transition: --pgpw-ly .65s cubic-bezier(.2, .8, .2, 1); }
  @keyframes pgpw-sweep { from { --pgpw-ly: 5%; } to { --pgpw-ly: 95%; } }
  .pg-paperwork .sc-laser { position: absolute; left: -4%; right: -4%; top: var(--pgpw-ly); height: 2px; margin-top: -1px; transform: rotate(var(--rot)); pointer-events: none; opacity: 0; transition: opacity .5s;
    background: linear-gradient(90deg, transparent, rgba(70, 200, 255, .9) 12%, #e8faff 50%, rgba(70, 200, 255, .9) 88%, transparent); box-shadow: 0 0 10px 1px var(--holo), 0 0 36px 5px rgba(70, 200, 255, .45); }
  .pg-paperwork .s-reading .sc-laser { opacity: 1; }
  .pg-paperwork .s-new .sc-laser { opacity: .4; }
  .pg-paperwork .sc-laser::before { content: ""; position: absolute; left: 6%; right: 6%; bottom: 100%; height: 64px; background: linear-gradient(0deg, rgba(70, 200, 255, .26), transparent); }
  .pg-paperwork .sc-laser i { position: absolute; top: -6px; height: 14px; width: 16%; background: radial-gradient(closest-side, #fff, rgba(166, 230, 255, .7) 45%, transparent); animation: pgpw-spot 1.15s ease-in-out infinite alternate; }
  @keyframes pgpw-spot { from { left: 6%; } to { left: 78%; } }
  .pg-paperwork .sc-boxes { position: absolute; inset: 0; pointer-events: none; }
  .pg-paperwork .sc-bx { position: absolute; border: 1px solid rgba(166, 230, 255, .9); border-radius: 3px; background: rgba(70, 200, 255, .08); box-shadow: 0 0 8px rgba(70, 200, 255, .55), inset 0 0 10px rgba(70, 200, 255, .16); }
  .pg-paperwork .s-ready .sc-bx { border-color: rgba(166, 230, 255, .55); background: rgba(70, 200, 255, .05); box-shadow: 0 0 6px rgba(70, 200, 255, .35); }
  .pg-paperwork .sc-bx.in { animation: pgpw-bx .6s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes pgpw-bx { from { clip-path: inset(0 100% 0 0); opacity: .3; background: rgba(166, 230, 255, .45); } to { clip-path: inset(0 0 0 0); opacity: 1; } }
  .pg-paperwork .sc-bx.flag, .pg-paperwork .s-ready .sc-bx.flag { border: 1.5px solid var(--amber); background: rgba(255, 181, 71, .14); box-shadow: 0 0 14px var(--amber-glow), inset 0 0 10px rgba(255, 181, 71, .2); }
  .pg-paperwork .sc-bx.flag::after { content: "check"; position: absolute; right: 4px; top: 50%; transform: translateY(-50%); font: 700 12.5px/1 var(--sans); letter-spacing: 0; text-transform: none; color: var(--bg); background: var(--amber); padding: 3px 5px; border-radius: 4px; }
  .pg-paperwork .sc-rd { position: absolute; left: 4%; top: var(--pgpw-ly); margin-top: 10px; max-width: 84%; font: 500 10.5px/1.4 var(--mono); color: var(--bg); background: var(--holo); padding: 3px 8px; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 0 18px var(--holo-glow); pointer-events: none; }
  .pg-paperwork .sc-fl { position: absolute; left: 50%; transform: translate(-50%, 8px); max-width: 84%; font: 500 10.5px/1.4 var(--mono); color: var(--bg); background: var(--holo); padding: 3px 8px; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 0 18px var(--holo-glow); animation: pgpw-fl 1.5s ease-out forwards; pointer-events: none; }
  @keyframes pgpw-fl { from { opacity: 0; transform: translate(-50%, 16px); } 15% { opacity: 1; transform: translate(-50%, 8px); } to { opacity: 0; transform: translate(-50%, -18px); } }
  .pg-paperwork .sc-c { position: absolute; width: 18px; height: 18px; border-color: var(--holo); border-style: solid; border-width: 0; opacity: .9; filter: drop-shadow(0 0 4px var(--holo)); pointer-events: none; }
  .pg-paperwork .sc-c.tl { top: 10px; left: 10px; border-top-width: 2px; border-left-width: 2px; }
  .pg-paperwork .sc-c.tr { top: 10px; right: 10px; border-top-width: 2px; border-right-width: 2px; }
  .pg-paperwork .sc-c.bl { bottom: 10px; left: 10px; border-bottom-width: 2px; border-left-width: 2px; }
  .pg-paperwork .sc-c.br { bottom: 10px; right: 10px; border-bottom-width: 2px; border-right-width: 2px; }
  .pg-paperwork .sc-again { position: absolute; right: 14px; bottom: 14px; background: rgba(3, 7, 12, .8); }
  .pg-paperwork .sc-hud { position: absolute; top: 14px; left: 32px; right: 32px; display: flex; justify-content: space-between; gap: 8px; pointer-events: none; }
  .pg-paperwork .sc-chip { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; background: rgba(3, 7, 12, .78); border: 1px solid var(--line-2); font: 600 12.5px var(--sans); letter-spacing: 0; text-transform: none; color: var(--holo-2); white-space: nowrap; }
  .pg-paperwork .sc-chip b { font: 500 11px var(--mono); letter-spacing: 0; color: #fff; }
  .pg-paperwork .sc-chip em { font-style: normal; color: var(--amber-ink); }
  .pg-paperwork .sc-chip.num { font: 500 11px var(--mono); letter-spacing: .04em; color: #fff; }
  .pg-paperwork .sc-chip.ok { color: #8ff0c6; border-color: rgba(63, 224, 160, .4); }
  .pg-paperwork .sc-chip.bad { color: #ffb0b3; border-color: rgba(255, 97, 104, .45); }
  .pg-paperwork .sc-chip svg { width: 13px; height: 13px; }
  .pg-paperwork .sc-go { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); height: 52px; padding: 0 28px; font-size: 16px; border-radius: 14px; animation: pgpw-go 2.2s ease-in-out infinite; }
  @keyframes pgpw-go { 0%, 100% { box-shadow: 0 0 0 0 rgba(70, 200, 255, .45), 0 0 40px -6px var(--holo); } 50% { box-shadow: 0 0 0 12px rgba(70, 200, 255, 0), 0 0 56px -4px var(--holo); } }
  /* the strip of photos under the scanner */
  .pg-paperwork .picks { display: flex; gap: 8px; overflow-x: auto; flex: none; padding-bottom: 2px; }
  .pg-paperwork .pk { flex: 1 1 0; min-width: 132px; max-width: 220px; display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 8px; align-items: center; height: 56px; padding: 6px 10px 6px 6px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); cursor: pointer; text-align: left; color: var(--ink); font: inherit; transition: border-color .15s, box-shadow .2s; }
  .pg-paperwork .pk:hover { border-color: rgba(70, 200, 255, .45); }
  .pg-paperwork .pk.sel { border-color: var(--holo); box-shadow: 0 0 0 1px rgba(70, 200, 255, .35), 0 0 22px -8px var(--holo-glow); background: var(--holo-tint); }
  .pg-paperwork .pk img { width: 40px; height: 40px; object-fit: cover; border-radius: 8px; }
  .pg-paperwork .pk span { min-width: 0; display: grid; }
  .pg-paperwork .pk b { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .pk em { font-style: normal; font-size: 11.5px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .pk.drop { grid-template-columns: 40px minmax(0, 1fr); border-style: dashed; border-color: var(--line-2); color: var(--holo-2); }
  .pg-paperwork .pk.drop > svg { width: 40px; height: 40px; padding: 11px; border-radius: 8px; background: var(--holo-tint); }
  .pg-paperwork .pk.drop b { color: var(--ink); }
  .pg-paperwork .pk.drop.over, .pg-paperwork .pk.drop:hover { border-color: var(--holo); background: var(--holo-tint); }
  .pg-paperwork div.pk.drop { display: grid; place-items: center; grid-template-columns: 1fr; font-size: 12.5px; }

  /* the panel beside the photo */
  .pg-paperwork .pn { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
  .pg-paperwork .pn > * { flex: none; }
  .pg-paperwork .pn > .tbl, .pg-paperwork .pn > .ghost { flex: 1 1 auto; }
  .pg-paperwork .pn-k { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .pn-k.ok { color: #8ff0c6; }
  .pg-paperwork .pn-k .kt { font: 400 12px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-2); margin-left: 4px; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .pn h2 { margin: 10px 0 0; font-size: 24px; font-weight: 500; letter-spacing: -.02em; line-height: 1.2; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .pn .sum { margin: 4px 0 0; color: var(--ink-2); font-size: 13.5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pg-paperwork .does { list-style: none; margin: 18px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .pg-paperwork .does li { display: grid; gap: 4px; align-content: start; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .02); min-width: 0; }
  .pg-paperwork .does i { font: 400 12px/1.4 var(--mono); font-style: normal; color: var(--holo); text-shadow: none; }
  .pg-paperwork .does b { display: block; font-weight: 600; color: #fff; font-size: 13.5px; line-height: 1.3; }
  .pg-paperwork .does span { display: block; font-size: 12px; color: var(--ink-3); line-height: 1.35; }
  .pg-paperwork .ghost { position: relative; flex: 1; min-height: 0; margin-top: 12px; padding: 14px; border: 1px dashed var(--line-2); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; gap: 12px; background: linear-gradient(180deg, rgba(70, 200, 255, .04), transparent); }
  .pg-paperwork .ghost .g-t { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; flex: none; }
  .pg-paperwork .ghost .g-t i { height: 52px; border-radius: 10px; border: 1px solid var(--line); background: rgba(70, 200, 255, .05); }
  .pg-paperwork .ghost .g-r { display: grid; gap: 10px; align-content: start; overflow: hidden; flex: 1; min-height: 0; }
  .pg-paperwork .ghost .g-r i { height: 8px; border-radius: 4px; background: linear-gradient(90deg, rgba(120, 200, 255, .1), rgba(120, 200, 255, .2), rgba(120, 200, 255, .1)); background-size: 200% 100%; animation: pgpw-gh 2.4s linear infinite; }
  @keyframes pgpw-gh { from { background-position: 100% 0; } to { background-position: -100% 0; } }
  .pg-paperwork .ghost span { position: absolute; left: 50%; top: 58%; transform: translate(-50%, -50%); padding: 6px 12px; border-radius: 999px; background: var(--bg); border: 1px solid var(--line-2); font-size: 12px; color: var(--holo-2); white-space: nowrap; }
  .pg-paperwork .cta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  .pg-paperwork .hint { font-size: 12px; color: var(--ink-3); margin-top: 8px; }
  .pg-paperwork .prog { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin-top: 16px; }
  .pg-paperwork .prog > div { min-width: 0; font-size: 11.5px; color: var(--ink-3); }
  .pg-paperwork .prog i { display: block; height: 3px; border-radius: 3px; background: rgba(255, 255, 255, .08); margin-bottom: 8px; overflow: hidden; }
  .pg-paperwork .prog .done i { background: var(--holo); box-shadow: 0 0 8px var(--holo); }
  .pg-paperwork .prog .on i { background: linear-gradient(90deg, var(--holo) 0 40%, rgba(70, 200, 255, .15) 40%); background-size: 250% 100%; animation: pgpw-bar 1.2s linear infinite; }
  @keyframes pgpw-bar { from { background-position: 100% 0; } to { background-position: -150% 0; } }
  .pg-paperwork .prog b { display: block; font-weight: 500; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .prog .on b { color: #fff; }
  .pg-paperwork .prog em { font: 11px var(--mono); font-style: normal; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
  .pg-paperwork .ctr { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
  .pg-paperwork .ctr > div { padding: 10px 14px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .02); min-width: 0; }
  .pg-paperwork .ctr span { display: block; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-paperwork .ctr b { display: block; font: 300 28px/1.15 var(--mono); letter-spacing: -.03em; color: #fff; text-shadow: none; }
  .pg-paperwork .ctr b small { font-size: 13px; margin-left: 4px; color: var(--holo-2); }
  .pg-paperwork .tbl { flex: 1; min-height: 72px; overflow: auto; margin-top: 12px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, .015); }
  .pg-paperwork .tbl.pad { padding: 16px; }
  .pg-paperwork .tbl h4 { margin: 0 0 12px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-paperwork .tbl-wait { height: 100%; min-height: 72px; display: grid; place-items: center; font-size: 13px; }
  .pg-paperwork .sheet th, .pg-paperwork .sheet td { padding: 7px 10px; font-size: 12.5px; }
  .pg-paperwork .sheet thead th { position: sticky; top: 0; z-index: 1; background: var(--panel-2); white-space: nowrap; }
  .pg-paperwork .sheet td { white-space: nowrap; }
  .pg-paperwork .sheet .rn { width: 34px; min-width: 34px; color: var(--ink-3); font-size: 11px; }
  .pg-paperwork .sheet td[contenteditable] { cursor: text; }
  .pg-paperwork .sheet td[contenteditable]:hover { background: rgba(70, 200, 255, .06); }
  .pg-paperwork .sheet td[contenteditable]:focus { outline: 2px solid var(--holo); outline-offset: -2px; background: rgba(70, 200, 255, .1); color: #fff; }
  .pg-paperwork .sheet tr.flag td { background: var(--amber-tint); color: var(--amber-ink); }
  .pg-paperwork .sheet tr.flag td.rn { box-shadow: inset 2px 0 0 var(--amber); color: var(--amber); }
  .pg-paperwork .sheet tr.in td { animation: pgpw-row 1s ease-out; }
  @keyframes pgpw-row { from { background: rgba(70, 200, 255, .28); color: #fff; } }
  .pg-paperwork .sheet tfoot td { position: sticky; bottom: 0; border-top: 1px solid var(--line-2); border-bottom: 0; background: var(--panel-2); font-weight: 600; color: #fff; }
  .pg-paperwork .mt { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 14px; }
  .pg-paperwork .mt.n3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pg-paperwork .mt.n2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pg-paperwork .mt.n1 { grid-template-columns: minmax(0, 1fr); }
  .pg-paperwork .mt > div { padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: linear-gradient(180deg, rgba(70, 200, 255, .07), rgba(70, 200, 255, .01)); min-width: 0; }
  .pg-paperwork .mt b { display: block; font: 300 22px/1.2 var(--mono); letter-spacing: -.03em; color: #fff; text-shadow: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color .3s; }
  .pg-paperwork .mt b.bump { color: var(--holo-2); }
  .pg-paperwork .mt span { display: block; font-size: 11.5px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .alert1 { display: grid; grid-template-columns: auto auto minmax(0, 1fr); gap: 10px; align-items: center; margin-top: 10px; padding: 9px 12px; border-radius: 12px; border: 1px solid rgba(255, 181, 71, .35); background: var(--amber-tint); color: var(--amber-ink); font: inherit; font-size: 12.5px; text-align: left; cursor: pointer; }
  .pg-paperwork .alert1 b { font-weight: 600; white-space: nowrap; }
  .pg-paperwork .alert1 span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--amber-ink); opacity: .85; }
  .pg-paperwork .pn-tabs { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; }
  .pg-paperwork .pn-tabs .hint { margin: 0; white-space: nowrap; }
  .pg-paperwork .pn-act { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .pg-paperwork .chk { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .pg-paperwork .chk li { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 10px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255, 181, 71, .3); background: var(--amber-tint); font-size: 13px; color: var(--amber-ink); }
  .pg-paperwork .chk li i { font: 500 12px/1.5 var(--mono); font-style: normal; color: var(--amber); }

  /* ---- the numbers, then the detail behind tabs */
  .pg-paperwork .kpis { margin-top: 16px; }
  .pg-paperwork .kpis .tile { display: grid; grid-template-rows: auto auto 1fr auto; }
  .pg-paperwork .kpis .spark { margin-top: 10px; width: 100%; height: 30px; }
  .pg-paperwork .pips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 14px; min-height: 18px; align-items: center; }
  .pg-paperwork .pips i { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid var(--green); background: var(--green-tint); box-shadow: 0 0 10px rgba(63, 224, 160, .35); }
  .pg-paperwork .comp { display: flex; gap: 3px; margin-top: 16px; height: 10px; }
  .pg-paperwork .comp i { border-radius: 3px; background: linear-gradient(90deg, rgba(63, 224, 160, .45), var(--green)); box-shadow: 0 0 8px rgba(63, 224, 160, .35); min-width: 4px; }
  .pg-paperwork .more { margin-top: 16px; }
  .pg-paperwork .more > .ch { flex-wrap: wrap; margin-bottom: 16px; }
  .pg-paperwork .mk { display: grid; grid-template-columns: 104px minmax(0, 1fr) auto; gap: 4px 16px; padding: 14px 16px; border-top: 1px solid var(--line); align-items: start; }
  .pg-paperwork .mk:first-child { border-top: 0; }
  .pg-paperwork .mk.wait { background: var(--amber-tint); }
  .pg-paperwork .mk .v { font: 300 22px/1.2 var(--mono); letter-spacing: -.02em; color: #fff; text-shadow: none; }
  .pg-paperwork .mk.wait .v { color: var(--amber-ink); text-shadow: none; }
  .pg-paperwork .mk .v small { display: block; font: 12px var(--sans); color: var(--ink-3); letter-spacing: 0; text-shadow: none; margin-top: 2px; }
  .pg-paperwork .mk b { font-weight: 600; color: #fff; }
  .pg-paperwork .mk p { margin: 4px 0 0; font-size: 13px; color: var(--ink-2); }
  .pg-paperwork .mk .nx { margin-top: 8px; font-size: 12.5px; color: var(--ink-3); padding-left: 12px; border-left: 2px solid var(--line-2); }
  .pg-paperwork .grp { margin: 20px 0 8px; display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-paperwork .grp:first-child { margin-top: 0; }
  .pg-paperwork .grp span { text-transform: none; letter-spacing: 0; font-weight: 400; font-family: var(--mono); color: var(--holo-2); }
  .pg-paperwork .docs-t td { vertical-align: top; }
  .pg-paperwork .docs-t td .s { margin-top: 2px; }
  .pg-paperwork .docs-t tr.lv { cursor: pointer; }
  .pg-paperwork .docs-t tr.lv td { background: var(--holo-tint); }
  .pg-paperwork .warn { color: var(--amber-ink); font-weight: 600; }
  .pg-paperwork .wk3 { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }
  .pg-paperwork .wk3 h4 { margin: 0 0 4px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-paperwork .lg2 { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 24px; }
  .pg-paperwork .nev { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; font-size: 13px; color: var(--ink-2); }
  .pg-paperwork .nev li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 8px; }
  .pg-paperwork .nev li::before { content: ""; width: 8px; height: 8px; margin-top: 6px; border-radius: 2px; border: 1.5px solid var(--red); background: var(--red-tint); }

  /* ---- Ask Dot */
  .pg-paperwork .phead { position: relative; }
  .pg-paperwork .toask { position: absolute; right: 0; top: 0; }
  .pg-paperwork .ak { display: grid; grid-template-columns: minmax(0, 300px) minmax(0, 1fr); gap: 24px; padding: 24px; align-items: stretch; }
  .pg-paperwork .ak, .pg-paperwork .ak ~ * { overflow-anchor: none; } /* the card changes height as answers come in: don't let the browser scroll to make up for it */
  .pg-paperwork .ak svg { flex: none; }
  .pg-paperwork .ak-l { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .pg-paperwork .ak-k { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-paperwork .ak-k .av-s { margin: 0; }
  .pg-paperwork .ak h2 { margin: 0; font-size: 27px; font-weight: 500; letter-spacing: -.02em; line-height: 1.15; color: #fff; text-wrap: balance; }
  .pg-paperwork .ak-lede { margin: -4px 0 0; font-size: 13px; color: var(--ink-2); }
  .pg-paperwork .ak-f { height: 46px; padding-left: 14px; }
  .pg-paperwork .ak-f input { font-size: 13.5px; }
  .pg-paperwork .ak-qs { display: grid; gap: 6px; }
  .pg-paperwork .ak-q { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 40px; padding: 8px 12px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255, 255, 255, .02); color: var(--ink); font: inherit; font-size: 13.5px; line-height: 1.3; text-align: left; cursor: pointer; transition: border-color .15s, background .15s, box-shadow .2s; }
  .pg-paperwork .ak-q svg { color: var(--holo); opacity: .6; transition: transform .15s, opacity .15s; }
  .pg-paperwork .ak-q:hover { border-color: rgba(70, 200, 255, .5); background: var(--holo-tint); }
  .pg-paperwork .ak-q:hover svg { opacity: 1; transform: translateX(2px); }
  .pg-paperwork .ak-q.first { border-color: rgba(70, 200, 255, .42); background: linear-gradient(90deg, rgba(70, 200, 255, .13), rgba(70, 200, 255, .02)); font-weight: 500; }
  .pg-paperwork .ak-q.sel { border-color: var(--holo); background: var(--holo-tint); color: #fff; box-shadow: 0 0 0 1px rgba(70, 200, 255, .35), 0 0 22px -8px var(--holo-glow); }
  .pg-paperwork .ak-q.sel svg { opacity: 1; }
  /* the one Dot couldn't read */
  .pg-paperwork .ur { display: grid; gap: 8px; margin-top: 14px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255, 181, 71, .35); background: var(--amber-tint); color: var(--amber-ink); cursor: pointer; transition: box-shadow .2s, border-color .15s; }
  .pg-paperwork .ur:hover, .pg-paperwork .ur:focus-visible { border-color: var(--amber); box-shadow: 0 0 26px -10px var(--amber-glow); outline: none; }
  .pg-paperwork .ur-k { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--amber); }
  .pg-paperwork .ur-b { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: center; }
  .pg-paperwork .ur-b > span { min-width: 0; display: grid; }
  .pg-paperwork .ur-b b { font-weight: 600; color: #fff; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .ur-b em { font-style: normal; font-size: 12px; color: var(--amber-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .ur q, .pg-paperwork .ask-q q { display: block; margin: 0; font-size: 12.5px; line-height: 1.45; color: var(--ink); padding-left: 10px; border-left: 2px solid var(--amber); quotes: "\\201C" "\\201D"; }
  .pg-paperwork .ur-f { display: flex; align-items: center; justify-content: space-between; gap: 6px 8px; flex-wrap: wrap; font-size: 11.5px; color: var(--amber-ink); }
  .pg-paperwork .ur-f .chip { height: 22px; font-size: 11.5px; }
  .pg-paperwork .ask-q { margin-top: 12px; display: grid; gap: 8px; padding: 12px; border-radius: 12px; border: 1px solid rgba(255, 181, 71, .35); background: var(--amber-tint); color: var(--amber-ink); }

  /* a document, small: drawn as Dot's copy of it (or the photo itself) */
  .pg-paperwork .dt { position: relative; flex: none; display: block; width: 30px; height: 40px; padding: 0; border-radius: 4px; border: 1px solid rgba(166, 230, 255, .5); background: linear-gradient(180deg, rgba(70, 200, 255, .17), rgba(70, 200, 255, .04)), var(--panel-2); box-shadow: 0 0 12px -4px var(--holo-glow); cursor: pointer; overflow: hidden; color: inherit; font: inherit; transition: transform .15s, box-shadow .2s, border-color .15s, opacity .3s; }
  .pg-paperwork .dt > i { position: absolute; left: 4px; right: 4px; top: 5px; bottom: 12px; opacity: .85;
    background: linear-gradient(var(--holo-2), var(--holo-2)) 0 0 / 62% 2px no-repeat, repeating-linear-gradient(180deg, rgba(166, 230, 255, .45) 0 1px, transparent 1px 4px) 0 6px / 100% calc(100% - 10px) no-repeat, linear-gradient(#e8faff, #e8faff) 100% 100% / 46% 2px no-repeat; }
  .pg-paperwork .dt > em { position: absolute; left: 0; right: 0; bottom: 2px; font: 600 6.5px/1 var(--mono); font-style: normal; letter-spacing: .02em; text-align: center; color: var(--holo-2); }
  .pg-paperwork .dt.k-receipt, .pg-paperwork .dt.k-parking { width: 23px; border-radius: 3px 3px 1px 1px; border-bottom-style: dashed; }
  .pg-paperwork .dt.k-delivery > i { background: linear-gradient(var(--holo-2), var(--holo-2)) 0 0 / 62% 2px no-repeat, repeating-linear-gradient(180deg, rgba(166, 230, 255, .45) 0 1px, transparent 1px 4px) 0 6px / 70% calc(100% - 10px) no-repeat, radial-gradient(closest-side, rgba(166, 230, 255, .9), transparent) 100% 100% / 40% 5px no-repeat; }
  .pg-paperwork .dt.k-credit { border-color: rgba(63, 224, 160, .6); }
  .pg-paperwork .dt.k-credit > em { color: #8ff0c6; }
  .pg-paperwork .dt.smudged { border-color: var(--amber); background: radial-gradient(circle at 62% 76%, rgba(255, 181, 71, .55), rgba(255, 181, 71, .1) 38%, transparent 60%), linear-gradient(180deg, rgba(255, 181, 71, .14), rgba(255, 181, 71, .04)), var(--panel-2); box-shadow: 0 0 14px -3px var(--amber-glow); }
  .pg-paperwork .dt.smudged > em { color: var(--amber-ink); }
  .pg-paperwork .dt.ph { width: 40px; height: 40px; border-radius: 6px; }
  .pg-paperwork .dt.ph img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.85) saturate(.8); }
  .pg-paperwork button.dt:hover, .pg-paperwork button.dt:focus-visible { transform: translateY(-2px); border-color: #e8faff; box-shadow: 0 0 0 1px var(--holo), 0 0 18px -2px var(--holo-glow); outline: none; z-index: 1; }

  /* the answer side */
  .pg-paperwork .ak-r { min-width: 0; display: flex; flex-direction: column; }
  .pg-paperwork .an { position: relative; flex: 1; display: flex; flex-direction: column; min-width: 0; padding: 16px 18px; border: 1px solid var(--line); border-radius: 14px; background: linear-gradient(180deg, rgba(70, 200, 255, .055), rgba(70, 200, 255, .01)); }
  .pg-paperwork .an-k { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--holo-2); white-space: nowrap; min-width: 0; }
  .pg-paperwork .an.done .an-k { color: #8ff0c6; }
  .pg-paperwork .an-k span { margin-left: auto; font: 400 11.5px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .an h4 { margin: 10px 0 0; font-size: 19px; font-weight: 500; letter-spacing: -.01em; line-height: 1.25; color: #fff; }
  .pg-paperwork .an-sub { margin: 2px 0 0; font-size: 12.5px; color: var(--ink-3); }
  .pg-paperwork .an-big { display: flex; align-items: baseline; gap: 6px 14px; flex-wrap: wrap; margin-top: 8px; }
  .pg-paperwork .an-big b { font: 300 46px/1.05 var(--mono); letter-spacing: -.04em; color: #fff; text-shadow: none; }
  .pg-paperwork .an-big span { font-size: 13.5px; color: var(--ink-2); }
  .pg-paperwork .an-say { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 10px; margin: 10px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--ink); }
  .pg-paperwork .an-say .av-s { margin: 0; }
  .pg-paperwork .al-list { margin-top: 12px; border-top: 1px solid var(--line); }
  .pg-paperwork .al { display: grid; grid-template-columns: 66px minmax(0, 1fr) auto; gap: 12px; align-items: center; min-height: 44px; padding: 2px 0; border-bottom: 1px solid rgba(255, 255, 255, .05); }
  .pg-paperwork .al.in { animation: pgpw-al .5s cubic-bezier(.2, .8, .2, 1) both; animation-delay: calc(var(--i) * 90ms + 200ms); }
  @keyframes pgpw-al { from { opacity: 0; transform: translateY(8px); } }
  .pg-paperwork .th { display: flex; align-items: center; min-width: 0; }
  .pg-paperwork .th .dt + .dt { margin-left: 4px; }
  .pg-paperwork .th.n3 .dt + .dt, .pg-paperwork .th.n4 .dt + .dt, .pg-paperwork .th.n5 .dt + .dt { margin-left: -13px; }
  .pg-paperwork .th.n5 .dt:nth-child(odd) { transform: rotate(-4deg); }
  .pg-paperwork .th.n5 .dt:nth-child(even) { transform: rotate(3deg) translateY(1px); }
  .pg-paperwork .th.n5 button.dt:hover { transform: translateY(-3px); }
  .pg-paperwork .th.n3 .dt:not(:last-child) > em, .pg-paperwork .th.n4 .dt:not(:last-child) > em, .pg-paperwork .th.n5 .dt:not(:last-child) > em { display: none; }
  .pg-paperwork .al-m { min-width: 0; display: grid; }
  .pg-paperwork .al-m b { font-size: 13px; line-height: 1.4; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .al-m > span { font-size: 12.5px; line-height: 1.4; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .al-m em { font: 400 11px/1.5 var(--mono); font-style: normal; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pg-paperwork .al-m .nt { font-style: normal; font-size: 12px; font-weight: 500; color: var(--ink-2); }
  .pg-paperwork .al-m .nt.red { color: #ffb0b3; }
  .pg-paperwork .al-v { display: grid; justify-items: end; white-space: nowrap; }
  .pg-paperwork .al-v b { font: 400 15px/1.35 var(--mono); color: #fff; }
  .pg-paperwork .al-v b.crd { color: var(--green); }
  .pg-paperwork .al-v em { font: 400 11px/1.5 var(--mono); font-style: normal; color: var(--ink-3); }
  .pg-paperwork .al.ur2 { grid-template-columns: 30px minmax(0, 1fr); margin-top: 8px; padding: 8px 12px; border: 1px solid rgba(255, 181, 71, .35); border-radius: 12px; background: var(--amber-tint); }
  .pg-paperwork .al.ur2 b { color: var(--amber-ink); }
  .pg-paperwork .al.ur2 .al-m > span { white-space: normal; color: var(--ink); }
  .pg-paperwork .al.ur2 .ur2-h { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
  .pg-paperwork .al.ur2 .ur2-h .chip { flex: none; height: 22px; font-size: 11.5px; }
  .pg-paperwork .al.ur2 .ur2-f { margin-top: 2px; font: 400 12px/1.45 var(--sans); color: var(--amber-ink); white-space: normal; }
  .pg-paperwork .al.ur2 q { display: block; margin: 8px 0 0; font-size: 12.5px; line-height: 1.45; color: var(--ink); padding-left: 10px; border-left: 2px solid var(--amber); quotes: "\\201C" "\\201D"; }
  .pg-paperwork .an .working-line { margin-top: 8px; }
  /* the cabinet: every piece of paper Dot's filed */
  .pg-paperwork .cab { position: relative; display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; margin-top: 14px; padding: 16px; border: 1px dashed var(--line-2); border-radius: 12px; overflow: hidden; background: repeating-linear-gradient(0deg, rgba(120, 220, 255, .04) 0 1px, transparent 1px 26px), repeating-linear-gradient(90deg, rgba(120, 220, 255, .04) 0 1px, transparent 1px 26px); }
  .pg-paperwork .cab .dt { width: 38px; height: 50px; }
  .pg-paperwork .cab .dt.k-receipt, .pg-paperwork .cab .dt.k-parking { width: 29px; }
  .pg-paperwork .cab .dt.ph { width: 50px; height: 50px; }
  .pg-paperwork .look .cab .dt { opacity: .4; pointer-events: none; }
  .pg-paperwork .look .cab .dt.hit { opacity: 1; transform: translateY(-4px) scale(1.06); border-color: #e8faff; box-shadow: 0 0 0 1px var(--holo), 0 0 22px var(--holo-glow); }
  .pg-paperwork .cab-l { position: absolute; left: 0; right: 0; top: 0; height: 2px; pointer-events: none; background: linear-gradient(90deg, transparent, var(--holo) 18%, #e8faff 50%, var(--holo) 82%, transparent); box-shadow: 0 0 14px 1px var(--holo); animation: pgpw-cab 1.5s ease-in-out infinite alternate; }
  @keyframes pgpw-cab { from { top: 3%; } to { top: 95%; } }
  .pg-paperwork .an-hint { display: flex; gap: 10px; align-items: flex-start; margin: 14px 0 0; font-size: 13px; color: var(--ink-2); }
  .pg-paperwork .an-hint svg { margin-top: 3px; color: var(--holo); transform: rotate(180deg); }
  .pg-paperwork .look h4 { color: var(--holo-2); }

  /* a document, opened */
  .pg-paperwork .dv { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .pg-paperwork .dv-bar { display: flex; align-items: center; gap: 6px; }
  .pg-paperwork .dv-bar .num { margin-left: auto; margin-right: 4px; font-size: 12px; color: var(--ink-3); }
  .pg-paperwork .dv-bar [data-dvstep] { width: 32px; padding: 0; font-size: 16px; }
  .pg-paperwork .dv-b { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .pg-paperwork .dv-i h4 { margin: 6px 0 0; font-size: 18px; font-weight: 500; color: #fff; line-height: 1.25; }
  .pg-paperwork .dv-ref { margin: 2px 0 0; font: 400 12px var(--mono); color: var(--ink-3); }
  .pg-paperwork .dv-kv { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 6px; margin: 12px 0 0; }
  .pg-paperwork .dv-kv div { padding: 7px 10px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, .02); min-width: 0; }
  .pg-paperwork .dv-kv dt { font-size: 12.5px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ink-3); }
  .pg-paperwork .dv-kv dd { margin: 2px 0 0; font-size: 13px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pg-paperwork .dv-ph { width: 100%; animation: pgpw-paper .45s cubic-bezier(.2, .8, .2, 1) both; }
  .pg-paperwork .dv-z { position: absolute; inset: 0; transform-origin: var(--zx) var(--zy); }
  .pg-paperwork .dv-z > i { position: absolute; inset: 0; pointer-events: none; }
  .pg-paperwork .dv-ph.zoom .dv-z { animation: pgpw-zoom 1.2s .25s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes pgpw-zoom { to { transform: scale(1.3); } }
  .pg-paperwork .paper { position: relative; width: 100%; max-width: 330px; margin: 0 auto; padding: 18px 18px 16px; border-radius: 6px; border: 1px solid rgba(166, 230, 255, .4); font: 400 11px/1.45 var(--mono); color: var(--ink-2);
    background: linear-gradient(180deg, rgba(70, 200, 255, .1), rgba(70, 200, 255, .02)), repeating-linear-gradient(0deg, rgba(120, 220, 255, .045) 0 1px, transparent 1px 22px), var(--panel-2);
    box-shadow: 0 0 0 1px rgba(70, 200, 255, .08), 0 26px 50px -24px #000, 0 0 44px -18px var(--holo-glow); animation: pgpw-paper .45s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes pgpw-paper { from { opacity: 0; transform: translateY(10px) scale(.98); } }
  .pg-paperwork .paper .sc-c { width: 12px; height: 12px; }
  .pg-paperwork .paper .sc-c.tl, .pg-paperwork .paper .sc-c.tr { top: 5px; } .pg-paperwork .paper .sc-c.bl, .pg-paperwork .paper .sc-c.br { bottom: 5px; }
  .pg-paperwork .paper .sc-c.tl, .pg-paperwork .paper .sc-c.bl { left: 5px; } .pg-paperwork .paper .sc-c.tr, .pg-paperwork .paper .sc-c.br { right: 5px; }
  .pg-paperwork .paper.k-receipt, .pg-paperwork .paper.k-parking { max-width: 270px; border-top-style: dashed; border-bottom-style: dashed; }
  .pg-paperwork .p-h { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; padding-bottom: 10px; border-bottom: 1px solid rgba(166, 230, 255, .3); }
  .pg-paperwork .p-h b { font: 600 13px/1.25 var(--sans); letter-spacing: 0; text-transform: none; color: #fff; }
  .pg-paperwork .p-h > span { flex: none; text-align: right; font: 600 12.5px/1.4 var(--sans); letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-paperwork .p-h small { display: block; font: 400 11px var(--mono); letter-spacing: 0; text-transform: none; color: var(--ink); }
  .pg-paperwork .p-h.c { flex-direction: column; align-items: center; text-align: center; gap: 2px; }
  .pg-paperwork .p-h.c small { font: 400 11px var(--sans); color: var(--ink-2); }
  .pg-paperwork .p-m { display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; color: var(--ink-3); }
  .pg-paperwork .p-m span + span { flex: none; white-space: nowrap; }
  .pg-paperwork .paper table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .pg-paperwork .paper th { text-align: left; font: 600 12.5px var(--sans); letter-spacing: 0; text-transform: none; color: var(--ink-3); padding: 0 0 4px; border-bottom: 1px dashed rgba(166, 230, 255, .25); }
  .pg-paperwork .paper td { padding: 4px 0; border-bottom: 1px dashed rgba(166, 230, 255, .12); vertical-align: top; color: var(--ink); }
  .pg-paperwork .paper .r { text-align: right; padding-left: 10px; white-space: nowrap; }
  .pg-paperwork .p-r { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed rgba(166, 230, 255, .14); }
  .pg-paperwork .p-r b { font-weight: 500; color: var(--ink); }
  .pg-paperwork .p-tot { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 12px; padding: 6px 8px; }
  .pg-paperwork .p-tot span { font: 600 12.5px var(--sans); letter-spacing: 0; text-transform: none; color: var(--holo-2); }
  .pg-paperwork .p-tot b { font: 500 16px var(--mono); color: #fff; margin-left: auto; }
  .pg-paperwork .paper .box { border: 1px solid rgba(166, 230, 255, .9); border-radius: 4px; background: rgba(70, 200, 255, .09); box-shadow: 0 0 10px rgba(70, 200, 255, .45), inset 0 0 10px rgba(70, 200, 255, .16); }
  .pg-paperwork .paper .box.warn { border-color: var(--amber); background: rgba(255, 181, 71, .12); box-shadow: 0 0 16px var(--amber-glow), inset 0 0 10px rgba(255, 181, 71, .2); }
  .pg-paperwork .paper .box.warn span { color: var(--amber-ink); }
  .pg-paperwork .paper .box em { font: 700 12.5px/1 var(--sans); font-style: normal; letter-spacing: 0; text-transform: none; color: var(--bg); background: var(--amber); padding: 3px 5px; border-radius: 4px; }
  .pg-paperwork .paper .smg { display: inline-block; filter: blur(2.6px); color: var(--amber-ink); }
  .pg-paperwork .p-smudge { position: absolute; right: 6%; bottom: 8%; width: 58%; height: 36%; border-radius: 50%; pointer-events: none; transform: rotate(-14deg); background: radial-gradient(closest-side, rgba(255, 181, 71, .3), rgba(255, 181, 71, .1) 55%, transparent); }
  .pg-paperwork .p-s { display: flex; justify-content: space-between; align-items: baseline; margin-top: 12px; color: var(--ink-3); }
  .pg-paperwork .p-s i { font: italic 400 17px/1 "Snell Roundhand", "Segoe Script", "Brush Script MT", cursive; color: var(--holo-2); }
  .pg-paperwork .p-f { margin-top: 10px; text-align: center; color: var(--ink-3); font-size: 10px; }

  @container (max-width: 1080px) {
    .pg-paperwork .ak { grid-template-columns: minmax(0, 216px) minmax(0, 1fr); gap: 18px; padding: 20px; }
    .pg-paperwork .an { padding: 12px 14px; }
    .pg-paperwork .ak.viewing { grid-template-columns: minmax(0, 1fr); }
    .pg-paperwork .ak.viewing .ak-l { display: none; }
    .pg-paperwork .ak.viewing .dv-b { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .pg-paperwork .ak.viewing .dv-b:has(.dv-ph) { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); }
    .pg-paperwork .ak.viewing .dv-ph { max-width: none; }
    .pg-paperwork .ak h2 { font-size: 22px; }
    .pg-paperwork .dv-b { grid-template-columns: minmax(0, 1fr); gap: 14px; }
    .pg-paperwork .paper { max-width: 300px; }
    .pg-paperwork .dv-ph { max-width: 420px; margin: 0 auto; }
  }
  @container (max-width: 620px) {
    .pg-paperwork .ak, .pg-paperwork .ak.viewing .dv-b, .pg-paperwork .ak.viewing .dv-b:has(.dv-ph) { grid-template-columns: minmax(0, 1fr); }
    .pg-paperwork .ak h2 { font-size: 24px; }
    .pg-paperwork .an-big b { font-size: 40px; }
    .pg-paperwork .an { padding: 14px; }
    .pg-paperwork .an-hint svg { transform: rotate(-90deg); }
  }
  @container (max-height: 720px) {
    .pg-paperwork .ak-lede { display: none; }
    .pg-paperwork .ak { padding-top: 16px; padding-bottom: 16px; }
    .pg-paperwork .ak-q { min-height: 38px; }
    .pg-paperwork .an { padding-top: 10px; padding-bottom: 10px; }
    .pg-paperwork .an h4 { margin-top: 5px; }
    .pg-paperwork .an-big { margin-top: 2px; }
    .pg-paperwork .an-big b { font-size: 38px; line-height: 1.05; }
    .pg-paperwork .an-say { margin-top: 6px; font-size: 13px; line-height: 1.42; }
    .pg-paperwork .al-list { margin-top: 8px; }
    .pg-paperwork .al { min-height: 42px; }
    .pg-paperwork .an .working-line { margin-top: 4px; }
    .pg-paperwork .al.ur2 { margin-top: 6px; padding-top: 6px; padding-bottom: 6px; }
  }
  @container (max-width: 1080px) { .pg-paperwork .wk3 { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .pg-paperwork .wk3 > :first-child { grid-column: 1 / -1; } }
  @container (max-width: 760px) {
    .pg-paperwork .hero { gap: 16px; padding: 16px; --hh: clamp(430px, calc(100cqh - 190px), 620px); }
    .pg-paperwork .pn h2 { font-size: 20px; }
    .pg-paperwork .mt b { font-size: 20px; }
    .pg-paperwork .mt.n4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pg-paperwork .mt > div { padding: 8px 10px; }
    .pg-paperwork .ctr b { font-size: 22px; }
    .pg-paperwork .ctr > div { padding: 8px 10px; }
    .pg-paperwork .prog em { display: none; }
    .pg-paperwork .hero.land, .pg-paperwork .hero.port { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .pg-paperwork .pk { flex: 0 0 auto; min-width: 0; grid-template-columns: 40px; padding: 6px; height: 54px; position: relative; }
    .pg-paperwork .pk:not(.drop) > span { display: none; }
    .pg-paperwork .pk:not(.drop) > .ldot { position: absolute; top: 4px; right: 4px; }
    .pg-paperwork .pk.drop { flex: 1 1 auto; grid-template-columns: 40px minmax(0, 1fr); padding-right: 10px; }
    .pg-paperwork .sc-chip { height: 24px; padding: 0 8px; font-size: 10px; }
    .pg-paperwork .sc-bx.flag::after { display: none; }
    .pg-paperwork .pn-tabs .hint { display: none; }
    .pg-paperwork .does li { padding: 10px 12px; }
    .pg-paperwork .ghost .g-t { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pg-paperwork .lg2, .pg-paperwork .wk3 { grid-template-columns: minmax(0, 1fr); }
    .pg-paperwork .mk { grid-template-columns: minmax(0, 1fr) auto; }
    .pg-paperwork .mk .v { grid-column: 1 / -1; }
    .pg-paperwork .docs-t .hp { display: none; }
  }
  @container (max-height: 720px) {
    .pg-paperwork .pn-ready .sum, .pg-paperwork .pn-reading .sum { display: none; }
    .pg-paperwork .does span { display: none; }
    .pg-paperwork .does { margin-top: 14px; }
    .pg-paperwork .does li { padding: 8px 12px; }
    .pg-paperwork .ghost .g-t i { height: 40px; }
    .pg-paperwork .pn h2 { margin-top: 6px; }
    .pg-paperwork .mt { margin-top: 10px; }
    .pg-paperwork .mt > div { padding: 6px 10px; }
    .pg-paperwork .mt b { font-size: 19px; }
    .pg-paperwork .mt span { font-size: 11px; }
    .pg-paperwork .alert1 { margin-top: 8px; padding: 7px 10px; }
    .pg-paperwork .pn-tabs { margin-top: 8px; }
    .pg-paperwork .tbl { margin-top: 8px; }
    .pg-paperwork .pn-act { margin-top: 8px; }
    .pg-paperwork .ctr { margin-top: 12px; }
    .pg-paperwork .prog { margin-top: 12px; }
  }
  @container (max-width: 600px) {
    .pg-paperwork .hero, .pg-paperwork .hero.land, .pg-paperwork .hero.port { height: auto; grid-template-columns: minmax(0, 1fr); --hh: 600px; }
    .pg-paperwork .mt.n4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pg-paperwork .pn-ready .sum, .pg-paperwork .pn-reading .sum { display: -webkit-box; }
    .pg-paperwork .sc-bx.flag::after { display: block; }
    .pg-paperwork .scope { width: min(100%, calc(440px * var(--ar))); }
    .pg-paperwork .tbl { max-height: 300px; flex: none; }
    .pg-paperwork .cta .btn { flex: 1 1 100%; }
  }`,

  render(host, ctx) {
    HOST = host; clearInterval(TICK);
    const D = ctx.data, L = ctx.local, M = ctx.model, E = M.employees.paperwork, last = E.units.length - 1;
    L.drawn ||= {}; L.counted ||= {}; L.ar ||= {};
    const list = photoList(ctx), cur = current(list, L);
    SIG = cur ? `${cur.key}|${cur.status}` : "";
    const live = list.filter((x) => x.dash && new Date(x.startedAt).toDateString() === new Date().toDateString());

    // the numbers: from the one model, with today's live reads shown separately. The sample mistakes for the last
    // 7 days (days -7 to -1) are the model's mistakes_caught, worth mistakes_gbp; the working groups them by kind.
    const recent = (D.mistakes || []).filter((m) => m.day_offset <= -1 && m.day_offset >= -7);
    const recentSum = Math.round(recent.reduce((a, m) => a + m.value_gbp, 0) * 100) / 100;
    const byKind = Object.entries(recent.reduce((a, m) => ((a[m.kind] = (a[m.kind] || 0) + m.value_gbp), a), {})).sort((a, b) => b[1] - a[1]);
    const restSum = byKind.slice(2).reduce((a, [, v]) => a + v, 0);
    const putRight = recent.length === E.mistakes_caught && recentSum === E.mistakes_gbp
      ? `${byKind.slice(0, 2).map(([k, v]) => `${fmtMoney(v)} ${k.toLowerCase()}`).join(" + ")}${byKind.length > 2 ? ` + ${fmtMoney(restSum)} the rest` : ""} = ${money(E.mistakes_gbp, 0)}` : E.kpis[1].working;
    const kpis = `<section class="grid g4 kpis">
      <div class="card tile hud"><h3>Documents read</h3><div class="big" data-count="${E.units[last]}">${num(E.units[last])}</div><div class="sub">last 7 days${live.length ? ` · <span class="up">+${live.length} read live today</span>` : ""}</div>${spark(E.units.slice(2))}${working(E.kpis[0].working)}</div>
      <div class="card tile"><h3>Mistakes caught</h3><div class="big" data-count="${E.mistakes_caught}">${num(E.mistakes_caught)}</div><div class="sub">last 7 days, before anyone paid for them</div><div class="pips">${recent.map((m) => `<i data-tip="${esc(m.doc)}: ${esc(fmtMoney(m.value_gbp))}"></i>`).join("")}</div>${working(`${num(E.rows)} rows read, every one checked`)}</div>
      <div class="card tile"><h3>Put right</h3><div class="big" data-count="${E.mistakes_gbp}">${money(E.mistakes_gbp, 0)}</div><div class="sub up">from those ${E.mistakes_caught} mistakes</div><div class="comp">${recent.slice().sort((a, b) => b.value_gbp - a.value_gbp).map((m) => `<i style="flex:${m.value_gbp}" data-tip="${esc(m.doc)}: ${esc(fmtMoney(m.value_gbp))}"></i>`).join("")}</div>${working(putRight)}</div>
      <div class="card tile"><h3>Hours given back</h3><div class="big" data-count="${E.hours[last]}">${num(E.hours[last], 1)} h</div><div class="sub">of typing up, last 7 days</div>${spark(E.hours.slice(2))}${working(E.kpis[2].working)}</div>
    </section>`;

    // detail, behind tabs
    const tab = L.tab || "mistakes";
    let body = "";
    if (tab === "mistakes") {
      // today's one is the paperwork item on the model's shared "waiting on a person" list, so its value comes from there
      const need = M.needs.find((n) => n.agent === "paperwork");
      const ms = (D.mistakes || []).map((m) => (m.status === "waiting" && need?.value_gbp ? { ...m, value_gbp: need.value_gbp } : m)).sort((a, b) => b.day_offset - a.day_offset || b.value_gbp - a.value_gbp);
      const mk = (m) => `<div class="mk ${m.status === "waiting" ? "wait" : ""}"><div class="v">${m.value_gbp ? fmtMoney(m.value_gbp) : "–"}<small>${esc(when(m.day_offset))}</small></div>
        <div><b>${esc(m.doc)}</b><p>${esc(m.what)}</p><div class="nx">${esc(m.next)}</div></div><div>${chip(STATUS[m.status]?.[0] || m.status, STATUS[m.status]?.[1] || "")}</div></div>`;
      const today = ms.filter((m) => m.day_offset === 0), week = ms.filter((m) => m.day_offset <= -1 && m.day_offset >= -7), older = ms.filter((m) => m.day_offset < -7);
      const cut = L.allMk ? week : week.slice(0, 6), cutSum = cut.reduce((a, m) => a + m.value_gbp, 0);
      body = `${today.length ? `<div class="grp">Today<span>${today.length} waiting on a person</span></div><div class="list">${today.map(mk).join("")}</div>` : ""}
        <div class="grp">Last 7 days<span>${num(E.mistakes_caught)} caught · ${money(E.mistakes_gbp, 0)} put right</span></div><div class="list">${cut.map(mk).join("")}</div>
        ${cut.length < week.length ? `<div class="working-line">The newest ${cut.length} of ${week.length} shown, ${fmtMoney(cutSum)} of the ${money(E.mistakes_gbp, 0)}.</div><button class="btn sm" data-allmk style="margin-top:12px">Show all ${week.length}${older.length ? `, and ${older.length} earlier` : ""}</button>`
          : older.length ? `<div class="grp">Earlier<span>${older.length} more</span></div><div class="list">${older.map(mk).join("")}</div>` : ""}`;
    } else if (tab === "read") {
      // the latest documents: every one read so far today, then the newest from yesterday (the 7-day total is the model's)
      const liveDocs = live.map((x) => ({ live: true, key: x.key, day_offset: 0, kind: "Read live", title: x.dash.title || x.title, from: x.from, rows: cleanRows(x.dash).length, mistakes: checks(x.dash).length, note: x.dash.summary || "" }));
      const allDocs = [...liveDocs, ...(D.docs || [])], docs = L.allDocs ? allDocs : allDocs.slice(0, 8);
      const todayN = allDocs.filter((d) => d.day_offset === 0).length;
      body = `<div class="tablewrap"><table class="t docs-t"><thead><tr><th>When</th><th>Document</th><th class="hp">Kind</th><th class="hp">Sent by</th><th class="r">Rows</th><th class="r">To check</th></tr></thead><tbody>
        ${docs.map((d) => `<tr class="${d.live ? "lv" : ""}" ${d.live ? `data-pick="${esc(d.key)}" data-tip="Open this dashboard"` : ""}><td style="white-space:nowrap">${d.live ? chip("Live", "holo") : esc(when(d.day_offset))}</td><td><b style="font-weight:500">${esc(d.title)}</b>${d.note ? `<div class="s">${esc(d.note)}</div>` : ""}</td><td class="hp" style="white-space:nowrap">${esc(d.kind)}</td><td class="hp" style="white-space:nowrap">${esc(d.from)}</td><td class="r num">${d.rows}</td><td class="r num">${d.mistakes ? `<span class="warn">${d.mistakes}</span>` : `<span class="muted">0</span>`}</td></tr>`).join("")}</tbody></table></div>
        ${allDocs.length > docs.length ? `<button class="btn sm" data-alldocs style="margin-top:12px">Show the latest ${allDocs.length}</button>` : ""}
        <div class="working-line">The latest ${docs.length} shown${liveDocs.length ? `, including ${liveDocs.length} read live` : ""}. ${num(todayN)} read so far today, and ${num(E.units[last])} in the last 7 days.</div>`;
    } else if (tab === "weeks") {
      const wk = M.weeks.map((w, i) => ({ l: short(dayDate(w.day_offset + 6)), v: E.units[i] }));
      body = `<div class="wk3">
        <div><h4>Documents read each week</h4>${barChart(wk, { h: 170, fmt: (v) => `${v} docs`, label: (d) => `7 days to ${d.l}` })}</div>
        <div><h4>By kind, last 7 days</h4><div style="margin-top:16px">${hbars((D.kinds || []).map((k) => ({ label: esc(k.kind), v: k.docs, tip: `${k.kind}: ${k.docs} documents` })))}</div>${working(`${(D.kinds || []).map((k) => k.docs).join(" + ")} = ${(D.kinds || []).reduce((a, k) => a + k.docs, 0)} documents`)}</div>
        <div><h4>Who sends Dot photos</h4><div style="margin-top:16px">${hbars((D.senders || []).map((s) => ({ label: esc(s.who), v: s.docs, tip: `${s.who}: ${s.docs} documents in the last 7 days` })))}</div>${working(`last 7 days, ${(D.senders || []).reduce((a, s) => a + s.docs, 0)} in all`)}</div></div>`;
    } else {
      body = `<div class="lg2"><div>${ctx.feed("paperwork", 10)}</div><div><h4 class="grp" style="margin-top:0">What Dot never does</h4><ul class="nev">${(D.never || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>`;
    }
    const more = `<section class="card more"><div class="ch">${seg([["mistakes", "Mistakes caught"], ["read", "Everything read"], ["weeks", "Last 12 weeks"], ["log", "Today's log"]], tab, "tab")}<span class="r">${tab === "mistakes" ? `${E.mistakes_caught} in the last 7 days, worth ${money(E.mistakes_gbp, 0)}` : tab === "weeks" ? "rolling 7-day weeks" : ""}</span></div>${body}</section>`;

    const AM = askModel(ctx);
    host.innerHTML = `<div class="inner pg-paperwork">
      ${head({ title: "Paperwork", agent: "paperwork", lede: "Snap any sheet. Dot reads every row, handwriting included, and flags what doesn't add up." }).replace("</header>", `<button class="btn primary toask" data-toask>${ICON.ask}Ask Dot anything</button></header>`)}
      <section class="card hud hero ${cur && cur.ar < 1 ? "port" : "land"}" data-hero>
        <div class="scn"><div class="sc-wrap">${cur ? scanner(cur, D, L) : empty("No photos yet")}</div>${picks(list, cur, L)}</div>
        ${cur ? panel(cur, L) : `<div class="pn">${empty("Drop in a photo to start")}</div>`}
      </section>
      ${askCard(ctx, AM)}
      ${kpis}
      ${more}
      ${foot()}</div>`;
    const root = $(".pg-paperwork", host);
    if (cur?.status === "ready") { L.drawn[cur.key] = true; if (!L.counted[cur.key]) { L.counted[cur.key] = true; const p = $("[data-panel]", root); p.querySelectorAll("[data-count]").forEach((el) => delete el.dataset.counted); countUp(p); } }

    // ---- wiring
    const byKey = (k) => list.find((x) => x.key === k);
    const readIt = async (k) => {
      const it = byKey(k); if (!it) return;
      L.sel = k; L.view = "sheet"; L.toHero = true;
      try {
        if (it.kind === "photo") { if (it.status === "reading") return; await ctx.api(`/api/floor/docs/${it.id}/read`, {}); }
        else await ctx.act("reread", { id: it.id });
      } catch (err) { ctx.flash(err.message); }
      ctx.redraw();
    };
    $$("[data-pick]", root).forEach((el) => (el.onclick = () => { L.sel = el.dataset.pick; L.view = "sheet"; L.toHero = true; ctx.redraw(); }));
    $$("[data-read]", root).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); b.disabled = true; readIt(b.dataset.read); }));
    $$("[data-reread]", root).forEach((b) => (b.onclick = () => { b.disabled = true; readIt(b.dataset.reread); }));
    $$("[data-pv]", root).forEach((b) => (b.onclick = () => { L.view = b.dataset.pv; ctx.redraw(); }));
    $$("[data-tab]", root).forEach((b) => (b.onclick = () => { L.tab = b.dataset.tab; ctx.redraw(); }));
    const am = $("[data-allmk]", root); if (am) am.onclick = () => { L.allMk = true; ctx.redraw(); };
    // Ask Dot: the button by the title takes you to the card; Esc closes an open document (before it takes you back to the floor), arrows step through them
    LCTX = ctx; askWire(ctx, AM);
    $("[data-toask]", root).onclick = () => askScroll("[data-askcard]");
    if (!KEYS) { KEYS = (e) => { const c = LCTX; if (!c?.local.dv || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) return; if (e.key === "Escape") { e.stopImmediatePropagation(); c.local.dv = null; askDraw(c, { left: false }); } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); askStep(c, e.key === "ArrowRight" ? 1 : -1); } }; addEventListener("keydown", KEYS, true); }
    const ad = $("[data-alldocs]", root); if (ad) ad.onclick = () => { L.allDocs = true; ctx.redraw(); };

    // the photo: remember the shape of dropped-in photos so the scanner frames them properly
    const img = $("[data-img]", root);
    if (img && cur?.kind === "upload") { const fit = () => { if (img.naturalWidth) { const ar = +(img.naturalWidth / img.naturalHeight).toFixed(4); if (L.ar[cur.src] !== ar) { L.ar[cur.src] = ar; img.closest("[data-scope]").style.setProperty("--ar", ar); } } }; img.complete ? fit() : (img.onload = fit); }
    // a running clock while Dot reads
    if (cur?.status === "reading") TICK = setInterval(() => { const el = $("[data-elapsed]", root); if (!el || !document.contains(el)) return clearInterval(TICK); el.textContent = mmss(Date.now() - cur.startedAt); }, 1000);

    // drop zone / file picker (the whole page accepts a dropped photo)
    const file = $("[data-file]", root), drop = $("[data-drop]", root);
    $$("[data-choose]", root).forEach((b) => (b.onclick = () => file.click()));
    file.onchange = () => { const f = file.files?.[0]; file.value = ""; send(f, ctx); };
    root.ondragover = (e) => { if ([...(e.dataTransfer?.types || [])].includes("Files")) { e.preventDefault(); drop.classList.add("over"); } };
    root.ondragleave = (e) => { if (!root.contains(e.relatedTarget)) drop.classList.remove("over"); };
    root.ondrop = (e) => { e.preventDefault(); drop.classList.remove("over"); send(e.dataTransfer?.files?.[0], ctx); };

    // the open sheet: edits update tiles, chart and totals as you type; saved when you leave the cell
    if (cur && cur.status === "ready") {
      const dash = cur.dash, pn = $("[data-panel]", root);
      const save = (body) => (cur.kind === "photo" ? ctx.api(`/api/floor/docs/${cur.id}/edit`, body) : ctx.act("edit", { id: cur.id, ...body })).catch((err) => ctx.flash(err.message));
      const refresh = () => {
        measures(dash).forEach((m, i) => { const el = $(`[data-m="${i}"]`, pn); if (el && el.textContent !== m.value) { el.textContent = m.value; el.classList.add("bump"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("bump"), 900); } });
        const chEl = $("[data-chart]", pn), ch = chartOf(dash); if (chEl && ch) { chEl.innerHTML = ch.html; wireTips(host); }
        const sums = sumCols(dash); $$("[data-sum]", pn).forEach((el) => { const ci = +el.dataset.sum; el.textContent = sumText(cleanRows(dash), ci, sums.get(ci)); });
      };
      $$("[data-cell]", pn).forEach((c) => {
        const [r, ci] = c.dataset.cell.split(":").map(Number), orig = c.textContent;
        c.addEventListener("input", () => { if (Array.isArray(dash.rows[r])) { dash.rows[r][ci] = c.textContent; refresh(); } });
        c.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); c.blur(); }
          if (e.key === "Escape") { c.textContent = orig; if (Array.isArray(dash.rows[r])) dash.rows[r][ci] = orig; refresh(); c.blur(); }
        });
        c.addEventListener("paste", (e) => { e.preventDefault(); const t = (e.clipboardData?.getData("text/plain") || "").replace(/\s+/g, " "); document.execCommand("insertText", false, t); });
        c.addEventListener("blur", () => { const v = c.textContent.trim(); if (v !== orig.trim()) save({ r, c: ci, value: v }); });
      });
      const add = $("[data-addrow]", pn);
      if (add) add.onclick = () => { add.disabled = true; L.focusRow = cleanRows(dash).length; L.focusKey = cur.key; save({ addRow: true }); };
      const csv = $("[data-csv]", pn);
      if (csv) csv.onclick = () => {
        const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const text = [cleanCols(dash), ...cleanRows(dash)].map((r) => r.map(q).join(",")).join("\r\n");
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
        a.download = (dash.title || "dot-sheet").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() + ".csv";
        a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      };
      if (L.focusKey === cur.key && cleanRows(dash).length > L.focusRow) {
        const cell = $(`[data-cell="${L.focusRow}:0"]`, pn); L.focusRow = null; L.focusKey = null;
        if (cell) setTimeout(() => { cell.scrollIntoView({ block: "nearest" }); cell.focus(); }, 0);
      }
    }
    // after picking or reading a photo, bring the scanner into view
    if (L.toHero) { L.toHero = false; const el = $("[data-hero]", root); setTimeout(() => { const p = host.getBoundingClientRect(), r = el.getBoundingClientRect(); if (r.top < p.top - 4 || r.bottom > p.bottom + 40) host.scrollTo({ top: host.scrollTop + r.top - p.top - 16, behavior: "smooth" }); }, 30); }
  },

  // while Dot is reading the photo on screen, patch the hero in place; redraw when anything else changes
  onEvent(ev, ctx) {
    if (ev.demo !== "floor") return false;
    if (ev.type === "reset") return true;
    // Ask Dot: patch just the card while she looks and answers, and don't redraw over the total while it counts up
    if (ev.type === "act" && ev.page === "paperwork" && ev.ask) { LCTX = ctx; if (HOST && $("[data-askcard]", HOST)) { askTick(); return false; } return true; }
    const A = ctx.local.ask;
    if (ev.type === "log" && ev.line?.agent === "paperwork" && A && (A.mode === "looking" || Date.now() - (A.shownAt || 0) < 2500)) return false;
    const mine = ev.type === "doc" || ev.type === "docPartial" || (ev.type === "act" && ev.page === "paperwork") || (ev.type === "log" && ev.line?.agent === "paperwork");
    if (!mine) return false;
    const cur = current(photoList(ctx), ctx.local);
    if (cur && cur.status === "reading" && `${cur.key}|${cur.status}` === SIG && patch(cur, ctx)) return false;
    return true;
  },
  leave() { clearInterval(TICK); clearInterval(ASKT); ASKT = null; if (KEYS) removeEventListener("keydown", KEYS, true); KEYS = null; LCTX = null; HOST = null; SIG = ""; },
};
