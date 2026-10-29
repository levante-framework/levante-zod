import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import { RoleSchema } from './role';
import { TimestampSchema } from './timestamp';

/** Schema for Admin-specific data within Users. @deprecated */
export const AdminDataSchema = z.object({
  administrationsCreated: z.array(z.string()),
});

/** Inferred type of {@link AdminDataSchema}. @deprecated */
export type AdminDataType = z.infer<typeof AdminDataSchema>;

/** Schema for organizational associations within Users. @deprecated */
export const OrgAssociationMapSchema = z.object({
  all: z.array(z.string()),
  current: z.array(z.string()),
  dates: z.record(z.string(), TimestampSchema),
});

/** Inferred type of {@link OrgAssociationMapSchema}. @deprecated */
export type OrgAssociationMapType = z.infer<typeof OrgAssociationMapSchema>;

/** Schema for user legal document acceptance within Users. @deprecated */
export const UserLegalSchema = z.object({
  assent: z.record(z.string(), TimestampSchema),
  tos: z.record(z.string(), TimestampSchema),
});

/** Inferred type of {@link UserLegalSchema}. @deprecated */
export type UserLegalType = z.infer<typeof UserLegalSchema>;

/** Schema for documents in the `users` collection. @deprecated */
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

/** Inferred type of {@link UserSchema}. @deprecated */
export type UserType = z.infer<typeof UserSchema>;

export const BaseUserDocSchema = z.looseObject({
  email: NonEmptyStringSchema,
  archived: z.boolean(),
  disabled: z.boolean(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  roles: z.array(RoleSchema),

  // districts: TODO...
  // schools: TODO...
  // classes: TODO...
  // groups: TODO...
});

export const ParticipantUserDocSchema = BaseUserDocSchema.extend({
  userType: z.enum(['parent', 'student', 'teacher']),
  uid: z.string(),
  username: z.string(),
}).superRefine((data, ctx) => {
  const localPart = data.email.split('@')[0] ?? '';
  if (data.username !== localPart) {
    ctx.addIssue({
      code: 'custom',
      message: `username must match the local part of email: expected '${localPart}'`,
      path: ['username'],
      input: data.username,
    });
  }
});

export const AdminUserDocSchema = BaseUserDocSchema.extend({
  userType: z.literal('admin'),
});

/**
 * Schema for Firestore documents in the `users` collection.
 * TODO descriminated union by userType: z.enum(['admin', 'parent', 'student', 'teacher'])
 */
export const UserDocSchema = z.discriminatedUnion('userType', [
  ParticipantUserDocSchema,
  AdminUserDocSchema,
]);

/** Inferred type of {@link UserDocSchema}. */
export type UserDocType = z.infer<typeof UserDocSchema>;
