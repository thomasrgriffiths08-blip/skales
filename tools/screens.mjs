// Shoots the laptop pictures the home page's picker shows: each website's first screen as a visitor sees it.
//   node tools/screens.mjs           every website
//   node tools/screens.mjs 7 signal  those websites, by number or slug
// Writes assets/screens/NN-2160.webp (sharp laptops and big screens) and NN-1200.webp (everything else).
// 1440x900 at 1.5x, clock pinned to a weekday morning so open/closed lines read the same every time.
// Serves the repo itself, so no preview server needed. Needs Python with Pillow.
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

const OUT = path.join(ROOT, 'assets/screens');
const builds = JSON.parse(execFileSync('node', ['-e', 'console.log(JSON.stringify(require("./data/builds.js").map(x=>({n:x.n,slug:x.slug,kind:x.kind}))))'], { cwd: ROOT }));
const want = process.argv.slice(2);
const list = builds.filter(x => x.kind === 'site' && (!want.length || want.some(w => Number(w) === x.n || w === x.slug)));
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

const browser = await chromium.launch(exe ? { executablePath: exe } : {});
fs.mkdirSync(OUT, { recursive: true });
const raw = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'screens-'));
for (const x of list){
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await page.clock.install({ time: new Date('2026-10-20T10:40:00+01:00') });
  /* #s=1 tells the demo it is being shown as itself, not inside the viewer */
  await page.goto(`http://127.0.0.1:${port}/demos/${x.slug}/index.html#s=1`, { waitUntil: 'load' });
  await page.clock.runFor(3500);
  await page.waitForTimeout(400);
  const png = path.join(raw, pad(x.n) + '.png');
  await page.screenshot({ path: png });
  await page.close();
  execFileSync('python3', ['-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
for w, q in ((2160, 78), (1200, 82)):
    im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(sys.argv[2] + '-%d.webp' % w, 'WEBP', quality=q, method=6)
`, png, path.join(OUT, pad(x.n))]);
  console.log(pad(x.n), x.slug);
}
await browser.close();
server.close();
fs.rmSync(raw, { recursive: true, force: true });
