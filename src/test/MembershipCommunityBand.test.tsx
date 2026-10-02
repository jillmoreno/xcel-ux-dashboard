import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { LoFiProvider } from '@/context/LoFiContext'

function seed(brand: string, tier = 'low') {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, tier }))
}

beforeEach(() => {
  window.localStorage.clear()
})

/**
 * INVERTED 2026-09-30. This file used to pin the dropdown's outbound group —
 * that a non-member saw the free rows but not the member-gated community row.
 * The whole group was archived (`account-menu-free-content`), so the old
 * assertions describe a menu that no longer exists.
 *
 * Kept and turned around rather than deleted: the gating rule it encoded is the
 * thing most likely to be lost, and a suite that simply disappears leaves no
 * trace that the menu ever made that distinction. Restoring the group means
 * restoring the two assertions named in the archive row's restore note.
 */
describe('the account dropdown no longer carries the outbound group', () => {
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

  it('shows no free-content rows to a MEMBER', async () => {
    /* A member is the case that used to render the MOST rows here — the four
       free ones plus the gated community row — so it is the strongest check
       that the group is gone rather than merely gated to nothing. */
    const { unmount } = await renderMenu('high')
    expect(
      screen.queryByRole('menuitem', { name: /Resource Center.*opens in a new tab/i }),
    ).toBeNull()
    expect(screen.queryByRole('menuitem', { name: /Facebook Community/i })).toBeNull()
    unmount()
  })

  it('shows no outbound rows at all, to anyone', async () => {
    /* Role-based rather than name-based: the rows are gone, so naming them one
       by one would only pin the four that happened to exist on XCEL. Every
       remaining menu item is an in-app destination. */
    const { unmount } = await renderMenu('non-member')
    const outbound = screen
      .getAllByRole('menuitem')
      .filter((el) => el.getAttribute('target') === '_blank')
    expect(outbound).toHaveLength(0)
    unmount()
  })
})

