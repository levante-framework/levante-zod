import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import {
  CaregiverLinkUsersCsvRow,
  ChildLinkUsersCsvRow,
  LinkUsersCsvHeaderSchema,
  LinkUsersCsvRowBase,
  LinkUsersCsvSchema,
  REQUIRED_LINK_USERS_CSV_HEADERS,
  TeacherLinkUsersCsvRow,
} from './link-users-csv';
import { combineUsersCsvIssues } from './util';

/** Arbitrary: a non-array value */
const $nonArray = fc.anything().filter((v) => !Array.isArray(v));

/** Arbitrary: a non-string value */
const $nonString = fc.anything().filter((v) => typeof v !== 'string');

/** Arbitrary: a non-empty string (NB: trim-stable so it survives trimming) */
const $nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim() === s);

/** Arbitrary: a non-empty array of trim-stable, comma-free non-empty strings
 *  (i.e., each survives ListableString parsing as exactly one part) */
const $nonEmptyStringArray = fc.array(
  $nonEmptyString.filter((s) => !s.includes(',')),
  { minLength: 1 },
);

/** Fixture: a valid caregiver/teacher row to derive test fixtures from */
const $validAdultRow = {
  id: 'user-1',
  userType: undefined, // NB: must be defined by the test case
  caregiverId: '',
  teacherId: '',
  uid: 'uid-1',
};

/** Fixture: a valid child row to derive test fixtures from */
const $validChildRow = {
  id: 'user-1',
  userType: 'child',
  caregiverId: 'caregiver-1',
  teacherId: 'teacher-1',
  uid: 'uid-1',
};

