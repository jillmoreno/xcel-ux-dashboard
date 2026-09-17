import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { WhatsNewWidget } from '@/components/membership/WhatsNewWidget'

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
  // The `dashboard-whats-new-layout` gate was removed 2026-09-16 (the XCEL flag
  // audit), and with it the "returns null when the flag is disabled" case. The
  // widget had already been archived off the overview on 2026-08-05, so the flag
  // was gating a component with no render site. These tests keep covering what
  // it RENDERS, which is what a restore would depend on.
  it('renders the image carousel (6 cards) + See All', () => {
    renderWidget()
    // The carousel renders 6 cards, each a level-3 heading, with real titles
    // for the active brand. XCEL authors no What's New SLIDES, so what fills
    // the carousel is its course set — which is the widget's own fallback, not
    // a defect. The LMS asserted CRE's "AI MasterTracks for Agents" here.
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6)
    expect(
      screen.getByRole('heading', { level: 3, name: /life & health pre-license course/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see all/i })).toBeInTheDocument()
    // Lede + delivery meta (the play affordance rides on podcast/video).
    expect(screen.getByText(/latest features, content, and tools/i)).toBeInTheDocument()
    // The delivery meta rides on the card's modality. XCEL sells no podcasts,
    // so the video-delivered courses carry it instead.
    expect(screen.getAllByText(/video/i).length).toBeGreaterThan(0)
  })

  it('uses the caller-supplied title (e.g. "What\'s Trending")', () => {
    renderWidget({ title: "What's Trending" })
    // The section header renders the supplied title as visible text.
    expect(screen.getByText("What's Trending")).toBeInTheDocument()
  })
})
