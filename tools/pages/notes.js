const L = require('../lib.js');
const { site, esc } = L;
const notes = require('../../data/notes.js');
const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const index = {
  url: '/notes/', og: 'notes', priority: 0.7, changefreq: 'weekly',
  meta: { key: 'notes', title: 'Notes', kicker: 'Short, straight, added to', sub: 'What a missed call costs, why you should own your site, and why every demo is fictional.' },
  render(b){
    const title = `Notes — websites & systems for trades | ${site.name}`;
    const description = `Short notes: what a missed call actually costs, why you should own your website rather than rent it, and why every demo is for a business that does not exist.`;
    const nodes = [ L.webPage({ path: '/notes/', title, description, type: 'CollectionPage' }), L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Notes', path: '/notes/' }]),
      { '@type': 'ItemList', itemListElement: notes.map((n, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/notes/${n.slug}/`), name: n.title })) } ];
    const body = `
${L.header(b, 'notes')}
<main id="main">
<section class="hero-w wrap">
  <h1>Short, straight notes.</h1>
  <p class="lead">Working notes on websites and systems for service businesses: what a missed call costs, why you should own your site, why the demos are fictional. Short, specific, no filler.</p>
</section>
<section class="panel"><div class="wrap inner">
  <div class="lab"><span class="sheet">Index</span><span class="name">Newest first</span></div>
  <div class="body">
    ${notes.slice().sort((a, c) => c.date.localeCompare(a.date)).map(n => `<a class="brow note-row" href="${b}notes/${n.slug}/"><span><h2 class="h3">${esc(n.title)}</h2><p>${esc(n.summary)}</p></span><span class="plate"><span><time datetime="${n.date}">${fmt(n.date)}</time></span></span></a>`).join('')}
  </div>
</div></section>
</main>
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/notes/', title, description, og: 'notes', nodes }), body, L.scripts(b));
  }
};
const posts = notes.map(n => ({
  url: `/notes/${n.slug}/`, og: `notes-${n.slug}`, priority: 0.6, changefreq: 'yearly',
  meta: { key: `notes-${n.slug}`, title: n.title, kicker: 'Notes · ' + fmt(n.date), sub: n.summary },
  render(b){
    const title = n.title.length > 46 ? n.title : `${n.title} | ${site.name}`;
    const description = n.summary;
    const nodes = [ L.webPage({ path: `/notes/${n.slug}/`, title, description }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Notes', path: '/notes/' }, { name: n.title, path: `/notes/${n.slug}/` }]),
      { '@type': 'Article', headline: n.title, description: n.summary, datePublished: n.date, dateModified: n.date,
        author: { '@id': L.PERSON_ID }, publisher: { '@id': L.ORG_ID }, mainEntityOfPage: L.abs(`/notes/${n.slug}/`), inLanguage: 'en-GB',
        image: L.abs(`/og/notes-${n.slug}.png`) } ];
    const links = (n.links || []).map(([k, t]) => k === 'work' ? `<a class="btn btn-ghost" href="${b}work/">${esc(t)}</a>` : `<a class="btn btn-ghost" href="${b}work/${k}/">${esc(t)}</a>`).join('');
    const body = `
${L.header(b, 'notes')}
<main id="main">
<article class="note wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${b}">Home</a><span>/</span><a href="${b}notes/">Notes</a></nav>
  <p class="hint"><time datetime="${n.date}">${fmt(n.date)}</time> &middot; ${esc(site.founder.name)}</p>
  <h1>${esc(n.title)}</h1>
  <p class="lead">${esc(n.summary)}</p>
  <div class="prose">${n.body}</div>
  <div class="cta-row" style="margin-top:2rem">${links}<a class="btn btn-live" href="${b}book/">Book a call</a></div>
</article>
</main>
${L.footer(b)}`;
    return L.page(L.head({ b, path: `/notes/${n.slug}/`, title, description, og: `notes-${n.slug}`, type: 'article', nodes, article: { published: n.date } }), body, L.scripts(b));
  }
}));
module.exports = { pages: [index, ...posts] };
