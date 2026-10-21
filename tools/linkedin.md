# LinkedIn: the profile kit

Everything for Tom's personal profile and the Skales Studio Company Page, ready to paste. Every claim comes from the facts bank in `tools/search-profile.md`; the same rules apply here (no prices, no invented numbers, clients or reviews, UK English, first person, no exclamation marks). Each text block is under LinkedIn's limit for that field.

Files:
- `og/linkedin-banner.png`: profile banner, 1584 × 396.
- `og/linkedin-cover.png`: Company Page cover, 1512 × 256 (same ratio as the older 1128 × 191, so it fits either spec).
- `og/icon.png`: Company Page logo, 512 × 512.
- Re-render the banners with `./tools/og.sh` (source: `tools/linkedin.html`).

Site address: until skales.studio points here, every link below uses the github.io address. On launch day, swap them on LinkedIn too (contact info, Featured, the Company Page website).

## The order of work (only Tom can do these)

1. Sign up at linkedin.com with an email you will always control. Turn on two-step verification straight away (Settings → Sign in & security).
2. Add a real photo (see Photo below). The About-page portrait in `PLAN.md` can be the same shoot.
3. Fill in the profile from this file, top to bottom.
4. Set the custom URL and make the profile public (see Settings).
5. Verify your identity. It is free and adds the badge (LinkedIn prompts for it on your profile; it uses a passport or driving licence).
6. Create the Skales Studio Company Page, then edit your Experience entry and pick it from the dropdown so the logo shows instead of a grey square. LinkedIn sometimes blocks Page creation on a brand-new account; if so, finish the profile, connect with people you know and try again a few days later.
7. Put both URLs in `data/site.js` (`linkedin`, `linkedinPage`) and run `node tools/build.js`. They then appear in the footer, in `llms.txt` and in the schema `sameAs`, which tells search engines the profile, the Page and the site are the same person and business.
8. Post the first post (below), then one a week alongside the Instagram build.
9. Start connecting, fifteen minutes a weekday (see "Getting work from it").
10. Turn on Open to work for recruiters only (see "Open to a job as well").

---

## Personal profile

### Intro

| Field | Value |
|---|---|
| First name / Last name | Tom / Griffiths. LinkedIn's rules: real name only, no titles or emoji in the name field. |
| Additional name | Thomas (optional; helps searches for "Thomas Griffiths" find you, matching the site schema) |
| Pronouns | Your call |
| Current position | Founder, web designer & developer at Skales Studio (tick "show current company in my intro") |
| Industry | IT Services and IT Consulting |
| Location | United Kingdom, plus your town or nearest city. This matters more than it looks: local owners filter search by location, and Services-page requests are matched by it. |

### Headline (limit 220; the first ~60 characters are all many views show, so they say what you do)

LinkedIn people-search matches on the headline and the current job title, so both carry the words clients and recruiters actually type: "web designer" and "web developer".

Recommended:

```text
Web designer for UK trades and service businesses | Websites, online booking and follow-up automation | Founder, Skales Studio
```

Alternative, if you want the ads in:

```text
Web designer & developer | Websites, booking and follow-up automation for UK service businesses, plus the Meta and Google ads that point at them | Founder, Skales Studio
```

### Custom URL

Try in this order: `linkedin.com/in/tomgriffiths-skales`, `linkedin.com/in/tom-griffiths-skales`, `linkedin.com/in/tomgriffithsuk`.

### Contact info

| Field | Value |
|---|---|
| Website (Company) | https://thomasrgriffiths08-blip.github.io/skales/ |
| Website (Portfolio) | https://thomasrgriffiths08-blip.github.io/skales/work/ |
| Website (Other) | https://www.instagram.com/tomxsystems/ |
| Email | thomasrgriffiths08@gmail.com (or hello@skales.studio once it forwards) |

### About (limit 2,600; the first two or three lines show before "see more")

