import type { Brand } from '@/context/AccountContext'

/* ─── What's New — Featured Hero + "Just launched" rail (Dashboard Rebrand) ───
   Drives the flag-gated `WhatsNewFeatured` block at the top of the What's New
   section AND the Marketing Focused band's rotating What's New carousel
   (`MarketingFocusedBand`). Elite was authored first; CRE, McKissock, and STC
   were added so their Marketing Focused carousels populate instead of showing
   the reserved "Image carousel" empty state. Brands with no slides still return
   `[]` so the block/carousel self-hides.
   Visual source: `explorations/whats-new-hero/hero-plus-scroll-rail.html`.
   TODO(data): placeholder copy — confirm real featured items + meta with each
   brand's content team. CRE copy is themed from colibrirealestate.com
   (AI MasterTracks, CNE, exam prep, CE membership, Luxury Home Marketing).

   NOTE on `tier`: the Marketing Focused carousel does not render the tier pill
   today (only the never-wired `WhatsNewFeatured` hero would), so the value is
   cosmetic for CRE/McKissock/STC — 'open' marks free content, 'passport' the
   premium lines. Revisit if the featured hero is wired for these brands, since
   they use Plus/Pro/Premier (RE) or a single Member tier (STC), not Passport. */

/** Membership tier the hero slide is gated behind (drives the pill). */
export type WhatsNewTier = 'passport' | 'lite' | 'open'

/** Primary + secondary CTA labels for one audience. */
export type WhatsNewCtaPair = { primary: string; secondary: string }

export type WhatsNewFeaturedSlide = {
  id: string
  /** Eyebrow above the headline, e.g. "Featured pathway · Transitions in Practice". */
  eyebrow: string
  tier: WhatsNewTier
  title: string
  desc: string
  /** Byline shown beside the avatar. */
  byline: string
  /** CTA labels for a member vs a non-member. */
  memberCta: WhatsNewCtaPair
  nonMemberCta: WhatsNewCtaPair
}

/** Content kind → drives the rail card's cover gradient + icon. */
export type WhatsNewKind = 'pathway' | 'exam' | 'tool' | 'podcast' | 'template'

export type WhatsNewLaunchCard = {
  id: string
  /** Display label for the content-type row, e.g. "Exam prep". */
  contentType: string
  iconKey: WhatsNewKind
  title: string
  /** Meta line, e.g. "200+ items · Self-paced". */
  meta: string
  coverAccent: WhatsNewKind
}

const FEATURED_BY_BRAND: Record<Brand, WhatsNewFeaturedSlide[]> = {
  // TODO(data): no XCEL marketing slides authored yet — the carousel falls back
  // to its reserved dashed empty state rather than showing another brand's copy.
  xcel: [],
}

const LAUNCHES_BY_BRAND: Record<Brand, WhatsNewLaunchCard[]> = {
  // TODO(data): see FEATURED_BY_BRAND above.
  xcel: [],
}

export function whatsNewFeaturedFor(brand: Brand): WhatsNewFeaturedSlide[] {
  return FEATURED_BY_BRAND[brand]
}

export function whatsNewLaunchesFor(brand: Brand): WhatsNewLaunchCard[] {
  return LAUNCHES_BY_BRAND[brand]
}
