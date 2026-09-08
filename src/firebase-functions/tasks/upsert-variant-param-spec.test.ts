import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import {
  UpsertVariantParamSpecErrorSchema,
  UpsertVariantParamSpecParamsSchema,
} from './upsert-variant-param-spec';

/** Arbitrary: a non-boolean value */
const $nonBoolean = fc.anything().filter((v) => typeof v !== 'boolean');

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Fixture: a valid params object (id is optional and omitted) */
const $validParams = {
  archived: false,
  description: 'A param spec',
  name: 'my-spec',
  type: 'boolean' as const,
};

describe('UpsertVariantParamSpecParamsSchema', () => {
  it('accepts valid props without an id', () => {
    expect(UpsertVariantParamSpecParamsSchema.parse($validParams)).toEqual(
      $validParams,
    );
  });

  it('accepts valid props with an id', () => {
    const params = { ...$validParams, id: 'spec-1' };
    expect(UpsertVariantParamSpecParamsSchema.parse(params)).toEqual(params);
  });

  it('strips unexpected props', () => {
    const result = UpsertVariantParamSpecParamsSchema.parse({
      ...$validParams,
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual($validParams);
  });

  describe('archived', () => {
    it.prop({ v: $nonBoolean })('rejects a non-boolean archived', ({ v }) => {
      const result = UpsertVariantParamSpecParamsSchema.safeParse({
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
      const result = UpsertVariantParamSpecParamsSchema.safeParse(rest);
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

  describe.each(['description', 'name'] as const)('%s', (field) => {
    it.prop({ v: $nonString })(`rejects a non-string ${field}`, ({ v }) => {
      const result = UpsertVariantParamSpecParamsSchema.safeParse({
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
      const result = UpsertVariantParamSpecParamsSchema.safeParse(rest);
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
      const result = UpsertVariantParamSpecParamsSchema.safeParse({
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

  describe('type', () => {
    it.each(['boolean', 'number', 'string', 'unknown'] as const)(
      'accepts type "%s"',
      (type) => {
        expect(
          UpsertVariantParamSpecParamsSchema.parse({ ...$validParams, type }),
        ).toEqual({ ...$validParams, type });
      },
    );

    it('rejects an invalid type', () => {
      const result = UpsertVariantParamSpecParamsSchema.safeParse({
        ...$validParams,
        type: 'object',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_value',
          values: ['boolean', 'number', 'string', 'unknown'],
          message:
            'Invalid option: expected one of "boolean"|"number"|"string"|"unknown"',
          path: ['type'],
        },
      ]);
    });

    it('rejects a missing type', () => {
      const { type: _type, ...rest } = $validParams;
      const result = UpsertVariantParamSpecParamsSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_value',
          values: ['boolean', 'number', 'string', 'unknown'],
          message:
            'Invalid option: expected one of "boolean"|"number"|"string"|"unknown"',
          path: ['type'],
        },
      ]);
    });
  });

  describe('id', () => {
    it('rejects an empty id', () => {
      const result = UpsertVariantParamSpecParamsSchema.safeParse({
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

describe('UpsertVariantParamSpecErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'name', message: 'Required' }],
      });
      expect(() => UpsertVariantParamSpecErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => UpsertVariantParamSpecErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => UpsertVariantParamSpecErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('accepts functions/not-found/variant-param-spec error', () => {
    const err = new FunctionsError('not-found', 'Spec not found', {
      code: 'variant-param-spec',
      variantParamSpecId: 'spec-1',
    });
    expect(() => UpsertVariantParamSpecErrorSchema.parse(err)).not.toThrow();
  });

  it('rejects an unknown error code', () => {
    const err = new FunctionsError('internal', 'Internal error');
    expect(() => UpsertVariantParamSpecErrorSchema.parse(err)).toThrow();
  });
});
