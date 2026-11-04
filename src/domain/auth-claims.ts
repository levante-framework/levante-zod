import * as z from 'zod';
import { findDuplicateIndexes } from '../util/find-duplicate-indexes';

const ROLES = [
  'participant',
  'research_assistant',
  'admin',
  'site_admin',
  'super_admin',
] as const;

/**
 * Schema for legacy Firebase Auth customClaims.
 *
 * To be deprecated in favor of {@link AuthClaimsSchema}.
 */
export const LegacyClaimsSchema = z
  .object({
    rolesSet: z.array(z.enum(ROLES)),
    siteNames: z.record(z.string(), z.string()),
    siteRoles: z.record(z.string(), z.array(z.enum(ROLES))),
    useNewPermissions: z.literal(true),
    super_admin: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // `rolesSet` must be contain no duplicates
    for (const idx of findDuplicateIndexes(data.rolesSet)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be unique',
        path: ['rolesSet', idx],
        input: data.rolesSet[idx],
      });
    }

    // Every key in `siteNames` must be a key in `siteRoles`
    for (const siteId of Object.keys(data.siteNames)) {
      if (!(siteId in data.siteRoles)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Site must be present in siteRoles',
          path: ['siteNames', siteId],
          input: siteId,
        });
      }
    }

    // `rolesSet` must be exactly the set of roles used across `siteRoles`
    const declaredRoles = new Set(data.rolesSet);
    const siteRolesUsed = new Set<string>();
    for (const [siteId, roles] of Object.entries(data.siteRoles)) {
      roles.forEach((role, idx) => {
        siteRolesUsed.add(role);
        if (!declaredRoles.has(role)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Role must be present in rolesSet',
            path: ['siteRoles', siteId, idx],
            input: role,
          });
        }
      });
    }
    data.rolesSet.forEach((role, idx) => {
      if (!siteRolesUsed.has(role)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Role must be used in siteRoles',
          path: ['rolesSet', idx],
          input: role,
        });
      }
    });

    // The super_admin role requires `super_admin` to be true.
    if (data.rolesSet.includes('super_admin') && data.super_admin !== true) {
      ctx.addIssue({
        code: 'custom',
        message: 'super_admin must be true when rolesSet includes super_admin',
        path: ['super_admin'],
        input: data.super_admin,
      });
    }
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
