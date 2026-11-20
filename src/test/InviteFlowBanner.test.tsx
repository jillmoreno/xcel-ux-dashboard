import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InviteFlowBanner } from '@/components/e2e/InviteFlowBanner'

/* The light blue "which flow" banner over a stand-alone walk (2026-11-18). */
function renderAt(path: string, ff: string) {
  const url = `${path}${path.includes('?') ? '&' : '?'}ff=${ff}`
  window.history.replaceState({}, '', url)
  return render(
    <MemoryRouter initialEntries={[url]}>
      <FeatureFlagProvider>
        <InviteFlowBanner />
      </FeatureFlagProvider>
    </MemoryRouter>,
  )
}

const V3 = 'invite-flow-version:v3'

describe('the stand-alone walk’s flow banner', () => {
  it('names the model, the flow and the account', () => {
    renderAt('/end-to-end-demo/email?standalone=1', `${V3},invite-v3-model:b2b,invite-v3-flow-b2b:direct-email,invite-v3-email-account:no-atlas`)
    expect(screen.getByRole('note', { name: 'Flow' })).toHaveTextContent('B2B2C: Direct Email / No Atlas Account')
  })

  it('says Has Atlas Account on QR Code', () => {
    renderAt('/end-to-end-demo/qr?standalone=1', `${V3},invite-v3-model:b2b,invite-v3-flow-b2b:qr,invite-v3-email-account:atlas`)
    expect(screen.getByRole('note', { name: 'Flow' })).toHaveTextContent('B2B2C: QR Code / Has Atlas Account')
  })

  it('adds the cart on B2C, and always names the account', () => {
    const { unmount } = renderAt(
      '/end-to-end-demo/cart?standalone=1',
      `${V3},invite-v3-model:b2c,invite-v3-flow-b2c:xcel-signed-out,invite-v3-cart:mixed,invite-v3-email-account:no-atlas`,
    )
    expect(screen.getByRole('note', { name: 'Flow' })).toHaveTextContent(
      'B2C: Not signed into XCEL (OCD) / Mixed / No Atlas Account',
    )
    unmount()
    renderAt('/end-to-end-demo/cart?standalone=1', `${V3},invite-v3-model:b2c,invite-v3-flow-b2c:xcel-signed-in,invite-v3-cart:none,invite-v3-email-account:atlas`)
    expect(screen.getByRole('note', { name: 'Flow' })).toHaveTextContent(
      'B2C: Signed into XCEL (OCD) / None Targeted / Has Atlas Account',
    )
  })

  it('names Log In’s account, and no cart or Atlas line (2026-11-20)', () => {
    renderAt(
      '/end-to-end-demo/log-in/sign-in?standalone=1',
      `${V3},invite-v3-model:b2c,invite-v3-flow-b2c:xcel-log-in,invite-v3-log-in-account:ocd`,
    )
    const banner = screen.getByRole('note', { name: 'Flow' })
    expect(banner).toHaveTextContent('B2C: Log In / OCD Account')
    expect(banner).not.toHaveTextContent(/Targeted|Atlas/)
  })

  it('stays out of the full prototype and off every other page', () => {
    const { unmount } = renderAt('/end-to-end-demo/email', `${V3},invite-v3-model:b2b`)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    unmount()
    renderAt('/dashboard-rebrand?standalone=1', `${V3},invite-v3-model:b2b`)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
