import { Fragment, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ChevronDown, ChevronRight } from '@/icons'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { sheetDeadlineDays } from '@/data/learningFixtures'
import { LearningPathStatusBadge } from './LearningPathStatusBadge'
import { LearningPathProgressTrack } from './LearningPathProgressTrack'
import {
  HOME_STATUS_META,
  homeStatusFor,
  homeStatusRank,
  hoursFor,
  metaSegments,
} from './learningPathsHomeUtil'

/**
 * Learning Path homepage — Table view. A true, sortable data table modeled on
 * `MyCoursesTable` (semantic `<table>`, same header/body cell chrome), adapted
 * to Learning Path data. Clicking a column header sorts; clicking a row opens
 * that path's detail (same navigation as the grid/list cards).
 *
 * Presentational + locally sortable: the parent passes the already
 * filtered/searched `visible` list; sorting is local UI state layered on top.
 *
 * Layout (4 columns): the wide **Learning Path Name** leads, then **Overall
 * Progress** (bar + % with the hours-completed fraction beneath it), then
 * **License Expires** (date + a days/weeks-left subtext), and **Status** last
 * on the far right. Mandatory / Elective / Hours / Time-Remaining columns were
 * folded away — hours live under the progress bar and time-left under the date.
 */
type Props = {
  paths: LearningPathSummary[]
  onSelect: (id: string) => void
}

type SortColKey = 'name' | 'progress' | 'expires' | 'status'

type SortState = { key: SortColKey | null; dir: 'asc' | 'desc' }

const EM_DASH = '—'

const COLUMNS: {
  key: SortColKey
  label: string
  align: 'left' | 'right'
  /** Column width hint (drives the wide name column + narrow status column). */
  width: string
}[] = [
  { key: 'name', label: 'Learning Path Name', align: 'left', width: '42%' },
  { key: 'progress', label: 'Overall Progress', align: 'left', width: '30%' },
  { key: 'expires', label: 'License Expires', align: 'left', width: '16%' },
  { key: 'status', label: 'Status', align: 'left', width: '12%' },
]

/** Numeric sort value for a column, or `null` when the path has no value for it
 *  (missing deadline) — nulls always sort last. `name` is handled separately
 *  (string compare). */
function sortValue(path: LearningPathSummary, key: SortColKey): number | null {
  switch (key) {
    case 'status':
      return homeStatusRank(path)
    case 'progress':
      return path.progressPct
    case 'expires': {
      const d = sheetDeadlineDays(path)
      return Number.isFinite(d) ? d : null
    }
    default:
      return null
  }
}

