const L = require('../lib.js');
const { site, builds, esc, Words } = L;
const SITES = builds.filter(x => x.kind === 'site');
const B = n => builds.find(x => x.n === n);
const TRY = require('./try.js').DEMOS.filter(x => x.live);

/* The home answers a stranger's five questions in order, one per screen: what is this and is it for me, does it
   work, what happens after the website, can he do my kind of business, how does it work and who is he. Then the
   calendar, so nobody leaves to book. People who already know Tom have Book a call in the header the whole way. */

/* the first screen shows one finished website at a time, full width, chosen by trade. It opens on one that is not
   yellow, so the page's own yellow is the only one on screen when it loads */
const HERO = [[7, 'Boxing gym'], [10, 'Physio'], [11, 'Electrician'], [12, 'Garage'], [9, 'Accountant'], [8, 'Tattoo studio']]
  .map(([n, label]) => Object.assign({ label }, B(n))).filter(x => x.slug);
/* six of the twelve, large; the rest are one tap away on the Work page */
const SIX = [12, 11, 10, 7, 8, 5].map(B).filter(Boolean);
const shot = (b, x, w) => `${b}assets/screens/${L.pad(x.n)}-${w}.webp`;
const nameOf = x => { const n = x.name.split(/\s+[—–-]\s+/)[0]; return n === n.toUpperCase() ? n.charAt(0) + n.slice(1).toLowerCase().replace(/\s(\w)/g, (m, c) => ' ' + c.toUpperCase()) : n; };
const BRAND = Object.assign({}, L.BRAND);

const hero = b => {
  const x0 = HERO[0];
  const made = x => `${esc(nameOf(x))} · made-up ${esc((x.trade || x.biz).toLowerCase())}`;
  return `<section class="hx hx-home" aria-labelledby="h-top">
  <div class="wrap">
    <div class="hx-top">
      <h1 id="h-top">Websites that <br>get you <em>booked.</em></h1>
      <div class="hx-side">
        <p class="hx-sub"><strong>I build your website, the booking and follow-up behind it, and run the ads that fill it.</strong> One flat price, agreed before anything starts.</p>
        <div class="hx-ctas"><a class="btn btn-live btn-lg" href="${b}book/">Book a call</a><a class="tlink" href="${b}try/missed-call/">Try a live demo</a></div>
      </div>
    </div>
    <div class="hx-stage" data-hx>
      <div class="hx-bar">
        <div class="hx-tabs">
          <div role="tablist" aria-label="See a website for your trade">
            ${HERO.map((x, i) => `<button type="button" role="tab" class="chip" aria-selected="${i ? 'false' : 'true'}" data-i="${i}" data-slug="${x.slug}" data-name="${made(x)}">${esc(x.label)}</button>`).join('')}
          </div>
          <a class="chip chip-more" href="${b}work/">+${SITES.length - HERO.length} more</a>
        </div>
        <p class="hx-note" data-hx-name>${made(x0)}</p>
      </div>
      <a class="hx-win" href="${b}work/${x0.slug}/" data-hx-go aria-label="Open this website and use it">
        <span class="hx-shots">${HERO.map((x, i) => `<picture><source media="(max-width: 700px)" srcset="${b}assets/screens/${L.pad(x.n)}-ph.webp" width="780" height="1200"><img${i ? ' loading="lazy"' : ' class="is-on" fetchpriority="high"'} src="${shot(b, x, 1200)}" srcset="${shot(b, x, 1200)} 1200w, ${shot(b, x, 2160)} 2160w" sizes="(min-width: 1296px) 1200px, 94vw" width="1200" height="750" alt="${esc(nameOf(x))}, a website for a made-up ${esc((x.trade || x.biz).toLowerCase())}" data-i="${i}" decoding="async"></picture>`).join('')}</span>
      </a>
    </div>
  </div>
</section>`;
};

