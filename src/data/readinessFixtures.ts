import type { Brand } from '@/context/AccountContext'
import { DEFAULT_COURSE, type CourseId } from './courseFixtures'

/**
 * Exam Readiness — the data behind the `readiness` rail section.
 *
 * Ported from Figma "Exam Summary" (file woOd62dQQyPvtqJ6ZRO0qF, nodes
 * 1092:230527 / :230931 / :231435 — ONE screen in the three states of its
 * Chapter & Topic filter, not three screens).
 *
 * **The design is a real-estate course and XCEL sells insurance**, so nothing
 * here is the Figma's own content: the chapters are Florida Life & Health
 * pre-licensing, and the exams are XCEL's three Exam Simulators. The SHAPE is
 * the design's — a score, a course-progress panel, and a chapter/topic
 * breakdown split by whether the learner should review it.
 *
 * ── The distinction this file is built on ───────────────────────────────────
 * The design's left rail lists "Final Exams" and "Practice Exams" separately,
 * and that is not a labelling choice — it is the same split the FinServ exam
 * task-type spec found in `StudyTaskKind`, where the existing `'exam'` means
 * the PRACTICE exam (course-linked, sat in the LMS) and the external licensing
 * exam needs its own key. Practice attempts are ours and we score them;
 * licensing attempts happen at PSI and we only record the outcome. They are
 * modelled as two lists here for that reason, not merged into "attempts".
 */

/** Where a chapter or topic sits against the review threshold. */
export type ReadinessBand = 'review' | 'shaky' | 'strong'

/**
 * Score → band. ONE rule, used by the chapter dots, the topic bars and the
 * "I Should Review" filter, so a chapter can never be dotted red while sitting
 * in the "I Know This" list.
 *
 * The thresholds are INVENTED — the design shows the colours but states no
 * rule, and XCEL has published none. 60/80 is the obvious reading of the
 * mock (its greens start at 80, its ambers sit in the 50s–70s). Replace with
 * the real thresholds; do not tune them to make a screenshot look better.
 */
export const REVIEW_THRESHOLD = 60
export const STRONG_THRESHOLD = 80

/**
 * The Florida 2-15 pass mark, and the ONLY number on this page that is not
 * invented — the state sets it.
 *
 * The gauge's green band starts here rather than at `STRONG_THRESHOLD`, which
 * is the change that made the arc mean something: "green" now reads as "at or
 * above the mark you have to clear", not as "above a number we chose". It is
 * also why the gauge dropped its red band — see `ReadinessGauge`.
 *
 * `EXAM_FACTS` in ReadinessPanel renders this same figure. It reads the
 * constant; a second literal is how the arc and the stated pass mark drift
 * apart, and the two sitting one tab from each other makes that especially
 * cheap to get wrong.
 */
export const PASS_MARK = 70
export function bandFor(pct: number): ReadinessBand {
  if (pct >= STRONG_THRESHOLD) return 'strong'
  if (pct >= REVIEW_THRESHOLD) return 'shaky'
  return 'review'
}

export type ReadinessChapter = {
  /** Display number, kept as a string so "01" survives. */
  number: string
  title: string
  /** Percent correct across this chapter's questions. */
  pct: number
}

export type ReadinessTopic = {
  title: string
  pct: number
}

/** One sitting of an exam — practice or licensing. */
export type ExamAttempt = {
  id: string
  /** ISO date of the sitting. */
  date: string
  /** Percent score. `null` for a licensing attempt with no released score. */
  score: number | null
  passed: boolean
  /** Which exam was sat — the simulator's name, or the licensing exam's. */
  label: string
}

export type CourseProgressStat = {
  label: string
  /** Rendered right-aligned: "20 of 20", "90%". */
  value: string
  /** 0-100 for the rows that draw a bar. Omit for a plain figure. */
  pct?: number
}

