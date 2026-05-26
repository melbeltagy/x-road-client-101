/**
 * Wrap a value in POSIX single quotes, escaping any literal single quote
 * via the standard `'\''` close-escape-open dance. Output is safe to drop
 * directly into a bash/sh command line.
 */
export function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
