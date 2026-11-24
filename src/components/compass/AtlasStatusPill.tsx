import type { CSSProperties } from 'react'
import {
  AlarmExclamationRegular,
  CircleCheckRegular,
  CircleXRegular,
  ClockRegular,
  GaugeRegular,
  PlayPauseRegular,
} from '@/icons'

/**
 * THE ATLAS COURSE STATUS PILLS — Figma 710:2531 · 2535 · 2539 · 2543 · 2547 · 2551 (2026-11-12, Eric: "create status pills
 * to use in the course cards for the various possible statuses").
 *
 * One shape for all six: 14 corners, 4 × 12, a 10 Font Awesome Regular icon 4 before a Bold 10 / 13 label, both Neutral 800.
 * Only the fill and the icon change — Due Soon on Warning 300 with the clock, Expired and Failed on Error 100 (the alarm,
 * the circle-x), Not Started on Neutral 200 (play-pause), In Progress on Info 200 (gauge), Completed on Success 200
 * (circle-check).
 */
export type AtlasCourseStatus = 'due-soon' | 'expired' | 'failed' | 'not-started' | 'in-progress' | 'completed'

type Icon = typeof ClockRegular

const PILLS: Record<AtlasCourseStatus, { label: string; fill: string; Icon: Icon }> = {
  'due-soon': { label: 'Due Soon', fill: 'var(--color-warning-300)', Icon: ClockRegular },
  expired: { label: 'Expired', fill: 'var(--color-error-100)', Icon: AlarmExclamationRegular },
  failed: { label: 'Failed', fill: 'var(--color-error-100)', Icon: CircleXRegular },
  'not-started': { label: 'Not Started', fill: 'var(--color-neutral-200)', Icon: PlayPauseRegular },
  'in-progress': { label: 'In Progress', fill: 'var(--color-info-200)', Icon: GaugeRegular },
  completed: { label: 'Completed', fill: 'var(--color-success-200)', Icon: CircleCheckRegular },
}

/** A status's strong colour — the 400 of its Nectar functional ramp (Neutral 400 for Not Started), for the card's progress
 *  fill; the pill keeps its paler fill (2026-11-12, Eric). */
const STRONG: Record<AtlasCourseStatus, string> = {
  'due-soon': 'var(--color-warning-400)',
  expired: 'var(--color-error-400)',
  failed: 'var(--color-error-400)',
  'not-started': 'var(--color-neutral-400)',
  'in-progress': 'var(--color-info-400)',
  completed: 'var(--color-success-400)',
}
export const statusStrongFill = (status: AtlasCourseStatus) => STRONG[status]

export function AtlasStatusPill({
  status,
  fill: fillOverride,
  ink,
  label: labelOverride,
  iconNudge = 1,
  fontSize = 10,
}: {
  status: AtlasCourseStatus
  /** A different fill for this one pill (2026-11-23, Jillienne: the PRD card's Expired pill in charcoal). ADDITIVE — a
   *  caller that passes nothing gets the catalog above, unchanged, so the 2026-11-18 card is not touched by it. */
  fill?: string
  /** The label and icon colour to go with it; Neutral 800 when absent. */
  ink?: string
  /** A different label for this one pill (2026-11-23, Jillienne: the PRD card's Due Soon reads "Access Ends N days").
   *  Additive like `fill` — absent, the catalog's label. */
  label?: string
  /** How far the icon sits below centre — 1 as drawn (2026-11-12, Eric); the PRD card passes 0 (2026-11-24, Jillienne:
   *  "these 2 things should be centered vertically"). Additive: absent, the 1. */
  iconNudge?: number
  /** The label's size — 10 as drawn; the PRD card passes 11, the body's floor (2026-11-24, the type audit). The pill grows
   *  with it: the line is size + 3, the icon size. Additive: absent, the 10. */
  fontSize?: number
}) {
  const { label: catalogLabel, fill, Icon } = PILLS[status]
  const label = labelOverride ?? catalogLabel
  return (
    <span style={{ ...PILL, fontSize, lineHeight: `${fontSize + 3}px`, background: fillOverride ?? fill, ...(ink ? { color: ink } : null) }}>
      {/* 1 lower than centred (2026-11-12, Eric) — unless the caller says otherwise. */}
      <Icon aria-hidden style={{ width: fontSize, height: fontSize, flex: 'none', position: 'relative', top: iconNudge }} />
      <span style={{ lineHeight: `${fontSize}px` }}>{label}</span>
    </span>
  )
}

const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  paddingTop: 4,
  paddingBottom: 4,
  paddingLeft: 12,
  paddingRight: 12,
  borderRadius: 14,
  color: 'var(--color-neutral-800)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 10,
  lineHeight: '13px',
  whiteSpace: 'nowrap',
}
