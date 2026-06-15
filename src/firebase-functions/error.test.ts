import { FirebaseError } from 'firebase/app';
import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import { FirebaseErrorSchema, FunctionsErrorSchema } from './error';

const $name = 'FirebaseError';
const $code = 'internal';
const $message = 'Foo error occurred';
const $details = {
  foo: 'bar',
  count: 42,
  nested: { a: 1 },
  arr: [1, 2, 3],
  flag: true,
};

describe('FirebaseErrorSchema', () => {
  it('accepts FirebaseError w/ code and message', () => {
    const err = new FirebaseError($code, $message);
    const result = FirebaseErrorSchema.parse(err);
    expect(result).toEqual({
      name: $name,
      code: $code,
      message: $message,
      customData: undefined,
    });
  });

  it('accepts FirebaseError w/ code, message, and customData', () => {
    const err = new FirebaseError($code, $message, $details);
    const result = FirebaseErrorSchema.parse(err);
    expect(result).toEqual({
      name: $name,
      code: $code,
      message: $message,
      customData: $details,
    });
  });

  it('accepts FunctionsError, but strips details', () => {
    const err = new FunctionsError($code, $message, $details);
    const result = FirebaseErrorSchema.parse(err);
    expect(result).toEqual({
      name: $name,
      code: `functions/${$code}`,
      message: $message,
      customData: undefined,
    });
  });

  it('rejects Error', () => {
    const err = new Error($message);
    const result = FirebaseErrorSchema.safeParse(err);
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(2);
    expect(result.error?.issues[0]).toEqual({
      code: 'invalid_value',
      values: ['FirebaseError'],
      path: ['name'],
      message: 'Invalid input: expected "FirebaseError"',
    });
    expect(result.error?.issues[1]).toEqual({
      expected: 'string',
      code: 'invalid_type',
      path: ['code'],
      message: 'Invalid input: expected string, received undefined',
    });
  });
});

describe('FunctionsErrorSchema', () => {
  it('accepts FunctionsError w/ code only', () => {
    const err = new FunctionsError($code);
    const result = FunctionsErrorSchema.parse(err);
    expect(result).toEqual({
      name: $name,
      code: `functions/${$code}`,
      message: '',
      details: undefined,
    });
  });

  it('accepts FunctionsError w/ code and message', () => {
    const err = new FunctionsError($code, $message);
    const result = FunctionsErrorSchema.parse(err);
    expect(result).toEqual({
      name: $name,
      code: `functions/${$code}`,
      message: $message,
      details: undefined,
    });
  });

  it('accepts FunctionsError w/ code, message, and details', () => {
    const err = new FunctionsError($code, $message, $details);
    const result = FunctionsErrorSchema.parse(err);
    expect(result).toEqual({
      name: $name,
      code: `functions/${$code}`,
      message: $message,
      details: $details,
    });
  });

  it('rejects FirebaseError', () => {
    const err = new FirebaseError($code, $message, $details);
    const result = FunctionsErrorSchema.safeParse(err);
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0]).toEqual({
      origin: 'string',
      code: 'invalid_format',
      format: 'starts_with',
      prefix: 'functions/',
      path: ['code'],
      message: 'Invalid string: must start with "functions/"',
    });
  });

  it('rejects Error', () => {
    const err = new Error($message);
    const result = FunctionsErrorSchema.safeParse(err);
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(2);
    expect(result.error?.issues[0]).toEqual({
      code: 'invalid_value',
      values: ['FirebaseError'],
      path: ['name'],
      message: 'Invalid input: expected "FirebaseError"',
    });
    expect(result.error?.issues[1]).toEqual({
      expected: 'string',
      code: 'invalid_type',
      path: ['code'],
      message: 'Invalid input: expected string, received undefined',
    });
  });
});
