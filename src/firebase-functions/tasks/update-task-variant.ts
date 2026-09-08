import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';
import type { SerializedTaskVariant } from '../firestore';

/** Parameters schema for `updateTaskVariant` Firebase Function. */
export const UpdateTaskVariantParamsSchema = z.object({
  id: NonEmptyStringSchema,
  archived: z.boolean(),
  registered: z.boolean(),
});

/** Inferred type of {@link UpdateTaskVariantParamsSchema}. */
export type UpdateTaskVariantParams = z.infer<
  typeof UpdateTaskVariantParamsSchema
>;

/** Result type for `updateTaskVariant` Firebase Function. */
export type UpdateTaskVariantResult = {
  variant: SerializedTaskVariant;
};

/** Error schema for `updateTaskVariant` Firebase Function. */
export const UpdateTaskVariantErrorSchema = z.discriminatedUnion('code', [
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

/** Inferred type of {@link UpdateTaskVariantErrorSchema}. */
export type UpdateTaskVariantError = z.infer<
  typeof UpdateTaskVariantErrorSchema
>;
