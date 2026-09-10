import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import type * as z from 'zod';
import {
  UpdateUsersInfoErrorSchema,
  UpdateUsersInfoParamsSchema,
  UserInfoSchema,
} from './update-users-info';

/** Arbitrary: a non-array value */
const $nonArray = fc.anything().filter((v) => !Array.isArray(v));

/** Arbitrary: a non-object value */
const $nonObject = fc.anything().filter((v) => typeof v !== 'object');

/** Fixture: a valid user */
const $validUser = {
  uid: 'u1',
  archived: true,
};

/** Fixture: valid params */
const $validParams = {
  users: [
    { uid: 'u1', archived: true },
    { uid: 'u2', disabled: false },
    { uid: 'u3', archived: true, disabled: true },
  ],
};

describe('UserInfoSchema', () => {
  describe('valid', () => {
    it('accepts a valid user', () => {
      expect(() => UserInfoSchema.parse($validUser)).not.toThrow();
    });

    it('accepts a user with only disabled', () => {
      expect(() =>
        UserInfoSchema.parse({ uid: 'u1', disabled: false }),
      ).not.toThrow();
    });

    it('accepts a user with both fields', () => {
      expect(() =>
        UserInfoSchema.parse({ uid: 'u1', archived: true, disabled: false }),
      ).not.toThrow();
    });

    it('strips unexpected props', () => {
      const result = UserInfoSchema.safeParse({
        ...$validUser,
        unexpected: 'foo',
      });
      expect(result.data).toEqual({ ...$validUser });
    });
  });

  describe('invalid root', () => {
    it.prop({ nonObject: $nonObject })(
      'rejects non-object root',
      ({ nonObject }) => {
        const result = UserInfoSchema.safeParse(nonObject);
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
  });

  describe('invalid uid', () => {
    it('rejects a missing uid', () => {
      const result = UserInfoSchema.safeParse({ archived: true });
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
      const result = UserInfoSchema.safeParse({ uid: '', archived: true });
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

  describe('invalid fields', () => {
    it('rejects a non-boolean archived', () => {
      const result = UserInfoSchema.safeParse({ uid: 'u1', archived: 'yes' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('boolean');
      expect(issue.message).toMatch(
        /^Invalid input: expected boolean, received/,
      );
      expect(issue.path).toEqual(['archived']);
    });

    it('rejects a non-boolean disabled', () => {
      const result = UserInfoSchema.safeParse({ uid: 'u1', disabled: 'no' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('boolean');
      expect(issue.message).toMatch(
        /^Invalid input: expected boolean, received/,
      );
      expect(issue.path).toEqual(['disabled']);
    });
  });

  describe('invalid superRefine', () => {
    it('rejects a user with no fields to update', () => {
      const result = UserInfoSchema.safeParse({ uid: 'u1' });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have at least one field to update',
          path: [],
        },
      ]);
    });
  });
});

describe('UpdateUsersInfoParamsSchema', () => {
  describe('valid', () => {
    it('accepts valid params', () => {
      expect(() =>
        UpdateUsersInfoParamsSchema.parse($validParams),
      ).not.toThrow();
    });

    it('accepts a single user', () => {
      expect(() =>
        UpdateUsersInfoParamsSchema.parse({ users: [$validUser] }),
      ).not.toThrow();
    });

    it('strips unexpected props', () => {
      const result = UpdateUsersInfoParamsSchema.safeParse({
        ...$validParams,
        unexpected: 'foo',
      });
      expect(result.data).toEqual({ ...$validParams });
    });
  });

  describe('invalid root', () => {
    it.prop({ nonObject: $nonObject })(
      'rejects non-object root',
      ({ nonObject }) => {
        const result = UpdateUsersInfoParamsSchema.safeParse(nonObject);
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

    it('rejects a missing users prop', () => {
      const result = UpdateUsersInfoParamsSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('array');
      expect(issue.message).toMatch(/^Invalid input: expected array, received/);
      expect(issue.path).toEqual(['users']);
    });
  });

  describe('invalid users', () => {
    it.prop({ users: $nonArray })('rejects non-array users', ({ users }) => {
      const result = UpdateUsersInfoParamsSchema.safeParse({ users });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('array');
      expect(issue.message).toMatch(/^Invalid input: expected array, received/);
      expect(issue.path).toEqual(['users']);
    });

    it.prop({ user: $nonObject })(
      'rejects non-object users items',
      ({ user }) => {
        const result = UpdateUsersInfoParamsSchema.safeParse({ users: [user] });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('object');
        expect(issue.message).toMatch(
          /^Invalid input: expected object, received/,
        );
        expect(issue.path).toEqual(['users', 0]);
      },
    );
  });

  describe('invalid superRefine', () => {
    it('rejects an empty users array', () => {
      const result = UpdateUsersInfoParamsSchema.safeParse({ users: [] });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected array to have >=1 items',
        minimum: 1,
        origin: 'array',
        path: ['users'],
      });
    });

    it('rejects >1000 users', () => {
      const result = UpdateUsersInfoParamsSchema.safeParse({
        users: Array.from({ length: 1001 }, (_, idx) => ({
          uid: `u${idx}`,
          archived: true,
        })),
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_big',
        inclusive: true,
        maximum: 1000,
        message: 'Too big: expected array to have <=1000 items',
        origin: 'array',
        path: ['users'],
      });
    });

    it('rejects a user with no fields to update', () => {
      const result = UpdateUsersInfoParamsSchema.safeParse({
        users: [{ uid: 'u1' }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have at least one field to update',
          path: ['users', 0],
        },
      ]);
    });

    it('rejects duplicate uids', () => {
      const result = UpdateUsersInfoParamsSchema.safeParse({
        users: [
          { uid: 'dup', archived: true },
          { uid: 'dup', disabled: true },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(2);
      const issues = result.error?.issues as z.core.$ZodIssueCustom[];
      for (const [idx, issue] of issues.entries()) {
        expect(issue.code).toEqual('custom');
        expect(issue.message).toEqual('Must be unique');
        expect(issue.path).toEqual(['users', idx, 'uid']);
      }
    });
  });
});

describe('UpdateUsersInfoErrorSchema', () => {
  describe('invalid-argument', () => {
    const $code = 'invalid-argument';

    it('accepts functions/invalid-argument/schema', () => {
      const $message = 'Schema error';
      const $details = {
        code: 'schema',
        issues: [{ path: 'users[0].uid', message: 'Must be non-empty' }],
      };
      const err = new FunctionsError($code, $message, $details);
      const result = UpdateUsersInfoErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/invalid-argument', () => {
      const err = new FunctionsError($code, 'Foo error');
      const result = UpdateUsersInfoErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });
  });

  describe('not-found', () => {
    const $code = 'not-found';
    const $message = 'Not found';
    const $details = {
      code: 'users',
      uids: ['uid-1', 'uid-2'],
    };

    it('accepts functions/not-found/users', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = UpdateUsersInfoErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/not-found', () => {
      const err = new FunctionsError($code, $message);
      const result = UpdateUsersInfoErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/not-found/foo', () => {
      const err = new FunctionsError($code, $message, {
        code: 'foo',
        uids: ['uid-1'],
      });
      const result = UpdateUsersInfoErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['users'],
        path: ['details', 'code'],
        message: 'Invalid input: expected "users"',
      });
    });
  });

  describe('common error codes', () => {
    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => UpdateUsersInfoErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => UpdateUsersInfoErrorSchema.parse(err)).not.toThrow();
    });
  });
});
