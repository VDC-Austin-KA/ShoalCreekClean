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
- **Campaigns**: email composer with merge tags, audience segments and a live preview. Every email goes to the Outbox. Emails are simulated unless `SMTP_URL` is set.
- **Strategy generator** (`lib/strategy.ts`): takes segment, account size, city and season and produces an angle, an offer, a 17-day cadence, an email template, a call opener, objection handling and collateral. One click turns the output into a campaign.
- **Price book**: partners can edit rates, minimums and production rates without a deploy.
- **Competitor intel** (`/admin/competitors`, `data/competitors.json`, [`docs/COMPETITOR_INTEL.md`](docs/COMPETITOR_INTEL.md)): 23 real Central Texas operators, with every price sourced and verified verbatim. The page shows:
  - services claimed vs. services with evidence of actual work, as a say/do gap
  - our price book against published market prices
  - real-time quotes captured from the quote form's price-match field and logged by partners

## Stack

Next.js 15 (App Router) and React 19, Tailwind v4 (dark glass design system in `app/globals.css` with spring easing), PostgreSQL (`db/schema.sql`, also works on Supabase), `pg`, JWT sessions (`jose`, httpOnly cookie) with bcrypt passwords plus magic links, and Leaflet. Stripe and SMTP are optional and called over REST.

## Run locally

```bash
cp .env.example .env            # set DATABASE_URL + SESSION_SECRET
npm install
npm run db:seed                 # schema + alpha test data (Node >= 22.18)
npm run dev                     # http://localhost:3000
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
npm test                                   # unit: pricing, routing, allocation, geo, strategy
npm run build && npm start &               # then, against a freshly seeded DB:
NODE_PATH=$(npm root -g) node tests/e2e.mjs [screenshotDir]   # Playwright E2E across all 3 tiers
```

## Deploy to `wash.ackerworks.com`

Option A is a single VM (any VPS with Docker). Caddy issues the TLS certificate automatically.

1. DNS: create an `A` record `wash.ackerworks.com` → VM IP.
2. On the VM: `git clone`, then `cp .env.example .env`. Set `POSTGRES_PASSWORD`, `SESSION_SECRET` (`openssl rand -hex 32`) and `APP_URL=https://wash.ackerworks.com`. Keep `ALPHA_MODE=true` only during alpha testing.
3. `docker compose up -d --build`. The schema is applied on every start and is idempotent.
4. Seed alpha data once: `docker compose run --rm app node scripts/db-setup.ts --seed`.

Option B uses managed services (Railway, Render or Fly plus Supabase Postgres):

1. Build from the `Dockerfile`.
2. Set `DATABASE_URL` to the Supabase pooled connection string and set `DATABASE_SSL=true`.
3. Point a CNAME for `wash.ackerworks.com` at the platform.

Before a public launch:

- Set `ALPHA_MODE=false`. This hides the demo logins and stops returning magic links in API responses.
- Add `STRIPE_SECRET_KEY` and a Stripe webhook. Replace the simulated saved methods with SetupIntents.
- Set `SMTP_URL`.
- Replace the placeholder testimonials and credentials in `lib/content.ts`.
- Re-run the competitor research quarterly (see `docs/COMPETITOR_INTEL.md` §6).
- Validate the price book with secret-shop calls (see the strategy doc).
