/**
 * THE REFINED READINESS PAGE — 2026-11-09, the third Compass version.
 *
 * Jeff's Readiness page (`compassJeffMvpFixtures.ts` → `JEFF_MVP_READINESS`)
 * audited against Nina Conrad's "Compass Rapid Insights: Your Exam Prep"
 * (15 unmoderated sessions, UserTesting, the 58% and 86% Overview
 * prototypes). The ten findings and what each one changed are in the
 * component's header comment; this file is the DATA the refined page reads.
 *
 * ⚠ THIS IS NOT A PORT, SO IT IS NOT "RE-EXTRACT, DON'T HAND-EDIT". Jeff's
 * fixture is evaluated out of his code so his numbers arrive intact; this one
 * is authored, and the numbers are HIS — same 62, same five topics, same
 * sub-topic scores — so the two pages can be compared on the same learner.
 * What differs is that nothing here is pre-rendered: bands, the points to
 * Ready, the pace, the weeks to the exam are all DERIVED by the helpers below.
 * The research's fourth finding ("58% of 85%", "27 to ready") was a page
 * stating numbers whose relationship it never explained; the fix is copy
 * that interpolates, which only holds if the copy and the data cannot drift.
 *
 * ⚠ EVERY NUMBER IN A SENTENCE COMES FROM HERE. Jeff's template wrote "your
 * lowest sub-topic at 41" as a literal; here the component asks
 * `weakestSubTopic()` and prints what it gets.
 */

export type ReadinessBandKey = 'beginner' | 'developing' | 'proficient' | 'ready'

export type ReadinessBand = {
  key: ReadinessBandKey
  label: string
  /** Inclusive. */
  min: number
  /** Inclusive. */
  max: number
  /** Plain-language meaning, for the "What the levels mean" panel. */
  text: string
}

/** The four levels. `READY_AT` is the threshold the whole page keys off. */
export const READY_AT = 85

export const READINESS_BANDS: readonly ReadinessBand[] = [
  { key: 'beginner', label: 'Beginner', min: 0, max: 39, text: 'Still learning the basics. Read the lessons, then practice.' },
  { key: 'developing', label: 'Developing', min: 40, max: 64, text: 'You know some of it. Practice your weakest sub-topics to close the gaps.' },
  { key: 'proficient', label: 'Proficient', min: 65, max: 84, text: 'Solid. A few gaps left before you are exam ready.' },
  { key: 'ready', label: 'Ready', min: READY_AT, max: 100, text: 'Consistently right across the topic. A short review each week keeps it that way.' },
] as const

export function bandFor(score: number): ReadinessBand {
  const s = Math.max(0, Math.min(100, Math.round(score)))
  return READINESS_BANDS.find((b) => s >= b.min && s <= b.max) ?? READINESS_BANDS[0]
}

export function pointsToReady(score: number): number {
  return Math.max(0, READY_AT - Math.round(score))
}

export type RefinedSubTopic = {
  name: string
  score: number
  /** Days since the learner last answered a question in this sub-topic. */
  lastPracticedDaysAgo: number
  /** The short set Rubi would hand them. */
  questions: number
  minutes: number
}

export type RefinedTopic = {
  name: string
  /** Share of the exam blueprint, in whole percent. */
  weight: number
  answered: number
  total: number
  score: number
  /** Change over the trend window. */
  delta: number
  subTopics: readonly RefinedSubTopic[]
}

export type RefinedTrendPoint = { label: string; score: number }

export type RefinedReadiness = {
  /** Blueprint-weighted average of the topic scores — the one number. */
  overall: number
  /** Over `trendWeeks`. */
  delta: number
  trendWeeks: number
  trend: readonly RefinedTrendPoint[]
  questionsAnswered: number
  questionsTotal: number
  /** Full-length exam simulators sat so far — the third ring on the
   *  three-ring hero, and the activity the research's Prototype 2 learners
   *  pointed at when they said why "Ready" was believable. */
  simulatorsTaken: number
  simulatorsTotal: number
  /** ISO date of the learner's planned state exam. */
  plannedExamOn: string
  /** "Today" for the demo — fixed so the page is stable in a screenshot and
   *  in a test. Weeks-to-exam is derived from these two, never typed. */
  today: string
  topics: readonly RefinedTopic[]
}

