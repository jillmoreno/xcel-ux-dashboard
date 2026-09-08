import { useState, type CSSProperties } from 'react'
import { LockSolid } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { membershipBecomeFor, membershipUpgradeFor } from '@/data/membership/membershipUpgradeFixtures'
import { MembershipUpgradeModal } from './MembershipUpgradeModal'

/**
 * Passport upsell band (Figma 323:279) — an unlock icon tile + a two-line
 * pitch (CE podcasts are open to everyone; full Passport unlocks the rest) + a
 * white "Upgrade Membership" pill → `/membership/plans`.
 *
 *   - `bleed` (default) — full-bleeds out of the `SectionShell` 40px gutter and
 *     pulls flush under the What's New section hero.
 *   - `card` — an inset, rounded card (width + `radius-lg` matching the
 *     dashboard Current Learning Path card) for the dashboard overview.
 */
export function WhatsNewUpsellBand({
  variant = 'bleed',
  price,
  ctaLabel,
  onCta,
}: {
  variant?: 'bleed' | 'card'
  /** Override the non-member "Starting at {price} / year". Omit to use the
   *  active brand's entry-tier price (`membershipBecomeFor(brand).price`). */
  price?: string
  /** Override the CTA label (default: Explore / Upgrade Membership). */
  ctaLabel?: string
  /** Override the CTA action (default: open the tier-appropriate upsell modal). */
  onCta?: () => void
} = {}) {
  const { access, brand } = useAccount()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  // Nothing to upsell once the learner is already on the highest tier
  // (`access === 'full'`) — hide the band entirely. Lite members + non-members
  // still see it (upgrade / join).
  if (access === 'full') return null
  // Brand-aware pricing so the band matches the upsell modal it opens:
  // non-members join at the entry tier's price (Plus $99 for CRE, Passport Lite
  // $48 for Elite, …); lite members upgrade at the full tier's price. A `price`
  // prop still overrides the non-member entry price.
  const entryPrice = price ?? membershipBecomeFor(brand).price
  const upgradePrice = membershipUpgradeFor(brand).price
  const title =
    access === 'non-member'
      ? `Unlock Membership Benefits. Starting at ${entryPrice} / year`
      : `Unlock Full Membership Benefits. ${upgradePrice} / year`
  return (
    <>
      <div style={variant === 'card' ? upsellBandCardStyle : upsellBandStyle}>
        <span aria-hidden style={upsellIconTileStyle}>
          <LockSolid size={30} />
        </span>
        <div style={upsellCopyStyle}>
          <p style={upsellTitleStyle}>{title}</p>
          <p style={upsellSubStyle}>
            Meet all your CE requirements and unlock exclusive content, career tools, and
            exam/certification prep.
          </p>
        </div>
        <button
          type="button"
          // Default: open the tier-appropriate upsell modal — the upgrade offer
          // for members (the band only shows below the top tier), the
          // "Become a Member" offer for non-members. A caller may override the
          // action via `onCta` (e.g. the membership page scrolls to its plans).
          onClick={onCta ?? (() => setUpgradeOpen(true))}
          style={upsellCtaStyle}
        >
          {/* Non-members explore; members (below the top tier) upgrade. */}
          {ctaLabel ?? (access === 'non-member' ? 'Explore Membership' : 'Upgrade Membership')}
        </button>
      </div>
      <MembershipUpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
}

const UPSELL_BASE: CSSProperties = {
  background: 'var(--color-cta-700)',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 18,
}

// Full-bleed: cancels SectionShell's 40px gutter so it bleeds edge-to-edge, and
// the negative top margin pulls it flush against the section hero above it.
const upsellBandStyle: CSSProperties = {
  ...UPSELL_BASE,
  margin: '-24px -40px 0',
  // Taller than the inset `card` variant — the full-bleed band reads as a
  // substantial section divider (member upgrade split on the CRE membership page).
  padding: '28px 40px',
}

// Card: inset, rounded to match the dashboard Current Learning Path card.
const upsellBandCardStyle: CSSProperties = {
  ...UPSELL_BASE,
  padding: '16px 24px',
  borderRadius: 'var(--radius-lg)',
}

// Subtle, opacity-driven lock — no chip. The glyph sits directly on the plum
// band at ~55% white so it reads as a soft affordance rather than a hard tile.
const upsellIconTileStyle: CSSProperties = {
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  color: 'rgb(255 255 255 / 0.55)',
}

const upsellCopyStyle: CSSProperties = {
  flex: 1,
  minWidth: 240,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const upsellTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1.3,
  color: 'var(--color-text-inverse)',
}

const upsellSubStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.4,
  color: 'var(--color-cta-100)',
}

// Outline treatment: transparent fill + a white hairline border on the dark
// cta band, so the pill reads as a secondary CTA rather than a filled button.
const upsellCtaStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 22px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--color-text-inverse)',
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 800,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}
