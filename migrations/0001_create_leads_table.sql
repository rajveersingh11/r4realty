-- Cloudflare D1 Migration for leads table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  project TEXT,
  message TEXT,
  timestamp TEXT,
  status TEXT DEFAULT 'New'
);

CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp DESC);
