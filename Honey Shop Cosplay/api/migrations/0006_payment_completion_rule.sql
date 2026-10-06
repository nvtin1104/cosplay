UPDATE rentals
SET processing_status = CASE
  WHEN (total_amount > 0 OR deposit > 0)
    AND coalesce((
      SELECT sum(CASE
        WHEN p.type IN ('DEPOSIT', 'BALANCE') THEN p.amount
        WHEN p.type = 'DEPOSIT_REFUND' THEN -p.amount
        ELSE 0
      END)
      FROM rental_payment_transactions p WHERE p.rental_id = rentals.id
    ), 0) <= 0 THEN 'WAITING_FOR_PAYMENT'
  WHEN status IN ('RETURNED', 'CANCELLED')
    AND (total_amount <= 0 OR coalesce((
      SELECT sum(amount) FROM rental_payment_transactions p
      WHERE p.rental_id = rentals.id AND p.type = 'BALANCE'
    ), 0) >= total_amount) THEN 'COMPLETED'
  ELSE 'PROCESSING'
END;

UPDATE rental_status_history
SET to_processing_status = (
  SELECT r.processing_status FROM rentals r WHERE r.id = rental_status_history.rental_id
)
WHERE actor_name = 'Trước khi bật nhật ký';