const tryIt = b => {
  const x = TRY[0], rest = TRY.slice(1);
  return `<section class="hs hs-try" id="try" aria-labelledby="h-try">
  <div class="wrap hs-two">
    <a class="ph-frame" href="${b}try/${x.slug}/" aria-label="Start the missed call demo">
      <img src="${b}assets/try/${x.slug}.webp" width="480" height="1002" alt="${esc(x.alt)}" loading="lazy" decoding="async">
      <span class="ph-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
    </a>
    <div class="hs-copy">
      <p class="kick">Try it · about a minute · on your phone</p>
      <h2 id="h-try">Miss a call. Watch it turn into a booking.</h2>
      <p class="lead">Be your own customer. Ring the business, let it ring out, and see the text that comes back, the booking, the deposit and what lands in the owner's diary.</p>
      <ol class="flow">
        <li><span>01</span>The call rings out</li>
        <li><span>02</span>A text goes back in seconds</li>
        <li><span>03</span>They book and pay a deposit</li>
        <li><span>04</span>It is in the diary</li>
      </ol>
      <div class="hs-ctas"><a class="btn btn-live" href="${b}try/${x.slug}/">Start the demo</a>${rest.map(r => `<a class="tlink" href="${b}try/${r.slug}/">${esc(r.name)} <span aria-hidden="true">→</span></a>`).join('')}</div>
    </div>
  </div>
</section>`;
};

const system = b => {
  const sys = B(13);
  return `<section class="hs hs-sys" id="system" aria-labelledby="h-sys">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">What happens after the website</p>
      <h2 id="h-sys">Then the system does the chasing.</h2>
      <p class="lead">One app behind the website, set up for your business and owned by you. It answers, books and follows up while you are on a job.</p>
    </div>
    <a class="sys-shot" href="${b}work/${sys.slug}/">
      <span class="chrome" aria-hidden="true"><i></i><i></i><i></i><span>The system · Today</span></span>
      <img src="${b}assets/home/system-today.webp" srcset="${b}assets/home/system-today-800.webp 800w, ${b}assets/home/system-today.webp 1600w" sizes="(min-width: 1260px) 1200px, 92vw" width="1600" height="1000" alt="The Skales system's Today screen: calls caught, jobs booked and what still needs the owner" loading="lazy" decoding="async">
    </a>
    <ul class="four">
      <li><b>Every call caught.</b><span>A missed call gets a text back in seconds, and calls, texts and forms land in one inbox.</span></li>
      <li><b>Booked without you.</b><span>Customers pick a real free time and pay a deposit. It goes straight in the diary.</span></li>
      <li><b>Quotes chased.</b><span>Quotes come from your price list and chase themselves until the customer answers.</span></li>
      <li><b>Reviews asked for.</b><span>Every finished job asks for a Google review, and next year's service reminds itself.</span></li>
    </ul>
    <div class="hs-ctas"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="tlink" href="${b}work/${sys.slug}/">See the system working <span aria-hidden="true">→</span></a></div>
  </div>
</section>`;
};

const work = b => `<section class="hs hs-work" id="work" aria-labelledby="h-work">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">The work</p>
      <h2 id="h-work">${Words(SITES.length)} websites. Every one built from scratch.</h2>
      <p class="lead">Each one is for a different kind of business and opens and works like the real thing. The businesses are made up, so no client is ever on show.</p>
    </div>
    <div class="six">${SIX.map((x, i) => `<a class="w" href="${b}work/${x.slug}/">
      <span class="w-shot"><img src="${shot(b, x, 1200)}" srcset="${shot(b, x, 1200)} 1200w, ${shot(b, x, 2160)} 2160w" sizes="(min-width: 900px) 46vw, 92vw" width="1200" height="750" alt="${esc(nameOf(x))} on a laptop: ${esc(x.short)}" loading="lazy" decoding="async"></span>
      <span class="w-cap"><b>${esc(nameOf(x))}</b><span>${esc(x.trade || x.biz)}</span></span>
    </a>`).join('')}</div>
    <div class="hs-ctas"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-glass" href="${b}work/">See all ${Words(SITES.length).toLowerCase()}</a></div>
  </div>
</section>`;

