// TODO(data): replace with real recommended-shelves API integration.
//
// Each shelf on the Dashboard's "Recommended for You" tab is built from a
// `CategoryRow` returned by `buildShelves(brand, membership, profession)`.
// MVP wires up these categories:
//
//   1. For your {profession} license        (A2 — license-state filter)
//   2. Renew before {date}                  (A4 — mandatory CE for current cycle)
//   3. Featured series & collections        (B2 — curated series)
//   4. New this week                        (B1 — releasedAt within window)
//   5. Quick wins                           (C1 — hours < 1)
//   6. Podcast spotlight                    (C3 — podcasts not already in playlist)
//   7. Unlock with Premium                  (D1 — non-members only)
//
// The A1 "Continue where you left off" shelf was retired — the Dashboard's
// dedicated **Jump Back In** tab covers that need without forcing the
// recommendation surface to double as a continuation tray. Phase-2
// categories (Because You Completed, Trending, Staff Picks, etc.) follow
// the same pattern. Full strategy: `/recommended-for-you-redesign.md`.
//
// Anchored to FIXTURE_TODAY (2026-05-20) — same anchor the My Courses
// "Recently Added" feature uses (see `myCoursesFixtures`) — so the demo
// shelves always have content regardless of the host clock.

import type { Brand, Membership as MembershipState, Profession } from '@/context/AccountContext'
import type {
  IndividualCourse,
  Membership as CatalogMembership,
  Package as CatalogPackage,
  Series,
} from '@/data/catalog/types'
import { getCatalogFixtures } from '@/data/catalog'
import { LICENSE_TRACKER } from '@/data/dashboardFixtures'
import { MY_PODCAST_PLAYLIST, type PodcastRecord } from '@/data/podcastFixtures'
import { toPodcastRecord } from '@/components/courses/podcastFromCourse'

export type CategoryId =
  | 'for-your-license'
  | 'renew-before'
  | 'featured-series'
  | 'new-this-week'
  | 'quick-wins'
  | 'podcast-spotlight'
  | 'package-spotlight'
  | 'membership-spotlight'
  | 'unlock-with-premium'

export type ShelfCardType =
  | 'course'
  | 'course-urgent'
  | 'podcast'
  | 'package'
  | 'membership'

/** Demo "today" — anchors `releasedAt` windowing to a fixed date instead of
 *  the host clock so the New This Week shelf renders the same items
 *  regardless of when the prototype is opened. */
export const RECOMMENDED_TODAY = new Date(2026, 4, 20)

/** Window for the "New this week" shelf. */
export const NEW_RELEASE_WINDOW_DAYS = 14

/** Max items to surface per shelf — the trailing locked-tail / peek
 *  obscures the count, so capping keeps the source list compact. */
const SHELF_ITEM_CAP = 8
const QUICK_WINS_CAP = 10
/** Recommended for You *page* shelves cap at a tidy 4-up (the Home band keeps
 *  the wider `SHELF_ITEM_CAP`). The Recommended for You page dropped its per-row
 *  "See All" links in favor of horizontal carousel scrolling, so shelves now
 *  carry a fuller set (up to this cap) and the reviewer scrolls the row (a
 *  trailing card peeks + a persistent arrow) to reach the rest. */
const REC_PAGE_SHELF_CAP = 8
/** Lower bound for a shelf to render. Below this, the row hides cleanly
 *  rather than showing a thin / lopsided strip. Keep aligned with the
 *  redesign-doc rule that "personalized rows hide entirely when no items
 *  qualify" — extended to "or when fewer than four qualify." */
const MIN_SHELF_ITEMS = 4

/**
 * Hard-coded per-brand license-state for the A2 "For your {profession}
 * license" shelf. The platform's LICENSE_TRACKER is single-state today
 * (CRE only — North Carolina); rather than parse `LICENSE_TRACKER.licenseName`,
 * map each brand to the state it should filter against. STC most exams are
 * federal, so it filters by the pseudo-state "Federal" the catalog already
 * uses.
 *
 * TODO(data): replace with a per-account active-license lookup once
 * LICENSE_TRACKER is multi-brand / multi-license.
 */
