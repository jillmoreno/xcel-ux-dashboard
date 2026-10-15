import {
  PLANNER_BREAK_WEEK,
  PLANNER_NORM_MINUTES,
  PLANNER_PACES,
  PLANNER_PLAN,
  PLANNER_STARTERS,
  PLANNER_TOPICS,
  type DayMinutes,
  type PlannerStarterId,
} from '@/data/compassStudyPlannerFixtures'
import {
  DOW_SHORT,
  addDays,
  copyMinutes,
  dateFromKey,
  dayKey,
  fmtHM,
  fmtShort,
  keysBetween,
  midnight,
  sameDay,
  weeklyMinutes,
} from './compassStudyPlannerModel'

/**
 * THE PLAN — one state for the Study planner AND the Overview's Tonight card,
 * 2026-10-15, from Anjani's second master (the file published as the
 * type-scale preview). Her `PL` object and every `pl*` / `dw*` function that
 * changes it, as pure functions over an immutable state: the provider in
 * `CompassPlanContext` holds the state and runs these; the components render
 * it. Nothing here touches the DOM, so every date the pages state can be
 * tested without one.
 *
 * ⚠ WHY ONE STORE. In her file the dashboard's Tonight card, its week strip
 * and "Can't study tonight" all read and write the planner's `PL` — "the
 * Tonight card and the strip share one source of truth" is her own comment.
 * Two states would let the Overview say one thing and the planner another,
 * which is the exact bug a shared plan exists to prevent.
 *
 * ⚠ THE SIMULATE BUTTONS ARE NOT HERE. Her "Study today / Miss today / Away a
 * week" are prototype scaffolding that advance the clock; the product does
 * that through the `compass-planner-absence` design control, which seeds an
 * ABSENCE into the initial state (`withAbsence`). Same outcome, no buttons
 * in the page.
 */

export type PlanNotice = { msg: string; before: string; after: string; showFinish: boolean; undone?: boolean }
export type Snapshot = { dayMins: DayMinutes; off: Set<string>; label: string; line: number }
export type RubiLine =
  | { kind: 'r' | 'u'; id: number; text: string; boldPace?: boolean }
  | { kind: 'applied'; id: number; text: string; before: string; after: string }
export type Absence = { from: Date; days: number; missed: number; dismissed: boolean }

export type PlanState = {
  today: Date
  exam: Date
  minsLeft: number
  dayMins: DayMinutes
  off: Set<string>
  done: Set<string>
  doneTopics: string[]
  away: Absence | null
  view: 'week' | 'month'
  cursor: Date
  /* the pace editor */
  editOpen: boolean
  savedPlan: DayMinutes | null
  byRubi: boolean
  flash: Set<string>
  /* days off */
  dayUndo: { dayMins: DayMinutes; off: Set<string> } | null
  notice: PlanNotice | null
  sel: Set<string>
  selMode: boolean
  selLast: string | null
  selFrom: string | null
  /* Rubi's panel */
  panelOpen: boolean
  lines: RubiLine[]
  stack: Snapshot[]
  startersUsed: boolean
  seq: number
  /* the Overview's Tonight card */
  tonightUndo: Set<string> | null
  tonightNote: { before: string; after: string } | 'back' | null
}

export type PlanAction = (s: PlanState) => PlanState

const SEED_LINES: RubiLine[] = [
  {
    kind: 'r',
    id: -2,
    text: "Here's the plan from your setup — the Average pace, 7h 30m a week, finishing before your exam on Nov 20.",
    boldPace: true,
  },
  { kind: 'r', id: -1, text: "Tell me what's changed and I'll rebuild it. Your weekends are already off." },
]