export type ReadinessData = {
  /** The path this readiness is for — the heading says so, because a learner
   *  with two paths must not have to guess which one is being scored. */
  pathTitle: string
  /**
   * The licence's jurisdiction, threaded so the gauge's pass mark and the
   * "On the day" facts table read ONE source (`examFactsFor`). Optional: a
   * brand with no populated path has no sitting to describe, and the helper
   * falls back to Florida — the licence every other XCEL fixture is authored
   * against — rather than rendering an empty facts table.
   *
   * ⚠ SET BY THE FIXTURE SINCE 2026-10-15, not by the caller. It was
   * documented as "set by `useReadiness`, because it comes from the learner's
   * PATH rather than from the readiness state" — and nothing ever set it, so
   * every state fell through to the Florida default. That was invisible while
   * Florida was the only course. It is the COURSE's jurisdiction now, which is
   * the same fact the fixture already carries in its `pathTitle`, so the two
   * cannot disagree.
   */
  examState?: string
  /** 0-100, or `null` for a learner who has answered nothing. `null` is NOT
   *  zero: zero is a score, and it would earn an OFF TRACK chip a learner who
   *  has not sat a question has not earned. */
  score: number | null
  /** What the score is built from, in the learner's words. */
  scoreExplanation: string
  /** The frequency statement. See `READINESS_FREQUENCY_NOTE`. */
  frequencyNote: string
  progress: CourseProgressStat[]
  chapters: ReadinessChapter[]
  topics: ReadinessTopic[]
  practiceExams: ExamAttempt[]
  licensingExams: ExamAttempt[]
}

/**
 * The credibility sentence, and it is NOT the design's.
 *
 * The Figma explains the score's inputs and stops. The XCEL learner
 * walk-through (`public/prototypes/xcel-lms-walkthrough.html`) had already
 * answered the harder half of this — its readiness screen states a FREQUENCY
 * rather than a probability ("an estimate, not a prediction · about 7 in 10
 * passed first time") precisely so a score cannot be read as a promise. That
 * decision is older than this screen and survives it.
 *
 * Keep both sentences: the design's says what went in, this one says what it
 * does and does not mean. Dropping it turns a score into a prediction, which
 * is the failure the walk-through was built to avoid.
 */
export const READINESS_FREQUENCY_NOTE =
  'An estimate, not a prediction. Of learners who sat with a similar score, about 7 in 10 passed first time.'

/**
 * Florida Life & Health Pre-Licensing — the path `learningFixtures` marks as
 * XCEL's active exam-prep path, so the readiness page and the Current Learning
 * Progress band are talking about the same course.
 *
 * The chapter set is the real Florida 2-15 syllabus shape (general insurance
 * principles → life → health → Florida law), not the design's real-estate
 * chapters. Scores are authored to span all three bands with a realistic
 * skew — most of the pain in the Florida-law and health-policy chapters,
 * which is where it actually is.
 */
