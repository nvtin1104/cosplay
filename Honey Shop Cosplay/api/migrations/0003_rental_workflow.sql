ALTER TABLE rentals ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'PENDING';

UPDATE rentals
SET status = CASE status
  WHEN 'HOLD' THEN 'NEW'
  WHEN 'CONFIRMED' THEN 'CONFIRMED'
  WHEN 'RETURNED' THEN 'RETURNED'
  WHEN 'CANCELLED' THEN 'CANCELLED'
  ELSE 'NEW'
END;

UPDATE rentals
SET processing_status = CASE
  WHEN status IN ('RETURNED', 'CANCELLED') THEN 'COMPLETED'
  WHEN status = 'NEW' THEN 'PENDING'
  ELSE 'PROCESSING'
END;

CREATE TABLE rental_status_history (
  id TEXT PRIMARY KEY,
  rental_id TEXT NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  from_processing_status TEXT,
  to_processing_status TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE rental_payment_transactions (
  id TEXT PRIMARY KEY,
  rental_id TEXT NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'BALANCE', 'DEPOSIT_REFUND')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  note TEXT,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX rental_status_history_rental_idx ON rental_status_history(rental_id, created_at DESC);
CREATE INDEX rental_payment_transactions_rental_idx ON rental_payment_transactions(rental_id, created_at DESC);
