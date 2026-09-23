/**
 * STUDY JOURNEY — the sequence derivation, split from the component.
 *
 * A separate module for the `prototypeLockUtil` reason: `react-refresh` wants a
 * component file to export only components, and `journeyStopsFor` has to be
 * importable by a test — the degrade that matters is a milestone silently
 * reading as a lesson, and a `queryByText` on the title passes either way.
 *
 * `synthCategoryCourses` lives here too, rather than in the detail panel that
 * used to own it, so the panel's per-category course lists and the journey's
 * stops are built by ONE function. On the QE Focused version those lists sit
 * directly below the band the journey is in; a second derivation would
 * contradict them on the same screen.
 */
import {
  coursesWithDerivedStatus,
  type LearningPathCategory,
  type LearningPathSummary,
} from '@/data/learningFixtures'
import type { CourseCardData } from '@/components/courses/CourseCard'
import { resolvePathCategories } from './progressGaugeUtil'
import { unitCount } from '@/utils/unitLabel'
import {
  NY_LH_COURSE_EXAM_ITEMS,
  NY_LH_PREP_REVIEW_LESSONS,
} from '@/data/nyProducerRequirements'

/**
 * Synthesize a category's course rows from its hour requirement.
 *
 * Moved out of `LearningPathDetailPanel` 2026-09-16 and shared with
 * `StudyJourneyRail` — see this file's header.
 */
export function synthCategoryCourses(
  cat: LearningPathCategory,
  state?: string,
  unit = 'hrs',
  /**
   * The category's REAL chapter titles, when they are known.
   *
   * Supplied only by the detail panel's Course Breakdown (2026-09-17). When
   * present, one row per chapter replaces the synthesized single row, so that
   * list reads as the course's actual contents rather than as its label
   * repeated.
   *
   * The JOURNEY deliberately does not pass it: its four stops are the
   * programme's shape, and eleven chapters in that column would bury the shape
   * in the contents — which is the same argument the `lessons` no-split rule
   * below already makes.
   *
   * Hours are divided evenly across the rows and the REMAINDER goes to the last
   * one, so the rows still sum to `cat.required` exactly. That matters because
   * the section header prints `completed / required` from the category, not
   * from these rows, and two totals that disagree by a rounding error is the
   * kind of thing nobody tracks down later.
   */
  chapters?: readonly string[],
): CourseCardData[] {
  if (chapters && chapters.length > 0) {
    const each = Math.floor(cat.required / chapters.length)
    const rows: CourseCardData[] = chapters.map((title, i) => ({
      id: `${cat.key}-ch-${i + 1}`,
      title,
      hours: i === chapters.length - 1 ? cat.required - each * (chapters.length - 1) : each,
      state: state ?? 'National',
      delivery: 'online',
      badge: 'mandatory',
      status: 'not-started',
      progress: 0,
    }))
    return coursesWithDerivedStatus(rows, cat.completed)
  }
  /*
   * ONE ROW PER DAY when the path is measured in days — 2026-09-16.
   *
   * An hours path splits a large category in half ("· Part 1 / · Part 2"),
   * because 40 credit hours is not a sequence of anything and halving it is an
   * arbitrary but harmless way to give the list two rows.
   *
   * A DAYS path is different: the unit IS the sequence. XCEL's own 7 Day Study
   * Guide is a day-by-day schedule, so one row per day makes the journey the
   * study plan rather than a summary of it — Day 1 … Day 5 of the pre-licensing
   * course, then Day 6 the Prep Review, then Day 7 the simulators. Halving it
   * would print "Pre-licensing Course · Part 1 (3 days)", which is a unit the
   * guide does not use.
   *
   * Which day number a row carries is its position in the WHOLE plan, not
   * within its category, so the seven rows read 1…7 across the three parts.
   * `dayOffset` is passed by the caller because a category does not know what
   * came before it.
   */
  /*
   * WHETHER TO SPLIT depends on the unit, and the rule is about what the unit
   * MEANS rather than how big the number is.
   *
   *   - **hrs** — halve a large category ("· Part 1 / · Part 2"). 40 credit
   *     hours is not a sequence of anything, so halving is arbitrary but
   *     harmless, and it gives a long list two rows instead of one.
   *   - **lessons** — do NOT split. The 42 lessons ARE the pre-licensing
   *     course, and the course is one part of the journey (the first). Forty-two
   *     rows would bury the programme's shape in its contents, and splitting
   *     them 21/21 invents a boundary the course does not have.
   *
   * A days path used to split one row per day; that model is gone, and the rule
   * is kept unit-driven so the next unit says what it wants here rather than
   * inheriting whatever the last one needed.
   */
  const parts =
    unit === 'hrs' && cat.required > 15
      ? [Math.ceil(cat.required / 2), Math.floor(cat.required / 2)]
      : [cat.required]
  const rows: CourseCardData[] = parts.map((hours, i) => ({
    id: `${cat.key}-${i + 1}`,
    title: parts.length > 1 ? `${cat.label} · Part ${i + 1}` : cat.label,
    hours,
    state: state ?? 'National',
    delivery: 'online',
    badge: 'mandatory',
    status: 'not-started',
    progress: 0,
  }))
  return coursesWithDerivedStatus(rows, cat.completed)
}

