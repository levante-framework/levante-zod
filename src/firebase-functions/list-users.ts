import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/** Parameters schema for `listUsers` Firebase Function */
export const ListUsersParamsSchema = z.object({
  orgType: z.enum(['site', 'school', 'class', 'cohort']),
  orgId: NonEmptyStringSchema,
  page: z.int().min(0).optional(),
  pageLimit: z.int().min(1).optional(),
  // Field and direction to order results by; defaults to newest first
  orderBy: z
    .object({
      field: z.enum(['createdAt', 'email', 'userType']),
      direction: z.enum(['asc', 'desc']),
    })
    .default({ field: 'createdAt', direction: 'desc' }),
  // Exclude archived users, i.e., where `archived` is `true`
  excludeArchived: z.boolean().optional(),
  // Exclude disabled users, i.e., where `disabled` is `true`
  excludeDisabled: z.boolean().optional(),
});

/** Parameters type for `listUsers` Firebase Function */
export type ListUsersParams = z.infer<typeof ListUsersParamsSchema>;

/** Result type for `listUsers` Firebase Function */
export type ListUsersResult = {
  users: {
    uid: string;
    username: string;
    email: string;
    // NB: frontend-facing userType. The database stores `student`/`parent`; the
    // backend converts these to `child`/`caregiver` for the frontend.
    userType: 'admin' | 'teacher' | 'child' | 'caregiver';
    archived: boolean;
    disabled: boolean;
  }[];
};
