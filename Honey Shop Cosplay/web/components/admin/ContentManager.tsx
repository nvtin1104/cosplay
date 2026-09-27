'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Post, PostCategory } from '../../lib/types';

type Kind = 'ARTICLE' | 'GUIDE';
const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể lưu dữ liệu');
  return data as T;
}

export function ContentManager({ type }: { type: Kind }) {
  const [items, setItems] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Post | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugCustom, setSlugCustom] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const [posts, cats] = await Promise.all([
        api<Post[]>(`/admin/posts?type=${type}&limit=5000`),
        api<PostCategory[]>('/post-categories'),
      ]);
      setItems(posts);
      setCategories(cats);
      setError('');
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); void api<{ user: { role: string } }>('/auth/me').then(data => setIsAdmin(data.user.role === 'ADMIN')).catch(() => {}); }, [type]);

  function start(post: Post | null) {
    setEditing(post);
    setTitle(post?.title || '');
    setSlug(post?.slug || '');
    setSlugCustom(!!post);
    setExcerpt(post?.excerpt || '');
    setCoverUrl(post?.coverUrl || '');
    setCategoryId(post?.categoryId || '');
    setSeoTitle(post?.seoTitle || '');
    setSeoDescription(post?.seoDescription || '');
    setOpen(true);
    setError('');
    requestAnimationFrame(() => { if (contentRef.current) contentRef.current.innerHTML = post?.content || ''; });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const content = contentRef.current?.innerHTML.trim() || '';
    if (!title.trim() || !slugify(slug || title) || !contentRef.current?.textContent?.trim()) { setError('Cần có tiêu đề, slug và nội dung.'); return; }
    setSaving(true);
    try {
      const payload = { title: title.trim(), slug: slugify(slug), excerpt: excerpt.trim(), content, coverUrl: coverUrl.trim() || null, categoryId: categoryId || null, seoTitle: seoTitle.trim() || null, seoDescription: seoDescription.trim() || null, type };
      await api(editing ? `/posts/${editing.id}` : '/posts', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setOpen(false);
      setEditing(null);
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function setStatus(post: Post, status: 'DRAFT' | 'PUBLISHED') {
    try { await api(`/posts/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function remove(post: Post) {
    if (!confirm(`Xóa ${post.title}?`)) return;
    try { await api(`/posts/${post.id}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function addCategory(event: FormEvent) {
    event.preventDefault();
    try { await api('/post-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory }) }); setNewCategory(''); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function renameCategory(cat: PostCategory) {
    const name = prompt('Tên danh mục mới', cat.name)?.trim();
    if (!name || name === cat.name) return;
    try { await api(`/post-categories/${cat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function deleteCategory(cat: PostCategory) {
    if (!confirm(`Xóa danh mục ${cat.name}? Bài viết sẽ được bỏ gắn danh mục.`)) return;
    try { await api(`/post-categories/${cat.id}`, { method: 'DELETE' }); if (categoryId === cat.id) setCategoryId(''); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function upload(file: File, insert: boolean) {
    setUploading(true);
    try {
      const form = new FormData(); form.append('file', file);
      const result = await api<{ url: string }>('/admin/uploads', { method: 'POST', body: form });
      if (insert) { contentRef.current?.focus(); document.execCommand('insertImage', false, result.url); }
      else setCoverUrl(result.url);
    } catch (e) { setError((e as Error).message); }
    finally { setUploading(false); }
  }
  function format(command: string, value?: string) { contentRef.current?.focus(); document.execCommand(command, false, value); }
  async function persistOrder(reordered: Post[]) {
    const previous = items;
    setItems(reordered.map((post, index) => ({ ...post, sortIndex: index + 1 })));
    try { await api('/admin/guides/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: reordered.map(p => p.id) }) }); }
    catch (e) { setError((e as Error).message); setItems(previous); }
    finally { setDragId(null); }
  }
  async function reorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const source = items.findIndex(p => p.id === dragId);
    const target = items.findIndex(p => p.id === targetId);
    if (source < 0 || target < 0) return;
    const reordered = [...items];
    reordered.splice(target, 0, reordered.splice(source, 1)[0]);
    await persistOrder(reordered);
  }
  async function moveBy(id: string, direction: number) { const index = items.findIndex(post => post.id === id); const target = index + direction; if (target < 0 || target >= items.length) return; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; await persistOrder(next); }

  return <div className="space-y-6">
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-neutral-500">{loading ? 'Đang tải…' : `${items.length} ${type === 'GUIDE' ? 'hướng dẫn' : 'bài viết'}`}</p>
      <button onClick={() => open ? setOpen(false) : start(null)} className="rounded-lg bg-black px-4 py-2.5 text-sm font-bold text-white">{open ? 'Đóng form' : `+ Tạo ${type === 'GUIDE' ? 'hướng dẫn' : 'bài viết'}`}</button>
    </div>
    {open && <form onSubmit={save} className="admin-card grid gap-4 p-5">
      <h2 className="text-lg font-bold">{editing ? 'Sửa' : 'Tạo'} {type === 'GUIDE' ? 'hướng dẫn' : 'bài viết'}</h2>
      <input className="admin-input" placeholder="Tiêu đề" value={title} onChange={e => { setTitle(e.target.value); if (!slugCustom) setSlug(slugify(e.target.value)); }} required />
      <label className="text-xs font-semibold">Slug <input className="admin-input mt-1" value={slug} onChange={e => { setSlug(e.target.value); setSlugCustom(true); }} required /></label>
      <select className="admin-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Chưa chọn danh mục</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
      <textarea className="admin-input" placeholder="Tóm tắt" value={excerpt} onChange={e => setExcerpt(e.target.value)} />
      {type === 'ARTICLE' && <div className="grid gap-2"><label className="text-xs font-semibold">Ảnh bìa</label><input className="admin-input" placeholder="URL ảnh bìa" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} /><input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) void upload(e.target.files[0], false); }} />{coverUrl && <img src={coverUrl} alt="Xem trước ảnh bìa" className="h-28 w-40 object-cover" />}</div>}
      <div><div className="flex flex-wrap gap-1 rounded-t-lg border border-neutral-200 bg-neutral-50 p-2" onMouseDown={e => { if ((e.target as HTMLElement).closest('button')) e.preventDefault(); }}>
        {([['bold','Đậm'],['italic','Nghiêng'],['formatBlock','H2'],['insertUnorderedList','Danh sách'],['insertOrderedList','Đánh số']] as const).map(([cmd,label]) => <button key={label} type="button" onClick={() => format(cmd, cmd === 'formatBlock' ? 'h2' : undefined)} className="rounded border bg-white px-2 py-1 text-xs font-semibold">{label}</button>)}
        <button type="button" onClick={() => { const url = prompt('URL liên kết'); if (url) format('createLink', url); }} className="rounded border bg-white px-2 py-1 text-xs font-semibold">Liên kết</button>
        <label className="cursor-pointer rounded border bg-white px-2 py-1 text-xs font-semibold">Ảnh trong bài<input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) void upload(e.target.files[0], true); }} /></label>
      </div><div ref={contentRef} contentEditable suppressContentEditableWarning role="textbox" aria-label="Nội dung bài viết" className="min-h-56 rounded-b-lg border border-t-0 border-neutral-200 bg-white p-4 leading-7 outline-none focus:ring-2 focus:ring-amber-300" /></div>
      <div className="grid gap-3 md:grid-cols-2"><input className="admin-input" placeholder="SEO title (để trống sẽ tự tạo)" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} /><textarea className="admin-input" placeholder="SEO description (để trống sẽ tự tạo)" value={seoDescription} onChange={e => setSeoDescription(e.target.value)} /></div>
      <button disabled={saving || uploading} className="rounded-lg bg-black px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Lưu nháp'}</button>
    </form>}
    <section className="admin-card p-5"><h2 className="font-bold">Danh mục nội dung</h2><form onSubmit={addCategory} className="mt-3 flex gap-2"><input className="admin-input flex-1" placeholder="Tên danh mục mới" value={newCategory} onChange={e => setNewCategory(e.target.value)} required /><button className="rounded-lg bg-neutral-900 px-3 text-sm font-bold text-white">Thêm</button></form><div className="mt-3 flex flex-wrap gap-2">{categories.map(cat => <span key={cat.id} className="rounded border px-2 py-1 text-sm">{cat.name} <button onClick={() => renameCategory(cat)} className="ml-2 text-blue-600">Sửa</button> <button onClick={() => deleteCategory(cat)} className="text-red-600">Xóa</button></span>)}</div></section>
    <div className="space-y-3">{items.map(post => <article key={post.id} draggable={type === 'GUIDE'} onDragStart={() => setDragId(post.id)} onDragOver={e => { if (type === 'GUIDE') e.preventDefault(); }} onDrop={() => { if (type === 'GUIDE') void reorder(post.id); }} onDragEnd={() => setDragId(null)} className="admin-card flex flex-wrap items-center gap-4 p-5">
      {type === 'GUIDE' && <span className="flex items-center gap-1 text-neutral-500" title="Kéo để sắp xếp">☰ {post.sortIndex} <button onClick={() => void moveBy(post.id, -1)} aria-label={`Đưa ${post.title} lên`} className="px-1">↑</button><button onClick={() => void moveBy(post.id, 1)} aria-label={`Đưa ${post.title} xuống`} className="px-1">↓</button></span>}
      {type === 'ARTICLE' && post.coverUrl && <img src={post.coverUrl} alt="" className="h-16 w-20 object-cover" />}
      <div className="min-w-0 flex-1"><h3 className="font-bold">{post.title}</h3><p className="text-sm text-neutral-500">{post.categoryName || 'Chưa có danh mục'} · {post.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}</p></div>
      <div className="flex gap-3 text-sm font-semibold"><button onClick={() => start(post)}>Sửa</button>{isAdmin && <><button onClick={() => setStatus(post, post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')} className="text-emerald-700">{post.status === 'PUBLISHED' ? 'Gỡ đăng' : 'Xuất bản'}</button><button onClick={() => remove(post)} className="text-red-600">Xóa</button></>}</div>
    </article>)}</div>
  </div>;
}
