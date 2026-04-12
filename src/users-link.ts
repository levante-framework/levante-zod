import { z } from 'zod';
import { validateCsvData } from './csv';
import { NormalizedUserTypeSchema } from './users';

export const LinkUsersCsvSchema = z
  .object({
    id: z.string().min(1, 'ID is required').trim(),
    usertype: NormalizedUserTypeSchema,
    uid: z.string().min(1, 'UID is required').trim(),
    caregiverId: z.string().optional(),
    teacherId: z.string().optional(),
  })
  .transform(({ usertype, ...rest }) => ({
    ...rest,
    userType: usertype,
  }));

export const validateLinkUsersCsv = (data: unknown[]) =>
  validateCsvData(LinkUsersCsvSchema, data);
