/* Self-host every demo's Google Fonts.
   Each demo ships with a <link> to fonts.googleapis.com. That is a third-party request before the
   first paint (slower, and it hands the visitor's IP to Google), so this swaps it for @font-face rules
   inlined in the page, pointing at woff2 files kept in assets/fonts/g/ and shared between demos.
   Only the latin and latin-ext subsets are kept. Safe to run again: a demo without the link is skipped.
   Usage: node tools/demo-fonts.js [slug …]   (run after tools/demos.js) */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), DEMOS = path.join(ROOT, 'demos'), OUT = path.join(ROOT, 'assets/fonts/g');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const get = (url, file) => execFileSync('curl', ['-sSfL', '-A', UA, ...(file ? ['-o', file] : []), url], { maxBuffer: 1 << 24 });
const KEEP = /^(latin|latin-ext)$/;
fs.mkdirSync(OUT, { recursive: true });

function localise(cssUrl){
  const css = get(cssUrl).toString();
  const out = [];
  for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]+})/g)){
    if (!KEEP.test(m[1])) continue;
    let rule = m[2];
    const src = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(rule)[1];
    const fam = /font-family:\s*'([^']+)'/.exec(rule)[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const name = `${fam}-${path.basename(src, '.woff2')}.woff2`;
    const file = path.join(OUT, name);
    if (!fs.existsSync(file)) get(src, file);
    rule = rule.replace(src, `../../assets/fonts/g/${name}`).replace(/\s*\n\s*/g, '');
    out.push(rule);
  }
  if (!out.length) throw new Error('no latin faces in ' + cssUrl);
  return out.join('');
}

const only = process.argv.slice(2);
for (const slug of fs.readdirSync(DEMOS).filter(s => !only.length || only.includes(s))){
  const f = path.join(DEMOS, slug, 'index.html');
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, 'utf8');
  const links = [...html.matchAll(/<link (?:rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2?\?[^"]+)"|href="(https:\/\/fonts\.googleapis\.com\/css2?\?[^"]+)" rel="stylesheet")[^>]*>/g)];
  if (!links.length){ console.log('  ' + slug.padEnd(24) + 'already local'); continue; }
  for (const l of links){
    const url = (l[1] || l[2]).replace(/&amp;/g, '&');
    html = html.replace(l[0], `<style>${localise(url)}</style>`);
  }
  html = html.replace(/<link (?:rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"|href="https:\/\/fonts\.(?:googleapis|gstatic)\.com" rel="preconnect")[^>]*>\n?/g, '');
  fs.writeFileSync(f, html);
  console.log('✓ ' + slug.padEnd(24) + links.length + ' font link(s) now served from assets/fonts/g');
}
