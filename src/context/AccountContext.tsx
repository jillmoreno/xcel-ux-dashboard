/* eslint-disable react-refresh/only-export-components -- per prompt section 2:
   AccountProvider, useAccount hook, types, and PROFESSIONS table all live in
   this single module. Splitting them into separate files would force every
   consumer to import from 3 places. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * XCEL is the only brand this repo ships.
 *
 * The Common LMS original (`jill-dashboard-ux-designs`) carries six —
 * `cre | mckissock | elite | stc | fitzgerald | xcel` — because its product
 * renders per brand. This repo is XCEL's, so the other five and every fixture,
 * token block and tier table behind them were removed on 2026-09-08.
 *
 * Kept as a one-member UNION rather than deleted outright, exactly as the
 * gateway's own trimmed AccountContext did before this port: `Record<Brand, …>`
 * maps, `professionFor`, `featurePreviewSrc` and `prototypeFeatures` all take
 * it as a type, so the seam means a second XCEL skin — or a re-add of a sibling
 * brand — is an edit here rather than a refactor across those files.
 *
 * Adding a brand back is NOT just widening this union: `tokens.css` needs its
 * `[data-brand]` block, and every `Record<Brand, …>` in `src/data` will fail to
 * compile until it has an entry. That compile failure is the intended
 * behaviour — it is the list of what a brand actually owes.
 */
export type Brand = 'xcel'
export type Membership = 'member' | 'non-member'

/** Membership tier — the demo account's plan level. `non-member` plus up to
 *  three ordered member tiers (`low` / `mid` / `high`). Not every brand uses
 *  every member tier: Elite has `low` (Passport Lite) + `high` (Passport) and
 *  no middle; brands without their own tier table collapse to a single
 *  member tier (keyed `high`), so they behave like the old member/non-member
 *  binary. `membership` is DERIVED from this (any non-`non-member` tier ⇒
 *  `member`), so every existing `isMember` check keeps working unchanged. */
export type MembershipTier = 'non-member' | 'low' | 'mid' | 'high'
type MemberTierKey = Exclude<MembershipTier, 'non-member'>

/** Access level for content gating, resolved from the active tier. The
 *  highest member tier ⇒ `full` (nothing gated); any lower member tier ⇒
 *  `lite` (Passport-only content gated, Lite content open); `non-member` ⇒
 *  `non-member` (non-member-locked). */
export type MembershipAccess = 'non-member' | 'lite' | 'full'

export type MemberTier = {
  key: MemberTierKey
  /** Full display label, e.g. "Passport Lite". Shown in the rail/account badge. */
  label: string
  /** Compact label for the demo-tools tier switch, e.g. "Lite". */
  shortLabel: string
}

/** Per-brand member tier tables, ordered low → high. Sourced from the Figma
 *  "Colors for Membership Tiers" spec (file `Nf5WhNJqxn9YVqDLT0MWOl`, node
 *  1444:30869):
 *   - **CRE / McKissock** (Real Estate) → three tiers: **Plus / Pro / Premier**.
 *   - **Elite** (Healthcare) → two tiers: **Passport Lite / Passport** (no mid).
 *   - **STC** (Financial Services) → not in the spec yet, so a single generic
 *     member tier (keyed `high`). TODO(data): fill STC's real tiers when
 *     confirmed.
 *  The tier KEY (`low` / `mid` / `high`) drives both access gating and the
 *  tag/avatar color treatment (`tierToneFor` / `avatarTierFor`): low → primary
 *  (Plus), mid → tertiary (Pro), high → warning/gold (Premier / Passport). */
