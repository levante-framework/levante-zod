import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';
import type { SerializedTask } from '../firestore';

/** Parameters schema for `upsertTask` Firebase Function. */
export const UpsertTaskParamsSchema = z.object({
  archived: z.boolean(),
  description: NonEmptyStringSchema,
  image: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  displayName: NonEmptyStringSchema, // Used to display the task in the UI
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

/** Inferred type of {@link UpsertTaskErrorSchema}. */
export type UpsertTaskError = z.infer<typeof UpsertTaskErrorSchema>;
