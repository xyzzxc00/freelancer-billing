interface CategoryAmount {
  name: string;
  amount: number;
}

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function CategoryBreakdown({
  title,
  data,
  tone,
}: {
  title: string;
  data: CategoryAmount[];
  tone: "success" | "danger";
}) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const barColor = tone === "success" ? "bg-[color:var(--success-fg)]" : "bg-[color:var(--danger-fg)]";

  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-foreground-muted">這個區間沒有資料。</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0;
            return (
              <div key={d.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate">{d.name}</span>
                  <span className="font-mono text-xs text-foreground-muted shrink-0 ml-2">
                    {currency.format(d.amount)} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} opacity-70`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
