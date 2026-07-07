import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  TaskNotFoundErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';
import type { SerializedTaskSchema } from './firestore';

/** Parameters schema for `getTaskSchema` Firebase Function. */
export const GetTaskSchemasParamsSchema = z.object({
  taskId: NonEmptyStringSchema,
});

/** Inferred type of {@link GetTaskSchemasParamsSchema}. */
export type GetTaskSchemasParams = z.infer<typeof GetTaskSchemasParamsSchema>;

/** Result type for `getTaskSchemas` Firebase Function. */
export type GetTaskSchemasResult = {
  taskSchemas: SerializedTaskSchema[];
};

/** Error schema for `getTaskSchemas` Firebase Function. */
export const GetTaskSchemasErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  TaskNotFoundErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetTaskSchemasErrorSchema}. */
export type GetTaskSchemasError = z.infer<typeof GetTaskSchemasErrorSchema>;
