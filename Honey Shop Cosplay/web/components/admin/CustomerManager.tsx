'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ExternalLink, UserRound, Wallet } from 'lucide-react';
import { AdminButton, AdminInput } from './AdminUI';
import { AdminDataTable, useAdminPagedList, updateAdminTableFilter, type AdminDataTableColumn } from './AdminDataTable';

type Customer = { id: string; email: string; name: string; facebookUrl?: string | null; phone?: string | null; active: boolean; createdAt: string; points: number; rentalCount: number };
async function api<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`/api/v1${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không thể hoàn tất thao tác.'); return data as T; }

export function CustomerManager() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { rows: items, loading, loadingMore, hasMore, error, setError, loadMore, reload } = useAdminPagedList<Customer>('/admin/customers', filters);
  const [busyId, setBusyId] = useState('');
  const [adjustCustomer, setAdjustCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  async function toggle(customer: Customer) { setBusyId(customer.id); try { await api(`/admin/customers/${customer.id}`, { method: 'PATCH', body: JSON.stringify({ active: !customer.active }) }); reload(); } catch (e) { setError((e as Error).message); } finally { setBusyId(''); } }
  async function saveProfile(event: FormEvent) { event.preventDefault(); if (!editCustomer) return; setBusyId(editCustomer.id); try { await api(`/admin/customers/${editCustomer.id}`, { method: 'PATCH', body: JSON.stringify({ name: editName, facebookUrl: editFacebook, phone: editPhone }) }); setEditCustomer(null); reload(); } catch (e) { setError((e as Error).message); } finally { setBusyId(''); } }
  async function adjust(event: FormEvent) { event.preventDefault(); if (!adjustCustomer) return; setBusyId(adjustCustomer.id); try { await api(`/admin/customers/${adjustCustomer.id}/points`, { method: 'POST', body: JSON.stringify({ pointsDelta: Number(delta), note: reason }) }); setAdjustCustomer(null); setDelta(''); setReason(''); reload(); } catch (e) { setError((e as Error).message); } finally { setBusyId(''); } }

  const columns: AdminDataTableColumn<Customer>[] = [
    { key: 'name', header: 'Khách hàng', className: 'min-w-[170px]', render: customer => <Link href={`/admin/customers/${customer.id}`} className="inline-flex items-center gap-2 font-semibold text-neutral-900 hover:text-amber-800 hover:underline"><UserRound size={14} className="text-neutral-400" />{customer.name}</Link> },
    { key: 'email', header: 'Email', className: 'min-w-[200px] text-xs', render: customer => customer.email },
    { key: 'phone', header: 'Điện thoại', className: 'min-w-[130px] text-xs', render: customer => customer.phone ? <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a> : '—' },
    { key: 'points', header: 'Điểm', className: 'min-w-[90px] text-right tabular-nums', headerClassName: 'text-right', render: customer => <span className="inline-flex items-center gap-1 font-semibold text-amber-800"><Wallet size={13} />{customer.points.toLocaleString('vi-VN')}</span> },
    { key: 'rentals', header: 'Đơn thuê', className: 'min-w-[80px] text-center tabular-nums', headerClassName: 'text-center', render: customer => customer.rentalCount },
    { key: 'createdAt', header: 'Ngày tạo', filter: { key: 'date', label: 'ngày tạo', type: 'date' }, className: 'min-w-[105px] whitespace-nowrap text-xs tabular-nums', render: customer => new Date(customer.createdAt).toLocaleDateString('vi-VN') },
    { key: 'active', header: 'Trạng thái', filter: { key: 'active', label: 'trạng thái', type: 'select', options: [{ value: '1', label: 'Hoạt động' }, { value: '0', label: 'Đã khóa' }] }, className: 'min-w-[105px]', render: customer => <span className={`rounded px-2 py-1 text-[10px] font-bold ${customer.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>{customer.active ? 'Hoạt động' : 'Đã khóa'}</span> },
    { key: 'actions', header: 'Thao tác', className: 'min-w-[205px]', render: customer => <div className="flex items-center gap-2 whitespace-nowrap"><button type="button" onClick={() => { setAdjustCustomer(customer); setEditCustomer(null); setDelta(''); setReason(''); }} className="text-[11px] font-semibold text-amber-800 hover:underline">Điểm</button><button type="button" onClick={() => { setEditCustomer(customer); setAdjustCustomer(null); setEditName(customer.name); setEditFacebook(customer.facebookUrl || ''); setEditPhone(customer.phone || ''); }} className="text-[11px] font-semibold text-neutral-600 hover:underline">Sửa</button>{customer.facebookUrl && <a href={customer.facebookUrl} target="_blank" rel="noreferrer" aria-label={`Mở Facebook ${customer.name}`} className="text-blue-700"><ExternalLink size={13} /></a>}<button type="button" disabled={busyId === customer.id} onClick={() => void toggle(customer)} className={`text-[11px] font-semibold ${customer.active ? 'text-red-600' : 'text-emerald-700'}`}>{customer.active ? 'Khóa' : 'Mở khóa'}</button></div> },
  ];

  return <div className="space-y-3">
    <AdminDataTable columns={columns} rows={items} loading={loading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} error={error} filters={filters} onFilterChange={(key, value) => setFilters(current => updateAdminTableFilter(current, key, value))} searchPlaceholder="Tìm khách theo tên, email hoặc số điện thoại…" minWidth="1060px" emptyMessage="Chưa có tài khoản khách phù hợp." />
    {editCustomer && <form onSubmit={saveProfile} className="grid gap-2 border border-neutral-200 bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]"><span className="self-center text-xs font-bold text-neutral-600">Sửa hồ sơ · {editCustomer.email}</span><AdminInput aria-label="Tên hiển thị" className="!min-h-9 py-1.5 text-sm" required value={editName} onChange={e => setEditName(e.target.value)} placeholder="Tên hiển thị" /><AdminInput aria-label="Link Facebook" className="!min-h-9 py-1.5 text-sm" type="url" value={editFacebook} onChange={e => setEditFacebook(e.target.value)} placeholder="Link Facebook" /><AdminInput aria-label="Số điện thoại" className="!min-h-9 py-1.5 text-sm" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Số điện thoại" /><div className="flex gap-2"><AdminButton disabled={busyId === editCustomer.id} className="px-3 py-2">Lưu</AdminButton><AdminButton type="button" variant="secondary" className="px-3 py-2" onClick={() => setEditCustomer(null)}>Hủy</AdminButton></div></form>}
    {adjustCustomer && <form onSubmit={adjust} className="grid gap-2 border border-amber-200 bg-amber-50/60 p-3 sm:grid-cols-[1fr_180px_1fr_auto_auto]"><span className="self-center text-xs font-bold text-amber-900">Điều chỉnh điểm · {adjustCustomer.name}</span><AdminInput aria-label="Số điểm điều chỉnh" className="!min-h-9 py-1.5 text-sm" type="number" step="1" value={delta} onChange={e => setDelta(e.target.value)} placeholder="+ / − điểm" required /><AdminInput aria-label="Lý do điều chỉnh" className="!min-h-9 py-1.5 text-sm" value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do điều chỉnh" required /><div className="flex gap-2"><AdminButton disabled={busyId === adjustCustomer.id} className="px-3 py-2">Lưu điểm</AdminButton><AdminButton type="button" variant="secondary" className="px-3 py-2" onClick={() => setAdjustCustomer(null)}>Hủy</AdminButton></div></form>}
  </div>;
}
