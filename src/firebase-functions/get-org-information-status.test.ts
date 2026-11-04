import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import {
  GetOrgInformationStatusErrorSchema,
  GetOrgInformationStatusParamsSchema,
} from './get-org-information-status';

describe('GetOrgInformationStatusParamsSchema', () => {
  it('accepts one site id', () => {
    expect(
      GetOrgInformationStatusParamsSchema.parse({
        orgType: 'site',
        orgIds: ['district-1'],
      }),
    ).toEqual({
      orgType: 'site',
      orgIds: ['district-1'],
    });
  });

  it('accepts several school ids', () => {
    expect(
      GetOrgInformationStatusParamsSchema.parse({
        orgType: 'school',
        orgIds: ['school-1', 'school-2'],
      }),
    ).toEqual({
      orgType: 'school',
      orgIds: ['school-1', 'school-2'],
    });
  });

  it('trims orgId whitespace', () => {
    expect(
      GetOrgInformationStatusParamsSchema.parse({
        orgType: 'site',
        orgIds: ['  district-1  '],
      }),
    ).toEqual({
      orgType: 'site',
      orgIds: ['district-1'],
    });
  });

  it('strips unexpected props', () => {
    const result = GetOrgInformationStatusParamsSchema.parse({
      orgType: 'site',
      orgIds: ['district-1'],
      unexpected: 'bar',
    });
    expect(result).toEqual({
      orgType: 'site',
      orgIds: ['district-1'],
    });
  });

  it('rejects missing orgType', () => {
    const result = GetOrgInformationStatusParamsSchema.safeParse({
      orgIds: ['district-1'],
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

  it('rejects invalid orgType', () => {
    const result = GetOrgInformationStatusParamsSchema.safeParse({
      orgType: 'district',
      orgIds: ['district-1'],
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

  it('rejects an empty orgIds array', () => {
    const result = GetOrgInformationStatusParamsSchema.safeParse({
      orgType: 'site',
      orgIds: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected array to have >=1 items',
        minimum: 1,
        origin: 'array',
        path: ['orgIds'],
      },
    ]);
  });

  it('rejects an empty orgId', () => {
    const result = GetOrgInformationStatusParamsSchema.safeParse({
      orgType: 'site',
      orgIds: ['   '],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        minimum: 1,
        origin: 'string',
        message: 'Too small: expected string to have >=1 characters',
        path: ['orgIds', 0],
      },
    ]);
  });

  it('rejects a non-array orgIds', () => {
    const result = GetOrgInformationStatusParamsSchema.safeParse({
      orgType: 'site',
      orgIds: 'district-1',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'array',
        message: 'Invalid input: expected array, received string',
        path: ['orgIds'],
      },
    ]);
  });

  it('rejects missing orgIds', () => {
    const result = GetOrgInformationStatusParamsSchema.safeParse({
      orgType: 'site',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'array',
        message: 'Invalid input: expected array, received undefined',
        path: ['orgIds'],
      },
    ]);
  });
});

describe('GetOrgInformationStatusErrorSchema', () => {
  describe('failed-precondition', () => {
    const $code = 'failed-precondition';
    const $message = 'No current version';
    const $details = {
      code: 'no-current-version',
      id: 'siteInformation',
    };

    it('accepts functions/failed-precondition/no-current-version', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = GetOrgInformationStatusErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/failed-precondition', () => {
      const err = new FunctionsError($code, $message);
      const result = GetOrgInformationStatusErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        expected: 'object',
        code: 'invalid_type',
        path: ['details'],
        message: 'Invalid input: expected object, received undefined',
      });
    });

    it('rejects functions/failed-precondition/unregistered', () => {
      const err = new FunctionsError($code, $message, {
        code: 'unregistered',
        id: 'siteInformation',
      });
      const result = GetOrgInformationStatusErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['no-current-version'],
        path: ['details', 'code'],
        message: 'Invalid input: expected "no-current-version"',
      });
    });
  });

  it.each(['not-found', 'internal'] as const)(
    'rejects functions/%s',
    (code) => {
      const err = new FunctionsError(code, 'Org failed', {
        code: 'org',
        id: 'org-1',
      });
      const result = GetOrgInformationStatusErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_union',
          discriminator: 'code',
          errors: [],
          message:
            "Invalid discriminator value. Expected 'functions/failed-precondition' | 'functions/invalid-argument' | 'functions/permission-denied' | 'functions/unauthenticated'",
          note: 'No matching discriminator',
          options: [
            'functions/failed-precondition',
            'functions/invalid-argument',
            'functions/permission-denied',
            'functions/unauthenticated',
          ],
          path: ['code'],
        },
      ]);
    },
  );

  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'orgType', message: 'Invalid option' }],
      });
      const result = GetOrgInformationStatusErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: 'functions/invalid-argument',
        message: 'Schema error',
        details: {
          code: 'schema',
          issues: [{ path: 'orgType', message: 'Invalid option' }],
        },
      });
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      const result = GetOrgInformationStatusErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: 'functions/permission-denied',
        message: 'Permission denied',
      });
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      const result = GetOrgInformationStatusErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: 'functions/unauthenticated',
        message: 'Unauthenticated',
      });
    });
  });
});
