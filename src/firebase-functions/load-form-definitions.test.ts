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
  describe('failed-precondition', () => {
    const $code = 'failed-precondition';
    const $message = 'Org unregistered';
    const $details = {
      code: 'unregistered',
      id: 'org-1',
    };

    it('accepts functions/failed-precondition/unregistered', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = LoadFormDefinitionsErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/failed-precondition', () => {
      const err = new FunctionsError($code, $message);
      const result = LoadFormDefinitionsErrorSchema.safeParse(err);
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
      const err = new FunctionsError($code, $message, {
        code: 'foo',
        id: 'org-1',
      });
      const result = LoadFormDefinitionsErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['unregistered'],
        path: ['details', 'code'],
        message: 'Invalid input: expected "unregistered"',
      });
    });
  });

  describe('internal', () => {
    const $code = 'internal';
    const $message = 'School site missing';
    const $details = {
      code: 'school-site-missing',
      id: 'school-1',
    };

    it('accepts functions/internal/school-site-missing', () => {
      const err = new FunctionsError($code, $message, $details);
      const result = LoadFormDefinitionsErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/internal', () => {
      const err = new FunctionsError($code, $message);
      const result = LoadFormDefinitionsErrorSchema.safeParse(err);
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
        id: 'school-1',
      });
      const result = LoadFormDefinitionsErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['school-site-missing'],
        path: ['details', 'code'],
        message: 'Invalid input: expected "school-site-missing"',
      });
    });
  });

  describe('not-found', () => {
    const $code = 'not-found';

    it('accepts functions/not-found/form-definition', () => {
      const $message = 'Form definition not found';
      const $details = {
        code: 'form-definition',
        id: 'form-1',
      };
      const err = new FunctionsError($code, $message, $details);
      const result = LoadFormDefinitionsErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('accepts functions/not-found/org', () => {
      const $message = 'Org not found';
      const $details = {
        code: 'org',
        id: 'org-1',
        type: 'site',
      };
      const err = new FunctionsError($code, $message, $details);
      const result = LoadFormDefinitionsErrorSchema.parse(err);
      expect(result).toEqual({
        name: 'FirebaseError',
        code: `functions/${$code}`,
        message: $message,
        details: $details,
      });
    });

    it('rejects bare functions/not-found', () => {
      const err = new FunctionsError($code, 'Not found');
      const result = LoadFormDefinitionsErrorSchema.safeParse(err);
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
        id: 'x',
      });
      const result = LoadFormDefinitionsErrorSchema.safeParse(err);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_union',
        errors: [],
        note: 'No matching discriminator',
        discriminator: 'code',
        path: ['details', 'code'],
        message: 'Invalid input',
      });
    });
  });

  describe('common error codes', () => {
    it('accepts functions/invalid-argument/schema', () => {
      const err = new FunctionsError('invalid-argument', 'Schema error', {
        code: 'schema',
        issues: [{ path: 'orgType', message: 'Invalid option' }],
      });
      expect(() => LoadFormDefinitionsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/permission-denied', () => {
      const err = new FunctionsError('permission-denied', 'Permission denied');
      expect(() => LoadFormDefinitionsErrorSchema.parse(err)).not.toThrow();
    });

    it('accepts functions/unauthenticated', () => {
      const err = new FunctionsError('unauthenticated', 'Unauthenticated');
      expect(() => LoadFormDefinitionsErrorSchema.parse(err)).not.toThrow();
    });
  });
});
