import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { normalizeCsvData, normalizeCsvHeaders, validateCsvData, validateCsvHeaders } from '../index';

describe('normalizeCsvData', () => {
  it('should map alias keys to their canonical field names', () => {
    const result = normalizeCsvData({ usertypeid: 'teacher', caregiverid: 'c1' });
    expect(result).toEqual({ usertype: 'teacher', caregiverId: 'c1' });
  });

  it('should pass through unknown keys unchanged', () => {
    const result = normalizeCsvData({ unknownField: 'value', custom: 123 });
    expect(result).toEqual({ unknownField: 'value', custom: 123 });
  });

  it('should convert empty strings to undefined', () => {
    const result = normalizeCsvData({ id: '', name: 'Alice' });
    expect(result.id).toBeUndefined();
    expect(result.name).toBe('Alice');
  });

  it('should convert null values to undefined', () => {
    const result = normalizeCsvData({ id: null, uid: 'u1' });
    expect(result.id).toBeUndefined();
    expect(result.uid).toBe('u1');
  });

  it('should preserve non-empty, non-null values as-is', () => {
    const result = normalizeCsvData({ month: '3', year: '2024', cohort: 'A' });
    expect(result).toEqual({ month: '3', year: '2024', cohort: 'A' });
  });
})

describe('normalizeCsvHeaders', () => {
  it('should return normalized headers', () => {
    const headers = ['ID', 'Name', ' email '];
    const result = normalizeCsvHeaders(headers);
    expect(result).toEqual(['id', 'name', 'email']);
  });
});

describe('validateCsvData', () => {
  const schema = z.object({
    name: z.string(),
    age: z.coerce.number(),
  });

  it('returns success: true with parsed data when all rows are valid', () => {
    const rows = [
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ];
    const result = validateCsvData(schema, rows);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('returns success: true with empty data and no errors for an empty array', () => {
    const result = validateCsvData(schema, []);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('returns success: false with errors when a row fails validation', () => {
    const rows = [{ name: 'Alice', age: 'not-a-number' }];
    const result = validateCsvData(schema, rows);
    expect(result.success).toBe(false);
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
  });

  it('uses 1-based row numbers in errors', () => {
    const rows = [
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: 'bad' },
    ];
    const result = validateCsvData(schema, rows);
    expect(result.errors[0].row).toBe(2);
  });

  it('includes valid rows in data and invalid rows in errors (mixed input)', () => {
    const rows = [
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: 'bad' },
      { name: 'Carol', age: '22' },
    ];
    const result = validateCsvData(schema, rows);
    expect(result.success).toBe(false);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Alice');
    expect(result.data[1].name).toBe('Carol');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
  });

  it('produces one error entry per distinct validation message on a row', () => {
    const rows = [{ name: 123, age: 'bad' }];
    const result = validateCsvData(schema, rows);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors.every(e => e.row === 1)).toBe(true);
  });

  it('normalizes CSV alias keys before validation', () => {
    const usertypeSchema = z.object({ usertype: z.string() });
    const rows = [{ usertypeid: 'teacher' }];
    const result = validateCsvData(usertypeSchema, rows);
    expect(result.success).toBe(true);
    expect(result.data[0].usertype).toBe('teacher');
  });
});

describe('validateCsvHeaders', () => {
  it('should return success: true if headers are present', () => {
    const headers = ['id', 'name', 'email'];
    const requiredHeaders = ['id', 'name', 'email'];
    const result = validateCsvHeaders(headers, requiredHeaders);
    expect(result.success).toBe(true);
    expect(result.errors.length).toEqual(0);
  });

  it('should return success: false if headers are missing required headers', () => {
    const headers = ['id', 'name'];
    const requiredHeaders = ['id', 'name', 'email'];
    const result = validateCsvHeaders(headers, requiredHeaders);
    expect(result.success).toBe(false);
    expect(result.errors.length).toEqual(1);
    expect(result.errors[0].field).toEqual('email');
  });
});
