import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import { UpsertTaskErrorSchema, UpsertTaskParamsSchema } from './upsert-task';

/** Arbitrary: a non-boolean value */
const $nonBoolean = fc.anything().filter((v) => typeof v !== 'boolean');

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Fixture: a valid params object (id is optional and omitted) */
const $validParams = {
  archived: false,
  description: 'A task',
  image: 'task.png',
  name: 'my-task',
};

describe('UpsertTaskParamsSchema', () => {
  it('accepts valid props without an id', () => {
    expect(UpsertTaskParamsSchema.parse($validParams)).toEqual($validParams);
  });

  it('accepts valid props with an id', () => {
    const params = { ...$validParams, id: 'task-1' };
    expect(UpsertTaskParamsSchema.parse(params)).toEqual(params);
  });

  it('strips unexpected props', () => {
    const result = UpsertTaskParamsSchema.parse({
      ...$validParams,
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual($validParams);
  });

  describe('archived', () => {
    it.prop({ v: $nonBoolean })('rejects a non-boolean archived', ({ v }) => {
      const result = UpsertTaskParamsSchema.safeParse({
        ...$validParams,
        archived: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected boolean, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['archived']);
    });

    it('rejects a missing archived', () => {
      const { archived: _archived, ...rest } = $validParams;
      const result = UpsertTaskParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          message: 'Invalid input: expected boolean, received undefined',
          path: ['archived'],
        },
      ]);
    });
  });

  describe.each(['description', 'image', 'name'] as const)('%s', (field) => {
    it.prop({ v: $nonString })(`rejects a non-string ${field}`, ({ v }) => {
      const result = UpsertTaskParamsSchema.safeParse({
        ...$validParams,
        [field]: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected string, received/,
      );
      expect(result.error!.issues[0].path).toEqual([field]);
    });

    it(`rejects a missing ${field}`, () => {
      const { [field]: _omitted, ...rest } = $validParams;
      const result = UpsertTaskParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: [field],
        },
      ]);
    });

    it(`rejects an empty ${field}`, () => {
      const result = UpsertTaskParamsSchema.safeParse({
        ...$validParams,
        [field]: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: [field],
        },
      ]);
    });
  });

  describe('id', () => {
    it('rejects an empty id', () => {
      const result = UpsertTaskParamsSchema.safeParse({
        ...$validParams,
        id: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['id'],
        },
      ]);
    });
  });
});

describe('UpsertTaskErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'name', message: 'Required' }],
      });
      expect(() => UpsertTaskErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => UpsertTaskErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => UpsertTaskErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('accepts functions/not-found/task error', () => {
    const err = new FunctionsError('not-found', 'Task not found', {
      code: 'task',
      taskId: 'task-1',
    });
    expect(() => UpsertTaskErrorSchema.parse(err)).not.toThrow();
  });

  it('rejects an unknown error code', () => {
    const err = new FunctionsError('internal', 'Internal error');
    expect(() => UpsertTaskErrorSchema.parse(err)).toThrow();
  });
});
