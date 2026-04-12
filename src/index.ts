import { z } from 'zod';
import { cellToLatLng, getResolution } from 'h3-js';
import { normalizeCsvData, normalizeCsvHeaders, validateCsvData, validateCsvHeaders } from './csv';
import { combineIssues, formatIssueFields } from './issues';

// Type alias for Firestore Timestamp
const TimestampSchema = z.iso.datetime();

const LatLonSourceSchema = z.enum(['gps', 'h3_center', 'approximate']);

const H3CellSchema = z.object({
  cellId: z.string().min(1),
  resolution: z.number().int().min(0).max(15),
});

const LocationSchema = z.object({
  schemaVersion: z.literal('location_v1'),
  latLon: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    source: LatLonSourceSchema,
    blurRadiusMeters: z.number().positive().optional(),
  }).optional(),
  h3: z.object({
    scheme: z.literal('h3_v1'),
    baseline: H3CellSchema,
    effective: H3CellSchema,
    populationThreshold: z.number().int().positive(),
  }),
  populationSource: z.enum(['kontur', 'worldpop', 'unknown']).optional(),
  computedAt: z.iso.datetime().optional(),
}).check(z.superRefine((value, ctx) => {
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

  if (value.latLon?.source === 'approximate' && !value.latLon.blurRadiusMeters) {
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
        message: 'latLon must match effective H3 center when source is h3_center',
      });
    }
  }
}));

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

const parseCommaSeparated = (value: string | undefined): string[] => {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(s => s);
};

const getChildAgeErrorFields = (month: number | undefined, year: number | undefined): Array<'month' | 'year'> => {
  if (!month || !year) return [];
  const birthMonth = month;
  const birthYear = year;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const yearDiff = currentYear - birthYear;

  if (yearDiff > 18) return ['month', 'year'];
  if (yearDiff < 18) return [];
  return currentMonth >= birthMonth ? ['month'] : [];
};

const NormalizedUserTypeSchema = z
  .string()
  .trim()
  .min(1, 'userType is required')
  .transform((value) => value.toLowerCase())
  .transform((value) => (value === 'caregiver' ? 'parent' : value))
  .pipe(
    z.enum(['child', 'parent', 'teacher'], {
      message: 'userType must be one of: child, caregiver, teacher',
    }),
  );

