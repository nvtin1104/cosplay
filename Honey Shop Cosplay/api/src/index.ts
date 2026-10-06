import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { drizzle } from 'drizzle-orm/d1';
import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import sanitizeHtml from 'sanitize-html';
import { products, productImages, productVariants, posts, rentals, rentalItems, postCategories } from './db/schema';
import { AppEnv, AppVariables, hashPassword, randomToken, requireAdmin, requireAuth, SESSION_COOKIE, sha256, supportsPasswordHash, validOrigin, verifyPassword } from './auth';

const app = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();
const now = () => new Date().toISOString();
const plusHours = (hours: number) => new Date(Date.now() + hours * 3600000).toISOString();
const safeUser = (user: any) => ({ id: user.id, email: user.email, name: user.name, role: user.role, active: !!user.active });
const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'HANDED_TO_SHIPPER', 'DELIVERED_TO_CUSTOMER', 'RETURNING', 'RETURNED', 'CUSTOMER_REFUSED', 'CANCELLED'];
const paymentStatus = (totalAmount: number, depositPaid: number, balancePaid: number, depositRefunded: number) => {
  if (depositPaid > 0 && depositRefunded >= depositPaid) return 'DEPOSIT_REFUNDED';
  if (totalAmount > 0 && balancePaid >= totalAmount) return 'PAID';
  if (depositPaid > 0 || balancePaid > 0) return 'DEPOSIT_PAID';
  return 'UNPAID';
};
const processingStatus = (status: string, totalAmount: number, expectedDeposit: number, depositPaid: number, balancePaid: number, depositRefunded: number) => {
  const netPayments = depositPaid + balancePaid - depositRefunded;
  if ((totalAmount > 0 || expectedDeposit > 0) && netPayments <= 0) return 'WAITING_FOR_PAYMENT';
  const balanceSettled = totalAmount <= 0 || balancePaid >= totalAmount;
  if (['RETURNED', 'CANCELLED'].includes(status) && balanceSettled) return 'COMPLETED';
  return 'PROCESSING';
};
const rentalActor = (user: any) => ({ id: user.id, name: user.name || user.email || 'Nhân viên' });
const CUSTOMER_SESSION_COOKIE = 'honey_customer_session';
async function customerFromRequest(c: any) {
  const token = getCookie(c, CUSTOMER_SESSION_COOKIE);
  if (!token) return null;
  const customer = await c.env.DB.prepare('SELECT a.id,a.email,a.name,a.facebook_url facebookUrl,a.phone FROM customer_sessions s JOIN customer_accounts a ON a.id=s.customer_id WHERE s.token_hash=? AND s.expires_at>? AND a.active=1').bind(await sha256(token), now()).first() as any;
  return customer ? { ...customer, contactReady: !!(customer.facebookUrl || customer.phone) } : null;
}
async function createCustomerSession(c: any, customerId: string) {
  const token = randomToken();
  await c.env.DB.prepare('INSERT INTO customer_sessions (id,customer_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), customerId, await sha256(token), plusHours(24 * 30), now()).run();
  setCookie(c, CUSTOMER_SESSION_COOKIE, token, { httpOnly: true, secure: new URL(c.req.url).protocol === 'https:', sameSite: 'Lax', path: '/', maxAge: 2592000 });
}

app.onError((err, c) => { console.error('API Error:', err); return c.json({ message: err.message || 'Lỗi máy chủ nội bộ' }, 500); });
app.use('*', async (c, next) => cors({ origin: c.env.CORS_ORIGIN || c.env.APP_URL || '*', credentials: true, allowHeaders: ['Content-Type'], allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] })(c, next));
app.use('*', async (c, next) => { if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) && !validOrigin(c)) return c.json({ message: 'Invalid request origin' }, 403); await next(); });
app.get('/health', c => c.json({ ok: true, service: 'honey-shop-api-worker', runtime: 'cloudflare-workers', timestamp: now() }));

