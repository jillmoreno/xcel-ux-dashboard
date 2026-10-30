import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InvitedCheckoutRoute, InvitedProductDetailRoute, QrInviteRoute } from '@/pages/InviteFlowRoutes'

/**
 * INVITE FLOW V3, THE B2B OPENING SCREENS — 2026-10-30, from Afsana's
 * `xcel-b2b2c-email-flow.html`: the QR code, step 2 ("Select your state and
 * line of authority"), then the product page with "Showing the course for";
 * and the email check over the checkout (`VerifyEmailModalV3`).
 */

function renderAt(path: string, ff: string) {
  /* `?ff=` is read from `window.location.search`, not the router — set both. */
  window.history.replaceState({}, '', `${path}?ff=${ff}`)
  return render(
    <MemoryRouter initialEntries={[`${path}?ff=${ff}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Routes>
            <Route path="/end-to-end-demo/qr" element={<QrInviteRoute />} />
            <Route path="/end-to-end-demo" element={<InvitedProductDetailRoute />} />
            <Route path="/end-to-end-demo/checkout" element={<InvitedCheckoutRoute />} />
          </Routes>
          <Where />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function Where() {
  const { pathname, search } = useLocation()
  return <output data-testid="where">{pathname + search}</output>
}

const V3_B2B = 'invite-flow-version:v3,invite-v3-model:b2b'

describe('Invite Flow V3 — B2B opening screens', () => {
  it('draws the QR code alone on V3, and the phone card on V2', () => {
    const v3 = renderAt('/end-to-end-demo/qr', V3_B2B)
    expect(screen.getByRole('button', { name: /QR code for/ })).toBeInTheDocument()
    expect(screen.queryByText('Scan to start your licensing course')).not.toBeInTheDocument()
    v3.unmount()

    renderAt('/end-to-end-demo/qr', 'invite-flow-version:v2,invite-flow-journey:qr-social')
    expect(screen.getByText('Scan to start your licensing course')).toBeInTheDocument()
  })

  it('scanning opens step 2 on its own screen, not a modal', async () => {
    renderAt('/end-to-end-demo/qr', V3_B2B)
    await userEvent.click(screen.getByRole('button', { name: /Scan the code/ }))
    expect(screen.getByRole('heading', { name: 'Select your state and line of authority' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Get licensed with Sunrise Bank' })).toBeInTheDocument()
  })

  it('keeps Continue off until a real state and a line of authority are chosen', async () => {
    renderAt('/end-to-end-demo', V3_B2B)
    const go = screen.getByRole('button', { name: 'Continue' })
    expect(go).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Choose your state/), 'Flor')
    await userEvent.click(screen.getByRole('radio', { name: 'Life and Health' }))
    expect(go).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Choose your state/), 'ida')
    expect(go).toBeEnabled()
  })

  it('Continue shows the chosen course, and Change can update it', async () => {
    renderAt('/end-to-end-demo', V3_B2B)
    await userEvent.type(screen.getByLabelText(/Choose your state/), 'florida')
    await userEvent.click(screen.getByRole('radio', { name: 'Life and Health' }))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByTestId('where').textContent).toContain('lstate=Florida')
    expect(screen.getByText('Showing the course for')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Change' }))
    const dialog = screen.getByRole('dialog', { name: 'Change your course' })
    expect(dialog).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Life' }))
    await userEvent.click(screen.getByRole('button', { name: 'Update course' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).toMatch(/loa=Life(&|$)/)
  })
})

const CHECKOUT = '/end-to-end-demo/checkout'

describe('Invite Flow V3 — the email check', () => {
  it('asks for the email only, and keeps Continue off until it is an address', async () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const dialog = screen.getByRole('dialog', { name: 'Verify your email to continue' })
    expect(dialog).toBeInTheDocument()
    expect(screen.queryByLabelText(/First name/)).not.toBeInTheDocument()
    const go = screen.getByRole('button', { name: 'Continue' })
    expect(go).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Email address/), 'sam@example')
    expect(go).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Email address/), '.com')
    expect(go).toBeEnabled()
  })

  it('takes any six digits, then locks the verified address on the checkout', async () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    await userEvent.type(screen.getByLabelText(/Email address/), 'sam@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('heading', { name: 'Enter your code' })).toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: 'Confirm' })
    expect(confirm).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Digit 1 of 6'), '111111')
    expect(confirm).toBeEnabled()
    await userEvent.click(confirm)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).toContain('verified=1')
    expect(screen.getByDisplayValue('sam@example.com')).toBeDisabled()
    expect(screen.getByText(/This is the address you verified/)).toBeInTheDocument()
  })

  it('asks after the partner question on a B2C flow, never both at once', async () => {
    renderAt(CHECKOUT, 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:net-new,partner-code-ask:modal')
    expect(screen.queryByRole('dialog', { name: 'Verify your email to continue' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^no$/i }))
    expect(screen.getByRole('dialog', { name: 'Verify your email to continue' })).toBeInTheDocument()
  })

  it('does not ask on the log-in widget flow', () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-atlas-login`)
    expect(screen.queryByRole('dialog', { name: 'Verify your email to continue' })).not.toBeInTheDocument()
  })
})

describe('Invite Flow V3 — the checkout', () => {
  const VERIFIED = CHECKOUT
  const FF = `${V3_B2B},invite-v3-flow-b2b:qr-net-new`

  function renderVerified() {
    /* `verified=1` — past the email check, on the checkout itself. */
    window.history.replaceState({}, '', `${VERIFIED}?ff=${FF}&verified=1`)
    return render(
      <MemoryRouter initialEntries={[`${VERIFIED}?ff=${FF}&verified=1`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Routes>
              <Route path="/end-to-end-demo/checkout" element={<InvitedCheckoutRoute />} />
            </Routes>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('drops the "Secure" tag beside 2. Payment', () => {
    renderVerified()
    expect(screen.getByRole('heading', { name: '2. Payment' })).toBeInTheDocument()
    expect(screen.queryByText('Secure')).not.toBeInTheDocument()
  })

  it('places the order in a dialog over the checkout, not on a page of its own', async () => {
    renderVerified()
    await userEvent.click(screen.getByRole('button', { name: /demo learner/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }))
    /* The card form's own fill — the first of its click-to-fill fields. */
    await userEvent.click(screen.getAllByRole('button', { name: /click to fill/i })[0])
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Payment Method' }))
    await userEvent.click(screen.getByRole('button', { name: 'Place your order' }))

    expect(screen.getByRole('dialog', { name: 'Placing your order' })).toBeInTheDocument()
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument()
  })
})
