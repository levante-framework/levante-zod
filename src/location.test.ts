import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import type * as z from 'zod';
import { CoarseLocationSchema, H3CellSchema } from './location';

/** Arbitrary: a non-object value */
const $nonObject = fc.anything().filter((v) => typeof v !== 'object');

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Arbitrary: a non-number value */
const $nonNumber = fc.anything().filter((v) => typeof v !== 'number');

/** Arbitrary: a non-array value */
const $nonArray = fc.anything().filter((v) => !Array.isArray(v));

/** A valid H3Cell */
const $validCell = {
  h3Index: '8928308280fffff',
  resolution: 9,
  center: [37.77670234943567, -122.41845932318311],
};

/** A valid H3Cell at the min resolution (0) */
const $validCellRes0 = {
  h3Index: '8001fffffffffff',
  resolution: 0,
  center: [79.24239850975904, 38.02340700796988],
};

/** A valid H3Cell at the max resolution (15) */
const $validCellRes15 = {
  h3Index: '8f28308280c0000',
  resolution: 15,
  center: [37.77670234943569, -122.41845932318311],
};

/** A valid H3Cell at the baseline resolution (5) */
const $validCellRes5 = {
  h3Index: '85283083fffffff',
  resolution: 5,
  center: [37.790261155803734, -122.34547859788444],
};

/** A valid CoarseLocation */
const $validCoarseLocation = {
  schemaVersion: 'location_v1',
  h3: { baseline: $validCellRes5, effective: $validCell },
  population: { source: 'kontur', threshold: 20000 },
  computedAt: '2024-01-01T00:00:00Z',
};

describe('H3CellSchema', () => {
  it('accepts a valid cell', () => {
    expect(H3CellSchema.parse($validCell)).toEqual($validCell);
  });

  it('trims h3Index', () => {
    expect(
      H3CellSchema.parse({ ...$validCell, h3Index: '  8928308280fffff  ' }),
    ).toEqual($validCell);
  });

  it('strips unexpected props', () => {
    expect(H3CellSchema.parse({ ...$validCell, unexpected: 'bar' })).toEqual(
      $validCell,
    );
  });

  it.prop({ nonObject: $nonObject })(
    'rejects a non-object root',
    ({ nonObject }) => {
      const result = H3CellSchema.safeParse(nonObject);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('object');
      expect(issue.message).toMatch(/Invalid input: expected object, received/);
      expect(issue.path).toEqual([]);
    },
  );

  describe('h3Index', () => {
    it('rejects a missing h3Index', () => {
      const { h3Index: _h3Index, ...rest } = $validCell;
      const result = H3CellSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received undefined',
        path: ['h3Index'],
      });
    });

    it.prop({ h3Index: $nonString })(
      'rejects a non-string h3Index',
      ({ h3Index }) => {
        const result = H3CellSchema.safeParse({ ...$validCell, h3Index });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('string');
        expect(issue.message).toMatch(
          /Invalid input: expected string, received/,
        );
        expect(issue.path).toEqual(['h3Index']);
      },
    );

    it('rejects an empty h3Index', () => {
      const result = H3CellSchema.safeParse({ ...$validCell, h3Index: '   ' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected string to have >=1 characters',
        minimum: 1,
        origin: 'string',
        path: ['h3Index'],
      });
    });
  });

  describe('resolution', () => {
    it('rejects a missing resolution', () => {
      const { resolution: _resolution, ...rest } = $validCell;
      const result = H3CellSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'number',
        message: 'Invalid input: expected number, received undefined',
        path: ['resolution'],
      });
    });

    it('rejects a float resolution', () => {
      const result = H3CellSchema.safeParse({ ...$validCell, resolution: 9.5 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'int',
        format: 'safeint',
        message: 'Invalid input: expected int, received number',
        path: ['resolution'],
      });
    });

    it('accepts a valid cell at the min boundary (0)', () => {
      expect(H3CellSchema.parse($validCellRes0)).toEqual($validCellRes0);
    });

    it('accepts a valid cell at the max boundary (15)', () => {
      expect(H3CellSchema.parse($validCellRes15)).toEqual($validCellRes15);
    });

    it('rejects a resolution below 0', () => {
      const result = H3CellSchema.safeParse({ ...$validCell, resolution: -1 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected number to be >=0',
        minimum: 0,
        origin: 'number',
        path: ['resolution'],
      });
    });

    it('rejects a resolution above 15', () => {
      const result = H3CellSchema.safeParse({ ...$validCell, resolution: 16 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_big',
        inclusive: true,
        maximum: 15,
        message: 'Too big: expected number to be <=15',
        origin: 'number',
        path: ['resolution'],
      });
    });
  });

  // `center` is a `[lat, lng]` tuple, each in decimal degrees.
  describe('center', () => {
    it('rejects a missing center', () => {
      const { center: _center, ...rest } = $validCell;
      const result = H3CellSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'tuple',
        message: 'Invalid input: expected tuple, received undefined',
        path: ['center'],
      });
    });

    it.prop({ center: $nonArray })(
      'rejects a non-array center',
      ({ center }) => {
        const result = H3CellSchema.safeParse({ ...$validCell, center });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('tuple');
        expect(issue.path).toEqual(['center']);
      },
    );

    it('rejects a center with too few items', () => {
      const result = H3CellSchema.safeParse({
        ...$validCell,
        center: [$validCell.center[0]],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'number',
        message: 'Invalid input: expected number, received undefined',
        path: ['center', 1],
      });
    });

    it.prop({ lat: $nonNumber })(
      'rejects a non-number center element',
      ({ lat }) => {
        const result = H3CellSchema.safeParse({
          ...$validCell,
          center: [lat, $validCell.center[1]],
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('number');
        expect(issue.path).toEqual(['center', 0]);
      },
    );

    it('rejects a center element out of range', () => {
      const result = H3CellSchema.safeParse({
        ...$validCell,
        center: [200, 0],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_big',
        inclusive: true,
        maximum: 90,
        message: 'Too big: expected number to be <=90',
        origin: 'number',
        path: ['center', 0],
      });
    });
  });

  describe('cross-field validation', () => {
    it('rejects a well-formed but invalid H3 index', () => {
      const result = H3CellSchema.safeParse({
        ...$validCell,
        h3Index: 'nothex',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'Invalid H3 index',
        path: ['h3Index'],
      });
    });

    it('rejects a resolution that does not match the H3 index', () => {
      const result = H3CellSchema.safeParse({ ...$validCell, resolution: 8 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'resolution mismatch (h3IndexResolution=9, resolution=8)',
        path: ['resolution'],
      });
    });

    it('rejects a center that does not match the H3 index', () => {
      const result = H3CellSchema.safeParse({
        ...$validCell,
        center: [0, 0],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message:
          'center mismatch (h3IndexCenter=37.77670234943567,-122.41845932318311, center=0,0)',
        path: ['center'],
      });
    });
  });
});

