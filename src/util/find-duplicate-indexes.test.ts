import { describe, expect, it } from 'vitest';
import { findDuplicateIndexes } from './find-duplicate-indexes';

describe('findDuplicateIndexes', () => {
  it('returns an empty array for an empty input', () => {
    expect(findDuplicateIndexes([])).toEqual([]);
  });

  it('returns an empty array when all values are unique', () => {
    expect(findDuplicateIndexes(['a', 'b', 'c'])).toEqual([]);
  });

  it('returns every index of a duplicated value', () => {
    expect(findDuplicateIndexes(['a', 'a'])).toEqual([0, 1]);
  });

  it('includes all occurrences of a value repeated 3+ times', () => {
    expect(findDuplicateIndexes(['a', 'a', 'a'])).toEqual([0, 1, 2]);
  });

  it('preserves input order and flags multiple duplicate groups', () => {
    expect(findDuplicateIndexes(['a', 'b', 'a', 'c', 'b'])).toEqual([
      0, 1, 2, 4,
    ]);
  });

  it('leaves unique values out while flagging duplicates', () => {
    expect(findDuplicateIndexes(['x', 'y', 'y', 'z'])).toEqual([1, 2]);
  });

  it('treats the empty string like any other value', () => {
    expect(findDuplicateIndexes(['', '', 'a'])).toEqual([0, 1]);
  });
});
