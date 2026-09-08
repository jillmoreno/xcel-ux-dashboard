import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LibraryPanel } from './LibraryPanel'

/**
 * Coverage:
 *   1. Default render — brand-appropriate hero + a populated grid.
 *   2. `?category=clinical-skills` filters the grid down and drops
 *      the "Results" count.
 *   3. Typing in the search input narrows the grid (free-text on
 *      title + description).
 *   4. Sort `?sort=highest-rated` reorders the grid so the top
 *      card carries the highest rating in the fixture.
 *   5. "Clear All Filters" link is disabled when no filters are
 *      set, and active once any filter is applied — clicking it
 *      drops the filter set.
 *
 * We use the Elite brand fixture for tests 2 + 4 because it carries
 * the canonical screenshot categories (Clinical Skills etc.) and the
 * widest rating spread (3.7 → 5.0) for sort assertions.
 */

function seedAccount(brand: string, membership: 'member' | 'non-member') {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand, membership }),
  )
}

function renderAt(path: string) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/membership" element={<LibraryPanel />} />
          </Routes>
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('LibraryPanel — defaults', () => {
  beforeEach(() => {
    seedAccount('cre', 'member')
  })

  it('renders a search affordance and a populated grid', () => {
    renderAt('/membership')
    // Brand-aware hero is gone — the page-level tab title lives in
    // `MembershipLandingPage`. The library panel itself now starts
    // with the search input.
    expect(
      screen.getByRole('searchbox', { name: /search the resource library/i }),
    ).toBeInTheDocument()
    // The CRE fixture has 12 records — assert the count copy
    // matches.
    expect(screen.getByText(/^12 results$/i)).toBeInTheDocument()
  })

  it('disables "Clear All Filters" when nothing is filtered', () => {
    renderAt('/membership')
    const clearBtn = screen.getByRole('button', { name: /clear all filters/i })
    expect(clearBtn).toBeDisabled()
  })
})

describe('LibraryPanel — Elite brand filtering', () => {
  beforeEach(() => {
    seedAccount('elite', 'member')
  })

  it('filters by category and drops the result count', () => {
    renderAt('/membership?category=clinical-skills')
    // Elite's Clinical Skills set is a subset of the brand's 16
    // resources — anything below the brand total confirms the filter
    // is narrowing.
    const countText = screen.getByText(/^\d+ results?$/i).textContent ?? ''
    const count = parseInt(countText, 10)
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(37)
  })

  it('filters by free-text query', () => {
    renderAt('/membership?q=apical')
    // "Apical Pulse Assessment" is the only Elite record with
    // "apical" in its title or description.
    expect(screen.getByText(/^1 result$/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /apical pulse assessment/i }),
    ).toBeInTheDocument()
  })

  it('sorts by rating (high to low) when ?sort=rating-desc', () => {
    renderAt('/membership?sort=rating-desc')
    // The first card link inside the grid should be the
    // 5.0-rated "50 Must-Know Medications for Nurses" record.
    const links = screen.getAllByRole('link')
    const titles = links.map((l) => l.textContent ?? '')
    expect(titles[0]).toMatch(/50 must-know medications/i)
  })

  it('sorts by rating (low to high) when ?sort=rating-asc', () => {
    renderAt('/membership?sort=rating-asc')
    const links = screen.getAllByRole('link')
    const titles = links.map((l) => l.textContent ?? '')
    // Elite's lowest-rated record is "Ostomy Cheat Sheet" at 3.7.
    expect(titles[0]).toMatch(/ostomy cheat sheet/i)
  })

  it('filters by tag when ?tag= is set', () => {
    renderAt('/membership?tag=EKG')
    // Two Elite records carry the EKG tag (EKG Cheat Sheet + the
    // 12-Lead EKG Placement video).
    expect(screen.getByText(/^2 results$/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /ekg cheat sheet/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /12-lead ekg placement/i }),
    ).toBeInTheDocument()
  })

  it('filters by status when ?status=viewed', () => {
    renderAt('/membership?status=viewed')
    // Several Elite records are marked viewed in the fixture
    // (must-know-meds, thyroid-storm, new-grad-pitfalls). Use a
    // robust bound — anything below the brand total of 16 confirms
    // the filter narrowed.
    const countText = screen.getByText(/^\d+ results?$/i).textContent ?? ''
    const count = parseInt(countText, 10)
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(37)
    // Spot-check that a known viewed record IS present and a known
    // unviewed record is NOT.
    expect(
      screen.getByRole('link', { name: /50 must-know medications/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /surviving night shift/i }),
    ).not.toBeInTheDocument()
  })

  it('filters by ?length= range', () => {
    // The Head to Toe Assessment template (5 min) is Elite's
    // shortest record — narrowing to "1-5 min" should drop the rest.
    renderAt('/membership?length=1-5')
    const countText = screen.getByText(/^\d+ results?$/i).textContent ?? ''
    const count = parseInt(countText, 10)
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(37)
    // The 5-min Head to Toe template IS present.
    expect(
      screen.getByRole('link', { name: /head to toe assessment/i }),
    ).toBeInTheDocument()
    // A 12-min record is dropped.
    expect(
      screen.queryByRole('link', { name: /mastering the interview/i }),
    ).not.toBeInTheDocument()
  })

  it('activates Clear All Filters when filters are applied and resets on click', () => {
    renderAt('/membership?category=clinical-skills')
    const clearBtn = screen.getByRole('button', { name: /clear all filters/i })
    expect(clearBtn).not.toBeDisabled()

    act(() => {
      fireEvent.click(clearBtn)
    })

    // After clearing, the count bounces back to the full brand
    // total — Elite ships 37 resources (15 with full copy + 20
    // placeholders + the Career Compass e-book + the New Nurse
    // Cover Letter Template; Shift Survival Guide was retired
    // because its source PDF was over Netlify's deploy threshold).
    expect(screen.getByText(/^37 results$/i)).toBeInTheDocument()
    expect(clearBtn).toBeDisabled()
  })
})
