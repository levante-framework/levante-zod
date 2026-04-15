import { z } from 'zod';

export const parseCommaSeparated = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s);
};

export const CommaSeparatedSchema = z
  .union([z.string(), z.undefined()])
  .transform((value) => parseCommaSeparated(value));

export const MonthSchema = z
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
      .optional(),
  );

// @CC: "There's some math done in users-add that could be moved here?
// It's not just that this should be a four digit number; it's that the min max
// range should be between currentYear-2 and currentYear-18 (i.e., child users
// must be between 2years old and 18 years old - the current check already
// doesn't take month into account, i.e., would reject a 17yo born in July
// because their birth year is 2008)"
export const YearSchema = z
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
      .optional(),
  );

// @CC: "Why is this converting caregiver to parent? and not child to
// student?"
export const NormalizedUserTypeSchema = z
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
