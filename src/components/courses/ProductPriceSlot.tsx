import { useState, type CSSProperties } from 'react'
import { Lock } from '@/icons'
import { supportsMembership, useAccount, type MembershipTierTone } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import type { CommerceState } from '@/data/commerce/entitlement'
import { MembershipUpgradeModal } from '@/components/membership/MembershipUpgradeModal'

/**
 * The price/entitlement slot shared by the catalog card and the detail sheet,
 * rendered from the resolved `CommerceState`.
 *
 * Two layouts:
 *  - **inline** (default — catalog cards): compact. `included` → nothing (the
 *    entitlement is shown in the detail panel, not on the card); `priced` → the
 *    one-time price; `locked` → a "Member Exclusive" chip.
 *  - **panel** (`panel` — the Purchase Course sheet, "Direction 1"): benefit-
 *    framed, never a `$0.00` lead. `included` (member already entitled) → the
 *    "Included · {tier} Membership" chip ALONE by default; with the
 *    `pricing-entitled-savings` flag ON it adds the original price struck through
 *    beside the chip as a savings anchor. `priced` → the real à-la-carte price
 *    lead + an "Included with membership" pill (non-member) / "Included · {tier}
 *    Membership · View Plans" pill (member below the required tier).
 *
 * `fontSize` sizes the inline layout (12 on cards). `listPrice` (the product's
 * one-time price) is used by the panel `included` state as the strikethrough
 * savings anchor when `pricing-entitled-savings` is ON — the `included`
 * `CommerceState` carries no price of its own.
 */
export function ProductPriceSlot({
  state,
  fontSize = 12,
  style,
  panel = false,
  listPrice,
  currency = 'USD',
}: {
  state: CommerceState
  fontSize?: number
  style?: CSSProperties
  /** Direction-1 panel layout (the Purchase Course sheet). */
  panel?: boolean
  /** The product's one-time price — needed for the panel `included` strikethrough
   *  anchor (the `included` state itself carries no price). */
  listPrice?: number
  /** Currency for `Intl.NumberFormat` in the panel layout. */
  currency?: string
}) {
  if (panel) {
    return <PanelPriceSlot state={state} listPrice={listPrice} currency={currency} style={style} />
  }

  // Included items show no card-level tag anymore — the entitlement is surfaced
  // in the detail panel instead.
  if (state.kind === 'included') {
    return null
  }

  if (state.kind === 'locked') {
    return (
      <span style={{ ...lockChipStyle, fontSize, ...style }}>
        <Lock size={fontSize} aria-hidden />
        Member Exclusive
      </span>
    )
  }

  // priced — the card shows just the one-time price. The membership savings
  // tag ("$0 with membership") was removed from cards; that treatment lives in
  // the detail panel instead.
  return (
    <span style={{ fontFamily: 'var(--font-body)', fontSize, fontWeight: 600, ...style }}>
      ${state.price.toFixed(2)}
    </span>
  )
}

/* ─── Panel layout (Direction 1 — the Purchase Course sheet) ──────────────── */

