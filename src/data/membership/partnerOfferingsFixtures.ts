import type { Brand } from '@/context/AccountContext'
import type { PartnerLogoKey } from '@/components/membership/partnerLogos'

/**
 * VIP Partner Offerings — exclusive deals from third-party brands
 * surfaced under `/membership?tab=partner-offerings`. Each brand
 * ships its own partner mix tuned to the profession's actual
 * vendor ecosystem (real-estate tools for CRE / McKissock, clinical
 * reference tools for Elite, exam-prep + research tools for STC).
 *
 * The two Elite partners that ship with licensed-looking SVG marks
 * (NatMed, Prescriber Insights) point at `partnerLogos.tsx` via
 * `logoKey`. Every other partner falls back to a typographic
 * wordmark inside `<PartnerOfferingCard>` until real artwork ships.
 *
 * TODO(data): swap for a `/api/partners?brand=…` endpoint once the
 * partnerships team publishes a real catalog. Shape stays additive.
 */
export type PartnerOffering = {
  id: string
  /** Brand name as it appears on the logo block + the card heading. */
  partnerName: string
  /** Short headline above the partner name — e.g. "Featured savings"
   *  or a category like "Clinical reference". Kept on the type for
   *  future surfaces (partner-detail pages, tooltips); the redesigned
   *  card doesn't render it. */
  eyebrow: string
  /** Customer-facing offer line ("25% off NatMed Pro"). Like
   *  `eyebrow`, kept available for downstream surfaces but not
   *  rendered by the card today. */
  savingsLabel: string
  /** 1-2 sentence pitch. Clamps to 3 lines in the card. */
  description: string
  /** Where the "Learn More →" CTA points. Stubbed as a placeholder
   *  route today — real partner-detail pages or external links can
   *  swap in later. */
  learnMoreUrl: string
  /** Optional registry key into `PARTNER_LOGOS` (see
   *  `src/components/membership/partnerLogos.tsx`). When set, the
   *  card renders the matching SVG logo component. Omit it (most
   *  partners) and the card falls back to a clean typographic
   *  wordmark using `partnerName`. */
  logoKey?: PartnerLogoKey
}

/* ─── CRE (Real Estate) ────────────────────────────────────────────── */

/* ─── McKissock (Appraisal) ────────────────────────────────────────── */

/* ─── Elite (Healthcare / Nursing) ─────────────────────────────────── */
//
// Elite's offerings mirror the FHEA partner mix in the design
// reference — NatMed and Prescriber Insights are the headline
// partners (and the two that ship with custom SVG logo marks).

/* ─── STC (Financial Services) ─────────────────────────────────────── */

const OFFERINGS_BY_BRAND: Record<Brand, PartnerOffering[]> = {
  // Partner Offers is hidden from XCEL's rail (it is a membership benefit and
  // XCEL has no membership). XCEL's own "Partner Code" programme is a B2B
  // discount channel, not a partner-perks catalogue — do not fill this with it.
  xcel: [],
}

export function partnerOfferingsFor(brand: Brand): PartnerOffering[] {
  return OFFERINGS_BY_BRAND[brand]
}
