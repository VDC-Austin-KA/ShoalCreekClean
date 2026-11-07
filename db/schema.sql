-- Shoal Creek Clean — Cloudflare D1 (SQLite) schema. Idempotent.
-- Conventions: ids are UUID text; timestamps are UTC ISO-8601 text ("2026-11-07T14:00:00.000Z");
-- arrays/objects are JSON text (parsed/serialized by lib/db.ts); booleans are 0/1.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('owner','manager','crew','client')),
  password_hash TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used_at    TEXT
);

CREATE TABLE IF NOT EXISTS clients (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  user_id      TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  company      TEXT,
  contact_name TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  segment      TEXT NOT NULL DEFAULT 'residential',
  address      TEXT,
  lat          REAL,
  lng          REAL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS crews (
  id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  name      TEXT NOT NULL,
  color     TEXT NOT NULL DEFAULT '#22d3ee',
  size      INTEGER NOT NULL DEFAULT 2,
  home_lat  REAL NOT NULL DEFAULT 30.2672,
  home_lng  REAL NOT NULL DEFAULT -97.7431,
  equipment TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS crew_members (
  crew_id TEXT REFERENCES crews(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (crew_id, user_id)
);

CREATE TABLE IF NOT EXISTS pricing_rules (
  service             TEXT PRIMARY KEY,
  label               TEXT NOT NULL,
  unit                TEXT NOT NULL,           -- sqft | lf
  rate                REAL NOT NULL,           -- dollars per unit
  min_cents           INTEGER NOT NULL,
  production_per_hour INTEGER NOT NULL,        -- units per tech-hour
  equipment           TEXT NOT NULL DEFAULT '[]',
  phase               INTEGER NOT NULL DEFAULT 1,
  description         TEXT
);

CREATE TABLE IF NOT EXISTS leads (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  name        TEXT NOT NULL,
  company     TEXT,
  email       TEXT NOT NULL,
  phone       TEXT,
  segment     TEXT NOT NULL DEFAULT 'residential',
  city        TEXT,
  stage       TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','quoted','won','retained','lost')),
  value_cents INTEGER NOT NULL DEFAULT 0,
  source      TEXT NOT NULL DEFAULT 'website',
  notes       TEXT,
  lat         REAL,
  lng         REAL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS quotes (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  lead_id     TEXT REFERENCES leads(id) ON DELETE SET NULL,
  client_id   TEXT REFERENCES clients(id) ON DELETE SET NULL,
  input       TEXT NOT NULL,
  line_items  TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  est_hours   REAL NOT NULL DEFAULT 0,
  crew_size   INTEGER NOT NULL DEFAULT 2,
  status      TEXT NOT NULL DEFAULT 'estimated', -- estimated | review | accepted | declined
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  client_id       TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  quote_id        TEXT REFERENCES quotes(id) ON DELETE SET NULL,
  crew_id         TEXT REFERENCES crews(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  service         TEXT NOT NULL,
  address         TEXT NOT NULL,
  lat             REAL NOT NULL,
  lng             REAL NOT NULL,
  scheduled_start TEXT,
  quoted_minutes  INTEGER NOT NULL DEFAULT 120,
  actual_minutes  INTEGER,
  crew_size       INTEGER NOT NULL DEFAULT 2,
  equipment       TEXT NOT NULL DEFAULT '[]',
  frequency       TEXT NOT NULL DEFAULT 'one_time',
  price_cents     INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','en_route','in_progress','completed','cancelled')),
  route_order     INTEGER,
  clock_in        TEXT,
  clock_out       TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS jobs_start_idx ON jobs (scheduled_start);
CREATE INDEX IF NOT EXISTS jobs_client_idx ON jobs (client_id);

CREATE TABLE IF NOT EXISTS job_photos (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  job_id     TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('before','after')),
  data_url   TEXT NOT NULL,
  taken_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  number         INTEGER UNIQUE,
  client_id      TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  job_id         TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  description    TEXT NOT NULL,
  amount_cents   INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open', -- open | paid | void
  due_date       TEXT NOT NULL DEFAULT (date('now','+15 days')),
  paid_at        TEXT,
  payment_method TEXT,
  stripe_session TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- Sequential human-facing invoice numbers.
CREATE TRIGGER IF NOT EXISTS invoices_number AFTER INSERT ON invoices WHEN NEW.number IS NULL
BEGIN
  UPDATE invoices SET number = (SELECT COALESCE(MAX(number), 0) + 1 FROM invoices) WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS payment_methods (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  client_id  TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('card','ach')),
  label      TEXT NOT NULL,   -- "Visa •••• 4242" / "Chase checking •••• 6789"
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS service_zones (
  id      TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  name    TEXT NOT NULL,
  color   TEXT NOT NULL DEFAULT '#22d3ee',
  phase   INTEGER NOT NULL DEFAULT 1,
  polygon TEXT NOT NULL,      -- [[lat,lng],...]
  notes   TEXT
);

CREATE TABLE IF NOT EXISTS map_markers (
  id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  layer     TEXT NOT NULL CHECK (layer IN ('competitor','hotspot','pricing')),
  label     TEXT NOT NULL,
  lat       REAL NOT NULL,
  lng       REAL NOT NULL,
  radius_m  INTEGER NOT NULL DEFAULT 1500,
  value     REAL NOT NULL DEFAULT 1,
  notes     TEXT
);

CREATE TABLE IF NOT EXISTS campaigns (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  name            TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  audience        TEXT NOT NULL DEFAULT 'all',
  status          TEXT NOT NULL DEFAULT 'draft',
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at         TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS email_outbox (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  to_email    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'transactional',
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'simulated',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS outbox_created_idx ON email_outbox (created_at);

-- Real competitor intelligence (from data/competitors.json; every fact carries a source URL).
CREATE TABLE IF NOT EXISTS competitors (
  id                 TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  slug               TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  website            TEXT,
  base_city          TEXT,
  lat                REAL,
  lng                REAL,
  location_precision TEXT NOT NULL DEFAULT 'city',
  kind               TEXT NOT NULL DEFAULT 'local',
  focus              TEXT NOT NULL DEFAULT 'mixed',
  services_claimed   TEXT NOT NULL DEFAULT '[]',
  services_evidenced TEXT NOT NULL DEFAULT '[]',
  prices             TEXT NOT NULL DEFAULT '[]',
  strategies         TEXT NOT NULL DEFAULT '[]',
  confidence         TEXT NOT NULL DEFAULT 'medium',
  notes              TEXT,
  sources            TEXT NOT NULL DEFAULT '[]',
  retrieved_at       TEXT NOT NULL DEFAULT (date('now'))
);

-- Competitor quotes shared voluntarily by prospects (price-match offer) or logged by partners.
CREATE TABLE IF NOT EXISTS market_quotes (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  competitor   TEXT NOT NULL,
  service      TEXT NOT NULL,
  quantity     REAL,
  unit         TEXT,
  amount_cents INTEGER NOT NULL,
  city         TEXT,
  source       TEXT NOT NULL DEFAULT 'prospect',
  lead_id      TEXT REFERENCES leads(id) ON DELETE SET NULL,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