const XCEL_FL_LH_READINESS: ReadinessData = {
  pathTitle: 'Florida Life & Health Pre-Licensing',
  // STATED rather than left to the fallback, 2026-10-15. `examFactsFor`
  // defaults to Florida, so this changes nothing on screen — but with a second
  // course on the axis, "Florida because it was authored as Florida" and
  // "Florida because nobody said" need to be different things in the file.
  examState: 'FL',
  score: 47,
  scoreExplanation:
    'This score combines how much of the course you have completed with how you have scored on practice exams and simulator attempts. To improve your chance of passing, aim for the green before your next attempt.',
  frequencyNote: READINESS_FREQUENCY_NOTE,
  progress: [
    { label: 'Course Progress', value: '90%', pct: 90 },
    { label: 'Chapters Completed', value: '18 of 20' },
    { label: 'Topics Covered', value: '12 of 14' },
    { label: 'Total Questions Answered', value: '120 of 200' },
    { label: 'Answered Correctly', value: '56 of 120' },
  ],
  chapters: [
    { number: '01', title: 'Insurance Basics & Risk', pct: 37 },
    { number: '02', title: 'Contract Law & Policy Provisions', pct: 46 },
    { number: '03', title: 'Life Insurance Basics', pct: 55 },
    { number: '04', title: 'Life Policy Riders', pct: 10 },
    { number: '05', title: 'Annuities', pct: 89 },
    { number: '06', title: 'Group Life & Underwriting', pct: 33 },
    { number: '07', title: 'Health Policy Provisions', pct: 16 },
    { number: '08', title: 'Disability Income', pct: 73 },
    { number: '09', title: 'Medical Expense Plans', pct: 23 },
    { number: '10', title: 'Medicare & Medicare Supplements', pct: 68 },
    { number: '11', title: 'Long-Term Care', pct: 28 },
    { number: '12', title: 'Health Maintenance Organizations', pct: 13 },
    { number: '13', title: 'Taxation of Life & Health', pct: 76 },
    { number: '14', title: 'Florida Statutes & Rules', pct: 68 },
    { number: '15', title: 'Licensing & Appointment', pct: 90 },
    { number: '16', title: 'Marketing & Unfair Trade Practices', pct: 59 },
    { number: '17', title: 'Ethics & Fiduciary Duty', pct: 82 },
    { number: '18', title: 'Florida Law — Part 1', pct: 49 },
    { number: '19', title: 'Florida Law — Part 2', pct: 38 },
    { number: '20', title: 'Florida Law — Part 3', pct: 45 },
  ],
  topics: [
    { title: 'Policy Riders', pct: 5 },
    { title: 'HMO Structures', pct: 15 },
    { title: 'Florida Portion of Exam', pct: 30 },
    { title: 'Taxation', pct: 40 },
    { title: 'Group Underwriting', pct: 42 },
    { title: 'Disability Income', pct: 52 },
    { title: 'Medical Expense Plans', pct: 53 },
    { title: 'Medicare', pct: 59 },
    { title: 'Long-Term Care', pct: 65 },
    { title: 'Life Policy Types', pct: 70 },
    { title: 'Annuities', pct: 80 },
    { title: 'Contract Law', pct: 80 },
    { title: 'Ethics', pct: 82 },
    { title: 'Licensing Rules', pct: 97 },
  ],
  // XCEL's three Exam Simulators, which ARE its practice exams — the same
  // three courses `learningFixtures` puts in this path (lp-xcel-sim-1/2/3).
  practiceExams: [
    { id: 'pe-sim-3', date: '2026-04-12', score: 83, passed: true, label: 'Exam Simulator 3' },
    { id: 'pe-sim-2', date: '2026-03-19', score: 92, passed: true, label: 'Exam Simulator 2' },
    { id: 'pe-sim-1', date: '2026-03-07', score: 35, passed: false, label: 'Exam Simulator 1' },
  ],
  // The STATE exam, sat at PSI. One attempt, failed — which is what makes the
  // readiness score worth showing at all. A second attempt is not modelled:
  // the walk-through owns the retake arc.
  licensingExams: [
    {
      id: 'le-1',
      date: '2026-04-15',
      score: 43,
      passed: false,
      label: 'Florida 2-15 Licensing Exam · PSI',
    },
  ],
}

/**
 * Texas Life & Health Pre-Licensing — the Course control's second course,
 * added 2026-10-15.
 *
 * ⚠ IT IS NOT A RELABELLED FLORIDA, and that is the one thing that would have
 * been easy and wrong. Texas sits its Life & Health candidates on a paper that
 * splits into a GENERAL KNOWLEDGE portion and a TEXAS-SPECIFIC portion, so the
 * run below ends in Texas statutes and TDI rules where Florida's ends in three
 * Florida-law chapters — a different shape, not the same shape with the word
 * swapped. A reviewer flipping the Course control is meant to see the
 * curriculum change, not just the heading.
 *
 * ⚠ THE OUTLINE IS REPRESENTATIVE, NOT SOURCED. No Texas content outline
 * exists in this repo, and XCEL's Texas product page has not been read the way
 * the New York one was on 2026-09-16. The chapter NAMES are plausible demo
 * content; the SCORES are authored the way Florida's are, to span all three
 * bands with the pain where it realistically falls.
 *
 * TODO(data): replace with XCEL's published Texas Life & Health content
 * outline. Nothing here should be read as curriculum until that happens.
 *
 * The scores are deliberately NOT Florida's: a reviewer holding the two side
 * by side should be able to tell at a glance that the breakdown re-resolved
 * rather than re-rendered.
 */