export function initialPlan(): PlanState {
  return {
    today: PLANNER_PLAN.today,
    exam: PLANNER_PLAN.exam,
    minsLeft: PLANNER_PLAN.minsLeft,
    dayMins: copyMinutes(PLANNER_PLAN.dayMins),
    off: new Set(),
    done: new Set(),
    doneTopics: [],
    away: null,
    view: 'week',
    cursor: PLANNER_PLAN.today,
    editOpen: false,
    savedPlan: null,
    byRubi: false,
    flash: new Set(),
    dayUndo: null,
    notice: null,
    sel: new Set(),
    selMode: false,
    selLast: null,
    selFrom: null,
    panelOpen: true,
    lines: SEED_LINES,
    stack: [],
    startersUsed: false,
    seq: 0,
    tonightUndo: null,
    tonightNote: null,
  }
}

/* ---------------- the schedule ---------------- */

export type PlannedDay = { idx: number; topic: string; review: boolean; mins: number }
export type Schedule = { map: Record<string, PlannedDay>; finish: Date | null; leftover: number }

/** Walk forward from today spending each day's allotted minutes. Sessions are
 *  numbered from the ones already done, so a topic does not restart after a
 *  study day. */
export function schedule(s: Pick<PlanState, 'today' | 'exam' | 'minsLeft' | 'dayMins' | 'off' | 'done'>): Schedule {
  const map: Record<string, PlannedDay> = {}
  let spent = 0
  let n = 0
  let i = 0
  let finish: Date | null = null
  const stop = midnight(s.exam)
  let d = midnight(s.today)
  const base = s.done.size
  while (spent < s.minsLeft && i < 500 && d <= stop) {
    const mins = s.dayMins[d.getDay()]
    if (mins > 0 && !s.off.has(dayKey(d))) {
      const idx = base + n
      map[dayKey(d)] = { idx, topic: PLANNER_TOPICS[idx % PLANNER_TOPICS.length], review: idx > 0 && idx % 4 === 3, mins }
      spent += mins
      n++
      finish = new Date(d)
    }
    d = addDays(d, 1)
    i++
  }
  return { map, finish, leftover: s.minsLeft - spent }
}

export const weekly = (s: Pick<PlanState, 'dayMins'>) => weeklyMinutes(s.dayMins)

export function paceName(dayMins: readonly number[]): string {
  const hit = PLANNER_PACES.find((p) => p.mins.every((v, i) => v === dayMins[i]))
  return hit ? hit.name : 'Custom'
}

/** "Nov 11", "won't fit" or "no plan" — what Rubi and the notices quote. */
export function finishText(s: PlanState, sched = schedule(s)): string {
  if (!weekly(s)) return 'no plan'
  return sched.leftover > 0 || !sched.finish ? "won't fit" : fmtShort(sched.finish)
}

export type FinishReadback = { finish: string; status: string; tone: 'ok' | 'warn' }
export function finishReadback(s: PlanState, sched = schedule(s)): FinishReadback {
  if (!weekly(s)) return { finish: 'Not set', status: 'Give yourself time on at least one day.', tone: 'warn' }
  if (sched.leftover > 0 || !sched.finish) {
    return { finish: "Won't fit", status: `${fmtHM(sched.leftover)} of study has nowhere to go before your exam.`, tone: 'warn' }
  }
  const gap = daysBetween(sched.finish, s.exam)
  if (gap >= 3) return { finish: fmtShort(sched.finish), status: `${gap} days before your exam`, tone: 'ok' }
  return {
    finish: fmtShort(sched.finish),
    status: gap === 0 ? 'The same day as your exam — that is tight' : `${gap} days before your exam — that is tight`,
    tone: 'warn',
  }
}

const daysBetween = (a: Date, b: Date) => Math.round((midnight(b).getTime() - midnight(a).getTime()) / 86400000)
export const daysAway = (s: PlanState) => daysBetween(s.today, s.exam)

/** What a pace would do, without keeping it — the preset cards say "Finishes
 *  Oct 21" or "Won't finish before your exam". */
export function finishWith(s: PlanState, mins: readonly number[]): { fits: boolean; date: Date | null } | null {
  if (!mins.some(Boolean)) return null
  const r = schedule({ ...s, dayMins: copyMinutes(mins) })
  return { fits: r.leftover <= 0, date: r.finish }
}

/** Where a session lands if its day is taken off — found by its place in the
 *  sequence. */
