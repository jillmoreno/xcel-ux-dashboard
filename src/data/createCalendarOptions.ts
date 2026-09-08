// TODO(data): replace with a real catalog lookup once the back-end
// exposes selectable Greenlight / Foundation tracks. Until then, these
// fixtures drive the Assign Calendar dropdown in the STC Create
// Calendar demo flow and the math behind the projected-completion
// readout in the same modal.

export type CreateCalendarOption = {
  id: string
  label: string
  /** Total tasks in the track. Used by the preview pane's 4-up stats. */
  taskCount: number
  /** Default pacing length in weeks — drives the projected-completion
   *  computation when no custom start date is set. */
  defaultWeeks: number
  /** Number of buffer days the back-end adds to the projected
   *  completion date. Surfaced verbatim in the readout's sub-line. */
  bufferDays: number
}

export const CREATE_CALENDAR_OPTIONS: CreateCalendarOption[] = [
  {
    id: 'series-7-greenlight',
    label: 'Series 7 — Greenlight Path (84 tasks · 8 weeks)',
    taskCount: 84,
    defaultWeeks: 8,
    bufferDays: 3,
  },
  {
    id: 'series-66-greenlight',
    label: 'Series 66 — Greenlight Path (62 tasks · 6 weeks)',
    taskCount: 62,
    defaultWeeks: 6,
    bufferDays: 3,
  },
  {
    id: 'series-24-greenlight',
    label: 'Series 24 — Greenlight Path (54 tasks · 5 weeks)',
    taskCount: 54,
    defaultWeeks: 5,
    bufferDays: 2,
  },
  {
    id: 'sie-foundation',
    label: 'SIE — Foundation Path (40 tasks · 4 weeks)',
    taskCount: 40,
    defaultWeeks: 4,
    bufferDays: 2,
  },
]

export function findCreateCalendarOption(
  id: string | null | undefined,
): CreateCalendarOption | null {
  if (!id) return null
  // Look across every option list so the projection helpers find the
  // option regardless of which path's calendar list it came from.
  for (const list of ALL_OPTION_LISTS) {
    const match = list.find((o) => o.id === id)
    if (match) return match
  }
  return null
}

/**
 * Calendar-length options scoped to the Series 79 learning path. Used
 * by the panel-style Create Calendar demo (`CreateCalendarPanel`) so
 * the dropdown surfaces variants of the path the learner is already on
 * — 10 / 15 / 20 day pacing — instead of the modal's cross-path
 * Greenlight / Foundation list.
 */
export const SERIES_79_CALENDAR_LENGTHS: CreateCalendarOption[] = [
  {
    id: 'series-79-10day',
    label: 'Series 79 Exam 10 Day Plan',
    taskCount: 40,
    defaultWeeks: 2,
    bufferDays: 1,
  },
  {
    id: 'series-79-15day',
    label: 'Series 79 Exam 15 Day Plan',
    taskCount: 48,
    defaultWeeks: 3,
    bufferDays: 2,
  },
  {
    id: 'series-79-20day',
    label: 'Series 79 Exam 20 Day Plan',
    taskCount: 56,
    defaultWeeks: 4,
    bufferDays: 3,
  },
]

/**
 * Calendar-length options for XCEL's pre-licensing paths. The 10-day plan is
 * XCEL's own headline claim ("pass in as little as 10 days"); 15 and 20 are the
 * less-compressed pacings, and 20 is the one the demo fixture assigns.
 *
 * `bufferDays` grows with the plan because the longer pacings leave more room
 * before the booked exam date, matching how the Series 79 lengths are shaped.
 */
export const XCEL_PRELICENSE_CALENDAR_LENGTHS: CreateCalendarOption[] = [
  {
    id: 'xcel-lh-10day',
    label: 'Life & Health — 10 Day Plan',
    taskCount: 26,
    defaultWeeks: 2,
    bufferDays: 1,
  },
  {
    id: 'xcel-lh-15day',
    label: 'Life & Health — 15 Day Plan',
    taskCount: 32,
    defaultWeeks: 3,
    bufferDays: 2,
  },
  {
    id: 'xcel-lh-20day',
    label: 'Life & Health — 20 Day Plan',
    taskCount: 37,
    defaultWeeks: 4,
    bufferDays: 3,
  },
]

/**
 * Per-path calendar-length lookup.
 *
 * The Create Calendar / Edit Calendar surfaces used to reference
 * `SERIES_79_CALENDAR_LENGTHS` directly, with this file's own comment noting
 * that a sibling list plus a per-path lookup would be needed "when more paths
 * gain a Create Calendar surface". XCEL was that moment.
 *
 * The fallback is deliberate and NOT a silent default: a Create Calendar
 * surface with no plan lengths at all is an empty dropdown, which reads as
 * broken. A path with no entry gets the Series 79 lengths and is visibly
 * mislabelled, which reads as unfinished. Unfinished is the better failure.
 */
const CALENDAR_LENGTHS_BY_PATH: Record<string, CreateCalendarOption[]> = {
  // Both XCEL pre-licensing paths offer the same three pacings. The CE path is
  // absent on purpose — it has no Study Plan (see `XCEL_PATHS_WITH_CALENDAR`).
  'xcel-fl-lh-prelicensing': XCEL_PRELICENSE_CALENDAR_LENGTHS,
  'xcel-fl-pc-prelicensing': XCEL_PRELICENSE_CALENDAR_LENGTHS,
}

export function calendarLengthsForPath(
  pathId: string | undefined,
): CreateCalendarOption[] {
  return (pathId && CALENDAR_LENGTHS_BY_PATH[pathId]) || SERIES_79_CALENDAR_LENGTHS
}

/** Every list, for `findCreateCalendarOption`'s cross-list id resolution. */
const ALL_OPTION_LISTS: CreateCalendarOption[][] = [
  CREATE_CALENDAR_OPTIONS,
  SERIES_79_CALENDAR_LENGTHS,
  ...Object.values(CALENDAR_LENGTHS_BY_PATH),
]
