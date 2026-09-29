/**
 * The Compass Learning overview's content — Figma 765:3471.
 *
 * ⚠ WHERE THIS CAME FROM, because it matters for who owns it. The Figma frame
 * draws this body as two PASTED SCREENSHOTS rather than as layers, and the
 * thing screenshotted is Anjani's standalone prototype
 * (`public/prototypes/xcel-compass-nudge-journey.html` on
 * `claude/gallant-feynman-aj0m0i`, Refinement row demo-004, 2026-09-28). The
 * copy here is transcribed from that file, which is the only authored source
 * for it — reading it off the screenshot would have invented the half the
 * image crops.
 *
 * ⚠ INVENTED FIGURES, ALL OF THEM. Every percentage, date and count below is
 * the prototype's demo data, not a fixture derived from this repo's personas.
 * Nothing here is wired to `learningFixtures`, `readinessFixtures` or the
 * study calendar, and it deliberately is not: the design is a layout argument
 * about a page that does not have real data behind it yet. When it gets one,
 * this file is what gets deleted, not extended — a half-real version, where the
 * ring reads a persona and the table does not, is the state worth avoiding.
 */

/** The one session the page asks the learner to do tonight. */
export const COMPASS_TONIGHT = {
  dayNumber: '22',
  dayName: 'Wed',
  title: 'Annuities · 45 minutes',
  detail: 'Session 3 of 5 this week. Nothing else is due today.',
  skipLabel: "Can't study tonight",
  startLabel: 'Start session',
  /** The week strip: 2 behind, 1 current, 4 ahead. */
  dots: ['done', 'done', 'now', 'ahead', 'ahead', 'ahead', 'ahead'] as const,
  weekNote:
    "Week 4 of 8 · 2 done · 2 planned · 2 rest days. Friday brings back Life policies so you don't lose them.",
  planLabel: 'Change your plan',
}

/** The readiness band — the ring, the sentence under it, and Rubi's nudge. */
export const COMPASS_READINESS = {
  eyebrow: 'Where you are',
  tag: 'Getting there',
  percent: 62,
  ringLabel: 'Ready',
  lead:
    "Our best guess at your chance of passing right now. Keep this pace and you'll be ready before Aug 14.",
  explainLabel: 'How do we figure this out?',
  /* The panel's "Rubi suggests" state, which is what the Figma frame shows.
     The prototype has a second, plainer "Next step" state behind the same
     slot; this is the one the design picked. */
  rubi: {
    eyebrow: 'Rubi suggests',
    title: 'Practice Policy provisions & riders',
    detail:
      'Your answers and your confidence do not line up here yet. Twelve minutes closes the gap.',
    action: 'Start practice',
  },
}

/** How far a topic has been proven — drives the marker, label and bar colour. */
export type AssignmentState = 'proven' | 'not-proven' | 'in-progress' | 'not-started' | 'locked'

export type CompassAssignment = {
  name: string
  /** How much of the real exam this topic is worth. */
  weight: string
  state: AssignmentState
  /** The readiness cell's own wording — never derived from `state`, because
   *  "In progress · 10 min left" carries a fact the state does not. */
  readinessLabel: string
  /** 0–100. The bar is the label's evidence, not a second claim. */
  barPct: number
  due: string
  /** Absent ⇒ no button. Done topics and a locked one offer nothing. */
  action?: string
}

export const COMPASS_ASSIGNMENTS: readonly CompassAssignment[] = [
  {
    name: 'Life policies',
    weight: '18% of exam',
    state: 'proven',
    readinessLabel: 'Proven',
    barPct: 100,
    due: 'Done',
  },
  {
    name: 'Provisions',
    weight: '22% of exam',
    state: 'not-proven',
    readinessLabel: 'Not proven',
    barPct: 52,
    due: 'Done',
    action: 'Practice again',
  },
  {
    name: 'Annuities',
    weight: '15% of exam',
    state: 'in-progress',
    readinessLabel: 'In progress · 10 min left',
    barPct: 80,
    due: 'Aug 9',
    action: 'Continue',
  },
  {
    name: 'Health & disability',
    weight: '20% of exam',
    state: 'not-started',
    readinessLabel: 'Not started · 20 min',
    barPct: 0,
    due: 'Aug 11',
    action: 'Start',
  },
  {
    name: 'Exam Simulator',
    weight: 'All topics',
    state: 'locked',
    readinessLabel: 'Locked · unlocks Aug 13',
    barPct: 0,
    due: 'Aug 13',
  },
]

export const COMPASS_ASSIGNMENTS_SUMMARY =
  '2 proven · 1 in progress · 3 to start · next up Annuities'

/** "What your answers show" — two read-outs from recent sessions. */
export const COMPASS_INSIGHTS = [
  {
    tag: 'Provisions',
    headline: '3 of 8 scored right · you marked 6 of them “sure”',
    detail: 'Aug 30 – Sep 2. Unaided attempts only.',
    action: 'See the questions',
  },
  {
    tag: 'Annuities',
    headline: '12 flashcards due · 2 terms missed twice',
    detail: 'Cards you marked “to review” on Sep 1 and Sep 3.',
    action: 'Review deck',
  },
] as const

export const COMPASS_INSIGHTS_CAPTION = 'From your last 4 sessions'
