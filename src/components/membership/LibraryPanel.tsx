import { useMemo, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount, multiMembershipsFor } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  categoriesForBrand,
  lengthRangeForBrand,
  libraryConfigFor,
  tagsForBrand,
  type LibraryCategory,
  type LibraryResource,
  type LibraryResourceType,
} from '@/data/membership/libraryFixtures'
import { SearchInput } from '@/components/ui/SearchInput'
import {
  LibraryFilterRail,
  SORT_OPTIONS,
  TYPE_FILTER_OPTIONS,
  type LibrarySort,
  type LibraryStatus,
} from './LibraryFilterRail'
import { LibraryCategoryChips } from './LibraryCategoryChips'
import { LibraryProfessionChips } from './LibraryProfessionChips'
import { LibraryGrid } from './LibraryGrid'

/**
 * Member-facing Resource Library panel rendered under
 * `/membership?tab=library`. Replaced the original
 * `<LibraryComingSoon>` placeholder once the library content
 * shipped.
 *
 * Layout (left → right):
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ [ Search the Resource Library… ]                            │
 *   ├─────────────┬───────────────────────────────────────────────┤
 *   │ FilterRail  │ CategoryChips                                  │
 *   │ ─ Sort      │ ┌──────┐ ┌──────┐ ┌──────┐                   │
 *   │ ─ Length    │ │ Card │ │ Card │ │ Card │  (3-up auto-fill)│
 *   │ ─ Type      │ └──────┘ └──────┘ └──────┘                   │
 *   │ ─ Tags      │                                                │
 *   │ ─ Status    │                                                │
 *   └─────────────┴───────────────────────────────────────────────┘
 *
 * The panel title ("Resource Library") is owned by
 * `MembershipLandingPage` so every tab shares the same canonical
 * heading. This panel only renders content.
 *
 * Every filter is URL-driven so reviewers can deep-link into a
 * filtered view and the browser back-button restores the previous
 * filter set:
 *
 *   ?q=ekg                 — free-text query (title / description)
 *   ?category=clinical-skills — single-select category chip
 *   ?type=video,template   — multi-select content type
 *   ?tag=EKG,IV            — multi-select tag
 *   ?status=viewed         — engagement status (viewed | not-viewed)
 *   ?length=5-15           — minutes range (hyphen-separated)
 *   ?sort=rating-desc      — sort key (default: newest, dropped from URL)
 *
 * The non-member view never reaches this panel — the
 * `<LockedComingSoon tab="library">` from `MembershipLandingPage`
 * sits in front of it.
 */

const STATUS_VALUES: LibraryStatus[] = ['viewed', 'not-viewed']

function parseSort(raw: string | null): LibrarySort {
  return (SORT_OPTIONS.find((o) => o.value === raw)?.value ??
    'newest') as LibrarySort
}

function parseTypes(raw: string | null): Set<LibraryResourceType> {
  if (!raw) return new Set()
  const next = new Set<LibraryResourceType>()
  for (const part of raw.split(',')) {
    if ((TYPE_FILTER_OPTIONS as string[]).includes(part)) {
      next.add(part as LibraryResourceType)
    }
  }
  return next
}

function parseTags(raw: string | null, allowed: string[]): Set<string> {
  if (!raw) return new Set()
  const allowedSet = new Set(allowed)
  const next = new Set<string>()
  for (const part of raw.split(',')) {
    if (allowedSet.has(part)) next.add(part)
  }
  return next
}

function parseStatuses(raw: string | null): Set<LibraryStatus> {
  if (!raw) return new Set()
  const next = new Set<LibraryStatus>()
  for (const part of raw.split(',')) {
    if ((STATUS_VALUES as string[]).includes(part)) {
      next.add(part as LibraryStatus)
    }
  }
  return next
}

function parseCategory(
  raw: string | null,
  allowed: LibraryCategory[],
): LibraryCategory | null {
  if (!raw) return null
  return (allowed as string[]).includes(raw) ? (raw as LibraryCategory) : null
}

