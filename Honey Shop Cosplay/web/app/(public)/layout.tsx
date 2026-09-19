import Link from 'next/link';
import { PublicHeader } from '../../components/PublicHeader';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
      <footer className="border-t-2 border-[#24150e] bg-[#24150e] py-12 text-[#fff6dc]">
        <div className="header-shell grid gap-8 md:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="display text-4xl font-extrabold text-[#ffe75c]">
              honey shop <span className="text-[#ff9b35]">✦</span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/70">
              Cosplay rental ở TP.HCM. Ảnh thật, lịch rõ ràng và mỗi concept đều được chăm chút tử tế.
            </p>
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
            <Link href="/admin/login" className="hover:text-[#ffe75c] transition-colors">
              Quản lý
            </Link>
          </div>
        </div>
        <div className="header-shell mt-10 border-t border-white/15 pt-5 text-xs text-white/50 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 Honey Shop Cosplay · TP.HCM</span>
          <span className="text-[#ffe75c]/80">Mặc nhân vật bạn yêu, tỏa sáng theo cách riêng ✦</span>
        </div>
      </footer>
    </>
  );
}
