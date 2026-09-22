import { useSyncExternalStore } from 'react'
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

export function clearExamDate() {
  try {
    localStorage.removeItem(KEY)
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
