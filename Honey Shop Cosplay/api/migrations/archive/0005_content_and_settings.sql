CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS post_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
ALTER TABLE posts ADD COLUMN category_id TEXT REFERENCES post_categories(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN sort_index INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS posts_type_status_sort_idx ON posts(type, status, sort_index);
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts(category_id);
UPDATE posts SET sort_index = (SELECT COUNT(*) FROM posts older WHERE older.type = 'GUIDE' AND (older.created_at < posts.created_at OR (older.created_at = posts.created_at AND older.id <= posts.id))) WHERE type = 'GUIDE';
