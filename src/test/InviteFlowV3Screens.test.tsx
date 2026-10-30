import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InvitedProductDetailRoute, QrInviteRoute } from '@/pages/InviteFlowRoutes'

/**
 * INVITE FLOW V3, THE B2B OPENING SCREENS — 2026-10-30, from Afsana's
 * `xcel-b2b2c-email-flow.html`: the QR code, step 2 ("Select your state and
 * line of authority"), then the product page with "Showing the course for".
 */

function renderAt(path: string, ff: string) {
  /* `?ff=` is read from `window.location.search`, not the router — set both. */
  window.history.replaceState({}, '', `${path}?ff=${ff}`)
  return render(
    <MemoryRouter initialEntries={[`${path}?ff=${ff}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Routes>
            <Route path="/end-to-end-demo/qr" element={<QrInviteRoute />} />
            <Route path="/end-to-end-demo" element={<InvitedProductDetailRoute />} />
          </Routes>
          <Where />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function Where() {
  const { pathname, search } = useLocation()
  return <output data-testid="where">{pathname + search}</output>
}

const V3_B2B = 'invite-flow-version:v3,invite-v3-model:b2b'

describe('Invite Flow V3 — B2B opening screens', () => {
  it('draws the QR code alone on V3, and the phone card on V2', () => {
    const v3 = renderAt('/end-to-end-demo/qr', V3_B2B)
    expect(screen.getByRole('button', { name: /QR code for/ })).toBeInTheDocument()
    expect(screen.queryByText('Scan to start your licensing course')).not.toBeInTheDocument()
    v3.unmount()

    renderAt('/end-to-end-demo/qr', 'invite-flow-version:v2,invite-flow-journey:qr-social')
    expect(screen.getByText('Scan to start your licensing course')).toBeInTheDocument()
  })

  it('scanning opens step 2 on its own screen, not a modal', async () => {
    renderAt('/end-to-end-demo/qr', V3_B2B)
    await userEvent.click(screen.getByRole('button', { name: /Scan the code/ }))
    expect(screen.getByRole('heading', { name: 'Select your state and line of authority' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Get licensed with Sunrise Bank' })).toBeInTheDocument()
  })

  it('keeps Continue off until a real state and a line of authority are chosen', async () => {
    renderAt('/end-to-end-demo', V3_B2B)
    const go = screen.getByRole('button', { name: 'Continue' })
    expect(go).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Choose your state/), 'Flor')
    await userEvent.click(screen.getByRole('radio', { name: 'Life and Health' }))
    expect(go).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/Choose your state/), 'ida')
    expect(go).toBeEnabled()
  })

  it('Continue shows the chosen course, and Change can update it', async () => {
    renderAt('/end-to-end-demo', V3_B2B)
    await userEvent.type(screen.getByLabelText(/Choose your state/), 'florida')
    await userEvent.click(screen.getByRole('radio', { name: 'Life and Health' }))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByTestId('where').textContent).toContain('lstate=Florida')
    expect(screen.getByText('Showing the course for')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Change' }))
    const dialog = screen.getByRole('dialog', { name: 'Change your course' })
    expect(dialog).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Life' }))
    await userEvent.click(screen.getByRole('button', { name: 'Update course' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('where').textContent).toMatch(/loa=Life(&|$)/)
  })
})
