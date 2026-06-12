import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/**
 * A single user update accepted by the `updateUserInfo` Firebase Function.
 *
 * Holds primitive, self-contained properties that only affect the user's own
 * document (i.e., not relationships to other entities such as orgs). Add new
 * optional fields here as more such properties become editable.
 */
export const UserInfoSchema = z.object({
  uid: NonEmptyStringSchema,
  archived: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

/** The editable fields on a user, excluding the `uid` identifier */
const EDITABLE_FIELDS = ['archived', 'disabled'] as const;

/** Parameters schema for `updateUserInfo` Firebase Function */
export const UpdateUserInfoParamsSchema = z
  .object({
    users: z.array(UserInfoSchema),
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

    // Each user must edit at least one field
    data.users.forEach((user, idx) => {
      const hasEdit = EDITABLE_FIELDS.some(
        (field) => user[field] !== undefined,
      );
      if (!hasEdit) {
        ctx.addIssue({
          code: 'custom',
          message: 'Must provide at least one field to update',
          path: ['users', idx],
          input: user,
        });
      }
    });

    // Users must have unique uids
    const seen = new Map<string, number[]>();
    data.users.forEach((user, idx) => {
      const idxs = seen.get(user.uid) ?? [];
      idxs.push(idx);
      seen.set(user.uid, idxs);
    });
    for (const idxs of seen.values()) {
      if (idxs.length < 2) continue;
      idxs.forEach((idx) => {
        ctx.addIssue({
          code: 'custom',
          message: 'Must be unique',
          path: ['users', idx, 'uid'],
          input: data.users[idx].uid,
        });
      });
    }
  });

/** Parameters type for `updateUserInfo` Firebase Function */
export type UpdateUserInfoParams = z.infer<typeof UpdateUserInfoParamsSchema>;

/** Result type for `updateUserInfo` Firebase Function */
export type UpdateUserInfoResult = {
  status: string;
  message: string;
  data: { uid: string }[];
};
