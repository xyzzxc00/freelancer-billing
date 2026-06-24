export default function ReportsLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 animate-pulse">
      <div className="flex gap-4 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-16 bg-surface border border-border rounded-md" />
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-20 bg-border rounded" />
        <div className="h-4 w-16 bg-border rounded" />
      </div>
      <div className="flex gap-2 mb-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 w-10 bg-surface border border-border rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface rounded-lg p-4">
            <div className="h-3 w-20 bg-border rounded mb-3" />
            <div className="h-7 w-28 bg-border rounded" />
          </div>
        ))}
      </div>
      <div className="h-4 w-20 bg-border rounded mb-3" />
      <div className="border border-border rounded-lg overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-border first:border-t-0 px-3 py-2 flex justify-between">
            <div className="h-3.5 w-8 bg-surface rounded" />
            <div className="h-3.5 w-20 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
