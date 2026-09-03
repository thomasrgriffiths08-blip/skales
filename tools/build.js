/* Static site generator. `node tools/build.js` writes every page, the sitemap, robots, llms.txt,
   the manifest, the client-side build data and the OG job list. Add a build to data/builds.js
   or a note to data/notes.js and run it again. Zero dependencies. */
const fs = require('fs'), path = require('path');
const L = require('./lib.js');
const { site, builds } = L;
const ROOT = path.resolve(__dirname, '..');
const notes = require('../data/notes.js');
const why = require('./pages/why.js');
const mods = [require('./pages/home.js'), require('./pages/work.js'), require('./pages/whatido.js'), why, require('./pages/book.js'), require('./pages/notes.js'), require('./pages/misc.js')];

const write = (rel, content) => { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };
const baseFor = url => { const depth = url.replace(/^\//, '').split('/').filter(Boolean).length - (url.endsWith('/') ? 0 : 1); return depth > 0 ? '../'.repeat(depth) : ''; };

const pages = mods.flatMap(m => m.pages);
const sitemap = [], ogJobs = [];
for (const p of pages){
  const b = baseFor(p.url);
  const html = p.render(b);
  const file = p.url.endsWith('/') ? p.url + 'index.html' : p.url;
  write(file, html);
  if (p.sitemap !== false && !p.noindex) sitemap.push({ loc: L.abs(p.url), priority: p.priority || 0.5, changefreq: p.changefreq || 'monthly' });
  if (p.meta) ogJobs.push(p.meta);
}

/* client-side data: only what the rack needs (no long copy) */
write('assets/builds.js', `/* generated from data/builds.js — do not edit by hand */\nwindow.BUILDS=${JSON.stringify(builds.map(x => ({ n: x.n, slug: x.slug, kind: x.kind, group: x.group, name: x.name, biz: x.biz, short: x.short, long: x.long, proves: x.proves, tags: x.tags, c: x.c })))};\n`);

/* sitemap + robots (AI crawlers explicitly allowed) */
const today = L.iso(L.UPDATED);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(u => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority.toFixed(1)}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `# ${site.name} — everything public is crawlable, including by AI search engines.
User-agent: *
Allow: /
Disallow: /demos/
Disallow: /tools/
Disallow: /data/

${['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','anthropic-ai','PerplexityBot','Google-Extended','Googlebot','Bingbot','CCBot','Applebot','Amazonbot','DuckDuckBot','YouBot'].map(u => `User-agent: ${u}\nAllow: /\nDisallow: /demos/`).join('\n\n')}

Sitemap: ${L.abs('/sitemap.xml')}
`);

/* llms.txt — the curated summary AI engines read first; llms-full.txt carries the page bodies */
const short = `# ${site.name}

> ${site.tagline}. ${site.facts[0]} Run by ${site.founder.name}, one person, in the ${site.areaServed}.

Key facts:
${site.facts.map(f => `- ${f}`).join('\n')}
- Contact: ${site.email} · Instagram ${site.instagramHandle} (${site.instagram})
- Book a call: ${L.abs('/book/')}

## Pages
- [Home](${L.abs('/')}): what ${site.name} builds, with a live demonstration build on the page.
- [Work — sixteen builds](${L.abs('/work/')}): every demonstration build, each running live and each with its own page.
- [What I do](${L.abs('/what-i-do/')}): the three services — capture websites, online booking with a pipeline, missed-call and review automation — with the systems running, and the four-step process.
- [Why](${L.abs('/why/')}): ownership (clients own domain, code and accounts), one person, built in public, and the FAQ.
- [Book a call](${L.abs('/book/')}): four qualifying questions, then a slot straight into the diary.
- [Free teardown](${L.abs('/teardown.html')}): three details in, three findings back by message.
- [Notes](${L.abs('/notes/')}): short pieces — ${notes.map(n => n.title.toLowerCase()).join('; ')}.

## The sixteen builds
${builds.map(x => `- [${x.name}](${L.abs('/work/' + x.slug + '/')}): ${x.kind === 'site' ? 'website' : 'business tool'} for an invented ${x.biz.toLowerCase()} — ${x.short}`).join('\n')}

## Frequently asked
${why.FAQ.map(([q, a]) => `- **${q}** ${a}`).join('\n')}
`;
write('llms.txt', short);
const strip = h => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();
write('llms-full.txt', short + `\n\n---\n\n## Full page text\n\n` + pages.filter(p => p.sitemap !== false && !p.noindex).map(p => `### ${p.meta ? p.meta.title : p.url} — ${L.abs(p.url)}\n\n${strip(p.render(baseFor(p.url)))}\n`).join('\n'));

write('manifest.webmanifest', JSON.stringify({ name: site.name, short_name: site.name, description: site.tagline, start_url: site.origin.replace(/^https?:\/\/[^/]+/, '') + '/', display: 'browser', background_color: '#0A0C10', theme_color: '#0A0C10', icons: [{ src: 'og/icon.png', sizes: '512x512', type: 'image/png' }] }, null, 2));
write('tools/og-jobs.json', JSON.stringify(ogJobs, null, 2));
write('humans.txt', `/* TEAM */\n${site.founder.name} — ${site.founder.jobTitle}\n${site.instagram}\n\n/* SITE */\nLast update: ${today}\nStandards: HTML5, CSS, vanilla JS. No frameworks, no page-builders, no runtime dependencies.\n`);
console.log(`built ${pages.length} pages · sitemap ${sitemap.length} urls · ${ogJobs.length} OG jobs`);