const LICENSE_STATE_BY_BRAND: Record<Brand, string> = {
  cre: 'North Carolina',
  mckissock: 'Texas',
  elite: 'Texas',
  fitzgerald: 'Texas',
  stc: 'Federal',
  xcel: 'Florida',
}

/**
 * Per-brand curated 4-id list for the non-member "Unlock with Premium"
 * shelf (D1). Hand-picked for aspirational appeal — high-rated, broadly
 * applicable, or representative of the brand's premium content. Order in
 * the array determines order on the shelf; the first id renders as the
 * unlocked preview card, the next three render as `LockedPreviewCard`s.
 *
 * TODO(data): swap for a real editorial / membership-only feed once it
 * exists. Demo fixtures only.
 */
const MEMBER_EXCLUSIVE_IDS: Record<Brand, string[]> = {
  cre: ['c-real-property', 'c-podcast-fair-housing-deep-dive', 'c-implicit-bias', 'c-agency-law'],
  mckissock: [
    'c-mck-residential-report',
    'c-mck-fair-housing',
    'c-mck-supervisor-trainee',
    'c-mck-rural-property',
  ],
  elite: [
    'c-pharmacology-update',
    'c-end-of-life',
    'c-mental-health-podcast',
    'c-pediatric-update',
  ],
  fitzgerald: [
    'c-pharmacology-update',
    'c-end-of-life',
    'c-mental-health-podcast',
    'c-pediatric-update',
  ],
  stc: ['c-series-7-topoff', 'c-series-24', 'c-series-79', 'c-sie-podcast'],
  // XCEL has no membership, so the "Unlock with Premium" shelf never renders
  // for it — an empty list drops the shelf rather than curating one nobody
  // can be locked out of.
  xcel: [],
}

/**
 * Discriminated by `cardType` so the panel can pick the right card
 * component without re-checking item shape. Rendering branches:
 *
 *  - `course` / `course-urgent` / `podcast` — standard shelves
 *    (member: full list; non-member: 2 + LockedTailCard).
 *  - `series` — Featured Series; wider 400/280 cells; opens `SeriesSheet`.
 *  - `unlock` — Unlock with Premium; inverted 1-unlocked + 3-locked teaser.
 *  - `banner` — sentinel row that renders the `UpgradeBanner` between
 *    shelves 3 and 4 for non-members. Carries no items and no header.
 */
export type CategoryRow =
  | {
      // Home-band shelves (`for-your-license` / `new-this-week` / `quick-wins`)
      // + the Recommended for You *page* course shelves (`buildRecommendedShelves`).
      id:
        | 'for-your-license'
        | 'new-this-week'
        | 'quick-wins'
        | 'whats-new'
        | 'my-interests'
        | 'mandatory'
        | 'pharmacology'
        | 'webinars'
        | 'onsite'
        | 'free-webinars'
        | 'livestream-review'
        | 'onsite-review'
      cardType: 'course'
      eyebrow?: string
      title: string
      descriptor?: React.ReactNode
      seeAllHref: string
      items: IndividualCourse[]
    }
  | {
      id: 'renew-before'
      cardType: 'course-urgent'
      eyebrow?: string
      title: string
      descriptor?: React.ReactNode
      seeAllHref: string
      items: IndividualCourse[]
    }
  | {
      id: 'podcast-spotlight' | 'podcasts'
      cardType: 'podcast'
      eyebrow?: string
      title: string
      descriptor?: React.ReactNode
      seeAllHref: string
      items: PodcastRecord[]
    }
  | {
      id:
        | 'package-spotlight'
        | 'topic-bundles'
        | 'review-packages'
        | 'renewal-packages'
        | 'exam-prep-packages'
      cardType: 'package'
      eyebrow?: string
      title: string
      descriptor?: React.ReactNode
      seeAllHref: string
      items: CatalogPackage[]
    }
  | {
      id: 'membership-spotlight'
      cardType: 'membership'
      eyebrow?: string
      title: string
      descriptor?: React.ReactNode
      seeAllHref: string
      items: CatalogMembership[]
    }
  | {
      id: 'featured-series'
      cardType: 'series'
      eyebrow?: string
      title: string
      descriptor?: React.ReactNode
      seeAllHref: string
      items: Series[]
    }
  | {
      id: 'unlock-with-premium'
      cardType: 'unlock'
      eyebrow?: string
      title: string
      descriptor?: React.ReactNode
      seeAllHref: string
      seeAllLabel?: string
      items: IndividualCourse[]
    }
  | {
      id: 'upgrade-banner'
      cardType: 'banner'
    }

