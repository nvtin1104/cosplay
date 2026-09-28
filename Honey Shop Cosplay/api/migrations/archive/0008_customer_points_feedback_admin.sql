ALTER TABLE products ADD COLUMN reward_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN points_price INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customer_accounts ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE product_feedback ADD COLUMN customer_id TEXT REFERENCES customer_accounts(id) ON DELETE SET NULL;
ALTER TABLE product_feedback ADD COLUMN status TEXT NOT NULL DEFAULT 'APPROVED';

UPDATE product_feedback
SET customer_id = (SELECT id FROM customer_accounts WHERE lower(email)=lower(product_feedback.customer_email) LIMIT 1)
WHERE customer_email IS NOT NULL;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
  rental_id TEXT REFERENCES rentals(id) ON DELETE SET NULL,
  source_key TEXT UNIQUE,
  event_type TEXT NOT NULL,
  points_delta INTEGER NOT NULL,
  note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS loyalty_transactions_customer_created_idx ON loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS product_feedback_status_created_idx ON product_feedback(status, created_at DESC);
CREATE TRIGGER IF NOT EXISTS loyalty_balance_nonnegative
BEFORE INSERT ON loyalty_transactions
WHEN NEW.event_type IN ('REDEEM','ADJUST')
  AND (SELECT coalesce(sum(points_delta),0) FROM loyalty_transactions WHERE customer_id=NEW.customer_id) + NEW.points_delta < 0
BEGIN
  SELECT RAISE(ABORT, 'Insufficient points balance');
END;

INSERT OR IGNORE INTO settings (key,value) VALUES ('points_currency_step','10000');
INSERT OR IGNORE INTO settings (key,value) VALUES ('points_per_step','1');
INSERT OR IGNORE INTO settings (key,value) VALUES ('points_value_vnd','1000');
INSERT OR IGNORE INTO settings (key,value) VALUES ('points_redemption_enabled','1');
