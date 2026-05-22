/**
 * Converts bytes to a human-readable file size string.
 * @param bytes - The size in bytes
 * @returns A formatted string like "1.50 KB" or "2.34 MB"
 */
export function toHumanReadableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
