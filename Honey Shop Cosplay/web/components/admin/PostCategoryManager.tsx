'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { PostCategory } from '../../lib/types';
import { AdminButton, AdminCard, AdminInput } from './AdminUI';
import { AdminDataTable, useAdminPagedList, updateAdminTableFilter, type AdminDataTableColumn } from './AdminDataTable';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể lưu dữ liệu');
  return data as T;
}

export function PostCategoryManager() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { rows: categories, loading, loadingMore, hasMore, error: loadError, loadMore, reload } = useAdminPagedList<PostCategory>('/admin/post-categories', filters);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { void api<{ user: { role: string } }>('/auth/me').then(data => setIsAdmin(data.user.role === 'ADMIN')).catch(() => {}); }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try { await api('/post-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); setName(''); reload(); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  async function rename(category: PostCategory) {
    const next = prompt('Tên danh mục mới', category.name)?.trim();
    if (!next || next === category.name) return;
    try { await api(`/post-categories/${category.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: next }) }); reload(); }
    catch (e) { setError((e as Error).message); }
  }
  async function remove(category: PostCategory) {
    if (!confirm(`Xóa danh mục “${category.name}”? Bài viết đang dùng sẽ được bỏ gắn danh mục.`)) return;
    try { await api(`/post-categories/${category.id}`, { method: 'DELETE' }); reload(); }
    catch (e) { setError((e as Error).message); }
  }

  return <div className="space-y-3">
    {(error || loadError) && <AdminCard role="alert" className="border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-none">{error || loadError}</AdminCard>}
    <form onSubmit={add} className="flex flex-col gap-2 border-b border-neutral-200 bg-white px-3 py-2 sm:flex-row">
      <label className="sr-only" htmlFor="content-category-name">Tên danh mục</label>
      <AdminInput id="content-category-name" className="flex-1" placeholder="Ví dụ: Mẹo chọn size" value={name} onChange={e => setName(e.target.value)} required />
      <AdminButton disabled={saving} className="rounded-md px-3 py-2 text-xs"><Plus size={15} />{saving ? 'Đang thêm…' : 'Thêm danh mục'}</AdminButton>
    </form>
    <AdminDataTable columns={[
      { key: 'name', header: 'Tên danh mục', className: 'min-w-[220px]', render: category => <span className="font-semibold text-neutral-900">{category.name}</span> },
      { key: 'slug', header: 'Slug', className: 'min-w-[220px] text-xs text-neutral-500', render: category => `/${category.slug}` },
      { key: 'actions', header: 'Thao tác', className: 'min-w-[120px] text-right', headerClassName: 'text-right', render: category => <div className="inline-flex gap-2"><AdminButton type="button" variant="ghost" aria-label={`Sửa ${category.name}`} className="p-1.5" onClick={() => void rename(category)}><Pencil size={15} /></AdminButton>{isAdmin && <AdminButton type="button" variant="danger" aria-label={`Xóa ${category.name}`} className="p-1.5" onClick={() => void remove(category)}><Trash2 size={15} /></AdminButton>}</div> },
    ] as AdminDataTableColumn<PostCategory>[]} rows={categories} loading={loading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} error={loadError} filters={filters} onFilterChange={(key, value) => setFilters(current => updateAdminTableFilter(current, key, value))} searchPlaceholder="Tìm danh mục theo tên hoặc slug…" minWidth="620px" emptyMessage="Chưa có danh mục phù hợp." />
  </div>;
}
