# The page engine: the weekly runbook

Each Monday a scheduled routine starts a fresh session and follows this file. The job is to find the searches Skales is missing, draft up to 10 pages that answer them, and open **one** pull request for Tom to approve. Tom is the editor. Nothing goes live without his merge.

Read `tools/search-profile.md` first. It holds the identity, the facts bank (the only claims a page may make), the voice, the target searches and the do-not-touch list. Where this file and the profile disagree, the profile wins. Hand edits by Tom win over both.

## 1. Collect

Gather what is available and say plainly in the PR which sources were missing.

- **Search Console** (once Tom has given access). Collect the queries with impressions where the site sits below position 8. Group them by page.
- **The /start check.** Collect the trades and problems people picked, from the lead home once it exists.
- **AI assistants.**
  - Ask each question in the profile's "AI-assistant questions" column with WebSearch.
  - Note whether the answer names Skales Studio, which sites it cites, and what those sites say that this site does not.
- **Competitors.**
  - WebSearch each primary search in the profile.
  - List the pages that rank for it which this site has no equivalent of.
  - Use categories, not names, apart from page builders and directories, as the profile says.

## 2. Decide

Score each gap on two things:

- **How close it is to a buyer.** A trade plus a service beats a general question.
- **How much the facts bank lets us say honestly.**

Drop a gap if any of these is true:

- It needs a claim the bank does not have. List it in the PR as a question for Tom instead.
- It would be a page for a town Tom does not work in.
- It is a one-word swap of an existing page.

Keep the top ten at most. Fewer is fine. A week with nothing worth adding opens no PR, and says so in the report.

## 3. Draft

Every page comes from a data file and an existing template, never hand-written HTML.

| Kind | Where it goes | Template |
|---|---|---|
| A new trade | `data/segments.js` | `tools/pages/segments.js` |
| A comparison | `data/compare.js` | `tools/pages/services.js` (comparePage) |
| A question | `data/faq.js` | `tools/pages/services.js` (faqHub) |
| A note | `data/notes.js` | `tools/pages/notes.js` |
| An automation | `data/automations.js` | `tools/pages/services.js` (autoPage) |

A new kind of page, such as a trade plus a service, needs a new template. Propose it in its own PR first and never mix it into a weekly batch.

Every page must have all of the following:

- A title of 60 characters or fewer.
- A description of 160 characters or fewer.
- One H1.
- Two sentences under the H1 that answer the page's question on their own.
- H2s written as the questions owners ask.
- Links to the matching demos and to its neighbours.
- One action at the end.

Use UK English. Use no prices, no promised results, and no invented numbers, clients or reviews. Demos and films are always labelled fictional.

## 4. Check

1. Run `node tools/build.js`. It must end with `check: 0 problems`. The build fails a page that is a near-copy of another (more than 55% the same five-word runs), and it also checks titles, descriptions, H1s, links, schema and the sitemap.
2. Run `node tools/og.mjs` to render the new share cards. It renders only the missing ones.
3. Run the `seo-geo-ai` skill's checker on the built site, and its citation test on each new page. For every new page, quote the passage an AI engine would cite. If no passage answers the page's question on its own, rewrite the page or drop it.
4. Check each new page at 390px and at 1440px. It must not overflow sideways and must have no console errors.

## 5. Open the pull request

- Branch: `engine/YYYY-MM-DD`, off `main`. If the site pages are not on `main` yet, use the newest open page branch and say so.
- One pull request, titled `Page engine: N pages for the week of D Month`.
- The body, in this order:
  1. A line per page: its address, the search it answers, why it exists (the gap and its source), and the passage an AI engine would quote.
  2. The pages that were considered and dropped, and why.
  3. Questions for Tom: facts the bank lacks that would unlock a page.
  4. The weekly report. Follow a visitor from reach to interest, intent, action and result, using whatever data exists. With no data yet, say which sources are still missing. Never invent a number.
- End the PR body with the attribution lines the session's instructions give.

Never merge. Never touch the do-not-touch list. Never post anything outside the pull request.

## 6. Review old pages (from the fifth week)

Once Search Console data exists, check the pages that are 28 days old or more. List the ones earning no impressions in the PR, each with one suggestion: improve it, or fold it into a stronger page. Do not delete anything without Tom's word.

## Run history

Append one line per run: the date, the pages proposed, the pages merged, and the sources that were missing.

- 2026-10-08: engine set up. The first run is Monday 12 October. Search Console and the lead home are not connected yet.
