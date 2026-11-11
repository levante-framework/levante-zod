import { describe, expect, it } from 'vitest';
import {
  AssignmentConditionRuleSchema,
  AssignmentConditionsSchema,
} from './assignment-conditions';

describe('AssignmentConditionRuleSchema', () => {
  it('accepts an ageMonths rule whose value is an integer', () => {
    const rule = {
      field: 'ageMonths',
      op: 'GREATER_THAN_OR_EQUAL',
      value: 66,
    };
    const result = AssignmentConditionRuleSchema.safeParse(rule);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(rule);
  });

  it('rejects an ageMonths value stored as a string', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'ageMonths',
      op: 'EQUAL',
      value: '66',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'number',
        message: 'Invalid input: expected number, received string',
        path: ['value'],
      },
    ]);
  });

  it('rejects a fractional ageMonths value', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'ageMonths',
      op: 'EQUAL',
      value: 66.5,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'int',
        format: 'safeint',
        message: 'Invalid input: expected int, received number',
        path: ['value'],
      },
    ]);
  });

  it('rejects a negative ageMonths value', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'ageMonths',
      op: 'LESS_THAN',
      value: -1,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected number to be >=0',
        minimum: 0,
        origin: 'number',
        path: ['value'],
      },
    ]);
  });

  it.each(['0', '5', '18'])('accepts the whole-year string "%s"', (value) => {
    const rule = {
      field: 'age',
      op: 'GREATER_THAN_OR_EQUAL',
      value,
    };
    const result = AssignmentConditionRuleSchema.safeParse(rule);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(rule);
  });

  it.each(['', 'five', '5.5', '-1', '05', ' 5'])(
    'rejects the age string "%s"',
    (value) => {
      const result = AssignmentConditionRuleSchema.safeParse({
        field: 'age',
        op: 'EQUAL',
        value,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Expected a whole number of years',
          path: ['value'],
        },
      ]);
    },
  );

  it.each([0, 5, 18])('accepts the whole-year number %s', (value) => {
    const rule = { field: 'age', op: 'EQUAL', value };
    const result = AssignmentConditionRuleSchema.safeParse(rule);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(rule);
  });

  it.each([-1, 5.5])('rejects the age number %s', (value) => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'age',
      op: 'EQUAL',
      value,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Expected a whole number of years',
        path: ['value'],
      },
    ]);
  });

  it.each(['student', 'parent', 'teacher'] as const)(
    'accepts the user type "%s"',
    (value) => {
      const rule = { field: 'userType', op: 'EQUAL', value };
      const result = AssignmentConditionRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(rule);
    },
  );

  it.each(['', 'admin', 'child'])('rejects the user type "%s"', (value) => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'userType',
      op: 'EQUAL',
      value,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: ['student', 'parent', 'teacher'],
        message: 'Invalid option: expected one of "student"|"parent"|"teacher"',
        path: ['value'],
      },
    ]);
  });

  it('rejects an age comparison on a user type', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'userType',
      op: 'GREATER_THAN',
      value: 'student',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: ['EQUAL', 'NOT_EQUAL'],
        message: 'Invalid option: expected one of "EQUAL"|"NOT_EQUAL"',
        path: ['op'],
      },
    ]);
  });

  it('rejects an unknown field', () => {
    const result = AssignmentConditionRuleSchema.safeParse({
      field: 'grade',
      op: 'EQUAL',
      value: '1',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_union',
        discriminator: 'field',
        errors: [],
        message:
          "Invalid discriminator value. Expected 'userType' | 'age' | 'ageMonths'",
        note: 'No matching discriminator',
        options: ['userType', 'age', 'ageMonths'],
        path: ['field'],
      },
    ]);
  });
});

describe('AssignmentConditionsSchema', () => {
  it('accepts the assessment conditions object the dashboard sends', () => {
    const conditions = {
      assigned: {
        op: 'AND',
        conditions: [
          { field: 'userType', op: 'EQUAL', value: 'student' },
          { field: 'ageMonths', op: 'GREATER_THAN_OR_EQUAL', value: 66 },
        ],
      },
      optional: true,
    };
    const result = AssignmentConditionsSchema.safeParse(conditions);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(conditions);
  });

  it('rejects an empty condition group', () => {
    const result = AssignmentConditionsSchema.safeParse({
      assigned: { op: 'AND', conditions: [] },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected array to have >=1 items',
        minimum: 1,
        origin: 'array',
        path: ['assigned', 'conditions'],
      },
    ]);
  });
});
