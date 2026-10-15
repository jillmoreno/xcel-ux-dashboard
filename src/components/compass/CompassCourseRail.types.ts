/**
 * COMPASS LMS COURSE LEFT RAIL NAVIGATION — the configuration contract.
 *
 * The rail (`CompassCourseRail`) draws nothing it was not given: every Compass
 * LMS course page supplies its own breadcrumb, title, progress, table of
 * contents and resources through this shape. That is what makes it reusable
 * across future Compass pages rather than a drawing of one course. Figma
 * "Atlas-Compass-Global-Navigation", node 49:2922, 2026-09-22.
 *
 * A separate file because tests and callers import the types, and a component
 * file that also exports types costs Fast Refresh (the same split
 * `ReadinessScoreGauge.types.ts` makes).
 */

/**
 * Where a TOC entry stands. The rail reads everything else off them — which
 * icon, which weight, the "Now" marker, and the section notes — so a page
 * never authors a "Done" or "Up next" label that can disagree with the status
 * beside it.
 *
 * ⚠ `locked` JOINED THE THREE ON 2026-10-15, with the Course control's
 * Regulated sequencing, and it is NOT A FOURTH THING A FIXTURE AUTHORS. Every
 * course TOC in this repo is authored in `done` / `current` / `not-started`;
 * `applyCourseSequencing` (`compassCourseFixtures.ts`) is the only thing that
 * produces a `locked`, by DERIVING it from position under the regulated rule.
 * A hand-authored one would be a fixture asserting a rule the flag is supposed
 * to decide — and it would survive a flip back to Unregulated, which is
 * precisely what the derivation avoids.
 *
 * A locked entry draws a grey padlock where the outline ring would be and
 * renders as static text: `applyCourseSequencing` strips `onSelect` on the way
 * through, so "locked" and "unclickable" cannot come apart.
 *
 * ⚠ IT IS NOT `CompassRail`'s LOCK. That rail has a `COMPASS_RAIL_LOCKED`
 * group (Flashcards / Exam Simulator, held until Part 2) with a
 * tooltip-then-dialog. Same word, different gate: that one withholds a later
 * PART of the programme, this one sequences the lessons inside Part 1. The
 * interaction shape was worth copying; its data was not.
 */
export type CompassTocStatus = 'done' | 'current' | 'not-started' | 'locked'

/** A lesson-level entry under a section — a chapter, a knowledge check, a recap. */
export type CompassTocChild = {
  id: string
  label: string
  status: CompassTocStatus
  /**
   * Opens this entry. Omitted → the row renders as static text with no hover,
   * which is the honest state for a lesson that has no page yet.
   */
  onSelect?: () => void
}

/**
 * A top-level section of the course. Only the CURRENT section shows its
 * children (on the spine); a done section collapses to a "Done" note and the
 * first not-started section after the current one carries "Up next" — both
 * derived by the rail, never authored.
 */
export type CompassTocSection = {
  id: string
  label: string
  status: CompassTocStatus
  children?: readonly CompassTocChild[]
  onSelect?: () => void
}

/**
 * One breadcrumb step. The FIRST crumb always renders as the home icon; the
 * LAST is the page you are on and renders as `aria-current` text whatever
 * `onSelect` says. Everything between is a link.
 */
export type CompassBreadcrumb = {
  label: string
  onSelect?: () => void
}

/** An entry in the Resources group — the same row the Atlas rail uses. */
export type CompassResourceLink = {
  id: string
  label: string
  onSelect?: () => void
}

export type CompassCourseRailConfig = {
  /** Optional since 2026-10-01: the Atlas Course page draws none. Empty or
   *  absent → no breadcrumb row. */
  breadcrumb?: readonly CompassBreadcrumb[]
  /** The course's own title. Wraps; the design's is two lines on purpose. */
  courseTitle: string
  /** 0–100. Printed as "N% Complete". Read it from the page's own resolver. */
  progressPct: number
  /** No progress row (Eric/Atlas WIP, 2026-10-14). */
  hideProgress?: boolean
  toc: readonly CompassTocSection[]
  resources: readonly CompassResourceLink[]
}