export function LearningPathsTable({ paths, onSelect }: Props) {
  // Default `null` → preserve the incoming order (parent already sorted).
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' })

  const toggle = (key: SortColKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )

  const rows = useMemo(() => {
    if (sort.key == null) return paths
    const key = sort.key
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...paths].sort((a, b) => {
      if (key === 'name') return a.title.localeCompare(b.title) * factor
      const av = sortValue(a, key)
      const bv = sortValue(b, key)
      // Missing values always sort last, regardless of direction.
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return (av - bv) * factor
    })
  }, [paths, sort])

  const ariaSort = (key: SortColKey): 'ascending' | 'descending' | 'none' =>
    sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-neutral-light)',
        borderRadius: 'var(--radius-xl)',
        overflowX: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <colgroup>
          {COLUMNS.map((col) => (
            <col key={col.key} style={{ width: col.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((col, i) => {
              const gutter =
                i === 0 ? { paddingLeft: 24 } : i === COLUMNS.length - 1 ? { paddingRight: 24 } : {}
              const active = sort.key === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort(col.key)}
                  style={{ ...HEADER_CELL, textAlign: col.align, ...gutter }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    style={{
                      ...headerButtonStyle,
                      justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {col.label}
                    <ChevronDown
                      size={12}
                      aria-hidden
                      // Dimmed on inactive columns; rotates 180° for descending.
                      style={{
                        flexShrink: 0,
                        opacity: active ? 1 : 0.35,
                        transform: active && sort.dir === 'desc' ? 'rotate(180deg)' : 'none',
                        transition: 'transform 120ms ease',
                      }}
                    />
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((path) => (
            <Row key={path.id} path={path} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({ path, onSelect }: { path: LearningPathSummary; onSelect: (id: string) => void }) {
  const onKey = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(path.id)
    }
  }
  const accent = HOME_STATUS_META[homeStatusFor(path)].border
  return (
    <tr
      className="cre-lp-table-row"
      role="button"
      tabIndex={0}
      aria-label={`Open ${path.title}`}
      onClick={() => onSelect(path.id)}
      onKeyDown={onKey}
      style={{ cursor: 'pointer', ['--row-accent' as string]: accent }}
    >
      {/* Name + meta subtitle */}
      <td style={{ ...BODY_CELL, paddingLeft: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, lineHeight: '18px' }}>
            {path.title}
          </span>
          <MetaSubtitle path={path} />
        </div>
      </td>
      {/* Overall progress — bar + % on top, hours-completed beneath. */}
      <td style={BODY_CELL}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <LearningPathProgressTrack path={path} />
            </div>
            <span
              style={{
                minWidth: 34,
                textAlign: 'right',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
              }}
            >
              {path.progressPct}%
            </span>
          </div>
          <HoursCompleted path={path} />
        </div>
      </td>
      {/* License Expires — date + days/weeks-left subtext. */}
      <td style={BODY_CELL}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
            {path.licenseExpiresOn ?? EM_DASH}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {timeLeftSubtext(path)}
          </span>
        </div>
      </td>
      {/* Status — far right, with the trailing chevron affordance. */}
      <td style={{ ...BODY_CELL, paddingRight: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <LearningPathStatusBadge path={path} />
          <ChevronRight
            size={16}
            aria-hidden
            style={{ flexShrink: 0, color: 'var(--color-text-tertiary)' }}
          />
        </div>
      </td>
    </tr>
  )
}

/** Days/weeks-left line under the expiration date. An expired path reads
 *  "Expired"; otherwise the path's own time-left label (or a dash). */
function timeLeftSubtext(path: LearningPathSummary): string {
  if (homeStatusFor(path) === 'expired') return 'Expired'
  return path.timeLeftLabel ?? EM_DASH
}

function MetaSubtitle({ path }: { path: LearningPathSummary }) {
  const segments = metaSegments(path)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        color: 'var(--color-text-secondary)',
        lineHeight: '18px',
      }}
    >
      {segments.map((s, i) => (
        <Fragment key={s}>
          {i > 0 && (
            <span aria-hidden style={{ width: 1, height: 11, background: 'var(--color-border-subtle)' }} />
          )}
          <span>{s}</span>
        </Fragment>
      ))}
    </div>
  )
}

/** "14 / 25 Hours Completed" — the hours fraction moved below the progress bar. */
function HoursCompleted({ path }: { path: LearningPathSummary }) {
  const { completed, required } = hoursFor(path)
  return (
    <span style={{ whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: 11 }}>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{completed}</span>
      <span style={{ color: 'var(--color-neutral-500)' }}> / </span>
      <span style={{ color: 'var(--color-text-tertiary)' }}>{required}</span>
      {' Hours Completed'}
    </span>
  )
}

/* ─── cell chrome (mirrors MyCoursesTable) ───────────────────────────── */

const HEADER_CELL: CSSProperties = {
  verticalAlign: 'top',
  padding: '16px 16px 12px',
  background: 'var(--color-surface-card)',
  borderBottom: '2px solid var(--color-neutral-500)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '18px',
  whiteSpace: 'nowrap',
}

const BODY_CELL: CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-neutral-light)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '18px',
  verticalAlign: 'middle',
}

// Header is a real button for keyboard access; inherits the cell's typography.
const headerButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  width: '100%',
  padding: 0,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  lineHeight: 'inherit',
  textAlign: 'inherit',
}
