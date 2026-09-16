import * as z from 'zod';
import {
  AddUsersCsvHeaderSchema,
  AddUsersCsvSchema,
} from './csv/add-users-csv';
import {
  LinkUsersCsvHeaderSchema,
  LinkUsersCsvSchema,
} from './csv/link-users-csv';
import { combineUsersCsvIssues } from './csv/util';
import {
  FirebaseErrorSchema,
  FunctionsErrorSchema,
} from './firebase-functions/error';
import {
  GetSiteOverviewErrorSchema,
  GetSiteOverviewParamsSchema,
} from './firebase-functions/get-site-overview';
import {
  GetSyncStatusErrorSchema,
  GetSyncStatusParamsSchema,
} from './firebase-functions/get-sync-status';
import {
  CreateTaskVariantErrorSchema,
  CreateTaskVariantParamsSchema,
} from './firebase-functions/tasks/create-task-variant';
import {
  GetTaskVariantRevisionsErrorSchema,
  GetTaskVariantRevisionsParamsSchema,
} from './firebase-functions/tasks/get-task-variant-revisions';
import {
  GetTaskVariantsErrorSchema,
  GetTaskVariantsParamsSchema,
} from './firebase-functions/tasks/get-task-variants';
import {
  GetTasksErrorSchema,
  GetTasksParamsSchema,
} from './firebase-functions/tasks/get-tasks';
import {
  GetVariantParamSpecsErrorSchema,
  GetVariantParamSpecsParamsSchema,
} from './firebase-functions/tasks/get-variant-param-specs';
import {
  UpdateTaskVariantErrorSchema,
  UpdateTaskVariantParamsSchema,
} from './firebase-functions/tasks/update-task-variant';
import {
  UpsertTaskErrorSchema,
  UpsertTaskParamsSchema,
} from './firebase-functions/tasks/upsert-task';
import {
  UpsertVariantParamSpecErrorSchema,
  UpsertVariantParamSpecParamsSchema,
} from './firebase-functions/tasks/upsert-variant-param-spec';
import {
  CreateUsersErrorSchema,
  CreateUsersParamsSchema,
} from './firebase-functions/users/create-users';
import {
  GetUserOverviewErrorSchema,
  GetUserOverviewParamsSchema,
} from './firebase-functions/users/get-user-overview';
import {
  GetUsersByOrgErrorSchema,
  GetUsersByOrgParamsSchema,
} from './firebase-functions/users/get-users-by-org';
import {
  LinkUsersErrorSchema,
  LinkUsersParamsSchema,
} from './firebase-functions/users/link-users';
import {
  UpdateUsersInfoErrorSchema,
  UpdateUsersInfoParamsSchema,
} from './firebase-functions/users/update-users-info';
import {
  H3CellSchema,
  LatLonSourceSchema,
  LocationSchema,
  locationDocId,
} from './location';
import { makeCustomIssue } from './util/issues';

// Type alias for Firestore Timestamp
// @CC: "To check whether this is compatible with firestore - they encode
// this using seconds and nanoseconds and it usually has to be converted"
const TimestampSchema = z.iso.datetime();

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
  classes: OrgAssociationMapSchema,
  createdAt: TimestampSchema,
  disabled: z.boolean(),
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

