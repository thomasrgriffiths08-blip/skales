const L = require('../lib.js');
const { site, builds, esc, pad } = L;
const B = n => builds.find(x => x.n === n);

module.exports = { pages: [{
  url: '/what-i-do/', og: 'what-i-do', priority: 0.9, changefreq: 'monthly',
  meta: { key: 'what-i-do', title: 'What I build for service businesses', kicker: 'Websites · booking · follow-up', sub: 'Three systems, each one running on the page. Hand-built, owned by you.' },
  render(b){
    const title = `Websites, booking & follow-up for trades | ${site.name}`;
    const description = `Three things for UK service businesses: a website that captures the enquiry, booking with a pipeline that chases itself, and missed-call automation. Live here.`;
    const [s1, s2, s3] = site.services;
    const nodes = [
      L.webPage({ path: '/what-i-do/', title, description }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'What I do', path: '/what-i-do/' }]),
      ...site.services.map(s => ({ '@type': 'Service', '@id': L.abs('/what-i-do/#' + s.slug), name: s.name, description: s.long,
        provider: { '@id': L.ORG_ID }, areaServed: { '@type': 'Country', name: site.areaServed }, serviceType: s.name,
        audience: { '@type': 'BusinessAudience', name: 'UK service businesses and trades' }, url: L.abs('/what-i-do/#' + s.slug) })),
      { '@type': 'HowTo', name: `How a build with ${site.name} works`, description: 'From a free teardown to a system you own.',
        step: [
          { '@type': 'HowToStep', name: 'The teardown', text: 'Ten minutes on your website, Google listing and what happens when someone tries to reach you. Three things back: what is leaking, what to fix first, what it is worth in jobs.' },
          { '@type': 'HowToStep', name: 'A flat quote', text: 'Every job is quoted flat and agreed before anything starts, with a date.' },
          { '@type': 'HowToStep', name: 'Built in public', text: 'The build happens in days, not months, and you can watch it being made.' },
          { '@type': 'HowToStep', name: 'Handover', text: 'Domain, code and accounts are set up in your name. You own everything from day one.' },
        ] },
    ];
    const t = B(13), f = B(14), r = B(2), st = B(12);
    const body = `
${L.header(b, 'whatido')}
<main id="main">
<section class="hero-w wrap">
  <span class="plate"><span>What I do</span><span>Three systems</span><span class="on"><i class="lamp is-live"></i>All running below</span></span>
  <h1>Websites, booking and follow-up for service businesses.</h1>
  <div class="row">
    <p class="lead">${esc(site.name)} builds three things for UK service businesses &mdash; plumbers, electricians, roofers, fitters, cleaners, salons, anyone whose work comes in by phone: a website that captures the enquiry, booking and a pipeline that chase themselves, and follow-up that runs without you. Every one is running on this page.</p>
  </div>
</section>

<section class="panel" id="${s1.slug}">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">01 &middot; Capture</span><span class="name">${esc(s1.name)}</span></div>
    <div class="body">
      <h2>What is a website that captures the enquiry?</h2>
      <p class="lead">A capture website is a fast, hand-built site whose only job is to turn a visit into a name and a number. ${esc(s1.long)}</p>
      <div class="svc-demo">
        <div class="rig rig-solo" style="--chan:${t.c}">
          <div class="stage">
            <div class="chrome"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><span class="url"><b>${esc(t.name)}</b> &middot; before and after a rebuild</span><a class="pop" href="${b}work/${t.slug}/">Its page</a></div>
            <div class="viewport vp-short" data-solo="${t.slug}"><div class="boot">Powering up</div></div>
          </div>
        </div>
        <p class="hint spec"><span class="lamp is-live"></span> Drag the tape line across the same roofing firm &mdash; its 2011 site on one side, the rebuild on the other.</p>
      </div>
      <ul class="feat cols">
        <li>Three fields and a one-tap call. Nothing between the visitor and getting in touch.</li>
        <li>Written to answer the question the customer typed into Google, page by page.</li>
        <li>Loads before they blink: no page-builder, no theme, no bloat.</li>
        <li>Owned by you: domain, code and hosting in your name from day one.</li>
      </ul>
    </div>
  </div>
</section>

<section class="panel" id="${s2.slug}">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">02 &middot; Book</span><span class="name">${esc(s2.name)}</span></div>
    <div class="body">
      <h2>How does online booking with a pipeline work?</h2>
      <p class="lead">Online booking lets the customer take a slot themselves, from a grid generated off your real calendar, and pay a deposit that holds it. ${esc(s2.long)}</p>
      <div class="svc-demo two">
        <div>
          <div class="rig rig-solo" style="--chan:${f.c}">
            <div class="stage">
              <div class="chrome"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><span class="url"><b>${esc(f.name)}</b></span><a class="pop" href="${b}work/${f.slug}/">Its page</a></div>
              <div class="viewport vp-short" data-solo="${f.slug}"><div class="boot">Powering up</div></div>
            </div>
          </div>
          <p class="hint spec"><span class="lamp is-live"></span> Service, slot, deposit, confirmed &mdash; no phone tag.</p>
        </div>
        <div>
          <div class="dcard">
            <div class="dbar"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><b>pipeline &mdash; this week &middot; Westfield Fencing</b></div>
            <div class="pl">
              <div class="pl-grid">
                <div class="pl-col" id="col0"><p class="lbl">New <span id="c0n">0</span></p></div>
                <div class="pl-col" id="col1"><p class="lbl">Quoted <span id="c1n">0</span></p></div>
                <div class="pl-col" id="col2"><p class="lbl">Booked <span id="c2n">0</span></p></div>
                <div class="pl-col" id="col3"><p class="lbl">Paid <span id="c3n">0</span></p></div>
              </div>
            </div>
            <div class="pl-ping" id="ping"><i></i><span>watching the board&hellip;</span></div>
          </div>
          <p class="hint spec"><span class="lamp is-live"></span> The pipeline that chases: quotes followed up on day 3, by the system. The full version is <a class="lnk" href="${b}work/${r.slug}/">${esc(r.name)}</a>.</p>
        </div>
      </div>
      <ul class="feat cols">
        <li>Slots come from your real calendar. Double-bookings cannot happen.</li>
        <li>A deposit holds the slot, so a booked job is a real job.</li>
        <li>Every enquiry lands on one board with what happened to it.</li>
        <li>Quotes get chased on a schedule, by the system, not by you at 10pm.</li>
      </ul>
    </div>
  </div>
</section>

<section class="panel" id="${s3.slug}">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">03 &middot; Follow up</span><span class="name">${esc(s3.name)}</span></div>
    <div class="body">
      <h2>What does missed-call text-back and review automation do?</h2>
      <p class="lead">Missed-call text-back sends a message to a caller you could not answer, seconds after the ring-out, and turns the voicemail into a conversation. ${esc(s3.long)}</p>
      <div class="svc-demo two">
        <div>
          <div class="dcard">
            <div class="dbar"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><b>calls &mdash; Westfield Fencing</b></div>
            <div class="tb">
              <div class="tb-left">
                <p class="lbl">Incoming calls</p>
                <div id="callList"></div>
                <button class="btn btn-live btn-sm tb-btn" id="missBtn" type="button">Simulate a missed call</button>
              </div>
              <div class="tb-right" id="tbChat"></div>
            </div>
          </div>
          <p class="hint spec"><span class="lamp is-live"></span> The missed-call catcher. The cost of the calls it catches is metered by <a class="lnk" href="${b}work/${st.slug}/">${esc(st.name)}</a>.</p>
        </div>
        <div>
          <div class="dcard">
            <div class="dbar"><span class="pips" aria-hidden="true"><i></i><i></i><i></i></span><b>reviews &mdash; Westfield Fencing</b></div>
            <div class="rv">
              <div class="rv-feed" id="rvFeed"></div>
              <div class="rv-score">
                <div class="stars" id="rvStars"><b>&#9733;&#9733;&#9733;&#9733;</b>&#9733;</div>
                <div class="num" id="rvNum">4.6</div>
                <div class="lbl">Google rating<br>this quarter</div>
              </div>
            </div>
          </div>
          <p class="hint spec"><span class="lamp is-live"></span> The review engine: the request goes out the same day, one tap to the review box, the reply posted in your name.</p>
        </div>
      </div>
      <ul class="feat cols">
        <li>Text-back fires automatically, under a minute after the missed call.</li>
        <li>It asks one question, so the customer replies instead of shopping around.</li>
        <li>Review requests go out the day the job is done, while they are still pleased.</li>
        <li>&ldquo;You&rsquo;re due a service&rdquo; reminders next year, without anyone remembering.</li>
      </ul>
    </div>
  </div>
</section>

<section class="panel" id="process">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">The process</span><span class="name">Teardown, quote, build, handover</span></div>
    <div class="body">
      <h2>How does a build with ${esc(site.name)} work?</h2>
      <ol class="steps">
        <li><b>The teardown.</b> Ten minutes on your website, your Google listing and what happens when someone tries to reach you. Three things back: what is leaking, what to fix first, what it is worth in jobs. Free, by message.</li>
        <li><b>A flat quote.</b> Every job is quoted flat and agreed before anything starts, with a date. No surprises, and no meeting that should have been a message.</li>
        <li><b>Built in public.</b> A capture site takes days; a full system usually one to two weeks. You can watch it being made.</li>
        <li><b>Handover.</b> Domain, code and accounts set up in your name. Walk away tomorrow and it all keeps working.</li>
      </ol>
      <div class="cta-row" style="margin-top:1.6rem"><a class="btn btn-live" href="${b}book/">Book a call</a><a class="btn btn-ghost" href="${b}teardown.html">Get the free teardown</a></div>
    </div>
  </div>
</section>
</main>
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/what-i-do/', title, description, og: 'what-i-do', css: ['rack.css', 'systems.css'], nodes }), body, L.scripts(b, ['builds.js', 'rack.js', 'systems.js']));
  }
}]};
