import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDay,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  MoreVertical,
  Plus,
} from '@/icons'
import { Toast } from '@/components/ui/Toast'
import {
  STUDY_CALENDAR_TODAY,
  applyStatusOverride,
  customOccurrencesByDate,
  hasStudyCalendarFor,
  parseStatusOverride,
  studyCalendarFor,
  type CustomEvent,
  type CustomEventOccurrence,
  type CustomEventRepeat,
  type StatusOverride,
  type StudyCalendar,
  type StudyTask,
} from '@/data/studyCalendarFixtures'
import { learningPathsFor } from '@/data/learningFixtures'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { TaskRow } from './TaskRow'
import { WeekendToggle } from './WeekendToggle'
import { StudyCalendarEmptyState } from './StudyCalendarEmptyState'
import { StudyCalendarLockedState } from './StudyCalendarLockedState'
import { CreateCalendarDemoHarness } from './CreateCalendarDemoHarness'
import { CreateCalendarPanelHarness } from './CreateCalendarPanelHarness'
import { GridView } from './GridView'
import { CalendarSettingsSheet } from './CalendarSettingsSheet'
import { StudyCalendarStatBand } from './StudyCalendarStatBand'
import { CalendarActionsPanel } from './CalendarActionsPanel'
import { EditExamDatePanel } from './EditExamDatePanel'
import { AddCustomEventPanel } from './AddCustomEventPanel'

/**
 * Scope of the right-hand task column. `date` shows a single day's tasks
 * (the historical Daily view). `all` shows every task in the calendar
 * (the historical All Tasks view). The two are mutually exclusive — picking
 * one collapses the other. The status filter chips below combine with the
 * active scope as an AND.
 */
type Scope = { kind: 'date'; iso: string } | { kind: 'all' }

/**
 * Status keys exposed as filter chips. Internal task statuses map to UI
 * labels — `overdue` → "Off Track", `upcoming` → "Not Started". The
 * `custom` key isn't a status — it's a synthetic filter that surfaces
 * only learner-created custom tasks (and hides scheduled tasks). The
 * Custom chip only appears in the toolbar when the calendar actually
 * has custom tasks on it.
 */
type StatusFilterKey =
  | 'completed'
  | 'in-progress'
  | 'overdue'
  | 'upcoming'
  | 'custom'

/**
 * Per-chip color tokens applied when the chip is active. The same palette is
 * reused for (a) the chip itself, (b) the day-cell tint when the chip is
 * selected, and (c) — already — the task card's status icon tile, so the
 * chip / cell / task badge all read as the same "color = status" mapping.
 */
const STATUS_CHIP_COLORS: Record<
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

const STATUS_CHIPS: Array<{ id: StatusFilterKey; label: string }> = [
  // Ordered by attention priority — matches the All Tasks sort order so
  // the chip row reads as a sequence of "needs attention" → "done".
  // Custom sits at the end since it isn't a status — it's a separate
  // facet that's only visible when the calendar has custom tasks.
  { id: 'overdue', label: 'Overdue' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'upcoming', label: 'Not Started' },
  { id: 'completed', label: 'Completed' },
  { id: 'custom', label: 'Custom' },
]

/**
 * Returns the day-cell background tint for the active status chip, or
 * `null` when no chip is active OR no item on this day matches the chip.
 * For status chips, matches against the day's `tasks`. For the `custom`
 * chip, matches against the day's `customEvents`. Reuses the chip's
 * `bg` token so chip + cell + task badge all share the same color.
 */
