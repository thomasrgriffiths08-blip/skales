/* Copy-proofing the sixteen demos.
   Reads the readable, commented originals from ../showcase (soon a private repo),
   strips every comment, minifies + mangles every script and stylesheet, and prepends
   a lock so the file only renders when it has been reached from this site.
   Output: demos/<slug>/index.html   Run: NODE_PATH=<tools> node tools/demos.js */
const fs = require('fs'), path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const site = require('../data/site.js');
const builds = require('../data/builds.js');
const SRC = path.resolve(__dirname, '../../showcase');
const OUT = path.resolve(__dirname, '../demos');
const hosts = [...new Set([...site.allowedHosts, new URL(site.origin).hostname])];

function guard(b){
  const back = site.origin + '/work/' + b.slug + '/';
  const plate = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${b.name} · runs inside ${site.name}</title><style>html,body{height:100%;margin:0;background:#0E0E10;color:#fff;font:17px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}main{min-height:100%;display:grid;place-items:center;padding:24px}div{max-width:42ch}p{margin:0 0 20px;color:rgba(255,255,255,.72);font-size:1.15rem;line-height:1.45;letter-spacing:-.01em}b{color:#fff;font-weight:600}a{display:inline-flex;align-items:center;height:52px;padding:0 22px;color:#141416;background:#fff;text-decoration:none;font-weight:600;border-radius:12px}small{display:block;margin-top:22px;font-size:13px;color:rgba(255,255,255,.45)}</style></head><body><main><div><p><b>${b.name}</b> is one of ${site.name}’s working builds. It runs inside the site, not on its own.</p><a href="${back}">Open it on the site</a><small>CH ${String(b.n).padStart(2,'0')} · ${b.biz}</small></div></main></body></html>`;
  // Allow only when the visitor arrived from one of our hosts (framed by our pages, or opened from a link on them).
  return `<script>(function(){try{var h=${JSON.stringify(hosts)},r=document.referrer||"",o=r?new URL(r).hostname:"";if(o&&h.indexOf(o)>-1)return;if(/(^|[#&?])s=1(&|$)/.test(location.hash+location.search))return;}catch(e){}window.stop();document.documentElement.innerHTML=${JSON.stringify(plate.replace(/^<!doctype html><html[^>]*>/,'').replace(/<\/html>$/,''))};})();</script>`;
}

(async function(){
  let total = 0, totalOut = 0;
  for (const b of builds){
    let html = fs.readFileSync(path.join(SRC, b.file), 'utf8');
    const before = html.length;
    html = html.replace(/<!--[\s\S]*?-->/g, '');                       // every HTML comment (the "how this works" notes go)
    // stylesheets
    const cssJobs = [];
    html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, css) => {
      const out = new CleanCSS({ level: 1 }).minify(css);
      return `<style${attrs}>${out.styles}</style>`;
    });
    // scripts (inline only; external src blocks are left alone — there are none)
    const parts = html.split(/(<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>)/g);
    for (let i = 1; i < parts.length; i += 2){
      const m = /^<script([^>]*)>([\s\S]*?)<\/script>$/.exec(parts[i]);
      const attrs = m[1], js = m[2];
      if (/type=["'](?!text\/javascript|module)/.test(attrs)) continue;   // json/templates untouched
      const r = await minify(js, { compress: { passes: 2, drop_console: false }, mangle: true, format: { comments: false } });
      if (r.error) throw new Error(b.file + ': ' + r.error);
      parts[i] = `<script${attrs}>${r.code}</script>`;
    }
    html = parts.join('');
    // the lock goes first in <head>, plus noindex — the case pages are what should rank, not the raw demo
    html = html.replace(/<head([^>]*)>/i, (m) => `${m}${guard(b)}<meta name="robots" content="noindex,nofollow">`);
    // collapse blank lines left by comment removal
    html = html.replace(/\n{2,}/g, '\n');
    const dir = path.join(OUT, b.slug); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    total += before; totalOut += html.length;
    console.log(`${String(b.n).padStart(2,'0')} ${b.slug.padEnd(24)} ${(before/1024).toFixed(0).padStart(4)}K -> ${(html.length/1024).toFixed(0).padStart(4)}K`);
  }
  console.log(`total ${(total/1024).toFixed(0)}K -> ${(totalOut/1024).toFixed(0)}K, comments stripped, ${builds.length} demos locked to: ${hosts.join(', ')}`);
})().catch(e => { console.error(e); process.exit(1); });
