import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import {
  LoadFormDefinitionsErrorSchema,
  LoadFormDefinitionsParamsSchema,
} from './load-form-definitions';

describe('LoadFormDefinitionsParamsSchema', () => {
  it('accepts valid site props', () => {
    expect(
      LoadFormDefinitionsParamsSchema.parse({
        orgType: 'site',
        orgId: 'district-1',
      }),
    ).toEqual({
      orgType: 'site',
      orgId: 'district-1',
    });
  });

  it('accepts valid school props', () => {
    expect(
      LoadFormDefinitionsParamsSchema.parse({
        orgType: 'school',
        orgId: 'school-1',
      }),
    ).toEqual({
      orgType: 'school',
      orgId: 'school-1',
    });
  });

  it('trims orgId whitespace', () => {
    expect(
      LoadFormDefinitionsParamsSchema.parse({
        orgType: 'site',
        orgId: '  district-1  ',
      }),
    ).toEqual({
      orgType: 'site',
      orgId: 'district-1',
    });
  });

  it('strips unexpected props', () => {
    const result = LoadFormDefinitionsParamsSchema.parse({
      orgType: 'site',
      orgId: 'district-1',
      unexpected: 'bar',
    });
    expect(result).toEqual({
      orgType: 'site',
      orgId: 'district-1',
    });
  });

  it('rejects missing orgType', () => {
    const result = LoadFormDefinitionsParamsSchema.safeParse({
      orgId: 'district-1',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['orgType']);
  });

  it('rejects invalid orgType', () => {
    const result = LoadFormDefinitionsParamsSchema.safeParse({
      orgType: 'district',
      orgId: 'district-1',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['orgType']);
  });

  it('rejects empty orgId', () => {
    const result = LoadFormDefinitionsParamsSchema.safeParse({
      orgType: 'site',
      orgId: '   ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['orgId']);
  });

  it('rejects missing orgId', () => {
    const result = LoadFormDefinitionsParamsSchema.safeParse({
      orgType: 'site',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received undefined',
        path: ['orgId'],
      },
    ]);
  });
});

describe('LoadFormDefinitionsErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'orgType', message: 'Invalid option' }],
      });
      expect(() => LoadFormDefinitionsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => LoadFormDefinitionsErrorSchema.parse(err)).not.toThrow();
    });
  });
});
