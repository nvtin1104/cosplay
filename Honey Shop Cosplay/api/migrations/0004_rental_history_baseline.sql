INSERT INTO rental_status_history (
  id, rental_id, from_status, to_status, from_processing_status,
  to_processing_status, actor_id, actor_name, created_at
)
SELECT
  lower(hex(randomblob(16))), r.id, NULL, r.status, NULL,
  r.processing_status, NULL, 'Trước khi bật nhật ký', r.updated_at
FROM rentals r
WHERE NOT EXISTS (
  SELECT 1 FROM rental_status_history h WHERE h.rental_id = r.id
);
