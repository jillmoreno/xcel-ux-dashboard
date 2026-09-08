import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { CoursesSummaryCard } from '@/components/dashboard/CoursesSummaryCard'
import { myCoursesFor } from '@/data/myCoursesFixtures'

function renderCard() {
  return render(
    <AccountProvider>
      <MemoryRouter>
        <CoursesSummaryCard />
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

beforeEach(() => {
  // Each test renders against the default fixture brand (CRE) unless
  // it explicitly persists a different brand to localStorage.
  window.localStorage.clear()
})

describe('CoursesSummaryCard — Completion Gauge', () => {
  it('renders all three legend rows when each bucket has > 0 (CRE)', () => {
    renderCard()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    expect(screen.getByText(/^Courses \(\d+\)$/)).toBeInTheDocument()
  })

  it('gauge aria-label reports completed / total + percentage (CRE)', () => {
    renderCard()
    const courses = myCoursesFor('cre')
    const total = courses.length
    const completed = courses.filter((c) => c.myStatus === 'completed').length
    const pct = Math.round((completed / total) * 100)
    expect(
      screen.getByRole('img', {
        name: `${completed} of ${total} courses completed (${pct}%)`,
      }),
    ).toBeInTheDocument()
  })

  it('hides the In Progress legend row when inProgress === 0', async () => {
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
      { CoursesSummaryCard: Card },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/CoursesSummaryCard'),
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
      { CoursesSummaryCard: Card },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/CoursesSummaryCard'),
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

  it('does not render the Course Library title or any status pill', () => {
    renderCard()
    expect(screen.queryByText('Course Library')).not.toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
    expect(screen.queryByText('On Pace')).not.toBeInTheDocument()
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
  })

  it('renders the empty-library state when total === 0', async () => {
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
      { CoursesSummaryCard: Card },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/CoursesSummaryCard'),
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
    // Empty-library gauge — aria-label flips to the no-progress copy.
    expect(screen.getByRole('img', { name: '0 courses enrolled' })).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('courses')).toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument()
    expect(screen.queryByText('Not Started')).not.toBeInTheDocument()
    vi.doUnmock('@/data/myCoursesFixtures')
  })

  it('gauge center total matches myCoursesFor(brand).length for the active brand', () => {
    renderCard()
    const total = myCoursesFor('cre').length
    expect(screen.getByText(String(total))).toBeInTheDocument()
    expect(screen.getByText('courses')).toBeInTheDocument()
    expect(screen.getByText(`Courses (${total})`)).toBeInTheDocument()
    // Sanity — legend values agree with the underlying fixture counts.
    const courses = myCoursesFor('cre')
    const inProgress = courses.filter((c) => c.myStatus === 'in-progress').length
    const completed = courses.filter((c) => c.myStatus === 'completed').length
    expect(getLegendValue('In Progress')).toBe(String(inProgress))
    expect(getLegendValue('Completed')).toBe(String(completed))
  })

  it('View All link routes to /my-learning/courses', () => {
    renderCard()
    const link = screen.getByRole('link', { name: 'View All →' })
    expect(link).toHaveAttribute('href', '/my-learning/courses')
    const bodyLink = screen.getByRole('link', { name: /view all my courses/i })
    expect(bodyLink).toHaveAttribute('href', '/my-learning/courses')
  })
})
