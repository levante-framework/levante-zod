import { cellToLatLng, getResolution } from 'h3-js';
import { z } from 'zod';
import {
  normalizeCsvData,
  normalizeCsvHeaders,
  validateCsvData,
  validateCsvHeaders,
} from './csv';
import {
  AddUserCsvHeaderSchema,
  combineUserCsvIssues,
  UserCsvSchema,
} from './user-csv';
import { parseCommaSeparated } from './users';
import {
  AddUsersCsvSchema,
  AddUsersSubmitSchema,
  validateAddUsersCsv,
  validateAddUsersFileUpload,
  validateAddUsersSubmit,
} from './users-add';
import { LinkUsersCsvSchema, validateLinkUsersCsv } from './users-link';

// Type alias for Firestore Timestamp
// @CC: "To check whether this is compatible with firestore - they encode
// this using seconds and nanoseconds and it usually has to be converted"
const TimestampSchema = z.iso.datetime();

const LatLonSourceSchema = z.enum(['gps', 'h3_center', 'approximate']);

const H3CellSchema = z.object({
  cellId: z.string().min(1),
  resolution: z.number().int().min(0).max(15),
});

const LocationSchema = z
  .object({
    schemaVersion: z.literal('location_v1'),
    latLon: z
      .object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        source: LatLonSourceSchema,
        blurRadiusMeters: z.number().positive().optional(),
      })
      .optional(),
    h3: z.object({
      scheme: z.literal('h3_v1'),
      baseline: H3CellSchema,
      effective: H3CellSchema,
      populationThreshold: z.number().int().positive(),
    }),
    populationSource: z.enum(['kontur', 'worldpop', 'unknown']).optional(),
    computedAt: z.iso.datetime().optional(),
  })
  .check(
    z.superRefine((value, ctx) => {
      try {
        const baselineResolution = getResolution(value.h3.baseline.cellId);
        if (baselineResolution !== value.h3.baseline.resolution) {
          ctx.addIssue({
            code: 'custom',
            path: ['h3', 'baseline', 'resolution'],
            message: `baseline resolution mismatch (cell=${baselineResolution}, field=${value.h3.baseline.resolution})`,
          });
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['h3', 'baseline', 'cellId'],
          message: 'Invalid baseline H3 cellId',
        });
      }

      try {
        const effectiveResolution = getResolution(value.h3.effective.cellId);
        if (effectiveResolution !== value.h3.effective.resolution) {
          ctx.addIssue({
            code: 'custom',
            path: ['h3', 'effective', 'resolution'],
            message: `effective resolution mismatch (cell=${effectiveResolution}, field=${value.h3.effective.resolution})`,
          });
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['h3', 'effective', 'cellId'],
          message: 'Invalid effective H3 cellId',
        });
      }

      if (value.h3.effective.resolution < value.h3.baseline.resolution) {
        ctx.addIssue({
          code: 'custom',
          path: ['h3', 'effective', 'resolution'],
          message: 'effective.resolution must be >= baseline.resolution',
        });
      }

      if (
        value.latLon?.source === 'approximate' &&
        !value.latLon.blurRadiusMeters
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['latLon', 'blurRadiusMeters'],
          message: 'blurRadiusMeters is required when source is approximate',
        });
      }

      if (value.latLon?.source === 'h3_center') {
        const [centerLat, centerLon] = cellToLatLng(value.h3.effective.cellId);
        const epsilon = 1e-6;
        if (
          Math.abs(value.latLon.lat - centerLat) > epsilon ||
          Math.abs(value.latLon.lon - centerLon) > epsilon
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['latLon'],
            message:
              'latLon must match effective H3 center when source is h3_center',
          });
        }
      }
    }),
  );

