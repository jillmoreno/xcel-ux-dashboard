import type { Brand } from '@/context/AccountContext'

/**
 * Membership community — the members-only community group a brand runs,
 * advertised on the member Membership page (`MembershipCommunityBand`).
 *
 * This is deliberately NOT part of the Free Content set. The two were one list
 * until 2026-08-26, and that pairing was the source of the mixed-gating problem
 * on the old External Resources page: two open links beside one locked card, so
 * the page could not say whether it was marketing or a benefit. Splitting them
 * lets each surface make a single claim — Free Content is free, the community is
 * a membership benefit.
 *
 * Brand-keyed and null-by-default: a brand with no community renders nothing
 * (the band self-hides), so this never leaves an empty shell on the page.
 * TODO(data): serve from `/api/membership/community?brand=…` once the content
 * team owns these; the group URL and member count both drift.
 */

/** Platform glyph for the community band's icon plate. */
export type CommunityIcon = 'facebook'

export type MembershipCommunity = {
  id: string
  /** Band heading — the community's own name. */
  name: string
  /** Short label for tight surfaces (the account-menu row). Falls back to
   *  `name`. Budget: **~20 chars** — the menu is 280px wide, and the full
   *  "McKissock Appraisal Community" wrapped that row to two lines while every
   *  other row stayed at one. Same budgeted-short-field pattern as `tileBlurb`
   *  vs `blurb` and `promoDescription` vs `description`. */
  shortName?: string
  /** One or two sentences on what the group is for. */
  description: string
  /** Outbound group URL — opens in a new tab. */
  href: string
  /** CTA label (e.g. "Join the group"). */
  cta: string
  icon: CommunityIcon
  /** Optional decorative image for the band (a path under `public/`). Omit and
   *  the band renders copy-only — it is presentation, never the message, so a
   *  brand with no suitable licensed shot loses nothing. */
  image?: string
  /** Short proof points, rendered as a check row. Keep to 3 — the band is a
   *  single row on desktop, and a fourth wraps it. */
  highlights: string[]
}

const MCKISSOCK_COMMUNITY: MembershipCommunity = {
  id: 'mckissock-appraisal-community',
  name: 'McKissock Appraisal Community',
  shortName: 'Facebook Community',
  description:
    'A private group for appraisers to connect, share knowledge, discuss market trends, build relationships, and advance their careers.',
  href: 'https://www.facebook.com/groups/mckissockappraisalcommunity',
  cta: 'Join the group',
  icon: 'facebook',
  // A peer professional engaging online — which is what a Facebook group is.
  // Deliberately NOT `handshake.png`: that one is an agent closing with buyers,
  // a transaction rather than a community of peers. Already-licensed asset,
  // reused from the membership bands.
  image: '/brand/laptop-woman.png',
  highlights: [
    'Ask questions and get answers from working appraisers',
    'Discuss standards changes and market shifts as they happen',
    'Build referral relationships outside your own market',
  ],
}

/** Brand-keyed communities. Only McKissock runs one today — every other brand
 *  returns `null` and the band self-hides. */
const COMMUNITY_BY_BRAND: Record<Brand, MembershipCommunity | null> = {
  cre: null,
  mckissock: MCKISSOCK_COMMUNITY,
  elite: null,
  fitzgerald: null,
  stc: null,
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

export function communityFor(brand: Brand): MembershipCommunity | null {
  return COMMUNITY_BY_BRAND[brand]
}
