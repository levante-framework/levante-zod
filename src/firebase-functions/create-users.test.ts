import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import type * as z from 'zod';
import { CHILD_YEAR_MAX, CHILD_YEAR_MIN } from '../csv/user-csv';
import {
  CaregiverUserSchema,
  ChildUserSchema,
  CreateUsersErrorSchema,
  CreateUsersParamsSchema,
  TeacherUserSchema,
  UserBaseSchema,
  UserSchema,
} from './create-users';

/** Arbitrary: a non-array value */
const $nonArray = fc.anything().filter((v) => !Array.isArray(v));

/** Arbitrary: a non-object value */
const $nonObject = fc.anything().filter((v) => typeof v !== 'object');

/** Fixture: a valid user base */
const $validBase = {
  id: 'u1',
  orgIds: { schools: ['s1'], classes: ['c1'], cohorts: [] },
};

/** Fixture: a valid child user */
const $validChild = {
  id: 'u1',
  userType: 'child' as const,
  month: 6,
  year: CHILD_YEAR_MIN + 1,
  orgIds: { schools: ['s1'], classes: ['c1'], cohorts: [] },
};

/** Fixture: a valid caregiver user */
const $validCaregiver = {
  id: 'u2',
  userType: 'caregiver' as const,
  orgIds: { schools: ['s1'], classes: ['c1'], cohorts: [] },
};

/** Fixture: a valid teacher user */
const $validTeacher = {
  id: 'u3',
  userType: 'teacher' as const,
  orgIds: { schools: [], classes: [], cohorts: ['co1'] },
};

/** Fixture: a valid params */
const $validParams = {
  siteId: 's1',
  users: [$validChild, $validCaregiver, $validTeacher],
};

