import type { ComponentType, CSSProperties } from 'react'
import { CircleCheck, Clock, Lock, TriangleExclamation } from '@/icons'
import { CoverPill } from './CoverPill'
import { statusBadgeLabel, type CourseStatusBadgeState } from './courseStatusBadgeUtil'

/**
 * The cover status badge — the top-left pill on an owned course card, carrying
 * whichever of the four lifecycle/time states applies.
 *
 * Spec §4a, decision 31: expiry uses THIS existing badge family, not a new
 * full-width band. It shares its chrome with `EnrolledBadge` via `CoverPill`,
 * so the two overlays can never drift.
 *
 * NOT INTERACTIVE — a `<span>`, no click, no focus. It is a marker.
 *
 * Resolution + copy live in `courseStatusBadgeUtil.ts` (fast-refresh split).
 */
type Tone = { Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>; bg: string; fg: string }

const TONES: Record<CourseStatusBadgeState, Tone> = {
  completed: {
    Icon: CircleCheck,
    bg: 'var(--color-success-100)',
    fg: 'var(--color-success-700)',
  },
  'expiring-soon': {
    Icon: Clock,
    bg: 'var(--color-warning-100)',
    // -800, not -700: warning ramps run light, and this sits on a 100 fill.
    fg: 'var(--color-warning-800)',
  },
  expired: {
    Icon: Lock,
    bg: 'var(--color-neutral-100)',
    // Deliberately NEUTRAL, not error. Expired is recoverable (ruling 3) — an
    // error tone would read as something having gone wrong rather than a clock
    // having run out.
    fg: 'var(--color-text-secondary)',
  },
  failed: {
    Icon: TriangleExclamation,
    bg: 'var(--color-error-100)',
    fg: 'var(--color-error-700)',
  },
}

export function CourseStatusBadge({
  state,
  daysLeft,
  placement = 'overlay',
  style,
}: {
  state: CourseStatusBadgeState
  /** Whole days remaining — required by `expiring-soon`, ignored otherwise. */
  daysLeft?: number
  placement?: 'overlay' | 'inline'
  style?: CSSProperties
}) {
  const tone = TONES[state]
  return (
    <CoverPill Icon={tone.Icon} bg={tone.bg} fg={tone.fg} placement={placement} style={style}>
      {statusBadgeLabel(state, daysLeft)}
    </CoverPill>
  )
}
