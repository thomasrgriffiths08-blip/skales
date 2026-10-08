/* /privacy/ and /cookies/. Both are written from data/site.js, so they describe what the build actually
   does: no tag IDs means the pages say there are no ad or analytics cookies, and the booking tool, the
   lead forwarder and the host are named only once they are set. Change the config, rebuild, and the
   pages follow. Policy choices (how long enquiries are kept) are Tom's; edit them here. */
const L = require('../lib.js');
const { site, esc } = L;
const { parts: P } = require('./services.js');

const UPDATED = '8 October 2026';
const T = L.TRACK;
const hostCo = /github\.io/.test(site.origin) ? 'GitHub' : 'Cloudflare';   // the plan moves the site to Cloudflare Pages with skales.studio
const host = `${hostCo} Pages, run by ${hostCo}`;
const booking = !site.calendly ? '' : /cal\.com/.test(site.calendly) ? 'Cal.com' : 'Calendly';
const tags = [T.pixel && 'the Meta Pixel', T.ga && 'Google Analytics', T.ads && 'Google Ads'].filter(Boolean);
const firms = [T.pixel && 'Meta', (T.ga || T.ads) && 'Google'].filter(Boolean);
const and = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const contact = `<a class="lnk" href="mailto:${esc(site.email)}">${esc(site.email)}</a>${site.whatsapp ? ', or message on WhatsApp' : ''}`;

const shell = ({ b, path, key, label, h1, answer, description, body }) => {
  const title = `${label} | ${site.name}`;
  const cr = [['Home', ''], [label, path.slice(1)]];
  const nodes = [L.webPage({ path, title, description }), P.crumbNodes(cr)];
  return L.page(L.head({ b, path, title, description, og: key, css: ['pages.css'], nodes }), `
${L.header(b, '')}
<main id="main" class="wrap">
  <article class="note lg">
    ${P.crumbs(b, cr)}
    <h1>${esc(h1)}</h1>
    <p class="lead answer">${answer}</p>
    <div class="prose">${body}
      <p class="lg-up">Last updated ${UPDATED}.</p>
    </div>
  </article>
</main>
${L.footer(b)}`, L.scripts(b));
};

