import {
  PLANNER_PACES,
  PLANNER_TOPICS,
  type DayMinutes,
} from '@/data/compassStudyPlannerFixtures'

/**
 * THE STUDY PLANNER'S ARITHMETIC — Anjani's `plSchedule` and the plan-bar
 * readback, as pure functions so the component holds state and nothing else,
 * and so the dates the page states can be tested without a DOM.
 *
 * ⚠ A PLAIN `.ts` MODULE, like `compassPages.ts`, for react-refresh's "only
 * export components" rule.
 */

export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** "2026-10-9" — her key shape, kept so a day-off set round-trips. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m, d)
}
export const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b)
export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
/** "Nov 20" */
export const fmtShort = (d: Date) => `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
/** "Nov 20, 2026" */
export const fmtLong = (d: Date) => `${fmtShort(d)}, ${d.getFullYear()}`
/** 90 → "1h 30m"; 0 → "0m". */
export function fmtHM(mins: number): string {
  if (!mins) return '0m'
  const h = Math.floor(mins / 60)
  const r = mins % 60
  return (h ? `${h}h` : '') + (h && r ? ' ' : '') + (r ? `${r}m` : '')
}
const daysBetween = (a: Date, b: Date) => Math.round((midnight(b).getTime() - midnight(a).getTime()) / 86400000)

export const weeklyMinutes = (dayMins: readonly number[]) => dayMins.reduce((a, b) => a + b, 0)

/** The preset whose seven numbers match exactly, else Custom. */
export function paceName(dayMins: readonly number[]): string {
  const hit = PLANNER_PACES.find((p) => p.mins.every((v, i) => v === dayMins[i]))
  return hit ? hit.name : 'Custom'
}

export type PlannedDay = { topic: string; review: boolean; mins: number }
export type Schedule = {
  /** By `dayKey`. */
  map: Record<string, PlannedDay>
  /** The last session's date, or null when no day carries any time. */
  finish: Date | null
  /** Minutes with nowhere to go before the exam — > 0 means "won't fit". */
  leftover: number
}

/**
 * Walk forward from today spending each day's allotted minutes until the work
 * is done or the exam arrives. This is what makes the finish date move when
 * the learner takes a day off or shifts hours.
 */
export function schedule(input: {
  today: Date
  exam: Date
  minsLeft: number
  dayMins: readonly number[]
  off: ReadonlySet<string>
}): Schedule {
  const map: Record<string, PlannedDay> = {}
  let spent = 0
  let n = 0
  let i = 0
  let finish: Date | null = null
  const stop = midnight(input.exam)
  let d = midnight(input.today)
  while (spent < input.minsLeft && i < 500 && d <= stop) {
    const mins = input.dayMins[d.getDay()]
    if (mins > 0 && !input.off.has(dayKey(d))) {
      map[dayKey(d)] = { topic: PLANNER_TOPICS[n % PLANNER_TOPICS.length], review: n > 0 && n % 4 === 3, mins }
      spent += mins
      n++
      finish = new Date(d)
    }
    d = addDays(d, 1)
    i++
  }
  return { map, finish, leftover: input.minsLeft - spent }
}

export type FinishReadback = { finish: string; status: string; tone: 'ok' | 'warn' }

/** The plan bar's third column — the date, and the sentence under it. */
export function finishReadback(s: Schedule, dayMins: readonly number[], exam: Date): FinishReadback {
  if (!weeklyMinutes(dayMins)) {
    return { finish: 'Not set', status: 'Give yourself time on at least one day.', tone: 'warn' }
  }
  if (s.leftover > 0 || !s.finish) {
    return {
      finish: "Won't fit",
      status: `${fmtHM(s.leftover)} of study has nowhere to go before your exam.`,
      tone: 'warn',
    }
  }
  const gap = daysBetween(s.finish, exam)
  if (gap >= 3) return { finish: fmtShort(s.finish), status: `${gap} days before your exam`, tone: 'ok' }
  return {
    finish: fmtShort(s.finish),
    status:
      gap === 0
        ? 'The same day as your exam — that is tight'
        : `${gap} days before your exam — that is tight`,
    tone: 'warn',
  }
}

/** What Rubi quotes before and after a change: "Nov 12", "won't fit" or "no
 *  plan". */
export function finishText(s: Schedule, dayMins: readonly number[]): string {
  if (!weeklyMinutes(dayMins)) return 'no plan'
  return s.leftover > 0 || !s.finish ? "won't fit" : fmtShort(s.finish)
}

export const daysAway = (today: Date, exam: Date) => daysBetween(today, exam)

export type CalendarCell = { date: Date; pad: boolean }

/** Six rows of seven from the Sunday before the 1st, trimmed to five when the
 *  sixth is all padding. */
export function monthCells(cursor: Date): CalendarCell[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  let cur = addDays(first, -first.getDay())
  let cells: CalendarCell[] = []
  for (let k = 0; k < 42; k++) {
    cells.push({ date: new Date(cur), pad: cur.getMonth() !== first.getMonth() })
    cur = addDays(cur, 1)
  }
  while (cells.length > 35 && cells.slice(35).every((c) => c.pad)) cells = cells.slice(0, 35)
  return cells
}

/** The Sunday-to-Saturday week around the cursor. */
export function weekCells(cursor: Date): CalendarCell[] {
  const start = addDays(cursor, -cursor.getDay())
  return Array.from({ length: 7 }, (_, k) => ({ date: addDays(start, k), pad: false }))
}

/** "September 2026" or "Sep 20 – Sep 26, 2026". */
export function periodLabel(view: 'month' | 'week', cursor: Date): string {
  if (view === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
  const s = addDays(cursor, -cursor.getDay())
  const e = addDays(s, 6)
  return `${fmtShort(s)} – ${fmtShort(e)}, ${e.getFullYear()}`
}

export function stepCursor(view: 'month' | 'week', cursor: Date, dir: 1 | -1): Date {
  return view === 'month'
    ? new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1)
    : addDays(cursor, dir * 7)
}

/** Switching views re-anchors the cursor: Week lands on today's week when the
 *  month on screen holds today, Month snaps to the 1st. */
export function cursorForView(view: 'month' | 'week', cursor: Date, today: Date): Date {
  if (view === 'week') {
    const t = midnight(today)
    return cursor.getMonth() === t.getMonth() && cursor.getFullYear() === t.getFullYear()
      ? new Date(t)
      : new Date(cursor)
  }
  return new Date(cursor.getFullYear(), cursor.getMonth(), 1)
}

/** Every key between two keys inclusive, in date order. */
export function keysBetween(a: string, b: string): string[] {
  const da = dateFromKey(a)
  const db = dateFromKey(b)
  const [s, e] = da < db ? [da, db] : [db, da]
  const out: string[] = []
  for (let d = new Date(s); d <= e; d = addDays(d, 1)) out.push(dayKey(d))
  return out
}

export const copyMinutes = (m: readonly number[]) => m.slice() as DayMinutes
