/* Pure helpers for `CompassCoursePlayer`. Split out for the reason
   `learningPathsHomeUtil` and `studyJourneyUtil` were: a component file that
   also exports a function trips `react-refresh/only-export-components`, and
   the player needs this callable from tests without mounting the shell. */

/**
 * "June 30, 2026" + "8 Days Out" from the stored date.
 *
 * `YYYY-MM-DD`, which is what `examDateStore` holds — the value an
 * `<input type="date">` produces, and the only shape `readExamDate` will
 * return (it regex-guards the rest). Written against `mm/dd/yyyy` first, which
 * meant the chip silently never rendered: `readExamDate` rejected every date
 * the learner had actually entered. A test caught it.
 *
 * PARSED FIELD BY FIELD rather than handed to `new Date(stored)`: the string
 * form is treated as UTC midnight, so in any timezone behind it the date comes
 * back a day early — the classic off-by-one that would have this chip state
 * the day before the exam.
 *
 * The countdown is measured from TODAY and floored at zero — a negative "days
 * out" would be a date already passed, which the chip should not state as a
 * countdown. Same shape the mock draws; the numbers are the learner's.
 */
export function formatExamChip(stored: string): { date: string; countdown: string } | null {
  const [yyyy, mm, dd] = stored.split('-').map((n) => Number(n))
  if (!mm || !dd || !yyyy) return null
  const target = new Date(yyyy, mm - 1, dd)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.max(0, Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000))
  return {
    date: target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    countdown: days === 1 ? '1 Day Out' : `${days} Days Out`,
  }
}