function PanelPriceSlot({
  state,
  listPrice,
  currency,
  style,
}: {
  state: CommerceState
  listPrice?: number
  currency: string
  style?: CSSProperties
}) {
  const [plansOpen, setPlansOpen] = useState(false)
  const { brand, tierLabel, tierTone } = useAccount()
  const hasMembership = supportsMembership(brand)
  // Stakeholder toggle: when a member is already entitled, ON adds the original
  // price struck through beside the "Included" chip; OFF (default) shows the
  // chip alone. Never a "$0.00" lead in either state.
  const showSavings = useFeatureFlag('pricing-entitled-savings').enabled
  const money = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  // "Included │ Passport Lite Membership" — names the learner's actual tier
  // after a divider. STC's generic "Member" tier collapses to just "Membership".
  const tierPhrase =
    tierLabel && tierLabel !== 'Member' ? `${tierLabel} Membership` : 'Membership'

  if (state.kind === 'locked') {
    return (
      <div style={{ ...panelWrap, ...style }}>
        <span style={{ ...lockChipStyle, fontSize: 13 }}>
          <Lock size={13} aria-hidden />
          Member Exclusive
        </span>
      </div>
    )
  }

  if (state.kind === 'included') {
    // The chip names the learner's current membership, so it adopts that tier's
    // color + glyph (e.g. gold + Crown for Passport). No "$0.00" lead — the chip
    // itself frames the benefit ("Included · {tier} Membership").
    const TierIcon = tierBadgeIcon(tierTone)
    const chip = (
      <span style={toneChipStyle(tierTone)}>
        <TierIcon size={11} aria-hidden />
        Included
        <span aria-hidden style={chipDividerStyle} />
        {tierPhrase}
      </span>
    )
    // ON: pair the chip with the original price struck through as a savings
    // anchor (only when there's a real price to strike). The `<s>` + hidden
    // "was " read "was $99.99, Included · {tier} Membership" to a screen reader.
    const showAnchor = showSavings && listPrice != null && listPrice > 0
    return (
      <div style={{ ...panelWrap, ...style }}>
        {showAnchor ? (
          <div style={panelPriceRow}>
            <s style={panelStrikeStyle}>
              <span className="cre-visually-hidden">was </span>
              {money(listPrice!)}
            </s>
            {chip}
          </div>
        ) : (
          chip
        )}
      </div>
    )
  }

  // priced — non-member (teaser) or a member for whom this course requires a
  // higher tier (upgrade). The upgrade chip names that tier + adopts its color
  // and glyph ("$0 │ Passport Membership"); the non-member chip stays generic.
  const upgrade = state.isMember
  const UnlockIcon = tierBadgeIcon(state.unlockTierTone)
  // A brand with no consumer membership shows the price and nothing else. The
  // `priced` state ALWAYS draws a membership pill below, which is the correct
  // teaser for a brand that sells one and an offer of a product that does not
  // exist for a brand that does not. `resolveCommerceState` already forces
  // `priced` for such a brand; this suppresses the pill it would still draw.
  if (!hasMembership) {
    return (
      <div style={{ ...panelWrap, ...style }}>
        <span style={panelPriceLead}>{money(state.price)}</span>
      </div>
    )
  }
  // "View Plans" lives inside the pill in both cases (Figma "Badge | Small",
  // node 266:614).
  const viewPlansBtn = (
    <button
      type="button"
      className="cre-link-action"
      aria-label="View membership plans"
      onClick={() => setPlansOpen(true)}
      style={viewPlansInlineStyle}
    >
      View Plans
    </button>
  )
  // The bare numeric lead needs context so it doesn't read as a flat price — the
  // aria-label states the à-la-carte-or-included relationship the pill spells out
  // visually.
  const leadAria = upgrade
    ? `${money(state.price)} to purchase, or included with your ${state.unlockTierLabel} Membership`
    : `${money(state.price)} to purchase, or included with membership`
  return (
    <div style={{ ...panelWrap, ...style }}>
      <span style={panelPriceLead} aria-label={leadAria}>
        {money(state.price)}
      </span>
      {upgrade ? (
        // Member below the required tier: one merged pill in that tier's color —
        // "[glyph] Included with {tier} Membership │ View Plans" (no divider
        // between "Included" and the tier — it reads as one phrase, matching the
        // non-member pill's "Included with membership").
        <span style={{ ...mergedPillBase, ...toneBadgeColors(state.unlockTierTone) }}>
          <UnlockIcon size={11} aria-hidden />
          Included with {state.unlockTierLabel} Membership
          <span aria-hidden style={mergedDividerStyle} />
          {viewPlansBtn}
        </span>
      ) : (
        // Non-member: one teal pill — "Included with membership │ View Plans".
        <span style={nonMemberBadgeStyle}>
          Included with membership
          <span aria-hidden style={mergedDividerStyle} />
          {viewPlansBtn}
        </span>
      )}
      <MembershipUpgradeModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        initialView="compare"
      />
    </div>
  )
}

