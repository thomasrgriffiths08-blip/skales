const L = require('../lib.js');
const { site, builds, esc, Words } = L;
const SITES = builds.filter(x => x.kind === 'site'), TOOLS = builds.filter(x => x.kind === 'tool');
const B = n => builds.find(x => x.n === n);
/* ---- iOS app tiles: drawn, never fetched. 24-unit box, a flat brand colour and
   a top sheen, which is what a real icon reads as at notification size. ---- */
const SHEEN = '<path d="M0 0h24v11H0z" fill="#fff" opacity=".15"/>';
const HANDSET = 'M8.5 5.5 6.7 7.3a1.4 1.4 0 0 0-.1 1.9c3 3.6 5.7 6.3 9.3 9.3a1.4 1.4 0 0 0 1.9-.1l1.8-1.8c.4-.4.4-1 0-1.4l-2.2-1.9a1 1 0 0 0-1.3 0l-.9.8a17.4 17.4 0 0 1-3.8-3.8l.8-.9a1 1 0 0 0 0-1.3l-1.9-2.2a1 1 0 0 0-1.4 0Z';
const BUBBLE = 'M12 5.4c-4 0-7.2 2.6-7.2 5.8 0 1.9 1.1 3.5 2.8 4.6-.2 1-.7 2-1.5 2.8 1.5-.2 2.9-.7 4.1-1.5.6.1 1.2.2 1.8.2 4 0 7.2-2.6 7.2-5.9S16 5.4 12 5.4Z';
const IC = {
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.6" fill="#34C759"/>${SHEEN}<path d="${HANDSET}" fill="#fff"/></svg>`,
  msg:   `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.6" fill="#4CD264"/>${SHEEN}<path d="${BUBBLE}" fill="#fff"/></svg>`,
  wa:    `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.6" fill="#25D366"/>${SHEEN}<path d="${BUBBLE}" fill="#fff"/><path d="${HANDSET}" fill="#25D366" transform="translate(12 11.6) scale(.44) translate(-12 -11.6)"/></svg>`,
  mail:  `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.6" fill="#1E8FFF"/>${SHEEN}<rect x="4.4" y="7" width="15.2" height="10.4" rx="2.1" fill="#fff"/><path d="M5.2 8.4 12 13.1l6.8-4.7" fill="none" stroke="#1E8FFF" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  web:   '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.6" fill="#0A84FF"/><path d="M0 0h24v11H0z" fill="#fff" opacity=".16"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#fff" stroke-width="1.3"/><ellipse cx="12" cy="12" rx="3" ry="6.6" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M5.6 9.9h12.8M5.6 14.1h12.8" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>',
  cal:   '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.6" fill="#FF3B30"/><path d="M0 0h24v11H0z" fill="#fff" opacity=".14"/><rect x="5.2" y="6.4" width="13.6" height="12.4" rx="2.1" fill="#fff"/><path d="M5.2 10.1h13.6" stroke="#FF3B30" stroke-width="1.2"/><rect x="8" y="4.6" width="1.5" height="3.4" rx=".75" fill="#fff"/><rect x="14.5" y="4.6" width="1.5" height="3.4" rx=".75" fill="#fff"/><rect x="7.4" y="12" width="3" height="2.6" rx=".6" fill="#FF3B30" opacity=".82"/><rect x="12" y="12" width="3" height="2.6" rx=".6" fill="#FF3B30" opacity=".3"/></svg>'
};
/* one notification, built the way iOS builds one: tile, app name, time, title, body */
const note = (k, app, time, t1, t2) =>
  `<span class="ic">${IC[k]}</span><span class="tx"><span class="hd"><b>${app}</b><em>${time}</em></span><span class="t1">${t1}</span><span class="t2">${t2}</span></span>`;
/* One evening on a working phone, in the order it happened. It is meant to be more than fits:
   six apps, four and a half hours, and the same number ringing three times. */
const EVENING = [
  ['phone','PHONE',    '17:02','Missed call',        '07700 900 461'],
  ['phone','PHONE',    '17:04','Voicemail',          '0:34 &middot; not listened to'],
  ['wa',   'WHATSAPP', '17:26','Dave &mdash; kitchen job', 'Any chance you could come Thursday?'],
  ['phone','PHONE',    '17:48','Missed call',        '07700 900 118'],
  ['web',  'WEBSITE',  '18:05','New enquiry',        '&ldquo;Boiler&rsquo;s gone off, no heat&rdquo;'],
  ['msg',  'MESSAGES', '18:31','07700 900 902',      'Hi, are you still doing bathrooms?'],
  ['phone','PHONE',    '18:52','Missed call',        '07700 900 461 &middot; 2nd time'],
  ['mail', 'MAIL',     '19:14','Quote request',      'Northgate Lettings &mdash; 4 properties'],
  ['phone','PHONE',    '19:40','Missed call',        'Unknown number'],
  ['cal',  'CALENDAR', '20:03','Appointment request','Thursday, 8:00 am'],
  ['wa',   'WHATSAPP', '20:22','Dave &mdash; kitchen job', 'Did you get my message?'],
  ['phone','PHONE',    '20:47','Missed call',        '07700 900 461 &middot; 3rd time'],
  ['web',  'WEBSITE',  '21:05','New booking',        'No deposit taken &middot; unconfirmed'],
  ['msg',  'MESSAGES', '21:26','07700 900 774',      'Still waiting on that quote mate'],
  ['phone','PHONE',    '21:46','Missed call',        '07700 900 774']
];
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
      ${[0,2,4,6,8,10,12,13,14].map(i => EVENING[i])
        .map(n => `<div class="n nc">${note(n[0], n[1], n[2], n[3], n[4])}</div>`).join('')}
    </div>

    <div class="ios" id="coldIos">
      <div class="ios-wall"></div>
      <div class="ios-dim" id="coldDim"></div>
      <div class="ios-notch"></div>
      <svg class="ios-stat" viewBox="0 0 74 12" aria-hidden="true">
        <rect x="0" y="7.5" width="2.6" height="4.5" rx="1" /><rect x="4.4" y="5.4" width="2.6" height="6.6" rx="1" />
        <rect x="8.8" y="3.3" width="2.6" height="8.7" rx="1" /><rect x="13.2" y="1.2" width="2.6" height="10.8" rx="1" />
        <path d="M21.4 4.3a8.6 8.6 0 0 1 10.8 0M23.4 7a5.6 5.6 0 0 1 6.8 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <circle cx="26.8" cy="10.2" r="1.5"/>
        <rect x="52" y="1.6" width="19" height="9.4" rx="3" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".42"/>
        <rect x="53.5" y="3.1" width="13" height="6.4" rx="1.8"/><path d="M72.4 5.1v2.4a2.4 2.4 0 0 0 0-2.4Z" opacity=".42"/>
      </svg>
      <div class="ios-lock" id="coldLock"><span class="dt">Wednesday 9 September</span><span class="ck">21:47</span></div>

      <div class="ios-stack" id="coldStack">
        ${EVENING.map(n => `<div class="nc">${note(n[0], n[1], n[2], n[3], n[4])}</div>`).join('')}
      </div>

      <div class="ios-one" id="coldOne">
        <div class="oc">
          <span class="ic ic-sk">s<i>k</i></span>
          <span class="tx"><span class="hd"><b>SKALES</b><em>now</em></span>
            <span class="t1">Tonight, handled</span><span class="t2">15 things, while you were on a job</span></span>
        </div>
        <div class="op">
          <div class="op-r"><b>7 calls &amp; voicemails</b><em>texted back in 11s</em></div>
          <div class="op-r"><b>4 messages</b><em>answered and quoted</em></div>
          <div class="op-r"><b>3 jobs booked</b><em>Thu 08:00 &middot; Fri 13:30</em></div>
          <div class="op-r"><b>1 deposit taken</b><em>&pound;45</em></div>
          <div class="op-f">You did none of it.</div>
        </div>
      </div>

      <div class="ios-home"></div>
    </div>

    </div>
    <div class="cold-cap" aria-hidden="true"><div class="wrap">
      <p data-from="0.32" data-to="0.62">Every one of these is a job, or a job lost.</p>
      <p data-from="0.68" data-to="0.80">Then it goes quiet.</p>
      <p data-from="0.86" data-to="0.99">Every one of them answered. Not by you.</p>
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
