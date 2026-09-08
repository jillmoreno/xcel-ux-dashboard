import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { AccountProvider, PROFESSIONS, useAccount } from '@/context/AccountContext'
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
  it('renders one selectable card per brand', () => {
    renderWithProviders()
    const dialog = screen.getByRole('dialog', { name: /switch brand/i })
    const cards = within(dialog).getAllByRole('menuitemradio')
    // One, where the LMS had six. Asserted against PROFESSIONS rather than a
    // literal so widening `Brand` does not need this number edited by hand.
    expect(cards).toHaveLength(PROFESSIONS.length)
  })

  it('renders one section heading per label — no duplicates from a misplaced brand', () => {
    // `groupBySection` merges only CONSECUTIVE entries that share a `label`, so
    // a brand placed away from its label-mates renders a second, duplicate
    // heading. That guard mattered when two pairs shared a label (CRE +
    // McKissock under "Real Estate / Appraisal", STC + XCEL under "Financial
    // Services"). With one brand there is one heading — the assertion is kept
    // because it is the grouping that is being pinned, and it starts guarding
    // again the moment a second brand lands on XCEL's label.
    renderWithProviders()
    const dialog = screen.getByRole('dialog', { name: /switch brand/i })
    const headings = within(dialog)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(headings).toEqual(['Financial Services'])
    expect(new Set(headings).size).toBe(headings.length)
  })

  it('marks the active brand as selected', () => {
    renderWithProviders()
    const dialog = screen.getByRole('dialog', { name: /switch brand/i })
    const cards = within(dialog).getAllByRole('menuitemradio')
    // XCEL is the only brand and therefore always the active one.
    expect(cards[0]).toHaveAttribute('aria-checked', 'true')
  })

  it('closes on Escape key', async () => {
    const user = userEvent.setup()
    renderWithProviders()
    expect(screen.getByRole('dialog', { name: /switch brand/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /switch brand/i })).not.toBeInTheDocument()
  })

})