const XCEL_TX_LH_READINESS: ReadinessData = {
  pathTitle: 'Texas Life & Health Pre-Licensing',
  examState: 'TX',
  score: 47,
  scoreExplanation:
    'This score combines how much of the course you have completed with how you have scored on practice exams and simulator attempts. To improve your chance of passing, aim for the green before your next attempt.',
  frequencyNote: READINESS_FREQUENCY_NOTE,
  progress: [
    { label: 'Course Progress', value: '90%', pct: 90 },
    { label: 'Chapters Completed', value: '16 of 18' },
    { label: 'Topics Covered', value: '11 of 13' },
    { label: 'Total Questions Answered', value: '120 of 200' },
    { label: 'Answered Correctly', value: '56 of 120' },
  ],
  chapters: [
    { number: '01', title: 'General Insurance Concepts', pct: 44 },
    { number: '02', title: 'Contract Law & Policy Provisions', pct: 51 },
    { number: '03', title: 'Types of Life Policies', pct: 62 },
    { number: '04', title: 'Life Policy Provisions, Options & Riders', pct: 18 },
    { number: '05', title: 'Annuities', pct: 85 },
    { number: '06', title: 'Group Life Insurance', pct: 29 },
    { number: '07', title: 'Life Underwriting & Policy Delivery', pct: 57 },
    { number: '08', title: 'Accident & Health Policy Provisions', pct: 21 },
    { number: '09', title: 'Disability Income & Related Insurance', pct: 70 },
    { number: '10', title: 'Medical Expense & Major Medical Plans', pct: 34 },
    { number: '11', title: 'Medicare & Medicare Supplements', pct: 63 },
    { number: '12', title: 'Long-Term Care & the Texas LTC Partnership', pct: 25 },
    { number: '13', title: 'Managed Care & HMOs', pct: 16 },
    { number: '14', title: 'Taxation of Life & Health Products', pct: 72 },
    { number: '15', title: 'Texas Insurance Code — General Provisions', pct: 48 },
    { number: '16', title: 'Texas Department of Insurance Rules', pct: 41 },
    { number: '17', title: 'Agent Licensing, Appointment & Renewal (TX)', pct: 88 },
    { number: '18', title: 'Texas Marketing Practices & Ethics', pct: 66 },
  ],
  topics: [
    { title: 'Policy Options & Riders', pct: 12 },
    { title: 'Managed Care & HMOs', pct: 18 },
    { title: 'Texas Portion of Exam', pct: 35 },
    { title: 'Long-Term Care', pct: 38 },
    { title: 'Medical Expense Plans', pct: 44 },
    { title: 'Group Underwriting', pct: 49 },
    { title: 'Health Policy Provisions', pct: 55 },
    { title: 'Medicare', pct: 61 },
    { title: 'Disability Income', pct: 68 },
    { title: 'Life Policy Types', pct: 73 },
    { title: 'Taxation', pct: 76 },
    { title: 'Annuities', pct: 84 },
    { title: 'Texas Licensing Rules', pct: 93 },
  ],
  // The same three XCEL Exam Simulators — they are a PRODUCT, not a state
  // requirement, so they carry across jurisdictions unchanged. Only the
  // licensing sitting below is Texas's.
  practiceExams: [
    { id: 'pe-sim-3', date: '2026-04-12', score: 81, passed: true, label: 'Exam Simulator 3' },
    { id: 'pe-sim-2', date: '2026-03-19', score: 88, passed: true, label: 'Exam Simulator 2' },
    { id: 'pe-sim-1', date: '2026-03-07', score: 39, passed: false, label: 'Exam Simulator 1' },
  ],
  licensingExams: [
    {
      id: 'le-1',
      date: '2026-04-15',
      score: 46,
      passed: false,
      // ⚠ INVENTED — the proctor for a Texas sitting is not confirmed. It is
      // the same guess `EXAM_FACTS_BY_STATE.TX` carries, and the two have to
      // agree: this label and that `where` sit one tab apart.
      label: 'Texas Life, Accident & Health Exam · Pearson VUE',
    },
  ],
}

