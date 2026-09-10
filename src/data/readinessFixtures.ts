import type { Brand } from '@/context/AccountContext'

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
  /** 0-100. The headline number in the gauge. */
  score: number
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
 * Readiness for a brand. Brand-keyed for the same reason every fixture here is
 * — the `Record<Brand, …>` fails to compile until a new brand has an entry.
 */
const READINESS_BY_BRAND: Record<Brand, ReadinessData> = {
  xcel: XCEL_FL_LH_READINESS,
}

export function readinessFor(brand: Brand): ReadinessData {
  return READINESS_BY_BRAND[brand]
}
