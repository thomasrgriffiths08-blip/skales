/* "Show me": each build's best moment as two to four steps, played inside the build by assets/show.js
   (from the viewer's Show me button, or on its own once if nobody touches the build for a few seconds),
   and replayed by the clip recorder for the moving cards. Selectors point at the build's own markup.
   Step kinds: tap, type (+ text), set (+ to, for a range or select), scroll (bring into view),
   scrollBy (+ dur), wait. `say` is the caption shown while the step plays; `pause` is the wait after it. */
module.exports = {
  'northgate-quote-engine': [
    { tap: '#btnExample', say: 'Load an example kitchen' },
    { tap: '#btnNext', say: 'Step through it: the price moves with every answer' },
    { tap: '#btnNext', say: 'Pick the units' },
    { tap: '#btnBreak', say: 'See the itemised breakdown' },
  ],
  'redgate-job-system': [
    { tap: '#slippingToggle', say: 'Show the jobs that are slipping' },
    { tap: 'div[data-id]', say: 'Open one: the whole history in one place' },
  ],
  'halcyon-dispatch': [
    { tap: '#viewDayBtn', say: 'Switch to today, engineer by engineer' },
    { tap: 'button.queue-card.emergency', say: 'Open the emergency waiting in the queue' },
  ],
  'ledgerline': [
    { type: '#f-client-name', text: 'Fairbrook Café', say: 'Type a client: the invoice changes as you type' },
    { tap: 'button[data-template=modern]', say: 'Swap the template' },
    { tap: 'button[data-accent="#0f7a4c"]', say: 'Change the colour' },
  ],
  'mortgage-lab': [
    { set: '#monthlyOverpayRange', to: 600, say: 'Overpay £600 a month' },
    { tap: '#tab-stresstest', say: 'Stress-test it against a rate rise' },
  ],
  'payslip-lab': [
    { tap: 'button[data-salary="112000"]', say: 'Try a £112,000 salary' },
    { tap: '#tabbtn-trap', say: 'See the 60% tax trap' },
  ],
  'kerbside-scorecard': [
    { set: '#f-revCount', to: 60, say: 'Add reviews: the score re-marks live' },
    { tap: '#tabbtn-action', say: 'Get the action plan' },
  ],
  'stopcock': [
    { set: '#in-missPct', to: 35, say: 'Miss more calls and watch the leak grow' },
    { tap: 'button[data-v=years]', say: 'See what it costs over three years' },
  ],
  'turnover': [
    { set: '#reveal', to: 88, say: 'Drag the line: the old site and the rebuild' },
    { set: '#reveal', to: 12, say: '' },
    { tap: '#segMob', say: 'Now see both on a phone' },
  ],
  'fenwick-booking': [
    { tap: 'input[name=svc][value=rad]', say: 'Pick what needs doing' },
    { tap: '#next', say: 'Choose a time' },
    { tap: '.day:not(.off)', say: 'Pick a day' },
    { tap: 'button.slot:not(:disabled):not(.off):not(.taken)', say: 'Pick a slot: the deposit holds it' },
  ],
  'jobsheet': [
    { tap: '#addItem', say: 'Add a line to the job' },
    { type: 'input[data-i="5"]', text: 'Bled the radiators upstairs', say: 'Type it once: the customer’s report fills itself in' },
  ],
  'shiftbook': [
    { tap: 'button[data-add="amara:0"]', say: 'Tap a gap to add a shift' },
    { tap: '#d-save', say: 'Save it: the hours and the wage bill update' },
  ],
  'ringsback': [
    { wait: 7000, say: 'Watch: the call rings out and the text goes' },
    { tap: 'button[data-tab=convo]', say: 'Read the conversation' },
  ],
  'starboard': [
    { tap: 'button[data-act=ask]', say: 'Ask a customer for a review' },
    { tap: '#askSend', say: 'Send it' },
    { wait: 15000, say: 'Watch: she opens it, then the review lands' },
  ],
  'slate': [
    { type: 'input[placeholder^="Add a line"]', text: 'plaster', say: 'Start typing: the price book finds it' },
    { tap: '.cbxopt[data-add]', say: 'Pick it: cost and markup come with it' },
    { tap: 'button[data-v=doc]', say: 'Preview the quote the customer gets' },
  ],
  'triage': [
    { tap: 'button[data-id=e42]', say: 'Open the urgent one' },
    { tap: 'button[data-tpl="0"]', say: 'Pick a reply' },
    { tap: '#sendReply', say: 'Send it' },
  ],
  'doorstep': [
    { tap: 'button[data-step="3"]', say: 'Mark the engineer on site' },
    { tap: 'button[data-step="4"]', say: 'Then done: the customer sees it straight away' },
  ],
  'clockcard': [
    { tap: '#swBtn', say: 'Switch to the next job' },
    { tap: 'button[data-pick=j3]', say: 'Pick it: the clock moves with you' },
    { tap: '#brkBtn', say: 'Take a break' },
    { tap: 'button[data-p=owner]', say: 'See it from the owner’s side' },
  ],
  'boiler-book': [
    { tap: '#selWaiting', say: 'Tick everyone who is waiting' },
    { tap: '#sendBtn', say: 'Send the whole batch' },
  ],
  'mot-minder': [
    { tap: 'button[data-filter=over]', say: 'Show the overdue ones' },
    { tap: 'tr button[data-open], [data-open]', say: 'Open one' },
    { tap: 'button[data-act=send]', say: 'Send the rebook link' },
    { wait: 6000, say: 'Watch the customer take a slot' },
  ],
  'chairside': [
    { tap: 'button[data-slot]', say: 'Tap an open gap' },
    { tap: 'button[data-v=checkout]', say: 'Check a client out on the counter tablet' },
    { tap: 'button.slot[data-sl="0"]', say: 'She rebooks before she leaves' },
  ],
  'turntable': [
    { tap: 'g[data-tbl="5"]', say: 'Tap a table' },
    { tap: 'button[data-act^="clear"]', say: 'Clear it when they leave' },
    { tap: 'button[data-wl^="ready"]', say: 'Text the next party: table ready' },
  ],
  'roofline': [
    { tap: 'button[data-k=roof][data-v=hip]', say: 'Change the roof to a hip' },
    { tap: 'button[data-k=house][data-v=detached]', say: 'Make it detached: the plan and price redraw' },
  ],
  'roundsheet': [
    { tap: 'button[data-act=done]', say: 'Mark the next door done' },
    { tap: 'button[data-act=cash]', say: 'Paid in cash' },
  ],
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
};
