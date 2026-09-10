import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';

/** Parameters schema for `getUserOverview` Firebase Function. */
export const GetUserOverviewParamsSchema = z.object({
  uid: NonEmptyStringSchema,
});

/** Inferred type of {@link GetUserOverviewParamsSchema}. */
export type GetUserOverviewParams = z.infer<typeof GetUserOverviewParamsSchema>;

/** Result type for `getUserOverview` Firebase Function. */
export type GetUserOverviewResult = {
  // Identity
  uid: string;
  email: string;
  userType: 'caregiver' | 'child' | 'teacher';
  childLabelIndex?: number;

  // Status
  archived: boolean;
  disabled: boolean;

  // Orgs the user belongs to
  orgs: {
    id: string;
    name: string;
    orgType: 'site' | 'school' | 'class' | 'cohort';
  }[];

  // Assignments the user has received (via their orgs)
  assignments: {
    id: string;
    name: string;
    status: 'open' | 'upcoming' | 'closed';
    dateOpened: string;
    dateClosed: string;
  }[];
};

/** Error schema for `getUserOverview` Firebase Function. */
export const GetUserOverviewErrorSchema = z.discriminatedUnion('code', [
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
        code: z.literal('usertype'),
        uid: z.string(),
        userType: z.literal('admin'),
      }),
    ]),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('user'),
      uid: z.string(),
    }),
  }),
  UnauthenticatedErrorSchema,
  PermissionDeniedErrorSchema,
]);

/** Inferred type of {@link GetUserOverviewErrorSchema}. */
export type GetUserOverviewError = z.infer<typeof GetUserOverviewErrorSchema>;
