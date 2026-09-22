import { render, screen, within } from '@testing-library/react'
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
  it('is a rail item in MY LEARNING, not Explore', () => {
    /*
     * The placement has moved twice on 2026-09-16 and this is where it landed.
     *
     * It was `catalog + 1` — directly UNDER Browse Catalog in Explore, the two
     * read as the paid and free halves of one "go and find something" job. Then
     * it led Explore. Now it is in MY LEARNING: a pre-licensing candidate does
     * not browse the reference material, they use it, against the one
     * curriculum they are working.
     *
     * ASSERTED BY GROUP, not by index in the flat button list — and that is the
     * point of this version of the test. The move changed which `<ul>` the row
     * belongs to and changed the flat order NOT AT ALL (Resources · Rubi ·
     * Browse Catalog are still consecutive in that order), so every index-based
     * assertion in the suite passed the move without noticing it. Each group's
     * list is labelled by its caption, which is the handle that can see it.
     *
     * RENDERED ON QE FOCUSED BY NAME, not on whatever is default. This is a
     * test of the rail BASELINE (`NAV_SECTION_FLAGS`), and the two pacing
     * versions trim four rows off it as a property of their LAYOUT — Resources
     * among them. It passed on a bare `/dashboard-rebrand` only while the
     * default happened to be a version with the full rail; when the default
     * moved to Testing 2 on 2026-09-21 it started asserting the baseline
     * against a deliberately trimmed rail.
     */
    renderShell('/dashboard-rebrand?version=discoverability-qe-focused')
    const mine = screen.getByRole('list', { name: 'My Learning' })
    expect(within(mine).getByRole('button', { name: 'Resources' })).toBeInTheDocument()
    // There is no Explore group left to be in: Browse Catalog was its last row
    // and went off in the baseline on 2026-09-16, so the group drops whole.
    expect(screen.queryByRole('list', { name: 'Explore' })).toBeNull()
    // It moved WITH Rubi and kept its order relative to it.
    const mineRows = within(mine)
      .getAllByRole('button')
      .map((b) => b.textContent?.trim())
    expect(mineRows.slice(-2)).toEqual(['Resources', 'Rubi Insights'])
    // At the END of the group — "move up" meant up across the Explore divider,
    // not above Home, which is the rail's anchor.
    expect(mineRows[0]).toBe('Home')
    // …and Browse Catalog is off in the baseline, not merely elsewhere. The
    // SECTION still resolves from `?section=catalog` — the flag hides the rail
    // row, it does not disable anything.
    expect(screen.queryByRole('button', { name: 'Browse Catalog' })).toBeNull()
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
