import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AccountProvider, type Brand } from '@/context/AccountContext'
import { AchievementsPage } from '@/pages/AchievementsPage'

function renderAt(
  url: string = '/account/achievements',
  brand: Brand = 'xcel',
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

