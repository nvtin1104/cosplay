'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  FolderTree,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  KeyRound,
  Copy,
  Layers,
  MoveHorizontal,
  CornerDownRight,
  Search,
  ChevronsUpDown,
  ChevronsDownUp,
} from 'lucide-react';
import type { AuthUser, Category, ProductTag } from '../../lib/types';

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

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface CategoryWithMeta extends Category {
  productCount?: number;
}

// Build breadcrumb paths for names and slugs
function getCategoryPath(cat: Category, allCats: Category[]): { names: string[]; slugs: string[] } {
  const names: string[] = [cat.name];
  const slugs: string[] = [cat.slug];
  let parentId = cat.parentId;
  while (parentId) {
    const parent = allCats.find((c) => c.id === parentId);
    if (!parent) break;
    names.unshift(parent.name);
    slugs.unshift(parent.slug);
    parentId = parent.parentId;
  }
  return { names, slugs };
}

// Get all descendant IDs of a category to prevent circular moving
function getDescendantIds(catId: string, allCats: Category[]): Set<string> {
  const ids = new Set<string>([catId]);
  let added = true;
  while (added) {
    added = false;
    for (const c of allCats) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        added = true;
      }
    }
  }
  return ids;
}

function CopyKeyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Sao chép Key / Slug"
      className="inline-flex items-center gap-1 rounded bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 text-[11px] font-mono font-medium text-neutral-700 transition"
    >
      <KeyRound size={11} className="text-neutral-500" />
      <span>{text}</span>
      {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={10} className="text-neutral-400" />}
    </button>
  );
}

const TIER_STYLES = [
  {
    tier: 1,
    name: 'TẦNG 1 • GỐC',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    card: 'border-neutral-200 bg-white shadow-sm hover:border-amber-300',
    iconColor: 'text-amber-600',
    indicator: 'bg-amber-500',
  },
  {
    tier: 2,
    name: 'TẦNG 2 • NHÓM',
    badge: 'bg-blue-100 text-blue-900 border-blue-200',
    card: 'border-neutral-200 bg-neutral-50/70 hover:bg-white hover:border-blue-300',
    iconColor: 'text-blue-600',
    indicator: 'bg-blue-500',
  },
  {
    tier: 3,
    name: 'TẦNG 3 • CHI TIẾT',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    card: 'border-dashed border-neutral-200 bg-white hover:border-emerald-300',
    iconColor: 'text-emerald-600',
    indicator: 'bg-emerald-500',
  },
  {
    tier: 4,
    name: 'TẦNG 4+',
    badge: 'bg-purple-100 text-purple-900 border-purple-200',
    card: 'border-dashed border-neutral-200 bg-purple-50/30 hover:border-purple-300',
    iconColor: 'text-purple-600',
    indicator: 'bg-purple-500',
  },
];

