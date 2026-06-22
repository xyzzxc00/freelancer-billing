export function TipPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-lg p-5 hidden lg:block">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-foreground-muted">
        <path
          d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.4.3.6.8.6 1.2v.5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5V15c0-.4.2-.9.6-1.2A6 6 0 0 0 12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm font-medium mt-3 mb-1.5">{title}</p>
      <p className="text-sm text-foreground-muted leading-relaxed mb-4">{description}</p>
      {children && (
        <div className="border-t border-border pt-4 flex flex-col gap-3">{children}</div>
      )}
    </div>
  );
}
