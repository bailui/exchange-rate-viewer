CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  manage_token_hash TEXT NOT NULL,
  verify_token_hash TEXT,
  email TEXT NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  target REAL NOT NULL CHECK (target > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused')),
  enabled INTEGER NOT NULL DEFAULT 1,
  last_state INTEGER NOT NULL DEFAULT 0,
  last_rate REAL,
  last_checked_at TEXT,
  last_notified_at TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL,
  verified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_monitoring ON alerts(status, enabled);
CREATE INDEX IF NOT EXISTS idx_alerts_email_created ON alerts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_ip_created ON alerts(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_verify_token ON alerts(verify_token_hash);