/**
 * New York Life & Health Pre-Licensing — the Course control's third course,
 * added 2026-10-15 when New York joined the axis.
 *
 * ⚠ THE ONE FIXTURE HERE WHOSE EXAM FACTS ARE REAL. `examState: 'NY'` sends
 * the "On the day" table to `EXAM_FACTS_BY_STATE.NY`, which was confirmed on
 * 2026-09-16 against XCEL's published requirements page — 150 scored
 * questions, 150 minutes, 70%, PSI. Florida's are published too; only Texas's
 * are invented. That makes New York the one course where this page states
 * nothing it cannot support, which is worth knowing before anyone reaches for
 * a screenshot.
 *
 * ⚠ THE CHAPTER OUTLINE IS STILL REPRESENTATIVE. `NY_LH_GUIDE_CHAPTERS_PARTIAL`
 * is a partial extraction this repo deliberately never renders, and the course
 * is 42 lessons with no published chapter list. The 20 below are the shape of
 * a Life & Health syllabus ending in New York law, not XCEL's outline.
 *
 * TODO(data): replace with the real New York content outline if one ever
 * lands. The exam facts above do not need replacing.
 */
const XCEL_NY_LH_READINESS: ReadinessData = {
  pathTitle: 'New York Life and Health Pre-licensing',
  examState: 'NY',
  score: 47,
  scoreExplanation:
    'This score combines how much of the course you have completed with how you have scored on practice exams and simulator attempts. To improve your chance of passing, aim for the green before your next attempt.',
  frequencyNote: READINESS_FREQUENCY_NOTE,
  progress: [
    { label: 'Course Progress', value: '90%', pct: 90 },
    { label: 'Chapters Completed', value: '18 of 20' },
    { label: 'Topics Covered', value: '12 of 14' },
    { label: 'Total Questions Answered', value: '120 of 200' },
    { label: 'Answered Correctly', value: '56 of 120' },
  ],
  chapters: [
    { number: '01', title: 'Insurance Basics & Risk', pct: 41 },
    { number: '02', title: 'Contract Law & Policy Provisions', pct: 49 },
    { number: '03', title: 'Life Insurance Basics', pct: 58 },
    { number: '04', title: 'Life Policy Riders', pct: 14 },
    { number: '05', title: 'Annuities', pct: 87 },
    { number: '06', title: 'Group Life & Underwriting', pct: 31 },
    { number: '07', title: 'Health Policy Provisions', pct: 19 },
    { number: '08', title: 'Disability Income', pct: 71 },
    { number: '09', title: 'Medical Expense Plans', pct: 27 },
    { number: '10', title: 'Medicare & Medicare Supplements', pct: 65 },
    { number: '11', title: 'Long-Term Care', pct: 30 },
    { number: '12', title: 'Health Maintenance Organizations', pct: 17 },
    { number: '13', title: 'Taxation of Life & Health', pct: 74 },
    { number: '14', title: 'New York Insurance Law — General', pct: 52 },
    { number: '15', title: 'Licensing, Appointment & Renewal (NY)', pct: 89 },
    { number: '16', title: 'Marketing & Unfair Trade Practices', pct: 57 },
    { number: '17', title: 'Ethics & Fiduciary Duty', pct: 80 },
    { number: '18', title: 'NY Regulation 60 — Replacement', pct: 45 },
    { number: '19', title: 'NY Regulation 187 — Suitability', pct: 39 },
    { number: '20', title: 'Department of Financial Services Rules', pct: 47 },
  ],
  topics: [
    { title: 'Policy Riders', pct: 9 },
    { title: 'HMO Structures', pct: 17 },
    { title: 'New York Portion of Exam', pct: 33 },
    { title: 'Taxation', pct: 42 },
    { title: 'Group Underwriting', pct: 45 },
    { title: 'Disability Income', pct: 54 },
    { title: 'Medical Expense Plans', pct: 56 },
    { title: 'Medicare', pct: 61 },
    { title: 'Long-Term Care', pct: 66 },
    { title: 'Life Policy Types', pct: 72 },
    { title: 'Annuities', pct: 81 },
    { title: 'Contract Law', pct: 82 },
    { title: 'Ethics', pct: 84 },
    { title: 'Licensing Rules', pct: 95 },
  ],
  // XCEL's three Exam Simulators — a product, not a state requirement, so
  // they carry across jurisdictions unchanged.
  practiceExams: [
    { id: 'pe-sim-3', date: '2026-04-12', score: 84, passed: true, label: 'Exam Simulator 3' },
    { id: 'pe-sim-2', date: '2026-03-19', score: 90, passed: true, label: 'Exam Simulator 2' },
    { id: 'pe-sim-1', date: '2026-03-07', score: 37, passed: false, label: 'Exam Simulator 1' },
  ],
  licensingExams: [
    {
      id: 'le-1',
      date: '2026-04-15',
      score: 44,
      passed: false,
      // PSI is CONFIRMED for New York — the registration URL is on XCEL's own
      // requirements page. No warning marker needed, unlike Texas's.
      label: 'New York Insurance Producer Exam · PSI',
    },
  ],
}