const how = b => `<section class="hs hs-how" id="how" aria-labelledby="h-how">
  <div class="wrap">
    <div class="hs-head">
      <p class="kick">How it works</p>
      <h2 id="h-how">One call, one price, then it is built.</h2>
    </div>
    <ol class="steps">
      <li><span class="n">01</span><b>A free call</b><span>45 minutes on what is losing you jobs now and what to fix first. Or ask for a <a class="lnk" href="${b}teardown.html">free teardown by message</a>.</span></li>
      <li><span class="n">02</span><b>A flat price and a date</b><span>Agreed before anything starts, if it is a fit. If it is not, you will hear that on the call.</span></li>
      <li><span class="n">03</span><b>Built by hand</b><span>The website and the system behind it, hand-coded with no page builder and no theme.</span></li>
      <li><span class="n">04</span><b>Yours from day one</b><span>The domain, the code and every account sit in your name. Nothing is rented back to you monthly.</span></li>
    </ol>
    <div class="hs-ctas"><a class="btn btn-live" href="${b}book/">Book the free call</a></div>
  </div>
</section>`;

const who = b => `<section class="hs hs-who" id="who" aria-labelledby="h-who">
  <div class="wrap who">
    <div>
      <p class="kick">Who builds it</p>
      <h2 id="h-who">${esc(site.founder.name)}. One person, start to finish.</h2>
      <p class="lead">Every website and system here is built by me. No sales team, no handover to a junior, because there is nobody to hand over to. One new system a week is built in public on <a class="lnk" href="${site.instagram}" target="_blank" rel="noopener">Instagram</a>.</p>
      <p class="hs-ctas"><a class="tlink" href="${b}why/">More about the studio <span aria-hidden="true">→</span></a></p>
    </div>
  </div>
</section>`;

const book = b => {
  const cal = site.calendly ? `${site.calendly}${site.calendly.includes('?') ? '&' : '?'}hide_gdpr_banner=1&hide_landing_page_details=1&background_color=121317&text_color=f4f4f5&primary_color=ffe600` : '';
  return `<section class="hs hs-book" id="book" aria-labelledby="h-book">
  <div class="wrap book2">
    <div>
      <p class="kick">Book</p>
      <h2 id="h-book">Pick a time for a free call.</h2>
      <p class="lead">Forty-five minutes on what is losing you jobs and what would fix it. The person on the call is the person who builds it.</p>
      <ul class="book-alt">
        ${site.whatsapp ? `<li><a class="tlink" data-wa="Hi Tom, found you through your site." href="${L.waHref('Hi Tom, found you through your site.')}">Rather message? WhatsApp me <span aria-hidden="true">→</span></a></li>` : ''}
        <li><a class="tlink" href="${b}teardown.html">Rather not talk? Get a free teardown by message <span aria-hidden="true">→</span></a></li>
        <li><a class="tlink" href="mailto:${esc(site.email)}">Or email ${esc(site.email)}</a></li>
      </ul>
    </div>
    ${cal ? `<div class="cal" data-cal="${esc(cal)}"><a class="btn btn-live" href="${b}book/">Open the calendar</a><p>Every free slot, booked in a couple of taps.</p></div>` : `<div class="cal"><a class="btn btn-live" href="${b}book/">Book a call</a></div>`}
  </div>
</section>`;
};

module.exports = { pages: [{
  url: '/', og: 'home', priority: 1.0, changefreq: 'weekly',
  meta: { key: 'home', title: 'Websites that get you booked.', kicker: `${site.name} · websites · booking · ads · UK`, sub: 'Websites, booking and follow-up for UK trades, built by one person. Real builds run live on the page.' },
  render(b){
    const title = `Websites & booking systems for UK trades | ${site.legalName}`;
    const description = 'Websites, online booking, missed-call text-back and ads for UK trades, built by one person. See twelve real builds and try a live demo on your phone.';
    const nodes = [
      L.webPage({ path: '/', title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs('/og/home.png') } } }),
      { '@type': 'ItemList', name: 'Example websites', itemListElement: SIX.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: L.abs(`/work/${x.slug}/`), name: nameOf(x) })) },
    ];
    const body = `
${L.header(b, 'home')}
<script>document.querySelector('.site-head').classList.add('on-dark')</script>
<main id="main" class="home">
${hero(b)}
${tryIt(b)}
${system(b)}
${work(b)}
${how(b)}
${who(b)}
${book(b)}
</main>
${L.footer(b, { mbar: false, dark: true })}`;
    return L.page(L.head({ b, path: '/', title, description, og: 'home', css: ['home.css'], nodes, palette: BRAND, theme: '#0A0B0D', dark: false }), body,
      L.scripts(b, ['home.js']));
  }
}]};
