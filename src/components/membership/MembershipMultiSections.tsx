import { useMemo, useState, type CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  multiMembershipRowsFor,
  resolveMembershipCount,
  rollupScorecardFor,
  professionsForRows,
  statesForRows,
  type MembershipRow,
} from '@/data/membership/membershipScorecardFixtures'
import { MembershipRowCard } from './MembershipRowCard'
import { MembershipScorecardPanel } from './MembershipScorecard'
import { ShelfScroller } from '@/components/dashboard/recommended/ShelfScroller'
import { chipClassName, chipStyle, filterLabelStyle, filterRowStyle } from './LibraryCategoryChips'

/** How the Profession / State pills behave — the open question this concept is
 *  built to answer, so all three are switchable via `membership-multi-pills`. */
type PillBehavior = 'filter-rollup' | 'filter-only' | 'display-only'

const ALL = 'All'

/**
 * Multiple-memberships concept.
 *
 * A learner can hold several memberships at once. This inverts the
 * single-membership layout: one **lifetime scorecard rolls up across every
 * membership** at the top, and each membership becomes a full-width, narrow row
 * beneath it. Between them sit Profession and State pill rows reusing the
 * Learning Library's filter chrome.
 *
 * The pills' behavior is deliberately switchable (`membership-multi-pills`)
 * because it's genuinely undecided:
 *
 *   - `filter-rollup` (default) — pills narrow the rows AND the scorecard
 *     recomputes to match, so the total always describes what's on screen.
 *   - `filter-only` — pills narrow the rows; the scorecard stays the lifetime
 *     all-memberships total regardless.
 *   - `display-only` — no filtering at all; profession and state read as labels
 *     on each row and the pill rows are hidden.
 *
 * Profession and State filter **independently**, each with an "All" pill (the
 * Learning Library model). That can produce combinations the learner doesn't
 * hold — Nursing + Texas when Nursing is only held in Florida — so the empty
 * state is a first-class part of this design, not an afterthought.
 */
/** At or below this many memberships the cards lie down as landscape bands;
 *  above it they use the 3-up passport tile grid. */
const BAND_MAX = 2

export function MembershipMultiSections({ onManage }: { onManage?: (id: string) => void } = {}) {
  const { brand } = useAccount()
  const behavior = (useFeatureFlag('membership-multi-pills').variant ?? 'filter-rollup') as PillBehavior
  // How many memberships the learner holds — the SAME `membership-count` flag
  // the left rail reads, so the two surfaces can never disagree.
  const countFlag = useFeatureFlag('membership-count')
  const count = resolveMembershipCount(countFlag.enabled, countFlag.variant)
  const rows = useMemo(() => multiMembershipRowsFor(brand, count), [brand, count])

  const [profession, setProfession] = useState<string>(ALL)
  const [state, setState] = useState<string>(ALL)

  const professions = useMemo(() => professionsForRows(rows), [rows])
  const states = useMemo(() => statesForRows(rows), [rows])

  const bandLayout = rows.length <= BAND_MAX
  // Filtering a single membership is pointless chrome — the pills can only
  // ever hide the one thing on screen. Hidden below 2 regardless of behavior.
  const filtering = behavior !== 'display-only' && rows.length > 1
  const visible = filtering
    ? rows.filter(
        (r) =>
          (profession === ALL || r.profession === profession) && (state === ALL || r.state === state),
      )
    : rows

  // `filter-rollup` totals what's on screen; the other two always total
  // everything. Same function either way, so the math can't diverge.
  const scorecard = rollupScorecardFor(behavior === 'filter-rollup' ? visible : rows)
  const filtered = filtering && (profession !== ALL || state !== ALL)

  if (rows.length === 0) return null

  return (
    <div style={wrapStyle}>
      {/* ── Roll-up scorecard ──
          Suppressed entirely when a filter matches nothing: the list's empty
          state below already explains it, and two near-identical "no matches"
          messages on one screen is noise. */}
      {scorecard && (
        // The section heading is dropped — the scorecard's own "Lifetime Member
        // Savings" eyebrow + caption already name it — so the card floats up
        // against the hero. aria-label keeps the section named for assistive tech.
        <section aria-label="Lifetime member savings">
          <MembershipScorecardPanel
            card={scorecard}
            valueTitle="Lifetime Member Savings"
            valueLabel={
              behavior === 'filter-rollup' && filtered
                ? 'saved on member pricing across the memberships shown'
                : 'saved on member pricing across all your memberships'
            }
          />
        </section>
      )}

      {/* ── Cards, then filters ──
          The passport cards come first; the Profession / State pills sit
          *below* them. 1–2 memberships lie down as landscape bands; 3+ move into
          a horizontal carousel (the course-shelf pattern) rather than a wall of
          tiles. */}
      <section aria-labelledby="membership-list-heading">
        <div style={headingRowStyle}>
          <h2 id="membership-list-heading" style={labelStyle}>
            {/* "Your memberships (1)" reads as a list of one — drop the count
                and the plural when there's a single membership. */}
            {rows.length === 1 ? 'Your membership' : `Your memberships (${rows.length})`}
          </h2>
          {filtered && (
            <button type="button" onClick={clearAll} style={clearStyle}>
              Clear filters
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <EmptyCombination onClear={clearAll} rows={rows} />
        ) : bandLayout ? (
          // 1–2 memberships: the portrait tile stretched to half or full width
          // is mostly empty space, so the card lies down into a landscape band
          // instead (Variation 1).
          <div style={bandsStyle}>
            {visible.map((row) => (
              <MembershipRowCard key={row.id} row={row} onManage={onManage} layout="band" />
            ))}
          </div>
        ) : (
          // 3+ memberships: a horizontal carousel of passport tiles rather than a
          // grid, so the row scrolls instead of wrapping into a wall.
          <ShelfScroller
            label="Your memberships"
            cardWidth={{ desktop: 320, mobile: 280 }}
            arrowTone="dark"
            arrowsPersistent
          >
            {visible.map((row) => (
              <MembershipRowCard key={row.id} row={row} onManage={onManage} />
            ))}
          </ShelfScroller>
        )}

        {filtering && (
          <div style={filtersStyle}>
            <PillRow
              label="Profession"
              options={professions}
              active={profession}
              onChange={setProfession}
            />
            <PillRow label="State" options={states} active={state} onChange={setState} />
          </div>
        )}
      </section>
    </div>
  )

  function clearAll() {
    setProfession(ALL)
    setState(ALL)
  }
}

