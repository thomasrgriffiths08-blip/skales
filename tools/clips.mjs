// Records the card clips: each build playing its Show me steps (data/shows.js, run by assets/show.js).
//   node tools/clips.mjs           every build
//   node tools/clips.mjs 7 signal  those builds, by number or slug
// Writes assets/clips/NN.mp4 (H.264, silent, faststart), NN.webp (the frame before it starts, the card's still)
// and assets/thumbs/NN.webp (the small picture in the viewer's list).
// Frames come straight from Chrome's screencast at full device resolution: Playwright's own recorder drew the
// websites with the bottom half grey and softened everything through VP8.
// Tools: 1280x800 at 2x, out at 1600x1000. Websites: a 390x700 phone at 2x, out at 600 wide. Clock pinned to a
// weekday morning. Serves the repo itself, so no preview server needed. Needs ffmpeg and Python with Pillow.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
for (const m of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']){
  try { ({ chromium } = await import(m)); break; } catch (e){}
}
if (!chromium){ console.error('Playwright not found: npm i -D playwright'); process.exit(1); }
const exe = ['/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));

const OUT = path.join(ROOT, 'assets/clips'), THUMBS = path.join(ROOT, 'assets/thumbs');
const CRF = process.env.CRF || '22', MAX = 9;
const builds = JSON.parse(execFileSync('node', ['-e', 'console.log(JSON.stringify(require("./data/builds.js").map(x=>({n:x.n,slug:x.slug,kind:x.kind}))))'], { cwd: ROOT }));
const SH = JSON.parse(execFileSync('node', ['-e', 'console.log(JSON.stringify(require("./data/shows.js")))'], { cwd: ROOT }));
const want = process.argv.slice(2);
const list = want.length ? builds.filter(x => want.some(w => Number(w) === x.n || w === x.slug)) : builds;
const pad = n => String(n).padStart(2, '0');

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (p.startsWith(ROOT) && fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(ROOT) || !fs.existsSync(p)){ res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const py = (src) => execFileSync('python3', ['-c', src]);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(THUMBS, { recursive: true });
for (const x of list){
  const site = x.kind === 'site';
  const vp = site ? { width: 390, height: 700 } : { width: 1280, height: 800 };
  const dsf = 2, outW = site ? 600 : 1600;
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'clip-'));
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: site, hasTouch: site, locale: 'en-GB', timezoneId: 'Europe/London' });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-10-20T10:40:00+01:00') });
  await page.goto(`http://127.0.0.1:${port}/demos/${x.slug}/#s=1`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.addScriptTag({ path: path.join(ROOT, 'assets/show.js') });
  const steps = (SH[x.slug] || []).map(s => s.wait ? { ...s, wait: Math.min(s.wait, 4500) } : s);
  await page.screenshot({ path: path.join(dir, 'first.png') });
  const cdp = await ctx.newCDPSession(page);
  const stamps = [];
  cdp.on('Page.screencastFrame', async ev => {
    stamps.push(ev.metadata.timestamp);
    fs.writeFileSync(path.join(dir, `f${String(stamps.length).padStart(5, '0')}.jpg`), Buffer.from(ev.data, 'base64'));
    try { await cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }); } catch (e){}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: vp.width * dsf, maxHeight: vp.height * dsf, everyNthFrame: 1 });
  await page.waitForTimeout(250);
  await page.evaluate(steps => new Promise(res => { window.SkShow.run(window, steps, { onEnd: res }); setTimeout(res, 9500); }), steps);
  await page.waitForTimeout(300);
  await cdp.send('Page.stopScreencast');
  await ctx.close();
  if (stamps.length < 2){ console.error(pad(x.n), x.slug, 'no frames'); continue; }
  // a frame arrives only when the page repaints, so each one stays up until the next; the last holds briefly
  const lines = [];
  for (let i = 0; i < stamps.length && stamps[i] - stamps[0] <= MAX; i++){
    const d = i + 1 < stamps.length ? stamps[i + 1] - stamps[i] : 0.3;
    lines.push(`file 'f${String(i + 1).padStart(5, '0')}.jpg'`, `duration ${Math.max(0.001, Math.min(d, MAX)).toFixed(4)}`);
  }
  lines.push(lines[lines.length - 2]);
  fs.writeFileSync(path.join(dir, 'list.txt'), lines.join('\n') + '\n');
  const mp4 = path.join(OUT, pad(x.n) + '.mp4'), still = path.join(OUT, pad(x.n) + '.webp');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-t', String(MAX),
    '-vf', `scale=${outW}:-2:flags=lanczos,fps=30,format=yuv420p`, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-tune', 'animation',
    '-movflags', '+faststart', mp4], { cwd: dir });
  py(`from PIL import Image\nim=Image.open(${JSON.stringify(path.join(dir, 'first.png'))}).convert('RGB')\nw=${outW}\nim.resize((w,round(im.height*w/im.width)),Image.LANCZOS).save(${JSON.stringify(still)},'WEBP',quality=84,method=6)`);
  thumb(x);
  console.log(pad(x.n), x.slug, stamps.length + ' frames', Math.round(fs.statSync(mp4).size / 1024) + 'KB mp4', Math.round(fs.statSync(still).size / 1024) + 'KB still');
  fs.rmSync(dir, { recursive: true, force: true });
}
// the viewer's list: a website is its phone still cropped to the top, a tool its laptop still, both small
function thumb(x){
  const site = x.kind === 'site';
  const src = site ? path.join(ROOT, 'assets/phones', pad(x.n) + '.webp') : path.join(OUT, pad(x.n) + '.webp');
  const [w, h] = site ? [120, 172] : [192, 120];
  py(`from PIL import Image\nim=Image.open(${JSON.stringify(src)}).convert('RGB')\nw,h=${w},${h}\nch=round(im.width*h/w)\nim=im.crop((0,0,im.width,min(ch,im.height))).resize((w,h),Image.LANCZOS)\nim.save(${JSON.stringify(path.join(THUMBS, pad(x.n) + '.webp'))},'WEBP',quality=82,method=6)`);
}
await browser.close(); server.close();
