import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InvitedConfirmationPage } from '@/pages/InvitedConfirmationPage'
import { END_TO_END_VERSION } from '@/pages/endToEndDemo'

/**
 * THE INVITE & PURCHASE FLOW ENDS AT THE PASSWORD (2026-10-15, Jillienne:
 * "it should END after user puts in a password"). `e2e-ends-at-password` is
 * on in the committed baseline, so the Prototypes invite row closes on
 * Confirmation & Password with a loading page that never resolves; off is
 * Eric's hand-off to Home with the Affidavit
 * modal. Both arms are pinned here, and the default is pinned FIRST — a new
 * arm must not become the baseline by landing, only by promotion.
 */

const CONFIRMATION = '/end-to-end-demo/confirmation'

function Probe() {
  const { pathname, search } = useLocation()
  return <span data-testid="location">{pathname + search}</span>
}

function renderConfirmation(search = '') {
  window.history.replaceState({}, '', `${CONFIRMATION}${search}`)
  return render(
    <MemoryRouter initialEntries={[`${CONFIRMATION}${search}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Probe />
          <Routes>
            <Route path={CONFIRMATION} element={<InvitedConfirmationPage />} />
            <Route path="/dashboard-rebrand" element={<p>Home</p>} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** Fills the field the way the page offers — a click puts the test password in. */
function fillAndConfirm() {
  fireEvent.click(screen.getByPlaceholderText('Enter password...'))
  const confirm = screen.getByRole('button', { name: 'Confirm' })
  expect(confirm).not.toBeDisabled()
  fireEvent.click(confirm)
}

afterEach(cleanup)

describe('e2e-ends-at-password', () => {
  it('is on in the committed baseline', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'e2e-ends-at-password')
    expect(flag).toBeDefined()
    expect(flag?.defaultEnabled).toBe(true)
    expect(flag?.variants).toBeUndefined()
  })

  it('on: Confirm ends the flow on a loading page — "Taking you to your learning dashboard…" — and nothing navigates', () => {
    renderConfirmation()
    expect(screen.getByRole('heading', { name: 'Create password' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()

    fillAndConfirm()

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Taking you to your learning dashboard…')
    expect(status.querySelector('.cre-setup-spin')).not.toBeNull()
    // The whole page is the loading page: the form and the order panel are gone.
    expect(screen.queryByRole('heading', { name: 'Create password' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull()
    expect(screen.queryByText('Thank you for your order!')).toBeNull()
    expect(screen.getByTestId('location').textContent).toMatch(new RegExp(`^${CONFIRMATION}`))
    expect(screen.getByTestId('location').textContent).not.toContain('affidavit')
  })

  it('off: Confirm opens the End-to-End Demo’s Home with the Affidavit modal over it', () => {
    renderConfirmation('?ff=e2e-ends-at-password:off')
    fillAndConfirm()

    const location = screen.getByTestId('location').textContent ?? ''
    expect(location.startsWith('/dashboard-rebrand?')).toBe(true)
    const params = new URLSearchParams(location.slice(location.indexOf('?')))
    expect(params.get('demo')).toBe('1')
    expect(params.get('version')).toBe(END_TO_END_VERSION)
    expect(params.get('affidavit')).toBe('1')
    expect(screen.queryByText('Taking you to your learning dashboard…')).toBeNull()
  })
})
