import { describe, expect, it } from 'vitest';
import iso6391Alpha2 from './iso6391-alpha2.json';
import {
  Iso6391Alpha2Schema,
  LANGUAGE_OTHER,
  LanguageSelectionSchema,
} from './language-selection';

const $enEs = {
  codes: ['en', 'es'],
  otherDescription: null,
};

const $draft = {
  codes: [],
  otherDescription: null,
};

const $otherOnly = {
  codes: [LANGUAGE_OTHER],
  otherDescription: 'Kichwa',
};

const $enAndOther = {
  codes: ['en', LANGUAGE_OTHER],
  otherDescription: 'Kichwa',
};

describe('iso6391-alpha2.json', () => {
  it('contains unique lowercase alpha-2 codes', () => {
    expect(iso6391Alpha2.length).toBeGreaterThan(0);
    expect(new Set(iso6391Alpha2).size).toEqual(iso6391Alpha2.length);
    expect(iso6391Alpha2).not.toContain(LANGUAGE_OTHER);
    for (const code of iso6391Alpha2) {
      expect(code).toMatch(/^[a-z]{2}$/);
    }
  });
});

describe('Iso6391Alpha2Schema', () => {
  it('accepts a lowercase alpha-2 code', () => {
    expect(Iso6391Alpha2Schema.parse('en')).toEqual('en');
  });

  it('accepts every alpha-2 code from the local list', () => {
    expect(iso6391Alpha2.length).toBeGreaterThan(0);
    for (const code of iso6391Alpha2) {
      expect(Iso6391Alpha2Schema.parse(code)).toEqual(code);
    }
  });

  it('rejects an uppercase code', () => {
    const result = Iso6391Alpha2Schema.safeParse('EN');
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Invalid ISO 639-1 alpha-2 code',
        path: [],
      },
    ]);
  });

  it('rejects an alpha-3 alias', () => {
    const result = Iso6391Alpha2Schema.safeParse('eng');
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Invalid ISO 639-1 alpha-2 code',
        path: [],
      },
    ]);
  });

  it('rejects free text', () => {
    const result = Iso6391Alpha2Schema.safeParse('English');
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Invalid ISO 639-1 alpha-2 code',
        path: [],
      },
    ]);
  });

  it('rejects other', () => {
    const result = Iso6391Alpha2Schema.safeParse(LANGUAGE_OTHER);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Invalid ISO 639-1 alpha-2 code',
        path: [],
      },
    ]);
  });
});

describe('LanguageSelectionSchema', () => {
  it('accepts ISO codes with a null description', () => {
    expect(LanguageSelectionSchema.parse($enEs)).toEqual($enEs);
  });

  it('accepts an empty codes array (draft)', () => {
    expect(LanguageSelectionSchema.parse($draft)).toEqual($draft);
  });

  it('accepts other with a description', () => {
    expect(LanguageSelectionSchema.parse($otherOnly)).toEqual($otherOnly);
  });

  it('trims whitespace from otherDescription', () => {
    expect(
      LanguageSelectionSchema.parse({
        codes: [LANGUAGE_OTHER],
        otherDescription: '  Kichwa  ',
      }),
    ).toEqual($otherOnly);
  });

  it('accepts mixed ISO codes and other', () => {
    expect(LanguageSelectionSchema.parse($enAndOther)).toEqual($enAndOther);
  });

  it('rejects duplicate codes', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: ['en', 'en'],
      otherDescription: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Must be unique',
        path: ['codes', 0],
      },
      {
        code: 'custom',
        message: 'Must be unique',
        path: ['codes', 1],
      },
    ]);
  });

  it('rejects an alpha-3 alias in codes', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: ['eng'],
      otherDescription: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Invalid ISO 639-1 alpha-2 code',
        path: ['codes', 0],
      },
    ]);
  });

  it('rejects free text in codes', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: ['English'],
      otherDescription: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Invalid ISO 639-1 alpha-2 code',
        path: ['codes', 0],
      },
    ]);
  });

  it('rejects an uppercase code in codes', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: ['EN'],
      otherDescription: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Invalid ISO 639-1 alpha-2 code',
        path: ['codes', 0],
      },
    ]);
  });

  it('rejects other with a null description', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: [LANGUAGE_OTHER],
      otherDescription: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Required when codes includes other',
        path: ['otherDescription'],
      },
    ]);
  });

  it('rejects other with an empty description', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: [LANGUAGE_OTHER],
      otherDescription: '',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Required when codes includes other',
        path: ['otherDescription'],
      },
    ]);
  });

  it('rejects other with a whitespace-only description', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: [LANGUAGE_OTHER],
      otherDescription: '   ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Required when codes includes other',
        path: ['otherDescription'],
      },
    ]);
  });

  it('rejects a description when codes does not include other', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: ['en'],
      otherDescription: 'Kichwa',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Must be null when codes does not include other',
        path: ['otherDescription'],
      },
    ]);
  });

  it('rejects an empty description when codes does not include other', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: ['en'],
      otherDescription: '',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Must be null when codes does not include other',
        path: ['otherDescription'],
      },
    ]);
  });

  it('rejects a whitespace-only description when codes does not include other', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: ['en'],
      otherDescription: '   ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        code: 'custom',
        message: 'Must be null when codes does not include other',
        path: ['otherDescription'],
      },
    ]);
  });

  it('rejects a missing otherDescription key', () => {
    const result = LanguageSelectionSchema.safeParse({
      codes: ['en'],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].code).toEqual('invalid_type');
    expect(result.error?.issues[0].message).toEqual(
      'Invalid input: expected string, received undefined',
    );
    expect(result.error?.issues[0].path).toEqual(['otherDescription']);
  });
});
