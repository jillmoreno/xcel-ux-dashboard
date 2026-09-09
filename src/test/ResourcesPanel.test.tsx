import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { LoFiProvider } from '@/context/LoFiContext'
import { ResourcesPanel } from '@/components/membership/ResourcesPanel'
import { resourcesFor } from '@/data/membership/resourcesFixtures'

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand: 'xcel', membership: 'member' }),
  )
})

function renderPanel() {
  return render(
    <AccountProvider>
      <LoFiProvider>
        <ResourcesPanel />
      </LoFiProvider>
    </AccountProvider>,
  )
}

describe('ResourcesPanel', () => {

  it('points each card at its real XCEL URL', () => {
    // These were McKissock's blog + appraisal-podcast URLs; the resource set is
    // per-brand and XCEL authors its own four, all on xcelsolutions.com.
    // Confirmed live 2026-09-09 — see the dead-slug guard below for why that
    // sentence is load-bearing rather than decorative.
    renderPanel()
    expect(screen.getByRole('link', { name: /read the blog/i })).toHaveAttribute(
      'href',
      'https://www.xcelsolutions.com/resources/blog/industry-updates-and-xcel-improvements',
    )
    expect(screen.getByRole('link', { name: /browse resources/i })).toHaveAttribute(
      'href',
      'https://www.xcelsolutions.com/resources',
    )
  })

  it('never reaches for the plausible slugs again — all four 404', () => {
    // The original four hrefs were guesses shaped like the marketing names
    // (/resource-center/, /whats-new/, /career-guide/, /salary-guide/) and
    // every one of them is dead. XCEL nests the set under /resources and gives
    // the guides descriptive slugs.
    //
    // Asserting the DEAD values stay dead — rather than only that today's
    // values are present — is the pattern `smoke-desktop.mjs` and
    // `ProfilePersonalizeContrast` use, and it earns its place here for the
    // same reason: the wrong answer is the one that looks right. A test can't
    // reach the network, so the next best guard is refusing the specific
    // guesses someone would re-derive from the card titles.
    const dead = ['/resource-center', '/whats-new', '/career-guide', '/salary-guide']
    for (const href of resourcesFor('xcel').map((r) => r.href)) {
      for (const slug of dead) {
        expect(href, `${href} is a known-404 slug`).not.toContain(slug)
      }
    }
  })

  it('leads with the brand resource set in authored order', () => {
    // The panel renders `resourcesFor(brand)` in order, so the first card is the
    // first authored entry. It read "Blog" when every brand shared McKissock's
    // set; XCEL's own set leads with the Resource Center.
    const items = renderPanel().container.querySelectorAll('[role="listitem"]')
    expect(within(items[0] as HTMLElement).getByRole('heading').textContent).toBe(
      'Resource Center',
    )
  })
})
