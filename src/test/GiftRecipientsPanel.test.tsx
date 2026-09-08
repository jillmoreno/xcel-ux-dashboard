import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { GiftRecipientsPanel } from '@/components/account/purchases/GiftRecipientsPanel'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'

/**
 * Gift Recipients renders inside the Dashboard Rebrand shell
 * (`/dashboard-rebrand?section=gift-recipients`), which owns the left rail and
 * the section `<h1>`. These tests mount the PANEL — the part this feature owns
 * — with just the providers it reads, rather than booting the whole shell.
 */
function seedBrand(brand: string) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, tier: 'high' }))
}

function renderAt(path: string) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter initialEntries={[path]}>
          <GiftRecipientsPanel />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

/** The record card whose collapsed row names this recipient. */
function cardFor(name: string): HTMLElement {
  const row = screen.getAllByText(name)[0]
  const card = row.closest('article')
  if (!card) throw new Error(`no record card for ${name}`)
  return card
}

/**
 * The CARD arm is archived but still reachable (`gift-recipients-layout:cards`),
 * and it is the branch this panel owns — month grouping, the Sort `Select`, the
 * expand-in-place record cards. The flag now defaults to `table`, so the tests
 * covering that branch pin it explicitly rather than relying on the default.
 * (The shipped table arm is covered by GiftRecipientsTable.test.tsx.)
 */
function renderCards(path: string) {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'gift-recipients-layout': { variant: 'cards' } }),
  )
  return renderAt(path)
}

const PATH = '/dashboard-rebrand?section=gift-recipients'

describe('GiftRecipientsPanel (STC purchase-for-others)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    seedBrand('xcel')
  })

  it('renders the toolbar and month-grouped records', () => {
    renderCards(PATH)
    expect(screen.getByRole('searchbox', { name: /search gift recipients/i })).toBeInTheDocument()
    // Newest first → the August group leads, with its count.
    const headings = screen.getAllByRole('button', { expanded: true })
    expect(headings[0]).toHaveTextContent('August, 2026')
    expect(headings[0]).toHaveTextContent('(4)')
    expect(screen.getAllByText('Marcus Bell').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('article')).toHaveLength(12)
  })

  it('filters to unclaimed records via ?status=', () => {
    renderCards(`${PATH}&status=unclaimed`)
    // Status is the primary filter — segmented PillTabs, not a dropdown.
    expect(screen.getByRole('tab', { name: 'Unclaimed', selected: true })).toBeInTheDocument()
    expect(screen.getByText('Showing 5 Results')).toBeInTheDocument()
    // 5 unclaimed records, every one carrying the Unclaimed badge and none the
    // Claimed one. (Scoped to the cards — the tabs also carry both words.)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(5)
    for (const card of cards) {
      expect(within(card).getByText('Unclaimed')).toBeInTheDocument()
      expect(within(card).queryByText('Claimed')).not.toBeInTheDocument()
    }
  })

  it('searches by recipient email and shows the no-results state when nothing matches', async () => {
    const user = userEvent.setup()
    renderAt(PATH)
    const search = screen.getByRole('searchbox', { name: /search gift recipients/i })
    await user.type(search, 'praghunathan')
    expect(screen.getAllByText('Priya Raghunathan').length).toBeGreaterThan(0)
    expect(screen.queryByText('Marcus Bell')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'nobody-here')
    expect(screen.getByText(/no recipients match your filters/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
    expect(screen.getByText('Showing 0 Results')).toBeInTheDocument()
  })

  it('switches the status filter from the pill tabs', async () => {
    const user = userEvent.setup()
    renderCards(PATH)
    expect(screen.getByRole('tab', { name: 'View All', selected: true })).toBeInTheDocument()
    expect(screen.getByText('Showing 12 Results')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Claimed' }))
    expect(screen.getByRole('tab', { name: 'Claimed', selected: true })).toBeInTheDocument()
    expect(screen.getByText('Showing 7 Results')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(7)
  })

  it('drops the month grouping when sorting by recipient name', () => {
    renderCards(`${PATH}&sort=name-asc`)
    // No month headings — one flat A–Z list instead.
    expect(screen.queryByText(/august, 2026/i)).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /sort recipients/i })).toHaveValue('name-asc')
  })

  it('expands an unclaimed record and sends a reminder', async () => {
    const user = userEvent.setup()
    renderCards(`${PATH}&status=unclaimed&q=Devon`)
    const card = cardFor('Devon Okafor')
    await user.click(within(card).getByRole('button', { name: /view details/i }))

    expect(within(card).getByText('dokafor@cavellcapital.com')).toBeInTheDocument()
    // Order number + when it was placed share one muted line.
    expect(within(card).getByText(/Order STC-514877 · Ordered August 6, 2026/)).toBeInTheDocument()
    expect(within(card).getByText('Not yet claimed')).toBeInTheDocument()
    // Fixture already carries a reminder → the resend label, not the first send.
    expect(within(card).getByText(/reminder sent august 13, 2026/i)).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: /resend reminder/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/reminder sent/i)
    expect(screen.getByRole('status')).toHaveTextContent('dokafor@cavellcapital.com')
  })

  it('offers no reminder on a claimed record, and shows its claim detail + package contents', async () => {
    const user = userEvent.setup()
    renderCards(`${PATH}&status=claimed&q=Priya`)
    const card = cardFor('Priya Raghunathan')
    await user.click(within(card).getAllByRole('button', { name: /view details/i })[0])

    expect(within(card).getByText('Claimed and in progress')).toBeInTheDocument()
    expect(within(card).getByText('Series 7 Premier')).toBeInTheDocument()
    expect(
      within(card).getByText('Series 7 Final and Custom Exams-45th Edition'),
    ).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: /reminder/i })).not.toBeInTheDocument()
  })

  it('offers Download but no page-level Send Reminder (bulk flow archived)', () => {
    // Default arm (table). Rows carry their own "Send reminder to {name}"
    // buttons, so this matches the page-level CTA's exact name — the toolbar
    // CTA that used to start the archived bulk flow.
    renderAt(PATH)
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send Reminder' })).not.toBeInTheDocument()
  })

})
