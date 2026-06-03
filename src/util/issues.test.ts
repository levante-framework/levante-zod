import { describe, expect, it } from 'vitest';
import type * as z from 'zod';
import { combineIssues, formatIssueFields, makeCustomIssue } from './issues';

const makeIssue = (
  path: (string | number | symbol)[],
  message: string,
): z.core.$ZodIssue => ({
  code: 'custom',
  path,
  message,
});

describe('combineIssues', () => {
  it('returns an empty array for no issues', () => {
    expect(combineIssues([])).toEqual([]);
  });

  it('returns a single entry for a single issue', () => {
    const issues = [makeIssue(['name'], 'Required')];
    expect(combineIssues(issues)).toEqual([
      { field: 'name', message: 'Required' },
    ]);
  });

  it('groups multiple fields that share the same message', () => {
    const issues = [
      makeIssue(['email'], 'Required'),
      makeIssue(['phone'], 'Required'),
    ];
    expect(combineIssues(issues)).toEqual([
      { field: 'email, phone', message: 'Required' },
    ]);
  });

  it('keeps distinct messages as separate entries', () => {
    const issues = [
      makeIssue(['email'], 'Invalid email'),
      makeIssue(['age'], 'Must be a number'),
    ];
    expect(combineIssues(issues)).toEqual([
      { field: 'email', message: 'Invalid email' },
      { field: 'age', message: 'Must be a number' },
    ]);
  });

  it('preserves insertion order across distinct messages', () => {
    const issues = [makeIssue(['b'], 'Error B'), makeIssue(['a'], 'Error A')];
    const result = combineIssues(issues);
    expect(result[0].message).toBe('Error B');
    expect(result[1].message).toBe('Error A');
  });

  it('skips issues with blank or whitespace-only messages', () => {
    const issues = [makeIssue(['name'], '   '), makeIssue(['age'], 'Required')];
    expect(combineIssues(issues)).toEqual([
      { field: 'age', message: 'Required' },
    ]);
  });

  it('handles issues with no path (root-level)', () => {
    const issues = [makeIssue([], 'Something went wrong')];
    expect(combineIssues(issues)).toEqual([
      { field: '', message: 'Something went wrong' },
    ]);
  });

  it('joins nested paths with dots', () => {
    const issues = [makeIssue(['address', 'city'], 'Required')];
    expect(combineIssues(issues)).toEqual([
      { field: 'address.city', message: 'Required' },
    ]);
  });
});

describe('formatIssueFields', () => {
  it('returns an empty string for no fields', () => {
    expect(formatIssueFields([])).toBe('');
  });

  it('returns a single field name unchanged', () => {
    expect(formatIssueFields(['name'])).toBe('name');
  });

  it('joins month and year into "month and year"', () => {
    expect(formatIssueFields(['month', 'year'])).toBe('month and year');
  });

  it('places "month and year" before other fields', () => {
    expect(formatIssueFields(['site', 'month', 'year'])).toBe(
      'month and year, site',
    );
  });

  it('handles only month', () => {
    expect(formatIssueFields(['month'])).toBe('month');
  });

  it('handles only year', () => {
    expect(formatIssueFields(['year'])).toBe('year');
  });

  it('deduplicates repeated fields', () => {
    expect(formatIssueFields(['name', 'name'])).toBe('name');
  });
});

describe('makeCustomIssue', () => {
  it('returns a custom issue with required fields', () => {
    const issue = makeCustomIssue({
      input: 'foo',
      message: 'Bad value',
      path: ['name'],
    });
    expect(issue).toEqual({
      code: 'custom',
      input: 'foo',
      message: 'Bad value',
      path: ['name'],
    });
  });

  it('includes params when provided', () => {
    const issue = makeCustomIssue({
      input: 'hi',
      message: 'Too short',
      path: ['password'],
      params: { minLength: 8, actual: 2 },
    });
    expect(issue.params).toEqual({ minLength: 8, actual: 2 });
  });

  it('omits params key when not provided', () => {
    const issue = makeCustomIssue({
      input: undefined,
      message: 'Required',
      path: ['email'],
    });
    expect('params' in issue).toBe(false);
  });

  it('accepts a numeric path segment', () => {
    const issue = makeCustomIssue({
      input: null,
      message: 'Invalid',
      path: ['items', 0],
    });
    expect(issue.path).toEqual(['items', 0]);
  });

  it('accepts a symbol path segment', () => {
    const symbol = Symbol('foo');
    const issue = makeCustomIssue({
      input: null,
      message: 'Invalid',
      path: ['items', symbol],
    });
    expect(issue.path).toEqual(['items', symbol]);
  });

  it('accepts an empty path', () => {
    const issue = makeCustomIssue({
      input: null,
      message: 'Root error',
      path: [],
    });
    expect(issue.path).toEqual([]);
  });
});