/** One stop on the journey. */
export type JourneyStop = {
  id: string
  title: string
  /** Category label, e.g. "Pre-License Education" — the group it belongs to. */
  group: string
  /** Credit hours. `null` for the two COMPLETION TASKS, which are steps rather
   *  than coursework and carry no hour requirement — see `COMPLETION_STOPS`. */
  hours: number | null
  /**
   * How many of `hours` are done, when the stop is a counted one.
   *
   * Added 2026-09-16 so the first stop can read the way the LMS course card
   * does — "26 / 42 lessons" rather than "42 lessons". Under the hours model a
   * category split into two rows and each row's own status carried the story;
   * with one uncounted-then-counted stop the row has to say how far through it
   * is, or the only number on it is the denominator.
   */
  completed?: number
  status: 'completed' | 'in-progress' | 'not-started'
  /** Percent, only when in progress. */
  progress?: number
  /** An assessment rather than a lesson — drawn as a milestone. */
  milestone: boolean
  /**
   * Cannot be started yet, because the coursework above it is unfinished.
   *
   * Only the completion tasks use it. "Not started" would be a lie for a step
   * the product will not let you take — the same reason the Licence & renewals
   * notification says WHY its switch is disabled instead of quietly ignoring
   * the preference.
   */
  blocked?: boolean
}

/**
 * The two COMPLETION TASKS that close out the course, from XCEL's published
 * certificate-eligibility rules: submit the student attestation, then download
 * and print the certificate through the dashboard.
 *
 * They are stops on the journey rather than a third section because they happen
 * INSIDE the LMS and XCEL knows whether they are done — which is exactly the
 * line that puts Schedule / Pass / Apply in `GET_LICENSED_STEPS` instead.
 *
 * They carry NO HOURS. A credit-hour figure on "print your certificate" would
 * make it look like coursework and would land in the gauge's denominator, which
 * is the state's hour requirement and must not grow by two.
 *
 * Source: https://www.xcelsolutions.com/new-york/insurance-license/requirements
 */
/**
 * Parts 2 and 3 of XCEL's 3-Part Training Program, as journey steps that carry
 * NO count.
 *
 * Added 2026-09-16 when the measure became lessons. Only Part 1 is counted —
 * the course card states "0 of 42 lessons completed" and the storefront states
 * no lesson, section or chapter count for the other two — so they cannot be
 * requirement categories without a number being invented for them, which is the
 * move the hour figures taught us not to make.
 *
 * They are still on the journey, because leaving them off would say the
 * programme ends with the coursework. The product page is explicit that it does
 * not: "You may be tempted to stop only after Part 1... your key to passing the
 * first time will be to complete the entire 3 part training program."
 *
 * The meta carries what IS published — Part 2's 80% chapter-exam target, and
 * that there are three simulators, each unlocked by the previous.
 *
 * `blocked` follows the real rule rather than being decoration: Parts 2 and 3
 * unlock "upon completion of Part 1", which the page states outright.
 */
