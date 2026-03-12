export function SkeletonGrid({ items = 4, columns = 'md:grid-cols-2' }: { items?: number; columns?: string }) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="mt-3 h-5 w-2/3 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
