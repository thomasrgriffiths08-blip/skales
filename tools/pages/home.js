const L = require('../lib.js');
const { site, builds, esc, Words } = L;
const SITES = builds.filter(x => x.kind === 'site'), TOOLS = builds.filter(x => x.kind === 'tool');
const B = n => builds.find(x => x.n === n);
const FEATURED = [14, 19, 27, 17, 25, 2, 33, 10].map(B).filter(Boolean);

module.exports = { pages: [{
  url: '/', og: 'home', priority: 1.0, changefreq: 'weekly',
  meta: { key: 'home', title: 'Watch your website build itself.', kicker: `${site.name} · websites · booking · follow-up · UK`, sub: `Pick your trade and a working site for your business appears in a couple of seconds. ${Words(builds.length)} finished ones are on the page too.` },
  render(b){
    const title = `Websites & booking systems for UK trades | ${site.name}`;
    const description = 'Pick your trade and watch a working website for your business build itself on the page. Websites, booking and missed-call text-back for UK trades, owned by you.';
    const nodes = [
      L.webPage({ path: '/', title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs('/og/home.png') } } }),
    ];
    const svc = [
      { s: site.services[0], x: B(13), see: 'a roofing firm’s site, before and after' },
      { s: site.services[1], x: B(14), see: 'a heating engineer’s booking' },
      { s: site.services[2], x: B(25), see: 'a missed call, texted back' },
    ];
    const body = `
${L.header(b, 'home')}
<main id="main">

<section class="cold" id="cold" aria-label="One evening of missed calls, and the same evening with a system running">
  <div class="cold-stage">
    <video id="coldFilm" muted playsinline preload="auto" disablepictureinpicture
           poster="${b}assets/film/poster.jpg" data-lut="${b}assets/film/lut.json"
           aria-label="A phone turning in the dark and lighting up">
      <source src="${b}assets/film/film.mp4" type="video/mp4">
    </video>
    <img class="cold-park" id="coldPark" src="${b}assets/film/park.jpg" alt="" aria-hidden="true" decoding="async">
    <div class="cold-frame" id="coldFrame" aria-hidden="true">
    <div class="cold-void" id="coldVoid">
      ${[
        ['Missed call', '21:47 &middot; 07700 900 461', ''],
        ['Voicemail', '21:48 &middot; not listened to', ''],
        ['Website enquiry', 'no reply &middot; 3 days', ''],
        ['Missed call', '21:52 &middot; unknown number', ''],
        ['Quote sent', 'never chased', ''],
        ['Missed call', '22:06 &middot; 07700 900 118', ''],
        ['Review request', 'never sent', ''],
        ['Missed call', '07:58 &middot; 07700 900 902', ''],
        ['Enquiry', 'gone to the next firm', ''],
      ].map(([a, c]) => `<div class="n"><i></i><b>${a}</b><span>${c}</span></div>`).join('')}
    </div>
    <div class="cold-notes" id="coldNotes" aria-hidden="true">
      ${[['Missed call','21:47'],['Voicemail','21:48'],['Missed call','21:52'],
         ['Enquiry','no reply'],['Missed call','22:06'],['Missed call','07:58']]
        .map(([a, t]) => `<span class="r"><s></s><b>${a}</b><em>${t}</em></span>`).join('')}
    </div>
    <div class="cold-screen" id="coldScreen" aria-hidden="true">
      <span class="hd">Booked</span>
      <span class="row"><s></s><b>Texted back</b><em>11s</em></span>
      <span class="row"><s></s><b>Replied</b><em>2m</em></span>
      <span class="row"><s></s><b>Slot taken</b><em>8am</em></span>
      <span class="row"><s></s><b>Deposit held</b><em>&pound;45</em></span>
      <span class="ft">While you were out.</span>
    </div>
    </div>
    <div class="cold-cap" aria-hidden="true"><div class="wrap">
      <p data-from="0.20" data-to="0.66">Every one of these is a job going to somebody else.</p>
      <p data-from="0.84" data-to="0.99">This is the same evening, with a system running.</p>
    </div></div>
    <div class="cold-title" id="coldTitle"><div class="wrap">
      <span class="t">9:47pm</span>
      <span class="rule"></span>
      <p class="s">One evening on a phone that nobody is watching.</p>
      <span class="cold-cue"><i></i>Scroll</span>
    </div></div>
    <div class="cold-load" id="coldLoad"><span class="bar"><i></i></span></div>
  </div>
</section>

<section class="forge" aria-labelledby="h-forge">
  <div class="wrap">
    <div class="grid">
      <div class="fhead">
        <h1 id="h-forge">Watch your website build itself.</h1>
        <p class="lead">The phone is empty because it is waiting for you. Pick what you do and put your name in, and a real working website for <em>your</em> business fills it &mdash; one you can scroll, press and open in a new tab. <strong>It takes a couple of seconds.</strong> The proper one is hand-built, and it is yours from day one.</p>
      </div>
      <div class="side" id="forgePhone">
        <div class="phone-lit"><div class="screen" id="forgeScreen"></div><button class="tapguard" type="button" id="forgeGuard"><span>Tap the screen to use this site</span></button></div>
        <div class="forge-cap"><div class="who" id="forgeCap"></div><div class="side-r"><span class="tap-hint" id="tapHint">Tap to use it</span><span class="t" id="forgeTimer" hidden>0.0s</span></div></div>
        <div class="forge-after" id="forgeAfter" hidden>
          <p><b>That is a sketch, drawn in a couple of seconds by the same rules every build on this site follows.</b> A real one is hand-written for your business: your photographs, your services, your booking system and your Google listing wired in behind it.</p>
          <div class="cta-row">
            <a class="btn btn-live" href="${b}book/">Book a call</a>
            <button class="btn btn-ghost" type="button" id="forgeOpen">Open it full size</button>
          </div>
          <a class="lnk" id="forgeDemo" href="${b}work/" hidden></a>
        </div>
      </div>
      <div class="panel-f">
        <div class="step"><span>1 &nbsp;What do you do?</span><div class="trades" id="forgeTrades" role="tablist" aria-label="Your trade"></div></div>
        <div class="step"><span>2 &nbsp;What are you called, and where?</span>
          <div class="two-up">
            <input id="forgeBiz" type="text" placeholder="Business name" aria-label="Business name" autocomplete="organization" maxlength="34">
            <input id="forgeTown" type="text" placeholder="Town" aria-label="Town" autocomplete="address-level2" maxlength="22">
          </div>
        </div>
        <button class="btn-go" type="button" id="forgeGo">Build my site</button>
        <p class="need" id="forgeNeed" hidden></p>
        <p class="fine">Nothing is sent anywhere and nothing is saved. The photograph is a stand-in made for this page, not a stock library &mdash; a real one uses pictures of your own work. The phone number is an Ofcom drama number, so nobody gets rung.</p>
      </div>
          </div>
  </div>
</section>

<section class="sec" id="work" aria-labelledby="h-work">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-work">That was a sketch. These are finished.</h2>
      <p class="lead">${Words(builds.length)} builds: ${SITES.length} full websites and ${TOOLS.length} business tools, each made for an invented business so no client is ever on show. Every one opens and works like the real thing.</p>
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
  <img class="night-plate" src="${b}assets/plates/night.webp" alt="" aria-hidden="true" loading="lazy" decoding="async">
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
    return L.page(L.head({ b, path: '/', title, description, og: 'home', css: ['device.css', 'forge.css', 'cold.css'], nodes }), body,
      L.scripts(b, ['builds.js', 'trades.js', 'device.js', 'forge.js', 'cold.js', 'nightline.js']));
  }
}]};
