/**
 * ⚠ NOTHING DRAWS THIS SINCE 2026-11-14 — "change to about 30 min". The
 * next-step card's duration was the first segment of the stage's own meta
 * line, which is a figure about that state's recommended PRACTICE and was an
 * hour out under a lesson title; it is `REFINED_NEXT_META.duration` now, one
 * typed estimate for every section.
 *
 * ⚠ KEPT, UNWIRED, by the archive convention. The parsing is the half worth
 * not re-deriving: every stage writes its meta the same way — "1h 40m ·
 * insurable interest · how a policy pays" — so the time is whatever precedes
 * the first separator, and a line that does not start with one says nothing
 * rather than printing "about undefined". To bring it back, call it where
 * `REFINED_NEXT_META.duration` is read in `CompassRefinedFocus.tsx` and
 * `CompassRefinedLearn.tsx`.
 *
 * ⚠ ITS OWN MODULE SINCE 2026-11-12, when Your Course started drawing the
 * same next-step card: a helper exported beside a component drops the file
 * out of React's fast-refresh boundary, the cut `compassRefinedFocusModel.ts`
 * records. Lifted verbatim.
 */
/**
 * THE DURATION OUT OF HIS META LINE.
 *
 * ⚠ THE FIRST SEGMENT, BY CONSTRUCTION. Every state writes it the same way —
 * "1h 40m · insurable interest · how a policy pays", "25 min · on pace for
 * Jul 15" — so the time is whatever precedes the first separator. Reusing it
 * keeps the figure his; retyping it would have been a third invented number
 * on a card that already carries two.
 */
export function durationOf(meta?: string): string {
  const first = meta?.split('·')[0]?.trim()
  /* No meta, or a line that does not start with a time: say nothing rather
     than printing "about undefined". */
  return first && /\d/.test(first) ? first : ''
}
