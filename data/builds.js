// Every business, person and phone number here is invented. Colours mirror each build's own accent.
/* Every build is a JSON file in data/builds/: the twelve websites (1-12), then the seven parts of the system (13-19). */
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'builds');
const extra = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort()
  .map(f => { try { return JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { throw new Error('data/builds/' + f + ': ' + e.message); } }) : [];
const GROUP = { loud: 'Websites · Loud', motion: 'Websites · Motion', quiet: 'Websites · Quiet', direct: 'Websites · Direct', system: 'The system' };
const all = extra.map(x => ({ mobile: true, trade: x.biz, tags: [], features: [], ...x, group: GROUP[x.lane] || x.group || '' }));
const seen = new Set();
for (const x of all){ if (!x.slug || !x.file || !x.lane) throw new Error('build ' + (x.slug || x.n) + ' needs slug, file and lane'); if (seen.has(x.slug)) throw new Error('duplicate slug ' + x.slug); seen.add(x.slug); }
all.sort((a, b) => a.n - b.n);
module.exports = all;
