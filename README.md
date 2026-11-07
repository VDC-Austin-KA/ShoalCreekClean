# Shoal Creek Clean

Operations platform for a Central Texas exterior-cleaning business. Commercial power washing comes first (Phase 1); residential and Phase 2 services are also supported. One app serves three tiers:

| Tier | Path | Who |
|---|---|---|
| Public site and instant quote | `/`, `/quote`, `/quote/[id]` | Leads and prospects |
| Client portal | `/client`, `/client/billing` | Existing clients |
| Admin and operations | `/admin/*`, `/field` | The three partners (owner role) and field crews |

Strategy docs: [`docs/MARKET_STRATEGY.md`](docs/MARKET_STRATEGY.md) covers segments, the Phase 2 roadmap, competitive pricing, the price book, the 90-day plan and compliance. [`docs/OUTREACH_PLAYBOOK.md`](docs/OUTREACH_PLAYBOOK.md) has per-segment outreach templates.

## Features

- **Instant quote engine** (`lib/pricing.ts`): 4-step wizard with a live estimate. Pricing accounts for square footage or linear feet, surface type, building height, soil level, frequency discounts and after-hours work. Large jobs, 4+ story buildings and big sealing jobs go to partner review automatically. A quoted lead can book online, which creates a client account and an unassigned job and emails a magic-link login.
- **Client portal**: shows upcoming and live jobs with a status tracker (Scheduled → En route → In progress → Completed) that refreshes every 15 seconds. Clients see before/after photo proof, can rebook with one click, can change service frequency, can view and pay invoices (card or ACH), can save payment methods, and can print receipts.
- **Dispatch board**: week view with drag and drop between crews and days. Jobs can also be grouped by route zone. Touch devices use tap-to-select and then tap a cell. Each crew/day cell has a capacity bar.
- **Resource planner** (`lib/geo.ts` `allocate`): assigns jobs to crews based on crew size, equipment, the 9-hour shift capacity and drive time. Quoted durations are adjusted using the historical actual-vs-quoted ratio. Applying the plan saves 2-opt optimized route orders.
- **Coverage map** (Leaflet + CARTO dark tiles): layers for service zones, competitor clusters, commercial-density hotspots, pricing heat, jobs and leads. You can draw zones, and you can optimize routes with estimated drive times. Optional real road times come from the OSRM demo server.
- **Field view** (`/field`, mobile-first): daily stops in route order, Google Maps navigation for one stop or the full route, and the status flow. The status flow records clock-in/out and checks for photos. A job cannot be completed without before and after photos. Completing a job creates an invoice, emails the client, and schedules the next visit for recurring contracts.
- **CRM**: drag-and-drop pipeline with stages New → Contacted → Quoted → Won → Retained (plus Lost).
- **Campaigns**: email composer with merge tags, audience segments and a live preview. Every email goes to the Outbox. Emails are simulated unless `RESEND_API_KEY` is set.
- **Strategy generator** (`lib/strategy.ts`): takes segment, account size, city and season and produces an angle, an offer, a 17-day cadence, an email template, a call opener, objection handling and collateral. One click turns the output into a campaign.
- **Price book**: partners can edit rates, minimums and production rates without a deploy.
- **Competitor intel** (`/admin/competitors`, `data/competitors.json`, [`docs/COMPETITOR_INTEL.md`](docs/COMPETITOR_INTEL.md)): 23 real Central Texas operators, with every price sourced and verified verbatim. The page shows:
  - services claimed vs. services with evidence of actual work, as a say/do gap
  - our price book against published market prices
  - real-time quotes captured from the quote form's price-match field and logged by partners

## Stack

- **App:** Next.js 15 (App Router) and React 19, running on **Cloudflare Workers** via the OpenNext adapter.
- **Database:** **Cloudflare D1** (SQLite). The schema is `db/schema.sql`, and data access goes through `lib/db.ts`.
- **Time:** all Central-time math lives in `lib/tz.ts`, because SQLite has no time-zone support.
- **UI:** Tailwind v4, with the dark glass design system and spring easing in `app/globals.css`. Maps use Leaflet.
- **Auth:** JWT sessions (`jose`, httpOnly cookie), bcrypt passwords and magic links.
- **Optional integrations:** Stripe for payments and Resend for email, both called over HTTP.

## Run locally

```bash
npm install
cp .env.example .dev.vars       # local secrets for wrangler/next dev
npm run db:seed                 # schema + alpha data into the local D1 (.wrangler/), Node >= 22.18
npm run dev                     # http://localhost:3000 (uses the local D1 binding)
# or run the real Worker build locally in workerd:
npm run cf:preview              # http://localhost:8787
```

Demo accounts (password `alpha2026!`; one-click buttons appear on `/login` when `ALPHA_MODE=true`):

| Role | Email |
|---|---|
| Partners (owner) | `ops@`, `sales@`, `finance@shoalcreek.test` |
| Crew leads | `alpha@`, `bravo@`, `charlie@shoalcreek.test` |
| Clients | `client@` (property mgmt), `retail@`, `hoa@`, `cafe@`, `home@shoalcreek.test` |

Test card for saved payment methods: `4242 4242 4242 4242`.

## Tests

```bash
npm test                                   # unit: pricing, routing, allocation, geo, strategy, time zones, seed SQL
npm run db:seed && npm run cf:preview &    # then, against the freshly seeded local Worker:
BASE=http://localhost:8787 NODE_PATH=$(npm root -g) node tests/e2e.mjs [screenshotDir]   # Playwright E2E, all 3 tiers
```

## Deploy to `wash.ackerworks.com` (Cloudflare Workers + D1)

**Live:** https://wash.ackerworks.com (also https://clean.ackerworks.com and https://shoalcreek-clean.katx.workers.dev) runs on Cloudflare Workers (free plan) with the D1 database `shoalcreek`. `SESSION_SECRET` is already set as a Worker secret.

**Redeploy after changes:** `npm run cf:deploy:embedded`. This build bundles the static files into the Worker script (see `wrangler.embedded.jsonc` and `cloudflare/embedded-entry.mjs`), so it works from any machine, including sandboxes and CI behind proxies. Apply schema changes with `npm run db:setup -- --remote`.

**Optional auto-deploy:** connect the repo in Cloudflare (Workers & Pages → shoalcreek-clean → Settings → Build) with build command `npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy`, and `NODE_VERSION=22`. GitHub Actions is not used.

**First-time setup** (already done for wash.ackerworks.com):

```bash
npx wrangler d1 create shoalcreek            # paste the database_id into wrangler.jsonc
npx wrangler secret put SESSION_SECRET       # openssl rand -hex 32
npm run db:seed -- --remote                  # schema + competitor data + alpha data into the live D1
npm run cf:deploy                            # builds and deploys; wash.ackerworks.com is a Workers custom domain
```

`npm run db:setup -- --remote` re-applies the schema and refreshes competitor data without wiping other data.

Before a public launch:

- Set `ALPHA_MODE=false` in `wrangler.jsonc`. This hides the demo logins and stops returning magic links in API responses.
- Add a `STRIPE_SECRET_KEY` secret and a Stripe webhook. Replace the simulated saved methods with SetupIntents.
- Add a `RESEND_API_KEY` secret for real email delivery. Workers can't use SMTP.
- Replace the placeholder testimonials and credentials in `lib/content.ts`.
- Re-run the competitor research quarterly (see `docs/COMPETITOR_INTEL.md` §6).
- Validate the price book with secret-shop calls (see the strategy doc).
