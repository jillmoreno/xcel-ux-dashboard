import { Bell, CreditCard, FileText, Gift, IdCard, Receipt, User } from '@/icons'
import { supportsGiftRecipients } from '@/data/giftRecipientsFixtures'
import type { Brand } from '@/context/AccountContext'

/**
 * The canonical account-section list — ONE source for both surfaces that
 * navigate the account area:
 *
 *   1. the top-right account dropdown ([AccountMenu](../layout/AccountMenu.tsx)), and
 *   2. the account sub-nav rendered beside every account page
 *      ([AccountSubNav](./AccountSubNav.tsx)) inside the Dashboard Rebrand shell.
 *
 * They used to be separate literals, which is how a dropdown and a sub-nav
 * drift into listing different things (or the same thing in a different order).
 * Order here IS the order in both.
 *
 * `path` is the canonical URL (`/account/…`). Those classic routes redirect into
 * the shell (`?section=<section>`), so there's exactly one address per section
 * and a shared link never lands on the top-nav layout.
 */
export type AccountSectionId =
  | 'profile'
  | 'notifications'
  | 'licenses'
  | 'transcripts'
  | 'payment-methods'
  | 'purchases'
  | 'gift-recipients'

export type AccountSectionDef = {
  id: AccountSectionId
  label: string
  /** Classic account URL — the canonical address; redirects into the shell. */
  path: string
  icon: typeof User
}

const BASE_SECTIONS: AccountSectionDef[] = [
  { id: 'profile', label: 'Profile', path: '/account/profile', icon: User },
  { id: 'notifications', label: 'Notifications', path: '/account/notifications', icon: Bell },
  { id: 'licenses', label: 'Licenses', path: '/account/licenses', icon: IdCard },
  { id: 'transcripts', label: 'Transcripts', path: '/account/transcripts', icon: FileText },
  {
    id: 'payment-methods',
    label: 'Payment Methods',
    path: '/account/payment-methods',
    icon: CreditCard,
  },
  { id: 'purchases', label: 'My Purchases', path: '/account/purchases', icon: Receipt },
]

/**
 * Gift Recipients (purchase-for-others tracking) — appended after Purchases
 * (it IS purchase history) for brands that sell it, and only while the
 * `gift-recipients` flag is on, so the row disappears cleanly instead of
 * leading to an empty section.
 */
const GIFT_RECIPIENTS: AccountSectionDef = {
  id: 'gift-recipients',
  label: 'Purchased for Others',
  path: '/account/gift-recipients',
  icon: Gift,
}

/**
 * The sections to show for a brand. `giftRecipientsOn` is the caller's read of
 * the `gift-recipients` flag — passed in rather than read here so this module
 * stays hook-free and usable from non-component code.
 */
export function accountSectionsFor(brand: Brand, giftRecipientsOn: boolean): AccountSectionDef[] {
  return giftRecipientsOn && supportsGiftRecipients(brand)
    ? [...BASE_SECTIONS, GIFT_RECIPIENTS]
    : BASE_SECTIONS
}

/** Every account section id — used by the shell to route `?section=` values. */
export const ACCOUNT_SECTION_IDS: AccountSectionId[] = [
  ...BASE_SECTIONS.map((s) => s.id),
  GIFT_RECIPIENTS.id,
]

/** Is this shell section an account section (i.e. does it get the sub-nav)? */
export function isAccountSection(id: string): id is AccountSectionId {
  return (ACCOUNT_SECTION_IDS as string[]).includes(id)
}
