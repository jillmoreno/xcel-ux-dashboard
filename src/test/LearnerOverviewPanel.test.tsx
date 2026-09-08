import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

/** Click the "Last 30 Days" tab in the streak hero. The hero defaults
 *  to the 30-day chart, so re-clicking the active tab is a no-op — the
 *  helper exists so 30-day tests don't need to know which mode is
 *  active first, and stays robust if the default ever flips again. */
function openDailyChart() {
  fireEvent.click(screen.getByRole('tab', { name: /^last 30 days$/i }))
}

/** Click the "This Week" tab to surface the 7-bar strip. */
function openWeekStrip() {
  fireEvent.click(screen.getByRole('tab', { name: /^this week$/i }))
}
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearnerOverviewPanel } from '@/components/dashboard/LearnerOverviewPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { intensityLevelForMinutes } from '@/data/learnerOverviewFixtures'

// `matchMedia` in `setup.ts` always reports `matches: false`, so the
// count-up runs its real animation. We don't fake timers here — the
// caption is sourced from `current` (not `displayCount`), so the
// matrix tests don't need the animation to complete.

function renderPanel() {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <LearningPathsPanelProvider>
            <LearnerOverviewPanel />
          </LearningPathsPanelProvider>
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  // Each test renders against the default LEARNING_STREAK fixture
  // (current: 12, longest: 41). Caption-matrix tests below mock the
  // fixture exports via vi.doMock to swap individual rows.
  window.localStorage.clear()
})

