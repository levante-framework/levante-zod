import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  TaskNotFoundErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';
import type { SerializedTaskVariant } from './firestore';

/** Parameters schema for `upsertTaskVariant` Firebase Function. */
export const UpsertTaskVariantParamsSchema = z.object({
  name: NonEmptyStringSchema,
  params: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  registered: z.boolean(),
  schemaVersion: NonEmptyStringSchema,
  taskId: NonEmptyStringSchema,
  id: NonEmptyStringSchema.optional(),
});

/** Inferred type of {@link UpsertTaskVariantParamsSchema}. */
export type UpsertTaskVariantParams = z.infer<
  typeof UpsertTaskVariantParamsSchema
>;

/** Result type for `upsertTaskVariant` Firebase Function. */
export type UpsertTaskVariantResult = {
  variant: SerializedTaskVariant;
};

/** Error schema for `upsertTaskVariant` Firebase Function. */
export const UpsertTaskVariantErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  TaskNotFoundErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link UpsertTaskVariantErrorSchema}. */
export type UpsertTaskVariantError = z.infer<
  typeof UpsertTaskVariantErrorSchema
>;
