'use client';

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bold, BookOpen, ExternalLink, Eye, EyeOff, FolderOpen, GripVertical, ImagePlus, Italic, Link2, List, ListOrdered, Pencil, Quote, Redo2, Trash2, Undo2, X } from 'lucide-react';
import type { Post, PostCategory } from '../../lib/types';
import { AdminButton, AdminField, AdminInput, AdminSelect, AdminStatusBadge, AdminTextarea } from './AdminUI';
import { AdminDataTable, useAdminPagedList, updateAdminTableFilter, type AdminDataTableColumn } from './AdminDataTable';

type Kind = 'ARTICLE' | 'GUIDE';
const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể lưu dữ liệu');
  return data as T;
}

export function ContentManager({ type, editorOnly = false, editId }: { type: Kind; editorOnly?: boolean; editId?: string }) {
  const router = useRouter();
  const [guideItems, setGuideItems] = useState<Post[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { rows: articleItems, loading: tableLoading, loadingMore, hasMore, error: tableError, loadMore, reload } = useAdminPagedList<Post>('/admin/posts', { ...filters, type: 'ARTICLE', summary: '1' }, 30, !editorOnly && type === 'ARTICLE');
  const items = type === 'ARTICLE' ? articleItems : guideItems;
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Post | null>(null);
  const [open, setOpen] = useState(editorOnly);
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [preview, setPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const [posts, cats] = await Promise.all([
        type === 'GUIDE' || editorOnly ? api<Post[]>(`/admin/posts?type=${type}&limit=5000`) : Promise.resolve([] as Post[]),
        api<PostCategory[]>('/post-categories'),
      ]);
      setGuideItems(posts);
      setCategories(cats);
      let missingEdit = false;
      if (editorOnly && editId) {
        const post = posts.find(item => item.id === editId);
        if (post) start(post);
        else missingEdit = true;
      }
      setError(missingEdit ? 'Không tìm thấy nội dung cần chỉnh sửa.' : '');
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
    setPreview(false);
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
      router.push(type === 'GUIDE' ? '/admin/guides' : '/admin/posts');
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function setStatus(post: Post, status: 'DRAFT' | 'PUBLISHED') {
      try { await api(`/posts/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); if (type === 'ARTICLE') reload(); else await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function remove(post: Post) {
    if (!confirm(`Xóa ${post.title}?`)) return;
    try { await api(`/posts/${post.id}`, { method: 'DELETE' }); if (type === 'ARTICLE') reload(); else await load(); }
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
  function insertLink() { const url = prompt('Nhập địa chỉ liên kết'); if (url) format('createLink', url); }
  function onCoverDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file?.type.startsWith('image/')) void upload(file, false); }
  async function persistOrder(reordered: Post[]) {
    const previous = guideItems;
    setGuideItems(reordered.map((post, index) => ({ ...post, sortIndex: index + 1 })));
    try { await api('/admin/guides/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: reordered.map(p => p.id) }) }); }
    catch (e) { setError((e as Error).message); setGuideItems(previous); }
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

  return <div className="space-y-2">
    {(error || tableError) && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error || tableError}</p>}
    {!editorOnly && <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white px-3 py-1.5">
      <p className="text-sm font-medium text-neutral-500">{(type === 'ARTICLE' ? tableLoading : loading) ? 'Đang tải nội dung…' : <><span className="font-bold text-neutral-900">{items.length}</span> {type === 'GUIDE' ? 'hướng dẫn' : 'bài viết đã tải'}</>}</p>
      <AdminButton className="rounded-md px-3 py-2 text-xs" onClick={() => router.push(`${type === 'GUIDE' ? '/admin/guides' : '/admin/posts'}/new`)}>+ Tạo {type === 'GUIDE' ? 'hướng dẫn' : 'bài viết'}</AdminButton>
    </div>}
    {open && <form onSubmit={save} className="admin-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 bg-gradient-to-r from-amber-50 to-white px-4 py-4 sm:px-5">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-amber-800">{type === 'GUIDE' ? 'Hướng dẫn khách hàng' : 'Ấn phẩm & tin tức'}</p><h2 className="mt-1 text-xl font-extrabold">{editing ? 'Chỉnh sửa' : 'Tạo mới'} {type === 'GUIDE' ? 'hướng dẫn' : 'bài viết'}</h2><p className="mt-1 text-sm text-neutral-500">{type === 'GUIDE' ? 'Viết nội dung từng bước, dễ theo dõi và thực hiện.' : 'Tạo bài viết nổi bật với ảnh bìa và nội dung chỉn chu.'}</p></div>
        {!editorOnly && <button type="button" onClick={() => setOpen(false)} aria-label="Đóng trình soạn thảo" className="rounded-lg p-2 text-neutral-500 hover:bg-white hover:text-black"><X size={19} /></button>}
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,.65fr)]">
          <AdminField label="Tiêu đề" htmlFor="content-title"><AdminInput id="content-title" className="!rounded-xl !py-3 text-base font-semibold" placeholder={type === 'GUIDE' ? 'Ví dụ: Cách chọn size trang phục' : 'Tiêu đề bài viết'} value={title} onChange={e => { setTitle(e.target.value); if (!slugCustom) setSlug(slugify(e.target.value)); }} required /></AdminField>
          <AdminField label="Danh mục" htmlFor="content-category"><AdminSelect id="content-category" options={categories.map(category => ({ value: category.id, label: category.name }))} value={categoryId} onChange={setCategoryId} placeholder="Chưa chọn danh mục" ariaLabel={`Danh mục ${type === 'GUIDE' ? 'hướng dẫn' : 'bài viết'}`} leadingIcon={<FolderOpen size={16} />} /></AdminField>
        </div>
        <div className="grid w-full gap-4 md:grid-cols-2">
          <AdminField label="Đường dẫn (slug)" htmlFor="content-slug" hint={`URL: /${type === 'GUIDE' ? 'huong-dan' : 'blog'}/${slug || 'duong-dan-bai-viet'}`}><AdminInput id="content-slug" className="!rounded-xl" value={slug} onChange={e => { setSlug(e.target.value); setSlugCustom(true); }} required /></AdminField>
          <AdminField label={type === 'GUIDE' ? 'Mô tả ngắn' : 'Tóm tắt bài viết'} htmlFor="content-excerpt" className="w-full md:col-span-2"><AdminTextarea id="content-excerpt" className="min-h-[76px] !rounded-xl" placeholder={type === 'GUIDE' ? 'Khách sẽ học được gì từ hướng dẫn này?' : 'Một đoạn giới thiệu ngắn hiển thị ở danh sách bài viết'} value={excerpt} onChange={e => setExcerpt(e.target.value)} /></AdminField>
        </div>
        {type === 'ARTICLE' ? <section className="grid gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 sm:p-5" onDragOver={e => e.preventDefault()} onDrop={onCoverDrop}>
          <div><h3 className="text-sm font-bold">Ảnh đại diện bài viết</h3><p className="mt-1 text-xs text-neutral-500">Tải ảnh lên hoặc dán URL. Kéo thả ảnh vào khung xem trước cũng được.</p></div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative grid aspect-[16/10] w-full max-w-[260px] place-items-center overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-400">
              {coverUrl ? <><img src={coverUrl} alt="Xem trước ảnh đại diện" className="h-full w-full object-cover" /><button type="button" onClick={() => setCoverUrl('')} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black" aria-label="Xóa ảnh bìa"><X size={15} /></button></> : <div className="px-4 text-center"><ImagePlus size={28} className="mx-auto text-amber-600" /><p className="mt-2 text-xs">Ảnh xem trước 16:10</p></div>}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-3">
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-amber-400">{uploading ? 'Đang tải ảnh…' : <><ImagePlus size={16} /> Chọn ảnh từ máy</>}<input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => { if (e.target.files?.[0]) void upload(e.target.files[0], false); e.currentTarget.value = ''; }} /></label>
              <AdminField label="Hoặc dùng đường dẫn ảnh" htmlFor="content-cover-url" labelClassName="text-xs text-neutral-600"><AdminInput id="content-cover-url" className="!rounded-xl" placeholder="https://..." value={coverUrl} onChange={e => setCoverUrl(e.target.value)} /></AdminField>
              <p className="text-xs text-neutral-500">Ảnh ngang giúp bài viết trông đẹp hơn trong danh sách.</p>
            </div>
          </div>
        </section> : <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">Hướng dẫn sẽ xuất hiện dưới dạng mục có thể mở rộng tại trang Hướng dẫn.</div>}
        <section className="overflow-hidden rounded-2xl border border-neutral-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-1" onMouseDown={e => { if ((e.target as HTMLElement).closest('button')) e.preventDefault(); }}>
              {[{cmd:'bold',label:'Đậm',Icon:Bold},{cmd:'italic',label:'Nghiêng',Icon:Italic},{cmd:'insertUnorderedList',label:'Danh sách',Icon:List},{cmd:'insertOrderedList',label:'Đánh số',Icon:ListOrdered},{cmd:'formatBlock',label:'Trích dẫn',Icon:Quote}].map(({cmd,label,Icon}) => <button key={cmd} type="button" title={label} aria-label={label} onClick={() => format(cmd, cmd === 'formatBlock' ? 'blockquote' : undefined)} className="rounded-lg p-2 text-neutral-600 hover:bg-white hover:text-neutral-950 hover:shadow-sm"><Icon size={17} /></button>)}
              <AdminSelect ariaLabel="Kiểu tiêu đề" value="p" onChange={value => format('formatBlock', value)} searchable={false} allowEmpty={false} size="compact" className="!mt-0 w-36" options={[{ value: 'p', label: 'Đoạn văn' }, { value: 'h2', label: 'Tiêu đề lớn' }, { value: 'h3', label: 'Tiêu đề nhỏ' }]} />
              <button type="button" title="Chèn liên kết" aria-label="Chèn liên kết" onClick={insertLink} className="rounded-lg p-2 text-neutral-600 hover:bg-white hover:text-neutral-950"><Link2 size={17} /></button>
              <label title="Chèn ảnh vào nội dung" className="cursor-pointer rounded-lg p-2 text-neutral-600 hover:bg-white hover:text-neutral-950"><ImagePlus size={17} /><input type="file" accept="image/*" className="sr-only" onChange={e => { if (e.target.files?.[0]) void upload(e.target.files[0], true); e.currentTarget.value = ''; }} /></label>
              <span className="mx-1 h-5 border-l border-neutral-200" />
              <button type="button" title="Hoàn tác" aria-label="Hoàn tác" onClick={() => format('undo')} className="rounded-lg p-2 text-neutral-500 hover:bg-white"><Undo2 size={16} /></button><button type="button" title="Làm lại" aria-label="Làm lại" onClick={() => format('redo')} className="rounded-lg p-2 text-neutral-500 hover:bg-white"><Redo2 size={16} /></button>
            </div>
            <button type="button" onClick={() => setPreview(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 hover:border-amber-300">{preview ? <><Pencil size={14} /> Chỉnh sửa</> : <><Eye size={14} /> Xem trước</>}</button>
          </div>
          <div ref={contentRef} contentEditable={!preview} suppressContentEditableWarning role="textbox" aria-label={`Nội dung ${type === 'GUIDE' ? 'hướng dẫn' : 'bài viết'}`} data-placeholder={type === 'GUIDE' ? 'Viết nội dung hướng dẫn… Bạn có thể dùng tiêu đề, danh sách và ảnh minh họa.' : 'Bắt đầu viết bài của bạn…'} className={`editor-canvas prose-content min-h-64 bg-white px-4 py-3 outline-none focus:bg-amber-50/10 sm:px-5 ${preview ? 'hidden' : ''}`} />
          <div className={`prose-content min-h-72 bg-white p-5 sm:p-7 ${preview ? '' : 'hidden'}`} dangerouslySetInnerHTML={{ __html: contentRef.current?.innerHTML || '<p class="text-neutral-400">Nội dung xem trước sẽ hiển thị tại đây.</p>' }} />
        </section>
        <details className="rounded-xl border border-neutral-200 bg-white"><summary className="cursor-pointer px-4 py-3 text-sm font-bold text-neutral-700">Cài đặt tìm kiếm (SEO)</summary><div className="grid gap-3 border-t border-neutral-100 p-4 md:grid-cols-2"><AdminField label="Tiêu đề tìm kiếm" htmlFor="content-seo-title" labelClassName="text-xs text-neutral-600"><AdminInput id="content-seo-title" className="!rounded-xl" placeholder="Để trống để dùng tiêu đề bài viết" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} /></AdminField><AdminField label="Mô tả tìm kiếm" htmlFor="content-seo-description" className="md:col-span-2" labelClassName="text-xs text-neutral-600"><AdminTextarea id="content-seo-description" className="min-h-[72px] !rounded-xl" placeholder="Mô tả ngắn trong kết quả tìm kiếm" value={seoDescription} onChange={e => setSeoDescription(e.target.value)} /></AdminField></div></details>
        <div className="flex flex-col-reverse justify-end gap-2 border-t border-neutral-100 pt-3 sm:flex-row"><AdminButton type="button" variant="secondary" onClick={() => router.push(type === 'GUIDE' ? '/admin/guides' : '/admin/posts')}>Hủy</AdminButton><AdminButton disabled={saving || uploading}>{saving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Lưu bản nháp'}</AdminButton></div>
      </div>
    </form>}
    {!editorOnly && type === 'ARTICLE' && <AdminDataTable columns={[
      { key: 'title', header: 'Bài viết', className: 'min-w-[260px]', render: post => <div className="flex items-center gap-2.5">{post.coverUrl ? <img loading="lazy" src={post.coverUrl} alt="" className="h-9 w-12 shrink-0 rounded border border-neutral-200 object-cover" /> : <div className="h-9 w-12 shrink-0 rounded border border-neutral-200 bg-amber-50" />}<span className="font-semibold text-neutral-900">{post.title}</span></div> },
      { key: 'slug', header: 'Slug', className: 'min-w-[150px] max-w-[230px] truncate text-xs', render: post => post.slug },
      { key: 'category', header: 'Danh mục', className: 'min-w-[140px]', render: post => post.categoryName || <span className="text-neutral-400">Chưa phân loại</span> },
      { key: 'status', header: 'Trạng thái', filter: { key: 'status', label: 'trạng thái', type: 'select', options: [{ value: 'PUBLISHED', label: 'Đã xuất bản' }, { value: 'DRAFT', label: 'Bản nháp' }] }, className: 'min-w-[125px]', render: post => <AdminStatusBadge published={post.status === 'PUBLISHED'}>{post.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}</AdminStatusBadge> },
      { key: 'date', header: 'Ngày tạo', filter: { key: 'date', label: 'ngày tạo', type: 'date' }, className: 'min-w-[115px] whitespace-nowrap text-xs', render: post => post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '—' },
      { key: 'actions', header: 'Thao tác', className: 'min-w-[155px]', render: post => <div className="flex items-center gap-2 whitespace-nowrap"><a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" title="Mở trang" className="text-neutral-500 hover:text-sky-700"><ExternalLink size={14} /></a><button type="button" onClick={() => router.push(`/admin/posts/edit/${post.id}`)} className="text-xs font-semibold text-neutral-600 hover:text-black">Sửa</button>{isAdmin && <><button type="button" onClick={() => void setStatus(post, post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')} className="text-xs font-semibold text-emerald-700">{post.status === 'PUBLISHED' ? 'Gỡ đăng' : 'Xuất bản'}</button><button type="button" onClick={() => void remove(post)} className="text-xs font-semibold text-red-600">Xóa</button></>}</div> },
    ] as AdminDataTableColumn<Post>[]} rows={articleItems} loading={tableLoading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} error={tableError} filters={filters} onFilterChange={(key, value) => setFilters(current => updateAdminTableFilter(current, key, value))} searchPlaceholder="Tìm bài viết theo tiêu đề, slug hoặc danh mục…" minWidth="1050px" emptyMessage="Chưa có bài viết phù hợp." />}
    {!editorOnly && type === 'GUIDE' && items.length === 0 && !loading ? <div className="admin-card px-6 py-12 text-center"><p className="text-lg font-bold">Chưa có hướng dẫn nào</p><p className="mt-1 text-sm text-neutral-500">Tạo nội dung đầu tiên để bắt đầu xây dựng thư viện của bạn.</p><button onClick={() => router.push('/admin/guides/new')} className="mt-4 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-bold hover:border-amber-400 hover:bg-amber-50">+ Tạo hướng dẫn</button></div> : null}
    {!editorOnly && type === 'GUIDE' && <div className="space-y-3">{items.map(post => <article key={post.id} draggable onDragStart={() => setDragId(post.id)} onDragOver={e => e.preventDefault()} onDrop={() => void reorder(post.id)} onDragEnd={() => setDragId(null)} className={`group relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-4 ${post.status === 'PUBLISHED' ? 'border-emerald-100 hover:border-emerald-200' : 'border-neutral-200 hover:border-amber-200'} ${dragId === post.id ? 'opacity-50' : ''}`}>
      {type === 'GUIDE' && <div className="flex items-center gap-1 rounded-xl bg-neutral-50 px-2 py-2 text-xs font-bold text-neutral-500" title="Kéo để sắp xếp"><GripVertical size={16} className="cursor-grab" /><span>{post.sortIndex || '—'}</span><button type="button" onClick={() => void moveBy(post.id, -1)} aria-label={`Đưa ${post.title} lên`} className="rounded p-1 hover:bg-white hover:text-black">↑</button><button type="button" onClick={() => void moveBy(post.id, 1)} aria-label={`Đưa ${post.title} xuống`} className="rounded p-1 hover:bg-white hover:text-black">↓</button></div>}
      <div className="min-w-0 flex-1 basis-[220px]">
        <div className="flex flex-wrap items-center gap-2"><h3 className="min-w-0 truncate text-base font-extrabold text-neutral-900 sm:text-lg">{post.title}</h3><AdminStatusBadge published={post.status === 'PUBLISHED'} /></div>
        {post.excerpt && <p className="mt-1 line-clamp-1 text-sm text-neutral-500">{post.excerpt}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500"><span className="rounded-md bg-neutral-100 px-2 py-1 font-semibold text-neutral-700">{post.categoryName || 'Chưa phân loại'}</span><span className="max-w-[220px] truncate">/{type === 'GUIDE' ? 'huong-dan' : 'blog'}/{post.slug}</span>{post.publishedAt && <><span className="text-neutral-300">·</span><time>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</time></>}</div>
      </div>
      <div className="ml-auto flex w-full items-center justify-end gap-1 border-t border-neutral-100 pt-2 sm:w-auto sm:border-0 sm:pt-0">
        <a href={`/${type === 'GUIDE' ? 'huong-dan' : 'blog'}/${post.slug}`} target="_blank" rel="noreferrer" aria-label={`Xem ${post.title}`} title="Mở trang" className="rounded-lg p-2 text-neutral-500 transition hover:bg-sky-50 hover:text-sky-700"><ExternalLink size={17} /></a>
        <button type="button" onClick={() => router.push(`${type === 'GUIDE' ? '/admin/guides' : '/admin/posts'}/edit/${post.id}`)} aria-label={`Sửa ${post.title}`} title="Chỉnh sửa" className="rounded-lg p-2 text-neutral-500 transition hover:bg-amber-50 hover:text-amber-800"><Pencil size={17} /></button>
        {isAdmin && <><button type="button" onClick={() => setStatus(post, post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')} aria-label={post.status === 'PUBLISHED' ? 'Gỡ đăng' : 'Xuất bản'} title={post.status === 'PUBLISHED' ? 'Gỡ đăng' : 'Xuất bản'} className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50">{post.status === 'PUBLISHED' ? <EyeOff size={17} /> : <Eye size={17} />}</button><button type="button" onClick={() => remove(post)} aria-label={`Xóa ${post.title}`} title="Xóa" className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-700"><Trash2 size={17} /></button></>}
      </div>
    </article>)}</div>}
  </div>;
}
