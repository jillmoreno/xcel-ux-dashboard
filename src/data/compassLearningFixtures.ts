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

/** The page header on Anjani's surface — hers, not the Figma frame's "Let's
 *  get started / Compass Learning", which stays on the `atlas` arm. ⚠ The
 *  exam date here (Aug 14, 8 days out) disagrees with the planner's Nov 20;
 *  that is her file's own inconsistency, carried faithfully. */
export const COMPASS_OVERVIEW_HEADER = {
  welcome: 'Welcome back, Jordan',
  title: 'Your learning journey',
  metaLead: 'Life & Health · Florida · Exam Aug 14 · ',
  metaStrong: '8 days out',
}

/** "How do we figure this out?" — the popover behind the ring's question. */
export const COMPASS_READINESS_EXPLAINER = {
  title: 'How we figure this out',
  body: "We look at how much of the exam you've practiced and how well you're doing on it. Topics that count more on the real exam count more here too.",
  makeup: [
    { tone: 'proven', share: '62% Proven', note: "practiced until it's solid" },
    { tone: 'covered', share: '25% Covered', note: 'read, not yet proven' },
    { tone: 'new', share: '13% New', note: 'not yet tested' },
  ],
  foot: 'It changes as you go — every practice set, flashcard round, and exam-sim question moves it.',
} as const

/** The Tonight card's two labels. ⚠ EVERYTHING ELSE IT SAID — the date, the
 *  session, "Session 3 of 5", the week strip and its sentence — now comes from
 *  the plan (`compassPlanStore`), 2026-10-15, so the card and the Study
 *  planner cannot disagree. */
export const COMPASS_TONIGHT = {
  skipLabel: "Can't study tonight",
  planLabel: 'View your plan',
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
  /** The hover tooltip on the readiness label — the state's name, then what
   *  it means for this topic. Hers, word for word. */
  tip: { head: string; body: string }
}

export const COMPASS_ASSIGNMENTS: readonly CompassAssignment[] = [
  {
    name: 'Life policies',
    weight: '18% of exam',
    state: 'proven',
    readinessLabel: 'Proven',
    barPct: 100,
    due: 'Done',
    tip: { head: 'Proven', body: "Practiced until it's solid, and proved on a scored check. This topic is holding your readiness up." },
  },
  {
    name: 'Provisions',
    weight: '22% of exam',
    state: 'not-proven',
    readinessLabel: 'Not proven',
    barPct: 52,
    due: 'Done',
    tip: { head: 'Not proven', body: "You've finished the course, but your scored answers don't yet match how sure you felt. More practice closes the gap." },
  },
  {
    name: 'Annuities',
    weight: '15% of exam',
    state: 'in-progress',
    readinessLabel: 'In progress · 10 min left',
    barPct: 80,
    due: 'Aug 9',
    tip: { head: 'In progress', body: "You're partway through the course. Readiness fills in as you finish and prove it on a check." },
  },
  {
    name: 'Health & disability',
    weight: '20% of exam',
    state: 'not-started',
    readinessLabel: 'Not started · 20 min',
    barPct: 0,
    due: 'Aug 11',
    tip: { head: 'Not started', body: 'Nothing done yet. 20% of the exam comes from this one — worth starting soon.' },
  },
  {
    name: 'Exam Simulator',
    weight: 'All topics',
    state: 'locked',
    readinessLabel: 'Locked · unlocks Aug 13',
    barPct: 0,
    due: 'Aug 13',
    tip: { head: 'Locked', body: "Your group's exam window opens Aug 13 — it'll unlock then." },
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