/**
 * Readiness for a brand, per course.
 *
 * ⚠ IT WAS KEYED ON BRAND ALONE UNTIL 2026-10-15, and the brand was doing two
 * jobs: `xcel` meant both "this brand's readiness" and "the Florida Life &
 * Health course". That was true while Florida was the only course XCEL demoed
 * and became wrong the moment there were two. The nesting says which is which
 * — the outer key is the brand (so a `Record<Brand, …>` still fails to compile
 * until a new brand has an entry), the inner key is the course.
 */
const READINESS_BY_BRAND: Record<Brand, Record<CourseId, ReadinessData>> = {
  xcel: {
    fl: XCEL_FL_LH_READINESS,
    tx: XCEL_TX_LH_READINESS,
    ny: XCEL_NY_LH_READINESS,
  },
}

export function readinessFor(brand: Brand, course: CourseId = DEFAULT_COURSE): ReadinessData {
  return READINESS_BY_BRAND[brand][course]
}

/* ─── Demo states ──────────────────────────────────────────────────────── */

/**
 * The four readiness states the Demo Controls bar switches between, and the
 * ONLY axis on this page a reviewer can drive.
 *
 * `not-started` is genuinely different from the other three, not just a lower
 * score. A learner who has answered nothing has no percent-correct to report,
 * so the breakdown is EMPTY and there are no attempts — showing 20 chapters
 * with scores for someone who has not sat a question is the same incoherence
 * the CE path had when its gauge claimed six completed hours against a list
 * with none.
 */
export type ReadinessState = 'not-started' | 'off-track' | 'at-risk' | 'on-track'

export const READINESS_PICKER: { state: ReadinessState; label: string }[] = [
  { state: 'not-started', label: 'Not Started' },
  { state: 'off-track', label: 'Off Track' },
  { state: 'at-risk', label: 'At Risk' },
  { state: 'on-track', label: 'On Track' },
]

/**
 * Per-state overrides. The three SCORED states share one chapter/topic set and
 * shift it by `shift` points.
 *
 * That shift is a claim worth stating: a learner's relative strengths do not
 * change with their overall standing — the chapters that are hard stay hard —
 * what moves is the level. Authoring four independent 20-chapter sets would
 * say the opposite, that a stronger learner is strong at DIFFERENT things,
 * which is not what a readiness score means. Clamped to 0-100.
 *
 * The scores are chosen against `PASS_MARK` (70) and `AT_RISK_FRACTION` (0.2 of
 * the range, so at-risk begins at 50): 38 / 62 / 84 sit clearly inside their
 * bands rather than on the edges, so a reviewer clicking through sees three
 * unambiguous chips.
 */
const STATE_OVERRIDES: Record<
  ReadinessState,
  { score: number | null; shift: number; attempts: number; correct: number }
> = {
  'not-started': { score: null, shift: 0, attempts: 0, correct: 0 },
  'off-track': { score: 38, shift: -9, attempts: 1, correct: 26 },
  'at-risk': { score: 62, shift: 0, attempts: 2, correct: 42 },
  'on-track': { score: 84, shift: 22, attempts: 3, correct: 57 },
}

