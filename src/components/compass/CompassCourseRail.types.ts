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
 * Where a TOC entry stands. Three states, and the rail reads everything else
 * off them — which icon, which weight, the "Now" marker, and the section notes
 * — so a page never authors a "Done" or "Up next" label that can disagree
 * with the status beside it.
 */
export type CompassTocStatus = 'done' | 'current' | 'not-started'

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
  breadcrumb: readonly CompassBreadcrumb[]
  /** The course's own title. Wraps; the design's is two lines on purpose. */
  courseTitle: string
  /** 0–100. Printed as "N% Complete". Read it from the page's own resolver. */
  progressPct: number
  toc: readonly CompassTocSection[]
  resources: readonly CompassResourceLink[]
}
