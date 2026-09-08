import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathDetailPanel } from '@/components/learning/LearningPathDetailPanel'
import { learningPathsFor } from '@/data/learningFixtures'

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'elite', membership: 'member' }))
})

const ELITE_PATH = learningPathsFor('xcel')[0] // Florida Nursing CE — mandatory 6/9, elective 8/16

/** Match an element by its full (nested) text content, whitespace-normalized —
 *  needed for spans whose text is broken up by `<b>` / pill children. */
function fullText(s: string) {
  return (_content: string, el: Element | null) =>
    el != null && el.textContent!.replace(/\s+/g, ' ').trim() === s
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathDetailPanel open onClose={() => {}} path={ELITE_PATH} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('LearningPathDetailPanel', () => {
  it('renders a two-segment gauge (Mandatory + Elective arcs)', () => {
    renderPanel()
    // The Sheet portals to document.body, so query the document (not container).
    expect(document.querySelectorAll('circle[stroke="var(--color-category-mandatory)"]').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('circle[stroke="var(--color-category-elective)"]').length).toBeGreaterThan(0)
    // The donut carries a descriptive percent-complete aria-label.
    expect(screen.getByLabelText(/\d+% of required credit hours complete/i)).toBeInTheDocument()
  })

  it('shows the breakdown counts (gauge bars + section headers share the format)', () => {
    renderPanel()
    // "6 / 9 hrs" now renders twice: the CategoryBars label and the
    // dashed-leader "Mandatory courses" section header. Both must be present.
    expect(screen.getAllByText(fullText('6 / 9 hrs')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(fullText('8 / 16 hrs')).length).toBeGreaterThan(0)
  })

  it('keeps the CTA row visible on both tabs', () => {
    renderPanel()
    // Progress tab (default).
    expect(screen.getByRole('button', { name: /go to learning path/i })).toBeInTheDocument()
    // Switch to Requirements — CTA row is pinned above the tabs, so it stays.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^requirements$/i }))
    })
    expect(screen.getByRole('button', { name: /go to learning path/i })).toBeInTheDocument()
    // …and the Requirements content is now showing.
    expect(screen.getByText(/florida board of nursing/i)).toBeInTheDocument()
  })

  it('shows "View Certificate" on completed courses but not on not-started ones', () => {
    renderPanel()
    // 3 completed mandatory + 2 completed elective = 5 cert links.
    expect(screen.getAllByText('View Certificate')).toHaveLength(5)
    // A not-started course row carries no certificate link.
    const notStartedRow = screen.getByText('Human Trafficking Awareness').closest('div')!
    expect(within(notStartedRow).queryByText('View Certificate')).toBeNull()
  })

  it('shows each course meta as category → hours → status, divider-separated', () => {
    renderPanel()
    // Meta is now plain spans joined by thin vertical-bar dividers (empty
    // elements), so the normalized textContent runs together: category, then
    // hours, then status. Order is what we assert.
    expect(screen.getAllByText(fullText('Mandatory2 hrsCompleted')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(fullText('Elective5 hrsCompleted')).length).toBeGreaterThan(0)
  })
})
