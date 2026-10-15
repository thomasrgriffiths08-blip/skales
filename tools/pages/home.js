const L = require('../lib.js');
const { site, builds, esc, Words } = L;
const SITES = builds.filter(x => x.kind === 'site'), TOOLS = builds.filter(x => x.kind === 'tool');
const B = n => builds.find(x => x.n === n);
const TRY = require('./try.js').DEMOS.filter(x => x.live);
/* the same slug rule as assets/builder.js, so the example pages match what the builder writes */
const slug = s => String(s).toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const HEAT_KW = require('../../data/trades.js').find(t => t.key === 'heating').kw;
const FEATURED = [14, 19, 27, 17, 25, 2, 33, 10].map(B).filter(Boolean);
/* the opening film: Your town. One continuous take over a white model of a British town at night: the lit windows go
   out one by one until a single house is still lit. Cut into a wide strip (town-d) and a tall strip (town-m), each with
   its first frame as the poster. Each line owns an equal share of the film. */
const OPENING = {
  fps: 24,
  lines: ['Tonight, people near you need a tradesperson.', 'Most of their calls go nowhere.', 'One business answers every one.']
};

module.exports = { pages: [{
  url: '/', og: 'home', priority: 1.0, changefreq: 'weekly',
  meta: { key: 'home', title: 'Be the one they call.', kicker: `${site.name} · websites · booking · follow-up · UK`, sub: `Websites, booking and follow-up for UK trades. Real builds run live on the page, and you can build a draft of your own with a reference number for the call.` },
  render(b){
    const title = `Websites & booking systems for UK trades | ${site.name}`;
    const description = 'Websites, online booking and missed-call text-back for UK trades. Watch real builds run on the page, then type your business name and see a draft of yours.';
    const nodes = [
      L.webPage({ path: '/', title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs('/og/home.png') } } }),
    ];
    const body = `
${L.header(b, 'home')}
<main id="main">

<script>document.documentElement.classList.add('js')</script>
<section class="op" id="top" aria-labelledby="h-top" data-film="${b}assets/film/town-" data-fps="${OPENING.fps}">
  <div class="op-stick">
    <picture class="op-poster"><source media="(max-aspect-ratio: 17/20)" srcset="${b}assets/film/town-m.webp" width="810" height="1440"><img src="${b}assets/film/town-d.webp" alt="A white architect's model of a British town at night, windows lit warm along the terraces" width="1440" height="810" fetchpriority="high"></picture>
    <video class="op-film" muted playsinline preload="none" disablepictureinpicture disableremoteplayback tabindex="-1" aria-hidden="true"></video>
    <div class="op-shade" aria-hidden="true"></div>
    <div class="op-lines" aria-hidden="true">
      ${OPENING.lines.map(l => `<p class="op-line">${esc(l)}</p>`).join('\n      ')}
    </div>
    <div class="op-still"><ol>${OPENING.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ol></div>
    <div class="op-white" aria-hidden="true"></div>
    <div class="op-end"><div class="wrap">
      <p class="op-kick"><i></i>${esc(site.name)} · Websites, booking and follow-up for UK trades</p>
      <h1 id="h-top">We make that business yours<em>.</em></h1>
      <p class="lead">People search, open a few websites and ring one. I build the one they ring: easy to find on Google, bookable while you are on the tools, and followed up by text.</p>
      <div class="op-ctas"><a class="btn btn-live" href="${b}book/">Book a 30-minute call</a><a class="btn btn-ghost" href="#build">Build a draft of yours</a></div>
    </div></div>
    <a class="op-skip" href="#build">Skip the film</a>
    <span class="op-cue" aria-hidden="true">Scroll</span>
  </div>
</section>

<section class="builder" id="build" aria-labelledby="h-build">
  <div class="wrap b-grid">
    <div class="b-copy">
      <p class="b-kick">Now see yours</p>
      <h2 id="h-build">Type your business name. Watch your website build.</h2>
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
          <li><details class="dx-d"><summary><b>A page for every service, in your town.</b></summary><span>People search for the job and the place, not your name. Each service gets its own page, written for where you work.</span>
            <ul class="dx-pages" id="dxPages"><li class="dom">hartleyheating.co.uk</li>${HEAT_KW.map(k => `<li>/<b>${esc(slug(k + ' leeds'))}</b></li>`).join('')}</ul></details></li>
          <li><details class="dx-d"><summary><b>Your Google Business Profile, matched to the site.</b></summary><span>The same name, number, hours and services in both places, so Google trusts them. That is what gets you into the map results.</span></details></li>
          <li><details class="dx-d"><summary><b>Reviews that ask for themselves.</b></summary><span>After every job the customer gets a text with a link to review you. More reviews, and recent ones, keep you near the top of the map.</span></details></li>
          <li><details class="dx-d"><summary><b>Written so AI answers can quote it.</b></summary><span>Plain answers to what your customers ask, with the structured data search engines read, so ChatGPT and Google&rsquo;s AI answers can name you.</span></details></li>
          <li><details class="dx-d"><summary><b>Ads for when you want work this week.</b></summary><span>Google and Meta ads pointed at the booking page, and tracked to the booked job, not to clicks.</span></details></li>
        </ol>
      </div>
      <div class="dx-col">
        <h3>How visits turn into booked jobs</h3>
        <ol class="dx-list">
          <li><details class="dx-d"><summary><b>Booking with a deposit.</b></summary><span>Real slots from your diary, any hour. A deposit holds the slot, so nobody books and vanishes.</span></details></li>
          <li><details class="dx-d"><summary><b>Missed calls get a text back.</b></summary><span>On a job when they ring? They get a text within a minute with a link to book, before they ring the next name on Google.</span></details></li>
          <li><details class="dx-d"><summary><b>Quotes chase themselves.</b></summary><span>A polite nudge goes out if a quote has not been answered, so fewer of them go cold.</span></details></li>
          <li><details class="dx-d"><summary><b>One place for every enquiry.</b></summary><span>Calls, texts, forms and bookings in one list on your phone, each with where it came from.</span></details></li>
        </ol>
      </div>
    </div>
    <script>if(matchMedia('(min-width:981px)').matches)document.querySelectorAll('.dx-d').forEach(function(e){e.open=true})</script>
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
    ${L.wall(b, FEATURED, 'wall-home')}
    <div class="sec-foot"><a class="btn btn-dark" href="${b}work/">See all ${builds.length}</a><a class="btn btn-ghost" href="${b}work/websites/">Websites</a><a class="btn btn-ghost" href="${b}work/tools/">Tools</a></div>
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
    return L.page(L.head({ b, path: '/', title, description, og: 'home', css: ['device.css', 'opening.css', 'builder.css'], nodes }), body,
      L.scripts(b, ['builds.js', 'trades.js', 'device.js', 'builder.js', 'opening.js']));
  }
}]};
