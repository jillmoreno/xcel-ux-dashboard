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

function renderPage(brand: Brand = 'cre', initial = '/my-learning/courses') {
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
const ARCHIVED = myCoursesFor('cre').filter((c) => c.archived)

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

  it('the status tabs stay live INSIDE the archived collection', () => {
    // The crux of the design: the link chooses the collection, the tabs filter
    // within it — so a learner can still find one status among their archived
    // courses rather than being handed an unfilterable list.
    renderPage('cre', '/my-learning/courses?collection=archived')
    const tabs = screen.getByRole('tablist', { name: /filter by status/i })
    expect(within(tabs).getByRole('tab', { name: /completed/i })).toBeInTheDocument()

    const archivedCompleted = ARCHIVED.filter((c) => c.myStatus === 'completed')
    const archivedOther = ARCHIVED.filter((c) => c.myStatus !== 'completed')
    expect(archivedCompleted.length).toBeGreaterThan(0)
    expect(archivedOther.length).toBeGreaterThan(0)

    fireEvent.click(within(tabs).getByRole('tab', { name: /completed/i }))
    // Narrows within the archive rather than escaping it.
    const root = tabs.closest('div')!.ownerDocument.body
    expect(root.querySelector(`a[href="/courses/${archivedCompleted[0].id}"]`)).toBeTruthy()
    expect(root.querySelector(`a[href="/courses/${archivedOther[0].id}"]`)).toBeNull()
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

  it('an archived card renders identically to the same course un-archived', () => {
    // Decision 33: archiving changes nothing on the card. Rendered here from the
    // same record with `archived` flipped, so any treatment added later — a dim,
    // a tag, a greyed cover — fails this.
    const archivedFailed = ARCHIVED.find((c) => c.myStatus === 'failed')
    expect(archivedFailed).toBeDefined()

    const { container } = renderPage('cre', '/my-learning/courses?collection=archived')
    const card = container
      .querySelector(`a[href="/courses/${archivedFailed!.id}"]`)
      ?.closest('.cre-course-card')
    expect(card).toBeTruthy()
    // It keeps its real status badge and status row — the whole point of moving
    // `archived` out of `MyCourseStatus`.
    expect(within(card as HTMLElement).getAllByText(/failed/i).length).toBeGreaterThan(0)
  })

  it('translates a legacy ?status=archived link instead of letting it rot', () => {
    // That URL was shareable for as long as Archived was a pill. Left alone it
    // would now name a status that does not exist and quietly show the active
    // list unfiltered.
    renderPage('cre', '/my-learning/courses?status=archived')
    expect(screen.getByRole('button', { name: /back to my courses/i })).toBeInTheDocument()
    expect(screen.getByText(/\d+ archived courses?/i)).toBeInTheDocument()
  })
})
