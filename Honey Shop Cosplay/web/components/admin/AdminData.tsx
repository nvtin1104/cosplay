'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Post, Product } from '../../lib/types';

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

function State({ loading, error }: { loading: boolean; error: string }) {
  if (loading) {
    return (
      <div className="admin-card p-8 text-sm text-neutral-500 flex items-center gap-3">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
        Đang tải dữ liệu…
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  return null;
}

export function DashboardData({ initialData }: { initialData?: { products: Product[]; rentals: any[]; posts: Post[] } }) {
  const [data, setData] = useState<{ products: Product[]; rentals: any[]; posts: Post[] } | null>(initialData || null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) return;
    let active = true;
    Promise.all([api<Product[]>('/products'), api<any[]>('/rentals'), api<Post[]>('/posts')])
      .then(([products, rentals, posts]) => {
        if (active) setData({ products, rentals, posts });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [initialData]);

  return (
    <div>
      {!data ? (
        <State loading={!error} error={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Sản phẩm', data.products.length],
              ['Lịch thuê', data.rentals.length],
              ['Bài viết', data.posts.length],
              ['Đang có sẵn', data.products.filter((p) => p.status === 'AVAILABLE').length],
            ].map(([label, value]) => (
              <div className="admin-card p-5" key={String(label)}>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="mt-3 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="admin-card mt-6 p-6">
            <h2 className="text-lg font-bold">Tình trạng hệ thống</h2>
            <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <p className="rounded-lg bg-neutral-100 p-4">
                Worker API <b className="float-right text-emerald-600 font-bold">Online</b>
              </p>
              <p className="rounded-lg bg-neutral-100 p-4">
                D1 database <b className="float-right text-emerald-600 font-bold">Connected</b>
              </p>
              <p className="rounded-lg bg-neutral-100 p-4">
                Phiên đăng nhập <b className="float-right text-emerald-600 font-bold">Secure</b>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ProductManager({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const [items, setItems] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const load = () => {
    return api<Product[]>('/products')
      .then((data) => {
        setItems(data);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialProducts.length === 0) {
      void load();
    }
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api('/products', {
        method: 'POST',
        body: JSON.stringify({
          title: f.get('title'),
          slug: f.get('slug'),
          description: f.get('description'),
          testPrice: Number(f.get('testPrice')),
          fesPrice: Number(f.get('fesPrice')),
          shootPrice: Number(f.get('shootPrice')),
          totalQuantity: Number(f.get('totalQuantity')),
          thumbnailUrl: f.get('thumbnailUrl'),
        }),
      });
      setOpen(false);
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function archive(id: string) {
    if (!confirm('Ẩn sản phẩm này khỏi storefront?')) return;
    await api(`/products/${id}`, { method: 'DELETE' });
    void load();
  }

  return (
    <>
      {error && <State loading={false} error={error} />}
      <div className="mb-5 flex justify-end">
        <button onClick={() => setOpen(!open)} className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white">
          {open ? 'Đóng form' : '+ Thêm sản phẩm'}
        </button>
      </div>
      {open && (
        <form onSubmit={create} className="admin-card mb-6 grid gap-4 p-6 md:grid-cols-2">
          <input className="admin-input" name="title" placeholder="Tên sản phẩm" required />
          <input className="admin-input" name="slug" placeholder="slug-san-pham" required />
          <textarea className="admin-input md:col-span-2" name="description" placeholder="Mô tả" />
          <input className="admin-input" name="testPrice" type="number" placeholder="Giá test" />
          <input className="admin-input" name="fesPrice" type="number" placeholder="Giá fes" />
          <input className="admin-input" name="shootPrice" type="number" placeholder="Giá shoot" />
          <input className="admin-input" name="totalQuantity" type="number" min="1" defaultValue="1" />
          <input className="admin-input md:col-span-2" name="thumbnailUrl" placeholder="/assets/production/34.png" />
          <button className="rounded-lg bg-black px-4 py-3 font-semibold text-white md:col-span-2">Lưu sản phẩm</button>
        </form>
      )}
      {loading && items.length === 0 ? (
        <State loading={true} error="" />
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="p-4">Sản phẩm</th>
                <th>Giá test</th>
                <th>Số lượng</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr className="border-b border-neutral-100" key={p.id}>
                  <td className="p-4">
                    <b>{p.title}</b>
                    <p className="text-xs text-neutral-400">{p.slug}</p>
                  </td>
                  <td>{(p.testPrice || 0).toLocaleString('vi-VN')}đ</td>
                  <td>{p.totalQuantity}</td>
                  <td>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">{p.status}</span>
                  </td>
                  <td>
                    <button onClick={() => archive(p.id)} className="text-xs font-semibold text-neutral-500 underline">
                      Ẩn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function RentalManager({ initialRentals = [] }: { initialRentals?: any[] }) {
  const [items, setItems] = useState<any[]>(initialRentals);
  const [loading, setLoading] = useState(initialRentals.length === 0);
  const [error, setError] = useState('');

  const load = () => {
    return api<any[]>('/rentals')
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialRentals.length === 0) {
      void load();
    }
  }, []);

  return (
    <>
      {error && <State loading={false} error={error} />}
      {loading && items.length === 0 ? (
        <State loading={true} error="" />
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="p-4">Khách hàng</th>
                <th>Thời gian</th>
                <th>Cọc</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((r) => (
                  <tr className="border-b border-neutral-100" key={r.id}>
                    <td className="p-4">
                      <b>{r.customerName}</b>
                      <p className="text-xs text-neutral-400">{r.customerPhone}</p>
                    </td>
                    <td>
                      {new Date(r.startDate).toLocaleDateString('vi-VN')} — {new Date(r.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td>{Number(r.deposit || 0).toLocaleString('vi-VN')}đ</td>
                    <td>{Number(r.totalAmount || 0).toLocaleString('vi-VN')}đ</td>
                    <td>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">{r.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-neutral-400">
                    Chưa có lịch thuê.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function PostManager({ initialPosts = [] }: { initialPosts?: Post[] }) {
  const [items, setItems] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const load = () => {
    return api<Post[]>('/posts')
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialPosts.length === 0) {
      void load();
    }
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api('/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: f.get('title'),
          slug: f.get('slug'),
          excerpt: f.get('excerpt'),
          content: f.get('content'),
          type: f.get('type'),
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString(),
        }),
      });
      setOpen(false);
      void load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <>
      {error && <State loading={false} error={error} />}
      <div className="mb-5 flex justify-end">
        <button onClick={() => setOpen(!open)} className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white">
          {open ? 'Đóng form' : '+ Viết bài'}
        </button>
      </div>
      {open && (
        <form onSubmit={create} className="admin-card mb-6 grid gap-4 p-6">
          <input className="admin-input" name="title" placeholder="Tiêu đề" required />
          <input className="admin-input" name="slug" placeholder="slug-bai-viet" required />
          <select className="admin-input" name="type">
            <option value="ARTICLE">Bài viết</option>
            <option value="GUIDE">Hướng dẫn</option>
          </select>
          <textarea className="admin-input" name="excerpt" placeholder="Tóm tắt" />
          <textarea className="admin-input min-h-40" name="content" placeholder="Nội dung" required />
          <button className="rounded-lg bg-black px-4 py-3 font-semibold text-white">Xuất bản</button>
        </form>
      )}
      {loading && items.length === 0 ? (
        <State loading={true} error="" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((p) => (
            <article className="admin-card p-5" key={p.id}>
              <div className="flex justify-between text-xs font-semibold text-neutral-400">
                <span>{p.type}</span>
                <span>{p.status}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold">{p.title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{p.excerpt}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const load = () => {
    return Promise.all([api<any[]>('/admin/users'), api<any[]>('/admin/invitations')])
      .then(([u, i]) => {
        setUsers(u);
        setInvites(i);
      })
      .catch((e) => setMessage(e.message));
  };

  useEffect(() => {
    void load();
  }, []);

  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const result = await api<any>('/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: f.get('email'), role: f.get('role') }),
      });
      setMessage(result.inviteUrl ? `Link demo: ${result.inviteUrl}` : 'Đã gửi lời mời qua email.');
      void load();
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_.7fr]">
      <div className="admin-card overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-bold">Tài khoản</h2>
        </div>
        {users.map((u) => (
          <div className="flex items-center justify-between border-b p-5" key={u.id}>
            <div>
              <b>{u.name}</b>
              <p className="text-sm text-neutral-500">{u.email}</p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">{u.role}</span>
          </div>
        ))}
      </div>
      <div>
        <form onSubmit={invite} className="admin-card p-5">
          <h2 className="font-bold">Mời thành viên</h2>
          <input className="admin-input mt-4" name="email" type="email" placeholder="staff@example.com" required />
          <select className="admin-input mt-3" name="role">
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button className="mt-3 w-full rounded-lg bg-black py-3 font-semibold text-white">Gửi lời mời</button>
          {message && <p className="mt-3 break-all text-xs leading-5 text-neutral-500">{message}</p>}
        </form>
        <div className="admin-card mt-5 p-5">
          <h2 className="font-bold">Lời mời gần đây</h2>
          <p className="mt-2 text-sm text-neutral-500">{invites.length} lời mời đã tạo.</p>
        </div>
      </div>
    </div>
  );
}

