import * as z from 'zod';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';
import type { SerializedTask } from './firestore';

/** Parameters schema for `getTasks` Firebase Function. */
export const GetTasksParamsSchema = z.object({});

/** Inferred type of {@link GetTasksParamsSchema}. */
export type GetTasksParams = z.infer<typeof GetTasksParamsSchema>;

/** Result type for `getTasks` Firebase Function. */
export type GetTasksResult = {
  tasks: SerializedTask[];
};

/** Error schema for `getTasks` Firebase Function. */
export const GetTasksErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetTasksErrorSchema}. */
export type GetTasksError = z.infer<typeof GetTasksErrorSchema>;
