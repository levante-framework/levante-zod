/**
 * Zod schemas for validating UserCsv rows
 *
 * The main entry point is `UserCsvSchema`, which validates a list of UserCsv
 * rows, where each row is a `Record<string, string>`.
 *
 * To keep separation of concerns such that this library only handles side-
 * effect-free type coercion and validation, callers are responsible for
 * parsing CSV files upstream. If a field is empty in the file, it should be
 * passed as an empty string, not `undefined` or `null`.
 *
 * @TODO: Where should CSV sanitization happen? Maybe it's already handled
 * upstream by PapaParse?
 */
import * as z from 'zod';

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
 * A string that coerces into a number (or `Number.NaN`), e.g.,
 * `"123"` -> `123`, `"foo"` -> `Number.NaN`
 */
export const NumberString = z.string().transform(Number);

/**
 * Base schema for all UserCsv rows
 */
export const UserCsvRowBase = z
  .object({
    id: z.string().trim().min(1),
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
        for (const field of ['school', 'class', 'cohort']) {
          ctx.addIssue({
            code: 'custom',
            message: 'Must have either school and class OR cohort',
            path: [field],
            input: data,
          });
        }
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
  month: NumberString.pipe(z.int().min(1).max(12)),
  year: NumberString.pipe(z.int().min(1000).max(9999)), // @TODO: Define range better?
  caregiverId: ListableString,
  teacherId: ListableString,
}).superRefine((data, ctx) => {
  // Children must have only one group
  const hasSchools = data.school && data.school.length > 1;
  const hasClasses = data.class && data.class.length > 1;
  const hasCohorts = data.cohort && data.cohort.length > 1;
  if (hasSchools || hasClasses || hasCohorts) {
    for (const field of ['school', 'class', 'cohort']) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must have only one group',
        path: [field],
        input: data,
      });
    }
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
    z.discriminatedUnion('userType', [
      CaregiverUserCsvRow,
      ChildUserCsvRow,
      TeacherUserCsvRow,
    ]),
  )
  .check(
    z.superRefine((_data, _ctx) => {
      // @TODO: inter-row validation
      // enforce unique ids?
    }),
  );
