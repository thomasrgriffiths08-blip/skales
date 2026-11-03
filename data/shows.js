/* "Show me": each build's best moment as two to four steps, played inside the build by assets/show.js
   (from the viewer's Show me button, or on its own once if nobody touches the build for a few seconds),
   and replayed by the clip recorder for the moving cards. Selectors point at the build's own markup.
   Step kinds: tap, type (+ text), set (+ to, for a range or select), scroll (bring into view),
   scrollBy (+ dur), wait. `say` is the caption shown while the step plays; `pause` is the wait after it. */
module.exports = {
  'atelier-voss': [
    { wait: 2200, say: 'The name over a finished building' },
    { scroll: '#halvard .dw', say: 'The plan draws itself as you scroll' },
    { tap: '#halvard .keys button[data-n="3"]', say: 'Tap a number to find it in the photo' },
    { scroll: '#cloister .dw', say: 'A section that decides where the sun lands' },
    { tap: '#kinds .chip[data-k=conv]', say: 'Enquiries go in on a title block' },
  ],
  'cadence': [
    { tap: '#chipFilter', say: 'Show only the blocked jobs' },
    { tap: '#chipAll', say: 'Back to the whole board' },
    { scrollBy: 1600, dur: 3600, say: 'Scroll: the shift plays out' },
  ],
  'maree': [
    { wait: 2200, say: 'Ink drifting over the bottle' },
    { scroll: '#clock', say: 'Slide through a day on skin' },
    { tap: '#jumps button[data-h="7"]', say: 'At seven hours, iris and birch smoke lead' },
    { tap: '.size[data-s="100"]', say: 'Pick a size' },
    { tap: '#addBtn', say: 'The bag knows when it is filled and when it arrives' },
  ],
  'signal': [
    { scrollBy: 2200, dur: 3800, say: 'Scroll through the festival' },
    { tap: 'button[data-day="1"]', say: 'Filter the line-up by day' },
  ],
  'long-exposure': [
    { wait: 2600, say: 'The showreel is the first screen' },
    { tap: '#scrub', say: 'Scrub straight to a job' },
    { scroll: '#works', say: 'Each job plays as you pass' },
    { tap: '#shRows .add[data-k=brand]', say: 'Add a line from the call sheet' },
  ],
  'overhead': [
    { scroll: '#survey .viewer', say: 'The survey draws itself over the real photo' },
    { tap: '.tab[data-t=roof]', say: 'A roof, measured, with every defect numbered' },
    { tap: '.tab[data-t=site]', say: 'Cut and spoil on a building site, month by month' },
    { scroll: '#log .log', say: 'The last six flying days, dated from today' },
  ],
  'southpaw': [
    { wait: 2200, say: 'The round timer is already running' },
    { scroll: '#levelOpts', say: 'Tell them where you are starting from' },
    { tap: 'button[data-level=new]', say: 'Never boxed: this week\'s beginners\' sessions' },
  ],
  'marrow-and-pin': [
    { scroll: '#wall', say: 'Each sheet inks itself, stencil to black' },
    { tap: 'button[data-f=joss]', say: 'Filter the wall by artist' },
    { set: '#pair .frame input', to: 12, say: 'Lay the stencil back over the healed piece' },
    { tap: 'button[data-i="6"]', say: 'Open a sheet for sizes' },
  ],
  'hale-and-partners': [
    { scroll: '.next', say: 'The next deadline, counted from today' },
    { tap: 'button[data-v=ltd]', say: 'Say what you run' },
    { tap: 'button[data-v=dead]', say: 'And what is worrying you' },
    { tap: 'button[data-v=cloud]', say: 'The line to start with lights up' },
  ],
  'fern-physio': [
    { tap: 'button[data-r=shoulder]', say: 'Tap where it hurts' },
    { scroll: '.pbook', say: 'The next free slots sit right beside it' },
    { tap: '.pslot', say: 'One tap and it is booked in' },
  ],
  'kestrel-electrical': [
    { tap: 'button[data-c="2"]', say: 'Flip a breaker' },
    { tap: 'button[data-c="6"]', say: 'The emergency one' },
  ],
  'kerb-and-camber': [
    { type: '#reg', text: 'KX19 LBD', say: 'Put your reg in' },
    { tap: '#checkBtn', say: 'It tells you when the MOT is due' },
  ],
  /* the system: one app, so each part's walkthrough starts on that part */
  'system': [
    { tap: '#tdPlay', say: 'Replay the morning', pause: 300 },
    { wait: 7500, say: 'Every call caught and every job booked, as it happened' },
    { wait: 8500, say: 'New work keeps landing while you watch' },
    { tap: '#todaySim', say: 'Try a missed call yourself', pause: 400 },
    { wait: 6500, say: 'It texts them back in seconds' },
  ],
  'inbox': [
    { tap: '#simCall', say: 'Simulate a missed call', pause: 400 },
    { wait: 7000, say: 'A text goes back in seconds, from the business’s own number' },
    { wait: 4500, say: 'They reply' },
    { tap: '#inLink', say: 'One tap sends the booking link', pause: 400 },
    { wait: 5500, say: 'They book and pay the deposit' },
  ],
  'booking': [
    { tap: '#bkTry', say: 'Book online, as a customer would' },
    { tap: '.bk-po', say: 'Pick the job', pause: 600 },
    { tap: '#bkT-0', say: 'Pick a free time', pause: 600 },
    { tap: '#bkPay', say: 'Pay the deposit', pause: 1200 },
    { tap: '#bkDone', say: 'It is in the diary, marked new' },
  ],
  'quotes': [
    { tap: '#qNew', say: 'Start a quote from your own template' },
    { tap: '#qSend', say: 'Send it: the customer gets a link', pause: 400 },
    { wait: 4500, say: 'Opened, and the chasing is booked in' },
    { tap: '#qPhone', say: 'What the customer sees' },
    { tap: '#qAccept', say: 'They accept and pay the deposit. The chasing stops.' },
  ],
  'reviews': [
    { tap: '#rvSend', say: 'Every finished job gets a review text', pause: 400 },
    { wait: 6500, say: 'A new five-star review lands' },
    { tap: '#rvList [data-act=reply]', say: 'The reply is drafted with their name and the job' },
    { tap: '#rvPost', say: 'Post it' },
  ],
  'reminders': [
    { tap: '#rmSend', say: 'Reminders go out before the work is due', pause: 400 },
    { wait: 5500, say: 'Customers book themselves in from the text' },
    { tap: '#rmList .rm-row', say: 'Each one: the text, its history and the free times' },
  ],
  'results': [
    { tap: '#rsMonth [data-i="4"]', say: 'Pick a month' },
    { scroll: '#rsChain', say: 'From enquiry to booked work' },
    { tap: '#rsReport', say: 'The monthly report, in plain English' },
  ],
};
