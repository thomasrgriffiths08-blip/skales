// Recorded example answers for the public demo's "Ask the team".
// Nothing here calls an AI. Each suggested question, each "Asked recently" row and each "tap to ask" row has one
// answer written from the same sample data the rest of the demo shows (data/*.json), so the figures and names agree
// with every other page. A typed question that has no recording gets the "typed questions run live" sheet instead.
const gbp = (n) => "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
export const norm = (q) => String(q || "").toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

// the ones the "typed questions run live" sheet offers
export const OFFER = ["Who owes us money over 30 days?", "What's booked in for tomorrow?", "Which ads are bringing the cheapest leads?", "What's waiting for Priya to approve?"];

// who on the reactive team has a gap on the diary's Friday afternoon
function fridayFree(I) {
  const day = (I.days || []).find((d) => new Date(d + "T12:00:00").getDay() === 5);
  if (!day) return null;
  const taken = {};
  for (const b of I.bookings || []) if (b.date === day) (taken[b.eng] ||= []).push(String(b.slot).slice(0, 2));
  const out = [];
  for (const e of I.engineers || []) {
    const t = taken[e.id] || [], early = !t.includes("13") && !t.includes("14"), late = !t.includes("15") && !t.includes("14");
    if (early || late) out.push({ name: e.name, trade: String(e.trade || "").toLowerCase(), when: early && late ? "all afternoon" : early ? "1pm to 3pm" : "3pm to 5pm" });
  }
  return out;
}

