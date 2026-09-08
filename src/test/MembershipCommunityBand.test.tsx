import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { LoFiProvider } from '@/context/LoFiContext'
import { MembershipCommunityBand } from '@/components/membership/MembershipCommunityBand'
import { ResourcesPanel } from '@/components/membership/ResourcesPanel'
import { communityFor } from '@/data/membership/communityFixtures'
import { resourcesFor } from '@/data/membership/resourcesFixtures'

function seed(brand: string, tier = 'low') {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, tier }))
}

function renderBand() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <LoFiProvider>
          <MembershipCommunityBand />
        </LoFiProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('MembershipCommunityBand', () => {
  it('renders the community with its exclusivity stated and an outbound CTA', () => {
    seed('mckissock')
    renderBand()
    const community = communityFor('mckissock')!
    expect(screen.getByRole('heading', { name: community.name })).toBeInTheDocument()
    // No "Membership Exclusive" badge — the band sits under "Included with Your
    // Membership", so the badge only restated the section it lived in.
    expect(screen.queryByText(/membership exclusive/i)).toBeNull()
    const link = screen.getByRole('link', { name: new RegExp(community.cta, 'i') })
    expect(link).toHaveAttribute('href', community.href)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    for (const highlight of community.highlights) {
      expect(screen.getByText(highlight)).toBeInTheDocument()
    }
  })

  it('renders nothing for a brand with no community', () => {
    // Every brand but McKissock today — the band must self-hide rather than
    // leave an empty "Your Membership Community" shell on the page.
    for (const brand of ['cre', 'elite', 'fitzgerald', 'stc']) {
      window.localStorage.clear()
      seed(brand)
      const { container, unmount } = renderBand()
      expect(communityFor(brand as never)).toBeNull()
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })

  it('keeps the community OFF the Free Content set', () => {
    // The split is the point: Free Content is free by definition, so a
    // membership-only item there reintroduces the mixed-gating problem that
    // made the old External Resources page unreadable.
    const communityId = communityFor('mckissock')!.id
    for (const brand of ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc'] as const) {
      expect(resourcesFor(brand).map((r) => r.id)).not.toContain(communityId)
    }
  })
})

describe('Free Content fixtures', () => {
  it('carries no gated items on any brand', () => {
    // A resource with no CTA, or one flagged member-only, does not belong on a
    // page whose title promises the opposite.
    for (const brand of ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc'] as const) {
      for (const resource of resourcesFor(brand)) {
        expect(resource.cta).toBeTruthy()
        expect(resource.href).toMatch(/^https?:\/\//)
      }
    }
  })

  it('shows Fitzgerald its free NP podcasts with live links', () => {
    // Regression (2026-08-26): Fitzgerald's resources carried no `openToAll`
    // flag, so a non-member saw "Member Exclusive" on content whose own URLs are
    // /free-np-podcast/ and /free-pmhnp-podcast/.
    const hrefs = resourcesFor('fitzgerald').map((r) => r.href)
    expect(hrefs).toContain('https://www.fhea.com/free-np-podcast/')
    expect(hrefs).toContain('https://www.fhea.com/free-pmhnp-podcast/')
  })
})

describe('Free content in the account dropdown', () => {
  it('lists each free resource as an outbound row (archived page replacement)', async () => {
    // The Free Content PAGE is archived; these links live in the account menu
    // now. They must stay real anchors opening a new tab — that is the whole
    // reason they were moved out of the rail.
    const { AccountMenu } = await import('@/components/layout/AccountMenu')
    const { FeatureFlagProvider } = await import('@/context/FeatureFlagContext')
    window.localStorage.clear()
    seed('mckissock')
    render(
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
    for (const resource of resourcesFor('mckissock')) {
      const row = screen.getByRole('menuitem', {
        name: new RegExp(`${resource.title}.*opens in a new tab`, 'i'),
      })
      expect(row).toHaveAttribute('href', resource.href)
      expect(row).toHaveAttribute('target', '_blank')
      expect(row).toHaveAttribute('rel', expect.stringContaining('noopener'))
    }
  })
})

describe('Community row in the account dropdown', () => {
  const renderMenu = async (tier: string) => {
    const { AccountMenu } = await import('@/components/layout/AccountMenu')
    const { FeatureFlagProvider } = await import('@/context/FeatureFlagContext')
    window.localStorage.clear()
    seed('mckissock', tier)
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

  it('shows the community to a MEMBER, under its short label', async () => {
    await renderMenu('low')
    const community = communityFor('mckissock')!
    // Short label, not the full name: the full one wrapped the row to two lines
    // in the 280px menu while every other row stayed at one.
    const row = screen.getByRole('menuitem', { name: /Facebook Community.*opens in a new tab/i })
    expect(row).toHaveAttribute('href', community.href)
    expect(row).toHaveAttribute('target', '_blank')
  })

  it('hides the community from a NON-MEMBER', async () => {
    // It is the one gated item in that menu group. A non-member sees the free rows
    // only — not a link to a group they can't join. The Membership page is
    // where they're sold it.
    const { unmount } = await renderMenu('non-member')
    expect(screen.queryByRole('menuitem', { name: /Facebook Community/i })).toBeNull()
    expect(screen.getByRole('menuitem', { name: /Blog.*opens in a new tab/i })).toBeInTheDocument()
    unmount()
  })
})

describe('Free Content panel', () => {
  it('renders identically for a member and a non-member', () => {
    const markupFor = (tier: string) => {
      window.localStorage.clear()
      seed('mckissock', tier)
      const { container, unmount } = render(
        <MemoryRouter>
          <AccountProvider>
            <LoFiProvider>
              <ResourcesPanel />
            </LoFiProvider>
          </AccountProvider>
        </MemoryRouter>,
      )
      const html = container.innerHTML
      unmount()
      return html
    }
    // There is no non-member variant at all — the panel takes no `locked` prop, so
    // the two views cannot drift.
    expect(markupFor('non-member')).toBe(markupFor('low'))
  })

  it('lists only the blog and the podcast for McKissock', () => {
    seed('mckissock')
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <LoFiProvider>
            <ResourcesPanel />
          </LoFiProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const items = within(container).getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })
})
