import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FeatureFlagProvider, useFeatureFlags } from '@/context/FeatureFlagContext'
import { AccountDetailsEditPanel } from '@/components/account/profile/AccountDetailsEditPanel'

/**
 * KEYCLOAK'S CHANGE PASSWORD — 2026-11-12, Afsana. Update Password on the Edit
 * Account Details sheet embeds Keycloak's widget in the sheet (the default)
 * or opens it as a modal instead of the sheet's own step, with the invite flow's strength bar and rules under New Password, and the
 * open item (stay signed in, or sign out) drawn both ways.
 */

const EMAIL = 'learner@example.com'

function Flags({ set }: { set: Record<string, { enabled?: boolean; variant?: string }> }) {
  const { setEnabled, setVariant } = useFeatureFlags()
  useEffect(() => {
    for (const [key, v] of Object.entries(set)) {
      if (v.enabled != null) setEnabled(key, v.enabled)
      if (v.variant != null) setVariant(key, v.variant)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, [])
  return null
}

/* Open until it is closed, as on the Profile page, so "closes" is observable. */
function Panel() {
  const [open, setOpen] = useState(true)
  return (
    <AccountDetailsEditPanel open={open} onClose={() => setOpen(false)} currentEmail={EMAIL} onEmailSaved={() => {}} />
  )
}

function renderPanel(set: Record<string, { enabled?: boolean; variant?: string }> = {}) {
  return render(
    <MemoryRouter>
      <FeatureFlagProvider>
        <Flags set={set} />
        <Panel />
      </FeatureFlagProvider>
    </MemoryRouter>,
  )
}

function fill(current: string, next: string, confirm: string) {
  fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: current } })
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: next } })
  fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: confirm } })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const MODAL = { 'account-keycloak-change-password': { variant: 'modal' } }
const SIGN_OUT = { 'account-password-change-outcome': { variant: 'sign-out' } }

describe('Keycloak change password', () => {
  it('in panel (the default): embeds the widget as the sheet\'s step, no modal', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    expect(screen.queryByRole('dialog', { name: 'Change Password' })).toBeNull()
    /* The sheet's title names the step; the widget adds no heading of its own. */
    expect(screen.getByRole('heading', { name: 'Update Password' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Change Password' })).toBeNull()
    expect(screen.getByText(/Security experts generally recommend against reuse/)).toBeTruthy()
    expect(screen.queryByText(/Enter your current password and choose a new one/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Back to Edit Account Details' })).toBeTruthy()
    expect(screen.getByRole('meter', { name: 'Password strength' })).toBeTruthy()
    expect(screen.getByText('Password must:')).toBeTruthy()
    expect(screen.queryByAltText('XCEL Insurance Training by Colibri')).toBeNull()
    expect(screen.queryByText('Password Requirements')).toBeNull()
  })

  it('modal: opens in place of the sheet step, with the logo, strength bar and rules', () => {
    renderPanel(MODAL)
    fireEvent.click(screen.getByText('Update Password'))
    expect(screen.getByRole('dialog', { name: 'Change Password' })).toBeTruthy()
    expect(screen.getByAltText('XCEL Insurance Training by Colibri')).toBeTruthy()
    expect(screen.getByRole('meter', { name: 'Password strength' })).toBeTruthy()
    expect(screen.getByText('Password must:')).toBeTruthy()
  })

  it('enables Change Password only once every rule is met and the two match', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    const submit = () => screen.getByRole('button', { name: 'Change Password' }) as HTMLButtonElement
    expect(submit().disabled).toBe(true)
    fill('OldPass1!', 'weak', 'weak')
    expect(submit().disabled).toBe(true)
    fill('OldPass1!', 'NewPass12!', 'NewPass12?')
    expect(screen.getByText('Both passwords must match.')).toBeTruthy()
    expect(submit().disabled).toBe(true)
    fill('NewPass12!', 'NewPass12!', 'NewPass12!')
    expect(screen.getByText(/must be different from your current password/)).toBeTruthy()
    expect(submit().disabled).toBe(true)
    fill('OldPass1!', 'NewPass12!', 'NewPass12!')
    expect(submit().disabled).toBe(false)
  })

  it.each([
    ['in panel', {}],
    ['modal', MODAL],
  ])('%s, stay signed in: closes and toasts', (_arm, set) => {
    renderPanel(set)
    fireEvent.click(screen.getByText('Update Password'))
    fill('OldPass1!', 'NewPass12!', 'NewPass12!')
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))
    expect(screen.queryByLabelText('New Password')).toBeNull()
    expect(screen.getByText('Password updated')).toBeTruthy()
  })

  it.each([
    ['in panel', {}],
    ['modal', MODAL],
  ])('%s, sign out: says so and asks the learner to sign in again', (_arm, set) => {
    renderPanel({ ...set, ...SIGN_OUT })
    fireEvent.click(screen.getByText('Update Password'))
    fill('OldPass1!', 'NewPass12!', 'NewPass12!')
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))
    expect(screen.getByRole('heading', { name: 'Password changed' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy()
  })

  it('side panel: the sheet\'s own Update Password step, as before', () => {
    renderPanel({ 'account-keycloak-change-password': { variant: 'sheet' } })
    fireEvent.click(screen.getByText('Update Password'))
    expect(screen.queryByRole('heading', { name: 'Change Password' })).toBeNull()
    expect(screen.getByText('Password Requirements')).toBeTruthy()
  })
})