/**
 * THE FIVE STEPS, 1:1 WITH THE LMS'S OWN BREADCRUMB — 2026-09-23, the direct
 * ask, against a screenshot of the product's step strip:
 *
 *   `Pre-Licensing (41) · Exam (1) · Prep Review · Simulated Exams · Survey`
 *
 * and the five titles Jillienne specified from it:
 *
 *   1. Pre-Licensing Lessons   2. Course Exam (1) & Attestation   3. Prep Review (23)
 *   4. Simulated Exams         5. Survey & Certificate
 *
 * WHAT CHANGED, and it is more than a rename. The journey had FOUR stops
 * (Pre-licensing Course → Prep Review Course → Exam Simulators → Attestation &
 * Certificate) built from what the public storefront publishes. The LMS shows a
 * FIFTH act the storefront never mentions — the course exam that closes Part 1
 * — and puts it SECOND, before Prep Review. The old order implied a learner
 * takes the prep course before the exam it prepares nothing for; the real
 * sequence is exam first, prep review after.
 *
 * ATTESTATION MOVED. It was half of the closing stop ("Attestation &
 * Certificate"); it rides with the exam now, and the closing stop is the survey
 * and the certificate. Both pairings are Jillienne's, from the product; neither
 * is derivable from anything in this repo.
 *
 * THE NUMBERING FOLLOWS AUTOMATICALLY. `StudyJourneyWidget` prints
 * `Steps 01–NN` off `stops.length` and starts the licensing cards at
 * `stepStart`, so a fifth stop renumbers Schedule State Exam and the rest from
 * 05/06/07 to 06/07/08 with no edit. That is the payoff of the derivation the
 * widget's own note argued for.
 */
const COURSE_EXAM_STOP: { id: string; title: string; group: string; milestone: boolean } = {
  id: 'course-exam-and-attestation',
  /* "Course Exam", not "Exam" — 2026-09-23, the direct ask. The strip this
     was copied from says "Exam", and it can: it sits inside the course, where
     there is only one exam to mean. This rail does not. Three steps below it
     is Simulated Exams, and two CARDS below that are Schedule State Exam and
     Pass State Exam — so a bare "Exam" on a column holding four of them names
     the wrong one about as often as the right one. */
  title: `Course Exam (${NY_LH_COURSE_EXAM_ITEMS}) & Attestation`,
  // 70% is the storefront's recommended score for Part 1's course exams, which
  // is the one published fact about this step.
  group: 'Part 1 · aim for 70%',
  // An assessment, so it draws with the milestone node the simulators use.
  milestone: true,
}

const PROGRAM_PART_STOPS: { id: string; title: string; group: string; milestone: boolean }[] = [
  {
    id: 'prep-review-course',
    // The count is the LMS's, not ours — see `NY_LH_PREP_REVIEW_LESSONS`. It
    // rides on the LABEL and nowhere near the gauge's denominator.
    title: `Prep Review (${NY_LH_PREP_REVIEW_LESSONS})`,
    group: 'Part 2 · aim for 80%',
    milestone: false,
  },
  {
    id: 'exam-simulators',
    /* "Simulated Exams", the LMS's own words, replacing "Exam Simulators"
       — the storefront's. The id keeps the old spelling deliberately: nothing
       displays it, and changing it would churn every test that reaches for the
       stop by id for no gain. */
    title: 'Simulated Exams',
    // Three, each unlocked by the previous — the page's own words. An
    // assessment, so it draws as a milestone the way the old simulators
    // category did.
    group: 'Part 3 · 3 simulators, aim for 85%',
    milestone: true,
  },
]

