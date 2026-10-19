import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InviteEmailPage } from '@/pages/InviteEmailPage'
import { InvitedProductDetailPage } from '@/pages/InvitedProductDetailPage'
import { InvitedCheckoutPage } from '@/pages/InvitedCheckoutPage'
import { InvitedConfirmationPage } from '@/pages/InvitedConfirmationPage'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'

/**
 * THE WALK, PAGE BY PAGE — `?journey=full` from the End-to-End row's address
 * through to the hand-off (2026-10-16).
 *
 * ⚠ THIS IS THE CASE THAT CAUGHT THE REAL BUG. Each page normalises its own
 * address (`useEndToEndDemoParams`), and the Checkout → Confirmation hop used
 * to write `demo` and `version` from scratch rather than carrying the query
 * string forward. Every page test passed in isolation; the param died on one
 * hop, and the only symptom was a spinner that sat there for ever at the end
 * of a three-page walk — which looks exactly like the Invite row behaving
 * correctly. So the walk is driven through the actual buttons, not by
 * rendering the last page with the right address handed to it.
 */

function Probe() {
  const { pathname, search } = useLocation()
  return <span data-testid="location">{pathname + search}</span>
}

/** The End-to-End row's address, read from the row itself — if the row stops
 *  carrying the param, this suite fails rather than quietly testing nothing. */
function endToEndRowAddress(): string {
  return PROTOTYPE_FEATURES.find((f) => f.id === 'xcel-dashboard')!.to!
}

function renderWalk(at: string) {
  window.history.replaceState({}, '', at)
  return render(
    <MemoryRouter initialEntries={[at]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Probe />
          <Routes>
            {/* The row's own first page since 2026-10-19 — the walk starts in
                the mail client, so the route table has to hold it or the
                suite silently renders nothing and fails on the first click. */}
            <Route path="/end-to-end-demo/email" element={<InviteEmailPage />} />
            <Route path="/end-to-end-demo" element={<InvitedProductDetailPage />} />
            <Route path="/end-to-end-demo/checkout" element={<InvitedCheckoutPage />} />
            <Route path="/end-to-end-demo/confirmation" element={<InvitedConfirmationPage />} />
            <Route path="/dashboard-rebrand" element={<p>Atlas Learning Home</p>} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const journeyOf = (location: string) =>
  new URLSearchParams(location.slice(location.indexOf('?'))).get('journey')

/* jsdom HAS NO LAYOUT, and Invited Product Detail measures text to fit its
   course title (`lineWidths`, which walks `range.getClientRects()`). jsdom
   implements Range but not that method, so the page throws on mount — nothing
   to do with this suite's subject. Empty rects read as "nothing measured",
   which is the branch the fitter already takes before a paint. */
if (!('getClientRects' in Range.prototype)) {
  Object.defineProperty(Range.prototype, 'getClientRects', {
    value: () => [],
    writable: true,
    configurable: true,
  })
}

afterEach(cleanup)

describe('the End-to-End row’s walk carries ?journey=full to the hand-off', () => {
  it('survives Product Detail → Checkout → Confirmation, and then opens Home', async () => {
    vi.useFakeTimers()
    try {
      const address = endToEndRowAddress()
      expect(journeyOf(address), 'the row must carry the param for this walk to mean anything').toBe('full')
      renderWalk(address)

      /* 0. THE INBOX → Invited Product Detail (2026-10-19). The row starts at
         the invitation email now ("clicking on end to end should start with
         the email first"), so the walk gained a hop at the FRONT — and this
         is the hop most likely to drop the param, because the mail client is
         the one page in the flow that is not part of the product's own
         navigation. `InviteEmailPage` carries the whole search string
         forward rather than rebuilding it; this is what proves it. */
      fireEvent.click(screen.getByRole('button', { name: 'View invitation' }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      let location = screen.getByTestId('location').textContent ?? ''
      expect(location.startsWith('/end-to-end-demo')).toBe(true)
      expect(journeyOf(location), 'lost on the View invitation hop').toBe('full')

      // 1. Invited Product Detail → Checkout.
      fireEvent.click(screen.getByRole('button', { name: 'Purchase' }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      location = screen.getByTestId('location').textContent ?? ''
      expect(location.startsWith('/end-to-end-demo/checkout')).toBe(true)
      expect(journeyOf(location), 'lost on the Purchase Now hop').toBe('full')

      // 2. Checkout → Confirmation. Place your order is disabled until the
      //    payment column has been touched — the section opens the gate on
      //    any click inside it (`onClickCapture`), so its heading will do.
      fireEvent.click(document.getElementById('checkout-payment')!)
      const place = screen.getByRole('button', { name: 'Place your order' })
      expect(place).not.toBeDisabled()
      fireEvent.click(place)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      location = screen.getByTestId('location').textContent ?? ''
      expect(location.startsWith('/end-to-end-demo/confirmation')).toBe(true)
      expect(journeyOf(location), 'lost on the Place your order hop — the original bug').toBe('full')

      // 3. Confirm → the loading page → three seconds → Atlas Learning Home.
      fireEvent.click(screen.getByPlaceholderText('Enter password...'))
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(screen.getByRole('status')).toHaveTextContent('Taking you to your learning dashboard…')

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3100)
      })
      expect(screen.getByText('Atlas Learning Home')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
