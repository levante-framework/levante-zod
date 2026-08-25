import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Parameters schema for `getUsersByOrg` Firebase Function. */
export const GetUsersByOrgParamsSchema = z
  .object({
    orgType: z.enum(['site', 'school', 'class', 'cohort']),
    orgId: NonEmptyStringSchema,
    // Exclude archived users, i.e., where `archived` is `true`
    excludeArchived: z.boolean().optional(),
    // Exclude disabled users, i.e., where `disabled` is `true`
    excludeDisabled: z.boolean().optional(),
    page: z.int().min(0).optional(),
    pageLimit: z.int().min(1).max(1000).optional(),
    // Field and direction to order results by; defaults to newest first
    orderBy: z
      .object({
        field: z.enum(['createdAt', 'email', 'userType']),
        direction: z.enum(['asc', 'desc']),
      })
      .optional(),
  })
  .superRefine((_data, _ctx) => {
    // TODO superRefine page/pageLimit instead of min/max
  });

/** Inferred type of {@link GetUsersByOrgParamsSchema}. */
export type GetUsersByOrgParams = z.infer<typeof GetUsersByOrgParamsSchema>;

/** Result type for `getUsersByOrg` Firebase Function. */
export type GetUsersByOrgResult = {
  users: Array<{
    uid: string;
    archived: boolean;
    disabled: boolean;
    email: string;
    username: string; // is this used by the dashboard?
    // NB: frontend-facing userType. The database stores `student`/`parent`; the
    // backend converts these to `child`/`caregiver` for the frontend.
    userType: 'admin' | 'caregiver' | 'child' | 'teacher';
    childLabelIndex?: number;
  }>;
};

/** Error schema for `getUsersByOrg` Firebase Function. */
export const GetUsersByOrgErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/internal'),
    details: z.object({
      code: z.literal('org-site-missing'),
      orgType: z.string(),
      orgId: z.string(),
      siteId: z.string(),
    }),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('org'),
      id: z.string(),
      type: z.string(),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetUsersByOrgErrorSchema}. */
export type GetUsersByOrgError = z.infer<typeof GetUsersByOrgErrorSchema>;