describe('UserBaseSchema', () => {
  describe('valid', () => {
    it('accepts valid props w/ school+class (no cohort)', () => {
      expect(() => UserBaseSchema.parse($validBase)).not.toThrow();
    });

    it('accepts valid props w/ cohort (no school+class)', () => {
      expect(() =>
        UserBaseSchema.parse({
          ...$validBase,
          orgIds: { schools: [], classes: [], cohorts: ['co1'] },
        }),
      ).not.toThrow();
    });

    it('strips unexpected props', () => {
      const result = UserBaseSchema.safeParse({
        ...$validBase,
        unexpected: 'foo',
      });
      expect(result.data).toEqual({ ...$validBase });
    });
  });

  describe('invalid root', () => {
    it.prop({ nonObject: $nonObject })(
      'rejects non-object root',
      ({ nonObject }) => {
        const result = UserBaseSchema.safeParse(nonObject);
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

    it('rejects missing props', () => {
      const result = UserBaseSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(2);
      const issues = result.error?.issues as z.core.$ZodIssueInvalidType[];
      for (const [idx, [expected, path]] of [
        ['string', 'id'],
        ['object', 'orgIds'],
      ].entries()) {
        const issue = issues[idx];
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual(expected);
        expect(issue.message).toMatch(
          new RegExp(`^Invalid input: expected ${expected}, received`),
        );
        expect(issue.path).toEqual([path]);
      }
    });
  });

  describe('invalid orgIds', () => {
    it.prop({ orgIds: $nonObject })(
      'rejects non-object orgIds',
      ({ orgIds }) => {
        const result = UserBaseSchema.safeParse({
          ...$validBase,
          orgIds,
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('object');
        expect(issue.message).toMatch(
          /^Invalid input: expected object, received/,
        );
        expect(issue.path).toEqual(['orgIds']);
      },
    );

    it.prop({ schools: $nonArray, classes: $nonArray, cohorts: $nonArray })(
      'rejects non-array orgIds.schools, orgIds.classes, orgIds.cohorts',
      ({ schools, classes, cohorts }) => {
        const result = UserBaseSchema.safeParse({
          ...$validBase,
          orgIds: {
            schools,
            classes,
            cohorts,
          },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(3);
        const paths = ['schools', 'classes', 'cohorts'];
        for (let i = 0; i < 3; i++) {
          const issue = result.error?.issues[i] as z.core.$ZodIssueInvalidType;
          expect(issue.code).toEqual('invalid_type');
          expect(issue.expected).toEqual('array');
          expect(issue.message).toMatch(
            /^Invalid input: expected array, received/,
          );
          expect(issue.path).toEqual(['orgIds', paths[i]]);
        }
      },
    );

    it('rejects missing orgIds sub-fields', () => {
      const result = UserBaseSchema.safeParse({ ...$validBase, orgIds: {} });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(3);
      const paths = ['schools', 'classes', 'cohorts'];
      for (const [i, path] of paths.entries()) {
        const issue = result.error?.issues[i] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('array');
        expect(issue.message).toMatch(
          /^Invalid input: expected array, received/,
        );
        expect(issue.path).toEqual(['orgIds', path]);
      }
    });
  });

  describe('invalid superRefine', () => {
    it('rejects a user with neither schools/classes nor cohorts', () => {
      const result = UserBaseSchema.safeParse({
        ...$validBase,
        orgIds: { schools: [], classes: [], cohorts: [] },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have either schools and classes OR cohorts',
          path: ['orgIds'],
        },
      ]);
    });

    it('rejects a user with both schools/classes and cohorts', () => {
      const result = UserBaseSchema.safeParse({
        ...$validBase,
        orgIds: { schools: ['s1'], classes: ['c1'], cohorts: ['co1'] },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have either schools and classes OR cohorts',
          path: ['orgIds'],
        },
      ]);
    });

    it('rejects a user with schools but no classes', () => {
      const result = UserBaseSchema.safeParse({
        ...$validBase,
        orgIds: { schools: ['s1'], classes: [], cohorts: [] },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have either schools and classes OR cohorts',
          path: ['orgIds'],
        },
      ]);
    });

    it('rejects a user with classes but no schools', () => {
      const result = UserBaseSchema.safeParse({
        ...$validBase,
        orgIds: { schools: [], classes: ['c1'], cohorts: [] },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have either schools and classes OR cohorts',
          path: ['orgIds'],
        },
      ]);
    });
  });
});

describe('ChildUserSchema', () => {
  describe('valid', () => {
    it('accepts a valid child', () => {
      expect(() => ChildUserSchema.parse($validChild)).not.toThrow();
    });

    it.prop({ month: fc.integer({ min: 1, max: 12 }) })(
      'accepts valid months (1-12)',
      ({ month }) => {
        expect(() =>
          ChildUserSchema.parse({ ...$validChild, month }),
        ).not.toThrow();
      },
    );

    it.prop({
      year: fc.integer({ min: CHILD_YEAR_MIN, max: CHILD_YEAR_MAX }),
    })('accepts valid years (CHILD_YEAR_MIN-CHILD_YEAR_MAX)', ({ year }) => {
      expect(() =>
        ChildUserSchema.parse({ ...$validChild, year }),
      ).not.toThrow();
    });
  });

  describe('invalid userType', () => {
    it('rejects missing userType', () => {
      const { userType: _, ...rest } = $validChild;
      const result = ChildUserSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        message: 'Invalid input: expected "child"',
        path: ['userType'],
        values: ['child'],
      });
    });

    it('rejects non-child userType', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        userType: 'foo',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        message: 'Invalid input: expected "child"',
        path: ['userType'],
        values: ['child'],
      });
    });
  });

  describe('invalid month', () => {
    it('rejects missing month', () => {
      const { month: _, ...rest } = $validChild;
      const result = ChildUserSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('number');
      expect(issue.message).toMatch(
        /^Invalid input: expected number, received/,
      );
      expect(issue.path).toEqual(['month']);
    });

    it('rejects month below 1', () => {
      const result = ChildUserSchema.safeParse({ ...$validChild, month: 0 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected number to be >=1',
        minimum: 1,
        origin: 'number',
        path: ['month'],
      });
    });

    it('rejects month above 12', () => {
      const result = ChildUserSchema.safeParse({ ...$validChild, month: 13 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_big',
        inclusive: true,
        message: 'Too big: expected number to be <=12',
        maximum: 12,
        origin: 'number',
        path: ['month'],
      });
    });

    it('rejects a non-integer month', () => {
      const result = ChildUserSchema.safeParse({ ...$validChild, month: 1.5 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'int',
        format: 'safeint',
        message: 'Invalid input: expected int, received number',
        path: ['month'],
      });
    });
  });

  describe('invalid year', () => {
    it('rejects missing year', () => {
      const { year: _, ...rest } = $validChild;
      const result = ChildUserSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'number',
        message: 'Invalid input: expected number, received undefined',
        path: ['year'],
      });
    });

    it('rejects year below CHILD_YEAR_MIN', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        year: CHILD_YEAR_MIN - 1,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: `Too small: expected number to be >=${CHILD_YEAR_MIN}`,
        minimum: CHILD_YEAR_MIN,
        origin: 'number',
        path: ['year'],
      });
    });

    it('rejects year above CHILD_YEAR_MAX', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        year: CHILD_YEAR_MAX + 1,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_big',
        inclusive: true,
        message: `Too big: expected number to be <=${CHILD_YEAR_MAX}`,
        maximum: CHILD_YEAR_MAX,
        origin: 'number',
        path: ['year'],
      });
    });

    it('rejects a non-integer year', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        year: 2020.5,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'int',
        format: 'safeint',
        message: 'Invalid input: expected int, received number',
        path: ['year'],
      });
    });
  });

  describe('invalid superRefine', () => {
    it('rejects multiple schools', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        orgIds: { schools: ['s1', 's2'], classes: ['c1'], cohorts: [] },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'Must have only one group',
        path: ['orgIds'],
      });
    });

    it('rejects multiple classes', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        orgIds: { schools: ['s1'], classes: ['c1', 'c2'], cohorts: [] },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'Must have only one group',
        path: ['orgIds'],
      });
    });

    it('rejects multiple cohorts', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        orgIds: { schools: [], classes: [], cohorts: ['co1', 'co2'] },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'Must have only one group',
        path: ['orgIds'],
      });
    });
  });
});

