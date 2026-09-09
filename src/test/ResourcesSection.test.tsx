import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { resourcesCopyFor, resourcesFor } from '@/data/membership/resourcesFixtures'

/**
 * Resources — the rail section under Browse Catalog, added 2026-09-09.
 *
 * It is a RE-WIRE of the Free Content section archived on 2026-08-26, which is
 * why there is no new panel and no new fixture: `ResourcesPanel`,
 * `ResourceCard` and the brand-keyed resource set were all kept intact and
 * unreferenced for exactly this. What is worth pinning is therefore not "cards
 * render" — `ResourcesPanel.test.tsx` already owns that — but the three things
 * the re-wire itself could get wrong.
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

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('the Resources section', () => {
  it('is a rail item, directly under Browse Catalog', () => {
    // The placement is the ask, and adjacency is the whole of it: Browse
    // Catalog is what you buy, Resources is the free half of the same "go and
    // find something" job. Asserted as an INDEX rather than as presence,
    // because an item that drifts three rows down still passes a presence
    // check while no longer reading as a pair.
    renderShell('/dashboard-rebrand')
    const rail = screen
      .getAllByRole('button')
      .map((b) => b.textContent?.trim())
      .filter(Boolean) as string[]
    const catalog = rail.indexOf('Browse Catalog')
    expect(catalog).toBeGreaterThanOrEqual(0)
    expect(rail.indexOf('Resources')).toBe(catalog + 1)
  })

  it('opens from ?section=resources instead of degrading to the dashboard', () => {
    // `resources` was an id the shell deliberately did NOT know: absent from
    // VALID_SECTIONS, it resolved to null and fell through to Home. That is
    // the failure this guards — it looks like the rail item simply does
    // nothing, with no error anywhere.
    renderShell('/dashboard-rebrand?section=resources')
    const first = resourcesFor('xcel')[0]
    expect(screen.getByRole('heading', { name: first.title })).toBeInTheDocument()
    // Home's band would be here if the section had fallen through.
    expect(screen.queryByText(/current learning path/i)).toBeNull()
  })

  it('takes its hero copy from the fixtures file rather than a second copy of it', () => {
    // `resourcesCopyFor` owns this sentence, next to the resource list and to
    // the rule it has to follow ("say plainly that it is free"). The shell's
    // hero reads it instead of authoring a `SECTION_HERO_META` entry, so the
    // two cannot drift. Comparing against the fixture — not against a literal
    // — is what makes that true rather than merely intended.
    renderShell('/dashboard-rebrand?section=resources')
    expect(
      screen.getByText(resourcesCopyFor('xcel').heroDescription),
    ).toBeInTheDocument()
  })

  it('carries no "Included with your membership" eyebrow', () => {
    // The one section defined by needing no membership at all. On XCEL that is
    // doubly true — it sells none — but the exclusion predates the brand: it
    // is in MEMBERSHIP_EYEBROW_SECTIONS' own reasoning, and an eyebrow here
    // would claim the opposite of what the page says.
    renderShell('/dashboard-rebrand?section=resources')
    expect(screen.queryByText(/included with your membership/i)).toBeNull()
  })
})
