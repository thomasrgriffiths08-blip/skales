const L = require('../lib.js');
const { site, builds, esc, Words } = L;
const SITES = builds.filter(x => x.kind === 'site');
const B = n => builds.find(x => x.n === n);
const TRY = require('./try.js').DEMOS.filter(x => x.live), tryCard = require('./try.js').card;
/* the same slug rule as assets/builder.js, so the example pages match what the builder writes */
const slug = s => String(s).toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const HEAT_KW = require('../../data/trades.js').find(t => t.key === 'heating').kw;
/* four websites fill a row of phones, three parts of the system a row of screens */
const FEATURED = [7, 5, 4, 12, 13, 14, 15].map(B).filter(Boolean);
/* the picker: the twelve websites as a list down the side. The chosen one fills the stage as a sharp laptop shot
   (assets/screens/NN-1200|2160.webp, made by tools/screens.mjs) with its phone running in front (assets/clips/NN.mp4).
   Trades first, since they are who the page is for */
const PICK = [11, 12, 7, 10, 9, 8, 1, 5, 6, 4, 3, 2].map(B).filter(Boolean);
const pickName = x => { const n = x.name.split(/\s+[—–-]\s+/)[0]; return n === n.toUpperCase() ? n.charAt(0) + n.slice(1).toLowerCase().replace(/\s(\w)/g, (m, c) => ' ' + c.toUpperCase()) : n; };
const shot = (b, x, w) => `${b}assets/screens/${L.pad(x.n)}-${w}.webp`;
const picker = b => {
  const x0 = PICK[0];
  return `<section class="pk" id="yours" aria-labelledby="h-top" data-pk>
  <div class="pk-in">
    <p class="pk-kick"><i></i>Websites, booking and follow-up for UK trades</p>
    <h1 id="h-top" class="pk-h">Websites that get you booked.</h1>
    <p class="pk-sub">Twelve made-up businesses, each built from scratch. Pick one to see it.</p>
    <ol class="pk-list" role="tablist" aria-label="The twelve websites">
      ${PICK.map((x, i) => `<li role="presentation"><button type="button" role="tab" id="pkt-${i}" aria-controls="pkStage" aria-selected="${i ? 'false' : 'true'}" tabindex="${i ? -1 : 0}" data-i="${i}" data-n="${L.pad(x.n)}" data-slug="${x.slug}" data-name="${esc(pickName(x))}" data-line="${esc(x.short)}"><span class="pk-num">${L.pad(i + 1)}</span><span class="pk-name">${esc(pickName(x))}</span><span class="pk-kind">${esc(x.trade || x.biz)}</span><i class="pk-run" aria-hidden="true"></i></button></li>`).join('\n      ')}
    </ol>
    <div class="pk-right">
    <div class="pk-stage" id="pkStage" role="tabpanel" aria-labelledby="pkt-0">
      <a class="pk-win" href="${b}work/${x0.slug}/" data-go>
        <span class="pk-chrome" aria-hidden="true"><i></i><i></i><i></i><b data-pk-name>${esc(pickName(x0))}</b><em>Made-up business</em></span>
        <span class="pk-shots">${PICK.map((x, i) => i
          ? `<img data-srcset="${shot(b, x, 1200)} 1200w, ${shot(b, x, 2160)} 2160w" sizes="(min-width: 1000px) 66vw, 92vw" width="1200" height="750" alt="" decoding="async">`
          : `<img class="is-on" fetchpriority="high" src="${shot(b, x, 1200)}" srcset="${shot(b, x, 1200)} 1200w, ${shot(b, x, 2160)} 2160w" sizes="(min-width: 1000px) 66vw, 92vw" width="1200" height="750" alt="${esc(pickName(x))} on a laptop: ${esc(x.short)}" decoding="async">`).join('')}</span>
      </a>
      <a class="pk-phone" href="${b}work/${x0.slug}/" data-go tabindex="-1" aria-hidden="true">
        <span class="pk-screen"><img src="${L.clipSrc(b, x0, 'webp')}" width="600" height="1077" alt="" decoding="async"><video muted playsinline loop preload="none" aria-hidden="true"></video></span>
      </a>
    </div>
    <div class="pk-cap" aria-live="polite">
      <p class="pk-cname" data-pk-name>${esc(pickName(x0))}</p>
      <p class="pk-cline" data-pk-line>${esc(x0.short)}</p>
      <a class="pk-open" href="${b}work/${x0.slug}/" data-go>Open the site <span aria-hidden="true">&rarr;</span></a>
    </div>
    </div>
    <div class="pk-ctas"><a class="btn pk-book" href="${b}book/">Book a call</a><a class="pk-all" href="${b}work/">See all the work</a></div>
  </div>
</section>`;
};
/* the one Skales colour: a warm lit-window amber */
const AMBER = Object.assign({ c: '#E8A84B' }, L.world('#E8A84B'));

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
<script>document.querySelector('.site-head').classList.add('on-dark')</script>
<main id="main">