describe('CaregiverUserSchema', () => {
  describe('valid', () => {
    it('accepts a valid caregiver', () => {
      expect(() => CaregiverUserSchema.parse($validCaregiver)).not.toThrow();
    });
  });
});

describe('TeacherUserSchema', () => {
  describe('valid', () => {
    it('accepts a valid teacher', () => {
      expect(() => TeacherUserSchema.parse($validTeacher)).not.toThrow();
    });
  });
});

describe('UserSchema', () => {
  describe('valid', () => {
    it('accepts a valid child', () => {
      expect(() => UserSchema.parse($validChild)).not.toThrow();
    });

    it('accepts a valid caregiver', () => {
      expect(() => UserSchema.parse($validCaregiver)).not.toThrow();
    });

    it('accepts a valid teacher', () => {
      expect(() => UserSchema.parse($validTeacher)).not.toThrow();
    });
  });

  describe('invalid userType', () => {
    it('rejects an unknown userType', () => {
      const result = UserSchema.safeParse({
        ...$validChild,
        userType: 'admin',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_union',
          errors: [],
          note: 'No matching discriminator',
          discriminator: 'userType',
          path: ['userType'],
          message: 'Invalid input',
        },
      ]);
    });

    it('rejects a missing userType', () => {
      const { userType: _, ...rest } = $validChild;
      const result = UserSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_union',
          errors: [],
          note: 'No matching discriminator',
          discriminator: 'userType',
          path: ['userType'],
          message: 'Invalid input',
        },
      ]);
    });
  });

  describe('invalid superRefine (inherited)', () => {
    it('rejects a user with no org group', () => {
      const result = UserSchema.safeParse({
        ...$validChild,
        orgIds: { schools: [], classes: [], cohorts: [] },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have either schools and classes OR cohorts',
          path: ['orgIds'],
        },
      ]);
    });
  });
});

