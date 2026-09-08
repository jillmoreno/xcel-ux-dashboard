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

const CRE_FEATURED: FeaturedOffer[] = [
  {
    id: 'cre-featured-gallagher',
    brandLabel: '360 CoveragePros',
    partnerName: 'Gallagher Affinity',
    description:
      'Exclusive errors & omissions and professional liability programs for members of Colibri Real Estate.',
    learnMoreUrl: '/membership/partners/gallagher-affinity',
    imageUrl: '/courses/5.webp',
  },
  {
    id: 'cre-featured-bombbomb',
    partnerName: 'BombBomb Video',
    description:
      'Members save 20% on video email + screen recording built to nurture leads and stay top-of-mind with clients.',
    learnMoreUrl: '/membership/partners/bombbomb',
    imageUrl: '/courses/3.webp',
  },
  {
    id: 'cre-featured-nar',
    brandLabel: 'NATIONAL ASSOCIATION OF REALTORS®',
    partnerName: 'NAR Member Benefits',
    description:
      'Unlock the full REALTOR Benefits® program — exclusive savings on the tools, tech, and services agents use every day.',
    learnMoreUrl: '/membership/partners/nar-benefits',
  },
]

/* ─── McKissock (Appraisal) ────────────────────────────────────────── */

// Mirrors the live McKissock partner-offerings page (Appraisal Foundation lead
// card, then the 2-up insurance + partner cards). No photos — the page renders
// solid sage-green image blocks (`placeholderMedia` in the panel).
const MCKISSOCK_FEATURED: FeaturedOffer[] = [
  {
    id: 'mck-featured-appraisal-foundation',
    brandLabel: 'THE APPRAISAL FOUNDATION',
    partnerName: 'The Appraisal Foundation',
    description:
      "The Appraisal Foundation is the nation's foremost authority on the valuation profession. The organization sets the Congressionally authorized standards and qualifications for real estate appraisers, and provides voluntary guidance on recognized valuation methods and techniques for all valuation professionals.",
    learnMoreUrl: '/membership/partners/appraisal-foundation',
  },
  {
    id: 'mck-featured-appraisers-liability',
    brandLabel: "APPRAISERS' PROFESSIONAL LIABILITY",
    partnerName: "Appraisers' Professional Liability Insurance",
    description:
      'Professional liability insurance built for appraisers — errors & omissions coverage at member-only rates to protect your practice.',
    learnMoreUrl: '/membership/partners/appraisers-liability',
  },
  {
    id: 'mck-featured-gallagher',
    brandLabel: '360° CoveragePros',
    partnerName: 'Gallagher Affinity',
    description: 'Exclusive Programs for Members of McKissock Learning',
    learnMoreUrl: '/membership/partners/gallagher-affinity',
  },
  {
    id: 'mck-featured-home-based',
    brandLabel: 'HOME BASED BUSINESS INSURANCE',
    partnerName: 'Home Based Business Insurance',
    description:
      'A comprehensive insurance package specifically tailored to home-based appraisal businesses — coverage that standard homeowner policies miss.',
    learnMoreUrl: '/membership/partners/home-based-business',
  },
  {
    id: 'mck-featured-sekady',
    brandLabel: 'SEKADY CAPITAL',
    partnerName: 'Sekady Capital',
    description:
      'Sekady Capital is a factoring company that specializes in helping appraisers get paid the next business day for completed work.',
    learnMoreUrl: '/membership/partners/sekady-capital',
  },
]

/* ─── Elite (Healthcare / Nursing) ─────────────────────────────────── */

const ELITE_FEATURED: FeaturedOffer[] = [
  {
    id: 'elite-featured-nso',
    brandLabel: 'NSO',
    partnerName: 'Nurses Service Organization',
    description:
      'Exclusive malpractice and professional liability coverage designed for nurses — protection Elite members can add in minutes.',
    learnMoreUrl: '/membership/partners/nso',
  },
  {
    id: 'elite-featured-nurse-com',
    brandLabel: 'NURSE.COM',
    partnerName: 'Nurse.com Career Center',
    description:
      'Discounted access to job listings, résumé tools, and career coaching built for nurses at every stage.',
    learnMoreUrl: '/membership/partners/nurse-com',
  },
  {
    id: 'elite-featured-uniform-advantage',
    brandLabel: 'UNIFORM ADVANTAGE',
    partnerName: 'Uniform Advantage',
    description:
      'Members save 15% on scrubs, footwear, and accessories — refresh your work wardrobe for less.',
    learnMoreUrl: '/membership/partners/uniform-advantage',
  },
]

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
  cre: CRE_FEATURED,
  mckissock: MCKISSOCK_FEATURED,
  elite: ELITE_FEATURED,
  fitzgerald: ELITE_FEATURED,
  stc: STC_FEATURED,
  // See OFFERINGS_BY_BRAND — Partner Offers is hidden for XCEL.
  xcel: [],
}

/** Featured offers for a brand (demo data — see the file header). */
export function featuredOffersFor(brand: Brand): FeaturedOffer[] {
  return FEATURED_BY_BRAND[brand]
}