export function whereGoes(s: PlanState, key: string, idx: number): Date | null {
  const off = new Set(s.off)
  off.add(key)
  const { map } = schedule({ ...s, off })
  const hit = Object.keys(map).find((k) => map[k].idx === idx)
  return hit ? dateFromKey(hit) : null
}

/** "Finish Nov 11 → Nov 12", or "Finish stays Nov 11". */
export function finishPhrase(a: string, b: string): { text: string; bold?: string } {
  const say = (t: string) => (t === "won't fit" ? "won't fit before your exam" : t)
  if (a === b) return { text: `Finish stays ${say(b)}` }
  return b === "won't fit"
    ? { text: `Finish ${a} → `, bold: "Won't fit before your exam" }
    : { text: `Finish ${say(a)} → `, bold: b }
}

/* ---------------- the pace editor ---------------- */

const mark = (s: PlanState): PlanState => (s.savedPlan ? s : { ...s, savedPlan: copyMinutes(s.dayMins) })

export const setPace =
  (id: string): PlanAction =>
  (s) => {
    const p = PLANNER_PACES.find((x) => x.id === id)
    if (!p) return s
    return { ...mark(s), dayMins: copyMinutes(p.mins), byRubi: false }
  }
export const setDay =
  (n: number, v: number): PlanAction =>
  (s) => {
    const next = copyMinutes(s.dayMins)
    next[n] = v
    return { ...mark(s), dayMins: next, byRubi: false }
  }
export const savePlan: PlanAction = (s) => ({ ...s, savedPlan: null, editOpen: false })
export const undoChanges: PlanAction = (s) => ({
  ...s,
  dayMins: s.savedPlan ? copyMinutes(s.savedPlan) : s.dayMins,
  savedPlan: null,
  editOpen: false,
})
export const toggleEdit: PlanAction = (s) =>
  s.editOpen ? { ...s, editOpen: false, savedPlan: null } : { ...s, editOpen: true }

export const isDirty = (s: PlanState) => s.savedPlan !== null
export const normNote = (s: PlanState) => {
  const w = weekly(s)
  return w && w < PLANNER_NORM_MINUTES ? w : null
}

/* ---------------- the calendar ---------------- */

export const setView =
  (v: 'week' | 'month'): PlanAction =>
  (s) => ({ ...s, view: v, cursor: v === 'week' ? midnight(s.today) : s.cursor })
export const stepWeek =
  (dir: 1 | -1): PlanAction =>
  (s) => (s.view === 'week' ? { ...s, cursor: addDays(s.cursor, dir * 7) } : s)
export const goToWeek =
  (d: Date): PlanAction =>
  (s) => ({ ...s, cursor: new Date(d) })

export type CalendarCell = { date: Date }
/** Week view: the Sunday-to-Saturday week around the cursor. Full plan: this
 *  week's Sunday to exam week's Saturday — no empty weeks before today, and
 *  nothing to page through. */
export function cells(s: PlanState): CalendarCell[] {
  const out: CalendarCell[] = []
  if (s.view === 'month') {
    const start = addDays(midnight(s.today), -s.today.getDay())
    const end = addDays(midnight(s.exam), 6 - s.exam.getDay())
    for (let cur = new Date(start); cur <= end; cur = addDays(cur, 1)) out.push({ date: new Date(cur) })
  } else {
    const start = addDays(s.cursor, -s.cursor.getDay())
    for (let k = 0; k < 7; k++) out.push({ date: addDays(start, k) })
  }
  return out
}
export function periodLabel(s: PlanState): string {
  if (s.view === 'month') return `${fmtShort(s.today)} to exam day`
  const start = addDays(s.cursor, -s.cursor.getDay())
  const end = addDays(start, 6)
  const thisWeek = midnight(s.today) >= midnight(start) && midnight(s.today) <= midnight(end)
  const range = `${fmtShort(start)} – ${start.getMonth() === end.getMonth() ? end.getDate() : fmtShort(end)}`
  return `${thisWeek ? 'This week' : `Week of ${fmtShort(start)}`} · ${range}`
}

