import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import * as z from 'zod';
import { hasRequiredHeaders, ListableString, NumberString } from './shared';

/** Fixture: a required headers array */
const $REQUIRED_HEADERS = ['foo', 'bar', 'baz'] as const;

/** Fixture: a schema with required headers refinement */
const $hasRequiredHeadersSchema = z
  .array(z.string())
  .superRefine(hasRequiredHeaders($REQUIRED_HEADERS));

/** Arbitrary: a non-array value */
const $nonArray = fc.anything().filter((v) => !Array.isArray(v));

/** Arbitrary: a non-empty string (NB: trim-stable and comma-free so it
 *  produces exactly one ListableString part) */
const $nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim() === s && !s.includes(','));

/** Arbitrary: a non-empty array of non-empty strings */
const $nonEmptyStringArray = fc.array($nonEmptyString, { minLength: 1 });

/** Arbitrary: a non-number string (e.g., "foo", "one") */
const $nonNumberString = fc.string().filter((v) => Number.isNaN(Number(v)));

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Arbitrary: a number string (e.g., "123", "123.456", "NaN") */
const $numberString = fc
  .oneof(fc.float(), fc.integer(), fc.constant('NaN'))
  .map(String);

describe('ListableString', () => {
  it.prop({
    parts: $nonEmptyStringArray,
  })('parses comma-separated string into an array', ({ parts }) => {
    expect(ListableString.parse(parts.join(','))).toEqual(parts);
  });

  it.prop({
    parts: $nonEmptyStringArray,
  })('trims whitespace from each part', ({ parts }) => {
    expect(ListableString.parse(parts.join(' , '))).toEqual(parts);
  });

  it.prop({
    parts: $nonEmptyStringArray,
  })('filters out empty parts', ({ parts }) => {
    expect(ListableString.parse(parts.join(', ,,'))).toEqual(parts);
  });

  it('returns an empty array for an empty string', () => {
    expect(ListableString.parse('')).toEqual([]);
  });

  it.prop({ v: $nonString })('rejects non-strings', ({ v }) => {
    const result = ListableString.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_type');
    expect(result.error!.issues[0].path).toEqual([]);
  });
});

describe('NumberString', () => {
  it.prop({ v: $numberString })('coerces strings into numbers', ({ v }) => {
    expect(NumberString().parse(v)).toEqual(Number(v));
  });

  it.prop({ v: $nonNumberString })(
    'coerces non-number strings into NaN',
    ({ v }) => {
      expect(NumberString().parse(v)).toBeNaN();
    },
  );

  it.prop({ v: $nonString })('rejects non-strings', ({ v }) => {
    const result = NumberString().safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_type');
    expect(result.error!.issues[0].path).toEqual([]);
  });

  it('rejects an empty string', () => {
    const result = NumberString().safeParse('');
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('too_small');
    expect(result.error!.issues[0].message).toEqual('Required');
    expect(result.error!.issues[0].path).toEqual([]);
  });
});

describe('hasRequiredHeaders', () => {
  it('accepts an array containing all required headers', () => {
    expect($hasRequiredHeadersSchema.parse([...$REQUIRED_HEADERS])).toEqual([
      ...$REQUIRED_HEADERS,
    ]);
  });

  it('accepts extra headers beyond the required set', () => {
    expect(
      $hasRequiredHeadersSchema.parse([...$REQUIRED_HEADERS, 'extra']),
    ).toEqual([...$REQUIRED_HEADERS, 'extra']);
  });

  it.prop({ v: $nonArray })('rejects non-arrays', ({ v }) => {
    const result = $hasRequiredHeadersSchema.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_type');
    expect(result.error!.issues[0].path).toEqual([]);
  });

  it.prop({ v: $nonString })(
    'rejects arrays containing non-string elements',
    ({ v }) => {
      const result = $hasRequiredHeadersSchema.safeParse([
        ...$REQUIRED_HEADERS,
        v,
        v,
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(2);
      result.error!.issues.forEach((issue, idx) => {
        expect(issue.code).toEqual('invalid_type');
        expect(issue.path).toEqual([$REQUIRED_HEADERS.length + idx]);
      });
    },
  );

  $REQUIRED_HEADERS.forEach((header) => {
    it(`rejects headers missing "${header}"`, () => {
      const withoutHeader = $REQUIRED_HEADERS.filter((h) => h !== header);
      const result = $hasRequiredHeadersSchema.safeParse(withoutHeader);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('custom');
      expect(result.error!.issues[0].message).toEqual(
        `Missing required header`,
      );
      expect(result.error!.issues[0].path).toEqual([header]);
    });
  });

  it('rejects w/ multiple issues if multiple headers are missing', () => {
    const result = $hasRequiredHeadersSchema.safeParse([]);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe($REQUIRED_HEADERS.length);
    result.error!.issues.forEach((issue, idx) => {
      expect(issue.code).toEqual('custom');
      expect(issue.message).toEqual(`Missing required header`);
      expect(issue.path).toEqual([$REQUIRED_HEADERS[idx]]);
    });
  });
});
