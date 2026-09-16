import { cellToLatLng, getResolution } from 'h3-js';
import * as z from 'zod';
import { NonEmptyStringSchema } from './shared/non-empty-string';

export const H3CellSchema = z.object({
  cellId: NonEmptyStringSchema,
  resolution: z.int().min(0).max(15),
});

export const LatLonSourceSchema = z.enum(['gps', 'h3_center', 'approximate']);

export const LocationSchema = z
  .object({
    schemaVersion: z.literal('location_v1'),
    latLon: z
      .object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        source: LatLonSourceSchema,
        blurRadiusMeters: z.number().positive().optional(),
      })
      .optional(),
    h3: z.object({
      scheme: z.literal('h3_v1'),
      baseline: H3CellSchema,
      effective: H3CellSchema,
      populationThreshold: z.number().int().positive(),
    }),
    populationSource: z.enum(['kontur', 'worldpop', 'unknown']).optional(),
    computedAt: z.iso.datetime().optional(),
  })
  .superRefine((value, ctx) => {
    try {
      const baselineResolution = getResolution(value.h3.baseline.cellId);
      if (baselineResolution !== value.h3.baseline.resolution) {
        ctx.addIssue({
          code: 'custom',
          path: ['h3', 'baseline', 'resolution'],
          message: `baseline resolution mismatch (cell=${baselineResolution}, field=${value.h3.baseline.resolution})`,
        });
      }
    } catch {
      ctx.addIssue({
        code: 'custom',
        path: ['h3', 'baseline', 'cellId'],
        message: 'Invalid baseline H3 cellId',
      });
    }

    try {
      const effectiveResolution = getResolution(value.h3.effective.cellId);
      if (effectiveResolution !== value.h3.effective.resolution) {
        ctx.addIssue({
          code: 'custom',
          path: ['h3', 'effective', 'resolution'],
          message: `effective resolution mismatch (cell=${effectiveResolution}, field=${value.h3.effective.resolution})`,
        });
      }
    } catch {
      ctx.addIssue({
        code: 'custom',
        path: ['h3', 'effective', 'cellId'],
        message: 'Invalid effective H3 cellId',
      });
    }

    if (value.h3.effective.resolution < value.h3.baseline.resolution) {
      ctx.addIssue({
        code: 'custom',
        path: ['h3', 'effective', 'resolution'],
        message: 'effective.resolution must be >= baseline.resolution',
      });
    }

    if (
      value.latLon?.source === 'approximate' &&
      !value.latLon.blurRadiusMeters
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['latLon', 'blurRadiusMeters'],
        message: 'blurRadiusMeters is required when source is approximate',
      });
    }

    if (value.latLon?.source === 'h3_center') {
      const [centerLat, centerLon] = cellToLatLng(value.h3.effective.cellId);
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
  return `h3:${location.h3.effective.cellId}:t:${location.h3.populationThreshold}:${version}`;
};
