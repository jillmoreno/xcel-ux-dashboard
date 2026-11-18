import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { InviteV3StartPage } from '@/pages/InviteV3StartPage'
import { INVITE_FLOWS_V3 } from '@/data/inviteFlowsV3'

/* `/invite-v3` — the V3 invite flow on its own, for a Jira ticket
   (2026-11-17). Every flow has a row, and every Start keeps the walk to the
   flow: no chrome, and the stand-alone ending. */
describe('the stand-alone invite flow page', () => {
  it('lists every V3 flow with a Start that strips the chrome', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    for (const flow of INVITE_FLOWS_V3) {
      const row = screen.getByRole('heading', { name: flow.label }).closest('article')!
      const links = within(row).getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      for (const link of links) {
        const url = new URL(link.getAttribute('href')!, 'http://x')
        expect(url.searchParams.get('chrome')).toBe('off')
        expect(url.searchParams.get('standalone')).toBe('1')
        expect(url.searchParams.get('ff')).toContain(`:${flow.id}`)
      }
    }
  })

  it('offers Products on the B2B2C cards, on Standard, and carries the pick', async () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    for (const name of ['Direct Email', 'QR Code']) {
      const row = screen.getByRole('heading', { name }).closest('article')!
      const select = within(row).getByLabelText('Products')
      expect(select).toHaveValue('standard')
      expect(within(row).getAllByRole('link')[0].getAttribute('href')).toContain('pdp-products%3Astandard')
      await userEvent.selectOptions(select, 'california')
      for (const link of within(row).getAllByRole('link')) {
        expect(link.getAttribute('href')).toContain('pdp-products%3Acalifornia')
      }
    }
    const b2c = screen.getByRole('heading', { name: 'Signed into XCEL (OCD)' }).closest('article')!
    expect(within(b2c).queryByLabelText('Products')).not.toBeInTheDocument()
  })

  it('gives each card its one-line subtext', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('User receives an email invitation from an XCEL partner.')).toBeInTheDocument()
    expect(screen.getByText('User scans an XCEL partner’s QR code.')).toBeInTheDocument()
    expect(screen.getByText('User is not signed into XCEL and wants to make a purchase.')).toBeInTheDocument()
    expect(screen.getByText('User is signed into XCEL and wants to make a purchase.')).toBeInTheDocument()
  })

  it('lists Not signed in to XCEL before Signed in', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    const b2c = screen.getByRole('region', { name: 'Public site (B2C)' })
    expect(within(b2c).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Not signed into XCEL (OCD)',
      'Signed into XCEL (OCD)',
    ])
  })

  it('fills the cart for the flows that start there', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    const row = screen.getByRole('heading', { name: 'Not signed into XCEL (OCD)' }).closest('article')!
    const url = new URL(within(row).getAllByRole('link')[0].getAttribute('href')!, 'http://x')
    expect(url.pathname).toBe('/end-to-end-demo/cart')
    expect(url.searchParams.get('pkg')).toBe('premier')
  })
})