/** True when `releasedAt` is within the rolling N-day window ending at
 *  `now`. Items without `releasedAt` are treated as not-new. */
function isRecentlyReleased(
  course: IndividualCourse,
  now: Date = RECOMMENDED_TODAY,
  windowDays: number = NEW_RELEASE_WINDOW_DAYS,
): boolean {
  if (!course.releasedAt) return false
  const parts = course.releasedAt.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return false
  const released = new Date(parts[0], parts[1] - 1, parts[2])
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const cutoff = new Date(startOfToday)
  cutoff.setDate(cutoff.getDate() - windowDays)
  return released >= cutoff && released <= startOfToday
}

/** Title-case "NOVEMBER" → "November". The fixture stores the upper-cased
 *  variant for the LicenseTracker card; the A4 row title needs sentence case. */
function titleCaseMonth(month: string): string {
  if (!month) return month
  return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()
}

/**
 * Builds the ordered list of recommended-for-you shelves for the active
 * brand + membership + profession.
 *
 * Empty shelves are dropped before the array is returned — `CategoryShelf`
 * also returns `null` on an empty `children` list as a defensive second
 * layer. The non-member 2-card-then-LockedTailCard rule lives in
 * `RecommendedForYouPanel.tsx`, not here.
 *
 * Order matches `/recommended-for-you-redesign.md` § 4 "Recommended MVP
 * shortlist": personalized rows lead, editorial/discovery rows follow.
 */
