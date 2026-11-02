// TODO(data): replace with the real Transcripts API. These records are a
// FIXTURE, and the completion dates below are INVENTED — see the warning under
// "Where the figures come from".

import type { Brand } from '@/context/AccountContext'
import { FIXTURE_TODAY } from './myCoursesFixtures'

/**
 * THE TRANSCRIPT — a learner's course history, 2026-11-02.
 *
 * Implements the design at Figma `I3NdgJJrSQ5A5oBRC3fStO`, node `2009:28153`
 * (the frame is named "Licenses_All" in that file; it is the Transcripts page,
 * and it carries this page's disclaimer copy verbatim). Cross-checked against
 * the live McKissock page at `/account/transcripts`.
 *
 * ⚠ IT IS NOT THE CERTIFICATES PAGE, and the difference is the whole reason it
 * exists. Certificates lists what the learner has been ISSUED — one card per
 * earned document, with a reporting status, because its job is proof. A
 * transcript is the HISTORY: every course taken, including the ones that
 * produced no certificate at all. Hence the zero-hour rows in the design's own
 * data ("How to Add Courses to CE Membership"), which have no certificate
 * behind them and never will.
 *
 * ⚠ AND IT IS NOT THE COURSE LIBRARY EITHER. `myCoursesFixtures` is what the
 * learner can still DO — weighted toward in-progress and not-started, because
 * it feeds the My Courses status tabs. Across every brand it holds exactly one
 * completed record with a completion date, so a transcript derived from it
 * would be one row long. A history needs completions, and completions are what
 * that file is short of, so this is its own list rather than a view over it.
 *
 * WHAT A ROW IS: one completed enrolment. A course taken twice is two rows —
 * a retake is a separate completion with its own date, and a board that asks
 * for a transcript is asking what was completed and when, not what is on the
 * shelf.
 *
 * ── Where the figures come from ───────────────────────────────────────────
 *
 * ⚠ EVERY COMPLETION DATE AND EVERY ENROLMENT DATE BELOW IS INVENTED, and so
 * is the 2024–2025 history entirely. The titles, hour counts and state are
 * real — they are the XCEL course library's own (`_XCEL_COURSES`), so the
 * transcript reads as the same learner's past — and the two professions are
 * `certificateFixtures`' own strings, so the two surfaces cannot disagree
 * about what a course counts toward.
 *
 * The invented values are listed for confirmation in the dev handoff rather
 * than buried here; this project has been bitten by invented figures that
 * nobody wrote down (the Texas hour counts). Nothing here should reach a
 * customer before Product has confirmed it.
 *
 * ⚠ THE STATE IS A FULL NAME, not the two-letter code `MyCourseRecord.state`
 * carries. That follows the design (which reads "North Carolina", "Tennessee",
 * "Georgia") and `certificateFixtures`, whose `state` is already a full name.
 * The live page shows codes; the design is what was asked for.
 */
export type TranscriptRecord = {
  /** Stable row id. `t-` prefixed so it cannot be confused with a course or
   *  certificate id — a transcript row is a completion, not either of those. */
  id: string
  /** The course this completion was for, when there is one in the library.
   *  Absent for a non-credit item that was never a catalogue course. */
  courseId?: string
  title: string
  /** "License Type/Profession" in the design — what the hours counted toward. */
  profession: string
  /** Full state name, e.g. "Florida". See the warning above. */
  state: string
  /** Credit hours. ZERO IS A REAL VALUE: a non-credit item earns none and
   *  still belongs on the history. Do not filter these out. */
  hours: number
  /** ISO yyyy-mm-dd. */
  enrolledDate: string
  /** ISO yyyy-mm-dd. Every row has one — an incomplete course has no
   *  completion and so has no row. */
  completedDate: string
}

const PRELICENSE = 'Insurance Pre-Licensing'
const CE = 'Insurance Continuing Education'

/**
 * XCEL — a Florida producer's history: the 3-Part Training Program they
 * licensed with, then the CE topics they have renewed with since, plus the two
 * non-credit how-tos the platform itself logs.
 */
