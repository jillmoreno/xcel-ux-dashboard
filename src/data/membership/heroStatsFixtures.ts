import type { Brand } from '@/context/AccountContext'

/**
 * Inline stats rendered in the member-facing `<MembershipHeroBand>` —
 * Active courses · Saved to library · Unread replies.
 *
 * Each stat carries a numeric `value`, an uppercase `label`, and a
 * short `meta` caption that adds context ("3 in progress this week"
 * etc.). A value of `0` triggers the hero band's faded zero-state
 * treatment — same convention the dashboard hero band uses for the
 * STC new-user fixture.
 *
 * TODO(data): swap this for an `/api/membership/stats` call once the
 * engagement service surfaces real per-user counts. Shape is additive
 * so adding fields here won't break the hook contract.
 */
export type MembershipHeroStat = {
  /** Uppercased in CSS — source stays sentence-case. */
  label: string
  value: number
  /** Short caption shown below the value ("3 in progress this week"). */
  meta: string
}

const HERO_STATS_BY_BRAND: Record<Brand, MembershipHeroStat[]> = {
  // XCEL — a pre-licensing candidate mid-way through the 3-Part Program. No
  // forum product, so "Unread replies" is 0 with a neutral meta line rather
  // than an onboarding nudge for something that doesn't exist.
  xcel: [
    { label: 'Active courses', value: 3, meta: '1 in progress this week' },
    { label: 'Saved to library', value: 6, meta: '2 added since last visit' },
    { label: 'Unread replies', value: 0, meta: 'No threads yet' },
  ],
}

export function membershipHeroStatsFor(brand: Brand): MembershipHeroStat[] {
  return HERO_STATS_BY_BRAND[brand]
}
