import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import type * as z from 'zod';
import { NonEmptyStringSchema, nonEmptyString } from './non-empty-string';

/** Arbitrary: a non-empty, trim-stable string */
const $nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim() === s);

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Fixture: a custom issue message */
const $message = 'Required';

describe('nonEmptyString', () => {
  it('uses issue message override for invalid type', () => {
    const result = nonEmptyString($message).safeParse([]);
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].message).toEqual($message);
  });

  it('uses issue message override for empty string', () => {
    const result = nonEmptyString($message).safeParse('');
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].message).toEqual($message);
  });

  it('uses issue message override for whitespace-only string', () => {
    const result = nonEmptyString($message).safeParse('   ');
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].message).toEqual($message);
  });
});

describe('NonEmptyString', () => {
  it.prop({ v: $nonEmptyString })('accepts non-empty strings', ({ v }) => {
    expect(() => NonEmptyStringSchema.parse(v)).not.toThrow();
  });

  it('trims whitespace from string', () => {
    expect(NonEmptyStringSchema.parse('  foo  ')).toEqual('foo');
  });

  it('rejects a missing string', () => {
    const result = NonEmptyStringSchema.safeParse(undefined);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received undefined',
        path: [],
      },
    ]);
  });

  it('rejects an empty string', () => {
    const result = NonEmptyStringSchema.safeParse('');
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected string to have >=1 characters',
        origin: 'string',
        minimum: 1,
        path: [],
      },
    ]);
  });

  it('rejects a whitespace-only string', () => {
    const result = NonEmptyStringSchema.safeParse('   ');
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected string to have >=1 characters',
        origin: 'string',
        minimum: 1,
        path: [],
      },
    ]);
  });

  it.prop({ v: $nonString })('rejects non-strings', ({ v }) => {
    const result = NonEmptyStringSchema.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
    expect(issue.code).toEqual('invalid_type');
    expect(issue.expected).toEqual('string');
    expect(issue.message).toMatch(/Invalid input: expected string, received/);
    expect(issue.path).toEqual([]);
  });
});
