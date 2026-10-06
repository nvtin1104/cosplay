import { CustomerManager } from '../../../../components/admin/CustomerManager';
import { AdminListPageHeader } from '../../../../components/admin/AdminListPageHeader';

export default function CustomersPage() {
  return <div className="min-w-0"><AdminListPageHeader title="Tài khoản khách" description="Theo dõi hồ sơ, lịch thuê, điểm thành viên và trạng thái." /><CustomerManager /></div>;
}
