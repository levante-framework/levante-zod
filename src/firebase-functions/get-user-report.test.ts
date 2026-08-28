import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import {
  GetUserReportErrorSchema,
  GetUserReportParamsSchema,
} from './get-user-report';

describe('GetUserReportParamsSchema', () => {
  it('accepts valid props with responseSections "all"', () => {
    expect(
      GetUserReportParamsSchema.parse({
        siteId: 'site-1',
        userId: 'user-1',
        responseSections: 'all',
      }),
    ).toEqual({
      siteId: 'site-1',
      userId: 'user-1',
      responseSections: 'all',
    });
  });

  it('accepts valid props with a single response section', () => {
    expect(
      GetUserReportParamsSchema.parse({
        siteId: 'site-1',
        userId: 'user-1',
        responseSections: ['summary'],
      }),
    ).toEqual({
      siteId: 'site-1',
      userId: 'user-1',
      responseSections: ['summary'],
    });
  });

  it('accepts valid props with multiple response sections', () => {
    expect(
      GetUserReportParamsSchema.parse({
        siteId: 'site-1',
        userId: 'user-1',
        responseSections: ['summary', 'percentiles', 'bestPerformances'],
      }),
    ).toEqual({
      siteId: 'site-1',
      userId: 'user-1',
      responseSections: ['summary', 'percentiles', 'bestPerformances'],
    });
  });

  it('strips unexpected props', () => {
    const result = GetUserReportParamsSchema.parse({
      siteId: 'site-1',
      userId: 'user-1',
      responseSections: 'all',
      unexpected: 'bar',
    });
    expect(result).toEqual({
      siteId: 'site-1',
      userId: 'user-1',
      responseSections: 'all',
    });
  });

  describe('siteId', () => {
    it('rejects missing siteId', () => {
      const result = GetUserReportParamsSchema.safeParse({
        userId: 'user-1',
        responseSections: 'all',
      });
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

    it('rejects an empty siteId', () => {
      const result = GetUserReportParamsSchema.safeParse({
        siteId: '   ',
        userId: 'user-1',
        responseSections: 'all',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.code).toBe('too_small');
      expect(result.error?.issues[0]?.path).toEqual(['siteId']);
    });
  });

  describe('userId', () => {
    it('rejects missing userId', () => {
      const result = GetUserReportParamsSchema.safeParse({
        siteId: 'site-1',
        responseSections: 'all',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['userId'],
        },
      ]);
    });

    it('rejects an empty userId', () => {
      const result = GetUserReportParamsSchema.safeParse({
        siteId: 'site-1',
        userId: '',
        responseSections: 'all',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.code).toBe('too_small');
      expect(result.error?.issues[0]?.path).toEqual(['userId']);
    });
  });

  describe('responseSections', () => {
    it('rejects missing responseSections', () => {
      const result = GetUserReportParamsSchema.safeParse({
        siteId: 'site-1',
        userId: 'user-1',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_union',
          errors: [
            [
              {
                code: 'invalid_value',
                values: ['all'],
                message: 'Invalid input: expected "all"',
                path: [],
              },
            ],
            [
              {
                code: 'invalid_type',
                expected: 'array',
                message: 'Invalid input: expected array, received undefined',
                path: [],
              },
            ],
          ],
          message: 'Invalid input',
          path: ['responseSections'],
        },
      ]);
    });

    it('rejects an invalid response section', () => {
      const result = GetUserReportParamsSchema.safeParse({
        siteId: 'site-1',
        userId: 'user-1',
        responseSections: ['summary', 'invalid'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.code).toBe('invalid_union');
      expect(result.error?.issues[0]?.path).toEqual(['responseSections']);
    });

    it('rejects an empty responseSections array', () => {
      const result = GetUserReportParamsSchema.safeParse({
        siteId: 'site-1',
        userId: 'user-1',
        responseSections: [],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have at least one response section',
          path: ['responseSections'],
        },
      ]);
    });

    it('rejects duplicate response sections', () => {
      const result = GetUserReportParamsSchema.safeParse({
        siteId: 'site-1',
        userId: 'user-1',
        responseSections: ['summary', 'summary'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Response sections must be unique',
          path: ['responseSections'],
        },
      ]);
    });
  });
});

describe('GetUserReportErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'siteId', message: 'Required' }],
      });
      expect(() => GetUserReportErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => GetUserReportErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => GetUserReportErrorSchema.parse(err)).not.toThrow();
    });
  });

  describe('not-found', () => {
    it('accepts functions/not-found/site', () => {
      const err = new FunctionsError('not-found', 'Site not found', {
        code: 'site',
        siteId: 'site-1',
      });
      expect(() => GetUserReportErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/not-found/user', () => {
      const err = new FunctionsError('not-found', 'User not found', {
        code: 'user',
        siteId: 'site-1',
        userId: 'user-1',
      });
      expect(() => GetUserReportErrorSchema.parse(err)).not.toThrow();
    });

    it('rejects functions/not-found with an unknown details code', () => {
      const err = new FunctionsError('not-found', 'Not found', {
        code: 'org',
        id: 'foo',
      });
      expect(GetUserReportErrorSchema.safeParse(err).success).toBe(false);
    });
  });
});
