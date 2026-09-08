/**
 * Achievements widget — white card + warm parchment stamps.
 *
 * Composition:
 *
 *   - Section heading lives OUTSIDE the card so the widget reads as a
 *     sibling to PathsAndLicensesSection above it (both use the same
 *     Learning-Paths-style heading + card pattern).
 *
 *   - The CARD is white (`--color-surface-card`) with the standard
 *     `--color-border-subtle` border and `--shadow-card`. Parchment
 *     color is reserved EXCLUSIVELY for individual collected stamps.
 *
 *   - **Within Reach** is a NESTED bordered section inside the card.
 *     The body is a vertical STACKED LIST (not a grid) of
 *     `WithinReachRow` components, split into up to two subgroups:
 *
 *       ┌─ Ready · {n} ────────────────────────┐
 *       │ [row]  [row]                          │
 *       │ Ready row: green pill + Claim →       │
 *       └───────────────────────────────────────┘
 *       ┌─ In Progress · {n} ──────────────────┐
 *       │ [row]  [row]                          │
 *       │ Progress row: horizontal bar + {N}%   │
 *       └───────────────────────────────────────┘
 *
 *     Each row uses a flat category-ink icon tile — NOT the per-
 *     category `PassportStamp` silhouette. Shape variety is reserved
 *     for the all-up Passport page; the widget's rail scales by
 *     stacking, not by introducing new shapes.
 *
 *   - A solid teal banner divider sits between the two zones with
 *     "Stamps Collected" + a count chip. Open Sans typography matches
 *     the Within Reach eyebrow above.
 *
 *   - **Stamps Collected** is a grid of `CollectedStamp` cells (150x150
 *     tan cards with the per-category `PassportStamp` silhouette
 *     inside + title and date in black underneath). The cells are
 *     extracted to their own primitive — see
 *     `src/components/achievements/CollectedStamp.tsx`.
 */

import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { CollectedStamp } from '@/components/achievements/CollectedStamp'
import { WithinReachCard } from '@/components/achievements/WithinReachCard'
import { Card } from '@/components/ui/Card'
import { useAccount } from '@/context/AccountContext'
import {
  ACHIEVEMENT_CATALOG,
  achievementsFor,
  railAchievementsFor,
  recentStampsFor,
  type Achievement,
} from '@/data/achievements'

export function AchievementsWidget() {
  const { brand } = useAccount()
  const all = achievementsFor(brand)
  const { ready, progress } = railAchievementsFor(brand)
  const stamps = recentStampsFor(brand, 6)
  const earnedCount = all.filter((a) => a.status === 'earned').length
  const totalCount = ACHIEVEMENT_CATALOG.length
  const railTotal = ready.length + progress.length

  return (
    <section style={sectionWrapStyle}>
      <SectionHeading
        label={`Achievements (${earnedCount} of ${totalCount})`}
        viewAllHref="/account/achievements"
      />

      <Card style={cardStyle}>
        {/* ── Within Reach banner — full-width gray band, structurally
            paired with the Stamps Collected banner below so the two
            zones read as siblings inside the card. */}
        <div style={withinReachBannerStyle} aria-labelledby="achievements-rail-eyebrow">
          <span id="achievements-rail-eyebrow" style={withinReachBannerTitleStyle}>
            Within Reach
          </span>
          {railTotal > 0 && (
            <span style={withinReachBannerCountStyle}>{railTotal} total</span>
          )}
        </div>

        {/* ── Within Reach content — no inner border; the gray banner
            above does the section-delimiting work. */}
        <div style={withinReachContentStyle}>
          {railTotal === 0 ? (
            <EmptyRail />
          ) : (
            <>
              {ready.length > 0 && (
                <Subgroup
                  kind="ready"
                  label="One Step Away"
                  count={ready.length}
                  rows={ready}
                />
              )}
              {progress.length > 0 && (
                <Subgroup
                  kind="progress"
                  label="In Progress"
                  count={progress.length}
                  rows={progress}
                />
              )}
            </>
          )}
        </div>

        {/* ── Solid teal banner divider ── */}
        <div style={stampsBannerStyle}>
          <span style={stampsBannerTitleStyle}>Stamps Collected</span>
          <span style={stampsBannerCountStyle}>
            {earnedCount} of {totalCount}
          </span>
        </div>

        {/* ── Zone 2 · Stamps Collected ── */}
        <section style={zoneStampsStyle} aria-label="Stamps collected">
          {stamps.length === 0 ? (
            <EmptyStrip />
          ) : (
            <div style={stripStyle}>
              {stamps.map((a) => (
                <CollectedStamp key={a.id} achievement={a} />
              ))}
            </div>
          )}
        </section>
      </Card>
    </section>
  )
}

/* ─── Section heading — matches LearnerOverviewPanel pattern ────────── */

function SectionHeading({
  label,
  viewAllHref,
}: {
  label: string
  viewAllHref: string
}) {
  return (
    <div style={sectionHeadingRowStyle}>
      <span style={sectionHeadingLabelStyle}>{label}</span>
      <Link to={viewAllHref} className="cre-link-action" style={sectionHeadingLinkStyle}>
        View All →
      </Link>
    </div>
  )
}

/* ─── Subgroup ─────────────────────────────────────────────────────────
 *
 * A small mini-label (colored pip + "Ready · N") followed by a flat
 * vertical stack of `WithinReachRow`s. Each subgroup renders only when
 * it has at least one row — when the brand's `ready` or `progress` list
 * is empty, the subgroup's mini-label is omitted entirely so the rail
 * collapses vertically rather than leaving an awkward gap.
 */

