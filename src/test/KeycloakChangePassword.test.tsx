import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FeatureFlagProvider, useFeatureFlags } from '@/context/FeatureFlagContext'
import { AccountDetailsEditPanel } from '@/components/account/profile/AccountDetailsEditPanel'

/**
 * KEYCLOAK'S CHANGE PASSWORD — 2026-11-12, Afsana. Update Password on the Edit
 * Account Details sheet embeds Keycloak's widget as the sheet's step, with the
 * invite flow's strength bar and rules under New Password.
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

const save = () => screen.getByRole('button', { name: 'Save Password' }) as HTMLButtonElement

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('Keycloak change password', () => {
  it('embeds the widget as the sheet\'s step, with no heading of its own', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    expect(screen.queryByRole('dialog', { name: 'Change Password' })).toBeNull()
    /* The sheet's title names the step; the widget adds no heading of its own. */
    expect(screen.getByRole('heading', { name: 'Update Password' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Change Password' })).toBeNull()
    expect(screen.getByText(/Enter your current password and create a new one that meets the requirements below/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back to Edit Account Details' })).toBeTruthy()
    expect(screen.getByRole('meter', { name: 'Password strength' })).toBeTruthy()
    expect(screen.getByText('Password must:')).toBeTruthy()
    expect(screen.queryByText('Password Requirements')).toBeNull()
    expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeTruthy()
  })

  it('puts Cancel first and Save Password second', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    const footer = save().closest('footer') as HTMLElement
    const labels = Array.from(footer.querySelectorAll('button')).map((b) => b.textContent)
    expect(labels).toEqual(['Cancel', 'Save Password'])
    expect(screen.queryByRole('button', { name: 'Change Password' })).toBeNull()
  })

  it('Update Email Address puts Cancel first and Save Email second', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Email Address'))
    const footer = screen.getByRole('button', { name: 'Save Email' }).closest('footer') as HTMLElement
    const labels = Array.from(footer.querySelectorAll('button')).map((b) => b.textContent)
    expect(labels).toEqual(['Cancel', 'Save Email'])
  })

  it('enables Save Password only once every rule is met and the two match', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    expect(save().disabled).toBe(true)
    fill('OldPass1!', 'weak', 'weak')
    expect(save().disabled).toBe(true)
    fill('OldPass1!', 'NewPass12!', 'NewPass12?')
    expect(screen.getByText('Both passwords must match.')).toBeTruthy()
    expect(save().disabled).toBe(true)
    fill('NewPass12!', 'NewPass12!', 'NewPass12!')
    expect(screen.getByText(/must be different from your current password/)).toBeTruthy()
    expect(save().disabled).toBe(true)
    fill('OldPass1!', 'NewPass12!', 'NewPass12!')
    expect(save().disabled).toBe(false)
  })

  it('stay signed in: closes and toasts', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    fill('OldPass1!', 'NewPass12!', 'NewPass12!')
    fireEvent.click(save())
    expect(screen.queryByLabelText('New Password')).toBeNull()
    expect(screen.getByText('Password updated')).toBeTruthy()
  })

  it('Forgot password? opens Reset your password, then Check your email; Escape leaves the panel open', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeTruthy()
    const send = screen.getByRole('button', { name: 'Send reset link' }) as HTMLButtonElement
    expect(send.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: EMAIL } })
    expect(send.disabled).toBe(false)
    fireEvent.click(send)
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeTruthy()
    expect(screen.getByText(EMAIL)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Resend link' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('heading', { name: 'Check your email' })).toBeNull()
    expect(screen.getByLabelText('Current Password')).toBeTruthy()
  })

  it('the ✕ closes the modal on both steps, and only the modal', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Update Password'))
    const dialog = () => screen.queryByRole('dialog', { name: /Reset your password|Check your email/ })
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    fireEvent.click(within(dialog()!).getByRole('button', { name: 'Close' }))
    expect(dialog()).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: EMAIL } })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    fireEvent.click(within(dialog()!).getByRole('button', { name: 'Close' }))
    expect(dialog()).toBeNull()
    expect(screen.getByLabelText('Current Password')).toBeTruthy()
  })

  it('off: the sheet\'s own Update Password step, as before', () => {
    renderPanel({ 'account-keycloak-change-password': { enabled: false } })
    fireEvent.click(screen.getByText('Update Password'))
    expect(screen.getByText('Password Requirements')).toBeTruthy()
  })
})
