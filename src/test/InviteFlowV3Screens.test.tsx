import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider, useFeatureFlags } from '@/context/FeatureFlagContext'
import {
  InvitedCheckoutRoute,
  InviteEmailRoute,
  InvitedConfirmationRoute,
  InvitedProductDetailRoute,
  QrInviteRoute,
} from '@/pages/InviteFlowRoutes'
import { XcelCartPage } from '@/pages/XcelCartPage'
import { XcelPackagesPage } from '@/pages/XcelPackagesPage'
import { InviteFlowEntrySync } from '@/pages/EndToEndPageSync'
import { LOADING_HANDOFF_MS } from '@/components/e2e/XcelLoadingPage'
import { E2E_LEARNER_EMAIL } from '@/pages/endToEndDemo'
import {
  INVITE_FLOWS_V3,
  emailCheckV3,
  entryPathV3,
  inviteEndingV3,
  inviteV3Surface,
  SIGNING_OUT_MS,
  ocdCartFlowV3,
  signedInFlowV3,
  verifiesEmailFirst,
} from '@/data/inviteFlowsV3'

/**
 * INVITE FLOW V3, THE B2B OPENING SCREENS — 2026-10-30, from Afsana's
 * `xcel-b2b2c-email-flow.html`: the QR code, step 2 ("Select your state and
 * line of authority"), then the product page with "Showing the course for";
 * the email check over the checkout (`VerifyEmailModalV3`), with the Has Atlas
 * log-in and "Signing you in"; the B2C cart's Partner Code question; and the
 * endings (`InvitedConfirmationPageV3`).
 */

