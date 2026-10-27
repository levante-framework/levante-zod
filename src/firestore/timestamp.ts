import * as z from 'zod';

/**
 * Schema for a Firestore Timestamp, expressed as an ISO 8601 string.
 *
 * Firestore does not natively hand you a string. Depending on how the data is
 * read, a timestamp can arrive as:
 * - a `Timestamp` class instance with `.seconds` / `.nanoseconds` (Client Web
 *   and Admin SDK document reads);
 * - `{ seconds, nanoseconds, type: 'firestore/timestamp/1.0' }` (Web SDK
 *   `Timestamp.toJSON()`);
 * - `{ _seconds, _nanoseconds }` (Admin SDK `JSON.stringify`);
 * - an RFC 3339 / ISO 8601 string (Firestore REST API).
 *
 * This schema validates only the ISO 8601 string form. The caller is
 * responsible for converting any of the object/instance forms upstream (e.g.
 * `timestamp.toDate().toISOString()`) before parsing.
 *
 * @deprecated
 */
export const TimestampSchema = z.iso.datetime();

/** Inferred type of {@link TimestampSchema}. @deprecated */
export type TimestampType = z.infer<typeof TimestampSchema>;
