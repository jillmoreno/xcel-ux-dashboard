import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { NAV_SECTION_FLAGS } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { learningPathsFor, activePathIdFor } from '@/data/learningFixtures'
import { supportsStudyPlan } from '@/data/studyCalendarFixtures'

/**
 * The Study Plan as its own rail section, moved out of the Learning Path
 * page's tab row on 2026-09-09.
 *
 * The move is the subject: same component, different home. What is worth
 * pinning is that it is reachable, that it honours `?id=` (XCEL has TWO paths
 * with a plan, so without that the section would silently always show the
 * first), and that it did not leave a second door open behind it.
 */

function renderShell(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanelProvider>
            <JumpBackInPanelProvider>
              <PlatformShell />
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('the Study Plan section', () => {
  it('is a rail item, directly under Home', () => {
    renderShell('/dashboard-rebrand')
    const rail = screen
      .getAllByRole('button')
      .map((b) => b.textContent?.trim())
      .filter(Boolean) as string[]
    const home = rail.indexOf('Home')
    const plan = rail.indexOf('Study Plan')
    expect(home).toBeGreaterThanOrEqual(0)
    expect(plan).toBe(home + 1)
  })

  it('opens from ?section=study-plan and renders the plan, not an empty state', () => {
    renderShell('/dashboard-rebrand?section=study-plan')
    // The active path's plan. Its name is authored on the calendar fixture, so
    // this fails if the section resolved no path and fell to the empty state.
    expect(screen.getByText(/20 day study plan/i)).toBeInTheDocument()
  })

  it('honours ?id= so BOTH of XCEL’s planned paths are reachable', () => {
    // The reason the section reads `?id=` at all: XCEL has two pre-licensing
    // paths with a plan, and `activePathIdFor` only ever returns one of them.
    const planned = learningPathsFor('xcel').filter(
      (p) => p.layoutVariant === 'study-calendar-in-tab',
    )
    expect(planned.length).toBeGreaterThan(1)
    const other = planned.find((p) => p.id !== activePathIdFor('xcel'))!

    renderShell(`/dashboard-rebrand?section=study-plan&id=${other.id}`)
    expect(screen.getByRole('heading', { level: 1, name: /study plan/i })).toBeInTheDocument()
  })

  it('has a nav toggle like every other page, and Home still does not', () => {
    const sections = NAV_SECTION_FLAGS.map((n) => n.section)
    expect(sections).toContain('study-plan')
    expect(sections).not.toContain('dashboard')
  })

  it('is gated on supportsStudyPlan, so a brand without one gets no rail item', () => {
    // The same single predicate the tab used. A brand that fails it would
    // otherwise get a rail row onto the create-a-plan empty state.
    expect(supportsStudyPlan('xcel')).toBe(true)
    expect(supportsStudyPlan('nope-not-a-brand')).toBe(false)
  })
})
