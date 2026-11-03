import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/** Site-scoped roles for admins. */
export const ADMIN_SITE_ROLES = [
  'site_admin',
  'admin',
  'research_assistant',
] as const;

/** Site-scoped roles for all users. */
export const ALL_SITE_ROLES = [...ADMIN_SITE_ROLES, 'participant'] as const;

/**
 * Returns a schema for a site-scoped user role.
 * @param roles - The role names to include in the schema.
 */
export const siteRoleSchema = <const T extends readonly string[]>(roles: T) =>
  z.object({
    role: z.enum(roles),
    siteId: NonEmptyStringSchema,
    // @AB: "`siteName` denormalizes the site's canonical name onto every role.
    // This is a read convenience, but it can drift out of sync with the source
    // of truth and must be updated everywhere when a site is renamed. Do we
    // need to store it here at all, or should consumers resolve the name from
    // `siteId` at read time? If we keep it, where does the authoritative name
    // live and who keeps this copy consistent? Team discussion required before
    // resolving."
    siteName: NonEmptyStringSchema.optional(),
  });

/** Schema for super admin role (not site-scoped). */
export const SuperAdminRoleSchema = z.object({
  role: z.literal('super_admin'),
  siteId: z.literal('any'),
});

/** Inferred type of {@link SuperAdminRoleSchema}. */
export type SuperAdminRole = z.infer<typeof SuperAdminRoleSchema>;

/** Schema for admin roles. */
export const AdminRoleSchema = z.discriminatedUnion('role', [
  SuperAdminRoleSchema,
  siteRoleSchema(ADMIN_SITE_ROLES),
]);

/** Inferred type of {@link AdminRoleSchema}. */
export type AdminRole = z.infer<typeof AdminRoleSchema>;

/** Schema for user roles. */
export const UserRoleSchema = z.discriminatedUnion('role', [
  SuperAdminRoleSchema,
  siteRoleSchema(ALL_SITE_ROLES),
]);

/** Inferred type of {@link UserRoleSchema}. */
export type UserRole = z.infer<typeof UserRoleSchema>;
