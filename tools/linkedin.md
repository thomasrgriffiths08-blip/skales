# LinkedIn: the profile kit

Everything for Tom's personal profile and the Skales Studio Company Page, ready to paste. Every claim comes from the facts bank in `tools/search-profile.md`; the same rules apply here (no prices, no invented numbers, clients or reviews, UK English, first person, no exclamation marks). Each text block is under LinkedIn's limit for that field.

Files:
- `og/linkedin-banner.png`: profile banner, 1584 × 396.
- `og/linkedin-cover.png`: Company Page cover, 1512 × 256 (same ratio as the older 1128 × 191, so it fits either spec).
- `og/linkedin-logo.png`: Company Page logo, 400 × 400 (the skales wordmark with "studio" beneath; rendered from `tools/logo.html?v=word`).
- Re-render the banners with `./tools/og.sh` (source: `tools/linkedin.html`).

Site address: every link below uses https://skales.studio. They work once the domain's DNS points at GitHub Pages (four A records to 185.199.108–111.153 and a CNAME for www to thomasrgriffiths08-blip.github.io), so do that before adding links on LinkedIn.

## The order of work (only Tom can do these)

1. Sign up at linkedin.com with an email you will always control. Turn on two-step verification straight away (Settings → Sign in & security).
2. Add a real photo (see Photo below). The About-page portrait in `PLAN.md` can be the same shoot.
3. Fill in the profile from this file, top to bottom.
4. Set the custom URL and make the profile public (see Settings).
5. Verify your identity. It is free and adds the badge (LinkedIn prompts for it on your profile; it uses a passport or driving licence).
6. Create the Skales Studio Company Page, then edit your Experience entry and pick it from the dropdown so the logo shows instead of a grey square. LinkedIn sometimes blocks Page creation on a brand-new account; if so, finish the profile, connect with people you know and try again a few days later.
7. Put both URLs in `data/site.js` (`linkedin`, `linkedinPage`) and run `node tools/build.js`. They then appear in the footer, in `llms.txt` and in the schema `sameAs`, which tells search engines the profile, the Page and the site are the same person and business.
8. Post the first post (below), then one a week alongside the Instagram build.
9. Start connecting, twenty minutes a weekday (see "The fast-growth plan").
10. Turn on Open to work for recruiters only (see "Open to a job as well").

Anything that shows a link preview (Featured links, a post with a link) waits until skales.studio serves the site. LinkedIn takes the preview picture the first time it sees a link and keeps it, so adding one while the domain still shows a holding page saves that page as the picture. If one slips through, paste the link into linkedin.com/post-inspector to refresh it. Plain link fields (contact info, the Company Page website and button) are fine to fill in early.

---

## Personal profile

### Intro

| Field | Value |
|---|---|
| First name / Last name | Tom / Griffiths. LinkedIn's rules: real name only, no titles or emoji in the name field. |
| Additional name | Thomas (optional; helps searches for "Thomas Griffiths" find you, matching the site schema) |
| Pronouns | Your call |
| Current position | Founder · Ads, landing pages & web design at Skales Studio (tick "show current company in my intro") |
| Industry | Marketing Services |
| Location | United Kingdom, plus your town or nearest city. This matters more than it looks: local owners filter search by location, and Services-page requests are matched by it. |

### Headline (limit 220; the first ~60 characters are all many views show, so they say what you do)

LinkedIn people-search matches on the headline and the current job title, so both carry the words owners actually type: "Facebook ads", "Google ads", "landing pages". The job title keeps "web design" for recruiter searches.

Recommended:

```text
Facebook & Google ads, landing pages and follow-up for UK trades and service businesses | The whole funnel, built by one person | Founder, Skales Studio
```

Alternative, more local:

```text
Ads, landing pages and lead follow-up for West London trades | Meta & Google ads, websites, booking and CRM | Founder, Skales Studio
```

### Custom URL

Try in this order: `linkedin.com/in/tomgriffiths-skales`, `linkedin.com/in/tom-griffiths-skales`, `linkedin.com/in/tomgriffithsuk`.

### Contact info

| Field | Value |
|---|---|
| Website (Company) | https://skales.studio/ |
| Website (Portfolio) | https://skales.studio/work/ |
| Website (Other) | https://www.instagram.com/tomxsystems/ |
| Email | thomasrgriffiths08@gmail.com (or hello@skales.studio once it forwards) |

### About (limit 2,600; the first two or three lines show before "see more")

