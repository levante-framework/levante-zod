import { z } from 'zod';

// Type alias for Firestore Timestamp
const TimestampSchema = z.iso.datetime();

// Generic structure for organization references used in multiple places
const OrgRefMapSchema = z.object({
  classes: z.array(z.string()),
  districts: z.array(z.string()),
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
    readOrgs: z.object({
      classes: z.array(z.string()),
      districts: z.array(z.string()),
      families: z.array(z.string()),
      groups: z.array(z.string()),
      schools: z.array(z.string()),
    }),
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
      .and(z.record(z.string(), z.unknown()))
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
});

// CSV User Validation Schemas

// Parse comma-separated values
const parseCommaSeparated = (value: string | undefined): string[] => {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(s => s);
};

// Normalize CSV data for case-insensitive field matching
const normalizeCsvData = (data: Record<string, unknown>): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};
  Object.keys(data).forEach(key => {
    normalized[key.toLowerCase()] = data[key];
  });
  return normalized;
};

// Schema for AddUsers CSV validation
const AddUsersCsvSchema = z.object({
  id: z.string().min(1, 'ID is required').trim(),
  userType: z.enum(['child', 'caregiver', 'teacher'], {
    message: 'userType must be one of: child, caregiver, teacher'
  }),
  // Required for child users
  month: z.string().optional().refine((val) => {
    if (!val) return true;
    const month = parseInt(val);
    return month >= 1 && month <= 12;
  }, 'Month must be between 1 and 12'),
  year: z.string().optional().refine((val) => {
    if (!val) return true;
    const year = parseInt(val);
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
  }, `Year must be between 1900 and ${new Date().getFullYear()}`),
  caregiverId: z.string().optional(),
  teacherId: z.string().optional(),
  site: z.string().optional(),
  cohort: z.string().optional(),
  school: z.string().optional(),
  class: z.string().optional(),
}).refine((data) => {
  // Child users must have month and year
  if (data.userType === 'child') {
    return data.month && data.year;
  }
  return true;
}, {
  message: 'Child users must have month and year',
  path: ['month', 'year']
}).refine((data) => {
  // Parse comma-separated values
  const sites = parseCommaSeparated(data.site);
  const cohorts = parseCommaSeparated(data.cohort);
  const schools = parseCommaSeparated(data.school);
  const classes = parseCommaSeparated(data.class);
  
  // Site is required for all users
  if (sites.length === 0) {
    return false;
  }
  // Must have either cohort OR school
  if (cohorts.length === 0 && schools.length === 0) {
    return false;
  }
  // If class is provided, school must also be provided
  if (classes.length > 0 && schools.length === 0) {
    return false;
  }
  
  return true;
}, {
  message: 'Site is required. Must have either cohort OR school. School required if class provided.',
  path: ['site', 'cohort', 'school', 'class']
});

// Schema for LinkUsers CSV validation
const LinkUsersCsvSchema = z.object({
  id: z.string().min(1, 'ID is required').trim(),
  userType: z.enum(['child', 'caregiver', 'teacher'], {
    message: 'userType must be one of: child, caregiver, teacher'
  }),
  uid: z.string().min(1, 'UID is required').trim(),
  // Optional relationship fields
  caregiverId: z.string().optional(),
  teacherId: z.string().optional(),
});

// Validating CSV file structure (headers)
const CsvHeadersSchema = z.object({
  headers: z.array(z.string()),
  requiredHeaders: z.array(z.string()),
  optionalHeaders: z.array(z.string()).optional(),
});

// Validation helper functions
const validateCsvData = <T>(schema: z.ZodSchema<T>, data: unknown[]): {
  success: boolean;
  data: T[];
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
} => {
  const results: T[] = [];
  const errors: Array<{ row: number; field: string; message: string }> = [];

  data.forEach((row, index) => {
    const normalizedRow = normalizeCsvData(row as Record<string, unknown>);
    const result = schema.safeParse(normalizedRow);
    if (result.success) {
      results.push(result.data);
    } else {
      result.error.issues.forEach(issue => {
        errors.push({
          row: index + 1,
          field: issue.path.join('.'),
          message: issue.message
        });
      });
    }
  });

  return {
    success: errors.length === 0,
    errors: errors,
    data: results,
  };
};

const validateAddUsersCsv = (data: unknown[]) => validateCsvData(AddUsersCsvSchema, data);
const validateLinkUsersCsv = (data: unknown[]) => validateCsvData(LinkUsersCsvSchema, data);

// Normalize CSV headers (case-insensitive)
const normalizeCsvHeaders = (headers: string[]): string[] => {
  return headers.map(header => header.toLowerCase().trim());
};

// Check if required headers are present
const validateCsvHeaders = (headers: string[], requiredHeaders: string[]): {
  success: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  data: string[];
} => {
  const normalizedHeaders = normalizeCsvHeaders(headers);
  const normalizedRequired = requiredHeaders.map(h => h.toLowerCase().trim());
  
  const missingHeaders = normalizedRequired.filter(
    required => !normalizedHeaders.includes(required)
  );

  const errors = missingHeaders.map(header => ({
    field: header,
    message: `Missing required header: ${header}`
  }));

  return {
    success: missingHeaders.length === 0,
    errors: errors,
    data: normalizedHeaders,
  };
};

// Export all schemas
export {
  AdminDataSchema,
  AddUsersCsvSchema,
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
  DistrictSchema,
  GroupSchema,
  LegalInfoSchema,
  LegalSchema,
  LinkUsersCsvSchema,
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
  UserLegalSchema,
  UserSchema,
  validateAddUsersCsv,
  validateCsvData,
  validateCsvHeaders,
  validateLinkUsersCsv,
};

// Export types derived from schemas
export type AddUsersCsvType = z.infer<typeof AddUsersCsvSchema>;
export type AdminDataType = z.infer<typeof AdminDataSchema>;
export type AdministrationType = z.infer<typeof AdministrationSchema>;
export type AssessmentConditionRuleType = z.infer<typeof AssessmentConditionRuleSchema>;
export type AssessmentConditionsType = z.infer<typeof AssessmentConditionsSchema>;
export type AssessmentType = z.infer<typeof AssessmentSchema>;
export type AssignedOrgType = z.infer<typeof AssignedOrgSchema>;
export type AssignmentAssessmentType = z.infer<typeof AssignmentAssessmentSchema>;
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
export type GroupType = z.infer<typeof GroupSchema>;
export type LegalInfoType = z.infer<typeof LegalInfoSchema>;
export type LegalType = z.infer<typeof LegalSchema>;
export type LinkUsersCsvType = z.infer<typeof LinkUsersCsvSchema>;
export type OrgAssociationMapType = z.infer<typeof OrgAssociationMapSchema>;
export type OrgRefMapType = z.infer<typeof OrgRefMapSchema>;
export type OrgType = z.infer<typeof OrgSchema>;
export type ReadOrgType = z.infer<typeof ReadOrgSchema>;
export type SchoolType = z.infer<typeof SchoolSchema>;
export type StatType = z.infer<typeof StatSchema>;
export type TimestampType = z.infer<typeof TimestampSchema>;
export type UserClaimsType = z.infer<typeof UserClaimsSchema>;
export type UserLegalType = z.infer<typeof UserLegalSchema>;
export type UserType = z.infer<typeof UserSchema>;
