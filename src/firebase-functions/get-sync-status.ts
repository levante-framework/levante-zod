import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Parameters schema for `getSyncStatus` Firebase Function. */
export const GetSyncStatusParamsSchema = z.object({
  siteId: NonEmptyStringSchema,
});

/** Inferred type of {@link GetSyncStatusParamsSchema}. */
export type GetSyncStatusParams = z.infer<typeof GetSyncStatusParamsSchema>;

/** Result type for `getSyncStatus` Firebase Function. */
export type GetSyncStatusResult = {
  assignments: {
    complete: number;
    failed: number;
    pending: number;
  };
  users: {
    complete: number;
    failed: number;
    pending: number;
  };
};

/** Error schema for `getSyncStatus` Firebase Function. */
export const GetSyncStatusErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetSyncStatusErrorSchema}. */
export type GetSyncStatusError = z.infer<typeof GetSyncStatusErrorSchema>;
