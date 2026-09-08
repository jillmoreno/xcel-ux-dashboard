import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LearningPathsHome } from '@/components/learning/LearningPathsHome'
import { readViewMode, VIEW_MODE_STORAGE_KEY } from '@/components/learning/learningPathsHomeUtil'
import { learningPathsFor } from '@/data/learningFixtures'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'

const ELITE_PATHS = learningPathsFor('xcel')

beforeEach(() => {
  window.localStorage.clear()
})

function renderHome(onSelect = vi.fn()) {
  // The Grid / Table toggle is gated behind the `learning-paths-table-view`
  // flag (off by default) — enable it so the table view is reachable.
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'learning-paths-table-view': { enabled: true } }),
  )
  render(
    <FeatureFlagProvider>
      <MemoryRouter>
        <LearningPathsHome paths={ELITE_PATHS} onSelect={onSelect} />
      </MemoryRouter>
    </FeatureFlagProvider>,
  )
  return onSelect
}

/** The clickable table rows (each `<tr role="button" aria-label="Open …">`). */
function rowTitles(): string[] {
  return screen
    .getAllByRole('button', { name: /^Open / })
    .map((el) => el.getAttribute('aria-label')!.replace(/^Open /, ''))
}

function switchToTable() {
  fireEvent.click(screen.getByRole('button', { name: 'Table view' }))
}

describe('LearningPathsHome — Table view', () => {
  it('readViewMode round-trips the persisted "table" value', () => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, 'table')
    expect(readViewMode()).toBe('table')
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, 'bogus')
    expect(readViewMode()).toBe('grid')
  })

  it('switches to a table with one clickable row per visible path, and persists the choice', () => {
    renderHome()
    switchToTable()
    // One row per Elite path.
    expect(rowTitles()).toHaveLength(ELITE_PATHS.length)
    // A semantic table with the sortable column headers (Learning Path Name ·
    // Overall Progress · License Expires · Status).
    expect(screen.getByRole('columnheader', { name: /Learning Path Name/ })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(4)
    // Choice persisted.
    expect(window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)).toBe('table')
  })

  it('sorts by name and flips aria-sort when the header is clicked', () => {
    renderHome()
    switchToTable()

    const before = rowTitles()
    const nameHeader = screen.getByRole('columnheader', { name: /Learning Path Name/ })
    expect(nameHeader).toHaveAttribute('aria-sort', 'none')

    // Ascending name sort → alphabetical first row.
    fireEvent.click(within(nameHeader).getByRole('button'))
    const asc = rowTitles()
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
    expect(asc[0]).toBe([...before].sort((a, b) => a.localeCompare(b))[0])

    // Clicking again toggles to descending → reverse order.
    fireEvent.click(within(nameHeader).getByRole('button'))
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
    expect(rowTitles()[0]).toBe([...before].sort((a, b) => b.localeCompare(a))[0])
  })

  it('calls onSelect with the path id when a row is clicked', () => {
    const onSelect = renderHome()
    switchToTable()
    const firstRow = screen.getAllByRole('button', { name: /^Open / })[0]
    fireEvent.click(firstRow)
    expect(onSelect).toHaveBeenCalledTimes(1)
    // Default order preserves the incoming order → first Elite path.
    expect(onSelect).toHaveBeenCalledWith(ELITE_PATHS[0].id)
  })
})
