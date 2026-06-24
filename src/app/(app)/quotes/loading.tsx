export default function QuotesLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-16 bg-border rounded" />
        <div className="h-4 w-24 bg-border rounded" />
      </div>
      <div className="h-9 w-full bg-surface border border-border rounded-md mb-4" />
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 w-14 bg-surface border border-border rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-border rounded-lg px-4.5 py-3.5 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3.5 w-44 bg-surface rounded" />
              <div className="h-3 w-20 bg-surface rounded" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-20 bg-surface rounded" />
              <div className="h-5 w-12 bg-surface rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
