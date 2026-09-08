import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProgressTrackerCard } from '@/components/learning/ProgressTrackerCard'
import { learningPathsFor, type LearningPathSummary } from '@/data/learningFixtures'

const WITH_BREAKDOWN = learningPathsFor('elite')[0] // Florida Nursing — mandatory + elective
// A path with neither category breakdown — exercises the single-color fallback.
const NO_BREAKDOWN: LearningPathSummary = {
  id: 'test-no-breakdown',
  title: 'Path Without A Breakdown',
  category: 'Continuing Education',
  state: 'FL',
  hours: 10,
  progressPct: 40,
  lastViewedAt: '2026-01-01T00:00:00Z',
}
// Only Mandatory authored (Elective absent) → one real category → the
// breakdown is suppressed regardless of the bars/compact variant.
const ONLY_MANDATORY: LearningPathSummary = {
  ...NO_BREAKDOWN,
  id: 'test-only-mandatory',
  mandatory: { completed: 4, required: 10 },
}

type CardProps = Partial<Parameters<typeof ProgressTrackerCard>[0]>

function renderCard(path: LearningPathSummary, props?: CardProps) {
  return render(
    <MemoryRouter>
      <ProgressTrackerCard path={path} {...props} />
    </MemoryRouter>,
  )
}

/** Count the Mandatory/Elective progress-bar tracks (8px-tall clipped bars) —
 *  present in the `bars` layout, absent in `compact`. */
function barTrackCount(container: HTMLElement): number {
  return [...container.querySelectorAll('div')].filter(
    (d) => d.style.height === '8px' && d.style.overflow === 'hidden',
  ).length
}

describe('ProgressTrackerCard — category breakdown', () => {
  it('renders Mandatory/Elective bars + a segmented gauge in the default (bars) layout', () => {
    const { container } = renderCard(WITH_BREAKDOWN)
    expect(screen.getByText('Mandatory')).toBeInTheDocument()
    expect(screen.getByText('Elective')).toBeInTheDocument()
    // Two category progress bars are drawn.
    expect(barTrackCount(container)).toBe(2)
    // Two-segment gauge → an Elective (secondary) arc is drawn.
    expect(container.querySelectorAll('circle[stroke="var(--color-category-elective)"]').length).toBeGreaterThan(0)
  })

  it('drops the bars (stacked count under each label) in the compact layout, keeping the segmented gauge', () => {
    const { container } = renderCard(WITH_BREAKDOWN, { breakdownLayout: 'compact' })
    // The compact legend still labels both categories…
    expect(screen.getByText('Mandatory')).toBeInTheDocument()
    expect(screen.getByText('Elective')).toBeInTheDocument()
    // …but renders NO progress bars.
    expect(barTrackCount(container)).toBe(0)
    // The segmented two-color gauge is unchanged.
    expect(container.querySelectorAll('circle[stroke="var(--color-category-elective)"]').length).toBeGreaterThan(0)
  })

  it('omits the bars + uses a single-color gauge when the path has no breakdown', () => {
    const { container } = renderCard(NO_BREAKDOWN)
    expect(screen.queryByText('Mandatory')).toBeNull()
    expect(screen.queryByText('Elective')).toBeNull()
    expect(barTrackCount(container)).toBe(0)
    expect(container.querySelectorAll('circle[stroke="var(--color-category-elective)"]').length).toBe(0)
  })

  it.each(['bars', 'compact'] as const)(
    'suppresses the split for a single-category path (only Mandatory) in the %s layout',
    (breakdownLayout) => {
      const { container } = renderCard(ONLY_MANDATORY, { breakdownLayout })
      // No legend/bars — the single-category rule collapses the breakdown.
      expect(screen.queryByText('Mandatory')).toBeNull()
      expect(screen.queryByText('Elective')).toBeNull()
      expect(barTrackCount(container)).toBe(0)
      // Single-color gauge — no Elective (secondary) arc.
      expect(container.querySelectorAll('circle[stroke="var(--color-category-elective)"]').length).toBe(0)
      // Stat tiles still render (pre-breakdown arrangement).
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Time Remaining')).toBeInTheDocument()
    },
  )
})
