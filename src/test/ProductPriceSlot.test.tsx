import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, it, expect } from 'vitest'
import { ProductPriceSlot } from '@/components/courses/ProductPriceSlot'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import type { CommerceState } from '@/data/commerce/entitlement'

/**
 * The Purchase Course sheet price slot (`panel` layout) must never render a
 * "$0.00" lead for an entitled member. By default it shows the "Included ·
 * {tier} Membership" chip alone; the `pricing-entitled-savings` flag adds the
 * original price struck through as a savings anchor.
 */
const included: CommerceState = { kind: 'included' }
const LIST_PRICE = 99.99

afterEach(() => {
  window.localStorage.clear()
})

function renderSlot(flagOn: boolean) {
  if (flagOn) {
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'pricing-entitled-savings': { enabled: true } }),
    )
  }
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <ProductPriceSlot panel state={included} listPrice={LIST_PRICE} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('ProductPriceSlot — panel, entitled member', () => {
  it('flag OFF (default): chip only — no "$0.00", no struck price', () => {
    renderSlot(false)
    // The benefit chip is present…
    expect(screen.getByText(/included/i)).toBeInTheDocument()
    // …and neither a zero price nor the à-la-carte anchor renders.
    expect(screen.queryByText(/\$0(\.00)?/)).toBeNull()
    expect(screen.queryByText(/\$99\.99/)).toBeNull()
  })

  it('flag ON: original price struck through beside the chip — still no "$0.00"', () => {
    renderSlot(true)
    expect(screen.getByText(/included/i)).toBeInTheDocument()
    // The struck anchor renders the real price inside an <s> (line-through).
    const anchor = screen.getByText(/\$99\.99/)
    expect(anchor.closest('s')).not.toBeNull()
    // Screen-reader "was " prefix disambiguates the strikethrough.
    expect(screen.getByText(/^was$/i)).toBeInTheDocument()
    // Never a zeroed price.
    expect(screen.queryByText(/\$0(\.00)?/)).toBeNull()
  })
})
