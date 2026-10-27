import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import {
  INVITE_FLOW_FLAG,
  emailEnteredTwice,
  passwordSetFromEmailedLink,
  verifiesEmailBeforeCheckout,
  type InviteFlowId,
} from '@/data/inviteFlows'
import {
  DEMO_VERIFICATION_CODE,
  EMAIL_VERIFIED_PARAM,
  clearVerifiedIdentity,
  codeComplete,
  codeMatches,
  identityComplete,
  readVerifiedIdentity,
  storeVerifiedIdentity,
} from '@/data/inviteVerification'
import { INVITE_WALK_PARAMS, clearInviteWalk } from '@/data/inviteWalk'
import { E2E_LEARNER_EMAIL, E2E_LEARNER_FIRST } from '@/pages/endToEndDemo'
import { InvitedCheckoutPageV2 } from '@/pages/InvitedCheckoutPageV2'
import { InvitedProductDetailPageV2 } from '@/pages/InvitedProductDetailPageV2'
import { InvitedConfirmationRoute } from '@/pages/InviteFlowRoutes'

/**
 * THE EMAIL VERIFICATION BEFORE CHECKOUT — 2026-10-27, Jillienne: "another
 * invite flow, that includes a modal prior to the checkout flow that requires
 * the first name, last name, and email address, and this will send a 6-digit
 * pin to the users email that they will need to enter before they can
 * continue with the checkout flow."
 *
 * ⚠ WHAT IS PINNED is the brief, in the same spirit as `InviteFlows.test.tsx`:
 * the modal is there and the checkout is not usable until it is passed; the
 * three fields are required; a wrong code is refused and the right one
 * accepted; and what the learner typed is what the checkout then shows. Copy
 * and layout are expected to move and are not asserted.
 */

/* jsdom HAS NO LAYOUT — the product detail page measures its title. */
if (!('getClientRects' in Range.prototype)) {
  Object.defineProperty(Range.prototype, 'getClientRects', {
    value: () => [],
    writable: true,
    configurable: true,
  })
}

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where" data-path={pathname} data-search={search} />
}

const query = () => new URLSearchParams(screen.getByTestId('where').getAttribute('data-search') ?? '')
const at = () => screen.getByTestId('where').getAttribute('data-path')

const CHECKOUT = '/end-to-end-demo/checkout'
const CONFIRMATION = '/end-to-end-demo/confirmation'

function renderAt(path: string, flow: InviteFlowId, extra = '') {
  const entry = `${path}?ff=${INVITE_FLOW_FLAG}:${flow}${extra}`
  /* `?ff=` is read from `window.location.search`, not the router. */
  window.history.replaceState({}, '', entry)
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Where />
          <Routes>
            <Route path={CHECKOUT} element={<InvitedCheckoutPageV2 />} />
            <Route path={CONFIRMATION} element={<InvitedConfirmationRoute />} />
            <Route path="/end-to-end-demo" element={<InvitedProductDetailPageV2 />} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const dialog = () => screen.queryByRole('dialog', { name: /Verify your email|Enter your code/ })

/** Walk the first step with the demo fill and press Send. */
async function sendTheCode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Fill in the demo learner’s name and email' }))
  await user.click(screen.getByRole('button', { name: 'Send code' }))
  expect(screen.getByRole('heading', { name: 'Enter your code' })).toBeInTheDocument()
}

async function typeCode(user: ReturnType<typeof userEvent.setup>, code: string) {
  await user.click(screen.getByRole('textbox', { name: 'Digit 1 of 6' }))
  await user.keyboard(code)
}

afterEach(() => {
  cleanup()
  clearVerifiedIdentity()
})

describe('the verified arm’s answers', () => {
  it('is the one flow that proves the address first', () => {
    expect(verifiesEmailBeforeCheckout('b2b2c-verified')).toBe(true)
    for (const flow of ['b2b2c-email', 'b2b2c-no-email', 'b2c-guest', 'qr-social'] as const) {
      expect(verifiesEmailBeforeCheckout(flow), flow).toBe(false)
    }
  })

  it('…and so does not type it twice or wait for a mailed link', () => {
    /* The point of verifying up front: the two downstream questions get the
       with-email arm's answers, and they get them by asking the predicate. */
    expect(emailEnteredTwice('b2b2c-verified')).toBe(false)
    expect(passwordSetFromEmailedLink('b2b2c-verified')).toBe(false)
  })

  it('is cleared by Reset with the rest of the walk', () => {
    expect(INVITE_WALK_PARAMS).toContain(EMAIL_VERIFIED_PARAM)
    const cleared = clearInviteWalk(new URLSearchParams(`demo=1&${EMAIL_VERIFIED_PARAM}=1`))
    expect(cleared.get(EMAIL_VERIFIED_PARAM)).toBeNull()
    expect(cleared.get('demo')).toBe('1')
  })
})

