import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import {
  GetUsersByOrgErrorSchema,
  GetUsersByOrgParamsSchema,
} from './get-users-by-org';

describe('GetUsersByOrgParamsSchema', () => {
  it.each(['site', 'school', 'class', 'cohort'] as const)(
    'accepts valid props w/ orgType "%s"',
    (orgType) => {
      expect(
        GetUsersByOrgParamsSchema.parse({ orgType, orgId: 'foo' }),
      ).toEqual({ orgType, orgId: 'foo' });
    },
  );

  it('strips unexpected props', () => {
    const result = GetUsersByOrgParamsSchema.parse({
      orgType: 'site',
      orgId: 'foo',
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual({ orgType: 'site', orgId: 'foo' });
  });

  describe('orgType', () => {
    it('rejects an invalid orgType', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'district',
        orgId: 'foo',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_value',
          values: ['site', 'school', 'class', 'cohort'],
          message:
            'Invalid option: expected one of "site"|"school"|"class"|"cohort"',
          path: ['orgType'],
        },
      ]);
    });

    it('rejects missing orgType', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({ orgId: 'foo' });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_value',
          values: ['site', 'school', 'class', 'cohort'],
          message:
            'Invalid option: expected one of "site"|"school"|"class"|"cohort"',
          path: ['orgType'],
        },
      ]);
    });
  });

  describe('orgId', () => {
    it('rejects missing orgId', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({ orgType: 'site' });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['orgId'],
        },
      ]);
    });

    it('rejects an empty orgId', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['orgId'],
        },
      ]);
    });
  });
});

describe('GetUsersByOrgErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'orgId', message: 'Required' }],
      });
      expect(() => GetUsersByOrgErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => GetUsersByOrgErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => GetUsersByOrgErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('accepts functions/internal/org-site-missing error', () => {
    const err = new FunctionsError('internal', 'Org site missing', {
      code: 'org-site-missing',
      orgType: 'school',
      orgId: 'foo',
      siteId: 'bar',
    });
    expect(() => GetUsersByOrgErrorSchema.parse(err)).not.toThrow();
  });

  it('accepts functions/not-found/org error', () => {
    const err = new FunctionsError('not-found', 'Org not found', {
      code: 'org',
      id: 'foo',
      type: 'site',
    });
    expect(() => GetUsersByOrgErrorSchema.parse(err)).not.toThrow();
  });
});
