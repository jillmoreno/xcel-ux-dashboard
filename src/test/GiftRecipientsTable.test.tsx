import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { GiftRecipientsPanel } from '@/components/account/purchases/GiftRecipientsPanel'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'

/**
 * Gift Recipients — Option B (the roster table), selected by the
 * `gift-recipients-layout` flag. The `?ff=` URL override pins the arm the same
 * way the dev-handoff tile's links do, so these tests exercise the real
 * flag-resolution path rather than poking the flag store.
 */
const PATH = '/dashboard-rebrand?section=gift-recipients'

function renderAt(path: string) {
  // The `?ff=` override is read from `window.location` (it's layered on flag
  // READS, not the router), so pin the arm there — same as CoursePurchaseSheet's
  // test does for the upsell flow. The router path still drives ?q=/?status=.
  window.history.replaceState({}, '', `${path}&ff=gift-recipients-layout:table`)
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

/** The first table row naming this recipient. (Marcus Bell and Priya
 *  Raghunathan each have TWO records — reminders are per order, not per person
 *  — so the single-row assertions below use recipients with exactly one.) */
function rowFor(name: string): HTMLElement {
  const row = screen.getAllByText(name)[0].closest('tr')
  if (!row) throw new Error(`no row for ${name}`)
  return row
}

describe('GiftRecipientsTable (Option B — roster)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  })

  it('renders a sortable table instead of the card list, and drops the Sort dropdown', () => {
    renderAt(PATH)
    expect(screen.getByRole('table')).toBeInTheDocument()
    // Cards are gone…
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    // …and so is the Sort select — column headers own sorting in this arm.
    expect(screen.queryByRole('combobox', { name: /sort recipients/i })).not.toBeInTheDocument()
    // Shared toolbar is unchanged, so the comparison isolates the list treatment.
    expect(screen.getByRole('searchbox', { name: /search gift recipients/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View All', selected: true })).toBeInTheDocument()
    expect(screen.getByText('Showing 12 Results')).toBeInTheDocument()
    for (const col of [
      'Recipient',
      'Order Date',
      'Package',
      'Claim Status',
      'Last Reminded',
      'Actions',
    ]) {
      expect(screen.getByRole('columnheader', { name: col })).toBeInTheDocument()
    }
    // Item count isn't a column of its own — it's a sub-line under the package
    // name, from the SAME helper the sheet's package card uses, so the roster
    // and the sheet can't disagree about the count.
    expect(screen.queryByRole('columnheader', { name: 'Items' })).not.toBeInTheDocument()
    const pkgCell = within(rowFor('Marcus Bell')).getByText('SIE Premier').closest('td')!
    expect(pkgCell).toHaveTextContent('5 items')
  })

  it('sorts by a column header, setting aria-sort and flipping direction', async () => {
    const user = userEvent.setup()
    renderAt(PATH)
    const header = screen.getByRole('columnheader', { name: 'Recipient' })
    expect(header).toHaveAttribute('aria-sort', 'none')

    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    const names = screen.getAllByRole('row').slice(1).map((r) => r.textContent ?? '')
    expect(names[0]).toMatch(/Alicia Fontaine/)

    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'descending')
  })

  it('has no bulk-reminder flow — no checkboxes, no top-right Send Reminder CTA', () => {
    renderAt(PATH)
    // ARCHIVED: selection mode + the bulk bar were pulled (see ARCHIVED_ITEMS
    // `gift-recipients-bulk-reminder`). Reminders are per-record only now.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Select the recipients to remind')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /show unclaimed recipients and choose/i }),
    ).not.toBeInTheDocument()
    // Download is the page's only remaining top-right CTA.
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
    // Clicking the ROW is the interaction — there's no per-row Details link,
    // and the name is plain text, not a control.
    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /view purchase details/i }),
    ).not.toBeInTheDocument()
    // Rows keep their native `row` role (table navigation survives) AND are
    // focusable, so the sheet is reachable without a mouse.
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(13) // header + 12 records
    expect(rows[1]).toHaveAttribute('tabindex', '0')
    // Claimed rows never offer a Remind action either.
    expect(
      within(rowFor('Alicia Fontaine')).queryByRole('button', { name: /remind/i }),
    ).not.toBeInTheDocument()
  })

  it('shows Last Reminded as a date for unclaimed rows and a dash for claimed ones', () => {
    renderAt(PATH)
    const cell = (name: string) => rowFor(name).children[4]
    // Unclaimed + already chased → the date, mm/dd/yyyy.
    expect(cell('Devon Okafor')).toHaveTextContent('08/13/2026')
    // Unclaimed + never chased → a dash, not a blank.
    expect(cell('Ben Whitfield')).toHaveTextContent('—')
    // Claimed → a dash regardless: nothing left to chase.
    expect(cell('Alicia Fontaine')).toHaveTextContent('—')
    // The date no longer sits inside the Claim Status cell.
    expect(rowFor('Devon Okafor').children[3]).not.toHaveTextContent('08/13/2026')
  })

  it('sorts by Last Reminded, keeping never-reminded rows last', async () => {
    const user = userEvent.setup()
    renderAt(PATH)
    const header = screen.getByRole('columnheader', { name: 'Last Reminded' })
    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    const dates = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) => r.children[4].textContent ?? '')
    // Oldest reminder first (longest since chased), dashes last.
    expect(dates[0]).toBe('07/02/2026')
    expect(dates[1]).toBe('08/13/2026')
    expect(dates.slice(2).every((d) => d === '—')).toBe(true)
  })

  it('renders the recipient email as a mailto link that does not open the sheet', async () => {
    const user = userEvent.setup()
    renderAt(`${PATH}&q=Devon`)
    const email = screen.getByRole('link', { name: 'dokafor@cavellcapital.com' })
    expect(email).toHaveAttribute('href', 'mailto:dokafor@cavellcapital.com')
    // The <wbr> break hint adds no characters — the address stays copyable.
    expect(email.textContent).toBe('dokafor@cavellcapital.com')
    // Mailing someone must not also open their detail sheet.
    await user.click(email)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sends to one recipient from the row action, naming them in the toast', async () => {
    const user = userEvent.setup()
    renderAt(`${PATH}&q=Ben`)
    await user.click(
      screen.getByRole('button', { name: /send reminder to ben whitfield/i }),
    )
    expect(screen.getByRole('status')).toHaveTextContent('bwhitfield@cavellcapital.com')
    // The label does NOT change after a send — one action, one label. The
    // Last Reminded column carries the fact, stamped with today's date.
    const row = rowFor('Ben Whitfield')
    expect(within(row).getByRole('button', { name: /send reminder to ben/i })).toHaveTextContent(
      'Send Reminder',
    )
    expect(row.children[4].textContent).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('opens the detail SHEET from a row click — the row never expands', async () => {
    const user = userEvent.setup()
    renderAt(`${PATH}&q=Alicia`)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(rowFor('Alicia Fontaine'))
    const sheet = screen.getByRole('dialog')
    expect(sheet).toHaveAccessibleName(/purchase for alicia fontaine/i)
    expect(within(sheet).getByRole('button', { name: /close purchase details/i })).toBeInTheDocument()
    // Name + mailto email live in the HEADER now, so the detail's Recipient
    // block is suppressed here (the card arm keeps it).
    expect(
      within(sheet).getByRole('link', { name: 'afontaine@cavellcapital.com' }),
    ).toHaveAttribute('href', 'mailto:afontaine@cavellcapital.com')
    expect(within(sheet).queryByText('Recipient:')).not.toBeInTheDocument()

    // Same content the cards show, scoped to the sheet.
    expect(within(sheet).getByText('Package contents:')).toBeInTheDocument()
    // The sheet's count and the row's sub-line are the same string.
    expect(within(sheet).getByText('3 items')).toBeInTheDocument()
    expect(
      within(rowFor('Alicia Fontaine')).getByText('Series 63 Essentials').closest('td'),
    ).toHaveTextContent('3 items')
    expect(
      within(sheet).getByText('Series 63 Final and Custom Exams-30th Edition'),
    ).toBeInTheDocument()
    expect(within(sheet).getByText('Cavell Capital')).toBeInTheDocument()
    // Claim status lives in the sheet HEADER pill, so the in-detail block is
    // suppressed here (the card arm, which has no header pill, keeps it).
    expect(within(sheet).getByText('Claimed')).toBeInTheDocument()
    expect(within(sheet).queryByText('Claim status:')).not.toBeInTheDocument()
    expect(within(sheet).queryByText('Claimed — not started')).not.toBeInTheDocument()
    // Claimed → no reminder action anywhere in the sheet.
    expect(within(sheet).queryByRole('button', { name: /reminder/i })).not.toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: /close purchase details/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('summarizes the claim story on a muted line under the sheet title', async () => {
    const user = userEvent.setup()
    renderAt(PATH)

    // Claimed → how far they've got + when they claimed.
    await user.click(rowFor('Priya Raghunathan'))
    expect(
      within(screen.getByRole('dialog')).getByText('Claimed and in progress · August 17, 2026'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /close purchase details/i }))

    // Unclaimed + already chased → when the reminder went out.
    await user.click(rowFor('Devon Okafor'))
    expect(
      within(screen.getByRole('dialog')).getByText('Reminder sent August 13, 2026'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /close purchase details/i }))

    // Unclaimed + never chased → says so, rather than leaving a blank.
    await user.click(rowFor('Ben Whitfield'))
    expect(within(screen.getByRole('dialog')).getByText('No reminder sent yet')).toBeInTheDocument()
  })

  it('opens the sheet from the keyboard — Enter on a focused row', async () => {
    const user = userEvent.setup()
    renderAt(`${PATH}&q=Ben`)
    const row = rowFor('Ben Whitfield')
    row.focus()
    expect(row).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/purchase for ben whitfield/i)
  })

  it('carries the reminder action in the sheet for an unclaimed record', async () => {
    const user = userEvent.setup()
    renderAt(`${PATH}&q=Ben`)
    await user.click(rowFor('Ben Whitfield'))
    const sheet = screen.getByRole('dialog')
    // Status comes from the header pill, not a Claim status block.
    expect(within(sheet).getByText('Unclaimed')).toBeInTheDocument()
    expect(within(sheet).queryByText('Claim status:')).not.toBeInTheDocument()
    // The CTA lives in the HEADER, beside the claim line — exactly one copy.
    const header = sheet.querySelector('header') as HTMLElement
    expect(within(header).getByRole('button', { name: /^send reminder$/i })).toBeInTheDocument()
    expect(within(sheet).getAllByRole('button', { name: /reminder/i })).toHaveLength(1)
    await user.click(within(sheet).getByRole('button', { name: /^send reminder$/i }))
    expect(screen.getByRole('status')).toHaveTextContent('bwhitfield@cavellcapital.com')
  })

})
