import * as z from 'zod';
import { NonEmptyStringSchema } from '../shared/non-empty-string';
import {
  FailedPreconditionErrorSchema,
  InternalErrorSchema,
  InvalidArgumentErrorSchema,
  NotFoundErrorSchema,
  UnauthenticatedErrorSchema,
} from './error';

/** Parameters schema for `loadFormDefinitions` Firebase Function. */
export const LoadFormDefinitionsParamsSchema = z.object({
  orgType: z.enum(['site', 'school']),
  orgId: NonEmptyStringSchema,
});

/** Inferred type of {@link LoadFormDefinitionsParamsSchema}. */
export type LoadFormDefinitionsParams = z.infer<
  typeof LoadFormDefinitionsParamsSchema
>;

/** A section heading within an information form definition. */
export type FormSectionInfo = {
  sectionId: string;
  title: string;
  description: string;
};

/** A single field within an information form definition. */
export type InformationFormField = {
  itemId: string;
  variableName: string;
  kind: 'text' | 'number' | 'single-select' | 'multi-select';
  required: boolean;
  sectionId: string;
  questionText: string;
  options?: { value: string; label: string }[];
  displayLogic?: { field: string; includes: string };
  infoExample?: string;
  notes?: string;
};

/** Result type for `loadFormDefinitions` Firebase Function. */
export type LoadFormDefinitionsResult = {
  formId: string;
  versionId: string;
  versionNumber: number;
  formDescription: string;
  fieldsDescription: Record<string, string>;
  generalPrompt: string;
  sectionInfo: FormSectionInfo[];
  fullFields: InformationFormField[];
  orgType: 'site' | 'school';
  orgId: string;
  /** Previously saved answers for this org. Empty in v1. */
  savedResponses: unknown[];
};

/** Error schema for `loadFormDefinitions` Firebase Function. */
export const LoadFormDefinitionsErrorSchema = z.discriminatedUnion('code', [
  InvalidArgumentErrorSchema,
  UnauthenticatedErrorSchema,
  NotFoundErrorSchema,
  FailedPreconditionErrorSchema,
  InternalErrorSchema,
]);

/** Inferred type of {@link LoadFormDefinitionsErrorSchema}. */
export type LoadFormDefinitionsError = z.infer<
  typeof LoadFormDefinitionsErrorSchema
>;
