import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import {
  AddUsersCsvHeaderSchema,
  AddUsersCsvRowBase,
  AddUsersCsvSchema,
  CaregiverAddUsersCsvRow,
  CHILD_YEAR_MAX,
  CHILD_YEAR_MIN,
  ChildAddUsersCsvRow,
  REQUIRED_ADD_USERS_CSV_HEADERS,
  TeacherAddUsersCsvRow,
} from './add-users-csv';
import { combineUsersCsvIssues } from './util';

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

describe('AddUsersCsvHeaderSchema', () => {
  it('accepts an array containing all required headers', () => {
    expect(
      AddUsersCsvHeaderSchema.parse([...REQUIRED_ADD_USERS_CSV_HEADERS]),
    ).toEqual([...REQUIRED_ADD_USERS_CSV_HEADERS]);
  });

  it('accepts extra headers beyond the required set', () => {
    expect(
      AddUsersCsvHeaderSchema.parse([...REQUIRED_ADD_USERS_CSV_HEADERS, 'foo']),
    ).toEqual([...REQUIRED_ADD_USERS_CSV_HEADERS, 'foo']);
  });

  it.prop({ v: $nonArray })('rejects non-arrays', ({ v }) => {
    const result = AddUsersCsvHeaderSchema.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_type');
    expect(result.error!.issues[0].path).toEqual([]);
  });

  it.prop({ v: $nonString })(
    'rejects arrays containing non-string elements',
    ({ v }) => {
      const result = AddUsersCsvHeaderSchema.safeParse([
        ...REQUIRED_ADD_USERS_CSV_HEADERS,
        v,
        v,
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(2);
      result.error!.issues.forEach((issue, idx) => {
        expect(issue.code).toEqual('invalid_type');
        expect(issue.path).toEqual([
          REQUIRED_ADD_USERS_CSV_HEADERS.length + idx,
        ]);
      });
    },
  );

  REQUIRED_ADD_USERS_CSV_HEADERS.forEach((header) => {
    it(`rejects headers missing "${header}"`, () => {
      const withoutHeader = REQUIRED_ADD_USERS_CSV_HEADERS.filter(
        (h) => h !== header,
      );
      const result = AddUsersCsvHeaderSchema.safeParse(withoutHeader);
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
    const result = AddUsersCsvHeaderSchema.safeParse([]);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(
      REQUIRED_ADD_USERS_CSV_HEADERS.length,
    );
    result.error!.issues.forEach((issue, idx) => {
      expect(issue.code).toEqual('custom');
      expect(issue.message).toEqual(`Missing required header`);
      expect(issue.path).toEqual([REQUIRED_ADD_USERS_CSV_HEADERS[idx]]);
    });
  });
});

describe('AddUsersCsvRowBase', () => {
  it('accepts a valid row', () => {
    expect(() => AddUsersCsvRowBase.parse($validChildRow)).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = AddUsersCsvRowBase.safeParse({
      ...$validChildRow,
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('id validation', () => {
    it.prop({ id: $nonEmptyString })('accepts non-empty strings', ({ id }) => {
      expect(() =>
        AddUsersCsvRowBase.parse({ ...$validChildRow, id }),
      ).not.toThrow();
    });

    it.prop({ id: $nonEmptyString })('trims whitespace', ({ id }) => {
      const result = AddUsersCsvRowBase.safeParse({
        ...$validChildRow,
        id: ` ${id}  `,
      });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(id);
    });

    it('rejects an empty string', () => {
      const result = AddUsersCsvRowBase.safeParse({
        ...$validChildRow,
        id: '',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Required');
      expect(result.error!.issues[0].path).toEqual(['id']);
    });

    it('rejects a whitespace-only string', () => {
      const result = AddUsersCsvRowBase.safeParse({
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
      const result = AddUsersCsvRowBase.safeParse({ ...$validChildRow, id });
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
        AddUsersCsvRowBase.parse({
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
          AddUsersCsvRowBase.parse({
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
          AddUsersCsvRowBase.parse({
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
          AddUsersCsvRowBase.parse({
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
      const result = AddUsersCsvRowBase.safeParse({
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
        const result = AddUsersCsvRowBase.safeParse({
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
        const result = AddUsersCsvRowBase.safeParse({
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
        const result = AddUsersCsvRowBase.safeParse({
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

    it.prop({ school: $nonEmptyString, cohort: $nonEmptyString })(
      'rejects rows w/ a stray school (no class) and cohort',
      ({ school, cohort }) => {
        const result = AddUsersCsvRowBase.safeParse({
          ...$validChildRow,
          school,
          class: '',
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

    it.prop({ _class: $nonEmptyString, cohort: $nonEmptyString })(
      'rejects rows w/ a stray class (no school) and cohort',
      ({ _class, cohort }) => {
        const result = AddUsersCsvRowBase.safeParse({
          ...$validChildRow,
          school: '',
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

describe('CaregiverAddUsersCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      CaregiverAddUsersCsvRow.parse({
        ...$validAdultRow,
        userType: 'caregiver',
      }),
    ).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = CaregiverAddUsersCsvRow.safeParse({
      ...$validAdultRow,
      userType: 'caregiver',
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('userType validation', () => {
    it.prop({ userType: $nonString })('rejects non-strings', ({ userType }) => {
      const result = CaregiverAddUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });

    it('rejects a non-caregiver userType', () => {
      const result = CaregiverAddUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType: 'child',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });
  });

  // NB: locks in that the base group refinement survives `.extend()`
  it('applies the base group rule (rejects a row w/ no group)', () => {
    const result = CaregiverAddUsersCsvRow.safeParse({
      ...$validAdultRow,
      userType: 'caregiver',
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
});

describe('ChildAddUsersCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      ChildAddUsersCsvRow.parse({ ...$validChildRow }),
    ).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = ChildAddUsersCsvRow.safeParse({
      ...$validChildRow,
      userType: 'child',
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('userType validation', () => {
    it.prop({ userType: $nonString })('rejects non-strings', ({ userType }) => {
      const result = ChildAddUsersCsvRow.safeParse({
        ...$validChildRow,
        userType,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });

    it('rejects a non-child userType', () => {
      const result = ChildAddUsersCsvRow.safeParse({
        ...$validChildRow,
        userType: 'caregiver',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });
  });

  describe('month validation', () => {
    it.prop({ month: fc.integer({ min: 1, max: 12 }).map(String) })(
      'accepts valid months (1-12)',
      ({ month }) => {
        expect(() =>
          ChildAddUsersCsvRow.parse({ ...$validChildRow, month }),
        ).not.toThrow();
      },
    );

    it('rejects an empty string', () => {
      const result = ChildAddUsersCsvRow.safeParse({
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
      const result = ChildAddUsersCsvRow.safeParse({
        ...$validChildRow,
        month,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Must be >=1');
      expect(result.error!.issues[0].path).toEqual(['month']);
    });

    it.prop({
      month: fc.integer({ min: 13, max: Number.MAX_SAFE_INTEGER }).map(String),
    })('rejects months above 12', ({ month }) => {
      const result = ChildAddUsersCsvRow.safeParse({
        ...$validChildRow,
        month,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_big');
      expect(result.error!.issues[0].message).toEqual('Must be <=12');
      expect(result.error!.issues[0].path).toEqual(['month']);
    });

    it.prop({ month: $nonString })('rejects non-strings', ({ month }) => {
      const result = ChildAddUsersCsvRow.safeParse({
        ...$validChildRow,
        month,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].path).toEqual(['month']);
    });

    it.prop({ month: $nonIntegerNumber })(
      'rejects non-integer numbers',
      ({ month }) => {
        const result = ChildAddUsersCsvRow.safeParse({
          ...$validChildRow,
          month,
        });
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
        const result = ChildAddUsersCsvRow.safeParse({
          ...$validChildRow,
          month,
        });
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
        ChildAddUsersCsvRow.parse({ ...$validChildRow, year }),
      ).not.toThrow();
    });

    it('rejects an empty string', () => {
      const result = ChildAddUsersCsvRow.safeParse({
        ...$validChildRow,
        year: '',
      });
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
      const result = ChildAddUsersCsvRow.safeParse({ ...$validChildRow, year });
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
      const result = ChildAddUsersCsvRow.safeParse({ ...$validChildRow, year });
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
        const result = ChildAddUsersCsvRow.safeParse({
          ...$validChildRow,
          year,
        });
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
        const result = ChildAddUsersCsvRow.safeParse({
          ...$validChildRow,
          year,
        });
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
        ChildAddUsersCsvRow.parse({ ...$validChildRow, caregiverId: '' }),
      ).not.toThrow();
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'accepts a comma-separated string and parses it into an array',
      ({ parts }) => {
        const result = ChildAddUsersCsvRow.safeParse({
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
      const result = ChildAddUsersCsvRow.safeParse({
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
        ChildAddUsersCsvRow.parse({ ...$validChildRow, teacherId: '' }),
      ).not.toThrow();
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'accepts a comma-separated string and parses it into an array',
      ({ parts }) => {
        const result = ChildAddUsersCsvRow.safeParse({
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
      const result = ChildAddUsersCsvRow.safeParse({
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
          ChildAddUsersCsvRow.parse({
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
          ChildAddUsersCsvRow.parse({
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
      const result = ChildAddUsersCsvRow.safeParse({
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
      const result = ChildAddUsersCsvRow.safeParse({
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
        const result = ChildAddUsersCsvRow.safeParse({
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

    // NB: locks in that the base group refinement survives `.extend()`
    it.prop({
      school: $nonEmptyString,
      _class: $nonEmptyString,
      cohort: $nonEmptyString,
    })(
      'applies the base group rule (rejects both school+class and cohort)',
      ({ school, _class, cohort }) => {
        const result = ChildAddUsersCsvRow.safeParse({
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

describe('TeacherAddUsersCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      TeacherAddUsersCsvRow.parse({ ...$validAdultRow, userType: 'teacher' }),
    ).not.toThrow();
  });

  describe('userType validation', () => {
    it.prop({ userType: $nonString })('rejects non-strings', ({ userType }) => {
      const result = TeacherAddUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });

    it('rejects a non-teacher userType', () => {
      const result = TeacherAddUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType: 'child',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });
  });
});

describe('AddUsersCsvSchema', () => {
  it('accepts valid rows', () => {
    expect(() =>
      AddUsersCsvSchema.parse([
        { ...$validChildRow, id: 'user-1' },
        { ...$validAdultRow, id: 'user-2', userType: 'caregiver' },
        { ...$validAdultRow, id: 'user-3', userType: 'teacher' },
      ]),
    ).not.toThrow();
  });

  it('rejects a row w/ an unknown userType', () => {
    const result = AddUsersCsvSchema.safeParse([
      { ...$validChildRow, id: 'user-1', userType: 'unknown' },
    ]);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_union');
    expect(result.error!.issues[0].message).toEqual(
      'Must be caregiver, child, or teacher',
    );
    expect(result.error!.issues[0].path).toEqual([0, 'userType']);
  });

  it('rejects a row with undefined userType', () => {
    const result = AddUsersCsvSchema.safeParse([
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

  it('rejects rows w/ duplicate ids', () => {
    const result = AddUsersCsvSchema.safeParse([
      { ...$validChildRow, id: 'user-1' },
      { ...$validChildRow, id: '  user-1  ' },
    ]);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(2);
    result.error!.issues.forEach((issue) => {
      expect(issue.code).toEqual('custom');
      expect(issue.message).toEqual('Must be unique');
    });
    expect(result.error!.issues.map((i) => i.path)).toEqual([
      [0, 'id'],
      [1, 'id'],
    ]);
  });

  it('integrates w/ combineUsersCsvIssues', () => {
    const parseResult = AddUsersCsvSchema.safeParse([
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
    const combined = combineUsersCsvIssues(parseResult.error!.issues);
    expect(combined).toEqual([
      { message: 'id: Required', rowNums: [2, 3] },
      {
        message:
          'school|class|cohort: Must have either school and class OR cohort',
        rowNums: [4],
      },
      { message: 'id: Must be unique', rowNums: [2, 3] },
    ]);
  });
});