const MEMBER_TIERS_BY_BRAND: Record<Brand, MemberTier[]> = {
  // XCEL has NO consumer membership — it sells transactional Standard /
  // Premier course packages plus a B2B Partner programme. This entry exists
  // only because the map is exhaustive and `defaultMemberTier` indexes [0]
  // unguarded; its LABEL IS NEVER RENDERED, because `supportsMembership()`
  // suppresses every tier-label surface for this brand. Do not "fix" this by
  // surfacing the label — the tag is meant to be absent, not to read "Member".
  // A single `high` tier is also what keeps `accessForTier` at 'full', so
  // nothing is Passport-gated for a brand with no Passport.
  xcel: [{ key: 'high', label: 'Member', shortLabel: 'Member' }],
}

/** Tier visual tone — the semantic color ramp a tier's tag pill + avatar use.
 *  Per the Figma spec, keyed to the tier slot: low → primary, mid → tertiary,
 *  high → warning/gold; non-member → neutral. Each brand's tokens resolve the
 *  ramp, so the same tone reads on-brand everywhere. */
export type MembershipTierTone = 'neutral' | 'primary' | 'tertiary' | 'warning'

const TIER_TONE_BY_KEY: Record<MemberTierKey, MembershipTierTone> = {
  low: 'primary',
  mid: 'tertiary',
  high: 'warning',
}

export function tierToneFor(brand: Brand, tier: MembershipTier): MembershipTierTone {
  if (tier === 'non-member') return 'neutral'
  const tiers = MEMBER_TIERS_BY_BRAND[brand]
  const found = tiers.find((t) => t.key === tier) ?? tiers[0]
  return TIER_TONE_BY_KEY[found.key]
}

/** Avatar "Tier Profile Pics" key for a tier — drives the ring + badge glyph
 *  on `<Avatar tier>`. low → plus (single ring + Mountain), mid → pro (double
 *  ring + Bolt), high → premier (triple ring + Crown); non-member → default
 *  (no ring / no badge). */
export type AvatarTierKey = 'default' | 'plus' | 'pro' | 'premier'

const AVATAR_TIER_BY_KEY: Record<MemberTierKey, AvatarTierKey> = {
  low: 'plus',
  mid: 'pro',
  high: 'premier',
}

export function avatarTierFor(brand: Brand, tier: MembershipTier): AvatarTierKey {
  // No membership ⇒ no tier ring and no tier glyph: a plain avatar.
  if (!supportsMembership(brand)) return 'default'
  if (tier === 'non-member') return 'default'
  const tiers = MEMBER_TIERS_BY_BRAND[brand]
  const found = tiers.find((t) => t.key === tier) ?? tiers[0]
  return AVATAR_TIER_BY_KEY[found.key]
}

/** Ordered member tiers for a brand (low → high). */
export function memberTiersFor(brand: Brand): MemberTier[] {
  return MEMBER_TIERS_BY_BRAND[brand]
}

/** The default "member" tier for a brand — its LOWEST member tier (Passport
 *  Lite for Elite). Used when a plain member/non-member toggle or account
 *  switch resolves to "member". */
export function defaultMemberTier(brand: Brand): MembershipTier {
  return MEMBER_TIERS_BY_BRAND[brand][0].key
}

/** Clamp a tier to one the brand actually offers (a stored Elite `low` tier
 *  is invalid after switching to a brand with only a `high` tier). Non-member
 *  is always valid. */
export function clampTier(brand: Brand, tier: MembershipTier): MembershipTier {
  if (tier === 'non-member') return 'non-member'
  return MEMBER_TIERS_BY_BRAND[brand].some((t) => t.key === tier)
    ? tier
    : defaultMemberTier(brand)
}

/** Display label for the active tier, or `null` for a non-member. Falls back
 *  to the brand's lowest tier label if the stored tier isn't in the table. */
export function tierLabelFor(brand: Brand, tier: MembershipTier): string | null {
  // A brand with no membership has no tier LABEL — this is the chokepoint that
  // keeps the badge off the rail, the account menu, the mobile profile band,
  // the Learning Library hero and the dashboard KPI banner in one place.
  // Callers that write `tierLabel ?? 'Member'` must skip the badge on null
  // instead, or they will print "Member" for a brand that sells no membership.
  if (!supportsMembership(brand)) return null
  if (tier === 'non-member') return null
  const tiers = MEMBER_TIERS_BY_BRAND[brand]
  return (tiers.find((t) => t.key === tier) ?? tiers[0]).label
}

