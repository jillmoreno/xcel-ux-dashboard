import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { WhatsNewWidget } from '@/components/membership/WhatsNewWidget'

/** Seed the persisted flag state the provider reads on mount. The flag is now a
 *  plain on/off switch — no layout / background variants. */
function seedFlag(state: { enabled?: boolean }) {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'dashboard-whats-new-layout': state }),
  )
}

function renderWidget(props?: { title?: string }) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <WhatsNewWidget {...props} />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('WhatsNewWidget', () => {
  it('returns null when the flag is disabled', () => {
    seedFlag({ enabled: false })
    renderWidget()
    expect(screen.queryByRole('region', { name: /what's new/i })).toBeNull()
    expect(screen.queryByText(/latest features, content, and tools/i)).toBeNull()
  })

  it('renders the image carousel (6 cards) + See All when enabled', () => {
    seedFlag({ enabled: true })
    renderWidget()
    // The carousel renders 6 cards, each a level-3 heading. The default brand is
    // CRE, so real per-brand titles show (replacing the old "Feature Title").
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6)
    expect(
      screen.getByRole('heading', { level: 3, name: /ai mastertracks for agents/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see all/i })).toBeInTheDocument()
    // Lede + delivery meta (the play affordance rides on podcast/video).
    expect(screen.getByText(/latest features, content, and tools/i)).toBeInTheDocument()
    expect(screen.getAllByText(/podcast/i).length).toBeGreaterThan(0)
  })

  it('uses the caller-supplied title (e.g. "What\'s Trending")', () => {
    seedFlag({ enabled: true })
    renderWidget({ title: "What's Trending" })
    // The section header renders the supplied title as visible text.
    expect(screen.getByText("What's Trending")).toBeInTheDocument()
  })
})
