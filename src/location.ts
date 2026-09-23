import { cellToLatLng, getResolution, isValidCell } from 'h3-js';
import * as z from 'zod';
import { NonEmptyStringSchema } from './shared/non-empty-string';

/**
 * An {@link https://h3geo.org | H3} cell: its H3 index, hierarchical
 * resolution (0–15), and center as a `[lat, lng]` tuple in decimal degrees
 * (WGS84).
 */
export const H3CellSchema = z
  .object({
    h3Index: NonEmptyStringSchema,
    resolution: z.int().min(0).max(15),
    center: z.tuple([
      z.number().min(-90).max(90),
      z.number().min(-180).max(180),
    ]),
  })
  .superRefine((value, ctx) => {
    if (ctx.issues.length > 0) return;

    const { h3Index, resolution, center } = value;

    if (!isValidCell(h3Index)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid H3 index',
        path: ['h3Index'],
        input: h3Index,
      });
      return;
    }

    const h3IndexResolution = getResolution(h3Index);
    if (h3IndexResolution !== resolution) {
      ctx.addIssue({
        code: 'custom',
        message: `resolution mismatch (h3IndexResolution=${h3IndexResolution}, resolution=${resolution})`,
        path: ['resolution'],
        input: value,
      });
    }

    const h3IndexCenter = cellToLatLng(h3Index);
    if (h3IndexCenter[0] !== center[0] || h3IndexCenter[1] !== center[1]) {
      ctx.addIssue({
        code: 'custom',
        message: `center mismatch (h3IndexCenter=${h3IndexCenter}, center=${center})`,
        path: ['center'],
        input: value,
      });
    }
  });

/** Inferred type of {@link H3CellSchema}. */
export type H3Cell = z.infer<typeof H3CellSchema>;

/**
 * A privacy-respecting location, coarsened to an {@link H3CellSchema | H3 cell}
 * whose population meets a minimum threshold (k-anonymity).
 *
 * NB: `h3.baseline` is a coarse cell (resolution 5) for inter-location
 * comparison; `h3.effective` is the finest cell (resolution 5+) still meeting
 * the privacy threshold. Both are `undefined` when the location cannot be
 * k-anonymized at resolution 5+.
 */
export const LocationSchema = z
  .object({
    schemaVersion: z.literal('location_v1'),
    h3: z.object({
      baseline: H3CellSchema.optional(),
      effective: H3CellSchema.optional(),
    }),
    population: z.object({
      source: z.enum(['kontur', 'worldpop', 'unknown']),
      threshold: z.number().int().positive(),
    }),
    computedAt: z.iso.datetime(),
  })
  .superRefine((value, ctx) => {
    const { h3 } = value;

    if (h3.baseline && h3.baseline.resolution !== 5) {
      ctx.addIssue({
        code: 'custom',
        message: 'h3.baseline.resolution must be 5',
        path: ['h3', 'baseline', 'resolution'],
        input: h3.baseline.resolution,
      });
    }

    if (h3.effective && h3.effective.resolution < 5) {
      ctx.addIssue({
        code: 'custom',
        message: 'h3.effective.resolution must be >= 5',
        path: ['h3', 'effective', 'resolution'],
        input: h3.effective.resolution,
      });
    }
  });

/** Inferred type of {@link LocationSchema}. */
export type Location = z.infer<typeof LocationSchema>;