<script>document.documentElement.classList.add('js')</script>
${picker(b)}

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
      <p class="lead">The draft is the easy part. This is the whole chain, from a search in <span data-dx="town">your town</span> to the job in your diary. I build all five links, so nothing drops between them.</p>
    </div>
    <ol class="chain">
      <li class="ch">
        <p class="ch-k"><span>01</span>Found</p>
        <h3>They search for the job and the town.</h3>
        <div class="ch-m ch-g" aria-hidden="true"><span class="ch-q"><span data-dx="kw">boiler repair</span> <span data-dx="town">leeds</span></span><b data-dx="biz">Hartley Heating</b><span class="ch-r"><i>4.9</i> ★★★★★ (58) · Open now</span><ul class="ch-pages" id="dxPages"><li class="dom">hartleyheating.co.uk</li>${HEAT_KW.slice(0, 3).map(k => `<li>/<b>${esc(slug(k + ' leeds'))}</b></li>`).join('')}</ul></div>
        <p class="ch-t">A page for every service in your town, your Google profile matched to it, and reviews that keep coming.</p>
      </li>
      <li class="ch">
        <p class="ch-k"><span>02</span>Chosen</p>
        <h3>The site makes you the easy pick.</h3>
        <div class="ch-m" aria-hidden="true"><span class="ch-l" data-dx="svc">Boiler service</span><span class="ch-big" data-dx="price">from £85</span><span class="ch-r"><i>4.9</i> from 58 Google reviews</span><span class="ch-btn">Book online</span></div>
        <p class="ch-t">Quick on a phone, prices and reviews up front, and a Book button on every screen.</p>
      </li>
      <li class="ch">
        <p class="ch-k"><span>03</span>Answered</p>
        <h3>Miss the call, not the job.</h3>
        <div class="ch-m" aria-hidden="true"><span class="ch-l">Missed call · 07700 900412</span><span class="ch-sms">Sorry I missed you, I’m on a job. Book a time here: <span data-dx="dom">hartleyheating.co.uk</span>/book</span><span class="ch-r">Sent 9 seconds after the call</span></div>
        <p class="ch-t">Every missed call gets a text back in seconds. Calls, texts and forms land in one inbox.</p>
        <a class="ch-go" href="${b}work/inbox/">See it work</a>
      </li>
      <li class="ch">
        <p class="ch-k"><span>04</span>Booked</p>
        <h3>They pick a time and pay a deposit.</h3>
        <div class="ch-m" aria-hidden="true"><span class="ch-l">Thu 23 Oct · 14:00</span><span class="ch-big" data-dx="svc">Boiler service</span><span class="ch-r ch-ok">£20 deposit paid</span><span class="ch-r">Added to your diary</span></div>
        <p class="ch-t">Real free times from your diary, any hour. Quotes chase themselves until they get an answer.</p>
        <a class="ch-go" href="${b}work/booking/">See it work</a>
      </li>
      <li class="ch">
        <p class="ch-k"><span>05</span>Back again</p>
        <h3>Then they come back, and bring friends.</h3>
        <div class="ch-m" aria-hidden="true"><span class="ch-l">After the job</span><span class="ch-r"><i>5.0</i> ★★★★★ review left</span><span class="ch-l ch-sep">Next October</span><span class="ch-r ch-ok">Service reminder sent · booked</span></div>
        <p class="ch-t">A review ask after every job, and a reminder the week next year’s service is due.</p>
        <a class="ch-go" href="${b}work/reviews/">See it work</a>
      </li>
    </ol>
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
      <p class="lead">${Words(SITES.length)} full websites, each built differently for a different kind of business, and the one system that runs behind them. Every business is made up so no client is ever on show, and every one opens and works like the real thing.</p>
    </div>
    ${L.wall(b, FEATURED, 'wall-home')}
    <div class="sec-foot"><a class="btn btn-dark" href="${b}work/">See all the work</a><a class="btn btn-ghost" href="${b}work/#websites">The websites</a><a class="btn btn-ghost" href="${b}work/system/">The system</a></div>
  </div>
</section>

<section class="sec" id="try" aria-labelledby="h-try">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-try">Don't take my word for it. Try it.</h2>
      <p class="lead">Three live demos that run on your phone. You play the customer, then see what the business sees. About a minute each.</p>
    </div>
    <div class="try-list">${TRY.map((x, i) => tryCard(b, x, i)).join('')}</div>
  </div>
</section>

<section class="sec sec-alu" id="why" aria-labelledby="h-why">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-why">Why ${esc(site.name)}.</h2></div>
    <div class="why3">
      <div><h3>You own it</h3><p>The domain, the code and every account sit in your name from the first day. Nothing is rented back to you monthly, and there is no platform your site cannot leave.</p></div>
      <div><h3>One person</h3><p>${esc(site.founder.name)} builds every site and system personally. No sales call handed to a junior, nothing lost in a handover, because there is not one.</p></div>
      <div><h3>Proof, not promises</h3><p>${esc(L.workLine())} on this site, and new builds made in public on <a class="lnk" href="${site.instagram}" target="_blank" rel="noopener">Instagram</a>. Open any of them and use it.</p></div>
    </div>
    <div class="sec-foot"><a class="btn btn-ghost" href="${b}why/">More about the studio</a></div>
  </div>
</section>
</main>
${L.ctaBand(b, 'Ready when you are.', 'A short call about what is leaking in your business and what would fix it. If ' + esc(site.name) + ' is the wrong fit, you will hear that on the call too.', `<a class="btn btn-ghost" href="${b}teardown.html">Free teardown by message</a>`)}
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/', title, description, og: 'home', css: ['device.css', 'picker.css', 'builder.css'], nodes, palette: AMBER, theme: '#0B0C0E' }), body,
      L.scripts(b, ['builds.js', 'trades.js', 'device.js', 'builder.js', 'picker.js']));
  }
}]};