/**
 * Course progress for the readiness page.
 *
 * **PASSED IN, from whatever the HOME band is showing** — see `ReadinessPanel`,
 * which resolves it through `dashboardProgressPersonaFor`, the same call Home's
 * `MembershipOverview` makes with the same two flags.
 *
 * It went through the Study Plan's `progressPct` first (2026-09-09) and that
 * was wrong: the Study Plan counts TASKS in one path's calendar, while Home
 * follows the `dashboard-progress-state` demo axis and the education type.
 * Readiness pinned to the calendar would read 32% while Home read 63% and a
 * reviewer flipping the Progress dropdown would watch Home move and Readiness
 * sit still. Home is the number a stakeholder anchors on, so Readiness follows
 * Home.
 *
 * ── What varies by which axis ───────────────────────────────────────────────
 * Course progress follows the PROGRESS dropdown; the readiness score follows
 * the READINESS one. That separation is the section's whole point: how much of
 * the course you have covered and how well you are answering are different
 * facts, and a learner can be far along and not ready. The readiness states
 * therefore move ANSWERED CORRECTLY, never the progress figure.
 *
 * Not Started is the one crossover — a learner who has answered nothing has no
 * questions to report — but it still shows the course progress Home shows,
 * because reading coursework without sitting a practice exam is an ordinary
 * thing to have done.
 */
function progressStatsFor(
  coursePct: number,
  o: (typeof STATE_OVERRIDES)[ReadinessState],
  base: ReadinessData,
): CourseProgressStat[] {
  const pct = Math.max(0, Math.min(100, Math.round(coursePct)))
  const answered = o.score === null ? 0 : 120
  /* THE DENOMINATORS COME FROM THE COURSE, NOT FROM A LITERAL — 2026-10-15.
     They were `20` and `14` typed in, which was Florida's chapter and topic
     count and was correct while Florida was the only course. Texas runs 18
     chapters and 13 topics, so the literals would have had the stat cell
     reading "16 of 20" above a breakdown listing eighteen — the same class of
     disagreement `ProgressAgreement.test.tsx` exists to catch, one panel
     apart instead of one tab. */
  const chapters = base.chapters.length
  const topics = base.topics.length
  return [
    { label: 'Course Progress', value: `${pct}%`, pct },
    { label: 'Chapters Completed', value: `${Math.round((pct / 100) * chapters)} of ${chapters}` },
    { label: 'Topics Covered', value: `${Math.round((pct / 100) * topics)} of ${topics}` },
    { label: 'Total Questions Answered', value: `${answered} of 200` },
    { label: 'Answered Correctly', value: `${o.correct} of ${answered}` },
  ]
}

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/**
 * Readiness for a brand in a given demo state.
 *
 * `coursePct` is supplied by the caller rather than looked up here, so the data
 * layer stays free of flag reads and there is exactly one place that decides
 * which surface Readiness agrees with. See `ReadinessPanel`.
 */
export function readinessForState(
  brand: Brand,
  state: ReadinessState,
  coursePct: number,
  course: CourseId = DEFAULT_COURSE,
): ReadinessData {
  const base = READINESS_BY_BRAND[brand][course]
  const o = STATE_OVERRIDES[state]
  const empty = state === 'not-started'
  return {
    ...base,
    score: o.score,
    progress: progressStatsFor(coursePct, o, base),
    chapters: empty ? [] : base.chapters.map((c) => ({ ...c, pct: clampPct(c.pct + o.shift) })),
    topics: empty ? [] : base.topics.map((t) => ({ ...t, pct: clampPct(t.pct + o.shift) })),
    // Attempts accumulate with progress — the simulators are authored newest
    // first, so an earlier state has taken the LAST n of them.
    practiceExams: base.practiceExams.slice(base.practiceExams.length - o.attempts),
    // The licensing exam has only been sat by someone who got far enough to
    // book it. A "Not Started" learner with a failed state exam on record is a
    // contradiction a reviewer would notice immediately.
    licensingExams: o.attempts >= 2 ? base.licensingExams : [],
  }
}
