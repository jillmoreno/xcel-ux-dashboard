import type { ComponentType } from 'react'
import { Gem } from '@/icons'

export type MembershipTier = 'pro'

/** Color ramp for the pill. Per the Figma "Colors for Membership Tiers" spec,
 *  each membership tier maps to a tone:
 *   - `neutral`   → Non-Member (neutral-75 / neutral-600)
 *   - `primary`   → low tier (Plus / Passport Lite)
 *   - `tertiary`  → mid tier (Pro)  ·  also the legacy gold "Pro" pill
 *   - `warning`   → high tier (Premier / Passport) — gold
 *   - `secondary` → the legacy Elite teal treatment (kept for callers still on it)
 */
type MembershipBadgeTone = 'tertiary' | 'secondary' | 'primary' | 'warning' | 'neutral'

type IconComponent = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

type Props = {
  tier?: MembershipTier
  /** Override the default label (e.g. "Pro Membership" instead of "Pro"). */
  label?: string
  tone?: MembershipBadgeTone
  /** Leading glyph. Defaults to the gold Gem (legacy). Tier-driven callers pass
   *  the tier badge glyph (Mountain / Bolt / Crown). */
  icon?: IconComponent
}

const TIER_CONFIG: Record<MembershipTier, { label: string }> = {
  pro: { label: 'Pro' },
}

/** `{bg, fg}` token steps per tone (neutral -75/-600, the rest -100/-700).
 *  Warning (high-tier gold) uses -200/-800: the spec's -200/-700 only reached
 *  3.72:1 (fails WCAG AA); -800 on -200 clears it at ~6.8:1. */
const TONE_STEPS: Record<MembershipBadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--color-neutral-75)', fg: 'var(--color-neutral-600)' },
  primary: { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-700)' },
  tertiary: { bg: 'var(--color-tertiary-100)', fg: 'var(--color-tertiary-700)' },
  secondary: { bg: 'var(--color-secondary-100)', fg: 'var(--color-secondary-700)' },
  warning: { bg: 'var(--color-warning-200)', fg: 'var(--color-warning-800)' },
}

/**
 * Membership tier pill — matches Figma node 1641:9733. A `{tone}` surface + fg
 * + 8px radius + a leading glyph. Defaults to the tertiary (gold) ramp with the
 * Gem glyph; tier-driven callers pass a `tone` + `icon` per the tier spec.
 */
export function MembershipBadge({ tier = 'pro', label, tone = 'tertiary', icon }: Props) {
  const displayLabel = label ?? TIER_CONFIG[tier].label
  const { bg, fg } = TONE_STEPS[tone]
  const Icon = icon ?? Gem
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 28,
        padding: '0 8px',
        borderRadius: 'var(--radius-md)',
        background: bg,
        color: fg,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: '20px',
      }}
    >
      <Icon size={14} aria-hidden />
      {displayLabel}
    </span>
  )
}
