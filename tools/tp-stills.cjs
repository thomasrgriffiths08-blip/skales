/* Photographs every (system part, business) pair the trade pages show, so each page's first screen paints
   the right business at once: assets/tp/<part>-<trade>.webp (1600 wide) and -800.webp. The page swaps in the
   live system on a wide screen once it has loaded; phones keep the photo and open the live one on a tap.
   Run with the site served locally:  NODE_PATH=... node tools/tp-stills.cjs [http://127.0.0.1:8801/]
   Only missing stills are taken; FORCE=1 retakes them all.  */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const { stills } = require('./pages/segments.js');
const base = process.argv[2] || 'http://127.0.0.1:8801/';
const out = path.join(__dirname, '..', 'assets', 'tp');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-'));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.25, reducedMotion: 'reduce' });
  for (const [part, t] of stills()) {
    if (!process.env.FORCE && fs.existsSync(path.join(out, `${part}-${t}.webp`))) continue;
    const p = await ctx.newPage();
    await p.goto(`${base}demos/${part}/?t=${t}#s=1`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const png = path.join(tmp, `${part}-${t}.png`);
    await p.screenshot({ path: png });
    await p.close();
    execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
im.resize((1600, 1000), Image.LANCZOS).save(sys.argv[2], 'WEBP', quality=80, method=6)
im.resize((800, 500), Image.LANCZOS).save(sys.argv[3], 'WEBP', quality=80, method=6)
`, png, path.join(out, `${part}-${t}.webp`), path.join(out, `${part}-${t}-800.webp`)]);
    console.log(part, t);
  }
  await br.close();
})();
