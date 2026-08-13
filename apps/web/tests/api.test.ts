import { describe, expect, it } from 'vitest';
import { isApiError } from '@nikhil-portfolio/types';

describe('api response envelope', () => {
  it('identifies error responses', () => {
    expect(isApiError({ error: { code: 'X', message: 'boom' } })).toBe(true);
  });

  it('identifies success responses', () => {
    expect(isApiError({ data: { ok: true } })).toBe(false);
  });
});
