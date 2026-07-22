import * as z from 'zod';

/** The required headers for the Link Users CSV file */
export const REQUIRED_LINK_USERS_CSV_HEADERS = [
  'id',
  'userType',
  'month',
  'year',
  'school',
  'class',
  'cohort',
  'email',
  'password',
  'uid',
];

/**
 * Schema for validating the headers of a Link Users CSV file
 *
 * Usage: `LinkUsersCsvHeaderSchema.safeParse(headers: string[])`
 */
export const LinkUsersCsvHeaderSchema = z
  .array(z.string())
  .superRefine((headers, ctx) => {
    for (const required of REQUIRED_LINK_USERS_CSV_HEADERS) {
      if (!headers.includes(required)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Missing required header',
          path: [required],
          input: headers,
        });
      }
    }
  });
