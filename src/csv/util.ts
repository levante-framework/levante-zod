import type * as z from 'zod';

/**
 * Combines Users CSV validation issues by field+message.
 * @param issues - The zod issues to combine
 * @returns A list of messages and the rows that caused them
 */
export const combineUsersCsvIssues = (
  issues: z.core.$ZodIssue[],
): Array<{ message: string; rowNums: number[] }> => {
  const rowIssues = issues.filter((issue) => issue.path.length > 0);

  const combined = new Map<string, { rows: Set<number>; idx: number }>();
  rowIssues.forEach((issue, idx) => {
    const path = [...issue.path];
    const rowNum = Number(path.shift());
    if (Number.isNaN(rowNum)) return;
    const field = path.join('.');
    const detail = issue.message ?? 'Invalid';
    const message = field ? `${field}: ${detail}` : detail;

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
