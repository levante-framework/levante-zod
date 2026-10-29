import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/** Schema for user roles. */
export const UserRoleSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('super_admin'),
    siteId: z.literal('any'),
  }),
  z.object({
    role: z.enum(['site_admin', 'admin', 'research_assistant', 'participant']),
    siteId: NonEmptyStringSchema,
    // @AB: "`siteName` denormalizes the site's canonical name onto every role.
    // This is a read convenience, but it can drift out of sync with the source
    // of truth and must be updated everywhere when a site is renamed. Do we
    // need to store it here at all, or should consumers resolve the name from
    // `siteId` at read time? If we keep it, where does the authoritative name
    // live and who keeps this copy consistent? Team discussion required before
    // resolving."
    siteName: NonEmptyStringSchema.optional(),
  }),
]);

/** Inferred type of {@link UserRoleSchema}. */
export type UserRole = z.infer<typeof UserRoleSchema>;