function dayCellFilterTint(
  tasks: StudyTask[],
  customEvents: CustomEventOccurrence[],
  filter: StatusFilterKey | null,
): string | null {
  if (filter === null) return null
  if (filter === 'custom') {
    return customEvents.length > 0 ? STATUS_CHIP_COLORS.custom.bg : null
  }
  const hasMatch = tasks.some((t) => t.status === filter)
  return hasMatch ? STATUS_CHIP_COLORS[filter].bg : null
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
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

type DayCell = {
  iso: string
  day: number
  inMonth: boolean
  isToday: boolean
  tasks: StudyTask[]
  customEvents: CustomEventOccurrence[]
  summary: 'empty' | 'all-complete' | 'has-overdue' | 'has-in-progress' | 'has-upcoming'
}

function isoOfYMD(y: number, mIdx: number, d: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(mIdx + 1)}-${pad(d)}`
}

function buildMonthGrid(
  year: number,
  monthIdx: number,
  calendar: StudyCalendar,
  customByDate: Map<string, CustomEventOccurrence[]>,
): DayCell[] {
  const first = new Date(Date.UTC(year, monthIdx, 1))
  const startDow = first.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate()
  const prevDaysInMonth = new Date(Date.UTC(year, monthIdx, 0)).getUTCDate()
  const cells: DayCell[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevDaysInMonth - i
    const prevYear = monthIdx === 0 ? year - 1 : year
    const prevMonth = monthIdx === 0 ? 11 : monthIdx - 1
    const iso = isoOfYMD(prevYear, prevMonth, day)
    cells.push({
      iso,
      day,
      inMonth: false,
      isToday: false,
      tasks: [],
      customEvents: [],
      summary: 'empty',
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOfYMD(year, monthIdx, d)
    const tasks = calendar.tasks.filter((t) => t.dueDate === iso)
    const customEvents = customByDate.get(iso) ?? []
    const summary: DayCell['summary'] =
      tasks.length === 0
        ? 'empty'
        : tasks.every((t) => t.status === 'completed')
          ? 'all-complete'
          : tasks.some((t) => t.status === 'overdue')
            ? 'has-overdue'
            : tasks.some((t) => t.status === 'in-progress')
              ? 'has-in-progress'
              : 'has-upcoming'
    cells.push({
      iso,
      day: d,
      inMonth: true,
      isToday: iso === STUDY_CALENDAR_TODAY,
      tasks,
      customEvents,
      summary,
    })
  }
  while (cells.length % 7 !== 0) {
    const next = cells.length - (startDow + daysInMonth) + 1
    const nextYear = monthIdx === 11 ? year + 1 : year
    const nextMonth = monthIdx === 11 ? 0 : monthIdx + 1
    const iso = isoOfYMD(nextYear, nextMonth, next)
    cells.push({
      iso,
      day: next,
      inMonth: false,
      isToday: false,
      tasks: [],
      customEvents: [],
      summary: 'empty',
    })
  }
  return cells
}

function formatLongWithDow(iso: string): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `${dow[date.getUTCDay()]}, ${MONTH_LABELS[m - 1]} ${d}`
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  return `${SHORT_MONTHS[m - 1]} ${d}`
}

/**
 * Span of due dates across the supplied tasks AND custom-task
 * occurrences, formatted as "May 6 – May 26" (en-dash). Returns null
 * when both lists are empty, or just the single date when min === max.
 * Used by the "All Tasks" header to communicate the window the visible
 * items span — works for any filter combination (scheduled-only,
 * custom-only, or both).
 */
function combinedDateRange(
  tasks: StudyTask[],
  customEvents: CustomEventOccurrence[],
): string | null {
  if (tasks.length === 0 && customEvents.length === 0) return null
  let min: string | null = null
  let max: string | null = null
  for (const t of tasks) {
    if (min === null || t.dueDate < min) min = t.dueDate
    if (max === null || t.dueDate > max) max = t.dueDate
  }
  for (const e of customEvents) {
    if (min === null || e.iso < min) min = e.iso
    if (max === null || e.iso > max) max = e.iso
  }
  if (min === null || max === null) return null
  if (min === max) return formatShortDate(min)
  return `${formatShortDate(min)} – ${formatShortDate(max)}`
}

function applyStatusFilter(
  tasks: StudyTask[],
  filter: StatusFilterKey | null,
  demoCompletedIds: Set<string>,
): StudyTask[] {
  if (filter === null) return tasks
  // The Custom chip is a custom-task-only filter — scheduled tasks
  // disappear from the list when it's active.
  if (filter === 'custom') return []
  return tasks.filter((t) => {
    const effective = demoCompletedIds.has(t.id) ? 'completed' : t.status
    return effective === filter
  })
}

/**
 * Calendar-first variant of the Study Calendar. Replaces the two separate
 * Daily / All Tasks views with a single combined panel:
 *   - Scope buttons (Today, All tasks) and the month grid drive WHICH tasks
 *     show in the right column.
 *   - Status chips (Completed / In Progress / Off Track) further narrow the
 *     column. Multi-select; combined with scope as an AND.
 *
 * Mirrors `StudyCalendarPanel`'s outer branching (demo path → harness,
 * non-member → locked overlay, no calendar → empty state) so the variant
 * stays consistent with the tab placement on other STC paths.
 */
export function InlineStudyCalendar({ pathId }: { pathId?: string } = {}) {
  const { brand, membership } = useAccount()
  const [searchParams] = useSearchParams()
  // `study-calendar-state` feature flag — 3 variants (`add` /
  // `edit` / `locked`) consolidate the previous one-path-per-demo
  // approach into a single Series 79 path that flips state via the
  // Feature Flag panel. Only applied to the canonical Series 79 path
  // (`series-79-15day`); other STC paths render normally.
  const calendarStateFlag = useFeatureFlag('study-calendar-state')
  const isFlagPath = pathId === 'series-79-15day'
  // A `?calState=` URL param (add / edit / locked) deep-links a single
  // calendar state — used by the prototype walkthrough so each state
  // tile lands directly without flipping the Feature Flag panel. When
  // absent, the flag drives it as before.
  const calStateParam = searchParams.get('calState') ?? undefined
  const calendarStateVariant = isFlagPath
    ? (calStateParam ?? calendarStateFlag.variant)
    : undefined
  // `study-calendar-status` flag — independent of `study-calendar-state`.
  // Applies to every STC path so reviewers can flip any path into
  // any pacing status (Not Started / On Track / Off Track) without
  // swapping the active path. A `?calStatus=` URL param overrides it
  // (same walkthrough deep-link mechanism).
  const statusFlag = useFeatureFlag('study-calendar-status')
  const statusOverride =
    parseStatusOverride(searchParams.get('calStatus')) ??
    ((statusFlag.variant as StatusOverride | undefined) ?? 'match')

  // All hooks must be called BEFORE any conditional `return` so the
  // hook order stays stable across renders when the feature flag /
  // path / brand change.
  const activePath = useMemo(() => {
    const all = learningPathsFor(brand)
    return all.find((p) => p.id === pathId) ?? null
  }, [brand, pathId])
  const hasCalendar = hasStudyCalendarFor(brand, pathId)
  const calendar = useMemo(
    () =>
      hasCalendar
        ? applyStatusOverride(studyCalendarFor(pathId), statusOverride)
        : null,
    [hasCalendar, pathId, statusOverride],
  )

  // Same demo-flow short-circuit as `StudyCalendarPanel` — the
  // create-calendar demo path swaps the whole panel for the harness.
  if (
    activePath?.kind === 'demo' &&
    activePath.demoFlow === 'create-calendar' &&
    pathId
  ) {
    return <CreateCalendarDemoHarness pathId={pathId} />
  }

  // Flag-driven "Add Calendar" variant — short-circuit the canonical
  // Series 79 path into the empty-state setup view + Create Calendar
  // panel harness, identical to the experience the deleted
  // `stc-create-calendar-panel` demo path used to surface.
  if (calendarStateVariant === 'add') {
    return <CreateCalendarPanelHarness pathId={pathId} />
  }

  // The STC non-member locked state is gone — see the note in
  // StudyCalendarPanel. XCEL has no membership, so there is no locked state to
  // reach and the calendar is always open.

  if (!calendar) return <StudyCalendarEmptyState />

  // Persist initial month selection only — scope + filters are local
  // state per-mount so they reset cleanly when the learner returns.
  const initialIso =
    searchParams.get('calDate') ?? STUDY_CALENDAR_TODAY
  // `locked` variant — force the calendar's locked flag on so the Edit
  // panel renders the partial-lock layout (only the Target Exam Date
  // is editable). The underlying fixture stays unchanged.
  const effectiveCalendar =
    calendarStateVariant === 'locked' ? { ...calendar, locked: true } : calendar

  return (
    <InlineStudyCalendarBody
      calendar={effectiveCalendar}
      initialIso={initialIso}
      pathId={pathId}
    />
  )
}

function InlineStudyCalendarBody({
  calendar: initialCalendar,
  initialIso,
  pathId,
}: {
  calendar: StudyCalendar
  initialIso: string
  pathId?: string
}) {
  const today = STUDY_CALENDAR_TODAY
  const [todayY, todayM] = today.split('-').map((p) => parseInt(p, 10))
  const [bodySearchParams] = useSearchParams()
  const [calendar, setCalendar] = useState<StudyCalendar>(initialCalendar)
  const [year, setYear] = useState(todayY)
  const [monthIdx, setMonthIdx] = useState(todayM - 1)
  const [scope, setScope] = useState<Scope>({ kind: 'date', iso: initialIso })
  // Single-select: only one status chip can be active at a time. Clicking
  // the active chip again clears it. `null` means "no status filter".
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey | null>(null)
  const [hideWeekends, setHideWeekends] = useState(false)
  // Auto-open the Edit panel when the URL carries `?openPanel=edit` —
  // lets capture / demo flows show the panel without a click.
  const [editPanelOpen, setEditPanelOpen] = useState(
    () => bodySearchParams.get('openPanel') === 'edit',
  )
  const [actionsPanelOpen, setActionsPanelOpen] = useState(false)
  const [examDatePanelOpen, setExamDatePanelOpen] = useState(false)
  // Custom-task panel state — `view` is the default when the learner
  // taps an existing custom-task card (read-only summary with
  // Complete Task + Edit actions). `edit` opens the full form (entered
  // either from the row kebab's Edit item or the view panel's Edit
  // button). `add` opens a blank form. `null` means closed. State
  // lives here so the grid + task list share one panel instance.
  const [customEventPanel, setCustomEventPanel] = useState<
    | { mode: 'add'; defaultDate?: string }
    | { mode: 'edit'; eventId: string }
    | { mode: 'view'; eventId: string }
    | null
  >(null)
  // Per-path localStorage keys. Each Learning Path keeps its own
  // bucket so switching paths doesn't bleed custom tasks across
  // calendars. Falls back to `default` for the (currently unreachable)
  // pathId-less case so the keys never collapse to bare prefixes.
  const customEventsStorageKey = `cgp.customEvents.${pathId ?? 'default'}`
  const completedCustomEventsStorageKey = `cgp.completedCustomEvents.${pathId ?? 'default'}`

  // Custom tasks for this path. Persisted to localStorage so the
  // learner's additions survive refreshes — they only disappear when
  // the learner deletes them (single via the row / view panel, or
  // all-at-once via the Calendar Actions panel). Hydrates from
  // storage on mount; the persistence effect below mirrors every
  // change back. A storage failure (private mode, full quota) just
  // falls back to an empty list — no error, no UI hint.
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(() => {
    try {
      const raw = localStorage.getItem(customEventsStorageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as CustomEvent[]) : []
    } catch {
      return []
    }
  })
  // Completion set for custom tasks. Also persisted so a learner who
  // marks something complete still sees it as completed after a
  // refresh. Stored as a JSON array (Set isn't JSON-serializable),
  // re-hydrated into a Set on read.
  const [completedCustomEventIds, setCompletedCustomEventIds] = useState<
    Set<string>
  >(() => {
    try {
      const raw = localStorage.getItem(completedCustomEventsStorageKey)
      if (!raw) return new Set()
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set()
    } catch {
      return new Set()
    }
  })

  // Persistence effects — mirror every state change to localStorage
  // so refresh-recoverable state is always up to date. Try/catch on
  // each call so a quota error or disabled-storage situation doesn't
  // break the UI thread.
  useEffect(() => {
    try {
      localStorage.setItem(customEventsStorageKey, JSON.stringify(customEvents))
    } catch {
      // localStorage unavailable — accept the loss of persistence.
    }
  }, [customEvents, customEventsStorageKey])

  useEffect(() => {
    try {
      localStorage.setItem(
        completedCustomEventsStorageKey,
        JSON.stringify(Array.from(completedCustomEventIds)),
      )
    } catch {
      // localStorage unavailable — accept the loss of persistence.
    }
  }, [completedCustomEventIds, completedCustomEventsStorageKey])
  const [customEventToastOpen, setCustomEventToastOpen] = useState(false)
  // Toast copy follows the Figma pattern (node 3625:19356): a short bold
  // title + a specific supporting description — set together per action.
  const [customEventToast, setCustomEventToast] = useState<{
    title: string
    body: string
  }>({ title: '', body: '' })
  // PDF-style viewer: open the print-friendly page in a new tab. The
  // /print/study-calendar route lives outside AppLayout so the new
  // tab opens chrome-less. The user hands off to the browser's native
  // Print → Save-as-PDF dialog from there.
  const openPrintView = (view: 'calendar' | 'tasks') => {
    const params = new URLSearchParams({ view })
    if (pathId) params.set('pathId', pathId)
    window.open(`/print/study-calendar?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }
  const [pacingToastOpen, setPacingToastOpen] = useState(false)
  // Demo-only completion state — task ids the learner has marked complete
  // in this session via the demo card flow. Stored at this level (not in
  // TaskRow) so the sort and filter can treat them as completed and drop
  // them to the Completed bucket. Resets on page refresh (no persistence).
  const [demoCompletedIds, setDemoCompletedIds] = useState<Set<string>>(
    () => new Set(),
  )
  const markDemoComplete = (taskId: string) => {
    setDemoCompletedIds((prev) => {
      if (prev.has(taskId)) return prev
      const next = new Set(prev)
      next.add(taskId)
      return next
    })
  }

  // Pre-expand recurring custom events into a Map<iso, occurrences>
  // so the grid + task-list views can pull per-day arrays in O(1).
  // Bounded by the calendar's [startDate, examDate] window — anything
  // outside the calendar is dropped at render time.
  const customByDate = useMemo(
    () => customOccurrencesByDate(customEvents, calendar.startDate, calendar.examDate),
    [customEvents, calendar.startDate, calendar.examDate],
  )

  const cells = useMemo(
    () => buildMonthGrid(year, monthIdx, calendar, customByDate),
    [year, monthIdx, calendar, customByDate],
  )
  const displayCells = useMemo(
    () => (hideWeekends ? cells.filter((_, i) => i % 7 !== 0 && i % 7 !== 6) : cells),
    [cells, hideWeekends],
  )
  const dowLabels = hideWeekends ? DOW_LABELS.slice(1, 6) : DOW_LABELS
  const columns = hideWeekends ? 5 : 7

  // Tasks rendered in the right column — derived from scope + chip filters.
  // "All Tasks" sorts strictly by date so the right column reads as a
  // chronological feed alongside custom tasks. Status chips narrow the
  // list to that status only; the Custom chip suppresses tasks entirely
  // (handled inside `applyStatusFilter`).
  const visibleTasks = useMemo(() => {
    const base =
      scope.kind === 'all'
        ? [...calendar.tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        : calendar.tasks.filter((t) => t.dueDate === scope.iso)
    return applyStatusFilter(base, statusFilter, demoCompletedIds)
  }, [calendar.tasks, scope, statusFilter, demoCompletedIds])

  // Overdue tasks surfaced at the top of the right rail when today
  // is the scope. Only fires for the single-day "Today" view (so the
  // All Tasks feed doesn't duplicate the overdue cluster it already
  // shows inline by date) and only when no status chip is active —
  // an explicit Off Track / Completed / etc. filter already narrows
  // the column to one bucket. Demo-completed ids are honored too so
  // a learner who marks an overdue task complete in-session drops it
  // out of this surface immediately.
  const overdueTasks = useMemo<StudyTask[]>(() => {
    if (scope.kind !== 'date') return []
    if (scope.iso !== today) return []
    if (statusFilter !== null) return []
    return calendar.tasks.filter((t) => {
      const effective = demoCompletedIds.has(t.id) ? 'completed' : t.status
      return effective === 'overdue'
    })
  }, [scope, today, statusFilter, calendar.tasks, demoCompletedIds])

  // Custom-event occurrences for the current scope. Suppressed when one
  // of the status chips (Off Track / In Progress / Not Started /
  // Completed) is active — custom tasks have no status. The 'custom'
  // chip is the inverse — it's the explicit "show custom tasks only"
  // filter, so we keep occurrences visible when it's active.
  const visibleCustomEvents = useMemo<CustomEventOccurrence[]>(() => {
    if (statusFilter !== null && statusFilter !== 'custom') return []
    if (scope.kind === 'all') {
      const all: CustomEventOccurrence[] = []
      for (const list of customByDate.values()) all.push(...list)
      all.sort((a, b) => a.iso.localeCompare(b.iso))
      return all
    }
    return customByDate.get(scope.iso) ?? []
  }, [scope, customByDate, statusFilter])

  // Custom-event CRUD handlers. Add appends; Update swaps in-place by
  // id; Delete removes the rule (all occurrences disappear). Each one
  // also closes the panel + fires the matching toast so the learner
  // sees confirmation without an extra click.
  const handleSaveCustomEvent = (next: CustomEvent) => {
    setCustomEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === next.id)
      if (idx === -1) return [...prev, { ...next, pathId: next.pathId ?? pathId }]
      const copy = prev.slice()
      copy[idx] = { ...next, pathId: next.pathId ?? pathId }
      return copy
    })
    setCustomEventPanel(null)
    setCustomEventToast(
      customEventPanel?.mode === 'edit'
        ? { title: 'Changes saved', body: 'Your custom task has been updated.' }
        : { title: 'Custom task added', body: 'It’s on your study plan.' },
    )
    setCustomEventToastOpen(true)
  }

  const handleDeleteCustomEvent = (eventId: string) => {
    setCustomEvents((prev) => prev.filter((e) => e.id !== eventId))
    setCustomEventPanel(null)
    setCustomEventToast({
      title: 'Custom task deleted',
      body: 'It’s been removed from your study plan.',
    })
    setCustomEventToastOpen(true)
  }

  // Wipe every custom task for this calendar in one shot. Fired from
  // the Calendar Actions panel's "Delete All Custom Tasks" tile after
  // the learner clicks through the in-panel "Yes, delete." confirm
  // step. Also clears the completion set since the events those ids
  // referenced are now gone.
  const handleDeleteAllCustomEvents = () => {
    setCustomEvents([])
    setCompletedCustomEventIds(new Set())
    setActionsPanelOpen(false)
    setCustomEventToast({
      title: 'Custom tasks cleared',
      body: 'All custom tasks have been removed from your study plan.',
    })
    setCustomEventToastOpen(true)
  }

  // Mark a custom task complete — adds the id to the session-only
  // completion set so the row renders line-through + dimmed. Fired
  // from the view panel's Complete Task CTA AND the row kebab's
  // Mark complete item, so both entry points hit the same path.
  const handleCompleteCustomEvent = (eventId: string) => {
    setCompletedCustomEventIds((prev) => {
      if (prev.has(eventId)) return prev
      const next = new Set(prev)
      next.add(eventId)
      return next
    })
    setCustomEventPanel(null)
    setCustomEventToast({ title: 'Task complete', body: 'Nice work — it’s marked done.' })
    setCustomEventToastOpen(true)
  }

  // Swap an open view panel to edit mode in-place — used by the
  // Edit secondary action on the view footer. Just flips the mode
  // discriminant; existing form state will re-prime from the same
  // event because `existingEvent` (resolved below) stays the same.
  const handleSwitchToEditCustomEvent = (eventId: string) => {
    setCustomEventPanel({ mode: 'edit', eventId })
  }

  // Resolve the source CustomEvent for edit + view modes from the
  // `eventId` carried in `customEventPanel`. `undefined` when the
  // event has been deleted out from under the panel (race), or in
  // add mode — the panel ignores it then.
  const editingEvent = useMemo<CustomEvent | undefined>(() => {
    if (customEventPanel?.mode !== 'edit' && customEventPanel?.mode !== 'view')
      return undefined
    return customEvents.find((e) => e.id === customEventPanel.eventId)
  }, [customEventPanel, customEvents])

  const goPrevMonth = () => {
    if (monthIdx === 0) {
      setMonthIdx(11)
      setYear(year - 1)
    } else {
      setMonthIdx(monthIdx - 1)
    }
  }
  const goNextMonth = () => {
    if (monthIdx === 11) {
      setMonthIdx(0)
      setYear(year + 1)
    } else {
      setMonthIdx(monthIdx + 1)
    }
  }
  const goToday = () => {
    setYear(todayY)
    setMonthIdx(todayM - 1)
    setScope({ kind: 'date', iso: today })
  }
  const goAll = () => setScope({ kind: 'all' })

  // Click the active chip → clear. Click any other chip → make it the
  // sole active filter (replacing the previous selection).
  const toggleStatus = (key: StatusFilterKey) => {
    setStatusFilter((prev) => (prev === key ? null : key))
  }

  const isScopeAll = scope.kind === 'all'
  const isScopeToday = scope.kind === 'date' && scope.iso === today

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat band — navy title band over a flat 6-tile stat row
          (Status / Progress / Tasks Completed / Start Date / Target
          Exam Date / Days Left). Sourced from Figma node
          `3370:16917`. Calendar Actions link is hidden in v2 until
          the real actions menu ships; the legacy `onOpenActions`
          handler stays threaded for that future wiring. */}
      <StudyCalendarStatBand
        calendar={calendar}
        onOpenActions={() => setEditPanelOpen(true)}
      />

      {/* Filter / action toolbar — scope buttons on the left, status chips
          center, View Calendar trigger on the right. The full row is
          print-hidden so the printed sheet shows the grid alone. */}
      <div
        className="cre-study-calendar-print-hide"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Today / All Tasks scope toggle — My Courses "Pill Tab"
              segmented style (neutral-50 track, cta-500 active fill),
              sized to 33.5px so it lines up with the status chips. */}
          <div role="tablist" aria-label="Task scope" style={scopeTablistStyle}>
            <ScopeButton active={isScopeToday} onClick={goToday}>
              Today
            </ScopeButton>
            <ScopeButton active={isScopeAll} onClick={goAll}>
              All Tasks
            </ScopeButton>
          </div>
          <span
            aria-hidden
            style={{
              width: 1,
              alignSelf: 'stretch',
              background: 'var(--color-border-subtle)',
              margin: '0 4px',
            }}
          />
          {STATUS_CHIPS.filter(
            // Custom chip only shows when the calendar actually has at
            // least one custom task — keeps the chip row uncluttered for
            // paths that aren't using the feature.
            (chip) => chip.id !== 'custom' || customEvents.length > 0,
          ).map((chip) => (
            <FilterChip
              key={chip.id}
              active={statusFilter === chip.id}
              colors={STATUS_CHIP_COLORS[chip.id]}
              onClick={() => toggleStatus(chip.id)}
            >
              {chip.label}
            </FilterChip>
          ))}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 20 }}>
          {/* Calendar Actions — opens the Calendar Actions slide-over
              (3×2 grid of View / Edit / Add / Delete actions) per
              Figma node `3370:16329`. */}
          <LinkAction
            icon={<ClipboardList size={14} aria-hidden />}
            label="Study Plan Actions"
            onClick={() => setActionsPanelOpen(true)}
          />
        </div>
      </div>

      {/* Full-width scope band — navy fill with white text, spans
          across both the calendar and task list columns. Pulls the
          scope label + completion count into one bar so it visually
          unifies the two-column layout below. */}
      <TasksScopeBand
        scope={scope}
        tasks={visibleTasks}
        customEvents={visibleCustomEvents}
      />

      {/* Calendar grid (left) + filtered task column (right). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minWidth: 0,
          }}
        >
          {/* The combined calendar package: a white month-nav header
              attached to the day-grid body. `overflow: hidden` clips
              the inner backgrounds to the rounded corners so the
              header + body read as one continuous container. The
              previous `marginTop: 36` shim is dropped — the full-width
              navy scope band above now aligns both columns at the
              same vertical baseline. */}
          <div
            style={{
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            {/* Calendar grid header — white background, centered
                Prev / Month-year / Next. The previous navy bar +
                Edit affordance migrated to the stat band's
                "Calendar Actions" link. */}
            <header
              style={{
                background: 'var(--color-surface-card)',
                color: 'var(--color-text-primary)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px 4px',
              }}
            >
              <button
                type="button"
                onClick={goPrevMonth}
                aria-label="Previous month"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-pill)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={14} aria-hidden />
              </button>
              <h4
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: '22px',
                  color: 'var(--color-text-primary)',
                  textAlign: 'center',
                  minWidth: 150,
                }}
              >
                {MONTH_LABELS[monthIdx]} {year}
              </h4>
              <button
                type="button"
                onClick={goNextMonth}
                aria-label="Next month"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-pill)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                <ArrowRight size={14} aria-hidden />
              </button>
            </header>

            <div
              style={{
                background: 'var(--color-surface-card)',
                padding: 12,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: 4,
              }}
            >
              {dowLabels.map((d) => (
                <div
                  key={d}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    padding: '4px 8px',
                  }}
                >
                  {d}
                </div>
              ))}
              {displayCells.map((cell, i) => {
                const isSelected =
                  scope.kind === 'date' && cell.iso === scope.iso && cell.inMonth
                // Compute "filter selection" tint for days whose tasks
                // match any active status chip. Non-month leading/trailing
                // cells skip the tint so they stay visually quiet.
                const filterTint = cell.inMonth
                  ? dayCellFilterTint(cell.tasks, cell.customEvents, statusFilter)
                  : null
                return (
                  <DayCellButton
                    key={`${cell.iso}-${i}`}
                    cell={cell}
                    selected={isSelected}
                    filterTint={filterTint}
                    onSelect={() => {
                      if (!cell.inMonth) return
                      // Clicking a day always snaps scope back to that
                      // single day, regardless of whether "All Tasks" was
                      // active. Mirrors the answer to the day-click question.
                      setScope({ kind: 'date', iso: cell.iso })
                      // Drop an active status filter (Overdue / In Progress /
                      // Not Started / Completed) so the picked day shows its
                      // full task list; the separate "Custom" facet is kept.
                      setStatusFilter((prev) => (prev === 'custom' ? prev : null))
                    }}
                  />
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <WeekendToggle checked={hideWeekends} onChange={setHideWeekends} />
          </div>
        </div>

        <TasksColumn
          scope={scope}
          tasks={visibleTasks}
          customEvents={visibleCustomEvents}
          overdueTasks={overdueTasks}
          onViewCustomEvent={(eventId) =>
            setCustomEventPanel({ mode: 'view', eventId })
          }
          onEditCustomEvent={(eventId) =>
            setCustomEventPanel({ mode: 'edit', eventId })
          }
          onCompleteCustomEvent={handleCompleteCustomEvent}
          completedCustomEventIds={completedCustomEventIds}
          demoCompletedIds={demoCompletedIds}
          onMarkDemoComplete={markDemoComplete}
          isFiltered={statusFilter !== null}
          scopeIso={scope.kind === 'date' ? scope.iso : STUDY_CALENDAR_TODAY}
          onAddCustomEvent={(iso) => setCustomEventPanel({ mode: 'add', defaultDate: iso })}
        />
      </div>

      <CalendarActionsPanel
        open={actionsPanelOpen}
        onClose={() => setActionsPanelOpen(false)}
        onEditCalendar={() => setEditPanelOpen(true)}
        onViewCalendar={() => openPrintView('calendar')}
        onViewTaskList={() => openPrintView('tasks')}
        onAddCustomEvent={() => {
          // Pre-fill the Date field with whichever day the learner
          // currently has scoped — better than dropping them at
          // startDate when they're clearly looking at a later day.
          const defaultDate =
            scope.kind === 'date' ? scope.iso : STUDY_CALENDAR_TODAY
          setCustomEventPanel({ mode: 'add', defaultDate })
        }}
        onEditExamDate={() => setExamDatePanelOpen(true)}
        onDeleteAllCustomTasks={handleDeleteAllCustomEvents}
        customTaskCount={customEvents.length}
      />

      <EditExamDatePanel
        open={examDatePanelOpen}
        onClose={() => setExamDatePanelOpen(false)}
        calendar={calendar}
        onSave={(examDate, examTime) => {
          // Stub: PATCH /api/v1/learners/{learnerId}/schedule-config.
          // Demo swaps the exam date/time in local state so the calendar
          // rerenders; other pacing fields are left untouched.
          console.info('calendar:edit-exam-date:save', { examDate, examTime })
          setCalendar((prev) => ({
            ...prev,
            examDate,
            examTime: examTime || undefined,
          }))
          setPacingToastOpen(true)
        }}
      />

      <AddCustomEventPanel
        open={customEventPanel !== null}
        mode={customEventPanel?.mode ?? 'add'}
        calendar={calendar}
        existingEvent={editingEvent}
        defaultDate={
          customEventPanel?.mode === 'add' ? customEventPanel.defaultDate : undefined
        }
        onClose={() => setCustomEventPanel(null)}
        onSave={handleSaveCustomEvent}
        onDelete={handleDeleteCustomEvent}
        onComplete={handleCompleteCustomEvent}
        onSwitchToEdit={handleSwitchToEditCustomEvent}
      />

      <CalendarSettingsSheet
        open={editPanelOpen}
        onClose={() => setEditPanelOpen(false)}
        calendar={calendar}
        pathId={pathId}
        onSave={(next) => {
          // Stub: PATCH /api/v1/learners/{learnerId}/schedule-config.
          // Real backend will return `recalculatedTasks`; for the demo we
          // swap the local state in-place so the calendar UI rerenders
          // with the new exam date / dates without a second round-trip.
          console.info('calendar:edit:save', next)
          setCalendar((prev) => ({
            ...prev,
            examDate: next.examDate,
            examTime: next.examTime || undefined,
            startDate: next.startDate,
            daysPerWeek: next.daysPerWeek,
            bufferDays: next.bufferDays,
            excludeNYSEHolidays: next.excludeNYSEHolidays,
          }))
          setPacingToastOpen(true)
        }}
      />

      <Toast
        open={pacingToastOpen}
        onClose={() => setPacingToastOpen(false)}
        tone="success"
        title="Study plan updated"
        duration={2500}
      >
        Your task due dates have been recalculated.
      </Toast>

      {/* Custom-event confirmation toast — shared by add / edit /
          delete. Message swaps in the matching string just before the
          toast opens (see `setCustomEventToastMsg`). */}
      <Toast
        open={customEventToastOpen}
        onClose={() => setCustomEventToastOpen(false)}
        tone="success"
        title={customEventToast.title}
        duration={2500}
      >
        {customEventToast.body}
      </Toast>
    </section>
  )
}

/** Soft cap before the "View all" affordance kicks in. */
const TASK_LIST_VISIBLE_LIMIT = 12

/**
 * Full-width navy scope band that anchors the two-column
 * Calendar / Tasks layout. Pulls the scope label (Today / All Tasks
 * / specific date) + completion count into a single bar that spans
 * both columns — same content the per-column header used to carry,
 * just promoted to a row above the grid so the two columns can sit
 * side-by-side underneath.
 */
function TasksScopeBand({
  scope,
  tasks,
  customEvents,
}: {
  scope: Scope
  tasks: StudyTask[]
  /** Custom-task occurrences visible under the current scope + filter
   *  so they roll into the right-side total alongside scheduled tasks.
   *  Without this, the "Custom" filter (which empties `tasks`) would
   *  drop the entire count badge. */
  customEvents: CustomEventOccurrence[]
}) {
  const isAll = scope.kind === 'all'
  const completed = tasks.filter((t) => t.status === 'completed').length
  // Combined count + date range — covers all four filter shapes:
  //   - no filter         → tasks + customEvents
  //   - status filter     → tasks only (customEvents is [] by design)
  //   - 'custom' filter   → customEvents only (tasks is [] by design)
  //   - single-day scope  → still combined so a custom-only day shows
  //                          a count even when no scheduled tasks land
  //                          on it
  const totalItems = tasks.length + customEvents.length
  const allRange = isAll
    ? combinedDateRange(tasks, customEvents)
    : null
  const isTodayScope = scope.kind === 'date' && scope.iso === STUDY_CALENDAR_TODAY
  return (
    <header
      style={{
        // Light neutral fill replaces the previous navy treatment per
        // Figma node `3370:16984`. The band is a quiet anchor for the
        // grid below rather than a high-contrast bar.
        background: 'var(--color-neutral-100)',
        color: 'var(--color-text-primary)',
        padding: '6px 18px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 15,
          lineHeight: '24px',
          color: 'var(--color-text-primary)',
        }}
      >
        {isAll ? (
          <>
            All Tasks
            {allRange && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 13,
                  fontWeight: 400,
                  color: 'var(--color-text-secondary)',
                }}
              >
                ({allRange})
              </span>
            )}
          </>
        ) : isTodayScope ? (
          <>
            Today
            <span
              style={{
                marginLeft: 8,
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--color-text-secondary)',
              }}
            >
              <span
                aria-hidden
                style={{
                  marginRight: 8,
                  color: 'var(--color-border-subtle)',
                }}
              >
                |
              </span>
              {formatLongWithDow(scope.iso)}
            </span>
          </>
        ) : (
          formatLongWithDow(scope.iso)
        )}
      </h3>
      {totalItems > 0 && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}
        >
          {isAll || tasks.length === 0
            ? `${totalItems} ${totalItems === 1 ? 'task' : 'tasks'}`
            : `${completed} of ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} complete`}
        </span>
      )}
    </header>
  )
}

