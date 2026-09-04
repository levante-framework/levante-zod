import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';
import type { SerializedTaskVariant } from '../firestore';

/** Parameters schema for `createTaskVariant` Firebase Function. */
export const CreateTaskVariantParamsSchema = z.object({
  name: NonEmptyStringSchema,
  displayName: NonEmptyStringSchema,
  params: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  registered: z.boolean(),
  taskId: NonEmptyStringSchema,
});

/** Inferred type of {@link CreateTaskVariantParamsSchema}. */
export type CreateTaskVariantParams = z.infer<
  typeof CreateTaskVariantParamsSchema
>;

/** Result type for `createTaskVariant` Firebase Function. */
export type CreateTaskVariantResult = {
  variant: SerializedTaskVariant;
};

/** Error schema for `createTaskVariant` Firebase Function. */
export const CreateTaskVariantErrorSchema = z.discriminatedUnion('code', [
  FunctionsErrorSchema.extend({
    code: z.literal('functions/already-exists'),
    details: z.object({
      code: z.literal('params'),
      params: z.record(
        z.string(),
        z.union([z.boolean(), z.number(), z.string()]),
      ),
    }),
  }),
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('task'),
      taskId: z.string(),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link CreateTaskVariantErrorSchema}. */
export type CreateTaskVariantError = z.infer<
  typeof CreateTaskVariantErrorSchema
>;
