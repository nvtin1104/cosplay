import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { drizzle } from 'drizzle-orm/d1';
import { desc, eq, sql } from 'drizzle-orm';
import { products, productImages, productVariants, posts, rentals, rentalItems } from './db/schema';
import { AppEnv, AppVariables, hashPassword, randomToken, requireAdmin, requireAuth, SESSION_COOKIE, sha256, validOrigin, verifyPassword } from './auth';

const app = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();
const now = () => new Date().toISOString();
const plusHours = (hours: number) => new Date(Date.now() + hours * 3600000).toISOString();
const safeUser = (user: any) => ({ id: user.id, email: user.email, name: user.name, role: user.role, active: !!user.active });

app.onError((err, c) => { console.error('API Error:', err); return c.json({ message: err.message || 'Lỗi máy chủ nội bộ' }, 500); });
app.use('*', async (c, next) => cors({ origin: c.env.CORS_ORIGIN || c.env.APP_URL || '*', credentials: true, allowHeaders: ['Content-Type'], allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] })(c, next));
app.use('*', async (c, next) => { if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) && !validOrigin(c)) return c.json({ message: 'Invalid request origin' }, 403); await next(); });
app.get('/health', c => c.json({ ok: true, service: 'honey-shop-api-worker', runtime: 'cloudflare-workers', timestamp: now() }));