const _XCEL_TRANSCRIPT: readonly TranscriptRecord[] = [
  // ── 2026, the current compliance year ──────────────────────────────────
  {
    id: 't-xcel-ethics',
    courseId: 'mc-xcel-ethics',
    title: 'Insurance Ethics',
    profession: CE,
    state: 'Florida',
    hours: 5,
    enrolledDate: '2026-03-11',
    completedDate: '2026-04-10',
  },
  {
    id: 't-xcel-annuity-training',
    courseId: 'mc-xcel-annuity-training',
    title: 'Annuity Initial Training',
    profession: CE,
    state: 'Florida',
    hours: 4,
    enrolledDate: '2026-02-20',
    completedDate: '2026-03-05',
  },
  {
    id: 't-xcel-ltc-training',
    courseId: 'mc-xcel-ltc-training',
    title: 'Long-Term Care Initial Training',
    profession: CE,
    state: 'Florida',
    hours: 8,
    enrolledDate: '2026-01-19',
    completedDate: '2026-02-11',
  },
  {
    id: 't-xcel-flood-nfip',
    courseId: 'mc-xcel-flood-nfip',
    title: 'Flood Insurance (NFIP) Training',
    profession: CE,
    state: 'Florida',
    hours: 3,
    enrolledDate: '2026-01-19',
    completedDate: '2026-02-06',
  },
  {
    id: 't-xcel-personal-lines',
    title: 'Personal Lines Pre-Licensing — Completion',
    profession: PRELICENSE,
    state: 'Texas',
    hours: 20,
    enrolledDate: '2025-12-02',
    completedDate: '2026-01-24',
  },
  /* A NON-CREDIT ROW, and the design has one of its own. Zero hours, no
     certificate, no course in the catalogue — it is a platform how-to the
     history still records. It is here because a transcript that silently drops
     them is not the history it claims to be. */
  {
    id: 't-xcel-howto-ce',
    title: 'How to Add Courses to CE Membership',
    profession: CE,
    state: 'Florida',
    hours: 0,
    enrolledDate: '2026-01-04',
    completedDate: '2026-01-04',
  },

  // ── 2025 ────────────────────────────────────────────────────────────────
  {
    id: 't-xcel-annuity-suitability',
    courseId: 'mc-xcel-annuity-suitability',
    title: 'Annuity Suitability Update',
    profession: CE,
    state: 'Florida',
    hours: 4,
    enrolledDate: '2025-09-14',
    completedDate: '2025-10-02',
  },
  {
    id: 't-xcel-health-marketplace',
    courseId: 'mc-xcel-health-marketplace',
    title: 'Health Insurance Marketplace and ACA Update',
    profession: CE,
    state: 'Florida',
    hours: 3,
    enrolledDate: '2025-09-14',
    completedDate: '2025-09-30',
  },
  {
    id: 't-xcel-adjuster-law',
    courseId: 'mc-xcel-adjuster-law-archived',
    title: 'Florida Adjuster Law and Ethics Update',
    profession: CE,
    state: 'Florida',
    hours: 5,
    enrolledDate: '2025-04-08',
    completedDate: '2025-05-19',
  },
  {
    id: 't-xcel-ethics-assessment',
    courseId: 'mc-xcel-ethics-assessment',
    title: 'Insurance Ethics Assessment',
    profession: CE,
    state: 'Florida',
    hours: 1,
    enrolledDate: '2025-04-08',
    completedDate: '2025-04-22',
  },
  {
    id: 't-xcel-howto-qe',
    title: 'How to Add Courses to QE Subscription',
    profession: PRELICENSE,
    state: 'Florida',
    hours: 0,
    enrolledDate: '2025-02-17',
    completedDate: '2025-02-17',
  },

  // ── 2024, the licensing year ───────────────────────────────────────────
  {
    id: 't-xcel-lh-prelicense',
    courseId: 'mc-xcel-lh-prelicense',
    title: 'Life & Health Pre-License Course',
    profession: PRELICENSE,
    state: 'Florida',
    hours: 24,
    enrolledDate: '2024-08-19',
    completedDate: '2024-10-04',
  },
  {
    id: 't-xcel-prep-review',
    courseId: 'mc-xcel-prep-review',
    title: 'Prep Review Course',
    profession: PRELICENSE,
    state: 'Florida',
    hours: 8,
    enrolledDate: '2024-08-19',
    completedDate: '2024-10-11',
  },
  {
    id: 't-xcel-livestream-review',
    courseId: 'mc-xcel-livestream-review',
    title: 'Livestream Exam Review — Life & Health',
    profession: PRELICENSE,
    state: 'Florida',
    hours: 6,
    enrolledDate: '2024-08-19',
    completedDate: '2024-10-18',
  },
  {
    id: 't-xcel-exam-cram',
    courseId: 'mc-xcel-exam-cram',
    title: 'Exam Cram — Life & Health',
    profession: PRELICENSE,
    state: 'Florida',
    hours: 2,
    enrolledDate: '2024-08-19',
    completedDate: '2024-10-21',
  },
]