/*
 * ONE STOP, not two, as of 2026-09-16 — "Attestation & Certificate".
 *
 * It was "Complete Student Attestation" and "Download and Print Certificate of
 * Completion". They are still two ACTS in XCEL's published certificate-
 * eligibility rules, and nothing about that changed; what changed is that they
 * are one MOMENT on this rail. The learner does them back to back at the end of
 * the coursework, they unlock together, and neither is ever true without the
 * other — so two rows spent two of the journey's five stops on one wrap-up, and
 * with the blocked meta lines gone they were two long titles saying "certificate"
 * twice.
 *
 * Splitting them back is re-adding the second entry here; nothing else reads
 * these ids.
 */
const COMPLETION_STOPS: { id: string; title: string; group: string }[] = [
  {
    id: 'attestation-and-certificate',
    /* "Survey & Certificate" as of 2026-09-23 — the attestation half moved up
       to ride with the course exam (see `COURSE_EXAM_STOP`), and the LMS's own
       strip ends on a Survey the storefront never mentions. The id is unchanged
       for the reason the simulators' is: nothing displays it. */
    title: 'Survey & Certificate',
    group: 'Course completion',
  },
]

/** Category keys that are assessments rather than coursework. */
const MILESTONE_KEYS = new Set(['simulators', 'exam-cram'])

/**
 * Flatten a path's categories into one ordered sequence.
 *
 * Exported so a test can assert the ORDER and the milestone marking without
 * going through the DOM — the degrade that matters here is a milestone silently
 * reading as a lesson, and a `queryByText` on the title passes either way. The
 * same reason the Links panel tests its type degrade at the store.
 */
