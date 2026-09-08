import {
  chipClassName,
  chipStyle,
  filterLabelStyle,
  filterRowStyle,
} from './LibraryCategoryChips'

/**
 * Single-select Profession pill row, rendered above the Category row in the
 * Resource Library when the learner has multiple professions
 * (`profession-count` flag = multiple). One chip per profession across the
 * learner's memberships, in membership order; the first membership's profession
 * is the default.
 *
 * Unlike the Category row this is a **radio-style** selector — exactly one
 * profession is always active (no clear / X affordance), because the library is
 * always scoped to some profession. Reuses the Category row's inline
 * label-left + wrapping-pills layout and the shared `chipStyle` so the two rows
 * read as one filter block.
 */
type Props = {
  professions: string[]
  active: string
  onChange: (next: string) => void
}

export function LibraryProfessionChips({ professions, active, onChange }: Props) {
  return (
    <section aria-label="Filter by profession" style={filterRowStyle}>
      <h2 style={filterLabelStyle}>Profession</h2>
      <div role="radiogroup" aria-label="Profession" style={chipsRowStyle}>
        {professions.map((prof) => {
          const isActive = prof === active
          return (
            <button
              key={prof}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(prof)}
              className={chipClassName(isActive)}
              style={chipStyle()}
            >
              {prof}
            </button>
          )
        })}
      </div>
    </section>
  )
}

const chipsRowStyle = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
} as const
