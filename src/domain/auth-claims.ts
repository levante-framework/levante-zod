import * as z from 'zod';

/**
 * Schema for legacy Firebase Auth customClaims.
 *
 * To be deprecated in favor of {@link AuthClaimsSchema}.
 */
export const LegacyClaimsSchema = z.object({
  admin: z.boolean().optional(),
  roles: z.array(
    z.object({
      siteId: z.string(),
      role: z.string(),
      siteName: z.string(),
    }),
  ),
  rolesSet: z.array(z.string()),
  siteNames: z.record(z.string(), z.string()),
  siteRoles: z.record(z.string(), z.array(z.string())),
  super_admin: z.boolean().optional(),
  useNewPermissions: z.boolean().optional(),
});

/** Inferred type for {@link LegacyClaimsSchema}. */
export type LegacyClaims = z.infer<typeof LegacyClaimsSchema>;

/** Schema for Firebase Auth customClaims. */
export const AuthClaimsSchema = z.object({
  claimsVersion: z.literal(1),
  isSuperAdmin: z.boolean(),
  // -1: (no role), 0: participant, 1: research_assistant, 2: admin, 3: site_admin
  siteRoles: z.record(z.string(), z.int().min(-1).max(3)),
});

/** Inferred type for {@link AuthClaimsSchema}. */
export type AuthClaims = z.infer<typeof AuthClaimsSchema>;
