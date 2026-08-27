import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import type * as z from 'zod';
import {
  CaregiverUserSchema,
  ChildUserSchema,
  LinkUsersErrorSchema,
  LinkUsersParamsSchema,
  TeacherUserSchema,
  UserBaseSchema,
  UserSchema,
} from './link-users';

/** Arbitrary: a non-array value */
const $nonArray = fc.anything().filter((v) => !Array.isArray(v));

/** Arbitrary: a non-object value */
const $nonObject = fc.anything().filter((v) => typeof v !== 'object');

/** Fixture: a valid user base */
const $validBase = {
  id: 'u1',
  uid: 'uid-1',
};

/** Fixture: a valid caregiver user */
const $validCaregiver = {
  id: 'u1',
  uid: 'uid-1',
  userType: 'caregiver' as const,
};

/** Fixture: a valid child user */
const $validChild = {
  id: 'u2',
  uid: 'uid-2',
  userType: 'child' as const,
  caregiverId: ['u1'],
  teacherId: ['u3'],
};

/** Fixture: a valid teacher user */
const $validTeacher = {
  id: 'u3',
  uid: 'uid-3',
  userType: 'teacher' as const,
};

/** Fixture: a valid params */
const $validParams = {
  siteId: 's1',
  users: [$validChild, $validCaregiver, $validTeacher],
};

