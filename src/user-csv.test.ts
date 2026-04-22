import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import type * as z from 'zod';
import {
  AddUserCsvHeaderSchema,
  CaregiverUserCsvRow,
  CHILD_YEAR_MAX,
  CHILD_YEAR_MIN,
  ChildUserCsvRow,
  combineUserCsvIssues,
  ListableString,
  NonEmptyString,
  NumberString,
  REQUIRED_ADD_USER_CSV_HEADERS,
  TeacherUserCsvRow,
  UserCsvRowBase,
  UserCsvSchema,
} from './user-csv';

/** Fixture: returns a minimal zod issue */
const $makeIssue = (
  path: PropertyKey[],
  message: string | undefined = 'Invalid',
): z.core.$ZodIssue =>
  ({
    code: 'custom',
    path,
    message,
    input: undefined,
  }) as unknown as z.core.$ZodIssue;

/** Arbitrary: a non-array value */
const $nonArray = fc.anything().filter((v) => !Array.isArray(v));

/** Arbitrary: a non-empty string (NB: trim-stable and comma-free so it
 *  produces exactly one ListableString part) */
const $nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim() === s && !s.includes(','));

/** Arbitrary: a non-empty array of non-empty strings */
const $nonEmptyStringArray = fc.array($nonEmptyString, { minLength: 1 });

/** Arbitrary: a non-integer number value */
const $nonIntegerNumber = fc
  .float()
  .filter((n) => !Number.isInteger(n))
  .map(String);

/** Arbitrary: a non-number string (e.g., "foo", "one") */
const $nonNumberString = fc.string().filter((v) => Number.isNaN(Number(v)));

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Arbitrary: a number string (e.g., "123", "123.456", "NaN") */
const $numberString = fc
  .oneof(fc.float(), fc.integer(), fc.constant('NaN'))
  .map(String);

/** Fixture: a valid caregiver/teacher row to derive test fixtures from */
const $validAdultRow = {
  id: 'user-1',
  userType: undefined, // NB: must be defined by the test case
  month: '',
  year: '',
  caregiverId: '',
  teacherId: '',
  school: 'school-1',
  class: 'class-1',
  cohort: '',
};

/** Fixture: a valid child row to derive test fixtures from */
const $validChildRow = {
  id: 'user-1',
  userType: 'child',
  month: '1',
  year: '2020',
  caregiverId: 'caregiver-1',
  teacherId: 'teacher-1',
  school: 'school-1',
  class: 'class-1',
  cohort: '',
};

