import type { XRoadRequest, RequestDetails } from '@/types';

export interface ErrorSpan {
  start: number;
  end: number;
}

// Error/warning messages are intentionally English-only: actionable content is literal code (-X, /r1/, --cert, X-Road-Client) that doesn't translate, and the dialog's underline overlay already shows the user where the problem is.
export interface ParseCurlResult {
  request: XRoadRequest | null;
  warnings: string[];
  error: string | null;
  errorSpan?: ErrorSpan;
}

interface Token {
  value: string;
  start: number; // inclusive index into normalized input
  end: number;   // exclusive index into normalized input
}

type HttpMethod = RequestDetails['method'];

const HTTP_METHODS: readonly HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

// Flags accepted with no further effect. -v is exported by curl-generator,
// so we always allow it; rejecting it would break our own round-trip.
const ACCEPTED_NOOP_FLAGS = new Set(['-v', '--verbose']);

// Heuristic: treat segment after serviceCode as serviceVersion when it
// looks like a version identifier (v1, v2, 1.0, etc).
const VERSION_PATTERN = /^v?\d+(?:\.\d+)*$/i;

/**
 * Parse a curl command string into an XRoadRequest. Strict: requires the
 * URL to match the X-Road /r1/ shape and the X-Road-Client header to be
 * present. Returns warnings for soft issues (mTLS placeholders) without
 * failing. On hard failure, errorSpan points at the offending range in
 * the input the caller passed in.
 */
