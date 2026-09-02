/* ============================================================
   The sixteen channels.
   Every business, person, phone number and testimonial below is
   invented. No real client, address or account detail appears.
   Colours mirror each build's own accent so the rack reads true.
   ============================================================ */
window.BUILD_BASE = 'https://thomasrgriffiths08-blip.github.io/showcase/';

window.BUILDS = [
  { n:1, f:'01-quote-engine.html', kind:'tool', group:'Sales tools',
    name:'Northgate Quote Engine', biz:'Kitchen fitter',
    short:'A quote that assembles itself while the customer answers.',
    long:'Nine questions. As they answer, an isometric kitchen draws itself — cabinets appear, the worktop changes material, the island slides in — and a sticky panel builds the price live. Ends in an itemised quote that prints to A4.',
    proves:'Turns a “can you price this up?” text into a priced job at midnight.',
    tags:['Generative SVG','Live pricing','Prints to A4'],
    c:'#245247', pg:'#F1F2F0', pi:'#1D1712', pl:'#DFE2E0', pc:'#FFFFFF', po:'quote' },

  { n:2, f:'02-pipeline-crm.html', kind:'tool', group:'Sales tools',
    name:'Redgate Job & Lead System', biz:'Heating & plumbing',
    short:'Every enquiry, where it came from, and what happened to it.',
    long:'A pipeline at real product density: drag-and-drop kanban, sortable table, a deal drawer with the full activity timeline, and a Cmd-K palette that searches deals, contacts and commands.',
    proves:'Nothing lives in your texts any more.',
    tags:['Kanban + table','Cmd-K palette','CSV export'],
    c:'#3730a3', pg:'#fafaf9', pi:'#18181b', pl:'#E4E4E7', pc:'#FFFFFF', po:'kanban' },

  { n:3, f:'03-dispatch-board.html', kind:'tool', group:'Operations',
    name:'Halcyon Dispatch', biz:'Heating dispatch team',
    short:'Drag a job to another engineer and the week re-plans itself.',
    long:'Week and day scheduling for a field team. Drag to reschedule, clashes and capacity overruns flag instantly, SLA countdowns run against the real clock — so the board reads correctly whatever day you open it.',
    proves:'Six engineers, one screen, no phone calls to find out who is where.',
    tags:['Drag to reschedule','Clash detection','SLA countdown'],
    c:'#2f5cdb', pg:'#fafaf9', pi:'#18181b', pl:'#E4E4E7', pc:'#FFFFFF', po:'board' },

  { n:4, f:'04-invoice-studio.html', kind:'tool', group:'Operations',
    name:'Ledgerline', biz:'Invoice & proposal studio',
    short:'A live A4 page that reflows as you type.',
    long:'Invoices and proposals with a real page preview, three templates that genuinely change the layout, money maths done in integer pence, and a print stylesheet that gives you a proper PDF.',
    proves:'The paperwork stops being a Sunday job.',
    tags:['Live A4 preview','Aged debt','Print to PDF'],
    c:'#1f4fd8', pg:'#fafaf9', pi:'#18181b', pl:'#E4E4E7', pc:'#FFFFFF', po:'sheet' },

  { n:5, f:'05-mortgage-lab.html', kind:'tool', group:'Calculators',
    name:'Mortgage Lab', biz:'Broker lead magnet',
    short:'What an overpayment really saves, month by month.',
    long:'A full amortisation engine behind a scrubber chart. Shows the years and interest an overpayment saves, stress-tests the next remortgage at +1/2/3 points, and compares three saved scenarios side by side.',
    proves:'The kind of tool people bookmark, then ring you about.',
    tags:['Amortisation engine','Stress test','Scenarios'],
    c:'#0b6e4f', pg:'#fafaf9', pi:'#18181b', pl:'#E4E4E7', pc:'#FFFFFF', po:'curve' },

  { n:6, f:'06-take-home-pay.html', kind:'tool', group:'Calculators',
    name:'Payslip Lab', biz:'Accountant lead magnet',
    short:'Gross to net, and the 60% trap nobody explains.',
    long:'A UK take-home planner: waterfall from gross to net, a marginal-rate curve that exposes the taper between £100k and £125,140, and employee vs sole trader vs limited company side by side.',
    proves:'One page that answers the question every new client opens with.',
    tags:['Waterfall chart','60% trap curve','Reverse solver'],
    c:'#2952cc', pg:'#fafaf9', pi:'#18181b', pl:'#E4E4E7', pc:'#FFFFFF', po:'fall' },

  { n:11, f:'11-gbp-scorecard.html', kind:'tool', group:'Winning work',
    name:'Kerbside Scorecard', biz:'Google profile report card',
    short:'Marks a Google Business Profile like an exam.',
    long:'Type a business’s numbers — reviews, photos, categories, map rank — and it grades the profile: per-row deductions, the fix for each one, and what the gap is costing per month. Prints as a client-ready report.',
    proves:'A prospect sees their own grade before you ever pitch.',
    tags:['Live re-marking','Competitor table','Prints to A4'],
    c:'#B42318', pg:'#FBFAF8', pi:'#17151F', pl:'#E7E4DF', pc:'#FFFFFF', po:'grade' },

  { n:12, f:'12-leak-calculator.html', kind:'tool', group:'Winning work',
    name:'Stopcock', biz:'Missed-call leak meter',
    short:'What unanswered calls cost you a year.',
    long:'Five sliders — calls, missed share, job value, close rate — and it meters the annual leak, where it goes, and what a 60-second text-back recovers. Every assumption is on show, including a gone-for-good factor, so the number survives a sceptic.',
    proves:'The maths behind the whole offer, in the prospect’s own numbers.',
    tags:['Animated meter','Call funnel','Honest model'],
    c:'#14606E', pg:'#FAFBFB', pi:'#16181A', pl:'#E5E8E8', pc:'#FFFFFF', po:'meter' },

  { n:13, f:'13-before-after.html', kind:'tool', group:'Winning work',
    name:'Turnover', biz:'Roofing firm rebuild',
    short:'Drag the tape line across a 2011 site and its rebuild.',
    long:'The same roofing firm on both sides of a draggable tape line — the old site on one side, the rebuild on the other — then a table of what actually changed. Both sites are drawn in code, not screenshots.',
    proves:'“Before and after” you can put your hands on.',
    tags:['Drag reveal','Phone frame','Change table'],
    c:'#C77D2B', pg:'#FAFAF9', pi:'#191817', pl:'#E6E4E1', pc:'#FFFFFF', po:'split' },

  { n:14, f:'14-booking-deposit.html', kind:'tool', group:'Operations',
    name:'Fenwick Booking', biz:'Heating engineer',
    short:'Service, slot, deposit, confirmed — no phone tag.',
    long:'Five steps: pick a service, take a slot from a grid generated off the real calendar, leave details, pay a deposit that holds the slot, and see the SMS trail that follows. Demo payment only — the card fields are fixed test values.',
    proves:'The job is in the diary before you have picked up the phone.',
    tags:['Live slot grid','Demo deposit','SMS preview'],
    c:'#B4451F', pg:'#FBFAF9', pi:'#1A1816', pl:'#E7E4E0', pc:'#FFFFFF', po:'slots' },

  { n:15, f:'15-job-report.html', kind:'tool', group:'Operations',
    name:'Jobsheet', biz:'Van-side job report',
    short:'Fill it in from the van, the customer report writes itself.',
    long:'Work done, before/after photos (uploaded and downscaled on your own phone), guarantee, next service due — and out comes a branded report the customer keeps and forwards. The review ask is built into the last page.',
    proves:'Every finished job leaves a document with your name on it.',
    tags:['Live report','Photo upload','Prints to A4'],
    c:'#275C3F', pg:'#FAFBFA', pi:'#171A18', pl:'#E4E9E6', pc:'#FFFFFF', po:'report' },

  { n:16, f:'16-rota.html', kind:'tool', group:'Operations',
    name:'Shiftbook', biz:'Salon staff rota',
    short:'Click a cell to place a shift. Clashes flag as you go.',
    long:'Click to roster, clashes flag instantly, hours fill against each contract and run red when over, wage cost totals live at the bottom. Weeks anchor to the real calendar and last week copies in one click.',
    proves:'The rota stops being a photo of a whiteboard.',
    tags:['Click to roster','Contract hours','Wage totals'],
    c:'#6D3B52', pg:'#FBFAFB', pi:'#1A171A', pl:'#E8E3E6', pc:'#FFFFFF', po:'rota' },

  { n:7, f:'07-architecture-studio.html', kind:'site', group:'Websites',
    name:'Atelier Voss', biz:'Architecture practice',
    short:'A studio site with no photographs at all.',
    long:'The entire site is illustrated in hand-authored technical drawings: elevations that draw themselves in, hatched plans, dimension lines, poché section cuts. Cyanotype blue, a real six-cell title block for a masthead.',
    proves:'What a site looks like when nothing on it came from a stock library.',
    tags:['All-SVG drawings','Pinned sequence','Title block'],
    c:'#14508c', pg:'#f3f5f6', pi:'#11161b', pl:'#c4cbd0', pc:'#FFFFFF', po:'draw' },

  { n:8, f:'08-saas-landing.html', kind:'site', group:'Websites',
    name:'Cadence', biz:'Field-ops software',
    short:'The page is an operations board that never stops running.',
    long:'A departure board under tungsten light: the board is the hero, the headline is a card pinned inside it, ETAs flip like split-flap cells, and a whole shift plays out as you scroll. Pricing is a line-items table.',
    proves:'A product page where the product is the page.',
    tags:['Self-playing board','Split-flap cells','Signal amber'],
    c:'#FFB300', pg:'#16140f', pi:'#efe8da', pl:'#332e24', pc:'#1b1813', po:'cadence' },

  { n:9, f:'09-fragrance-brand.html', kind:'site', group:'Websites',
    name:'MARÉE — Sel Obscur', biz:'Fragrance house',
    short:'Ink through water, and a page that darkens as you descend.',
    long:'Salt drawn from a black tide. The ground moves through three marine phases as the notes progress, the bottle is faked entirely in layered SVG, and the whole thing refuses the category’s gold for sea glass.',
    proves:'Luxury without a single gold gradient.',
    tags:['Ink canvas','Tone-shifting scroll','SVG glass'],
    c:'#A9CBBD', pg:'#03080E', pi:'#E4EAE7', pl:'#16242F', pc:'#0C1C2A', po:'maree' },

  { n:10, f:'10-kinetic-type.html', kind:'site', group:'Websites',
    name:'SIGNAL 2027', biz:'Music & light festival',
    short:'Type that reacts to how hard you scroll.',
    long:'Three days of sound, code and light. Marquees whose speed and skew answer your scrolling, headlines that scramble into place, an RGB fringe on the display type because the identity is light being split, and a live countdown in enormous tabular numerals.',
    proves:'Loud, and still not a template.',
    tags:['Scroll-velocity type','RGB fringe','Live countdown'],
    c:'#3B18E0', pg:'#FFFFFF', pi:'#0B0B10', pl:'#E2E3E8', pc:'#F2F3F6', po:'signal' },
];

