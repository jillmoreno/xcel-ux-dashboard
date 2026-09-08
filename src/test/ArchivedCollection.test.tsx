import { useEffect } from 'react'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider, useAccount, type Brand } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { MyCoursesPage } from '@/pages/MyCoursesPage'
import { myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * Slice 4 — the archived collection.
 *
 * The rule under test is that archiving is a LOCATION (axis E), not a status:
 * the collection is chosen by a link, the status tabs filter *within* it, and
 * an archived card is byte-identical to the same course un-archived.
 */

function Seed({ brand }: { brand: Brand }) {
  const { brand: current, setAccount } = useAccount()
  // In an effect, not during render — setting provider state mid-render warns
  // ("Cannot update a component while rendering a different component") and the
  // warning is the real thing, not noise.
  useEffect(() => {
    if (current !== brand) setAccount(brand, 'member')
  }, [brand, current, setAccount])
  return null
}

function renderPage(brand: Brand = 'xcel', initial = '/my-learning/courses') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <FeatureFlagProvider>
        <AccountProvider>
          <Seed brand={brand} />
          <MyCoursesPage />
        </AccountProvider>
      </FeatureFlagProvider>
    </MemoryRouter>,
  )
}

/** The brand fixtures used below must actually carry archived records, or every
 *  assertion here would pass vacuously. */
const ARCHIVED = myCoursesFor('xcel').filter((c) => c.archived)

beforeEach(() => {
  localStorage.clear()
})

describe('Archived is a location, not a status', () => {
  it('the fixtures carry archived records to assert on', () => {
    expect(ARCHIVED.length).toBeGreaterThan(0)
  })

  it('drops the Archived pill and keeps "View All" named as it was', () => {
    renderPage()
    const tabs = screen.getByRole('tablist', { name: /filter by status/i })
    expect(within(tabs).queryByRole('tab', { name: /^archived$/i })).toBeNull()
    // Renamed to "Active" was considered and rejected — the link beside it is
    // what makes the exclusion legible, so the tab keeps its name.
    expect(within(tabs).getByRole('tab', { name: /view all/i })).toBeInTheDocument()
  })

  it('shows the link with a count, and the count is the whole archive', () => {
    renderPage()
    expect(
      screen.getByRole('button', { name: new RegExp(`View Archived \\(${ARCHIVED.length}\\)`) }),
    ).toBeInTheDocument()
  })

  it('hides the link entirely for a brand with nothing archived', () => {
    // XCEL has no archived records, so the link must not render at all — which
    // is also why the archived collection needs no empty state of its own.
    const none = myCoursesFor('xcel').filter((c) => c.archived)
    expect(none.length).toBe(0)
    renderPage('xcel')
    expect(screen.queryByRole('button', { name: /view archived/i })).toBeNull()
  })

  it('switching collections swaps the link and scopes the result count', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /view archived/i }))
    expect(screen.getByRole('button', { name: /back to my courses/i })).toBeInTheDocument()
    expect(screen.getByText(/\d+ archived courses?/i)).toBeInTheDocument()
    // …and back again.
    fireEvent.click(screen.getByRole('button', { name: /back to my courses/i }))
    expect(screen.getByRole('button', { name: /view archived/i })).toBeInTheDocument()
  })

  it('an archived course never leaks into the active collection', () => {
    // Keyed on ID, not title. CRE deliberately holds two courses called
    // "Georgia Real Estate License Law" — one active, one archived — so a
    // title-based assertion here passes on the wrong card and proves nothing.
    const { container } = renderPage()
    for (const c of ARCHIVED) {
      expect(container.querySelector(`a[href="/courses/${c.id}"]`)).toBeNull()
    }
  })

})
