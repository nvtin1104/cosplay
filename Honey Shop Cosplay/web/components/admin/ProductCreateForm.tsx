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

type Category = { id: string; name: string; slug: string; parentId: string | null };
type TagItem = { id: string; name: string; slug: string };
type SimpleProduct = { id: string; title: string; thumbnailUrl?: string; isCombo?: boolean; testPrice: number };

type EditableProduct = {
  id: string; title: string; slug: string; description?: string;
  testPrice: number; fesPrice: number; shootPrice: number; totalQuantity: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'ARCHIVED'; isCombo?: boolean;
  thumbnailUrl?: string;
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
          <label className="flex items-center gap-2 py-1 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(cat.id)}
              onChange={() => onToggle(cat.id)}
              className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
            />
            {cat.name}
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
  const [testPrice, setTestPrice] = useState<number | string>(product?.testPrice ?? 120000);
  const [fesPrice, setFesPrice] = useState<number | string>(product?.fesPrice ?? 250000);
  const [shootPrice, setShootPrice] = useState<number | string>(product?.shootPrice ?? 180000);
  const [status, setStatus] = useState<'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'ARCHIVED'>(product?.status || 'AVAILABLE');
  const [isCombo, setIsCombo] = useState(!!product?.isCombo);
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnailUrl || '');
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

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/v1/admin/uploads', { method: 'POST', credentials: 'include', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Tải ảnh lên thất bại.');
      setThumbnailUrl(data.url);
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
            testPrice: Number(testPrice) || 0,
            fesPrice: Number(fesPrice) || 0,
            shootPrice: Number(shootPrice) || 0,
            totalQuantity: product?.totalQuantity ?? 1,
            status,
            isCombo,
            thumbnailUrl: thumbnailUrl.trim(),
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
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: Furina - Genshin Impact (Full Set)"
                  className="admin-input mt-1 text-base font-medium"
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
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="furina-genshin-impact"
                  className="admin-input mt-1 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Đường dẫn hiển thị: <span className="font-mono text-neutral-600">/cosplay/{slug || '...'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Mô tả chi tiết & Phụ kiện đi kèm
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bao gồm: Trang phục nguyên set, wig tạo kiểu, mũ, găng tay, phụ kiện gài ngực... Size phù hợp 1m55 - 1m68."
                  className="admin-input mt-1 text-sm"
                />
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
                              <input
                                type="number"
                                min={1}
                                value={picked.quantity}
                                onChange={(e) => setComboQuantity(p.id, Number(e.target.value) || 1)}
                                className="admin-input w-16 py-1 text-xs"
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
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="admin-input mt-1 font-semibold"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs font-medium text-emerald-600">{formatVnd(value)}</p>
                </div>
              ))}
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
              <input
                className="admin-input flex-1 min-w-[140px]"
                placeholder="Tên danh mục mới"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <select className="admin-input w-44" value={newCategoryParent} onChange={(e) => setNewCategoryParent(e.target.value)}>
                <option value="">Cấp gốc (VD: Game, Anime)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addCategory} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">
                Thêm
              </button>
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
              <input
                className="admin-input flex-1"
                placeholder="Tag mới, VD: Hot"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <button type="button" onClick={addTag} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">
                Thêm
              </button>
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

          {/* Thumbnail & Image Preview */}
          <div className="admin-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
              <span>Hình ảnh đại diện</span>
              <ImageIcon size={16} className="text-neutral-400" />
            </h3>

            <div className="mt-3">
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 py-4 text-sm font-semibold text-neutral-600 hover:border-black hover:text-black transition-colors">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Đang tải lên…' : 'Tải ảnh lên'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-neutral-600">Hoặc nhập URL ảnh (link ngoài)</label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://... hoặc /assets/..."
                className="admin-input mt-1 font-mono text-xs"
              />
            </div>

            {/* Live Preview Box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-neutral-500">Xem trước:</span>
              <div className="mt-1 relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                {thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnailUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-4 text-neutral-400">
                    <ImageIcon size={32} className="mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Chưa có ảnh</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="admin-card p-6 space-y-3">
            <button
              type="submit"
              disabled={isPending || success}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-bold text-white shadow-md hover:bg-neutral-800 disabled:opacity-50 transition-all"
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
            </button>

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
