// Single source of truth for the brand. Change here, run `node tools/build.js`, push.
module.exports = {
  // BRAND — Skales (decided 2026-09-03). Instagram stays @tomxsystems.
  name: 'Skales',
  wordmark: { a: 's', x: 'k', b: 'ales' },   // the twisted letter is the accent
  legalName: 'Skales',
  tagline: 'Websites & systems for service businesses',
  // ORIGIN — the live address. Everything (canonicals, sitemap, schema, OG, the demo lock) derives from it.
  // Do NOT point this at a domain that is not registered and pointing here: every link becomes a parking page.
  origin: 'https://thomasrgriffiths08-blip.github.io/tomxsystems-site',   // skales.com is not bought yet — switch this line the day it is, then rebuild
  // extra hosts the locked demos may run under (dev + any future domain)
  allowedHosts: ['localhost', '127.0.0.1', 'thomasrgriffiths08-blip.github.io', 'skales.com', 'www.skales.com'],
  locale: 'en-GB',
  country: 'GB',
  areaServed: 'United Kingdom',
  founder: { name: 'Tom Griffiths', alternateName: 'Thomas Griffiths', jobTitle: 'Founder & builder' },
  email: 'thomasrgriffiths08@gmail.com',
  whatsapp: '',                       // international digits only, e.g. '447700900123'. Empty = WhatsApp controls hide.
  calendly: '',                       // e.g. 'https://calendly.com/<handle>/<event>'. Empty = booking hands off by email/WhatsApp.
  instagram: 'https://www.instagram.com/tomxsystems/',
  instagramHandle: '@tomxsystems',
  founded: '2026',
  // honest, verifiable claims only — these feed schema, llms.txt and page copy
  facts: [
    'Builds websites, online booking and follow-up automation for UK service businesses (trades and local operators).',
    'One person: the person you message is the person who builds it.',
    '{{N}} working demonstration builds run live on the site; every business in them is fictional.',
    'One system a week is built in public on Instagram.',
    'Clients own their domain, code and accounts from day one; nothing is rented back to them monthly.',
    'Every build is hand-coded with no page-builder, no theme and no third-party runtime dependencies.',
  ],
  services: [
    { slug: 'capture-website',  name: 'Websites that capture the enquiry',
      short: 'A fast site built to turn a visit into a name and a number.',
      long: 'A hand-built website for a service business: three fields, one-tap call, loads before they blink, and every page written to answer the question the customer typed into Google. Built so a visit becomes a name and a number you can ring back.',
      proof: 13 },
    { slug: 'booking-and-pipeline', name: 'Booking, quotes and the pipeline',
      short: 'Slots customers take themselves, quotes chased on their own, every enquiry in one place.',
      long: 'Online booking with slots generated from a real calendar, deposits that hold them, quotes that chase themselves, and a pipeline where every enquiry sits with what happened to it. Nothing lives in your texts any more.',
      proof: 14 },
    { slug: 'follow-up-automation', name: 'Follow-up that runs itself',
      short: 'Missed-call text-back, review requests, service reminders — set once, runs without you.',
      long: 'A missed call gets a text back in under a minute. A finished job gets a review request the same day. Next year the customer gets a "you are due a service" reminder. Set up once, runs without you touching the phone.',
      proof: 12 },
  ],
};
