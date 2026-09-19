export default function AdminLoading() {
  return (
    <div className="p-5 md:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-20 bg-neutral-200 rounded" />
          <div className="mt-2 h-8 w-64 bg-neutral-200 rounded-lg" />
          <div className="mt-2 h-4 w-80 bg-neutral-200 rounded" />
        </div>
        <div className="h-10 w-32 bg-neutral-200 rounded-lg" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-card p-5 bg-white">
            <div className="h-4 w-24 bg-neutral-200 rounded" />
            <div className="mt-3 h-8 w-16 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="admin-card mt-6 bg-white overflow-hidden">
        <div className="border-b border-neutral-100 p-4 flex gap-4">
          <div className="h-4 w-32 bg-neutral-200 rounded" />
          <div className="h-4 w-24 bg-neutral-200 rounded" />
          <div className="h-4 w-24 bg-neutral-200 rounded" />
        </div>
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-neutral-200 rounded-lg" />
                <div>
                  <div className="h-4 w-44 bg-neutral-200 rounded" />
                  <div className="mt-1 h-3 w-28 bg-neutral-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-neutral-200 rounded" />
              <div className="h-4 w-12 bg-neutral-200 rounded" />
              <div className="h-6 w-24 bg-neutral-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