```text
I build websites, online booking and follow-up automation for UK service businesses: plumbers, heating engineers, electricians, roofers, kitchen fitters, landscapers, cleaners, salons, and anyone whose work comes in by phone.

Work leaks out of a service business in small, quiet ways: a call nobody answers, a quote nobody chases, a happy customer nobody asks for a review. I build the system that catches each one.

What I build
• Websites that turn a visit into a name and a number. Hand-coded, with no page builder and no theme.
• Online booking with deposits, a CRM with every enquiry in it, and quotes that chase themselves.
• Follow-up that runs on its own: missed-call text-back, review requests, service reminders, on-my-way texts.
• Facebook, Instagram and Google ads that point at all of it, with the ad accounts set up in your name.

How it works
1. Free teardown. I look at your website, your Google listing and what happens when someone tries to reach you, then send you three things: what is leaking, what to fix first, and what it is worth in jobs.
2. A flat quote after a short call, agreed before anything starts.
3. Built in public. A website on its own takes days; a full system with booking and follow-up usually takes one to two weeks.
4. Handover. Your domain, code and accounts are in your name from day one. Nothing is rented back to you monthly.

Skales Studio is one person. The person you message is the person who builds it.

Thirty-six working builds run live on the site, each for an invented business, so no client's numbers are ever on show. Open any of them and use it. I build one new system a week in public on Instagram (@tomxsystems).

Run a service business? Book a call or ask for the free teardown. The links are in Featured, just below.
```

The build count goes up every week; update "Thirty-six" here, in Experience and on the Company Page when the site's number changes.

**Top skills** (the five pinned under About): Web Design · Web Development · Marketing Automation · Google Ads · Social Media Advertising.

### Featured (in this order; each pulls the page's own OG card as its picture)

1. Book a call: https://thomasrgriffiths08-blip.github.io/skales/book/
2. Free teardown: https://thomasrgriffiths08-blip.github.io/skales/teardown.html
3. Try it live: https://thomasrgriffiths08-blip.github.io/skales/try/
4. All the builds: https://thomasrgriffiths08-blip.github.io/skales/work/
5. Later, swap in your best-performing post.

### Experience

| Field | Value |
|---|---|
| Title | Founder, web designer & developer (not just "Founder & builder": the title is what search matches) |
| Employment type | Self-employed |
| Company | Skales Studio (pick the Company Page once it exists) |
| Dates | [month] 2026 to present |
| Location | United Kingdom · Remote |
| Skills | Web Design, Web Development, Marketing Automation, Google Ads, Social Media Advertising |
| Media | Links to /work/ and /try/ |

Description (limit 2,000):

```text
One-person studio. I build websites, online booking with a CRM, and follow-up automation for UK service businesses, and run the Meta and Google ads that point at them.

• Every build is hand-coded in HTML, CSS and plain JavaScript: no framework, no page builder, no theme.
• Thirty-six working demonstration builds run live on the site: quote engines, dispatch boards, booking with deposits, missed-call text-back, review requests, boiler-service and MOT reminders. Every business in them is fictional.
• One new system a week, built in public on Instagram.
• Clients own their domain, code and accounts from day one. Ad accounts are set up in the client's name.
• Every job is quoted flat after a short call and agreed before anything starts.
```

Add any earlier jobs and your education as they really were. A short honest history beats a padded one.

### Services page ("Open to" → "Providing services")