describe('CreateUsersParamsSchema', () => {
  describe('valid', () => {
    it('accepts a valid params', () => {
      expect(() => CreateUsersParamsSchema.parse($validParams)).not.toThrow();
    });

    it('strips unexpected props', () => {
      const result = CreateUsersParamsSchema.safeParse({
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
        const result = CreateUsersParamsSchema.safeParse(nonObject);
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

    it('rejects missing props', () => {
      const result = CreateUsersParamsSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(2);
      const issues = result.error?.issues as z.core.$ZodIssueInvalidType[];
      for (const [idx, [expected, path]] of [
        ['string', 'siteId'],
        ['array', 'users'],
      ].entries()) {
        const issue = issues[idx];
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual(expected);
        expect(issue.message).toMatch(
          new RegExp(`^Invalid input: expected ${expected}, received`),
        );
        expect(issue.path).toEqual([path]);
      }
    });
  });

  describe('invalid users', () => {
    it('rejects >1000 users', () => {
      const result = CreateUsersParamsSchema.safeParse({
        ...$validParams,
        users: Array.from({ length: 1001 }, (_, idx) => ({
          ...$validChild,
          id: `u${idx}`,
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

    it.prop({ users: $nonArray })('rejects non-array users', ({ users }) => {
      const result = CreateUsersParamsSchema.safeParse({
        ...$validParams,
        users,
      });
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
        const result = CreateUsersParamsSchema.safeParse({
          ...$validParams,
          users: [user],
        });
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
    it('rejects empty users array', () => {
      const result = CreateUsersParamsSchema.safeParse({
        ...$validParams,
        users: [],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'Must have at least one user',
        path: ['users'],
      });
    });

    it('rejects duplicate users', () => {
      const result = CreateUsersParamsSchema.safeParse({
        ...$validParams,
        users: [$validChild, $validChild],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(2);
      const issues = result.error?.issues as z.core.$ZodIssueCustom[];
      for (const [idx, issue] of issues.entries()) {
        expect(issue.code).toEqual('custom');
        expect(issue.message).toEqual('Must be unique');
        expect(issue.path).toEqual([idx, 'id']);
      }
    });
  });
});

describe('CreateUsersErrorSchema', () => {
  describe('already-exists', () => {
    const $code = 'already-exists';
    const $message = 'User already exists';
    const $details = {
      code: 'users',
      ids: ['u1'],
    };

    it('accepts functions/already-exists/users', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = CreateUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/already-exists', () => {
      const err = new FunctionsError($code, $message);
      const result = CreateUsersErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/already-exists/foo', () => {
      const err = new FunctionsError($code, $message, {
        code: 'foo',
        ids: ['f1'],
      });
      const result = CreateUsersErrorSchema.safeParse(err);
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

  describe('failed-precondition', () => {
    const $code = 'failed-precondition';
    const $message = 'Sync pending';
    const $details = {
      code: 'sync-pending',
    };

    it('accepts functions/failed-precondition/sync-pending', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = CreateUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        message: $message,
        code: `functions/${$code}`,
        details: $details,
      });
    });

    it('rejects bare functions/failed-precondition', () => {
      const err = new FunctionsError($code, $message);
      const result = CreateUsersErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/failed-precondition/foo', () => {
      const err = new FunctionsError($code, $message, {
        code: 'foo',
      });
      const result = CreateUsersErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['sync-pending'],
        path: ['details', 'code'],
        message: 'Invalid input: expected "sync-pending"',
      });
    });
  });

  describe('invalid-argument', () => {
    const $code = 'invalid-argument';

    it('accepts functions/invalid-argument/schema', () => {
      const $message = 'Schema error';
      const $details = {
        code: 'schema',
        issues: [
          { path: 'users[0].firstName', message: 'Required' },
          { path: 'users[1].grade', message: 'Invalid value' },
        ],
      };
      const err = new FunctionsError($code, $message, $details);
      const result = CreateUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('accepts functions/invalid-argument/org-site-mismatch', () => {
      const $message = 'Org-site mismatch';
      const $details = {
        code: 'org-site-mismatch',
        siteId: 'site-1',
        orgIds: { schools: ['s1'], classes: ['c1'], cohorts: ['co1'] },
      };
      const err = new FunctionsError($code, $message, $details);
      const result = CreateUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/invalid-argument', () => {
      const err = new FunctionsError($code, 'Foo error');
      const result = CreateUsersErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/invalid-argument/foo', () => {
      const err = new FunctionsError($code, 'Foo error', {
        code: 'foo',
      });
      const result = CreateUsersErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_union',
        errors: [],
        note: 'No matching discriminator',
        discriminator: 'code',
        path: ['details', 'code'],
        message: 'Invalid input',
      });
    });
  });

  describe('not-found', () => {
    const $code = 'not-found';
    const $message = 'Not found';
    const $details = {
      code: 'orgs',
      orgIds: { schools: ['s1'], classes: ['c1'], cohorts: ['co1'] },
    };

    it('accepts functions/not-found/orgs', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = CreateUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/not-found', () => {
      const err = new FunctionsError($code, $message);
      const result = CreateUsersErrorSchema.safeParse(err);
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
        orgIds: { schools: ['s1'], classes: ['c1'], cohorts: ['co1'] },
      });
      const result = CreateUsersErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['orgs'],
        path: ['details', 'code'],
        message: 'Invalid input: expected "orgs"',
      });
    });
  });

  describe('common error codes', () => {
    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => CreateUsersErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => CreateUsersErrorSchema.parse(err)).not.toThrow();
    });
  });
});
