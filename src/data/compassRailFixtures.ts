/**
 * Anjani's Compass rail — the words in it, and the rows that are not pages.
 *
 * ⚠ REBUILT 2026-10-15 from her second master (published as the type-scale
 * preview, `public/prototypes/xcel-compass-type-scale-preview.html`). The
 * 2026-10-08 rail had six label-only rows and a course-hours / exam footer;
 * hers now draws icons on every row, an "Ask Rubi" row, a disabled Progress,
 * an EXAM PREP group of three locked rows, and a Settings row above the
 * learner. The footer's figures are gone with it. Same caution as every
 * Compass fixture: her file is the source and this is a second home.
 */

export const COMPASS_RAIL_WORDMARK = 'Compass'

/** The locked group under the rule. Each is a button, not a page: the first
 *  tap shows why it is locked, the second opens the Exam prep dialog. */
export type CompassLockedRow = { id: 'practice' | 'flashcards' | 'exam-simulator'; label: string }
export const COMPASS_RAIL_LOCKED_HEADING = 'Exam prep'
export const COMPASS_RAIL_LOCKED: readonly CompassLockedRow[] = [
  { id: 'practice', label: 'Practice' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'exam-simulator', label: 'Exam Simulator' },
]
export const lockedTip = (label: string) => ({
  head: 'Not open yet',
  body: `Finish every section of your course to open ${label}.`,
})

export const COMPASS_RAIL_ASK_RUBI = 'Ask Rubi'
export const COMPASS_RAIL_SETTINGS = 'Settings'
export const COMPASS_RAIL_LEARNER = { initials: 'JR', name: 'Jordan R.' }

/** The Exam prep dialog — the second tap on a locked row, and the locked Part
 *  2 on the Learn page. */
export const COMPASS_GATE_DIALOG = {
  title: 'Exam prep is not open yet',
  body: 'Your course has to be completed in order, so this opens on its own once the last chapter is passed.',
  insideHeading: 'What is inside',
  inside: [
    'Practice — question sets pointed at what you have not yet shown you know',
    'Flashcards — quick recall across every chapter',
    'Exam Simulator — a full timed practice exam',
  ],
  back: 'Back to my course',
  ask: 'Ask Rubi about this',
}
