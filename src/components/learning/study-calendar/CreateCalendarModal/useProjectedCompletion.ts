import { useMemo } from 'react'
import {
  findCreateCalendarOption,
  type CreateCalendarOption,
} from '@/data/createCalendarOptions'
import type { WeekDay } from './StudyDaysToggle'

/**
 * Computes the projected completion date for a Create-Calendar form
 * configuration. Pure — re-runs only when one of its inputs changes.
 *
 * The math: starting from `startDate` (or today if blank), walk the
 * calendar forward day-by-day. Only count a day toward the
 * `option.taskCount` budget when it falls on a selected study day
 * AND, if `omitNyseHolidays` is on, it isn't a NYSE-recognized
 * holiday. When the budget is exhausted, add `option.bufferDays` to
 * land the final projected date.
 *
 * For the demo we stub the holiday list rather than wiring real NYSE
 * data — the math still reflects the inputs (toggling
 * `omitNyseHolidays` shifts the date), which is the demo's only
 * requirement.
 *
 * TODO(data): swap `STUBBED_NYSE_HOLIDAYS_2026` for a real lookup
 * (e.g. from the engagement service) once the back-end exposes one.
 */
export type ProjectedCompletion =
  | { state: 'empty'; reason: string }
  | {
      state: 'filled'
      date: Date
      formattedDate: string
      daysFromStart: number
      nyseHolidaysExcluded: number
      bufferDaysIncluded: number
    }

type Args = {
  assignedCalendarId: string | null
  startDate: string | null
  studyDays: WeekDay[]
  omitNyseHolidays: boolean
  /** Override "today" for deterministic snapshots / tests. */
  today?: Date
}

export function useProjectedCompletion({
  assignedCalendarId,
  startDate,
  studyDays,
  omitNyseHolidays,
  today,
}: Args): ProjectedCompletion {
  return useMemo(
    () =>
      computeProjectedCompletion({
        assignedCalendarId,
        startDate,
        studyDays,
        omitNyseHolidays,
        today,
      }),
    [assignedCalendarId, startDate, studyDays, omitNyseHolidays, today],
  )
}

/* ─── Pure compute, exported for tests ─────────────────────────────── */

export function computeProjectedCompletion(args: Args): ProjectedCompletion {
  const { assignedCalendarId, startDate, studyDays, omitNyseHolidays } = args
  const today = args.today ?? new Date()

  const option = findCreateCalendarOption(assignedCalendarId)
  if (!option || studyDays.length === 0) {
    return {
      state: 'empty',
      reason:
        'Please select course length and start date to display the projected end of your coursework.',
    }
  }

  // Anchor: explicit startDate, or today if blank.
  const start = parseIsoDate(startDate) ?? stripTime(today)

  const projection = walkProjection({
    start,
    taskCount: option.taskCount,
    studyDays,
    omitNyseHolidays,
    option,
  })

  return {
    state: 'filled',
    date: projection.completionDate,
    formattedDate: formatLongDate(projection.completionDate),
    daysFromStart: projection.daysFromStart,
    nyseHolidaysExcluded: projection.nyseHolidaysExcluded,
    bufferDaysIncluded: option.bufferDays,
  }
}

/* ─── Internals ────────────────────────────────────────────────────── */

type WalkResult = {
  completionDate: Date
  daysFromStart: number
  nyseHolidaysExcluded: number
}

function walkProjection({
  start,
  taskCount,
  studyDays,
  omitNyseHolidays,
  option,
}: {
  start: Date
  taskCount: number
  studyDays: WeekDay[]
  omitNyseHolidays: boolean
  option: CreateCalendarOption
}): WalkResult {
  // Budget: roughly 3 tasks per study day, matching the production
  // copy ("~3 tasks per study day"). We need enough study-days to
  // cover the task count, so divide+ceil.
  const studyDaysNeeded = Math.ceil(taskCount / 3)

  const studyDaySet = new Set(studyDays)
  let cursor = new Date(start)
  let studyDaysCounted = 0
  let nyseHolidaysExcluded = 0

  while (studyDaysCounted < studyDaysNeeded) {
    const dow = cursor.getDay() as WeekDay
    if (studyDaySet.has(dow)) {
      const iso = toIsoDate(cursor)
      if (omitNyseHolidays && STUBBED_NYSE_HOLIDAYS_2026.has(iso)) {
        nyseHolidaysExcluded += 1
      } else {
        studyDaysCounted += 1
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  // Cursor is now the day AFTER the last study day. Pull it back to
  // the last study day, then add buffer.
  cursor.setDate(cursor.getDate() - 1)
  cursor.setDate(cursor.getDate() + option.bufferDays)

  const daysFromStart = Math.round(
    (cursor.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  )

  return { completionDate: cursor, daysFromStart, nyseHolidaysExcluded }
}

/* Stubbed NYSE 2026 holiday list — enough variety to make the
   "excluded" sub-line reflect the toggle. Replace with real data
   from the engagement service when wired. */
const STUBBED_NYSE_HOLIDAYS_2026 = new Set<string>([
  '2026-01-01', // New Year's Day
  '2026-01-19', // MLK Day
  '2026-02-16', // Presidents' Day
  '2026-04-03', // Good Friday
  '2026-05-25', // Memorial Day
  '2026-06-19', // Juneteenth
  '2026-07-03', // Independence Day (observed)
  '2026-09-07', // Labor Day
  '2026-11-26', // Thanksgiving
  '2026-12-25', // Christmas
])

function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatLongDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