export function parseCurlCommand(input: string): ParseCurlResult {
  const warnings: string[] = [];

  const trimmed = input.trim();
  if (!trimmed) {
    return { request: null, warnings, error: 'Empty input' };
  }

  // Normalize line continuations: bash (\<LF>) and windows-cmd (^<CRLF>).
  // We do this on the raw input (without losing offsets where possible)
  // by substituting with a single space of equal length to keep tokens
  // aligned with the user's original input — but full equal-length is
  // tricky. Instead we normalize and translate spans back via a map.
  const { normalized, mapToOriginal } = normalizeAndMap(input);

  let tokens: Token[];
  try {
    tokens = tokenize(normalized);
  } catch (err) {
    const e = err as { message: string; span?: ErrorSpan };
    return {
      request: null,
      warnings,
      error: e.message,
      errorSpan: e.span ? mapSpan(e.span, mapToOriginal) : undefined,
    };
  }

  if (tokens.length === 0) {
    return { request: null, warnings, error: 'No tokens found' };
  }

  const first = tokens[0].value.toLowerCase();
  if (!first.endsWith('curl') && first !== 'curl') {
    return {
      request: null,
      warnings,
      error: 'Not a valid cURL command',
      errorSpan: mapSpan({ start: tokens[0].start, end: tokens[0].end }, mapToOriginal),
    };
  }

  let urlToken: Token | null = null;
  let method: HttpMethod | null = null;
  let body: string | undefined;
  let bodyExplicitMethod = false;
  const headers: Record<string, string> = {};
  let mtlsDetected = false;

  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    const v = tok.value;

    if (v === '-X' || v === '--request') {
      const arg = tokens[++i];
      if (!arg) return errAt('Missing argument for ' + v, tok, mapToOriginal);
      const up = arg.value.toUpperCase() as HttpMethod;
      if (!HTTP_METHODS.includes(up)) {
        return errAt(`Unsupported HTTP method: ${arg.value}`, arg, mapToOriginal);
      }
      method = up;
      bodyExplicitMethod = true;
      continue;
    }

    if (v === '-H' || v === '--header') {
      const arg = tokens[++i];
      if (!arg) return errAt('Missing argument for ' + v, tok, mapToOriginal);
      const idx = arg.value.indexOf(':');
      if (idx < 0) {
        warnings.push(`Ignored malformed header: ${arg.value}`);
        continue;
      }
      const key = arg.value.slice(0, idx).trim();
      const value = arg.value.slice(idx + 1).trim();
      if (key) headers[key] = value;
      continue;
    }

    if (v === '-d' || v === '--data' || v === '--data-raw' || v === '--data-binary' || v === '--data-ascii') {
      const arg = tokens[++i];
      if (arg === undefined) return errAt('Missing argument for ' + v, tok, mapToOriginal);
      body = arg.value;
      continue;
    }

    if (v === '--cert' || v === '--key' || v === '--cacert' || v === '-E') {
      mtlsDetected = true;
      i++; // consume the file argument
      continue;
    }

    if (ACCEPTED_NOOP_FLAGS.has(v)) {
      continue;
    }

    if (v.startsWith('-')) {
      return errAt(
        `Unsupported flag '${v}'. This importer only accepts flags used in X-Road cURL commands (-X, -H, -d/--data, --cert, --key, --cacert, -v).`,
        tok,
        mapToOriginal
      );
    }

    if (urlToken === null) {
      urlToken = tok;
      continue;
    }

    warnings.push(`Ignored extra positional argument: ${v}`);
  }

  if (!urlToken) {
    return { request: null, warnings, error: 'No URL found in cURL command' };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlToken.value);
  } catch {
    return errAt(`Invalid URL: ${urlToken.value}`, urlToken, mapToOriginal);
  }

  const urlInfo = parseXRoadUrl(parsedUrl);
  if (urlInfo.error) {
    return errAt(urlInfo.error, urlToken, mapToOriginal);
  }
  if (urlInfo.warning) {
    warnings.push(urlInfo.warning);
  }

  const xRoadClientValue = findHeader(headers, 'x-road-client');
  if (!xRoadClientValue) {
    return { request: null, warnings, error: 'Missing required X-Road-Client header' };
  }
  const clientParts = xRoadClientValue.split('/');
  if (clientParts.length !== 4 || clientParts.some((p) => !p.trim())) {
    return {
      request: null,
      warnings,
      error: `Malformed X-Road-Client header: ${xRoadClientValue} (expected instance/class/member/subsystem)`,
    };
  }

  if (!method) {
    method = body !== undefined ? 'POST' : 'GET';
  } else if (!bodyExplicitMethod && body !== undefined && method === 'GET') {
    method = 'POST';
  }

  const remainingHeaders: Record<string, string> = {};
  let contentType: string | undefined;
  for (const [k, val] of Object.entries(headers)) {
    const lower = k.toLowerCase();
    if (lower === 'x-road-client') continue;
    if (lower === 'content-type') {
      contentType = val;
      continue;
    }
    remainingHeaders[k] = val;
  }

  const queryParams: Record<string, string> = {};
  parsedUrl.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  if (mtlsDetected) {
    warnings.push(
      'mTLS flags detected (--cert/--key/--cacert) but certificate contents cannot be imported. Please add them via the Security tab.'
    );
  }

  const request: XRoadRequest = {
    client: {
      subsystem: {
        instanceId: clientParts[0],
        memberClass: clientParts[1],
        memberCode: clientParts[2],
        subsystemCode: clientParts[3],
      },
      securityServerUrl: `${parsedUrl.protocol}//${parsedUrl.host}`,
    },
    service: {
      subsystem: {
        instanceId: urlInfo.instanceId!,
        memberClass: urlInfo.memberClass!,
        memberCode: urlInfo.memberCode!,
        subsystemCode: urlInfo.subsystemCode!,
      },
      serviceCode: urlInfo.serviceCode!,
      serviceVersion: urlInfo.serviceVersion,
    },
    request: {
      method,
      path: urlInfo.path!,
      ...(Object.keys(queryParams).length > 0 ? { queryParams } : {}),
      ...(Object.keys(remainingHeaders).length > 0 ? { headers: remainingHeaders } : {}),
      ...(body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method) ? { body } : {}),
      ...(contentType ? { contentType } : {}),
    },
  };

  return { request, warnings, error: null };
}

