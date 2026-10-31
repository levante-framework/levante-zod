import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Parameters schema for `getOrgInformationStatus` Firebase Function. */
export const GetOrgInformationStatusParamsSchema = z.object({
  orgType: z.enum(['site', 'school']),
  orgId: NonEmptyStringSchema,
});

/** Inferred type of {@link GetOrgInformationStatusParamsSchema}. */
export type GetOrgInformationStatusParams = z.infer<
  typeof GetOrgInformationStatusParamsSchema
>;

/**
 * Result type for `getOrgInformationStatus` Firebase Function.
 * Progress is for the current registered form version only.
 */
export type GetOrgInformationStatusResult = {
  orgId: string;
  orgType: 'site' | 'school';
  progress: 'not-started' | 'incomplete' | 'complete';
};

/** Error schema for `getOrgInformationStatus` Firebase Function. */
export const GetOrgInformationStatusErrorSchema = z.discriminatedUnion('code', [
  FunctionsErrorSchema.extend({
    code: z.literal('functions/failed-precondition'),
    details: z.object({
      code: z.literal('no-current-version'),
      id: z.string(),
    }),
  }),
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/internal'),
    details: z.discriminatedUnion('code', [
      z.object({
        code: z.literal('org-incomplete'),
        type: z.string(),
        id: z.string(),
      }),
      z.object({
        code: z.literal('unexpected-status'),
        id: z.string(),
        status: z.string(),
      }),
    ]),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('org'),
      type: z.string(),
      id: z.string(),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetOrgInformationStatusErrorSchema}. */
export type GetOrgInformationStatusError = z.infer<
  typeof GetOrgInformationStatusErrorSchema
>;
