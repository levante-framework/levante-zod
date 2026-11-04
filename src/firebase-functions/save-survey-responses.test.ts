import { describe, expect, it } from 'vitest';
import { SaveSurveyResponsesParamsSchema } from './save-survey-responses';

const validParams = {
  surveyResponses: {
    administrationId: 'admin-1',
    surveyData: {
      pageNo: 0,
      isGeneral: true,
      isComplete: false,
      specificId: 0,
      responses: {
        RespondentRelationship: {
          responseValue: 'bio-mother',
          responseTime: '2026-11-04T10:00:00.000Z',
        },
        skipped: null,
      },
      userType: 'parent' as const,
    },
  },
};

describe('SaveSurveyResponsesParamsSchema', () => {
  it('accepts a general page save', () => {
    expect(SaveSurveyResponsesParamsSchema.parse(validParams)).toEqual(
      validParams,
    );
  });

  it('accepts a save that omits pageNo', () => {
    const { pageNo: _pageNo, ...surveyData } =
      validParams.surveyResponses.surveyData;
    const params = {
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData,
      },
    };
    expect(SaveSurveyResponsesParamsSchema.parse(params)).toEqual(params);
  });

  it('accepts optional responseText and questionPrompt', () => {
    expect(
      SaveSurveyResponsesParamsSchema.parse({
        surveyResponses: {
          ...validParams.surveyResponses,
          surveyData: {
            ...validParams.surveyResponses.surveyData,
            responses: {
              RespondentRelationship: {
                responseValue: 'bio-mother',
                responseTime: '2026-11-04T10:00:00.000Z',
                responseText: 'Biological mother',
                questionPrompt: 'What is your relationship to the child?',
              },
            },
          },
        },
      }).surveyResponses.surveyData.responses.RespondentRelationship,
    ).toMatchObject({
      responseText: 'Biological mother',
      questionPrompt: 'What is your relationship to the child?',
    });
  });

  it('accepts and trims an optional versionId', () => {
    expect(
      SaveSurveyResponsesParamsSchema.parse({
        surveyResponses: {
          ...validParams.surveyResponses,
          surveyData: {
            ...validParams.surveyResponses.surveyData,
            versionId: '  v2  ',
          },
        },
      }).surveyResponses.surveyData.versionId,
    ).toBe('v2');
  });

  it('accepts a specific completion with a list and scalar answers', () => {
    const params = {
      surveyResponses: {
        administrationId: 'admin-1',
        surveyData: {
          pageNo: 3,
          isGeneral: false,
          isComplete: true,
          isEntireSurveyCompleted: true,
          specificId: 'child-1',
          responses: {
            TeacherGrad: {
              responseValue: ['ba', 'ma'],
              responseTime: '2026-11-04T10:00:00.000Z',
            },
            HoursOfSleepWeekday: {
              responseValue: 8,
              responseTime: '2026-11-04T10:01:00.000Z',
            },
          },
          userType: 'caregiver' as const,
        },
      },
    };
    expect(SaveSurveyResponsesParamsSchema.parse(params)).toEqual({
      ...params,
      surveyResponses: {
        ...params.surveyResponses,
        surveyData: {
          ...params.surveyResponses.surveyData,
          userType: 'parent',
        },
      },
    });
  });

  it('accepts a language-selector object and an older language list', () => {
    const params = {
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData: {
          ...validParams.surveyResponses.surveyData,
          responses: {
            ChildLanguages: {
              responseValue: {
                codes: ['en', 'other'],
                otherDescription: 'Klingon',
              },
              responseTime: '2026-11-04T10:01:00.000Z',
            },
            ChildLanguagesLegacy: {
              responseValue: ['English', 'Spanish'],
              responseTime: '2026-11-04T10:02:00.000Z',
            },
          },
        },
      },
    };
    expect(SaveSurveyResponsesParamsSchema.parse(params)).toEqual(params);
  });

  it('accepts a SurveyJS matrix object of scalars', () => {
    const params = {
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData: {
          ...validParams.surveyResponses.surveyData,
          responses: {
            HoursOfSleep: {
              responseValue: { weekday: 8, weekend: 9 },
              responseTime: '2026-11-04T10:01:00.000Z',
            },
          },
        },
      },
    };
    expect(SaveSurveyResponsesParamsSchema.parse(params)).toEqual(params);
  });

  it('rejects a matrix cell that is itself an object', () => {
    const result = SaveSurveyResponsesParamsSchema.safeParse({
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData: {
          ...validParams.surveyResponses.surveyData,
          responses: {
            HoursOfSleep: {
              responseValue: { weekday: { hours: 8 } },
              responseTime: '2026-11-04T10:01:00.000Z',
            },
          },
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        code: 'invalid_union',
        path: ['surveyResponses', 'surveyData', 'responses', 'HoursOfSleep'],
      });
    }
  });

  it('keeps teacher and normalizes caregiver to parent', () => {
    expect(
      SaveSurveyResponsesParamsSchema.parse({
        surveyResponses: {
          ...validParams.surveyResponses,
          surveyData: {
            ...validParams.surveyResponses.surveyData,
            userType: 'teacher',
          },
        },
      }).surveyResponses.surveyData.userType,
    ).toBe('teacher');

    expect(
      SaveSurveyResponsesParamsSchema.parse({
        surveyResponses: {
          ...validParams.surveyResponses,
          surveyData: {
            ...validParams.surveyResponses.surveyData,
            userType: 'caregiver',
          },
        },
      }).surveyResponses.surveyData.userType,
    ).toBe('parent');
  });

  it('rejects student and child user types', () => {
    for (const userType of ['student', 'child']) {
      const result = SaveSurveyResponsesParamsSchema.safeParse({
        surveyResponses: {
          ...validParams.surveyResponses,
          surveyData: {
            ...validParams.surveyResponses.surveyData,
            userType,
          },
        },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]).toMatchObject({
          code: 'invalid_value',
          path: ['surveyResponses', 'surveyData', 'userType'],
        });
      }
    }
  });

  it('trims administrationId and a string specificId', () => {
    expect(
      SaveSurveyResponsesParamsSchema.parse({
        surveyResponses: {
          ...validParams.surveyResponses,
          administrationId: '  admin-1  ',
          surveyData: {
            ...validParams.surveyResponses.surveyData,
            specificId: '  child-1  ',
            isGeneral: false,
          },
        },
      }),
    ).toEqual({
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData: {
          ...validParams.surveyResponses.surveyData,
          specificId: 'child-1',
          isGeneral: false,
        },
      },
    });
  });

  it('rejects a missing administrationId', () => {
    const { administrationId: _, ...rest } = validParams.surveyResponses;
    const result = SaveSurveyResponsesParamsSchema.safeParse({
      surveyResponses: rest,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received undefined',
          path: ['surveyResponses', 'administrationId'],
        },
      ]);
    }
  });

  it('accepts a string class id for a teacher specific part', () => {
    expect(
      SaveSurveyResponsesParamsSchema.parse({
        surveyResponses: {
          ...validParams.surveyResponses,
          surveyData: {
            ...validParams.surveyResponses.surveyData,
            isGeneral: false,
            specificId: 'class-1',
            userType: 'teacher',
          },
        },
      }).surveyResponses.surveyData.specificId,
    ).toBe('class-1');
  });

  it('rejects a numeric child id for a caregiver specific part', () => {
    const result = SaveSurveyResponsesParamsSchema.safeParse({
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData: {
          ...validParams.surveyResponses.surveyData,
          isGeneral: false,
          specificId: 12,
          userType: 'parent',
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received number',
          path: ['surveyResponses', 'surveyData', 'specificId'],
        },
      ]);
    }
  });

  it('rejects a numeric class id for a teacher specific part', () => {
    const result = SaveSurveyResponsesParamsSchema.safeParse({
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData: {
          ...validParams.surveyResponses.surveyData,
          isGeneral: false,
          specificId: 12,
          userType: 'teacher',
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Invalid input: expected string, received number',
          path: ['surveyResponses', 'surveyData', 'specificId'],
        },
      ]);
    }
  });

  it('rejects an unknown user type', () => {
    const result = SaveSurveyResponsesParamsSchema.safeParse({
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData: {
          ...validParams.surveyResponses.surveyData,
          userType: 'admin',
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        code: 'invalid_value',
        path: ['surveyResponses', 'surveyData', 'userType'],
      });
    }
  });

  it('rejects a response time that is not an ISO datetime', () => {
    const result = SaveSurveyResponsesParamsSchema.safeParse({
      surveyResponses: {
        ...validParams.surveyResponses,
        surveyData: {
          ...validParams.surveyResponses.surveyData,
          responses: {
            RespondentRelationship: {
              responseValue: 'bio-mother',
              responseTime: 'yesterday',
            },
          },
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        code: 'invalid_format',
        path: [
          'surveyResponses',
          'surveyData',
          'responses',
          'RespondentRelationship',
          'responseTime',
        ],
      });
    }
  });
});
