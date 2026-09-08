const MONTHS_UPPER = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

function parseISO(iso: string): { month: string; day: number; year: number } {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10))
  return { month: MONTHS_UPPER[m - 1], day: d, year: y }
}

type Props = {
  /** ISO yyyy-mm-dd. */
  date: string
  /** Overall card width in px. Default 140. */
  width?: number
  /** Compact variant — tighter padding + smaller day numeral so the
   *  visual reads roughly square at narrower widths (used by the
   *  Create Calendar panel's projected-completion section). */
  compact?: boolean
}

/**
 * Tear-off / desk-calendar visual — navy strip at the top with two
 * binder rings, month label, oversized day numeral, year underneath.
 * Used by `ExamDateCard` on the Progress Tracker tab and by the
 * Create Calendar panel's Projected Completion card. Pass the date as
 * a single ISO string and the component handles the formatting.
 */
export function CalendarTearOff({ date, width = 140, compact = false }: Props) {
  const { month, day, year } = parseISO(date)
  const stripH = compact ? 14 : 20
  const padY = compact ? '4px 12px 6px' : '8px 12px 14px'
  const monthSize = compact ? 13 : 16
  const monthLh = compact ? '16px' : '22px'
  const daySize = compact ? 34 : 50
  const yearSize = compact ? 13 : 16
  const yearLh = compact ? '18px' : '28px'
  const gap = compact ? 2 : 4
  return (
    <div style={{ position: 'relative', width, paddingTop: 9, flexShrink: 0 }}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: width * 0.27,
          width: 5,
          height: 14,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-neutral-darkest)',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: width * 0.65,
          width: 5,
          height: 14,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-neutral-darkest)',
        }}
      />
      <div
        style={{
          marginTop: 5,
          border: '1px solid var(--color-primary-500)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--color-surface-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ height: stripH, background: 'var(--color-primary-500)' }} />
        <div
          style={{
            padding: padY,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: monthSize,
              fontWeight: 600,
              lineHeight: monthLh,
              letterSpacing: '0.02em',
              color: 'var(--color-neutral-darkest)',
            }}
          >
            {month}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: daySize,
              lineHeight: 1,
              color: 'var(--color-neutral-darkest)',
            }}
          >
            {day}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: yearSize,
              fontWeight: 600,
              lineHeight: yearLh,
              color: 'var(--color-neutral-darkest)',
            }}
          >
            {year}
          </div>
        </div>
      </div>
    </div>
  )
}
