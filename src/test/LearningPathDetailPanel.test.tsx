import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathDetailPanel } from '@/components/learning/LearningPathDetailPanel'
import { learningPathsFor, mandatoryCoursesFor, pathRequirementsFor } from '@/data/learningFixtures'

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

describe('the Requirements layout', () => {
  /* 2026-10-07, the direct ask: "the layout for this sheet is bland, can we add
     some bullet points and organize the chaos in a more appealing way."

     ⚠ THIS IS SHARED CHROME. One sheet renders every path's requirements, from
     a 40-hour pre-licensing route to a biennial CE cycle, so these use the NY
     pre-licensing path — the longest entry in the fixtures (six sections,
     thirty-odd items) and therefore the one the restructure was aimed at. */
  const NY = learningPathsFor('xcel').find((p) => p.id === 'xcel-ny-producer-prelicensing')!

  function openRequirements() {
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <LearningPathDetailPanel open onClose={() => {}} path={NY} />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^requirements$/i }))
    })
  }

  it('groups each fact as one cell rather than a label/value grid', () => {
    /* ⚠ THE `<div>` INSIDE THE `<dl>` IS LOAD-BEARING. Bare dt/dd pairs each
       take a grid cell of their own, which on an `auto-fit` row renders as
       label, label, value, value — a failure that looks like a data bug. */
    openRequirements()
    const term = screen.getByText('Total hours required')
    const cell = term.parentElement!
    expect(cell.tagName).toBe('DIV')
    /* Read from the fixture rather than hardcoded, so re-tuning the data
       cannot leave this asserting a number the sheet no longer shows. */
    expect(cell.textContent).toContain(String(pathRequirementsFor('xcel', NY.id)!.totalHours))
  })

  it('gives every list item a marker and a hanging indent', () => {
    /* ⚠ REVERSES "No bullets — the board's rules read as plain lines" for THIS
       sheet only. The flex row is the half that matters: without it a wrapped
       item starts under the dot and runs into the next entry, which is what
       made a thirty-item page unreadable. */
    openRequirements()
    const item = screen.getByText(/150 scored questions in 150 minutes/i).closest('li')!
    expect(getComputedStyle(item).display).toBe('flex')
    expect(item.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
  })

  it('emphasises a short lead but leaves a mid-sentence dash alone', () => {
    /* ⚠ THE PAIR IS THE TEST. "State exam — 150 scored questions…" opens with a
       label; "Register online with PSI at test-takers.psiexams.com/nyins —
       exam fee $40" does not, and bolding that half would emphasise a URL.
       `REQ_LABEL_MAX` is what separates them, and only a case on each side of
       it can fail when that number moves. */
    openRequirements()
    expect(screen.getByText('State exam').tagName).toBe('STRONG')
    const psi = screen.getByText(/test-takers\.psiexams\.com/i)
    expect(psi.querySelector('strong')).toBeNull()
  })

  it('lifts the authority into an eyebrow and titles what it requires', () => {
    /* ⚠ AND FIXES THE TWO ARTEFACTS THE SPLIT CREATES — the second half was
       written to continue a sentence, so it begins lower-case and ends on a
       colon introducing nothing. */
    openRequirements()
    expect(screen.getByText('New York Department of Financial Services')).toBeInTheDocument()
    expect(
      screen.getByText('What the state requires before you can be licensed'),
    ).toBeInTheDocument()
  })
})
