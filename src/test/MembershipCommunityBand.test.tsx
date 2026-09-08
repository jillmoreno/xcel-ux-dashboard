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

  it('hides the community from a NON-MEMBER', async () => {
    // It is the one gated item in that menu group. A non-member sees the free rows
    // only — not a link to a group they can't join. The Membership page is
    // where they're sold it.
    const { unmount } = await renderMenu('non-member')
    expect(screen.queryByRole('menuitem', { name: /Facebook Community/i })).toBeNull()
    // A free outbound row still shows. It asserted "Blog" when every brand
    // shared McKissock's resource set; XCEL's own set leads with the Resource
    // Center. The point is unchanged: the gated row goes, the free ones stay.
    expect(
      screen.getByRole('menuitem', { name: /Resource Center.*opens in a new tab/i }),
    ).toBeInTheDocument()
    unmount()
  })
})

