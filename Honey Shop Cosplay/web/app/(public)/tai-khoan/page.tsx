import type { Metadata } from 'next';
import { CustomerAccount } from '../../../components/CustomerAccount';

export const metadata: Metadata = { title: 'Tài khoản khách hàng', description: 'Đăng nhập để theo dõi lịch sử thuê tại Honey Shop.' };
export default function CustomerAccountPage() { return <CustomerAccount />; }
