const L = require('../lib.js');
const { site, builds, esc, Words } = L;
const SITES = builds.filter(x => x.kind === 'site'), TOOLS = builds.filter(x => x.kind === 'tool');
const B = n => builds.find(x => x.n === n);
const FEATURED = [14, 19, 27, 17, 25, 2, 33, 10].map(B).filter(Boolean);   // the eight on the home page

module.exports = { pages: [{
  url: '/', og: 'home', priority: 1.0, changefreq: 'weekly',
  meta: { key: 'home', title: 'The website your customers will actually use.', kicker: `${site.name} · websites · booking · follow-up · UK`, sub: `${Words(builds.length)} working builds you can use. Hand-built, owned by you.` },
  render(b){
    const title = `Websites & booking systems for UK trades | ${site.name}`;
    const description = 'Websites, online booking and missed-call text-back for UK trades, built by one person and owned by you. ' + Words(builds.length) + ' working builds run live on this site.';
    const nodes = [
      L.webPage({ path: '/', title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs('/og/home.png') } } }),
    ];
    const start = L.defaultBuild();
    const svc = [
      { s: site.services[0], x: B(13), see: 'a roofing firm’s site, before and after' },
      { s: site.services[1], x: B(14), see: 'a heating engineer’s booking' },
      { s: site.services[2], x: B(25), see: 'a missed call, texted back' },
    ];
    const body = `
${L.header(b, 'home')}
<main id="main">
<section class="hero" aria-label="Introduction">
  <div class="wrap">
    <div class="grid">
      <div class="copy">
        <h1>The website your customers will actually use.</h1>
        <p class="lead">${esc(site.name)} builds websites, online booking and follow-up for UK trades and service businesses. Hand-built, fast, and yours from day one. <strong>${esc(Words(builds.length))} working examples are on this page.</strong> Pick one up and use it.</p>
        <div class="cta-row"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-ghost" href="${b}work/">See all ${builds.length}</a></div>
      </div>
      <div class="side">${L.device(b, start, { thumbs: false })}</div>
    </div>
    <div class="thumbs" id="thumbs" role="tablist" aria-label="Choose a build"></div>
  </div>
</section>

<section class="sec" id="work" aria-labelledby="h-work">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-work">${esc(Words(builds.length))} builds. All of them running.</h2>
      <p class="lead">${SITES.length} full websites and ${TOOLS.length} business tools, each made for an invented business so no client is ever on show. Every one opens and works like the real thing.</p>
    </div>
    ${L.wall(b, FEATURED)}
    <div class="sec-foot"><a class="btn btn-dark" href="${b}work/">See all ${builds.length}</a><a class="btn btn-ghost" href="${b}work/websites/">Websites</a><a class="btn btn-ghost" href="${b}work/tools/">Tools</a></div>
  </div>
</section>

<section class="sec sec-alu" id="services" aria-labelledby="h-svc">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-svc">Three things, built to be used on a phone.</h2>
      <p class="lead">Because that is where your customer is when they find you: in a van, on a sofa, at 9:47pm.</p>
    </div>
    <div class="svc">
      ${svc.map(({ s, x, see }) => `<article>
        <a class="shell" href="${b}work/${x.slug}/" aria-label="${esc(x.name)}"><img src="${L.phoneSrc(b, x)}" width="585" height="1266" alt="${esc(x.name)} on a phone" loading="lazy" decoding="async"></a>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.long)}</p>
        <a class="lnk" href="${b}work/${x.slug}/">See it running: ${esc(see)}</a>
      </article>`).join('')}
    </div>
    <div class="sec-foot"><a class="btn btn-ghost" href="${b}what-i-do/">More on what I build</a></div>
  </div>
</section>

<section class="night" id="night" aria-labelledby="h-night">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-night">What happens at 9:47pm.</h2>
      <p class="lead">A customer rings. You are at your daughter&rsquo;s birthday tea. This is the follow-up system doing your job for you, in real time. <strong>Every message below is sent by the system, not by a person.</strong></p>
    </div>
    <div class="night-grid">
      <div class="thread" id="thread" aria-live="polite"></div>
      <div>
        <ul class="log" id="log" aria-live="polite"></ul>
        <div class="out-line" id="lineOut"></div>
        <button class="btn btn-ghost" id="ring" type="button">Run it</button><span id="lineLamp" hidden></span>
      </div>
    </div>
  </div>
</section>

<section class="sec" id="how" aria-labelledby="h-how">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-how">How it works after you get in touch.</h2>
      <p class="lead">No proposal deck. No account manager. The person you message is the person who builds it.</p>
    </div>
    <ol class="steps">
      <li><b>A ten-minute teardown, free.</b> Your website, your Google listing and what happens when someone tries to reach you, the way a customer experiences it. Three things back by message: what is leaking, what to fix first, what it is worth in jobs.</li>
      <li><b>A flat quote with a date.</b> Agreed before anything starts. No surprises, and no meeting that should have been a message.</li>
      <li><b>Built in days, in public.</b> A website takes days; a full system with booking and follow-up usually one to two weeks. You can watch it being made.</li>
      <li><b>Handed over in your name.</b> Domain, code and accounts set up as yours. Walk away tomorrow and everything keeps working.</li>
    </ol>
    <div class="sec-foot"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-ghost" href="${b}teardown.html">Get the free teardown</a></div>
  </div>
</section>

<section class="sec sec-alu" id="why" aria-labelledby="h-why">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-why">Why ${esc(site.name)}.</h2></div>
    <div class="why3">
      <div><h3>You own it</h3><p>The domain, the code and every account sit in your name from the first day. Nothing is rented back to you monthly, and there is no platform your site cannot leave.</p></div>
      <div><h3>One person</h3><p>${esc(site.founder.name)} builds every site and system personally. No sales call handed to a junior, nothing lost in a handover, because there is not one.</p></div>
      <div><h3>Proof, not promises</h3><p>${esc(Words(builds.length))} working builds on this site, one new system a week made in public on <a class="lnk" href="${site.instagram}" target="_blank" rel="noopener">Instagram</a>. Open any of them and use it.</p></div>
    </div>
    <div class="sec-foot"><a class="btn btn-ghost" href="${b}why/">More about the studio</a></div>
  </div>
</section>
</main>
${L.ctaBand(b, 'Ready when you are.', 'A short call about what is leaking in your business and what would fix it. If ' + esc(site.name) + ' is the wrong fit, you will hear that on the call too.', `<a class="btn btn-ghost" href="${b}teardown.html">Free teardown by message</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/', title, description, og: 'home', css: ['device.css'], nodes }), body, L.scripts(b, ['builds.js', 'device.js', 'nightline.js']));
  }
}]};