/** Discriminated union for the unified task-list rendering. Tasks and
 *  custom-task occurrences flow through the same chronologically-sorted
 *  array so the right column reads as one combined "what's due" feed. */
type RenderItem =
  | { kind: 'task'; key: string; date: string; task: StudyTask }
  | { kind: 'custom'; key: string; date: string; occurrence: CustomEventOccurrence }

/** Shared ul layout for both the pending list and the Completed
 *  subsection — same gap + base reset so the two sections look
 *  identical visually, only separated by the subheading. */
const taskListUlStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

/** Subsection heading sat between the pending and completed `<ul>`s
 *  in All Tasks scope. Lowercase-styled to match the toolbar's chip
 *  type weight — quiet enough to read as a delimiter, not a section
 *  header that competes with the scope band above. */
const completedSectionHeaderStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

/** Subheader for the in-rail "Overdue" group in today's scope. Warning
 *  tint so the past-due cluster reads as urgent at a glance after the
 *  learner has worked through today's list above. */
const overdueSectionHeaderStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-warning-700)',
}

/**
 * Renders a single task-list row regardless of kind. Pulled out of
 * the JSX so the pending + Completed sections share rendering logic
 * without duplicating the conditional `<TaskRow>` vs.
 * `<CustomEventRow>` branch.
 */
