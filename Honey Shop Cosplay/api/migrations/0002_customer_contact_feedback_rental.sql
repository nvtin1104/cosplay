ALTER TABLE customer_accounts ADD COLUMN phone TEXT;
ALTER TABLE product_feedback ADD COLUMN rental_id TEXT REFERENCES rentals(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX product_feedback_rental_product_unique_idx
  ON product_feedback(rental_id, product_id)
  WHERE rental_id IS NOT NULL;
