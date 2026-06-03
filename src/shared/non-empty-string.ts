import * as z from 'zod';

/**
 * Returns a schema for a trimmed, non-empty string
 * @param message - Optional issue message to override the default
 */
export const nonEmptyString = (message?: string) => {
  return z
    .string(message)
    .trim()
    .superRefine((data, ctx) => {
      // String must be non-empty
      // NB: using superRefine() instead of nonempty() so that non-string
      // values (e.g. arrays) only produce a single "invalid_type" issue
      // rather than redundant errors from both string() and nonempty()
      if (data.length === 0) {
        ctx.addIssue({
          code: 'too_small',
          inclusive: true,
          message:
            message ?? 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: [],
        });
      }
    });
};

/** A trimmed, non-empty string */
export const NonEmptyStringSchema = nonEmptyString();