const MonthSchema = z
  .union([z.string(), z.number(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    return typeof value === 'number' ? value : Number(value);
  })
  .pipe(
    z
      .number()
      .int()
      .min(1, 'Month must be between 1 and 12')
      .max(12, 'Month must be between 1 and 12')
      .optional()
  );

const YearSchema = z
  .union([z.string(), z.number(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    return typeof value === 'number' ? value : Number(value);
  })
  .pipe(
    z
      .number()
      .int()
      .min(1000, 'Year must be a four-digit number')
      .max(9999, 'Year must be a four-digit number')
      .optional()
  );

const CommaSeparatedSchema = z
  .union([z.string(), z.undefined()])
  .transform((value) => parseCommaSeparated(value));

interface AddUserBirthdateInput {
  userType: 'child' | 'parent' | 'teacher';
  month?: number | undefined;
  year?: number | undefined;
}

type AddUserBirthdateOutput = AddUserBirthdateInput & Record<string, unknown>;

const addChildUserRules = <T extends z.ZodType<AddUserBirthdateOutput>>(schema: T) =>
  schema.check(
    z.superRefine((data: AddUserBirthdateOutput, ctx) => {
      if (data.userType === 'child' && (!data.month || !data.year)) {
        const isMissingMonth = !data.month;
        const isMissingYear = !data.year;

        if (isMissingMonth) {
          ctx.addIssue({
            code: 'custom',
            message: 'Child users must have month and year',
            path: ['month'],
          });
        }
        if (isMissingYear) {
          ctx.addIssue({
            code: 'custom',
            message: 'Child users must have month and year',
            path: ['year'],
          });
        }
      }

      const ageErrorFields = getChildAgeErrorFields(data.month, data.year);
      if (data.userType === 'child' && ageErrorFields.length > 0) {
        ageErrorFields.forEach((field) => {
          ctx.addIssue({
            code: 'custom',
            message: 'Child users must be under 18 years old',
            path: [field],
          });
        });
      }
    })
  );

const AddUsersCsvSchema = addChildUserRules(
  z
    .object({
      id: z.string().trim().optional(),
      usertype: NormalizedUserTypeSchema,
      month: MonthSchema,
      year: YearSchema,
      caregiverId: z.string().optional(),
      teacherId: z.string().optional(),
      site: z.string().optional(),
      cohort: CommaSeparatedSchema,
      school: CommaSeparatedSchema,
      class: CommaSeparatedSchema,
    })
    .check(
      z.superRefine((data, ctx) => {
        const cohorts = data.cohort;
        const schools = data.school;
        const classes = data.class;

        if (cohorts.length === 0 && schools.length === 0) {
          ctx.addIssue({
            code: 'custom',
            message: 'Must have either cohort OR school. School required if class provided.',
            path: ['cohort'],
          });
          ctx.addIssue({
            code: 'custom',
            message: 'Must have either cohort OR school. School required if class provided.',
            path: ['school'],
          });
        }

        if (classes.length > 0 && schools.length === 0) {
          ctx.addIssue({
            code: 'custom',
            message: 'Must have either cohort OR school. School required if class provided.',
            path: ['class'],
          });
          ctx.addIssue({
            code: 'custom',
            message: 'Must have either cohort OR school. School required if class provided.',
            path: ['school'],
          });
        }
      })
    )
    .transform(({ usertype, ...rest }) => ({
      ...rest,
      userType: usertype,
    }))
);

const AddUsersSubmitSchema = addChildUserRules(
  z.object({
    id: z.string().trim().optional(),
    userType: NormalizedUserTypeSchema,
    month: MonthSchema,
    year: YearSchema,
    caregiverId: z.string().optional(),
    teacherId: z.string().optional(),
    parentId: z.string().optional(),
    orgIds: z
      .object({
        districts: z.array(z.string().min(1)).min(1, 'At least one district is required'),
        groups: z.array(z.string().min(1)).optional(),
        schools: z.array(z.string().min(1)).optional(),
        classes: z.array(z.string().min(1)).optional(),
      })
      .refine((orgIds) => {
        const hasGroups = orgIds.groups && orgIds.groups.length > 0;
        const hasSchools = orgIds.schools && orgIds.schools.length > 0;
        return hasGroups || hasSchools;
      }, {
        message: 'Must have either groups OR schools in orgIds',
        path: ['orgIds']
      })
      .refine((orgIds) => {
        const hasClasses = orgIds.classes && orgIds.classes.length > 0;
        const hasSchools = orgIds.schools && orgIds.schools.length > 0;
        if (hasClasses && !hasSchools) {
          return false;
        }
        return true;
      }, {
        message: 'Schools required in orgIds if classes are provided',
        path: ['orgIds']
      }),
  })
);

const LinkUsersCsvSchema = z
  .object({
    id: z.string().min(1, 'ID is required').trim(),
    usertype: NormalizedUserTypeSchema,
    uid: z.string().min(1, 'UID is required').trim(),
    caregiverId: z.string().optional(),
    teacherId: z.string().optional(),
  })
  .transform(({ usertype, ...rest }) => ({
    ...rest,
    userType: usertype,
  }));

const CsvHeadersSchema = z.object({
  headers: z.array(z.string()),
  requiredHeaders: z.array(z.string()),
  optionalHeaders: z.array(z.string()).optional(),
});

const normalizeFieldLabel = (field: string): string => {
  if (field === 'usertype') return 'userType';
  return field;
};

const combineFieldErrors = (errors: Array<{ field: string; message: string }>): string[] => {
  const grouped = new Map<string, { fields: Set<string>; order: number }>();

  errors.forEach((error, index) => {
    const message = error.message ?? 'Invalid input';
    if (message.trim() === '') return;

    if (!grouped.has(message)) {
      grouped.set(message, { fields: new Set(), order: index });
    }

    if (error.field) {
      grouped.get(message)!.fields.add(normalizeFieldLabel(error.field));
    }
  });

  return Array.from(grouped.entries())
    .sort((a, b) => a[1].order - b[1].order)
    .map(([message, data]) => {
      const field = formatIssueFields(Array.from(data.fields));
      return field ? `${field}: ${message}` : message;
    });
};

const validateAddUsersCsv = (data: unknown[]) => validateCsvData(AddUsersCsvSchema, data);
const validateLinkUsersCsv = (data: unknown[]) => validateCsvData(LinkUsersCsvSchema, data);

const validateAddUsersSubmit = (data: unknown): {
  success: boolean;
  data?: z.infer<typeof AddUsersSubmitSchema>;
  errors: Array<{
    field: string;
    message: string;
  }>;
} => {
  const result = AddUsersSubmitSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: [],
    };
  }

  const errors = combineIssues(result.error.issues);

  return {
    success: false,
    errors,
  };
};

const detectMultipleSites = (parsedData: Record<string, unknown>[]): {
  hasMultipleSites: boolean;
  uniqueSites: string[];
} => {
  const siteSet = new Set<string>();

  parsedData.forEach((user) => {
    const siteField = Object.keys(user).find((key) => key.toLowerCase() === 'site');
    if (siteField && user[siteField]) {
      const siteValue = String(user[siteField]);
      const sites = siteValue
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      sites.forEach(site => siteSet.add(site));
    }
  });

  return {
    hasMultipleSites: siteSet.size > 1,
    uniqueSites: Array.from(siteSet),
  };
};

