"use client";

import { useRef, useState } from "react";

function formatDate(value: string) {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${y}/${m}/${d}`;
}

export function DueDateInput({
  action,
  defaultValue,
}: {
  action: (formData: FormData) => void;
  defaultValue: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setEditing(true);
          requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.showPicker?.();
          });
        }}
        className="flex items-center gap-1.5 text-xs border border-border rounded-md px-2 py-1 bg-background hover:bg-surface"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" />
        </svg>
        {value ? (
          <span>到期日：{formatDate(value)}</span>
        ) : (
          <span className="text-accent">+ 設定到期日</span>
        )}
      </button>
    );
  }

  return (
    <form
      action={action}
      className="flex items-center gap-1.5"
      onSubmit={() => setEditing(false)}
    >
      <input
        ref={inputRef}
        type="date"
        name="dueDate"
        defaultValue={value}
        onChange={(e) => {
          setValue(e.target.value);
          e.currentTarget.form?.requestSubmit();
        }}
        onBlur={() => setEditing(false)}
        className="border border-border rounded-md px-2 py-1 text-xs bg-background"
      />
    </form>
  );
}