export function buildShelves(
  brand: Brand,
  membership: MembershipState,
  profession: Profession,
): CategoryRow[] {
  const rows: CategoryRow[] = []
  const fixtures = getCatalogFixtures(brand)
  const isMember = membership === 'member'

  // ---- Shelf 1 — A2 "For your {profession.label} license" ----
  const licenseState = LICENSE_STATE_BY_BRAND[brand]
  const licenseMatches = fixtures.individualCourses.filter((c) =>
    c.states.includes(licenseState),
  )
  if (licenseMatches.length >= MIN_SHELF_ITEMS) {
    rows.push({
      id: 'for-your-license',
      cardType: 'course',
      eyebrow: 'Personalized',
      title: `For your ${profession.label} license`,
      descriptor: 'Courses that count toward your active license.',
      seeAllHref: `/catalog?profession=${brand}`,
      items: licenseMatches.slice(0, SHELF_ITEM_CAP),
    })
  }

  // ---- Shelf 2 — A4 "Renew before {month} {day}, {year}" ----
  const { expires, weeksLeft } = LICENSE_TRACKER
  const mandatoryCourses = fixtures.individualCourses.filter(
    (c) => c.badge === 'mandatory',
  )
  if (mandatoryCourses.length >= MIN_SHELF_ITEMS) {
    rows.push({
      id: 'renew-before',
      cardType: 'course-urgent',
      eyebrow: 'Required CE',
      title: `Renew before ${titleCaseMonth(expires.month)} ${expires.day}, ${expires.year}`,
      descriptor: (
        <>
          <strong>{weeksLeft}</strong> weeks left in this license cycle.
        </>
      ),
      seeAllHref: '/catalog?badge=mandatory',
      items: mandatoryCourses.slice(0, SHELF_ITEM_CAP),
    })
  }

  // ---- Upgrade banner (non-members only, in-flow between rows 3 and 4) ----
  // Inserted before the editorial / discovery rows so non-members hit the
  // upsell after the personalized block and right before the aspirational
  // Featured Series shelf — see redesign doc § 6 "Non-member behaviour".
  if (!isMember) {
    rows.push({ id: 'upgrade-banner', cardType: 'banner' })
  }

  // ---- Shelf 3 — B2 "Featured series & collections" ----
  // Hides for brands without curated series. Renders the wider 16:9
  // SeriesCard via the shelf's `cardWidth` override.
  const seriesItems = fixtures.series ?? []
  if (seriesItems.length >= MIN_SHELF_ITEMS) {
    rows.push({
      id: 'featured-series',
      cardType: 'series',
      eyebrow: 'Featured',
      title: 'Featured series & collections',
      descriptor: 'Multi-course bundles curated around a single instructor or theme.',
      seeAllHref: '/catalog?type=series',
      items: seriesItems,
    })
  }

  // ---- Shelf 4 — B1 "New this week" ----
  const newReleases = fixtures.individualCourses
    .filter((c) => isRecentlyReleased(c))
    .sort((a, b) => (b.releasedAt ?? '').localeCompare(a.releasedAt ?? ''))
  if (newReleases.length >= MIN_SHELF_ITEMS) {
    rows.push({
      id: 'new-this-week',
      cardType: 'course',
      eyebrow: 'Fresh in the catalog',
      title: 'New this week',
      seeAllHref: '/catalog?sort=newest',
      items: newReleases.slice(0, SHELF_ITEM_CAP),
    })
  }

  // ---- Shelf 5 — C1 "Quick wins (under 1 hour)" ----
  const quickWins = fixtures.individualCourses.filter((c) => c.hours < 1)
  if (quickWins.length >= MIN_SHELF_ITEMS) {
    rows.push({
      id: 'quick-wins',
      cardType: 'course',
      eyebrow: 'Under 1 hour',
      title: 'Quick wins',
      descriptor: 'Bite-size courses for the gaps between meetings.',
      seeAllHref: '/catalog?maxHours=1',
      items: quickWins.slice(0, QUICK_WINS_CAP),
    })
  }

  // ---- Shelf 6 — C3 "Podcast spotlight" ----
  // Exclude anything already saved in the learner's MY_PODCAST_PLAYLIST so
  // the shelf only surfaces audio they haven't queued. (Catalog podcast IDs
  // and playlist IDs use different prefixes today — `c-…` vs `pc-…` — so
  // the exclusion is a no-op for the current demo fixtures, but the rule
  // is still honored for when IDs eventually align.)
  const playlistIds = new Set(MY_PODCAST_PLAYLIST.map((p) => p.id))
  const podcasts = fixtures.individualCourses
    .filter((c) => c.delivery === 'podcast' && !playlistIds.has(c.id))
    .map((c) => toPodcastRecord(c, fixtures.stateAbbr))
  if (podcasts.length >= MIN_SHELF_ITEMS) {
    rows.push({
      id: 'podcast-spotlight',
      cardType: 'podcast',
      eyebrow: 'Listen on the go',
      title: 'Podcast spotlight',
      descriptor: 'Audio CE from instructors you already trust.',
      seeAllHref: '/my-learning/podcasts?tab=recommended',
      items: podcasts.slice(0, SHELF_ITEM_CAP),
    })
  }

  // ---- Shelf 7 — Package Spotlight ----
  // Brand-specific bundles from `fixtures.packages`. Visual treatment
  // mirrors the catalog's `PackageCard` (`cre-tile-header--neutral` + the
  // big faded `Package` glyph) — see `RecommendedForYouPanel.tsx` for the
  // SimpleCard wiring.
  const packageItems = fixtures.packages
  if (packageItems.length >= MIN_SHELF_ITEMS) {
    rows.push({
      id: 'package-spotlight',
      cardType: 'package',
      eyebrow: 'Curated bundles',
      title: 'Package spotlight',
      descriptor: 'CE packs sized for a single renewal cycle.',
      seeAllHref: '/catalog?type=package',
      items: packageItems.slice(0, SHELF_ITEM_CAP),
    })
  }

  // ---- Shelf 8 — Membership Spotlight ----
  // Brand-specific unlimited-access tiers from `fixtures.memberships`.
  // Mirrors the catalog's `MembershipCard` (`cre-tile-header--primary` +
  // the big faded `Crown` glyph).
  const memberships = fixtures.memberships
  if (memberships.length >= MIN_SHELF_ITEMS) {
    rows.push({
      id: 'membership-spotlight',
      cardType: 'membership',
      eyebrow: 'Unlock unlimited',
      title: 'Membership spotlight',
      descriptor: 'Unlimited CE + premium tools, billed annually.',
      seeAllHref: '/catalog?type=membership',
      items: memberships.slice(0, SHELF_ITEM_CAP),
    })
  }

  // ---- Shelf 9 — D1 "Unlock with Premium" (non-members only) ----
  // The inverted-teaser row. 1 unlocked preview card + 3 locked overlay
  // cards. Curated via `MEMBER_EXCLUSIVE_IDS[brand]`; ids that don't
  // resolve in the active brand's catalog are silently skipped so a stale
  // id never produces a broken card.
  if (!isMember) {
    const byId = new Map(fixtures.individualCourses.map((c) => [c.id, c]))
    const exclusiveItems = MEMBER_EXCLUSIVE_IDS[brand]
      .map((id) => byId.get(id))
      .filter((c): c is IndividualCourse => c != null)
    if (exclusiveItems.length > 0) {
      rows.push({
        id: 'unlock-with-premium',
        cardType: 'unlock',
        eyebrow: 'Members only',
        title: 'Unlock with Premium',
        descriptor: 'Hand-picked by our editors. Try free for 14 days.',
        seeAllHref: '/membership/plans',
        seeAllLabel: 'Compare plans →',
        items: exclusiveItems,
      })
    }
  }

  return rows
}

