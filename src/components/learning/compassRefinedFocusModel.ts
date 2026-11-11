/**
 * THE FIRST WIDGET'S OPEN DECISIONS — its own module, 2026-11-11.
 *
 * ⚠ SPLIT OUT FOR FAST REFRESH, which is the same cut `demoShareActionsUtil.ts`
 * and `compassVersions.ts` record: a module that exports a component AND a
 * constant drops out of React's refresh boundary, so every edit to the card
 * would full-reload the page instead of swapping the component. The types
 * could have stayed — they vanish at build — but keeping them with the
 * default means the shape and its baseline are read in one place.
 */

/** Which of the three arrangements draws. `compass-overview-focus`. */
export type FocusLayout = 'split' | 'panel' | 'figures'

/** Where the day-one note's offer sits. `compass-overview-pace-note`. */
export type PaceNoteStyle = 'inline' | 'link'

/** How the next section's mark is drawn. `compass-overview-next-mark`. */
export type NextMarkStyle = 'stacked' | 'tile'

/**
 * EVERY DESIGN DECISION OPEN ON THIS CARD, AS ONE PROP — 2026-11-11.
 *
 * ⚠ IT WAS THREE SEPARATE PROPS AND A FOURTH WAS ARRIVING. Each had to be
 * declared, destructured and forwarded through `CompassRefinedShell`,
 * `RefinedPage`, `CompassRefinedStageOverview` and `CompassRefinedJourney` —
 * four files edited to add one variant, which is the kind of friction that
 * stops a variant being tried. One object means the next one is a field.
 *
 * ⚠ STILL READ IN `CompassLearningPage`, so every component below it stays a
 * plain function of its props and renders in a test with no flag provider.
 */
export type FocusOptions = {
  layout: FocusLayout
  swap: boolean
  paceNote: PaceNoteStyle
  nextMark: NextMarkStyle
}

export const FOCUS_DEFAULTS: FocusOptions = {
  layout: 'split',
  swap: false,
  paceNote: 'inline',
  nextMark: 'stacked',
}
