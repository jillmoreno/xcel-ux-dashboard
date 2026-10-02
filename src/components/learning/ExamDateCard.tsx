import { useMemo, useState, type CSSProperties } from 'react'
import { useExamDate, writeExamDate } from '@/data/examDateStore'
import { widgetEyebrowStyle } from './widgetStyles'

/**
 * THE EXAM-DATE STEP CARD — `exam-step-style: date-first`, 2026-09-28.
 *
 * A sibling of `LicensingStepWidget`'s Schedule State Exam treatment, not a
 * change to it: the flag picks between them at the call site, so both stay on
 * screen and comparable. Worked out on the copy bench rather than in code —
 * every decision below was made there and is recorded with its reason.
 *
 * WHAT MOVED, AND WHY EACH ONE:
 *
 *  • "Exam Date", not "Schedule State Exam". A LABEL, not an instruction — and
 *    that is what makes it survive the second state. "Schedule" describes
 *    something already done once a date exists; "Exam Date" is still true.
 *  • NO FEE LINE. The $40 is a fact about booking, and booking happens on the
 *    state's own site where the price is authoritative and current — which it
 *    never will be here. It stays in the step sheet.
 *  • THE FIELD BECOMES A BUTTON. Most learners arriving have not booked yet, and
 *    the shipped card leads with an empty date input aimed at the minority who
 *    have. The CTA opens a month selector IN THE CARD (settled, not a sheet).
 *  • ONCE SET, THE CARD GETS QUIETER. "Change date" drops from a bordered
 *    button to link weight beside "How to Schedule" — neither is the main event
 *    any more.
 *  • "How to Schedule", not "Details". It names what is behind it. It also
 *    separates the two controls: one takes your date, one tells you how to get
 *    one.
 */
export function ExamDateCard({
  number,
  shell,
  onOpenStep,
  stepId,
}: {
  /** Continues the journey's numbering — see `StudyJourneyWidget`. */
  number: number
  shell: CSSProperties
  onOpenStep?: (id: string) => void
  stepId: string
}) {
  const stored = useExamDate()
  const [open, setOpen] = useState(false)
  /* The month the picker opens on: the stored date's, else the demo's own exam
     month. Recomputed only when the stored value changes. */
  const [cursor, setCursor] = useState(() => monthOf(stored))

  const label = useMemo(() => (stored ? longDate(stored) : null), [stored])

  function pick(iso: string) {
    writeExamDate(iso)
    setOpen(false)
  }

  return (
    <section aria-label="Exam Date" style={shell}>
      <p className="cre-eyebrow-ink" style={widgetEyebrowStyle}>
        Step {number}
      </p>
      <p style={titleStyle}>Exam Date</p>

      {label ? (
        <p style={setStyle}>Your exam date · {label}</p>
      ) : (
        <p style={ledeStyle}>
          Already scheduled? Enter it and we’ll use it to help you prep.
        </p>
      )}

      {/* ⚠ BORDERED WHILE THERE IS SOMETHING TO DO, link-weight once there is
          not. The two states are the same control; only its claim on attention
          changes. */}
      {label ? (
        <button type="button" style={linkStyle} onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Change date'}
        </button>
      ) : (
        <button type="button" style={ctaStyle} onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Enter exam date'}
        </button>
      )}

      {/* IN THE CARD, not in a sheet over it — settled on the bench. It roughly
          doubles the card's height while open and pushes the steps below it
          down the column; that is the accepted cost of keeping the date where
          the date belongs. */}
      {open && (
        <MonthGrid
          month={cursor}
          selected={stored}
          onMonth={setCursor}
          onPick={pick}
        />
      )}

      <button
        type="button"
        data-cta-id="home.schedule-exam"
        className="cre-link-action cre-cta-ink"
        style={howStyle}
        onClick={() => onOpenStep?.(stepId)}
      >
        How to Schedule →
      </button>
    </section>
  )
}

/* ─── the month selector ───────────────────────────────────────────────── */

function MonthGrid({
  month,
  selected,
  onMonth,
  onPick,
}: {
  month: { y: number; m: number }
  selected: string | null
  onMonth: (next: { y: number; m: number }) => void
  onPick: (iso: string) => void
}) {
  const first = new Date(month.y, month.m, 1)
  const days = new Date(month.y, month.m + 1, 0).getDate()
  const lead = first.getDay()
  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)

  return (
    <div style={calWrap}>
      <div style={calHead}>
        <button
          type="button"
          aria-label="Previous month"
          style={navBtn}
          onClick={() => onMonth(shift(month, -1))}
        >
          ‹
        </button>
        <span style={{ fontWeight: 700, fontSize: 12.5 }}>
          {first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          aria-label="Next month"
          style={navBtn}
          onClick={() => onMonth(shift(month, 1))}
        >
          ›
        </button>
      </div>
      <div style={calGrid}>
        {/* ⚠ The weekday row is `aria-hidden`: seven single letters, several of
            them repeats, are noise to a screen reader — each day button already
            carries its full date as its accessible name. */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} aria-hidden style={dowStyle}>
            {d}
          </span>
        ))}
        {cells.map((d, i) =>
          d == null ? (
            <span key={`p${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              style={{ ...dayStyle, ...(iso(month, d) === selected ? daySelected : null) }}
              aria-pressed={iso(month, d) === selected}
              aria-label={new Date(month.y, month.m, d).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              onClick={() => onPick(iso(month, d))}
            >
              {d}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

/* ─── dates ────────────────────────────────────────────────────────────── */

/** ⚠ PARSED BY HAND, never `new Date(iso)` — that is UTC and shifts the day in
 *  western timezones. The same rule `badgeDate` follows. */
function monthOf(stored: string | null): { y: number; m: number } {
  if (stored) {
    const [y, m] = stored.split('-').map(Number)
    if (y && m) return { y, m: m - 1 }
  }
  return { y: 2026, m: 5 } // June 2026 — the demo's exam month
}

function shift(cur: { y: number; m: number }, by: number) {
  const m = cur.m + by
  return { y: cur.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }
}

function iso(month: { y: number; m: number }, day: number) {
  return `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function longDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/* ─── styles ───────────────────────────────────────────────────────────── */

const titleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: '24px',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}

const ledeStyle: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

const setStyle: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const ctaStyle: CSSProperties = {
  marginTop: 12,
  alignSelf: 'flex-start',
  padding: '8px 15px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-primary-600)',
  background: 'transparent',
  color: 'var(--color-primary-600)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

const linkStyle: CSSProperties = {
  marginTop: 10,
  alignSelf: 'flex-start',
  padding: 0,
  border: 0,
  background: 'none',
  color: 'var(--color-primary-600)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

const howStyle: CSSProperties = {
  marginTop: 12,
  alignSelf: 'flex-start',
  background: 'none',
  border: 0,
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

const calWrap: CSSProperties = {
  marginTop: 10,
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 'var(--radius-sm)',
  padding: 10,
  background: 'var(--color-surface-page)',
}

const calHead: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
}

const navBtn: CSSProperties = {
  width: 22,
  height: 22,
  lineHeight: 1,
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const calGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 2,
}

const dowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 9.5,
  fontWeight: 700,
  textAlign: 'center',
  paddingBottom: 3,
  color: 'var(--color-text-tertiary)',
}

const dayStyle: CSSProperties = {
  border: 0,
  background: 'transparent',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const daySelected: CSSProperties = {
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  fontWeight: 700,
}
