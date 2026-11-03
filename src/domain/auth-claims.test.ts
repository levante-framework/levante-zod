import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { AuthClaimsSchema, LegacyClaimsSchema } from './auth-claims';

/** Arbitrary: a non-object value (primitives, incl. null and undefined). */
const $nonObject = fc
  .anything()
  .filter(
    (v) => v === null || (typeof v !== 'object' && typeof v !== 'function'),
  );

/** Arbitrary: an integer outside the inclusive [-1, 3] role range. */
const $outOfRangeRole = fc.integer().filter((n) => n < -1 || n > 3);

/** Fixture: a valid legacy claims object with all fields present. */
const $validLegacyClaims = {
  admin: true,
  roles: [{ siteId: 'site-123', role: 'admin', siteName: 'Example Site' }],
  rolesSet: ['admin'],
  siteNames: { 'site-123': 'Example Site' },
  siteRoles: { 'site-123': ['admin'] },
  super_admin: false,
  useNewPermissions: true,
};

/** Fixture: a valid auth claims object. */
const $validAuthClaims = {
  claimsVersion: 1 as const,
  isSuperAdmin: false,
  siteRoles: { 'site-123': 2 },
};

describe('LegacyClaimsSchema', () => {
  it('accepts a valid claims object', () => {
    const result = LegacyClaimsSchema.safeParse($validLegacyClaims);
    expect(result.success).toBe(true);
    expect(result.data).toEqual($validLegacyClaims);
  });

  it('accepts a claims object without optional fields', () => {
    const {
      admin: _admin,
      super_admin: _superAdmin,
      useNewPermissions: _useNewPermissions,
      ...required
    } = $validLegacyClaims;
    const result = LegacyClaimsSchema.safeParse(required);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(required);
  });

  it.prop({ v: $nonObject })('rejects a non-object input', ({ v }) => {
    const result = LegacyClaimsSchema.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].code).toEqual('invalid_type');
    expect(result.error?.issues[0].message).toMatch(
      /^Invalid input: expected object/,
    );
    expect(result.error?.issues[0].path).toEqual([]);
  });

  it('rejects a non-array roles', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      roles: 'nope',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'array',
        message: 'Invalid input: expected array, received string',
        path: ['roles'],
      },
    ]);
  });

  it('rejects a role missing siteName', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      roles: [{ siteId: 'site-123', role: 'admin' }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received undefined',
        path: ['roles', 0, 'siteName'],
      },
    ]);
  });

  it('rejects a non-string rolesSet entry', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      rolesSet: [1],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received number',
        path: ['rolesSet', 0],
      },
    ]);
  });
});

describe('AuthClaimsSchema', () => {
  it('accepts a valid claims object', () => {
    const result = AuthClaimsSchema.safeParse($validAuthClaims);
    expect(result.success).toBe(true);
    expect(result.data).toEqual($validAuthClaims);
  });

  it('accepts an empty siteRoles record', () => {
    const claims = { ...$validAuthClaims, siteRoles: {} };
    const result = AuthClaimsSchema.safeParse(claims);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(claims);
  });

  it.prop({ role: fc.integer({ min: -1, max: 3 }) })(
    'accepts every in-range role level',
    ({ role }) => {
      const result = AuthClaimsSchema.safeParse({
        ...$validAuthClaims,
        siteRoles: { 'site-123': role },
      });
      expect(result.success).toBe(true);
    },
  );

  it.prop({ v: $nonObject })('rejects a non-object input', ({ v }) => {
    const result = AuthClaimsSchema.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].code).toEqual('invalid_type');
    expect(result.error?.issues[0].message).toMatch(
      /^Invalid input: expected object/,
    );
    expect(result.error?.issues[0].path).toEqual([]);
  });

  it('rejects a claimsVersion other than 1', () => {
    const result = AuthClaimsSchema.safeParse({
      ...$validAuthClaims,
      claimsVersion: 2,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: [1],
        message: 'Invalid input: expected 1',
        path: ['claimsVersion'],
      },
    ]);
  });

  it('rejects a non-boolean isSuperAdmin', () => {
    const result = AuthClaimsSchema.safeParse({
      ...$validAuthClaims,
      isSuperAdmin: 'yes',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'boolean',
        message: 'Invalid input: expected boolean, received string',
        path: ['isSuperAdmin'],
      },
    ]);
  });

  it('rejects a role level above the maximum', () => {
    const result = AuthClaimsSchema.safeParse({
      ...$validAuthClaims,
      siteRoles: { 'site-123': 4 },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_big',
        origin: 'number',
        maximum: 3,
        inclusive: true,
        message: 'Too big: expected number to be <=3',
        path: ['siteRoles', 'site-123'],
      },
    ]);
  });

  it('rejects a role level below the minimum', () => {
    const result = AuthClaimsSchema.safeParse({
      ...$validAuthClaims,
      siteRoles: { 'site-123': -2 },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        origin: 'number',
        minimum: -1,
        inclusive: true,
        message: 'Too small: expected number to be >=-1',
        path: ['siteRoles', 'site-123'],
      },
    ]);
  });

  it.prop({ role: $outOfRangeRole })(
    'rejects any out-of-range role level',
    ({ role }) => {
      const result = AuthClaimsSchema.safeParse({
        ...$validAuthClaims,
        siteRoles: { 'site-123': role },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].code).toEqual(
        role < -1 ? 'too_small' : 'too_big',
      );
      expect(result.error?.issues[0].path).toEqual(['siteRoles', 'site-123']);
    },
  );

  it('rejects a non-integer role level', () => {
    const result = AuthClaimsSchema.safeParse({
      ...$validAuthClaims,
      siteRoles: { 'site-123': 1.5 },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'int',
        format: 'safeint',
        message: 'Invalid input: expected int, received number',
        path: ['siteRoles', 'site-123'],
      },
    ]);
  });
});
