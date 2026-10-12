const L = require('../lib.js');
const { site, builds, esc, Words } = L;
const SITES = builds.filter(x => x.kind === 'site'), TOOLS = builds.filter(x => x.kind === 'tool');
const B = n => builds.find(x => x.n === n);
const TRY = require('./try.js').DEMOS.filter(x => x.live);
/* the same slug rule as assets/builder.js, so the example pages match what the builder writes */
const slug = s => String(s).toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const HEAT_KW = require('../../data/trades.js').find(t => t.key === 'heating').kw;
const FEATURED = [14, 19, 27, 17, 25, 2, 33, 10].map(B).filter(Boolean);

module.exports = { pages: [{
  url: '/', og: 'home', priority: 1.0, changefreq: 'weekly',
  meta: { key: 'home', title: 'Type your business name. Watch your website build.', kicker: `${site.name} · websites · booking · follow-up · UK`, sub: `Pick your trade, add your name and town, and a working site for your business builds itself on the page, with a reference number for the call. ${Words(builds.length)} finished ones are on the page too.` },
  render(b){
    const title = `Websites & booking systems for UK trades | ${site.name}`;
    const description = 'Type your business name and watch a working website for it build on the page. Websites, online booking and missed-call text-back for UK trades.';
    const nodes = [
      L.webPage({ path: '/', title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs('/og/home.png') } } }),
      { '@type': 'VideoObject', '@id': L.abs('/#film'), name: 'Seven days from invisible to booked', description: 'A film of a website build for a fictional heating engineer: built in seven days, found on Google, and the enquiries arriving in the Skales CRM. Fictional business, illustrative numbers.',
        thumbnailUrl: L.abs('/assets/film/website.jpg'), contentUrl: L.abs('/assets/film/website.mp4'), uploadDate: '2026-10-08', duration: 'PT33S', publisher: { '@id': L.ORG_ID } },
    ];
    const svc = [
      { s: site.services[0], x: B(13), see: 'a roofing firm’s site, before and after' },
      { s: site.services[1], x: B(14), see: 'a heating engineer’s booking' },
      { s: site.services[2], x: B(25), see: 'a missed call, texted back' },
    ];
    const body = `
${L.header(b, 'home')}
<main id="main">

<section class="builder" id="build" aria-labelledby="h-build">
  <div class="wrap b-grid">
    <div class="b-copy">
      <p class="b-kick">Websites, booking and follow-up for UK trades</p>
      <h1 id="h-build">Type your business name. Watch your website build.</h1>
      <p class="lead" id="bLead">Pick what you do, add your name and town, and a working site for your business builds itself here, with booking, prices and a page for every service. It gets a reference number, so on the call I already have it open.</p>
    </div>

    <form class="b-form" id="bForm" novalidate>
      <div class="b-step"><span class="b-lab" id="bTradesLab">What do you do?</span><div class="b-trades" id="bTrades" role="group" aria-labelledby="bTradesLab"></div></div>
      <div class="b-two">
        <label class="b-in"><span class="b-lab">Business name</span><input id="bBiz" type="text" placeholder="e.g. Hartley Heating" autocomplete="organization" maxlength="34" enterkeyhint="next"></label>
        <label class="b-in"><span class="b-lab">Town</span><input id="bTown" type="text" placeholder="e.g. Leeds" autocomplete="address-level2" maxlength="22" enterkeyhint="go"></label>
      </div>
      <button class="b-go" type="submit">Build my website</button>
      <p class="b-need" id="bNeed" role="alert" hidden></p>
      <p class="b-fine">Nothing is sent anywhere until you book a call. The photos are examples, and the phone number is one Ofcom keeps for TV dramas, so nobody gets rung.</p>
    </form>

    <div class="b-done" id="bDone" hidden>
      <div class="b-ref">
        <span class="b-ref-l">Your draft</span>
        <span class="b-ref-n" id="dRef">SK-0000</span>
        <span class="b-ref-m" id="dMeta"></span>
      </div>
      <a class="btn btn-live b-book" id="dBook" href="${b}book/">Book a call about this draft</a>
      <p class="b-why">Thirty minutes, free. I will show you how the real one gets found on Google in your town, and what it would take.</p>
      <div class="b-more">
        <button class="b-ln" type="button" id="dOpen">Open it full size</button>
        <button class="b-ln" type="button" id="dCopy">Copy the link</button>
        <button class="b-ln" type="button" id="dEdit">Change the details</button>
      </div>
    </div>

    <div class="b-stage" id="bStage">
      <div class="b-win" id="bWin">
        <div class="b-bar" aria-hidden="true"><i></i><i></i><i></i>
          <span class="b-url"><svg viewBox="0 0 16 16"><path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="3" y="7" width="10" height="7" rx="1.6" fill="currentColor"/></svg><span id="bUrl">hartleyheating.co.uk</span></span>
        </div>
        <div class="b-view" id="bView"></div>
        <button class="b-guard" type="button" data-guard="bWin"><span>Click to scroll this site</span></button>
      </div>
      <div class="b-phone" id="bPhone">
        <div class="b-pscreen" id="bPScreen"></div>
        <button class="b-guard" type="button" data-guard="bPhone"><span>Tap to use this site</span></button>
      </div>
      <div class="b-log" id="bLog" hidden>
        <div class="b-log-h"><span class="b-log-n" id="bLogHead">Building</span><span class="b-log-t" id="bLogT"></span><button type="button" class="b-skip" id="bSkip">Skip</button></div>
        <ol class="b-log-l" id="bLogList" aria-live="polite"></ol>
      </div>
      <p class="b-cap" id="bCap">Example draft · fictional business</p>
    </div>
  </div>
</section>

<section class="sec dx" id="draft" aria-labelledby="h-draft">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-draft">A website is only worth the jobs it brings in.</h2>
      <p class="lead">The draft is the easy part. This is how the real one gets found in <span data-dx="town">your town</span>, and what happens when someone lands on it.</p>
    </div>
    <div class="dx-grid">
      <div class="dx-col">
        <h3>How you get found</h3>
        <ol class="dx-list">
          <li><b>A page for every service, in your town.</b><span>People search for the job and the place, not your name. Each service gets its own page, written for where you work.</span>
            <ul class="dx-pages" id="dxPages"><li class="dom">hartleyheating.co.uk</li>${HEAT_KW.map(k => `<li>/<b>${esc(slug(k + ' leeds'))}</b></li>`).join('')}</ul></li>
          <li><b>Your Google Business Profile, matched to the site.</b><span>The same name, number, hours and services in both places, so Google trusts them. That is what gets you into the map results.</span></li>
          <li><b>Reviews that ask for themselves.</b><span>After every job the customer gets a text with a link to review you. More reviews, and recent ones, keep you near the top of the map.</span></li>
          <li><b>Written so AI answers can quote it.</b><span>Plain answers to what your customers ask, with the structured data search engines read, so ChatGPT and Google&rsquo;s AI answers can name you.</span></li>
          <li><b>Ads for when you want work this week.</b><span>Google and Meta ads pointed at the booking page, and tracked to the booked job, not to clicks.</span></li>
        </ol>
      </div>
      <div class="dx-col">
        <h3>How visits turn into booked jobs</h3>
        <ol class="dx-list">
          <li><b>Booking with a deposit.</b><span>Real slots from your diary, any hour. A deposit holds the slot, so nobody books and vanishes.</span></li>
          <li><b>Missed calls get a text back.</b><span>On a job when they ring? They get a text within a minute with a link to book, before they ring the next name on Google.</span></li>
          <li><b>Quotes chase themselves.</b><span>A polite nudge goes out if a quote has not been answered, so fewer of them go cold.</span></li>
          <li><b>One place for every enquiry.</b><span>Calls, texts, forms and bookings in one list on your phone, each with where it came from.</span></li>
        </ol>
      </div>
    </div>
    <div class="dx-call">
      <div>
        <h3>On the call, I have your draft open.</h3>
        <ol class="dx-steps">
          <li><span><b data-dx="draft">Your draft</b>, and what people in <span data-dx="town">your town</span> type into Google when they need you.</span></li>
          <li><span>Who is getting those jobs now, and what they are doing that you are not.</span></li>
          <li><span>A flat price and a date, if it is a fit. If it is not, you will hear that too.</span></li>
        </ol>
      </div>
      <div class="dx-cta">
        <a class="btn btn-live" id="dxBook" href="${b}book/">Book a free call</a>
        <p id="dxRefline">Thirty minutes, free. Build a draft first and it comes with you.</p>
      </div>
    </div>
  </div>
</section>

<section class="sec" id="work" aria-labelledby="h-work">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-work">That was a draft. These are finished.</h2>
      <p class="lead">${Words(builds.length)} builds: ${SITES.length} full websites and ${TOOLS.length} business tools, each made for an invented business so no client is ever on show. Every one opens and works like the real thing.</p>
    </div>
    ${L.wall(b, FEATURED)}
    <div class="sec-foot"><a class="btn btn-dark" href="${b}work/">See all ${builds.length}</a><a class="btn btn-ghost" href="${b}work/websites/">Websites</a><a class="btn btn-ghost" href="${b}work/tools/">Tools</a></div>
  </div>
</section>

<section class="sec sec-alu" id="film" aria-labelledby="h-film">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-film">Seven days from invisible to booked.</h2>
      <p class="lead">A heating engineer nobody could find on Google, a site built in a week, and what came in after. It is a film of the system I build, with a made-up business in it.</p>
    </div>
    <figure class="film">
      <video data-film muted playsinline loop preload="none" disablepictureinpicture
        data-wide="${b}assets/film/website.mp4" data-phone="${b}assets/film/website-phone.mp4"
        data-wide-poster="${b}assets/film/website.jpg" data-phone-poster="${b}assets/film/website-phone.jpg" poster="${b}assets/film/website.jpg"
        aria-label="A week-long website build for a heating engineer, then enquiries arriving in the Skales CRM"></video>
      <figcaption><span>Fictional business · illustrative numbers</span><button type="button" class="film-tg" data-film-toggle aria-pressed="false">Play the film</button></figcaption>
    </figure>
  </div>
</section>

<section class="sec" id="try" aria-labelledby="h-try">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-try">Don't take my word for it. Try it.</h2>
      <p class="lead">Three live demos that run on your phone. You play the customer, then see what the business sees. About a minute each.</p>
    </div>
    <div class="try-list">${TRY.map(x => `<a class="try-card" href="${b}try/${x.slug}/"><span class="try-n">Demo</span><h3>${esc(x.name)}</h3><p>${esc(x.line)}</p><span class="try-go">Try it <span aria-hidden="true">→</span></span></a>`).join('')}</div>
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
    <div class="sec-foot"><a class="btn btn-ghost" href="${b}services/">All five services</a></div>
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
    return L.page(L.head({ b, path: '/', title, description, og: 'home', css: ['device.css', 'builder.css'], nodes }), body,
      L.scripts(b, ['builds.js', 'trades.js', 'device.js', 'builder.js', 'nightline.js', 'films.js']));
  }
}]};
