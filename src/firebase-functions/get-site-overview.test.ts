import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import {
  GetSiteOverviewErrorSchema,
  GetSiteOverviewParamsSchema,
} from './get-site-overview';

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

describe('GetSiteOverviewErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'users[0].firstName', message: 'Required' }],
      });
      expect(() => GetSiteOverviewErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => GetSiteOverviewErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => GetSiteOverviewErrorSchema.parse(err)).not.toThrow();
    });
  });
});
