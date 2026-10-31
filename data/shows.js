/* "Show me": each build's best moment as two to four steps, played inside the build by assets/show.js
   (from the viewer's Show me button, or on its own once if nobody touches the build for a few seconds),
   and replayed by the clip recorder for the moving cards. Selectors point at the build's own markup.
   Step kinds: tap, type (+ text), set (+ to, for a range or select), scroll (bring into view),
   scrollBy (+ dur), wait. `say` is the caption shown while the step plays; `pause` is the wait after it. */
module.exports = {
  'atelier-voss': [
    { scrollBy: 2600, dur: 5200, say: 'Scroll: the drawings draw themselves' },
  ],
  'cadence': [
    { tap: '#chipFilter', say: 'Show only the blocked jobs' },
    { tap: '#chipAll', say: 'Back to the whole board' },
    { scrollBy: 1600, dur: 3600, say: 'Scroll: the shift plays out' },
  ],
  'maree': [
    { scrollBy: 3200, dur: 6000, say: 'Scroll: the page changes tone' },
  ],
  'signal': [
    { scrollBy: 2200, dur: 3800, say: 'Scroll through the festival' },
    { tap: 'button[data-day="1"]', say: 'Filter the line-up by day' },
  ],
  'long-exposure': [
    { tap: '#playBtn', say: 'Play the cut' },
    { wait: 5000, say: 'Each reel is a real project' },
  ],
  'overhead': [
    { scrollBy: 1300, dur: 5000, say: 'Scroll to climb: the map draws itself' },
  ],
  'southpaw': [
    { wait: 2500, say: 'The round timer is live' },
    { tap: 'button[data-level=new]', say: 'Book your first session' },
  ],
  'marrow-and-pin': [
    { tap: 'button[data-f=joss]', say: 'Filter the flash by artist' },
    { tap: 'button[data-i="6"]', say: 'Open a design' },
  ],
  'hale-and-partners': [
    { tap: 'button[data-v=ltd]', say: 'Say what you run' },
    { tap: 'button[data-v=dead]', say: 'And what is worrying you' },
    { tap: 'button[data-v=cloud]', say: 'They tell you where they would start' },
  ],
  'fern-physio': [
    { tap: 'button[data-r=knee]', say: 'Tap where it hurts' },
  ],
  'kestrel-electrical': [
    { tap: 'button[data-k=ev]', say: 'Flip a breaker' },
    { tap: 'button[data-k=emergency]', say: 'The emergency one' },
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
