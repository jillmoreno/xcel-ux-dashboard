import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { XcelCartPage } from '@/pages/XcelCartPage'
import { InviteFlowEntrySync } from '@/pages/EndToEndPageSync'
import {
  XcelKeycloakLogInPage,
  XcelLogInAccountPage,
  XcelLogInPartnerCodePage,
  XcelOcdExistingLogInPage,
  XcelOcdLogInPage,
} from '@/pages/XcelLogInPages'
import { INVITE_FLOWS_V3, inviteV3Surface, logInFlowV3, v3ScreensFor, LOG_IN_PATHS } from '@/data/inviteFlowsV3'
import { InviteV3StartPage } from '@/pages/InviteV3StartPage'

/**
 * INVITE FLOW V3'S LOG IN — 2026-11-20, Afsana (PRD 5.7, decisions of
 * 2026-11-18). Log In → Partner Code? → No → XCEL account? → Yes → OCD's
 * log-in page asking for the email alone → Keycloak's log-in when Keycloak
 * knows it, OCD's password when it does not, and one message for an unknown
 * account and a wrong password alike.
 */

const LOG_IN = 'invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:xcel-log-in'

function renderAt(path: string, account: 'atlas' | 'ocd' | 'none') {
  const ff = `${LOG_IN},invite-v3-log-in-account:${account}`
  /* `?ff=` is read from `window.location.search`, not the router — set both. */
  window.history.replaceState({}, '', `${path}?ff=${ff}`)
  return render(
    <MemoryRouter initialEntries={[`${path}?ff=${ff}&lstate=Arizona&loa=Health&pkg=premier`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <InviteFlowEntrySync />
          <Routes>
            <Route path="/end-to-end-demo/cart" element={<XcelCartPage />} />
            <Route path={LOG_IN_PATHS.partnerCode} element={<XcelLogInPartnerCodePage />} />
            <Route path={LOG_IN_PATHS.account} element={<XcelLogInAccountPage />} />
            <Route path={LOG_IN_PATHS.ocd} element={<XcelOcdLogInPage />} />
            <Route path={LOG_IN_PATHS.keycloak} element={<XcelKeycloakLogInPage />} />
            <Route path={LOG_IN_PATHS.ocdExisting} element={<XcelOcdExistingLogInPage />} />
          </Routes>
          <Where />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function Where() {
  const { pathname } = useLocation()
  return <output data-testid="where">{pathname}</output>
}

const where = () => screen.getByTestId('where').textContent

/** Cart → Log In → No → Yes: OCD's log-in page. */
async function toOcdPage(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Log In' }))
  expect(where()).toBe(LOG_IN_PATHS.partnerCode)
  await user.click(screen.getByRole('button', { name: 'NO' }))
  expect(where()).toBe(LOG_IN_PATHS.account)
  await user.click(screen.getByRole('button', { name: 'YES' }))
  expect(where()).toBe(LOG_IN_PATHS.ocd)
}

describe('Invite Flow V3 — Log In', () => {
  it('is a B2C flow with its own surface, and its pages are on the B2C walk', () => {
    const flow = INVITE_FLOWS_V3.find((f) => f.id === 'xcel-log-in')!
    expect(flow.model).toBe('b2c')
    expect(inviteV3Surface('b2c', 'xcel-log-in')).toBe('invite:v3-b2c-log-in')
    for (const path of Object.values(LOG_IN_PATHS)) expect(v3ScreensFor('b2c')).toContain(path)
    expect(logInFlowV3(flow, 'atlas').screens).toContain('log-in-keycloak')
    expect(logInFlowV3(flow, 'none').screens).toContain('log-in-incorrect')
    expect(logInFlowV3(flow, 'ocd').screens).toContain('log-in-ocd-existing')
  })

  it('Log In opens the Partner Code question; Yes does nothing', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'atlas')
    await user.click(screen.getByRole('button', { name: 'Log In' }))
    expect(screen.getByRole('heading', { name: /Do you have a Partner Code\?/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'YES' }))
    expect(where()).toBe(LOG_IN_PATHS.partnerCode)
  })

  it('asks Do you have an XCEL account? with How do I know?; No does nothing, Back returns', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'atlas')
    await user.click(screen.getByRole('button', { name: 'Log In' }))
    await user.click(screen.getByRole('button', { name: 'NO' }))
    expect(screen.getByRole('heading', { name: 'Do you have an XCEL account?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How do I know?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'NO' }))
    expect(where()).toBe(LOG_IN_PATHS.account)
    await user.click(screen.getByRole('button', { name: /Back/ }))
    expect(where()).toBe(LOG_IN_PATHS.partnerCode)
  })

  it('OCD’s page asks for the email alone, labelled Email, and takes a username', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'ocd')
    await toOcdPage(user)
    const email = screen.getByLabelText('Email')
    expect(email).toHaveAttribute('type', 'text')
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Forgot password?' })).not.toBeInTheDocument()
    await user.type(email, 'jsmith42')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    /* Not found in Keycloak: OCD's own page, the username carried over. */
    expect(where()).toBe(LOG_IN_PATHS.ocdExisting)
    expect(screen.getByLabelText('Username:')).toHaveValue('jsmith42')
  })

  it('the info icon says “Enter email or username” on hover', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'ocd')
    await toOcdPage(user)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await user.hover(screen.getByRole('button', { name: 'About this field' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Enter email or username')
  })

  it('draws no lead under Log in', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'ocd')
    await toOcdPage(user)
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument()
  })

  it('in Keycloak: Keycloak’s log-in greets them and locks the address, then Signing you in', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'atlas')
    await toOcdPage(user)
    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(where()).toBe(LOG_IN_PATHS.keycloak)
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByText('Welcome back, Jordan! Enter your password.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email/)).toHaveValue('learner@example.com')
    expect(screen.getByLabelText(/^Email/)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.queryByText(/Can’t log in\?/)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Password/), 'Secret#2027')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByLabelText('Signing you in')).toBeInTheDocument()
  })

  it('Keycloak’s Reset your password has ← Back to Log in, and no Back to sign in', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'atlas')
    await toOcdPage(user)
    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back to sign in' })).not.toBeInTheDocument()
    /* Can't log in? moved here from Log in, as Contact us (2026-11-23). */
    const contact = screen.getByRole('link', { name: /Contact us/ })
    expect(contact).toHaveAttribute('href', 'https://www.xcelsolutions.com/contact-us')
    expect(contact).toHaveAttribute('target', '_blank')
    expect(contact).toHaveAttribute('rel', 'noopener noreferrer')
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(where()).toBe(LOG_IN_PATHS.keycloak)
  })

  it('Keycloak’s ← Back returns to the email step, the address still in it', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'atlas')
    await toOcdPage(user)
    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(where()).toBe(LOG_IN_PATHS.ocd)
    expect(screen.getByLabelText('Email')).toHaveValue('learner@example.com')
  })

  /** Email step → Continue → OCD's own page, for an account Keycloak does
   *  not know (2026-11-23). */
  async function toOcdExisting(user: ReturnType<typeof userEvent.setup>, email: string) {
    await toOcdPage(user)
    await user.type(screen.getByLabelText('Email'), email)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(where()).toBe(LOG_IN_PATHS.ocdExisting)
  }

  it('OCD’s own page keeps its design: Username: and Password:, LOG IN, Forgot your password? under it', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'ocd')
    await toOcdExisting(user, 'learner@example.com')
    const username = screen.getByLabelText('Username:')
    expect(username).toHaveValue('learner@example.com')
    expect(username).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Password:')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('an empty password says “All fields are required”, on either account', async () => {
    for (const account of ['ocd', 'none'] as const) {
      const user = userEvent.setup()
      const { unmount } = renderAt('/end-to-end-demo/cart', account)
      await toOcdExisting(user, 'learner@example.com')
      await user.click(screen.getByRole('button', { name: 'Log In' }))
      expect(screen.getByRole('alert')).toHaveTextContent('All fields are required')
      expect(screen.getByLabelText('Password:')).toHaveAttribute('aria-invalid', 'true')
      unmount()
    }
  })

  it('OCD only: LOG IN with a password does nothing', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'ocd')
    await toOcdExisting(user, 'learner@example.com')
    await user.type(screen.getByLabelText('Password:'), 'Secret#2027')
    await user.click(screen.getByRole('button', { name: 'Log In' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Signing you in')).not.toBeInTheDocument()
    expect(where()).toBe(LOG_IN_PATHS.ocdExisting)
  })

  it('neither: LOG IN with a password says the Username or Password is incorrect — never “does not exist”', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'none')
    await toOcdExisting(user, 'nobody@example.com')
    await user.type(screen.getByLabelText('Password:'), 'Secret#2027')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Log In' }))
    })
    expect(screen.getByRole('alert')).toHaveTextContent('The Username or Password is incorrect')
    expect(screen.queryByText(/does not exist|create a user account/i)).not.toBeInTheDocument()
    expect(where()).toBe(LOG_IN_PATHS.ocdExisting)
  })

  it('/invite-v3 starts Log In three ways, by where the account is', () => {
    window.history.replaceState({}, '', '/invite-v3')
    render(
      <MemoryRouter initialEntries={['/invite-v3']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <InviteV3StartPage />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const row = screen.getByRole('heading', { name: 'Log In' }).closest('article')!
    const links = row.querySelectorAll('a')
    expect([...links].map((a) => a.textContent?.replace(' (opens in a new tab)', ''))).toEqual([
      'Atlas account',
      'OCD account',
      'No account',
    ])
    expect(links[1].getAttribute('href')).toContain('invite-v3-log-in-account%3Aocd')
    expect(links[1].getAttribute('href')).toContain('invite-v3-flow-b2c%3Axcel-log-in')
  })
})
