import { ArrowsRotate, CalendarExclamation, CreditCard } from '@/icons'
import type { RenewalIcon } from './membershipRenewalState'

/**
 * The glyph for a resolved renewal state's `icon`.
 *
 * Component-only file — the pill/severity STYLE helpers live beside it in
 * `renewalStateStyles.ts`, because a module that exports both components and
 * plain functions breaks fast refresh (the same split as `v4/shared.tsx` vs
 * `v4/sharedUtil.ts`).
 *
 * Shared by all three surfaces that render the six states: the
 * `MembershipRenewalCard` rows in the "Your Memberships" sheet, the
 * `MembershipRowCard` in the Membership + Scorecard hero, and the
 * `ManageMembershipBody` sheet — so one state can't show a calendar on one
 * surface and a card on the next.
 */
export function RenewalStateIcon({ icon, size = 16 }: { icon: RenewalIcon; size?: number }) {
  if (icon === 'card') return <CreditCard size={size} aria-hidden />
  if (icon === 'calendar') return <CalendarExclamation size={size} aria-hidden />
  return <ArrowsRotate size={size} aria-hidden />
}
