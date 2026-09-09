# The site

Static, hand-built, no dependencies. Every page is generated from a few data files by `tools/build.js`.

## Change something

| Want to… | Edit | Then |
|---|---|---|
| Rename the brand, change the domain, add the WhatsApp number or the Calendly link | `data/site.js` | `node tools/build.js` |
| Add a build | Build it against `../showcase/briefs/SPEC.md` (+ a per-build brief), then `node tools/ingest.js` — it validates the meta and copies it into `data/builds/` | `python3 tools/phones.py NN` (the phone still every tile uses) · `NODE_PATH=<terser+clean-css dir> node tools/demos.js` · `node tools/build.js && ./tools/og.sh` |
| Edit one of the original sixteen | `data/builds.js` | same as above |
| Add a note | `data/notes.js` — add an entry with `slug`, `date`, `title`, `summary`, `body` | `node tools/build.js && ./tools/og.sh` |
| Change page copy or layout | `tools/pages/*.js` | `node tools/build.js` |
| Change the look | `assets/*.css` | nothing — CSS is served as-is |

Then `git add -A && git commit -m "…" && git push`. GitHub Pages redeploys in about a minute.

## What the build writes

Every page (`index.html`, `work/`, `work/<slug>/`, `what-i-do/`, `why/`, `book/`, `notes/`, `teardown.html`, `404.html`), plus `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, `manifest.webmanifest`, `humans.txt`, `assets/builds.js` and `tools/og-jobs.json` (the list `tools/og.sh` renders into `og/`).

## The lanes

Every build belongs to a lane. Websites: **loud** (kinetic, type as image), **motion** (the page is the film), **quiet** (plain, calm, expensive), **direct** (conversion first, for trades). Tools: **broad** (any service business) or **specific** (one trade's day). The gallery, the Websites and Tools pages, the thumbnails, the footer and the case pages all group by lane, so a new build only needs the right `lane` in its JSON. New builds are also written to a brief first: see `../showcase/briefs/SPEC.md` and the per-build sheets there.

## The demos

`demos/<slug>/index.html` are minified, mangled, comment-stripped copies of the originals in `../showcase/`, locked so they only render when reached from this site. Never edit them by hand; edit the original and re-run `tools/demos.js`. The originals live in the private showcase repo.

## Rules baked in

- Every business, person, review and phone number in the demos is invented. Keep it that way.
- No prices on the site.
- No invented metrics, testimonials or client names anywhere.
- Everything must work with Reduce Motion on (the hero switch and the demos are content, not decoration).
- Check any page at 390px before pushing.

## Checking it before you push

```bash
python3 ~/.claude/skills/deslop/scripts/deslop_check.py .            # the 22-point ship check
python3 ~/.claude/skills/deslop/scripts/phone_check.py . / /work/ /book/   # a TRUE 390px viewport
```

The phone check exists because headless Chrome cannot render a layout viewport below about 500px: a `--window-size=390` screenshot is a crop of a 500px render, so it looks right while the real phone layout is untested. The script frames each page in a 390px same-origin iframe instead. `@media(pointer:coarse)` also never matches in headless, so tap-target rules are written by width as well.
