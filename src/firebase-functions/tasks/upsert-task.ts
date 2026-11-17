import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import { makeTooSmallIssue } from '../../util/issues';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';
import type { SerializedTask } from '../firestore';

/** Parameters schema for `upsertTask` Firebase Function. */
export const UpsertTaskParamsSchema = z
  .object({
    archived: z.boolean(),
    description: NonEmptyStringSchema,
    image: NonEmptyStringSchema,
    name: NonEmptyStringSchema,
    registered: z.boolean(),
    validUserTypes: z.array(z.enum(['caregiver', 'child', 'teacher'])),
    id: NonEmptyStringSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // validUserTypes must be non-empty
    if (data.validUserTypes.length === 0) {
      ctx.addIssue(
        makeTooSmallIssue({
          input: data.validUserTypes,
          minimum: 1,
          origin: 'array',
          path: ['validUserTypes'],
        }),
      );
      return;
    }

    // validUserTypes must not contain duplicates. This also implicitly caps
    // the array length at the number of valid user types.
    const seen = new Set<string>();
    for (const [index, userType] of data.validUserTypes.entries()) {
      if (seen.has(userType)) {
        ctx.addIssue({
          code: 'custom',
          input: userType,
          message: `Duplicate user type: ${userType}`,
          path: ['validUserTypes', index],
        });
      }
      seen.add(userType);
    }
  });

/** Inferred type of {@link UpsertTaskParamsSchema}. */
export type UpsertTaskParams = z.infer<typeof UpsertTaskParamsSchema>;

/** Result type for `upsertTask` Firebase Function. */
export type UpsertTaskResult = {
  task: SerializedTask;
};

/** Error schema for `upsertTask` Firebase Function. */
export const UpsertTaskErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('task'),
      taskId: z.string(),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link UpsertTaskErrorSchema}. */
export type UpsertTaskError = z.infer<typeof UpsertTaskErrorSchema>;
