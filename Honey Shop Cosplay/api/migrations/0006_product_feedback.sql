CREATE TABLE IF NOT EXISTS product_feedback (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  hide_identity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS product_feedback_product_created_idx ON product_feedback(product_id, created_at DESC);
