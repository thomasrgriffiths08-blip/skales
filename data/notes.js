// Notes: the part of the site Tom keeps adding to. Add an entry, run `node tools/build.js`, push.
// Every claim must be true and already on the site. No invented numbers.
module.exports = [
  { slug: 'what-a-missed-call-costs', date: '2026-09-03',
    title: 'What a missed call actually costs a service business',
    summary: 'The sum behind the missed-call text-back, with every assumption on the table — and why the number survives a sceptic.',
    body: `
<p>A missed call costs a service business more than the job on the other end of it, because the customer who rang is usually ringing the next firm on the list within the hour. The calculator on the missed-call text-back page meters that leak from three numbers you already know: how many calls a week ring out, what an average job is worth, and how many of those callers would have booked.</p>
<h2>Why the model asks how many would have booked</h2>
<p>Most missed-call calculators quietly assume every missed caller would have booked. They would not. Some ring back, some were price-checking, some booked elsewhere before you saw the voicemail. The calculator makes that share an explicit choice, one in four, one in three or one in two, and prints the working under the figure, so the headline is a number a sceptical owner can check, not a marketing number.</p>
<h2>What a text-back in under a minute changes</h2>
<p>A missed-call text-back sends the customer a message seconds after the ring-out, asks one question, and turns a voicemail into a conversation. The customer who was about to dial the next number replies instead. The follow-up automation on this site does exactly that, and the missed-call demo on the Try page shows the sequence end to end.</p>
<p>Open the calculator, put your own numbers in, and argue with it. That is what it is for.</p>`,
    links: [['automations/missed-call-text-back/#calc', 'Open the calculator']] },
  { slug: 'why-i-dont-rent-you-your-own-website', date: '2026-09-03',
    title: 'Why I don’t rent you your own website',
    summary: 'Some builders charge every month, forever, to keep your own site alive. Here is what "you own it" actually means in practice.',
    body: `
<p>${'A website built by ' + 'this studio'} belongs to the business it was built for: the domain, the code and every account sit in the client’s name from the first day. If the client walks away tomorrow, the site keeps working, because nothing about it depends on a monthly payment to the person who built it.</p>
<h2>What "rent" looks like</h2>
<p>A monthly platform fee to keep your own site online. A page-builder account the site cannot leave. A domain registered in the agency’s name. Each one is a lever, and the lever only ever gets pulled one way.</p>
<h2>What ownership looks like</h2>
<p>Hand-written code with no page-builder and no theme, hosted in an account the client controls, with the domain registered to the client. Every build on the Work page of this site was made that way, and every client build is made the same way.</p>
<h2>Why do it this way</h2>
<p>Because the work should be good enough that people stay by choice. Rent is what you charge when you are not sure it is.</p>`,
    links: [['work', 'See the builds']] },
  { slug: 'builds-for-businesses-that-dont-exist', date: '2026-09-03',
    title: 'Built for businesses that don’t exist, on purpose',
    summary: 'Why every demo on this site is for an invented company, and why that is better proof than a client logo wall.',
    body: `
<p>Every website and every part of the system on this site was made for a business that does not exist: Atelier Voss, Kestrel Electrical, Fern Physio, Larchfield Heating and the rest are invented, and so is every person, review and phone number inside them. That is deliberate. It means nothing on this site exposes a real client’s numbers, customers or setup.</p>
<h2>Why fictional beats a logo wall</h2>
<p>A logo wall proves someone paid. A working build proves what was built. Each demo here runs live in the page: you can simulate a missed call and watch the text go back, book a slot and pay the deposit, or watch a quote chase itself. A screenshot of a client site cannot do that, and a client site should not be handed to strangers to click through.</p>
<h2>What a real build shares with these</h2>
<p>The approach is identical: hand-coded, no page-builder, no stock imagery, built to do one job for one kind of business, and owned outright by the client. The only difference is whose name is on it.</p>`,
    links: [['work', 'See the work']] },
];