/* ======================================================================== *
 * Recommended for You PAGE — per-brand category shelves
 * ======================================================================== *
 *
 * The `buildShelves` function above powers the Home dashboard's blended
 * "Recommended for you" band (which cherry-picks its `for-your-license` /
 * `podcast-spotlight` / `package-spotlight` / `membership-spotlight` shelves).
 *
 * `buildRecommendedShelves` below powers the dedicated Recommended for You
 * *page* (the Explore-rail section on `/dashboard-rebrand`, plus the classic
 * `/dashboard` Recommended tab + the `/membership` Recommended tab, which all
 * render `RecommendedForYouPanel`). It emits the brand-specific category list
 * product defined per brand:
 *
 *   Elite      — What's New · My Interests · Mandatory · Podcasts · In Depth
 *                Specialty Bundles · Pharmacology Hours · Webinars · Onsite
 *   FHEA       — My Interests · Free Webinars · Review Packages · Livestream
 *   (fitzgerald) Review Programs · Onsite Review Programs
 *   McKissock  — What's New · My Interests
 *   CRE        — What's New · My Interests
 *   STC        — What's New · My Interests
 *
 * Category filter rules (TODO(data): swap the flag/tag fixtures for the real
 * catalog + interests API):
 *   • "What's New"   — `isNew`, excludes webinars (+ packages, which live in a
 *                       separate array so they never appear on course shelves).
 *   • "My Interests" — `tags` ∩ the learner's selected interests
 *                       (`RECOMMENDED_INTERESTS`), excludes webinars.
 *   • "Mandatory"    — `badge === 'mandatory'`, excludes webinars.
 *   • "Podcasts"     — `delivery === 'podcast'`.
 *   • "In Depth Specialty Bundles" — packages tagged `'Topic Bundle'`.
 *   • "Pharmacology Hours" — `pharmacologyHours > 0`, excludes webinars.
 *   • "Webinars"     — `delivery === 'webinar'`.
 *   • "Onsite"       — `delivery === 'in-person'` (seminar → in-person here).
 *   • "Free Webinars" — `delivery === 'webinar'` && `price === 0`.
 *   • "Review Packages" — packages whose title contains "Review Package".
 *   • "Livestream Review Programs" — webinar (livestream → webinar here) whose
 *                       title contains "Exam Review".
 *   • "Onsite Review Programs" — in-person whose title contains "Exam Review".
 */

