import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import {
  AuthClaimsSchema,
  LEGACY_CLAIMS_ROLES,
  LegacyClaimsSchema,
} from './auth-claims';

/** Arbitrary: a non-object value (primitives, incl. null and undefined). */
const $nonObject = fc
  .anything()
  .filter(
    (v) => v === null || (typeof v !== 'object' && typeof v !== 'function'),
  );

/** Arbitrary: an integer outside the inclusive [0, 3] role range. */
const $outOfRangeRole = fc.integer().filter((n) => n < 0 || n > 3);

/** Fixture: a valid legacy claims object with all fields present. */
const $validLegacyClaims = {
  rolesSet: ['admin', 'site_admin'],
  siteNames: { 'site-123': 'Example Site', 'site-456': 'Other Site' },
  siteRoles: { 'site-123': ['admin'], 'site-456': ['site_admin'] },
  super_admin: false,
  useNewPermissions: true as const,
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

  it('accepts a participant-only claims object without optional fields', () => {
    // `super_admin` is the only optional field, and omitting it is valid only
    // when `rolesSet` does not include the `super_admin` role.
    const claims = {
      rolesSet: ['participant'],
      siteNames: { 'site-123': 'Example Site' },
      siteRoles: { 'site-123': ['participant'] },
      useNewPermissions: true as const,
    };
    const result = LegacyClaimsSchema.safeParse(claims);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(claims);
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

  it('rejects an unknown rolesSet entry', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      rolesSet: ['wizard'],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: LEGACY_CLAIMS_ROLES,
        message: `Invalid option: expected one of ${LEGACY_CLAIMS_ROLES.map(
          (role) => `"${role}"`,
        ).join('|')}`,
        path: ['rolesSet', 0],
      },
    ]);
  });

  it('rejects a useNewPermissions that is not true', () => {
    // Omitting `useNewPermissions` produces this same issue.
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      useNewPermissions: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: [true],
        message: 'Invalid input: expected true',
        path: ['useNewPermissions'],
      },
    ]);
  });

  it('rejects a non-boolean super_admin', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      super_admin: 'nope',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'boolean',
        message: 'Invalid input: expected boolean, received string',
        path: ['super_admin'],
      },
    ]);
  });

  it('rejects duplicate rolesSet entries', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      rolesSet: ['admin', 'admin'],
      siteNames: { 'site-123': 'Example Site' },
      siteRoles: { 'site-123': ['admin'] },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Must be unique',
        path: ['rolesSet', 0],
      },
      {
        code: 'custom',
        message: 'Must be unique',
        path: ['rolesSet', 1],
      },
    ]);
  });

  it('rejects a rolesSet role unused in siteRoles', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      rolesSet: ['admin', 'site_admin'],
      siteNames: { 'site-123': 'Example Site' },
      siteRoles: { 'site-123': ['admin'] },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Role must be used in siteRoles',
        path: ['rolesSet', 1],
      },
    ]);
  });

  it('accepts super_admin declared under the "any" site key', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      super_admin: true,
      rolesSet: ['super_admin'],
      siteRoles: { any: ['super_admin'] },
      siteNames: { any: 'Any Site' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects super_admin role when super_admin flag is not true', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      super_admin: false,
      rolesSet: ['super_admin'],
      siteRoles: { any: ['super_admin'] },
      siteNames: { any: 'Any Site' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'super_admin must be true when rolesSet includes super_admin',
        path: ['super_admin'],
      },
    ]);
  });

  it('rejects super_admin flag when rolesSet excludes super_admin', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      super_admin: true,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message:
          'super_admin must not be true when rolesSet excludes super_admin',
        path: ['super_admin'],
      },
    ]);
  });

  it('rejects a siteNames key absent from siteRoles', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      siteNames: {
        'site-123': 'Example Site',
        'site-456': 'Other Site',
        'site-999': 'Orphan Site',
      },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Site must be present in siteRoles',
        path: ['siteNames', 'site-999'],
      },
    ]);
  });

  it('rejects a siteRoles key absent from siteNames', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      siteNames: { 'site-123': 'Example Site' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Site must be present in siteNames',
        path: ['siteRoles', 'site-456'],
      },
    ]);
  });

  it('rejects a siteRoles role absent from rolesSet', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      rolesSet: ['admin'],
      siteNames: { 'site-123': 'Example Site' },
      siteRoles: { 'site-123': ['admin', 'site_admin'] },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Role must be present in rolesSet',
        path: ['siteRoles', 'site-123', 1],
      },
    ]);
  });

  it('rejects an empty siteRoles map', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      rolesSet: [],
      siteNames: {},
      siteRoles: {},
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Must include at least one site',
        path: ['siteRoles'],
      },
    ]);
  });

  it('rejects a site with an empty role array', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      rolesSet: [],
      siteNames: { 'site-123': 'Example Site' },
      siteRoles: { 'site-123': [] },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        minimum: 1,
        origin: 'array',
        message: 'Too small: expected array to have >=1 items',
        path: ['siteRoles', 'site-123'],
      },
    ]);
  });

  it('accepts a single site holding multiple roles', () => {
    const result = LegacyClaimsSchema.safeParse({
      ...$validLegacyClaims,
      rolesSet: ['admin', 'site_admin'],
      siteNames: { 'site-123': 'Example Site' },
      siteRoles: { 'site-123': ['admin', 'site_admin'] },
    });
    expect(result.success).toBe(true);
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

  it.prop({ role: fc.integer({ min: 0, max: 3 }) })(
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

  it('rejects a missing isSuperAdmin', () => {
    const { isSuperAdmin: _omitted, ...claims } = $validAuthClaims;
    const result = AuthClaimsSchema.safeParse(claims);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'boolean',
        message: 'Invalid input: expected boolean, received undefined',
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
      siteRoles: { 'site-123': -1 },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        origin: 'number',
        minimum: 0,
        inclusive: true,
        message: 'Too small: expected number to be >=0',
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
        role < 0 ? 'too_small' : 'too_big',
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

  it('rejects a non-number role level', () => {
    const result = AuthClaimsSchema.safeParse({
      ...$validAuthClaims,
      siteRoles: { 'site-123': 'x' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'number',
        message: 'Invalid input: expected number, received string',
        path: ['siteRoles', 'site-123'],
      },
    ]);
  });
});
