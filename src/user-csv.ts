/**
 * Schemas for validating UserCsv rows
 */
import * as z from 'zod';

/**
 * A string of comma-separated values
 */
export const ListableString = z.string().transform((value) => {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
});

/**
 * Base schema for all UserCsv rows
 */
export const UserCsvRowBase = z
  .object({
    id: z.string().trim().min(1),
    school: ListableString.optional(),
    class: ListableString.optional(),
    cohort: ListableString.optional(),
  })
  .check(
    z.superRefine((data, ctx) => {
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
  .loose();

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
  month: z.int().min(1).max(12),
  year: z.int().min(1000).max(9999),
  caregiverId: ListableString.optional(),
  teacherId: ListableString.optional(),
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
 * A list of UserCsv rows
 */
export const UserCsv = z
  .array(
    z.discriminatedUnion('userType', [
      CaregiverUserCsvRow,
      ChildUserCsvRow,
      TeacherUserCsvRow,
    ]),
  )
  .check(
    z.superRefine((_data, _ctx) => {
      // TODO inter-row validation
    }),
  );
export type UserCsv = z.infer<typeof UserCsv>;