function renderTaskListItem(
  item: RenderItem,
  ctx: {
    isAll: boolean
    demoCompletedIds: Set<string>
    completedCustomEventIds: Set<string>
    onViewCustomEvent: (eventId: string) => void
    onEditCustomEvent: (eventId: string) => void
    onCompleteCustomEvent: (eventId: string) => void
    onMarkDemoComplete: (taskId: string) => void
  },
): React.ReactNode {
  if (item.kind === 'task') {
    return (
      <TaskRow
        key={item.key}
        task={item.task}
        compact
        showDueDate={ctx.isAll}
        demoCompleted={ctx.demoCompletedIds.has(item.task.id)}
        onMarkDemoComplete={ctx.onMarkDemoComplete}
      />
    )
  }
  return (
    <CustomEventRow
      key={item.key}
      occurrence={item.occurrence}
      showDate={ctx.isAll}
      completed={ctx.completedCustomEventIds.has(item.occurrence.eventId)}
      onClick={() => ctx.onViewCustomEvent(item.occurrence.eventId)}
      onMarkComplete={() => ctx.onCompleteCustomEvent(item.occurrence.eventId)}
      onEdit={() => ctx.onEditCustomEvent(item.occurrence.eventId)}
    />
  )
}

/**
 * Effective-completed check across both kinds. Tasks count as
 * completed when their fixture status is `completed` OR they've
 * been marked in the in-session demo set. Custom-task occurrences
 * count when the source event id is in `completedCustomEventIds`.
 */
