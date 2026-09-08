import { useEffect, useState, type CSSProperties } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ArrowLeft, CircleCheck, Clock, ShoppingCart } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import {
  membershipBecomeFor,
  membershipCompareFor,
  membershipUpgradeFor,
  type MembershipComparePlan,
  type MembershipComparison,
} from '@/data/membership/membershipUpgradeFixtures'

/**
 * "Upgrade Membership" modal — opened from the `WhatsNewUpsellBand` CTA. Shows
 * the Lite→full upgrade offer: title + price, an intro + benefit bullets, an
 * "Added to Cart" plan card (Compare Plans / View Cart), and a marketing image.
 * Brand-aware via `membershipUpgradeFor(brand)`. Cart actions are demo stubs
 * (console) — the real purchase flow is a follow-up.
 */
export function MembershipUpgradeModal({
  open,
  onClose,
  initialView = 'upgrade',
  comparison: comparisonOverride,
}: {
  open: boolean
  onClose: () => void
  /** Which step to open on. `'compare'` jumps straight to the Compare Plans
   *  grid (used by the price slot's "View Plans" link) — there's no offer step
   *  to return to, so the Back link is suppressed. */
  initialView?: 'upgrade' | 'compare'
  /** Supply the ladder instead of reading the brand default. The Manage
   *  Membership sheet's "Change plan" row passes a TIER-RANKED one
   *  (`membershipChangePlanFor`), so a member sees their own plan marked
   *  current and the rest ranked around it — including the lower tiers a
   *  top-tier member can step down to, which the brand default never shows. */
  comparison?: MembershipComparison
}) {
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  // Members see the Lite→full upgrade offer; non-members see the "Become a
  // Member" join offer (entry tier, purchase framing).
  const upgrade = membershipUpgradeFor(brand)
  const become = membershipBecomeFor(brand)
  const data = isMember ? upgrade : become
  const comparison = comparisonOverride ?? membershipCompareFor(brand, isMember)
  // Two steps in one modal: the upgrade offer and the "Compare Plans" view.
  const [view, setView] = useState<'upgrade' | 'compare'>(initialView)
  // Reset to the entry step whenever the modal reopens.
  useEffect(() => {
    if (open) setView(initialView)
  }, [open, initialView])

  if (view === 'compare') {
    const count = comparison.plans.length
    // Back only when there's an offer step behind us (not when opened straight
    // to Compare Plans).
    const showBack = initialView !== 'compare'
    return (
      <Modal open={open} onClose={onClose} title={comparison.title} width={count >= 3 ? 1120 : 860} hideChrome>
        <div style={{ position: 'relative', padding: '28px 32px 36px' }}>
          {showBack && (
            <button type="button" onClick={() => setView('upgrade')} style={backStyle}>
              <ArrowLeft size={16} aria-hidden /> Back
            </button>
          )}
          <button type="button" aria-label="Close" onClick={onClose} style={closeStyle}>
            ×
          </button>
          <h2 style={titleStyle}>{comparison.title}</h2>
          <div
            style={{ ...compareGridStyle, gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
          >
            {comparison.plans.map((plan) => (
              <ComparePlanCard key={plan.name} plan={plan} brand={brand} />
            ))}
          </div>
        </div>
      </Modal>
    )
  }

  const heading = isMember
    ? `Upgrade to ${upgrade.planName} for ${upgrade.price}`
    : `Become a ${become.tierName} Member Today for ${become.price}`

  return (
    <Modal open={open} onClose={onClose} title={heading} width={920} hideChrome>
      <div style={{ position: 'relative', padding: '28px 32px 32px' }}>
        <button type="button" aria-label="Close" onClick={onClose} style={closeStyle}>
          ×
        </button>
        <h2 style={titleStyle}>{heading}</h2>
        <div style={bodyStyle}>
          {/* Left — copy + bullets + cart card */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={paraStyle}>{data.intro}</p>
            <p style={{ ...paraStyle, margin: 0 }}>{data.benefitsLead}</p>
            <ul style={listStyle}>
              {data.bullets.map((b) => (
                <li key={b.lead} style={bulletStyle}>
                  <strong>{b.lead}</strong>
                  {b.rest}
                </li>
              ))}
            </ul>
            {/* Cart card */}
            <div style={cartCardStyle}>
              <span style={isMember ? addedChipStyle : limitedOfferChipStyle}>
                {isMember ? (
                  <>
                    <ShoppingCart size={13} aria-hidden /> Added to Cart
                  </>
                ) : (
                  <>
                    <Clock size={13} aria-hidden /> Limited Time Offer
                  </>
                )}
              </span>
              <div style={cartRowStyle}>
                <span style={cartPlanStyle}>{data.planName}</span>
                {isMember ? (
                  <span style={cartPriceStyle}>{upgrade.price}</span>
                ) : (
                  <span style={cartListPriceStyle}>{become.listPrice}</span>
                )}
              </div>
              {!isMember && (
                <div style={cartRowStyle}>
                  <span style={cartPayTodayStyle}>You Pay Today</span>
                  <span style={{ ...cartPriceStyle, color: 'var(--color-secondary-700)' }}>
                    {become.price}
                  </span>
                </div>
              )}
              <div style={cartActionsStyle}>
                <button type="button" onClick={() => setView('compare')} style={outlineBtnStyle}>
                  Compare Plans
                </button>
                <button
                  type="button"
                  onClick={() => console.info('upgrade-modal:cart', brand, isMember ? 'view' : 'add')}
                  style={filledBtnStyle}
                >
                  {isMember ? 'View Cart' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
          {/* Right — marketing image in a dashed frame */}
          <div aria-hidden style={imageFrameStyle}>
            <div style={{ ...imageStyle, backgroundImage: `url(${data.image})` }} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

/** One plan card in the Compare Plans step — recommended card carries the badge
 *  + a highlighted border + Add To Cart; the current plan shows a "Current
 *  Membership" chip and a muted surface. Exported so the standalone Membership
 *  page's non-member comparison can render the SAME cards (real-estate brands). */
export function ComparePlanCard({ plan, brand }: { plan: MembershipComparePlan; brand: string }) {
  // Recommended → white + highlighted border; current membership → muted gray;
  // every other option → plain white card with a subtle border.
  const cardStyle = plan.recommended ? recCardStyle : plan.current ? currentCardStyle : plainCardStyle
  return (
    <div style={cardStyle}>
      {plan.recommended && (
        <span style={recBadgeStyle}>
          <CircleCheck size={14} aria-hidden /> Recommended
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={planNameStyle}>{plan.name}</span>
        <span style={planProfStyle}>{plan.profession}</span>
        <span style={planPriceRowStyle}>
          <strong style={planPriceStyle}>{plan.price}</strong> / {plan.period}
        </span>
      </div>
      {plan.current ? (
        <span style={currentChipStyle}>
          <CircleCheck size={14} aria-hidden /> {plan.ctaLabel}
        </span>
      ) : (
        // A downgrade gets the outline treatment, not the filled one: it should
        // be reachable without being sold, and a filled CTA beside the
        // recommended card would read as a second offer.
        <button
          type="button"
          onClick={() =>
            console.info(
              plan.downgrade ? 'upgrade-modal:switch-plan' : 'upgrade-modal:add-to-cart',
              brand,
              plan.name,
            )
          }
          style={plan.downgrade ? switchPlanStyle : addToCartStyle}
        >
          {plan.ctaLabel}
        </button>
      )}
      {/* When the change lands, and what stays reachable until then. The only
          promise this card makes — do not shorten it to "soon". The rule below
          separates it from the bullets: those describe what the PLAN includes,
          this describes what SWITCHING does, and without a break the two read
          as one list. */}
      {plan.note && (
        <>
          <p style={planNoteStyle}>
            <span style={planNoteLeadStyle}>{plan.note.lead}</span>
            {plan.note.detail}
          </p>
          <div aria-hidden style={planNoteRuleStyle} />
        </>
      )}
      <ul style={compareBulletsStyle}>
        {plan.bullets.map((b) => (
          <li key={b} style={compareBulletStyle}>
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const closeStyle: CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 16,
  width: 32,
  height: 32,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
}

const titleStyle: CSSProperties = {
  margin: '0 0 24px',
  textAlign: 'center',
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 24,
  lineHeight: 1.2,
  color: 'var(--color-text-primary)',
}

const bodyStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.85fr)',
  gap: 32,
  alignItems: 'start',
}

const paraStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.55,
  color: 'var(--color-text-primary)',
}

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.5,
  color: 'var(--color-text-primary)',
}

const bulletStyle: CSSProperties = { paddingLeft: 4 }

const cartCardStyle: CSSProperties = {
  position: 'relative',
  // Room for the offer badge, which straddles the top border (its opaque fill
  // cleanly interrupts the border line rather than letting it show through).
  marginTop: 26,
  padding: '22px 20px 20px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-action)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const addedChipStyle: CSSProperties = {
  position: 'absolute',
  top: -20,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 14px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-tertiary-200)',
  color: 'var(--color-tertiary-800)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

// "Limited Time Offer" chip — matches the "At Risk" status badge (warning tone).
// Mixed against the card surface (not `transparent`) so the fill is opaque and
// cleanly breaks the card's top border it straddles, instead of the line
// showing through it.
const limitedOfferChipStyle: CSSProperties = {
  ...addedChipStyle,
  background: 'color-mix(in srgb, var(--color-warning-500) 22%, var(--color-surface-card))',
  color: 'var(--color-warning-700)',
}

const cartRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
}

const cartPlanStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const cartPriceStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

// Struck-through list price (the "Become a Member" cart's pre-discount price).
const cartListPriceStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textDecoration: 'line-through',
}

const cartPayTodayStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-secondary-700)',
}

const cartActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
}

const outlineBtnStyle: CSSProperties = {
  flex: 1,
  padding: '11px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-action)',
  background: 'transparent',
  color: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

const filledBtnStyle: CSSProperties = {
  flex: 1,
  padding: '11px 16px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

const imageFrameStyle: CSSProperties = {
  padding: 8,
  borderRadius: 'var(--radius-lg)',
  border: '1px dashed color-mix(in srgb, var(--color-text-secondary) 40%, transparent)',
}

const imageStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '4 / 5',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-neutral-100)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

/* ─── Compare Plans step ─────────────────────────────────────────────── */

const backStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 20,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

export const compareGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 24,
  // Stretch so every card matches the tallest — the shorter card's content
  // stays top-aligned (flex-column, flex-start) and the extra height falls as
  // blank space at the bottom.
  alignItems: 'stretch',
}

const planCardBase: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: '32px 24px 28px',
  borderRadius: 'var(--radius-lg)',
}

// Plain option — white card + subtle border (the default for any plan that
// isn't the recommended or the learner's current membership).
const plainCardStyle: CSSProperties = {
  ...planCardBase,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
}

// Current membership — muted gray surface so it reads as "what you already have."
const currentCardStyle: CSSProperties = {
  ...planCardBase,
  background: 'var(--color-neutral-75)',
  border: '1px solid var(--color-border-subtle)',
}

const recCardStyle: CSSProperties = {
  ...planCardBase,
  background: 'var(--color-surface-card)',
  border: '2px solid var(--color-primary-500)',
}

const recBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: -14,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 14px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const planNameStyle: CSSProperties = {
  textAlign: 'center',
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: 1.15,
  color: 'var(--color-accent-text)',
}

const planProfStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const planPriceRowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  color: 'var(--color-text-secondary)',
}

const planPriceStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 26,
  color: 'var(--color-text-primary)',
}

