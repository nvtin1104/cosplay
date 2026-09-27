import type { Metadata } from 'next';
import { Baloo_2, Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { getSettings } from '../lib/api';

const display = Baloo_2({ subsets: ['latin', 'vietnamese'], variable: '--font-display', display: 'swap' });
const body = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], variable: '--font-body', weight: ['400', '500', '600', '700', '800'], display: 'swap' });
export async function generateMetadata(): Promise<Metadata> { const settings = await getSettings(); const name = settings.site_name || 'Honey Shop Cosplay'; const description = 'Thuê đồ cosplay có ảnh thật, lịch rõ ràng và hỗ trợ tận tâm.'; return { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://honey-shop-web.nvtin1104.workers.dev'), title: { default: name, template: `%s · ${name}` }, description, openGraph: { title: name, description, type: 'website', images: settings.logo_url ? [{ url: settings.logo_url }] : undefined } }; }

export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="vi"><body className={`${display.variable} ${body.variable}`}>{children}</body></html>; }
