import { describe, expect, it } from 'vitest';
import {
  AssignmentConditionRuleSchema,
  AssignmentConditionsSchema,
} from './assignment-conditions';

describe('AssignmentConditionRuleSchema', () => {
  it('accepts an ageMonths rule whose value is an integer', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'ageMonths',
      op: 'GREATER_THAN_OR_EQUAL',
      value: 66,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an ageMonths value stored as a string', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'ageMonths',
      op: 'EQUAL',
      value: '66',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a fractional ageMonths value', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'ageMonths',
      op: 'EQUAL',
      value: 66.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative ageMonths value', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'ageMonths',
      op: 'LESS_THAN',
      value: -1,
    });
    expect(result.success).toBe(false);
  });

  it('still accepts the string values the year and user-type selects store', () => {
    expect(
      AssignmentConditionRuleSchema.safeParse({
        field: 'age',
        op: 'GREATER_THAN_OR_EQUAL',
        value: '5',
      }).success,
    ).toBe(true);
    expect(
      AssignmentConditionRuleSchema.safeParse({
        field: 'userType',
        op: 'EQUAL',
        value: 'student',
      }).success,
    ).toBe(true);
  });
});

describe('AssignmentConditionsSchema', () => {
  it('accepts the assessment conditions object the dashboard sends', () => {
    const result = AssignmentConditionsSchema.safeParse({
      assigned: {
        op: 'AND',
        conditions: [
          { field: 'userType', op: 'EQUAL', value: 'student' },
          { field: 'ageMonths', op: 'GREATER_THAN_OR_EQUAL', value: 66 },
        ],
      },
      optional: true,
    });
    expect(result.success).toBe(true);
  });
});