/**
 * Per-brand transcripts, keyed exactly as `_MY_COURSES_BY_BRAND` and
 * `certificatesFor`'s own map are — `Brand` is a one-member union today, so
 * this has one entry, and a second brand adds a list here rather than a branch
 * at every call site.
 */
const _TRANSCRIPT_BY_BRAND: Record<Brand, readonly TranscriptRecord[]> = {
  xcel: _XCEL_TRANSCRIPT,
}

/**
 * The learner's transcript, NEWEST COMPLETION FIRST.
 *
 * Sorted here rather than left to the caller because that is the order the
 * design shows and the order a transcript means: a history reads backwards from
 * now. The table's own sort starts on this column, in this direction, so the
 * first paint and the unsorted data agree.
 */
export function transcriptsFor(brand: Brand): TranscriptRecord[] {
  return [...(_TRANSCRIPT_BY_BRAND[brand] ?? [])].sort((a, b) =>
    b.completedDate.localeCompare(a.completedDate),
  )
}

/** The design's three filters (node 2009:28289). */
export type TranscriptFilter = 'all' | 'this-year' | 'previous-years'

/**
 * ⚠ "THIS YEAR" IS THE DEMO'S YEAR, NOT THE WALL CLOCK'S. Every dated surface
 * in this prototype reads `FIXTURE_TODAY`, which the Demo bar can shift by whole
 * days — so a transcript that asked `new Date()` would disagree with the course
 * cards and the certificates beside it the moment anyone moved that control, and
 * would silently empty the "Completed This Year" tab on 1 January.
 */
export function transcriptYear(today: Date = FIXTURE_TODAY): number {
  return today.getFullYear()
}

/** Apply the pill filter. The year comes from `transcriptYear`. */
export function filterTranscripts(
  rows: readonly TranscriptRecord[],
  filter: TranscriptFilter,
  today: Date = FIXTURE_TODAY,
): TranscriptRecord[] {
  if (filter === 'all') return [...rows]
  const year = transcriptYear(today)
  return rows.filter((r) => {
    const rowYear = Number(r.completedDate.slice(0, 4))
    return filter === 'this-year' ? rowYear === year : rowYear < year
  })
}

/**
 * The search box matches what its placeholder promises and nothing else —
 * course name, profession and state (node I2009:28287). Hours and the two dates
 * are deliberately NOT searched: a learner typing "4" means a course with 4 in
 * its name far more often than every four-hour course, and a date typed in any
 * format a person would use does not match the ISO the record stores.
 */
export function searchTranscripts(
  rows: readonly TranscriptRecord[],
  query: string,
): TranscriptRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...rows]
  return rows.filter((r) =>
    [r.title, r.profession, r.state].some((field) => field.toLowerCase().includes(q)),
  )
}

/** `2026-04-10` → `4/10/2026`, as the certificate card and its panel write it. */
export function formatTranscriptDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${m}/${d}/${y}`
}

/** The total beside the pill strip — "Showing 15 Results" (node 2009:28296).
 *  Singular at one, because "Showing 1 Results" is the kind of thing a
 *  stakeholder notices and nobody can unsee. */
export function showingLabel(count: number): string {
  return `Showing ${count} Result${count === 1 ? '' : 's'}`
}
