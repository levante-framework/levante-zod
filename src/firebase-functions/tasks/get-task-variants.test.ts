import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import {
  GetTaskVariantsErrorSchema,
  GetTaskVariantsParamsSchema,
} from './get-task-variants';

/** Arbitrary: a non-boolean value (excluding undefined, which is allowed) */
const $nonBoolean = fc
  .anything()
  .filter((v) => typeof v !== 'boolean' && v !== undefined);

/** Arbitrary: a non-string value (excluding undefined, which is allowed) */
const $nonString = fc
  .anything()
  .filter((v) => typeof v !== 'string' && v !== undefined);

describe('GetTaskVariantsParamsSchema', () => {
  it('accepts an empty object (all props optional)', () => {
    expect(GetTaskVariantsParamsSchema.parse({})).toEqual({});
  });

  it('accepts archived and registered booleans', () => {
    const params = { archived: true, registered: false };
    expect(GetTaskVariantsParamsSchema.parse(params)).toEqual(params);
  });

  it('accepts a taskId', () => {
    const params = { taskId: 'my-task' };
    expect(GetTaskVariantsParamsSchema.parse(params)).toEqual(params);
  });

  it('accepts variantIds', () => {
    const params = { variantIds: ['a', 'b'] };
    expect(GetTaskVariantsParamsSchema.parse(params)).toEqual(params);
  });

  it('strips unexpected props', () => {
    const result = GetTaskVariantsParamsSchema.parse({
      taskId: 'my-task',
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual({ taskId: 'my-task' });
  });

  describe('archived', () => {
    it.prop({ v: $nonBoolean })('rejects a non-boolean archived', ({ v }) => {
      const result = GetTaskVariantsParamsSchema.safeParse({ archived: v });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected boolean, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['archived']);
    });
  });

  describe('registered', () => {
    it.prop({ v: $nonBoolean })('rejects a non-boolean registered', ({ v }) => {
      const result = GetTaskVariantsParamsSchema.safeParse({ registered: v });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected boolean, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['registered']);
    });
  });

  describe('taskId', () => {
    it.prop({ v: $nonString })('rejects a non-string taskId', ({ v }) => {
      const result = GetTaskVariantsParamsSchema.safeParse({ taskId: v });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected string, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['taskId']);
    });

    it('rejects an empty taskId', () => {
      const result = GetTaskVariantsParamsSchema.safeParse({ taskId: '   ' });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['taskId'],
        },
      ]);
    });
  });

  describe('variantIds', () => {
    it('rejects a non-array variantIds', () => {
      const result = GetTaskVariantsParamsSchema.safeParse({
        variantIds: 'my-variant',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'array',
          message: 'Invalid input: expected array, received string',
          path: ['variantIds'],
        },
      ]);
    });

    it('rejects an empty variantId element', () => {
      const result = GetTaskVariantsParamsSchema.safeParse({
        variantIds: ['a', '   '],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['variantIds', 1],
        },
      ]);
    });
  });

  describe('cross-field validation', () => {
    it('rejects supplying both taskId and variantIds', () => {
      const result = GetTaskVariantsParamsSchema.safeParse({
        taskId: 'my-task',
        variantIds: ['a'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'custom',
          message: 'Must not supply both taskId and variantIds',
          path: ['taskId|variantIds'],
        },
      ]);
    });
  });
});

describe('GetTaskVariantsErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'taskId', message: 'Required' }],
      });
      expect(() => GetTaskVariantsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => GetTaskVariantsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => GetTaskVariantsErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('accepts functions/not-found/task error', () => {
    const err = new FunctionsError('not-found', 'Task not found', {
      code: 'task',
      taskId: 'my-task',
    });
    expect(() => GetTaskVariantsErrorSchema.parse(err)).not.toThrow();
  });

  it('accepts functions/not-found/variants error', () => {
    const err = new FunctionsError('not-found', 'Variants not found', {
      code: 'variants',
      variantIds: ['a', 'b'],
    });
    expect(() => GetTaskVariantsErrorSchema.parse(err)).not.toThrow();
  });

  it('rejects an unknown error code', () => {
    const err = new FunctionsError('internal', 'Internal error');
    expect(() => GetTaskVariantsErrorSchema.parse(err)).toThrow();
  });
});
