import { z } from 'zod';

export const SITE_ID_MESSAGE =
  'siteId is required and must be a non-empty string';

/** Parameters schema for `getSiteOverview` Firebase Function */
export const GetSiteOverviewParamsSchema = z.object({
  siteId: z.string(SITE_ID_MESSAGE).trim().min(1, SITE_ID_MESSAGE),
});

/** Parameters type for `getSiteOverview` Firebase Function */
export type GetSiteOverviewParams = z.infer<typeof GetSiteOverviewParamsSchema>;

/** Result type for `getSiteOverview` Firebase Function */
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
