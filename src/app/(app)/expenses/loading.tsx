export default function ExpensesLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 animate-pulse">
      <div className="flex gap-4 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-16 bg-surface border border-border rounded-md" />
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-10 bg-border rounded" />
        <div className="flex gap-3">
          <div className="h-4 w-16 bg-border rounded" />
          <div className="h-4 w-16 bg-border rounded" />
        </div>
      </div>
      <div className="bg-surface rounded-lg p-4 mb-7">
        <div className="h-3 w-20 bg-border rounded mb-3" />
        <div className="h-7 w-32 bg-border rounded" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-border rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-surface rounded" />
              <div className="h-3 w-20 bg-surface rounded" />
            </div>
            <div className="h-4 w-20 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
