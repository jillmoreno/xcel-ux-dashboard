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
    seedAccount('xcel', 'member')
  })

  it('renders a search affordance and a populated grid', () => {
    renderAt('/membership')
    // Brand-aware hero is gone — the page-level tab title lives in
    // `MembershipLandingPage`. The library panel itself now starts
    // with the search input.
    expect(
      screen.getByRole('searchbox', { name: /search the resource library/i }),
    ).toBeInTheDocument()
    // XCEL authors five records (the LMS asserted CRE's twelve here).
    expect(screen.getByText(/^5 results$/i)).toBeInTheDocument()
  })

  it('disables "Clear All Filters" when nothing is filtered', () => {
    renderAt('/membership')
    const clearBtn = screen.getByRole('button', { name: /clear all filters/i })
    expect(clearBtn).toBeDisabled()
  })
})

describe('LibraryPanel — filtering and sorting', () => {
  beforeEach(() => {
    seedAccount('xcel', 'member')
  })

  it('filters by free-text query', () => {
    // "flashcard" appears in exactly one XCEL record.
    renderAt('/membership?q=flashcard')
    expect(screen.getByText(/^1 result$/i)).toBeInTheDocument()
  })

  it('sorts by rating (high to low) when ?sort=rating-desc', () => {
    renderAt('/membership?sort=rating-desc')
    const titles = screen.getAllByRole('link').map((l) => l.textContent ?? '')
    // XCEL's highest-rated record is the flashcard deck at 4.9.
    expect(titles[0]).toMatch(/flashcard/i)
  })

  it('sorts by rating (low to high) when ?sort=rating-asc', () => {
    renderAt('/membership?sort=rating-asc')
    const titles = screen.getAllByRole('link').map((l) => l.textContent ?? '')
    // ...and its lowest is the CE deadlines article at 4.5.
    expect(titles[0]).toMatch(/deadline/i)
  })

  /*
   * NOT PORTED — filter-by-tag, filter-by-status and filter-by-length.
   *
   * They were authored against Elite's library, whose records carry `tags`,
   * a viewed/unviewed `status` and `lengthMinutes`. XCEL's five records set
   * NONE of those three fields, so there is no data for the filters to act on
   * and a ported test would assert an empty result either way — passing
   * without exercising anything, which is worse than an absent test.
   *
   * The filters themselves are untouched in `LibraryPanel`. Restore these
   * alongside XCEL library records that author the fields.
   */

  it('activates Clear All Filters when filters are applied and resets on click', () => {
    // `insurance-licensing` is XCEL's own category (the LMS used Elite's
    // `clinical-skills` here); clearing bounces the count back to all five.
    renderAt('/membership?category=insurance-licensing')
    const clearBtn = screen.getByRole('button', { name: /clear all filters/i })
    expect(clearBtn).not.toBeDisabled()

    act(() => {
      fireEvent.click(clearBtn)
    })

    expect(screen.getByText(/^5 results$/i)).toBeInTheDocument()
    expect(clearBtn).toBeDisabled()
  })
})