/** Resolve a tier to its content-gating access level.
 *
 *  Needs NO branch for a no-membership brand and must not grow one: such a
 *  brand's tier table is a single `high` tier, which is the `highest` below, so
 *  this already returns `'full'` — nothing gated. The only way to break that is
 *  to give it a second tier or to set it `'non-member'`; see
 *  `supportsMembership`. */
export function accessForTier(brand: Brand, tier: MembershipTier): MembershipAccess {
  if (tier === 'non-member') return 'non-member'
  const tiers = MEMBER_TIERS_BY_BRAND[brand]
  const highest = tiers[tiers.length - 1]
  // Highest defined tier (or an unknown/clamped tier) ⇒ full access; any lower
  // member tier ⇒ lite (Passport-only content gated).
  if (tier === highest.key || !tiers.some((t) => t.key === tier)) return 'full'
  return 'lite'
}

/** Options for the demo-tools tier switch: Non-Member followed by each member
 *  tier, low → high. */
export function membershipTierOptionsFor(
  brand: Brand,
): { tier: MembershipTier; label: string; shortLabel: string }[] {
  return [
    { tier: 'non-member', label: 'Non-Member', shortLabel: 'Non-member' },
    ...MEMBER_TIERS_BY_BRAND[brand].map((t) => ({
      tier: t.key as MembershipTier,
      label: t.label,
      shortLabel: t.shortLabel,
    })),
  ]
}

/**
 * Whether a brand sells a CONSUMER MEMBERSHIP at all.
 *
 * XCEL is transactional — Standard / Premier course PACKAGES plus a B2B
 * Partner Code programme. There is no membership, no tier ladder, and nothing
 * to renew, so every membership surface is SUPPRESSED for it.
 *
 * ⚠ SUPPRESS, NEVER DOWNGRADE. The obvious shortcut — pinning such a brand to
 * `tier: 'non-member'` — is wrong in four separate places: it renders the muted
 * "Non-Member" pill in the rail, drives the `LockedBenefitPage` bodies, lights
 * up `NonMemberUpsellHero`, and makes `accessForTier` return `'non-member'` so
 * Passport-gated content dims. All four are the OPPOSITE of "hidden
 * completely" — they advertise a membership the brand does not sell.
 *
 * A brand here still needs a `MEMBER_TIERS_BY_BRAND` entry (the map is
 * exhaustive and `defaultMemberTier` indexes [0] unguarded), and that entry
 * must be a SINGLE `high` tier so `accessForTier` resolves to `'full'` —
 * nothing can be Passport-gated for a brand with no Passport. Its label is
 * never rendered, because `tierLabelFor` returns null here.
 */
export function supportsMembership(brand: Brand): boolean {
  return brand !== 'xcel'
}

export type Profession = {
  brand: Brand
  label: string
  description: string
  brandFullName: string
  ecommerceUrl: string
}

/** Demo user profile surfaced via `useAccount().user`. The four brand
 *  fixtures below give each brand its own first name + motto so brand
 *  switching reads as "different account, different copy" in the
 *  Dashboard hero band.
 *
 *  `motto` is OPTIONAL — when it's omitted (the STC new-user fixture
 *  intentionally does this), the Dashboard hero band substitutes an
 *  onboarding quote instead.
 *
 *  TODO(data): production swaps this for whatever the user-profile
 *  endpoint actually returns. The shape stays additive — adding fields
 *  here doesn't change the public hook contract. */
