import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft } from '@/icons'
import { CourseCard } from '@/components/courses/CourseCard'
import { CourseDetailsPanel } from '@/components/courses/CourseDetailsPanel'
import { MyCoursesTable } from '@/components/courses/MyCoursesTable'
import { FilterAccordion } from '@/components/catalog/FilterAccordion'
import { PageHeader } from '@/components/layout/PageHeader'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { Radio } from '@/components/ui/Radio'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  myCoursesFor,
  isRecentlyAdded,
  type MyCourseRecord,
  type MyCourseStatus,
} from '@/data/myCoursesFixtures'
import { useMediaQuery } from '@/utils/useMediaQuery'

/**
 * The status strip's ids — statuses only. `archived` is NOT one of them: it is
 * axis E, a location, and it now has a control whose shape matches that axis
 * (the `View Archived` link) rather than a sixth pill in a status strip.
 */
type StatusFilter = 'current' | 'recently-added' | MyCourseStatus

/**
 * Which collection is on screen. A MODE, not a filter — the two never mix,
 * because an archived card is byte-identical to an active one (decision 33), so
 * a list holding both would show two indistinguishable cards meaning different
 * things. That is also why an "include archived" checkbox was rejected.
 *
 * The status tabs stay live inside either collection: the link chooses the
 * collection, the tabs filter within it.
 */
type Collection = 'active' | 'archived'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Accessed' },
  { value: 'alpha', label: 'Alphabetical' },
  { value: 'enrolled', label: 'Enrollment Date' },
]

const PROFESSION_OPTIONS = [
  { value: 'real-estate-ce', label: 'Real Estate Continuing Education' },
  { value: 'real-estate-license', label: 'Real Estate License Education' },
  { value: 'real-estate-post', label: 'Real Estate Post-Licensing' },
]

const STATE_OPTIONS = ['Alabama', 'Florida', 'Georgia', 'North Carolina', 'South Carolina', 'Tennessee', 'Virginia']

