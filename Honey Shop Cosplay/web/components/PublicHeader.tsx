'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles, X, Heart, BookOpen, Shirt, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Trang chủ', icon: null },
    { href: '/cosplay', label: 'Kho đồ cosplay', icon: Shirt, badge: 'Hot' },
    { href: '/#quy-trinh', label: 'Cách thuê', icon: HelpCircle },
    { href: '/#feedback', label: 'Feedback', icon: Heart },
    { href: '/blog', label: 'Chuyện Honey', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#ebd7be] bg-[#fffcf5]/92 backdrop-blur-md shadow-[0_4px_24px_rgba(245,140,0,0.05)]">
      <div className="shell flex h-[74px] items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd868] via-[#ffaa2b] to-[#f57400] text-2xl shadow-[0_4px_12px_rgba(245,120,0,0.25)] transition-all duration-300 group-hover:scale-105 group-hover:rotate-6">
            <span>🍯</span>
          </div>
          <div className="flex flex-col">
            <span className="display text-2xl font-extrabold tracking-tight leading-none text-[#382313]">
              <span className="text-[#f57400]">honey</span> shop
              <span className="text-[#ffab00] inline-block animate-pulse ml-0.5">✦</span>
            </span>
            <span className="text-[11px] font-semibold text-[#8c674b] tracking-wider uppercase mt-0.5">
              cosplay rental · sài gòn
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-[#ebd7be] bg-[#fff5e2]/80 p-1.5 shadow-inner md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href as any}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[#e06900] shadow-sm'
                    : 'text-[#4e3422] hover:bg-white/70 hover:text-[#e06900]'
                }`}
              >
                {Icon && <Icon size={15} className={isActive ? 'text-[#f57400]' : 'text-[#8c674b]'} />}
                <span>{link.label}</span>
                {link.badge && (
                  <span className="rounded-full bg-[#ffeed0] px-1.5 py-0.2 text-[10px] font-extrabold text-[#d96600]">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/cosplay"
            className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-[#ff9b28] to-[#f57400] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(245,116,0,0.28)] transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_20px_rgba(245,116,0,0.36)] active:scale-95 sm:inline-flex"
          >
            <Sparkles size={16} />
            <span>Chọn nhân vật</span>
          </Link>

          {/* Mobile Button */}
          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ebd7be] bg-[#fff6e6] text-[#382313] transition-all hover:bg-[#ffeed5] active:scale-95 md:hidden shadow-sm"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="border-t border-[#ebd7be] bg-[#fffcf5] px-4 py-5 shadow-lg md:hidden">
          <div className="shell flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  onClick={() => setOpen(false)}
                  href={link.href as any}
                  className={`flex items-center justify-between rounded-2xl p-3.5 text-base font-bold transition-all ${
                    isActive
                      ? 'bg-[#fff1d6] text-[#e06900]'
                      : 'text-[#4e3422] hover:bg-[#fff6e6]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {Icon ? <Icon size={18} className="text-[#f57400]" /> : <span>🏠</span>}
                    {link.label}
                  </span>
                  {link.badge && (
                    <span className="rounded-full bg-[#ffeed0] px-2 py-0.5 text-xs font-bold text-[#d96600]">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="mt-3 pt-3 border-t border-[#ebd7be]">
              <Link
                onClick={() => setOpen(false)}
                href="/cosplay"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff9b28] to-[#f57400] p-3.5 text-center font-extrabold text-white shadow-[0_4px_14px_rgba(245,116,0,0.25)]"
              >
                <Sparkles size={18} />
                <span>Xem kho đồ cosplay ngay</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
