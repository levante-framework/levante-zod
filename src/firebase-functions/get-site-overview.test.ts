import { describe, expect, it } from 'vitest';
import { GetSiteOverviewParamsSchema } from './get-site-overview';

describe('GetSiteOverviewParamsSchema', () => {
  it('accepts valid props', () => {
    expect(GetSiteOverviewParamsSchema.parse({ siteId: 'foo' })).toEqual({
      siteId: 'foo',
    });
  });

  it('strips unexpected props', () => {
    const result = GetSiteOverviewParamsSchema.parse({
      siteId: 'foo',
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual({ siteId: 'foo' });
  });

  it('rejects missing siteId', () => {
    const result = GetSiteOverviewParamsSchema.safeParse({});
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
