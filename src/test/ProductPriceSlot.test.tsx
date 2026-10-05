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

  /* ⚠ THE "flag ON" TEST WENT 2026-10-05, with `pricing-entitled-savings`.
     The flag was retired with the Course Catalog flag page; its committed
     default was OFF, so the arm this test drove is no longer reachable and the
     surviving behaviour is the one asserted above.

     ⚠ THE CODE IS STILL THERE. `ProductPriceSlot` keeps the `showSavings`
     branch, now a `const showSavings = false`, so the struck-price treatment is
     one edit from coming back — and this test is what to restore with it. What
     it pinned: the real price inside an `<s>`, a screen-reader "was" prefix,
     and never a zeroed "$0.00". See ARCHIVED_ITEMS. */
})
