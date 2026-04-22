import { z } from 'zod';
import { validateCsvData, validateCsvHeaders } from './csv';
import { combineIssues, formatIssueFields } from './issues';
import {
  CommaSeparatedSchema,
  MonthSchema,
  NormalizedUserTypeSchema,
  YearSchema,
} from './users';

interface AddUserBirthdateInput {
  // @CC: "So here's where I think we want to clean up some ugliness around
  // legacy ROAR terms (student, parent) vs ours (child, caregiver) - this
  // mixes the two which is not great"
  userType: 'child' | 'parent' | 'teacher';
  month?: number | undefined;
  year?: number | undefined;
}

type AddUserBirthdateOutput = AddUserBirthdateInput & Record<string, unknown>;

export const addChildUserRules = <T extends z.ZodType<AddUserBirthdateOutput>>(
  schema: T,
) =>
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
    }),
  );

/** @deprecated */
export const AddUsersCsvSchema = addChildUserRules(
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
            message:
              'Must have either cohort OR school. School required if class provided.',
            path: ['cohort'],
          });
          ctx.addIssue({
            code: 'custom',
            message:
              'Must have either cohort OR school. School required if class provided.',
            path: ['school'],
          });
        }

        if (classes.length > 0 && schools.length === 0) {
          ctx.addIssue({
            code: 'custom',
            message:
              'Must have either cohort OR school. School required if class provided.',
            path: ['class'],
          });
          ctx.addIssue({
            code: 'custom',
            message:
              'Must have either cohort OR school. School required if class provided.',
            path: ['school'],
          });
        }
      }),
    )
    .transform(({ usertype, ...rest }) => ({
      ...rest,
      userType: usertype,
    })),
);

/** @deprecated */
export const AddUsersSubmitSchema = addChildUserRules(
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
        districts: z
          .array(z.string().min(1))
          .min(1, 'At least one district is required'),
        groups: z.array(z.string().min(1)).optional(),
        schools: z.array(z.string().min(1)).optional(),
        classes: z.array(z.string().min(1)).optional(),
      })
      .refine(
        (orgIds) => {
          const hasGroups = orgIds.groups && orgIds.groups.length > 0;
          const hasSchools = orgIds.schools && orgIds.schools.length > 0;
          return hasGroups || hasSchools;
        },
        {
          message: 'Must have either groups OR schools in orgIds',
          path: ['orgIds'],
        },
      )
      .refine(
        (orgIds) => {
          const hasClasses = orgIds.classes && orgIds.classes.length > 0;
          const hasSchools = orgIds.schools && orgIds.schools.length > 0;
          if (hasClasses && !hasSchools) {
            return false;
          }
          return true;
        },
        {
          message: 'Schools required in orgIds if classes are provided',
          path: ['orgIds'],
        },
      ),
  }),
);

export const combineFieldErrors = (
  errors: Array<{ field: string; message: string }>,
): string[] => {
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

// @CC: "I think this is now impossible given the site selector (site used
// to be a column in the csv file)"
export const detectMultipleSites = (
  parsedData: Record<string, unknown>[],
): {
  hasMultipleSites: boolean;
  uniqueSites: string[];
} => {
  const siteSet = new Set<string>();

  parsedData.forEach((user) => {
    const siteField = Object.keys(user).find(
      (key) => key.toLowerCase() === 'site',
    );
    if (siteField && user[siteField]) {
      const siteValue = String(user[siteField]);
      const sites = siteValue
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      sites.forEach((site) => {
        siteSet.add(site);
      });
    }
  });

  return {
    hasMultipleSites: siteSet.size > 1,
    uniqueSites: Array.from(siteSet),
  };
};

const getChildAgeErrorFields = (
  month: number | undefined,
  year: number | undefined,
): Array<'month' | 'year'> => {
  if (!month || !year) return [];
  const birthMonth = month;
  const birthYear = year;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const yearDiff = currentYear - birthYear;

  if (yearDiff > 18) return ['month', 'year'];
  if (yearDiff < 18) return [];
  // @CC: "Wouldn't this send a month error to anyone born in the calendar
  // year before the current month? Don't we just want a check that returns a
  // month error if birthMonth>12 (or >=13)?"
  return currentMonth >= birthMonth ? ['month'] : [];
};

const normalizeFieldLabel = (field: string): string => {
  if (field === 'usertype') return 'userType';
  return field;
};

/** @deprecated */
export const validateAddUsersCsv = (data: unknown[]) =>
  validateCsvData(AddUsersCsvSchema, data);

/** @deprecated */
export const validateAddUsersFileUpload = (
  parsedData: Record<string, unknown>[],
  shouldUsePermissions: boolean,
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
    const userTypeField = Object.keys(user).find(
      (key) => key.toLowerCase() === 'usertype',
    );
    const userTypeValue = userTypeField ? user[userTypeField] : null;
    return (
      userTypeValue &&
      typeof userTypeValue === 'string' &&
      userTypeValue.toLowerCase() === 'child'
    );
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

  const headerValidation = validateCsvHeaders(
    lowerCaseHeaders,
    requiredHeaders,
  );
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
    const errorsByUser = new Map<
      Record<string, unknown>,
      Array<{ field: string; message: string }>
    >();
    validation.errors.forEach((error) => {
      const userIndex = error.row - 1;
      if (userIndex >= 0 && userIndex < parsedData.length) {
        const user = parsedData[userIndex];
        usersWithZodErrors.add(user);
        if (!errorsByUser.has(user)) {
          errorsByUser.set(user, []);
        }
        errorsByUser
          .get(user)!
          .push({ field: error.field, message: error.message });
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

  // @CC: "Just to flag that this and 301-303 should be removed once we've
  // removed permissions"
  if (!shouldUsePermissions) {
    usersWithoutId.forEach((user) => {
      if (usersWithZodErrors.has(user)) return;

      const siteField = Object.keys(user).find(
        (key) => key.toLowerCase() === 'site',
      );
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

/** @deprecated */
export const validateAddUsersSubmit = (
  data: unknown,
): {
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
