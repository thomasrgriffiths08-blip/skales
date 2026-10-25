/* The system demo: one app, seven doors into it.
   The readable source lives in tools/system/ (app.css, data.js, core.js, one m-*.js per part). This joins and
   minifies it into demos/system/sys.js + sys.css, shared and cached across every part, then writes a small locked
   page per part (demos/<slug>/index.html) that opens the app on that part. Switching part inside the app needs no
   new page load; ?t=<business> picks one of the six businesses.
   Run: NODE_PATH=<tools> node tools/system.js */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const site = require('../data/site.js');
const builds = require('../data/builds.js');
const guard = require('./demo-lock.js');

const SRC = process.env.SYSTEM_SRC || path.join(__dirname, 'system');
const OUT = path.resolve(__dirname, '../demos');
const ORDER = ['data.js', 'core.js', 'm-today.js', 'm-inbox.js', 'm-booking.js', 'm-quotes.js', 'm-reviews.js', 'm-reminders.js', 'm-results.js'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

(async function(){
  const js = ORDER.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join(';\n');
  const r = await minify(js, { compress: { passes: 2 }, mangle: true, format: { comments: false } });
  if (r.error) throw r.error;
  // clean-css turns a reduced-motion '.01ms' into 'NaNs' (see tools/demos.js)
  const css = new CleanCSS({ level: 1 }).minify(fs.readFileSync(path.join(SRC, 'app.css'), 'utf8')).styles.replace(/:NaNs/g, ':.01ms');
  const v = crypto.createHash('sha1').update(r.code + css).digest('hex').slice(0, 8);
  const dir = path.join(OUT, 'system'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'sys.js'), r.code);
  fs.writeFileSync(path.join(dir, 'sys.css'), css);
  const font = (/url\((\.\.\/\.\.\/assets\/fonts\/[^)]+\.woff2)\)/.exec(css) || [])[1];

  const parts = builds.filter(b => b.lane === 'system');
  for (const b of parts){
    const html = `<!doctype html>
<html lang="en-GB">
<head>${guard(b)}<meta name="robots" content="noindex,nofollow">
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(b.name)} · ${esc(site.name)}</title>
${font ? `<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin>` : ''}<link rel="stylesheet" href="../system/sys.css?v=${v}">
</head>
<body data-start="${esc(b.start || 'today')}">
<script src="../system/sys.js?v=${v}"></script>
</body>
</html>
`;
    fs.mkdirSync(path.join(OUT, b.slug), { recursive: true });
    fs.writeFileSync(path.join(OUT, b.slug, 'index.html'), html);
  }
  console.log(`system: ${parts.length} parts, sys.js ${(r.code.length / 1024).toFixed(0)}K (from ${(js.length / 1024).toFixed(0)}K), sys.css ${(css.length / 1024).toFixed(0)}K, v=${v}`);
})().catch(e => { console.error(e); process.exit(1); });
