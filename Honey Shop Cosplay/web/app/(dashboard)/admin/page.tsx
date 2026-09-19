import { DashboardData } from '../../../components/admin/AdminData';
import { getPosts, getProducts } from '../../../lib/api';

export default async function DashboardPage() {
  const [products, posts] = await Promise.all([getProducts(), getPosts()]);
  return (
    <div className="p-5 md:p-8">
      <p className="text-sm font-semibold text-neutral-400">TỔNG QUAN</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Vận hành hôm nay</h1>
      <div className="mt-7">
        <DashboardData initialData={{ products, rentals: [], posts }} />
      </div>
    </div>
  );
}

