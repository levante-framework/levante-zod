// @CC: "To check whether this is compatible with firestore - they encode
// this using seconds and nanoseconds and it usually has to be converted"

import * as z from 'zod';

/** Schema for Firestore Timestamp. @deprecated */
export const TimestampSchema = z.iso.datetime();

/** Inferred type of {@link TimestampSchema}. @deprecated */
export type TimestampType = z.infer<typeof TimestampSchema>;
