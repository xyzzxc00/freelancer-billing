"use client";

export function DueDateInput({
  action,
  defaultValue,
}: {
  action: (formData: FormData) => void;
  defaultValue: string;
}) {
  return (
    <form action={action} className="flex items-center gap-1.5">
      <span className="text-xs text-foreground-muted">到期日</span>
      <input
        type="date"
        name="dueDate"
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="border border-border rounded-md px-2 py-0.5 text-xs bg-background"
      />
    </form>
  );
}
