/**
 * THE EXAM CALENDAR'S DATE HELPERS — split out 2026-10-20 from
 * `AtlasExamCalendar`, which exports a component.
 *
 * ⚠ A SEPARATE FILE FOR A LINT RULE THAT IS RIGHT. `react-refresh/only-export-components`
 * fails a module that exports both a component and plain functions: fast refresh
 * cannot tell which it is replacing, so editing the component reloads the whole
 * module and any state above it. The repo already splits this way —
 * `demoBarUtil.ts`, `compassPlayerUtil.ts`, `studyJourneyUtil.ts`.
 *
 * ⚠ LOCAL DATES THROUGHOUT, built from parts, never `new Date(iso)` — the rule
 * `courseExpiry`, `examDateStore` and `studyPace` all state, and the one
 * `learningPathsHomeUtil`'s exported `longDate` does not follow.
 */

/** Midnight on the given date, in local time. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Same calendar day, local — not the same instant. */
export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** The month's grid: whole weeks, Sunday first, padded with the neighbouring
 *  months' days — 5 or 6 rows as the month needs. */
export function monthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7
  return Array.from({ length: cells }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { date, inMonth: date.getMonth() === month }
  })
}
