import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassLearningPage } from '@/components/learning/CompassLearningPage'
import { COMPASS_ASSIGNMENTS } from '@/data/compassLearningFixtures'

/**
 * COMPASS LEARNING — Figma 765:3471, the top nav's second destination.
 *
 * The frame's body is a pasted SCREENSHOT of Anjani's standalone prototype, so
 * what is worth pinning is the part a screenshot cannot enforce: that the page
 * opens where the design opens it, that the readiness figures a learner would
 * act on are actually rendered, and that the table's five rows keep their
 * states apart.
 */

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassLearningPage
            courseTitle="New York Life and Health Pre-licensing"
            percentComplete={10}
            completedLessons={4}
            totalLessons={42}
            onLeave={() => {}}
          />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('the Compass Learning page', () => {
  it('opens on Overview, where the launcher opens on Course', () => {
    /* The difference between the two entrances: launching a course means "take
       me into the courseware"; choosing Compass Learning from the nav means
       "show me where I am". A shared default would lose that. */
    renderPage()
    expect(screen.getByRole('heading', { name: 'Compass Learning', level: 1 })).toBeTruthy()
    expect(screen.getByText('Tonight')).toBeTruthy()
  })

  it('names the course it is about in the sidebar', () => {
    renderPage()
    expect(screen.getByText('New York Life and Health Pre-licensing')).toBeTruthy()
  })

  it('states the readiness figure as one number, not two fragments', () => {
    /* The ring draws "62" and a superscript "%" as separate nodes, so without
       the image role a screen reader reads them apart — and a readiness score
       split from its unit is the one figure on this page nobody should have to
       reassemble. */
    expect(renderPage().container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      '62% ready',
    )
  })

  it('carries Rubi\'s nudge, which is the page\'s one recommendation', () => {
    renderPage()
    expect(screen.getByText('Rubi suggests')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start practice' })).toBeTruthy()
  })

  it('renders every assignment, with its own readiness wording', () => {
    /* ⚠ THE WORDING IS PER-ROW, not derived from the state. "In progress · 10
       min left" carries a fact the state does not, so a table that rendered
       state names would lose it on four of the five rows. */
    renderPage()
    const table = screen.getByRole('table')
    for (const a of COMPASS_ASSIGNMENTS) {
      expect(within(table).getByText(a.name), `${a.name} missing`).toBeTruthy()
      expect(within(table).getByText(a.readinessLabel), `${a.name} readiness`).toBeTruthy()
    }
  })

  it('offers an action only where there is one to take', () => {
    /* Done topics and the locked simulator offer nothing — a button on those
       rows would be a dead control in a page full of live ones. */
    renderPage()
    const table = screen.getByRole('table')
    expect(within(table).getByRole('button', { name: 'Continue' })).toBeTruthy()
    expect(within(table).getByRole('button', { name: 'Practice again' })).toBeTruthy()
    expect(within(table).queryAllByRole('button')).toHaveLength(
      COMPASS_ASSIGNMENTS.filter((a) => a.action).length,
    )
  })

  it('keeps the exam-date strip honest about what it can change', () => {
    /* It states the mock's "to be scheduled" rather than reading
       `examDateStore`, because Edit is not wired — a strip that reported a real
       date it could not change would be the worse half-truth. */
    renderPage()
    expect(screen.getByText(/State License Exam Date/i)).toBeTruthy()
  })
})
