export default function AdminLoading() {
  return (
    <div className="animate-pulse p-3 sm:p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="h-3 w-28 rounded bg-neutral-200" />
          <div className="mt-2 h-7 w-52 rounded-lg bg-neutral-200" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-card min-h-[108px] p-3.5 sm:p-4">
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="mt-3 h-7 w-28 rounded bg-neutral-200" />
            <div className="mt-2 h-3 w-32 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="admin-card mt-3 overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 p-4">
          <div><div className="h-4 w-44 rounded bg-neutral-200" /><div className="mt-2 h-3 w-56 rounded bg-neutral-100" /></div>
          <div className="h-6 w-14 rounded-full bg-neutral-100" />
        </div>
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_1.3fr_1fr_auto] sm:items-center">
              <div><div className="h-4 w-36 rounded bg-neutral-200" /><div className="mt-2 h-3 w-44 rounded bg-neutral-100" /></div>
              <div className="h-4 w-40 rounded bg-neutral-100" />
              <div className="flex gap-1.5"><div className="h-6 w-24 rounded-full bg-neutral-100" /><div className="h-6 w-20 rounded-full bg-neutral-100" /></div>
              <div className="h-4 w-12 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
