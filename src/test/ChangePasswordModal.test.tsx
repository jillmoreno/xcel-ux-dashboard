import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { FeatureFlagProvider, useFeatureFlags } from '@/context/FeatureFlagContext'
import { AccountDetailsEditPanel } from '@/components/account/profile/AccountDetailsEditPanel'

/**
 * KEYCLOAK'S CHANGE PASSWORD — 2026-11-12, Afsana. Update Password on the Edit
 * Account Details sheet opens Keycloak's modal instead of the sheet's step,
 * with the invite flow's strength bar and rules under New Password, and the
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

function renderPanel(set: Record<string, { enabled?: boolean; variant?: string }> = {}) {
  return render(
    <MemoryRouter>
      <FeatureFlagProvider>
        <Flags set={set} />
        <AccountDetailsEditPanel open onClose={() => {}} currentEmail={EMAIL} onEmailSaved={() => {}} />
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

describe('ChangePasswordModal', () => {
  it('opens in place of the sheet step, with the strength bar and rules under New Password', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    expect(screen.getByRole('dialog', { name: 'Change Password' })).toBeTruthy()
    expect(screen.getByRole('meter', { name: 'Password strength' })).toBeTruthy()
    expect(screen.getByText('Password must:')).toBeTruthy()
    expect(screen.queryByText('Password Requirements')).toBeNull()
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

  it('stay signed in: closes and toasts', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    fill('OldPass1!', 'NewPass12!', 'NewPass12!')
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))
    expect(screen.queryByRole('dialog', { name: 'Change Password' })).toBeNull()
    expect(screen.getByText('Password updated')).toBeTruthy()
  })

  it('sign out: says so and asks the learner to sign in again', () => {
    renderPanel({ 'account-password-change-outcome': { variant: 'sign-out' } })
    fireEvent.click(screen.getByText('Update Password'))
    fill('OldPass1!', 'NewPass12!', 'NewPass12!')
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))
    expect(screen.getByRole('dialog', { name: 'Password changed' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy()
  })

  it('flag off: the sheet’s own Update Password step, as before', () => {
    renderPanel({ 'account-keycloak-change-password': { enabled: false } })
    fireEvent.click(screen.getByText('Update Password'))
    expect(screen.queryByRole('dialog', { name: 'Change Password' })).toBeNull()
    expect(screen.getByText('Password Requirements')).toBeTruthy()
  })
})
