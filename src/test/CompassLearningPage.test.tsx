import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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

/* ⚠ PINS THE `atlas` ARM OF `compass-surface` — 2026-10-15; it pinned Eric's
   VERSION from 2026-10-08. This file is about the SHARED `CompassSidebar` and
   the Overview body it opens on. Anjani draws a different rail entirely
   (`CompassRail` — the XCEL lockup, no course title, no progress bar), and
   from the 15th hers is the default on every version — the gate moved from
   `isHybridVersion` to the flag when Eric's End-to-End Demo became the default
   dashboard, so that the Compass Prototypes row (which opens the default)
   stayed hers. The version pin is kept so the Overview body is still Eric's;
   the arm pin is what keeps the sidebar shared. Her rail is pinned in
   `AtlasTopNav.test.tsx`; her planner in `CompassStudyPlanner.test.tsx`. */
beforeEach(() => window.history.replaceState({}, '', '/dashboard-rebrand?ff=compass-surface:atlas'))
afterEach(() => window.history.replaceState({}, '', '/'))
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand?version=eric-atlas-v1']}>
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
      /* The label, not its hover tooltip, which repeats the state's name. */
      expect(within(table).getByText(a.readinessLabel, { selector: '.cre-ov__rlabel' }), `${a.name} readiness`).toBeTruthy()
    }
  })

  it('draws no action column — the two routes into the session are Start session and Start practice', () => {
    /* ⚠ FLIPPED 2026-10-15 from "offers an action only where there is one".
       The 09-23 port drew Practice again / Continue / Start in a fourth
       column; Anjani's second master's table has none, and this body is a
       transcription of her file on both arms. */
    renderPage()
    const table = screen.getByRole('table')
    expect(within(table).queryAllByRole('button')).toHaveLength(0)
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Assignment', 'Readiness', 'Due'])
    expect(screen.getByRole('button', { name: 'Start session' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start practice' })).toBeTruthy()
  })

  it('keeps the exam-date strip honest about what it can change', () => {
    /* It states the mock's "to be scheduled" rather than reading
       `examDateStore`, because Edit is not wired — a strip that reported a real
       date it could not change would be the worse half-truth. */
    renderPage()
    expect(screen.getByText(/State License Exam Date/i)).toBeTruthy()
  })
})
