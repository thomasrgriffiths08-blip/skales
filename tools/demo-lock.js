/* The lock every demo page carries first in <head>: it only renders when reached from this site (framed by our
   pages, opened from a link on them, or with #s=1); anywhere else it swaps itself for a plate pointing back here.
   Used by tools/demos.js (the showcase builds) and tools/system.js (the system's parts). */
const site = require('../data/site.js');
const hosts = [...new Set([...site.allowedHosts, new URL(site.origin).hostname])];

function guard(b){
  const back = site.origin + '/work/' + b.slug + '/';
  const plate = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${b.name} · runs inside ${site.name}</title><style>html,body{height:100%;margin:0;background:#0E0E10;color:#fff;font:17px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}main{min-height:100%;display:grid;place-items:center;padding:24px}div{max-width:42ch}p{margin:0 0 20px;color:rgba(255,255,255,.72);font-size:1.15rem;line-height:1.45;letter-spacing:-.01em}b{color:#fff;font-weight:600}a{display:inline-flex;align-items:center;height:52px;padding:0 22px;color:#141416;background:#fff;text-decoration:none;font-weight:600;border-radius:12px}small{display:block;margin-top:22px;font-size:13px;color:rgba(255,255,255,.45)}</style></head><body><main><div><p><b>${b.name}</b> is one of ${site.name}’s working builds. It runs inside the site, not on its own.</p><a href="${back}">Open it on the site</a><small>CH ${String(b.n).padStart(2,'0')} · ${b.biz}</small></div></main></body></html>`;
  // Allow only when the visitor arrived from one of our hosts (framed by our pages, or opened from a link on them).
  return `<script>(function(){try{var h=${JSON.stringify(hosts)},r=document.referrer||"",o=r?new URL(r).hostname:"";if(o&&h.indexOf(o)>-1)return;if(/(^|[#&?])s=1(&|$)/.test(location.hash)||/(^|[#&?])s=1(&|$)/.test(location.search))return;}catch(e){}window.stop();document.documentElement.innerHTML=${JSON.stringify(plate.replace(/^<!doctype html><html[^>]*>/,'').replace(/<\/html>$/,''))};})();</script>`;
}

module.exports = guard;
module.exports.hosts = hosts;
