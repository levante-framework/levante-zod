import { describe, expect, it } from 'vitest';
import { makeCustomIssue, makeTooBigIssue, makeTooSmallIssue } from './issues';

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

describe('makeTooBigIssue', () => {
  it('returns an array too_big issue with an "items" message', () => {
    const issue = makeTooBigIssue({
      input: ['a', 'b'],
      maximum: 1,
      origin: 'array',
      path: ['users'],
    });
    expect(issue).toEqual({
      code: 'too_big',
      inclusive: true,
      input: ['a', 'b'],
      maximum: 1,
      message: 'Too big: expected array to have <=1 items',
      origin: 'array',
      path: ['users'],
    });
  });

  it('returns a string too_big issue with a "characters" message', () => {
    const issue = makeTooBigIssue({
      input: 'foobar',
      maximum: 3,
      origin: 'string',
      path: ['name'],
    });
    expect(issue).toEqual({
      code: 'too_big',
      inclusive: true,
      input: 'foobar',
      maximum: 3,
      message: 'Too big: expected string to have <=3 characters',
      origin: 'string',
      path: ['name'],
    });
  });

  it('accepts an empty path', () => {
    const issue = makeTooBigIssue({
      input: [],
      maximum: 0,
      origin: 'array',
      path: [],
    });
    expect(issue.path).toEqual([]);
  });
});

describe('makeTooSmallIssue', () => {
  it('returns an array too_small issue with an "items" message', () => {
    const issue = makeTooSmallIssue({
      input: [],
      minimum: 1,
      origin: 'array',
      path: ['users'],
    });
    expect(issue).toEqual({
      code: 'too_small',
      inclusive: true,
      input: [],
      minimum: 1,
      message: 'Too small: expected array to have >=1 items',
      origin: 'array',
      path: ['users'],
    });
  });

  it('returns a string too_small issue with a "characters" message', () => {
    const issue = makeTooSmallIssue({
      input: '',
      minimum: 1,
      origin: 'string',
      path: ['name'],
    });
    expect(issue).toEqual({
      code: 'too_small',
      inclusive: true,
      input: '',
      minimum: 1,
      message: 'Too small: expected string to have >=1 characters',
      origin: 'string',
      path: ['name'],
    });
  });

  it('accepts an empty path', () => {
    const issue = makeTooSmallIssue({
      input: [],
      minimum: 1,
      origin: 'array',
      path: [],
    });
    expect(issue.path).toEqual([]);
  });
});
