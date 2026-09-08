import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, it, expect } from 'vitest'
import { CertificatesPage } from '@/pages/CertificatesPage'
import { AccountProvider } from '@/context/AccountContext'

// The certificates are keyed per brand (`certificatesFor` in
// certificateFixtures.ts), so this page's content depends on the active
// account. Pin McKissock — the appraisal set these assertions name.
beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

function renderAt(path: string) {
  return render(
    <AccountProvider>
      <MemoryRouter initialEntries={[path]}>
        <CertificatesPage />
      </MemoryRouter>
    </AccountProvider>,
  )
}

describe('CertificatesPage', () => {
  it('renders the heading, status tabs, filter rail, and completed cards by default', () => {
    renderAt('/my-learning/certificates')
    expect(screen.getByRole('heading', { level: 1, name: /^certificates$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Action Required' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Certificates Issued' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'External Certificates' })).toBeInTheDocument()
    // Default = Certificates Issued → a completed certificate card renders.
    expect(screen.getByText('Life & Health Pre-Licensing — Completion')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument()
  })

  it('shows the warning banner + pending pill on the Action Required tab', async () => {
    const user = userEvent.setup()
    renderAt('/my-learning/certificates')
    await user.click(screen.getByRole('tab', { name: 'Action Required' }))
    expect(screen.getByText(/require an action/i)).toBeInTheDocument()
    // `getAllBy`, not `getBy` — McKissock has two survey-gated certificates
    // (the second was added so the brand's My Courses page could demo the
    // card's Certificate Pending marker). The count is not what this test is
    // about; that at least one renders is.
    expect(screen.getAllByText(/Certificate Pending.*Survey Required/i).length).toBeGreaterThan(0)
  })

  it('opens the Certificate Details slide-over for an action-required cert and closes on Esc', async () => {
    const user = userEvent.setup()
    renderAt('/my-learning/certificates?status=action-required')
    await user.click(
      screen.getByRole('button', {
        name: /view details for Property & Casualty Pre-Licensing/i,
      }),
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Action Required')).toBeInTheDocument()
    expect(within(dialog).getByText(/what would you like to do/i)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /go to course/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the External Certificates tab with the add CTA, note, and external cards', async () => {
    const user = userEvent.setup()
    renderAt('/my-learning/certificates')
    await user.click(screen.getByRole('tab', { name: 'External Certificates' }))
    expect(screen.getByRole('button', { name: /add external certificate/i })).toBeInTheDocument()
    expect(screen.getByText(/not responsible for reporting external certificates/i)).toBeInTheDocument()
    expect(
      screen.getAllByText(/Certificate Issued By LIMRA/i).length,
    ).toBeGreaterThan(0)
  })

  it('hydrates the active tab from ?status=', () => {
    renderAt('/my-learning/certificates?status=external')
    expect(screen.getByRole('button', { name: /add external certificate/i })).toBeInTheDocument()
  })
})
