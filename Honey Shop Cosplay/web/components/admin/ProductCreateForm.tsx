'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  Package,
  Layers,
  MapPin,
  FileText,
  Tag,
} from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

const SAMPLE_THUMBNAILS = [
  { label: 'Set 34', url: '/assets/production/34.png' },
  { label: 'Set 25', url: '/assets/production/25.png' },
  { label: 'Set 21', url: '/assets/production/21.png' },
  { label: 'Set 28', url: '/assets/production/28.png' },
];

export function ProductCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustom, setIsSlugCustom] = useState(false);
  const [description, setDescription] = useState('');
  const [testPrice, setTestPrice] = useState<number | string>(120000);
  const [fesPrice, setFesPrice] = useState<number | string>(250000);
  const [shootPrice, setShootPrice] = useState<number | string>(180000);
  const [totalQuantity, setTotalQuantity] = useState<number | string>(1);
  const [status, setStatus] = useState<'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'ARCHIVED'>('AVAILABLE');
  const [isCombo, setIsCombo] = useState(false);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('/assets/production/34.png');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto slug generation on title change unless manually overridden
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugCustom) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setIsSlugCustom(true);
  };

  const regenerateSlug = () => {
    const generated = slugify(title);
    setSlug(generated);
    setIsSlugCustom(false);
  };

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
        const response = await fetch('/api/v1/products', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            slug: finalSlug,
            description: description.trim(),
            testPrice: Number(testPrice) || 0,
            fesPrice: Number(fesPrice) || 0,
            shootPrice: Number(shootPrice) || 0,
            totalQuantity: Math.max(1, Number(totalQuantity) || 1),
            status,
            isCombo,
            location: location.trim(),
            note: note.trim(),
            thumbnailUrl: thumbnailUrl.trim(),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Không thể tạo sản phẩm. Vui lòng kiểm tra lại slug hoặc thông tin.');
        }

        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/products');
          router.refresh();
        }, 600);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tạo sản phẩm.');
      }
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
          Catalog mới
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
          <span>Sản phẩm đã được tạo thành công! Đang chuyển hướng về kho đồ…</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main 2 columns: General details, pricing, inventory */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 1: Basic Info */}
          <div className="admin-card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Package size={18} className="text-amber-600" />
              Thông tin sản phẩm
            </h2>
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
                <div className="relative mt-1">
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="furina-genshin-impact"
                    className="admin-input font-mono text-sm"
                  />
                </div>
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
                      Đánh dấu nếu đây là set bao gồm trang phục kèm trọn bộ wig, giày và đạo cụ.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="admin-card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <DollarSign size={18} className="text-emerald-600" />
              Thiết lập giá thuê (VNĐ)
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Cung cấp các mức giá thuê tùy theo nhu cầu của khách hàng.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Giá test đồ
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={testPrice}
                  onChange={(e) => setTestPrice(e.target.value)}
                  className="admin-input mt-1 font-semibold"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  {formatVnd(testPrice)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Giá fes (sự kiện)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={fesPrice}
                  onChange={(e) => setFesPrice(e.target.value)}
                  className="admin-input mt-1 font-semibold"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  {formatVnd(fesPrice)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Giá shoot ảnh
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={shootPrice}
                  onChange={(e) => setShootPrice(e.target.value)}
                  className="admin-input mt-1 font-semibold"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  {formatVnd(shootPrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Inventory & Storage */}
          <div className="admin-card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Layers size={18} className="text-blue-600" />
              Kho & Bảo quản
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Số lượng sẵn có
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(e.target.value)}
                  className="admin-input mt-1"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Vị trí trong kho
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ví dụ: Kệ A1, Tủ đồ 3"
                  className="admin-input mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Ghi chú nội bộ
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú về bảo quản, giặt ủi, hư hại nhỏ hoặc lưu ý khi giao nhận cho nhân viên..."
                  className="admin-input mt-1 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar column: Status, Thumbnail, Save actions */}
        <div className="space-y-6">
          {/* Status Box */}
          <div className="admin-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Trạng thái sản phẩm
            </h3>
            <div className="mt-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="admin-input text-sm font-semibold"
              >
                <option value="AVAILABLE">🟢 Sẵn sàng cho thuê (Available)</option>
                <option value="RENTED">🟡 Đang được thuê (Rented)</option>
                <option value="MAINTENANCE">🔧 Đang bảo trì / Giặt là (Maintenance)</option>
                <option value="ARCHIVED">⚪ Lưu trữ / Tạm ẩn (Archived)</option>
              </select>
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
              <label className="block text-xs font-medium text-neutral-600">URL ảnh (Nội bộ hoặc Link ngoài)</label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="/assets/production/34.png"
                className="admin-input mt-1 font-mono text-xs"
              />
            </div>

            {/* Quick Presets */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase">Ảnh mẫu nhanh:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {SAMPLE_THUMBNAILS.map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => setThumbnailUrl(item.url)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      thumbnailUrl === item.url
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
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
                  Đã tạo thành công!
                </>
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