function CategoryNode({
  category,
  categories,
  depth,
  isAdmin,
  searchQuery,
  expandedIds,
  toggleExpand,
  onChanged,
  setError,
}: {
  category: CategoryWithMeta;
  categories: CategoryWithMeta[];
  depth: number;
  isAdmin: boolean;
  searchQuery: string;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onChanged: () => void;
  setError: (msg: string) => void;
}) {
  const children = categories.filter((c) => (c.parentId || null) === category.id);
  const isExpanded = expandedIds.has(category.id);
  const tierStyle = TIER_STYLES[Math.min(depth, TIER_STYLES.length - 1)];

  // Editing state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editSlug, setEditSlug] = useState(category.slug);
  const [autoSlug, setAutoSlug] = useState(false);

  // Add child state
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childSlug, setChildSlug] = useState('');
  const [autoChildSlug, setAutoChildSlug] = useState(true);

  // Moving state
  const [moving, setMoving] = useState(false);
  const [newParentId, setNewParentId] = useState(category.parentId || '');

  const path = getCategoryPath(category, categories);
  const invalidMoveIds = getDescendantIds(category.id, categories);

  // Matches search
  const isMatch =
    !searchQuery ||
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase());

  async function saveEdit() {
    if (!editName.trim()) return;
    try {
      await api(`/categories/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim() ? slugify(editSlug.trim()) : slugify(editName.trim()),
        }),
      });
      setEditing(false);
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function addChild() {
    if (!childName.trim()) return;
    try {
      await api('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: childName.trim(),
          slug: childSlug.trim() ? slugify(childSlug.trim()) : slugify(childName.trim()),
          parentId: category.id,
        }),
      });
      setChildName('');
      setChildSlug('');
      setAddingChild(false);
      if (!isExpanded) toggleExpand(category.id);
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function move() {
    try {
      await api(`/categories/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ parentId: newParentId || null }),
      });
      setMoving(false);
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove() {
    const promptText =
      children.length > 0
        ? `Xóa danh mục "${category.name}"?\nCHÚ Ý: Có ${children.length} danh mục con trực thuộc cũng sẽ bị xóa vĩnh viễn!`
        : `Xóa danh mục "${category.name}" (${category.slug})?`;
    if (!confirm(promptText)) return;
    try {
      await api(`/categories/${category.id}`, { method: 'DELETE' });
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className={`relative transition-all ${depth > 0 ? 'ml-4 sm:ml-7 pl-3 sm:pl-4 border-l-2 border-neutral-200' : ''}`}>
      {/* Connector branch for child nodes */}
      {depth > 0 && (
        <div className="absolute -left-[2px] top-5 w-3 sm:w-4 border-b-2 border-neutral-200 rounded-bl" />
      )}

      {/* Main Node Card */}
      <div
        className={`my-2 rounded-xl border p-3.5 transition-all ${tierStyle.card} ${
          isMatch ? 'ring-1 ring-neutral-900/10' : 'opacity-80'
        }`}
      >
        {editing ? (
          <div className="space-y-3 bg-neutral-50/90 p-3 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Pencil size={13} /> Chỉnh sửa danh mục ({tierStyle.name})
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditName(category.name);
                  setEditSlug(category.slug);
                }}
                className="text-neutral-400 hover:text-black"
              >
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Tên danh mục *</label>
                <input
                  className="admin-input py-1.5 text-sm"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (autoSlug) setEditSlug(slugify(e.target.value));
                  }}
                  placeholder="VD: Genshin Impact"
                  autoFocus
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-neutral-600">Key / Mã định danh (Slug) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSlug(true);
                      setEditSlug(slugify(editName));
                    }}
                    className="text-[11px] text-amber-700 hover:underline"
                  >
                    Tự sinh theo tên
                  </button>
                </div>
                <input
                  className="admin-input py-1.5 text-sm font-mono"
                  value={editSlug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setEditSlug(e.target.value);
                  }}
                  placeholder="VD: genshin-impact"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-neutral-500 font-mono">
                URL query: <code className="text-neutral-700">?category={editSlug ? slugify(editSlug) : '...'}</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Info & Hierarchy */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Expand / Collapse toggle */}
              {children.length > 0 ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(category.id)}
                  title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-black transition"
                >
                  {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center text-neutral-300">
                  <div className={`h-2 w-2 rounded-full ${tierStyle.indicator}`} />
                </div>
              )}

              {/* Folder Icon */}
              <div className={`p-1 rounded-md bg-neutral-100 ${tierStyle.iconColor}`}>
                {children.length > 0 ? (
                  isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
                ) : (
                  <Layers size={15} />
                )}
              </div>

              {/* Category Name & Breadcrumb & Key */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold text-neutral-900 ${depth === 0 ? 'text-base font-bold' : ''}`}>
                    {category.name}
                  </span>
                  <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tierStyle.badge}`}>
                    {tierStyle.name}
                  </span>
                  {children.length > 0 && (
                    <span className="text-xs text-neutral-500 font-medium">
                      ({children.length} mục con)
                    </span>
                  )}
                  {typeof category.productCount === 'number' && category.productCount > 0 && (
                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 text-[11px] font-medium">
                      {category.productCount} sản phẩm
                    </span>
                  )}
                </div>

                {/* Key Badge & Path */}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="text-[11px] text-neutral-400">Key:</span>
                  <CopyKeyButton text={category.slug} />
                  {depth > 0 && (
                    <span className="hidden sm:inline text-[11px] text-neutral-400 font-mono">
                      (Đường dẫn: {path.slugs.join(' / ')})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setAddingChild(!addingChild)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  addingChild ? 'bg-black text-white' : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
                title={`Thêm danh mục con cấp ${depth + 2}`}
              >
                <Plus size={13} />
                <span className="hidden sm:inline">Thêm con (Tầng {depth + 2})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setEditName(category.name);
                  setEditSlug(category.slug);
                }}
                className="rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-500 hover:text-black hover:border-neutral-400 transition"
                title="Chỉnh sửa tên và key"
              >
                <Pencil size={14} />
              </button>

              <button
                type="button"
                onClick={() => setMoving(!moving)}
                className={`flex items-center gap-1 rounded-lg border p-1.5 text-xs font-semibold transition ${
                  moving ? 'bg-amber-100 border-amber-300 text-amber-900' : 'border-neutral-200 bg-white text-neutral-500 hover:text-black hover:border-neutral-400'
                }`}
                title="Di chuyển tầng / Chọn danh mục cha"
              >
                <MoveHorizontal size={14} />
                <span className="hidden md:inline">Đổi tầng</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={remove}
                  className="rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
                  title="Xóa danh mục"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Add Child Form */}
        {addingChild && (
          <div className="mt-3.5 border-t border-neutral-200/70 pt-3.5 bg-neutral-50/80 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <CornerDownRight size={13} className="text-blue-600" />
                Thêm danh mục con (Tầng {depth + 2}) trực thuộc "{category.name}"
              </span>
              <button
                type="button"
                onClick={() => setAddingChild(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">Tên mục con *</label>
                <input
                  className="admin-input py-1.5 text-sm"
                  placeholder="VD: Trang phục, Vũ khí, Wig..."
                  value={childName}
                  onChange={(e) => {
                    setChildName(e.target.value);
                    if (autoChildSlug) setChildSlug(slugify(e.target.value));
                  }}
                  autoFocus
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-neutral-600">Key / Slug (Mã lọc URL) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoChildSlug(true);
                      setChildSlug(slugify(childName));
                    }}
                    className="text-[10px] text-blue-700 hover:underline"
                  >
                    Tự sinh slug
                  </button>
                </div>
                <input
                  className="admin-input py-1.5 text-sm font-mono"
                  placeholder="VD: trang-phuc, vu-khi"
                  value={childSlug}
                  onChange={(e) => {
                    setAutoChildSlug(false);
                    setChildSlug(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500 font-mono">
                Key đầy đủ: <code className="text-blue-800">{category.slug}/{childSlug ? slugify(childSlug) : '...'}</code>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddingChild(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={addChild}
                  className="rounded-lg bg-black px-4 py-1 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Tạo mục con
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Move Hierarchy Form */}
        {moving && (
          <div className="mt-3.5 border-t border-neutral-200/70 pt-3.5 bg-amber-50/60 p-3 rounded-lg border border-amber-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <MoveHorizontal size={13} />
                Chuyển danh mục "{category.name}" sang vị trí tầng mới:
              </span>
              <button type="button" onClick={() => setMoving(false)} className="text-neutral-400 hover:text-black">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="admin-input py-1.5 text-sm flex-1 min-w-[200px]"
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
              >
                <option value="">-- Chuyển thành Cấp 1 (Danh mục gốc) --</option>
                {categories
                  .filter((c) => !invalidMoveIds.has(c.id))
                  .map((c) => {
                    const cPath = getCategoryPath(c, categories);
                    return (
                      <option key={c.id} value={c.id}>
                        {cPath.names.join(' > ')} [key: {c.slug}]
                      </option>
                    );
                  })}
              </select>
              <button
                type="button"
                onClick={move}
                className="rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                Xác nhận đổi tầng
              </button>
              <button
                type="button"
                onClick={() => setMoving(false)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700"
              >
                Hủy
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-amber-800">
              * Hệ thống đã tự động lọc để ngăn việc chuyển danh mục vào chính nó hoặc danh mục con của nó.
            </p>
          </div>
        )}
      </div>

      {/* Render Subtree Children */}
      {isExpanded && children.length > 0 && (
        <div className="space-y-1">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              categories={categories}
              depth={depth + 1}
              isAdmin={isAdmin}
              searchQuery={searchQuery}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onChanged={onChanged}
              setError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryManager() {
  const user = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const [categories, setCategories] = useState<CategoryWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New root form
  const [newRootName, setNewRootName] = useState('');
  const [newRootSlug, setNewRootSlug] = useState('');
  const [autoRootSlug, setAutoRootSlug] = useState(true);
  const [showAddRoot, setShowAddRoot] = useState(false);

  // Search & Expand controls
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = () => {
    return api<CategoryWithMeta[]>('/categories')
      .then((data) => {
        setCategories(data);
        setError('');
        // Expand all by default initially
        setExpandedIds((prev) => (prev.size === 0 ? new Set(data.map((c) => c.id)) : prev));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(categories.map((c) => c.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  async function addRoot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newRootName.trim()) return;
    try {
      await api('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newRootName.trim(),
          slug: newRootSlug.trim() ? slugify(newRootSlug.trim()) : slugify(newRootName.trim()),
        }),
      });
      setNewRootName('');
      setNewRootSlug('');
      setShowAddRoot(false);
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const roots = categories.filter((c) => !c.parentId);
  const subCategoriesCount = categories.length - roots.length;

  // Calculate maximum depth
  let maxDepth = 0;
  for (const c of categories) {
    const depth = getCategoryPath(c, categories).names.length;
    if (depth > maxDepth) maxDepth = depth;
  }

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} />

      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="admin-card p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tổng danh mục</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-neutral-900">{categories.length}</span>
            <FolderTree size={20} className="text-neutral-400" />
          </div>
        </div>
        <div className="admin-card p-4 flex flex-col justify-between border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Tầng 1 (Cấp gốc)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900">{roots.length}</span>
            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">GỐC</span>
          </div>
        </div>
        <div className="admin-card p-4 flex flex-col justify-between border-l-4 border-l-blue-500">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Danh mục con</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-900">{subCategoriesCount}</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">NHÁNH</span>
          </div>
        </div>
        <div className="admin-card p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Số tầng sâu nhất</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900">{maxDepth || 1} tầng</span>
            <Layers size={20} className="text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Control Toolbar: Search + Actions */}
      <div className="admin-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="admin-input pl-10 pr-4 py-2 text-sm"
            placeholder="Tìm theo tên danh mục hoặc key/slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition"
          >
            <ChevronsUpDown size={14} /> Mở tất cả
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition"
          >
            <ChevronsDownUp size={14} /> Thu gọn
          </button>
          <button
            type="button"
            onClick={() => setShowAddRoot(!showAddRoot)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              showAddRoot ? 'bg-neutral-800 text-white' : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            <Plus size={14} />
            <span>Thêm Tầng 1 (Gốc)</span>
          </button>
        </div>
      </div>

      {/* Add Root Form Box */}
      {showAddRoot && (
        <form onSubmit={addRoot} className="admin-card p-5 border-2 border-amber-300 bg-amber-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-black">
                1
              </span>
              Tạo mới Danh mục Gốc (Tầng 1)
            </h3>
            <button
              type="button"
              onClick={() => setShowAddRoot(false)}
              className="text-neutral-400 hover:text-black"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Tên danh mục gốc *
              </label>
              <input
                className="admin-input py-2 text-sm"
                placeholder="VD: Anime & Manga, Game, Phụ kiện Cosplay"
                value={newRootName}
                onChange={(e) => {
                  setNewRootName(e.target.value);
                  if (autoRootSlug) setNewRootSlug(slugify(e.target.value));
                }}
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Key / Slug (Mã định danh URL) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAutoRootSlug(true);
                    setNewRootSlug(slugify(newRootName));
                  }}
                  className="text-xs text-amber-700 hover:underline font-medium"
                >
                  Tự động tạo slug
                </button>
              </div>
              <input
                className="admin-input py-2 text-sm font-mono"
                placeholder="VD: anime-manga, game, phu-kien"
                value={newRootSlug}
                onChange={(e) => {
                  setAutoRootSlug(false);
                  setNewRootSlug(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-amber-200">
            <span className="text-xs text-neutral-500 font-mono">
              Key xem trước: <code className="text-amber-800 font-bold">/cosplay?category={newRootSlug ? slugify(newRootSlug) : '...'}</code>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddRoot(false)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="rounded-lg bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                + Xác nhận tạo Tầng 1
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Tree List */}
      <div className="admin-card p-4 sm:p-6 bg-white min-h-[300px]">
        <div className="mb-4 pb-3 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700 uppercase tracking-wider">
            CÂY PHÂN CẤP DANH MỤC ({roots.length} gốc, {subCategoriesCount} nhánh)
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Tầng 1 (Gốc)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Tầng 2 (Nhóm)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Tầng 3 (Chi tiết)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Đang tải danh mục…</div>
        ) : roots.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FolderTree size={36} className="mx-auto text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-600">Chưa có danh mục nào trong hệ thống</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Hãy tạo danh mục gốc Tầng 1 đầu tiên (ví dụ: Game, Anime, Phụ kiện) để phân loại đồ cosplay.
            </p>
            <button
              type="button"
              onClick={() => setShowAddRoot(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              <Plus size={14} /> Tạo danh mục gốc đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {roots.map((cat) => (
              <CategoryNode
                key={cat.id}
                category={cat}
                categories={categories}
                depth={0}
                isAdmin={isAdmin}
                searchQuery={searchQuery}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                onChanged={load}
                setError={setError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TagManager() {
  const user = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');

  const load = () => {
    return api<ProductTag[]>('/tags')
      .then((data) => {
        setItems(data);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  async function addTag(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api('/tags', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      setNewName('');
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function rename(id: string) {
    if (!editingName.trim()) return;
    try {
      await api(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify({ name: editingName.trim() }) });
      setEditingId('');
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa tag này? Tag sẽ được gỡ khỏi toàn bộ sản phẩm đang gắn.')) return;
    try {
      await api(`/tags/${id}`, { method: 'DELETE' });
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />
      <form onSubmit={addTag} className="admin-card flex flex-wrap items-center gap-3 p-5">
        <input
          className="admin-input max-w-xs flex-1"
          placeholder="Tag mới, VD: Đồ mới, Sale, Hot"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white">+ Thêm tag</button>
      </form>

      <div className="admin-card overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-neutral-500">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-sm text-neutral-400">Chưa có tag nào.</p>
        ) : (
          items.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between gap-3 border-b border-neutral-100 p-4 last:border-0">
              {editingId === tag.id ? (
                <>
                  <input
                    className="admin-input flex-1 py-1.5 text-sm"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => rename(tag.id)} className="text-emerald-600 hover:text-emerald-700">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId('')} className="text-neutral-400 hover:text-neutral-600">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">{tag.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingId(tag.id);
                        setEditingName(tag.name);
                      }}
                      className="text-neutral-400 hover:text-black"
                    >
                      <Pencil size={14} />
                    </button>
                    {isAdmin && (
                      <button onClick={() => remove(tag.id)} className="text-neutral-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
