import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/** Parameters schema for `listUsers` Firebase Function */
export const ListUsersParamsSchema = z.object({
  orgType: z.enum(['districts', 'schools', 'classes', 'groups']),
  orgId: NonEmptyStringSchema,
  page: z.int().min(0).optional(),
  pageLimit: z.int().min(1).optional(),
  // Restrict to active users, i.e., where `archived` is `false`
  restrictToActiveUsers: z.boolean().optional(),
  // Restrict to enabled users, i.e., where `disabled` is `false`
  restrictToEnabledUsers: z.boolean().optional(),
});

/** Parameters type for `listUsers` Firebase Function */
export type ListUsersParams = z.infer<typeof ListUsersParamsSchema>;

/** A user returned by the `listUsers` Firebase Function */
export type ListUsersUser = {
  id: string;
  username: string;
  email: string;
  // NB: frontend-facing userType. The database stores `student`/`parent`; the
  // backend converts these to `child`/`caregiver` for the frontend.
  userType: 'admin' | 'teacher' | 'child' | 'caregiver';
  archived: boolean;
  disabled: boolean;
};

/** Result type for `listUsers` Firebase Function */
export type ListUsersResult = {
  users: ListUsersUser[];
};
