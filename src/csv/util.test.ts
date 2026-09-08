import { describe, expect, it } from 'vitest';
import type * as z from 'zod';
import { combineUsersCsvIssues } from './util';

/** Fixture: returns a minimal zod issue */
const $makeIssue = (
  path: PropertyKey[],
  message: string | undefined,
): z.core.$ZodIssue =>
  ({
    code: 'custom',
    path,
    message,
    input: undefined,
  }) as unknown as z.core.$ZodIssue;

describe('combineUsersCsvIssues', () => {
  it('returns an empty array for no issues', () => {
    expect(combineUsersCsvIssues([])).toEqual([]);
  });

  it('formats a single row-scoped issue as "path: message"', () => {
    const result = combineUsersCsvIssues([$makeIssue([0, 'id'], 'Required')]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2] }]);
  });

  it('offsets rowNum by +2 (header row + 1-indexing)', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([5, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2, 7] }]);
  });

  it('joins multi-segment paths with "."', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([0, 'nested', 'field'], 'Invalid'),
    ]);
    expect(result).toEqual([
      { message: 'nested.field: Invalid', rowNums: [2] },
    ]);
  });

  it('combines issues w/ the same message across multiple rows', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([1, 'id'], 'Required'),
      $makeIssue([2, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2, 3, 4] }]);
  });

  it('deduplicates rowNums when the same row has duplicate messages', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([1, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2, 3] }]);
  });

  it('sorts rowNums ascending regardless of issue order', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([7, 'id'], 'Required'),
      $makeIssue([1, 'id'], 'Required'),
      $makeIssue([3, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [3, 5, 9] }]);
  });

  it('separates issues w/ different messages into distinct entries', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([0, 'year'], 'Must be a number'),
    ]);
    expect(result).toEqual([
      { message: 'id: Required', rowNums: [2] },
      { message: 'year: Must be a number', rowNums: [2] },
    ]);
  });

  it('separates issues w/ same field but different messages', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([0, 'year'], 'Must be >=1000'),
      $makeIssue([1, 'year'], 'Must be <=9999'),
    ]);
    expect(result).toEqual([
      { message: 'year: Must be >=1000', rowNums: [2] },
      { message: 'year: Must be <=9999', rowNums: [3] },
    ]);
  });

  it('preserves order of first occurrence across messages', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([0, 'year'], 'Must be >=1000'),
      $makeIssue([1, 'id'], 'Required'),
      $makeIssue([2, 'year'], 'Must be >=1000'),
    ]);
    expect(result).toEqual([
      { message: 'year: Must be >=1000', rowNums: [2, 4] },
      { message: 'id: Required', rowNums: [3] },
    ]);
  });

  it('filters out issues w/ empty path', () => {
    const result = combineUsersCsvIssues([
      $makeIssue([], 'Root-level error'),
      $makeIssue([0, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2] }]);
  });

  it('skips issues whose first path segment is not a number', () => {
    const result = combineUsersCsvIssues([
      $makeIssue(['notARow', 'id'], 'Required'),
      $makeIssue([0, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2] }]);
  });

  it('defaults missing issue.message to "Invalid"', () => {
    const result = combineUsersCsvIssues([$makeIssue([0, 'id'], undefined)]);
    expect(result).toEqual([{ message: 'id: Invalid', rowNums: [2] }]);
  });

  it('omits the field prefix for issues w/ only a row number', () => {
    const result = combineUsersCsvIssues([$makeIssue([0], 'Something broke')]);
    expect(result).toEqual([{ message: 'Something broke', rowNums: [2] }]);
  });
});
