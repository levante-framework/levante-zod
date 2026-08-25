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

  it('accepts all optional props', () => {
    const result = GetUsersByOrgParamsSchema.parse({
      orgType: 'site',
      orgId: 'foo',
      excludeArchived: true,
      excludeDisabled: false,
      page: 2,
      pageLimit: 50,
      orderBy: { field: 'email', direction: 'asc' },
    });
    expect(result).toEqual({
      orgType: 'site',
      orgId: 'foo',
      excludeArchived: true,
      excludeDisabled: false,
      page: 2,
      pageLimit: 50,
      orderBy: { field: 'email', direction: 'asc' },
    });
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

  describe('excludeArchived / excludeDisabled', () => {
    it('rejects a non-boolean excludeArchived', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        excludeArchived: 'true',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          message: 'Invalid input: expected boolean, received string',
          path: ['excludeArchived'],
        },
      ]);
    });

    it('rejects a non-boolean excludeDisabled', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        excludeDisabled: 1,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          message: 'Invalid input: expected boolean, received number',
          path: ['excludeDisabled'],
        },
      ]);
    });
  });

  describe('page', () => {
    it('rejects a negative page', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        page: -1,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected number to be >=0',
          minimum: 0,
          origin: 'number',
          path: ['page'],
        },
      ]);
    });

    it('rejects a non-integer page', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        page: 1.5,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'int',
          format: 'safeint',
          message: 'Invalid input: expected int, received number',
          path: ['page'],
        },
      ]);
    });
  });

  describe('pageLimit', () => {
    it('rejects 0', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        pageLimit: 0,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected number to be >=1',
          minimum: 1,
          origin: 'number',
          path: ['pageLimit'],
        },
      ]);
    });

    it('rejects a non-integer pageLimit', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        pageLimit: 10.5,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'int',
          format: 'safeint',
          message: 'Invalid input: expected int, received number',
          path: ['pageLimit'],
        },
      ]);
    });
  });

  describe('orderBy', () => {
    it.each(['createdAt', 'email', 'userType'] as const)(
      'accepts field "%s"',
      (field) => {
        const result = GetUsersByOrgParamsSchema.safeParse({
          orgType: 'site',
          orgId: 'foo',
          orderBy: { field, direction: 'asc' },
        });
        expect(result.success).toBe(true);
        expect(result.data?.orderBy).toEqual({ field, direction: 'asc' });
      },
    );

    it.each(['asc', 'desc'] as const)('accepts direction "%s"', (direction) => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        orderBy: { field: 'email', direction },
      });
      expect(result.success).toBe(true);
      expect(result.data?.orderBy).toEqual({ field: 'email', direction });
    });

    it('rejects an invalid field', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        orderBy: { field: 'name', direction: 'asc' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_value',
          values: ['createdAt', 'email', 'userType'],
          message:
            'Invalid option: expected one of "createdAt"|"email"|"userType"',
          path: ['orderBy', 'field'],
        },
      ]);
    });

    it('rejects an invalid direction', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        orderBy: { field: 'email', direction: 'ascending' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_value',
          values: ['asc', 'desc'],
          message: 'Invalid option: expected one of "asc"|"desc"',
          path: ['orderBy', 'direction'],
        },
      ]);
    });

    it('rejects a partial orderBy', () => {
      const result = GetUsersByOrgParamsSchema.safeParse({
        orgType: 'site',
        orgId: 'foo',
        orderBy: { field: 'email' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_value',
          values: ['asc', 'desc'],
          message: 'Invalid option: expected one of "asc"|"desc"',
          path: ['orderBy', 'direction'],
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
