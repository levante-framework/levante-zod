/**
 * Form-agnostic language-selection value. Site, school, and later surveys
 * all validate answers with this module instead of a field-specific string.
 */

import { getAlpha2Codes } from '@cospired/i18n-iso-languages';
import * as z from 'zod';
import { findDuplicateIndexes } from '../util/find-duplicate-indexes';

export const LANGUAGE_OTHER = 'other';

const iso6391Alpha2Codes = new Set(Object.keys(getAlpha2Codes()));

/**
 * A lowercase ISO 639-1 alpha-2 language code from
 * `@cospired/i18n-iso-languages`. Rejects alpha-3 aliases (`eng`),
 * uppercase (`EN`), and free text (`English`).
 */
export const Iso6391Alpha2Schema = z.string().superRefine((code, ctx) => {
  // isValid also accepts alpha-3 (`eng`) and uppercase (`EN`); the
  // getAlpha2Codes keys are the lowercase alpha-2 codes we actually store.
  if (iso6391Alpha2Codes.has(code)) return;

  ctx.addIssue({
    code: 'custom',
    message: 'Invalid ISO 639-1 alpha-2 code',
    path: [],
    input: code,
  });
});

/** Inferred type of {@link Iso6391Alpha2Schema}. */
export type Iso6391Alpha2 = z.infer<typeof Iso6391Alpha2Schema>;

const LanguageCodeSchema = z.union([
  z.literal(LANGUAGE_OTHER),
  Iso6391Alpha2Schema,
]);

/**
 * Selected languages plus a free-text description when {@link LANGUAGE_OTHER}
 * is included. `codes` may be empty (draft). `otherDescription` is always
 * present: a trimmed non-empty string iff `codes` includes `other`, otherwise
 * `null`.
 */
export const LanguageSelectionSchema = z
  .object({
    codes: z.array(LanguageCodeSchema),
    otherDescription: z.string().trim().nullable(),
  })
  .superRefine((data, ctx) => {
    for (const idx of findDuplicateIndexes(data.codes)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be unique',
        path: ['codes', idx],
        input: data.codes[idx],
      });
    }

    const hasOther = data.codes.includes(LANGUAGE_OTHER);
    const { otherDescription } = data;

    if (hasOther) {
      if (otherDescription === null || otherDescription.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Required when codes includes other',
          path: ['otherDescription'],
          input: otherDescription,
        });
      }
      return;
    }

    if (otherDescription !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be null when codes does not include other',
        path: ['otherDescription'],
        input: otherDescription,
      });
    }
  });

/** Inferred type of {@link LanguageSelectionSchema}. */
export type LanguageSelection = z.infer<typeof LanguageSelectionSchema>;
