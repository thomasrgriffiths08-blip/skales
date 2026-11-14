// What each desk's monitor shows: a small, real view of that employee's work, redrawn as it changes.
import { wrap } from "./scene.js";

const INK = "#16171a", INK2 = "#45474e", INK3 = "#8a8c93", LINE = "#e7e6e2", AMBER = "#e8a84b", RED = "#c4432c", GREEN = "#2d6a45";
const font = (w, s) => `${w} ${s}px Geist, system-ui, sans-serif`;
const mono = (s) => `500 ${s}px "Geist Mono", ui-monospace, monospace`;
const trunc = (g, t, w) => { t = String(t ?? ""); if (g.measureText(t).width <= w) return t; while (t.length > 1 && g.measureText(t + "…").width > w) t = t.slice(0, -1); return t + "…"; };

export function drawScreen(canvas, a, v) {
  const g = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
  g.textBaseline = "alphabetic"; g.textAlign = "left";
  g.fillStyle = "#fbfaf8"; g.fillRect(0, 0, W, H);
  // title bar
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, 68); g.fillStyle = LINE; g.fillRect(0, 68, W, 2);
  g.fillStyle = a.color; g.beginPath(); g.arc(40, 34, 18, 0, 7); g.fill();
  g.fillStyle = "#fff"; g.font = font(600, 18); g.textAlign = "center"; g.fillText(a.name[0], 40, 40); g.textAlign = "left";
  g.fillStyle = INK; g.font = font(600, 24); g.fillText(a.name, 70, 32);
  g.fillStyle = INK3; g.font = font(400, 17); g.fillText(trunc(g, v.title || a.role, W - 260), 70, 55);
  const pill = v.alert ? ["Stopped", RED, "#fbe9e5"] : v.busy ? ["Working", "#7a4d0c", "#fbefdc"] : ["Ready", GREEN, "#e8f3ec"];
  g.font = font(600, 16); const pw = g.measureText(pill[0]).width + 30;
  g.fillStyle = pill[2]; g.beginPath(); g.roundRect(W - pw - 20, 20, pw, 30, 6); g.fill();
  g.fillStyle = pill[1]; g.beginPath(); g.arc(W - pw - 4, 35, 4, 0, 7); g.fill(); g.fillText(pill[0], W - pw + 6, 41);
  const top = 92, bottom = H - 50;
  g.save(); g.beginPath(); g.rect(0, 70, W, bottom - 70); g.clip();
  (KINDS[v.kind] || KINDS.list)(g, W, top, bottom, v);
  g.restore();
  // status line
  g.fillStyle = "#fff"; g.fillRect(0, H - 46, W, 46); g.fillStyle = LINE; g.fillRect(0, H - 46, W, 2);
  g.fillStyle = v.alert ? RED : v.busy ? "#7a4d0c" : INK2; g.font = font(500, 17); g.fillText(trunc(g, v.status || "", W - 48), 24, H - 17);
}