/** Resolve the selected profession — the URL value when valid, else the first
 *  profession (the learner's primary membership). `allowed` is empty when the
 *  learner has no professions, in which case there's nothing to select. */
function parseProfession(raw: string | null, allowed: string[]): string | null {
  if (allowed.length === 0) return null
  if (raw && allowed.includes(raw)) return raw
  return allowed[0]
}

/** Parse `?length=low-high`, clamped to the brand bounds. Returns
 *  the bounds when the param is missing or malformed. */
function parseLength(
  raw: string | null,
  bounds: [number, number],
): [number, number] {
  if (!raw) return bounds
  const parts = raw.split('-')
  if (parts.length !== 2) return bounds
  const lo = Number(parts[0])
  const hi = Number(parts[1])
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return bounds
  const [min, max] = bounds
  const clampedLo = Math.max(min, Math.min(lo, max))
  const clampedHi = Math.max(min, Math.min(hi, max))
  // Guarantee low <= high after clamping.
  return clampedLo <= clampedHi
    ? [clampedLo, clampedHi]
    : [clampedHi, clampedLo]
}

export function LibraryPanel({
  cardVariant = 'default',
  hideSearch = false,
  onOpenResource,
}: {
  /** Result-card style. `default` = full LibraryResourceCard;
   *  `shelf` = the compact Recommended-style SimpleCard (used by the
   *  Dashboard Rebrand shell). */
  cardVariant?: 'default' | 'shelf'
  /** Drop the inline search row. Set by the Dashboard Rebrand shell, whose
   *  section hero already carries a search field, so the two don't double up.
   *  The standalone `/membership?tab=library` keeps its search. */
  hideSearch?: boolean
  /** When set (Dashboard Rebrand shell), library cards open the resource viewer
   *  in-shell via this callback instead of navigating to `/resources/:id`. */
  onOpenResource?: (resourceId: string) => void
} = {}) {
  const { brand } = useAccount()
  const config = libraryConfigFor(brand)
  const categories = useMemo(() => categoriesForBrand(brand), [brand])
  const tagOptions = useMemo(() => tagsForBrand(brand), [brand])
  const lengthBounds = useMemo(() => lengthRangeForBrand(brand), [brand])
  // Professions the learner holds (one per membership, de-duped, in order). The
  // first is the primary / default. Also the default profession every resource
  // reads as when it carries no explicit `profession` (Elite content = Nursing).
  const professions = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const m of multiMembershipsFor(brand)) {
      if (!seen.has(m.profession)) {
        seen.add(m.profession)
        list.push(m.profession)
      }
    }
    return list
  }, [brand])
  // The Profession filter row shows only when the learner has multiple
  // professions (`profession-count` flag) AND there are professions to list.
  const professionFlag = useFeatureFlag('profession-count')
  const multipleProfessions =
    professionFlag.enabled && professionFlag.variant === 'multiple' && professions.length > 0
  // The `learning-library-card-style` flag only governs the rebrand's shelf
  // grid. `classic` swaps the shelf cards to the older image-header `default`
  // cards; `image-shelf` keeps the compact square shelf card but floats the
  // title + meta over the cover behind a gradient (no footer band) — the Home
  // "Recommended for you" tile style. The standalone `/membership` library
  // (already `default`) is unaffected.
  const cardStyleFlag = useFeatureFlag('learning-library-card-style').variant ?? 'shelf'
  const effectiveCardVariant =
    cardVariant === 'shelf' && cardStyleFlag === 'classic' ? 'default' : cardVariant
  const shelfBannerless = cardVariant === 'shelf' && cardStyleFlag === 'image-shelf'

  const [params, setParams] = useSearchParams()
  const sort = parseSort(params.get('sort'))
  const selectedTypes = parseTypes(params.get('type'))
  const selectedTags = parseTags(params.get('tag'), tagOptions)
  const selectedStatuses = parseStatuses(params.get('status'))
  const activeCategory = parseCategory(params.get('category'), categories)
  // Selected profession — only meaningful when the row is shown; else null (no
  // profession filtering, all content).
  const selectedProfession = multipleProfessions
    ? parseProfession(params.get('profession'), professions)
    : null
  const query = params.get('q') ?? ''
  const lengthValue = parseLength(params.get('length'), lengthBounds)

  // Same atomic setter pattern as MyCoursesPage / MembershipLandingPage —
  // null / empty drops the param so default state leaves the URL
  // clean.
  const setParam = (key: string, value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value == null || value === '') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const toggleType = (type: LibraryResourceType) => {
    const next = new Set(selectedTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setParam('type', next.size === 0 ? null : Array.from(next).join(','))
  }

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    setParam('tag', next.size === 0 ? null : Array.from(next).join(','))
  }

  const toggleStatus = (status: LibraryStatus) => {
    const next = new Set(selectedStatuses)
    if (next.has(status)) next.delete(status)
    else next.add(status)
    setParam('status', next.size === 0 ? null : Array.from(next).join(','))
  }

  const setLength = (next: [number, number]) => {
    const [lo, hi] = next
    const [boundLo, boundHi] = lengthBounds
    // Drop the param when the range covers the full bounds (== "Any")
    // so the URL stays clean for the default state.
    if (lo === boundLo && hi === boundHi) {
      setParam('length', null)
    } else {
      setParam('length', `${lo}-${hi}`)
    }
  }

  const clearAll = () => {
    setParams(
      (prev) => {
        // Preserve `?tab=library` (and any other unrelated params)
        // when clearing filters — we only drop the filter set.
        const next = new URLSearchParams(prev)
        next.delete('q')
        next.delete('category')
        // Reset the profession back to the default (first membership) — dropping
        // the param restores it. The row itself stays (it's not a filter you
        // clear to empty).
        next.delete('profession')
        next.delete('type')
        next.delete('tag')
        next.delete('status')
        next.delete('length')
        next.delete('sort')
        return next
      },
      { replace: true },
    )
  }

  const filtered = useMemo(
    () =>
      applyFilters(config.resources, {
        query,
        category: activeCategory,
        profession: selectedProfession,
        defaultProfession: professions[0] ?? null,
        types: selectedTypes,
        tags: selectedTags,
        statuses: selectedStatuses,
        length: lengthValue,
        sort,
      }),
    [
      config.resources,
      query,
      activeCategory,
      selectedProfession,
      professions,
      selectedTypes,
      selectedTags,
      selectedStatuses,
      lengthValue,
      sort,
    ],
  )

  const [boundLo, boundHi] = lengthBounds
  const isLengthDefault =
    lengthValue[0] === boundLo && lengthValue[1] === boundHi
  const hasFilters =
    query.length > 0 ||
    activeCategory !== null ||
    // A non-default profession (not the first membership's) counts as a filter.
    (selectedProfession !== null && selectedProfession !== professions[0]) ||
    selectedTypes.size > 0 ||
    selectedTags.size > 0 ||
    selectedStatuses.size > 0 ||
    !isLengthDefault ||
    sort !== 'newest'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Inline search row — replaced the old `<LibraryHero>` band
          (eyebrow + brand-specific title + description + search) once
          the canonical tab title was lifted to `MembershipLandingPage`.
          The search input lives directly above the rail+grid layout
          so the affordance stays reachable without a competing hero.
          Suppressed in the rebrand shell (`hideSearch`), whose section
          hero already carries a search field. */}
      {!hideSearch && (
        <SearchInput
          label="Search the Resource Library"
          placeholder="Search instructors, classes, and topics"
          value={query}
          onChange={(e) =>
            setParam('q', e.target.value === '' ? null : e.target.value)
          }
          style={{ width: '100%', maxWidth: 480 }}
        />
      )}

      <div style={layoutStyle}>
        <LibraryFilterRail
          sort={sort}
          onSortChange={(next) =>
            setParam('sort', next === 'newest' ? null : next)
          }
          lengthBounds={lengthBounds}
          lengthValue={lengthValue}
          onLengthChange={setLength}
          selectedTypes={selectedTypes}
          onToggleType={toggleType}
          tagOptions={tagOptions}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          selectedStatuses={selectedStatuses}
          onToggleStatus={toggleStatus}
          hasFilters={hasFilters}
          onClearAll={clearAll}
        />

        <div style={resultsColStyle}>
          {multipleProfessions && selectedProfession && (
            <LibraryProfessionChips
              professions={professions}
              active={selectedProfession}
              onChange={(next) =>
                // Drop the param when back on the default (first) profession so
                // the URL stays clean for the default view.
                setParam('profession', next === professions[0] ? null : next)
              }
            />
          )}
          {categories.length > 0 && (
            <LibraryCategoryChips
              categories={categories}
              active={activeCategory}
              onChange={(next) => setParam('category', next)}
            />
          )}
          <LibraryGrid
            resources={filtered}
            onClearFilters={clearAll}
            cardVariant={effectiveCardVariant}
            bannerless={shelfBannerless}
            onOpenResource={onOpenResource}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── filter / sort pipeline ───────────────────────────────────────── */

