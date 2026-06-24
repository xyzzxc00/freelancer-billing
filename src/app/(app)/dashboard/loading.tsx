export default function DashboardLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface rounded-lg p-4">
            <div className="h-3 w-20 bg-border rounded mb-3" />
            <div className="h-7 w-28 bg-border rounded" />
          </div>
        ))}
      </div>
      <div className="h-5 w-24 bg-border rounded mb-3" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3.5 w-40 bg-surface rounded" />
              <div className="h-3 w-24 bg-surface rounded" />
            </div>
            <div className="h-4 w-20 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