function errAt(message: string, tok: Token, map: number[]): ParseCurlResult {
  return {
    request: null,
    warnings: [],
    error: message,
    errorSpan: mapSpan({ start: tok.start, end: tok.end }, map),
  };
}

interface XRoadUrlInfo {
  instanceId?: string;
  memberClass?: string;
  memberCode?: string;
  subsystemCode?: string;
  serviceCode?: string;
  serviceVersion?: string;
  path?: string;
  error?: string;
  warning?: string;
}

function parseXRoadUrl(url: URL): XRoadUrlInfo {
  const segments = url.pathname.split('/').filter((s) => s.length > 0);
  if (segments.length === 0 || segments[0] !== 'r1') {
    return { error: 'URL is not an X-Road REST endpoint (expected /r1/... path)' };
  }
  if (segments.length < 6) {
    return { error: 'X-Road URL is incomplete (missing service identifier segments)' };
  }

  const [, instanceId, memberClass, memberCode, subsystemCode, serviceCode, ...rest] = segments;

  let serviceVersion: string | undefined;
  let pathSegments: string[] = rest;

  if (rest.length > 0 && VERSION_PATTERN.test(rest[0])) {
    serviceVersion = rest[0];
    pathSegments = rest.slice(1);
  }

  const path = '/' + pathSegments.join('/');

  return {
    instanceId,
    memberClass,
    memberCode,
    subsystemCode,
    serviceCode,
    serviceVersion,
    path: path === '/' ? '/' : path,
  };
}

function findHeader(headers: Record<string, string>, lowerName: string): string | undefined {
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lowerName) return v;
  }
  return undefined;
}

/**
 * Normalize line continuations and return a mapping from normalized
 * indices back to original-input indices, so error spans can be
 * reported in the user's original text.
 */
function normalizeAndMap(input: string): { normalized: string; mapToOriginal: number[] } {
  // Replace bash '\<LF>' and windows '^<CRLF>' with a single space.
  // Build mapToOriginal: for each char in normalized, the index of the
  // corresponding char in the original input.
  const map: number[] = [];
  let normalized = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];
    if (ch === '\\' && (next === '\n' || (next === '\r' && input[i + 2] === '\n'))) {
      // Replace with a single space, mapped to the backslash position.
      normalized += ' ';
      map.push(i);
      i += next === '\r' ? 3 : 2;
      continue;
    }
    if (ch === '^' && next === '\r' && input[i + 2] === '\n') {
      normalized += ' ';
      map.push(i);
      i += 3;
      continue;
    }
    if (ch === '^' && next === '\n') {
      normalized += ' ';
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

function mapSpan(span: ErrorSpan, map: number[]): ErrorSpan {
  const start = map[Math.min(span.start, map.length - 1)] ?? span.start;
  // For exclusive end, use the next mapped position if possible.
  const endIdx = Math.min(span.end, map.length - 1);
  const end = map[endIdx] ?? span.end;
  return { start, end };
}

/**
 * Tokenize a normalized curl command. Handles single quotes (literal),
 * double quotes (with backslash escapes), and unquoted words with
 * backslash escapes.
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let hasCurrent = false;
  let tokenStart = 0;
  let quoteOpenIdx = -1;

  const flushToken = (endIdx: number): void => {
    if (hasCurrent) {
      tokens.push({ value: current, start: tokenStart, end: endIdx });
      current = '';
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
      if (ch === '\\' && i + 1 < input.length) {
        const next = input[i + 1];
        if (next === '"' || next === '\\' || next === '$' || next === '`') {
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
    if (ch === '\\' && i + 1 < input.length) {
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
    const err: Error & { span?: ErrorSpan } = new Error('Unterminated quote in cURL command');
    err.span = { start: quoteOpenIdx, end: input.length };
    throw err;
  }
  flushToken(input.length);
  return tokens;
}