describe('LinkUsersCsvHeaderSchema', () => {
  it('accepts an array containing all required headers', () => {
    expect(
      LinkUsersCsvHeaderSchema.parse([...REQUIRED_LINK_USERS_CSV_HEADERS]),
    ).toEqual([...REQUIRED_LINK_USERS_CSV_HEADERS]);
  });

  it('accepts extra headers beyond the required set', () => {
    expect(
      LinkUsersCsvHeaderSchema.parse([
        ...REQUIRED_LINK_USERS_CSV_HEADERS,
        'foo',
      ]),
    ).toEqual([...REQUIRED_LINK_USERS_CSV_HEADERS, 'foo']);
  });

  it.prop({ v: $nonArray })('rejects non-arrays', ({ v }) => {
    const result = LinkUsersCsvHeaderSchema.safeParse(v);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(1);
    expect(result.error!.issues[0].code).toEqual('invalid_type');
    expect(result.error!.issues[0].path).toEqual([]);
  });

  it.prop({ v: $nonString })(
    'rejects arrays containing non-string elements',
    ({ v }) => {
      const result = LinkUsersCsvHeaderSchema.safeParse([
        ...REQUIRED_LINK_USERS_CSV_HEADERS,
        v,
        v,
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(2);
      result.error!.issues.forEach((issue, idx) => {
        expect(issue.code).toEqual('invalid_type');
        expect(issue.path).toEqual([
          REQUIRED_LINK_USERS_CSV_HEADERS.length + idx,
        ]);
      });
    },
  );

  REQUIRED_LINK_USERS_CSV_HEADERS.forEach((header) => {
    it(`rejects headers missing "${header}"`, () => {
      const withoutHeader = REQUIRED_LINK_USERS_CSV_HEADERS.filter(
        (h) => h !== header,
      );
      const result = LinkUsersCsvHeaderSchema.safeParse(withoutHeader);
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
    const result = LinkUsersCsvHeaderSchema.safeParse([]);
    expect(result.success).toBe(false);
    expect(result.error!.issues.length).toBe(
      REQUIRED_LINK_USERS_CSV_HEADERS.length,
    );
    result.error!.issues.forEach((issue, idx) => {
      expect(issue.code).toEqual('custom');
      expect(issue.message).toEqual(`Missing required header`);
      expect(issue.path).toEqual([REQUIRED_LINK_USERS_CSV_HEADERS[idx]]);
    });
  });
});

describe('LinkUsersCsvRowBase', () => {
  it('accepts a valid row', () => {
    expect(() => LinkUsersCsvRowBase.parse($validAdultRow)).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = LinkUsersCsvRowBase.safeParse({
      ...$validAdultRow,
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('id validation', () => {
    it.prop({ id: $nonEmptyString })('accepts non-empty strings', ({ id }) => {
      expect(() =>
        LinkUsersCsvRowBase.parse({ ...$validAdultRow, id }),
      ).not.toThrow();
    });

    it.prop({ id: $nonEmptyString })('trims whitespace', ({ id }) => {
      const result = LinkUsersCsvRowBase.safeParse({
        ...$validAdultRow,
        id: ` ${id}  `,
      });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(id);
    });

    it('rejects an empty string', () => {
      const result = LinkUsersCsvRowBase.safeParse({
        ...$validAdultRow,
        id: '',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Required');
      expect(result.error!.issues[0].path).toEqual(['id']);
    });

    it('rejects a whitespace-only string', () => {
      const result = LinkUsersCsvRowBase.safeParse({
        ...$validAdultRow,
        id: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Required');
      expect(result.error!.issues[0].path).toEqual(['id']);
    });

    it.prop({ id: $nonString })('rejects non-strings', ({ id }) => {
      const result = LinkUsersCsvRowBase.safeParse({ ...$validAdultRow, id });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].path).toEqual(['id']);
    });
  });

  describe('uid validation', () => {
    it.prop({ uid: $nonEmptyString })(
      'accepts non-empty strings',
      ({ uid }) => {
        expect(() =>
          LinkUsersCsvRowBase.parse({ ...$validAdultRow, uid }),
        ).not.toThrow();
      },
    );

    it.prop({ uid: $nonEmptyString })('trims whitespace', ({ uid }) => {
      const result = LinkUsersCsvRowBase.safeParse({
        ...$validAdultRow,
        uid: ` ${uid}  `,
      });
      expect(result.success).toBe(true);
      expect(result.data?.uid).toBe(uid);
    });

    it('rejects an empty string', () => {
      const result = LinkUsersCsvRowBase.safeParse({
        ...$validAdultRow,
        uid: '',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Required');
      expect(result.error!.issues[0].path).toEqual(['uid']);
    });

    it('rejects a whitespace-only string', () => {
      const result = LinkUsersCsvRowBase.safeParse({
        ...$validAdultRow,
        uid: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('too_small');
      expect(result.error!.issues[0].message).toEqual('Required');
      expect(result.error!.issues[0].path).toEqual(['uid']);
    });

    it.prop({ uid: $nonString })('rejects non-strings', ({ uid }) => {
      const result = LinkUsersCsvRowBase.safeParse({ ...$validAdultRow, uid });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_type');
      expect(result.error!.issues[0].path).toEqual(['uid']);
    });
  });
});

describe('CaregiverLinkUsersCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      CaregiverLinkUsersCsvRow.parse({
        ...$validAdultRow,
        userType: 'caregiver',
      }),
    ).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = CaregiverLinkUsersCsvRow.safeParse({
      ...$validAdultRow,
      userType: 'caregiver',
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('userType validation', () => {
    it.prop({ userType: $nonString })('rejects non-strings', ({ userType }) => {
      const result = CaregiverLinkUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });

    it('rejects a non-caregiver userType', () => {
      const result = CaregiverLinkUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType: 'child',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });
  });

  describe('caregiverId validation', () => {
    it('accepts an empty string and parses it into an empty array', () => {
      const result = CaregiverLinkUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType: 'caregiver',
        caregiverId: '',
      });
      expect(result.success).toBe(true);
      expect(result.data?.caregiverId).toEqual([]);
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'rejects a non-empty caregiverId',
      ({ parts }) => {
        const result = CaregiverLinkUsersCsvRow.safeParse({
          ...$validAdultRow,
          userType: 'caregiver',
          caregiverId: parts.join(','),
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('custom');
        expect(result.error!.issues[0].message).toEqual(
          'Only child rows may have a caregiverId',
        );
        expect(result.error!.issues[0].path).toEqual(['caregiverId']);
      },
    );

    it.prop({ caregiverId: $nonString })(
      'rejects non-strings',
      ({ caregiverId }) => {
        const result = CaregiverLinkUsersCsvRow.safeParse({
          ...$validAdultRow,
          userType: 'caregiver',
          caregiverId,
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].path).toEqual(['caregiverId']);
      },
    );
  });

  describe('teacherId validation', () => {
    it('accepts an empty string and parses it into an empty array', () => {
      const result = CaregiverLinkUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType: 'caregiver',
        teacherId: '',
      });
      expect(result.success).toBe(true);
      expect(result.data?.teacherId).toEqual([]);
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'rejects a non-empty teacherId',
      ({ parts }) => {
        const result = CaregiverLinkUsersCsvRow.safeParse({
          ...$validAdultRow,
          userType: 'caregiver',
          teacherId: parts.join(','),
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('custom');
        expect(result.error!.issues[0].message).toEqual(
          'Only child rows may have a teacherId',
        );
        expect(result.error!.issues[0].path).toEqual(['teacherId']);
      },
    );

    it.prop({ teacherId: $nonString })(
      'rejects non-strings',
      ({ teacherId }) => {
        const result = CaregiverLinkUsersCsvRow.safeParse({
          ...$validAdultRow,
          userType: 'caregiver',
          teacherId,
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].path).toEqual(['teacherId']);
      },
    );
  });
});

describe('ChildLinkUsersCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      ChildLinkUsersCsvRow.parse({ ...$validChildRow }),
    ).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = ChildLinkUsersCsvRow.safeParse({
      ...$validChildRow,
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('userType validation', () => {
    it.prop({ userType: $nonString })('rejects non-strings', ({ userType }) => {
      const result = ChildLinkUsersCsvRow.safeParse({
        ...$validChildRow,
        userType,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });

    it('rejects a non-child userType', () => {
      const result = ChildLinkUsersCsvRow.safeParse({
        ...$validChildRow,
        userType: 'caregiver',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });
  });

  describe('caregiverId validation', () => {
    it('accepts an empty string and parses it into an empty array', () => {
      const result = ChildLinkUsersCsvRow.safeParse({
        ...$validChildRow,
        userType: 'child',
        caregiverId: '',
      });
      expect(result.success).toBe(true);
      expect(result.data?.caregiverId).toEqual([]);
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'accepts a comma-separated string and parses it into an array',
      ({ parts }) => {
        const result = ChildLinkUsersCsvRow.safeParse({
          ...$validChildRow,
          userType: 'child',
          caregiverId: parts.join(','),
        });
        expect(result.success).toBe(true);
        expect(result.data?.caregiverId).toEqual(parts);
      },
    );

    it.prop({ caregiverId: $nonString })(
      'rejects non-strings',
      ({ caregiverId }) => {
        const result = ChildLinkUsersCsvRow.safeParse({
          ...$validChildRow,
          userType: 'child',
          caregiverId,
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].path).toEqual(['caregiverId']);
      },
    );
  });

  describe('teacherId validation', () => {
    it('accepts an empty string and parses it into an empty array', () => {
      const result = ChildLinkUsersCsvRow.safeParse({
        ...$validChildRow,
        userType: 'child',
        teacherId: '',
      });
      expect(result.success).toBe(true);
      expect(result.data?.teacherId).toEqual([]);
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'accepts a comma-separated string and parses it into an array',
      ({ parts }) => {
        const result = ChildLinkUsersCsvRow.safeParse({
          ...$validChildRow,
          userType: 'child',
          teacherId: parts.join(','),
        });
        expect(result.success).toBe(true);
        expect(result.data?.teacherId).toEqual(parts);
      },
    );

    it.prop({ teacherId: $nonString })(
      'rejects non-strings',
      ({ teacherId }) => {
        const result = ChildLinkUsersCsvRow.safeParse({
          ...$validChildRow,
          userType: 'child',
          teacherId,
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].path).toEqual(['teacherId']);
      },
    );
  });
});

describe('TeacherLinkUsersCsvRow', () => {
  it('accepts a valid row', () => {
    expect(() =>
      TeacherLinkUsersCsvRow.parse({
        ...$validAdultRow,
        userType: 'teacher',
      }),
    ).not.toThrow();
  });

  it('keeps loose properties', () => {
    const result = TeacherLinkUsersCsvRow.safeParse({
      ...$validAdultRow,
      userType: 'teacher',
      site: 'site-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.site).toEqual('site-1');
  });

  describe('userType validation', () => {
    it.prop({ userType: $nonString })('rejects non-strings', ({ userType }) => {
      const result = TeacherLinkUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType,
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });

    it('rejects a non-teacher userType', () => {
      const result = TeacherLinkUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType: 'child',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('invalid_value');
      expect(result.error!.issues[0].path).toEqual(['userType']);
    });
  });

  describe('caregiverId validation', () => {
    it('accepts an empty string and parses it into an empty array', () => {
      const result = TeacherLinkUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType: 'teacher',
        caregiverId: '',
      });
      expect(result.success).toBe(true);
      expect(result.data?.caregiverId).toEqual([]);
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'rejects a non-empty caregiverId',
      ({ parts }) => {
        const result = TeacherLinkUsersCsvRow.safeParse({
          ...$validAdultRow,
          userType: 'teacher',
          caregiverId: parts.join(','),
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('custom');
        expect(result.error!.issues[0].message).toEqual(
          'Only child rows may have a caregiverId',
        );
        expect(result.error!.issues[0].path).toEqual(['caregiverId']);
      },
    );

    it.prop({ caregiverId: $nonString })(
      'rejects non-strings',
      ({ caregiverId }) => {
        const result = TeacherLinkUsersCsvRow.safeParse({
          ...$validAdultRow,
          userType: 'teacher',
          caregiverId,
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].path).toEqual(['caregiverId']);
      },
    );
  });

  describe('teacherId validation', () => {
    it('accepts an empty string and parses it into an empty array', () => {
      const result = TeacherLinkUsersCsvRow.safeParse({
        ...$validAdultRow,
        userType: 'teacher',
        teacherId: '',
      });
      expect(result.success).toBe(true);
      expect(result.data?.teacherId).toEqual([]);
    });

    it.prop({ parts: $nonEmptyStringArray })(
      'rejects a non-empty teacherId',
      ({ parts }) => {
        const result = TeacherLinkUsersCsvRow.safeParse({
          ...$validAdultRow,
          userType: 'teacher',
          teacherId: parts.join(','),
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('custom');
        expect(result.error!.issues[0].message).toEqual(
          'Only child rows may have a teacherId',
        );
        expect(result.error!.issues[0].path).toEqual(['teacherId']);
      },
    );

    it.prop({ teacherId: $nonString })(
      'rejects non-strings',
      ({ teacherId }) => {
        const result = TeacherLinkUsersCsvRow.safeParse({
          ...$validAdultRow,
          userType: 'teacher',
          teacherId,
        });
        expect(result.success).toBe(false);
        expect(result.error!.issues.length).toBe(1);
        expect(result.error!.issues[0].code).toEqual('invalid_type');
        expect(result.error!.issues[0].path).toEqual(['teacherId']);
      },
    );
  });
});

describe('LinkUsersCsvSchema', () => {
  it('accepts valid rows', () => {
    expect(() =>
      LinkUsersCsvSchema.parse([
        { ...$validAdultRow, id: 'caregiver-1', userType: 'caregiver' },
        {
          ...$validAdultRow,
          id: 'user-2',
          userType: 'child',
          caregiverId: 'caregiver-1',
          teacherId: 'teacher-1',
        },
        { ...$validAdultRow, id: 'teacher-1', userType: 'teacher' },
      ]),
    ).not.toThrow();
  });

  it('rejects a row w/ an unknown userType', () => {
    const result = LinkUsersCsvSchema.safeParse([
      { ...$validAdultRow, userType: 'unknown' },
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
    const result = LinkUsersCsvSchema.safeParse([
      { ...$validAdultRow, userType: undefined },
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
    const result = LinkUsersCsvSchema.safeParse([
      { ...$validAdultRow, id: 'user-1', userType: 'caregiver' },
      { ...$validAdultRow, id: '  user-1  ', userType: 'caregiver' },
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

  describe('integrates w/ hasResolvableLinks', () => {
    it('accepts child rows whose links resolve to caregiver/teacher rows', () => {
      expect(() =>
        LinkUsersCsvSchema.parse([
          { ...$validAdultRow, id: 'caregiver-1', userType: 'caregiver' },
          { ...$validAdultRow, id: 'teacher-1', userType: 'teacher' },
          {
            ...$validChildRow,
            id: 'child-1',
            caregiverId: 'caregiver-1',
            teacherId: 'teacher-1',
          },
        ]),
      ).not.toThrow();
    });

    it('accepts a child row referencing multiple caregivers/teachers', () => {
      expect(() =>
        LinkUsersCsvSchema.parse([
          { ...$validAdultRow, id: 'caregiver-1', userType: 'caregiver' },
          { ...$validAdultRow, id: 'caregiver-2', userType: 'caregiver' },
          { ...$validAdultRow, id: 'teacher-1', userType: 'teacher' },
          {
            ...$validChildRow,
            id: 'child-1',
            caregiverId: 'caregiver-1,caregiver-2',
            teacherId: 'teacher-1',
          },
        ]),
      ).not.toThrow();
    });

    it('accepts a child row with no links', () => {
      expect(() =>
        LinkUsersCsvSchema.parse([
          {
            ...$validChildRow,
            id: 'child-1',
            caregiverId: '',
            teacherId: '',
          },
        ]),
      ).not.toThrow();
    });

    it('rejects a child row referencing a non-existent caregiverId', () => {
      const result = LinkUsersCsvSchema.safeParse([
        { ...$validAdultRow, id: 'caregiver-1', userType: 'caregiver' },
        {
          ...$validChildRow,
          id: 'child-1',
          caregiverId: 'missing',
          teacherId: '',
        },
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('custom');
      expect(result.error!.issues[0].message).toEqual(
        'Must match the id of a caregiver row',
      );
      expect(result.error!.issues[0].path).toEqual([1, 'caregiverId']);
    });

    it('rejects a child row referencing a non-existent teacherId', () => {
      const result = LinkUsersCsvSchema.safeParse([
        { ...$validAdultRow, id: 'teacher-1', userType: 'teacher' },
        {
          ...$validChildRow,
          id: 'child-1',
          caregiverId: '',
          teacherId: 'missing',
        },
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('custom');
      expect(result.error!.issues[0].message).toEqual(
        'Must match the id of a teacher row',
      );
      expect(result.error!.issues[0].path).toEqual([1, 'teacherId']);
    });

    it('does not resolve a caregiverId against a teacher row (and vice versa)', () => {
      const result = LinkUsersCsvSchema.safeParse([
        { ...$validAdultRow, id: 'teacher-1', userType: 'teacher' },
        { ...$validAdultRow, id: 'caregiver-1', userType: 'caregiver' },
        {
          ...$validChildRow,
          id: 'child-1',
          caregiverId: 'teacher-1', // exists, but as a teacher
          teacherId: 'caregiver-1', // exists, but as a caregiver
        },
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(2);
      expect(result.error!.issues.map((i) => i.path)).toEqual([
        [2, 'caregiverId'],
        [2, 'teacherId'],
      ]);
    });

    it('emits one issue per field regardless of how many refs are unresolved', () => {
      const result = LinkUsersCsvSchema.safeParse([
        { ...$validAdultRow, id: 'caregiver-1', userType: 'caregiver' },
        {
          ...$validChildRow,
          id: 'child-1',
          caregiverId: 'caregiver-1,missing-1,missing-2',
          teacherId: '',
        },
      ]);
      expect(result.success).toBe(false);
      expect(result.error!.issues.length).toBe(1);
      expect(result.error!.issues[0].code).toEqual('custom');
      expect(result.error!.issues[0].message).toEqual(
        'Must match the id of a caregiver row',
      );
      expect(result.error!.issues[0].path).toEqual([1, 'caregiverId']);
    });
  });

  it('integrates w/ combineUsersCsvIssues', () => {
    const parseResult = LinkUsersCsvSchema.safeParse([
      { ...$validAdultRow, id: '', userType: 'caregiver' }, // row 0: id required
      { ...$validAdultRow, id: '', userType: 'teacher' }, // row 1: id required (same message)
      { ...$validAdultRow, id: 'user-3', userType: 'caregiver', uid: '' }, // row 2: uid required
    ]);
    expect(parseResult.success).toBe(false);
    const combined = combineUsersCsvIssues(parseResult.error!.issues);
    expect(combined).toEqual([
      { message: 'id: Required', rowNums: [2, 3] },
      { message: 'uid: Required', rowNums: [4] },
      { message: 'id: Must be unique', rowNums: [2, 3] },
    ]);
  });
});
