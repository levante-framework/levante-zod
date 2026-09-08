import * as z from 'zod';
import {
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from '../error';
import type { SerializedVariantParamSpec } from '../firestore';

/** Parameters schema for `getVariantParamSpecs` Firebase Function. */
export const GetVariantParamSpecsParamsSchema = z.object({
  archived: z.boolean().optional(),
});

/** Inferred type of {@link GetVariantParamSpecsParamsSchema}. */
export type GetVariantParamSpecsParams = z.infer<
  typeof GetVariantParamSpecsParamsSchema
>;

/** Result type for `getVariantParamSpecs` Firebase Function. */
export type GetVariantParamSpecsResult = {
  variantParamSpecs: SerializedVariantParamSpec[];
};

/** Error schema for `getVariantParamSpecs` Firebase Function. */
export const GetVariantParamSpecsErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetVariantParamSpecsErrorSchema}. */
export type GetVariantParamSpecsError = z.infer<
  typeof GetVariantParamSpecsErrorSchema
>;
