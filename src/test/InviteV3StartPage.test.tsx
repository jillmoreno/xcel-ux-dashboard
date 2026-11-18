import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('links the whole prototype from a note, on both tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/To access the prototype that captures all of these flows, click/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute(
      'href',
      'https://feat-invite-flow-v3--ux-design-xceldashboard.netlify.app/end-to-end-demo/email?demo=1&version=jill-atlas-main',
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Screens' }))
    expect(screen.getByText(/To access the prototype that captures all of these flows, click/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'here' })).toBeInTheDocument()
  })

  it('opens each Start in a new tab, as a secondary button that says so', () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    const starts = screen.getAllByRole('link', { name: /Atlas account \(opens in a new tab\)/ })
    expect(starts).toHaveLength(8)
    for (const link of starts) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveClass('cre-v3-start')
      expect(link.querySelector('svg')).not.toBeNull()
    }
    expect(screen.getByText(/Reach out to Afsana if you have any questions\./)).toBeInTheDocument()
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

/* The Screens tab (2026-11-18): pictures listed by a manifest the capture
   script writes. A tiny stand-in manifest is enough to pin the layout. */
describe('the stand-alone page’s Screens tab', () => {
  const manifest = {
    capturedAt: '2026-11-18',
    flows: [
      {
        id: 'direct-email',
        label: 'Direct Email',
        model: 'b2b',
        variants: [
          {
            label: 'No Atlas account',
            slug: 'no-atlas',
            shots: [
              { file: 'direct-email/no-atlas/01-email.png', title: 'Invitation email', state: 'Unread' },
              { file: 'direct-email/no-atlas/02-code.png', title: 'Verify your email', state: 'Wrong code' },
            ],
          },
        ],
      },
    ],
  }
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => manifest })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens on Flows, and Screens lists each flow’s pictures with their states', async () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('tab', { name: 'Flows' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: 'Direct Email' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Screens' }))
    expect(await screen.findByRole('button', { name: '2. Verify your email — Wrong code' })).toBeInTheDocument()
    expect(screen.getByText(/Captured 2026-11-18/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /No Atlas account/ })).not.toBeInTheDocument()
  })

  it('opens a picture full size, and steps through them', async () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3?tab=screens']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByRole('button', { name: '1. Invitation email — Unread' }))
    const dialog = screen.getByRole('dialog', { name: 'Invitation email — Unread' })
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', '/invite-v3-screens/direct-email/no-atlas/01-email.png')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog', { name: 'Verify your email — Wrong code' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
