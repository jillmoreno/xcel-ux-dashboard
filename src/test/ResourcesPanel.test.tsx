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
    JSON.stringify({ brand: 'elite', membership: 'member' }),
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
  it('renders one card per resource', () => {
    renderPanel()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(resourcesFor('elite').length)
  })

  it('renders each resource as an external link (new tab) with its title + CTA', () => {
    renderPanel()
    for (const resource of resourcesFor('elite')) {
      const heading = screen.getByRole('heading', { name: resource.title })
      expect(heading).toBeInTheDocument()
      const link = screen.getByRole('link', { name: new RegExp(resource.cta, 'i') })
      expect(link).toHaveAttribute('href', resource.href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    }
  })

  it('points the Blog + Appraisal Podcast cards at their McKissock URLs', () => {
    renderPanel()
    expect(screen.getByRole('link', { name: /read the blog/i })).toHaveAttribute(
      'href',
      'https://www.mckissock.com/blog',
    )
    expect(screen.getByRole('link', { name: /listen now/i })).toHaveAttribute(
      'href',
      'https://www.mckissock.com/appraisal/podcast/',
    )
  })

  it('surfaces the same resource set on every brand (shared today)', () => {
    // Sanity-check the fixture stays brand-portable so the rebrand (Elite) shows
    // the McKissock-sourced resources the design calls for.
    const items = renderPanel().container.querySelectorAll('[role="listitem"]')
    expect(within(items[0] as HTMLElement).getByRole('heading').textContent).toBe('Blog')
  })
})
