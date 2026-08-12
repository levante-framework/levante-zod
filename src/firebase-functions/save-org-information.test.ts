import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import {
  SaveOrgInformationErrorSchema,
  SaveOrgInformationParamsSchema,
} from './save-org-information';

const validParams = {
  orgType: 'site' as const,
  orgId: 'district-1',
  formVersion: 'version-1',
  responses: {
    sampleApproach: ['other'],
    sampleApproachOther: 'word of mouth',
  },
  status: 'draft' as const,
};

describe('SaveOrgInformationParamsSchema', () => {
  it('accepts valid site draft props', () => {
    expect(SaveOrgInformationParamsSchema.parse(validParams)).toEqual(
      validParams,
    );
  });

  it('accepts valid school submitted props', () => {
    expect(
      SaveOrgInformationParamsSchema.parse({
        orgType: 'school',
        orgId: 'school-1',
        formVersion: 'version-2',
        responses: { numTeachers: '12' },
        status: 'submitted',
      }),
    ).toEqual({
      orgType: 'school',
      orgId: 'school-1',
      formVersion: 'version-2',
      responses: { numTeachers: '12' },
      status: 'submitted',
    });
  });

  it('accepts empty responses object', () => {
    expect(
      SaveOrgInformationParamsSchema.parse({
        ...validParams,
        responses: {},
      }),
    ).toEqual({
      ...validParams,
      responses: {},
    });
  });

  it('trims orgId and formVersion whitespace', () => {
    expect(
      SaveOrgInformationParamsSchema.parse({
        ...validParams,
        orgId: '  district-1  ',
        formVersion: '  version-1  ',
      }),
    ).toEqual(validParams);
  });

  it('strips unexpected props', () => {
    const result = SaveOrgInformationParamsSchema.parse({
      ...validParams,
      unexpected: 'bar',
    });
    expect(result).toEqual(validParams);
  });

  it('rejects missing orgType', () => {
    const { orgType: _, ...rest } = validParams;
    const result = SaveOrgInformationParamsSchema.safeParse(rest);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['orgType']);
  });

  it('rejects invalid orgType', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      orgType: 'district',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['orgType']);
  });

  it('rejects empty orgId', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      orgId: '   ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['orgId']);
  });

  it('rejects empty formVersion', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      formVersion: '   ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['formVersion']);
  });

  it('rejects invalid status', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      status: 'complete',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['status']);
  });

  it('rejects responses when not an object', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      responses: ['sampleApproach'],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['responses']);
  });

  it('rejects missing responses', () => {
    const { responses: _, ...rest } = validParams;
    const result = SaveOrgInformationParamsSchema.safeParse(rest);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['responses']);
  });
});

describe('SaveOrgInformationErrorSchema', () => {
  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'orgType', message: 'Invalid option' }],
      });
      expect(() => SaveOrgInformationErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => SaveOrgInformationErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => SaveOrgInformationErrorSchema.parse(err)).not.toThrow();
    });
  });
});
