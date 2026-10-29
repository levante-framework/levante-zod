import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { RoleSchema } from './role';

/** The non-super_admin roles, which all share the same shape. */
const SITE_ROLES = [
  'site_admin',
  'admin',
  'research_assistant',
  'participant',
] as const;

/** Arbitrary: a non-empty, trim-stable string */
const $nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim() === s);

describe('RoleSchema', () => {
  it('accepts a super_admin role', () => {
    const result = RoleSchema.safeParse({
      role: 'super_admin',
      siteId: 'any',
      siteName: 'All Sites',
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      role: 'super_admin',
      siteId: 'any',
      siteName: 'All Sites',
    });
  });

  it.prop({ role: fc.constantFrom(...SITE_ROLES), siteId: $nonEmptyString })(
    'accepts site-scoped roles',
    ({ role, siteId }) => {
      const result = RoleSchema.safeParse({
        role,
        siteId,
        siteName: 'Example Site',
      });
      expect(result.success).toBe(true);
    },
  );

  it('trims siteName and siteId', () => {
    const result = RoleSchema.safeParse({
      role: 'admin',
      siteId: '  site-123  ',
      siteName: '  Example Site  ',
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      role: 'admin',
      siteId: 'site-123',
      siteName: 'Example Site',
    });
  });

  it('rejects a super_admin whose siteId is not "any"', () => {
    const result = RoleSchema.safeParse({
      role: 'super_admin',
      siteId: 'site-123',
      siteName: 'Example Site',
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

  it('rejects an unknown role', () => {
    const result = RoleSchema.safeParse({
      role: 'wizard',
      siteId: 'site-123',
      siteName: 'Example Site',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].code).toEqual('invalid_union');
    expect(result.error?.issues[0].path).toEqual(['role']);
  });

  it('rejects a missing role', () => {
    const result = RoleSchema.safeParse({
      siteId: 'site-123',
      siteName: 'Example Site',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].code).toEqual('invalid_union');
    expect(result.error?.issues[0].path).toEqual(['role']);
  });

  it('rejects an empty siteName', () => {
    const result = RoleSchema.safeParse({
      role: 'admin',
      siteId: 'site-123',
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

  it('rejects an empty siteId for site-scoped roles', () => {
    const result = RoleSchema.safeParse({
      role: 'admin',
      siteId: '',
      siteName: 'Example Site',
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

  it('rejects a missing siteName', () => {
    const result = RoleSchema.safeParse({
      role: 'admin',
      siteId: 'site-123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received undefined',
        path: ['siteName'],
      },
    ]);
  });
});
