import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { UserRoleSchema } from './user-role';

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

/** Arbitrary: a non-super_admin role. */
const $nonSuperAdminRole = fc.constantFrom(
  'site_admin',
  'admin',
  'research_assistant',
  'participant',
);

/** Fixture: a valid site-scoped role. */
const $validSiteScopedRole = {
  role: 'site_admin',
  siteId: 'site-123',
  siteName: 'Example Site',
};

/** Fixture: a valid super_admin role. */
const $validSuperAdminRole = {
  role: 'super_admin',
  siteId: 'any',
};

describe('UserRoleSchema', () => {
  it('accepts a valid super_admin role', () => {
    const result = UserRoleSchema.safeParse($validSuperAdminRole);
    expect(result.success).toBe(true);
    expect(result.data).toEqual($validSuperAdminRole);
  });

  it.prop({
    role: $nonSuperAdminRole,
    siteId: $nonEmptyString,
    siteName: $nonEmptyString,
  })('accepts valid site-scoped roles', ({ role, siteId, siteName }) => {
    const result = UserRoleSchema.safeParse({
      role,
      siteId,
      siteName,
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ role, siteId, siteName });
  });

  it('accepts a site-scoped role without a siteName', () => {
    const { siteName: _siteName, ...withoutSiteName } = $validSiteScopedRole;
    const result = UserRoleSchema.safeParse(withoutSiteName);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(withoutSiteName);
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
        "Invalid discriminator value. Expected 'super_admin' | 'site_admin' | 'admin' | 'research_assistant' | 'participant'",
      );
      expect(result.error?.issues[0].path).toEqual(['role']);
    });
  });

  describe('invalid siteId', () => {
    it('rejects a super_admin whose siteId is not "any"', () => {
      const result = UserRoleSchema.safeParse({
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

    it('rejects an empty siteId for site-scoped roles', () => {
      const result = UserRoleSchema.safeParse({
        ...$validSiteScopedRole,
        siteId: '',
      });
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
      'rejects a non-string siteId for site-scoped roles',
      ({ siteId }) => {
        const result = UserRoleSchema.safeParse({
          ...$validSiteScopedRole,
          siteId,
        });
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
      const result = UserRoleSchema.safeParse({
        ...$validSiteScopedRole,
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
        const result = UserRoleSchema.safeParse({
          ...$validSiteScopedRole,
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
