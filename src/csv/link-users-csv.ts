/**
 * Zod schemas for validating Link Users CSVs
 */
import * as z from 'zod';
import { nonEmptyString } from '../shared/non-empty-string';
import { findDuplicateIndexes } from '../util/find-duplicate-indexes';
import { makeTooBigIssue } from '../util/issues';
import { hasRequiredHeaders, ListableString } from './shared';

/**
 * The required headers for the Link Users CSV file.
 * @see {@link LinkUsersCsvHeaderSchema}
 */
export const REQUIRED_LINK_USERS_CSV_HEADERS = [
  'id',
  'userType',
  'caregiverId',
  'teacherId',
  'uid',
] as const;

/**
 * Schema for validating the headers of a Link Users CSV file.
 * @example LinkUsersCsvHeaderSchema.safeParse(headers: string[])
 */
export const LinkUsersCsvHeaderSchema = z
  .array(z.string())
  .superRefine(hasRequiredHeaders(REQUIRED_LINK_USERS_CSV_HEADERS));

/** Inferred type of {@link LinkUsersCsvHeaderSchema}. */
export type LinkUsersCsvHeader = z.infer<typeof LinkUsersCsvHeaderSchema>;

/**
 * Base schema for all Link Users CSV rows.
 *
 * `uid` is required on every row: a Link Users CSV is expected to be the
 * output of a prior Add Users workflow (which assigns each user a Firebase
 * uid), so a missing uid signals the file didn't come from that flow.
 * Only child rows carry linking info (`caregiverId`/`teacherId`); adult
 * rows (caregiver/teacher) do not.
 */
export const LinkUsersCsvRowBase = z.looseObject({
  id: nonEmptyString('Required'),
  caregiverId: ListableString,
  teacherId: ListableString,
  uid: nonEmptyString('Required'),
});

/** A `superRefine` callback that flags every adult row that has any links. */
const hasNoLinks = (
  data: { caregiverId: string[]; teacherId: string[] },
  ctx: z.RefinementCtx,
) => {
  if (data.caregiverId.length > 0) {
    ctx.addIssue(
      makeTooBigIssue({
        input: data.caregiverId,
        maximum: 0,
        origin: 'array',
        path: ['caregiverId'],
      }),
    );
  }
  if (data.teacherId.length > 0) {
    ctx.addIssue(
      makeTooBigIssue({
        input: data.teacherId,
        maximum: 0,
        origin: 'array',
        path: ['teacherId'],
      }),
    );
  }
};

/** A caregiver Link Users CSV row. */
export const CaregiverLinkUsersCsvRow = LinkUsersCsvRowBase.extend({
  userType: z.literal('caregiver'),
}).superRefine(hasNoLinks);

/** A child Link Users CSV row. */
export const ChildLinkUsersCsvRow = LinkUsersCsvRowBase.extend({
  userType: z.literal('child'),
});

/** A teacher Link Users CSV row. */
export const TeacherLinkUsersCsvRow = LinkUsersCsvRowBase.extend({
  userType: z.literal('teacher'),
}).superRefine(hasNoLinks);

/** A parsed Link Users CSV row (any user type). */
type LinkUsersCsvRow =
  | z.infer<typeof CaregiverLinkUsersCsvRow>
  | z.infer<typeof ChildLinkUsersCsvRow>
  | z.infer<typeof TeacherLinkUsersCsvRow>;

/**
 * A `superRefine` callback that flags every child row referencing a
 * `caregiverId`/`teacherId` that doesn't match the `id` of some caregiver/
 * teacher row in the same file. Emits at most one issue per child `*Id`
 * field, regardless of how many of its references are unresolved.
 */
const hasResolvableLinks = (
  data: readonly LinkUsersCsvRow[],
  ctx: z.RefinementCtx,
) => {
  const caregiverIds = new Set<string>();
  const teacherIds = new Set<string>();
  for (const row of data) {
    if (row.userType === 'caregiver') caregiverIds.add(row.id);
    else if (row.userType === 'teacher') teacherIds.add(row.id);
  }

  data.forEach((row, idx) => {
    if (row.userType !== 'child') return;
    if (row.caregiverId.some((id) => !caregiverIds.has(id))) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must match the id of a caregiver row',
        path: [idx, 'caregiverId'],
        input: row,
      });
    }
    if (row.teacherId.some((id) => !teacherIds.has(id))) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must match the id of a teacher row',
        path: [idx, 'teacherId'],
        input: row,
      });
    }
  });
};

/**
 * A schema for validating a list of Link Users CSV rows.
 * @example LinkUsersCsvSchema.safeParse(csvData: Record<string, string>[])
 */
export const LinkUsersCsvSchema = z
  .array(
    z.discriminatedUnion(
      'userType',
      [CaregiverLinkUsersCsvRow, ChildLinkUsersCsvRow, TeacherLinkUsersCsvRow],
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
  })
  .superRefine(hasResolvableLinks);

/** Inferred type of {@link LinkUsersCsvSchema}. */
export type LinkUsersCsv = z.infer<typeof LinkUsersCsvSchema>;
