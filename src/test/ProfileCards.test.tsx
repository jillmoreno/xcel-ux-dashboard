import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider, supportsMembership } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { MotivationProvider } from '@/context/MotivationContext'
import { ProfilePage } from '@/pages/ProfilePage'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'

/**
 * Two cards left the Profile page on 2026-09-10 for DIFFERENT reasons, and the
 * distinction is the thing worth pinning: one is a capability gate that returns
 * on its own, the other an editorial removal that only comes back by hand.
 */

function renderProfile() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <MotivationProvider>
            <ProfilePage />
          </MotivationProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('the Profile page', () => {
  it('shows no Membership Plan card for a brand that sells no membership', () => {
    // It was announcing "Automatically Renews on 11/01/2026 · 108 Days of
    // Membership Remaining" on XCEL — the same defect as the Membership nav
    // link the brand-add's suppression list missed. Asserted through
    // `supportsMembership` rather than as a flat "absent", so the card comes
    // back on its own for a brand that has one and this test follows it.
    expect(supportsMembership('xcel')).toBe(false)
    renderProfile()
    expect(screen.queryByRole('heading', { name: 'Membership Plan' })).toBeNull()
  })

  it('shows no Motivational Statement card', () => {
    renderProfile()
    expect(screen.queryByRole('heading', { name: 'Motivational Statement' })).toBeNull()
  })

  it('keeps the cards that stayed', () => {
    // Guards the removal from over-reaching: three cards were meant to stay.
    renderProfile()
    for (const title of ['Account Details', 'Personal Information', 'Interests']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
  })

  it('archives the editorial removal, and only that one', () => {
    // The archive convention: an unwired thing gets a row with real re-wire
    // steps. The Membership Plan card must NOT have one — it is gated, not
    // archived, and a row would tell the next person to re-add something the
    // brand predicate is deliberately withholding.
    const ids = ARCHIVED_ITEMS.map((a) => a.id)
    expect(ids).toContain('profile-motivational-statement')
    expect(ids.some((id) => /membership-plan/.test(id))).toBe(false)

    const row = ARCHIVED_ITEMS.find((a) => a.id === 'profile-motivational-statement')!
    // `restoreNote` is the field this convention says is most often written too
    // thinly — it has to name the file and the call site, not just the idea.
    expect(row.restoreNote).toMatch(/ProfilePage/)
    expect(row.location).toMatch(/ProfileCards/)
  })
})
