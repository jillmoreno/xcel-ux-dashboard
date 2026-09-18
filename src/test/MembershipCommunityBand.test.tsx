import { readFileSync } from 'node:fs'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { LoFiProvider } from '@/context/LoFiContext'
import { communityFor } from '@/data/membership/communityFixtures'

function seed(brand: string, tier = 'low') {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, tier }))
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('Community row in the account dropdown', () => {
  const renderMenu = async (tier: string) => {
    const { AccountMenu } = await import('@/components/layout/AccountMenu')
    const { FeatureFlagProvider } = await import('@/context/FeatureFlagContext')
    window.localStorage.clear()
    seed('xcel', tier)
    const view = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <LoFiProvider>
              <AccountMenu initials="PR" />
            </LoFiProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }))
    return view
  }

  it('shows no community row, for a member OR a non-member — XCEL has none', async () => {
    /*
     * REWRITTEN 2026-09-18, and the rewrite is the point.
     *
     * This asserted that the row is hidden from a NON-MEMBER, with a free
     * outbound row (the Resource Center) as its control. It was passing
     * VACUOUSLY: `communityFor('xcel')` is `null`, so the row is absent at
     * every tier, and the control only ever proved the menu had opened. The
     * gating rule was never its subject on the one brand this repo ships.
     *
     * That went unnoticed until the four free rows were removed from the menu
     * on 2026-09-18 and the control — the only assertion in it that could
     * fail — disappeared with them.
     *
     * So both halves are asserted for what they actually are: the row is
     * absent at BOTH tiers, and the FIXTURE is why, named rather than left for
     * a reader to infer from a passing absence check.
     */
    expect(communityFor('xcel')).toBeNull()
    for (const tier of ['non-member', 'low']) {
      const { unmount } = await renderMenu(tier)
      expect(screen.queryByRole('menuitem', { name: /Facebook Community/i })).toBeNull()
      // THE CONTROL, repointed off the removed free row onto an account
      // destination that is always in this menu — so "no community row" still
      // cannot pass because the menu failed to open.
      expect(screen.getByRole('menuitem', { name: /Logout/i })).toBeInTheDocument()
      unmount()
    }
  })

  it('gates the row on membership at SOURCE, since no brand here can show it', async () => {
    // The rule this file is named for, and the DOM cannot reach it: with the
    // fixture null for the only brand, a member render proves nothing. Read
    // from the source instead of asserting an absence that is true for the
    // wrong reason — the pattern `smoke-desktop.mjs` and the removed-flag
    // guards use.
    const src = readFileSync('src/components/layout/AccountMenu.tsx', 'utf8')
    expect(src).toContain("const community = membership === 'member' ? communityFor(brand) : null")
  })

  it('drops the whole outbound group, divider included, now the free rows are gone', async () => {
    /*
     * The consequence of the 2026-09-18 removal on THIS brand: the four free
     * rows were the group's only members (community being null), so the group
     * empties — and a divider with nothing under it is the "reads as a load
     * failure" defect the rail's drop-empty rule exists to prevent. It falls
     * out through the `outboundRows.length > 0` guard that was already there
     * for a brand with no resources.
     *
     * Asserted as the absence of all four, by their accessible names, because
     * each was its own `menuitem` — and one surviving would be the plausible
     * miss.
     */
    const { unmount } = await renderMenu('low')
    for (const name of [
      /Resource Center/i,
      /What's New/i,
      /Insurance Career Guide/i,
      /Insurance Salary Guide/i,
    ]) {
      expect(screen.queryByRole('menuitem', { name })).toBeNull()
    }
    unmount()
  })
})

