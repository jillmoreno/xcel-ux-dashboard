/**
 * AchievementTile — composition primitive shared by the dashboard widget
 * and the Passport page.
 *
 * Composes `PassportStamp` + chip + tooltip (+ optional progress ring
 * halo) into the unit each surface renders. Two visual variants drive
 * meaningfully different layouts:
 *
 *   - `variant="rail"` — used inside the widget's "Within reach" zone.
 *     The stamp itself is ALWAYS rendered as `within-reach`
 *     (dashed silhouette, 85% opacity, category-ink color). On top of
 *     that, a category-agnostic chip in the top-right corner declares
 *     the state: `READY` (primary green) for `ready` badges, `{N}%`
 *     (cyan) for `progress` badges — and `progress` tiles also wear a
 *     cyan ProgressRing as a halo around the stamp.
 *
 *     Below the stamp: name in Cutive Mono uppercase, then a metadata
 *     line — the `readyPrompt` for ready badges, "N of M unit" for
 *     progress badges.
 *
 *   - `variant="page"` — used on the Passport page grid. Renders the
 *     full stamp (label inside, rotated) and maps `status →
 *     PassportStamp state`:
 *       earned          → 'earned'
 *       ready/progress  → 'within-reach'
 *       locked/hidden   → 'locked'
 *     No chip overlay on the page — the page is a collection view, not
 *     a "what's next" rail.
 *
 * Both variants wrap the trigger in a `<Tooltip>` carrying the
 * `unlockCondition` + personal-best + rarity snippet.
 */

import type { CSSProperties } from 'react'
import type { Achievement, AchievementStatus } from '@/data/achievements'
import { PassportStamp, type StampState } from '@/components/ui/PassportStamp'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Tooltip } from '@/components/ui/Tooltip'

type Props = {
  achievement: Achievement
  variant: 'rail' | 'page'
}

export function AchievementTile({ achievement, variant }: Props) {
  return variant === 'rail' ? (
    <RailTile achievement={achievement} />
  ) : (
    <PageTile achievement={achievement} />
  )
}

/* ─── Rail variant ──────────────────────────────────────────────────── */

function RailTile({ achievement }: { achievement: Achievement }) {
  const isReady = achievement.status === 'ready'
  const isProgress = achievement.status === 'progress'
  const stampSize = 64
  // Ring is drawn 14px larger (7px on each side) — matches the mockup.
  const ringSize = stampSize + 14
  const pct =
    isProgress && achievement.progress
      ? Math.round(
          (achievement.progress.current / achievement.progress.target) * 100,
        )
      : 0

  const meta = (() => {
    if (isReady) return achievement.readyPrompt ?? 'Ready to claim'
    if (isProgress && achievement.progress) {
      const { current, target, unit } = achievement.progress
      return `${current} of ${target}${unit ? ` ${unit}` : ''}`
    }
    return ''
  })()

  const tip = tooltipContent(achievement)

  return (
    <Tooltip content={tip} placement="top">
      <button
        type="button"
        aria-label={`${achievement.title} — ${stateLabelFor(achievement.status)}`}
        style={railButtonStyle}
      >
        <div
          style={{
            position: 'relative',
            width: ringSize,
            height: ringSize,
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 6px',
          }}
        >
          {/* Progress ring halo — in-progress tiles only. */}
          {isProgress && achievement.progress && (
            <ProgressRing
              value={pct}
              size={ringSize}
              strokeWidth={2.5}
              trackColor="color-mix(in srgb, var(--color-tertiary-500) 18%, transparent)"
              meterColor="var(--color-tertiary-500)"
              aria-label={`Progress toward ${achievement.title}: ${pct}%`}
              style={{ position: 'absolute', inset: 0 }}
            />
          )}
          {/* Stamp itself — ALWAYS in within-reach state on the rail. */}
          <PassportStamp
            achievement={achievement}
            state="within-reach"
            size={stampSize}
            showLabel={false}
            rotated={false}
          />
          {/* State chip — top-right corner, sits above stamp + ring. */}
          {(isReady || isProgress) && (
            <span
              aria-hidden
              style={chipStyle(isReady ? 'ready' : 'progress')}
            >
              {isReady ? 'READY' : `${pct}%`}
            </span>
          )}
        </div>
        <div style={railNameStyle}>{achievement.title}</div>
        <div
          style={{
            ...railMetaStyle,
            color: isReady
              ? 'var(--color-primary-700)'
              : isProgress
                ? 'var(--color-tertiary-700)'
                : 'var(--ink-faded)',
          }}
        >
          {meta}
        </div>
      </button>
    </Tooltip>
  )
}

