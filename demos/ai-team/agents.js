// The ten AI employees on the office floor. Ids match the office dashboard and the server.
export const AGENTS = [
  { id: "invoices", name: "Ivy", role: "Invoice clerk", does: "Turns engineers' job sheets into invoices", color: "#2b3445", row: 1 },
  { id: "inbox", name: "Theo", role: "Inbox manager", does: "Reads, sorts and answers the office inbox", color: "#3d3050", row: 1 },
  { id: "jobs", name: "Rowan", role: "Scheduler", does: "Plans the vans and texts everyone their times", color: "#24463b", row: 1 },
  { id: "money", name: "Penny", role: "Credit controller", does: "Chases what's owed, politely", color: "#4d3726", row: 1 },
  { id: "seo", name: "Seren", role: "Search", does: "Finds searches people make that nobody serves well", color: "#1f4f5c", row: 2 },
  { id: "content", name: "Clara", role: "Content", does: "Writes the pages and posts", color: "#4a4630", row: 2 },
  { id: "ads", name: "Archie", role: "Ads", does: "Tests ads, keeps the winners, cuts the rest", color: "#5a2e2e", row: 2 },
  { id: "paperwork", name: "Dot", role: "Paperwork", does: "Turns photos of paperwork into dashboards", color: "#3a4048", row: 2 },
  { id: "manager", name: "Maeve", role: "Manager", does: "Runs the task board and keeps everyone on task", color: "#2c2c30", row: 3 },
  { id: "coach", name: "Kit", role: "Coach", does: "Turns every correction into a rule", color: "#5b4b2a", row: 3 },
];
export const BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
