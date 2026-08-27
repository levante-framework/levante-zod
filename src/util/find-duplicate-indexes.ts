/**
 * Returns the indexes of every value that appears more than once.
 *
 * Empty strings are skipped by default, since fields that are required
 * upstream would produce a redundant "duplicate" issue on top of the
 * "required" one. Pass `includeEmpty = true` to include them.
 */
export function findDuplicateIndexes(
  values: string[],
  includeEmpty = false,
): number[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!includeEmpty && value === '') continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return values.flatMap((value, idx) => {
    if (!includeEmpty && value === '') return [];
    return counts.get(value) === 1 ? [] : [idx];
  });
}