describe('UserBaseSchema', () => {
  describe('valid', () => {
    it('accepts valid props', () => {
      expect(() => UserBaseSchema.parse($validBase)).not.toThrow();
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
      for (const [idx, path] of ['id', 'uid'].entries()) {
        const issue = issues[idx];
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('string');
        expect(issue.message).toMatch(
          /^Invalid input: expected string, received/,
        );
        expect(issue.path).toEqual([path]);
      }
    });

    it('rejects an empty id', () => {
      const result = UserBaseSchema.safeParse({ ...$validBase, id: '' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected string to have >=1 characters',
        minimum: 1,
        origin: 'string',
        path: ['id'],
      });
    });

    it('rejects an empty uid', () => {
      const result = UserBaseSchema.safeParse({ ...$validBase, uid: '' });
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

describe('CaregiverUserSchema', () => {
  describe('valid', () => {
    it('accepts a valid caregiver', () => {
      expect(() => CaregiverUserSchema.parse($validCaregiver)).not.toThrow();
    });
  });

  describe('invalid userType', () => {
    it('rejects a missing userType', () => {
      const { userType: _, ...rest } = $validCaregiver;
      const result = CaregiverUserSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        message: 'Invalid input: expected "caregiver"',
        path: ['userType'],
        values: ['caregiver'],
      });
    });

    it('rejects a non-caregiver userType', () => {
      const result = CaregiverUserSchema.safeParse({
        ...$validCaregiver,
        userType: 'foo',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        message: 'Invalid input: expected "caregiver"',
        path: ['userType'],
        values: ['caregiver'],
      });
    });
  });
});

describe('TeacherUserSchema', () => {
  describe('valid', () => {
    it('accepts a valid teacher', () => {
      expect(() => TeacherUserSchema.parse($validTeacher)).not.toThrow();
    });
  });

  describe('invalid userType', () => {
    it('rejects a missing userType', () => {
      const { userType: _, ...rest } = $validTeacher;
      const result = TeacherUserSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        message: 'Invalid input: expected "teacher"',
        path: ['userType'],
        values: ['teacher'],
      });
    });

    it('rejects a non-teacher userType', () => {
      const result = TeacherUserSchema.safeParse({
        ...$validTeacher,
        userType: 'foo',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        message: 'Invalid input: expected "teacher"',
        path: ['userType'],
        values: ['teacher'],
      });
    });
  });
});

describe('ChildUserSchema', () => {
  describe('valid', () => {
    it('accepts a valid child', () => {
      expect(() => ChildUserSchema.parse($validChild)).not.toThrow();
    });

    it('accepts a child with only caregiverId', () => {
      expect(() =>
        ChildUserSchema.parse({ ...$validChild, teacherId: [] }),
      ).not.toThrow();
    });

    it('accepts a child with only teacherId', () => {
      expect(() =>
        ChildUserSchema.parse({ ...$validChild, caregiverId: [] }),
      ).not.toThrow();
    });
  });

  describe('invalid userType', () => {
    it('rejects a non-child userType', () => {
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

  describe('invalid caregiverId', () => {
    it.prop({ caregiverId: $nonArray })(
      'rejects a non-array caregiverId',
      ({ caregiverId }) => {
        const result = ChildUserSchema.safeParse({
          ...$validChild,
          caregiverId,
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('array');
        expect(issue.message).toMatch(
          /^Invalid input: expected array, received/,
        );
        expect(issue.path).toEqual(['caregiverId']);
      },
    );

    it('rejects an empty-string caregiverId element', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        caregiverId: [''],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected string to have >=1 characters',
        minimum: 1,
        origin: 'string',
        path: ['caregiverId', 0],
      });
    });
  });

  describe('invalid teacherId', () => {
    it.prop({ teacherId: $nonArray })(
      'rejects a non-array teacherId',
      ({ teacherId }) => {
        const result = ChildUserSchema.safeParse({
          ...$validChild,
          teacherId,
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('array');
        expect(issue.message).toMatch(
          /^Invalid input: expected array, received/,
        );
        expect(issue.path).toEqual(['teacherId']);
      },
    );

    it('rejects an empty-string teacherId element', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        teacherId: [''],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected string to have >=1 characters',
        minimum: 1,
        origin: 'string',
        path: ['teacherId', 0],
      });
    });
  });

  describe('invalid superRefine', () => {
    it('rejects a child with no caregiverId or teacherId', () => {
      const result = ChildUserSchema.safeParse({
        ...$validChild,
        caregiverId: [],
        teacherId: [],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must have at least one caregiverId or teacherId',
          path: ['caregiverId|teacherId'],
        },
      ]);
    });
  });
});

describe('UserSchema', () => {
  describe('valid', () => {
    it('accepts a valid caregiver', () => {
      expect(() => UserSchema.parse($validCaregiver)).not.toThrow();
    });

    it('accepts a valid child', () => {
      expect(() => UserSchema.parse($validChild)).not.toThrow();
    });

    it('accepts a valid teacher', () => {
      expect(() => UserSchema.parse($validTeacher)).not.toThrow();
    });
  });

  describe('invalid userType', () => {
    it('rejects an unknown userType', () => {
      const result = UserSchema.safeParse({
        ...$validCaregiver,
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
      const { userType: _, ...rest } = $validCaregiver;
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
});

describe('LinkUsersParamsSchema', () => {
  describe('valid', () => {
    it('accepts a valid params', () => {
      expect(() => LinkUsersParamsSchema.parse($validParams)).not.toThrow();
    });

    it('strips unexpected props', () => {
      const result = LinkUsersParamsSchema.safeParse({
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
        const result = LinkUsersParamsSchema.safeParse(nonObject);
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
      const result = LinkUsersParamsSchema.safeParse({});
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
    it.prop({ users: $nonArray })('rejects non-array users', ({ users }) => {
      const result = LinkUsersParamsSchema.safeParse({
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
        const result = LinkUsersParamsSchema.safeParse({
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
      const result = LinkUsersParamsSchema.safeParse({
        ...$validParams,
        users: [],
      });
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
      const result = LinkUsersParamsSchema.safeParse({
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

    it('rejects duplicate users', () => {
      const result = LinkUsersParamsSchema.safeParse({
        ...$validParams,
        users: [$validChild, $validChild, $validCaregiver, $validTeacher],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(2);
      const issues = result.error?.issues as z.core.$ZodIssueCustom[];
      for (const [idx, issue] of issues.entries()) {
        expect(issue.code).toEqual('custom');
        expect(issue.message).toEqual('Must be unique');
        expect(issue.path).toEqual(['users', idx, 'id']);
      }
    });

    it('does not flag empty ids as duplicates (only the upstream required issue)', () => {
      const result = LinkUsersParamsSchema.safeParse({
        ...$validParams,
        users: [
          { ...$validCaregiver, id: '' },
          { ...$validTeacher, id: '' },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['users', 0, 'id'],
        },
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['users', 1, 'id'],
        },
      ]);
    });
  });

  describe('hasResolvableLinks', () => {
    it('accepts a child whose links resolve to caregiver/teacher users', () => {
      expect(() => LinkUsersParamsSchema.parse($validParams)).not.toThrow();
    });

    it('accepts a child referencing multiple caregivers/teachers', () => {
      expect(() =>
        LinkUsersParamsSchema.parse({
          ...$validParams,
          users: [
            { ...$validCaregiver, id: 'caregiver-1' },
            { ...$validCaregiver, id: 'caregiver-2' },
            { ...$validTeacher, id: 'teacher-1' },
            {
              ...$validChild,
              id: 'child-1',
              caregiverId: ['caregiver-1', 'caregiver-2'],
              teacherId: ['teacher-1'],
            },
          ],
        }),
      ).not.toThrow();
    });

    it('accepts a child with only caregiverId', () => {
      expect(() =>
        LinkUsersParamsSchema.parse({
          ...$validParams,
          users: [$validCaregiver, { ...$validChild, teacherId: [] }],
        }),
      ).not.toThrow();
    });

    it('rejects a child referencing a non-existent caregiverId', () => {
      const result = LinkUsersParamsSchema.safeParse({
        ...$validParams,
        users: [
          $validCaregiver,
          { ...$validChild, caregiverId: ['missing'], teacherId: [] },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].code).toEqual('custom');
      expect(result.error?.issues[0].message).toEqual(
        'Must match the id of a caregiver user',
      );
      expect(result.error?.issues[0].path).toEqual(['users', 1, 'caregiverId']);
    });

    it('rejects a child referencing a non-existent teacherId', () => {
      const result = LinkUsersParamsSchema.safeParse({
        ...$validParams,
        users: [
          $validTeacher,
          { ...$validChild, caregiverId: [], teacherId: ['missing'] },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].code).toEqual('custom');
      expect(result.error?.issues[0].message).toEqual(
        'Must match the id of a teacher user',
      );
      expect(result.error?.issues[0].path).toEqual(['users', 1, 'teacherId']);
    });

    it('does not resolve a caregiverId against a teacher user (and vice versa)', () => {
      const result = LinkUsersParamsSchema.safeParse({
        ...$validParams,
        users: [
          $validTeacher,
          $validCaregiver,
          {
            ...$validChild,
            caregiverId: [$validTeacher.id],
            teacherId: [$validCaregiver.id],
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(2);
      const issues = result.error?.issues as z.core.$ZodIssueCustom[];
      expect(issues[0].code).toEqual('custom');
      expect(issues[0].message).toEqual(
        'Must match the id of a caregiver user',
      );
      expect(issues[0].path).toEqual(['users', 2, 'caregiverId']);
      expect(issues[1].code).toEqual('custom');
      expect(issues[1].message).toEqual('Must match the id of a teacher user');
      expect(issues[1].path).toEqual(['users', 2, 'teacherId']);
    });

    it('emits one issue per field regardless of how many refs are unresolved', () => {
      const result = LinkUsersParamsSchema.safeParse({
        ...$validParams,
        users: [
          $validCaregiver,
          {
            ...$validChild,
            caregiverId: [$validCaregiver.id, 'missing-1', 'missing-2'],
            teacherId: [],
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].code).toEqual('custom');
      expect(result.error?.issues[0].message).toEqual(
        'Must match the id of a caregiver user',
      );
      expect(result.error?.issues[0].path).toEqual(['users', 1, 'caregiverId']);
    });
  });
});

describe('LinkUsersErrorSchema', () => {
  describe('internal', () => {
    const $code = 'internal';
    const $message = 'Internal error';
    const $details = {
      code: 'link',
      uid: 'uid-1',
    };

    it('accepts functions/internal/link', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = LinkUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/internal', () => {
      const err = new FunctionsError($code, $message);
      const result = LinkUsersErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/internal/foo', () => {
      const err = new FunctionsError($code, $message, {
        code: 'foo',
        uid: 'uid-1',
      });
      const result = LinkUsersErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['link'],
        path: ['details', 'code'],
        message: 'Invalid input: expected "link"',
      });
    });
  });

  describe('invalid-argument', () => {
    const $code = 'invalid-argument';

    it('accepts functions/invalid-argument/id-hash-mismatch', () => {
      const $message = 'ID hash mismatch';
      const $details = {
        code: 'id-hash-mismatch',
        uids: ['uid-1', 'uid-2'],
      };
      const err = new FunctionsError($code, $message, $details);
      const result = LinkUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('accepts functions/invalid-argument/schema', () => {
      const $message = 'Schema error';
      const $details = {
        code: 'schema',
        issues: [
          { path: 'users[0].id', message: 'Required' },
          { path: 'users[1].uid', message: 'Required' },
        ],
      };
      const err = new FunctionsError($code, $message, $details);
      const result = LinkUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('accepts functions/invalid-argument/users-site-mismatch', () => {
      const $message = 'Users-site mismatch';
      const $details = {
        code: 'users-site-mismatch',
        siteId: 'site-1',
        uids: ['uid-1', 'uid-2'],
      };
      const err = new FunctionsError($code, $message, $details);
      const result = LinkUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/invalid-argument', () => {
      const err = new FunctionsError($code, 'Foo error');
      const result = LinkUsersErrorSchema.safeParse(err);
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
      const result = LinkUsersErrorSchema.safeParse(err);
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
      code: 'users',
      uids: ['uid-1', 'uid-2'],
    };

    it('accepts functions/not-found/users', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = LinkUsersErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/not-found', () => {
      const err = new FunctionsError($code, $message);
      const result = LinkUsersErrorSchema.safeParse(err);
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
      const result = LinkUsersErrorSchema.safeParse(err);
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
      expect(() => LinkUsersErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => LinkUsersErrorSchema.parse(err)).not.toThrow();
    });
  });
});
