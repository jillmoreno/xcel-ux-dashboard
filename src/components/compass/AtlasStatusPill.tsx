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

export function AtlasStatusPill({ status }: { status: AtlasCourseStatus }) {
  const { label, fill, Icon } = PILLS[status]
  return (
    <span style={{ ...PILL, background: fill }}>
      {/* 1 lower than centred (2026-11-12, Eric). */}
      <Icon aria-hidden style={{ width: 10, height: 10, flex: 'none', position: 'relative', top: 1 }} />
      {label}
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
