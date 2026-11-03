import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider, useFeatureFlags } from '@/context/FeatureFlagContext'
import {
  InvitedCheckoutRoute,
  InvitedConfirmationRoute,
  InvitedProductDetailRoute,
  QrInviteRoute,
} from '@/pages/InviteFlowRoutes'
import { XcelCartPage } from '@/pages/XcelCartPage'
import { InviteFlowEntrySync } from '@/pages/EndToEndPageSync'
import { LOADING_HANDOFF_MS } from '@/components/e2e/XcelLoadingPage'
import {
  INVITE_FLOWS_V3,
  emailCheckV3,
  entryPathV3,
  inviteEndingV3,
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

describe('Invite Flow V3 — the email check', () => {
  it('asks for the email only, and keeps Continue off until it is an address', async () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const dialog = screen.getByRole('dialog', { name: 'Verify your email to continue' })
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
    expect(screen.queryByRole('dialog', { name: 'Verify your email to continue' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^no$/i }))
    expect(screen.getByRole('dialog', { name: 'Verify your email to continue' })).toBeInTheDocument()
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

  it('sends a learner who already has Atlas straight to their course', () => {
    renderAt(CONFIRMATION, 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:has-atlas')
    expect(screen.getByRole('heading', { name: 'Start learning' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start Course' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Password/)).not.toBeInTheDocument()
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
      expect(screen.getByDisplayValue('jordan@example.com')).toBeDisabled()
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
    /* The signed-in flow's check depends on its cart — see its own tests.
       Direct Email has none: the partner supplied the address. */
    for (const flow of INVITE_FLOWS_V3.filter((f) => f.id !== 'xcel-signed-in' && f.id !== 'direct-email')) {
      expect(verifiesEmailFirst(flow)).toBe(true)
    }
    const check = (id: string) => emailCheckV3(INVITE_FLOWS_V3.find((f) => f.id === id)!)
    expect(check('qr-atlas-login')).toEqual({ second: 'login', signsIn: true, accountKnown: true })
    expect(check('has-atlas-login')).toEqual({ second: 'login', signsIn: false, accountKnown: true })
    expect(check('has-atlas')).toEqual({ second: 'login', signsIn: true, accountKnown: true })
    expect(check('qr-atlas-auto')).toEqual({ second: 'login', signsIn: true, accountKnown: true })
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
    const scrim = screen.getByRole('dialog', { name: 'Verify your email to continue' }).parentElement!
    expect(scrim.style.zIndex).toBe('55')
  })

  /* The file's stylesheet: every dialog 460 wide, its gated button full width. */
  it('draws the email check 460 wide with a full-width button', () => {
    renderAt(CHECKOUT, `${V3_B2B},invite-v3-flow-b2b:qr-net-new`)
    const dialog = screen.getByRole('dialog', { name: 'Verify your email to continue' })
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
    const scrim = screen.getByRole('dialog', { name: 'Verify your email to continue' }).parentElement!
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

describe('Invite Flow V3 — signed in to XCEL (OCD)', () => {
  const SIGNED_IN = 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:xcel-signed-in'
  const base = INVITE_FLOWS_V3.find((f) => f.id === 'xcel-signed-in')!

  it('routes each cart and email to its own walk', () => {
    const none = signedInFlowV3(base, 'none', 'atlas', false)
    expect(verifiesEmailFirst(none)).toBe(false)
    expect(none.base).toBe('xcel-signed-in')

    const atlas = signedInFlowV3(base, 'targeted', 'atlas', true)
    expect(emailCheckV3(atlas)).toEqual({ second: 'login', signsIn: false, accountKnown: false })
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
    await act(() => vi.advanceTimersByTimeAsync(LOADING_HANDOFF_MS))
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
      await userEvent.click(within(notice).getByRole('button', { name: 'Cancel' }))
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
