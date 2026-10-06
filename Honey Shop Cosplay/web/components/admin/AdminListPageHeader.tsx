import type { ReactNode } from 'react';

export function AdminListPageHeader({ title, description, action }: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex min-h-11 min-w-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-2">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="shrink-0 text-sm font-bold tracking-tight text-neutral-900 sm:text-base">{title}</h1>
        {description && <><span className="hidden h-5 border-l border-neutral-200 sm:block" /><p className="hidden truncate text-xs text-neutral-500 sm:block">{description}</p></>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
