const L = require('../lib.js');
const { site, esc } = L;
const teardown = {
  url: '/teardown.html', og: 'teardown', priority: 0.8, changefreq: 'monthly',
  meta: { key: 'teardown', title: 'Ten minutes on your setup. Three things back.', kicker: 'Free teardown · by message', sub: 'What is leaking, what to fix first, what it is worth in jobs.' },
  render(b){
    const title = `Free teardown — three findings by message | ${site.name}`;
    const description = `Send three details. ${site.founder.name} checks your website, Google listing and missed calls, then messages back what is leaking and what to fix first.`;
    const nodes = [ L.webPage({ path: '/teardown.html', title, description, type: 'ContactPage' }), L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Free teardown', path: '/teardown.html' }]) ];
    const body = `
${L.header(b, '')}
<main id="main" class="wrap td-main">
  <div class="td">
    <div>
      <span class="plate"><span>Free teardown</span><span>10 minutes</span><span>No pitch attached</span></span>
      <h1>Ten minutes on your setup.<br>Three things back<span class="on">.</span></h1>
      <p class="lead">${esc(site.founder.name)} goes through your <strong>website, your Google listing, and what actually happens when someone tries to reach you</strong> &mdash; the way a customer experiences it, not the way an agency audits it.</p>
      <ul class="gets">
        <li><span class="n">01</span><span><b>What&rsquo;s leaking</b><span class="d">Where enquiries are going cold right now, with the specific step they die at.</span></span></li>
        <li><span class="n">02</span><span><b>What to fix first</b><span class="d">One thing. Not a forty-page report you&rsquo;ll never open.</span></span></li>
        <li><span class="n">03</span><span><b>What it&rsquo;s worth</b><span class="d">In jobs per month, so you can decide for yourself whether it matters.</span></span></li>
      </ul>
      <p class="f-note" style="margin-top:1.6rem">Rather talk it through? <a class="lnk" href="${b}book/">Book a call instead</a>. Want to see the work first? <a class="lnk" href="${b}work/">Sixteen builds are running on the rack</a>.</p>
    </div>
    <div>
      <div class="card">
        <div class="card-hd"><span class="lamp is-live"></span> Line 2 &middot; this form is switched on</div>
        <form id="f" novalidate>
          <div class="field"><label for="name">Your name</label><input id="name" name="name" autocomplete="name" required placeholder="e.g. Dave"></div>
          <div class="field"><label for="phone">WhatsApp or mobile</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="07…"></div>
          <div class="field"><label for="biz">Your business &mdash; and what&rsquo;s bugging you <span class="opt">(one line is plenty)</span></label><textarea id="biz" name="biz" placeholder="e.g. Roofing, Wakefield. Website gets visits, phone doesn't ring."></textarea></div>
          <div class="hp" aria-hidden="true"><label>Leave this empty<input name="company" tabindex="-1" autocomplete="off"></label></div>
          <button class="btn btn-live send" type="submit">Send it over</button>
        </form>
        <div class="done" id="done">
          <div class="badge">&#10003;</div>
          <h2 id="doneTitle">Got it.</h2>
          <p id="doneBody">You&rsquo;ll hear back personally, fast.</p>
          <p class="ps">PS &mdash; this instant confirmation? Your business could answer missed calls the same way, at 9:47pm, without you touching the phone. That is the kind of thing that gets built here.</p>
        </div>
      </div>
      ${site.whatsapp ? `<p class="alt" id="waAlt">Prefer to skip the form? <a id="waDirect" href="${L.waHref('Hi Tom — saw your page, fancy the free teardown.')}">Message straight on WhatsApp</a></p>` : ''}
      <p class="reassure">No spam, no list, no obligation. One reply from a real person.</p>
    </div>
  </div>
</main>
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/teardown.html', title, description, og: 'teardown', nodes }), body, L.scripts(b, ['teardown.js']));
  }
};
const notfound = {
  url: '/404.html', og: 'home', noindex: true, sitemap: false,
  render(b){
    const title = `Not found | ${site.name}`;
    const body = `
${L.header(b, '')}
<main id="main" class="wrap nf">
  <p class="big">404</p>
  <h1>That channel isn&rsquo;t wired up.</h1>
  <p class="lead">The page you were after has moved or never existed. Everything that is switched on is one click away.</p>
  <div class="cta-row"><a class="btn btn-live" href="${b}work/">Open the rack</a><a class="btn btn-ghost" href="${b}">Back to the start</a></div>
</main>
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/404.html', title, description: 'That page has moved or never existed. Every working build and page on the site is one click away.', og: 'home', noindex: true }), body, L.scripts(b));
  }
};
/* old URLs that are already out there (Instagram, Google) keep working */
const redirect = (from, to) => ({ url: from, sitemap: false, raw: true, render(b){
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Moved</title><link rel="canonical" href="${L.abs(to)}"><meta http-equiv="refresh" content="0;url=${b}${to.replace(/^\//,'')}"><meta name="robots" content="noindex"></head><body><p>Moved to <a href="${b}${to.replace(/^\//,'')}">${L.abs(to)}</a>.</p></body></html>`; } });
module.exports = { pages: [teardown, notfound, redirect('/work.html', '/work/'), redirect('/systems.html', '/what-i-do/')] };
