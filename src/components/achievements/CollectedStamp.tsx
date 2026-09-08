/**
 * CollectedStamp — the visual unit in the widget's "Stamps Collected"
 * zone.
 *
 * Sits in a fixed-size 150x150 tan card cell with a dashed warm-brown
 * border (matching the legend-cell pattern from the shape-system
 * mockup). Inside the card:
 *
 *   1. The category's `PassportStamp` silhouette at 64px (NOT a
 *      uniform square — the user's direction was to keep the
 *      per-category outline shape visible inside the card).
 *   2. The achievement title in Cutive Mono UPPERCASE (BLACK text).
 *   3. The earned date in Cutive Mono small (BLACK text).
 *
 * Older stamps (earned more than 30 days before the demo's anchored
 * today, 2026-05-20) take an `opacity: 0.78` on the wrapper — the
 * newer-is-louder cue is the only "freshness" signal in the row.
 *
 * Wrapped in a `<Tooltip>` carrying the unlock condition + rarity.
 */

import type { CSSProperties } from 'react'
import { PassportStamp } from '@/components/ui/PassportStamp'
import { Tooltip } from '@/components/ui/Tooltip'
import type { Achievement } from '@/data/achievements'

/** Demo "today" anchor — keeps the faded-stamp cutoff stable across
 *  calendar dates, matched against the rest of the project's anchored
 *  fixtures (Streak Hero etc. are anchored to 2026-05-20 today). */
const DEMO_TODAY = new Date(2026, 4, 20)
const FADED_AFTER_DAYS = 30

type Props = {
  achievement: Achievement
}

export function CollectedStamp({ achievement }: Props) {
  const dateLabel = formatStampDate(achievement.earnedOn)
  const faded = isFaded(achievement.earnedOn)
  return (
    <Tooltip
      content={
        <span>
          <strong style={{ color: 'var(--ink-gilt)' }}>Stamped.</strong>{' '}
          {achievement.unlockCondition}
          {achievement.rarityPct > 0 &&
            ` Held by ${achievement.rarityPct}% of members.`}
        </span>
      }
      placement="top"
    >
      <button
        type="button"
        aria-label={`${achievement.title} — stamped${dateLabel ? ` ${dateLabel}` : ''}`}
        style={{ ...legendCellButtonStyle, opacity: faded ? 0.78 : 1 }}
      >
        <div style={legendCellInnerStyle}>
          <PassportStamp
            achievement={achievement}
            state="earned"
            size={64}
            showLabel={false}
            rotated
          />
          <div style={legendCellNameStyle}>{achievement.title}</div>
          {dateLabel && <div style={legendCellDateStyle}>{dateLabel}</div>}
        </div>
      </button>
    </Tooltip>
  )
}

/* ─── helpers ───────────────────────────────────────────────────────── */

function isFaded(earnedOn: string | undefined): boolean {
  if (!earnedOn) return false
  const parts = earnedOn.split('-').map((s) => parseInt(s, 10))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return false
  const earned = new Date(parts[0], parts[1] - 1, parts[2])
  const msPerDay = 1000 * 60 * 60 * 24
  return (DEMO_TODAY.getTime() - earned.getTime()) / msPerDay > FADED_AFTER_DAYS
}

function formatStampDate(iso: string | undefined): string {
  if (!iso) return ''
  const parts = iso.split('-').map((s) => parseInt(s, 10))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ]
  return `${months[parts[1] - 1]} · ${parts[2]}`
}

/* ─── styles ────────────────────────────────────────────────────────── */

/** Fixed 150×150 card cell — parchment tan background + dashed warm-
 *  brown border. The 150px width/height and `flexShrink: 0` together
 *  guarantee the dimensions don't bend under flexbox or grid parents,
 *  so the strip's "stamp wall" rhythm is preserved at every viewport. */
const legendCellButtonStyle: CSSProperties = {
  appearance: 'none',
  background: 'var(--color-surface-parchment)',
  border: '1px dashed color-mix(in srgb, var(--ink-faded) 50%, transparent)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 10px',
  cursor: 'pointer',
  width: 150,
  height: 150,
  flexShrink: 0,
  boxSizing: 'border-box',
  display: 'block',
  textAlign: 'left',
  transition: 'opacity 150ms ease, border-color 150ms ease',
}

/** Inner stack — centers the stamp + labels both axes inside the
 *  fixed-height wrapper. `height: 100%` is what allows `justifyContent:
 *  'center'` to actually do anything (otherwise the flex container is
 *  only as tall as its content). */
const legendCellInnerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  textAlign: 'center',
  height: '100%',
}

/** Title — black (`--color-text-primary`) Cutive Mono UPPERCASE.
 *  Synth-bold (Cutive Mono ships only weight 400; browsers thicken
 *  the strokes for `700` — at 11px the artificial thickening reads
 *  cleanly and enhances the "freshly stamped" feel). Color is the
 *  project's primary text color rather than the category ink so the
 *  six categories read uniformly when stacked in the grid. */
const legendCellNameStyle: CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-primary)',
  lineHeight: 1.2,
  maxWidth: '100%',
}

const legendCellDateStyle: CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: 'var(--color-text-primary)',
  lineHeight: 1.2,
  marginTop: -2,
}
