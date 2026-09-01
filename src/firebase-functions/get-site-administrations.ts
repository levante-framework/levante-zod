import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/** Parameters schema for `getSiteAdministrations` Firebase Function */
export const GetSiteAdministrationsParamsSchema = z.object({
  siteId: NonEmptyStringSchema,
});

/** Parameters type for `getSiteAdministrations` Firebase Function */
export type GetSiteAdministrationsParams = z.infer<
  typeof GetSiteAdministrationsParamsSchema
>;

export type SiteAdministration = {
  id: string;
  name: string;
  publicName: string;
  dateOpened: unknown;
  dateClosed: unknown;
  dateCreated: unknown;
  assessments: unknown[];
  districts: string[];
  schools: string[];
  classes: string[];
  groups: string[];
  families: string[];
  testData: boolean;
  creatorName: string;
  syncStatus: 'pending' | 'complete' | 'failed';
};

/** Result type for `getSiteAdministrations` Firebase Function */
export type GetSiteAdministrationsResult = {
  administrations: SiteAdministration[];
};
