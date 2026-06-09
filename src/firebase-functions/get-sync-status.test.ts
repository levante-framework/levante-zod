import { describe, expect, it } from 'vitest';
import { GetSyncStatusParamsSchema } from './get-sync-status';

describe('GetSyncStatusParamsSchema', () => {
  it('accepts valid props', () => {
    expect(GetSyncStatusParamsSchema.parse({ siteId: 'foo' })).toEqual({
      siteId: 'foo',
    });
  });

  it('strips unexpected props', () => {
    const result = GetSyncStatusParamsSchema.parse({
      siteId: 'foo',
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual({ siteId: 'foo' });
  });

  it('rejects missing siteId', () => {
    const result = GetSyncStatusParamsSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received undefined',
        path: ['siteId'],
      },
    ]);
  });
});
