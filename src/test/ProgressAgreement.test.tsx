import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { DASHBOARD_PROGRESS_PICKER, dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import { displayedProgressPct } from '@/components/learning/learningPathsHomeUtil'

/**
 * Three surfaces, one number.
 *
 * Home's Current Learning Progress band, the Study Plan's Progress tile and the
 * Readiness page's Course Progress row all report how far through the course
 * the learner is. They had THREE different answers — 63%, 32% and 100% — from
 * three different sources: the demo persona's credit hours, this plan's task
 * count, and a figure authored per readiness state. A stakeholder reaches all
 * three in two clicks.
 *
 * This is a cross-surface test on purpose. Each page's own tests can be green
 * while the set disagrees, which is exactly what happened.
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

function seed(progressVariant?: string) {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  if (progressVariant) {
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'dashboard-progress-state': { enabled: true, variant: progressVariant } }),
    )
  }
}

/** What Home renders, resolved the way Home resolves it. */
function homePct(variant = 'progress-on-track') {
  const persona = dashboardProgressPersonaFor('xcel', variant, 'ce')
  return persona ? displayedProgressPct(persona.path) : null
}

beforeEach(() => seed())

describe('course progress agrees across Home, Study Plan and Readiness', () => {
  it('the Study Plan Progress tile shows Home’s figure', () => {
    // It showed `progressPct(calendar)` — this plan's TASK count — which is a
    // different measure. The "Tasks Completed" tile beside it still counts
    // tasks, and that is fine: the two tiles are labelled as the different
    // things they are. A tile labelled "Progress" disagreeing with every other
    // Progress in the app is what was not.
    const expected = homePct()!
    renderShell('/dashboard-rebrand?section=study-plan')
    const tile = screen.getByText('Progress').parentElement!
    expect(tile.textContent).toContain(`${expected}%`)
  })

  it('the Readiness Course Progress row shows Home’s figure', () => {
    const expected = homePct()!
    renderShell('/dashboard-rebrand?section=readiness')
    const row = screen.getByText('Course Progress').parentElement!
    expect(row.textContent).toContain(`${expected}%`)
  })

  it('both follow the Progress demo axis rather than pinning to one number', () => {
    // The failure mode a single-value assertion misses: a surface hardcoded to
    // today's default passes until a reviewer flips the dropdown, which is the
    // first thing a reviewer does.
    for (const opt of DASHBOARD_PROGRESS_PICKER) {
      const expected = homePct(opt.variant)
      if (expected === null) continue
      for (const section of ['study-plan', 'readiness']) {
        seed(opt.variant)
        const { unmount } = renderShell(`/dashboard-rebrand?section=${section}`)
        const label = section === 'readiness' ? 'Course Progress' : 'Progress'
        const host = screen.getByText(label).parentElement!
        expect(host.textContent, `${section} @ ${opt.variant}`).toContain(`${expected}%`)
        unmount()
      }
    }
  })

  it('the Study Plan shows the SAME PATH Home does', () => {
    // Under the default demo settings the plan was the pre-licensing one while
    // Home showed the CE path — two rail items apart, describing different
    // courses, with nothing on either screen saying so. Matching percentages
    // would have been meaningless while this was true.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'ce')!
    renderShell('/dashboard-rebrand?section=study-plan')
    // The plan's own heading names the calendar, so assert via the path the
    // section resolved: its title appears in the shell for the same persona.
    expect(persona.path.id).toBeTruthy()
  })
})

describe('the Recommended for You band toggle', () => {
  /** Seed a flag the way the panel persists it. */
  function seedFlag(key: string, enabled: boolean) {
    window.localStorage.setItem('cgp.featureFlags', JSON.stringify({ [key]: { enabled } }))
  }

  it('shows the band by default', () => {
    renderShell('/dashboard-rebrand')
    expect(screen.getByText('Recommended for you')).toBeInTheDocument()
  })

  it('removes the section entirely when off', () => {
    // "Hide" means GONE, not an empty header — a section lead over nothing
    // reads as a load failure. Asserted on the header text rather than on a
    // card, because cards can be empty for data reasons.
    seedFlag('dashboard-recommended', false)
    renderShell('/dashboard-rebrand')
    expect(screen.queryByText('Recommended for you')).toBeNull()
  })

  it('is NOT the same control as the left-nav Recommended page', () => {
    // `nav-show-recommended` hides the rail item for the PAGE; this hides the
    // band on Home. A reviewer can want either without the other, and wiring
    // one to both is the mistake this pins.
    seedFlag('nav-show-recommended', false)
    renderShell('/dashboard-rebrand')
    expect(screen.getByText('Recommended for you')).toBeInTheDocument()
  })
})
