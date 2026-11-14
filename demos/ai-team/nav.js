// The menu. Six places, then the ten people. Kept short on purpose: a contractor should never wonder where to click.
// `video` is the video in the 12-part series a page is built for (see OFFICE-FLOOR.md).
const I = (d) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICONS = {
  home: I('<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.6"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2"/>'),
  floor: I('<path d="M1.5 6.5 8 2l6.5 4.5v7h-13z"/><path d="M5.5 13.5v-4h5v4"/>'),
  team: I('<circle cx="5.5" cy="5.5" r="2.2"/><circle cx="11" cy="6" r="1.8"/><path d="M1.5 13c.4-2.4 2-3.6 4-3.6s3.6 1.2 4 3.6M10 9.6c2 0 3.6 1 4 3.2"/>'),
  brain: I('<circle cx="4" cy="4" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="7" cy="12" r="1.6"/><circle cx="13" cy="12" r="1.2"/><path d="M5.5 4.3l5 .5M4.7 5.4l1.7 5M11.3 6.4 8 10.7M8.6 12h3.2"/>'),
  numbers: I('<path d="M2 13.5h12"/><rect x="3" y="8" width="2" height="4" rx=".5"/><rect x="7" y="5" width="2" height="7" rx=".5"/><rect x="11" y="2.5" width="2" height="9.5" rx=".5"/>'),
  ask: I('<path d="M2.5 3h11v7.5H7L4 13v-2.5H2.5z"/>'),
};
// the six places
export const PLACES = [
  { id: "home", label: "Home", icon: "home" },
  { id: "floor", label: "Office", icon: "floor" },
  { id: "team", label: "Team", icon: "team", video: 1 },
  { id: "brain", label: "Brain", icon: "brain", video: 2 },
  { id: "overview", label: "Numbers", icon: "numbers" },
  { id: "ask", label: "Ask the team", icon: "ask", video: 10 },
];
// the ten people, and the page each one opens (the original four open their desk in the office)
export const PEOPLE = [
  { agent: "invoices", page: null }, { agent: "inbox", page: null }, { agent: "jobs", page: null }, { agent: "money", page: null },
  { agent: "seo", page: "search", video: 4 }, { agent: "ads", page: "ads", video: 5 }, { agent: "content", page: "content", video: 6 },
  { agent: "paperwork", page: "paperwork", video: 7 }, { agent: "manager", page: "tasks", video: 8 }, { agent: "coach", page: "training", video: 9 },
];
// pages that share a row of tabs at the top
export const SECTIONS = {
  team: [["team", "The team"], ["handoffs", "How work moves"]],
  // site demo: the Costs page carries Tom's prices, so it only shows when config.js allows them
  get numbers() { return [["overview", "Overview"], ...(globalThis.AI_TEAM_SHOW_PRICES ? [["costs", "Costs"]] : []), ["check", "Weekly check"]]; },
};
export const SECTION_OF = { team: "team", handoffs: "team", overview: "numbers", costs: "numbers", check: "numbers" };
// which menu item lights up for each page
export const LIT = { home: "home", floor: "floor", team: "team", handoffs: "team", brain: "brain", overview: "overview", costs: "overview", check: "overview", ask: "ask" };
const LABEL = { home: "Home", floor: "Office", team: "The team", handoffs: "How work moves", brain: "Team brain", ask: "Ask the team", search: "Search", ads: "Ads", content: "Content", paperwork: "Paperwork", tasks: "Task board", training: "Training", overview: "Overview", costs: "Costs", check: "Weekly check" };
export const PAGE_IDS = Object.keys(LABEL);
export const ITEM = Object.fromEntries(PAGE_IDS.map((id) => [id, { id, label: LABEL[id] }]));
