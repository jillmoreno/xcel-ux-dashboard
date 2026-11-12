import {
  BallotCheckRegular,
  BookOpenRegular,
  ClipboardList,
  FileCertificateRegular,
  PenFieldRegular,
} from '@/icons'
import type { RefinedSectionKind } from '@/data/compassRefinedCourse'

/**
 * WHAT THE NEXT SECTION IS, DRAWN AS A TILE — 2026-11-11, from the direct
 * ask. The tile itself is `crf-tile`, the badge the Learn page's course
 * header already uses, so the two surfaces mark a thing the same way.
 *
 * ⚠ THE ICONS ARE HERS, mapped onto this registry: an open book for a
 * lesson; `ballot-check` for an exam, which is the page-with-checkmarks in
 * this set and the nearest thing to "a document style icon with a
 * checkmark"; `pen-field` for an affidavit, a signature line with a pen;
 * `clipboard-list` for a survey.
 *
 * ⚠ ITS OWN MODULE SINCE 2026-11-12, when the next-step card became one
 * component drawn on two pages. A map exported beside a component drops the
 * file out of React's fast-refresh boundary — the cut
 * `compassRefinedFocusModel.ts` records — and both pages now need it.
 *
 * ⚠ ONE OF THE FIVE IS UNREACHABLE TODAY (`affidavit`) and that is
 * deliberate — see `RefinedSectionKind`. An unknown kind falls back to the
 * lesson book rather than rendering an empty tile.
 */
export const SECTION_ICON: Record<RefinedSectionKind, typeof BookOpenRegular> = {
  lesson: BookOpenRegular,
  exam: BallotCheckRegular,
  affidavit: PenFieldRegular,
  survey: ClipboardList,
  /* ⚠ `file-certificate` — a document with a seal, which is the one glyph in
     this registry that means "you have finished and here is the proof". */
  certificate: FileCertificateRegular,
}