/**
 * One filter row — an "All" pill followed by one pill per value. Single-select
 * with `All` as the cleared state, so it reads as a radiogroup rather than a
 * set of independent toggles. Reuses the Learning Library chip styles so the
 * two surfaces read identically.
 */
function PillRow({
  label,
  options,
  active,
  onChange,
}: {
  label: string
  options: string[]
  active: string
  onChange: (next: string) => void
}) {
  return (
    <section aria-label={`Filter by ${label.toLowerCase()}`} style={filterRowStyle}>
      {/* Deliberately NOT a heading — the membership cards use <h3> for each
          membership name, and a heading here would sit at the same level as
          them, implying "Profession" is a peer of "Nursing". The radiogroup
          already carries the accessible name, so this is presentational. */}
      <p style={filterLabelStyle}>{label}</p>
      <div role="radiogroup" aria-label={label} style={chipsRowStyle}>
        {[ALL, ...options].map((opt) => {
          const isActive = opt === active
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt)}
              className={chipClassName(isActive)}
              style={chipStyle()}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </section>
  )
}

/**
 * The cost of filtering Profession and State independently: a learner can pick
 * a pair they don't hold. Rather than a bare "no results", name the combination
 * and list what they actually hold, so the dead end is self-correcting.
 */
function EmptyCombination({ onClear, rows }: { onClear: () => void; rows: MembershipRow[] }) {
  return (
    <div style={emptyStyle}>
      <p style={emptyTitleStyle}>No memberships match these filters</p>
      <p style={emptyBodyStyle}>
        You hold{' '}
        {rows.map((r, i) => (
          <span key={r.id}>
            {i > 0 && (i === rows.length - 1 ? ', and ' : ', ')}
            <b>
              {r.profession} in {r.state}
            </b>
          </span>
        ))}
        .
      </p>
      <button type="button" onClick={onClear} style={emptyCtaStyle}>
        Clear filters
      </button>
    </div>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 28 }

const headingRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 12,
}

const labelStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.11em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-600)',
}

const clearStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-accent-link)',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
}

const filtersStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginTop: 20,
}

const chipsRowStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

// At or below the scroll threshold — a responsive grid. `auto-fit` lets 1–3
// passport cards sit side by side on wide viewports and wrap on narrow ones.
// 1–2 memberships: full-width landscape bands, stacked.
const bandsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const emptyStyle: CSSProperties = {
  padding: '28px 24px',
  textAlign: 'center',
  background: 'var(--color-surface-card)',
  border: '1px dashed var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 17,
  fontWeight: 800,
  color: 'var(--color-text-primary)',
}

const emptyBodyStyle: CSSProperties = {
  margin: '8px 0 16px',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--color-text-secondary)',
}

const emptyCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 36,
  padding: '0 18px',
  borderRadius: 'var(--radius-pill)',
  border: 'none',
  cursor: 'pointer',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 800,
}

