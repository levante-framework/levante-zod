import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  TaskNotFoundErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';
import type { SerializedTaskVariant } from './firestore';

/** Parameters schema for `getTaskVariants` Firebase Function. */
export const GetTaskVariantsParamsSchema = z.object({
  taskId: NonEmptyStringSchema,
  registered: z.boolean().optional(),
});

/** Inferred type of {@link GetTaskVariantsParamsSchema}. */
export type GetTaskVariantsParams = z.infer<typeof GetTaskVariantsParamsSchema>;

/** Result type for `getTaskVariants` Firebase Function. */
export type GetTaskVariantsResult = {
  variants: SerializedTaskVariant[];
};

/** Error schema for `getTaskVariants` Firebase Function. */
export const GetTaskVariantsErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  TaskNotFoundErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetTaskVariantsErrorSchema}. */
export type GetTaskVariantsError = z.infer<typeof GetTaskVariantsErrorSchema>;