/* ---------------- days off ---------------- */

const fmtLong = (d: Date) => `${DOW_SHORT[d.getDay()]}, ${fmtShort(d)}`
export { fmtLong }

/** Take one day off, or put one back; the notice says what moved. */
export const applyDay =
  (key: string, how: 'off' | 'back'): PlanAction =>
  (s) => {
    const before = finishText(s)
    const d = dateFromKey(key)
    const off = new Set(s.off)
    const flash = new Set<string>()
    let msg: string
    if (how === 'off') {
      const plan = schedule(s).map[key]
      const landed = plan ? whereGoes(s, key, plan.idx) : null
      off.add(key)
      flash.add(key)
      msg = `${fmtLong(d)} is off.` + (plan && landed ? ` ${plan.topic} moved to ${fmtLong(landed)}.` : '')
      if (landed) flash.add(dayKey(landed))
    } else {
      off.delete(key)
      flash.add(key)
      msg = `${fmtLong(d)} is back in your plan.`
    }
    const next: PlanState = { ...s, off, flash, dayUndo: { dayMins: copyMinutes(s.dayMins), off: new Set(s.off) } }
    return { ...next, notice: { msg, before, after: finishText(next), showFinish: false } }
  }
export const undoDay: PlanAction = (s) => {
  if (!s.dayUndo) return s
  const before = finishText(s)
  const next: PlanState = { ...s, dayMins: s.dayUndo.dayMins, off: s.dayUndo.off, dayUndo: null }
  const after = finishText(next)
  return { ...next, notice: { msg: `Undone. Finish ${before === after ? 'stays' : 'is back to'} `, before, after, showFinish: false, undone: true } }
}
export const closeNotice: PlanAction = (s) => ({ ...s, notice: null, dayUndo: null })
export const clearFlash: PlanAction = (s) => (s.flash.size ? { ...s, flash: new Set() } : s)

/** A day that is off by the pace itself ("Sundays are off in your pace"), or
 *  one the learner marked. Neither can be picked in selection mode. */
export const isOffDay = (s: PlanState, key: string) => s.off.has(key) || !s.dayMins[dateFromKey(key).getDay()]

export const selStart =
  (fromKey: string | null): PlanAction =>
  (s) => ({
    ...s,
    notice: null,
    dayUndo: null,
    selMode: true,
    sel: new Set(fromKey ? [fromKey] : []),
    selLast: fromKey,
    selFrom: fromKey,
  })
export const selToggle =
  (key: string, shift: boolean): PlanAction =>
  (s) => {
    if (!s.selMode || isOffDay(s, key)) return s
    const sel = new Set(s.sel)
    if (shift && s.selLast) {
      for (const k of keysBetween(s.selLast, key)) {
        const d = dateFromKey(k)
        if (midnight(d) >= midnight(s.today) && !sameDay(d, s.exam) && !isOffDay(s, k)) sel.add(k)
      }
    } else if (sel.has(key)) sel.delete(key)
    else sel.add(key)
    return { ...s, sel, selLast: key }
  }
export const selEnd =
  (apply: boolean): PlanAction =>
  (s) => {
    const before = finishText(s)
    const n = s.sel.size
    let next: PlanState = { ...s, selMode: false, sel: new Set(), selFrom: null, selLast: null }
    if (apply && n) {
      const off = new Set(s.off)
      const flash = new Set<string>()
      s.sel.forEach((k) => {
        off.add(k)
        flash.add(k)
      })
      next = { ...next, off, flash, dayUndo: { dayMins: copyMinutes(s.dayMins), off: new Set(s.off) } }
      next = {
        ...next,
        notice: { msg: `${n} ${n === 1 ? 'day is' : 'days are'} off. Your sessions moved back.`, before, after: finishText(next), showFinish: true },
      }
    }
    return next
  }
/** The selection bar's preview — what the finish would be with the picked
 *  days off. */
