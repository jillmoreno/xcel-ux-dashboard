import { useMemo, useState } from 'react'
import { Crown, Library, Lock, Monitor, Package, Podcast, Users, Video } from '@/icons'
import { CourseSheet } from '@/components/courses/CourseSheet'
import { MembershipSheet } from '@/components/courses/MembershipSheet'
import { PackageSheet } from '@/components/courses/PackageSheet'
import { PodcastSheet } from '@/components/courses/PodcastSheet'
import { SeriesSheet } from '@/components/courses/SeriesSheet'
import { IndividualCourseCard } from '@/components/courses/IndividualCourseCard'
import { PodcastCard } from '@/components/courses/PodcastCard'
import { PackageCard } from '@/components/courses/PackageCard'
import { MembershipCard } from '@/components/courses/MembershipCard'
import { multiMembershipsFor, useAccount, type Brand, type Membership } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiBar } from '@/components/lo-fi/LoFiPlaceholders'
import { RecommendedFilters } from './RecommendedFilters'
import { ALL_US_STATES, licensedProfessionsFor, licensedStatesForProfession } from '@/data/licensedStatesFixtures'
import { getCatalogFixtures } from '@/data/catalog'
import type {
  DeliveryMode,
  IndividualCourse,
  Membership as CatalogMembership,
  Package as CatalogPackage,
  Series,
} from '@/data/catalog/types'
import type { PodcastRecord } from '@/data/podcastFixtures'
import {
  buildRecommendedShelves,
  MIN_REC_SHELF_ITEMS,
  type CategoryRow,
} from '@/data/recommendedCategoriesFixtures'
import { CategoryShelf } from './CategoryShelf'
import { LockedTailCard } from './LockedTailCard'
import { SimpleCard } from './SimpleCard'
import { UpgradeBanner } from './UpgradeBanner'

/**
 * Delivery → icon mapping. Mirrors the table in `IndividualCourseCard.tsx`
 * (and the inline icon in `CourseSheet`) so the dashboard's small cards
 * surface the same delivery icon a learner sees when the course sheet
 * opens — `webinar` → Video, `in-person` → Users, etc.
 */
const DELIVERY_ICON: Record<DeliveryMode, React.ComponentType<{ size?: number }>> = {
  online: Monitor,
  podcast: Podcast,
  'in-person': Users,
  webinar: Video,
}

/** Delivery → display label for a course tile's meta row. Mirrors the catalog
 *  `IndividualCourseCard` / the Home Recommended band so the shelf card's meta
 *  reads the same "format" token across surfaces. */
const DELIVERY_LABEL: Record<DeliveryMode, string> = {
  online: 'Course',
  podcast: 'Podcast',
  'in-person': 'In-person',
  webinar: 'Video',
}

/**
 * Card treatment for the panel.
 *   - `plain`   — the original title-only square cover cards + top-left type
 *                 icon (the standalone `/dashboard` Recommended tab + the
 *                 `/membership` Recommended tab keep this — unchanged).
 *   - `meta`    — the same square cover cards but with the format · rating
 *                 meta row, matching the Home dashboard's "Recommended for you"
 *                 section (`DashboardRecommendedBand`). Drops the per-shelf
 *                 accent overrides so the cards read identically to Home.
 *   - `catalog` — the full-size Course Catalog cards (image header + title +
 *                 type/meta + price / "Included with" footer, per member /
 *                 non-member).
 * The Dashboard Rebrand's Recommended-for-You *page* passes `catalogCards` to
 * get the `catalog` style; every other caller keeps `plain`. `meta` is now only
 * reachable via the preview-only `cardStyleOverride` — it used to be the
 * "shelf cards (match Home)" arm of the retired `recommended-page-cards` flag.
 */
type RecCardStyle = 'plain' | 'meta' | 'catalog'

/** Per-shelf accent overrides for the `cardType: 'course'` rows (the `plain`
 *  style only) so each course-flavored row reads as its own block. Shelves
 *  omitted here fall back to the SimpleCard default (`--color-primary-700`).
 *  The `meta` style deliberately drops these to match the Home band, which
 *  uses the default bar for every course card. */
