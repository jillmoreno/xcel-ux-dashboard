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

const CRE_OFFERINGS: PartnerOffering[] = [
  {
    id: 'cre-docusign',
    partnerName: 'DocuSign for Real Estate',
    eyebrow: 'eSignature',
    savingsLabel: '20% off the first year',
    description:
      'Colibri members get DocuSign for Real Estate at a discounted rate — secure eSignatures and prefilled contracts built for agents.',
    learnMoreUrl: '/membership/partners/docusign',
    logoKey: 'docusign',
  },
  {
    id: 'cre-zillow-premier',
    partnerName: 'Zillow Premier Agent',
    eyebrow: 'Lead generation',
    savingsLabel: 'Member-only credit ($150)',
    description:
      'Get a starter credit toward Premier Agent leads in your local market — a hand-off Zillow has reserved for Colibri members.',
    learnMoreUrl: '/membership/partners/zillow-premier',
    logoKey: 'zillow-premier',
  },
  {
    id: 'cre-houzz-pro',
    partnerName: 'Houzz Pro',
    eyebrow: 'Listings & marketing',
    savingsLabel: '25% off annual plans',
    description:
      'Build a Pro profile, generate listing marketing assets, and tap a network of vetted home-service pros for client referrals.',
    learnMoreUrl: '/membership/partners/houzz-pro',
    logoKey: 'houzz-pro',
  },
  {
    id: 'cre-supraweb',
    partnerName: 'SupraWeb Lockbox',
    eyebrow: 'Lockboxes',
    savingsLabel: 'Free starter kit',
    description:
      'Colibri members receive a starter lockbox + first-year SupraWeb subscription credit when activating a new agent account.',
    learnMoreUrl: '/membership/partners/supraweb',
    logoKey: 'supra',
  },
]

/* ─── McKissock (Appraisal) ────────────────────────────────────────── */

// Mirrors the "Additional Offerings" grid on the live McKissock partner-
// offerings page — member-benefit partners (insurance, office, travel, etc.).
const MCKISSOCK_OFFERINGS: PartnerOffering[] = [
  {
    id: 'mck-cyber-liability',
    partnerName: 'Cyber Liability Insurance',
    eyebrow: 'Insurance',
    savingsLabel: 'Member program',
    description:
      'The Data Breach & Cyber Liability Program is designed to provide the critical insurance coverage necessary to help protect your business against data breaches and cyber threats.',
    learnMoreUrl: '/membership/partners/cyber-liability',
  },
  {
    id: 'mck-health-supplemental',
    partnerName: 'Health & Supplemental Insurance',
    eyebrow: 'Insurance',
    savingsLabel: 'Member rates',
    description:
      'Quality health insurance can help protect you and the ones you love against the unexpected — plans and supplemental coverage at member rates.',
    learnMoreUrl: '/membership/partners/health-supplemental',
  },
  {
    id: 'mck-office-depot',
    partnerName: 'Office Depot',
    eyebrow: 'Office supplies',
    savingsLabel: 'Office Supply Discounts',
    description:
      "You have access to exclusive discounts at Office Depot. We've partnered with Office Depot to bring you a FREE national discount program on office supplies.",
    learnMoreUrl: '/membership/partners/office-depot',
  },
  {
    id: 'mck-constant-contact',
    partnerName: 'Constant Contact',
    eyebrow: 'Marketing',
    savingsLabel: 'Email Marketing Solution',
    description:
      "Constant Contact, Inc.'s email marketing and online survey tools help small businesses connect to customers quickly, easily, and affordably.",
    learnMoreUrl: '/membership/partners/constant-contact',
  },
  {
    id: 'mck-budget-avis',
    partnerName: 'Budget & Avis',
    eyebrow: 'Travel',
    savingsLabel: 'Car Rental Discounts',
    description:
      "Want to visit home but don't have a ride? We've partnered with Avis and Budget to bring you great offers on rental cars wherever you travel.",
    learnMoreUrl: '/membership/partners/budget-avis',
  },
  {
    id: 'mck-hartford-bop',
    partnerName: 'The Hartford',
    eyebrow: 'Insurance',
    savingsLabel: "Business Owner's Policy (BOP)",
    description:
      "Business Owner's Policy backed by a comprehensive property and liability package built for small appraisal businesses.",
    learnMoreUrl: '/membership/partners/hartford-bop',
  },
  {
    id: 'mck-last-minute-travel',
    partnerName: 'Last Minute Travel Club',
    eyebrow: 'Travel',
    savingsLabel: 'Hotel & Flight Savings',
    description:
      "You're one step closer to your dream holiday! With your Last Minute Travel Club membership, you can stop overpaying for hotels and flights.",
    learnMoreUrl: '/membership/partners/last-minute-travel',
  },
  {
    id: 'mck-wyndham',
    partnerName: 'Wyndham Hotel Group',
    eyebrow: 'Travel',
    savingsLabel: 'Wyndham Hotel Discount',
    description:
      "As a member, you receive up to 20% off the 'Best Available Rate' at over 7,500 participating locations worldwide.",
    learnMoreUrl: '/membership/partners/wyndham',
  },
]

