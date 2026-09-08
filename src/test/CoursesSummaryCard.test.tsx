import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { CoursesSummaryCard } from '@/components/dashboard/CoursesSummaryCard'

function renderCard() {
  return render(
    <AccountProvider>
      <MemoryRouter>
        <CoursesSummaryCard />
      </MemoryRouter>
    </AccountProvider>,
  )
}

beforeEach(() => {
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
        isRecentlyAdded: () => false }
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
        isRecentlyAdded: () => false }
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

  it('View All link routes to /my-learning/courses', () => {
    renderCard()
    const link = screen.getByRole('link', { name: 'View All →' })
    expect(link).toHaveAttribute('href', '/my-learning/courses')
    const bodyLink = screen.getByRole('link', { name: /view all my courses/i })
    expect(bodyLink).toHaveAttribute('href', '/my-learning/courses')
  })
})
