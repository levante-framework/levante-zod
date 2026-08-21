/**
 * Zod schemas for validating Add Users CSVs
 */
import * as z from 'zod';
import { nonEmptyString } from '../shared/non-empty-string';
import { findDuplicateIndexes } from '../util/find-duplicate-indexes';
import { hasRequiredHeaders, ListableString, NumberString } from './shared';

/** The maximum year for a child user. */
export const CHILD_YEAR_MAX = new Date().getFullYear() - 2;

/** The minimum year for a child user. */
export const CHILD_YEAR_MIN = new Date().getFullYear() - 18;

/**
 * The required headers for the Add Users CSV file.
 * @see {@link AddUsersCsvHeaderSchema}
 */
export const REQUIRED_ADD_USERS_CSV_HEADERS = [
  'id',
  'userType',
  'month',
  'year',
  'school',
  'class',
  'cohort',
] as const;

/**
 * Schema for validating the headers of an Add Users CSV file.
 * @example AddUsersCsvHeaderSchema.safeParse(headers: string[])
 */
export const AddUsersCsvHeaderSchema = z
  .array(z.string())
  .superRefine(hasRequiredHeaders(REQUIRED_ADD_USERS_CSV_HEADERS));

/** Inferred type of {@link AddUsersCsvHeaderSchema}. */
export type AddUsersCsvHeader = z.infer<typeof AddUsersCsvHeaderSchema>;

/** Base schema for all Add Users CSV rows. */
export const AddUsersCsvRowBase = z
  .looseObject({
    id: nonEmptyString('Required'),
    school: ListableString,
    class: ListableString,
    cohort: ListableString,
  })
  .superRefine((data, ctx) => {
    // All users must have school+class XOR cohort. A stray school or class
    // alongside a cohort (or a school without a class, or vice versa) is
    // invalid.
    const hasSchool = data.school.length > 0;
    const hasClass = data.class.length > 0;
    const hasCohort = data.cohort.length > 0;
    const isSchoolClass = hasSchool && hasClass && !hasCohort;
    const isCohort = hasCohort && !hasSchool && !hasClass;
    if (!isSchoolClass && !isCohort) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must have either school and class OR cohort',
        path: ['school|class|cohort'],
        input: data,
      });
    }
  });

/** A caregiver Add Users CSV row. */
export const CaregiverAddUsersCsvRow = AddUsersCsvRowBase.extend({
  userType: z.literal('caregiver'),
});

/** A child Add Users CSV row. */
export const ChildAddUsersCsvRow = AddUsersCsvRowBase.extend({
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
  const hasSchools = data.school.length > 1;
  const hasClasses = data.class.length > 1;
  const hasCohorts = data.cohort.length > 1;
  if (hasSchools || hasClasses || hasCohorts) {
    ctx.addIssue({
      code: 'custom',
      message: 'Must have only one group',
      path: ['school|class|cohort'],
      input: data,
    });
  }
});

/** A teacher Add Users CSV row. */
export const TeacherAddUsersCsvRow = AddUsersCsvRowBase.extend({
  userType: z.literal('teacher'),
});

/**
 * A schema for validating a parsed Add Users CSV file.
 * @example AddUsersCsvSchema.safeParse(csvData: Record<string, string>[])
 */
export const AddUsersCsvSchema = z
  .array(
    z.discriminatedUnion(
      'userType',
      [CaregiverAddUsersCsvRow, ChildAddUsersCsvRow, TeacherAddUsersCsvRow],
      { message: 'Must be caregiver, child, or teacher' },
    ),
  )
  .superRefine((data, ctx) => {
    // Users must have unique ids
    for (const idx of findDuplicateIndexes(data.map((user) => user.id))) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be unique',
        path: [idx, 'id'],
        input: data[idx],
      });
    }
  });

/** Inferred type of {@link AddUsersCsvSchema}. */
export type AddUsersCsv = z.infer<typeof AddUsersCsvSchema>;
