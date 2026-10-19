import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InviteEmailPage } from '@/pages/InviteEmailPage'
import {
  E2E_EMAIL_ADMIN,
  E2E_EMAIL_OFFICE,
  E2E_EMAIL_PARTNER,
  E2E_LEARNER_EMAIL,
  E2E_LEARNER_FIRST,
  E2E_LEARNER_NAME,
} from '@/pages/endToEndDemo'

/**
 * THE INVITE EMAIL — the flow's new first screen (2026-10-19, Jillienne: "we
 * need to add a page to the first part of the Invite flow that shows the
 * email the user is starting from").
 *
 * ⚠ WHAT IS WORTH PINNING IS THE HAND-OFF, not the mail chrome. The rail,
 * the toolbar and the second message are a picture of an inbox and the
 * browser is where they are judged. What can break silently is the one
 * control that works: if View Invitation ever rebuilds the address instead
 * of carrying it, the walk drops out of `?journey=full` at its first step
 * and every page after it quietly becomes Eric's tile instead of Jillienne's
 * walk — with nothing failing.
 */
function Probe() {
  const { pathname, search } = useLocation()
  return <output data-testid="where">{pathname + search}</output>
}

function renderEmail(search = '?demo=1&journey=full&version=eric-atlas-e2e') {
  return render(
    <MemoryRouter initialEntries={[`/end-to-end-demo/email${search}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Routes>
            <Route path="/end-to-end-demo/email" element={<InviteEmailPage />} />
            <Route path="/end-to-end-demo" element={<Probe />} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('the invite email page', () => {
  it('hands off to the Invited Product Detail page', async () => {
    const user = userEvent.setup()
    renderEmail()
    await user.click(screen.getByRole('button', { name: /View invitation/ }))
    expect(screen.getByTestId('where').textContent).toContain('/end-to-end-demo')
  })

  it('carries `journey=full` across the step — the walk must survive its own first click', async () => {
    const user = userEvent.setup()
    renderEmail()
    await user.click(screen.getByRole('button', { name: /View invitation/ }))
    const where = screen.getByTestId('where').textContent ?? ''
    expect(where, where).toContain('journey=full')
    expect(where, where).toContain('version=eric-atlas-e2e')
  })

  it('carries whatever else is pinned, rather than a fixed address', async () => {
    // A `?ff=` pin on the walk has to reach the page after this one too.
    const user = userEvent.setup()
    renderEmail('?demo=1&journey=full&ff=atlas-readiness-section:on')
    await user.click(screen.getByRole('button', { name: /View invitation/ }))
    expect(screen.getByTestId('where').textContent).toContain('ff=atlas-readiness-section%3Aon')
  })

  it('names one learner, from the shared constants', () => {
    /* The whole reason those constants exist: this page, the confirmation
       page and the dashboard header each used to carry their own literal,
       and the flow mailed one person then signed in another. */
    renderEmail()
    expect(screen.getByText(`Hi ${E2E_LEARNER_FIRST},`)).toBeTruthy()
    expect(screen.getByText(new RegExp(E2E_LEARNER_NAME))).toBeTruthy()
    // The address is the one the rest of the flow confirms to.
    expect(E2E_LEARNER_EMAIL).toBe('jordan.navarro@gmail.com')
  })

  it('tells the partner’s story from constants, not literals', () => {
    /* ⚠ THE EMAIL'S PARTNER IS NOT THE FLOW'S — Sunrise Bank here, Pristine
       Solutions on the page this opens. That is a known discrepancy (see
       `E2E_EMAIL_PARTNER`), and these constants are what make settling it a
       one-line change rather than a search through copy. */
    renderEmail()
    for (const text of [E2E_EMAIL_PARTNER, E2E_EMAIL_OFFICE, E2E_EMAIL_ADMIN]) {
      expect(screen.getAllByText(new RegExp(text)).length, text).toBeGreaterThan(0)
    }
  })

  it('derives the saving rather than stating a third price', () => {
    // $199 − $65. A number typed by hand here is one that can stop adding up.
    renderEmail()
    expect(screen.getByText(/saves you \$134/)).toBeTruthy()
  })

  it('leaves the rest of the client inert — one control does something', () => {
    /* Every other button draws and does nothing, on purpose. They are still
       BUTTONS so the page can be tabbed through; what this pins is that none
       of them is a second way out, which is how a reviewer ends up somewhere
       the walk did not send them. */
    renderEmail()
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(8)
    expect(buttons.filter((b) => /View invitation/.test(b.textContent ?? ''))).toHaveLength(1)
  })
})
