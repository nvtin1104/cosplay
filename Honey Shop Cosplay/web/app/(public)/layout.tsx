import Link from 'next/link';
import { PublicHeader } from '../../components/PublicHeader';
import { getSettings } from '../../lib/api';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const siteName = settings.site_name || 'Honey Shop Cosplay';
  return (
    <>
      <PublicHeader siteName={siteName} logoUrl={settings.logo_url} />
      {children}
      <footer className="border-t-2 border-[#24150e] bg-[#24150e] py-12 text-[#fff6dc]">
        <div className="header-shell grid gap-8 md:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="display text-4xl font-extrabold text-[#ffe75c]">
              {siteName} <span className="text-[#ff9b35]">✦</span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/70">
              Cosplay rental ở TP.HCM. Ảnh thật, lịch rõ ràng và mỗi concept đều được chăm chút tử tế.
            </p>
            <div className="mt-3 space-y-1 text-sm text-white/70">
              {settings.contact_address && <p>{settings.contact_address}</p>}
              {settings.contact_phone && <p><a href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a></p>}
              {settings.contact_email && <p><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p>}
              {settings.contact_facebook && <p><a href={settings.contact_facebook} rel="noopener noreferrer" target="_blank">Facebook</a></p>}
              {settings.contact_zalo && <p><a href={settings.contact_zalo} rel="noopener noreferrer" target="_blank">Zalo</a></p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm font-bold text-[#fff6dc]">
            <Link href="/cosplay" className="hover:text-[#ffe75c] transition-colors">
              Kho đồ
            </Link>
            <Link href="/huong-dan" className="hover:text-[#ffe75c] transition-colors">
              Hướng dẫn
            </Link>
            <Link href="/blog" className="hover:text-[#ffe75c] transition-colors">
              Chuyện Honey
            </Link>
            <Link href="/tai-khoan" className="hover:text-[#ffe75c] transition-colors">
              Tài khoản & lịch thuê
            </Link>
            <Link href="/admin/login" className="hover:text-[#ffe75c] transition-colors">
              Quản lý
            </Link>
          </div>
        </div>
        <div className="header-shell mt-10 border-t border-white/15 pt-5 text-xs text-white/50 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 {siteName} · TP.HCM</span>
          <span className="text-[#ffe75c]/80">Mặc nhân vật bạn yêu, tỏa sáng theo cách riêng ✦</span>
        </div>
      </footer>
    </>
  );
}
