import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import {
  DashboardRecommendedBand,
  type RecommendedBandPreview,
} from '@/components/membership/DashboardRecommendedBand'

function seedAccount() {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', membership: 'member' }))
}
function renderBand(preview?: RecommendedBandPreview) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <DashboardRecommendedBand preview={preview} />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

// The band's header eyebrow is a stable anchor in both the carousel and the
// grid layout (the region landmark only exists in carousel mode).
const HEADER = /^recommended for you$/i
const bandSection = () => screen.getByText(HEADER).closest('section')!

beforeEach(() => {
  window.localStorage.clear()
})

describe('DashboardRecommendedBand', () => {
  it('defaults to the transparent (none) band with the accent-text header', () => {
    seedAccount() // no flag — the band background is hardcoded to `none`
    renderBand()
    expect(bandSection().style.background).toBe('transparent')
    // The light/none band uses the large section-lead header token (the
    // primary-500 "Recommended for you" header, matching the What's New widget).
    expect(screen.getByText(HEADER).style.color).toContain('section-lead')
  })

  it('drops the full-bleed margins on the default none band so it aligns to the content gutter', () => {
    seedAccount()
    renderBand()
    // No-bleed: margins are zeroed so the band sits inside SectionShell's gutter.
    expect(bandSection().style.marginLeft).toBe('0px')
    expect(bandSection().style.marginRight).toBe('0px')
  })

  it('renders a dark primary-800 band with white header text when a preview forces it', () => {
    seedAccount()
    renderBand({ cardStyle: 'shelf', background: 'primary-800' })
    expect(bandSection().style.background).toContain('primary-800')
    expect(screen.getByText(HEADER).style.color).toContain('text-inverse')
  })
})