describe('StreakHeroCard', () => {
  it('renders the streak hero with both activity-mode tabs', () => {
    renderPanel()
    // Zone A — always visible
    expect(screen.getByText('Current Streak')).toBeInTheDocument()
    // Mini pill tabs — both tabs are always rendered; the active one
    // labels the view below. The tabs live inside whichever view is
    // currently mounted, so re-query after switching modes.
    expect(
      screen.getByRole('tab', { name: /^last 30 days$/i }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('tab', { name: /^this week$/i }),
    ).toHaveAttribute('aria-selected', 'false')
    // Default view is the 30-day chart — its group lives in the DOM.
    expect(
      screen.getByRole('group', { name: /daily activity intensity for the last 30 days/i }),
    ).toBeInTheDocument()
    // Week strip is gated behind the tab.
    expect(
      screen.queryByRole('group', { name: /this week — \d of 7 days active/i }),
    ).not.toBeInTheDocument()
    openWeekStrip()
    expect(
      screen.getByRole('tab', { name: /^last 30 days$/i }),
    ).toHaveAttribute('aria-selected', 'false')
    expect(
      screen.getByRole('tab', { name: /^this week$/i }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('group', { name: /this week — \d of 7 days active/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: /daily activity intensity for the last 30 days/i }),
    ).not.toBeInTheDocument()
  })

  it('exposes the streak count via an aria-live label', () => {
    renderPanel()
    expect(
      screen.getByLabelText(/current learning streak: 5 days/i),
    ).toBeInTheDocument()
  })

  it('renders a progressbar with the correct PB framing', () => {
    renderPanel()
    const bar = screen.getByRole('progressbar', {
      name: /progress toward personal best of 41 days/i,
    })
    expect(bar).toHaveAttribute('aria-valuenow', '5')
    expect(bar).toHaveAttribute('aria-valuemax', '41')
  })

  it('exposes the daily-activity bar chart as a labelled group of 30 cells', () => {
    renderPanel()
    openDailyChart()
    const group = screen.getByRole('group', {
      name: /daily activity intensity for the last 30 days/i,
    })
    expect(group).toBeInTheDocument()
    expect(within(group).getAllByRole('img')).toHaveLength(30)
  })

  it("today's daily-activity bar carries the focus ring + minute label", () => {
    renderPanel()
    openDailyChart()
    const todayBar = screen.getByRole('img', {
      name: /^may 20 — 65 min · today$/i,
    })
    expect(todayBar).toHaveStyle({ outline: '2px solid var(--color-action)' })
  })

  it('inactive daily-activity days announce "inactive" rather than 0 min', () => {
    renderPanel()
    openDailyChart()
    // 2026-04-23 is inactive in the fixture.
    expect(
      screen.getByRole('img', { name: /^apr 23 — inactive$/i }),
    ).toBeInTheDocument()
  })

  it("renders the week strip as a group with today's tallest bar on the right-most cell", () => {
    renderPanel()
    openWeekStrip()
    const group = screen.getByRole('group', { name: /this week — 5 of 7 days active/i })
    expect(group).toBeInTheDocument()
    // Saturday (today) — fixture has 2026-05-20 active. Today's bar
    // now reads as the tallest (36px) + darker primary-700 fill; the
    // outline ring has been retired.
    const todayCell = within(group).getByRole('img', {
      name: /saturday may 20 — active · today/i,
    })
    expect(todayCell).toHaveStyle({
      height: '36px',
      background: 'var(--color-primary-700)',
    })
  })

})

describe('Caption matrix', () => {
  // Each case re-mocks the `LEARNING_STREAK` fixture and re-imports
  // the panel so the new values flow into the render.
  type Case = {
    title: string
    current: number
    longest: number
    expected: RegExp
  }

  const cases: Case[] = [
    {
      title: 'longest === 0, current === 0 → "Start your first streak"',
      current: 0,
      longest: 0,
      expected: /start your first streak/i,
    },
    {
      title: 'longest === 0, current > 0 → "Day 1 of your first streak"',
      current: 1,
      longest: 0,
      expected: /day 1 of your first streak/i,
    },
    {
      title: 'current === 0, longest > 0 → "Start a new streak today"',
      current: 0,
      longest: 41,
      expected: /start a new streak today/i,
    },
    {
      title: 'current below PB (singular) → "1 day to beat it"',
      current: 40,
      longest: 41,
      expected: /^1 day to beat it$/i,
    },
    {
      title: 'current below PB (plural) → "29 days to beat it"',
      current: 12,
      longest: 41,
      expected: /^29 days to beat it$/i,
    },
    {
      title: 'current === longest → "Tied with your personal best"',
      current: 41,
      longest: 41,
      expected: /tied with your personal best/i,
    },
    {
      title: 'current === longest + 1 → "New personal best · 1 day ahead"',
      current: 42,
      longest: 41,
      expected: /new personal best · 1 day ahead/i,
    },
    {
      title: 'current > longest + 1 → "New personal best · N days ahead"',
      current: 45,
      longest: 41,
      expected: /new personal best · 4 days ahead/i,
    },
  ]

  for (const c of cases) {
    it(c.title, async () => {
      vi.resetModules()
      vi.doMock('@/data/learnerOverviewFixtures', async () => {
        const actual =
          await vi.importActual<typeof import('@/data/learnerOverviewFixtures')>(
            '@/data/learnerOverviewFixtures',
          )
        const mocked = {
          ...actual.LEARNING_STREAK,
          current: c.current,
          longest: c.longest,
        }
        return {
          ...actual,
          LEARNING_STREAK: mocked,
          // Panel reads via `learningStreakFor(brand)` — override so
          // the mocked values reach the render regardless of brand.
          learningStreakFor: () => mocked,
        }
      })
      const [
        { LearnerOverviewPanel: Panel },
        { AccountProvider: Provider },
        { FeatureFlagProvider: FlagProvider },
        { LearningPathsPanelProvider: PathsProvider },
      ] = await Promise.all([
        import('@/components/dashboard/LearnerOverviewPanel'),
        import('@/context/AccountContext'),
        import('@/context/FeatureFlagContext'),
        import('@/components/learning/LearningPathsPanelContext'),
      ])
      render(
        <Provider>
          <FlagProvider>
            <MemoryRouter>
              <PathsProvider>
                <Panel />
              </PathsProvider>
            </MemoryRouter>
          </FlagProvider>
        </Provider>,
      )
      expect(screen.getByText(c.expected)).toBeInTheDocument()
      vi.doUnmock('@/data/learnerOverviewFixtures')
    })
  }
})

describe('Per-brand streak variants', () => {
  // Each brand resolves to a different streak via `learningStreakFor`.
  // The component reads the active brand from `useAccount()` and picks
  // the matching fixture — no per-brand state in the panel itself.
  type Case = {
    title: string
    brand: 'mckissock' | 'elite' | 'stc'
    expectedCount: number
    expectedLongest: number
    expectedCaption: RegExp
  }
  const cases: Case[] = [
    {
      title: 'McKissock — 14-day streak tied with PB',
      brand: 'mckissock',
      expectedCount: 14,
      expectedLongest: 14,
      expectedCaption: /tied with your personal best/i,
    },
    {
      title: 'Elite — 22-day streak past PB',
      brand: 'elite',
      expectedCount: 22,
      expectedLongest: 18,
      expectedCaption: /new personal best · 4 days ahead/i,
    },
    {
      title: 'STC — lapsed (0-day current, 35-day PB)',
      brand: 'stc',
      expectedCount: 0,
      expectedLongest: 35,
      expectedCaption: /start a new streak today/i,
    },
  ]
  for (const c of cases) {
    it(c.title, () => {
      // Swap the persisted account before mount so `useAccount()`
      // resolves to the target brand on first render.
      window.localStorage.setItem(
        'cgp.account',
        JSON.stringify({ brand: c.brand, membership: 'member' }),
      )
      renderPanel()
      expect(
        screen.getByLabelText(
          new RegExp(`current learning streak: ${c.expectedCount} days`, 'i'),
        ),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('progressbar', {
          name: new RegExp(`personal best of ${c.expectedLongest} days`, 'i'),
        }),
      ).toBeInTheDocument()
      expect(screen.getByText(c.expectedCaption)).toBeInTheDocument()
    })
  }
})

describe('intensityLevelForMinutes', () => {
  // Boundaries are < (strict): low < 15, medium < 45, high < 60, veryHigh >= 60.
  const cases: Array<[number, string]> = [
    [0, 'none'],
    [14, 'low'],
    [15, 'medium'],
    [44, 'medium'],
    [45, 'high'],
    [59, 'high'],
    [60, 'veryHigh'],
  ]
  for (const [minutes, expected] of cases) {
    it(`${minutes} min → ${expected}`, () => {
      expect(intensityLevelForMinutes(minutes)).toBe(expected)
    })
  }

  it('negative minutes fall through to "none"', () => {
    // Defensive guard — real data should never send a negative, but
    // bucket the case rather than throwing.
    expect(intensityLevelForMinutes(-5)).toBe('none')
  })
})

describe('Daily-activity bar fallback', () => {
  it('renders cells without `minutes` at low intensity when active', async () => {
    vi.resetModules()
    vi.doMock('@/data/learnerOverviewFixtures', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/learnerOverviewFixtures')>(
          '@/data/learnerOverviewFixtures',
        )
      // Strip `minutes` off every cell to simulate the old shape.
      const recent30 = actual.LEARNING_STREAK.recent30.map(
        ({ minutes: _unused, ...rest }) => rest,
      )
      const mocked = { ...actual.LEARNING_STREAK, recent30 }
      return {
        ...actual,
        LEARNING_STREAK: mocked,
        learningStreakFor: () => mocked,
      }
    })
    const [
      { LearnerOverviewPanel: Panel },
      { AccountProvider: Provider },
      { FeatureFlagProvider: FlagProvider },
      { LearningPathsPanelProvider: PathsProvider },
    ] = await Promise.all([
      import('@/components/dashboard/LearnerOverviewPanel'),
      import('@/context/AccountContext'),
      import('@/context/FeatureFlagContext'),
      import('@/components/learning/LearningPathsPanelContext'),
    ])
    render(
      <Provider>
        <FlagProvider>
          <MemoryRouter>
            <PathsProvider>
              <Panel />
            </PathsProvider>
          </MemoryRouter>
        </FlagProvider>
      </Provider>,
    )
    openDailyChart()
    // 2026-04-21 was an active day (minutes was 22) — strip ↦ "1 min".
    expect(
      screen.getByRole('img', { name: /^apr 21 — 1 min$/i }),
    ).toBeInTheDocument()
    // 2026-04-23 was inactive — still announces "inactive".
    expect(
      screen.getByRole('img', { name: /^apr 23 — inactive$/i }),
    ).toBeInTheDocument()
    vi.doUnmock('@/data/learnerOverviewFixtures')
  })

  it("today's daily-activity bar keeps the ring even when today is inactive", async () => {
    vi.resetModules()
    vi.doMock('@/data/learnerOverviewFixtures', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/learnerOverviewFixtures')>(
          '@/data/learnerOverviewFixtures',
        )
      // Flip today's recent30 entry inactive.
      const recent30 = actual.LEARNING_STREAK.recent30.map((c) =>
        c.date === actual.LEARNING_STREAK.lastActivityDate
          ? { ...c, active: false, minutes: 0 }
          : c,
      )
      const mocked = { ...actual.LEARNING_STREAK, recent30 }
      return {
        ...actual,
        LEARNING_STREAK: mocked,
        learningStreakFor: () => mocked,
      }
    })
    const [
      { LearnerOverviewPanel: Panel },
      { AccountProvider: Provider },
      { FeatureFlagProvider: FlagProvider },
      { LearningPathsPanelProvider: PathsProvider },
    ] = await Promise.all([
      import('@/components/dashboard/LearnerOverviewPanel'),
      import('@/context/AccountContext'),
      import('@/context/FeatureFlagContext'),
      import('@/components/learning/LearningPathsPanelContext'),
    ])
    render(
      <Provider>
        <FlagProvider>
          <MemoryRouter>
            <PathsProvider>
              <Panel />
            </PathsProvider>
          </MemoryRouter>
        </FlagProvider>
      </Provider>,
    )
    openDailyChart()
    const todayBar = screen.getByRole('img', {
      name: /^may 20 — inactive · today$/i,
    })
    expect(todayBar).toHaveStyle({ outline: '2px solid var(--color-action)' })
    vi.doUnmock('@/data/learnerOverviewFixtures')
  })
})

