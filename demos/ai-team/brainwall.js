// The brain wall: the team's knowledge graph on the big screen. Nodes are notes (agents, customers, searches,
// pages, campaigns, rules, lessons, documents, things that came in); links are the [[wikilinks]] between them.
import { BY_ID } from "./agents.js";

const TYPE = {
  agent: { r: 30, c: "#ffffff" }, customer: { r: 10, c: "#d9c49e" }, search: { r: 10, c: "#79c0c4" }, page: { r: 11, c: "#a6cf9f" },
  campaign: { r: 10, c: "#e39a7e" }, rule: { r: 7, c: "#b4a4ea" }, lesson: { r: 8, c: "#c9b8ff" }, doc: { r: 11, c: "#e8a84b" },
  arrival: { r: 7, c: "#cfd3d8" }, event: { r: 12, c: "#ee6a52" },
};
const LEGEND = [["agent", "AI employee"], ["customer", "Customer"], ["search", "Search"], ["page", "Page"], ["campaign", "Ad campaign"], ["lesson", "Lesson"], ["rule", "Rule"], ["doc", "Document"], ["arrival", "Came in"]];

export function createBrainWall(canvas, tex) {
  const g = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
  const nodes = new Map(); let links = []; let sel = null, hover = null;
  let energy = 1, lastDraw = 0, replay = null;
  const AG = Object.keys(BY_ID);
  const anchor = (id) => { const i = AG.indexOf(id); const a = (i / AG.length) * Math.PI * 2 - Math.PI / 2; return { x: W / 2 + Math.cos(a) * W * 0.37, y: H / 2 + 20 + Math.sin(a) * H * 0.33 }; };

  function setGraph(graph) {
    const now = performance.now();
    const seen = new Set();
    for (const n of graph.nodes) {
      seen.add(n.id);
      let m = nodes.get(n.id);
      if (!m) {
        const nb = graph.links.find((l) => l.source === n.id || l.target === n.id);
        const other = nb && nodes.get(nb.source === n.id ? nb.target : nb.source);
        const p = n.type === "agent" ? anchor(n.agent) : other ? { x: other.x + (Math.random() - 0.5) * 60, y: other.y + (Math.random() - 0.5) * 60 } : { x: W / 2 + (Math.random() - 0.5) * 300, y: H / 2 + (Math.random() - 0.5) * 200 };
        m = { ...n, x: p.x, y: p.y, vx: 0, vy: 0, born: nodes.size ? now : now - 2000 };
        nodes.set(n.id, m);
      } else Object.assign(m, n);
    }
    for (const id of [...nodes.keys()]) if (!seen.has(id)) nodes.delete(id);
    links = graph.links.map((l) => ({ a: nodes.get(l.source), b: nodes.get(l.target) })).filter((l) => l.a && l.b);
    energy = 1;
  }
  // grow it again from nothing, oldest note first (for the "brain growing" shot)
  function startReplay(ms = 14000) {
    const order = [...nodes.values()].sort((a, b) => (a.type === "agent" ? -1 : 0) - (b.type === "agent" ? -1 : 0) || a.at - b.at);
    const t0 = performance.now();
    order.forEach((n, i) => { n.born = t0 + (n.type === "agent" ? i * 180 : 1800 + ((i - 10) / Math.max(1, order.length - 10)) * (ms - 1800)); if (n.type !== "agent") { const a = links.find((l) => l.a === n || l.b === n); const o = a && (a.a === n ? a.b : a.a); if (o) { n.x = o.x; n.y = o.y; } } });
    replay = { t0, ms }; energy = 1;
  }
  const visible = (n, now) => now >= n.born;

  function step(now) {
    const arr = [...nodes.values()].filter((n) => visible(n, now));
    for (const n of arr) {
      if (n.type === "agent") { const a = anchor(n.agent); n.vx += (a.x - n.x) * 0.06; n.vy += (a.y - n.y) * 0.06; }
      else { n.vx += (W / 2 - n.x) * 0.0006; n.vy += (H / 2 + 30 - n.y) * 0.0012; }
    }
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j]; let dx = b.x - a.x, dy = b.y - a.y; let d2 = dx * dx + dy * dy || 1; if (d2 > 90000) continue;
      const f = (a.type === "agent" || b.type === "agent" ? 2600 : 900) / d2; const d = Math.sqrt(d2); dx /= d; dy /= d;
      a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
    }
    for (const l of links) {
      if (!visible(l.a, now) || !visible(l.b, now)) continue;
      const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1, want = l.a.type === "agent" && l.b.type === "agent" ? 400 : 92;
      const f = (d - want) * 0.006; l.a.vx += (dx / d) * f; l.a.vy += (dy / d) * f; l.b.vx -= (dx / d) * f; l.b.vy -= (dy / d) * f;
    }
    let e = 0;
    for (const n of arr) { n.vx *= 0.82; n.vy *= 0.82; n.x = Math.max(40, Math.min(W - 40, n.x + n.vx)); n.y = Math.max(110, Math.min(H - 60, n.y + n.vy)); e += Math.abs(n.vx) + Math.abs(n.vy); }
    energy = e / Math.max(1, arr.length);
  }

  function draw(now) {
    g.fillStyle = "#0e1114"; g.fillRect(0, 0, W, H);
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.62); v.addColorStop(0, "rgba(40,48,58,0.55)"); v.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
    const vis = [...nodes.values()].filter((n) => visible(n, now));
    const focus = sel || hover;
    const near = new Set(focus ? links.filter((l) => l.a === focus || l.b === focus).flatMap((l) => [l.a.id, l.b.id]) : []);
    // links
    for (const l of links) {
      if (!visible(l.a, now) || !visible(l.b, now)) continue;
      const k = Math.min(1, (now - Math.max(l.a.born, l.b.born)) / 700);
      const hot = focus && (l.a === focus || l.b === focus);
      g.strokeStyle = hot ? `rgba(232,168,75,${0.9 * k})` : `rgba(210,220,232,${(focus ? 0.07 : 0.16) * k})`; g.lineWidth = hot ? 3 : 1.6;
      g.beginPath(); g.moveTo(l.a.x, l.a.y); g.lineTo(l.a.x + (l.b.x - l.a.x) * k, l.a.y + (l.b.y - l.a.y) * k); g.stroke();
    }
    // nodes
    for (const n of vis) {
      const T = TYPE[n.type] || TYPE.arrival, age = now - n.born, k = Math.min(1, age / 600), s = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.6 : 1;
      const dim = focus && !near.has(n.id) && n !== focus;
      g.globalAlpha = dim ? 0.3 : 1;
      if (age < 1400) { g.strokeStyle = `rgba(232,168,75,${1 - age / 1400})`; g.lineWidth = 3; g.beginPath(); g.arc(n.x, n.y, T.r + age / 18, 0, 7); g.stroke(); }
      if (n.type === "agent") {
        const a = BY_ID[n.agent];
        g.fillStyle = a.color; g.beginPath(); g.arc(n.x, n.y, T.r * s, 0, 7); g.fill();
        g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 3; g.stroke();
        g.fillStyle = "#fff"; g.font = "600 26px Geist, system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(a.name[0], n.x, n.y + 1);
        g.font = "600 25px Geist, system-ui"; g.textBaseline = "top"; g.fillText(a.name, n.x, n.y + T.r + 10);
        g.fillStyle = "rgba(255,255,255,0.5)"; g.font = "20px Geist, system-ui"; g.fillText(a.role, n.x, n.y + T.r + 40);
      } else {
        g.fillStyle = T.c; g.beginPath(); g.arc(n.x, n.y, T.r * s * (n === focus ? 1.5 : 1), 0, 7); g.fill();
        if (n === focus || near.has(n.id) || ["page", "doc", "event"].includes(n.type)) {
          g.fillStyle = n === focus ? "#fff" : "rgba(235,238,242,0.62)"; g.font = `${n === focus ? "600 " : ""}${n === focus ? 22 : 17}px Geist, system-ui`; g.textAlign = "left"; g.textBaseline = "middle";
          const t = n.label.length > 34 && n !== focus ? n.label.slice(0, 32) + "…" : n.label; g.fillText(t, n.x + T.r + 8, n.y);
        }
      }
      g.globalAlpha = 1;
    }
    // header + legend
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillStyle = "#fff"; g.font = "600 34px Geist, system-ui"; g.fillText("Team brain · today", 56, 70);
    g.fillStyle = "rgba(255,255,255,0.55)"; g.font = "24px Geist Mono, monospace"; g.fillText(`${vis.length} notes touched today · ${links.filter((l) => visible(l.a, now) && visible(l.b, now)).length} links`, 380, 70);
    g.font = "19px Geist, system-ui"; let x = 56;
    for (const [t, label] of LEGEND) { g.fillStyle = TYPE[t].c; g.beginPath(); g.arc(x + 7, H - 36, 7, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.6)"; g.fillText(label, x + 22, H - 30); x += g.measureText(label).width + 56; }
    g.fillStyle = "rgba(255,255,255,0.4)"; g.textAlign = "right"; g.fillText("Every dot is a note. Click one to open it.", W - 56, H - 30);
    tex.needsUpdate = true;
  }

  function tick(now) {
    const growing = replay && now - replay.t0 < replay.ms + 1500;
    if (energy > 0.05 || growing) { step(now); step(now); }
    if (energy > 0.05 || growing || now - lastDraw > 400) { draw(now); lastDraw = now; }
  }
  function pick(uv) {
    const x = uv.x * W, y = (1 - uv.y) * H; let best = null, bd = 1e9;
    for (const n of nodes.values()) { const d = Math.hypot(n.x - x, n.y - y); if (d < Math.max(28, (TYPE[n.type]?.r || 8) + 16) && d < bd) { bd = d; best = n; } }
    return best;
  }
  return { setGraph, startReplay, tick, pick, select(id) { sel = id ? nodes.get(id) || null : null; energy = Math.max(energy, 0.06); }, hover(n) { hover = n; } };
}
