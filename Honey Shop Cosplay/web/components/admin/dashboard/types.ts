export type DashboardSummary = {
  totalOrders: number;
  customerCount: number;
  activeOrders: number;
  amountCollected: number;
  amountOutstanding: number;
};

export type DashboardRental = {
  id: string;
  customerName: string;
  customerEmail?: string;
  productNames?: string;
  startDate: string;
  endDate: string;
  orderStatus?: string;
  status?: string;
  processingStatus?: string;
  paymentStatus?: string;
};

export type DashboardDataResponse = {
  stats: DashboardSummary;
  rentals: DashboardRental[];
};
