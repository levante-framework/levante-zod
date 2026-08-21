/** Returns the indexes of every value that appears more than once. */
export function findDuplicateIndexes(values: string[]): number[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return values.flatMap((value, idx) => (counts.get(value) === 1 ? [] : [idx]));
}
