/**
 * WithinReachCard — a landscape card in the widget's Within Reach
 * zone.
 *
 * Anatomy:
 *
 *   ┌─── 52px ──┬──────────── 1fr ───────────────────┐
 *   │           │ TITLE (Cutive Mono)         %  →   │  ← progress only
 *   │  icon     │ Description (Open Sans)            │  ← unlockCondition
 *   │  tile     │ Rarity · Best so far (Open Sans)   │
 *   │           │ ▓▓▓▓░░░░  (progress bar)            │  ← progress only
 *   │           │ N of M unit                         │  ← progress only
 *   └───────────┴─────────────────────────────────────┘
 *
 * Used by `AchievementsWidget`. Renders as a `<button>` so it's
 * keyboard-focusable and the whole card is a single click target.
 * Clicking navigates to `/account/achievements?focus={id}` via
 * react-router's programmatic navigation.
 *
 * **NOT a PassportStamp.** The card uses a flat rounded-square icon
 * tile (NOT the per-category SVG silhouette system). Per-category
 * shape variety is reserved for the all-up Passport page; the
 * widget's rail uses one consistent tile shape so the 2-up grid stays
 * rhythmic and the surfaced metadata (title / description / rarity /
 * bar) gets the visual focus.
 *
 * **No tooltip wrapper.** Everything the user needs to know is
 * surfaced on the card itself (unlock condition, rarity, personal
 * best). The previous WithinReachRow design hid this content in a
 * hover tooltip; the new card-based layout makes it discoverable for
 * touch users + keyboard-only users without needing a hover trigger.
 *
 * **No status chip. No Claim CTA.** The subgroup mini-label above the
 * grid carries the "what state am I in" signal; the presence/absence
 * of the bar block on the card itself reinforces it.
 */

import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  iconForAchievement,
  type Achievement,
} from '@/data/achievements'

type Props = {
  achievement: Achievement
}

export function WithinReachCard({ achievement }: Props) {
  const navigate = useNavigate()
  const Icon = iconForAchievement(achievement.iconKey)
  const isProgress = achievement.status === 'progress'
  const isReady = achievement.status === 'ready'
  const inkVar = `var(--ink-${achievement.category})`

  const pct =
    isProgress && achievement.progress
      ? Math.round(
          (achievement.progress.current / achievement.progress.target) * 100,
        )
      : 0

  const stateLabel = isReady
    ? 'one step away'
    : isProgress
      ? `in progress, ${pct}% complete`
      : 'within reach'

  // Rarity line — when personalBest is present (typically streaks),
  // weave it in so the user sees what they're chasing alongside the
  // social-proof rarity number.
  const rarityLine = (() => {
    if (achievement.personalBest) {
      return `Best so far: ${achievement.personalBest.value} ${achievement.personalBest.unit} · ${achievement.rarityPct}% of members`
    }
    return achievement.rarityPct > 0
      ? `${achievement.rarityPct}% of members`
      : ''
  })()

  return (
    <button
      type="button"
      aria-label={`${achievement.title} — ${stateLabel}`}
      onClick={() =>
        navigate(`/account/achievements?focus=${encodeURIComponent(achievement.id)}`)
      }
      style={{
        ...cardStyle,
        borderColor: `color-mix(in srgb, ${inkVar} 45%, white)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-neutral-100)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--color-neutral-50)'
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = 'var(--color-neutral-100)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = 'var(--color-neutral-50)'
      }}
    >
      {/* Left cell — icon tile. Flat rounded-square, category-ink
          colored. The `color: inkVar` cascades into the icon via
          `currentColor`. */}
      <span
        aria-hidden
        style={{
          ...iconTileStyle,
          color: inkVar,
          background: `color-mix(in srgb, ${inkVar} 10%, white)`,
          borderColor: `color-mix(in srgb, ${inkVar} 40%, white)`,
        }}
      >
        <Icon size={26} aria-hidden />
      </span>

      {/* Right cell — content stack. */}
      <span style={contentStackStyle}>
        {/* Title row: title on the left, percentage on the right for
            progress cards only (ready cards leave the right side
            empty). */}
        <span style={titleRowStyle}>
          <span style={{ ...titleStyle, color: inkVar }}>
            {achievement.title}
          </span>
          {isProgress && (
            <span style={{ ...titlePercentStyle, color: inkVar }}>
              {pct}%
            </span>
          )}
        </span>

        {/* Description — the unlock condition, verbatim. Open Sans, not
            Cutive Mono — Open Sans wins the legibility battle for body
            text at this size. */}
        <span style={descriptionStyle}>{achievement.unlockCondition}</span>

        {/* Rarity + personal-best line. */}
        {rarityLine && <span style={rarityLineStyle}>{rarityLine}</span>}

        {/* Bar block — progress cards only. */}
        {isProgress && achievement.progress && (
          <>
            <span aria-hidden style={barTrackStyle}>
              <span
                style={{
                  ...barFillStyle,
                  background: inkVar,
                  width: `${pct}%`,
                }}
              />
            </span>
            <span style={barMetaStyle}>
              {achievement.progress.current} of {achievement.progress.target}
              {achievement.progress.unit ? ` ${achievement.progress.unit}` : ''}
            </span>
          </>
        )}
      </span>
    </button>
  )
}

/* ─── styles ────────────────────────────────────────────────────────── */

const cardStyle: CSSProperties = {
  // The card is a button, but we want it to read like a card. No
  // min-height — the card hugs its content. Ready cards (no
  // progress bar + meta line) end up shorter; progress cards are
  // naturally taller. Within a subgroup all cards in the same row
  // line up because CSS Grid stretches to the tallest sibling.
  appearance: 'none',
  background: 'var(--color-neutral-50)',
  border: '1.5px dashed transparent', // borderColor set inline per category
  borderRadius: 'var(--radius-md)',
  padding: '12px 14px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '52px 1fr',
  gap: 14,
  alignItems: 'start',
  transition: 'background 150ms ease',
  // Buttons inherit text alignment from `<button>` which interferes
  // with grid alignment in some browsers; force start.
  justifyContent: 'start',
}

const iconTileStyle: CSSProperties = {
  width: 52,
  height: 52,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-sm)',
  borderWidth: 1.5,
  borderStyle: 'solid',
  marginTop: 2,
  flexShrink: 0,
}

const contentStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
}

const titleRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 8,
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  // color set inline per category
}

const titlePercentStyle: CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.1,
  // color set inline per category
}

const descriptionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: 1.4,
  color: 'var(--color-text-secondary)',
}

const rarityLineStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  // text-secondary instead of text-tertiary so it passes WCAG AA
  // (#818181 → 3.79:1 vs white was sub-AA; #4f4f4f → 7.55:1).
  color: 'var(--color-text-secondary)',
}

const barTrackStyle: CSSProperties = {
  display: 'block',
  marginTop: 4,
  height: 5,
  background: 'var(--color-neutral-200)',
  borderRadius: 'var(--radius-pill)',
  overflow: 'hidden',
}

const barFillStyle: CSSProperties = {
  display: 'block',
  height: '100%',
  borderRadius: 'var(--radius-pill)',
  // background + width set inline per category + per progress %.
}

const barMetaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-text-secondary)',
}
