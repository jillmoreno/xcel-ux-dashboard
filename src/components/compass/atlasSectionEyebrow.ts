import type { CSSProperties } from 'react'

/**
 * THE ATLAS HOME COLUMN'S SECTION EYEBROW — one definition, 2026-10-16
 * (Jillienne: "have the other eyebrows match this style in this section",
 * then "should be 3 sections: Study Pace, Course Progress, Exam Readiness as
 * the eyebrows").
 *
 * The column carried three slightly different eyebrows — the pace card's,
 * the Readiness card's (600 weight, 1.3px tracking, in the primary blue) and
 * Estimated completion's (10px, 600) — all uppercase and none quite alike,
 * which reads as carelessness rather than hierarchy. This is the one they
 * share.
 *
 * ⚠ A PLAIN `.ts` MODULE, like `compassPages.ts` and `atlasHomeRefresh.ts`
 * beside it, for react-refresh's "only export components" rule: exporting a
 * constant from a component file breaks fast refresh for that file, and lint
 * says so. It lived in `AtlasPaceRingCard.tsx` for about a minute before
 * that rule caught it.
 */
export const ATLAS_SECTION_EYEBROW: CSSProperties = {
  margin: 0,
  alignSelf: 'stretch',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
