import type { z } from 'zod';
import { combineIssues } from './issues';

const csvFieldMap: Record<string, string> = {
  id: 'id',
  uid: 'uid',
  usertype: 'usertype',
  usertypeid: 'usertype',
  month: 'month',
  year: 'year',
  caregiverid: 'caregiverId',
  teacherid: 'teacherId',
  parentid: 'parentId',
  site: 'site',
  cohort: 'cohort',
  school: 'school',
  class: 'class',
};

export const normalizeCsvData = (
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};
  Object.keys(data).forEach((key) => {
    const value = data[key];
    const normalizedKey = csvFieldMap[key.toLowerCase()] ?? key;
    normalized[normalizedKey] =
      value === '' || value === null ? undefined : value;
  });
  return normalized;
};

export const normalizeCsvHeaders = (headers: string[]): string[] => {
  return headers.map((header) => header.toLowerCase().trim());
};

export const validateCsvData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown[],
): {
  success: boolean;
  data: T[];
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
} => {
  const results: T[] = [];
  const errors: Array<{ row: number; field: string; message: string }> = [];

  data.forEach((row, index) => {
    const normalizedRow = normalizeCsvData(row as Record<string, unknown>);
    const result = schema.safeParse(normalizedRow);
    if (result.success) {
      results.push(result.data);
    } else {
      const combinedIssues = combineIssues(result.error.issues);
      combinedIssues.forEach((issue) => {
        errors.push({
          row: index + 1,
          field: issue.field,
          message: issue.message,
        });
      });
    }
  });

  return {
    success: errors.length === 0,
    errors: errors,
    data: results,
  };
};

export const validateCsvHeaders = (
  headers: string[],
  requiredHeaders: string[],
): {
  success: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  data: string[];
} => {
  const normalizedHeaders = normalizeCsvHeaders(headers);
  const normalizedRequired = requiredHeaders.map((h) => h.toLowerCase().trim());

  const missingHeaders = normalizedRequired.filter(
    (required) => !normalizedHeaders.includes(required),
  );

  const errors = missingHeaders.map((header) => ({
    field: header,
    message: `Missing required header: ${header}`,
  }));

  return {
    success: missingHeaders.length === 0,
    errors: errors,
    data: normalizedHeaders,
  };
};
