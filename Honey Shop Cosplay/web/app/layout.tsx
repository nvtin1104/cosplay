import type { Metadata } from 'next';
import { Baloo_2, Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const display = Baloo_2({ subsets: ['latin', 'vietnamese'], variable: '--font-display', display: 'swap' });
const body = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], variable: '--font-body', weight: ['400', '500', '600', '700', '800'], display: 'swap' });
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://honey-shop.example'), title: { default: 'Honey Shop Cosplay', template: '%s · Honey Shop' }, description: 'Thuê đồ cosplay có ảnh thật, lịch rõ ràng và hỗ trợ tận tâm.', openGraph: { title: 'Honey Shop Cosplay', description: 'Mặc nhân vật bạn yêu, tỏa sáng theo cách riêng.', type: 'website' } };

export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="vi"><body className={`${display.variable} ${body.variable}`}>{children}</body></html>; }
