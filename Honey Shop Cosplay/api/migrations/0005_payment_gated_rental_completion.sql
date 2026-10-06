UPDATE rentals
SET processing_status = CASE
  WHEN total_amount > 0
    AND NOT EXISTS (
      SELECT 1 FROM rental_payment_transactions p
      WHERE p.rental_id = rentals.id AND p.type IN ('DEPOSIT', 'BALANCE')
    ) THEN 'WAITING_FOR_PAYMENT'
  WHEN status IN ('RETURNED', 'CANCELLED')
    AND (total_amount <= 0 OR coalesce((
      SELECT sum(amount) FROM rental_payment_transactions p
      WHERE p.rental_id = rentals.id AND p.type = 'BALANCE'
    ), 0) >= total_amount)
    AND coalesce((
      SELECT sum(amount) FROM rental_payment_transactions p
      WHERE p.rental_id = rentals.id AND p.type = 'DEPOSIT'
    ), 0) <= coalesce((
      SELECT sum(amount) FROM rental_payment_transactions p
      WHERE p.rental_id = rentals.id AND p.type = 'DEPOSIT_REFUND'
    ), 0) THEN 'COMPLETED'
  ELSE 'PROCESSING'
END;

UPDATE rental_status_history
SET to_processing_status = (
  SELECT r.processing_status FROM rentals r WHERE r.id = rental_status_history.rental_id
)
WHERE actor_name = 'Trước khi bật nhật ký';
