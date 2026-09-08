// Non-component helpers for the Gift Recipients section (search / status filter
// / sort / month grouping / date formatting). Kept out of the component file so
// react-refresh only sees component exports there.

import type { GiftClaimStatus, GiftRecipientRecord } from '@/data/giftRecipientsFixtures'

/* ─── filter + sort model ───────────────────────────────────────────────── */

export type GiftStatusFilter = 'all' | GiftClaimStatus

/** The primary filter — rendered as the shared segmented `PillTabs` (the app's
 *  standard top filter, same as My Courses / Learning Paths), NOT a dropdown.
 *  No per-pill counts: the total sits beside the tabs as "Showing N Results". */
export const GIFT_STATUS_TABS: { id: GiftStatusFilter; label: string }[] = [
  // "View All" (not "All") to match the My Courses status tabs — same component,
  // same leading-tab wording.
  { id: 'all', label: 'View All' },
  { id: 'claimed', label: 'Claimed' },
  { id: 'unclaimed', label: 'Unclaimed' },
]

/* ─── layout (the A/B) ──────────────────────────────────────────────────── */

/**
 * Which Gift Recipients layout renders. Two options are built so stakeholders
 * can compare them side by side (one dev-handoff tile each):
 *   - `cards` — Option A, the reference UX: month-grouped expandable cards,
 *     one reminder at a time.
 *   - `table` — Option B, the roster: a dense sortable table with checkbox
 *     selection and a bulk "Send reminder to N selected" bar, built for the
 *     story's 100+-seat manager.
 * Driven by the `gift-recipients-layout` flag (variant-only, `cards` default).
 */
export type GiftLayout = 'cards' | 'table'

export function readLayout(raw: string | undefined): GiftLayout {
  return raw === 'table' ? 'table' : 'cards'
}

/** Sort axes from the user story: purchase date, or recipient (student) name. */
export type GiftSort = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

export const GIFT_SORT_OPTIONS: { value: GiftSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Recipient (A–Z)' },
  { value: 'name-desc', label: 'Recipient (Z–A)' },
]

const STATUS_VALUES = new Set<GiftStatusFilter>(['all', 'claimed', 'unclaimed'])
const SORT_VALUES = new Set<GiftSort>(['newest', 'oldest', 'name-asc', 'name-desc'])

/** Validate a `?status=` param, falling back to `all`. */
export function readStatusFilter(raw: string | null): GiftStatusFilter {
  return raw != null && STATUS_VALUES.has(raw as GiftStatusFilter) ? (raw as GiftStatusFilter) : 'all'
}

/** Validate a `?sort=` param, falling back to `newest` (the default view). */
export function readSort(raw: string | null): GiftSort {
  return raw != null && SORT_VALUES.has(raw as GiftSort) ? (raw as GiftSort) : 'newest'
}

/** True when the sort orders by recipient name rather than purchase date —
 *  month grouping is dropped in that case (see `groupRecords`). */
export function isNameSort(sort: GiftSort): boolean {
  return sort === 'name-asc' || sort === 'name-desc'
}

/* ─── query ─────────────────────────────────────────────────────────────── */

/** Search matches the recipient's name OR email (case-insensitive substring) —
 *  the two identifiers a manager has to hand. */
function matchesQuery(record: GiftRecipientRecord, query: string): boolean {
  if (!query) return true
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    record.recipient.name.toLowerCase().includes(needle) ||
    record.recipient.email.toLowerCase().includes(needle)
  )
}

export function filterAndSortRecords(
  records: GiftRecipientRecord[],
  { query, status, sort }: { query: string; status: GiftStatusFilter; sort: GiftSort },
): GiftRecipientRecord[] {
  const filtered = records.filter(
    (r) => (status === 'all' || r.status === status) && matchesQuery(r, query),
  )
  const sorted = [...filtered]
  sorted.sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return a.orderDate.localeCompare(b.orderDate)
      case 'name-asc':
        return a.recipient.name.localeCompare(b.recipient.name)
      case 'name-desc':
        return b.recipient.name.localeCompare(a.recipient.name)
      case 'newest':
      default:
        return b.orderDate.localeCompare(a.orderDate)
    }
  })
  return sorted
}

/* ─── grouping ──────────────────────────────────────────────────────────── */

export type GiftRecordGroup = {
  /** Stable key for React + the collapse map. */
  id: string
  /** Group heading ("March, 2026"). `null` ⇒ render the list ungrouped (name
   *  sorts, where month buckets would fight the ordering). */
  label: string | null
  records: GiftRecipientRecord[]
}

/**
 * Buckets records by the MONTH of their order date, preserving the incoming
 * (already-sorted) order — so a Newest-first list reads Aug → Jul → Jun. When
 * the list is sorted by recipient name, month buckets would break the A–Z run,
 * so the whole list comes back as one unlabeled group.
 */
export function groupRecords(records: GiftRecipientRecord[], sort: GiftSort): GiftRecordGroup[] {
  if (isNameSort(sort)) {
    return records.length ? [{ id: 'all', label: null, records }] : []
  }
  const groups: GiftRecordGroup[] = []
  for (const record of records) {
    const id = record.orderDate.slice(0, 7) // YYYY-MM
    const last = groups[groups.length - 1]
    if (last && last.id === id) last.records.push(record)
    else groups.push({ id, label: formatMonthYear(record.orderDate), records: [record] })
  }
  return groups
}

/* ─── formatting ────────────────────────────────────────────────────────── */

// ISO `YYYY-MM-DD` is parsed by hand — `new Date('2026-03-04')` is UTC, which
// shifts the date back a day for anyone west of Greenwich (so "March, 2026"
// could render as February).
function parts(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

const MONTHS = [
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

/** "2026-03-04" → "March, 2026" (the month group heading). */
export function formatMonthYear(iso: string): string {
  const { year, month } = parts(iso)
  return `${MONTHS[month - 1]}, ${year}`
}

/** "2026-03-04" → "03/04/2026" (the Order Date cell). */
export function formatOrderDate(iso: string): string {
  const { year, month, day } = parts(iso)
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`
}

/** "2026-03-04" → "March 4, 2026" (prose inside the expanded detail). */
export function formatLongDate(iso: string): string {
  const { year, month, day } = parts(iso)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

/** Today as ISO `YYYY-MM-DD`, local time — stamped on a reminder sent in-session. */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** "5 items" / "1 item". */
export function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`
}