const locationDocId = (location: Pick<z.infer<typeof LocationSchema>, 'schemaVersion' | 'h3'>): string => {
  const version = location.schemaVersion.replace(/^location_/, '');
  return `h3:${location.h3.effective.cellId}:t:${location.h3.populationThreshold}:${version}`;
};

const validateAddUsersFileUpload = (
  parsedData: Record<string, unknown>[],
  shouldUsePermissions: boolean
): {
  success: boolean;
  errors: Array<{
    user: Record<string, unknown>;
    error: string;
  }>;
  data: Record<string, unknown>[];
  hasMultipleSites: boolean;
  uniqueSites: string[];
  headerErrors?: Array<{
    field: string;
    message: string;
  }>;
} => {
  if (!parsedData || parsedData.length === 0) {
    return {
      success: false,
      errors: [],
      data: [],
      hasMultipleSites: false,
      uniqueSites: [],
    };
  }

  const firstRow = parsedData[0];
  const headers = Object.keys(firstRow);
  const lowerCaseHeaders = headers.map((col) => col.toLowerCase());

  const requiredHeaders = ['usertype'];
  const hasChild = parsedData.some((user) => {
    const userTypeField = Object.keys(user).find((key) => key.toLowerCase() === 'usertype');
    const userTypeValue = userTypeField ? user[userTypeField] : null;
    return userTypeValue && typeof userTypeValue === 'string' && userTypeValue.toLowerCase() === 'child';
  });

  if (hasChild) {
    requiredHeaders.push('month', 'year');
  }

  const hasCohort = lowerCaseHeaders.includes('cohort');
  const hasSchool = lowerCaseHeaders.includes('school');
  if (!hasCohort && !hasSchool) {
    requiredHeaders.push('cohort', 'school');
  }

  if (!shouldUsePermissions) {
    requiredHeaders.push('site');
  }

  const headerValidation = validateCsvHeaders(lowerCaseHeaders, requiredHeaders);
  if (!headerValidation.success) {
    return {
      success: false,
      errors: [],
      data: [],
      hasMultipleSites: false,
      uniqueSites: [],
      headerErrors: headerValidation.errors,
    };
  }

  const usersWithoutId = parsedData.filter((user) => {
    const idField = Object.keys(user).find((key) => key.toLowerCase() === 'id');
    return !idField || !user[idField];
  });

  const validation = validateAddUsersCsv(parsedData);
  const siteInfo = detectMultipleSites(parsedData);

  const usersWithZodErrors = new Set<Record<string, unknown>>();
  const errors: Array<{ user: Record<string, unknown>; error: string }> = [];

  if (!validation.success) {
    const errorsByUser = new Map<Record<string, unknown>, Array<{ field: string; message: string }>>();
    validation.errors.forEach((error) => {
      const userIndex = error.row - 1;
      if (userIndex >= 0 && userIndex < parsedData.length) {
        const user = parsedData[userIndex];
        usersWithZodErrors.add(user);
        if (!errorsByUser.has(user)) {
          errorsByUser.set(user, []);
        }
        errorsByUser.get(user)!.push({ field: error.field, message: error.message });
      }
    });
    errorsByUser.forEach((userErrors, user) => {
      const errorMessages = combineFieldErrors(userErrors);
      errors.push({
        user,
        error: errorMessages.join('; '),
      });
    });
  }

  if (!shouldUsePermissions) {
    usersWithoutId.forEach((user) => {
      if (usersWithZodErrors.has(user)) return;

      const siteField = Object.keys(user).find((key) => key.toLowerCase() === 'site');
      const siteValue = siteField ? user[siteField] : null;
      const hasSite =
        siteValue &&
        String(siteValue)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s).length > 0;

      if (!hasSite) {
        errors.push({
          user,
          error: 'Site: Site is required',
        });
      }
    });
  }

  return {
    success: errors.length === 0,
    errors,
    data: parsedData,
    hasMultipleSites: siteInfo.hasMultipleSites,
    uniqueSites: siteInfo.uniqueSites,
  };
};

export {
  AdminDataSchema,
  AddUsersCsvSchema,
  AddUsersSubmitSchema,
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
  H3CellSchema,
  GroupSchema,
  LegalInfoSchema,
  LegalSchema,
  LatLonSourceSchema,
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
  UserLegalSchema,
  UserSchema,
  validateAddUsersCsv,
  validateAddUsersFileUpload,
  validateAddUsersSubmit,
  validateCsvData,
  validateCsvHeaders,
  validateLinkUsersCsv,
};

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
export type UserLegalType = z.infer<typeof UserLegalSchema>;
export type UserType = z.infer<typeof UserSchema>;
