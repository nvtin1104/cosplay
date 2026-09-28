'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Facebook, LogIn, MessageCircleHeart, PackageCheck, UserRound } from 'lucide-react';

declare global { interface Window { google?: { accounts: { id: { initialize: (options: any) => void; renderButton: (element: HTMLElement, options: any) => void } } } } }
type Customer = { id: string; email: string; name: string; facebookUrl?: string | null };
type Rental = { id: string; startDate: string; endDate: string; status: string; deposit: number; totalAmount: number; productTitle?: string; productSlug?: string; thumbnailUrl?: string; quantity?: number };
type PointsData = { balance: number; ledger: { id: string; eventType: string; pointsDelta: number; note?: string; createdAt: string }[]; settings: Record<string, number> };
type CustomerFeedback = { id: string; content: string; imageUrl?: string | null; status: string; createdAt: string; productTitle: string; productSlug: string };
const rentalStatus: Record<string, string> = { HOLD: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', RENTED: 'Đang thuê', RETURNED: 'Đã hoàn tất', CANCELLED: 'Đã hủy' };

const API = '/api/v1/customers';
export function CustomerAccount() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [facebookUrl, setFacebookUrl] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    fetch(`${API}/me`, { credentials: 'include' }).then(async response => { if (!response.ok) return; const data = await response.json(); setCustomer(data.user); setName(data.user.name); setEmail(data.user.email); setFacebookUrl(data.user.facebookUrl || ''); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!customer) return;
    fetch(`${API}/rentals`, { credentials: 'include' }).then(async response => { if (response.ok) setRentals(await response.json()); }).catch(() => {});
    fetch(`${API}/points`, { credentials: 'include' }).then(async response => { if (response.ok) setPoints(await response.json()); }).catch(() => {});
    fetch(`${API}/feedback`, { credentials: 'include' }).then(async response => { if (response.ok) setFeedback(await response.json()); }).catch(() => {});
  }, [customer]);
  useEffect(() => {
    if (customer || !googleClientId) return;
    const id = 'google-identity-service';
    const setup = () => {
      const button = document.getElementById('google-signin');
      if (!button || !window.google) return;
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: async (response: { credential: string }) => {
        try { const result = await fetch(`${API}/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ credential: response.credential }) }); const data = await result.json(); if (!result.ok) throw new Error(data.message); setCustomer(data.user); setName(data.user.name); setEmail(data.user.email); setFacebookUrl(data.user.facebookUrl || ''); setNotice('Đăng nhập Google thành công.'); }
        catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể đăng nhập Google.'); }
      } });
      window.google.accounts.id.renderButton(button, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 360 });
    };
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) { if (window.google) setup(); else existing.addEventListener('load', setup, { once: true }); return; }
    const script = document.createElement('script'); script.id = id; script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.onload = setup; document.head.appendChild(script);
  }, [customer, googleClientId]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      const response = await fetch(`${API}/${mode}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không thể đăng nhập.');
      setCustomer(data.user); setName(data.user.name); setEmail(data.user.email); setNotice(mode === 'register' ? 'Tạo tài khoản thành công.' : 'Đăng nhập thành công.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Có lỗi xảy ra.'); }
    finally { setBusy(false); }
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try { const response = await fetch(`${API}/me`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, facebookUrl }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setCustomer(data.user); setNotice('Đã cập nhật hồ sơ.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.'); }
    finally { setBusy(false); }
  }
  async function logout() { await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' }); setCustomer(null); setRentals([]); setPassword(''); setNotice('Bạn đã đăng xuất.'); }

  return <main className="min-h-screen bg-[#fff6dc] py-12"><div className="shell max-w-4xl">
    <p className="inline-flex items-center gap-2 border-2 border-[#24150e] bg-[#ffe75c] px-4 py-2 text-xs font-extrabold shadow-[3px_4px_0_#24150e]"><UserRound size={15} /> TÀI KHOẢN KHÁCH</p>
    <h1 className="display mt-5 text-5xl font-extrabold text-[#24150e]">Chào mừng bạn đến Honey</h1>
    <p className="mt-3 max-w-2xl leading-7 text-[#624b40]">Đăng nhập để xem lịch sử thuê, lưu thông tin liên hệ và theo dõi các yêu cầu đặt thuê.</p>
    {customer ? <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="sticker h-fit bg-white p-6"><h2 className="display text-2xl font-extrabold">Thông tin của bạn</h2><form onSubmit={saveProfile} className="mt-4 space-y-4"><label className="grid gap-1.5 text-sm font-bold">Tên hiển thị<input required value={name} onChange={e => setName(e.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-3 font-normal" /></label><label className="grid gap-1.5 text-sm font-bold">Email<input disabled value={customer.email} className="min-h-12 rounded-xl border border-neutral-200 bg-neutral-50 px-3 font-normal text-neutral-500" /></label><label className="grid gap-1.5 text-sm font-bold"><span className="inline-flex items-center gap-2"><Facebook size={16} /> Facebook</span><input type="url" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/ten-cua-ban" className="min-h-12 rounded-xl border border-neutral-300 px-3 font-normal" /></label><button disabled={busy} className="w-full rounded-xl bg-[#24150e] px-4 py-3 font-bold text-white">Lưu hồ sơ</button></form>
        <div className="mt-6 rounded-2xl border-2 border-[#24150e] bg-[#ffe75c] p-4"><p className="text-xs font-bold uppercase tracking-wide">Điểm thành viên</p><p className="display mt-1 text-4xl font-extrabold">{points?.balance.toLocaleString('vi-VN') ?? '—'} <span className="text-base">điểm</span></p>{points && points.settings.points_value_vnd > 0 && <p className="mt-1 text-xs text-[#624b40]">Giá trị quy đổi hiện tại: {(points.balance * points.settings.points_value_vnd).toLocaleString('vi-VN')}đ</p>}</div>
        {points?.ledger.length ? <div className="mt-4 space-y-2"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Giao dịch điểm gần đây</p>{points.ledger.slice(0,5).map(entry => <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-neutral-100 py-2 text-xs"><span className="min-w-0 flex-1 truncate text-neutral-600">{entry.note || entry.eventType}</span><b className={entry.pointsDelta > 0 ? 'text-emerald-700' : 'text-red-700'}>{entry.pointsDelta > 0 ? '+' : ''}{entry.pointsDelta}</b></div>)}</div> : null}
        <button onClick={logout} className="mt-4 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold text-neutral-600">Đăng xuất</button></section>
      <section className="sticker bg-[#ffe75c] p-6"><h2 className="display flex items-center gap-2 text-2xl font-extrabold"><PackageCheck size={23} /> Lịch sử thuê</h2><p className="mt-1 text-sm text-[#624b40]">Các yêu cầu thuê dùng email {customer.email}.</p>{rentals.length ? <div className="mt-5 space-y-3">{rentals.map(rental => <article key={rental.id} className="flex gap-3 rounded-xl border-2 border-[#24150e] bg-white p-3">{rental.thumbnailUrl && <img src={rental.thumbnailUrl} alt="" className="h-16 w-14 rounded-lg object-cover" />}<div className="min-w-0 flex-1"><b className="block truncate">{rental.productTitle || 'Yêu cầu thuê'}</b><p className="mt-1 text-xs text-neutral-600">{new Date(rental.startDate).toLocaleDateString('vi-VN')} – {new Date(rental.endDate).toLocaleDateString('vi-VN')}</p><span className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold">{rentalStatus[rental.status] || rental.status}</span></div>{rental.productSlug && <Link href={`/cosplay/${rental.productSlug}`} className="self-center text-xs font-bold text-[#b4570a] underline">Sản phẩm</Link>}</article>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-[#24150e]/30 bg-white/60 p-6 text-sm text-[#624b40]">Chưa có lịch thuê gắn với tài khoản này. Hãy dùng đúng email khi gửi yêu cầu thuê.</div>}</section>
      <section className="sticker mt-6 bg-white p-6"><h2 className="display flex items-center gap-2 text-2xl font-extrabold"><MessageCircleHeart size={21} /> Feedback của tôi</h2><p className="mt-1 text-sm text-neutral-500">Theo dõi phản hồi đã gửi và trạng thái duyệt.</p>{feedback.length ? <div className="mt-4 space-y-3">{feedback.map(item => <article key={item.id} className="rounded-xl border border-neutral-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><Link href={`/cosplay/${item.productSlug}`} className="text-sm font-bold text-[#b4570a] underline">{item.productTitle}</Link><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : item.status === 'HIDDEN' ? 'bg-neutral-100 text-neutral-500' : 'bg-amber-50 text-amber-800'}`}>{item.status === 'APPROVED' ? 'Đã đăng' : item.status === 'HIDDEN' ? 'Đã ẩn' : 'Chờ duyệt'}</span></div><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{item.content}</p>{item.imageUrl && <img src={item.imageUrl} alt="Ảnh feedback của bạn" className="mt-3 max-h-40 rounded-lg object-cover" />}</article>)}</div> : <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">Bạn chưa gửi feedback nào. Hãy chia sẻ trải nghiệm tại trang sản phẩm đã thuê.</p>}</section>
    </div> : <form onSubmit={submit} className="sticker mt-8 max-w-xl bg-white p-6 sm:p-8"><div className="flex gap-2 rounded-xl bg-neutral-100 p-1"><button type="button" onClick={() => { setMode('login'); setNotice(''); }} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold ${mode === 'login' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Đăng nhập</button><button type="button" onClick={() => { setMode('register'); setNotice(''); }} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold ${mode === 'register' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Tạo tài khoản</button></div>
      {mode === 'register' && <label className="mt-5 grid gap-1.5 text-sm font-bold">Tên của bạn<input required value={name} onChange={e => setName(e.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-3 font-normal" /></label>}
      <label className="mt-4 grid gap-1.5 text-sm font-bold">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-3 font-normal" /></label>
      <label className="mt-4 grid gap-1.5 text-sm font-bold">Mật khẩu<input required minLength={10} type="password" value={password} onChange={e => setPassword(e.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-3 font-normal" /><span className="text-xs font-normal text-neutral-500">Ít nhất 10 ký tự.</span></label>
      <button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff9b35] px-4 py-3 font-extrabold text-white shadow-[3px_4px_0_#24150e]"><LogIn size={17} />{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập bằng email' : 'Tạo tài khoản khách'}</button>
      {googleClientId && <><div className="my-4 flex items-center gap-3 text-xs text-neutral-400"><span className="h-px flex-1 bg-neutral-200" />hoặc<span className="h-px flex-1 bg-neutral-200" /></div><div id="google-signin" className="flex justify-center" /></>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-[#624b40]">{notice}</p>}
      <p className="mt-5 text-xs leading-5 text-neutral-500">Khi tạo tài khoản, bạn có thể dùng cùng email khi gửi yêu cầu thuê để xem lịch sử trong tài khoản.</p>
    </form>}
    {customer && notice && <p role="status" className="mt-4 rounded-xl bg-white p-3 text-sm">{notice}</p>}
  </div></main>;
}
