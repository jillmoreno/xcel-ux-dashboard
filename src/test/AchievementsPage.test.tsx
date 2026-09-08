import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AccountProvider, type Brand } from '@/context/AccountContext'
import { AchievementsPage } from '@/pages/AchievementsPage'

function renderAt(
  url: string = '/account/achievements',
  brand: Brand = 'cre',
) {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand, membership: 'member' }),
  )
  return render(
    <AccountProvider>
      <MemoryRouter initialEntries={[url]}>
        <AchievementsPage />
      </MemoryRouter>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('AchievementsPage — default tab', () => {
  it('lands on the "All" tab when no ?category param is set', () => {
    renderAt('/account/achievements')
    const tab = screen.getByRole('tab', { name: /^all$/i })
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })

  it('reads the active category from ?category param', () => {
    renderAt('/account/achievements?category=mastery')
    const tab = screen.getByRole('tab', { name: /^mastery/i })
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })

  it('falls back to "All" for unknown category names', () => {
    renderAt('/account/achievements?category=does-not-exist')
    const tab = screen.getByRole('tab', { name: /^all$/i })
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })

  it('?category=streaks activates the Streaks tab', () => {
    renderAt('/account/achievements?category=streaks')
    const tab = screen.getByRole('tab', { name: /^streaks/i })
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })
})

describe('AchievementsPage — category counts', () => {
  it('CRE shows the right earned/total counts on each tab', () => {
    renderAt('/account/achievements', 'cre')
    // Streaks bucket (8 streak + 5 engagement = 13 total). CRE earned:
    // streak-7 + streak-30 = 2.
    expect(
      within(screen.getByRole('tab', { name: /^streaks/i })).getByText(/2\/13/),
    ).toBeInTheDocument()
    // Achievements bucket (13 total): first-cert + five-courses +
    // path-done + first-course = 4.
    expect(
      within(screen.getByRole('tab', { name: /^achievements/i })).getByText(/4\/13/),
    ).toBeInTheDocument()
  })
})

describe('AchievementsPage — Hidden tab visibility', () => {
  it('Hidden tab is suppressed when the user has no hidden unlocks', () => {
    renderAt('/account/achievements', 'cre')
    expect(
      screen.queryByRole('tab', { name: /^hidden/i }),
    ).not.toBeInTheDocument()
  })

  it('?category=hidden with no unlocks falls back to All', () => {
    renderAt('/account/achievements?category=hidden', 'cre')
    const all = screen.getByRole('tab', { name: /^all$/i })
    expect(all).toHaveAttribute('aria-selected', 'true')
  })
})

describe('AchievementsPage — stats row', () => {
  it('shows the stamps-collected count out of the catalog total', () => {
    renderAt('/account/achievements', 'cre')
    expect(screen.getByText('9 / 57')).toBeInTheDocument()
  })

  it('Closest Pending stat reflects the highest % progress item', () => {
    renderAt('/account/achievements', 'cre')
    // CRE: premium-1y is 322/365 ≈ 88% — beats 100-day streak at 41%.
    // The title also appears in the tile aria-label below — assert the
    // unique stat-row meta (count + percent) so we hit exactly one node.
    expect(screen.getByText(/322 \/ 365 · 88%/)).toBeInTheDocument()
    // Premium 1-year appears in the stat value AND in the all-view
    // tile aria-label — both contain the title text, so just confirm
    // at least one shows up.
    expect(
      screen.getAllByText(/^Premium 1-year$/).length,
    ).toBeGreaterThanOrEqual(1)
  })
})

describe('AchievementsPage — All view', () => {
  it('renders every non-hidden achievement', () => {
    renderAt('/account/achievements', 'cre')
    // Spot-check a few across categories — the "All" panel includes
    // earned, ready, progress, and locked from every category except
    // hidden-locked.
    expect(
      screen.getByRole('button', { name: /30-day streak — earned/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /perfect quiz — ready/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /100-day streak — in progress/i }),
    ).toBeInTheDocument()
    // Locked example: 200-day streak.
    expect(
      screen.getByRole('button', { name: /200-day streak — locked/i }),
    ).toBeInTheDocument()
  })

  it('"All" panel suppresses hidden-locked Easter eggs', () => {
    renderAt('/account/achievements', 'cre')
    // Hidden category locked items render as "???" but in the All view
    // we hide them entirely so the surprise stays. Smoke-check by name.
    expect(screen.queryByText(/^Polymath$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Library Card$/)).not.toBeInTheDocument()
  })
})

describe('AchievementsPage — Brand switch', () => {
  it('McKissock surfaces its 9-earned narrative', () => {
    renderAt('/account/achievements', 'mckissock')
    expect(screen.getByText('9 / 57')).toBeInTheDocument()
  })

  it('STC surfaces its 6-earned lapsed narrative', () => {
    renderAt('/account/achievements', 'stc')
    expect(screen.getByText('6 / 57')).toBeInTheDocument()
  })
})
