import type { Brand } from '@/context/AccountContext'

/**
 * FHEA Passport member products — the 9 nursing products that anchor the
 * Membership v2 (Passport) redesign. Sourced from the Nursing products
 * roadmap; rank order is preserved in the array below.
 *
 * `iconKey` is a string union resolved to an `@/icons` component by the
 * `PassportProductsGrid` (same name→component pattern NavDropdown uses) —
 * the data layer stays free of React imports.
 *
 * TODO(data): swap `passportProductsFor` for a real catalog endpoint
 * (e.g. `/api/membership/products?brand=…`) once the product team
 * publishes one. Shape stays additive.
 */

export type PassportLiveStatus = 'now' | 'q2' | 'q3'
export type PassportTier = 'passport' | 'passport-lite' | 'both'

export type PassportIconKey =
  | 'video'
  | 'award'
  | 'briefcase'
  | 'podcast'
  | 'robot'
  | 'file-lines'
  | 'flag'
  | 'books'
  | 'book-open'

/** Which broken-out section a product belongs to in the V3 grouped
 *  layout (`PassportProductsSections`). */
export type PassportProductGroupId = 'learning-library' | 'exam-prep' | 'career-tools'

export type PassportProduct = {
  id: string
  title: string
  /** 1 sentence, member-benefit framing. */
  blurb: string
  iconKey: PassportIconKey
  liveStatus: PassportLiveStatus
  tier: PassportTier
  /** Which V3 section the product groups under. */
  group: PassportProductGroupId
  /** true for the 3 Rubi AI tools (interview sim, resume, career paths). */
  rubiAi?: boolean
}

const ELITE_PASSPORT_PRODUCTS: PassportProduct[] = [
  {
    id: 'video-skills-library',
    title: 'Video nursing skills library',
    blurb:
      'On-demand video refreshers for core clinical skills, part of your Resource Library.',
    iconKey: 'video',
    liveStatus: 'now',
    tier: 'passport',
    group: 'learning-library',
  },
  {
    id: 'cert-exam-prep',
    title: 'Specialty certification exam prep bundles',
    blurb:
      'Targeted exam-prep bundles to help you pass specialty certifications with confidence.',
    iconKey: 'award',
    liveStatus: 'q2',
    tier: 'passport',
    group: 'exam-prep',
  },
  {
    id: 'role-transition-ce',
    title: 'Specialty & role transition CE courses',
    blurb:
      'CE courses designed for nurses moving into a new specialty or role.',
    iconKey: 'briefcase',
    liveStatus: 'q2',
    tier: 'passport',
    group: 'learning-library',
  },
  {
    id: 'podcasts',
    title: 'Nursing podcasts',
    blurb:
      'Audio learning for your commute — the one product also included with Passport Lite.',
    iconKey: 'podcast',
    liveStatus: 'now',
    tier: 'both',
    group: 'learning-library',
  },
  {
    id: 'interview-sim',
    title: 'Nursing interview practice simulation',
    blurb: 'Rubi AI runs realistic nursing interview reps and gives you feedback.',
    iconKey: 'robot',
    liveStatus: 'q2',
    tier: 'passport',
    group: 'career-tools',
    rubiAi: true,
  },
  {
    id: 'resume-builder',
    title: 'Nurse resume builder',
    blurb:
      'Rubi AI turns your experience into a polished, role-ready nursing resume.',
    iconKey: 'file-lines',
    liveStatus: 'q3',
    tier: 'passport',
    group: 'career-tools',
    rubiAi: true,
  },
  {
    id: 'career-paths',
    title: 'Career paths planning tool',
    blurb: 'Rubi AI maps possible next roles and the credentials to get there.',
    iconKey: 'flag',
    liveStatus: 'q3',
    tier: 'passport',
    group: 'career-tools',
    rubiAi: true,
  },
  {
    id: 'specialty-bundles',
    title: 'In-depth specialty bundles',
    blurb: 'Deep-dive course bundles organized by clinical specialty.',
    iconKey: 'books',
    liveStatus: 'now',
    tier: 'passport',
    group: 'learning-library',
  },
  {
    id: 'pharmacology-library',
    title: 'Pharmacology course library',
    blurb:
      'A full library to stay current on medications, dosing, and patient safety.',
    iconKey: 'book-open',
    liveStatus: 'now',
    tier: 'passport',
    group: 'learning-library',
  },
]

const PASSPORT_PRODUCTS_BY_BRAND: Record<Brand, PassportProduct[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function passportProductsFor(brand: Brand): PassportProduct[] {
  return PASSPORT_PRODUCTS_BY_BRAND[brand]
}

/* ─── V3 grouped layout — section metadata + selector ───────────────── */

export type PassportProductGroup = {
  id: PassportProductGroupId
  eyebrow: string
  title: string
  blurb: string
  /** true → cards in this group get the Rubi AI accent treatment. */
  rubiAccent?: boolean
}

/** Ordered group metadata that drives the V3 section headers — kept here
 *  so the component stays presentation-only. Render order = array order. */
export const PASSPORT_PRODUCT_GROUPS: PassportProductGroup[] = [
  {
    id: 'learning-library',
    eyebrow: 'Learn',
    title: 'Your Resource Library',
    blurb:
      'On-demand CE, video skills, podcasts, and specialty libraries — everything to keep your license current and your practice sharp.',
  },
  {
    id: 'exam-prep',
    eyebrow: 'Get certified',
    title: 'Exam & certification prep',
    blurb:
      'Targeted bundles to help you pass specialty certifications with confidence.',
  },
  {
    id: 'career-tools',
    eyebrow: 'Advance',
    title: 'Career tools, powered by Rubi AI',
    blurb:
      'Your AI career coach — practice interviews, sharpen your resume, and map your next move.',
    rubiAccent: true,
  },
]

export type PassportProductGroupWithItems = PassportProductGroup & {
  products: PassportProduct[]
}

/** Groups paired with their products, in `PASSPORT_PRODUCT_GROUPS` order.
 *  Within each group, the product order from `passportProductsFor` is
 *  preserved. Groups with zero products are omitted, so non-Elite brands
 *  (empty product list) return `[]`. */
export function passportProductGroupsFor(
  brand: Brand,
): PassportProductGroupWithItems[] {
  const products = passportProductsFor(brand)
  return PASSPORT_PRODUCT_GROUPS.map((group) => ({
    ...group,
    products: products.filter((p) => p.group === group.id),
  })).filter((group) => group.products.length > 0)
}