// Tone → chip fill/text for the tier-colored chips (the "Included │ {tier}
// Membership" chip adopts the learner's current tier; the member-upgrade chip
// adopts the unlock tier). Border is derived from the text color via color-mix
// so it works for every tone without depending on per-tone `-200` tokens.
const TONE_CHIP: Record<MembershipTierTone, { bg: string; fg: string }> = {
  primary: { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-700)' },
  tertiary: { bg: 'var(--color-tertiary-100)', fg: 'var(--color-tertiary-700)' },
  warning: { bg: 'var(--color-warning-100)', fg: 'var(--color-warning-700)' },
  neutral: { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-700)' },
}

// Tone → fill/text/derived-border, shared by the tier-colored chips (the
// "Included" chip and the merged upgrade pill).
function toneBadgeColors(tone: MembershipTierTone): CSSProperties {
  const c = TONE_CHIP[tone]
  return {
    background: c.bg,
    color: c.fg,
    border: `1px solid color-mix(in srgb, ${c.fg} 25%, transparent)`,
  }
}

// The base member chip re-tinted to a tier tone (used by the "Included" chip).
function toneChipStyle(tone: MembershipTierTone): CSSProperties {
  return { ...memberChipStyle, ...toneBadgeColors(tone) }
}

// Stable min-height so the card doesn't jump when the member/price state flips.
const panelWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 11,
  minHeight: 60,
}

const panelPriceRow: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
}

const panelPriceLead: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}

// The former (à-la-carte) price shown as a savings anchor beside the "Included"
// chip when `pricing-entitled-savings` is ON. `<s>` carries the semantic
// "former"; the visually-hidden "was" disambiguates for a screen reader.
const panelStrikeStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 400,
  color: 'var(--color-text-secondary)',
  textDecoration: 'line-through',
}

const memberChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  alignSelf: 'flex-start',
  padding: '5px 11px',
  borderRadius: 999,
  background: 'var(--color-secondary-100)',
  color: 'var(--color-secondary-700)',
  border: '1px solid var(--color-secondary-200)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

// Light vertical divider between "Included" and the tier name — inherits the
// chip's teal text color at low opacity so it reads as a subtle rule.
const chipDividerStyle: CSSProperties = {
  flexShrink: 0,
  width: 1,
  height: 11,
  background: 'color-mix(in srgb, currentColor 35%, transparent)',
}

// Merged "$0 … │ … │ View Plans" pill (Figma "Badge | Small", node 266:614).
// The base carries only geometry; colors are applied per case — the non-member pill
// uses the teal palette below, the member-upgrade pill spreads `toneBadgeColors`
// for the unlock tier's color.
const mergedPillBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  alignSelf: 'flex-start',
  padding: '8px 12px',
  borderRadius: 16,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '16px',
  whiteSpace: 'nowrap',
}

// Non-member pill — the prior teal palette (secondary-100 / -700 / -200).
const nonMemberBadgeStyle: CSSProperties = {
  ...mergedPillBase,
  background: 'var(--color-secondary-100)',
  color: 'var(--color-secondary-700)',
  border: '1px solid var(--color-secondary-200)',
}

// Divider inside a merged pill — inherits the pill's text color at low opacity,
// so it reads teal in the non-member pill and gold/navy in the tier-colored one.
const mergedDividerStyle: CSSProperties = {
  flexShrink: 0,
  width: 1,
  height: 15,
  background: 'color-mix(in srgb, currentColor 35%, transparent)',
}

// "View Plans" inside the non-member pill — magenta (cta) action, no button chrome.
const viewPlansInlineStyle: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '20px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const lockChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  alignSelf: 'flex-start',
  padding: '3px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-cta-100)',
  color: 'var(--color-cta-700)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
}
