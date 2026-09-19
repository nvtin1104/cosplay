'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Menu, Sparkles, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[#24150e] bg-[#fff6dc]/95 backdrop-blur-md">
      <div className="header-shell flex h-[74px] md:h-[84px] items-center justify-between gap-4">
        {/* Logo chữ responsive */}
        <Link href="/" className="flex items-center shrink-0">
          <div className="relative h-9 sm:h-11 md:h-12 w-auto">
            <Image
              src="/assets/logo.png"
              alt="Honey Shop Cosplay"
              width={260}
              height={65}
              priority
              className="h-9 sm:h-11 md:h-12 w-auto object-contain"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:gap-8 text-sm lg:text-base font-extrabold text-[#24150e] md:flex">
          <Link href="/cosplay" className="transition-colors hover:text-[#f07d24]">
            Kho đồ
          </Link>
          <Link href="/#quy-trinh" className="transition-colors hover:text-[#f07d24]">
            Cách thuê
          </Link>
          <Link href="/#feedback" className="transition-colors hover:text-[#f07d24]">
            Feedback
          </Link>
          <Link href="/blog" className="transition-colors hover:text-[#f07d24]">
            Chuyện Honey
          </Link>
          <Link href="/huong-dan" className="transition-colors hover:text-[#f07d24]">
            Hướng dẫn
          </Link>
        </nav>

        {/* Desktop CTA & Mobile Menu Button */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/cosplay"
            className="sticker hidden items-center gap-2 rounded-full bg-[#ffe75c] px-5 py-2.5 text-sm font-extrabold text-[#24150e] md:inline-flex hover:bg-[#ffd93d]"
          >
            <Sparkles size={16} />
            <span>Chọn nhân vật</span>
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setOpen(!open)}
            className="flex md:hidden items-center justify-center h-10 w-10 rounded-full border-2 border-[#24150e] bg-white text-[#24150e] shadow-[2px_3px_0_#24150e] active:translate-x-0.5 active:translate-y-0.5"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Floating Collapse Menu (Nổi riêng biệt) */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop mờ che nền */}
          <div
            className="fixed inset-0 bg-[#24150e]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Card nổi riêng biệt */}
          <div className="fixed top-[84px] left-4 right-4 z-50 mx-auto max-w-sm">
            <nav className="sticker cut-card overflow-hidden bg-[#fff6dc] p-6 border-2 border-[#24150e] shadow-[8px_10px_0_#24150e] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b-2 border-[#24150e] pb-3 mb-4">
                <span className="display text-lg font-extrabold text-[#24150e] flex items-center gap-2">
                  <span>🍯</span> Menu Honey Shop
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border-2 border-[#24150e] bg-white p-1 text-[#24150e] shadow-[2px_2px_0_#24150e]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { href: '/cosplay', label: 'Kho đồ cosplay 🎀' },
                  { href: '/#quy-trinh', label: 'Cách thuê đồ 🍯' },
                  { href: '/#feedback', label: 'Feedback khách thật 💌' },
                  { href: '/blog', label: 'Chuyện Honey 📖' },
                  { href: '/huong-dan', label: 'Hướng dẫn & Lưu ý 💡' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    onClick={() => setOpen(false)}
                    href={item.href as any}
                    className="flex items-center justify-between border-2 border-[#24150e] bg-white px-4 py-3 text-base font-extrabold text-[#24150e] shadow-[3px_4px_0_#24150e] transition-all active:translate-x-0.5 active:translate-y-0.5 hover:bg-[#ffe75c]"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t-2 border-[#24150e]">
                <Link
                  onClick={() => setOpen(false)}
                  href="/cosplay"
                  className="sticker flex items-center justify-center gap-2 rounded-full bg-[#ff9b35] py-3.5 text-center text-base font-extrabold text-white shadow-[4px_5px_0_#24150e]"
                >
                  <Sparkles size={18} />
                  <span>Chọn nhân vật ngay</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
