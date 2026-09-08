import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';
import type { SerializedTaskVariantRevision } from '../firestore';

/** Parameters schema for `getTaskVariantRevisions` Firebase Function. */
export const GetTaskVariantRevisionsParamsSchema = z.object({
  variantId: NonEmptyStringSchema,
});

/** Inferred type of {@link GetTaskVariantRevisionsParamsSchema}. */
export type GetTaskVariantRevisionsParams = z.infer<
  typeof GetTaskVariantRevisionsParamsSchema
>;

/** Result type for `getTaskVariantRevisions` Firebase Function. */
export type GetTaskVariantRevisionsResult = {
  variantId: string;
  revisions: SerializedTaskVariantRevision[];
};

/** Error schema for `getTaskVariantRevisions` Firebase Function. */
export const GetTaskVariantRevisionsErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('variant'),
      variantId: z.string(),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetTaskVariantRevisionsErrorSchema}. */
export type GetTaskVariantRevisionsError = z.infer<
  typeof GetTaskVariantRevisionsErrorSchema
>;