export function selPreview(s: PlanState): string {
  const off = new Set(s.off)
  s.sel.forEach((k) => off.add(k))
  return finishText({ ...s, off })
}

/* ---------------- Rubi ---------------- */

const say = (s: PlanState, text: string, who: 'r' | 'u' = 'r'): PlanState => ({
  ...s,
  seq: s.seq + 1,
  lines: [...s.lines, { kind: who, id: s.seq + 1, text }],
})
const applied = (s: PlanState, text: string, before: string, after: string, line: number): PlanState => ({
  ...s,
  lines: [...s.lines, { kind: 'applied', id: line, text, before, after }],
})

export function starterReply(id: PlannerStarterId, before: string, after: string): string {
  switch (id) {
    case 'fri':
      return after === "won't fit"
        ? 'Fridays are clear. That takes you to six hours a week, and it no longer fits before your exam. Want me to move that time to another day?'
        : `Fridays are clear. Your finish moves from ${before} to ${after}.`
    case 'faster':
      return `I've moved you to the Crammer pace — two and a half hours on weekdays. That takes your finish from ${before} to ${after}, which is a bit more than two weeks. Undo if that's too much.`
    case 'break':
      return before === after
        ? 'That whole week is blocked. Your plan already finishes before it, so nothing else moves.'
        : `That whole week is blocked. Your sessions shift past it, so the finish moves from ${before} to ${after}.`
  }
}

/** The starter's first half: the learner's line, the change, the flash. The
 *  reply (`starterFollowUp`) comes a beat later, from the component. */
export const runStarter =
  (id: PlannerStarterId): PlanAction =>
  (s) => {
    const starter = PLANNER_STARTERS.find((x) => x.id === id)
    if (!starter) return s
    let next = say({ ...s, startersUsed: true }, starter.label, 'u')
    const before = schedule(s)
    let dayMins = copyMinutes(s.dayMins)
    const off = new Set(s.off)
    let cursor = s.cursor
    if (id === 'fri') dayMins[5] = 0
    if (id === 'faster') dayMins = copyMinutes(PLANNER_PACES[0].mins)
    if (id === 'break') {
      for (let k = PLANNER_BREAK_WEEK.from; k <= PLANNER_BREAK_WEEK.to; k++) {
        off.add(dayKey(new Date(s.today.getFullYear(), PLANNER_BREAK_WEEK.month, k)))
      }
      if (s.view === 'week') cursor = new Date(s.today.getFullYear(), PLANNER_BREAK_WEEK.month, PLANNER_BREAK_WEEK.from)
    }
    next = { ...next, dayMins, off, cursor, byRubi: true }
    const after = schedule(next)
    /* ⚠ THE CELLS THAT FLASH ARE THE ONES WHOSE PLAN CHANGED. Her `plFlashDow`
       flashed a weekday's sessions computed AFTER the change, so "Fridays are
       clear" lit nothing; this is what the flash was for. */
    const flash = new Set<string>()
    for (const k of Object.keys(before.map)) if (!after.map[k]) flash.add(k)
    for (const k of Object.keys(after.map)) if (!before.map[k]) flash.add(k)
    if (id === 'break') for (const k of off) if (!s.off.has(k)) flash.add(k)
    return { ...next, flash }
  }

/** The reply and the applied line, pushed after the beat. `snapshot` is the
 *  plan before the starter ran, for Undo. */
export const starterFollowUp =
  (id: PlannerStarterId, snapshot: PlanState): PlanAction =>
  (s) => {
    const starter = PLANNER_STARTERS.find((x) => x.id === id)
    if (!starter) return s
    const before = finishText(snapshot)
    const after = finishText(s)
    const line = s.seq + 1
    let next = say(s, starterReply(id, before, after))
    next = applied({ ...next, seq: line }, starter.done, before, after, line)
    return {
      ...next,
      stack: [...s.stack, { dayMins: copyMinutes(snapshot.dayMins), off: new Set(snapshot.off), label: starter.done, line }],
    }
  }

