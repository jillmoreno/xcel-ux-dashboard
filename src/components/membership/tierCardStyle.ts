import type { ComponentType } from 'react'
import { Crown, Gem } from '@/icons'

/**
 * Shared tier treatment for the Membership Hub passport cards (the hero front
 * card + the "Your Memberships" sheet cards): the gradient background and the
 * badge/watermark glyph, keyed by the tier's color tone. Kept in a plain `.ts`
 * module so both the page component and the sheet can import it without a
 * circular dependency.
 *
 * Each ramp's -700 → -900 stays dark enough for the card's white text.
 */
export const TIER_CARD_BG: Record<string, string> = {
  primary: 'linear-gradient(162deg, var(--color-primary-700), var(--color-primary-900))',
  secondary: 'linear-gradient(162deg, var(--color-secondary-700), var(--color-secondary-900))',
  tertiary: 'linear-gradient(162deg, var(--color-tertiary-700), var(--color-tertiary-900))',
  warning: 'linear-gradient(162deg, var(--color-warning-700), var(--color-warning-900))',
}

/** Resolve a tier tone to its gradient (falls back to primary/navy). */
export function tierCardBg(tone: string): string {
  return TIER_CARD_BG[tone] ?? TIER_CARD_BG.primary
}

/** Badge + watermark glyph for a tier tone: warning (Passport / Premier) →
 *  Crown; everything else → Gem. Accepts the `MembershipRecord.tone` union
 *  (which includes `secondary`, unlike `MembershipTierTone`). */
export function tierCardGlyph(
  tone: string,
): ComponentType<{ size?: number; 'aria-hidden'?: boolean }> {
  return tone === 'warning' ? Crown : Gem
}

/** Solid accent color for a tier tone — used as the left stroke on the simple
 *  white "Your Memberships" sheet cards. */
export function tierAccentColor(tone: string): string {
  switch (tone) {
    case 'warning':
      return 'var(--color-warning-500)'
    case 'secondary':
      return 'var(--color-secondary-500)'
    case 'tertiary':
      return 'var(--color-tertiary-500)'
    default:
      return 'var(--color-primary-500)'
  }
}

/** Soft tinted surface for a tier tone — the Manage sheet's plan band and its
 *  renewal icon plate. `pct` is how much of the ramp shows over the card
 *  surface. Built on `tierAccentColor` rather than a second ramp table, so a
 *  new tier tone only has to be added in one place. */
export function tierTintBg(tone: string, pct: number): string {
  return `color-mix(in srgb, ${tierAccentColor(tone)} ${pct}%, var(--color-surface-card))`
}

/** Readable text / glyph colour on a `tierTintBg` surface. The -700 stop of the
 *  same ramp: dark enough to clear AA on a tint that pale, and it keeps the
 *  element on the tier's own hue rather than falling back to a neutral. */
export function tierTintFg(tone: string): string {
  switch (tone) {
    case 'warning':
      return 'var(--color-warning-700)'
    case 'secondary':
      return 'var(--color-secondary-700)'
    case 'tertiary':
      return 'var(--color-tertiary-700)'
    default:
      return 'var(--color-primary-700)'
  }
}
