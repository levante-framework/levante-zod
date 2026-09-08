import { fc, it } from '@fast-check/vitest';
import { FunctionsError } from 'firebase/functions';
import { describe, expect } from 'vitest';
import {
  GetVariantParamSpecsErrorSchema,
  GetVariantParamSpecsParamsSchema,
} from './get-variant-param-specs';

/** Arbitrary: a non-boolean value (excluding undefined, which is allowed) */
const $nonBoolean = fc
  .anything()
  .filter((v) => typeof v !== 'boolean' && v !== undefined);

describe('GetVariantParamSpecsParamsSchema', () => {
  it('accepts an empty object (archived is optional)', () => {
    expect(GetVariantParamSpecsParamsSchema.parse({})).toEqual({});
  });

  it.each([true, false])('accepts archived %s', (archived) => {
    expect(GetVariantParamSpecsParamsSchema.parse({ archived })).toEqual({
      archived,
    });
  });

  it('strips unexpected props', () => {
    const result = GetVariantParamSpecsParamsSchema.parse({
      archived: true,
      unexpected: 'bar',
      another: 'baz',
    });
    expect(result).toEqual({ archived: true });
  });

  describe('archived', () => {
    it.prop({ v: $nonBoolean })('rejects a non-boolean archived', ({ v }) => {
      const result = GetVariantParamSpecsParamsSchema.safeParse({
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
  });
});

describe('GetVariantParamSpecsErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'archived', message: 'Expected boolean' }],
      });
      expect(() => GetVariantParamSpecsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => GetVariantParamSpecsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => GetVariantParamSpecsErrorSchema.parse(err)).not.toThrow();
    });
  });

  it('rejects an unknown error code', () => {
    const err = new FunctionsError('internal', 'Internal error');
    expect(() => GetVariantParamSpecsErrorSchema.parse(err)).toThrow();
  });
});
