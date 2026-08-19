import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';
import type { SerializedVariantParamSpec } from '../firestore';

/** Parameters schema for `upsertVariantParamSpec` Firebase Function. */
export const UpsertVariantParamSpecParamsSchema = z.object({
  archived: z.boolean(),
  description: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  type: z.enum(['boolean', 'number', 'string', 'unknown']),
  id: NonEmptyStringSchema.optional(),
});

/** Inferred type of {@link UpsertVariantParamSpecParamsSchema}. */
export type UpsertVariantParamSpecParams = z.infer<
  typeof UpsertVariantParamSpecParamsSchema
>;

/** Result type for `upsertVariantParamSpec` Firebase Function. */
export type UpsertVariantParamSpecResult = {
  variantParamSpec: SerializedVariantParamSpec;
};

/** Error schema for `upsertVariantParamSpec` Firebase Function. */
export const UpsertVariantParamSpecErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('variant-param-spec'),
      variantParamSpecId: z.string(),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link UpsertVariantParamSpecErrorSchema}. */
export type UpsertVariantParamSpecError = z.infer<
  typeof UpsertVariantParamSpecErrorSchema
>;