const currentChipStyle: CSSProperties = {
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '9px 18px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-action)',
  color: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
}

const addToCartStyle: CSSProperties = {
  alignSelf: 'center',
  padding: '11px 28px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

const planNoteStyle: CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: '18px',
  // `text-primary`, not the muted `text-secondary` it started on: bold set in a
  // grey reads as a rendering artifact rather than emphasis, and the point of
  // bolding it is that this is the one commitment on the card.
  color: 'var(--color-text-primary)',
}

/** The date, on its own line above the clause it governs. */
const planNoteLeadStyle: CSSProperties = {
  display: 'block',
}

/** Separates the switch terms above from the plan's own bullets below. Sits
 *  inside the card's 24px padding rather than bleeding to its edges — it is
 *  dividing content, not splitting the card into two planes. */
const planNoteRuleStyle: CSSProperties = {
  height: 1,
  background: 'var(--color-border-subtle)',
}

/** Downgrade CTA — the Add To Cart shape, outlined instead of filled. */
const switchPlanStyle: CSSProperties = {
  ...addToCartStyle,
  background: 'transparent',
  border: '1px solid var(--color-action)',
  color: 'var(--color-action)',
}

const compareBulletsStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.45,
  color: 'var(--color-text-primary)',
}

const compareBulletStyle: CSSProperties = { paddingLeft: 2 }
