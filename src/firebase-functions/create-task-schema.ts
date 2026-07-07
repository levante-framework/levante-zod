import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  TaskNotFoundErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';
import type { SerializedTaskSchema } from './firestore';

/** Parameters schema for `createTaskSchema` Firebase Function. */
export const CreateTaskSchemaParamsSchema = z.object({
  taskId: NonEmptyStringSchema,
  paramDefinitions: z.record(
    NonEmptyStringSchema,
    z.object({
      description: NonEmptyStringSchema,
      type: z.union([
        z.literal('boolean'),
        z.literal('number'),
        z.literal('string'),
      ]),
      required: z.boolean().optional(),
    }),
  ),
});

/** Inferred type of {@link CreateTaskSchemaParamsSchema}. */
export type CreateTaskSchemaParams = z.infer<
  typeof CreateTaskSchemaParamsSchema
>;

/** Result type for `createTaskSchema` Firebase Function. */
export type CreateTaskSchemaResult = {
  taskSchema: SerializedTaskSchema;
};

/** Error schema for `createTaskSchema` Firebase Function. */
export const CreateTaskSchemaErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  TaskNotFoundErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link CreateTaskSchemaErrorSchema}. */
export type CreateTaskSchemaError = z.infer<typeof CreateTaskSchemaErrorSchema>;