/**
 * The learner Jeff's page shows — 62%, Developing, five topics — with an exam
 * date added, because the research's own prototype carried one ("Planned
 * state exam Aug 14 · 16 days out") and the pace sentence needs it.
 *
 * ⚠ THE EXAM IS DELIBERATELY SOONER THAN THE PACE REACHES READY. At 2 points
 * a week, 23 points is ~12 weeks; the exam is 10 weeks out. The honest
 * sentence is "you'd get there about 2 weeks after your exam at this pace",
 * which is the one the page has to be able to say. A demo where the pace
 * always comfortably clears the date would never show that state.
 */
export const REFINED_READINESS: RefinedReadiness = {
  overall: 62,
  delta: 6,
  trendWeeks: 3,
  trend: [
    { label: 'Oct 15', score: 56 },
    { label: 'Oct 22', score: 58 },
    { label: 'Oct 29', score: 60 },
    { label: 'Today', score: 62 },
  ],
  questionsAnswered: 122,
  questionsTotal: 265,
  simulatorsTaken: 1,
  simulatorsTotal: 3,
  today: '2026-11-09',
  plannedExamOn: '2027-01-18',
  topics: [
    {
      name: 'Annuities',
      weight: 20,
      answered: 22,
      total: 55,
      score: 52,
      delta: 5,
      subTopics: [
        { name: 'Variable annuities', score: 41, lastPracticedDaysAgo: 3, questions: 12, minutes: 12 },
        { name: 'Annuity taxation', score: 55, lastPracticedDaysAgo: 5, questions: 10, minutes: 10 },
        { name: 'Fixed and indexed annuities', score: 58, lastPracticedDaysAgo: 2, questions: 10, minutes: 10 },
      ],
    },
    {
      name: 'Policy Provisions',
      weight: 22,
      answered: 26,
      total: 60,
      score: 58,
      delta: 4,
      subTopics: [
        { name: 'Riders', score: 47, lastPracticedDaysAgo: 4, questions: 12, minutes: 12 },
        { name: 'Nonforfeiture options', score: 55, lastPracticedDaysAgo: 6, questions: 10, minutes: 10 },
        { name: 'Settlement options', score: 63, lastPracticedDaysAgo: 9, questions: 10, minutes: 10 },
        { name: 'Grace period & reinstatement', score: 67, lastPracticedDaysAgo: 1, questions: 8, minutes: 8 },
      ],
    },
    {
      name: 'Insurance Regulation',
      weight: 18,
      answered: 20,
      total: 45,
      score: 61,
      delta: 1,
      subTopics: [
        { name: 'Florida licensing rules', score: 54, lastPracticedDaysAgo: 7, questions: 12, minutes: 12 },
        { name: 'Unfair trade practices', score: 63, lastPracticedDaysAgo: 3, questions: 10, minutes: 10 },
        { name: 'Replacement & agent duties', score: 66, lastPracticedDaysAgo: 2, questions: 8, minutes: 8 },
      ],
    },
    {
      name: 'Health Insurance',
      weight: 18,
      answered: 24,
      total: 45,
      score: 66,
      delta: 2,
      subTopics: [
        { name: 'Disability income', score: 59, lastPracticedDaysAgo: 4, questions: 12, minutes: 12 },
        { name: 'Medical expense plans', score: 68, lastPracticedDaysAgo: 2, questions: 10, minutes: 10 },
        { name: 'Medicare & supplements', score: 71, lastPracticedDaysAgo: 1, questions: 8, minutes: 8 },
      ],
    },
    {
      name: 'Life Insurance',
      weight: 22,
      answered: 30,
      total: 60,
      score: 74,
      delta: 3,
      subTopics: [
        { name: 'Policy types: term, whole, universal', score: 67, lastPracticedDaysAgo: 2, questions: 12, minutes: 12 },
        { name: 'Underwriting & insurable interest', score: 76, lastPracticedDaysAgo: 3, questions: 8, minutes: 8 },
        { name: 'Owners & beneficiaries', score: 79, lastPracticedDaysAgo: 1, questions: 8, minutes: 8 },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Derivations. Pure, so a test can pin each one.                      */
/* ------------------------------------------------------------------ */

/** Date-only difference in whole days. `Date.UTC` on both sides, the lesson
 *  the LMS repo's three `daysUntil` copies taught: a local-midnight minus
 *  `Date.now()` reads one low for most of the day. */
export function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number)
  const [ty, tm, td] = toIso.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}

export function daysToExam(r: RefinedReadiness = REFINED_READINESS): number {
  return daysBetween(r.today, r.plannedExamOn)
}

export function weeksToExam(r: RefinedReadiness = REFINED_READINESS): number {
  return Math.round(daysToExam(r) / 7)
}

/** Points per week over the trend window. */
export function pacePerWeek(r: RefinedReadiness = REFINED_READINESS): number {
  return r.trendWeeks > 0 ? r.delta / r.trendWeeks : 0
}

/** Weeks to reach Ready at the current pace; `null` when there is no pace to
 *  project from (a flat or falling trend), which the copy has to handle rather
 *  than print "Infinity weeks". */
export function weeksToReady(r: RefinedReadiness = REFINED_READINESS): number | null {
  const pace = pacePerWeek(r)
  const gap = pointsToReady(r.overall)
  if (gap === 0) return 0
  if (pace <= 0) return null
  return Math.ceil(gap / pace)
}

export type PaceVerdict =
  | { kind: 'ready' }
  | { kind: 'on-track'; weeksToReady: number; weeksToExam: number }
  | { kind: 'behind'; weeksToReady: number; weeksToExam: number; weeksShort: number; neededPerWeek: number }
  | { kind: 'no-pace'; weeksToExam: number; neededPerWeek: number }

/**
 * The research's suggested replacement for "27 to ready": a prediction of
 * time or effort. It is a VERDICT rather than a number so the component can
 * pick the sentence — the same figure means different things depending on
 * whether the exam is before or after it.
 */
export function paceVerdict(r: RefinedReadiness = REFINED_READINESS): PaceVerdict {
  const toReady = weeksToReady(r)
  const toExam = weeksToExam(r)
  const gap = pointsToReady(r.overall)
  if (toReady === 0) return { kind: 'ready' }
  const neededPerWeek = toExam > 0 ? Math.ceil((gap / toExam) * 10) / 10 : gap
  if (toReady === null) return { kind: 'no-pace', weeksToExam: toExam, neededPerWeek }
  if (toReady <= toExam) return { kind: 'on-track', weeksToReady: toReady, weeksToExam: toExam }
  return { kind: 'behind', weeksToReady: toReady, weeksToExam: toExam, weeksShort: toReady - toExam, neededPerWeek }
}

/** The lowest-scoring sub-topic on the page, with its parent — the one
 *  recommendation the hero makes. Ties go to the heavier topic, because a point
 *  there moves the weighted overall more. */
export function weakestSubTopic(r: RefinedReadiness = REFINED_READINESS): { topic: RefinedTopic; sub: RefinedSubTopic } {
  let best: { topic: RefinedTopic; sub: RefinedSubTopic } | null = null
  for (const topic of r.topics) {
    for (const sub of topic.subTopics) {
      if (!best || sub.score < best.sub.score || (sub.score === best.sub.score && topic.weight > best.topic.weight)) {
        best = { topic, sub }
      }
    }
  }
  if (!best) throw new Error('weakestSubTopic: no sub-topics')
  return best
}

/** The sub-topic that has gone longest without practice, excluding the
 *  weakest (which the hero already names) — the "also worth a look" line. */
export function stalestSubTopic(r: RefinedReadiness = REFINED_READINESS): { topic: RefinedTopic; sub: RefinedSubTopic } | null {
  const weakest = weakestSubTopic(r).sub
  let best: { topic: RefinedTopic; sub: RefinedSubTopic } | null = null
  for (const topic of r.topics) {
    for (const sub of topic.subTopics) {
      if (sub === weakest) continue
      if (!best || sub.lastPracticedDaysAgo > best.sub.lastPracticedDaysAgo) best = { topic, sub }
    }
  }
  return best
}

/** Topics sorted weakest first — the order the research said people wanted
 *  ("I can see my weakest area and jump straight in"). */
export function topicsWeakestFirst(r: RefinedReadiness = REFINED_READINESS): RefinedTopic[] {
  return [...r.topics].sort((a, b) => a.score - b.score)
}

export function topicsReady(r: RefinedReadiness = REFINED_READINESS): number {
  return r.topics.filter((t) => t.score >= READY_AT).length
}

export function formatExamDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function lastPracticedLabel(days: number): string {
  if (days === 0) return 'Practiced today'
  if (days === 1) return 'Practiced yesterday'
  return `Practiced ${days} days ago`
}
