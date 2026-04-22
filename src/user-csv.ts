/**
 * Zod schemas for validating UserCsv headers and rows
 *
 * To validate the headers of a UserCsv file, use `AddUserCsvHeaderSchema`.
 *
 * To validate the rows of a UserCsv file, use `UserCsvSchema`.
 *
 * To keep separation of concerns such that this library only handles side-
 * effect-free type coercion and validation, callers are responsible for
 * parsing CSV files upstream. If a field is empty in the file, it should be
 * passed as an empty string, not `undefined` or `null`.
 */
import * as z from 'zod';

/** The maximum year for a child user */
export const CHILD_YEAR_MAX = new Date().getFullYear() - 2;

/** The minimum year for a child user */
export const CHILD_YEAR_MIN = new Date().getFullYear() - 18;

/** The required headers for the Add Users CSV file */
export const REQUIRED_ADD_USER_CSV_HEADERS = [
  'id',
  'userType',
  'month',
  'year',
  'school',
  'class',
  'cohort',
];

/**
 * Schema for validating the headers of an Add Users CSV file
 *
 * Usage: `AddUserCsvHeaderSchema.safeParse(headers: string[])`
 */
export const AddUserCsvHeaderSchema = z.array(z.string()).check(
  z.superRefine((headers, ctx) => {
    for (const required of REQUIRED_ADD_USER_CSV_HEADERS) {
      if (!headers.includes(required)) {
        ctx.addIssue({
          code: 'custom',
          message: `Missing required header`,
          path: [required],
          input: headers,
        });
      }
    }
  }),
);

/**
 * A string of comma-separated values that parses into a list of trimmed,
 * non-empty strings, e.g., `"foo,bar,baz"` -> `["foo","bar","baz"]`
 */
export const ListableString = z.string().transform((value) => {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
});

/**
 * A required string, i.e., not empty or whitespace-only
 */
export const NonEmptyString = (message: string = 'Required') => {
  // NB: pipe() forces type check to abort on failure instead of
  // running proceeding checks in parallel
  return z.string().pipe(z.string().trim().nonempty(message));
};

/**
 * A string that coerces into a number (or `Number.NaN`), e.g.,
 * `"123"` -> `123`, `"foo"` -> `Number.NaN`
 */
export const NumberString = (message: string = 'Required') => {
  // NB: NonEmptyString() prevents '' from being coerced to 0
  return NonEmptyString(message).transform(Number);
};

/**
 * Base schema for all UserCsv rows
 */
export const UserCsvRowBase = z
  .object({
    id: NonEmptyString(),
    school: ListableString,
    class: ListableString,
    cohort: ListableString,
  })
  .check(
    z.superRefine((data, ctx) => {
      // All users must have either school+class xor cohort
      const hasSchoolClass =
        data.school &&
        data.school.length > 0 &&
        data.class &&
        data.class.length > 0;
      const hasCohort = data.cohort && data.cohort.length > 0;
      const hasAtLeastOneGroup = hasSchoolClass || hasCohort;
      const hasBothGroupTypes = hasSchoolClass && hasCohort;
      if (!hasAtLeastOneGroup || hasBothGroupTypes) {
        ctx.addIssue({
          code: 'custom',
          message: 'Must have either school and class OR cohort',
          path: ['school|class|cohort'],
          input: data,
        });
      }
    }),
  )
  .loose(); // Pass through unknown props

/**
 * A caregiver UserCsv row
 */
export const CaregiverUserCsvRow = UserCsvRowBase.extend({
  userType: z.literal('caregiver'),
});

/**
 * A child UserCsv row
 */
export const ChildUserCsvRow = UserCsvRowBase.extend({
  userType: z.literal('child'),
  month: NumberString('Required for child users').pipe(
    z.int('Must be a number').min(1, 'Must be >=1').max(12, 'Must be <=12'),
  ),
  year: NumberString('Required for child users').pipe(
    z
      .int('Must be a number')
      .min(CHILD_YEAR_MIN, `Must be >=${CHILD_YEAR_MIN}`)
      .max(CHILD_YEAR_MAX, `Must be <=${CHILD_YEAR_MAX}`),
  ),
  caregiverId: ListableString,
  teacherId: ListableString,
}).superRefine((data, ctx) => {
  // Children must have only one group
  const hasSchools = data.school && data.school.length > 1;
  const hasClasses = data.class && data.class.length > 1;
  const hasCohorts = data.cohort && data.cohort.length > 1;
  if (hasSchools || hasClasses || hasCohorts) {
    ctx.addIssue({
      code: 'custom',
      message: 'Must have only one group',
      path: ['school|class|cohort'],
      input: data,
    });
  }
});

/**
 * A teacher UserCsv row
 */
export const TeacherUserCsvRow = UserCsvRowBase.extend({
  userType: z.literal('teacher'),
});

/**
 * A schema for validating a list of UserCsv rows
 *
 * Usage: `UserCsvSchema.safeParse(csvData: Record<string, string>[])`
 */
export const UserCsvSchema = z
  .array(
    z.discriminatedUnion(
      'userType',
      [CaregiverUserCsvRow, ChildUserCsvRow, TeacherUserCsvRow],
      { message: 'Must be caregiver, child, or teacher' },
    ),
  )
  .check(
    z.superRefine((data, ctx) => {
      // All users must have a unique id
      const seen = new Map<string, number[]>();
      data.forEach((row, idx) => {
        if (row.id === '') return;
        const rows = seen.get(row.id) ?? [];
        rows.push(idx);
        seen.set(row.id, rows);
      });

      for (const rowIdxs of seen.values()) {
        if (rowIdxs.length < 2) continue;
        rowIdxs.forEach((idx) => {
          ctx.addIssue({
            code: 'custom',
            message: 'Must be unique',
            path: [idx, 'id'],
            input: data[idx],
          });
        });
      }
    }),
  );

/**
 * Combines UserCsv validation issues by field+message
 * @param issues - The zod issues to combine
 * @returns A list of messages and the rows that caused them
 */
export const combineUserCsvIssues = (
  issues: z.core.$ZodIssue[],
): Array<{ message: string; rowNums: number[] }> => {
  const rowIssues = issues.filter((issue) => issue.path.length > 0);

  const combined = new Map<string, { rows: Set<number>; idx: number }>();
  rowIssues.forEach((issue, idx) => {
    const path = [...issue.path];
    const rowNum = Number(path.shift());
    if (Number.isNaN(rowNum)) return;
    const message = `${path.join('.')}: ${issue.message ?? 'Invalid'}`;

    if (!combined.has(message)) {
      combined.set(message, { rows: new Set(), idx });
    }

    combined.get(message)!.rows.add(rowNum);
  });

  return Array.from(combined.entries())
    .sort((a, b) => a[1].idx - b[1].idx)
    .map(([message, data]) => ({
      message,
      rowNums: Array.from(data.rows)
        .sort((a, b) => a - b)
        .map((v) => v + 2), // NB: offset for header row and 1-indexing
    }));
};
