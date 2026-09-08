import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AccountProvider, type Brand } from '@/context/AccountContext'
import { AchievementsWidget } from '@/components/dashboard/AchievementsWidget'

function renderWidget(brand: Brand = 'cre') {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand, membership: 'member' }),
  )
  return render(
    <AccountProvider>
      <MemoryRouter>
        <AchievementsWidget />
      </MemoryRouter>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('AchievementsWidget — section heading', () => {
  it('renders an uppercase section heading with the CRE earned count and total', () => {
    renderWidget('cre')
    // Heading is rendered as a single <span> outside the card,
    // matching the LearnerOverviewPanel SectionHeading pattern.
    // Label text is one node so a plain getByText works.
    expect(
      screen.getByText(/^Achievements \(9 of 57\)$/i),
    ).toBeInTheDocument()
  })

  it('renders a "View All →" link to /account/achievements', () => {
    renderWidget('cre')
    const view = screen.getByRole('link', { name: /view all/i })
    expect(view).toHaveAttribute('href', '/account/achievements')
  })
})

describe('AchievementsWidget — Within Reach card grid', () => {
  // The Within Reach zone is a 2-per-row LANDSCAPE CARD GRID. Each card
  // is a `WithinReachCard` rendered as a `<button>` (not a Link), and
  // cards are grouped under "One Step Away · N" / "In Progress · N"
  // mini-labels. Per-card behavior lives in `WithinReachCard.test.tsx`;
  // here we just verify the widget's plumbing.

  it('renders both subgroup mini-labels (One Step Away + In Progress) for CRE', () => {
    renderWidget('cre')
    expect(screen.getByText(/^One Step Away$/)).toBeInTheDocument()
    expect(screen.getByText(/^In Progress$/)).toBeInTheDocument()
  })

  it('renders the One Step Away subgroup with exactly 2 ready cards for CRE', () => {
    renderWidget('cre')
    expect(
      screen.getByRole('button', { name: /perfect quiz — one step away/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /first review — one step away/i }),
    ).toBeInTheDocument()
  })

  it('renders the In Progress subgroup with exactly 2 progress cards for CRE', () => {
    renderWidget('cre')
    expect(
      screen.getByRole('button', {
        name: /100-day streak — in progress, 41% complete/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /premium 1-year — in progress, 88% complete/i,
      }),
    ).toBeInTheDocument()
  })

  it('cards surface the unlockCondition as the description', () => {
    renderWidget('cre')
    // CRE rail items: perfect-quiz, first-review, streak-100, premium-1y.
    expect(
      screen.getByText('Score 100% on a quiz for the first time.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Leave your first course review.')).toBeInTheDocument()
    expect(
      screen.getByText('Log learning one hundred days in a row.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Hold Premium for twelve consecutive months.'),
    ).toBeInTheDocument()
  })

  it('progress cards render the percentage in Cutive Mono in the title row', () => {
    renderWidget('cre')
    expect(screen.getByText(/^41%$/)).toBeInTheDocument()
    expect(screen.getByText(/^88%$/)).toBeInTheDocument()
  })

  it('progress cards render the "N of M unit" meta line', () => {
    renderWidget('cre')
    expect(screen.getByText('41 of 100 days')).toBeInTheDocument()
    expect(screen.getByText('322 of 365 days')).toBeInTheDocument()
  })

  it("does NOT render any 'Claim' CTA in the rail (cards are surfaced read-only)", () => {
    renderWidget('cre')
    expect(screen.queryByText(/^Claim/i)).not.toBeInTheDocument()
  })

  it("does NOT render any 'Ready' status pill in the rail", () => {
    renderWidget('cre')
    // The only "Ready"-ish text should be the (renamed) subgroup label
    // "One Step Away" — which doesn't match a bare /Ready/.
    expect(screen.queryByText(/^Ready$/i)).not.toBeInTheDocument()
  })

  it('Within Reach total reads "4 total" for CRE', () => {
    renderWidget('cre')
    expect(screen.getByText('4 total')).toBeInTheDocument()
  })

  it("personal best snapshot weaves into the rarity line for streak-100", () => {
    renderWidget('cre')
    // streak-100 fixture has personalBest: { value: 41, unit: 'days' }
    // and rarityPct: 4 → "Best so far: 41 days · 4% of members"
    expect(
      screen.getByText('Best so far: 41 days · 4% of members'),
    ).toBeInTheDocument()
  })
})

describe('AchievementsWidget — Stamps strip', () => {
  it('renders 6 collected stamps in the strip', () => {
    renderWidget('cre')
    // The widget surfaces 6 recent earned stamps (was 5 originally;
    // bumped because CRE has 9 earned items and the prior cap left
    // 4 hidden). The Open-Passport CTA cell remains removed — the
    // section heading above the widget carries its own "View All"
    // link to /account/achievements.
    const stamps = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label')?.includes('stamped'))
    expect(stamps).toHaveLength(6)
    expect(
      screen.queryByRole('link', { name: /open full passport/i }),
    ).not.toBeInTheDocument()
  })

  it('CRE newest stamp (30-day Streak) is the leftmost stamp tile', () => {
    renderWidget('cre')
    const stamps = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label')?.includes('stamped'))
    // 30-day Streak is the newest (earnedOn 2026-05-08).
    expect(stamps[0].getAttribute('aria-label')).toMatch(/30-day streak/i)
  })

  it('older stamps (>30 days from anchored today) carry the faded opacity', () => {
    renderWidget('cre')
    // first-cert was earned 2026-03-02, demo today is 2026-05-20 →
    // ~79 days old → faded. The button wrapper takes opacity 0.78
    // (the v2 mockup's specific value — less heavy than the previous
    // 0.65 because the new uniform-square stamps already carry less
    // visual weight).
    const oldStamp = screen.getByRole('button', {
      name: /first certificate — stamped/i,
    })
    expect(oldStamp).toHaveStyle({ opacity: '0.78' })
  })
})

describe('AchievementsWidget — Tooltip behaviour', () => {
  // WithinReachCards intentionally do NOT have a tooltip wrapper — the
  // content that used to live in the tooltip (unlock condition,
  // rarity, personal best) is now surfaced directly on the card. The
  // tooltip behavior is still tested on the collected stamps below
  // since they retain their tooltip.
  it('CollectedStamp tooltip opens on focus and closes on Escape', () => {
    renderWidget('cre')
    const stamp = screen.getByRole('button', {
      name: /30-day streak — stamped/i,
    })
    fireEvent.focus(stamp)
    const tip = screen.getByRole('tooltip')
    expect(tip).toBeInTheDocument()
    expect(stamp.getAttribute('aria-describedby')).toContain(tip.id)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it("WithinReachCards do NOT wrap in a tooltip (content surfaced on the card)", () => {
    renderWidget('cre')
    const card = screen.getByRole('button', {
      name: /perfect quiz — one step away/i,
    })
    // Focusing a within-reach card should NOT open a tooltip — the
    // card's surfaced description + rarity already carry that content.
    fireEvent.focus(card)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('AchievementsWidget — Brand switch updates narrative', () => {
  it('McKissock renders Perfect Quiz one-step-away + 30-day progress', () => {
    renderWidget('mckissock')
    expect(
      screen.getByRole('button', { name: /perfect quiz — one step away/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /30-day streak — in progress/i,
      }),
    ).toBeInTheDocument()
  })

  it('Elite renders First-try Pass one-step-away + 30-day progress (22/30)', () => {
    renderWidget('elite')
    expect(
      screen.getByRole('button', {
        name: /first-try pass — one step away/i,
      }),
    ).toBeInTheDocument()
    // 30-day Streak progress at 22/30 → meta line "22 of 30 days".
    expect(screen.getByText('22 of 30 days')).toBeInTheDocument()
  })

  it('STC surfaces the streak-3 comeback nudge as one-step-away', () => {
    renderWidget('stc')
    expect(
      screen.getByRole('button', { name: /3-day streak — one step away/i }),
    ).toBeInTheDocument()
    // The card surfaces the unlockCondition; the readyPrompt is no
    // longer used as visible copy. So we expect the standard streak-3
    // unlock condition copy.
    expect(
      screen.getByText('Log learning three days in a row.'),
    ).toBeInTheDocument()
  })
})

describe('AchievementsWidget — Empty states', () => {
  it('renders the "all caught up" copy when both ready and progress are empty', async () => {
    vi.resetModules()
    vi.doMock('@/data/achievements', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/achievements')>(
          '@/data/achievements',
        )
      return {
        ...actual,
        railAchievementsFor: () => ({ ready: [], progress: [] }),
      }
    })
    const [
      { AchievementsWidget: Widget },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/AchievementsWidget'),
      import('@/context/AccountContext'),
    ])
    render(
      <Provider>
        <MemoryRouter>
          <Widget />
        </MemoryRouter>
      </Provider>,
    )
    // Spec: "Nothing right around the corner." + a sub-line about
    // tomorrow's quests appearing here.
    expect(
      screen.getByText(/nothing right around the corner\./i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/new stamps appear here when you[’']?re close\./i),
    ).toBeInTheDocument()
    vi.doUnmock('@/data/achievements')
  })

  it('renders the "passport is unstamped" copy when no recent stamps exist', async () => {
    vi.resetModules()
    vi.doMock('@/data/achievements', async () => {
      const actual =
        await vi.importActual<typeof import('@/data/achievements')>(
          '@/data/achievements',
        )
      return {
        ...actual,
        recentStampsFor: () => [],
      }
    })
    const [
      { AchievementsWidget: Widget },
      { AccountProvider: Provider },
    ] = await Promise.all([
      import('@/components/dashboard/AchievementsWidget'),
      import('@/context/AccountContext'),
    ])
    render(
      <Provider>
        <MemoryRouter>
          <Widget />
        </MemoryRouter>
      </Provider>,
    )
    expect(
      screen.getByText(/your passport is unstamped\./i),
    ).toBeInTheDocument()
    vi.doUnmock('@/data/achievements')
  })
})

describe('AchievementsWidget — Status communicated in text', () => {
  it("every rail card's accessible name carries its state suffix", () => {
    renderWidget('cre')
    // Cards are <button>s with "— one step away" or
    // "— in progress, N% complete" in their aria-label.
    expect(
      screen.getAllByRole('button', { name: /— one step away/i }),
    ).toHaveLength(2)
    expect(
      screen.getAllByRole('button', { name: /— in progress,.*complete/i }),
    ).toHaveLength(2)
    // Collected stamps are also <button>s with "— stamped".
    expect(
      screen.getAllByRole('button', { name: /— stamped/i }).length,
    ).toBeGreaterThanOrEqual(5)
  })
})

describe('AchievementsWidget — Within Reach chip', () => {
  it('summarizes the rail total in the eyebrow chip', () => {
    renderWidget('cre')
    // CRE rail has 4 total items (2 ready + 2 progress).
    const eyebrow = screen.getByText(/within reach/i).closest('div')!
    expect(within(eyebrow).getByText(/^4 total$/)).toBeInTheDocument()
  })
})
