export function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function inlineDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_");
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
