import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import {
  ADMIN_SITE_ROLES,
  AdminRoleSchema,
  ALL_SITE_ROLES,
  SuperAdminRoleSchema,
  siteRoleSchema,
  UserRoleSchema,
} from './user-role';

/** Arbitrary: a site-scoped role name valid for admins (excludes participant). */
const $adminSiteRole = fc.constantFrom(...ADMIN_SITE_ROLES);

/** Arbitrary: any site-scoped role name (includes participant). */
const $allSiteRole = fc.constantFrom(...ALL_SITE_ROLES);

/**
 * Arbitrary: a defined non-string value. Excludes `undefined`, which is a
 * valid (omitted) value for the optional `siteName`.
 */
const $definedNonString = fc
  .anything()
  .filter((v) => v !== undefined && typeof v !== 'string');

/** Arbitrary: a non-empty, trim-stable string */
const $nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim() === s);

/** Arbitrary: a non-object value (primitives, incl. null and undefined). */
const $nonObject = fc
  .anything()
  .filter(
    (v) => v === null || (typeof v !== 'object' && typeof v !== 'function'),
  );

/** Arbitrary: a non-string value (incl. `undefined`; `siteId` is required). */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Fixture: a valid site-scoped role. */
const $validSiteRole = {
  role: 'site_admin',
  siteId: 'site-123',
  siteName: 'Example Site',
};

/** Fixture: a valid super_admin role. */
const $validSuperAdminRole = {
  role: 'super_admin',
  siteId: 'any',
};

describe('siteRoleSchema', () => {
  // The factory owns the site-scoped object logic (role membership, siteId,
  // optional siteName), so field-level validation is tested here once rather
  // than through each union that embeds it.
  const schema = siteRoleSchema(ALL_SITE_ROLES);

  it.prop({
    role: $allSiteRole,
    siteId: $nonEmptyString,
    siteName: $nonEmptyString,
  })('accepts valid site-scoped roles', ({ role, siteId, siteName }) => {
    const result = schema.safeParse({ role, siteId, siteName });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ role, siteId, siteName });
  });

  it('accepts a site-scoped role without a siteName', () => {
    const { siteName: _siteName, ...withoutSiteName } = $validSiteRole;
    const result = schema.safeParse(withoutSiteName);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(withoutSiteName);
  });

  it('rejects a role not in the provided list', () => {
    const adminScopedSchema = siteRoleSchema(ADMIN_SITE_ROLES);
    const result = adminScopedSchema.safeParse({
      ...$validSiteRole,
      role: 'participant',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: ADMIN_SITE_ROLES,
        message: `Invalid option: expected one of "${ADMIN_SITE_ROLES.join('"|"')}"`,
        path: ['role'],
      },
    ]);
  });

  describe('invalid siteId', () => {
    it('rejects an empty siteId', () => {
      const result = schema.safeParse({ ...$validSiteRole, siteId: '' });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['siteId'],
        },
      ]);
    });

    it.prop({ siteId: $nonString })(
      'rejects a non-string siteId',
      ({ siteId }) => {
        const result = schema.safeParse({ ...$validSiteRole, siteId });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        expect(result.error?.issues[0].code).toEqual('invalid_type');
        expect(result.error?.issues[0].message).toMatch(
          /^Invalid input: expected string/,
        );
        expect(result.error?.issues[0].path).toEqual(['siteId']);
      },
    );
  });

  describe('invalid siteName', () => {
    // NB: `siteName` is optional, so an omitted value is accepted (covered
    // above); only a present-but-empty string is rejected.
    it('rejects an empty siteName', () => {
      const result = schema.safeParse({
        ...$validSiteRole,
        siteName: '',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        {
          code: 'too_small',
          inclusive: true,
          message: 'Too small: expected string to have >=1 characters',
          origin: 'string',
          minimum: 1,
          path: ['siteName'],
        },
      ]);
    });

    it.prop({ siteName: $definedNonString })(
      'rejects a non-string siteName',
      ({ siteName }) => {
        const result = schema.safeParse({
          ...$validSiteRole,
          siteName,
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        expect(result.error?.issues[0].code).toEqual('invalid_type');
        expect(result.error?.issues[0].message).toMatch(
          /^Invalid input: expected string/,
        );
        expect(result.error?.issues[0].path).toEqual(['siteName']);
      },
    );
  });
});

