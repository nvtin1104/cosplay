'use client';

import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-neutral-950 text-white hover:bg-amber-700 disabled:bg-neutral-300 disabled:text-neutral-500',
  secondary: 'border border-neutral-200 bg-white text-neutral-700 hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-50',
  danger: 'text-red-600 hover:bg-red-50 disabled:opacity-50',
};

export function AdminButton({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100 ${buttonVariants[variant]} ${className}`} />;
}

export function AdminInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`admin-input min-h-12 ${className}`} />;
}

export function AdminTextarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`admin-input block w-full resize-y ${className}`} />;
}

export function AdminField({ label, htmlFor, hint, children, className = '', labelClassName = '' }: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return <div className={`grid gap-1.5 ${className}`}>
    <label htmlFor={htmlFor} className={`text-sm font-semibold text-neutral-800 ${labelClassName}`}>{label}</label>
    {children}
    {hint && <p className="text-xs font-normal text-neutral-500">{hint}</p>}
  </div>;
}

export function AdminCard({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`admin-card ${className}`} />;
}

export function AdminStatusBadge({ published, children }: { published: boolean; children?: ReactNode }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-emerald-500' : 'bg-amber-500'}`} />{children || (published ? 'Đã đăng' : 'Bản nháp')}
  </span>;
}

export type AdminSelectOption = { value: string; label: string };

export function AdminSelect({ options, value, defaultValue = '', onChange, placeholder = 'Chọn một mục', ariaLabel, searchable = true, leadingIcon, id, name, required = false, disabled = false, className = '', allowEmpty = true, size = 'default' }: {
  options: AdminSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  size?: 'default' | 'compact';
  placeholder?: string;
  ariaLabel: string;
  searchable?: boolean;
  leadingIcon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [internalValue, setInternalValue] = useState(defaultValue);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedValue = value ?? internalValue;
  const selected = options.find(option => option.value === selectedValue);
  const filtered = useMemo(() => options.filter(option => option.label.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))), [options, query]);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); setQuery(''); }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function choose(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
    setQuery('');
  }

  return <div ref={rootRef} className={`relative mt-1.5 ${className}`}>
    {name && <input type="hidden" name={name} value={selectedValue} required={required} />}
    <button id={id} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} aria-required={required} onClick={() => setOpen(current => !current)}
      className={`flex w-full items-center border bg-white text-left font-semibold transition focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-60 ${size === 'compact' ? 'min-h-8 gap-2 rounded-lg px-2 py-1 text-xs' : 'min-h-12 gap-3 rounded-xl px-3.5 text-sm'} ${open ? 'border-amber-500 shadow-[0_0_0_1px_#f59e0b]' : 'border-neutral-200 hover:border-neutral-300'}`}>
      {leadingIcon && <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selected ? 'bg-amber-50 text-amber-800' : 'bg-neutral-100 text-neutral-500'}`}>{leadingIcon}</span>}
      <span className={`min-w-0 flex-1 truncate ${selected ? 'text-neutral-900' : 'text-neutral-500'}`}>{selected?.label || placeholder}</span>
      <ChevronDown size={17} className={`shrink-0 text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="admin-select-options absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_18px_45px_-18px_rgba(0,0,0,.28)]">
      {searchable && <div className="relative p-1"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm kiếm…" aria-label={`Tìm kiếm: ${ariaLabel}`} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-amber-400 focus:bg-white" /></div>}
      <div role="listbox" aria-label={ariaLabel} className="max-h-56 overflow-y-auto p-1">
        {allowEmpty && <button type="button" role="option" aria-selected={!selectedValue} onClick={() => choose('')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${!selectedValue ? 'bg-amber-50 font-bold text-amber-900' : 'text-neutral-600 hover:bg-neutral-50'}`}>
          {leadingIcon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-500">{leadingIcon}</span>}
          <span className="flex-1">{placeholder}</span>{!selectedValue && <Check size={16} className="text-amber-700" />}
        </button>}
        {filtered.map(option => <button key={option.value} type="button" role="option" aria-selected={selectedValue === option.value} onClick={() => choose(option.value)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedValue === option.value ? 'bg-amber-50 font-bold text-amber-900' : 'text-neutral-700 hover:bg-neutral-50'}`}>
          {leadingIcon && <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selectedValue === option.value ? 'bg-white text-amber-700' : 'bg-neutral-100 text-neutral-500'}`}>{leadingIcon}</span>}
          <span className="min-w-0 flex-1 truncate">{option.label}</span>{selectedValue === option.value && <Check size={16} className="text-amber-700" />}
        </button>)}
        {filtered.length === 0 && <p className="px-3 py-5 text-center text-sm text-neutral-500">Không tìm thấy mục phù hợp.</p>}
      </div>
      <div className="border-t border-neutral-100 px-3 py-2 text-[11px] text-neutral-400">{options.length} mục</div>
    </div>}
  </div>;
}
