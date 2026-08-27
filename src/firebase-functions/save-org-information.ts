import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  FailedPreconditionErrorSchema,
  InternalErrorSchema,
  InvalidArgumentErrorSchema,
  NotFoundErrorSchema,
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
  /** Firestore path that was merged, e.g. `districts/{id}/siteInformation/{formVersion}`. */
  path: string;
};

/** Error schema for `saveOrgInformation` Firebase Function. */
export const SaveOrgInformationErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
  NotFoundErrorSchema,
  FailedPreconditionErrorSchema,
  InternalErrorSchema,
]);

/** Inferred type of {@link SaveOrgInformationErrorSchema}. */
export type SaveOrgInformationError = z.infer<
  typeof SaveOrgInformationErrorSchema
>;