app.post('/customers/register', async c => {
  return c.json({ message: 'Honey chỉ hỗ trợ đăng nhập bằng Google. Hãy tiếp tục bằng Google để tạo hồ sơ khách lần đầu.' }, 410);
});
app.post('/customers/login', async c => {
  return c.json({ message: 'Honey chỉ hỗ trợ đăng nhập bằng Google.' }, 410);
});
app.post('/customers/google', async c => {
  if (!c.env.GOOGLE_CLIENT_ID) return c.json({ message: 'Chưa cấu hình Google Client ID cho hệ thống.' }, 503);
  const { credential } = await c.req.json<any>();
  if (!credential) return c.json({ message: 'Thiếu thông tin đăng nhập Google.' }, 400);
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(String(credential))}`);
  if (!response.ok) return c.json({ message: 'Thông tin Google không hợp lệ.' }, 401);
  const identity = await response.json() as { aud?: string; email_verified?: string; exp?: string; email?: string; name?: string };
  if (identity.aud !== c.env.GOOGLE_CLIENT_ID || identity.email_verified !== 'true' || Number(identity.exp) * 1000 <= Date.now()) return c.json({ message: 'Không xác minh được tài khoản Google.' }, 401);
  const email = String(identity.email || '').toLowerCase();
  let customer = await c.env.DB.prepare('SELECT id,email,name,facebook_url facebookUrl,phone,active FROM customer_accounts WHERE email=?').bind(email).first<any>();
  if (customer && !customer.active) return c.json({ message: 'Tài khoản đang tạm khóa. Hãy liên hệ shop để được hỗ trợ.' }, 403);
  if (!customer) {
    const id = crypto.randomUUID(); const stamp = now(); const name = String(identity.name || email.split('@')[0]);
    await c.env.DB.prepare('INSERT INTO customer_accounts (id,email,name,created_at,updated_at) VALUES (?,?,?,?,?)').bind(id, email, name, stamp, stamp).run();
    customer = { id, email, name, facebookUrl: null, phone: null };
  }
  await createCustomerSession(c, customer.id);
  return c.json({ user: { ...customer, contactReady: !!(customer.facebookUrl || customer.phone) } });
});
app.get('/customers/me', async c => {
  const customer = await customerFromRequest(c);
  return customer ? c.json({ user: customer }) : c.json({ message: 'Vui lòng đăng nhập.' }, 401);
});
app.patch('/customers/me', async c => {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ message: 'Vui lòng đăng nhập.' }, 401);
  const body = await c.req.json<any>();
  const facebookUrl = body.facebookUrl === undefined ? customer.facebookUrl : String(body.facebookUrl || '').trim();
  const phone = body.phone === undefined ? customer.phone : String(body.phone || '').trim();
  if (facebookUrl && !/^https:\/\/(www\.)?facebook\.com\//i.test(facebookUrl)) return c.json({ message: 'Link Facebook không hợp lệ.' }, 400);
  if (phone && !/^\+?[0-9\s().-]{7,24}$/.test(phone)) return c.json({ message: 'Số điện thoại không hợp lệ.' }, 400);
  if (!facebookUrl && !phone) return c.json({ message: 'Vui lòng nhập link Facebook hoặc số điện thoại để Honey liên hệ.' }, 400);
  await c.env.DB.prepare('UPDATE customer_accounts SET facebook_url=?,phone=?,updated_at=? WHERE id=?').bind(facebookUrl || null, phone || null, now(), customer.id).run();
  return c.json({ user: { ...customer, facebookUrl: facebookUrl || null, phone: phone || null, contactReady: true } });
});
app.get('/customers/rentals', async c => {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ message: 'Vui lòng đăng nhập.' }, 401);
  const result = await c.env.DB.prepare("SELECT r.id,r.customer_name customerName,r.start_date startDate,r.end_date endDate,r.status orderStatus,r.processing_status processingStatus,r.deposit,r.total_amount totalAmount,r.created_at createdAt,ri.quantity,ri.price,p.title productTitle,p.slug productSlug,p.thumbnail_url thumbnailUrl,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='DEPOSIT'),0) depositPaid,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='BALANCE'),0) balancePaid,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='DEPOSIT_REFUND'),0) depositRefunded FROM rentals r LEFT JOIN rental_items ri ON ri.rental_id=r.id LEFT JOIN products p ON p.id=ri.product_id WHERE lower(r.customer_email)=? ORDER BY r.start_date DESC LIMIT 100").bind(customer.email.toLowerCase()).all<any>();
  return c.json(result.results.map(row => ({ ...row, status: row.orderStatus, paymentStatus: paymentStatus(Number(row.totalAmount), Number(row.depositPaid), Number(row.balancePaid), Number(row.depositRefunded)) })));
});
app.get('/customers/points', async c => {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ message: 'Vui lòng đăng nhập.' }, 401);
  const [summary, ledger, settings] = await Promise.all([
    c.env.DB.prepare('SELECT coalesce(sum(points_delta),0) balance FROM loyalty_transactions WHERE customer_id=?').bind(customer.id).first<{ balance: number }>(),
    c.env.DB.prepare('SELECT id,event_type eventType,points_delta pointsDelta,note,created_at createdAt FROM loyalty_transactions WHERE customer_id=? ORDER BY created_at DESC LIMIT 100').bind(customer.id).all<any>(),
    c.env.DB.prepare("SELECT key,value FROM settings WHERE key IN ('points_currency_step','points_per_step','points_value_vnd')").all<{ key: string; value: string }>(),
  ]);
  return c.json({ balance: Number(summary?.balance || 0), ledger: ledger.results, settings: Object.fromEntries(settings.results.map(row => [row.key, Number(row.value)])) });
});
app.get('/customers/feedback', async c => {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ message: 'Vui lòng đăng nhập.' }, 401);
  const rows = await c.env.DB.prepare('SELECT f.id,f.content,f.image_url imageUrl,f.status,f.created_at createdAt,p.title productTitle,p.slug productSlug FROM product_feedback f JOIN products p ON p.id=f.product_id WHERE f.customer_id=? ORDER BY f.created_at DESC LIMIT 100').bind(customer.id).all<any>();
  return c.json(rows.results);
});
app.get('/customers/eligible-feedback/:slug', async c => {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ message: 'Vui lòng đăng nhập để kiểm tra lịch sử thuê.' }, 401);
  if (!customer.contactReady) return c.json({ message: 'Hãy bổ sung cách liên hệ trước khi gửi feedback.' }, 428);
  const product = await c.env.DB.prepare("SELECT id FROM products WHERE slug=? AND status!='ARCHIVED'").bind(c.req.param('slug')).first<{ id: string }>();
  if (!product) return c.json({ message: 'Không tìm thấy sản phẩm.' }, 404);
  const rentals = await c.env.DB.prepare("SELECT r.id,r.start_date startDate,r.end_date endDate FROM rentals r JOIN rental_items ri ON ri.rental_id=r.id WHERE lower(r.customer_email)=? AND ri.product_id=? AND r.status='RETURNED' AND NOT EXISTS (SELECT 1 FROM product_feedback f WHERE f.rental_id=r.id AND f.product_id=ri.product_id) ORDER BY r.end_date DESC LIMIT 100").bind(customer.email.toLowerCase(), product.id).all<any>();
  return c.json(rentals.results);
});
app.post('/customers/points/redeem', async c => {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ message: 'Đăng nhập tài khoản khách để đổi điểm.' }, 401);
  if (!customer.contactReady) return c.json({ message: 'Hãy bổ sung cách liên hệ trước khi đổi điểm.' }, 428);
  const settings = await c.env.DB.prepare("SELECT value FROM settings WHERE key='points_redemption_enabled'").first<{ value: string }>();
  if (settings?.value === '0') return c.json({ message: 'Shop đang tạm dừng đổi điểm.' }, 400);
  const body = await c.req.json<any>();
  const product = await c.env.DB.prepare("SELECT id,slug,title,points_price pointsPrice,total_quantity totalQuantity,status FROM products WHERE slug=? AND status='AVAILABLE'").bind(String(body.productSlug || '')).first<any>();
  if (!product || Number(product.pointsPrice) <= 0) return c.json({ message: 'Sản phẩm này hiện chưa áp dụng đổi điểm.' }, 400);
  const start = new Date(body.startDate); const end = new Date(body.endDate);
  if (!Number.isFinite(start.valueOf()) || !Number.isFinite(end.valueOf()) || end <= start) return c.json({ message: 'Nhập khoảng ngày thuê hợp lệ.' }, 400);
  const balance = await c.env.DB.prepare('SELECT coalesce(sum(points_delta),0) balance FROM loyalty_transactions WHERE customer_id=?').bind(customer.id).first<{ balance: number }>();
  if (Number(balance?.balance || 0) < Number(product.pointsPrice)) return c.json({ message: `Bạn cần ${product.pointsPrice} điểm để đổi sản phẩm này.` }, 400);
  const overlap = await c.env.DB.prepare("SELECT coalesce(sum(ri.quantity),0) quantity FROM rental_items ri JOIN rentals r ON r.id=ri.rental_id WHERE ri.product_id=? AND r.status!='CANCELLED' AND r.start_date<? AND r.end_date>?").bind(product.id, end.toISOString(), start.toISOString()).first<{ quantity: number }>();
  if (Number(overlap?.quantity || 0) >= Number(product.totalQuantity || 1)) return c.json({ message: 'Sản phẩm đã có lịch thuê trùng khoảng ngày này.' }, 409);
  const rentalId = crypto.randomUUID(); const stamp = now();
  try { await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO rentals (id,customer_name,customer_email,customer_phone,start_date,end_date,status,processing_status,deposit,total_amount,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(rentalId, customer.name, customer.email, customer.phone, start.toISOString(), end.toISOString(), 'NEW', processingStatus('NEW', 0, 0, 0, 0, 0), 0, 0, 'Đổi bằng điểm thành viên', stamp, stamp),
    c.env.DB.prepare('INSERT INTO rental_items (id,rental_id,product_id,variant_id,quantity,price) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), rentalId, product.id, null, 1, 0),
    c.env.DB.prepare("INSERT INTO loyalty_transactions (id,customer_id,rental_id,source_key,event_type,points_delta,note,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(), customer.id, rentalId, `redeem:${rentalId}`, 'REDEEM', -Number(product.pointsPrice), `Đổi ${product.title}`, stamp),
    c.env.DB.prepare('INSERT INTO rental_status_history (id,rental_id,from_status,to_status,from_processing_status,to_processing_status,actor_id,actor_name,created_at) VALUES (?,?,NULL,?,NULL,?,?,?,?)').bind(crypto.randomUUID(), rentalId, 'NEW', processingStatus('NEW', 0, 0, 0, 0, 0), customer.id, customer.name, stamp),
  ]); } catch { return c.json({ message: 'Số dư điểm vừa thay đổi. Hãy tải lại tài khoản và thử lại.' }, 409); }
  return c.json({ id: rentalId, pointsUsed: Number(product.pointsPrice), status: 'NEW', orderStatus: 'NEW', processingStatus: processingStatus('NEW', 0, 0, 0, 0, 0) }, 201);
});
app.post('/customers/logout', async c => { const token = getCookie(c, CUSTOMER_SESSION_COOKIE); if (token) await c.env.DB.prepare('DELETE FROM customer_sessions WHERE token_hash=?').bind(await sha256(token)).run(); deleteCookie(c, CUSTOMER_SESSION_COOKIE, { path: '/' }); return c.json({ ok: true }); });

app.get('/admin/dashboard', requireAuth, async c => {
  const [summary, rentals] = await Promise.all([
    c.env.DB.prepare("SELECT count(*) totalOrders,count(DISTINCT coalesce(nullif(lower(trim(r.customer_email)),''),nullif(lower(trim(r.customer_name)),''))) customerCount,sum(CASE WHEN r.status NOT IN ('RETURNED','CANCELLED') THEN 1 ELSE 0 END) activeOrders,coalesce(sum(coalesce(pt.deposit_paid,0)+coalesce(pt.balance_paid,0)-coalesce(pt.deposit_refunded,0)),0) amountCollected,coalesce(sum(max(0,coalesce(r.total_amount,0)-coalesce(pt.balance_paid,0))),0) amountOutstanding FROM rentals r LEFT JOIN (SELECT rental_id,sum(CASE WHEN type='DEPOSIT' THEN amount ELSE 0 END) deposit_paid,sum(CASE WHEN type='BALANCE' THEN amount ELSE 0 END) balance_paid,sum(CASE WHEN type='DEPOSIT_REFUND' THEN amount ELSE 0 END) deposit_refunded FROM rental_payment_transactions GROUP BY rental_id) pt ON pt.rental_id=r.id").first<any>(),
    c.env.DB.prepare("SELECT r.id,r.customer_name customerName,r.customer_email customerEmail,r.start_date startDate,r.end_date endDate,r.status orderStatus,r.processing_status processingStatus,r.total_amount totalAmount,r.deposit,r.note,coalesce((SELECT group_concat(p.title, ', ') FROM rental_items ri LEFT JOIN products p ON p.id=ri.product_id WHERE ri.rental_id=r.id),'') productNames,coalesce(pt.deposit_paid,0) depositPaid,coalesce(pt.balance_paid,0) balancePaid,coalesce(pt.deposit_refunded,0) depositRefunded FROM rentals r LEFT JOIN (SELECT rental_id,sum(CASE WHEN type='DEPOSIT' THEN amount ELSE 0 END) deposit_paid,sum(CASE WHEN type='BALANCE' THEN amount ELSE 0 END) balance_paid,sum(CASE WHEN type='DEPOSIT_REFUND' THEN amount ELSE 0 END) deposit_refunded FROM rental_payment_transactions GROUP BY rental_id) pt ON pt.rental_id=r.id WHERE r.status NOT IN ('RETURNED','CANCELLED') ORDER BY r.start_date LIMIT 200").all<any>(),
  ]);
  const items = rentals.results.map(row => ({ ...row, status: row.orderStatus, paymentStatus: paymentStatus(Number(row.totalAmount), Number(row.depositPaid), Number(row.balancePaid), Number(row.depositRefunded)) }));
  return c.json({ stats: summary, rentals: items });
});

app.get('/admin/customers', requireAuth, requireAdmin, async c => {
  const { limit, offset } = parsePage(c);
  const name = `%${String(c.req.query('name') || '').trim().toLowerCase()}%`;
  const email = `%${String(c.req.query('email') || '').trim().toLowerCase()}%`;
  const phone = `%${String(c.req.query('phone') || '').trim().toLowerCase()}%`;
  const searchText = String(c.req.query('search') || c.req.query('q') || '').trim().toLowerCase();
  const search = `%${searchText}%`;
  const active = String(c.req.query('active') || '');
  const date = String(c.req.query('date') || '').trim();
  const result = await c.env.DB.prepare("SELECT a.id,a.email,a.name,a.facebook_url facebookUrl,a.phone,a.active,a.created_at createdAt,coalesce((SELECT sum(points_delta) FROM loyalty_transactions l WHERE l.customer_id=a.id),0) points, (SELECT count(*) FROM rentals r WHERE lower(r.customer_email)=lower(a.email)) rentalCount FROM customer_accounts a WHERE (?='' OR lower(a.name) LIKE ? OR lower(a.email) LIKE ? OR lower(coalesce(a.phone,'')) LIKE ?) AND lower(a.name) LIKE ? AND lower(a.email) LIKE ? AND lower(coalesce(a.phone,'')) LIKE ? AND (?='' OR a.active=?) AND (?='' OR substr(a.created_at,1,10)=?) ORDER BY a.created_at DESC LIMIT ? OFFSET ?").bind(searchText, search, search, search, name, email, phone, active, active === '' ? 0 : Number(active), date, date, limit, offset).all<any>();
  return c.json(result.results.map(row => ({ ...row, active: !!row.active, points: Number(row.points) })));
});
app.get('/admin/customers/:id', requireAuth, requireAdmin, async c => {
  const customer = await c.env.DB.prepare('SELECT id,email,name,facebook_url facebookUrl,phone,active,created_at createdAt FROM customer_accounts WHERE id=?').bind(c.req.param('id')).first<any>();
  if (!customer) return c.json({ message: 'Không tìm thấy tài khoản khách.' }, 404);
  const result = await c.env.DB.prepare("SELECT r.id,r.customer_name customerName,r.start_date startDate,r.end_date endDate,r.status orderStatus,r.processing_status processingStatus,r.deposit,r.total_amount totalAmount,r.note,r.created_at createdAt,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='DEPOSIT'),0) depositPaid,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='BALANCE'),0) balancePaid,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='DEPOSIT_REFUND'),0) depositRefunded FROM rentals r WHERE lower(r.customer_email)=lower(?) ORDER BY r.start_date DESC LIMIT 200").bind(customer.email).all<any>();
  const rentals = result.results.map(row => ({ ...row, status: row.orderStatus, paymentStatus: paymentStatus(Number(row.totalAmount), Number(row.depositPaid), Number(row.balancePaid), Number(row.depositRefunded)) }));
  return c.json({ ...customer, active: !!customer.active, rentals });
});
app.patch('/admin/customers/:id', requireAuth, requireAdmin, async c => {
  const id = c.req.param('id')!; const body = await c.req.json<any>();
  const current = await c.env.DB.prepare('SELECT id FROM customer_accounts WHERE id=?').bind(id).first();
  if (!current) return c.json({ message: 'Không tìm thấy tài khoản khách.' }, 404);
  if (body.name !== undefined && !String(body.name).trim()) return c.json({ message: 'Tên không được để trống.' }, 400);
  if (body.facebookUrl && !/^https:\/\/(www\.)?facebook\.com\//i.test(String(body.facebookUrl))) return c.json({ message: 'Link Facebook không hợp lệ.' }, 400);
  await c.env.DB.prepare('UPDATE customer_accounts SET name=coalesce(?,name),facebook_url=coalesce(?,facebook_url),phone=coalesce(?,phone),active=coalesce(?,active),updated_at=? WHERE id=?').bind(body.name === undefined ? null : String(body.name).trim(), body.facebookUrl === undefined ? null : String(body.facebookUrl).trim(), body.phone === undefined ? null : String(body.phone).trim(), body.active === undefined ? null : body.active ? 1 : 0, now(), id).run();
  if (body.active === false) await c.env.DB.prepare('DELETE FROM customer_sessions WHERE customer_id=?').bind(id).run();
  return c.json({ ok: true });
});
app.post('/admin/customers/:id/points', requireAuth, requireAdmin, async c => {
  const id = c.req.param('id')!; const body = await c.req.json<any>(); const delta = Math.trunc(Number(body.pointsDelta)); const note = String(body.note || '').trim();
  if (!Number.isFinite(delta) || delta === 0 || !note) return c.json({ message: 'Nhập số điểm khác 0 và lý do điều chỉnh.' }, 400);
  const customer = await c.env.DB.prepare('SELECT id FROM customer_accounts WHERE id=?').bind(id).first();
  if (!customer) return c.json({ message: 'Không tìm thấy tài khoản khách.' }, 404);
  const balance = await c.env.DB.prepare('SELECT coalesce(sum(points_delta),0) balance FROM loyalty_transactions WHERE customer_id=?').bind(id).first<{ balance: number }>();
  if (Number(balance?.balance || 0) + delta < 0) return c.json({ message: 'Điều chỉnh này làm số dư điểm âm.' }, 400);
  await c.env.DB.prepare('INSERT INTO loyalty_transactions (id,customer_id,source_key,event_type,points_delta,note,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), id, `adjust:${crypto.randomUUID()}`, 'ADJUST', delta, note, c.get('user').id, now()).run();
  return c.json({ ok: true });
});
app.get('/admin/feedback', requireAuth, requireAdmin, async c => {
  const { limit, offset } = parsePage(c);
  const status = String(c.req.query('status') || '');
  const product = `%${String(c.req.query('product') || '').trim().toLowerCase()}%`;
  const customer = `%${String(c.req.query('customer') || '').trim().toLowerCase()}%`;
  const content = `%${String(c.req.query('content') || '').trim().toLowerCase()}%`;
  const searchText = String(c.req.query('search') || '').trim().toLowerCase();
  const search = `%${searchText}%`;
  const date = String(c.req.query('date') || '').trim();
  const sqlText = "SELECT f.id,f.product_id productId,p.title productTitle,p.slug productSlug,f.customer_id customerId,f.rental_id rentalId,coalesce(a.name,f.customer_name) customerName,f.customer_email customerEmail,f.content,f.image_url imageUrl,f.hide_identity hideIdentity,f.status,f.created_at createdAt FROM product_feedback f JOIN products p ON p.id=f.product_id LEFT JOIN customer_accounts a ON a.id=f.customer_id";
  const result = await c.env.DB.prepare(`${sqlText} WHERE (?='' OR f.status=?) AND (?='' OR lower(p.title) LIKE ? OR lower(coalesce(a.name,f.customer_name)) LIKE ? OR lower(coalesce(f.customer_email,'')) LIKE ? OR lower(f.content) LIKE ?) AND lower(p.title) LIKE ? AND lower(coalesce(a.name,f.customer_name)) LIKE ? AND lower(f.content) LIKE ? AND (?='' OR substr(f.created_at,1,10)=?) ORDER BY f.created_at DESC LIMIT ? OFFSET ?`).bind(status, status, searchText, search, search, search, search, product, customer, content, date, date, limit, offset).all<any>();
  return c.json(result.results.map(row => ({ ...row, hideIdentity: !!row.hideIdentity })));
});
app.patch('/admin/feedback/:id', requireAuth, requireAdmin, async c => {
  const { status } = await c.req.json<{ status: string }>();
  if (!['PENDING', 'APPROVED', 'HIDDEN'].includes(status)) return c.json({ message: 'Trạng thái feedback không hợp lệ.' }, 400);
  const result = await c.env.DB.prepare('UPDATE product_feedback SET status=? WHERE id=?').bind(status, c.req.param('id')).run();
  if (!result.meta.changes) return c.json({ message: 'Không tìm thấy feedback.' }, 404);
  return c.json({ ok: true });
});
app.delete('/admin/feedback/:id', requireAuth, requireAdmin, async c => { await c.env.DB.prepare('DELETE FROM product_feedback WHERE id=?').bind(c.req.param('id')).run(); return c.json({ ok: true }); });

app.post('/auth/login', async c => {
  const body = await c.req.json<{ email?: string; password?: string }>(); const email = body.email?.trim().toLowerCase();
  if (!email || !body.password) return c.json({ message: 'Email và mật khẩu là bắt buộc' }, 400);
  const ipHash = await sha256(c.req.header('CF-Connecting-IP') || 'local'); const since = new Date(Date.now() - 15 * 60000).toISOString();
  const failed = await c.env.DB.prepare('SELECT count(*) count FROM login_attempts WHERE email=? AND ip_hash=? AND successful=0 AND created_at>?').bind(email, ipHash, since).first<{ count: number }>();
  if (Number(failed?.count || 0) >= 8) return c.json({ message: 'Đăng nhập tạm khóa. Vui lòng thử lại sau 15 phút.' }, 429);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email=? AND active=1').bind(email).first<any>();
  const valid = user && await verifyPassword(body.password, user.password_salt, user.password_hash);
  await c.env.DB.prepare('INSERT INTO login_attempts (id,email,ip_hash,successful,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), email, ipHash, valid ? 1 : 0, now()).run();
  if (!valid) return c.json({ message: user && !supportsPasswordHash(user.password_hash) ? 'Tài khoản cần đặt lại mật khẩu để hoàn tất cập nhật bảo mật.' : 'Email hoặc mật khẩu không đúng' }, user && !supportsPasswordHash(user.password_hash) ? 409 : 401);
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

const parsePage = (c: any) => { const limit = Math.min(Math.max(Number(c.req.query('limit')) || 200, 1), 500); const offset = Math.max(Number(c.req.query('offset')) || 0, 0); return { limit, offset }; };
const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || crypto.randomUUID().slice(0, 8);

async function attachTaxonomy(DB: D1Database, productId: string, body: any) {
  const stmts: D1PreparedStatement[] = [];
  if (Array.isArray(body.categoryIds)) {
    stmts.push(DB.prepare('DELETE FROM product_categories WHERE product_id=?').bind(productId));
    for (const categoryId of body.categoryIds) stmts.push(DB.prepare('INSERT INTO product_categories (product_id,category_id) VALUES (?,?)').bind(productId, categoryId));
  }
  if (Array.isArray(body.tagIds)) {
    stmts.push(DB.prepare('DELETE FROM product_tags WHERE product_id=?').bind(productId));
    for (const tagId of body.tagIds) stmts.push(DB.prepare('INSERT INTO product_tags (product_id,tag_id) VALUES (?,?)').bind(productId, tagId));
  }
  if (Array.isArray(body.comboItems)) {
    stmts.push(DB.prepare('DELETE FROM product_combo_items WHERE combo_product_id=?').bind(productId));
    for (const item of body.comboItems) stmts.push(DB.prepare('INSERT INTO product_combo_items (combo_product_id,item_product_id,quantity) VALUES (?,?,?)').bind(productId, item.productId, item.quantity || 1));
  }
  if (Array.isArray(body.imageUrls)) {
    stmts.push(DB.prepare('DELETE FROM product_images WHERE product_id=?').bind(productId));
    for (const url of body.imageUrls) {
      const value = String(url || '').trim();
      if (value) stmts.push(DB.prepare("INSERT INTO product_images (id,product_id,url,kind) VALUES (?,?,?,'gallery')").bind(crypto.randomUUID(), productId, value));
    }
  }
  if (stmts.length) await DB.batch(stmts);
}

async function loadTaxonomy(DB: D1Database, productId: string) {
  const [cats, tagRows, combo] = await Promise.all([
    DB.prepare('SELECT c.id,c.name,c.slug,c.parent_id parentId FROM product_categories pc JOIN categories c ON c.id=pc.category_id WHERE pc.product_id=?').bind(productId).all(),
    DB.prepare('SELECT t.id,t.name,t.slug FROM product_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.product_id=?').bind(productId).all(),
    DB.prepare('SELECT pci.item_product_id productId, pci.quantity, p.title, p.slug, p.thumbnail_url thumbnailUrl FROM product_combo_items pci JOIN products p ON p.id=pci.item_product_id WHERE pci.combo_product_id=?').bind(productId).all(),
  ]);
  return { categories: cats.results, tags: tagRows.results, comboItems: combo.results };
}

app.get('/products', async c => {
  const { limit, offset } = parsePage(c);
  const category = c.req.query('category')?.trim();
  const tag = c.req.query('tag')?.trim();
  const conditions = [sql`${products.status} != 'ARCHIVED'`];
  if (category) conditions.push(sql`${products.id} IN (WITH RECURSIVE descendants(id) AS (SELECT id FROM categories WHERE slug=${category} UNION SELECT c.id FROM categories c JOIN descendants d ON c.parent_id=d.id) SELECT pc.product_id FROM product_categories pc JOIN descendants d ON d.id=pc.category_id)`);
  if (tag) conditions.push(sql`EXISTS (SELECT 1 FROM product_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.product_id=${products.id} AND t.slug=${tag})`);
  const items = await drizzle(c.env.DB).select().from(products).where(and(...conditions)).orderBy(desc(products.createdAt)).limit(limit).offset(offset);
  if (!items.length) return c.json([]);
  const ids = items.map(p => p.id);
  const marks = ids.map(() => '?').join(',');
  const [cats, tags] = await Promise.all([
    c.env.DB.prepare(`SELECT pc.product_id productId,c.id,c.name,c.slug,c.parent_id parentId FROM product_categories pc JOIN categories c ON c.id=pc.category_id WHERE pc.product_id IN (${marks})`).bind(...ids).all<any>(),
    c.env.DB.prepare(`SELECT pt.product_id productId,t.id,t.name,t.slug FROM product_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.product_id IN (${marks})`).bind(...ids).all<any>(),
  ]);
  return c.json(items.map(p => ({ ...p, categories: cats.results.filter(x => x.productId === p.id).map(({ productId, ...rest }) => rest), tags: tags.results.filter(x => x.productId === p.id).map(({ productId, ...rest }) => rest) })));
});
app.get('/admin/products', requireAuth, async c => {
  const { limit, offset } = parsePage(c);
  const title = `%${String(c.req.query('title') || '').trim().toLowerCase()}%`;
  const slug = `%${String(c.req.query('slug') || '').trim().toLowerCase()}%`;
  const searchText = String(c.req.query('search') || '').trim().toLowerCase();
  const search = `%${searchText}%`;
  const status = String(c.req.query('status') || '');
  const price = String(c.req.query('price') || '');
  const quantity = String(c.req.query('quantity') || '');
  const conditions = [sql`${products.status} != 'ARCHIVED'`, sql`(${searchText} = '' OR lower(${products.title}) LIKE ${search} OR lower(${products.slug}) LIKE ${search})`, sql`lower(${products.title}) LIKE ${title}`, sql`lower(${products.slug}) LIKE ${slug}`, sql`(${status} = '' OR ${products.status} = ${status})`, sql`(${price} = '' OR ${products.testPrice} = ${Number(price) || 0})`, sql`(${quantity} = '' OR ${products.totalQuantity} = ${Number(quantity) || 0})`];
  const items = await drizzle(c.env.DB).select().from(products).where(and(...conditions)).orderBy(desc(products.createdAt)).limit(limit).offset(offset);
  if (!items.length) return c.json([]);
  const ids = items.map(item => item.id);
  const marks = ids.map(() => '?').join(',');
  const [cats, tags] = await Promise.all([
    c.env.DB.prepare(`SELECT pc.product_id productId,c.id,c.name,c.slug,c.parent_id parentId FROM product_categories pc JOIN categories c ON c.id=pc.category_id WHERE pc.product_id IN (${marks})`).bind(...ids).all<any>(),
    c.env.DB.prepare(`SELECT pt.product_id productId,t.id,t.name,t.slug FROM product_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.product_id IN (${marks})`).bind(...ids).all<any>(),
  ]);
  return c.json(items.map(item => ({ ...item, categories: cats.results.filter(row => row.productId === item.id).map(({ productId, ...row }) => row), tags: tags.results.filter(row => row.productId === item.id).map(({ productId, ...row }) => row) })));
});
app.get('/admin/tags', requireAuth, async c => {
  const { limit, offset } = parsePage(c);
  const name = `%${String(c.req.query('name') || '').trim().toLowerCase()}%`;
  const slug = `%${String(c.req.query('slug') || '').trim().toLowerCase()}%`;
  const searchText = String(c.req.query('search') || '').trim().toLowerCase();
  const search = `%${searchText}%`;
  const result = await c.env.DB.prepare('SELECT id,name,slug FROM tags WHERE (?=\'\' OR lower(name) LIKE ? OR lower(slug) LIKE ?) AND lower(name) LIKE ? AND lower(slug) LIKE ? ORDER BY name LIMIT ? OFFSET ?').bind(searchText, search, search, name, slug, limit, offset).all();
  return c.json(result.results);
});
app.get('/admin/post-categories', requireAuth, async c => {
  const { limit, offset } = parsePage(c);
  const name = `%${String(c.req.query('name') || '').trim().toLowerCase()}%`;
  const slug = `%${String(c.req.query('slug') || '').trim().toLowerCase()}%`;
  const searchText = String(c.req.query('search') || '').trim().toLowerCase();
  const search = `%${searchText}%`;
  const result = await c.env.DB.prepare('SELECT id,name,slug FROM post_categories WHERE (?=\'\' OR lower(name) LIKE ? OR lower(slug) LIKE ?) AND lower(name) LIKE ? AND lower(slug) LIKE ? ORDER BY name LIMIT ? OFFSET ?').bind(searchText, search, search, name, slug, limit, offset).all();
  return c.json(result.results);
});
app.get('/products/id/:id', requireAuth, async c => { const db = drizzle(c.env.DB); const product = await db.select().from(products).where(eq(products.id, c.req.param('id')!)).get(); if (!product) return c.json({ message: 'Product not found' }, 404); const [images, variants, taxonomy] = await Promise.all([db.select().from(productImages).where(eq(productImages.productId, product.id)), db.select().from(productVariants).where(eq(productVariants.productId, product.id)), loadTaxonomy(c.env.DB, product.id)]); return c.json({ ...product, images, variants, ...taxonomy }); });
app.get('/products/:slug', async c => { const db = drizzle(c.env.DB); const product = await db.select().from(products).where(and(eq(products.slug, c.req.param('slug')), sql`${products.status} != 'ARCHIVED'`)).get(); if (!product) return c.json({ message: 'Product not found' }, 404); const [images, variants, taxonomy] = await Promise.all([db.select().from(productImages).where(eq(productImages.productId, product.id)), db.select().from(productVariants).where(eq(productVariants.productId, product.id)), loadTaxonomy(c.env.DB, product.id)]); return c.json({ ...product, images, variants, ...taxonomy }); });
app.post('/products', requireAuth, async c => { const body = await c.req.json<any>(); const stamp = now(); const id = body.id || crypto.randomUUID(); const db = drizzle(c.env.DB); await db.insert(products).values({ id, slug: body.slug, title: body.title, description: body.description, testPrice: body.testPrice || 0, fesPrice: body.fesPrice || 0, shootPrice: body.shootPrice || 0, thumbnailUrl: body.thumbnailUrl, status: body.status || 'AVAILABLE', totalQuantity: body.totalQuantity || 1, note: body.note, location: body.location, isCombo: !!body.isCombo, rewardPoints: Number(body.rewardPoints) || 0, pointsPrice: Number(body.pointsPrice) || 0, createdAt: stamp, updatedAt: stamp }); await attachTaxonomy(c.env.DB, id, body); const [product, taxonomy] = await Promise.all([db.select().from(products).where(eq(products.id, id)).get(), loadTaxonomy(c.env.DB, id)]); return c.json({ ...product, ...taxonomy }, 201); });
app.patch('/products/:id', requireAuth, async c => { const body = await c.req.json<any>(); const id = c.req.param('id')!; const db = drizzle(c.env.DB); const { categoryIds, tagIds, comboItems, imageUrls, ...patch } = body; await db.update(products).set({ ...patch, updatedAt: now() }).where(eq(products.id, id)); await attachTaxonomy(c.env.DB, id, body); const [product, taxonomy, images] = await Promise.all([db.select().from(products).where(eq(products.id, id)).get(), loadTaxonomy(c.env.DB, id), db.select().from(productImages).where(eq(productImages.productId, id))]); return c.json({ ...product, ...taxonomy, images }); });
app.delete('/products/:id', requireAuth, requireAdmin, async c => { await drizzle(c.env.DB).update(products).set({ status: 'ARCHIVED', updatedAt: now() }).where(eq(products.id, c.req.param('id')!)); return c.json({ ok: true }); });

app.get('/products/:slug/feedback', async c => {
  const product = await c.env.DB.prepare("SELECT id FROM products WHERE slug=? AND status!='ARCHIVED'").bind(c.req.param('slug')).first<{ id: string }>();
  if (!product) return c.json({ message: 'Không tìm thấy sản phẩm' }, 404);
  const rows = await c.env.DB.prepare("SELECT id,customer_name customerName,content,image_url imageUrl,hide_identity hideIdentity,created_at createdAt FROM product_feedback WHERE product_id=? AND status='APPROVED' ORDER BY created_at DESC LIMIT 100").bind(product.id).all<any>();
  return c.json(rows.results.map(row => ({ ...row, customerName: row.hideIdentity ? 'Khách thuê ẩn danh' : row.customerName, hideIdentity: !!row.hideIdentity })));
});
app.post('/products/:slug/feedback', async c => {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ message: 'Vui lòng đăng nhập để gửi feedback.' }, 401);
  if (!customer.contactReady) return c.json({ message: 'Hãy bổ sung cách liên hệ trước khi gửi feedback.' }, 428);
  const body = await c.req.json<any>();
  const name = customer.name;
  const content = String(body.content || '').trim();
  if (content.length < 5 || content.length > 2000) return c.json({ message: 'Nội dung feedback cần từ 5 đến 2.000 ký tự.' }, 400);
  const product = await c.env.DB.prepare("SELECT id FROM products WHERE slug=? AND status!='ARCHIVED'").bind(c.req.param('slug')).first<{ id: string }>();
  if (!product) return c.json({ message: 'Không tìm thấy sản phẩm' }, 404);
  const rentalId = String(body.rentalId || '').trim();
  if (!rentalId) return c.json({ message: 'Chọn một đơn thuê đã hoàn tất của sản phẩm này.' }, 400);
  const eligibleRental = await c.env.DB.prepare("SELECT r.id FROM rentals r JOIN rental_items ri ON ri.rental_id=r.id WHERE r.id=? AND lower(r.customer_email)=? AND ri.product_id=? AND r.status='RETURNED'").bind(rentalId, customer.email.toLowerCase(), product.id).first();
  if (!eligibleRental) return c.json({ message: 'Chỉ có thể feedback sản phẩm thuộc đơn thuê đã hoàn tất của tài khoản này.' }, 403);
  const existingFeedback = await c.env.DB.prepare('SELECT id FROM product_feedback WHERE rental_id=? AND product_id=?').bind(rentalId, product.id).first();
  if (existingFeedback) return c.json({ message: 'Bạn đã gửi feedback cho sản phẩm trong đơn thuê này.' }, 409);
  const id = crypto.randomUUID();
  const createdAt = now();
  const imageUrl = String(body.imageUrl || '').trim() || null;
  if (imageUrl && !/^(https?:\/\/|\/[^/])/.test(imageUrl)) return c.json({ message: 'Đường dẫn ảnh không hợp lệ.' }, 400);
  try {
    await c.env.DB.prepare("INSERT INTO product_feedback (id,product_id,customer_name,customer_email,content,image_url,hide_identity,status,customer_id,rental_id,created_at) VALUES (?,?,?,?,?,?,?,'PENDING',?,?,?)").bind(id, product.id, name, customer.email, content, imageUrl, body.hideIdentity ? 1 : 0, customer.id, rentalId, createdAt).run();
  } catch (error) {
    if (String(error).includes('UNIQUE constraint failed')) return c.json({ message: 'Bạn đã gửi feedback cho sản phẩm trong đơn thuê này.' }, 409);
    throw error;
  }
  return c.json({ id, customerName: body.hideIdentity ? 'Khách thuê ẩn danh' : name, content, imageUrl, hideIdentity: !!body.hideIdentity, status: 'PENDING', createdAt }, 201);
});

const cleanContent = (value: unknown) => sanitizeHtml(String(value || ''), {
  allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'blockquote', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'img'],
  allowedAttributes: { a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  transformTags: { a: (_tag, attrs) => ({ tagName: 'a', attribs: { ...attrs, rel: 'noopener noreferrer', target: '_blank' } }) },
});
const postFields = {
  id: posts.id, slug: posts.slug, title: posts.title, excerpt: posts.excerpt, content: posts.content,
  coverUrl: posts.coverUrl, type: posts.type, status: posts.status, seoTitle: posts.seoTitle,
  seoDescription: posts.seoDescription, categoryId: posts.categoryId, sortIndex: posts.sortIndex,
  publishedAt: posts.publishedAt, createdAt: posts.createdAt, updatedAt: posts.updatedAt,
  categoryName: postCategories.name, categorySlug: postCategories.slug,
};
const postSummaryFields = {
  id: posts.id, slug: posts.slug, title: posts.title, excerpt: posts.excerpt,
  coverUrl: posts.coverUrl, type: posts.type, status: posts.status, categoryId: posts.categoryId,
  sortIndex: posts.sortIndex, publishedAt: posts.publishedAt, createdAt: posts.createdAt,
  categoryName: postCategories.name, categorySlug: postCategories.slug,
};
const cleanPost = <T extends { content: string }>(item: T) => ({ ...item, content: cleanContent(item.content) });
const postOrder = [sql`CASE WHEN ${posts.type}='GUIDE' THEN ${posts.sortIndex} END ASC`, desc(posts.createdAt)];
app.get('/posts', async c => {
  const { limit, offset } = parsePage(c);
  const type = c.req.query('type');
  const category = c.req.query('category');
  if (type && !['ARTICLE', 'GUIDE'].includes(type)) return c.json({ message: 'Loại bài không hợp lệ' }, 400);
  const rows = await drizzle(c.env.DB).select(postFields).from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .where(and(eq(posts.status, 'PUBLISHED'), type ? eq(posts.type, type) : undefined, category ? eq(postCategories.slug, category) : undefined))
    .orderBy(...postOrder).limit(limit).offset(offset);
  return c.json(rows.map(cleanPost));
});
app.get('/admin/posts', requireAuth, async c => {
  const { offset } = parsePage(c);
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 200, 1), 5000);
  const type = c.req.query('type');
  if (type && !['ARTICLE', 'GUIDE'].includes(type)) return c.json({ message: 'Loại bài không hợp lệ' }, 400);
  const title = String(c.req.query('title') || '').trim();
  const slug = String(c.req.query('slug') || '').trim();
  const category = String(c.req.query('category') || '').trim();
  const status = String(c.req.query('status') || '').trim();
  const date = String(c.req.query('date') || '').trim();
  const searchText = String(c.req.query('search') || '').trim();
  const searchLike = `%${searchText}%`;
  const summary = c.req.query('summary') === '1';
  const conditions = and(type ? eq(posts.type, type) : undefined, searchText ? sql`(lower(${posts.title}) LIKE lower(${searchLike}) OR lower(${posts.slug}) LIKE lower(${searchLike}) OR lower(coalesce(${postCategories.name},'')) LIKE lower(${searchLike}))` : undefined, title ? like(posts.title, `%${title}%`) : undefined, slug ? like(posts.slug, `%${slug}%`) : undefined, category ? like(postCategories.name, `%${category}%`) : undefined, status ? eq(posts.status, status) : undefined, date ? sql`substr(${posts.createdAt},1,10) = ${date}` : undefined);
  if (summary) {
    const rows = await drizzle(c.env.DB).select(postSummaryFields).from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).where(conditions).orderBy(...postOrder).limit(limit).offset(offset);
    return c.json(rows);
  }
  const rows = await drizzle(c.env.DB).select(postFields).from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).where(conditions).orderBy(...postOrder).limit(limit).offset(offset);
  return c.json(rows.map(cleanPost));
});
app.get('/posts/:slug', async c => {
  const item = await drizzle(c.env.DB).select(postFields).from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .where(and(eq(posts.slug, c.req.param('slug')), eq(posts.status, 'PUBLISHED'))).get();
  return item ? c.json(cleanPost(item)) : c.json({ message: 'Post not found' }, 404);
});
app.post('/posts', requireAuth, async c => {
  const body = await c.req.json<any>();
  const title = String(body.title || '').trim();
  const slug = slugify(String(body.slug || title));
  const type = body.type || 'ARTICLE';
  if (!title || !String(body.content || '').trim() || !['ARTICLE', 'GUIDE'].includes(type)) return c.json({ message: 'Thiếu tiêu đề, nội dung hoặc loại bài' }, 400);
  if (await c.env.DB.prepare('SELECT id FROM posts WHERE slug=?').bind(slug).first()) return c.json({ message: 'Slug đã tồn tại' }, 409);
  const status = body.status === 'PUBLISHED' && c.get('user').role === 'ADMIN' ? 'PUBLISHED' : 'DRAFT';
  const stamp = now();
  const id = crypto.randomUUID();
  const nextIndex = type === 'GUIDE' ? Number((await c.env.DB.prepare("SELECT coalesce(max(sort_index),0)+1 value FROM posts WHERE type='GUIDE'").first<{ value: number }>())?.value || 1) : 0;
  await drizzle(c.env.DB).insert(posts).values({ id, slug, title, excerpt: body.excerpt || null, content: cleanContent(body.content), coverUrl: body.coverUrl || null, type, status, categoryId: body.categoryId || null, sortIndex: nextIndex, seoTitle: body.seoTitle || null, seoDescription: body.seoDescription || null, publishedAt: status === 'PUBLISHED' ? stamp : null, createdAt: stamp, updatedAt: stamp });
  return c.json({ id }, 201);
});
app.patch('/posts/:id', requireAuth, async c => {
  const id = c.req.param('id')!;
  const body = await c.req.json<any>();
  const current = await drizzle(c.env.DB).select().from(posts).where(eq(posts.id, id)).get();
  if (!current) return c.json({ message: 'Không tìm thấy bài viết' }, 404);
  if (body.status === 'PUBLISHED' && c.get('user').role !== 'ADMIN') return c.json({ message: 'Chỉ ADMIN mới được đăng bài công khai' }, 403);
  const slug = body.slug === undefined ? current.slug : slugify(String(body.slug));
  if (body.slug !== undefined && !String(body.slug).trim()) return c.json({ message: 'Slug không được để trống' }, 400);
  if (slug !== current.slug && await c.env.DB.prepare('SELECT id FROM posts WHERE slug=?').bind(slug).first()) return c.json({ message: 'Slug đã tồn tại' }, 409);
  const patch: Partial<typeof current> = { updatedAt: now(), slug };
  if ('title' in body && !String(body.title || '').trim()) return c.json({ message: 'Tiêu đề không được để trống' }, 400);
  for (const field of ['title', 'excerpt', 'coverUrl', 'seoTitle', 'seoDescription', 'categoryId'] as const) if (field in body) (patch as any)[field] = body[field] || null;
  if ('content' in body) patch.content = cleanContent(body.content);
  if ('status' in body && ['DRAFT', 'PUBLISHED'].includes(body.status)) { patch.status = body.status; patch.publishedAt = body.status === 'PUBLISHED' ? current.publishedAt || now() : null; }
  await drizzle(c.env.DB).update(posts).set(patch).where(eq(posts.id, id));
  return c.json({ ok: true });
});
app.post('/admin/guides/reorder', requireAuth, async c => {
  const { ids } = await c.req.json<{ ids: string[] }>();
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length) return c.json({ message: 'Danh sách không hợp lệ' }, 400);
  const all = await c.env.DB.prepare("SELECT id FROM posts WHERE type='GUIDE'").all<{ id: string }>();
  if (ids.length !== all.results.length || ids.some(id => !all.results.some(row => row.id === id))) return c.json({ message: 'Cần gửi đủ hướng dẫn để sắp xếp' }, 400);
  if (ids.length) await c.env.DB.batch(ids.map((id, i) => c.env.DB.prepare('UPDATE posts SET sort_index=?,updated_at=? WHERE id=?').bind(i + 1, now(), id)));
  return c.json({ ok: true });
});
app.delete('/posts/:id', requireAuth, requireAdmin, async c => { await drizzle(c.env.DB).delete(posts).where(eq(posts.id, c.req.param('id')!)); return c.json({ ok: true }); });

app.get('/post-categories', async c => c.json((await c.env.DB.prepare('SELECT id,name,slug FROM post_categories ORDER BY name').all()).results));
app.post('/post-categories', requireAuth, async c => { const body = await c.req.json<any>(); const name = String(body.name || '').trim(); if (!name) return c.json({ message: 'Tên danh mục là bắt buộc' }, 400); const slug = slugify(String(body.slug || name)); if (await c.env.DB.prepare('SELECT id FROM post_categories WHERE slug=?').bind(slug).first()) return c.json({ message: 'Slug danh mục đã tồn tại' }, 409); const id = crypto.randomUUID(); await c.env.DB.prepare('INSERT INTO post_categories (id,name,slug,created_at) VALUES (?,?,?,?)').bind(id, name, slug, now()).run(); return c.json({ id, name, slug }, 201); });
app.patch('/post-categories/:id', requireAuth, async c => { const body = await c.req.json<any>(); const current = await c.env.DB.prepare('SELECT * FROM post_categories WHERE id=?').bind(c.req.param('id')).first<any>(); if (!current) return c.json({ message: 'Không tìm thấy danh mục' }, 404); const name = String(body.name || current.name).trim(); const slug = body.slug ? slugify(String(body.slug)) : current.slug; await c.env.DB.prepare('UPDATE post_categories SET name=?,slug=? WHERE id=?').bind(name, slug, c.req.param('id')).run(); return c.json({ ok: true }); });
app.delete('/post-categories/:id', requireAuth, requireAdmin, async c => { await c.env.DB.prepare('DELETE FROM post_categories WHERE id=?').bind(c.req.param('id')).run(); return c.json({ ok: true }); });

const publicSettingKeys = ['site_name', 'logo_url', 'pinned_tag_ids', 'contact_phone', 'contact_email', 'contact_address', 'contact_facebook', 'contact_zalo', 'points_redemption_enabled'];
const supportedSettingKeys = [...publicSettingKeys, 'points_currency_step', 'points_per_step', 'points_value_vnd'];
app.get('/settings', async c => { const rows = await c.env.DB.prepare(`SELECT key,value FROM settings WHERE key IN (${publicSettingKeys.map(() => '?').join(',')})`).bind(...publicSettingKeys).all<{ key: string; value: string }>(); return c.json(Object.fromEntries(rows.results.map(row => [row.key, row.value]))); });
app.get('/admin/settings', requireAuth, requireAdmin, async c => c.json((await c.env.DB.prepare(`SELECT key,value FROM settings WHERE key IN (${supportedSettingKeys.map(() => '?').join(',')}) ORDER BY key`).bind(...supportedSettingKeys).all()).results));
app.put('/admin/settings', requireAuth, requireAdmin, async c => {
  const body = await c.req.json<{ key: string; value: string }>();
  const key = String(body.key || '').trim();
  if (!/^[a-z][a-z0-9_]{1,63}$/.test(key) || typeof body.value !== 'string') return c.json({ message: 'Key hoặc value không hợp lệ' }, 400);
  if (!supportedSettingKeys.includes(key)) return c.json({ message: 'Cài đặt này chưa được hệ thống hỗ trợ.' }, 400);
  if (['logo_url', 'contact_facebook', 'contact_zalo'].includes(key) && body.value && !/^(https?:\/\/|\/[^/])/.test(body.value)) return c.json({ message: 'URL phải bắt đầu bằng https://, http:// hoặc /' }, 400);
  if (['points_currency_step', 'points_per_step', 'points_value_vnd'].includes(key)) {
    const number = Number(body.value);
    if (!Number.isInteger(number) || number < (key === 'points_currency_step' ? 1 : 0)) return c.json({ message: 'Quy tắc điểm cần là số nguyên hợp lệ.' }, 400);
  }
  if (key === 'points_redemption_enabled' && !['0', '1'].includes(body.value)) return c.json({ message: 'Giá trị đổi điểm phải là 0 hoặc 1.' }, 400);
  if (key === 'pinned_tag_ids') {
    try { const ids = JSON.parse(body.value); if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) throw new Error(); }
    catch { return c.json({ message: 'Tag ghim phải là danh sách ID' }, 400); }
  }
  await c.env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, body.value).run();
  return c.json({ ok: true });
});

app.get('/rentals', requireAuth, async c => {
  const { limit, offset } = parsePage(c);
  const result = await c.env.DB.prepare("SELECT r.id,r.customer_name customerName,coalesce(r.customer_phone,a.phone) customerPhone,r.customer_email customerEmail,a.id customerId,a.facebook_url facebookUrl,r.start_date startDate,r.end_date endDate,r.status orderStatus,r.processing_status processingStatus,r.deposit,r.total_amount totalAmount,r.note,r.created_at createdAt,r.updated_at updatedAt,(SELECT group_concat(p.title, ', ') FROM rental_items ri LEFT JOIN products p ON p.id=ri.product_id WHERE ri.rental_id=r.id) productNames,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='DEPOSIT'),0) depositPaid,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='BALANCE'),0) balancePaid,coalesce((SELECT sum(amount) FROM rental_payment_transactions WHERE rental_id=r.id AND type='DEPOSIT_REFUND'),0) depositRefunded FROM rentals r LEFT JOIN customer_accounts a ON lower(a.email)=lower(r.customer_email) ORDER BY r.start_date LIMIT ? OFFSET ?").bind(limit, offset).all<any>();
  return c.json(result.results.map(row => ({ ...row, status: row.orderStatus, paymentStatus: paymentStatus(Number(row.totalAmount), Number(row.depositPaid), Number(row.balancePaid), Number(row.depositRefunded)) })));
});
app.get('/rentals/:id', requireAuth, async c => {
  const id = c.req.param('id');
  const rental = await c.env.DB.prepare('SELECT r.id,r.customer_name customerName,coalesce(r.customer_phone,a.phone) customerPhone,r.customer_email customerEmail,a.id customerId,a.facebook_url facebookUrl,r.start_date startDate,r.end_date endDate,r.status orderStatus,r.processing_status processingStatus,r.deposit,r.total_amount totalAmount,r.note,r.created_at createdAt,r.updated_at updatedAt FROM rentals r LEFT JOIN customer_accounts a ON lower(a.email)=lower(r.customer_email) WHERE r.id=?').bind(id).first<any>();
  if (!rental) return c.json({ message: 'Không tìm thấy đơn thuê.' }, 404);
  const [items, payments, statusHistory] = await Promise.all([
    c.env.DB.prepare('SELECT ri.id,ri.product_id productId,ri.variant_id variantId,ri.quantity,ri.price,p.title productTitle,p.slug productSlug,p.thumbnail_url thumbnailUrl,pv.name variantName FROM rental_items ri LEFT JOIN products p ON p.id=ri.product_id LEFT JOIN product_variants pv ON pv.id=ri.variant_id WHERE ri.rental_id=?').bind(id).all<any>(),
    c.env.DB.prepare('SELECT id,type,amount,note,actor_id actorId,actor_name actorName,created_at createdAt FROM rental_payment_transactions WHERE rental_id=? ORDER BY created_at DESC').bind(id).all<any>(),
    c.env.DB.prepare('SELECT id,from_status fromStatus,to_status toStatus,from_processing_status fromProcessingStatus,to_processing_status toProcessingStatus,actor_id actorId,actor_name actorName,created_at createdAt FROM rental_status_history WHERE rental_id=? ORDER BY created_at DESC').bind(id).all<any>(),
  ]);
  const depositPaid = payments.results.filter(row => row.type === 'DEPOSIT').reduce((sum, row) => sum + Number(row.amount), 0);
  const balancePaid = payments.results.filter(row => row.type === 'BALANCE').reduce((sum, row) => sum + Number(row.amount), 0);
  const depositRefunded = payments.results.filter(row => row.type === 'DEPOSIT_REFUND').reduce((sum, row) => sum + Number(row.amount), 0);
  return c.json({ ...rental, status: rental.orderStatus, items: items.results, paymentSummary: { depositPaid, balancePaid, depositRefunded, paymentStatus: paymentStatus(Number(rental.totalAmount), depositPaid, balancePaid, depositRefunded) }, payments: payments.results, statusHistory: statusHistory.results });
});
app.post('/rentals/:id/payments', requireAuth, async c => {
  const id = c.req.param('id'); const body = await c.req.json<any>();
  const type = String(body.type || ''); const amount = Number(body.amount); const note = String(body.note || '').trim() || null;
  if (!['DEPOSIT', 'BALANCE', 'DEPOSIT_REFUND'].includes(type) || !Number.isSafeInteger(amount) || amount <= 0) return c.json({ message: 'Loại giao dịch không hợp lệ hoặc số tiền phải lớn hơn 0.' }, 400);
  const rental = await c.env.DB.prepare('SELECT id,status,processing_status processingStatus,deposit,total_amount totalAmount FROM rentals WHERE id=?').bind(id).first<any>();
  if (!rental) return c.json({ message: 'Không tìm thấy đơn thuê.' }, 404);
  const totals = await c.env.DB.prepare("SELECT coalesce(sum(CASE WHEN type='DEPOSIT' THEN amount ELSE 0 END),0) depositPaid,coalesce(sum(CASE WHEN type='BALANCE' THEN amount ELSE 0 END),0) balancePaid,coalesce(sum(CASE WHEN type='DEPOSIT_REFUND' THEN amount ELSE 0 END),0) depositRefunded FROM rental_payment_transactions WHERE rental_id=?").bind(id).first<any>();
  if (type === 'DEPOSIT' && Number(rental.deposit) > 0 && Number(totals.depositPaid) + amount > Number(rental.deposit)) return c.json({ message: 'Số tiền cọc vượt quá tiền cọc của đơn.' }, 400);
  if (type === 'BALANCE' && Number(rental.totalAmount) > 0 && Number(totals.balancePaid) + amount > Number(rental.totalAmount)) return c.json({ message: 'Số tiền thu vượt quá tổng tiền thuê.' }, 400);
  if (type === 'DEPOSIT_REFUND' && Number(totals.depositPaid) - Number(totals.depositRefunded) < amount) return c.json({ message: 'Số tiền hoàn vượt quá tiền cọc đã nhận.' }, 400);
  const actor = rentalActor(c.get('user')); const stamp = now();
  const nextDepositPaid = Number(totals.depositPaid) + (type === 'DEPOSIT' ? amount : 0);
  const nextBalancePaid = Number(totals.balancePaid) + (type === 'BALANCE' ? amount : 0);
  const nextDepositRefunded = Number(totals.depositRefunded) + (type === 'DEPOSIT_REFUND' ? amount : 0);
  const nextProcessingStatus = processingStatus(rental.status, Number(rental.totalAmount), Number(rental.deposit), nextDepositPaid, nextBalancePaid, nextDepositRefunded);
  const statements = [
    c.env.DB.prepare('INSERT INTO rental_payment_transactions (id,rental_id,type,amount,note,actor_id,actor_name,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), id, type, amount, note, actor.id, actor.name, stamp),
    c.env.DB.prepare('UPDATE rentals SET processing_status=?,updated_at=? WHERE id=?').bind(nextProcessingStatus, stamp, id),
  ];
  if (nextProcessingStatus !== rental.processingStatus) statements.push(c.env.DB.prepare('INSERT INTO rental_status_history (id,rental_id,from_status,to_status,from_processing_status,to_processing_status,actor_id,actor_name,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), id, rental.status, rental.status, rental.processingStatus, nextProcessingStatus, actor.id, actor.name, stamp));
  await c.env.DB.batch(statements);
  return c.json({ ok: true, processingStatus: nextProcessingStatus });
});
app.post('/rental-requests', async c => {
  const customer = await customerFromRequest(c);
  if (!customer) return c.json({ message: 'Vui lòng đăng nhập bằng Google để gửi yêu cầu thuê.' }, 401);
  if (!customer.contactReady) return c.json({ message: 'Hãy bổ sung link Facebook hoặc số điện thoại trước khi gửi yêu cầu thuê.' }, 428);
  const body = await c.req.json<any>();
  const product = await c.env.DB.prepare("SELECT id,title,test_price testPrice,fes_price fesPrice,shoot_price shootPrice,total_quantity totalQuantity FROM products WHERE slug=? AND status!='ARCHIVED'").bind(String(body.productSlug || '')).first<any>();
  if (!product) return c.json({ message: 'Không tìm thấy sản phẩm.' }, 404);
  const customerName = customer.name; const customerEmail = customer.email.toLowerCase(); const customerPhone = customer.phone;
  const start = new Date(body.startDate); const end = new Date(body.endDate);
  if (!/^\S+@\S+\.\S+$/.test(customerEmail) || !Number.isFinite(start.valueOf()) || !Number.isFinite(end.valueOf()) || end <= start) return c.json({ message: 'Khoảng ngày thuê không hợp lệ.' }, 400);
  const overlap = await c.env.DB.prepare("SELECT coalesce(sum(ri.quantity),0) quantity FROM rental_items ri JOIN rentals r ON r.id=ri.rental_id WHERE ri.product_id=? AND r.status!='CANCELLED' AND r.start_date<? AND r.end_date>?").bind(product.id, end.toISOString(), start.toISOString()).first<{ quantity: number }>();
  if (Number(overlap?.quantity || 0) >= Number(product.totalQuantity || 1)) return c.json({ message: 'Sản phẩm đã có lịch thuê trùng khoảng ngày này. Hãy chọn ngày khác hoặc nhắn shop.' }, 409);
  const type = ['test', 'fes', 'shoot'].includes(body.priceType) ? body.priceType : 'fes';
  const price = Number(product[type === 'test' ? 'testPrice' : type === 'shoot' ? 'shootPrice' : 'fesPrice']) || 0;
  const id = crypto.randomUUID(); const stamp = now();
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO rentals (id,customer_name,customer_email,customer_phone,start_date,end_date,status,processing_status,deposit,total_amount,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, customerName, customerEmail, customerPhone, start.toISOString(), end.toISOString(), 'NEW', processingStatus('NEW', price, 0, 0, 0, 0), 0, price, String(body.note || '').trim() || null, stamp, stamp),
    c.env.DB.prepare('INSERT INTO rental_items (id,rental_id,product_id,variant_id,quantity,price) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), id, product.id, null, 1, price),
    c.env.DB.prepare('INSERT INTO rental_status_history (id,rental_id,from_status,to_status,from_processing_status,to_processing_status,actor_id,actor_name,created_at) VALUES (?,?,NULL,?,NULL,?,?,?,?)').bind(crypto.randomUUID(), id, 'NEW', processingStatus('NEW', price, 0, 0, 0, 0), customer.id, customer.name, stamp),
  ]);
  return c.json({ id, status: 'NEW', orderStatus: 'NEW', processingStatus: processingStatus('NEW', price, 0, 0, 0, 0) }, 201);
});
app.post('/rentals', requireAuth, async c => {
  const body = await c.req.json<any>(); const start = new Date(body.startDate); const end = new Date(body.endDate);
  if (!(end > start)) return c.json({ message: 'endDate must be after startDate' }, 400);
  const db = drizzle(c.env.DB);
  for (const item of body.items || []) {
    const product = await db.select().from(products).where(eq(products.id, item.productId)).get();
    if (!product) return c.json({ message: 'Product not found' }, 404);
    const overlap = await db.select({ quantity: sql<number>`coalesce(sum(${rentalItems.quantity}), 0)` }).from(rentalItems).innerJoin(rentals, eq(rentalItems.rentalId, rentals.id)).where(sql`${rentalItems.productId} = ${item.productId} AND ${rentals.status} != 'CANCELLED' AND ${rentals.startDate} < ${end.toISOString()} AND ${rentals.endDate} > ${start.toISOString()}`).get();
    if (Number(overlap?.quantity || 0) + Number(item.quantity || 1) > product.totalQuantity) return c.json({ message: 'Product quantity is unavailable for this period' }, 409);
  }
  const id = crypto.randomUUID(); const stamp = now(); const actor = rentalActor(c.get('user'));
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO rentals (id,customer_name,customer_email,customer_phone,start_date,end_date,status,processing_status,deposit,total_amount,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, body.customerName, String(body.customerEmail || '').trim().toLowerCase() || null, body.customerPhone || null, start.toISOString(), end.toISOString(), 'NEW', processingStatus('NEW', Number(body.totalAmount) || 0, Number(body.deposit) || 0, 0, 0, 0), body.deposit || 0, body.totalAmount || 0, body.note || null, stamp, stamp),
    ...((body.items || []) as any[]).map((item: any) => c.env.DB.prepare('INSERT INTO rental_items (id,rental_id,product_id,variant_id,quantity,price) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), id, item.productId, item.variantId || null, item.quantity || 1, item.price || 0)),
    c.env.DB.prepare('INSERT INTO rental_status_history (id,rental_id,from_status,to_status,from_processing_status,to_processing_status,actor_id,actor_name,created_at) VALUES (?,?,NULL,?,NULL,?,?,?,?)').bind(crypto.randomUUID(), id, 'NEW', processingStatus('NEW', Number(body.totalAmount) || 0, Number(body.deposit) || 0, 0, 0, 0), actor.id, actor.name, stamp),
  ]);
  return c.json({ id, status: 'NEW', orderStatus: 'NEW', processingStatus: processingStatus('NEW', Number(body.totalAmount) || 0, Number(body.deposit) || 0, 0, 0, 0) }, 201);
});
app.patch('/rentals/:id', requireAuth, async c => {
  const body = await c.req.json<any>(); const id = c.req.param('id')!; const db = drizzle(c.env.DB);
  const current = await db.select().from(rentals).where(eq(rentals.id, id)).get();
  if (!current) return c.json({ message: 'Không tìm thấy đơn thuê.' }, 404);
  const status = String(body.orderStatus || body.status || '');
  if (!ORDER_STATUSES.includes(status)) return c.json({ message: 'Trạng thái đơn thuê không hợp lệ.' }, 400);
  if (['RETURNED', 'CANCELLED'].includes(current.status) && status !== current.status) return c.json({ message: 'Đơn đã hoàn tất không thể chuyển sang trạng thái khác.' }, 400);
  if (status === current.status) return c.json({ ok: true, orderStatus: status, processingStatus: current.processingStatus, earnedPoints: 0 });
  const totals = await c.env.DB.prepare("SELECT coalesce(sum(CASE WHEN type='DEPOSIT' THEN amount ELSE 0 END),0) depositPaid,coalesce(sum(CASE WHEN type='BALANCE' THEN amount ELSE 0 END),0) balancePaid,coalesce(sum(CASE WHEN type='DEPOSIT_REFUND' THEN amount ELSE 0 END),0) depositRefunded FROM rental_payment_transactions WHERE rental_id=?").bind(id).first<any>();
  const nextProcessingStatus = processingStatus(status, Number(current.totalAmount), Number(current.deposit), Number(totals?.depositPaid || 0), Number(totals?.balancePaid || 0), Number(totals?.depositRefunded || 0));
  let earnedPoints = 0; const stamp = now();
  const actor = rentalActor(c.get('user'));
  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare('UPDATE rentals SET status=?,processing_status=?,updated_at=? WHERE id=?').bind(status, nextProcessingStatus, stamp, id),
    c.env.DB.prepare('INSERT INTO rental_status_history (id,rental_id,from_status,to_status,from_processing_status,to_processing_status,actor_id,actor_name,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), id, current.status, status, current.processingStatus, nextProcessingStatus, actor.id, actor.name, stamp),
  ];
  if (status === 'RETURNED' && current.status !== 'RETURNED' && current.customerEmail) {
    const email = current.customerEmail.toLowerCase();
    let customer = await c.env.DB.prepare('SELECT id FROM customer_accounts WHERE lower(email)=?').bind(email).first<{ id: string }>();
    if (!customer && /^\S+@\S+\.\S+$/.test(email)) {
      const customerId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO customer_accounts (id,email,name,created_at,updated_at) VALUES (?,?,?,?,?)').bind(customerId, email, current.customerName, stamp, stamp).run();
      customer = { id: customerId };
    }
    if (customer) {
      const [items, settings] = await Promise.all([
        c.env.DB.prepare('SELECT ri.quantity,ri.price,p.reward_points rewardPoints FROM rental_items ri JOIN products p ON p.id=ri.product_id WHERE ri.rental_id=?').bind(id).all<any>(),
        c.env.DB.prepare("SELECT key,value FROM settings WHERE key IN ('points_currency_step','points_per_step')").all<{ key: string; value: string }>(),
      ]);
      const config = Object.fromEntries(settings.results.map(row => [row.key, Number(row.value)]));
      const currencyStep = Math.max(1, Number(config.points_currency_step) || 10000);
      const pointsPerStepValue = config.points_per_step === undefined ? 1 : Number(config.points_per_step);
      const pointsPerStep = Number.isFinite(pointsPerStepValue) ? Math.max(0, Math.trunc(pointsPerStepValue)) : 1;
      const customizedItems = items.results.filter(item => Number(item.rewardPoints) > 0);
      const automaticAmount = items.results.filter(item => Number(item.rewardPoints) <= 0).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
      const fallbackAmount = automaticAmount || (customizedItems.length === 0 ? Number(current.totalAmount || 0) : 0);
      earnedPoints = customizedItems.reduce((sum, item) => sum + Number(item.rewardPoints) * Number(item.quantity || 1), 0) + Math.floor(fallbackAmount / currencyStep) * pointsPerStep;
      if (earnedPoints > 0) statements.push(c.env.DB.prepare("INSERT OR IGNORE INTO loyalty_transactions (id,customer_id,rental_id,source_key,event_type,points_delta,note,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(), customer.id, id, `rental:${id}`, 'EARN', earnedPoints, `Tích điểm từ đơn thuê #${id.slice(0, 8)}`, c.get('user').id, stamp));
    }
  }
  if (status === 'CANCELLED' && current.status !== 'CANCELLED') {
    const redemption = await c.env.DB.prepare("SELECT customer_id,points_delta FROM loyalty_transactions WHERE rental_id=? AND event_type='REDEEM'").bind(id).first<{ customer_id: string; points_delta: number }>();
    if (redemption) statements.push(c.env.DB.prepare("INSERT OR IGNORE INTO loyalty_transactions (id,customer_id,rental_id,source_key,event_type,points_delta,note,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(), redemption.customer_id, id, `refund:${id}`, 'REFUND', Math.abs(Number(redemption.points_delta)), `Hoàn điểm do hủy đơn #${id.slice(0, 8)}`, c.get('user').id, stamp));
  }
  await c.env.DB.batch(statements);
  return c.json({ ok: true, status, orderStatus: status, processingStatus: nextProcessingStatus, earnedPoints });
});

