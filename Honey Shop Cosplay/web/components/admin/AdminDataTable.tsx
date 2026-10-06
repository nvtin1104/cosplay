'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Filter, LoaderCircle, Search, X } from 'lucide-react';

export type AdminDataTableFilter = {
  key: string;
  label: string;
  type?: 'text' | 'select' | 'number' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export function updateAdminTableFilter(filters: Record<string, string>, key: string, value: string): Record<string, string> {
  return { ...filters, [key]: value };
}

export type AdminDataTableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  filter?: AdminDataTableFilter;
};

export function useAdminPagedList<T>(endpoint: string, filters: Record<string, string>, pageSize = 30, enabled = true) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (!enabled) { setLoading(false); setRows([]); setHasMore(false); return; }
    let active = true;
    generation.current += 1;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ limit: String(pageSize), offset: '0' });
      Object.entries(JSON.parse(filterKey) as Record<string, string>).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim());
      });
      try {
        const response = await fetch(`/api/v1${endpoint}?${params}`, { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Không thể tải dữ liệu.');
        if (active) {
          setRows(data as T[]);
          setHasMore((data as T[]).length === pageSize);
        }
      } catch (e) {
        if (active) { setRows([]); setHasMore(false); setError((e as Error).message); }
      } finally {
        if (active) setLoading(false);
      }
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [endpoint, filterKey, pageSize, revision, enabled]);

  async function loadMore() {
    if (!enabled || loadingMore || !hasMore) return;
    const requestGeneration = generation.current;
    setLoadingMore(true);
    setError('');
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(rows.length) });
    Object.entries(JSON.parse(filterKey) as Record<string, string>).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    try {
      const response = await fetch(`/api/v1${endpoint}?${params}`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể tải thêm dữ liệu.');
      const next = data as T[];
      if (requestGeneration === generation.current) {
        setRows(current => [...current, ...next]);
        setHasMore(next.length === pageSize);
      }
    } catch (e) { if (requestGeneration === generation.current) setError((e as Error).message); }
    finally { setLoadingMore(false); }
  }

  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { rows, setRows, loading, loadingMore, error, setError, hasMore, loadMore, reload };
}

