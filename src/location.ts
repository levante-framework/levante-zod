import { cellToLatLng, getResolution, isValidCell } from 'h3-js';
import * as z from 'zod';
import { NonEmptyStringSchema } from './shared/non-empty-string';

/**
 * Max allowed deviation, in decimal degrees, between a cell's stored `center`
 * and the center computed from its H3 index. Absorbs floating-point drift
 * across h3-js versions; ~1e-6° is ~11 cm at the equator, an order of magnitude
 * below the spacing of even resolution-15 cell centers, so it never admits a
 * neighboring cell's center.
 */
const CENTER_EPSILON = 1e-6;

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
        input: resolution,
      });
    }

    // Compare against the cell's true center within a small tolerance rather
    // than exactly: `center` is expected to be derived from `cellToLatLng`, but
    // an exact match couples validity to the precise floating-point output of a
    // given h3-js version. A minor version bump could shift `cellToLatLng` by a
    // few IEEE-754 ULPs and retroactively invalidate previously-stored data.
    const h3IndexCenter = cellToLatLng(h3Index);
    if (
      Math.abs(h3IndexCenter[0] - center[0]) > CENTER_EPSILON ||
      Math.abs(h3IndexCenter[1] - center[1]) > CENTER_EPSILON
    ) {
      ctx.addIssue({
        code: 'custom',
        message: `center mismatch (h3IndexCenter=${h3IndexCenter}, center=${center})`,
        path: ['center'],
        input: center,
      });
    }
  });

/** Inferred type of {@link H3CellSchema}. */
export type H3Cell = z.infer<typeof H3CellSchema>;

/**
 * A privacy-respecting location, coarsened to an {@link H3CellSchema | H3 cell}
 * whose population meets a minimum threshold (k-anonymity).
 *
 * NB: `h3.effective` is the finest cell still meeting the privacy threshold.
 * `h3.baseline` is a resolution-5 cell for inter-location comparison, present
 * only when resolution 5 meets the threshold; when it doesn't, `baseline` is
 * `undefined` and `effective` is coarser (resolution <= 4). Both are
 * `undefined` when the location cannot be k-anonymized.
 */
export const CoarseLocationSchema = z
  .object({
    schemaVersion: z.literal('location_v1'),
    h3: z.object({
      baseline: H3CellSchema.optional(),
      effective: H3CellSchema.optional(),
    }),
    population: z.object({
      source: z.enum(['kontur', 'worldpop']),
      threshold: z.int().positive(),
    }),
    computedAt: z.iso.datetime(),
  })
  .superRefine((value, ctx) => {
    const { baseline, effective } = value.h3;

    if (baseline) {
      if (baseline.resolution !== 5) {
        ctx.addIssue({
          code: 'custom',
          message: 'h3.baseline.resolution must be 5',
          path: ['h3', 'baseline', 'resolution'],
          input: baseline.resolution,
        });
      }

      // Baseline exists only when resolution 5 met the threshold, so the
      // effective cell must exist and be a refinement (resolution >= 5).
      if (!effective) {
        ctx.addIssue({
          code: 'custom',
          message: 'h3.effective must be defined when h3.baseline is defined',
          path: ['h3', 'effective'],
          input: effective,
        });
      } else if (effective.resolution < 5) {
        ctx.addIssue({
          code: 'custom',
          message:
            'h3.effective.resolution must be >= 5 when h3.baseline is defined',
          path: ['h3', 'effective', 'resolution'],
          input: effective.resolution,
        });
      }
    } else if (effective && effective.resolution >= 5) {
      // No baseline means resolution 5 failed the threshold, so the effective
      // cell was coarsened further (resolution <= 4).
      ctx.addIssue({
        code: 'custom',
        message:
          'h3.effective.resolution must be < 5 when h3.baseline is undefined',
        path: ['h3', 'effective', 'resolution'],
        input: effective.resolution,
      });
    }
  });

/** Inferred type of {@link CoarseLocationSchema}. */
export type CoarseLocation = z.infer<typeof CoarseLocationSchema>;
