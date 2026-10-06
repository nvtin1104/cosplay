'use client';

import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type Customer = { id: string; email: string; name: string; facebookUrl: string | null; phone: string | null; contactReady: boolean };
type AuthContextValue = { customer: Customer | null; openLogin: (afterLogin?: () => void) => void };
const CustomerAuthContext = createContext<AuthContextValue | null>(null);
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (options: any) => void; renderButton: (element: HTMLElement, options: any) => void } } };
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [onLogin, setOnLogin] = useState<(() => void) | null>(null);
  const openLogin = useCallback((afterLogin?: () => void) => {
    if (customer?.contactReady) { afterLogin?.(); return; }
    setOnLogin(() => afterLogin || null);
    setModalOpen(true);
  }, [customer]);
  const complete = useCallback((updated: Customer) => {
    setCustomer(updated);
    setModalOpen(false);
    const continuation = onLogin;
    setOnLogin(null);
    continuation?.();
  }, [onLogin]);
  const close = useCallback(() => { setModalOpen(false); setOnLogin(null); }, []);

  useEffect(() => {
    fetch('/api/v1/customers/me', { credentials: 'include' })
      .then(async response => { if (response.ok) { const data = await response.json(); setCustomer(data.user); } })
      .catch(() => {});
  }, []);

  return <CustomerAuthContext.Provider value={{ customer, openLogin }}>
    {children}
    <GoogleLoginModal open={modalOpen} customer={customer} onCustomer={setCustomer} onComplete={complete} onClose={close} />
  </CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const value = useContext(CustomerAuthContext);
  if (!value) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return value;
}

function GoogleLoginModal({ open, customer, onCustomer, onComplete, onClose }: {
  open: boolean; customer: Customer | null; onCustomer: (customer: Customer) => void; onComplete: (customer: Customer) => void; onClose: () => void;
}) {
  const [user, setUser] = useState<Customer | null>(customer);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [open, onClose]);

  useEffect(() => {
    if (open && customer) {
      setUser(customer); setFacebookUrl(customer.facebookUrl || ''); setPhone(customer.phone || '');
    } else if (open) { setUser(null); setFacebookUrl(''); setPhone(''); }
    setNotice('');
  }, [open, customer]);

  useEffect(() => {
    if (!open || user || !clientId) return;
    const setup = () => {
      const button = document.getElementById('google-login-modal-button');
      if (!button || !window.google) return;
      button.replaceChildren();
      window.google.accounts.id.initialize({ client_id: clientId, callback: async ({ credential }: { credential: string }) => {
        try {
          const response = await fetch('/api/v1/customers/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ credential }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Không thể đăng nhập Google.');
          const signedIn: Customer = data.user;
          onCustomer(signedIn); setUser(signedIn); setFacebookUrl(signedIn.facebookUrl || ''); setPhone(signedIn.phone || '');
          if (signedIn.contactReady) onComplete(signedIn);
        } catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể đăng nhập Google.'); }
      } });
      window.google.accounts.id.renderButton(button, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 340 });
    };
    const existing = document.getElementById('google-identity-service') as HTMLScriptElement | null;
    if (existing) { if (window.google) setup(); else existing.addEventListener('load', setup, { once: true }); return; }
    const script = document.createElement('script'); script.id = 'google-identity-service'; script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.onload = setup; document.head.appendChild(script);
  }, [open, user, onCustomer, onComplete]);

  async function saveContact(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/v1/customers/me', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ facebookUrl, phone }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể lưu thông tin liên hệ.');
      onComplete(data.user);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể lưu thông tin liên hệ.'); }
    finally { setBusy(false); }
  }

  if (!open || typeof document === 'undefined') return null;
  return createPortal(<div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <button type="button" aria-label="Đóng cửa sổ" onClick={onClose} className="absolute inset-0 bg-[#24150e]/60 backdrop-blur-sm" />
    <section role="dialog" aria-modal="true" aria-labelledby="google-login-title" className="relative z-10 w-full max-w-md border-2 border-[#24150e] bg-[#fff6dc] p-6 shadow-[7px_8px_0_#24150e] sm:p-8">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute right-3 top-3 border-2 border-[#24150e] bg-white p-2"><X size={18} /></button>
      <p className="text-xs font-extrabold uppercase tracking-widest text-[#b4570a]">Honey Shop Cosplay</p>
      <h2 id="google-login-title" className="display mt-3 pr-8 text-3xl font-extrabold">{user ? 'Cách liên hệ với bạn' : 'Đăng nhập'}</h2>
      {user ? <form onSubmit={saveContact} className="mt-4 space-y-4">
        <p className="text-sm leading-6 text-[#624b40]">Để Honey xác nhận lịch thuê và hỗ trợ feedback, hãy cung cấp link Facebook hoặc số điện thoại. Bạn có thể lưu cả hai.</p>
        <label className="grid gap-1.5 text-sm font-bold">Link Facebook<input type="url" value={facebookUrl} onChange={event => setFacebookUrl(event.target.value)} placeholder="https://facebook.com/ten-cua-ban" className="min-h-11 rounded-xl border border-neutral-300 px-3 font-normal" /></label>
        <label className="grid gap-1.5 text-sm font-bold">Số điện thoại<input type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="09xxxxxxxx" className="min-h-11 rounded-xl border border-neutral-300 px-3 font-normal" /></label>
        {notice && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{notice}</p>}
        <button disabled={busy} className="w-full border-2 border-[#24150e] bg-[#ff9b35] px-4 py-3 font-extrabold text-white shadow-[3px_4px_0_#24150e] disabled:opacity-60">{busy ? 'Đang lưu…' : 'Lưu thông tin và tiếp tục'}</button>
      </form> : <>
        <p className="mt-2 text-sm leading-6 text-[#624b40]">Đăng nhập nhanh và an toàn bằng tài khoản Google để tiếp tục thuê hoặc gửi feedback.</p>
        {clientId ? <div id="google-login-modal-button" className="mt-6 flex min-h-11 justify-center" /> : <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-[#624b40]">Đăng nhập Google chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID.</p>}
        {notice && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{notice}</p>}
      </>}
      <p className="mt-5 text-xs leading-5 text-neutral-600">Thông tin chỉ dùng để liên hệ và xử lý yêu cầu của bạn. <a href="/quyen-rieng-tu" className="font-bold underline">Quyền riêng tư &amp; bảo mật</a></p>
    </section>
  </div>, document.body);
}