function isRenderItemCompleted(
  item: RenderItem,
  demoCompletedIds: Set<string>,
  completedCustomEventIds: Set<string>,
): boolean {
  if (item.kind === 'task') {
    return (
      item.task.status === 'completed' || demoCompletedIds.has(item.task.id)
    )
  }
  return completedCustomEventIds.has(item.occurrence.eventId)
}

function TasksColumn({
  scope,
  tasks,
  customEvents,
  overdueTasks,
  onViewCustomEvent,
  onEditCustomEvent,
  onCompleteCustomEvent,
  completedCustomEventIds,
  demoCompletedIds,
  onMarkDemoComplete,
  isFiltered,
  scopeIso,
  onAddCustomEvent,
}: {
  scope: Scope
  tasks: StudyTask[]
  /** Custom-task occurrences for the current scope. Interleaved with
   *  scheduled tasks chronologically so the column reads as one feed. */
  customEvents: CustomEventOccurrence[]
  /** Overdue tasks lifted above the today list when the learner is
   *  looking at today's scope. Empty in every other scope. */
  overdueTasks: StudyTask[]
  /** Default click on a custom-task card. Opens the read-only View
   *  Custom Task panel. */
  onViewCustomEvent: (eventId: string) => void
  /** Opens the panel in edit mode — used by the row kebab's Edit
   *  item AND by the view panel's Edit secondary action. */
  onEditCustomEvent: (eventId: string) => void
  /** Marks a custom task complete in the session set. */
  onCompleteCustomEvent: (eventId: string) => void
  /** Custom-task ids the learner has marked complete this session. */
  completedCustomEventIds: Set<string>
  /** Set of task ids the learner has marked complete in this session via
   *  the demo card flow. Passed through to TaskRow so the row renders as
   *  completed regardless of fixture status. */
  demoCompletedIds: Set<string>
  /** Called when a demo card marks itself complete. */
  onMarkDemoComplete: (taskId: string) => void
  /** True when a status/`custom` chip is active. A filter-empty column keeps
   *  the "No tasks match the active filters." message; a truly-empty
   *  (unfiltered) column shows the create-task invitation card instead. */
  isFiltered: boolean
  /** The scoped day's ISO (date scope) or today (all scope) — used for the
   *  invitation-card copy and the create-task default date. */
  scopeIso: string
  /** Opens `AddCustomEventPanel` in add mode, pre-filled with `iso`. */
  onAddCustomEvent: (iso: string) => void
}) {
  const isAll = scope.kind === 'all'

  // Merge tasks + custom-task occurrences into one feed. All Tasks
  // buckets pending items first (sorted by date) then completed
  // items (also by date) so the bottom of the list always reads as
  // "Completed". A single-day scope keeps its prior shape (custom
  // tasks first, then scheduled tasks) since the date is fixed and
  // a Completed section would feel redundant for one day.
  const items = useMemo<RenderItem[]>(() => {
    const taskItems: RenderItem[] = tasks.map((t) => ({
      kind: 'task',
      key: t.id,
      date: t.dueDate,
      task: t,
    }))
    const customItems: RenderItem[] = customEvents.map((o) => ({
      kind: 'custom',
      key: `${o.eventId}-${o.iso}`,
      date: o.iso,
      occurrence: o,
    }))
    if (scope.kind === 'all') {
      return [...taskItems, ...customItems].sort((a, b) => {
        const aDone = isRenderItemCompleted(
          a,
          demoCompletedIds,
          completedCustomEventIds,
        )
        const bDone = isRenderItemCompleted(
          b,
          demoCompletedIds,
          completedCustomEventIds,
        )
        // Pending bucket first, completed bucket second.
        if (aDone !== bDone) return aDone ? 1 : -1
        // Chronological within each bucket.
        return a.date.localeCompare(b.date)
      })
    }
    // Single-day scope — show custom-task rows first, then tasks.
    return [...customItems, ...taskItems]
  }, [tasks, customEvents, scope, demoCompletedIds, completedCustomEventIds])

  // Soft-cap the visible list at 12 items; show a "View all" affordance
  // when there's more, expanded inline rather than scrolled. Resets to
  // collapsed whenever the underlying items array changes — done during
  // render (React's "adjust state when a prop changes" pattern) rather
  // than in an effect, which would trigger a cascading re-render.
  const [expanded, setExpanded] = useState(false)
  const [prevItems, setPrevItems] = useState(items)
  if (items !== prevItems) {
    setPrevItems(items)
    setExpanded(false)
  }
  const overLimit = items.length > TASK_LIST_VISIBLE_LIMIT
  const visibleItems =
    expanded || !overLimit ? items : items.slice(0, TASK_LIST_VISIBLE_LIMIT)
  const hiddenCount = items.length - visibleItems.length
  // Overdue rolls into the empty check so the column doesn't fall
  // back to "No tasks match the active filters." when today has no
  // scheduled tasks but the calendar still has overdue work above.
  const empty = items.length === 0 && overdueTasks.length === 0

  // Split the visible window into pending vs. completed so the All
  // Tasks render can drop a "Completed" subheading between the two
  // groups. The sort above already arranges items so completed
  // entries come last — this filter just identifies the boundary.
  const pendingVisible = isAll
    ? visibleItems.filter(
        (item) =>
          !isRenderItemCompleted(item, demoCompletedIds, completedCustomEventIds),
      )
    : visibleItems
  const completedVisible = isAll
    ? visibleItems.filter((item) =>
        isRenderItemCompleted(item, demoCompletedIds, completedCustomEventIds),
      )
    : []

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'sticky',
        top: 24,
      }}
    >
      {empty ? (
        // Two empty states: a filter that dropped the list to zero keeps the
        // plain "no matches" message (creating a task would just hide under
        // the active filter); a genuinely empty, unfiltered day gets the
        // create-task invitation card instead.
        isFiltered ? (
          // Matches the empty-day text treatment (left-aligned, no boxed
          // panel) — with the same "Add Task" control beneath.
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                lineHeight: '20px',
                color: 'var(--color-text-primary)',
              }}
            >
              No tasks match the active filters.
            </p>
            <AddCustomTaskFooter scopeIso={scopeIso} onAddCustomEvent={onAddCustomEvent} />
          </div>
        ) : (
          <EmptyDayInvitation scopeIso={scopeIso} onAddCustomEvent={onAddCustomEvent} />
        )
      ) : (
        <>
          {pendingVisible.length > 0 && (
            <ul style={taskListUlStyle}>
              {pendingVisible.map((item) =>
                renderTaskListItem(item, {
                  isAll,
                  demoCompletedIds,
                  completedCustomEventIds,
                  onViewCustomEvent,
                  onEditCustomEvent,
                  onCompleteCustomEvent,
                  onMarkDemoComplete,
                }),
              )}
            </ul>
          )}
          {/* "Overdue" subsection — sits below today's tasks in
              single-day "Today" scope when the calendar has overdue
              work. Today's tasks lead so the learner sees what's
              due now first; overdue past-due work follows for
              recovery. Each overdue card shows the date it was
              originally due via `showDueDate`. */}
          {overdueTasks.length > 0 && (
            <>
              <h4 style={overdueSectionHeaderStyle}>Overdue</h4>
              <ul style={taskListUlStyle}>
                {overdueTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    compact
                    showDueDate
                    demoCompleted={demoCompletedIds.has(task.id)}
                    onMarkDemoComplete={onMarkDemoComplete}
                  />
                ))}
              </ul>
            </>
          )}
          {/* "Completed" subsection — only shows in All Tasks scope
              and only when at least one completed item falls within
              the current visible window. The header sits between the
              pending and completed `<ul>`s so the two groups read as
              distinct sections sharing the column. */}
          {isAll && completedVisible.length > 0 && (
            <>
              <h4 style={completedSectionHeaderStyle}>Completed</h4>
              <ul style={taskListUlStyle}>
                {completedVisible.map((item) =>
                  renderTaskListItem(item, {
                    isAll,
                    demoCompletedIds,
                    completedCustomEventIds,
                    onViewCustomEvent,
                    onEditCustomEvent,
                    onCompleteCustomEvent,
                    onMarkDemoComplete,
                  }),
                )}
              </ul>
            </>
          )}
          {/* View all / Show less toggle — only when the list runs over
              the 12-item soft cap. */}
          {overLimit && (
            <div style={{ display: 'flex', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-action)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {expanded ? 'Show less' : `View all (${hiddenCount} more)`}
                <ChevronDown
                  size={14}
                  aria-hidden
                  // Rotate the same chevron 180° for the "Show less" state
                  // so we don't need to import a separate ChevronUp glyph.
                  style={{
                    transform: expanded ? 'rotate(180deg)' : undefined,
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>
            </div>
          )}
          {/* Persistent "Add a custom task" footer — the same create entry
              point as the empty-day card, kept discoverable under a
              populated day. Single-day scope only (adding to "All Tasks"
              has no target day). Shown regardless of the status filter —
              it's an add affordance, not filtered content. */}
          {scope.kind === 'date' && (
            <AddCustomTaskFooter scopeIso={scopeIso} onAddCustomEvent={onAddCustomEvent} />
          )}
        </>
      )}
    </aside>
  )
}

