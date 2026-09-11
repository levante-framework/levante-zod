import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import type * as z from 'zod';
import {
  GetUserOverviewErrorSchema,
  GetUserOverviewParamsSchema,
} from './get-user-overview';

/** Arbitrary: a non-object value */
const $nonObject = fc.anything().filter((v) => typeof v !== 'object');

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

describe('GetUserOverviewParamsSchema', () => {
  it('accepts valid props', () => {
    expect(GetUserOverviewParamsSchema.parse({ uid: 'foo' })).toEqual({
      uid: 'foo',
    });
  });

  it('strips unexpected props', () => {
    const result = GetUserOverviewParamsSchema.parse({
      uid: 'foo',
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual({ uid: 'foo' });
  });

  it.prop({ nonObject: $nonObject })(
    'rejects non-object root',
    ({ nonObject }) => {
      const result = GetUserOverviewParamsSchema.safeParse(nonObject);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('object');
      expect(issue.message).toMatch(
        /^Invalid input: expected object, received/,
      );
      expect(issue.path).toEqual([]);
    },
  );

  describe('uid', () => {
    it('rejects missing uid', () => {
      const result = GetUserOverviewParamsSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['uid'],
        },
      ]);
    });

    it.prop({ uid: $nonString })('rejects a non-string uid', ({ uid }) => {
      const result = GetUserOverviewParamsSchema.safeParse({ uid });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('string');
      expect(issue.message).toMatch(
        /^Invalid input: expected string, received/,
      );
      expect(issue.path).toEqual(['uid']);
    });

    it('rejects an empty uid', () => {
      const result = GetUserOverviewParamsSchema.safeParse({ uid: '' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected string to have >=1 characters',
        minimum: 1,
        origin: 'string',
        path: ['uid'],
      });
    });
  });
});

describe('GetUserOverviewErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => GetUserOverviewErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => GetUserOverviewErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('accepts functions/invalid-argument/schema', () => {
    const $code = 'invalid-argument';
    const $message = 'Schema error';
    const $details = {
      code: 'schema',
      issues: [{ path: 'uid', message: 'Must be non-empty' }],
    };
    const err = new FunctionsError($code, $message, $details);
    const result = GetUserOverviewErrorSchema.parse(err);
    expect(result).toEqual({
      name: 'FirebaseError',
      code: `functions/${$code}`,
      message: $message,
      details: $details,
    });
  });

  it('accepts functions/invalid-argument/usertype', () => {
    const $code = 'invalid-argument';
    const $message = 'User is an admin';
    const $details = {
      code: 'usertype',
      uid: 'uid-1',
      userType: 'admin',
    };
    const err = new FunctionsError($code, $message, $details);
    const result = GetUserOverviewErrorSchema.parse(err);
    expect(result).toEqual({
      name: 'FirebaseError',
      code: `functions/${$code}`,
      message: $message,
      details: $details,
    });
  });

  it('accepts functions/not-found/user', () => {
    const $code = 'not-found';
    const $message = 'Not found';
    const $details = {
      code: 'user',
      uid: 'uid-1',
    };
    const err = new FunctionsError($code, $message, $details);
    const result = GetUserOverviewErrorSchema.parse(err);
    expect(result).toEqual({
      name: 'FirebaseError',
      code: `functions/${$code}`,
      message: $message,
      details: $details,
    });
  });
});
