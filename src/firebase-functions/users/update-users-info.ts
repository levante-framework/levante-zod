import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import { findDuplicateIndexes } from '../../util/find-duplicate-indexes';
import { makeTooBigIssue, makeTooSmallIssue } from '../../util/issues';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';

/**
 * A single user update accepted by the `updateUsersInfo` Firebase Function;
 * holds primitive, self-contained properties that only affect the user's own
 * document (i.e., not relationships to other entities such as orgs).
 */
export const UserInfoSchema = z
  .object({
    uid: NonEmptyStringSchema,
    archived: z.boolean().optional(),
    disabled: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.archived === 'undefined' &&
      typeof data.disabled === 'undefined'
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must have at least one field to update',
        path: [],
        input: data,
      });
    }
  });

/** Parameters schema for `updateUsersInfo` Firebase Function. */
export const UpdateUsersInfoParamsSchema = z
  .object({
    users: z.array(UserInfoSchema),
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
    for (const idx of findDuplicateIndexes(
      data.users.map((user) => user.uid),
    )) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be unique',
        path: ['users', idx, 'uid'],
        input: data.users[idx].uid,
      });
    }
  });

/** Inferred type of {@link UpdateUsersInfoParamsSchema}. */
export type UpdateUsersInfoParams = z.infer<typeof UpdateUsersInfoParamsSchema>;

/** Result type for `updateUsersInfo` Firebase Function. */
export type UpdateUsersInfoResult = {
  users: {
    uid: string;
    archived?: boolean;
    disabled?: boolean;
  }[];
};

/** Error schema for `updateUsersInfo` Firebase Function. */
export const UpdateUsersInfoErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
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

/** Inferred type of {@link UpdateUsersInfoErrorSchema}. */
export type UpdateUsersInfoError = z.infer<typeof UpdateUsersInfoErrorSchema>;
