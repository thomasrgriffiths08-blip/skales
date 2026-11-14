// The team brain's long memory. The live graph (from the server) holds what the team touched today; this adds the
// months of sample history around it: customers, properties, jobs, invoices, emails, certificates, suppliers,
// engineers, the office and the rules. Kingpost is a sample company: every name here is invented (street names are
// ordinary Bristol, Bath and Swindon streets, no real people). Deterministic, so the same brain appears on every load.
//
// A firm this size knows tens of thousands of things, far more than an Intel laptop can draw. So the hologram shows the
// most used notes (about SHOWN, live notes included) and `totals` says how many of each kind the whole brain holds,
// worked out from the firm's facts and the model (lib/model.mjs) where it has them.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export const SHOWN = 500;
// the firm (KINGPOST.md); pages pass ctx.model so these always match it
const FIRM = { vans: 64, engineers: 73, office_staff: 18, contract_clients: 48, depots: 2 };
// the whole brain beyond what the model counts (sample): homeowners on file, properties, suppliers, gas certificates
const ON_FILE = { homeowners: 5812, properties: 14260, suppliers: 142, certs: 6480 };
// average links per note of each kind, for the whole brain's link count
const PER = { customer: 2.1, property: 1.3, job: 3.2, invoice: 2.4, email: 2.0, doc: 2.2, cert: 2.0, engineer: 3.0, supplier: 2.5, person: 2.0 };

// The 73 engineers and trades: 55 solo vans plus 9 two-person crews (roofing 4, building 5) = 64 vans.
const NAMED = [["Dave Kerslake", "gas"], ["Callum Reid", "plumbing"], ["Dan Whitlock", "building"], ["Ryan Mercer", "roofing"], ["Wes Doyle", "roofing"], ["Ollie Pearce", "gas"],
  ["Marcus Bell", "electrical"], ["Shaz Ahmed", "gas"], ["Lewis Hart", "carpentry"], ["Kofi Mensah", "plumbing"], ["Gemma Price", "gas"], ["Jack Turner", "drainage"]];
const FN = ["Adam", "Ben", "Carl", "Darren", "Ellis", "Finn", "Gary", "Harry", "Imran", "Jamie", "Karl", "Liam", "Matt", "Nathan", "Owen", "Paul", "Raj", "Sean", "Toby", "Usman", "Vince", "Will", "Zak", "Aaron", "Bradley", "Craig", "Dean", "Ethan", "Fraser", "Grant", "Hannah", "Josh", "Kyle", "Leon", "Mo", "Neil", "Phil", "Rob", "Steve", "Tariq", "Abby", "Chloe", "Jade"];
const SN = ["Ashby", "Barnes", "Clarke", "Dawson", "Evans", "Fletcher", "Gibbs", "Hughes", "Irving", "James", "Knight", "Lawson", "Mills", "Norris", "Osborne", "Parry", "Quinn", "Rees", "Stone", "Tanner", "Upton", "Vaughan", "Walsh", "Yates", "Abbott", "Bishop", "Cole", "Day", "Ellis", "Ford", "Glover", "Hale", "Iqbal", "Jarvis", "Kemp", "Lowe", "Marsh", "Nash", "Owens", "Pike", "Rowley", "Sims", "Trent"];
const TRADES = { gas: ["Gas and heating", 20], plumbing: ["Plumbing", 11], electrical: ["Electrical", 10], carpentry: ["Carpentry", 6], plastering: ["Plastering and decorating", 4], drainage: ["Drainage", 4], roofing: ["Roofing", 8], building: ["Building and brickwork", 10] };
const OFFICE = [["Kieran Doyle", "Managing director. Says yes to new ad campaigns, prices, disputes over £1,000 and anything about reputation."], ["Mark Sutton", "Operations director: engineers, vans and the yard."],
  ["Priya Nair", "Office manager. Everything that goes out goes out under her name."], ["Helen Price", "Finance manager."], ["Sophie Hart", "Accounts assistant, sales invoices."], ["Jordan Ellis", "Credit controller."],
  ["Amira Khan", "Accounts assistant, supplier invoices."], ["Tasha Reid", "Lead planner."], ["Ben Okafor", "Planner, north Bristol."], ["Lauren Webb", "Planner, south Bristol and Bath."], ["Sam Patel", "Planner, Swindon."],
  ["Chris Doran", "Planner, projects and crews."], ["Megan Lloyd", "Customer service."], ["Ade Bello", "Customer service."], ["Hollie Grant", "Customer service."], ["Tyler Ward", "Customer service."],
  ["Rachel Moss", "Compliance and certificates."], ["Gareth Hunt", "Buyer and stores."]];