export const undoRubi: PlanAction = (s) => {
  const snap = s.stack[s.stack.length - 1]
  if (!snap) return s
  const before = finishText(s)
  let next: PlanState = { ...s, dayMins: copyMinutes(snap.dayMins), off: new Set(snap.off), stack: s.stack.slice(0, -1) }
  const after = finishText(next)
  next = say(next, 'Put it back the way it was.')
  if (!next.stack.length) next = { ...next, byRubi: false }
  return applied({ ...next, seq: next.seq + 1 }, `Undid: ${snap.label}`, before, after, next.seq + 1)
}
export const sayUser =
  (text: string): PlanAction =>
  (s) =>
    say({ ...s, startersUsed: true }, text, 'u')
export const sayRubi =
  (text: string): PlanAction =>
  (s) =>
    say(s, text)
export const setPanel =
  (open: boolean): PlanAction =>
  (s) => ({ ...s, panelOpen: open })

/* ---------------- absence: the return note ---------------- */

/** One day passes. Studied: the session is done and its minutes leave the
 *  plan. Missed: a run of missed days is one absence, however long. */
const passDay =
  (studied: boolean): PlanAction =>
  (s) => {
    const t = midnight(s.today)
    const key = dayKey(t)
    const plan = schedule(s).map[key]
    let next: PlanState = { ...s }
    if (studied) {
      if (plan) {
        const done = new Set(s.done)
        done.add(key)
        next = { ...next, done, doneTopics: [...s.doneTopics, plan.topic], minsLeft: Math.max(0, s.minsLeft - plan.mins) }
      }
      next = { ...next, away: null }
    } else {
      const away: Absence = s.away ?? { from: t, days: 0, missed: 0, dismissed: false }
      next = { ...next, away: { ...away, days: away.days + 1, missed: away.missed + (plan ? 1 : 0) } }
    }
    const today = addDays(t, 1)
    return { ...next, today, cursor: s.view === 'week' ? new Date(today) : s.cursor }
  }

export type AbsenceKind = 'none' | 'missed-day' | 'away-week'
/** What the `compass-planner-absence` control seeds. `away-week` studies two
 *  sessions first so the catch-up review (return note B) has something to
 *  recap — her demo flow was "Study today" twice, then "Away a week". */
export function withAbsence(s: PlanState, kind: AbsenceKind): PlanState {
  if (kind === 'missed-day') return passDay(false)(s)
  if (kind === 'away-week') {
    let n = passDay(true)(passDay(true)(s))
    for (let i = 0; i < 7; i++) n = passDay(false)(n)
    return n
  }
  return s
}

export type ReturnInfo = {
  head: string | null
  body: string
  line: string
  next: PlannedDay | null
  nextDate: Date | null
  isToday: boolean
  fits: boolean
  tight: boolean
  long: boolean
  recap: string[]
  catchup: boolean
}
/** Her `plReturnInfo`: the one note after time away, sized to the absence. */
export function returnInfo(s: PlanState, returnVer: 'A' | 'B'): ReturnInfo | null {
  const a = s.away
  if (!a || a.dismissed || !a.missed) return null
  const sched = schedule(s)
  const nk = Object.keys(sched.map).sort((x, y) => dateFromKey(x).getTime() - dateFromKey(y).getTime())[0]
  const next = nk ? sched.map[nk] : null
  const nextDate = nk ? dateFromKey(nk) : null
  const fits = sched.leftover <= 0
  const gap = fits && sched.finish ? daysBetween(sched.finish, s.exam) : 0
  const tight = fits && gap < 3
  const after = finishText(s, sched)
  const recap = s.doneTopics.slice(-2)
  const long = a.days > 2
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][a.from.getDay()]
  const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`
  const outcome = !fits
    ? 'It now runs past your exam — add a little time with Change pace to fix it.'
    : tight
      ? `You'll finish ${after}, only ${days(gap)} before your exam. A little more time this week gives you room.`
      : `You'll finish ${after}, still ${days(gap)} before your exam.`
  let head: string | null
  let body: string
  if (long) {
    head = "Welcome back — you're closer than you think."
    body = `You were away ${days(a.days)}, so your plan moved forward. ${outcome}`
  } else {
    head = null
    const what = a.missed === 1 ? `${dayName}'s session` : `Your last ${a.missed} sessions`
    body = `${what} moved forward. ${outcome}`
  }
  const catchup = returnVer === 'B' && long && recap.length > 0
  return {
    head,
    body,
    line: (head ? head + ' ' : '') + body,
    next,
    nextDate,
    isToday: !!nextDate && sameDay(nextDate, s.today),
    fits,
    tight,
    long,
    recap,
    catchup,
  }
}
export const dismissAway: PlanAction = (s) => (s.away ? { ...s, away: { ...s.away, dismissed: true } } : s)