export function journeyStopsFor(path: LearningPathSummary): JourneyStop[] {
  const cats = resolvePathCategories(path)
  const courseStops: JourneyStop[] = cats.flatMap((cat) => {
    const rows = synthCategoryCourses(cat, path.state, path.unitLabel ?? 'hrs')
    return rows.map((course) => ({
      id: course.id,
      title: course.title,
      group: cat.label,
      hours: course.hours,
      // Only when the row IS the whole category. A SPLIT category's rows each
      // derive their own status from the waterfall and would each need their
      // own slice of `completed`; read off `rows` rather than re-deriving the
      // split rule, so the two cannot disagree.
      completed: rows.length === 1 ? cat.completed : undefined,
      status: course.status === 'completed'
        ? ('completed' as const)
        : course.status === 'in-progress'
          ? ('in-progress' as const)
          : ('not-started' as const),
      progress: course.status === 'in-progress' ? course.progress : undefined,
      milestone: MILESTONE_KEYS.has(cat.key),
    }))
  })
  if (courseStops.length === 0) return courseStops
  // The completion tasks come last and unlock together, once every hour of
  // coursework is done. `blocked` rather than `not-started` until then: the
  // product will not let you attest to finishing a course you have not
  // finished, and a step that reads "Not started" invites a click that cannot
  // work.
  const courseworkDone = courseStops.every((s) => s.status === 'completed')
  // Parts 2 and 3 sit between the coursework and the completion tasks, and only
  // when the path is measured in LESSONS — an hours path still models them as
  // requirement categories of their own, so adding them here too would print
  // each one twice.
  const partStops: JourneyStop[] =
    (path.unitLabel ?? 'hrs') === 'lessons'
      ? PROGRAM_PART_STOPS.map((part) => ({
          ...part,
          hours: null,
          // COMPLETE ONCE THE COURSEWORK IS — 2026-09-21, the direct ask:
          // "100% means the Attestation and certificate step is complete.
          // Step 1–4 is part of the course." Parts 2 and 3 are inside that
          // definition, so they finish with it.
          status: courseworkDone ? ('completed' as const) : ('not-started' as const),
          blocked: !courseworkDone,
        }))
      : []
  /*
   * STEP 1 AND STEP 2, on the lessons path only.
   *
   * The course stop's title is RETITLED HERE rather than at its source, and the
   * distinction matters. Its source is the requirement category's `label`
   * ("Pre-licensing Course") in `dashboardProgressFixtures`, which also names a
   * SEGMENT OF THE PROGRESS GAUGE. "Pre-Licensing (41)" is a journey step's
   * name; a gauge segment reading "(41)" beside a bar already showing 26/42
   * would be two counts of different things touching. So the rename lands on
   * the journey's copy of the title and nowhere else.
   *
   * ONLY WHEN THERE IS ONE COURSE STOP. An hours path splits into several, and
   * retitling the first of those would name a New York step on a Florida path.
   *
   * NO COUNT IN THE LABEL as of 2026-09-23 ("Change to Pre-Licensing Lessons").
   * It read "Pre-Licensing (41)" for an hour. The 41 is still recorded — see
   * `NY_LH_PRELICENSING_LESSON_COUNT`, which the Compass tree's 42nd row
   * depends on — it is just not on this label. The other two counts stay,
   * because 23 and 1 appear nowhere else on the screen and 41 sits three inches
   * under a card already printing "26 of 42 lessons".
   */
  const lessonsPath = (path.unitLabel ?? 'hrs') === 'lessons'
  const namedCourseStops =
    lessonsPath && courseStops.length === 1
      ? [{ ...courseStops[0], title: 'Pre-Licensing Lessons' }]
      : courseStops
  /* The course exam sits between the coursework and Part 2 — the LMS's order,
     and the reason this is not just a rename. `blocked` on the same rule as
     Parts 2 and 3: you cannot sit the exam for a course you have not finished,
     and "Not started" would invite a click that cannot work. */
  const examStops: JourneyStop[] = lessonsPath
    ? [
        {
          ...COURSE_EXAM_STOP,
          hours: null,
          status: courseworkDone ? ('completed' as const) : ('not-started' as const),
          blocked: !courseworkDone,
        },
      ]
    : []
  return [
    ...namedCourseStops,
    ...examStops,
    ...partStops,
    ...COMPLETION_STOPS.map((task) => ({
      ...task,
      hours: null,
      /* ⚠ THIS NOTE USED TO SAY THEY ARE NEVER COMPLETED. It read: "Nothing in
         the fixtures records an attestation or a certificate download, so they
         are never `completed` in the demo. When a real feed exists this is
         where it lands." That was true of the DATA and is now overridden by a
         definition — 2026-09-21, the direct ask: "100% means the Attestation
         and certificate step is complete. Step 1–4 is part of the course."

         So finishing the coursework IS finishing these, by definition rather
         than by a feed. Worth knowing which it is: a real attestation service
         would replace this line, and until one exists the demo is asserting
         that the two always move together. */
      status: courseworkDone ? ('completed' as const) : ('not-started' as const),
      milestone: false,
      blocked: !courseworkDone,
    })),
  ]
}

/** The stop's state, in words. See the note at the call site. */
export function statusWords(stop: JourneyStop): string {
  if (stop.status === 'completed') return 'Completed'
  if (stop.status === 'in-progress') {
    return stop.progress != null ? `In progress · ${stop.progress}%` : 'In progress'
  }
  // A blocked step says WHY, rather than "Not started" — which reads as an
  // invitation to a click that cannot work.
  if (stop.blocked) return 'After your coursework'
  return 'Not started'
}

/** The stop's meta line — group, hours when it has them, then the status. The
 *  completion tasks have no hours, and printing "null hrs" is how a
 *  non-coursework step ends up looking like coursework. */
export function metaWords(stop: JourneyStop, unit = 'hrs'): string {
  // `unitCount` rather than an interpolation: "1 days" reads as a bug, and the
  // same rule is needed by the bars, the KPI cell and the detail sheet.
  // "26 / 42 lessons" when the stop knows how far through it is — the LMS
  // course card's own sentence — and a bare "42 lessons" otherwise.
  const count =
    stop.hours == null
      ? null
      : stop.completed != null
        ? `${stop.completed} / ${unitCount(stop.hours, unit)}`
        : unitCount(stop.hours, unit)
  return [stop.group, count, statusWords(stop)]
    .filter(Boolean)
    .join(' · ')
}