const SUPPLIERS = ["Brackwell Heating Supplies", "Severn Plumbing Supplies", "Avonmere Builders Merchants", "Ostler Electrical Wholesale", "Fernleigh Timber & Sheet", "Corvane Bathrooms", "Harbourside Plant Hire",
  "Lantern Hill Access", "Tidemark Tool Hire", "Gullhaven Power & Drying", "Kestrel Access", "Pellow Skip Hire", "Wessex Roofing Supplies", "Swindon Trade Counter"];
// 48 contract clients: 38 letting agents, 4 housing associations, 6 facilities firms
const LETTING = ["Clifton Lettings", "Northgate Lettings", "Hollis & Grey Lettings", "Harbour & Rowe Property Management", "Redland Homes Lettings", "Cotham Property Co", "Southville Lets", "Harbour Quay Residential",
  "Westbury Block Management", "Clifton Village Lets", "Bedminster Rentals", "Fishponds Homes", "Keynsham Lettings", "Pryce & Ashdown Lettings", "Mercer Lane Lettings", "Thornbury & Vale", "Fenwick Hart Lettings",
  "Calder & Moss", "Brightwell Lettings", "Oakhurst Residential", "Linwood & Fry", "Avonvale Lets", "Marlowe & Finch", "Greystoke Lettings", "Tamsin Rowe Lettings", "Hartcliffe Lets", "Ellison Property",
  "Wren & Holt", "Saxby Lettings", "Draycott Homes", "Ashgrove Residential", "Penrose & Kaye", "Elmstead Lettings", "Quarry Hill Lets", "Bellamy & Shaw", "Corsham Property Co", "Hollybrook Lettings", "Larkhall Lets"];
const HOUSING = ["Westbury Homes", "Severnside Housing", "Avon Valley Homes Trust", "Wiltshire Vale Housing"];
const FM = ["Bristol Facilities Group", "Meridian FM West", "Stonegate Facilities", "Harlow Property Services", "Clearline FM", "Brunswick Estates Management"];
const HOMEOWNERS = ["Mrs Hale", "Mr Shaw", "Mrs Okafor", "Ms Patel", "Mr Burns", "Mrs Ellis", "Mr Kaur", "Mrs Webb", "Mr Hughes", "Ms Novak", "Mr Grant", "Mrs Lowe", "Mr Fenn", "Ms Carter", "Mr Reeve", "Mrs Moss", "Mr Lane", "Ms Ward", "Mr Price", "Mrs Clay", "Mr Shah", "Ms Byrne"];
const STREETS = ["Cotham Vale", "Redland Road", "Gloucester Road", "North Road", "Raleigh Road", "Coronation Road", "Chessel Street", "Ashley Down Road", "Fishponds Road", "Wells Road", "Whiteladies Road", "Hampton Road",
  "Archfield Road", "Zetland Road", "Cranbrook Road", "Berkeley Road", "Bath Road", "Station Road", "Church Road", "Victoria Park", "Lansdown Road", "Wellsway", "Commercial Road", "Kingshill Road", "Faringdon Road"];
