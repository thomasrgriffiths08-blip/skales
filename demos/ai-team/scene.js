// The office floor: a converted Bristol harbourside warehouse under exposed kingpost trusses, late-afternoon
// light through steel-framed windows. Ten desks, each with a seated figure (architect's-model style) and a live
// screen. Everything is built in code: no downloaded models or textures.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { AGENTS } from "./agents.js";

// ------------------------------------------------------------------ quality
function detectTier() {
  const q = new URLSearchParams(location.search);
  if (q.has("hq")) return "hq";
  if (q.has("lite")) return "lite";
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
    const r = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "";
    if (/Intel|SwiftShader|llvmpipe|Mali|Adreno|PowerVR/i.test(r) || /Mobi|Android|iPhone|iPad/.test(navigator.userAgent)) return "lite";
  } catch {}
  return "hq";
}

// ------------------------------------------------------------------ helpers
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const box = (w, h, d, mat, r = 0) => new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), mat);
function shadow(o, cast = true, receive = true) { o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = receive; } }); return o; }

// ------------------------------------------------------------------ materials (all procedural)
function concreteMaps() {
  const R = rng(7);
  const map = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = "#b9b4ac"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      const x = R() * w, y = R() * h, r = 30 + R() * 160, dark = R() < 0.55;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, dark ? "rgba(90,84,76,0.07)" : "rgba(235,230,222,0.07)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 26000; i++) { const s = R(); g.fillStyle = s < 0.5 ? `rgba(70,64,58,${0.08 + R() * 0.15})` : `rgba(250,248,244,${0.06 + R() * 0.12})`; g.fillRect(R() * w, R() * h, 1 + R() * 1.6, 1 + R() * 1.6); }
    // saw-cut joints at the tile edges (every 4 m)
    g.fillStyle = "rgba(60,56,52,0.55)"; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, 3, w, 1); g.fillRect(3, 0, 1, h);
  }, { repeat: [34 / 4, 18 / 4] });
  const rough = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "rgb(0,105,0)"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const x = R() * w, y = R() * h, r = 20 + R() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,${R() < 0.5 ? 70 : 150},0,0.25)`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  }, { repeat: [34 / 4, 18 / 4], srgb: false });
  return new THREE.MeshStandardMaterial({ map, roughnessMap: rough, roughness: 1, metalness: 0, envMapIntensity: 0.9 });
}
function brickMat(seed = 3, tint = 0) {
  const R = rng(seed);
  const pal = ["#8a4a35", "#7d4130", "#93553c", "#6e3b2d", "#a0634b", "#5f3529", "#86503d", "#794536"];
  const draw = (bump) => (g, w, h) => {
    g.fillStyle = bump ? "#2a2a2a" : "#b3a796"; g.fillRect(0, 0, w, h);
    const rows = 32, cols = 10, bh = h / rows, bw = w / cols, m = 3;
    const R2 = rng(seed);
    for (let r = 0; r < rows; r++) for (let c = -1; c <= cols; c++) {
      const x = c * bw + (r % 2 ? bw / 2 : 0), y = r * bh;
      const col = pal[Math.floor(R2() * pal.length)], soot = R2() < 0.12, v = R2();
      if (bump) { const l = 170 + Math.floor(v * 60); g.fillStyle = `rgb(${l},${l},${l})`; }
      else g.fillStyle = soot ? "#4a2d25" : col;
      g.fillRect(x + m, y + m, bw - m * 2, bh - m * 2);
      if (!bump) for (let k = 0; k < 16; k++) { g.fillStyle = `rgba(${R2() < 0.5 ? "30,18,12" : "220,170,140"},${0.06 + R2() * 0.08})`; g.fillRect(x + m + R2() * (bw - 8), y + m + R2() * (bh - 8), 2 + R2() * 7, 1 + R2() * 3); }
    }
    if (tint && !bump) { g.fillStyle = `rgba(240,232,220,${tint})`; g.fillRect(0, 0, w, h); }
  };
  const map = canvasTex(1024, 1024, draw(false), { repeat: [1, 1] });
  const bump = canvasTex(1024, 1024, draw(true), { repeat: [1, 1], srgb: false });
  return { map, bump, make: (rw, rh) => { const a = map.clone(), b = bump.clone(); a.needsUpdate = b.needsUpdate = true; a.repeat.set(rw / 2.25, rh / 2.4); b.repeat.copy(a.repeat); return new THREE.MeshStandardMaterial({ map: a, bumpMap: b, bumpScale: 1.4, roughness: 0.92, metalness: 0 }); } };
}
function woodTex(base, dark, seed, w = 1024, h = 256) {
  const R = rng(seed);
  return canvasTex(w, h, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const y = R() * h, amp = 2 + R() * 6, f = 0.004 + R() * 0.01, ph = R() * 10;
      g.strokeStyle = `rgba(${dark},${0.05 + R() * 0.12})`; g.lineWidth = 0.6 + R() * 1.8; g.beginPath();
      for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * f + ph) * amp);
      g.stroke();
    }
    for (let i = 0; i < 6; i++) { const x = R() * w, y = R() * h; g.fillStyle = `rgba(${dark},0.18)`; g.beginPath(); g.ellipse(x, y, 10 + R() * 14, 3 + R() * 4, 0, 0, 7); g.fill(); }
  });
}

// ------------------------------------------------------------------ the scene
export async function createScene(host) {
  const tier = detectTier();
  const HQ = tier === "hq";
  const renderer = new THREE.WebGLRenderer({ antialias: !HQ, powerPreference: "high-performance", preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, HQ ? 1.5 : 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#d9d2c6");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  scene.fog = new THREE.Fog("#e6dccd", 26, 70);

  const camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 200);

  // ---------------------------------------------------------------- light: low sun through the harbour windows
  const sun = new THREE.DirectionalLight("#ffd6a3", 4.2);
  sun.position.set(-7, 12.5, 24);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(HQ ? 4096 : 2048, HQ ? 4096 : 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 4, far: 70 });
  sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.025;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight("#fff3e2", "#7d7266", 0.75));
  const fill = new THREE.DirectionalLight("#cfe0ff", 0.35); fill.position.set(10, 8, -12); scene.add(fill);

  // ---------------------------------------------------------------- shell
  const W = 34, D = 18, H = 6.6;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), concreteMaps());
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const bricks = brickMat(11);
  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.4), bricks.make(W, H)); wallBack.position.set(0, H / 2, -D / 2 - 0.2); scene.add(shadow(wallBack));
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, D), bricks.make(D, H)); wallL.position.set(-W / 2 - 0.2, H / 2, 0); scene.add(shadow(wallL));
  const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, D), bricks.make(D, H)); wallR.position.set(W / 2 + 0.2, H / 2, 0); scene.add(shadow(wallR));
  // gable ends above the walls (brick triangles up to the roof)
  const gable = (x) => { const s = new THREE.Shape(); s.moveTo(-D / 2 - 0.4, 0); s.lineTo(D / 2 + 0.4, 0); s.lineTo(0, 3.6); s.lineTo(-D / 2 - 0.4, 0); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false }), bricks.make(D, 3.6)); m.rotation.y = Math.PI / 2; m.position.set(x, H, 0); scene.add(shadow(m)); };
  gable(-W / 2 - 0.4); gable(W / 2);

  // front wall: brick piers + tall steel-framed windows (the light comes through here)
  const steel = new THREE.MeshStandardMaterial({ color: "#1d1e20", roughness: 0.42, metalness: 0.65 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#dfe9e6", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.08, envMapIntensity: 1.2, depthWrite: false });
  const winW = 4.4, winH = 4.6, sill = 0.55, pier = (W - 5 * winW) / 6;
  const front = new THREE.Group(); scene.add(front);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(pier, H, 0.45), bricks.make(pier, H)); p.position.set(-W / 2 + pier / 2 + i * (pier + winW), H / 2, D / 2 + 0.22); front.add(shadow(p)); }
  const sillWall = new THREE.Mesh(new THREE.BoxGeometry(W, sill, 0.45), bricks.make(W, sill)); sillWall.position.set(0, sill / 2, D / 2 + 0.22); front.add(shadow(sillWall));
  const head = new THREE.Mesh(new THREE.BoxGeometry(W, H - sill - winH, 0.45), bricks.make(W, H - sill - winH)); head.position.set(0, sill + winH + (H - sill - winH) / 2, D / 2 + 0.22); front.add(shadow(head));
  const mull = new THREE.BoxGeometry(0.045, winH, 0.07), tran = new THREE.BoxGeometry(winW, 0.045, 0.07);
  for (let i = 0; i < 5; i++) {
    const cx = -W / 2 + pier + winW / 2 + i * (pier + winW);
    for (let k = 0; k <= 6; k++) { const m = new THREE.Mesh(mull, steel); m.position.set(cx - winW / 2 + (k * winW) / 6, sill + winH / 2, D / 2 + 0.1); front.add(shadow(m, true, false)); }
    for (let k = 0; k <= 6; k++) { const m = new THREE.Mesh(tran, steel); m.position.set(cx, sill + (k * winH) / 6, D / 2 + 0.1); front.add(shadow(m, true, false)); }
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glass); gl.position.set(cx, sill + winH / 2, D / 2 + 0.12); gl.rotation.y = Math.PI; front.add(gl);
  }

  // outside: harbourside quay, water, the hill of coloured terraces and the old cranes, in afternoon haze
  const skyTex = canvasTex(2048, 1024, (g, w, h) => {
    const s = g.createLinearGradient(0, 0, 0, h * 0.7); s.addColorStop(0, "#a9bccb"); s.addColorStop(0.55, "#e9d9bd"); s.addColorStop(1, "#f6dcae"); g.fillStyle = s; g.fillRect(0, 0, w, h);
    const sunG = g.createRadialGradient(w * 0.32, h * 0.5, 0, w * 0.32, h * 0.5, 420); sunG.addColorStop(0, "rgba(255,236,196,0.9)"); sunG.addColorStop(1, "rgba(255,236,196,0)"); g.fillStyle = sunG; g.fillRect(0, 0, w, h);
    const R = rng(21);
    g.fillStyle = "#9aa5a8"; g.beginPath(); g.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 40) g.lineTo(x, h * 0.6 - Math.sin(x / w * 3.1) * 70 - 30); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    const pastel = ["#c9a89c", "#b9b7a2", "#a8b4b8", "#c7b48d", "#b49aa6", "#a9b39c", "#cfc3b0"];
    for (let row = 0; row < 7; row++) for (let x = -20; x < w; x += 22 + R() * 10) {
      const y = h * 0.6 - Math.sin(x / w * 3.1) * 70 - 30 + row * 26 + R() * 6; const bw = 18 + R() * 8, bh = 16 + R() * 8;
      g.fillStyle = pastel[Math.floor(R() * pastel.length)]; g.fillRect(x, y, bw, bh);
      g.fillStyle = "rgba(70,72,80,0.35)"; g.fillRect(x + 3, y + 4, 3, 4); g.fillRect(x + bw - 7, y + 4, 3, 4);
    }
    const haze = g.createLinearGradient(0, h * 0.45, 0, h * 0.86); haze.addColorStop(0, "rgba(240,226,204,0.55)"); haze.addColorStop(1, "rgba(240,226,204,0.15)"); g.fillStyle = haze; g.fillRect(0, h * 0.4, w, h * 0.5);
    g.fillStyle = "#58616a"; // cranes
    for (const cx of [w * 0.58, w * 0.66, w * 0.73]) {
      g.fillRect(cx, h * 0.5, 9, h * 0.32); g.fillRect(cx - 70, h * 0.48, 150, 7); g.fillRect(cx - 4, h * 0.44, 18, 40);
      g.beginPath(); g.moveTo(cx + 4, h * 0.44); g.lineTo(cx - 70, h * 0.485); g.lineTo(cx + 80, h * 0.485); g.fill();
      g.fillRect(cx - 62, h * 0.485, 2, 90);
    }
    const water = g.createLinearGradient(0, h * 0.82, 0, h); water.addColorStop(0, "#8c9a9b"); water.addColorStop(1, "#5d6b6e"); g.fillStyle = water; g.fillRect(0, h * 0.82, w, h * 0.18);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,236,200,${R() * 0.25})`; g.fillRect(R() * w, h * 0.83 + R() * h * 0.16, 10 + R() * 40, 1.5); }
  }, { repeat: [1, 1], aniso: 4 });
  skyTex.wrapS = skyTex.wrapT = THREE.ClampToEdgeWrapping;
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(130, 65), new THREE.MeshBasicMaterial({ map: skyTex, fog: false, toneMapped: false }));
  sky.position.set(-6, 14, 48); sky.rotation.y = Math.PI; scene.add(sky);
  const quay = new THREE.Mesh(new THREE.PlaneGeometry(80, 12), new THREE.MeshStandardMaterial({ color: "#a39a8d", roughness: 0.95 }));
  quay.rotation.x = -Math.PI / 2; quay.position.set(0, -0.02, D / 2 + 6.4); quay.receiveShadow = true; scene.add(quay);

  // roof: boarded underside on purlins, carried by kingpost trusses every 4 m
  const fir = woodTex("#8a6745", "60,38,20", 5, 1024, 128);
  const timber = new THREE.MeshStandardMaterial({ map: fir, roughness: 0.8 });
  const boards = woodTex("#6f5640", "40,26,14", 9, 1024, 1024); boards.repeat.set(6, 1);
  const roofMat = new THREE.MeshStandardMaterial({ map: boards, roughness: 0.9, side: THREE.DoubleSide });
  const rise = 3.6, half = D / 2 + 0.4, slope = Math.hypot(half, rise), ang = Math.atan2(rise, half);
  for (const s of [-1, 1]) {
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.8, slope + 0.3), roofMat);
    roof.position.set(0, H + rise / 2 + 0.2, (s * half) / 2); roof.rotation.x = -s * Math.atan2(half, rise);
    scene.add(shadow(roof, false, true));
  }
  const beam = (a, b, w, h) => { const len = a.distanceTo(b); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, len), timber); m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); return shadow(m); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  for (let x = -W / 2 + 1; x <= W / 2 - 1; x += 4) {
    const tie = H - 0.2, apex = H + rise;
    scene.add(beam(V(x, tie, -half), V(x, tie, half), 0.22, 0.3));
    scene.add(beam(V(x, tie, -half), V(x, apex, 0), 0.2, 0.26));
    scene.add(beam(V(x, tie, half), V(x, apex, 0), 0.2, 0.26));
    scene.add(beam(V(x, tie, 0), V(x, apex - 0.05, 0), 0.22, 0.22));
    scene.add(beam(V(x, tie + 0.1, 0), V(x, tie + rise * 0.55, -half * 0.45), 0.14, 0.16));
    scene.add(beam(V(x, tie + 0.1, 0), V(x, tie + rise * 0.55, half * 0.45), 0.14, 0.16));
    const plate = box(0.24, 0.06, 0.5, steel); plate.position.set(x, tie, 0); scene.add(plate);
  }
  for (const f of [0.33, 0.66]) for (const s of [-1, 1]) scene.add(beam(V(-W / 2, H - 0.2 + rise * f + 0.2, s * half * (1 - f)), V(W / 2, H - 0.2 + rise * f + 0.2, s * half * (1 - f)), 0.14, 0.18));

  // pendants over the desks
  const shadeMat = new THREE.MeshStandardMaterial({ color: "#232426", roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide });
  const bulbMat = new THREE.MeshStandardMaterial({ color: "#fff3df", emissive: "#ffd9a0", emissiveIntensity: 3.2 });
  const cordMat = new THREE.MeshBasicMaterial({ color: "#111" });
  const pendant = (x, z, y = 3.3) => {
    const g = new THREE.Group();
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, H - 0.35 - y, 4), cordMat); cord.position.y = (H - 0.35 - y) / 2 + 0.12; g.add(cord);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), shadeMat); g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 8), bulbMat); bulb.position.y = 0.02; g.add(bulb);
    g.position.set(x, y, z); scene.add(g);
  };
  for (const x of [-7, -2.6]) for (const z of [-4.8, -1.6, 1.6, 4.8]) pendant(x + 0.6, z, 4.3);
  for (const [x, z] of [[2.2, 0], [12, 2.6], [12, 4.4], [8, -8.15], [10.8, -8.15]]) pendant(x, z, 3.1);
  if (HQ) for (const [x, z] of [[-6.4, -3], [-6.4, 3], [-2, -3], [-2, 3], [12, 3.5]]) { const l = new THREE.PointLight("#ffcf94", 3.2, 8, 2); l.position.set(x, 3.9, z); scene.add(l); }

  // ---------------------------------------------------------------- furniture
  const oak = new THREE.MeshStandardMaterial({ map: woodTex("#b98d5f", "90,58,30", 13), roughness: 0.55 });
  const black = new THREE.MeshStandardMaterial({ color: "#202124", roughness: 0.5, metalness: 0.55 });
  const plastic = new THREE.MeshStandardMaterial({ color: "#2a2b2e", roughness: 0.6 });
  const ceramic = new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.35 });
  const leaf = new THREE.MeshStandardMaterial({ color: "#3f5f36", roughness: 0.7, side: THREE.DoubleSide });
  const leaf2 = new THREE.MeshStandardMaterial({ color: "#56763f", roughness: 0.7, side: THREE.DoubleSide });
  const potMat = new THREE.MeshStandardMaterial({ color: "#8e8a84", roughness: 0.9 });

  function plant(x, z, size = 1, kind = 0) {
    const g = new THREE.Group(), R = rng(Math.floor(x * 13 + z * 7 + 99));
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * size, 0.22 * size, 0.5 * size, 24), potMat); pot.position.y = 0.25 * size; g.add(pot);
    if (kind === 0) { // fiddle-leaf fig: trunk + broad leaves
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * size, 0.035 * size, 1.5 * size, 6), new THREE.MeshStandardMaterial({ color: "#5b4632", roughness: 0.9 })); trunk.position.y = 1.2 * size; g.add(trunk);
      const lg = new THREE.SphereGeometry(0.16 * size, 8, 6); lg.scale(1, 1.4, 0.18);
      for (let i = 0; i < 38; i++) { const l = new THREE.Mesh(lg, R() < 0.5 ? leaf : leaf2); const a = R() * Math.PI * 2, r = 0.12 + R() * 0.38, y = 1.05 + R() * 1.1; l.position.set(Math.cos(a) * r * size, y * size, Math.sin(a) * r * size); l.rotation.set(R() * 1.2 - 0.6, a, R() - 0.5); g.add(l); }
    } else { // snake plant blades
      const bg = new THREE.ConeGeometry(0.05 * size, 1 * size, 4); bg.scale(1, 1, 0.25);
      for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(bg, R() < 0.5 ? leaf : leaf2); const a = R() * Math.PI * 2, r = R() * 0.14; const hgt = 0.6 + R() * 0.6; b.scale.y = hgt; b.position.set(Math.cos(a) * r * size, (0.5 + hgt * 0.5) * size, Math.sin(a) * r * size); b.rotation.set((R() - 0.5) * 0.35, a, (R() - 0.5) * 0.35); g.add(b); }
    }
    g.position.set(x, 0, z); scene.add(shadow(g)); return g;
  }

  function chair(fabric) {
    const g = new THREE.Group();
    const seat = box(0.5, 0.08, 0.48, fabric, 0.03); seat.position.y = 0.47; g.add(seat);
    const back = box(0.46, 0.52, 0.06, fabric, 0.03); back.position.set(0, 0.8, 0.25); back.rotation.x = -0.12; g.add(back);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 10), black); post.position.y = 0.26; g.add(post);
    for (let i = 0; i < 5; i++) { const leg = box(0.32, 0.03, 0.045, black); const a = (i / 5) * Math.PI * 2; leg.position.set(Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16); leg.rotation.y = -a; g.add(leg); }
    const arm = (s) => { const a = box(0.04, 0.03, 0.3, plastic, 0.01); a.position.set(s * 0.27, 0.66, 0.04); g.add(a); const p = box(0.03, 0.18, 0.03, black); p.position.set(s * 0.27, 0.56, 0.12); g.add(p); };
    arm(-1); arm(1);
    return g;
  }
  // a seated figure in frosted glass, lightly tinted in the employee's colour, with a soft rim and a faint core.
  // Fast GPUs get real transmission (the room refracts through them); the lite tier (Intel, phones) gets a cheaper
  // see-through glass: a depth pre-pass so only the front surface draws, plus the same rim and core.
  const glassDepth = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true });
  function rim(mat, color, k, edgeAlpha = 0.45) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = { value: color }; sh.uniforms.uRimK = { value: k }; sh.uniforms.uEdgeA = { value: edgeAlpha };
      sh.fragmentShader = sh.fragmentShader.replace("void main() {", "uniform vec3 uRim;\nuniform float uRimK;\nuniform float uEdgeA;\nvoid main() {")
        .replace("#include <opaque_fragment>", `#include <opaque_fragment>
          float fres = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.2);
          gl_FragColor.rgb += uRim * fres * uRimK;
          gl_FragColor.a = clamp(gl_FragColor.a + fres * uEdgeA, 0.0, 1.0);`);
    };
  }
  function glassMats(hex) {
    const bright = new THREE.Color(hex), hsl = {}; bright.getHSL(hsl); bright.setHSL(hsl.h, Math.min(0.75, hsl.s * 1.5 + 0.18), 0.62);
    const tint = new THREE.Color("#ffffff").lerp(bright, 0.16);
    const body = HQ
      ? new THREE.MeshPhysicalMaterial({ color: tint, transmission: 1, roughness: 0.14, thickness: 0.4, ior: 1.45, metalness: 0, attenuationColor: tint, attenuationDistance: 2.5, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 2.0 })
      : new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#d9e1e4").lerp(bright, 0.22), roughness: 0.08, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.8 });
    rim(body, bright, HQ ? 0.7 : 1.1, HQ ? 0.45 : 0.8);
    const coreBase = bright.clone();
    const core = new THREE.MeshBasicMaterial({ color: coreBase.clone() });
    return { body, core, coreBase };
  }
  function figure(hex) {
    const g = new THREE.Group(), parts = {}, M = glassMats(hex);
    const glass = (geom) => { const m = new THREE.Mesh(geom, M.body); if (!HQ) { m.renderOrder = 2; const d = new THREE.Mesh(geom, glassDepth); d.renderOrder = 1; m.add(d); } return m; };
    const limb = (a, b, r) => { const len = a.distanceTo(b); const m = glass(new THREE.CapsuleGeometry(r, len, 6, 16)); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m; };
    const torso = new THREE.Group(); g.add(torso); parts.torso = torso;
    torso.add(limb(V(0, 0.6, 0.78), V(0, 1.02, 0.7), 0.15));
    const coreM = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), M.core); coreM.position.set(0, 0.86, 0.73); torso.add(coreM);
    parts.core = M.core; parts.coreBase = M.coreBase;
    const headM = glass(new THREE.SphereGeometry(0.105, 32, 20)); headM.position.set(0, 1.24, 0.64); torso.add(headM); parts.head = headM;
    torso.add(limb(V(0, 1.06, 0.68), V(0, 1.16, 0.66), 0.045));
    parts.arms = [];
    for (const s of [-1, 1]) {
      const arm = new THREE.Group();
      arm.add(limb(V(s * 0.19, 1.04, 0.69), V(s * 0.21, 0.84, 0.47), 0.05));
      arm.add(limb(V(s * 0.21, 0.84, 0.47), V(s * 0.12, 0.79, 0.16), 0.042));
      torso.add(arm); parts.arms.push(arm);
      g.add(limb(V(s * 0.1, 0.55, 0.76), V(s * 0.11, 0.55, 0.36), 0.075));
      g.add(limb(V(s * 0.11, 0.53, 0.34), V(s * 0.11, 0.07, 0.3), 0.06));
    }
    g.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } }); // glass: no hard black shadow
    return { g, parts };
  }

  function monitor(w = 0.62) {
    const g = new THREE.Group(), h = w * 0.58;
    const c = document.createElement("canvas"); c.width = 768; c.height = Math.round(768 * 0.58);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const bez = box(w + 0.025, h + 0.025, 0.025, black, 0.006); g.add(bez);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    scr.position.z = 0.0135; g.add(scr);
    const neck = box(0.05, 0.2, 0.02, black); neck.position.set(0, -h / 2 - 0.06, -0.03); g.add(neck);
    const base = box(0.22, 0.012, 0.16, black, 0.004); base.position.set(0, -h / 2 - 0.155, -0.02); g.add(base);
    shadow(g, true, false); scr.castShadow = false;
    return { g, canvas: c, tex, h, screen: scr };
  }

  // ---------------------------------------------------------------- desks
  const FOCUS = new THREE.Vector2(-30, 0);
  const place = (id, x, z, opts = {}) => ({ id, x, z, ...opts });
  const SPOTS = [
    place("invoices", -7, -4.8), place("inbox", -7, -1.6), place("jobs", -7, 1.6), place("money", -7, 4.8),
    place("seo", -2.6, -4.8), place("content", -2.6, -1.6), place("ads", -2.6, 1.6), place("paperwork", -2.6, 4.8),
    place("manager", 2.4, 0, { wide: true, platform: true }), place("coach", 5.2, 5.6, { face: [12, 3.5] }),
  ];
  const desks = {};
  const pickables = [];
  const keyboardMat = new THREE.MeshStandardMaterial({ color: "#d9d6cf", roughness: 0.6 });
  for (const s of SPOTS) {
    const a = AGENTS.find((x) => x.id === s.id);
    const x = s.x + 0.03 * s.z * s.z;
    const g = new THREE.Group(); g.position.set(x, s.platform ? 0.16 : 0, s.z);
    const f = s.face ? new THREE.Vector2(s.face[0], s.face[1]) : FOCUS;
    g.rotation.y = Math.atan2(-(f.x - x), -(f.y - s.z));
    if (s.face) g.rotation.y += Math.PI; // the coach faces the room, back to the window
    scene.add(g);
    if (s.platform) { const p = box(3.4, 0.16, 2.8, new THREE.MeshStandardMaterial({ map: oak.map, roughness: 0.6 }), 0.02); p.position.set(0, -0.08, 0.35); g.add(shadow(p, false, true)); }
    const dw = s.wide ? 2.0 : 1.6;
    const top = box(dw, 0.04, 0.8, oak, 0.012); top.position.y = 0.74; g.add(top);
    for (const sx of [-1, 1]) { const leg = box(0.05, 0.72, 0.7, black); leg.position.set(sx * (dw / 2 - 0.08), 0.36, 0); g.add(leg); const foot = box(0.05, 0.04, 0.74, black); foot.position.set(sx * (dw / 2 - 0.08), 0.02, 0); g.add(foot); }
    const rail = box(dw - 0.16, 0.05, 0.03, black); rail.position.set(0, 0.6, -0.32); g.add(rail);
    const mons = s.wide ? [-0.36, 0.36] : [0];
    const screens = [];
    for (const mx of mons) { const m = monitor(); m.g.position.set(mx, 0.74 + 0.17 + m.h / 2, -0.2); if (s.wide) m.g.rotation.y = -mx * 0.5; g.add(m.g); screens.push(m); }
    const kb = box(0.42, 0.015, 0.13, keyboardMat, 0.005); kb.position.set(0, 0.765, 0.14); g.add(kb);
    const mouse = box(0.06, 0.02, 0.1, keyboardMat, 0.01); mouse.position.set(0.32, 0.77, 0.16); g.add(mouse);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.04, 0.1, 18), ceramic); mug.position.set(-0.5 - (s.wide ? 0.25 : 0), 0.81, 0.1); g.add(mug);
    if (["inbox", "seo", "paperwork", "coach"].includes(s.id)) { const p = new THREE.Group(); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 16), ceramic); pot.position.y = 0.05; p.add(pot); const bg = new THREE.ConeGeometry(0.018, 0.25, 4); bg.scale(1, 1, 0.3); const R = rng(s.z * 10 + 5); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(bg, leaf2); b.position.set((R() - 0.5) * 0.05, 0.17, (R() - 0.5) * 0.05); b.rotation.set((R() - 0.5) * 0.5, R() * 3, (R() - 0.5) * 0.5); p.add(b); } p.position.set(0.62 + (s.wide ? 0.2 : 0), 0.76, -0.22); g.add(p); }
    const fabric = new THREE.MeshStandardMaterial({ color: a.color, roughness: 0.9 });
    const ch = chair(fabric); ch.position.set(0, 0, 0.72); g.add(ch);
    const fig = figure(a.color); g.add(fig.g);
    shadow(g);
    for (const m of screens) m.screen.castShadow = false;
    fig.g.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
    // a floor status ring under the chair (glows when they're working)
    const ringMat = new THREE.MeshBasicMaterial({ color: "#e8a84b", transparent: true, opacity: 0, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.68, 64), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.012, 0.55); g.add(ring);
    g.traverse((m) => { if (m.isMesh) m.userData.agent = s.id; });
    pickables.push(g);
    desks[s.id] = { id: s.id, group: g, screens, fig, ring, ringMat, busy: false, alert: false, t0: Math.random() * 10 };
  }
  // the coach's whiteboard
  const wbC = document.createElement("canvas"); wbC.width = 1024; wbC.height = 640;
  const wbTex = new THREE.CanvasTexture(wbC); wbTex.colorSpace = THREE.SRGBColorSpace;
  { const g = new THREE.Group(); const board = box(1.7, 1.06, 0.03, new THREE.MeshStandardMaterial({ color: "#f7f7f4", roughness: 0.3 }), 0.01); board.position.y = 1.55; g.add(board);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 1.0), new THREE.MeshStandardMaterial({ map: wbTex, roughness: 0.35 })); face.position.set(0, 1.55, 0.017); g.add(face);
    for (const sx of [-0.7, 0.7]) { const l = box(0.03, 1.6, 0.03, black); l.position.set(sx, 0.8, -0.03); g.add(l); const ft = box(0.04, 0.03, 0.5, black); ft.position.set(sx, 0.015, -0.03); g.add(ft); }
    const d = desks.coach.group; g.position.copy(d.position); g.rotation.y = d.rotation.y; g.translateX(1.45); g.translateZ(-0.2); g.rotateY(-0.5); scene.add(shadow(g)); g.traverse((m) => { if (m.isMesh) m.userData.agent = "coach"; }); }

  // ---------------------------------------------------------------- the brain wall (left gable) and the numbers screen (right wall)
  function wallScreen(w, h, px) {
    const c = document.createElement("canvas"); c.width = px; c.height = Math.round((px * h) / w);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const g = new THREE.Group();
    const frame = box(w + 0.12, h + 0.12, 0.08, black, 0.02); g.add(frame);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = 0.045; g.add(scr);
    return { g, canvas: c, tex, screen: scr };
  }
  const brain = wallScreen(10.4, 4.55, 2048);
  brain.g.position.set(-W / 2 + 0.06, 3.15, 0); brain.g.rotation.y = Math.PI / 2; scene.add(brain.g);
  brain.screen.userData.wall = "brain";
  const numbers = wallScreen(3.4, 1.9, 1280);
  numbers.g.position.set(W / 2 - 0.05, 2.5, 0.6); numbers.g.rotation.y = -Math.PI / 2; scene.add(numbers.g);
  numbers.screen.userData.wall = "numbers";
  const consoleTable = box(3.2, 0.06, 0.5, oak, 0.01); consoleTable.position.set(W / 2 - 0.4, 0.8, 0.6); consoleTable.rotation.y = Math.PI / 2; scene.add(shadow(consoleTable));

  // ---------------------------------------------------------------- the lounge, kitchen and meeting table (the right half)
  const sofaFab = new THREE.MeshStandardMaterial({ color: "#7b806f", roughness: 0.95 });
  { const g = new THREE.Group(); const base = box(2.6, 0.42, 0.95, sofaFab, 0.08); base.position.y = 0.3; g.add(base); const back = box(2.6, 0.5, 0.25, sofaFab, 0.1); back.position.set(0, 0.7, -0.38); g.add(back);
    for (const sx of [-1.22, 1.22]) { const a = box(0.22, 0.6, 0.95, sofaFab, 0.08); a.position.set(sx, 0.38, 0); g.add(a); }
    g.position.set(12.4, 0, -4.4); scene.add(shadow(g));
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.8), new THREE.MeshStandardMaterial({ color: "#c9bfae", roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(12.4, 0.005, -3.3); rug.receiveShadow = true; scene.add(rug);
    const ct = box(1.2, 0.05, 0.6, oak, 0.015); ct.position.set(12.4, 0.4, -2.9); scene.add(shadow(ct)); for (const [lx, lz] of [[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.22], [0.5, 0.22]]) { const l = box(0.04, 0.38, 0.04, black); l.position.set(12.4 + lx, 0.19, -2.9 + lz); scene.add(l); } }
  { const tbl = box(3.4, 0.05, 1.1, oak, 0.015); tbl.position.set(12, 0.75, 3.5); scene.add(shadow(tbl));
    for (const sx of [-1.5, 1.5]) { const l = box(0.06, 0.73, 0.9, black); l.position.set(12 + sx, 0.37, 3.5); scene.add(shadow(l)); }
    for (const [cx, cz, r] of [[11, 2.6, 0], [12.2, 2.6, 0], [11, 4.4, Math.PI], [12.2, 4.4, Math.PI], [13.2, 2.6, 0], [13.2, 4.4, Math.PI]]) { const c = chair(new THREE.MeshStandardMaterial({ color: "#3a3b3e", roughness: 0.9 })); c.position.set(cx, 0, cz); c.rotation.y = r; scene.add(shadow(c)); } }
  { const counter = box(8, 0.92, 0.66, new THREE.MeshStandardMaterial({ color: "#2f3a37", roughness: 0.6 }), 0.01); counter.position.set(10.5, 0.46, -8.55); scene.add(shadow(counter));
    const worktop = box(8.04, 0.04, 0.7, oak, 0.008); worktop.position.set(10.5, 0.94, -8.53); scene.add(shadow(worktop));
    const shelf = box(5, 0.04, 0.3, oak); shelf.position.set(10.5, 2.1, -8.66); scene.add(shadow(shelf));
    const R = rng(77); for (let i = 0; i < 14; i++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12 + R() * 0.12, 14), R() < 0.5 ? ceramic : new THREE.MeshStandardMaterial({ color: "#b07d55", roughness: 0.4 })); j.position.set(8.2 + i * 0.33, 2.18 + 0.06, -8.66); scene.add(shadow(j)); } }
  // the gathering spot in front of the brain wall: a rug, two long oak benches, a low table
  { const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 7.2), new THREE.MeshStandardMaterial({ color: "#b8ab95", roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(-12.4, 0.006, 0); rug.receiveShadow = true; scene.add(rug);
    for (const z of [-2.2, 2.2]) { const b = box(0.5, 0.06, 2.6, oak, 0.015); b.position.set(-11.4, 0.44, z); scene.add(shadow(b)); for (const dz of [-1.1, 1.1]) { const l = box(0.42, 0.42, 0.05, black); l.position.set(-11.4, 0.21, z + dz); scene.add(shadow(l)); } }
    const t = box(0.9, 0.05, 1.6, oak, 0.015); t.position.set(-12.6, 0.36, 0); scene.add(shadow(t)); for (const [dx, dz] of [[-0.38, -0.7], [0.38, -0.7], [-0.38, 0.7], [0.38, 0.7]]) { const l = box(0.04, 0.34, 0.04, black); l.position.set(-12.6 + dx, 0.17, dz); scene.add(l); }
    for (const [x, z] of [[-13.4, -2.6], [-13.4, 2.6]]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.44, 24), sofaFab); st.position.set(x, 0.22, z); scene.add(shadow(st)); } }
  plant(-15.3, -7.6, 1.15, 0); plant(-15.3, 7.4, 1.0, 1); plant(0.4, -7.7, 1.2, 0); plant(6.6, 7.6, 1.0, 1); plant(15.4, 7.6, 1.25, 0); plant(15.6, -6.8, 0.95, 1); plant(-4.8, 7.7, 0.9, 1); plant(9.2, 0.6, 1.1, 0);

  // ---------------------------------------------------------------- post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (HQ) { gtao = new GTAOPass(scene, camera, 16, 9); gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.1 }); gtao.blendIntensity = 0.9; composer.addPass(gtao); }
  const bloom = new UnrealBloomPass(new THREE.Vector2(16, 9), 0.32, 0.6, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vig: { value: 0.32 }, grain: { value: 0.035 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time, vig, grain; varying vec2 vUv;
      float h(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float v = 1.0 - vig * dot(d, d) * 2.2;
        float n = h(gl_FragCoord.xy + fract(time) * 917.0) - 0.5; c.rgb = c.rgb * v + n * grain; gl_FragColor = c; }`,
  });
  composer.addPass(grade);

  // ---------------------------------------------------------------- camera: views, glides, a fly-over
  const VIEWS = {
    floor: { pos: V(6.2, 3.4, 4.2), target: V(-10, 1.65, -1.2) },
    wide: { pos: V(15.5, 5.6, -7.6), target: V(-4, 1.2, 2.8) },
    brain: { pos: V(-6.2, 3.0, 2.4), target: V(-16.8, 3.0, -0.6) },
    numbers: { pos: V(10.2, 2.2, 0.9), target: V(17, 2.4, 0.6) },
  };
  function deskView(id) {
    const d = desks[id]; const g = d.group;
    const pos = V(1.35, 1.78, 2.7).applyMatrix4(g.matrixWorld), target = V(-0.1, 1.0, -0.3).applyMatrix4(g.matrixWorld);
    if (id === "manager") { pos.copy(V(1.2, 1.9, 2.5).applyMatrix4(g.matrixWorld)); }
    return { pos, target };
  }
  const cam = { pos: VIEWS.floor.pos.clone(), target: VIEWS.floor.target.clone(), anim: null, follow: null, offset: 0, offsetTo: 0, portrait: false };
  // inside the brick walls, under the roof trusses (their tie beams sit at 6.25–6.55 m)
  const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
  function inside(p) { p.x = clampN(p.x, -W / 2 + 0.8, W / 2 - 0.8); p.y = clampN(p.y, 0.9, 5.7); p.z = clampN(p.z, -D / 2 + 0.8, D / 2 - 0.8); return p; }
  scene.updateMatrixWorld(true);
  function glide(to, ms = 1800) {
    return new Promise((res) => { cam.anim = { from: { pos: cam.pos.clone(), target: cam.target.clone() }, to, t0: performance.now(), ms, res, path: null }; });
  }
  function flyOver(ms = 15000) {
    const path = new THREE.CatmullRomCurve3([V(15.6, 5.6, -7.8), V(10, 5.5, -2), V(4.5, 4.9, 3.6), V(0.4, 3.6, 6.4), V(-4.8, 2.4, 6.6), V(-4.9, 1.9, 0.2), V(-9.5, 2.6, -1.4), V(-5, 3.5, 6.7), VIEWS.floor.pos.clone()], false, "catmullrom", 0.4);
    const look = new THREE.CatmullRomCurve3([V(-4, 1.2, 1.6), V(-6, 1.4, 0), V(-8, 1.2, -1), V(-8, 1.1, -2), V(-8.5, 1.3, -2.5), V(-14, 2.4, -1), V(-16.8, 3, 0), V(-8, 1.5, -1), VIEWS.floor.target.clone()], false, "catmullrom", 0.4);
    return new Promise((res) => { cam.anim = { path, look, t0: performance.now(), ms, res }; });
  }

  // ---------------------------------------------------------------- the job that passes desk to desk
  const packets = [];
  function packetCard(label, sub) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 300;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(6, 6, 500, 288, 22); g.fill();
    g.strokeStyle = "#e8a84b"; g.lineWidth = 6; g.stroke();
    g.fillStyle = "#e8a84b"; g.fillRect(36, 40, 70, 8);
    g.fillStyle = "#16171a"; g.font = "600 40px Geist, system-ui, sans-serif";
    wrap(g, label, 36, 108, 440, 46, 3);
    g.fillStyle = "#6b6e76"; g.font = "28px Geist, system-ui, sans-serif"; g.fillText(sub, 36, 262);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
    return m;
  }
  function anchor(id) { const d = desks[id]; return V(0, 1.72, -0.1).applyMatrix4(d.group.matrixWorld); }
  function sendPacket(from, to, label, sub, { ms = 2600, follow = true } = {}) {
    return new Promise((res) => {
      const m = packetCard(label, sub); scene.add(m);
      const a = anchor(from), b = anchor(to), mid = a.clone().add(b).multiplyScalar(0.5); mid.y += 1.6 + a.distanceTo(b) * 0.12;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      packets.push({ m, curve, t0: performance.now(), ms, res, follow });
    });
  }

  // ---------------------------------------------------------------- picking
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const handlers = { pick: () => {}, wall: () => {} };
  let down = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects([...pickables, brain.screen, numbers.screen], true);
    const h = hits[0];
    if (!h) return;
    if (h.object.userData.wall) return handlers.wall(h.object.userData.wall, h.uv);
    if (h.object.userData.agent) handlers.pick(h.object.userData.agent);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const h = ray.intersectObjects([...pickables, brain.screen, numbers.screen], true)[0];
    renderer.domElement.style.cursor = h && (h.object.userData.agent || h.object.userData.wall) ? "pointer" : "";
  });
  // drag turns your head where you stand; scroll walks you forward or back. The camera never leaves the room.
  let drag = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { if (cam.anim) return; drag = { x: e.clientX, y: e.clientY, dir: cam.target.clone().sub(cam.pos) }; });
  addEventListener("pointerup", () => (drag = null));
  addEventListener("pointermove", (e) => {
    if (!drag || cam.anim) return;
    const dx = (e.clientX - drag.x) / 500, dy = (e.clientY - drag.y) / 500;
    const sph = new THREE.Spherical().setFromVector3(drag.dir);
    sph.theta += dx; sph.phi = Math.min(2.2, Math.max(0.95, sph.phi - dy));
    cam.target.copy(cam.pos).add(new THREE.Vector3().setFromSpherical(sph));
  });
  renderer.domElement.addEventListener("wheel", (e) => {
    if (cam.anim) return; e.preventDefault();
    const step = -Math.max(-120, Math.min(120, e.deltaY)) * 0.012;
    const before = cam.pos.clone();
    cam.pos.addScaledVector(cam.target.clone().sub(cam.pos).normalize(), step); inside(cam.pos);
    cam.target.add(cam.pos.clone().sub(before));
  }, { passive: false });

  // ---------------------------------------------------------------- sizing (16:9, or a 9:16 stage for filming)
  let vw = 1, vh = 1;
  function resize() {
    const r = host.getBoundingClientRect(); vw = Math.max(1, r.width); vh = Math.max(1, r.height);
    renderer.setSize(vw, vh, false); renderer.domElement.style.width = vw + "px"; renderer.domElement.style.height = vh + "px";
    composer.setSize(vw, vh);
    camera.aspect = vw / vh; cam.portrait = vh > vw;
    camera.fov = cam.portrait ? 58 : 36;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  // ---------------------------------------------------------------- loop
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  let last = 0, frames = 0, paused = false, snapCb = null;
  const listeners = [];
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || (paused && !snapCb)) return;
    if (!HQ && !snapCb && now - last < 32) return;
    last = now; frames++;
    const t = now / 1000;
    // camera animation
    if (cam.anim) {
      const a = cam.anim, k = Math.max(0, Math.min(1, (now - a.t0) / a.ms)), e = ease(k);
      if (a.path) { cam.pos.copy(a.path.getPointAt(e)); cam.target.copy(a.look.getPointAt(e)); }
      else { cam.pos.lerpVectors(a.from.pos, a.to.pos, e); cam.target.lerpVectors(a.from.target, a.to.target, e); }
      if (k >= 1) { cam.anim = null; a.res(); }
    }
    // packets
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i], k = Math.max(0, Math.min(1, (now - p.t0) / p.ms)), e = ease(k);
      p.curve.getPoint(e, p.m.position); p.m.lookAt(camera.position); p.m.scale.setScalar(0.8 + Math.sin(k * Math.PI) * 0.5);
      if (p.follow && !cam.anim) { tmpA.copy(p.m.position); cam.target.lerp(tmpA, 0.08); tmpB.copy(tmpA).add(V(6.5, 3.2, 4.8)); cam.pos.lerp(inside(tmpB), 0.03); }
      if (k >= 1) { scene.remove(p.m); p.m.geometry.dispose(); packets.splice(i, 1); p.res(); }
    }
    // desks: figures type when busy, floor ring glows
    for (const d of Object.values(desks)) {
      const tt = t + d.t0;
      const [l, r] = d.fig.parts.arms;
      const typing = d.busy ? 1 : 0;
      l.position.y = typing * Math.max(0, Math.sin(tt * 13)) * 0.012; r.position.y = typing * Math.max(0, Math.sin(tt * 13 + 1.7)) * 0.012;
      d.fig.parts.torso.rotation.x = d.busy ? -0.03 + Math.sin(tt * 0.7) * 0.01 : 0.06 + Math.sin(tt * 0.5) * 0.008;
      d.fig.parts.head.position.y = 1.24 + Math.sin(tt * 1.1) * 0.004;
      // the core breathes; it pulses a little brighter while they're working
      d.fig.parts.core.color.copy(d.fig.parts.coreBase).multiplyScalar(d.alert ? 1.5 : d.busy ? 1.2 + Math.sin(tt * 3.2) * 0.3 : 0.85 + Math.sin(tt * 0.9) * 0.08);
      const target = d.alert ? 0.95 : d.busy ? 0.7 + Math.sin(tt * 3) * 0.25 : 0;
      d.ringMat.opacity += (target - d.ringMat.opacity) * 0.1;
      d.ringMat.color.set(d.alert ? "#d4462f" : "#e8a84b");
    }
    if (!cam.anim) inside(cam.pos);
    camera.position.copy(cam.pos); camera.lookAt(cam.target);
    // keep the scene centred in the area left of an open panel
    cam.offset += (cam.offsetTo - cam.offset) * 0.12;
    if (Math.abs(cam.offset) > 0.5) camera.setViewOffset(vw, vh, cam.offset, 0, vw, vh); else camera.clearViewOffset();
    grade.uniforms.time.value = t;
    composer.render();
    // one still of the office for the pages to sit on (read in the same task, before the buffer is cleared)
    if (snapCb) { const f = snapCb; snapCb = null; try { f(renderer.domElement); } catch {} }
    if (frames === 2) document.body.classList.add("ready");
    for (const f of listeners) f(camera, vw, vh);
  }
  requestAnimationFrame(tick);

  // project a world point to screen pixels (for the name tags)
  function project(id) {
    const d = desks[id]; const w = V(0, id === "manager" ? 1.72 : 1.58, 0.62).applyMatrix4(d.group.matrixWorld); const dist = camera.position.distanceTo(w); const p = w.project(camera);
    return { x: (p.x * 0.5 + 0.5) * vw, y: (-p.y * 0.5 + 0.5) * vh, on: p.z < 1 && p.z > -1, d: dist };
  }

  return {
    tier, scene, cam, desks, VIEWS, brain, numbers, whiteboard: { canvas: wbC, tex: wbTex },
    glide: (v, ms) => glide(typeof v === "string" ? (VIEWS[v] || deskView(v)) : v, ms),
    deskView, flyOver, sendPacket, project,
    setBusy(id, busy, alert = false) { const d = desks[id]; if (d) { d.busy = busy; d.alert = alert; } },
    setPaused(p) { paused = !!p; },
    snapshot(f) { snapCb = f; },
    setPanel(px) { cam.offsetTo = cam.portrait ? 0 : px / 2; },
    onPick(f) { handlers.pick = f; }, onWall(f) { handlers.wall = f; },
    onFrame(f) { listeners.push(f); },
    get animating() { return !!cam.anim; },
  };
}

export function wrap(g, text, x, y, maxW, lh, maxLines = 99) {
  const words = String(text).split(/\s+/); let line = "", n = 0;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(n === maxLines - 1 ? line + "…" : line, x, y); line = w; y += lh; if (++n >= maxLines) return y; }
    else line = test;
  }
  if (line) g.fillText(line, x, y);
  return y + lh;
}
