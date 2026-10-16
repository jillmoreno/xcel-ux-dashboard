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


/**
 * HER THREE BATCH DASHBOARD NUDGES — 2026-10-16, ported verbatim from the
 * `DN` object in `public/prototypes/xcel-compass-nudge-journey.html`, which
 * her "Dashboard nudges" menu fires (`dnFire('d05'|'d08'|'d09')`).
 *
 * ⚠ BATCH, AND THE NOTE IN HER MENU SAYS WHY: "These three are batch nudges
 * in Sole's spec — produced between sessions. They never fire inside a
 * lesson." That is a statement about where they may appear, not a styling
 * note, which is why the control that fires them is scoped to the OVERVIEW
 * and not to the session.
 *
 * ⚠ THE COPY IS HERS, UNCHANGED. `when` / `line` / `why` and the actions are
 * the strings from her file. `d09` carries a `fake: true` in the prototype —
 * her marker that its figures are illustrative — and the 61% / 80% in its
 * `why` are exactly that, so they must not be read as measured.
 */
export type CompassDashboardNudge = {
  n: string
  when: string
  line: string
  why: string
  actions: { label: string; solid?: boolean }[]
}

export const COMPASS_DASHBOARD_NUDGES: Record<string, CompassDashboardNudge> = {
  d05: {
    n: '05',
    when: 'Noticed since your last session',
    line: "You're close on one topic. Fifteen minutes today gets you back on pace.",
    why: 'You opened Compass twice this week without finishing a section. This is the smallest thing that moves your date.',
    actions: [{ label: 'Start the 15 minutes', solid: true }, { label: 'Not today' }],
  },
  d08: {
    n: '08',
    when: 'Welcome back \u2014 5 days away',
    line: 'Welcome back. Two quick refreshers, then we pick up where you left off.',
    why: 'Memory fades with a break, so a short warm-up on what you already covered protects it before new material.',
    actions: [{ label: 'Do the two refreshers', solid: true }, { label: 'Skip, take me to the course' }],
  },
  d09: {
    n: '09',
    when: '8 days to your exam',
    line: "To be ready by the 14th, let's put your next few sessions on your two weakest domains.",
    why: 'Readiness is 61% and the Ready band is 80%. Provisions and Riders are the two that move it most.',
    actions: [{ label: 'Reshape my plan', solid: true }, { label: 'Go to flashcards' }, { label: 'Not now' }],
  },
}


/* ═══ DAY ONE ═══════════════════════════════════════════════════════════
 *
 * HER `#dash-empty` — 2026-10-16. Her prototype carries TWO dashboards and a
 * dev button that swaps them (`setDashState('empty'|'loaded')`); everything
 * above is the loaded one. This is the other.
 *
 * ⚠ IT IS NOT A DIFFERENT SCREEN. That is what it looked like from the
 * outside — 24KB of markup with its own artwork — and the reason this nearly
 * got quoted as a port. It is the SAME five sections with day-one content:
 * the header, the card above the week, the readiness band, the assignments
 * and the insights. Nothing new had to be built; every one of these mirrors a
 * fixture above it.
 *
 * ⚠ THE COPY IS HERS, INCLUDING ITS DISAGREEMENTS. Her day-one learner sits
 * an ARIZONA exam on Oct 15 at 56 days out, where the loaded one is FLORIDA,
 * Aug 14, 8 days out — two different scenarios, not one learner over time, so
 * switching the control changes the course as well as the progress. Carried
 * faithfully rather than reconciled, the same way the loaded header already
 * carries her Aug 14 / Nov 20 disagreement with the planner.
 */

export const COMPASS_DAY_ONE_HEADER = {
  welcome: 'Welcome, Jordan',
  title: 'Your learning journey',
  metaLead: 'Life & Health · Arizona · Exam Oct 15 · ',
  metaStrong: '56 days out',
}

/** The card where Tonight sits on the loaded dashboard. */
export const COMPASS_DAY_ONE_START = {
  eyebrow: 'Start here',
  title: 'Your first check · 10 minutes',
  detail:
    'Ten questions across the exam topics. Rubi uses them to build your first plan and see where you\u2019re starting from.',
  action: 'Start check',
  week: 'Week 1 of 8 \u00b7 your rhythm, plan, and readiness all fill in from here.',
}

