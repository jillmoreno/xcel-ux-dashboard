import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Monitor, StarSolid, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { useAccount } from '@/context/AccountContext'
import { getCatalogFixtures } from '@/data/catalog'
import type { IndividualCourse, Series } from '@/data/catalog/types'
import { imageForIndex } from '@/utils/courseImage'

type Props = {
  open: boolean
  onClose: () => void
  data: Series | null
}

/**
 * Slide-over panel opened by the dashboard's series-flavored
 * `SimpleCard`. Mirrors the `PackageSheet` pattern exactly — same Sheet
 * primitive, same 100px tinted header, same two-tab body (Description /
 * Included Courses), same footer CTA bar pattern — so series read as a
 * sibling of packages and memberships across the platform.
 *
 * Resolves each `series.courseIds[]` entry against the active brand's
 * `individualCourses` array; ids that can't be resolved are silently
 * skipped so a stale series fixture never produces a broken row.
 *
 * CTA routing — see acceptance criteria #6:
 *   - Member  → "Start the series →" linking to `/courses/${firstCourseId}`
 *   - Non-member → "Get this series with Premium" linking to `/membership/plans`
 */
export function SeriesSheet({ open, onClose, data }: Props) {
  const [tab, setTab] = useState<'description' | 'included'>('description')
  const { brand, membership } = useAccount()
  const fixtures = useMemo(() => getCatalogFixtures(brand), [brand])

  // Memoize the resolved courses so the Included tab and the CTA both
  // share the same source-of-truth.
  const resolvedCourses = useMemo<IndividualCourse[]>(() => {
    if (!data) return []
    const byId = new Map(fixtures.individualCourses.map((c) => [c.id, c]))
    return data.courseIds
      .map((id) => byId.get(id))
      .filter((c): c is IndividualCourse => c != null)
  }, [data, fixtures.individualCourses])

  if (!data) return null

  const isMember = membership === 'member'
  const firstCourseId = resolvedCourses[0]?.id ?? data.courseIds[0]

  return (
    <Sheet open={open} onClose={onClose} title="Series Overview">
      <header
        style={{
          height: 100,
          flexShrink: 0,
          padding: '20px 24px 4px',
          background: 'var(--color-neutral-extra-light)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="cre-sheet-close"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '24px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 28,
            lineHeight: 1.2,
            color: 'var(--color-primary-500)',
          }}
        >
          Series Overview
        </h2>
      </header>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-neutral-extra-light)' }}>
        <div style={{ background: 'var(--color-surface-card)', padding: '0 0 0' }}>
          <div
            aria-hidden
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              background: `center / cover no-repeat url(${data.imageUrl})`,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 24px 20px' }}>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
              }}
            >
              Series · {data.courseCount} courses · {data.totalHours} hrs
            </span>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 500,
                lineHeight: '28px',
                color: 'var(--color-text-primary)',
              }}
            >
              {data.title}
            </h3>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--color-text-secondary)',
              }}
            >
              {data.instructor}
              {data.instructorTitle && ` · ${data.instructorTitle}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', padding: '8px 24px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <TabButton active={tab === 'description'} onClick={() => setTab('description')}>
            Description
          </TabButton>
          <TabButton active={tab === 'included'} onClick={() => setTab('included')}>
            Included Courses
          </TabButton>
        </div>

        <div style={{ padding: '20px 24px 32px' }}>
          {tab === 'description' ? (
            <DescriptionTab data={data} resolvedCourses={resolvedCourses} />
          ) : (
            <IncludedCoursesTab resolvedCourses={resolvedCourses} stateAbbr={fixtures.stateAbbr} />
          )}
        </div>
      </div>

      <footer
        style={{
          flexShrink: 0,
          background: 'var(--color-surface-card)',
          borderTop: '1px solid var(--color-border-subtle)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {isMember ? (
          <Link
            to={firstCourseId ? `/courses/${firstCourseId}` : '/catalog'}
            style={primaryButton}
          >
            Start the series →
          </Link>
        ) : (
          <Link to="/membership/plans" style={primaryButton}>
            Get this series with Premium
          </Link>
        )}
      </footer>
    </Sheet>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cre-membership-tab"
      data-active={active ? 'true' : 'false'}
      style={{
        flex: 1,
        position: 'relative',
        background: 'transparent',
        border: 'none',
        padding: '6px 8px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontWeight: 600,
        lineHeight: '28px',
        cursor: 'pointer',
      }}
    >
      <span style={{ padding: '0 8px' }}>{children}</span>
      <span
        aria-hidden
        style={{
          width: '100%',
          height: 4,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: active ? 'var(--color-tab-active)' : 'transparent',
        }}
      />
    </button>
  )
}

function DescriptionTab({
  data,
  resolvedCourses,
}: {
  data: Series
  resolvedCourses: IndividualCourse[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5 }}>
      <section>
        <h4 style={sectionHeading}>About this series</h4>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{data.blurb}</p>
      </section>
      <section>
        <h4 style={sectionHeading}>Instructor</h4>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {data.instructor}
          {data.instructorTitle && ` — ${data.instructorTitle}`}
        </p>
      </section>
      <section>
        <h4 style={sectionHeading}>What you’ll cover</h4>
        <ul style={bulletList}>
          {resolvedCourses.slice(0, 4).map((c) => (
            <li key={c.id}>{c.title}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function IncludedCoursesTab({
  resolvedCourses,
  stateAbbr,
}: {
  resolvedCourses: IndividualCourse[]
  stateAbbr: Record<string, string>
}) {
  if (resolvedCourses.length === 0) {
    return (
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        No courses to show.
      </p>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {resolvedCourses.map((c, i) => (
        <IncludedCourseRow key={c.id} data={c} imageUrl={c.imageUrl ?? imageForIndex(i)} stateAbbr={stateAbbr} />
      ))}
    </div>
  )
}

function IncludedCourseRow({
  data,
  imageUrl,
  stateAbbr,
}: {
  data: IndividualCourse
  imageUrl: string
  stateAbbr: Record<string, string>
}) {
  const firstState = data.states[0] ?? ''
  const stateLabel = stateAbbr[firstState] ?? firstState
  return (
    <article
      className="cre-included-course-row"
      style={{
        display: 'flex',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 96,
          alignSelf: 'stretch',
          flexShrink: 0,
          background: `center / cover no-repeat url(${imageUrl})`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, padding: 12 }}>
        <h4 style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: 'inherit' }}>
          {data.title}
        </h4>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Monitor size={12} aria-hidden />
          Online
          <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
          {data.badge === 'mandatory' ? 'Mandatory' : 'Elective'}
          <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
          {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
        </span>
        <span style={{ fontSize: 12 }}>{stateLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <StarSolid size={12} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
            {data.rating.toFixed(1)}
          </span>
          <Link
            to={`/courses/${data.id}`}
            style={{
              color: 'var(--color-primary-700)',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}

const sectionHeading: React.CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const bulletList: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: 'var(--color-text-secondary)',
}

const primaryButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 20px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
}
