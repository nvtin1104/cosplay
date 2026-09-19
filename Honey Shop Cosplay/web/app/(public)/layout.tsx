import Link from 'next/link';
import { PublicHeader } from '../../components/PublicHeader';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fffdfa]">
      <PublicHeader />
      <div className="flex-1">{children}</div>

      <footer className="border-t border-[#ebd7be] bg-[#331e0f] py-14 text-[#fff5e3]">
        <div className="shell grid gap-10 md:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff9b28] text-xl shadow-md">
                🍯
              </span>
              <p className="display text-3xl font-extrabold tracking-tight">
                <span className="text-[#ffb23f]">honey</span> shop
                <span className="text-[#ffc425]">✦</span>
              </p>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#dfcfc2]">
              Tiệm cho thuê đồ cosplay tại TP.HCM. 100% ảnh thật, đồ thơm sạch, lịch giữ rõ ràng và mỗi concept đều được chăm chút bằng tất cả sự yêu thích.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm font-bold text-[#f5ebd8]">
            <div className="flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider text-[#ffb23f]/80">Khám phá</span>
              <Link href="/cosplay" className="hover:text-[#ffb23f] transition-colors">
                Kho đồ cosplay
              </Link>
              <Link href="/#quy-trinh" className="hover:text-[#ffb23f] transition-colors">
                Cách thuê đồ
              </Link>
              <Link href="/#feedback" className="hover:text-[#ffb23f] transition-colors">
                Feedback khách
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider text-[#ffb23f]/80">Hỗ trợ & Quản lý</span>
              <Link href="/huong-dan" className="hover:text-[#ffb23f] transition-colors">
                Hướng dẫn & Lưu ý
              </Link>
              <Link href="/blog" className="hover:text-[#ffb23f] transition-colors">
                Chuyện Honey
              </Link>
              <Link href="/admin/login" className="hover:text-[#ffb23f] transition-colors">
                Đăng nhập quản lý
              </Link>
            </div>
          </div>
        </div>

        <div className="shell mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#c2b0a3]">
          <span>© 2026 Honey Shop Cosplay · TP.HCM. Tất cả quyền được bảo lưu.</span>
          <span className="text-[#ffb23f]/80">Mặc nhân vật bạn yêu, tỏa sáng theo cách riêng 🍯</span>
        </div>
      </footer>
    </div>
  );
}
