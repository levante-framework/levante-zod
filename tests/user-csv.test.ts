import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import {
  CaregiverUserCsvRow,
  ChildUserCsvRow,
  ListableString,
  NumberString,
  TeacherUserCsvRow,
  UserCsvRowBase,
  UserCsvSchema,
} from '../src/user-csv';

/** Arbitrary: a non-empty string (NB: trim-stable and comma-free so it
 *  produces exactly one ListableString part) */
const nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim() === s && !s.includes(','));

/** Arbitrary: a non-empty array of non-empty strings */
const nonEmptyStringArray = fc.array(nonEmptyString, { minLength: 1 });

/** Arbitrary: a non-integer number value */
const nonIntegerNumber = fc
  .float()
  .filter((n) => !Number.isInteger(n))
  .map(String);

/** Arbitrary: a non-number string (e.g., "foo", "one") */
const nonNumberString = fc.string().filter((v) => Number.isNaN(Number(v)));

/** Arbitrary: a non-string value */
const nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Arbitrary: a number string (e.g., "123", "123.456", "NaN") */
const numberString = fc
  .oneof(fc.float(), fc.integer(), fc.constant('NaN'))
  .map(String);

/** Fixture: a valid caregiver/teacher row to derive test fixtures from */
const validAdultRow = {
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
const validChildRow = {
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

describe('ListableString', () => {
  it.prop({
    parts: nonEmptyStringArray,
  })('parses comma-separated string into an array', ({ parts }) => {
    expect(ListableString.parse(parts.join(','))).toEqual(parts);
  });

  it.prop({
    parts: nonEmptyStringArray,
  })('trims whitespace from each part', ({ parts }) => {
    expect(ListableString.parse(parts.join(' , '))).toEqual(parts);
  });

  it.prop({
    parts: nonEmptyStringArray,
  })('filters out empty parts', ({ parts }) => {
    expect(ListableString.parse(parts.join(', ,,'))).toEqual(parts);
  });

  it('returns an empty array for an empty string', () => {
    expect(ListableString.parse('')).toEqual([]);
  });

  it.prop({ v: nonString })('rejects non-strings', ({ v }) => {
    expect(() => ListableString.parse(v)).toThrow();
  });
});

describe('NumberString', () => {
  it.prop({ v: numberString })('coerces strings into numbers', ({ v }) => {
    expect(NumberString.parse(v)).toEqual(Number(v));
  });

  it.prop({ v: nonNumberString })(
    'coerces non-number strings into NaN',
    ({ v }) => {
      expect(NumberString.parse(v)).toBeNaN();
    },
  );

  it.prop({ v: nonString })('rejects non-strings', ({ v }) => {
    expect(() => NumberString.parse(v)).toThrow();
  });
});

describe('UserCsvRowBase', () => {
  it('accepts a valid row', () => {
    expect(() => UserCsvRowBase.parse(validChildRow)).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = UserCsvRowBase.safeParse({
      ...validChildRow,
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('id validation', () => {
    it.prop({ id: nonEmptyString })('accepts non-empty strings', ({ id }) => {
      expect(() =>
        UserCsvRowBase.parse({ ...validChildRow, id }),
      ).not.toThrow();
    });

    it.prop({ id: nonEmptyString })('trims whitespace', ({ id }) => {
      const result = UserCsvRowBase.safeParse({
        ...validChildRow,
        id: ` ${id}  `,
      });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(id);
    });

    it('rejects an empty string', () => {
      expect(() =>
        UserCsvRowBase.parse({ ...validChildRow, id: '' }),
      ).toThrow();
    });

    it('rejects a whitespace-only string', () => {
      expect(() =>
        UserCsvRowBase.parse({ ...validChildRow, id: '   ' }),
      ).toThrow();
    });

    it.prop({ id: nonString })('rejects non-strings', ({ id }) => {
      expect(() => UserCsvRowBase.parse({ ...validChildRow, id })).toThrow();
    });
  });

  describe('group validation (valid combinations)', () => {
    it.prop({
      school: nonEmptyString,
      _class: nonEmptyString, // NB: underscore avoids conflict w/ class property
    })('accepts rows w/ school+class (no cohort)', ({ school, _class }) => {
      expect(() =>
        UserCsvRowBase.parse({
          ...validChildRow,
          school,
          class: _class,
          cohort: '',
        }),
      ).not.toThrow();
    });

    it.prop({
      schools: nonEmptyStringArray,
      classes: nonEmptyStringArray,
    })(
      'accepts rows w/ schools+classes (no cohort)',
      ({ schools, classes }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...validChildRow,
            school: schools.join(','),
            class: classes.join(','),
            cohort: '',
          }),
        ).not.toThrow();
      },
    );

    it.prop({ cohort: nonEmptyString })(
      'accepts rows w/ cohort (no school+class)',
      ({ cohort }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...validChildRow,
            school: '',
            class: '',
            cohort,
          }),
        ).not.toThrow();
      },
    );

    it.prop({ cohorts: nonEmptyStringArray })(
      'accepts rows w/ cohorts (no school+class)',
      ({ cohorts }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...validChildRow,
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
      expect(() =>
        UserCsvRowBase.parse({
          ...validChildRow,
          school: '',
          class: '',
          cohort: '',
        }),
      ).toThrow();
    });

    it.prop({ school: nonEmptyString })(
      'rejects rows w/ school but no class',
      ({ school }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...validChildRow,
            school,
            class: '',
            cohort: '',
          }),
        ).toThrow();
      },
    );

    it.prop({ _class: nonEmptyString })(
      'rejects rows w/ class but no school',
      ({ _class }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...validChildRow,
            school: '',
            class: _class,
            cohort: '',
          }),
        ).toThrow();
      },
    );

    it.prop({
      school: nonEmptyString,
      _class: nonEmptyString,
      cohort: nonEmptyString,
    })(
      'rejects rows w/ both school+class and cohort',
      ({ school, _class, cohort }) => {
        expect(() =>
          UserCsvRowBase.parse({
            ...validChildRow,
            school,
            class: _class,
            cohort,
          }),
        ).toThrow();
      },
    );
  });
});

