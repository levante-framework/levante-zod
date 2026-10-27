import * as z from 'zod';
import { TimestampSchema } from './timestamp';

/** Schema for Admin-specific data within Users. */
export const AdminDataSchema = z.object({
  administrationsCreated: z.array(z.string()),
});

/* Inferred type of {@link AdminDataSchema}. */
export type AdminDataType = z.infer<typeof AdminDataSchema>;

/** Schema for organizational associations within Users. */
export const OrgAssociationMapSchema = z.object({
  all: z.array(z.string()),
  current: z.array(z.string()),
  dates: z.record(z.string(), TimestampSchema),
});

/* Inferred type of {@link OrgAssociationMapSchema}. */
export type OrgAssociationMapType = z.infer<typeof OrgAssociationMapSchema>;

/** Schema for user legal document acceptance within Users. */
export const UserLegalSchema = z.object({
  assent: z.record(z.string(), TimestampSchema),
  tos: z.record(z.string(), TimestampSchema),
});

/* Inferred type of {@link UserLegalSchema}. */
export type UserLegalType = z.infer<typeof UserLegalSchema>;

/** Schema for documents in the `users` collection. */
export const UserSchema = z.object({
  adminData: AdminDataSchema.optional(),
  assignments: z
    .object({
      assigned: z.array(z.string()),
      completed: z.array(z.string()),
      started: z.array(z.string()),
    })
    .optional(),
  archived: z.boolean(),
  classes: OrgAssociationMapSchema,
  createdAt: TimestampSchema,
  disabled: z.boolean(),
  displayName: z.string(),
  districts: OrgAssociationMapSchema,
  email: z.string(),
  groups: OrgAssociationMapSchema,
  legal: UserLegalSchema,
  schools: OrgAssociationMapSchema,
  sso: z.string().optional(),
  userType: z.enum(['admin', 'teacher', 'student', 'parent']),
  testData: z.boolean().optional(),
});

/* Inferred type of {@link UserSchema}. */
export type UserType = z.infer<typeof UserSchema>;
