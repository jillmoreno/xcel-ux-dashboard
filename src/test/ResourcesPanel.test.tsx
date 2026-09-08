import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { LoFiProvider } from '@/context/LoFiContext'
import { ResourcesPanel } from '@/components/membership/ResourcesPanel'

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
    renderPanel()
    expect(screen.getByRole('link', { name: /read the blog/i })).toHaveAttribute(
      'href',
      'https://www.xcelsolutions.com/whats-new/',
    )
    expect(screen.getByRole('link', { name: /browse resources/i })).toHaveAttribute(
      'href',
      'https://www.xcelsolutions.com/resource-center/',
    )
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
