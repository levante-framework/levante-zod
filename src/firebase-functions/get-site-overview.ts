import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Parameters schema for `getSiteOverview` Firebase Function. */
export const GetSiteOverviewParamsSchema = z.object({
  siteId: NonEmptyStringSchema,
});

/** Inferred type of {@link GetSiteOverviewParamsSchema}. */
export type GetSiteOverviewParams = z.infer<typeof GetSiteOverviewParamsSchema>;

/** Result type for `getSiteOverview` Firebase Function. */
export type GetSiteOverviewResult = {
  counts: {
    users: {
      teachers: number;
      caregivers: number;
      children: number;
    };
    assignments: {
      open: number;
      upcoming: number;
      closed: number;
    };
  };
  schools: { id: string; name: string }[];
  classes: { id: string; name: string; schoolId: string }[];
  cohorts: { id: string; name: string }[];
};

/** Error schema for `getSiteOverview` Firebase Function. */
export const GetSiteOverviewErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetSiteOverviewErrorSchema}. */
export type GetSiteOverviewError = z.infer<typeof GetSiteOverviewErrorSchema>;
