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

const RECS_BY_BRAND: Record<Brand, PassportRecommendation[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function passportRecommendationsFor(brand: Brand): PassportRecommendation[] {
  return RECS_BY_BRAND[brand]
}

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
