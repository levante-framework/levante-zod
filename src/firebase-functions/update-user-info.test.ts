import { describe, expect, it } from 'vitest';
import type * as z from 'zod';
import { UpdateUserInfoParamsSchema } from './update-user-info';

/** Fixture: valid params */
const $valid = {
  users: [
    { uid: 'u1', archived: true },
    { uid: 'u2', disabled: false },
    { uid: 'u3', archived: true, disabled: true },
  ],
};

describe('UpdateUserInfoParamsSchema', () => {
  describe('valid', () => {
    it('accepts valid params', () => {
      expect(() => UpdateUserInfoParamsSchema.parse($valid)).not.toThrow();
    });

    it('accepts a single edited field', () => {
      expect(() =>
        UpdateUserInfoParamsSchema.parse({
          users: [{ uid: 'u1', archived: true }],
        }),
      ).not.toThrow();
    });

    it('strips unexpected props', () => {
      const result = UpdateUserInfoParamsSchema.safeParse({
        users: [{ uid: 'u1', archived: true, unexpected: 'foo' }],
      });
      expect(result.data).toEqual({ users: [{ uid: 'u1', archived: true }] });
    });
  });

  describe('invalid root', () => {
    it('rejects a missing users prop', () => {
      const result = UpdateUserInfoParamsSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('array');
      expect(issue.path).toEqual(['users']);
    });
  });

  describe('invalid users', () => {
    it('rejects a user with a missing uid', () => {
      const result = UpdateUserInfoParamsSchema.safeParse({
        users: [{ archived: true }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('string');
      expect(issue.path).toEqual(['users', 0, 'uid']);
    });

    it('rejects a user with an empty uid', () => {
      const result = UpdateUserInfoParamsSchema.safeParse({
        users: [{ uid: '', archived: true }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].path).toEqual(['users', 0, 'uid']);
    });

    it('rejects a non-boolean field', () => {
      const result = UpdateUserInfoParamsSchema.safeParse({
        users: [{ uid: 'u1', archived: 'yes' }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('boolean');
      expect(issue.path).toEqual(['users', 0, 'archived']);
    });
  });

  describe('invalid superRefine', () => {
    it('rejects an empty users array', () => {
      const result = UpdateUserInfoParamsSchema.safeParse({ users: [] });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'Must have at least one user',
        path: ['users'],
      });
    });

    it('rejects a user with no edited fields', () => {
      const result = UpdateUserInfoParamsSchema.safeParse({
        users: [{ uid: 'u1' }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'Must provide at least one field to update',
        path: ['users', 0],
      });
    });

    it('rejects duplicate uids', () => {
      const result = UpdateUserInfoParamsSchema.safeParse({
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
