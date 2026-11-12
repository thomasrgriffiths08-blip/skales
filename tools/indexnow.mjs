/* Tells Bing (and the search and AI engines that read Bing's index) which pages changed, the moment the site
   publishes. Free: the IndexNow protocol, no account. Runs from .github/workflows/indexnow.yml after a push to main.
   Google does not take IndexNow; it reads the sitemap, which the build rewrites on every change. */
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const KEY = 'e36508471291916650f2368b7cb63ffd';
const sm = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const all = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
if (!all.length){ console.log('no sitemap urls'); process.exit(0); }
const home = new URL(all.reduce((a, b) => (a.length <= b.length ? a : b)));
const base = home.pathname.replace(/\/$/, '');
let changed = [];
try { changed = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' }).split('\n').filter(f => /(^|\/)index\.html$/.test(f)); } catch (e){}
const want = new Set(changed.map(f => home.origin + base + '/' + f.replace(/index\.html$/, '')));
const urls = all.filter(u => want.has(u));
if (!urls.length){ console.log('no public pages changed'); process.exit(0); }
const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: home.host, key: KEY, keyLocation: home.origin + base + '/' + KEY + '.txt', urlList: urls }) });
console.log('IndexNow', res.status, urls.length + ' pages');