const AREAS = ["Clifton", "Redland", "Cotham", "Bishopston", "Southville", "Bedminster", "Horfield", "Fishponds", "Keynsham", "Easton", "Totterdown", "Kingsdown", "Bath", "Swindon Old Town", "Rodbourne"];
const JOBS = ["Boiler service", "Boiler repair", "Roof leak", "Slipped tiles", "Gutter clear", "Landlord gas safety check", "Damp survey", "Drain unblock", "Bathroom refit", "Kitchen fit", "Extension snagging",
  "Radiator swap", "Flat roof patch", "Chimney repoint", "Electrical fault-find", "EICR", "Void property turnaround", "Works order repair"];
const EMAILS = ["Quote request", "Can you come sooner?", "Invoice query", "Works order", "Leak, urgent", "Thank you", "Reschedule", "Access details", "Key collection", "Photos of the damage"];
const DOCS = ["Plant hire log", "Van stock check", "Timesheet", "Delivery note", "Fuel receipt", "Skip ticket", "Supplier invoice", "Gas certificate scan"];

// how many notes of each kind the whole brain holds (not just the ones drawn)
export function brainTotals(model, { liveDocs = 0 } = {}) {
  const F = { ...FIRM, ...(model?.firm || {}) }, W = model?.weeks || [], E = model?.employees || {};
  const since = (units) => (units?.length ? units.reduce((a, b) => a + b, 0) + 14 * units[0] : 0); // 26 weeks: the model's 12, and the 14 before at the first week's pace
  return {
    customer: F.contract_clients + ON_FILE.homeowners,
    property: ON_FILE.properties,
    job: since(W.map((w) => w.jobs_booked)) || 25894,
    invoice: since(E.invoices?.units) || 14627,
    email: since(E.inbox?.units) || 43617,
    doc: (E.paperwork?.units || []).reduce((a, b) => a + b, 0) + liveDocs || 3201, // every photo Dot has read since she started, plus today's
    cert: ON_FILE.certs,
    engineer: F.engineers,
    supplier: ON_FILE.suppliers,
    person: F.office_staff + 1, // the office, and Tom
  };
}