/* ---- miniature posters: drawn in a handful of divs, zero requests ---- */
window.poster = function(b){
  var r = function(n,w){ var o='',i; for(i=0;i<n;i++){ o+='<i class="bar" style="width:'+w[i%w.length]+'%"></i>'; } return o; };
  var P = {
    quote:'<div class="hd"><i class="dot"></i><b>Northgate</b><i class="sp"></i><i class="mn">STEP 6/9</i></div>'
      +'<div class="row"><div class="cel"></div><div class="cel"></div><div class="cel"></div><div class="cel"></div></div>'
      +'<i class="rule"></i>'
      +'<div class="stk">'+r(3,[86,64,72])+'</div>'
      +'<div class="ft"><span class="mn">Itemised quote</span><b class="fig">£12,480</b></div>',
    kanban:'<div class="hd"><i class="dot"></i><b>Redgate</b><i class="sp"></i><i class="mn">58 JOBS</i></div>'
      +'<div class="cols">'
      +'<div class="col"><i class="colh">NEW <s>4</s></i><i class="ct"></i><i class="ct"></i></div>'
      +'<div class="col"><i class="colh">QUOTED <s>7</s></i><i class="ct on"></i><i class="ct"></i><i class="ct"></i></div>'
      +'<div class="col"><i class="colh">BOOKED <s>6</s></i><i class="ct"></i></div>'
      +'</div>',
    board:'<div class="hd"><i class="dot"></i><b>Halcyon</b><i class="sp"></i><i class="mn">WK 09</i></div>'
      +'<div class="grid5"><i class="jb" style="grid-area:1/1/2/3"></i><i class="jb on" style="grid-area:1/4/2/6"></i>'
      +'<i class="jb" style="grid-area:2/2/3/4"></i><i class="jb" style="grid-area:3/1/4/2"></i>'
      +'<i class="jb on" style="grid-area:3/3/4/6"></i><i class="jb" style="grid-area:4/2/5/5"></i></div>',
    sheet:'<div class="pg"><div class="pgh"><b>INVOICE</b><i class="mn">LL-0428</i></div>'
      +'<div class="stk sm">'+r(5,[92,78,86,70,88])+'</div><i class="rule"></i>'
      +'<div class="ft"><span class="mn">Total due</span><b class="fig sm">£4,265.00</b></div></div>',
    curve:'<div class="hd"><i class="dot"></i><b>Mortgage Lab</b></div>'
      +'<svg class="cv" viewBox="0 0 100 44" preserveAspectRatio="none"><path d="M0 4 C22 8 40 22 60 32 C76 40 90 42 100 43" fill="none" stroke="var(--c)" stroke-width="1.6"/>'
      +'<path d="M0 4 C22 8 40 22 60 32 C76 40 90 42 100 43 L100 44 L0 44Z" fill="var(--c)" opacity=".1"/>'
      +'<path d="M0 6 C26 14 48 30 72 38 C84 42 94 43 100 44" fill="none" stroke="var(--pl)" stroke-width="1.2" stroke-dasharray="0"/></svg>'
      +'<div class="ft"><span class="mn">Interest saved</span><b class="fig">£73,710</b></div>',
    fall:'<div class="hd"><i class="dot"></i><b>Payslip Lab</b></div>'
      +'<div class="wf"><i style="height:96%"></i><i style="height:70%"></i><i style="height:62%"></i><i style="height:58%"></i><i class="on" style="height:54%"></i></div>'
      +'<div class="ft"><span class="mn">Take-home</span><b class="fig sm">£3,914 / mo</b></div>',
    grade:'<div class="hd"><i class="dot"></i><b>Kerbside</b><i class="sp"></i><i class="mn">REPORT</i></div>'
      +'<div class="gr"><b class="gfig">C+</b><div class="stk sm">'+r(4,[88,66,80,58])+'</div></div>'
      +'<div class="ft"><span class="mn">Costing / month</span><b class="fig sm">£2,140</b></div>',
    meter:'<div class="hd"><i class="dot"></i><b>Stopcock</b></div>'
      +'<svg class="cv tall" viewBox="0 0 100 52"><path d="M12 46 A38 38 0 0 1 88 46" fill="none" stroke="var(--pl)" stroke-width="7" stroke-linecap="round"/>'
      +'<path d="M12 46 A38 38 0 0 1 74 18" fill="none" stroke="var(--c)" stroke-width="7" stroke-linecap="round"/></svg>'
      +'<div class="ft"><span class="mn">Leaking / yr</span><b class="fig">£51,300</b></div>',
    split:'<div class="sx"><div class="sxa"><i class="bar" style="width:70%"></i><i class="bar" style="width:52%"></i><i class="bar" style="width:60%"></i></div>'
      +'<div class="sxb"><i class="bar c" style="width:80%"></i><i class="bar" style="width:64%"></i><i class="bar" style="width:74%"></i></div><i class="tape"></i></div>'
      +'<div class="ft"><span class="mn">2011</span><span class="mn">Rebuild</span></div>',
    slots:'<div class="hd"><i class="dot"></i><b>Fenwick</b><i class="sp"></i><i class="mn">STEP 2/5</i></div>'
      +'<div class="slot"><i></i><i></i><i class="on"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
      +'<div class="ft"><span class="mn">Deposit holds it</span><b class="fig sm">£45.00</b></div>',
    report:'<div class="pg"><div class="pgh"><b>JOB REPORT</b><i class="mn">#1182</i></div>'
      +'<div class="ph"><i></i><i></i></div><div class="stk sm">'+r(3,[90,72,84])+'</div></div>',
    rota:'<div class="hd"><i class="dot"></i><b>Shiftbook</b><i class="sp"></i><i class="mn">MON–SUN</i></div>'
      +'<div class="grid5 r7"><i class="jb" style="grid-area:1/1/2/3"></i><i class="jb on" style="grid-area:1/4/2/7"></i>'
      +'<i class="jb" style="grid-area:2/2/3/5"></i><i class="jb" style="grid-area:3/1/4/4"></i>'
      +'<i class="jb on" style="grid-area:3/5/4/8"></i><i class="jb" style="grid-area:4/3/5/6"></i></div>',
    draw:'<svg class="dw" viewBox="0 0 120 74"><g stroke="var(--pi)" fill="none" stroke-width=".7">'
      +'<path d="M14 62 L14 26 L60 10 L106 26 L106 62"/><path d="M14 62 L106 62"/><path d="M30 62 L30 40 L46 40 L46 62"/>'
      +'<path d="M62 62 L62 34 L92 34 L92 62"/><path d="M62 46 L92 46"/></g>'
      +'<g stroke="var(--c)" stroke-width=".7"><path d="M14 68 L106 68"/><path d="M14 66 L14 70"/><path d="M106 66 L106 70"/></g>'
      +'<text x="60" y="73" fill="var(--c)" font-size="4.4" text-anchor="middle" font-family="monospace">12 400</text></svg>',
    cadence:'<div class="hd"><i class="dot"></i><b>CADENCE</b><i class="sp"></i><i class="mn">LIVE</i></div>'
      +'<div class="bd"><div><i class="mn">08:12</i><i class="bar" style="width:62%"></i><i class="fl"></i></div>'
      +'<div><i class="mn">08:40</i><i class="bar" style="width:78%"></i><i class="fl on"></i></div>'
      +'<div><i class="mn">09:05</i><i class="bar" style="width:54%"></i><i class="fl"></i></div>'
      +'<div><i class="mn">09:30</i><i class="bar" style="width:70%"></i><i class="fl on"></i></div></div>',
    maree:'<div class="mr"><svg viewBox="0 0 40 74"><rect x="13" y="18" width="14" height="46" rx="2" fill="var(--pc)" stroke="var(--c)" stroke-width=".6"/>'
      +'<rect x="17" y="9" width="6" height="10" fill="none" stroke="var(--c)" stroke-width=".6"/>'
      +'<rect x="15.5" y="34" width="9" height="14" fill="none" stroke="var(--c)" stroke-width=".4" opacity=".7"/></svg>'
      +'<div><b class="ser">Sel<br>Obscur</b><i class="mn">ÉDITION DE 400</i></div></div>',
    signal:'<div class="sg"><b class="big">SIG<br>NAL</b><i class="mn">12–14 MAR · MANCHESTER</i></div>',
  };
  return '<div class="po po--'+b.po+'" style="--c:'+b.c+';--pg:'+b.pg+';--pi:'+b.pi+';--pl:'+b.pl+';--pc:'+b.pc+'">'+(P[b.po]||'')+'</div>';
};
