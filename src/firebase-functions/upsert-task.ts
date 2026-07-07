import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  TaskNotFoundErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';
import type { SerializedTask } from './firestore';

/** Parameters schema for `upsertTask` Firebase Function. */
export const UpsertTaskParamsSchema = z.object({
  description: NonEmptyStringSchema,
  image: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  registered: z.boolean(),
  id: NonEmptyStringSchema.optional(),
});

/** Inferred type of {@link UpsertTaskParamsSchema}. */
export type UpsertTaskParams = z.infer<typeof UpsertTaskParamsSchema>;

/** Result type for `upsertTask` Firebase Function. */
export type UpsertTaskResult = {
  task: SerializedTask;
};

/** Error schema for `upsertTask` Firebase Function. */
export const UpsertTaskErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  TaskNotFoundErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link UpsertTaskErrorSchema}. */
export type UpsertTaskError = z.infer<typeof UpsertTaskErrorSchema>;