/* ─── Elite (Healthcare / Nursing) ─────────────────────────────────── */
//
// Elite's offerings mirror the FHEA partner mix in the design
// reference — NatMed and Prescriber Insights are the headline
// partners (and the two that ship with custom SVG logo marks).

const ELITE_OFFERINGS: PartnerOffering[] = [
  {
    id: 'elite-natmed',
    partnerName: 'NatMed',
    eyebrow: 'Clinical reference',
    savingsLabel: '25% off NatMed Pro',
    description:
      "FHEA members can now get 25% off NatMed Pro, the largest database of evidence-based, unbiased information on natural medicines, dietary supplements, and integrated therapies.",
    learnMoreUrl: '/membership/partners/natmed',
    logoKey: 'natmed',
  },
  {
    id: 'elite-prescriber-insights',
    partnerName: 'Prescriber Insights',
    eyebrow: 'Prescribing reference',
    savingsLabel: '25% off subscription',
    description:
      'With your FHEA membership you save 25% on your subscription. Join thousands of NPs who rely on Prescriber Insights for concise, trusted information on medication.',
    learnMoreUrl: '/membership/partners/prescriber-insights',
    logoKey: 'prescriber-insights',
  },
  {
    id: 'elite-boojee',
    partnerName: 'Boojee',
    eyebrow: 'ID accessories',
    savingsLabel: 'Member-only discount',
    description:
      'Boojee is the market leader in the niche category of Identification Jewelry. Their product collections have expanded to include retractable badge reel jewelry, ID lanyards, and accessories that pair function with personal style.',
    learnMoreUrl: '/membership/partners/boojee',
    logoKey: 'boojee',
  },
]

/* ─── STC (Financial Services) ─────────────────────────────────────── */

const STC_OFFERINGS: PartnerOffering[] = [
  {
    id: 'stc-finra-news',
    partnerName: 'FINRA Regulatory Notices',
    eyebrow: 'Regulatory news',
    savingsLabel: 'Member-only digest',
    description:
      'A curated weekly digest of FINRA regulatory notices for STC members — written for advisors, not lawyers.',
    learnMoreUrl: '/membership/partners/finra-digest',
  },
  {
    id: 'stc-morningstar',
    partnerName: 'Morningstar Office',
    eyebrow: 'Portfolio research',
    savingsLabel: '20% off annual access',
    description:
      'STC members get 20% off Morningstar Office — institutional-grade fund research and portfolio analytics for advisors.',
    learnMoreUrl: '/membership/partners/morningstar',
  },
  {
    id: 'stc-broadridge',
    partnerName: 'Broadridge ProspectIQ',
    eyebrow: 'Prospecting',
    savingsLabel: 'Pilot pricing (first 6 months)',
    description:
      'A 6-month pilot of Broadridge ProspectIQ at member-only pricing — investor data and household intelligence in one workflow.',
    learnMoreUrl: '/membership/partners/broadridge',
  },
]

const OFFERINGS_BY_BRAND: Record<Brand, PartnerOffering[]> = {
  // Partner Offers is hidden from XCEL's rail (it is a membership benefit and
  // XCEL has no membership). XCEL's own "Partner Code" programme is a B2B
  // discount channel, not a partner-perks catalogue — do not fill this with it.
  xcel: [],
}

export function partnerOfferingsFor(brand: Brand): PartnerOffering[] {
  return OFFERINGS_BY_BRAND[brand]
}