app.post('/auth/login', async c => {
  const body = await c.req.json<{ email?: string; password?: string }>(); const email = body.email?.trim().toLowerCase();
  if (!email || !body.password) return c.json({ message: 'Email và mật khẩu là bắt buộc' }, 400);
  const ipHash = await sha256(c.req.header('CF-Connecting-IP') || 'local'); const since = new Date(Date.now() - 15 * 60000).toISOString();
  const failed = await c.env.DB.prepare('SELECT count(*) count FROM login_attempts WHERE email=? AND ip_hash=? AND successful=0 AND created_at>?').bind(email, ipHash, since).first<{ count: number }>();
  if (Number(failed?.count || 0) >= 8) return c.json({ message: 'Đăng nhập tạm khóa. Vui lòng thử lại sau 15 phút.' }, 429);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email=? AND active=1').bind(email).first<any>();
  const valid = user && await verifyPassword(body.password, user.password_salt, user.password_hash);
  await c.env.DB.prepare('INSERT INTO login_attempts (id,email,ip_hash,successful,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), email, ipHash, valid ? 1 : 0, now()).run();
  if (!valid) return c.json({ message: 'Email hoặc mật khẩu không đúng' }, 401);
  const token = randomToken(); const expiresAt = plusHours(24 * 7);
  await c.env.DB.prepare('INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), user.id, await sha256(token), expiresAt, now()).run();
  setCookie(c, SESSION_COOKIE, token, { httpOnly: true, secure: new URL(c.req.url).protocol === 'https:', sameSite: 'Lax', path: '/', maxAge: 604800 });
  return c.json({ user: safeUser(user) });
});
app.get('/auth/me', requireAuth, c => c.json({ user: safeUser(c.get('user')) }));
app.post('/auth/logout', async c => { const token = getCookie(c, SESSION_COOKIE); if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run(); deleteCookie(c, SESSION_COOKIE, { path: '/' }); return c.json({ ok: true }); });
app.post('/auth/change-password', requireAuth, async c => { const body = await c.req.json<any>(); const user = await c.env.DB.prepare('SELECT * FROM users WHERE id=?').bind(c.get('user').id).first<any>(); if (!user || !await verifyPassword(body.currentPassword || '', user.password_salt, user.password_hash)) return c.json({ message: 'Mật khẩu hiện tại không đúng' }, 400); if (!body.newPassword || body.newPassword.length < 10) return c.json({ message: 'Mật khẩu mới cần ít nhất 10 ký tự' }, 400); const next = await hashPassword(body.newPassword); await c.env.DB.batch([c.env.DB.prepare('UPDATE users SET password_hash=?,password_salt=?,updated_at=? WHERE id=?').bind(next.hash, next.salt, now(), user.id), c.env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]); deleteCookie(c, SESSION_COOKIE, { path: '/' }); return c.json({ ok: true }); });
app.post('/auth/forgot-password', async c => { const { email } = await c.req.json<any>(); const user = await c.env.DB.prepare('SELECT id,email,name FROM users WHERE email=? AND active=1').bind(String(email || '').toLowerCase()).first<any>(); if (user) { const token = randomToken(); await c.env.DB.prepare('INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), user.id, await sha256(token), plusHours(1), now()).run(); await sendEmail(c.env, user.email, 'Đặt lại mật khẩu Honey Shop', `${c.env.APP_URL}/admin/reset-password?token=${encodeURIComponent(token)}`); } return c.json({ ok: true, message: 'Nếu tài khoản tồn tại, email hướng dẫn đã được gửi.' }); });
app.post('/auth/reset-password', async c => { const body = await c.req.json<any>(); if (!body.password || body.password.length < 10) return c.json({ message: 'Mật khẩu cần ít nhất 10 ký tự' }, 400); const tokenHash = await sha256(body.token || ''); const reset = await c.env.DB.prepare('SELECT * FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>?').bind(tokenHash, now()).first<any>(); if (!reset) return c.json({ message: 'Liên kết không hợp lệ hoặc đã hết hạn' }, 400); const next = await hashPassword(body.password); await c.env.DB.batch([c.env.DB.prepare('UPDATE users SET password_hash=?,password_salt=?,updated_at=? WHERE id=?').bind(next.hash, next.salt, now(), reset.user_id), c.env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE id=?').bind(now(), reset.id), c.env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(reset.user_id)]); return c.json({ ok: true }); });
app.post('/auth/accept-invite', async c => { const body = await c.req.json<any>(); if (!body.password || body.password.length < 10) return c.json({ message: 'Mật khẩu cần ít nhất 10 ký tự' }, 400); const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE token_hash=? AND accepted_at IS NULL AND expires_at>?').bind(await sha256(body.token || ''), now()).first<any>(); if (!invite) return c.json({ message: 'Lời mời không hợp lệ hoặc đã hết hạn' }, 400); const pass = await hashPassword(body.password); const id = crypto.randomUUID(); await c.env.DB.batch([c.env.DB.prepare('INSERT INTO users (id,email,name,role,password_hash,password_salt,active,created_at,updated_at) VALUES (?,?,?,?,?,?,1,?,?)').bind(id, invite.email, body.name || invite.email.split('@')[0], invite.role, pass.hash, pass.salt, now(), now()), c.env.DB.prepare('UPDATE invitations SET accepted_at=? WHERE id=?').bind(now(), invite.id)]); return c.json({ ok: true }); });

app.get('/products', async c => c.json(await drizzle(c.env.DB).select().from(products).where(sql`${products.status} != 'ARCHIVED'`).orderBy(desc(products.createdAt))));
app.get('/products/:slug', async c => { const db = drizzle(c.env.DB); const product = await db.select().from(products).where(eq(products.slug, c.req.param('slug'))).get(); if (!product) return c.json({ message: 'Product not found' }, 404); const [images, variants] = await Promise.all([db.select().from(productImages).where(eq(productImages.productId, product.id)), db.select().from(productVariants).where(eq(productVariants.productId, product.id))]); return c.json({ ...product, images, variants }); });
app.post('/products', requireAuth, async c => { const body = await c.req.json<any>(); const stamp = now(); const id = body.id || crypto.randomUUID(); const db = drizzle(c.env.DB); await db.insert(products).values({ id, slug: body.slug, title: body.title, description: body.description, testPrice: body.testPrice || 0, fesPrice: body.fesPrice || 0, shootPrice: body.shootPrice || 0, thumbnailUrl: body.thumbnailUrl, status: body.status || 'AVAILABLE', totalQuantity: body.totalQuantity || 1, note: body.note, location: body.location, isCombo: !!body.isCombo, createdAt: stamp, updatedAt: stamp }); return c.json(await db.select().from(products).where(eq(products.id, id)).get(), 201); });
app.patch('/products/:id', requireAuth, async c => { const body = await c.req.json<any>(); const id = c.req.param('id')!; const db = drizzle(c.env.DB); await db.update(products).set({ ...body, updatedAt: now() }).where(eq(products.id, id)); return c.json(await db.select().from(products).where(eq(products.id, id)).get()); });
app.delete('/products/:id', requireAuth, async c => { await drizzle(c.env.DB).update(products).set({ status: 'ARCHIVED', updatedAt: now() }).where(eq(products.id, c.req.param('id')!)); return c.json({ ok: true }); });

app.get('/posts', async c => c.json(await drizzle(c.env.DB).select().from(posts).orderBy(desc(posts.createdAt))));
app.get('/posts/:slug', async c => { const item = await drizzle(c.env.DB).select().from(posts).where(eq(posts.slug, c.req.param('slug'))).get(); return item ? c.json(item) : c.json({ message: 'Post not found' }, 404); });
app.post('/posts', requireAuth, async c => { const body = await c.req.json<any>(); const stamp = now(); const id = body.id || crypto.randomUUID(); await drizzle(c.env.DB).insert(posts).values({ ...body, id, createdAt: stamp, updatedAt: stamp }); return c.json({ id }, 201); });
app.patch('/posts/:id', requireAuth, async c => { const body = await c.req.json<any>(); await drizzle(c.env.DB).update(posts).set({ ...body, updatedAt: now() }).where(eq(posts.id, c.req.param('id')!)); return c.json({ ok: true }); });

app.get('/rentals', requireAuth, async c => c.json(await drizzle(c.env.DB).select().from(rentals).orderBy(rentals.startDate)));
app.post('/rentals', requireAuth, async c => { const body = await c.req.json<any>(); const start = new Date(body.startDate); const end = new Date(body.endDate); if (!(end > start)) return c.json({ message: 'endDate must be after startDate' }, 400); const db = drizzle(c.env.DB); for (const item of body.items || []) { const product = await db.select().from(products).where(eq(products.id, item.productId)).get(); if (!product) return c.json({ message: 'Product not found' }, 404); const overlap = await db.select({ quantity: sql<number>`coalesce(sum(${rentalItems.quantity}), 0)` }).from(rentalItems).innerJoin(rentals, eq(rentalItems.rentalId, rentals.id)).where(sql`${rentalItems.productId} = ${item.productId} AND ${rentals.status} != 'CANCELLED' AND ${rentals.startDate} < ${end.toISOString()} AND ${rentals.endDate} > ${start.toISOString()}`).get(); if (Number(overlap?.quantity || 0) + Number(item.quantity || 1) > product.totalQuantity) return c.json({ message: 'Product quantity is unavailable for this period' }, 409); } const id = crypto.randomUUID(); const stamp = now(); await c.env.DB.batch([c.env.DB.prepare('INSERT INTO rentals (id,customer_name,customer_phone,start_date,end_date,status,deposit,total_amount,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id, body.customerName, body.customerPhone || null, start.toISOString(), end.toISOString(), body.status || 'HOLD', body.deposit || 0, body.totalAmount || 0, body.note || null, stamp, stamp), ...(body.items || []).map((item: any) => c.env.DB.prepare('INSERT INTO rental_items (id,rental_id,product_id,variant_id,quantity,price) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), id, item.productId, item.variantId || null, item.quantity || 1, item.price || 0))]); return c.json({ id }, 201); });
app.patch('/rentals/:id', requireAuth, async c => { const body = await c.req.json<any>(); await drizzle(c.env.DB).update(rentals).set({ ...body, updatedAt: now() }).where(eq(rentals.id, c.req.param('id')!)); return c.json({ ok: true }); });

app.get('/admin/users', requireAuth, requireAdmin, async c => { const result = await c.env.DB.prepare('SELECT id,email,name,role,active,created_at createdAt FROM users ORDER BY created_at DESC').all(); return c.json(result.results); });
app.patch('/admin/users/:id', requireAuth, requireAdmin, async c => { const body = await c.req.json<any>(); await c.env.DB.prepare('UPDATE users SET role=coalesce(?,role),active=coalesce(?,active),updated_at=? WHERE id=?').bind(body.role || null, typeof body.active === 'boolean' ? Number(body.active) : null, now(), c.req.param('id')).run(); if (body.active === false) await c.env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(c.req.param('id')).run(); return c.json({ ok: true }); });
app.delete('/admin/users/:id/sessions', requireAuth, requireAdmin, async c => { await c.env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(c.req.param('id')).run(); return c.json({ ok: true }); });
app.get('/admin/invitations', requireAuth, requireAdmin, async c => { const result = await c.env.DB.prepare('SELECT id,email,role,expires_at expiresAt,accepted_at acceptedAt,created_at createdAt FROM invitations ORDER BY created_at DESC').all(); return c.json(result.results); });
app.post('/admin/invitations', requireAuth, requireAdmin, async c => { const body = await c.req.json<any>(); const email = String(body.email || '').trim().toLowerCase(); if (!email.includes('@')) return c.json({ message: 'Email không hợp lệ' }, 400); const token = randomToken(); const inviteUrl = `${c.env.APP_URL}/admin/accept-invite?token=${encodeURIComponent(token)}`; await c.env.DB.prepare('INSERT INTO invitations (id,email,role,token_hash,expires_at,created_by,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(), email, body.role === 'ADMIN' ? 'ADMIN' : 'STAFF', await sha256(token), plusHours(72), c.get('user').id, now()).run(); await sendEmail(c.env, email, 'Lời mời quản trị Honey Shop', inviteUrl); return c.json({ ok: true, inviteUrl: c.env.RESEND_API_KEY ? undefined : inviteUrl }, 201); });

async function sendEmail(env: AppEnv, to: string, subject: string, link: string) { if (!env.RESEND_API_KEY) return; await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.RESEND_FROM, to: [to], subject, html: `<p>${subject}</p><p><a href="${link}">Mở liên kết bảo mật</a></p><p>Liên kết có thời hạn và chỉ dùng một lần.</p>` }) }); }

const root = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();
root.route('/api/v1', app);
root.get('/', c => c.html(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Honey Shop Cosplay API</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #fff6dc; color: #24150e; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
    .card { background: #fff; border: 2px solid #24150e; box-shadow: 6px 7px 0 #24150e; padding: 2.2rem; max-width: 520px; width: 100%; }
    .badge { background: #ffe75c; border: 2px solid #24150e; padding: 5px 12px; font-weight: 800; display: inline-block; margin-bottom: 1.2rem; font-size: 0.85rem; }
    h1 { margin: 0 0 0.6rem; font-size: 1.8rem; letter-spacing: -0.02em; }
    p { color: #624b40; line-height: 1.6; margin: 0 0 1.5rem; font-size: 0.95rem; }
    .links { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.5rem; }
    .link-item { border: 2px solid #24150e; padding: 11px 14px; background: #fffdfa; text-decoration: none; color: #24150e; font-weight: 800; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; transition: background 0.15s; }
    .link-item:hover { background: #ffe75c; }
    .primary-btn { display: block; background: #ff9b35; color: #fff; text-decoration: none; padding: 13px; font-weight: 800; text-align: center; border: 2px solid #24150e; box-shadow: 4px 5px 0 #24150e; font-size: 1rem; transition: transform 0.15s; }
    .primary-btn:hover { background: #f0851d; transform: translate(-1px, -1px); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🍯 HONEY SHOP COSPLAY · API WORKER</div>
    <h1>Cloudflare Worker Sẵn Sàng!</h1>
    <p>Hệ thống Backend API và cơ sở dữ liệu Cloudflare D1 đang hoạt động ổn định.</p>
    <div class="links">
      <a class="link-item" href="/api/v1/health"><span>Kiểm tra hệ thống (/api/v1/health)</span> <span>✓ 200 OK</span></a>
      <a class="link-item" href="/api/v1/products"><span>Danh mục sản phẩm (/api/v1/products)</span> <span>JSON →</span></a>
      <a class="link-item" href="/api/v1/posts"><span>Bài viết & Mẹo thuê (/api/v1/posts)</span> <span>JSON →</span></a>
    </div>
    <a class="primary-btn" href="/api/v1/products">Xem JSON dữ liệu sản phẩm ↗</a>
  </div>
</body>
</html>`));

export default root;
