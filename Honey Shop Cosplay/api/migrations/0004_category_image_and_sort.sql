ALTER TABLE categories ADD COLUMN image_url TEXT;
ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON categories(sort_order);
