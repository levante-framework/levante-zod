import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/** Parameters schema for `getSyncStatus` Firebase Function */
export const GetSyncStatusParamsSchema = z.object({
  siteId: NonEmptyStringSchema,
});

/** Parameters type for `getSyncStatus` Firebase Function */
export type GetSyncStatusParams = z.infer<typeof GetSyncStatusParamsSchema>;

/** Result type for `getSyncStatus` Firebase Function */
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