export type DemoUser = {
  firstName: string
  lastName: string
  initials: string
  avatarUrl?: string
  motto?: string
  /** Membership plan tier name surfaced by `<MembershipHeroBand>`
   *  (e.g. "Premium"). Currently per-brand fixture; the engagement
   *  service will own this once subscription state ships. */
  planName: string
  /** Pre-formatted "month year" used by the hero band's sub-line
   *  ("Member since March 2024."). STC's zero-state fixture sets this
   *  to "today" so the copy renders as "Member since today.". */
  memberSinceMonthYear: string
  /** Pre-formatted renewal date ("June 14"). Empty string means the
   *  hero band renders "renews monthly" fallback copy instead — used
   *  for the STC zero-state fixture. */
  renewalDate: string
  /** Pre-formatted full plan-expiry date in mm/dd/yyyy ("11/03/2026").
   *  Surfaced by the Dashboard Rebrand member status band below the
   *  "Explore Membership" section hero. Optional — only the Elite
   *  fixture (the rebrand's seeded brand) sets it today; other surfaces
   *  keep using `renewalDate`. */
  planExpiresOn?: string
}

export type AccountState = {
  brand: Brand
  /** Derived from `tier` — any member tier ⇒ `'member'`. Kept so existing
   *  `membership === 'member'` / `isMember` checks work unchanged. */
  membership: Membership
  /** Source-of-truth membership tier (non-member / low / mid / high). */
  tier: MembershipTier
  /** Content-gating access level resolved from `tier` (non-member/lite/full). */
  access: MembershipAccess
  /** Active tier's display label (e.g. "Passport Lite"), or `null` for a
   *  non-member. */
  tierLabel: string | null
  /** Active tier's color tone (neutral/primary/tertiary/warning) — drives the
   *  membership badge + avatar treatment. */
  tierTone: MembershipTierTone
  /** Active tier's Avatar "Tier Profile Pics" key (default/plus/pro/premier). */
  avatarTier: AvatarTierKey
  profession: Profession
  user: DemoUser
  /** Which of the learner's memberships (`multiMembershipsFor(brand)`) is the
   *  active/selected one — drives the Membership Hub hero's front card + the
   *  left-nav's first membership. `null` ⇒ the primary (first) membership.
   *  Session-only (not persisted); resolved against the current brand's list by
   *  consumers, so a stale id from another brand safely falls back to first. */
  activeMembershipId: string | null
  setBrand: (b: Brand) => void
  setMembership: (m: Membership) => void
  /** Set the exact membership tier (drives the demo-tools tier switch). */
  setTier: (t: MembershipTier) => void
  setAccount: (b: Brand, m: Membership) => void
  setActiveMembershipId: (id: string | null) => void
}

/** Per-brand demo user fixtures. Inline here (vs. in
 *  `src/data/learningFixtures.ts`) so AccountContext doesn't acquire a
 *  circular dependency on a module that imports `Brand` from this file. */
const USERS_BY_BRAND: Record<Brand, DemoUser> = {
  // XCEL Solutions — an insurance pre-licensing candidate part-way through the
  // 3-Part Training Program (Life & Health, Florida). `planName` is a PACKAGE,
  // not a membership tier: Premier is XCEL's real top package ("everything you
  // need to pass the first time or your money back"). No `planExpiresOn` and an
  // empty `renewalDate` because there is nothing to renew, and
  // `memberSinceMonthYear` is the ACCOUNT creation month rather than a join
  // date — every surface that would label it "Member since" is suppressed by
  // `supportsMembership()`.
  xcel: {
    firstName: 'Alicia',
    lastName: 'Navarro',
    initials: 'AN',
    avatarUrl: '/brand/sarah.jpg',
    motto: 'Ten days to licensed. One lesson at a time.',
    planName: 'Premier',
    memberSinceMonthYear: 'February 2026',
    renewalDate: '',
  },
}

export function userFor(brand: Brand): DemoUser {
  return USERS_BY_BRAND[brand]
}

/** A single active membership the learner holds. The rail's Membership block
 *  lists these when a learner has more than one (across professions or
 *  states). `tone` maps to a `MembershipBadge` tone so each membership's tier
 *  pill reads on-brand. TODO(data): production swaps the fixture below for the
 *  subscription endpoint. */