/**
 * Component A — empty-state for a genuinely empty, unfiltered day: a
 * "Nothing scheduled" header + one-line prompt, with the SAME
 * `AddCustomTaskFooter` control the populated days use beneath it (so
 * the add affordance is identical everywhere).
 */
export function EmptyDayInvitation({
  scopeIso,
  onAddCustomEvent,
}: {
  scopeIso: string
  onAddCustomEvent: (iso: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '20px',
            color: 'var(--color-text-primary)',
          }}
        >
          Nothing scheduled
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            lineHeight: '16px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Looks like you’ve got a free day - why not add something?
        </p>
      </div>
      <AddCustomTaskFooter scopeIso={scopeIso} onAddCustomEvent={onAddCustomEvent} />
    </div>
  )
}

/**
 * Component C — persistent "Add a custom task" footer under a populated
 * day. A quiet full-width dashed button; the border strengthens to the
 * accent color on hover. Opens the same pre-filled add panel as the
 * empty-day card.
 */
export function AddCustomTaskFooter({
  scopeIso,
  onAddCustomEvent,
}: {
  scopeIso: string
  onAddCustomEvent: (iso: string) => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={() => onAddCustomEvent(scopeIso)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: '100%',
        padding: 11,
        // Dashed at rest → solid accent border + light CTA-100 wash on hover.
        background: hover
          ? 'color-mix(in srgb, var(--color-cta-100) 50%, transparent)'
          : 'transparent',
        border: hover
          ? '1px solid var(--color-action)'
          : '1px dashed var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        // Link darkens to the hover action color on hover.
        color: hover ? 'var(--color-action-hover)' : 'var(--color-action)',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <Plus size={14} aria-hidden />
      Add Task
    </button>
  )
}

/**
 * Custom-task row that mirrors `TaskRow`'s visual chrome (same card
 * shell, same 36×36 left icon container with neutral-tinted bg, same
 * title + meta + right-cluster layout). Differences vs. TaskRow:
 *   - No status concept → uses 'upcoming' (neutral) icon colors so
 *     the row reads as a quiet, neutral entry rather than a colored
 *     status badge.
 *   - The meta line says "Custom" where Video / Quiz / Exam /
 *     Reading would appear on a scheduled task, per design feedback.
 *   - The right-cluster's status slot carries the event's time
 *     (e.g. "3:30 PM") or "All day", since events don't have a
 *     status to surface.
 *   - The card body opens the read-only View Custom Task panel.
 *     Mark complete / Edit live behind a kebab menu mirroring the
 *     TaskRow action menu.
 *   - When marked complete, the row renders with strikethrough title
 *     + dimmed opacity + "Completed" label and the kebab hides
 *     (terminal state — no more actions).
 */
function CustomEventRow({
  occurrence,
  showDate,
  completed,
  onClick,
  onMarkComplete,
  onEdit,
}: {
  occurrence: CustomEventOccurrence
  showDate: boolean
  completed: boolean
  /** Card body click — opens the View Custom Task panel. */
  onClick: () => void
  /** Kebab "Mark complete" action. */
  onMarkComplete: () => void
  /** Kebab "Edit" action. */
  onEdit: () => void
}) {
  const metaParts: string[] = []
  if (showDate) metaParts.push(formatShortWithDow(occurrence.iso))
  metaParts.push('Custom')
  if (occurrence.repeat !== 'none') metaParts.push(formatRepeat(occurrence.repeat))
  const meta = metaParts.join(' · ')

  // Right-cluster label — fills the slot StatusTextLabel sits in on
  // scheduled tasks. Once complete, mirrors the "Completed" label
  // a finished TaskRow shows.
  const rightLabel = completed
    ? 'Completed'
    : occurrence.allDay
      ? 'All day'
      : occurrence.time
        ? formatTime12hr(occurrence.time)
        : null

  // Bubble-from-button guard — clicking the kebab dropdown (any
  // <button> inside the row) shouldn't also open the view panel.
  const handleCardClick = (e: React.MouseEvent<HTMLLIElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    onClick()
  }

  return (
    <li
      className="cre-task-card"
      onClick={handleCardClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 16px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        listStyle: 'none',
        cursor: 'pointer',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          // Tertiary-tinted tile so custom events read as their own
          // category vs. the status-colored task tiles (success / primary
          // / warning / neutral). Same tertiary 100/700 pairing that
          // `.cre-menu-item` uses for its accented hover state — each
          // brand's tertiary ramp picks the matching tone automatically.
          // Completed rows flip to the success palette to mirror
          // TaskRow's completed icon tile.
          background: completed
            ? 'var(--color-success-100)'
            : 'var(--color-tertiary-100)',
          color: completed
            ? 'var(--color-success-800)'
            : 'var(--color-tertiary-700)',
        }}
      >
        {completed ? (
          <CircleCheck size={18} aria-hidden />
        ) : (
          <CalendarDay size={18} aria-hidden />
        )}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--color-text-primary)',
            overflowWrap: 'anywhere',
            textDecoration: completed ? 'line-through' : undefined,
            opacity: completed ? 0.7 : 1,
          }}
        >
          {occurrence.title}
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            lineHeight: '16px',
          }}
        >
          {meta}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 500,
            lineHeight: '18px',
            color: completed
              ? 'var(--color-success-700)'
              : 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {rightLabel}
        </span>
        {completed ? (
          // Terminal state — drop the kebab and render a transparent
          // 32×32 spacer so the right edge stays aligned with un-
          // completed peer rows.
          <span
            aria-hidden
            style={{ display: 'inline-block', width: 32, height: 32, flexShrink: 0 }}
          />
        ) : (
          <CustomEventActionMenu
            title={occurrence.title}
            onMarkComplete={onMarkComplete}
            onEdit={onEdit}
          />
        )}
      </div>
    </li>
  )
}

