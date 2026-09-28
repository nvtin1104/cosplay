-- Squashed baseline schema for a fresh Honey Shop D1 database.
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  test_price INTEGER NOT NULL DEFAULT 0,
  fes_price INTEGER NOT NULL DEFAULT 0,
  shoot_price INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  total_quantity INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  location TEXT,
  is_combo INTEGER NOT NULL DEFAULT 0,
  reward_points INTEGER NOT NULL DEFAULT 0,
  points_price INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  kind TEXT NOT NULL DEFAULT 'gallery'
);
CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  attributes TEXT
);
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE product_categories (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE TABLE product_tags (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
CREATE TABLE product_combo_items (
  combo_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  item_product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (combo_product_id, item_product_id)
);
CREATE TABLE post_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  type TEXT NOT NULL DEFAULT 'ARTICLE',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  seo_title TEXT,
  seo_description TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  category_id TEXT REFERENCES post_categories(id) ON DELETE SET NULL,
  sort_index INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE rentals (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'HOLD',
  deposit INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  customer_email TEXT
);
CREATE TABLE rental_items (
  id TEXT PRIMARY KEY,
  rental_id TEXT NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN','STAFF')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STAFF',
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE login_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  successful INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE customer_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT,
  password_salt TEXT,
  facebook_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE customer_sessions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE product_feedback (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  hide_identity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  customer_id TEXT REFERENCES customer_accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'APPROVED'
);
CREATE TABLE loyalty_transactions (
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
CREATE INDEX rentals_dates_idx ON rentals(start_date, end_date);
CREATE INDEX rental_items_product_idx ON rental_items(product_id);
CREATE INDEX sessions_token_idx ON sessions(token_hash);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE INDEX login_attempts_email_idx ON login_attempts(email, created_at);
CREATE INDEX categories_parent_idx ON categories(parent_id);
CREATE INDEX product_categories_category_idx ON product_categories(category_id);
CREATE INDEX product_tags_tag_idx ON product_tags(tag_id);
CREATE INDEX categories_sort_order_idx ON categories(sort_order);
CREATE INDEX posts_type_status_sort_idx ON posts(type, status, sort_index);
CREATE INDEX posts_category_idx ON posts(category_id);
CREATE INDEX product_feedback_product_created_idx ON product_feedback(product_id, created_at DESC);
CREATE INDEX customer_sessions_token_idx ON customer_sessions(token_hash);
CREATE INDEX rentals_customer_email_idx ON rentals(customer_email);
CREATE INDEX loyalty_transactions_customer_created_idx ON loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX product_feedback_status_created_idx ON product_feedback(status, created_at DESC);
CREATE TRIGGER loyalty_balance_nonnegative
BEFORE INSERT ON loyalty_transactions
WHEN NEW.event_type IN ('REDEEM','ADJUST')
  AND (SELECT coalesce(sum(points_delta),0) FROM loyalty_transactions WHERE customer_id=NEW.customer_id) + NEW.points_delta < 0
BEGIN
  SELECT RAISE(ABORT, 'Insufficient points balance');
END;
INSERT INTO settings (key,value) VALUES
  ('points_currency_step','10000'),
  ('points_per_step','1'),
  ('points_value_vnd','1000'),
  ('points_redemption_enabled','1');
