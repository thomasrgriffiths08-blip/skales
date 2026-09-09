const L = require('../lib.js');
const { site, esc } = L;
module.exports = { pages: [{
  url: '/book/', og: 'book', priority: 0.9, changefreq: 'monthly',
  meta: { key: 'book', title: 'Book a call', kicker: 'A few questions first · then a slot', sub: 'Tell me what is leaking. Pick a time. No pitch, no proposal deck.' },
  render(b){
    const title = `Book a call — a few questions, then a time | ${site.name}`;
    const description = `Book a short call. Four quick questions so it is about your business, then pick a slot straight into the diary. For UK service businesses. No pitch.`;
    const nodes = [
      L.webPage({ path: '/book/', title, description, type: 'ContactPage', extra: { potentialAction: { '@type': 'ReserveAction', name: 'Book a call', target: L.abs('/book/') } } }),
      L.breadcrumb([{ name: 'Home', path: '/' }, { name: 'Book a call', path: '/book/' }]),
    ];
    const chips = (name, opts, multi) => opts.map((o, i) => `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('');
    const body = `
${L.header(b, 'book')}
<main id="main">
<section class="hero-w wrap book-head">
  <h1>A short call. A few questions first.</h1>
  <p class="lead">Four quick questions so the call is about your business and not a pitch, then pick a time straight into the diary. Takes about a minute.</p>
</section>

<section class="wrap book-wrap">
  <form class="book" id="book" novalidate>
    <ol class="book-steps" id="steps" aria-label="Progress"><li aria-current="step">Business</li><li>Problem</li><li>Today</li><li>Size</li><li>You</li><li>Time</li></ol>

    <fieldset class="bstep" data-step="1">
      <legend><h2>What kind of business is it?</h2></legend>
      <div class="chips">${chips('kind', ['Plumbing & heating','Electrical','Roofing','Building & joinery','Kitchens & bathrooms','Landscaping & fencing','Cleaning','Salon & beauty','Another service business','Not a service business'], false)}</div>
      <p class="err" hidden>Pick one to carry on.</p>
      <div class="bnav"><button class="btn btn-live" type="button" data-next>Next</button></div>
    </fieldset>

    <fieldset class="bstep" data-step="2" hidden>
      <legend><h2>What is the problem right now?</h2></legend>
      <p class="hint" style="margin-bottom:12px">Pick everything that applies</p>
      <div class="chips">${chips('problem', ['No website','Website brings no work','Missing calls','No online booking','Quotes go cold','Reviews are thin','Google listing is weak','Something else'], true)}</div>
      <p class="err" hidden>Pick at least one.</p>
      <div class="bnav"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn btn-live" type="button" data-next>Next</button></div>
    </fieldset>

    <fieldset class="bstep" data-step="3" hidden>
      <legend><h2>How do jobs come in today?</h2></legend>
      <div class="chips">${chips('source', ['Word of mouth','Google','Facebook or Instagram','Checkatrade, Bark or similar','Repeat customers','Not sure'], true)}</div>
      <p class="err" hidden>Pick at least one.</p>
      <div class="bnav"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn btn-live" type="button" data-next>Next</button></div>
    </fieldset>

    <fieldset class="bstep" data-step="4" hidden>
      <legend><h2>How big is the team?</h2></legend>
      <div class="chips">${chips('size', ['Just me','2 to 5','6 to 15','16 or more'], false)}</div>
      <p class="err" hidden>Pick one.</p>
      <div class="bnav"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn btn-live" type="button" data-next>Next</button></div>
    </fieldset>

    <fieldset class="bstep" data-step="5" hidden>
      <legend><h2>And you.</h2></legend>
      <div class="fields">
        <div class="field"><label for="bname">Your name</label><input id="bname" name="name" autocomplete="name" required placeholder="e.g. Dave"></div>
        <div class="field"><label for="bbiz">Business name</label><input id="bbiz" name="business" autocomplete="organization" required placeholder="e.g. Dave’s Plumbing"></div>
        <div class="field"><label for="bphone">WhatsApp or mobile</label><input id="bphone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="07…"></div>
        <div class="field"><label for="bemail">Email <span class="opt">(for the calendar invite)</span></label><input id="bemail" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.co.uk"></div>
        <div class="field wide"><label for="btown">Town or area</label><input id="btown" name="town" autocomplete="address-level2" placeholder="e.g. Wakefield"></div>
        <div class="hp" aria-hidden="true"><label>Leave this empty<input name="company" tabindex="-1" autocomplete="off"></label></div>
      </div>
      <p class="err" hidden>Name, business, a number and an email, please.</p>
      <div class="bnav"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn btn-live" type="button" data-next>Pick a time</button></div>
    </fieldset>

    <fieldset class="bstep" data-step="6" hidden>
      <legend><h2>Pick a time.</h2></legend>
      <div class="summary" id="summary"></div>
      <div id="calendly" class="calendly"></div>
      <div id="fallback" class="fallback" hidden>
        <p class="lead">The diary is not connected yet, so send this straight over and you will get a reply with times.</p>
        <div class="cta-row">${site.whatsapp ? `<a class="btn btn-live" id="fbWa" href="${L.waHref('Hi Tom — booking enquiry from your site.')}">Send on WhatsApp</a>` : ''}<a class="btn btn-ghost" id="fbMail" href="mailto:${site.email}">Send by email</a></div>
      </div>
      <p class="f-note" id="notfit" hidden>This studio builds for service businesses, so if that is not you, send the note anyway and you will get a straight answer about whether it is the wrong fit.</p>
      <div class="bnav"><button class="btn btn-ghost" type="button" data-back>Back</button></div>
    </fieldset>
  </form>
  <aside class="book-side">
    <div class="nameplate one">
      <div><dt>What the call is</dt><dd>Fifteen to twenty minutes on what is leaking, what to fix first and what it is worth in jobs. No pitch, no proposal deck.</dd></div>
      <div><dt>What it is not</dt><dd>A sales call with a junior. The person on the call is the person who builds it.</dd></div>
      <div><dt>Prefer not to talk</dt><dd><a class="lnk" href="${b}teardown.html">Get a free teardown by message instead</a>.</dd></div>
    </div>
  </aside>
</section>
</main>
${L.footer(b)}`;
    return L.page(L.head({ b, path: '/book/', title, description, og: 'book', nodes }), body, L.scripts(b, ['book.js']));
  }
}]};
