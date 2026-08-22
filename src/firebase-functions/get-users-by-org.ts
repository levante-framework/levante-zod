import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Parameters schema for `getUsersByOrg` Firebase Function. */
export const GetUsersByOrgParamsSchema = z.object({
  orgType: z.enum(['site', 'school', 'class', 'cohort']),
  orgId: NonEmptyStringSchema,
});

/** Inferred type of {@link GetUsersByOrgParamsSchema}. */
export type GetUsersByOrgParams = z.infer<typeof GetUsersByOrgParamsSchema>;

/** Wire format representation of a Firestore `users/{uid}` doc. */
export type SerializedUser = {
  uid: string;
  email: string;
  userType: 'admin' | 'caregiver' | 'child' | 'teacher';
  childLabelIndex?: number;
};

/** Result type for `getUsersByOrg` Firebase Function. */
export type GetUsersByOrgResult = {
  users: SerializedUser[];
};

/** Error schema for `getUsersByOrg` Firebase Function. */
export const GetUsersByOrgErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('org'),
      id: z.string(),
      type: z.enum(['site', 'school', 'class', 'cohort']),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetUsersByOrgErrorSchema}. */
export type GetUsersByOrgError = z.infer<typeof GetUsersByOrgErrorSchema>;