describe('SuperAdminRoleSchema', () => {
  it('accepts a valid super_admin role', () => {
    const result = SuperAdminRoleSchema.safeParse($validSuperAdminRole);
    expect(result.success).toBe(true);
    expect(result.data).toEqual($validSuperAdminRole);
  });

  it('rejects a non-super_admin role', () => {
    const result = SuperAdminRoleSchema.safeParse({
      ...$validSuperAdminRole,
      role: 'site_admin',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: ['super_admin'],
        message: 'Invalid input: expected "super_admin"',
        path: ['role'],
      },
    ]);
  });

  it('rejects a super_admin whose siteId is not "any"', () => {
    const result = SuperAdminRoleSchema.safeParse({
      ...$validSuperAdminRole,
      siteId: 'site-123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_value',
        values: ['any'],
        message: 'Invalid input: expected "any"',
        path: ['siteId'],
      },
    ]);
  });
});

describe('AdminRoleSchema', () => {
  it('accepts a valid super_admin role', () => {
    const result = AdminRoleSchema.safeParse($validSuperAdminRole);
    expect(result.success).toBe(true);
    expect(result.data).toEqual($validSuperAdminRole);
  });

  it.prop({
    role: $adminSiteRole,
    siteId: $nonEmptyString,
    siteName: $nonEmptyString,
  })('accepts valid admin site-scoped roles', ({ role, siteId, siteName }) => {
    const result = AdminRoleSchema.safeParse({ role, siteId, siteName });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ role, siteId, siteName });
  });

  // NB: `participant` is the meaningful boundary (valid in `UserRoleSchema`,
  // not for admins). Any non-matching discriminator — including a wholly
  // unknown or missing role — routes to this same `invalid_union` issue.
  it('rejects a participant role', () => {
    const result = AdminRoleSchema.safeParse({
      ...$validSiteRole,
      role: 'participant',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].code).toEqual('invalid_union');
    expect(result.error?.issues[0].message).toEqual(
      `Invalid discriminator value. Expected 'super_admin' | ${ADMIN_SITE_ROLES.map((r) => `'${r}'`).join(' | ')}`,
    );
    expect(result.error?.issues[0].path).toEqual(['role']);
  });
});

describe('UserRoleSchema', () => {
  it('accepts a valid super_admin role', () => {
    const result = UserRoleSchema.safeParse($validSuperAdminRole);
    expect(result.success).toBe(true);
    expect(result.data).toEqual($validSuperAdminRole);
  });

  it.prop({
    role: $allSiteRole,
    siteId: $nonEmptyString,
    siteName: $nonEmptyString,
  })('accepts valid site-scoped roles', ({ role, siteId, siteName }) => {
    const result = UserRoleSchema.safeParse({ role, siteId, siteName });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ role, siteId, siteName });
  });

  it('accepts a participant role', () => {
    const result = UserRoleSchema.safeParse({
      ...$validSiteRole,
      role: 'participant',
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      ...$validSiteRole,
      role: 'participant',
    });
  });

  describe('invalid role', () => {
    // NB: also covers a missing (undefined) role: a discriminated union has no
    // branch to route to in either case, so both yield the same invalid_union
    // issue on `role`.
    it('rejects an unknown role', () => {
      const result = UserRoleSchema.safeParse({
        ...$validSuperAdminRole,
        role: 'wizard',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0].code).toEqual('invalid_union');
      expect(result.error?.issues[0].message).toEqual(
        `Invalid discriminator value. Expected 'super_admin' | ${ALL_SITE_ROLES.map((r) => `'${r}'`).join(' | ')}`,
      );
      expect(result.error?.issues[0].path).toEqual(['role']);
    });
  });

  it.prop({ v: $nonObject })('rejects a non-object input', ({ v }) => {
    const result = UserRoleSchema.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].code).toEqual('invalid_type');
    expect(result.error?.issues[0].message).toMatch(
      /^Invalid input: expected object/,
    );
    expect(result.error?.issues[0].path).toEqual([]);
  });
});
