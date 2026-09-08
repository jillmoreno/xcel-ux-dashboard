/**
 * Pure helpers for the Edit Calendar panel's live validation. Drives
 * the three-state banner (OK / warning / error) and the disabled state
 * on the Save button.
 *
 * Thresholds are colocated here as constants — in production these
 * would come from the app's curriculum config (per-exam), not from a
 * hardcoded module-level constant. They're tuned for the demo data.
 */

import type { StudyCalendar } from '@/data/studyCalendarFixtures'

export const HARD_MINIMUM_STUDY_DAYS = 15
export const SOFT_MINIMUM_STUDY_DAYS = 25

export type ScheduleInput = {
  startDate: string
  examDate: string
  daysPerWeek: number
  bufferDays: number
}

export type ValidationState =
  | { kind: 'ok'; availableStudyDays: number; message: string }
  | { kind: 'warning'; availableStudyDays: number; message: string }
  | {
      kind: 'error'
      availableStudyDays: number
      message: string
      earliestExamDate: string | null
    }
  // Pristine setup — examDate is empty. Don't show an error before the
  // user has had a chance to engage; surface a neutral prompt instead.
  // The Save CTA stays disabled in this state because there's no valid
  // date to pace against yet.
  | { kind: 'info'; availableStudyDays: 0; message: string }

function parseIso(iso: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d))
}

function toIso(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d.getTime())
  next.setUTCDate(next.getUTCDate() + n)
  return next
}

function countWeekdaysBetween(start: Date, endExclusive: Date): number {
  if (endExclusive.getTime() <= start.getTime()) return 0
  let count = 0
  const cursor = new Date(start.getTime())
  while (cursor.getTime() < endExclusive.getTime()) {
    const dow = cursor.getUTCDay()
    if (dow !== 0 && dow !== 6) count += 1
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return count
}

/**
 * Available study days = weekdays between startDate (inclusive) and
 * examDate − bufferDays (exclusive), scaled by daysPerWeek / 5, rounded
 * to the nearest integer.
 */
export function getAvailableStudyDays(input: ScheduleInput): number {
  const start = parseIso(input.startDate)
  const exam = parseIso(input.examDate)
  if (!start || !exam) return 0
  const cutoff = addDays(exam, -Math.max(0, input.bufferDays))
  const weekdays = countWeekdaysBetween(start, cutoff)
  const scaled = weekdays * (Math.max(1, input.daysPerWeek) / 5)
  return Math.max(0, Math.round(scaled))
}

/**
 * Project forward from startDate to find the earliest examDate that
 * yields at least HARD_MINIMUM_STUDY_DAYS. Capped at +730 days to
 * guarantee termination on pathological inputs.
 */
export function getEarliestExamDate(input: ScheduleInput): string | null {
  const start = parseIso(input.startDate)
  if (!start) return null
  for (let offset = 1; offset <= 730; offset += 1) {
    const candidate = addDays(start, offset)
    const days = getAvailableStudyDays({
      startDate: input.startDate,
      examDate: toIso(candidate),
      daysPerWeek: input.daysPerWeek,
      bufferDays: input.bufferDays,
    })
    if (days >= HARD_MINIMUM_STUDY_DAYS) return toIso(candidate)
  }
  return null
}

function formatHumanDate(iso: string): string {
  const d = parseIso(iso)
  if (!d) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function validateSchedule(
  input: ScheduleInput,
  today: string,
): ValidationState {
  const start = parseIso(input.startDate)
  const exam = parseIso(input.examDate)
  const todayDate = parseIso(today)
  const days = getAvailableStudyDays(input)

  // Pristine state — no exam date yet. Surface a neutral prompt rather
  // than a red error so a first-time setup doesn't open with the form
  // already in a failed state.
  if (!exam) {
    return {
      kind: 'info',
      availableStudyDays: 0,
      message: 'Pick your target exam date to preview your study schedule.',
    }
  }

  if (exam && todayDate && exam.getTime() < todayDate.getTime()) {
    return {
      kind: 'error',
      availableStudyDays: days,
      message: 'Exam date must be in the future.',
      earliestExamDate: null,
    }
  }
  if (start && exam && exam.getTime() <= start.getTime()) {
    return {
      kind: 'error',
      availableStudyDays: days,
      message: 'Target date must be after your start date.',
      earliestExamDate: null,
    }
  }
  if (days < HARD_MINIMUM_STUDY_DAYS) {
    const earliest = getEarliestExamDate(input)
    const dayWord = input.daysPerWeek === 1 ? 'day' : 'days'
    const earliestPhrase = earliest
      ? `Try ${formatHumanDate(earliest)} or later`
      : 'Try a much later target date'
    return {
      kind: 'error',
      availableStudyDays: days,
      message: `With ${input.daysPerWeek} ${dayWord}/week you need at least ${HARD_MINIMUM_STUDY_DAYS} study sessions. ${earliestPhrase} — or increase your days per week.`,
      earliestExamDate: earliest,
    }
  }
  if (days < SOFT_MINIMUM_STUDY_DAYS) {
    return {
      kind: 'warning',
      availableStudyDays: days,
      message: `Only ${days} study days available. This is a tight schedule — consider more days per week or a later target date.`,
    }
  }
  return {
    kind: 'ok',
    availableStudyDays: days,
    message: `${days} study days available — solid pacing.`,
  }
}

/** Convenience: pull the four input fields off a StudyCalendar. */
export function scheduleInputFromCalendar(
  c: Pick<StudyCalendar, 'startDate' | 'examDate' | 'daysPerWeek' | 'bufferDays'>,
): ScheduleInput {
  return {
    startDate: c.startDate,
    examDate: c.examDate,
    daysPerWeek: c.daysPerWeek,
    bufferDays: c.bufferDays,
  }
}
