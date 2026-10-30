import { FunctionsError } from 'firebase/functions';
import { describe, expect, it } from 'vitest';
import {
  GetOrgInformationStatusErrorSchema,
  GetOrgInformationStatusParamsSchema,
} from './get-org-information-status';

describe('GetOrgInformationStatusParamsSchema', () => {
  it('accepts valid site props', () => {
    expect(
      GetOrgInformationStatusParamsSchema.parse({
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
      GetOrgInformationStatusParamsSchema.parse({
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
      GetOrgInformationStatusParamsSchema.parse({
        orgType: 'site',
        orgId: '  district-1  ',
      }),
    ).toEqual({
      orgType: 'site',
      orgId: 'district-1',
    });
  });

  it('strips unexpected props', () => {
    const result = GetOrgInformationStatusParamsSchema.parse({
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
    const result = GetOrgInformationStatusParamsSchema.safeParse({
      orgId: 'district-1',
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
      orgId: 'district-1',
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
    const result = GetOrgInformationStatusParamsSchema.safeParse({
      orgType: 'site',
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

  it('rejects missing orgId', () => {
    const result = GetOrgInformationStatusParamsSchema.safeParse({
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

  describe('internal', () => {
    const $code = 'internal';

    it('accepts functions/internal/org-incomplete', () => {
      const $message = 'Org incomplete';
      const $details = {
        code: 'org-incomplete',
        type: 'school',
        id: 'school-1',
      };
      const err = new FunctionsError($code, $message, $details);
      const result = GetOrgInformationStatusErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('accepts functions/internal/unexpected-status', () => {
      const $message = 'Unexpected status';
      const $details = {
        code: 'unexpected-status',
        id: 'school-1',
        status: 'archived',
      };
      const err = new FunctionsError($code, $message, $details);
      const result = GetOrgInformationStatusErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/internal', () => {
      const err = new FunctionsError($code, 'Org incomplete');
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

    it('rejects functions/internal/foo', () => {
      const err = new FunctionsError($code, 'Org incomplete', {
        code: 'foo',
        type: 'school',
        id: 'school-1',
      });
      const result = GetOrgInformationStatusErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_union',
        discriminator: 'code',
        errors: [],
        message:
          "Invalid discriminator value. Expected 'org-incomplete' | 'unexpected-status'",
        note: 'No matching discriminator',
        options: ['org-incomplete', 'unexpected-status'],
        path: ['details', 'code'],
      });
    });
  });

  describe('not-found', () => {
    const $code = 'not-found';
    const $message = 'Org not found';
    const $details = {
      code: 'org',
      type: 'site',
      id: 'org-1',
    };

    it('accepts functions/not-found/org', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = GetOrgInformationStatusErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/not-found', () => {
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

    it('rejects functions/not-found/form-definition', () => {
      const err = new FunctionsError($code, $message, {
        code: 'form-definition',
        id: 'siteInformation',
      });
      const result = GetOrgInformationStatusErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'invalid_value',
          values: ['org'],
          path: ['details', 'code'],
          message: 'Invalid input: expected "org"',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['details', 'type'],
          message: 'Invalid input: expected string, received undefined',
        },
      ]);
    });
  });

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
