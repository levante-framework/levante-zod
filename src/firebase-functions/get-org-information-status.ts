import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import { makeTooBigIssue, makeTooSmallIssue } from '../util/issues';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Parameters schema for `getOrgInformationStatus` Firebase Function. */
export const GetOrgInformationStatusParamsSchema = z
  .object({
    orgType: z.enum(['site', 'school']),
    orgIds: z.array(NonEmptyStringSchema),
  })
  .superRefine((data, ctx) => {
    if (data.orgIds.length === 0) {
      ctx.addIssue(
        makeTooSmallIssue({
          input: data.orgIds,
          minimum: 1,
          origin: 'array',
          path: ['orgIds'],
        }),
      );
      return;
    }
    if (data.orgIds.length > 100) {
      ctx.addIssue(
        makeTooBigIssue({
          input: data.orgIds,
          maximum: 100,
          origin: 'array',
          path: ['orgIds'],
        }),
      );
    }
  });

/** Inferred type of {@link GetOrgInformationStatusParamsSchema}. */
export type GetOrgInformationStatusParams = z.infer<
  typeof GetOrgInformationStatusParamsSchema
>;

/**
 * Result type for `getOrgInformationStatus` Firebase Function.
 * Progress is for the current registered form version only.
 * A failed org is an error on that result item, not a thrown Functions error.
 */
export type GetOrgInformationStatusResult = {
  orgType: 'site' | 'school';
  results: Array<
    | { orgId: string; progress: 'not-started' | 'incomplete' | 'complete' }
    | { orgId: string; error: { code: 'org' } }
    | { orgId: string; error: { code: 'org-incomplete' } }
    | {
        orgId: string;
        error: { code: 'unexpected-status'; status: string };
      }
  >;
};

/** Error schema for `getOrgInformationStatus` Firebase Function. */
export const GetOrgInformationStatusErrorSchema = z.discriminatedUnion('code', [
  FunctionsErrorSchema.extend({
    code: z.literal('functions/failed-precondition'),
    details: z.object({
      code: z.literal('unregistered'),
      id: z.string(),
    }),
  }),
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('form-definition'),
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
