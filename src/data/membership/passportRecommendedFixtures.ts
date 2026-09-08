import type { Brand } from '@/context/AccountContext'

/**
 * "Recommended for you" row on the Membership v2 (Passport) member view —
 * a small set of suggested courses rendered as `SimpleCard`s (same style
 * as the v1 membership page's Recommended for You shelves).
 *
 * TODO(data): replace with real personalized recommendations from the
 * engagement / catalog service once available.
 */

export type PassportRecommendedKind = 'course' | 'podcast' | 'video' | 'article'

export type PassportRecommendation = {
  id: string
  title: string
  kind: PassportRecommendedKind
  /** 0–5 star rating shown in the card meta row. */
  rating: number
  imageUrl: string
  /** Where the card links (stubbed to the catalog for the prototype). */
  href: string
  /** Membership-exclusive content. Non-members see a "Members only" lock
   *  badge on the tile and a non-blocking upgrade pathway instead of the
   *  course link (members see it as a normal recommendation). */
  memberOnly?: boolean
}

const U = (photo: string) =>
  `https://images.unsplash.com/${photo}?w=600&h=600&fit=crop&q=80`

const ELITE_RECOMMENDATIONS: PassportRecommendation[] = [
  {
    id: 'wound-care',
    title: 'Wound Care Essentials',
    kind: 'course',
    rating: 4.8,
    imageUrl: U('photo-1581595220892-b0739db3ba8c'),
    href: '/catalog',
  },
  {
    id: 'sepsis-recognition',
    title: 'Sepsis: Early Recognition',
    kind: 'video',
    rating: 4.7,
    imageUrl: U('photo-1538108149393-fbbd81895907'),
    href: '/catalog',
    memberOnly: true,
  },
  {
    id: 'peds-pharmacology',
    title: 'Pediatric Pharmacology',
    kind: 'course',
    rating: 4.6,
    imageUrl: U('photo-1631549916768-4119b2e5f926'),
    href: '/catalog',
  },
  {
    id: 'nurse-burnout',
    title: 'Beating Nurse Burnout',
    kind: 'podcast',
    rating: 4.5,
    imageUrl: U('photo-1505751172876-fa1923c5c528'),
    href: '/catalog',
    memberOnly: true,
  },
  {
    id: 'ekg-basics',
    title: 'EKG Interpretation Basics',
    kind: 'article',
    rating: 4.4,
    imageUrl: U('photo-1576091160550-2173dba999ef'),
    href: '/catalog',
  },
]

const RECS_BY_BRAND: Record<Brand, PassportRecommendation[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function passportRecommendationsFor(brand: Brand): PassportRecommendation[] {
  return RECS_BY_BRAND[brand]
}

/** "Featured products" row — membership-spotlighted content, distinct from
 *  the personalized recommendations above. Same tile shape. */
const ELITE_FEATURED: PassportRecommendation[] = [
  {
    id: 'feat-skills-library',
    title: 'Video Nursing Skills Library',
    kind: 'video',
    rating: 4.9,
    imageUrl: U('photo-1559757148-5c350d0d3c56'),
    href: '/catalog',
  },
  {
    id: 'feat-exam-prep',
    title: 'Specialty Certification Exam Prep',
    kind: 'course',
    rating: 4.8,
    imageUrl: U('photo-1576091160399-112ba8d25d1d'),
    href: '/catalog',
  },
  {
    id: 'feat-pharmacology-2026',
    title: 'Pharmacology Update 2026',
    kind: 'course',
    rating: 4.7,
    imageUrl: U('photo-1471864190281-a93a3070b6de'),
    href: '/catalog',
  },
  {
    id: 'feat-mental-health',
    title: 'Mental Health in Acute Care',
    kind: 'podcast',
    rating: 4.6,
    imageUrl: U('photo-1527613426441-4da17471b66d'),
    href: '/catalog',
  },
  {
    id: 'feat-medical-errors',
    title: 'Medical Errors Prevention',
    kind: 'course',
    rating: 4.5,
    imageUrl: U('photo-1516549655169-df83a0774514'),
    href: '/catalog',
  },
]

const FEATURED_BY_BRAND: Record<Brand, PassportRecommendation[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function featuredProductsFor(brand: Brand): PassportRecommendation[] {
  return FEATURED_BY_BRAND[brand]
}

/**
 * "Recommended for you" set for the Dashboard Rebrand overview's right-hand
 * widget — six small product tiles: the **top 2 podcasts** (always pinned
 * first) followed by **4 interest-based** recommendations. Composed from the
 * existing recommendation + featured pools so imagery/titles stay consistent;
 * returns `[]` for brands without recommendations (the widget self-hides).
 *
 * TODO(data): the "top 2 podcasts" should come from real podcast analytics and
 * the four picks from the personalization service once available.
 */
export function dashboardRecommendedFor(brand: Brand): PassportRecommendation[] {
  const recs = RECS_BY_BRAND[brand]
  if (recs.length === 0) return []
  const pool = [...recs, ...FEATURED_BY_BRAND[brand]]
  const podcasts = pool.filter((r) => r.kind === 'podcast').slice(0, 2)
  const interests = recs.filter((r) => r.kind !== 'podcast').slice(0, 4)
  return [...podcasts, ...interests]
}
