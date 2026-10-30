import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { AccountProvider } from '@/context/AccountContext'
import { INVITE_FLOW_VERSION_FLAG } from '@/data/inviteFlowVersions'
import {
  InviteEmailRoute,
  InvitedProductDetailRoute,
  InvitedCheckoutRoute,
  InvitedConfirmationRoute,
} from '@/pages/InviteFlowRoutes'

/**
 * THE VERSION SWITCH ACTUALLY SWAPS — 2026-10-22.
 *
 * ⚠ THIS IS THE ONE THING NOTHING ELSE CAN CATCH, and the reason it needs a
 * test of its own. V2 is a verbatim fork of V1, so for as long as that is true
 * the two versions render IDENTICAL markup — a switch wired to render V1 on
 * both arms would look perfectly correct in the browser, pass every DOM
 * assertion in the suite, and only surface weeks later when someone changed a
 * V2 page and nothing moved.
 *
 * So the pages are mocked down to a marker each: the only thing asserted is
 * WHICH module the route reached for. That keeps the test honest as the forks
 * diverge — it will never need updating when a real V2 design lands.
 */

vi.mock('@/pages/InviteEmailPage', () => ({ InviteEmailPage: () => <p>V1 email</p> }))
vi.mock('@/pages/InviteEmailPageV2', () => ({ InviteEmailPageV2: () => <p>V2 email</p> }))
vi.mock('@/pages/InviteEmailPageV3', () => ({ InviteEmailPageV3: () => <p>V3 email</p> }))
vi.mock('@/pages/InvitedProductDetailPage', () => ({
  InvitedProductDetailPage: () => <p>V1 product detail</p>,
}))
vi.mock('@/pages/InvitedProductDetailPageV2', () => ({
  InvitedProductDetailPageV2: () => <p>V2 product detail</p>,
}))
vi.mock('@/pages/InvitedProductDetailPageV3', () => ({
  InvitedProductDetailPageV3: () => <p>V3 product detail</p>,
}))
vi.mock('@/pages/InvitedCheckoutPage', () => ({ InvitedCheckoutPage: () => <p>V1 checkout</p> }))
vi.mock('@/pages/InvitedCheckoutPageV2', () => ({
  InvitedCheckoutPageV2: () => <p>V2 checkout</p>,
}))
vi.mock('@/pages/InvitedCheckoutPageV3', () => ({
  InvitedCheckoutPageV3: () => <p>V3 checkout</p>,
}))
vi.mock('@/pages/InvitedConfirmationPage', () => ({
  InvitedConfirmationPage: () => <p>V1 confirmation</p>,
}))
vi.mock('@/pages/InvitedConfirmationPageV2', () => ({
  InvitedConfirmationPageV2: () => <p>V2 confirmation</p>,
}))
vi.mock('@/pages/InvitedConfirmationPageV3', () => ({
  InvitedConfirmationPageV3: () => <p>V3 confirmation</p>,
}))

function renderRoute(Route: () => React.ReactElement, version: string, path: string) {
  /* ⚠ `?ff=` IS READ FROM `window.location.search`, not from the MemoryRouter
     entry — so both are set. A suite that sets only the router entry renders
     with catalog DEFAULTS and passes for the wrong reason. */
  const ff = `${INVITE_FLOW_VERSION_FLAG}:${version}`
  window.history.replaceState({}, '', `${path}?ff=${ff}`)
  return render(
    <MemoryRouter initialEntries={[`${path}?ff=${ff}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Route />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const ROUTES = [
  { name: 'email', Route: InviteEmailRoute, path: '/end-to-end-demo/email' },
  { name: 'product detail', Route: InvitedProductDetailRoute, path: '/end-to-end-demo' },
  { name: 'checkout', Route: InvitedCheckoutRoute, path: '/end-to-end-demo/checkout' },
  {
    name: 'confirmation',
    Route: InvitedConfirmationRoute,
    path: '/end-to-end-demo/confirmation',
  },
] as const

describe('the invite flow version switch', () => {
  for (const { name, Route, path } of ROUTES) {
    it(`renders V1's ${name} on v1`, () => {
      const { unmount } = renderRoute(Route, 'v1', path)
      expect(screen.getByText(`V1 ${name}`)).toBeInTheDocument()
      expect(screen.queryByText(`V2 ${name}`)).not.toBeInTheDocument()
      unmount()
    })

    it(`renders V2's ${name} on v2`, () => {
      const { unmount } = renderRoute(Route, 'v2', path)
      expect(screen.getByText(`V2 ${name}`)).toBeInTheDocument()
      expect(screen.queryByText(`V1 ${name}`)).not.toBeInTheDocument()
      unmount()
    })

    it(`renders V3's ${name} on v3`, () => {
      const { unmount } = renderRoute(Route, 'v3', path)
      expect(screen.getByText(`V3 ${name}`)).toBeInTheDocument()
      expect(screen.queryByText(`V2 ${name}`)).not.toBeInTheDocument()
      expect(screen.queryByText(`V1 ${name}`)).not.toBeInTheDocument()
      unmount()
    })

    /* A stored id this build no longer carries must fall back, not blank the
       page — the same guard `resolvePaceStyle` gives the demo bar. */
    it(`falls back to a real page for ${name} on an unknown version`, () => {
      const { unmount } = renderRoute(Route, 'v9', path)
      expect(screen.getByText(/^V[123] /)).toBeInTheDocument()
      unmount()
    })
  }
})
