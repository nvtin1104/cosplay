'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CalendarDays, FileText, FolderTree, LayoutDashboard, LogOut, Menu, Tags, Users, X, BookOpen, Settings, ChevronDown, Layers, MessageCircleHeart, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import type { AuthUser } from '../../lib/types';

const links = [
  ['/admin', 'Tổng quan', LayoutDashboard],
  ['/admin/products', 'Kho đồ', Box],
  ['/admin/categories', 'Danh mục sản phẩm', FolderTree],
  ['/admin/tags', 'Tags', Tags],
  ['/admin/rentals', 'Lịch thuê', CalendarDays],
  ['/admin/customers', 'Tài khoản khách', Users],
  ['/admin/feedback', 'Feedback sản phẩm', MessageCircleHeart],
  ['/admin/settings', 'Cài đặt site', Settings],
  ['/admin/users', 'Nhân sự', Users],
] as const;

const contentLinks = [
  ['/admin/posts', 'Bài viết', FileText],
  ['/admin/guides', 'Hướng dẫn', BookOpen],
  ['/admin/post-categories', 'Danh mục nội dung', FolderTree],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const denseListRoutes = ['/admin/products', '/admin/tags', '/admin/customers', '/admin/feedback', '/admin/users', '/admin/posts', '/admin/post-categories'];
  const isDenseListPage = denseListRoutes.includes(path);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 'md:ml-[72px]' : 'md:ml-64';

  useEffect(() => {
    setCollapsed(localStorage.getItem('honey_admin_sidebar_collapsed') === 'true');
  }, []);

  useEffect(() => {
    if (contentLinks.some(([href]) => path === href || path.startsWith(`${href}/`))) setContentOpen(true);
  }, [path]);

  function toggleSidebar() {
    setCollapsed(value => {
      localStorage.setItem('honey_admin_sidebar_collapsed', String(!value));
      return !value;
    });
  }

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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-neutral-200 bg-white transition-[width,transform] duration-200 md:translate-x-0 ${collapsed ? 'w-[72px] p-3' : 'w-64 p-5'} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/admin" prefetch={true} title="HONEY / ADMIN" className={`overflow-hidden whitespace-nowrap text-lg font-extrabold tracking-tight ${collapsed ? 'sr-only' : ''}`}>
            HONEY / ADMIN
          </Link>
          <button aria-label="Đóng thanh điều hướng" className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 md:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav className="admin-sidebar-scroll mt-7 min-h-0 flex-1 space-y-1 overflow-y-auto pb-4 pr-1">
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
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${collapsed ? 'justify-center px-0' : ''} ${
                path === href || (href !== '/admin' && path.startsWith(href))
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-black active:scale-[0.98]'
              }`}
            >
              <Icon size={18} />
              {!collapsed && label}
            </Link>
          ))}
          <div className="pt-4">
            <button type="button" title={collapsed ? 'Nội dung' : undefined} aria-expanded={contentOpen} aria-controls="admin-content-submenu" onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                localStorage.setItem('honey_admin_sidebar_collapsed', 'false');
                setContentOpen(true);
              } else setContentOpen(value => !value);
            }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${contentOpen ? 'text-neutral-900' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'}`}>
              <span className={`flex items-center gap-3 ${collapsed ? 'mx-auto' : ''}`}><Layers size={17} />{!collapsed && <span className="text-[10px] uppercase tracking-[.2em]">Nội dung</span>}</span>
              {!collapsed && <ChevronDown size={16} className={`transition-transform duration-200 ${contentOpen ? 'rotate-180' : ''}`} />}
            </button>
            <div id="admin-content-submenu" aria-hidden={!contentOpen || collapsed} className={`ml-3 grid overflow-hidden border-l border-neutral-200 pl-3 transition-[grid-template-rows,opacity,margin] duration-200 ${contentOpen && !collapsed ? 'mt-1 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'}`}>
              <div className="min-h-0 overflow-hidden">
                <div className="space-y-1 py-0.5">
              {contentLinks.map(([href, label, Icon]) => (
                <Link key={href} href={href} prefetch={true} onClick={() => { setOpen(false); if (path !== href) startTransition(() => router.push(href)); }}
                  tabIndex={contentOpen ? 0 : -1}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${path === href || path.startsWith(`${href}/`) ? 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-100' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black active:scale-[0.98]'}`}>
                  <Icon size={17} />{label}
                </Link>
              ))}
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="mt-auto shrink-0 border-t border-neutral-200 pt-4">
          {!collapsed && <><p suppressHydrationWarning className="truncate text-sm font-semibold">{user?.name || 'Đang tải…'}</p>
          <p suppressHydrationWarning className="truncate text-xs text-neutral-500">{user?.email || 'admin@honeyshop.local'}</p></>}
          <button
            onClick={logout}
            title="Đăng xuất"
            className={`mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-black transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} /> {!collapsed && 'Đăng xuất'}
          </button>
        </div>
      </aside>
      {open && <button type="button" aria-label="Đóng thanh điều hướng" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/30 md:hidden" />}
      <div className={`min-w-0 transition-[margin] duration-200 ${sidebarWidth}`}>
        <header className={`flex items-center justify-between border-b border-neutral-200 bg-white ${isDenseListPage ? 'h-11 px-3' : 'h-16 px-5 md:px-8'}`}>
          <button aria-label="Mở thanh điều hướng" aria-expanded={open} className="rounded-md p-1 text-neutral-600 hover:bg-neutral-100 md:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="hidden items-center gap-3 md:flex">
            <button onClick={toggleSidebar} aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} title={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            {!isDenseListPage && <p className="text-sm text-neutral-500">Hệ thống vận hành Honey Shop</p>}
          </div>
          <span suppressHydrationWarning className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold">
            {user?.role || 'ADMIN'}
          </span>
        </header>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

