import { useState, type CSSProperties } from 'react'

/**
 * Profession + State Licensed In pill filters for the Recommended for You page.
 *
 * License-driven and DEPENDENT: a license is a (profession, state) pair, so the
 * Profession row lists the professions the learner is licensed in and the State
 * Licensed In row lists only the states they hold FOR the selected profession.
 * There is no "All" — a profession and a state are always selected — and no
 * per-pill count. Single-select in each row.
 *
 * The dependency (repopulate the state row on a profession switch, keeping the
 * current state when the new profession still covers it, else falling to the
 * first alphabetically) is resolved by the caller
 * (`RecommendedForYouPanel`); this component just renders the given lists +
 * selections. Both rows always render — a row with a single option shows that
 * option as the selected pill.
 */

type ChipColors = { bg: string; fg: string; border: string }

const PROFESSION_COLORS: ChipColors = {
  bg: 'var(--color-primary-100)',
  fg: 'var(--color-primary-800)',
  border: 'var(--color-primary-500)',
}
const STATE_COLORS: ChipColors = {
  bg: 'var(--color-secondary-100)',
  fg: 'var(--color-secondary-800)',
  border: 'var(--color-secondary-500)',
}

/** Most learners hold licenses in ≤ 6 states — show those inline, collapse the rest. */
export const REC_STATE_COLLAPSE_LIMIT = 6

export function RecommendedFilters({
  professions,
  selectedProfession,
  onProfession,
  states,
  selectedState,
  onState,
}: {
  professions: string[]
  selectedProfession: string
  onProfession: (value: string) => void
  states: string[]
  selectedState: string
  onState: (value: string) => void
}) {
  if (professions.length === 0) return null
  // Single profession + single state → no real choice to filter. Drop the pill
  // rows and just state the learner's license as a plain "Profession / State"
  // line at the top; the shelves shift up into the freed space.
  if (professions.length <= 1 && states.length <= 1) {
    const parts = [selectedProfession, selectedState].filter(Boolean)
    if (parts.length === 0) return null
    return (
      <p style={summaryStyle}>
        {parts.map((t, i) => (
          <span key={t}>
            {i > 0 && (
              <span aria-hidden style={summarySepStyle}>
                /
              </span>
            )}
            {t}
          </span>
        ))}
      </p>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 4 }}>
      <FilterRow label="Profession">
        {professions.map((p) => (
          <Chip
            key={p}
            label={p}
            colors={PROFESSION_COLORS}
            selected={selectedProfession === p}
            onClick={() => onProfession(p)}
          />
        ))}
      </FilterRow>
      <StateRow
        label="State Licensed In"
        states={states}
        selected={selectedState}
        onSelect={onState}
      />
    </div>
  )
}

function StateRow({
  label,
  states,
  selected,
  onSelect,
}: {
  label: string
  states: string[]
  selected: string
  onSelect: (value: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const overLimit = states.length > REC_STATE_COLLAPSE_LIMIT
  const collapsed = overLimit && !expanded
  let shown = collapsed ? states.slice(0, REC_STATE_COLLAPSE_LIMIT) : states
  // Always keep the selected state visible, even past the collapse cutoff.
  if (collapsed && selected && !shown.includes(selected)) {
    shown = [...shown, selected]
  }
  return (
    // When there are more states than fit on one line, let the pills wrap: the
    // first row stays beside the label (aligned with the Profession pill) and
    // wrapped rows drop to the far-left edge instead of leaving a gap.
    <FilterRow label={label} wrap={overLimit}>
      {shown.map((s) => (
        <Chip
          key={s}
          label={s}
          colors={STATE_COLORS}
          selected={selected === s}
          onClick={() => onSelect(s)}
        />
      ))}
      {overLimit && (
        <button type="button" onClick={() => setExpanded((v) => !v)} style={showMoreStyle}>
          {expanded ? 'Show less' : `Show all (${states.length})`}
        </button>
      )}
    </FilterRow>
  )
}

function FilterRow({
  label,
  children,
  wrap = false,
}: {
  label: string
  children: React.ReactNode
  wrap?: boolean
}) {
  // Wrap mode: label + pills share ONE flex-wrap container, so the label holds
  // its 128px column, the first pill row flows beside it (aligned with the
  // Profession pill), and wrapped rows start at the far-left edge — no gap.
  if (wrap) {
    return (
      <div
        role="tablist"
        aria-label={`Filter by ${label.toLowerCase()}`}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
      >
        <span style={wrapLabelStyle}>{label}</span>
        {children}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={labelStyle}>{label}</span>
      <div
        role="tablist"
        aria-label={`Filter by ${label.toLowerCase()}`}
        style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
      >
        {children}
      </div>
    </div>
  )
}

function Chip({
  label,
  colors,
  selected,
  onClick,
}: {
  label: string
  colors: ChipColors
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-label={label}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 'var(--radius-pill)',
        padding: '6px 14px',
        cursor: 'pointer',
        border: `1px solid ${selected ? colors.border : 'var(--color-border-subtle)'}`,
        background: selected ? colors.bg : 'transparent',
        color: selected ? colors.fg : 'var(--color-text-secondary)',
      }}
    >
      {label}
    </button>
  )
}

const labelStyle: CSSProperties = {
  flexShrink: 0,
  width: 128,
  paddingTop: 7,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}

// Single profession + single state — the license stated as plain text (no pills).
const summaryStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}
const summarySepStyle: CSSProperties = {
  margin: '0 9px',
  fontWeight: 400,
  color: 'var(--color-text-tertiary)',
}

// Wrap-mode label: same 128px column as the beside layout (so the first pill
// row aligns with the Profession pill), + a 4px nudge so the label→pill gap
// matches the beside row's 12px (8px flex gap + 4px). No paddingTop — the
// container centers it against the first pill row.
const wrapLabelStyle: CSSProperties = {
  flexShrink: 0,
  width: 128,
  marginRight: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}

const showMoreStyle: CSSProperties = {
  alignSelf: 'center',
  background: 'transparent',
  border: 'none',
  padding: '6px 4px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-action)',
  whiteSpace: 'nowrap',
}
