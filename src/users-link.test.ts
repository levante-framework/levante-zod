import { describe, expect, it } from 'vitest';
import { LinkUsersCsvSchema, validateLinkUsersCsv } from './users-link';

const validRow = { id: 'user-1', usertype: 'teacher', uid: 'uid-1' };

describe('LinkUsersCsvSchema', () => {
  it('parses a minimal valid teacher row', () => {
    const result = LinkUsersCsvSchema.safeParse(validRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('user-1');
      expect(result.data.uid).toBe('uid-1');
      expect(result.data.userType).toBe('teacher');
    }
  });

  it('renames usertype to userType in the output', () => {
    const result = LinkUsersCsvSchema.safeParse(validRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('userType');
      expect(result.data).not.toHaveProperty('usertype');
    }
  });

  it('accepts optional caregiverId', () => {
    const result = LinkUsersCsvSchema.safeParse({
      ...validRow,
      caregiverId: 'cg-1',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.caregiverId).toBe('cg-1');
  });

  it('accepts optional teacherId', () => {
    const result = LinkUsersCsvSchema.safeParse({
      ...validRow,
      teacherId: 'tc-1',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.teacherId).toBe('tc-1');
  });

  it('normalizes "caregiver" usertype to "parent"', () => {
    const result = LinkUsersCsvSchema.safeParse({
      ...validRow,
      usertype: 'caregiver',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.userType).toBe('parent');
  });

  it('normalizes usertype case-insensitively', () => {
    const result = LinkUsersCsvSchema.safeParse({
      ...validRow,
      usertype: 'CHILD',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.userType).toBe('child');
  });

  it('trims whitespace from id and uid', () => {
    const result = LinkUsersCsvSchema.safeParse({
      id: '  user-1  ',
      usertype: 'teacher',
      uid: '  uid-1  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('user-1');
      expect(result.data.uid).toBe('uid-1');
    }
  });

  it('fails when id is missing', () => {
    const result = LinkUsersCsvSchema.safeParse({
      usertype: 'teacher',
      uid: 'uid-1',
    });
    expect(result.success).toBe(false);
  });

  it('fails when id is an empty string', () => {
    const result = LinkUsersCsvSchema.safeParse({
      id: '',
      usertype: 'teacher',
      uid: 'uid-1',
    });
    expect(result.success).toBe(false);
  });

  it('fails when uid is missing', () => {
    const result = LinkUsersCsvSchema.safeParse({
      id: 'user-1',
      usertype: 'teacher',
    });
    expect(result.success).toBe(false);
  });

  it('fails when uid is an empty string', () => {
    const result = LinkUsersCsvSchema.safeParse({
      id: 'user-1',
      usertype: 'teacher',
      uid: '',
    });
    expect(result.success).toBe(false);
  });

  it('fails with an invalid usertype', () => {
    const result = LinkUsersCsvSchema.safeParse({
      ...validRow,
      usertype: 'admin',
    });
    expect(result.success).toBe(false);
  });
});

describe('validateLinkUsersCsv', () => {
  it('returns success: true and parsed data for a valid row', () => {
    const result = validateLinkUsersCsv([validRow]);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].userType).toBe('teacher');
  });

  it('returns success: true for multiple valid rows', () => {
    const data = [validRow, { id: 'user-2', usertype: 'child', uid: 'uid-2' }];
    const result = validateLinkUsersCsv(data);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('returns success: false with errors for an invalid row', () => {
    const result = validateLinkUsersCsv([
      { id: 'user-1', usertype: 'bad', uid: 'uid-1' },
    ]);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
  });

  it('reports the correct 1-based row number in errors', () => {
    const data = [
      validRow,
      { id: 'user-2', usertype: 'invalid', uid: 'uid-2' },
    ];
    const result = validateLinkUsersCsv(data);
    expect(result.success).toBe(false);
    expect(result.errors[0].row).toBe(2);
  });

  it('collects errors from multiple invalid rows', () => {
    const data = [
      { id: '', usertype: 'teacher', uid: 'uid-1' },
      { id: 'user-2', usertype: 'bad', uid: 'uid-2' },
    ];
    const result = validateLinkUsersCsv(data);
    expect(result.success).toBe(false);
    const rows = result.errors.map((e) => e.row);
    expect(rows).toContain(1);
    expect(rows).toContain(2);
  });

  it('includes valid rows in data even when other rows fail', () => {
    const data = [validRow, { id: '', usertype: 'teacher', uid: 'uid-2' }];
    const result = validateLinkUsersCsv(data);
    expect(result.success).toBe(false);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('user-1');
  });

  it('normalizes column header casing (uppercased keys)', () => {
    const result = validateLinkUsersCsv([
      { ID: 'user-1', USERTYPE: 'teacher', UID: 'uid-1' },
    ]);
    expect(result.success).toBe(true);
    expect(result.data[0].id).toBe('user-1');
  });

  it('maps "caregiverid" column to caregiverId field', () => {
    const result = validateLinkUsersCsv([{ ...validRow, caregiverid: 'cg-1' }]);
    expect(result.success).toBe(true);
    expect(result.data[0].caregiverId).toBe('cg-1');
  });

  it('maps "teacherid" column to teacherId field', () => {
    const result = validateLinkUsersCsv([{ ...validRow, teacherid: 'tc-1' }]);
    expect(result.success).toBe(true);
    expect(result.data[0].teacherId).toBe('tc-1');
  });

  it('treats empty string column values as undefined', () => {
    const result = validateLinkUsersCsv([{ ...validRow, caregiverId: '' }]);
    expect(result.success).toBe(true);
    expect(result.data[0].caregiverId).toBeUndefined();
  });

  it('returns success: false and empty data/errors for an empty array', () => {
    const result = validateLinkUsersCsv([]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.errors).toEqual([]);
  });
});
