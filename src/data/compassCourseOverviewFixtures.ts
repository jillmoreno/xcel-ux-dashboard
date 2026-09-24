/**
 * The Compass course OVERVIEW page's content, as the design draws it — Figma
 * "Atlas-Compass-Global-Navigation" node 44:2211 (2026-09-23).
 *
 * IT IS THE DESIGN'S "DAY ONE" STATE, and that is the thing to know. The frame
 * shows a learner who has not started: 0 of 42 lessons, "Begin Course", a
 * "Day one" pill, assignments "Not started", and copy that says the plan and
 * the readiness ring set after the first check. It does NOT follow the demo's
 * Progress control — so while the demo learner is 62% through (the Home page,
 * and the Compass rail's "% Complete"), this page still reads as day one. The
 * course TITLE and the learner's name are real; everything here is sample.
 *
 * The assignment weightings ("22% of exam") are the design's, not XCEL's
 * published exam outline. Replace this object with real data — or add the
 * other states — when the page has a source; `CompassCourseOverview` renders
 * whatever it is given.
 */
export type CompassOverviewAssignment = {
  id: string
  label: string
  /** The design's share-of-exam line, printed as written. */
  weight: string
  readiness: string
  suggested: string
}

export type CompassOverviewTip = {
  id: string
  /** Picks the tip's icon — see `TIP_ICONS` in `CompassCourseOverview`. */
  kind: 'spacing' | 'testing' | 'knowing'
  topic: string
  title: string
  body: string
}

export const COMPASS_OVERVIEW_DAY_ONE_FROM_DESIGN = {
  facts: {
    targetExamDate: 'December 15, 2026',
    leftToComplete: '27 days',
    completed: '0 of 42 lessons',
  },
  nextLesson: {
    number: 1,
    part: 'part 1 of 3',
    title: 'Life Insurance Policy Provisions, Options and Riders',
  },
  cta: 'Begin Course',
  stage: 'Day one',
  ringLabel: ['Beginning', 'Your', 'Journey'],
  whereTitle: 'Start off on the right foot — Rubi keeps up as you change.',
  whereBody:
    "Compass measures how ready you are the way an exam does — from what you can do, not how much time you put in. Your ring starts filling in after your first check, and moves a little every session as Rubi learns what's sticking and what isn't.",
  rubi: {
    eyebrow: 'Rubi suggests',
    title: 'Meet Rubi, your learning guide',
    body: "Rubi will pace your plan, resurface what's slipping, and adjust as you go. Take a quick tour to see how it works.",
    cta: 'Learn more',
  },
  assignmentsNote: 'Sorted by how much they count on the exam · plan sets after your first check',
  assignments: [
    {
      id: 'provisions',
      label: 'Provisions',
      weight: '22% of exam',
      readiness: 'Not started',
      suggested: 'After your check',
    },
    {
      id: 'health-disability',
      label: 'Health & disability',
      weight: '20% of exam',
      readiness: 'Not started',
      suggested: 'After your check',
    },
  ] satisfies CompassOverviewAssignment[],
  insightsNote: 'Three things worth knowing before you start',
  tips: [
    {
      id: 'spacing',
      kind: 'spacing',
      topic: 'spacing',
      title: 'Short and often beats one long sitting',
      body: 'Three 30-minute sessions across a week stick better than one 90-minute cram, even if the total time is the same. Compass is built around that rhythm.',
    },
    {
      id: 'testing',
      kind: 'testing',
      topic: 'testing yourself',
      title: 'Testing yourself works better than re-reading',
      body: "Pulling an answer out of your head — even getting it wrong — makes it stick better than reading the material a second time. That's why flashcards and checks show up as often as reading.",
    },
    {
      id: 'knowing',
      kind: 'knowing',
      topic: 'knowing what you know',
      title: 'The topics you feel most sure about often hide the biggest gaps',
      body: "When Rubi spots a gap between how you rate yourself and how you actually score, that's the best place to spend time — not the topics that already feel hard.",
    },
  ] satisfies CompassOverviewTip[],
} as const