/* ---------------- the Overview's Tonight card and week strip ---------------- */

export type WeekItem = {
  date: Date
  key: string
  plan: PlannedDay | undefined
  done: boolean
  off: boolean
  past: boolean
  now: boolean
  exam: boolean
}
export function weekItems(s: PlanState, sched = schedule(s)): WeekItem[] {
  const today = midnight(s.today)
  const start = addDays(today, -today.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    const key = dayKey(date)
    const plan = sched.map[key]
    const done = s.done.has(key)
    return {
      date,
      key,
      plan,
      done,
      off: s.off.has(key) || (!plan && !done && !s.dayMins[date.getDay()]),
      past: date < today,
      now: sameDay(date, today),
      exam: sameDay(date, s.exam),
    }
  })
}
export function weekSummary(items: WeekItem[]): string {
  const sess = items.filter((x) => x.plan || x.done)
  const mins = items.reduce((a, x) => a + (x.plan ? x.plan.mins : 0), 0)
  const doneN = items.filter((x) => x.done).length
  return `${sess.length} ${sess.length === 1 ? 'session' : 'sessions'}${doneN ? ` · ${doneN} done` : ''} · ${fmtHM(mins)} left`
}
export type Tonight = {
  dayNumber: number
  dayName: string
  title: string
  subline: string
  canSkip: boolean
  startLabel: string
}
export function tonight(s: PlanState, sched = schedule(s)): Tonight {
  const today = midnight(s.today)
  const items = weekItems(s, sched)
  const sess = items.filter((x) => x.plan || x.done)
  const t = sched.map[dayKey(today)]
  const dayName = DOW_SHORT[today.getDay()]
  if (t) {
    const idx = sess.findIndex((x) => x.now) + 1
    return {
      dayNumber: today.getDate(),
      dayName,
      title: `${t.topic} · ${fmtHM(t.mins)}`,
      subline: `Session ${idx} of ${sess.length} this week.${t.review ? ' Includes a spaced review.' : ''}`,
      canSkip: true,
      startLabel: 'Start session',
    }
  }
  const nk = Object.keys(sched.map).sort((a, b) => dateFromKey(a).getTime() - dateFromKey(b).getTime())[0]
  const n = nk ? sched.map[nk] : null
  const nd = nk ? dateFromKey(nk) : null
  return {
    dayNumber: today.getDate(),
    dayName,
    title: 'Tonight is off',
    subline: n && nd ? `Next: ${DOW_SHORT[nd.getDay()]} · ${n.topic}, ${fmtHM(n.mins)}` : 'Nothing left on your plan.',
    canSkip: false,
    startLabel: n ? 'Start next session' : 'Start session',
  }
}
/** "Can't study tonight" takes tonight off in the plan, says what moved, and
 *  can be undone. Same no-guilt rule as missed days. */
export const tonightOff: PlanAction = (s) => {
  const before = finishText(s)
  const off = new Set(s.off)
  off.add(dayKey(midnight(s.today)))
  const next: PlanState = { ...s, off, tonightUndo: new Set(s.off) }
  return { ...next, tonightNote: { before, after: finishText(next) } }
}
export const tonightUndo: PlanAction = (s) =>
  s.tonightUndo ? { ...s, off: s.tonightUndo, tonightUndo: null, tonightNote: 'back' } : s
