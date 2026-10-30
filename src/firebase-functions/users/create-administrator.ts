import * as z from 'zod';
import { UserRoleSchema } from '../../domain/user-role';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import { makeTooBigIssue, makeTooSmallIssue } from '../../util/issues';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';

/** Parameters schema for `createAdministrator` Firebase Function. */
export const CreateAdministratorParamsSchema = z
  .object({
    email: z.email(),
    name: {
      first: NonEmptyStringSchema,
      middle: NonEmptyStringSchema.optional(),
      last: NonEmptyStringSchema,
    },
    roles: z.array(UserRoleSchema),
  })
  .superRefine((data, ctx) => {
    // Roles array must contain exactly one role
    if (data.roles.length < 1) {
      ctx.addIssue(
        makeTooSmallIssue({
          input: data.roles,
          minimum: 1,
          origin: 'array',
          path: ['roles'],
        }),
      );
      return;
    }
    if (data.roles.length > 1) {
      ctx.addIssue(
        makeTooBigIssue({
          input: data.roles,
          maximum: 1,
          origin: 'array',
          path: ['roles'],
        }),
      );
      return;
    }
  });

/** Inferred type of {@link CreateAdministratorParamsSchema}. */
export type CreateAdministratorParams = z.infer<
  typeof CreateAdministratorParamsSchema
>;

/** Result type for `createAdministrator` Firebase Function. */
export type CreateAdministratorResult = {
  uid: string;
};

/** Error schema for `createAdministrator` Firebase Function. */
export const CreateAdministratorErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link CreateAdministratorErrorSchema}. */
export type CreateAdministratorError = z.infer<
  typeof CreateAdministratorErrorSchema
>;
