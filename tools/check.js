/* Build-time lint. Runs at the end of `node tools/build.js` and
   refuses to pass a page with: a title over 60 characters, a description missing or over 160, other
   than one H1, an image without alt, a broken internal link, a missing share image, JSON-LD that does
   not parse, or an indexable page missing from the sitemap. Redirect pages and the demo builds are skipped. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');

function check(pages, L){
  const errs = [], warn = [];
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const exists = rel => { const p = path.join(ROOT, decodeURI(rel)); return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html'))); };
  for (const pg of pages){
    if (pg.raw) continue;
    const file = pg.url.endsWith('/') ? pg.url + 'index.html' : pg.url;
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const at = m => errs.push(`${pg.url}: ${m}`);
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
    const t = title ? title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
    if (!t) at('no <title>'); else if (t.length > 60) at(`title is ${t.length} characters (max 60): ${t}`);
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    const d = desc ? desc.replace(/&amp;/g, '&').replace(/&quot;/g, '"') : '';
    if (!d) at('no meta description'); else if (d.length > 160) at(`description is ${d.length} characters (max 160)`);
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) at(`${h1} H1s (want exactly 1)`);
    (html.match(/<img\b[^>]*>/g) || []).forEach(img => { if (!/\salt="/.test(img)) at(`image without alt: ${img.slice(0, 80)}`); });
    const og = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1];
    if (!og) at('no og:image');
    else { const rel = og.replace(L.site.origin.replace(/\/$/, ''), ''); if (!exists(rel)) warn.push(`${pg.url}: share image not rendered yet (${rel})`); }
    (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).forEach(s => {
      try { JSON.parse(s.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')); } catch (e){ at('JSON-LD does not parse: ' + e.message); }
    });
    const base = path.posix.dirname(file);
    (html.match(/\s(?:href|src)="([^"#?]*)(?:[#?][^"]*)?"/g) || []).forEach(m => {
      const href = m.replace(/^\s(?:href|src)="/, '').replace(/[#?].*$/, '').replace(/"$/, '');
      if (!href || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(href)) return;
      const rel = path.posix.normalize(path.posix.join(base, href));
      if (!exists(rel)) at(`broken link: ${href}`);
    });
    if (pg.sitemap !== false && !pg.noindex && !/<meta name="robots" content="noindex/.test(html) && !sitemap.includes(`<loc>${L.abs(pg.url)}</loc>`)) at('indexable but not in the sitemap');
  }
  return { errs, warn };
}

module.exports = check;