/**
 * Kebab + dropdown menu rendered on uncompleted custom-task rows.
 * Mirrors TaskRow's `TaskActionMenu` but with custom-task-specific
 * actions (Mark complete + Edit) — "Open" doesn't apply since custom
 * tasks aren't linked to course content.
 */
function CustomEventActionMenu({
  title,
  onMarkComplete,
  onEdit,
}: {
  title: string
  onMarkComplete: () => void
  onEdit: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const fire = (action: () => void) => {
    action()
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={`More actions for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="cre-card-kebab"
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 160,
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
            padding: 4,
            zIndex: 10,
          }}
        >
          <CustomEventMenuItem onClick={() => fire(onMarkComplete)}>
            Mark complete
          </CustomEventMenuItem>
          <CustomEventMenuItem onClick={() => fire(onEdit)}>
            Edit
          </CustomEventMenuItem>
        </div>
      )}
    </div>
  )
}

function CustomEventMenuItem({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-neutral-75)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

function formatShortWithDow(iso: string): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${dow[date.getUTCDay()]}, ${SHORT_MONTHS[m - 1]} ${d}`
}

function formatTime12hr(hhmm: string): string {
  const [h, m] = hhmm.split(':').map((p) => parseInt(p, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const period = h >= 12 ? 'PM' : 'AM'
  const display = ((h + 11) % 12) + 1
  return `${display}:${String(m).padStart(2, '0')} ${period}`
}

function formatRepeat(repeat: CustomEventRepeat): string {
  switch (repeat) {
    case 'daily':
      return 'Repeats daily'
    case 'weekday':
      return 'Repeats weekdays'
    case 'weekly':
      return 'Repeats weekly'
    case 'monthly':
      return 'Repeats monthly'
    case 'none':
      return ''
  }
}

function DayCellButton({
  cell,
  selected,
  filterTint,
  onSelect,
}: {
  cell: DayCell
  selected: boolean
  /**
   * Background color when at least one active status chip matches a task
   * on this day. `null` for non-matching days OR when no chips are active.
   * Takes precedence over the default neutral-75 fill so matched days
   * stand out as "filter-selected".
   */
  filterTint: string | null
  onSelect: () => void
}) {
  const border = selected
    ? '2px solid var(--color-action)'
    : cell.isToday
      ? '1px solid var(--color-action)'
      : '1px solid transparent'
  // Combined item count — scheduled tasks AND custom-event occurrences
  // roll into a single "N tasks" chip so the day cell shows one number.
  const itemCount = cell.tasks.length + cell.customEvents.length
  const dotColor =
    cell.summary === 'has-overdue'
      ? 'var(--color-warning-500)'
      : cell.summary === 'all-complete'
        ? 'var(--color-success-500)'
        : cell.summary === 'has-in-progress'
          ? 'var(--color-primary-500)'
          : cell.summary === 'has-upcoming'
            ? 'var(--color-neutral-400)'
            : // No scheduled tasks but at least one custom event — fall back
              // to the same tertiary tone the row icon uses so the dot
              // still reads as "something here today" without misleading
              // about a status that doesn't apply.
              cell.customEvents.length > 0
              ? 'var(--color-tertiary-500)'
              : 'transparent'
  const background = cell.inMonth
    ? (filterTint ?? 'var(--color-neutral-75)')
    : 'transparent'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!cell.inMonth}
      className="cre-day-cell"
      style={{
        minHeight: 72,
        padding: '8px 10px',
        textAlign: 'left',
        background,
        border,
        borderRadius: 'var(--radius-sm)',
        cursor: cell.inMonth ? 'pointer' : 'default',
        opacity: cell.inMonth ? 1 : 0.4,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: cell.isToday ? 700 : 500,
          color: cell.isToday ? 'var(--color-action)' : 'var(--color-text-primary)',
        }}
      >
        {cell.day}
      </span>
      {itemCount > 0 && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 'var(--radius-pill)',
              background: dotColor,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--color-text-secondary)',
            }}
          >
            {itemCount} task{itemCount === 1 ? '' : 's'}
          </span>
        </span>
      )}
    </button>
  )
}