function renderAt(path: string, ff: string) {
  /* `?ff=` is read from `window.location.search`, not the router — set both. */
  window.history.replaceState({}, '', `${path}?ff=${ff}`)
  return render(
    <MemoryRouter initialEntries={[`${path}?ff=${ff}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Routes>
            <Route path="/end-to-end-demo/email" element={<InviteEmailRoute />} />
            <Route path="/end-to-end-demo/qr" element={<QrInviteRoute />} />
            <Route path="/end-to-end-demo" element={<InvitedProductDetailRoute />} />
            <Route path="/end-to-end-demo/checkout" element={<InvitedCheckoutRoute />} />
            <Route path="/end-to-end-demo/confirmation" element={<InvitedConfirmationRoute />} />
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

/* B2B's QR flows. Direct Email is B2B's default since 2026-11-03, so the QR
   screens name a QR flow. */
const V3_B2B = 'invite-flow-version:v3,invite-v3-model:b2b,invite-v3-flow-b2b:qr-net-new'

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

describe('Invite Flow V3 — the Direct Email invitation', () => {
  const DIRECT = 'invite-flow-version:v3,invite-v3-model:b2b,invite-v3-flow-b2b:direct-email'

  it('says who invited them and why to open it — no name, prices or eyebrow', () => {
    renderAt('/end-to-end-demo/email', DIRECT)
    expect(screen.getByRole('heading', { level: 1, name: 'You’re Invited to Get Licensed' })).toBeInTheDocument()
    const letter = screen.getByRole('article')
    expect(letter).toHaveTextContent('Hi there,')
    expect(letter).toHaveTextContent(
      'Sunrise Bank has invited you to begin your licensing journey. Open your invitation to access your discount!',
    )
    expect(letter).toHaveTextContent('Official partner of')
    expect(screen.getByText('CodyMcClintock@tampa.com')).toBeInTheDocument()
    expect(screen.queryByText('support@xcelsolutions.com')).not.toBeInTheDocument()
    expect(letter).not.toHaveTextContent(/Sent for|This is an example/)
    expect(letter).not.toHaveTextContent(/\$65|\$199|saves you|Opens the|Invitation/)

    /* The ending's red Start Course button, not V2's navy pill. */
    expect(within(letter).getByRole('button', { name: 'View invitation' })).toHaveClass('cre-e2e-cta')
  })

  it('after Purchase, sends a code to the supplied address when it has no Atlas', async () => {
    renderAt(CHECKOUT, `${DIRECT},invite-v3-email-account:no-atlas`)
    const dialog = screen.getByRole('dialog', { name: 'Enter your one-time code' })
    expect(dialog).toHaveTextContent(E2E_LEARNER_EMAIL)
    /* Never asks for the address, and there is no other to use. */
    expect(screen.queryByRole('dialog', { name: 'Enter your email to continue' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Use a different email' })).not.toBeInTheDocument()
  })

  it('leaves the checkout’s email plain until the check is done, then locks it', async () => {
    renderAt(CHECKOUT, `${DIRECT},invite-v3-email-account:no-atlas`)
    /* Behind the code: no lock, no grey, no address. */
    expect(screen.queryByAltText('Locked')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue(E2E_LEARNER_EMAIL)).not.toBeInTheDocument()
    const dialog = screen.getByRole('dialog', { name: 'Enter your one-time code' })
    await userEvent.type(within(dialog).getByLabelText('Digit 1 of 6'), '111111')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))
    expect(screen.getByAltText('Locked')).toBeInTheDocument()
    expect(screen.getByDisplayValue(E2E_LEARNER_EMAIL)).toBeDisabled()
    expect(screen.getByText('This is the address you verified. Your account will be created with it.')).toBeInTheDocument()
  })

  it('says nothing under the locked email after a password log-in', async () => {
    renderAt(CHECKOUT, `${DIRECT},invite-v3-email-account:atlas`)
    await userEvent.type(screen.getByLabelText(/^Password/), 'anything')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByDisplayValue(E2E_LEARNER_EMAIL)).toBeDisabled()
    expect(screen.queryByText(/This is the address you verified/)).not.toBeInTheDocument()
  })

  it('after Purchase, asks the learner to log in when the address has Atlas', () => {
    renderAt(CHECKOUT, `${DIRECT},invite-v3-email-account:atlas`)
    const dialog = screen.getByRole('dialog', { name: 'Log in to continue' })
    expect(dialog).toHaveTextContent(E2E_LEARNER_EMAIL)
    expect(screen.queryByRole('dialog', { name: 'Enter your one-time code' })).not.toBeInTheDocument()
  })
})

describe('Invite Flow V3 — the email check', () => {
  it('asks for the email only, and keeps Continue off until it is an address', async () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const dialog = screen.getByRole('dialog', { name: 'Enter your email to continue' })
    expect(dialog).toBeInTheDocument()
    expect(screen.queryByLabelText(/First name/)).not.toBeInTheDocument()
    /* The checkout behind says nothing about an address nobody has given yet. */
    expect(screen.queryByDisplayValue(/@/)).not.toBeInTheDocument()
    expect(screen.queryByText(/This is the address you verified/)).not.toBeInTheDocument()
    const go = screen.getByRole('button', { name: 'Continue' })
    expect(go).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Email address/), 'sam@example')
    expect(go).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Email address/), '.com')
    expect(go).toBeEnabled()
  })

  it('shows the one-time code step with the logo, and unlocks Resend after 10 minutes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
      await userEvent.type(screen.getByLabelText(/Email address/), 'sam@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByAltText(/XCEL/)).toBeInTheDocument()
      expect(dialog).toHaveTextContent('To verify your email address, enter the 6-digit code we sent to sam@example.com.')
      expect(dialog).toHaveTextContent('Be sure to check your spam or junk folders. This code will expire in 10 minutes.')
      expect(dialog).toHaveTextContent('Didn’t receive the code? Resend code in 10:00')
      expect(within(dialog).queryByRole('button', { name: 'Resend code' })).not.toBeInTheDocument()
      expect(within(dialog).getByRole('button', { name: 'Use a different email' })).toBeInTheDocument()

      for (let i = 0; i < 600; i++) await act(() => vi.advanceTimersByTimeAsync(1000))
      await userEvent.click(within(dialog).getByRole('button', { name: 'Resend code' }))
      expect(dialog).toHaveTextContent('We sent a new code to sam@example.com.')
      expect(dialog).toHaveTextContent('Resend code in 10:00')
    } finally {
      vi.useRealTimers()
    }
  })

  it('takes any six digits, then locks the verified address on the checkout', async () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    await userEvent.type(screen.getByLabelText(/Email address/), 'sam@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('heading', { name: 'Enter your one-time code' })).toBeInTheDocument()
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
    expect(screen.queryByRole('dialog', { name: 'Enter your email to continue' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^no$/i }))
    expect(screen.getByRole('dialog', { name: 'Enter your email to continue' })).toBeInTheDocument()
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

describe('Invite Flow V3 — the endings', () => {
  const CONFIRMATION = '/end-to-end-demo/confirmation'

  it('asks a new learner to create a password, gated on the rules', async () => {
    renderAt(CONFIRMATION, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    expect(screen.getByRole('heading', { name: 'Thank you for your order, Jordan!' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create your password' })).toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'Save Password & Log In' })
    expect(save).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /demo learner’s password/ }))
    expect(save).toBeEnabled()
  })

  it('asks for the password twice, and holds Save until they match', async () => {
    renderAt(CONFIRMATION, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const save = screen.getByRole('button', { name: 'Save Password & Log In' })
    await userEvent.type(screen.getByPlaceholderText('Enter password...'), 'Navarro#2026')
    expect(save).toBeDisabled()
    const confirm = screen.getByPlaceholderText('Re-enter password...')
    await userEvent.type(confirm, 'Navarro#20')
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.')
    expect(save).toBeDisabled()
    await userEvent.type(confirm, '26')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(save).toBeEnabled()
  })

  it('lists V3’s seven rules under "Password must:", with a strength meter', async () => {
    renderAt(CONFIRMATION, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    expect(screen.getByText('Password must:')).toBeInTheDocument()
    expect(screen.queryByText('Password requirements')).not.toBeInTheDocument()
    expect(screen.getByText(/^be 9-15 characters/)).toBeInTheDocument()
    expect(screen.getByText(/^use only the following special characters !@#\$%\^&\*\._-/)).toBeInTheDocument()
    expect(screen.getByText(/^be different from username/)).toBeInTheDocument()
    const meter = screen.getByRole('meter', { name: 'Password strength' })
    expect(meter).toHaveAttribute('aria-valuenow', '0')
    await userEvent.click(screen.getByRole('button', { name: /demo learner’s password/ }))
    expect(meter).not.toHaveAttribute('aria-valuenow', '0')
  })

  it('sends a learner who already has Atlas straight to their course', () => {
    renderAt(CONFIRMATION, 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:has-atlas')
    expect(screen.getByRole('heading', { name: 'Start learning' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start Course' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Password/)).not.toBeInTheDocument()
  })

  it('draws V2 guest checkout’s light receipt', () => {
    renderAt(CONFIRMATION, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const receipt = screen.getByRole('region', { name: 'Thank you for your order, Jordan!' })
    for (const term of ['Confirmation number', 'Product', 'Order total']) {
      expect(within(receipt).getByText(term)).toBeInTheDocument()
    }
    expect(within(receipt).getByText('XL00186764')).toBeInTheDocument()
  })

  it('never shows V2’s "Confirm your email" ending on V3', () => {
    for (const flow of ['qr-net-new', 'qr-ocd', 'qr-atlas-login', 'qr-atlas-auto']) {
      const { unmount } = renderAt(CONFIRMATION, `${V3_B2B},invite-v3-flow-b2b:${flow}`)
      expect(screen.queryByText(/Confirm your email|Check your email/)).not.toBeInTheDocument()
      unmount()
    }
  })
})

describe('Invite Flow V3 — the Has Atlas sign-in', () => {
  it('logs in on the log-in widget flow, holds on Signing you in, and fills the checkout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-atlas-login`)
      await userEvent.type(screen.getByLabelText(/Email address/), 'jordan@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

      expect(screen.getByRole('heading', { name: 'Log in to continue' })).toBeInTheDocument()
      /* The address in the sentence, bold — no email field, only the password. */
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveTextContent('Welcome back, Jordan! Sign in to jordan@example.com to finish checking out.')
      expect(within(dialog).getByText('jordan@example.com').tagName).toBe('STRONG')
      expect(within(dialog).queryByLabelText(/Email address/)).not.toBeInTheDocument()
      expect(within(dialog).queryAllByRole('textbox')).toHaveLength(0)
      const logIn = screen.getByRole('button', { name: 'Log in' })
      expect(logIn).toBeDisabled()
      await userEvent.type(screen.getByLabelText(/^Password/), 'anything')
      await userEvent.click(logIn)

      expect(screen.getByRole('dialog', { name: 'Signing you in' })).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(LOADING_HANDOFF_MS))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('Jordan')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('signs the automatic flows in straight after the email — no log-in, no code', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      for (const ff of [
        `${V3_B2B},invite-v3-flow-b2b:qr-atlas-auto`,
        'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:has-atlas,partner-code-ask:modal&partner=no',
      ]) {
        const { unmount } = renderAt(CHECKOUT, ff)
        await userEvent.type(screen.getByLabelText(/Email address/), 'jordan@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

        expect(screen.getByRole('dialog', { name: 'Signing you in' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Log in to continue' })).not.toBeInTheDocument()
        await act(() => vi.advanceTimersByTimeAsync(LOADING_HANDOFF_MS))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByDisplayValue('Jordan')).toBeInTheDocument()
        expect(screen.queryByText(/This is the address you verified/)).not.toBeInTheDocument()
        unmount()
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('goes straight to a filled checkout on the B2C log-in flow — no Signing you in', async () => {
    renderAt(CHECKOUT, 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:has-atlas-login,partner-code-ask:modal&partner=no')
    await userEvent.type(screen.getByLabelText(/Email address/), 'jordan@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await userEvent.type(screen.getByLabelText(/^Password/), 'anything')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Jordan')).toBeInTheDocument()
  })

  it('asks every flow’s email, and knows which sign in', () => {
    /* The OCD flows' check depends on the cart — see their own tests. */
    for (const flow of INVITE_FLOWS_V3.filter((f) => f.id !== 'xcel-signed-in' && f.id !== 'xcel-signed-out')) {
      expect(verifiesEmailFirst(flow)).toBe(true)
    }
    const check = (id: string) => emailCheckV3(INVITE_FLOWS_V3.find((f) => f.id === id)!)
    expect(check('qr-atlas-login')).toEqual({ second: 'login', signsIn: true, accountKnown: true })
    expect(check('has-atlas-login')).toEqual({ second: 'login', signsIn: false, accountKnown: true })
    expect(check('has-atlas')).toEqual({ second: 'none', signsIn: true, accountKnown: true })
    expect(check('qr-atlas-auto')).toEqual({ second: 'none', signsIn: true, accountKnown: true })
    expect(check('net-new')).toEqual({ second: 'code', signsIn: false, accountKnown: false })
  })
})

describe('Invite Flow V3 — the B2C cart', () => {
  it('starts B2B at the QR code and B2C at the cart', () => {
    expect(entryPathV3(INVITE_FLOWS_V3.find((f) => f.id === 'qr-ocd')!)).toBe('/end-to-end-demo/qr')
    expect(entryPathV3(INVITE_FLOWS_V3.find((f) => f.id === 'ocd-no-atlas')!)).toBe('/end-to-end-demo/cart')
  })

  it('asks the Partner Code question over the cart, then opens the checkout', async () => {
    const path = '/end-to-end-demo/cart'
    const ff = 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:net-new'
    const search = `?ff=${ff}&lstate=Arizona&loa=Health&pkg=premier`
    window.history.replaceState({}, '', `${path}${search}`)
    render(
      <MemoryRouter initialEntries={[`${path}${search}`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Routes>
              <Route path="/end-to-end-demo/cart" element={<XcelCartPage />} />
              <Route path="/end-to-end-demo/checkout" element={<p>Checkout page</p>} />
            </Routes>
            <Where />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Do you have a Partner Code?')
    expect(screen.getByTestId('where').textContent).toContain('/end-to-end-demo/cart')
    await userEvent.click(screen.getByRole('button', { name: /^no$/i }))
    expect(screen.getByText('Checkout page')).toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).toContain('partner=no')
  })

  it('closes the Partner Code question with its ✕, staying on the cart', async () => {
    const path = '/end-to-end-demo/cart'
    const search = '?ff=invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:net-new&lstate=Arizona&loa=Health&pkg=premier'
    window.history.replaceState({}, '', `${path}${search}`)
    render(
      <MemoryRouter initialEntries={[`${path}${search}`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <XcelCartPage />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your cart' })).toBeInTheDocument()
  })
})

describe('Invite Flow V3 — dialogs leave the bars usable', () => {
  /* The scrim sits under the bars' menus (60) and sheets (100), not at the
     1000 that covered them (`useBelowDemoBars`). */
  it('layers the email check under the Demo and Design bars’ menus', () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const scrim = screen.getByRole('dialog', { name: 'Enter your email to continue' }).parentElement!
    expect(scrim.style.zIndex).toBe('55')
  })

  /* The file's stylesheet: every dialog 460 wide, its gated button full width. */
  it('draws the email check 460 wide with a full-width button', () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const dialog = screen.getByRole('dialog', { name: 'Enter your email to continue' })
    expect(dialog.style.width).toBe('460px')
    expect(screen.getByRole('button', { name: 'Continue' }).style.width).toBe('100%')
  })

  it('centres the dialog in the simulated browser window and holds the page still', () => {
    /* A stand-in for the Demo frame's window, on screen at 200–800 × 40–1240. */
    const stage = document.createElement('div')
    stage.className = 'cre-demo-stage-window'
    stage.getBoundingClientRect = () =>
      ({ top: 200, bottom: 800, left: 40, right: 1240, width: 1200, height: 600 }) as DOMRect
    document.body.appendChild(stage)
    const { unmount } = renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const scrim = screen.getByRole('dialog', { name: 'Enter your email to continue' }).parentElement!
    expect(scrim.style.top).toBe('200px')
    expect(scrim.style.left).toBe('40px')
    expect(scrim.style.width).toBe('1200px')
    expect(scrim.style.justifyContent).toBe('center')
    expect(document.documentElement.style.overflow).toBe('hidden')
    stage.remove()
    unmount()
    expect(document.documentElement.style.overflow).toBe('')
  })
})

describe('Invite Flow V3 — every B2C flow starts at the cart', () => {
  function arriveAt(path: string, ff: string) {
    window.history.replaceState({}, '', `${path}?ff=${ff}`)
    return render(
      <MemoryRouter initialEntries={[`${path}?ff=${ff}`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <InviteFlowEntrySync />
            <Where />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  for (const from of ['/end-to-end-demo/find', '/end-to-end-demo/qr', '/end-to-end-demo/email']) {
    it(`sends a B2C walk arriving at ${from} to the filled cart`, () => {
      arriveAt(from, 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:ocd-no-atlas')
      const where = screen.getByTestId('where').textContent!
      expect(where).toMatch(/^\/end-to-end-demo\/cart\?/)
      expect(where).toContain('lstate=Arizona')
      expect(where).toContain('pkg=premier')
    })
  }

  it('sends a B2B walk arriving at the cart to the QR code', () => {
    arriveAt('/end-to-end-demo/cart', 'invite-flow-version:v3,invite-v3-model:b2b,invite-v3-flow-b2b:qr-ocd')
    expect(screen.getByTestId('where').textContent).toMatch(/^\/end-to-end-demo\/qr\?/)
  })

  it('leaves V2’s guest walk on the public homepage', () => {
    arriveAt('/end-to-end-demo/find', 'invite-flow-version:v2,invite-flow-journey:b2c-guest')
    expect(screen.getByTestId('where').textContent).toMatch(/^\/end-to-end-demo\/find\?/)
  })
})

describe('Invite Flow V3 — not signed in to XCEL (OCD)', () => {
  const SIGNED_OUT = 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:xcel-signed-out'
  const base = INVITE_FLOWS_V3.find((f) => f.id === 'xcel-signed-out')!

  it('walks as the signed-in flow, a guest throughout and never signed out', () => {
    for (const cart of ['targeted', 'mixed', 'none'] as const) {
      const flow = ocdCartFlowV3(base, cart, 'no-atlas')
      expect(flow.base).toBe('b2c-guest')
      expect(flow.screens).not.toContain('signing-out')
      expect(flow.screens.slice(0, 2)).toEqual(['cart', 'pc-modal'])
    }
    expect(ocdCartFlowV3(base, 'mixed', 'atlas').screens).toContain('drop-notice')
    expect(emailCheckV3(ocdCartFlowV3(base, 'targeted', 'atlas'))).toEqual({ second: 'login', signsIn: false, accountKnown: true })
    expect(emailCheckV3(ocdCartFlowV3(base, 'mixed', 'atlas')).accountKnown).toBe(true)
    expect(emailCheckV3(ocdCartFlowV3(base, 'targeted', 'no-atlas')).accountKnown).toBe(false)
    expect(emailCheckV3(ocdCartFlowV3(base, 'targeted', 'no-atlas')).second).toBe('code')
    expect(verifiesEmailFirst(ocdCartFlowV3(base, 'none', 'atlas'))).toBe(false)
    /* Its controls are the signed-in flow's. */
    expect(inviteV3Surface('b2c', 'xcel-signed-out')).toBe(inviteV3Surface('b2c', 'xcel-signed-in'))
  })

  function cartAt(cart: string) {
    const search = `?ff=${SIGNED_OUT},invite-v3-cart:${cart}&lstate=Arizona&loa=Health&pkg=premier`
    window.history.replaceState({}, '', `/end-to-end-demo/cart${search}`)
    return render(
      <MemoryRouter initialEntries={[`/end-to-end-demo/cart${search}`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Routes>
              <Route path="/end-to-end-demo/cart" element={<XcelCartPage />} />
              <Route path="/end-to-end-demo/checkout" element={<p>Checkout page</p>} />
            </Routes>
            <Where />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('shows Log In, not My Training', () => {
    cartAt('targeted')
    expect(screen.getByText('Log In')).toBeInTheDocument()
    expect(screen.queryByText('My Training')).not.toBeInTheDocument()
  })

  it('goes straight to the checkout on No — no Signing you out', async () => {
    cartAt('targeted')
    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    await userEvent.click(screen.getByRole('button', { name: 'NO' }))
    expect(screen.queryByRole('dialog', { name: 'Signing you out' })).not.toBeInTheDocument()
    expect(screen.getByText('Checkout page')).toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).toContain('partner=no')
    expect(screen.getByTestId('where').textContent).not.toContain('signedout=1')
  })

  it('tells a mixed cart what will be dropped, then drops it on the way — no sign-out', async () => {
    cartAt('mixed')
    expect(screen.getByText('New York Life and Health Flashcards')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    await userEvent.click(screen.getByRole('button', { name: 'NO' }))
    expect(screen.getByRole('dialog', { name: /not supported/ })).toHaveTextContent('New York Life and Health Flashcards')
    await userEvent.click(screen.getByRole('button', { name: 'Proceed to checkout' }))
    expect(screen.queryByRole('dialog', { name: 'Signing you out' })).not.toBeInTheDocument()
    expect(screen.getByText('Checkout page')).toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).toContain('dropped=1')
  })

  it('collects a partner code on Yes, as when signed in', async () => {
    cartAt('none')
    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    await userEvent.click(screen.getByRole('button', { name: 'YES' }))
    expect(screen.getByRole('dialog', { name: 'Enter your Partner Code' })).toBeInTheDocument()
  })
})

describe('Invite Flow V3 — the partner-code alternative', () => {
  const ALT = 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:pc-after-add'

  function walkFrom(ff: string) {
    const search = `?ff=${ff}&lstate=Arizona&loa=Health&pkg=premier`
    window.history.replaceState({}, '', `/end-to-end-demo/packages${search}`)
    return render(
      <MemoryRouter initialEntries={[`/end-to-end-demo/packages${search}`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Routes>
              <Route path="/end-to-end-demo/packages" element={<XcelPackagesPage />} />
              <Route path="/end-to-end-demo/cart" element={<XcelCartPage />} />
              <Route path="/end-to-end-demo/checkout" element={<p>Checkout page</p>} />
            </Routes>
            <Where />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('opens on “Added to your cart”, asks at Go to Cart, then Checkout goes straight on', async () => {
    walkFrom(ALT)
    const added = screen.getByRole('dialog', { name: 'Added to your cart' })
    expect(added).toHaveTextContent('Arizona Health Pre-licensing Premier')

    await userEvent.click(within(added).getByRole('button', { name: 'Go to Cart' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Do you have a Partner Code?')
    expect(screen.getByTestId('where').textContent).toMatch(/^\/end-to-end-demo\/packages\?/)

    await userEvent.click(screen.getByRole('button', { name: 'NO' }))
    expect(screen.getByRole('heading', { name: 'Your cart' })).toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).toContain('partner=no')

    /* Answered already, so Checkout does not ask a second time. */
    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(screen.getByText('Checkout page')).toBeInTheDocument()
  })

  it('leaves the other B2C flows adding by hand', () => {
    walkFrom('invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:net-new')
    expect(screen.queryByRole('dialog', { name: 'Added to your cart' })).not.toBeInTheDocument()
  })
})

describe('Invite Flow V3 — picking another flow restarts the walk', () => {
  function Pick({ flag, value }: { flag: string; value: string }) {
    const { setVariant } = useFeatureFlags()
    return (
      <button type="button" onClick={() => setVariant(flag, value)}>
        pick {value}
      </button>
    )
  }

  function midWalk(path: string, ff: string, flag: string, value: string) {
    window.history.replaceState({}, '', `${path}?ff=${ff}`)
    return render(
      <MemoryRouter initialEntries={[`${path}?ff=${ff}&lstate=Florida&loa=Life+and+Health&verified=1`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <InviteFlowEntrySync />
            <Pick flag={flag} value={value} />
            <Where />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('B2B: from the checkout to the new flow’s QR code, with nothing carried over', async () => {
    midWalk(CHECKOUT, 'invite-flow-version:v3,invite-v3-model:b2b', 'invite-v3-flow-b2b', 'qr-atlas-login')
    expect(screen.getByTestId('where').textContent).toMatch(/^\/end-to-end-demo\/checkout/)
    await userEvent.click(screen.getByRole('button', { name: 'pick qr-atlas-login' }))
    const where = screen.getByTestId('where').textContent!
    expect(where).toMatch(/^\/end-to-end-demo\/qr\?/)
    expect(where).not.toContain('verified=1')
    expect(where).not.toContain('lstate=Florida')
  })

  it('B2C: from the checkout to the new flow’s filled cart', async () => {
    midWalk(CHECKOUT, 'invite-flow-version:v3,invite-v3-model:b2c', 'invite-v3-flow-b2c', 'has-atlas-login')
    await userEvent.click(screen.getByRole('button', { name: 'pick has-atlas-login' }))
    const where = screen.getByTestId('where').textContent!
    expect(where).toMatch(/^\/end-to-end-demo\/cart\?/)
    expect(where).toContain('pkg=premier')
  })
})

describe('Invite Flow V3 — the OCD flows’ checkout after an Atlas log-in', () => {
  for (const id of ['xcel-signed-out', 'xcel-signed-in']) {
    it(`${id}: fills the learner’s details and locks the email`, async () => {
      renderAt(
        CHECKOUT,
        `invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:${id},invite-v3-cart:targeted,invite-v3-email-account:atlas`,
      )
      /* The cart answers the partner question on a real walk; here, No. */
      const no = screen.queryByRole('button', { name: 'NO' })
      if (no) await userEvent.click(no)
      await userEvent.type(screen.getByLabelText(/Email address/), 'sam@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      await userEvent.type(screen.getByLabelText(/^Password/), 'anything')
      await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('Jordan')).toBeInTheDocument()
      expect(screen.getByDisplayValue('sam@example.com')).toBeDisabled()
      expect(screen.getByAltText('Locked')).toBeInTheDocument()
      /* The phone too, so payment is open — nothing left to fill. */
      expect(screen.getByDisplayValue('555 010 0199')).toBeInTheDocument()
      expect(screen.queryByText(/Complete your student information/)).not.toBeInTheDocument()
    })
  }
})

describe('Invite Flow V3 — signed in to XCEL (OCD)', () => {
  const SIGNED_IN = 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:xcel-signed-in'
  const base = INVITE_FLOWS_V3.find((f) => f.id === 'xcel-signed-in')!

  it('routes each cart and email to its own walk', () => {
    const none = signedInFlowV3(base, 'none', 'atlas', false)
    expect(verifiesEmailFirst(none)).toBe(false)
    expect(none.base).toBe('xcel-signed-in')

    const atlas = signedInFlowV3(base, 'targeted', 'atlas', true)
    /* Logged in to Atlas: the checkout arrives filled (2026-11-04). */
    expect(emailCheckV3(atlas)).toEqual({ second: 'login', signsIn: false, accountKnown: true })
    expect(emailCheckV3(signedInFlowV3(base, 'targeted', 'no-atlas', true)).accountKnown).toBe(false)
    expect(inviteEndingV3(atlas)).toBe('ready')
    expect(atlas.base).toBe('b2c-guest')

    const noAtlas = signedInFlowV3(base, 'mixed', 'no-atlas', true)
    expect(emailCheckV3(noAtlas).second).toBe('code')
    expect(inviteEndingV3(noAtlas)).toBe('create-password')

    /* Signed in until Checkout signs them out. */
    expect(signedInFlowV3(base, 'targeted', 'atlas', false).base).toBe('xcel-signed-in')
  })

  function cartAt(ff: string) {
    const search = `?ff=${ff}&lstate=Arizona&loa=Health&pkg=premier`
    window.history.replaceState({}, '', `/end-to-end-demo/cart${search}`)
    return render(
      <MemoryRouter initialEntries={[`/end-to-end-demo/cart${search}`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Routes>
              <Route path="/end-to-end-demo/cart" element={<XcelCartPage />} />
              <Route path="/end-to-end-demo/checkout" element={<p>Checkout page</p>} />
            </Routes>
            <Where />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('shows My Training, not Log In, while signed in', () => {
    cartAt(`${SIGNED_IN},invite-v3-cart:targeted`)
    expect(screen.getByText('My Training')).toBeInTheDocument()
    expect(screen.queryByText('Log In')).not.toBeInTheDocument()
  })

  it('asks the Partner Code question before anything else', () => {
    for (const cart of ['targeted', 'mixed', 'none'] as const) {
      const flow = signedInFlowV3(base, cart, 'no-atlas', false)
      expect(flow.screens.slice(0, 2)).toEqual(['cart', 'pc-modal'])
    }
    expect(signedInFlowV3(base, 'mixed', 'atlas', false).screens).toContain('drop-notice')
    expect(signedInFlowV3(base, 'targeted', 'atlas', false).screens).not.toContain('drop-notice')
  })

  it('keeps both items in a mixed cart until Checkout drops one', () => {
    cartAt(`${SIGNED_IN},invite-v3-cart:mixed`)
    expect(screen.getByText('Arizona Health Pre-licensing Premier')).toBeInTheDocument()
    expect(screen.getByText('New York Life and Health Flashcards')).toBeInTheDocument()
    expect(screen.queryByText(/have been removed from your cart/)).not.toBeInTheDocument()
  })

  it('collects a partner code on Yes, whatever the cart holds', async () => {
    for (const cart of ['targeted', 'mixed', 'none']) {
      const { unmount } = cartAt(`${SIGNED_IN},invite-v3-cart:${cart}`)
      await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
      await userEvent.click(screen.getByRole('button', { name: 'YES' }))
      const entry = screen.getByRole('dialog', { name: 'Enter your Partner Code' })
      const go = within(entry).getByRole('button', { name: 'Go to Partner Site' })
      expect(go).toBeDisabled()
      await userEvent.type(within(entry).getByLabelText('Partner code'), 'ACME')
      expect(go).toBeEnabled()
      expect(screen.queryByRole('dialog', { name: 'Signing you out' })).not.toBeInTheDocument()
      unmount()
    }
  })

  async function answerNo(cart: string) {
    cartAt(`${SIGNED_IN},invite-v3-cart:${cart}`)
    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Do you have a Partner Code?')
    await userEvent.click(screen.getByRole('button', { name: 'NO' }))
  }

  async function expectSignedOutToCheckout() {
    expect(screen.getByRole('dialog', { name: 'Signing you out' })).toHaveTextContent('ongoing platform update')
    /* Held for 4 seconds — still there just before. */
    await act(() => vi.advanceTimersByTimeAsync(SIGNING_OUT_MS - 100))
    expect(screen.getByRole('dialog', { name: 'Signing you out' })).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(screen.getByText('Checkout page')).toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).toContain('signedout=1')
    expect(screen.getByTestId('where').textContent).toContain('partner=no')
  }

  it('signs a targeted cart out on No, then goes to the checkout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      await answerNo('targeted')
      await expectSignedOutToCheckout()
    } finally {
      vi.useRealTimers()
    }
  })

  it('tells a mixed cart what will be dropped on No, and signs out only if they proceed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      await answerNo('mixed')
      const notice = screen.getByRole('dialog', { name: /not supported/ })
      expect(notice).toHaveTextContent('New York Life and Health Flashcards')
      /* An ✕ in the corner, no Cancel under the button. */
      expect(within(notice).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
      await userEvent.click(within(notice).getByRole('button', { name: 'Close' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Checkout' }))
      await userEvent.click(screen.getByRole('button', { name: 'NO' }))
      await userEvent.click(screen.getByRole('button', { name: 'Proceed to checkout' }))
      await expectSignedOutToCheckout()
    } finally {
      vi.useRealTimers()
    }
  })

  it('ends a cart with nothing targeted at the checkout — Place your order goes nowhere', async () => {
    const ff = `${SIGNED_IN},invite-v3-cart:none`
    window.history.replaceState({}, '', `${CHECKOUT}?ff=${ff}`)
    render(
      <MemoryRouter initialEntries={[`${CHECKOUT}?ff=${ff}&lstate=Arizona&loa=Health&pkg=premier`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Routes>
              <Route path="/end-to-end-demo/checkout" element={<InvitedCheckoutRoute />} />
            </Routes>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }))
    await userEvent.click(screen.getAllByRole('button', { name: /click to fill/i })[0])
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Payment Method' }))
    await userEvent.click(screen.getByRole('button', { name: 'Place your order' }))
    expect(screen.queryByRole('dialog', { name: 'Placing your order' })).not.toBeInTheDocument()
  })

  it('takes a cart with nothing targeted to the existing checkout on No', async () => {
    await answerNo('none')
    expect(screen.getByText('Checkout page')).toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).not.toContain('signedout=1')
  })
})
