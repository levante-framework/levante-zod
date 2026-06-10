import { describe, expect, it } from 'vitest';
import type * as z from 'zod';
import { ListUsersParamsSchema } from './list-users';

/** Fixture: minimal valid params */
const $valid = { orgType: 'schools' as const, orgId: 'o1' };

describe('ListUsersParamsSchema', () => {
  describe('valid', () => {
    it('accepts minimal valid params', () => {
      expect(() => ListUsersParamsSchema.parse($valid)).not.toThrow();
    });

    it('accepts optional params', () => {
      expect(() =>
        ListUsersParamsSchema.parse({
          ...$valid,
          page: 0,
          pageLimit: 50,
          restrictToActiveUsers: true,
          restrictToEnabledUsers: true,
        }),
      ).not.toThrow();
    });

    it('strips unexpected props', () => {
      const result = ListUsersParamsSchema.safeParse({
        ...$valid,
        unexpected: 'foo',
      });
      expect(result.data).toEqual({ ...$valid });
    });
  });

  describe('invalid', () => {
    it('rejects missing props', () => {
      const result = ListUsersParamsSchema.safeParse({});
      expect(result.success).toBe(false);
      const issues = result.error?.issues as z.core.$ZodIssue[];
      expect(issues.length).toBe(2);
      expect(issues.map((i) => i.path[0]).sort()).toEqual(['orgId', 'orgType']);
    });

    it('rejects an invalid orgType', () => {
      const result = ListUsersParamsSchema.safeParse({
        ...$valid,
        orgType: 'foo',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].path).toEqual(['orgType']);
    });

    it('rejects a non-integer page', () => {
      const result = ListUsersParamsSchema.safeParse({ ...$valid, page: 1.5 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].path).toEqual(['page']);
    });

    it('rejects an empty orgId', () => {
      const result = ListUsersParamsSchema.safeParse({ ...$valid, orgId: '' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].path).toEqual(['orgId']);
    });
  });
});
