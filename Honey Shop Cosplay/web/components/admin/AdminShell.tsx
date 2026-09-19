'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CalendarDays, FileText, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import type { AuthUser } from '../../lib/types';

const links = [
  ['/admin', 'Tổng quan', LayoutDashboard],
  ['/admin/products', 'Kho đồ', Box],
  ['/admin/rentals', 'Lịch thuê', CalendarDays],
  ['/admin/posts', 'Nội dung', FileText],
  ['/admin/users', 'Nhân sự', Users],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('honey_admin_user');
      if (cached) setUser(JSON.parse(cached));
    } catch {}

    fetch('/api/v1/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          sessionStorage.removeItem('honey_admin_user');
          router.replace('/admin/login');
          return;
        }
        const data = await r.json();
        if (data?.user) {
          setUser(data.user);
          try {
            sessionStorage.setItem('honey_admin_user', JSON.stringify(data.user));
          } catch {}
        }
      })
      .catch(() => {
        sessionStorage.removeItem('honey_admin_user');
        router.replace('/admin/login');
      });
  }, [router]);

  async function logout() {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    sessionStorage.removeItem('honey_admin_user');
    window.location.href = '/admin/login';
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111]">
      {/* Top Loading Progress Bar */}
      {isPending && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-amber-200 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse" />
        </div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 bg-white p-5 transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/admin" prefetch={true} className="text-lg font-extrabold tracking-tight">
            HONEY / ADMIN
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav className="mt-10 space-y-1">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onClick={() => {
                setOpen(false);
                if (path !== href) {
                  startTransition(() => {
                    router.push(href);
                  });
                }
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                path === href || (href !== '/admin' && path.startsWith(href))
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-black active:scale-[0.98]'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 border-t border-neutral-200 pt-4">
          <p suppressHydrationWarning className="truncate text-sm font-semibold">{user?.name || 'Đang tải…'}</p>
          <p suppressHydrationWarning className="truncate text-xs text-neutral-500">{user?.email || 'admin@honeyshop.local'}</p>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-black transition-colors"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-5 md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <p className="hidden text-sm text-neutral-500 md:block">Hệ thống vận hành Honey Shop</p>
          <span suppressHydrationWarning className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold">
            {user?.role || 'ADMIN'}
          </span>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

