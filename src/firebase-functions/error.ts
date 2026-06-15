import * as z from 'zod';

/** Schema for safely parsing a caught `unknown` value as a Firebase `FirebaseError`. */
export const FirebaseErrorSchema = z.object({
  name: z.literal('FirebaseError'),
  code: z.string(),
  message: z.string(),
  customData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Inferred type of {@link FirebaseErrorSchema}.
 *
 * NB: Named `ParsedFirebaseError` to avoid conflict with `FirebaseError` from `firebase/app`.
 */
export type ParsedFirebaseError = z.infer<typeof FirebaseErrorSchema>;

/** Schema for safely parsing a caught `unknown` value as a Firebase `FunctionsError`. */
export const FunctionsErrorSchema = z.object({
  // NB: `FunctionsError` inherits name from `FirebaseError` w/o overriding it
  name: z.literal('FirebaseError'),
  code: z.string().startsWith('functions/'),
  message: z.string(),
  details: z.unknown().optional(),
});

/**
 * Inferred type of {@link FunctionsErrorSchema}.
 *
 * NB: Named `ParsedFunctionsError` to avoid conflict with `FunctionsError` from `firebase/functions`.
 */
export type ParsedFunctionsError = z.infer<typeof FunctionsErrorSchema>;
