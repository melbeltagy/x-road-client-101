import type { ErrorSpan } from "./normalize";

export interface Token {
  value: string;
  start: number; // inclusive index into normalized input
  end: number; // exclusive index into normalized input
}

export interface TokenizeError extends Error {
  span?: ErrorSpan;
}

/**
 * Tokenize a normalized curl command. Handles single quotes (literal),
 * double quotes (with backslash escapes), and unquoted words with
 * backslash escapes. Throws a TokenizeError (with a span pointing at
 * the opening quote) on unterminated quote.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let hasCurrent = false;
  let tokenStart = 0;
  let quoteOpenIdx = -1;

  const flushToken = (endIdx: number): void => {
    if (hasCurrent) {
      tokens.push({ value: current, start: tokenStart, end: endIdx });
      current = "";
      hasCurrent = false;
    }
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inSingle) {
      if (ch === "'") {
        if (input.slice(i + 1, i + 4) === "\\''") {
          current += "'";
          hasCurrent = true;
          i += 3;
          continue;
        }
        inSingle = false;
        continue;
      }
      current += ch;
      hasCurrent = true;
      continue;
    }

    if (inDouble) {
      if (ch === "\\" && i + 1 < input.length) {
        const next = input[i + 1];
        if (next === '"' || next === "\\" || next === "$" || next === "`") {
          current += next;
          hasCurrent = true;
          i++;
          continue;
        }
        current += ch;
        hasCurrent = true;
        continue;
      }
      if (ch === '"') {
        inDouble = false;
        continue;
      }
      current += ch;
      hasCurrent = true;
      continue;
    }

    if (ch === "'") {
      if (!hasCurrent) tokenStart = i;
      inSingle = true;
      hasCurrent = true;
      quoteOpenIdx = i;
      continue;
    }
    if (ch === '"') {
      if (!hasCurrent) tokenStart = i;
      inDouble = true;
      hasCurrent = true;
      quoteOpenIdx = i;
      continue;
    }
    if (ch === "\\" && i + 1 < input.length) {
      if (!hasCurrent) tokenStart = i;
      current += input[i + 1];
      hasCurrent = true;
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      flushToken(i);
      continue;
    }
    if (!hasCurrent) tokenStart = i;
    current += ch;
    hasCurrent = true;
  }

  if (inSingle || inDouble) {
    const err = new Error("Unterminated quote in cURL command") as TokenizeError;
    err.span = { start: quoteOpenIdx, end: input.length };
    throw err;
  }
  flushToken(input.length);
  return tokens;
}
