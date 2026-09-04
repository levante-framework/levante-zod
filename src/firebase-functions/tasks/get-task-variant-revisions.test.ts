import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import {
  GetTaskVariantRevisionsErrorSchema,
  GetTaskVariantRevisionsParamsSchema,
} from './get-task-variant-revisions';

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Fixture: a valid params object */
const $validParams = {
  variantId: 'my-variant',
};

describe('GetTaskVariantRevisionsParamsSchema', () => {
  it('accepts valid props', () => {
    expect(GetTaskVariantRevisionsParamsSchema.parse($validParams)).toEqual(
      $validParams,
    );
  });

  it('strips unexpected props', () => {
    const result = GetTaskVariantRevisionsParamsSchema.parse({
      ...$validParams,
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual($validParams);
  });

  describe('variantId', () => {
    it.prop({ v: $nonString })('rejects a non-string variantId', ({ v }) => {
      const result = GetTaskVariantRevisionsParamsSchema.safeParse({
        ...$validParams,
        variantId: v,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].message).toMatch(
        /^Invalid input: expected string, received/,
      );
      expect(result.error!.issues[0].path).toEqual(['variantId']);
    });

    it('rejects a missing variantId', () => {
      const result = GetTaskVariantRevisionsParamsSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['variantId'],
        },
      ]);
    });

    it('rejects an empty variantId', () => {
      const result = GetTaskVariantRevisionsParamsSchema.safeParse({
        ...$validParams,
        variantId: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['variantId'],
        },
      ]);
    });
  });
});

describe('GetTaskVariantRevisionsErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'variantId', message: 'Required' }],
      });
      expect(() => GetTaskVariantRevisionsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => GetTaskVariantRevisionsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => GetTaskVariantRevisionsErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('accepts functions/not-found/variant error', () => {
    const err = new FunctionsError('not-found', 'Variant not found', {
      code: 'variant',
      variantId: 'my-variant',
    });
    expect(() => GetTaskVariantRevisionsErrorSchema.parse(err)).not.toThrow();
  });

  it('rejects an unknown error code', () => {
    const err = new FunctionsError('internal', 'Internal error');
    expect(() => GetTaskVariantRevisionsErrorSchema.parse(err)).toThrow();
  });
});
