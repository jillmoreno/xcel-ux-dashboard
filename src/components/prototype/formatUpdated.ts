/**
 * "Oct 14, 8:47 PM" from an ISO timestamp, in the viewer's own zone — the
 * stamp is UTC, and a reviewer reads a clock, not an offset. Shared by the
 * gateway's Prototypes rows (`lastUpdated`) and the Refinement board
 * (`updatedAt`), so the two never drift into different spellings of the same
 * moment. An unparseable value comes back as given rather than as "Invalid
 * Date".
 */
export function formatUpdated(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

/**
 * "Nov 4" from a `yyyy-mm-dd` stamp — the To Do Board's `addedDate`, as the
 * Prototypes rows show it on their "Staged" tag (2026-11-04).
 *
 * ⚠ PARSED BY HAND, not with `new Date('2026-11-04')`. That call reads the
 * string as UTC midnight and renders it in the viewer's zone, so anybody west
 * of Greenwich sees the day before — the off-by-one the fixtures all avoid the
 * same way (`atlasCourseCards.ts`, `examDateStore.ts`). The parts are the
 * date; nothing about this stamp is a moment in time. An unparseable value
 * comes back as given, like `formatUpdated`.
 */
export function formatStamp(stamp: string): string {
  const [y, m, d] = stamp.split('-').map(Number)
  if (!y || !m || !d) return stamp
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
}