export type MembershipRecord = {
  id: string
  /** Tier display label, e.g. "Passport" / "Passport Lite". */
  tierLabel: string
  /** Badge color tone (a `MembershipBadge` tone). */
  tone: 'primary' | 'secondary' | 'tertiary' | 'warning'
  /** Profession the membership covers, e.g. "Nursing". */
  profession: string
  /** License state / region, e.g. "Florida". */
  state: string
  /** Join year, e.g. "2024". */
  memberSinceYear: string
  /** Expiry date, mm/dd/yyyy. */
  expiresOn: string
  /** Renewal facts behind the membership card's state copy. Optional so records
   *  authored before the renewal states still render (they fall back to a plain
   *  "expires" reading of `expiresOn`). */
  renewal?: MembershipRenewal
}

/**
 * The renewal facts a membership card needs, per the renewal-states copy review
 * (`explorations/membership-card-ui/renewal-states-copy-review.html`, built to
 * Figma 633:1614 / 3283 / 3340).
 *
 * ONE SOURCE DATE by design: author `endsOn` and derive every countdown from it.
 * The Figma cards each carried their own date AND their own day count, and the
 * two disagreed by four days — deriving makes that impossible.
 */
export type MembershipRenewal = {
  /**
   * Whether auto-renewal is currently on.
   *
   * COLLAPSED 2026-08-31 from `'on' | 'off' | 'unavailable'`. The third value
   * existed because the copy used to fork on CAPABILITY — a plan that could not
   * auto-renew was never allowed to mention it. Once both `expires-*` states
   * were given one note apiece, nothing read the distinction, and auto-renewal
   * is expected to be available on every plan anyway.
   *
   * The safety property that value protected is preserved by the two-value
   * form: only `'on'` produces the auto-renews copy and its charge disclosure,
   * so an UNKNOWN setting maps to `'off'` and never asserts a charge that might
   * not happen. Keep it that way — `'off'` is the safe default, not a claim.
   */
  autoRenew: 'on' | 'off'
  /** The membership year's end — ISO `YYYY-MM-DD`. Every countdown derives from
   *  this, and it's the only date the card prints for states 1/2/5/7. */
  endsOn: string
  /** Renewal price in whole dollars (no "only" in the copy — just the number). */
  price: number
  /** Payment-failed state: benefits stay live until this retry deadline (ISO). */
  retryUntil?: string
  /** Grace period: expired, but restorable without losing the membership year,
   *  until this date (ISO). Absent ⇒ expiry is final. */
  graceEndsOn?: string
}

/** Demo multi-membership holdings, per brand. Only Elite carries a populated
 *  list today (the rebrand's seeded brand); other brands return an empty array
 *  and the rail falls back to the single-membership block. Gated behind the
 *  `membership-count` demo flag so reviewers can preview single ⇄ multiple.
 *  TODO(data): from the subscription service. */
const MULTI_MEMBERSHIPS_BY_BRAND: Partial<Record<Brand, MembershipRecord[]>> = {
}

/** The learner's active memberships for a brand (empty when none authored). */
export function multiMembershipsFor(brand: Brand): MembershipRecord[] {
  return MULTI_MEMBERSHIPS_BY_BRAND[brand] ?? []
}

export const PROFESSIONS: Profession[] = [
  {
    brand: 'xcel',
    label: 'Financial Services',
    description: 'Insurance pre-licensing, exam prep & CE',
    brandFullName: 'XCEL Solutions',
    ecommerceUrl: 'https://www.xcelsolutions.com/',
  },
]

export function professionFor(brand: Brand): Profession {
  // PROFESSIONS is exhaustive — `!` is safe here.
  return PROFESSIONS.find((p) => p.brand === brand)!
}

const STORAGE_KEY = 'cgp.account'
type StoredState = { brand: Brand; tier: MembershipTier }
const DEFAULT_STATE: StoredState = { brand: 'xcel', tier: defaultMemberTier('xcel') }

