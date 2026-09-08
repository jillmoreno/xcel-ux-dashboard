import type { Brand } from '@/context/AccountContext'

/**
 * Featured Partner Offers — the headline offers surfaced under the
 * "Featured Offers" heading when the `partner-offers-featured` flag is on.
 * These render with a distinct hero treatment (one wide lead card + a row of
 * smaller cards) via `<FeaturedOfferCard>`, above the regular
 * "Additional Offerings" grid.
 *
 * Brand-scoped demo content tuned to each profession's vendor ecosystem
 * (real-estate services for CRE, appraisal services for McKissock, nursing
 * partners for Elite, advisor tools for STC). CRE / McKissock reuse the shared
 * real-estate lifestyle photos in `public/courses/`; Elite / STC have no photo
 * set, so their hero renders a branded gradient panel and the smaller cards are
 * logo-first.
 *
 * TODO(data): swap for a real, server-published featured catalog once the
 * partnerships team ships one. Shape stays additive.
 */
export type FeaturedOffer = {
  id: string
  /** Card title — the partner/program name. */
  partnerName: string
  /** Small wordmark/label above the title (the partner's own brand mark in
   *  the real design). Rendered as a styled text lockup here. */
  brandLabel?: string
  /** 1-2 sentence pitch. */
  description: string
  /** Where the "Learn More" CTA points. */
  learnMoreUrl: string
  /** Marketing photo. When omitted the card renders logo-first (small) or a
   *  branded gradient panel (hero). */
  imageUrl?: string
}

/* ─── CRE (Real Estate) ────────────────────────────────────────────── */

/* ─── McKissock (Appraisal) ────────────────────────────────────────── */

/* ─── Elite (Healthcare / Nursing) ─────────────────────────────────── */

/* ─── STC (Financial Services) ─────────────────────────────────────── */

const STC_FEATURED: FeaturedOffer[] = [
  {
    id: 'stc-featured-comply',
    brandLabel: 'COMPLY',
    partnerName: 'RIA in a Box',
    description:
      'Exclusive member pricing on compliance software and RIA registration support — stay audit-ready with less overhead.',
    learnMoreUrl: '/membership/partners/comply',
  },
  {
    id: 'stc-featured-nitrogen',
    brandLabel: 'NITROGEN',
    partnerName: 'Nitrogen (Riskalyze)',
    description:
      'Discounted risk-analytics and proposal tools to align portfolios with each client’s risk tolerance.',
    learnMoreUrl: '/membership/partners/nitrogen',
  },
  {
    id: 'stc-featured-cfp-board',
    brandLabel: 'CFP BOARD',
    partnerName: 'CFP Board Resources',
    description:
      'Member resources for pursuing and maintaining CFP® certification — study support, exam prep, and CE guidance.',
    learnMoreUrl: '/membership/partners/cfp-board',
  },
]

const FEATURED_BY_BRAND: Record<Brand, FeaturedOffer[]> = {
  // See OFFERINGS_BY_BRAND — Partner Offers is hidden for XCEL.
  xcel: [],
}

/** Featured offers for a brand (demo data — see the file header). */
export function featuredOffersFor(brand: Brand): FeaturedOffer[] {
  return FEATURED_BY_BRAND[brand]
}
