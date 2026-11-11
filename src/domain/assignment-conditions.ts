import * as z from 'zod';

/**
 * Operators `evaluateCondition` implements. User type only uses equality.
 * Age uses the full set.
 */
const EqualityOperatorSchema = z.enum(['EQUAL', 'NOT_EQUAL']);

const ComparisonOperatorSchema = z.enum([
  'LESS_THAN',
  'GREATER_THAN',
  'LESS_THAN_OR_EQUAL',
  'GREATER_THAN_OR_EQUAL',
  'EQUAL',
  'NOT_EQUAL',
]);

/**
 * One rule inside an assignment condition group.
 *
 * `userType` and whole-year `age` stay strings: the dashboard select stores
 * them that way. `ageMonths` is total months (`years * 12 + months`) and must
 * be an integer. A numeric string such as `"66"` is rejected.
 */
export const AssignmentConditionRuleSchema = z.discriminatedUnion('field', [
  z.object({
    field: z.literal('userType'),
    op: EqualityOperatorSchema,
    value: z.string(),
  }),
  z.object({
    field: z.literal('age'),
    op: ComparisonOperatorSchema,
    value: z.string(),
  }),
  z.object({
    field: z.literal('ageMonths'),
    op: ComparisonOperatorSchema,
    value: z.int().min(0),
  }),
]);

/** `{ op, conditions }` as stored on `assigned` and, when not `true`, on `optional`. */
export const AssignmentConditionGroupSchema = z.object({
  op: z.enum(['AND', 'OR']),
  conditions: z.array(AssignmentConditionRuleSchema).min(1),
});

/**
 * Conditions object on one assessment in the `upsertAdministration` payload.
 * This is the shape the dashboard sends. `AdministrationSchema` does not
 * describe these nested rules.
 */
export const AssignmentConditionsSchema = z.object({
  assigned: AssignmentConditionGroupSchema.optional(),
  optional: z
    .union([z.literal(true), AssignmentConditionGroupSchema])
    .optional(),
});

export type AssignmentConditionRule = z.infer<
  typeof AssignmentConditionRuleSchema
>;
export type AssignmentConditionGroup = z.infer<
  typeof AssignmentConditionGroupSchema
>;
export type AssignmentConditions = z.infer<typeof AssignmentConditionsSchema>;