describe('what the module decides', () => {
  it('needs both names and something that looks like an address', () => {
    expect(identityComplete({ first: 'Sam', last: 'Okafor', email: 'sam@example.com' })).toBe(true)
    expect(identityComplete({ first: ' ', last: 'Okafor', email: 'sam@example.com' })).toBe(false)
    expect(identityComplete({ first: 'Sam', last: '', email: 'sam@example.com' })).toBe(false)
    expect(identityComplete({ first: 'Sam', last: 'Okafor', email: 'sam@example' })).toBe(false)
  })

  it('tells an unfinished code from a wrong one', () => {
    expect(codeComplete('4829')).toBe(false)
    expect(codeComplete('48291x')).toBe(false)
    expect(codeComplete('482913')).toBe(true)
    expect(codeMatches(DEMO_VERIFICATION_CODE)).toBe(true)
    expect(codeMatches('000000')).toBe(false)
  })

  it('keeps the identity for the tab, trimmed, and survives a blocked store', () => {
    storeVerifiedIdentity({ first: ' Sam ', last: 'Okafor ', email: ' sam@example.com' })
    expect(readVerifiedIdentity()).toEqual({ first: 'Sam', last: 'Okafor', email: 'sam@example.com' })
    clearVerifiedIdentity()
    expect(readVerifiedIdentity()).toBeNull()
    /* Garbage in the store is not an identity. */
    window.sessionStorage.setItem('xcel-invite-verified-identity', '{"first":1}')
    expect(readVerifiedIdentity()).toBeNull()
  })
})

