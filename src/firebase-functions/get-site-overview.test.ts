import { describe, expect, it } from 'vitest';
import {
  GetSiteOverviewParamsSchema,
  SITE_ID_MESSAGE,
} from './get-site-overview';

describe('GetSiteOverviewParamsSchema', () => {
  it('accepts a valid siteId', () => {
    expect(GetSiteOverviewParamsSchema.parse({ siteId: 'foo' })).toEqual({
      siteId: 'foo',
    });
  });

  it('trims whitespace from siteId', () => {
    expect(GetSiteOverviewParamsSchema.parse({ siteId: '  foo  ' })).toEqual({
      siteId: 'foo',
    });
  });

  it('rejects a missing siteId', () => {
    const result = GetSiteOverviewParamsSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: SITE_ID_MESSAGE,
        path: ['siteId'],
      },
    ]);
  });

  it('rejects an empty siteId', () => {
    const result = GetSiteOverviewParamsSchema.safeParse({ siteId: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        message: SITE_ID_MESSAGE,
        origin: 'string',
        minimum: 1,
        path: ['siteId'],
      },
    ]);
  });

  it('rejects a whitespace-only siteId', () => {
    const result = GetSiteOverviewParamsSchema.safeParse({ siteId: '   ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'too_small',
        inclusive: true,
        message: SITE_ID_MESSAGE,
        origin: 'string',
        minimum: 1,
        path: ['siteId'],
      },
    ]);
  });

  it('rejects a non-string siteId', () => {
    const result = GetSiteOverviewParamsSchema.safeParse({ siteId: 42 });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: SITE_ID_MESSAGE,
        path: ['siteId'],
      },
    ]);
  });
});
