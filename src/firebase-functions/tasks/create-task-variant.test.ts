import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import {
  CreateTaskVariantErrorSchema,
  CreateTaskVariantParamsSchema,
} from './create-task-variant';

/** Arbitrary: a non-boolean value */
const $nonBoolean = fc.anything().filter((v) => typeof v !== 'boolean');

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Arbitrary: a non-object value (i.e. not a valid record) */
const $nonObject = fc
  .anything()
  .filter((v) => typeof v !== 'object' || v === null);

/** Fixture: a valid params object */
const $validParams = {
  name: 'my-variant',
  displayName: 'My Variant',
  params: { foo: true, bar: 1, baz: 'qux' },
  registered: false,
  taskId: 'my-task',
};

describe('CreateTaskVariantParamsSchema', () => {
  it('accepts valid props', () => {
    expect(CreateTaskVariantParamsSchema.parse($validParams)).toEqual(
      $validParams,
    );
  });

  it('strips unexpected props', () => {
    const result = CreateTaskVariantParamsSchema.parse({
      ...$validParams,
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual($validParams);
  });

  describe('name', () => {
    it.prop({ v: $nonString })('rejects a non-string name', ({ v }) => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        name: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected string, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['name']);
    });

    it('rejects a missing name', () => {
      const { name: _name, ...rest } = $validParams;
      const result = CreateTaskVariantParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['name'],
        },
      ]);
    });

    it('rejects an empty name', () => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        name: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['name'],
        },
      ]);
    });
  });

  describe('displayName', () => {
    it.prop({ v: $nonString })('rejects a non-string displayName', ({ v }) => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        displayName: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected string, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['displayName']);
    });

    it('rejects a missing displayName', () => {
      const { displayName: _displayName, ...rest } = $validParams;
      const result = CreateTaskVariantParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['displayName'],
        },
      ]);
    });

    it('rejects an empty displayName', () => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        displayName: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['displayName'],
        },
      ]);
    });
  });

  describe('params', () => {
    it('accepts an empty params record', () => {
      const params = { ...$validParams, params: {} };
      expect(CreateTaskVariantParamsSchema.parse(params)).toEqual(params);
    });

    it.prop({ v: $nonObject })('rejects a non-object params', ({ v }) => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        params: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0]).toMatchObject({ expected: 'record' });
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected record, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['params']);
    });

    it('rejects a missing params', () => {
      const { params: _params, ...rest } = $validParams;
      const result = CreateTaskVariantParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'record',
          message: 'Invalid input: expected record, received undefined',
          path: ['params'],
        },
      ]);
    });

    it('rejects a param value of an unsupported type', () => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        params: { foo: null },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_union',
          errors: [
            [
              {
                code: 'invalid_type',
                expected: 'boolean',
                message: 'Invalid input: expected boolean, received null',
                path: [],
              },
            ],
            [
              {
                code: 'invalid_type',
                expected: 'number',
                message: 'Invalid input: expected number, received null',
                path: [],
              },
            ],
            [
              {
                code: 'invalid_type',
                expected: 'string',
                message: 'Invalid input: expected string, received null',
                path: [],
              },
            ],
          ],
          message: 'Invalid input',
          path: ['params', 'foo'],
        },
      ]);
    });
  });

  describe('registered', () => {
    it.prop({ v: $nonBoolean })('rejects a non-boolean registered', ({ v }) => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        registered: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected boolean, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['registered']);
    });

    it('rejects a missing registered', () => {
      const { registered: _registered, ...rest } = $validParams;
      const result = CreateTaskVariantParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          message: 'Invalid input: expected boolean, received undefined',
          path: ['registered'],
        },
      ]);
    });
  });

  describe('taskId', () => {
    it.prop({ v: $nonString })('rejects a non-string taskId', ({ v }) => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        taskId: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected string, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['taskId']);
    });

    it('rejects a missing taskId', () => {
      const { taskId: _taskId, ...rest } = $validParams;
      const result = CreateTaskVariantParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['taskId'],
        },
      ]);
    });

    it('rejects an empty taskId', () => {
      const result = CreateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        taskId: '   ',
      });
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
});

describe('CreateTaskVariantErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'name', message: 'Required' }],
      });
      expect(() => CreateTaskVariantErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => CreateTaskVariantErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => CreateTaskVariantErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('accepts functions/already-exists/params error', () => {
    const err = new FunctionsError('already-exists', 'Variant already exists', {
      code: 'params',
      params: { foo: true, bar: 1, baz: 'qux' },
    });
    expect(() => CreateTaskVariantErrorSchema.parse(err)).not.toThrow();
  });

  it('accepts functions/not-found/task error', () => {
    const err = new FunctionsError('not-found', 'Task not found', {
      code: 'task',
      taskId: 'my-task',
    });
    expect(() => CreateTaskVariantErrorSchema.parse(err)).not.toThrow();
  });

  it('rejects an unknown error code', () => {
    const err = new FunctionsError('internal', 'Internal error');
    expect(() => CreateTaskVariantErrorSchema.parse(err)).toThrow();
  });
});
