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
  LoadFormDefinitionsErrorSchema,
  LoadFormDefinitionsParamsSchema,
} from './firebase-functions/load-form-definitions';
import {
  SaveOrgInformationErrorSchema,
  SaveOrgInformationParamsSchema,
} from './firebase-functions/save-org-information';
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
import { TimestampSchema } from './firestore/timestamp';
import {
  AdminDataSchema,
  OrgAssociationMapSchema,
  UserLegalSchema,
  UserSchema,
} from './firestore/users';
import { CoarseLocationSchema, H3CellSchema } from './location';
import { makeCustomIssue } from './util/issues';

/** Schema for organization references used in multiple places. @deprecated */
const OrgRefMapSchema = z.object({
  classes: z.array(z.string()),
  districts: z.array(z.string()),
  // @CC: "I don't think we actually ever use families? This is ROAR legacy
  // - to confirm with team
  families: z.array(z.string()),
  groups: z.array(z.string()),
  schools: z.array(z.string()),
});

/** Schema for Assessment Condition Rules within Administrations. @deprecated */
const AssessmentConditionRuleSchema = z.object({
  field: z.string(),
  op: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

/** Schema for Assessment Conditions within Administrations. @deprecated */
const AssessmentConditionsSchema = z.object({
  assigned: z.record(z.string(), z.unknown()),
  conditions: z.array(AssessmentConditionRuleSchema),
});

/** Schema for individual Assessments within Administrations. @deprecated */
const AssessmentSchema = z.object({
  conditions: AssessmentConditionsSchema,
  params: z.record(z.string(), z.unknown()),
  taskName: z.string(),
  taskId: z.string(),
  variantId: z.string(),
  variantName: z.string(),
});

/** Schema for Legal information within Administrations and AssignedOrgs. @deprecated */
const LegalInfoSchema = z.object({
  amount: z.string(),
  assent: z.union([z.string(), z.null()]),
  consent: z.union([z.string(), z.null()]),
  expectedTime: z.string(),
});

/** Schema for documents in the `administrations` collection. @deprecated */
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

/** Schema for documents in the `assignedOrgs` subcollection of `administrations`. @deprecated */
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

/** Schema for the assignments subcollection of `users`. @deprecated */
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

/** Schema for Claims within UserClaims. @deprecated */
const ClaimsSchema = z.object({
  // @CC: "I guess we still need this because we haven't gotten around to it
  // yet - but we are going to remove the use of the userClaims collection
  // entirely (we should be relying on custom auth claims instead)"
  adminOrgs: OrgRefMapSchema,
  adminUid: z.string().optional(),
  minimalAdminOrgs: OrgRefMapSchema,
  roarUid: z.string().optional(),
  super_admin: z.boolean(),
});

/** Schema for documents in the `classes` collection. @deprecated */
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

/** Schema for creating a class. @deprecated */
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

/** Schema for documents in the `districts` collection. @deprecated */
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

/** Schema for creating a district. @deprecated */
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

/** Schema for documents in the `groups` collection. @deprecated */
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

/** Schema for creating a group. @deprecated */
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

/** Schema for Tracks versions of legal documents using GitHub as a reference point. @deprecated */
const LegalSchema = z.object({});

/** Schema for documents in the `readOrgs` subcollection of `administrations`. @deprecated */
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

/** Schema for documents in the `schools` collection. @deprecated */
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

/** Schema for creating a school. @deprecated */
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

/** Schema for the stats subcollection of `administrations`. @deprecated */
const StatSchema = z.object({
  assignment: z.record(z.string(), z.number()),
  survey: z.record(z.string(), z.number()),
});

/** Schema for documents in the `userClaims` collection. @deprecated */
const UserClaimsSchema = z.object({
  claims: ClaimsSchema,
  lastUpdated: z.number(),
  testData: z.boolean().optional(),
});

/** Schema for documents in the `orgs` collection. @deprecated */
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

/** Schema for creating an org. @deprecated */
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
  CoarseLocationSchema,
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
  LegalInfoSchema,
  LegalSchema,
  LinkUsersCsvHeaderSchema,
  LinkUsersCsvSchema,
  LinkUsersErrorSchema,
  LinkUsersParamsSchema,
  LoadFormDefinitionsErrorSchema,
  LoadFormDefinitionsParamsSchema,
  makeCustomIssue,
  OrgAssociationMapSchema,
  OrgRefMapSchema,
  OrgSchema,
  ReadOrgSchema,
  SaveOrgInformationErrorSchema,
  SaveOrgInformationParamsSchema,
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
/** Inferred type of {@link AdministrationSchema}. @deprecated */
export type AdministrationType = z.infer<typeof AdministrationSchema>;
/** Inferred type of {@link AssessmentConditionRuleSchema}. @deprecated */
export type AssessmentConditionRuleType = z.infer<
  typeof AssessmentConditionRuleSchema
>;
/** Inferred type of {@link AssessmentConditionsSchema}. @deprecated */
export type AssessmentConditionsType = z.infer<
  typeof AssessmentConditionsSchema
>;
/** Inferred type of {@link AssessmentSchema}. @deprecated */
export type AssessmentType = z.infer<typeof AssessmentSchema>;
/** Inferred type of {@link AssignedOrgSchema}. @deprecated */
export type AssignedOrgType = z.infer<typeof AssignedOrgSchema>;
/** Inferred type of {@link AssignmentAssessmentSchema}. @deprecated */
export type AssignmentAssessmentType = z.infer<
  typeof AssignmentAssessmentSchema
>;
/** Inferred type of {@link ClaimsSchema}. @deprecated */
export type ClaimsType = z.infer<typeof ClaimsSchema>;
/** Inferred type of {@link ClassSchema}. @deprecated */
export type ClassType = z.infer<typeof ClassSchema>;
/** Inferred type of {@link CreateClassSchema}. @deprecated */
export type CreateClassType = z.infer<typeof CreateClassSchema>;
/** Inferred type of {@link CreateDistrictSchema}. @deprecated */
export type CreateDistrictType = z.infer<typeof CreateDistrictSchema>;
/** Inferred type of {@link CreateGroupSchema}. @deprecated */
export type CreateGroupType = z.infer<typeof CreateGroupSchema>;
/** Inferred type of {@link CreateOrgSchema}. @deprecated */
export type CreateOrgType = z.infer<typeof CreateOrgSchema>;
/** Inferred type of {@link CreateSchoolSchema}. @deprecated */
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
/** Inferred type of {@link DistrictSchema}. @deprecated */
export type DistrictType = z.infer<typeof DistrictSchema>;
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
  FormSectionInfo,
  InformationFormField,
  LoadFormDefinitionsError,
  LoadFormDefinitionsParams,
  LoadFormDefinitionsResult,
} from './firebase-functions/load-form-definitions';
export type {
  SaveOrgInformationError,
  SaveOrgInformationParams,
  SaveOrgInformationResult,
} from './firebase-functions/save-org-information';
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
export type { CoarseLocation, H3Cell } from './location';
/** Inferred type of {@link GroupSchema}. @deprecated */
export type GroupType = z.infer<typeof GroupSchema>;
/** Inferred type of {@link LegalInfoSchema}. @deprecated */
export type LegalInfoType = z.infer<typeof LegalInfoSchema>;
/** Inferred type of {@link LegalSchema}. @deprecated */
export type LegalType = z.infer<typeof LegalSchema>;
export type { LinkUsersCsv, LinkUsersCsvHeader } from './csv/link-users-csv';
export type {
  LinkUsersError,
  LinkUsersParams,
  LinkUsersResult,
} from './firebase-functions/users/link-users';
/** Inferred type of {@link OrgRefMapSchema}. @deprecated */
export type OrgRefMapType = z.infer<typeof OrgRefMapSchema>;
/** Inferred type of {@link OrgSchema}. @deprecated */
export type OrgType = z.infer<typeof OrgSchema>;
export type {
  ParsedFirebaseError,
  ParsedFunctionsError,
} from './firebase-functions/error';
/** Inferred type of {@link ReadOrgSchema}. @deprecated */
export type ReadOrgType = z.infer<typeof ReadOrgSchema>;
/** Inferred type of {@link SchoolSchema}. @deprecated */
export type SchoolType = z.infer<typeof SchoolSchema>;
export type {
  SerializedTask,
  SerializedTaskVariant,
  SerializedTaskVariantRevision,
  SerializedVariantParamSpec,
} from './firebase-functions/firestore';
/** Inferred type of {@link StatSchema}. @deprecated */
export type StatType = z.infer<typeof StatSchema>;
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
export type { TimestampType } from './firestore/timestamp';
/** Inferred type of {@link UserClaimsSchema}. @deprecated */
export type UserClaimsType = z.infer<typeof UserClaimsSchema>;
export type ZodIssue = z.core.$ZodIssue;
export type { ZodType } from 'zod';
export type {
  AdminDataType,
  OrgAssociationMapType,
  UserLegalType,
  UserType,
} from './firestore/users';
