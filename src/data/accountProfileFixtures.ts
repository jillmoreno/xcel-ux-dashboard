import type { Brand } from '@/context/AccountContext'
import { userFor } from '@/context/AccountContext'

/**
 * Profile-page data model — Account Details, Personal Information, Membership
 * Plan, and Interests. Sourced from the McKissock "Profile" Figma
 * (`Nf5WhNJqxn9YVqDLT0MWOl` / `301:18770`); colors are remapped to the active
 * brand's tokens per the project convention.
 *
 * The Motivational Statement card is NOT modeled here — it reads/writes the
 * shared `MotivationContext` (`localStorage['cgp.motivationStatement']`) so the
 * statement stays in sync with the Dashboard Rebrand rail.
 *
 * TODO(data): production swaps `profileFor` for whatever the user-profile /
 * subscription endpoints return. The shape is additive.
 */

export type PostalAddress = {
  /** Street line(s) — e.g. "136 Point Pleasant Drive". */
  line1: string
  /** City, State — e.g. "Hill Valley, California". */
  cityState: string
  /** Postal code. */
  postal: string
}

export type AccountDetails = {
  username: string
  email: string
  /** Masked password display (never a real value). */
  passwordMask: string
}

export type PersonalInformation = {
  name: string
  dateOfBirth: string
  phone: string
  billing: PostalAddress
  shipping: PostalAddress
}

export type MembershipPlan = {
  /** Learning-path / plan title, e.g. "Florida RN License Renewal Path". */
  planTitle: string
  /** Pre-formatted auto-renewal date, e.g. "11/03/2026". */
  renewsOn: string
  /** Whole days of membership remaining. */
  daysRemaining: number
}

export type AccountProfile = {
  account: AccountDetails
  personal: PersonalInformation
  /** Present for members; `null` for non-members (upsell treatment). */
  membershipPlan: MembershipPlan | null
  interests: string[]
}

/** Days between today and a mm/dd/yyyy expiry string (clamped at 0). */
function daysUntil(mmddyyyy: string): number {
  const [m, d, y] = mmddyyyy.split('/').map((s) => parseInt(s, 10))
  if (!m || !d || !y) return 0
  // Date-only math on BOTH sides — the third copy of this helper in the repo,
  // alongside membershipScorecardFixtures.ts and membershipRenewalState.ts.
  // It carried the same defect the other two were fixed for on 2026-08-31:
  // subtracting `Date.now()` (an instant carrying the current time-of-day) from
  // local midnight of the target and flooring truncates the partial day, so it
  // read one low at any time after midnight. This one renders as "N Days of
  // Membership Remaining" on the account Profile page.
  const today = new Date()
  const target = Date.UTC(y, m - 1, d)
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.round((target - now) / 86_400_000))
}

/** Per-brand membership plan title (the learning path the plan renews). */
const PLAN_TITLE_BY_BRAND: Record<Brand, string> = {
  elite: 'Florida RN License Renewal Path',
  fitzgerald: 'Florida RN License Renewal Path',
  cre: 'Texas Real Estate Sales Agent Path',
  mckissock: 'North Carolina Certified General Learning Path',
  stc: 'Series 7 Exam Prep Path',
  xcel: 'Life & Health Pre-Licensing Path',
}

/** Per-brand interest tags. */
const INTERESTS_BY_BRAND: Record<Brand, string[]> = {
  elite: [
    'Critical Care',
    'Pharmacology',
    'Pediatrics',
    'Patient Safety',
    'Wound Care',
    'Mental Health',
  ],
  fitzgerald: [
    'Critical Care',
    'Pharmacology',
    'Pediatrics',
    'Patient Safety',
    'Wound Care',
    'Mental Health',
  ],
  cre: ['Residential', 'Commercial', 'Property Law', 'Home Ownership'],
  mckissock: [
    'Appraisals',
    'Real Estate',
    'Taxes',
    'Home Ownership',
    'Property Development',
    'Real Estate Law',
  ],
  stc: ['Securities', 'Insurance', 'Retirement Planning', 'Compliance'],
  xcel: ['Life & Health', 'Property & Casualty', 'Annuities', 'Ethics'],
}

/**
 * Resolve the profile record for a brand + membership. Elite is fully authored
 * (the brand this feature is demoed in); the other brands reuse the same shape
 * with their own demo user, plan title, and interests so switching brands still
 * reads coherently.
 */
export function profileFor(brand: Brand, isMember: boolean): AccountProfile {
  const user = userFor(brand)
  const fullName = `${user.firstName} ${user.lastName}`
  const username = `${user.firstName}.${user.lastName}`
  const email = `${username}@gmail.com`

  const membershipPlan: MembershipPlan | null =
    isMember && user.planExpiresOn
      ? {
          planTitle: PLAN_TITLE_BY_BRAND[brand],
          renewsOn: user.planExpiresOn,
          daysRemaining: daysUntil(user.planExpiresOn),
        }
      : isMember
        ? {
            // Members on brands without a fixture expiry get a sensible default.
            planTitle: PLAN_TITLE_BY_BRAND[brand],
            renewsOn: '11/01/2026',
            daysRemaining: 108,
          }
        : null

  return {
    account: {
      username,
      email,
      passwordMask: '••••••••••••',
    },
    personal: {
      name: fullName,
      dateOfBirth: '5/16/1980',
      phone: '1-225-556-5556',
      billing: {
        line1: '1472 Timberlane Road, #78',
        cityState: 'Mars Hill, NC',
        postal: '05654',
      },
      shipping: {
        line1: '136 Point Pleasant Drive',
        cityState: 'Hill Valley, California',
        postal: '05654',
      },
    },
    membershipPlan,
    interests: INTERESTS_BY_BRAND[brand],
  }
}
