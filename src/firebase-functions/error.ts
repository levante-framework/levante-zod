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

/** Default schema for `functions/invalid-argument` errors - i.e., only `schema` sub-case. */
export const InvalidArgumentErrorSchema = FunctionsErrorSchema.extend({
  code: z.literal('functions/invalid-argument'),
  details: z.object({
    code: z.literal('schema'),
    issues: z.array(z.object({ path: z.string(), message: z.string() })),
  }),
});

/** Default schema for `functions/permission-denied` errors. */
export const PermissionDeniedErrorSchema = FunctionsErrorSchema.extend({
  code: z.literal('functions/permission-denied'),
  details: z.undefined(),
});

/** Default schema for `functions/unauthenticated` errors. */
export const UnauthenticatedErrorSchema = FunctionsErrorSchema.extend({
  code: z.literal('functions/unauthenticated'),
  details: z.undefined(),
});
