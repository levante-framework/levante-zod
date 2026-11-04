import * as z from 'zod';
import { LanguageSelectionSchema } from '../languages/language-selection';
import { NonEmptyStringSchema } from '../shared/non-empty-string';

/**
 * Value stored for one survey question.
 *
 * The new player stores a scalar, a multi-select list of those scalars, or
 * `null` for a cleared answer that still has a response time, and gives each
 * matrix row its own key. SurveyJS still stores a matrix or multi-text
 * question as one key whose value is an object of scalars. A language
 * selector stores a {@link LanguageSelectionSchema} value. Older answers stay
 * a scalar, a list of scalars, or that matrix object. A cell inside a matrix
 * object is a scalar, not another object.
 */
export type SurveyResponseScalar = string | number | boolean;

export type SurveyResponseValue =
  | SurveyResponseScalar
  | SurveyResponseScalar[]
  | Record<string, SurveyResponseScalar>
  | z.infer<typeof LanguageSelectionSchema>
  | null;

const SurveyResponseScalarSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export const SurveyResponseValueSchema = z.union([
  SurveyResponseScalarSchema,
  z.array(SurveyResponseScalarSchema),
  LanguageSelectionSchema,
  z.record(z.string(), SurveyResponseScalarSchema),
  z.null(),
]);

const SurveyAnswerSchema = z.object({
  responseValue: SurveyResponseValueSchema,
  responseTime: z.iso.datetime(),
  /** Text stored with this answer. Omitted by current clients. */
  responseText: z.string().optional(),
  /** Prompt shown for this question. Omitted by current clients. */
  questionPrompt: z.string().optional(),
});

/**
 * Adult survey participant type.
 *
 * SurveyJS copies `users/{uid}.userType` onto the save. Caregiver accounts
 * are stored as `parent`; the dashboard only says "caregiver" in the UI.
 * `caregiver` is accepted and normalized to `parent`. `student` and `child`
 * are not this survey.
 */
const SurveyUserTypeSchema = z
  .enum(['parent', 'caregiver', 'teacher'])
  .transform((userType) => (userType === 'caregiver' ? 'parent' : userType));

/**
 * Parameters schema for the SurveyJS `saveSurveyResponses` callable.
 *
 * The new player will append keyed responses through a separate callable.
 * This payload still has to accept a SurveyJS matrix object while both run.
 * Which question keys are legal is decided
 * by the published form definition, not by this schema. A page-change save
 * omits `isEntireSurveyCompleted`. `specificId` is `0` for the general part
 * and the child id or class id for a specific part; that id is not stored under
 * this name. A specific child id or class id is a string. `versionId`, when sent, is stored
 * on the part this save writes (caregiver or teacher general, or one specific
 * entry), not on the document.
 */
export const SaveSurveyResponsesParamsSchema = z
  .object({
    surveyResponses: z.object({
      administrationId: NonEmptyStringSchema,
      surveyData: z.object({
        /** Last saved page. Current clients send it; a save may omit it. */
        pageNo: z.number().int().nonnegative().optional(),
        isGeneral: z.boolean(),
        isComplete: z.boolean(),
        isEntireSurveyCompleted: z.boolean().optional(),
        /**
         * Form definition version for the part this save writes.
         * Omitted by current clients.
         */
        versionId: NonEmptyStringSchema.optional(),
        specificId: z.union([NonEmptyStringSchema, z.number()]),
        responses: z.record(
          z.string(),
          z.union([SurveyAnswerSchema, z.null()]),
        ),
        userType: SurveyUserTypeSchema,
      }),
    }),
  })
  .superRefine((data, ctx) => {
    const surveyData = data.surveyResponses.surveyData;
    if (!surveyData.isGeneral && typeof surveyData.specificId !== 'string') {
      ctx.addIssue({
        code: 'invalid_type',
        expected: 'string',
        message: 'Invalid input: expected string, received number',
        path: ['surveyResponses', 'surveyData', 'specificId'],
      });
    }
  });

/** Inferred type of {@link SaveSurveyResponsesParamsSchema}. */
export type SaveSurveyResponsesParams = z.infer<
  typeof SaveSurveyResponsesParamsSchema
>;

/** Result type for `saveSurveyResponses`. Failures throw instead of returning. */
export type SaveSurveyResponsesResult = {
  success: true;
  message: string;
};
