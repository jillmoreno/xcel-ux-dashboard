import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { AccountProvider, useAccount } from '@/context/AccountContext'
import { SwitchAccountPanel } from '@/components/account/SwitchAccountPanel'

function Harness() {
  const [open, setOpen] = useState(true)
  const { brand, membership } = useAccount()
  return (
    <>
      <div data-testid="active-brand">{brand}</div>
      <div data-testid="active-membership">{membership}</div>
      <button type="button" onClick={() => setOpen(true)}>open panel</button>
      <SwitchAccountPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <Harness />
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('SwitchAccountPanel (Switch Brand)', () => {
  it('renders one selectable card per brand (6 total)', () => {
    renderWithProviders()
    const dialog = screen.getByRole('dialog', { name: /switch brand/i })
    const cards = within(dialog).getAllByRole('menuitemradio')
    expect(cards).toHaveLength(6)
  })

  // `groupBySection` merges only CONSECUTIVE entries that share a `label`, so a
  // brand placed away from its label-mates renders a second, duplicate heading.
  // This guards the two shared labels: CRE + McKissock under "Real Estate /
  // Appraisal", and STC + XCEL under "Financial Services".
  it('renders one section heading per label — no duplicates from a misplaced brand', () => {
    renderWithProviders()
    const dialog = screen.getByRole('dialog', { name: /switch brand/i })
    const headings = within(dialog)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(headings).toEqual(['Real Estate / Appraisal', 'Healthcare', 'Financial Services'])
  })

  it('marks the active brand (CRE by default) as selected', () => {
    renderWithProviders()
    const dialog = screen.getByRole('dialog', { name: /switch brand/i })
    const cards = within(dialog).getAllByRole('menuitemradio')
    // PROFESSIONS order: CRE, McKissock, Elite, STC → CRE is the active brand.
    expect(cards[0]).toHaveAttribute('aria-checked', 'true')
    expect(cards[1]).toHaveAttribute('aria-checked', 'false')
  })

  it('closes on Escape key', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    expect(screen.getByRole('dialog', { name: /switch brand/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /switch brand/i })).not.toBeInTheDocument()
  })

})
