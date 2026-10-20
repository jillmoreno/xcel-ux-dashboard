import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { PACE_STYLE_LABELS, PACE_STYLE_ORDER, STYLE_FACTORS, resolvePaceStyle } from '@/lib/studyPace'
import { PLANNER_PACES } from '@/data/compassStudyPlannerFixtures'

afterEach(cleanup)

/**
 * PACING — Crammer / Average / Thorough, 2026-10-20.
 *
 * ⚠ WHAT IS PINNED IS THAT IT DRIVES THE ARITHMETIC. A control that changed
 * only the name would print "Crammer" over an Average plan's figures, which is
 * the same mismatch this surface has been bitten by twice (the 30-day window
 * against the pace card, and the exam's two day-counts). The hours a week are
 * asserted MOVING, not just the label.
 */
function renderHome(style?: string) {
  window.history.replaceState({}, '', style ? `/dashboard-rebrand?ff=dashboard-pace-style:${style}` : '/dashboard-rebrand')
  return render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand?demo=1&version=jill-atlas-main${style ? `&ff=dashboard-pace-style:${style}` : ''}`]}>
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

function hoursPerWeek(): number {
  const el = screen.getByText(/about \d+ hours? \/ week/)
  return Number(/about (\d+)/.exec(el.textContent ?? '')?.[1])
}

describe('the pacing axis', () => {
  /* ⚠ ONE VOCABULARY, WHICH IS THE WHOLE REASON `quick` WAS RENAMED. The model's
     keys and the planner's ids were two spellings of one axis; the day a
     control drove both, a mapping between them would have been the bug. */
  it('the model’s styles ARE the planner’s pace ids', () => {
    expect(Object.keys(STYLE_FACTORS).sort()).toEqual(PLANNER_PACES.map((p) => p.id).sort())
    expect(PACE_STYLE_ORDER).toEqual(['crammer', 'average', 'thorough'])
  })

  it('the planner’s names and the card’s labels are the same words', () => {
    for (const p of PLANNER_PACES) {
      expect(PACE_STYLE_LABELS[p.id as keyof typeof PACE_STYLE_LABELS], p.id).toBe(p.name)
    }
  })

  /* ⚠ THE RENAME LEFT `quick` IN EVERY BROWSER that had opened the demo. Without
     the guard those machines tick no row and silently run at Average — the
     control looking broken on exactly the machines that used it most. */
  it('still understands a stored `quick`', () => {
    expect(resolvePaceStyle('quick')).toBe('crammer')
    expect(resolvePaceStyle(undefined)).toBe('average')
    expect(resolvePaceStyle('nonsense')).toBe('average')
  })

  it('is a DEMO control — no `surface`, so it is not on the design bar', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'dashboard-pace-style')
    expect(flag).toBeDefined()
    expect(flag?.surface).toBeUndefined()
    expect(flag?.defaultVariant).toBe('average')
    expect(flag?.variants?.map((v) => v.value)).toEqual([...PACE_STYLE_ORDER])
  })

  it('moves the name AND the figures together', () => {
    renderHome('crammer')
    expect(screen.getByText('Crammer')).toBeTruthy()
    const fast = hoursPerWeek()
    cleanup()

    renderHome('thorough')
    expect(screen.getByText('Thorough')).toBeTruthy()
    const slow = hoursPerWeek()

    /* Thorough costs MORE hours for the same course — x1.3 against x0.75 — so
       a label that moved while the figure stood still would fail here. */
    expect(slow).toBeGreaterThan(fast)
  })

  it('opens on Average, as the committed default', () => {
    renderHome()
    expect(screen.getByText('Average')).toBeTruthy()
  })
})
