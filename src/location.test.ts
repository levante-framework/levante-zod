import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import type * as z from 'zod';
import { H3CellSchema } from './location';

/** Arbitrary: a non-object value */
const $nonObject = fc.anything().filter((v) => typeof v !== 'object');

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** A valid H3CellSchema input */
const $validCell = { cellId: '8928308280fffff', resolution: 9 };

describe('H3CellSchema', () => {
  it('accepts a valid cell', () => {
    expect(H3CellSchema.parse($validCell)).toEqual($validCell);
  });

  it('trims cellId', () => {
    expect(
      H3CellSchema.parse({ ...$validCell, cellId: '  8928308280fffff  ' }),
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

  describe('cellId', () => {
    it('rejects a missing cellId', () => {
      const { cellId: _cellId, ...rest } = $validCell;
      const result = H3CellSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received undefined',
        path: ['cellId'],
      });
    });

    it.prop({ cellId: $nonString })(
      'rejects a non-string cellId',
      ({ cellId }) => {
        const result = H3CellSchema.safeParse({ ...$validCell, cellId });
        expect(result.success).toBe(false);
        expect(result.error?.issues.length).toBe(1);
        const issue = result.error?.issues[0] as z.core.$ZodIssueInvalidType;
        expect(issue.code).toEqual('invalid_type');
        expect(issue.expected).toEqual('string');
        expect(issue.message).toMatch(
          /Invalid input: expected string, received/,
        );
        expect(issue.path).toEqual(['cellId']);
      },
    );

    it('rejects an empty cellId', () => {
      const result = H3CellSchema.safeParse({ ...$validCell, cellId: '   ' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(1);
      expect(result.error?.issues[0]).toEqual({
        code: 'too_small',
        inclusive: true,
        message: 'Too small: expected string to have >=1 characters',
        minimum: 1,
        origin: 'string',
        path: ['cellId'],
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

    it('accepts the min boundary (0)', () => {
      expect(H3CellSchema.parse({ ...$validCell, resolution: 0 })).toEqual({
        ...$validCell,
        resolution: 0,
      });
    });

    it('accepts the max boundary (15)', () => {
      expect(H3CellSchema.parse({ ...$validCell, resolution: 15 })).toEqual({
        ...$validCell,
        resolution: 15,
      });
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
});
