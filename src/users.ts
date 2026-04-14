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
