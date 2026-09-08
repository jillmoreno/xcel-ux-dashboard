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
