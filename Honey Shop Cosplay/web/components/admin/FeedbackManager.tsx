'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, EyeOff, MessageCircleHeart, Trash2, X } from 'lucide-react';
import { AdminSelect } from './AdminUI';
import { AdminDataTable, useAdminPagedList, updateAdminTableFilter, type AdminDataTableColumn } from './AdminDataTable';

type Feedback = { id: string; productTitle: string; productSlug: string; rentalId?: string | null; customerName: string; customerEmail?: string | null; content: string; imageUrl?: string | null; hideIdentity: boolean; status: 'PENDING' | 'APPROVED' | 'HIDDEN'; createdAt: string };
const statusLabel = { PENDING: 'Chờ duyệt', APPROVED: 'Đang hiển thị', HIDDEN: 'Đã ẩn' };
async function api<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`/api/v1${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không thể hoàn tất thao tác.'); return data as T; }

export function FeedbackManager() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { rows: items, loading, loadingMore, hasMore, error, setError, loadMore, reload } = useAdminPagedList<Feedback>('/admin/feedback', filters);
  const [busyId, setBusyId] = useState('');
  const [expanded, setExpanded] = useState<Feedback | null>(null);
  async function changeStatus(item: Feedback, status: string) { setBusyId(item.id); try { await api(`/admin/feedback/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); reload(); } catch (e) { setError((e as Error).message); } finally { setBusyId(''); } }
  async function remove(item: Feedback) { if (!confirm('Xóa feedback này?')) return; setBusyId(item.id); try { await api(`/admin/feedback/${item.id}`, { method: 'DELETE' }); if (expanded?.id === item.id) setExpanded(null); reload(); } catch (e) { setError((e as Error).message); } finally { setBusyId(''); } }

  const columns: AdminDataTableColumn<Feedback>[] = [
    { key: 'product', header: 'Sản phẩm', className: 'min-w-[170px]', render: item => <Link href={`/cosplay/${item.productSlug}`} target="_blank" className="inline-flex items-center gap-1 font-semibold text-neutral-900 hover:underline">{item.productTitle}<ExternalLink size={12} /></Link> },
    { key: 'customer', header: 'Khách hàng', className: 'min-w-[145px]', render: item => <span className="inline-flex items-center gap-1.5">{item.customerName}{item.hideIdentity && <EyeOff size={12} className="text-neutral-400" />}</span> },
    { key: 'content', header: 'Nội dung', className: 'min-w-[260px] max-w-[420px]', render: item => <button type="button" onClick={() => setExpanded(expanded?.id === item.id ? null : item)} className="block w-full truncate text-left text-xs text-neutral-600 hover:text-neutral-950" title="Mở nội dung đầy đủ">{item.content}</button> },
    { key: 'date', header: 'Ngày gửi', filter: { key: 'date', label: 'ngày gửi', type: 'date' }, className: 'min-w-[105px] whitespace-nowrap text-xs tabular-nums', render: item => new Date(item.createdAt).toLocaleDateString('vi-VN') },
    { key: 'status', header: 'Trạng thái', filter: { key: 'status', label: 'trạng thái', type: 'select', options: Object.entries(statusLabel).map(([value, label]) => ({ value, label })) }, className: 'min-w-[155px]', render: item => <AdminSelect className="!mt-0 w-full" size="compact" ariaLabel={`Trạng thái feedback ${item.id}`} value={item.status} onChange={value => void changeStatus(item, value)} disabled={busyId === item.id} searchable={false} allowEmpty={false} options={Object.entries(statusLabel).map(([value, label]) => ({ value, label }))} /> },
    { key: 'actions', header: 'Thao tác', className: 'min-w-[80px] text-center', render: item => <button type="button" disabled={busyId === item.id} onClick={() => void remove(item)} aria-label="Xóa feedback" className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 size={15} /></button> },
  ];

  return <div className="space-y-3">
    <AdminDataTable columns={columns} rows={items} loading={loading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} error={error} filters={filters} onFilterChange={(key, value) => setFilters(current => updateAdminTableFilter(current, key, value))} searchPlaceholder="Tìm theo sản phẩm, khách hàng hoặc nội dung…" minWidth="1000px" emptyMessage="Không có feedback phù hợp." />
    {expanded && <section className="relative border border-neutral-200 bg-white p-4"><button type="button" onClick={() => setExpanded(null)} aria-label="Đóng nội dung feedback" className="absolute right-2 top-2 rounded p-1.5 text-neutral-400 hover:bg-neutral-100"><X size={16} /></button><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{expanded.productTitle} · {expanded.customerName}{expanded.customerEmail ? ` · ${expanded.customerEmail}` : ''}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{expanded.content}</p>{expanded.rentalId && <p className="mt-2 text-xs text-neutral-400">Đơn thuê #{expanded.rentalId.slice(0, 8)}</p>}{expanded.imageUrl && <img loading="lazy" src={expanded.imageUrl} alt="Ảnh khách gửi cùng feedback" className="mt-3 max-h-72 rounded-lg border border-neutral-200 object-contain" />}</section>}
    {!loading && items.length === 0 && !error && <div className="flex items-center justify-center gap-2 text-xs text-neutral-400"><MessageCircleHeart size={14} />Điều chỉnh bộ lọc hoặc chọn trạng thái feedback khác.</div>}
  </div>;
}
