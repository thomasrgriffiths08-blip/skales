const L = require('../lib.js');
const { site, builds, esc } = L;
const STRIP = [14, 2, 1, 3, 12, 11, 8, 10, 7];   // channel order on the homepage strip

module.exports = { pages: [{
  url: '/', og: 'home', priority: 1.0, changefreq: 'weekly',
  meta: { key: 'home', title: `${site.name} — websites & systems for service businesses`, kicker: 'Websites & systems · UK', sub: 'Sixteen working builds you can use. Booking, missed-call text-back, quotes, CRMs — hand-built, owned by you.' },
  render(b){
    const title = `Websites & booking systems for UK trades | ${site.name}`;
    const description = 'Websites, online booking and missed-call text-back for UK trades, built by one person and owned by you. Sixteen working builds run live on this site.';
    const nodes = [
      L.webPage({ path: '/', title, description, extra: { primaryImageOfPage: { '@type': 'ImageObject', url: L.abs('/og/home.png') } } }),
    ];
    const proof = [
      ['16', 'working builds, live on this site'],
      ['Every one', 'you can open and use'],
      ['One person', 'the one you message builds it'],
      ['Weekly', 'a new system built in public'],
      ['Yours', 'domain, code and accounts from day one'],
    ];
    const body = `
${L.header(b, 'home')}
<main id="main">
<section class="hero bench" id="top" aria-label="Introduction">
  <div class="worklight" aria-hidden="true"></div>
  <div class="hero-copy">
    <div class="power-row">
      <button class="power" id="power" type="button" aria-pressed="false" aria-label="Power switch: turn the page on or off">
        <span class="pw-house" aria-hidden="true"><span class="pw-knob"><span class="pw-lamp"></span></span></span>
        <span class="pw-lab" aria-hidden="true"><b>Off</b><b>On</b></span>
      </button>
      <span class="plate"><span>Websites &amp; systems</span><span>Service businesses</span><span>UK</span></span>
    </div>
    <h1>Everything on<br>this page is<br><span class="on">switched on.</span></h1>
    <p class="lead">${esc(site.name)} builds websites and systems for UK service businesses &mdash; the kind that <strong>catch the enquiry at 9:47pm, answer it in seconds and put the job in the diary</strong> while you&rsquo;re asleep. Sixteen of them are running on this site right now. Go and use one.</p>
    <div class="cta-row">
      <a class="btn btn-live" href="${b}book/">Book a call</a>
      <a class="btn btn-ghost" href="${b}work/">Open the rack</a>
    </div>
    <ul class="proof" aria-label="Why this is the right option">
      ${proof.map(([k, v]) => `<li><b>${esc(k)}</b><span>${esc(v)}</span></li>`).join('')}
    </ul>
  </div>
  <div class="hero-stage">
    <p class="mon-note spec"><span class="lamp" id="rigLamp"></span><span><b id="monWord">Standby</b> &mdash; a real build, not a picture of one. Use it.</span></p>
    <div class="stage">
      <div class="chrome">
        <span class="pips" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="url" id="rigUrl"></span>
        <a class="pop" id="rigPop" href="${b}work/" target="_blank" rel="noopener">Open full size</a>
      </div>
      <div class="viewport" id="viewport"><div class="boot" id="boot"><span class="lamp"></span> Standby &mdash; flip the switch</div></div>
      <div class="rig-cap" id="rigCap"></div>
    </div>
    <div class="hstrip" id="rail" role="tablist" aria-label="Switch channel"></div>
  </div>
</section>

<section class="panel night" id="night">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">The problem</span><span class="name">Most jobs aren&rsquo;t lost. They&rsquo;re missed.</span></div>
    <div class="body">
      <h2>What happens to a call you can&rsquo;t take at teatime?</h2>
      <p class="lead">A call you can&rsquo;t take at teatime is a customer ringing the next firm on the list by half past. You don&rsquo;t need to answer faster. You need something that answers for you. This is the sequence ${esc(site.name)} installs, played out on an invented heating firm.</p>
      <div class="line">
        <div class="phone">
          <div class="ph-head"><span class="av">R</span><span><b>Redgate Heating</b><span>07700 900461</span></span></div>
          <div class="thread" id="thread"></div>
        </div>
        <div class="log-panel">
          <div class="log-head">
            <span class="lamp" id="lineLamp"></span>
            <span class="spec">Line 1 &middot; residential</span>
            <span class="sp"></span>
            <button class="btn btn-live btn-sm" type="button" id="ring">Ring the line</button>
          </div>
          <ol class="log" id="log"><li style="border:0"><span class="log-empty">Press <b style="color:var(--dyeline)">Ring the line</b> and watch what happens to a call nobody picks up.</span></li></ol>
          <div class="log-foot" id="lineOut"><span>What happens to that call is the whole business.</span></div>
        </div>
      </div>
      <p class="f-note" style="margin-top:1rem">Invented business, invented customer, Ofcom drama number. The sequence is the one that actually gets built.</p>
    </div>
  </div>
</section>

<section class="panel" id="build">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">What I build</span><span class="name">Three things, each running on this site</span></div>
    <div class="body">
      <h2>What does ${esc(site.name)} build?</h2>
      <p class="lead">Three things, and each one is proven by a working build you can open: a website that captures the enquiry, booking and a pipeline that chase themselves, and follow-up that runs without you.</p>
      ${site.services.map(s => { const pb = builds.find(x => x.n === s.proof); return `
      <a class="brow" href="${b}work/${pb.slug}/">
        <span><h3>${esc(s.name)}</h3><p>${esc(s.long)}</p></span>
        <span class="plate"><span>Proven on</span><span class="on">CH ${L.pad(pb.n)}</span><span><i class="sw" style="background:${pb.c}"></i>${esc(pb.name)}</span></span>
      </a>`; }).join('')}
      <p class="f-note" style="margin-top:1.4rem">Every one of these has a full page: <a class="lnk" href="${b}what-i-do/">what I do, with the systems running</a>.</p>
    </div>
  </div>
</section>

<section class="panel" id="rack">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">The rack</span><span class="name">Sixteen builds you can actually open</span></div>
    <div class="body">
      <div class="rack-head">
        <div>
          <h2>Which builds can you try on this site?</h2>
          <p class="lead" style="margin-top:.9rem">Quote engines, a CRM, a dispatch board, booking and deposits, four full websites. Hover one and it wakes up; open one and it has its own page.</p>
        </div>
        <a class="btn btn-ghost" href="${b}work/">Open all sixteen</a>
      </div>
    </div>
  </div>
  <div class="strip" id="stripRack" data-strip="${STRIP.join(',')}"></div>
  <div class="wrap"><p class="f-note" style="padding:1rem 0 1.6rem">Every business in them is invented &mdash; deliberately, so nothing here exposes a real client.</p></div>
</section>

<section class="panel" id="operator">
  <div class="wrap inner">
    <div class="lab"><span class="sheet">Who</span><span class="name">One person. The one you message builds it.</span></div>
    <div class="body">
      <h2>Who is behind ${esc(site.name)}?</h2>
      <dl class="nameplate">
        <div><dt>Operator</dt><dd><b>${esc(site.founder.name)}.</b> No account manager, no handover to a junior. You talk to the person doing the work.</dd></div>
        <div><dt>Base</dt><dd>${esc(site.areaServed)}. Built for the way UK service businesses actually get their work &mdash; the phone, Google, word of mouth.</dd></div>
        <div><dt>Cadence</dt><dd>One system a week, built in public on Instagram. You can watch the next one being made.</dd></div>
        <div><dt>Method</dt><dd>By hand. No page-builders, no themes, no platform that charges you monthly to keep your own site alive.</dd></div>
        <div><dt>Ownership</dt><dd>Domain, code and accounts in your name from day one. Walk away tomorrow and it all keeps working.</dd></div>
        <div><dt>The demos</dt><dd>Sixteen, all fictional businesses. Real working software &mdash; just nothing that exposes a client.</dd></div>
      </dl>
      <p class="f-note" style="margin-top:1.2rem"><a class="lnk" href="${b}why/">Why it works this way</a></p>
    </div>
  </div>
</section>
</main>

<section class="day on-day cta-band">
  <div class="wrap grid">
    <div>
      <h2>Ready when you are.</h2>
      <p class="lead" style="margin-top:.8rem">A short call to find out what is leaking and what to fix first. No pitch, no proposal deck. If ${esc(site.name)} is the wrong fit, you will hear that on the call too.</p>
    </div>
    <div class="cta-col">
      <a class="btn btn-live" href="${b}book/">Book a call</a>
      <a class="btn btn-ghost" href="${b}teardown.html">Or get a free teardown by message</a>
    </div>
  </div>
</section>
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/', title, description, og: 'home', css: ['rack.css', 'hero.css'], nodes }), body, L.scripts(b, ['builds.js', 'rack.js', 'hero.js', 'nightline.js']));
  }
}]};