describe('the modal over the checkout', () => {
  it('opens on arrival, on this arm only', () => {
    renderAt(CHECKOUT, 'b2b2c-verified')
    expect(screen.getByRole('dialog', { name: 'Verify your email to continue' })).toBeInTheDocument()
    cleanup()
    for (const flow of ['b2b2c-email', 'b2b2c-no-email', 'qr-social'] as const) {
      renderAt(CHECKOUT, flow)
      expect(dialog(), flow).toBeNull()
      cleanup()
    }
  })

  it('does not ask again once the address says it was passed', () => {
    renderAt(CHECKOUT, 'b2b2c-verified', `&${EMAIL_VERIFIED_PARAM}=1`)
    expect(dialog()).toBeNull()
  })

  it('requires all three fields before it will send', async () => {
    const user = userEvent.setup()
    renderAt(CHECKOUT, 'b2b2c-verified')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    /* Still on the first step, and every gap named. */
    expect(screen.getByRole('heading', { name: 'Verify your email to continue' })).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(3)

    await user.type(screen.getByLabelText(/First name/), 'Sam')
    await user.type(screen.getByLabelText(/Last name/), 'Okafor')
    await user.type(screen.getByLabelText(/Email address/), 'sam@example')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('refuses the wrong code and says so', async () => {
    const user = userEvent.setup()
    renderAt(CHECKOUT, 'b2b2c-verified')
    await sendTheCode(user)

    await user.click(screen.getByRole('button', { name: 'Verify and continue' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/all six digits/)

    await typeCode(user, '000000')
    await user.click(screen.getByRole('button', { name: 'Verify and continue' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/didn’t match/)
    expect(dialog()).toBeInTheDocument()
    expect(query().get(EMAIL_VERIFIED_PARAM)).toBeNull()
  })

  it('accepts the code, and the checkout then knows who it is', async () => {
    const user = userEvent.setup()
    renderAt(CHECKOUT, 'b2b2c-verified')
    await sendTheCode(user)

    /* The boxes advance on their own: six keystrokes from the first box. */
    await typeCode(user, DEMO_VERIFICATION_CODE)
    await user.click(screen.getByRole('button', { name: 'Verify and continue' }))

    expect(dialog()).toBeNull()
    expect(query().get(EMAIL_VERIFIED_PARAM)).toBe('1')
    expect(at()).toBe(CHECKOUT)

    /* The address is LOCKED now — the arm does not type it twice — and it is
       the one the code came back from, not the partner's. */
    const locked = screen.getByDisplayValue(E2E_LEARNER_EMAIL)
    expect(locked).toBeDisabled()
    expect(screen.queryByText('Re-enter email address')).toBeNull()
    expect(screen.getByText(/address you verified/)).toBeInTheDocument()

    /* …and the name was carried into the form rather than asked twice. */
    const student = document.querySelector('section[aria-labelledby="checkout-student"]')!
    const field = (label: string) =>
      [...student.querySelectorAll('label')].find((l) => l.textContent?.startsWith(label))!
        .querySelector('input')!
    expect(field('First Name')).toHaveValue(E2E_LEARNER_FIRST)
    expect(field('Last Name')).toHaveValue('Navarro')
    expect(readVerifiedIdentity()?.email).toBe(E2E_LEARNER_EMAIL)
  })

  it('the demo inbox reveals the code and can type it', async () => {
    const user = userEvent.setup()
    renderAt(CHECKOUT, 'b2b2c-verified')
    await sendTheCode(user)

    expect(screen.queryByText(DEMO_VERIFICATION_CODE)).toBeNull()
    await user.click(screen.getByRole('button', { name: /Show the email we sent/ }))
    const mail = screen.getByRole('region', { name: /verification email/ })
    expect(within(mail).getByText(DEMO_VERIFICATION_CODE)).toBeInTheDocument()
    await user.click(within(mail).getByRole('button', { name: 'Use this code' }))
    await user.click(screen.getByRole('button', { name: 'Verify and continue' }))
    expect(dialog()).toBeNull()
  })

  it('lets the learner change the address before the code is typed', async () => {
    const user = userEvent.setup()
    renderAt(CHECKOUT, 'b2b2c-verified')
    await sendTheCode(user)
    await user.click(screen.getByRole('button', { name: 'Use a different email' }))
    expect(screen.getByRole('heading', { name: 'Verify your email to continue' })).toBeInTheDocument()
    /* What was typed is still there — it is the ADDRESS being changed, not
       the whole form being thrown away. */
    expect(screen.getByLabelText(/First name/)).toHaveValue(E2E_LEARNER_FIRST)
  })

  it('has a real way out, back to the course', async () => {
    const user = userEvent.setup()
    renderAt(CHECKOUT, 'b2b2c-verified')
    await user.click(screen.getByRole('button', { name: 'Back to the course' }))
    expect(at()).toBe('/end-to-end-demo')
  })

  it('a locked-email arm can save the student form by hand', async () => {
    /* ⚠ THE GATE COUNTS THE LOCKED ADDRESS — found building this arm. On the
       with-email arm the email pair's state was only ever typed on the
       twice-typed arms, so Save and continue could not pass a hand-filled form
       at all; it passed only after the demo fill, which sets the pair too. */
    const user = userEvent.setup()
    renderAt(CHECKOUT, 'b2b2c-email')
    const student = document.querySelector('section[aria-labelledby="checkout-student"]')!
    const field = (label: string) =>
      [...student.querySelectorAll('label')].find((l) => l.textContent?.startsWith(label))!
        .querySelector('input, select')!
    await user.type(field('First Name'), 'Sam')
    await user.type(field('Last Name'), 'Okafor')
    await user.type(field('Street Address'), '88 Harbour Way')
    await user.selectOptions(field('State'), 'Texas')
    await user.type(field('City'), 'Austin')
    await user.type(field('ZIP Code'), '78701')
    await user.type(field('Phone number *'), '512 555 0134')
    await user.click(screen.getByRole('button', { name: 'Save and continue' }))
    /* Payment is open: nothing in its column is inert any more. */
    expect(document.querySelector('section[aria-labelledby="checkout-payment"] [inert]')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('after the checkout', () => {
  it('ends at the password, greeting the person who verified', () => {
    storeVerifiedIdentity({ first: 'Sam', last: 'Okafor', email: 'sam.okafor@example.com' })
    renderAt(CONFIRMATION, 'b2b2c-verified')
    /* Inline, like the with-email arm: the address was proven before paying,
       so there is nothing left for a mailed link to prove. */
    expect(screen.getByRole('heading', { name: 'Create your password' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Check your email' })).toBeNull()
    expect(screen.getByRole('heading', { name: /Sam,/ })).toBeInTheDocument()
    expect(screen.getByText('sam.okafor@example.com')).toBeInTheDocument()
  })

  it('names the demo learner when a verified link is opened in a fresh tab', () => {
    renderAt(CONFIRMATION, 'b2b2c-verified')
    expect(screen.getByRole('heading', { name: new RegExp(`${E2E_LEARNER_FIRST},`) })).toBeInTheDocument()
  })
})
