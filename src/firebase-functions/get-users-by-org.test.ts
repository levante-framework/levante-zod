import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import {
  GetUsersByOrgErrorSchema,
  GetUsersByOrgParamsSchema,
} from './get-users-by-org';

describe('GetUsersByOrgParamsSchema', () => {
  it('accepts valid props', () => {
    expect(
      GetUsersByOrgParamsSchema.parse({ orgType: 'site', orgId: 'foo' }),
    ).toEqual({ orgType: 'site', orgId: 'foo' });
  });

  it.each(['site', 'school', 'class', 'cohort'] as const)(
    'accepts orgType "%s"',
    (orgType) => {
      expect(
        GetUsersByOrgParamsSchema.parse({ orgType, orgId: 'foo' }),
      ).toEqual({ orgType, orgId: 'foo' });
    },
  );

  it('trims orgId', () => {
    expect(
      GetUsersByOrgParamsSchema.parse({ orgType: 'site', orgId: '  foo  ' }),
    ).toEqual({ orgType: 'site', orgId: 'foo' });
  });

  it('strips unexpected props', () => {
    const result = GetUsersByOrgParamsSchema.parse({
      orgType: 'site',
      orgId: 'foo',
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual({ orgType: 'site', orgId: 'foo' });
  });

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

  describe('functions/not-found', () => {
    it('accepts a valid org not-found error', () => {
      const err = new FunctionsError('not-found', 'Org not found', {
        code: 'org',
        id: 'foo',
        type: 'site',
      });
      expect(() => GetUsersByOrgErrorSchema.parse(err)).not.toThrow();
    });

    it.each(['site', 'school', 'class', 'cohort'] as const)(
      'accepts org type "%s"',
      (type) => {
        const err = new FunctionsError('not-found', 'Org not found', {
          code: 'org',
          id: 'foo',
          type,
        });
        expect(() => GetUsersByOrgErrorSchema.parse(err)).not.toThrow();
      },
    );

    it('rejects an unknown details code', () => {
      const err = new FunctionsError('not-found', 'Org not found', {
        code: 'user',
        id: 'foo',
        type: 'site',
      });
      expect(() => GetUsersByOrgErrorSchema.parse(err)).toThrow();
    });

    it('rejects an invalid org type', () => {
      const err = new FunctionsError('not-found', 'Org not found', {
        code: 'org',
        id: 'foo',
        type: 'district',
      });
      expect(() => GetUsersByOrgErrorSchema.parse(err)).toThrow();
    });
  });
});
