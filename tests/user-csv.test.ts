import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import {
  CaregiverUserCsvRow,
  ChildUserCsvRow,
  ListableString,
  TeacherUserCsvRow,
  UserCsv,
  UserCsvRowBase,
} from '../src/user-csv';

/** Arbitrary: a non-empty string (NB: trim-stable and comma-free so it
 *  produces exactly one ListableString part) */
const nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim() === s && !s.includes(','));

/** Arbitrary: a non-empty array of non-empty strings */
const nonEmptyStringArray = fc.array(nonEmptyString, { minLength: 1 });

/** Arbitrary: a non-string value */
const nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Arbitrary: a non-number value */
const nonNumber = fc.anything().filter((v) => typeof v !== 'number');

/** Arbitrary: a non-integer number value */
const nonIntegerNumber = fc.float().filter((n) => !Number.isInteger(n));

/** Fixture: a valid caregiver/teacher row to derive test fixtures from */
const validAdultRow = {
  id: 'user-1',
  userType: undefined, // NB: must be defined by the test case
  month: undefined,
  year: undefined,
  caregiverId: undefined,
  teacherId: undefined,
  site: 'site-1',
  school: 'school-1',
  class: 'class-1',
  cohort: undefined,
};

/** Fixture: a valid child row to derive test fixtures from */
const validChildRow = {
  id: 'user-1',
  userType: 'child',
  month: 1,
  year: 2020,
  caregiverId: 'caregiver-1',
  teacherId: 'teacher-1',
  site: 'site-1',
  school: 'school-1',
  class: 'class-1',
  cohort: undefined,
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

  it.prop({ v: nonString })('rejects any non-string input', ({ v }) => {
    expect(() => ListableString.parse(v)).toThrow();
  });
});

describe('UserCsvRowBase', () => {
  it('accepts a valid row', () => {
    expect(() => UserCsvRowBase.parse(validChildRow)).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = UserCsvRowBase.safeParse({
      ...validChildRow,
      unexpected: 'value',
    });
    expect(result.success).toBe(true);
    expect(result.data?.unexpected).toEqual('value');
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
          cohort: undefined,
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
            cohort: undefined,
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
            school: undefined,
            class: undefined,
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
            school: undefined,
            class: undefined,
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
          school: undefined,
          class: undefined,
          cohort: undefined,
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
            class: undefined,
            cohort: undefined,
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
            school: undefined,
            class: _class,
            cohort: undefined,
          }),
        ).toThrow();
      },
    );

    it('rejects a row w/ empty string group', () => {
      expect(() =>
        UserCsvRowBase.parse({
          ...validChildRow,
          school: '',
          class: '',
          cohort: '',
        }),
      ).toThrow();
    });

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
      unexpected: 'value',
    });
    expect(result.success).toBe(true);
    expect(result.data?.unexpected).toEqual('value');
  });
});

describe('ChildUserCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() => ChildUserCsvRow.parse({ ...validChildRow })).not.toThrow();
  });

  describe('month validation', () => {
    it.prop({ month: fc.integer({ min: 1, max: 12 }) })(
      'accepts valid months (1-12)',
      ({ month }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, month }),
        ).not.toThrow();
      },
    );

    it.prop({ month: fc.integer({ min: Number.MIN_SAFE_INTEGER, max: 0 }) })(
      'rejects months below 1',
      ({ month }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, month }),
        ).toThrow();
      },
    );

    it.prop({ month: fc.integer({ min: 13, max: Number.MAX_SAFE_INTEGER }) })(
      'rejects months above 12',
      ({ month }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, month }),
        ).toThrow();
      },
    );

    it.prop({ month: nonIntegerNumber })(
      'rejects non-integer numbers',
      ({ month }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, month }),
        ).toThrow();
      },
    );

    it.prop({ month: nonNumber })('rejects non-numbers', ({ month }) => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, month }),
      ).toThrow();
    });
  });

  describe('year validation', () => {
    it.prop({ year: fc.integer({ min: 1000, max: 9999 }) })(
      'accepts valid years (1000-9999)',
      ({ year }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, year }),
        ).not.toThrow();
      },
    );

    it.prop({ year: fc.integer({ min: Number.MIN_SAFE_INTEGER, max: 999 }) })(
      'rejects years below 1000',
      ({ year }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, year }),
        ).toThrow();
      },
    );

    it.prop({ year: fc.integer({ min: 10000, max: Number.MAX_SAFE_INTEGER }) })(
      'rejects years above 9999',
      ({ year }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, year }),
        ).toThrow();
      },
    );

    it.prop({ year: nonIntegerNumber })(
      'rejects non-integer numbers',
      ({ year }) => {
        expect(() =>
          ChildUserCsvRow.parse({ ...validChildRow, year }),
        ).toThrow();
      },
    );

    it.prop({ year: nonNumber })('rejects non-numbers', ({ year }) => {
      expect(() => ChildUserCsvRow.parse({ ...validChildRow, year })).toThrow();
    });
  });

  describe('caregiverId validation', () => {
    it('accepts undefined caregiverId', () => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, caregiverId: undefined }),
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
      caregiverId: nonString.filter((v) => v !== undefined),
    })('rejects non-string, non-undefined values', ({ caregiverId }) => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, caregiverId }),
      ).toThrow();
    });
  });

  describe('teacherId validation', () => {
    it('accepts undefined teacherId', () => {
      expect(() =>
        ChildUserCsvRow.parse({ ...validChildRow, teacherId: undefined }),
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
      teacherId: nonString.filter((v) => v !== undefined),
    })('rejects non-string, non-undefined values', ({ teacherId }) => {
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
            cohort: undefined,
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
            school: undefined,
            class: undefined,
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
          cohort: undefined,
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
          cohort: undefined,
        }),
      ).toThrow();
    });

    it.prop({ cohorts: fc.array(nonEmptyString, { minLength: 2 }) })(
      'rejects a row with multiple cohorts',
      ({ cohorts }) => {
        expect(() =>
          ChildUserCsvRow.parse({
            ...validChildRow,
            school: undefined,
            class: undefined,
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

describe('UserCsv', () => {
  it('accepts valid rows', () => {
    expect(() =>
      UserCsv.parse([
        { ...validChildRow },
        { ...validAdultRow, userType: 'caregiver' },
        { ...validAdultRow, userType: 'teacher' },
      ]),
    ).not.toThrow();
  });
});
