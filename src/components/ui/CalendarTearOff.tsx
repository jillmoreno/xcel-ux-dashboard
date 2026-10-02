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
  /** Compact variant — three-letter month, tighter padding and a smaller day
   *  numeral, so the visual stays roughly square at narrow widths. Its only
   *  consumer is the `ask-first` exam card's saved readout; the Create Calendar
   *  panel named here previously no longer uses it. */
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
  /*
   * ⚠ COMPACT ABBREVIATES THE MONTH, and that is what lets the rest shrink —
   * 2026-09-29.
   *
   * The full name was the thing pinning the width: SEPTEMBER measures 75px at
   * the old 13px inside an 82px box, so 84px was already the floor and every
   * other number was stuck above it. Three letters frees ~50px, which is where
   * the width and the numerals below come from.
   *
   * Full size is untouched — it has 140px and no such problem.
   */
  const monthText = compact ? month.slice(0, 3) : month
  const stripH = compact ? 12 : 20
  const padY = compact ? '3px 8px 5px' : '8px 12px 14px'
  const monthSize = compact ? 11 : 16
  const monthLh = compact ? '14px' : '22px'
  const daySize = compact ? 28 : 50
  const yearSize = compact ? 11 : 16
  const yearLh = compact ? '15px' : '28px'
  const gap = compact ? 1 : 4
  return (
    /* ⚠ `paddingTop` IS THE RING OVERLAP, and it is the only thing setting it.
       The rings are 14px tall at `top: 0`, so the card's own top edge lands at
       `paddingTop + marginTop` (3 + 5 = 8) and the bottom 6px of each ring
       passes OVER the navy header strip — which is what makes them read as
       binder rings threaded through a page rather than two tabs balanced on
       top of it. It was 9, which put the card at exactly 14 and left the rings
       abutting the edge with no overlap at all.

       Pulling the card UP rather than pushing the rings DOWN on purpose: the
       rings are anchored to the top of the component, so moving them would
       leave dead space above them and grow the whole block. */
    <div style={{ position: 'relative', width, paddingTop: 3, flexShrink: 0 }}>
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
          /* `md` (8px), not `lg` (12px) — 2026-09-29. A desk calendar is a
             squared-off object, and at the compact 84px width `lg` rounded
             enough that the corners started reading as a rounded badge rather
             than a page. Still a token, so it tracks the scale. */
          borderRadius: 'var(--radius-md)',
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
            {monthText}
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
