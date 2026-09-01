/**
 * Shared schema primitives and refinement helpers for Users CSV validation
 *
 * NB: To keep separation of concerns such that this library only handles
 * side-effect-free type coercion and validation, callers are responsible
 * for parsing CSV files upstream. If a field is empty in the file, it
 * should be passed as an empty string, not `undefined` or `null`.
 */
import * as z from 'zod';
import { nonEmptyString } from '../shared/non-empty-string';

/**
 * A string of comma-separated values that parses into a list of trimmed,
 * non-empty strings, e.g., `"foo,bar,baz"` -> `["foo","bar","baz"]`.
 */
export const ListableString = z.string().transform((value) => {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
});

/**
 * A string that coerces into a number (or `Number.NaN`), e.g.,
 * `"123"` -> `123`, `"foo"` -> `Number.NaN`.
 */
export const NumberString = (message: string = 'Required') => {
  // NB: nonEmptyString prevents '' from being coerced to 0
  return nonEmptyString(message).transform(Number);
};

/**
 * Returns a `superRefine` callback that validates all required headers are
 * present in a CSV header row. Emits one issue per missing header.
 * @param requiredHeaders - Header names that must appear in the row
 */
export const hasRequiredHeaders = (requiredHeaders: readonly string[]) => {
  return (data: readonly string[], ctx: z.RefinementCtx) => {
    for (const header of requiredHeaders) {
      if (!data.includes(header)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Missing required header',
          path: [header],
          input: data,
        });
      }
    }
  };
};
