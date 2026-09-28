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

  it('accepts valid school complete props', () => {
    expect(
      SaveOrgInformationParamsSchema.parse({
        orgType: 'school',
        orgId: 'school-1',
        formVersion: 'version-2',
        responses: { numTeachers: '12' },
        status: 'complete',
      }),
    ).toEqual({
      orgType: 'school',
      orgId: 'school-1',
      formVersion: 'version-2',
      responses: { numTeachers: '12' },
      status: 'complete',
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
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: ['site', 'school'],
        message: 'Invalid option: expected one of "site"|"school"',
        path: ['orgType'],
      },
    ]);
  });

  it('rejects invalid orgType', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      orgType: 'district',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: ['site', 'school'],
        message: 'Invalid option: expected one of "site"|"school"',
        path: ['orgType'],
      },
    ]);
  });

  it('rejects empty orgId', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      orgId: '   ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        minimum: 1,
        origin: 'string',
        message: 'Too small: expected string to have >=1 characters',
        path: ['orgId'],
      },
    ]);
  });

  it('rejects empty formVersion', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      formVersion: '   ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        minimum: 1,
        origin: 'string',
        message: 'Too small: expected string to have >=1 characters',
        path: ['formVersion'],
      },
    ]);
  });

  it('rejects submitted status', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      status: 'submitted',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: ['draft', 'complete'],
        message: 'Invalid option: expected one of "draft"|"complete"',
        path: ['status'],
      },
    ]);
  });

  it('rejects responses when not an object', () => {
    const result = SaveOrgInformationParamsSchema.safeParse({
      ...validParams,
      responses: ['sampleApproach'],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'record',
        message: 'Invalid input: expected record, received array',
        path: ['responses'],
      },
    ]);
  });

  it('rejects missing responses', () => {
    const { responses: _, ...rest } = validParams;
    const result = SaveOrgInformationParamsSchema.safeParse(rest);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'record',
        message: 'Invalid input: expected record, received undefined',
        path: ['responses'],
      },
    ]);
  });
});

describe('SaveOrgInformationErrorSchema', () => {
  describe('failed-precondition', () => {
    const $code = 'failed-precondition';

    it('accepts functions/failed-precondition/unregistered', () => {
      const $message = 'Org unregistered';
      const $details = {
        code: 'unregistered',
        id: 'org-1',
      };
      const err = new FunctionsError($code, $message, $details);
      const result = SaveOrgInformationErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('accepts functions/failed-precondition/missing-fields', () => {
      const $message = 'Missing required fields';
      const $details = {
        code: 'missing-fields',
        fields: ['numTeachers', 'sampleApproach'],
      };
      const err = new FunctionsError($code, $message, $details);
      const result = SaveOrgInformationErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/failed-precondition', () => {
      const err = new FunctionsError($code, 'Failed precondition');
      const result = SaveOrgInformationErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/failed-precondition/foo', () => {
      const err = new FunctionsError($code, 'Failed precondition', {
        code: 'foo',
        id: 'org-1',
      });
      const result = SaveOrgInformationErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_union',
        discriminator: 'code',
        errors: [],
        message:
          "Invalid discriminator value. Expected 'unregistered' | 'missing-fields'",
        note: 'No matching discriminator',
        options: ['unregistered', 'missing-fields'],
        path: ['details', 'code'],
      });
    });
  });

  describe('internal', () => {
    const $code = 'internal';
    const $message = 'Org incomplete';
    const $details = {
      code: 'org-incomplete',
      type: 'site',
      id: 'org-1',
    };

    it('accepts functions/internal/org-incomplete', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = SaveOrgInformationErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/internal', () => {
      const err = new FunctionsError($code, $message);
      const result = SaveOrgInformationErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/internal/foo', () => {
      const err = new FunctionsError($code, $message, {
        code: 'foo',
        type: 'site',
        id: 'org-1',
      });
      const result = SaveOrgInformationErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['org-incomplete'],
        path: ['details', 'code'],
        message: 'Invalid input: expected "org-incomplete"',
      });
    });
  });

  describe('invalid-argument', () => {
    const $code = 'invalid-argument';

    it('accepts functions/invalid-argument/schema', () => {
      const $message = 'Schema error';
      const $details = {
        code: 'schema',
        issues: [{ path: 'orgType', message: 'Invalid option' }],
      };
      const err = new FunctionsError($code, $message, $details);
      const result = SaveOrgInformationErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('accepts functions/invalid-argument/responses', () => {
      const $message = 'Responses error';
      const $details = {
        code: 'responses',
        issues: [{ path: 'numTeachers', message: 'Expected a number' }],
      };
      const err = new FunctionsError($code, $message, $details);
      const result = SaveOrgInformationErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/invalid-argument', () => {
      const err = new FunctionsError($code, 'Invalid argument');
      const result = SaveOrgInformationErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/invalid-argument/foo', () => {
      const err = new FunctionsError($code, 'Invalid argument', {
        code: 'foo',
        issues: [],
      });
      const result = SaveOrgInformationErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_union',
        discriminator: 'code',
        errors: [],
        message: "Invalid discriminator value. Expected 'schema' | 'responses'",
        note: 'No matching discriminator',
        options: ['schema', 'responses'],
        path: ['details', 'code'],
      });
    });
  });

  describe('not-found', () => {
    const $code = 'not-found';

    it('accepts functions/not-found/org', () => {
      const $message = 'Org not found';
      const $details = {
        code: 'org',
        type: 'site',
        id: 'org-1',
      };
      const err = new FunctionsError($code, $message, $details);
      const result = SaveOrgInformationErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('accepts functions/not-found/form-version', () => {
      const $message = 'Form version not found';
      const $details = {
        code: 'form-version',
        id: 'version-1',
      };
      const err = new FunctionsError($code, $message, $details);
      const result = SaveOrgInformationErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/not-found', () => {
      const err = new FunctionsError($code, 'Not found');
      const result = SaveOrgInformationErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/not-found/foo', () => {
      const err = new FunctionsError($code, 'Not found', {
        code: 'foo',
        id: 'org-1',
      });
      const result = SaveOrgInformationErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_union',
        discriminator: 'code',
        errors: [],
        message: "Invalid discriminator value. Expected 'org' | 'form-version'",
        note: 'No matching discriminator',
        options: ['org', 'form-version'],
        path: ['details', 'code'],
      });
    });
  });

  describe('common error codes', () => {
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