describe('CoarseLocationSchema', () => {
  it('accepts a valid location', () => {
    expect(CoarseLocationSchema.parse($validCoarseLocation)).toEqual(
      $validCoarseLocation,
    );
  });

  it('accepts a location with no baseline/effective (privacy not met)', () => {
    const location = { ...$validCoarseLocation, h3: {} };
    expect(CoarseLocationSchema.parse(location)).toEqual(location);
  });

  it.prop({ nonObject: $nonObject })(
    'rejects a non-object root',
    ({ nonObject }) => {
      const result = CoarseLocationSchema.safeParse(nonObject);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
      expect(issue.code).toEqual('invalid_type');
      expect(issue.expected).toEqual('object');
      expect(issue.path).toEqual([]);
    },
  );

  it('rejects an invalid schemaVersion', () => {
    const result = CoarseLocationSchema.safeParse({
      ...$validCoarseLocation,
      schemaVersion: 'location_v2',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0]).toEqual({
      code: 'invalid_value',
      values: ['location_v1'],
      message: 'Invalid input: expected "location_v1"',
      path: ['schemaVersion'],
    });
  });

  it('rejects a non-ISO computedAt', () => {
    const result = CoarseLocationSchema.safeParse({
      ...$validCoarseLocation,
      computedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    const issue = result.error
      ?.issues[0] as z.core.$ZodIssueInvalidStringFormat;
    expect(issue.code).toEqual('invalid_format');
    expect(issue.format).toEqual('datetime');
    expect(issue.message).toEqual('Invalid ISO datetime');
    expect(issue.path).toEqual(['computedAt']);
  });

  describe('population', () => {
    it('rejects an invalid source', () => {
      const result = CoarseLocationSchema.safeParse({
        ...$validCoarseLocation,
        population: { ...$validCoarseLocation.population, source: 'census' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_value',
        values: ['kontur', 'worldpop'],
        message: 'Invalid option: expected one of "kontur"|"worldpop"',
        path: ['population', 'source'],
      });
    });

    it('rejects a non-positive threshold', () => {
      const result = CoarseLocationSchema.safeParse({
        ...$validCoarseLocation,
        population: { ...$validCoarseLocation.population, threshold: 0 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: false,
        message: 'Too small: expected number to be >0',
        minimum: 0,
        origin: 'number',
        path: ['population', 'threshold'],
      });
    });
  });

  describe('h3', () => {
    it('delegates baseline validation to H3CellSchema', () => {
      const result = CoarseLocationSchema.safeParse({
        ...$validCoarseLocation,
        h3: {
          ...$validCoarseLocation.h3,
          baseline: { ...$validCellRes5, h3Index: 'nothex' },
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'Invalid H3 index',
        path: ['h3', 'baseline', 'h3Index'],
      });
    });

    it('rejects a baseline whose resolution is not 5', () => {
      const result = CoarseLocationSchema.safeParse({
        ...$validCoarseLocation,
        h3: { ...$validCoarseLocation.h3, baseline: $validCell },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'h3.baseline.resolution must be 5',
        path: ['h3', 'baseline', 'resolution'],
      });
    });

    it('rejects an effective cell coarser than resolution 5', () => {
      const result = CoarseLocationSchema.safeParse({
        ...$validCoarseLocation,
        h3: { effective: $validCellRes0 },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'custom',
        message: 'h3.effective.resolution must be >= 5',
        path: ['h3', 'effective', 'resolution'],
      });
    });
  });
});
