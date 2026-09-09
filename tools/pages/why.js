const L = require('../lib.js');
const { site, esc } = L;
const FAQ = [
  ['Do I actually own the website?', `Yes. With ${site.name} the domain, the code and the hosting sit in your own accounts from day one. It is set up so you could walk away tomorrow and lose nothing; that is the whole point.`],
  ['Is there a monthly fee to keep my site online?', `No. ${site.name} does not charge a monthly platform fee to keep your own website alive. You pay for hosting and your domain directly, in your own name, at cost. If any quote you get includes a monthly fee to keep your own site online, that is rent.`],
  ['How long does a build take?', `A capture website takes days. A full system with booking and follow-up usually takes one to two weeks. You get a date with the quote, and you can watch it being built in public.`],
  [`Are the ${L.words(L.builds.length)} builds on this site real clients?`, `No, and deliberately so. Every business, person, review and phone number in the demonstration builds is invented, so nothing on this site exposes anyone ${site.name} works with. They are real working software, just for businesses that do not exist.`],
  ['Who actually does the work?', `${site.founder.name}. ${site.name} is one person: there is no account manager and no handover to a junior. The person you message is the person who builds it.`],
  ['What kind of businesses is this for?', `UK service businesses whose work comes in by phone: plumbers, heating engineers, electricians, roofers, kitchen fitters, landscapers, cleaners, salons and similar trades and local operators.`],
  ['What happens after I book a call or send the form?', `${site.founder.name} looks at your website, your Google listing and what happens when someone tries to reach you, then messages you three things: what is leaking, what to fix first, and what it is worth in jobs. If you want it fixed, you get a flat quote. If not, you keep the list.`],
  ['Do you use page-builders or templates?', `No. Every build is hand-coded with no page-builder, no theme and no third-party runtime dependencies. Every visual is drawn in code rather than bought from a stock library.`],
];
module.exports = { FAQ, pages: [{
  url: '/why/', og: 'why', priority: 0.8, changefreq: 'monthly',
  meta: { key: 'why', title: 'Own it. Don’t rent it.', kicker: 'Why · one person · built in public', sub: 'Why the domain, the code and the accounts sit in your name from day one.' },
  render(b){
    const title = `Why — one person, built in public, you own it | ${site.name}`;
    const description = `One person building websites and systems for UK service businesses. You own the domain, code and accounts from day one; nothing is rented back.`;
    const nodes = [
      L.webPage({ path: '/why/', title, description, type: 'AboutPage' }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Why', path: '/why/' }]),
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ];
    const body = `
${L.header(b, 'why')}
<main id="main">
<section class="hero-w wrap">
  <h1>Own it.<br><span class="off">Don&rsquo;t rent it.</span></h1>
  <p class="lead">${esc(site.name)} exists because most service businesses are renting their own website from whoever built it, and getting a brochure for the money. This page is the reasoning, and the straight answers.</p>
</section>

<section class="panel">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">Ownership</span><span class="name">Yours from day one</span></div>
    <div class="body">
      <h2>Why should you own your own website?</h2>
      <p class="lead">You should own your website because it is where your work comes from, and anything that important should not depend on a monthly payment to the person who built it. With ${esc(site.name)}, the domain, the code and every account sit in the client&rsquo;s name from the first day.</p>
      <p>Some builders charge every month, forever, just to keep a site alive. A page-builder account the site cannot leave, a domain registered in the agency&rsquo;s name, a &ldquo;platform fee&rdquo; &mdash; each one is a lever, and it only gets pulled one way. Every build here is hand-coded, hosted in an account the client controls, with the domain registered to the client. Sack ${esc(site.founder.name)} tomorrow and everything keeps working.</p>
      <p class="warn"><i>*</i><span>If a quote includes a &ldquo;monthly platform fee&rdquo; to keep your own site online, that is rent. Walk away.</span></p>
    </div>
  </div>
</section>

<section class="panel">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">One person</span><span class="name">No account manager</span></div>
    <div class="body">
      <h2>Who builds it?</h2>
      <p class="lead">${esc(site.founder.name)} does. ${esc(site.name)} is one person, based in the ${esc(site.areaServed)}, and the person you message is the person who does the work. There is no sales call handed to a junior, and nothing gets lost in a handover because there is not one.</p>
      <dl class="nameplate">
        <div><dt>Operator</dt><dd><b>${esc(site.founder.name)}.</b> Builds every site and system personally.</dd></div>
        <div><dt>Base</dt><dd>${esc(site.areaServed)}. Built for how UK service businesses get work: the phone, Google, word of mouth.</dd></div>
        <div><dt>Cadence</dt><dd>One system a week, built in public on <a class="lnk" href="${site.instagram}" target="_blank" rel="noopener">Instagram (${esc(site.instagramHandle)})</a>.</dd></div>
        <div><dt>Method</dt><dd>Hand-coded. No page-builders, no themes, no stock imagery, no third-party runtime.</dd></div>
        <div><dt>Proof</dt><dd>${L.Words(L.builds.length)} working builds on <a class="lnk" href="${b}work/">the Work page</a>, every one open to use.</dd></div>
        <div><dt>Contact</dt><dd><a class="lnk" href="mailto:${esc(site.email)}">${esc(site.email)}</a> &middot; <a class="lnk" href="${b}book/">book a call</a></dd></div>
      </dl>
    </div>
  </div>
</section>

<section class="panel">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">In public</span><span class="name">Watch the next one</span></div>
    <div class="body">
      <h2>Why build in public?</h2>
      <p class="lead">Because it is the only honest portfolio. A logo wall proves someone paid; a build made in front of you proves what was built. ${esc(site.name)} makes one system a week in public, and the builds on this site are the result &mdash; all for invented businesses, so no client&rsquo;s numbers are ever on show.</p>
      <p class="f-note">Updated ${L.monthYear(L.UPDATED)}.</p>
    </div>
  </div>
</section>

<section class="panel faq" id="faq">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">Straight answers</span><span class="name">The questions people ask</span></div>
    <div class="body">
      <h2>Questions people ask ${esc(site.name)}</h2>
      ${FAQ.map(([q, a]) => `<details><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('')}
    </div>
  </div>
</section>
</main>
<section class="flood cta-band">
  <div class="wrap grid">
    <div><h2>Ready when you are.</h2><p class="lead" style="margin-top:.8rem">A short call, no pitch. If ${esc(site.name)} is the wrong fit you will hear that on the call too.</p></div>
    <div class="cta-col"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-ghost" href="${b}teardown.html">Free teardown by message</a></div>
  </div>
</section>
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/why/', title, description, og: 'why', nodes }), body, L.scripts(b));
  }
}]};
