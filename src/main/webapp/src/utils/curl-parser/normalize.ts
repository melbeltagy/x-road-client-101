export interface ErrorSpan {
  start: number;
  end: number;
}

/**
 * Normalize line continuations and return a mapping from normalized
 * indices back to original-input indices, so error spans can be
 * reported in the user's original text.
 *
 * Handles bash `\<LF>` and windows-cmd `^<CRLF>` / `^<LF>` continuations.
 * Each continuation collapses to a single space; the space's index in
 * `mapToOriginal` points at the position of the backslash/caret in the
 * original input.
 */
export function normalizeAndMap(input: string): { normalized: string; mapToOriginal: number[] } {
  const map: number[] = [];
  let normalized = "";
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];
    if (ch === "\\" && (next === "\n" || (next === "\r" && input[i + 2] === "\n"))) {
      // Replace with a single space, mapped to the backslash position.
      normalized += " ";
      map.push(i);
      i += next === "\r" ? 3 : 2;
      continue;
    }
    if (ch === "^" && next === "\r" && input[i + 2] === "\n") {
      normalized += " ";
      map.push(i);
      i += 3;
      continue;
    }
    if (ch === "^" && next === "\n") {
      normalized += " ";
      map.push(i);
      i += 2;
      continue;
    }
    normalized += ch;
    map.push(i);
    i++;
  }
  // Sentinel for end-of-input mapping.
  map.push(input.length);
  return { normalized, mapToOriginal: map };
}

/** Translate a span in normalized coordinates back to original-input coordinates. */
export function mapSpan(span: ErrorSpan, map: number[]): ErrorSpan {
  const start = map[Math.min(span.start, map.length - 1)] ?? span.start;
  // For exclusive end, use the next mapped position if possible.
  const endIdx = Math.min(span.end, map.length - 1);
  const end = map[endIdx] ?? span.end;
  return { start, end };
}