// Generic structure for organization references used in multiple places
const OrgRefMapSchema = z.object({
  classes: z.array(z.string()),
  districts: z.array(z.string()),
  // @CC: "I don't think we actually ever use families? This is ROAR legacy
  // - to confirm with team
  families: z.array(z.string()),
  groups: z.array(z.string()),
  schools: z.array(z.string()),
});

// Structure for organizational associations within Users
const OrgAssociationMapSchema = z.object({
  all: z.array(z.string()),
  current: z.array(z.string()),
  dates: z.record(z.string(), TimestampSchema),
});

// Structure for user legal document acceptance within Users
const UserLegalSchema = z.object({
  assent: z.record(z.string(), TimestampSchema),
  tos: z.record(z.string(), TimestampSchema),
});

// Structure for Admin-specific data within Users
const AdminDataSchema = z.object({
  administrationsCreated: z.array(z.string()),
});

// Structure for Assessment Condition Rules within Administrations
const AssessmentConditionRuleSchema = z.object({
  field: z.string(),
  op: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

// Structure for Assessment Conditions within Administrations
const AssessmentConditionsSchema = z.object({
  assigned: z.record(z.string(), z.unknown()),
  conditions: z.array(AssessmentConditionRuleSchema),
});

// Structure for individual Assessments within Administrations
const AssessmentSchema = z.object({
  conditions: AssessmentConditionsSchema,
  params: z.record(z.string(), z.unknown()),
  taskName: z.string(),
  taskId: z.string(),
  variantId: z.string(),
  variantName: z.string(),
});

// Structure for Legal information within Administrations and AssignedOrgs
const LegalInfoSchema = z.object({
  amount: z.string(),
  assent: z.union([z.string(), z.null()]),
  consent: z.union([z.string(), z.null()]),
  expectedTime: z.string(),
});

// Interface for documents in the `administrations` collection
const AdministrationSchema = z.object({
  assessments: z.array(AssessmentSchema),
  classes: z.array(z.string()),
  createdBy: z.string(),
  dateClosed: TimestampSchema,
  dateCreated: TimestampSchema,
  dateOpened: TimestampSchema,
  districts: z.array(z.string()),
  // @CC: "Flagging for families discussion"
  families: z.array(z.string()),
  groups: z.array(z.string()),
  legal: LegalInfoSchema,
  minimalOrgs: OrgRefMapSchema,
  name: z.string(),
  publicName: z.string(),
  readOrgs: OrgRefMapSchema,
  schools: z.array(z.string()),
  sequential: z.boolean(),
  tags: z.array(z.string()).optional(),
  testData: z.boolean(),
});

// Interface for documents in the `assignedOrgs` subcollection of `administrations`
const AssignedOrgSchema = z.object({
  administrationId: z.string(),
  createdBy: z.string(),
  dateClosed: TimestampSchema,
  dateCreated: TimestampSchema,
  dateOpened: TimestampSchema,
  legal: LegalInfoSchema,
  name: z.string(),
  orgId: z.string(),
  // @CC: "Flagging for families discussion"
  orgType: z.enum(['classes', 'districts', 'families', 'groups', 'schools']),
  publicName: z.string(),
  testData: z.boolean(),
  timestamp: TimestampSchema,
});

// Interface for the assignments subcollection of `users`
const AssignmentAssessmentSchema = z.object({
  progress: z.object({
    survey: z.string(),
    publicName: z.string(),
    readOrgs: OrgRefMapSchema,
    sequential: z.boolean(),
    started: z.boolean(),
    testData: z.boolean(),
    userData: z.object({
      assessmentPid: z.union([z.string(), z.null()]),
      assessmentUid: z.union([z.string(), z.null()]),
      email: z.string(),
      name: z.union([z.string(), z.null()]),
      username: z.string(),
    }),
  }),
  assessments: z.array(
    z
      .object({
        optional: z.boolean(),
        taskId: z.string(),
        variantId: z.string(),
        variantName: z.string(),
      })
      .and(z.record(z.string(), z.unknown())),
  ),
  optional: z.boolean(),
  params: z.object({
    taskId: z.string(),
    variantId: z.string(),
    variantName: z.string(),
  }),
  assigningOrgs: z.object({
    classes: z.array(z.string()),
    districts: z.array(z.string()),
    families: z.array(z.string()),
    groups: z.array(z.string()),
    schools: z.array(z.string()),
  }),
  completed: z.boolean(),
  createdBy: z.string(),
  dateAssigned: z.string(),
  dateClosed: z.string(),
  dateCreated: z.string(),
  dateOpened: z.string(),
  demoData: z.boolean(),
  id: z.string(),
  name: z.string(),
});

// Structure for Claims within UserClaims
// @CC: "I guess we still need this because we haven't gotten around to it
// yet - but we are going to remove the use of the userClaims collection
// entirely (we should be relying on custom auth claims instead)"
const ClaimsSchema = z.object({
  adminOrgs: OrgRefMapSchema,
  adminUid: z.string().optional(),
  assessmentUid: z.string().optional(),
  minimalAdminOrgs: OrgRefMapSchema,
  roarUid: z.string().optional(),
  super_admin: z.boolean(),
});

// Interface for documents in the `classes` collection
const ClassSchema = z.object({
  archived: z.boolean(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: z.string(),
  districtId: z.string(),
  id: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  schoolId: z.string(),
  tags: z.array(z.string()).optional(),
  type: z.string(),
});

const CreateClassSchema = ClassSchema.pick({
  name: true,
  normalizedName: true,
  tags: true,
  districtId: true,
  schoolId: true,
  type: true,
  createdBy: true,
}).extend({
  siteId: z.string().optional(),
});

// Interface for documents in the `districts` collection
const DistrictSchema = z.object({
  archived: z.boolean(),
  createdAt: TimestampSchema,
  createdBy: z.string(),
  updatedAt: TimestampSchema,
  name: z.string(),
  normalizedName: z.string(),
  tags: z.array(z.string()).optional(),
  type: z.string(),
  subGroups: z.array(z.string()).optional(),
  schools: z.array(z.string()).optional(),
});

const CreateDistrictSchema = DistrictSchema.pick({
  name: true,
  normalizedName: true,
  tags: true,
  subGroups: true,
  type: true,
  createdBy: true,
}).extend({
  siteId: z.string().optional(),
});

// Interface for documents in the `groups` collection
const GroupSchema = z.object({
  archived: z.boolean(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: z.string(),
  parentOrgId: z.string(),
  parentOrgType: z.literal('district'),
  name: z.string(),
  normalizedName: z.string(),
  tags: z.array(z.string()).optional(),
  type: z.string(),
});

const CreateGroupSchema = GroupSchema.pick({
  name: true,
  normalizedName: true,
  tags: true,
  parentOrgId: true,
  parentOrgType: true,
  type: true,
  createdBy: true,
}).extend({
  siteId: z.string().optional(),
});

// Tracks versions of legal documents using GitHub as a reference point.
const LegalSchema = z.object({});

// Interface for documents in the `readOrgs` subcollection of `administrations`
const ReadOrgSchema = z.object({
  administrationId: z.string(),
  createdBy: z.string(),
  dateClosed: TimestampSchema,
  dateCreated: TimestampSchema,
  dateOpened: TimestampSchema,
  legal: LegalInfoSchema,
  name: z.string(),
  orgId: z.string(),
  orgType: z.enum(['classes', 'districts', 'families', 'groups', 'schools']),
  publicName: z.string(),
  testData: z.boolean(),
  timestamp: TimestampSchema,
});

// Interface for documents in the `schools` collection
const SchoolSchema = z.object({
  archived: z.boolean(),
  classes: z.array(z.string()).optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: z.string(),
  districtId: z.string(),
  id: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  tags: z.array(z.string()).optional(),
  type: z.string(),
});

const CreateSchoolSchema = SchoolSchema.pick({
  name: true,
  normalizedName: true,
  tags: true,
  districtId: true,
  type: true,
  createdBy: true,
}).extend({
  siteId: z.string().optional(),
});

// Interface for the stats subcollection of `administrations`
const StatSchema = z.object({
  assignment: z.record(z.string(), z.number()),
  survey: z.record(z.string(), z.number()),
});

// Interface for documents in the `userClaims` collection
const UserClaimsSchema = z.object({
  claims: ClaimsSchema,
  lastUpdated: z.number(),
  testData: z.boolean().optional(),
});

// Interface for documents in the `users` collection
const UserSchema = z.object({
  adminData: AdminDataSchema.optional(),
  assignments: z
    .object({
      assigned: z.array(z.string()),
      completed: z.array(z.string()),
      started: z.array(z.string()),
    })
    .optional(),
  archived: z.boolean(),
  assessmentUid: z.string(),
  classes: OrgAssociationMapSchema,
  createdAt: TimestampSchema,
  displayName: z.string(),
  districts: OrgAssociationMapSchema,
  email: z.string(),
  groups: OrgAssociationMapSchema,
  legal: UserLegalSchema,
  schools: OrgAssociationMapSchema,
  sso: z.string().optional(),
  userType: z.enum(['admin', 'teacher', 'student', 'parent']),
  testData: z.boolean().optional(),
});

const CreateUserSchema = z.object({
  id: z.string(),
  userType: z.enum(['admin', 'teacher', 'student', 'parent']),
  month: z.string().optional(),
  year: z.string().optional(),
  caregiverId: z.string().optional(),
  teacherId: z.string().optional(),
  site: z.string(),
  school: z.string().optional(),
  class: z.string().optional(),
  cohort: z.string().optional(),
  orgIds: z.object({
    schools: z.array(z.string()),
    classes: z.array(z.string()),
    districts: z.array(z.string()).nonempty(),
    groups: z.array(z.string()),
  }),
});

const OrgSchema = z.object({
  archived: z.boolean(),
  classes: z.array(z.string()).optional(),
  createdAt: TimestampSchema,
  createdBy: z.string(),
  districtId: z.string(),
  id: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  parentOrgId: z.string(),
  parentOrgType: z.literal('district'),
  schoolId: z.string(),
  schools: z.array(z.string()).optional(),
  subGroups: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  type: z.string(),
  updatedAt: TimestampSchema,
});

const CreateOrgSchema = OrgSchema.pick({
  districtId: true,
  name: true,
  normalizedName: true,
  parentOrgId: true,
  schoolId: true,
  subGroups: true,
  tags: true,
  type: true,
  createdBy: true,
}).extend({
  siteId: z.string().optional(),
});

// @CC: "Will this fail/reject csvs that have headers that aren't in one of
// these three lists? I think we have sites that are managing their files with
// other columns, so we need to have plans to ignore anything"
const CsvHeadersSchema = z.object({
  headers: z.array(z.string()),
  requiredHeaders: z.array(z.string()),
  optionalHeaders: z.array(z.string()).optional(),
});

const locationDocId = (
  location: Pick<z.infer<typeof LocationSchema>, 'schemaVersion' | 'h3'>,
): string => {
  const version = location.schemaVersion.replace(/^location_/, '');
  return `h3:${location.h3.effective.cellId}:t:${location.h3.populationThreshold}:${version}`;
};

export {
  AddUserCsvHeaderSchema,
  AddUsersCsvSchema,
  AddUsersSubmitSchema,
  AdminDataSchema,
  AdministrationSchema,
  AssessmentConditionRuleSchema,
  AssessmentConditionsSchema,
  AssessmentSchema,
  AssignedOrgSchema,
  AssignmentAssessmentSchema,
  ClaimsSchema,
  ClassSchema,
  CreateClassSchema,
  CreateDistrictSchema,
  CreateGroupSchema,
  CreateOrgSchema,
  CreateSchoolSchema,
  CreateUserSchema,
  CsvHeadersSchema,
  combineUserCsvIssues,
  DistrictSchema,
  GroupSchema,
  H3CellSchema,
  LatLonSourceSchema,
  LegalInfoSchema,
  LegalSchema,
  LinkUsersCsvSchema,
  LocationSchema,
  locationDocId,
  normalizeCsvData,
  normalizeCsvHeaders,
  OrgAssociationMapSchema,
  OrgRefMapSchema,
  OrgSchema,
  parseCommaSeparated,
  ReadOrgSchema,
  SchoolSchema,
  StatSchema,
  TimestampSchema,
  UserClaimsSchema,
  UserCsvSchema,
  UserLegalSchema,
  UserSchema,
  validateAddUsersCsv,
  validateAddUsersFileUpload,
  validateAddUsersSubmit,
  validateCsvData,
  validateCsvHeaders,
  validateLinkUsersCsv,
};

export type AddUserCsvHeaderType = z.infer<typeof AddUserCsvHeaderSchema>;
export type AddUsersCsvType = z.infer<typeof AddUsersCsvSchema>;
export type AddUsersSubmitType = z.infer<typeof AddUsersSubmitSchema>;
export type AdminDataType = z.infer<typeof AdminDataSchema>;
export type AdministrationType = z.infer<typeof AdministrationSchema>;
export type AssessmentConditionRuleType = z.infer<
  typeof AssessmentConditionRuleSchema
>;
export type AssessmentConditionsType = z.infer<
  typeof AssessmentConditionsSchema
>;
export type AssessmentType = z.infer<typeof AssessmentSchema>;
export type AssignedOrgType = z.infer<typeof AssignedOrgSchema>;
export type AssignmentAssessmentType = z.infer<
  typeof AssignmentAssessmentSchema
>;
export type ClaimsType = z.infer<typeof ClaimsSchema>;
export type ClassType = z.infer<typeof ClassSchema>;
export type CreateClassType = z.infer<typeof CreateClassSchema>;
export type CreateDistrictType = z.infer<typeof CreateDistrictSchema>;
export type CreateGroupType = z.infer<typeof CreateGroupSchema>;
export type CreateOrgType = z.infer<typeof CreateOrgSchema>;
export type CreateSchoolType = z.infer<typeof CreateSchoolSchema>;
export type CreateUserType = z.infer<typeof CreateUserSchema>;
export type CsvHeadersType = z.infer<typeof CsvHeadersSchema>;
export type DistrictType = z.infer<typeof DistrictSchema>;
export type H3CellType = z.infer<typeof H3CellSchema>;
export type GroupType = z.infer<typeof GroupSchema>;
export type LatLonSourceType = z.infer<typeof LatLonSourceSchema>;
export type LegalInfoType = z.infer<typeof LegalInfoSchema>;
export type LegalType = z.infer<typeof LegalSchema>;
export type LinkUsersCsvType = z.infer<typeof LinkUsersCsvSchema>;
export type LocationType = z.infer<typeof LocationSchema>;
export type OrgAssociationMapType = z.infer<typeof OrgAssociationMapSchema>;
export type OrgRefMapType = z.infer<typeof OrgRefMapSchema>;
export type OrgType = z.infer<typeof OrgSchema>;
export type ReadOrgType = z.infer<typeof ReadOrgSchema>;
export type SchoolType = z.infer<typeof SchoolSchema>;
export type StatType = z.infer<typeof StatSchema>;
export type TimestampType = z.infer<typeof TimestampSchema>;
export type UserClaimsType = z.infer<typeof UserClaimsSchema>;
export type UserCsvType = z.infer<typeof UserCsvSchema>;
export type UserLegalType = z.infer<typeof UserLegalSchema>;
export type UserType = z.infer<typeof UserSchema>;
