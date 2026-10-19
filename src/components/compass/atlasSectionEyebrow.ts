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
 * ⚠ CENTRED SINCE 2026-10-19 (Jillienne: "center all of the eyebrows too",
 * after the content under them was centred). The column had been eyebrows
 * left over centred content — a deliberate pattern for about ten minutes,
 * and the wrong one: with four of them down one narrow column the labels
 * read as a ragged left edge against everything else.
 *
 * ⚠ `alignSelf: 'stretch'` IS WHAT MAKES THIS WORK. The <p> has to span the
 * column for `textAlign` to have anything to centre within; drop it and each
 * eyebrow shrinks to its own text and the centring becomes a no-op.
 *
 * ⚠ A PLAIN `.ts` MODULE, like `compassPages.ts` and `atlasHomeRefresh.ts`
 * beside it, for react-refresh's "only export components" rule: exporting a
 * constant from a component file breaks fast refresh for that file, and lint
 * says so. It lived in `AtlasPaceRingCard.tsx` for about a minute before
 * that rule caught it.
 */
/**
 * Where this column's section LABELS sit — 2026-10-19, Jillienne: "add a
 * variant where all of these are left aligned", narrowed within the hour to
 * "just for the eyebrow text".
 *
 * ⚠ THE EYEBROWS ONLY. The first pass moved the whole stack — the dials, the
 * pace lines and the completion date — and that was more than the ask. The
 * things a label names stay on the centre axis on both arms; only the label
 * moves.
 *
 * ⚠ A PROP, NOT A SIBLING, AND THAT IS A JUDGEMENT CALL. CLAUDE.md's rule is
 * to copy a component rather than thread conditionals through it, and it is
 * the right rule when two designs diverge. This is one `textAlign` on one
 * shared style; forking the pace card, the readiness card and this module
 * over it would duplicate everything built today and leave two copies to
 * keep in step. If the arms ever differ by more than their eyebrows, that is
 * the moment to fork them.
 */
export type AtlasColumnAlign = 'center' | 'left'

/**
 * HOW WIDE THE COLUMN'S PROSE RUNS — 2026-10-19, Jillienne: "reduce the
 * width of these text sections", of the pace standing sentence and the
 * readiness caption together.
 *
 * ⚠ ONE MEASURE FOR BOTH, which is why it is here rather than in either
 * card. They are the only two paragraphs in the column and they sit four
 * inches apart; at different widths the column looks like two columns. The
 * figure is a measure, not a box — the 248 of content is the card's, and
 * these two sit inside it.
 *
 * ⚠ NOT APPLIED TO THE EYEBROWS OR THE FIGURES. A label and a date are set
 * on one line and want the full width; only running text wants a measure.
 */
export const ATLAS_COLUMN_PROSE_W = 200

export function atlasSectionEyebrow(align: AtlasColumnAlign): CSSProperties {
  return align === 'left' ? { ...ATLAS_SECTION_EYEBROW, textAlign: 'left' } : ATLAS_SECTION_EYEBROW
}

export const ATLAS_SECTION_EYEBROW: CSSProperties = {
  margin: 0,
  alignSelf: 'stretch',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.16em',
  textAlign: 'center',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
