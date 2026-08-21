import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import { findDuplicateIndexes } from '../util/find-duplicate-indexes';
import { makeTooBigIssue, makeTooSmallIssue } from '../util/issues';
import {
  FunctionsErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Base schema for LinkUsersParamsSchema.users items. */
export const UserBaseSchema = z.object({
  id: NonEmptyStringSchema,
  uid: NonEmptyStringSchema,
});

/** Schema for LinkUsersParamsSchema.users items where userType is 'caregiver'. */
export const CaregiverUserSchema = UserBaseSchema.extend({
  userType: z.literal('caregiver'),
});

/** Schema for LinkUsersParamsSchema.users items where userType is 'child'. */
export const ChildUserSchema = UserBaseSchema.extend({
  userType: z.literal('child'),
  caregiverId: z.array(NonEmptyStringSchema),
  teacherId: z.array(NonEmptyStringSchema),
}).superRefine((data, ctx) => {
  // Must have at least one caregiverId or teacherId
  const hasCaregiver = data.caregiverId.length > 0;
  const hasTeacher = data.teacherId.length > 0;
  if (!hasCaregiver && !hasTeacher) {
    ctx.addIssue({
      code: 'custom',
      message: 'Must have at least one caregiverId or teacherId',
      path: ['caregiverId|teacherId'],
      input: data,
    });
  }
});

/** Schema for LinkUsersParamsSchema.users items where userType is 'teacher'. */
export const TeacherUserSchema = UserBaseSchema.extend({
  userType: z.literal('teacher'),
});

/** Schema for LinkUsersParamsSchema.users items. */
export const UserSchema = z.discriminatedUnion('userType', [
  CaregiverUserSchema,
  ChildUserSchema,
  TeacherUserSchema,
]);

/**
 * A `superRefine` callback that flags every child user referencing a
 * `caregiverId`/`teacherId` that doesn't match the `id` of some caregiver/
 * teacher user in the same payload. Emits at most one issue per child `*Id`
 * field, regardless of how many of its references are unresolved.
 */
const hasResolvableLinks = (data: LinkUsersParams, ctx: z.RefinementCtx) => {
  const caregiverIds = new Set<string>();
  const teacherIds = new Set<string>();
  for (const user of data.users) {
    if (user.userType === 'caregiver') caregiverIds.add(user.id);
    else if (user.userType === 'teacher') teacherIds.add(user.id);
  }

  data.users.forEach((user, idx) => {
    if (user.userType !== 'child') return;
    if (user.caregiverId.some((id) => !caregiverIds.has(id))) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must match the id of a caregiver row',
        path: ['users', idx, 'caregiverId'],
        input: user,
      });
    }
    if (user.teacherId.some((id) => !teacherIds.has(id))) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must match the id of a teacher row',
        path: ['users', idx, 'teacherId'],
        input: user,
      });
    }
  });
};

/** Parameters schema for `linkUsers` Firebase Function. */
export const LinkUsersParamsSchema = z
  .object({
    siteId: NonEmptyStringSchema,
    users: z.array(UserSchema),
  })
  .superRefine((data, ctx) => {
    // Users array must be non-empty
    if (data.users.length === 0) {
      ctx.addIssue(
        makeTooSmallIssue({
          input: data.users,
          minimum: 1,
          origin: 'array',
          path: ['users'],
        }),
      );
      return;
    }

    // Users array must not exceed 1000 users
    if (data.users.length > 1000) {
      ctx.addIssue(
        makeTooBigIssue({
          input: data.users,
          maximum: 1000,
          origin: 'array',
          path: ['users'],
        }),
      );
      return;
    }

    // Users must have unique ids
    for (const idx of findDuplicateIndexes(data.users.map((user) => user.id))) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be unique',
        path: ['users', idx, 'id'],
        input: data.users[idx].id,
      });
    }

    hasResolvableLinks(data, ctx);
  });

/** Inferred type of {@link LinkUsersParamsSchema}. */
export type LinkUsersParams = z.infer<typeof LinkUsersParamsSchema>;

/** Result type for `linkUsers` Firebase Function. */
export type LinkUsersResult = Record<string, never>;

/** Error schema for `linkUsers` Firebase Function. */
export const LinkUsersErrorSchema = z.discriminatedUnion('code', [
  FunctionsErrorSchema.extend({
    code: z.literal('functions/internal'),
    details: z.object({
      code: z.literal('link'),
      uid: z.string(),
    }),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/invalid-argument'),
    details: z.discriminatedUnion('code', [
      z.object({
        code: z.literal('id-hash-mismatch'),
        uids: z.array(z.string()),
      }),
      z.object({
        code: z.literal('schema'),
        issues: z.array(
          z.object({
            path: z.string(),
            message: z.string(),
          }),
        ),
      }),
      z.object({
        code: z.literal('users-site-mismatch'),
        siteId: z.string(),
        uids: z.array(z.string()),
      }),
    ]),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('users'),
      uids: z.array(z.string()),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link LinkUsersErrorSchema}. */
export type LinkUsersError = z.infer<typeof LinkUsersErrorSchema>;