/**
 * Per-brand selected-interest tags for the "My Interests" shelf. A demo
 * stand-in for the learner's onboarding-selected interests until that wiring
 * exists. A course surfaces when its `tags` intersect this list.
 *
 * TODO(data): replace with the learner's real selected interests.
 */
export const RECOMMENDED_INTERESTS: Record<Brand, string[]> = {
  cre: ['Ethics', 'Fair Housing', 'Listing'],
  mckissock: ['USPAP', 'Fair Housing', 'Residential'],
  elite: ['Pharmacology', 'Pediatrics', 'Mental Health'],
  fitzgerald: ['FNP Certification', 'AGNP', 'Cardiology'],
  stc: ['SIE', 'Series 7', 'Ethics'],
  xcel: ['Life & Health', 'Exam Prep', 'Ethics'],
}

/** Ordered category list per brand — the page renders shelves in this order,
 *  dropping any that don't clear `MIN_REC_SHELF_ITEMS`. */
type RecCategoryKey =
  | 'whats-new'
  | 'my-interests'
  | 'mandatory'
  | 'podcasts'
  | 'topic-bundles'
  | 'renewal-packages'
  | 'exam-prep-packages'
  | 'pharmacology'
  | 'webinars'
  | 'onsite'
  | 'free-webinars'
  | 'review-packages'
  | 'livestream-review'
  | 'onsite-review'

const CATEGORIES_BY_BRAND: Record<Brand, RecCategoryKey[]> = {
  elite: [
    'whats-new',
    'my-interests',
    'mandatory',
    'podcasts',
    'topic-bundles',
    'pharmacology',
    'webinars',
    'onsite',
  ],
  fitzgerald: [
    'my-interests',
    'free-webinars',
    'review-packages',
    'livestream-review',
    'onsite-review',
  ],
  // McKissock (appraisal) — the appraisal-CE breadth its catalog can fill.
  mckissock: [
    'whats-new',
    'my-interests',
    'mandatory',
    'webinars',
    'renewal-packages',
    'podcasts',
  ],
  // CRE mirrors Elite's breadth with the real-estate-appropriate shelves the
  // catalog can fill (webinars/topic-bundles/pharmacology don't apply or lack
  // enough items, so they're omitted — any that fell short would auto-drop).
  cre: ['whats-new', 'my-interests', 'mandatory', 'renewal-packages', 'podcasts', 'onsite'],
  // STC (financial services) — exam-prep-oriented breadth.
  stc: ['whats-new', 'my-interests', 'mandatory', 'exam-prep-packages', 'podcasts'],
  // XCEL (insurance licensing) — exam-prep breadth like STC, but NO podcasts
  // shelf: XCEL has no podcast product (see the brand file's "No --podcast-*
  // tokens" note), so that shelf would always be empty.
  xcel: ['whats-new', 'my-interests', 'mandatory', 'exam-prep-packages'],
}

/** Lower bound for a page shelf to render. Kept slightly looser (3) than the
 *  Home band's 4 so brand shelves with a modest amount of demo content still
 *  read as a populated row. Below this the shelf drops cleanly. */