describe('AddUserCsvHeaderSchema', () => {
  it('accepts an array containing all required headers', () => {
    expect(
      AddUserCsvHeaderSchema.parse([...REQUIRED_ADD_USER_CSV_HEADERS]),
    ).toEqual([...REQUIRED_ADD_USER_CSV_HEADERS]);
  });

  it('accepts extra headers beyond the required set', () => {
    expect(
      AddUserCsvHeaderSchema.parse([...REQUIRED_ADD_USER_CSV_HEADERS, 'foo']),
    ).toEqual([...REQUIRED_ADD_USER_CSV_HEADERS, 'foo']);
  });

  it.prop({ v: $nonArray })('rejects non-arrays', ({ v }) => {
    const result = AddUserCsvHeaderSchema.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_type');
    expect(result.error!.issues[0].path).toEqual([]);
  });

  it.prop({ v: $nonString })(
    'rejects arrays containing non-string elements',
    ({ v }) => {
      const result = AddUserCsvHeaderSchema.safeParse([
        ...REQUIRED_ADD_USER_CSV_HEADERS,
        v,
        v,
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(2);
      result.error!.issues.forEach((issue, idx) => {
        expect(issue.code).toEqual('invalid_type');
        expect(issue.path).toEqual([
          REQUIRED_ADD_USER_CSV_HEADERS.length + idx,
        ]);
      });
    },
  );

  REQUIRED_ADD_USER_CSV_HEADERS.forEach((header) => {
    it(`rejects headers missing "${header}"`, () => {
      const withoutHeader = REQUIRED_ADD_USER_CSV_HEADERS.filter(
        (h) => h !== header,
      );
      const result = AddUserCsvHeaderSchema.safeParse(withoutHeader);
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
    const result = AddUserCsvHeaderSchema.safeParse([]);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(
      REQUIRED_ADD_USER_CSV_HEADERS.length,
    );
    result.error!.issues.forEach((issue, idx) => {
      expect(issue.code).toEqual('custom');
      expect(issue.message).toEqual(`Missing required header`);
      expect(issue.path).toEqual([REQUIRED_ADD_USER_CSV_HEADERS[idx]]);
    });
  });
});

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

describe('NonEmptyString', () => {
  it.prop({ v: $nonEmptyString })('accepts non-empty strings', ({ v }) => {
    expect(() => NonEmptyString().parse(v)).not.toThrow();
  });

  it('trims surrounding whitespace', () => {
    expect(NonEmptyString().parse('  hello  ')).toEqual('hello');
  });

  it('rejects an empty string with the default message', () => {
    const result = NonEmptyString().safeParse('');
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].message).toEqual('Required');
  });

  it('rejects a whitespace-only string with the default message', () => {
    const result = NonEmptyString().safeParse('   ');
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].message).toEqual('Required');
  });

  it('uses a custom message when provided', () => {
    const result = NonEmptyString('Name is required').safeParse('');
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toEqual('Name is required');
  });

  it.prop({ v: $nonString })('rejects non-strings', ({ v }) => {
    const result = NonEmptyString().safeParse(v);
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

describe('UserCsvRowBase', () => {
  it('accepts a valid row', () => {
    expect(() => UserCsvRowBase.parse($validChildRow)).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = UserCsvRowBase.safeParse({
      ...$validChildRow,
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('id validation', () => {
    it.prop({ id: $nonEmptyString })('accepts non-empty strings', ({ id }) => {
      expect(() =>
        UserCsvRowBase.parse({ ...$validChildRow, id }),
      ).not.toThrow();
    });

    it.prop({ id: $nonEmptyString })('trims whitespace', ({ id }) => {
      const result = UserCsvRowBase.safeParse({
        ...$validChildRow,
        id: ` ${id}  `,
      });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(id);
    });

    it('rejects an empty string', () => {
      const result = UserCsvRowBase.safeParse({ ...$validChildRow, id: '' });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Required');
      expect(result.error!.issues[0].path).toEqual(['id']);
    });

    it('rejects a whitespace-only string', () => {
      const result = UserCsvRowBase.safeParse({
        ...$validChildRow,
        id: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Required');
      expect(result.error!.issues[0].path).toEqual(['id']);
    });

    it.prop({ id: $nonString })('rejects non-strings', ({ id }) => {
      const result = UserCsvRowBase.safeParse({ ...$validChildRow, id });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].path).toEqual(['id']);
    });
  });

  describe('group validation (valid combinations)', () => {
    it.prop({
      school: $nonEmptyString,
      _class: $nonEmptyString, // NB: underscore avoids conflict w/ class property
    })('accepts rows w/ school+class (no cohort)', ({ school, _class }) => {
      expect(() =>
        UserCsvRowBase.parse({
          ...$validChildRow,
          school,
          class: _class,
          cohort: '',
        }),
      ).not.toThrow();
    });

    it.prop({
      schools: $nonEmptyStringArray,
      classes: $nonEmptyStringArray,
    })(
      'accepts rows w/ schools+classes (no cohort)',
      ({ schools, classes }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...$validChildRow,
            school: schools.join(','),
            class: classes.join(','),
            cohort: '',
          }),
        ).not.toThrow();
      },
    );

    it.prop({ cohort: $nonEmptyString })(
      'accepts rows w/ cohort (no school+class)',
      ({ cohort }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...$validChildRow,
            school: '',
            class: '',
            cohort,
          }),
        ).not.toThrow();
      },
    );

    it.prop({ cohorts: $nonEmptyStringArray })(
      'accepts rows w/ cohorts (no school+class)',
      ({ cohorts }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...$validChildRow,
            school: '',
            class: '',
            cohort: cohorts.join(','),
          }),
        ).not.toThrow();
      },
    );
  });

  describe('group validation (invalid combinations)', () => {
    it('rejects a row w/ no group', () => {
      const result = UserCsvRowBase.safeParse({
        ...$validChildRow,
        school: '',
        class: '',
        cohort: '',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('custom');
      expect(result.error!.issues[0].message).toEqual(
        'Must have either school and class OR cohort',
      );
      expect(result.error!.issues[0].path).toEqual(['school|class|cohort']);
    });

    it.prop({ school: $nonEmptyString })(
      'rejects rows w/ school but no class',
      ({ school }) => {
        const result = UserCsvRowBase.safeParse({
          ...$validChildRow,
          school,
          class: '',
          cohort: '',
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('custom');
        expect(result.error!.issues[0].message).toEqual(
          'Must have either school and class OR cohort',
        );
        expect(result.error!.issues[0].path).toEqual(['school|class|cohort']);
      },
    );

    it.prop({ _class: $nonEmptyString })(
      'rejects rows w/ class but no school',
      ({ _class }) => {
        const result = UserCsvRowBase.safeParse({
          ...$validChildRow,
          school: '',
          class: _class,
          cohort: '',
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('custom');
        expect(result.error!.issues[0].message).toEqual(
          'Must have either school and class OR cohort',
        );
        expect(result.error!.issues[0].path).toEqual(['school|class|cohort']);
      },
    );

    it.prop({
      school: $nonEmptyString,
      _class: $nonEmptyString,
      cohort: $nonEmptyString,
    })(
      'rejects rows w/ both school+class and cohort',
      ({ school, _class, cohort }) => {
        const result = UserCsvRowBase.safeParse({
          ...$validChildRow,
          school,
          class: _class,
          cohort,
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('custom');
        expect(result.error!.issues[0].message).toEqual(
          'Must have either school and class OR cohort',
        );
        expect(result.error!.issues[0].path).toEqual(['school|class|cohort']);
      },
    );
  });
});

describe('CaregiverUserCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      CaregiverUserCsvRow.parse({ ...$validAdultRow, userType: 'caregiver' }),
    ).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = CaregiverUserCsvRow.safeParse({
      ...$validAdultRow,
      userType: 'caregiver',
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });
});

describe('ChildUserCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() => ChildUserCsvRow.parse({ ...$validChildRow })).not.toThrow();
  });

  describe('month validation', () => {
    it.prop({ month: fc.integer({ min: 1, max: 12 }).map(String) })(
      'accepts valid months (1-12)',
      ({ month }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...$validChildRow, month }),
        ).not.toThrow();
      },
    );

    it('rejects an empty string', () => {
      const result = ChildUserCsvRow.safeParse({
        ...$validChildRow,
        month: '',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual(
        'Required for child users',
      );
      expect(result.error!.issues[0].path).toEqual(['month']);
    });

    it.prop({
      month: fc.integer({ min: Number.MIN_SAFE_INTEGER, max: 0 }).map(String),
    })('rejects months below 1', ({ month }) => {
      const result = ChildUserCsvRow.safeParse({ ...$validChildRow, month });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Must be >=1');
      expect(result.error!.issues[0].path).toEqual(['month']);
    });

    it.prop({
      month: fc.integer({ min: 13, max: Number.MAX_SAFE_INTEGER }).map(String),
    })('rejects months above 12', ({ month }) => {
      const result = ChildUserCsvRow.safeParse({ ...$validChildRow, month });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_big');
      expect(result.error!.issues[0].message).toEqual('Must be <=12');
      expect(result.error!.issues[0].path).toEqual(['month']);
    });

    it.prop({ month: $nonString })('rejects non-strings', ({ month }) => {
      const result = ChildUserCsvRow.safeParse({ ...$validChildRow, month });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].path).toEqual(['month']);
    });

    it.prop({ month: $nonIntegerNumber })(
      'rejects non-integer numbers',
      ({ month }) => {
        const result = ChildUserCsvRow.safeParse({ ...$validChildRow, month });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].message).toEqual('Must be a number');
        expect(result.error!.issues[0].path).toEqual(['month']);
      },
    );

    it.prop({ month: $nonNumberString })(
      'rejects non-number strings',
      ({ month }) => {
        const result = ChildUserCsvRow.safeParse({ ...$validChildRow, month });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].message).toEqual('Must be a number');
        expect(result.error!.issues[0].path).toEqual(['month']);
      },
    );
  });

  describe('year validation', () => {
    it.prop({
      year: fc
        .integer({ min: CHILD_YEAR_MIN, max: CHILD_YEAR_MAX })
        .map(String),
    })('accepts valid years (CHILD_YEAR_MIN-CHILD_YEAR_MAX)', ({ year }) => {
      expect(() =>
        ChildUserCsvRow.parse({ ...$validChildRow, year }),
      ).not.toThrow();
    });

    it('rejects an empty string', () => {
      const result = ChildUserCsvRow.safeParse({ ...$validChildRow, year: '' });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual(
        'Required for child users',
      );
      expect(result.error!.issues[0].path).toEqual(['year']);
    });

    it.prop({
      year: fc
        .integer({ min: Number.MIN_SAFE_INTEGER, max: CHILD_YEAR_MIN - 1 })
        .map(String),
    })('rejects years below CHILD_YEAR_MIN', ({ year }) => {
      const result = ChildUserCsvRow.safeParse({ ...$validChildRow, year });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual(
        `Must be >=${CHILD_YEAR_MIN}`,
      );
      expect(result.error!.issues[0].path).toEqual(['year']);
    });

    it.prop({
      year: fc
        .integer({ min: CHILD_YEAR_MAX + 1, max: Number.MAX_SAFE_INTEGER })
        .map(String),
    })('rejects years above CHILD_YEAR_MAX', ({ year }) => {
      const result = ChildUserCsvRow.safeParse({ ...$validChildRow, year });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_big');
      expect(result.error!.issues[0].message).toEqual(
        `Must be <=${CHILD_YEAR_MAX}`,
      );
      expect(result.error!.issues[0].path).toEqual(['year']);
    });

    it.prop({ year: $nonIntegerNumber })(
      'rejects non-integer numbers',
      ({ year }) => {
        const result = ChildUserCsvRow.safeParse({ ...$validChildRow, year });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].message).toEqual('Must be a number');
        expect(result.error!.issues[0].path).toEqual(['year']);
      },
    );

    it.prop({ year: $nonNumberString })(
      'rejects non-number strings',
      ({ year }) => {
        const result = ChildUserCsvRow.safeParse({ ...$validChildRow, year });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].message).toEqual('Must be a number');
        expect(result.error!.issues[0].path).toEqual(['year']);
      },
    );
  });

  describe('caregiverId validation', () => {
    it('accepts an empty caregiverId', () => {
      expect(() =>
        ChildUserCsvRow.parse({ ...$validChildRow, caregiverId: '' }),
      ).not.toThrow();
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'accepts a comma-separated string and parses it into an array',
      ({ parts }) => {
        const result = ChildUserCsvRow.safeParse({
          ...$validChildRow,
          caregiverId: parts.join(','),
        });
        expect(result.success).toBe(true);
        expect(result.data?.caregiverId).toEqual(parts);
      },
    );

    it.prop({
      caregiverId: $nonString,
    })('rejects non-strings', ({ caregiverId }) => {
      const result = ChildUserCsvRow.safeParse({
        ...$validChildRow,
        caregiverId,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].path).toEqual(['caregiverId']);
    });
  });

  describe('teacherId validation', () => {
    it('accepts an empty teacherId', () => {
      expect(() =>
        ChildUserCsvRow.parse({ ...$validChildRow, teacherId: '' }),
      ).not.toThrow();
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'accepts a comma-separated string and parses it into an array',
      ({ parts }) => {
        const result = ChildUserCsvRow.safeParse({
          ...$validChildRow,
          teacherId: parts.join(','),
        });
        expect(result.success).toBe(true);
        expect(result.data?.teacherId).toEqual(parts);
      },
    );

    it.prop({
      teacherId: $nonString,
    })('rejects non-strings', ({ teacherId }) => {
      const result = ChildUserCsvRow.safeParse({
        ...$validChildRow,
        teacherId,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].path).toEqual(['teacherId']);
    });
  });

  describe('group validation', () => {
    it.prop({ school: $nonEmptyString, _class: $nonEmptyString })(
      'accepts a row with exactly one school and one class',
      ({ school, _class }) => {
        expect(() =>
          ChildUserCsvRow.parse({
            ...$validChildRow,
            school,
            class: _class,
            cohort: '',
          }),
        ).not.toThrow();
      },
    );

    it.prop({ cohort: $nonEmptyString })(
      'accepts a row with exactly one cohort',
      ({ cohort }) => {
        expect(() =>
          ChildUserCsvRow.parse({
            ...$validChildRow,
            school: '',
            class: '',
            cohort,
          }),
        ).not.toThrow();
      },
    );

    it.prop({
      schools: fc.array($nonEmptyString, { minLength: 2 }),
      _class: $nonEmptyString,
    })('rejects rows w/ multiple schools', ({ schools, _class }) => {
      const result = ChildUserCsvRow.safeParse({
        ...$validChildRow,
        school: schools.join(','),
        class: _class,
        cohort: '',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('custom');
      expect(result.error!.issues[0].path).toEqual(['school|class|cohort']);
    });

    it.prop({
      school: $nonEmptyString,
      classes: fc.array($nonEmptyString, { minLength: 2 }),
    })('rejects rows w/ multiple classes', ({ school, classes }) => {
      const result = ChildUserCsvRow.safeParse({
        ...$validChildRow,
        school,
        class: classes.join(','),
        cohort: '',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('custom');
      expect(result.error!.issues[0].path).toEqual(['school|class|cohort']);
    });

    it.prop({ cohorts: fc.array($nonEmptyString, { minLength: 2 }) })(
      'rejects a row with multiple cohorts',
      ({ cohorts }) => {
        const result = ChildUserCsvRow.safeParse({
          ...$validChildRow,
          school: '',
          class: '',
          cohort: cohorts.join(','),
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('custom');
        expect(result.error!.issues[0].path).toEqual(['school|class|cohort']);
      },
    );
  });
});

describe('TeacherUserCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      TeacherUserCsvRow.parse({ ...$validAdultRow, userType: 'teacher' }),
    ).not.toThrow();
  });
});

describe('UserCsvSchema', () => {
  it('accepts valid rows', () => {
    expect(() =>
      UserCsvSchema.parse([
        { ...$validChildRow, id: 'user-1' },
        { ...$validAdultRow, id: 'user-2', userType: 'caregiver' },
        { ...$validAdultRow, id: 'user-3', userType: 'teacher' },
      ]),
    ).not.toThrow();
  });

  it('rejects a row w/ an unknown userType', () => {
    const result = UserCsvSchema.safeParse([
      { ...$validChildRow, id: 'user-1', userType: 'unknown' },
    ]);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_union');
    expect(result.error!.issues[0].message).toEqual(
      'Must be caregiver, child, or teacher',
    );
  });

  it('rejects a row with undefined userType', () => {
    const result = UserCsvSchema.safeParse([
      { ...$validChildRow, userType: undefined },
    ]);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_union');
    expect(result.error!.issues[0].message).toEqual(
      'Must be caregiver, child, or teacher',
    );
    expect(result.error!.issues[0].path).toEqual([0, 'userType']);
  });

  describe('unique id validation', () => {
    it('rejects rows w/ a duplicated id', () => {
      const result = UserCsvSchema.safeParse([
        { ...$validChildRow, id: 'dup' },
        { ...$validChildRow, id: 'unique' },
        { ...$validChildRow, id: 'dup' },
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(2);
      result.error!.issues.forEach((issue) => {
        expect(issue.code).toEqual('custom');
        expect(issue.message).toEqual('Must be unique');
      });
      expect(result.error!.issues.map((i) => i.path)).toEqual([
        [0, 'id'],
        [2, 'id'],
      ]);
    });

    it('flags every row participating in a duplicate', () => {
      const result = UserCsvSchema.safeParse([
        { ...$validChildRow, id: 'dup' },
        { ...$validChildRow, id: 'dup' },
        { ...$validChildRow, id: 'dup' },
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.map((i) => i.path)).toEqual([
        [0, 'id'],
        [1, 'id'],
        [2, 'id'],
      ]);
    });

    it('treats ids as unique after trimming', () => {
      const result = UserCsvSchema.safeParse([
        { ...$validChildRow, id: 'user-1' },
        { ...$validChildRow, id: '  user-1  ' },
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(2);
      expect(result.error!.issues.map((i) => i.path)).toEqual([
        [0, 'id'],
        [1, 'id'],
      ]);
    });

    it('reports each duplicate group separately', () => {
      const result = UserCsvSchema.safeParse([
        { ...$validChildRow, id: 'a' },
        { ...$validChildRow, id: 'b' },
        { ...$validChildRow, id: 'a' },
        { ...$validChildRow, id: 'b' },
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(4);
      expect(result.error!.issues.map((i) => i.path)).toEqual([
        [0, 'id'],
        [2, 'id'],
        [1, 'id'],
        [3, 'id'],
      ]);
    });
  });
});

describe('combineUserCsvIssues', () => {
  it('returns an empty array for no issues', () => {
    expect(combineUserCsvIssues([])).toEqual([]);
  });

  it('formats a single row-scoped issue as "path: message"', () => {
    const result = combineUserCsvIssues([$makeIssue([0, 'id'], 'Required')]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2] }]);
  });

  it('offsets rowNum by +2 (header row + 1-indexing)', () => {
    const result = combineUserCsvIssues([
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([5, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2, 7] }]);
  });

  it('joins multi-segment paths with "."', () => {
    const result = combineUserCsvIssues([
      $makeIssue([0, 'nested', 'field'], 'Invalid'),
    ]);
    expect(result).toEqual([
      { message: 'nested.field: Invalid', rowNums: [2] },
    ]);
  });

  it('combines issues w/ the same message across multiple rows', () => {
    const result = combineUserCsvIssues([
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([1, 'id'], 'Required'),
      $makeIssue([2, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2, 3, 4] }]);
  });

  it('deduplicates rowNums when the same row has duplicate messages', () => {
    const result = combineUserCsvIssues([
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([1, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2, 3] }]);
  });

  it('sorts rowNums ascending regardless of issue order', () => {
    const result = combineUserCsvIssues([
      $makeIssue([7, 'id'], 'Required'),
      $makeIssue([1, 'id'], 'Required'),
      $makeIssue([3, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [3, 5, 9] }]);
  });

  it('separates issues w/ different messages into distinct entries', () => {
    const result = combineUserCsvIssues([
      $makeIssue([0, 'id'], 'Required'),
      $makeIssue([0, 'year'], 'Must be a number'),
    ]);
    expect(result).toEqual([
      { message: 'id: Required', rowNums: [2] },
      { message: 'year: Must be a number', rowNums: [2] },
    ]);
  });

  it('separates issues w/ same field but different messages', () => {
    const result = combineUserCsvIssues([
      $makeIssue([0, 'year'], 'Must be >=1000'),
      $makeIssue([1, 'year'], 'Must be <=9999'),
    ]);
    expect(result).toEqual([
      { message: 'year: Must be >=1000', rowNums: [2] },
      { message: 'year: Must be <=9999', rowNums: [3] },
    ]);
  });

  it('preserves order of first occurrence across messages', () => {
    const result = combineUserCsvIssues([
      $makeIssue([0, 'year'], 'Must be >=1000'),
      $makeIssue([1, 'id'], 'Required'),
      $makeIssue([2, 'year'], 'Must be >=1000'),
    ]);
    expect(result).toEqual([
      { message: 'year: Must be >=1000', rowNums: [2, 4] },
      { message: 'id: Required', rowNums: [3] },
    ]);
  });

  it('filters out issues w/ empty path', () => {
    const result = combineUserCsvIssues([
      $makeIssue([], 'Root-level error'),
      $makeIssue([0, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2] }]);
  });

  it('skips issues whose first path segment is not a number', () => {
    const result = combineUserCsvIssues([
      $makeIssue(['notARow', 'id'], 'Required'),
      $makeIssue([0, 'id'], 'Required'),
    ]);
    expect(result).toEqual([{ message: 'id: Required', rowNums: [2] }]);
  });

  it('defaults missing issue.message to "Invalid"', () => {
    const result = combineUserCsvIssues([$makeIssue([0, 'id'], undefined)]);
    expect(result).toEqual([{ message: 'id: Invalid', rowNums: [2] }]);
  });

  it('handles issues w/ only a row number (no field path)', () => {
    const result = combineUserCsvIssues([$makeIssue([0], 'Something broke')]);
    expect(result).toEqual([{ message: ': Something broke', rowNums: [2] }]);
  });

  it('combines issues produced by UserCsvSchema for real validation errors', () => {
    const parseResult = UserCsvSchema.safeParse([
      { ...$validChildRow, id: '' }, // row 0: id required
      { ...$validChildRow, id: '' }, // row 1: id required (same message)
      {
        ...$validAdultRow,
        userType: 'caregiver',
        school: '',
        class: '',
        cohort: '',
      }, // row 2: missing group
    ]);
    expect(parseResult.success).toBe(false);
    const combined = combineUserCsvIssues(parseResult.error!.issues);
    expect(combined).toEqual([
      { message: 'id: Required', rowNums: [2, 3] },
      {
        message:
          'school|class|cohort: Must have either school and class OR cohort',
        rowNums: [4],
      },
    ]);
  });
});
