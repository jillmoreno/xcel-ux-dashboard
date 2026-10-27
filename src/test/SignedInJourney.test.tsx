import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import {
  INVITE_FLOW_FLAG,
  ORDER_CONFIRMATION_STYLE_FLAG,
  asksForPartnerCode,
  emailEnteredTwice,
  passwordSetFromEmailedLink,
  signedIn,
  type InviteFlowId,
} from '@/data/inviteFlows'
import { E2E_LEARNER_EMAIL, E2E_LEARNER_FIRST, E2E_LEARNER_PHONE } from '@/pages/endToEndDemo'
import { InvitedCheckoutPageV2 } from '@/pages/InvitedCheckoutPageV2'
import { XcelFindCoursePage } from '@/pages/XcelFindCoursePage'
import { XcelOrderConfirmationPage } from '@/pages/XcelOrderConfirmationPage'

/**
 * THE SIGNED-IN XCEL CUSTOMER — 2026-10-27, Jillienne: "another invite flow
 * that is for a user that is already logged into the Xcel site, but when they
 * complete their purchase, they will need to create a new password. So there
 * would be an email field, and a create password field. With a message
 * indicating they need a new password."
 *
 * ⚠ WHAT IS PINNED is the brief: the site knows them (the header, the filled
 * checkout, the locked account email, no partner question), and the ending
 * still sets a password and says why. Copy and layout are expected to move.
 */

function renderAt(path: string, flow: InviteFlowId, extra = '') {
  const entry = `${path}?ff=${INVITE_FLOW_FLAG}:${flow}${extra}`
  window.history.replaceState({}, '', entry)
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Routes>
            <Route path="/end-to-end-demo/find" element={<XcelFindCoursePage />} />
            <Route path="/end-to-end-demo/checkout" element={<InvitedCheckoutPageV2 />} />
            <Route path="/end-to-end-demo/order-confirmation" element={<XcelOrderConfirmationPage />} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const FLOW: InviteFlowId = 'xcel-signed-in'
const CHECKOUT = '/end-to-end-demo/checkout'
const CONFIRMATION = '/end-to-end-demo/order-confirmation'

const studentField = (label: string) =>
  [...document.querySelectorAll('section[aria-labelledby="checkout-student"] label')]
    .find((l) => l.textContent?.startsWith(label))!
    .querySelector('input, select')! as HTMLInputElement
const paymentLocked = () =>
  document.querySelector('section[aria-labelledby="checkout-payment"] [inert]') != null

afterEach(cleanup)

describe('the signed-in arm’s answers', () => {
  it('is the one flow the site already knows', () => {
    expect(signedIn(FLOW)).toBe(true)
    for (const flow of ['b2b2c-email', 'b2b2c-no-email', 'b2c-guest', 'qr-social', 'b2b2c-verified'] as const) {
      expect(signedIn(flow), flow).toBe(false)
    }
  })

  it('uses the account’s address and sets the password inline', () => {
    expect(emailEnteredTwice(FLOW)).toBe(false)
    expect(passwordSetFromEmailedLink(FLOW)).toBe(false)
  })

  it('is not asked for a partner code, though no partner is behind it', () => {
    /* The guest is asked because nothing is known; here the account already
       carries its affiliation or the lack of one. */
    expect(asksForPartnerCode(FLOW)).toBe(false)
    expect(asksForPartnerCode('b2c-guest')).toBe(true)
  })
})

describe('on the public site', () => {
  it('the header knows them — My Training, not Log In', () => {
    renderAt('/end-to-end-demo/find', FLOW)
    expect(screen.getByText('My Training')).toBeInTheDocument()
    expect(screen.queryByText('Log In')).toBeNull()
    cleanup()
    renderAt('/end-to-end-demo/find', 'b2c-guest')
    expect(screen.getByText('Log In')).toBeInTheDocument()
    expect(screen.queryByText('My Training')).toBeNull()
  })
})

describe('at checkout', () => {
  it('arrives filled from the account, with Payment open', () => {
    renderAt(CHECKOUT, FLOW)
    expect(studentField('First Name')).toHaveValue(E2E_LEARNER_FIRST)
    expect(studentField('Street Address')).not.toHaveValue('')
    expect(studentField('Phone number *')).toHaveValue(E2E_LEARNER_PHONE)
    expect(paymentLocked()).toBe(false)
  })

  it('locks the account’s email and says whose it is', () => {
    renderAt(CHECKOUT, FLOW)
    const locked = screen.getByDisplayValue(E2E_LEARNER_EMAIL)
    expect(locked).toBeDisabled()
    expect(screen.queryByText('Re-enter email address')).toBeNull()
    expect(screen.getByText(/email on your XCEL account/)).toBeInTheDocument()
  })

  it('asks no partner question over the page', () => {
    renderAt(CHECKOUT, FLOW)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('editing a field re-locks Payment until it is saved again', async () => {
    const user = userEvent.setup()
    renderAt(CHECKOUT, FLOW)
    await user.type(studentField('City'), 'x')
    expect(paymentLocked()).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Save and continue' }))
    expect(paymentLocked()).toBe(false)
  })
})

describe('after the order', () => {
  it('ends at a NEW password, and says why', () => {
    renderAt(CONFIRMATION, FLOW)
    expect(screen.getByRole('heading', { name: 'Create a new password' })).toBeInTheDocument()
    expect(screen.getByText(/needs a password of its own/)).toBeInTheDocument()
    expect(screen.getByText(E2E_LEARNER_EMAIL)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter password...')).toBeInTheDocument()
    /* No inbox step: the address is one XCEL already reaches them at. */
    expect(screen.queryByRole('heading', { name: 'Confirm your email' })).toBeNull()
  })

  it('the receipt treatment resolves to the light split, because the receipt has no password step', () => {
    /* One `ff=`, comma-separated — a second `ff=` is ignored. */
    renderAt(CONFIRMATION, FLOW, `,${ORDER_CONFIRMATION_STYLE_FLAG}:receipt`)
    expect(screen.getByRole('heading', { name: 'Create a new password' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Launch Student Portal' })).toBeNull()
    cleanup()
    /* …and the guest still gets the receipt on that arm. */
    renderAt(CONFIRMATION, 'b2c-guest', `,${ORDER_CONFIRMATION_STYLE_FLAG}:receipt`)
    expect(screen.getByRole('button', { name: 'Launch Student Portal' })).toBeInTheDocument()
  })
})