const table = (head, rows) => `<div class="lg-t"><table><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td data-label="${head[i]}">${c}</td>` : `<th scope="row">${c}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;

const privacy = {
  url: '/privacy/', og: 'privacy', priority: 0.3, changefreq: 'yearly',
  meta: { key: 'privacy', title: 'Privacy notice', kicker: 'Skales Studio', sub: 'What is collected, why, who sees it and how long it is kept.' },
  render(b){
    const sendCase = site.leadEndpoint
      ? 'If you choose to send your case file, your mobile number and answers come to me by text, through the small service that forwards them, so I can reply.'
      : 'If you choose to send your case file, it goes from your own phone, by WhatsApp, email or the share sheet, and I receive what you send.';
    const bookLine = booking
      ? `They go to ${booking}, which runs the booking calendar, and I use them to prepare for the call.`
      : 'They are put into a message you send from your own WhatsApp or email, and I use them to prepare for the call.';
    const adsLine = tags.length
      ? `Only if you accept on the cookie banner. ${and(tags).replace(/^t/, 'T')} then record the pages you visit and actions like booking a call, so I can see which ads work and show them to people likely to need them. The <a class="lnk" href="${b}cookies/">cookies page</a> lists exactly what is set.`
      : 'None at the moment: the site runs no analytics or advertising tags. If that changes, a cookie banner will ask you first and this page will say so.';
    const sharers = [`the site’s host (${hostCo})`, booking && `${booking} for bookings`, site.leadEndpoint && 'the service that forwards case files by text', ...firms.map(f => `${f}, if you accept their cookies`)].filter(Boolean);
    const abroad = [hostCo, 'Google', booking, T.pixel && 'Meta'].filter(Boolean);
    const body = `
      <h2>Who is responsible for your information?</h2>
      <p>Tom Griffiths, trading as Skales Studio, in the United Kingdom. For anything on this page, email ${contact}.</p>

      <h2>What is collected, and why?</h2>
      <p><b>The 60-second check on /start.</b> Your answers stay in your browser. ${sendCase}</p>
      <p><b>Booking a call.</b> The booking page asks for your name, business, town, phone, email and what you would like help with. ${bookLine}</p>
      <p><b>The free teardown.</b> Your name, number and a line about your business, sent from your own WhatsApp or email.</p>
      <p><b>Messages.</b> Whatever you send me by email, WhatsApp or Instagram, so I can reply.</p>
      <p><b>The live demos.</b> Anything you type into the demos on /try/ stays in your browser and is not sent anywhere.</p>
      <p><b>Visiting the site.</b> The site is hosted on ${host}, which keeps standard server logs (IP address, browser and the pages requested) to keep it running and secure. The fonts load from Google Fonts, so Google receives your IP address when a page loads.</p>
      <p><b>Ads and analytics.</b> ${adsLine}</p>
      <p><b>Clients.</b> If we work together: your contact and business details, the accounts and content the build needs, and invoices.</p>

      <h2>On what basis?</h2>
      <p>Replying to an enquiry you started and preparing a quote: steps you asked for before a contract, and my legitimate interest in answering. Doing the work: the contract. Keeping invoices and records: the law. Server logs: my legitimate interest in keeping the site working and secure.${tags.length ? ' Advertising and analytics cookies: your consent, which you can take back at any time from Cookie settings.' : ''}</p>

      <h2>Who else sees it?</h2>
      <p>Nobody buys it, and it is never sold or swapped. The services that handle it for me are ${and(sharers)}, plus email and WhatsApp when you choose to use them, and anyone the law requires me to share it with.</p>

      <h2>Does it leave the UK?</h2>
      <p>Some of those services are run by companies based in the United States, including ${and(abroad)}. Where information goes outside the UK, it is covered by the safeguards UK data protection law requires, such as the UK–US data bridge or the contract clauses those companies use.</p>

      <h2>How long is it kept?</h2>
      <p>Enquiries that do not turn into work are deleted within 12 months of the last message. For clients, information is kept while we work together, and invoices and business records for as long as tax law requires.${tags.length ? ` ${and(firms)} keep ads and analytics data under their own retention settings, and your cookie choice stays in your browser until you clear it.` : ''}</p>

      <h2>What can you ask for?</h2>
      <p>You can ask to see what is held about you, have it corrected or deleted, restrict or object to how it is used, get a copy to take elsewhere${tags.length ? ', and take back your consent at any time' : ''}. Email ${contact}, and you will get an answer within one month.</p>
      <p>If you are unhappy with how your information has been handled, you can complain to the Information Commissioner’s Office at <a class="lnk" href="https://ico.org.uk/make-a-complaint/" rel="noopener" target="_blank">ico.org.uk</a> or on 0303 123 1113.</p>`;
    return shell({ b, path: '/privacy/', key: 'privacy', label: 'Privacy notice', h1: 'Privacy notice',
      answer: `Skales Studio is Tom Griffiths, one person in the United Kingdom. This page says what personal information the site and the studio collect, why, who else sees it, how long it is kept, and how to have it changed or deleted.`,
      description: 'What personal information Skales Studio collects through the site and enquiries, why, who sees it, how long it is kept, and your rights under UK law.', body });
  },
};

const cookies = {
  url: '/cookies/', og: 'cookies', priority: 0.3, changefreq: 'yearly',
  meta: { key: 'cookies', title: 'Cookies', kicker: 'Skales Studio', sub: tags.length ? 'Ad and analytics cookies only if you accept them.' : 'No ad or analytics cookies.' },
  render(b){
    const own = [
      ['Your answers on /start and your place in the demos', 'Session storage', 'Until you close the tab', 'So the check and the demos keep your answers as you move between screens.'],
      ['Where you arrived from, such as the Instagram link', 'Session storage', 'Until you close the tab', 'So it can go with your case file, if you choose to send one.'],
      ...(tags.length ? [['Your cookie choice', 'Local storage', 'Until you clear it', 'So the banner does not ask you again on every page.']] : []),
    ];
    const opt = [
      ...(T.pixel ? [['<code>_fbp</code>', 'Meta', '3 months', 'Recognises your browser so Meta can tell which ads led to a visit or a booking.']] : []),
      ...(T.ga ? [['<code>_ga</code>', 'Google Analytics', '2 years', 'Counts visitors and how they move through the site.'], ['<code>_ga_…</code>', 'Google Analytics', '2 years', 'Keeps track of the current visit.']] : []),
      ...(T.ads ? [['<code>_gcl_au</code>', 'Google Ads', '3 months', 'Tells Google Ads which ads led to a booking.']] : []),
    ];
    const body = `
      <h2>What does the site store without asking?</h2>
      <p>Only what makes the pages you are using work. It stays in your browser and is not sent anywhere unless you choose to send it.</p>
      ${table(['What', 'Where', 'How long', 'Why'], own)}
      ${tags.length ? `
      <h2>What is set only if you accept?</h2>
      <p>Nothing on this list loads until you tap Accept. Reject, and none of it is set.</p>
      ${table(['Cookie', 'Set by', 'How long', 'Why'], opt)}
      <p>${and(firms)} may also use cookies on their own websites, under their own policies.</p>` : `
      <h2>Are there ad or analytics cookies?</h2>
      <p>No. The site runs no analytics or advertising tags at the moment. If that changes, a banner will ask you first, nothing will load unless you accept, and this page will list every cookie.</p>`}
      ${booking ? `
      <h2>What about the booking calendar?</h2>
      <p>The booking page loads ${booking}’s calendar so you can pick a time. ${booking} sets its own cookies to make the booking work, under its own privacy policy.</p>` : ''}
      <h2>How do you change your choice?</h2>
      <p>${tags.length ? '<button type="button" class="btn btn-ghost btn-sm" data-consent-open>Cookie settings</button></p><p>Or clear this site’s data in your browser settings.' : 'There is nothing to change at the moment. You can clear this site’s data in your browser settings at any time.'} The <a class="lnk" href="${b}privacy/">privacy notice</a> covers everything else.</p>`;
    return shell({ b, path: '/cookies/', key: 'cookies', label: 'Cookies', h1: 'Cookies',
      answer: tags.length
        ? 'This site sets advertising and analytics cookies only if you accept them on the banner. Everything else it stores is there because you are using it, like your place in a demo, and stays in your browser.'
        : 'This site sets no advertising or analytics cookies. The little it stores is there because you are using it, like your place in a demo, and it stays in your browser.',
      description: tags.length
        ? 'The cookies Skales Studio uses, who sets them, how long they last, and how to accept, reject or change your choice at any time.'
        : 'Skales Studio sets no advertising or analytics cookies. What the site stores in your browser, why, for how long, and how to clear it.', body });
  },
};

module.exports = { pages: [privacy, cookies] };