app.get('/categories', async c => {
  const result = await c.env.DB.prepare('SELECT c.id, c.name, c.slug, c.parent_id parentId, c.image_url imageUrl, coalesce(c.sort_order, 0) sortOrder, (SELECT COUNT(*) FROM product_categories pc WHERE pc.category_id = c.id) as productCount FROM categories c ORDER BY coalesce(c.sort_order, 0) ASC, c.name ASC').all();
  return c.json(result.results);
});
app.post('/categories', requireAuth, async c => {
  const body = await c.req.json<any>();
  if (!body.name?.trim()) return c.json({ message: 'Tên danh mục là bắt buộc' }, 400);
  const id = crypto.randomUUID();
  const slug = body.slug?.trim() ? slugify(body.slug.trim()) : slugify(body.name);
  const imageUrl = body.imageUrl?.trim() || null;
  const sortOrder = Number(body.sortOrder) || 0;
  await c.env.DB.prepare('INSERT INTO categories (id,name,slug,parent_id,image_url,sort_order,created_at) VALUES (?,?,?,?,?,?,?)').bind(id, body.name.trim(), slug, body.parentId || null, imageUrl, sortOrder, now()).run();
  return c.json({ id, name: body.name.trim(), slug, parentId: body.parentId || null, imageUrl, sortOrder, productCount: 0 }, 201);
});
app.post('/categories/reorder', requireAuth, async c => {
  const body = await c.req.json<{ items: { id: string; parentId: string | null; sortOrder: number }[] }>();
  if (!Array.isArray(body.items)) return c.json({ message: 'items must be an array' }, 400);
  const stmts = body.items.map(item =>
    c.env.DB.prepare('UPDATE categories SET parent_id=?, sort_order=? WHERE id=?').bind(item.parentId || null, Number(item.sortOrder) || 0, item.id)
  );
  if (stmts.length > 0) {
    await c.env.DB.batch(stmts);
  }
  return c.json({ ok: true });
});
app.patch('/categories/:id', requireAuth, async c => {
  const id = c.req.param('id')!;
  const body = await c.req.json<any>();
  if (body.parentId) {
    if (body.parentId === id) return c.json({ message: 'Danh mục không thể là cha của chính nó' }, 400);
    const all = await c.env.DB.prepare('SELECT id,parent_id parentId FROM categories').all<{ id: string; parentId: string | null }>();
    let cursor = all.results.find(x => x.id === body.parentId);
    while (cursor?.parentId) {
      if (cursor.parentId === id) return c.json({ message: 'Không thể chuyển vào danh mục con của chính nó' }, 400);
      cursor = all.results.find(x => x.id === cursor!.parentId);
    }
  }
  const slug = body.slug !== undefined && body.slug !== null && body.slug.trim() !== '' ? slugify(body.slug) : null;
  const current = await c.env.DB.prepare('SELECT parent_id, image_url, sort_order FROM categories WHERE id=?').bind(id).first<any>();
  if (!current) return c.json({ message: 'Không tìm thấy danh mục' }, 404);
  const nextParentId = body.parentId === undefined ? current.parent_id : (body.parentId || null);
  const nextImageUrl = body.imageUrl === undefined ? current.image_url : (body.imageUrl?.trim() || null);
  const nextSortOrder = body.sortOrder === undefined ? current.sort_order : (Number(body.sortOrder) || 0);

  await c.env.DB.prepare('UPDATE categories SET name=coalesce(?,name),slug=coalesce(?,slug),parent_id=?,image_url=?,sort_order=? WHERE id=?').bind(body.name?.trim() || null, slug, nextParentId, nextImageUrl, nextSortOrder, id).run();
  return c.json({ ok: true });
});
app.delete('/categories/:id', requireAuth, requireAdmin, async c => { await c.env.DB.prepare('DELETE FROM categories WHERE id=?').bind(c.req.param('id')).run(); return c.json({ ok: true }); });

