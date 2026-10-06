'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Upload,
} from 'lucide-react';
import { AdminButton, AdminInput, AdminSelect, AdminTextarea } from './AdminUI';
import { ProductThumbnail, thumbnailTemplates } from '../ProductThumbnail';
import type { Product } from '../../lib/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatVnd(val: number | string): string {
  const num = Number(val) || 0;
  return num.toLocaleString('vi-VN') + ' đ';
}

const STATUS_TABS = [
  { value: 'AVAILABLE', label: 'Sẵn sàng' },
  { value: 'RENTED', label: 'Đang thuê' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
] as const;

type Category = { id: string; name: string; slug: string; parentId: string | null; imageUrl?: string | null };
type TagItem = { id: string; name: string; slug: string };
type SimpleProduct = { id: string; title: string; thumbnailUrl?: string; isCombo?: boolean; testPrice: number };

type EditableProduct = {
  id: string; title: string; slug: string; description?: string; note?: string; location?: string; thumbnailTemplate?: string; useThumbnailTemplate?: boolean;
  testPrice: number; fesPrice: number; shootPrice: number; totalQuantity: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'ARCHIVED'; isCombo?: boolean;
  rewardPoints?: number; pointsPrice?: number;
  thumbnailUrl?: string;
  images?: { url: string; alt?: string }[];
  variants?: { id: string; name: string; quantity: number }[];
  categories?: Category[]; tags?: TagItem[]; comboItems?: { productId: string; quantity: number }[];
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Có lỗi xảy ra');
  return data as T;
}

function CategoryTree({
  categories,
  selected,
  onToggle,
  parentId = null,
  depth = 0,
}: {
  categories: Category[];
  selected: string[];
  onToggle: (id: string) => void;
  parentId?: string | null;
  depth?: number;
}) {
  const children = categories.filter((c) => (c.parentId || null) === parentId);
  if (!children.length) return null;
  return (
    <div className={depth > 0 ? 'ml-4 border-l border-neutral-100 pl-3' : ''}>
      {children.map((cat) => (
        <div key={cat.id}>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2 py-1 text-sm transition hover:bg-amber-50">
            <input
              type="checkbox"
              checked={selected.includes(cat.id)}
              onChange={() => onToggle(cat.id)}
              className="h-4 w-4 shrink-0 rounded border-neutral-300 text-black focus:ring-black"
            />
            {cat.imageUrl ? <img src={cat.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-neutral-200 object-cover" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 text-xs font-black text-amber-800">{cat.name.slice(0, 1)}</span>}
            <span className="min-w-0 flex-1 truncate font-medium">{cat.name}</span>
          </label>
          <CategoryTree categories={categories} selected={selected} onToggle={onToggle} parentId={cat.id} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

export function ProductCreateForm({ product }: { product?: EditableProduct }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!product;

  // Form states
  const [title, setTitle] = useState(product?.title || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [isSlugCustom, setIsSlugCustom] = useState(isEdit);
  const [description, setDescription] = useState(product?.description || '');
  const [note, setNote] = useState(product?.note || '');
  const [location, setLocation] = useState(product?.location || 'HCM');
  const [thumbnailTemplate, setThumbnailTemplate] = useState(product?.thumbnailTemplate || 'honey-rizu');
  const [useThumbnailTemplate, setUseThumbnailTemplate] = useState(product?.useThumbnailTemplate !== false);
  const [testPrice, setTestPrice] = useState<number | string>(product?.testPrice ?? 120000);
  const [fesPrice, setFesPrice] = useState<number | string>(product?.fesPrice ?? 250000);
  const [shootPrice, setShootPrice] = useState<number | string>(product?.shootPrice ?? 180000);
  const [rewardPoints, setRewardPoints] = useState<number | string>(product?.rewardPoints ?? 0);
  const [pointsPrice, setPointsPrice] = useState<number | string>(product?.pointsPrice ?? 0);
  const [status, setStatus] = useState<'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'ARCHIVED'>(product?.status || 'AVAILABLE');
  const [isCombo, setIsCombo] = useState(!!product?.isCombo);
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnailUrl || '');
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images?.map((image) => image.url) || []);
  const sizeOptions = ['S', 'M', 'L', 'XL', 'Free size'];
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(() => Object.fromEntries((product?.variants || []).filter(variant => sizeOptions.includes(variant.name) && variant.quantity > 0).map(variant => [variant.name, variant.quantity])));
  const [uploading, setUploading] = useState(false);

  // Taxonomy states
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(product?.categories?.map((c) => c.id) || []);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');

  const [tags, setTags] = useState<TagItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(product?.tags?.map((t) => t.id) || []);
  const [newTagName, setNewTagName] = useState('');

  const [availableProducts, setAvailableProducts] = useState<SimpleProduct[]>([]);
  const [comboItems, setComboItems] = useState<{ productId: string; quantity: number }[]>(
    product?.comboItems?.map((i) => ({ productId: i.productId, quantity: i.quantity })) || []
  );

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api<Category[]>('/categories').then(setCategories).catch(() => {});
    api<TagItem[]>('/tags').then(setTags).catch(() => {});
    api<SimpleProduct[]>('/products?limit=200').then(setAvailableProducts).catch(() => {});
  }, []);

  const comboCandidates = useMemo(
    () => availableProducts.filter((p) => !p.isCombo && p.id !== product?.id),
    [availableProducts, product?.id]
  );

  // Auto slug generation on title change unless manually overridden
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugCustom) setSlug(slugify(val));
  };
  const handleSlugChange = (val: string) => {
    setSlug(val);
    setIsSlugCustom(true);
  };
  const regenerateSlug = () => {
    setSlug(slugify(title));
    setIsSlugCustom(false);
  };

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleTag(id: string) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const created = await api<{ id: string }>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim(), parentId: newCategoryParent || null }),
      });
      const cat: Category = { id: created.id, name: newCategoryName.trim(), slug: slugify(newCategoryName), parentId: newCategoryParent || null };
      setCategories((prev) => [...prev, cat]);
      setSelectedCategoryIds((prev) => [...prev, cat.id]);
      setNewCategoryName('');
      setNewCategoryParent('');
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function addTag() {
    if (!newTagName.trim()) return;
    try {
      const created = await api<{ id: string }>('/tags', { method: 'POST', body: JSON.stringify({ name: newTagName.trim() }) });
      const tag: TagItem = { id: created.id, name: newTagName.trim(), slug: slugify(newTagName) };
      setTags((prev) => [...prev, tag]);
      setSelectedTagIds((prev) => [...prev, tag.id]);
      setNewTagName('');
    } catch (e: any) {
      setError(e.message);
    }
  }

  function toggleComboItem(productId: string) {
    setComboItems((prev) =>
      prev.some((i) => i.productId === productId)
        ? prev.filter((i) => i.productId !== productId)
        : [...prev, { productId, quantity: 1 }]
    );
  }
  function setComboQuantity(productId: string, quantity: number) {
    setComboItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i)));
  }

  const previewProduct: Partial<Product> = {
    title, description, note, location, thumbnailUrl, thumbnailTemplate, useThumbnailTemplate,
    testPrice: Number(testPrice) || 0, fesPrice: Number(fesPrice) || 0, shootPrice: Number(shootPrice) || 0,
    images: imageUrls.map(url => ({ url })),
    variants: sizeOptions.filter(size => sizeQuantities[size] > 0).map((name, index) => ({ id: name || String(index), name, quantity: sizeQuantities[name] })),
  };

  async function handleFileUpload(file: File, asThumbnail = true) {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/v1/admin/uploads', { method: 'POST', credentials: 'include', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Tải ảnh lên thất bại.');
      if (asThumbnail) setThumbnailUrl(data.url);
      else setImageUrls((previous) => previous.includes(data.url) ? previous : [...previous, data.url]);
    } catch (e: any) {
      setError(e.message || 'Tải ảnh lên thất bại.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên sản phẩm.');
      return;
    }
    const finalSlug = slug.trim() || slugify(title);
    if (!finalSlug) {
      setError('Vui lòng nhập slug hợp lệ.');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        const response = await fetch(isEdit ? `/api/v1/products/${product!.id}` : '/api/v1/products', {
          method: isEdit ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            slug: finalSlug,
            description: description.trim(),
            note: note.trim(),
            location: location.trim(),
            thumbnailTemplate,
            useThumbnailTemplate,
            testPrice: Number(testPrice) || 0,
            fesPrice: Number(fesPrice) || 0,
            shootPrice: Number(shootPrice) || 0,
            rewardPoints: Number(rewardPoints) || 0,
            pointsPrice: Number(pointsPrice) || 0,
            totalQuantity: product?.totalQuantity ?? 1,
            status,
            isCombo,
            thumbnailUrl: thumbnailUrl.trim(),
            imageUrls,
            variants: sizeOptions.filter(size => sizeQuantities[size] > 0).map(name => ({ name, quantity: sizeQuantities[name] })),
            categoryIds: selectedCategoryIds,
            tagIds: selectedTagIds,
            comboItems: isCombo ? comboItems : [],
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Không thể lưu sản phẩm. Vui lòng kiểm tra lại slug hoặc thông tin.');
        }

        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/products');
          router.refresh();
        }, 600);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi lưu sản phẩm.');
      }
    });
  }

  return (
    <div className="w-full space-y-6">
      {/* Top back bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          prefetch={true}
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách sản phẩm
        </Link>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          {isEdit ? 'Chỉnh sửa' : 'Catalog mới'}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <Check size={18} className="shrink-0" />
          <span>{isEdit ? 'Đã lưu thay đổi! Đang chuyển hướng về kho đồ…' : 'Sản phẩm đã được tạo thành công! Đang chuyển hướng về kho đồ…'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="admin-card p-6">
            <h2 className="text-base font-bold">Thông tin sản phẩm</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Tên sản phẩm / Trang phục <span className="text-red-500">*</span>
                </label>
                <AdminInput
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: Furina - Genshin Impact (Full Set)"
                  className="mt-1 text-base font-medium"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Slug đường dẫn (URL) <span className="text-red-500">*</span>
                  </label>
                  {isSlugCustom && (
                    <button
                      type="button"
                      onClick={regenerateSlug}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      <Sparkles size={12} />
                      Tạo lại từ tên
                    </button>
                  )}
                </div>
                <AdminInput
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="furina-genshin-impact"
                  className="mt-1 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Đường dẫn hiển thị: <span className="font-mono text-neutral-600">/cosplay/{slug || '...'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Mô tả chi tiết & Phụ kiện đi kèm
                </label>
                <AdminTextarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bao gồm: Trang phục nguyên set, wig tạo kiểu, mũ, găng tay, phụ kiện gài ngực... Size phù hợp 1m55 - 1m68."
                  className="mt-1 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Đồ kèm / lưu ý hiển thị</label><AdminInput value={note} onChange={e => setNote(e.target.value)} placeholder="Ví dụ: Full costume, wig, phụ kiện" className="mt-1" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Vị trí đồ</label><AdminInput value={location} onChange={e => setLocation(e.target.value)} placeholder="HCM" className="mt-1" /></div>
              </div>

              <div className="pt-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isCombo}
                    onChange={(e) => setIsCombo(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                  />
                  <div>
                    <span className="text-sm font-semibold">Gói Combo / Full Set phụ kiện</span>
                    <p className="text-xs text-neutral-500">
                      Đánh dấu nếu đây là set gộp từ nhiều sản phẩm lẻ đã có trong kho.
                    </p>
                  </div>
                </label>
              </div>

              {isCombo && (
                <div className="rounded-xl border border-neutral-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Sản phẩm trong combo</p>
                  {comboCandidates.length === 0 ? (
                    <p className="mt-2 text-sm text-neutral-400">Chưa có sản phẩm lẻ nào để chọn.</p>
                  ) : (
                    <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                      {comboCandidates.map((p) => {
                        const picked = comboItems.find((i) => i.productId === p.id);
                        return (
                          <div key={p.id} className="flex items-center gap-3 rounded-lg py-1.5 hover:bg-neutral-50">
                            <input
                              type="checkbox"
                              checked={!!picked}
                              onChange={() => toggleComboItem(p.id)}
                              className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                            />
                            <span className="flex-1 text-sm">{p.title}</span>
                            {picked && (
                              <AdminInput
                                type="number"
                                min={1}
                                value={picked.quantity}
                                onChange={(e) => setComboQuantity(p.id, Number(e.target.value) || 1)}
                                className="h-9 !min-h-0 w-16 py-1 text-xs"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="admin-card p-6">
            <h2 className="text-base font-bold">Thiết lập giá thuê (VNĐ)</h2>
            <p className="mt-1 text-xs text-neutral-500">Cung cấp các mức giá thuê tùy theo nhu cầu của khách hàng.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ['Giá test đồ', testPrice, setTestPrice],
                ['Giá fes (sự kiện)', fesPrice, setFesPrice],
                ['Giá shoot ảnh', shootPrice, setShootPrice],
              ].map(([label, value, setter]: any) => (
                <div key={label}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</label>
                  <AdminInput
                    type="number"
                    min="0"
                    step="1000"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="mt-1 font-semibold"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs font-medium text-emerald-600">{formatVnd(value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="text-base font-bold">Size và số lượng</h2>
            <p className="mt-1 text-xs text-neutral-500">Chọn các size đang có để hiển thị trên thumbnail.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sizeOptions.map(size => {
                const selected = sizeQuantities[size] !== undefined;
                return <div key={size} className={`flex items-center gap-3 rounded-xl border p-3 ${selected ? 'border-amber-300 bg-amber-50' : 'border-neutral-200'}`}>
                  <input type="checkbox" checked={selected} onChange={event => setSizeQuantities(previous => { const next = { ...previous }; if (event.target.checked) next[size] = 1; else delete next[size]; return next; })} className="h-4 w-4 rounded border-neutral-300 text-black" />
                  <span className="min-w-0 flex-1 text-sm font-bold">{size}</span>
                  {selected && <AdminInput type="number" min="1" value={sizeQuantities[size]} onChange={event => setSizeQuantities(previous => ({ ...previous, [size]: Math.max(1, Number(event.target.value) || 1) }))} className="!mt-0 w-20" aria-label={`Số lượng size ${size}`} />}
                </div>;
              })}
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="text-base font-bold">Điểm thành viên</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">Điểm thưởng được cộng khi đơn thuê hoàn tất. Giá điểm là số điểm cần để đổi sản phẩm.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Điểm thưởng / sản phẩm</label><AdminInput type="number" min="0" step="1" value={rewardPoints} onChange={e => setRewardPoints(e.target.value)} className="mt-1 font-semibold" /><p className="mt-1 text-xs text-neutral-500">0 = tự tính từ giá thuê theo cài đặt chung.</p></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Giá đổi bằng điểm</label><AdminInput type="number" min="0" step="1" value={pointsPrice} onChange={e => setPointsPrice(e.target.value)} className="mt-1 font-semibold" /><p className="mt-1 text-xs text-neutral-500">Để 0 nếu sản phẩm không áp dụng đổi điểm.</p></div>
            </div>
          </div>

          {/* Section 3: Category */}
          <div className="admin-card p-6">
            <h2 className="text-base font-bold">Danh mục</h2>
            <p className="mt-1 text-xs text-neutral-500">Ví dụ: Game &gt; Genshin Impact, Anime &gt; Naruto.</p>
            <div className="mt-3 rounded-xl border border-neutral-200 p-3">
              {categories.length === 0 ? (
                <p className="text-sm text-neutral-400">Chưa có danh mục nào.</p>
              ) : (
                <CategoryTree categories={categories} selected={selectedCategoryIds} onToggle={toggleCategory} />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <AdminInput
                className="flex-1 min-w-[140px]"
                placeholder="Tên danh mục mới"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <div className="w-44"><AdminSelect options={categories.map(category => ({ value: category.id, label: category.name }))} value={newCategoryParent} onChange={setNewCategoryParent} placeholder="Cấp gốc (VD: Game, Anime)" ariaLabel="Danh mục cha" searchable={categories.length > 8} /></div>
              <AdminButton type="button" onClick={addCategory} className="rounded-lg px-4 py-2">
                Thêm
              </AdminButton>
            </div>
          </div>

          {/* Section 4: Tags */}
          <div className="admin-card p-6">
            <h2 className="text-base font-bold">Nhãn (Tags)</h2>
            <p className="mt-1 text-xs text-neutral-500">Ví dụ: Đồ mới, Đồ sale, Hot.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedTagIds.includes(t.id) ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
              {tags.length === 0 && <p className="text-sm text-neutral-400">Chưa có tag nào.</p>}
            </div>
            <div className="mt-3 flex gap-2">
              <AdminInput
                className="flex-1"
                placeholder="Tag mới, VD: Hot"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <AdminButton type="button" onClick={addTag} className="rounded-lg px-4 py-2">
                Thêm
              </AdminButton>
            </div>
          </div>
        </div>

        {/* Sidebar column: Status, Thumbnail, Save actions */}
        <div className="space-y-6">
          {/* Status Tabs */}
          <div className="admin-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Trạng thái sản phẩm</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.value}
                  onClick={() => setStatus(tab.value)}
                  className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                    status === tab.value ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Sản phẩm ở trạng thái &quot;Sẵn sàng&quot; sẽ lập tức xuất hiện trên trang chủ và danh mục tìm kiếm.
            </p>
          </div>

          {/* Thumbnail template and live preview */}
          <div className="admin-card p-6">
            <h3 className="flex items-center justify-between text-sm font-bold uppercase tracking-wider text-neutral-500"><span>Template thumbnail</span><ImageIcon size={16} className="text-neutral-400" /></h3>
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50"><input type="checkbox" checked={useThumbnailTemplate} onChange={event => setUseThumbnailTemplate(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-black" /><span><b className="block text-sm text-neutral-800">Dùng template cho thumbnail</b><span className="mt-1 block text-xs text-neutral-500">Tắt nếu chỉ muốn dùng ảnh chính, không ghép thông tin lên thumbnail.</span></span></label>
            {useThumbnailTemplate && <div className="mt-3"><label className="block text-xs font-bold text-neutral-600">Mã template</label><AdminSelect ariaLabel="Template thumbnail" value={thumbnailTemplate} onChange={setThumbnailTemplate} searchable={false} allowEmpty={false} options={thumbnailTemplates.map(({ value, label }) => ({ value, label }))} /><p className="mt-1 text-xs text-neutral-500">Các template có bố cục và màu khác nhau. Ô ảnh trống hiện Coming Soon.</p></div>}

            <div className="mt-4"><p className="text-xs font-bold text-neutral-600">Ảnh chính</p><label className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 py-3 text-sm font-semibold text-neutral-600 transition-colors hover:border-black hover:text-black">{uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{uploading ? 'Đang tải lên…' : 'Tải ảnh chính lên'}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={event => { const file = event.target.files?.[0]; if (file) void handleFileUpload(file, true); event.currentTarget.value = ''; }} /></label>
              <AdminInput type="text" value={thumbnailUrl} onChange={event => setThumbnailUrl(event.target.value)} placeholder="Hoặc nhập URL ảnh chính" className="mt-2 font-mono text-xs" />
            </div>

            <div className="mt-5 border-t border-neutral-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div><h4 className="text-sm font-bold text-neutral-800">Ảnh phụ · {new Set(imageUrls.filter(url => url !== thumbnailUrl)).size}/4</h4><p className="mt-1 text-xs text-neutral-500">Ô ảnh trống sẽ hiện Coming Soon trong thumbnail.</p></div>
                <label className="shrink-0 cursor-pointer rounded-lg border border-neutral-200 px-3 py-2 text-xs font-bold hover:border-amber-400 hover:bg-amber-50">+ Thêm ảnh<input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={async (event) => { const input = event.currentTarget; const files = Array.from(input.files || []); for (const file of files) await handleFileUpload(file, false); input.value = ''; }} /></label>
              </div>
              {imageUrls.length ? <div className="mt-3 grid grid-cols-4 gap-2">{imageUrls.map((url, index) => <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"><img src={url} alt={`Ảnh phụ ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => setImageUrls((previous) => previous.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Xóa ảnh phụ ${index + 1}`} className="absolute right-1 top-1 rounded-full bg-black/75 p-1.5 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">×</button></div>)}</div> : <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">Chưa có ảnh phụ.</p>}
            </div>
            <div className="mt-5"><span className="text-xs font-semibold text-neutral-500">Xem trước template:</span><div className="mx-auto mt-2 max-w-sm"><ProductThumbnail product={previewProduct} /></div></div>
          </div>

          {/* Action Card */}
          <div className="admin-card p-6 space-y-3">
            <AdminButton
              type="submit"
              disabled={isPending || success}
              className="w-full py-3 shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu sản phẩm…
                </>
              ) : success ? (
                <>
                  <Check size={16} />
                  {isEdit ? 'Đã lưu thay đổi!' : 'Đã tạo thành công!'}
                </>
              ) : isEdit ? (
                'Lưu thay đổi'
              ) : (
                'Lưu và đăng sản phẩm'
              )}
            </AdminButton>

            <Link
              href="/admin/products"
              prefetch={true}
              className="block w-full rounded-xl border border-neutral-200 py-2.5 text-center text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Hủy bỏ
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