describe('PB flag visibility', () => {
  it('hides when current is at or past the personal best', async () => {
    vi.resetModules()
    vi.doMock('@/data/learnerOverviewFixtures', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/learnerOverviewFixtures')>(
          '@/data/learnerOverviewFixtures',
        )
      const mocked = { ...actual.LEARNING_STREAK, current: 42, longest: 41 }
      return {
        ...actual,
        LEARNING_STREAK: mocked,
        learningStreakFor: () => mocked,
      }
    })
    const [
      { LearnerOverviewPanel: Panel },
      { AccountProvider: Provider },
      { FeatureFlagProvider: FlagProvider },
      { LearningPathsPanelProvider: PathsProvider },
    ] = await Promise.all([
      import('@/components/dashboard/LearnerOverviewPanel'),
      import('@/context/AccountContext'),
      import('@/context/FeatureFlagContext'),
      import('@/components/learning/LearningPathsPanelContext'),
    ])
    const { container } = render(
      <Provider>
        <FlagProvider>
          <MemoryRouter>
            <PathsProvider>
              <Panel />
            </PathsProvider>
          </MemoryRouter>
        </FlagProvider>
      </Provider>,
    )
    // PB flag is an `aria-hidden` <span> inside the progressbar. When
    // hidden we expect the progressbar to have no child span tick.
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar).not.toBeNull()
    // Only one child div should remain (the fill); the flag span was
    // removed.
    const flag = bar?.querySelector('span[aria-hidden]')
    expect(flag).toBeNull()
    vi.doUnmock('@/data/learnerOverviewFixtures')
  })

  it("today's ring still renders when today is inactive", async () => {
    vi.resetModules()
    vi.doMock('@/data/learnerOverviewFixtures', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/learnerOverviewFixtures')>(
          '@/data/learnerOverviewFixtures',
        )
      // Flip Saturday inactive while keeping the same todayIso anchor.
      const week = actual.STREAK_THIS_WEEK.map((c, i) =>
        i === 6 ? { ...c, active: false } : c,
      )
      return {
        ...actual,
        STREAK_THIS_WEEK: week,
        // Panel reads via `streakThisWeekFor(brand)` — override so the
        // mocked week reaches the render regardless of brand.
        streakThisWeekFor: () => week,
      }
    })
    const [
      { LearnerOverviewPanel: Panel },
      { AccountProvider: Provider },
      { FeatureFlagProvider: FlagProvider },
      { LearningPathsPanelProvider: PathsProvider },
    ] = await Promise.all([
      import('@/components/dashboard/LearnerOverviewPanel'),
      import('@/context/AccountContext'),
      import('@/context/FeatureFlagContext'),
      import('@/components/learning/LearningPathsPanelContext'),
    ])
    render(
      <Provider>
        <FlagProvider>
          <MemoryRouter>
            <PathsProvider>
              <Panel />
            </PathsProvider>
          </MemoryRouter>
        </FlagProvider>
      </Provider>,
    )
    openWeekStrip()
    const todayCell = screen.getByRole('img', {
      name: /saturday may 20 — not yet · today/i,
    })
    // Today still wins the tallest-bar + primary-700 treatment even
    // when no activity has been logged yet — the "today" affordance
    // is height + color now (outline was retired).
    expect(todayCell).toHaveStyle({
      height: '36px',
      background: 'var(--color-primary-700)',
    })
    vi.doUnmock('@/data/learnerOverviewFixtures')
  })
})
