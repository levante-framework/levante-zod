import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import type * as z from 'zod';
import { ListUsersErrorSchema, ListUsersParamsSchema } from './list-users';

/** Fixture: minimal valid params */
const $valid = { orgType: 'school' as const, orgId: 'o1' };

/** Fixture: the default orderBy applied when none is provided */
const $defaultOrderBy = { field: 'createdAt', direction: 'desc' };

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
          orderBy: { field: 'email', direction: 'asc' },
          excludeArchived: true,
          excludeDisabled: true,
        }),
      ).not.toThrow();
    });

    it('defaults orderBy to createdAt (newest first)', () => {
      const result = ListUsersParamsSchema.parse($valid);
      expect(result.orderBy).toEqual($defaultOrderBy);
    });

    it('keeps a provided orderBy', () => {
      const orderBy = { field: 'email', direction: 'asc' as const };
      const result = ListUsersParamsSchema.parse({ ...$valid, orderBy });
      expect(result.orderBy).toEqual(orderBy);
    });

    it('strips unexpected props', () => {
      const result = ListUsersParamsSchema.safeParse({
        ...$valid,
        unexpected: 'foo',
      });
      expect(result.data).toEqual({ ...$valid, orderBy: $defaultOrderBy });
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

    it('rejects an invalid orderBy field', () => {
      const result = ListUsersParamsSchema.safeParse({
        ...$valid,
        orderBy: { field: 'username', direction: 'asc' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].path).toEqual(['orderBy', 'field']);
    });

    it('rejects an invalid orderBy direction', () => {
      const result = ListUsersParamsSchema.safeParse({
        ...$valid,
        orderBy: { field: 'createdAt', direction: 'sideways' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].path).toEqual(['orderBy', 'direction']);
    });
  });
});

describe('ListUsersErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'users[0].uid', message: 'Must be non-empty' }],
      });
      expect(() => ListUsersErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => ListUsersErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => ListUsersErrorSchema.parse(err)).not.toThrow();
    });
  });
});
