/* The eight services, one page each at /services/<slug>/. The copy is the page: every H2 is a question an
   owner actually asks, and the first paragraph answers the page's question on its own, because that is the
   passage search engines and AI assistants lift. Rules: UK English, first person (one person builds it),
   no prices, no promised results, no invented numbers. Anything shown running is a demo with a
   fictional business, and says so.
   `legacy` is the old anchor on /what-i-do/, kept so old links land on the right page.
   Optional: `cta` [path, label] replaces the hero's second button; `show` lists the AI demos the page shows,
   each with a still in assets/work/<img>-{1440,800,phone}.webp. */
module.exports = [
  {
    slug: 'websites', legacy: 'capture-website', n: '01', name: 'Websites', serviceType: 'Web design for service businesses',
    title: 'Websites for trades and service businesses',
    description: 'Hand-built websites for UK trades and service businesses: one tap to call, booking built in, written for what customers search, and yours from day one.',
    card: 'A fast site built to turn a visit into a call, a booking or an enquiry you can ring back.',
    h1: 'Websites that turn a visit into a job.',
    answer: 'A Skales website is a fast, hand-built site for a UK service business, built so a visit becomes a call, a booking or an enquiry you can ring back. It is written around what your customers type into Google, and the domain, code and accounts are yours from day one.',
    film: { wide: 'website', h2: 'From invisible to booked, in one film.', p: 'A heating engineer nobody could find on Google, a site built in a week, and what came in after. A made-up business, so the numbers are illustrative; the system is the one I build.' },
    sections: [
      { h2: 'What does a website for a service business need?', p: [
        'Less than most have. A way to ring you in one tap, a short form for people who would rather type, the area you cover, proof that you are real, and a way to book if you take bookings. All of it has to work on a phone with one bar of signal, because that is where most of your customers find you.',
        'Everything else (sliders, stock photos of handshakes, a page about your mission) slows the page down and gets in the way of the call.' ] },
      { h2: 'Why hand-built rather than a page builder?', p: [
        'A page builder rents you a template and charges you every month to keep it. A hand-built site has no builder, no theme and nothing loading in the background that you did not ask for, so it is fast, and it is yours. Nothing is rented back to you.',
        'You can see the difference in the builds on this site: every one is hand-coded, and every one runs.' ] },
      { h2: 'Will it help me get found on Google?', p: [
        'It gives you the best chance. Each service you want to be found for gets its own page that answers what people actually search, with proper structured data, fast load times and your Google Business Profile linked and consistent. That is what Google and the AI assistants read.',
        'Nobody can promise the top spot, and anyone who does is guessing. Searches for your trade in your area are the ones worth winning first, because they come from people ready to book.' ] },
    ],
    gets: [
      'One tap to call and a three-field form, on every page.',
      'A page for each service you want to be found for.',
      'Online booking and deposits built in, if you take bookings.',
      'Structured data and metadata done properly, so search engines and AI assistants can read it.',
      'Your Google Business Profile linked, with the same name and details everywhere.',
      'Enquiries straight to your phone and your CRM, not an inbox you never check.',
      'Hand-coded: no page builder, no theme, fast on a weak signal.',
      'Domain, code and accounts set up in your name.',
    ],
    demos: [], builds: [11, 12, 10], automations: ['missed-call-text-back', 'review-requests'],
    faq: [
      ['How long does a website take?', 'A website on its own takes days. A full system with booking and follow-up usually takes one to two weeks, and you can watch it being built.'],
      ['How much does a website cost?', 'Every job is quoted flat after a short call, because the price depends on how many pages you need, whether you take bookings or deposits, and which automations you want. There are no prices on this site and no monthly fee for a page builder.'],
      ['Do I own the website?', 'Yes. The domain, the code and the accounts are set up in your name from day one. If you stopped working with me tomorrow, the site would keep working.'],
      ['I already have a website. Will I lose my Google ranking if it is rebuilt?', 'Not if it is done properly. Every old address is redirected to its new page, so the links Google already knows keep working, and the new pages are faster and better structured than the old ones.'],
    ],
  },
  {
    slug: 'booking-and-crm', legacy: 'booking-and-pipeline', n: '02', name: 'Booking and CRM', serviceType: 'Online booking system and CRM',
    title: 'Online booking and CRM for service businesses',
    description: 'Online booking with deposits, and a CRM that confirms, chases and reminds for you. For UK trades and service businesses. Try the live demos.',
    card: 'Customers book a free slot and pay a deposit at any hour. Every enquiry sits on one board.',
    h1: 'Booking and a CRM that run the admin for you.',
    answer: 'Online booking lets customers take a free slot in your diary and pay a deposit to hold it, at any hour, without ringing you. The CRM puts every enquiry, quote and job on one board, and sends the confirmations, chasers and reminders on its own.',
    film: { wide: 'missed-call', h2: 'A missed call, booked in two minutes.', p: 'A call rings out at 21:47. The system texts back, the customer books and pays a deposit, and the job lands on the board and in the diary. A made-up business, so the numbers are illustrative.' },
    sections: [
      { h2: 'How does online booking work?', p: [
        'The customer picks the job they need, then a day and a time from the slots you actually have free. Slots that are taken are already gone, so double bookings cannot happen. Where your trade takes a deposit, they pay it by card on the same page.',
        'They get a confirmation straight away and a reminder before the day. You get the job in your diary with their details, their notes and the deposit marked paid.' ] },
      { h2: 'What does the CRM actually do?', p: [
        'Every enquiry lands on one board, whether it came from your website, a missed call, Google or an ad: Enquiry, Quoted, Booked, Done. Moving a job along sends what should be sent at that stage: the reply, the quote, a chaser if it goes quiet, the confirmation, the reminder, the invoice and the review request.',
        'You stop running the business from your text messages, and nothing slips because you were busy.' ] },
      { h2: 'Why take a deposit?', p: [
        'A booking with money behind it is a booking people keep. The deposit holds the slot, comes off the final bill, and means the time you have set aside is paid for. You choose which jobs take one and how much.' ] },
    ],
    gets: [
      'A booking page on your own website, showing only the slots you really have.',
      'Deposits taken at booking, for the jobs you choose.',
      'Confirmation and reminder texts sent automatically.',
      'One board for every enquiry, quote and job, wherever it came from.',
      'Quotes chased when they go quiet, on a schedule you set.',
      'Invoices and review requests sent when a job is marked done.',
      'Where every enquiry came from, so you know which channel books work.',
      'No app for your customers to download. It all works in their phone browser.',
    ],
    demos: ['booking', 'crm-board'], builds: [15, 14], automations: ['booking-deposits', 'quote-chasing', 'service-reminders', 'on-my-way-texts'],
    faq: [
      ['Can customers book at night or at weekends?', 'Yes, that is the point. The booking page shows your free slots at any hour, so a customer who finds you at 10pm books then, instead of meaning to ring you in the morning.'],
      ['Can two people book the same slot?', 'No. A slot disappears the moment it is taken, on every device.'],
      ['Do my customers need to download an app?', 'No. Booking, paying the deposit and every text they get works in the browser on their phone.'],
      ['I quote rather than book. Is this still for me?', 'Yes. The CRM board works the same way for quotes: every enquiry gets a reply, every quote gets chased if it goes quiet, and accepted quotes become booked jobs.'],
      ['Can I see where my enquiries come from?', 'Yes. Every enquiry is tagged with where it came from (your website, Google, a missed call, an ad), so you can see which ones turn into booked work.'],
    ],
  },
  {
    slug: 'ai-receptionist', legacy: '', n: '03', name: 'AI receptionist', serviceType: 'AI receptionist and AI phone agent',
    title: 'AI receptionist and AI phone agent for UK trades',
    description: 'An AI receptionist for UK service businesses: it answers calls and messages at any hour, books from your diary and passes anything unusual to you.',
    card: 'Answers your phone and your messages at any hour, books from your diary and hands over when it should.',
    h1: 'An AI receptionist that answers every call.',
    answer: 'An AI receptionist answers your phone and replies to your messages when you cannot: on a job, with a customer or closed for the night. It is set up on your diary, your price list and your rules, so it can book the job, send the confirmation and pass anything unusual to you with the details.',
    film: null, cta: ['ai/', 'Hear it take a call'],
    show: [
      { href: 'ai/', bar: 'Call recordings · three example calls', img: 'ai-calls', alt: 'The call recordings player: a call log, the waveform of a recorded call, its transcript and the diary entry the assistant made', h: 'Hear it take three calls', p: 'A boiler breakdown at 23:10, an MOT booking and a physio appointment moved. Press play and watch the diary entry and the text go out while it talks.', go: 'Listen to the calls' },
      { href: 'demos/ai-receptionist/', bar: 'The AI receptionist · Larchfield Heating', img: 'ai-receptionist', alt: 'The AI receptionist demo: a late-night text conversation that ends with a boiler repair booked in the diary', h: 'The same job, by text', p: 'A customer messages a heating engineer late at night. Watch it reply, check the diary and book the job, then tap through it yourself.', go: 'Open the AI receptionist' },
    ],
    sections: [
      { h2: 'Will callers know it is an AI?', p: [
        'Yes. It says so in its first sentence, on every call and every message. It sounds natural and it is polite, but nobody is tricked into thinking they are talking to a person, and anyone who would rather speak to you is told when you will ring them back.' ] },
      { h2: 'What can it actually do on a call?', p: [
        'It offers only the times that are really free in your diary and books the job straight in. It quotes from your price list and says so when a job is not on it, rather than guessing. It asks the questions you always ask, texts a deposit link if you take deposits, and moves or cancels a booking when a customer asks.' ] },
      { h2: 'What happens when it should not handle something?', p: [
        'It passes it to you. Anything urgent, unusual or outside your rules goes to your phone straight away with the caller’s details and what they need, and every call leaves you a short written summary, so you never ring someone back without knowing why.' ] },
    ],
    gets: [
      'Calls answered on the first ring, at any hour.',
      'Messages from your website and texts answered the same way.',
      'Bookings made straight into your real diary.',
      'Prices quoted from your own price list, never guessed.',
      'Your rules followed on every call: the questions you ask, deposits, cancellations.',
      'A confirmation text sent to the caller while you are still on the job.',
      'Anything urgent passed to your phone with the details.',
      'A written summary of every call.',
    ],
    demos: [], builds: [], automations: ['missed-call-text-back', 'booking-deposits'],
    faq: [
      ['Does it replace the person who answers my phone?', 'No. It covers the calls nobody can take: when you are on a job, with a customer or closed for the night. Anything it should not handle goes to a person with the details.'],
      ['What if a caller asks something it cannot answer?', 'It says so, takes their details, tells them who will ring back, and sends you the note. It does not guess at prices or give advice it has not been given.'],
      ['Can it use the number I already have?', 'Usually, yes. Calls you do not pick up are passed to it, so customers keep ringing the number they already know. We go through how it fits your phone on the call.'],
      ['How much does an AI receptionist cost?', 'The build is quoted flat after a short call, like everything else. Running it costs a little per minute of calls, billed by the phone and voice providers, and you get a straight figure for your call volume before anything starts.'],
      ['Are the calls on the AI page real?', 'They are recorded examples for made-up businesses, and every voice in them is AI, the callers too. They show how a call goes and what the assistant does during it. Yours is set up on your own diary, price list and rules.'],
    ],
  },
  {
    slug: 'ai-employees', legacy: '', n: '04', name: 'AI employees', serviceType: 'AI agents for business admin',
    title: 'AI employees for small business admin',
    description: 'AI employees for UK service businesses: AI agents that each take one office job, such as invoices, the inbox or chasing payments, and ask you when it matters.',
    card: 'AI agents that each take one office job off you, such as invoices, the inbox or chasing what you are owed.',
    h1: 'AI employees for the jobs that eat your evenings.',
    answer: 'An AI employee is an AI agent given one office job, such as sending invoices, sorting the inbox or chasing money owed, with the access and rules to do it. It works through that job every day, asks you when something needs a decision, and shows you what it did, so the admin gets done without another hire.',
    film: null, cta: ['demos/ai-team/', 'Open the AI team'],
    show: [
      { href: 'demos/ai-team/', bar: 'The AI team · Kingpost', img: 'ai-team', alt: 'The AI team demo: ten AI employees for a made-up building firm, with the hours each one saves', h: 'Walk round an AI team', p: 'Ten AI employees running the office of a made-up Bristol building firm, from invoices to the vans. Open each one to see its job, what it did today and the hours it gives back.', go: 'Open the AI team' },
    ],
    sections: [
      { h2: 'What jobs can an AI employee do?', p: [
        'The repetitive office work that follows every job: sending and chasing invoices, sorting the inbox and drafting replies, turning a voice note from the van into a quote, keeping the CRM up to date and booking the follow-ups. Each one is given a single job, the access it needs and the rules for doing it, the way you would brief a new starter.' ] },
      { h2: 'Does it decide things on its own?', p: [
        'Only what you have said it can. Routine steps it does by itself and shows you afterwards. Anything that needs a judgement, such as a discount, a complaint or an unusual quote, it brings to you with the details and a suggested answer, and waits.' ] },
      { h2: 'Where should I start?', p: [
        'With the job you put off most. For a lot of owners that is chasing money or the evening inbox. One AI employee doing one job well is worth more than a dozen half set up, and the next one can be added once the first has earned its place.' ] },
    ],
    gets: [
      'One AI employee per job, each with its own brief and rules.',
      'Access only to the tools that job needs.',
      'The routine work done every day, with a log of what it did.',
      'Decisions brought to you with the details and a suggested answer.',
      'Works with the email, accounts and CRM you already use, where they allow it.',
      'Written in your words whenever it writes to a customer.',
      'Easy to pause, change or switch off.',
      'Set up in your name, like everything else.',
    ],
    demos: [], builds: [], automations: ['quote-chasing', 'review-requests'],
    faq: [
      ['Is an AI employee just a chatbot?', 'No. A chatbot answers questions. An AI employee does a job: it reads the email, updates the record, sends the invoice and tells you what it did. It works in your tools rather than waiting in a chat window.'],
      ['What if it makes a mistake?', 'Every AI employee keeps a log of what it did and why, and anything involving money or an unhappy customer can be set to wait for your yes. You check its work for the first few weeks, the same as you would with anyone new.'],
      ['Will it replace my staff?', 'That is not the idea. It takes the repetitive admin off you and your team, so people spend their time on customers and the work rather than the paperwork.'],
      ['How much does an AI employee cost?', 'Each one is quoted flat after a short call. The running cost is the AI and software it uses, which depends on how much work it does, and you get a straight figure before anything starts.'],
      ['Are the numbers in the AI team demo real?', 'No. The AI team is a made-up building firm with illustrative numbers, there to show how the jobs are split and what each one gives back. Yours is set up on your own work.'],
    ],
  },
  {
    slug: 'follow-up-automation', legacy: 'follow-up-automation', n: '05', name: 'Follow-up automation', serviceType: 'Customer follow-up automation',
    title: 'Follow-up automation for service businesses',
    description: 'Texts that send themselves: missed-call text-back, quote chasers, reminders, on-my-way texts and review requests. Set up once for your UK business.',
    card: 'Missed-call text-back, quote chasers, reminders and review requests. Set up once, runs itself.',
    h1: 'Follow-up that happens while you are on the tools.',
    answer: 'Follow-up automation sends the texts you mean to send but never get round to: a reply to every missed call, a chaser on every quiet quote, a reminder before every job and a review request after it. It is set up once, written in your words, and runs without you touching the phone.',
    film: null,
    sections: [
      { h2: 'Which texts does it send?', p: [
        'Six, each one at the moment it matters. A text back to anyone whose call you missed. A nudge when a quote goes quiet. A confirmation and a reminder for every booking. An on-my-way text when you set off. A review request when the job is done. And, next year, a reminder that they are due again.',
        'Each one has its own page below, with the message it sends and what it needs from you.' ] },
      { h2: 'Will customers know it is automated?', p: [
        'The messages are written with you, in your words, and only say what you would say yourself. They read like a quick reply from a business that is on top of things, because that is what they are. When a customer replies, the reply comes to you.' ] },
    ],
    gets: [
      'A text back to every missed call, seconds after it rings out.',
      'A follow-up on quotes that go quiet.',
      'Confirmations and reminders for every booking.',
      'On-my-way texts in one tap.',
      'A review request when the job is done.',
      'Reminders when a customer is due again next year.',
      'Every message written with you, and easy to change or pause.',
      'Replies land on your phone and in your CRM.',
    ],
    demos: ['missed-call', 'crm-board'], builds: [14, 17, 18, 15], automations: ['missed-call-text-back', 'quote-chasing', 'booking-deposits', 'on-my-way-texts', 'review-requests', 'service-reminders'], showAllAutomations: true,
    faq: [
      ['What does it cost to run?', 'The setup is quoted flat, like everything else. After that, the only running cost is the texts themselves, billed by the text provider.'],
      ['Can I change what the messages say?', 'Yes. Every message is written with you before it goes live, and any of them can be changed or paused with a message to me.'],
      ['Will it text my suppliers or family when I miss their calls?', 'Not if you do not want it to. Numbers you know can be left out, so only new callers get the text.'],
      ['Do I need the website and CRM as well?', 'No, but they work best together. Missed-call text-back runs on its own, and review requests only need a way to mark a job done, which can be an invoice being paid. Quote chasing and reminders need somewhere to keep the jobs, which is what the CRM is for.'],
    ],
  },
  {
    slug: 'business-automation', legacy: '', n: '06', name: 'Business automation', serviceType: 'Workflow automation for small businesses',
    title: 'Business automation for service businesses',
    description: 'Business automation for UK service businesses: enquiries into the CRM, jobs into the diary, invoices out and reviews asked for, with nothing copied by hand.',
    card: 'The admin between your tools, done for you: enquiries, jobs, invoices and reviews passed along without retyping.',
    h1: 'The admin between your tools, done for you.',
    answer: 'Business automation connects the tools you already use so the work moves on by itself: an enquiry becomes a card in the CRM, a booked job lands in the diary, a finished job sends its invoice, and a paid invoice asks for a review. It is set up once, in your name, and nobody copies anything from one screen to another again.',
    film: null,
    sections: [
      { h2: 'What can be automated?', p: [
        'Anything you do the same way every time between two tools. New enquiries from your website, Google and missed calls into one place. Booked jobs into the diary and onto the board. Invoices out when a job is done, chasers when they are not paid, receipts filed for the accounts. Each one is a step you would otherwise do by hand at the end of the day.' ] },
      { h2: 'How is this different from follow-up automation?', p: [
        'Follow-up automation is the texts your customers get. Business automation is the work behind them: moving the job from one tool to the next, so the right text goes at the right time and your records are already up to date. Most builds use both.' ] },
      { h2: 'What if my tools do not talk to each other?', p: [
        'Most of the tools trades use can be connected, from accounts software to calendars and forms. Where one cannot, there is usually a simple way round it, such as an email it already sends. We go through what you use on the call, and I tell you straight what can and cannot be joined up.' ] },
    ],
    gets: [
      'Every enquiry in one place, wherever it came from.',
      'Booked jobs in the diary and on the board without retyping.',
      'Invoices sent when a job is marked done.',
      'Unpaid invoices chased on a schedule you set.',
      'Review requests sent once an invoice is paid.',
      'Your records kept up to date as the work moves.',
      'Built on the tools you already use, where they allow it.',
      'Everything set up in your name, written down and easy to change.',
    ],
    demos: ['crm-board'], builds: [13, 16, 19], automations: ['review-requests', 'quote-chasing'],
    faq: [
      ['Do I need the Skales CRM for this?', 'No. Automations can run between the tools you already use. The CRM helps when your work is spread across texts, notes and an inbox, because it gives everything one place to live.'],
      ['Can I change an automation later?', 'Yes. Every automation is written down in plain English when it is set up, and any of them can be changed or paused with a message to me.'],
      ['What happens if a step fails?', 'Each automation is built to tell you when a step fails, such as a tool being down, rather than failing quietly, so a job never goes missing without anyone knowing.'],
      ['How much does business automation cost?', 'It is quoted flat after a short call, depending on how many tools and steps are involved. Some tools charge their own monthly fee, and you will know what those are before anything starts.'],
    ],
  },
  {
    slug: 'meta-ads', legacy: '', n: '07', name: 'Meta ads', serviceType: 'Facebook and Instagram advertising',
    title: 'Facebook and Instagram ads for tradespeople',
    description: 'Meta ads for UK trades and service businesses: every click lands on a page built to book, follow-up for anyone who does not, and the cost of each booked job.',
    card: 'Facebook and Instagram ads that land on a page built to book, with follow-up for anyone who does not.',
    h1: 'Facebook and Instagram ads that end in a booked job.',
    answer: 'I run Facebook and Instagram ads for UK service businesses, and send every click to a page built to book, with follow-up texts for anyone who does not book straight away. You see what each booked job cost you, not just clicks and likes.',
    film: { wide: 'ads-meta', h2: 'Watch one ad turn into a booked job.', p: 'Someone scrolling at 21:12 taps a heating engineer’s ad, books a slot and pays a deposit. The job lands on the board tagged with the ad, the texts go out on their own, and the week shows what each booked job cost. A made-up business, so the numbers are illustrative.' },
    adPreview: 'meta',
    sections: [
      { h2: 'How is this different from an ads agency?', p: [
        'Most ads stop at the click. The person taps, lands on a home page that was never built for them, and leaves. Here the ad, the page it lands on and the follow-up are one system: the page makes the same promise the ad made, booking is one step away, and if they leave without booking, the CRM follows up.',
        'It is the same system the rest of this site is about, with ads pointed at it.' ] },
      { h2: 'What do the ads look like?', p: [
        'Local and specific: your work, your area, and a reason to act now, such as a free slot this week. They run in the Facebook and Instagram feeds, Stories and Reels, wherever your customers spend their time. Your best jobs, filmed on your phone, usually make better ads than anything polished.' ] },
      { h2: 'How will I know if it is working?', p: [
        'Every enquiry from an ad lands in your CRM tagged with the ad it came from, and the tracking reports bookings back to Meta through both the pixel and the Conversions API, so they still count when a browser blocks tracking. You see what you spent, what it booked, and what each booked job cost.' ] },
    ],
    gets: [
      'Ads on Facebook and Instagram, written for your area and your work.',
      'A landing page built to book, making the same promise as the ad.',
      'Follow-up texts for people who enquire but do not book.',
      'The Meta pixel and Conversions API set up properly.',
      'Every enquiry tagged with the ad it came from.',
      'The cost of each booked job, not just clicks.',
      'An ad account in your name, so the spend and the data stay yours.',
    ],
    demos: ['booking', 'crm-board'], builds: [], automations: ['missed-call-text-back', 'quote-chasing'],
    faq: [
      ['How much should I spend on ads?', 'It depends on your area, your trade and how many jobs you can take on. We agree a test budget on the call, the spend goes to Meta from your own account, and you can change it at any time.'],
      ['Can you guarantee leads?', 'No, and nobody honest can. What you do get is a clear view of what the ads cost and what they booked, so you can decide whether to keep going.'],
      ['Do I need a website first?', 'The ads need a page built to book. If you do not have one, I build it as part of the job, and it carries on working for you whether the ads are running or not.'],
      ['Facebook or Instagram?', 'Both run from one Meta account. Where the budget goes depends on where your customers are, and the tracking shows which one books.'],
      ['Who owns the ad account?', 'You do. It is set up in your name like everything else, so if you stop working with me, the account, the audience data and the history stay with you.'],
    ],
  },
  {
    slug: 'google-ads', legacy: '', n: '08', name: 'Google ads', serviceType: 'Google search advertising',
    title: 'Google Ads for trades and local services',
    description: 'Google search ads and Local Services Ads for UK trades: show up when someone nearby searches for your work, land on a page built to book, track every job.',
    card: 'Search ads and Local Services Ads, so you show up when someone nearby searches for what you do.',
    h1: 'Show up on Google when someone nearby needs you.',
    answer: 'I run Google search ads, and Local Services Ads where your trade qualifies, so you appear when someone nearby searches for exactly what you do. Every click lands on a page built to book, and every enquiry is tracked back to the search that brought it.',
    film: { wide: 'ads-google', h2: 'Watch one search turn into a booked job.', p: 'Someone searches for a boiler service at 21:12, taps a heating engineer’s ad at the top, books a slot and pays a deposit. The job lands on the board tagged with the search, the texts go out on their own, and the week shows what each booked job cost. A made-up business, so the numbers are illustrative.' },
    adPreview: 'google',
    sections: [
      { h2: 'Search ads or Local Services Ads?', p: [
        'Search ads appear above the results for the searches you choose, and you pay when someone clicks. Local Services Ads sit at the very top with a Google-checked badge, and you pay per enquiry rather than per click, but they are only open to some trades. I check whether yours qualifies first.' ] },
      { h2: 'Which searches will my ads show for?', p: [
        'The ones that come from people ready to book: your trade, the job and your area, such as boiler repair near me or emergency electrician in your town. Searches for jobs you do not do, or places you do not cover, are excluded, so the budget goes on people you can actually help.' ] },
      { h2: 'How will I know what it costs per job?', p: [
        'Google Ads conversion tracking and Google Analytics record every enquiry and booking from an ad, including calls. The same enquiries land in your CRM tagged with the search they came from, so you can see what each booked job cost.' ] },
    ],
    gets: [
      'Google search ads for the jobs you want, in the area you cover.',
      'Local Services Ads, where your trade qualifies.',
      'Searches you do not want excluded, so the budget is not wasted.',
      'A landing page built to book, matching the search.',
      'Conversion tracking for calls, enquiries and bookings.',
      'Every enquiry tagged with the search it came from.',
      'An ad account in your name, so the spend and the data stay yours.',
    ],
    demos: ['booking', 'missed-call'], builds: [], automations: ['missed-call-text-back', 'booking-deposits'],
    faq: [
      ['How much should I spend on Google Ads?', 'It depends on how competitive your trade is in your area and how many jobs you want. We agree a test budget on the call, the spend goes to Google from your own account, and you can change it at any time.'],
      ['How quickly do Google Ads work?', 'Search ads can start showing as soon as Google approves them, so they are the fastest way to appear for searches you are not ranking for yet. Getting the cost per job down takes a few weeks of tuning.'],
      ['Should I do ads or SEO?', 'Usually both. Ads bring enquiries while the website earns its place in the normal results, which takes months. Once the site ranks for a search, you can spend less on ads for it.'],
      ['Can you guarantee the top spot?', 'No. Where an ad appears depends on the budget, the competition and Google. What you get is a clear view of what each booked job cost.'],
      ['Who owns the Google Ads account?', 'You do. It is set up in your name, so the account, the data and the history stay with you.'],
    ],
  },
];