export function build({ F, I, P, C, O }) {
  const M = F.model, E = M.employees, firm = M.firm, last = M.weeks.at(-1), L = C.ledger, T = P.tomorrow;
  const round = (C.items || []).reduce((a, i) => a + (i.amount || 0), 0), nRound = (C.items || []).length;
  const wait = O.waiting?.clients || [], waitN = wait.reduce((a, c) => a + c.invoices, 0), waitGbp = wait.reduce((a, c) => a + c.total, 0);
  const waitList = wait.map((c) => `${c.invoices} for ${c.customer} (${gbp(c.total)})`).join(", ").replace(/, ([^,]*)$/, " and $1");
  const area = (id) => T.areas.find((a) => a.id === id) || { vans: 0, jobs: 0 };
  const free = fridayFree(I);

  const owes = {
    replies: [{ agent: "money", looked_at: [`Sales ledger, ${L.accounts} accounts`, "Invoices past 30 days"],
      text: `${gbp(L.over_30_gbp)} of the ${gbp(L.owed_gbp)} we're owed is over 30 days old. The accounts with the oldest invoices: Bristol Facilities Group, ${gbp(14620)} on account with the oldest at 55 days, and ${gbp(8940)} of that is disputed and with Kieran. Stokeleigh Housing Association, ${gbp(26480)}, oldest 47 days; they pay on a fortnightly run. Harbour & Rowe, ${gbp(9310)}, oldest 38 days. Coldharbour Homes Trust, ${gbp(19870)}, oldest 36 days. Northgate Lettings, ${gbp(7450)}, oldest 33 days.` }],
    follow_ups: ["What's Penny chasing, and what needs Kieran?", "How much have we invoiced today?"],
  };
  const pennyAll = {
    replies: [{ agent: "money", looked_at: [`Sales ledger, ${L.accounts} accounts`, "Chasers sent, last 7 days", "Today's chase list"],
      text: `We're owed ${gbp(L.owed_gbp)} across ${L.accounts} accounts, and ${gbp(L.over_30_gbp)} of it is over 30 days. The largest balances are Stokeleigh Housing Association (${gbp(26480)}), Coldharbour Homes Trust (${gbp(19870)}) and Bristol Facilities Group (${gbp(14620)}). In the last 7 days I sent 140 chasers and ${E.money.kpis[0].value} came in within 7 days of one. Customers now take ${E.money.days_to_pay} days to pay on average, down from 43. Today's round is ${nRound} invoices worth ${gbp(round)}. The ${gbp(8940)} Bristol Facilities Group dispute is with Kieran, so I've left that one alone.` }],
    follow_ups: ["Who owes us money over 30 days?", "What's Penny chasing, and what needs Kieran?"],
  };
  const chasing = {
    replies: [{ agent: "money", looked_at: ["Today's chase list", "Customer notes", "Kieran's rule on disputes"],
      text: `Today's round is ${nRound} invoices, ${gbp(round)} in all. Five are straightforward: Clifton Lettings ${gbp(486)}, Mr and Mrs Hale ${gbp(214.8)}, Harbour & Rowe ${gbp(1380)} at 38 days, Mr Reeves ${gbp(420)}, who has said he'll pay on Friday, and Bristol Facilities Group ${gbp(2340)}, which only needs their purchase order number BFG-PO-88213 on the invoice. Nadia Brooks's ${gbp(372)} needs checking first: she says she was charged for 6 hours and the timesheet says 4.5. Kieran has one: KP-21075, ${gbp(8940)}, 55 days overdue and disputed in writing. I never chase a disputed invoice, and disputes over £1,000 are his decision.` }],
    follow_ups: ["Who owes us money over 30 days?", "What's waiting for Priya to approve?"],
  };
  const invoicedToday = {
    replies: [{ agent: "invoices", looked_at: ["Contract works orders", "Invoices waiting for Priya"],
      text: `Today's batch is ${waitN} contract invoices, ${gbp(waitGbp)} in total, drafted and waiting for Priya: ${waitList}. They go out once she approves them, because every invoice goes out under her name. Over the last 7 days I drafted ${E.invoices.kpis[0].value} invoices and 614 of them went out exactly as I wrote them.` }],
    follow_ups: ["What's waiting for Priya to approve?", "Who owes us money over 30 days?"],
  };
  const ivyToday = {
    replies: [{ agent: "invoices", looked_at: ["Invoices waiting for Priya", "Approvals, last 7 days", "This week's new rules"],
      text: `Today's batch is ready for Priya: ${waitN} contract works orders drafted as invoices, ${gbp(waitGbp)} in total, for Clifton Lettings, Northgate Lettings and Harbour & Rowe. Each Harbour & Rowe invoice carries the tenant's name and flat number, a rule I picked up this week because their system matches on it. Over the last 7 days, 614 of the ${E.invoices.kpis[0].value} invoices I drafted went out with no changes, which is ${E.invoices.kpis[1].value}.` }],
    follow_ups: ["How much have we invoiced today?", "What new rules has the team learned?"],
  };
  const tomorrow = {
    replies: [{ agent: "jobs", looked_at: ["Tomorrow's job list", "The area planners' vans", "Customer time windows"],
      text: `${T.jobs} jobs across ${T.vans} vans. ${T.planned_jobs} are already on ${T.planned_vans} vans: ${area("north").jobs} in north Bristol, ${area("south").jobs} in south Bristol and Bath, ${area("swindon").jobs} from the Swindon depot and ${area("crews").jobs} for the project crews. The other ${T.left_jobs} are reactive repairs for the ${T.left_vans} reactive vans. That list is mine to plan and Priya checks it before any texts go out. Three with a time window: Northgate Lettings' boiler service and gas safety certificate in Swindon before 13:00, a blocked yard gully at Bristol Facilities Group's Unit 3 before 12:00, and the extractor fan at 22 Filton Avenue after 15:00, because the tenant works shifts.` }],
    follow_ups: ["Is anyone free Friday afternoon for a quote visit?", "Any urgent jobs come in today?"],
  };
  const friday = {
    replies: [{ agent: "jobs", looked_at: ["Friday's diary, reactive vans", "Engineers' trades"],
      text: !free ? "I can't see a Friday in the five days of the diary I plan from."
        : free.length ? `Yes. On the reactive team's diary for Friday, ${free.slice(0, 4).map((f) => `${f.name} (${f.trade}) is free ${f.when}`).join("; ")}. Pick whoever matches the trade the quote needs. Nothing is booked until Priya confirms it.`
        : "Not on the reactive vans: all twelve engineers have jobs in both afternoon slots on Friday. The earliest gap would have to come from moving a job, which is Priya's call." }],
    follow_ups: ["What's booked in for tomorrow?"],
  };
  const urgent = {
    replies: [{ agent: "inbox", looked_at: ["Today's inbox, 15 emails", "The diary", "Sender addresses"],
      text: `Three need a fast answer. Harbour & Rowe marked one urgent at 07:40: the front door at 3 Cotham Vale won't lock and the tenant can't leave the flat secure (their ref HR/2291, limit £300). Graham Pike emailed at 08:44 because the plumber he was promised between 8 and 10 hadn't arrived or rung. And Dan's van failed its MOT, so his morning jobs need moving. One complaint needs a senior call today: Joanne Kerr, cement on her new patio, and it's her third email. Two others look like fakes and shouldn't be acted on: a warning that the Business Profile will be suspended, and a change of bank details for invoice SPH-88214.` }],
    follow_ups: ["Which letting agents sent us work today?", "What's booked in for tomorrow?"],
  };
  const agents = {
    replies: [{ agent: "inbox", looked_at: ["Today's inbox, 15 emails", "Works order numbers"],
      text: `Three so far. Clifton Lettings sent works order WO-55812, a leaking kitchen waste at 14 Ashley Down Road, and asked for an update on WO-55790 at 22 Gloucester Road. Harbour & Rowe sent the urgent one, a front door that won't lock at 3 Cotham Vale (HR/2291). Hollis & Grey sent a works order for black mould and an extractor fan that has stopped working at 22 Filton Avenue, PO HG-7710, where the tenant can only do weekdays after 3pm.` }],
    follow_ups: ["Any urgent jobs come in today?", "How much have we invoiced today?"],
  };
  const cheapest = {
    replies: [{ agent: "ads", looked_at: ["Seven campaigns, last 7 days", "Spend and leads by campaign"],
      text: `Boiler repair in Bristol is the cheapest: 14 leads for ${gbp(237.6)}, which is ${gbp(16.97)} each. Next are boiler repair in Bath and Swindon at ${gbp(19.88)} and leaks and plumbing repairs at ${gbp(20.29)}, which also brought the most leads, 20. The dearest is the extensions campaign on Meta at ${gbp(37.09)} a lead, and that one was paused today because the five building crews are booked for the next 14 weeks. Across all seven campaigns it's ${last.ad_leads} leads for ${gbp(last.ad_spend)}, ${gbp(last.ad_cpl)} each.` }],
    follow_ups: ["How are the boiler ads doing?", "Where are our leads coming from?"],
  };
  const boiler = {
    replies: [{ agent: "ads", looked_at: ["Boiler repair, Bristol", "Boiler repair, Bath and Swindon"],
      text: `Well. The Bristol campaign brought 14 leads in the last 7 days at ${gbp(16.97)} each, the cheapest on the account, so its daily cap went from £30 to £40 at Tom's Monday check. Bath and Swindon brought 12 leads at ${gbp(19.88)} each on the same £89 call-out offer. Together that's 26 leads for ${gbp(476.2)}, ${gbp(18.32)} a lead, against ${gbp(last.ad_cpl)} across all the ads.` }],
    follow_ups: ["Which ads are bringing the cheapest leads?", "Where are our leads coming from?"],
  };
  const leads = {
    replies: [
      { agent: "ads", looked_at: ["Leads by source, last 7 days", "Ad spend"],
        text: `${last.leads_all} leads in the last 7 days. ${last.leads.repeat} were repeat customers and ${last.leads.referral} were referrals. Marketing brought the other ${last.leads_marketing}: ${last.leads.ads} from my ads, ${last.leads.seo} from Seren's pages and ${last.leads.content} from Clara's posts. The ads cost ${gbp(last.ad_cpl)} a lead.` },
      { agent: "seo", looked_at: ["Enquiries by page"],
        text: `The ${last.leads.seo} from my pages are calls and forms from the seven pages that are live. That's up from 27 in the 7 days before.` },
    ],
    follow_ups: ["Which ads are bringing the cheapest leads?", "Which searches should we go after next?"],
  };
  const searches = {
    replies: [{ agent: "seo", looked_at: ["380 searches checked", "Who ranks now", "Kingpost's proof list"],
      text: `Three, all searches where the local answer is weak. “boiler repair bristol same day”, about 590 searches a month: the top result shows no prices at all, and Clara has our page drafted. “landlord gas safety certificate bristol”, about 260 a month: the page that ranks is three years old with old prices, and nobody offers to sort tenant access. The brief is written. “single storey extension cost bristol”, about 720 a month: the top result is a photo gallery with no costs or timelines. I found that one this week and haven't briefed it yet. Search numbers are monthly estimates.` }],
    follow_ups: ["What's Clara writing at the moment?", "Where are our leads coming from?"],
  };
  const clara = {
    replies: [{ agent: "content", looked_at: ["Drafts on Clara's desk", "Seren's briefs", "Kingpost's proof list"],
      text: `Two service pages from Seren's briefs. “Boiler broken? Same-day boiler repair in Bristol” is written, 940 words, and with Maeve for checking. “Landlord gas safety certificates (CP12) in Bristol” is the one on my desk today. Already out or approved: the Google post about holding morning slots for roof leaks, the email to landlords about gas certificates due soon, and the blog post on what a blocked drain call-out costs in Bristol. Nothing public goes out until Priya approves it.` }],
    follow_ups: ["Which searches should we go after next?", "What's waiting for Priya to approve?"],
  };
  const week = {
    replies: [{ agent: "manager", looked_at: ["All ten desks, last 7 days", "The task board"],
      text: `${M.last7.hours} hours given back, worth ${gbp(M.last7.money_saved)} of office time. Ivy drafted ${E.invoices.kpis[0].value} invoices. Theo sorted ${E.inbox.kpis[0].value} emails and booked ${E.inbox.kpis[1].value} jobs straight from the inbox. Rowan planned ${E.jobs.kpis[0].value} jobs, and Penny's chasers brought in ${E.money.kpis[0].value}. Archie's ads brought ${last.ad_leads} leads at ${gbp(last.ad_cpl)} each, Seren's pages ${last.leads.seo} enquiries, and Clara drafted ${E.content.kpis[0].value} pieces. Dot read ${E.paperwork.kpis[0].value} documents and caught ${E.paperwork.kpis[1].value} mistakes worth ${gbp(3860)}. I checked ${E.manager.kpis[0].value} pieces of work and sent ${E.manager.kpis[1].value} back, and Kit turned 11 corrections into ${E.coach.kpis[0].value} new rules.` }],
    follow_ups: ["What's waiting for Priya to approve?", "What new rules has the team learned?"],
  };
  const forPriya = (open) => ({
    replies: [{ agent: "manager", looked_at: ["Needs you list", "The task board"],
      text: `${open} Approve ${waitN} invoices, ${gbp(waitGbp)} in total, for Clifton Lettings, Northgate Lettings and Harbour & Rowe. Send 9 replies, six to letting agents and three quoting a boiler service price. Publish the landlord gas safety certificates page, which I've checked. And send a query to Brackwell Heating Supplies about a third boiler Dot can't match to a job, ${gbp(1148)}. Separately, Kieran has ${M.needs_total.kieran} decisions: the drain unblocking ads (£40 a day for 14 days) and the ${gbp(8940)} Bristol Facilities Group dispute. Tom has 2 new rules to sign off.` }],
    follow_ups: ["How much have we invoiced today?", "What's Penny chasing, and what needs Kieran?"],
  });
  const rules = {
    replies: [{ agent: "coach", looked_at: ["Corrections, last 7 days", "The rule library"],
      text: `Six new rules in the last 7 days, from 11 corrections, which makes ${E.coach.kpis[1].value} in force. Penny never chases an invoice the customer has disputed in writing; she flags it to Kieran. Archie runs no ad that says best or No.1, because we can't prove it. Theo puts a letting agent's works order number in the subject line of his reply. Ivy puts the tenant's name and flat number on Harbour & Rowe invoices. Clara puts the price in the first three lines of every service page. Dot sends gas certificates to the landlord and the agent, never to the tenant's email. Two of them are waiting for Tom's sign-off at his Monday check.` }],
    follow_ups: ["What did you all do in the last 7 days?", "What's waiting for Priya to approve?"],
  };
  const cotham = {
    replies: [{ agent: "paperwork", looked_at: ["Certificates folder", "Sent items"],
      text: `Yes. It went to the landlord and to Harbour & Rowe, the agent, on the same day the check was done, and a copy is filed with the property's paperwork. In the last 7 days, 97% of certificates went out the same day.` }],
    follow_ups: ["What new rules has the team learned?", "Which letting agents sent us work today?"],
  };
  const today = {
    replies: [{ agent: "manager", looked_at: ["All ten desks, today", "Needs you list"],
      text: `Here's where today stands. Ivy has ${waitN} contract invoices drafted for Priya, ${gbp(waitGbp)} in total. Theo has 9 replies ready for her to send. Penny has ${nRound} invoices on today's chase list, worth ${gbp(round)}. Rowan has ${T.left_jobs} reactive jobs to plan for tomorrow. Clara is on the landlord gas safety certificates page and Archie has a drain unblocking campaign waiting for Kieran's yes. Dot has a query for Brackwell Heating Supplies about a boiler she can't match to a job, and Kit has 2 new rules for Tom. ${M.needs_total.count} things are waiting on a person.` }],
    follow_ups: ["What's waiting for Priya to approve?", "What did you all do in the last 7 days?"],
  };

  const A = {
    "Who owes us money over 30 days?": owes, "Who owes us over 30 days?": owes,
    "Who owes us money?": pennyAll, "Penny, who owes us money and what are you doing about it?": pennyAll,
    "What's Penny chasing, and what needs Kieran?": chasing,
    "How much have we invoiced today?": invoicedToday, "Ivy, how are today's invoices looking?": ivyToday,
    "What's booked in for tomorrow?": tomorrow, "Is anyone free Friday afternoon for a quote visit?": friday,
    "Any urgent jobs come in today?": urgent, "Theo, anything urgent in the inbox today?": urgent,
    "Which letting agents sent us work today?": agents,
    "Which ads are bringing the cheapest leads?": cheapest, "How are the boiler ads doing?": boiler, "Where are our leads coming from?": leads,
    "Which searches should we go after next?": searches, "Any searches we should be going after?": searches,
    "What's Clara writing at the moment?": clara,
    "What did you all do in the last 7 days?": week, "What did you all do today?": today,
    "What's waiting for Priya to approve?": forPriya("Four things."), "What's waiting for me?": forPriya("Four things, Priya."),
    "What new rules has the team learned?": rules,
    "Did the Cotham Vale certificate go to the landlord?": cotham,
  };
  return new Map(Object.entries(A).map(([q, a]) => [norm(q), a]));
}
