import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/**
 * Parameters schema for `saveOrgInformation` Firebase Function.
 *
 * v1 validates the request envelope only. Response field values are not checked
 * against SiteInformation / SchoolInformation (partial page saves are allowed).
 */
export const SaveOrgInformationParamsSchema = z.object({
  orgType: z.enum(['site', 'school']),
  orgId: NonEmptyStringSchema,
  /** Document ID of `formDefinitions/.../versions/{versionId}`. */
  formVersion: NonEmptyStringSchema,
  /**
   * Partial answers keyed by form `variableName`.
   * Values are untyped in v1 (string | number | string[] | …).
   */
  responses: z.record(z.string(), z.unknown()),
  /** `draft` for Next/Save; `complete` for Submit. */
  status: z.enum(['draft', 'complete']),
});

/** Inferred type of {@link SaveOrgInformationParamsSchema}. */
export type SaveOrgInformationParams = z.infer<
  typeof SaveOrgInformationParamsSchema
>;

/** Result type for `saveOrgInformation` Firebase Function. */
export type SaveOrgInformationResult = {
  orgType: 'site' | 'school';
  orgId: string;
  formVersion: string;
  status: 'draft' | 'complete';
  /** Firestore path of the saved document, e.g. `districts/{id}/siteInformation/{formVersion}`. */
  path: string;
};

/** Error schema for `saveOrgInformation` Firebase Function. */
export const SaveOrgInformationErrorSchema = z.discriminatedUnion('code', [
  FunctionsErrorSchema.extend({
    code: z.literal('functions/failed-precondition'),
    details: z.discriminatedUnion('code', [
      z.object({
        code: z.literal('unregistered'),
        id: z.string(),
      }),
      z.object({
        code: z.literal('missing-fields'),
        fields: z.array(z.string()),
      }),
    ]),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/internal'),
    details: z.object({
      code: z.literal('org-incomplete'),
      type: z.string(),
      id: z.string(),
    }),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/invalid-argument'),
    details: z.discriminatedUnion('code', [
      z.object({
        code: z.literal('schema'),
        issues: z.array(z.object({ path: z.string(), message: z.string() })),
      }),
      z.object({
        code: z.literal('responses'),
        issues: z.array(z.object({ path: z.string(), message: z.string() })),
      }),
    ]),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.discriminatedUnion('code', [
      z.object({
        code: z.literal('org'),
        type: z.string(),
        id: z.string(),
      }),
      z.object({
        code: z.literal('form-version'),
        id: z.string(),
      }),
    ]),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link SaveOrgInformationErrorSchema}. */
export type SaveOrgInformationError = z.infer<
  typeof SaveOrgInformationErrorSchema
>;
