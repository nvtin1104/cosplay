'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, UserPlus, X } from 'lucide-react';
import type { AuthUser, Post, Product } from '../../lib/types';
import { AdminButton, AdminInput, AdminSelect, AdminSheetSelect, AdminTextarea } from './AdminUI';
import { AdminDataTable, useAdminPagedList, updateAdminTableFilter, type AdminDataTableColumn } from './AdminDataTable';
import { createPortal } from 'react-dom';
import { rentalOrderStatuses, processingStatusLabels, paymentStatusLabels, formatVnd } from '../../lib/rental-status';
import { DashboardStats } from './dashboard/DashboardStats';
import { RentalActionList } from './dashboard/RentalActionList';
import type { DashboardDataResponse } from './dashboard/types';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Có lỗi xảy ra');
  return data as T;
}

function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('honey_admin_user');
      if (cached) setUser(JSON.parse(cached));
    } catch {}
  }, []);
  return user;
}

function LoadMore({ onClick, loading, hasMore }: { onClick: () => void; loading: boolean; hasMore: boolean }) {
  if (!hasMore) return null;
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Đang tải…' : 'Tải thêm'}
      </button>
    </div>
  );
}

function State({ loading, error }: { loading: boolean; error: string }) {
  if (loading) {
    return (
      <div className="admin-card p-8 text-sm text-neutral-500 flex items-center gap-3">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
        Đang tải dữ liệu…
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  return null;
}

export function DashboardData() {
  const [dashboard, setDashboard] = useState<DashboardDataResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api<DashboardDataResponse>('/admin/dashboard')
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {!dashboard ? (
        <State loading={!error} error={error} />
      ) : (
        <div className="space-y-3">
          <DashboardStats stats={dashboard.stats} />
          <RentalActionList rentals={dashboard.rentals} totalCount={Number(dashboard.stats.activeOrders || 0)} />
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 30;

export function ProductManager() {
  const user = useCurrentUser();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { rows: items, loading, loadingMore, hasMore, error, setError, loadMore, reload } = useAdminPagedList<Product>('/admin/products', filters, PAGE_SIZE);

  async function archive(id: string) {
    if (!confirm('Ẩn sản phẩm này khỏi storefront?')) return;
    try {
      await api(`/products/${id}`, { method: 'DELETE' });
      reload();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white px-3 py-1.5">
        <p className="text-sm font-medium text-neutral-500">
          Hiện có <b>{items.length}</b> sản phẩm đã tải
        </p>
        <Link
          href="/admin/products/new"
          prefetch={true}
          className="inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          <Plus size={16} />
          <span>Thêm sản phẩm mới</span>
        </Link>
      </div>

      <AdminDataTable
        columns={[
          { key: 'product', header: 'Sản phẩm', className: 'min-w-[230px]', render: p => <div className="flex items-center gap-2.5">{p.thumbnailUrl ? <img loading="lazy" src={p.thumbnailUrl} alt="" className="h-9 w-9 shrink-0 rounded border border-neutral-200 object-cover" /> : <div className="h-9 w-9 shrink-0 rounded border border-neutral-200 bg-neutral-100" />}<div className="min-w-0"><div className="flex items-center gap-1.5"><b className="truncate text-neutral-900">{p.title}</b>{p.isCombo && <span className="rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-800">Combo</span>}</div><span className="block truncate text-[11px] text-neutral-400">{p.slug}</span></div></div> },
          { key: 'slug', header: 'Slug', className: 'min-w-[150px] max-w-[230px]', render: p => <span className="block truncate text-xs" title={p.slug}>{p.slug}</span> },
          { key: 'price', header: 'Giá test', filter: { key: 'price', label: 'giá', type: 'number', placeholder: '=' }, className: 'min-w-[105px] whitespace-nowrap text-right tabular-nums', headerClassName: 'text-right', render: p => `${(p.testPrice || 0).toLocaleString('vi-VN')}đ` },
          { key: 'quantity', header: 'Số lượng', filter: { key: 'quantity', label: 'số lượng', type: 'number', placeholder: '=' }, className: 'min-w-[85px] text-center tabular-nums', headerClassName: 'text-center', render: p => p.totalQuantity },
          { key: 'status', header: 'Trạng thái', filter: { key: 'status', label: 'trạng thái', type: 'select', options: [{ value: 'AVAILABLE', label: 'Sẵn sàng' }, { value: 'RENTED', label: 'Đang thuê' }, { value: 'MAINTENANCE', label: 'Bảo trì' }] }, className: 'min-w-[120px]', render: p => <span className={`rounded px-2 py-1 text-[10px] font-bold ${p.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : p.status === 'RENTED' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-700'}`}>{p.status === 'AVAILABLE' ? 'Sẵn sàng' : p.status === 'RENTED' ? 'Đang thuê' : p.status === 'MAINTENANCE' ? 'Bảo trì' : p.status}</span> },
          { key: 'actions', header: 'Thao tác', className: 'min-w-[130px] text-right', headerClassName: 'text-right', render: p => <div className="inline-flex items-center gap-2"><Link href={`/cosplay/${p.slug}`} target="_blank" className="text-xs text-neutral-500 hover:text-black" title="Xem storefront"><ExternalLink size={14} /></Link><Link href={{ pathname: '/admin/products/edit', query: { id: p.id } }} className="text-xs font-semibold text-neutral-600 hover:text-black">Sửa</Link>{user?.role === 'ADMIN' && <button onClick={() => void archive(p.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Ẩn</button>}</div> },
        ] as AdminDataTableColumn<Product>[]}
        rows={items} loading={loading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} error={error} filters={filters} onFilterChange={(key, value) => setFilters(current => updateAdminTableFilter(current, key, value))} searchPlaceholder="Tìm sản phẩm theo tên hoặc slug…" minWidth="900px" emptyMessage="Chưa có sản phẩm phù hợp."
      />
    </>
  );
}

type Rental = {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  facebookUrl?: string;
  startDate: string;
  endDate: string;
  deposit?: number;
  totalAmount?: number;
  note?: string;
  status: string;
  orderStatus: string;
  processingStatus: string;
  paymentStatus: string;
  customerId?: string | null;
};

export function RentalManager({ initialRentals = [] }: { initialRentals?: any[] }) {
  const [items, setItems] = useState<Rental[]>(initialRentals);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(initialRentals.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialRentals.length >= PAGE_SIZE);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<{ productId: string; quantity: number; price: number }[]>([]);
  const [savingId, setSavingId] = useState('');

  const load = () => {
    return api<Rental[]>(`/rentals?limit=${PAGE_SIZE}`)
      .then((data) => {
        setItems(data);
        setHasMore(data.length >= PAGE_SIZE);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await api<Rental[]>(`/rentals?limit=${PAGE_SIZE}&offset=${items.length}`);
      setItems((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (initialRentals.length === 0) void load();
    api<Product[]>('/products?limit=200').then(setProducts).catch(() => {});
  }, []);

  function addRow() {
    if (!products.length) return;
    setRows((prev) => [...prev, { productId: products[0].id, quantity: 1, price: products[0].testPrice || 0 }]);
  }
  function updateRow(idx: number, patch: Partial<{ productId: string; quantity: number; price: number }>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api('/rentals', {
        method: 'POST',
        body: JSON.stringify({
          customerName: f.get('customerName'),
          customerEmail: f.get('customerEmail'),
          customerPhone: f.get('customerPhone'),
          startDate: f.get('startDate'),
          endDate: f.get('endDate'),
          deposit: Number(f.get('deposit')) || 0,
          totalAmount: Number(f.get('totalAmount')) || 0,
          note: f.get('note'),
          items: rows,
        }),
      });
      setOpen(false);
      setRows([]);
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function changeStatus(id: string, status: string) {
    setSavingId(id);
    try {
      await api(`/rentals/${id}`, { method: 'PATCH', body: JSON.stringify({ orderStatus: status }) });
      void load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId('');
    }
  }

  return (
    <>
      <div className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-neutral-200 bg-white/95 px-3 backdrop-blur md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="shrink-0 text-base font-bold tracking-tight text-neutral-900">Lịch thuê</h1>
          <span className="hidden text-xs text-neutral-400 sm:inline">{items.length} đơn hàng</span>
          <span className="h-5 border-l border-neutral-200" />
          <span className="truncate text-xs text-neutral-500">Theo dõi khách, thời gian, tiền cọc và trạng thái trả đồ</span>
        </div>
        <button onClick={() => setOpen(!open)} className="ml-3 shrink-0 rounded-md bg-amber-500 px-3 py-2 text-xs font-bold text-neutral-950 transition hover:bg-amber-400">
          {open ? 'Đóng form' : '+ Tạo lịch thuê'}
        </button>
      </div>
      {open && (
        <form onSubmit={create} className="grid gap-4 border-b border-neutral-200 bg-neutral-50 p-3 md:grid-cols-2 md:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput name="customerName" placeholder="Tên khách hàng" required />
            <AdminInput name="customerEmail" type="email" placeholder="Email khách (để liên kết tài khoản & tích điểm)" required />
            <AdminInput name="customerPhone" placeholder="Số điện thoại" />
            <AdminInput name="startDate" type="datetime-local" required />
            <AdminInput name="endDate" type="datetime-local" required />
            <AdminInput name="deposit" type="number" min="0" placeholder="Tiền cọc" />
            <AdminInput name="totalAmount" type="number" min="0" placeholder="Tổng tiền" />
          </div>
          <AdminTextarea name="note" placeholder="Ghi chú" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Sản phẩm thuê</span>
              <button type="button" onClick={addRow} className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                + Thêm sản phẩm
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {rows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <AdminSelect
                    className="flex-1"
                    ariaLabel="Sản phẩm thuê"
                    options={products.map(product => ({ value: product.id, label: product.title }))}
                    value={row.productId}
                    onChange={(productId) => updateRow(idx, { productId })}
                  />
                  <AdminInput
                    className="w-20"
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) || 1 })}
                  />
                  <AdminInput
                    className="w-28"
                    type="number"
                    min="0"
                    value={row.price}
                    onChange={(e) => updateRow(idx, { price: Number(e.target.value) || 0 })}
                  />
                  <AdminButton type="button" variant="danger" onClick={() => removeRow(idx)} className="px-2 py-1 text-xs">
                    Xóa
                  </AdminButton>
                </div>
              ))}
            </div>
          </div>
          <AdminButton className="px-4 py-3">Lưu lịch thuê</AdminButton>
        </form>
      )}
      {loading && items.length === 0 ? <State loading={true} error="" /> : <RentalTable items={items} savingId={savingId} onStatusChange={changeStatus} />}
      {error && <div className="px-3 pt-3 text-sm text-red-700">{error}</div>}
      <div className="px-3"><LoadMore onClick={loadMore} loading={loadingMore} hasMore={hasMore} /></div>
    </>
  );
}

function RentalTable({ items, savingId, onStatusChange }: {
  items: Rental[];
  savingId: string;
  onStatusChange: (id: string, status: string) => void;
}) {
  const columns: AdminDataTableColumn<Rental>[] = [
    { key: 'customer', header: 'Khách hàng', className: 'min-w-[190px]', render: row => row.customerId ? <Link href={`/admin/customers/${row.customerId}`} className="font-semibold text-neutral-900 hover:text-amber-800 hover:underline">{row.customerName}</Link> : <span className="font-semibold text-neutral-900">{row.customerName}</span> },
    { key: 'contact', header: 'Liên hệ', className: 'min-w-[230px]', render: row => <span className="block truncate text-xs" title={[row.customerPhone, row.customerEmail].filter(Boolean).join(' · ')}>{[row.customerPhone, row.customerEmail].filter(Boolean).join(' · ') || '—'}</span> },
    { key: 'facebook', header: 'Facebook', className: 'min-w-[105px]', render: row => row.facebookUrl ? <a href={row.facebookUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-700 hover:underline">Mở hồ sơ ↗</a> : <span className="text-neutral-300">—</span> },
    { key: 'dates', header: 'Thời gian thuê', className: 'min-w-[190px] whitespace-nowrap tabular-nums', render: row => <>{new Date(row.startDate).toLocaleDateString('vi-VN')} <span className="text-neutral-300">→</span> {new Date(row.endDate).toLocaleDateString('vi-VN')}</> },
    { key: 'deposit', header: 'Tiền cọc', className: 'min-w-[100px] whitespace-nowrap text-right tabular-nums', headerClassName: 'text-right', render: row => formatVnd(Number(row.deposit || 0)) },
    { key: 'total', header: 'Tổng tiền', className: 'min-w-[110px] whitespace-nowrap text-right font-semibold tabular-nums', headerClassName: 'text-right', render: row => formatVnd(Number(row.totalAmount || 0)) },
    { key: 'note', header: 'Ghi chú', className: 'min-w-[170px] max-w-[260px]', render: row => <span className="block truncate text-xs text-neutral-500" title={row.note || ''}>{row.note || '—'}</span> },
    { key: 'orderStatus', header: 'Trạng thái đơn', className: 'relative min-w-[175px] !p-0', render: row => <AdminSheetSelect ariaLabel={`Trạng thái đơn thuê ${row.id}`} value={row.orderStatus || row.status} disabled={['RETURNED', 'CANCELLED'].includes(row.orderStatus || row.status) || savingId === row.id} onChange={status => onStatusChange(row.id, status)} options={rentalOrderStatuses.map(({ value, label }) => ({ value, label }))} /> },
    { key: 'processingStatus', header: 'Xử lý', className: 'min-w-[115px]', render: row => <span className="text-xs font-medium">{processingStatusLabels[row.processingStatus] || row.processingStatus}</span> },
    { key: 'paymentStatus', header: 'Thanh toán', className: 'min-w-[125px]', render: row => <span className="text-xs font-medium">{paymentStatusLabels[row.paymentStatus] || row.paymentStatus}</span> },
    { key: 'details', header: '', className: 'min-w-[80px]', render: row => <Link href={`/admin/rentals/${row.id}`} className="text-xs font-semibold text-amber-800 hover:underline">Chi tiết</Link> },
  ];

  return <AdminDataTable columns={columns} rows={items} emptyMessage="Chưa có lịch thuê." minWidth="1420px" />;
}

export function PostManager({ initialPosts = [] }: { initialPosts?: Post[] }) {
  const user = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);

  const load = () => {
    return api<Post[]>(`/posts?limit=${PAGE_SIZE}`)
      .then((data) => {
        setItems(data);
        setHasMore(data.length >= PAGE_SIZE);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await api<Post[]>(`/posts?limit=${PAGE_SIZE}&offset=${items.length}`);
      setItems((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (initialPosts.length === 0) {
      void load();
    }
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      title: f.get('title'),
      slug: f.get('slug'),
      excerpt: f.get('excerpt'),
      content: f.get('content'),
      type: f.get('type'),
    };
    try {
      if (editing) {
        await api(`/posts/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setEditing(null);
      } else {
        await api('/posts', { method: 'POST', body: JSON.stringify({ ...payload, status: 'DRAFT' }) });
        setOpen(false);
      }
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function publish(id: string) {
    try {
      await api(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'PUBLISHED' }) });
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa vĩnh viễn bài viết này?')) return;
    try {
      await api(`/posts/${id}`, { method: 'DELETE' });
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const form = (post?: Post | null) => (
    <form onSubmit={save} className="admin-card mb-6 grid gap-4 p-6">
      <AdminInput name="title" placeholder="Tiêu đề" defaultValue={post?.title} required />
      <AdminInput name="slug" placeholder="slug-bai-viet" defaultValue={post?.slug} required />
      <AdminSelect name="type" ariaLabel="Loại nội dung" defaultValue={post?.type || 'ARTICLE'} searchable={false} options={[{ value: 'ARTICLE', label: 'Bài viết' }, { value: 'GUIDE', label: 'Hướng dẫn' }]} />
      <AdminTextarea name="excerpt" placeholder="Tóm tắt" defaultValue={post?.excerpt ?? undefined} />
      <AdminTextarea className="min-h-40" name="content" placeholder="Nội dung" defaultValue={post?.content} required />
      <div className="flex gap-3">
        <AdminButton className="px-4 py-3">
          {post ? 'Lưu thay đổi' : 'Lưu nháp'}
        </AdminButton>
        <AdminButton variant="secondary"
          type="button"
          onClick={() => (post ? setEditing(null) : setOpen(false))}
          className="px-4 py-3"
        >
          Hủy
        </AdminButton>
      </div>
      {!post && <p className="text-xs text-neutral-400">Bài viết sẽ lưu ở dạng nháp{isAdmin ? '' : ' — cần ADMIN xuất bản'}.</p>}
    </form>
  );

  return (
    <>
      {error && <State loading={false} error={error} />}
      {editing ? (
        form(editing)
      ) : (
        <>
          <div className="mb-5 flex justify-end">
            <button onClick={() => setOpen(!open)} className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white">
              {open ? 'Đóng form' : '+ Viết bài'}
            </button>
          </div>
          {open && form(null)}
        </>
      )}
      {loading && items.length === 0 ? (
        <State loading={true} error="" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((p) => (
            <article className="admin-card p-5" key={p.id}>
              <div className="flex justify-between text-xs font-semibold text-neutral-400">
                <span>{p.type}</span>
                <span>{p.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold">{p.title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{p.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-3">
                <button onClick={() => setEditing(p)} className="text-xs font-semibold text-neutral-600 hover:text-black">
                  Sửa
                </button>
                {isAdmin && p.status !== 'PUBLISHED' && (
                  <button onClick={() => publish(p.id)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                    Xuất bản
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => remove(p.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">
                    Xóa
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <LoadMore onClick={loadMore} loading={loadingMore} hasMore={hasMore} />
    </>
  );
}

function inviteStatus(invite: any): { label: string; className: string } {
  if (invite.acceptedAt) return { label: 'Đã chấp nhận', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  if (new Date(invite.expiresAt) < new Date()) return { label: 'Đã hết hạn', className: 'bg-neutral-100 text-neutral-500 border border-neutral-200' };
  return { label: 'Đang chờ', className: 'bg-amber-50 text-amber-700 border border-amber-200' };
}

export function UserManager() {
  const me = useCurrentUser();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { rows: users, loading, loadingMore, hasMore, error, loadMore, reload } = useAdminPagedList<any>('/admin/users', filters);
  const [invites, setInvites] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);

  useEffect(() => {
    api<any[]>('/admin/invitations?limit=30').then(setInvites).catch((e) => setMessage(e.message));
  }, []);

  useEffect(() => {
    if (!inviteOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setInviteOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [inviteOpen]);

  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteSaving(true);
    const f = new FormData(e.currentTarget);
    try {
      const result = await api<any>('/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: f.get('email'), role: f.get('role') }),
      });
      setMessage(result.inviteUrl ? `Link demo: ${result.inviteUrl}` : 'Đã gửi lời mời qua email.');
      setInviteOpen(false);
      reload();
      void api<any[]>('/admin/invitations?limit=30').then(setInvites).catch((error) => setMessage(error.message));
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setInviteSaving(false);
    }
  }

  async function updateUser(id: string, patch: { role?: string; active?: boolean }) {
    setSavingId(id);
    try {
      await api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      reload();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSavingId('');
    }
  }

  return (
    <>
    <div className="min-w-0">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-2">
        <span className="text-xs text-neutral-500">{users.length} tài khoản đã tải</span>
        <button type="button" onClick={() => { setMessage(''); setInviteOpen(true); }} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-black px-3 text-xs font-semibold text-white hover:bg-neutral-800"><UserPlus size={14} />Mời thành viên</button>
      </div>
      {message && <p role="status" className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{message}</p>}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <AdminDataTable columns={[
          { key: 'name', header: 'Nhân sự', className: 'min-w-[165px]', render: row => <span className="font-semibold text-neutral-900">{row.name}</span> },
          { key: 'email', header: 'Email', className: 'min-w-[210px] text-xs', render: row => row.email },
          { key: 'role', header: 'Vai trò', filter: { key: 'role', label: 'vai trò', type: 'select', options: [{ value: 'STAFF', label: 'STAFF' }, { value: 'ADMIN', label: 'ADMIN' }] }, className: 'min-w-[120px]', render: row => <AdminSelect className="!mt-0 w-full" size="compact" ariaLabel={`Vai trò của ${row.name}`} value={row.role} disabled={row.id === me?.id || savingId === row.id} searchable={false} allowEmpty={false} options={[{ value: 'STAFF', label: 'STAFF' }, { value: 'ADMIN', label: 'ADMIN' }]} onChange={role => void updateUser(row.id, { role })} /> },
          { key: 'active', header: 'Trạng thái', filter: { key: 'active', label: 'trạng thái', type: 'select', options: [{ value: '1', label: 'Hoạt động' }, { value: '0', label: 'Đã khóa' }] }, className: 'min-w-[120px]', render: row => <button type="button" disabled={row.id === me?.id || savingId === row.id} onClick={() => void updateUser(row.id, { active: !row.active })} className={`rounded px-2 py-1 text-[10px] font-bold disabled:opacity-50 ${row.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>{row.active ? 'Hoạt động' : 'Đã khóa'}</button> },
        ] as AdminDataTableColumn<any>[]} rows={users} loading={loading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} error={error} filters={filters} onFilterChange={(key, value) => setFilters(current => updateAdminTableFilter(current, key, value))} searchPlaceholder="Tìm nhân sự theo tên hoặc email…" minWidth="680px" emptyMessage="Không có nhân sự phù hợp." />
      </div>
      <div className="min-w-0">
        <div className="border border-neutral-200 bg-white p-4">
          <h2 className="font-bold">Lời mời gần đây</h2>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {invites.length ? (
              invites.map((i) => {
                const st = inviteStatus(i);
                return (
                  <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{i.email}</p>
                      <p className="text-xs text-neutral-400">{i.role}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}>{st.label}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-neutral-500">Chưa có lời mời nào.</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
    {inviteOpen && typeof document !== 'undefined' && createPortal(
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setInviteOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3"><h2 id="invite-modal-title" className="font-bold">Mời thành viên</h2><button type="button" onClick={() => setInviteOpen(false)} aria-label="Đóng cửa sổ mời thành viên" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"><X size={17} /></button></div>
          <form onSubmit={invite} className="grid gap-3 p-4">
            <label className="grid gap-1.5 text-xs font-semibold text-neutral-600">Email thành viên<AdminInput autoFocus name="email" type="email" placeholder="staff@example.com" required /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-neutral-600">Vai trò<AdminSelect name="role" ariaLabel="Vai trò thành viên" defaultValue="STAFF" searchable={false} options={[{ value: 'STAFF', label: 'STAFF' }, { value: 'ADMIN', label: 'ADMIN' }]} /></label>
            {message && <p role="alert" className="break-all text-xs text-red-700">{message}</p>}
            <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3"><AdminButton type="button" variant="secondary" className="rounded-md px-3 py-2 text-xs" onClick={() => setInviteOpen(false)}>Hủy</AdminButton><AdminButton disabled={inviteSaving} className="rounded-md px-3 py-2 text-xs">{inviteSaving ? 'Đang gửi…' : 'Gửi lời mời'}</AdminButton></div>
          </form>
        </section>
      </div>, document.body
    )}
    </>
  );
}

