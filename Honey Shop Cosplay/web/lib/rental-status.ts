export const rentalOrderStatuses = [
  { value: 'NEW', label: 'Mới' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'HANDED_TO_SHIPPER', label: 'Đã bàn giao shipper' },
  { value: 'DELIVERED_TO_CUSTOMER', label: 'Đã giao tới khách' },
  { value: 'RETURNING', label: 'Shipper đang giao về' },
  { value: 'RETURNED', label: 'Đã nhận đồ, hoàn thành' },
  { value: 'CUSTOMER_REFUSED', label: 'Khách từ chối nhận' },
  { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

export const processingStatusLabels: Record<string, string> = {
  WAITING_FOR_PAYMENT: 'Đang chờ thanh toán', PENDING: 'Đang chờ thanh toán', PROCESSING: 'Đang xử lý', COMPLETED: 'Hoàn thành',
};

export const paymentStatusLabels: Record<string, string> = {
  UNPAID: 'Chưa cọc', DEPOSIT_PAID: 'Đã cọc', PAID: 'Đã thanh toán', DEPOSIT_REFUNDED: 'Đã hoàn cọc',
};

export const paymentTypeLabels: Record<string, string> = {
  DEPOSIT: 'Nhận tiền cọc', BALANCE: 'Thu tiền thuê', DEPOSIT_REFUND: 'Hoàn cọc',
};

export const orderStatusLabel = (status: string) => rentalOrderStatuses.find(item => item.value === status)?.label || status;
export const formatRentalDate = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
export const formatVnd = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
