import type { CSSProperties } from 'react'
import type { MembershipRenewalState, RenewalPillTone } from './membershipRenewalState'

/**
 * Shared STYLE helpers for a resolved `MembershipRenewalState` — the status-pill
 * chrome and the severity colors.
 *
 * Split from `renewalStatePresentation.tsx` (which holds the glyph component)
 * because a file that exports both components and plain functions breaks fast
 * refresh — the same `shared.tsx` / `sharedUtil.ts` split the v4 membership
 * components use.
 *
 * Extracted at all because THREE surfaces now render the same six states: the
 * `MembershipRenewalCard` in the "Your Memberships" sheet, the
 * `MembershipRowCard` in the Membership + Scorecard hero, and the
 * `ManageMembershipBody` sheet. Each had begun to grow its own copy of the tone
 * tables, which is how a green "Active" pill on one surface ends up a different
 * green on the next.
 *
 * Pill chrome matches Figma 633:3340's Expired pill exactly — `error-100` fill,
 * a 1px `error-700` border, `radius-xl`, 12/16 semibold — and the other two
 * tones reuse it on the success and warning ramps. Contrast: `success-700` on
 * `success-100` and `error-700` on `error-100` both clear AA; amber needs the
 * `warning-800` text step (`-700` on `-100` only reaches 3.9:1).
 */
const PILL_TONES: Record<RenewalPillTone, { bg: string; border: string; fg: string }> = {
  active: {
    bg: 'var(--color-success-100)',
    border: 'var(--color-success-700)',
    fg: 'var(--color-success-700)',
  },
  attn: {
    bg: 'var(--color-warning-100)',
    border: 'var(--color-warning-700)',
    fg: 'var(--color-warning-800)',
  },
  expired: {
    bg: 'var(--color-error-100)',
    border: 'var(--color-error-700)',
    fg: 'var(--color-error-700)',
  },
}

/** Status-pill style for a tone. The pill always names the state in words, so
 *  color is never carrying the meaning on its own. */
export function renewalPillStyle(tone: RenewalPillTone): CSSProperties {
  const t = PILL_TONES[tone]
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: '6px 12px',
    borderRadius: 'var(--radius-xl)',
    background: t.bg,
    border: `1px solid ${t.border}`,
    color: t.fg,
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
  }
}

/** Icon severity tracks the lead's: error red, warning amber, else the
 *  informational accent the Figma spec uses for the row glyph. */
export function renewalIconColor(state: MembershipRenewalState): string {
  if (state.leadTone === 'error') return 'var(--color-error-500)'
  if (state.leadTone === 'warning') return 'var(--color-warning-600)'
  return 'var(--color-cta-500)'
}

/** Lead-line color for the state's severity. No tone ⇒ an empty object, so the
 *  caller's own default (dark on white, light on a tinted plane) still wins. */
export function renewalLeadTone(state: MembershipRenewalState): CSSProperties {
  if (state.leadTone === 'error') return { color: 'var(--color-error-600)' }
  if (state.leadTone === 'warning') return { color: 'var(--color-warning-800)' }
  return {}
}