export function AdminDataTable<T extends { id: string | number }>({
  columns,
  rows,
  emptyMessage = 'Chưa có dữ liệu.',
  minWidth = '760px',
  filters = {},
  onFilterChange,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  error = '',
  searchPlaceholder = 'Tìm kiếm…',
}: {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  minWidth?: string;
  filters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  error?: string;
  searchPlaceholder?: string;
}) {
  const filterCount = Object.entries(filters).filter(([key, value]) => key !== 'search' && Boolean(value)).length;
  const [activeFilterKey, setActiveFilterKey] = useState<string | null>(null);
  const [popupStyle, setPopupStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const activeFilter = columns.find(column => column.filter?.key === activeFilterKey)?.filter;

  const positionPopup = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = 250;
    const height = popupRef.current?.getBoundingClientRect().height || 128;
    setPopupStyle({
      top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - height - 8)),
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
    });
  }, []);

  useEffect(() => {
    if (!activeFilterKey) return;
    positionPopup();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popupRef.current?.contains(target) && !anchorRef.current?.contains(target)) setActiveFilterKey(null);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setActiveFilterKey(null); };
    window.addEventListener('resize', positionPopup);
    window.addEventListener('scroll', positionPopup, true);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', positionPopup);
      window.removeEventListener('scroll', positionPopup, true);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeFilterKey, positionPopup]);

  const renderFilterPopup = () => {
    if (!activeFilter || typeof document === 'undefined') return null;
    const value = filters[activeFilter.key] || '';
    return createPortal(<div ref={popupRef} role="dialog" aria-label={`Lọc ${activeFilter.label}`} style={{ position: 'fixed', top: popupStyle.top, left: popupStyle.left, width: 250 }} className="z-[100] rounded-lg border border-neutral-200 bg-white p-3 shadow-xl shadow-neutral-900/10">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-neutral-800">Lọc: {activeFilter.label}</span>
        <button type="button" aria-label="Đóng bộ lọc" onClick={() => setActiveFilterKey(null)} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"><X size={14} /></button>
      </div>
      {activeFilter.type === 'select' ? <div className="relative"><select autoFocus aria-label={`Lọc ${activeFilter.label}`} value={value} onChange={event => onFilterChange?.(activeFilter.key, event.target.value)} className="h-9 w-full appearance-none rounded-md border border-neutral-200 bg-white py-1 pl-2.5 pr-7 text-xs text-neutral-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"><option value="">Tất cả</option>{activeFilter.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500" /></div> : <input autoFocus aria-label={`Lọc ${activeFilter.label}`} type={activeFilter.type === 'number' || activeFilter.type === 'date' ? activeFilter.type : 'search'} value={value} placeholder={activeFilter.placeholder || 'Nhập giá trị…'} onChange={event => onFilterChange?.(activeFilter.key, event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />}
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2">
        <button type="button" onClick={() => onFilterChange?.(activeFilter.key, '')} disabled={!value} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 disabled:cursor-default disabled:opacity-40">Xóa lọc</button>
        {value && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700"><Check size={12} />Đang áp dụng</span>}
      </div>
    </div>, document.body);
  };
  return (
    <div className="min-w-0">
      {onFilterChange && <div className="flex min-h-10 items-center border-b border-neutral-200 bg-white px-2 py-1">
        <div className="relative min-w-0 max-w-md flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="search" aria-label="Tìm kiếm trong danh sách" value={filters.search || ''} onChange={event => onFilterChange?.('search', event.target.value)} placeholder={searchPlaceholder} className="h-8 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-8 pr-2 text-xs outline-none placeholder:text-neutral-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100" />
        </div>
      </div>}
      <div className="w-full overflow-x-auto overscroll-x-contain border-y border-neutral-200 bg-white [scrollbar-width:thin]">
        <table className="w-full border-collapse text-left text-[13px]" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            <tr>{columns.map(column => {
              const filter = column.filter;
              const active = Boolean(filter && filters[filter.key]);
              const open = Boolean(filter && activeFilterKey === filter.key);
              return <th key={column.key} className={`h-9 border-b border-r border-neutral-200 px-3 last:border-r-0 ${column.headerClassName || ''}`}>
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="min-w-0 truncate">{column.header}</span>
                  {filter && <button ref={open ? anchorRef : undefined} type="button" aria-label={`Mở bộ lọc ${filter.label}`} aria-expanded={open} onClick={event => {
                    if (open) { setActiveFilterKey(null); return; }
                    anchorRef.current = event.currentTarget;
                    setActiveFilterKey(filter.key);
                  }} className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors ${open || active ? 'bg-amber-100 text-amber-800' : 'text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700'}`}><Filter size={13} /></button>}
                </div>
              </th>;
            })}</tr>
          </thead>
          <tbody>
            {rows.map(row => <tr key={row.id} className="group h-11 border-b border-neutral-100 text-neutral-700 transition-colors hover:bg-amber-50/60 last:border-0">{columns.map(column => <td key={column.key} className={`border-r border-neutral-100 px-3 py-1.5 last:border-r-0 focus-within:relative focus-within:z-[1] focus-within:ring-2 focus-within:ring-inset focus-within:ring-amber-400 ${column.className || ''}`}>{column.render(row)}</td>)}</tr>)}
            {!loading && rows.length === 0 && <tr><td colSpan={columns.length} className="h-20 px-4 text-center text-sm text-neutral-400">{emptyMessage}</td></tr>}
            {loading && <tr><td colSpan={columns.length} className="h-16 text-center text-sm text-neutral-500"><span className="inline-flex items-center gap-2"><LoaderCircle size={15} className="animate-spin" />Đang tải dữ liệu…</span></td></tr>}
          </tbody>
        </table>
      </div>
      {activeFilterKey && renderFilterPopup()}
      <div className="flex min-h-10 items-center justify-between gap-3 px-2 py-1.5 text-xs text-neutral-500">
        <span>{rows.length} hàng{filterCount ? ` · ${filterCount} bộ lọc` : ''}</span>
        <div className="flex items-center gap-3">
          {error && <span role="alert" className="text-red-600">{error}</span>}
          {hasMore && <button type="button" disabled={loadingMore} onClick={onLoadMore} className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">{loadingMore && <LoaderCircle size={13} className="animate-spin" />}{loadingMore ? 'Đang tải…' : 'Tải thêm'}</button>}
        </div>
      </div>
    </div>
  );
}
