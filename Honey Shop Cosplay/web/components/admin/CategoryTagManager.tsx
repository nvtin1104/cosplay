'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
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

function CategoryNode({
  category,
  categories,
  depth,
  isAdmin,
  onChanged,
  setError,
}: {
  category: Category;
  categories: Category[];
  depth: number;
  isAdmin: boolean;
  onChanged: () => void;
  setError: (msg: string) => void;
}) {
  const children = categories.filter((c) => (c.parentId || null) === category.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [moving, setMoving] = useState(false);
  const [parentId, setParentId] = useState(category.parentId || '');

  async function rename() {
    if (!name.trim()) return;
    try {
      await api(`/categories/${category.id}`, { method: 'PATCH', body: JSON.stringify({ name: name.trim() }) });
      setEditing(false);
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function addChild() {
    if (!childName.trim()) return;
    try {
      await api('/categories', { method: 'POST', body: JSON.stringify({ name: childName.trim(), parentId: category.id }) });
      setChildName('');
      setAddingChild(false);
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function move() {
    try {
      await api(`/categories/${category.id}`, { method: 'PATCH', body: JSON.stringify({ parentId: parentId || null }) });
      setMoving(false);
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove() {
    if (!confirm(`Xóa danh mục "${category.name}"? Toàn bộ danh mục con bên trong cũng sẽ bị xóa.`)) return;
    try {
      await api(`/categories/${category.id}`, { method: 'DELETE' });
      onChanged();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className={depth > 0 ? 'ml-5 border-l border-neutral-100 pl-4' : ''}>
      <div className="flex items-center gap-2 py-1.5 group">
        {editing ? (
          <>
            <input
              className="admin-input py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button onClick={rename} className="text-emerald-600 hover:text-emerald-700">
              <Check size={16} />
            </button>
            <button onClick={() => { setEditing(false); setName(category.name); }} className="text-neutral-400 hover:text-neutral-600">
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium">{category.name}</span>
            <span className="text-xs text-neutral-400">{children.length > 0 ? `${children.length} mục con` : ''}</span>
            <button onClick={() => setAddingChild(!addingChild)} title="Thêm danh mục con" className="text-neutral-400 hover:text-black">
              <Plus size={15} />
            </button>
            <button onClick={() => setEditing(true)} title="Đổi tên" className="text-neutral-400 hover:text-black">
              <Pencil size={14} />
            </button>
            <button onClick={() => setMoving(!moving)} title="Di chuyển" className="text-xs font-semibold text-neutral-400 hover:text-black">
              Di chuyển
            </button>
            {isAdmin && (
              <button onClick={remove} title="Xóa" className="text-neutral-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            )}
          </>
        )}
      </div>

      {addingChild && (
        <div className="ml-5 mb-2 flex gap-2">
          <input
            className="admin-input py-1 text-sm"
            placeholder="Tên danh mục con"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            autoFocus
          />
          <button onClick={addChild} className="rounded-lg bg-black px-3 py-1 text-xs font-semibold text-white">
            Thêm
          </button>
        </div>
      )}

      {moving && (
        <div className="ml-5 mb-2 flex gap-2">
          <select className="admin-input py-1 text-sm" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Cấp gốc</option>
            {categories
              .filter((c) => c.id !== category.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <button onClick={move} className="rounded-lg bg-black px-3 py-1 text-xs font-semibold text-white">
            Lưu
          </button>
        </div>
      )}

      {children.map((child) => (
        <CategoryNode
          key={child.id}
          category={child}
          categories={categories}
          depth={depth + 1}
          isAdmin={isAdmin}
          onChanged={onChanged}
          setError={setError}
        />
      ))}
    </div>
  );
}

export function CategoryManager() {
  const user = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');

  const load = () => {
    return api<Category[]>('/categories')
      .then((data) => {
        setCategories(data);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  async function addRoot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api('/categories', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      setNewName('');
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const roots = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />
      <form onSubmit={addRoot} className="admin-card flex flex-wrap items-center gap-3 p-5">
        <input
          className="admin-input max-w-xs flex-1"
          placeholder="Danh mục gốc mới, VD: Game, Anime"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white">+ Thêm danh mục gốc</button>
      </form>

      <div className="admin-card p-5">
        {loading ? (
          <p className="text-sm text-neutral-500">Đang tải…</p>
        ) : roots.length === 0 ? (
          <p className="text-sm text-neutral-400">Chưa có danh mục nào.</p>
        ) : (
          roots.map((cat) => (
            <CategoryNode key={cat.id} category={cat} categories={categories} depth={0} isAdmin={isAdmin} onChanged={load} setError={setError} />
          ))
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