export type { AddUsersCsv, AddUsersCsvHeader } from './csv/add-users-csv';
export {
  AddUsersCsvHeaderSchema,
  AddUsersCsvSchema,
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
  CreateTaskVariantErrorSchema,
  CreateTaskVariantParamsSchema,
  CreateUsersErrorSchema,
  CreateUsersParamsSchema,
  combineUsersCsvIssues,
  DistrictSchema,
  FirebaseErrorSchema,
  FunctionsErrorSchema,
  GetSiteOverviewErrorSchema,
  GetSiteOverviewParamsSchema,
  GetSyncStatusErrorSchema,
  GetSyncStatusParamsSchema,
  GetTasksErrorSchema,
  GetTasksParamsSchema,
  GetTaskVariantRevisionsErrorSchema,
  GetTaskVariantRevisionsParamsSchema,
  GetTaskVariantsErrorSchema,
  GetTaskVariantsParamsSchema,
  GetUserOverviewErrorSchema,
  GetUserOverviewParamsSchema,
  GetUsersByOrgErrorSchema,
  GetUsersByOrgParamsSchema,
  GetVariantParamSpecsErrorSchema,
  GetVariantParamSpecsParamsSchema,
  GroupSchema,
  H3CellSchema,
  LatLonSourceSchema,
  LegalInfoSchema,
  LegalSchema,
  LinkUsersCsvHeaderSchema,
  LinkUsersCsvSchema,
  LinkUsersErrorSchema,
  LinkUsersParamsSchema,
  LocationSchema,
  locationDocId,
  makeCustomIssue,
  OrgAssociationMapSchema,
  OrgRefMapSchema,
  OrgSchema,
  ReadOrgSchema,
  SchoolSchema,
  StatSchema,
  TimestampSchema,
  UpdateTaskVariantErrorSchema,
  UpdateTaskVariantParamsSchema,
  UpdateUsersInfoErrorSchema,
  UpdateUsersInfoParamsSchema,
  UpsertTaskErrorSchema,
  UpsertTaskParamsSchema,
  UpsertVariantParamSpecErrorSchema,
  UpsertVariantParamSpecParamsSchema,
  UserClaimsSchema,
  UserLegalSchema,
  UserSchema,
};
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
export type {
  CreateTaskVariantError,
  CreateTaskVariantParams,
  CreateTaskVariantResult,
} from './firebase-functions/tasks/create-task-variant';
export type {
  GetTasksError,
  GetTasksParams,
  GetTasksResult,
} from './firebase-functions/tasks/get-tasks';
export type {
  CreateUsersError,
  CreateUsersParams,
  CreateUsersResult,
} from './firebase-functions/users/create-users';
export type DistrictType = z.infer<typeof DistrictSchema>;
export type H3CellType = z.infer<typeof H3CellSchema>;
export type {
  GetSiteOverviewError,
  GetSiteOverviewParams,
  GetSiteOverviewResult,
} from './firebase-functions/get-site-overview';
export type {
  GetSyncStatusError,
  GetSyncStatusParams,
  GetSyncStatusResult,
} from './firebase-functions/get-sync-status';
export type {
  GetTaskVariantRevisionsError,
  GetTaskVariantRevisionsParams,
  GetTaskVariantRevisionsResult,
} from './firebase-functions/tasks/get-task-variant-revisions';
export type {
  GetTaskVariantsError,
  GetTaskVariantsParams,
  GetTaskVariantsResult,
} from './firebase-functions/tasks/get-task-variants';
export type {
  GetVariantParamSpecsError,
  GetVariantParamSpecsParams,
  GetVariantParamSpecsResult,
} from './firebase-functions/tasks/get-variant-param-specs';
export type {
  GetUserOverviewError,
  GetUserOverviewParams,
  GetUserOverviewResult,
} from './firebase-functions/users/get-user-overview';
export type {
  GetUsersByOrgError,
  GetUsersByOrgParams,
  GetUsersByOrgResult,
} from './firebase-functions/users/get-users-by-org';
export type GroupType = z.infer<typeof GroupSchema>;
export type LatLonSourceType = z.infer<typeof LatLonSourceSchema>;
export type LegalInfoType = z.infer<typeof LegalInfoSchema>;
export type LegalType = z.infer<typeof LegalSchema>;
export type { LinkUsersCsv, LinkUsersCsvHeader } from './csv/link-users-csv';
export type {
  LinkUsersError,
  LinkUsersParams,
  LinkUsersResult,
} from './firebase-functions/users/link-users';
export type LocationType = z.infer<typeof LocationSchema>;
export type OrgAssociationMapType = z.infer<typeof OrgAssociationMapSchema>;
export type OrgRefMapType = z.infer<typeof OrgRefMapSchema>;
export type OrgType = z.infer<typeof OrgSchema>;
export type {
  ParsedFirebaseError,
  ParsedFunctionsError,
} from './firebase-functions/error';
export type ReadOrgType = z.infer<typeof ReadOrgSchema>;
export type SchoolType = z.infer<typeof SchoolSchema>;
export type {
  SerializedTask,
  SerializedTaskVariant,
  SerializedTaskVariantRevision,
  SerializedVariantParamSpec,
} from './firebase-functions/firestore';
export type StatType = z.infer<typeof StatSchema>;
export type TimestampType = z.infer<typeof TimestampSchema>;
export type {
  UpdateTaskVariantError,
  UpdateTaskVariantParams,
  UpdateTaskVariantResult,
} from './firebase-functions/tasks/update-task-variant';
export type {
  UpsertTaskError,
  UpsertTaskParams,
  UpsertTaskResult,
} from './firebase-functions/tasks/upsert-task';
export type {
  UpsertVariantParamSpecError,
  UpsertVariantParamSpecParams,
  UpsertVariantParamSpecResult,
} from './firebase-functions/tasks/upsert-variant-param-spec';
export type {
  UpdateUsersInfoError,
  UpdateUsersInfoParams,
  UpdateUsersInfoResult,
} from './firebase-functions/users/update-users-info';
export type UserClaimsType = z.infer<typeof UserClaimsSchema>;
export type UserLegalType = z.infer<typeof UserLegalSchema>;
export type UserType = z.infer<typeof UserSchema>;
export type ZodIssue = z.core.$ZodIssue;
export type { ZodType } from 'zod';