/* ─── Page variant ──────────────────────────────────────────────────── */

function PageTile({ achievement }: { achievement: Achievement }) {
  const state = statusToState(achievement.status)
  return (
    <Tooltip content={tooltipContent(achievement)} placement="top">
      <button
        type="button"
        aria-label={`${achievement.title} — ${stateLabelFor(achievement.status)}`}
        style={pageButtonStyle}
      >
        <PassportStamp
          achievement={achievement}
          state={state}
          size={80}
          showLabel
          rotated
        />
      </button>
    </Tooltip>
  )
}

function statusToState(status: AchievementStatus): StampState {
  switch (status) {
    case 'earned':
      return 'earned'
    case 'ready':
    case 'progress':
      return 'within-reach'
    case 'locked':
    case 'hidden':
      return 'locked'
  }
}

/* ─── Shared helpers ────────────────────────────────────────────────── */

function tooltipContent(a: Achievement) {
  const headline =
    a.status === 'earned' ? 'Earned. '
      : a.status === 'ready' ? 'Ready. '
        : a.status === 'progress' ? 'In progress. '
          : ''
  return (
    <span>
      {headline && (
        <strong style={{ color: 'var(--ink-gilt)' }}>{headline}</strong>
      )}
      {a.unlockCondition}
      {a.progress && a.status !== 'earned' && (
        <>
          {' '}
          <span>
            ({a.progress.current} / {a.progress.target}
            {a.progress.unit ? ` ${a.progress.unit}` : ''})
          </span>
        </>
      )}
      {a.personalBest && a.status !== 'earned' && (
        <>
          {' '}
          <span>
            Your best so far:{' '}
            <strong style={{ color: 'var(--ink-gilt)' }}>
              {a.personalBest.value} {a.personalBest.unit}
            </strong>
            .
          </span>
        </>
      )}
      {a.rarityPct > 0 && (
        <>
          {' '}
          <span>Held by {a.rarityPct}% of members.</span>
        </>
      )}
    </span>
  )
}

function stateLabelFor(status: AchievementStatus): string {
  switch (status) {
    case 'earned':
      return 'earned'
    case 'ready':
      return 'ready'
    case 'progress':
      return 'in progress'
    case 'locked':
    case 'hidden':
      return 'locked'
  }
}

function chipStyle(kind: 'ready' | 'progress'): CSSProperties {
  return {
    position: 'absolute',
    top: -6,
    right: -10,
    fontFamily: 'var(--font-stamp)',
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 'var(--radius-pill)',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
    color: 'var(--color-neutral-50)',
    // WCAG AA: chip text is 8.5px (well below the 18.66px "large text"
    // threshold) so it needs ≥ 4.5:1 contrast against its own
    // background.
    //   primary-500 (#028f81) → 3.99:1 ❌ — bumped to primary-700
    //     (#01554d) → 9.3:1 ✓ AAA.
    //   tertiary-500 (#39bae3) → 2.04:1 ❌❌ (worst offender; light
    //     cyan + white is a known WCAG trap) — bumped to tertiary-700
    //     (#226f88) → 5.71:1 ✓ AA. Still distinctly cyan-leaning, so
    //     it stays semantically distinct from the green READY chip.
    background:
      kind === 'ready' ? 'var(--color-primary-700)' : 'var(--color-tertiary-700)',
    boxShadow: '0 2px 5px rgb(0 0 0 / 0.15)',
    lineHeight: 1,
    zIndex: 3,
    pointerEvents: 'none',
    textTransform: kind === 'ready' ? 'uppercase' : 'none',
  }
}

const railButtonStyle: CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'center',
  width: '100%',
  display: 'block',
  borderRadius: 'var(--radius-md)',
}

const railNameStyle: CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--ink-deep)',
  lineHeight: 1.2,
}

const railMetaStyle: CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 9,
  marginTop: 2,
  lineHeight: 1.2,
}

const pageButtonStyle: CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  display: 'inline-flex',
  borderRadius: '50%',
}
