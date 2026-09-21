import { cellToLatLng, getResolution } from 'h3-js';
import * as z from 'zod';
import { NonEmptyStringSchema } from './shared/non-empty-string';

/** An {@link https://h3geo.org | H3} cell: its H3 index and hierarchical resolution (0–15). */
export const H3CellSchema = z.object({
  h3Index: NonEmptyStringSchema,
  resolution: z.int().min(0).max(15),
});

/** Inferred type of {@link H3CellSchema}. */
export type H3Cell = z.infer<typeof H3CellSchema>;

export const LocationSchema = z
  .object({
    schemaVersion: z.literal('location_v1'),
    privacyMet: z.boolean(),
    latLon: z
      .object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        source: z.literal('h3_center'),
      })
      .optional(),
    h3: z.object({
      scheme: z.literal('h3_v1'),
      baseline: H3CellSchema.optional(),
      effective: H3CellSchema.optional(),
      populationThreshold: z.number().int().positive(),
    }),
    populationSource: z.enum(['kontur', 'worldpop', 'unknown']).optional(),
    computedAt: z.iso.datetime().optional(), // when location was computed
    createdAt: z.iso.datetime().optional(), // when location was persisted to database
  })
  .superRefine((value, ctx) => {
    const effective = value.h3.effective;
    const baseline = value.h3.baseline;

    if (!value.privacyMet) {
      if (effective !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['h3', 'effective'],
          message: `h3.effective must be undefined if privacyMet is false`,
        });
      }

      return;
    }

    if (baseline) {
      try {
        const baselineResolution = getResolution(baseline.h3Index);
        if (baselineResolution !== baseline.resolution) {
          ctx.addIssue({
            code: 'custom',
            path: ['h3', 'baseline', 'resolution'],
            message: `baseline resolution mismatch (cell=${baselineResolution}, field=${baseline.resolution})`,
          });
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['h3', 'baseline', 'h3Index'],
          message: 'Invalid baseline H3 index',
        });
      }
    }

    if (effective) {
      try {
        const effectiveResolution = getResolution(effective.h3Index);
        if (effectiveResolution !== effective.resolution) {
          ctx.addIssue({
            code: 'custom',
            path: ['h3', 'effective', 'resolution'],
            message: `effective resolution mismatch (cell=${effectiveResolution}, field=${effective.resolution})`,
          });
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['h3', 'effective', 'h3Index'],
          message: 'Invalid effective H3 index',
        });
      }

      if (baseline) {
        if (effective.resolution < baseline.resolution) {
          ctx.addIssue({
            code: 'custom',
            path: ['h3', 'effective', 'resolution'],
            message: 'effective.resolution must be >= baseline.resolution',
          });
        }
      }
    }

    if (value.latLon?.source === 'h3_center' && effective) {
      const [centerLat, centerLon] = cellToLatLng(effective.h3Index);
      const epsilon = 1e-6;
      if (
        Math.abs(value.latLon.lat - centerLat) > epsilon ||
        Math.abs(value.latLon.lon - centerLon) > epsilon
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['latLon'],
          message:
            'latLon must match effective H3 center when source is h3_center',
        });
      }
    }
  });

export const locationDocId = (
  location: Pick<z.infer<typeof LocationSchema>, 'schemaVersion' | 'h3'>,
): string => {
  const version = location.schemaVersion.replace(/^location_/, '');
  return `h3:${location.h3.effective?.h3Index ?? 'null'}:t:${location.h3.populationThreshold}:${version}`;
};
