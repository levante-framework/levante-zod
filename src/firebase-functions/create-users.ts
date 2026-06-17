import * as z from 'zod';
import { CHILD_YEAR_MAX, CHILD_YEAR_MIN } from '../csv/user-csv';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** @deprecated */
export const CreateUserSchema = z.object({
  id: z.string(),
  userType: z.enum(['admin', 'teacher', 'student', 'parent']),
  month: z.string().optional(),
  year: z.string().optional(),
  caregiverId: z.string().optional(),
  teacherId: z.string().optional(),
  site: z.string(),
  school: z.string().optional(),
  class: z.string().optional(),
  cohort: z.string().optional(),
  orgIds: z.object({
    schools: z.array(z.string()),
    classes: z.array(z.string()),
    districts: z.array(z.string()).nonempty(),
    groups: z.array(z.string()),
  }),
});

/** Base schema for CreateUsersParamsSchema.users items. */
export const UserBaseSchema = z
  .object({
    id: NonEmptyStringSchema,
    orgIds: z.object({
      schools: z.array(NonEmptyStringSchema),
      classes: z.array(NonEmptyStringSchema),
      cohorts: z.array(NonEmptyStringSchema),
    }),
  })
  .superRefine((data, ctx) => {
    // All users must have either schools+classes xor cohorts
    const hasSchoolClass =
      data.orgIds.schools.length > 0 && data.orgIds.classes.length > 0;
    const hasCohort = data.orgIds.cohorts.length > 0;
    const hasAtLeastOneGroup = hasSchoolClass || hasCohort;
    const hasBothGroupTypes = hasSchoolClass && hasCohort;
    if (!hasAtLeastOneGroup || hasBothGroupTypes) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must have either schools and classes OR cohorts',
        path: ['orgIds'],
        input: data,
      });
    }
  });

/** Schema for CreateUsersParamsSchema.users items where userType is 'child'. */
export const ChildUserSchema = UserBaseSchema.extend({
  userType: z.literal('child'),
  month: z.int().min(1).max(12),
  year: z.int().min(CHILD_YEAR_MIN).max(CHILD_YEAR_MAX),
}).superRefine((data, ctx) => {
  // Children must have only one group
  const hasSchools = data.orgIds.schools.length > 1;
  const hasClasses = data.orgIds.classes.length > 1;
  const hasCohorts = data.orgIds.cohorts.length > 1;
  if (hasSchools || hasClasses || hasCohorts) {
    ctx.addIssue({
      code: 'custom',
      message: 'Must have only one group',
      path: ['orgIds'],
      input: data,
    });
  }
});

/** Schema for CreateUsersParamsSchema.users items where userType is 'caregiver'. */
export const CaregiverUserSchema = UserBaseSchema.extend({
  userType: z.literal('caregiver'),
});

/** Schema for CreateUsersParamsSchema.users items where userType is 'teacher'. */
export const TeacherUserSchema = UserBaseSchema.extend({
  userType: z.literal('teacher'),
});

/** Schema for CreateUsersParamsSchema.users items. */
export const UserSchema = z.discriminatedUnion('userType', [
  ChildUserSchema,
  CaregiverUserSchema,
  TeacherUserSchema,
]);

/** Parameters schema for `createUsers` Firebase Function. */
export const CreateUsersParamsSchema = z
  .object({
    siteId: NonEmptyStringSchema,
    users: z.array(UserSchema),
  })
  .superRefine((data, ctx) => {
    // Users array must be non-empty
    if (data.users.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must have at least one user',
        path: ['users'],
        input: data.users,
      });
      return;
    }

    // Users must have unique ids
    const seen = new Map<string, number[]>();
    data.users.forEach((user, idx) => {
      const idxs = seen.get(user.id) ?? [];
      idxs.push(idx);
      seen.set(user.id, idxs);
    });
    for (const idxs of seen.values()) {
      if (idxs.length < 2) continue;
      idxs.forEach((idx) => {
        ctx.addIssue({
          code: 'custom',
          message: 'Must be unique',
          path: [idx, 'id'],
          input: data.users[idx].id,
        });
      });
    }
  });

/** Inferred type of {@link CreateUsersParamsSchema}. */
export type CreateUsersParams = z.infer<typeof CreateUsersParamsSchema>;

/** Result type for `createUsers` Firebase Function. */
export type CreateUsersResult = {
  users: {
    id: string;
    email: string;
    password: string;
    uid: string;
  }[];
};

/** Error schema for `createUsers` Firebase Function. */
export const CreateUsersErrorSchema = z.discriminatedUnion('code', [
  FunctionsErrorSchema.extend({
    code: z.literal('functions/already-exists'),
    details: z.object({
      code: z.literal('users'),
      ids: z.array(z.string()),
    }),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/failed-precondition'),
    details: z.object({
      code: z.literal('sync-pending'),
    }),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/invalid-argument'),
    details: z.discriminatedUnion('code', [
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
        code: z.literal('org-site-mismatch'),
        siteId: z.string(),
        orgIds: z.object({
          schools: z.array(z.string()),
          classes: z.array(z.string()),
          cohorts: z.array(z.string()),
        }),
      }),
    ]),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('orgs'),
      orgIds: z.object({
        schools: z.array(z.string()),
        classes: z.array(z.string()),
        cohorts: z.array(z.string()),
      }),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link CreateUsersErrorSchema}. */
export type CreateUsersError = z.infer<typeof CreateUsersErrorSchema>;
