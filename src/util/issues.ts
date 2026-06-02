import type { z } from 'zod';

export type ZodIssue = z.core.$ZodIssue;

/** @deprecated */
export const combineIssues = (
  issues: z.ZodIssue[],
): Array<{ field: string; message: string }> => {
  const grouped = new Map<string, { fields: Set<string>; order: number }>();

  issues.forEach((issue, index) => {
    const message = issue.message ?? 'Invalid input';
    if (message.trim() === '') return;
    const field = issue.path.join('.');

    if (!grouped.has(message)) {
      grouped.set(message, { fields: new Set(), order: index });
    }

    if (field) {
      grouped.get(message)!.fields.add(field);
    }
  });

  return Array.from(grouped.entries())
    .sort((a, b) => a[1].order - b[1].order)
    .map(([message, data]) => ({
      field: formatIssueFields(Array.from(data.fields)),
      message,
    }));
};

/** @deprecated */
export const formatIssueFields = (fields: string[]): string => {
  const uniqueFields = Array.from(new Set(fields));
  const hasMonth = uniqueFields.includes('month');
  const hasYear = uniqueFields.includes('year');
  const remainingFields = uniqueFields.filter(
    (field) => field !== 'month' && field !== 'year',
  );

  if (hasMonth && hasYear) {
    remainingFields.unshift('month and year');
  } else if (hasMonth) {
    remainingFields.unshift('month');
  } else if (hasYear) {
    remainingFields.unshift('year');
  }

  return remainingFields.join(', ');
};

/**
 * Creates a custom Zod issue
 * @param props.input - The input value that caused the issue
 * @param props.message - A message describing the issue
 * @param props.path - The path of the input value that caused the issue
 * @param props.params - Optional passthrough parameters, e.g., `{ minLength: 8, actual: val.length }`
 */
export function makeCustomIssue(props: {
  input: unknown;
  message: string;
  path: (string | number | symbol)[];
  params?: Record<string, unknown>;
}): z.core.$ZodIssueCustom {
  const { input, message, path, params } = props;
  return {
    code: 'custom',
    input,
    message,
    path,
    ...(params !== undefined && { params }),
  };
}
