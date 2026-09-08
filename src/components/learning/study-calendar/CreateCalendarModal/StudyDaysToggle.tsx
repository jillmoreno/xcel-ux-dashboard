import { useRef, type CSSProperties, type KeyboardEvent } from 'react'

/**
 * "Include Events on the Following Days" — required 7-button
 * segmented control. Default selection MON-FRI; user can toggle any
 * combination, but Save is disabled if zero days are selected.
 *
 * Accessibility:
 *   - Each button has `aria-pressed` reflecting its selection state.
 *   - Arrow Left / Right moves focus across buttons with wrap-around.
 *   - Space / Enter toggles the focused button.
 *   - Color is never the only signal — selected buttons change
 *     border + text color, not just background.
 */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Sun=0 … Sat=6

export const DEFAULT_STUDY_DAYS: WeekDay[] = [1, 2, 3, 4, 5]

const LABELS: Record<WeekDay, string> = {
  0: 'SUN',
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT',
}

const FULL_NAMES: Record<WeekDay, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

type Props = {
  selected: WeekDay[]
  onChange: (next: WeekDay[]) => void
  id: string
  helperId: string
  /** Computed tasks-per-study-day to surface in the helper line.
   *  - `number` → render "X days selected · ~N tasks per study day."
   *  - `null`   → no calendar picked yet; render "X days selected." only.
   *  - omitted  → legacy fallback (hardcoded ~3) for the modal demo. */
  tasksPerStudyDay?: number | null
}

export function StudyDaysToggle({
  selected,
  onChange,
  id,
  helperId,
  tasksPerStudyDay,
}: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const toggle = (day: WeekDay) => {
    const isOn = selected.includes(day)
    const next = isOn ? selected.filter((d) => d !== day) : [...selected, day].sort()
    onChange(next as WeekDay[])
  }

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const target = (index + 1) % 7
      refs.current[target]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const target = (index - 1 + 7) % 7
      refs.current[target]?.focus()
    }
    // Space and Enter fire `onClick` natively on buttons — no extra
    // handling needed for the toggle action.
  }

  const dayCount = selected.length

  return (
    <>
      <div
        id={id}
        role="group"
        aria-label="Study days of the week"
        aria-describedby={helperId}
        style={rowStyle}
      >
        {([0, 1, 2, 3, 4, 5, 6] as WeekDay[]).map((day, i) => {
          const on = selected.includes(day)
          return (
            <button
              key={day}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              aria-pressed={on}
              aria-label={`${FULL_NAMES[day]}${on ? ' — selected' : ''}`}
              onClick={() => toggle(day)}
              onKeyDown={(e) => handleKey(e, i)}
              style={{
                ...btnStyle,
                background: on
                  ? 'var(--color-primary-100)'
                  : 'var(--color-neutral-100)',
                borderColor: on
                  ? 'var(--color-primary-500)'
                  : 'transparent',
                color: on
                  ? 'var(--color-primary-500)'
                  : 'var(--color-text-tertiary)',
              }}
            >
              {LABELS[day]}
            </button>
          )
        })}
      </div>
      <p id={helperId} style={helperStyle}>
        {dayCount === 0
          ? 'Pick at least one. Most students choose 4–5 weekdays.'
          : renderHelper(dayCount, tasksPerStudyDay)}
      </p>
    </>
  )
}

function renderHelper(dayCount: number, tasksPerStudyDay: number | null | undefined): string {
  const dayLabel = `${dayCount} day${dayCount === 1 ? '' : 's'} selected`
  // null = panel mode, no calendar picked yet → suppress the suffix.
  if (tasksPerStudyDay === null) return `${dayLabel}.`
  // undefined = legacy modal fallback → preserve the original copy.
  const perDay = tasksPerStudyDay === undefined ? 3 : tasksPerStudyDay
  return `${dayLabel} · ~${perDay} task${perDay === 1 ? '' : 's'} per study day.`
}

/* ─── styles ───────────────────────────────────────────────────────── */

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 6,
}

const btnStyle: CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  border: '1.5px solid',
  borderRadius: 'var(--radius-md)',
  padding: '10px 0',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  transition: 'background-color 120ms ease, border-color 120ms ease, color 120ms ease',
}

const helperStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}
