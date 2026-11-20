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
  XcelOcdHomeStandIn,
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
            <Route path={LOG_IN_PATHS.ocdHome} element={<XcelOcdHomeStandIn />} />
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
    expect(logInFlowV3(flow, 'none').screens).toContain('log-in-no-account')
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
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    /* Keycloak's Forgot password?, under the field — not OCD's under the card. */
    expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeInTheDocument()
    expect(screen.queryByText('Forgot your password?')).not.toBeInTheDocument()
    /* Keycloak's shape: no email field, ← Back to change it. */
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('Email')).toHaveValue('jsmith42')
  })

  it('draws no lead under Log in on either step', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'ocd')
    await toOcdPage(user)
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'jsmith42')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.queryByText('Enter your password')).not.toBeInTheDocument()
  })

  it('in Keycloak: Keycloak’s log-in with no lead or email field, then Signing you in', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'atlas')
    await toOcdPage(user)
    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(where()).toBe(LOG_IN_PATHS.keycloak)
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Email/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Enter your password to/)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Password/), 'Secret#2027')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByLabelText('Signing you in')).toBeInTheDocument()
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

  it('OCD only: the right password goes into OCD; “wrong” is incorrect, under the password', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'ocd')
    await toOcdPage(user)
    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('The Username or Password is incorrect.')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'ocd-incorrect')
    await user.clear(screen.getByLabelText('Password'))
    await user.type(screen.getByLabelText('Password'), 'Secret#2027')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(where()).toBe(LOG_IN_PATHS.ocdHome)
  })

  it('neither: An account does not exist., after the password — never “create a user account”', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/cart', 'none')
    await toOcdPage(user)
    await user.type(screen.getByLabelText('Email'), 'nobody@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Password'), 'Secret#2027')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Log in' }))
    })
    expect(screen.getByRole('alert')).toHaveTextContent('An account does not exist.')
    expect(screen.queryByText(/create a user account/i)).not.toBeInTheDocument()
    expect(where()).toBe(LOG_IN_PATHS.ocd)
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
