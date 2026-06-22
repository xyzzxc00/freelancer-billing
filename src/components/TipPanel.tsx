export function TipPanel({
  title,
  description,
  itemsLabel,
  children,
  steps,
}: {
  title: string;
  description: string;
  itemsLabel?: string;
  children?: React.ReactNode;
  steps?: string[];
}) {
  return (
    <div className="bg-surface rounded-lg p-6 hidden lg:block">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-accent-foreground flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent">
            <path
              d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.4.3.6.8.6 1.2v.5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5V15c0-.4.2-.9.6-1.2A6 6 0 0 0 12 3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-base font-medium">{title}</p>
      </div>
      <p className="text-sm text-foreground-muted leading-relaxed mb-5">{description}</p>

      {children && (
        <div className="border-t border-border pt-4 mb-5">
          {itemsLabel && (
            <p className="text-xs text-foreground-muted mb-2.5">{itemsLabel}</p>
          )}
          <div className="grid grid-cols-2 gap-2.5">{children}</div>
        </div>
      )}

      {steps && steps.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs text-foreground-muted mb-2.5">接下來可以</p>
          <div className="flex flex-col gap-2.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-background text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground-muted leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
