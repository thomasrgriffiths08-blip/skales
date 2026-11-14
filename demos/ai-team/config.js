/* Kingpost AI team: the public demo's switches. Kingpost is a sample company; every figure is sample data.

   AI_TEAM_STATIC: there is no server here. Everything the app reads comes from ./data (snapshots of Tom's local app
   taken right after a reset), and every step that would call Claude opens a "this runs live on a call" sheet instead.

   AI_TEAM_SHOW_PRICES: Tom's real prices (the setup fee, the monthly fee, payback, the weekly running cost and the
   Costs page) are NOT approved for publishing. While this is false they are hidden everywhere on screen, and the
   figures themselves are not shipped at all: they live in data/prices.json, which is deliberately left out of the site.
   To show them: set this to true AND put data/prices.json back (model.costs, model.month.management/total and
   pages.costs from the local app's /api/floor/state). Without the file the page carries on with prices hidden. */
window.AI_TEAM_STATIC = true;
window.AI_TEAM_SHOW_PRICES = false;