app.get('/tags', async c => { const result = await c.env.DB.prepare('SELECT id,name,slug FROM tags ORDER BY name').all(); return c.json(result.results); });
app.post('/tags', requireAuth, async c => { const body = await c.req.json<any>(); if (!body.name?.trim()) return c.json({ message: 'Tên tag là bắt buộc' }, 400); const id = crypto.randomUUID(); await c.env.DB.prepare('INSERT INTO tags (id,name,slug,created_at) VALUES (?,?,?,?)').bind(id, body.name.trim(), body.slug?.trim() || slugify(body.name), now()).run(); return c.json({ id, name: body.name.trim(), slug: body.slug?.trim() || slugify(body.name) }, 201); });
app.patch('/tags/:id', requireAuth, async c => { const body = await c.req.json<any>(); await c.env.DB.prepare('UPDATE tags SET name=coalesce(?,name),slug=coalesce(?,slug) WHERE id=?').bind(body.name?.trim() || null, body.slug?.trim() || null, c.req.param('id')).run(); return c.json({ ok: true }); });
app.delete('/tags/:id', requireAuth, requireAdmin, async c => { await c.env.DB.prepare('DELETE FROM tags WHERE id=?').bind(c.req.param('id')).run(); return c.json({ ok: true }); });

app.post('/admin/uploads', requireAuth, async c => {
  if (!c.env.MEDIA) return c.json({ message: 'Chưa cấu hình lưu trữ ảnh (R2 bucket)' }, 503);
  const form = await c.req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return c.json({ message: 'Thiếu file ảnh' }, 400);
  if (!file.type.startsWith('image/')) return c.json({ message: 'Chỉ hỗ trợ file ảnh' }, 400);
  if (file.size > 8 * 1024 * 1024) return c.json({ message: 'Ảnh tối đa 8MB' }, 400);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const key = `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  await c.env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return c.json({ url: `/api/v1/media/${key}` }, 201);
});
app.get('/media/:key{.*}', async c => {
  if (!c.env.MEDIA) return c.json({ message: 'Not found' }, 404);
  const key = c.req.param('key') || c.req.path.replace(/^(\/api\/v1)?\/media\//, '');
  const object = await c.env.MEDIA.get(key);
  if (!object) return c.json({ message: 'Not found' }, 404);
  return new Response(object.body as any, { headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' } });
});

app.get('/admin/users', requireAuth, requireAdmin, async c => {
  const { limit, offset } = parsePage(c);
  const name = `%${String(c.req.query('name') || '').trim().toLowerCase()}%`;
  const email = `%${String(c.req.query('email') || '').trim().toLowerCase()}%`;
  const role = String(c.req.query('role') || '');
  const active = String(c.req.query('active') || '');
  const searchText = String(c.req.query('search') || '').trim().toLowerCase();
  const search = `%${searchText}%`;
  const result = await c.env.DB.prepare("SELECT id,email,name,role,active,created_at createdAt FROM users WHERE (?='' OR lower(name) LIKE ? OR lower(email) LIKE ?) AND lower(name) LIKE ? AND lower(email) LIKE ? AND (?='' OR role=?) AND (?='' OR active=?) ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(searchText, search, search, name, email, role, role, active, active === '' ? 0 : Number(active), limit, offset).all();
  return c.json(result.results);
});
app.patch('/admin/users/:id', requireAuth, requireAdmin, async c => { const body = await c.req.json<any>(); await c.env.DB.prepare('UPDATE users SET role=coalesce(?,role),active=coalesce(?,active),updated_at=? WHERE id=?').bind(body.role || null, typeof body.active === 'boolean' ? Number(body.active) : null, now(), c.req.param('id')).run(); if (body.active === false) await c.env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(c.req.param('id')).run(); return c.json({ ok: true }); });
app.delete('/admin/users/:id/sessions', requireAuth, requireAdmin, async c => { await c.env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(c.req.param('id')).run(); return c.json({ ok: true }); });
app.get('/admin/invitations', requireAuth, requireAdmin, async c => { const { limit, offset } = parsePage(c); const result = await c.env.DB.prepare('SELECT id,email,role,expires_at expiresAt,accepted_at acceptedAt,created_at createdAt FROM invitations ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all(); return c.json(result.results); });
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
