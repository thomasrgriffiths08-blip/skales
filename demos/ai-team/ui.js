// Shared building blocks for the pages. Plain HTML strings; every page uses these so the app reads as one product.
// House style: Geist, one accent (amber), radius 2/6/12, spacing 4/8/12/16/20/24/32, flat cards, one ink colour in charts.
import { AGENTS, BY_ID } from "./agents.js";
export { AGENTS, BY_ID };

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const money = (n, dp = 2) => "£" + Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const num = (n, dp = 0) => Number(n || 0).toLocaleString("en-GB", { maximumFractionDigits: dp });
export const hhmm = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
// Sample data stores dates as day offsets from today, so the app always looks current.
export const dayDate = (off = 0) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
export const short = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const dayName = (d, long = false) => d.toLocaleDateString("en-GB", { weekday: long ? "long" : "short", day: "numeric", month: long ? "long" : "short" });
export const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

// people
export const av = (id, cls = "") => { const a = BY_ID[id]; return a ? `<span class="av-s ${cls}" style="background:${a.color}" aria-hidden="true">${a.name[0]}</span>` : ""; };
export const who = (id) => { const a = BY_ID[id]; return a ? `<span class="who">${av(id)}${esc(a.name)}</span>` : esc(id); };
export const nameOf = (id) => BY_ID[id]?.name || id;

// small parts
export const chip = (text, tone = "") => `<span class="chip ${tone}">${esc(text)}</span>`;
export const sec = (title, body, right = "") => `<div class="sec"><h3>${title}${right ? `<span class="r">${right}</span>` : ""}</h3>${body}</div>`;
export const note = (html, tone = "") => `<div class="note ${tone}">${html}</div>`;
export const empty = (text) => `<div class="empty">${esc(text)}</div>`;
export const foot = () => window.AI_TEAM_STATIC // site demo: on the public page nothing runs, so it says so
  ? `<div class="foot">Kingpost is a sample company. Every name and figure here is sample data. On this public page nothing runs or is sent; on a call with Tom, each live step is a real call to Claude.</div>`
  : `<div class="foot">Kingpost is a sample company. Every name and figure here is sample data. The AI work is real: each live step is a call to Claude.</div>`;

