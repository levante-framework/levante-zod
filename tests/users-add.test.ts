import { describe, expect, it } from 'vitest';
import {
  combineFieldErrors,
  detectMultipleSites,
  validateAddUsersFileUpload,
} from '../src/users-add';

const validTeacher = { usertype: 'teacher', cohort: 'cohort1' };
const validChild = {
  usertype: 'child',
  month: '5',
  year: '2020',
  cohort: 'cohort1',
};

describe('combineFieldErrors', () => {
  it('returns an empty array for empty input', () => {
    expect(combineFieldErrors([])).toEqual([]);
  });

  it('returns a plain message when no field is provided', () => {
    const result = combineFieldErrors([{ field: '', message: 'Required' }]);
    expect(result).toEqual(['Required']);
  });

  it('returns "field: message" when a field is present', () => {
    const result = combineFieldErrors([
      { field: 'cohort', message: 'Required' },
    ]);
    expect(result).toEqual(['cohort: Required']);
  });

  it('normalizes the usertype field label to userType', () => {
    const result = combineFieldErrors([
      { field: 'usertype', message: 'Invalid enum value' },
    ]);
    expect(result).toEqual(['userType: Invalid enum value']);
  });

  it('groups multiple fields that share the same message', () => {
    const result = combineFieldErrors([
      { field: 'cohort', message: 'Required' },
      { field: 'school', message: 'Required' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Required');
    expect(result[0]).toContain('cohort');
    expect(result[0]).toContain('school');
  });

  it('keeps distinct messages as separate entries', () => {
    const result = combineFieldErrors([
      { field: 'cohort', message: 'Required' },
      { field: 'usertype', message: 'Invalid enum value' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('preserves the order of first occurrence for each message', () => {
    const result = combineFieldErrors([
      { field: 'usertype', message: 'Invalid enum value' },
      { field: 'cohort', message: 'Required' },
    ]);
    expect(result[0]).toContain('Invalid enum value');
    expect(result[1]).toContain('Required');
  });

  it('skips errors with empty messages', () => {
    const result = combineFieldErrors([
      { field: 'cohort', message: '' },
      { field: 'usertype', message: 'Invalid enum value' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Invalid enum value');
  });

  it('skips errors with whitespace-only messages', () => {
    const result = combineFieldErrors([{ field: 'cohort', message: '   ' }]);
    expect(result).toEqual([]);
  });

  it('formats month and year fields together when both are present', () => {
    const result = combineFieldErrors([
      { field: 'month', message: 'Required' },
      { field: 'year', message: 'Required' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('month and year');
  });
});

describe('detectMultipleSites', () => {
  it('returns hasMultipleSites: false and empty uniqueSites for empty input', () => {
    const result = detectMultipleSites([]);
    expect(result.hasMultipleSites).toBe(false);
    expect(result.uniqueSites).toEqual([]);
  });

  it('returns hasMultipleSites: false and empty uniqueSites when no rows have a site field', () => {
    const result = detectMultipleSites([
      { usertype: 'teacher' },
      { usertype: 'child' },
    ]);
    expect(result.hasMultipleSites).toBe(false);
    expect(result.uniqueSites).toEqual([]);
  });

  it('returns hasMultipleSites: false and empty uniqueSites when site values are all empty', () => {
    const result = detectMultipleSites([{ site: '' }, { site: '  ' }]);
    expect(result.hasMultipleSites).toBe(false);
    expect(result.uniqueSites).toEqual([]);
  });

  it('returns hasMultipleSites: false with one entry when all rows share the same site', () => {
    const result = detectMultipleSites([
      { site: 'site-a' },
      { site: 'site-a' },
    ]);
    expect(result.hasMultipleSites).toBe(false);
    expect(result.uniqueSites).toEqual(['site-a']);
  });

  it('returns hasMultipleSites: true when rows have different sites', () => {
    const result = detectMultipleSites([
      { site: 'site-a' },
      { site: 'site-b' },
    ]);
    expect(result.hasMultipleSites).toBe(true);
    expect(result.uniqueSites).toContain('site-a');
    expect(result.uniqueSites).toContain('site-b');
    expect(result.uniqueSites).toHaveLength(2);
  });

  it('splits comma-separated site values and counts them individually', () => {
    const result = detectMultipleSites([{ site: 'site-a, site-b' }]);
    expect(result.hasMultipleSites).toBe(true);
    expect(result.uniqueSites).toContain('site-a');
    expect(result.uniqueSites).toContain('site-b');
  });

  it('trims whitespace from individual site values', () => {
    const result = detectMultipleSites([{ site: '  site-a  ' }]);
    expect(result.uniqueSites).toEqual(['site-a']);
  });

  it('deduplicates sites across rows and comma-separated values', () => {
    const result = detectMultipleSites([
      { site: 'site-a, site-b' },
      { site: 'site-a' },
    ]);
    expect(result.hasMultipleSites).toBe(true);
    expect(result.uniqueSites).toHaveLength(2);
  });

  it('matches the site key case-insensitively', () => {
    const result = detectMultipleSites([
      { SITE: 'site-a' },
      { Site: 'site-b' },
    ]);
    expect(result.hasMultipleSites).toBe(true);
    expect(result.uniqueSites).toContain('site-a');
    expect(result.uniqueSites).toContain('site-b');
  });

  it('ignores rows without a site field when mixed with rows that have one', () => {
    const result = detectMultipleSites([
      { usertype: 'teacher' },
      { site: 'site-a' },
    ]);
    expect(result.hasMultipleSites).toBe(false);
    expect(result.uniqueSites).toEqual(['site-a']);
  });
});

describe('validateAddUsersFileUpload', () => {
  it('should return success: false if data is empty', () => {
    const result = validateAddUsersFileUpload([], true);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual([]);
    expect(result.data).toEqual([]);
    expect(result.hasMultipleSites).toBe(false);
    expect(result.uniqueSites).toEqual([]);
  });

  describe('header validation', () => {
    it('fails with headerErrors when usertype column is missing', () => {
      const data = [{ cohort: 'cohort1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.success).toBe(false);
      expect(result.headerErrors).toBeDefined();
      expect(result.headerErrors?.some((e) => e.field === 'usertype')).toBe(
        true,
      );
    });

    it('requires month and year headers when any user has usertype child', () => {
      const data = [{ usertype: 'child', cohort: 'cohort1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.success).toBe(false);
      expect(result.headerErrors).toBeDefined();
      expect(result.headerErrors?.some((e) => e.field === 'month')).toBe(true);
      expect(result.headerErrors?.some((e) => e.field === 'year')).toBe(true);
    });

    it('does not require month/year headers when no child users are present', () => {
      const data = [{ usertype: 'teacher', cohort: 'cohort1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.headerErrors).toBeUndefined();
    });

    it('requires both cohort and school headers when neither is present', () => {
      const data = [{ usertype: 'teacher' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.success).toBe(false);
      expect(result.headerErrors).toBeDefined();
      expect(result.headerErrors?.some((e) => e.field === 'cohort')).toBe(true);
      expect(result.headerErrors?.some((e) => e.field === 'school')).toBe(true);
    });

    it('does not require school/class headers when cohort column is present', () => {
      const data = [{ usertype: 'teacher', cohort: 'cohort1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.headerErrors).toBeUndefined();
    });

    it('does not require cohort/school headers when school column is present', () => {
      const data = [{ usertype: 'teacher', school: 'school1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.headerErrors).toBeUndefined();
    });

    it('requires site header when shouldUsePermissions is false', () => {
      const data = [{ usertype: 'teacher', cohort: 'cohort1' }];
      const result = validateAddUsersFileUpload(data, false);
      expect(result.success).toBe(false);
      expect(result.headerErrors).toBeDefined();
      expect(result.headerErrors?.some((e) => e.field === 'site')).toBe(true);
    });

    it('does not require site header when shouldUsePermissions is true', () => {
      const data = [{ usertype: 'teacher', cohort: 'cohort1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.headerErrors).toBeUndefined();
    });
  });

  describe('valid data', () => {
    it('returns success: true for a valid teacher row with cohort', () => {
      const result = validateAddUsersFileUpload([validTeacher], true);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toHaveLength(1);
    });

    it('returns success: true for a valid teacher row with school', () => {
      const data = [{ usertype: 'teacher', school: 'school1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns success: true for a valid child row with month, year, and cohort', () => {
      const result = validateAddUsersFileUpload([validChild], true);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns success: true for mixed valid teacher and child rows', () => {
      // All rows must share the same columns — when children are present,
      // month and year are required headers for the whole file.
      const teacherWithDateCols = {
        usertype: 'teacher',
        cohort: 'cohort1',
        month: '',
        year: '',
      };
      const result = validateAddUsersFileUpload(
        [teacherWithDateCols, validChild],
        true,
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('passes data through in the result', () => {
      const data = [validTeacher];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.data).toBe(data);
    });
  });

  describe('row validation errors', () => {
    it('returns success: false with per-user errors for invalid usertype', () => {
      const data = [{ usertype: 'invalid', cohort: 'cohort1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].user).toBe(data[0]);
    });

    it('returns errors only for the invalid rows, not valid ones', () => {
      const data = [
        { usertype: 'teacher', cohort: 'cohort1' },
        { usertype: 'invalid', cohort: 'cohort1' },
      ];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].user).toBe(data[1]);
    });

    it('combines multiple field errors for the same user into a single error string', () => {
      const data = [{ usertype: 'invalid', cohort: 'cohort1', month: 'bad' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('site detection', () => {
    it('reports hasMultipleSites: false when all users share one site', () => {
      const data = [
        { usertype: 'teacher', cohort: 'c1', site: 'site-a' },
        { usertype: 'teacher', cohort: 'c1', site: 'site-a' },
      ];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.hasMultipleSites).toBe(false);
      expect(result.uniqueSites).toEqual(['site-a']);
    });

    it('reports hasMultipleSites: true when users have different sites', () => {
      const data = [
        { usertype: 'teacher', cohort: 'c1', site: 'site-a' },
        { usertype: 'teacher', cohort: 'c1', site: 'site-b' },
      ];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.hasMultipleSites).toBe(true);
      expect(result.uniqueSites).toContain('site-a');
      expect(result.uniqueSites).toContain('site-b');
    });

    it('detects multiple sites from comma-separated site values', () => {
      const data = [
        { usertype: 'teacher', cohort: 'c1', site: 'site-a, site-b' },
      ];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.hasMultipleSites).toBe(true);
    });

    it('returns empty uniqueSites when no site column is present', () => {
      const data = [{ usertype: 'teacher', cohort: 'c1' }];
      const result = validateAddUsersFileUpload(data, true);
      expect(result.uniqueSites).toEqual([]);
      expect(result.hasMultipleSites).toBe(false);
    });
  });

  describe('shouldUsePermissions: false — site requirement for new users', () => {
    it('errors when a user without id has no site value', () => {
      const data = [{ usertype: 'teacher', cohort: 'c1', site: '' }];
      const result = validateAddUsersFileUpload(data, false);
      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.error.includes('Site'))).toBe(true);
    });

    it('does not error when a user without id has a site value', () => {
      const data = [{ usertype: 'teacher', cohort: 'c1', site: 'site-a' }];
      const result = validateAddUsersFileUpload(data, false);
      expect(result.success).toBe(true);
    });

    it('does not add a site error for users that already have a Zod validation error', () => {
      const data = [{ usertype: 'invalid', cohort: 'c1', site: '' }];
      const result = validateAddUsersFileUpload(data, false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).not.toContain('Site: Site is required');
    });

    it('does not add a site error for users with an existing id', () => {
      const data = [
        { id: 'existing-id', usertype: 'teacher', cohort: 'c1', site: '' },
      ];
      const result = validateAddUsersFileUpload(data, false);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
