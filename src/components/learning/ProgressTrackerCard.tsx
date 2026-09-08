import { Fragment, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { CardEyebrow } from '@/components/courses/LearningPathCard'
import { LICENSE_TRACKER } from '@/data/dashboardFixtures'
import type { LearningPathSummary } from '@/data/learningFixtures'
import type { WidgetPalette } from '@/components/membership/v5/widgetColorUtil'
import { CategoryBars, CategoryLegendCompact, ProgressDonut } from './progressGauge'
import { resolvePathCategories } from './progressGaugeUtil'

/**
 * ProgressTrackerCard — Option E ("Gauge + horizontal stat strip") from
 * `explorations/progress-tracker-redesign/consolidated-progress-widget.html`.
 *
 * One consolidated card that merges the old `OverallProgressWidget`
 * (completion donut + Mandatory/Elective breakdown) with the
 * `LicenseTracker` facts (Time Remaining / Expires / Hours Logged) under
 * a single header. The donut geometry + percent derivation are lifted
 * verbatim from `OverallProgressWidget` so the gauge reads identically;
 * the license facts come from the `LICENSE_TRACKER` fixture, exactly as
 * `LicenseTracker` consumes them today.
 *
 * Brand-portable: every color resolves to a brand-overridden token, so
 * the card relights on `<html data-brand>` flips without reading `brand`.
 *
 * When the active path carries a Mandatory + Elective breakdown, the gauge
 * becomes a two-segment donut and two labeled category bars render beneath it
 * (Option A in `explorations/learning-path-categories/`). The gauge + bars are
 * shared with the detail panel via [`progressGauge`](src/components/learning/progressGauge.tsx).
 * Paths without a breakdown render exactly as before (single-color gauge, no bars).
 */

type Props = {
  path: LearningPathSummary
  /** Show the "View All (N)" link in the header. Only meaningful when the
   *  learner has more than one learning path — a single-path learner has
   *  nothing to view all of, so the caller passes `false`. */
  showViewAll?: boolean
  /** Total number of learning paths — rendered in the View All affordance as
   *  "View All (N)". Comes from `useLearningPathCardsForBrand()` at the
   *  callsite. */
  pathsCount?: number
  /** Click handler for "View All (N)". When provided, the link opens the My
   *  Learning Paths slide-over in place (via `useLearningPathsPanel().openPanel`)
   *  instead of routing to the LP page. */
  onViewAll?: () => void
  /** Body arrangement. `default` — gauge left + a 3-up stat strip right
   *  (reflows to one column below ~720px). `compact` — a 2×2 grid: the gauge
   *  beside the Completed tile, with License Expires + Time Remaining paired
   *  beneath. Used by the stacked dashboard layout's narrow 1/3 column. */
  layout?: 'default' | 'compact'
  /** How the Mandatory / Elective breakdown is arranged in the `default` body
   *  layout — `bars` (gauge + a progress bar per category, with the 3 stat
   *  tiles in a row beneath; taller) or `compact` (a single row: gauge + a
   *  legend with the hour count stacked under each label + the 3 stat tiles
   *  pushed right; shorter). Driven by `dashboard-learning-path-breakdown`.
   *  Only affects the `default` body layout with a two-category breakdown — the
   *  `compact` body layout (2×2 grid) and single-category paths ignore it. */
  breakdownLayout?: 'bars' | 'compact'
  /** Color-wheel palette (the stacked dashboard's `dashboard-learning-path-width`
   *  flag's secondary "Card color" axis). When omitted, the card keeps its
   *  default surface-card look. The dark bands (`onDark`) fully reframe the
   *  card + gauge + stat tiles to a light-on-dark treatment. */
  palette?: WidgetPalette
  /** Opens the Learning Path detail panel from the card's footer link
   *  ("View full breakdown & requirements →"). When omitted, the link is
   *  hidden — so classic `/dashboard` callsites stay unchanged unless they
   *  opt in. */
  onViewDetails?: () => void
}

export function ProgressTrackerCard({
  path,
  showViewAll = false,
  layout = 'default',
  breakdownLayout = 'bars',
  palette,
  pathsCount,
  onViewAll,
  onViewDetails,
}: Props) {
  // Themed treatment derives from the palette. `onDark` (primary/secondary
  // bands) flips the header / gauge / tiles to light; `white`/`none` only swap
  // the card surface (the rest stays the default look).
  const onDark = palette?.onDark ?? false
  const cardStyle: CSSProperties = {
    padding: '16px 20px',
    gap: 20,
    ...(palette
      ? {
          background: palette.surface,
          border: palette.border,
          ...(palette.surface === 'transparent' ? { boxShadow: 'none' } : null),
        }
      : null),
  }
  const titleColor = onDark ? 'var(--color-text-inverse)' : 'var(--color-action)'
  const metaColor = onDark ? palette!.sub : 'var(--color-text-secondary)'
  const metaDivider = onDark ? 'rgb(255 255 255 / 0.3)' : 'var(--color-border-subtle)'
  // Gauge + stat-tile colors only diverge on the dark bands.
  const gaugeColors = onDark
    ? { track: 'rgb(255 255 255 / 0.25)', fill: 'var(--color-text-inverse)', text: 'var(--color-text-inverse)' }
    : undefined
  const mandatory = path.mandatory ?? { completed: 0, required: 0 }
  const elective = path.elective ?? { completed: 0, required: 0 }
  // Resolve to the generalized category list; totals come from it so
  // >2-category paths compute the correct overall %.
  const cats = resolvePathCategories(path)
  const totalRequired = cats.length ? cats.reduce((s, c) => s + c.required, 0) : mandatory.required + elective.required
  const totalCompleted = cats.length ? cats.reduce((s, c) => s + c.completed, 0) : mandatory.completed + elective.completed
  // Identical to OverallProgressWidget: required-credit-hours completion,
  // falling back to the path's headline progress when nothing's required.
  const percent =
    totalRequired > 0
      ? Math.round((totalCompleted / totalRequired) * 100)
      : path.progressPct
  // Two-segment gauge + breakdown ONLY for exactly two categories (each with
  // required > 0). More than two → the single-color gauge here (the full list
  // lives in the detail panel), per the dashboard breakdown rule; single/none →
  // the single-color gauge too.
  const hasBreakdown = cats.length === 2 && cats.every((c) => c.required > 0)

  // Education-type-aware labels (CE defaults when the path omits them). QE paths
  // supply "Required Courses" / "Elective" / "Target Date"; STC CE supplies
  // "Products and Practices" / "Ethics and Professional Responsibility".
  const mandatoryLabel = path.mandatoryLabel ?? 'Mandatory'
  const electiveLabel = path.electiveLabel ?? 'Elective'
  const deadlineLabel = path.deadlineLabel ?? 'License Expires'

  const { weeksLeft, expires, editHref } = LICENSE_TRACKER
  // "NOVEMBER" → "Nov"
  const expiresMonth =
    expires.month.charAt(0) + expires.month.slice(1, 3).toLowerCase()

  // Detail line mirrors the Learning Path page header — category · CE
  // (for continuing-education paths) · state · hours.
  const isCE = path.category.toLowerCase().includes('continuing education')
  const details = [
    path.category,
    ...(isCE ? ['CE'] : []),
    ...(path.state ? [path.state] : []),
    `${path.hours} Hours`,
  ]

  // Per-tile background tints (shared by the full + compact tile variants).
  const completedBg = 'color-mix(in srgb, var(--color-primary-500) 8%, var(--color-surface-card))'
  const expiresBg = 'color-mix(in srgb, var(--color-secondary-500) 12%, var(--color-surface-card))'
  const timeBg = 'var(--color-neutral-75)'

  // The three stat tiles, shared by both body layouts.
  const completedTile = (
    <StatTile
      caption="Completed"
      value={String(totalCompleted)}
      unit={`/ ${totalRequired}`}
      sub="Credit Hours"
      background={completedBg}
      onDark={onDark}
    />
  )
  const expiresTile = (
    <StatTile
      caption={deadlineLabel}
      value={`${expiresMonth} ${expires.day}`}
      valueFontSize={18}
      sub={String(expires.year)}
      background={expiresBg}
      onDark={onDark}
    />
  )
  const timeTile = (
    <StatTile
      caption="Time Remaining"
      value={String(weeksLeft)}
      unit="wks"
      sub="Left to complete"
      background={timeBg}
      onDark={onDark}
    />
  )

  // The same three tiles, tightened for the compact single-row breakdown
  // (reduced padding + smaller value type). A 3-equal-column grid keeps all
  // three the SAME width (each column = the widest tile's content); the grid is
  // pushed right via `margin-left: auto` and, when the row is too narrow, wraps
  // to its own line below the gauge/legend (where it has the full card width).
  const compactStatTiles = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginLeft: 'auto' }}>
      <StatTile
        compact
        caption="Completed"
        value={String(totalCompleted)}
        unit={`/ ${totalRequired}`}
        sub="Credit Hours"
        background={completedBg}
        onDark={onDark}
      />
      <StatTile
        compact
        caption={deadlineLabel}
        value={`${expiresMonth} ${expires.day}`}
        valueFontSize={16}
        sub={String(expires.year)}
        background={expiresBg}
        onDark={onDark}
      />
      <StatTile
        compact
        caption="Time Remaining"
        value={String(weeksLeft)}
        unit="wks"
        sub="Left to complete"
        background={timeBg}
        onDark={onDark}
      />
    </div>
  )

  return (
    <Card style={cardStyle}>
      {/* Header — uppercase eyebrow + the active path's name + detail line.
          Colors flip light on the dark bands. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {onDark ? (
          // Dark-band variant — CardEyebrow hardcodes the neutral eyebrow color,
          // so the band paints its own light eyebrow + a matching light "View
          // All (N)" button (the CardEyebrow path below owns the light-mode case).
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: palette!.eyebrow,
              }}
            >
              Current Learning Path
            </span>
            {showViewAll && onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="cre-link-action"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text-inverse)',
                }}
              >
                {`View All (${pathsCount ?? ''})`}
              </button>
            )}
          </div>
        ) : (
          <CardEyebrow
            label="Current Learning Path"
            {...(showViewAll
              ? onViewAll
                ? { onViewAll, viewAllCount: pathsCount }
                : { viewAllHref: editHref, viewAllCount: pathsCount }
              : {})}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 18,
              lineHeight: '24px',
            }}
          >
            <Link
              to="/my-learning/path"
              className="cre-link-action"
              style={{
                color: titleColor,
                textDecoration: 'none',
                font: 'inherit',
                // Tight line-height + inline-block so the link box hugs
                // the glyphs — keeps the hover underline (`::after`,
                // bottom: -2px) right under the text instead of floating
                // ~5px below it from the h3's 24px line-height.
                lineHeight: 1.1,
                display: 'inline-block',
              }}
            >
              {path.title}
            </Link>
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: '18px',
              color: metaColor,
            }}
          >
            {details.map((detail, i) => (
              <Fragment key={detail}>
                {i > 0 && (
                  <span
                    aria-hidden
                    style={{
                      width: 1,
                      height: 12,
                      background: metaDivider,
                    }}
                  />
                )}
                <span>{detail}</span>
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {layout === 'compact' ? (
        hasBreakdown ? (
          // Compact (narrow column) WITH breakdown: gauge + Completed on top, the
          // two category bars full-width beneath, then License Expires + Time.
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProgressDonut percent={percent} caption="Complete" colors={gaugeColors} mandatory={mandatory} elective={elective} />
              </div>
              {completedTile}
            </div>
            <CategoryBars mandatory={mandatory} elective={elective} mandatoryLabel={mandatoryLabel} electiveLabel={electiveLabel} onDark={onDark} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {expiresTile}
              {timeTile}
            </div>
          </div>
        ) : (
          // Compact, no breakdown — unchanged 2×2 grid.
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ProgressDonut percent={percent} caption="Complete" colors={gaugeColors} />
            </div>
            {completedTile}
            {expiresTile}
            {timeTile}
          </div>
        )
      ) : !hasBreakdown ? (
        // Default, no breakdown (single category or none) — unchanged
        // gauge | stat strip. `breakdownLayout` doesn't apply here.
        <div className="cre-progress-tracker-body">
          <div style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
            <ProgressDonut percent={percent} caption="Complete" colors={gaugeColors} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: 14,
            }}
          >
            {completedTile}
            {expiresTile}
            {timeTile}
          </div>
        </div>
      ) : breakdownLayout === 'compact' ? (
        // Default WITH breakdown · COMPACT: one row — gauge + a legend with the
        // hour count stacked under each label + the three stat tiles pushed
        // right (tightened). Collapses the bars row + tile row into one, so the
        // widget is shorter. Wraps gracefully in a narrow column.
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <ProgressDonut percent={percent} caption="Complete" colors={gaugeColors} mandatory={mandatory} elective={elective} />
          <CategoryLegendCompact mandatory={mandatory} elective={elective} mandatoryLabel={mandatoryLabel} electiveLabel={electiveLabel} onDark={onDark} />
          {compactStatTiles}
        </div>
      ) : (
        // Default WITH breakdown · BARS (default): gauge + category bars (reflows
        // under 720px), then the stat strip full-width beneath.
        <>
          <div className="cre-progress-tracker-body">
            <ProgressDonut percent={percent} caption="Complete" colors={gaugeColors} mandatory={mandatory} elective={elective} />
            <CategoryBars mandatory={mandatory} elective={elective} mandatoryLabel={mandatoryLabel} electiveLabel={electiveLabel} onDark={onDark} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 14 }}>
            {completedTile}
            {expiresTile}
            {timeTile}
          </div>
        </>
      )}

      {onViewDetails && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onViewDetails}
            className="cre-link-action"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              color: onDark ? 'var(--color-text-inverse)' : 'var(--color-action)',
            }}
          >
            View full breakdown &amp; requirements →
          </button>
        </div>
      )}
    </Card>
  )
}

/* ─── Stat tile ──────────────────────────────────────────────────────── */

function StatTile({
  caption,
  value,
  unit,
  sub,
  background,
  valueFontSize,
  onDark = false,
  compact = false,
}: {
  caption: string
  value: string
  unit?: string
  sub: string
  background: string
  valueFontSize?: number
  /** Dark-band reframe — translucent-white tile + light text (overrides the
   *  per-tile `background` tint). */
  onDark?: boolean
  /** Compact variant (the single-row breakdown): tighter padding, smaller value
   *  type, and a min-width so all three tiles sit on the row + wrap when narrow. */
  compact?: boolean
}) {
  const valueStyle: CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: valueFontSize ?? (compact ? 19 : 22),
    lineHeight: 1.15,
    color: onDark ? 'var(--color-text-inverse)' : 'var(--color-neutral-darkest)',
  }
  return (
    <div
      style={{
        background: onDark ? 'rgb(255 255 255 / 0.12)' : background,
        borderRadius: 'var(--radius-md)',
        // Tighter top/bottom padding (was 18) to trim the widget's height; the
        // compact variant tightens further + reserves a min-width so the three
        // tiles fit one row (and wrap, not overflow, in a narrow column).
        padding: compact ? '11px 13px' : '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: compact ? 92 : 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          color: onDark ? 'rgb(255 255 255 / 0.7)' : 'var(--color-text-secondary)',
        }}
      >
        {caption}
      </span>
      <span style={valueStyle}>
        {value}
        {unit && (
          <small
            style={{
              marginLeft: 4,
              fontSize: 13,
              fontWeight: 600,
              color: onDark ? 'rgb(255 255 255 / 0.7)' : 'var(--color-neutral-dark)',
            }}
          >
            {unit}
          </small>
        )}
      </span>
      <span
        style={{
          // Pinned to the bottom of the (equal-height) tile so the
          // sub-text aligns horizontally across all three tiles even
          // when their value font sizes differ.
          marginTop: 'auto',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          lineHeight: '16px',
          color: onDark ? 'rgb(255 255 255 / 0.7)' : 'var(--color-text-tertiary)',
        }}
      >
        {sub}
      </span>
    </div>
  )
}
