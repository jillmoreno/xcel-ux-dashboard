import type { StudyTask, StudyTaskStatus } from '@/data/studyCalendarFixtures'

/**
 * The Study Plan's status colour family — chip, day cell and task badge all
 * read this, so a status is one colour everywhere it appears.
 *
 * Lifted out of `InlineStudyCalendar` on 2026-09-10 when the Home week strip
 * needed the same colours: a day that reads "complete" green on the plan and
 * neutral grey on Home is the drift this file exists to prevent. The plan is
 * still the reference — this moved, it was not re-derived.
 */

/** The status facets a day can be filtered or coloured by. `custom` is not a
 *  status but a separate facet, which is why it sits outside `StudyTaskStatus`. */
export type StatusFilterKey = StudyTaskStatus | 'custom'

export const STATUS_CHIP_COLORS: Record<
  StatusFilterKey,
  { bg: string; fg: string; border: string }
> = {
  overdue: {
    bg: 'var(--color-warning-100)',
    fg: 'var(--color-warning-800)',
    border: 'var(--color-warning-500)',
  },
  'in-progress': {
    bg: 'var(--color-primary-100)',
    fg: 'var(--color-primary-800)',
    border: 'var(--color-primary-500)',
  },
  upcoming: {
    // To Do uses neutral-200 (not -100) so it visibly separates from the
    // default neutral-75 day-cell fill on STC.
    bg: 'var(--color-neutral-200)',
    fg: 'var(--color-neutral-darkest)',
    border: 'var(--color-neutral-400)',
  },
  completed: {
    bg: 'var(--color-success-100)',
    fg: 'var(--color-success-800)',
    border: 'var(--color-success-500)',
  },
  custom: {
    // Tertiary tone matches the CustomEventRow icon tile + day-cell
    // fallback dot, so the chip / row / cell all read as one
    // "custom-task" color family.
    bg: 'var(--color-tertiary-100)',
    fg: 'var(--color-tertiary-800)',
    border: 'var(--color-tertiary-500)',
  },
}

/**
 * One day's overall status, from its tasks.
 *
 * Precedence is OVERDUE → IN PROGRESS → COMPLETED → UPCOMING, and it is an
 * attention order rather than a progress order: a day holding one late task and
 * three finished ones is a day with a problem, and a day part-done is more
 * useful to surface than the fact that some of it is finished. It matches the
 * Study Plan's own chip order (`STATUS_CHIPS`), which is sorted the same way
 * and for the same reason.
 *
 * A day with no tasks returns `null` — "nothing due" is not a status, and
 * colouring it would make an empty Wednesday look like a state.
 */
export function dayStatusOf(
  tasks: StudyTask[],
  iso: string,
  today: string,
): StatusFilterKey | null {
  if (tasks.length === 0) return null
  const unfinished = tasks.filter((t) => t.status !== 'completed')
  if (unfinished.length > 0 && iso < today) return 'overdue'
  if (tasks.some((t) => t.status === 'in-progress')) return 'in-progress'
  if (unfinished.length === 0) return 'completed'
  return 'upcoming'
}
