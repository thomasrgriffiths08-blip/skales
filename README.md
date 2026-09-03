# The site

Static, hand-built, no dependencies. Every page is generated from a few data files by `tools/build.js`.

## Change something

| Want to… | Edit | Then |
|---|---|---|
| Rename the brand, change the domain, add the WhatsApp number or the Calendly link | `data/site.js` | `node tools/build.js` |
| Add or edit one of the builds (a new channel on the rack) | `data/builds.js` — add an entry with a `slug`, copy the demo into `../showcase/`, run `NODE_PATH=<terser+clean-css dir> node tools/demos.js`, add a still to `assets/stills/NN.webp` | `node tools/build.js && ./tools/og.sh` |
| Add a note | `data/notes.js` — add an entry with `slug`, `date`, `title`, `summary`, `body` | `node tools/build.js && ./tools/og.sh` |
| Change page copy or layout | `tools/pages/*.js` | `node tools/build.js` |
| Change the look | `assets/*.css` | nothing — CSS is served as-is |

Then `git add -A && git commit -m "…" && git push`. GitHub Pages redeploys in about a minute.

## What the build writes

Every page (`index.html`, `work/`, `work/<slug>/`, `what-i-do/`, `why/`, `book/`, `notes/`, `teardown.html`, `404.html`), plus `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, `manifest.webmanifest`, `humans.txt`, `assets/builds.js` and `tools/og-jobs.json` (the list `tools/og.sh` renders into `og/`).

## The demos

`demos/<slug>/index.html` are minified, mangled, comment-stripped copies of the originals in `../showcase/`, locked so they only render when reached from this site. Never edit them by hand; edit the original and re-run `tools/demos.js`. The originals live in the private showcase repo.

## Rules baked in

- Every business, person, review and phone number in the demos is invented. Keep it that way.
- No prices on the site.
- No invented metrics, testimonials or client names anywhere.
- Everything must work with Reduce Motion on (the hero switch and the demos are content, not decoration).
- Check any page at 390px before pushing.
