// Notes: the part of the site Tom keeps adding to. Add an entry, run `node tools/build.js`, push.
// Every claim must be true and already on the site. No invented numbers.
module.exports = [
  { slug: 'what-a-missed-call-costs', date: '2026-09-03',
    title: 'What a missed call actually costs a service business',
    summary: 'The sum behind the missed-call text-back, with every assumption on the table — and why the number survives a sceptic.',
    body: `
<p>A missed call costs a service business more than the job on the other end of it, because the customer who rang is usually ringing the next firm on the list within the hour. The Stopcock calculator on this site meters that leak from five numbers you already know: calls per week, the share you miss, the value of an average job, how many quotes turn into work, and the share of missed callers who are gone for good.</p>
<h2>Why the model has a "gone for good" factor</h2>
<p>Most missed-call calculators quietly assume every missed caller would have booked. They would not. Some ring back, some were price-checking, some booked elsewhere before you saw the voicemail. Stopcock makes that share an explicit slider, so the headline figure is a floor a sceptical owner can defend, not a marketing number.</p>
<h2>What a text-back in under a minute changes</h2>
<p>A missed-call text-back sends the customer a message seconds after the ring-out, asks one question, and turns a voicemail into a conversation. The customer who was about to dial the next number replies instead. The follow-up automation on this site does exactly that, and the Redgate demo on the Why page shows the sequence end to end.</p>
<p>Open the calculator, put your own numbers in, and argue with it. That is what it is for.</p>`,
    links: [['stopcock', 'Open the Stopcock calculator']] },
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
  { slug: 'sixteen-builds-all-fictional', date: '2026-09-03',
    title: 'Sixteen builds for businesses that don’t exist, on purpose',
    summary: 'Why every demo on this site is for an invented company, and why that is better proof than a client logo wall.',
    body: `
<p>Every one of the sixteen builds on this site was made for a business that does not exist: Redgate Heating, Northgate Kitchens, Atelier Voss, Fenwick Heating and the rest are invented, and so is every person, review and phone number inside them. That is deliberate. It means nothing on this site exposes a real client’s numbers, customers or setup.</p>
<h2>Why fictional beats a logo wall</h2>
<p>A logo wall proves someone paid. A working build proves what was built. Each demo here runs live in the page: you can drag a job across the dispatch board, take a slot in the booking flow, or watch the quote engine price a kitchen. A screenshot of a client site cannot do that, and a client site should not be handed to strangers to click through.</p>
<h2>What a real build shares with these</h2>
<p>The approach is identical: hand-coded, no page-builder, no stock imagery, built to do one job for one kind of business, and owned outright by the client. The only difference is whose name is on it.</p>`,
    links: [['work', 'Open the rack']] },
];