function loadInitial(): StoredState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<{
      brand: Brand
      tier: MembershipTier
      membership: Membership
    }>
    // Still validated rather than trusted: a localStorage value written by an
    // older build (or by the sibling LMS dashboard on a shared origin) can
    // name a brand this repo no longer has, and indexing a Record<'xcel', …>
    // with it would hand back undefined at runtime despite the types.
    const VALID_BRANDS: Brand[] = ['xcel']
    const brand: Brand =
      parsed.brand && (VALID_BRANDS as string[]).includes(parsed.brand) ? (parsed.brand as Brand) : 'xcel'
    // Prefer a stored `tier`; otherwise migrate a legacy `membership` value
    // ('member' ⇒ the brand's default member tier, 'non-member' ⇒ non-member).
    const VALID_TIERS: MembershipTier[] = ['non-member', 'low', 'mid', 'high']
    let tier: MembershipTier
    if (parsed.tier && (VALID_TIERS as string[]).includes(parsed.tier)) {
      tier = parsed.tier
    } else if (parsed.membership === 'non-member') {
      tier = 'non-member'
    } else {
      tier = defaultMemberTier(brand)
    }
    return { brand, tier: clampTier(brand, tier) }
  } catch {
    return DEFAULT_STATE
  }
}

export const AccountContext = createContext<AccountState | null>(null)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [{ brand, tier }, setState] = useState(loadInitial)
  // Session-only selection (not persisted) — which membership the hero + nav
  // show first. Reset when the brand changes (a stale id belongs to the old list).
  const [activeMembershipId, setActiveMembershipIdState] = useState<string | null>(null)
  const membership: Membership = tier === 'non-member' ? 'non-member' : 'member'

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ brand, tier }))
    } catch {
      // Ignore quota / private-mode errors — state still lives in memory.
    }
    document.documentElement.dataset.brand = brand
    const fullName = professionFor(brand).brandFullName
    document.title = `${fullName} — Member Platform`
  }, [brand, tier])

  // Switching brand re-clamps the tier to one the new brand offers (an Elite
  // `low` tier is invalid on a brand with only a `high` tier).
  const setActiveMembershipId = useCallback((id: string | null) => {
    setActiveMembershipIdState(id)
  }, [])

  const setBrand = useCallback((b: Brand) => {
    setActiveMembershipIdState(null) // the selection belonged to the old brand's list
    setState((prev) => ({ brand: b, tier: clampTier(b, prev.tier) }))
  }, [])

  const setMembership = useCallback((m: Membership) => {
    setState((prev) => ({
      ...prev,
      tier: m === 'non-member' ? 'non-member' : defaultMemberTier(prev.brand),
    }))
  }, [])

  const setTier = useCallback((t: MembershipTier) => {
    setState((prev) => ({ ...prev, tier: clampTier(prev.brand, t) }))
  }, [])

  const setAccount = useCallback((b: Brand, m: Membership) => {
    setState({ brand: b, tier: m === 'non-member' ? 'non-member' : defaultMemberTier(b) })
  }, [])

  const value = useMemo<AccountState>(
    () => ({
      brand,
      membership,
      tier,
      access: accessForTier(brand, tier),
      tierLabel: tierLabelFor(brand, tier),
      tierTone: tierToneFor(brand, tier),
      avatarTier: avatarTierFor(brand, tier),
      profession: professionFor(brand),
      user: userFor(brand),
      activeMembershipId,
      setBrand,
      setMembership,
      setTier,
      setAccount,
      setActiveMembershipId,
    }),
    [
      brand,
      membership,
      tier,
      activeMembershipId,
      setBrand,
      setMembership,
      setTier,
      setAccount,
      setActiveMembershipId,
    ],
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount(): AccountState {
  const ctx = useContext(AccountContext)
  if (!ctx) {
    throw new Error('useAccount must be used within an AccountProvider')
  }
  return ctx
}
