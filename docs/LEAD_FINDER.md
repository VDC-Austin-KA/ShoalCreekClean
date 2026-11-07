# Lead Finder

The lead finder is a separate Cloudflare Worker (`leadfinder/`, deployed as `shoalcreek-leadfinder`). It runs on a schedule outside the main app and writes researched leads into the shared D1 database. The partners work those leads in the app under **Admin → Lead finder**.

## What it does

Every 10 minutes, a scheduled run works through a small queue. Each run uses at most 40 outbound requests, which keeps it inside the free plan.

1. **Discover.** It finds named businesses in the target segments using OpenStreetMap (Overpass API).
   - Area: the Phase-1 service area (Austin core → Round Rock/Pflugerville → Cedar Park/Leander).
   - Segments: property managers, apartments, retail centers, restaurants (drive-thrus flagged), office tenants, and storefronts (fuel, car wash, banks, clinics and so on).
   - It only keeps places that publish a website or phone number.
   - Discovery re-runs weekly on its own. You can also click **Run discovery** at any time.
2. **Enrich.** It reads each business's *own* home page plus up to 2 contact, about or team pages, and keeps only:
   - email addresses the business publishes (including Cloudflare-obfuscated ones)
   - published phone numbers
   - people named with a job title (General Manager, Property Manager, Community Manager, Owner, and so on)

   Every value stores the URL it came from.
3. **Score and brief.** It scores fit from 0 to 100, based on segment, service zone, whether a decision-maker is named, how reachable they are, and whether they're a competitor's client. It also writes a brief with:
   - the goal of the conversation
   - who to ask for
   - an honest founder-voice opener
   - the offer
   - discovery questions and objection handling
   - an email draft and a voicemail script
   - compliance reminders

### Competitor clients

There are two sources.

- **Competitors' public testimonial and case-study pages.** The finder scans these automatically and flags names for review. As of 2026-11, local competitors' pages don't name any commercial clients, so this source currently finds nothing. It's kept in case they start publishing case studies.
- **Field sightings.** This is the source that actually works. Log a competitor's truck or yard sign at a property in **Lead finder → Log a competitor sighting**. The brief then offers a free side-by-side test area, never disparages the competitor, and never asks them to break a contract.

## Guardrails (built in)

- **Public business information only.**
  - No LinkedIn or other social scraping.
  - No guessed or pattern-generated email addresses.
  - No personal home addresses.
  - Placeholder addresses (for example `example.com`) are discarded.
- **Polite crawling.**
  - Honors `robots.txt`; a site that disallows the crawler is marked `blocked by robots` and nothing is collected from it.
  - Reads at most 3 pages per site.
  - Never logs in, submits forms or gets past bot protection.
  - Identifies itself as `ShoalCreekCleanLeadFinder/1.0 (+https://wash.ackerworks.com/bot)`.
- **Do-not-contact list (`suppressions`).**
  - It gets filled two ways: a one-click unsubscribe link in every campaign email, and the **Do not contact** button on each lead.
  - The lead finder never stores a suppressed email or phone number again.
  - Campaigns automatically exclude everyone on the list.
- **Email (CAN-SPAM).**
  - Every campaign email includes the business identity, a physical mailing address (`BUSINESS_ADDRESS`), and a working one-click opt-out.
  - Real sends are blocked until `BUSINESS_ADDRESS` is set.
  - Subjects must be honest; the templates are.
- **Calls and texts (TCPA).**
  - Dial by hand. Never use an autodialer or prerecorded messages.
  - Never text a number unless they've given you permission.
  - The numbers collected are business lines the business published.
  - Honor any "don't call" request immediately with **Do not contact**.
  - Texas also has telemarketing rules (Business & Commerce Code ch. 304, the Texas no-call list), which mainly cover consumer calls. Before calling residential leads, check the federal and Texas Do Not Call lists. This is general guidance, not legal advice.

## Operating it

| Task | How |
|---|---|
| Queue a discovery run | Admin → Lead finder → **Run discovery** (choose segments) |
| See progress | Lead finder page stats; the finder's `/status` endpoint (needs the `x-finder-key` header) |
| Work a lead | Open it, then follow the brief: **Mark contacted**, move it through the CRM pipeline, or mark it **Do not contact** |
| Redeploy the Worker | `npx wrangler deploy -c leadfinder/wrangler.jsonc` |
| Rotate the API key | `npx wrangler secret put FINDER_KEY -c leadfinder/wrangler.jsonc` |

Data © OpenStreetMap contributors (ODbL).
