import { describe, expect, it } from 'vitest';
import { makeCustomIssue } from './issues';

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
