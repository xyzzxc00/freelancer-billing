export default function ClientsLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-12 bg-border rounded" />
        <div className="h-4 w-20 bg-border rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-surface shrink-0" />
              <div className="h-4 w-28 bg-surface rounded" />
            </div>
            <div className="h-3 w-20 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
