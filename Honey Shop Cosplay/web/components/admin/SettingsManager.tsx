'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { ProductTag, SiteSettings } from '../../lib/types';
import { AdminButton, AdminCard, AdminField, AdminInput, AdminTextarea } from './AdminUI';

const fields: [keyof SiteSettings, string][] = [
  ['site_name', 'Tên site'], ['logo_url', 'Logo URL'], ['contact_phone', 'Số điện thoại'],
  ['contact_email', 'Email'], ['contact_address', 'Địa chỉ'], ['contact_facebook', 'Facebook'], ['contact_zalo', 'Zalo'],
];
const pointKeys = ['points_currency_step', 'points_per_step', 'points_value_vnd', 'points_redemption_enabled'];
const known = new Set([...fields.map(([key]) => key), 'pinned_tag_ids', ...pointKeys]);
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể lưu');
  return data as T;
}

export function SettingsManager() {
  const [rows, setRows] = useState<{ key: string; value: string }[]>([]);
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [pinned, setPinned] = useState<string[]>([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  async function load() {
    try {
      const [settings, allTags] = await Promise.all([api<{ key: string; value: string }[]>('/admin/settings'), api<ProductTag[]>('/tags')]);
      setRows(settings); setTags(allTags);
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
  async function add(event: FormEvent) {
    event.preventDefault();
    try { await put(key, value); setKey(''); setValue(''); setMessage('Đã lưu key.'); await load(); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function remove(key: string) {
    if (!confirm(`Xóa ${key}?`)) return;
    try { await api(`/admin/settings/${encodeURIComponent(key)}`, { method: 'DELETE' }); await load(); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function upload(file: File) {
    setUploading(true);
    try { const form = new FormData(); form.append('file', file); const result = await api<{ url: string }>('/admin/uploads', { method: 'POST', body: form }); setValues(prev => ({ ...prev, logo_url: result.url })); }
    catch (e) { setMessage((e as Error).message); }
    finally { setUploading(false); }
  }
  function move(id: string, direction: number) { const current = pinned.indexOf(id); const target = current + direction; if (target < 0 || target >= pinned.length) return; const next = [...pinned]; [next[current], next[target]] = [next[target], next[current]]; setPinned(next); }

  return <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
    <form onSubmit={save} className="admin-card grid gap-4 p-6"><h2 className="text-lg font-bold">Thông tin công khai</h2>
      {fields.map(([name, label]) => <AdminField key={name} label={label} htmlFor={`site-setting-${name}`}><AdminInput id={`site-setting-${name}`} type={name === 'contact_email' ? 'email' : 'text'} value={values[name] || ''} onChange={e => setValues(prev => ({ ...prev, [name]: e.target.value }))} /></AdminField>)}
      <label className="text-sm">Tải logo lên <input type="file" accept="image/*" disabled={uploading} onChange={e => { if (e.target.files?.[0]) void upload(e.target.files[0]); }} /></label>
      {values.logo_url && <img src={values.logo_url} alt="Logo hiện tại" className="h-20 w-36 object-contain" />}
      <h3 className="font-bold">Tag ghim ở trang chủ</h3><p className="text-xs text-neutral-500">Chọn tag và dùng nút lên/xuống để sắp thứ tự nhóm đồ.</p>
      {tags.map(tag => <div key={tag.id} className="flex items-center gap-2 text-sm"><label className="flex flex-1 items-center gap-2"><input type="checkbox" checked={pinned.includes(tag.id)} onChange={e => setPinned(prev => e.target.checked ? [...prev, tag.id] : prev.filter(id => id !== tag.id))} />{tag.name}</label>{pinned.includes(tag.id) && <><button type="button" onClick={() => move(tag.id, -1)} aria-label={`Đưa ${tag.name} lên`}>↑</button><button type="button" onClick={() => move(tag.id, 1)} aria-label={`Đưa ${tag.name} xuống`}>↓</button><span className="w-5 text-right">{pinned.indexOf(tag.id) + 1}</span></>}</div>)}
      <AdminButton className="py-3">Lưu cài đặt</AdminButton>
      {message && <p role="status" className="text-sm text-amber-700">{message}</p>}
    </form>
    <div className="grid gap-6 self-start">
      <AdminCard className="p-6"><h2 className="text-lg font-bold">Quy tắc điểm thành viên</h2><p className="mt-1 text-xs leading-5 text-neutral-500">Điểm mặc định được tính theo chi tiêu đơn thuê. Sản phẩm có điểm thưởng riêng sẽ dùng mức sản phẩm đó.</p><form onSubmit={savePoints} className="mt-4 grid gap-4 sm:grid-cols-2"><AdminField label="Mỗi mức chi tiêu (VNĐ)" htmlFor="points-currency-step"><AdminInput id="points-currency-step" type="number" min="1" value={values.points_currency_step ?? '10000'} onChange={e => setValues(prev => ({ ...prev, points_currency_step: e.target.value }))} /></AdminField><AdminField label="Điểm cộng mỗi mức" htmlFor="points-per-step"><AdminInput id="points-per-step" type="number" min="0" value={values.points_per_step ?? '1'} onChange={e => setValues(prev => ({ ...prev, points_per_step: e.target.value }))} /></AdminField><AdminField label="Giá trị quy đổi một điểm (VNĐ)" htmlFor="points-value-vnd"><AdminInput id="points-value-vnd" type="number" min="0" value={values.points_value_vnd ?? '1000'} onChange={e => setValues(prev => ({ ...prev, points_value_vnd: e.target.value }))} /></AdminField><label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" checked={(values.points_redemption_enabled ?? '1') !== '0'} onChange={e => setValues(prev => ({ ...prev, points_redemption_enabled: e.target.checked ? '1' : '0' }))} className="h-4 w-4" />Cho phép đổi điểm</label><div className="sm:col-span-2"><AdminButton>Lưu quy tắc điểm</AdminButton></div></form></AdminCard>
      <AdminCard className="p-6"><h2 className="text-lg font-bold">Config key/value</h2><p className="mt-1 text-xs text-neutral-500">Các key tùy chỉnh chỉ xem được trong admin; không đưa lên API công khai.</p><form onSubmit={add} className="mt-4 grid gap-2"><AdminInput placeholder="key_name" value={key} onChange={e => setKey(e.target.value)} required /><AdminTextarea placeholder="Value" value={value} onChange={e => setValue(e.target.value)} /><AdminButton className="py-2">Lưu key</AdminButton></form><div className="mt-5 space-y-2">{rows.filter(row => !known.has(row.key)).map(row => <div key={row.key} className="rounded border p-3 text-sm"><div className="flex justify-between"><b>{row.key}</b><AdminButton type="button" variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(row.key)}>Xóa</AdminButton></div><p className="mt-1 break-all text-neutral-500">{row.value}</p><AdminButton type="button" variant="ghost" className="mt-2 px-2 py-1 text-xs" onClick={() => { setKey(row.key); setValue(row.value); }}>Sửa</AdminButton></div>)}</div></AdminCard>
    </div>
  </div>;
}
