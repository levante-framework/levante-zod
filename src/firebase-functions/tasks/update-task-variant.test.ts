import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import {
  UpdateTaskVariantErrorSchema,
  UpdateTaskVariantParamsSchema,
} from './update-task-variant';

/** Arbitrary: a non-boolean value */
const $nonBoolean = fc.anything().filter((v) => typeof v !== 'boolean');

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Fixture: a valid params object */
const $validParams = {
  id: 'my-variant',
  archived: false,
  registered: true,
};

describe('UpdateTaskVariantParamsSchema', () => {
  it('accepts valid props', () => {
    expect(UpdateTaskVariantParamsSchema.parse($validParams)).toEqual(
      $validParams,
    );
  });

  it('strips unexpected props', () => {
    const result = UpdateTaskVariantParamsSchema.parse({
      ...$validParams,
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual($validParams);
  });

  describe('id', () => {
    it.prop({ v: $nonString })('rejects a non-string id', ({ v }) => {
      const result = UpdateTaskVariantParamsSchema.safeParse({
        ...$validParams,
        id: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected string, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['id']);
    });

    it('rejects a missing id', () => {
      const { id: _id, ...rest } = $validParams;
      const result = UpdateTaskVariantParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['id'],
        },
      ]);
    });

    it('rejects an empty id', () => {
      const result = UpdateTaskVariantParamsSchema.safeParse({
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

  describe('archived', () => {
    it.prop({ v: $nonBoolean })('rejects a non-boolean archived', ({ v }) => {
      const result = UpdateTaskVariantParamsSchema.safeParse({
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
      const result = UpdateTaskVariantParamsSchema.safeParse(rest);
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

  describe('registered', () => {
    it.prop({ v: $nonBoolean })('rejects a non-boolean registered', ({ v }) => {
      const result = UpdateTaskVariantParamsSchema.safeParse({
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
      const result = UpdateTaskVariantParamsSchema.safeParse(rest);
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
});

describe('UpdateTaskVariantErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'id', message: 'Required' }],
      });
      expect(() => UpdateTaskVariantErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => UpdateTaskVariantErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => UpdateTaskVariantErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('accepts functions/not-found/variant error', () => {
    const err = new FunctionsError('not-found', 'Variant not found', {
      code: 'variant',
      variantId: 'my-variant',
    });
    expect(() => UpdateTaskVariantErrorSchema.parse(err)).not.toThrow();
  });

  it('rejects an unknown error code', () => {
    const err = new FunctionsError('internal', 'Internal error');
    expect(() => UpdateTaskVariantErrorSchema.parse(err)).toThrow();
  });
});
