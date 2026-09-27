'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Folder, Pencil, Plus, Trash2 } from 'lucide-react';
import type { PostCategory } from '../../lib/types';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể lưu dữ liệu');
  return data as T;
}

export function PostCategoryManager() {
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try { setCategories(await api<PostCategory[]>('/post-categories')); setError(''); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); void api<{ user: { role: string } }>('/auth/me').then(data => setIsAdmin(data.user.role === 'ADMIN')).catch(() => {}); }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try { await api('/post-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); setName(''); await load(); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  async function rename(category: PostCategory) {
    const next = prompt('Tên danh mục mới', category.name)?.trim();
    if (!next || next === category.name) return;
    try { await api(`/post-categories/${category.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: next }) }); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function remove(category: PostCategory) {
    if (!confirm(`Xóa danh mục “${category.name}”? Bài viết đang dùng sẽ được bỏ gắn danh mục.`)) return;
    try { await api(`/post-categories/${category.id}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError((e as Error).message); }
  }

  return <div className="space-y-5">
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <form onSubmit={add} className="admin-card flex flex-col gap-3 p-5 sm:flex-row">
      <label className="sr-only" htmlFor="content-category-name">Tên danh mục</label>
      <input id="content-category-name" className="admin-input flex-1" placeholder="Ví dụ: Mẹo chọn size" value={name} onChange={e => setName(e.target.value)} required />
      <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"><Plus size={17} />{saving ? 'Đang thêm…' : 'Thêm danh mục'}</button>
    </form>
    <section className="admin-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4"><h2 className="font-bold">Danh sách danh mục</h2><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{categories.length}</span></div>
      {loading ? <p className="p-5 text-sm text-neutral-500">Đang tải danh mục…</p> : categories.length === 0 ? <div className="p-10 text-center"><Folder className="mx-auto text-neutral-300" size={30} /><p className="mt-3 font-semibold">Chưa có danh mục nội dung</p><p className="mt-1 text-sm text-neutral-500">Tạo danh mục để nhóm các bài viết và hướng dẫn.</p></div> : <ul className="divide-y divide-neutral-100">{categories.map(category => <li key={category.id} className="flex items-center gap-4 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800"><Folder size={18} /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{category.name}</p><p className="mt-0.5 text-xs text-neutral-500">/{category.slug}</p></div><button onClick={() => void rename(category)} aria-label={`Sửa ${category.name}`} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"><Pencil size={16} /></button>{isAdmin && <button onClick={() => void remove(category)} aria-label={`Xóa ${category.name}`} className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button>}</li>)}</ul>}
    </section>
  </div>;
}