- **Services** (pick the closest from LinkedIn's list, up to 10): Web Design, Web Development, Custom Software Development, Search Engine Optimization (SEO), Digital Marketing, Advertising, Social Media Marketing, Search Engine Marketing (SEM).
- **Location:** tick "available to work remotely", plus your area.
- **Pricing:** leave blank. No prices, same as the site.
- **Reviews:** this is where the first real client reviews can live. Only ever ask real clients.

Description (keep under 500):

```text
Websites, online booking and follow-up automation for UK service businesses, plus the Meta and Google ads that point at them. Hand-coded, with no page builder and no theme. You own the domain, code and accounts from day one. A website on its own takes days; a full system with booking and follow-up usually takes one to two weeks. Every job is quoted flat after a short call. Start with the free teardown: three findings on your website and Google listing, sent by message.
```

### Skills (add these; skip any LinkedIn's autocomplete does not offer)

Web Design · Web Development · Front-End Development · JavaScript · HTML5 · Cascading Style Sheets (CSS) · Responsive Web Design · Marketing Automation · Customer Relationship Management (CRM) · Google Ads · Facebook Ads · Social Media Advertising · Search Engine Optimization (SEO) · Local SEO · Conversion Rate Optimization · Lead Generation · Small Business Marketing

### Photo

A real, recent photo of just you: face about 60% of the frame, head centred (LinkedIn crops it to a circle), plain background, daylight, looking at the camera. At least 400 × 400. Set its visibility to public. No logo in place of a face; the logo goes on the Company Page.

### Banner

Upload `og/linkedin-banner.png`. The left side is left empty on purpose: your photo sits over the bottom-left on desktop and on the phone app.

### Settings

- Settings → Visibility → Edit your public profile: public visibility on, set the custom URL here.
- Profile photo visibility: public.
- Two-step verification: on.
- Premium is not needed for any of this.

---

## Company Page: Skales Studio

| Field | Value |
|---|---|
| Page type | Company |
| Name | Skales Studio (the full name, so search engines don't confuse it with the SKALE crypto network) |
| LinkedIn URL | `linkedin.com/company/skales-studio` (fallback `skalesstudio`) |
| Website | https://thomasrgriffiths08-blip.github.io/skales/ |
| Industry | IT Services and IT Consulting |
| Organisation size | 0–1 employees |
| Organisation type | Sole proprietorship if you trade as a sole trader; Privately held if Skales Studio is a limited company |
| Logo | `og/icon.png` |
| Cover | `og/linkedin-cover.png` |
| Location | Your town |
| Founded | 2026 |
| Button | Contact us → https://thomasrgriffiths08-blip.github.io/skales/book/ |

Tagline (limit 120):

```text
Websites, booking and follow-up automation for UK service businesses. Hand-built, owned by you.
```

Overview (limit 2,000):

```text
Skales Studio builds websites, online booking with a CRM, and follow-up automation for UK service businesses, and runs the Facebook, Instagram and Google ads that point at them. Mostly trades and local operators: plumbers, heating engineers, electricians, roofers, kitchen fitters, landscapers, cleaners and salons.

It is one person, Tom Griffiths. The person you message is the person who builds it.

• Websites that turn a visit into a name and a number. Hand-coded, with no page builder and no theme.
• Online booking with deposits, a CRM with every enquiry in it, and quotes that chase themselves.
• Follow-up that runs on its own: missed-call text-back, review requests, service reminders, on-my-way texts.
• Meta and Google ads, with the ad accounts set up in the client's name.

Clients own their domain, code and accounts from day one; nothing is rented back to them monthly. Every job is quoted flat after a short call and agreed before anything starts.

Thirty-six working demonstration builds run live on the website, every one for an invented business, and one new system a week is built in public on Instagram (@tomxsystems).
```

Specialties: Websites for service businesses · Online booking systems · CRM for trades · Follow-up automation · Missed-call text-back · Review request automation · Service reminders · Facebook and Instagram ads · Google Ads · Local SEO · Hand-coded websites

---

## Posting

### The first post

```text
I run Skales Studio. I build websites, online booking and follow-up automation for UK service businesses: the plumbers, electricians, roofers, salons and clinics whose work comes in by phone.

Three rules I build to:

1. You own it. The domain, the code and every account sit in your name from day one. Nothing is rented back to you monthly.
2. One person. The person you message is the person who builds it.
3. Proof, not promises. Thirty-six working builds run live on my site, each for an invented business so no client's numbers are on show. Open any of them and use it.

I build one new system a week in public, and I'll post each one here.

If you run a service business, or know someone who does, I'll look at the website, the Google listing and what happens when someone tries to get in touch, and send back three things: what is leaking, what to fix first, and what it is worth in jobs. Free.

https://thomasrgriffiths08-blip.github.io/skales/teardown.html
```

### Every week: the build

```text
This week's build: [name]. [The one-line hook from its /work/ page.]

[Two or three lines: the problem it fixes, in the words an owner would use.]

Fictional business, illustrative numbers, real software. Try it: [link to its /work/<slug>/ page]
```

A second post each week can come straight from `/notes/` or the topics list in `PLAN.md` (what a missed call costs, how to ask for a review without begging, what a tradesperson's website actually needs). Write it as the answer, not a link to the answer; put the link at the end.

---

## Getting work from it

The profile gets you found. The work comes from who you connect with and what you say to them after.

### Who to connect with, in order

1. **People you already know.** Friends, family, old colleagues, school and college. They are the warmest source of introductions, and a profile with a few hundred real connections looks established to everyone else.
2. **Referral partners: people who already serve the businesses you build for.** Accountants and bookkeepers with trade clients, trade-merchant branch managers, business coaches for trades, sign writers and van-wrap firms, local photographers, chamber of commerce and business-network organisers, and other web designers and agencies who turn down small jobs. They are on LinkedIn far more than tradespeople are, and one of them can send you several clients.
3. **The businesses that live on LinkedIn.** Accountants, solicitors, architects, mortgage brokers, estate and letting agents, clinics, dental practices. The site already has a page for each (`/for/<trade>/`), so link the right one when you talk to them.
4. **Trade firms big enough to have an office.** Owners, directors, and office or operations managers at firms with a few vans. The one-van tradesperson is rarely on LinkedIn; the person running the office often is.

Find them with people search: keywords like `owner plumbing`, `director electrical`, `practice manager`, `bookkeeper`, then filter Locations to your area. Local first: a business twenty minutes away is far more likely to say yes.

### The numbers that keep the account safe

- A free account gets about **five personalised invite notes a month**, each **up to 200 characters**. Spend them on referral partners and anyone you have a reason to know. Everyone else: send the invite without a note, then message after they accept (messaging a connection is free).
- Keep to about **10 targeted invites a weekday**. A new account is restricted somewhere around 80 to 100 a week, and lots of ignored invites count against you. Withdraw any still pending after three weeks.
- Never use connection or messaging automation tools, engagement pods or bought followers. They break LinkedIn's terms and get accounts restricted.

### What to say

Invite note to a referral partner (under 200):

```text
Hi [name], I build websites and booking systems for UK trades and service businesses. Plenty of your clients will be the people I work with, so it seemed worth connecting. Tom
```

After a business owner accepts (no pitch until they say yes):

```text
Thanks for connecting, [name]. I build websites, online booking and follow-up for businesses like yours. If it's useful, I'll look at your website and Google listing and send back three things: what's leaking, what to fix first, and what it's worth in jobs. Free, no call needed. Want me to?
```

To people you know:

```text
I've started Skales Studio: I build websites, online booking and follow-up automation for service businesses. If you know a tradesperson or small business owner whose website is letting them down, I'd be grateful for an introduction.
```

One follow-up a week later if there's no reply, then leave it. When someone says yes to the teardown, do it properly; it is the best thing you have to show them.

### Fifteen minutes a weekday

1. Reply to every message and comment first.
2. Comment on three to five posts from referral partners and target businesses. A useful sentence, not "great post".
3. Send about ten targeted invites.
4. Monday: post the week's build. Thursday: one short post from the notes.

### Proof

- Ask two or three people who have seen your work for a LinkedIn recommendation. Real people only.
- When the first real clients exist, ask them for a review on your Services page. That is where clients compare providers.
- Once a month, check Profile views and Search appearances (it shows the keywords people found you by) and adjust the headline if the right words are missing.

---

## Open to a job as well (clients first)

Clients come first, so the public profile stays entirely about them. Nothing visible says you are looking: a client who reads "open to new roles" wonders whether you will be around to finish their build. The job side runs quietly underneath:

- **Open to → Finding a new job**, visibility **Recruiters only**. Only people using LinkedIn's recruiter tools see it, and the green frame never appears on your photo. Job titles: Web Developer, Front-End Developer, Web Designer, JavaScript Developer. Location: your area, plus remote.
- **Keep the client headline.** Recruiters search job titles and skills, and the profile already carries both: "web designer" and "web developer" in the headline and title, HTML, CSS and JavaScript in Experience and Skills.
- **Leave Featured in the client order.** All the builds is already in it, and it is the first thing a recruiter clicks.
- When you apply, message the hiring manager or someone on the team with one line on why, and a link to the build closest to their work. That message is where you say you are looking, not the profile.

If a job ever becomes the priority, swap to this headline and move All the builds to the top of Featured:

```text
Web Developer | JavaScript, HTML, CSS | Websites, booking systems and automation for service businesses | Founder, Skales Studio
```