```text
I build the whole marketing funnel for UK service businesses: the Facebook, Instagram and Google ads, the landing page they click through to, and the booking and follow-up that turn an enquiry into a job. Plumbers, electricians, roofers, builders, salons, and anyone whose work comes in by phone.

An ad that points at a page built to take no enquiry wastes the click. An enquiry nobody follows up wastes the ad. Each step only pays if the next one works, so I build every step as one system.

The funnel
• Ads: Facebook, Instagram and Google search ads, and Local Services Ads where the trade qualifies. The ad accounts are set up in your name.
• Landing pages: one page per offer, built to turn a click into a name and a number. Hand-coded and fast, with no page builder and no theme.
• Booking and CRM: slots customers take themselves, deposits that hold them, and every enquiry in one place with what happened to it.
• Follow-up that runs on its own: missed-call text-back, quote chasing, review requests, service reminders.

How it works
1. Free teardown. I look at your ads, your website, your Google listing and what happens when someone tries to reach you, then send you three things: what is leaking, what to fix first, and what it is worth in jobs.
2. A flat quote after a short call, agreed before anything starts.
3. Built in public. A website on its own takes days; a full system with booking and follow-up usually takes one to two weeks.
4. Handover. The ad accounts, domain, code and every other account are in your name from day one. Nothing is rented back to you monthly.

Skales Studio is one person. The person you message is the person who builds it.

Thirty-six working builds run live on the site, each for an invented business, so no client's numbers are ever on show. Open any of them and use it. I build one new system a week in public on Instagram (@tomxsystems).

Run a service business? Book a call or ask for the free teardown. The links are in Featured, just below.
```

The build count goes up every week; update "Thirty-six" here, in Experience and on the Company Page when the site's number changes.

**Top skills** (the five pinned under About): Facebook Ads · Google Ads · Landing Page Optimization · Web Design · Marketing Automation.

### Featured (in this order; each pulls the page's own OG card as its picture)

1. Book a call: https://skales.studio/book/
2. Free teardown: https://skales.studio/teardown.html
3. Try it live: https://skales.studio/try/
4. All the builds: https://skales.studio/work/
5. Later, swap in your best-performing post.

### Experience

| Field | Value |
|---|---|
| Title | Founder · Ads, landing pages & web design (not just "Founder & builder": the title is what search matches) |
| Employment type | Self-employed |
| Company | Skales Studio (pick the Company Page once it exists) |
| Dates | [month] 2026 to present |
| Location | United Kingdom · Remote |
| Skills | Facebook Ads, Google Ads, Landing Page Optimization, Web Design, Marketing Automation |
| Media | Links to /work/ and /try/ |

Description (limit 2,000):

```text
One-person studio. I build the whole marketing funnel for UK service businesses: Meta and Google ads, the landing pages they point at, and the online booking, CRM and follow-up automation behind them.

• Ads run in the client's own ad accounts and point at landing pages built for one job: turning a click into an enquiry.
• Every build is hand-coded in HTML, CSS and plain JavaScript: no framework, no page builder, no theme.
• Thirty-six working demonstration builds run live on the site: quote engines, dispatch boards, booking with deposits, missed-call text-back, review requests, boiler-service and MOT reminders. Every business in them is fictional.
• One new system a week, built in public on Instagram.
• Clients own their ad accounts, domain, code and every other account from day one.
• Every job is quoted flat after a short call and agreed before anything starts.
```

Add any earlier jobs and your education as they really were. A short honest history beats a padded one.

### Services page ("Open to" → "Providing services")