export function longMemory(live, { rules = [], model = null, shown = SHOWN } = {}) {
  const R = rng(9137);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const nodes = [], links = [], has = new Set(live.nodes.map((n) => n.id));
  const add = (n) => { if (has.has(n.id)) return n.id; has.add(n.id); nodes.push(n); return n.id; };
  const link = (a, b) => { if (a && b && a !== b) links.push({ source: a, target: b }); };
  const A = (id) => `agent:${id}`;
  const day = (lo, hi) => -Math.floor(lo + R() * (hi - lo)); // day offset in the past
  const F = { ...FIRM, ...(model?.firm || {}) };

  // the office, and Tom
  const people = OFFICE.map(([name, role], i) => add({ id: `g:p:${i}`, label: name, type: "person", day: -200, md: `# ${name}\n${role}\nKingpost office (sample).` }));
  add({ id: "g:p:tom", label: "Tom", type: "person", day: -182, md: "# Tom\nChecks the whole AI team every Monday and signs off new rules." });
  ["invoices", "inbox", "money", "content", "ads", "paperwork"].forEach((a) => link(people[2], A(a))); // Priya
  link(people[0], A("ads")); link(people[0], A("money")); link(people[1], A("jobs")); link(people[3], A("money")); link(people[5], A("money")); link(people[6], A("paperwork"));
  [7, 8, 9, 10, 11].forEach((k) => link(people[k], A("jobs"))); [12, 13, 14, 15].forEach((k) => link(people[k], A("inbox"))); link(people[16], A("paperwork")); link(people[17], A("paperwork"));
  link("g:p:tom", A("coach")); link("g:p:tom", A("manager"));

  // every engineer and trade, with their van and depot
  const roster = [...NAMED];
  for (const [t, [, n]] of Object.entries(TRADES)) { const have = roster.filter((x) => x[1] === t).length; for (let k = have; k < n; k++) roster.push([`${FN[roster.length % FN.length]} ${SN[(roster.length * 7 + 3 * Math.floor(roster.length / FN.length)) % SN.length]}`, t]); }
  let van = 0; const crewVan = {};
  const eng = roster.slice(0, F.engineers).map(([name, t], i) => {
    const crew = t === "roofing" || t === "building", key = `${t}:${Math.floor(roster.filter((x, k) => k < i && x[1] === t).length / 2)}`;
    const v = crew ? (crewVan[key] ||= ++van) : ++van, depot = i % 5 === 4 ? "Swindon depot" : "Bristol yard";
    return add({ id: `g:eng:${i}`, label: name, type: "engineer", day: -180, md: `# ${name}\n${TRADES[t][0]}${crew ? ", in a two-person crew" : ""} (sample). Van ${v}, ${depot}.\n- Rowan plans the van's day every afternoon.\n- Ivy turns the job sheets into invoices.` });
  });
  eng.forEach((e) => { link(e, A("jobs")); link(e, A("invoices")); });
  // the two depots
  const depots = [["g:depot:bris", "Unit 4, Hambrook Lane", "Head office and main yard, Hambrook Lane Business Park, Bristol BS16."], ["g:depot:swin", "Unit 9, Cheney Manor", "Swindon depot, Cheney Manor, SN2."]]
    .slice(0, F.depots).map(([id, label, md]) => add({ id, label, type: "property", day: -400, md: `# ${label}\n${md} (sample)\n- Gareth keeps the stores here.` }));
  depots.forEach((d) => { link(d, A("jobs")); link(d, A("paperwork")); });
  eng.forEach((e, i) => link(e, depots[i % 5 === 4 ? 1 : 0]));

  const sup = SUPPLIERS.map((name, i) => add({ id: `g:sup:${i}`, label: name, type: "supplier", day: -150, md: `# ${name}\nSupplier (sample). Dot reads their delivery notes and invoices and checks them against jobs.` }));
  sup.forEach((s) => { link(s, A("paperwork")); link(s, A("invoices")); });

  // customers: every contract client, and the homeowners the team reads most
  const cust = live.nodes.filter((n) => n.type === "customer").map((n) => n.id);
  const liveNames = new Set(live.nodes.filter((n) => n.type === "customer").map((n) => n.label.toLowerCase()));
  const clients = [...LETTING.map((n) => [n, "Letting agent"]), ...HOUSING.map((n) => [n, "Housing association"]), ...FM.map((n) => [n, "Facilities management firm"])].slice(0, F.contract_clients);
  clients.forEach(([name, kind], i) => { if (liveNames.has(name.toLowerCase())) return; const id = add({ id: `g:cl:${i}`, label: name, type: "customer", day: day(60, 400), md: `# ${name}\n${kind}, contract client (sample).\n- Theo logs their works orders.\n- Ivy invoices them in a daily batch.\n- Penny knows how they pay.` }); cust.push(id); link(id, A("inbox")); link(id, A("invoices")); if (R() < 0.6) link(id, A("money")); });
  HOMEOWNERS.forEach((name, i) => { const id = add({ id: `g:cust:${i}`, label: name, type: "customer", day: day(20, 170), md: `# ${name}\nHomeowner in ${pick(AREAS)} (sample).\n- Theo answers their emails.\n- Penny knows how they pay.` }); cust.push(id); link(id, A("inbox")); if (R() < 0.45) link(id, A("money")); });

  const props = [...depots];
  for (let i = 0; i < 50; i++) { const addr = `${1 + Math.floor(R() * 120)} ${pick(STREETS)}`; const id = add({ id: `g:prop:${i}`, label: addr, type: "property", day: day(10, 170), md: `# ${addr}, ${pick(AREAS)}\nProperty on file (sample). Access notes, boiler make and last visit live here.` }); props.push(id); link(id, pick(cust)); }
  const jobs = [];
  for (let i = 0; i < 70; i++) { const what = pick(JOBS), p = pick(props.slice(2)), lbl = `${what}, ${nodes.find((n) => n.id === p)?.label || ""}`; const id = add({ id: `g:job:${i}`, label: lbl, type: "job", day: day(0, 120), md: `# ${lbl}\nJob (sample). Planned by Rowan, done by an engineer, invoiced by Ivy.` }); jobs.push(id); link(id, p); link(id, pick(eng)); if (R() < 0.6) link(id, A("jobs")); }
  for (let i = 0; i < 50; i++) { const n = 21000 + i * 37 + Math.floor(R() * 30), amt = Math.round(90 + R() * 2400), j = pick(jobs); const id = add({ id: `g:inv:${i}`, label: `KP-${n} · £${amt.toLocaleString("en-GB")}`, type: "invoice", day: day(0, 100), md: `# Invoice KP-${n}\n£${amt.toLocaleString("en-GB")} (sample). Drafted by Ivy from the job sheet, approved by Priya.` }); link(id, j); link(id, A("invoices")); if (R() < 0.25) link(id, A("money")); }
  for (let i = 0; i < 30; i++) { const t = pick(DOCS); const id = add({ id: `g:doc:${i}`, label: `${t} ${1 + Math.floor(R() * 28)}/${10 + Math.floor(R() * 2)}`, type: "doc", day: day(0, 60), md: `# ${t}\nRead from a photo by Dot (sample). Rows checked against jobs and suppliers.` }); link(id, A("paperwork")); link(id, R() < 0.5 ? pick(sup) : pick(eng)); }
  for (let i = 0; i < 20; i++) { const p = pick(props.slice(2)); const id = add({ id: `g:cert:${i}`, label: `CP12, ${nodes.find((n) => n.id === p)?.label || ""}`, type: "cert", day: day(0, 300), md: `# Gas safety certificate (CP12)\nSample. Dot tracks when it runs out; Theo books the next check before it does.` }); link(id, p); link(id, A("paperwork")); }
  rules.forEach((r, i) => { const id = add({ id: `g:rule:${i}`, label: r.text.length > 60 ? r.text.slice(0, 58) + "…" : r.text, type: "rule", day: r.day_offset ?? -30, md: `# Rule for ${r.agent}\n${r.text}\n\n**Where it came from:** ${r.detail || "a correction"}\n${r.story ? `\n${r.story}` : ""}` }); link(id, A(r.agent)); link(id, A("coach")); });
  // emails fill the rest, so the hologram draws about `shown` notes however many live ones there are today
  const liveNotes = live.nodes.filter((n) => n.type !== "agent").length;
  for (let i = 0, room = shown - liveNotes - nodes.length; i < room; i++) { const t = pick(EMAILS), c = pick(cust); const id = add({ id: `g:mail:${i}`, label: `${t}: ${nodes.find((n) => n.id === c)?.label || live.nodes.find((n) => n.id === c)?.label || "customer"}`, type: "email", day: day(0, 40), md: `# ${t}\nEmail thread (sample). Theo sorted it and drafted the reply.` }); link(id, c); link(id, A("inbox")); }

  // the whole brain: every kind the totals know, and the live-only kinds as drawn
  const drawn = {}; for (const n of [...live.nodes, ...nodes]) if (n.type !== "agent") drawn[n.type] = (drawn[n.type] || 0) + 1;
  const base = brainTotals(model, { liveDocs: live.nodes.filter((n) => n.type === "doc").length });
  const totals = { ...drawn }; for (const [t, v] of Object.entries(base)) totals[t] = Math.max(v, drawn[t] || 0);
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const drawnLinks = links.length + live.links.length;
  const totalLinks = Math.round(Object.entries(totals).reduce((a, [t, v]) => a + (PER[t] ? v * PER[t] : 0), 0)) + live.links.length;
  return { nodes, links, totals, total, totalLinks, shown: liveNotes + nodes.length, drawnLinks };
}
