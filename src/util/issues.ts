import type * as z from 'zod';

/**
 * Creates a custom Zod issue
 * @param props.input - The input value that caused the issue
 * @param props.message - A message describing the issue
 * @param props.path - The path of the input value that caused the issue
 * @param props.params - Optional passthrough parameters, e.g., `{ minLength: 8, actual: val.length }`
 */
export function makeCustomIssue(props: {
  input: unknown;
  message: string;
  path: (string | number | symbol)[];
  params?: Record<string, unknown>;
}): z.core.$ZodIssueCustom {
  const { input, message, path, params } = props;
  return {
    code: 'custom',
    input,
    message,
    path,
    ...(params !== undefined && { params }),
  };
}

/**
 * Creates a too_big Zod issue
 * @param props.input - The input value that caused the issue
 * @param props.maximum - The maximum allowed value
 * @param props.origin - The type of the value (e.g., 'array' or 'string')
 * @param props.path - The path of the input value that caused the issue
 */
export function makeTooBigIssue(props: {
  input: unknown;
  maximum: number;
  origin: 'array' | 'string';
  path: (string | number | symbol)[];
}): z.core.$ZodRawIssue<z.core.$ZodIssueTooBig> {
  const { input, maximum, origin, path } = props;
  return {
    code: 'too_big',
    inclusive: true,
    input,
    maximum,
    message: `Too big: expected ${origin} to have <=${maximum} ${origin === 'array' ? 'items' : 'characters'}`,
    origin,
    path,
  };
}

/**
 * Creates a too_small Zod issue
 * @param props.input - The input value that caused the issue
 * @param props.minimum - The minimum allowed value
 * @param props.origin - The type of the value (e.g., 'array' or 'string')
 * @param props.path - The path of the input value that caused the issue
 */
export function makeTooSmallIssue(props: {
  input: unknown;
  minimum: number;
  origin: 'array' | 'string';
  path: (string | number | symbol)[];
}): z.core.$ZodRawIssue<z.core.$ZodIssueTooSmall> {
  const { input, minimum, origin, path } = props;
  return {
    code: 'too_small',
    inclusive: true,
    input,
    minimum,
    message: `Too small: expected ${origin} to have >=${minimum} ${origin === 'array' ? 'items' : 'characters'}`,
    origin,
    path,
  };
}
