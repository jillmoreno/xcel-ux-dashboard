import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

/**
 * EVERY ADMIN TABLE SORTS FROM ITS HEADERS — 2026-11-10, Eric: "for all table column headers allow clicking the column to
 * sort the table rows based on that column, make clicking the column a second time reverse the sort order, and clicking the
 * column header a third time go back to the default sort".
 *
 * One cycle, everywhere: off → the column's natural direction (A→Z, or highest first for a number) → reversed → off, which
 * is the table's own order — whatever the page sorted by before anyone clicked (Students' "who needs you first", Audit's
 * newest first). Empty values ("—", Not scheduled, null) sink to the bottom in both directions; they are the absence of a
 * value, not its smallest.
 *
 * A page hands `useTableSort` its rows and a `valueOf(row, key)` that says what each column sorts by — the number behind a
 * "72%" or a "2 months ago", not the words — and wraps each header's label in `<SortHeader>`.
 */
export type SortValue = string | number | Date | boolean | null | undefined
export type SortState = { key: string; dir: 1 | -1 } | null

export function useTableSort<T>(
  rows: readonly T[],
  valueOf: (row: T, key: string) => SortValue,
  /** Columns that read highest-first on the first click (numbers, dates). Others start A→Z. */
  descFirst: readonly string[] = [],
) {
  const [sort, setSort] = useState<SortState>(null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((a, b) => compareSortValues(valueOf(a, sort.key), valueOf(b, sort.key), sort.dir))
    // `valueOf` is a fresh closure every render; the rows and the sort are what change the order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort])
  const cycle = (key: string) =>
    setSort((s) => {
      const first: 1 | -1 = descFirst.includes(key) ? -1 : 1
      if (!s || s.key !== key) return { key, dir: first }
      if (s.dir === first) return { key, dir: (first * -1) as 1 | -1 }
      return null
    })
  const headerProps = (key: string) => ({
    'aria-sort': (sort?.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none') as 'ascending' | 'descending' | 'none',
  })
  return { sorted, sort, cycle, headerProps }
}

const EMPTY_TEXT = new Set(['', '—', '–', '-', 'n/a', 'not scheduled', 'none', 'never'])

function isEmpty(v: SortValue): boolean {
  if (v == null) return true
  if (typeof v === 'number') return Number.isNaN(v)
  if (typeof v === 'string') return EMPTY_TEXT.has(v.trim().toLowerCase())
  return false
}

export function compareSortValues(a: SortValue, b: SortValue, dir: 1 | -1): number {
  const ea = isEmpty(a)
  const eb = isEmpty(b)
  if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1 // empties last, whichever way
  const na = a instanceof Date ? a.getTime() : typeof a === 'boolean' ? Number(a) : a
  const nb = b instanceof Date ? b.getTime() : typeof b === 'boolean' ? Number(b) : b
  if (typeof na === 'number' && typeof nb === 'number') return (na - nb) * dir
  return String(na).localeCompare(String(nb), undefined, { numeric: true, sensitivity: 'base' }) * dir
}

/** "72%", "$1,200", "3 of 5" → its first number; for a column whose cells are formatted text. */
export function leadingNumber(text: string | null | undefined): number | null {
  const m = text?.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

/**
 * The header's label as a button: the label as it was, and an arrow after it — up for A→Z / lowest first, down for the
 * reverse, none at rest. It inherits the header's type and colour; the sorted column reads in the table's ink.
 */
export function SortHeader({
  sortKey,
  sort,
  onSort,
  children,
  align = 'left',
}: {
  sortKey: string
  sort: SortState
  onSort: (key: string) => void
  children: ReactNode
  align?: 'left' | 'right' | 'center'
}) {
  const on = sort?.key === sortKey
  return (
    <button
      type="button"
      className="cre-admin-sort"
      onClick={() => onSort(sortKey)}
      style={{
        ...SORT_BUTTON,
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
        color: on ? 'var(--admin-ink)' : 'inherit',
      }}
    >
      <span>{children}</span>
      <span aria-hidden style={{ ...SORT_ARROW, opacity: on ? 1 : 0 }}>
        {on && sort?.dir === -1 ? '↓' : '↑'}
      </span>
    </button>
  )
}

const SORT_BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'flex-end',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  letterSpacing: 'inherit',
  textTransform: 'inherit',
  lineHeight: 'inherit',
  whiteSpace: 'inherit',
  cursor: 'pointer',
}
const SORT_ARROW: CSSProperties = { flex: 'none', width: 10, transition: 'opacity 120ms ease' }
