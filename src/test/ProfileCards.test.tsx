import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider, supportsMembership } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { MotivationProvider } from '@/context/MotivationContext'
import { ProfilePage } from '@/pages/ProfilePage'
import { profileFor } from '@/data/accountProfileFixtures'
import { accountSectionsFor } from '@/components/account/accountSections'
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

  it('shows no "Member" pill for a brand that sells no membership', () => {
    // The third instance of one defect on this page, after the Membership Plan
    // card and the rail's Membership link before it. The pill was keyed on
    // `isMember`, which XCEL's own tier makes TRUE — the question that has to
    // be asked first is whether the brand sells a membership at all.
    renderProfile()
    expect(screen.queryByText(/^Member$/)).toBeNull()
    expect(screen.queryByText(/non-member/i)).toBeNull()
  })

  it('shows no Motivational Statement card', () => {
    renderProfile()
    expect(screen.queryByRole('heading', { name: 'Motivational Statement' })).toBeNull()
  })

  it('keeps the cards that stayed', () => {
    // Guards the removal from over-reaching: two cards were meant to stay.
    // INVERTED 2026-09-30 — 'Interests' was in this list. Restoring the
    // Interests card means putting it back here, not just in ProfilePage.
    renderProfile()
    for (const title of ['Account Details', 'Personal Information']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
  })

  it('shows no Interests card, and leaves its fixture intact', () => {
    // ARCHIVED 2026-09-30, and the pairing is the point: the CARD is unwired
    // from ProfilePage while `profileFor(...).interests` still resolves, so a
    // restore is a call-site edit and never a data rebuild. Asserting the
    // fixture here is what stops a later cleanup from "tidying away" the data
    // and turning the archive row's promise into a lie.
    renderProfile()
    expect(screen.queryByRole('heading', { name: 'Interests' })).toBeNull()
    expect(profileFor('xcel', true).interests.length).toBeGreaterThan(0)
  })

  it('renders ONE column on a brand with no membership', () => {
    // The layout consequence of the Interests removal. Interests was the right
    // column's only unguarded child, so without the column guard XCEL rendered
    // an empty `flex: 1 1 340px` sibling — half the page reserved for nothing.
    renderProfile()
    const headings = screen
      .getAllByRole('heading')
      .map((h) => h.textContent)
      .filter((t): t is string => Boolean(t))
    expect(headings).toEqual(['Account Details', 'Personal Information'])
  })

  it('archives the three 2026-09-30 removals with real restore steps', () => {
    // The account-area archive pass: the Interests card plus the two account
    // SECTIONS that went with it. Each must name the file a restorer opens.
    const byId = Object.fromEntries(ARCHIVED_ITEMS.map((a) => [a.id, a]))
    for (const id of [
      'profile-interests-card',
      'account-licenses-section',
      'account-payment-methods-section',
    ]) {
      expect(byId[id], `missing archive row: ${id}`).toBeTruthy()
    }
    expect(byId['profile-interests-card'].restoreNote).toMatch(/ProfilePage/)
    expect(byId['profile-interests-card'].location).toMatch(/ProfileCards/)
    // Both section rows must point at the canonical list — that is the file
    // whose union drives every other registry.
    expect(byId['account-licenses-section'].restoreNote).toMatch(/accountSections/)
    expect(byId['account-payment-methods-section'].restoreNote).toMatch(/accountSections/)
  })

  it('leaves the archived sections out of the canonical list', () => {
    // The dropdown and the sub-nav both read `accountSectionsFor`, so this one
    // assertion covers both surfaces.
    const ids = accountSectionsFor('xcel', true).map((s) => s.id)
    expect(ids).not.toContain('licenses')
    expect(ids).not.toContain('payment-methods')
    expect(ids).toContain('profile')
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
