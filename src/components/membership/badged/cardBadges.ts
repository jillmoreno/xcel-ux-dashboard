/**
 * Badge model for the "Badged Version" dashboard (Dashboard Discoverability →
 * Dashboard Version → "Badged Version"). Every available/product card on that
 * dashboard carries a membership **tier** badge (Passport / Passport Lite) plus
 * an optional **status** badge (New / Member Exclusive), rendered as a
 * top-corner overlay by `CardBadgeOverlay`.
 *
 * Pure logic + token/label constants only (no JSX) so the card component can
 * import it without a react-refresh boundary. Colors reference brand CSS
 * variables — the active brand's ramp resolves them, so this stays on-brand for
 * any brand (Passport tiers are an Elite concept, but the tones are semantic).
 *
 * TODO(data): the per-card tier + status are derived deterministically from the
 * card id here so the prototype shows a realistic mix without fixture surgery.
 * When the catalog carries real tier / recently-added / member-only fields,
 * swap `deriveCardBadges` for a read of those fields.
 */

export type CardTier = 'lite' | 'passport'
export type CardStatus = 'new' | 'exclusive'

export type CardBadges = {
  tier: CardTier
  status?: CardStatus
}

/** Visual treatment for a tier badge — background / foreground token pairs +
 *  the label. The icon is attached in the component (icons are React
 *  components, kept out of this pure module). */
export const TIER_BADGE: Record<CardTier, { bg: string; fg: string; label: string }> = {
  // Entry tier — primary/navy fill, white text (Bolt glyph).
  lite: { bg: 'var(--color-primary-500)', fg: 'var(--color-neutral-50)', label: 'Passport Lite' },
  // Full tier — gold/warning fill, dark text (Crown glyph).
  passport: { bg: 'var(--color-warning-500)', fg: 'var(--color-primary-900)', label: 'Passport' },
}

/** Visual treatment for a status badge. */
export const STATUS_BADGE: Record<CardStatus, { bg: string; fg: string; label: string }> = {
  // Freshly added — teal/secondary fill, dark text (no glyph).
  new: { bg: 'var(--color-secondary-500)', fg: 'var(--color-primary-900)', label: 'New' },
  // Members-only content — magenta/cta fill, white text (Lock glyph).
  exclusive: { bg: 'var(--color-cta-500)', fg: 'var(--color-neutral-50)', label: 'Member Exclusive' },
}

/** Small stable string hash (djb2) so the derived badges are deterministic
 *  per card id — the same card always shows the same badges across renders. */
function hash(seed: string): number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) h = (h * 33) ^ seed.charCodeAt(i)
  return Math.abs(h)
}

/**
 * Deterministically assign a tier + optional status to a card from its id.
 * ~⅓ of cards read Passport (full tier), the rest Passport Lite; a rotating
 * subset carries a New or Member Exclusive status so the grid shows the full
 * badge vocabulary.
 *
 * @param overrides force a tier and/or status (e.g. the learner's in-progress
 *   Jump Back In card, which should reflect their own tier).
 */
export function deriveCardBadges(seed: string, overrides?: Partial<CardBadges>): CardBadges {
  const h = hash(seed)
  const tier: CardTier = overrides?.tier ?? (h % 3 === 0 ? 'passport' : 'lite')
  let status: CardStatus | undefined = overrides?.status
  if (status === undefined && !('status' in (overrides ?? {}))) {
    const s = h % 4
    if (s === 0) status = 'new'
    else if (s === 1) status = 'exclusive'
  }
  return { tier, status }
}
