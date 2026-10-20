import { useMemo, useSyncExternalStore } from 'react'
import { FIXTURE_TODAY } from './myCoursesFixtures'

/**
 * THE LEARNER'S OWN BOOKED EXAM DATE — 2026-09-21, the direct ask on the
 * Schedule State Exam widget: *"Already scheduled? Enter the exam date and we
 * will use that to help you prep!"*
 *
 * The point is the second half of that sentence. A date the product merely
 * stored would be a control that does nothing; entering one here re-points the
 * page's Target Exam Date and everything derived from it — the days remaining,
 * and therefore the whole Pacing tile's required rate. That is what makes it
 * worth asking for.
 *
 * **A `useSyncExternalStore` over `localStorage`, the `demoControlsVisibility`
 * pattern**, for its reason: the input lives in one card and the figures it
 * moves are in two other blocks, so this cannot be a component's local state.
 * A `storage` event would NOT do it — that only fires for OTHER tabs, which is
 * the defect the Links nav badge shipped with and `todoStore`'s `cgp.todo`
 * exists to avoid. Subscribers are notified directly on write.
 *
 * **PER BROWSER, and never committed.** It is the reviewer's own input, the
 * same footing as `cgp.featureFlags.customDefaults` — so a machine holding one
 * shows a different Target Exam Date from a clean machine, with nothing in the
 * repo to explain it. `clearExamDate()` is the way back, and the card offers it.
 */
const KEY = 'cgp.examDate'

/**
 * THE TIME OF DAY THE EXAM IS BOOKED FOR — 2026-10-20, a SEPARATE key on
 * purpose.
 *
 * The Study Calendar's Edit Exam Date panel has always collected a time
 * alongside the date; the store never had anywhere to put it. Folding both
 * into `cgp.examDate` as JSON was the obvious move and is the wrong one: that
 * key already holds a bare `YYYY-MM-DD` in every reviewer's browser, and
 * `readExamDate` validates it by regex, so a reshaped value would read back as
 * null and silently wipe a date somebody had entered. A second key leaves
 * every existing value working untouched.
 *
 * Time is OPTIONAL in a way the date is not — a learner can know the day and
 * not the slot — so a stored time without a date is meaningless and
 * `clearExamDate()` removes both.
 */
const TIME_KEY = 'cgp.examTime'
const listeners = new Set<() => void>()

/** `YYYY-MM-DD` as typed into `<input type="date">`, or null when unset. */
export function readExamDate(): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeExamDate(value: string) {
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) localStorage.setItem(KEY, value)
  } catch {
    /* storage unavailable — session-only */
  }
  listeners.forEach((l) => l())
}

/** `HH:MM`, 24-hour, as `<input type="time">` produces it, or null. */
export function readExamTime(): string | null {
  try {
    const raw = localStorage.getItem(TIME_KEY)
    return raw && /^\d{2}:\d{2}$/.test(raw) ? raw : null
  } catch {
    return null
  }
}

/**
 * Write a date and (optionally) its time as ONE notification.
 *
 * Writing them through `writeExamDate` and a separate time write would fire
 * subscribers twice, and the first of those renders carries the new date
 * beside the OLD time — briefly showing a 9:00am slot against a date the
 * learner just moved. One write, one notify.
 *
 * An empty or absent `time` CLEARS the stored time rather than leaving the
 * previous one attached to the new date.
 */
export function writeExamDateTime(value: string, time?: string) {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return
    localStorage.setItem(KEY, value)
    if (time && /^\d{2}:\d{2}$/.test(time)) localStorage.setItem(TIME_KEY, time)
    else localStorage.removeItem(TIME_KEY)
  } catch {
    /* storage unavailable — session-only */
  }
  listeners.forEach((l) => l())
}

export function clearExamDate() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(TIME_KEY)
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** The stored date, re-read whenever it is written. */
export function useExamDate(): string | null {
  return useSyncExternalStore(subscribe, readExamDate, () => null)
}

/** The stored time, re-read whenever it is written. */
export function useExamTime(): string | null {
  return useSyncExternalStore(subscribe, readExamTime, () => null)
}

/**
 * LAY THE STORED EXAM DATE OVER A STUDY CALENDAR — 2026-10-20, the one seam
 * behind the `exam-date-single-store` flag.
 *
 * Until now the product carried TWO exam dates that never spoke. The store
 * (`cgp.examDate`) is what the Schedule State Exam widget writes and what the
 * countdown, the Pacing tile's required rate and the course header band all
 * read. The Study Calendar carried its OWN `calendar.examDate`, seeded from
 * fixtures and edited into component state, read by nothing else — so moving
 * your exam date in the calendar moved no figure anywhere, and booking one in
 * the widget never reached the calendar.
 *
 * This overlays the store onto a calendar so both surfaces read one value. It
 * is deliberately a CALL-SITE swap: `EditExamDatePanel` and the study-calendar
 * `ExamDateCard` are already presentational — they take a `calendar` and
 * render it — so neither needs a V2 sibling, and the flag chooses what they
 * are handed rather than threading a conditional through either.
 *
 * `enabled` is passed in rather than read here: this module is imported by
 * `FeatureFlagContext`'s own consumers and must not depend on the flag layer.
 *
 * ⚠ THIS UNIFIES THE DATE, NOT THE COUNTDOWN. The two surfaces measure from
 * different todays — `examDateRenewal` from `FIXTURE_TODAY` (2026-05-11),
 * `weeksUntilExam` from `STUDY_CALENDAR_TODAY` (2026-05-19) — and round
 * differently (a float of days/7 against `Math.ceil`). One stored date can
 * still read as six weeks on one surface and five on the other. Closing that
 * gap means moving an anchor every pacing figure in the app hangs off, which
 * is a decision of its own and deliberately not taken here.
 */
export function useExamCalendarOverlay<T extends { examDate: string; examTime?: string }>(
  calendar: T,
  enabled: boolean,
): T {
  const date = useExamDate()
  const time = useExamTime()
  return useMemo(() => {
    if (!enabled || !date) return calendar
    return { ...calendar, examDate: date, examTime: time ?? undefined }
  }, [calendar, enabled, date, time])
}

/**
 * The entered date as the `{ deadline, weeksLeft }` override the band and the
 * course header band already take — so one stored value moves every surface
 * that reads the deadline, rather than each one learning about exam dates.
 *
 * TWO THINGS HERE ARE LOAD-BEARING:
 *
 * 1. **`deadline` is `M/D/YYYY`, NOT the ISO string that was typed.**
 *    `longDate` (which the header band prints through) parses its input, and
 *    its own note records that both shapes it accepts parse in LOCAL time "so
 *    there is no UTC off-by-one to defend against". An ISO-8601 string parses
 *    as UTC and would print the day BEFORE for anyone west of Greenwich — the
 *    exact off-by-one that note says the format choice avoids.
 *
 * 2. **`weeksLeft` counts from `FIXTURE_TODAY`, not the wall clock.** Every
 *    date-driven surface in this app is anchored to 2026-05-11; measuring
 *    against the real today would put the countdown months out and make the
 *    Study Pace tile disagree with the Study Plan.
 *
 * Returns null for a date at or before the fixture today: a negative countdown
 * would render "0 days" beside a required rate of infinity, and a booked exam
 * in the past is a data-entry slip rather than a state to design for.
 */
export function examDateRenewal(
  value: string | null,
): { deadline: string; weeksLeft: number } | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  const days = Math.round((date.getTime() - FIXTURE_TODAY.getTime()) / 86_400_000)
  if (days <= 0) return null
  return { deadline: `${m}/${d}/${y}`, weeksLeft: days / 7 }
}
