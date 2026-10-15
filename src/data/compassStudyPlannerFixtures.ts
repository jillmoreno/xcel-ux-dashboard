/**
 * The Compass STUDY PLANNER — Anjani's `screen-planner`, ported 2026-10-15.
 *
 * ⚠ WHERE THIS CAME FROM, and the warning that comes with it. Everything below
 * is transcribed from her standalone prototype — the OCT2 master of
 * `public/prototypes/xcel-compass-nudge-journey.html` (PR #3,
 * `claude/gallant-feynman-aj0m0i`), where the planner arrived "merged from
 * compass-study-planner-standalone". She is still working in that file, so IT
 * is the source and this is a second home for the same words; nothing tells
 * this file when hers changes. `compassCourseLandingFixtures` carries the same
 * caution for the same reason.
 *
 * ⚠ INVENTED FIGURES, ALL OF THEM, and a FIXED CLOCK. Her planner pins "today"
 * to 22 September 2026 and the exam to 20 November so the demo reads the same
 * on any real date — 59 days out, Average pace, finishing Nov 11. Nothing here
 * reads `examDateStore`, the study calendar, `learningFixtures` or the
 * readiness model, and it deliberately does not: the page is a layout and
 * interaction argument about a plan with no real data behind it yet. When it
 * gets one, this file is what gets deleted, not extended — a half-real version,
 * where the exam date is the learner's and the topics are not, is the state
 * worth avoiding. The rail's footer already states a DIFFERENT exam date
 * ("Aug 14 · not booked"), straight from her file, and so does hers.
 *
 * ⚠ THE TOPICS ARE NOT THE COURSE'S MODULES. Her six rotate through the
 * calendar in order; `COMPASS_MODULES` (the course landing) names five others.
 * Both are hers, neither is reconciled, same as the landing's note says.
 */

/** Sunday-first minutes per weekday — the shape every pace and the weekly
 *  editor share. */
export type DayMinutes = [number, number, number, number, number, number, number]

export type PlannerPace = {
  id: 'crammer' | 'average' | 'thorough'
  name: string
  mins: DayMinutes
  hint: string
}

/** Pace sets how many hours a week; the day sliders spread those hours out.
 *  The two are tied — changing the pace redistributes, moving a slider can take
 *  you off a preset and into Custom. */
export const PLANNER_PACES: readonly PlannerPace[] = [
  { id: 'crammer', name: 'Crammer', mins: [0, 150, 150, 150, 150, 150, 0], hint: 'Head down, done fast' },
  { id: 'average', name: 'Average', mins: [0, 90, 90, 90, 90, 90, 0], hint: 'What most learners pick' },
  { id: 'thorough', name: 'Thorough', mins: [0, 60, 60, 60, 60, 60, 0], hint: 'Slower, more spacing' },
]

/** The fixed clock and the plan as onboarding left it. */
export const PLANNER_PLAN = {
  today: new Date(2026, 8, 22),
  exam: new Date(2026, 10, 20),
  /** ~55h of study left, including review and practice. */
  minsLeft: 3300,
  dayMins: [0, 90, 90, 90, 90, 90, 0] as DayMinutes,
  /** The calendar opens on the month that holds today. */
  cursor: new Date(2026, 8, 1),
} as const

/** The sessions rotate through these, in order; every fourth one also carries a
 *  spaced review. */
export const PLANNER_TOPICS = [
  'Policy provisions',
  'Annuities',
  'Health & disability',
  'Taxation',
  'Federal rules',
  'Riders',
] as const

/** What learners on this course usually do — 7h a week. Context, not a rule:
 *  the learner is free to ignore it, so it never blocks saving and never nags. */
export const PLANNER_NORM_MINUTES = 420

export const PLANNER_TITLE = 'Study planner'
/** "Life & Health · Florida · Exam Nov 20, 2026" — the exam half is composed
 *  from `PLANNER_PLAN.exam` so the two cannot disagree. */
export const PLANNER_META_LEAD = 'Life & Health · Florida'

export const PLANNER_HOWTO =
  'Click a date to take that day off. Hold Shift to take off everything back to the last one.'

export const PLANNER_SLIDER_RANGE = { min: 0, max: 180, step: 15 } as const

/** Rubi's first two turns, seeded when the panel opens. The pace name is bold
 *  in her file, so it is its own field rather than markup in a string. */
export const PLANNER_RUBI_SEED = {
  before: "Here's the plan from your setup — the ",
  pace: 'Average',
  after: ' pace, 7h 30m a week, finishing before your exam on Nov 20.',
  second: "Tell me what's changed and I'll rebuild it. Your weekends are already off.",
} as const

export const PLANNER_RUBI_HEAD = { name: 'Rubi', tagline: 'Working on your study plan' } as const
export const PLANNER_RUBI_PLACEHOLDER = 'Tell Rubi what changed…'

/** What Rubi says to anything she cannot act on, and to an "undo" with nothing
 *  left to undo. Her prototype's own words, scaffolding included. */
export const PLANNER_RUBI_FALLBACK =
  'Prototype — in the real thing I’d act on this and show you what moved. For now, try "I can’t study Fridays anymore" or "undo".'
export const PLANNER_RUBI_NOTHING_TO_UNDO = "I haven't changed anything that's left to undo."
export const PLANNER_RUBI_UNDONE = 'Put it back the way it was.'

/** The three starters are for the first turn only — once the learner has
 *  spoken, the pills go. */
export type PlannerStarterId = 'fri' | 'faster' | 'break'
export const PLANNER_STARTERS: readonly { id: PlannerStarterId; label: string; done: string }[] = [
  { id: 'fri', label: "I can't study Fridays anymore", done: 'Friday cleared' },
  { id: 'faster', label: 'I want to finish two weeks earlier', done: 'Pace changed to Crammer' },
  { id: 'break', label: "I'm away the week of Nov 9", done: 'Nov 9 to 13 blocked' },
]

/** Nov 9–13, the week the third starter blocks. */
export const PLANNER_BREAK_WEEK = { month: 10, from: 9, to: 13 } as const

export const PLANNER_LEGEND = [
  { id: 'sess', label: 'Study session' },
  { id: 'rev', label: 'Spaced review' },
  { id: 'off', label: 'Day off' },
  { id: 'exam', label: 'Exam day' },
] as const