const KINDS = {
  list(g, W, y, bottom, v) {
    for (const r of v.rows || []) {
      if (y > bottom - 40) break;
      g.fillStyle = INK; g.font = font(500, 19); g.fillText(trunc(g, r.a, W - 230), 24, y + 18);
      if (r.b) { g.fillStyle = INK3; g.font = font(400, 16); g.fillText(trunc(g, r.b, W - 230), 24, y + 42); }
      if (r.tag) {
        g.font = font(600, 15); const tw = g.measureText(r.tag).width + 20; const c = r.tone === "red" ? ["#fbe9e5", RED] : r.tone === "amber" ? ["#fbefdc", "#7a4d0c"] : r.tone === "green" ? ["#e8f3ec", GREEN] : ["#f1f0ec", INK2];
        g.fillStyle = c[0]; g.beginPath(); g.roundRect(W - tw - 24, y + 4, tw, 26, 6); g.fill(); g.fillStyle = c[1]; g.fillText(r.tag, W - tw - 14, y + 23);
      }
      y += r.b ? 62 : 44; g.fillStyle = LINE; g.fillRect(24, y - 10, W - 48, 1);
    }
    if (!(v.rows || []).length) { g.fillStyle = INK3; g.font = font(400, 19); g.fillText(v.empty || "Nothing yet", 24, y + 20); }
  },
  doc(g, W, y, bottom, v) {
    g.fillStyle = INK; g.font = font(600, 24); y = wrap(g, v.doc?.title || "", 32, y + 18, W - 64, 30, 2);
    g.font = font(400, 17); g.fillStyle = INK2;
    for (const p of v.doc?.paras || []) {
      if (y > bottom - 20) break;
      if (p.h) { g.fillStyle = INK; g.font = font(600, 18); y = wrap(g, p.h, 32, y + 8, W - 64, 24, 1); g.fillStyle = INK2; g.font = font(400, 17); continue; }
      y = wrap(g, p.t, 32, y, W - 64, 24, 4) + 4;
    }
    if (v.busy) { g.fillStyle = AMBER; g.fillRect(32 + (Date.now() % 1000 < 500 ? 0 : 1000), y - 18, 3, 20); }
  },
  grid(g, W, y, bottom, v) {
    const cols = 4, gap = 12, cw = (W - 48 - gap * (cols - 1)) / cols, ch = (bottom - y - gap * 2) / 3;
    (v.tiles || []).slice(0, 12).forEach((t, i) => {
      const x = 24 + (i % cols) * (cw + gap), yy = y + Math.floor(i / cols) * (ch + gap);
      g.globalAlpha = t.verdict === "cut" ? 0.42 : 1;
      g.fillStyle = "#fff"; g.beginPath(); g.roundRect(x, yy, cw, ch, 8); g.fill();
      g.strokeStyle = t.verdict === "winner" ? GREEN : LINE; g.lineWidth = t.verdict === "winner" ? 3 : 1.5; g.stroke();
      g.fillStyle = t.swatch || "#d8d2c6"; g.beginPath(); g.roundRect(x + 8, yy + 8, cw - 16, ch * 0.42, 5); g.fill();
      g.fillStyle = INK; g.font = font(600, 14); wrap(g, t.label, x + 10, yy + ch * 0.42 + 30, cw - 20, 17, 2);
      g.font = font(600, 13); g.fillStyle = t.verdict === "winner" ? GREEN : t.verdict === "cut" ? RED : INK3; g.fillText(t.verdict === "winner" ? "KEPT" : t.verdict === "cut" ? "CUT" : "TESTING", x + 10, yy + ch - 10);
      if (t.verdict === "cut") { g.strokeStyle = RED; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 6, yy + 6); g.lineTo(x + cw - 6, yy + ch - 6); g.stroke(); }
      g.globalAlpha = 1;
    });
  },
  bars(g, W, y, bottom, v) {
    const max = Math.max(1, ...(v.bars || []).map((b) => b.value));
    for (const b of v.bars || []) {
      if (y > bottom - 40) break;
      g.fillStyle = INK; g.font = font(500, 17); g.fillText(trunc(g, b.label, W - 200), 24, y + 16);
      g.fillStyle = INK3; g.font = mono(16); g.textAlign = "right"; g.fillText(b.note || String(b.value), W - 24, y + 16); g.textAlign = "left";
      g.fillStyle = "#ecebe7"; g.beginPath(); g.roundRect(24, y + 26, W - 48, 10, 4); g.fill();
      g.fillStyle = b.hot ? AMBER : INK; g.beginPath(); g.roundRect(24, y + 26, Math.max(6, ((W - 48) * b.value) / max), 10, 4); g.fill();
      y += 56;
    }
  },
  kanban(g, W, y, bottom, v) {
    const cols = v.columns || [], cw = (W - 48 - 12 * (cols.length - 1)) / Math.max(1, cols.length);
    cols.forEach((c, i) => {
      const x = 24 + i * (cw + 12); let yy = y;
      g.fillStyle = INK3; g.font = font(600, 14); g.fillText(`${c.name.toUpperCase()} · ${c.cards.length}`, x, yy + 12); yy += 26;
      for (const card of c.cards) {
        if (yy > bottom - 50) break;
        g.fillStyle = "#fff"; g.beginPath(); g.roundRect(x, yy, cw, 54, 6); g.fill(); g.strokeStyle = card.hot ? AMBER : LINE; g.lineWidth = card.hot ? 2.5 : 1.2; g.stroke();
        g.fillStyle = card.color || INK3; g.beginPath(); g.arc(x + 14, yy + 18, 6, 0, 7); g.fill();
        g.fillStyle = INK; g.font = font(500, 13); wrap(g, card.t, x + 26, yy + 22, cw - 34, 16, 2);
        yy += 62;
      }
    });
  },
  dash(g, W, y, bottom, v) {
    const k = v.kpis || [], kw = (W - 48 - 12 * (k.length - 1)) / Math.max(1, k.length);
    k.forEach((t, i) => { const x = 24 + i * (kw + 12); g.fillStyle = "#fff"; g.beginPath(); g.roundRect(x, y, kw, 78, 8); g.fill(); g.strokeStyle = LINE; g.lineWidth = 1.5; g.stroke(); g.fillStyle = INK; g.font = mono(26); g.fillText(trunc(g, t.value, kw - 24), x + 12, y + 38); g.fillStyle = INK3; g.font = font(400, 14); g.fillText(trunc(g, t.label, kw - 24), x + 12, y + 64); });
    y += 96;
    for (const r of (v.rows || []).slice(0, 7)) { if (y > bottom - 20) break; g.fillStyle = INK2; g.font = font(400, 15); g.fillText(trunc(g, r.join("  ·  "), W - 48), 24, y + 14); g.fillStyle = LINE; g.fillRect(24, y + 24, W - 48, 1); y += 32; }
    if (v.photo) { g.fillStyle = INK3; g.font = font(400, 18); g.fillText(v.photo, 24, y + 20); }
  },
  metrics(g, W, y, bottom, v) {
    for (const m of v.metrics || []) {
      if (y > bottom - 40) break;
      g.fillStyle = INK; g.font = font(500, 17); g.fillText(trunc(g, `${m.agent} · ${m.measure}`, W - 230), 24, y + 18);
      g.font = mono(18); g.textAlign = "right"; g.fillStyle = INK3; g.fillText(`${m.from} → `, W - 90, y + 18); g.fillStyle = m.good ? GREEN : RED; g.fillText(String(m.to), W - 24, y + 18); g.textAlign = "left";
      y += 44; g.fillStyle = LINE; g.fillRect(24, y - 12, W - 48, 1);
    }
  },
};
