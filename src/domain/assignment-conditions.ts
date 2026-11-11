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
 * User types the dashboard condition select stores. Labels are Child, Caregiver,
 * and Teacher; the stored values are the ROAR types.
 */
const AssignmentUserTypeSchema = z.enum(['student', 'parent', 'teacher']);

/**
 * A legacy whole-year age. The dashboard select stores `"5"`; existing
 * administration documents and the evaluator also allow the number `5`.
 * Either form is kept as stored. Empty strings, free text, fractions, signs,
 * and leading zeros are rejected.
 */
const WholeYearSchema = z
  .union([z.string(), z.number()])
  .superRefine((value, ctx) => {
    if (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)) return;
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
      return;

    ctx.addIssue({
      code: 'custom',
      message: 'Expected a whole number of years',
      path: [],
      input: value,
    });
  });

/**
 * One rule inside an assignment condition group.
 *
 * `userType` is one of the dashboard select values. Legacy `age` is a whole
 * number of years, stored as a string or a number. `ageMonths` is total months
 * (`years * 12 + months`) and must be an integer. A numeric string such as
 * `"66"` is rejected.
 */
export const AssignmentConditionRuleSchema = z.discriminatedUnion('field', [
  z.object({
    field: z.literal('userType'),
    op: EqualityOperatorSchema,
    value: AssignmentUserTypeSchema,
  }),
  z.object({
    field: z.literal('age'),
    op: ComparisonOperatorSchema,
    value: WholeYearSchema,
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