const COURSE_SHELF_ACCENT: Partial<Record<string, string>> = {
  'quick-wins': 'var(--color-secondary-800)',
  'new-this-week': 'var(--color-primary-800)',
}

/* ---- Profession + State filters (Recommended for You page) ------------ *
 *
 * The recommendation items carry `states` but in a mix of full names and
 * abbreviations (some fixtures use "Texas", others "TX"). Normalize to the
 * 2-letter code so the State pills read cleanly (one "TX", not "TX" + "Texas")
 * and the filter matches across both spellings. */
const STATE_NAME_TO_ABBR: Record<string, string> = {
  Texas: 'TX',
  California: 'CA',
  Florida: 'FL',
  'New York': 'NY',
  Pennsylvania: 'PA',
  Illinois: 'IL',
}
function normalizeState(s: string): string {
  return STATE_NAME_TO_ABBR[s] ?? s
}

/** Append a query param to a catalog href, respecting an existing `?`. */
function appendParam(href: string, key: string, value: string): string {
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}${key}=${encodeURIComponent(value)}`
}

/** True when an item is offered in `abbr` — or is not state-specific (podcasts,
 *  series, career tools carry no `states`, so they're national → always kept). */
function itemMatchesState(item: { states?: string[] }, abbr: string): boolean {
  if (!item.states || item.states.length === 0) return true
  return item.states.some((s) => normalizeState(s) === abbr)
}

/** The brand's professions, in membership order. Used only to resolve the
 *  PRIMARY discipline (the first) — the profession every untagged content item
 *  reads as in `professionOf`.
 *
 *  Falls back to the learner's LICENCES when a brand has no membership records,
 *  because that is where its professions live then (XCEL's lines of authority).
 *  Without the fallback the primary resolves to `''`, every untagged item reads
 *  as `''`, and the profession filter empties the whole page — the filter ROWS
 *  already read `licensedProfessionsFor`, so the two sources were disagreeing
 *  about which professions exist. */
function professionsInOrder(brand: Brand): string[] {
  const order: string[] = []
  const seen = new Set<string>()
  for (const m of multiMembershipsFor(brand)) {
    if (!seen.has(m.profession)) {
      seen.add(m.profession)
      order.push(m.profession)
    }
  }
  return order.length ? order : licensedProfessionsFor(brand)
}

/** An item's profession — its explicit tag, else the brand's primary
 *  profession (so untagged courses + the non-course types read as the primary
 *  discipline, matching the Library's `?? primary` rule). */
function professionOf(item: { profession?: string }, primary: string): string {
  return item.profession ?? primary
}

/** Filter a shelf's items by the selected profession + state (banner rows pass
 *  through; stateless items pass the state check). Returns a new row so the
 *  source shelves stay intact. */
function filterRow(
  row: CategoryRow,
  { profession, primary, state }: { profession: string; primary: string; state: string },
): CategoryRow {
  if (row.cardType === 'banner') return row
  // Normalize the query state to the 2-letter code so it matches the item
  // states (which `itemMatchesState` also normalizes) — the pills/selection are
  // full names ("California"), the fixtures store a mix of "CA" / "California".
  const stateAbbr = normalizeState(state)
  const items = (row.items as Array<{ states?: string[]; profession?: string }>).filter(
    (it) =>
      (state === 'all' || itemMatchesState(it, stateAbbr)) &&
      (profession === 'all' || professionOf(it, primary) === profession),
  )
  return { ...row, items } as CategoryRow
}

/**
 * Dashboard › Recommended for You — Spotify-style shelves.
 *
 * Every card cell across the panel renders through `SimpleCard` so the
 * tab reads as one cohesive surface (bold-tinted square + round image +
 * type badge + bold title + small caption below). The richer
 * `IndividualCourseCard` / `CourseCard` / `PodcastCard` / `SeriesCard`
 * components still own the Catalog page and My Courses surfaces; only the
 * recommendation shelves get the simplified treatment — except the Rebrand's
 * Recommended page, which passes `catalogCards` for the full-size catalog
 * cards (`catalog` style).
 *
 * Click semantics are preserved per type:
 *
 *   - Continue (course-progress) → Link to `/courses/:id`
 *   - Course (course / course-urgent) → opens `CourseSheet`
 *   - Podcast → opens `PodcastSheet`
 *   - Series → opens `SeriesSheet` (wider 16:9 cell)
 *   - Locked / Member-only → Link to `/membership/plans`
 *
 * In the `catalog` style the full-size cards manage their own click / sheet /
 * CTA behavior (the same as on the Course Catalog page), so the panel's own
 * sheets aren't triggered for those types.
 */
export function RecommendedForYouPanel({
  catalogCards = false,
  cardStyleOverride,
  showFilters = false,
  hideSeeAll = false,
  arrowsPersistent = false,
}: {
  /** Render the full-size Course Catalog cards (the Dashboard Rebrand's
   *  Recommended page). Every other caller omits this and keeps the original
   *  `plain` shelf cards. */
  catalogCards?: boolean
  /** Force a specific card style, bypassing the flag. Preview-only (the
   *  dev-handoff renders the panel at each style side by side); production
   *  omits it and lets `useCardStyleFlag` read the flag. */
  cardStyleOverride?: RecCardStyle
  /** Show the Profession + State pill filters above the shelves (the Dashboard
   *  Rebrand's Recommended for You page). Gated by the shared `profession-count`
   *  / `state-count` flags. Every other caller omits it. */
  showFilters?: boolean
  /** Drop each shelf's "See All" link (the Dashboard Rebrand's Recommended for
   *  You page — the horizontal carousel is how you see everything, so a See All
   *  is redundant). Every other caller keeps the link. */
  hideSeeAll?: boolean
  /** Keep the shelves' scroll arrows visible whenever scrollable (Recommended
   *  for You page), instead of the default hover-reveal — a persistent,
   *  discoverable "scroll right" affordance. Every other caller hover-reveals. */
  arrowsPersistent?: boolean
} = {}) {
  const { brand, membership } = useAccount()
  // The Recommended page always uses the full-size Course Catalog cards. This
  // was a flag (`recommended-page-cards`, shelf ⇄ large) until the compact
  // "shelf cards (match Home)" option was retired — the page is a browse
  // surface, and the catalog card is the one that carries price / "Included
  // with" / a real sheet. The `meta` render path below is still reachable via
  // `cardStyleOverride` (no production caller uses it) — see the archive row.
  const cardStyle: RecCardStyle = cardStyleOverride ?? (catalogCards ? 'catalog' : 'plain')
  // Profession + State filters (Recommended for You page) — reuse the same
  // learner-property flags the Learning Paths landing + Resource Library use.
  const professionFlag = useFeatureFlag('profession-count')
  const stateFlag = useFeatureFlag('state-count')
  const multipleProfessions = professionFlag.enabled && professionFlag.variant === 'multiple'
  const multipleStates = stateFlag.enabled && stateFlag.variant === 'multiple'
  // The learner's current Profession + State Licensed In selection. Empty = "not
  // yet chosen" → the derived `active*` below fall back to the defaults (first
  // profession, first-alphabetical licensed state).
  const [selectedProfession, setSelectedProfession] = useState('')
  const [selectedState, setSelectedState] = useState('')
  // Per-brand state-name → abbreviation map for the catalog cards' meta row.
  const stateAbbr = useMemo(() => getCatalogFixtures(brand).stateAbbr, [brand])
  const shelves = useMemo(() => buildRecommendedShelves(brand), [brand])
  // Primary discipline — the profession every untagged content item reads as.
  const primaryProfession = useMemo(() => professionsInOrder(brand)[0] ?? '', [brand])

  /* ── Profession + State Licensed In filters ───────────────────────────
   * License-driven, DEPENDENT single-selects (no "All", no counts). A license
   * is a (profession, state) pair, so the State Licensed In row only ever lists
   * the states the learner holds for the selected profession — an invalid pair
   * can't be expressed. The two demo flags slice how much of the license set
   * shows: `multiple` = every profession / every licensed state; `single` = just
   * the first of each (the row still renders — as one selected pill, per design).
   * Rows show whenever the brand has license data (Elite / Fitzgerald today). */
  const allProfessions = useMemo(() => licensedProfessionsFor(brand), [brand])
  const professions = useMemo(
    () => (multipleProfessions ? allProfessions : allProfessions.slice(0, 1)),
    [allProfessions, multipleProfessions],
  )
  const hasLicenseData = professions.length > 0
  const showFilterRows = showFilters && hasLicenseData
  // Active profession = the selection if still valid, else the first (default).
  const activeProfession = professions.includes(selectedProfession)
    ? selectedProfession
    : (professions[0] ?? '')
  // Preview-only: `?statesdemo=<n|all>` swaps the license set for the first N of
  // all 50 states (`all` = every state) so the Live-Preview "24 states" / "50
  // states" variants demonstrate the wrap + "Show all (N)" collapse (real
  // license data tops out under the 6-state cutoff). Read once on mount; 0 (off)
  // on every normal load.
  const statesDemoCount = useMemo(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('statesdemo')
      if (!v) return 0
      if (v === 'all') return ALL_US_STATES.length
      const n = parseInt(v, 10)
      return Number.isFinite(n) && n > 0 ? Math.min(n, ALL_US_STATES.length) : 0
    } catch {
      return 0
    }
  }, [])
  // States the learner is licensed in for the active profession (alpha-sorted),
  // sliced by the state flag (`single` → just the first).
  const activeStates = useMemo(() => {
    const all =
      statesDemoCount > 0 ? ALL_US_STATES.slice(0, statesDemoCount) : licensedStatesForProfession(brand, activeProfession)
    return multipleStates ? all : all.slice(0, 1)
  }, [brand, activeProfession, multipleStates, statesDemoCount])
  // Active state — keep the current selection when the (new) profession still
  // covers it (a shared state stays put across a profession switch); otherwise
  // fall back to the first alphabetically available. This derivation IS the
  // "keep-or-reset" rule — no effect / no silent setState needed.
  const activeState = activeStates.includes(selectedState) ? selectedState : (activeStates[0] ?? '')

  // Scope the shelves ONLY by an axis the learner has MULTIPLES of. Profession
  // scoping is meaningful only across 2+ professions; state scoping only across
  // 2+ states. For a single-profession / single-state learner all content is
  // theirs, so filtering there just thins shelves below the render threshold —
  // the OT/PT demo tags exist to demo profession *switching*, not to hide a solo
  // nurse's courses. `'all'` makes filterRow pass that axis through.
  const shownShelves = useMemo(
    () =>
      showFilterRows && activeProfession && activeState
        ? shelves
            .map((r) =>
              filterRow(r, { profession: activeProfession, primary: primaryProfession, state: activeState }),
            )
            // Apply the same ≥3-items "don't render a sparse shelf" rule AFTER
            // scoping — filtering can thin a shelf below the threshold, and a
            // 1–2 card shelf reads as broken. Banner rows have no items → kept.
            .filter((r) => r.cardType === 'banner' || r.items.length >= MIN_REC_SHELF_ITEMS)
        : shelves,
    [shelves, showFilterRows, activeProfession, activeState, primaryProfession],
  )
  // The shelf "See All" links route to Course Catalog pre-filtered by the
  // selected State (a full name — the catalog's state filter keys off full names).
  const decoratedShelves = useMemo(() => {
    if (!showFilterRows || !activeState) return shownShelves
    return shownShelves.map((r) =>
      r.cardType === 'banner' ? r : { ...r, seeAllHref: appendParam(r.seeAllHref, 'state', activeState) },
    )
  }, [shownShelves, showFilterRows, activeState])

  // Panel-owned sheet state — one instance per kind, driven by the card
  // clicks below. Closing the sheet sets the slot back to `null`.
  const [openCourse, setOpenCourse] = useState<IndividualCourse | null>(null)
  const [openPodcast, setOpenPodcast] = useState<PodcastRecord | null>(null)
  const [openSeries, setOpenSeries] = useState<Series | null>(null)
  const [openPackage, setOpenPackage] = useState<CatalogPackage | null>(null)
  const [openMembership, setOpenMembership] = useState<CatalogMembership | null>(null)
  const { loFi } = useLoFi()

  // Lo-Fi: render 3 placeholder shelves so the page template (multiple
  // horizontal "Spotify-style" rows of square tiles) stays visible
  // without any data, copy, or imagery in the way. Sheets/UpgradeBanner
  // are intentionally skipped — they're details, not template.
  if (loFi) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <LoFiShelf />
        <LoFiShelf />
        <LoFiShelf />
      </div>
    )
  }

  // Defensive: render nothing if the brand has no qualifying shelf. In practice
  // the page always has content (a shelf always drops if it's empty; there is no
  // all-empty page state — see the "shelf empty" decision).
  if (shelves.length === 0) return null

  const isMember = membership === 'member'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {showFilterRows && (
        <RecommendedFilters
          professions={professions}
          selectedProfession={activeProfession}
          onProfession={setSelectedProfession}
          states={activeStates}
          selectedState={activeState}
          onState={setSelectedState}
        />
      )}
      {decoratedShelves.map((row) =>
        renderRow(row, isMember, cardStyle, membership, stateAbbr, {
          setOpenCourse,
          setOpenPodcast,
          setOpenSeries,
          setOpenPackage,
          setOpenMembership,
        }, hideSeeAll, arrowsPersistent),
      )}

      <CourseSheet open={openCourse != null} onClose={() => setOpenCourse(null)} data={openCourse} />
      <PodcastSheet open={openPodcast != null} onClose={() => setOpenPodcast(null)} data={openPodcast} />
      <SeriesSheet open={openSeries != null} onClose={() => setOpenSeries(null)} data={openSeries} />
      <PackageSheet open={openPackage != null} onClose={() => setOpenPackage(null)} data={openPackage} />
      <MembershipSheet
        open={openMembership != null}
        onClose={() => setOpenMembership(null)}
        data={openMembership}
      />
    </div>
  )
}

type SheetHandlers = {
  setOpenCourse: (c: IndividualCourse | null) => void
  setOpenPodcast: (p: PodcastRecord | null) => void
  setOpenSeries: (s: Series | null) => void
  setOpenPackage: (p: CatalogPackage | null) => void
  setOpenMembership: (m: CatalogMembership | null) => void
}

/** The full-size catalog cards need the wider catalog cell (262 / 240) — the
 *  shelf styles keep ShelfScroller's compact default (172 / 140). */
const CATALOG_CARD_WIDTH = { desktop: 262, mobile: 240 }

/* ---- Row dispatcher --------------------------------------------------- */

function renderRow(
  row: CategoryRow,
  isMember: boolean,
  cardStyle: RecCardStyle,
  membership: Membership,
  stateAbbr: Record<string, string>,
  sheets: SheetHandlers,
  hideSeeAll: boolean,
  arrowsPersistent: boolean,
) {
  // The catalog cards are wider, so widen the shelf cell for every card row
  // (the banner has no cells). Series has no catalog card, so it falls back to
  // the meta shelf card and keeps the compact cell.
  const cardWidth =
    cardStyle === 'catalog' && row.cardType !== 'banner' && row.cardType !== 'series'
      ? CATALOG_CARD_WIDTH
      : undefined
  // Catalog (large) cards are tall with only a top image, so the scroll arrows
  // sit over the cards' white bodies — use the dark arrow there. Compact shelf
  // cards (and the series shelf, which stays compact even in catalog mode) keep
  // the light arrow over their cover images.
  const arrowTone: 'light' | 'dark' | undefined = cardWidth ? 'dark' : undefined

  switch (row.cardType) {
    case 'banner':
      return <UpgradeBanner key={row.id} />

    case 'series':
      // Featured Series uses the compact square either way — there's no
      // catalog "series" card, so `catalog` degrades to the meta shelf card.
      return (
        <CategoryShelf
          key={row.id}
          id={row.id}
          eyebrow={row.eyebrow}
          title={row.title}
          descriptor={row.descriptor}
          seeAllHref={row.seeAllHref}
          hideSeeAll={hideSeeAll}
          arrowsPersistent={arrowsPersistent}
        >
          {renderSeriesChildren(row.items, row.id, isMember, cardStyle, sheets.setOpenSeries)}
        </CategoryShelf>
      )

    case 'unlock':
      return (
        <CategoryShelf
          key={row.id}
          id={row.id}
          eyebrow={row.eyebrow}
          title={row.title}
          descriptor={row.descriptor}
          seeAllHref={row.seeAllHref}
          seeAllLabel={row.seeAllLabel ?? 'See All →'}
          cardWidth={cardWidth}
          arrowTone={arrowTone}
          hideSeeAll={hideSeeAll}
          arrowsPersistent={arrowsPersistent}
        >
          {renderUnlockChildren(row.items, cardStyle, membership, stateAbbr, sheets.setOpenCourse)}
        </CategoryShelf>
      )

    default:
      return (
        <CategoryShelf
          key={row.id}
          id={row.id}
          eyebrow={row.eyebrow}
          title={row.title}
          descriptor={row.descriptor}
          seeAllHref={row.seeAllHref}
          cardWidth={cardWidth}
          arrowTone={arrowTone}
          hideSeeAll={hideSeeAll}
          arrowsPersistent={arrowsPersistent}
        >
          {renderStandardChildren(row, isMember, cardStyle, membership, stateAbbr, sheets)}
        </CategoryShelf>
      )
  }
}

/* ---- Standard shelves (course / progress / urgent / podcast) ---------- */

function renderStandardChildren(
  row: Exclude<CategoryRow, { cardType: 'banner' | 'series' | 'unlock' }>,
  isMember: boolean,
  cardStyle: RecCardStyle,
  membership: Membership,
  stateAbbr: Record<string, string>,
  sheets: SheetHandlers,
) {
  const VISIBLE_FOR_NON_MEMBER = 2
  const totalCount = row.items.length
  // The non-member truncation + "Unlock N more" locked tail is only the classic
  // dashboard / membership-tab upsell teaser (`plain`). On the Dashboard Rebrand
  // Recommended page (`catalog` / `meta`) a non-member sees every card as normal —
  // full non-member pricing on the catalog cards, and clicking opens the sheet
  // (same as the Course Catalog).
  const limitNonMember = cardStyle === 'plain'
  const showLock = limitNonMember && !isMember && totalCount > VISIBLE_FOR_NON_MEMBER

  const cards = renderStandardCards(
    row,
    isMember,
    cardStyle,
    membership,
    stateAbbr,
    sheets,
    limitNonMember ? VISIBLE_FOR_NON_MEMBER : Infinity,
  )

  if (showLock) {
    cards.push(
      <LockedTailCard
        key={`${row.id}-locked-tail`}
        hiddenCount={totalCount - VISIBLE_FOR_NON_MEMBER}
      />,
    )
  }

  return cards
}

function renderStandardCards(
  row: Exclude<CategoryRow, { cardType: 'banner' | 'series' | 'unlock' }>,
  isMember: boolean,
  cardStyle: RecCardStyle,
  membership: Membership,
  stateAbbr: Record<string, string>,
  sheets: SheetHandlers,
  visibleForNonMember: number,
) {
  switch (row.cardType) {
    case 'course': {
      // Per-shelf color overrides so each course-flavored row reads as
      // its own accent block (the `plain` style only). The `meta` style drops
      // these to match the Home band (default bar for every course card).
      const accent = cardStyle === 'plain' ? COURSE_SHELF_ACCENT[row.id] : undefined
      const visible = isMember ? row.items : row.items.slice(0, visibleForNonMember)
      return visible.map((c) =>
        renderCourseCard(c, cardStyle, membership, stateAbbr, sheets.setOpenCourse, accent),
      )
    }
    case 'course-urgent': {
      // Renew-Before shelf uses the brighter `--color-primary-500` in the
      // `plain` style so the required-CE row reads as a distinct accent row.
      const accent = cardStyle === 'plain' ? 'var(--color-primary-500)' : undefined
      const visible = isMember ? row.items : row.items.slice(0, visibleForNonMember)
      return visible.map((c) =>
        renderCourseCard(c, cardStyle, membership, stateAbbr, sheets.setOpenCourse, accent),
      )
    }
    case 'podcast': {
      // Podcast Spotlight — teal (secondary) tone. In `meta`/`plain` it's the
      // SimpleCard's no-image tinted-block treatment; in `catalog` it's the
      // catalog `PodcastCard`.
      const visible = isMember ? row.items : row.items.slice(0, visibleForNonMember)
      return visible.map((p) => {
        if (cardStyle === 'catalog') {
          return <PodcastCard key={p.id} data={p} membership={membership} />
        }
        return (
          <SimpleCard
            key={p.id}
            onClick={() => sheets.setOpenPodcast(p)}
            title={p.title}
            Icon={Podcast}
            barColor={
              cardStyle === 'meta'
                ? 'var(--color-secondary-700)'
                : 'var(--color-tertiary-700)'
            }
            iconBg={
              cardStyle === 'meta'
                ? 'var(--color-secondary-700)'
                : 'var(--color-tertiary-700)'
            }
            bannerless={cardStyle === 'meta'}
            meta={cardStyle === 'meta' ? { Icon: Podcast, label: 'Podcast', rating: p.rating } : undefined}
          />
        )
      })
    }
    case 'package': {
      // Package Spotlight — mirrors the catalog's `PackageCard`.
      const visible = isMember ? row.items : row.items.slice(0, visibleForNonMember)
      return visible.map((pkg) => {
        if (cardStyle === 'catalog') {
          return <PackageCard key={pkg.id} data={pkg} membership={membership} />
        }
        return (
          <SimpleCard
            key={pkg.id}
            onClick={() => sheets.setOpenPackage(pkg)}
            title={pkg.title}
            Icon={Package}
            // `meta` matches the Home band (tertiary-700); `plain` keeps the
            // original neutral-700 tile-header.
            barColor={cardStyle === 'meta' ? 'var(--color-tertiary-700)' : 'var(--color-neutral-700)'}
            iconBg={cardStyle === 'meta' ? 'var(--color-tertiary-700)' : 'var(--color-neutral-700)'}
            bannerless={cardStyle === 'meta'}
            meta={cardStyle === 'meta' ? { Icon: Package, label: `Package · ${pkg.hours} hrs` } : undefined}
          />
        )
      })
    }
    case 'membership': {
      // Membership Spotlight — mirrors the catalog's `MembershipCard`.
      const visible = isMember ? row.items : row.items.slice(0, visibleForNonMember)
      return visible.map((m) => {
        if (cardStyle === 'catalog') {
          return <MembershipCard key={m.id} data={m} />
        }
        return (
          <SimpleCard
            key={m.id}
            onClick={() => sheets.setOpenMembership(m)}
            title={m.title}
            Icon={Crown}
            barColor="var(--color-primary-700)"
            iconBg="var(--color-primary-700)"
            bannerless={cardStyle === 'meta'}
            meta={cardStyle === 'meta' ? { Icon: Crown, label: 'Membership' } : undefined}
          />
        )
      })
    }
  }
}

/** One course tile, rendered as the compact `SimpleCard` (plain / meta) or the
 *  full-size catalog `IndividualCourseCard` (catalog). */
function renderCourseCard(
  c: IndividualCourse,
  cardStyle: RecCardStyle,
  membership: Membership,
  stateAbbr: Record<string, string>,
  setOpenCourse: (c: IndividualCourse | null) => void,
  accent?: string,
) {
  if (cardStyle === 'catalog') {
    return <IndividualCourseCard key={c.id} data={c} membership={membership} stateAbbr={stateAbbr} />
  }
  return (
    <SimpleCard
      key={c.id}
      onClick={() => setOpenCourse(c)}
      imageUrl={c.imageUrl}
      title={c.title}
      Icon={DELIVERY_ICON[c.delivery]}
      barColor={accent}
      iconBg={accent}
      // The `meta` (shelf) style renders bannerless image tiles so this page
      // matches the Home "Recommended for you" band's default treatment.
      bannerless={cardStyle === 'meta'}
      meta={
        cardStyle === 'meta'
          ? { Icon: DELIVERY_ICON[c.delivery], label: DELIVERY_LABEL[c.delivery], rating: c.rating }
          : undefined
      }
    />
  )
}

/* ---- Featured Series shelf ------------------------------------------- */

function renderSeriesChildren(
  items: Series[],
  rowId: string,
  isMember: boolean,
  cardStyle: RecCardStyle,
  setOpenSeries: (s: Series | null) => void,
) {
  const VISIBLE_FOR_NON_MEMBER = 2
  const totalCount = items.length
  // Only the classic `plain` upsell surfaces truncate + lock for non-members; the
  // rebrand Recommended page shows the full set (see `renderStandardChildren`).
  const limitNonMember = cardStyle === 'plain'
  const showLock = limitNonMember && !isMember && totalCount > VISIBLE_FOR_NON_MEMBER
  const visible = isMember || !limitNonMember ? items : items.slice(0, VISIBLE_FOR_NON_MEMBER)

  const cards: React.ReactNode[] = visible.map((s) => (
    <SimpleCard
      key={s.id}
      onClick={() => setOpenSeries(s)}
      imageUrl={s.imageUrl}
      title={s.title}
      Icon={Library}
      // No catalog "series" card, so `catalog` degrades to the meta shelf card.
      bannerless={cardStyle !== 'plain'}
      meta={cardStyle !== 'plain' ? { Icon: Library, label: 'Series' } : undefined}
    />
  ))

  if (showLock) {
    cards.push(
      <LockedTailCard
        key={`${rowId}-locked-tail`}
        hiddenCount={totalCount - VISIBLE_FOR_NON_MEMBER}
      />,
    )
  }

  return cards
}

/* ---- Unlock With Premium shelf (inverted teaser) --------------------- */

/** Renders the D1 shelf as 1 unlocked preview + 3 locked-overlay
 *  `SimpleCard`s. Members never see this shelf — `buildShelves` only
 *  emits it for non-members. Clicking any locked card routes to
 *  `/membership/plans`. In the `catalog` style the whole shelf renders as the
 *  full-size catalog cards (which already show the non-member price footer). */
function renderUnlockChildren(
  items: IndividualCourse[],
  cardStyle: RecCardStyle,
  membership: Membership,
  stateAbbr: Record<string, string>,
  setOpenCourse: (c: IndividualCourse | null) => void,
) {
  if (items.length === 0) return []

  if (cardStyle === 'catalog') {
    return items.map((c) => (
      <IndividualCourseCard key={c.id} data={c} membership={membership} stateAbbr={stateAbbr} />
    ))
  }

  const [preview, ...rest] = items
  const cards: React.ReactNode[] = []
  cards.push(
    <SimpleCard
      key={preview.id}
      onClick={() => setOpenCourse(preview)}
      imageUrl={preview.imageUrl}
      title={preview.title}
      Icon={DELIVERY_ICON[preview.delivery]}
      meta={
        cardStyle === 'meta'
          ? { Icon: DELIVERY_ICON[preview.delivery], label: DELIVERY_LABEL[preview.delivery], rating: preview.rating }
          : undefined
      }
    />,
  )
  rest.slice(0, 3).forEach((c) => {
    cards.push(
      <SimpleCard
        key={c.id}
        to="/membership/plans"
        imageUrl={c.imageUrl}
        title={c.title}
        Icon={Lock}
        locked
        meta={
          cardStyle === 'meta'
            ? { Icon: DELIVERY_ICON[c.delivery], label: DELIVERY_LABEL[c.delivery], rating: c.rating }
            : undefined
        }
      />,
    )
  })
  return cards
}

/* ---- Lo-Fi placeholder shelves --------------------------------------- *
 *
 * One shelf = a header row (eyebrow + title bars on the left, see-all
 * bar on the right) above a horizontal row of square tile placeholders
 * mirroring SimpleCard's layout (full-bleed grey image area + a darker
 * grey "title bar" footer). Five tiles per shelf matches what a typical
 * recommended row looks like at desktop width.
 */

function LoFiShelf() {
  return (
    <section
      role="region"
      aria-label="Lo-fi recommended widget"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <LoFiBar width={80} height={10} />
          <LoFiBar width={220} height={16} />
        </div>
        <LoFiBar width={60} height={10} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <LoFiShelfCard key={i} />
        ))}
      </div>
    </section>
  )
}

/** Square tile placeholder mirroring the SimpleCard footprint — grey
 *  image area on top + darker grey "title bar" at the bottom. The
 *  aspect-ratio + bottom bar are what give the shelf its recognizable
 *  Spotify-style silhouette in lo-fi. */
function LoFiShelfCard() {
  return (
    <div
      aria-hidden
      style={{
        aspectRatio: '1 / 1',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, background: 'var(--color-neutral-200)' }} />
      <div
        style={{
          minHeight: 40,
          padding: '8px 12px',
          background: 'var(--color-neutral-300)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <LoFiBar width="70%" height={10} />
      </div>
    </div>
  )
}