- **Services** (pick the closest from LinkedIn's list, up to 10): Advertising, Digital Marketing, Search Engine Marketing (SEM), Social Media Marketing, Lead Generation, Web Design, Web Development, Search Engine Optimization (SEO).
- **Location:** tick "available to work remotely", plus your area.
- **Pricing:** leave blank. No prices, same as the site.
- **Reviews:** this is where the first real client reviews can live. Only ever ask real clients.

Description (keep under 500):

```text
The whole marketing funnel for UK service businesses: Facebook, Instagram and Google ads, landing pages built to turn a click into an enquiry, and the booking and follow-up that turn an enquiry into a job. The ad accounts, domain and code are yours from day one. Hand-coded, with no page builder. Every job is quoted flat after a short call. Start with the free teardown: three findings on your ads, website and Google listing, sent by message.
```

### Skills (add these; skip any LinkedIn's autocomplete does not offer)

Facebook Ads · Google Ads · Pay Per Click (PPC) · Social Media Advertising · Landing Page Optimization · Conversion Rate Optimization · Lead Generation · Marketing Automation · Customer Relationship Management (CRM) · Small Business Marketing · Web Design · Web Development · Front-End Development · JavaScript · HTML5 · Cascading Style Sheets (CSS) · Responsive Web Design · Search Engine Optimization (SEO) · Local SEO

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
| Website | https://skales.studio/ |
| Industry | Marketing Services |
| Organisation size | 0–1 employees |
| Organisation type | Sole proprietorship if you trade as a sole trader; Privately held if Skales Studio is a limited company |
| Logo | `og/linkedin-logo.png` |
| Cover | `og/linkedin-cover.png` |
| Location | Your town |
| Founded | 2026 |
| Button | Contact us → https://skales.studio/book/ |

Tagline (limit 120):

```text
Ads, landing pages and follow-up for UK service businesses. The whole funnel, owned by you.
```

Overview (limit 2,000):

```text
Skales Studio builds the whole marketing funnel for UK service businesses: the Facebook, Instagram and Google ads, the landing pages they point at, and the online booking and follow-up that turn an enquiry into a job. Mostly trades and local operators: plumbers, heating engineers, electricians, roofers, kitchen fitters, landscapers, cleaners and salons.

It is one person, Tom Griffiths. The person you message is the person who builds it.

• Ads: Facebook, Instagram and Google search ads, and Local Services Ads where the trade qualifies, in the client's own ad accounts.
• Landing pages: one page per offer, built to turn a click into a name and a number. Hand-coded, with no page builder and no theme.
• Booking and CRM: slots customers take themselves, deposits that hold them, and every enquiry in one place.
• Follow-up that runs on its own: missed-call text-back, quote chasing, review requests, service reminders.

Clients own their ad accounts, domain, code and every other account from day one; nothing is rented back to them monthly. Every job is quoted flat after a short call and agreed before anything starts.

Thirty-six working demonstration builds run live on the website, every one for an invented business, and one new system a week is built in public on Instagram (@tomxsystems).
```

Specialties: Facebook and Instagram ads · Google Ads · Local Services Ads · Landing pages · Lead generation for trades · Online booking systems · CRM for trades · Follow-up automation · Missed-call text-back · Review request automation · Hand-coded websites

---

## Posting

### The first post

```text
I run Skales Studio in West London. I build the whole marketing funnel for service businesses: the Facebook and Google ads, the landing page they click through to, and the booking and follow-up behind it.

Why the whole funnel: an ad that points at a page built to take no enquiry wastes the click, and an enquiry nobody follows up wastes the ad. Each step only pays if the next one works.

Three rules I build to:

1. You own it. The ad accounts, the domain, the code: all in your name from day one. Nothing is rented back to you monthly.
2. One person. The person you message is the person who builds it.
3. Proof, not promises. Thirty-six working builds run live on my site, each for an invented business so no client's numbers are on show. Open any of them and use it.

I build one new system a week in public, and I'll post each one here.

If you run a service business round West London, or know someone who does, I'll look at the ads, the website and what happens when someone tries to get in touch, and send back three things: what is leaking, what to fix first, and what it is worth in jobs. Free.

https://skales.studio/teardown.html
```

### Every week: the build

```text
This week's build: [name]. [The one-line hook from its /work/ page.]

[Two or three lines: the problem it fixes, in the words an owner would use.]

Fictional business, illustrative numbers, real software. Try it: [link to its /work/<slug>/ page]
```

A second post each week can come straight from `/notes/` or the topics list in `PLAN.md` (what a missed call costs, how to ask for a review without begging, what a tradesperson's website actually needs). Write it as the answer, not a link to the answer; put the link at the end.

---

## The fast-growth plan (first 90 days)

LinkedIn grows fastest when the profile is finished before anyone sees it, the first connections are people who already know you, and every weekday has the same short routine. In this order:

### Week 1: finish the profile, then switch on

1. Finish everything before you invite anyone: photo, banner, Experience, About, Featured, custom URL, Services page. Invites from a profile with no photo mostly get ignored.
2. Verify your identity (the badge next to your name). It is free, takes minutes, and makes strangers more likely to accept.
3. Connect with everyone you already know. My Network → import your Gmail contacts, and tick people one by one rather than inviting the whole address book. Then old colleagues, school, college, friends and family.
4. Ask two or three people who have seen your marketing work for a recommendation. Real people only.
5. Post the introduction once you have 50 or more connections, so it has people to reach.

### Weeks 2 to 4: twenty minutes a weekday

- **15 targeted invites** from the tracker and referral partners (75 a week, under the limit a new account gets). If fewer than half are accepted, drop to 10 and tighten the targeting.
- **10 useful comments** on posts by West London business owners, trade suppliers, accountants and local business networks. While your own audience is small, your comments on other people's posts are how most people will first see you.
- **Message everyone who accepts**, from the tracker. One follow-up a week later, then stop.
- **Post twice a week** (the Monday task writes them) and reply to every comment on the day.

### Months 2 and 3: turn attention into calls

- Once a fortnight, post the offer straight: free funnel teardowns for five West London service businesses this week, comment or message to claim one. Every comment is a warm lead and pushes the post further. Deliver every one you promise.
- Post short phone videos of builds working. A real thing working on screen is the clearest proof you have.
- Join local business groups on LinkedIn, and go in person to the local chamber of commerce and business networking breakfasts. Connect with everyone you meet the same day.
- End every teardown that lands well with the offer of a short call, booked on your Calendly link.

### Going after the big contracts

A full funnel (ads, landing pages, booking and follow-up) is a bigger job than a website, and the businesses that can fund it look different from a one-van sole trader. They are also the ones whose decision makers are on LinkedIn.

- **Who:** trade firms with a few vans and an office (heating, electrical, roofing, building, extensions, kitchens and bathrooms, windows, solar and heat pumps), plus estate agents, dental practices, private clinics, solicitors, accountants and commercial cleaners. Signs they can pay: a limited company trading a few years, a team, plenty of reviews, ad tracking already on the site, high-ticket or commercial work.
- **The tracker ranks them:** A-list means the biggest contract potential and a clear need. The Monday run writes an A-lister's teardown in advance, so your first message can say it is already done.
- **The A-list routine:** follow their Company Page and the director, comment usefully on something they posted, then connect. After they accept, offer the teardown. Send it, then offer a 20-minute call to walk through it.
- **The call:** go through the teardown on screen, ask what a job is worth to them and how many they could take on, then send a written proposal within a day.
- **Later, not now:** LinkedIn Sales Navigator (paid) adds filters for company size and job title, and messages to people you are not connected with. It is worth a look once the first contract is signed.

### What to count each month

Connections, how many invites are accepted, replies to your after-accept message, teardowns sent, calls booked, clients won. The tracker counts most of these for you.

### What gets accounts restricted

Automation tools, bought followers or engagement pods, much more than 100 invites a week, and the same pitch pasted to people who never connected with you.

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
- Keep to **10 to 15 targeted invites a weekday**. A new account is restricted somewhere around 80 to 100 a week, and lots of ignored invites count against you. Withdraw any still pending after three weeks.
- Never use connection or messaging automation tools, engagement pods or bought followers. They break LinkedIn's terms and get accounts restricted.

### What to say

Invite note to a referral partner (under 200):

```text
Hi [name], I build ads, landing pages and follow-up for UK trades and service businesses. Plenty of your clients will be the people I work with, so it seemed worth connecting. Tom
```

After a business owner accepts (no pitch until they say yes):

```text
Thanks for connecting, [name]. I build the whole funnel for businesses like yours: the ads, the landing page and the follow-up. If it's useful, I'll look at your website, your Google listing and any ads you're running, and send back three things: what's leaking, what to fix first, and what it's worth in jobs. Free, no call needed. Want me to?
```

To people you know:

```text
I've started Skales Studio: I build ads, landing pages and follow-up for service businesses. If you know a tradesperson or small business owner who wants more enquiries, I'd be grateful for an introduction.
```

One follow-up a week later if there's no reply, then leave it. When someone says yes to the teardown, do it properly; it is the best thing you have to show them.

### Twenty minutes a weekday

1. Reply to every message and comment first.
2. Comment on three to five posts from referral partners and target businesses. A useful sentence, not "great post".
3. Send 10 to 15 targeted invites.
4. Monday: post the week's build. Thursday: one short post from the notes.

### Proof

- Ask two or three people who have seen your work for a LinkedIn recommendation. Real people only.
- When the first real clients exist, ask them for a review on your Services page. That is where clients compare providers.
- Once a month, check Profile views and Search appearances (it shows the keywords people found you by) and adjust the headline if the right words are missing.

---

## Open to a job as well (clients first)

Clients come first, so the public profile stays entirely about them. Nothing visible says you are looking: a client who reads "open to new roles" wonders whether you will be around to finish their build. The job side runs quietly underneath:

- **Open to → Finding a new job**, visibility **Recruiters only**. Only people using LinkedIn's recruiter tools see it, and the green frame never appears on your photo. Job titles: Web Developer, Front-End Developer, Web Designer, JavaScript Developer. Location: your area, plus remote.
- **Keep the client headline.** Recruiters search job titles and skills, and the profile already carries both: "web design" in the title, HTML, CSS and JavaScript in Experience and Skills.
- **Leave Featured in the client order.** All the builds is already in it, and it is the first thing a recruiter clicks.
- When you apply, message the hiring manager or someone on the team with one line on why, and a link to the build closest to their work. That message is where you say you are looking, not the profile.

If a job ever becomes the priority, swap to this headline and move All the builds to the top of Featured:

```text
Web Developer | JavaScript, HTML, CSS | Websites, booking systems and automation for service businesses | Founder, Skales Studio
```
