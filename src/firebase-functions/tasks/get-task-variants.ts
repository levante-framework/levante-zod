import * as z from 'zod';
import { NonEmptyStringSchema } from '../../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';
import type { SerializedTaskVariant } from '../firestore';

/** Parameters schema for `getTaskVariants` Firebase Function. */
export const GetTaskVariantsParamsSchema = z
  .object({
    registered: z.boolean().optional(),
    taskId: NonEmptyStringSchema.optional(),
    variantIds: z.array(NonEmptyStringSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.taskId && data.variantIds) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must not have both taskId and variantIds',
        path: ['taskId|variantIds'],
        input: data,
      });
    }
  });

/** Inferred type of {@link GetTaskVariantsParamsSchema}. */
export type GetTaskVariantsParams = z.infer<typeof GetTaskVariantsParamsSchema>;

/** Result type for `getTaskVariants` Firebase Function. */
export type GetTaskVariantsResult = {
  variants: SerializedTaskVariant[];
};

/** Error schema for `getTaskVariants` Firebase Function. */
export const GetTaskVariantsErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('task'),
      taskId: z.string(),
    }),
  }),
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.object({
      code: z.literal('variants'),
      variantIds: z.array(z.string()),
    }),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetTaskVariantsErrorSchema}. */
export type GetTaskVariantsError = z.infer<typeof GetTaskVariantsErrorSchema>;
