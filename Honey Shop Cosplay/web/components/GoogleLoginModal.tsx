'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (options: any) => void; renderButton: (element: HTMLElement, options: any) => void } } };
  }
}

export function GoogleLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notice, setNotice] = useState('');
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !clientId) return;
    const setup = () => {
      const button = document.getElementById('google-login-modal-button');
      if (!button || !window.google) return;
      button.replaceChildren();
      window.google.accounts.id.initialize({ client_id: clientId, callback: async ({ credential }: { credential: string }) => {
        try {
          const response = await fetch('/api/v1/customers/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ credential }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Không thể đăng nhập Google.');
          setNotice(`Đăng nhập thành công. Xin chào ${data.user.name}!`);
        } catch (error) {
          setNotice(error instanceof Error ? error.message : 'Không thể đăng nhập Google.');
        }
      } });
      window.google.accounts.id.renderButton(button, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 340 });
    };
    const existing = document.getElementById('google-identity-service') as HTMLScriptElement | null;
    if (existing) { if (window.google) setup(); else existing.addEventListener('load', setup, { once: true }); return; }
    const script = document.createElement('script');
    script.id = 'google-identity-service'; script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.onload = setup; document.head.appendChild(script);
  }, [open, clientId]);

  useEffect(() => { if (open) setNotice(''); }, [open]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(<div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <button type="button" aria-label="Đóng cửa sổ đăng nhập" onClick={onClose} className="absolute inset-0 bg-[#24150e]/60 backdrop-blur-sm" />
    <section role="dialog" aria-modal="true" aria-labelledby="google-login-title" className="relative z-10 w-full max-w-md border-2 border-[#24150e] bg-[#fff6dc] p-6 shadow-[7px_8px_0_#24150e] sm:p-8">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute right-3 top-3 border-2 border-[#24150e] bg-white p-2"><X size={18} /></button>
      <p className="text-xs font-extrabold uppercase tracking-widest text-[#b4570a]">Honey Shop Cosplay</p>
      <h2 id="google-login-title" className="display mt-3 pr-8 text-3xl font-extrabold">Đăng nhập</h2>
      <p className="mt-2 text-sm leading-6 text-[#624b40]">Đăng nhập nhanh và an toàn bằng tài khoản Google để theo dõi thông tin của bạn.</p>
      {clientId ? <div id="google-login-modal-button" className="mt-6 flex min-h-11 justify-center" /> : <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-[#624b40]">Đăng nhập Google chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID.</p>}
      {notice && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-[#624b40]">{notice}</p>}
      <p className="mt-5 text-xs leading-5 text-neutral-600">Khi đăng nhập lần đầu, hồ sơ khách được tạo tự động. <a href="/quyen-rieng-tu" className="font-bold underline">Quyền riêng tư &amp; bảo mật</a></p>
    </section>
  </div>, document.body);
}
