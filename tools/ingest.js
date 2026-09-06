/* tools/ingest.js — pull finished builds out of ../showcase into the site.
   For every ../showcase/NN-name.meta.json it: validates the fields, copies it to
   data/builds/NN-name.json, and checks the demo file exists. Then run:
     tools/stills.sh          (or tools/stills.sh NN NN …)
     NODE_PATH=<terser+clean-css> node tools/demos.js
     node tools/build.js && ./tools/og.sh
   Usage: node tools/ingest.js [NN …]   (no args = everything with a meta file) */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), SHOW = path.resolve(ROOT, '../showcase'), OUT = path.join(ROOT, 'data/builds');
const LANES = ['loud', 'motion', 'quiet', 'direct', 'broad', 'specific'];
const REQ = ['n', 'slug', 'file', 'kind', 'lane', 'trade', 'name', 'biz', 'c', 'pg', 'short', 'long', 'proves', 'tags', 'features', 'story'];
const only = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const metas = fs.readdirSync(SHOW).filter(f => f.endsWith('.meta.json'))
  .filter(f => !only.length || only.includes(f.slice(0, 2))).sort();
if (!metas.length){ console.log('no .meta.json files in ' + SHOW); process.exit(0); }
let ok = 0, bad = 0;
for (const f of metas){
  const p = path.join(SHOW, f);
  let m; try { m = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e){ console.log(`✗ ${f}: not valid JSON — ${e.message}`); bad++; continue; }
  const miss = REQ.filter(k => m[k] === undefined || m[k] === '');
  const errs = [];
  if (miss.length) errs.push('missing ' + miss.join(', '));
  if (m.kind && !['site', 'tool'].includes(m.kind)) errs.push(`kind must be site or tool, got "${m.kind}"`);
  if (m.lane && !LANES.includes(m.lane)) errs.push(`lane must be one of ${LANES.join('/')}, got "${m.lane}"`);
  if (m.kind === 'site' && !['loud','motion','quiet','direct'].includes(m.lane)) errs.push('a website needs a website lane');
  if (m.kind === 'tool' && !['broad','specific'].includes(m.lane)) errs.push('a tool needs broad or specific');
  if (m.file && !fs.existsSync(path.join(SHOW, m.file))) errs.push(`demo file ${m.file} not found`);
  if (m.short && m.short.length > 80) errs.push(`short is ${m.short.length} chars (keep it under 80)`);
  /* short and long are printed as one paragraph, so short must close its own sentence */
  if (m.short && !/[.!?…]$/.test(m.short.trim())) errs.push('short must end in a full stop — it runs straight into long on the page');
  if (m.biz && m.biz.length > 40) errs.push(`biz is ${m.biz.length} chars — it is a label ("Hair salon"), not a sentence`);
  if (m.trade && m.trade.length > 32) errs.push(`trade is ${m.trade.length} chars — keep it a short label`);
  if (!Array.isArray(m.tags) || m.tags.length < 2) errs.push('needs at least 2 tags');
  if (!Array.isArray(m.features) || m.features.length < 3) errs.push('needs at least 3 features');
  /* Tom's site quotes no prices. A demo business may have its own price board, so only a real
     figure or a rate is rejected here — not the word "price" describing what the build contains. */
  if (/[£$]\s?\d|\b\d+\s?(?:per|a)\s?(?:month|week|hour|job)\b|\bfrom \d/i.test([m.short, m.long, m.proves, m.story].join(' '))) errs.push('a price appears in the site copy');
  if (typeof m.c === 'string' && !/^#[0-9a-f]{6}$/i.test(m.c)) errs.push('c must be a #rrggbb hex');
  if (errs.length){ console.log(`✗ ${f}: ${errs.join('; ')}`); bad++; continue; }
  const shots = path.join(SHOW, f.replace('.meta.json', '.shots'));
  const note = fs.existsSync(shots) ? '' : '  (no .shots dir — run tools/stills.sh for the gallery still)';
  fs.writeFileSync(path.join(OUT, f.replace('.meta.json', '.json')), JSON.stringify(m, null, 2) + '\n');
  console.log(`✓ ${String(m.n).padStart(2, '0')} ${m.slug.padEnd(22)} ${m.kind}/${m.lane}${note}`);
  ok++;
}
console.log(`\n${ok} ingested, ${bad} rejected → data/builds/`);
if (bad) process.exitCode = 1;
