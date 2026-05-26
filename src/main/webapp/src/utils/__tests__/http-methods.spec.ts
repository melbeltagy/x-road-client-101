import { describe, it, expect } from 'vitest';
import {
  HTTP_METHODS,
  BODY_METHODS,
  methodAllowsBody,
  METHOD_COLORS,
  methodColor,
} from '../http-methods';

describe('HTTP_METHODS', () => {
  it('includes the five supported X-Road REST methods', () => {
    expect([...HTTP_METHODS]).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
  });
});

describe('BODY_METHODS', () => {
  it('lists only the verbs that carry a request body', () => {
    expect([...BODY_METHODS]).toEqual(['POST', 'PUT', 'PATCH']);
  });
});

describe('methodAllowsBody', () => {
  it.each(['POST', 'PUT', 'PATCH'])('returns true for %s', (m) => {
    expect(methodAllowsBody(m)).toBe(true);
  });

  it.each(['GET', 'DELETE'])('returns false for %s', (m) => {
    expect(methodAllowsBody(m)).toBe(false);
  });

  it('returns false for an unrecognized verb', () => {
    expect(methodAllowsBody('HEAD')).toBe(false);
    expect(methodAllowsBody('')).toBe(false);
  });
});

describe('METHOD_COLORS', () => {
  it('has a Vuetify color for every supported method', () => {
    expect(METHOD_COLORS).toEqual({
      GET: 'success',
      POST: 'primary',
      PUT: 'warning',
      DELETE: 'error',
      PATCH: 'secondary',
    });
  });
});

describe('methodColor', () => {
  it('returns the mapped color for known methods', () => {
    expect(methodColor('GET')).toBe('success');
    expect(methodColor('POST')).toBe('primary');
    expect(methodColor('DELETE')).toBe('error');
  });

  it('returns secondary for unknown methods', () => {
    expect(methodColor('HEAD')).toBe('secondary');
    expect(methodColor('OPTIONS')).toBe('secondary');
  });

  it('returns secondary for empty/undefined input', () => {
    expect(methodColor(undefined)).toBe('secondary');
    expect(methodColor('')).toBe('secondary');
  });
});
