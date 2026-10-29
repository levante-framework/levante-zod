import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/** Schema for user roles. */
export const RoleSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('super_admin'),
    siteId: z.literal('any'),
    siteName: NonEmptyStringSchema, // Is this denormalization necessary?
  }),
  z.object({
    role: z.enum(['site_admin', 'admin', 'research_assistant', 'participant']),
    siteId: NonEmptyStringSchema,
    siteName: NonEmptyStringSchema, // Is this denormalization necessary?
  }),
]);

/** Inferred type of {@link RoleSchema}. */
export type RoleType = z.infer<typeof RoleSchema>;