export function MyCoursesPage({
  embedded = false,
  hideSearch = false,
}: { embedded?: boolean; hideSearch?: boolean } = {}) {
  const [params, setParams] = useSearchParams()
  const { brand } = useAccount()
  const courses = useMemo(() => myCoursesFor(brand), [brand])
  // The card kebab opens Course Details. One panel for the whole grid, holding
  // the course it was opened from — the shape `MembershipOverview` uses for the
  // Jump Back In tile. Every kebab on this page was a dead control before this:
  // rendered, labelled for screen readers, and wired to nothing.
  const [detailsCourse, setDetailsCourse] = useState<MyCourseRecord | null>(null)
  // Rebrand-only demo flag: hide the left filter rail so the list runs
  // full-width. Only applies to the embedded (Dashboard Rebrand) Courses
  // section — the standalone /my-learning/courses page is untouched.
  const hideFiltersFlag = useFeatureFlag('courses-hide-filters').enabled
  const hideFilters = embedded && hideFiltersFlag
  const status = (params.get('status') ?? 'current') as StatusFilter
  const collection: Collection = params.get('collection') === 'archived' ? 'archived' : 'active'
  const inArchive = collection === 'archived'
  const requestedView = (params.get('view') ?? 'card') as ViewMode
  // The Card / Table view toggle only shows when the `courses-table-view` flag
  // is on; off (default) → card only, no toggle.
  const tableViewEnabled = useFeatureFlag('courses-table-view').enabled
  // Force card view on narrow viewports — the 10-column table isn't usable
  // below ~700px. URL param is preserved so the table returns on resize.
  const forceCardView = useMediaQuery('(max-width: 700px)')
  const view: ViewMode = forceCardView || !tableViewEnabled ? 'card' : requestedView
  const sort = params.get('sort') ?? 'recent'
  const search = params.get('q') ?? ''
  const profession = params.get('profession') ?? 'real-estate-ce'
  const states = useMemo(() => new Set((params.get('state') ?? '').split(',').filter(Boolean)), [params])

  // The Recently Added tab is a view filter, not a record state. We hide the
  // tab entirely when nothing qualifies — recompute "now" on every render so
  // tests can advance system time and re-render.
  const hasRecentlyAdded = useMemo(
    () => courses.some((c) => isRecentlyAdded(c)),
    [courses],
  )

  // Drives the link's count, and whether it renders at all. Counted across the
  // whole brand rather than the filtered list: it answers "is there anything
  // over there", which must not change as the learner filters over here.
  const archivedCount = useMemo(() => courses.filter((c) => c.archived).length, [courses])

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

  // Deep-linked ?status=recently-added with zero qualifying records falls back
  // to Current and clears the param.
  useEffect(() => {
    if (status === 'recently-added' && !hasRecentlyAdded) {
      setParam('status', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, hasRecentlyAdded])

  // `?status=archived` was a real, shareable URL for as long as Archived was a
  // pill. It now names a status that does not exist, which would silently drop
  // the learner into an unfiltered active list — so translate it to the
  // collection it meant rather than letting the link rot.
  useEffect(() => {
    if (params.get('status') !== 'archived') return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('status')
        next.set('collection', 'archived')
        return next
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const toggleState = (s: string) => {
    const next = new Set(states)
    if (next.has(s)) next.delete(s)
    else next.add(s)
    setParam('state', next.size === 0 ? null : Array.from(next).join(','))
  }

  const filtered = useMemo(() => {
    // TWO AXES, TWO STEPS. The collection scopes first (axis E — a location),
    // then the status tabs filter within whatever that left. Keeping them
    // separate is what lets a learner find the failed course among their
    // archived ones; collapsing them back into one control is what made "View
    // All" read as a lie.
    let list = courses.filter((c) => Boolean(c.archived) === (collection === 'archived'))
    if (status === 'recently-added') {
      // All recently-added records regardless of myStatus.
      list = list.filter((c) => isRecentlyAdded(c))
    } else if (status !== 'current') {
      list = list.filter((c) => c.myStatus === status)
    }
    if (search) list = list.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    if (states.size > 0) list = list.filter((c) => states.has(stateLabel(c.state)))
    list = [...list]
    if (sort === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'enrolled') list.sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))
    else if (sort === 'recent') {
      // On the Recently Added tab, "recent" sorts by enrolledAt desc so the
      // newest additions sit at the top of the list.
      list.sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))
    }
    return list
  }, [courses, collection, status, sort, search, states])

  const statusTabs: PillTabItem<StatusFilter>[] = [
    { id: 'current', label: 'View All' },
    ...(hasRecentlyAdded ? [{ id: 'recently-added' as const, label: 'Recently Added' }] : []),
    { id: 'in-progress', label: 'In Progress' },
    { id: 'not-started', label: 'Not Started' },
    { id: 'completed', label: 'Completed' },
  ]

  return (
    <div style={{ padding: embedded ? '0 0 64px' : '24px 64px 64px', width: '100%' }}>
      <PageHeader
        title="My Courses"
        right={
          // Search + view toggle share the header's right side (toggle sits to
          // the right of the search). In the rebrand shell the section hero
          // carries the search, so the embedded page drops its own — the toggle
          // still shows, top-right under the hero search.
          !hideSearch || (!forceCardView && tableViewEnabled) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!hideSearch && (
                <SearchInput
                  label="Search courses"
                  placeholder="Search Courses"
                  value={search}
                  onChange={(e) => setParam('q', e.target.value)}
                  style={{ width: 360 }}
                />
              )}
              {!forceCardView && tableViewEnabled && (
                <ViewToggle
                  value={requestedView}
                  onChange={(v) => setParam('view', v === 'card' ? null : v)}
                />
              )}
            </div>
          ) : undefined
        }
      />

      <div
        style={{
          display: 'grid',
          // Narrower filter rail + tighter gap so the card grid keeps room in
          // the rebrand shell's constrained content column (was 240px / 32px,
          // which pushed cards off the right edge in the embedded/demo view).
          gridTemplateColumns: hideFilters ? '1fr' : '200px minmax(0, 1fr)',
          gap: 24,
          marginTop: 24,
        }}
      >
          {!hideFilters && (
          <aside aria-label="My Courses filters" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {inArchive
                ? `${filtered.length} archived course${filtered.length === 1 ? '' : 's'}`
                : `${filtered.length} Result${filtered.length === 1 ? '' : 's'}`}
            </p>
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
                onChange={(e) => setParam('sort', e.target.value)}
                style={{ width: '100%' }}
                valueWeight={400}
              />
            </div>
            <div>
              <FilterAccordion label="Profession" activeCount={profession ? 1 : 0}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {PROFESSION_OPTIONS.map((opt) => (
                    <Radio
                      key={opt.value}
                      name="profession"
                      value={opt.value}
                      checked={profession === opt.value}
                      onChange={() => setParam('profession', opt.value)}
                      label={opt.label}
                    />
                  ))}
                </div>
              </FilterAccordion>
              <FilterAccordion label="State" activeCount={states.size}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {STATE_OPTIONS.map((s) => (
                    <Checkbox key={s} label={s} value={s} checked={states.has(s)} onChange={() => toggleState(s)} />
                  ))}
                </div>
              </FilterAccordion>
              <FilterAccordion label="Course Type" />
              <FilterAccordion label="Credit Type" />
              <FilterAccordion label="Credit Hours" />
              <FilterAccordion label="Enrollment Date" />
            </div>
          </aside>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Status tabs left, the collection link right. Two axes, two
                control shapes — pills filter by status, a link switches
                collection. The page header has no room for it (a 360px search
                plus the view toggle), so it lives here, pushed right the way
                Gift Recipients pins its Download link. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <PillTabs
                label="Filter by status"
                items={statusTabs}
                active={status}
                onChange={(v) => setParam('status', v === 'current' ? null : v)}
                size="compact"
              />
              {/* Hidden at zero — a link into an empty room is worse than no
                  link, and its absence is also why the archived collection
                  needs no empty state of its own. */}
              {(inArchive || archivedCount > 0) && (
                <button
                  type="button"
                  className="cre-collection-link"
                  onClick={() => setParam('collection', inArchive ? null : 'archived')}
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    fontWeight: 600,
                    // Colour lives on `.cre-collection-link` in tokens.css, not
                    // here — an inline value beats the stylesheet, so a
                    // `[data-theme]` block could never correct it. It was
                    // `cta-500` inline and failed AA (a11y C6).
                  }}
                >
                  {inArchive ? (
                    <>
                      <ArrowLeft size={14} aria-hidden />
                      Back to My Courses
                    </>
                  ) : (
                    `View Archived (${archivedCount})`
                  )}
                </button>
              )}
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                title="No courses match your filters"
                description="Try clearing some filters, or browse the catalog to enroll in something new."
                actionLabel="Browse Catalog"
                actionTo="/catalog"
              />
            ) : view === 'table' ? (
              <MyCoursesTable rows={filtered} />
            ) : (
              <div
                style={{
                  display: 'grid',
                  // Responsive `1fr` cells (≥3 per row even in the rebrand
                  // shell's narrower content column); `fluid` lets the card
                  // shrink to fill the cell instead of forcing 265px.
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
                  gap: 16,
                }}
              >
                {filtered.map((course) => (
                  <CourseCard
                    key={course.id}
                    data={course}
                    compact
                    fluid
                    onKebab={() => setDetailsCourse(course)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Body intentionally empty — slice 2 builds the route, slice 3 the
            destination. An empty panel still beats a button that does nothing. */}
        <CourseDetailsPanel
          open={detailsCourse !== null}
          onClose={() => setDetailsCourse(null)}
          course={detailsCourse}
        />
    </div>
  )
}

function stateLabel(code: string): string {
  const map: Record<string, string> = {
    AL: 'Alabama',
    FL: 'Florida',
    GA: 'Georgia',
    NC: 'North Carolina',
    SC: 'South Carolina',
    TN: 'Tennessee',
    VA: 'Virginia',
  }
  return map[code] ?? code
}