describe('CaregiverUserCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      CaregiverUserCsvRow.parse({ ...validAdultRow, userType: 'caregiver' }),
    ).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = CaregiverUserCsvRow.safeParse({
      ...validAdultRow,
      userType: 'caregiver',
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  it('rejects rows missing expected fields', () => {
    ['id', 'userType', 'school', 'class', 'cohort'].forEach((key) => {
      expect(() =>
        CaregiverUserCsvRow.parse({
          ...validAdultRow,
          userType: 'caregiver',
          [key]: undefined,
        }),
      ).toThrow();
    });
  });
});

describe('ChildUserCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() => ChildUserCsvRow.parse({ ...validChildRow })).not.toThrow();
  });

  describe('month validation', () => {
    it.prop({ month: fc.integer({ min: 1, max: 12 }).map(String) })(
      'accepts valid months (1-12)',
      ({ month }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, month }),
        ).not.toThrow();
      },
    );

    it.prop({
      month: fc.integer({ min: Number.MIN_SAFE_INTEGER, max: 0 }).map(String),
    })('rejects months below 1', ({ month }) => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, month }),
      ).toThrow();
    });

    it.prop({
      month: fc.integer({ min: 13, max: Number.MAX_SAFE_INTEGER }).map(String),
    })('rejects months above 12', ({ month }) => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, month }),
      ).toThrow();
    });

    it.prop({ month: nonString })('rejects non-strings', ({ month }) => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, month }),
      ).toThrow();
    });

    it.prop({ month: nonIntegerNumber })(
      'rejects non-integer numbers',
      ({ month }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, month }),
        ).toThrow();
      },
    );

    it.prop({ month: nonNumberString })(
      'rejects non-number strings',
      ({ month }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, month }),
        ).toThrow();
      },
    );
  });

  describe('year validation', () => {
    it.prop({ year: fc.integer({ min: 1000, max: 9999 }).map(String) })(
      'accepts valid years (1000-9999)',
      ({ year }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, year }),
        ).not.toThrow();
      },
    );

    it.prop({
      year: fc.integer({ min: Number.MIN_SAFE_INTEGER, max: 999 }).map(String),
    })('rejects years below 1000', ({ year }) => {
      expect(() => ChildUserCsvRow.parse({ ...validChildRow, year })).toThrow();
    });

    it.prop({
      year: fc
        .integer({ min: 10000, max: Number.MAX_SAFE_INTEGER })
        .map(String),
    })('rejects years above 9999', ({ year }) => {
      expect(() => ChildUserCsvRow.parse({ ...validChildRow, year })).toThrow();
    });

    it.prop({ year: nonIntegerNumber })(
      'rejects non-integer numbers',
      ({ year }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, year }),
        ).toThrow();
      },
    );

    it.prop({ year: nonNumberString })(
      'rejects non-number strings',
      ({ year }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, year }),
        ).toThrow();
      },
    );
  });

  describe('caregiverId validation', () => {
    it('accepts an empty caregiverId', () => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, caregiverId: '' }),
      ).not.toThrow();
    });

    it.prop({ parts: nonEmptyStringArray })(
      'accepts a comma-separated string and parses it into an array',
      ({ parts }) => {
        const result = ChildUserCsvRow.safeParse({
          ...validChildRow,
          caregiverId: parts.join(','),
        });
        expect(result.success).toBe(true);
        expect(result.data?.caregiverId).toEqual(parts);
      },
    );

    it.prop({
      caregiverId: nonString,
    })('rejects non-strings', ({ caregiverId }) => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, caregiverId }),
      ).toThrow();
    });
  });

  describe('teacherId validation', () => {
    it('accepts an empty teacherId', () => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, teacherId: '' }),
      ).not.toThrow();
    });

    it.prop({ parts: nonEmptyStringArray })(
      'accepts a comma-separated string and parses it into an array',
      ({ parts }) => {
        const result = ChildUserCsvRow.safeParse({
          ...validChildRow,
          teacherId: parts.join(','),
        });
        expect(result.success).toBe(true);
        expect(result.data?.teacherId).toEqual(parts);
      },
    );

    it.prop({
      teacherId: nonString,
    })('rejects non-strings', ({ teacherId }) => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, teacherId }),
      ).toThrow();
    });
  });

  describe('group validation', () => {
    it.prop({ school: nonEmptyString, _class: nonEmptyString })(
      'accepts a row with exactly one school and one class',
      ({ school, _class }) => {
        expect(() =>
          ChildUserCsvRow.parse({
            ...validChildRow,
            school,
            class: _class,
            cohort: '',
          }),
        ).not.toThrow();
      },
    );

    it.prop({ cohort: nonEmptyString })(
      'accepts a row with exactly one cohort',
      ({ cohort }) => {
        expect(() =>
          ChildUserCsvRow.parse({
            ...validChildRow,
            school: '',
            class: '',
            cohort,
          }),
        ).not.toThrow();
      },
    );

    it.prop({
      schools: fc.array(nonEmptyString, { minLength: 2 }),
      _class: nonEmptyString,
    })('rejects rows w/ multiple schools', ({ schools, _class }) => {
      expect(() =>
        ChildUserCsvRow.parse({
          ...validChildRow,
          school: schools.join(','),
          class: _class,
          cohort: '',
        }),
      ).toThrow();
    });

    it.prop({
      school: nonEmptyString,
      classes: fc.array(nonEmptyString, { minLength: 2 }),
    })('rejects rows w/ multiple classes', ({ school, classes }) => {
      expect(() =>
        ChildUserCsvRow.parse({
          ...validChildRow,
          school,
          class: classes.join(','),
          cohort: '',
        }),
      ).toThrow();
    });

    it.prop({ cohorts: fc.array(nonEmptyString, { minLength: 2 }) })(
      'rejects a row with multiple cohorts',
      ({ cohorts }) => {
        expect(() =>
          ChildUserCsvRow.parse({
            ...validChildRow,
            school: '',
            class: '',
            cohort: cohorts.join(','),
          }),
        ).toThrow();
      },
    );
  });
});

describe('TeacherUserCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      TeacherUserCsvRow.parse({ ...validAdultRow, userType: 'teacher' }),
    ).not.toThrow();
  });
});

describe('UserCsvSchema', () => {
  it('accepts valid rows', () => {
    expect(() =>
      UserCsvSchema.parse([
        { ...validChildRow },
        { ...validAdultRow, userType: 'caregiver' },
        { ...validAdultRow, userType: 'teacher' },
      ]),
    ).not.toThrow();
  });

  it('rejects a row with undefined userType', () => {
    expect(() =>
      UserCsvSchema.parse([{ ...validChildRow, userType: undefined }]),
    ).toThrow();
  });
});
