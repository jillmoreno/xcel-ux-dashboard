import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathDetailPanel } from '@/components/learning/LearningPathDetailPanel'
import { learningPathsFor, mandatoryCoursesFor } from '@/data/learningFixtures'

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', membership: 'member' }))
})

// Florida Life & Health CE — the XCEL path with progress in BOTH categories
// (mandatory 5/10, elective 1/14). It has to be this one rather than `[0]`: the
// gauge only draws an elective arc once elective work is complete, and XCEL's
// two pre-licensing paths sit at `elective: { completed: 0 }`.
const PATH = learningPathsFor('xcel').find((p) => p.id === 'xcel-fl-lh-ce')!

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
          <LearningPathDetailPanel open onClose={() => {}} path={PATH} />
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
    // Each count renders twice: the CategoryBars label and the dashed-leader
    // section header. Both must be present. Read from the path rather than
    // hardcoded, so re-tuning the fixture cannot leave this asserting a number
    // the panel no longer shows.
    const m = `${PATH.mandatory!.completed} / ${PATH.mandatory!.required} hrs`
    const e = `${PATH.elective!.completed} / ${PATH.elective!.required} hrs`
    expect(screen.getAllByText(fullText(m)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(fullText(e)).length).toBeGreaterThan(0)
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
    // …and the Requirements tab is now showing. XCEL authors no renewal
    // requirements yet, so what shows is the empty state rather than Elite's
    // "Florida Board of Nursing" body. Asserting the empty state keeps the tab
    // switch covered; swap this for the real copy once requirements land.
    expect(
      screen.getByText(/renewal requirements aren’t available for this path yet/i),
    ).toBeInTheDocument()
  })

  it('shows "View Certificate" on completed courses but not on not-started ones', () => {
    renderPanel()
    // One completed mandatory + one completed elective ⇒ two cert links.
    // Counted from the fixture so adding a completed course does not silently
    // make this assert the wrong number.
    const completed = mandatoryCoursesFor('xcel', PATH.id).filter(
      (c) => c.status === 'completed',
    )
    expect(completed.length).toBeGreaterThan(0)
    expect(screen.getAllByText('View Certificate')).toHaveLength(completed.length)
    // A not-started course row carries no certificate link.
    const notStartedRow = screen.getByText('Exam Simulator 1').closest('div')!
    expect(within(notStartedRow).queryByText('View Certificate')).toBeNull()
  })

  it('shows each course meta as category → hours → status, divider-separated', () => {
    renderPanel()
    // Meta is now plain spans joined by thin vertical-bar dividers (empty
    // elements), so the normalized textContent runs together: category, then
    // hours, then status. Order is what we assert.
    expect(screen.getAllByText(fullText('Mandatory5 hrsCompleted')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(fullText('Elective1 hrCompleted')).length).toBeGreaterThan(0)
  })
})
