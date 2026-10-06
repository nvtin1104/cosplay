'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { ProductTag, SiteSettings } from '../../lib/types';
import { AdminButton, AdminCard, AdminField, AdminInput } from './AdminUI';

const fields: [keyof SiteSettings, string][] = [
  ['site_name', 'Tên site'], ['logo_url', 'Logo URL'], ['contact_phone', 'Số điện thoại'],
  ['contact_email', 'Email'], ['contact_address', 'Địa chỉ'], ['contact_facebook', 'Facebook'], ['contact_zalo', 'Zalo'],
];
const pointKeys = ['points_currency_step', 'points_per_step', 'points_value_vnd', 'points_redemption_enabled'];
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể lưu');
  return data as T;
}

export function SettingsManager() {
  const [activeTab, setActiveTab] = useState<'site' | 'loyalty'>('site');
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [pinned, setPinned] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  async function load() {
    try {
      const [settings, allTags] = await Promise.all([api<{ key: string; value: string }[]>('/admin/settings'), api<ProductTag[]>('/tags')]);
      setTags(allTags);
      setValues(Object.fromEntries(settings.map(row => [row.key, row.value])));
      try { const parsed = JSON.parse(settings.find(row => row.key === 'pinned_tag_ids')?.value || '[]'); setPinned(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []); } catch { setPinned([]); }
    } catch (e) { setMessage((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);
  async function put(key: string, value: string) {
    await api('/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    try { await Promise.all([...fields.map(([name]) => put(name, values[name] || '')), put('pinned_tag_ids', JSON.stringify(pinned))]); setMessage('Đã lưu cài đặt.'); await load(); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function savePoints(event: FormEvent) {
    event.preventDefault();
    try { await Promise.all(pointKeys.map(name => put(name, values[name] || (name === 'points_redemption_enabled' ? '1' : '0')))); setMessage('Đã lưu quy tắc điểm.'); await load(); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function upload(file: File) {
    setUploading(true);
    try { const form = new FormData(); form.append('file', file); const result = await api<{ url: string }>('/admin/uploads', { method: 'POST', body: form }); setValues(prev => ({ ...prev, logo_url: result.url })); }
    catch (e) { setMessage((e as Error).message); }
    finally { setUploading(false); }
  }
  function move(id: string, direction: number) { const current = pinned.indexOf(id); const target = current + direction; if (target < 0 || target >= pinned.length) return; const next = [...pinned]; [next[current], next[target]] = [next[target], next[current]]; setPinned(next); }

  const tabs = [
    { id: 'site' as const, label: 'Thông tin site', description: 'Nhận diện, liên hệ, tag trang chủ' },
    { id: 'loyalty' as const, label: 'Thành viên & điểm', description: 'Tích điểm và đổi điểm' },
  ];

  return <div className="space-y-3">
    <div role="tablist" aria-label="Nhóm cài đặt" className="flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1">
      {tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`settings-panel-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`min-w-fit flex-1 rounded-lg px-3 py-2 text-left transition ${activeTab === tab.id ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
        <span className="block text-sm font-bold">{tab.label}</span><span className={`mt-0.5 hidden text-[11px] sm:block ${activeTab === tab.id ? 'text-neutral-300' : 'text-neutral-400'}`}>{tab.description}</span>
      </button>)}
    </div>
    {message && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>}

    {activeTab === 'site' && <form id="settings-panel-site" role="tabpanel" onSubmit={save} className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="admin-card grid content-start gap-3 p-4">
        <div><h2 className="text-base font-bold">Nhận diện và liên hệ</h2><p className="mt-0.5 text-xs text-neutral-500">Thông tin hiển thị trên website và các kênh liên hệ của shop.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(([name, label]) => <AdminField key={name} label={label} htmlFor={`site-setting-${name}`} className={name === 'contact_address' ? 'sm:col-span-2' : ''}><AdminInput id={`site-setting-${name}`} type={name === 'contact_email' ? 'email' : 'text'} value={values[name] || ''} onChange={e => setValues(prev => ({ ...prev, [name]: e.target.value }))} /></AdminField>)}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-3">
          <label className="text-xs font-semibold text-neutral-600">Tải logo <input className="ml-2 max-w-56 text-xs" type="file" accept="image/*" disabled={uploading} onChange={e => { if (e.target.files?.[0]) void upload(e.target.files[0]); }} /></label>
          {uploading && <span className="text-xs text-neutral-500">Đang tải logo…</span>}
          {values.logo_url && <img src={values.logo_url} alt="Logo hiện tại" className="h-10 max-w-24 object-contain" />}
        </div>
      </section>
      <section className="admin-card grid content-start gap-2 p-4">
        <div><h2 className="text-base font-bold">Tag ghim trang chủ</h2><p className="mt-0.5 text-xs text-neutral-500">Chọn tag và sắp xếp thứ tự hiển thị.</p></div>
        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {tags.map(tag => <div key={tag.id} className="flex min-h-8 items-center gap-2 rounded-md px-1 text-sm hover:bg-neutral-50"><label className="flex min-w-0 flex-1 items-center gap-2"><input type="checkbox" checked={pinned.includes(tag.id)} onChange={e => setPinned(prev => e.target.checked ? [...prev, tag.id] : prev.filter(id => id !== tag.id))} /><span className="truncate">{tag.name}</span></label>{pinned.includes(tag.id) && <><button type="button" className="rounded px-1.5 text-neutral-500 hover:bg-neutral-200" onClick={() => move(tag.id, -1)} aria-label={`Đưa ${tag.name} lên`}>↑</button><button type="button" className="rounded px-1.5 text-neutral-500 hover:bg-neutral-200" onClick={() => move(tag.id, 1)} aria-label={`Đưa ${tag.name} xuống`}>↓</button><span className="w-5 text-right text-xs text-neutral-500">{pinned.indexOf(tag.id) + 1}</span></>}</div>)}
          {tags.length === 0 && <p className="py-3 text-xs text-neutral-400">Chưa có tag sản phẩm.</p>}
        </div>
      </section>
      <div className="flex items-center gap-3 xl:col-span-2"><AdminButton className="px-4 py-2">Lưu thông tin site</AdminButton><span className="text-xs text-neutral-500">Lưu thông tin công khai và thứ tự tag ghim.</span></div>
    </form>}

    {activeTab === 'loyalty' && <AdminCard id="settings-panel-loyalty" role="tabpanel" className="grid content-start gap-3 p-4">
      <div><h2 className="text-base font-bold">Thành viên và điểm thưởng</h2><p className="mt-0.5 text-xs text-neutral-500">Điểm mặc định tính theo chi tiêu đơn thuê; điểm thưởng riêng trên sản phẩm sẽ được ưu tiên.</p></div>
      <form onSubmit={savePoints} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminField label="Mỗi mức chi tiêu (VNĐ)" htmlFor="points-currency-step"><AdminInput id="points-currency-step" type="number" min="1" value={values.points_currency_step ?? '10000'} onChange={e => setValues(prev => ({ ...prev, points_currency_step: e.target.value }))} /></AdminField>
        <AdminField label="Điểm cộng mỗi mức" htmlFor="points-per-step"><AdminInput id="points-per-step" type="number" min="0" value={values.points_per_step ?? '1'} onChange={e => setValues(prev => ({ ...prev, points_per_step: e.target.value }))} /></AdminField>
        <AdminField label="Giá trị một điểm (VNĐ)" htmlFor="points-value-vnd"><AdminInput id="points-value-vnd" type="number" min="0" value={values.points_value_vnd ?? '1000'} onChange={e => setValues(prev => ({ ...prev, points_value_vnd: e.target.value }))} /></AdminField>
        <div className="flex items-end justify-between gap-3"><label className="flex min-h-12 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={(values.points_redemption_enabled ?? '1') !== '0'} onChange={e => setValues(prev => ({ ...prev, points_redemption_enabled: e.target.checked ? '1' : '0' }))} className="h-4 w-4" />Cho phép đổi điểm</label><AdminButton className="shrink-0 px-3 py-2">Lưu</AdminButton></div>
      </form>
    </AdminCard>}

  </div>;
}
