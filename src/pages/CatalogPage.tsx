import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Monitor, Podcast, Star, StarSolid, Users, Video } from '@/icons'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Radio } from '@/components/ui/Radio'
import { Checkbox } from '@/components/ui/Checkbox'
import { RangeSlider } from '@/components/ui/RangeSlider'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterAccordion } from '@/components/catalog/FilterAccordion'
import { MembershipCard } from '@/components/courses/MembershipCard'
import { PackageCard } from '@/components/courses/PackageCard'
import { IndividualCourseCard } from '@/components/courses/IndividualCourseCard'
import { PodcastCard } from '@/components/courses/PodcastCard'
import { toPodcastRecord } from '@/components/courses/podcastFromCourse'
import { getCatalogFixtures } from '@/data/catalog'
import { useAccount } from '@/context/AccountContext'

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
]

type ProductType = 'memberships' | 'packages' | 'individual'

const CREDIT_HOURS_BOUNDS: [number, number] = [0, 60]
const PRICE_BOUNDS: [number, number] = [0, 500]

export function CatalogPage({
  embedded = false,
  hideSearch = false,
}: { embedded?: boolean; hideSearch?: boolean } = {}) {
  const { brand, membership, profession: activeProfession } = useAccount()
  const fixtures = useMemo(() => getCatalogFixtures(brand), [brand])

  const [profession, setProfession] = useState(fixtures.professionOptions[0].value)
  // Default state filter to "all licensed" — most useful default per brand.
  // A `?state=<full name>` param (the Recommended for You page's "See All" deep
  // link, pre-filtered by the learner's selected state) narrows to that one
  // state on entry when it's a state the brand offers.
  const [searchParams] = useSearchParams()
  const [states, setStates] = useState<Set<string>>(() => {
    const stateParam = searchParams.get('state')
    const known = [...fixtures.licensedStates, ...fixtures.additionalStates]
    if (stateParam && known.includes(stateParam)) return new Set([stateParam])
    return new Set(fixtures.licensedStates)
  })
  // The Course Upsell prototype tiles open the catalog with `?only=courses` to
  // focus the demo on individual courses — Memberships / Packages / Podcasts are
  // hidden. Read-only (like `?ff=`); the normal Course Catalog is unchanged.
  const coursesOnly = searchParams.get('only') === 'courses'
  const [productTypes, setProductTypes] = useState<Set<ProductType>>(() =>
    coursesOnly
      ? new Set<ProductType>(['individual'])
      : new Set(['memberships', 'packages', 'individual']),
  )
  const [creditTypes, setCreditTypes] = useState<Set<string>>(new Set())
  const [creditHours, setCreditHours] = useState<[number, number]>(CREDIT_HOURS_BOUNDS)
  const [priceRange, setPriceRange] = useState<[number, number]>(PRICE_BOUNDS)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')

  // When the user switches brand via the Switch Account panel, reset all
  // filters that point to brand-specific values. Search and sort can carry
  // over. This is the React-docs "adjust state on prop change" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // — preferred over a useEffect with setState.
  const [prevBrand, setPrevBrand] = useState(brand)
  if (prevBrand !== brand) {
    setPrevBrand(brand)
    setProfession(fixtures.professionOptions[0].value)
    setStates(new Set(fixtures.licensedStates))
    setCreditTypes(new Set())
    setCreditHours(CREDIT_HOURS_BOUNDS)
    setPriceRange(PRICE_BOUNDS)
    setProductTypes(new Set(['memberships', 'packages', 'individual']))
  }

  const toggleState = (s: string) => {
    setStates((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const toggleProductType = (t: ProductType) => {
    setProductTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const toggleCreditType = (t: string) => {
    setCreditTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const memberships = useMemo(
    () =>
      fixtures.memberships.filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase())),
    [fixtures, search],
  )
  const packages = useMemo(
    () => fixtures.packages.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase())),
    [fixtures, search],
  )
  const courses = useMemo(() => {
    let list = fixtures.individualCourses.filter(
      (c) => c.delivery !== 'podcast' && (!search || c.title.toLowerCase().includes(search.toLowerCase())),
    )
    if (states.size > 0) list = list.filter((c) => c.states.some((s) => states.has(s)))
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [fixtures, search, sort, states])

  const podcasts = useMemo(() => {
    let list = fixtures.individualCourses.filter(
      (c) => c.delivery === 'podcast' && (!search || c.title.toLowerCase().includes(search.toLowerCase())),
    )
    if (states.size > 0) list = list.filter((c) => c.states.some((s) => states.has(s)))
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [fixtures, search, sort, states])

  const visibleResults = memberships.length + packages.length + courses.length + podcasts.length
  const totalResults = coursesOnly ? courses.length : search ? visibleResults : fixtures.totalResults

  // `coursesOnly` (the upsell-prototype `?only=courses` link) suppresses every
  // non-course section so only Individual Courses show.
  const showMemberships = !coursesOnly && productTypes.has('memberships') && memberships.length > 0
  const showPackages = !coursesOnly && productTypes.has('packages') && packages.length > 0
  const showCourses = productTypes.has('individual') && courses.length > 0
  const showPodcasts = !coursesOnly && podcasts.length > 0
  const noResults = !showMemberships && !showPackages && !showCourses && !showPodcasts

  // Demo tidiness: in the rebrand shell (embedded) cap each section to the
  // first N cards so every row reads as a clean 3-up. The standalone
  // `/catalog` route (embedded = false) still shows the full lists. The
  // "N Options Available" header count uses the capped length so it matches
  // what's rendered.
  const DEMO_SECTION_CAP = 3
  const cap = <T,>(list: T[]): T[] => (embedded ? list.slice(0, DEMO_SECTION_CAP) : list)
  const shownMemberships = cap(memberships)
  const shownPackages = cap(packages)
  const shownPodcasts = cap(podcasts)
  const shownCourses = cap(courses)

  return (
    <div style={{ padding: embedded ? '0 0 64px' : '24px 64px 64px', width: '100%' }}>
      <PageHeader
        title={fixtures.heroTitle}
        hideTitle={embedded}
        right={
          // In the rebrand shell the section hero carries the search, so the
          // embedded page drops its own (mirrors the Resource Library panel).
          hideSearch ? undefined : (
            <SearchInput
              label="Search courses"
              placeholder="Search instructors, classes, topics"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 360 }}
            />
          )
        }
      />
      <Breadcrumb
        items={[
          { label: activeProfession.brandFullName, to: '/catalog' },
          { label: 'All Courses', to: '/catalog' },
          { label: fixtures.professionOptions.find((o) => o.value === profession)?.label ?? 'All' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0, 1fr)', gap: 24, marginTop: 24 }}>
        <FilterRail
          totalResults={totalResults}
          sort={sort}
          onSortChange={setSort}
          profession={profession}
          onProfessionChange={setProfession}
          professionOptions={fixtures.professionOptions}
          professionLabel={fixtures.filterLabels.professionFilter}
          showStateRail={fixtures.filterLabels.showStateRail}
          licensedStates={fixtures.licensedStates}
          additionalStates={fixtures.additionalStates}
          states={states}
          onToggleState={toggleState}
          hasMemberships={fixtures.memberships.length > 0}
          productTypes={productTypes}
          onToggleProductType={toggleProductType}
          hideProductTypeFilter={coursesOnly}
          creditTypeLabel={fixtures.filterLabels.creditTypeFilter}
          creditTypeOptions={fixtures.filterLabels.creditTypeOptions}
          creditTypes={creditTypes}
          onToggleCreditType={toggleCreditType}
          hoursLabel={fixtures.filterLabels.hoursFilter}
          creditHours={creditHours}
          onCreditHoursChange={setCreditHours}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          instructors={fixtures.instructors}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {noResults ? (
            <EmptyState
              title="No matching courses"
              description={`We couldn't find any ${activeProfession.label.toLowerCase()} courses matching your filters. Try clearing the search or selecting more states.`}
            />
          ) : (
            <>
              {showMemberships && (
                <CatalogSection title="Memberships" optionsAvailable={shownMemberships.length}>
                  <CardRow>
                    {shownMemberships.map((m) => (
                      <MembershipCard key={m.id} data={m} />
                    ))}
                  </CardRow>
                </CatalogSection>
              )}

              {showPackages && (
                <CatalogSection title="Packages" optionsAvailable={shownPackages.length}>
                  <CardRow>
                    {shownPackages.map((p) => (
                      <PackageCard key={p.id} data={p} />
                    ))}
                  </CardRow>
                </CatalogSection>
              )}

              {showPodcasts && (
                <CatalogSection title="Podcasts" optionsAvailable={shownPodcasts.length}>
                  <CardRow>
                    {shownPodcasts.map((p) => (
                      <PodcastCard key={p.id} data={toPodcastRecord(p, fixtures.stateAbbr)} />
                    ))}
                  </CardRow>
                </CatalogSection>
              )}

              {showCourses && (
                <CatalogSection title="Individual Courses" optionsAvailable={shownCourses.length}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
                      gap: 12,
                    }}
                  >
                    {shownCourses.map((c) => (
                      <IndividualCourseCard
                        key={c.id}
                        data={c}
                        membership={membership}
                        stateAbbr={fixtures.stateAbbr}
                      />
                    ))}
                  </div>
                </CatalogSection>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CatalogSection({
  title,
  optionsAvailable,
  children,
}: {
  title: string
  optionsAvailable: number
  children: React.ReactNode
}) {
  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 'var(--text-heading-2xl)',
            lineHeight: 'var(--text-heading-2xl--line-height)',
            margin: 0,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h2>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {optionsAvailable} Options Available
        </span>
      </header>
      {children}
    </section>
  )
}

function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
        gap: 12,
      }}
    >
      {children}
    </div>
  )
}

type FilterRailProps = {
  totalResults: number
  sort: string
  onSortChange: (v: string) => void
  profession: string
  onProfessionChange: (v: string) => void
  professionOptions: { value: string; label: string }[]
  professionLabel: string
  showStateRail: boolean
  licensedStates: string[]
  additionalStates: string[]
  states: Set<string>
  onToggleState: (v: string) => void
  productTypes: Set<ProductType>
  onToggleProductType: (t: ProductType) => void
  /** Hide the Product Types filter (the `?only=courses` upsell-prototype view). */
  hideProductTypeFilter?: boolean
  /** Whether the brand sells memberships at all — drops that one checkbox. */
  hasMemberships: boolean
  creditTypeLabel: string
  creditTypeOptions: { value: string; label: string }[]
  creditTypes: Set<string>
  onToggleCreditType: (t: string) => void
  hoursLabel: string
  creditHours: [number, number]
  onCreditHoursChange: (v: [number, number]) => void
  priceRange: [number, number]
  onPriceRangeChange: (v: [number, number]) => void
  instructors: string[]
}

function FilterRail({
  totalResults,
  sort,
  onSortChange,
  profession,
  onProfessionChange,
  professionOptions,
  professionLabel,
  showStateRail,
  licensedStates,
  additionalStates,
  states,
  onToggleState,
  productTypes,
  onToggleProductType,
  hideProductTypeFilter,
  hasMemberships,
  creditTypeLabel,
  creditTypeOptions,
  creditTypes,
  onToggleCreditType,
  hoursLabel,
  creditHours,
  onCreditHoursChange,
  priceRange,
  onPriceRangeChange,
  instructors,
}: FilterRailProps) {
  const stateCount = states.size
  return (
    <aside aria-label="Catalog filters" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {totalResults} Results
      </div>
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 6,
          }}
        >
          Sort By
        </label>
        <Select
          label="Sort by"
          options={SORT_OPTIONS}
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          style={{ width: '100%' }}
          valueWeight={400}
        />
      </div>

      <div style={{ marginTop: 4 }}>
        <FilterAccordion label={professionLabel} activeCount={profession ? 1 : 0} defaultOpen>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {professionOptions.map((opt) => (
              <Radio
                key={opt.value}
                name="profession"
                value={opt.value}
                checked={profession === opt.value}
                onChange={() => onProfessionChange(opt.value)}
                label={opt.label}
              />
            ))}
          </div>
        </FilterAccordion>

        {showStateRail && (
          <FilterAccordion label="State" activeCount={stateCount} defaultOpen>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 4px',
                  }}
                >
                  My Licensed States
                </p>
                {licensedStates.map((s) => (
                  <Checkbox key={s} label={s} value={s} checked={states.has(s)} onChange={() => onToggleState(s)} />
                ))}
              </div>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 4px',
                  }}
                >
                  Additional States
                </p>
                {additionalStates.map((s) => (
                  <Checkbox key={s} label={s} value={s} checked={states.has(s)} onChange={() => onToggleState(s)} />
                ))}
              </div>
            </div>
          </FilterAccordion>
        )}

        {!hideProductTypeFilter && (
          <FilterAccordion label="Product Types" activeCount={productTypes.size} defaultOpen>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Only offered when the brand actually sells memberships. XCEL
                  sells transactional course packages and has none, so the
                  checkbox would filter a catalogue down to nothing. */}
              {hasMemberships && (
                <Checkbox
                  label="Memberships"
                  checked={productTypes.has('memberships')}
                  onChange={() => onToggleProductType('memberships')}
                />
              )}
              <Checkbox
                label="Packages"
                checked={productTypes.has('packages')}
                onChange={() => onToggleProductType('packages')}
              />
              <Checkbox
                label="Individual Courses"
                checked={productTypes.has('individual')}
                onChange={() => onToggleProductType('individual')}
              />
            </div>
          </FilterAccordion>
        )}

        <FilterAccordion label="Course Type">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Checkbox label="Online" checked={false} onChange={() => {}} icon={<Monitor size={14} aria-hidden />} />
            <Checkbox label="Podcast" checked={false} onChange={() => {}} icon={<Podcast size={14} aria-hidden />} />
            <Checkbox label="In Person" checked={false} onChange={() => {}} icon={<Users size={14} aria-hidden />} />
            <Checkbox label="Webinar" checked={false} onChange={() => {}} icon={<Video size={14} aria-hidden />} />
          </div>
        </FilterAccordion>

        <FilterAccordion label={creditTypeLabel} activeCount={creditTypes.size}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {creditTypeOptions.map((opt) => (
              <Checkbox
                key={opt.value}
                label={opt.label}
                checked={creditTypes.has(opt.value)}
                onChange={() => onToggleCreditType(opt.value)}
              />
            ))}
          </div>
        </FilterAccordion>

        <FilterAccordion
          label={hoursLabel}
          activeCount={creditHours[0] === CREDIT_HOURS_BOUNDS[0] && creditHours[1] === CREDIT_HOURS_BOUNDS[1] ? 0 : 1}
        >
          <RangeSlider
            label={hoursLabel}
            min={CREDIT_HOURS_BOUNDS[0]}
            max={CREDIT_HOURS_BOUNDS[1]}
            value={creditHours}
            onChange={onCreditHoursChange}
          />
          {(creditHours[0] !== CREDIT_HOURS_BOUNDS[0] || creditHours[1] !== CREDIT_HOURS_BOUNDS[1]) && (
            <ClearLink onClick={() => onCreditHoursChange(CREDIT_HOURS_BOUNDS)} />
          )}
        </FilterAccordion>

        <FilterAccordion
          label="Price"
          activeCount={priceRange[0] === PRICE_BOUNDS[0] && priceRange[1] === PRICE_BOUNDS[1] ? 0 : 1}
        >
          <RangeSlider
            label="Price"
            prefix="$"
            min={PRICE_BOUNDS[0]}
            max={PRICE_BOUNDS[1]}
            value={priceRange}
            onChange={onPriceRangeChange}
          />
          {(priceRange[0] !== PRICE_BOUNDS[0] || priceRange[1] !== PRICE_BOUNDS[1]) && (
            <ClearLink onClick={() => onPriceRangeChange(PRICE_BOUNDS)} />
          )}
        </FilterAccordion>

        <FilterAccordion label="Rating">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[4, 3, 2, 1].map((stars) => (
              <Checkbox
                key={stars}
                label="& Up"
                checked={false}
                onChange={() => {}}
                icon={<StarRow filled={stars} />}
              />
            ))}
          </div>
        </FilterAccordion>

        <FilterAccordion label="Instructor">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {instructors.map((name) => (
              <Checkbox key={name} label={name} checked={false} onChange={() => {}} />
            ))}
          </div>
        </FilterAccordion>
      </div>
    </aside>
  )
}

function StarRow({ filled }: { filled: number }) {
  return (
    <span aria-hidden style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= filled ? (
          <StarSolid key={i} size={14} style={{ color: 'var(--color-warning-500)' }} />
        ) : (
          <Star key={i} size={14} style={{ color: 'var(--color-neutral-400)' }} />
        ),
      )}
    </span>
  )
}

function ClearLink({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: 'var(--color-action)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Clear
      </button>
    </div>
  )
}
