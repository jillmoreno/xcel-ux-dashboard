import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { CoursesSummaryCardV3 } from '@/components/dashboard/CoursesSummaryCardV3'
import { myCoursesFor } from '@/data/myCoursesFixtures'

function renderCard() {
  return render(
    <AccountProvider>
      <MemoryRouter>
        <CoursesSummaryCardV3 />
      </MemoryRouter>
    </AccountProvider>,
  )
}

/** Convenience — fetch the <dd> for a given legend label. */
function getLegendValue(label: RegExp | string): string | null {
  const dt = screen.queryByText(label)
  if (!dt) return null
  const row = dt.closest('div')
  return row?.querySelector('dd')?.textContent ?? null
}

/** Resolve the gauge segment <path>s by their stroke color token.
 *  jsdom doesn't always surface data-* attributes on SVG nodes via
 *  querySelector, so we key off the stroke color instead — that's the
 *  fixed contract between the component and the design tokens. */
const SEGMENT_STROKE = {
  track: 'var(--color-neutral-100)',
  completed: 'var(--color-success-500)',
  inProgress: 'var(--color-primary-500)',
  notStarted: 'var(--color-neutral-300)',
} as const

function getSegmentPath(key: keyof typeof SEGMENT_STROKE): SVGPathElement | null {
  const stroke = SEGMENT_STROKE[key]
  const paths = Array.from(document.querySelectorAll('svg path'))
  return (paths.find((p) => p.getAttribute('stroke') === stroke) as SVGPathElement | null) ?? null
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('CoursesSummaryCardV3 — Enlarged Half-Donut Gauge', () => {
  it('renders all three legend rows when each bucket has > 0 (CRE)', () => {
    renderCard()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    expect(screen.getByText(/^Courses \(\d+\)$/)).toBeInTheDocument()
  })

  it('does not render the Course Library title or any status pill', () => {
    renderCard()
    expect(screen.queryByText('Course Library')).not.toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
    expect(screen.queryByText('On Pace')).not.toBeInTheDocument()
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
  })

  it('gauge well displays the total count followed by "courses" (CRE)', () => {
    renderCard()
    const total = myCoursesFor('cre').length
    expect(screen.getByText(String(total))).toBeInTheDocument()
    expect(screen.getByText(total === 1 ? 'course' : 'courses')).toBeInTheDocument()
    expect(screen.getByText(`Courses (${total})`)).toBeInTheDocument()
    // Sanity — legend values agree with the underlying fixture counts.
    const courses = myCoursesFor('cre')
    const inProgress = courses.filter((c) => c.myStatus === 'in-progress').length
    const completed = courses.filter((c) => c.myStatus === 'completed').length
    expect(getLegendValue('In Progress')).toBe(String(inProgress))
    expect(getLegendValue('Completed')).toBe(String(completed))
  })

  it('renders all three colored gauge segments when all buckets > 0 (CRE)', () => {
    renderCard()
    expect(getSegmentPath('track')).not.toBeNull()
    expect(getSegmentPath('completed')).not.toBeNull()
    expect(getSegmentPath('inProgress')).not.toBeNull()
    expect(getSegmentPath('notStarted')).not.toBeNull()
  })

  it('hides the In Progress segment + row when inProgress === 0', async () => {
    vi.resetModules()
    vi.doMock('@/data/myCoursesFixtures', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/myCoursesFixtures')>(
          '@/data/myCoursesFixtures',
        )
      const list = actual.myCoursesFor('cre').map((c) => ({
        ...c,
        myStatus: c.myStatus === 'in-progress' ? ('completed' as const) : c.myStatus,
      }))
      return {
        ...actual,
        myCoursesFor: () => list,
        isRecentlyAdded: () => false,
      }
    })
    const [
      { CoursesSummaryCardV3: Card },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/CoursesSummaryCardV3'),
      import('@/context/AccountContext'),
    ])
    render(
      <Provider>
        <MemoryRouter>
          <Card />
        </MemoryRouter>
      </Provider>,
    )
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(getSegmentPath('inProgress')).toBeNull()
    vi.doUnmock('@/data/myCoursesFixtures')
  })

  it('renders the "+ Recently Added" footnote only when recent > 0', async () => {
    renderCard()
    expect(screen.getByText('+ Recently Added')).toBeInTheDocument()

    vi.resetModules()
    vi.doMock('@/data/myCoursesFixtures', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/myCoursesFixtures')>(
          '@/data/myCoursesFixtures',
        )
      return {
        ...actual,
        isRecentlyAdded: () => false,
      }
    })
    const [
      { CoursesSummaryCardV3: Card },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/CoursesSummaryCardV3'),
      import('@/context/AccountContext'),
    ])
    render(
      <Provider>
        <MemoryRouter>
          <Card />
        </MemoryRouter>
      </Provider>,
    )
    const cards = screen.getAllByRole('link', { name: /view all my courses/i })
    expect(cards).toHaveLength(2)
    const second = cards[1].closest('section')!
    expect(within(second).queryByText('+ Recently Added')).not.toBeInTheDocument()
    vi.doUnmock('@/data/myCoursesFixtures')
  })

  it('renders the empty-state when total === 0', async () => {
    vi.resetModules()
    vi.doMock('@/data/myCoursesFixtures', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/myCoursesFixtures')>(
          '@/data/myCoursesFixtures',
        )
      return {
        ...actual,
        myCoursesFor: () => [],
        isRecentlyAdded: () => false,
      }
    })
    const [
      { CoursesSummaryCardV3: Card },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/CoursesSummaryCardV3'),
      import('@/context/AccountContext'),
    ])
    render(
      <Provider>
        <MemoryRouter>
          <Card />
        </MemoryRouter>
      </Provider>,
    )
    expect(screen.getByText('Courses (0)')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('no courses yet')).toBeInTheDocument()
    // Only the neutral track path renders — no colored segments.
    expect(getSegmentPath('track')).not.toBeNull()
    expect(getSegmentPath('completed')).toBeNull()
    expect(getSegmentPath('inProgress')).toBeNull()
    expect(getSegmentPath('notStarted')).toBeNull()
    // Legend has no status rows.
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument()
    expect(screen.queryByText('Not Started')).not.toBeInTheDocument()
    vi.doUnmock('@/data/myCoursesFixtures')
  })

  it('single non-zero segment fills the full arc length (no gap)', async () => {
    // Convert every CRE course to completed so the lone segment is
    // Completed and the gauge should fill the whole half-circle.
    vi.resetModules()
    vi.doMock('@/data/myCoursesFixtures', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/myCoursesFixtures')>(
          '@/data/myCoursesFixtures',
        )
      const list = actual.myCoursesFor('cre').map((c) => ({
        ...c,
        myStatus: 'completed' as const,
      }))
      return {
        ...actual,
        myCoursesFor: () => list,
        isRecentlyAdded: () => false,
      }
    })
    const [
      { CoursesSummaryCardV3: Card },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/CoursesSummaryCardV3'),
      import('@/context/AccountContext'),
    ])
    render(
      <Provider>
        <MemoryRouter>
          <Card />
        </MemoryRouter>
      </Provider>,
    )
    // ARC_LEN = π * R (current R = 70 for the V3 gauge).
    // Single-segment case skips the gap subtraction, so the rendered
    // dasharray's first number equals ARC_LEN exactly.
    const ARC_LEN = Math.PI * 70
    const completedSeg = getSegmentPath('completed')
    const dash = completedSeg?.getAttribute('stroke-dasharray') ?? ''
    const firstNum = parseFloat(dash.split(/\s+/)[0])
    expect(firstNum).toBeCloseTo(ARC_LEN, 5)
    expect(getSegmentPath('inProgress')).toBeNull()
    expect(getSegmentPath('notStarted')).toBeNull()
    vi.doUnmock('@/data/myCoursesFixtures')
  })

  it('View All link routes to /my-learning/courses', () => {
    renderCard()
    const link = screen.getByRole('link', { name: 'View All →' })
    expect(link).toHaveAttribute('href', '/my-learning/courses')
    const bodyLink = screen.getByRole('link', { name: /view all my courses/i })
    expect(bodyLink).toHaveAttribute('href', '/my-learning/courses')
  })
})
