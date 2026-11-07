-- Shoal Creek Clean — PostgreSQL schema (portable to Supabase).
-- Idempotent: safe to run repeatedly.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner','manager','crew','client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('scheduled','en_route','in_progress','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM ('new','contacted','quoted','won','retained','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  phone         text,
  role          user_role NOT NULL DEFAULT 'client',
  password_hash text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);

CREATE TABLE IF NOT EXISTS clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  company      text,
  contact_name text NOT NULL,
  email        text NOT NULL,
  phone        text,
  segment      text NOT NULL DEFAULT 'residential',
  address      text,
  lat          double precision,
  lng          double precision,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crews (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL,
  color text NOT NULL DEFAULT '#22d3ee',
  size  int  NOT NULL DEFAULT 2,
  home_lat double precision NOT NULL DEFAULT 30.2672,
  home_lng double precision NOT NULL DEFAULT -97.7431,
  equipment text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS crew_members (
  crew_id uuid REFERENCES crews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (crew_id, user_id)
);

CREATE TABLE IF NOT EXISTS pricing_rules (
  service       text PRIMARY KEY,
  label         text NOT NULL,
  unit          text NOT NULL,           -- sqft | lf
  rate          numeric(8,4) NOT NULL,   -- dollars per unit
  min_cents     int  NOT NULL,
  production_per_hour int NOT NULL,      -- units per tech-hour
  equipment     text[] NOT NULL DEFAULT '{}',
  phase         int NOT NULL DEFAULT 1,
  description   text
);

CREATE TABLE IF NOT EXISTS leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  company     text,
  email       text NOT NULL,
  phone       text,
  segment     text NOT NULL DEFAULT 'residential',
  city        text,
  stage       lead_stage NOT NULL DEFAULT 'new',
  value_cents int NOT NULL DEFAULT 0,
  source      text NOT NULL DEFAULT 'website',
  notes       text,
  lat double precision,
  lng double precision,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid REFERENCES leads(id) ON DELETE SET NULL,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  input       jsonb NOT NULL,
  line_items  jsonb NOT NULL,
  total_cents int NOT NULL,
  est_hours   numeric(6,2) NOT NULL DEFAULT 0,
  crew_size   int NOT NULL DEFAULT 2,
  status      text NOT NULL DEFAULT 'estimated', -- estimated | review | accepted | declined
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  quote_id        uuid REFERENCES quotes(id) ON DELETE SET NULL,
  crew_id         uuid REFERENCES crews(id) ON DELETE SET NULL,
  title           text NOT NULL,
  service         text NOT NULL,
  address         text NOT NULL,
  lat             double precision NOT NULL,
  lng             double precision NOT NULL,
  scheduled_start timestamptz,
  quoted_minutes  int NOT NULL DEFAULT 120,
  actual_minutes  int,
  crew_size       int NOT NULL DEFAULT 2,
  equipment       text[] NOT NULL DEFAULT '{}',
  frequency       text NOT NULL DEFAULT 'one_time',
  price_cents     int NOT NULL DEFAULT 0,
  status          job_status NOT NULL DEFAULT 'scheduled',
  route_order     int,
  clock_in        timestamptz,
  clock_out       timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_start_idx ON jobs (scheduled_start);
CREATE INDEX IF NOT EXISTS jobs_client_idx ON jobs (client_id);

CREATE TABLE IF NOT EXISTS job_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('before','after')),
  data_url   text NOT NULL,
  taken_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number         serial UNIQUE,
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  job_id         uuid REFERENCES jobs(id) ON DELETE SET NULL,
  description    text NOT NULL,
  amount_cents   int NOT NULL,
  status         text NOT NULL DEFAULT 'open', -- open | paid | void
  due_date       date NOT NULL DEFAULT (now() + interval '15 days'),
  paid_at        timestamptz,
  payment_method text,
  stripe_session text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('card','ach')),
  label      text NOT NULL,   -- "Visa •••• 4242" / "Chase checking •••• 6789"
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_zones (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL,
  color   text NOT NULL DEFAULT '#22d3ee',
  phase   int  NOT NULL DEFAULT 1,
  polygon jsonb NOT NULL,      -- [[lat,lng],...]
  notes   text
);

-- Map intelligence layers. Seeded with anonymized placeholders; replace with field research.
CREATE TABLE IF NOT EXISTS map_markers (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer     text NOT NULL CHECK (layer IN ('competitor','hotspot','pricing')),
  label     text NOT NULL,
  lat       double precision NOT NULL,
  lng       double precision NOT NULL,
  radius_m  int NOT NULL DEFAULT 1500,
  value     numeric NOT NULL DEFAULT 1, -- intensity / price index
  notes     text
);

CREATE TABLE IF NOT EXISTS campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  subject         text NOT NULL,
  body            text NOT NULL,
  audience        text NOT NULL DEFAULT 'all', -- all | commercial | residential | <segment>
  status          text NOT NULL DEFAULT 'draft',
  recipient_count int NOT NULL DEFAULT 0,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_outbox (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email    text NOT NULL,
  subject     text NOT NULL,
  body        text NOT NULL,
  kind        text NOT NULL DEFAULT 'transactional',
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'simulated', -- simulated | sent | failed
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outbox_created_idx ON email_outbox (created_at DESC);