function applyFilters(
  resources: LibraryResource[],
  args: {
    query: string
    category: LibraryCategory | null
    /** Active profession filter, or null when the Profession row is hidden
     *  (single-profession learner) — then no profession scoping is applied. */
    profession: string | null
    /** Profession a resource reads as when it carries no explicit `profession`
     *  (the brand's primary, e.g. Nursing for Elite). */
    defaultProfession: string | null
    types: Set<LibraryResourceType>
    tags: Set<string>
    statuses: Set<LibraryStatus>
    length: [number, number]
    sort: LibrarySort
  },
): LibraryResource[] {
  let working = resources

  if (args.profession) {
    working = working.filter(
      (r) => (r.profession ?? args.defaultProfession) === args.profession,
    )
  }
  if (args.category) {
    working = working.filter((r) => r.category === args.category)
  }
  if (args.types.size > 0) {
    working = working.filter((r) => args.types.has(r.type))
  }
  if (args.tags.size > 0) {
    working = working.filter((r) => r.tag != null && args.tags.has(r.tag))
  }
  if (args.statuses.size > 0) {
    // Status checkboxes are multi-select but mutually exclusive at
    // the data level (each resource is either viewed or not). If
    // both are checked, every resource passes — same as "show all".
    working = working.filter((r) => {
      const isViewed = r.viewed === true
      if (args.statuses.has('viewed') && isViewed) return true
      if (args.statuses.has('not-viewed') && !isViewed) return true
      return false
    })
  }
  {
    const [lo, hi] = args.length
    working = working.filter(
      (r) => r.durationMinutes >= lo && r.durationMinutes <= hi,
    )
  }
  if (args.query.trim().length > 0) {
    const needle = args.query.trim().toLowerCase()
    working = working.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.description.toLowerCase().includes(needle),
    )
  }

  // Sort is the final pass so it doesn't fight the filter chain.
  // "Newest" is the fixture's natural order (top of the array is
  // the most-recently-published asset); we keep that as the default
  // rather than introducing a `publishedAt` field nobody needs yet.
  const sorted = [...working]
  switch (args.sort) {
    case 'rating-desc':
      sorted.sort((a, b) => b.rating - a.rating)
      break
    case 'rating-asc':
      sorted.sort((a, b) => a.rating - b.rating)
      break
    case 'title-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'title-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title))
      break
    case 'newest':
    default:
      // No-op: fixture order is the canonical "newest first" stream.
      break
  }
  return sorted
}

/* ─── styles ───────────────────────────────────────────────────────── */

const layoutStyle: CSSProperties = {
  display: 'grid',
  // 200px left rail, results column flexes to fill remaining space (matches
  // the Courses / Catalog / Certificates filter rails).
  gridTemplateColumns: '200px minmax(0, 1fr)',
  gap: 24,
  alignItems: 'flex-start',
}

const resultsColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  minWidth: 0,
}