function Subgroup({
  kind,
  label,
  count,
  rows,
}: {
  kind: 'ready' | 'progress'
  label: string
  count: number
  rows: Achievement[]
}) {
  const dotColor =
    kind === 'ready'
      ? 'var(--color-success-500)'
      : 'var(--color-tertiary-500)'
  return (
    <>
      <div style={subgroupLabelStyle}>
        <span aria-hidden style={{ ...subgroupDotStyle, background: dotColor }} />
        {label}{' '}
        <span style={subgroupCountStyle}>· {count}</span>
      </div>
      <div style={cardGridStyle}>
        {rows.map((a) => (
          <WithinReachCard key={a.id} achievement={a} />
        ))}
      </div>
    </>
  )
}

/* ─── Empty states ──────────────────────────────────────────────────── */

function EmptyRail() {
  return (
    <div style={railEmptyStyle}>
      <strong style={railEmptyTitleStyle}>
        Nothing right around the corner.
      </strong>
      <span style={railEmptySubStyle}>
        Keep at it — new stamps appear here when you&rsquo;re close.
      </span>
    </div>
  )
}

function EmptyStrip() {
  return (
    <div style={stripEmptyStyle}>
      Your passport is unstamped. Earn your first achievement to begin the
      collection.
    </div>
  )
}

/* ─── styles ────────────────────────────────────────────────────────── */

const sectionWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const sectionHeadingRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
}

const sectionHeadingLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const sectionHeadingLinkStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-action)',
  textDecoration: 'none',
}

const cardStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  padding: 0,
  overflow: 'hidden',
}

/* ── Within Reach ──
 *
 * The Within Reach zone now uses the same banner-divider pattern as
 * Stamps Collected below: a full-width band at the section's top
 * carries the title + count, and the content (subgroups + cards)
 * sits flush below with no inner border. The medium-gray banner
 * pairs structurally with the teal Stamps banner so the card reads
 * as "two banded zones inside one card."
 */
const withinReachBannerStyle: CSSProperties = {
  // Dark neutral background paired with white text — 11.05:1
  // contrast (AAA). Visually matches the weight of the teal Stamps
  // Collected banner below; the gray vs teal distinction
  // differentiates the two zones.
  background: 'var(--color-neutral-800)',
  color: 'var(--color-neutral-50)',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}

const withinReachBannerTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-50)',
}

const withinReachBannerCountStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--color-neutral-50)',
  // Same translucent-white chip the Stamps Collected banner uses, so
  // the two count chips read as a matched pair.
  background: 'color-mix(in srgb, white 18%, transparent)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-pill)',
  letterSpacing: '0.04em',
}

const withinReachContentStyle: CSSProperties = {
  // Top padding intentionally 0 — the first subgroup label already
  // carries a 14px top margin (see `subgroupLabelStyle`), so adding
  // top padding here would double up the gap below the banner.
  padding: '0 20px 20px',
  background: 'var(--color-surface-card)',
}

const subgroupLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '14px 4px 4px',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  // text-secondary instead of text-tertiary so the label passes WCAG
  // AA at this small size (was 3.79:1 on white, now 7.55:1).
  color: 'var(--color-text-secondary)',
}

const subgroupDotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  flexShrink: 0,
}

const subgroupCountStyle: CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
}

/** 2-column landscape-card grid — each subgroup renders up to 2 cards
 *  in a single 2-up row. When only 1 card qualifies in a subgroup, the
 *  right grid cell stays empty rather than the card spanning both
 *  columns; that preserves the 2-up rhythm across sparser populations. */
const cardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
}

const railEmptyStyle: CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const railEmptyTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}

const railEmptySubStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  // text-secondary (not text-tertiary) for AA at this size.
  color: 'var(--color-text-secondary)',
}

/* ── Solid teal banner ──
 *
 * Background was bumped from `--color-primary-500` (#028f81, 3.99:1
 * vs white) to `--color-primary-600` (#017267, 5.83:1) so the white
 * banner text passes WCAG AA. Still recognizably the brand teal, just
 * one ramp step darker. */
const stampsBannerStyle: CSSProperties = {
  background: 'var(--color-primary-600)',
  color: 'var(--color-neutral-50)',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}

/* Title + count chip mirror the "Within Reach" eyebrow above — Open
   Sans 11px weight 700 uppercase, same 0.08em letter-spacing. The
   teal background does the section-divider work; the typography stays
   in the dashboard chrome family. */
const stampsBannerTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-50)',
}

const stampsBannerCountStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--color-neutral-50)',
  background: 'color-mix(in srgb, white 18%, transparent)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-pill)',
  letterSpacing: '0.04em',
}

/* ── Stamps Collected zone ── */
const zoneStampsStyle: CSSProperties = {
  padding: '20px 20px 22px',
  background: 'var(--color-surface-card)',
}

const stripStyle: CSSProperties = {
  // Fixed 150px columns — auto-fill packs as many as fit per row, then
  // wraps. Each card stays exactly 150x150 regardless of viewport;
  // wrapping is the only adaptive behaviour.
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 150px)',
  gap: 14,
  justifyContent: 'start',
}

const stripEmptyStyle: CSSProperties = {
  padding: '20px 16px',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--color-text-secondary)',
}