/** The readiness band, before there is anything to measure. */
export const COMPASS_DAY_ONE_READINESS = {
  eyebrow: 'Where you are',
  tag: 'Day one',
  percent: 28,
  ringLabel: 'Ready',
  principle: 'Start off on the right foot \u2014 Rubi keeps up as you change.',
  lead:
    'Compass measures how ready you are the way an exam does \u2014 from what you can do, not how much you have read.',
  rubi: {
    eyebrow: 'Rubi suggests',
    title: 'Meet Rubi, your learning guide',
    detail:
      'Rubi will pace your plan, resurface what\u2019s slipping, and adjust as you go. Take a quick tour.',
    action: 'Learn more',
  },
}

/** Nothing is started, so every row reads the same and the plan waits on the
 *  check. The Exam Simulator is LOCKED rather than not-started — her
 *  distinction: the others are waiting, that one is withheld. */
export const COMPASS_DAY_ONE_ASSIGNMENTS: readonly CompassAssignment[] = [
  { name: 'Provisions', weight: '22% of exam', state: 'not-started', readinessLabel: 'Not started', barPct: 0, due: 'After your check', tip: { head: 'Not started', body: 'Nothing attempted here yet \u2014 your first check will place it.' } },
  { name: 'Health & disability', weight: '20% of exam', state: 'not-started', readinessLabel: 'Not started', barPct: 0, due: 'After your check', tip: { head: 'Not started', body: 'Nothing attempted here yet \u2014 your first check will place it.' } },
  { name: 'Life policies', weight: '18% of exam', state: 'not-started', readinessLabel: 'Not started', barPct: 0, due: 'After your check', tip: { head: 'Not started', body: 'Nothing attempted here yet \u2014 your first check will place it.' } },
  { name: 'Annuities', weight: '15% of exam', state: 'not-started', readinessLabel: 'Not started', barPct: 0, due: 'After your check', tip: { head: 'Not started', body: 'Nothing attempted here yet \u2014 your first check will place it.' } },
  { name: 'Exam Simulator', weight: 'All topics', state: 'locked', readinessLabel: 'Unlocks after your check', barPct: 0, due: 'Locked', tip: { head: 'Locked', body: 'The simulator opens once your first check has set a baseline.' } },
]

export const COMPASS_DAY_ONE_ASSIGNMENTS_SUMMARY =
  'Sorted by how much they count on the exam \u00b7 plan sets after your first check'

/** ⚠ THE INSIGHTS CHANGE KIND, not just wording. On the loaded dashboard they
 *  are read-outs from sessions ("3 of 8 scored right"); on day one there are
 *  no sessions to read, so hers are LEARNING TIPS. Same slot, different
 *  promise — which is why they carry her "Learning tip ·" tag. */
export const COMPASS_DAY_ONE_INSIGHTS = [
  {
    tag: 'Learning tip \u00b7 spacing',
    headline: 'Short and often beats one long sitting',
    detail:
      'Three 30-minute sessions across a week stick better than one 90-minute cram, even if the total time is the same.',
    action: '',
  },
  {
    tag: 'Learning tip \u00b7 testing yourself',
    headline: 'Testing yourself works better than re-reading',
    detail:
      'Pulling an answer out of your head \u2014 even getting it wrong \u2014 makes it stick better than reading the page again.',
    action: '',
  },
  {
    tag: 'Learning tip \u00b7 knowing what you know',
    headline: 'The topics you feel most sure about often hide the biggest gaps',
    detail:
      'When Rubi spots a gap between how you rate yourself and how you actually score, that\u2019s the place worth your next session.',
    action: '',
  },
] as const

export const COMPASS_DAY_ONE_INSIGHTS_CAPTION = 'Three things worth knowing before you start'

/** ⚠ THE SECTION'S OWN HEADING CHANGES TOO. The loaded band is headed "What
 *  your answers show", which on day one would be promising a read-out of
 *  answers nobody has given yet. Hers reads "Rubi insights" there. */
export const COMPASS_DAY_ONE_INSIGHTS_HEADING = 'Rubi insights'