export const MIN_REC_SHELF_ITEMS = 3

const notWebinar = (c: IndividualCourse) => c.delivery !== 'webinar'
const titleHas = (c: { title: string }, needle: string) =>
  c.title.toLowerCase().includes(needle.toLowerCase())

/**
 * Builds the Recommended for You *page* shelves for a brand. Keeps the same
 * `CategoryRow[]` shape the panel already renders (course / podcast / package
 * card types), so no panel rendering changes are needed — only the shelf set
 * and copy differ from `buildShelves`.
 */
export function buildRecommendedShelves(brand: Brand): CategoryRow[] {
  const fixtures = getCatalogFixtures(brand)
  const courses = fixtures.individualCourses
  const packages = fixtures.packages
  const interests = new Set(RECOMMENDED_INTERESTS[brand] ?? [])
  const rows: CategoryRow[] = []

  const courseShelf = (
    id: Extract<CategoryRow, { cardType: 'course' }>['id'],
    copy: { eyebrow: string; title: string; descriptor: string; seeAllHref: string },
    items: IndividualCourse[],
  ) => {
    if (items.length >= MIN_REC_SHELF_ITEMS) {
      rows.push({ id, cardType: 'course', ...copy, items: items.slice(0, REC_PAGE_SHELF_CAP) })
    }
  }
  const packageShelf = (
    id: Extract<CategoryRow, { cardType: 'package' }>['id'],
    copy: { eyebrow: string; title: string; descriptor: string; seeAllHref: string },
    items: CatalogPackage[],
  ) => {
    if (items.length >= MIN_REC_SHELF_ITEMS) {
      rows.push({ id, cardType: 'package', ...copy, items: items.slice(0, REC_PAGE_SHELF_CAP) })
    }
  }

  const interestSubtext =
    brand === 'fitzgerald'
      ? 'Programs matched to the topics you told us you care about.'
      : 'Courses matched to the topics you told us you care about.'

  for (const key of CATEGORIES_BY_BRAND[brand]) {
    switch (key) {
      case 'whats-new':
        courseShelf(
          'whats-new',
          {
            eyebrow: 'Fresh in the catalog',
            title: "What's New",
            descriptor: 'The latest courses added for your license — be the first to enroll.',
            seeAllHref: '/catalog?sort=newest',
          },
          courses.filter((c) => c.isNew && notWebinar(c)),
        )
        break
      case 'my-interests':
        courseShelf(
          'my-interests',
          {
            eyebrow: 'Picked for you',
            title: 'My Interests',
            descriptor: interestSubtext,
            seeAllHref: '/catalog',
          },
          courses.filter((c) => notWebinar(c) && (c.tags ?? []).some((t) => interests.has(t))),
        )
        break
      case 'mandatory':
        courseShelf(
          'mandatory',
          {
            eyebrow: 'Required CE',
            title: 'Mandatory',
            descriptor: 'Stay compliant with the courses your license renewal requires.',
            seeAllHref: '/catalog?badge=mandatory',
          },
          courses.filter((c) => c.badge === 'mandatory' && notWebinar(c)),
        )
        break
      case 'podcasts': {
        const podcasts = courses
          .filter((c) => c.delivery === 'podcast')
          .map((c) => toPodcastRecord(c, fixtures.stateAbbr))
        if (podcasts.length >= MIN_REC_SHELF_ITEMS) {
          rows.push({
            id: 'podcasts',
            cardType: 'podcast',
            eyebrow: 'Learn on the go',
            title: 'Podcasts',
            descriptor: 'Earn CE while you commute, walk, or unwind.',
            seeAllHref: '/my-learning/podcasts?tab=recommended',
            items: podcasts.slice(0, REC_PAGE_SHELF_CAP),
          })
        }
        break
      }
      case 'topic-bundles':
        packageShelf(
          'topic-bundles',
          {
            eyebrow: 'Go deeper',
            title: 'In Depth Specialty Bundles',
            descriptor: 'Curated topic bundles that build real expertise in one specialty.',
            seeAllHref: '/catalog?type=package',
          },
          packages.filter((p) => (p.tags ?? []).includes('Topic Bundle')),
        )
        break
      case 'renewal-packages':
        packageShelf(
          'renewal-packages',
          {
            eyebrow: 'One-and-done',
            title: 'Renewal Packages',
            descriptor: 'Everything your renewal requires, bundled for one purchase.',
            seeAllHref: '/catalog?type=package',
          },
          // Renewal + CE bundles — a renewal cycle in a single purchase.
          packages.filter(
            (p) => titleHas(p, 'Renewal') || titleHas(p, 'Package') || titleHas(p, 'CE'),
          ),
        )
        break
      case 'exam-prep-packages':
        packageShelf(
          'exam-prep-packages',
          {
            eyebrow: 'Exam-ready bundles',
            title: 'Exam Prep Packages',
            descriptor: 'Full prep bundles that take you from enrollment to exam day.',
            seeAllHref: '/catalog?type=package',
          },
          // STC's catalog is exam-prep bundles end to end.
          packages,
        )
        break
      case 'pharmacology':
        courseShelf(
          'pharmacology',
          {
            eyebrow: 'Pharmacology credit',
            title: 'Pharmacology Hours',
            descriptor: 'Knock out your pharmacology hours with courses that count.',
            seeAllHref: '/catalog',
          },
          courses.filter((c) => (c.pharmacologyHours ?? 0) > 0 && notWebinar(c)),
        )
        break
      case 'webinars':
        courseShelf(
          'webinars',
          {
            eyebrow: 'Live & scheduled',
            title: 'Webinars',
            descriptor: 'Expert-led sessions you can join in real time.',
            seeAllHref: '/catalog?delivery=webinar',
          },
          courses.filter((c) => c.delivery === 'webinar'),
        )
        break
      case 'onsite':
        courseShelf(
          'onsite',
          {
            eyebrow: 'In person',
            title: 'Onsite',
            descriptor: 'Hands-on learning at a location near you.',
            seeAllHref: '/catalog?delivery=in-person',
          },
          courses.filter((c) => c.delivery === 'in-person'),
        )
        break
      case 'free-webinars':
        courseShelf(
          'free-webinars',
          {
            eyebrow: 'Free for everyone',
            title: 'Free Webinars',
            descriptor: 'No-cost live sessions to sharpen your knowledge.',
            seeAllHref: '/catalog?delivery=webinar',
          },
          courses.filter((c) => c.delivery === 'webinar' && c.price === 0),
        )
        break
      case 'review-packages':
        packageShelf(
          'review-packages',
          {
            eyebrow: 'Exam-ready bundles',
            title: 'Review Packages',
            descriptor: 'Everything you need to prep for certification, in one package.',
            seeAllHref: '/catalog?type=package',
          },
          packages.filter((p) => titleHas(p, 'Review Package')),
        )
        break
      case 'livestream-review':
        courseShelf(
          'livestream-review',
          {
            eyebrow: 'Live exam review',
            title: 'Livestream Review Programs',
            descriptor: 'Instructor-led review programs, streamed to you.',
            seeAllHref: '/catalog?delivery=webinar',
          },
          courses.filter((c) => c.delivery === 'webinar' && titleHas(c, 'Exam Review')),
        )
        break
      case 'onsite-review':
        courseShelf(
          'onsite-review',
          {
            eyebrow: 'In person',
            title: 'Onsite Review Programs',
            descriptor: 'Intensive exam review at a location near you.',
            seeAllHref: '/catalog?delivery=in-person',
          },
          courses.filter((c) => c.delivery === 'in-person' && titleHas(c, 'Exam Review')),
        )
        break
    }
  }

  return rows
}
