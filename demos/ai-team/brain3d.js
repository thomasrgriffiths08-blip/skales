// The team brain as a 3D hologram over a holotable: every note is a point of light, clustered round the employee
// who uses it; links are faint threads; pulses run along them when the team reaches into its memory.
// Drag to turn it, scroll to zoom, click a point to open its note. Cheap enough for an Intel laptop (one draw call
// each for points, threads, pulses and the table; no post-processing; DPR capped).
import * as THREE from "three";
import { BY_ID } from "./agents.js";

export const TYPES = {
  agent: { c: "#ffffff", s: 1.5, label: "AI employee" }, person: { c: "#ffd08a", s: 0.9, label: "Person" },
  customer: { c: "#ffc36b", s: 0.55, label: "Customer" }, property: { c: "#6fb7ff", s: 0.36, label: "Property" },
  job: { c: "#46c8ff", s: 0.36, label: "Job" }, invoice: { c: "#5ef0c0", s: 0.36, label: "Invoice" },
  email: { c: "#8fb4ff", s: 0.32, label: "Email" }, doc: { c: "#ffb547", s: 0.5, label: "Document" },
  cert: { c: "#7cf5a8", s: 0.4, label: "Certificate" }, engineer: { c: "#d6f0ff", s: 0.6, label: "Engineer" },
  supplier: { c: "#ff9ed2", s: 0.6, label: "Supplier" }, rule: { c: "#b9a6ff", s: 0.5, label: "Rule" },
  lesson: { c: "#c9b8ff", s: 0.6, label: "Lesson" }, search: { c: "#7fe3ff", s: 0.6, label: "Search" },
  page: { c: "#5ef0c0", s: 0.7, label: "Page" }, campaign: { c: "#ff8a7a", s: 0.7, label: "Ad campaign" },
  arrival: { c: "#cfe6ff", s: 0.45, label: "Came in" }, event: { c: "#ff6168", s: 0.8, label: "Event" },
};
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const hashId = (id) => { let h = 2166136261; for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const gauss = (R) => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

const PT_VERT = `attribute float size; attribute float alpha; attribute vec3 acolor; varying vec3 vColor; varying float vAlpha; uniform float uScale;
void main(){ vColor = acolor; vAlpha = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * uScale / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }`;
const PT_FRAG = `varying vec3 vColor; varying float vAlpha;
void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p); if (d > 0.5) discard; float glow = pow(1.0 - d * 2.0, 2.4); float core = smoothstep(0.17, 0.07, d);
  gl_FragColor = vec4(vColor * glow * 1.15 + vec3(1.0) * core * 0.7, (glow * 0.85 + core) * vAlpha); }`;

export function createBrain3D(host, { lite = false, labels = true, autoRotate = 0.09, interactive = true, distance = 40, threads: threadK = 1 } = {}) {
  host.classList.add("b3");
  const renderer = new THREE.WebGLRenderer({ antialias: !lite, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, lite ? 1 : 1.5));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const labelLayer = document.createElement("div"); labelLayer.className = "b3-labels"; host.appendChild(labelLayer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  let dist = distance; const target = new THREE.Vector3(0, -1, 0);
  const world = new THREE.Group(); scene.add(world);
  const brainG = new THREE.Group(); world.add(brainG);

  // ---- the holotable: rings, ticks, a faint beam and a wire globe
  const holo = new THREE.Group(); world.add(holo);
  const lineMat = (o) => new THREE.LineBasicMaterial({ color: 0x46c8ff, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const circle = (r, o, seg = 160) => { const pts = []; for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(o)); };
  const rings = [circle(10, 0.35), circle(13.5, 0.22), circle(17, 0.12)];
  rings.forEach((r) => { r.position.y = -13; holo.add(r); });
  { const pts = []; for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2, r1 = 14.2, r2 = i % 10 === 0 ? 15.4 : 14.7; pts.push(new THREE.Vector3(Math.cos(a) * r1, -13, Math.sin(a) * r1), new THREE.Vector3(Math.cos(a) * r2, -13, Math.sin(a) * r2)); }
    const ticks = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat(0.3)); holo.add(ticks); rings.push(ticks); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(14, 6, 13, 64, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying vec2 vUv; void main(){ gl_FragColor = vec4(0.27, 0.78, 1.0, (1.0 - vUv.y) * 0.07); }",
  }));
  beam.position.y = -6.5; holo.add(beam);
  const globe = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(16.5, 2)), lineMat(0.045)); brainG.add(globe);

  // ---- the graph
  let N = [], byId = new Map(), L = [], pts = null, threads = null, pulses = null, pulseState = [], agentLinks = [];
  const ptMat = new THREE.ShaderMaterial({ uniforms: { uScale: { value: 400 } }, vertexShader: PT_VERT, fragmentShader: PT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const labelEls = new Map();

  function layout(nodes, links) {
    const R = rng(4242), agents = nodes.filter((n) => n.type === "agent");
    const anchor = new Map();
    agents.forEach((n, i) => { const k = agents.length, y = 1 - (i / (k - 1 || 1)) * 2, r = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i;
      anchor.set(n.id, new THREE.Vector3(Math.cos(th) * r * 12.5, y * 8.5, Math.sin(th) * r * 12.5)); });
    const adj = new Map(nodes.map((n) => [n.id, []]));
    for (const l of links) { adj.get(l.source)?.push(l.target); adj.get(l.target)?.push(l.source); }
    const pos = new Map();
    for (const n of agents) pos.set(n.id, anchor.get(n.id).clone());
    for (const n of nodes) {
      if (pos.has(n.id)) continue;
      const ag = adj.get(n.id).filter((x) => anchor.has(x));
      if (!ag.length) continue;
      const c = ag.reduce((v, a) => v.add(anchor.get(a)), new THREE.Vector3()).multiplyScalar(1 / ag.length);
      if (ag.length > 1) c.multiplyScalar(0.72);
      const sp = ag.length > 1 ? 1.6 : 2.6, Rn = rng(hashId(n.id));
      pos.set(n.id, c.add(new THREE.Vector3(gauss(Rn) * sp, gauss(Rn) * sp * 0.8, gauss(Rn) * sp)));
    }
    for (let pass = 0; pass < 4; pass++) for (const n of nodes) {
      if (pos.has(n.id)) continue;
      const nb = adj.get(n.id).filter((x) => pos.has(x));
      if (!nb.length) continue;
      const c = nb.reduce((v, a) => v.add(pos.get(a)), new THREE.Vector3()).multiplyScalar(1 / nb.length);
      const Rn = rng(hashId(n.id));
      pos.set(n.id, c.add(new THREE.Vector3(gauss(Rn) * 1.3, gauss(Rn) * 1.1, gauss(Rn) * 1.3)));
    }
    for (const n of nodes) if (!pos.has(n.id)) { const Rn = rng(hashId(n.id)); pos.set(n.id, new THREE.Vector3(gauss(Rn) * 5, gauss(Rn) * 4, gauss(Rn) * 5)); }
    // keep points from sitting on top of each other
    const arr = nodes.map((n) => pos.get(n.id));
    for (let it = 0; it < 3; it++) {
      const grid = new Map(), key = (v) => `${Math.floor(v.x / 0.8)},${Math.floor(v.y / 0.8)},${Math.floor(v.z / 0.8)}`;
      arr.forEach((v, i) => { const k = key(v); (grid.get(k) || grid.set(k, []).get(k)).push(i); });
      for (const ids of grid.values()) for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
        const va = arr[ids[a]], vb = arr[ids[b]], d = va.distanceTo(vb);
        if (d < 0.55) { const push = new THREE.Vector3().subVectors(va, vb).normalize().multiplyScalar((0.55 - d) / 2 + 0.01); if (nodes[ids[a]].type !== "agent") va.add(push); if (nodes[ids[b]].type !== "agent") vb.sub(push); }
      }
    }
    return pos;
  }

  function setData({ nodes, links }) {
    for (const o of [pts, threads, pulses]) if (o) { brainG.remove(o); o.geometry.dispose(); }
    labelEls.forEach((el) => el.remove()); labelEls.clear();
    N = nodes.map((n) => ({ ...n })); byId = new Map(N.map((n, i) => [n.id, i]));
    L = links.filter((l) => byId.has(l.source) && byId.has(l.target));
    const pos = layout(N, L);
    const P = new Float32Array(N.length * 3), C = new Float32Array(N.length * 3), S = new Float32Array(N.length), A = new Float32Array(N.length);
    N.forEach((n, i) => {
      const p = pos.get(n.id); n.p = p; P.set([p.x, p.y, p.z], i * 3);
      const t = TYPES[n.type] || TYPES.arrival, col = new THREE.Color(n.type === "agent" && BY_ID[n.agent] ? "#ffffff" : t.c);
      C.set([col.r, col.g, col.b], i * 3); S[i] = t.s * (n.type === "agent" ? 1 : 1 + Math.min(1.2, (n.degree || 0) * 0.05)); A[i] = 1; n.size = S[i];
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("acolor", new THREE.BufferAttribute(C, 3));
    g.setAttribute("size", new THREE.BufferAttribute(S, 1)); g.setAttribute("alpha", new THREE.BufferAttribute(A, 1));
    pts = new THREE.Points(g, ptMat); brainG.add(pts);
    const LP = new Float32Array(L.length * 6), LC = new Float32Array(L.length * 6);
    L.forEach((l, k) => { const a = N[byId.get(l.source)], b = N[byId.get(l.target)]; LP.set([a.p.x, a.p.y, a.p.z, b.p.x, b.p.y, b.p.z], k * 6); });
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.BufferAttribute(LP, 3)); lg.setAttribute("color", new THREE.BufferAttribute(LC, 3));
    threads = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); brainG.add(threads);
    agentLinks = L.map((l, k) => k).filter((k) => N[byId.get(L[k].source)].type === "agent" || N[byId.get(L[k].target)].type === "agent");
    const PN = lite ? 50 : 110;
    pulseState = Array.from({ length: PN }, () => newPulse());
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PN * 3), 3));
    pg.setAttribute("acolor", new THREE.BufferAttribute(new Float32Array(PN * 3).fill(1), 3));
    pg.setAttribute("size", new THREE.BufferAttribute(new Float32Array(PN).fill(0.42), 1));
    pg.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(PN).fill(1), 1));
    pulses = new THREE.Points(pg, ptMat); brainG.add(pulses);
    if (labels) N.forEach((n) => { if (n.type !== "agent" || !BY_ID[n.agent]) return; const a = BY_ID[n.agent]; const el = document.createElement("div"); el.className = "b3-label"; el.innerHTML = `<b>${a.name}</b>`; el.title = a.role; labelLayer.appendChild(el); labelEls.set(n.id, el); });
    paint();
  }
  function newPulse(from = null) {
    const pool = from ? L.map((l, k) => k).filter((k) => L[k].source === from || L[k].target === from) : (Math.random() < 0.7 && agentLinks.length ? agentLinks : null);
    const k = pool ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * Math.max(1, L.length));
    const l = L[k] || L[0]; if (!l) return { k: 0, t: 0, v: 0 };
    const fromAgent = N[byId.get(l.target)]?.type === "agent";
    return { k, t: 0, v: 0.25 + Math.random() * 0.5, rev: fromAgent };
  }

  // ---- highlight / filter / search
  let sel = null, types = null, q = "", replay = null;
  function paint() {
    if (!pts) return;
    const A = pts.geometry.attributes.alpha, S = pts.geometry.attributes.size, near = new Set();
    if (sel) { near.add(sel); for (const l of L) { if (l.source === sel) near.add(l.target); if (l.target === sel) near.add(l.source); } }
    const ql = q.trim().toLowerCase();
    N.forEach((n, i) => {
      let a = 1;
      if (types && !types.has(n.type) && n.type !== "agent") a = 0.06;
      if (ql && !(n.label || "").toLowerCase().includes(ql) && n.type !== "agent") a = Math.min(a, 0.08);
      if (sel) a = near.has(n.id) ? 1 : Math.min(a, 0.12);
      A.array[i] = a; S.array[i] = n.size * (n.id === sel ? 2.2 : ql && (n.label || "").toLowerCase().includes(ql) ? 1.6 : 1);
    });
    if (replay) { const now = performance.now(); N.forEach((n, i) => { const k = Math.max(0, Math.min(1, (now - replay.born[i]) / 500)); A.array[i] *= k; if (k < 1 && k > 0) S.array[i] *= 1 + (1 - k) * 1.6; }); }
    A.needsUpdate = S.needsUpdate = true;
    const LC = threads.geometry.attributes.color, base = new THREE.Color(0x46c8ff);
    L.forEach((l, k) => {
      const hot = sel && (l.source === sel || l.target === sel);
      const ai = A.array[byId.get(l.source)], bi = A.array[byId.get(l.target)];
      const m = hot ? 0.9 : sel ? 0.03 : Math.min(ai, bi) * 0.16 * threadK;
      const c = hot ? new THREE.Color(0xffd08a) : base;
      LC.array.set([c.r * m, c.g * m, c.b * m, c.r * m, c.g * m, c.b * m], k * 6);
    });
    LC.needsUpdate = true;
  }

  // ---- camera, input
  let yaw = 0.6, pitch = 0.22, auto = autoRotate, idleAt = 0, drag = null, picked = () => {}, hovered = () => {};
  const ray = new THREE.Raycaster(); ray.params.Points.threshold = 0.6; const mouse = new THREE.Vector2();
  function hit(e) {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera); if (!pts) return null;
    const hits = ray.intersectObject(pts).filter((h) => pts.geometry.attributes.alpha.array[h.index] > 0.3).sort((a, b) => a.distanceToRay - b.distanceToRay);
    return hits[0] ? N[hits[0].index] : null;
  }
  if (interactive) {
    const el = renderer.domElement;
    el.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false }; el.setPointerCapture(e.pointerId); });
    el.addEventListener("pointermove", (e) => {
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; yaw = drag.yaw + dx * 0.006; pitch = Math.max(-0.5, Math.min(0.9, drag.pitch + dy * 0.004)); idleAt = performance.now(); }
      else { const n = hit(e); el.style.cursor = n ? "pointer" : "grab"; hovered(n, e); }
    });
    el.addEventListener("pointerup", (e) => { if (drag && !drag.moved) picked(hit(e)); drag = null; });
    el.addEventListener("wheel", (e) => { e.preventDefault(); dist = Math.max(16, Math.min(70, dist * (1 + e.deltaY * 0.001))); }, { passive: false });
  }

  let vw = 1, vh = 1;
  function resize() { const r = host.getBoundingClientRect(); vw = Math.max(1, r.width); vh = Math.max(1, r.height); renderer.setSize(vw, vh, false); renderer.domElement.style.width = vw + "px"; renderer.domElement.style.height = vh + "px"; camera.aspect = vw / vh; camera.updateProjectionMatrix(); ptMat.uniforms.uScale.value = (vh * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360)); }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  let visible = true; const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting)); io.observe(host);

  let raf = 0, last = performance.now(); const tmp = new THREE.Vector3();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag && now - idleAt > 2500) yaw += auto * dt;
    camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(target);
    rings[0].rotation.y += dt * 0.12; rings[1].rotation.y -= dt * 0.07; rings[3].rotation.y += dt * 0.03; globe.rotation.y -= dt * 0.02;
    if (replay) { paint(); if (now - replay.t0 > replay.ms + 800) { replay = null; paint(); } }
    if (pulses && L.length) {
      const P = pulses.geometry.attributes.position, AL = pulses.geometry.attributes.alpha;
      pulseState.forEach((s, i) => {
        s.t += s.v * dt; if (s.t >= 1) pulseState[i] = s = newPulse();
        const l = L[s.k]; if (!l) return;
        const a = N[byId.get(s.rev ? l.target : l.source)].p, b = N[byId.get(s.rev ? l.source : l.target)].p;
        tmp.lerpVectors(a, b, s.t); P.array.set([tmp.x, tmp.y, tmp.z], i * 3);
        const shown = sel ? (l.source === sel || l.target === sel ? 1 : 0.05) : 1;
        AL.array[i] = Math.sin(s.t * Math.PI) * shown;
      });
      P.needsUpdate = AL.needsUpdate = true;
    }
    renderer.render(scene, camera);
    if (labelEls.size) labelEls.forEach((el, id) => {
      const n = N[byId.get(id)]; tmp.copy(n.p).applyMatrix4(brainG.matrixWorld).project(camera);
      const on = tmp.z < 1; el.style.display = on ? "" : "none";
      el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * vw}px, ${(-tmp.y * 0.5 + 0.5) * vh}px) translate(-50%, 14px)`;
      el.style.opacity = sel && sel !== id && !L.some((l) => (l.source === sel && l.target === id) || (l.target === sel && l.source === id)) ? 0.25 : 1;
    });
  }
  raf = requestAnimationFrame(frame);

  return {
    setData,
    select(id) { sel = id && byId.has(id) ? id : null; paint(); },
    filter(set) { types = set && set.size ? set : null; paint(); },
    search(text) { q = text || ""; paint(); },
    replay(ms = 14000) {
      const order = N.map((n, i) => i).sort((a, b) => (N[a].type === "agent" ? -1 : 0) - (N[b].type === "agent" ? -1 : 0) || (N[a].day ?? N[a].at ?? 0) - (N[b].day ?? N[b].at ?? 0));
      const born = new Array(N.length), t0 = performance.now(), agents = N.filter((n) => n.type === "agent").length;
      order.forEach((idx, k) => { born[idx] = N[idx].type === "agent" ? t0 + k * 120 : t0 + 1400 + ((k - agents) / Math.max(1, N.length - agents)) * (ms - 1400); });
      replay = { t0, ms, born }; sel = null; paint();
    },
    get growing() { return !!replay; },
    burst(agent) { const id = `agent:${agent}`; if (!byId.has(id)) return; for (let i = 0; i < 14; i++) pulseState[(Math.random() * pulseState.length) | 0] = newPulse(id); },
    onPick(fn) { picked = fn; }, onHover(fn) { hovered = fn; },
    get nodes() { return N; }, get links() { return L; }, node(id) { return N[byId.get(id)]; },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); renderer.forceContextLoss?.(); host.innerHTML = ""; },
  };
}
