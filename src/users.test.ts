import { describe, expect, it } from 'vitest';
import {
  CommaSeparatedSchema,
  MonthSchema,
  NormalizedUserTypeSchema,
  parseCommaSeparated,
  YearSchema,
} from './users';

describe('parseCommaSeparated', () => {
  it('returns an empty array for undefined', () => {
    expect(parseCommaSeparated(undefined)).toEqual([]);
  });

  it('returns an empty array for an empty string', () => {
    expect(parseCommaSeparated('')).toEqual([]);
  });

  it('splits a comma-separated string into trimmed parts', () => {
    expect(parseCommaSeparated('a, b, c')).toEqual(['a', 'b', 'c']);
  });

  it('trims whitespace from each part', () => {
    expect(parseCommaSeparated('  foo  ,  bar  ')).toEqual(['foo', 'bar']);
  });

  it('filters out empty parts produced by trailing commas', () => {
    expect(parseCommaSeparated('a,,b,')).toEqual(['a', 'b']);
  });

  it('returns a single-element array when there are no commas', () => {
    expect(parseCommaSeparated('single')).toEqual(['single']);
  });
});

describe('CommaSeparatedSchema', () => {
  it('parses a comma-separated string into an array', () => {
    expect(CommaSeparatedSchema.parse('a, b, c')).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array for undefined', () => {
    expect(CommaSeparatedSchema.parse(undefined)).toEqual([]);
  });

  it('returns an empty array for an empty string', () => {
    expect(CommaSeparatedSchema.parse('')).toEqual([]);
  });

  it('trims whitespace around values', () => {
    expect(CommaSeparatedSchema.parse('  x  ,  y  ')).toEqual(['x', 'y']);
  });

  it('rejects a non-string, non-undefined input', () => {
    expect(() => CommaSeparatedSchema.parse(123)).toThrow();
  });
});

describe('MonthSchema', () => {
  it('parses a valid string month', () => {
    expect(MonthSchema.parse('6')).toBe(6);
  });

  it('parses a valid number month', () => {
    expect(MonthSchema.parse(12)).toBe(12);
  });

  it('coerces month float w/ no decimal part to integer', () => {
    expect(MonthSchema.parse(7.0)).toBe(7);
  });

  it('rejects month float w/ decimal part', () => {
    expect(() => MonthSchema.parse(6.5)).toThrow();
  });

  it('returns undefined for undefined input', () => {
    expect(MonthSchema.parse(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(MonthSchema.parse('')).toBeUndefined();
  });

  it('rejects month 0', () => {
    expect(() => MonthSchema.parse('0')).toThrow();
  });

  it('rejects month 13', () => {
    expect(() => MonthSchema.parse('13')).toThrow();
  });

  it('accepts boundary month 1', () => {
    expect(MonthSchema.parse('1')).toBe(1);
  });

  it('accepts boundary month 12', () => {
    expect(MonthSchema.parse('12')).toBe(12);
  });

  it('rejects a non-numeric string', () => {
    expect(() => MonthSchema.parse('march')).toThrow();
  });
});

describe('YearSchema', () => {
  it('parses a valid string year', () => {
    expect(YearSchema.parse('2020')).toBe(2020);
  });

  it('parses a valid number year', () => {
    expect(YearSchema.parse(1999)).toBe(1999);
  });

  it('coerces year float w/ no decimal part to integer', () => {
    expect(YearSchema.parse(1997.0)).toBe(1997);
  });

  it('rejects a year float w/ decimal part', () => {
    expect(() => YearSchema.parse(1997.5)).toThrow();
  });

  it('returns undefined for undefined input', () => {
    expect(YearSchema.parse(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(YearSchema.parse('')).toBeUndefined();
  });

  it('rejects a three-digit year', () => {
    expect(() => YearSchema.parse('999')).toThrow();
  });

  it('rejects a five-digit year', () => {
    expect(() => YearSchema.parse('10000')).toThrow();
  });

  it('accepts boundary year 1000', () => {
    expect(YearSchema.parse('1000')).toBe(1000);
  });

  it('accepts boundary year 9999', () => {
    expect(YearSchema.parse('9999')).toBe(9999);
  });

  it('rejects a non-numeric string', () => {
    expect(() => YearSchema.parse('nineteen ninety seven')).toThrow();
  });
});

describe('NormalizedUserTypeSchema', () => {
  it('accepts "child"', () => {
    expect(NormalizedUserTypeSchema.parse('child')).toBe('child');
  });

  it('accepts "teacher"', () => {
    expect(NormalizedUserTypeSchema.parse('teacher')).toBe('teacher');
  });

  it('accepts "parent"', () => {
    expect(NormalizedUserTypeSchema.parse('parent')).toBe('parent');
  });

  it('normalizes "caregiver" to "parent"', () => {
    expect(NormalizedUserTypeSchema.parse('caregiver')).toBe('parent');
  });

  it('is case-insensitive (uppercased input)', () => {
    expect(NormalizedUserTypeSchema.parse('CHILD')).toBe('child');
  });

  it('is case-insensitive for "CAREGIVER"', () => {
    expect(NormalizedUserTypeSchema.parse('CAREGIVER')).toBe('parent');
  });

  it('trims leading/trailing whitespace', () => {
    expect(NormalizedUserTypeSchema.parse('  teacher  ')).toBe('teacher');
  });

  it('rejects an invalid user type', () => {
    expect(() => NormalizedUserTypeSchema.parse('admin')).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => NormalizedUserTypeSchema.parse('')).toThrow();
  });

  it('rejects a whitespace-only string', () => {
    expect(() => NormalizedUserTypeSchema.parse('   ')).toThrow();
  });
});