// page header: optional owner pill, title, one-line lede, actions on the right
export function head({ title, lede = "", agent = null, agents = null, actions = "" }) {
  const owner = agent ? `<div class="owner">${av(agent)}<b>${esc(BY_ID[agent].name)}</b><span>${esc(BY_ID[agent].role)}</span></div>`
    : agents ? `<div class="owner">${agents.map((a) => av(a)).join("")}</div>` : "";
  return `<header class="phead"><div>${owner}<h1>${esc(title)}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}</div>${actions ? `<div class="row">${actions}</div>` : ""}</header>`;
}
// a card; title is the small grey label at the top
export const card = (title, body, { right = "", cls = "" } = {}) => `<section class="card ${cls}">${title || right ? `<div class="ch"><h3>${title}</h3>${right ? `<div class="r">${right}</div>` : ""}</div>` : ""}${body}</section>`;
// a row of headline numbers: [{ label, value, sub, tone: "up" | "down" | "" }]
export const tiles = (items, cols = items.length) => `<div class="grid g${Math.min(cols, 4)}">${items.map((t, i) => `<section class="card tile ${i === 0 ? "hud" : ""} ${t.go ? "click" : ""}" ${t.go ? `data-go="${esc(t.go)}"` : ""}><h3>${esc(t.label)}</h3><div class="big" ${typeof t.count === "number" ? `data-count="${t.count}" data-fmt="${esc(t.fmt || "")}"` : ""}>${esc(t.value)}</div>${t.sub ? `<div class="sub ${t.tone || ""}">${esc(t.sub)}</div>` : ""}${t.working ? `<div class="working-line">${esc(t.working)}</div>` : ""}</section>`).join("")}</div>`;
// segmented control: items [[value, label]], data attribute name
export const seg = (items, current, attr) => `<div class="seg" role="tablist">${items.map(([v, l]) => `<button role="tab" aria-selected="${v === current}" data-${attr}="${esc(v)}">${l}</button>`).join("")}</div>`;
// a table: cols [{ label, r: true for right-aligned }], rows: arrays of HTML cells; rowAttr(i) adds attributes per row
export function table(cols, rows, { rowAttr = () => "", cls = "" } = {}) {
  return `<div class="tablewrap ${cls}"><table class="t"><thead><tr>${cols.map((c) => `<th class="${c.r ? "r" : ""}">${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${rows.map((r, i) => `<tr ${rowAttr(i)}>${r.map((cell, ci) => `<td class="${cols[ci]?.r ? "r num" : ""}">${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
// a score / progress bar 0..1
export const meter = (v, label = "") => `<span class="meter"><i><b style="width:${Math.max(0, Math.min(1, v)) * 100}%"></b></i>${label ? `<em class="num">${esc(label)}</em>` : ""}</span>`;

// charts: one series, one ink colour, quiet grid, hover tips (call wireTips(host) after rendering).
// The axis shows d.l (keep it short, e.g. "27 Aug"); `label(d)` is only the hover tip.
export function barChart(data, { h = 180, fmt = (v) => v, label = (d) => d.l, every = 2 } = {}) {
  const max = Math.max(1, ...data.map((d) => d.v)) * 1.1, W = 100 / data.length;
  const ticks = [0, 0.5, 1].map((k) => max * k);
  return `<div class="chart" style="height:${h}px">${ticks.map((t) => `<i class="gl" style="bottom:${(t / max) * 100}%"><span>${esc(fmt(Math.round(t)))}</span></i>`).join("")}
    ${data.map((d, i) => `<div class="bc" style="left:${i * W}%;width:${W}%" data-tip="${esc(label(d))}: ${esc(fmt(d.v))}"><b style="height:${(d.v / max) * 100}%" class="${d.hot || (d.hot === undefined && i === data.length - 1) ? "last" : ""}"></b></div>`).join("")}</div>
    <div class="xl">${data.map((d, i) => `<span style="width:${W}%">${(data.length - 1 - i) % every === 0 ? esc(d.l) : ""}</span>`).join("")}</div>`;
}
export function lineChart(data, { h = 180, fmt = (v) => v, label = (d) => d.l, every = 3, min: lo, max: hi, invert = false } = {}) {
  const vs = data.map((d) => d.v);
  const min = lo ?? Math.min(...vs) * 0.94, max = hi ?? Math.max(...vs) * 1.03, span = max - min || 1;
  const x = (i) => (data.length < 2 ? 50 : (i / (data.length - 1)) * 100), y = (v) => (invert ? ((v - min) / span) * 100 : 100 - ((v - min) / span) * 100);
  const pts = data.map((d, i) => `${x(i)},${y(d.v)}`).join(" "), uid = Math.random().toString(36).slice(2, 7);
  return `<div class="chart line" style="height:${h}px">${[min, (min + max) / 2, max].map((t) => `<i class="gl" style="bottom:${100 - y(t)}%"><span>${esc(fmt(Math.round(t)))}</span></i>`).join("")}
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="lg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46c8ff" stop-opacity=".28"/><stop offset="1" stop-color="#46c8ff" stop-opacity="0"/></linearGradient></defs><polygon points="0,100 ${pts} 100,100" fill="url(#lg${uid})"/><polyline points="${pts}" fill="none" stroke="#46c8ff" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px rgba(70,200,255,.8))"/></svg>
    ${data.map((d, i) => `<div class="pt" style="left:${x(i)}%;top:${y(d.v)}%" data-tip="${esc(label(d))}: ${esc(fmt(d.v))}"><i></i></div>`).join("")}</div>
    <div class="xl">${data.map((d, i) => `<span style="width:${100 / data.length}%">${(data.length - 1 - i) % every === 0 ? esc(d.l) : ""}</span>`).join("")}</div>`;
}
// horizontal bars: [{ label (HTML ok), v, tip }]
export function hbars(items, { fmt = (v) => v, max } = {}) {
  const m = max ?? Math.max(1, ...items.map((x) => x.v));
  return `<div class="hbars">${items.map((x) => `<div class="hb" data-tip="${esc(x.tip || fmt(x.v))}"><span>${x.label}</span><i><b style="width:${(x.v / m) * 100}%"></b></i><em class="num">${esc(fmt(x.v))}</em></div>`).join("")}</div>`;
}
export function wireTips(host) {
  let tip = $(":scope > .tip", host); if (!tip) { tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; host.appendChild(tip); }
  $$("[data-tip]", host).forEach((el) => {
    el.onmouseenter = () => { tip.textContent = el.dataset.tip; tip.hidden = false; };
    el.onmousemove = (e) => { const r = host.getBoundingClientRect(); tip.style.left = e.clientX - r.left + 12 + "px"; tip.style.top = e.clientY - r.top + host.scrollTop - 34 + "px"; };
    el.onmouseleave = () => (tip.hidden = true);
  });
}
// tiny markdown: headings, bullets, bold, [[links]]
export function md(src) {
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[\[(.+?)\]\]/g, (_, x) => `<a class="wl">${x}</a>`);
  let out = "", inList = false;
  for (const line of String(src || "").split("\n")) {
    if (/^- /.test(line)) { if (!inList) { out += "<ul>"; inList = true; } out += `<li>${inline(line.slice(2))}</li>`; continue; }
    if (inList) { out += "</ul>"; inList = false; }
    if (/^# /.test(line)) out += `<h1>${inline(line.slice(2))}</h1>`;
    else if (/^## /.test(line)) out += `<h2>${inline(line.slice(3))}</h2>`;
    else if (line.trim()) out += `<p>${inline(line)}</p>`;
  }
  return out + (inList ? "</ul>" : "");
}

// ---------------------------------------------------------------- HUD pieces
// "show the working": the sum behind a figure, in plain English
export const working = (text) => (text ? `<div class="working-line">${esc(text)}</div>` : "");
// the arc reactor: a ring of segments [{ v, color, label }] around a big centre figure
export function ring(segs, { size = 260, value = "", unit = "", label = "", sub = "", thick = 14 } = {}) {
  const c = size / 2, r = c - 30, tot = segs.reduce((a, s) => a + s.v, 0) || 1, gap = 0.012;
  let a0 = -Math.PI / 2;
  const arcs = segs.map((s, i) => {
    const span = (s.v / tot) * Math.PI * 2, a1 = a0 + span - gap * Math.PI * 2;
    const p = (a) => `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M${p(a0)} A${r},${r} 0 ${large} 1 ${p(Math.max(a0 + 0.001, a1))}`;
    const out = `<path d="${d}" stroke="${s.color}" stroke-width="${thick}" fill="none" stroke-linecap="butt" class="seg-arc" style="animation-delay:${i * 60}ms" data-tip="${esc(s.label)}"/>`;
    a0 += span; return out;
  }).join("");
  const ticks = Array.from({ length: 72 }, (_, i) => { const a = (i / 72) * Math.PI * 2, r1 = c - 8, r2 = c - (i % 6 === 0 ? 16 : 12); return `<line x1="${c + r1 * Math.cos(a)}" y1="${c + r1 * Math.sin(a)}" x2="${c + r2 * Math.cos(a)}" y2="${c + r2 * Math.sin(a)}"/>`; }).join("");
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}">
    <g class="ring-ticks">${ticks}</g>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(120,200,255,.08)" stroke-width="${thick + 6}"/>
    <g class="ring-arcs">${arcs}</g>
    <circle cx="${c}" cy="${c}" r="${r - thick - 10}" fill="none" stroke="rgba(120,200,255,.18)" stroke-dasharray="2 6" class="ring-spin"/>
    <circle cx="${c}" cy="${c}" r="${r - thick - 22}" fill="url(#rcore)" class="ring-core"/>
    <defs><radialGradient id="rcore"><stop offset="0" stop-color="#46c8ff" stop-opacity=".22"/><stop offset="1" stop-color="#46c8ff" stop-opacity="0"/></radialGradient></defs>
  </svg><div class="ring-c"><span class="ring-l">${esc(label)}</span><b class="num" data-count="${parseFloat(value) || 0}" data-fmt="${esc(unit)}">${esc(value)}${unit ? `<small>${esc(unit)}</small>` : ""}</b><span class="ring-s">${esc(sub)}</span></div></div>`;
}
// a tiny glowing trend line for tiles
export function spark(vals, { w = 120, h = 32, color = "#46c8ff" } = {}) {
  const lo = Math.min(...vals), hi = Math.max(...vals), sp = hi - lo || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - 3 - ((v - lo) / sp) * (h - 6)}`).join(" ");
  const last = pts.split(" ").pop().split(",");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px ${color})"/><circle cx="${last[0]}" cy="${last[1]}" r="2.6" fill="#fff"/></svg>`;
}
// count numbers up from zero when a page draws (keeps prefixes/suffixes: "£4,876", "58 h", "96%")
// Site demo fix: the count ran only on animation frames, so whenever frames stalled (the 3D office and the brain
// hologram drawing in software, a background tab, a screen capture) the figure sat part-way, e.g. the Home ring at
// 174.8 h of 205.8 h. Now Reduce Motion skips the count (the figure is drawn final), and a timer always lands it.
export const stillMotion = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
export function countUp(host) {
  const still = stillMotion();
  host.querySelectorAll("[data-count]").forEach((el) => {
    if (el.dataset.counted) return; el.dataset.counted = "1";
    if (still) return;
    const target = Number(el.dataset.count); if (!isFinite(target) || target === 0) return;
    const txt = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null; if (!txt) return;
    const orig = txt.textContent, m = orig.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/); if (!m) return;
    const dp = (m[2].split(".")[1] || "").length, t0 = performance.now(), dur = 900;
    let done = false;
    const land = () => { done = true; txt.textContent = orig; };
    const step = (t) => { if (done) return; const k = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3); txt.textContent = m[1] + (target * e).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }) + m[3]; if (k < 1) requestAnimationFrame(step); else land(); };
    requestAnimationFrame(step);
    setTimeout(land, dur + 150);
  });
}
// a live dot: cyan pulsing when busy, amber when someone's needed, grey when idle
export const dot = (state = "") => `<i class="ldot ${state}"></i>`;
