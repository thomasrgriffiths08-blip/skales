// Renders the share cards with Playwright, so it runs anywhere (a cloud session, the weekly page
// engine, a Mac with `npx playwright`), unlike og.sh which drives the Mac's Chrome.
//   node tools/og.mjs            renders only the cards that are missing
//   node tools/og.mjs a b c      renders those keys, missing or not
// Reads tools/og-jobs.json (written by build.js) and serves the repo itself, so no preview server needed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
for (const m of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']){
  try { ({ chromium } = await import(m)); break; } catch (e){}
}
if (!chromium){ console.error('Playwright not found: npm i -D playwright, or run og.sh on the Mac.'); process.exit(1); }
const exe = ['/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));

const jobs = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/og-jobs.json'), 'utf8'));
const want = process.argv.slice(2);
const todo = want.length ? jobs.filter(j => want.includes(j.key)) : jobs.filter(j => !fs.existsSync(path.join(ROOT, 'og', j.key + '.png')));
if (!todo.length){ console.log('og: nothing to render'); process.exit(0); }

const site = (await import(path.join(ROOT, 'data/site.js'))).default;
const wm = [site.wordmark.a, site.wordmark.x, site.wordmark.b].join('|');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port, enc = encodeURIComponent;

const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
fs.mkdirSync(path.join(ROOT, 'og'), { recursive: true });
for (const j of todo){
  const url = `http://localhost:${port}/tools/og.html?wm=${enc(wm)}&t=${enc(j.title)}&k=${enc(j.kicker || '')}&s=${enc(j.sub || '')}` + (j.colour ? `&c=${enc(j.colour)}` : '') + (j.phone ? `&p=${enc(j.phone)}` : '');
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ROOT, 'og', j.key + '.png') });
  console.log('ok', j.key);
}
await browser.close(); server.close();
