export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-[color:var(--danger-fg)]">{message}</p>;
}
