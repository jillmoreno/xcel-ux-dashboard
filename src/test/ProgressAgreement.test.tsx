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
import { defaultPreset, studyPace, daysUntil } from '@/lib/studyPace'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'

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

  // These pin the FLAG, so they render a version that still has the band.
  // XCEL's default became QE Focused on 2026-09-16, which drops Recommended as
  // an editorial rule rather than via the flag — testing the flag at the
  // default would measure that rule instead, which is the trap the demo-rail
  // note in CLAUDE.md describes ("a test about capability must pin the flags —
  // or here the version — it depends on").
  const WITH_BAND = '/dashboard-rebrand?version=discoverability-learner-focused'

  it('shows the band by default on a version that has one', () => {
    renderShell(WITH_BAND)
    expect(screen.getByText('Recommended for you')).toBeInTheDocument()
  })

  it('is dropped by the QE Focused version regardless of the flag', () => {
    // The editorial half. QE Focused is for a candidate working a fixed
    // curriculum towards a booked exam — not a shopper — so the discovery band
    // has no job there. Seeded ON to prove the layout wins over the flag.
    seedFlag('dashboard-recommended', true)
    renderShell('/dashboard-rebrand?version=discoverability-qe-focused')
    expect(screen.queryByText('Recommended for you')).toBeNull()
  })

  it('is dropped on XCEL\'s DEFAULT view, because that is QE Focused', () => {
    // Asserted separately from the version-param case: the default is resolved
    // by `defaultDiscoverabilityVersionFor`, and a change there would otherwise
    // only show up as a surprise in a screenshot.
    renderShell('/dashboard-rebrand')
    expect(screen.queryByText('Recommended for you')).toBeNull()
  })

  it('removes the section entirely when off', () => {
    // "Hide" means GONE, not an empty header — a section lead over nothing
    // reads as a load failure. Asserted on the header text rather than on a
    // card, because cards can be empty for data reasons.
    seedFlag('dashboard-recommended', false)
    renderShell(WITH_BAND)
    expect(screen.queryByText('Recommended for you')).toBeNull()
  })

  it('is NOT the same control as the left-nav Recommended page', () => {
    // `nav-show-recommended` hides the rail item for the PAGE; this hides the
    // band on Home. A reviewer can want either without the other, and wiring
    // one to both is the mistake this pins.
    seedFlag('nav-show-recommended', false)
    renderShell(WITH_BAND)
    expect(screen.getByText('Recommended for you')).toBeInTheDocument()
  })
})

describe('one course, one percentage — the Jump Back In card and the path', () => {
  /*
   * A FOURTH SURFACE, added 2026-10-15, and the same failure as the three
   * above: on the QUALIFYING journey the Jump Back In card IS the path — one
   * course, "Pre-licensing Course", the very thing Step 1 counts lessons
   * through. Its `progress` was authored on the profile (45 for `resumeMid`)
   * while the path's came from `PROGRESS_RATIOS` and the Progress dropdown
   * (62). Eighteen points apart, describing one course, on one screen.
   *
   * ⚠ IT WAS INVISIBLE UNTIL A NUMBER WAS PRINTED. The landing page's Step 1
   * was a Figma transcription reading "13 of 42 completed", so nothing on
   * screen contradicted anything — the stale 45 only leaked out through the
   * Study Pace, which planned for 22 hours of work when 15 remained and
   * printed a 3-week plan under an 18-day access window.
   */
  it('gives the card the path’s own progress when the card is the whole path', () => {
    for (const course of ['ny', 'fl', 'tx'] as const) {
      const p = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', course)!
      expect(p.path.jumpBackIn?.progress, course).toBe(displayedProgressPct(p.path))
    }
  })

  it('follows the Progress dropdown, not an authored figure', () => {
    for (const variant of ['setup-complete-0', 'progress-at-risk', 'complete-100']) {
      const p = dashboardProgressPersonaFor('xcel', variant, 'qe', 'ny')
      if (!p?.path.jumpBackIn) continue
      expect(p.path.jumpBackIn.progress, variant).toBe(displayedProgressPct(p.path))
    }
  })

  /* ⚠ AND ONLY THERE. A CE path's card is ONE course of several
     ("Long-Term Care Initial Training"); exam prep's is one of three. In both
     the card's progress is a genuinely different fact from the path's, and
     aligning them would be this same error in the other direction. */
  it('leaves a multi-course path’s card on its own authored progress', () => {
    const ce = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'ce')!
    expect(ce.path.jumpBackIn?.progress).toBe(45)
    expect(ce.path.jumpBackIn?.progress).not.toBe(displayedProgressPct(ce.path))
  })
})

describe('the study pace fits inside the access window', () => {
  /*
   * "Course Access Ends: 05/29/2026, 18 days to complete" sat directly above
   * "…prepared to pass your course exam in 3 weeks time" — a plan four days
   * longer than the access it is printed beside. The sentence was a typed
   * literal from Figma 267:8266; the home had computed the real pace all
   * along for the "At current pace" date two lines up.
   */
  /* ⚠ AND ACROSS THE EXPIRES CONTROL'S WHOLE RANGE — 2026-10-15. The pace
     the card prints is the gentlest preset that FITS, not `defaultPreset`,
     which returns the recommended one whether or not it does: at 7 days that
     one wants 3192 minutes a week and reports `no`, while relaxed fits the
     same window at 1064. Reading the wrong preset had the card announce
     "there isn't enough access left" with a workable plan one row up. */
  it.each([7, 15, 30, 90, 120, 400])('fits a pace inside a %i-day window', (days) => {
    const p = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', undefined, days)!
    const card = p.path.jumpBackIn!
    const model = studyPace({
      today: FIXTURE_TODAY,
      hoursRemaining: card.hours * (1 - (card.progress ?? 0) / 100),
      accessExpiresAt: card.expiresAt,
    })
    const chosen = defaultPreset(model)
    const fit = chosen.state === 'no' ? model.presets.find((x) => x.state !== 'no') : chosen
    expect(fit, `${days} days`).toBeDefined()
    expect(fit!.days, `${days} days`).toBeLessThanOrEqual(daysUntil(card.expiresAt!, FIXTURE_TODAY)!)
  })

  /* ONE DAY IS THE EXCEPTION, and it is the row that exists to show it: no
     preset fits, and the card says so instead of naming a number. */
  it('reports that nothing fits in a 1-day window', () => {
    const p = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', undefined, 1)!
    const card = p.path.jumpBackIn!
    const model = studyPace({
      today: FIXTURE_TODAY,
      hoursRemaining: card.hours * (1 - (card.progress ?? 0) / 100),
      accessExpiresAt: card.expiresAt,
    })
    expect(model.presets.every((x) => x.state === 'no')).toBe(true)
  })

  it('recommends a pace no longer than the access left', () => {
    for (const course of ['ny', 'fl', 'tx'] as const) {
      const p = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', course)!
      const card = p.path.jumpBackIn!
      const hoursRemaining = card.hours * (1 - (card.progress ?? 0) / 100)
      const model = studyPace({
        today: FIXTURE_TODAY,
        hoursRemaining,
        accessExpiresAt: card.expiresAt,
      })
      const preset = defaultPreset(model)
      const accessDays = daysUntil(card.expiresAt!, FIXTURE_TODAY)!
      expect(preset.days, course).toBeLessThanOrEqual(accessDays)
      // …and the sentence rounds those days to weeks, so it must fit too.
      expect(Math.max(1, Math.round(preset.days / 7)) * 7, course).toBeLessThanOrEqual(
        accessDays + 6,
      )
    }
  })
})
