import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  FunctionsErrorSchema,
  InvalidArgumentErrorSchema,
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Response section identifiers for `getUserReport`. */
export const GetUserReportResponseSectionSchema = z.enum([
  'summary',
  'percentiles',
  'bestPerformances',
]);

/** Inferred type of {@link GetUserReportResponseSectionSchema}. */
export type GetUserReportResponseSection = z.infer<
  typeof GetUserReportResponseSectionSchema
>;

/** Parameters schema for `getUserReport` Firebase Function. */
export const GetUserReportParamsSchema = z.object({
  siteId: NonEmptyStringSchema,
  userId: NonEmptyStringSchema,
  responseSections: z.union([
    z.literal('all'),
    z.array(GetUserReportResponseSectionSchema).superRefine((sections, ctx) => {
      if (sections.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Must have at least one response section',
          path: [],
        });
        return;
      }

      if (new Set(sections).size !== sections.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'Response sections must be unique',
          path: [],
        });
      }
    }),
  ]),
});

/** Inferred type of {@link GetUserReportParamsSchema}. */
export type GetUserReportParams = z.infer<typeof GetUserReportParamsSchema>;

/** Summary metrics for a user report. */
export type GetUserReportSummary = {
  totalExploringMs: number;
  percentageCorrect: number;
  longestStreak: number;
  fastestCorrectMs: number;
};

/** Percentile entry for a task in a user report. */
export type GetUserReportPercentile = {
  taskName: string;
  percentile: number;
};

/** Best performance entry for a task item in a user report. */
export type GetUserReportBestPerformance = {
  taskName: string;
  itemName: string;
  percentageCorrect: number;
};

/** Full result type for `getUserReport` when all sections are requested. */
export type GetUserReportFullResult = {
  summary: GetUserReportSummary;
  percentiles: GetUserReportPercentile[];
  bestPerformance: GetUserReportBestPerformance[];
};

type GetUserReportSectionResultKey = {
  summary: 'summary';
  percentiles: 'percentiles';
  bestPerformances: 'bestPerformance';
};

/**
 * Result type for `getUserReport` Firebase Function.
 *
 * Returned keys depend on `responseSections` in the request params.
 */
export type GetUserReportResult<
  Sections extends
    GetUserReportParams['responseSections'] = GetUserReportParams['responseSections'],
> = Sections extends 'all'
  ? GetUserReportFullResult
  : Sections extends readonly GetUserReportResponseSection[]
    ? Pick<
        GetUserReportFullResult,
        GetUserReportSectionResultKey[Sections[number]]
      >
    : never;

/** Error schema for `getUserReport` Firebase Function. */
export const GetUserReportErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  FunctionsErrorSchema.extend({
    code: z.literal('functions/not-found'),
    details: z.discriminatedUnion('code', [
      z.object({
        code: z.literal('site'),
        siteId: z.string(),
      }),
      z.object({
        code: z.literal('user'),
        siteId: z.string(),
        userId: z.string(),
      }),
    ]),
  }),
  PermissionDeniedErrorSchema,
  UnauthenticatedErrorSchema,
]);

/** Inferred type of {@link GetUserReportErrorSchema}. */
export type GetUserReportError = z.infer<typeof GetUserReportErrorSchema>;