// Segmented "Pill Tab" track holding the Today / All Tasks scope
// toggle. Mirrors `PillTabs` (neutral-50 fill) but compact — fixed
// 33.5px to match the status chips beside it. Radius steps down from
// PillTabs' --radius-xl (16px) to --radius-lg (12px): at this shorter
// height that keeps the same rounded-rectangle proportion as the taller
// My Courses tabs, rather than reading as a full capsule.
const scopeTablistStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'stretch',
  height: 33.5,
  background: 'var(--color-neutral-50)',
  borderRadius: 'var(--radius-lg)',
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 18px',
        borderRadius: 'var(--radius-lg)',
        // Inactive tabs get a light-gray hover wash; the active tab keeps its fill.
        background: active
          ? 'var(--color-cta-500)'
          : hover
            ? 'var(--color-neutral-100)'
            : 'transparent',
        color: active ? 'var(--color-neutral-50)' : 'var(--color-neutral-dark)',
        border: 'none',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function FilterChip({
  active,
  colors,
  onClick,
  children,
}: {
  active: boolean
  /** Status-specific color tokens applied when active. */
  colors: { bg: string; fg: string; border: string }
  onClick: () => void
  children: React.ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--radius-pill)',
        // Inactive chips get a light-gray hover wash + a slightly darker
        // border; active chips keep their status color.
        background: active ? colors.bg : hover ? 'var(--color-neutral-100)' : 'transparent',
        color: active ? colors.fg : 'var(--color-text-secondary)',
        border: `1px solid ${
          active ? colors.border : hover ? 'var(--color-neutral-300)' : 'var(--color-border-subtle)'
        }`,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function LinkAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="cre-link-action cre-study-calendar-print-hide"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: 0,
        background: 'transparent',
        border: 'none',
        color: 'var(--color-action)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

